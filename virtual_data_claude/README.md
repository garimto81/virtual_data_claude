# 포커 핸드 로거 v35

포커 핸드를 기록하고 분석하는 웹 애플리케이션입니다.

## 🌟 주요 기능

- **핸드 기록**: 포커 핸드 정보를 상세하게 입력하고 저장
- **히스토리 관리**: 과거 핸드 기록 조회 및 검색
- **통계 분석**: 승률, 포지션별 성과 등 다양한 통계 제공
- **오프라인 지원**: Service Worker를 통한 오프라인 모드
- **PWA 지원**: 모바일 앱처럼 설치 가능
- **클라우드 동기화**: Google Apps Script를 통한 데이터 백업

## 🚀 시작하기

### Google Sheets 설정

현재 설정된 스프레드시트:
- **ID**: `1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U`
- **시트 이름**: `Hand`
- [스프레드시트 링크](https://docs.google.com/spreadsheets/d/1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U/edit)

### Google Apps Script 설정

현재 배포된 Apps Script:
- **배포 URL**: `https://script.google.com/macros/s/AKfycbwWfm4L72PgwtZTD8ur-vyAi4JJsHaQ5REhGhFdp5OYSrQbQacgkoUZRhvzZanrE6in/exec`
- 이미 `js/config/config.js`에 설정되어 있습니다

## 📁 프로젝트 구조

```
virtual_data_claude/
├── index.html              # 메인 HTML 파일
├── styles.css              # Tailwind CSS 스타일
├── manifest.json           # PWA 매니페스트
├── service-worker.js       # Service Worker
├── offline.html            # 오프라인 페이지
├── deploy.gs               # Google Apps Script 백엔드
├── js/                     # JavaScript 모듈
└── icons/                  # PWA 아이콘
```

## 👥 작성자

- **garimto81** - [GitHub](https://github.com/garimto81)

---

**Version**: 35.0.0  
**Last Updated**: 2025-01-28  
**Google Sheets**: [데이터 스프레드시트](https://docs.google.com/spreadsheets/d/1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U/edit)
