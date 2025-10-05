# 🎯 프로토타입 우선 개발 전략

> **Prototype-First Development Strategy**
> **최종 업데이트**: 2025-10-05
> **철학**: 핵심 기능 먼저 → 검증 → 부가 기능 확장

---

## 📐 설계 철학

### ❌ 기존 방식의 문제
```
Week 1: Domain Layer 전체 (Table, Hand, Player, Action)
Week 2: Infrastructure Layer 전체 (Storage, Sync)
Week 3: Application Layer 전체 (UseCases)
Week 4: UI + 통합

문제점:
- 4주 후에야 작동하는 앱 완성
- 중간에 요구사항 변경 시 전체 재작업
- 실제 사용자 피드백 받기 어려움
```

### ✅ 프로토타입 우선 방식
```
Week 1: 핵심 프로토타입 (End-to-End)
  → 키 플레이어 검색 → 핸드 기록 → 완료
  → 실제 동작하는 최소 기능

Week 2: 검증 및 개선
  → 사용자 피드백
  → 성능 측정
  → 아키텍처 개선

Week 3-4: 부가 기능 추가
  → Redis 캐싱
  → 오프라인 지원
  → 실시간 동기화
  → 고급 검색
```

---

## 🎯 핵심 vs 부가 기능 분리

### 핵심 기능 (MVP - Minimum Viable Product)

#### 1. **키 플레이어 검색** (필수)
```typescript
// 프로토타입: 단순 검색
async function findTableByKeyPlayer(name: string): Promise<Table | null> {
  // Google Sheets에서 직접 검색
  const tables = await googleSheets.getAllTables();

  for (const table of tables) {
    const keyPlayers = table.players.filter(p => p.isKeyPlayer);
    if (keyPlayers.some(p => p.name.includes(name))) {
      return table;
    }
  }

  return null;
}
```

**부가 기능 (나중에 추가)**:
- ❌ Redis 캐싱
- ❌ IndexedDB 로컬 검색
- ❌ 자동완성
- ❌ 검색 히스토리

---

#### 2. **테이블 플레이어 표시** (필수)
```typescript
// 프로토타입: 단순 렌더링
function renderTablePlayers(table: Table) {
  const html = table.players.map(p => `
    <div class="${p.isKeyPlayer ? 'key-player' : ''}">
      #${p.seatNumber} ${p.name} - ${p.chips}
    </div>
  `).join('');

  document.getElementById('players').innerHTML = html;
}
```

**부가 기능 (나중에 추가)**:
- ❌ 칩 실시간 수정
- ❌ 플레이어 추가/제거
- ❌ 좌석 드래그 앤 드롭
- ❌ 국적 플래그 표시

---

#### 3. **핸드 시작** (필수)
```typescript
// 프로토타입: 단순 핸드 생성
async function startHand(table: Table): Promise<Hand> {
  const handNumber = table.lastHandNumber + 1;

  const hand = {
    number: handNumber,
    tableId: table.id,
    players: table.players.filter(p => !p.isFolded),
    actions: [],
    status: 'active'
  };

  // Google Sheets에 직접 기록
  await googleSheets.appendHandRow(hand);

  return hand;
}
```

**부가 기능 (나중에 추가)**:
- ❌ 플레이어 스냅샷
- ❌ 블라인드 구조 설정
- ❌ 카메라 파일 연동
- ❌ 자동 증가 로직

---

#### 4. **액션 기록** (필수)
```typescript
// 프로토타입: 단순 액션 추가
async function recordAction(handId: string, action: string): Promise<void> {
  // Google Sheets에 직접 추가
  await googleSheets.appendEventRow({
    handId,
    action,
    timestamp: Date.now()
  });

  // UI 업데이트
  document.getElementById('actions').innerHTML += `<div>${action}</div>`;
}
```

**부가 기능 (나중에 추가)**:
- ❌ 액션 검증
- ❌ 키 플레이어 액션 강조
- ❌ 액션 취소
- ❌ 액션 순서 정렬

---

#### 5. **핸드 완료** (필수)
```typescript
// 프로토타입: 단순 완료 처리
async function completeHand(handId: string, winner: string): Promise<void> {
  // Google Sheets에 빈 행 추가
  await googleSheets.appendEmptyRow();

  // 승자 표시
  alert(`승자: ${winner}`);
}
```

