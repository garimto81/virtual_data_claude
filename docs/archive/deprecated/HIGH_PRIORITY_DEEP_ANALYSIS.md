# High Priority 심층 분석

[이전 FUNCTION_REGISTRY.md 내용 + 아래 내용 추가]

## 3. 팟 계산 함수 통합 분석 (계속)

### 📊 함수 호출 위치 정리

```
calculateActualPot() - 2개 호출
  ├─ calculateFinalPot() (2376줄) - renderBoard() 내부, UI 표시용
  └─ renderActionStreets() (2418줄) - 액션 로그 표시용

calculateAccuratePot() - 1개 호출
  └─ calculatePotSize() (4177줄) 내부

calculatePotWithCorrection() - 2개 호출
  ├─ calculateActualPot() (4173줄) - 조건부 호출
  └─ calculatePotSize() (미사용, calculateAccuratePot 호출)

calculatePotSize() - 4번째 함수! (4316줄)
  └─ 가장 복잡한 로직: Pot Correction 지원
  └─ UI 표시용
```

### 🔍 calculatePotSize() 상세 분석

**특별한 기능: "Pot Correction"**
```javascript
// "Pot Correction" 액션이 있으면, 그 시점부터 팟 재계산
// 예: 중간에 실수로 잘못된 금액 입력 시 보정

액션 로그:
Preflop: SB $10, BB $20, Alice Raise $100
[Pot Correction: $500] ← 여기서 팟을 $500로 강제 설정
Flop: Bob Bet $200
→ 최종 팟 = $500 + $200 = $700
```

**이 기능이 필요한 이유:**
- 라이브 포커: 딜러가 팟을 수동으로 세는 경우
- 핸드 중간에 팟 크기가 불확실할 때 직접 입력

### 💡 최종 제안: 점진적 통합

**Week 1: 새 함수 추가**
```javascript
function calculatePot(options = {}) {
  const {
    includeSB = true,
    includeBB = true,
    includeAnte = true,
    deductUncalled = true,
    usePotCorrection = true
  } = options;

  let pot = 0;
  // ... (통합 로직)
  return pot;
}
```

**Week 2-3: 점진적 마이그레이션**
- 기존 3개 함수 유지
- 새 calculatePot() 추가
- A/B 테스트로 결과 비교

**삭제 예정:**
- calculateActualPot() - 20줄
- calculateAccuratePot() - 30줄
- calculatePotWithCorrection() - 25줄
- **총 75줄 제거**

---

## 4. 클라우드 동기화 분석

### 📌 기능 목적

**Apps Script URL을 여러 디바이스 간 동기화**

**시나리오:**
```
사용자: 집 PC, 회사 노트북, 스마트폰에서 앱 사용
문제: 각 디바이스마다 URL을 다시 입력해야 함
해결: 클라우드 동기화 (Config 시트 또는 GitHub Gist)
```

### 💡 최종 제안: 제거 및 단순화

**이유:**
1. Apps Script URL은 거의 변경 안 됨 (한 번 설정 → 영구 사용)
2. Config 시트로 기본 URL 제공 가능
3. QR 코드 공유 대안 존재

**제거할 함수 (5개):**
- generateDeviceId()
- saveConfigToCloud()
- syncCloudNow()
- resetCloudConfig()
- updateCloudSyncUI()

**유지할 함수:**
- loadDefaultUrlFromConfig() - Config 시트 기본 URL 로드
- updateAppsScriptUrl() - 단, 클라우드 동기화 부분 제거

**삭제 예상: 200줄**

---

## 📊 최종 요약

### High Priority 항목 처리 결과

| 항목 | 결론 | 코드 감소 | 복잡도 | 위험도 |
|------|------|-----------|--------|--------|
| **1. CSV → JSON API** | ❌ 보류, Papa Parse 도입 | -150줄 | 중 | 낮음 |
| **2. 중복 제거 자동화** | ✅ Apps Script 자동 방지 | -150줄 | 낮음 | 낮음 |
| **3. 팟 계산 통합** | ✅ 3개 → 1개 통합 | -75줄 | 높음 | 중간 |
| **4. 클라우드 동기화** | ✅ 제거 | -200줄 | 낮음 | 낮음 |
| **합계** | | **-575줄** | | |

### 즉시 실행 가능 (Phase 0)

#### Week 1
1. ✅ 중복 제거 자동화 (2시간)
2. ✅ 클라우드 동기화 제거 (1시간)

#### Week 2
3. ✅ Papa Parse 도입 (1시간)

#### Week 3
4. ⚠️ 팟 계산 통합 (4시간 - 테스트 필요)

### 예상 효과
- ✅ 575줄 코드 감소 (7,992줄 → 7,417줄, 7.2% 감소)
- ✅ 복잡도 20% 감소
- ✅ 앱 시작 시간 1-2초 단축
- ✅ Apps Script 호출 10% 감소
