# 📋 PLAN v6.0 - 프로토타입 우선 개발 계획

> **Prototype-First Development Roadmap**
> **최종 업데이트**: 2025-10-05
> **기반 문서**: [PRD v5.0](./PRD.md), [프로토타입 우선 전략](./strategies/PROTOTYPE_FIRST_STRATEGY.md)
> **철학**: 핵심 기능 먼저 → 검증 → 부가 기능 확장

## 📚 관련 문서

- **요구사항**: [PRD.md](PRD.md)
- **상세 설계**: [LLD.md](LLD.md)
- **전략 문서**: [strategies/](strategies/)
  - [프로토타입 우선 전략](strategies/PROTOTYPE_FIRST_STRATEGY.md)
  - [Redis 캐싱 전략](strategies/REDIS_STRATEGY.md)
  - [IndexedDB 전략](strategies/INDEXEDDB_STRATEGY.md)
  - [에이전트 확장 전략](strategies/AGENT_SCALING_STRATEGY.md)
- **아키텍처**: [architecture/](architecture/)
  - [에이전트 아키텍처](architecture/AGENT_ARCHITECTURE.md)

---

## 🎯 개발 철학

### ❌ 기존 방식의 문제점
- 4주 후에야 동작하는 앱 완성
- 중간에 요구사항 변경 시 전체 재작업
- 실제 사용자 피드백 받기 어려움
- 처음부터 과도한 설계 (Over-Engineering)

### ✅ 프로토타입 우선 방식
- **3일 후 동작하는 앱** 완성
- **주간 사용자 피드백** 기반 개선
- **점진적 복잡도 증가** (필요할 때만)
- **매주 배포 가능한 버전** 유지

---

## 📅 Week 1: MVP 프로토타입

### 목표
**핵심 워크플로우만 동작**: 키 플레이어 검색 → 테이블 표시 → 핸드 기록 → 완료

### Day 1-2: 핵심 로직 구현 (단일 파일)

**파일**: `prototype.html` (올인원)

