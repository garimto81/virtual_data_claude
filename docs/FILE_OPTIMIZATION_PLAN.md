# 파일 최적화 계획

> 소스 파일 분석 및 최적화 전략

## 📊 현재 상황

### 파일 구조
```
src/
├── core/store.js (141줄) ✅ 완료
├── modules/
│   ├── pure-utils.js (70줄) ✅ 완료
│   └── hand-recorder.js (62줄) ✅ 완료
├── facades/
│   └── hand-facade.js (29줄) ✅ 완료
├── js/ (9개 파일, 추정 2500줄)
│   ├── action-order-manager-v2.js (~500줄)
│   ├── cache-manager.js (~200줄)
│   ├── constants.js (~150줄)
│   ├── errorHandler.js (~300줄)
│   ├── modal-auto-close.js (212줄)
│   ├── logger.js (~150줄)
│   ├── lazy-loader.js (194줄)
│   ├── performance-monitor.js (~300줄)
│   └── phase4-functions.js (~500줄)
└── utils/ (3개 파일, 681줄)
    ├── formatters.js (160줄)
    ├── helpers.js (281줄)
    └── validators.js (240줄)
```

**총 추정**: ~3500줄 (외부 파일)

---

## 🎯 최적화 전략

### Phase 1: 즉시 제거 (미사용 파일)

#### 1.1 lazy-loader.js 제거 (194줄)
**판단 근거**:
- 지연 로딩 시스템이지만 index.html에서 사용 흔적 없음
- ES6 모듈 import가 이미 지연 로딩 역할 수행
- 중복 기능

**액션**:
```bash
mv src/js/lazy-loader.js docs/archive/lazy-loader.js.old
```

#### 1.2 performance-monitor.js 제거 (~300줄)
**판단 근거**:
- 성능 모니터링 도구이지만 실제 사용 안 함
- 프로덕션 환경에서 불필요
- 디버깅 시에만 필요한 기능

**액션**:
```bash
mv src/js/performance-monitor.js docs/archive/performance-monitor.js.old
```

#### 1.3 modal-auto-close.js 정리 (212줄)
**판단 근거**:
- 일괄 등록 성공 후 모달 자동 닫기 기능
- 매우 specific한 기능 (범용성 낮음)
- index.html 내부로 통합 가능 (onclick 이벤트 처리)

**액션**:
- index.html 검색하여 사용 여부 확인
- 미사용 시 제거, 사용 시 index.html로 통합

**예상 감소**: 194 + 300 + 212 = **706줄**

---

### Phase 2: 통합 (중복 제거)

#### 2.1 formatters.js → pure-utils.js 통합 (160줄)

**중복 함수**:
- `formatChips()` - 이미 pure-utils.js에 존재
- `formatCardDisplay()` - 이미 pure-utils.js에 존재

**추가 함수**:
- `formatNumber()`, `unformatNumber()` - 유용
- `pad4()` - 유용
- `formatDate()`, `formatTime()` 등 - 유용

**액션**:
1. 중복 함수 제거 (formatChips, formatCardDisplay)
2. 나머지 함수를 pure-utils.js에 추가
3. formatters.js 삭제

**예상 감소**: 160줄 (통합 후 pure-utils.js +100줄, 순 감소 60줄)

#### 2.2 constants.js → store.js 통합 (~150줄)

**내용**:
- APP_CONFIG - store.config와 중복
- POKER_CONFIG - 포커 게임 상수
- 기타 상수들

**액션**:
1. APP_CONFIG는 store.js의 config에 이미 존재
2. POKER_CONFIG, VALIDATION_RULES 등을 store.js에 추가
3. constants.js 삭제

**예상 감소**: 150줄 (통합 후 store.js +80줄, 순 감소 70줄)

**Phase 2 예상 감소**: 60 + 70 = **130줄**

---

### Phase 3: Step 5-12 리팩토링과 통합

#### 3.1 phase4-functions.js → data-loader.js (Step 5)
**내용**: API 호출 보호 시스템 (~500줄)
**액션**: Step 5 (Data Loader) 작업 시 함께 모듈화

#### 3.2 action-order-manager-v2.js → action-manager.js (Step 9)
**내용**: 액션 순서 관리 (~500줄)
**액션**: Step 9 (Action Manager) 작업 시 함께 모듈화

