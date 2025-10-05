# 🔄 Step-by-Step 리팩토링 (검증 기반)

> **원칙**: 각 Step 완료 → 사용자 검증 → 성공/실패 판단 → 다음 Step 또는 롤백

## 📋 전체 프로세스

```
Step N 시작
  ↓
코드 수정
  ↓
Git Commit (rollback point)
  ↓
🔍 사용자 검증 (체크리스트)
  ↓
  ├─ ✅ 성공 → 다음 Step
  └─ ❌ 실패 → 즉시 롤백 → 대책 수립 → 재시도
```

---

## 📍 Step 1: 의존성 분석 (1일)

### 1.1 작업 내용
```bash
# 1. 분석 폴더 생성
mkdir -p docs/analysis

# 2. 전역 변수 추출
grep -o "window\.[a-zA-Z_][a-zA-Z0-9_]*" index.html | sort -u > docs/analysis/globals.txt

# 3. 함수 목록 추출
grep -n "function [a-zA-Z_]" index.html > docs/analysis/functions.txt

# 4. onclick 이벤트 추출
grep -o 'onclick="[^"]*"' index.html | sort -u > docs/analysis/onclick-events.txt

# 5. 의존성 맵 작성
cat > docs/analysis/DEPENDENCY_MAP.md << 'EOF'
# 의존성 분석 결과

## 전역 변수 (22개)
- window.state (참조 350회)
- window.APPS_SCRIPT_URL (참조 45회)
...

## 함수 호출 관계
loadInitial() 호출:
  → buildTypeFromCsv()
  → initializeIndexedDB()
...
EOF
```

### 1.2 Git Commit
```bash
git add docs/analysis/
git commit -m "Step 1: 의존성 분석 완료

- globals.txt: 전역 변수 22개 추출
- functions.txt: 함수 129개 목록
- onclick-events.txt: 이벤트 50개
- DEPENDENCY_MAP.md: 의존성 그래프
"
```

### 1.3 사용자 검증 체크리스트

```markdown
## ✅ Step 1 검증 (코드 수정 없음)

- [ ] docs/analysis/ 폴더 생성 확인
- [ ] globals.txt 파일 존재 (22줄 이상)
- [ ] functions.txt 파일 존재 (100줄 이상)
- [ ] onclick-events.txt 파일 존재 (40줄 이상)
- [ ] DEPENDENCY_MAP.md 가독성 확인

✅ 모두 통과 → Step 2 진행
❌ 하나라도 실패 → 아래 "실패 시 대응" 참고
```

### 1.4 실패 시 대응

| 실패 케이스 | 원인 | 대책 |
|-----------|------|------|
| globals.txt 빈 파일 | grep 패턴 오류 | 수동으로 검색: `Ctrl+F "window."` |
| functions.txt 너무 많음 | 중첩 함수 포함 | `grep -n "^  function"` 재실행 |
| DEPENDENCY_MAP.md 미작성 | 시간 부족 | 간단 버전만: 상위 10개 함수만 |

### 1.5 롤백 (필요 시)
```bash
# 분석 파일만 삭제 (코드 수정 없으므로 안전)
rm -rf docs/analysis/
git reset --hard HEAD~1
```

---

## 📍 Step 2: 순수 함수 분리 (2일)

### 2.1 작업 내용
```bash
# 1. 모듈 폴더 생성
mkdir -p src/modules

# 2. 순수 함수 파일 생성
cat > src/modules/pure-utils.js << 'EOF'
/**
 * 순수 함수 모음 (외부 의존성 없음)
 */

export function parseSeatNumber(seat) {
  return parseInt(seat.replace(/[^0-9]/g, '')) || 0;
}

export function compareSeatNumbers(a, b) {
  return parseSeatNumber(a) - parseSeatNumber(b);
}

export function formatChips(chips) {
  if (!chips) return '0';
  return chips.toLocaleString();
}

// ... 기타 순수 함수 (10개)
EOF
```

