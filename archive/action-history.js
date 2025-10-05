/**
 * 모바일 최적화 ActionHistory 시스템
 * Version: 1.0.0
 * Phase 1 구현 - 즉시 실행 & 실행 취소 패턴
 */

class MobileActionHistory {
  constructor() {
    this.history = [];
    this.maxSize = 20; // 모바일 메모리 고려
    this.isProcessing = false;
    this.snackbarQueue = []; // 스낵바 큐 시스템
    this.currentSnackbar = null;

    // WeakMap으로 메모리 누수 방지
    this.actionMetadata = new WeakMap();

    // localStorage 자동 백업
    this.loadFromStorage();
  }

  /**
   * 작업 실행 및 히스토리 저장
   */
  async execute(action) {
    if (this.isProcessing) {
      console.warn('Another action is processing');
      return;
    }

    this.isProcessing = true;

    try {
      // 작업 실행
      const result = await action.execute();

      // 히스토리에 추가
      this.history.push(action);

      // 크기 제한 체크
      if (this.history.length > this.maxSize) {
        const removed = this.history.shift();
        // WeakMap이므로 자동 가비지 컬렉션
        this.actionMetadata.delete(removed);
      }

      // 메타데이터 저장
      this.actionMetadata.set(action, {
        timestamp: Date.now(),
        result: result
      });

      // 스낵바 표시
      this.showSnackbar(action.getDescription(), () => this.undo());

      // localStorage 백업
      this.saveToStorage();

      return result;
    } catch (error) {
      console.error('Action execution failed:', error);
      this.showSnackbar('작업 실패: ' + error.message, null, 'error');
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 마지막 작업 실행 취소
   */
  async undo() {
    if (this.history.length === 0) {
      this.showSnackbar('실행 취소할 작업이 없습니다', null, 'info');
      return;
    }

    if (this.isProcessing) {
      console.warn('Cannot undo while processing');
      return;
    }

    this.isProcessing = true;
    const action = this.history.pop();

    try {
      await action.undo();
      this.showSnackbar('실행 취소됨: ' + action.getDescription());
      this.saveToStorage();

      // 메타데이터 정리
      this.actionMetadata.delete(action);
    } catch (error) {
      console.error('Undo failed:', error);
      this.showSnackbar('실행 취소 실패', null, 'error');
      // 실패 시 히스토리에 다시 추가
      this.history.push(action);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 스낵바 표시 (큐 시스템)
   */
  showSnackbar(message, undoCallback = null, type = 'info') {
    const snackbarData = { message, undoCallback, type };

    // 큐에 추가
    this.snackbarQueue.push(snackbarData);

    // 현재 표시 중인 스낵바가 없으면 즉시 표시
    if (!this.currentSnackbar) {
      this.displayNextSnackbar();
    }
  }

  /**
   * 다음 스낵바 표시
   */
  displayNextSnackbar() {
    if (this.snackbarQueue.length === 0) {
      this.currentSnackbar = null;
      return;
    }

    const { message, undoCallback, type } = this.snackbarQueue.shift();
    const snackbar = document.getElementById('snackbar');

    if (!snackbar) {
      console.error('Snackbar element not found');
      return;
    }

    // 기존 내용 초기화
    snackbar.innerHTML = '';
    snackbar.className = 'snackbar';

    // 메시지 추가
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    snackbar.appendChild(messageSpan);

    // 실행취소 버튼 추가
    if (undoCallback) {
      const undoBtn = document.createElement('button');
      undoBtn.textContent = '실행취소';
      undoBtn.className = 'snackbar-undo-btn';
      undoBtn.onclick = () => {
        undoCallback();
        this.hideCurrentSnackbar();
      };
      snackbar.appendChild(undoBtn);
    }

    // 타입별 스타일 적용
    snackbar.classList.add(`snackbar-${type}`, 'show');

    // 3초 후 자동 숨김
    this.currentSnackbar = setTimeout(() => {
      this.hideCurrentSnackbar();
    }, 3000);
  }

  /**
   * 현재 스낵바 숨기기
   */
  hideCurrentSnackbar() {
    const snackbar = document.getElementById('snackbar');
    if (snackbar) {
      snackbar.classList.remove('show');
    }

    if (this.currentSnackbar) {
      clearTimeout(this.currentSnackbar);
      this.currentSnackbar = null;
    }

    // 다음 스낵바 표시
    setTimeout(() => {
      this.displayNextSnackbar();
    }, 300);
  }

  /**
   * localStorage에 저장
   */
  saveToStorage() {
    try {
      const simplified = this.history.slice(-10).map(action => ({
        type: action.constructor.name,
        data: action.getMinimalData(),
        timestamp: this.actionMetadata.get(action)?.timestamp || Date.now()
      }));
      localStorage.setItem('actionHistory', JSON.stringify(simplified));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }

  /**
   * localStorage에서 복원
   */
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('actionHistory');
      if (saved) {
        const data = JSON.parse(saved);
        console.log(`Loaded ${data.length} actions from storage`);
        // 필요시 복원 로직 구현
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  /**
   * 히스토리 초기화
   */
  clear() {
    this.history = [];
    localStorage.removeItem('actionHistory');
    this.showSnackbar('히스토리가 초기화되었습니다');
  }
}

/**
 * 플레이어 삭제 액션
 */
class DeletePlayerAction {
  constructor(player) {
    this.player = { ...player }; // 깊은 복사
    this.timestamp = Date.now();
  }

  getDescription() {
    return `${this.player.name} 삭제됨`;
  }

  async execute() {
    // API 호출
    const result = await window.tableManager?.deletePlayer(this.player.name);
    if (!result) {
      throw new Error('플레이어 삭제 실패');
    }
    return result;
  }

  async undo() {
    // 플레이어 복원
    const result = await window.tableManager?.addPlayer(this.player);
    if (!result) {
      throw new Error('플레이어 복원 실패');
    }
    return result;
  }

  getMinimalData() {
    return {
      id: this.player.id,
      name: this.player.name,
      seat: this.player.seat
    };
  }
}

/**
 * 플레이어 추가 액션
 */
class AddPlayerAction {
  constructor(player) {
    this.player = { ...player };
    this.timestamp = Date.now();
  }

  getDescription() {
    return `${this.player.name} 추가됨`;
  }

  async execute() {
    const result = await window.tableManager?.addPlayer(this.player);
    if (!result) {
      throw new Error('플레이어 추가 실패');
    }
    return result;
  }

  async undo() {
    const result = await window.tableManager?.deletePlayer(this.player.name);
    if (!result) {
      throw new Error('플레이어 삭제 실패');
    }
    return result;
  }

  getMinimalData() {
    return {
      id: this.player.id,
      name: this.player.name,
      seat: this.player.seat
    };
  }
}

/**
 * 플레이어 수정 액션
 */
class UpdatePlayerAction {
  constructor(oldPlayer, newPlayer) {
    this.oldPlayer = { ...oldPlayer };
    this.newPlayer = { ...newPlayer };
    this.timestamp = Date.now();
  }

  getDescription() {
    return `${this.oldPlayer.name} 정보 수정됨`;
  }

  async execute() {
    const result = await window.tableManager?.updatePlayer(this.newPlayer);
    if (!result) {
      throw new Error('플레이어 수정 실패');
    }
    return result;
  }

  async undo() {
    const result = await window.tableManager?.updatePlayer(this.oldPlayer);
    if (!result) {
      throw new Error('플레이어 복원 실패');
    }
    return result;
  }

  getMinimalData() {
    return {
      oldName: this.oldPlayer.name,
      newName: this.newPlayer.name,
      seat: this.newPlayer.seat
    };
  }
}

/**
 * 일괄 작업 액션 (여러 작업을 하나로 묶음)
 */
class BatchAction {
  constructor(actions, description) {
    this.actions = actions;
    this.description = description;
    this.timestamp = Date.now();
  }

  getDescription() {
    return this.description;
  }

  async execute() {
    const results = [];
    for (const action of this.actions) {
      results.push(await action.execute());
    }
    return results;
  }

  async undo() {
    // 역순으로 실행 취소
    const results = [];
    for (let i = this.actions.length - 1; i >= 0; i--) {
      results.push(await this.actions[i].undo());
    }
    return results;
  }

  getMinimalData() {
    return {
      count: this.actions.length,
      description: this.description
    };
  }
}

// 전역 인스턴스 생성
window.actionHistory = new MobileActionHistory();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MobileActionHistory,
    DeletePlayerAction,
    AddPlayerAction,
    UpdatePlayerAction,
    BatchAction
  };
}