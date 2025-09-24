/**
 * UIController - 사용자 인터페이스 제어 모듈
 * DOM 조작 및 사용자 상호작용 관리
 */

export class UIController {
    constructor(stateManager, eventBus, config) {
        this.state = stateManager;
        this.eventBus = eventBus;
        this.config = config;
        this.elements = {};
        this.modals = new Map();
        this.isInitialized = false;
    }

    /**
     * UI 초기화
     */
    async init() {
        try {
            this.cacheElements();
            this.setupEventListeners();
            this.setupStateSubscriptions();
            this.renderInitialUI();
            this.isInitialized = true;
            this.eventBus.emit('ui:initialized');
        } catch (error) {
            console.error('UI initialization failed:', error);
            throw error;
        }
    }

    /**
     * DOM 요소 캐싱
     */
    cacheElements() {
        // 주요 섹션
        this.elements.app = document.getElementById('app');
        this.elements.handInfoSection = document.getElementById('hand-info-section');
        this.elements.playerDetailsSection = document.getElementById('player-details-section');
        this.elements.actionLoggerSection = document.getElementById('action-logger-section');
        this.elements.controlPanel = document.getElementById('control-panel');
        
        // 컨테이너
        this.elements.playerCardsContainer = document.getElementById('player-cards-container');
        this.elements.actionContent = document.getElementById('action-content');
        this.elements.recentActionsList = document.getElementById('recent-actions-list');
        this.elements.logDisplay = document.getElementById('log-display');
        this.elements.toastContainer = document.getElementById('toast-container');
        this.elements.modalsContainer = document.getElementById('modals-container');
        
        // 버튼
        this.elements.refreshBtn = document.getElementById('refresh-data');
        this.elements.sendToSheetBtn = document.getElementById('send-to-sheet');
        this.elements.saveLocalBtn = document.getElementById('save-local');
        this.elements.resetHandBtn = document.getElementById('reset-hand');
        this.elements.settingsBtn = document.getElementById('settings-btn');
        this.elements.helpBtn = document.getElementById('help-btn');
        this.elements.fullscreenBtn = document.getElementById('fullscreen-btn');
        
        // 통계
        this.elements.totalHands = document.getElementById('total-hands');
        this.elements.currentPot = document.getElementById('current-pot');
        this.elements.playerCount = document.getElementById('player-count');
        
        // 탭
        this.elements.streetTabs = document.querySelectorAll('#street-tabs .tab');
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 버튼 클릭 이벤트
        this.elements.refreshBtn?.addEventListener('click', () => {
            this.eventBus.emit('data:refresh');
        });

        this.elements.sendToSheetBtn?.addEventListener('click', () => {
            this.eventBus.emit('data:send');
        });

        this.elements.saveLocalBtn?.addEventListener('click', () => {
            this.eventBus.emit('data:save');
        });

        this.elements.resetHandBtn?.addEventListener('click', () => {
            this.confirm('새 핸드를 시작하시겠습니까?', () => {
                this.eventBus.emit('hand:reset');
            });
        });

        this.elements.settingsBtn?.addEventListener('click', () => {
            this.showSettingsModal();
        });

        this.elements.helpBtn?.addEventListener('click', () => {
            this.showHelpModal();
        });

        this.elements.fullscreenBtn?.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // 스트리트 탭 클릭
        this.elements.streetTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchStreetTab(tab.dataset.street);
            });
        });

        // 전역 클릭 이벤트 (모달 닫기 등)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal(e.target);
            }
        });

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /**
     * 상태 구독 설정
     */
    setupStateSubscriptions() {
        // 테이블 변경
        this.state.subscribe('selectedTable', (table) => {
            this.renderTableSelection(table);
            this.renderPlayerButtons();
        });

        // 플레이어 변경
        this.state.subscribe('playersInHand', (players) => {
            this.renderPlayerCards(players);
            this.updatePlayerCount(players.length);
        });

        // 보드 변경
        this.state.subscribe('board', (board) => {
            this.renderBoard(board);
        });

        // 액션 변경
        this.state.subscribe('actions', (actions) => {
            this.renderActions(actions);
            this.updatePotSize();
        });

        // 핸드 번호 변경
        this.state.subscribe('currentHandNumber', (handNumber) => {
            this.updateHandNumber(handNumber);
        });
    }

    /**
     * 초기 UI 렌더링
     */
    renderInitialUI() {
        this.renderHandInfoSection();
        this.renderPlayerButtons();
        this.renderActionSection();
        this.updateStatistics();
    }

    /**
     * 핸드 정보 섹션 렌더링
     */
    renderHandInfoSection() {
        const state = this.state.get();
        const content = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">테이블 선택</label>
                    <select id="table-selector" class="select w-full">
                        <option value="">-- 테이블을 선택하세요 --</option>
                        ${state.allTables.map(table => 
                            `<option value="${table}" ${state.selectedTable === table ? 'selected' : ''}>${table}</option>`
                        ).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">핸드 번호</label>
                    <div class="flex gap-2">
                        <button id="hand-prev" class="btn btn-secondary">◀</button>
                        <input type="text" id="hand-number" class="input flex-1 text-center" 
                               value="${state.currentHandNumber}" />
                        <button id="hand-next" class="btn btn-secondary">▶</button>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">블라인드</label>
                    <div class="flex gap-2">
                        <input type="text" id="small-blind" class="input" 
                               placeholder="SB" value="${state.smallBlind}" />
                        <input type="text" id="big-blind" class="input" 
                               placeholder="BB" value="${state.bigBlind}" />
                        <label class="flex items-center">
                            <input type="checkbox" id="bb-ante" class="mr-2" 
                                   ${state.hasBBAnte ? 'checked' : ''} />
                            <span class="text-sm">BB Ante</span>
                        </label>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">보드 카드</label>
                    <div id="board-cards" class="flex gap-2">
                        ${this.renderBoardPlaceholders()}
                    </div>
                </div>
            </div>
        `;
        
        const container = this.elements.handInfoSection?.querySelector('.card-content');
        if (container) {
            container.innerHTML = content;
            this.attachHandInfoListeners();
        }
    }

    /**
     * 플레이어 버튼 렌더링
     */
    renderPlayerButtons() {
        const state = this.state.get();
        const selectedTable = state.selectedTable;
        
        if (!selectedTable) {
            const container = this.elements.handInfoSection?.querySelector('.card-content');
            if (container) {
                const playerSection = document.createElement('div');
                playerSection.innerHTML = '<p class="text-gray-400 mt-4">테이블을 먼저 선택해주세요.</p>';
                container.appendChild(playerSection);
            }
            return;
        }

        const players = state.playerDataByTable[selectedTable] || [];
        const playersInHand = state.playersInHand.map(p => p.name);
        
        const buttonsHTML = `
            <div class="mt-4">
                <label class="block text-sm font-medium text-gray-400 mb-2">참여 플레이어</label>
                <div class="flex flex-wrap gap-2">
                    ${players.map(player => `
                        <button class="btn ${playersInHand.includes(player.name) ? 'btn-primary' : 'btn-secondary'} player-select-btn"
                                data-player="${player.name}">
                            ${player.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        const container = this.elements.handInfoSection?.querySelector('.card-content');
        const existingButtons = container?.querySelector('.mt-4');
        
        if (existingButtons) {
            existingButtons.outerHTML = buttonsHTML;
        } else if (container) {
            container.insertAdjacentHTML('beforeend', buttonsHTML);
        }
        
        this.attachPlayerButtonListeners();
    }

    /**
     * 플레이어 카드 렌더링
     */
    renderPlayerCards(players) {
        if (!this.elements.playerCardsContainer) return;
        
        this.elements.playerCardsContainer.innerHTML = players.map(player => `
            <div class="player-card ${player.role === 'winner' ? 'is-winner' : ''} ${player.role === 'loser' ? 'is-loser' : ''}"
                 data-player="${player.name}">
                <h4 class="font-bold mb-2">${player.name}</h4>
                <div class="mb-2">
                    <input type="text" class="input player-chips" 
                           placeholder="칩" value="${player.chips}" />
                </div>
                <div class="card-placeholder mb-2" data-player="${player.name}">
                    ${player.hand.length > 0 ? this.renderCards(player.hand) : '<span class="text-gray-400">카드 추가</span>'}
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <button class="btn btn-sm ${player.role === 'winner' ? 'btn-primary' : 'btn-secondary'} role-btn"
                            data-role="winner">승자</button>
                    <button class="btn btn-sm ${player.role === 'loser' ? 'btn-primary' : 'btn-secondary'} role-btn"
                            data-role="loser">패자</button>
                </div>
            </div>
        `).join('');
        
        this.attachPlayerCardListeners();
    }

    /**
     * 보드 카드 렌더링
     */
    renderBoard(board) {
        const boardElement = document.getElementById('board-cards');
        if (!boardElement) return;
        
        boardElement.innerHTML = this.renderBoardPlaceholders(board);
        this.attachBoardListeners();
    }

    /**
     * 보드 플레이스홀더 생성
     */
    renderBoardPlaceholders(board = []) {
        const placeholders = [
            { index: 0, count: 3, label: 'Flop' },
            { index: 3, count: 1, label: 'Turn' },
            { index: 4, count: 1, label: 'River' }
        ];
        
        return placeholders.map(({ index, count, label }) => {
            const cards = board.slice(index, index + count);
            return `
                <div class="card-placeholder" data-index="${index}" data-count="${count}" title="${label}">
                    ${cards.length > 0 ? this.renderCards(cards) : `<span class="text-gray-400 text-xs">${label}</span>`}
                </div>
            `;
        }).join('');
    }

    /**
     * 카드 렌더링
     */
    renderCards(cards) {
        return cards.map(card => {
            const rank = card.slice(0, -1);
            const suit = card.slice(-1);
            const suitInfo = this.config.cards.suits[suit];
            
            return `
                <div class="card-display ${suitInfo.color === 'red' ? 'red' : ''}">
                    <div class="text-lg font-bold">${rank}</div>
                    <div class="text-xl">${suitInfo.symbol}</div>
                </div>
            `;
        }).join('');
    }

    /**
     * 액션 섹션 렌더링
     */
    renderActionSection() {
        const state = this.state.get();
        const currentStreet = state.currentStreet;
        
        this.elements.streetTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.street === currentStreet);
        });
        
        this.renderStreetActions(currentStreet);
    }

    /**
     * 스트리트별 액션 렌더링
     */
    renderStreetActions(street) {
        const state = this.state.get();
        const actions = state.actions[street] || [];
        const pot = this.calculateStreetPot(street);
        
        const content = `
            <div class="mb-4">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold">${street.charAt(0).toUpperCase() + street.slice(1)}</h4>
                    <span class="text-amber-400 font-mono">Pot: ${this.formatNumber(pot)}</span>
                </div>
                <div class="action-log bg-gray-800 rounded p-3 min-h-[100px] max-h-[200px] overflow-y-auto mb-3">
                    ${actions.length > 0 ? this.renderActionLog(actions) : '<p class="text-gray-400 text-sm">액션이 없습니다.</p>'}
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-primary flex-1 add-action-btn" data-street="${street}">
                        액션 추가
                    </button>
                    <button class="btn btn-secondary undo-action-btn" data-street="${street}">
                        ↩ 취소
                    </button>
                </div>
            </div>
        `;
        
        if (this.elements.actionContent) {
            this.elements.actionContent.innerHTML = content;
            this.attachActionListeners();
        }
    }

    /**
     * 액션 로그 렌더링
     */
    renderActionLog(actions) {
        return actions.map(action => {
            const player = this.state.getValue('playersInHand').find(p => p.name === action.player);
            let playerClass = 'text-gray-300';
            
            if (player?.role === 'winner') playerClass = 'text-amber-400';
            else if (player?.role === 'loser') playerClass = 'text-blue-400';
            
            const amountText = action.amount ? ` <span class="font-mono">${this.formatNumber(action.amount)}</span>` : '';
            const timestamp = new Date(action.timestamp).toLocaleTimeString();
            
            return `
                <div class="flex justify-between items-center py-1 border-b border-gray-700">
                    <div>
                        <span class="${playerClass} font-bold">${action.player}</span>
                        <span class="text-gray-400">${action.action}</span>
                        ${amountText}
                    </div>
                    <span class="text-xs text-gray-500">${timestamp}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * 통계 업데이트
     */
    updateStatistics() {
        const state = this.state.get();
        
        // 총 핸드 수
        if (this.elements.totalHands) {
            this.elements.totalHands.textContent = state.allHandNumbers.length;
        }
        
        // 현재 팟
        this.updatePotSize();
        
        // 플레이어 수
        this.updatePlayerCount(state.playersInHand.length);
    }

    /**
     * 팟 크기 업데이트
     */
    updatePotSize() {
        const pot = this.state.calculatePot();
        if (this.elements.currentPot) {
            this.elements.currentPot.textContent = this.formatNumber(pot);
        }
    }

    /**
     * 플레이어 수 업데이트
     */
    updatePlayerCount(count) {
        if (this.elements.playerCount) {
            this.elements.playerCount.textContent = count;
        }
    }

    /**
     * 핸드 번호 업데이트
     */
    updateHandNumber(handNumber) {
        const input = document.getElementById('hand-number');
        if (input) {
            input.value = handNumber;
        }
    }

    /**
     * 스트리트별 팟 계산
     */
    calculateStreetPot(street) {
        const state = this.state.get();
        let pot = parseInt(state.smallBlind || 0) + parseInt(state.bigBlind || 0);
        
        const streets = ['preflop', 'flop', 'turn', 'river'];
        const streetIndex = streets.indexOf(street);
        
        for (let i = 0; i <= streetIndex; i++) {
            const actions = state.actions[streets[i]] || [];
            actions.forEach(action => {
                if (action.amount) {
                    pot += parseInt(action.amount);
                }
            });
        }
        
        return pot;
    }

    /**
     * 스트리트 탭 전환
     */
    switchStreetTab(street) {
        this.state.update('currentStreet', street);
        this.renderActionSection();
    }

    /**
     * 이벤트 리스너 부착 메서드들
     */
    attachHandInfoListeners() {
        // 테이블 선택
        const tableSelector = document.getElementById('table-selector');
        tableSelector?.addEventListener('change', (e) => {
            this.state.update('selectedTable', e.target.value);
        });
        
        // 핸드 번호
        const handNumber = document.getElementById('hand-number');
        const handPrev = document.getElementById('hand-prev');
        const handNext = document.getElementById('hand-next');
        
        handNumber?.addEventListener('change', (e) => {
            this.state.update('currentHandNumber', e.target.value);
        });
        
        handPrev?.addEventListener('click', () => {
            const current = parseInt(this.state.getValue('currentHandNumber') || 0);
            this.state.update('currentHandNumber', Math.max(1, current - 1));
        });
        
        handNext?.addEventListener('click', () => {
            const current = parseInt(this.state.getValue('currentHandNumber') || 0);
            this.state.update('currentHandNumber', current + 1);
        });
        
        // 블라인드
        const smallBlind = document.getElementById('small-blind');
        const bigBlind = document.getElementById('big-blind');
        const bbAnte = document.getElementById('bb-ante');
        
        smallBlind?.addEventListener('change', (e) => {
            this.state.update('smallBlind', e.target.value);
        });
        
        bigBlind?.addEventListener('change', (e) => {
            this.state.update('bigBlind', e.target.value);
        });
        
        bbAnte?.addEventListener('change', (e) => {
            this.state.update('hasBBAnte', e.target.checked);
        });
    }

    attachPlayerButtonListeners() {
        document.querySelectorAll('.player-select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.togglePlayer(btn.dataset.player);
            });
        });
    }

    attachPlayerCardListeners() {
        // 칩 입력
        document.querySelectorAll('.player-chips').forEach(input => {
            input.addEventListener('change', (e) => {
                const playerCard = e.target.closest('.player-card');
                const playerName = playerCard.dataset.player;
                const players = [...this.state.getValue('playersInHand')];
                const player = players.find(p => p.name === playerName);
                
                if (player) {
                    player.chips = e.target.value;
                    this.state.update('playersInHand', players);
                }
            });
        });
        
        // 역할 버튼
        document.querySelectorAll('.role-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const playerCard = e.target.closest('.player-card');
                const playerName = playerCard.dataset.player;
                const role = e.target.dataset.role;
                this.state.setPlayerRole(playerName, role);
            });
        });
        
        // 카드 플레이스홀더
        document.querySelectorAll('.player-card .card-placeholder').forEach(placeholder => {
            placeholder.addEventListener('click', () => {
                const playerName = placeholder.dataset.player;
                this.showCardSelector(playerName, 'hand');
            });
        });
    }

    attachBoardListeners() {
        document.querySelectorAll('#board-cards .card-placeholder').forEach(placeholder => {
            placeholder.addEventListener('click', () => {
                const index = parseInt(placeholder.dataset.index);
                const count = parseInt(placeholder.dataset.count);
                this.showCardSelector(null, 'board', index, count);
            });
        });
    }

    attachActionListeners() {
        // 액션 추가 버튼
        document.querySelectorAll('.add-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const street = btn.dataset.street;
                this.showActionModal(street);
            });
        });
        
        // 액션 취소 버튼
        document.querySelectorAll('.undo-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const street = btn.dataset.street;
                const removed = this.state.removeLastAction(street);
                if (removed) {
                    this.renderStreetActions(street);
                }
            });
        });
    }

    /**
     * 카드 선택 모달
     */
    showCardSelector(player, type, index = 0, count = 2) {
        // 구현 필요
        console.log('Show card selector:', { player, type, index, count });
    }

    /**
     * 액션 추가 모달
     */
    showActionModal(street) {
        // 구현 필요
        console.log('Show action modal for street:', street);
    }

    /**
     * 설정 모달
     */
    showSettingsModal() {
        // 구현 필요
        console.log('Show settings modal');
    }

    /**
     * 도움말 모달
     */
    showHelpModal() {
        // 구현 필요
        console.log('Show help modal');
    }

    /**
     * 확인 다이얼로그
     */
    confirm(message, onConfirm, onCancel = null) {
        if (window.confirm(message)) {
            onConfirm();
        } else if (onCancel) {
            onCancel();
        }
    }

    /**
     * 전체화면 토글
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * 모달 닫기
     */
    closeModal(modalElement) {
        modalElement.remove();
    }

    /**
     * 모든 모달 닫기
     */
    closeAllModals() {
        this.elements.modalsContainer.innerHTML = '';
    }

    /**
     * 숫자 포맷팅
     */
    formatNumber(num) {
        return new Intl.NumberFormat(this.config.numberFormat).format(num);
    }
}