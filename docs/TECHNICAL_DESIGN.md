# 🏗️ Virtual Data - 기술 상세 설계서 (LLD)
> Low Level Design Document v3.5.32
> 최종 업데이트: 2025-10-04

---

## 📌 문서 개요

### 목적
본 문서는 Virtual Data 포커 핸드 로거의 기술적 설계를 상세히 기술하고, 개발자가 시스템을 이해하고 확장할 수 있도록 합니다.

### 범위
- 시스템 아키텍처
- 데이터 모델 및 스키마
- 주요 컴포넌트 설계
- 알고리즘 및 플로우
- 성능 최적화 전략

---

## 🏛️ 시스템 아키텍처

### 전체 구조도

```
┌─────────────────────────────────────────────────────────┐
│                    클라이언트 레이어                        │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐    │
│  │  index.html │  │ src/js/ (14) │  │ src/utils/  │    │
│  │  (7,995줄)  │  │   모듈       │  │  (3개)      │    │
│  └─────────────┘  └──────────────┘  └─────────────┘    │
│                                                           │
│  주요 모듈:                                               │
│  - ActionOrderManagerV2  : 액션 순서 관리               │
│  - DuplicateRemover      : 중복 플레이어 제거            │
│  - EventManager          : 이벤트 리스너 관리            │
│  - UnifiedEventHandler   : 모바일 터치 최적화            │
│  - PerformanceMonitor    : 성능 모니터링                │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ HTTPS / REST API
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  API 보호 레이어 (Phase 4)                │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  phase4-functions.js (51KB)                       │   │
│  │  - ensureAppsScriptUrl()   : URL 검증            │   │
│  │  - protectedApiCall()      : 재시도 + 타임아웃   │   │
│  │  - ApiCallManager          : 호출 상태 관리      │   │
│  │  - getUserFriendlyError()  : 에러 메시지 변환    │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ Google Apps Script API
                        ▼
┌─────────────────────────────────────────────────────────┐
│                백엔드 레이어 (Apps Script)                 │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Code_v71.0.3.gs (1,159줄)                        │   │
│  │                                                    │   │
│  │  핵심 클래스:                                       │   │
│  │  - PlayerIndex    : Map 기반 고속 검색           │   │
│  │  - 캐시 시스템     : 5분 TTL                      │   │
│  │                                                    │   │
│  │  주요 함수:                                         │   │
│  │  - doGet/doPost           : API 엔드포인트       │   │
│  │  - processAction()        : 액션 라우팅          │   │
│  │  - handleBatchUpdate()    : 일괄 업데이트        │   │
│  │  - createPlayer()         : 플레이어 생성        │   │
│  │  - smartUpdatePlayer()    : 지능형 업데이트      │   │
│  │  - removeDuplicates()     : 중복 제거            │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ Google Sheets API
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  데이터 레이어 (Google Sheets)             │
│                                                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │  Type   │  │  Index  │  │  Hand   │  │  Config │    │
│  │  시트   │  │  시트   │  │  시트   │  │  시트   │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │
│                                                           │
│  플레이어 정보   핸드 메타     상세 액션    설정 저장      │
└─────────────────────────────────────────────────────────┘
```

### 데이터 플로우

```
[사용자 액션]
    ↓
[프론트엔드 검증]
    ↓
[Phase 4 보호 레이어]
    ├─ URL 검증
    ├─ 재시도 로직 (최대 3회)
    ├─ 타임아웃 (30초)
    └─ 에러 변환
    ↓
[Apps Script API]
    ├─ PlayerIndex 검색
    ├─ 데이터 검증
    ├─ 비즈니스 로직
    └─ 시트 업데이트
    ↓
[Google Sheets]
    └─ 영구 저장
```

---

## 🗄️ 데이터 모델

### Type 시트 스키마 (플레이어 정보)

| 컬럼 | 타입 | 설명 | 예시 | 제약조건 |
|-----|------|------|------|---------|
| A: Poker Room | String | 포커룸 이름 | "Merit Hall" | 필수 |
| B: Table Name | String | 테이블 이름 | "Ocean Blue" | 필수 |
| C: Table No | String | 테이블 번호 | "1", "2A" | 필수, 인덱스 키 |
| D: Seat No | String | 좌석 번호 | "#1", "#10" | 선택, 인덱스 키 |
| E: Players | String | 플레이어 이름 | "JohnDoe" | 필수, 1-50자 |
| F: Nationality | String | 국가 코드 | "KR", "US" | 선택, 2자 |
| G: Chips | Number | 칩 수량 | 100000 | 필수, >= 0 |
| H: Keyplayer | Boolean | 주목 플레이어 | "TRUE", "" | 선택 |

