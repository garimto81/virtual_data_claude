# 🎰 포커 핸드 로거 - 알고리즘 및 실행 흐름 상세 설명

> **목적**: 비전문 개발자도 이해할 수 있도록 앱의 논리적 흐름을 자연어로 설명
> **작성일**: 2025-10-05
> **버전**: v3.5.42

---

## 📖 목차
1. [앱 시작부터 화면 표시까지](#1-앱-시작부터-화면-표시까지)
2. [사용자 시나리오별 실행 흐름](#2-사용자-시나리오별-실행-흐름)
3. [핵심 알고리즘 상세 설명](#3-핵심-알고리즘-상세-설명)
4. [데이터 흐름 및 상태 관리](#4-데이터-흐름-및-상태-관리)

---

## 1. 앱 시작부터 화면 표시까지

### 🚀 Phase 1: 브라우저가 HTML 파일을 로드
```
사용자가 웹 브라우저에서 index.html을 열면:

1. 브라우저가 HTML 파일을 읽기 시작
2. <head> 섹션의 CSS 스타일 로드 (화면 디자인 정의)
3. <script> 태그들을 순서대로 로드
   - archive/action-history.js (액션 히스토리 시스템)
   - archive/double-tap-handler.js (더블탭 처리)
   - src/js/logger.js (로깅 시스템)
   - src/js/constants.js (상수 정의)
   - ... (14개의 외부 스크립트 파일)

중요: 모든 스크립트는 "defer" 속성으로 로드됨
→ HTML 파싱이 끝난 후 실행됨
→ 순서가 보장됨
```

### 🎬 Phase 2: DOMContentLoaded 이벤트 발생
```
HTML 파싱이 완료되면 브라우저가 신호를 보냄:
"DOM(화면 요소들)이 준비됐어요!"

이때 메인 스크립트의 핵심 함수가 실행됨:
document.addEventListener('DOMContentLoaded', () => {
  // 여기서 앱 초기화 시작
});
```

### 📋 Phase 3: 초기 설정 로드 (Config Loading)
```
순서:
1. localStorage에서 이전에 저장된 설정을 찾음
   - Apps Script URL (Google Sheets 백엔드 주소)
   - Spreadsheet ID (데이터가 저장된 시트 ID)
   - 타임존 설정
   - 칩 검증 옵션

2. 만약 저장된 설정이 없다면:
   - Config 시트(Google Sheets)에서 기본값을 가져옴
   - 실패하면 하드코딩된 기본값 사용

3. 전역 설정 객체(window.APP_CONFIG)에 저장
   - 앱 전체에서 이 설정을 참조할 수 있게 됨

알고리즘:
IF localStorage에 URL 있음:
  → 그 URL 사용
ELSE IF Config 시트에서 URL 로드 성공:
  → Config URL 사용하고 localStorage에 저장
ELSE:
  → 기본 URL 사용 (하드코딩)
```

### 🔧 Phase 4: 상태 객체 초기화 (State Initialization)
```
window.state 객체 생성 (앱의 "기억 저장소"):

이것은 앱이 실행되는 동안 모든 정보를 저장하는 곳입니다:

1. 게임 상태:
   - currentStreet: 현재 어느 스트릿인가? (preflop/flop/turn/river)
   - playerStatus: 각 플레이어가 폴드했는지, 올인했는지
   - board: 보드 카드 (플랍, 턴, 리버)

2. 플레이어 데이터:
   - playerDataByTable: 각 테이블의 플레이어 목록
   - playersInHand: 현재 핸드에 참여 중인 플레이어
   - seatMap: 좌석 번호 → 플레이어 이름 매핑

3. 액션 데이터:
   - actionState: 각 스트릿별 액션 기록
     - preflop: [액션1, 액션2, ...]
     - flop: [...]
     - turn: [...]
     - river: [...]

4. UI 상태:
   - modalState: 어떤 모달(팝업)이 열려있는지
   - selectedTable: 선택된 테이블

비유:
state = 앱의 "단기 기억" (RAM 같은 것)
localStorage = 앱의 "장기 기억" (하드디스크 같은 것)
Google Sheets = 앱의 "영구 기록" (클라우드 저장소)
```

### 📡 Phase 5: 데이터 로딩 (Data Loading)
```
initializeApp() 함수 실행:

이 함수는 앱을 실제로 사용할 수 있게 준비하는 과정입니다.

Step 5.1: 로딩 모달 표시
  - 화면에 "로딩 중..." 팝업 띄우기
  - 사용자가 다른 버튼을 못 누르게 잠금

Step 5.2: Google Sheets에서 CSV 데이터 다운로드
  3개의 시트를 동시에(병렬로) 가져옴:

  1) Type 시트 (CSV_TYPE_URL):
     - 모든 플레이어 정보
     - 각 행: 플레이어명, 테이블, 칩, 좌석번호, 국적

  2) Index 시트 (CSV_INDEX_URL):
     - 모든 핸드의 메타데이터
     - 각 행: 핸드번호, 테이블, 시작시간, 승자

  3) Hand 시트 (나중에 필요할 때만):
     - 각 핸드의 상세 액션 기록
     - 용량이 크므로 필요할 때만 로드

알고리즘 (병렬 로딩):
START 동시에:
  작업A: Type 시트 다운로드 → CSV 파싱
  작업B: Index 시트 다운로드 → CSV 파싱
WAIT 모든 작업 완료
결과를 state에 저장

Step 5.3: 데이터 파싱 및 구조화
  CSV 텍스트를 JavaScript 객체로 변환:

  예시:
  CSV: "John,Ocean Blue,Notable,50000,#3"
  →
  객체: {
    name: "John",
    table: "Ocean Blue",
    notable: "Notable",
    chips: 50000,
    seat: 3
  }

Step 5.4: 테이블 목록 생성
  모든 플레이어를 테이블별로 그룹화:

  알고리즘:
  FOR 각 플레이어 IN Type 시트:
    IF 플레이어의 테이블이 목록에 없음:
      → 새 테이블 항목 생성
    플레이어를 해당 테이블에 추가

  결과:
  state.playerDataByTable = {
    "Ocean Blue": [John, Alice, ...],
    "Dragon Green": [Bob, Mike, ...],
    ...
  }

  state.allTables = ["Ocean Blue", "Dragon Green", ...]

Step 5.5: 핸드 번호 목록 생성
  Index 시트에서 모든 핸드 번호 추출:

  state.allHandNumbers = [127, 128, 129, ...]

  최신 핸드 번호 계산:
  latestHandNumber = Math.max(...state.allHandNumbers)
```

### 🎨 Phase 6: 화면 렌더링 (UI Rendering)
```
renderTableSelection() 함수 실행:

Step 6.1: 테이블 선택 화면 표시
  화면 구성:

  [검색창]
  ┌─────────────────────────┐
  │ 테이블 검색...          │
  └─────────────────────────┘

  [테이블 그리드]
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │Ocean Blue│ │Dragon Grn│ │Phoenix Rd│
  │  8명     │ │  6명     │ │  9명     │
  └──────────┘ └──────────┘ └──────────┘

알고리즘:
FOR 각 테이블 IN state.allTables:
  테이블 버튼 생성:
    - 테이블 이름 표시
    - 플레이어 수 표시
    - 클릭 이벤트: selectTable(테이블명)
  HTML에 추가

Step 6.2: 이벤트 리스너 연결
  사용자가 클릭할 수 있는 모든 버튼에 기능 연결:

  - 테이블 버튼 클릭 → selectTable()
  - 새로고침 버튼 클릭 → loadInitial()
  - 설정 버튼 클릭 → openSettings()
  - ... (수십 개의 버튼)

Step 6.3: 중복 플레이어 자동 검사
  Google Sheets에 중복 데이터가 있는지 확인:

  알고리즘:
  FOR 각 플레이어 IN Type 시트:
    키 생성: 테이블명 + 플레이어명
    IF 이 키가 이미 존재:
      → 중복 발견!
      → 나중 행 삭제

  예시:
  행1: Ocean Blue, John → 키: "OceanBlue_John"
  행2: Ocean Blue, Alice → 키: "OceanBlue_Alice"
  행3: Ocean Blue, John → 키: "OceanBlue_John" (중복!)
  → 행3 삭제

Step 6.4: 초기화 완료
  - 로딩 모달 닫기
  - 3초 후 자동으로 사라짐
  - 콘솔에 "✅ 앱 준비 완료!" 표시
```

---

## 2. 사용자 시나리오별 실행 흐름

### 📌 시나리오 1: 테이블 선택 및 플레이어 확인

```
사용자 액션: "Ocean Blue" 테이블 버튼 클릭

→ selectTable("Ocean Blue") 함수 실행

Step 1: 선택된 테이블 저장
  state.selectedTable = "Ocean Blue"

Step 2: 해당 테이블 플레이어 목록 가져오기
  players = state.playerDataByTable["Ocean Blue"]

Step 3: 플레이어를 좌석 순서로 정렬
  알고리즘:
  players.sort((a, b) => a.seat - b.seat)

  예시:
  정렬 전: [#3 John, #1 Alice, #2 Bob]
  정렬 후: [#1 Alice, #2 Bob, #3 John]

Step 4: 화면에 플레이어 카드 표시
  renderPlayerSelection() 실행:

  FOR 각 플레이어 IN players:
    플레이어 카드 생성:
      ┌─────────────────────┐
      │ #1 Alice            │
      │ 🌟 Notable          │ ← Notable이면 별 표시
      │ 💰 15,000 칩       │
      │ 🇺🇸 USA            │
      └─────────────────────┘

    클릭 이벤트 연결:
      → togglePlayerInHand(플레이어)

Step 5: 플레이어 선택
  사용자가 플레이어 카드를 클릭하면:

  IF 플레이어가 이미 선택됨:
    → 선택 해제 (배열에서 제거)
    → 카드 배경색: 회색
  ELSE:
    → 선택 (배열에 추가)
    → 카드 배경색: 노란색 (하이라이트)

  state.playersInHand에 저장:
  예시: ["Alice", "Bob", "John"]

Step 6: 핸드 번호 자동 계산
  다음 핸드 번호 = 최근 핸드 번호 + 1

  알고리즘:
  latestHandNumber = Math.max(...state.allHandNumbers)
  nextHandNumber = latestHandNumber + 1

  예시:
  기존 핸드: [125, 126, 127]
  → 다음 핸드: 128

  화면에 표시: "핸드 #128"
```

### 📌 시나리오 2: 핸드 시작 및 블라인드 설정

```
사용자 액션:
1. Small Blind 입력: "500"
2. Big Blind 입력: "1000"
3. "BB Ante" 체크박스 체크
4. 플레이어 8명 선택 완료

→ 이 정보들이 state.actionState에 저장됨

Step 1: 블라인드 검증
  알고리즘:
  IF smallBlind가 비어있거나 0:
    → 에러: "Small Blind를 입력하세요"
    → 실행 중단
  IF bigBlind가 비어있거나 0:
    → 에러: "Big Blind를 입력하세요"
    → 실행 중단
  IF smallBlind >= bigBlind:
    → 경고: "SB는 BB보다 작아야 합니다"

Step 2: 버튼 포지션 설정
  사용자가 "BTN 설정" 버튼 클릭:

  드롭다운 메뉴 표시:
  ┌─────────────┐
  │ #1 Alice    │
  │ #2 Bob      │
  │ #3 John  ✓  │ ← 선택됨
  └─────────────┘

  state.buttonPosition = 3 (John의 좌석)

Step 3: SB/BB 자동 계산
  포커 규칙에 따라 자동 계산:

  알고리즘:
  버튼 좌석 = 3
  총 플레이어 = 8

  SB 좌석 = (버튼 + 1) % 총 플레이어
          = (3 + 1) % 8 = 4

  BB 좌석 = (버튼 + 2) % 총 플레이어
          = (3 + 2) % 8 = 5

  결과:
  - BTN: #3 John
  - SB: #4 Mike
  - BB: #5 Alice

Step 4: 액션 순서 계산
  프리플랍 액션 순서:

  알고리즘:
  시작 플레이어 = BB 다음 플레이어
                = (BB + 1) % 총 플레이어
                = (5 + 1) % 8 = 6

  순서 생성:
  queue = []
  FOR i = 0 TO 총 플레이어 - 1:
    좌석 = (시작 플레이어 + i) % 총 플레이어
    IF 해당 좌석에 플레이어 있음:
      queue.push(플레이어)

  결과:
  프리플랍 순서: [#6 Sarah, #7 Tom, #8 Anna, #1 Alice, #2 Bob, #3 John, #4 Mike, #5 Alice]

  포스트플랍 순서 (플랍/턴/리버):
  SB부터 시작: [#4 Mike, #5 Alice, #6 Sarah, ...]

Step 5: 핸드 시작 준비 완료
  화면 표시:
  ┌─────────────────────────────┐
  │ 핸드 #128                    │
  │ Ocean Blue 테이블            │
  │ SB: 500 / BB: 1000 (BB Ante)│
  │ 플레이어 8명                 │
  │                             │
  │ [액션 기록 시작]             │
  └─────────────────────────────┘
```

### 📌 시나리오 3: 액션 기록 (Preflop)

```
사용자가 각 플레이어의 액션을 기록:

자동 모드 (actionInputMode = 'auto'):

Step 1: 첫 번째 액션
  현재 차례: #6 Sarah (UTG)

  화면에 Sarah 카드가 노란색으로 하이라이트:
  ┌─────────────────────┐
  │ 🎯 #6 Sarah         │ ← 현재 차례
  │ 💰 12,000 칩       │
  └─────────────────────┘

  사용자가 Sarah 클릭 → 액션 패드 모달 팝업:

  ┌─────────────────────────┐
  │ Sarah의 액션             │
  ├─────────────────────────┤
  │ [Fold] [Call] [Raise]   │
  │ [All-In]                │
  └─────────────────────────┘

Step 2: 액션 선택 - Raise
  사용자가 "Raise" 버튼 클릭:

  → 키패드 모달 팝업:
  ┌─────────────────────────┐
  │ Raise 금액              │
  ├─────────────────────────┤
  │ [1] [2] [3]             │
  │ [4] [5] [6]             │
  │ [7] [8] [9]             │
  │ [←] [0] [✓]             │
  ├─────────────────────────┤
  │ 현재: 2500              │
  └─────────────────────────┘

  사용자가 "2500" 입력 → ✓ 클릭

Step 3: 액션 저장
  액션 객체 생성:
  {
    player: "Sarah",
    seat: 6,
    action: "raises",
    amount: 2500,
    timestamp: "2025-10-05 14:32:15",
    street: "preflop"
  }

  state.actionState.preflop.push(액션)

  화면에 표시:
  ┌─────────────────────────┐
  │ 프리플랍                │
  ├─────────────────────────┤
  │ Sarah raises 2500       │
  └─────────────────────────┘

Step 4: 다음 플레이어로 자동 이동
  액션 큐에서 다음 플레이어:

  state.currentActionIndex++
  nextPlayer = state.actionQueue[state.currentActionIndex]
  → #7 Tom

  Tom 카드가 하이라이트:
  ┌─────────────────────┐
  │ 🎯 #7 Tom           │
  │ 💰 8,000 칩        │
  └─────────────────────┘

Step 5: 연속 액션 기록
  사용자가 계속 액션 입력:

  - Tom: Call 2500
  - Anna: Fold
  - Alice: Fold
  - Bob: Call 2500
  - John (BTN): Fold
  - Mike (SB): Fold
  - Alice (BB): Call 1500 (already 1000 in)

  모든 베팅이 동일해지면:
  → 프리플랍 종료
  → "다음 스트릿" 버튼 활성화

Step 6: 팟 계산
  알고리즘:
  totalPot = 0
  FOR 각 액션 IN actionState.preflop:
    IF 액션 타입이 Call, Raise, Bet, All-In:
      totalPot += 액션.amount

  블라인드 추가:
  totalPot += smallBlind + bigBlind

  IF BB Ante 체크됨:
    totalPot += bigBlind × 참여 플레이어 수

  예시:
  SB: 500
  BB: 1000
  Antes: 1000 × 8 = 8000
  Sarah raises: 2500
  Tom calls: 2500
  Bob calls: 2500
  Alice calls: 1500

  Total Pot = 500 + 1000 + 8000 + 2500 + 2500 + 2500 + 1500
            = 18,500

  화면에 표시: "💰 Pot: 18,500"
```

### 📌 시나리오 4: 플랍 카드 입력 및 액션 기록

```
사용자 액션: "Flop" 버튼 클릭

Step 1: 보드 카드 선택 모달 팝업
  ┌─────────────────────────────────────┐
  │ 플랍 카드 선택 (3장)                │
  ├─────────────────────────────────────┤
  │ ♠ [A][K][Q][J][10][9][8][7]...     │
  │ ♥ [A][K][Q][J][10][9][8][7]...     │
  │ ♦ [A][K][Q][J][10][9][8][7]...     │
  │ ♣ [A][K][Q][J][10][9][8][7]...     │
  └─────────────────────────────────────┘

Step 2: 카드 선택 로직
  사용자가 A♠, K♥, Q♦ 선택:

  알고리즘:
  selectedCards = []

  FOR 각 카드 클릭:
    IF selectedCards.length < 3:
      IF 카드가 이미 사용됨 (플레이어 카드):
        → 에러: "이미 사용된 카드입니다"
      ELSE:
        selectedCards.push(카드)
        카드 버튼 비활성화 (회색)
    ELSE:
      → 경고: "플랍은 3장만 선택 가능합니다"

  선택 완료: [A♠, K♥, Q♦]

Step 3: 보드에 카드 표시
  state.board = ["As", "Kh", "Qd"]

  화면 렌더링:
  ┌─────────────────────┐
  │ 보드                │
  ├─────────────────────┤
  │ [A♠] [K♥] [Q♦]     │
  └─────────────────────┘

Step 4: 플랍 액션 기록
  액션 순서가 포스트플랍으로 변경:
  SB부터 시작 (#4 Mike)

  하지만 Mike는 폴드했으므로 스킵:
  → 다음은 #5 Alice (BB)

  사용자가 Alice 클릭:
  - Alice: Check

  다음 차례: #6 Sarah
  - Sarah: Bet 5000

  다음 차례: #7 Tom
  - Tom: Call 5000

  다음 차례: #2 Bob
  - Bob: Fold

  다시 Alice 차례:
  - Alice: Call 5000

  모든 베팅 동일 → 플랍 종료

  Pot 업데이트:
  이전 Pot: 18,500
  플랍 베팅: 5000 + 5000 + 5000 = 15,000
  Total Pot: 33,500
```

### 📌 시나리오 5: 핸드 완료 및 Google Sheets 저장

```
리버까지 모든 액션 기록 완료

Step 1: 승자 선택
  화면에 남은 플레이어만 표시:
  ┌─────────────────────────┐
  │ 승자 선택                │
  ├─────────────────────────┤
  │ ○ Alice                 │
  │ ○ Sarah                 │
  │ ○ Tom                   │
  └─────────────────────────┘

  사용자가 "Sarah" 선택

Step 2: 데이터 구조화
  핸드 데이터를 Google Sheets 형식으로 변환:

  알고리즘:
  rows = []

  // 1. HAND 행
  rows.push([
    "HAND",
    핸드번호,
    timestamp,
    "HOLDEM",
    "BB_ANTE",
    "",
    "",
    "",
    state.selectedTable
  ])

  // 2. PLAYER 행들
  FOR 각 플레이어 IN state.playersInHand:
    rows.push([
      "PLAYER",
      플레이어.name,
      플레이어.seat,
      0,
      플레이어.시작칩,
      플레이어.종료칩,
      플레이어.카드
    ])

  // 3. EVENT 행들 (각 스트릿)
  FOR 각 스트릿 IN ["preflop", "flop", "turn", "river"]:
    rows.push([
      "STREET",
      스트릿명,
      보드카드
    ])

    FOR 각 액션 IN state.actionState[스트릿]:
      rows.push([
        "EVENT",
        "ACTION",
        액션.player,
        액션.action,
        액션.amount,
        timestamp
      ])

  // 4. WINNER 행
  rows.push([
    "WINNER",
    승자이름,
    totalPot
  ])

  // 5. 빈 행 (핸드 구분자)
  rows.push([])

Step 3: Google Apps Script API 호출
  알고리즘:

  // Phase 4 보호 시스템 사용
  protectedApiCall(async () => {
    response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=appendHand&data=${JSON.stringify(rows)}`
    })

    IF response.ok:
      result = await response.json()
      IF result.success:
        → 성공!
      ELSE:
        → 에러 표시
    ELSE:
      → 재시도 (최대 3번)
  })

  재시도 로직:
  FOR attempt = 1 TO 3:
    TRY:
      API 호출
      IF 성공:
        BREAK
    CATCH:
      IF attempt < 3:
        WAIT (1초 × attempt)
        계속
      ELSE:
        최종 실패 처리

