# 🗄️ IndexedDB 관리 전략

> **로컬 데이터베이스 아키텍처**
> **최종 업데이트**: 2025-10-05

---

## 📊 Index.csv 시트 분석

### 컬럼 구조
```csv
handNumber,startRow,endRow,handUpdatedAt,handEdit,handEditTime,label,table,
tableUpdatedAt,Cam,CamFile01name,CamFile01number,CamFile02name,CamFile02number,
lastStreet,lastAction,workStatus,winners
```

### 핵심 인사이트
1. **인덱스 역할**: Hand 시트의 핸드 데이터 위치 추적 (startRow, endRow)
2. **메타데이터 저장**:
   - 핸드 편집 정보 (handEdit, handEditTime)
   - 작업 상태 (workStatus: 진행중, 완료, 검토필요)
   - 카메라 파일 정보 (CamFile01name, CamFile01number)
   - 마지막 액션 (lastStreet, lastAction)
   - 승자 정보 (winners)

3. **빠른 검색 지원**:
   - 테이블별 핸드 검색
   - 상태별 핸드 필터링
   - 날짜별 핸드 조회

---

## 🏗️ IndexedDB 스키마 설계

### Object Stores (5개)

#### 1. **tables** - 테이블 저장소
```typescript
interface TableStore {
  id: string;              // PK: "merit-hall-ocean-blue"
  pokerRoom: string;       // "Merit Hall"
  tableName: string;       // "Ocean Blue"
  players: Player[];       // 현재 플레이어 목록
  lastHandNumber: number;  // 마지막 핸드 번호
  updatedAt: number;       // 타임스탬프

  // 인덱스
  indexes: {
    vipPlayers: string[];  // 키 플레이어 ID 배열
    updatedAt: number;     // 최근 업데이트 순 정렬
  }
}

// 인덱스 정의
keyPath: 'id'
indexes:
  - 'vipPlayers' (multiEntry: true)  // 키 플레이어 검색
  - 'updatedAt'                       // 최근 테이블
```

---

#### 2. **hands** - 핸드 저장소
```typescript
interface HandStore {
  id: string;              // PK: "T02#127" (tableId#handNumber)
  tableId: string;         // "T02"
  handNumber: number;      // 127
  timestamp: number;       // 1756296967
  players: Player[];       // 핸드 시작 시 플레이어 스냅샷
  actions: Action[];       // 액션 목록
  boardCards: string[];    // 보드 카드
  winners: string[];       // 승자 ID 배열
  status: HandStatus;      // 'active' | 'completed'

  // Index.csv 메타데이터
  startRow: number;        // Hand 시트 시작 행
  endRow: number;          // Hand 시트 종료 행
  lastStreet: string;      // 'preflop' | 'flop' | 'turn' | 'river'
  lastAction: string;      // "Hero Bets 25,000"
  workStatus: string;      // '진행중' | '완료' | '검토필요'
  cameraFiles: {           // 카메라 파일 정보
    cam: string;           // "Cam1+Cam2"
    cam01Name: string;     // "Cam1"
    cam01Number: number;   // 44
    cam02Name: string;     // "Cam2"
    cam02Number: number;   // 44
  };

  // 인덱스
  indexes: {
    tableId: string;       // 테이블별 핸드 조회
    timestamp: number;     // 시간순 정렬
    workStatus: string;    // 상태별 필터링
    lastStreet: string;    // 스트릿별 필터링
  }
}

// 인덱스 정의
keyPath: 'id'
indexes:
  - 'tableId'                         // 테이블별 핸드
  - 'timestamp'                       // 시간순
  - '[tableId+handNumber]' (unique)   // 복합 키
  - 'workStatus'                      // 상태별
  - 'lastStreet'                      // 스트릿별
```

---

