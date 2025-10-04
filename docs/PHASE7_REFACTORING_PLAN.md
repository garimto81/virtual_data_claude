# 🚨 Phase 7: 코드 모듈화 리팩토링 (긴급)

## 배경 및 문제점

### 현재 구조 분석
```
파일 구조:
├── index.html (331KB, 7,992줄)
│   ├── HTML (678줄, 8%)
│   ├── CSS (<style>, 139줄, 2%)
│   └── JavaScript (<script>, 7,175줄, 90%)  ← 문제 영역
│       ├── 789-7964줄: 단일 거대 스크립트 블록
│       ├── 134개 함수
│       └── 802개 변수/상수 선언
```

**치명적 문제:**
1. **개발 생산성 50% 저하**
   - LLM이 전체 컨텍스트를 로드해야 함 (331KB)
   - 코드 수정 시 누락 빈번 발생
   - 특정 함수 검색 어려움 (134개 중)

2. **Git 협업 불가**
   - 단일 파일 수정 = 90% 충돌 확률
   - Merge conflict 해결 불가능
   - 변경 이력 추적 어려움

3. **테스트 및 유지보수 불가**
   - 의존성 파악 불가능
   - 단위 테스트 작성 불가
   - 코드 재사용 불가

## 리팩토링 전략

### Phase 7.1: 긴급 모듈 추출 (1-2일) ⚡

**Step 1: 핵심 API 레이어 분리**
```javascript
// 현재: index.html (300줄)
function callAppsScript(action, payload) { /* ... */ }
function ensureAppsScriptUrl() { /* ... */ }
function protectedApiCall() { /* ... */ }

// 개선: src/api/apps-script-client.js
export class AppsScriptClient {
  constructor(url) {
    this.baseUrl = url;
    this.retryConfig = { maxAttempts: 3, backoff: 1000 };
  }

  async call(action, payload) { /* ... */ }
  protected async protectedCall(fn) { /* ... */ }
}
```

**Step 2: 상태 관리 분리**
```javascript
// 현재: index.html (100줄)
window.APP_CONFIG = { /* 복잡한 전역 객체 */ }
let globalPlayers = [];
let currentHand = null;

// 개선: src/core/store.js
export const store = {
  state: {
    config: {},
    players: [],
    currentHand: null
  },
  mutations: {
    setPlayers(players) { this.state.players = players; },
    updateConfig(config) { /* ... */ }
  },
  getters: {
    activePlayers() { return this.state.players.filter(p => p.status === 'IN'); }
  }
};
```

**Step 3: 플레이어 관리 모듈화**
```javascript
// 현재: index.html (500줄)
function addPlayer() { /* ... */ }
function updatePlayerChips() { /* ... */ }
function removeDuplicatePlayers() { /* ... */ }
class PlayerIndex { /* ... */ }

// 개선: src/features/player/player-manager.js
export class PlayerManager {
  constructor(apiClient, store) {
    this.api = apiClient;
    this.store = store;
    this.index = new PlayerIndex();
  }

  async add(playerData) { /* ... */ }
  async update(id, changes) { /* ... */ }
  async removeDuplicates() { /* ... */ }
}

// src/features/player/player-index.js (이미 존재, 개선)
export class PlayerIndex { /* ... */ }
```

**예상 효과:**
- index.html: 7,175줄 → **~500줄** (93% 감소)
- 모듈 수: 1개 → **15개**
- 평균 파일 크기: 331KB → **~30KB/파일**

### Phase 7.2: 빌드 시스템 도입 (3-5일) 🔧

**Vite 설정**
```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 500,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    cors: true
  }
});
```

**개발/배포 분리**
```bash
# 개발 환경 (모듈 그대로, HMR)
npm run dev
→ http://localhost:3000
→ 모든 모듈 개별 로드
→ 빠른 개발 사이클

# 프로덕션 빌드
npm run build
→ dist/index.html (15KB)
→ dist/assets/main.abc123.js (번들, 150KB gzipped)
→ dist/assets/vendor.def456.js (라이브러리, 50KB gzipped)
```

### Phase 7.3: 점진적 마이그레이션 (1주일)

**Day 1-2: API 레이어**
```
✅ src/api/
   ├── apps-script-client.js (200줄)
   ├── sheets-api.js (150줄)
   └── error-handler.js (100줄)
```

**Day 3-4: 코어 로직**
```
✅ src/core/
   ├── store.js (150줄)
   ├── config.js (80줄)
   └── constants.js (100줄)

✅ src/features/player/
   ├── player-manager.js (300줄)
   ├── player-index.js (200줄) ← 기존 파일 개선
   └── duplicate-checker.js (150줄) ← 기존 파일 이동
```

**Day 5-6: UI 컴포넌트**
```
✅ src/features/ui/
   ├── modal-manager.js (250줄)
   ├── card-selector.js (200줄)
   ├── action-pad.js (180줄)
   └── table-selector.js (150줄)

✅ src/features/hand/
   ├── hand-logger.js (400줄)
   ├── action-tracker.js (250줄)
   └── pot-calculator.js (150줄)
```

**Day 7: 통합 및 테스트**
```
✅ src/main.js (진입점, 100줄)
✅ index.html (모듈 로딩만, 50줄)
✅ 전체 기능 검증
✅ 성능 측정
```

