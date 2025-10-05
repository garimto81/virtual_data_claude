# Phase 7: 안전한 모듈화 실행 계획

## 🚨 핵심 원칙: "의존성 파괴 방지"

이전 모듈화 실패 원인:
- 함수/변수의 **실행 순서(causality)**를 무시하고 분리
- `window` 객체 전역 변수 의존성 파악 실패
- DOMContentLoaded 이벤트 타이밍 문제
- 암묵적 의존성(implicit dependencies) 미파악

## 핵심 의존성 맵

### 1단계: 초기화 순서 (절대 변경 불가)

```
DOMContentLoaded 이벤트
  ↓
1. updateAllVersionDisplays()          // 버전 표시
  ↓
2. APPS_SCRIPT_URL 로드               // localStorage 읽기
  ↓
3. initializeGoogleSheetsAPI()        // Config 시트에서 URL 로드
  ↓
4. window.state 객체 생성             // 전역 상태 초기화 (1903줄)
  ↓
5. setupEventListeners()              // 이벤트 리스너 등록
  ↓
6. initializeApp()                    // 메인 초기화
     ↓
     6-1. executeWithLock()           // 동시 실행 방지
     6-2. loadInitial()               // 데이터 로드 (CSV 다운로드)
     6-3. renderTableSelection()      // UI 렌더링
     6-4. initializeSeatGrid()        // 좌석 그리드
     6-5. removeDuplicatePlayers()    // 중복 제거
```

### 2단계: window 전역 객체 의존성 (21개)

**절대 제거 불가능한 전역 변수들:**
```javascript
1.  window.APP_CONFIG                  // 809줄 - 앱 설정
2.  window.APPS_SCRIPT_URL            // 1541줄 - API URL
3.  window.state                      // 1903줄 - 전역 상태
4.  window.loadInitial                // 909줄 - 데이터 로드 함수
5.  window.openLogModal               // 2028줄 - 로그 모달
6.  window.closeLogModal              // 2029줄
7.  window.logMessage                 // 2030줄
8.  window.isTableManagementMode      // 2188, 5820줄 - 테이블 관리 모드
9.  window.addAutoAction              // 3935줄 - 자동 액션
10. window.handleSmartCall           // 3936줄
11. window.handleAllIn               // 3937줄
12. window.openQuickBetRaise         // 3938줄
13. window.showFeedback              // 5666줄 - UI 피드백
14. window.openCardSelector          // 5667줄 - 카드 선택기
15. window.managementState           // 6785줄 - 관리 상태
16. window.deleteLocalPlayer         // 7075줄 - 플레이어 삭제
17. window.getUserFriendlyErrorMessage // 7598줄 - 에러 메시지
18. window.removeDuplicatePlayers    // 7936줄 - 중복 제거
19. window.loadAllData               // 6760줄 체크
```

**왜 전역이어야 하는가?**
- HTML `onclick` 속성에서 직접 호출
- 외부 스크립트(`duplicate-remover.js`, `google-sheets-api.js`)에서 접근
- 동적 이벤트 리스너에서 런타임 참조

---

## 안전한 리팩토링 전략: "Facade Pattern"

### 기본 원칙
1. **기존 코드는 그대로 유지** (index.html 백업)
2. **새 모듈은 기존 함수를 감싸기만 함 (Wrapper)**
3. **window 객체 인터페이스는 절대 변경 금지**
4. **점진적 마이그레이션 (한 번에 1개 모듈)**

### Step-by-Step 실행 계획

---

## Week 1: API 레이어 추출 (가장 안전)

### Day 1: API Client 모듈 생성

**파일: `src/api/apps-script-client.js`**

```javascript
// ✅ 새 모듈
export class AppsScriptClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async call(action, payload) {
    // 기존 callAppsScript() 로직을 여기로 복사
    const url = this.baseUrl;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });
    return response.json();
  }
}
```

**파일: `index.html` (수정)**

```javascript
// ❌ 삭제하지 말 것! 기존 함수 유지
async function callAppsScript(action, payload) {
  // ✅ 새 모듈을 사용하도록 내부만 변경
  const client = new AppsScriptClient(window.APPS_SCRIPT_URL);
  return await client.call(action, payload);
}

// ✅ window 객체는 여전히 유지
window.callAppsScript = callAppsScript;
```

