# 🎰 Virtual Data - Poker Hand Logger

> 실시간 포커 핸드 기록 및 분석 시스템

## 🌐 접속

- **GitHub**: https://github.com/garimto81/virtual_data_claude
- **라이브 데모**: https://garimto81.github.io/virtual_data_claude/

## 📋 개요

Google Sheets와 연동되는 웹 기반 포커 핸드 로거입니다. 실시간으로 플레이어의 액션, 칩 변동, 핸드 결과를 기록하고 관리합니다.

### ✨ 주요 기능

- 📊 Google Sheets 실시간 연동
- 👥 플레이어 IN/OUT 상태 관리
- 💰 자동 팟 계산 및 칩 추적
- 🎯 스트릿별 액션 기록
- ⚡ IndexedDB 로컬 캐싱

## 🚀 빠른 시작

### 1. Google Sheets 설정

1. 템플릿 시트 복사
2. Apps Script 열기 (확장 프로그램 → Apps Script)
3. `apps-script/Code_v71.0.3.gs` 붙여넣기
4. 웹 앱으로 배포 (액세스: 모든 사용자)

### 2. 프론트엔드 설정

설정(⚙️) 메뉴에서 Apps Script URL 입력

### 3. 실행

```bash
# Live Server 또는
python -m http.server 8000
# 또는
node server.js
```

## 🛠 기술 스택

- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **Backend**: Google Apps Script v71.0.3
- **Database**: Google Sheets
- **Cache**: IndexedDB (Dexie.js)
- **API**: Gemini Vision API (칩 분석)

---

## 🚨 현재 작업: index.html 리팩토링 (v3.11.0)

### 문제

**index.html: 7909줄 (337KB)** - 수정 불가능, 협업 불가능
- JS 코드: 7545줄
- 함수: 129개
- 목표: **1000줄 이하 (-87%)**

### 📍 진행 상황

**Week 1 (Day 1-7)**
- [x] 문서 정리 완료 (30개 → 5개)
- [x] 파일 정리 완료 (14개 삭제)
- [x] 리팩토링 전략 수립
- [x] **Step 1: 의존성 분석 완료** ✅
  - globals.txt: 22개 전역 변수
  - functions.txt: 129개 함수
  - onclick-events.txt: 6개 이벤트
  - DEPENDENCY_MAP.md: 8개 모듈 구조 설계
- [ ] **Step 2: 순수 함수 분리** (다음 작업, 2일)
- [ ] **Step 3: 전역 스토어 구축** (3일)

**Week 2 (Day 8-14)**
- [ ] Step 4: Hand Recorder Facade (5일)
- [ ] Step 5: Data Loader (3일)

**Week 3 (Day 15-21)**
- [ ] Step 6: Pot Calculator (2일)
- [ ] Step 7: Card Selector (2일)
- [ ] Step 8: Player Manager (2일)
- [ ] 최종 통합 테스트 (1일)

### 🎯 다음 작업: Step 2 - 순수 함수 분리

**목표**: 외부 의존성 없는 유틸리티 함수 10개를 별도 모듈로 분리

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

export function formatCardDisplay(cardId) {
  if (!cardId) return '';
  const rank = cardId.slice(0, -1);
  const suit = cardId.slice(-1);
  const suitSymbols = { h: '♥️', d: '♦️', c: '♣️', s: '♠️' };
  return rank + (suitSymbols[suit] || suit);
}

// ... 기타 순수 함수 6개
EOF

# 3. Git Commit
git add src/modules/pure-utils.js
git commit -m "Step 2: 순수 함수 분리 (10개)"
```

**index.html 수정**:
```html
<!-- 기존 외부 스크립트 아래 추가 (라인 220 근처) -->
<script type="module">
  // 순수 함수 임포트
  import * as PureUtils from './src/modules/pure-utils.js';

  // 전역 노출 (onclick 호환성)
  Object.assign(window, PureUtils);

  console.log('[Step 2] 순수 함수 모듈 로드 완료');
</script>

<!-- index.html에서 기존 함수 제거 (주석 처리) -->
<script>
  // ❌ 제거됨 (pure-utils.js로 이동)
  // function parseSeatNumber(seat) { ... }
  // function compareSeatNumbers(a, b) { ... }
  // function formatChips(chips) { ... }
</script>
```

### ✅ 검증 체크리스트

**A. 콘솔 확인**
- [ ] 브라우저: http://localhost:8000 (또는 5000, 8080)
- [ ] F12 → Console 탭
- [ ] "[Step 2] 순수 함수 모듈 로드 완료" 메시지 확인
- [ ] 에러 메시지 0개

**B. 함수 호출 테스트** (F12 Console 입력)
```javascript
parseSeatNumber('#5')        // 결과: 5
parseSeatNumber('Seat 10')   // 결과: 10
formatChips(1000)            // 결과: "1,000"
formatChips(500000)          // 결과: "500,000"
window.parseSeatNumber       // 결과: function
```

**C. UI 기능 테스트**
- [ ] 앱 초기 로딩 정상
- [ ] 플레이어 목록 표시 정상
- [ ] 좌석 번호 정렬 정상
- [ ] 칩 포맷 표시 정상

**D. onclick 이벤트 테스트**
- [ ] 아무 버튼이나 클릭 → 에러 없음

### ❌ 실패 시 롤백

```bash
# 즉시 롤백
git reset --hard HEAD~1

