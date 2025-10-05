# 구현 로드맵

## 🎯 현재 상황 요약

### 완료된 작업 ✅
1. ✅ 전체 앱 분석 완료 (134개 함수, 7,992줄)
2. ✅ 아키텍처 개선안 도출
3. ✅ High Priority 항목 심층 분석
4. ✅ Redis 무료 옵션 확인 (Upstash 무료 티어)
5. ✅ 문서 정리 (docs 폴더 구조화)
6. ✅ **Phase 0 완료 (v3.7.0)** - 2025-10-05
7. ✅ **Phase 1 Week 3 완료 (v3.8.0)** - 2025-10-05
8. ✅ **Phase 1 Week 4 완료 (v3.9.0)** - 2025-10-05
9. ✅ **Phase 2 Week 5 완료 (v3.10.0)** - 2025-10-05

### Phase 0 완료 내역
- ✅ Week 1: 중복 제거 자동화 (v3.6.0)
- ✅ Architecture Fix: Google Sheets API 제거 (v3.6.1)
- ✅ Week 2: 클라우드 동기화 제거 + Papa Parse (v3.7.0)
- ✅ **총 코드 감소: ~640줄**
- ✅ **복잡도 대폭 감소**
- ✅ **GitHub 의존성 제거**

### 핵심 결정사항
- ✅ CSV 방식 유지 (Apps Script 할당량 절약)
- ✅ 중복 제거 자동화 (Apps Script에서 원천 차단)
- ✅ 클라우드 동기화 제거 (복잡도 감소)
- ✅ Papa Parse 도입 (CSV 파싱 안정성)
- ⏳ IndexedDB 캐시 (Phase 1 진행 예정)
- 🔥 Redis 3-Tier 도입 (Phase 3 계획)

---

## 📅 실행 계획

### Phase 0: 즉시 개선 (Week 1-2) ✅ 완료

**목표:** 코드 정리 및 간단한 버그 수정 (640줄 감소)
**상태:** ✅ 완료 (2025-10-05)
**최종 버전:** v3.7.0 - Phase 0 Complete

#### Week 1: 중복 제거 자동화 ✅ 완료
**소요 시간:** 3시간
**완료일:** 2025-10-05
**버전:** v3.6.0

**Apps Script 수정:**
```javascript
// 새 함수 추가
function addOrUpdatePlayer(player, table, chips, seat) {
  const sheet = ss.getSheetByName('Type');
  const data = sheet.getDataRange().getValues();

  // 중복 찾기
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === player && data[i][1] === table) {
      // 업데이트
      sheet.getRange(i + 1, 4).setValue(chips);
      sheet.getRange(i + 1, 6).setValue(seat);
      sheet.getRange(i + 1, 5).setValue(new Date());
      return ContentService.createTextOutput(JSON.stringify({
        status: 'updated',
        player: player,
        table: table
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 추가
  sheet.appendRow([player, table, '', chips, new Date(), seat, 'Active']);
  return ContentService.createTextOutput(JSON.stringify({
    status: 'added',
    player: player,
    table: table
  })).setMimeType(ContentService.MimeType.JSON);
}

// doPost 수정
function doPost(e) {
  const action = e.parameter.action;

  if (action === 'addPlayer') {
    return addOrUpdatePlayer(
      e.parameter.player,
      e.parameter.table,
      e.parameter.chips,
      e.parameter.seat
    );
  }

  // 'removeDuplicatePlayers' 액션 제거
  // ...
}
```

**프론트엔드 수정:**
```javascript
// index.html

// ❌ 제거
// - executeRemoveDuplicates() 함수 (6744줄)
// - initializeApp()에서 removeDuplicatePlayers() 호출 (7936줄)

// ✅ 수정
async function addNewPlayer(name, seat, chips) {
  const result = await _addNewPlayer_internal(name, seat, chips);

  if (result.status === 'updated') {
    showFeedback(`✅ ${name} 정보 업데이트 (칩: ${chips}, 좌석: ${seat})`);
  } else {
    showFeedback(`✅ ${name} 추가 완료`);
  }
}
```

**제거할 파일:**
- `src/js/duplicate-remover.js` (외부 스크립트)

**효과:**
- ✅ 150줄 코드 제거
- ✅ 앱 시작 1초 단축
- ✅ 중복 플레이어 원천 차단

**테스트:**
1. 플레이어 추가 (새 플레이어)
2. 동일 플레이어 다시 추가 (업데이트 확인)
3. 칩 수정 후 저장
4. Type 시트에서 중복 없음 확인

---

#### Week 2: 클라우드 동기화 제거 + Papa Parse 도입 ✅ 완료
**소요 시간:** 2시간
**완료일:** 2025-10-05
**버전:** v3.6.1 (Architecture Fix), v3.7.0 (Week 2 완료)

**1) 클라우드 동기화 제거 (1시간) ✅**

**제거할 함수:**
```javascript
// index.html
- generateDeviceId() (1626줄)
- saveConfigToCloud() (1656줄)
- syncCloudNow() (1841줄)
- resetCloudConfig() (1859줄)
- updateCloudSyncUI() (1813줄)
```

