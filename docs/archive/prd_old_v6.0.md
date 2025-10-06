# 📋 PRD v6.0 - Tournament Field Data Platform

> **Product Requirements Document v6.0**
> **최종 업데이트**: 2025-10-06
> **대상 사용자**: 토너먼트 현장 데이터 매니저
> **현재 버전**: v3.10.0

## 📚 관련 문서

- **개발 진행**: [IMPLEMENTATION_ROADMAP.md](planning/IMPLEMENTATION_ROADMAP.md)
- **초기 설정**: [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **API 레퍼런스**: [API_REFERENCE.md](API_REFERENCE.md)
- **기술 설계**: [TECHNICAL_DESIGN.md](TECHNICAL_DESIGN.md)

---

## 🎯 제품 비전

**"토너먼트 현장에서 키 플레이어의 핸드를 빠르고 정확하게 기록하여, 프로덕션 팀이 최고의 핸드를 선별하여 방송에 송출할 수 있게 한다"**

### 핵심 가치

1. **현장 중심** - 대회장을 돌아다니며 스마트폰으로 작업
2. **수동 작업 최적화** - 모든 작업이 수동, 3-4터치로 완료
3. **사전 등록 활용** - 15명 키 플레이어 정보 미리 준비
4. **오프라인 우선** - Wi-Fi 불안정 환경에서도 100% 작동

---

## 👤 사용자 페르소나

### Alex Park (Tournament Field Data Manager)

```yaml
나이: 32세
근무지: 주요 포커 토너먼트 현장 (마닐라, 마카오, 라스베가스)
업무: 키 플레이어 핸드 기록 및 데이터 수집

근무 환경:
  장비: iPhone 14 Pro (스마트폰)
  조작: 두 손으로 90% 이상
  소프트웨어: Virtual Data - Poker Hand Logger
  통신: 대회장 Wi-Fi (불안정) + 5G 데이터

대회 당일 오전 (2시간 전):
  08:00 - 프로덕션 매니저가 Type 시트에 사전 등록
         → 키 플레이어 15명 (Phil Ivey, Tom Dwan, Daniel Negreanu...)
         → 각자의 테이블 번호 (대회 사무국 제공)
         → 좌석 번호 (대회 사무국 제공)
         → 시작 칩 (Day 1 종료 시점)
         → Keyplayer = TRUE 플래그

  09:00 - Alex 출근, 앱 실행
         → 15명 사전 등록 데이터 자동 로드
         → 키 플레이어 대시보드 확인

대회 진행 중 (10:00 - 18:00):
  10:00 - 대회장 A구역 순찰
         → Phil Ivey 발견 (Table 3, #5)
         → [✓ 확인 완료] 터치 (15초)
         → 상태: ⚠️ 미확인 → ✅ 확인됨

  10:30 - Tom Dwan 칩 카운트 변동 감지
         → [Update] 버튼 → Quick Update 팝업
         → Chips: 145K → 180K 수정 (20초)

  11:00 - Phil Ivey 큰 팟 진행 중
         → [Record Hand] 버튼
         → Table 3 플레이어 자동 로드 (< 1초)
         → 핸드 #142 자동 시작
         → 액션 입력 (두 손으로)
         → 쇼다운 카드 입력
         → [Save Hand] (3분)

  11:30 - Daniel Negreanu 발견 (Table 7)
         → 테이블 전환 (< 1초, IndexedDB)
         → 핸드 기록...

주요 불만 (현재 v3.10.0):
  ❌ 테이블 전환 느림 (5-10초) - 매번 Google Sheets 요청
  ❌ 핸드 번호 수동 입력 - 실수 가능성
  ❌ 키 플레이어 전용 대시보드 없음 - Type 시트에서 수동 검색
  ❌ 스마트폰 UI 최적화 부족 - 터치 영역 작음 (< 44px)
  ❌ 오프라인 모드 불완전 - Wi-Fi 끊기면 작업 불가

원하는 기능 (Phase 4 목표):
  ✅ 키 플레이어 대시보드 - 15명 한눈에
  ✅ 빠른 확인/업데이트 - 3-4터치로 완료
  ✅ 테이블 전환 < 1초 - IndexedDB 캐싱
  ✅ 핸드 번호 자동 증가 - 수동 입력 제거
  ✅ 완전한 오프라인 모드 - 동기화는 나중에
  ✅ 두 손 최적화 UI - 48px+ 터치 영역
```

---

## 🎬 핵심 사용자 시나리오

### 시나리오 1: 대회 전 준비 (2시간 전)

```
[프로덕션 매니저 작업 - Google Sheets]

1. Type 시트 열기
2. 키 플레이어 15명 등록:

   A           B              C        D      E              F    G      H
   Poker Room  Table Name     Table No Seat   Players        Nat  Chips  Keyplayer
   ─────────────────────────────────────────────────────────────────────────────────
   Main Floor  Feature Table  3        #5     Phil Ivey      USA  128K   TRUE
   Main Floor  Dragon Green   7        #2     Tom Dwan       USA  145K   TRUE
   Main Floor  Ocean Blue     12       #8     Daniel Negre   CAN  98K    TRUE
   ... (총 15명)

3. Apps Script 배포 URL Alex에게 전달

시간: 15분
```

### 시나리오 2: 현장 확인 작업 (가장 빈번)

```
[Alex 작업 - 스마트폰]

1. 키 플레이어 대시보드 열기
   ┌──────────────────────────────────┐
   │ 🌟 Key Players (15)              │
   ├──────────────────────────────────┤
   │ ⚠️ Phil Ivey                     │
   │    Table 3  #5  128K             │
   │    [✓ 확인] [Update] [Record]     │
   │                                   │
   │ ✅ Tom Dwan                      │
   │    Table 7  #2  145K             │
   │    [Update] [Record]              │
   │                                   │
   │ ⚠️ Daniel Negreanu               │
   │    Table 12 #8  98K              │
   │    [✓ 확인] [Update] [Record]     │
   └──────────────────────────────────┘

2. Phil Ivey 발견 → [✓ 확인] 터치
   → 상태: ⚠️ 미확인 → ✅ 확인됨
   → IndexedDB 즉시 업데이트
   → 백그라운드 동기화

시간: 15초
터치: 2회
```

### 시나리오 3: 칩 카운트 업데이트 (두 번째로 빈번)

```
1. Tom Dwan 카드 → [Update] 터치

2. Quick Update 팝업 (현재 정보 미리 입력됨)
   ┌──────────────────────────────────┐
   │ Quick Update - Tom Dwan          │
   ├──────────────────────────────────┤
   │ Table:  [7      ]  # (읽기 전용) │
   │ Seat:   [#2     ]  # (읽기 전용) │
   │ Chips:  [145K___] → 180K 수정    │
   ├──────────────────────────────────┤
   │ [✓ Save]  [✗ Cancel]             │
   └──────────────────────────────────┘

3. [✓ Save] 터치
   → IndexedDB 즉시 저장
   → 백그라운드 Type 시트 업데이트

시간: 20초
터치: 3회 (Update → Chips 수정 → Save)
```

### 시나리오 4: 핸드 기록 (가장 중요)

```
1. Phil Ivey 카드 → [Record Hand] 터치
   → Table 3 플레이어 자동 로드 (< 1초, IndexedDB)

2. 핸드 자동 시작
   ┌──────────────────────────────────┐
   │ Table 3 - Hand #142 (자동)       │
   ├──────────────────────────────────┤
   │ BB: 1K/2K  Ante: 2K              │
   ├──────────────────────────────────┤
   │ #1 Mike   15K  [Act] [Card]      │
   │ #3 Sarah  22K  [Act] [Card]      │
   │ #5 🌟Phil 128K [Act] [Card]      │
   │ #7 John   45K  [Act] [Card]      │
   └──────────────────────────────────┘

3. 액션 입력 (두 손으로)
   → Mike: Call 2K
   → Sarah: Fold
   → 🌟 Phil: Raise 8K (키 플레이어 강조)
   → John: Call 8K

4. Flop: A♠ K♥ 7♣
   → Phil: Bet 15K
   → John: Call 15K

5. Turn: 3♦
   → Phil: Check
   → John: All-in 20K
   → Phil: Call 20K

6. River: Q♠
   → 쇼다운
   → Phil: A♣ K♠ (Two Pair)
   → John: 7♥ 7♦ (Set)

7. [Winner: John] 선택 → [Save Hand]
   → Hand 시트에 저장 (HAND, PLAYER, EVENT 행)
   → 핸드 #143 자동 시작

시간: 3분
터치: 15-20회 (액션, 카드, 승자)
```

### 시나리오 5: 다른 테이블로 이동 (빠른 전환)

```
1. Daniel Negreanu 카드 → [Record Hand] 터치
   → 현재 Table 3 → Table 12로 전환

2. 자동 테이블 전환 (< 1초)
   → IndexedDB에서 Table 12 플레이어 로드
   → 캐시 없으면 Google Sheets 요청
   → 핸드 #089 자동 시작 (Table 12의 마지막 핸드 +1)

시간: < 1초 (캐시), 2-3초 (캐시 미스)
터치: 1회 (Record Hand)
```

---

## 🗂️ 핵심 기능 요구사항

### F1. 키 플레이어 대시보드 (Phase 4 Priority 1)

**목적**: 15명 사전 등록 키 플레이어 한눈에 관리

**기능**:
- ✅ Type 시트에서 Keyplayer=TRUE 필터링
- ✅ 확인 상태 표시 (⚠️ 미확인 / ✅ 확인됨)
- ✅ 빠른 액션 버튼 (확인 / Update / Record Hand)
- ✅ 실시간 정보 (Table, Seat, Chips)
- ✅ 오프라인 작동 (IndexedDB 캐싱)

**화면 구성** (스마트폰 세로 모드):
```
┌────────────────────────────────────┐
│ 🌟 Key Players Dashboard           │
│ ✅ 12 confirmed / ⚠️ 3 pending      │
├────────────────────────────────────┤
│                                     │
│ ⚠️ Phil Ivey                        │
│    Table 3  #5  128K                │
│    [✓ 확인] [Update] [Record]       │ ← 48px 높이
│                                     │
│ ✅ Tom Dwan                         │
│    Table 7  #2  180K                │
│    [Update] [Record]                │ ← 확인 완료 후
│                                     │
│ ⚠️ Daniel Negreanu                  │
│    Table 12 #8  98K                 │
│    [✓ 확인] [Update] [Record]       │
│                                     │
│ ... (스크롤)                        │
│                                     │
├────────────────────────────────────┤
│ [⚙️ Settings] [📊 Stats]            │
└────────────────────────────────────┘
```

**성능 목표**:
- 대시보드 로드: < 1초 (IndexedDB)
- 확인 상태 업데이트: < 0.3초 (로컬)

---

### F2. 빠른 업데이트 워크플로우 (Phase 4 Priority 1)

**목적**: 칩 카운트 등 정보 변경을 3-4터치로 완료

**기능**:
- ✅ 현재 정보 미리 입력 (Table, Seat, Chips)
- ✅ 수정 필요한 필드만 변경
- ✅ 큰 터치 영역 (48px+)
- ✅ 즉시 로컬 저장 → 백그라운드 동기화

**Quick Update 팝업**:
```
┌────────────────────────────────────┐
│ Quick Update - Tom Dwan            │
├────────────────────────────────────┤
│                                     │
│ Table:  [7      ]  # (읽기 전용)    │
│                                     │
│ Seat:   [#2     ]  # (읽기 전용)    │
│                                     │
│ Chips:  [180K___]  ← 수정 가능      │
│                                     │
│ Notes:  [________]  (선택)          │
│                                     │
├────────────────────────────────────┤
│ [✓ Save]           [✗ Cancel]      │
│  (48px)             (48px)          │
└────────────────────────────────────┘
```

**성능 목표**:
- 팝업 열기: < 0.3초
- 저장: < 0.5초 (로컬)

---

### F3. 테이블 전환 최적화 (Phase 4 Priority 1)

**목적**: 키 플레이어 추적 시 1초 이내 테이블 이동

**기능**:
- ✅ IndexedDB 3-Tier 캐싱 (Table → Players)
- ✅ 자동 캐시 갱신 (5분마다)
- ✅ 오프라인 100% 지원
- ✅ 온라인 복구 시 델타 동기화

**캐싱 전략**:
```javascript
// Tier 1: 현재 테이블 (Hot Cache)
currentTable = await db.tables.get(currentTableNo);  // < 50ms

// Tier 2: 최근 3개 테이블 (Warm Cache)
recentTables = await db.tables.where('lastAccess').above(now - 30min).toArray();

// Tier 3: 전체 테이블 (Cold Cache)
allTables = await db.tables.toArray();  // Fallback
```

**성능 목표**:
- 캐시 히트: < 50ms (IndexedDB)
- 캐시 미스: < 2초 (Google Sheets)
- 목표: 캐시 히트율 > 80%

---

### F4. 핸드 번호 자동 증가 (Phase 4 Priority 2)

**목적**: 수동 입력 제거, 실수 방지

**기능**:
- ✅ 테이블별 마지막 핸드 번호 추적
- ✅ 핸드 시작 시 자동 +1
- ✅ 수동 수정 가능 (에러 대비)
- ✅ 중복 방지 검증

**로직**:
```javascript
// 1. Index 시트에서 테이블별 최대 핸드 조회
const lastHand = indexRows
  .filter(row => row.table === currentTable)
  .reduce((max, row) => Math.max(max, row.handNumber), 0);

// 2. 자동 증가
const nextHandNumber = lastHand + 1;

// 3. UI에 표시 (수동 수정 가능)
state.actionState.handNumber = nextHandNumber;
```

**성능 목표**:
- 핸드 번호 계산: < 0.1초

---

### F5. 오프라인 모드 완성 (Phase 4 Priority 2)

**목적**: Wi-Fi 불안정 환경에서 100% 작동

**기능**:
- ✅ 모든 작업 로컬 우선 (IndexedDB)
- ✅ 온라인 복구 시 자동 델타 동기화
- ✅ 충돌 해결 (Last-Write-Wins)
- ✅ 오프라인 상태 UI 표시

**동기화 로직**:
```javascript
// 1. 오프라인 작업 큐 저장
await db.syncQueue.add({
  type: 'UPDATE_PLAYER',
  table: 7,
  player: 'Tom Dwan',
  chips: 180000,
  timestamp: Date.now()
});

// 2. 온라인 복구 감지
window.addEventListener('online', async () => {
  const queue = await db.syncQueue.toArray();

  // 3. 배치 동기화
  for (const task of queue) {
    await syncToGoogleSheets(task);
    await db.syncQueue.delete(task.id);
  }
});
```

**성능 목표**:
- 오프라인 저장: < 0.3초
- 온라인 동기화: < 5초 (배치)

---

### F6. 스마트폰 UI 최적화 (Phase 4 Priority 2)

**목적**: 두 손 조작, 터치 친화적 인터페이스

**기능**:
- ✅ 최소 터치 영역 48px (Apple HIG 기준)
- ✅ 스와이프 제스처 (액션 취소, 테이블 전환)
- ✅ 진동 피드백 (액션 완료, 에러)
- ✅ 다크 모드 (배터리 절약)

**터치 영역 가이드**:
```css
/* 주요 버튼 */
.btn-primary {
  min-height: 48px;
  min-width: 48px;
  font-size: 16px;
}

/* 액션 버튼 (핸드 기록) */
.action-button {
  min-height: 56px;  /* 더 큼 */
  min-width: 80px;
  margin: 8px;
}

/* 스와이프 영역 */
.swipe-area {
  min-height: 60px;
}
```

**제스처 지원**:
- 왼쪽 스와이프: 액션 취소 (Undo)
- 오른쪽 스와이프: 다음 스트릿
- 아래 스와이프: 대시보드 닫기

---

### F7. AI 칩 분석 (Phase 4 Priority 3 - Nice to Have)

**목적**: 카메라로 칩 촬영 → 자동 카운트

**현재 상태**: UI 스켈레톤만 존재, Gemini Vision API 미연동

**기능** (향후 구현):
- ✅ 칩 컬러 사전 등록 (최대 5개)
- ✅ 카메라 촬영 → Gemini Vision API
- ✅ 칩 색상/개수 자동 인식
- ✅ 금액 자동 계산
- ✅ 수동 수정 가능

**우선순위**: Phase 4 이후 (현재는 수동 입력)

---

## 🚀 비기능 요구사항

### NFR1. 성능

| 작업 | 현재 (v3.10.0) | 목표 (Phase 4) |
|-----|----------------|----------------|
| 앱 시작 | 2-3초 | < 2초 |
| 테이블 전환 | 5-10초 | < 1초 (캐시) |
| 핸드 시작 | 1-2초 | < 0.5초 |
| 액션 기록 | 0.5초 | < 0.3초 |
| 키 플레이어 확인 | N/A | < 15초 (3터치) |
| 칩 업데이트 | N/A | < 20초 (4터치) |

### NFR2. 로컬 우선 (Local-First)

- ✅ 모든 작업 IndexedDB 즉시 완료
- ✅ 백그라운드 Google Sheets 동기화
- ✅ 오프라인 100% 지원 (읽기 + 쓰기)
- ✅ 온라인 복구 시 델타 동기화 (충돌: Last-Write-Wins)

### NFR3. 모바일 최적화

- ✅ 스마트폰 세로 모드 우선 설계
- ✅ 두 손 조작 지원 (90%+ 시나리오)
- ✅ 터치 영역 48px+ (Apple HIG)
- ✅ 진동 피드백 (햅틱)
- ✅ 다크 모드 (배터리 절약)
- ✅ 5G + Wi-Fi 듀얼 연결

### NFR4. 데이터 무결성

- ✅ 핸드 번호 중복 방지 (테이블별)
- ✅ 플레이어 좌석 중복 방지
- ✅ 트랜잭션 처리 (핸드 저장 = HAND + PLAYER + EVENT 행 원자적 삽입)
- ✅ 오프라인 큐 보장 (IndexedDB 영속성)

---

## 📊 성공 지표

| KPI | 현재 | Phase 4 목표 | 측정 방법 |
|-----|------|--------------|----------|
| 평균 테이블 전환 시간 | 7초 | < 1초 | Analytics |
| 키 플레이어 확인 시간 | N/A | < 15초 | Stopwatch |
| 칩 업데이트 시간 | N/A | < 20초 | Stopwatch |
| 핸드 기록 시간 | 3-5분 | 2-3분 | Analytics |
| 오프라인 사용 비율 | 20% | > 50% | Network 로그 |
| 캐시 히트율 | 0% | > 80% | IndexedDB 로그 |
| 사용자 만족도 (CSAT) | 3.5/5 | > 4.5/5 | 설문 |

---

## ⚠️ 제약사항

### 1. 기존 데이터베이스 구조 유지 (필수)

**Type 시트** (8 컬럼):
```
A: Poker Room
B: Table Name
C: Table No
D: Seat No (#1-#10)
E: Players (name)
F: Nationality
G: Chips
H: Keyplayer (TRUE/FALSE)
```

**Hand 시트** (행 기반):
- HAND 행: 핸드 메타데이터
- PLAYER 행: 플레이어 정보
- EVENT 행: 액션/카드

**Index 시트**: 핸드 인덱스

**변경 금지**: Apps Script v71.0.3 호환성 유지

### 2. Google Sheets API 제한

- 동시 쓰기 제한: 초당 100 requests
- API 쿼터: 일일 500,000 requests
- **해결**: 로컬 우선, 배치 동기화 (5분 간격)

### 3. 모바일 환경

- 화면: 세로 모드 390x844 (iPhone 14 Pro)
- 네트워크: Wi-Fi (불안정) + 5G (백업)
- 배터리: 8시간 연속 사용 목표
- **해결**: 다크 모드, 동기화 간격 조절

### 4. 수동 작업 중심

- ❌ 자동 칩 리더 등록 없음
- ❌ AI 자동 핸드 기록 없음
- ✅ 모든 작업 사용자 입력 기반
- ✅ 자동화는 UI 편의 기능만 (핸드 번호 증가 등)

---

## 📝 용어 정의

- **키 플레이어 (Key Player)**: 대회 주요 플레이어, 프로덕션 팀이 집중 추적 (15명 사전 등록)
- **현장 (Field)**: 토너먼트 대회장 (Feature Table 제외)
- **확인 (Confirm)**: 키 플레이어 현장 확인 상태 업데이트
- **핸드 (Hand)**: 포커 게임 한 라운드 (Preflop → Flop → Turn → River)
- **액션 (Action)**: 플레이어 행동 (Fold, Call, Raise, All-in)
- **팟 (Pot)**: 현재 베팅 총액
- **쇼다운 (Showdown)**: 마지막 카드 공개
- **동기화 (Sync)**: 로컬 데이터 → Google Sheets 업로드

---

## 🚧 알려진 제한사항 (v3.10.0)

### 1. 성능 이슈
- **테이블 전환 5-10초**: 매번 Google Sheets GET 요청
- **핸드 번호 수동 입력**: 실수 가능성

### 2. 키 플레이어 기능 부재
- Type 시트에서 수동 검색
- 확인 상태 관리 없음
- 전용 대시보드 없음

### 3. 오프라인 모드 불완전
- IndexedDB 캐싱: Type 시트만 (Phase 1 완료)
- Hand 시트 오프라인 쓰기 미지원
- 동기화 충돌 해결 없음

### 4. UI 최적화 부족
- 터치 영역 < 44px (일부 버튼)
- 세로 모드 최적화 부족
- 제스처 지원 없음

---

## 📋 Phase 4 개발 우선순위

### Priority 1 (필수 - Week 1-2)
1. ✅ 키 플레이어 대시보드 (F1)
2. ✅ 빠른 업데이트 워크플로우 (F2)
3. ✅ 테이블 전환 최적화 (F3)

### Priority 2 (중요 - Week 3-4)
4. ✅ 핸드 번호 자동 증가 (F4)
5. ✅ 오프라인 모드 완성 (F5)
6. ✅ 스마트폰 UI 최적화 (F6)

### Priority 3 (선택 - Phase 5)
7. ⏳ AI 칩 분석 (F7) - Gemini Vision API 연동

---

## 📧 승인 및 연락처

**프로젝트 매니저**: Alex Park
**기술 리드**: [Your Name]
**승인일**: 2025-10-06

**피드백**: [GitHub Issues](https://github.com/garimto81/virtual_data_claude/issues)

---

© 2025 Virtual Data - Tournament Field Data Platform v6.0