**인덱스 전략**:
- Primary Key: `tableNo_seatNo` (좌석이 있는 경우)
- Secondary Index: `tableNo_playerName` (중복 검사용)
- PlayerIndex 클래스로 Map 기반 O(1) 검색

### Index 시트 스키마 (핸드 메타데이터)

| 컬럼 | 필드 | 설명 |
|-----|------|------|
| A | handNumber | 핸드 번호 (자동 증가) |
| B | startRow | Hand 시트 시작 행 번호 |
| C | endRow | Hand 시트 종료 행 번호 |
| D | handUpdatedAt | 핸드 업데이트 시간 |
| E-F | handEdit | 편집 정보 |
| G | label | 게임 라벨 |
| H | table | 테이블 이름 |
| I | tableUpdatedAt | 테이블 업데이트 시간 |
| J-N | Camera | 카메라 정보 |
| O-Q | Street/Action | 마지막 스트리트/액션 |
| R | winners | 승자 정보 (JSON) |

### Hand 시트 스키마 (상세 액션 기록)

| 컬럼 | 필드 | 타입 | 설명 |
|-----|------|------|------|
| A | 행번호 | Number | 순번 |
| B | 타입 | String | HAND/PLAYER/EVENT |
| C | 데이터 | String | 플레이어명/액션 |
| D | 좌석 | String | 좌석 번호 |
| E | 0 | Number | 고정값 |
| F | 시작칩 | Number | 액션 시작 시 칩 |
| G | 종료칩 | Number | 액션 종료 시 칩 |
| H | 카드 | String | 핸드 카드 (JSON) |
| I | 포지션 | String | BTN/SB/BB/UTG... |

---

## 🔧 핵심 컴포넌트 설계

### 1. ActionOrderManagerV2 (절대 순서 시스템)

**목적**: 포커 규칙에 따른 액션 순서 자동 관리

**핵심 알고리즘**:
```javascript
class ActionOrderManagerV2 {
  // 핸드별 고정 순서 생성
  initializeHandOrder(players, btnSeat, sbSeat, bbSeat) {
    // 1. 포지션 계산
    const positions = this.calculatePositions(players.length, btnSeat);

    // 2. 절대 순서 할당
    this.absoluteOrder = players.map((player, idx) => ({
      rank: this.getPositionRank(positions[idx], street),
      player: player,
      position: positions[idx]
    })).sort((a, b) => a.rank - b.rank);

    // 3. 폴드/올인 시에도 순서 유지
    this.activeOrder = this.absoluteOrder.filter(p => p.active);
  }

  // 포지션별 순서 (프리플랍)
  getPositionRank(position, street) {
    if (street === 'preflop') {
      return PREFLOP_ORDER[position]; // UTG=1, MP=2, CO=3, BTN=4, SB=5, BB=6
    } else {
      return POSTFLOP_ORDER[position]; // SB=1, BB=2, UTG=3, ..., BTN=6
    }
  }
}
```

**복잡도**:
- 초기화: O(n log n) - 정렬
- 다음 플레이어 조회: O(1) - 배열 인덱스
- 메모리: O(n) - 플레이어 수에 비례

### 2. PlayerIndex (고속 검색 시스템)

**목적**: Type 시트 데이터를 메모리에 캐싱하여 빠른 검색

**데이터 구조**:
```javascript
class PlayerIndex {
  constructor() {
    this.indexByKey = new Map();      // tableNo_seatNo → rowIndex
    this.indexByName = new Map();     // name → [rowIndices]
    this.indexByTable = new Map();    // tableNo → [rowIndices]
    this.cacheExpiry = 300000;        // 5분 TTL
  }

  // O(n) 빌드, n = 플레이어 수
  build(data) {
    for (let i = 1; i < data.length; i++) {
      const key = `${tableNo}_${seatNo}`;
      this.indexByKey.set(key, i);

      if (!this.indexByName.has(name)) {
        this.indexByName.set(name, []);
      }
      this.indexByName.get(name).push(i);

      // ... indexByTable도 동일
    }
  }

  // O(1) 검색
  findByKey(tableNo, seatNo) {
    return this.indexByKey.get(`${tableNo}_${seatNo}`);
  }
}
```