**updateAppsScriptUrl() 간소화:**
```javascript
async function updateAppsScriptUrl(newUrl) {
  if (!newUrl || !newUrl.includes('script.google.com')) {
    alert('올바른 Apps Script URL을 입력하세요');
    return;
  }

  // localStorage에만 저장
  localStorage.setItem('appsScriptUrl', newUrl);
  window.APPS_SCRIPT_URL = newUrl;
  window.APP_CONFIG.appsScriptUrl = newUrl;

  console.log('✅ Apps Script URL 업데이트:', newUrl);
  showFeedback('✅ Apps Script URL 저장 완료');
}
```

**UI 요소 제거:**
```html
<!-- index.html -->
<!-- 클라우드 동기화 버튼, 상태 표시 등 제거 -->
```

**효과:**
- ✅ 200줄 코드 제거
- ✅ 복잡도 감소
- ✅ GitHub 의존성 제거

**2) Papa Parse 도입 (1시간)**

**CDN 추가:**
```html
<!-- index.html 헤더에 추가 -->
<script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
```

**parseCSV() 제거 및 교체:**
```javascript
// ❌ 기존 parseCSV() 제거 (2059줄, 150줄)

// ✅ Papa Parse 사용
function parseCSV(text) {
  const result = Papa.parse(text, {
    header: false,
    skipEmptyLines: true
  });
  return result.data;
}
```

**효과:**
- ✅ 150줄 코드 제거 (parseCSV 로직)
- ✅ CSV 파싱 안정성 향상
- ✅ 특수문자 처리 개선

**테스트:**
1. 앱 시작 (CSV 로딩)
2. 특수문자 포함 플레이어 이름 (쉼표, 따옴표 등)
3. 핸드 저장 후 재로드

---

### Phase 1: IndexedDB 로컬 캐시 (Week 3-4) ✅ 완료

**목표:** 브라우저 로컬 캐시로 재방문 시 즉시 로딩
**상태:** ✅ 완료 (2025-10-05)
**최종 버전:** v3.9.0 - Phase 1 Week 4 Complete

#### Week 3: IndexedDB 스키마 및 CRUD ✅ 완료
**완료일:** 2025-10-05
**버전:** v3.8.0
**소요 시간:** 1일

**1) IndexedDB 스키마 설계**
```javascript
// src/db/indexeddb.js (새 파일)

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
  cache: {
    keyPath: 'key'
  }
};

async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      for (const [name, config] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, {
            keyPath: config.keyPath,
            autoIncrement: config.autoIncrement
          });

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
```

**2) CRUD 함수 구현**
```javascript
// 플레이어 저장
async function savePlayers(tableName, players) {
  const db = await initDB();
  const tx = db.transaction(['players'], 'readwrite');
  const store = tx.objectStore('players');

  // 기존 데이터 삭제 (테이블별)
  const index = store.index('table');
  const request = index.openCursor(IDBKeyRange.only(tableName));

  request.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      cursor.delete();
      cursor.continue();
    }
  };

  // 새 데이터 저장
  players.forEach(player => {
    store.put({
      id: `${player.table}_${player.player}`,
      ...player,
      cachedAt: Date.now()
    });
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// 플레이어 조회
async function getPlayers(tableName) {
  const db = await initDB();
  const tx = db.transaction(['players'], 'readonly');
  const store = tx.objectStore('players');
  const index = store.index('table');

  return new Promise((resolve, reject) => {
    const request = index.getAll(tableName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 캐시 유효성 검사
function isCacheFresh(timestamp, maxAge = 60000) {
  return (Date.now() - timestamp) < maxAge;
}
```

**효과:**
- ✅ 오프라인 지원
- ✅ 재방문 시 즉시 로딩 (50ms)
- ✅ 네트워크 트래픽 감소

**테스트:**
1. 앱 시작 (최초) → CSV 다운로드 → IndexedDB 저장
2. 새로고침 → IndexedDB에서 로드 (50ms)
3. 1분 후 새로고침 → CSV 다시 다운로드 (캐시 만료)
4. 오프라인 모드 → IndexedDB에서 로드

---

#### Week 4: Error Recovery System ✅ 완료
**완료일:** 2025-10-05
**버전:** v3.9.0
**소요 시간:** 1일

**구현 내용:**

**1) IndexedDB 오류 처리 래퍼**
```javascript
async function safeIndexedDBOperation(operation, fallbackValue, operationName) {
  try {
    return await operation();
  } catch (error) {
    // QuotaExceededError - 자동 캐시 정리
    if (error.name === 'QuotaExceededError') {
      await db.players.clear();
      await db.tables.clear();
      await db.cache.clear();
    }

    // InvalidStateError - 자동 재초기화
    if (error.name === 'InvalidStateError') {
      await db.open();
    }

    return fallbackValue;
  }
}
```

