/**
 * Logger - 로깅 유틸리티
 * 다양한 레벨의 로그 메시지 관리 및 표시
 */

export class Logger {
    constructor(eventBus, options = {}) {
        this.eventBus = eventBus;
        this.options = {
            level: options.level || 'info',
            maxLogs: options.maxLogs || 1000,
            persist: options.persist !== false,
            showTimestamp: options.showTimestamp !== false,
            showLevel: options.showLevel !== false,
            console: options.console !== false
        };
        
        this.levels = {
            debug: 0,
            info: 1,
            warning: 2,
            error: 3
        };
        
        this.logs = [];
        this.container = null;
        this.init();
    }

    /**
     * 초기화
     */
    init() {
        // DOM 컨테이너 찾기
        this.container = document.getElementById('log-display');
        
        // 저장된 로그 복원
        if (this.options.persist) {
            this.restoreLogs();
        }
        
        // 전역 에러 캐처
        this.setupErrorHandlers();
        
        // 이벤트 리스너
        this.setupEventListeners();
    }

    /**
     * 에러 핸들러 설정
     */
    setupErrorHandlers() {
        // 전역 에러
        window.addEventListener('error', (event) => {
            this.error(`Uncaught error: ${event.message}`, {
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error
            });
        });
        
        // Promise 거부
        window.addEventListener('unhandledrejection', (event) => {
            this.error(`Unhandled promise rejection: ${event.reason}`);
        });
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 로그 레벨 변경
        this.eventBus?.on('logger:setLevel', (level) => {
            this.setLevel(level);
        });
        
        // 로그 클리어
        this.eventBus?.on('logger:clear', () => {
            this.clear();
        });
        
        // 로그 내보내기
        this.eventBus?.on('logger:export', () => {
            this.export();
        });
    }

    /**
     * 로그 메시지 추가
     */
    log(level, message, data = null) {
        const levelValue = this.levels[level] || 0;
        const currentLevelValue = this.levels[this.options.level] || 0;
        
        // 레벨 체크
        if (levelValue < currentLevelValue) {
            return;
        }
        
        const logEntry = {
            level,
            message,
            data,
            timestamp: new Date().toISOString(),
            id: this.generateId()
        };
        
        // 로그 배열에 추가
        this.logs.push(logEntry);
        
        // 최대 개수 유지
        if (this.logs.length > this.options.maxLogs) {
            this.logs.shift();
        }
        
        // 콘솔 출력
        if (this.options.console) {
            this.logToConsole(logEntry);
        }
        
        // UI 업데이트
        this.appendToUI(logEntry);
        
        // 이벤트 발생
        this.eventBus?.emit('logger:logged', logEntry);
        
        // 저장
        if (this.options.persist) {
            this.saveLogs();
        }
        
        return logEntry;
    }

    /**
     * 디버그 로그
     */
    debug(message, data = null) {
        return this.log('debug', message, data);
    }

    /**
     * 정보 로그
     */
    info(message, data = null) {
        return this.log('info', message, data);
    }

    /**
     * 경고 로그
     */
    warning(message, data = null) {
        return this.log('warning', message, data);
    }
    
    warn(message, data = null) {
        return this.warning(message, data);
    }

    /**
     * 에러 로그
     */
    error(message, data = null) {
        return this.log('error', message, data);
    }

    /**
     * 성공 로그 (info 레벨)
     */
    success(message, data = null) {
        return this.log('info', `✅ ${message}`, data);
    }

    /**
     * 그룹 로깅
     */
    group(label, callback) {
        const startTime = performance.now();
        const groupId = this.generateId();
        
        this.info(`[Group Start] ${label}`, { groupId });
        
        try {
            const result = callback();
            
            if (result instanceof Promise) {
                return result
                    .then(res => {
                        const duration = performance.now() - startTime;
                        this.info(`[Group End] ${label}`, { groupId, duration: `${duration.toFixed(2)}ms` });
                        return res;
                    })
                    .catch(err => {
                        const duration = performance.now() - startTime;
                        this.error(`[Group Error] ${label}`, { groupId, duration: `${duration.toFixed(2)}ms`, error: err });
                        throw err;
                    });
            }
            
            const duration = performance.now() - startTime;
            this.info(`[Group End] ${label}`, { groupId, duration: `${duration.toFixed(2)}ms` });
            return result;
            
        } catch (error) {
            const duration = performance.now() - startTime;
            this.error(`[Group Error] ${label}`, { groupId, duration: `${duration.toFixed(2)}ms`, error });
            throw error;
        }
    }

