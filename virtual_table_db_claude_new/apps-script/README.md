# Virtual Table Sheet Updater - Apps Script

Virtual 시트의 F열(파일명), H열(AI분석) 업데이트를 위한 Google Apps Script 백엔드

## 🚀 설치 방법

### 1. Google Apps Script 프로젝트 생성
1. [Google Apps Script](https://script.google.com) 접속
2. 새 프로젝트 생성
3. `SheetUpdater.gs` 내용을 복사하여 붙여넣기

### 2. Gemini API 키 설정
Apps Script 편집기에서 다음 코드 실행:
```javascript
PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', 'YOUR_ACTUAL_GEMINI_API_KEY');
```

### 3. 웹 앱 배포
1. **배포** → **새 배포** 클릭
2. **유형 선택**: ⚙️ → **웹 앱**
3. **설명**: "Virtual Table Sheet Updater v1.1"
4. **실행**: **나**
5. **액세스 권한**: **모든 사용자** (중요!)
6. **배포** 클릭
7. **웹 앱 URL 복사** (https://script.google.com/macros/s/.../exec)

### 4. 웹 앱 URL 설정
배포 후 생성된 URL을 포커 핸드 모니터링 시스템에 설정:

**포커 핸드 모니터링 → 설정 → Apps Script 시트 연동**
- 🔗 Apps Script Web App URL: `YOUR_WEB_APP_URL_HERE`

## 📊 시트 구조 요구사항

업데이트 대상 시트는 다음 열 구조를 가져야 합니다:

| 열 | 용도 | 예시 |
|---|---|---|
| A | Blinds | 1/2, 2/5 |
| B | Cyprus 시간 | 14:35:20 (매칭 기준) |
| C | Seoul 시간 | 23:35:20 |
| D | 핸드 번호 | #001, #002 |
| E | 기타 데이터 | - |
| **F** | **파일명** | **hand_001.mp4** ← 업데이트 |
| G | 기타 데이터 | - |
| **H** | **AI 분석** | **분석 실패** ← 업데이트 |
| I | 업데이트 시간 | 2025-09-07 15:30:00 |

## 🔧 주요 기능

### 1. 시트 업데이트 (`updateSheet`)
- **F열**: 파일명 업데이트
- **H열**: AI 분석 결과 업데이트 (Gemini AI 자동 분석)
- **I열**: 업데이트 시간 자동 기록
- **자동 AI 분석**: H열이 비어있거나 "분석 실패"인 경우 자동으로 Gemini AI 분석 수행

### 2. AI 핸드 분석 (`analyzeHand`)
- **Gemini AI**: GitHub Actions Secret GEMINI_API_KEY 사용
- **포커 핸드 분석**: 플레이어 액션, 핸드 강도, 권장사항 제공
- **50자 제한**: 간단명료한 분석 결과 제공

### 3. 연결 테스트
- GET 요청으로 연결 상태 확인
- 버전 정보 및 서비스 상태 반환

### 4. 안전한 시트 접근
- CORS 정책 완전 우회
- 서버사이드에서 안전한 시트 접근
- 에러 처리 및 상세 로깅

## 📨 API 사용법

### 연결 테스트 (GET)
```javascript
fetch('YOUR_WEB_APP_URL', {
  method: 'GET'
})
.then(response => response.json())
.then(data => console.log(data));
```

**응답 예시:**
```json
{
  "status": "ok",
  "method": "GET",
  "version": "v1.0",
  "service": "Virtual Table Sheet Updater",
  "time": "2025-09-07T15:30:00.000Z"
}
```

### 시트 업데이트 (POST)
```javascript
const updateData = {
  action: 'updateSheet',
  sheetUrl: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit?gid=GID#gid=GID',
  rowNumber: 5,
  handNumber: 'HAND_001',
  filename: 'hand_001_river_bluff.mp4',
  aiAnalysis: '분석 실패',
  timestamp: new Date().toISOString()
};

fetch('YOUR_WEB_APP_URL', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    payload: JSON.stringify(updateData)
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

**성공 응답 예시:**
```json
{
  "status": "success",
  "message": "시트 업데이트 완료",
  "data": {
    "sheetName": "시트1",
    "rowNumber": 5,
    "filename": "hand_001_river_bluff.mp4",
    "aiAnalysis": "분석 실패",
    "updatedAt": "2025-09-07T15:30:00.000Z",
    "handNumber": "HAND_001"
  }
}
```

### AI 핸드 분석 (POST)
```javascript
const analysisData = {
  action: 'analyzeHand',
  handNumber: 'HAND_001',
  filename: 'hand_001_river_bluff.mp4',
  timestamp: new Date().toISOString(),
  handData: {
    action: 'bluff',
    street: 'river',
    position: 'button'
  }
};

fetch('YOUR_WEB_APP_URL', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    payload: JSON.stringify(analysisData)
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

**성공 응답 예시:**
```json
{
  "status": "success",
  "message": "AI 분석 완료",
  "data": {
    "handNumber": "HAND_001",
    "filename": "hand_001_river_bluff.mp4",
    "analysis": "리버 블러프 - 약한 핸드 - 폴드 권장",
    "analyzedAt": "2025-09-07T15:30:00.000Z"
  }
}
```

## 🧪 테스트 함수

Apps Script 편집기에서 직접 실행 가능한 테스트 함수들:

### 1. `testConnection()`
시트 연결 상태 테스트

### 2. `testSheetUpdate()`
실제 시트 업데이트 테스트 (행 2에 테스트 데이터 입력, AI 분석 자동 실행)

### 3. `testAIAnalysis()`
AI 핸드 분석 기능 테스트

## 🔧 연결 테스트 실패 해결

### 일반적인 오류와 해결책

#### 1. **"Apps Script URL이 설정되지 않았습니다"**
- **원인**: URL이 비어있거나 저장되지 않음
- **해결책**: 
  1. 설정 버튼 클릭 → "Apps Script 시트 연동" 섹션
  2. "Apps Script Web App URL" 필드에 올바른 URL 입력
  3. "설정 저장" 클릭 후 다시 테스트

#### 2. **"URL 형식이 올바르지 않습니다"**
- **원인**: 잘못된 URL 형식
- **올바른 형식**: `https://script.google.com/macros/s/[SCRIPT_ID]/exec`
- **해결책**: Apps Script에서 배포 후 제공되는 정확한 URL 사용

#### 3. **"연결 실패" (403, 404 오류)**
- **원인**: 권한 설정 또는 배포 문제
- **해결책**:
  1. Apps Script → 배포 → 관리
  2. 액세스 권한을 **"모든 사용자"**로 변경
  3. 새 배포 생성 또는 기존 배포 업데이트

#### 4. **"JSON 파싱 오류"**
- **원인**: Apps Script가 HTML 응답 반환
- **해결책**: 
  1. Apps Script doGet 함수 확인
  2. JSON 응답이 올바르게 설정되었는지 확인
  3. 브라우저에서 직접 URL 접속하여 응답 확인

#### 5. **"CORS 오류"**
- **원인**: 브라우저 CORS 정책
- **해결책**: 일반적으로 Apps Script는 CORS를 자동 처리하나, 문제 시:
  1. 브라우저 캐시 삭제
  2. 다른 브라우저에서 테스트
  3. Apps Script 재배포

### 배포 체크리스트
- ✅ Apps Script 코드 복사 완료
- ✅ Gemini API 키 설정 완료
- ✅ 웹앱 배포 완료 ("모든 사용자" 액세스)
- ✅ 올바른 URL 형식 (.../exec로 끝남)
- ✅ 포커 핸드 모니터링에 URL 설정 완료
- ✅ 설정 저장 완료

## ⚠️ 주의사항

1. **권한 설정**: 웹 앱 배포 시 "모든 사용자" 액세스 허용
2. **시트 권한**: Apps Script가 대상 시트에 편집 권한이 있어야 함
3. **URL 형식**: 시트 URL은 편집 URL 형식 사용 (`/edit?gid=...`)
4. **행 번호**: 1부터 시작하는 실제 시트 행 번호 사용
5. **데이터 검증**: 빈 파일명이나 잘못된 행 번호는 오류 발생
6. **Gemini API 설정**: Apps Script 스크립트 속성에 GEMINI_API_KEY 설정 필요
   ```javascript
   PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', 'YOUR_API_KEY');
   ```

## 🔄 워크플로우

1. **포커 핸드 매칭**: B열 기준으로 Virtual 시트에서 가장 가까운 시간 행 찾기
2. **완료 처리**: 포커 핸드 모니터링에서 "📊 시트 업데이트" 버튼 클릭
3. **데이터 입력**: 팝업에서 파일명 입력, AI 분석 확인
4. **자동 업데이트**: Apps Script로 F열(파일명), H열(AI분석) 자동 입력
5. **결과 확인**: 성공 시 해당 행에 데이터 업데이트 완료

## 📈 버전 히스토리

### v1.1 (2025-09-07)
- **Gemini AI 통합**: GitHub Actions Secret GEMINI_API_KEY 활용
- **자동 AI 분석**: H열이 비어있거나 "분석 실패"인 경우 자동으로 포커 핸드 분석 수행
- **AI 분석 API**: 별도 analyzeHand 액션 추가
- **테스트 함수 확장**: testAIAnalysis() 추가
- **포커 핸드 분석**: 플레이어 액션, 핸드 강도, 권장사항 제공 (50자 제한)

### v1.0 (2025-09-07)
- 초기 버전 출시
- F열(파일명), H열(AI분석) 업데이트 기능
- 연결 테스트 기능
- 상세 에러 처리 및 로깅