Step 4: Index 시트 업데이트
  Google Sheets의 Index 시트에 핸드 메타데이터 추가:

  [핸드번호, 시작행, 종료행, 업데이트시간, 테이블, 승자, ...]

Step 5: 로컬 상태 업데이트
  state.allHandNumbers.push(새핸드번호)

  다음 핸드 번호 자동 증가:
  nextHandNumber = 새핸드번호 + 1

Step 6: 화면 초기화
  성공 메시지 표시:
  "✅ 핸드 #128 저장 완료!"

  3초 후:
  - 액션 기록 초기화
  - 보드 카드 초기화
  - 플레이어 선택 유지 (같은 플레이어로 다음 핸드)
  - 핸드 번호 자동 증가: #129
```

---

## 3. 핵심 알고리즘 상세 설명

### 🧮 알고리즘 1: CSV 파싱 (parseCSV)

```
목적: Google Sheets에서 받은 CSV 텍스트를 배열로 변환

입력:
"Player,Table,Chips\nJohn,Ocean Blue,50000\nAlice,Dragon Green,120000"

처리 과정:

Step 1: 줄바꿈으로 분리
  lines = text.split('\n')
  결과: [
    "Player,Table,Chips",
    "John,Ocean Blue,50000",
    "Alice,Dragon Green,120000"
  ]

