/**
 * ============================================
 * Lazy Loader - 지연 로딩 시스템
 * Version: 1.0.0
 * ============================================
 *
 * 무거운 모듈을 필요할 때만 동적으로 로드하여 초기 로딩 속도 개선
 *
 * 기능:
 * - Script/CSS 동적 로딩
 * - 중복 로딩 방지 (캐시)
 * - 병렬/순차 로딩 지원
 * - 로딩 상태 추적
 */

window.LazyLoader = (function() {
  'use strict';

  // 로딩 상태 캐시
  const loadedScripts = new Set();
  const loadingPromises = new Map();

  /**
   * 스크립트 파일을 동적으로 로드
   * @param {string} url - 스크립트 URL
   * @param {Object} options - 로딩 옵션
   * @returns {Promise<void>}
   */
  function loadScript(url, options = {}) {
    const {
      defer = false,
      async = true,
      timeout = 10000
    } = options;

    // 이미 로드된 경우 즉시 반환
    if (loadedScripts.has(url)) {
      logger.debug(`[LazyLoader] Already loaded: ${url}`);
      return Promise.resolve();
    }

    // 로딩 중인 경우 기존 Promise 반환
    if (loadingPromises.has(url)) {
      logger.debug(`[LazyLoader] Loading in progress: ${url}`);
      return loadingPromises.get(url);
    }

    // 새로운 로딩 시작
    const loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.defer = defer;
      script.async = async;

      // 타임아웃 설정
      const timer = setTimeout(() => {
        reject(new Error(`Script load timeout: ${url}`));
      }, timeout);

      script.onload = () => {
        clearTimeout(timer);
        loadedScripts.add(url);
        loadingPromises.delete(url);
        logger.info(`[LazyLoader] Loaded: ${url}`);
        resolve();
      };

      script.onerror = (error) => {
        clearTimeout(timer);
        loadingPromises.delete(url);
        logger.error(`[LazyLoader] Failed to load: ${url}`, error);
        reject(new Error(`Failed to load script: ${url}`));
      };

      document.head.appendChild(script);
    });

    loadingPromises.set(url, loadPromise);
    return loadPromise;
  }

  /**
   * CSS 파일을 동적으로 로드
   * @param {string} url - CSS URL
   * @param {number} timeout - 타임아웃 (ms)
   * @returns {Promise<void>}
   */
  function loadCSS(url, timeout = 10000) {
    if (loadedScripts.has(url)) {
      return Promise.resolve();
    }

    if (loadingPromises.has(url)) {
      return loadingPromises.get(url);
    }

    const loadPromise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;

      const timer = setTimeout(() => {
        reject(new Error(`CSS load timeout: ${url}`));
      }, timeout);

      link.onload = () => {
        clearTimeout(timer);
        loadedScripts.add(url);
        loadingPromises.delete(url);
        logger.info(`[LazyLoader] Loaded CSS: ${url}`);
        resolve();
      };

      link.onerror = (error) => {
        clearTimeout(timer);
        loadingPromises.delete(url);
        logger.error(`[LazyLoader] Failed to load CSS: ${url}`, error);
        reject(new Error(`Failed to load CSS: ${url}`));
      };

      document.head.appendChild(link);
    });

    loadingPromises.set(url, loadPromise);
    return loadPromise;
  }

  /**
   * 여러 스크립트를 병렬로 로드
   * @param {string[]} urls - 스크립트 URL 배열
   * @returns {Promise<void[]>}
   */
  function loadScriptsParallel(urls) {
    logger.debug(`[LazyLoader] Loading ${urls.length} scripts in parallel`);
    return Promise.all(urls.map(url => loadScript(url)));
  }

  /**
   * 여러 스크립트를 순차적으로 로드
   * @param {string[]} urls - 스크립트 URL 배열
   * @returns {Promise<void>}
   */
  async function loadScriptsSequential(urls) {
    logger.debug(`[LazyLoader] Loading ${urls.length} scripts sequentially`);
    for (const url of urls) {
      await loadScript(url);
    }
  }

  /**
   * 모듈 사전로드 (우선순위 높음)
   * @param {string} url - 스크립트 URL
   */
  function preload(url) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = url;
    document.head.appendChild(link);
    logger.debug(`[LazyLoader] Preloading: ${url}`);
  }

  /**
   * 로딩 상태 확인
   * @param {string} url - 확인할 URL
   * @returns {string} 'loaded' | 'loading' | 'not-loaded'
   */
  function getLoadingStatus(url) {
    if (loadedScripts.has(url)) return 'loaded';
    if (loadingPromises.has(url)) return 'loading';
    return 'not-loaded';
  }

  /**
   * 캐시 초기화
   */
  function clearCache() {
    loadedScripts.clear();
    loadingPromises.clear();
    logger.warn('[LazyLoader] Cache cleared');
  }

  // Public API
  return {
    loadScript,
    loadCSS,
    loadScriptsParallel,
    loadScriptsSequential,
    preload,
    getLoadingStatus,
    clearCache
  };
})();
