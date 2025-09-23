// ========================================
// Phase 4: API 호출 함수 보호 시스템
// ========================================

console.log('📦 Phase 4 Functions 로드 시작...');

// URL 검증 함수
function validateAppsScriptUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url);
}

// URL 검증 래퍼 함수 - 모든 API 호출 전 필수 체크
window.ensureAppsScriptUrl = function() {
  console.log('🔍 ensureAppsScriptUrl 호출됨');

  if (!window.APP_CONFIG) {
    throw new Error('APP_CONFIG가 초기화되지 않았습니다.');
  }

  if (!window.APP_CONFIG.appsScriptUrl) {
    throw new Error('Apps Script URL이 설정되지 않았습니다. 설정 화면에서 URL을 입력하세요.');
  }

  if (!validateAppsScriptUrl(window.APP_CONFIG.appsScriptUrl)) {
    throw new Error('올바르지 않은 Apps Script URL입니다. 설정을 다시 확인하세요.');
  }

  if (!window.APP_CONFIG.isInitialized) {
    throw new Error('앱이 초기화되지 않았습니다. 먼저 초기화를 완료하세요.');
  }

  if (!window.APP_CONFIG.state.isOnline) {
    throw new Error('인터넷 연결이 끊어졌습니다. 네트워크 상태를 확인하세요.');
  }

  return window.APP_CONFIG.appsScriptUrl;
};