Step 2: 헤더 제거
  header = lines[0]
  dataLines = lines.slice(1)

Step 3: 각 줄을 쉼표로 분리
  FOR 각 line IN dataLines:
    cells = line.split(',')

    // 따옴표 제거 및 trim
    FOR i = 0 TO cells.length - 1:
      cells[i] = cells[i].trim().replace(/^"|"$/g, '')

    rows.push(cells)

출력:
[
  ["John", "Ocean Blue", "50000"],
  ["Alice", "Dragon Green", "120000"]
]

특수 케이스 처리:
- 빈 줄: 무시
- 따옴표 안의 쉼표: 유지 (예: "Smith, John")
- 숫자: 문자열로 유지 (나중에 parseInt)
```

### 🔄 알고리즘 2: 중복 플레이어 제거 (removeDuplicatePlayers)

```
목적: Google Sheets Type 시트에서 중복된 플레이어 삭제

알고리즘:

Step 1: 모든 플레이어 데이터 로드
  players = CSV에서 로드한 모든 행

Step 2: 고유 키 생성 및 중복 감지
  seen = new Map()  // 이미 본 플레이어 저장
  duplicates = []   // 중복 플레이어 목록

  FOR 각 player IN players:
    // 고유 키: 테이블명 + "_" + 플레이어명
    key = player.table + "_" + player.name

    IF seen.has(key):
      // 중복 발견!
      duplicates.push(player)

      // 어느 것을 남길지 결정
      기존 = seen.get(key)
      IF player.updatedAt > 기존.updatedAt:
        // 새 데이터가 더 최신이면 기존 것 삭제
        삭제 대상 = 기존
        seen.set(key, player)  // 새 것으로 교체
      ELSE:
        // 기존 데이터가 더 최신이면 새 것 삭제
        삭제 대상 = player
    ELSE:
      // 처음 보는 플레이어
      seen.set(key, player)

