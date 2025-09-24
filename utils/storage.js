/**
 * 🎰 Virtual Data v4.0.0 Phoenix
 * Storage Utility
 *
 * localStorage/sessionStorage 래퍼
 */

import { Logger } from './logger.js';

export class Storage {
  constructor(prefix = 'vd_v4', options = {}) {
    this.prefix = prefix;
    this.logger = new Logger('Storage');
    this.options = {
      useCompression: options.useCompression || false,
      encryptData: options.encryptData || false,
      maxSize: options.maxSize || 5 * 1024 * 1024, // 5MB
      ...options
    };

    // 스토리지 타입 (localStorage 또는 sessionStorage)
    this.storage = options.session ? sessionStorage : localStorage;

    // 사용 가능 여부 체크
    this.available = this._checkAvailability();
  }

  /**
   * 데이터 저장
   */
  async set(key, value) {
    if (!this.available) {
      throw new Error('Storage not available');
    }

    try {
      const fullKey = this._getFullKey(key);
      const serializedValue = await this._serialize(value);

      // 크기 체크
      if (serializedValue.length > this.options.maxSize) {
        throw new Error(`Data size exceeds limit: ${serializedValue.length} > ${this.options.maxSize}`);
      }

      this.storage.setItem(fullKey, serializedValue);
      this.logger.debug(`저장 완료: ${key} (${serializedValue.length} bytes)`);

      return true;

    } catch (error) {
      this.logger.error(`저장 실패: ${key}`, error);
      throw error;
    }
  }

  /**
   * 데이터 가져오기
   */
  async get(key, defaultValue = null) {
    if (!this.available) {
      return defaultValue;
    }

    try {
      const fullKey = this._getFullKey(key);
      const serializedValue = this.storage.getItem(fullKey);

      if (serializedValue === null) {
        return defaultValue;
      }

      const value = await this._deserialize(serializedValue);
      this.logger.debug(`로드 완료: ${key}`);

      return value;

    } catch (error) {
      this.logger.error(`로드 실패: ${key}`, error);
      return defaultValue;
    }
  }

  /**
   * 데이터 존재 확인
   */
  has(key) {
    if (!this.available) {
      return false;
    }

    const fullKey = this._getFullKey(key);
    return this.storage.getItem(fullKey) !== null;
  }

  /**
   * 데이터 삭제
   */
  remove(key) {
    if (!this.available) {
      return false;
    }

    try {
      const fullKey = this._getFullKey(key);
      this.storage.removeItem(fullKey);
      this.logger.debug(`삭제 완료: ${key}`);
      return true;

    } catch (error) {
      this.logger.error(`삭제 실패: ${key}`, error);
      return false;
    }
  }

  /**
   * 모든 데이터 삭제
   */
  clear() {
    if (!this.available) {
      return 0;
    }

    try {
      const keys = this.keys();
      let removed = 0;

      keys.forEach(key => {
        const fullKey = this._getFullKey(key);
        this.storage.removeItem(fullKey);
        removed++;
      });

      this.logger.info(`${removed}개 항목 삭제 완료`);
      return removed;

    } catch (error) {
      this.logger.error('전체 삭제 실패:', error);
      return 0;
    }
  }

  /**
   * 모든 키 목록
   */
  keys() {
    if (!this.available) {
      return [];
    }

    const prefixWithSeparator = this.prefix + '_';
    const keys = [];

    for (let i = 0; i < this.storage.length; i++) {
      const fullKey = this.storage.key(i);
      if (fullKey && fullKey.startsWith(prefixWithSeparator)) {
        keys.push(fullKey.substring(prefixWithSeparator.length));
      }
    }

    return keys;
  }

  /**
   * 저장 공간 사용량 정보
   */
  getUsage() {
    if (!this.available) {
      return { used: 0, available: 0, total: 0, percentage: 0 };
    }

    try {
      let used = 0;
      const keys = this.keys();

      keys.forEach(key => {
        const fullKey = this._getFullKey(key);
        const value = this.storage.getItem(fullKey);
        if (value) {
          used += fullKey.length + value.length;
        }
      });

      // localStorage 총 용량 추정 (보통 5-10MB)
      const estimatedTotal = 10 * 1024 * 1024; // 10MB
      const percentage = (used / estimatedTotal) * 100;

      return {
        used,
        available: estimatedTotal - used,
        total: estimatedTotal,
        percentage: Math.round(percentage * 100) / 100,
        keys: keys.length
      };

    } catch (error) {
      this.logger.error('사용량 계산 실패:', error);
      return { used: 0, available: 0, total: 0, percentage: 0, keys: 0 };
    }
  }

