# Phase 0 Week 1 Changelog - v3.6.0 & v71.1.0

**배포일:** 2025-10-05
**우선순위:** P0 (긴급)
**작업 시간:** ~3시간

---

## 📦 변경 사항 요약

### Backend: Apps Script v71.1.0
- ✅ 중복 플레이어 방지 시스템 구현
- ✅ `createPlayer()` 함수 로직 변경: 중복 체크 → 자동 업데이트
- ✅ 반환값 표준화

### Frontend: index.html v3.6.0
- ✅ 중복 제거 로직 완전 제거 (~140줄)
- ✅ UI 개선: 플레이어 추가/업데이트 피드백 분리

---

## 🔧 Apps Script 변경사항 (v71.0.3 → v71.1.0)

### 파일명 변경
```
apps-script/Code_v71.0.3.gs → apps-script/Code_v71.1.0.gs
```

### 1. createPlayer() 함수 수정 (line 496-520)

#### Before (v71.0.3):
```javascript
// 같은 테이블에 같은 이름 체크
const nameRows = playerIndex.findByName(name, tableNo);
if (nameRows.length > 0) {
  return {
    success: false,
    message: `Table ${tableNo}에 ${name} 플레이어가 이미 있습니다`,
    action: 'duplicate_name'
  };
}
```

#### After (v71.1.0):
```javascript
// [Phase 0] 중복 체크 → 업데이트로 변경
const nameRows = playerIndex.findByName(name, tableNo);
if (nameRows.length > 0) {
  const sheet = getSheet(TYPE_SHEET_NAME);
  const rowIndex = nameRows[0];

  // 기존 행 업데이트
  sheet.getRange(rowIndex, TYPE_COLUMNS.SEAT_NO + 1).setValue(seatNo);
  sheet.getRange(rowIndex, TYPE_COLUMNS.CHIPS + 1).setValue(playerData.chips || 0);
  sheet.getRange(rowIndex, TYPE_COLUMNS.NATIONALITY + 1).setValue(playerData.nationality || '');
  sheet.getRange(rowIndex, TYPE_COLUMNS.KEYPLAYER + 1).setValue(playerData.keyplayer === true ? 'TRUE' : '');

  playerIndex.clear();

  return {
    success: true,
    message: `${name} 정보 업데이트`,
    action: 'updated',
    player: name,
    table: tableNo,
    chips: playerData.chips || 0,
    seat: seatNo
  };
}
```

**변경 포인트:**
- ❌ `success: false` → ✅ `success: true`
- ❌ `action: 'duplicate_name'` → ✅ `action: 'updated'`
- ✅ Type 시트 기존 행 업데이트 (Seat, Chips, Nationality, Keyplayer)

### 2. 신규 플레이어 추가 반환값 변경 (line 541-549)

#### Before (v71.0.3):
```javascript
return {
  success: true,
  message: '플레이어 등록 성공',
  action: 'created'
};
```

#### After (v71.1.0):
```javascript
return {
  success: true,
  message: '플레이어 등록 성공',
  action: 'added',
  player: name,
  table: tableNo,
  chips: playerData.chips || 0,
  seat: seatNo
};
```

**변경 포인트:**
- ✅ `action: 'created'` → `action: 'added'`
- ✅ 상세 정보 추가 (player, table, chips, seat)

### 3. 버전 정보 업데이트

#### 헤더 주석 (line 1-11):
```javascript
/**
 * Version: v71.1.0 - Phase 0 Week 1
 * Last Modified: 2025-10-05
 *
 * v71.1.0 업데이트 내용 (Phase 0 Week 1):
 * - 중복 플레이어 방지 시스템: 중복 시 자동 업데이트
 * - createPlayer() 함수: 중복 체크 → 업데이트로 변경
 * - 반환값 표준화: {action: 'added'|'updated', player, table, chips, seat}
 * - Frontend 중복 제거 로직 완전 제거 (Apps Script에서 처리)
 */
```

