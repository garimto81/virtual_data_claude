/**
 * 🎰 Virtual Data v4.0.0 Phoenix
 * Logging System
 *
 * 구조화된 로깅 시스템
 */

export class Logger {
  constructor(context = 'App', options = {}) {
    this.context = context;
    this.options = {
      level: options.level || 'info', // debug, info, warn, error
      enableColors: options.enableColors !== false,
      enableTimestamp: options.enableTimestamp !== false,
      enableContext: options.enableContext !== false,
      maxLogEntries: options.maxLogEntries || 1000,
      ...options
    };

    // 로그 레벨 우선순위
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    // 현재 레벨
    this.currentLevel = this.levels[this.options.level] || this.levels.info;

    // 색상 정의
    this.colors = {
      debug: '#6b7280',    // 회색
      info: '#3b82f6',     // 파란색
      success: '#10b981',  // 녹색
      warn: '#f59e0b',     // 주황색
      error: '#ef4444'     // 빨간색
    };

    // 로그 히스토리 (메모리에 저장)
    this.history = [];

    // 이벤트 콜백
    this.callbacks = {
      debug: [],
      info: [],
      warn: [],
      error: [],
      success: []
    };
  }

  /**
   * 디버그 로그
   */
  debug(message, ...args) {
    this._log('debug', message, ...args);
  }

  /**
   * 정보 로그
   */
  info(message, ...args) {
    this._log('info', message, ...args);
  }

  /**
   * 성공 로그
   */
  success(message, ...args) {
    this._log('success', message, ...args);
  }

  /**
   * 경고 로그
   */
  warn(message, ...args) {
    this._log('warn', message, ...args);
  }

  /**
   * 에러 로그
   */
  error(message, ...args) {
    this._log('error', message, ...args);
  }

  /**
   * 그룹 시작
   */
  group(label) {
    if (this.currentLevel <= this.levels.info) {
      console.group(`${this._getPrefix('info')} ${label}`);
    }
  }

  /**
   * 그룹 종료
   */
  groupEnd() {
    if (this.currentLevel <= this.levels.info) {
      console.groupEnd();
    }
  }

  /**
   * 테이블 출력
   */
  table(data, label = null) {
    if (this.currentLevel <= this.levels.info) {
      if (label) {
        this.info(label);
      }
      console.table(data);
    }
  }

  /**
   * 시간 측정 시작
   */
  time(label) {
    console.time(`${this.context}:${label}`);
  }

  /**
   * 시간 측정 종료
   */
  timeEnd(label) {
    console.timeEnd(`${this.context}:${label}`);
  }

  /**
   * 로그 레벨 변경
   */
  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.options.level = level;
      this.currentLevel = this.levels[level];
      this.info(`로그 레벨 변경: ${level}`);
    } else {
      this.warn(`유효하지 않은 로그 레벨: ${level}`);
    }
  }

  /**
   * 컨텍스트 변경
   */
  setContext(context) {
    this.context = context;
  }

  /**
   * 로그 히스토리 가져오기
   */
  getHistory(level = null, limit = null) {
    let filtered = this.history;

    if (level) {
      filtered = filtered.filter(entry => entry.level === level);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  /**
   * 로그 히스토리 지우기
   */
  clearHistory() {
    this.history = [];
    this.info('로그 히스토리 삭제됨');
  }

  /**
   * 콜백 등록
   */
  on(level, callback) {
    if (this.callbacks[level]) {
      this.callbacks[level].push(callback);
    }
  }

  /**
   * 콜백 제거
   */
  off(level, callback) {
    if (this.callbacks[level]) {
      const index = this.callbacks[level].indexOf(callback);
      if (index > -1) {
        this.callbacks[level].splice(index, 1);
      }
    }
  }

  /**
   * 로그 내보내기 (JSON)
   */
  exportLogs(options = {}) {
    const {
      level = null,
      since = null,
      until = null,
      format = 'json'
    } = options;

    let filtered = this.history;

    // 레벨 필터링
    if (level) {
      filtered = filtered.filter(entry => entry.level === level);
    }

    // 시간 범위 필터링
    if (since) {
      filtered = filtered.filter(entry => entry.timestamp >= since);
    }

    if (until) {
      filtered = filtered.filter(entry => entry.timestamp <= until);
    }

    switch (format) {
      case 'json':
        return JSON.stringify(filtered, null, 2);

      case 'csv':
        const headers = ['timestamp', 'level', 'context', 'message'];
        const rows = filtered.map(entry => [
          new Date(entry.timestamp).toISOString(),
          entry.level,
          entry.context,
          entry.message.replace(/"/g, '""')
        ]);

        return [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');

      case 'text':
        return filtered
          .map(entry => `[${new Date(entry.timestamp).toISOString()}] [${entry.level.toUpperCase()}] [${entry.context}] ${entry.message}`)
          .join('\n');

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // ==================== Private Methods ====================

  /**
   * 실제 로깅 수행
   */
  _log(level, message, ...args) {
    // 레벨 체크 (success는 info 레벨로 처리)
    const checkLevel = level === 'success' ? 'info' : level;
    if (this.currentLevel > (this.levels[checkLevel] || 0)) {
      return;
    }

    const timestamp = Date.now();
    const prefix = this._getPrefix(level);

    // 콘솔 출력
    const consoleMethod = this._getConsoleMethod(level);
    if (args.length > 0) {
      consoleMethod(prefix, message, ...args);
    } else {
      consoleMethod(prefix, message);
    }

    // 히스토리에 저장
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message: String(message),
      args: args.length > 0 ? args : undefined
    };

    this.history.push(logEntry);

    // 히스토리 크기 제한
    if (this.history.length > this.options.maxLogEntries) {
      this.history.shift();
    }

    // 콜백 실행
    this._executeCallbacks(level, logEntry);
  }

  /**
   * 프리픽스 생성
   */
  _getPrefix(level) {
    const parts = [];

    // 타임스탬프
    if (this.options.enableTimestamp) {
      const now = new Date();
      const time = now.toTimeString().split(' ')[0];
      parts.push(`[${time}]`);
    }

    // 레벨
    const levelStr = level === 'success' ? 'SUCCESS' : level.toUpperCase();
    parts.push(`[${levelStr}]`);

    // 컨텍스트
    if (this.options.enableContext && this.context) {
      parts.push(`[${this.context}]`);
    }

    return parts.join(' ');
  }

  /**
   * 콘솔 메소드 선택
   */
  _getConsoleMethod(level) {
    const methods = {
      debug: console.debug,
      info: console.info,
      success: console.info,
      warn: console.warn,
      error: console.error
    };

    const method = methods[level] || console.log;

    // 색상 지원
    if (this.options.enableColors && typeof window !== 'undefined') {
      const color = this.colors[level];
      return (prefix, message, ...args) => {
        method(`%c${prefix}`, `color: ${color}`, message, ...args);
      };
    }

    return method;
  }

  /**
   * 콜백 실행
   */
  _executeCallbacks(level, logEntry) {
    const callbacks = this.callbacks[level] || [];

    callbacks.forEach(callback => {
      try {
        callback(logEntry);
      } catch (error) {
        console.error('Logger callback error:', error);
      }
    });
  }
}

// 전역 로거 인스턴스
export const logger = new Logger('Global');

// 디버그 전용 함수들 (전역 노출)
if (typeof window !== 'undefined') {
  window.__DEBUG__ = {
    setLogLevel: (level) => logger.setLevel(level),
    getLogs: (level, limit) => logger.getHistory(level, limit),
    exportLogs: (options) => logger.exportLogs(options),
    clearLogs: () => logger.clearHistory()
  };
}