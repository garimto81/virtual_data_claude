/**
 * StateManager - 중앙 상태 관리 모듈
 * 애플리케이션의 모든 상태를 관리하고 변경사항을 추적
 */

export class StateManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.state = this.getInitialState();
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        this.subscribers = new Map();
    }

    /**
     * 초기 상태 정의
     */
    getInitialState() {
        return {
            // 테이블 및 플레이어 데이터
            selectedTable: null,
            playerDataByTable: {},
            allTables: [],
            allHandNumbers: [],
            
            // 현재 핸드 정보
            currentHandNumber: '',
            smallBlind: '',
            bigBlind: '',
            hasBBAnte: false,
            
            // 게임 진행 상태
            playersInHand: [],
            board: [],
            currentStreet: 'preflop',
            
            // 액션 기록
            actions: {
                preflop: [],
                flop: [],
                turn: [],
                river: []
            },
            
            // UI 상태
            selectedTimezone: 'Asia/Seoul',
            isLoading: false,
            hasUnsavedChanges: false,
            
            // 설정
            autoSaveEnabled: true,
            soundEnabled: false,
            darkMode: true
        };
    }

    /**
     * 전체 상태 반환
     */
    get() {
        return this.deepClone(this.state);
    }

    /**
     * 특정 키의 값 반환
     */
    getValue(key) {
        return this.getNestedValue(this.state, key);
    }

    /**
     * 상태 업데이트
     */
    update(key, value) {
        const oldValue = this.getNestedValue(this.state, key);
        
        if (this.isEqual(oldValue, value)) {
            return; // 변경사항 없음
        }

        // 히스토리에 저장
        this.saveToHistory();
        
        // 상태 업데이트
        this.setNestedValue(this.state, key, value);
        this.state.hasUnsavedChanges = true;
        
        // 이벤트 발생
        this.eventBus.emit('state:changed', {
            key,
            oldValue,
            newValue: value
        });
        
        // 구독자에게 알림
        this.notifySubscribers(key, value);
    }

    /**
     * 여러 값을 한번에 업데이트
     */
    updateMultiple(updates) {
        this.saveToHistory();
        
        Object.entries(updates).forEach(([key, value]) => {
            this.setNestedValue(this.state, key, value);
        });
        
        this.state.hasUnsavedChanges = true;
        
        this.eventBus.emit('state:changed:multiple', updates);
    }

    /**
     * 플레이어 추가/제거
     */
    togglePlayer(playerName) {
        const players = [...this.state.playersInHand];
        const index = players.findIndex(p => p.name === playerName);
        
        if (index > -1) {
            players.splice(index, 1);
        } else {
            const tableData = this.state.playerDataByTable[this.state.selectedTable] || [];
            const playerData = tableData.find(p => p.name === playerName);
            
            if (playerData) {
                players.push({
                    name: playerName,
                    chips: playerData.chips || '0',
                    initialChips: playerData.chips || '0',
                    hand: [],
                    role: null
                });
            }
        }
        
        this.update('playersInHand', players);
    }

    /**
     * 플레이어 역할 설정 (winner/loser)
     */
    setPlayerRole(playerName, role) {
        const players = [...this.state.playersInHand];
        
        // 기존 같은 역할 제거
        players.forEach(p => {
            if (p.role === role) p.role = null;
        });
        
        // 새 역할 설정
        const player = players.find(p => p.name === playerName);
        if (player) {
            player.role = role;
        }
        
        this.update('playersInHand', players);
    }

    /**
     * 플레이어 핸드 설정
     */
    setPlayerHand(playerName, cards) {
        const players = [...this.state.playersInHand];
        const player = players.find(p => p.name === playerName);
        
        if (player) {
            player.hand = cards;
            this.update('playersInHand', players);
        }
    }

    /**
     * 보드 카드 설정
     */
    setBoard(cards, startIndex = 0) {
        const board = [...this.state.board];
        cards.forEach((card, i) => {
            board[startIndex + i] = card;
        });
        this.update('board', board);
    }

    /**
     * 액션 추가
     */
    addAction(street, action) {
        const actions = { ...this.state.actions };
        if (!actions[street]) actions[street] = [];
        
        actions[street].push({
            ...action,
            timestamp: new Date().toISOString()
        });
        
        this.update('actions', actions);
    }

    /**
     * 마지막 액션 취소
     */
    removeLastAction(street) {
        const actions = { ...this.state.actions };
        if (actions[street] && actions[street].length > 0) {
            const removedAction = actions[street].pop();
            this.update('actions', actions);
            return removedAction;
        }
        return null;
    }

    /**
     * 팟 크기 계산
     */
    calculatePot() {
        let pot = 0;
        
        // 블라인드
        pot += parseInt(this.state.smallBlind || 0);
        pot += parseInt(this.state.bigBlind || 0);
        
        // BB 앤티
        if (this.state.hasBBAnte) {
            pot += parseInt(this.state.bigBlind || 0) * this.state.playersInHand.length;
        }
        
        // 모든 액션의 금액 합산
        Object.values(this.state.actions).forEach(streetActions => {
            streetActions.forEach(action => {
                if (action.amount) {
                    pot += parseInt(action.amount);
                }
            });
        });
        
        return pot;
    }

    /**
     * 상태 리셋
     */
    reset() {
        const currentHandNumber = this.state.currentHandNumber;
        const selectedTable = this.state.selectedTable;
        const playerDataByTable = this.state.playerDataByTable;
        const allTables = this.state.allTables;
        const allHandNumbers = this.state.allHandNumbers;
        const selectedTimezone = this.state.selectedTimezone;
        const settings = {
            autoSaveEnabled: this.state.autoSaveEnabled,
            soundEnabled: this.state.soundEnabled,
            darkMode: this.state.darkMode
        };
        
        this.state = {
            ...this.getInitialState(),
            currentHandNumber,
            selectedTable,
            playerDataByTable,
            allTables,
            allHandNumbers,
            selectedTimezone,
            ...settings
        };
        
        this.eventBus.emit('state:reset');
    }

    /**
     * 상태 복원
     */
    restore(savedState) {
        if (savedState && typeof savedState === 'object') {
            this.state = { ...this.state, ...savedState };
            this.eventBus.emit('state:restored', this.state);
        }
    }

    /**
     * 실행 취소 (Undo)
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.state = this.deepClone(this.history[this.historyIndex]);
            this.eventBus.emit('state:undo', this.state);
        }
    }

    /**
     * 다시 실행 (Redo)
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.state = this.deepClone(this.history[this.historyIndex]);
            this.eventBus.emit('state:redo', this.state);
        }
    }

    /**
     * 히스토리에 현재 상태 저장
     */
    saveToHistory() {
        // 현재 위치 이후의 히스토리 제거
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // 새 상태 추가
        this.history.push(this.deepClone(this.state));
        this.historyIndex++;
        
        // 최대 크기 제한
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    /**
     * 저장되지 않은 변경사항 확인
     */
    hasUnsavedChanges() {
        return this.state.hasUnsavedChanges;
    }

    /**
     * 저장 완료 표시
     */
    markAsSaved() {
        this.state.hasUnsavedChanges = false;
    }

    /**
     * 상태 변경 구독
     */
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, []);
        }
        this.subscribers.get(key).push(callback);
        
        // 구독 해제 함수 반환
        return () => {
            const callbacks = this.subscribers.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    /**
     * 구독자에게 알림
     */
    notifySubscribers(key, value) {
        const callbacks = this.subscribers.get(key) || [];
        callbacks.forEach(callback => {
            try {
                callback(value);
            } catch (error) {
                console.error('Subscriber callback error:', error);
            }
        });
    }

    /**
     * 중첩된 객체에서 값 가져오기
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * 중첩된 객체에 값 설정
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    /**
     * 깊은 복사
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * 값 비교
     */
    isEqual(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    }

    /**
     * 디버깅용 상태 출력
     */
    debug() {
        console.group('🔍 Current State');
        console.log(this.state);
        console.log('History Length:', this.history.length);
        console.log('History Index:', this.historyIndex);
        console.log('Has Unsaved Changes:', this.hasUnsavedChanges());
        console.groupEnd();
    }
}