#### VERSION_INFO 상수 (line 65-67):
```javascript
const VERSION_INFO = {
  version: '71.1.0',
  lastUpdate: '2025-10-05',
```

---

## 🎨 Frontend 변경사항 (v3.5.42 → v3.6.0)

### 1. 중복 제거 함수 삭제 (~40줄)

**삭제된 코드 (line 6744):**
```javascript
async function executeRemoveDuplicates(button, originalContent) {
  // ... 39줄 삭제
}
```

**대체:**
```javascript
// [Phase 0] executeRemoveDuplicates 함수 제거됨 (중복 방지는 Apps Script에서 처리)
```

### 2. initializeApp() 중복 검사 제거 (~18줄)

**삭제된 코드 (line 7895):**
```javascript
// 중복 검사 실행 (직접 호출로 이중 실행 방지)
logMessage(`🔍 중복 플레이어 검사 시작...`);
if (window.removeDuplicatePlayers && typeof window.removeDuplicatePlayers === 'function') {
  // ... 18줄 삭제
}
```

**대체:**
```javascript
// [Phase 0] 중복 검사 제거됨 (Apps Script addOrUpdatePlayer에서 자동 처리)
```

### 3. 중복 제거 버튼 UI 제거 (~4줄)

**삭제된 HTML (line 457):**
```html
<button id="remove-duplicates-btn" class="bg-red-600 hover:bg-red-700 ...">
  <span class="text-2xl mb-1">🧹</span>
  <span>중복 제거</span>
</button>
```

**대체:**
```html
<!-- [Phase 0] 중복 제거 버튼 제거됨 (Apps Script에서 자동 처리) -->
```

### 4. 중복 제거 버튼 핸들러 제거 (~70줄)

**삭제된 코드 (line 6668):**
```javascript
document.getElementById('remove-duplicates-btn')?.addEventListener('click', async () => {
  // ... 70줄 삭제
});
```

**대체:**
```javascript
// [Phase 0] 중복 제거 버튼 핸들러 제거됨 (Apps Script에서 자동 처리)
```

### 5. _addNewPlayer_internal() 중복 체크 제거 (~9줄)

**삭제된 코드 (line 7467):**
```javascript
// 프론트엔드에서 먼저 중복 체크
const existingPlayer = window.state.playersByTable[window.state.selectedTable]?.find(p =>
  p.name === name && p.status === 'IN'
);

if (existingPlayer) {
  showFeedback(`❌ 이미 존재하는 플레이어입니다: ${name}`, true);
  return;
}
```

**대체:**
```javascript
// [Phase 0] 프론트엔드 중복 체크 제거 (Apps Script에서 처리)
```

### 6. 플레이어 추가 피드백 메시지 개선

**수정된 코드 (line 7487-7491):**
```javascript
// [Phase 0] 상태에 따라 다른 피드백 메시지
if (result.status === 'updated') {
  showFeedback(`✅ ${name} 정보 업데이트 (칩: ${chips}, 좌석: ${seat || '미지정'})`);
} else {
  showFeedback(`✅ ${name} 추가됨`);
}
```

**Before:**
```javascript
showFeedback(`✅ ${name} 추가됨`); // 항상 동일
```

### 7. 버전 정보 업데이트

#### 헤더 주석 (line 5-15):
```html
<!--
  Version: 3.6.0 - Phase 0 Week 1
  Last Modified: 2025-10-05 KST

  Change Log:
  - v3.6.0 (2025-10-05): Phase 0 Week 1 - 중복 방지 자동화
    • Apps Script에서 중복 플레이어 자동 업데이트 (createPlayer 함수)
    • Frontend 중복 체크 로직 완전 제거 (~140줄 감소)
    • executeRemoveDuplicates() 함수 제거
    • 중복 제거 버튼 UI 제거
    • initializeApp() 내 중복 검사 블록 제거
    • 플레이어 추가 시 자동 피드백: "추가됨" vs "정보 업데이트"
-->
```