    /**
     * 타이머 로깅
     */
    time(label) {
        this.timers = this.timers || new Map();
        this.timers.set(label, performance.now());
        this.debug(`[Timer Start] ${label}`);
    }

    timeEnd(label) {
        if (!this.timers || !this.timers.has(label)) {
            this.warning(`Timer "${label}" does not exist`);
            return;
        }
        
        const startTime = this.timers.get(label);
        const duration = performance.now() - startTime;
        this.timers.delete(label);
        
        this.info(`[Timer End] ${label}: ${duration.toFixed(2)}ms`);
        return duration;
    }

    /**
     * 카운터 로깅
     */
    count(label = 'default') {
        this.counters = this.counters || new Map();
        const current = this.counters.get(label) || 0;
        const newCount = current + 1;
        this.counters.set(label, newCount);
        
        this.info(`[Count] ${label}: ${newCount}`);
        return newCount;
    }

    countReset(label = 'default') {
        this.counters = this.counters || new Map();
        this.counters.set(label, 0);
        this.info(`[Count Reset] ${label}`);
    }

    /**
     * 테이블 로깅
     */
    table(data, columns = null) {
        if (!Array.isArray(data) || data.length === 0) {
            this.warning('Table data must be a non-empty array');
            return;
        }
        
        // 콘솔에 테이블 출력
        if (this.options.console) {
            console.table(data, columns);
        }
        
        // UI에 간단한 테이블 표시
        const tableHTML = this.createTableHTML(data, columns);
        this.log('info', 'Table Data', { html: tableHTML, raw: data });
    }

    /**
     * 콘솔 출력
     */
    logToConsole(logEntry) {
        const { level, message, data, timestamp } = logEntry;
        const prefix = this.options.showTimestamp ? `[${new Date(timestamp).toLocaleTimeString()}]` : '';
        const levelPrefix = this.options.showLevel ? `[${level.toUpperCase()}]` : '';
        const fullMessage = `${prefix}${levelPrefix} ${message}`;
        
        switch (level) {
            case 'debug':
                console.debug(fullMessage, data);
                break;
            case 'info':
                console.info(fullMessage, data);
                break;
            case 'warning':
                console.warn(fullMessage, data);
                break;
            case 'error':
                console.error(fullMessage, data);
                break;
            default:
                console.log(fullMessage, data);
        }
    }

    /**
     * UI에 로그 추가
     */
    appendToUI(logEntry) {
        if (!this.container) {
            return;
        }
        
        const { level, message, timestamp } = logEntry;
        
        const entryDiv = document.createElement('div');
        entryDiv.className = `log-entry ${level}`;
        entryDiv.dataset.logId = logEntry.id;
        
        const timestampSpan = document.createElement('span');
        timestampSpan.className = 'log-timestamp';
        timestampSpan.textContent = new Date(timestamp).toLocaleTimeString();
        
        const levelSpan = document.createElement('span');
        levelSpan.className = `log-level log-level-${level}`;
        levelSpan.textContent = level.toUpperCase();
        
        const messageSpan = document.createElement('span');
        messageSpan.className = 'log-message';
        messageSpan.textContent = message;
        
        if (this.options.showTimestamp) {
            entryDiv.appendChild(timestampSpan);
        }
        
        if (this.options.showLevel) {
            entryDiv.appendChild(levelSpan);
        }
        
        entryDiv.appendChild(messageSpan);
        
        // 스크롤 위치 저장
        const shouldScroll = this.container.scrollTop + this.container.clientHeight >= this.container.scrollHeight - 10;
        
        this.container.appendChild(entryDiv);
        
        // 자동 스크롤
        if (shouldScroll) {
            this.container.scrollTop = this.container.scrollHeight;
        }
        
        // 오래된 로그 제거
        while (this.container.children.length > this.options.maxLogs) {
            this.container.removeChild(this.container.firstChild);
        }
    }

