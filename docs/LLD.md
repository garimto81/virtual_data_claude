# 📐 LLD v5.0 - 포커 테이블 모니터링 시스템

> **Low Level Design v5.0**
> **최종 업데이트**: 2025-10-05
> **기반 문서**: [PRD v5.0](./PRD.md)

## 📚 관련 문서

- **요구사항**: [PRD.md](PRD.md)
- **개발 계획**: [PLAN.md](PLAN.md)
- **전략 문서**: [strategies/](strategies/)
  - [프로토타입 우선 전략](strategies/PROTOTYPE_FIRST_STRATEGY.md)
  - [Redis 캐싱 전략](strategies/REDIS_STRATEGY.md)
  - [IndexedDB 전략](strategies/INDEXEDDB_STRATEGY.md)
  - [에이전트 확장 전략](strategies/AGENT_SCALING_STRATEGY.md)
- **아키텍처**: [architecture/](architecture/)
  - [에이전트 아키텍처](architecture/AGENT_ARCHITECTURE.md)
- **가이드**: [guides/](guides/)
  - [README](guides/README.md)
  - [요약](guides/SUMMARY.md)

---

## 🎯 설계 원칙

### 1. Workflow-First Design
- **기술이 아닌 업무 흐름 중심** 설계
- 키 플레이어 추적 → 테이블 찾기 → 모든 플레이어 관리 → 핸드 기록

### 2. Domain-Driven Design
- **Aggregate**: Table, Hand
- **Entity**: Player
- **Value Object**: Action, Money, TableId, HandNumber

### 3. Local-First Architecture
- 모든 작업은 로컬에서 즉시 완료
- 백그라운드 서버 동기화
- 오프라인 100% 지원

### 4. Performance Target
- 테이블 전환: < 1초
- 핸드 시작: < 0.5초
- 액션 기록: < 0.3초

---

## 🏗️ 3-Layer Architecture

```
┌─────────────────────────────────────────────┐
│          Presentation Layer                  │
│  (Views, Components, Event Handlers)         │
│                                              │
│  - TableManagementView                       │
│  - HandRecordingView                         │
│  - TableSwitcherView                         │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│          Application Layer                   │
│  (Use Cases, Orchestration)                  │
│                                              │
│  - FindTableBy키 플레이어                            │
│  - LoadTablePlayers                          │
│  - UpdatePlayerChips                         │
│  - StartNewHand                              │
│  - RecordAction                              │
│  - CompleteHand                              │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│          Domain Layer                        │
│  (Business Logic, Aggregates, Entities)      │
│                                              │
│  - Table (Aggregate)                         │
│  - Hand (Aggregate)                          │
│  - Player (Entity)                           │
│  - Action (Value Object)                     │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│          Infrastructure Layer                │
│  (LocalStorage, API, Sync)                   │
│                                              │
│  - TableRepository                           │
│  - HandRepository                            │
│  - BackgroundSync                            │
└─────────────────────────────────────────────┘
```

---

## 📦 Domain Layer

### Table (Aggregate Root)

```typescript
class Table {
  // 속성
  readonly id: TableId;
  name: string;
  private players: Map<string, Player>;  // playerId → Player
  lastHandNumber: number;
  updatedAt: Date;

  // 생성자
  static create(id: TableId, name: string): Table {
    return new Table(id, name, new Map(), 0, new Date());
  }

  // 플레이어 관리
  addPlayer(player: Player): Result<void> {
    // 좌석 중복 체크
    if (this.isSeatTaken(player.seatNumber)) {
      return Result.fail('좌석이 이미 사용 중입니다');
    }

    this.players.set(player.id, player);
    this.updatedAt = new Date();
    return Result.ok();
  }

  removePlayer(playerId: string): Result<void> {
    if (!this.players.has(playerId)) {
      return Result.fail('플레이어를 찾을 수 없습니다');
    }

    this.players.delete(playerId);
    this.updatedAt = new Date();
    return Result.ok();
  }

  updatePlayer(playerId: string, changes: Partial<PlayerData>): Result<void> {
    const player = this.players.get(playerId);
    if (!player) {
      return Result.fail('플레이어를 찾을 수 없습니다');
    }

    const updated = player.update(changes);
    if (updated.isFailure) {
      return updated;
    }

    this.players.set(playerId, updated.value);
    this.updatedAt = new Date();
    return Result.ok();
  }

  // 쿼리
  getAllPlayers(): Player[] {
    return Array.from(this.players.values())
      .sort((a, b) => a.seatNumber - b.seatNumber);
  }

  get키 플레이어Players(): Player[] {
    return this.getAllPlayers().filter(p => p.is키 플레이어);
  }

  getActivePlayers(): Player[] {
    return this.getAllPlayers().filter(p => !p.isFolded);
  }

  getPlayerBySeat(seatNumber: number): Player | null {
    return this.getAllPlayers().find(p => p.seatNumber === seatNumber) || null;
  }

  // 검증
  private isSeatTaken(seatNumber: number): boolean {
    return this.getAllPlayers().some(p => p.seatNumber === seatNumber);
  }

  has키 플레이어Player(): boolean {
    return this.get키 플레이어Players().length > 0;
  }
}
```