```html
<!-- 3. index.html 수정 (라인 220 근처) -->
<!-- 기존 외부 스크립트 아래 추가 -->
<script type="module">
  // 순수 함수 임포트
  import * as PureUtils from './src/modules/pure-utils.js';

  // 전역 노출 (onclick 호환성)
  Object.assign(window, PureUtils);

  console.log('[Step 2] 순수 함수 모듈 로드 완료');
</script>

<!-- 4. index.html에서 기존 함수 제거 (주석 처리) -->
<script>
  // ❌ 제거됨 (pure-utils.js로 이동)
  // function parseSeatNumber(seat) { ... }
  // function compareSeatNumbers(a, b) { ... }
  // function formatChips(chips) { ... }
</script>
```

### 2.2 Git Commit
```bash
git add src/modules/pure-utils.js
git add index.html
git commit -m "Step 2: 순수 함수 분리 (10개)

- src/modules/pure-utils.js 생성
- parseSeatNumber, compareSeatNumbers 등 10개 이동
- index.html에서 해당 함수 제거 (~100줄)
- window 전역 노출로 onclick 호환성 유지
"
```

### 2.3 사용자 검증 체크리스트

```markdown
## ✅ Step 2 검증

### A. 콘솔 확인
- [ ] 브라우저 열기: http://localhost:3000
- [ ] F12 → Console 탭
- [ ] "[Step 2] 순수 함수 모듈 로드 완료" 메시지 확인
- [ ] 에러 메시지 0개

### B. 함수 호출 테스트
F12 Console에서 입력:
```javascript
// 1. parseSeatNumber 테스트
parseSeatNumber('#5')  // 결과: 5
parseSeatNumber('Seat 10')  // 결과: 10

// 2. formatChips 테스트
formatChips(1000)  // 결과: "1,000"
formatChips(500000)  // 결과: "500,000"

// 3. 전역 접근 확인
window.parseSeatNumber  // 결과: function
```

### C. UI 기능 테스트
- [ ] 앱 초기 로딩 정상
- [ ] 플레이어 목록 표시 정상
- [ ] 좌석 번호 정렬 정상 (parseSeatNumber 사용)
- [ ] 칩 포맷 표시 정상 (formatChips 사용)

### D. onclick 이벤트 테스트
- [ ] 아무 버튼이나 클릭 → 에러 없음

✅ 모두 통과 (A+B+C+D) → Step 3 진행
❌ 하나라도 실패 → 아래 "실패 시 대응" 참고
```

### 2.4 실패 시 대응

| 실패 케이스 | 증상 | 원인 | 대책 |
|-----------|------|------|------|
| **A. 모듈 로드 실패** | 콘솔: "Failed to load module" | CORS 에러 | `npm start` 서버 실행 확인 |
| **B. 함수 undefined** | `parseSeatNumber is not defined` | 전역 노출 실패 | `Object.assign(window, PureUtils)` 확인 |
| **C. 좌석 정렬 깨짐** | 좌석 순서 랜덤 | 함수 로직 오류 | pure-utils.js 코드 재확인 |
| **D. onclick 에러** | "function is not defined" | 전역 노출 누락 | window에 수동 할당 추가 |

### 2.5 롤백 절차
```bash
# 1. 즉시 롤백
git reset --hard HEAD~1

# 2. 파일 확인
ls src/modules/  # 비어있음 (롤백 성공)
grep "parseSeatNumber" index.html  # 원래 함수 존재

# 3. 브라우저 새로고침 (Ctrl+Shift+R)
# 4. 기능 정상 작동 확인

# 5. 대책 수립 후 재시도
```

### 2.6 대책 수립 예시
```markdown
## 실패: "parseSeatNumber is not defined"

**원인 분석**:
- Object.assign(window, PureUtils) 실행 시점 문제
- 모듈 로딩이 비동기라 즉시 사용 불가

**대책**:
```javascript
// Before (실패)
<script type="module">
  import * as PureUtils from './src/modules/pure-utils.js';
  Object.assign(window, PureUtils);
</script>
<script>
  parseSeatNumber('#5');  // ❌ undefined
</script>

// After (성공)
<script type="module">
  import * as PureUtils from './src/modules/pure-utils.js';
  Object.assign(window, PureUtils);

  // DOM 로딩 후 초기화
  window.addEventListener('DOMContentLoaded', () => {
    console.log('모듈 준비 완료');
  });