# 브라우저 강력 새로고침
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (Mac)

# 기능 정상 작동 확인 후 대책 수립
```

**주요 실패 케이스**:
| 증상 | 원인 | 대책 |
|------|------|------|
| "Failed to load module" | CORS 에러 | 로컬 서버 실행 확인 (python -m http.server) |
| `parseSeatNumber is not defined` | 전역 노출 실패 | `Object.assign(window, PureUtils)` 확인 |
| 좌석 정렬 깨짐 | 함수 로직 오류 | pure-utils.js 코드 재확인 |

### 🛡️ 안전 원칙

1. **한 번에 하나씩**: Step 1 → 검증 → Step 2 → 검증...
2. **항상 롤백 가능**: 모든 Step = 1 commit
3. **onclick 보존**: Facade 패턴으로 HTML 수정 불필요
4. **검증 필수**: 체크리스트 100% 완료

---

<details>
<summary>📚 전체 8-Step 리팩토링 가이드 (클릭하여 펼치기)</summary>

## Step 1: 의존성 분석 (1일) ✅ 완료

```bash
mkdir -p docs/analysis
grep -o "window\.[a-zA-Z_][a-zA-Z0-9_]*" index.html | sort -u > docs/analysis/globals.txt
grep -n "function [a-zA-Z_]" index.html > docs/analysis/functions.txt
grep -o 'onclick="[^"]*"' index.html | sort -u > docs/analysis/onclick-events.txt
git add docs/analysis && git commit -m "Step 1: 의존성 분석"
```

**결과**: [docs/analysis/DEPENDENCY_MAP.md](docs/analysis/DEPENDENCY_MAP.md)

---

## Step 3: 전역 스토어 구축 (3일)

```bash
mkdir -p src/core
cat > src/core/store.js << 'EOF'
/**
 * 중앙 상태 관리 스토어
 */
class AppStore {
  constructor() {
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
    };

    this.config = {
      appsScriptUrl: localStorage.getItem('appsScriptUrl') || '',
      spreadsheetId: '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U',
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
window.__store__ = store;  // 디버깅용
EOF
```

**index.html**:
```html
<script type="module">
  import { store } from './src/core/store.js';

  // 기존 코드 호환성 유지
  window.state = store.state;
  window.APPS_SCRIPT_URL = store.getConfig('appsScriptUrl');

  console.log('[Step 3] 중앙 스토어 초기화 완료');
</script>
```

**검증**:
```javascript
window.__store__.getState()           // { currentStreet: ... }
window.state.currentStreet            // 'preflop'
__store__.setState({ currentStreet: 'flop' })
window.state.currentStreet            // 'flop' (동기화 확인)
```

---

## Step 4: Hand Recorder Facade (5일) ⭐ 핵심

```bash
# 내부 구현
cat > src/modules/hand-recorder.js << 'EOF'
import { store } from '../core/store.js';

export class HandRecorder {
  async sendToGoogleSheet(handData) {
    const url = store.getConfig('appsScriptUrl');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'saveHand',
        handData: JSON.stringify(handData)
      })
    });

    return await response.json();
  }

  collectHandData() {
    return store.getState().actionState;
  }
}
EOF

# 외부 인터페이스 (기존 함수명 유지)
mkdir -p src/facades
cat > src/facades/hand-facade.js << 'EOF'
import { HandRecorder } from '../modules/hand-recorder.js';

const recorder = new HandRecorder();

// ✅ 기존 함수명 그대로 유지 (onclick 호환)
export async function sendHandToGoogleSheet() {
  const handData = window.state.actionState;
  return await recorder.sendToGoogleSheet(handData);
}

export function collectHandData() {
  return recorder.collectHandData();
}
EOF
```

**index.html**:
```html
<script type="module">
  import * as HandFacade from './src/facades/hand-facade.js';

  // 전역 노출 (onclick 호환)
  window.sendHandToGoogleSheet = HandFacade.sendHandToGoogleSheet;
  window.collectHandData = HandFacade.collectHandData;

  console.log('[Step 4] Hand Recorder 모듈 로드 완료');
</script>