**성능**:
- 빌드: O(n) - 전체 데이터 스캔 1회
- 검색: O(1) - Map 해시 테이블
- 메모리: O(3n) - 3개 인덱스

### 3. Phase 4 API 보호 시스템

**목적**: 네트워크 오류 및 서버 장애에 대한 견고한 처리

**재시도 메커니즘**:
```javascript
async function protectedApiCall(apiFunction, options = {}) {
  const maxRetries = 3;
  const baseDelay = 1000; // 1초

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // URL 검증
      const validationResult = ensureAppsScriptUrl();
      if (!validationResult.isValid) {
        throw new Error(validationResult.error);
      }

      // API 호출 (30초 타임아웃)
      const result = await Promise.race([
        apiFunction(),
        timeout(30000)
      ]);

      return { success: true, data: result };

    } catch (error) {
      // 마지막 시도 실패 시
      if (attempt === maxRetries - 1) {
        return {
          success: false,
          error: getUserFriendlyErrorMessage(error)
        };
      }

      // 지수 백오프 대기
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
}
```

**복잡도**:
- 최선: O(1) - 1번에 성공
- 최악: O(3 × T) - 3번 재시도, T = API 응답시간

### 4. DuplicateRemover (중복 제거)

**목적**: 테이블_플레이어 조합 기준 중복 데이터 제거

**알고리즘**:
```javascript
function removeDuplicatePlayers() {
  const seen = new Map();
  const toDelete = [];

  // 역순 순회 (최신 데이터 우선 유지)
  for (let i = data.length - 1; i >= 1; i--) {
    const key = `${tableNo}_${playerName}`;

    if (seen.has(key)) {
      toDelete.push(i + 1); // 중복 삭제 대상
    } else {
      seen.set(key, true);
    }
  }

  // 역순 삭제 (행 번호 변경 방지)
  toDelete.sort((a, b) => b - a);
  toDelete.forEach(row => sheet.deleteRow(row));
}
```

**복잡도**:
- 시간: O(n) - 단일 패스
- 공간: O(u) - u = 고유 플레이어 수

---

## ⚡ 성능 최적화 전략

### 1. 캐싱 전략

**클라이언트 사이드**:
```javascript
// 1. 메모리 캐시 (sessionStorage)
window.state = {
  playerDataByTable: {},  // 테이블별 플레이어
  indexRows: [],          // 핸드 인덱스
  currentHand: {}         // 현재 핸드
};

// 2. 영구 캐시 (localStorage)
localStorage.setItem('vd_config', JSON.stringify(config));

// 3. 오프라인 캐시 (IndexedDB)
await db.hands.put({ id: handId, data: handData });
```

**서버 사이드**:
```javascript
// PlayerIndex 캐시 (5분 TTL)
if (playerIndex.needsRebuild()) {
  playerIndex.build(data);
}
```

### 2. 배치 처리

**문제**: 개별 API 호출 시 오버헤드
**해결**: 배치 업데이트

```javascript
// ❌ 나쁜 예: 10번 API 호출
for (const player of players) {
  await addPlayer(player);
}

// ✅ 좋은 예: 1번 API 호출
await batchUpdatePlayers({ players, deleted });
```

**성능 개선**: 10배 속도 향상 (1초 → 0.1초)

### 3. 가상 스크롤

**문제**: 1000개+ 아이템 렌더링 시 성능 저하
**해결**: 화면에 보이는 것만 렌더링

```javascript
class VirtualScroll {
  render() {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = visibleStart + viewportItems;

    // 보이는 영역만 DOM 생성
    const fragment = document.createDocumentFragment();
    for (let i = visibleStart; i < visibleEnd; i++) {
      fragment.appendChild(createItem(data[i]));
    }

    container.innerHTML = '';
    container.appendChild(fragment);
  }
}
```

**성능 개선**: 메모리 사용량 99% 감소

### 4. 이벤트 관리

**문제**: 이벤트 리스너 중복 등록으로 메모리 누수
**해결**: EventManager 중앙 관리

