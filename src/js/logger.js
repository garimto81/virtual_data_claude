/**
 * 🔧 로거 시스템 v1.0.0
 * Virtual Data - Poker Hand Logger
 *
 * 환경별 로깅 레벨 제어 및 프로덕션 환경에서 디버그 로그 제거
 */

(function() {
  'use strict';

  // 환경 감지
  const isDevelopment = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.search.includes('debug=true');

  const isProduction = !isDevelopment;

  // 로그 레벨
  const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
  };

  // 현재 로그 레벨 설정
  const currentLogLevel = isProduction ? LogLevel.INFO : LogLevel.DEBUG;

  // 색상 스타일
  const styles = {
    debug: 'color: #60a5fa; font-weight: normal;',
    info: 'color: #10b981; font-weight: bold;',
    warn: 'color: #fbbf24; font-weight: bold;',
    error: 'color: #ef4444; font-weight: bold;',
    success: 'color: #10b981; font-weight: bold;',
    highlight: 'color: #a78bfa; font-weight: bold;'
  };

  /**
   * 로거 클래스
   */
  class Logger {
    constructor(prefix = '') {
      this.prefix = prefix;
    }

    /**
     * 디버그 로그 (개발 환경에서만 표시)
     */
    debug(...args) {
      if (currentLogLevel <= LogLevel.DEBUG) {
        const message = this.prefix ? `[${this.prefix}]` : '[DEBUG]';
        console.log(`%c${message}`, styles.debug, ...args);
      }
    }

    /**
     * 정보 로그
     */
    info(...args) {
      if (currentLogLevel <= LogLevel.INFO) {
        const message = this.prefix ? `[${this.prefix}]` : '[INFO]';
        console.info(`%c${message}`, styles.info, ...args);
      }
    }

    /**
     * 경고 로그
     */
    warn(...args) {
      if (currentLogLevel <= LogLevel.WARN) {
        const message = this.prefix ? `[${this.prefix}]` : '[WARN]';
        console.warn(`%c${message}`, styles.warn, ...args);
      }
    }

    /**
     * 에러 로그 (항상 표시)
     */
    error(...args) {
      if (currentLogLevel <= LogLevel.ERROR) {
        const message = this.prefix ? `[${this.prefix}]` : '[ERROR]';
        console.error(`%c${message}`, styles.error, ...args);
      }
    }

    /**
     * 성공 로그
     */
    success(...args) {
      if (currentLogLevel <= LogLevel.INFO) {
        const message = this.prefix ? `[${this.prefix}]` : '[SUCCESS]';
        console.log(`%c${message}`, styles.success, ...args);
      }
    }

    /**
     * 강조 로그
     */
    highlight(...args) {
      if (currentLogLevel <= LogLevel.INFO) {
        const message = this.prefix ? `[${this.prefix}]` : '[HIGHLIGHT]';
        console.log(`%c${message}`, styles.highlight, ...args);
      }
    }

    /**
     * 그룹 시작
     */
    group(label) {
      if (currentLogLevel <= LogLevel.DEBUG) {
        console.group(`%c${label}`, styles.debug);
      }
    }

    /**
     * 그룹 종료
     */
    groupEnd() {
      if (currentLogLevel <= LogLevel.DEBUG) {
        console.groupEnd();
      }
    }

    /**
     * 테이블 출력
     */
    table(data) {
      if (currentLogLevel <= LogLevel.DEBUG) {
        console.table(data);
      }
    }

    /**
     * 시간 측정 시작
     */
    time(label) {
      if (currentLogLevel <= LogLevel.DEBUG) {
        console.time(label);
      }
    }

    /**
     * 시간 측정 종료
     */
    timeEnd(label) {
      if (currentLogLevel <= LogLevel.DEBUG) {
        console.timeEnd(label);
      }
    }
  }

  // 전역 로거 인스턴스
  window.logger = new Logger();

  // 특정 모듈용 로거 생성 함수
  window.createLogger = function(moduleName) {
    return new Logger(moduleName);
  };

  // 환경 정보 출력
  if (isDevelopment) {
    console.log('%c🔧 Development Mode', 'color: #fbbf24; font-size: 14px; font-weight: bold;');
    console.log('%cAll logs enabled', 'color: #60a5fa;');
  } else {
    console.log('%c🚀 Production Mode', 'color: #10b981; font-size: 14px; font-weight: bold;');
    console.log('%cDebug logs disabled', 'color: #60a5fa;');
  }

  // 로거 정보 표시
  console.log('%c📝 Logger System v1.0.0 Loaded', 'color: #a78bfa; font-weight: bold;');
  console.log('%cUsage: logger.debug(), logger.info(), logger.warn(), logger.error()', 'color: #9ca3af;');

})();
