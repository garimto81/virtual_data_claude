# 🚀 Redis 도입 전략 - Google Sheets 반응성 개선

> **Redis Caching & Real-time Sync Strategy**
> **최종 업데이트**: 2025-10-05
> **목적**: Google Sheets API의 느린 반응성 해결

---

## 🎯 문제 분석

### Google Sheets API 성능 한계

#### 1. **응답 속도**
```
현재 상황:
- 읽기 (100개 행): 1-3초
- 쓰기 (배치 10개): 2-5초
- 검색 (전체 스캔): 5-10초

목표:
- 읽기: < 100ms
- 쓰기: < 50ms (로컬)
- 검색: < 50ms
```

#### 2. **API 제한**
- **Read quota**: 100 requests/100 seconds/user
- **Write quota**: 100 requests/100 seconds/user
- **Rate limit 초과 시**: 429 Error (Quota Exceeded)

#### 3. **동시성 문제**
- 여러 사용자 동시 접근 시 충돌
- Last-Write-Wins로 데이터 손실 위험

---

## 💡 Redis 도입 아키텍처

### 3-Tier 캐싱 전략

```
┌─────────────────────────────────────────────┐
│        Client (Browser)                      │
│  IndexedDB (로컬 캐시, 오프라인 지원)          │
└─────────────────────────────────────────────┘
                    ↕ (실시간 동기화)
┌─────────────────────────────────────────────┐
│        Redis Server (중간 캐시)               │
│  - 핫 데이터 캐싱 (TTL: 5분)                  │
│  - Pub/Sub (실시간 동기화)                    │
│  - 작업 큐 (Bull Queue)                       │
└─────────────────────────────────────────────┘
                    ↕ (백그라운드 동기화)
┌─────────────────────────────────────────────┐
│        Google Sheets (영구 저장소)            │
│  - Cold Storage                             │
│  - 감사 로그                                  │
│  - 백업                                      │
└─────────────────────────────────────────────┘
```

---

## 🏗️ Redis 데이터 구조 설계

### 1. **Hash - 테이블 데이터**
```redis
# Key: table:{tableId}
HSET table:merit-hall-ocean-blue
  id "merit-hall-ocean-blue"
  name "Merit Hall - Ocean Blue"
  lastHandNumber 127
  updatedAt 1728123456789
  players '[{"id":"p1","name":"SHAHINA","isKeyPlayer":true}...]'

# TTL: 5분 (자주 접근하는 테이블만 캐시)
EXPIRE table:merit-hall-ocean-blue 300
```

### 2. **Hash - 핸드 데이터**
```redis
# Key: hand:{tableId}:{handNumber}
HSET hand:T02:127
  id "T02#127"
  tableId "T02"
  handNumber 127
  timestamp 1756296967
  status "active"
  players '[...]'
  actions '[...]'
  boardCards '[...]'

EXPIRE hand:T02:127 300
```

### 3. **Set - 키 플레이어 인덱스**
```redis
# Key: keyplayer:index
# Value: tableId 목록 (키 플레이어가 있는 테이블)
SADD keyplayer:SHAHINA "merit-hall-ocean-blue"
SADD keyplayer:WOLFKING "merit-hall-ocean-blue"

# 키 플레이어로 테이블 검색
SMEMBERS keyplayer:SHAHINA
# → ["merit-hall-ocean-blue"]
```

### 4. **Sorted Set - 최근 핸드**
```redis
# Key: recent:hands:{tableId}
# Score: timestamp
# Member: handNumber

ZADD recent:hands:T02 1756296967 127
ZADD recent:hands:T02 1756297123 128
ZADD recent:hands:T02 1756297456 129

# 최근 10개 핸드 조회
ZREVRANGE recent:hands:T02 0 9
# → [129, 128, 127, ...]
```

### 5. **List - 동기화 큐**
```redis
# Key: sync:queue
# Value: JSON 작업

LPUSH sync:queue '{"type":"updateTable","data":{...}}'
LPUSH sync:queue '{"type":"createHand","data":{...}}'

# Worker가 처리
RPOP sync:queue
```