Step 3: Google Sheets에서 중복 행 삭제
  FOR 각 중복 IN duplicates:
    // Apps Script API 호출
    await callAppsScript('deletePlayer', {
      table: 중복.table,
      name: 중복.name,
      rowIndex: 중복.rowIndex
    })

Step 4: 로컬 데이터 업데이트
  // 중복 제거된 데이터로 state 업데이트
  state.playerDataByTable = 중복 없는 데이터

반환:
{
  success: true,
  removedCount: 3,
  message: "3명의 중복 플레이어 제거 완료"
}
```

### 🎯 알고리즘 3: 액션 순서 계산 (calculateActionOrder)

```
목적: 포커 규칙에 따른 정확한 액션 순서 생성

입력:
- buttonPosition: 3 (BTN 좌석)
- totalPlayers: 8
- street: "preflop" 또는 "postflop"

알고리즘:

IF street == "preflop":
  // 프리플랍: UTG부터 시작

  Step 1: SB, BB 위치 계산
    SB = (buttonPosition + 1) % totalPlayers
    BB = (buttonPosition + 2) % totalPlayers

  Step 2: UTG(Under The Gun) 위치
    UTG = (BB + 1) % totalPlayers

  Step 3: 순서 생성
    order = []
    currentSeat = UTG

    FOR i = 0 TO totalPlayers - 1:
      IF seatMap[currentSeat] 존재:
        player = seatMap[currentSeat]
        IF player.status != 'folded':
          order.push(player)

      currentSeat = (currentSeat + 1) % totalPlayers

  결과 (8명 기준):
  [UTG, UTG+1, MP, MP+1, CO, BTN, SB, BB]