```html
<!DOCTYPE html>
<html>
<head>
  <title>포커 핸드 로거 - MVP</title>
  <style>
    .key-player { background: yellow; font-weight: bold; }
    #actions { border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>포커 테이블 모니터링 - MVP</h1>

  <!-- 1. 키 플레이어 검색 -->
  <section>
    <h2>1. 키 플레이어 검색</h2>
    <input id="keyPlayerInput" placeholder="이름 입력 (예: SHAHINA)">
    <button onclick="searchKeyPlayer()">검색</button>
  </section>

  <!-- 2. 테이블 플레이어 표시 -->
  <section>
    <h2>2. 테이블 플레이어</h2>
    <div id="players"></div>
  </section>

  <!-- 3. 핸드 컨트롤 -->
  <section>
    <h2>3. 핸드 기록</h2>
    <button id="startHandBtn" onclick="startHand()" disabled>핸드 시작</button>
    <div id="handInfo"></div>
  </section>

  <!-- 4. 액션 기록 -->
  <section>
    <input id="actionInput" placeholder="액션 (예: SHAHINA raises 5000)" disabled>
    <button id="recordBtn" onclick="recordAction()" disabled>기록</button>
    <div id="actions"></div>
  </section>

  <!-- 5. 핸드 완료 -->
  <section>
    <input id="winnerInput" placeholder="승자 이름" disabled>
    <button id="completeBtn" onclick="completeHand()" disabled>핸드 완료</button>
  </section>

  <script>
    // Google Sheets API 설정
    const SHEET_ID = 'YOUR_SHEET_ID';
    const API_KEY = 'YOUR_API_KEY';

    let currentTable = null;
    let currentHand = null;

    // 1. 키 플레이어 검색
    async function searchKeyPlayer() {
      const name = document.getElementById('keyPlayerInput').value;

      // Google Sheets Type 시트 조회
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Type!A:H?key=${API_KEY}`
      );
      const data = await response.json();

      // 키 플레이어 찾기
      const rows = data.values.slice(1); // 헤더 제외
      const tables = new Map();

      for (const row of rows) {
        const [pokerRoom, tableName, tableNo, seatNo, playerName, nationality, chips, isKeyPlayer] = row;
        const tableId = `${pokerRoom}-${tableName}`.replace(/ /g, '-').toLowerCase();

        if (!tables.has(tableId)) {
          tables.set(tableId, {
            id: tableId,
            pokerRoom,
            tableName,
            players: []
          });
        }

        tables.get(tableId).players.push({
          seatNo: parseInt(seatNo),
          name: playerName,
          chips: parseInt(chips.replace(/,/g, '')),
          isKeyPlayer: isKeyPlayer === 'TRUE'
        });
      }

      // 키 플레이어가 있는 테이블 찾기
      for (const table of tables.values()) {
        const keyPlayers = table.players.filter(p => p.isKeyPlayer);
        if (keyPlayers.some(p => p.name.includes(name))) {
          currentTable = table;
          displayTable(table);
          document.getElementById('startHandBtn').disabled = false;
          return;
        }
      }

      alert('키 플레이어를 찾을 수 없습니다');
    }

    // 2. 테이블 표시
    function displayTable(table) {
      const html = `
        <h3>${table.pokerRoom} - ${table.tableName}</h3>
        ${table.players.map(p => `
          <div class="${p.isKeyPlayer ? 'key-player' : ''}">
            좌석 #${p.seatNo}: ${p.name} ${p.isKeyPlayer ? '⭐' : ''} - ${p.chips.toLocaleString()} 칩
          </div>
        `).join('')}
      `;
      document.getElementById('players').innerHTML = html;
    }

    // 3. 핸드 시작
    async function startHand() {
      const handNumber = prompt('핸드 번호를 입력하세요', '1');

      currentHand = {
        number: parseInt(handNumber),
        tableId: currentTable.id,
        timestamp: Date.now(),
        actions: []
      };

      // Google Sheets에 HAND 행 추가
      await appendToSheet('Hand', [
        ['HAND', currentHand.number, currentHand.timestamp, 'HOLDEM', 'BB_ANTE', '', '', '', '', '', '', '', '', '', '', '', currentTable.id]
      ]);

      // 플레이어 행 추가
      for (const player of currentTable.players) {
        await appendToSheet('Hand', [
          ['PLAYER', player.name, player.seatNo, 0, player.chips, player.chips, '']
        ]);
      }

      document.getElementById('handInfo').innerHTML = `<strong>핸드 #${currentHand.number} 진행 중</strong>`;
      document.getElementById('actionInput').disabled = false;
      document.getElementById('recordBtn').disabled = false;
      document.getElementById('winnerInput').disabled = false;
      document.getElementById('completeBtn').disabled = false;
    }

    // 4. 액션 기록
    async function recordAction() {
      const action = document.getElementById('actionInput').value;

      currentHand.actions.push(action);

      // Google Sheets에 EVENT 행 추가
      await appendToSheet('Hand', [
        ['EVENT', 'ACTION', '', '', Date.now(), action]
      ]);

      // UI 업데이트
      const actionDiv = document.createElement('div');
      actionDiv.textContent = `${new Date().toLocaleTimeString()}: ${action}`;
      document.getElementById('actions').appendChild(actionDiv);

      document.getElementById('actionInput').value = '';
    }

    // 5. 핸드 완료
    async function completeHand() {
      const winner = document.getElementById('winnerInput').value;

      // Google Sheets에 빈 행 추가 (핸드 구분)
      await appendToSheet('Hand', [['']]);

      alert(`핸드 #${currentHand.number} 완료! 승자: ${winner}`);

      // 초기화
      document.getElementById('handInfo').innerHTML = '';
      document.getElementById('actions').innerHTML = '';
      document.getElementById('actionInput').disabled = true;
      document.getElementById('recordBtn').disabled = true;
      document.getElementById('winnerInput').disabled = true;
      document.getElementById('completeBtn').disabled = true;
      document.getElementById('winnerInput').value = '';

      currentHand = null;
    }

    // Google Sheets 추가 헬퍼
    async function appendToSheet(sheetName, values) {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!A:Z:append?valueInputOption=RAW&key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values })
        }
      );
      return response.json();
    }
  </script>
</body>
</html>
```

**완료 조건**:
- [ ] 키 플레이어 검색 동작
- [ ] 테이블 플레이어 표시
- [ ] 핸드 시작/기록/완료 동작
- [ ] Google Sheets 연동 확인

---

### Day 3: UI 개선 및 에러 처리

**개선 사항**:
```javascript
// 로딩 표시
function showLoading(message) {
  document.body.innerHTML += `<div id="loading">${message}...</div>`;
}