#### 3. **handIndex** - 핸드 인덱스 (Index.csv 직접 매핑)
```typescript
interface HandIndexStore {
  id: string;              // PK: "T02#127"
  handNumber: number;      // 127
  startRow: number;        // 3
  endRow: number;          // 24
  handUpdatedAt: string;   // "2025-08-31"
  handEdit: boolean;       // TRUE/FALSE
  handEditTime: string;    // "2025. 9. 4"
  label: string;           // "HOLDEM"
  table: string;           // "T01"
  tableUpdatedAt: string;  // "2025-08-31"
  cam: string;             // "camAa+camBa"
  camFile01name: string;   // "camAa"
  camFile01number: number; // 1
  camFile02name: string;   // "camBa"
  camFile02number: number; // 2
  lastStreet: string;      // "flop"
  lastAction: string;      // "Fish Bets 10,000"
  workStatus: string;      // "진행중"
  winners: string;         // "Alice, Bob"

  // 인덱스
  indexes: {
    table: string;         // 테이블별
    workStatus: string;    // 상태별
    handUpdatedAt: string; // 날짜별
  }
}

// 인덱스 정의
keyPath: 'id'
indexes:
  - 'table'                           // 테이블별 인덱스
  - 'workStatus'                      // 상태별 필터
  - 'handUpdatedAt'                   // 날짜별 정렬
  - '[table+handNumber]' (unique)     // 복합 키
```

---

#### 4. **syncQueue** - 동기화 큐
```typescript
interface SyncQueueStore {
  id: string;              // PK: auto-generated UUID
  type: SyncTaskType;      // 'updateTable' | 'createHand' | 'updateHand' | 'appendEvent'
  data: any;               // 동기화할 데이터
  retryCount: number;      // 재시도 횟수
  nextRetryAt: number;     // 다음 재시도 시간
  createdAt: number;       // 생성 시간
  status: string;          // 'pending' | 'processing' | 'failed'

  // 인덱스
  indexes: {
    status: string;        // 상태별
    nextRetryAt: number;   // 재시도 스케줄
  }
}

// 인덱스 정의
keyPath: 'id'
indexes:
  - 'status'                          // 상태별 조회
  - 'nextRetryAt'                     // 재시도 시간순
  - '[status+nextRetryAt]'            // 복합 인덱스 (처리 대기 작업)
```

---

#### 5. **settings** - 앱 설정
```typescript
interface SettingsStore {
  key: string;             // PK: 설정 키
  value: any;              // 설정 값
  updatedAt: number;       // 업데이트 시간
}

// 설정 예시
{
  key: 'recentTables',
  value: ['T02', 'T03', 'GGPtable'],
  updatedAt: 1728123456789
}

{
  key: 'favoriteTables',
  value: ['merit-hall-ocean-blue'],
  updatedAt: 1728123456789
}

// 인덱스 정의
keyPath: 'key'
```

---

## 🔧 IndexedDB 초기화

### DB 생성 및 마이그레이션

```typescript
class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'PokerTableMonitor';
  private readonly DB_VERSION = 1;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. tables 스토어
        if (!db.objectStoreNames.contains('tables')) {
          const tableStore = db.createObjectStore('tables', { keyPath: 'id' });
          tableStore.createIndex('vipPlayers', 'vipPlayers', { multiEntry: true });
          tableStore.createIndex('updatedAt', 'updatedAt');
        }

        // 2. hands 스토어
        if (!db.objectStoreNames.contains('hands')) {
          const handStore = db.createObjectStore('hands', { keyPath: 'id' });
          handStore.createIndex('tableId', 'tableId');
          handStore.createIndex('timestamp', 'timestamp');
          handStore.createIndex('tableId_handNumber', ['tableId', 'handNumber'], { unique: true });
          handStore.createIndex('workStatus', 'workStatus');
          handStore.createIndex('lastStreet', 'lastStreet');
        }

        // 3. handIndex 스토어
        if (!db.objectStoreNames.contains('handIndex')) {
          const indexStore = db.createObjectStore('handIndex', { keyPath: 'id' });
          indexStore.createIndex('table', 'table');
          indexStore.createIndex('workStatus', 'workStatus');
          indexStore.createIndex('handUpdatedAt', 'handUpdatedAt');
          indexStore.createIndex('table_handNumber', ['table', 'handNumber'], { unique: true });
        }

        // 4. syncQueue 스토어
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          queueStore.createIndex('status', 'status');
          queueStore.createIndex('nextRetryAt', 'nextRetryAt');
          queueStore.createIndex('status_nextRetryAt', ['status', 'nextRetryAt']);
        }

        // 5. settings 스토어
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }
}
```

