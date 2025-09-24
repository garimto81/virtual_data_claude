/**
 * 🎰 Virtual Data v4.0.0 Phoenix
 * Configuration Management System
 *
 * 앱 설정을 중앙에서 관리하는 시스템
 */

import { Logger } from '../utils/logger.js';
import { Storage } from '../utils/storage.js';

export class AppConfig {
  constructor() {
    this.logger = new Logger('AppConfig');
    this.storage = new Storage('app_config');

    // 기본 설정
    this.defaults = {
      // 앱 기본 설정
      app: {
        name: 'Virtual Data Poker Logger',
        version: '4.0.0',
        language: 'ko',
        theme: 'dark',
        timezone: 'Asia/Seoul',
        debugMode: false
      },

      // API 설정
      api: {
        appsScriptUrl: '',
        timeout: 30000,
        retries: 3,
        retryDelay: 1000
      },

      // UI 설정
      ui: {
        autoSave: true,
        showTooltips: true,
        animationSpeed: 'normal',
        compactMode: false,
        showDebugInfo: false
      },

      // 데이터 설정
      data: {
        autoBackup: true,
        backupInterval: 300000, // 5분
        maxBackups: 10,
        validateData: true
      },

      // 모듈 설정
      modules: {
        player: { enabled: true, maxPlayers: 10 },
        table: { enabled: true, maxTables: 100 },
        hand: { enabled: true, autoLog: true },
        ui: { enabled: true, responsive: true }
      }
    };

    // 현재 설정 (기본값으로 초기화)
    this.config = this._deepClone(this.defaults);

    // 설정 변경 콜백
    this.changeCallbacks = new Map();
  }

  /**
   * 설정 로드
   */
  async load() {
    try {
      this.logger.info('⚙️ 설정 로드 중...');

      // localStorage에서 저장된 설정 로드
      const savedConfig = await this.storage.get('config');

      if (savedConfig) {
        // 저장된 설정과 기본값 병합
        this.config = this._mergeConfig(this.defaults, savedConfig);
        this.logger.info('✅ 저장된 설정 로드 완료');
      } else {
        this.logger.info('💡 저장된 설정 없음, 기본값 사용');
      }

      // 설정 검증
      this._validateConfig();

      // v3에서 마이그레이션 체크
      await this._migrateFromV3();

      this.logger.success('✅ 설정 시스템 준비 완료');

    } catch (error) {
      this.logger.error('❌ 설정 로드 실패:', error);
      throw error;
    }
  }

