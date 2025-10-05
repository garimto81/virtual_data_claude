# 포커 핸드 로거 - Week 1 MVP 프로토타입

> **개발 기간**: Week 1 (3일)
> **목표**: 핵심 워크플로우만 동작하는 단일 HTML 파일
> **문서**: [../docs/PLAN.md](../docs/PLAN.md)

## 🎯 Week 1 목표

**동작하는 최소 기능 (MVP)**:
1. 키 플레이어 검색 → 테이블 찾기
2. 테이블 플레이어 8명 표시 (키 플레이어 강조)
3. 핸드 시작 → 액션 기록 → 완료

## 🚀 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 열기
# http://localhost:3000/prototype.html
```

## 📋 Google Sheets 설정

1. Google Cloud Console에서 API 키 발급
2. `prototype.html` 파일의 `SHEET_ID`와 `API_KEY` 수정
3. Google Sheets 공유 설정: "링크가 있는 모든 사용자"

## 🛠️ Week 1 기술 스택

- ✅ **단일 HTML 파일** (prototype.html)
- ✅ **Vanilla JavaScript** (No 프레임워크)
- ✅ **Google Sheets API** (직접 호출)
- ❌ No 캐싱 (IndexedDB, Redis)
- ❌ No 복잡한 아키텍처 (DDD, 에이전트)
- ❌ No 빌드 도구 (Webpack, Vite)

## 📁 파일 구조

```
new_virtual_table/
├── prototype.html       # 올인원 MVP 파일
├── package.json         # 기본 설정
├── .gitignore
└── README.md           # 이 파일
```

## 🔄 다음 단계 (Week 2 이후)

사용자 피드백에 따라:
- "검색이 느려요" → IndexedDB 추가
- "오프라인에서 안 돼요" → Service Worker 추가
- "여러 명이 쓰니 충돌나요" → Redis 추가

**YAGNI 원칙**: 필요할 때만 추가!
