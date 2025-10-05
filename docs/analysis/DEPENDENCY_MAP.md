# 의존성 분석 결과 (Step 1)

> index.html 7909줄 분석 완료

## 📊 요약

| 항목 | 수량 | 파일 |
|-----|------|------|
| 전역 변수 | 22개 | globals.txt |
| 함수 | 129개 | functions.txt |
| onclick 이벤트 | 6개 | onclick-events.txt |

---

## 🌐 전역 변수 (22개)

### 핵심 상태 (2개)
- `window.state` - 앱 전체 상태 (가장 많이 참조)
- `window.managementState` - 테이블 관리 모드 상태

### 설정 (2개)
- `window.APP_CONFIG` - 앱 설정
- `window.APPS_SCRIPT_URL` - Google Apps Script URL

### 매니저 객체 (2개)
- `window.actionOrderManager` - 액션 순서 관리
- `window.actionHistory` - 액션 히스토리

### 유틸리티 함수 (16개)
- `window.loadInitial` - 초기 데이터 로딩
- `window.openCardSelector` - 카드 선택기
- `window.deleteLocalPlayer` - 플레이어 삭제
- `window.addAutoAction` - 자동 액션 추가
- `window.handleAllIn` - 올인 처리
- `window.handleSmartCall` - 스마트 콜 처리
- `window.openQuickBetRaise` - 빠른 벳/레이즈
- `window.openLogModal` - 로그 모달
- `window.closeLogModal` - 로그 모달 닫기
- `window.logMessage` - 로그 메시지
- `window.showFeedback` - 피드백 표시
- `window.protectedApiCall` - 보호된 API 호출
- `window.getUserFriendlyErrorMessage` - 에러 메시지
- `window.isTableManagementMode` - 테이블 관리 모드 확인
- `window.location` - 브라우저 location
- `window.addEventListener` - 이벤트 리스너

---

## 🎯 onclick 이벤트 (6개)

```html
onclick="addAutoAction('Checks')"
onclick="addAutoAction('Folds')"
onclick="deleteLocalPlayer(${index})"
onclick="handleAllIn()"
onclick="handleSmartCall()"
onclick="openQuickBetRaise()"
```

**특징**:
- HTML에 직접 바인딩 (인라인 이벤트)
- 전역 함수 참조 필요
- Facade 패턴으로 유지 가능

---

## 📦 함수 분류 (129개 → 8개 모듈)

### Module 1: pure-utils.js (10개)
**순수 함수 (외부 의존성 없음)**
- parseSeatNumber
- compareSeatNumbers
- getPlayerSeatNumber
- formatCardDisplay
- parseCSV
- getFormattedTimeInTimezone
- extractSpreadsheetIdFromUrl
- 기타 유틸리티 함수

### Module 2: store.js (1개 클래스)
**중앙 상태 관리**
- AppStore (window.state, window.APP_CONFIG 통합)

### Module 3: data-loader.js (15개)
**데이터 로딩 관련**
- loadInitial ⭐
- buildTypeFromCsv
- loadPlayersFromIndexedDB
- savePlayersToIndexedDB
- loadTablesFromIndexedDB
- saveTablesToIndexedDB
- safeIndexedDBOperation
- initializeGoogleSheetsAPI
- loadDefaultUrlFromConfig
- updateAppsScriptUrl
- 기타 로딩 함수

### Module 4: hand-recorder.js (20개)
**핸드 기록 관련**
- sendHandToGoogleSheet ⭐
- collectHandData
- validateHandData
- prepareHandForSubmission
- handleHandSubmitSuccess
- handleHandSubmitError
- 기타 핸드 관련 함수

### Module 5: pot-calculator.js (12개)
**팟 계산 관련**
- calculateAccuratePot ⭐
- calculatePotWithCorrection
- calculateSidePots
- calculatePlayerContributions
- validatePotCalculation
- 기타 팟 관련 함수

### Module 6: card-selector.js (8개)
**카드 선택 UI**
- openCardSelector ⭐
- closeCardSelector
- handleCardSelection
- renderCardGrid
- 기타 카드 UI 함수

### Module 7: player-manager.js (18개)
**플레이어 관리**
- addPlayer ⭐
- updatePlayerChips
- deleteLocalPlayer ⭐
- renderPlayerList
- handlePlayerSelection
- 기타 플레이어 함수

### Module 8: action-manager.js (25개)
**액션 관리**
- addAutoAction ⭐
- handleAllIn ⭐
- handleSmartCall ⭐
- openQuickBetRaise ⭐
- addAction
- undoLastAction
- validateAction
- 기타 액션 함수

### UI/Modal (20개)
**UI 유틸리티**
- openLogModal
- closeLogModal
- logMessage
- showFeedback
- lockUI
- unlockUI
- executeWithLock
- renderTableSelection
- renderTableGrid
- 기타 UI 함수

---

## 🔗 주요 의존성 관계

### loadInitial() 호출 체인
```
loadInitial()
  → initializeGoogleSheetsAPI()
  → loadDefaultUrlFromConfig()
  → buildTypeFromCsv()
  → loadPlayersFromIndexedDB()
  → loadTablesFromIndexedDB()
  → renderTableSelection()
```

### sendHandToGoogleSheet() 호출 체인
```
sendHandToGoogleSheet()
  → collectHandData()
  → validateHandData()
  → prepareHandForSubmission()
  → protectedApiCall()
  → handleHandSubmitSuccess() or handleHandSubmitError()
```

### addAutoAction() 호출 체인
```
addAutoAction(actionType)
  → window.actionOrderManager.addAction()
  → updateActionDisplay()
  → calculateAccuratePot()
  → updatePotDisplay()
```

---

## 📝 리팩토링 우선순위

### Step 2: pure-utils.js (10개) ✅ 가장 쉬움
의존성 없음, 안전

### Step 3: store.js (1개 클래스) ✅ 중요
모든 모듈의 기반

### Step 4: hand-recorder.js (20개) ⭐ 핵심
가장 중요한 기능

### Step 5: data-loader.js (15개) ⭐ 핵심
초기 로딩 필수

### Step 6: pot-calculator.js (12개)
복잡한 로직, 테스트 필수

### Step 7: card-selector.js (8개)
UI 독립적

### Step 8: player-manager.js (18개)
플레이어 CRUD

### Step 9: action-manager.js (25개)
가장 복잡, 마지막

---

## ✅ Step 1 완료 체크리스트

- [x] docs/analysis/ 폴더 생성
- [x] globals.txt 파일 존재 (22줄)
- [x] functions.txt 파일 존재 (129줄)
- [x] onclick-events.txt 파일 존재 (6줄)
- [x] DEPENDENCY_MAP.md 작성

**다음**: Git Commit → Step 2 진행