</script>
<script defer>  // ← defer 추가
  parseSeatNumber('#5');  // ✅ 작동
</script>
```

**재시도**:
```bash
# 수정 후
git add index.html
git commit -m "Step 2 재시도: defer 속성 추가"
# → 검증 다시 진행
```
```

---

## 📍 Step 3: 전역 스토어 구축 (3일)

### 3.1 작업 내용
```bash
# 1. core 폴더 생성
mkdir -p src/core

# 2. 스토어 파일 생성
cat > src/core/store.js << 'EOF'
/**
 * 중앙 상태 관리 스토어
 * 기존 window.* 의존성 제거
 */
class AppStore {
  constructor() {
    // 기존 window.state 통합
    this.state = {
      currentStreet: 'preflop',
      playerDataByTable: {},
      indexRows: [],
      playersInHand: [],
      actionState: {
        handNumber: '',
        smallBlind: '',
        bigBlind: '',
        hasBBAnte: false,
        preflop: [],
        flop: [],
        turn: [],
        river: [],
      },
      chipColors: [],
      // ... 기존 window.state 내용 전체 복사
    };

    // 설정 값
    this.config = {
      appsScriptUrl: localStorage.getItem('appsScriptUrl') || '',
      spreadsheetId: '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U',
    };

    // 객체 인스턴스
    this.instances = {
      actionOrderManager: null,
    };
  }

  getState() {
    return this.state;
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
  }

  getConfig(key) {
    return this.config[key];
  }

  setConfig(key, value) {
    this.config[key] = value;
  }
}

export const store = new AppStore();

// 개발자 디버깅용
window.__store__ = store;
EOF
```

```html
<!-- 3. index.html 수정 -->
<script type="module">
  import { store } from './src/core/store.js';

  // ✅ 기존 코드 호환성 유지
  window.state = store.state;  // ⚠️ 임시 (점진적 제거 예정)
  window.APPS_SCRIPT_URL = store.getConfig('appsScriptUrl');

  console.log('[Step 3] 중앙 스토어 초기화 완료');
</script>

<!-- 4. 기존 window.state 초기화 제거 -->
<script>
  // ❌ 제거됨 (store.js로 이동)
  // window.state = {
  //   currentStreet: 'preflop',
  //   ...
  // };
</script>
```

### 3.2 Git Commit
```bash
git add src/core/store.js
git add index.html
git commit -m "Step 3: 중앙 스토어 구축

- src/core/store.js 생성 (AppStore 클래스)
- window.state → store.state 마이그레이션
- 하위 호환성 유지 (window.state 유지)
- index.html 초기화 코드 제거
"
```

### 3.3 사용자 검증 체크리스트

```markdown
## ✅ Step 3 검증

### A. 콘솔 확인
- [ ] "[Step 3] 중앙 스토어 초기화 완료" 메시지
- [ ] 에러 0개

### B. 스토어 접근 테스트
F12 Console:
```javascript
// 1. 스토어 존재 확인
window.__store__  // 결과: AppStore { state: {...}, config: {...} }

// 2. 기존 window.state 접근 (호환성)
window.state  // 결과: { currentStreet: 'preflop', ... }
window.state.currentStreet  // 결과: 'preflop'

// 3. 스토어 직접 접근
__store__.getState()  // 결과: { currentStreet: 'preflop', ... }
__store__.getConfig('appsScriptUrl')  // 결과: 'https://...'

// 4. 상태 변경 테스트
__store__.setState({ currentStreet: 'flop' })
window.state.currentStreet  // 결과: 'flop' (동기화 확인)
```

### C. 핵심 기능 테스트
- [ ] 앱 초기 로딩 정상
- [ ] 플레이어 데이터 로딩 정상
- [ ] 핸드 시작 → state 업데이트 정상
- [ ] 액션 입력 → state 반영 정상
- [ ] IndexedDB 캐싱 정상

### D. Apps Script 연동 테스트
- [ ] 설정 모달 열기 → Apps Script URL 표시
- [ ] URL 수정 → 저장 → 새로고침 → 유지 확인

✅ 모두 통과 → Step 4 진행
❌ 실패 → 롤백 + 대책
```