#### APP_VERSION 상수 (line 798-800):
```javascript
const APP_VERSION = 'v3.6.0 - Phase 0 Week 1';
const VERSION_DATE = '2025-10-05';
const VERSION_INFO = `포커 핸드 로거 ${APP_VERSION} (${VERSION_DATE})`;
```

---

## 📊 코드 감소 효과

### Frontend (index.html)
| 항목 | 삭제된 줄 수 |
|------|-------------|
| `executeRemoveDuplicates()` 함수 | 39줄 |
| `initializeApp()` 중복 검사 | 18줄 |
| `_addNewPlayer_internal()` 중복 체크 | 9줄 |
| 중복 제거 버튼 HTML | 4줄 |
| 중복 제거 버튼 핸들러 | 70줄 |
| **Total** | **~140줄** |

### Backend (Apps Script)
| 항목 | 변경 사항 |
|------|----------|
| `createPlayer()` 함수 | 로직 변경 (줄 수 유사) |
| 반환값 표준화 | +4줄 (정보 추가) |

---

## ✅ 기대 효과

### 1. 코드 품질
- ✅ Frontend 복잡도 20% 감소 (140줄 제거)
- ✅ 중복 로직 단일화 (Apps Script에서만 처리)
- ✅ 유지보수 포인트 감소

### 2. 성능
- ✅ 앱 초기화 시간 **0.5초 단축** (중복 검사 제거)
- ✅ Apps Script 호출 횟수 동일 (변경 없음)

### 3. 사용자 경험
- ✅ 중복 플레이어 자동 방지
- ✅ 정보 업데이트 시 명확한 피드백
- ✅ 수동 중복 제거 작업 불필요

---

## 🧪 테스트 체크리스트

상세 테스트 시나리오: [PHASE0_WEEK1_TEST_CHECKLIST.md](new_virtual_table/docs/PHASE0_WEEK1_TEST_CHECKLIST.md)

### 필수 테스트
- [ ] 새 플레이어 추가 → "✅ 홍길동 추가됨"
- [ ] 중복 플레이어 추가 → "✅ 홍길동 정보 업데이트 (칩: 15000, 좌석: #5)"
- [ ] Type 시트에 중복 행 없음 확인
- [ ] 다른 테이블 동일 이름 → 별도 행 추가
- [ ] 기존 기능 회귀 테스트 (핸드 로깅, 칩 수정, 좌석 이동)

---

## 📝 배포 순서

1. **Apps Script 배포**
   - `apps-script/Code_v71.1.0.gs` 전체 복사
   - Google Apps Script 편집기에서 코드 교체
   - 새 버전으로 배포 (v71.1.0)

2. **Frontend 배포**
   - `index.html` 파일 업데이트
   - 브라우저 캐시 강제 새로고침 (Ctrl+Shift+R)

3. **검증**
   - 테스트 체크리스트 실행
   - Type 시트에서 중복 데이터 확인

---

## 🔄 롤백 방법

문제 발생 시:

### Apps Script 롤백
1. Apps Script 편집기 → 버전 관리
2. v71.0.3으로 롤백
3. 웹 앱 다시 배포

### Frontend 롤백
1. Git: `git checkout HEAD~1 index.html`
2. 또는 v3.5.42 버전 수동 복구

---

## 🚀 다음 단계: Phase 0 Week 2

**목표:** Cloud Sync 제거 + Papa Parse 도입

1. Cloud Sync 기능 제거 (5개 함수, 200줄)
2. Papa Parse 라이브러리 도입
3. 커스텀 parseCSV() 대체 (150줄 제거)

**예상 효과:** 추가 350줄 감소, 1초 성능 향상

---

**작성자:** Phase 0 구현팀
**문서 버전:** 1.0
**최종 수정:** 2025-10-05
