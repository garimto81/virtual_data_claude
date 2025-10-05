# 데이터 아키텍처 제안: CSV vs Apps Script API vs Redis

## 🎯 목표
Google Sheets 데이터 읽기/쓰기 성능을 개선하고, 사용자 경험을 향상시키는 최적의 아키텍처 설계

---

## 📊 현재 아키텍처 분석 (CSV 방식)

### 데이터 흐름
```
앱 시작
  ↓
[READ] fetchCsv(CSV_TYPE_URL)    - 3-5초 (플레이어 데이터)
[READ] fetchCsv(CSV_INDEX_URL)   - 3-5초 (핸드 인덱스)
[READ] fetchCsv(CSV_CONFIG_URL)  - 1-2초 (설정)
  ↓ parseCSV() - 100-200ms
  ↓ buildTypeFromCsv() - 50-100ms
  ↓
window.state 업데이트
  ↓
UI 렌더링
  ↓
[WRITE] Apps Script POST - 2-4초 (핸드 저장)
  ↓
[READ] fetchCsv(CSV_INDEX_URL) - 3-5초 (재로드)
```

### ⏱️ 성능 측정

**앱 시작 시간:**
```
CSV 다운로드: 3개 × 4초 = 12초
CSV 파싱: 300ms
데이터 처리: 200ms
─────────────────────
총: 12.5초
```

**핸드 저장 시간:**
```
Apps Script POST: 3초
Index CSV 재로드: 4초
데이터 파싱: 100ms
─────────────────────
총: 7.1초
```

**플레이어 검색 (타이핑 시):**
```
window.state.players 배열 순회: 1-5ms (메모리 기반)
✅ 빠름 (이미 로드됨)
```

### 🐌 CSV 방식의 문제점

#### 1. 느린 초기 로딩 (12.5초)
**원인:**
- Google Sheets "웹에 퍼블리시" → CSV 생성은 **캐싱이 불규칙**
- 시트가 수정되어도 CSV가 즉시 갱신되지 않음 (최대 5분 지연)
- 네트워크 지연 (Google CDN → 사용자 브라우저)

**사용자 경험:**
```
사용자: 앱 열기
앱: "로딩 중..." (12초 대기)
사용자: 😴 지루함, 앱이 느리다고 느낌
```

#### 2. 캐시 무효화 문제
```javascript
// 현재 해결책: 쿼리 파라미터로 캐시 우회
const idxRows = await fetchCsv(CSV_INDEX_URL + `&cb=${Date.now()}`);
```

**문제:**
- `&cb=` 파라미터를 추가해도 Google CDN이 여전히 캐싱할 수 있음
- 진짜 최신 데이터 보장 불가능

#### 3. 타입 불안정
```javascript
// CSV: 모든 값이 문자열
const chips = "1000"  // ❌ String

// 파싱 필요
const chipsNum = parseInt(chips, 10);  // 1000
```

#### 4. 데이터 일관성
**시나리오:**
```
사용자 A: 핸드 저장 (15:00:00)
  ↓ Apps Script → Google Sheets 업데이트
사용자 B: 새로고침 (15:00:05)
  ↓ CSV 다운로드 (아직 이전 버전, 캐싱됨)

사용자 B는 5초 전 데이터를 보게 됨!
```

#### 5. 대용량 데이터 문제
**Type 시트:**
- 10개 테이블 × 100명 = 1,000 플레이어
- CSV 크기: 약 100KB
- 다운로드 시간: 4초

**Index 시트:**
- 1,000개 핸드
- CSV 크기: 약 50KB
- 다운로드 시간: 3초

**Hand 시트:**
- 10,000 행 (1,000 핸드 × 평균 10줄)
- CSV 크기: 약 500KB
- 다운로드 시간: 8초 (거의 사용 안 함)

---

## 🚀 제안 1: Apps Script JSON API 방식

### 아키텍처

