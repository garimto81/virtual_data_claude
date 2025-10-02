/**
 * 🛠️ 헬퍼 유틸리티
 * Virtual Data - Poker Hand Logger
 * Version: 1.0.0
 *
 * 범용 헬퍼 함수들
 */

(function() {
  'use strict';

  /**
   * 지연 실행 (sleep)
   * @param {number} ms - 밀리초
   * @returns {Promise<void>}
   * @example
   * await sleep(1000); // 1초 대기
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 디바운스 함수 생성
   * @param {Function} func - 실행할 함수
   * @param {number} delay - 지연 시간 (ms)
   * @returns {Function} 디바운스된 함수
   * @example
   * const debouncedSearch = debounce(search, 300);
   */
  function debounce(func, delay = UI_CONFIG.DEBOUNCE_DELAY) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * 쓰로틀 함수 생성
   * @param {Function} func - 실행할 함수
   * @param {number} limit - 제한 시간 (ms)
   * @returns {Function} 쓰로틀된 함수
   */
  function throttle(func, limit = 200) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * 깊은 복사
   * @param {*} obj - 복사할 객체
   * @returns {*} 복사된 객체
   */
  function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));

    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  /**
   * 객체 병합 (깊은 병합)
   * @param {object} target - 대상 객체
   * @param {...object} sources - 소스 객체들
   * @returns {object} 병합된 객체
   */
  function deepMerge(target, ...sources) {
    if (!sources.length) return target;

    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return deepMerge(target, ...sources);
  }

  /**
   * 객체인지 확인
   * @param {*} item - 확인할 아이템
   * @returns {boolean}
   */
  function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * 배열을 청크로 분할
   * @param {Array} array - 분할할 배열
   * @param {number} size - 청크 크기
   * @returns {Array[]} 청크 배열
   * @example
   * chunk([1,2,3,4,5], 2) // [[1,2], [3,4], [5]]
   */
  function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 배열에서 중복 제거
   * @param {Array} array - 배열
   * @returns {Array} 중복이 제거된 배열
   */
  function unique(array) {
    return [...new Set(array)];
  }

  /**
   * 배열을 키로 그룹화
   * @param {Array} array - 배열
   * @param {string|Function} key - 그룹화 키 또는 함수
   * @returns {object} 그룹화된 객체
   * @example
   * groupBy([{name: 'A', type: 1}, {name: 'B', type: 1}], 'type')
   * // { '1': [{name: 'A', type: 1}, {name: 'B', type: 1}] }
   */
  function groupBy(array, key) {
    return array.reduce((result, item) => {
      const groupKey = typeof key === 'function' ? key(item) : item[key];
      (result[groupKey] = result[groupKey] || []).push(item);
      return result;
    }, {});
  }

  /**
   * 랜덤 ID 생성
   * @param {number} length - ID 길이
   * @returns {string} 랜덤 ID
   */
  function generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * UUID v4 생성
   * @returns {string} UUID
   */
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 로컬 스토리지에 저장
   * @param {string} key - 키
   * @param {*} value - 값
   */
  function setStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.error('Failed to save to localStorage:', error);
    }
  }

  /**
   * 로컬 스토리지에서 가져오기
   * @param {string} key - 키
   * @param {*} defaultValue - 기본값
   * @returns {*} 저장된 값 또는 기본값
   */
  function getStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      logger.error('Failed to get from localStorage:', error);
      return defaultValue;
    }
  }

  /**
   * 로컬 스토리지에서 제거
   * @param {string} key - 키
   */
  function removeStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error('Failed to remove from localStorage:', error);
    }
  }

  /**
   * 클립보드에 복사
   * @param {string} text - 복사할 텍스트
   * @returns {Promise<boolean>} 성공 여부
   */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      logger.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * 쿼리 파라미터 파싱
   * @param {string} search - 쿼리 문자열 (기본값: window.location.search)
   * @returns {object} 파싱된 파라미터 객체
   */
  function parseQueryParams(search = window.location.search) {
    const params = {};
    const urlParams = new URLSearchParams(search);

    for (const [key, value] of urlParams) {
      params[key] = value;
    }

    return params;
  }

  /**
   * 쿼리 파라미터를 문자열로 변환
   * @param {object} params - 파라미터 객체
   * @returns {string} 쿼리 문자열
   */
  function stringifyQueryParams(params) {
    const urlParams = new URLSearchParams(params);
    return urlParams.toString();
  }

  // 전역 노출
  window.sleep = sleep;
  window.debounce = debounce;
  window.throttle = throttle;
  window.deepClone = deepClone;
  window.deepMerge = deepMerge;
  window.isObject = isObject;
  window.chunk = chunk;
  window.unique = unique;
  window.groupBy = groupBy;
  window.generateId = generateId;
  window.generateUUID = generateUUID;
  window.setStorage = setStorage;
  window.getStorage = getStorage;
  window.removeStorage = removeStorage;
  window.copyToClipboard = copyToClipboard;
  window.parseQueryParams = parseQueryParams;
  window.stringifyQueryParams = stringifyQueryParams;

  logger.debug('🛠️ Helpers loaded');

})();
