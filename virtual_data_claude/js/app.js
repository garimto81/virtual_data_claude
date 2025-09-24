/**
 * 포커 핸드 로거 v35 - Main Application
 * 모듈화된 구조로 재설계
 */

console.log('📂 [APP.JS] 메인 애플리케이션 모듈 로드 시작');
console.log('  └─ 모듈 import 진행 중...');

import { Config } from './config/config.js';
import { StateManager } from './core/StateManager.js';
import { EventBus } from './core/EventBus.js';
import { UIController } from './core/UIController.js';
import { DataService } from './services/DataService.js';
import { StorageService } from './services/StorageService.js';
import { Logger } from './utils/Logger.js';
import { Toast } from './utils/Toast.js';

console.log('  ✓ 모든 모듈 import 완료');

class PokerHandLogger {
    constructor() {
        this.config = null;
        this.state = null;
        this.eventBus = null;
        this.ui = null;
        this.dataService = null;
        this.storage = null;
        this.logger = null;
        this.isInitialized = false;
    }

    /**
     * 애플리케이션 초기화
     */
    async init() {
        try {
            console.log('🎯 포커 핸드 로거 v35 초기화 시작...');
            
            // 설정 로드
            this.config = await Config.load();
            
            // 핵심 모듈 초기화
            this.eventBus = new EventBus();
            this.logger = new Logger(this.eventBus);
            this.state = new StateManager(this.eventBus);
            this.storage = new StorageService();
            this.dataService = new DataService(this.config, this.eventBus);
            this.ui = new UIController(this.state, this.eventBus, this.config);
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 저장된 상태 복원
            await this.restoreState();
            
            // 초기 데이터 로드
            await this.loadInitialData();
            
            // UI 초기화
            await this.ui.init();
            
            // 로딩 화면 숨기기
            this.hideLoadingScreen();
            
            // 앱 표시
            this.showApp();
            
            this.isInitialized = true;
            this.logger.success('애플리케이션 초기화 완료');
            
        } catch (error) {
            console.error('초기화 실패:', error);
            this.logger.error(`초기화 실패: ${error.message}`);
            Toast.error('애플리케이션 초기화에 실패했습니다.');
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 상태 변경 이벤트
        this.eventBus.on('state:changed', (data) => {
            this.handleStateChange(data);
        });

        // 데이터 전송 이벤트
        this.eventBus.on('data:send', async (data) => {
            await this.sendDataToSheet(data);
        });

        // 핸드 리셋 이벤트
        this.eventBus.on('hand:reset', () => {
            this.resetHand();
        });

        // 저장 이벤트
        this.eventBus.on('data:save', () => {
            this.saveToLocal();
        });

        // 새로고침 이벤트
        this.eventBus.on('data:refresh', async () => {
            await this.loadInitialData();
        });

        // 전역 에러 핸들러
        window.addEventListener('error', (event) => {
            this.logger.error(`전역 오류: ${event.error.message}`);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logger.error(`Promise 오류: ${event.reason}`);
        });

        // 페이지 나가기 전 저장
        window.addEventListener('beforeunload', (event) => {
            if (this.state.hasUnsavedChanges()) {
                event.preventDefault();
                event.returnValue = '저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?';
            }
        });

        // 키보드 단축키
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcut(event);
        });
    }

    /**
     * 키보드 단축키 처리
     */
    handleKeyboardShortcut(event) {
        if (event.ctrlKey || event.metaKey) {
            switch(event.key) {
                case 's': // Ctrl+S: 저장
                    event.preventDefault();
                    this.saveToLocal();
                    break;
                case 'n': // Ctrl+N: 새 핸드
                    event.preventDefault();
                    this.resetHand();
                    break;
                case 'r': // Ctrl+R: 새로고침
                    event.preventDefault();
                    this.loadInitialData();
                    break;
                case 'z': // Ctrl+Z: 실행 취소
                    event.preventDefault();
                    this.state.undo();
                    break;
                case 'y': // Ctrl+Y: 다시 실행
                    event.preventDefault();
                    this.state.redo();
                    break;
            }
        }
    }

    /**
     * 상태 변경 처리
     */
    handleStateChange(data) {
        // 자동 저장 (디바운스)
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        this.autoSaveTimeout = setTimeout(() => {
            this.saveToLocal();
        }, 2000);
    }

    /**
     * 저장된 상태 복원
     */
    async restoreState() {
        try {
            const savedState = await this.storage.getItem('appState');
            if (savedState) {
                this.state.restore(savedState);
                this.logger.info('이전 상태 복원됨');
            }
        } catch (error) {
            this.logger.warning('상태 복원 실패: ' + error.message);
        }
    }

    /**
     * 초기 데이터 로드
     */
    async loadInitialData() {
        try {
            this.logger.info('초기 데이터 로딩 중...');
            const data = await this.dataService.getInitialData();
            
            if (data && data.status === 'success') {
                this.state.update('playerDataByTable', data.playerData);
                this.state.update('allHandNumbers', data.handNumbers);
                this.state.update('allTables', Object.keys(data.playerData));
                
                // 다음 핸드 번호 설정
                const lastHand = data.handNumbers.length > 0 
                    ? Math.max(...data.handNumbers.map(n => parseInt(n))) 
                    : 0;
                this.state.update('currentHandNumber', lastHand + 1);
                
                this.logger.success(`데이터 로드 완료: ${data.handNumbers.length}개 핸드`);
            }
        } catch (error) {
            this.logger.error('데이터 로드 실패: ' + error.message);
            Toast.error('초기 데이터를 불러올 수 없습니다.');
        }
    }

    /**
     * 데이터를 Google Sheets로 전송
     */
    async sendDataToSheet(data) {
        try {
            // 유효성 검사
            const validation = this.validateHandData();
            if (!validation.valid) {
                Toast.warning(validation.message);
                return;
            }

            this.logger.info('시트로 데이터 전송 중...');
            Toast.info('데이터 전송 중...');

            const result = await this.dataService.sendToSheet(data || this.state.get());
            
            if (result.status === 'success') {
                this.logger.success('데이터 전송 완료');
                Toast.success('데이터가 성공적으로 전송되었습니다!');
                
                // 전송 후 자동으로 새 핸드 시작
                setTimeout(() => {
                    this.resetHand();
                }, 1500);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.logger.error('데이터 전송 실패: ' + error.message);
            Toast.error('데이터 전송에 실패했습니다.');
        }
    }

    /**
     * 핸드 데이터 유효성 검사
     */
    validateHandData() {
        const state = this.state.get();
        
        // 필수 항목 검사
        if (state.playersInHand.length < 2) {
            return { valid: false, message: '최소 2명 이상의 플레이어가 필요합니다.' };
        }

        const winner = state.playersInHand.find(p => p.role === 'winner');
        const loser = state.playersInHand.find(p => p.role === 'loser');
        
        if (!winner || !loser) {
            return { valid: false, message: '승자와 패자를 모두 지정해야 합니다.' };
        }

        if (!state.currentHandNumber) {
            return { valid: false, message: '핸드 번호가 필요합니다.' };
        }

        return { valid: true };
    }

    /**
     * 로컬 저장
     */
    async saveToLocal() {
        try {
            const state = this.state.get();
            await this.storage.setItem('appState', state);
            this.logger.info('로컬 저장 완료');
            Toast.success('자동 저장됨', 1000);
        } catch (error) {
            this.logger.error('저장 실패: ' + error.message);
        }
    }

    /**
     * 핸드 리셋
     */
    resetHand() {
        const currentHand = this.state.get('currentHandNumber');
        this.state.reset();
        this.state.update('currentHandNumber', (currentHand || 0) + 1);
        this.logger.info('새 핸드 시작: #' + this.state.get('currentHandNumber'));
        Toast.info('새 핸드를 시작합니다');
    }

    /**
     * 로딩 화면 숨기기
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
    }

    /**
     * 앱 표시
     */
    showApp() {
        const app = document.getElementById('app');
        if (app) {
            app.classList.remove('hidden');
            app.style.opacity = '0';
            setTimeout(() => {
                app.style.opacity = '1';
            }, 100);
        }
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PokerHandLogger();
    window.app.init();
});