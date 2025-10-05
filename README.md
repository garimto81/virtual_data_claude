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
- 📸 카메라 번호 자동 관리
- 🏆 승자 선택 및 칩 분배
- 🌍 국가 정보 매핑
- ⚡ IndexedDB 로컬 캐싱 (Phase 1 완료)

## 🚀 빠른 시작

### 1. Google Sheets 설정

```bash
1. 템플릿 시트 복사
2. Apps Script 열기 (확장 프로그램 → Apps Script)
3. apps-script/Code_v71.0.3.gs 붙여넣기
4. 웹 앱으로 배포 (액세스: 모든 사용자)
```

### 2. 프론트엔드 설정

```javascript
// 설정(⚙️) 메뉴에서 Apps Script URL 입력
```

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

## 📁 프로젝트 구조

```
/
├── index.html          # 메인 앱
├── server.js           # 로컬 서버
├── README.md           # 이 파일
│
├── docs/               # 📚 프로젝트 문서
│   ├── SETUP_GUIDE.md      → 초기 설정
│   ├── analysis/           → 앱 분석 (3개)
│   ├── architecture/       → 아키텍처 (3개)
│   └── planning/           → 실행 계획 (4개)
│
├── src/                # 소스 코드
│   ├── config/
│   ├── js/
│   └── utils/
│
├── apps-script/        # Google Apps Script
└── archive/            # 아카이브
```

**문서 위치**: 각 문서는 [docs/](docs/) 폴더에 있습니다.

## 📊 현재 진행 상황

**Phase 2 Week 5 - 코드 정리 진행중**

자세한 로드맵: [docs/planning/IMPLEMENTATION_ROADMAP.md](docs/planning/IMPLEMENTATION_ROADMAP.md)

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
4. 웹 앱으로 배포

자세한 가이드: [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)

## 📖 문서

- **신규 개발자**: [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) → [docs/analysis/ALGORITHM_FLOW.md](docs/analysis/ALGORITHM_FLOW.md)
- **버그 수정**: [docs/analysis/FUNCTION_REGISTRY.md](docs/analysis/FUNCTION_REGISTRY.md)
- **기능 추가**: [docs/planning/IMPLEMENTATION_ROADMAP.md](docs/planning/IMPLEMENTATION_ROADMAP.md)

## ⚠️ 주의사항

1. **권한**: 웹 앱 배포 시 "모든 사용자" 액세스 허용
2. **CORS**: form-urlencoded 방식 사용
3. **시트 이름**: Hand, Index, Type 변경 금지
4. **브라우저 캐시**: 업데이트 후 Ctrl+Shift+R

## 📧 문의

문제나 개선 사항은 [Issue](https://github.com/garimto81/virtual_data_claude/issues) 등록

---

© 2025 Virtual Data - Poker Hand Logger. All rights reserved.