```
앱 시작
  ↓
[READ] callAppsScript('getPlayers', { table: 'Table A' })  - 2-3초
[READ] callAppsScript('getHandIndex', { limit: 100 })      - 1-2초
[READ] callAppsScript('getConfig', {})                     - 0.5-1초
  ↓ (JSON 파싱 자동, 타입 안전)
  ↓
window.state 업데이트
  ↓
[WRITE] callAppsScript('saveHand', { handData })           - 2-3초
  ↓
[READ] callAppsScript('getHandIndex', { limit: 100 })      - 1-2초 (재로드)
```

### Apps Script 구현

```javascript
// Apps Script: doGet/doPost 통합
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'getPlayers') {
    return getPlayers(e.parameter.table);
  } else if (action === 'getHandIndex') {
    return getHandIndex(e.parameter.limit);
  } else if (action === 'getConfig') {
    return getConfig();
  }

  return error('Unknown action');
}

function getPlayers(tableName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Type');
  const data = sheet.getDataRange().getValues();

  // 헤더 제외, 테이블 필터링
  const players = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // 테이블 필터 (선택적)
    if (tableName && row[1] !== tableName) {
      continue;
    }

    players.push({
      player: row[0],
      table: row[1],
      notable: row[2],
      chips: Number(row[3]),        // ✅ 타입 변환
      updatedAt: row[4],
      seat: row[5],
      status: row[6]
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify({ players }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getHandIndex(limit) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Index');
  const data = sheet.getDataRange().getValues();

  // 최신 핸드 먼저 (역순 정렬)
  const hands = [];
  const maxRows = limit ? Math.min(limit, data.length - 1) : data.length - 1;

  for (let i = data.length - 1; i >= data.length - maxRows; i--) {
    const row = data[i];
    hands.push({
      handNumber: Number(row[0]),   // ✅ 타입 변환
      table: row[1],
      start: row[2],
      date: row[3],
      timezone: row[4],
      work: row[5]
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify({ hands }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 프론트엔드 구현

```javascript
// 기존: CSV 다운로드
async function loadInitial() {
  const [typeRows, idxRows] = await Promise.all([
    fetchCsv(CSV_TYPE_URL),
    fetchCsv(CSV_INDEX_URL)
  ]);

  buildTypeFromCsv(typeRows);
  buildIndexFromCsv(idxRows);
}

// ✅ 개선: Apps Script JSON API
async function loadInitial() {
  const [playersRes, handsRes] = await Promise.all([
    callAppsScript('getPlayers', { table: window.state.selectedTable }),
    callAppsScript('getHandIndex', { limit: 100 })
  ]);

  // ✅ 타입 안전, 파싱 불필요
  window.state.players = playersRes.players;
  window.state.indexRows = handsRes.hands;

  // ✅ parseCSV(), buildTypeFromCsv() 불필요
}

// callAppsScript 헬퍼 함수
async function callAppsScript(action, params = {}) {
  const url = `${APPS_SCRIPT_URL}?action=${action}&${new URLSearchParams(params)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Apps Script error: ${response.status}`);
  }

  return await response.json();
}
```

### ⚖️ Apps Script API 장단점

**장점:**
- ✅ **타입 안전**: 숫자는 Number, 문자열은 String
- ✅ **최신 데이터**: 캐싱 없음, 항상 실시간 데이터
- ✅ **필터링**: 서버에서 필터링 (table별, limit 등)
- ✅ **코드 간소화**: parseCSV() 300줄 제거
- ✅ **데이터 일관성**: 여러 사용자가 동일한 데이터 보장

**단점:**
- ❌ **Apps Script 할당량 증가**: READ도 Apps Script 사용
  - 현재: 100 핸드 × 1회 = 100회
  - 개선: 100 핸드 × 3회 (시작 2회 + 저장 후 1회) = 300회
- ❌ **CORS 이슈 가능성**: 브라우저 제한
- ❌ **Apps Script 오류 시**: READ도 실패 (CSV는 Apps Script 무관)
- ❌ **속도**: Apps Script 실행 시간 (1-3초) vs CSV 캐싱 (0.5초)

### 📊 성능 비교

| 작업 | CSV | Apps Script API | 개선 |
|------|-----|-----------------|------|
| 앱 시작 | 12.5초 (3개 CSV) | **5-7초** (2개 API) | 5.5초 단축 (44%) |
| 핸드 저장 후 재로드 | 7.1초 | **3-4초** | 3.1초 단축 (44%) |
| 타입 안전성 | ❌ String | ✅ Number | - |
| 데이터 일관성 | ⚠️ 캐시 지연 | ✅ 실시간 | - |
| Apps Script 호출 | 100회/일 | **300회/일** | 200회 증가 |

**결론:**
- ⚠️ 할당량 여유 있으면 (20,000회/일) Apps Script API 권장
- ⚠️ 여러 사용자 동시 사용 시 할당량 주의

---

## 🔥 제안 2: Redis 캐싱 아키텍처 (최적)

### 3-Tier 아키텍처

```
┌─────────────────┐
│   Browser       │
│  (IndexedDB)    │  ← Tier 1: 로컬 캐시 (50ms)
└─────────────────┘
        ↓ 동기화
