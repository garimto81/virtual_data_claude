/**
 * 🎰 Virtual Data v4.0.0 Phoenix
 * Table Module - 테이블 및 게임 상태 관리
 */

import { Logger } from '../../utils/logger.js';

export default class TableModule {
  constructor(app) {
    this.app = app;
    this.logger = new Logger('TableModule');
    this.name = 'table';

    // 테이블 상태
    this.state = {
      currentTable: null,
      isActive: false,
      playerCount: 0,
      blinds: { small: 0, big: 0 },
      pot: 0,
      gameType: 'texas_holdem',
      round: 'preflop'
    };

    // 이벤트 핸들러
    this.eventHandlers = new Map();
  }

  async init() {
    this.logger.info('🎲 테이블 모듈 초기화 시작');

    try {
      // 저장된 테이블 상태 복원
      await this._loadTableState();

      // 이벤트 리스너 등록
      this._registerEventListeners();

      // UI 요소 초기화
      this._initializeUI();

      this.logger.success('✅ 테이블 모듈 초기화 완료');

    } catch (error) {
      this.logger.error('❌ 테이블 모듈 초기화 실패:', error);
      throw error;
    }
  }

  async destroy() {
    this.logger.info('🗑️ 테이블 모듈 정리 중...');

    // 이벤트 리스너 제거
    this._unregisterEventListeners();

    // 상태 저장
    await this._saveTableState();

    this.logger.success('✅ 테이블 모듈 정리 완료');
  }

  /**
   * 테이블 감지 및 설정
   */
  async detectTable() {
    try {
      this.logger.info('🔍 테이블 감지 시작...');

      // DOM에서 테이블 정보 추출
      const tableInfo = await this._extractTableInfo();

      if (tableInfo) {
        await this._updateTableState(tableInfo);
        this.app.events.emit('table:detected', tableInfo);
        return tableInfo;
      }

      return null;

    } catch (error) {
      this.logger.error('❌ 테이블 감지 실패:', error);
      this.app.events.emit('table:error', { type: 'detection', error });
      return null;
    }
  }

  /**
   * 테이블 상태 업데이트
   */
  async updateTableState(updates) {
    try {
      const oldState = { ...this.state };
      this.state = { ...this.state, ...updates };

      // 상태 변경 이벤트 발생
      this.app.events.emit('table:stateChanged', {
        oldState,
        newState: this.state,
        changes: updates
      });

      // 저장
      await this._saveTableState();

      this.logger.debug('📊 테이블 상태 업데이트:', updates);

    } catch (error) {
      this.logger.error('❌ 테이블 상태 업데이트 실패:', error);
    }
  }

  /**
   * 현재 테이블 정보 반환
   */
  getCurrentTable() {
    return {
      ...this.state,
      timestamp: Date.now()
    };
  }

  /**
   * 테이블 활성화 여부
   */
  isTableActive() {
    return this.state.isActive && this.state.currentTable;
  }

  // ==================== Private Methods ====================

  /**
   * DOM에서 테이블 정보 추출
   */
  async _extractTableInfo() {
    const info = {};

    // 테이블명 추출
    const tableNameElement = document.querySelector('.table-name, .game-title, .room-name');
    if (tableNameElement) {
      info.name = tableNameElement.textContent.trim();
    }

    // 블라인드 정보 추출
    const blindsElement = document.querySelector('.blinds, .stakes');
    if (blindsElement) {
      const blindsText = blindsElement.textContent.trim();
      const blindsMatch = blindsText.match(/(\d+)\/(\d+)/);
      if (blindsMatch) {
        info.blinds = {
          small: parseInt(blindsMatch[1]),
          big: parseInt(blindsMatch[2])
        };
      }
    }

    // 플레이어 수 추출
    const playerElements = document.querySelectorAll('.player, .seat');
    if (playerElements) {
      info.playerCount = playerElements.length;
    }

    // 게임 타입 추출
    const gameTypeElement = document.querySelector('.game-type, .variant');
    if (gameTypeElement) {
      info.gameType = gameTypeElement.textContent.trim().toLowerCase().replace(/\s+/g, '_');
    }

    return Object.keys(info).length > 0 ? info : null;
  }

  /**
   * 테이블 상태 업데이트
   */
  async _updateTableState(tableInfo) {
    const updates = {
      currentTable: tableInfo.name || 'Unknown Table',
      isActive: true,
      ...tableInfo
    };

    await this.updateTableState(updates);
  }

  /**
   * 이벤트 리스너 등록
   */
  _registerEventListeners() {
    // 게임 상태 변경 감지
    this.eventHandlers.set('game:roundChanged', (data) => {
      this.updateTableState({ round: data.round });
    });

    // 플레이어 변경 감지
    this.eventHandlers.set('player:countChanged', (data) => {
      this.updateTableState({ playerCount: data.count });
    });

    // 팟 사이즈 변경 감지
    this.eventHandlers.set('game:potChanged', (data) => {
      this.updateTableState({ pot: data.amount });
    });

    // 이벤트 리스너 등록
    for (const [event, handler] of this.eventHandlers) {
      this.app.events.on(event, handler, this);
    }

    this.logger.debug('📝 테이블 이벤트 리스너 등록 완료');
  }

  /**
   * 이벤트 리스너 제거
   */
  _unregisterEventListeners() {
    for (const [event, handler] of this.eventHandlers) {
      this.app.events.off(event, handler);
    }

    this.eventHandlers.clear();
    this.logger.debug('🗑️ 테이블 이벤트 리스너 제거 완료');
  }

  /**
   * UI 초기화
   */
  _initializeUI() {
    // 테이블 정보 표시 영역
    const tableDisplay = document.getElementById('table-info');
    if (tableDisplay) {
      this._updateTableDisplay();
    }

    // 테이블 감지 버튼
    const detectButton = document.getElementById('detect-table-btn');
    if (detectButton) {
      detectButton.addEventListener('click', () => this.detectTable());
    }
  }

  /**
   * 테이블 정보 UI 업데이트
   */
  _updateTableDisplay() {
    const tableDisplay = document.getElementById('table-info');
    if (!tableDisplay) return;

    const { currentTable, isActive, playerCount, blinds } = this.state;

    tableDisplay.innerHTML = `
      <div class="table-status ${isActive ? 'active' : 'inactive'}">
        <h3>🎲 ${currentTable || 'No Table'}</h3>
        <div class="table-details">
          <span class="players">👥 ${playerCount} players</span>
          <span class="blinds">💰 ${blinds.small}/${blinds.big}</span>
          <span class="status">${isActive ? '🟢 Active' : '🔴 Inactive'}</span>
        </div>
      </div>
    `;
  }

  /**
   * 테이블 상태 저장
   */
  async _saveTableState() {
    try {
      await this.app.storage.set('table_state', this.state);
      this.logger.debug('💾 테이블 상태 저장 완료');
    } catch (error) {
      this.logger.error('❌ 테이블 상태 저장 실패:', error);
    }
  }

  /**
   * 테이블 상태 로드
   */
  async _loadTableState() {
    try {
      const savedState = await this.app.storage.get('table_state');
      if (savedState) {
        this.state = { ...this.state, ...savedState };
        this.logger.debug('📂 테이블 상태 로드 완료');
      }
    } catch (error) {
      this.logger.error('❌ 테이블 상태 로드 실패:', error);
    }
  }
}