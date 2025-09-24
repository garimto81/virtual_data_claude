// ========================================
// Phase 4: API 호출 함수 보호 시스템 (Enhanced)
// ========================================
// 버전: v4.2.0
// 최종 업데이트: 2025-09-24
// 목적: 안정적이고 견고한 Apps Script API 호출 보호

console.log('📦 Phase 4 Enhanced Functions 로드 시작...');

// ==================== 전역 상수 ====================
const API_CALL_CONFIG = {
  MAX_RETRIES: 3,
  BASE_TIMEOUT: 30000,  // 30초
  RETRY_DELAY_BASE: 1000,  // 1초
  MAX_RETRY_DELAY: 5000,   // 5초 최대
  MAX_CONCURRENT_CALLS: 5,
  CALL_HISTORY_LIMIT: 100,
  CONNECTION_CHECK_INTERVAL: 30000  // 30초마다 연결 상태 확인
};

// ==================== URL 검증 함수 ====================
function validateAppsScriptUrl(url) {
  if (!url || typeof url !== 'string') {
    console.warn('❌ URL 검증 실패: URL이 문자열이 아님', typeof url);
    return false;
  }
  
  const urlPattern = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
  const isValid = urlPattern.test(url);
  
  if (!isValid) {
    console.warn('❌ URL 검증 실패: 패턴 불일치', url);
  }
  
  return isValid;
}

// ==================== 강화된 URL 검증 래퍼 함수 ====================
window.ensureAppsScriptUrl = function(options = {}) {
  const { 
    throwOnError = true, 
    checkNetwork = true, 
    logDetails = false 
  } = options;
  
  const checks = [];
  
  try {
    if (logDetails) {
      console.group('🔍 ensureAppsScriptUrl 상세 검증');
    }

    // 1. APP_CONFIG 존재 여부 확인
    if (!window.APP_CONFIG) {
      checks.push({ name: 'APP_CONFIG', status: 'fail', message: 'APP_CONFIG가 초기화되지 않았습니다.' });
      if (throwOnError) throw new Error('APP_CONFIG가 초기화되지 않았습니다.');
      return false;
    }
    checks.push({ name: 'APP_CONFIG', status: 'pass' });

    // 2. Apps Script URL 존재 여부 확인
    if (!window.APP_CONFIG.appsScriptUrl) {
      checks.push({ name: 'URL_EXISTS', status: 'fail', message: 'Apps Script URL이 설정되지 않았습니다.' });
      if (throwOnError) throw new Error('Apps Script URL이 설정되지 않았습니다. 설정 화면에서 URL을 입력하세요.');
      return false;
    }
    checks.push({ name: 'URL_EXISTS', status: 'pass', value: window.APP_CONFIG.appsScriptUrl });

    // 3. URL 형식 유효성 검사
    if (!validateAppsScriptUrl(window.APP_CONFIG.appsScriptUrl)) {
      checks.push({ name: 'URL_FORMAT', status: 'fail', message: 'URL 형식이 올바르지 않습니다.' });
      if (throwOnError) throw new Error('올바르지 않은 Apps Script URL입니다. 설정을 다시 확인하세요.');
      return false;
    }
    checks.push({ name: 'URL_FORMAT', status: 'pass' });

    // 4. 앱 초기화 상태 확인
    if (!window.APP_CONFIG.isInitialized) {
      checks.push({ name: 'APP_INITIALIZED', status: 'warn', message: '앱이 초기화되지 않았습니다.' });
      // 초기화 중일 수 있으므로 경고로만 처리
      console.warn('⚠️ 앱이 초기화되지 않았지만 API 호출을 허용합니다.');
    } else {
      checks.push({ name: 'APP_INITIALIZED', status: 'pass' });
    }

    // 5. 네트워크 연결 상태 확인 (옵션)
    if (checkNetwork) {
      const isOnline = window.APP_CONFIG.state?.isOnline ?? navigator.onLine;
      if (!isOnline) {
        checks.push({ name: 'NETWORK_ONLINE', status: 'fail', message: '인터넷 연결이 끊어졌습니다.' });
        if (throwOnError) throw new Error('인터넷 연결이 끊어졌습니다. 네트워크 상태를 확인하세요.');
        return false;
      }
      checks.push({ name: 'NETWORK_ONLINE', status: 'pass' });
    }

    // 6. 전역 스코프 접근 확인
    if (typeof window === 'undefined') {
      checks.push({ name: 'GLOBAL_SCOPE', status: 'fail', message: '전역 스코프에 접근할 수 없습니다.' });
      if (throwOnError) throw new Error('전역 스코프에 접근할 수 없습니다.');
      return false;
    }
    checks.push({ name: 'GLOBAL_SCOPE', status: 'pass' });

    if (logDetails) {
      console.table(checks);
      console.groupEnd();
    }

    return window.APP_CONFIG.appsScriptUrl;

  } catch (error) {
    if (logDetails) {
      console.error('❌ ensureAppsScriptUrl 검증 실패:', error);
      console.table(checks);
      console.groupEnd();
    }
    throw error;
  }
};

