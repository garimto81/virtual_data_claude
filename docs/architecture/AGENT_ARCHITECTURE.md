# 🤖 서브 에이전트 아키텍처 v5.0

> **Multi-Agent Orchestration System**
> **최종 업데이트**: 2025-10-05
> **목적**: 대규모 프로젝트의 체계적 개발 및 유지보수

---

## 🎯 설계 철학

### 1. 단일 책임 원칙 (Single Responsibility)
- 각 에이전트는 **하나의 도메인 영역**만 담당
- 도메인 경계를 명확히 구분
- 에이전트 간 의존성 최소화

### 2. 계층적 구조 (Hierarchical Architecture)
```
           Orchestrator Agent (조율자)
                    │
        ┌───────────┼───────────┐
        │           │           │
    Domain      Application  Infrastructure
    Agents       Agents        Agents
```

### 3. 이벤트 기반 통신 (Event-Driven Communication)
- 에이전트 간 직접 호출 금지
- Event Bus를 통한 메시지 전달
- 느슨한 결합 (Loose Coupling)

---

## 🏗️ 에이전트 계층 구조

### 📊 **Layer 1: Orchestrator Agent (총괄 조율자)**

**책임**:
- 전체 프로젝트 진행 상황 모니터링
- 에이전트 간 작업 조율 및 우선순위 결정
- 충돌 해결 및 의사결정
- 품질 게이트 검증

**작업 범위**:
- ✅ 전체 아키텍처 일관성 검증
- ✅ 에이전트 간 인터페이스 충돌 감지
- ✅ 빌드/테스트 파이프라인 실행
- ✅ 코드 리뷰 및 승인

**도구**:
- Project Management Dashboard
- Conflict Resolver
- Quality Gate Checker
- Integration Test Runner

---

### 🎨 **Layer 2: Domain Agents (도메인 전문가)**

#### 2.1 **Table Agent (테이블 관리 전문가)**

**책임**:
- Table Aggregate 구현 및 유지보수
- 테이블 플레이어 관리 로직
- 좌석 할당 및 검증
- 키 플레이어 추적

**작업 범위**:
```
src/domain/table/
├── Table.ts              ✅ Table aggregate 구현
├── TableId.ts            ✅ Value object
├── TableRepository.ts    ✅ Interface 정의
└── __tests__/            ✅ 단위 테스트
```

**입력 이벤트**:
- `TableCreationRequested`
- `PlayerAdditionRequested`
- `PlayerUpdateRequested`
- `키 플레이어SearchRequested`

**출력 이벤트**:
- `TableCreated`
- `PlayerAdded`
- `PlayerUpdated`
- `키 플레이어TableFound`

**API**:
```typescript
interface ITableAgent {
  createTable(pokerRoom: string, tableName: string): Promise<Table>;
  addPlayer(tableId: TableId, player: Player): Promise<Result<void>>;
  updatePlayer(tableId: TableId, playerId: string, changes: Partial<PlayerData>): Promise<Result<void>>;
  findTableBy키 플레이어(vipName: string): Promise<Table | null>;
  getActivePlayers(tableId: TableId): Promise<Player[]>;
}
```

---

#### 2.2 **Hand Agent (핸드 기록 전문가)**

**책임**:
- Hand Aggregate 구현 및 유지보수
- 핸드 시작/종료 로직
- 액션 기록 및 검증
- 보드 카드 관리

**작업 범위**:
```
src/domain/hand/
├── Hand.ts               ✅ Hand aggregate 구현
├── HandNumber.ts         ✅ Value object
├── HandRepository.ts     ✅ Interface 정의
└── __tests__/            ✅ 단위 테스트
```

**입력 이벤트**:
- `HandStartRequested`
- `ActionRecordRequested`
- `BoardCardAdded`
- `HandCompletionRequested`

**출력 이벤트**:
- `HandStarted`
- `ActionRecorded`
- `BoardCardRecorded`
- `HandCompleted`

