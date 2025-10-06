# LLD - Virtual Data Poker Hand Logger 리팩토링

> Low-Level Design: AI가 빠르게 코드 위치를 찾기 위한 인덱스

## 📊 현재 구조 (v3.12.0)

### 파일 구조
```
c:\claude\virtual_data_claude\
├── index.html (7837줄) ← 리팩토링 진행 중
├── src/
│   ├── core/
│   │   └── store.js (141줄) - 중앙 상태 관리 ✅ Step 3 완료
│   ├── modules/
│   │   ├── pure-utils.js (70줄) - 순수 함수 ✅ Step 2 완료
│   │   └── hand-recorder.js (62줄) - 핸드 전송 ✅ Step 4 완료
│   ├── facades/
│   │   └── hand-facade.js (29줄) - onclick 호환 ✅ Step 4 완료
│   ├── js/ (기존 파일 9개)
│   └── utils/ (기존 파일 3개)
└── apps-script/
    └── Code_v71.0.3.gs (Apps Script)
```

---

## 📑 목차

1. [완료된 구현](#완료된-구현-step-1-4)
2. [진행 예정](#진행-예정-step-5-12)
3. [주요 기술 결정](#주요-기술-결정)
4. [의존성 그래프](#의존성-그래프)

---

## 🔍 AI 인덱스

### 완료된 구현 (Step 1-4)

#### Step 1: 의존성 분석 ✅
**구현**: docs/analysis/
- `globals.txt` - 전역 변수 22개 목록
- `functions.txt` - 함수 129개 목록
- `onclick-events.txt` - onclick 이벤트 6개 목록
- `DEPENDENCY_MAP.md` - 8개 모듈 설계

**결정**:
- Facade 패턴 사용 (이유: HTML onclick 이벤트 100% 호환)
- 8개 모듈 분리 전략 (이유: 기능별 응집도 높임)

**참조**: [docs/analysis/DEPENDENCY_MAP.md](analysis/DEPENDENCY_MAP.md)

---

#### Step 2: 순수 함수 분리 ✅
**구현**: [src/modules/pure-utils.js](../src/modules/pure-utils.js)

**함수 목록**:
- `parseSeatNumber(seat)` - 좌석 번호 파싱 (line 11)
- `compareSeatNumbers(a, b)` - 좌석 번호 비교 (line 28)
- `getPlayerSeatNumber(player)` - 플레이어 좌석 번호 (line 39)
- `formatChips(chips)` - 칩 포맷 (line 48)
- `formatCardDisplay(cardId)` - 카드 표시 포맷 (line 58)

**전역 노출**: index.html에서 `Object.assign(window, PureUtils)` (onclick 호환)

**결정**:
- export/import 사용 (이유: ES6 모듈 시스템)
- window 전역 노출 (이유: HTML onclick 이벤트 호환)

**감소**: 35줄 (7909 → 7874줄)

---

#### Step 3: 전역 스토어 구축 ✅
**구현**: [src/core/store.js](../src/core/store.js)

**클래스**: `AppStore`
- `constructor()` - 초기화 (line 6)
  - `this.state` - window.state 통합 (line 8)
  - `this.config` - window.APP_CONFIG 통합 (line 69)
- `getState()` - 상태 가져오기 (line 92)
- `setState(newState)` - 상태 업데이트 (line 100)
- `getConfig(key)` - 설정 가져오기 (line 108)
- `setConfig(key, value)` - 설정 설정 + localStorage 동기화 (line 117)
- `getAllConfig()` - 전체 설정 가져오기 (line 131)

**싱글톤**: `export const store` (line 137)
**디버깅**: `window.__store__` (line 140)

**결정**:
- 싱글톤 패턴 (이유: 전역 상태 단일 소스)
- localStorage 자동 동기화 (이유: appsScriptUrl, spreadsheetId 영속화)
- DEFAULT_APPS_SCRIPT_URL 상수 (이유: localStorage 없을 때 기본값, line 67)

**감소**: 60줄 (7874 → 7814줄)

**Fix (2025-10-06)**: DEFAULT_APPS_SCRIPT_URL 추가 (localStorage null 문제 해결)

---

#### Step 4: Hand Recorder Facade ✅
**구현**:
- [src/modules/hand-recorder.js](../src/modules/hand-recorder.js) - 내부 로직
- [src/facades/hand-facade.js](../src/facades/hand-facade.js) - 외부 인터페이스

**hand-recorder.js** (62줄):
- `class HandRecorder`
  - `constructor()` - isSending 초기화 (line 9)
  - `sendToGoogleSheet(payload)` - 핸드 전송 (line 18)
    - Apps Script URL 가져오기 (line 19)
    - URLSearchParams 사용 (CORS 우회, line 28)
    - fetch POST 요청 (line 31)
  - `getIsSending()` - 전송 중 확인 (line 48)
  - `setIsSending(value)` - 전송 중 설정 (line 55)
- `export const handRecorder` - 싱글톤 (line 61)

**hand-facade.js** (29줄):
- `sendHandToGoogleSheet(payload)` - 기존 함수명 유지 (line 12)
- `getIsSending()` - 전송 중 확인 (line 19)
- `setIsSending(value)` - 전송 중 설정 (line 26)

**전역 노출**: index.html에서 `window.sendHandToGoogleSheet = HandFacade.sendHandToGoogleSheet` (onclick 호환)

**결정**:
- Facade 패턴 (이유: 기존 함수명 유지, HTML 수정 불필요)
- x-www-form-urlencoded (이유: CORS 우회, line 33)
- isSending 상태 관리 (이유: 중복 전송 방지)

**감소**: 11줄 (7814 → 7803줄)

**참고**: fetch 로직만 분리, generateRows_v46() 등은 index.html에 유지 (Step 4 확장에서 분리 예정)

---

### 진행 예정 (Step 5-12)

#### PRD 1.1: Step 4 확장 - Hand Recorder 완전 분리 🔴 High
**목표**: +300줄 추가 감소 (총 ~310줄)

**분리 대상** (index.html → src/modules/hand-recorder.js):
- `generateRows_v46()` - 핸드 데이터 → 시트 행 생성 (~140줄, index.html:5055-5187)
- `buildIndexMeta()` - Index 시트 메타 정보 (~60줄, index.html:5295-5349)
- `buildTypeUpdates()` - Type 시트 업데이트 정보 (~20줄, index.html:5351-5364)
- `_sendDataToGoogleSheet_internal()` - 내부 전송 로직 (~90줄, index.html:5192-5285)

**의존성**:
- window.state → store.getState()
- APPS_SCRIPT_URL → store.getConfig('appsScriptUrl')

**검증**: 핸드 전송 플로우 전체 테스트

**예상 효과**: 7803줄 → 7493줄 (-310줄, 5.3%)

---

#### PRD 1.2: Step 5 - Data Loader 🔴 High
**목표**: ~800줄 감소

**생성 파일**:
- `src/modules/data-loader.js` - DataLoader 클래스
- `src/facades/data-facade.js` - onclick 호환

**분리 대상** (index.html → data-loader.js):
- `loadInitial()` - CSV 데이터 초기 로딩
- `buildTypeFromCsv()` - Type 시트 파싱
- `buildIndexFromCsv()` - Index 시트 파싱
- IndexedDB 캐싱 함수 15개:
  - `loadPlayersFromIndexedDB()`
  - `savePlayersToIndexedDB()`
  - `loadTablesFromIndexedDB()`
  - `saveTablesToIndexedDB()`
  - `safeIndexedDBOperation()`
  - 기타 10개

**의존성**:
- store.js (Step 3)
- Dexie.js (IndexedDB wrapper)

**검증**: 앱 초기 로딩 3초 이내, IndexedDB 캐시 정상

**예상 효과**: 7493줄 → 6693줄 (-800줄, 15.4%)

---

#### PRD 1.3: Step 6 - Pot Calculator 🔴 High
**목표**: ~300줄 감소

**생성 파일**:
- `src/modules/pot-calculator.js` - PotCalculator 클래스
- `src/facades/pot-facade.js` - onclick 호환

**분리 대상** (index.html → pot-calculator.js):
- `calculateAccuratePot()` - 정확한 팟 계산
- `calculatePotWithCorrection()` - 오차 보정
- `calculateSidePots()` - 사이드팟 계산
- `calculatePlayerContributions()` - 플레이어별 기여도
- `validatePotCalculation()` - 검증
- 기타 7개 함수

**의존성**: store.js (Step 3)

**검증**: 단순 팟, 사이드팟, 복잡한 사이드팟 시나리오 테스트

**예상 효과**: 6693줄 → 6393줄 (-300줄, 19.2%)

---

#### PRD 1.4: Step 7 - Card Selector 🟡 Medium
**목표**: ~200줄 감소

**생성 파일**:
- `src/modules/card-selector.js` - CardSelector 클래스
- `src/facades/card-facade.js` - onclick 호환

**분리 대상** (index.html → card-selector.js):
- `openCardSelector()` - 모달 열기
- `closeCardSelector()` - 모달 닫기
- `handleCardSelection()` - 카드 선택 처리
- `renderCardGrid()` - 카드 그리드 렌더링
- 기타 4개 함수

**의존성**: store.js (Step 3)

**검증**: Flop/Turn/River/홀카드 선택 플로우

**예상 효과**: 6393줄 → 6193줄 (-200줄, 21.7%)

---

#### PRD 1.5: Step 8 - Player Manager 🟡 Medium
**목표**: ~300줄 감소

**생성 파일**:
- `src/modules/player-manager.js` - PlayerManager 클래스
- `src/facades/player-facade.js` - onclick 호환

**분리 대상** (index.html → player-manager.js):
- `addPlayer()` - 플레이어 추가
- `updatePlayerChips()` - 칩 정보 수정
- `deleteLocalPlayer()` - 플레이어 삭제
- `renderPlayerList()` - 플레이어 목록 렌더링
- `handlePlayerSelection()` - 플레이어 선택 처리
- 기타 13개 함수

**의존성**: store.js (Step 3), data-loader.js (Step 5)

**검증**: 플레이어 CRUD + Google Sheets 동기화

**예상 효과**: 6193줄 → 5893줄 (-300줄, 25.5%)

---

#### PRD 2.1: Step 9 - Action Manager 🔴 High
**목표**: ~1000줄 감소 (가장 복잡한 모듈)

**생성 파일**:
- `src/modules/action-manager.js` - ActionManager 클래스
- `src/facades/action-facade.js` - onclick 호환

**분리 대상** (index.html → action-manager.js):
- `addAutoAction()` - 자동 액션 추가 (onclick 이벤트)
- `handleAllIn()` - 올인 처리 (onclick 이벤트)
- `handleSmartCall()` - 스마트 콜 처리 (onclick 이벤트)
- `openQuickBetRaise()` - 빠른 벳/레이즈 (onclick 이벤트)
- `addAction()` - 액션 추가
- `undoLastAction()` - 마지막 액션 취소
- `validateAction()` - 액션 검증
- 기타 18개 함수 (총 25개)

**의존성**: store.js (Step 3), pot-calculator.js (Step 6)

**검증**: 모든 액션 타입 + 액션 순서 자동 매핑

**예상 효과**: 5893줄 → 4893줄 (-1000줄, 39.8%)

---

#### PRD 2.2: Step 10 - UI/Modal 🟡 Medium
**목표**: ~600줄 감소

**생성 파일**:
- `src/modules/ui-utils.js` - UIUtils 클래스
- `src/facades/ui-facade.js` - onclick 호환

**분리 대상** (index.html → ui-utils.js):
- `openLogModal()`, `closeLogModal()`
- `logMessage()`, `showFeedback()`
- `lockUI()`, `unlockUI()`, `executeWithLock()`
- `renderTableSelection()`, `renderTableGrid()`
- 기타 12개 함수 (총 20개)

**의존성**: store.js (Step 3)

**검증**: 모든 모달/피드백 테스트

**예상 효과**: 4893줄 → 4293줄 (-600줄, 48.5%)

---

#### PRD 3.1: Step 11 - 나머지 일괄 모듈화 🔴 High
**목표**: ~3200줄 감소 (목표 달성 핵심)

**분리 대상** (index.html → 각 모듈):
- 테이블 관리 관련 함수
- 설정 관련 함수
- 기타 유틸리티 함수
- 중복 코드 제거
- Dead code 제거

**검증**: 전체 플로우 테스트

**예상 효과**: 4293줄 → 1093줄 (-3200줄, 86.2%)

---

#### PRD 3.2: Step 12 - 최종 최적화 🟡 Medium
**목표**: ~93줄 감소 (1000줄 이하 확정)

**최적화 대상**:
- HTML 중복 제거
- 인라인 스타일 제거 (CSS로 이동)
- 주석 제거
- 공백 정리

**검증**: 최종 통합 테스트 (30분)

**예상 효과**: 1093줄 → **1000줄** (-93줄, 87.0%) **🎉 목표 달성!**

---

## 🔑 주요 기술 결정

### 1. Facade 패턴
**이유**: HTML onclick 이벤트 100% 호환 (HTML 수정 불필요)

**구조**:
```javascript
// HTML (변경 없음)
<button onclick="sendHandToGoogleSheet()">

// Facade (src/facades/hand-facade.js)
export function sendHandToGoogleSheet(payload) {
  return handRecorder.sendToGoogleSheet(payload);
}

// Module (src/modules/hand-recorder.js)
export class HandRecorder {
  async sendToGoogleSheet(payload) { ... }
}

// index.html (전역 노출)
import * as HandFacade from './src/facades/hand-facade.js';
window.sendHandToGoogleSheet = HandFacade.sendHandToGoogleSheet;
```

---

### 2. 단방향 의존성
**이유**: 순환 참조 방지, 의존성 추적 용이

**구조**:
```
index.html
  ↓ import
facades/*.js (onclick 호환 레이어)
  ↓ import
modules/*.js (비즈니스 로직)
  ↓ import
core/store.js (전역 상태)
```

---

### 3. 중앙 스토어 (store.js)
**이유**: window.* 전역 변수 제거, 상태 관리 단일 소스

**Before**:
```javascript
window.state = { ... };
window.APP_CONFIG = { ... };
window.APPS_SCRIPT_URL = '...';
```

**After**:
```javascript
import { store } from './src/core/store.js';
store.getState();
store.setState({ ... });
store.getConfig('appsScriptUrl');
```

---

### 4. ES6 모듈 시스템
**이유**: import/export로 명확한 의존성, 트리 쉐이킹 가능

**예시**:
```javascript
// pure-utils.js
export function parseSeatNumber(seat) { ... }

// index.html
import * as PureUtils from './src/modules/pure-utils.js';
Object.assign(window, PureUtils); // onclick 호환
```

---

### 5. 싱글톤 패턴
**이유**: 전역 상태 단일 인스턴스, 메모리 효율

**예시**:
```javascript
// store.js
class AppStore { ... }
export const store = new AppStore(); // 싱글톤

// hand-recorder.js
class HandRecorder { ... }
export const handRecorder = new HandRecorder(); // 싱글톤
```

---

### 6. x-www-form-urlencoded
**이유**: Apps Script CORS 정책 우회

**구현** (hand-recorder.js:28-34):
```javascript
const form = new URLSearchParams();
form.append('payload', JSON.stringify(payload));

const response = await fetch(appsScriptUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
  body: form.toString(),
});
```

---

### 7. localStorage 자동 동기화
**이유**: 설정 값 영속화 (페이지 새로고침 후 유지)

**구현** (store.js:117-126):
```javascript
setConfig(key, value) {
  this.config[key] = value;

  // localStorage 동기화 (특정 키만)
  if (key === 'appsScriptUrl') {
    localStorage.setItem('appsScriptUrl', value);
  } else if (key === 'spreadsheetId') {
    localStorage.setItem('googleSheetsSpreadsheetId', value);
  }
}
```

---

### 8. 점진적 리팩토링
**이유**: 과거 실패 경험 (무지성 분리 → 의존성 추적 불가)

**전략**:
- 한 번에 하나씩 (Step 1 → 검증 → Step 2)
- 항상 롤백 가능 (모든 Step = 1 commit)
- 검증 필수 (체크리스트 100% 완료)

---

## 📊 의존성 그래프

### 현재 구조 (Step 1-4 완료)
```
index.html (7803줄)
  │
  ├─ import → src/modules/pure-utils.js (70줄)
  │             └─ window 전역 노출 (onclick 호환)
  │
  ├─ import → src/core/store.js (141줄)
  │             ├─ window.__store__ (디버깅)
  │             └─ window.state (임시 호환성)
  │
  └─ import → src/facades/hand-facade.js (29줄)
                ├─ import → src/modules/hand-recorder.js (62줄)
                │             └─ import → src/core/store.js
                └─ window.sendHandToGoogleSheet (onclick 호환)
```

### 목표 구조 (Step 12 완료 후)
```
index.html (1000줄)
  │
  ├─ import → src/facades/*.js (각 50줄)
  │             └─ import → src/modules/*.js
  │                         └─ import → src/core/store.js
  │
  └─ window 전역 노출 (onclick 호환만)
```

---

## 📈 진행 현황

| Step | 작업 | 예상 감소 | 실제 감소 | 누적 감소 | 현재 줄 수 | 진행률 |
|------|------|----------|----------|----------|-----------|--------|
| 초기 | - | - | - | - | 7909 | 0% |
| Step 1 | 의존성 분석 | 0줄 | 0줄 | 0줄 | 7909 | 0% |
| Step 2 | 순수 함수 분리 | ~100줄 | 35줄 | 35줄 | 7874 | 0.4% |
| Step 3 | 전역 스토어 | ~150줄 | 60줄 | 95줄 | 7814 | 1.2% |
| Step 4 | Hand Recorder | ~400줄 | 11줄 | 106줄 | 7803 | 1.3% |
| Step 4 확장 | Hand 완전 분리 | ~300줄 | ? | ? | ? | ? |
| Step 5 | Data Loader | ~800줄 | ? | ? | ? | ? |
| Step 6 | Pot Calculator | ~300줄 | ? | ? | ? | ? |
| Step 7 | Card Selector | ~200줄 | ? | ? | ? | ? |
| Step 8 | Player Manager | ~300줄 | ? | ? | ? | ? |
| Step 9 | Action Manager | ~1000줄 | ? | ? | ? | ? |
| Step 10 | UI/Modal | ~600줄 | ? | ? | ? | ? |
| Step 11 | 나머지 일괄 | ~3200줄 | ? | ? | ? | ? |
| Step 12 | 최종 최적화 | ~93줄 | ? | ? | ? | ? |
| **목표** | - | **6909줄** | **?** | **6909줄** | **1000** | **87%** |

**현재 상태**: Step 4 완료 (1.3%)
**다음 작업**: Step 4 확장 (방안 1) - 예상 4-6시간

---

## 🔍 빠른 검색 인덱스

### 상태 관리 찾기
- **전역 상태**: src/core/store.js (AppStore.state)
- **설정 값**: src/core/store.js (AppStore.config)
- **디버깅**: 콘솔에서 `window.__store__` 입력

### 핸드 전송 찾기
- **내부 로직**: src/modules/hand-recorder.js (HandRecorder 클래스)
- **외부 인터페이스**: src/facades/hand-facade.js (sendHandToGoogleSheet)
- **HTML 호출**: onclick="sendHandToGoogleSheet()"

### 순수 함수 찾기
- **좌석 번호**: src/modules/pure-utils.js (parseSeatNumber)
- **칩 포맷**: src/modules/pure-utils.js (formatChips)
- **카드 표시**: src/modules/pure-utils.js (formatCardDisplay)

### 의존성 분석 찾기
- **전역 변수 목록**: docs/analysis/globals.txt
- **함수 목록**: docs/analysis/functions.txt
- **onclick 이벤트**: docs/analysis/onclick-events.txt
- **모듈 설계**: docs/analysis/DEPENDENCY_MAP.md

---

## 📚 관련 문서

- [PLAN.md](PLAN.md) - 프로젝트 비전 및 페르소나
- [PRD.md](PRD.md) - 기능 목록 및 우선순위
- [STATUS.md](STATUS.md) - 현재 작업 상태 (실시간)
- [CHANGELOG.md](CHANGELOG.md) - 완료된 작업 기록
- [STEP_BY_STEP_REFACTORING.md](STEP_BY_STEP_REFACTORING.md) - 상세 가이드
- [NEXT_SESSION_PLAN.md](NEXT_SESSION_PLAN.md) - 다음 세션 전략

---

**업데이트**: 각 Step 완료 시 이 문서를 업데이트하여 AI가 최신 코드 위치를 빠르게 찾을 수 있도록 유지
