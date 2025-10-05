# Redis 무료 옵션 상세 분석

## ❓ Redis는 유료인가?

**답: 아니요, 완전 무료 옵션이 있습니다!** ✅

---

## 🆓 무료 옵션 비교

### 1. Upstash Redis ⭐⭐⭐ 강력 추천

**완전 무료 티어 (신용카드 불필요)**

#### 스펙
```
✅ 10,000 commands/day (충분함)
✅ 256MB storage
✅ Global Edge Network (CDN)
✅ REST API (브라우저에서 직접 호출)
✅ TLS 암호화
✅ 무제한 데이터베이스
❌ 유료 전환 강제 없음
```

#### 사용량 계산
```javascript
// 하루 100 핸드 기록 시나리오
앱 시작: 3 commands (HGETALL players, ZRANGE hands, GET config)
핸드 저장: 5 commands (HSET hand, ZADD index, HSET players, PUBLISH update)
재방문: 2 commands (IndexedDB 먼저 확인 → Redis는 캐시 미스 시만)

하루 사용량:
- 앱 시작 5회: 5 × 3 = 15 commands
- 핸드 저장 100회: 100 × 5 = 500 commands
- 재방문 10회: 10 × 2 = 20 commands
─────────────────────────
총: 535 commands/day

무료 한도: 10,000 commands/day
사용률: 5.35% ✅ 여유 충분
```

#### 장점
- ✅ **완전 무료** (신용카드 등록 불필요)
- ✅ **REST API** (JavaScript fetch()로 직접 호출 가능)
- ✅ **Global CDN** (전세계 어디서든 빠름)
- ✅ **Serverless** (서버 관리 불필요)
- ✅ **자동 확장** (무료 범위 내)

#### 단점
- ⚠️ 10,000 commands/day 제한 (충분하지만)
- ⚠️ Pub/Sub는 유료 ($10/월)

#### 가입 방법
```
1. https://upstash.com/ 접속
2. GitHub 계정으로 로그인 (무료)
3. "Create Database" 클릭
4. "Free" 플랜 선택
5. Region 선택 (가장 가까운 지역)
6. REST URL과 Token 복사
```

#### 코드 예시
```javascript
// Upstash Redis REST API 사용
const REDIS_URL = 'https://apn1-stunning-frog-12345.upstash.io';
const REDIS_TOKEN = 'AYF8AAI...'; // Upstash에서 제공

async function redisGet(key) {
  const response = await fetch(`${REDIS_URL}/GET/${key}`, {
    headers: {
      'Authorization': `Bearer ${REDIS_TOKEN}`
    }
  });

  const data = await response.json();
  return data.result;
}

async function redisSet(key, value) {
  const response = await fetch(`${REDIS_URL}/SET/${key}/${value}`, {
    headers: {
      'Authorization': `Bearer ${REDIS_TOKEN}`
    }
  });

  return response.json();
}

// 해시 (Hash) 사용
async function redisHGetAll(key) {
  const response = await fetch(`${REDIS_URL}/HGETALL/${key}`, {
    headers: {
      'Authorization': `Bearer ${REDIS_TOKEN}`
    }
  });

  const data = await response.json();
  return data.result;
}

// 사용 예시
const players = await redisHGetAll('players:TableA');
console.log(players); // { Alice: '{"chips":1000}', Bob: '{"chips":2000}' }
```

---

### 2. Redis Cloud 무료 티어 ⭐⭐

**30MB 무료 (신용카드 필요)**

#### 스펙
```
✅ 30MB RAM
✅ 30 connections
⚠️ 신용카드 등록 필요 (자동 결제 없음)
❌ Pub/Sub 미지원 (유료만)
```

#### 장점
- ✅ 공식 Redis Labs 제공
- ✅ 모든 Redis 명령어 지원

#### 단점
- ❌ 신용카드 필요
- ❌ Pub/Sub 없음
- ❌ 30MB 제한 (Upstash보다 작음)

---

### 3. 자체 호스팅 (완전 무료, 고급 사용자용) ⭐

**자신의 서버에 Redis 설치**