**API**:
```typescript
interface IHandAgent {
  startNewHand(table: Table, previousNumber: number): Promise<Result<Hand>>;
  recordAction(handNumber: HandNumber, action: Action): Promise<Result<void>>;
  addBoardCard(handNumber: HandNumber, card: string): Promise<Result<void>>;
  completeHand(handNumber: HandNumber, winnerIds: string[]): Promise<Result<void>>;
}
```

---

#### 2.3 **Player Agent (플레이어 엔티티 전문가)**

**책임**:
- Player Entity 구현 및 유지보수
- 플레이어 생성/업데이트 로직
- 플레이어 검증 규칙
- 카드 관리

**작업 범위**:
```
src/domain/player/
├── Player.ts             ✅ Player entity 구현
├── PlayerData.ts         ✅ Interface 정의
└── __tests__/            ✅ 단위 테스트
```

**입력 이벤트**:
- `PlayerCreationRequested`
- `PlayerUpdateRequested`
- `PlayerFoldRequested`
- `PlayerCardsSetRequested`

**출력 이벤트**:
- `PlayerCreated`
- `PlayerUpdated`
- `PlayerFolded`
- `PlayerCardsSet`

**API**:
```typescript
interface IPlayerAgent {
  createPlayer(data: PlayerData): Promise<Result<Player>>;
  updatePlayer(player: Player, changes: Partial<PlayerData>): Promise<Result<Player>>;
  foldPlayer(player: Player): Promise<Player>;
  setCards(player: Player, cards: Card[]): Promise<Player>;
}
```

---

#### 2.4 **Action Agent (액션 값 객체 전문가)**

**책임**:
- Action Value Object 구현
- 액션 타입 정의 및 검증
- 액션 팩토리 메서드
- 액션 순서 검증

**작업 범위**:
```
src/domain/action/
├── Action.ts             ✅ Value object 구현
├── ActionType.ts         ✅ Enum/Type 정의
└── __tests__/            ✅ 단위 테스트
```

**입력 이벤트**:
- `ActionCreationRequested`
- `ActionValidationRequested`

**출력 이벤트**:
- `ActionCreated`
- `ActionValidated`

**API**:
```typescript
interface IActionAgent {
  createFold(playerId: string): Action;
  createCall(playerId: string, amount: number): Action;
  createRaise(playerId: string, amount: number): Action;
  createAllin(playerId: string, amount: number): Action;
  validateActionSequence(actions: Action[]): Result<void>;
}
```

---

### 🎬 **Layer 3: Application Agents (유스케이스 전문가)**

#### 3.1 **Table Management Agent (테이블 관리 유스케이스)**

**책임**:
- 테이블 플레이어 관리 유스케이스 구현
- Table Agent, Player Agent 오케스트레이션
- 비즈니스 워크플로우 조율

**작업 범위**:
```
src/application/table/
├── FindTableBy키 플레이어.ts     ✅ 키 플레이어 검색 유스케이스
├── LoadTablePlayers.ts   ✅ 플레이어 로드
├── UpdatePlayerChips.ts  ✅ 칩 업데이트
└── __tests__/            ✅ 통합 테스트
```

**워크플로우**:
```typescript
// 키 플레이어 검색 → 테이블 로드 → 플레이어 표시
async function findAndLoad키 플레이어Table(vipName: string) {
  // 1. Table Agent에게 키 플레이어 검색 요청
  const table = await tableAgent.findTableBy키 플레이어(vipName);

  // 2. 테이블 플레이어 로드
  const players = await tableAgent.getActivePlayers(table.id);

  // 3. UI에 전달
  eventBus.publish('키 플레이어TableLoaded', { table, players });
}
```

---

#### 3.2 **Hand Recording Agent (핸드 기록 유스케이스)**

**책임**:
- 핸드 기록 유스케이스 구현
- Hand Agent, Action Agent 오케스트레이션
- 실시간 액션 기록 워크플로우

**작업 범위**:
```
src/application/hand/
├── StartNewHand.ts       ✅ 핸드 시작
├── RecordAction.ts       ✅ 액션 기록
├── CompleteHand.ts       ✅ 핸드 완료
└── __tests__/            ✅ 통합 테스트
```