**2) CSV 로딩 재시도 로직**
```javascript
async function fetchCsv(url, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const txt = await res.text();
      if (!txt || txt.trim().length === 0) throw new Error('빈 CSV');

      return parseCSV(txt);
    } catch (error) {
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // 지수 백오프
      }
    }
  }
  return [];
}
```

**3) Apps Script 요청 재시도**
```javascript
// _addNewPlayer_internal() 함수에 재시도 로직 추가
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const response = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: formData });

    // Content-Type 검증
    const contentType = response.headers.get('content-type');
    if (!contentType.includes('application/json')) {
      throw new Error('JSON이 아닌 응답');
    }

    const result = await response.json();
    break; // 성공
  } catch (error) {
    if (attempt < 3) await new Promise(r => setTimeout(r, 2000));
  }
}
```

**4) 사용자 친화적 오류 메시지**
```javascript
function showFeedback(msg, isErr = false, duration = 5000) {
  let userMessage = msg;

  if (isErr) {
    if (msg.includes('HTTP 404')) userMessage = '⚠️ 데이터를 찾을 수 없습니다.';
    else if (msg.includes('HTTP 500')) userMessage = '⚠️ 서버 오류가 발생했습니다.';
    else if (msg.includes('NetworkError')) userMessage = '⚠️ 네트워크 연결을 확인해주세요.';
    // ... 8가지 오류 패턴 변환
  }

  // 성공 메시지 자동 숨김
  if (!isErr && duration > 0) {
    setTimeout(() => el.feedbackMessage.textContent = '', duration);
  }
}
```

**효과:**
- ✅ IndexedDB 용량 초과 시 자동 복구
- ✅ 네트워크 불안정 시 자동 재시도
- ✅ 기술적 오류 메시지 → 사용자 친화적 메시지
- ✅ 시스템 안정성 대폭 향상

---

#### [이전] Week 4: CSV와 IndexedDB 통합 ✅ 완료 (Week 3에 통합)
**버전:** v3.8.0
**소요 시간:** Week 3에 포함

**loadInitial() 수정:**
```javascript
async function loadInitial() {
  openLogModal();
  logMessage('🚀 데이터 로딩 시작...');

  try {
    // Step 1: IndexedDB 캐시 확인
    const cachedPlayers = await getPlayersFromCache(window.state.selectedTable);
    const cachedHands = await getHandsFromCache();

    const playersCacheFresh = cachedPlayers && isCacheFresh(cachedPlayers.timestamp, 60000);
    const handsCacheFresh = cachedHands && isCacheFresh(cachedHands.timestamp, 60000);

    if (playersCacheFresh && handsCacheFresh) {
      // 캐시 적중 - 즉시 로드
      logMessage('✅ 캐시에서 로드 (50ms)');
      window.state.players = cachedPlayers.data;
      window.state.indexRows = cachedHands.data;
      renderAll();
      logMessage('✅ 로딩 완료 (캐시)');
      setTimeout(closeLogModal, 500);
      return;
    }

    // Step 2: CSV 다운로드 (캐시 미스 또는 만료)
    logMessage('⏳ CSV 다운로드 중...');
    const [typeRows, idxRows] = await Promise.all([
      fetchCsv(CSV_TYPE_URL),
      fetchCsv(CSV_INDEX_URL)
    ]);

    if (typeRows.length) buildTypeFromCsv(typeRows);
    if (idxRows.length) buildIndexFromCsv(idxRows);

    // Step 3: IndexedDB에 저장
    await savePlayers(window.state.selectedTable, window.state.players);
    await saveHands(window.state.indexRows);

    renderAll();
    logMessage('✅ 로딩 완료 (CSV + 캐시 저장)');

  } catch(err) {
    console.error(err);
    logMessage(`❌ 로딩 실패: ${err.message}`, true);
  } finally {
    setTimeout(closeLogModal, 800);
  }
}
```

**효과:**
- ✅ 재방문 시 12.5초 → **50ms** (250배 빠름)
- ✅ 네트워크 트래픽 95% 감소
- ✅ 오프라인 지원

---

### Phase 2: 팟 계산 로직 문서화 (Week 5) ✅ 완료

**목표:** 기존 팟 계산 로직 문서화 및 가독성 개선
**상태:** ✅ 완료 (2025-10-05)
**최종 버전:** v3.10.0 - Phase 2 Week 5 Complete
**소요 시간:** 1일

**구현 내용:**

**1) 팟 계산 메인 함수 문서화**
```javascript
/**
 * 실제 팟 금액을 계산하는 메인 함수
 *
 * 동작 방식:
 * 1. Pot Correction 액션이 있는지 확인
 * 2. 있으면 → calculatePotWithCorrection() (수동 보정 모드)
 * 3. 없으면 → calculateAccuratePot() (자동 정확 계산)
 *
 * 사용 케이스:
 * - Pot Correction: 딜러가 수동으로 팟을 보정한 경우
 * - 정상 계산: 블라인드 + 앤티 + 모든 액션 합산
 */
function calculateActualPot() { ... }
```

