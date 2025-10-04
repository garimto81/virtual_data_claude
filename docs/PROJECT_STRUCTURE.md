# 📁 프로젝트 구조

## 🏗️ 정리된 디렉토리 구조 (2025-09-24)

```
virtual_data_claude/
├── 📄 index.html              # 메인 애플리케이션
├── 🖥️ server.js               # 로컬 개발 서버 (Node.js)
├── 🛡️ phase4-functions.js     # API 보호 및 에러 처리 시스템
├── 📦 package.json            # Node.js 의존성 관리
├── 📋 README.md               # 메인 프로젝트 문서
├── ⚙️ _config.yml             # GitHub Pages 설정
├── 🚫 .gitignore              # Git 제외 파일 설정
├── 📝 .nojekyll               # GitHub Pages Jekyll 비활성화
│
├── 📚 docs/                   # 📖 프로젝트 문서들
│   ├── ANALYSIS_REPORT.md     # 프로젝트 분석 보고서
│   ├── APPS_SCRIPT_DEPLOYMENT_GUIDE.md  # Apps Script 배포 가이드
│   ├── APPS_SCRIPT_FLOW_ANALYSIS.md     # Apps Script 플로우 분석
│   ├── CHECKLIST.md           # 개발 체크리스트
│   ├── LOAD_INITIAL_DESIGN_ANALYSIS.md  # 초기 설계 분석
│   ├── MIGRATION_PLAN.md      # 마이그레이션 계획
│   ├── RUNTIME_ERROR_ANALYSIS.md        # 런타임 에러 분석
│   └── virtual_data_master_plan.md      # 마스터 플랜
│
├── 💻 src/                    # 🔧 소스 코드 모듈들
│   └── js/                    # JavaScript 모듈들
│       ├── action-order-manager-v2.js      # 액션 순서 관리 V2
│       ├── duplicate-remover.js            # 중복 플레이어 제거
│       ├── event-manager.js                # 이벤트 관리자
│       ├── modal-auto-close.js             # 모달 자동 닫기
│       ├── unified-event-handler.js        # 통합 이벤트 핸들러
│       └── action-order-integration-guide.md  # 통합 가이드
│
├── ⚙️ apps-script/            # 🔧 Google Apps Script 백엔드
│   └── Code_v71.0.3.gs        # 백엔드 API 서버 (Google Apps Script)
│
├── 📦 archive/                # 🗃️ 백업 및 아카이브 파일들
│   ├── index_v2_manual_init.html    # 수동 초기화 버전
│   ├── index_v3_smart_init.html     # 스마트 초기화 버전
│   ├── minimal_index.html           # 최소 버전
│   ├── action-history.js            # Phase 1: 액션 히스토리 시스템
│   ├── batch-processor.js           # Phase 2: 배치 처리 시스템
│   ├── mobile-optimizer.js          # Phase 3: 모바일 최적화
│   ├── offline-storage.js           # Phase 3: 오프라인 저장소
│   ├── virtual-scroll.js            # Phase 3: 가상 스크롤
│   ├── double-tap-handler.js        # Phase 2: 더블탭 핸들러
│   ├── chip-analysis-module.js      # 칩 분석 모듈
│   ├── table-management-v59.js      # 테이블 관리 V59
│   └── old-tests/                   # 이전 테스트 파일들
│
├── 💾 backups/               # 🔙 자동 백업 파일들
│   └── 20250923/             # 날짜별 백업
│
└── 📂 .github/               # 🔧 GitHub 설정 및 워크플로우
    └── workflows/            # GitHub Actions
```

## 🎯 핵심 파일 설명

### 🏠 루트 레벨 (메인 애플리케이션)
- **`index.html`**: 메인 포커 핸드 로거 애플리케이션 (320KB+)
- **`server.js`**: 로컬 개발 서버 (CORS 지원)
- **`phase4-functions.js`**: API 호출 보호 시스템 및 에러 처리
- **`package.json`**: Playwright 테스트 프레임워크 의존성

### 📚 docs/ (프로젝트 문서)
- **체계적인 문서화**: 분석, 가이드, 체크리스트, 계획서
- **개발 히스토리**: 각 단계별 상세 기록
- **마스터 플랜**: 전체 시스템 설계 및 로드맵

### 💻 src/js/ (핵심 모듈)
- **ActionOrderManagerV2**: 포커 액션 순서 자동 관리
- **DuplicateRemover**: 중복 플레이어 자동 제거
- **EventManager**: 이벤트 리스너 통합 관리
- **UnifiedEventHandler**: 모바일 터치 이벤트 최적화

### ⚙️ apps-script/ (백엔드 API)
- **Code_v71.0.3.gs**: Google Sheets 연동 REST API
- **기능**: 플레이어 관리, 핸드 데이터 저장, 실시간 동기화

### 📦 archive/ (개발 히스토리)
- **버전 백업**: 이전 index.html 버전들
- **Phase 시스템**: 단계별 기능 개발 히스토리
- **레거시 모듈**: 이전 구현체들

## 🚀 개발 환경 설정

```bash
# 프로젝트 클론
git clone https://github.com/garimto81/virtual_data_claude.git
cd virtual_data_claude

# 의존성 설치
npm install

# 로컬 서버 실행
node server.js  # http://localhost:8080

# 또는 Python 서버
python -m http.server 8000
```

## 🎯 파일 역할별 분류

### 🔥 Production 파일 (운영 환경)
- `index.html`, `server.js`, `phase4-functions.js`
- `apps-script/Code_v71.0.3.gs`
- `src/js/` 모든 모듈들

### 📖 Documentation (문서)
- `README.md` (메인)
- `docs/` 폴더 전체

### 🗃️ Archive (백업/참조용)
- `archive/` 폴더 전체
- `backups/` 폴더 전체

### ⚙️ Configuration (설정)
- `package.json`, `_config.yml`, `.gitignore`
- `.nojekyll`, `.github/`

---

## 🧹 정리 작업 내역 (2025-09-24)

### ✅ 삭제된 파일들 (총 18개)
```
🗑️ 테스트/디버그 HTML 파일들 (10개):
- debug_error.html, debug_phase4.html
- test_phase1.html ~ test_phase4.html
- test_phase4_external.html, test_smart_init.html
- simple_test.html, TEST_DEBUG.html

🗑️ 테스트/유틸리티 JS 파일들 (8개):
- find_all_errors.js, find_error_precise.js
- find_exact_error.js, find_syntax_error.js
- fix_all_multiline_arrows.js
- test_code_segment.js, test_phase4_playwright.js
- validate_syntax.js
```

### 📁 이동된 파일들
```
📚 docs/로 이동 (7개 MD 파일):
- ANALYSIS_REPORT.md
- APPS_SCRIPT_DEPLOYMENT_GUIDE.md
- APPS_SCRIPT_FLOW_ANALYSIS.md
- CHECKLIST.md
- LOAD_INITIAL_DESIGN_ANALYSIS.md
- MIGRATION_PLAN.md
- RUNTIME_ERROR_ANALYSIS.md

📦 archive/로 이동 (3개 백업 HTML):
- index_v2_manual_init.html
- index_v3_smart_init.html
- minimal_index.html
```

### 🎯 최종 결과
- **루트 파일 수**: 46개 → 15개 (67% 감소)
- **디렉토리 구조**: 명확하고 체계적으로 정리
- **유지보수성**: 크게 향상
- **가독성**: 핵심 파일들만 루트에 배치

---

*프로젝트 구조가 깔끔하게 정리되어 개발 효율성과 유지보수성이 크게 향상되었습니다.* 🎉