---

## 📥 데이터 흐름

### 1. **핸드 시작 시**
```typescript
async function startNewHand(table: Table): Promise<Result<Hand>> {
  // 1. 핸드 생성 (Domain)
  const handResult = Hand.createNext(table, table.lastHandNumber);
  const hand = handResult.value!;

  // 2. IndexedDB에 저장
  await indexedDB.saveHand({
    id: `${table.id}#${hand.number.value}`,
    tableId: table.id,
    handNumber: hand.number.value,
    timestamp: Date.now(),
    players: hand.getPlayers(),
    actions: [],
    boardCards: [],
    winners: [],
    status: 'active',

    // Index.csv 메타데이터 (초기값)
    startRow: 0,  // Google Sheets append 후 업데이트
    endRow: 0,
    lastStreet: 'preflop',
    lastAction: '',
    workStatus: '진행중',
    cameraFiles: {
      cam: 'Cam1+Cam2',
      cam01Name: 'Cam1',
      cam01Number: 0,
      cam02Name: 'Cam2',
      cam02Number: 0
    }
  });

  // 3. handIndex에도 저장
  await indexedDB.saveHandIndex({
    id: `${table.id}#${hand.number.value}`,
    handNumber: hand.number.value,
    table: table.id,
    workStatus: '진행중',
    lastStreet: 'preflop',
    // ... 기타 필드
  });

  // 4. Google Sheets에 비동기 전송
  syncAgent.appendHandRow(hand);

  return Result.ok(hand);
}
```

---

### 2. **액션 기록 시**
```typescript
async function recordAction(handId: string, action: Action): Promise<Result<void>> {
  // 1. IndexedDB에서 핸드 로드
  const hand = await indexedDB.getHand(handId);

  // 2. 액션 추가
  hand.actions.push(action);

  // 3. 메타데이터 업데이트
  hand.lastAction = `${action.playerId} ${action.type} ${action.amount.format()}`;

  // 스트릿 판단 (보드 카드 수로 추정)
  if (hand.boardCards.length === 0) hand.lastStreet = 'preflop';
  else if (hand.boardCards.length === 3) hand.lastStreet = 'flop';
  else if (hand.boardCards.length === 4) hand.lastStreet = 'turn';
  else if (hand.boardCards.length === 5) hand.lastStreet = 'river';

  // 4. IndexedDB 업데이트
  await indexedDB.updateHand(hand);

  // 5. handIndex 업데이트
  await indexedDB.updateHandIndex(handId, {
    lastStreet: hand.lastStreet,
    lastAction: hand.lastAction
  });

  // 6. Google Sheets에 비동기 전송
  syncAgent.appendEventRow(action);

  return Result.ok();
}
```

---

### 3. **핸드 완료 시**
```typescript
async function completeHand(handId: string, winners: string[]): Promise<Result<void>> {
  // 1. IndexedDB에서 핸드 로드
  const hand = await indexedDB.getHand(handId);

  // 2. 완료 처리
  hand.status = 'completed';
  hand.winners = winners;

  // 3. IndexedDB 업데이트
  await indexedDB.updateHand(hand);

  // 4. handIndex 업데이트
  await indexedDB.updateHandIndex(handId, {
    workStatus: '완료',
    winners: winners.join(', ')
  });

  // 5. Google Sheets에 빈 행 추가 (핸드 구분)
  await syncAgent.appendEmptyRow();

  // 6. Index.csv에 업데이트 (startRow, endRow)
  // Google Sheets API로 행 번호 조회 후 업데이트
  const sheetRows = await googleSheetsAPI.getLastHandRows(handId);
  await indexedDB.updateHandIndex(handId, {
    startRow: sheetRows.start,
    endRow: sheetRows.end,
    handUpdatedAt: new Date().toISOString().split('T')[0]
  });

  return Result.ok();
}
```

---

### 4. **키 플레이어 테이블 검색 시**
```typescript
async function findTableBy키 플레이어(vipName: string): Promise<Table | null> {
  // 1. IndexedDB의 tables 스토어에서 vipPlayers 인덱스 검색
  const tables = await indexedDB.getTablesBy키 플레이어Player(vipName);

  if (tables.length > 0) {
    // 로컬에서 발견
    return tables[0];
  }

  // 2. 로컬에 없으면 서버 검색 (백그라운드)
  syncAgent.search키 플레이어TableFromServer(vipName);

  return null;
}
```

---

### 5. **상태별 핸드 조회**
```typescript
// 검토 필요한 핸드 조회
async function getHandsNeedReview(): Promise<Hand[]> {
  const handIndexes = await indexedDB.query('handIndex', {
    index: 'workStatus',
    value: '검토필요'
  });

  const hands = await Promise.all(
    handIndexes.map(idx => indexedDB.getHand(idx.id))
  );

  return hands;
}