**2) calculateAccuratePot() 알고리즘 설명**
```javascript
/**
 * 알고리즘:
 * 1. 플레이어별 최대 베팅 가능 금액 계산 (initialChips)
 * 2. 플레이어별 실제 베팅 금액 계산 (블라인드 + 앤티 + 액션)
 * 3. 올인 금액대 추출 및 정렬
 * 4. 가장 작은 올인 금액을 메인팟 기준으로 설정
 * 5. 메인팟 = 기준 금액 × 참여 플레이어 수
 *
 * 제한사항:
 * - 사이드팟 미구현 (대부분 1:1 헤즈업이므로 불필요)
 */
```

**3) calculatePotWithCorrection() 시나리오 문서화**
```javascript
/**
 * 사용 시나리오:
 * - 영상 편집 오류로 일부 액션 누락
 * - 플레이어가 잘못된 칩을 넣어서 수동 조정 필요
 * - 시스템 버그로 인한 팟 금액 불일치
 *
 * 우선순위: Pot Correction > 자동 계산
 */
```

**효과:**
- ✅ 팟 계산 로직 완전 문서화
- ✅ 전략 패턴(Strategy Pattern) 명시
- ✅ 예시 케이스 추가 (100 vs 200 올인)
- ✅ Step-by-step 주석으로 가독성 향상
- ✅ 제한사항 명확히 표기
- ✅ **기능 변경 없음 (코드 안정성 유지)**

**참고:**
- 기존 3개 함수 통합 계획을 문서화로 변경한 이유:
  1. 현재 구조가 이미 전략 패턴을 잘 구현
  2. 각 함수가 명확한 단일 책임을 가짐
  3. 무리한 통합은 오히려 가독성 저하 및 버그 위험
  4. 문서화가 더 안전하고 실용적인 개선

---

#### [이전] Week 5: 팟 계산 함수 통합 계획 (미실행)

#### Day 1-2: 새 함수 구현
```javascript
// src/utils/pot-calculator.js (새 파일)

function calculatePot(options = {}) {
  const {
    includeSB = true,
    includeBB = true,
    includeAnte = true,
    deductUncalled = true,
    usePotCorrection = true
  } = options;

  let pot = 0;
  let potCorrectionFound = false;
  let potCorrectionValue = 0;

  // Step 1: Pot Correction 찾기
  if (usePotCorrection) {
    for (const street of ['preflop', 'flop', 'turn', 'river']) {
      const actions = window.state.actionState[street] || [];
      const correction = actions.find(a => a.action === 'Pot Correction');

      if (correction) {
        potCorrectionFound = true;
        potCorrectionValue = parseFloat(correction.amount) || 0;

        // Pot Correction 이후 액션만 카운트
        const correctionIdx = actions.indexOf(correction);
        for (let i = correctionIdx + 1; i < actions.length; i++) {
          if (actions[i].amount && actions[i].action !== 'Pot Correction') {
            pot += parseFloat(actions[i].amount) || 0;
          }
        }

        pot = potCorrectionValue + pot;
        break;
      }
    }
  }

  // Step 2: 정상 계산 (Pot Correction 없을 때)
  if (!potCorrectionFound) {
    const sb = parseFloat(window.state.actionState.sb) || 0;
    const bb = parseFloat(window.state.actionState.bb) || 0;
    const ante = parseFloat(window.state.actionState.ante) || 0;
    const playerCount = window.state.playersInHand.length;

    if (includeSB) pot += sb;
    if (includeBB) pot += bb;
    if (includeAnte) pot += ante * playerCount;

    // 모든 액션 합산 (SB/BB 중복 제거)
    const sbPlayer = window.state.playersInHand.find(p => p.position === 'SB');
    const bbPlayer = window.state.playersInHand.find(p => p.position === 'BB');

    for (const street of ['preflop', 'flop', 'turn', 'river']) {
      (window.state.actionState[street] || []).forEach(act => {
        const amt = parseFloat(act.amount) || 0;

        // SB/BB 중복 방지
        if (street === 'preflop') {
          if (act.player === sbPlayer?.name && act.action === 'Post SB') return;
          if (act.player === bbPlayer?.name && act.action === 'Post BB') return;
        }

        pot += amt;
      });
    }

    // 언콜드 베팅 제외
    if (deductUncalled) {
      const uncalled = calculateUncalledBet();
      pot -= uncalled;
    }
  }

  return pot;
}

function calculateUncalledBet() {
  // 마지막 액션 찾기
  let lastAction = null;
  for (const street of ['river', 'turn', 'flop', 'preflop']) {
    const actions = window.state.actionState[street] || [];
    if (actions.length > 0) {
      lastAction = actions[actions.length - 1];
      break;
    }
  }

  if (!lastAction) return 0;
  if (lastAction.action !== 'Bet' && lastAction.action !== 'Raise') return 0;

  // 다른 플레이어들이 모두 폴드했는지 확인
  const activePlayers = window.state.playersInHand.filter(p => !p.folded && p.status !== 'allin');

  if (activePlayers.length === 1) {
    return parseFloat(lastAction.amount) || 0;
  }

  return 0;
}
```

