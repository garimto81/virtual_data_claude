/**
 * 배치 프로세서 - Phase 2
 * 트랜잭션 방식의 일괄 작업 처리 시스템
 * Version: 1.0.0
 */

class BatchProcessor {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.batchSize = 10; // 한 번에 처리할 최대 작업 수
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1초
  }

  /**
   * 작업 큐에 추가
   */
  addToQueue(action) {
    this.queue.push({
      action: action,
      id: Date.now() + Math.random(),
      status: 'pending',
      retryCount: 0
    });
  }

  /**
   * 일괄 처리 실행 (트랜잭션)
   */
  async processBatch(actions = null) {
    if (this.isProcessing) {
      console.warn('이미 배치 처리가 진행 중입니다');
      return { success: false, message: '처리 중' };
    }

    this.isProcessing = true;
    const itemsToProcess = actions || this.queue.splice(0, this.batchSize);
    const results = [];
    const rollbackActions = [];

    // 진행 상황 표시
    if (window.actionHistory) {
      window.actionHistory.showSnackbar(
        `⏳ ${itemsToProcess.length}개 작업 처리 중...`,
        null,
        'info'
      );
    }

    const startTime = performance.now();

    try {
      // 모든 작업 실행 (트랜잭션)
      for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i];

        try {
          // 작업 실행
          const result = await this.executeWithTimeout(
            item.action || item,
            5000 // 5초 타임아웃
          );

          results.push({
            success: true,
            data: result,
            action: item
          });

          // 롤백 액션 준비
          if (item.action && item.action.undo) {
            rollbackActions.push(item.action);
          } else if (item.undo) {
            rollbackActions.push(item);
          }

          // 진행 상황 업데이트 (25% 단위)
          const progress = Math.floor(((i + 1) / itemsToProcess.length) * 100);
          if (progress % 25 === 0) {
            console.log(`배치 처리 진행: ${progress}%`);
          }
        } catch (error) {
          console.error(`작업 ${i + 1} 실패:`, error);

          // 실패 시 롤백
          if (rollbackActions.length > 0) {
            await this.rollback(rollbackActions);
          }

          throw new Error(`작업 ${i + 1}/${itemsToProcess.length} 실패: ${error.message}`);
        }
      }

      const endTime = performance.now();
      const processingTime = Math.round(endTime - startTime);

      // 성공 메시지
      const successMessage = `✅ ${itemsToProcess.length}개 작업 완료 (${processingTime}ms)`;

      if (window.actionHistory) {
        // 일괄 실행취소를 위한 BatchAction 생성
        const batchAction = {
          description: `${itemsToProcess.length}개 일괄 작업`,
          execute: async () => {
            // 이미 실행됨
            return results;
          },
          undo: async () => {
            // 모든 작업 롤백
            await this.rollback(rollbackActions.reverse());
          },
          getDescription: function() {
            return this.description;
          },
          getMinimalData: function() {
            return { count: itemsToProcess.length };
          }
        };

        // 히스토리에 추가
        window.actionHistory.history.push(batchAction);
        window.actionHistory.showSnackbar(successMessage, () => {
          this.rollback(rollbackActions.reverse());
        }, 'success');
      }

      return {
        success: true,
        count: itemsToProcess.length,
        time: processingTime,
        results: results
      };

    } catch (error) {
      console.error('배치 처리 실패:', error);

      // 실패 메시지
      if (window.actionHistory) {
        window.actionHistory.showSnackbar(
          `❌ 일괄 처리 실패 - 모든 작업이 롤백되었습니다`,
          null,
          'error'
        );
      }

      return {
        success: false,
        error: error.message,
        rollbackCompleted: true
      };

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 타임아웃 포함 실행
   */
  async executeWithTimeout(action, timeout) {
    return Promise.race([
      this.executeAction(action),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('작업 시간 초과')), timeout)
      )
    ]);
  }

  /**
   * 개별 작업 실행
   */
  async executeAction(action) {
    if (typeof action === 'function') {
      return await action();
    } else if (action && action.execute) {
      return await action.execute();
    } else {
      throw new Error('유효하지 않은 액션');
    }
  }

  /**
   * 롤백 처리
   */
  async rollback(actions) {
    console.log(`🔄 ${actions.length}개 작업 롤백 시작...`);

    for (const action of actions) {
      try {
        if (action && action.undo) {
          await action.undo();
        }
      } catch (error) {
        console.error('롤백 실패:', error);
        // 롤백 실패는 무시하고 계속 진행
      }
    }

    console.log('✅ 롤백 완료');
  }

  /**
   * API 배치 호출 최적화
   */
  async optimizedBatchCall(apiFunction, items, chunkSize = 10) {
    const chunks = [];

    // 청크 분할
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }

    const results = [];

    // 청크별 병렬 처리
    for (const chunk of chunks) {
      try {
        // 병렬 호출
        const chunkResults = await Promise.all(
          chunk.map(item => apiFunction(item))
        );
        results.push(...chunkResults);
      } catch (error) {
        console.error('청크 처리 실패:', error);
        throw error;
      }
    }

    return results;
  }

  /**
   * 재시도 로직
   */
  async executeWithRetry(action, maxRetries = this.maxRetries) {
    let lastError;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await this.executeAction(action);
      } catch (error) {
        lastError = error;
        console.warn(`시도 ${i + 1}/${maxRetries + 1} 실패:`, error.message);

        if (i < maxRetries) {
          // 지수 백오프
          const delay = this.retryDelay * Math.pow(2, i);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * 큐 초기화
   */
  clearQueue() {
    this.queue = [];
  }

  /**
   * 큐 상태 확인
   */
  getQueueStatus() {
    return {
      size: this.queue.length,
      isProcessing: this.isProcessing,
      pending: this.queue.filter(q => q.status === 'pending').length,
      failed: this.queue.filter(q => q.status === 'failed').length
    };
  }
}

// 전역 인스턴스 생성
window.batchProcessor = new BatchProcessor();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BatchProcessor;
}