**워크플로우**:
```typescript
// 핸드 시작 → 액션 기록 → 핸드 완료 → 자동 증가
async function recordHandWorkflow(tableId: TableId) {
  // 1. Hand Agent에게 핸드 시작 요청
  const hand = await handAgent.startNewHand(table, lastHandNumber);

  // 2. 액션 발생 시 기록
  eventBus.on('ActionOccurred', async (action) => {
    await handAgent.recordAction(hand.number, action);
  });

  // 3. 핸드 완료 시 자동 증가
  eventBus.on('HandCompleted', async (winners) => {
    await handAgent.completeHand(hand.number, winners);
    await orchestrator.startNextHand(tableId);
  });
}
```

---

### 🔧 **Layer 4: Infrastructure Agents (인프라 전문가)**

#### 4.1 **Storage Agent (저장소 관리 전문가)**

**책임**:
- LocalStorage/IndexedDB 구현
- Repository 패턴 구현
- 데이터 직렬화/역직렬화
- 로컬 캐싱

**작업 범위**:
```
src/infrastructure/repositories/
├── LocalStorageTableRepository.ts    ✅ Table 저장소
├── LocalStorageHandRepository.ts     ✅ Hand 저장소
└── __tests__/                        ✅ 저장소 테스트
```

**API**:
```typescript
interface IStorageAgent {
  saveTable(table: Table): Promise<void>;
  findTableById(id: TableId): Promise<Table | null>;
  saveHand(hand: Hand): Promise<void>;
  findHandByNumber(number: HandNumber): Promise<Hand | null>;
  clearAll(): Promise<void>;
}
```

---

#### 4.2 **Sync Agent (동기화 전문가)**

**책임**:
- Google Sheets API 통합
- 백그라운드 동기화
- 재시도 큐 관리
- 오프라인 지원

**작업 범위**:
```
src/infrastructure/api/
├── GoogleSheetsAPI.ts       ✅ API 클라이언트
├── BackgroundSync.ts        ✅ 동기화 로직
├── SyncQueue.ts             ✅ 재시도 큐
└── __tests__/               ✅ API 테스트
```

**API**:
```typescript
interface ISyncAgent {
  syncTableToServer(table: Table): Promise<void>;
  syncHandToServer(hand: Hand): Promise<void>;
  appendHandRow(row: HandSheetRow): Promise<void>;
  appendEventRow(row: EventSheetRow): Promise<void>;
  processSyncQueue(): Promise<void>;
}
```

---

#### 4.3 **UI Agent (사용자 인터페이스 전문가)**

**책임**:
- View 레이어 구현
- 컴포넌트 개발
- 이벤트 핸들링
- UI 상태 관리

**작업 범위**:
```
src/presentation/
├── views/
│   ├── TableManagementView.ts    ✅ 테이블 관리 뷰
│   ├── HandRecordingView.ts      ✅ 핸드 기록 뷰
│   └── TableSwitcherView.ts      ✅ 테이블 전환 뷰
├── components/
│   ├── PlayerCard.ts             ✅ 플레이어 카드 컴포넌트
│   ├── ActionLog.ts              ✅ 액션 로그
│   └── ActionPad.ts              ✅ 액션 입력 패드
└── __tests__/                    ✅ UI 테스트
```

**API**:
```typescript
interface IUIAgent {
  renderTableManagementView(table: Table, players: Player[]): void;
  renderHandRecordingView(hand: Hand): void;
  showError(message: string): void;
  showSuccess(message: string): void;
  updatePlayerCard(playerId: string, changes: Partial<PlayerData>): void;
}
```

---

## 🔄 에이전트 간 통신 프로토콜

### Event Bus 아키텍처

```typescript
// 중앙 이벤트 버스
class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  // 이벤트 구독
  on(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  // 이벤트 발행
  publish(eventType: string, data: any): void {
    const handlers = this.handlers.get(eventType);
    if (!handlers) return;

    for (const handler of handlers) {
      // 비동기 실행 (non-blocking)
      setTimeout(() => handler(data), 0);
    }
  }

  // 구독 해제
  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }
}

// 전역 싱글톤
const eventBus = new EventBus();
```

### 표준 이벤트 포맷

