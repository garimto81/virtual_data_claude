/**
 * 더블탭 핸들러 - Phase 2
 * 위험한 작업에 대한 더블탭 확인 시스템
 * Version: 1.0.0
 */

class DoubleTapHandler {
  constructor() {
    this.pendingActions = new Map(); // 대기 중인 액션들
    this.tapTimeout = 2000; // 2초 내 재탭 필요
    this.resetTimeout = null;
  }

  /**
   * 더블탭 필요 버튼 설정
   */
  setupButton(button, action, dangerLevel = 'warning') {
    if (!button) return;

    // 기존 이벤트 제거 (중복 방지)
    button.removeEventListener('click', button._doubleTapHandler);
    button.removeEventListener('touchend', button._doubleTapHandler);

    // 원본 텍스트 저장
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }

    // 새 핸들러 생성
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleTap(button, action, dangerLevel);
    };

    // 핸들러 저장 (제거용)
    button._doubleTapHandler = handler;

    // 이벤트 등록 (모바일과 데스크톱 모두 지원)
    button.addEventListener('click', handler);
    button.addEventListener('touchend', handler, { passive: false });

    // 위험 레벨에 따른 스타일 설정
    this.applyDangerStyle(button, dangerLevel);
  }

  /**
   * 탭 처리
   */
  handleTap(button, action, dangerLevel) {
    const buttonId = button.id || button.dataset.actionId || Math.random().toString(36);

    if (this.pendingActions.has(buttonId)) {
      // 두 번째 탭 - 실행
      this.executeAction(button, action);
    } else {
      // 첫 번째 탭 - 경고
      this.showWarning(button, buttonId, dangerLevel);
    }
  }

  /**
   * 경고 표시
   */
  showWarning(button, buttonId, dangerLevel) {
    // 기존 타이머가 있으면 취소 (충돌 방지)
    if (this.pendingActions.has(buttonId)) {
      clearTimeout(this.pendingActions.get(buttonId).timer);
    }

    // 버튼 텍스트 변경
    const warningText = this.getWarningText(dangerLevel);
    button.textContent = warningText;
    button.classList.add('double-tap-warning');

    // 진동 피드백 (모바일)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // 타이머 설정
    const timer = setTimeout(() => {
      this.resetButton(button, buttonId);
    }, this.tapTimeout);

    // 대기 액션 저장
    this.pendingActions.set(buttonId, {
      timer: timer,
      timestamp: Date.now()
    });

    // 스낵바로 안내
    if (window.actionHistory) {
      window.actionHistory.showSnackbar(
        `⚠️ ${warningText} - ${button.dataset.originalText}을(를) 실행하려면`,
        null,
        'warning'
      );
    }
  }

  /**
   * 액션 실행
   */
  async executeAction(button, action) {
    const buttonId = button.id || button.dataset.actionId || Math.random().toString(36);

    // 대기 액션 제거
    if (this.pendingActions.has(buttonId)) {
      clearTimeout(this.pendingActions.get(buttonId).timer);
      this.pendingActions.delete(buttonId);
    }

    // 버튼 상태 변경
    button.classList.remove('double-tap-warning');
    button.classList.add('executing');
    button.disabled = true;
    button.textContent = '실행 중...';

    try {
      // 액션 실행
      if (typeof action === 'function') {
        await action();
      } else if (action && action.execute) {
        await window.actionHistory.execute(action);
      }

      // 성공 피드백
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]); // 성공 패턴
      }
    } catch (error) {
      console.error('더블탭 액션 실행 실패:', error);

      // 에러 피드백
      if (window.actionHistory) {
        window.actionHistory.showSnackbar(
          '❌ 작업 실행 실패: ' + error.message,
          null,
          'error'
        );
      }
    } finally {
      // 버튼 복원
      setTimeout(() => {
        button.disabled = false;
        button.classList.remove('executing');
        button.textContent = button.dataset.originalText;
      }, 1000);
    }
  }

  /**
   * 버튼 초기화
   */
  resetButton(button, buttonId) {
    button.textContent = button.dataset.originalText;
    button.classList.remove('double-tap-warning');
    this.pendingActions.delete(buttonId);
  }

  /**
   * 경고 텍스트 가져오기
   */
  getWarningText(dangerLevel) {
    const texts = {
      'critical': '⚠️ 한 번 더 탭!',
      'warning': '한 번 더 탭하세요',
      'info': '확인하려면 다시 탭'
    };
    return texts[dangerLevel] || texts['warning'];
  }

  /**
   * 위험 레벨 스타일 적용
   */
  applyDangerStyle(button, dangerLevel) {
    button.classList.add('double-tap-required');
    button.dataset.dangerLevel = dangerLevel;

    // 위험 레벨에 따른 색상
    if (dangerLevel === 'critical') {
      button.classList.add('danger-critical');
    } else if (dangerLevel === 'warning') {
      button.classList.add('danger-warning');
    }
  }

  /**
   * 모든 대기 액션 취소
   */
  clearAll() {
    this.pendingActions.forEach((action, buttonId) => {
      clearTimeout(action.timer);
    });
    this.pendingActions.clear();
  }

  /**
   * 특정 버튼의 대기 액션 취소
   */
  clearButton(button) {
    const buttonId = button.id || button.dataset.actionId;
    if (buttonId && this.pendingActions.has(buttonId)) {
      clearTimeout(this.pendingActions.get(buttonId).timer);
      this.pendingActions.delete(buttonId);
      this.resetButton(button, buttonId);
    }
  }
}

// 전역 인스턴스 생성
window.doubleTapHandler = new DoubleTapHandler();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DoubleTapHandler;
}