/**
 * 🎰 Virtual Data v4.0.0 Phoenix
 * Event Bus System
 *
 * 모듈 간 통신을 위한 이벤트 기반 시스템
 */

import { Logger } from '../utils/logger.js';

export class EventBus {
  constructor() {
    this.logger = new Logger('EventBus');
    this.listeners = new Map();
    this.onceListeners = new Map();
    this.wildcardListeners = new Set();

    // 이벤트 통계
    this.stats = {
      totalEvents: 0,
      totalListeners: 0,
      eventCounts: new Map()
    };

    // 디버그 모드
    this.debugMode = false;
  }

  /**
   * 이벤트 리스너 등록
   */
  on(event, listener, context = null) {
    if (typeof listener !== 'function') {
      throw new Error('Event listener must be a function');
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const wrappedListener = {
      fn: listener,
      context: context,
      once: false
    };

    this.listeners.get(event).push(wrappedListener);
    this.stats.totalListeners++;

    if (this.debugMode) {
      this.logger.debug(`📝 이벤트 리스너 등록: ${event}`);
    }

    // 제거 함수 반환
    return () => this.off(event, listener);
  }

  /**
   * 일회성 이벤트 리스너 등록
   */
  once(event, listener, context = null) {
    if (typeof listener !== 'function') {
      throw new Error('Event listener must be a function');
    }

    const onceWrapper = (...args) => {
      this.off(event, onceWrapper);
      return listener.call(context, ...args);
    };

    return this.on(event, onceWrapper, context);
  }

  /**
   * 이벤트 리스너 제거
   */
  off(event, listener = null) {
    if (!listener) {
      // 모든 리스너 제거
      const count = this.listeners.get(event)?.length || 0;
      this.listeners.delete(event);
      this.stats.totalListeners -= count;

      if (this.debugMode && count > 0) {
        this.logger.debug(`🗑️ 이벤트 '${event}' 모든 리스너 제거 (${count}개)`);
      }
      return count;
    }

    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return 0;

    const initialLength = eventListeners.length;
    const filtered = eventListeners.filter(wrapper => wrapper.fn !== listener);

    if (filtered.length !== initialLength) {
      this.listeners.set(event, filtered);
      const removed = initialLength - filtered.length;
      this.stats.totalListeners -= removed;

      if (this.debugMode) {
        this.logger.debug(`🗑️ 이벤트 '${event}' 리스너 제거`);
      }
      return removed;
    }

    return 0;
  }

  /**
   * 모든 이벤트 리스너 제거
   */
  removeAllListeners() {
    const totalRemoved = this.stats.totalListeners;
    this.listeners.clear();
    this.onceListeners.clear();
    this.wildcardListeners.clear();
    this.stats.totalListeners = 0;

    this.logger.info(`🗑️ 모든 이벤트 리스너 제거 (${totalRemoved}개)`);
  }

  /**
   * 이벤트 발생
   */
  emit(event, data = null) {
    this.stats.totalEvents++;
    this.stats.eventCounts.set(event, (this.stats.eventCounts.get(event) || 0) + 1);

    if (this.debugMode) {
      this.logger.debug(`📢 이벤트 발생: ${event}`, data);
    }

    let listenersExecuted = 0;

    // 일반 리스너 실행
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      // 복사본을 만들어 실행 중 리스너 변경에 안전하게 대응
      const listenersToExecute = [...eventListeners];

      for (const wrapper of listenersToExecute) {
        try {
          if (wrapper.context) {
            wrapper.fn.call(wrapper.context, data, event);
          } else {
            wrapper.fn(data, event);
          }
          listenersExecuted++;
        } catch (error) {
          this.logger.error(`❌ 이벤트 리스너 실행 에러 [${event}]:`, error);

          // 에러 이벤트 발생 (무한 루프 방지)
          if (event !== 'error') {
            this.emit('error', { originalEvent: event, error, data });
          }
        }
      }
    }

    // 와일드카드 리스너 실행
    for (const wildcardListener of this.wildcardListeners) {
      try {
        wildcardListener(event, data);
        listenersExecuted++;
      } catch (error) {
        this.logger.error(`❌ 와일드카드 리스너 실행 에러:`, error);
      }
    }

    return listenersExecuted;
  }

  /**
   * 와일드카드 리스너 등록 (모든 이벤트 감지)
   */
  onAny(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Wildcard listener must be a function');
    }

    this.wildcardListeners.add(listener);

    // 제거 함수 반환
    return () => this.wildcardListeners.delete(listener);
  }

  /**
   * 이벤트 존재 확인
   */
  hasListeners(event) {
    const eventListeners = this.listeners.get(event);
    return eventListeners && eventListeners.length > 0;
  }

  /**
   * 특정 이벤트의 리스너 수
   */
  listenerCount(event) {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? eventListeners.length : 0;
  }

  /**
   * 모든 이벤트 목록
   */
  eventNames() {
    return Array.from(this.listeners.keys());
  }

  /**
   * 이벤트 통계
   */
  getStats() {
    return {
      ...this.stats,
      currentListeners: this.stats.totalListeners,
      events: this.eventNames(),
      topEvents: Array.from(this.stats.eventCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    };
  }

  /**
   * 디버그 모드 토글
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    this.logger.info(`🔍 이벤트 디버그 모드: ${enabled ? 'ON' : 'OFF'}`);
  }

  /**
   * 이벤트 체인 생성 (Promise 기반)
   */
  async waitFor(event, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(event, listener);
        reject(new Error(`Event '${event}' timeout after ${timeout}ms`));
      }, timeout);

      const listener = (data) => {
        clearTimeout(timer);
        resolve(data);
      };

      this.once(event, listener);
    });
  }

  /**
   * 이벤트 시퀀스 실행
   */
  async emitSequence(events, delay = 0) {
    const results = [];

    for (const { event, data } of events) {
      const result = this.emit(event, data);
      results.push({ event, listenersExecuted: result });

      if (delay > 0 && events.indexOf({ event, data }) < events.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  /**
   * 조건부 이벤트 발생
   */
  emitIf(condition, event, data = null) {
    if (typeof condition === 'function') {
      if (condition(event, data)) {
        return this.emit(event, data);
      }
    } else if (condition) {
      return this.emit(event, data);
    }

    return 0;
  }

  /**
   * 이벤트 필터링
   */
  addEventFilter(filter) {
    if (typeof filter !== 'function') {
      throw new Error('Event filter must be a function');
    }

    this.eventFilters = this.eventFilters || [];
    this.eventFilters.push(filter);
  }

  /**
   * 네임스페이스 기반 이벤트 관리
   */
  namespace(name) {
    return {
      emit: (event, data) => this.emit(`${name}:${event}`, data),
      on: (event, listener, context) => this.on(`${name}:${event}`, listener, context),
      off: (event, listener) => this.off(`${name}:${event}`, listener),
      once: (event, listener, context) => this.once(`${name}:${event}`, listener, context)
    };
  }
}