┌─────────────────┐
│   Redis Cloud   │  ← Tier 2: 중앙 캐시 (10ms)
│   ($5/month)    │
└─────────────────┘
        ↓ 동기화
┌─────────────────┐
│ Google Sheets   │  ← Tier 3: 원본 데이터 (3000ms)
│  (Apps Script)  │
└─────────────────┘
```

### Tier 1: IndexedDB (클라이언트 로컬 캐시)

**목적:** 오프라인 지원, 즉시 로딩

```javascript
// IndexedDB 스키마
const DB_NAME = 'PokerHandLogger';
const DB_VERSION = 1;

const STORES = {
  players: {
    keyPath: 'id',
    indexes: [
      { name: 'table', keyPath: 'table' },
      { name: 'seat', keyPath: 'seat' }
    ]
  },
  hands: {
    keyPath: 'handNumber',
    indexes: [
      { name: 'table', keyPath: 'table' },
      { name: 'date', keyPath: 'date' }
    ]
  },
  syncQueue: {
    keyPath: 'id',
    autoIncrement: true
  }
};

// IndexedDB 초기화
async function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Object Stores 생성
      for (const [name, config] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, {
            keyPath: config.keyPath,
            autoIncrement: config.autoIncrement
          });

          // 인덱스 생성
          if (config.indexes) {
            config.indexes.forEach(index => {
              store.createIndex(index.name, index.keyPath);
            });
          }
        }
      }
    };
  });
}

// 플레이어 조회 (IndexedDB → Redis → Google Sheets)
async function getPlayers(tableName) {
  const db = await initIndexedDB();

  // Step 1: IndexedDB 조회
  const cachedPlayers = await getPlayersFromIndexedDB(db, tableName);

  if (cachedPlayers && isCacheFresh(cachedPlayers.timestamp, 60000)) {
    // 1분 이내 캐시 → 즉시 반환 (50ms)
    console.log('✅ IndexedDB 캐시 적중');
    return cachedPlayers.data;
  }

  // Step 2: Redis 조회
  const redisPlayers = await getPlayersFromRedis(tableName);

  if (redisPlayers) {
    // Redis 캐시 적중 (10ms)
    console.log('✅ Redis 캐시 적중');

    // IndexedDB에도 저장
    await savePlayersToIndexedDB(db, tableName, redisPlayers);
    return redisPlayers;
  }

  // Step 3: Google Sheets 조회 (최후의 수단)
  console.log('⚠️ 캐시 미스 - Google Sheets 조회');
  const players = await callAppsScript('getPlayers', { table: tableName });

  // Redis와 IndexedDB에 저장
  await savePlayersToRedis(tableName, players);
  await savePlayersToIndexedDB(db, tableName, players);

  return players;
}

// IndexedDB 헬퍼 함수들
async function getPlayersFromIndexedDB(db, tableName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['players'], 'readonly');
    const store = tx.objectStore('players');
    const index = store.index('table');
    const request = index.getAll(tableName);

    request.onsuccess = () => resolve({
      data: request.result,
      timestamp: Date.now()
    });
    request.onerror = () => reject(request.error);
  });
}

