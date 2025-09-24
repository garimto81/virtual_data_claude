/**
 * Toast - 토스트 알림 유틸리티
 * 사용자에게 간단한 알림 메시지 표시
 */

export class Toast {
    static container = null;
    static queue = [];
    static isProcessing = false;
    static defaultOptions = {
        duration: 3000,
        position: 'bottom-right',
        animation: 'slide',
        closeable: true,
        pauseOnHover: true,
        maxToasts: 5,
        sound: false
    };

    /**
     * 초기화
     */
    static init(options = {}) {
        this.options = { ...this.defaultOptions, ...options };
        this.ensureContainer();
        this.setupStyles();
    }

    /**
     * 컨테이너 확인 및 생성
     */
    static ensureContainer() {
        if (!this.container) {
            this.container = document.getElementById('toast-container');
            
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'toast-container';
                this.container.className = `toast-container toast-${this.options.position}`;
                document.body.appendChild(this.container);
            }
        }
    }

    /**
     * 스타일 설정
     */
    static setupStyles() {
        if (document.getElementById('toast-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast-container {
                position: fixed;
                z-index: 9999;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                padding: 1rem;
                max-width: 420px;
            }
            
            .toast-container > * {
                pointer-events: auto;
            }
            
            .toast-top-right {
                top: 0;
                right: 0;
            }
            
            .toast-top-left {
                top: 0;
                left: 0;
            }
            
            .toast-bottom-right {
                bottom: 0;
                right: 0;
            }
            
            .toast-bottom-left {
                bottom: 0;
                left: 0;
            }
            
            .toast-top-center {
                top: 0;
                left: 50%;
                transform: translateX(-50%);
            }
            
            .toast-bottom-center {
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
            }
            
            .toast {
                min-width: 250px;
                max-width: 100%;
                padding: 1rem 1.25rem;
                border-radius: 0.5rem;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                position: relative;
                overflow: hidden;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .toast:hover {
                transform: scale(1.02);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
            }
            
            .toast.toast-success {
                background: linear-gradient(135deg, #10B981, #059669);
                color: white;
            }
            
            .toast.toast-error {
                background: linear-gradient(135deg, #EF4444, #DC2626);
                color: white;
            }
            
            .toast.toast-warning {
                background: linear-gradient(135deg, #F59E0B, #D97706);
                color: white;
            }
            
            .toast.toast-info {
                background: linear-gradient(135deg, #60A5FA, #3B82F6);
                color: white;
            }
            
            .toast-icon {
                font-size: 1.5rem;
                flex-shrink: 0;
            }
            
            .toast-content {
                flex: 1;
            }
            
            .toast-title {
                font-weight: bold;
                margin-bottom: 0.25rem;
            }
            
            .toast-message {
                font-size: 0.875rem;
                line-height: 1.4;
            }
            
            .toast-close {
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                width: 1.5rem;
                height: 1.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .toast-close:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.1);
            }
            
            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 0 0 0.5rem 0.5rem;
                transition: width linear;
            }
            
            .toast-slide-in {
                animation: slideIn 0.3s ease-out;
            }
            
            .toast-slide-out {
                animation: slideOut 0.3s ease-in;
            }
            
            .toast-fade-in {
                animation: fadeIn 0.3s ease-out;
            }
            
            .toast-fade-out {
                animation: fadeOut 0.3s ease-in;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @media (max-width: 640px) {
                .toast-container {
                    max-width: calc(100vw - 2rem);
                    left: 1rem !important;
                    right: 1rem !important;
                    transform: none !important;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * 토스트 표시
     */
    static show(options) {
        this.ensureContainer();
        
        const toast = typeof options === 'string' 
            ? { message: options } 
            : options;
        
        const config = { ...this.options, ...toast };
        
        // 큐에 추가
        this.queue.push(config);
        
        // 최대 개수 체크
        while (this.container.children.length >= config.maxToasts) {
            const oldestToast = this.container.firstChild;
            this.removeToast(oldestToast);
        }
        
        // 처리
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    /**
     * 큐 처리
     */
    static processQueue() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }
        
        this.isProcessing = true;
        const config = this.queue.shift();
        this.createToast(config);
        
        // 다음 토스트 처리
        setTimeout(() => this.processQueue(), 100);
    }

    /**
     * 토스트 생성
     */
    static createToast(config) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${config.type || 'info'} toast-${config.animation}-in`;
        
        // 아이콘
        const icon = this.getIcon(config.type);
        const iconElement = document.createElement('div');
        iconElement.className = 'toast-icon';
        iconElement.innerHTML = icon;
        
        // 컨텐츠
        const content = document.createElement('div');
        content.className = 'toast-content';
        
        if (config.title) {
            const title = document.createElement('div');
            title.className = 'toast-title';
            title.textContent = config.title;
            content.appendChild(title);
        }
        
        const message = document.createElement('div');
        message.className = 'toast-message';
        message.textContent = config.message;
        content.appendChild(message);
        
        // 조립
        toast.appendChild(iconElement);
        toast.appendChild(content);
        
        // 닫기 버튼
        if (config.closeable) {
            const closeBtn = document.createElement('div');
            closeBtn.className = 'toast-close';
            closeBtn.innerHTML = '×';
            closeBtn.onclick = () => this.removeToast(toast);
            toast.appendChild(closeBtn);
        }
        
        // 프로그레스 바
        if (config.duration > 0) {
            const progress = document.createElement('div');
            progress.className = 'toast-progress';
            progress.style.width = '100%';
            progress.style.transitionDuration = `${config.duration}ms`;
            toast.appendChild(progress);
            
            setTimeout(() => {
                progress.style.width = '0%';
            }, 10);
        }
        
        // 클릭으로 닫기
        toast.onclick = () => {
            if (config.onClick) {
                config.onClick();
            }
            this.removeToast(toast);
        };
        
        // 호버 시 일시정지
        if (config.pauseOnHover && config.duration > 0) {
            let timeoutId;
            let remainingTime = config.duration;
            let startTime = Date.now();
            
            const startTimer = () => {
                timeoutId = setTimeout(() => {
                    this.removeToast(toast);
                }, remainingTime);
            };
            
            const pauseTimer = () => {
                clearTimeout(timeoutId);
                remainingTime -= Date.now() - startTime;
                const progress = toast.querySelector('.toast-progress');
                if (progress) {
                    progress.style.transitionDuration = '0ms';
                    const percentage = (remainingTime / config.duration) * 100;
                    progress.style.width = `${percentage}%`;
                }
            };
            
            const resumeTimer = () => {
                startTime = Date.now();
                const progress = toast.querySelector('.toast-progress');
                if (progress) {
                    progress.style.transitionDuration = `${remainingTime}ms`;
                    progress.style.width = '0%';
                }
                startTimer();
            };
            
            toast.addEventListener('mouseenter', pauseTimer);
            toast.addEventListener('mouseleave', resumeTimer);
            
            startTimer();
        } else if (config.duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, config.duration);
        }
        
        // 사운드 재생
        if (config.sound) {
            this.playSound(config.type);
        }
        
        // 컨테이너에 추가
        this.container.appendChild(toast);
        
        // 콜백
        if (config.onShow) {
            config.onShow(toast);
        }
    }

    /**
     * 토스트 제거
     */
    static removeToast(toast) {
        if (!toast || !toast.parentNode) return;
        
        // 애니메이션
        const animation = toast.className.includes('slide') ? 'slide' : 'fade';
        toast.className = toast.className.replace(`${animation}-in`, `${animation}-out`);
        
        // 제거
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * 모든 토스트 제거
     */
    static clear() {
        if (!this.container) return;
        
        const toasts = Array.from(this.container.children);
        toasts.forEach(toast => this.removeToast(toast));
        this.queue = [];
    }

    /**
     * 아이콘 가져오기
     */
    static getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        return icons[type] || icons.info;
    }

    /**
     * 사운드 재생
     */
    static playSound(type) {
        try {
            const audio = new Audio();
            const sounds = {
                success: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE...',
                error: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE...',
                warning: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE...',
                info: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE...'
            };
            
            audio.src = sounds[type] || sounds.info;
            audio.volume = 0.5;
            audio.play().catch(() => {
                // 사운드 재생 실패 시 무시
            });
        } catch (error) {
            // 사운드 재생 실패 시 무시
        }
    }

    /**
     * 헬퍼 메서드들
     */
    static success(message, duration = 3000) {
        this.show({
            type: 'success',
            message,
            duration
        });
    }

    static error(message, duration = 5000) {
        this.show({
            type: 'error',
            message,
            duration
        });
    }

    static warning(message, duration = 4000) {
        this.show({
            type: 'warning',
            message,
            duration
        });
    }

    static info(message, duration = 3000) {
        this.show({
            type: 'info',
            message,
            duration
        });
    }

    /**
     * Promise 기반 토스트
     */
    static async promise(promise, messages) {
        const { loading, success, error } = messages;
        
        // 로딩 토스트 표시
        const loadingToast = document.createElement('div');
        loadingToast.className = 'toast toast-info';
        loadingToast.innerHTML = `
            <div class="toast-icon">⏳</div>
            <div class="toast-content">
                <div class="toast-message">${loading || 'Processing...'}</div>
            </div>
        `;
        
        this.ensureContainer();
        this.container.appendChild(loadingToast);
        
        try {
            const result = await promise;
            this.removeToast(loadingToast);
            this.success(success || 'Success!');
            return result;
        } catch (err) {
            this.removeToast(loadingToast);
            this.error(error || `Error: ${err.message}`);
            throw err;
        }
    }

    /**
     * 확인 토스트
     */
    static confirm(message, onConfirm, onCancel) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-warning';
        toast.innerHTML = `
            <div class="toast-icon">❓</div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
                <div class="toast-actions" style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                    <button class="toast-confirm" style="padding: 0.25rem 0.75rem; background: white; color: #D97706; border-radius: 0.25rem; font-weight: bold;">확인</button>
                    <button class="toast-cancel" style="padding: 0.25rem 0.75rem; background: rgba(255,255,255,0.2); color: white; border-radius: 0.25rem;">취소</button>
                </div>
            </div>
        `;
        
        this.ensureContainer();
        this.container.appendChild(toast);
        
        toast.querySelector('.toast-confirm').onclick = () => {
            this.removeToast(toast);
            if (onConfirm) onConfirm();
        };
        
        toast.querySelector('.toast-cancel').onclick = () => {
            this.removeToast(toast);
            if (onCancel) onCancel();
        };
    }

    /**
     * 입력 토스트
     */
    static input(message, onSubmit, placeholder = '') {
        const toast = document.createElement('div');
        toast.className = 'toast toast-info';
        toast.innerHTML = `
            <div class="toast-icon">✏️</div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
                <div class="toast-input" style="margin-top: 0.5rem;">
                    <input type="text" placeholder="${placeholder}" style="width: 100%; padding: 0.25rem 0.5rem; background: rgba(255,255,255,0.9); color: #1F2937; border-radius: 0.25rem;">
                    <button style="margin-top: 0.25rem; padding: 0.25rem 0.75rem; background: white; color: #3B82F6; border-radius: 0.25rem; font-weight: bold;">확인</button>
                </div>
            </div>
        `;
        
        this.ensureContainer();
        this.container.appendChild(toast);
        
        const input = toast.querySelector('input');
        const button = toast.querySelector('button');
        
        const submit = () => {
            const value = input.value.trim();
            if (value) {
                this.removeToast(toast);
                if (onSubmit) onSubmit(value);
            }
        };
        
        button.onclick = submit;
        input.onkeydown = (e) => {
            if (e.key === 'Enter') submit();
        };
        
        input.focus();
    }
}

// 자동 초기화
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Toast.init());
    } else {
        Toast.init();
    }
}