// 보호된 API 호출 함수 - 모든 Apps Script 호출을 래핑
window.protectedApiCall = async function(action, data = {}, options = {}) {
  console.log('🛡️ protectedApiCall 호출됨:', action, data, options);

  const {
    showProgress = true,
    progressMessage = 'API 호출 중...',
    retryCount = 1,
    timeout = 30000
  } = options;

  // 1. URL 및 상태 검증
  const url = window.ensureAppsScriptUrl();

  // 2. 연결 상태 확인 및 재연결 시도
  if (window.APP_CONFIG && window.APP_CONFIG.state.connectionAttempts > 2) {
    console.log('🔄 연결 실패 횟수 초과, 재연결 시도');
    if (typeof checkNetworkAndReconnect === 'function') {
      await checkNetworkAndReconnect();
    }
  }

  // 3. 진행 상황 표시
  if (showProgress) {
    console.log(`📡 ${progressMessage} (${action})`);
  }

  // 4. API 호출 실행
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`📤 API 호출 시도 ${attempt}/${retryCount}: ${action}`);

      // fetchFromAppsScript 함수가 존재하는지 확인
      if (typeof fetchFromAppsScript !== 'function') {
        throw new Error('fetchFromAppsScript 함수를 찾을 수 없습니다.');
      }

      const result = await fetchFromAppsScript(action, data);

      console.log(`✅ API 호출 성공: ${action}`);
      return result;

    } catch (error) {
      console.error(`❌ API 호출 실패 ${attempt}/${retryCount}:`, error);

      // 마지막 시도가 아니면 재시도
      if (attempt < retryCount) {
        const retryDelay = Math.min(1000 * attempt, 3000); // 점진적 지연
        console.log(`⏳ ${retryDelay}ms 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      // 최종 실패 처리
      throw new Error(`API 호출 최종 실패 (${action}): ${error.message}`);
    }
  }
};

// API 호출 상태 관리
window.ApiCallManager = {
  activeCalls: new Set(),
  callHistory: [],
  maxHistorySize: 50,

  // 호출 시작
  startCall(action, data = {}) {
    const callId = `${action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const callInfo = {
      id: callId,
      action,
      data,
      startTime: Date.now(),
      status: 'running'
    };

    this.activeCalls.add(callInfo);
    console.log(`🚀 API 호출 시작: ${callId} (${action})`);

    return callId;
  },

  // 호출 완료
  completeCall(callId, success = true, result = null, error = null) {
    const callInfo = Array.from(this.activeCalls).find(call => call.id === callId);

    if (callInfo) {
      callInfo.endTime = Date.now();
      callInfo.duration = callInfo.endTime - callInfo.startTime;
      callInfo.status = success ? 'success' : 'failed';
      callInfo.result = result;
      callInfo.error = error;

      this.activeCalls.delete(callInfo);
      this.callHistory.push(callInfo);

      // 히스토리 크기 제한
      if (this.callHistory.length > this.maxHistorySize) {
        this.callHistory.shift();
      }

      console.log(`${success ? '✅' : '❌'} API 호출 완료: ${callId} (${callInfo.duration}ms)`);
    }
  },

  // 활성 호출 수
  getActiveCallCount() {
    return this.activeCalls.size;
  },

  // 최근 호출 통계
  getCallStats() {
    const recent = this.callHistory.slice(-10);
    const successCount = recent.filter(call => call.status === 'success').length;
    const averageTime = recent.length > 0 ?
      recent.reduce((sum, call) => sum + (call.duration || 0), 0) / recent.length : 0;

    return {
      totalCalls: this.callHistory.length,
      activeCalls: this.activeCalls.size,
      recentSuccessRate: recent.length > 0 ? (successCount / recent.length) * 100 : 0,
      averageResponseTime: Math.round(averageTime)
    };
  },

  // 디버그 정보
  debug() {
    const stats = this.getCallStats();
    console.group('📊 API 호출 통계');
    console.log('전체 호출 수:', stats.totalCalls);
    console.log('활성 호출 수:', stats.activeCalls);
    console.log('최근 성공률:', `${stats.recentSuccessRate.toFixed(1)}%`);
    console.log('평균 응답 시간:', `${stats.averageResponseTime}ms`);
    console.log('최근 호출 기록:', this.callHistory.slice(-5));
    console.groupEnd();
  }
};

// 사용자 친화적 에러 메시지 생성
window.getUserFriendlyErrorMessage = function(error, action) {
  console.log('💬 getUserFriendlyErrorMessage 호출됨:', error, action);

  const message = error.message || error.toString();

  // 공통 에러 패턴 매칭
  if (message.includes('URL이 설정되지 않았습니다')) {
    return {
      title: '설정 필요',
      message: 'Apps Script URL을 먼저 설정해야 합니다.',
      action: 'showSetupScreen',
      actionText: '설정 화면 열기'
    };
  }

  if (message.includes('네트워크') || message.includes('인터넷')) {
    return {
      title: '연결 오류',
      message: '인터넷 연결을 확인하고 다시 시도해주세요.',
      action: 'retry',
      actionText: '다시 시도'
    };
  }

  if (message.includes('HTTP 403') || message.includes('권한')) {
    return {
      title: '권한 오류',
      message: 'Google Sheets 접근 권한을 확인해주세요.',
      action: 'checkPermissions',
      actionText: '권한 확인'
    };
  }

  if (message.includes('HTTP 404')) {
    return {
      title: 'URL 오류',
      message: 'Apps Script URL이 올바르지 않습니다.',
      action: 'showSetupScreen',
      actionText: 'URL 다시 설정'
    };
  }

  // 기본 에러 메시지
  return {
    title: `${action} 실패`,
    message: message,
    action: 'retry',
    actionText: '다시 시도'
  };
};

// 보호된 특정 함수들
window.protectedSendToSheets = async function() {
  console.log('📊 protectedSendToSheets 호출됨');
  return await window.protectedApiCall('submitHand', {}, {
    showProgress: true,
    progressMessage: '데이터 전송 중...',
    retryCount: 2
  });
};

window.protectedBulkRegister = async function(payload) {
  console.log('📝 protectedBulkRegister 호출됨:', payload);
  return await window.protectedApiCall('batchUpdate', payload, {
    showProgress: true,
    progressMessage: '일괄 등록 중...',
    retryCount: 2
  });
};

window.protectedAddPlayer = async function(playerData) {
  console.log('👤 protectedAddPlayer 호출됨:', playerData);
  return await window.protectedApiCall('addPlayer', playerData, {
    showProgress: true,
    progressMessage: '플레이어 추가 중...',
    retryCount: 2
  });
};

console.log('✅ Phase 4 Functions 로드 완료');

// 로드 완료 확인
window.PHASE4_FUNCTIONS_LOADED = true;