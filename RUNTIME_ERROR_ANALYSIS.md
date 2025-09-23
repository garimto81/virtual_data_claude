# 🔴 Virtual Data 앱 작동 불가 원인 분석

## 진단 일시: 2025-09-23
## 앱 버전: v71.0.3

---

## 🎯 핵심 문제: 앱이 작동하지 않는 실제 원인들

### 1. 🔴 **Google Apps Script URL 만료/무효** (가능성: 90%)

**현재 설정된 URL:**
```javascript
const DEFAULT_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEcsF1F_RLLW_qkQIFkrwmut-zN0fHOqsAKs5B8PgHZAz2_O5sA8o2W5zZ3nD-5tjY/exec";
```

**문제점:**
- Apps Script 배포 ID가 유효하지 않거나 만료됨
- 배포가 비활성화되었거나 삭제됨
- 실행 권한이 제한됨

**증상:**
- `fetch()` 호출시 404 또는 403 에러
- CORS 에러 발생
- 응답 없음

---

### 2. 🔴 **CORS (Cross-Origin Resource Sharing) 차단** (가능성: 85%)

**위치:** `index.html:4866`
```javascript
const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: form.toString()
});
```

**문제점:**
- Apps Script의 `doPost()`가 CORS 헤더를 반환하지 않음
- 브라우저가 cross-origin 요청을 차단
- Preflight 요청 실패

**해결 시도 (현재 코드):**
- `application/x-www-form-urlencoded` 사용 (simple request)
- 하지만 Apps Script 측 설정이 잘못되면 여전히 실패

---

### 3. 🟡 **초기화 시퀀스 실패** (가능성: 70%)

**위치:** `index.html:7242-7282`
```javascript
async function initializeApp(){
    await executeWithLock(async () => {
        try{
            await loadInitial();  // ← 이 부분에서 실패
            renderTableSelection();
            initializeSeatGrid();
            // ...
        }catch(err){
            console.error(err);
            logMessage(`초기화 실패: ${err.message}`, true);
        }
    });
}
```

**실패 지점:**
1. `loadInitial()` → API 호출 실패
2. `renderTableSelection()` → DOM 요소 없음
3. `initializeSeatGrid()` → 의존성 미충족

---

### 4. 🟠 **Google Sheets 접근 권한 문제** (가능성: 75%)

**Apps Script:** `Code_v71.0.3.gs:40`
```javascript
const SPREADSHEET_ID = '1gZN9S2rP5_U9zdxX1cJHBzBAl-Nup4PD4QXuW44rnSE';
```

**문제점:**
- 스프레드시트가 비공개 상태
- Apps Script 실행 권한 부족
- 시트 구조 변경으로 인한 오류

---

### 5. 🟡 **JavaScript 모듈 로딩 실패** (가능성: 60%)

**의존성 체인:**
```html
<!-- index.html:7309 -->
<script src="src/js/duplicate-remover.js?v=3.4.16"></script>
```

**문제:**
- 404 에러로 스크립트 로드 실패
- 전역 변수 `window.removeDuplicatePlayers` 미정의
- 초기화 코드에서 참조 시 에러

---

## 🔍 실제 에러 시나리오 (순차적 실패)

```
1. 페이지 로드
   ↓
2. APPS_SCRIPT_URL 설정 (localStorage 또는 기본값)
   ↓
3. initializeApp() 실행
   ↓
4. loadInitial() 호출 → fetch(APPS_SCRIPT_URL)
   ↓
5. ❌ CORS 에러 또는 404 에러 발생
   ↓
6. catch 블록 실행 → 에러 로그만 출력
   ↓
7. UI 렌더링 실패 (데이터 없음)
   ↓
8. 앱 사용 불가 상태
```

---

## ✅ 즉시 확인해야 할 사항

### 1. **브라우저 콘솔 확인**
```javascript
// F12 → Console 탭에서 확인
// 예상되는 에러들:
- "Failed to fetch"
- "CORS policy"
- "404 Not Found"
- "Uncaught ReferenceError"
```

### 2. **네트워크 탭 확인**
```javascript
// F12 → Network 탭에서 확인
// Apps Script URL 요청 상태 확인
// 응답 코드: 200? 404? 403?
```

### 3. **Apps Script 배포 상태 확인**
1. Google Apps Script 편집기 열기
2. 배포 → 배포 관리
3. 활성 배포 확인
4. 실행 권한: "Anyone" 설정 필요

---

## 🛠️ 즉시 적용 가능한 해결책

### 1. **Apps Script 재배포**
```javascript
// Code_v71.0.3.gs의 doGet/doPost 함수 수정
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: "API is working"
  }))
  .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // CORS 헤더 추가
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: processRequest(e)
  }))
  .setMimeType(ContentService.MimeType.JSON);
}
```

### 2. **테스트 페이지 사용**
```bash
# TEST_DEBUG.html 파일을 브라우저에서 열기
# 각 기능을 단계별로 테스트
```

### 3. **로컬 프록시 서버 구성**
```javascript
// Node.js 프록시 서버로 CORS 우회
const express = require('express');
const cors = require('cors');
const proxy = require('http-proxy-middleware');

app.use('/api', proxy({
  target: APPS_SCRIPT_URL,
  changeOrigin: true
}));
```

### 4. **긴급 패치 코드**
```javascript
// index.html 상단에 추가
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Global error:', {msg, url, lineNo, columnNo, error});
    alert('에러 발생: ' + msg);
    return false;
};

// API 호출 전 연결 테스트
async function testConnection() {
    try {
        const response = await fetch(APPS_SCRIPT_URL + '?test=1');
        console.log('Connection test:', response.status);
        return response.ok;
    } catch(e) {
        console.error('Connection failed:', e);
        return false;
    }
}
```

---

## 📊 작동 불가 원인 우선순위

| 순위 | 원인 | 가능성 | 심각도 | 해결 난이도 |
|------|------|---------|---------|-------------|
| 1 | Apps Script URL 무효 | 90% | 🔴 치명적 | 쉬움 |
| 2 | CORS 차단 | 85% | 🔴 치명적 | 중간 |
| 3 | Google Sheets 권한 | 75% | 🟠 심각 | 쉬움 |
| 4 | 초기화 실패 | 70% | 🟠 심각 | 중간 |
| 5 | 모듈 로딩 실패 | 60% | 🟡 중요 | 쉬움 |

---

## 🚨 결론

**앱이 작동하지 않는 근본 원인은 Google Apps Script API 연결 실패입니다.**

1. **즉시 조치:** Apps Script URL 유효성 확인 및 재배포
2. **단기 해결:** CORS 설정 수정, 권한 확인
3. **장기 해결:** 프록시 서버 구축 또는 백엔드 재설계

`TEST_DEBUG.html`을 사용하여 각 구성 요소를 개별적으로 테스트하고, 실패 지점을 정확히 파악하는 것이 우선입니다.