```javascript
class EventManager {
  add(element, event, handler, id) {
    // 중복 방지
    if (this.listeners.has(id)) {
      this.remove(id);
    }

    element.addEventListener(event, handler);
    this.listeners.set(id, { element, event, handler });
  }

  // 5분마다 자동 정리
  autoCleanup() {
    setInterval(() => {
      this.cleanupOldListeners();
    }, 300000);
  }
}
```

---

## 🔐 보안 설계

### 1. 민감 정보 보호

**현재 (취약)**:
```javascript
// ❌ 하드코딩된 Spreadsheet ID
const SPREADSHEET_ID = '1gZN9S2rP5_U9zdxX1cJHBzBAl-Nup4PD4QXuW44rnSE';
```

**개선안**:
```javascript
// ✅ Script Properties 사용
const SPREADSHEET_ID = PropertiesService
  .getScriptProperties()
  .getProperty('SPREADSHEET_ID');
```

### 2. 입력 검증

```javascript
function validatePlayerData(data) {
  const errors = [];

  // 길이 검증
  if (!data.name || data.name.length > 50) {
    errors.push('이름은 1-50자여야 합니다');
  }

  // 범위 검증
  if (data.chips < 0 || data.chips > 999999999) {
    errors.push('칩은 0-999,999,999 범위여야 합니다');
  }

  // XSS 방지
  const dangerousPattern = /<script|javascript:|onerror=/i;
  if (dangerousPattern.test(data.name)) {
    errors.push('허용되지 않는 문자가 포함되어 있습니다');
  }

  return { isValid: errors.length === 0, errors };
}
```

### 3. API 인증 (향후 계획)

```javascript
// OAuth 2.0 플로우
async function authenticateUser() {
  const auth = await google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    callback: (response) => {
      localStorage.setItem('access_token', response.access_token);
    }
  });

  auth.requestAccessToken();
}
```

---

## 📈 모니터링 및 로깅

### 로깅 시스템

```javascript
const Logger = {
  levels: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
  currentLevel: 2,

  log(level, message, data = {}) {
    if (this.levels[level] <= this.currentLevel) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: level,
        message: message,
        data: data,
        version: VERSION_INFO.version
      };

      console.log(JSON.stringify(logEntry));

      // 에러는 시트에 기록
      if (level === 'ERROR') {
        this.persistLog(logEntry);
      }
    }
  }
};
```

### 성능 메트릭

```javascript
class PerformanceMonitor {
  static measure(operation, fn) {
    const start = Date.now();

    try {
      const result = fn();
      const duration = Date.now() - start;

      Logger.info(`Performance: ${operation}`, {
        durationMs: duration
      });

      return result;
    } catch (error) {
      Logger.error(`Error in ${operation}`, {
        error: error.message
      });
      throw error;
    }
  }
}
```

---

## 🧪 테스트 전략

### 단위 테스트 (향후 계획)

```javascript
// PlayerIndex 테스트
describe('PlayerIndex', () => {
  it('should find player by key in O(1)', () => {
    const index = new PlayerIndex();
    index.build(mockData);

    const result = index.findByKey('1', '#5');
    expect(result).toBe(5); // rowIndex
  });
});
```

### 통합 테스트

```javascript
// API 통합 테스트
describe('Batch Update', () => {
  it('should handle 100 players in < 5 seconds', async () => {
    const players = generateMockPlayers(100);
    const start = Date.now();

    await batchUpdatePlayers({ players });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);
  });
});
```

---

## 🔄 배포 전략

### 버전 관리

```javascript
const APP_VERSION = '3.5.32';

// 버전 호환성 체크
function checkVersionCompatibility() {
  const serverVersion = await getServerVersion();

  if (compareVersions(APP_VERSION, serverVersion) < 0) {
    showUpdateNotification('새 버전이 있습니다. 새로고침하세요.');
  }
}
```

### 롤백 플랜

1. **백업 자동화**: `backups/YYYYMMDD/` 폴더에 매일 백업
2. **Git 태그**: 각 버전마다 태그 생성 (`v3.5.32`)
3. **빠른 복구**: `git checkout v3.5.31` → 재배포

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|-----|------|----------|--------|
| 2025-10-04 | 3.5.32 | 21개 문서 통합, LLD 최초 작성 | Claude |
| 2025-09-24 | 3.5.0 | Phase 5 완료 반영 | - |
| 2025-09-23 | 3.4.25 | Phase 4 아키텍처 추가 | - |

---

**다음 업데이트 예정일**: 아키텍처 변경 시 즉시 업데이트