### Hand (Aggregate Root)

```typescript
class Hand {
  // 속성
  readonly number: HandNumber;
  readonly tableId: TableId;
  private players: Map<string, Player>;  // 스냅샷
  private actions: Action[];
  private winners: Set<string>;
  status: HandStatus;  // 'active' | 'completed'
  startedAt: Date;
  completedAt: Date | null;

  // 팩토리 메서드
  static createNext(table: Table, previousNumber: number): Result<Hand> {
    const activePlayers = table.getActivePlayers();

    if (activePlayers.length < 2) {
      return Result.fail('최소 2명의 플레이어가 필요합니다');
    }

    return Result.ok(new Hand(
      new HandNumber(previousNumber + 1),
      table.id,
      new Map(activePlayers.map(p => [p.id, p.snapshot()])),
      [],
      new Set(),
      'active',
      new Date(),
      null
    ));
  }

  // 액션 기록
  recordAction(action: Action): Result<void> {
    if (this.status !== 'active') {
      return Result.fail('완료된 핸드에는 액션을 추가할 수 없습니다');
    }

    // 액션 검증
    const player = this.players.get(action.playerId);
    if (!player) {
      return Result.fail('플레이어를 찾을 수 없습니다');
    }

    if (player.isFolded && action.type !== 'fold') {
      return Result.fail('폴드한 플레이어는 액션할 수 없습니다');
    }

    this.actions.push(action);

    // 플레이어 상태 업데이트
    if (action.type === 'fold') {
      const updated = player.fold();
      this.players.set(action.playerId, updated);
    }

    return Result.ok();
  }

  // 핸드 완료
  complete(winnerIds: string[]): Result<void> {
    if (this.status === 'completed') {
      return Result.fail('이미 완료된 핸드입니다');
    }

    if (winnerIds.length === 0) {
      return Result.fail('승자를 지정해야 합니다');
    }

    // 승자 검증
    for (const id of winnerIds) {
      if (!this.players.has(id)) {
        return Result.fail(`승자 ${id}를 찾을 수 없습니다`);
      }
    }

    this.winners = new Set(winnerIds);
    this.status = 'completed';
    this.completedAt = new Date();

    return Result.ok();
  }

  // 쿼리
  getActions(): Action[] {
    return [...this.actions];
  }

  get키 플레이어Actions(): Action[] {
    return this.actions.filter(action => {
      const player = this.players.get(action.playerId);
      return player?.is키 플레이어;
    });
  }

  getPlayers(): Player[] {
    return Array.from(this.players.values())
      .sort((a, b) => a.seatNumber - b.seatNumber);
  }

  getWinners(): Player[] {
    return Array.from(this.winners)
      .map(id => this.players.get(id))
      .filter(p => p !== undefined) as Player[];
  }
}
```

### Player (Entity)

