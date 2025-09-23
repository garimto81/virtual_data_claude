# 📝 Google Apps Script 배포 및 설정 가이드

## 현재 Apps Script 코드: `Code_v71.0.3.gs`

---

## ✅ 코드 검증 결과

### 1. **CORS 처리** ✅ 정상
```javascript
// Line 403-408
function createCorsResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```
- ContentService.MimeType.JSON 사용으로 CORS 자동 처리
- 별도 헤더 설정 불필요

### 2. **doGet/doPost 함수** ✅ 구현됨
- `doGet()`: Line 183-258
- `doPost()`: Line 260-313
- 에러 처리 및 undefined 체크 포함

### 3. **스프레드시트 ID** ⚠️ 확인 필요
```javascript
// Line 40
const SPREADSHEET_ID = '1gZN9S2rP5_U9zdxX1cJHBzBAl-Nup4PD4QXuW44rnSE';
```

---

## 🚨 **앱이 작동하지 않는 실제 원인**

### **배포가 되지 않았거나 URL이 일치하지 않음**

현재 index.html의 URL:
```javascript
// index.html:1392
const DEFAULT_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEcsF1F_RLLW_qkQIFkrwmut-zN0fHOqsAKs5B8PgHZAz2_O5sA8o2W5zZ3nD-5tjY/exec";
```

이 URL은 **실제 배포된 Apps Script URL이 아닐 가능성이 높습니다.**

---

## 🛠️ **즉시 해결 방법**

### **Step 1: Google Apps Script 편집기 열기**

1. Google Drive에서 새 Google Apps Script 생성
2. 또는 기존 스크립트 열기: https://script.google.com

### **Step 2: Code_v71.0.3.gs 코드 복사**

```bash
# 전체 코드 복사
C:\AI-tech\Claude-code-v2\virtual_data\apps-script\Code_v71.0.3.gs
```

### **Step 3: 배포 생성**

1. Apps Script 편집기에서 코드 붙여넣기
2. 저장 (Ctrl+S)
3. **배포 → 새 배포** 클릭
4. 설정:
   - **유형**: 웹 앱
   - **설명**: Virtual Data v71.0.3
   - **실행**: 나
   - **액세스**: **모든 사용자** (중요!)
5. **배포** 클릭

### **Step 4: 새 URL 복사**

배포 후 생성되는 URL 형식:
```
https://script.google.com/macros/s/[새로운-배포-ID]/exec
```

### **Step 5: index.html 수정**

```javascript
// index.html:1392 수정
const DEFAULT_APPS_SCRIPT_URL = "새로운-배포-URL-여기에-붙여넣기";
```

---

## 📋 **체크리스트**

### **배포 전 확인사항**

- [ ] Google 계정 로그인 상태
- [ ] 스프레드시트 ID 유효성 확인
- [ ] 스프레드시트 공유 설정 (최소 "링크가 있는 모든 사용자" 보기 권한)

### **배포 설정**

- [ ] 실행 권한: "나"
- [ ] 액세스 권한: "모든 사용자"
- [ ] 웹 앱으로 배포

### **배포 후 테스트**

1. **브라우저에서 직접 테스트**
```
https://script.google.com/macros/s/[배포ID]/exec?test=true
```

예상 응답:
```json
{
  "success": true,
  "message": "v71 Ultimate API 테스트 모드",
  "version": "71.0.4",
  "timestamp": "2025-09-23T..."
}
```

2. **TEST_DEBUG.html 사용**
- 브라우저에서 TEST_DEBUG.html 열기
- "API 연결 테스트" 버튼 클릭
- 콘솔에서 응답 확인

---

## 🔧 **추가 설정 (선택사항)**

### **스프레드시트 권한 설정**

1. Google Sheets 열기
2. 우측 상단 "공유" 버튼
3. "일반 액세스" → "링크가 있는 모든 사용자"
4. 권한: "뷰어" 또는 "편집자"

### **Config 시트 생성**

```javascript
// Config 시트에 A1 셀에 Apps Script URL 저장
// 자동으로 URL을 가져올 수 있음
```

---

## 🚫 **일반적인 오류 및 해결**

### **1. 404 Not Found**
- 원인: 잘못된 URL 또는 배포되지 않음
- 해결: 새로 배포하고 URL 업데이트

### **2. 403 Forbidden**
- 원인: 액세스 권한이 "나만"으로 설정됨
- 해결: "모든 사용자"로 재배포

### **3. CORS 에러**
- 원인: 이전 버전 코드 사용
- 해결: v71.0.3 코드 확인 후 재배포

### **4. "Script function not found: doGet"**
- 원인: 코드가 제대로 저장되지 않음
- 해결: 코드 저장 후 재배포

---

## 📞 **긴급 지원**

문제가 계속되면:

1. **브라우저 콘솔(F12)에서 정확한 에러 메시지 확인**
2. **Apps Script 편집기에서 "실행" → "실행 기록" 확인**
3. **TEST_DEBUG.html 파일로 단계별 테스트**

---

## ✅ **최종 확인**

배포가 완료되면:
1. 새 URL로 index.html 업데이트
2. 브라우저 캐시 삭제 (Ctrl+Shift+R)
3. index.html 새로고침
4. 앱 정상 작동 확인

**예상 소요 시간: 5-10분**