```typescript
interface DomainEvent {
  type: string;           // 이벤트 타입
  timestamp: number;      // 발생 시간
  source: string;         // 발행 에이전트
  data: any;              // 페이로드
  correlationId?: string; // 추적 ID
}

// 예시
const event: DomainEvent = {
  type: 'PlayerAdded',
  timestamp: Date.now(),
  source: 'TableAgent',
  data: { tableId: 'T02', player: { ... } },
  correlationId: 'uuid-1234'
};
```

---

## 🎭 에이전트 조율 메커니즘

### 1️⃣ **Orchestrator의 워크플로우 관리**

```typescript
class OrchestratorAgent {
  private agents: Map<string, Agent> = new Map();

  // 에이전트 등록
  register(name: string, agent: Agent): void {
    this.agents.set(name, agent);
    console.log(`✅ ${name} 에이전트 등록 완료`);
  }

  // 복잡한 워크플로우 조율
  async orchestrate키 플레이어HandRecording(vipName: string): Promise<void> {
    try {
      // Step 1: 키 플레이어 테이블 검색 (Table Management Agent)
      console.log('🔍 키 플레이어 테이블 검색 중...');
      const table = await this.agents.get('TableManagement')!
        .execute('findTableBy키 플레이어', { vipName });

      if (!table) {
        throw new Error('키 플레이어 테이블을 찾을 수 없습니다');
      }

      // Step 2: 테이블 플레이어 로드 (Table Agent)
      console.log('👥 플레이어 로드 중...');
      const players = await this.agents.get('Table')!
        .execute('getActivePlayers', { tableId: table.id });

      // Step 3: 핸드 시작 (Hand Recording Agent)
      console.log('🎲 핸드 시작...');
      const hand = await this.agents.get('HandRecording')!
        .execute('startNewHand', { table, players });

      // Step 4: UI 업데이트 (UI Agent)
      console.log('🖥️ UI 렌더링...');
      await this.agents.get('UI')!
        .execute('renderHandRecordingView', { hand, players });

      console.log('✅ 키 플레이어 핸드 기록 준비 완료');

    } catch (error) {
      console.error('❌ 워크플로우 실패:', error);
      await this.agents.get('UI')!.execute('showError', { message: error.message });
    }
  }

  // 충돌 해결
  async resolveConflict(conflict: Conflict): Promise<Resolution> {
    // 예: Table Agent와 Hand Agent가 동일 플레이어를 동시 수정
    if (conflict.type === 'ConcurrentPlayerModification') {
      // 최신 타임스탬프 우선 정책
      return {
        strategy: 'LastWriteWins',
        winner: conflict.changes.sort((a, b) => b.timestamp - a.timestamp)[0]
      };
    }

    // 기타 충돌은 수동 해결 필요
    return {
      strategy: 'ManualIntervention',
      message: '수동 해결이 필요한 충돌입니다'
    };
  }
}
```

### 2️⃣ **에이전트 간 의존성 관리**

```typescript
// 의존성 주입 컨테이너
class AgentContainer {
  private instances: Map<string, any> = new Map();
  private factories: Map<string, () => any> = new Map();

  // 팩토리 등록
  registerFactory(name: string, factory: () => any): void {
    this.factories.set(name, factory);
  }

  // 인스턴스 가져오기 (lazy initialization)
  get<T>(name: string): T {
    if (!this.instances.has(name)) {
      const factory = this.factories.get(name);
      if (!factory) {
        throw new Error(`에이전트를 찾을 수 없습니다: ${name}`);
      }
      this.instances.set(name, factory());
    }
    return this.instances.get(name)!;
  }
}

// 설정 예시
const container = new AgentContainer();

container.registerFactory('TableAgent', () =>
  new TableAgent(container.get('StorageAgent'))
);

container.registerFactory('HandAgent', () =>
  new HandAgent(
    container.get('StorageAgent'),
    container.get('ActionAgent')
  )
);

container.registerFactory('TableManagementAgent', () =>
  new TableManagementAgent(
    container.get('TableAgent'),
    container.get('PlayerAgent')
  )
);
```

---

## 🚦 작업 흐름 예시

### 시나리오: "키 플레이어 핸드 기록 전체 흐름"