#### 옵션 A: Docker
```bash
# 로컬 PC에 Redis 실행
docker run -d -p 6379:6379 redis:alpine

# 또는 Docker Compose
version: '3'
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

#### 옵션 B: Railway.app (무료 호스팅)
```
1. https://railway.app/ 접속
2. GitHub 로그인
3. "New Project" → "Deploy Redis"
4. 무료 티어: $5 크레딧/월 (충분함)
5. Redis URL 자동 생성
```

#### 옵션 C: Fly.io (무료 호스팅)
```
1. https://fly.io/ 접속
2. CLI 설치: curl -L https://fly.io/install.sh | sh
3. Redis 앱 생성: fly launch --image redis:alpine
4. 무료 티어: 3개 앱까지 무료
```

#### 장점
- ✅ **완전 무료**
- ✅ **무제한 commands**
- ✅ **모든 기능 사용 가능**

#### 단점
- ❌ 서버 관리 필요
- ❌ 네트워크 설정 필요 (포트 포워딩 등)
- ❌ 보안 설정 필요

---

## 🎯 추천: Upstash Redis (무료 티어)

### 이유
1. ✅ **완전 무료** (신용카드 불필요)
2. ✅ **10,000 commands/day** → 하루 100 핸드 기록해도 5%만 사용
3. ✅ **REST API** → Apps Script와 브라우저에서 쉽게 사용
4. ✅ **Global CDN** → 빠른 속도
5. ✅ **관리 불필요** → Serverless

### 제한 사항 및 대응

#### 제한 1: 10,000 commands/day
**대응:**
- IndexedDB 1차 캐시 사용 → Redis 호출 최소화
- 캐시 TTL 1분 → 재방문 시 Redis 호출 안 함

```javascript
// 1차: IndexedDB (무료, 무제한)
const cached = await getFromIndexedDB('players');

if (cached && isFresh(cached, 60000)) {
  return cached.data; // Redis 호출 안 함
}

// 2차: Redis (무료, 10,000/day)
const players = await redisHGetAll('players:TableA');
await saveToIndexedDB('players', players);

return players;
```

#### 제한 2: Pub/Sub는 유료 ($10/월)
**대응:**
- **대안 1**: Polling (5초마다 버전 체크)
```javascript
setInterval(async () => {
  const version = await redisGet('sync:version');

  if (version !== localVersion) {
    // 데이터 재로드
    await reloadData();
    localVersion = version;
  }
}, 5000); // 5초마다
```

- **대안 2**: Server-Sent Events (SSE)
```javascript
// Apps Script에서 변경 시 버전 증가
function saveHand(handData) {
  // ... 저장 로직

  const currentVersion = await redisGet('sync:version') || 0;
  await redisSet('sync:version', currentVersion + 1);
}

// 프론트엔드: 버전 변경 감지
```

- **대안 3**: 실시간 동기화 포기 (새로고침으로 충분)
  - 한 명만 사용하면 실시간 동기화 불필요
  - 여러 명 사용 시에도 새로고침 버튼으로 해결 가능

---

## 💰 비용 시나리오

### 시나리오 1: 개인 사용자 (하루 50 핸드)
```
Upstash 무료 티어:
- Commands: 250/day (2.5% 사용)
- Storage: 5MB (2% 사용)
- 비용: $0/월 ✅

결론: 완전 무료로 충분
```

### 시나리오 2: 소규모 팀 (3명, 하루 200 핸드)
```
Upstash 무료 티어:
- Commands: 1,000/day (10% 사용)
- Storage: 15MB (6% 사용)
- 비용: $0/월 ✅

결론: 무료로 충분
```

### 시나리오 3: 중규모 팀 (10명, 하루 500 핸드)
```
Upstash 무료 티어:
- Commands: 2,500/day (25% 사용)
- Storage: 40MB (16% 사용)
- 비용: $0/월 ✅

결론: 여전히 무료로 충분
```

### 시나리오 4: 대규모 (30명, 하루 1,500 핸드)
```
Upstash 무료 티어:
- Commands: 7,500/day (75% 사용)
- Storage: 120MB (47% 사용)
- 비용: $0/월 ✅