**부가 기능 (나중에 추가)**:
- ❌ 다음 핸드 자동 생성
- ❌ 승자 여러 명 지원
- ❌ 팟 계산
- ❌ 통계 업데이트

---

## 📅 프로토타입 우선 개발 계획

### Week 1: 핵심 프로토타입 (5일)

#### Day 1-2: 단순 구조 (No DDD, No Agents)
```typescript
// main.ts (단일 파일로 시작)

// 1. Google Sheets 연결
const sheets = new GoogleSheetsAPI();

// 2. 키 플레이어 검색
const table = await sheets.findTableByKeyPlayer('SHAHINA');

// 3. 플레이어 표시
renderPlayers(table);

// 4. 핸드 시작
const hand = await sheets.createHand(table);

// 5. 액션 기록
await sheets.recordAction(hand.id, 'SHAHINA raises 5000');

// 6. 핸드 완료
await sheets.completeHand(hand.id, 'SHAHINA');
```

**완료 조건**:
- [ ] 키 플레이어 검색 동작
- [ ] 테이블 표시 동작
- [ ] 핸드 기록 동작
- [ ] Google Sheets에 데이터 저장 확인

---

#### Day 3: UI 프로토타입
```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<body>
  <!-- 1. 키 플레이어 검색 -->
  <input id="keyPlayerSearch" placeholder="키 플레이어 이름">
  <button onclick="searchKeyPlayer()">검색</button>

  <!-- 2. 테이블 플레이어 -->
  <div id="players"></div>

  <!-- 3. 핸드 컨트롤 -->
  <button onclick="startHand()">핸드 시작</button>

  <!-- 4. 액션 입력 -->
  <input id="actionInput" placeholder="액션 (예: Alice raises 5000)">
  <button onclick="recordAction()">기록</button>

  <!-- 5. 액션 로그 -->
  <div id="actions"></div>

  <!-- 6. 핸드 완료 -->
  <input id="winner" placeholder="승자">
  <button onclick="completeHand()">완료</button>

  <script src="main.js"></script>
</body>
</html>
```

**완료 조건**:
- [ ] 모든 버튼 동작
- [ ] 실시간 UI 업데이트
- [ ] 에러 처리 (alert)

---

#### Day 4: 테스트 및 검증
```typescript
// 시나리오 테스트
describe('핵심 워크플로우', () => {
  it('키 플레이어 검색 → 핸드 기록 → 완료', async () => {
    // 1. 검색
    const table = await findTableByKeyPlayer('SHAHINA');
    expect(table).toBeDefined();

    // 2. 핸드 시작
    const hand = await startHand(table);
    expect(hand.number).toBe(table.lastHandNumber + 1);

    // 3. 액션 기록
    await recordAction(hand.id, 'SHAHINA raises 5000');
    const actions = await getHandActions(hand.id);
    expect(actions).toHaveLength(1);

    // 4. 완료
    await completeHand(hand.id, 'SHAHINA');
    const completed = await getHand(hand.id);
    expect(completed.status).toBe('completed');
  });
});
```

**완료 조건**:
- [ ] E2E 테스트 통과
- [ ] Google Sheets 데이터 확인
- [ ] 성능 측정 (각 작업 < 5초)

---

#### Day 5: 사용자 테스트
```
실제 데이터 매니저와 함께:
1. 키 플레이어 검색 (SHAHINA)
2. Ocean Blue 테이블 확인
3. 핸드 #128 시작
4. 5개 액션 기록
5. 핸드 완료

피드백 수집:
- 어떤 기능이 불편한가?
- 어떤 기능이 빠졌는가?
- 성능이 느린 부분은?
```

**완료 조건**:
- [ ] 실제 사용자 피드백 3개 이상
- [ ] 개선 우선순위 결정

---

### Week 2: 검증 및 리팩토링