```
사용자: "SHAHINA" 검색 버튼 클릭
  ↓
UI Agent: '키 플레이어SearchRequested' 이벤트 발행
  ↓
Orchestrator: 워크플로우 시작
  ↓
┌─────────────────────────────────────────┐
│ Step 1: 키 플레이어 테이블 검색                  │
│   TableManagement Agent                 │
│     → Table Agent.findTableBy키 플레이어()      │
│     → Storage Agent.findAll()           │
│     → 결과: Ocean Blue 테이블 발견       │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Step 2: 플레이어 로드                    │
│   Table Agent                           │
│     → Table.getAllPlayers()             │
│     → 결과: 9명 플레이어 (키 플레이어 3명)       │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Step 3: 테이블 관리 모드 렌더링          │
│   UI Agent                              │
│     → renderTableManagementView()       │
│     → 키 플레이어 강조 표시             │
└─────────────────────────────────────────┘
  ↓
사용자: "핸드 기록 모드" 버튼 클릭
  ↓
┌─────────────────────────────────────────┐
│ Step 4: 핸드 시작                        │
│   HandRecording Agent                   │
│     → Hand Agent.startNewHand()         │
│     → Storage Agent.save(hand)          │
│     → Sync Agent.appendHandRow()        │
│     → 결과: 핸드 #128 생성               │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Step 5: 핸드 기록 뷰 렌더링              │
│   UI Agent                              │
│     → renderHandRecordingView()         │
│     → 액션 패드 활성화                   │
└─────────────────────────────────────────┘
  ↓
사용자: "SHAHINA RAISE 5000" 입력
  ↓
┌─────────────────────────────────────────┐
│ Step 6: 액션 기록                        │
│   HandRecording Agent                   │
│     → Action Agent.createRaise()        │
│     → Hand Agent.recordAction()         │
│     → Storage Agent.save(hand)          │
│     → Sync Agent.appendEventRow()       │
│     → UI Agent.updateActionLog()        │
│     → 키 플레이어 액션이므로 강조 표시           │
└─────────────────────────────────────────┘
  ↓
... 핸드 진행 ...
  ↓
사용자: "핸드 완료" 버튼 클릭
  ↓
┌─────────────────────────────────────────┐
│ Step 7: 핸드 완료 및 자동 증가           │
│   Orchestrator                          │
│     → Hand Agent.completeHand()         │
│     → Sync Agent.flushImmediate()       │
│     → Table.lastHandNumber++            │
│     → 자동으로 핸드 #129 시작            │
└─────────────────────────────────────────┘
```

---

## 📋 에이전트별 작업 체크리스트

### ✅ **Table Agent 작업 목록**
- [ ] Table.ts 구현
- [ ] TableId.ts 구현
- [ ] TableRepository 인터페이스 정의
- [ ] 좌석 중복 검증 로직
- [ ] 키 플레이어 검색 알고리즘
- [ ] 단위 테스트 작성

### ✅ **Hand Agent 작업 목록**
- [ ] Hand.ts 구현
- [ ] HandNumber.ts 구현
- [ ] HandRepository 인터페이스 정의
- [ ] 액션 순서 검증 로직
- [ ] 핸드 자동 증가 로직
- [ ] 단위 테스트 작성

### ✅ **Player Agent 작업 목록**
- [ ] Player.ts 구현
- [ ] PlayerData 인터페이스 정의
- [ ] 플레이어 검증 규칙
- [ ] 스냅샷 생성 로직
- [ ] 단위 테스트 작성

### ✅ **Action Agent 작업 목록**
- [ ] Action.ts 구현
- [ ] ActionType 정의
- [ ] 팩토리 메서드 구현
- [ ] 액션 검증 로직
- [ ] 단위 테스트 작성

### ✅ **Storage Agent 작업 목록**
- [ ] LocalStorageTableRepository 구현
- [ ] LocalStorageHandRepository 구현
- [ ] 직렬화/역직렬화 로직
- [ ] 캐싱 메커니즘
- [ ] 저장소 테스트 작성

