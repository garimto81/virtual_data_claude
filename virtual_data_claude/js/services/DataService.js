/**
 * DataService - 외부 데이터 통신 서비스
 * Google Apps Script와의 통신 및 데이터 처리
 */

export class DataService {
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.cache = new Map();
        this.cacheTimeout = 60000; // 1분
        this.requestQueue = [];
        this.isProcessing = false;
    }

    /**
     * 초기 데이터 가져오기
     */
    async getInitialData() {
        const cacheKey = 'initialData';
        
        // 캐시 확인
        if (this.isCacheValid(cacheKey)) {
            console.log('Using cached initial data');
            return this.cache.get(cacheKey).data;
        }

        try {
            this.eventBus.emit('data:loading', { type: 'initialData' });
            
            // CORS 문제 회피를 위한 전략 선택
            let data;
            
            // 1. 일반 fetch 시도
            try {
                data = await this.fetchWithRetry(
                    `${this.config.appsScriptUrl}?action=getLatest&limit=10`,
                    { method: 'GET', mode: 'cors' }
                );
            } catch (fetchError) {
                console.warn('Standard fetch failed, trying JSONP...', fetchError);
                
                // 2. JSONP 폴백
                data = await this.fetchViaJSONP('getLatest', { limit: 10 });
            }

            // 데이터 검증
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data format received');
            }

            // 캐시 저장
            this.setCache(cacheKey, data);
            
            this.eventBus.emit('data:loaded', { type: 'initialData', data });
            
            return data;
            
        } catch (error) {
            this.eventBus.emit('data:error', { type: 'initialData', error });
            throw new Error(`Failed to load initial data: ${error.message}`);
        }
    }

    /**
     * 데이터를 Google Sheets로 전송
     */
    async sendToSheet(handData) {
        try {
            this.eventBus.emit('data:sending', { type: 'handData' });

            // GFX 형식으로 변환
            const gfxData = this.convertToGFXFormat(handData);
            
            // 데이터 검증
            this.validateGFXData(gfxData);

            // POST 요청 준비
            const payload = {
                rows: gfxData
            };

            // 전송 시도
            let result;
            
            try {
                // 일반 POST 시도
                result = await this.fetchWithRetry(
                    this.config.appsScriptUrl,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'text/plain;charset=utf-8'
                        },
                        body: JSON.stringify(payload),
                        mode: 'no-cors' // CORS 회피
                    }
                );
                
                // no-cors 모드에서는 응답을 읽을 수 없으므로 성공 가정
                if (!result) {
                    result = { status: 'success', message: 'Data sent (no-cors mode)' };
                }
                
            } catch (error) {
                console.error('POST failed, data might still be sent:', error);
                // no-cors 모드에서는 실제 전송 여부를 알 수 없음
                result = { status: 'unknown', message: 'Request sent but status unknown' };
            }

            this.eventBus.emit('data:sent', { type: 'handData', result });
            
            return result;
            
        } catch (error) {
            this.eventBus.emit('data:error', { type: 'sendData', error });
            throw new Error(`Failed to send data: ${error.message}`);
        }
    }

    /**
     * GFX 형식으로 변환
     */
    convertToGFXFormat(handData) {
        const rows = [];
        let rowCounter = 1;

        // 헬퍼 함수: 행 추가
        const addRow = (data) => {
            const paddedData = [...data];
            while (paddedData.length < 16) {
                paddedData.push('');
            }
            rows.push([rowCounter, ...paddedData]);
            rowCounter++;
        };

        // 게임 정보
        addRow(['GAME', 'PokerGFX 3.111', 'FEATURE_TABLE']);
        addRow(['PAYOUTS']);

        // 핸드 정보
        const handStartTime = new Date();
        const handLine = [
            'HAND',
            handData.currentHandNumber || '1',
            Math.floor(handStartTime.getTime() / 1000),
            'HOLDEM',
            handData.hasBBAnte ? 'BB_ANTE' : 'NO_ANTE',
            this.unformatNumber(handData.bigBlind) || 0,
            0, // Ante
            this.unformatNumber(handData.smallBlind) || 0,
            this.unformatNumber(handData.bigBlind) || 0,
            0,
            1, 2, 3, // Dealer, SB, BB positions
            0, 0, 1
        ];
        addRow(handLine);

        // 플레이어 정보
        const totalPot = this.calculateTotalPot(handData);
        handData.playersInHand.forEach((player, index) => {
            let finalChips = parseInt(this.unformatNumber(player.chips) || 0, 10);
            if (player.role === 'winner') {
                finalChips += totalPot;
            }
            
            const playerLine = [
                'PLAYER',
                player.name,
                index + 1, // Seat number
                0,
                this.unformatNumber(player.initialChips) || 0,
                finalChips,
                player.hand.length > 0 ? player.hand.join(' ') : ''
            ];
            addRow(playerLine);
        });

        // 액션 이벤트
        let currentTime = new Date(handStartTime.getTime());
        
        // 액션 추가 함수
        const addActionEvent = (action, seatNumber) => {
            const delay = 5000 + Math.random() * 10000;
            currentTime.setTime(currentTime.getTime() + delay);
            
            let actionType = action.action.toUpperCase().replace(/S$/, '');
            if (actionType === 'RAISE') actionType = 'RAISE TO';
            
            const eventLine = [
                'EVENT',
                actionType,
                seatNumber,
                action.amount ? this.unformatNumber(action.amount) : '',
                this.formatTimeCode(currentTime)
            ];
            addRow(eventLine);
        };

        // 보드 이벤트 추가 함수
        const addBoardEvents = (cards) => {
            const delay = 2000 + Math.random() * 3000;
            currentTime.setTime(currentTime.getTime() + delay);
            
            cards.forEach(card => {
                addRow([
                    'EVENT',
                    'BOARD',
                    1,
                    card,
                    this.formatTimeCode(currentTime)
                ]);
            });
        };

        // 스트리트별 액션 처리
        const streets = ['preflop', 'flop', 'turn', 'river'];
        streets.forEach((street, streetIndex) => {
            // 보드 카드 먼저
            if (street === 'flop' && handData.board.length >= 3) {
                addBoardEvents(handData.board.slice(0, 3));
            } else if (street === 'turn' && handData.board.length >= 4) {
                addBoardEvents([handData.board[3]]);
            } else if (street === 'river' && handData.board.length >= 5) {
                addBoardEvents([handData.board[4]]);
            }
            
            // 액션 처리
            const actions = handData.actions[street] || [];
            actions.forEach(action => {
                const player = handData.playersInHand.find(p => p.name === action.player);
                if (player) {
                    const seatNumber = handData.playersInHand.indexOf(player) + 1;
                    addActionEvent(action, seatNumber);
                }
            });
        });

        // 마지막 빈 행
        rows.push([rowCounter]);

        return rows;
    }

    /**
     * 재시도 로직이 포함된 fetch
     */
    async fetchWithRetry(url, options = {}, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const timeout = this.config.timeouts?.apiRequest || 30000;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                // no-cors 모드에서는 response를 읽을 수 없음
                if (options.mode === 'no-cors') {
                    return null;
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                return data;
                
            } catch (error) {
                console.error(`Attempt ${i + 1} failed:`, error);
                
                if (i === retries - 1) {
                    throw error;
                }
                
                // 지수 백오프
                const delay = Math.min(1000 * Math.pow(2, i), 10000);
                await this.sleep(delay);
            }
        }
    }

    /**
     * JSONP를 통한 데이터 가져오기
     */
    fetchViaJSONP(action, params = {}) {
        return new Promise((resolve, reject) => {
            const callbackName = `jsonpCallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const script = document.createElement('script');
            let timeoutId;

            // 전역 콜백 함수 등록
            window[callbackName] = (data) => {
                clearTimeout(timeoutId);
                delete window[callbackName];
                document.body.removeChild(script);
                resolve(data);
            };

            // 타임아웃 설정
            timeoutId = setTimeout(() => {
                delete window[callbackName];
                document.body.removeChild(script);
                reject(new Error('JSONP request timeout'));
            }, this.config.timeouts?.apiRequest || 30000);

            // 스크립트 에러 핸들링
            script.onerror = () => {
                clearTimeout(timeoutId);
                delete window[callbackName];
                document.body.removeChild(script);
                reject(new Error('JSONP script loading failed'));
            };

            // URL 구성
            const queryParams = new URLSearchParams({
                action,
                callback: callbackName,
                ...params
            });

            script.src = `${this.config.appsScriptUrl}?${queryParams}`;
            document.body.appendChild(script);
        });
    }

    /**
     * 백업 데이터 저장
     */
    async saveBackup(data) {
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                version: this.config.appVersion,
                data: data
            };

            // IndexedDB에 저장 시도
            if ('indexedDB' in window) {
                await this.saveToIndexedDB('backups', backup);
            }

            // 로컬 스토리지 백업
            const backups = JSON.parse(localStorage.getItem('pokerHandLogger_backups') || '[]');
            backups.unshift(backup);
            
            // 최대 10개 백업 유지
            if (backups.length > 10) {
                backups.pop();
            }
            
            localStorage.setItem('pokerHandLogger_backups', JSON.stringify(backups));

            this.eventBus.emit('backup:saved', backup);
            return true;
            
        } catch (error) {
            console.error('Backup failed:', error);
            return false;
        }
    }

    /**
     * 백업 복원
     */
    async restoreBackup(timestamp) {
        try {
            // IndexedDB에서 찾기
            const backup = await this.getFromIndexedDB('backups', timestamp);
            
            if (backup) {
                this.eventBus.emit('backup:restored', backup);
                return backup.data;
            }

            // 로컬 스토리지에서 찾기
            const backups = JSON.parse(localStorage.getItem('pokerHandLogger_backups') || '[]');
            const found = backups.find(b => b.timestamp === timestamp);
            
            if (found) {
                this.eventBus.emit('backup:restored', found);
                return found.data;
            }

            throw new Error('Backup not found');
            
        } catch (error) {
            console.error('Restore failed:', error);
            throw error;
        }
    }

    /**
     * 데이터 내보내기
     */
    exportData(data, format = 'json') {
        try {
            let content, mimeType, filename;

            switch (format) {
                case 'json':
                    content = JSON.stringify(data, null, 2);
                    mimeType = 'application/json';
                    filename = `poker_hand_log_${Date.now()}.json`;
                    break;
                    
                case 'csv':
                    content = this.convertToCSV(data);
                    mimeType = 'text/csv';
                    filename = `poker_hand_log_${Date.now()}.csv`;
                    break;
                    
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }

            // Blob 생성 및 다운로드
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.eventBus.emit('data:exported', { format, filename });
            return true;
            
        } catch (error) {
            console.error('Export failed:', error);
            return false;
        }
    }

    /**
     * 데이터 가져오기
     */
    async importData(file) {
        try {
            const text = await file.text();
            let data;

            if (file.type === 'application/json') {
                data = JSON.parse(text);
            } else if (file.type === 'text/csv') {
                data = this.parseCSV(text);
            } else {
                throw new Error('Unsupported file type');
            }

            // 데이터 검증
            if (!this.validateImportData(data)) {
                throw new Error('Invalid data format');
            }

            this.eventBus.emit('data:imported', { filename: file.name, data });
            return data;
            
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }

    /**
     * 캐시 관련 메서드
     */
    isCacheValid(key) {
        const cached = this.cache.get(key);
        if (!cached) return false;
        
        const age = Date.now() - cached.timestamp;
        return age < this.cacheTimeout;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    /**
     * 유틸리티 메서드
     */
    calculateTotalPot(handData) {
        let pot = 0;
        
        pot += parseInt(this.unformatNumber(handData.smallBlind) || 0, 10);
        pot += parseInt(this.unformatNumber(handData.bigBlind) || 0, 10);
        
        if (handData.hasBBAnte) {
            pot += parseInt(this.unformatNumber(handData.bigBlind) || 0, 10) * handData.playersInHand.length;
        }
        
        Object.values(handData.actions).forEach(streetActions => {
            streetActions.forEach(action => {
                if (action.amount) {
                    pot += parseInt(this.unformatNumber(action.amount), 10);
                }
            });
        });
        
        return pot;
    }

    unformatNumber(value) {
        if (!value) return '0';
        return value.toString().replace(/,/g, '');
    }

    formatTimeCode(date) {
        const pad = (num) => num.toString().padStart(2, '0');
        return `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    }

    validateGFXData(data) {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Invalid GFX data format');
        }
        
        // 추가 검증 로직
        return true;
    }

    validateImportData(data) {
        // 필수 필드 확인
        if (!data.playersInHand || !Array.isArray(data.playersInHand)) {
            return false;
        }
        
        // 추가 검증 로직
        return true;
    }

    convertToCSV(data) {
        // CSV 변환 로직
        const rows = [];
        // ... 구현
        return rows.join('\n');
    }

    parseCSV(text) {
        // CSV 파싱 로직
        const lines = text.split('\n');
        // ... 구현
        return {};
    }

    async saveToIndexedDB(store, data) {
        // IndexedDB 저장 로직
        // ... 구현
    }

    async getFromIndexedDB(store, key) {
        // IndexedDB 조회 로직
        // ... 구현
        return null;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}