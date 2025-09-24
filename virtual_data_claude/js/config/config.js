/**
 * 애플리케이션 설정 파일
 * 실제 사용 시 config.local.js를 생성하여 개인 설정을 오버라이드하세요
 */

export class Config {
    static async load() {
        // 기본 설정
        const defaultConfig = {
            // Google Apps Script 설정
            appsScriptUrl: 'https://script.google.com/macros/s/AKfycbwb0qvHN2PO7_-T_Bn_laY66NVTc0_Oe4yyuBDJHHMe_fiqN0UeanCGKNno4XnMW5Sg/exec',
            
            // 애플리케이션 설정
            appVersion: '35',
            appName: '포커 핸드 로거',
            
            // 저장 설정
            autoSaveEnabled: true,
            autoSaveInterval: 2000, // ms
            maxHistorySize: 50,
            
            // UI 설정
            defaultTimezone: 'Asia/Seoul',
            dateFormat: 'YYYY-MM-DD HH:mm:ss',
            numberFormat: 'en-US',
            
            // 디버그 설정
            debug: false,
            logLevel: 'info', // 'debug', 'info', 'warning', 'error'
            
            // 기능 플래그
            features: {
                autoSave: true,
                soundEffects: false,
                animations: true,
                keyboardShortcuts: true,
                darkMode: true,
                pwa: false
            },
            
            // 제한 설정
            limits: {
                maxPlayers: 10,
                maxHandNumber: 999999,
                maxChipAmount: 999999999,
                maxActionHistory: 1000
            },
            
            // 타임아웃 설정
            timeouts: {
                apiRequest: 30000, // ms
                autoSave: 2000,
                toastDuration: 3000,
                debounceDelay: 300
            },
            
            // API 엔드포인트
            endpoints: {
                getInitialData: '?action=getInitialData',
                sendData: '',
                backup: '?action=backup'
            },
            
            // 스토리지 키
            storageKeys: {
                appState: 'pokerHandLogger_state',
                config: 'pokerHandLogger_config',
                history: 'pokerHandLogger_history',
                preferences: 'pokerHandLogger_preferences'
            },
            
            // 테마 설정
            theme: {
                primaryColor: '#FBBF24',
                secondaryColor: '#60A5FA',
                dangerColor: '#EF4444',
                successColor: '#10B981',
                warningColor: '#F59E0B',
                darkBackground: '#1F2937',
                lightBackground: '#F9FAFB'
            },
            
            // 카드 설정
            cards: {
                suits: {
                    s: { symbol: '♠', color: 'black', name: 'spades' },
                    h: { symbol: '♥', color: 'red', name: 'hearts' },
                    d: { symbol: '♦', color: 'red', name: 'diamonds' },
                    c: { symbol: '♣', color: 'black', name: 'clubs' }
                },
                ranks: ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
            },
            
            // 액션 타입
            actions: {
                types: ['Folds', 'Checks', 'Calls', 'Bets', 'Raises', 'All In'],
                streets: ['preflop', 'flop', 'turn', 'river']
            },
            
            // 검증 규칙
            validation: {
                minPlayers: 2,
                maxPlayers: 10,
                minBlind: 1,
                maxBlind: 999999,
                handNumberPattern: /^\d+$/,
                chipAmountPattern: /^\d+$/
            },
            
            // 기본값
            defaults: {
                smallBlind: '50',
                bigBlind: '100',
                startingChips: '10000',
                timezone: 'Asia/Seoul'
            }
        };
        
        // 로컬 설정 오버라이드 시도
        let localConfig = {};
        try {
            // config.local.js가 있으면 로드
            const module = await import('./config.local.js').catch(() => null);
            if (module && module.localConfig) {
                localConfig = module.localConfig;
            }
        } catch (error) {
            console.log('No local config found, using defaults');
        }
        
        // 저장된 설정 로드
        let savedConfig = {};
        try {
            const saved = localStorage.getItem('pokerHandLogger_config');
            if (saved) {
                savedConfig = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load saved config:', error);
        }
        
        // 설정 병합 (우선순위: localConfig > savedConfig > defaultConfig)
        const finalConfig = {
            ...defaultConfig,
            ...savedConfig,
            ...localConfig
        };
        
        // URL 파라미터로 Apps Script URL 오버라이드
        const urlParams = new URLSearchParams(window.location.search);
        const urlAppsScript = urlParams.get('appsScriptUrl');
        if (urlAppsScript) {
            finalConfig.appsScriptUrl = urlAppsScript;
        }
        
        // 설정 검증
        this.validate(finalConfig);
        
        return finalConfig;
    }
    
    /**
     * 설정 검증
     */
    static validate(config) {
        // 필수 설정 확인
        if (!config.appsScriptUrl && !config.debug) {
            console.warn('Apps Script URL이 설정되지 않았습니다. 설정에서 URL을 입력해주세요.');
        }
        
        // 제한값 검증
        if (config.limits.maxPlayers < 2) {
            throw new Error('최대 플레이어 수는 2명 이상이어야 합니다.');
        }
        
        if (config.timeouts.apiRequest < 1000) {
            console.warn('API 타임아웃이 너무 짧습니다. 최소 1초 이상을 권장합니다.');
        }
    }
    
    /**
     * 설정 저장
     */
    static async save(config) {
        try {
            localStorage.setItem('pokerHandLogger_config', JSON.stringify(config));
            return true;
        } catch (error) {
            console.error('Failed to save config:', error);
            return false;
        }
    }
    
    /**
     * 설정 초기화
     */
    static reset() {
        localStorage.removeItem('pokerHandLogger_config');
        window.location.reload();
    }
}