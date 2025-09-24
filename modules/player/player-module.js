/**
 * 🎰 Virtual Data v4.0.0 Phoenix
 * Player Module - 플레이어 데이터 추적 및 관리
 */

import { Logger } from '../../utils/logger.js';

export default class PlayerModule {
  constructor(app) {
    this.app = app;
    this.logger = new Logger('PlayerModule');
    this.name = 'player';

    // 플레이어 데이터
    this.players = new Map();
    this.currentPlayer = null;

    // 플레이어 통계
    this.stats = {
      totalPlayers: 0,
      activePlayers: 0,
      sessions: new Map()
    };

    // 이벤트 핸들러
    this.eventHandlers = new Map();
  }

  async init() {
    this.logger.info('👤 플레이어 모듈 초기화 시작');

    try {
      // 저장된 플레이어 데이터 로드
      await this._loadPlayerData();

      // 이벤트 리스너 등록
      this._registerEventListeners();

      // UI 초기화
      this._initializeUI();

      // 현재 플레이어 감지
      await this._detectCurrentPlayer();

      this.logger.success('✅ 플레이어 모듈 초기화 완료');

    } catch (error) {
      this.logger.error('❌ 플레이어 모듈 초기화 실패:', error);
      throw error;
    }
  }

  async destroy() {
    this.logger.info('🗑️ 플레이어 모듈 정리 중...');

    // 이벤트 리스너 제거
    this._unregisterEventListeners();

    // 데이터 저장
    await this._savePlayerData();

    this.logger.success('✅ 플레이어 모듈 정리 완료');
  }

  /**
   * 현재 플레이어 감지
   */
  async detectCurrentPlayer() {
    try {
      this.logger.info('🔍 현재 플레이어 감지 시작...');

      const playerInfo = await this._extractCurrentPlayerInfo();

      if (playerInfo) {
        await this._setCurrentPlayer(playerInfo);
        return playerInfo;
      }

      return null;

    } catch (error) {
      this.logger.error('❌ 현재 플레이어 감지 실패:', error);
      this.app.events.emit('player:error', { type: 'detection', error });
      return null;
    }
  }

  /**
   * 플레이어 추가/업데이트
   */
  async addOrUpdatePlayer(playerData) {
    try {
      const playerId = playerData.id || playerData.name;

      if (!playerId) {
        throw new Error('Player ID or name is required');
      }

      const existingPlayer = this.players.get(playerId);
      const updatedPlayer = {
        ...existingPlayer,
        ...playerData,
        lastSeen: Date.now(),
        id: playerId
      };

      this.players.set(playerId, updatedPlayer);

      // 통계 업데이트
      if (!existingPlayer) {
        this.stats.totalPlayers++;
      }

      // 이벤트 발생
      const eventType = existingPlayer ? 'updated' : 'added';
      this.app.events.emit(`player:${eventType}`, updatedPlayer);

      this.logger.debug(`👤 플레이어 ${eventType}: ${playerId}`);

      return updatedPlayer;

    } catch (error) {
      this.logger.error('❌ 플레이어 추가/업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 플레이어 제거
   */
  removePlayer(playerId) {
    const player = this.players.get(playerId);

    if (player) {
      this.players.delete(playerId);
      this.stats.totalPlayers--;

      this.app.events.emit('player:removed', player);
      this.logger.debug(`👤 플레이어 제거: ${playerId}`);

      return true;
    }

    return false;
  }

  /**
   * 플레이어 정보 조회
   */
  getPlayer(playerId) {
    return this.players.get(playerId) || null;
  }

  /**
   * 현재 플레이어 정보
   */
  getCurrentPlayer() {
    return this.currentPlayer;
  }

  /**
   * 모든 플레이어 목록
   */
  getAllPlayers() {
    return Array.from(this.players.values());
  }

  /**
   * 활성 플레이어 목록
   */
  getActivePlayers() {
    const now = Date.now();
    const activeThreshold = 5 * 60 * 1000; // 5분

    return this.getAllPlayers().filter(player =>
      now - player.lastSeen < activeThreshold
    );
  }

  /**
   * 플레이어 통계
   */
  getPlayerStats(playerId = null) {
    if (playerId) {
      const player = this.getPlayer(playerId);
      return player ? this._calculatePlayerStats(player) : null;
    }

    return {
      ...this.stats,
      activePlayers: this.getActivePlayers().length,
      playerList: this.getAllPlayers().map(p => ({
        id: p.id,
        name: p.name,
        isActive: this.getActivePlayers().includes(p)
      }))
    };
  }

  // ==================== Private Methods ====================

  /**
   * 현재 플레이어 정보 추출
   */
  async _extractCurrentPlayerInfo() {
    const info = {};

    // 플레이어명 추출 시도
    const nameSelectors = [
      '.player-name',
      '.username',
      '.user-info .name',
      '[data-player-name]',
      '.profile-name'
    ];

    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        info.name = element.textContent.trim();
        break;
      }
    }

    // 칩 스택 추출
    const chipSelectors = [
      '.chip-count',
      '.stack-size',
      '.balance',
      '[data-chips]'
    ];

    for (const selector of chipSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const chipText = element.textContent.trim();
        const chipMatch = chipText.match(/[\d,]+/);
        if (chipMatch) {
          info.chips = parseInt(chipMatch[0].replace(/,/g, ''));
          break;
        }
      }
    }

    // 포지션 정보
    const positionElement = document.querySelector('.position, .seat-position');
    if (positionElement) {
      info.position = positionElement.textContent.trim();
    }

    // 추가 정보가 있는 경우에만 반환
    return Object.keys(info).length > 0 ? info : null;
  }

