# PRD - Virtual Data Poker Hand Logger 리팩토링

> PLAN 근거: [PLAN.md](PLAN.md) 참고

## 📊 현재 상황 (2025-10-06)

### 완료된 작업
- [x] **Step 1**: 의존성 분석 (0줄 감소)
- [x] **Step 2**: 순수 함수 분리 (35줄 감소)
- [x] **Step 3**: 전역 스토어 구축 (60줄 감소)
- [x] **Step 4**: Hand Recorder Facade (11줄 감소)

**누적 감소**: 106줄 (1.3%)
**현재 줄 수**: 7803줄
**목표까지 남은 양**: 6803줄

### 🚨 핵심 문제
- **목표**: 7909줄 → 1000줄 (-87%)
- **현실**: 겨우 1.3% 진행
- **원인**: Step 4에서 11줄만 감소 (예상 400줄) - 너무 보수적

---

## Phase 1: 급진적 리팩토링 (현재 Phase)

### 1.1 Step 4 확장 - Hand Recorder 완전 분리 🔴 High

**PLAN 근거**: 개발자 민수 - 버그 수정 30분 → 5분
**NEXT_SESSION_PLAN 전략**: 방안 1 (권장)

**성공 조건**:
- Step 4에서 **+300줄 추가 감소** (총 ~310줄)
- 핸드 전송 기능 100% 정상 작동
- 의존성 명확, 응집도 높음

**요구사항**:
- [ ] `generateRows_v46()` 분리 (~140줄)
  - 위치: index.html:5055-5187
  - 이동: src/modules/hand-recorder.js
  - 의존성: window.state, store
- [ ] `buildIndexMeta()` 분리 (~60줄)
  - 위치: index.html:5295-5349
  - 이동: src/modules/hand-recorder.js
  - 의존성: store.getState()
- [ ] `buildTypeUpdates()` 분리 (~20줄)
  - 위치: index.html:5351-5364
  - 이동: src/modules/hand-recorder.js
  - 의존성: store
- [ ] `_sendDataToGoogleSheet_internal()` 리팩토링 (~90줄)
  - 위치: index.html:5192-5285
  - 이동: src/modules/hand-recorder.js
  - 의존성: fetch, store.getConfig()
- [ ] 검증: 핸드 전송 플로우 전체 테스트
  - 플레이어 추가 → 핸드 시작 → 액션 입력 → 전송 → Google Sheets 확인

**의존성**: Step 4 (fetch 로직) 완료됨

**예상 효과**:
- 7803줄 → **7493줄** (-310줄)
- 진행률: 1.3% → **5.3%**

---

### 1.2 Step 5 - Data Loader 모듈화 🔴 High

**PLAN 근거**: 개발자 민수 - 함수 찾기 10분 → 10초
**목표**: 데이터 로딩 관련 함수 모듈화 (예상 **800줄** 감소)

**성공 조건**:
- src/modules/data-loader.js 생성
- 초기 로딩 3초 이내 (기존 유지)
- IndexedDB 캐싱 정상 작동

**요구사항**:
- [ ] DataLoader 클래스 생성
  - `loadInitial()` - CSV 데이터 초기 로딩
  - `buildTypeFromCsv()` - Type 시트 파싱
  - `buildIndexFromCsv()` - Index 시트 파싱
- [ ] IndexedDB 캐싱 로직 통합 (15개 함수)
  - `loadPlayersFromIndexedDB()`
  - `savePlayersToIndexedDB()`
  - `loadTablesFromIndexedDB()`
  - `saveTablesToIndexedDB()`
  - `safeIndexedDBOperation()`
- [ ] src/facades/data-facade.js 생성
  - 기존 함수명 유지 (onclick 호환)
- [ ] 검증: 앱 초기 로딩 플로우
  - 새로고침 → 3초 이내 로딩
  - 플레이어/테이블 데이터 정상 표시
  - IndexedDB 캐시 사용 확인

**의존성**: Step 3 (store.js) 완료됨

**예상 효과**:
- 7493줄 → **6693줄** (-800줄)
- 진행률: 5.3% → **15.4%**

---

### 1.3 Step 6 - Pot Calculator 모듈화 🔴 High

**PLAN 근거**: 개발자 민수 - 테스트 용이성
**목표**: 팟 계산 로직 모듈화 (예상 **300줄** 감소)

**성공 조건**:
- src/modules/pot-calculator.js 생성
- 팟 계산 정확도 100% (기존 유지)
- 복잡한 사이드팟 계산 정상

**요구사항**:
- [ ] PotCalculator 클래스 생성
  - `calculateAccuratePot()` - 정확한 팟 계산
  - `calculatePotWithCorrection()` - 오차 보정
  - `calculateSidePots()` - 사이드팟 계산
  - `calculatePlayerContributions()` - 플레이어별 기여도
  - `validatePotCalculation()` - 검증
- [ ] src/facades/pot-facade.js 생성
- [ ] 검증: 팟 계산 시나리오
  - 단순 팟 (1명 올인)
  - 사이드팟 (2명 이상 올인)
  - 복잡한 사이드팟 (3명 이상 다른 칩 스택)