<!-- ✅ HTML 수정 없음 -->
<button onclick="sendHandToGoogleSheet()">전송</button>
```

**검증 (가장 중요!)**:
1. [ ] 플레이어 2명 추가
2. [ ] 핸드 시작
3. [ ] 블라인드 입력 (SB: 500, BB: 1000)
4. [ ] 액션 입력 (Call, Raise 등)
5. [ ] 카드 입력 (Flop, Turn, River)
6. [ ] 승자 선택
7. [ ] **핸드 전송 버튼 클릭** ⭐
8. [ ] 콘솔: "핸드 저장 성공"
9. [ ] Google Sheets 확인: Hand 시트에 데이터 추가됨

**실패 시 디버깅**:
```javascript
// hand-facade.js에 로그 추가
export async function sendHandToGoogleSheet() {
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
```

---

## Step 5: Data Loader (3일)

**모듈**: loadInitial, buildTypeFromCsv, IndexedDB 관련 함수 15개

---

## Step 6: Pot Calculator (2일)

**모듈**: calculateAccuratePot, calculatePotWithCorrection 등 12개

---

## Step 7: Card Selector (2일)

**모듈**: openCardSelector, Card UI 관련 8개

---

## Step 8: Player Manager (2일)

**모듈**: addPlayer, updatePlayerChips, deleteLocalPlayer 등 18개

---

## 최종 효과

| 항목 | Before | After |
|-----|--------|-------|
| index.html | 7909줄 | 1000줄 (-87%) |
| 모듈 수 | 0개 | 8개 |
| 수정 가능 | ❌ | ✅ |
| 협업 가능 | ❌ | ✅ |

</details>

---

## 💡 주요 사용법

### 핸드 기록
1. 테이블 선택
2. 플레이어 확인
3. 핸드 시작 → 액션 입력 → 완료

### 자동 액션 순서
1. 설정(⚙️) → "자동 액션 매핑 모드" 활성화
2. 버튼 위치 설정
3. 액션만 순서대로 입력 (시스템이 자동 매핑)

### 칩 분석 (AI)
1. 관리 → 칩 컬러 탭
2. 칩 컬러 등록 (최대 5개)
3. 카메라로 촬영 → AI 자동 분석

## 🔧 개발 가이드

### 로컬 개발

```bash
git clone https://github.com/garimto81/virtual_data_claude.git
cd virtual_data_claude

# Node.js 서버
node server.js  # http://localhost:8080

# Python 서버
python -m http.server 8000
```

### Apps Script 배포

1. [Google Apps Script](https://script.google.com) 접속
2. 새 프로젝트 생성
3. `apps-script/Code_v71.0.3.gs` 붙여넣기
4. 웹 앱으로 배포 (액세스: 모든 사용자)

자세한 가이드: [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)

## 📁 프로젝트 구조

```
/
├── index.html          # 메인 앱 (7909줄 → 리팩토링 진행 중)
├── server.js           # 로컬 서버
├── README.md           # ⭐ 이 파일 (통합 문서)
│
├── docs/               # 문서
│   ├── SETUP_GUIDE.md           → 초기 설정 (330줄)
│   ├── STEP_BY_STEP_REFACTORING.md → 상세 리팩토링 가이드 (754줄)
│   ├── analysis/
│   │   └── DEPENDENCY_MAP.md    → Step 1 분석 결과
│   └── reference/               → 상세 문서 (필요시만)
│       ├── prd.md               → 전체 요구사항 (633줄)
│       ├── roadmap.md           → 전체 로드맵 (1413줄)
│       └── api.md               → Apps Script API (780줄)
│
├── src/                # 소스 코드 (리팩토링 진행 중)
│   ├── modules/                 → 비즈니스 로직
│   │   └── pure-utils.js        → Step 2 완료 예정
│   ├── core/                    → 핵심 시스템
│   │   └── store.js             → Step 3 완료 예정
│   ├── facades/                 → 외부 인터페이스
│   ├── js/                      → 기존 파일 (9개)
│   └── utils/                   → 기존 유틸 (3개)
│
└── apps-script/        # Google Apps Script
    └── Code_v71.0.3.gs
```

## 📖 문서

### 현재 작업
- **README.md** (이 파일) - 프로젝트 개요 + 현재 작업 + 리팩토링 가이드

### 설정 가이드
- [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) (330줄) - 초기 설정

### 상세 문서 (필요시만)
- [docs/STEP_BY_STEP_REFACTORING.md](docs/STEP_BY_STEP_REFACTORING.md) - 각 Step별 상세 코드, 검증, 실패 대응
- [docs/reference/prd.md](docs/reference/prd.md) - 전체 요구사항
- [docs/reference/roadmap.md](docs/reference/roadmap.md) - 전체 로드맵
- [docs/reference/api.md](docs/reference/api.md) - Apps Script API

## ⚠️ 주의사항

1. **권한**: 웹 앱 배포 시 "모든 사용자" 액세스 허용
2. **CORS**: form-urlencoded 방식 사용
3. **시트 이름**: Hand, Index, Type 변경 금지
4. **브라우저 캐시**: 업데이트 후 Ctrl+Shift+R
5. **로컬 서버 필수**: `file://` 프로토콜 사용 불가

## 📧 문의

문제나 개선 사항은 [Issue](https://github.com/garimto81/virtual_data_claude/issues) 등록

---

© 2025 Virtual Data - Poker Hand Logger. All rights reserved.