ELSE IF street == "postflop":
  // 포스트플랍: SB부터 시작

  Step 1: SB 위치
    SB = (buttonPosition + 1) % totalPlayers

  Step 2: 순서 생성
    order = []
    currentSeat = SB

    FOR i = 0 TO totalPlayers - 1:
      IF seatMap[currentSeat] 존재:
        player = seatMap[currentSeat]
        IF player.status == 'active':  // 폴드/올인 제외
          order.push(player)

      currentSeat = (currentSeat + 1) % totalPlayers

  결과:
  [SB, BB, UTG, UTG+1, ..., BTN]
  (단, 폴드/올인 플레이어 제외)

반환:
state.actionQueue = order
state.currentActionIndex = 0
state.nextActionPlayer = order[0]
```

### 💰 알고리즘 4: 팟 계산 (calculateFinalPot)

```
목적: 정확한 팟 사이즈 계산 (사이드팟 포함)

알고리즘:

Step 1: 플레이어별 기여액 추적
  contributions = {}  // {playerName: totalAmount}

  // 블라인드 추가
  contributions[SB_player] = smallBlind
  contributions[BB_player] = bigBlind

  // BB Ante가 있으면
  IF state.actionState.hasBBAnte:
    FOR 각 플레이어:
      contributions[플레이어] += bigBlind