**의존성**: Step 3 (store.js)

**예상 효과**:
- 6693줄 → **6393줄** (-300줄)
- 진행률: 15.4% → **19.2%**

---

### 1.4 Step 7 - Card Selector 모듈화 🟡 Medium

**PLAN 근거**: UI 독립성
**목표**: 카드 선택 UI 모듈화 (예상 **200줄** 감소)

**성공 조건**:
- src/modules/card-selector.js 생성
- 카드 선택 UI 정상 작동
- 터치/마우스 이벤트 정상

**요구사항**:
- [ ] CardSelector 클래스 생성
  - `openCardSelector()` - 모달 열기
  - `closeCardSelector()` - 모달 닫기
  - `handleCardSelection()` - 카드 선택 처리
  - `renderCardGrid()` - 카드 그리드 렌더링
- [ ] src/facades/card-facade.js 생성
- [ ] 검증: 카드 선택 플로우
  - Flop 카드 선택 (3장)
  - Turn 카드 선택 (1장)
  - River 카드 선택 (1장)
  - 플레이어 홀카드 선택 (2장)

**의존성**: Step 3 (store.js)

**예상 효과**:
- 6393줄 → **6193줄** (-200줄)
- 진행률: 19.2% → **21.7%**

---

### 1.5 Step 8 - Player Manager 모듈화 🟡 Medium

**PLAN 근거**: 협업 가능성 (모듈별 분리)
**목표**: 플레이어 관리 모듈화 (예상 **300줄** 감소)

**성공 조건**:
- src/modules/player-manager.js 생성
- 플레이어 CRUD 정상 작동
- Google Sheets 동기화 정상

**요구사항**:
- [ ] PlayerManager 클래스 생성
  - `addPlayer()` - 플레이어 추가
  - `updatePlayerChips()` - 칩 정보 수정
  - `deleteLocalPlayer()` - 플레이어 삭제
  - `renderPlayerList()` - 플레이어 목록 렌더링
  - `handlePlayerSelection()` - 플레이어 선택 처리
- [ ] src/facades/player-facade.js 생성
- [ ] 검증: 플레이어 관리 플로우
  - 플레이어 5명 추가
  - 칩 정보 수정 (3명)
  - 플레이어 2명 삭제
  - Google Sheets 동기화 확인

**의존성**: Step 3 (store.js), Step 5 (data-loader.js)

**예상 효과**:
- 6193줄 → **5893줄** (-300줄)
- 진행률: 21.7% → **25.5%**

---

## Phase 2: 액션 관리 및 대규모 분리

### 2.1 Step 9 - Action Manager 모듈화 🔴 High

**PLAN 근거**: 핵심 기능 (가장 복잡)
**목표**: 액션 관리 모듈화 (예상 **1000줄** 감소)

**성공 조건**:
- src/modules/action-manager.js 생성
- 모든 액션 타입 정상 작동
- 액션 순서 관리 정상

**요구사항**:
- [ ] ActionManager 클래스 생성 (25개 함수)
  - `addAutoAction()` - 자동 액션 추가
  - `handleAllIn()` - 올인 처리
  - `handleSmartCall()` - 스마트 콜 처리
  - `openQuickBetRaise()` - 빠른 벳/레이즈
  - `addAction()` - 액션 추가
  - `undoLastAction()` - 마지막 액션 취소
  - `validateAction()` - 액션 검증
  - 기타 20개 함수
- [ ] src/facades/action-facade.js 생성
- [ ] 검증: 모든 액션 타입 테스트
  - Check, Call, Fold
  - Bet, Raise
  - All-In
  - Smart Call
  - 액션 순서 자동 매핑

**의존성**: Step 3 (store.js), Step 6 (pot-calculator.js)

**예상 효과**:
- 5893줄 → **4893줄** (-1000줄)
- 진행률: 25.5% → **39.8%**

---

### 2.2 Step 10 - UI/Modal 유틸리티 모듈화 🟡 Medium

**PLAN 근거**: UI 독립성
**목표**: UI 유틸리티 모듈화 (예상 **600줄** 감소)

**성공 조건**:
- src/modules/ui-utils.js 생성
- 모든 모달 정상 작동
- 피드백 표시 정상

**요구사항**:
- [ ] UIUtils 클래스 생성 (20개 함수)
  - `openLogModal()`, `closeLogModal()`
  - `logMessage()`, `showFeedback()`
  - `lockUI()`, `unlockUI()`
  - `executeWithLock()`
  - `renderTableSelection()`, `renderTableGrid()`
  - 기타 UI 함수
- [ ] src/facades/ui-facade.js 생성
- [ ] 검증: 모든 모달/피드백 테스트

**의존성**: Step 3 (store.js)

**예상 효과**:
- 4893줄 → **4293줄** (-600줄)
- 진행률: 39.8% → **48.5%**

---

## Phase 3: 대규모 통합 및 최적화

### 3.1 Step 11 - 나머지 함수 일괄 모듈화 🔴 High

