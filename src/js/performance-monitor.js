/**
 * ============================================
 * Performance Monitor - 성능 모니터링 시스템
 * Version: 1.0.0
 * ============================================
 *
 * 앱 성능을 실시간으로 모니터링하고 병목 지점 파악
 *
 * 기능:
 * - 함수 실행 시간 측정
 * - API 호출 성능 추적
 * - 메모리 사용량 모니터링
 * - 성능 보고서 생성
 */

window.PerformanceMonitor = (function() {
  'use strict';

  // 성능 데이터 저장소
  const metrics = {
    functionCalls: new Map(),
    apiCalls: new Map(),
    memorySnapshots: []
  };

  // 활성 측정 세션
  const activeMeasures = new Map();

  /**
   * 함수 실행 시간 측정 시작
   * @param {string} label - 측정 레이블
   * @returns {string} measureId
   */
  function startMeasure(label) {
    const measureId = `${label}_${Date.now()}_${Math.random()}`;
    activeMeasures.set(measureId, {
      label,
      startTime: performance.now(),
      startMemory: getMemoryUsage()
    });
    return measureId;
  }

  /**
   * 함수 실행 시간 측정 종료
   * @param {string} measureId - 측정 ID
   */
  function endMeasure(measureId) {
    const measure = activeMeasures.get(measureId);
    if (!measure) {
      logger.warn(`[PerformanceMonitor] Measure not found: ${measureId}`);
      return;
    }

    const duration = performance.now() - measure.startTime;
    const endMemory = getMemoryUsage();
    const memoryDelta = endMemory - measure.startMemory;

    // 통계 저장
    if (!metrics.functionCalls.has(measure.label)) {
      metrics.functionCalls.set(measure.label, []);
    }

    metrics.functionCalls.get(measure.label).push({
      duration,
      memoryDelta,
      timestamp: Date.now()
    });

    activeMeasures.delete(measureId);

    logger.debug(`[PerformanceMonitor] ${measure.label}: ${duration.toFixed(2)}ms`);

    // 느린 함수 경고 (100ms 이상)
    if (duration > 100) {
      logger.warn(`[PerformanceMonitor] Slow function: ${measure.label} (${duration.toFixed(2)}ms)`);
    }
  }

  /**
   * 함수를 래핑하여 자동 측정
   * @param {Function} fn - 측정할 함수
   * @param {string} label - 측정 레이블
   * @returns {Function} 래핑된 함수
   */
  function measureFunction(fn, label) {
    return function(...args) {
      const measureId = startMeasure(label);
      try {
        const result = fn.apply(this, args);

        // Promise 처리
        if (result && typeof result.then === 'function') {
          return result.finally(() => endMeasure(measureId));
        }

        endMeasure(measureId);
        return result;
      } catch (error) {
        endMeasure(measureId);
        throw error;
      }
    };
  }

  /**
   * API 호출 성능 추적
   * @param {string} endpoint - API 엔드포인트
   * @param {number} duration - 응답 시간 (ms)
   * @param {boolean} success - 성공 여부
   */
  function trackAPICall(endpoint, duration, success = true) {
    if (!metrics.apiCalls.has(endpoint)) {
      metrics.apiCalls.set(endpoint, {
        calls: [],
        totalCalls: 0,
        successCount: 0,
        failCount: 0
      });
    }

    const apiMetric = metrics.apiCalls.get(endpoint);
    apiMetric.calls.push({ duration, success, timestamp: Date.now() });
    apiMetric.totalCalls++;

    if (success) {
      apiMetric.successCount++;
    } else {
      apiMetric.failCount++;
    }

    // 최근 100개만 유지
    if (apiMetric.calls.length > 100) {
      apiMetric.calls = apiMetric.calls.slice(-100);
    }

    logger.debug(`[PerformanceMonitor] API ${endpoint}: ${duration.toFixed(2)}ms`);

    // 느린 API 경고 (500ms 이상)
    if (duration > 500) {
      logger.warn(`[PerformanceMonitor] Slow API: ${endpoint} (${duration.toFixed(2)}ms)`);
    }
  }

  /**
   * 메모리 사용량 가져오기
   * @returns {number} 메모리 사용량 (MB)
   */
  function getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize / 1048576; // MB 단위
    }
    return 0;
  }

  /**
   * 메모리 스냅샷 저장
   */
  function captureMemorySnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      usedMemory: getMemoryUsage(),
      totalMemory: performance.memory ? performance.memory.totalJSHeapSize / 1048576 : 0
    };

    metrics.memorySnapshots.push(snapshot);

    // 최근 100개만 유지
    if (metrics.memorySnapshots.length > 100) {
      metrics.memorySnapshots = metrics.memorySnapshots.slice(-100);
    }

    return snapshot;
  }

  /**
   * 함수 성능 통계 계산
   * @param {string} label - 함수 레이블
   * @returns {Object} 통계 객체
   */
  function getFunctionStats(label) {
    const data = metrics.functionCalls.get(label);
    if (!data || data.length === 0) {
      return null;
    }

    const durations = data.map(d => d.duration);
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const sorted = [...durations].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      count: durations.length,
      avg: avg.toFixed(2),
      min: Math.min(...durations).toFixed(2),
      max: Math.max(...durations).toFixed(2),
      p50: p50.toFixed(2),
      p95: p95.toFixed(2),
      p99: p99.toFixed(2)
    };
  }

  /**
   * API 성능 통계 계산
   * @param {string} endpoint - API 엔드포인트
   * @returns {Object} 통계 객체
   */
  function getAPIStats(endpoint) {
    const data = metrics.apiCalls.get(endpoint);
    if (!data || data.calls.length === 0) {
      return null;
    }

    const durations = data.calls.map(c => c.duration);
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const sorted = [...durations].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    return {
      totalCalls: data.totalCalls,
      successRate: `${((data.successCount / data.totalCalls) * 100).toFixed(2)}%`,
      avgDuration: avg.toFixed(2),
      p95Duration: p95.toFixed(2),
      maxDuration: Math.max(...durations).toFixed(2)
    };
  }

  /**
   * 전체 성능 보고서 생성
   * @returns {Object} 성능 보고서
   */
  function generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      functions: {},
      apis: {},
      memory: {
        current: getMemoryUsage().toFixed(2),
        snapshots: metrics.memorySnapshots.length
      }
    };

    // 함수 통계
    for (const [label, _] of metrics.functionCalls) {
      report.functions[label] = getFunctionStats(label);
    }

    // API 통계
    for (const [endpoint, _] of metrics.apiCalls) {
      report.apis[endpoint] = getAPIStats(endpoint);
    }

    return report;
  }

  /**
   * 보고서 콘솔 출력
   */
  function printReport() {
    const report = generateReport();

    console.log('=== Performance Report ===');
    console.log(`Generated at: ${report.timestamp}`);
    console.log(`Memory: ${report.memory.current}MB`);
    console.log('\n--- Function Performance ---');
    console.table(report.functions);
    console.log('\n--- API Performance ---');
    console.table(report.apis);
  }

  /**
   * 메트릭 초기화
   */
  function clearMetrics() {
    metrics.functionCalls.clear();
    metrics.apiCalls.clear();
    metrics.memorySnapshots = [];
    logger.info('[PerformanceMonitor] Metrics cleared');
  }

  /**
   * 주기적인 메모리 모니터링 시작
   */
  function startMemoryMonitoring(interval = 10000) {
    setInterval(() => {
      captureMemorySnapshot();
    }, interval);
    logger.info(`[PerformanceMonitor] Memory monitoring started (interval: ${interval}ms)`);
  }

  // 자동 메모리 모니터링 시작 (10초마다)
  startMemoryMonitoring();

  // Public API
  return {
    startMeasure,
    endMeasure,
    measureFunction,
    trackAPICall,
    getMemoryUsage,
    captureMemorySnapshot,
    getFunctionStats,
    getAPIStats,
    generateReport,
    printReport,
    clearMetrics
  };
})();

// 전역 단축키
window.perf = PerformanceMonitor;
