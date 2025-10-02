/**
 * ============================================
 * Cache Manager - 캐싱 시스템
 * Version: 1.0.0
 * ============================================
 *
 * API 응답, 계산 결과 등을 메모리에 캐싱하여 성능 향상
 *
 * 기능:
 * - 메모리 캐시 (LRU)
 * - TTL (Time To Live) 지원
 * - 캐시 크기 제한
 * - 통계 추적
 */

window.CacheManager = (function() {
  'use strict';

  // 기본 설정
  const DEFAULT_TTL = 5 * 60 * 1000; // 5분
  const DEFAULT_MAX_SIZE = 100; // 최대 100개 항목

  // 캐시 저장소
  const caches = new Map();

  /**
   * 캐시 인스턴스 생성
   */
  class Cache {
    constructor(options = {}) {
      this.name = options.name || 'default';
      this.maxSize = options.maxSize || DEFAULT_MAX_SIZE;
      this.defaultTTL = options.ttl || DEFAULT_TTL;

      this.data = new Map();
      this.accessOrder = []; // LRU 추적용

      // 통계
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        evictions: 0
      };

      logger.debug(`[CacheManager] Created cache: ${this.name}`);
    }

    /**
     * 캐시에 값 저장
     * @param {string} key - 캐시 키
     * @param {any} value - 저장할 값
     * @param {number} ttl - TTL (밀리초), 기본값 사용 시 생략
     */
    set(key, value, ttl) {
      const expiresAt = Date.now() + (ttl || this.defaultTTL);

      // 이미 존재하는 키면 접근 순서 업데이트
      if (this.data.has(key)) {
        this.accessOrder = this.accessOrder.filter(k => k !== key);
      }

      // 크기 초과 시 LRU 제거
      if (this.data.size >= this.maxSize && !this.data.has(key)) {
        const oldestKey = this.accessOrder.shift();
        this.data.delete(oldestKey);
        this.stats.evictions++;
        logger.debug(`[CacheManager] Evicted: ${oldestKey}`);
      }

      this.data.set(key, { value, expiresAt });
      this.accessOrder.push(key);
      this.stats.sets++;

      logger.debug(`[CacheManager] Set: ${key} (TTL: ${ttl || this.defaultTTL}ms)`);
    }

    /**
     * 캐시에서 값 가져오기
     * @param {string} key - 캐시 키
     * @returns {any} 캐시된 값 또는 undefined
     */
    get(key) {
      const item = this.data.get(key);

      // 캐시 미스
      if (!item) {
        this.stats.misses++;
        logger.debug(`[CacheManager] Miss: ${key}`);
        return undefined;
      }

      // 만료 확인
      if (Date.now() > item.expiresAt) {
        this.delete(key);
        this.stats.misses++;
        logger.debug(`[CacheManager] Expired: ${key}`);
        return undefined;
      }

      // 캐시 히트 - 접근 순서 업데이트
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
      this.stats.hits++;

      logger.debug(`[CacheManager] Hit: ${key}`);
      return item.value;
    }

    /**
     * 캐시 항목 삭제
     * @param {string} key - 삭제할 키
     */
    delete(key) {
      this.data.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      logger.debug(`[CacheManager] Deleted: ${key}`);
    }

    /**
     * 캐시 전체 비우기
     */
    clear() {
      this.data.clear();
      this.accessOrder = [];
      logger.info(`[CacheManager] Cleared cache: ${this.name}`);
    }

    /**
     * 만료된 항목 정리
     */
    cleanup() {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [key, item] of this.data.entries()) {
        if (now > item.expiresAt) {
          this.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info(`[CacheManager] Cleaned up ${cleanedCount} expired items`);
      }
    }

    /**
     * 캐시 통계 반환
     */
    getStats() {
      const hitRate = this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
        : 0;

      return {
        ...this.stats,
        size: this.data.size,
        hitRate: `${hitRate}%`
      };
    }

    /**
     * 특정 패턴의 키 삭제
     * @param {RegExp} pattern - 정규식 패턴
     */
    deletePattern(pattern) {
      let deletedCount = 0;

      for (const key of this.data.keys()) {
        if (pattern.test(key)) {
          this.delete(key);
          deletedCount++;
        }
      }

      logger.info(`[CacheManager] Deleted ${deletedCount} items matching pattern: ${pattern}`);
    }
  }

  /**
   * 캐시 인스턴스 가져오기 (없으면 생성)
   * @param {string} name - 캐시 이름
   * @param {Object} options - 캐시 옵션
   * @returns {Cache}
   */
  function getCache(name = 'default', options = {}) {
    if (!caches.has(name)) {
      caches.set(name, new Cache({ name, ...options }));
    }
    return caches.get(name);
  }

  /**
   * 전체 캐시 초기화
   */
  function clearAll() {
    for (const cache of caches.values()) {
      cache.clear();
    }
    logger.warn('[CacheManager] Cleared all caches');
  }

  /**
   * 모든 캐시 통계
   */
  function getAllStats() {
    const stats = {};
    for (const [name, cache] of caches.entries()) {
      stats[name] = cache.getStats();
    }
    return stats;
  }

  /**
   * 주기적인 정리 시작
   */
  function startAutoCleanup(interval = 60000) {
    setInterval(() => {
      for (const cache of caches.values()) {
        cache.cleanup();
      }
    }, interval);
    logger.info(`[CacheManager] Auto cleanup started (interval: ${interval}ms)`);
  }

  // 자동 정리 시작 (1분마다)
  startAutoCleanup();

  // Public API
  return {
    getCache,
    clearAll,
    getAllStats,
    startAutoCleanup
  };
})();

// 전역 단축키
window.cache = CacheManager.getCache('default');
window.apiCache = CacheManager.getCache('api', { ttl: 2 * 60 * 1000 }); // 2분 TTL
window.computeCache = CacheManager.getCache('compute', { ttl: 10 * 60 * 1000 }); // 10분 TTL