// 특정 테이블의 최근 핸드 조회 (50개)
async function getRecentHandsOfTable(tableId: string, limit: number = 50): Promise<Hand[]> {
  const hands = await indexedDB.query('hands', {
    index: 'tableId',
    value: tableId,
    direction: 'prev',  // 최신순
    limit
  });

  return hands;
}
```

---

## 🔄 Google Sheets ↔ IndexedDB 동기화

### 초기 로드 (앱 시작 시)
```typescript
async function initialSync(): Promise<void> {
  // 1. Index.csv 전체 로드
  const indexRows = await googleSheetsAPI.getAllIndexRows();

  // 2. IndexedDB handIndex 스토어에 저장
  for (const row of indexRows) {
    await indexedDB.saveHandIndex({
      id: `${row.table}#${row.handNumber}`,
      ...row
    });
  }

  // 3. 최근 핸드만 상세 로드 (최근 100개)
  const recentIndexes = indexRows.slice(-100);

  for (const idx of recentIndexes) {
    const handData = await googleSheetsAPI.getHandDetails(
      idx.startRow,
      idx.endRow
    );

    const hand = parseHandData(handData);
    await indexedDB.saveHand(hand);
  }

  console.log('✅ 초기 동기화 완료');
}
```

---

### 백그라운드 동기화
```typescript
class BackgroundSync {
  private syncInterval = 30000;  // 30초

  start(): void {
    setInterval(() => this.sync(), this.syncInterval);
  }

  private async sync(): Promise<void> {
    // 1. syncQueue에서 처리 대기 작업 조회
    const pendingTasks = await indexedDB.query('syncQueue', {
      index: 'status_nextRetryAt',
      range: IDBKeyRange.bound(
        ['pending', 0],
        ['pending', Date.now()]
      )
    });

    // 2. 작업 처리
    for (const task of pendingTasks) {
      try {
        await this.executeTask(task);

        // 성공 시 큐에서 제거
        await indexedDB.deleteSyncTask(task.id);

      } catch (error) {
        // 실패 시 재시도 스케줄 업데이트
        task.retryCount++;
        task.nextRetryAt = Date.now() + this.getBackoffDelay(task.retryCount);
        task.status = task.retryCount > 5 ? 'failed' : 'pending';

        await indexedDB.updateSyncTask(task);
      }
    }

    // 3. 서버에서 최신 Index 데이터 가져오기
    const latestIndex = await googleSheetsAPI.getLatestIndexRows();

    // 4. IndexedDB와 비교하여 업데이트
    for (const row of latestIndex) {
      const local = await indexedDB.getHandIndex(`${row.table}#${row.handNumber}`);

      if (!local || local.handUpdatedAt !== row.handUpdatedAt) {
        // 서버 데이터가 최신이면 업데이트
        await indexedDB.saveHandIndex(row);
      }
    }
  }

  private getBackoffDelay(retryCount: number): number {
    // Exponential backoff: 1초 → 2초 → 4초 → 8초 → 16초
    return Math.min(1000 * Math.pow(2, retryCount), 60000);
  }
}
```

---

## 🚀 Repository 구현 예시

### IndexedDBHandRepository
```typescript
class IndexedDBHandRepository implements HandRepository {
  constructor(private dbManager: IndexedDBManager) {}