### 6. **Pub/Sub - 실시간 동기화**
```redis
# 채널: table:{tableId}:updates
PUBLISH table:T02:updates '{"type":"PlayerAdded","data":{...}}'

# 구독
SUBSCRIBE table:T02:updates
# → 모든 클라이언트가 실시간 수신
```

---

## 🔄 데이터 흐름 (Read Path)

### 시나리오: 키 플레이어 테이블 검색

```typescript
async function findTableByKeyPlayer(keyPlayerName: string): Promise<Table | null> {
  // 1. Redis 검색 (< 10ms)
  const tableIds = await redis.smembers(`keyplayer:${keyPlayerName}`);

  if (tableIds.length > 0) {
    // 2. Redis에서 테이블 데이터 가져오기
    const tableData = await redis.hgetall(`table:${tableIds[0]}`);

    if (tableData) {
      console.log('✅ Redis 캐시 히트');
      return deserializeTable(tableData);
    }
  }

  // 3. IndexedDB 폴백
  const localTable = await indexedDB.findTableByKeyPlayer(keyPlayerName);

  if (localTable) {
    console.log('✅ IndexedDB 히트');

    // Redis에 캐싱 (다음 검색용)
    await cacheTableToRedis(localTable);

    return localTable;
  }

  // 4. Google Sheets 폴백 (최종)
  console.log('⏳ Google Sheets 조회 중...');
  const sheetTable = await googleSheetsAPI.searchKeyPlayerTable(keyPlayerName);

  if (sheetTable) {
    // IndexedDB + Redis 캐싱
    await indexedDB.saveTable(sheetTable);
    await cacheTableToRedis(sheetTable);

    return sheetTable;
  }

  return null;
}
```

**성능 개선**:
- Redis: 10ms (300배 빠름)
- IndexedDB: 50ms (60배 빠름)
- Google Sheets: 3000ms (기존)

---

## 🔄 데이터 흐름 (Write Path)

### 시나리오: 핸드 액션 기록

```typescript
async function recordAction(handId: string, action: Action): Promise<Result<void>> {
  // 1. 로컬 IndexedDB 즉시 저장 (< 50ms)
  await indexedDB.saveAction(handId, action);

  // 2. Redis 업데이트 (< 10ms)
  await redis.hset(`hand:${handId}`, 'actions', JSON.stringify([...hand.actions, action]));
  await redis.hset(`hand:${handId}`, 'lastAction', `${action.playerId} ${action.type} ${action.amount}`);

  // 3. Redis Pub/Sub로 다른 클라이언트에 실시간 전파 (< 5ms)
  await redis.publish(`hand:${handId}:updates`, JSON.stringify({
    type: 'ActionRecorded',
    data: action
  }));

  // 4. 동기화 큐에 추가 (백그라운드)
  await redis.lpush('sync:queue', JSON.stringify({
    type: 'appendEvent',
    handId,
    action,
    timestamp: Date.now()
  }));

  console.log('✅ 액션 기록 완료 (총 < 100ms)');

  return Result.ok();
}
```

**백그라운드 Worker**:
```typescript
// sync-worker.ts
class SyncWorker {
  async start() {
    while (true) {
      // 큐에서 작업 가져오기
      const task = await redis.rpop('sync:queue');

      if (task) {
        const { type, handId, action } = JSON.parse(task);

        try {
          // Google Sheets에 기록
          await googleSheetsAPI.appendEventRow(action);

          console.log('✅ Google Sheets 동기화 완료');

        } catch (error) {
          // 실패 시 재시도 큐로 이동
          await redis.lpush('sync:retry', task);

          console.error('❌ 동기화 실패:', error);
        }
      }

      await sleep(1000); // 1초 대기
    }
  }
}
```

---

## 🚀 실시간 동기화 (Multi-User)

### Pub/Sub 기반 실시간 업데이트

