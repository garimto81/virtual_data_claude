/**
 * 모바일 최적화 모듈 - Phase 3
 * 터치 인터페이스, 제스처, 성능 최적화
 * Version: 1.0.0
 */

class MobileOptimizer {
  constructor() {
    this.touchStartTime = 0;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isLongPressing = false;
    this.longPressTimer = null;
    this.debounceTimers = new Map();
    this.swipeThreshold = 100; // 100px 이상 스와이프
    this.longPressDelay = 500; // 500ms 롱프레스
    this.debounceDelay = 300; // 300ms 디바운싱

    // 터치 영역 최소 크기 보장
    this.minTouchSize = 44; // 44x44px

    this.init();
  }

  /**
   * 초기화
   */
  init() {
    this.setupTouchOptimization();
    this.setupSwipeGestures();
    this.setupLongPress();
    this.ensureMinimumTouchSizes();
    this.setupHapticFeedback();
    this.setupDebouncing();
  }

  /**
   * 터치 최적화 설정
   */
  setupTouchOptimization() {
    // 터치 반응 최적화
    document.addEventListener('touchstart', (e) => {
      this.touchStartTime = performance.now();
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    // 터치 지연 제거
    document.addEventListener('touchend', (e) => {
      const touchEndTime = performance.now();
      const responseTime = touchEndTime - this.touchStartTime;

      // 성능 로깅 (개발 모드)
      if (responseTime > 50) {
        console.warn(`Slow touch response: ${responseTime.toFixed(2)}ms`);
      }
    }, { passive: true });

    // 더블탭 줌 방지
    let lastTouchTime = 0;
    document.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTouchTime;

      if (tapLength < 500 && tapLength > 0) {
        e.preventDefault();
      }
      lastTouchTime = currentTime;
    });
  }