```typescript
class Player {
  // 속성
  readonly id: string;
  name: string;
  seatNumber: number;
  chips: Money;
  is키 플레이어: boolean;
  isFolded: boolean;
  cards: Card[];
  country: string;

  // 생성자
  static create(data: PlayerData): Result<Player> {
    // 검증
    if (!data.name || data.name.trim().length === 0) {
      return Result.fail('이름은 필수입니다');
    }

    if (data.seatNumber < 1 || data.seatNumber > 10) {
      return Result.fail('좌석 번호는 1-10 사이여야 합니다');
    }

    if (data.chips < 0) {
      return Result.fail('칩은 0 이상이어야 합니다');
    }

    return Result.ok(new Player(
      data.id || generateId(),
      data.name.trim(),
      data.seatNumber,
      new Money(data.chips),
      data.is키 플레이어 || false,
      false,
      [],
      data.country || 'KR'
    ));
  }

  // 업데이트
  update(changes: Partial<PlayerData>): Result<Player> {
    const updated = new Player(
      this.id,
      changes.name !== undefined ? changes.name : this.name,
      changes.seatNumber !== undefined ? changes.seatNumber : this.seatNumber,
      changes.chips !== undefined ? new Money(changes.chips) : this.chips,
      changes.is키 플레이어 !== undefined ? changes.is키 플레이어 : this.is키 플레이어,
      this.isFolded,
      this.cards,
      changes.country !== undefined ? changes.country : this.country
    );

    // 재검증
    if (!updated.name || updated.name.trim().length === 0) {
      return Result.fail('이름은 필수입니다');
    }

    if (updated.seatNumber < 1 || updated.seatNumber > 10) {
      return Result.fail('좌석 번호는 1-10 사이여야 합니다');
    }

    if (updated.chips.amount < 0) {
      return Result.fail('칩은 0 이상이어야 합니다');
    }

    return Result.ok(updated);
  }

  // 액션
  fold(): Player {
    return new Player(
      this.id,
      this.name,
      this.seatNumber,
      this.chips,
      this.is키 플레이어,
      true,  // folded
      this.cards,
      this.country
    );
  }

  setCards(cards: Card[]): Player {
    return new Player(
      this.id,
      this.name,
      this.seatNumber,
      this.chips,
      this.is키 플레이어,
      this.isFolded,
      cards,
      this.country
    );
  }

  // 스냅샷 (Hand용)
  snapshot(): Player {
    return new Player(
      this.id,
      this.name,
      this.seatNumber,
      this.chips,
      this.is키 플레이어,
      false,  // 핸드 시작 시 모두 active
      [],
      this.country
    );
  }
}
```

### Value Objects

```typescript
// Action
class Action {
  constructor(
    readonly playerId: string,
    readonly type: ActionType,  // 'fold' | 'call' | 'raise' | 'allin'
    readonly amount: Money,
    readonly timestamp: Date
  ) {}

  static fold(playerId: string): Action {
    return new Action(playerId, 'fold', new Money(0), new Date());
  }

  static call(playerId: string, amount: number): Action {
    return new Action(playerId, 'call', new Money(amount), new Date());
  }

  static raise(playerId: string, amount: number): Action {
    return new Action(playerId, 'raise', new Money(amount), new Date());
  }

  static allin(playerId: string, amount: number): Action {
    return new Action(playerId, 'allin', new Money(amount), new Date());
  }
}

// Money
class Money {
  constructor(readonly amount: number) {
    if (amount < 0) {
      throw new Error('금액은 0 이상이어야 합니다');
    }
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    return new Money(Math.max(0, this.amount - other.amount));
  }

  format(): string {
    return this.amount.toLocaleString();
  }
}

// Result (Railway Oriented Programming)
class Result<T> {
  private constructor(
    readonly isSuccess: boolean,
    readonly value?: T,
    readonly error?: string
  ) {}

  static ok<T>(value?: T): Result<T> {
    return new Result<T>(true, value);
  }

  static fail<T>(error: string): Result<T> {
    return new Result<T>(false, undefined, error);
  }

  get isFailure(): boolean {
    return !this.isSuccess;
  }
}
```

---

## 🎬 Application Layer (Use Cases)

### FindTableBy키 플레이어

```typescript
class FindTableBy키 플레이어 {
  constructor(private tableRepo: TableRepository) {}

  async execute(vipName: string): Promise<Result<Table>> {
    // 1. 로컬에서 검색
    const tables = await this.tableRepo.findAll();

    for (const table of tables) {
      const vips = table.get키 플레이어Players();
      const found = vips.find(p =>
        p.name.toLowerCase().includes(vipName.toLowerCase())
      );

      if (found) {
        return Result.ok(table);
      }
    }

    // 2. 서버에서 검색 (백그라운드)
    this.searchFromServer(vipName);

    return Result.fail('테이블을 찾을 수 없습니다');
  }

  private async searchFromServer(vipName: string): Promise<void> {
    // 백그라운드 서버 검색
    try {
      const table = await api.search키 플레이어Table(vipName);
      if (table) {
        await this.tableRepo.save(table);
      }
    } catch (error) {
      logger.warn('서버 검색 실패:', error);
    }
  }
}
```

