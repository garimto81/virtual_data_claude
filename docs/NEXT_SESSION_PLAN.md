# 🚨 다음 세션 시작 전 필독

## 📊 현재 상황

### 완료된 작업 (2025-10-06)
- **Step 1**: 의존성 분석 ✅
- **Step 2**: 순수 함수 분리 (5개) ✅ -35줄
- **Step 3**: 전역 스토어 구축 ✅ -60줄
  - Fix: DEFAULT_APPS_SCRIPT_URL 추가
- **Step 4**: Hand Recorder Facade (부분) ✅ -11줄
  - ✅ fetch 로직만 모듈화
  - ❌ generateRows, buildIndexMeta 등은 미분리

**진행률**: 7909줄 → 7803줄 (-106줄, **1.3%**)

### 🚨 핵심 문제 발견

**목표 vs 현실**:
- **목표**: 7909줄 → **1000줄** (-6909줄, 87% 감소)
- **현재**: 겨우 106줄 감소 (1.3%)
- **부족**: 6803줄을 더 줄여야 함!

**현재 전략의 문제점**:
1. ❌ **너무 보수적**: Step 4에서 11줄만 감소 (예상 400줄)
2. ❌ **속도 너무 느림**: 이 속도로는 목표 달성 불가능
3. ❌ **Step 5-8 예상치도 부족**: 2250줄 감소 예상 → 실제 4659줄 더 필요

**index.html 구조**:
- HTML: ~800줄
- **JavaScript: 7015줄** ← 이 중 6000줄을 분리해야 함

## 🔍 과거 실패 경험 (사용자 제공)

**대규모 JS 분리 시도 → 실패**:
- 무지성 분리 → 의존성/인과관계 문제
- 7000줄을 한 번에 옮기면 추적 불가능
- 어디서 꼬이는지 디버깅 어려움

**교훈**:
- ✅ 점진적 접근 필요
- ✅ 의존성 파악 후 분리
- ❌ BUT, 너무 보수적이면 목표 달성 불가

## 💡 다음 세션 전략 (선택 필요)

### 방안 1: Step 4 확장 (권장 ⭐)
**지금 당장 Step 4를 확장해서 Hand Recorder 전체 분리**

**분리 대상**:
- ✅ fetch 로직 (완료)
- ❌ `generateRows_v46()` (~140줄) ← index.html:5055-5187
- ❌ `buildIndexMeta()` (~60줄) ← index.html:5295-5349
- ❌ `buildTypeUpdates()` (~20줄) ← index.html:5351-5364
- ❌ `_sendDataToGoogleSheet_internal()` (~90줄) ← index.html:5192-5285

**예상 효과**: Step 4에서 +300줄 추가 감소 (총 ~310줄)

**안전성**:
- ✅ 모두 Hand 관련 함수 (응집도 높음)
- ✅ 의존성 명확 (window.state, store 사용)
- ✅ 검증 가능 (핸드 전송 테스트)

### 방안 2: Step 5-8 공격적 진행
**각 Step에서 800-1000줄씩 적극 분리**

- Step 5: Data Loader - 1000줄 목표
- Step 6: Pot Calculator - 800줄 목표
- Step 7: Card Selector - 600줄 목표
- Step 8: Player Manager - 600줄 목표

**위험**: 의존성 복잡할 경우 롤백 빈번

### 방안 3: 전략 재수립
**Step 1-8 전체를 재설계**

- 의존성 맵(DEPENDENCY_MAP.md) 재분석
- 더 큰 단위로 묶어서 분리
- 새로운 Step 계획 수립

## 📝 다음 세션 TODO

1. **전략 결정**:
   - [ ] 방안 1, 2, 3 중 선택
   - [ ] 선택 이유 명확히 정리

2. **방안 1 선택 시** (권장):
   - [ ] generateRows_v46() 분리 (hand-recorder.js로)
   - [ ] buildIndexMeta() 분리
   - [ ] buildTypeUpdates() 분리
   - [ ] _sendDataToGoogleSheet_internal() 리팩토링
   - [ ] 검증 (핸드 전송 테스트)
   - [ ] 예상 감소: ~300줄 추가

3. **방안 2 선택 시**:
   - [ ] Step 5 설계 강화
   - [ ] 800-1000줄 분리 계획 수립
   - [ ] 의존성 체크리스트 작성

4. **방안 3 선택 시**:
   - [ ] DEPENDENCY_MAP.md 재분석
   - [ ] 새로운 모듈 구조 설계
   - [ ] Step 1-8 재정의

## 🎯 최종 목표 확인

**반드시 달성해야 할 것**:
- index.html: 7909줄 → **1000줄 이하**
- JavaScript: 7015줄 → **200줄 이하** (HTML 800줄 유지)
- 6000줄 이상을 외부 모듈로 분리

**성공 기준**:
- ✅ 모든 기능 정상 작동
- ✅ 의존성 명확
- ✅ 유지보수 가능
- ✅ 검증 통과

## 📌 참고 파일

- [docs/analysis/DEPENDENCY_MAP.md](docs/analysis/DEPENDENCY_MAP.md) - 의존성 분석
- [docs/STEP_BY_STEP_REFACTORING.md](docs/STEP_BY_STEP_REFACTORING.md) - 상세 가이드
- [README.md](README.md) - 현재 진행 상황

---

**다음 세션 시작 시 이 파일을 먼저 읽고 전략을 결정한 후 작업을 시작하세요!**