  /**
   * 스와이프 제스처 설정
   */
  setupSwipeGestures() {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;

      // 스와이프 조건 확인
      if (Math.abs(deltaX) > this.swipeThreshold &&
          Math.abs(deltaX) > Math.abs(deltaY) &&
          deltaTime < 500) {

        const direction = deltaX > 0 ? 'right' : 'left';
        this.handleSwipe(direction, Math.abs(deltaX));
      }
    }, { passive: true });
  }

  /**
   * 스와이프 처리
   */
  handleSwipe(direction, distance) {
    if (direction === 'right' && distance > this.swipeThreshold) {
      // 오른쪽 스와이프 → 실행 취소
      if (window.actionHistory && window.actionHistory.history.length > 0) {
        this.triggerHaptic('success');
        window.actionHistory.undo();

        // 스와이프 피드백 표시
        this.showSwipeFeedback('실행 취소됨');
      } else {
        this.triggerHaptic('warning');
        this.showSwipeFeedback('실행 취소할 작업이 없습니다');
      }
    }
  }

  /**
   * 롱프레스 설정
   */
  setupLongPress() {
    document.addEventListener('touchstart', (e) => {
      const target = e.target.closest('[data-long-press]');
      if (!target) return;

      this.isLongPressing = false;
      this.longPressTimer = setTimeout(() => {
        this.isLongPressing = true;
        this.handleLongPress(target, e);
      }, this.longPressDelay);
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    }, { passive: true });
  }

  /**
   * 롱프레스 처리
   */
  handleLongPress(element, event) {
    this.triggerHaptic('selection');

    const action = element.dataset.longPress;
    const rect = element.getBoundingClientRect();

    // 컨텍스트 메뉴 표시
    this.showContextMenu(action, {
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  }

  /**
   * 컨텍스트 메뉴 표시
   */
  showContextMenu(action, position) {
    // 기존 메뉴 제거
    const existingMenu = document.getElementById('mobile-context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.id = 'mobile-context-menu';
    menu.className = 'mobile-context-menu';
    menu.style.cssText = `
      position: fixed;
      top: ${position.y}px;
      left: ${position.x}px;
      background: #333;
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      transform: translateX(-50%) translateY(-100%);
      min-width: 120px;
    `;

    // 메뉴 항목들
    const menuItems = this.getContextMenuItems(action);
    menuItems.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.className = 'context-menu-item';
      menuItem.textContent = item.label;
      menuItem.style.cssText = `
        padding: 8px 12px;
        color: white;
        cursor: pointer;
        border-radius: 4px;
        font-size: 14px;
        min-height: 44px;
        display: flex;
        align-items: center;
      `;

      menuItem.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        item.action();
        menu.remove();
      });

      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.background = '#555';
      });

      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.background = 'transparent';
      });

      menu.appendChild(menuItem);
    });

    document.body.appendChild(menu);

    // 3초 후 자동 제거
    setTimeout(() => {
      if (menu.parentNode) {
        menu.remove();
      }
    }, 3000);

    // 외부 터치 시 제거
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('touchstart', closeMenu);
      }
    };

    setTimeout(() => {
      document.addEventListener('touchstart', closeMenu);
    }, 100);
  }

  /**
   * 컨텍스트 메뉴 항목 가져오기
   */
  getContextMenuItems(action) {
    const items = {
      'player': [
        {
          label: '📝 수정',
          action: () => console.log('플레이어 수정')
        },
        {
          label: '🗑️ 삭제',
          action: () => console.log('플레이어 삭제')
        },
        {
          label: '📋 복사',
          action: () => console.log('정보 복사')
        }
      ],
      'default': [
        {
          label: '↶ 실행 취소',
          action: () => window.actionHistory?.undo()
        },
        {
          label: '🔄 새로고침',
          action: () => location.reload()
        }
      ]
    };

    return items[action] || items['default'];
  }

  /**
   * 최소 터치 크기 보장
   */
  ensureMinimumTouchSizes() {
    const buttons = document.querySelectorAll('button, [role="button"], .tap-target');

    buttons.forEach(button => {
      const rect = button.getBoundingClientRect();
      const style = window.getComputedStyle(button);

      const currentWidth = parseFloat(style.width) || rect.width;
      const currentHeight = parseFloat(style.height) || rect.height;

      if (currentWidth < this.minTouchSize || currentHeight < this.minTouchSize) {
        // 최소 크기 보장
        button.style.minWidth = `${this.minTouchSize}px`;
        button.style.minHeight = `${this.minTouchSize}px`;
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';

        console.log(`Touch size optimized: ${button.textContent || button.className}`);
      }
    });
  }

  /**
   * 햅틱 피드백 설정
   */
  setupHapticFeedback() {
    // iOS용 햅틱 피드백
    if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
      this.hasHapticFeedback = true;
    }

    // Android용 진동 API
    if (navigator.vibrate) {
      this.hasVibration = true;
    }
  }

  /**
   * 햅틱 피드백 실행
   */
  triggerHaptic(type = 'light') {
    const patterns = {
      'light': [50],
      'medium': [100],
      'heavy': [200],
      'success': [50, 50, 100],
      'warning': [100, 50, 100],
      'error': [200, 100, 200],
      'selection': [10]
    };

    if (this.hasVibration && navigator.vibrate) {
      navigator.vibrate(patterns[type] || patterns['light']);
    }

    // iOS 햅틱 (웹에서는 제한적)
    if (this.hasHapticFeedback && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(patterns[type] || patterns['light']);
    }
  }

  /**
   * 디바운싱 설정
   */
  setupDebouncing() {
    // 자주 호출되는 함수들에 디바운싱 적용
    this.debouncedResize = this.debounce(this.handleResize.bind(this), 250);
    this.debouncedScroll = this.debounce(this.handleScroll.bind(this), 16); // 60fps

    window.addEventListener('resize', this.debouncedResize);
    window.addEventListener('scroll', this.debouncedScroll, { passive: true });
  }

  /**
   * 디바운스 함수
   */
  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * 리사이즈 처리
   */
  handleResize() {
    // 뷰포트 변경 시 터치 크기 재계산
    this.ensureMinimumTouchSizes();

    // 가상 키보드 대응
    this.handleVirtualKeyboard();
  }

  /**
   * 스크롤 처리
   */
  handleScroll() {
    // 스크롤 성능 최적화를 위한 로직
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // 스크롤 기반 최적화 로직 추가 가능
  }

  /**
   * 가상 키보드 대응
   */
  handleVirtualKeyboard() {
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const windowHeight = window.innerHeight;

    if (viewportHeight < windowHeight * 0.7) {
      // 가상 키보드가 열린 것으로 판단
      document.body.classList.add('keyboard-open');
    } else {
      document.body.classList.remove('keyboard-open');
    }
  }

  /**
   * 스와이프 피드백 표시
   */
  showSwipeFeedback(message) {
    const feedback = document.createElement('div');
    feedback.className = 'swipe-feedback';
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    document.body.appendChild(feedback);

    // 페이드 인
    setTimeout(() => {
      feedback.style.opacity = '1';
    }, 10);

    // 페이드 아웃 후 제거
    setTimeout(() => {
      feedback.style.opacity = '0';
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback);
        }
      }, 300);
    }, 2000);
  }

  /**
   * 성능 모니터링
   */
  monitorPerformance() {
    if (performance.memory) {
      const memory = performance.memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100;

      if (usedMB > 20) {
        console.warn(`High memory usage: ${usedMB}MB`);

        // 메모리 정리 시도
        this.cleanupMemory();
      }
    }
  }

  /**
   * 메모리 정리
   */
  cleanupMemory() {
    // 타이머 정리
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // 오래된 DOM 이벤트 리스너 정리
    const oldMenus = document.querySelectorAll('#mobile-context-menu');
    oldMenus.forEach(menu => menu.remove());

    // 가비지 컬렉션 유도 (브라우저 의존적)
    if (window.gc) {
      window.gc();
    }
  }

  /**
   * 디스트로이
   */
  destroy() {
    // 이벤트 리스너 제거
    window.removeEventListener('resize', this.debouncedResize);
    window.removeEventListener('scroll', this.debouncedScroll);

    // 타이머 정리
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }

    this.cleanupMemory();
  }
}

// 전역 인스턴스 생성
window.mobileOptimizer = new MobileOptimizer();

// 성능 모니터링 (5초마다)
setInterval(() => {
  window.mobileOptimizer.monitorPerformance();
}, 5000);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileOptimizer;
}