Step 2: 각 액션의 베팅액 추가
  FOR 각 스트릿 IN ["preflop", "flop", "turn", "river"]:
    FOR 각 액션 IN state.actionState[스트릿]:
      IF 액션.type IN [Call, Bet, Raise, All-In]:
        IF contributions[액션.player] 없음:
          contributions[액션.player] = 0

        contributions[액션.player] += 액션.amount

Step 3: 올인 플레이어 사이드팟 처리
  allInPlayers = 액션.type == "All-In"인 플레이어들

  IF allInPlayers 존재:
    // 올인 금액으로 정렬
    allInPlayers.sort((a, b) =>
      contributions[a] - contributions[b]
    )

    pots = []  // 메인팟 + 사이드팟들

    FOR 각 allInPlayer IN allInPlayers:
      올인액 = contributions[allInPlayer]

      // 이 금액까지만 각 플레이어가 기여 가능
      potAmount = 0
      eligiblePlayers = []

      FOR 각 플레이어:
        기여가능액 = Math.min(contributions[플레이어], 올인액)
        potAmount += 기여가능액
        contributions[플레이어] -= 기여가능액

        IF 기여가능액 > 0:
          eligiblePlayers.push(플레이어)

      pots.push({
        amount: potAmount,
        eligiblePlayers: eligiblePlayers
      })

  ELSE:
    // 올인 없으면 단일 팟
    totalPot = SUM(contributions의 모든 값)
    pots = [{
      amount: totalPot,
      eligiblePlayers: 모든 active 플레이어
    }]