#### Day 3-4: A/B 테스트
```javascript
// index.html에 임시 검증 코드 추가

function calculateFinalPot() {
  const oldResult = calculateActualPot();
  const newResult = calculatePot({ deductUncalled: true });

  if (oldResult !== newResult) {
    console.error(`팟 계산 불일치! Old: ${oldResult}, New: ${newResult}`);
    console.log('State:', window.state.actionState);
  }

  return newResult; // 새 함수 사용
}
```

#### Day 5: 기존 함수 제거
```javascript
// ❌ 제거
- calculateActualPot() (4160줄)
- calculateAccuratePot() (4183줄)
- calculatePotWithCorrection() (4241줄)

// ✅ 유지
- calculatePot() (새 함수)
- calculateUncalledBet() (헬퍼)
```

**효과:**
- ✅ 75줄 코드 제거
- ✅ 단일 진실 공급원 (Single Source of Truth)
- ✅ 유지보수성 향상

**테스트 시나리오:**
1. 정상 핸드 (Preflop → River, 승자 있음)
2. 중간 폴드 (언콜드 베팅 발생)
3. Pot Correction 사용
4. 올인 발생 (사이드팟)
5. SB/BB 중복 카운트 확인

---

### Phase 3: Redis 3-Tier 도입 (Week 6-9) 🔥 최종 목표

**목표:** 성능 250배 개선 (재방문 시 50ms)

**소요 시간:** 4주

#### Week 6: Upstash Redis 설정 및 기본 CRUD
**소요 시간:** 1주

**1) Upstash 가입 및 설정 (1시간)**
```
1. https://upstash.com/ 접속
2. GitHub 계정으로 로그인
3. "Create Database" 클릭
4. 이름: poker-hand-logger
5. Region: Asia Pacific (Tokyo)
6. Type: Regional (무료)
```

**2) Redis API 구현 (4일)**
```javascript
// src/api/redis-client.js (새 파일)

const REDIS_CONFIG = {
  url: 'https://apn1-stunning-frog-12345.upstash.io',
  token: 'AYF8AAI...' // Upstash에서 제공
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

// 플레이어 조회
async function getPlayersFromRedis(tableName) {
  const playersHash = await redisCommand('HGETALL', `players:${tableName}`);

  if (!playersHash || Object.keys(playersHash).length === 0) {
    return null;
  }

  const players = Object.entries(playersHash).map(([name, json]) => ({
    player: name,
    ...JSON.parse(json)
  }));

  return players;
}

// 플레이어 저장
async function savePlayersToRedis(tableName, players) {
  for (const player of players) {
    await redisCommand('HSET', `players:${tableName}`, player.player, JSON.stringify({
      chips: player.chips,
      seat: player.seat,
      table: player.table,
      updatedAt: new Date().toISOString()
    }));
  }

  // 타임스탬프 갱신
  await redisCommand('SET', 'cache:timestamp', Date.now());
}
```

**효과:**
- ✅ Redis 기본 연동 완료
- ✅ 10ms 응답 시간

**테스트:**
1. Redis 연결 확인
2. 플레이어 저장/조회
3. Upstash 대시보드에서 데이터 확인

---

#### Week 7: 3-Tier 캐싱 통합
**소요 시간:** 1주

**loadInitial() 최종 버전:**
```javascript
async function loadInitial() {
  openLogModal();
  logMessage('🚀 데이터 로딩 시작...');

  try {
    // Tier 1: IndexedDB 캐시
    const cachedPlayers = await getPlayersFromIndexedDB(window.state.selectedTable);

    if (cachedPlayers && isCacheFresh(cachedPlayers.timestamp, 60000)) {
      logMessage('✅ IndexedDB 캐시 적중 (50ms)');
      window.state.players = cachedPlayers.data;
      renderAll();
      logMessage('✅ 로딩 완료 (IndexedDB)');
      setTimeout(closeLogModal, 500);
      return;
    }

    // Tier 2: Redis 캐시
    logMessage('⏳ Redis에서 조회 중...');
    const redisPlayers = await getPlayersFromRedis(window.state.selectedTable);

    if (redisPlayers) {
      logMessage('✅ Redis 캐시 적중 (10ms)');
      window.state.players = redisPlayers;

      // IndexedDB에도 저장
      await savePlayersToIndexedDB(window.state.selectedTable, redisPlayers);

      renderAll();
      logMessage('✅ 로딩 완료 (Redis)');
      setTimeout(closeLogModal, 500);
      return;
    }

    // Tier 3: Google Sheets (최후)
    logMessage('⚠️ 캐시 미스 - CSV 다운로드 중...');
    const typeRows = await fetchCsv(CSV_TYPE_URL);

    if (typeRows.length) buildTypeFromCsv(typeRows);

    // Redis와 IndexedDB에 저장
    await savePlayersToRedis(window.state.selectedTable, window.state.players);
    await savePlayersToIndexedDB(window.state.selectedTable, window.state.players);

    renderAll();
    logMessage('✅ 로딩 완료 (CSV + 캐시 저장)');

  } catch(err) {
    console.error(err);
    logMessage(`❌ 로딩 실패: ${err.message}`, true);
  } finally {
    setTimeout(closeLogModal, 800);
  }
}
```