### ✅ **Sync Agent 작업 목록**
- [ ] GoogleSheetsAPI 클라이언트 구현
- [ ] BackgroundSync 로직
- [ ] SyncQueue 재시도 메커니즘
- [ ] 배치 append 최적화
- [ ] API 테스트 작성

### ✅ **UI Agent 작업 목록**
- [ ] TableManagementView 구현
- [ ] HandRecordingView 구현
- [ ] PlayerCard 컴포넌트
- [ ] ActionLog 컴포넌트
- [ ] ActionPad 컴포넌트
- [ ] UI 테스트 작성

### ✅ **Orchestrator 작업 목록**
- [ ] 에이전트 등록 시스템
- [ ] 워크플로우 오케스트레이션
- [ ] 충돌 해결 메커니즘
- [ ] 품질 게이트 검증
- [ ] 통합 테스트 작성

---

## 🔐 보안 및 격리 정책

### 1. 에이전트 권한 분리
```typescript
enum AgentPermission {
  READ_DOMAIN = 'domain:read',
  WRITE_DOMAIN = 'domain:write',
  READ_STORAGE = 'storage:read',
  WRITE_STORAGE = 'storage:write',
  CALL_API = 'api:call',
  RENDER_UI = 'ui:render'
}

const permissions = {
  TableAgent: [
    AgentPermission.READ_DOMAIN,
    AgentPermission.WRITE_DOMAIN
  ],
  StorageAgent: [
    AgentPermission.READ_STORAGE,
    AgentPermission.WRITE_STORAGE
  ],
  SyncAgent: [
    AgentPermission.READ_STORAGE,
    AgentPermission.CALL_API
  ],
  UIAgent: [
    AgentPermission.READ_DOMAIN,
    AgentPermission.RENDER_UI
  ]
};
```

### 2. 에이전트 간 데이터 격리
- 각 에이전트는 자신의 도메인 데이터만 접근
- 다른 도메인 데이터 필요 시 이벤트를 통해 요청
- 직접 접근 금지 (캡슐화)

---

## 📊 모니터링 및 디버깅

### Agent Activity Monitor

```typescript
class AgentMonitor {
  private activities: Map<string, ActivityLog[]> = new Map();

  logActivity(agentName: string, action: string, data: any): void {
    if (!this.activities.has(agentName)) {
      this.activities.set(agentName, []);
    }

    this.activities.get(agentName)!.push({
      timestamp: Date.now(),
      action,
      data,
      stackTrace: new Error().stack
    });
  }

  getAgentActivity(agentName: string): ActivityLog[] {
    return this.activities.get(agentName) || [];
  }

  visualizeWorkflow(): string {
    // Mermaid 다이어그램 생성
    let diagram = 'sequenceDiagram\n';

    for (const [agent, logs] of this.activities) {
      for (const log of logs) {
        diagram += `  ${agent}->>System: ${log.action}\n`;
      }
    }

    return diagram;
  }
}
```

---

## 🎯 개발 우선순위

### Phase 1: 도메인 에이전트 (주 1-2)
1. **Table Agent** (가장 중요)
2. **Player Agent**
3. **Hand Agent**
4. **Action Agent**

### Phase 2: 인프라 에이전트 (주 2-3)
5. **Storage Agent**
6. **Sync Agent**

### Phase 3: 애플리케이션 에이전트 (주 3)
7. **Table Management Agent**
8. **Hand Recording Agent**

### Phase 4: UI 및 조율 (주 4)
9. **UI Agent**
10. **Orchestrator Agent**

---

## ✅ 성공 기준

### 에이전트 품질 체크리스트
- [ ] 단일 책임 원칙 준수
- [ ] 명확한 API 정의
- [ ] 90% 이상 테스트 커버리지
- [ ] 이벤트 기반 통신 구현
- [ ] 에러 핸들링 완비
- [ ] 성능 목표 달성 (< 1초)

### 통합 품질 체크리스트
- [ ] 모든 에이전트 간 통신 검증
- [ ] 엔드투엔드 테스트 통과
- [ ] 동시성 충돌 해결
- [ ] 메모리 누수 없음
- [ ] 빌드 성공

---

**승인**: _______________
**날짜**: 2025-10-05