### 3.4 실패 시 대응

| 실패 케이스 | 증상 | 원인 | 대책 |
|-----------|------|------|------|
| **state 동기화 안됨** | setState 후 window.state 변경 안됨 | 참조 복사 문제 | Proxy 패턴 적용 |
| **Apps Script URL 소실** | URL 설정이 사라짐 | localStorage 읽기 실패 | getConfig 로직 재확인 |
| **핸드 데이터 누락** | actionState가 빈 객체 | 초기값 설정 오류 | store.js 초기값 재확인 |

### 3.5 롤백 + 대책 예시
```bash
# 롤백
git reset --hard HEAD~1

# 대책: Proxy 패턴
cat > src/core/store.js << 'EOF'
class AppStore {
  constructor() {
    this._state = { ... };

    // Proxy로 window.state 자동 동기화
    this.state = new Proxy(this._state, {
      set(target, prop, value) {
        target[prop] = value;
        window.state[prop] = value;  // ✅ 자동 동기화
        return true;
      }
    });
  }
}
EOF

# 재시도
git add src/core/store.js
git commit -m "Step 3 재시도: Proxy 패턴 적용"
```

---

## 📍 Step 4: Facade 패턴 (5일)

### 4.1 작업 내용
```bash
# 1. 모듈 및 Facade 생성
mkdir -p src/facades

# 2. hand-recorder.js (내부 구현)
cat > src/modules/hand-recorder.js << 'EOF'
import { store } from '../core/store.js';

export class HandRecorder {
  async sendToGoogleSheet(handData) {
    const url = store.getConfig('appsScriptUrl');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'saveHand', handData: JSON.stringify(handData) })
    });

    return await response.json();
  }

  collectHandData() {
    return store.getState().actionState;
  }
}
EOF

# 3. hand-facade.js (외부 인터페이스)
cat > src/facades/hand-facade.js << 'EOF'
import { HandRecorder } from '../modules/hand-recorder.js';

const recorder = new HandRecorder();

// ✅ 기존 함수명 그대로 유지
export async function sendHandToGoogleSheet() {
  const handData = window.state.actionState;  // 호환성
  return await recorder.sendToGoogleSheet(handData);
}

export function collectHandData() {
  return recorder.collectHandData();
}
EOF
```

```html
<!-- 4. index.html 수정 -->
<script type="module">
  import * as HandFacade from './src/facades/hand-facade.js';

  // 전역 노출 (onclick 호환)
  window.sendHandToGoogleSheet = HandFacade.sendHandToGoogleSheet;
  window.collectHandData = HandFacade.collectHandData;

  console.log('[Step 4] Hand Recorder 모듈 로드 완료');
</script>

<!-- 5. 기존 함수 제거 (400줄) -->
<script>
  // ❌ 제거됨 (modules/hand-recorder.js로 이동)
  // async function sendHandToGoogleSheet() { ... }
  // function collectHandData() { ... }
</script>
```

### 4.2 Git Commit
```bash
git add src/modules/hand-recorder.js src/facades/hand-facade.js
git add index.html
git commit -m "Step 4: Hand Recorder Facade 패턴 적용

- src/modules/hand-recorder.js: 내부 구현 (HandRecorder 클래스)
- src/facades/hand-facade.js: 외부 인터페이스 (기존 함수명 유지)
- index.html에서 sendHandToGoogleSheet 등 제거 (~400줄)
- onclick 호환성 유지 (window 전역 노출)
"
```

### 4.3 사용자 검증 체크리스트