### LoadTablePlayers

```typescript
class LoadTablePlayers {
  constructor(private tableRepo: TableRepository) {}

  async execute(tableId: TableId): Promise<Result<Player[]>> {
    const table = await this.tableRepo.findById(tableId);

    if (!table) {
      return Result.fail('테이블을 찾을 수 없습니다');
    }

    return Result.ok(table.getAllPlayers());
  }
}
```

### UpdatePlayerChips

```typescript
class UpdatePlayerChips {
  constructor(private tableRepo: TableRepository) {}

  async execute(
    tableId: TableId,
    playerId: string,
    newChips: number
  ): Promise<Result<void>> {
    // 1. 테이블 로드
    const table = await this.tableRepo.findById(tableId);
    if (!table) {
      return Result.fail('테이블을 찾을 수 없습니다');
    }

    // 2. 플레이어 업데이트
    const result = table.updatePlayer(playerId, { chips: newChips });
    if (result.isFailure) {
      return result;
    }

    // 3. 즉시 로컬 저장
    await this.tableRepo.save(table);

    // 4. 백그라운드 동기화
    this.syncToServer(table);

    return Result.ok();
  }

  private async syncToServer(table: Table): Promise<void> {
    try {
      await api.updateTable(table);
    } catch (error) {
      logger.warn('서버 동기화 실패:', error);
      // 재시도 큐에 추가
      syncQueue.add({ type: 'updateTable', data: table });
    }
  }
}
```

### StartNewHand

```typescript
class StartNewHand {
  constructor(
    private tableRepo: TableRepository,
    private handRepo: HandRepository
  ) {}

  async execute(tableId: TableId): Promise<Result<Hand>> {
    // 1. 테이블 로드
    const table = await this.tableRepo.findById(tableId);
    if (!table) {
      return Result.fail('테이블을 찾을 수 없습니다');
    }

    // 2. 새 핸드 생성
    const handResult = Hand.createNext(table, table.lastHandNumber);
    if (handResult.isFailure) {
      return handResult;
    }

    const hand = handResult.value!;

    // 3. 테이블 lastHandNumber 업데이트
    table.lastHandNumber = hand.number.value;

    // 4. 즉시 로컬 저장
    await this.handRepo.save(hand);
    await this.tableRepo.save(table);

    // 5. 백그라운드 동기화
    this.syncToServer(hand);

    return Result.ok(hand);
  }

  private async syncToServer(hand: Hand): Promise<void> {
    try {
      await api.createHand(hand);
    } catch (error) {
      logger.warn('서버 동기화 실패:', error);
      syncQueue.add({ type: 'createHand', data: hand });
    }
  }
}
```

### RecordAction

```typescript
class RecordAction {
  constructor(private handRepo: HandRepository) {}

  async execute(
    handNumber: HandNumber,
    action: Action
  ): Promise<Result<void>> {
    // 1. 핸드 로드
    const hand = await this.handRepo.findByNumber(handNumber);
    if (!hand) {
      return Result.fail('핸드를 찾을 수 없습니다');
    }

    // 2. 액션 기록
    const result = hand.recordAction(action);
    if (result.isFailure) {
      return result;
    }

    // 3. 즉시 로컬 저장
    await this.handRepo.save(hand);

    // 4. 백그라운드 동기화
    this.syncToServer(hand);

    return Result.ok();
  }

  private async syncToServer(hand: Hand): Promise<void> {
    try {
      await api.updateHand(hand);
    } catch (error) {
      logger.warn('서버 동기화 실패:', error);
      syncQueue.add({ type: 'updateHand', data: hand });
    }
  }
}
```

### CompleteHand

```typescript
class CompleteHand {
  constructor(private handRepo: HandRepository) {}

  async execute(
    handNumber: HandNumber,
    winnerIds: string[]
  ): Promise<Result<void>> {
    // 1. 핸드 로드
    const hand = await this.handRepo.findByNumber(handNumber);
    if (!hand) {
      return Result.fail('핸드를 찾을 수 없습니다');
    }

    // 2. 핸드 완료
    const result = hand.complete(winnerIds);
    if (result.isFailure) {
      return result;
    }

    // 3. 즉시 로컬 저장
    await this.handRepo.save(hand);

    // 4. 백그라운드 동기화
    this.syncToServer(hand);

    return Result.ok();
  }

  private async syncToServer(hand: Hand): Promise<void> {
    try {
      await api.updateHand(hand);
    } catch (error) {
      logger.warn('서버 동기화 실패:', error);
      syncQueue.add({ type: 'updateHand', data: hand });
    }
  }
}
```