Step 4: 화면에 표시
  IF pots.length == 1:
    "💰 Pot: 18,500"
  ELSE:
    "💰 Main Pot: 12,000"
    "💰 Side Pot 1: 4,500 (3 players)"
    "💰 Side Pot 2: 2,000 (2 players)"

반환:
{
  totalPot: 모든 팟의 합,
  pots: pots 배열,
  breakdown: 플레이어별 기여액
}
```

---

## 4. 데이터 흐름 및 상태 관리

### 📊 데이터 레이어 구조

```
레이어 1: 영구 저장소 (Google Sheets)
  ↓ CSV 다운로드
레이어 2: 로컬 캐시 (window.state)
  ↓ 렌더링
레이어 3: UI (HTML DOM)
  ↓ 사용자 입력
레이어 2: 로컬 캐시 업데이트
  ↓ API 호출
레이어 1: 영구 저장소 저장
```

### 🔄 상태 변경 흐름

```
예시: 플레이어 칩 수정

1. 사용자 액션:
   화면에서 "Alice" 플레이어의 칩 수정 버튼 클릭

2. UI 이벤트:
   openChipsModal(player) 함수 실행

3. 모달 표시:
   ┌─────────────────────┐
   │ Alice               │
   │ 현재 칩: 15,000    │
   │                     │
   │ [12345]  ← 키패드  │
   │                     │
   │ 새 칩: 20,000      │
   │                     │
   │ [취소] [저장]       │
   └─────────────────────┘

4. 사용자 입력:
   "20000" 입력 → 저장 클릭

5. 로컬 상태 즉시 업데이트:
   player = state.playerDataByTable[table].find(p => p.name == "Alice")
   player.chips = 20000

6. UI 즉시 반영:
   renderPlayerSelection()
   → Alice 카드에 "20,000" 표시