  /**
   * 현재 플레이어 설정
   */
  async _setCurrentPlayer(playerInfo) {
    const playerId = playerInfo.name || 'current_player';

    // 기존 플레이어 정보와 병합
    const updatedPlayer = await this.addOrUpdatePlayer({
      ...playerInfo,
      id: playerId,
      isCurrent: true
    });

    // 이전 현재 플레이어 플래그 제거
    if (this.currentPlayer && this.currentPlayer.id !== playerId) {
      const oldPlayer = this.players.get(this.currentPlayer.id);
      if (oldPlayer) {
        oldPlayer.isCurrent = false;
        this.players.set(this.currentPlayer.id, oldPlayer);
      }
    }

    this.currentPlayer = updatedPlayer;

    this.app.events.emit('player:currentChanged', this.currentPlayer);
    this.logger.info(`👤 현재 플레이어 설정: ${updatedPlayer.name || updatedPlayer.id}`);
  }

  /**
   * 플레이어 개별 통계 계산
   */
  _calculatePlayerStats(player) {
    return {
      id: player.id,
      name: player.name,
      lastSeen: player.lastSeen,
      chips: player.chips || 0,
      position: player.position || 'unknown',
      isCurrent: player.isCurrent || false,
      isActive: this.getActivePlayers().includes(player)
    };
  }

  /**
   * 이벤트 리스너 등록
   */
  _registerEventListeners() {
    // 테이블 상태 변경시 플레이어 감지
    this.eventHandlers.set('table:stateChanged', async () => {
      await this._detectCurrentPlayer();
    });

    // 게임 라운드 변경시 플레이어 정보 업데이트
    this.eventHandlers.set('game:roundChanged', async () => {
      await this._detectCurrentPlayer();
    });

    // 이벤트 리스너 등록
    for (const [event, handler] of this.eventHandlers) {
      this.app.events.on(event, handler, this);
    }

    this.logger.debug('📝 플레이어 이벤트 리스너 등록 완료');
  }

  /**
   * 이벤트 리스너 제거
   */
  _unregisterEventListeners() {
    for (const [event, handler] of this.eventHandlers) {
      this.app.events.off(event, handler);
    }

    this.eventHandlers.clear();
    this.logger.debug('🗑️ 플레이어 이벤트 리스너 제거 완료');
  }

  /**
   * UI 초기화
   */
  _initializeUI() {
    // 현재 플레이어 표시 영역
    const playerDisplay = document.getElementById('current-player');
    if (playerDisplay) {
      this._updatePlayerDisplay();
    }

    // 플레이어 감지 버튼
    const detectButton = document.getElementById('detect-player-btn');
    if (detectButton) {
      detectButton.addEventListener('click', () => this.detectCurrentPlayer());
    }

    // 플레이어 목록 갱신 버튼
    const refreshButton = document.getElementById('refresh-players-btn');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this._updatePlayersList());
    }
  }

  /**
   * 플레이어 정보 UI 업데이트
   */
  _updatePlayerDisplay() {
    const playerDisplay = document.getElementById('current-player');
    if (!playerDisplay || !this.currentPlayer) return;

    const { name, chips, position } = this.currentPlayer;

    playerDisplay.innerHTML = `
      <div class="current-player-info">
        <h3>👤 ${name || 'Unknown Player'}</h3>
        <div class="player-details">
          <span class="chips">💰 ${chips?.toLocaleString() || 'N/A'}</span>
          <span class="position">📍 ${position || 'Unknown'}</span>
        </div>
      </div>
    `;
  }

  /**
   * 플레이어 목록 UI 업데이트
   */
  _updatePlayersList() {
    const listElement = document.getElementById('players-list');
    if (!listElement) return;

    const activePlayers = this.getActivePlayers();

    listElement.innerHTML = activePlayers.map(player => `
      <div class="player-item ${player.isCurrent ? 'current' : ''}">
        <span class="name">${player.name || player.id}</span>
        <span class="chips">${player.chips?.toLocaleString() || 'N/A'}</span>
        <span class="last-seen">${this._formatLastSeen(player.lastSeen)}</span>
      </div>
    `).join('');
  }

  /**
   * 마지막 접속 시간 포매팅
   */
  _formatLastSeen(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

    return new Date(timestamp).toLocaleDateString();
  }

  /**
   * 플레이어 데이터 저장
   */
  async _savePlayerData() {
    try {
      const playerData = {
        players: Object.fromEntries(this.players),
        currentPlayer: this.currentPlayer,
        stats: this.stats
      };

      await this.app.storage.set('player_data', playerData);
      this.logger.debug('💾 플레이어 데이터 저장 완료');

    } catch (error) {
      this.logger.error('❌ 플레이어 데이터 저장 실패:', error);
    }
  }

  /**
   * 플레이어 데이터 로드
   */
  async _loadPlayerData() {
    try {
      const savedData = await this.app.storage.get('player_data');

      if (savedData) {
        // Map 복원
        this.players = new Map(Object.entries(savedData.players || {}));
        this.currentPlayer = savedData.currentPlayer || null;
        this.stats = { ...this.stats, ...savedData.stats };

        this.logger.debug('📂 플레이어 데이터 로드 완료');
      }

    } catch (error) {
      this.logger.error('❌ 플레이어 데이터 로드 실패:', error);
    }
  }

  /**
   * 현재 플레이어 재감지 (private wrapper)
   */
  async _detectCurrentPlayer() {
    await this.detectCurrentPlayer();
  }
}