**검증 체크리스트:**
- [ ] 기존 함수 호출이 모두 작동하는가?
- [ ] window.callAppsScript가 여전히 존재하는가?
- [ ] 외부 스크립트에서 접근 가능한가?
- [ ] 에러 없이 데이터 로드되는가?

---

### Day 2: Config 모듈 추출

**파일: `src/core/config.js`**

```javascript
export class Config {
  static DEFAULT_APPS_SCRIPT_URL = "https://script.google.com/...";
  static CSV_HAND_URL = "https://docs.google.com/...";
  static CSV_INDEX_URL = "https://docs.google.com/...";
  static CSV_TYPE_URL = "https://docs.google.com/...";
  static CSV_CONFIG_URL = "https://docs.google.com/...";

  static getAppsScriptUrl() {
    return localStorage.getItem('appsScriptUrl') || this.DEFAULT_APPS_SCRIPT_URL;
  }

  static setAppsScriptUrl(url) {
    localStorage.setItem('appsScriptUrl', url);
    window.APPS_SCRIPT_URL = url; // ✅ window 객체도 업데이트
  }
}
```

**파일: `index.html` (수정)**

```javascript
// ❌ 상수 선언은 그대로 유지 (하위 호환성)
const DEFAULT_APPS_SCRIPT_URL = Config.DEFAULT_APPS_SCRIPT_URL;
const CSV_HAND_URL = Config.CSV_HAND_URL;
// ...

// ✅ window 객체는 여전히 설정
window.APPS_SCRIPT_URL = Config.getAppsScriptUrl();
```

---

## Week 2: 상태 관리 모듈화

### Day 3: Store 모듈 생성

**파일: `src/core/store.js`**

```javascript
export class Store {
  constructor() {
    this.state = {
      players: [],
      hands: [],
      tables: [],
      currentHand: null,
      activeTable: null
    };
  }

  // Getter
  getPlayers() {
    return this.state.players;
  }

  // Setter
  setPlayers(players) {
    this.state.players = players;
    // ✅ window.state도 동시 업데이트 (하위 호환성)
    if (window.state) {
      window.state.players = players;
    }
  }

  // 특정 플레이어 업데이트
  updatePlayer(playerId, changes) {
    const index = this.state.players.findIndex(p => p.id === playerId);
    if (index !== -1) {
      this.state.players[index] = { ...this.state.players[index], ...changes };
      this.setPlayers([...this.state.players]); // 변경 트리거
    }
  }
}

// ✅ 싱글톤 인스턴스 생성
export const store = new Store();
```

**파일: `index.html` (수정)**

```javascript
// ❌ window.state는 여전히 생성 (1903줄)
window.state = {
  players: [],
  hands: [],
  tables: [],
  // ...
};

// ✅ 새 Store와 동기화
import { store } from './src/core/store.js';

// ✅ Proxy로 양방향 동기화 (고급 기법)
window.state = new Proxy(store.state, {
  set(target, key, value) {
    target[key] = value;
    store.state[key] = value; // Store도 동시 업데이트
    return true;
  }
});
```

**중요: 왜 window.state를 유지하는가?**
- 기존 코드 700여 곳에서 `window.state.players` 직접 참조
- 모든 참조를 한 번에 변경하면 누락 발생 → 앱 파괴
- Proxy 패턴으로 점진적 마이그레이션 가능

---

## Week 3: Player 관리 모듈화

### Day 4-5: PlayerManager 모듈

**파일: `src/features/player/player-manager.js`**

```javascript
import { store } from '../../core/store.js';
import { AppsScriptClient } from '../../api/apps-script-client.js';

export class PlayerManager {
  constructor(apiClient) {
    this.api = apiClient;
    this.store = store;
  }

  async addPlayer(playerData) {
    // ✅ 기존 addPlayer() 로직을 여기로 이동
    const result = await this.api.call('addPlayer', playerData);

    // ✅ Store 업데이트
    this.store.setPlayers([...this.store.getPlayers(), result.player]);

    return result;
  }

  async updatePlayerChips(playerId, newChips) {
    // 기존 updatePlayerChips() 로직
    const result = await this.api.call('updatePlayerChips', {
      playerId,
      chips: newChips
    });

    this.store.updatePlayer(playerId, { chips: newChips });
    return result;
  }

  async removeDuplicates() {
    // ✅ 기존 removeDuplicatePlayers() 로직
    const result = await this.api.call('removeDuplicatePlayers', {});

    if (result.success) {
      // 데이터 다시 로드
      await window.loadInitial(); // ✅ 여전히 window 함수 사용
    }

    return result;
  }
}
```