  async save(hand: Hand): Promise<void> {
    const store = {
      id: `${hand.tableId}#${hand.number.value}`,
      tableId: hand.tableId,
      handNumber: hand.number.value,
      timestamp: hand.startedAt.getTime(),
      players: hand.getPlayers(),
      actions: hand.getActions(),
      boardCards: hand.boardCards,
      winners: Array.from(hand.winners),
      status: hand.status,
      // 메타데이터는 별도 업데이트
    };

    await this.dbManager.put('hands', store);
  }

  async findById(tableId: string, handNumber: number): Promise<Hand | null> {
    const id = `${tableId}#${handNumber}`;
    const store = await this.dbManager.get('hands', id);

    if (!store) return null;

    return this.deserialize(store);
  }

  async findByTable(tableId: string, limit: number = 50): Promise<Hand[]> {
    const stores = await this.dbManager.getByIndex(
      'hands',
      'tableId',
      tableId,
      { direction: 'prev', limit }
    );

    return stores.map(s => this.deserialize(s));
  }

  private deserialize(store: any): Hand {
    // Store → Hand aggregate 변환 로직
    // ...
  }
}
```

---

## 📊 성능 최적화

### 1. 인덱스 활용
- ✅ 키 플레이어 검색: `vipPlayers` multiEntry 인덱스
- ✅ 테이블별 핸드: `tableId` 인덱스
- ✅ 상태별 필터: `workStatus` 인덱스
- ✅ 복합 검색: `[tableId+handNumber]` 복합 인덱스

### 2. 커서 기반 페이징
```typescript
async function getHandsPaginated(
  tableId: string,
  pageSize: number = 20,
  cursor?: IDBCursor
): Promise<{ hands: Hand[], nextCursor: IDBCursor | null }> {
  const hands: Hand[] = [];
  let count = 0;

  const transaction = db.transaction('hands', 'readonly');
  const store = transaction.objectStore('hands');
  const index = store.index('tableId');

  const request = cursor
    ? index.openCursor(IDBKeyRange.only(tableId), 'prev')
    : cursor.continue();

  return new Promise((resolve) => {
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;

      if (cursor && count < pageSize) {
        hands.push(this.deserialize(cursor.value));
        count++;
        cursor.continue();
      } else {
        resolve({
          hands,
          nextCursor: cursor  // 다음 페이지용
        });
      }
    };
  });
}
```

### 3. 캐싱 레이어
```typescript
class CachedHandRepository {
  private cache = new Map<string, Hand>();
  private maxSize = 100;

  async findById(tableId: string, handNumber: number): Promise<Hand | null> {
    const id = `${tableId}#${handNumber}`;

    // 1. 캐시 확인
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    // 2. IndexedDB 조회
    const hand = await this.indexedDBRepo.findById(tableId, handNumber);

    if (hand) {
      // 3. 캐시에 추가 (LRU)
      this.addToCache(id, hand);
    }

    return hand;
  }

  private addToCache(id: string, hand: Hand): void {
    if (this.cache.size >= this.maxSize) {
      // LRU: 첫 번째 항목 제거
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(id, hand);
  }
}
```

---

## ✅ 요약

### IndexedDB 사용 목적
1. **빠른 로컬 검색**: 키 플레이어, 테이블, 상태별 핸드 조회
2. **오프라인 지원**: 네트워크 없이 100% 작동
3. **메타데이터 관리**: Index.csv 데이터 로컬 저장
4. **동기화 큐**: 실패한 작업 재시도

### 5개 Object Stores
- **tables**: 테이블 정보
- **hands**: 핸드 상세 데이터
- **handIndex**: Index.csv 직접 매핑 (메타데이터)
- **syncQueue**: 동기화 작업 큐
- **settings**: 앱 설정

### 핵심 전략
- ✅ **복합 키**: `tableId#handNumber`로 유일성 보장
- ✅ **다중 인덱스**: 다양한 검색 시나리오 지원
- ✅ **메타데이터 분리**: hands + handIndex 분리 관리
- ✅ **백그라운드 동기화**: 30초마다 서버와 동기화
- ✅ **캐싱**: 최근 100개 핸드 메모리 캐시

---

**승인**: _______________
**날짜**: 2025-10-05