  /**
   * 설정값 가져오기
   */
  get(path, defaultValue = null) {
    const value = this._getNestedValue(this.config, path);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * 설정값 설정
   */
  async set(path, value) {
    const oldValue = this.get(path);

    this._setNestedValue(this.config, path, value);

    // 변경사항 저장
    await this.save();

    // 콜백 실행
    const callbacks = this.changeCallbacks.get(path) || [];
    callbacks.forEach(callback => {
      try {
        callback(value, oldValue, path);
      } catch (error) {
        this.logger.error(`설정 변경 콜백 에러 [${path}]:`, error);
      }
    });

    this.logger.info(`⚙️ 설정 변경: ${path} = ${JSON.stringify(value)}`);
  }

  /**
   * 여러 설정값 일괄 설정
   */
  async setMany(settings) {
    for (const [path, value] of Object.entries(settings)) {
      this._setNestedValue(this.config, path, value);
    }

    await this.save();
    this.logger.info(`⚙️ ${Object.keys(settings).length}개 설정 일괄 변경`);
  }

  /**
   * 설정 저장
   */
  async save() {
    try {
      await this.storage.set('config', this.config);
      this.logger.debug('💾 설정 저장 완료');
    } catch (error) {
      this.logger.error('❌ 설정 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 설정 초기화
   */
  async reset(section = null) {
    if (section) {
      // 특정 섹션만 초기화
      if (this.defaults[section]) {
        this.config[section] = this._deepClone(this.defaults[section]);
        this.logger.info(`🔄 설정 섹션 '${section}' 초기화`);
      }
    } else {
      // 전체 초기화
      this.config = this._deepClone(this.defaults);
      this.logger.info('🔄 전체 설정 초기화');
    }

    await this.save();
  }

  /**
   * 설정 변경 감지
   */
  onChange(path, callback) {
    if (!this.changeCallbacks.has(path)) {
      this.changeCallbacks.set(path, []);
    }

    this.changeCallbacks.get(path).push(callback);

    // 제거 함수 반환
    return () => {
      const callbacks = this.changeCallbacks.get(path);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * 전체 설정 가져오기
   */
  getAll() {
    return this._deepClone(this.config);
  }

  /**
   * Apps Script URL 관련 편의 메소드
   */
  async setAppsScriptUrl(url) {
    if (!this._validateAppsScriptUrl(url)) {
      throw new Error('Invalid Apps Script URL format');
    }

    await this.set('api.appsScriptUrl', url);
    this.logger.info('🔗 Apps Script URL 설정 완료');
  }

  getAppsScriptUrl() {
    return this.get('api.appsScriptUrl');
  }

  hasAppsScriptUrl() {
    const url = this.getAppsScriptUrl();
    return url && url.trim().length > 0;
  }

  // ==================== Private Methods ====================

  /**
   * 중첩 객체에서 값 가져오기
   */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * 중첩 객체에 값 설정
   */
  _setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();

    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);

    target[lastKey] = value;
  }

  /**
   * 설정 병합
   */
  _mergeConfig(defaults, saved) {
    const result = this._deepClone(defaults);

    const merge = (target, source) => {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
            if (typeof target[key] !== 'object') {
              target[key] = {};
            }
            merge(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
      }
    };

    merge(result, saved);
    return result;
  }

  /**
   * 깊은 복사
   */
  _deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (Array.isArray(obj)) return obj.map(item => this._deepClone(item));

    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this._deepClone(obj[key]);
      }
    }
    return cloned;
  }

  /**
   * 설정 검증
   */
  _validateConfig() {
    // Apps Script URL 검증
    const url = this.get('api.appsScriptUrl');
    if (url && !this._validateAppsScriptUrl(url)) {
      this.logger.warn('⚠️ 유효하지 않은 Apps Script URL, 초기화');
      this._setNestedValue(this.config, 'api.appsScriptUrl', '');
    }

    // 숫자값 검증
    const numberConfigs = [
      'api.timeout',
      'api.retries',
      'api.retryDelay',
      'data.backupInterval',
      'data.maxBackups'
    ];

    numberConfigs.forEach(path => {
      const value = this.get(path);
      if (typeof value !== 'number' || value < 0) {
        this.logger.warn(`⚠️ 유효하지 않은 숫자값 ${path}: ${value}, 기본값 사용`);
        const defaultValue = this._getNestedValue(this.defaults, path);
        this._setNestedValue(this.config, path, defaultValue);
      }
    });

    this.logger.debug('✅ 설정 검증 완료');
  }

  /**
   * Apps Script URL 검증
   */
  _validateAppsScriptUrl(url) {
    if (!url || typeof url !== 'string') return false;

    const pattern = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9-_]+\/exec$/;
    return pattern.test(url.trim());
  }

  /**
   * v3에서 설정 마이그레이션
   */
  async _migrateFromV3() {
    try {
      // v3 localStorage 키들 체크
      const v3Keys = [
        'apps_script_url',
        'auto_init_enabled',
        'app_reload_attempts'
      ];

      let migrated = false;

      for (const key of v3Keys) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          switch (key) {
            case 'apps_script_url':
              if (!this.hasAppsScriptUrl() && this._validateAppsScriptUrl(value)) {
                await this.set('api.appsScriptUrl', value);
                migrated = true;
              }
              break;

            case 'auto_init_enabled':
              if (value === 'true') {
                await this.set('app.autoInit', true);
                migrated = true;
              }
              break;
          }

          // v3 데이터 정리
          localStorage.removeItem(key);
        }
      }

      if (migrated) {
        this.logger.success('✅ v3 설정 마이그레이션 완료');
      }

    } catch (error) {
      this.logger.error('❌ v3 마이그레이션 실패:', error);
      // 마이그레이션 실패는 치명적이지 않으므로 계속 진행
    }
  }
}