function hideLoading() {
  document.getElementById('loading')?.remove();
}

// 에러 처리
async function searchKeyPlayer() {
  try {
    showLoading('검색 중');
    // ... 검색 로직
    hideLoading();
  } catch (error) {
    hideLoading();
    alert(`에러: ${error.message}`);
  }
}

// 입력 검증
function recordAction() {
  const action = document.getElementById('actionInput').value;

  if (!action.trim()) {
    alert('액션을 입력하세요');
    return;
  }

  // ... 기록 로직
}
```

**완료 조건**:
- [ ] 로딩 상태 표시
- [ ] 에러 처리 완료
- [ ] 입력 검증 추가

---

### Day 4: E2E 테스트

**시나리오 테스트**:
```javascript
// test-scenario.js
async function testFullWorkflow() {
  console.log('🧪 E2E 테스트 시작...');

  // 1. 키 플레이어 검색
  console.log('1. 키 플레이어 검색 (SHAHINA)');
  document.getElementById('keyPlayerInput').value = 'SHAHINA';
  await searchKeyPlayer();

  await sleep(1000);

  // 2. 핸드 시작
  console.log('2. 핸드 시작');
  await startHand();

  await sleep(1000);

  // 3. 액션 기록 (5개)
  const actions = [
    'SHAHINA raises 5000',
    'Alice calls 5000',
    'Bob folds',
    'SHAHINA bets 10000',
    'Alice calls 10000'
  ];

  for (const action of actions) {
    console.log(`3. 액션 기록: ${action}`);
    document.getElementById('actionInput').value = action;
    await recordAction();
    await sleep(500);
  }

  // 4. 핸드 완료
  console.log('4. 핸드 완료 (승자: SHAHINA)');
  document.getElementById('winnerInput').value = 'SHAHINA';
  await completeHand();

  console.log('✅ E2E 테스트 완료!');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 실행
testFullWorkflow();
```

**완료 조건**:
- [ ] E2E 테스트 스크립트 작성
- [ ] 자동 테스트 통과
- [ ] Google Sheets 데이터 확인

---

### Day 5: 사용자 테스트 및 피드백

**테스트 시나리오**:
1. 실제 데이터 매니저와 함께 테스트
2. 키 플레이어 검색 (SHAHINA)
3. Ocean Blue 테이블 확인
4. 핸드 #128 시작
5. 5개 액션 기록
6. 핸드 완료

**피드백 수집 양식**:
```markdown
## 사용자 피드백

### 1. 좋은 점
- [ ]

### 2. 불편한 점
- [ ]

### 3. 빠진 기능
- [ ]

### 4. 성능 이슈
- [ ]

### 5. 우선순위 개선 사항
1.
2.
3.
```

**완료 조건**:
- [ ] 실제 사용자 테스트 완료
- [ ] 피드백 3개 이상 수집
- [ ] Week 2 우선순위 결정

---

## 📅 Week 2: 성능 개선 및 아키텍처 개선

### Day 6-7: IndexedDB 캐싱 도입

**문제**: "키 플레이어 검색이 5초나 걸려요"

**해결**:
```javascript
// indexeddb-cache.js

class TableCache {
  constructor() {
    this.db = null;
  }

  async init() {
    const request = indexedDB.open('PokerMonitor', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('tables', { keyPath: 'id' });
      db.createObjectStore('keyPlayers', { keyPath: 'name' });
    };

    this.db = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveTable(table) {
    const tx = this.db.transaction('tables', 'readwrite');
    await tx.objectStore('tables').put(table);
  }

  async findTableByKeyPlayer(name) {
    const tx = this.db.transaction('tables', 'readonly');
    const tables = await tx.objectStore('tables').getAll();

    for (const table of tables) {
      const keyPlayers = table.players.filter(p => p.isKeyPlayer);
      if (keyPlayers.some(p => p.name.includes(name))) {
        return table;
      }
    }

    return null;
  }
}

// 사용
const cache = new TableCache();
await cache.init();

// 검색 시
async function searchKeyPlayer() {
  const name = document.getElementById('keyPlayerInput').value;

  // 1. 캐시 확인
  let table = await cache.findTableByKeyPlayer(name);

  if (table) {
    console.log('✅ IndexedDB 캐시 히트');
    currentTable = table;
    displayTable(table);
    return;
  }

  // 2. Google Sheets 조회
  showLoading('검색 중');
  table = await searchFromGoogleSheets(name);
  hideLoading();

  if (table) {
    await cache.saveTable(table);
    currentTable = table;
    displayTable(table);
  }
}
```

**완료 조건**:
- [ ] IndexedDB 캐싱 구현
- [ ] 성능 개선: 5초 → 100ms
- [ ] 캐시 히트율 측정

---

### Day 8-9: Service 레이어 분리

**문제**: "코드가 복잡해지고 있어요"

**해결**:
```javascript
// services/TableService.js
class TableService {
  constructor(cache, api) {
    this.cache = cache;
    this.api = api;
  }

  async findByKeyPlayer(name) {
    // 캐시 우선
    let table = await this.cache.findTableByKeyPlayer(name);
    if (table) return table;

    // API 조회
    table = await this.api.searchKeyPlayer(name);
    if (table) await this.cache.saveTable(table);

    return table;
  }
}

// services/HandService.js
class HandService {
  constructor(api) {
    this.api = api;
  }

  async start(tableId, handNumber) {
    const hand = {
      number: handNumber,
      tableId,
      timestamp: Date.now(),
      actions: []
    };

    await this.api.appendHandRow(hand);
    return hand;
  }

  async recordAction(hand, action) {
    hand.actions.push(action);
    await this.api.appendEventRow(action);
  }

  async complete(hand, winner) {
    await this.api.appendEmptyRow();
    return { hand, winner };
  }
}

// main.js
const tableService = new TableService(cache, googleSheetsAPI);
const handService = new HandService(googleSheetsAPI);

async function searchKeyPlayer() {
  const name = document.getElementById('keyPlayerInput').value;
  currentTable = await tableService.findByKeyPlayer(name);

  if (currentTable) {
    displayTable(currentTable);
  }
}
```

**완료 조건**:
- [ ] Service 레이어 분리 (2개 클래스)
- [ ] 단위 테스트 작성
- [ ] 테스트 커버리지 80%

---

### Day 10: 두 번째 사용자 테스트

**개선 사항 검증**:
- 성능 개선 체감 확인
- 새로운 피드백 수집
- Week 3 우선순위 결정

---

## 📅 Week 3: 부가 기능 추가 (우선순위별)

### Day 11-12: Redis 캐싱 (Multi-User 지원)

**문제**: "여러 명이 동시에 사용하면 느려져요"

**해결**: [REDIS_STRATEGY.md](./REDIS_STRATEGY.md) 참고

**완료 조건**:
- [ ] Redis 읽기 캐싱
- [ ] 성능: 100ms → 10ms

---

### Day 13-14: 실시간 동기화 (Pub/Sub)

**문제**: "다른 사람이 기록한 액션이 안 보여요"

**해결**: Redis Pub/Sub

**완료 조건**:
- [ ] 실시간 동기화 동작
- [ ] 여러 브라우저 테스트

---

### Day 15: 오프라인 지원

**문제**: "인터넷 끊기면 못 쓰네요"

**해결**: 동기화 큐

**완료 조건**:
- [ ] 오프라인 작동
- [ ] 자동 동기화 검증

---

## 📅 Week 4: 고급 기능 및 마무리

### Day 16-17: DDD 리팩토링 (필요 시)

코드가 복잡해지면 그때 도입:
- Domain Layer 분리
- Application Layer 분리
- Event Bus 도입

---

### Day 18-19: 자동 에이전트 분할

코드가 500줄 넘어가면:
- AutoSplitter 실행
- 서브 에이전트 생성

---

### Day 20: 배포 및 회고

- 프로덕션 배포
- 회고 및 다음 계획

---

## ✅ 성공 기준

### Week 1
- [ ] 동작하는 MVP 완성
- [ ] 사용자 피드백 3개 이상

### Week 2
- [ ] 10배 성능 개선
- [ ] Service 레이어 분리

### Week 3
- [ ] Redis 캐싱 동작
- [ ] 실시간 동기화 확인

### Week 4
- [ ] 모든 기능 통합
- [ ] 프로덕션 배포

---

**핵심 원칙**: 완벽한 설계보다 동작하는 프로토타입이 먼저다! 🚀