// ==================== 강화된 보호된 API 호출 시스템 ====================
window.protectedApiCall = async function(action, data = {}, options = {}) {
  const {
    showProgress = true,
    progressMessage = `${action} 처리 중...`,
    retryCount = API_CALL_CONFIG.MAX_RETRIES,
    timeout = API_CALL_CONFIG.BASE_TIMEOUT,
    enableCache = false,
    cacheKey = null,
    priority = 'normal',  // 'high', 'normal', 'low'
    onProgress = null,
    onRetry = null
  } = options;

  const callId = window.ApiCallManager.startCall(action, data, options);
  const startTime = Date.now();

  try {
    console.log(`🛡️ protectedApiCall 시작 [${callId}]: ${action}`, { data, options });

    // 1. 전역 상태 및 URL 검증
    const url = window.ensureAppsScriptUrl({ 
      logDetails: false, 
      checkNetwork: true 
    });

    // 2. 동시 호출 제한 확인
    if (window.ApiCallManager.getActiveCallCount() >= API_CALL_CONFIG.MAX_CONCURRENT_CALLS) {
      if (priority !== 'high') {
        throw new Error('동시 API 호출 제한 초과. 잠시 후 다시 시도해주세요.');
      }
    }

    // 3. 캐시 확인 (옵션)
    if (enableCache && cacheKey) {
      const cachedResult = window.ApiCallManager.getCachedResult(cacheKey);
      if (cachedResult) {
        console.log(`📋 캐시된 결과 반환 [${callId}]: ${action}`);
        window.ApiCallManager.completeCall(callId, true, cachedResult);
        return cachedResult;
      }
    }

    // 4. 진행 상황 표시
    if (showProgress && typeof onProgress === 'function') {
      onProgress({ phase: 'start', message: progressMessage });
    }

    // 5. 재시도 로직이 포함된 API 호출
    let lastError = null;
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const attemptStartTime = Date.now();
        console.log(`📤 API 호출 시도 ${attempt}/${retryCount} [${callId}]: ${action}`);

        // 진행 상황 업데이트
        if (showProgress && typeof onProgress === 'function') {
          onProgress({ 
            phase: 'calling', 
            attempt, 
            totalAttempts: retryCount,
            message: `${progressMessage} (${attempt}/${retryCount})` 
          });
        }

        // fetchFromAppsScript 함수 존재 확인
        if (typeof fetchFromAppsScript !== 'function') {
          throw new Error('fetchFromAppsScript 함수를 찾을 수 없습니다. 앱이 완전히 로드되지 않았을 수 있습니다.');
        }

        // 타임아웃이 포함된 API 호출
        const result = await Promise.race([
          fetchFromAppsScript(action, data),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('API 호출 타임아웃')), timeout)
          )
        ]);

        const responseTime = Date.now() - attemptStartTime;
        console.log(`✅ API 호출 성공 [${callId}]: ${action} (${responseTime}ms)`);

        // 캐시 저장 (옵션)
        if (enableCache && cacheKey) {
          window.ApiCallManager.setCachedResult(cacheKey, result);
        }

        // 성공 완료
        window.ApiCallManager.completeCall(callId, true, result);

        if (showProgress && typeof onProgress === 'function') {
          onProgress({ 
            phase: 'success', 
            message: '완료됨',
            responseTime 
          });
        }

        return result;

      } catch (error) {
        lastError = error;
        const responseTime = Date.now() - attemptStartTime;
        
        console.error(`❌ API 호출 실패 ${attempt}/${retryCount} [${callId}]:`, {
          error: error.message,
          responseTime,
          action,
          attempt
        });

        // 재시도 가능한 에러인지 확인
        const isRetryableError = isRetryable(error);
        
        if (attempt < retryCount && isRetryableError) {
          // 지수적 백오프 계산
          const retryDelay = Math.min(
            API_CALL_CONFIG.RETRY_DELAY_BASE * Math.pow(2, attempt - 1),
            API_CALL_CONFIG.MAX_RETRY_DELAY
          );
          
          console.log(`⏳ ${retryDelay}ms 후 재시도... [${callId}]`);

          // 재시도 콜백 호출
          if (typeof onRetry === 'function') {
            onRetry({ attempt, totalAttempts: retryCount, delay: retryDelay, error });
          }

          if (showProgress && typeof onProgress === 'function') {
            onProgress({ 
              phase: 'retry', 
              attempt,
              totalAttempts: retryCount,
              delay: retryDelay,
              message: `재시도 중... (${retryDelay}ms 대기)` 
            });
          }

          // 재시도 지연
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        // 재시도 불가능하거나 최대 시도 횟수 도달
        break;
      }
    }

    // 모든 재시도 실패
    const totalTime = Date.now() - startTime;
    const finalError = new Error(
      `API 호출 최종 실패 (${action}): ${lastError?.message || '알 수 없는 오류'}`
    );
    finalError.originalError = lastError;
    finalError.callId = callId;
    finalError.totalTime = totalTime;
    finalError.attempts = retryCount;

    console.error(`💥 API 호출 최종 실패 [${callId}]:`, {
      action,
      totalTime,
      attempts: retryCount,
      finalError: lastError?.message
    });

    window.ApiCallManager.completeCall(callId, false, null, finalError);

    if (showProgress && typeof onProgress === 'function') {
      onProgress({ 
        phase: 'error', 
        message: '호출 실패',
        error: finalError 
      });
    }

    throw finalError;

  } catch (error) {
    // 예기치 못한 오류 처리
    const totalTime = Date.now() - startTime;
    console.error(`💥 protectedApiCall 예외 [${callId}]:`, error);
    
    window.ApiCallManager.completeCall(callId, false, null, error);
    
    if (showProgress && typeof onProgress === 'function') {
      onProgress({ 
        phase: 'error', 
        message: '예기치 못한 오류',
        error 
      });
    }

    throw error;
  }
};

// 재시도 가능한 에러인지 판단하는 함수
function isRetryable(error) {
  const message = error.message.toLowerCase();
  
  // 재시도 가능한 에러 패턴
  const retryablePatterns = [
    'timeout', 'network', 'connection', 'disconnected',
    'temporary', 'service unavailable', '503', '502', '504',
    'rate limit', 'too many requests', '429'
  ];
  
  // 재시도 불가능한 에러 패턴
  const nonRetryablePatterns = [
    '400', '401', '403', '404', '422',
    'unauthorized', 'forbidden', 'not found',
    'validation', 'invalid', 'malformed'
  ];
  
  // 재시도 불가능한 에러 먼저 확인
  if (nonRetryablePatterns.some(pattern => message.includes(pattern))) {
    return false;
  }
  
  // 재시도 가능한 에러 확인
  if (retryablePatterns.some(pattern => message.includes(pattern))) {
    return true;
  }
  
  // 기본적으로 재시도 허용 (네트워크 오류일 가능성)
  return true;
}