**PLAN 근거**: 목표 달성 (1000줄 이하)
**목표**: 남은 모든 함수 모듈화 (예상 **3200줄** 감소)

**성공 조건**:
- index.html JavaScript: **200줄 이하**
- 전체 목표 달성: 7909줄 → **1000줄 이하**

**요구사항**:
- [ ] 모든 남은 함수 분류 및 모듈화
  - 테이블 관리 관련
  - 설정 관련
  - 기타 유틸리티
- [ ] 중복 코드 제거
- [ ] Dead code 제거 (사용하지 않는 함수)
- [ ] 최종 검증: 전체 플로우 테스트

**의존성**: Step 1-10 완료

**예상 효과**:
- 4293줄 → **1093줄** (-3200줄)
- 진행률: 48.5% → **86.2%**

---

### 3.2 Step 12 - 최종 최적화 🟡 Medium

**PLAN 근거**: 목표 100% 달성
**목표**: 1000줄 이하 확정 (예상 **93줄** 감소)

**성공 조건**:
- index.html: **1000줄 이하**
- JavaScript: **200줄 이하**
- 진행률: **87%** 이상

**요구사항**:
- [ ] HTML 중복 제거
- [ ] 인라인 스타일 제거 (CSS로 이동)
- [ ] 주석 제거 (문서화는 별도 파일)
- [ ] 공백 정리
- [ ] 최종 통합 테스트 (30분)

**의존성**: Step 11 완료

**예상 효과**:
- 1093줄 → **1000줄** (-93줄)
- 진행률: 86.2% → **87.0%**
- **🎉 목표 달성!**

---

## 📋 전체 로드맵

| Phase | Step | 작업 | 예상 감소 | 누적 줄 수 | 진행률 | 우선순위 |
|-------|------|------|----------|-----------|--------|---------|
| 0 | 초기 | - | - | 7909 | 0% | - |
| 0 | Step 1-4 | 완료 | 106줄 | 7803 | 1.3% | - |
| 1 | Step 4 확장 | Hand Recorder 완전 분리 | 300줄 | 7493 | 5.3% | 🔴 High |
| 1 | Step 5 | Data Loader | 800줄 | 6693 | 15.4% | 🔴 High |
| 1 | Step 6 | Pot Calculator | 300줄 | 6393 | 19.2% | 🔴 High |
| 1 | Step 7 | Card Selector | 200줄 | 6193 | 21.7% | 🟡 Medium |
| 1 | Step 8 | Player Manager | 300줄 | 5893 | 25.5% | 🟡 Medium |
| 2 | Step 9 | Action Manager | 1000줄 | 4893 | 39.8% | 🔴 High |
| 2 | Step 10 | UI/Modal | 600줄 | 4293 | 48.5% | 🟡 Medium |
| 3 | Step 11 | 나머지 일괄 | 3200줄 | 1093 | 86.2% | 🔴 High |
| 3 | Step 12 | 최종 최적화 | 93줄 | 1000 | 87.0% | 🟡 Medium |

**총 예상 감소**: 6803줄
**목표**: 1000줄 이하
**예상 소요**: 21일 (3주)

---

## 🎯 다음 작업 (최우선)

### 🚨 방안 1 선택: Step 4 확장 (권장)

**지금 당장 해야 할 일**:
1. [ ] NEXT_SESSION_PLAN.md 읽기
2. [ ] 전략 결정: **방안 1** 선택
3. [ ] Step 4 확장 작업 시작
   - generateRows_v46() 분리
   - buildIndexMeta() 분리
   - buildTypeUpdates() 분리
   - _sendDataToGoogleSheet_internal() 리팩토링
4. [ ] 검증: 핸드 전송 테스트
5. [ ] Git Commit: "Step 4 확장: Hand Recorder 완전 분리 (+300줄)"

**예상 시간**: 4-6시간
**예상 효과**: 1.3% → 5.3% (4배 향상)

---

## ✅ 완료 기준

### 각 Step 완료 기준
- [ ] 코드 수정 완료
- [ ] Git Commit 1개 (롤백 포인트)
- [ ] 검증 체크리스트 100% 통과
- [ ] 콘솔 에러 0개
- [ ] 핵심 기능 정상 작동

### 전체 프로젝트 완료 기준
- [ ] index.html: 1000줄 이하
- [ ] JavaScript: 200줄 이하
- [ ] 모든 기능 100% 정상 작동
- [ ] 성능 저하 없음 (오히려 개선)
- [ ] 최종 통합 테스트 통과 (30분)

---

## 🚫 완료 후 삭제 규칙

**PRD는 "할 일"만 유지**:
- ✅ 완료된 Step → CHANGELOG.md로 이동
- ✅ 완료된 요구사항 → 체크박스 삭제

**현재 상태**:
- Step 1-4: 완료 (CHANGELOG로 이동 예정)
- Step 4 확장 ~ Step 12: 진행 중 (PRD 유지)

---

**다음 세션**: NEXT_SESSION_PLAN.md 읽고 **방안 1** 선택 후 즉시 Step 4 확장 시작!