```typescript
// Client A: 액션 기록
await recordAction('T02#127', Action.raise('Alice', 5000));
// → Redis Pub/Sub로 전파

// Client B, C, D: 실시간 수신
redis.subscribe('hand:T02#127:updates', (message) => {
  const event = JSON.parse(message);

  if (event.type === 'ActionRecorded') {
    // UI 즉시 업데이트
    updateActionLog(event.data);

    console.log('📢 실시간 업데이트 수신:', event.data);
  }
});
```

**성능**:
- Pub/Sub 지연 시간: < 10ms
- 여러 사용자 동시 시청 가능
- Google Sheets 폴링 불필요

---

## 📊 Redis vs Google Sheets 성능 비교

| 작업 | Google Sheets | IndexedDB | Redis | 개선 배수 |
|------|--------------|-----------|-------|----------|
| **키 플레이어 검색** | 3000ms | 50ms | 10ms | **300배** |
| **테이블 로드** | 2000ms | 30ms | 8ms | **250배** |
| **핸드 시작** | 1500ms | 40ms | 12ms | **125배** |
| **액션 기록** | 1000ms | 20ms | 5ms | **200배** |
| **실시간 동기화** | 불가능 (폴링) | 불가능 | Pub/Sub (< 10ms) | **무한대** |

---

## 🏗️ 아키텍처 구현

### 1. Redis 클라이언트 설정

```typescript
// src/infrastructure/redis/RedisClient.ts

import { createClient } from 'redis';

class RedisClient {
  private client: ReturnType<typeof createClient>;
  private subscriber: ReturnType<typeof createClient>;

  async connect() {
    // 메인 클라이언트
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
      }
    });

    // Pub/Sub 전용 클라이언트
    this.subscriber = this.client.duplicate();

    await this.client.connect();
    await this.subscriber.connect();

    console.log('✅ Redis 연결 완료');
  }

  // Hash 작업
  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hSet(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.client.hGetAll(key);
  }

  // Set 작업
  async sadd(key: string, member: string): Promise<void> {
    await this.client.sAdd(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.client.sMembers(key);
  }

  // Sorted Set 작업
  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.client.zAdd(key, { score, value: member });
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.client.zRange(key, start, stop, { REV: true });
  }

  // Pub/Sub
  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message);
  }

  async subscribe(channel: string, handler: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel, handler);
  }

  // 큐 작업
  async lpush(key: string, value: string): Promise<void> {
    await this.client.lPush(key, value);
  }

  async rpop(key: string): Promise<string | null> {
    return await this.client.rPop(key);
  }

  // TTL 설정
  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }
}

export const redis = new RedisClient();
```

---

### 2. 캐싱 레이어 (Cache-Aside Pattern)

```typescript
// src/infrastructure/redis/CacheLayer.ts

class CacheLayer {
  private readonly TTL = 300; // 5분

  // 테이블 캐싱
  async cacheTable(table: Table): Promise<void> {
    const key = `table:${table.id}`;

    await redis.hset(key, 'id', table.id);
    await redis.hset(key, 'name', table.name);
    await redis.hset(key, 'lastHandNumber', table.lastHandNumber.toString());
    await redis.hset(key, 'players', JSON.stringify(table.getAllPlayers()));
    await redis.hset(key, 'updatedAt', table.updatedAt.getTime().toString());

    // TTL 설정
    await redis.expire(key, this.TTL);

    // 키 플레이어 인덱스 업데이트
    const keyPlayers = table.getKeyPlayers();
    for (const player of keyPlayers) {
      await redis.sadd(`keyplayer:${player.name}`, table.id);
    }
  }

  // 테이블 가져오기 (캐시 우선)
  async getTable(tableId: string): Promise<Table | null> {
    const key = `table:${tableId}`;
    const data = await redis.hgetall(key);

    if (Object.keys(data).length === 0) {
      return null; // 캐시 미스
    }

    // 역직렬화
    return this.deserializeTable(data);
  }

  // 핸드 캐싱
  async cacheHand(hand: Hand): Promise<void> {
    const key = `hand:${hand.tableId}:${hand.number.value}`;

    await redis.hset(key, 'id', `${hand.tableId}#${hand.number.value}`);
    await redis.hset(key, 'tableId', hand.tableId);
    await redis.hset(key, 'handNumber', hand.number.value.toString());
    await redis.hset(key, 'status', hand.status);
    await redis.hset(key, 'players', JSON.stringify(hand.getPlayers()));
    await redis.hset(key, 'actions', JSON.stringify(hand.getActions()));

    await redis.expire(key, this.TTL);

    // 최근 핸드 Sorted Set 업데이트
    await redis.zadd(
      `recent:hands:${hand.tableId}`,
      hand.startedAt.getTime(),
      hand.number.value.toString()
    );
  }

  // 최근 핸드 가져오기
  async getRecentHands(tableId: string, limit: number = 10): Promise<number[]> {
    const handNumbers = await redis.zrevrange(`recent:hands:${tableId}`, 0, limit - 1);
    return handNumbers.map(n => parseInt(n));
  }
}
```

---

### 3. 실시간 동기화 서비스

```typescript
// src/infrastructure/redis/RealtimeSync.ts