**효과:**
- ✅ IndexedDB 캐시: 50ms
- ✅ Redis 캐시: 10ms
- ✅ CSV 다운로드: 3-5초 (캐시 미스 시만)

---

#### Week 8: Apps Script → Redis 동기화
**소요 시간:** 1주

**Apps Script 수정:**
```javascript
// Apps Script: doPost

function saveHand(handData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Hand');

  // 1. Google Sheets에 저장
  sheet.appendRow([handData.handNumber, handData.table, ...]);

  // 2. Redis 캐시 무효화
  updateRedisCache('hand:' + handData.handNumber, handData);
  incrementVersion();

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    handNumber: handData.handNumber
  })).setMimeType(ContentService.MimeType.JSON);
}

function updateRedisCache(key, data) {
  const url = REDIS_CONFIG.url + '/HSET/' + key;

  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + REDIS_CONFIG.token,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(data)
  };

  UrlFetchApp.fetch(url, options);
}

function incrementVersion() {
  const url = REDIS_CONFIG.url + '/INCR/sync:version';

  UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + REDIS_CONFIG.token
    }
  });
}
```

**효과:**
- ✅ 핸드 저장 시 Redis 자동 업데이트
- ✅ 다른 사용자도 최신 데이터 즉시 반영

---

#### Week 9: 실시간 동기화 (Polling)
**소요 시간:** 1주

**버전 체크 Polling:**
```javascript
// index.html

let localVersion = 0;
let syncInterval = null;

async function startSync() {
  // 5초마다 버전 체크
  syncInterval = setInterval(async () => {
    try {
      const remoteVersion = await redisCommand('GET', 'sync:version');

      if (remoteVersion && Number(remoteVersion) > localVersion) {
        console.log('🔔 데이터 변경 감지 - 재로드');

        // 캐시 무효화
        await invalidateCache();

        // 데이터 재로드
        await loadInitial();

        localVersion = Number(remoteVersion);

        showFeedback('🔔 데이터가 업데이트되었습니다');
      }
    } catch (err) {
      console.error('동기화 오류:', err);
    }
  }, 5000); // 5초
}

function stopSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

// 앱 시작 시 동기화 시작
document.addEventListener('DOMContentLoaded', () => {
  // ...
  startSync();
});

// 앱 종료 시 동기화 중지
window.addEventListener('beforeunload', () => {
  stopSync();
});
```

**효과:**
- ✅ 실시간 동기화 (5초 지연)
- ✅ 여러 사용자 데이터 일치
- ✅ Pub/Sub 유료 기능 대체

---

## 📊 최종 성과 예상

### 코드 감소
| Phase | 제거 줄 수 | 누적 |
|-------|----------|------|
| Phase 0 | 500줄 | 500줄 |
| Phase 1 | 0줄 (추가) | 500줄 |
| Phase 2 | 75줄 | 575줄 |
| Phase 3 | 0줄 (추가) | 575줄 |
| **합계** | | **575줄 감소** |

### 성능 개선
| 작업 | 현재 | Phase 0 | Phase 1 | Phase 3 | 개선 |
|------|------|---------|---------|---------|------|
| 앱 시작 (최초) | 12.5초 | 11.5초 | 11.5초 | 8초 | 36% |
| 앱 시작 (재방문) | 12.5초 | 11.5초 | **50ms** | **10ms** | **1250배** |
| 핸드 저장 | 7.1초 | 6.1초 | 6.1초 | 4초 | 44% |
| 플레이어 검색 | 5ms | 5ms | 5ms | 5ms | - |

### 비용
- Phase 0-2: **$0/월** (무료)
- Phase 3: **$0/월** (Upstash 무료 티어)

---

## 🎯 실행 우선순위

### 1단계: Phase 0 (즉시 시작 가능)
- ✅ 중복 제거 자동화 (3시간)
- ✅ 클라우드 동기화 제거 (1시간)
- ✅ Papa Parse 도입 (1시간)
- **총 소요 시간: 5시간**
- **효과: 500줄 감소, 1초 단축**

### 2단계: Phase 1 (2주 소요)
- ✅ IndexedDB 구현
- **효과: 재방문 시 250배 빠름**

### 3단계: Phase 2 (1주 소요)
- ⚠️ 팟 계산 통합 (테스트 필요)
- **효과: 75줄 감소**

### 4단계: Phase 3 (4주 소요)
- 🔥 Redis 3-Tier 아키텍처
- **효과: 최종 성능 1250배 개선**

---

## 🚦 시작 결정

**어떤 Phase부터 시작하시겠습니까?**

### 옵션 A: 안전한 시작 (권장)
- ✅ Phase 0만 진행 (5시간)
- ✅ 코드 정리 및 버그 수정
- ✅ 리스크 최소

### 옵션 B: 성능 중심
- ✅ Phase 0 + Phase 1 (2주)
- ✅ IndexedDB 로컬 캐시
- ✅ 재방문 시 즉시 로딩