    /**
     * 테이블 HTML 생성
     */
    createTableHTML(data, columns) {
        const keys = columns || Object.keys(data[0]);
        
        let html = '<table class="log-table">';
        
        // 헤더
        html += '<thead><tr>';
        keys.forEach(key => {
            html += `<th>${key}</th>`;
        });
        html += '</tr></thead>';
        
        // 바디
        html += '<tbody>';
        data.forEach(row => {
            html += '<tr>';
            keys.forEach(key => {
                html += `<td>${row[key] !== undefined ? row[key] : ''}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';
        
        return html;
    }

    /**
     * 로그 레벨 설정
     */
    setLevel(level) {
        if (this.levels[level] !== undefined) {
            this.options.level = level;
            this.info(`Log level set to: ${level}`);
        }
    }

    /**
     * 로그 클리어
     */
    clear() {
        this.logs = [];
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        if (this.options.persist) {
            localStorage.removeItem('pokerHandLogger_logs');
        }
        
        this.eventBus?.emit('logger:cleared');
    }

    /**
     * 로그 검색
     */
    search(query, options = {}) {
        const { level, startDate, endDate, regex } = options;
        
        return this.logs.filter(log => {
            // 레벨 필터
            if (level && log.level !== level) {
                return false;
            }
            
            // 날짜 필터
            if (startDate && new Date(log.timestamp) < startDate) {
                return false;
            }
            
            if (endDate && new Date(log.timestamp) > endDate) {
                return false;
            }
            
            // 텍스트 검색
            if (query) {
                if (regex) {
                    const pattern = new RegExp(query, 'i');
                    return pattern.test(log.message);
                } else {
                    return log.message.toLowerCase().includes(query.toLowerCase());
                }
            }
            
            return true;
        });
    }

    /**
     * 로그 저장
     */
    saveLogs() {
        try {
            const toSave = this.logs.slice(-100); // 최근 100개만 저장
            localStorage.setItem('pokerHandLogger_logs', JSON.stringify(toSave));
        } catch (error) {
            console.error('Failed to save logs:', error);
        }
    }

    /**
     * 로그 복원
     */
    restoreLogs() {
        try {
            const saved = localStorage.getItem('pokerHandLogger_logs');
            if (saved) {
                this.logs = JSON.parse(saved);
                this.logs.forEach(log => this.appendToUI(log));
            }
        } catch (error) {
            console.error('Failed to restore logs:', error);
        }
    }

    /**
     * 로그 내보내기
     */
    export(format = 'json') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        let content, mimeType, filename;
        
        switch (format) {
            case 'json':
                content = JSON.stringify(this.logs, null, 2);
                mimeType = 'application/json';
                filename = `logs_${timestamp}.json`;
                break;
                
            case 'csv':
                content = this.logsToCSV();
                mimeType = 'text/csv';
                filename = `logs_${timestamp}.csv`;
                break;
                
            case 'txt':
                content = this.logsToText();
                mimeType = 'text/plain';
                filename = `logs_${timestamp}.txt`;
                break;
                
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.info(`Logs exported as ${format}`);
    }

    /**
     * CSV 변환
     */
    logsToCSV() {
        const headers = ['Timestamp', 'Level', 'Message', 'Data'];
        const rows = this.logs.map(log => [
            log.timestamp,
            log.level,
            log.message,
            log.data ? JSON.stringify(log.data) : ''
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    /**
     * 텍스트 변환
     */
    logsToText() {
        return this.logs.map(log => {
            const timestamp = new Date(log.timestamp).toLocaleString();
            const data = log.data ? ` | Data: ${JSON.stringify(log.data)}` : '';
            return `[${timestamp}] [${log.level.toUpperCase()}] ${log.message}${data}`;
        }).join('\n');
    }

    /**
     * ID 생성
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 로그 통계
     */
    getStats() {
        const stats = {
            total: this.logs.length,
            byLevel: {},
            oldestLog: null,
            newestLog: null
        };
        
        // 레벨별 카운트
        this.logs.forEach(log => {
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
        });
        
        // 가장 오래된/최신 로그
        if (this.logs.length > 0) {
            stats.oldestLog = this.logs[0];
            stats.newestLog = this.logs[this.logs.length - 1];
        }
        
        return stats;
    }
}