  /**
   * 데이터 내보내기
   */
  export(options = {}) {
    const { keys = null, format = 'json' } = options;
    const data = {};

    const targetKeys = keys || this.keys();

    for (const key of targetKeys) {
      if (this.has(key)) {
        try {
          data[key] = JSON.parse(this.storage.getItem(this._getFullKey(key)));
        } catch (error) {
          this.logger.warn(`내보내기 스킵 (파싱 실패): ${key}`);
        }
      }
    }

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);

      case 'compact':
        return JSON.stringify(data);

      default:
        return data;
    }
  }

  /**
   * 데이터 가져오기
   */
  import(data, options = {}) {
    const { overwrite = false, validate = true } = options;
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    const importData = typeof data === 'string' ? JSON.parse(data) : data;

    for (const [key, value] of Object.entries(importData)) {
      try {
        // 덮어쓰기 여부 체크
        if (!overwrite && this.has(key)) {
          skipped++;
          continue;
        }

        // 검증 (옵션)
        if (validate && !this._validateImportData(key, value)) {
          this.logger.warn(`가져오기 검증 실패: ${key}`);
          errors++;
          continue;
        }

        this.storage.setItem(this._getFullKey(key), JSON.stringify(value));
        imported++;

      } catch (error) {
        this.logger.error(`가져오기 실패: ${key}`, error);
        errors++;
      }
    }

    this.logger.info(`가져오기 완료: ${imported}개 성공, ${skipped}개 스킵, ${errors}개 실패`);

    return { imported, skipped, errors };
  }

  /**
   * 백업 생성
   */
  async backup(name = null) {
    const backupName = name || `backup_${Date.now()}`;
    const data = this.export({ format: 'compact' });

    await this.set(`__backup_${backupName}`, {
      timestamp: Date.now(),
      version: '4.0.0',
      data: JSON.parse(data)
    });

    this.logger.success(`백업 생성 완료: ${backupName}`);
    return backupName;
  }

  /**
   * 백업 복원
   */
  async restore(backupName, options = {}) {
    const backup = await this.get(`__backup_${backupName}`);

    if (!backup) {
      throw new Error(`Backup not found: ${backupName}`);
    }

    const result = this.import(backup.data, options);

    this.logger.success(`백업 복원 완료: ${backupName}`);
    return result;
  }

  /**
   * 백업 목록
   */
  getBackups() {
    const keys = this.keys();
    const backups = [];

    keys.forEach(key => {
      if (key.startsWith('__backup_')) {
        const backupName = key.substring(9);
        try {
          const backup = JSON.parse(this.storage.getItem(this._getFullKey(key)));
          backups.push({
            name: backupName,
            timestamp: backup.timestamp,
            version: backup.version || 'unknown',
            date: new Date(backup.timestamp).toLocaleString()
          });
        } catch (error) {
          this.logger.warn(`백업 정보 파싱 실패: ${key}`);
        }
      }
    });

    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }

  // ==================== Private Methods ====================

  /**
   * 전체 키 생성
   */
  _getFullKey(key) {
    return `${this.prefix}_${key}`;
  }

  /**
   * 스토리지 사용 가능 여부 체크
   */
  _checkAvailability() {
    try {
      const testKey = '__storage_test__';
      this.storage.setItem(testKey, 'test');
      this.storage.removeItem(testKey);
      return true;
    } catch (error) {
      this.logger.warn('Storage not available:', error.message);
      return false;
    }
  }

  /**
   * 데이터 직렬화
   */
  async _serialize(value) {
    let serialized = JSON.stringify(value);

    // 압축 (선택사항 - 향후 구현)
    if (this.options.useCompression) {
      // serialized = await this._compress(serialized);
    }

    // 암호화 (선택사항 - 향후 구현)
    if (this.options.encryptData) {
      // serialized = await this._encrypt(serialized);
    }

    return serialized;
  }

  /**
   * 데이터 역직렬화
   */
  async _deserialize(serializedValue) {
    let value = serializedValue;

    // 복호화 (선택사항)
    if (this.options.encryptData) {
      // value = await this._decrypt(value);
    }

    // 압축 해제 (선택사항)
    if (this.options.useCompression) {
      // value = await this._decompress(value);
    }

    return JSON.parse(value);
  }

  /**
   * 가져오기 데이터 검증
   */
  _validateImportData(key, value) {
    // 기본 검증 로직
    if (key.includes('__') && !key.startsWith('__backup_')) {
      return false; // 시스템 키 제외
    }

    // 값 크기 체크
    const serialized = JSON.stringify(value);
    if (serialized.length > this.options.maxSize / 10) {
      return false; // 너무 큰 값
    }

    return true;
  }
}