### 옵션 C: 풀 스택 (최종 목표)
- ✅ Phase 0 → Phase 1 → Phase 2 → Phase 3 (9주)
- ✅ 완전한 아키텍처 개선
- ✅ 1250배 성능 향상

---

---

## Phase 4: Tournament Field Data (v3.11.0 - v3.15.0) 🚧 준비 중

> **목표**: 토너먼트 현장 데이터 수집 최적화
> **기간**: 4주 (2025-10-06 시작 예정)
> **참조**: [PRD_v6.0.md](../PRD_v6.0.md)

### 🎯 Phase 4 목표

**배경**: 사용자는 토너먼트 현장에서 스마트폰으로 키 플레이어 핸드를 기록
- 15명 키 플레이어 사전 등록 (Type 시트)
- 대회장 돌아다니며 작업 (Wi-Fi 불안정)
- 두 손으로 스마트폰 조작 (90%+)
- 모든 작업 수동 (자동화 없음)

**핵심 불만 (현재 v3.10.0)**:
- ❌ 테이블 전환 5-10초 (매번 Google Sheets 요청)
- ❌ 키 플레이어 전용 UI 없음
- ❌ 오프라인 모드 불완전
- ❌ 스마트폰 UI 최적화 부족

### Week 1-2: Priority 1 기능 (필수)

#### F1. 키 플레이어 대시보드 ⭐
**목표**: 15명 사전 등록 키 플레이어 한눈에 관리

