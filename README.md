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
- [x] **Step 1: 의존성 분석 완료** ✅ 2025-10-06 14:23
  - globals.txt: 22개 전역 변수
  - functions.txt: 129개 함수
  - onclick-events.txt: 6개 이벤트
  - DEPENDENCY_MAP.md: 8개 모듈 구조 설계
- [x] **Step 2: 순수 함수 분리 완료** ✅ 2025-10-06 15:47
  - src/modules/pure-utils.js 생성 (5개 함수)
  - index.html 약 35줄 감소 (7909 → 7874줄)
  - 검증 완료
- [x] **Step 3: 전역 스토어 구축 완료** ✅ 2025-10-06 16:52
  - src/core/store.js 생성 (AppStore 클래스)
  - window.state, APP_CONFIG 통합
  - index.html 약 60줄 감소 (7874 → 7814줄)
  - 검증 완료
  - **Fix (2025-10-06 18:30)**: DEFAULT_APPS_SCRIPT_URL 추가 (localStorage 없을 때 기본값 사용)
- [x] **Step 4: Hand Recorder Facade 완료** ✅ 2025-10-06 18:35
  - src/modules/hand-recorder.js 생성 (HandRecorder 클래스)
  - src/facades/hand-facade.js 생성 (onclick 호환)
  - fetch 로직 모듈화 + isSending 상태 관리
  - index.html 약 11줄 감소 (7814 → 7803줄)
  - 검증 완료
- [ ] **Step 5: Data Loader** (다음 작업, 3일)

**Week 2 (Day 8-14)**
- [x] Step 4: Hand Recorder Facade ✅ 완료
- [ ] Step 5: Data Loader (3일)

**Week 3 (Day 15-21)**
- [ ] Step 6: Pot Calculator (2일)
- [ ] Step 7: Card Selector (2일)
- [ ] Step 8: Player Manager (2일)
- [ ] 최종 통합 테스트 (1일)

### 📊 최적화 진행 현황

| Step | 작업 | 예상 감소 | 실제 감소 | 누적 감소 | 현재 줄 수 | 진행률 |
|------|------|----------|----------|----------|-----------|--------|
| 초기 | - | - | - | - | 7909 | 0% |
| Step 1 | 의존성 분석 | 0줄 | 0줄 | 0줄 | 7909 | 0% |
| Step 2 | 순수 함수 분리 | ~100줄 | 35줄 | 35줄 | 7874 | 0.4% |
| Step 3 | 전역 스토어 | ~150줄 | 60줄 | 95줄 | 7814 | 1.2% |
| Step 4 | Hand Recorder | ~400줄 | 11줄 | 106줄 | 7803 | 1.3% |
| Step 5 | Data Loader | ~800줄 | ? | ? | ? | ? |
| Step 6 | Pot Calculator | ~300줄 | ? | ? | ? | ? |
| Step 7 | Card Selector | ~200줄 | ? | ? | ? | ? |
| Step 8 | Player Manager | ~300줄 | ? | ? | ? | ? |
| **목표** | - | **6909줄** | **?** | **6909줄** | **1000** | **87%** |

### 🎯 다음 작업: Step 5 - Data Loader

**목표**: 데이터 로딩 관련 함수를 모듈화 (예상 800줄 감소)

**주요 함수**:
- `loadInitial()` - CSV 데이터 초기 로딩
- `buildTypeFromCsv()` - Type 시트 파싱
- `buildIndexFromCsv()` - Index 시트 파싱
- IndexedDB 캐싱 관련 함수 (15개)

**작업 순서**:
1. `src/modules/data-loader.js` 생성
   - DataLoader 클래스
   - loadInitial(), buildTypeFromCsv(), buildIndexFromCsv()
   - IndexedDB 캐싱 로직
2. `src/facades/data-facade.js` 생성
   - 기존 함수명 유지
3. index.html 수정
   - 모듈 임포트
   - 기존 함수 제거 (~800줄 예상)

### ✅ Step 4 검증 완료 사항

**A. 콘솔 확인**
- ✅ "[Step 3] 중앙 스토어 초기화 완료" 메시지
- ✅ "[Step 4] Hand Recorder 모듈 로드 완료" 메시지
- ✅ Apps Script URL 출력 (기본값)
- ✅ 에러 0개

**B. 핸드 전송 플로우**
- ✅ 플레이어 추가 → 핸드 시작 → 액션 입력 → 승자 선택
- ✅ 핸드 전송 버튼 클릭
- ✅ 콘솔: "[HandRecorder] Apps Script URL: https://..." 확인
- ✅ 전송 성공 확인

**C. 주요 이슈 해결**
- ⚠️ **문제**: localStorage 없을 때 appsScriptUrl null 반환
- ✅ **해결**: store.js에 DEFAULT_APPS_SCRIPT_URL 추가

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

### 📚 상세 가이드

각 Step별 상세 코드, 검증 방법, 실패 대응은 [docs/STEP_BY_STEP_REFACTORING.md](docs/STEP_BY_STEP_REFACTORING.md) 참고

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