결론: 무료 한도 근접, 모니터링 필요
```

### 시나리오 5: 초대규모 (50명, 하루 3,000 핸드)
```
Upstash 무료 티어 초과:
- Commands: 15,000/day (150% 사용) ❌

Upstash 유료 (Pay-as-you-go):
- $0.2 per 100K commands
- 15,000 commands/day = 450K/month
- 비용: $0.9/월 ✅ 여전히 저렴

또는 Redis Cloud Basic:
- 비용: $5/월
```

---

## 📊 최종 결론

### 추천 아키텍처 (완전 무료)

```
IndexedDB (브라우저 로컬)
    ↓
Upstash Redis (무료 티어)
    ↓
Google Sheets (Apps Script)
```

**비용: $0/월** ✅

**성능:**
- 앱 시작 (재방문): **50ms** (IndexedDB 캐시)
- 앱 시작 (최초): **8초** (Redis + Sheets)
- 핸드 저장: **3-4초**
- 실시간 동기화: Polling (5초마다)

**제약:**
- 하루 10,000 commands 제한 (충분함)
- Pub/Sub 없음 (Polling 대안)

### 유료 전환 시점

**언제 유료로 전환해야 하나?**
- 하루 commands > 10,000 (하루 핸드 > 500개)
- 실시간 Pub/Sub 필요 (여러 사용자 동시 작업)
- 더 큰 Storage 필요 (> 256MB)

**유료 비용:**
- Upstash Pay-as-you-go: **$0.2 per 100K commands** (매우 저렴)
- Upstash Pro: **$10/월** (Pub/Sub 포함)
- Redis Cloud Basic: **$5/월**

---

## 🚀 시작하기

### Step 1: Upstash 가입 (무료)
```
1. https://upstash.com/ 접속
2. GitHub 계정으로 로그인
3. "Create Database" 클릭
4. 이름: poker-hand-logger
5. Region: Asia Pacific (ap-northeast-1 - Tokyo)
6. Type: Regional (무료)
```

### Step 2: API 키 복사
```javascript
// Upstash 대시보드에서 복사
const REDIS_URL = 'https://apn1-stunning-frog-12345.upstash.io';
const REDIS_TOKEN = 'AYF8AAI...';
```

### Step 3: 코드에 추가
```javascript
// index.html에 추가
const REDIS_CONFIG = {
  url: 'https://apn1-stunning-frog-12345.upstash.io',
  token: 'AYF8AAI...'
};

async function redisCommand(command, ...args) {
  const url = `${REDIS_CONFIG.url}/${command}/${args.join('/')}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${REDIS_CONFIG.token}`
    }
  });

  const data = await response.json();
  return data.result;
}

// 사용 예시
await redisCommand('SET', 'test', 'hello');
const value = await redisCommand('GET', 'test');
console.log(value); // "hello"
```

### Step 4: IndexedDB + Redis 통합
```javascript
async function getPlayers(tableName) {
  // 1차: IndexedDB 캐시
  const cached = await getFromIndexedDB(`players:${tableName}`);

  if (cached && isFresh(cached.timestamp, 60000)) {
    console.log('✅ IndexedDB 캐시 적중');
    return cached.data;
  }

  // 2차: Redis 캐시
  const redisData = await redisCommand('HGETALL', `players:${tableName}`);

  if (redisData && Object.keys(redisData).length > 0) {
    console.log('✅ Redis 캐시 적중');

    const players = Object.entries(redisData).map(([name, json]) => ({
      player: name,
      ...JSON.parse(json)
    }));

    await saveToIndexedDB(`players:${tableName}`, players);
    return players;
  }

  // 3차: Google Sheets (최후)
  console.log('⚠️ 캐시 미스 - Sheets 조회');
  const players = await callAppsScript('getPlayers', { table: tableName });

  // Redis와 IndexedDB에 저장
  for (const player of players) {
    await redisCommand('HSET', `players:${tableName}`, player.player, JSON.stringify({
      chips: player.chips,
      seat: player.seat,
      updatedAt: new Date().toISOString()
    }));
  }

  await saveToIndexedDB(`players:${tableName}`, players);
  return players;
}
```

---

**결론: Redis는 무료로 시작 가능하며, 개인 사용자에게는 영구 무료입니다!** ✅
