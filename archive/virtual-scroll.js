/**
 * 가상 스크롤 모듈 - Phase 3
 * 대용량 리스트 최적화 및 성능 향상
 * Version: 1.0.0
 */

class VirtualScroll {
  constructor(container, options = {}) {
    this.container = container;
    this.itemHeight = options.itemHeight || 60;
    this.bufferSize = options.bufferSize || 5;
    this.items = [];
    this.visibleStartIndex = 0;
    this.visibleEndIndex = 0;
    this.totalHeight = 0;
    this.containerHeight = 0;
    this.scrollTop = 0;

    // 성능 최적화
    this.renderDebounceDelay = 16; // 60fps
    this.intersectionObserver = null;
    this.recyclePool = [];
    this.activeElements = new Map();

    this.init();
  }

  /**
   * 초기화
   */
  init() {
    this.setupContainer();
    this.setupScrollListener();
    this.setupResizeObserver();
    this.setupIntersectionObserver();
  }

  /**
   * 컨테이너 설정
   */
  setupContainer() {
    this.container.style.cssText += `
      overflow-y: auto;
      position: relative;
      -webkit-overflow-scrolling: touch;
    `;

    // 가상 스크롤 래퍼 생성
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'virtual-scroll-wrapper';
    this.wrapper.style.cssText = `
      position: relative;
      width: 100%;
    `;

    // 스크롤 공간 생성
    this.spacer = document.createElement('div');
    this.spacer.className = 'virtual-scroll-spacer';
    this.spacer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: -1;
    `;

    this.container.appendChild(this.spacer);
    this.container.appendChild(this.wrapper);

    this.updateContainerHeight();
  }

  /**
   * 스크롤 이벤트 설정
   */
  setupScrollListener() {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    this.container.addEventListener('scroll', onScroll, { passive: true });
  }

  /**
   * 리사이즈 옵저버 설정
   */
  setupResizeObserver() {
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateContainerHeight();
        this.render();
      });
      this.resizeObserver.observe(this.container);
    }
  }

  /**
   * 인터섹션 옵저버 설정
   */
  setupIntersectionObserver() {
    if (window.IntersectionObserver) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) {
              this.recycleElement(entry.target);
            }
          });
        },
        { root: this.container, threshold: 0 }
      );
    }
  }

  /**
   * 데이터 설정
   */
  setItems(items) {
    this.items = items;
    this.totalHeight = this.items.length * this.itemHeight;
    this.spacer.style.height = `${this.totalHeight}px`;
    this.render();
  }

  /**
   * 아이템 추가
   */
  addItem(item, index = -1) {
    if (index === -1) {
      this.items.push(item);
    } else {
      this.items.splice(index, 0, item);
    }
    this.updateTotalHeight();
    this.render();
  }

  /**
   * 아이템 제거
   */
  removeItem(index) {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
      this.updateTotalHeight();
      this.render();
    }
  }

  /**
   * 전체 높이 업데이트
   */
  updateTotalHeight() {
    this.totalHeight = this.items.length * this.itemHeight;
    this.spacer.style.height = `${this.totalHeight}px`;
  }

  /**
   * 컨테이너 높이 업데이트
   */
  updateContainerHeight() {
    this.containerHeight = this.container.clientHeight;
  }

  /**
   * 스크롤 처리
   */
  handleScroll() {
    this.scrollTop = this.container.scrollTop;
    this.calculateVisibleRange();
    this.render();
  }

  /**
   * 보이는 범위 계산
   */
  calculateVisibleRange() {
    const start = Math.floor(this.scrollTop / this.itemHeight);
    const end = Math.min(
      start + Math.ceil(this.containerHeight / this.itemHeight),
      this.items.length - 1
    );

    this.visibleStartIndex = Math.max(0, start - this.bufferSize);
    this.visibleEndIndex = Math.min(this.items.length - 1, end + this.bufferSize);
  }

  /**
   * 렌더링
   */
  render() {
    // 현재 활성 요소들 중 범위 밖 요소들 리사이클
    this.activeElements.forEach((element, index) => {
      if (index < this.visibleStartIndex || index > this.visibleEndIndex) {
        this.recycleElement(element);
        this.activeElements.delete(index);
      }
    });

    // 보이는 범위의 요소들 렌더링
    for (let i = this.visibleStartIndex; i <= this.visibleEndIndex; i++) {
      if (!this.activeElements.has(i)) {
        const element = this.createOrReuseElement(i);
        this.activeElements.set(i, element);
      }
    }
  }

  /**
   * 요소 생성 또는 재사용
   */
  createOrReuseElement(index) {
    let element = this.recyclePool.pop();

    if (!element) {
      element = this.createElement(index);
    } else {
      this.updateElement(element, index);
    }

    // 위치 설정
    element.style.transform = `translateY(${index * this.itemHeight}px)`;
    element.style.position = 'absolute';
    element.style.top = '0';
    element.style.width = '100%';
    element.style.height = `${this.itemHeight}px`;

    if (!element.parentNode) {
      this.wrapper.appendChild(element);
    }

    // 인터섹션 옵저버 등록
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    }

    return element;
  }

  /**
   * 요소 생성 (오버라이드 필요)
   */
  createElement(index) {
    const element = document.createElement('div');
    element.className = 'virtual-scroll-item';
    element.dataset.index = index;

    this.updateElement(element, index);
    return element;
  }

  /**
   * 요소 업데이트 (오버라이드 필요)
   */
  updateElement(element, index) {
    const item = this.items[index];
    element.dataset.index = index;
    element.textContent = `Item ${index}: ${JSON.stringify(item)}`;
  }

  /**
   * 요소 리사이클
   */
  recycleElement(element) {
    if (element && element.parentNode) {
      // 인터섹션 옵저버 해제
      if (this.intersectionObserver) {
        this.intersectionObserver.unobserve(element);
      }

      // DOM에서 제거하지 않고 숨김 (성능 최적화)
      element.style.display = 'none';
      this.recyclePool.push(element);
    }
  }

  /**
   * 특정 인덱스로 스크롤
   */
  scrollToIndex(index) {
    const targetScrollTop = index * this.itemHeight;
    this.container.scrollTop = targetScrollTop;
  }

  /**
   * 특정 아이템으로 스크롤
   */
  scrollToItem(item) {
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.scrollToIndex(index);
    }
  }

  /**
   * 메모리 정리
   */
  cleanup() {
    // 리사이즈 옵저버 해제
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    // 인터섹션 옵저버 해제
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    // 재활용 풀 정리
    this.recyclePool.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });

    this.recyclePool = [];
    this.activeElements.clear();
  }

  /**
   * 디스트로이
   */
  destroy() {
    this.cleanup();

    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }

    if (this.spacer && this.spacer.parentNode) {
      this.spacer.parentNode.removeChild(this.spacer);
    }
  }
}

/**
 * 플레이어 리스트용 가상 스크롤
 */
class PlayerVirtualScroll extends VirtualScroll {
  constructor(container, options = {}) {
    super(container, {
      itemHeight: 80,
      bufferSize: 3,
      ...options
    });
  }

  /**
   * 플레이어 요소 생성
   */
  createElement(index) {
    const element = document.createElement('div');
    element.className = 'player-virtual-item';
    element.style.cssText = `
      display: flex;
      align-items: center;
      padding: 8px 16px;
      border-bottom: 1px solid #e5e7eb;
      background: white;
      box-sizing: border-box;
    `;

    element.innerHTML = `
      <div class="player-avatar" style="
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        font-weight: bold;
        color: #6b7280;
      "></div>
      <div class="player-info" style="flex: 1;">
        <div class="player-name" style="font-weight: 500; margin-bottom: 4px;"></div>
        <div class="player-chips" style="font-size: 14px; color: #6b7280;"></div>
      </div>
      <div class="player-status" style="
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      "></div>
    `;

    this.updateElement(element, index);
    return element;
  }

  /**
   * 플레이어 요소 업데이트
   */
  updateElement(element, index) {
    const player = this.items[index];
    if (!player) return;

    element.dataset.index = index;
    element.dataset.playerId = player.id || index;

    // 아바타 업데이트
    const avatar = element.querySelector('.player-avatar');
    avatar.textContent = player.name ? player.name.charAt(0).toUpperCase() : (index + 1);

    // 이름 업데이트
    const nameEl = element.querySelector('.player-name');
    nameEl.textContent = player.name || `플레이어 ${index + 1}`;

    // 칩 업데이트
    const chipsEl = element.querySelector('.player-chips');
    const chips = typeof player.chips === 'number' ? player.chips.toLocaleString() : player.chips || '0';
    chipsEl.textContent = `${chips} 칩`;

    // 상태 업데이트
    const statusEl = element.querySelector('.player-status');
    const status = player.status || 'IN';
    statusEl.textContent = status;
    statusEl.style.background = status === 'IN' ? '#dcfce7' : '#fef3c7';
    statusEl.style.color = status === 'IN' ? '#16a34a' : '#d97706';

    // 표시 상태 복원
    element.style.display = 'flex';
  }
}

// 전역 인스턴스
window.VirtualScroll = VirtualScroll;
window.PlayerVirtualScroll = PlayerVirtualScroll;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VirtualScroll, PlayerVirtualScroll };
}