**파일: `index.html` (수정)**

```javascript
// ✅ PlayerManager 인스턴스 생성
import { PlayerManager } from './src/features/player/player-manager.js';

const apiClient = new AppsScriptClient(window.APPS_SCRIPT_URL);
const playerManager = new PlayerManager(apiClient);

// ❌ 기존 함수는 삭제하지 않고 래퍼로 변경
async function addPlayer(playerData) {
  return await playerManager.addPlayer(playerData);
}

async function updatePlayerChips(playerId, newChips) {
  return await playerManager.updatePlayerChips(playerId, newChips);
}

// ✅ window 객체도 여전히 유지
window.addPlayer = addPlayer;
window.updatePlayerChips = updatePlayerChips;
```

---

## 검증 프로세스 (매일 실행)

### 자동화된 테스트 체크리스트

**파일: `tests/integration-test.js`**

```javascript
// ✅ 모듈화 후에도 기존 기능이 작동하는지 검증

async function testCriticalPath() {
  console.log('🧪 통합 테스트 시작...');

  // Test 1: window 객체 존재 확인
  const requiredGlobals = [
    'APP_CONFIG',
    'APPS_SCRIPT_URL',
    'state',
    'loadInitial',
    'openLogModal',
    'addPlayer',
    'updatePlayerChips'
  ];

  for (const key of requiredGlobals) {
    if (typeof window[key] === 'undefined') {
      throw new Error(`❌ window.${key}가 존재하지 않음!`);
    }
  }
  console.log('✅ 전역 객체 검증 완료');

  // Test 2: 초기화 순서 확인
  const initOrder = [];
  const originalLog = console.log;
  console.log = (...args) => {
    if (args[0]?.includes('초기화')) {
      initOrder.push(args[0]);
    }
    originalLog(...args);
  };

  await window.loadInitial();

  if (initOrder.length === 0) {
    throw new Error('❌ 초기화 로그가 출력되지 않음');
  }
  console.log('✅ 초기화 순서 검증 완료');

  // Test 3: API 호출 테스트
  try {
    const result = await window.callAppsScript('ping', {});
    if (!result) throw new Error('API 응답 없음');
  } catch (err) {
    throw new Error(`❌ API 호출 실패: ${err.message}`);
  }
  console.log('✅ API 호출 검증 완료');

  console.log('🎉 모든 테스트 통과!');
}

// DOMContentLoaded 후 실행
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(testCriticalPath, 3000); // 초기화 완료 후 테스트
});
```

### 수동 테스트 시나리오

**매일 실행해야 할 체크리스트:**

1. **앱 시작**
   - [ ] 페이지 로드 시 에러 없는가?
   - [ ] 로그 모달이 정상 표시되는가?
   - [ ] 버전 정보가 표시되는가?

2. **데이터 로드**
   - [ ] CSV 데이터가 다운로드되는가?
   - [ ] 테이블 목록이 표시되는가?
   - [ ] 플레이어 목록이 정상인가?

3. **핵심 기능**
   - [ ] 테이블 선택이 가능한가?
   - [ ] 플레이어 추가가 작동하는가?
   - [ ] 칩 수정이 반영되는가?
   - [ ] 핸드 로깅이 가능한가?

4. **외부 의존성**
   - [ ] duplicate-remover.js가 로드되는가?
   - [ ] google-sheets-api.js가 작동하는가?
   - [ ] Apps Script API 호출이 성공하는가?

---

## 롤백 전략

### Git 태그를 이용한 안전망

```bash
# Day 1 작업 전
git tag -a safe-before-day1 -m "API Client 모듈화 전 안전 지점"
git push origin safe-before-day1

# Day 1 작업 완료 후
npm run test  # 통합 테스트 실행
# ✅ 테스트 통과 시
git commit -am "feat: API Client 모듈 추출 완료"
git tag -a milestone-day1 -m "API Client 모듈화 완료"

# ❌ 테스트 실패 시
git reset --hard safe-before-day1  # 즉시 롤백
```

### 백업 파일 유지

```bash
# 작업 전 백업
cp index.html index.html.backup-day1
cp index.html index.html.backup-day2
# ...

# 문제 발생 시 즉시 복구
cp index.html.backup-day1 index.html
```

---

## 예상 위험 요소 및 대응

