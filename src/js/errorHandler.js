/**
 * 🔥 에러 처리 시스템 v1.0.0
 * Virtual Data - Poker Hand Logger
 *
 * 일관된 에러 처리 및 사용자 친화적 메시지 제공
 */

(function() {
  'use strict';

  /**
   * 앱 에러 클래스
   */
  class AppError extends Error {
    constructor(message, code, userMessage, details = {}) {
      super(message);
      this.name = 'AppError';
      this.code = code;
      this.userMessage = userMessage;
      this.details = details;
      this.timestamp = new Date().toISOString();
    }

    toString() {
      return `[${this.code}] ${this.message}`;
    }
  }

  /**
   * 에러 코드 상수
   */
  const ErrorCode = {
    // 네트워크 에러 (1000번대)
    NETWORK_ERROR: 'NETWORK_1000',
    API_TIMEOUT: 'NETWORK_1001',
    API_UNREACHABLE: 'NETWORK_1002',

    // API 에러 (2000번대)
    API_ERROR: 'API_2000',
    API_INVALID_RESPONSE: 'API_2001',
    API_UNAUTHORIZED: 'API_2002',
    API_RATE_LIMIT: 'API_2003',

    // 데이터 에러 (3000번대)
    DATA_VALIDATION_ERROR: 'DATA_3000',
    DATA_PARSE_ERROR: 'DATA_3001',
    DATA_NOT_FOUND: 'DATA_3002',
    DATA_DUPLICATE: 'DATA_3003',

    // 상태 에러 (4000번대)
    INVALID_STATE: 'STATE_4000',
    MISSING_DEPENDENCY: 'STATE_4001',
    INITIALIZATION_ERROR: 'STATE_4002',

    // 사용자 입력 에러 (5000번대)
    INVALID_INPUT: 'INPUT_5000',
    REQUIRED_FIELD_MISSING: 'INPUT_5001',
    INVALID_FORMAT: 'INPUT_5002'
  };

  /**
   * 에러 핸들러
   */
  class ErrorHandler {
    constructor() {
      this.errorLog = [];
      this.maxLogSize = 100;
    }

    /**
     * 에러 처리 메인 함수
     */
    handle(error, options = {}) {
      const {
        showToUser = true,
        logToConsole = true,
        context = ''
      } = options;

      // 에러 로그 기록
      this.logError(error, context);

      // 콘솔 로그
      if (logToConsole) {
        if (error instanceof AppError) {
          logger.error(`[${error.code}] ${error.message}`, error.details);
        } else {
          logger.error('Unexpected error:', error);
        }
      }

      // 사용자에게 표시
      if (showToUser) {
        this.showUserFriendlyError(error);
      }

      return error;
    }

    /**
     * 에러 로그 기록
     */
    logError(error, context) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        error: error instanceof AppError ? {
          name: error.name,
          code: error.code,
          message: error.message,
          userMessage: error.userMessage,
          details: error.details
        } : {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        context
      };

      this.errorLog.push(logEntry);

      // 로그 크기 제한
      if (this.errorLog.length > this.maxLogSize) {
        this.errorLog.shift();
      }
    }

    /**
     * 사용자 친화적 에러 메시지 표시
     */
    showUserFriendlyError(error) {
      let message = '알 수 없는 오류가 발생했습니다.';
      let isError = true;

      if (error instanceof AppError) {
        message = error.userMessage || error.message;
      } else if (error.message) {
        message = this.getUserFriendlyMessage(error.message);
      }

      // showFeedback 함수가 있으면 사용
      if (typeof window.showFeedback === 'function') {
        window.showFeedback(message, isError);
      } else {
        // 폴백: alert
        alert(`❌ ${message}`);
      }
    }

    /**
     * 에러 메시지를 사용자 친화적으로 변환
     */
    getUserFriendlyMessage(errorMessage) {
      const patterns = [
        { pattern: /network/i, message: '네트워크 연결을 확인해주세요' },
        { pattern: /timeout/i, message: '요청 시간이 초과되었습니다' },
        { pattern: /not found/i, message: '데이터를 찾을 수 없습니다' },
        { pattern: /unauthorized/i, message: '인증이 필요합니다' },
        { pattern: /forbidden/i, message: '접근 권한이 없습니다' },
        { pattern: /invalid/i, message: '올바르지 않은 입력입니다' },
        { pattern: /duplicate/i, message: '중복된 데이터입니다' }
      ];

      for (const { pattern, message } of patterns) {
        if (pattern.test(errorMessage)) {
          return message;
        }
      }

      return errorMessage;
    }

    /**
     * 에러 로그 조회
     */
    getErrorLog() {
      return [...this.errorLog];
    }

    /**
     * 에러 로그 초기화
     */
    clearErrorLog() {
      this.errorLog = [];
    }
  }

  /**
   * 네트워크 에러 생성
   */
  function createNetworkError(originalError, url) {
    return new AppError(
      `Network request failed: ${originalError.message}`,
      ErrorCode.NETWORK_ERROR,
      '네트워크 연결을 확인해주세요',
      { url, originalError: originalError.message }
    );
  }

  /**
   * API 에러 생성
   */
  function createApiError(response, body) {
    const status = response.status;
    let code = ErrorCode.API_ERROR;
    let userMessage = 'API 요청에 실패했습니다';

    if (status === 401 || status === 403) {
      code = ErrorCode.API_UNAUTHORIZED;
      userMessage = '인증이 필요합니다';
    } else if (status === 429) {
      code = ErrorCode.API_RATE_LIMIT;
      userMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요';
    }

    return new AppError(
      `API error: ${status} ${response.statusText}`,
      code,
      userMessage,
      { status, statusText: response.statusText, body }
    );
  }

  /**
   * 데이터 검증 에러 생성
   */
  function createValidationError(field, message) {
    return new AppError(
      `Validation failed for ${field}: ${message}`,
      ErrorCode.DATA_VALIDATION_ERROR,
      `${field}: ${message}`,
      { field, message }
    );
  }

  /**
   * 안전한 API 호출 래퍼
   */
  async function safeApiCall(apiFunction, options = {}) {
    const {
      retries = 3,
      timeout = 30000,
      onError = null
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await Promise.race([
          apiFunction(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);

        return result;

      } catch (error) {
        lastError = error;

        logger.warn(`API call attempt ${attempt}/${retries} failed:`, error.message);

        if (attempt < retries) {
          // 지수 백오프
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // 모든 재시도 실패
    const wrappedError = createNetworkError(lastError, 'API call');

    if (onError) {
      onError(wrappedError);
    }

    throw wrappedError;
  }

  // 전역 인스턴스
  window.errorHandler = new ErrorHandler();
  window.AppError = AppError;
  window.ErrorCode = ErrorCode;

  // 헬퍼 함수들
  window.createNetworkError = createNetworkError;
  window.createApiError = createApiError;
  window.createValidationError = createValidationError;
  window.safeApiCall = safeApiCall;

  // 전역 에러 핸들러
  window.addEventListener('error', (event) => {
    logger.error('Uncaught error:', event.error);
    errorHandler.handle(event.error, { showToUser: false });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection:', event.reason);
    errorHandler.handle(event.reason, { showToUser: false });
  });

  logger.info('🔥 Error Handler v1.0.0 Loaded');

})();