## 새로운 아키텍처

```
┌─────────────────────────────────────────────────┐
│              index.html (50줄)                   │
│  <script type="module" src="/src/main.js">      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│            src/main.js (진입점)                   │
│  import { initApp } from './core/app.js';       │
│  initApp();                                     │
└────────────────┬────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌────────┐  ┌─────────┐  ┌──────────┐
│  API   │  │  Core   │  │ Features │
│ Layer  │  │  Layer  │  │  Layer   │
└────────┘  └─────────┘  └──────────┘
    │            │            │
    ▼            ▼            ▼
┌─────────────────────────────────────┐
│     Google Apps Script (Backend)     │
└─────────────────────────────────────┘
```

## 모듈 의존성 그래프

```
main.js
  ├── core/app.js
  │   ├── core/store.js
  │   ├── api/apps-script-client.js
  │   ├── features/player/player-manager.js
  │   │   ├── core/store.js
  │   │   ├── api/apps-script-client.js
  │   │   └── features/player/player-index.js
  │   ├── features/hand/hand-logger.js
  │   │   ├── core/store.js
  │   │   ├── api/apps-script-client.js
  │   │   └── features/hand/action-tracker.js
  │   └── features/ui/modal-manager.js
  │       ├── core/store.js
  │       └── features/ui/card-selector.js
```

## 코드 예제

### Before (현재)
```javascript
// index.html (7,175줄 중 일부)
<script>
  const APP_VERSION = 'v3.5.42';
  window.APP_CONFIG = { /* ... */ };

  async function callAppsScript(action, payload) {
    const url = window.APP_CONFIG.appsScriptUrl;
    // 300줄의 API 호출 로직
  }

  async function addPlayer(playerData) {
    // 200줄의 플레이어 추가 로직
  }

  function renderPlayerSelection() {
    // 500줄의 UI 렌더링 로직
  }

  // ... 6,000줄 더
</script>
```

### After (개선)
```javascript
// index.html (50줄)
<!DOCTYPE html>
<html>
<head>
  <title>Poker Hand Logger v3.5.42</title>
  <link rel="stylesheet" href="/src/styles/main.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>

// src/main.js (100줄)
import { createApp } from './core/app.js';
import { AppsScriptClient } from './api/apps-script-client.js';
import { PlayerManager } from './features/player/player-manager.js';
import { HandLogger } from './features/hand/hand-logger.js';

async function init() {
  const apiClient = new AppsScriptClient(
    localStorage.getItem('appsScriptUrl')
  );

  const app = createApp({
    apiClient,
    modules: [
      new PlayerManager(apiClient),
      new HandLogger(apiClient)
    ]
  });

  await app.mount('#app');
}

init().catch(console.error);

// src/api/apps-script-client.js (200줄)
export class AppsScriptClient {
  async call(action, payload) { /* ... */ }
}

// src/features/player/player-manager.js (300줄)
export class PlayerManager {
  async add(data) { /* ... */ }
}
```

## 예상 성과

### 정량적 지표
| 지표 | Before | After | 개선율 |
|-----|--------|-------|--------|
| **index.html 크기** | 331KB | 15KB | **95% 감소** |
| **모듈 수** | 1개 | 25개 | **2,400% 증가** |
| **평균 파일 크기** | 331KB | 20KB | **94% 감소** |
| **최대 함수 길이** | ~200줄 | ~50줄 | **75% 감소** |
| **빌드 크기 (gzip)** | 331KB | ~80KB | **76% 감소** |

### 정성적 개선
- ✅ **개발 속도**: 5배 향상 (모듈별 독립 수정)
- ✅ **Git 충돌**: 90% → 10% (모듈 분리)
- ✅ **코드 재사용**: 불가능 → 높음 (export/import)
- ✅ **테스트 가능성**: 0% → 80% (단위 테스트)
- ✅ **신규 개발자 온보딩**: 불가능 → 1일 내 가능

## 다음 단계

### 1. 즉시 실행 (오늘)
- [ ] src/ 폴더 구조 생성
- [ ] API 레이어 추출 (apps-script-client.js)
- [ ] 기본 테스트 작성

### 2. 1주일 내
- [ ] 전체 모듈 마이그레이션
- [ ] Vite 빌드 설정
- [ ] GitHub Actions 자동 배포

### 3. 2주일 내
- [ ] 단위 테스트 80% 커버리지
- [ ] 성능 벤치마크
- [ ] 문서 업데이트

## 리스크 및 완화 방안

**Risk 1: 기존 기능 손상**
- **완화**: 기존 index.html 백업 유지
- **완화**: 점진적 마이그레이션 (기능별)
- **완화**: 각 단계마다 전체 기능 테스트

**Risk 2: 성능 저하**
- **완화**: 번들 크기 모니터링 (< 200KB gzipped)
- **완화**: 코드 분할 (route-based)
- **완화**: Tree-shaking 최적화

**Risk 3: 개발자 학습 곡선**
- **완화**: 상세 문서 작성
- **완화**: 코드 예제 제공
- **완화**: 단계별 마이그레이션 가이드

---

**우선순위: P0 (긴급)**
**담당: 개발팀 전체**
**예상 소요: 1-2주**
**ROI: 개발 생산성 500% 향상**