7. 백그라운드 API 호출:
   callAppsScript('updatePlayerChips', {
     table: "Ocean Blue",
     name: "Alice",
     chips: 20000
   })

8. Google Sheets 업데이트:
   Apps Script가 Type 시트에서 Alice 행 찾기
   → Chips 칼럼 업데이트

9. 성공 응답:
   IF response.success:
     스낵바 표시: "✅ Alice 칩 업데이트 완료"
   ELSE:
     로컬 상태 롤백:
     player.chips = 15000  // 원래대로
     에러 표시: "❌ 업데이트 실패"
```

### 🔐 데이터 일관성 보장

```
문제:
여러 사용자가 동시에 같은 데이터를 수정하면?

해결책 1: 낙관적 잠금 (Optimistic Locking)

  Step 1: 데이터 읽기 + 버전 번호 저장
    player = {
      name: "Alice",
      chips: 15000,
      version: 42,
      updatedAt: "2025-10-05 14:30:00"
    }

  Step 2: 로컬 수정
    player.chips = 20000

  Step 3: 저장 시 버전 확인
    API 호출 시:
    {
      name: "Alice",
      chips: 20000,
      expectedVersion: 42  ← 기대하는 버전
    }

    Apps Script에서:
    현재DB버전 = getPlayerVersion("Alice")
    IF 현재DB버전 == expectedVersion:
      → 저장 성공
      → 버전 증가: 43
    ELSE:
      → 저장 실패
      → 에러: "다른 사용자가 이미 수정했습니다"

해결책 2: UI 잠금 (executeWithLock)

  중요한 작업 중에는 UI 전체 잠금:

  async executeWithLock(작업) {
    // 1. 로딩 오버레이 표시
    showLoadingOverlay("처리 중...")

    // 2. 모든 버튼 비활성화
    disableAllButtons()

    TRY:
      // 3. 작업 실행
      await 작업()
    FINALLY:
      // 4. 잠금 해제
      hideLoadingOverlay()
      enableAllButtons()
  }

  사용:
  executeWithLock(async () => {
    await saveHandToSheets()
  })
```

### 📝 로컬 저장소 (localStorage) 활용

```
영구 설정 저장:

저장되는 것:
- appsScriptUrl: Google Apps Script URL
- googleSheetsSpreadsheetId: 스프레드시트 ID
- selectedTimezone: 선택한 타임존
- chipValidation: 칩 검증 ON/OFF
- deviceId: 기기 고유 ID
- configGistId: 클라우드 동기화 ID

저장 타이밍:
- 설정 변경 즉시: localStorage.setItem(key, value)
- 앱 시작 시 로드: localStorage.getItem(key)

동기화 로직:
localStorage (로컬)
    ↕ 양방향 동기화
GitHub Gist (클라우드)

알고리즘:
IF 클라우드 동기화 활성화:
  // 앱 시작 시
  cloudConfig = await loadConfigFromCloud()
  localConfig = localStorage

  IF cloudConfig.lastUpdated > localConfig.lastUpdated:
    // 클라우드가 더 최신
    localStorage = cloudConfig
    표시: "☁️ 클라우드에서 설정 복원"
  ELSE:
    // 로컬이 더 최신
    await saveConfigToCloud(localConfig)
    표시: "☁️ 클라우드에 설정 업로드"
```

---

## 📌 요약: 전체 실행 흐름

```
1. 브라우저 로드
   ↓
2. HTML + CSS + JavaScript 파싱
   ↓
3. DOMContentLoaded 이벤트
   ↓
4. 초기 설정 로드 (localStorage, Config 시트)
   ↓
5. 상태 객체 초기화 (window.state)
   ↓
6. Google Sheets 데이터 다운로드 (CSV)
   ↓
7. 데이터 파싱 및 구조화
   ↓
8. 화면 렌더링 (테이블 목록)
   ↓
9. 사용자 대기 상태
   ↓
10. 사용자 액션 (테이블 선택, 플레이어 선택, 액션 기록)
    ↓
11. 로컬 상태 즉시 업데이트
    ↓
12. UI 즉시 반영
    ↓
13. 백그라운드 API 호출 (Google Sheets 저장)
    ↓
14. 성공/실패 피드백
    ↓
10. (반복)
```

---

이 문서는 앱의 전체 논리 흐름을 설명합니다. 코드를 보지 않아도 앱이 어떻게 동작하는지 이해할 수 있도록 작성되었습니다.