```markdown
## ✅ Step 4 검증

### A. 콘솔 확인
- [ ] "[Step 4] Hand Recorder 모듈 로드 완료"
- [ ] 에러 0개

### B. 함수 존재 확인
F12 Console:
```javascript
window.sendHandToGoogleSheet  // 결과: async function
window.collectHandData  // 결과: function
```

### C. 핸드 전송 플로우 테스트 (핵심!)
1. [ ] 플레이어 추가 (2명 이상)
2. [ ] 핸드 시작 버튼 클릭
3. [ ] 블라인드 입력 (SB: 500, BB: 1000)
4. [ ] 액션 입력 (Call, Raise 등)
5. [ ] 카드 입력 (Flop, Turn, River)
6. [ ] 승자 선택
7. [ ] **핸드 전송 버튼 클릭** ⭐
8. [ ] 콘솔 확인: "핸드 저장 성공" 메시지
9. [ ] Google Sheets 확인: Hand 시트에 데이터 추가됨

### D. onclick 이벤트 테스트
- [ ] 모든 버튼 클릭 테스트 (5개 이상)
- [ ] 에러 없음

### E. IndexedDB 캐싱 테스트
- [ ] 새로고침 (F5)
- [ ] 플레이어 데이터 즉시 로드 (< 1초)
- [ ] 콘솔: "IndexedDB 캐시 사용" 메시지

✅ 모두 통과 (특히 C.7-9) → Step 5 진행
❌ C.7 실패 (핸드 전송 실패) → 롤백 필수
```

### 4.4 실패 시 대응

| 실패 케이스 | 증상 | 원인 | 대책 |
|-----------|------|------|------|
| **핸드 전송 실패** | "핸드 저장 실패" 에러 | URL 오류 또는 데이터 누락 | 1. store.getConfig 확인<br>2. handData 구조 확인 |
| **collectHandData 빈 객체** | actionState가 {} | store 참조 오류 | store.getState() 로직 재확인 |
| **onclick 함수 없음** | "function is not defined" | 전역 노출 실패 | window 할당 시점 확인 (DOMContentLoaded 사용) |

### 4.5 롤백 + 긴급 수정
```bash
# 1. 즉시 롤백
git reset --hard HEAD~1

# 2. 브라우저 강력 새로고침 (Ctrl+Shift+R)

# 3. 핸드 전송 테스트 → ✅ 정상 작동 확인

# 4. 원인 분석
# - handData 구조가 바뀌었나?
# - store.getConfig가 null 반환?

# 5. 대책 수립
cat > src/facades/hand-facade.js << 'EOF'
export async function sendHandToGoogleSheet() {
  // 🔍 디버깅 로그 추가
  const handData = window.state.actionState;
  console.log('[DEBUG] handData:', handData);

  const url = store.getConfig('appsScriptUrl');
  console.log('[DEBUG] URL:', url);

  if (!url) {
    alert('Apps Script URL이 설정되지 않았습니다.');
    return;
  }

  return await recorder.sendToGoogleSheet(handData);
}
EOF

# 6. 재시도
git add src/facades/hand-facade.js
git commit -m "Step 4 재시도: 디버깅 로그 추가"

# 7. 검증 다시 진행
```

---

## 📍 Step 5~8: 나머지 모듈 분리

### Step 5: data-loader.js (3일)
- loadInitial()
- buildTypeFromCsv()
- cachePlayerData()

### Step 6: pot-calculator.js (2일)
- calculateAccuratePot()
- calculatePotWithCorrection()

### Step 7: card-selector.js (2일)
- openCardSelector()
- Card UI 로직

### Step 8: player-manager.js (2일)
- addPlayer()
- updatePlayerChips()
- deleteLocalPlayer()

**각 Step마다 동일한 프로세스**:
1. 코드 수정
2. Git Commit
3. 🔍 사용자 검증 (체크리스트)
4. ✅ 성공 → 다음 Step
5. ❌ 실패 → 롤백 → 대책 → 재시도

---

## 🎯 최종 검증 (Step 8 완료 후)