#### Day 6-7: 성능 개선
```typescript
// 피드백: "키 플레이어 검색이 너무 느려요 (5초)"
// 해결: IndexedDB 캐싱 추가

async function findTableByKeyPlayer(name: string): Promise<Table | null> {
  // 1. 로컬 캐시 확인
  const cached = await indexedDB.findTable(name);
  if (cached) return cached;

  // 2. Google Sheets 검색
  const table = await googleSheets.search(name);

  // 3. 캐싱
  if (table) await indexedDB.saveTable(table);

  return table;
}
```

**개선 사항**:
- [ ] IndexedDB 도입 (읽기 캐싱만)
- [ ] 성능 측정: 5초 → 100ms

---

#### Day 8-9: 아키텍처 개선
```typescript
// 피드백: "코드가 복잡해지고 있어요"
// 해결: 간단한 클래스 분리

// SimpleTableService.ts
class TableService {
  async findByKeyPlayer(name: string) { ... }
  async getPlayers(tableId: string) { ... }
}

// SimpleHandService.ts
class HandService {
  async start(tableId: string) { ... }
  async recordAction(handId: string, action: string) { ... }
  async complete(handId: string, winner: string) { ... }
}

// main.ts
const tableService = new TableService();
const handService = new HandService();
```

**개선 사항**:
- [ ] Service 레이어 분리 (2개 클래스만)
- [ ] 테스트 커버리지 80%

---

#### Day 10: 두 번째 사용자 테스트
```
개선된 버전 테스트:
- 성능 개선 체감 확인
- 새로운 피드백 수집
- 다음 우선순위 결정
```

---

### Week 3: 부가 기능 추가 (우선순위별)

#### 우선순위 1: Redis 캐싱 (성능 개선)
```typescript
// 피드백: "여러 명이 동시에 사용하면 느려져요"
// 해결: Redis 도입

async function findTableByKeyPlayer(name: string): Promise<Table | null> {
  // 1. Redis 확인 (10ms)
  const cached = await redis.get(`keyplayer:${name}`);
  if (cached) return JSON.parse(cached);

  // 2. IndexedDB 확인 (50ms)
  const local = await indexedDB.findTable(name);
  if (local) {
    await redis.set(`keyplayer:${name}`, JSON.stringify(local), 300);
    return local;
  }

  // 3. Google Sheets (3000ms)
  const table = await googleSheets.search(name);
  if (table) {
    await indexedDB.saveTable(table);
    await redis.set(`keyplayer:${name}`, JSON.stringify(table), 300);
  }

  return table;
}
```

**완료 조건**:
- [ ] Redis 읽기 캐싱 동작
- [ ] 성능: 100ms → 10ms

---

#### 우선순위 2: 실시간 동기화 (Multi-User)
```typescript
// 피드백: "다른 사람이 기록한 액션이 안 보여요"
// 해결: Redis Pub/Sub

// 액션 기록 시
await redis.publish(`hand:${handId}:updates`, JSON.stringify({
  type: 'ActionRecorded',
  action: 'SHAHINA raises 5000'
}));

// 모든 클라이언트가 수신
redis.subscribe(`hand:${handId}:updates`, (event) => {
  const { action } = JSON.parse(event);
  document.getElementById('actions').innerHTML += `<div>${action}</div>`;
});
```

**완료 조건**:
- [ ] Pub/Sub 동작
- [ ] 여러 브라우저에서 실시간 동기화 확인

---

#### 우선순위 3: 오프라인 지원
```typescript
// 피드백: "인터넷 끊기면 못 쓰네요"
// 해결: 동기화 큐

async function recordAction(handId: string, action: string) {
  // 1. 로컬 저장
  await indexedDB.saveAction(handId, action);

  // 2. UI 즉시 업데이트
  updateUI(action);

  // 3. 동기화 큐에 추가
  await syncQueue.add({ type: 'recordAction', handId, action });
}

// 백그라운드 Worker
setInterval(async () => {
  if (navigator.onLine) {
    const tasks = await syncQueue.getAll();
    for (const task of tasks) {
      await googleSheets.sync(task);
      await syncQueue.remove(task.id);
    }
  }
}, 5000);
```

**완료 조건**:
- [ ] 오프라인에서 작동
- [ ] 온라인 복귀 시 자동 동기화

---

### Week 4: 고급 기능 및 마무리