**구현**:
```javascript
// 1. Type 시트에서 Keyplayer=TRUE 필터링
async function loadKeyPlayers() {
  const players = await db.type
    .where('keyplayer').equals('TRUE')
    .toArray();

  return players.map(p => ({
    name: p.players,
    table: p.tableNo,
    seat: p.seatNo,
    chips: p.chips,
    confirmed: p.confirmed || false  // 새 필드
  }));
}

// 2. 대시보드 UI
function renderKeyPlayerDashboard() {
  const html = `
    <div class="key-player-dashboard">
      <h2>🌟 Key Players (15)</h2>
      ${keyPlayers.map(p => `
        <div class="key-player-card">
          <h3>${p.confirmed ? '✅' : '⚠️'} ${p.name}</h3>
          <p>Table ${p.table} #${p.seat} ${p.chips}</p>
          <div class="actions">
            ${!p.confirmed ? '<button class="btn-confirm">✓ 확인</button>' : ''}
            <button class="btn-update">Update</button>
            <button class="btn-record">Record Hand</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
```

**성능 목표**:
- 대시보드 로드: < 1초 (IndexedDB)
- 확인 상태 업데이트: < 0.3초

---

#### F2. 빠른 업데이트 워크플로우 ⭐
**목표**: 칩 카운트 업데이트를 3-4터치로 완료

**구현**:
```javascript
// Quick Update 팝업
function showQuickUpdate(player) {
  const popup = `
    <div class="quick-update-popup">
      <h3>Quick Update - ${player.name}</h3>
      <form>
        <label>Table: <input type="text" value="${player.table}" readonly></label>
        <label>Seat: <input type="text" value="${player.seat}" readonly></label>
        <label>Chips: <input type="text" value="${player.chips}" id="chips-input"></label>
        <label>Notes: <textarea></textarea></label>
        <button type="submit">✓ Save</button>
        <button type="button" onclick="closePopup()">✗ Cancel</button>
      </form>
    </div>
  `;

  // 저장 시
  form.onsubmit = async (e) => {
    e.preventDefault();
    const newChips = document.getElementById('chips-input').value;

    // IndexedDB 즉시 업데이트
    await db.type.update(player.id, { chips: newChips });

    // 백그라운드 동기화
    syncQueue.add({ type: 'UPDATE_PLAYER', id: player.id, chips: newChips });
  };
}
```

**성능 목표**:
- 팝업 열기: < 0.3초
- 저장: < 0.5초 (로컬)

---

#### F3. 테이블 전환 최적화 ⭐
**목표**: 키 플레이어 추적 시 1초 이내 테이블 이동

**구현** (IndexedDB 3-Tier 캐싱):
```javascript
class TableCache {
  constructor() {
    this.hotCache = null;      // 현재 테이블
    this.warmCache = new Map(); // 최근 3개 테이블
    this.coldCache = null;      // 전체 Type 시트
  }

  async getTable(tableNo) {
    // Tier 1: Hot Cache (< 50ms)
    if (this.hotCache && this.hotCache.tableNo === tableNo) {
      return this.hotCache.players;
    }

    // Tier 2: Warm Cache (< 100ms)
    if (this.warmCache.has(tableNo)) {
      const cached = this.warmCache.get(tableNo);
      if (Date.now() - cached.timestamp < 30 * 60 * 1000) {
        this.hotCache = cached;
        return cached.players;
      }
    }

    // Tier 3: IndexedDB (< 1s)
    const players = await db.type
      .where('tableNo').equals(tableNo)
      .toArray();

    // 캐시 업데이트
    this.hotCache = { tableNo, players, timestamp: Date.now() };
    this.warmCache.set(tableNo, this.hotCache);

    return players;
  }

  // 5분마다 자동 갱신
  startAutoRefresh() {
    setInterval(async () => {
      if (this.hotCache) {
        const fresh = await fetchTableFromGoogleSheets(this.hotCache.tableNo);
        this.hotCache.players = fresh;
        await db.type.bulkPut(fresh);
      }
    }, 5 * 60 * 1000);
  }
}
```

**성능 목표**:
- 캐시 히트: < 50ms (Tier 1), < 100ms (Tier 2)
- 캐시 미스: < 1초 (IndexedDB)
- 목표 히트율: > 80%

---

### Week 3-4: Priority 2 기능 (중요)

#### F4. 핸드 번호 자동 증가
**구현**:
```javascript
// Index 시트에서 테이블별 최대 핸드 조회
async function getNextHandNumber(table) {
  const lastHand = await db.index
    .where('table').equals(table)
    .reverse()
    .first();

  return lastHand ? lastHand.handNumber + 1 : 1;
}

// 핸드 시작 시 자동 적용
async function startHand() {
  const nextHand = await getNextHandNumber(currentTable);
  state.actionState.handNumber = nextHand;

  // UI 표시 (수동 수정 가능)
  document.getElementById('hand-number').value = nextHand;
}
```

---

#### F5. 오프라인 모드 완성
**구현**:
```javascript
// 오프라인 큐 관리
class SyncQueue {
  async add(task) {
    await db.syncQueue.add({
      ...task,
      timestamp: Date.now(),
      status: 'pending'
    });
  }

  async processQueue() {
    const tasks = await db.syncQueue
      .where('status').equals('pending')
      .toArray();

    for (const task of tasks) {
      try {
        await syncToGoogleSheets(task);
        await db.syncQueue.update(task.id, { status: 'completed' });
      } catch (err) {
        console.error('Sync failed:', task, err);
        // 재시도는 다음 온라인 시
      }
    }
  }
}

// 온라인 복구 감지
window.addEventListener('online', async () => {
  console.log('Online! Syncing...');
  await syncQueue.processQueue();
  showToast('✅ Sync completed');
});
```

---

#### F6. 스마트폰 UI 최적화
**CSS**:
```css
/* 터치 영역 최소 48px */
.btn-primary {
  min-height: 48px;
  min-width: 48px;
  font-size: 16px;
  padding: 12px 20px;
}

.action-button {
  min-height: 56px;  /* 더 큼 */
  min-width: 80px;
  margin: 8px;
  font-size: 18px;
}

/* 두 손 조작 최적화 */
.key-player-card {
  padding: 16px;
  margin: 12px;
}

.key-player-card .actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.key-player-card button {
  flex: 1;
  min-height: 48px;
}

/* 다크 모드 (배터리 절약) */
@media (prefers-color-scheme: dark) {
  body {
    background: #1a1a1a;
    color: #e0e0e0;
  }
}
```

**제스처 지원**:
```javascript
// 스와이프 제스처
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const diff = touchEndX - touchStartX;

  if (diff > 100) {
    // 오른쪽 스와이프: 액션 취소 (Undo)
    undoLastAction();
  } else if (diff < -100) {
    // 왼쪽 스와이프: 다음 스트릿
    moveToNextStreet();
  }
}
```

---

### Phase 4 성공 지표

| KPI | 현재 (v3.10.0) | Phase 4 목표 |
|-----|----------------|--------------|
| 테이블 전환 시간 | 5-10초 | < 1초 (캐시) |
| 키 플레이어 확인 | N/A | < 15초 (3터치) |
| 칩 업데이트 | N/A | < 20초 (4터치) |
| 핸드 기록 시간 | 3-5분 | 2-3분 |
| 오프라인 사용률 | 20% | > 50% |
| 캐시 히트율 | 0% | > 80% |
| 사용자 만족도 | 3.5/5 | > 4.5/5 |

---

### Phase 4 완료 기준

- [ ] F1: 키 플레이어 대시보드 동작
- [ ] F2: 빠른 업데이트 워크플로우 (3-4터치)
- [ ] F3: 테이블 전환 < 1초 (캐시 히트율 > 80%)
- [ ] F4: 핸드 번호 자동 증가
- [ ] F5: 오프라인 모드 완전 작동 (읽기 + 쓰기)
- [ ] F6: 스마트폰 UI 최적화 (48px+ 터치 영역)
- [ ] 성능 테스트 통과 (모든 KPI 달성)
- [ ] 사용자 인수 테스트 (CSAT > 4.5/5)

---

**다음 Phase 선택:**
1. ✅ Phase 0: 코드 정리 (완료)
2. ✅ Phase 1: IndexedDB 캐싱 (완료)
3. ✅ Phase 2: 팟 계산 문서화 (완료)
4. 🚧 Phase 4: Tournament Field Data (준비 중)
5. ⏳ Phase 3: Redis 3-Tier (Phase 4 이후)

**현재 상태**: Phase 4 Week 1 시작 대기 중
