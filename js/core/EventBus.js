/**
 * EventBus - 이벤트 기반 통신을 위한 중앙 이벤트 버스
 * 모듈 간 느슨한 결합을 위한 pub/sub 패턴 구현
 */

export class EventBus {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map();
        this.eventHistory = [];
        this.maxHistorySize = 100;
        this.debug = false;
    }

    /**
     * 이벤트 리스너 등록
     */
    on(eventName, callback, context = null) {
        if (!eventName || typeof callback !== 'function') {
            throw new Error('Invalid event name or callback');
        }

        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const listener = {
            callback,
            context,
            id: this.generateId()
        };

        this.events.get(eventName).push(listener);

        if (this.debug) {
            console.log(`📌 Event listener added: ${eventName}`);
        }

        // 리스너 제거 함수 반환
        return () => this.off(eventName, listener.id);
    }

    /**
     * 일회성 이벤트 리스너 등록
     */
    once(eventName, callback, context = null) {
        if (!eventName || typeof callback !== 'function') {
            throw new Error('Invalid event name or callback');
        }

        if (!this.onceEvents.has(eventName)) {
            this.onceEvents.set(eventName, []);
        }

        const listener = {
            callback,
            context,
            id: this.generateId()
        };

        this.onceEvents.get(eventName).push(listener);

        if (this.debug) {
            console.log(`📌 Once event listener added: ${eventName}`);
        }

        return () => this.offOnce(eventName, listener.id);
    }

    /**
     * 이벤트 발생
     */
    emit(eventName, data = null) {
        if (!eventName) {
            throw new Error('Event name is required');
        }

        // 이벤트 히스토리 기록
        this.addToHistory(eventName, data);

        if (this.debug) {
            console.log(`🔥 Event emitted: ${eventName}`, data);
        }

        let handled = false;

        // 일반 리스너 실행
        const listeners = this.events.get(eventName) || [];
        listeners.forEach(listener => {
            try {
                listener.callback.call(listener.context, data);
                handled = true;
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
            }
        });

        // 일회성 리스너 실행
        const onceListeners = this.onceEvents.get(eventName) || [];
        onceListeners.forEach(listener => {
            try {
                listener.callback.call(listener.context, data);
                handled = true;
            } catch (error) {
                console.error(`Error in once event listener for ${eventName}:`, error);
            }
        });

        // 일회성 리스너 제거
        if (onceListeners.length > 0) {
            this.onceEvents.delete(eventName);
        }

        // 와일드카드 이벤트 처리 (*)
        const wildcardListeners = this.events.get('*') || [];
        wildcardListeners.forEach(listener => {
            try {
                listener.callback.call(listener.context, { eventName, data });
            } catch (error) {
                console.error('Error in wildcard event listener:', error);
            }
        });

        return handled;
    }

    /**
     * 비동기 이벤트 발생
     */
    async emitAsync(eventName, data = null) {
        if (!eventName) {
            throw new Error('Event name is required');
        }

        this.addToHistory(eventName, data);

        if (this.debug) {
            console.log(`🔥 Async event emitted: ${eventName}`, data);
        }

        const listeners = this.events.get(eventName) || [];
        const onceListeners = this.onceEvents.get(eventName) || [];
        const allListeners = [...listeners, ...onceListeners];

        const promises = allListeners.map(listener => {
            return new Promise((resolve) => {
                try {
                    const result = listener.callback.call(listener.context, data);
                    resolve(result);
                } catch (error) {
                    console.error(`Error in async event listener for ${eventName}:`, error);
                    resolve(null);
                }
            });
        });

        // 일회성 리스너 제거
        if (onceListeners.length > 0) {
            this.onceEvents.delete(eventName);
        }

        return Promise.all(promises);
    }

    /**
     * 이벤트 리스너 제거
     */
    off(eventName, listenerId) {
        if (!eventName) {
            throw new Error('Event name is required');
        }

        const listeners = this.events.get(eventName);
        if (!listeners) return false;

        const index = listeners.findIndex(l => l.id === listenerId);
        if (index > -1) {
            listeners.splice(index, 1);
            if (this.debug) {
                console.log(`📌 Event listener removed: ${eventName}`);
            }
            return true;
        }

        return false;
    }

    /**
     * 일회성 이벤트 리스너 제거
     */
    offOnce(eventName, listenerId) {
        if (!eventName) {
            throw new Error('Event name is required');
        }

        const listeners = this.onceEvents.get(eventName);
        if (!listeners) return false;

        const index = listeners.findIndex(l => l.id === listenerId);
        if (index > -1) {
            listeners.splice(index, 1);
            return true;
        }

        return false;
    }

    /**
     * 특정 이벤트의 모든 리스너 제거
     */
    removeAllListeners(eventName = null) {
        if (eventName) {
            this.events.delete(eventName);
            this.onceEvents.delete(eventName);
            if (this.debug) {
                console.log(`📌 All listeners removed for: ${eventName}`);
            }
        } else {
            this.events.clear();
            this.onceEvents.clear();
            if (this.debug) {
                console.log('📌 All event listeners removed');
            }
        }
    }

    /**
     * 이벤트 리스너 수 반환
     */
    listenerCount(eventName) {
        const regular = this.events.get(eventName)?.length || 0;
        const once = this.onceEvents.get(eventName)?.length || 0;
        return regular + once;
    }

    /**
     * 등록된 모든 이벤트 이름 반환
     */
    eventNames() {
        const names = new Set([
            ...this.events.keys(),
            ...this.onceEvents.keys()
        ]);
        return Array.from(names);
    }

    /**
     * 이벤트 대기 (Promise 기반)
     */
    waitFor(eventName, timeout = null) {
        return new Promise((resolve, reject) => {
            let timeoutId;

            const cleanup = () => {
                if (timeoutId) clearTimeout(timeoutId);
            };

            // 일회성 리스너 등록
            this.once(eventName, (data) => {
                cleanup();
                resolve(data);
            });

            // 타임아웃 설정
            if (timeout) {
                timeoutId = setTimeout(() => {
                    this.offOnce(eventName);
                    reject(new Error(`Event ${eventName} timeout after ${timeout}ms`));
                }, timeout);
            }
        });
    }

    /**
     * 이벤트 체이닝
     */
    pipe(fromEvent, toEvent, transform = null) {
        return this.on(fromEvent, (data) => {
            const transformedData = transform ? transform(data) : data;
            this.emit(toEvent, transformedData);
        });
    }

    /**
     * 이벤트 필터링
     */
    filter(eventName, predicate, callback) {
        return this.on(eventName, (data) => {
            if (predicate(data)) {
                callback(data);
            }
        });
    }

    /**
     * 이벤트 디바운스
     */
    debounce(eventName, callback, delay = 300) {
        let timeoutId;
        
        return this.on(eventName, (data) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                callback(data);
            }, delay);
        });
    }

    /**
     * 이벤트 쓰로틀
     */
    throttle(eventName, callback, limit = 300) {
        let inThrottle = false;
        
        return this.on(eventName, (data) => {
            if (!inThrottle) {
                callback(data);
                inThrottle = true;
                setTimeout(() => {
                    inThrottle = false;
                }, limit);
            }
        });
    }

    /**
     * 이벤트 히스토리에 추가
     */
    addToHistory(eventName, data) {
        const entry = {
            eventName,
            data,
            timestamp: new Date().toISOString()
        };

        this.eventHistory.push(entry);

        // 최대 크기 유지
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }

    /**
     * 이벤트 히스토리 조회
     */
    getHistory(eventName = null) {
        if (eventName) {
            return this.eventHistory.filter(e => e.eventName === eventName);
        }
        return [...this.eventHistory];
    }

    /**
     * 이벤트 히스토리 초기화
     */
    clearHistory() {
        this.eventHistory = [];
    }

    /**
     * 고유 ID 생성
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 디버그 모드 설정
     */
    setDebug(enabled) {
        this.debug = enabled;
    }

    /**
     * 이벤트 버스 상태 출력
     */
    inspect() {
        console.group('🔍 EventBus Status');
        console.log('Registered Events:', this.eventNames());
        console.log('Event Listeners:');
        this.events.forEach((listeners, eventName) => {
            console.log(`  ${eventName}: ${listeners.length} listeners`);
        });
        console.log('Once Events:');
        this.onceEvents.forEach((listeners, eventName) => {
            console.log(`  ${eventName}: ${listeners.length} listeners`);
        });
        console.log('History Size:', this.eventHistory.length);
        console.groupEnd();
    }
}