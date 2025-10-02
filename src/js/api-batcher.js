/**
 * ============================================
 * API Batcher - API 배치 처리 시스템
 * Version: 1.0.0
 * ============================================
 *
 * 여러 API 요청을 모아서 한 번에 처리하여 네트워크 효율 향상
 *
 * 기능:
 * - 자동 배치 큐잉
 * - 시간/크기 기반 플러시
 * - 우선순위 처리
 * - 재시도 로직
 */

window.APIBatcher = (function() {
  'use strict';

  // 기본 설정
  const DEFAULT_BATCH_SIZE = 10;
  const DEFAULT_FLUSH_INTERVAL = 1000; // 1초
  const DEFAULT_MAX_RETRIES = 3;

  // 배치 큐 저장소
  const batchers = new Map();

  /**
   * 배치 처리기 클래스
   */
  class Batcher {
    constructor(options = {}) {
      this.name = options.name || 'default';
      this.batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
      this.flushInterval = options.flushInterval || DEFAULT_FLUSH_INTERVAL;
      this.maxRetries = options.maxRetries || DEFAULT_MAX_RETRIES;
      this.processFn = options.processFn; // 배치 처리 함수

      this.queue = [];
      this.timer = null;
      this.processing = false;

      // 통계
      this.stats = {
        totalQueued: 0,
        totalProcessed: 0,
        totalFailed: 0,
        batchCount: 0
      };

      // 자동 플러시 시작
      this.startAutoFlush();

      logger.debug(`[APIBatcher] Created batcher: ${this.name}`);
    }

    /**
     * 요청을 큐에 추가
     * @param {any} data - 요청 데이터
     * @param {Object} options - 옵션 (priority, retryCount)
     * @returns {Promise} 처리 결과 Promise
     */
    add(data, options = {}) {
      return new Promise((resolve, reject) => {
        const item = {
          data,
          resolve,
          reject,
          priority: options.priority || 0,
          retryCount: options.retryCount || 0,
          timestamp: Date.now()
        };

        this.queue.push(item);
        this.stats.totalQueued++;

        logger.debug(`[APIBatcher] Added to queue: ${this.name} (size: ${this.queue.length})`);

        // 우선순위 정렬
        if (item.priority > 0) {
          this.queue.sort((a, b) => b.priority - a.priority);
        }

        // 배치 크기 도달 시 즉시 플러시
        if (this.queue.length >= this.batchSize) {
          this.flush();
        }
      });
    }

    /**
     * 큐를 즉시 플러시하여 배치 처리
     */
    async flush() {
      if (this.queue.length === 0 || this.processing) {
        return;
      }

      // 처리할 배치 추출
      const batch = this.queue.splice(0, this.batchSize);
      this.processing = true;
      this.stats.batchCount++;

      logger.info(`[APIBatcher] Flushing batch: ${this.name} (${batch.length} items)`);

      try {
        // 처리 함수 호출
        const measureId = PerformanceMonitor.startMeasure(`APIBatcher:${this.name}`);
        const results = await this.processFn(batch.map(item => item.data));
        PerformanceMonitor.endMeasure(measureId);

        // 각 요청에 결과 전달
        batch.forEach((item, index) => {
          const result = results[index];
          if (result && result.success) {
            item.resolve(result.data);
            this.stats.totalProcessed++;
          } else {
            // 재시도 처리
            if (item.retryCount < this.maxRetries) {
              logger.warn(`[APIBatcher] Retrying item (attempt ${item.retryCount + 1})`);
              this.add(item.data, { retryCount: item.retryCount + 1 });
            } else {
              item.reject(new Error(result?.error || 'Batch processing failed'));
              this.stats.totalFailed++;
            }
          }
        });

        logger.info(`[APIBatcher] Batch processed successfully: ${this.name}`);
      } catch (error) {
        logger.error(`[APIBatcher] Batch processing error: ${this.name}`, error);

        // 모든 요청 실패 처리
        batch.forEach(item => {
          if (item.retryCount < this.maxRetries) {
            this.add(item.data, { retryCount: item.retryCount + 1 });
          } else {
            item.reject(error);
            this.stats.totalFailed++;
          }
        });
      } finally {
        this.processing = false;

        // 큐에 남은 항목이 있으면 계속 처리
        if (this.queue.length > 0) {
          setTimeout(() => this.flush(), 0);
        }
      }
    }

    /**
     * 자동 플러시 시작
     */
    startAutoFlush() {
      if (this.timer) {
        clearInterval(this.timer);
      }

      this.timer = setInterval(() => {
        if (this.queue.length > 0) {
          logger.debug(`[APIBatcher] Auto-flush triggered: ${this.name}`);
          this.flush();
        }
      }, this.flushInterval);

      logger.debug(`[APIBatcher] Auto-flush started: ${this.name} (interval: ${this.flushInterval}ms)`);
    }

    /**
     * 자동 플러시 중지
     */
    stopAutoFlush() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
        logger.debug(`[APIBatcher] Auto-flush stopped: ${this.name}`);
      }
    }

    /**
     * 큐 비우기
     */
    clear() {
      this.queue.forEach(item => {
        item.reject(new Error('Queue cleared'));
      });
      this.queue = [];
      logger.warn(`[APIBatcher] Queue cleared: ${this.name}`);
    }

    /**
     * 통계 반환
     */
    getStats() {
      return {
        ...this.stats,
        queueSize: this.queue.length,
        processing: this.processing
      };
    }

    /**
     * 배처 종료
     */
    destroy() {
      this.stopAutoFlush();
      this.clear();
      logger.info(`[APIBatcher] Destroyed: ${this.name}`);
    }
  }

  /**
   * 배처 인스턴스 가져오기 (없으면 생성)
   * @param {string} name - 배처 이름
   * @param {Object} options - 배처 옵션
   * @returns {Batcher}
   */
  function getBatcher(name = 'default', options = {}) {
    if (!batchers.has(name)) {
      batchers.set(name, new Batcher({ name, ...options }));
    }
    return batchers.get(name);
  }

  /**
   * 전체 배처 플러시
   */
  function flushAll() {
    for (const batcher of batchers.values()) {
      batcher.flush();
    }
    logger.info('[APIBatcher] Flushed all batchers');
  }

  /**
   * 전체 배처 통계
   */
  function getAllStats() {
    const stats = {};
    for (const [name, batcher] of batchers.entries()) {
      stats[name] = batcher.getStats();
    }
    return stats;
  }

  /**
   * 배처 제거
   */
  function removeBatcher(name) {
    const batcher = batchers.get(name);
    if (batcher) {
      batcher.destroy();
      batchers.delete(name);
      logger.info(`[APIBatcher] Removed batcher: ${name}`);
    }
  }

  // Public API
  return {
    getBatcher,
    flushAll,
    getAllStats,
    removeBatcher
  };
})();

// 전역 단축키
window.apiBatcher = APIBatcher.getBatcher('default');