### 전체 플로우 테스트
```markdown
## 최종 통합 테스트 (30분)

### 1. 초기 설정
- [ ] npm start
- [ ] http://localhost:3000 접속
- [ ] Apps Script URL 설정

### 2. 플레이어 관리
- [ ] 플레이어 5명 추가
- [ ] 칩 정보 수정
- [ ] 플레이어 1명 삭제

### 3. 핸드 기록 (3번 반복)
- [ ] 핸드 시작
- [ ] 블라인드 입력
- [ ] Preflop 액션 (5개)
- [ ] Flop 보드 카드
- [ ] Flop 액션 (3개)
- [ ] Turn 카드
- [ ] Turn 액션 (2개)
- [ ] River 카드
- [ ] River 액션 (2개)
- [ ] 승자 선택
- [ ] **핸드 전송** ⭐
- [ ] Google Sheets 확인

### 4. 성능 테스트
- [ ] 새로고침 (F5) → 1초 이내 로딩
- [ ] 테이블 전환 (3회) → 지연 없음
- [ ] IndexedDB 캐시 확인

### 5. 에러 확인
- [ ] F12 → Console 탭
- [ ] 에러 메시지 0개
- [ ] 경고 메시지 0개 (또는 무시 가능)

✅ 모두 통과 → 리팩토링 완료!
❌ 하나라도 실패 → 해당 Step 재확인
```

---

## 📊 진행 현황 추적

### 체크리스트
```markdown
- [x] Step 1: 의존성 분석 (1일) ✅ 완료 (2025-10-06 14:23)
- [x] Step 2: 순수 함수 분리 (2일) ✅ 완료 (2025-10-06 15:47)
- [x] Step 3: 전역 스토어 (3일) ✅ 완료 (2025-10-06 16:52)
- [ ] Step 4: Hand Recorder Facade (5일) ← 다음 작업
- [ ] Step 5: Data Loader (3일)
- [ ] Step 6: Pot Calculator (2일)
- [ ] Step 7: Card Selector (2일)
- [ ] Step 8: Player Manager (2일)
- [ ] 최종 통합 테스트 (1일)

총 소요 예상: 21일 (3주)
현재 진행: 3/9 완료 (33%)
```

### 최적화 진행 현황

| Step | 작업 | 완료 시간 | 예상 감소 | 실제 감소 | 누적 감소 | 현재 줄 수 | 진행률 |
|------|------|----------|----------|----------|----------|-----------|--------|
| 초기 | - | - | - | - | - | 7909 | 0% |
| Step 1 | 의존성 분석 | 10-06 14:23 | 0줄 | 0줄 | 0줄 | 7909 | 0% |
| Step 2 | 순수 함수 분리 | 10-06 15:47 | ~100줄 | 35줄 | 35줄 | 7874 | 0.4% |
| Step 3 | 전역 스토어 | 10-06 16:52 | ~150줄 | 60줄 | 95줄 | 7814 | 1.2% |
| Step 4 | Hand Recorder | - | ~400줄 | ? | ? | ? | ? |
| Step 5 | Data Loader | - | ~800줄 | ? | ? | ? | ? |
| Step 6 | Pot Calculator | - | ~300줄 | ? | ? | ? | ? |
| Step 7 | Card Selector | - | ~200줄 | ? | ? | ? | ? |
| Step 8 | Player Manager | - | ~300줄 | ? | ? | ? | ? |
| **목표** | - | - | **6909줄** | **?** | **6909줄** | **1000** | **87%** |
```

### 롤백 기록 (실패 학습)
```markdown
## 롤백 이력

| 날짜 | Step | 실패 원인 | 대책 | 재시도 결과 |
|------|------|----------|------|------------|
| 2025-10-07 | Step 2 | CORS 에러 | npm start 실행 | ✅ 성공 |
| 2025-10-08 | Step 4 | handData null | 디버깅 로그 추가 | ✅ 성공 |
| ... | ... | ... | ... | ... |
```

---

## 🛡️ 안전 수칙

### 매 Step 시작 전
1. ✅ 현재 코드 정상 작동 확인
2. ✅ Git 작업 트리 깨끗한지 확인 (`git status`)
3. ✅ 백업 브랜치 생성 (`git checkout -b backup/stepN`)

### 매 Step 완료 후
1. ✅ 검증 체크리스트 100% 완료
2. ✅ Git Commit 메시지 상세 작성
3. ✅ 다음 Step 계획 확인

### 롤백 결정 기준
- ❌ 핸드 전송 실패 → **즉시 롤백**
- ❌ 콘솔 에러 3개 이상 → **즉시 롤백**
- ❌ onclick 함수 없음 → **즉시 롤백**
- ⚠️ 경고 메시지 → 확인 후 진행 가능

---

© 2025 Virtual Data - Step-by-Step Refactoring with Validation