### Risk 1: window 객체 참조 누락
**증상:** `Uncaught ReferenceError: xxx is not defined`
**원인:** window.xxx를 제거했는데 어딘가에서 여전히 사용 중
**해결:**
```bash
# 모든 참조 위치 찾기
grep -r "window\.xxx" index.html
grep -r "xxx(" index.html  # 직접 호출도 검색

# ✅ window 객체 복구
window.xxx = function() { /* 원래 구현 */ };
```

### Risk 2: 초기화 순서 변경
**증상:** `Cannot read property 'xxx' of undefined`
**원인:** 의존성이 있는 객체가 아직 초기화되지 않음
**해결:**
```javascript
// ❌ 잘못된 순서
const playerManager = new PlayerManager();  // state가 아직 없음
window.state = { players: [] };

// ✅ 올바른 순서
window.state = { players: [] };
const playerManager = new PlayerManager();  // state 사용 가능
```

### Risk 3: 비동기 타이밍 문제
**증상:** 가끔 작동하고 가끔 실패함
**원인:** async/await 순서 문제
**해결:**
```javascript
// ❌ 동시 실행으로 순서 보장 안 됨
loadConfig();
loadData();

// ✅ 순차 실행
await loadConfig();
await loadData();
```

---

## 최종 목표 아키텍처 (4주 후)

```
index.html (100줄)
  └── <script type="module" src="/src/main.js">

src/
├── main.js (진입점, 50줄)
│   └── 모든 모듈 import 및 초기화
├── api/
│   ├── apps-script-client.js (200줄)
│   └── error-handler.js (100줄)
├── core/
│   ├── store.js (150줄)
│   ├── config.js (80줄)
│   └── constants.js (100줄)
├── features/
│   ├── player/
│   │   ├── player-manager.js (300줄)
│   │   ├── player-index.js (200줄)
│   │   └── duplicate-checker.js (150줄)
│   ├── hand/
│   │   ├── hand-logger.js (400줄)
│   │   └── action-tracker.js (250줄)
│   └── ui/
│       ├── modal-manager.js (250줄)
│       ├── card-selector.js (200줄)
│       └── action-pad.js (180줄)
└── utils/
    ├── csv-parser.js (150줄)
    └── date-formatter.js (80줄)
```

**하지만:**
- ✅ 기존 window 객체 인터페이스는 **모두 유지**
- ✅ 외부 스크립트 호환성 **100% 보장**
- ✅ 기존 HTML onclick 속성 **정상 작동**

---

## 성공 지표

### Week 1 후
- [ ] index.html: 7,175줄 → **6,500줄** (10% 감소)
- [ ] 새 모듈: **3개** 생성 (api-client, config, error-handler)
- [ ] 테스트 통과율: **100%**
- [ ] Git 충돌 발생률: **0%** (아직 한 명만 작업)

### Week 2 후
- [ ] index.html: 6,500줄 → **5,000줄** (30% 감소)
- [ ] 새 모듈: **8개** (store, player-manager 추가)
- [ ] 테스트 통과율: **100%**
- [ ] 성능 저하: **0%** (벤치마크 유지)

### Week 3-4 후
- [ ] index.html: 5,000줄 → **500줄** (93% 감소)
- [ ] 새 모듈: **20개**
- [ ] 단위 테스트 커버리지: **80%**
- [ ] 빌드 크기 (gzip): **80KB 이하**

---

## 액션 아이템 (즉시 시작)

### 오늘 (Day 0)
1. [ ] 이 문서를 팀과 공유
2. [ ] index.html 백업 생성 (`index.html.safe-backup`)
3. [ ] Git 브랜치 생성 (`git checkout -b refactor/phase7-week1`)
4. [ ] 테스트 파일 생성 (`tests/integration-test.js`)

### 내일 (Day 1)
1. [ ] src/ 폴더 구조 생성
2. [ ] API Client 모듈 구현 (2시간)
3. [ ] 통합 테스트 실행 (30분)
4. [ ] Git 커밋 및 태그 생성

### 이번 주 (Week 1)
1. [ ] Day 1-2: API 레이어 (api-client, config)
2. [ ] Day 3-4: Store 모듈
3. [ ] Day 5: 통합 테스트 및 문서화
4. [ ] 금요일: 주간 회고 및 다음 주 계획

---

**최종 원칙: "작동하는 코드를 절대 삭제하지 말 것!"**

기존 코드는 "래핑(Wrapping)"만 하고, 새 모듈이 완전히 검증될 때까지 **절대 삭제 금지**.
