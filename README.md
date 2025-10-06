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

## 🚨 현재 작업: index.html 리팩토링 (v3.12.0)

### 현황
- **시작**: 7909줄 (337KB)
- **현재**: 7803줄
- **목표**: 1000줄 이하 (-87%)
- **진행률**: 1.3% (106줄 감소)
- **상태**: 🟡 주의 (전략 전환 필요)

### 완료 (Step 1-4)
- ✅ Step 1: 의존성 분석 (2025-10-06)
- ✅ Step 2: 순수 함수 분리 -35줄
- ✅ Step 3: 전역 스토어 -60줄
- ✅ Step 4: Hand Recorder -11줄

### 다음 작업
⏳ **Step 4 확장**: Hand Recorder 완전 분리 (-300줄 예상)

**상세**: [docs/STATUS.md](docs/STATUS.md) 참조

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
├── index.html (7803줄) ← 리팩토링 진행 중
├── server.js           # 로컬 서버
│
├── docs/               # 📚 문서 (4개 핵심 + 3개 참조)
│   ├── PLAN.md                     → 비전 (불변)
│   ├── PRD.md                      → 작업 목록 (변동)
│   ├── LLD.md                      → AI 인덱스 (현재)
│   ├── STATUS.md                   → 현재 상태 ⭐
│   ├── SETUP_GUIDE.md              → 초기 설정
│   ├── STEP_BY_STEP_REFACTORING.md → 상세 가이드
│   ├── API_REFERENCE.md            → Apps Script API
│   ├── analysis/
│   │   └── DEPENDENCY_MAP.md       → 의존성 분석
│   └── archive/                    → 과거 문서 (참고용)
│
├── src/                # 소스 코드
│   ├── core/
│   │   └── store.js (141줄) ✅
│   ├── modules/
│   │   ├── pure-utils.js (70줄) ✅
│   │   └── hand-recorder.js (62줄) ✅
│   ├── facades/
│   │   └── hand-facade.js (29줄) ✅
│   ├── js/ (9개 기존 파일)
│   └── utils/ (3개 기존 파일)
│
└── apps-script/
    └── Code_v71.0.3.gs
```

## 📖 문서 가이드

### 핵심 문서 (4개)
1. **[PLAN.md](docs/PLAN.md)** - 프로젝트 비전 및 페르소나
2. **[PRD.md](docs/PRD.md)** - Step 4~12 작업 목록
3. **[LLD.md](docs/LLD.md)** - AI가 코드 찾기 위한 인덱스
4. **[STATUS.md](docs/STATUS.md)** ⭐ - 현재 상태 (매 세션 시작 시 읽기)

### 참조 문서 (3개)
- **[SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** - 초기 설정 가이드
- **[STEP_BY_STEP_REFACTORING.md](docs/STEP_BY_STEP_REFACTORING.md)** - Step별 상세 가이드
- **[API_REFERENCE.md](docs/API_REFERENCE.md)** - Apps Script API 레퍼런스

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