// ==================== 확장된 API 호출 관리자 ====================
window.ApiCallManager = {
  // 기본 속성
  activeCalls: new Map(),  // Set -> Map으로 변경하여 더 효율적인 조회
  callHistory: [],
  cache: new Map(),
  performanceMetrics: {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    totalResponseTime: 0,
    slowestCall: { action: null, duration: 0 },
    fastestCall: { action: null, duration: Infinity }
  },
  
  // 설정
  config: {
    maxHistorySize: API_CALL_CONFIG.CALL_HISTORY_LIMIT,
    maxCacheSize: 50,
    cacheExpireTime: 5 * 60 * 1000,  // 5분
    performanceThreshold: 3000,  // 3초 이상은 느린 호출
    enableMetrics: true,
    enableCache: true
  },

  // 호출 시작
  startCall(action, data = {}, options = {}) {
    const callId = `${action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const callInfo = {
      id: callId,
      action,
      data,
      options,
      startTime: Date.now(),
      status: 'running',
      priority: options.priority || 'normal',
      timeout: options.timeout || API_CALL_CONFIG.BASE_TIMEOUT
    };

    this.activeCalls.set(callId, callInfo);
    
    if (this.config.enableMetrics) {
      this.performanceMetrics.totalCalls++;
    }

    console.log(`🚀 API 호출 시작 [${callId}]: ${action}`, {
      priority: callInfo.priority,
      activeCount: this.activeCalls.size
    });

    return callId;
  },

  // 호출 완료
  completeCall(callId, success = true, result = null, error = null) {
    const callInfo = this.activeCalls.get(callId);

    if (callInfo) {
      const endTime = Date.now();
      callInfo.endTime = endTime;
      callInfo.duration = endTime - callInfo.startTime;
      callInfo.status = success ? 'success' : 'failed';
      callInfo.result = result;
      callInfo.error = error;

      // 활성 호출에서 제거
      this.activeCalls.delete(callId);
      
      // 히스토리에 추가
      this.callHistory.push({ ...callInfo });

      // 히스토리 크기 제한
      if (this.callHistory.length > this.config.maxHistorySize) {
        this.callHistory.shift();
      }

      // 성능 메트릭 업데이트
      if (this.config.enableMetrics) {
        this.updatePerformanceMetrics(callInfo, success);
      }

      // 로그 출력
      const statusEmoji = success ? '✅' : '❌';
      const perfFlag = callInfo.duration > this.config.performanceThreshold ? '🐌' : '';
      
      console.log(`${statusEmoji} API 호출 완료 [${callId}]: ${callInfo.action} (${callInfo.duration}ms) ${perfFlag}`);

      // 느린 호출 경고
      if (callInfo.duration > this.config.performanceThreshold) {
        console.warn(`⚠️ 느린 API 호출 감지 [${callId}]: ${callInfo.action} - ${callInfo.duration}ms`);
      }
    }
  },

  // 성능 메트릭 업데이트
  updatePerformanceMetrics(callInfo, success) {
    const metrics = this.performanceMetrics;
    
    if (success) {
      metrics.successfulCalls++;
      metrics.totalResponseTime += callInfo.duration;

      // 최소/최대 응답 시간 추적
      if (callInfo.duration > metrics.slowestCall.duration) {
        metrics.slowestCall = {
          action: callInfo.action,
          duration: callInfo.duration,
          callId: callInfo.id
        };
      }

      if (callInfo.duration < metrics.fastestCall.duration) {
        metrics.fastestCall = {
          action: callInfo.action,
          duration: callInfo.duration,
          callId: callInfo.id
        };
      }
    } else {
      metrics.failedCalls++;
    }
  },

  // 캐시 관련 메서드
  setCachedResult(key, result, expireTime = null) {
    if (!this.config.enableCache) return;

    const cacheEntry = {
      result,
      timestamp: Date.now(),
      expireTime: expireTime || (Date.now() + this.config.cacheExpireTime)
    };

    this.cache.set(key, cacheEntry);

    // 캐시 크기 제한
    if (this.cache.size > this.config.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    console.log(`📋 결과 캐시됨: ${key}`);
  },

  getCachedResult(key) {
    if (!this.config.enableCache) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    // 만료 확인
    if (Date.now() > entry.expireTime) {
      this.cache.delete(key);
      console.log(`📋 캐시 만료: ${key}`);
      return null;
    }

    console.log(`📋 캐시 히트: ${key}`);
    return entry.result;
  },

  clearCache() {
    this.cache.clear();
    console.log('📋 캐시 모두 삭제됨');
  },

  // 활성 호출 관리
  getActiveCallCount() {
    return this.activeCalls.size;
  },

  getActiveCallsByPriority() {
    const calls = Array.from(this.activeCalls.values());
    return {
      high: calls.filter(call => call.priority === 'high').length,
      normal: calls.filter(call => call.priority === 'normal').length,
      low: calls.filter(call => call.priority === 'low').length
    };
  },

  cancelCall(callId) {
    const callInfo = this.activeCalls.get(callId);
    if (callInfo) {
      callInfo.status = 'cancelled';
      this.activeCalls.delete(callId);
      console.log(`🚫 API 호출 취소됨 [${callId}]: ${callInfo.action}`);
      return true;
    }
    return false;
  },

  // 통계 및 분석
  getDetailedStats() {
    const recent = this.callHistory.slice(-20);
    const metrics = this.performanceMetrics;
    
    const successCount = recent.filter(call => call.status === 'success').length;
    const averageTime = metrics.successfulCalls > 0 ? 
      (metrics.totalResponseTime / metrics.successfulCalls) : 0;

    const actionStats = {};
    recent.forEach(call => {
      if (!actionStats[call.action]) {
        actionStats[call.action] = { count: 0, successCount: 0, totalTime: 0 };
      }
      actionStats[call.action].count++;
      if (call.status === 'success') {
        actionStats[call.action].successCount++;
        actionStats[call.action].totalTime += call.duration || 0;
      }
    });

    return {
      // 기본 통계
      totalCalls: metrics.totalCalls,
      successfulCalls: metrics.successfulCalls,
      failedCalls: metrics.failedCalls,
      activeCalls: this.activeCalls.size,
      
      // 성능 통계
      averageResponseTime: Math.round(averageTime),
      recentSuccessRate: recent.length > 0 ? (successCount / recent.length) * 100 : 0,
      slowestCall: metrics.slowestCall,
      fastestCall: metrics.fastestCall.duration < Infinity ? metrics.fastestCall : null,
      
      // 액션별 통계
      actionStats,
      
      // 시스템 상태
      cacheSize: this.cache.size,
      historySize: this.callHistory.length,
      systemHealth: this.getSystemHealth()
    };
  },

  // 시스템 상태 평가
  getSystemHealth() {
    const metrics = this.performanceMetrics;
    const successRate = metrics.totalCalls > 0 ? 
      (metrics.successfulCalls / metrics.totalCalls) * 100 : 100;
    const avgResponseTime = metrics.successfulCalls > 0 ? 
      (metrics.totalResponseTime / metrics.successfulCalls) : 0;

    let health = 'excellent';
    if (successRate < 95 || avgResponseTime > 5000) health = 'poor';
    else if (successRate < 98 || avgResponseTime > 3000) health = 'fair';
    else if (successRate < 99.5 || avgResponseTime > 1500) health = 'good';

    return {
      status: health,
      successRate: Math.round(successRate * 10) / 10,
      averageResponseTime: Math.round(avgResponseTime)
    };
  },

  // 디버깅 및 모니터링
  debug(detailed = false) {
    const stats = this.getDetailedStats();
    
    console.group('📊 API Call Manager - 종합 통계');
    console.log('🔢 총 호출 수:', stats.totalCalls);
    console.log('✅ 성공한 호출:', stats.successfulCalls);
    console.log('❌ 실패한 호출:', stats.failedCalls);
    console.log('🏃 진행 중인 호출:', stats.activeCalls);
    console.log('📈 최근 성공률:', `${stats.recentSuccessRate.toFixed(1)}%`);
    console.log('⏱️ 평균 응답 시간:', `${stats.averageResponseTime}ms`);
    console.log('🏥 시스템 상태:', `${stats.systemHealth.status} (${stats.systemHealth.successRate}%)`);
    
    if (detailed) {
      console.log('📋 캐시 크기:', stats.cacheSize);
      console.log('📚 히스토리 크기:', stats.historySize);
      console.log('🐌 가장 느린 호출:', stats.slowestCall);
      console.log('🏃‍♂️ 가장 빠른 호출:', stats.fastestCall);
      console.log('📊 액션별 통계:', stats.actionStats);
      console.log('🔧 활성 호출 (우선순위별):', this.getActiveCallsByPriority());
    }
    
    console.groupEnd();

    return stats;
  },

  // 설정 관리
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    console.log('⚙️ ApiCallManager 설정 업데이트됨:', newConfig);
  },

  // 초기화 및 정리
  reset() {
    this.activeCalls.clear();
    this.callHistory = [];
    this.clearCache();
    this.performanceMetrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalResponseTime: 0,
      slowestCall: { action: null, duration: 0 },
      fastestCall: { action: null, duration: Infinity }
    };
    console.log('🔄 ApiCallManager 초기화됨');
  }
};

// ==================== 사용자 친화적 에러 시스템 ====================
window.getUserFriendlyErrorMessage = function(error, action, context = {}) {
  console.log('💬 getUserFriendlyErrorMessage 호출됨:', error, action, context);

  const message = (error.message || error.toString()).toLowerCase();
  const originalMessage = error.message || error.toString();

  // 에러 분류 및 우선순위 처리
  const errorClassification = classifyError(error, message);
  const actionName = getActionDisplayName(action);

  // 컨텍스트 기반 맞춤 메시지
  const contextualInfo = generateContextualInfo(errorClassification, context);

  // 에러 타입별 처리
  switch (errorClassification.type) {
    case 'setup_required':
      return {
        title: '🔧 초기 설정 필요',
        message: 'Apps Script URL을 설정하지 않았습니다. 처음 사용하시는 경우 설정을 완료해주세요.',
        details: contextualInfo,
        action: 'showSetupScreen',
        actionText: '설정 화면 열기',
        secondaryAction: 'showHelp',
        secondaryActionText: '도움말 보기',
        severity: 'warning',
        canRetry: false,
        troubleshooting: [
          '1. 설정 버튼을 클릭하세요',
          '2. Google Apps Script URL을 입력하세요', 
          '3. 연결 테스트를 진행하세요'
        ]
      };

    case 'network_error':
      return {
        title: '🌐 네트워크 연결 오류',
        message: '인터넷 연결에 문제가 있습니다. 네트워크 상태를 확인해주세요.',
        details: `${actionName} 작업 중 연결이 끊어졌습니다. ${contextualInfo}`,
        action: 'checkConnection',
        actionText: '연결 상태 확인',
        secondaryAction: 'retry',
        secondaryActionText: '다시 시도',
        severity: 'error',
        canRetry: true,
        troubleshooting: [
          '1. WiFi나 인터넷 연결을 확인하세요',
          '2. 방화벽이나 보안 소프트웨어를 확인하세요',
          '3. 잠시 후 다시 시도해보세요'
        ]
      };

    case 'permission_error':
      return {
        title: '🔒 접근 권한 오류',
        message: 'Google Sheets에 접근할 권한이 없습니다. 권한을 확인해주세요.',
        details: `${actionName} 작업을 위해 추가 권한이 필요합니다. ${contextualInfo}`,
        action: 'checkPermissions',
        actionText: '권한 설정 확인',
        secondaryAction: 'showSetupScreen',
        secondaryActionText: '설정 다시하기',
        severity: 'error',
        canRetry: true,
        troubleshooting: [
          '1. Google 계정에 로그인되어 있는지 확인하세요',
          '2. Apps Script 권한을 다시 승인해보세요',
          '3. 시트의 공유 설정을 확인하세요'
        ]
      };

    case 'url_error':
      return {
        title: '🔗 URL 설정 오류',
        message: 'Apps Script URL이 올바르지 않거나 더 이상 유효하지 않습니다.',
        details: `현재 URL: ${context.url || '(설정되지 않음)'}. ${contextualInfo}`,
        action: 'showSetupScreen',
        actionText: 'URL 다시 설정',
        secondaryAction: 'validateUrl',
        secondaryActionText: 'URL 검증',
        severity: 'error',
        canRetry: false,
        troubleshooting: [
          '1. Apps Script가 올바르게 배포되었는지 확인하세요',
          '2. 배포 URL이 /exec로 끝나는지 확인하세요',
          '3. 새로운 배포를 생성해보세요'
        ]
      };

    case 'timeout_error':
      return {
        title: '⏰ 응답 시간 초과',
        message: '서버 응답이 너무 오래 걸렸습니다. 서버가 일시적으로 과부하일 수 있습니다.',
        details: `${actionName} 작업이 시간 초과되었습니다. ${contextualInfo}`,
        action: 'retry',
        actionText: '다시 시도',
        secondaryAction: 'checkStatus',
        secondaryActionText: '서버 상태 확인',
        severity: 'warning',
        canRetry: true,
        troubleshooting: [
          '1. 잠시 후 다시 시도해보세요',
          '2. 대량의 데이터를 처리 중인 경우 시간이 더 걸릴 수 있습니다',
          '3. 브라우저를 새로고침해보세요'
        ]
      };

    case 'server_error':
      return {
        title: '🛠️ 서버 오류',
        message: 'Google Apps Script 서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        details: `서버 오류 (${errorClassification.httpStatus}): ${contextualInfo}`,
        action: 'retry',
        actionText: '다시 시도',
        secondaryAction: 'reportIssue',
        secondaryActionText: '문제 신고',
        severity: 'error',
        canRetry: true,
        troubleshooting: [
          '1. Google Apps Script 서비스 상태를 확인하세요',
          '2. 5-10분 후 다시 시도해보세요',
          '3. 계속 오류가 발생하면 문제를 신고해주세요'
        ]
      };

    case 'rate_limit_error':
      return {
        title: '🚦 사용량 제한 초과',
        message: 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        details: `${actionName} 작업이 사용량 제한에 걸렸습니다. ${contextualInfo}`,
        action: 'waitAndRetry',
        actionText: '잠시 후 재시도',
        secondaryAction: 'showUsageInfo',
        secondaryActionText: '사용량 정보',
        severity: 'warning',
        canRetry: true,
        waitTime: 60000,  // 1분 대기
        troubleshooting: [
          '1. 1분 정도 기다린 후 다시 시도하세요',
          '2. 너무 빠르게 연속 요청을 보내지 마세요',
          '3. 필요하다면 데이터를 나누어 처리하세요'
        ]
      };

    case 'validation_error':
      return {
        title: '📝 데이터 검증 오류',
        message: '입력하신 데이터에 문제가 있습니다. 데이터를 확인하고 다시 시도해주세요.',
        details: `${actionName}에 필요한 데이터 형식이 올바르지 않습니다. ${contextualInfo}`,
        action: 'fixData',
        actionText: '데이터 수정',
        secondaryAction: 'showDataFormat',
        secondaryActionText: '형식 안내',
        severity: 'warning',
        canRetry: false,
        troubleshooting: [
          '1. 필수 필드가 모두 입력되었는지 확인하세요',
          '2. 숫자 필드에 올바른 숫자가 입력되었는지 확인하세요',
          '3. 특수 문자나 공백이 문제가 되지 않는지 확인하세요'
        ]
      };

    default:
      return {
        title: `❌ ${actionName} 실패`,
        message: '예기치 못한 오류가 발생했습니다.',
        details: `오류 내용: ${originalMessage}. ${contextualInfo}`,
        action: 'retry',
        actionText: '다시 시도',
        secondaryAction: 'reportIssue',
        secondaryActionText: '문제 신고',
        severity: 'error',
        canRetry: true,
        troubleshooting: [
          '1. 페이지를 새로고침해보세요',
          '2. 브라우저 캐시를 삭제해보세요',
          '3. 문제가 계속되면 신고해주세요'
        ]
      };
  }
};

// 에러 분류 함수
function classifyError(error, message) {
  // HTTP 상태 코드 추출
  const httpStatusMatch = message.match(/http[s]?\s*(\d{3})|(\d{3})\s*error/i);
  const httpStatus = httpStatusMatch ? parseInt(httpStatusMatch[1] || httpStatusMatch[2]) : null;

  // URL 관련 에러
  if (message.includes('url') && (message.includes('설정') || message.includes('not set'))) {
    return { type: 'setup_required', category: 'configuration' };
  }

  if (message.includes('url') && (message.includes('올바르지') || message.includes('invalid'))) {
    return { type: 'url_error', category: 'configuration', httpStatus };
  }

  // 네트워크 관련 에러
  if (message.includes('network') || message.includes('네트워크') || 
      message.includes('connection') || message.includes('연결') ||
      message.includes('offline') || message.includes('disconnected')) {
    return { type: 'network_error', category: 'connectivity' };
  }

  // 권한 관련 에러
  if (httpStatus === 403 || message.includes('권한') || message.includes('permission') ||
      message.includes('unauthorized') || message.includes('forbidden')) {
    return { type: 'permission_error', category: 'access', httpStatus };
  }

  // URL/리소스 찾기 오류
  if (httpStatus === 404 || message.includes('not found') || message.includes('찾을 수 없습니다')) {
    return { type: 'url_error', category: 'configuration', httpStatus };
  }

  // 타임아웃 오류
  if (message.includes('timeout') || message.includes('시간 초과') || 
      message.includes('timed out')) {
    return { type: 'timeout_error', category: 'performance' };
  }

  // 서버 오류
  if (httpStatus >= 500 || message.includes('server error') || message.includes('서버 오류')) {
    return { type: 'server_error', category: 'server', httpStatus };
  }

  // 사용량 제한
  if (httpStatus === 429 || message.includes('rate limit') || message.includes('too many requests') ||
      message.includes('사용량 제한')) {
    return { type: 'rate_limit_error', category: 'quota', httpStatus };
  }

  // 데이터 검증 오류
  if (httpStatus === 400 || httpStatus === 422 || message.includes('validation') ||
      message.includes('검증') || message.includes('invalid data')) {
    return { type: 'validation_error', category: 'data', httpStatus };
  }

  return { type: 'unknown_error', category: 'general', httpStatus };
}

// 액션 표시 이름 생성
function getActionDisplayName(action) {
  const actionNames = {
    'submitHand': '핸드 데이터 전송',
    'batchUpdate': '일괄 업데이트',
    'addPlayer': '플레이어 추가',
    'updatePlayer': '플레이어 정보 수정',
    'loadData': '데이터 로드',
    'testConnection': '연결 테스트'
  };

  return actionNames[action] || action || '작업';
}

// 컨텍스트 정보 생성
function generateContextualInfo(classification, context) {
  const info = [];
  
  if (context.callId) {
    info.push(`호출 ID: ${context.callId}`);
  }
  
  if (context.attempts) {
    info.push(`시도 횟수: ${context.attempts}`);
  }
  
  if (context.duration) {
    info.push(`소요 시간: ${context.duration}ms`);
  }

  const timestamp = new Date().toLocaleString('ko-KR');
  info.push(`발생 시각: ${timestamp}`);

  return info.length > 0 ? info.join(', ') : '';
}

// 에러 표시 UI 생성 (옵션)
window.showUserFriendlyError = function(error, action, context = {}) {
  const errorInfo = window.getUserFriendlyErrorMessage(error, action, context);
  
  // 콘솔에 상세 에러 정보 출력
  console.group(`🚨 ${errorInfo.title}`);
  console.error('메시지:', errorInfo.message);
  console.log('상세 정보:', errorInfo.details);
  console.log('심각도:', errorInfo.severity);
  console.log('재시도 가능:', errorInfo.canRetry);
  if (errorInfo.troubleshooting) {
    console.log('문제해결 단계:', errorInfo.troubleshooting);
  }
  console.groupEnd();

  // TODO: 실제 UI 모달이나 알림을 여기서 표시할 수 있음
  // 예: showModal(errorInfo);
  
  return errorInfo;
};

// ==================== 보호된 특정 API 함수들 ====================

/**
 * 보호된 핸드 데이터 전송
 * sendDataToGoogleSheet() 함수를 대체하는 안전한 버전
 */
window.protectedSendToSheets = async function(handData = null, options = {}) {
  console.log('📊 protectedSendToSheets 호출됨:', handData, options);

  try {
    // 현재 핸드 데이터 준비
    const dataToSend = handData || getCurrentHandData();
    
    if (!dataToSend || Object.keys(dataToSend).length === 0) {
      throw new Error('전송할 핸드 데이터가 없습니다. 먼저 데이터를 입력해주세요.');
    }

    // 데이터 검증
    validateHandData(dataToSend);

    const result = await window.protectedApiCall('submitHand', dataToSend, {
      showProgress: true,
      progressMessage: '핸드 데이터 전송 중...',
      retryCount: API_CALL_CONFIG.MAX_RETRIES,
      priority: 'high',
      enableCache: false,  // 핸드 데이터는 캐시하지 않음
      onProgress: options.onProgress,
      onRetry: (retryInfo) => {
        console.log(`🔄 핸드 데이터 전송 재시도 ${retryInfo.attempt}/${retryInfo.totalAttempts}`);
        if (options.onRetry) options.onRetry(retryInfo);
      },
      ...options
    });

    console.log('✅ 핸드 데이터 전송 성공:', result);
    
    // 성공 시 로컬 상태 업데이트
    if (typeof updateLocalHandState === 'function') {
      updateLocalHandState('submitted', result);
    }

    return result;

  } catch (error) {
    console.error('❌ protectedSendToSheets 오류:', error);
    
    const friendlyError = window.getUserFriendlyErrorMessage(error, 'submitHand', {
      dataSize: JSON.stringify(handData || {}).length,
      timestamp: Date.now()
    });

    if (options.showUserError !== false) {
      window.showUserFriendlyError(error, 'submitHand', friendlyError);
    }

    throw error;
  }
};

/**
 * 보호된 일괄 등록 처리
 * batch register 이벤트 핸들러를 위한 안전한 함수
 */
window.protectedBulkRegister = async function(playersData, options = {}) {
  console.log('📝 protectedBulkRegister 호출됨:', playersData, options);

  try {
    if (!playersData || !Array.isArray(playersData) || playersData.length === 0) {
      throw new Error('등록할 플레이어 데이터가 없습니다.');
    }

    // 데이터 검증
    playersData.forEach((player, index) => {
      validatePlayerData(player, `플레이어 ${index + 1}`);
    });

    // 대량 데이터의 경우 배치 처리
    const batchSize = 10;  // 한 번에 10명씩 처리
    const batches = [];
    
    for (let i = 0; i < playersData.length; i += batchSize) {
      batches.push(playersData.slice(i, i + batchSize));
    }

    const results = [];
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      console.log(`📦 배치 ${batchIndex + 1}/${batches.length} 처리 중... (${batch.length}명)`);

      const batchResult = await window.protectedApiCall('batchUpdate', {
        players: batch,
        batchIndex: batchIndex + 1,
        totalBatches: batches.length
      }, {
        showProgress: true,
        progressMessage: `일괄 등록 중... (${batchIndex + 1}/${batches.length})`,
        retryCount: API_CALL_CONFIG.MAX_RETRIES,
        priority: 'normal',
        timeout: 45000,  // 대량 데이터 처리 시 더 긴 타임아웃
        onProgress: options.onProgress,
        ...options
      });

      results.push(batchResult);

      // 배치 간 잠시 대기 (서버 부하 방지)
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('✅ 일괄 등록 완료:', results);
    return results;

  } catch (error) {
    console.error('❌ protectedBulkRegister 오류:', error);
    
    const friendlyError = window.getUserFriendlyErrorMessage(error, 'batchUpdate', {
      playerCount: playersData?.length || 0,
      timestamp: Date.now()
    });

    if (options.showUserError !== false) {
      window.showUserFriendlyError(error, 'batchUpdate', friendlyError);
    }

    throw error;
  }
};

/**
 * 보호된 플레이어 추가
 * addNewPlayer() 함수를 대체하는 안전한 버전
 */
window.protectedAddPlayer = async function(playerData, options = {}) {
  console.log('👤 protectedAddPlayer 호출됨:', playerData, options);

  try {
    if (!playerData || typeof playerData !== 'object') {
      throw new Error('플레이어 데이터가 올바르지 않습니다.');
    }

    // 데이터 검증 및 기본값 설정
    const validatedData = validateAndNormalizePlayerData(playerData);

    const result = await window.protectedApiCall('addPlayer', validatedData, {
      showProgress: true,
      progressMessage: '플레이어 추가 중...',
      retryCount: API_CALL_CONFIG.MAX_RETRIES,
      priority: 'normal',
      enableCache: false,
      onProgress: options.onProgress,
      ...options
    });

    console.log('✅ 플레이어 추가 성공:', result);

    // 성공 시 로컬 플레이어 목록 업데이트
    if (typeof updateLocalPlayerList === 'function') {
      updateLocalPlayerList('add', result);
    }

    return result;

  } catch (error) {
    console.error('❌ protectedAddPlayer 오류:', error);
    
    const friendlyError = window.getUserFriendlyErrorMessage(error, 'addPlayer', {
      playerName: playerData?.name || 'Unknown',
      timestamp: Date.now()
    });

    if (options.showUserError !== false) {
      window.showUserFriendlyError(error, 'addPlayer', friendlyError);
    }

    throw error;
  }
};

/**
 * 보호된 플레이어 좌석 업데이트
 * updatePlayerSeat() 함수를 대체하는 안전한 버전
 */
window.protectedUpdatePlayerSeat = async function(playerId, newSeat, options = {}) {
  console.log('💺 protectedUpdatePlayerSeat 호출됨:', playerId, newSeat, options);

  try {
    if (!playerId) {
      throw new Error('플레이어 ID가 필요합니다.');
    }

    if (!newSeat || typeof newSeat !== 'number' || newSeat < 1 || newSeat > 10) {
      throw new Error('올바른 좌석 번호(1-10)를 입력해주세요.');
    }

    const result = await window.protectedApiCall('updatePlayerSeat', {
      playerId,
      newSeat
    }, {
      showProgress: true,
      progressMessage: '좌석 정보 업데이트 중...',
      retryCount: 2,
      priority: 'normal',
      ...options
    });

    console.log('✅ 플레이어 좌석 업데이트 성공:', result);
    return result;

  } catch (error) {
    console.error('❌ protectedUpdatePlayerSeat 오류:', error);
    
    const friendlyError = window.getUserFriendlyErrorMessage(error, 'updatePlayerSeat', {
      playerId,
      newSeat,
      timestamp: Date.now()
    });

    if (options.showUserError !== false) {
      window.showUserFriendlyError(error, 'updatePlayerSeat', friendlyError);
    }

    throw error;
  }
};

/**
 * 보호된 플레이어 칩 업데이트
 * updatePlayerChips() 함수를 대체하는 안전한 버전
 */
window.protectedUpdatePlayerChips = async function(playerId, newChips, options = {}) {
  console.log('💰 protectedUpdatePlayerChips 호출됨:', playerId, newChips, options);

  try {
    if (!playerId) {
      throw new Error('플레이어 ID가 필요합니다.');
    }

    if (typeof newChips !== 'number' || newChips < 0) {
      throw new Error('올바른 칩 수량(0 이상)을 입력해주세요.');
    }

    const result = await window.protectedApiCall('updatePlayerChips', {
      playerId,
      newChips
    }, {
      showProgress: true,
      progressMessage: '칩 정보 업데이트 중...',
      retryCount: 2,
      priority: 'normal',
      ...options
    });

    console.log('✅ 플레이어 칩 업데이트 성공:', result);
    return result;

  } catch (error) {
    console.error('❌ protectedUpdatePlayerChips 오류:', error);
    
    const friendlyError = window.getUserFriendlyErrorMessage(error, 'updatePlayerChips', {
      playerId,
      newChips,
      timestamp: Date.now()
    });

    if (options.showUserError !== false) {
      window.showUserFriendlyError(error, 'updatePlayerChips', friendlyError);
    }

    throw error;
  }
};

// ==================== 데이터 검증 및 유틸리티 함수 ====================

/**
 * 핸드 데이터 검증
 */
function validateHandData(handData) {
  if (!handData || typeof handData !== 'object') {
    throw new Error('핸드 데이터가 올바르지 않습니다.');
  }

  const requiredFields = ['players', 'board', 'pot'];
  const missingFields = requiredFields.filter(field => !(field in handData));
  
  if (missingFields.length > 0) {
    throw new Error(`필수 필드가 누락되었습니다: ${missingFields.join(', ')}`);
  }

  if (!Array.isArray(handData.players) || handData.players.length === 0) {
    throw new Error('플레이어 정보가 없습니다.');
  }

  return true;
}

/**
 * 플레이어 데이터 검증
 */
function validatePlayerData(playerData, context = '') {
  if (!playerData || typeof playerData !== 'object') {
    throw new Error(`${context} 플레이어 데이터가 올바르지 않습니다.`);
  }

  if (!playerData.name || typeof playerData.name !== 'string' || playerData.name.trim() === '') {
    throw new Error(`${context} 플레이어 이름이 필요합니다.`);
  }

  if (playerData.seat && (typeof playerData.seat !== 'number' || playerData.seat < 1 || playerData.seat > 10)) {
    throw new Error(`${context} 좌석 번호는 1-10 사이여야 합니다.`);
  }

  return true;
}

/**
 * 플레이어 데이터 검증 및 정규화
 */
function validateAndNormalizePlayerData(playerData) {
  validatePlayerData(playerData);

  return {
    name: playerData.name.trim(),
    seat: playerData.seat || null,
    chips: typeof playerData.chips === 'number' ? playerData.chips : 0,
    position: playerData.position || null,
    ...playerData  // 기타 필드 보존
  };
}

/**
 * 현재 핸드 데이터 가져오기 (실제 구현은 기존 코드 참조)
 */
function getCurrentHandData() {
  // 기존 sendDataToGoogleSheet에서 데이터를 가져오는 로직을 여기에 구현
  // 임시로 빈 객체 반환
  console.warn('getCurrentHandData 함수가 구현되지 않았습니다.');
  return {};
}

// ==================== 시스템 초기화 및 로드 완료 ====================

// Phase 4 시스템 상태 확인
window.validatePhase4System = function() {
  const checks = [];
  
  // 필수 함수들 존재 확인
  const requiredFunctions = [
    'ensureAppsScriptUrl',
    'protectedApiCall',
    'getUserFriendlyErrorMessage',
    'protectedSendToSheets',
    'protectedBulkRegister',
    'protectedAddPlayer'
  ];

  requiredFunctions.forEach(funcName => {
    const exists = typeof window[funcName] === 'function';
    checks.push({
      name: funcName,
      status: exists ? 'pass' : 'fail',
      type: 'function'
    });
  });

  // 필수 객체들 존재 확인
  const requiredObjects = [
    'ApiCallManager'
  ];

  requiredObjects.forEach(objName => {
    const exists = typeof window[objName] === 'object' && window[objName] !== null;
    checks.push({
      name: objName,
      status: exists ? 'pass' : 'fail',
      type: 'object'
    });
  });

  // 필수 상수들 존재 확인
  const requiredConstants = [
    'API_CALL_CONFIG'
  ];

  requiredConstants.forEach(constName => {
    const exists = typeof window[constName] !== 'undefined';
    checks.push({
      name: constName,
      status: exists ? 'pass' : 'fail',
      type: 'constant'
    });
  });

  const failedChecks = checks.filter(check => check.status === 'fail');
  const allPassed = failedChecks.length === 0;

  if (allPassed) {
    console.log('✅ Phase 4 시스템 검증 통과');
  } else {
    console.error('❌ Phase 4 시스템 검증 실패:', failedChecks);
  }

  return {
    passed: allPassed,
    checks,
    failedChecks,
    summary: `${checks.length - failedChecks.length}/${checks.length} 검사 통과`
  };
};

// 전역 에러 핸들러 설정
window.setupPhase4ErrorHandling = function() {
  // 전역 unhandled rejection 처리
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 처리되지 않은 Promise 거부:', event.reason);
    
    // API 호출 관련 에러인 경우 친화적 메시지 표시
    if (event.reason && event.reason.message && 
        (event.reason.message.includes('API 호출') || 
         event.reason.message.includes('Apps Script'))) {
      
      const friendlyError = window.getUserFriendlyErrorMessage(
        event.reason, 
        'unknown', 
        { source: 'unhandledRejection' }
      );
      
      console.warn('💬 사용자 친화적 에러 메시지:', friendlyError);
    }
  });

  // 전역 에러 처리
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message && event.error.message.includes('Phase 4')) {
      console.error('🚨 Phase 4 관련 에러:', event.error);
    }
  });

  console.log('🛡️ Phase 4 전역 에러 핸들링 설정 완료');
};

// ApiCallManager 자동 정리 스케줄러 설정
window.setupApiCallManagerScheduler = function() {
  // 5분마다 오래된 캐시와 히스토리 정리
  setInterval(() => {
    if (window.ApiCallManager) {
      const beforeCacheSize = window.ApiCallManager.cache.size;
      const beforeHistorySize = window.ApiCallManager.callHistory.length;
      
      // 만료된 캐시 제거
      const now = Date.now();
      for (const [key, entry] of window.ApiCallManager.cache.entries()) {
        if (now > entry.expireTime) {
          window.ApiCallManager.cache.delete(key);
        }
      }
      
      // 오래된 히스토리 제거
      if (window.ApiCallManager.callHistory.length > window.ApiCallManager.config.maxHistorySize) {
        const excess = window.ApiCallManager.callHistory.length - window.ApiCallManager.config.maxHistorySize;
        window.ApiCallManager.callHistory.splice(0, excess);
      }

      const cleanedCache = beforeCacheSize - window.ApiCallManager.cache.size;
      const cleanedHistory = beforeHistorySize - window.ApiCallManager.callHistory.length;

      if (cleanedCache > 0 || cleanedHistory > 0) {
        console.log(`🧹 ApiCallManager 자동 정리: 캐시 ${cleanedCache}개, 히스토리 ${cleanedHistory}개 삭제`);
      }
    }
  }, 5 * 60 * 1000);  // 5분

  console.log('🔄 ApiCallManager 자동 정리 스케줄러 시작');
};

// Phase 4 시스템 완전 초기화
window.initializePhase4System = function() {
  console.group('🚀 Phase 4 API 보호 시스템 초기화');
  
  try {
    // 1. 시스템 검증
    const validation = window.validatePhase4System();
    console.log('📋 시스템 검증 결과:', validation.summary);
    
    if (!validation.passed) {
      console.error('❌ 필수 구성 요소 누락:', validation.failedChecks);
      throw new Error('Phase 4 시스템 초기화 실패: 필수 구성 요소 누락');
    }

    // 2. 에러 핸들링 설정
    window.setupPhase4ErrorHandling();

    // 3. 자동 정리 스케줄러 설정
    window.setupApiCallManagerScheduler();

    // 4. 초기 상태 로그
    console.log('📊 ApiCallManager 초기 상태:', window.ApiCallManager.getDetailedStats());

    // 5. 성공 플래그 설정
    window.PHASE4_SYSTEM_INITIALIZED = true;
    
    console.log('✅ Phase 4 API 보호 시스템 초기화 완료');
    
  } catch (error) {
    console.error('💥 Phase 4 시스템 초기화 실패:', error);
    window.PHASE4_SYSTEM_INITIALIZED = false;
    throw error;
  } finally {
    console.groupEnd();
  }
};

// 시스템 상태 확인 함수
window.getPhase4SystemStatus = function() {
  return {
    loaded: window.PHASE4_FUNCTIONS_LOADED || false,
    initialized: window.PHASE4_SYSTEM_INITIALIZED || false,
    apiCallManager: window.ApiCallManager ? window.ApiCallManager.getDetailedStats() : null,
    systemHealth: window.ApiCallManager ? window.ApiCallManager.getSystemHealth() : null,
    timestamp: new Date().toISOString()
  };
};

console.log('✅ Phase 4 Enhanced Functions 로드 완료');

// 기본 로드 플래그
window.PHASE4_FUNCTIONS_LOADED = true;

// 자동 초기화 (다른 시스템이 준비되면)
if (typeof window.APP_CONFIG !== 'undefined') {
  // APP_CONFIG가 이미 있는 경우 바로 초기화
  setTimeout(() => {
    try {
      window.initializePhase4System();
    } catch (error) {
      console.warn('⚠️ Phase 4 자동 초기화 실패, 수동 초기화 필요:', error.message);
    }
  }, 100);
} else {
  // APP_CONFIG를 기다리는 이벤트 리스너
  document.addEventListener('APP_CONFIG_READY', () => {
    setTimeout(() => {
      try {
        window.initializePhase4System();
      } catch (error) {
        console.warn('⚠️ Phase 4 초기화 실패, 수동 초기화 필요:', error.message);
      }
    }, 100);
  });
}

console.log('🎯 Phase 4 API 호출 보호 시스템 v4.2.0 준비 완료');
console.log('📖 사용법: window.protectedSendToSheets(), window.protectedApiCall() 등을 사용하세요');
console.log('🔍 상태 확인: window.getPhase4SystemStatus(), window.ApiCallManager.debug()');

// ==================== 끝 ====================[  API 호출 보호 시스템 v4.2.0  ]====================