#### 3.3 cache-manager.js
**내용**: 메모리 캐싱 시스템 (~200줄)
**판단**: IndexedDB 사용 중이라 메모리 캐시 중복 가능
**액션**: 사용 여부 확인 후 제거 또는 유지

#### 3.4 errorHandler.js
**내용**: 에러 처리 시스템 (~300줄)
**판단**: 유용하지만 index.html에 이미 에러 처리 존재
**액션**: 중복 확인 후 통합 또는 유지

#### 3.5 logger.js
**내용**: 로깅 시스템 (~150줄)
**판단**: 개발 환경에서 유용
**액션**: 유지 (프로덕션에서 console.log 자동 제거)

---

### Phase 4: utils 폴더 정리

#### 4.1 helpers.js (281줄)
**내용**: 범용 헬퍼 함수 (sleep, debounce, deepClone 등)
**판단**: 많은 함수가 사용 중
**액션**: 유지 (사용 빈도 높음)

#### 4.2 validators.js (240줄)
**내용**: 입력 검증 함수
**판단**: 폼 검증 필수
**액션**: 유지 (검증 로직 중요)

---

## 📋 실행 계획

### 즉시 실행 (Phase 1)

**Step 1**: 미사용 파일 제거
```bash
# 아카이브 폴더로 이동
mv src/js/lazy-loader.js docs/archive/
mv src/js/performance-monitor.js docs/archive/

# modal-auto-close.js 사용 여부 확인
grep -r "autoCloseManagementModal" index.html
grep -r "modal-auto-close" index.html

# 미사용 시 아카이브
mv src/js/modal-auto-close.js docs/archive/
```

**Step 2**: formatters.js 통합
1. formatters.js의 유용한 함수를 pure-utils.js에 복사
2. 중복 함수 제거
3. formatters.js 삭제
4. index.html에서 import 제거

**Step 3**: constants.js 통합
1. POKER_CONFIG, VALIDATION_RULES를 store.js에 추가
2. constants.js 삭제
3. index.html에서 import 제거

**예상 효과**: 706 + 130 = **836줄 감소**

---

### Step 5-12와 함께 진행 (Phase 3)

각 Step 작업 시 해당 파일 통합:
- Step 5: phase4-functions.js → data-loader.js
- Step 9: action-order-manager-v2.js → action-manager.js
- Step 5-12: cache-manager.js, errorHandler.js 사용 여부 확인

---

## ✅ 최종 목표 구조

```
src/
├── core/
│   └── store.js (220줄) - 상태 + 상수 통합
├── modules/
│   ├── pure-utils.js (170줄) - 순수 함수 + formatters 통합
│   ├── hand-recorder.js (62줄)
│   ├── data-loader.js (800줄) - Step 5
│   ├── pot-calculator.js (300줄) - Step 6
│   ├── card-selector.js (200줄) - Step 7
│   ├── player-manager.js (300줄) - Step 8
│   ├── action-manager.js (1000줄) - Step 9 + action-order-manager 통합
│   └── ui-utils.js (600줄) - Step 10
├── facades/
│   └── *.js (각 50줄)
└── utils/
    ├── helpers.js (281줄) ✅ 유지
    └── validators.js (240줄) ✅ 유지
```

**총 외부 파일**: ~4300줄 (현재 ~3500줄에서 증가, 하지만 index.html에서 대폭 감소)

---

## 📊 예상 효과

| Phase | 작업 | 파일 감소 | 줄 수 감소 |
|-------|------|----------|----------|
| Phase 1 | 미사용 파일 제거 | -3개 | -706줄 |
| Phase 2 | 중복 제거 (통합) | -2개 | -130줄 |
| Phase 3 | Step 5-12 통합 | -2개 | -1000줄 (index.html에서) |
| **합계** | - | **-7개** | **-1836줄** |

**최종**:
- 외부 파일: 16개 → 9개
- index.html: 7803줄 → ~6000줄 (Phase 1-2 후) → 1000줄 (Step 5-12 후)

---

## 🚀 다음 액션

1. **즉시**: Phase 1 실행 (미사용 파일 제거)
2. **다음**: Phase 2 실행 (formatters, constants 통합)
3. **이후**: Step 4 확장 → Step 5-12 진행

**예상 시간**: Phase 1-2 약 2시간