---

## 🖥️ Presentation Layer

### TableManagementView

```typescript
class TableManagementView {
  constructor(
    private loadPlayers: LoadTablePlayers,
    private updateChips: UpdatePlayerChips
  ) {
    this.render = this.render.bind(this);
    this.handleChipUpdate = this.handleChipUpdate.bind(this);
  }

  async render(tableId: TableId): Promise<void> {
    const result = await this.loadPlayers.execute(tableId);

    if (result.isFailure) {
      showError(result.error!);
      return;
    }

    const players = result.value!;

    // UI 렌더링
    const html = `
      <div class="table-management">
        <h2>${tableId.value} - 플레이어 관리</h2>
        <div class="player-count">
          전체 ${players.length}명 (키 플레이어 ${players.filter(p => p.is키 플레이어).length}명)
        </div>
        <div class="player-list">
          ${players.map(p => this.renderPlayer(p)).join('')}
        </div>
        <button onclick="switchToHandRecording()">
          📝 핸드 기록 모드로 전환
        </button>
      </div>
    `;

    document.getElementById('app').innerHTML = html;
  }

  private renderPlayer(player: Player): string {
    return `
      <div class="player-card ${player.is키 플레이어 ? 'vip' : ''}">
        <div class="player-header">
          #${player.seatNumber} ${player.name} ${player.is키 플레이어 ? '🌟' : ''}
        </div>
        <div class="player-chips">
          Chips: ${player.chips.format()} ${player.country}
        </div>
        <div class="player-actions">
          <button onclick="editChips('${player.id}')">칩 수정</button>
          <button onclick="changeSeat('${player.id}')">좌석</button>
          <button onclick="removePlayer('${player.id}')">제거</button>
        </div>
      </div>
    `;
  }

  private async handleChipUpdate(playerId: string, newChips: number): Promise<void> {
    const result = await this.updateChips.execute(
      currentTableId,
      playerId,
      newChips
    );

    if (result.isFailure) {
      showError(result.error!);
      return;
    }

    showSuccess('칩이 업데이트되었습니다');
    this.render(currentTableId);
  }
}
```

### HandRecordingView

```typescript
class HandRecordingView {
  constructor(
    private startHand: StartNewHand,
    private recordAction: RecordAction,
    private completeHand: CompleteHand
  ) {
    this.render = this.render.bind(this);
    this.handleAction = this.handleAction.bind(this);
  }

  async render(tableId: TableId): Promise<void> {
    // 1. 새 핸드 시작
    const result = await this.startHand.execute(tableId);

    if (result.isFailure) {
      showError(result.error!);
      return;
    }

    const hand = result.value!;

    // 2. UI 렌더링
    const html = `
      <div class="hand-recording">
        <h2>${tableId.value} - 핸드 #${hand.number.value}</h2>
        <div class="players">
          ${hand.getPlayers().map(p => this.renderPlayer(p)).join('')}
        </div>
        <div class="action-log">
          ${hand.getActions().map(a => this.renderAction(a, hand)).join('')}
        </div>
        <div class="action-pad">
          <button onclick="handleAction('fold')">폴드</button>
          <button onclick="handleAction('call')">콜</button>
          <button onclick="handleAction('raise')">레이즈</button>
          <button onclick="handleAction('allin')">올인</button>
        </div>
        <button onclick="completeCurrentHand()">핸드 완료</button>
        <button onclick="switchToTableManagement()">← 플레이어 관리</button>
      </div>
    `;

    document.getElementById('app').innerHTML = html;
  }

  private renderPlayer(player: Player): string {
    return `
      <div class="player ${player.is키 플레이어 ? 'vip' : ''} ${player.isFolded ? 'folded' : ''}">
        #${player.seatNumber} ${player.name} ${player.is키 플레이어 ? '🌟' : ''}
        ${player.chips.format()}
        <button onclick="selectPlayer('${player.id}')">액션</button>
        <button onclick="editCards('${player.id}')">카드</button>
      </div>
    `;
  }

  private renderAction(action: Action, hand: Hand): string {
    const player = hand.getPlayers().find(p => p.id === action.playerId);
    const vip = player?.is키 플레이어 ? '🌟' : '';

    return `
      <div class="action ${player?.is키 플레이어 ? 'vip-action' : ''}">
        ${vip} ${player?.name}: ${action.type.toUpperCase()} ${action.amount.format()}
      </div>
    `;
  }

  private async handleAction(actionType: ActionType, playerId: string, amount: number): Promise<void> {
    const action = this.createAction(actionType, playerId, amount);

    const result = await this.recordAction.execute(currentHandNumber, action);

    if (result.isFailure) {
      showError(result.error!);
      return;
    }

    this.render(currentTableId);
  }
}
```