#### 고급 기능 1: DDD 아키텍처 적용
```typescript
// 코드가 복잡해지면 그때 리팩토링

// Before (Simple Service)
class HandService {
  async start(tableId: string) { ... }
}

// After (DDD)
class Hand {
  static createNext(table: Table): Hand { ... }
  recordAction(action: Action): Result<void> { ... }
}

class HandRecordingAgent {
  constructor(
    private handRepo: HandRepository,
    private eventBus: EventBus
  ) {}

  async execute(tableId: string): Promise<Result<Hand>> {
    const hand = Hand.createNext(table);
    await this.handRepo.save(hand);
    this.eventBus.publish('HandStarted', { hand });
    return Result.ok(hand);
  }
}
```

**완료 조건**:
- [ ] Domain Layer 분리
- [ ] Application Layer 분리
- [ ] 기존 기능 유지

---

#### 고급 기능 2: 자동 에이전트 분할
```typescript
// 코드가 500줄 넘어가면 자동 분할
npm run detect-split

// HandService (600줄) → 3개 서브 에이전트
HandService
├── HandCreationAgent (200줄)
├── HandActionAgent (200줄)
└── HandCompletionAgent (200줄)
```

**완료 조건**:
- [ ] AutoSplitter 동작
- [ ] 분할 후 테스트 통과

---

## 📊 프로토타입 우선 vs 전통적 방식 비교

| 항목 | 전통적 방식 | 프로토타입 우선 |
|------|------------|----------------|
| **첫 동작 앱** | 4주 후 | 3일 후 |
| **사용자 피드백** | 4주 후 | 1주 후 |
| **요구사항 변경** | 전체 재작업 | 점진적 수정 |
| **리스크** | 높음 | 낮음 |
| **코드 복잡도** | 처음부터 복잡 | 필요할 때 복잡 |
| **테스트** | 4주 후 통합 테스트 | 매일 E2E 테스트 |

---

## ✅ 최종 개발 로드맵

### Week 1: MVP (Minimum Viable Product)
```
Day 1-2: 핵심 로직 (단일 파일)
Day 3: UI 프로토타입
Day 4: 테스트
Day 5: 사용자 피드백

완료: 동작하는 앱 ✅
```

### Week 2: 성능 & 아키텍처 개선
```
Day 6-7: IndexedDB 캐싱
Day 8-9: Service 레이어 분리
Day 10: 두 번째 피드백

완료: 빠른 앱 ✅
```

### Week 3: 부가 기능 (우선순위별)
```
Day 11-12: Redis 캐싱
Day 13-14: 실시간 동기화
Day 15: 오프라인 지원

완료: 고급 기능 ✅
```

### Week 4: 최종 마무리
```
Day 16-17: DDD 리팩토링 (필요 시)
Day 18-19: 자동 분할 시스템
Day 20: 배포

완료: 프로덕션 준비 ✅
```

---

## 🎯 핵심 원칙

### 1. **YAGNI (You Aren't Gonna Need It)**
- 지금 필요하지 않은 기능은 만들지 않는다
- DDD, Multi-Agent는 코드가 복잡해질 때 도입

### 2. **Iterative Development**
- 매주 동작하는 버전 배포
- 사용자 피드백 기반 개선

### 3. **Progressive Enhancement**
- 단순 → 복잡으로 점진적 발전
- 성능 문제 발생 시 캐싱 추가
- 코드 복잡도 증가 시 리팩토링

---

## 📋 체크리스트

### Week 1 완료 조건
- [ ] 키 플레이어 검색 동작
- [ ] 핸드 기록 동작
- [ ] Google Sheets 연동 확인
- [ ] 사용자 피드백 3개 이상

### Week 2 완료 조건
- [ ] 성능 10배 개선 (5초 → 500ms)
- [ ] Service 레이어 분리
- [ ] 테스트 커버리지 80%

### Week 3 완료 조건
- [ ] Redis 캐싱 동작
- [ ] 실시간 동기화 확인
- [ ] 오프라인 지원 검증

### Week 4 완료 조건
- [ ] 모든 고급 기능 통합
- [ ] 성능 목표 달성
- [ ] 프로덕션 배포

---

**핵심 메시지**:
**완벽한 설계보다 동작하는 프로토타입이 먼저다!** 🚀

**승인**: _______________
**날짜**: 2025-10-05