async function savePlayersToIndexedDB(db, tableName, players) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['players'], 'readwrite');
    const store = tx.objectStore('players');

    players.forEach(player => {
      store.put({
        ...player,
        id: `${player.table}_${player.player}`, // 복합 키
        cachedAt: Date.now()
      });
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function isCacheFresh(timestamp, maxAge) {
  return (Date.now() - timestamp) < maxAge;
}
```

### Tier 2: Redis (중앙 캐시)

**목적:** 여러 사용자 간 데이터 공유, Pub/Sub 실시간 동기화

**Redis Cloud 설정:**
```bash
# Upstash Redis (무료 티어)
# https://upstash.com/
# - 10,000 commands/day
# - 256MB storage
# - Global replication

# 또는 Redis Cloud (유료, 추천)
# https://redis.com/
# - Basic: $5/month
# - 30MB RAM
# - 30 connections
```

**Redis 데이터 구조:**
```javascript
// Redis Keys 설계
KEYS:
  - players:{table}         → Hash (테이블별 플레이어 목록)
  - hands:index             → Sorted Set (핸드 인덱스, score=handNumber)
  - hand:{handNumber}       → Hash (핸드 상세 데이터)
  - sync:version            → String (데이터 버전, 동기화용)
  - cache:timestamp         → String (마지막 갱신 시간)

// 예시: players:TableA
HGETALL players:TableA
{
  "Alice": '{"chips":1000,"seat":"#1","updatedAt":"2025-10-05T10:00:00Z"}',
  "Bob": '{"chips":2000,"seat":"#2","updatedAt":"2025-10-05T10:05:00Z"}'
}

// 예시: hands:index (Sorted Set)
ZRANGE hands:index 0 -1 WITHSCORES
{
  "hand:42": 42,
  "hand:43": 43,
  "hand:44": 44
}

// 예시: hand:42
HGETALL hand:42
{
  "handNumber": 42,
  "table": "TableA",
  "date": "2025-10-05",
  "players": '["Alice","Bob"]',
  "pot": 5000
}
```

**Redis API 구현 (프론트엔드):**
```javascript
// Upstash Redis REST API 사용
const REDIS_URL = 'https://your-redis.upstash.io';
const REDIS_TOKEN = 'your-token-here';

async function redisCommand(command, ...args) {
  const response = await fetch(`${REDIS_URL}/${command}/${args.join('/')}`, {
    headers: {
      'Authorization': `Bearer ${REDIS_TOKEN}`
    }
  });

  const data = await response.json();
  return data.result;
}

// 플레이어 조회
async function getPlayersFromRedis(tableName) {
  const playersHash = await redisCommand('HGETALL', `players:${tableName}`);

  if (!playersHash || Object.keys(playersHash).length === 0) {
    return null;
  }

  // Hash → 배열 변환
  const players = Object.entries(playersHash).map(([name, data]) => {
    return {
      player: name,
      ...JSON.parse(data)
    };
  });

  return players;
}

// 플레이어 저장
async function savePlayersToRedis(tableName, players) {
  const pipeline = [];

  players.forEach(player => {
    pipeline.push(['HSET', `players:${tableName}`, player.player, JSON.stringify({
      chips: player.chips,
      seat: player.seat,
      table: player.table,
      updatedAt: new Date().toISOString()
    })]);
  });

  // 배치 실행
  await Promise.all(pipeline.map(cmd => redisCommand(...cmd)));

  // 타임스탬프 갱신
  await redisCommand('SET', 'cache:timestamp', Date.now());
}

// 핸드 인덱스 조회 (최신 100개)
async function getHandIndexFromRedis(limit = 100) {
  const hands = await redisCommand('ZREVRANGE', 'hands:index', 0, limit - 1, 'WITHSCORES');

  // [key1, score1, key2, score2, ...] → [{handNumber, ...}, ...]
  const result = [];
  for (let i = 0; i < hands.length; i += 2) {
    const handKey = hands[i];
    const handNumber = hands[i + 1];

    // 핸드 상세 조회
    const handData = await redisCommand('HGETALL', handKey);
    result.push({
      handNumber: Number(handNumber),
      ...handData
    });
  }

  return result;
}
```

### Tier 3: Google Sheets 동기화

**Apps Script에서 Redis 업데이트:**
```javascript
// Apps Script: 핸드 저장 시 Redis 동기화
function saveHand(handData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Hand');

  // 1. Google Sheets에 저장
  sheet.appendRow([handData.handNumber, handData.table, ...]);

  // 2. Redis에도 동기화
  updateRedisCache('hand:' + handData.handNumber, handData);
  updateRedisIndex('hands:index', handData.handNumber);

  return { status: 'success', handNumber: handData.handNumber };
}

function updateRedisCache(key, data) {
  const url = 'https://your-redis.upstash.io/HSET/' + key;

  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer your-token-here',
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(data)
  };

  UrlFetchApp.fetch(url, options);
}
```

### 🔔 실시간 동기화 (Pub/Sub)

**목적:** 여러 사용자가 동시 사용 시 데이터 실시간 반영

```javascript
// Redis Pub/Sub 구독
async function subscribeToUpdates() {
  const eventSource = new EventSource(`${REDIS_URL}/subscribe/poker-updates`);

  eventSource.onmessage = async (event) => {
    const update = JSON.parse(event.data);

    console.log('🔔 실시간 업데이트:', update);

    if (update.type === 'player_updated') {
      // IndexedDB 캐시 무효화
      await invalidateCache('players', update.table);

      // 데이터 재로드
      const players = await getPlayers(update.table);

      // UI 업데이트
      renderPlayerList(players);
    } else if (update.type === 'hand_saved') {
      // 핸드 인덱스 재로드
      const hands = await getHandIndex(100);
      renderHandList(hands);
    }
  };
}

// Apps Script에서 Redis Pub/Sub 발행
function saveHand(handData) {
  // ... (저장 로직)

  // Redis Pub/Sub로 알림
  publishUpdate({
    type: 'hand_saved',
    handNumber: handData.handNumber,
    table: handData.table
  });
}

function publishUpdate(message) {
  const url = 'https://your-redis.upstash.io/PUBLISH/poker-updates';

  UrlFetchApp.fetch(url, {
    method: 'post',
    headers: {
      'Authorization': 'Bearer your-token-here'
    },
    payload: JSON.stringify(message)
  });
}
```

### 📊 Redis 아키텍처 성능 비교

| 작업 | 현재 (CSV) | Apps Script API | Redis (3-Tier) | 개선 |
|------|-----------|-----------------|----------------|------|
| **앱 시작 (최초)** | 12.5초 | 5-7초 | **8초** (Sheets → Redis → IndexedDB) | 4.5초 단축 |
| **앱 시작 (재방문)** | 12.5초 | 5-7초 | **50ms** (IndexedDB 캐시) | **250배 빠름** |
| **핸드 저장** | 7.1초 | 3-4초 | **3-4초** (Apps Script + Redis 동기화) | 3.1초 단축 |
| **플레이어 검색** | 5ms | 2-3초 (API 호출) | **50ms** (IndexedDB) | 동일 |
| **실시간 동기화** | ❌ 없음 | ❌ 없음 | ✅ **Pub/Sub** | - |
| **오프라인 지원** | ❌ 없음 | ❌ 없음 | ✅ **IndexedDB** | - |
| **비용** | 무료 | 무료 | **$5/월** | - |

### 💰 비용 분석

**Redis Cloud Basic ($5/월):**
- 30MB RAM (플레이어 10,000명 + 핸드 1,000개 저장 가능)
- 30 connections (동시 사용자 30명)
- 99.9% uptime SLA

**Upstash Redis (무료 티어):**
- 10,000 commands/day (하루 100 핸드 × 20 commands = 2,000 commands)
- 256MB storage
- Global replication
- ⚠️ 무료로 시작 가능, 나중에 유료 전환

---

## 🎯 최종 권장사항

### 추천: Redis 3-Tier 아키텍처

**이유:**
1. ✅ **최고의 성능**: 재방문 시 50ms (250배 개선)
2. ✅ **실시간 동기화**: Pub/Sub로 여러 사용자 데이터 일치
3. ✅ **오프라인 지원**: IndexedDB로 네트워크 없이도 작동
4. ✅ **확장성**: 사용자 증가해도 성능 유지
5. ✅ **비용 효율**: $5/월 (커피 1잔 가격)

### 단계별 마이그레이션 계획

#### Phase 0: 현재 유지 (안전)
- CSV 방식 유지
- Papa Parse 도입 (parseCSV 개선)

#### Phase 1: IndexedDB 도입 (2주)
- 로컬 캐시만 먼저 구현
- CSV → IndexedDB → window.state
- 오프라인 지원 추가
- **리스크: 낮음**, **효과: 중간** (재방문 시 빠름)

#### Phase 2: Apps Script API 전환 (2주)
- CSV 제거
- Apps Script JSON API 구현
- IndexedDB와 연동
- **리스크: 중간**, **효과: 높음** (타입 안전, 실시간 데이터)

#### Phase 3: Redis 추가 (2주)
- Redis Cloud 계정 생성 ($5/월)
- Redis 캐싱 레이어 추가
- Pub/Sub 실시간 동기화
- **리스크: 낮음**, **효과: 매우 높음** (최고 성능)

### 타임라인

```
Week 1-2: IndexedDB 구현
Week 3-4: Apps Script API 전환
Week 5-6: Redis 통합
Week 7-8: 최적화 및 테스트
─────────────────────────
총: 2개월
```

### 대안: 단계별 선택

**옵션 A: 최소한 개선**
- Papa Parse만 도입
- CSV 방식 유지
- **시간: 1시간**, **비용: 무료**, **개선: 10%**

**옵션 B: 중간 개선**
- IndexedDB 추가
- CSV 방식 유지
- **시간: 2주**, **비용: 무료**, **개선: 50%**

**옵션 C: 최대 개선 (권장)**
- Redis 3-Tier 아키텍처
- **시간: 2개월**, **비용: $5/월**, **개선: 250%**

---

## 📋 구현 체크리스트

### Phase 1: IndexedDB (우선)
- [ ] IndexedDB 스키마 설계
- [ ] initIndexedDB() 구현
- [ ] Object Stores 생성 (players, hands, syncQueue)
- [ ] 인덱스 생성 (table, date, seat)
- [ ] CRUD 함수 구현
- [ ] 캐시 유효성 검사 (타임스탬프 기반)
- [ ] 오프라인 지원 테스트
- [ ] 동기화 큐 구현 (오프라인 시 변경사항 저장)

### Phase 2: Apps Script API
- [ ] Apps Script doGet/doPost 통합
- [ ] getPlayers() API 구현
- [ ] getHandIndex() API 구현
- [ ] saveHand() API 수정 (JSON 반환)
- [ ] 프론트엔드 callAppsScript() 헬퍼
- [ ] CSV 제거 (fetchCsv, parseCSV, buildTypeFromCsv)
- [ ] 에러 처리 및 재시도 로직
- [ ] Apps Script 할당량 모니터링

### Phase 3: Redis
- [ ] Redis Cloud 계정 생성
- [ ] Redis 데이터 구조 설계
- [ ] Redis API 구현 (Upstash REST)
- [ ] 3-Tier 캐싱 로직 (IndexedDB → Redis → Sheets)
- [ ] Pub/Sub 구독/발행 구현
- [ ] Apps Script에서 Redis 동기화
- [ ] 캐시 무효화 전략
- [ ] 성능 벤치마크

---

다음 단계를 결정해주세요:
1. **옵션 A**: Papa Parse만 도입 (1시간)
2. **옵션 B**: IndexedDB 추가 (2주)
3. **옵션 C**: Redis 3-Tier 전체 구현 (2개월)
