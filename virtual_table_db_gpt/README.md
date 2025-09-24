# 🎲 Virtual Table DB GPT - 포커 핸드 분석 시스템

온라인 포커 게임의 핸드 히스토리를 체계적으로 관리하고 분석하는 통합 웹 애플리케이션입니다.

[![Version](https://img.shields.io/badge/Version-8.9.0-blue)](https://garimto81.github.io/virtual_table_db_gpt/)
[![License](https://img.shields.io/badge/License-Private-red)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Active-green)](https://garimto81.github.io/virtual_table_db_gpt/)

## 🌐 Live Demo
👉 **[https://garimto81.github.io/virtual_table_db_gpt/](https://garimto81.github.io/virtual_table_db_gpt/)**

## 🎯 주요 기능

### 📊 **포커 핸드 모니터링 시스템** (`poker-monitor.html`)
- **v8.9.0 최신 버전** - Virtual 시트 매칭 개선
- 실시간 핸드 모니터링 및 편집
- Virtual 시트와 자동 시간 매칭
- AI 기반 핸드 분석 (Gemini/OpenAI/Claude)
- 키 플레이어 자동 식별
- 상세 로그 시스템

### 🔍 **분석 도구**
- **시간 분석** (`analyze_hand_times.html`): 핸드 시간 데이터 분석
- **CSV 분석** (`analyze-csv-file.html`): CSV 파일 파싱 및 분석
- **Virtual 시트 연동** (`fetch-virtual-sheet.html`): Google Sheets 데이터 가져오기
- **행 검색** (`find-exact-row.html`): Virtual 시트에서 특정 시간 찾기

### 🧪 **테스트 도구**
- 핸드 업데이트 테스트
- Virtual 시트 연동 테스트
- Apps Script API 테스트
- AI 분석 설정 및 테스트

## 🚀 빠른 시작

### 1. GitHub Pages 접속
```
https://garimto81.github.io/virtual_table_db_gpt/
```

### 2. 메인 애플리케이션 실행
- 포커 핸드 모니터링 시스템 선택
- Virtual 시트 URL 입력
- 실시간 모니터링 시작

### 3. 핸드 편집 워크플로우
1. 핸드 목록에서 편집할 핸드 선택
2. 상세 정보 확인
3. "핸드 편집 완료" 클릭
4. 로그 창에서 처리 과정 확인
5. 자동 생성된 파일명 확인

## 📁 프로젝트 구조

```
virtual_table_db_gpt/
├── index.html              # GitHub Pages 메인 인덱스
├── poker-monitor.html      # 포커 핸드 모니터링 시스템 (v8.7.0)
├── index-compact.html      # 모바일 최적화 버전
├── apps-script/
│   ├── Code.gs            # Google Apps Script 백엔드
│   ├── Code_v56.gs        # v56 업데이트 버전
│   └── ...
├── analyze_*.html          # 각종 분석 도구들
├── test_*.html            # 테스트 도구들
├── _config.yml            # Jekyll 설정
├── .nojekyll              # GitHub Pages 설정
└── README.md              # 프로젝트 문서
```

## 💻 기술 스택

### Frontend
- **HTML5 & JavaScript**: 순수 바닐라 JS
- **Tailwind CSS**: 모던한 UI 스타일링
- **Chart.js**: 데이터 시각화

### Backend
- **Google Apps Script**: 서버 사이드 로직
- **Google Sheets API**: 데이터 저장소
- **REST API**: 프론트-백엔드 통신

### AI & Analysis
- **Gemini API**: Google AI 분석
- **OpenAI API**: ChatGPT 분석
- **Claude API**: Anthropic AI 분석

## 🔧 설정 가이드

### Google Sheets 설정
1. 새 Google Sheets 생성
2. 필요한 시트 추가:
   - `Hand`: 핸드 로우 데이터
   - `Index`: 핸드 인덱스 (17개 열)
   - `Virtual`: Virtual 테이블 데이터

### Apps Script 배포
1. Google Apps Script 프로젝트 생성
2. `apps-script/Code_v56.gs` 코드 복사
3. SHEET_ID를 자신의 스프레드시트 ID로 변경
4. 웹 앱으로 배포 (누구나 액세스 가능)

### AI API 설정 (선택사항)
1. 원하는 AI 서비스 선택 (Gemini/OpenAI/Claude)
2. API 키 발급
3. 설정에서 API 키 입력

## 📊 데이터 구조

### Index 시트 (17개 열)
| 열 | 필드명 | 설명 | 타입 |
|---|--------|------|-----|
| A | handNumber | 핸드 번호 | Number |
| B | startRow | 시작 행 | Number |
| C | endRow | 종료 행 | Number |
| D | handUpdatedAt | 업데이트 시간 | Timestamp |
| E | **handEdit** | 편집 완료 여부 | Boolean |
| F | **handEditTime** | 편집 완료 시간 | DateTime |
| G | label | 레이블 | String |
| H | table | 테이블명 | String |
| I | tableUpdatedAt | 테이블 업데이트 시간 | Timestamp |
| J | Cam | 카메라 정보 | String |
| K-N | CamFile | 카메라 파일 정보 | String[] |
| O | lastStreet | 마지막 스트리트 | String |
| P | lastAction | 마지막 액션 | String |
| Q | workStatus | 작업 상태 | String |

## 🔔 알림 및 로그 시스템

### v8.7.0 새로운 로그 시스템
- **실시간 로그 표시**: 모든 처리 과정 시각화
- **색상 구분**: info(초록), success(밝은 초록), warning(노랑), error(빨강)
- **상세 정보**: CSV 읽기, Virtual 시트 매칭, AI 분석 상태

### 알림 기능
- **사운드 알림**: 새 핸드 감지시 비프음
- **데스크톱 알림**: 브라우저 알림 (권한 필요)
- **실시간 업데이트**: 5초/10초/30초 간격 선택

## 📈 버전 히스토리

### v8.7.0 (2025-09-06)
- ✨ 로그 시스템 추가
- 🔧 Virtual 시트 매칭 개선
- 📊 처리 과정 시각화

### v8.6.0 (2025-09-05)
- 🎯 키 플레이어 분석 기능
- 📁 자동 파일명 생성
- 🔍 시간 매칭 로직 개선

### v8.4.0 (2025-09-05)
- 🚀 초기 릴리즈
- 📊 기본 모니터링 기능
- 🔗 Google Sheets 연동

## 🤝 기여하기

이 프로젝트는 개인 사용 목적으로 제작되었습니다.
문의사항이나 제안사항은 Issues를 통해 알려주세요.

## 📝 라이선스

Private License - 개인 사용 목적

## 👤 개발자

**garimto81**
- GitHub: [@garimto81](https://github.com/garimto81)
- Repository: [virtual_table_db_gpt](https://github.com/garimto81/virtual_table_db_gpt)

---

<div align="center">
  <sub>Built with ❤️ using Google Apps Script & JavaScript</sub>
  <br>
  <sub>최종 업데이트: 2025-09-06</sub>
</div>