class RealtimeSync {
  async publishTableUpdate(tableId: string, event: DomainEvent): Promise<void> {
    const channel = `table:${tableId}:updates`;
    await redis.publish(channel, JSON.stringify(event));
  }

  async publishHandUpdate(handId: string, event: DomainEvent): Promise<void> {
    const channel = `hand:${handId}:updates`;
    await redis.publish(channel, JSON.stringify(event));
  }

  async subscribeToTable(tableId: string, handler: (event: DomainEvent) => void): Promise<void> {
    const channel = `table:${tableId}:updates`;

    await redis.subscribe(channel, (message) => {
      const event = JSON.parse(message);
      handler(event);
    });
  }

  async subscribeToHand(handId: string, handler: (event: DomainEvent) => void): Promise<void> {
    const channel = `hand:${handId}:updates`;

    await redis.subscribe(channel, (message) => {
      const event = JSON.parse(message);
      handler(event);
    });
  }
}
```

---

### 4. 백그라운드 동기화 Worker

```typescript
// workers/sync-worker.ts

class GoogleSheetsSyncWorker {
  private readonly BATCH_SIZE = 10;

  async start() {
    console.log('🔄 동기화 Worker 시작...');

    while (true) {
      await this.processBatch();
      await sleep(1000); // 1초 대기
    }
  }

  private async processBatch(): Promise<void> {
    const tasks: SyncTask[] = [];

    // 큐에서 배치 가져오기
    for (let i = 0; i < this.BATCH_SIZE; i++) {
      const task = await redis.rpop('sync:queue');
      if (task) {
        tasks.push(JSON.parse(task));
      } else {
        break;
      }
    }

    if (tasks.length === 0) return;

    console.log(`📦 ${tasks.length}개 작업 처리 중...`);

    // 배치 처리
    const results = await Promise.allSettled(
      tasks.map(task => this.processTask(task))
    );

    // 실패한 작업 재시도 큐로 이동
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const task = tasks[i];
        task.retryCount = (task.retryCount || 0) + 1;

        if (task.retryCount < 5) {
          redis.lpush('sync:retry', JSON.stringify(task));
        } else {
          // Dead Letter Queue
          redis.lpush('sync:failed', JSON.stringify(task));
        }
      }
    });
  }

  private async processTask(task: SyncTask): Promise<void> {
    switch (task.type) {
      case 'appendEvent':
        await googleSheetsAPI.appendEventRow(task.action);
        break;
      case 'updateTable':
        await googleSheetsAPI.updateTableRow(task.table);
        break;
      case 'createHand':
        await googleSheetsAPI.appendHandRow(task.hand);
        break;
    }
  }
}

