/**
 * 🎰 Virtual Data v4.0.0 Phoenix
 * Core Application Class
 *
 * 전체 앱의 생명주기를 관리하는 중앙 컨트롤러
 */

import { AppConfig } from './config.js';
import { EventBus } from './events.js';
import { Logger } from '../utils/logger.js';
import { ModuleLoader } from './module-loader.js';

export class PokerApp {
  constructor() {
    this.version = '4.0.0';
    this.codename = 'Phoenix';
    this.buildDate = '2025-09-24';

    // 핵심 시스템 초기화
    this.config = new AppConfig();
    this.events = new EventBus();
    this.logger = new Logger('PokerApp');
    this.moduleLoader = new ModuleLoader(this);

    // 모듈 저장소
    this.modules = new Map();

    // 앱 상태
    this.state = {
      initialized: false,
      loading: false,
      error: null,
      startTime: null
    };

    this._bindEvents();
  }

  /**
   * 앱 초기화 시작점
   */
  async init() {
    this.state.loading = true;
    this.state.startTime = Date.now();

    try {
      this.logger.info(`🚀 Virtual Data ${this.version} "${this.codename}" 시작`);
      this.logger.info(`Build: ${this.buildDate}`);

      // 1단계: 설정 로드
      await this._loadConfig();

      // 2단계: 핵심 모듈 로드
      await this._loadCoreModules();

      // 3단계: UI 초기화
      await this._initUI();

      // 4단계: 이벤트 시스템 활성화
      this._activateEventSystem();

      // 완료
      this.state.initialized = true;
      this.state.loading = false;

      const loadTime = Date.now() - this.state.startTime;
      this.logger.success(`✅ 앱 초기화 완료 (${loadTime}ms)`);

      this.events.emit('app:initialized', {
        version: this.version,
        loadTime,
        modules: Array.from(this.modules.keys())
      });

    } catch (error) {
      this.state.loading = false;
      this.state.error = error;
      this.logger.error('❌ 앱 초기화 실패:', error);

      this.events.emit('app:error', { error, phase: 'initialization' });
      throw error;
    }
  }

  /**
   * 모듈 등록
   */
  registerModule(name, moduleInstance) {
    if (this.modules.has(name)) {
      this.logger.warn(`모듈 '${name}' 이미 등록됨`);
      return false;
    }

    this.modules.set(name, moduleInstance);
    this.logger.info(`📦 모듈 '${name}' 등록됨`);

    this.events.emit('module:registered', { name, module: moduleInstance });
    return true;
  }

  /**
   * 모듈 가져오기
   */
  getModule(name) {
    return this.modules.get(name);
  }

  /**
   * 모든 모듈 목록
   */
  getModules() {
    return Array.from(this.modules.entries());
  }

  /**
   * 앱 상태 정보
   */
  getState() {
    return {
      ...this.state,
      version: this.version,
      codename: this.codename,
      modules: Array.from(this.modules.keys()),
      uptime: this.state.startTime ? Date.now() - this.state.startTime : 0
    };
  }

  /**
   * 앱 종료
   */
  async destroy() {
    this.logger.info('🔄 앱 종료 중...');

    // 모든 모듈 정리
    for (const [name, module] of this.modules) {
      try {
        if (typeof module.destroy === 'function') {
          await module.destroy();
        }
      } catch (error) {
        this.logger.error(`모듈 '${name}' 종료 실패:`, error);
      }
    }

    this.modules.clear();
    this.events.removeAllListeners();
    this.state.initialized = false;

    this.logger.info('👋 앱 종료 완료');
  }

  // ==================== Private Methods ====================

  /**
   * 설정 로드
   */
  async _loadConfig() {
    this.logger.info('⚙️ 설정 로드 중...');

    await this.config.load();
    this.logger.info('✅ 설정 로드 완료');
  }

  /**
   * 핵심 모듈 로드
   */
  async _loadCoreModules() {
    this.logger.info('📦 핵심 모듈 로드 중...');

    const coreModules = [
      'table',
      'player',
      'hand',
      'ui'
    ];

    for (const moduleName of coreModules) {
      try {
        await this.moduleLoader.load(moduleName);
      } catch (error) {
        this.logger.error(`모듈 '${moduleName}' 로드 실패:`, error);
        // 핵심 모듈이므로 실패 시 초기화 중단
        throw new Error(`Critical module '${moduleName}' failed to load`);
      }
    }

    this.logger.success(`✅ ${coreModules.length}개 핵심 모듈 로드 완료`);
  }

  /**
   * UI 초기화
   */
  async _initUI() {
    this.logger.info('🎨 UI 초기화 중...');

    const uiModule = this.getModule('ui');
    if (uiModule) {
      await uiModule.render();
    }

    this.logger.info('✅ UI 초기화 완료');
  }

  /**
   * 이벤트 시스템 활성화
   */
  _activateEventSystem() {
    this.logger.info('⚡ 이벤트 시스템 활성화');

    // 글로벌 이벤트 리스너들
    this.events.on('app:error', this._handleAppError.bind(this));
    this.events.on('module:error', this._handleModuleError.bind(this));
  }

  /**
   * 이벤트 바인딩
   */
  _bindEvents() {
    // 브라우저 이벤트
    window.addEventListener('beforeunload', () => {
      this.destroy();
    });

    window.addEventListener('error', (event) => {
      this.logger.error('전역 에러:', event.error);
      this.events.emit('app:error', { error: event.error, phase: 'runtime' });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logger.error('처리되지 않은 Promise 거부:', event.reason);
      this.events.emit('app:error', { error: event.reason, phase: 'promise' });
    });
  }

  /**
   * 앱 에러 처리
   */
  _handleAppError(data) {
    const { error, phase } = data;
    this.logger.error(`앱 에러 [${phase}]:`, error);

    // 에러 리포팅 (향후 구현)
    // this._reportError(error, phase);
  }

  /**
   * 모듈 에러 처리
   */
  _handleModuleError(data) {
    const { module, error } = data;
    this.logger.error(`모듈 '${module}' 에러:`, error);

    // 모듈 재시작 시도 (향후 구현)
    // this._restartModule(module);
  }
}

// 전역 앱 인스턴스 (싱글톤)
export let app = null;

/**
 * 앱 생성 및 초기화
 */
export async function createApp() {
  if (app) {
    throw new Error('App already created');
  }

  app = new PokerApp();
  await app.init();

  // 디버깅을 위해 전역에 노출
  if (typeof window !== 'undefined') {
    window.__POKER_APP__ = app;
  }

  return app;
}