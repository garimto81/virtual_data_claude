# 🔐 보안 설정 가이드

Virtual Data 프로젝트의 보안 설정 방법을 안내합니다.

## 📋 목차

1. [로컬 개발 환경 설정](#1-로컬-개발-환경-설정)
2. [Google Apps Script 설정](#2-google-apps-script-설정)
3. [프로덕션 배포 설정](#3-프로덕션-배포-설정)
4. [보안 체크리스트](#4-보안-체크리스트)

---

## 1. 로컬 개발 환경 설정

### 1.1 환경 변수 파일 생성

`.env` 파일을 생성하고 API 키를 설정합니다.

```bash
# 프로젝트 루트에서 실행
cp .env.example .env
```

### 1.2 `.env` 파일 편집

```bash
# Gemini API Configuration
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 1.3 의존성 설치

```bash
npm install
```

### 1.4 서버 실행

```bash
npm start
# 또는
npm run dev
```

서버가 정상적으로 실행되면 다음과 같은 메시지가 표시됩니다:

```
🚀 ======================================
   Virtual Data - Poker Hand Logger
   Version: 3.6.0 - Security Enhanced
🚀 ======================================

📄 Main App:    http://localhost:3000/
💚 Health Check: http://localhost:3000/api/health
🔐 Environment:  development
🔑 API Key:      ✅ Configured

⚠️  Press Ctrl+C to stop the server
```

---

## 2. Google Apps Script 설정

### 2.1 Apps Script 편집기 열기

1. Google Sheets 파일 열기
2. **확장 프로그램** → **Apps Script** 클릭

### 2.2 스크립트 속성 설정

Apps Script Properties를 사용하여 Spreadsheet ID를 안전하게 보관합니다.

#### 설정 방법:

1. Apps Script 편집기에서 **프로젝트 설정** (⚙️) 클릭
2. **스크립트 속성** 섹션으로 스크롤
3. **스크립트 속성 추가** 클릭
4. 다음 값 입력:
   - **속성**: `SPREADSHEET_ID`
   - **값**: `1gZN9S2rP5_U9zdxX1cJHBzBAl-Nup4PD4QXuW44rnSE`
5. **스크립트 속성 저장** 클릭

#### 스크린샷 예시:

```
┌─────────────────────────────────────┐
│ 스크립트 속성                       │
├─────────────────┬───────────────────┤
│ 속성            │ 값                │
├─────────────────┼───────────────────┤
│ SPREADSHEET_ID  │ 1gZN9S2rP5_...   │
└─────────────────┴───────────────────┘
```

### 2.3 코드 배포

1. Apps Script 편집기에서 **배포** → **새 배포** 클릭
2. 배포 유형: **웹 앱**
3. 설정:
   - **실행 주체**: 나
   - **액세스 권한**: **모든 사용자**
4. **배포** 클릭
5. 생성된 웹 앱 URL 복사

### 2.4 Apps Script URL 설정

프론트엔드 설정 모달에서 Apps Script URL을 입력합니다:

1. 앱 실행 후 **설정** (⚙️) 버튼 클릭
2. Apps Script URL 입력
3. **저장** 클릭

---

## 3. 프로덕션 배포 설정

### 3.1 GitHub Secrets 설정 (GitHub Pages 배포)

GitHub Actions를 사용한 배포 시 환경 변수를 Secrets에 저장합니다.

1. GitHub 리포지토리로 이동
2. **Settings** → **Secrets and variables** → **Actions** 클릭
3. **New repository secret** 클릭
4. 다음 Secret 추가:
   - Name: `GEMINI_API_KEY`
   - Value: `your_actual_gemini_api_key`

### 3.2 Vercel 배포

```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel

# 환경 변수 설정
vercel env add GEMINI_API_KEY
```

### 3.3 Heroku 배포

```bash
# Heroku CLI 설치 후
heroku create virtual-data-poker

# 환경 변수 설정
heroku config:set GEMINI_API_KEY=your_actual_gemini_api_key

# 배포
git push heroku main
```

---

## 4. 보안 체크리스트

### ✅ 로컬 개발

- [ ] `.env` 파일 생성 완료
- [ ] `.gitignore`에 `.env` 추가 확인
- [ ] API 키가 `.env`에만 존재하는지 확인
- [ ] 하드코딩된 API 키가 코드에 없는지 확인

### ✅ Apps Script

- [ ] `SPREADSHEET_ID`를 스크립트 속성에 설정
- [ ] 하드코딩된 Spreadsheet ID가 코드에 없는지 확인
- [ ] 웹 앱 배포 완료
- [ ] 액세스 권한 설정 확인

### ✅ 프로덕션 배포

- [ ] GitHub Secrets 또는 Vercel/Heroku 환경 변수 설정
- [ ] `.env` 파일이 저장소에 커밋되지 않았는지 확인
- [ ] 프로덕션 서버에서 HTTPS 사용 확인
- [ ] CORS 설정 확인

### ✅ 일반 보안

- [ ] API 키를 정기적으로 갱신
- [ ] 사용하지 않는 API 키는 즉시 삭제
- [ ] 액세스 로그 정기 확인
- [ ] Rate limiting 설정 (필요 시)

---

## 🚨 문제 해결

### API 키가 작동하지 않는 경우

**증상**: `❌ Missing` 또는 서버 시작 실패

**해결 방법**:
1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. `.env` 파일에 `GEMINI_API_KEY=...` 라인이 있는지 확인
3. API 키 앞뒤로 따옴표나 공백이 없는지 확인
4. 서버를 재시작

### Spreadsheet ID가 작동하지 않는 경우

**증상**: Apps Script 실행 시 에러 발생

**해결 방법**:
1. Apps Script 프로젝트 설정 (⚙️) 확인
2. 스크립트 속성에 `SPREADSHEET_ID`가 설정되어 있는지 확인
3. 값이 정확한지 확인 (공백 제거)
4. Apps Script를 다시 배포

---

## 📚 참고 자료

- [Google Apps Script Properties Service](https://developers.google.com/apps-script/reference/properties)
- [Node.js dotenv 문서](https://github.com/motdotla/dotenv)
- [GitHub Secrets 가이드](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**작성일**: 2025-10-02
**버전**: 3.6.0