// 실행
const worker = new GoogleSheetsSyncWorker();
worker.start();
```

---

## 💰 비용 분석

### Redis 호스팅 옵션

#### 1. **Redis Cloud (추천)**
- **Free Tier**: 30MB, 30 connections
- **Basic**: $5/월 (250MB, 256 connections)
- **Pro**: $25/월 (1GB, 1000 connections)

#### 2. **AWS ElastiCache**
- **cache.t3.micro**: $12/월 (0.5GB)
- **cache.t3.small**: $25/월 (1.37GB)

#### 3. **자체 호스팅 (Docker)**
- **비용**: $5/월 (VPS)
- **장점**: 완전 제어
- **단점**: 관리 부담

**추천**: Redis Cloud Basic ($5/월) - 소규모 시작

---

## 🎯 도입 전략 (단계별)

### Phase 1: 읽기 캐싱 (Week 1)
```typescript
// 키 플레이어 검색만 Redis 캐싱
async function findTableByKeyPlayer(name: string): Promise<Table | null> {
  // 1. Redis 확인
  const cached = await cacheLayer.getTable(tableId);
  if (cached) return cached;

  // 2. Google Sheets 조회
  const table = await googleSheetsAPI.search(name);

  // 3. Redis 캐싱
  if (table) await cacheLayer.cacheTable(table);

  return table;
}
```

### Phase 2: 쓰기 최적화 (Week 2)
```typescript
// 동기화 큐 도입
async function recordAction(action: Action): Promise<void> {
  // 1. IndexedDB 즉시 저장
  await indexedDB.save(action);

  // 2. Redis 큐에 추가
  await redis.lpush('sync:queue', JSON.stringify(action));

  // 3. Worker가 백그라운드 처리
}
```

### Phase 3: 실시간 동기화 (Week 3)
```typescript
// Pub/Sub 도입
await redis.publish('hand:T02#127:updates', JSON.stringify({
  type: 'ActionRecorded',
  data: action
}));

// 모든 클라이언트 실시간 수신
redis.subscribe('hand:T02#127:updates', (event) => {
  updateUI(event);
});
```

### Phase 4: 전체 통합 (Week 4)
- 모든 읽기/쓰기 작업 Redis 경유
- Google Sheets는 백업/감사 로그용
- 성능 모니터링 및 최적화

---

## ⚖️ Redis vs IndexedDB 역할 분리

| 특징 | IndexedDB | Redis |
|------|----------|-------|
| **위치** | 클라이언트 (브라우저) | 서버 (중앙) |
| **용도** | 개인 오프라인 캐시 | 공유 캐시 + 실시간 동기화 |
| **동기화** | 백그라운드 (느림) | Pub/Sub (실시간) |
| **용량** | 무제한 (디스크) | 제한적 (메모리) |
| **속도** | 30-50ms | 5-10ms |
| **Multi-User** | 불가능 | 가능 (Pub/Sub) |

**결론**: **둘 다 사용!**
- IndexedDB: 오프라인 지원, 개인 데이터
- Redis: 실시간 동기화, 공유 캐시

---

## ✅ 최종 추천

### 🟢 Redis 도입 **강력 추천!**

**이유**:
1. ✅ **300배 성능 향상** (3초 → 10ms)
2. ✅ **실시간 동기화** (Pub/Sub)
3. ✅ **Multi-User 지원** (여러 데이터 매니저 동시 작업)
4. ✅ **API Quota 절약** (Google Sheets 호출 90% 감소)
5. ✅ **저렴한 비용** ($5/월)

**구현 우선순위**:
1. Week 1: 읽기 캐싱 (키 플레이어 검색)
2. Week 2: 쓰기 큐 (백그라운드 동기화)
3. Week 3: Pub/Sub (실시간 동기화)
4. Week 4: 전체 통합

---

## 🚀 다음 단계

```bash
# 1. Redis 서버 설정
docker run -d -p 6379:6379 redis:alpine

# 2. Redis 클라이언트 설치
npm install redis

# 3. RedisClient 구현
# src/infrastructure/redis/RedisClient.ts 작성

# 4. 테스트
npm test src/infrastructure/redis/__tests__/RedisClient.test.ts
```

Redis 도입을 강력히 추천합니다! 🚀

**승인**: _______________
**날짜**: 2025-10-05