---

## 🗄️ Infrastructure Layer

### LocalStorage Repository

```typescript
class LocalStorageTableRepository implements TableRepository {
  private readonly KEY_PREFIX = 'table:';

  async findById(id: TableId): Promise<Table | null> {
    const json = localStorage.getItem(this.KEY_PREFIX + id.value);
    if (!json) return null;

    return this.deserialize(JSON.parse(json));
  }

  async findAll(): Promise<Table[]> {
    const tables: Table[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.KEY_PREFIX)) {
        const json = localStorage.getItem(key);
        if (json) {
          tables.push(this.deserialize(JSON.parse(json)));
        }
      }
    }

    return tables;
  }

  async save(table: Table): Promise<void> {
    const json = this.serialize(table);
    localStorage.setItem(this.KEY_PREFIX + table.id.value, JSON.stringify(json));
  }

  async delete(id: TableId): Promise<void> {
    localStorage.removeItem(this.KEY_PREFIX + id.value);
  }

  private serialize(table: Table): any {
    return {
      id: table.id.value,
      name: table.name,
      players: table.getAllPlayers().map(p => ({
        id: p.id,
        name: p.name,
        seatNumber: p.seatNumber,
        chips: p.chips.amount,
        is키 플레이어: p.is키 플레이어,
        country: p.country
      })),
      lastHandNumber: table.lastHandNumber,
      updatedAt: table.updatedAt.toISOString()
    };
  }

  private deserialize(data: any): Table {
    const table = Table.create(new TableId(data.id), data.name);

    for (const playerData of data.players) {
      const player = Player.create(playerData).value!;
      table.addPlayer(player);
    }

    table.lastHandNumber = data.lastHandNumber;
    table.updatedAt = new Date(data.updatedAt);

    return table;
  }
}
```

### Background Sync

```typescript
class BackgroundSync {
  private queue: SyncTask[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInterval: number | null = null;

  constructor() {
    // 온라인 상태 감지
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPendingTasks();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // 5초마다 동기화 시도
    this.startAutoSync(5000);
  }

  add(task: SyncTask): void {
    this.queue.push(task);

    if (this.isOnline) {
      this.processPendingTasks();
    }
  }

  private async processPendingTasks(): Promise<void> {
    if (!this.isOnline || this.queue.length === 0) {
      return;
    }

    const task = this.queue[0];

    try {
      await this.executeTask(task);
      this.queue.shift();  // 성공하면 제거

      // 다음 작업 처리
      if (this.queue.length > 0) {
        setTimeout(() => this.processPendingTasks(), 100);
      }
    } catch (error) {
      logger.error('동기화 실패:', error);
      // 실패하면 큐에 남겨둠 (재시도)
    }
  }

  private async executeTask(task: SyncTask): Promise<void> {
    switch (task.type) {
      case 'updateTable':
        await api.updateTable(task.data);
        break;
      case 'createHand':
        await api.createHand(task.data);
        break;
      case 'updateHand':
        await api.updateHand(task.data);
        break;
    }
  }

  private startAutoSync(interval: number): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.processPendingTasks();
      }
    }, interval);
  }
}
```

---

## 📁 폴더 구조

```
src/
├── domain/
│   ├── table/
│   │   ├── Table.ts
│   │   ├── TableId.ts
│   │   └── TableRepository.ts (interface)
│   ├── hand/
│   │   ├── Hand.ts
│   │   ├── HandNumber.ts
│   │   └── HandRepository.ts (interface)
│   ├── player/
│   │   ├── Player.ts
│   │   └── PlayerData.ts
│   ├── action/
│   │   ├── Action.ts
│   │   └── ActionType.ts
│   └── shared/
│       ├── Money.ts
│       ├── Result.ts
│       └── Card.ts
│
├── application/
│   ├── table/
│   │   ├── FindTableBy키 플레이어.ts
│   │   ├── LoadTablePlayers.ts
│   │   └── UpdatePlayerChips.ts
│   └── hand/
│       ├── StartNewHand.ts
│       ├── RecordAction.ts
│       └── CompleteHand.ts
│
├── presentation/
│   ├── views/
│   │   ├── TableManagementView.ts
│   │   ├── HandRecordingView.ts
│   │   └── TableSwitcherView.ts
│   ├── components/
│   │   ├── PlayerCard.ts
│   │   ├── ActionLog.ts
│   │   └── ActionPad.ts
│   └── styles/
│       ├── table-management.css
│       └── hand-recording.css
│
└── infrastructure/
    ├── repositories/
    │   ├── LocalStorageTableRepository.ts
    │   └── LocalStorageHandRepository.ts
    ├── api/
    │   ├── GoogleSheetsAPI.ts
    │   └── BackgroundSync.ts
    └── utils/
        ├── logger.ts
        ├── errorHandler.ts
        └── eventManager.ts
```

---

## ⚡ 성능 최적화

### 1. 테이블 전환 < 1초

```typescript
// 전략: 최근 테이블 프리로드
class TableCache {
  private cache: Map<string, Table> = new Map();
  private maxSize = 5;

  async preload(recentTableIds: TableId[]): Promise<void> {
    const promises = recentTableIds
      .slice(0, this.maxSize)
      .map(id => this.load(id));

    await Promise.all(promises);
  }

  private async load(id: TableId): Promise<void> {
    const table = await tableRepo.findById(id);
    if (table) {
      this.cache.set(id.value, table);
    }
  }

  get(id: TableId): Table | null {
    return this.cache.get(id.value) || null;
  }
}
```

### 2. 핸드 시작 < 0.5초

```typescript
// 전략: 플레이어 스냅샷 미리 준비
class HandFactory {
  async prepareNext(table: Table): Promise<Hand | null> {
    // 백그라운드에서 다음 핸드 준비
    const result = Hand.createNext(table, table.lastHandNumber);

    if (result.isSuccess) {
      return result.value!;
    }

    return null;
  }
}
```

### 3. 액션 기록 < 0.3초

```typescript
// 전략: 낙관적 UI 업데이트
async function recordActionOptimistic(action: Action): Promise<void> {
  // 1. UI 즉시 업데이트 (낙관적)
  updateUIWithAction(action);

  // 2. 백그라운드 저장
  try {
    await recordAction.execute(currentHandNumber, action);
  } catch (error) {
    // 실패 시 롤백
    rollbackUIAction(action);
    showError('액션 기록에 실패했습니다');
  }
}
```

---

## 🔒 데이터 무결성

### 1. 핸드 번호 중복 방지

```typescript
class HandNumber {
  constructor(readonly value: number) {
    if (value < 1) {
      throw new Error('핸드 번호는 1 이상이어야 합니다');
    }
  }

  next(): HandNumber {
    return new HandNumber(this.value + 1);
  }
}
```

### 2. 좌석 중복 방지

```typescript
// Table.addPlayer() 내부
private isSeatTaken(seatNumber: number): boolean {
  return this.getAllPlayers().some(p => p.seatNumber === seatNumber);
}
```

### 3. 트랜잭션 처리

```typescript
class HandTransaction {
  async completeAndCreateNext(
    currentHand: Hand,
    winnerIds: string[],
    table: Table
  ): Promise<Result<Hand>> {
    try {
      // 1. 현재 핸드 완료
      const completeResult = currentHand.complete(winnerIds);
      if (completeResult.isFailure) {
        return Result.fail(completeResult.error!);
      }

      // 2. 저장
      await handRepo.save(currentHand);

      // 3. 다음 핸드 생성
      const nextResult = Hand.createNext(table, currentHand.number.value);
      if (nextResult.isFailure) {
        return nextResult;
      }

      // 4. 저장
      await handRepo.save(nextResult.value!);

      return nextResult;

    } catch (error) {
      return Result.fail('핸드 전환에 실패했습니다');
    }
  }
}
```

---

**승인**: _______________
**날짜**: 2025-10-05
