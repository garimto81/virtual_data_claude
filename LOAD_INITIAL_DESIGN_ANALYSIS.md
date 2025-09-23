# 🔍 loadInitial() 함수 설계 분석

## 📋 함수 개요
**위치**: `index.html:4380-4453`
**역할**: 앱 초기화 시 Type 및 Index 시트 데이터를 로드하는 핵심 함수

---

## 🏗️ 현재 설계 구조

```javascript
async function loadInitial(){
    // 1. UI 준비
    openLogModal();
    el.logDisplay.innerHTML='';

    try{
        // 2. CSV URL 확인 및 데이터 가져오기
        const [typeRows, idxRows] = await Promise.all([
            CSV_TYPE_URL.includes('http')? fetchCsv(CSV_TYPE_URL) : Promise.resolve([]),
            CSV_INDEX_URL.includes('http')? fetchCsv(CSV_INDEX_URL) : Promise.resolve([])
        ]);

        // 3. 데이터 빌드
        if(typeRows.length) buildTypeFromCsv(typeRows);
        if(idxRows.length) buildIndexFromCsv(idxRows);

        // 4. 핸드 번호 설정
        // 5. 카메라 번호 처리 (40줄의 복잡한 로직)
        // 6. UI 렌더링
        renderAll();
    }
    catch(err){
        // 7. 에러 처리
        console.error(err);
        logMessage(`초기 로딩 실패: ${err.message}`, true);
    }
    finally{
        // 8. 모달 닫기
        setTimeout(closeLogModal, 800);
    }
}
```

---

## 🚨 발견된 문제점

### 1. **치명적: Apps Script URL 사용 안 함** 🔴

**현재 로직**:
```javascript
const [typeRows, idxRows] = await Promise.all([
    CSV_TYPE_URL.includes('http')? fetchCsv(CSV_TYPE_URL) : Promise.resolve([]),
    CSV_INDEX_URL.includes('http')? fetchCsv(CSV_INDEX_URL) : Promise.resolve([])
]);
```

**문제점**:
- CSV_TYPE_URL과 CSV_INDEX_URL이 Google Sheets 공개 URL로 고정됨
- **APPS_SCRIPT_URL을 전혀 사용하지 않음**
- URL이 'http'를 포함하지 않으면 빈 배열 반환 (데이터 없음)

**예상했던 로직**:
```javascript
// Apps Script를 통해 데이터 가져오기
const typeUrl = CSV_TYPE_URL.includes('http')
    ? CSV_TYPE_URL
    : `${APPS_SCRIPT_URL}?getTypeSheet=true`;
```

### 2. **하드코딩된 Google Sheets URL** 🟠

```javascript
// index.html:1397-1398
const CSV_INDEX_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDY.../output=csv";
const CSV_TYPE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDY.../output=csv";
```

**문제점**:
- URL이 코드에 하드코딩됨
- 시트가 비공개면 접근 불가
- 시트 ID 변경 시 코드 수정 필요

### 3. **에러 처리 부실** 🟠

```javascript
catch(err){
    console.error(err);
    logMessage(`초기 로딩 실패: ${err.message}`, true);
}
```

**문제점**:
- 에러 발생해도 앱이 계속 실행됨
- 사용자에게 명확한 안내 없음
- 복구 메커니즘 없음

### 4. **fetchCsv() 함수의 조용한 실패** 🟡

```javascript
// index.html:4150-4158
async function fetchCsv(url){
    const res=await fetch(url);
    if(!res.ok) {
        console.log(`CSV fetch status: ${res.status}`);
        return []; // 빈 배열 반환
    }
    // ...
}
```

**문제점**:
- 실패 시 빈 배열 반환 → loadInitial()은 정상 처리로 인식
- 에러가 상위로 전파되지 않음
- 데이터 없이 앱이 렌더링됨

---

## 🎯 실제 실행 흐름

```mermaid
graph TD
    A[loadInitial 시작] --> B{CSV URL에<br/>'http' 포함?}
    B -->|Yes| C[Google Sheets<br/>직접 fetch]
    B -->|No| D[빈 배열 반환]

    C --> E{fetch 성공?}
    E -->|Yes| F[데이터 파싱]
    E -->|No| G[빈 배열 반환]

    D --> H[데이터 없이<br/>renderAll()]
    G --> H
    F --> I[buildTypeFromCsv<br/>buildIndexFromCsv]
    I --> J[renderAll()]

    style D fill:#f66
    style G fill:#f66
    style H fill:#f66
```

---

## 💡 개선안

### 1. **Apps Script URL 활용**

```javascript
async function loadInitial() {
    try {
        // Apps Script를 통한 데이터 로드
        const useAppsScript = !CSV_TYPE_URL.includes('http');

        const [typeRows, idxRows] = await Promise.all([
            useAppsScript
                ? fetchFromAppsScript('getTypeSheet')
                : fetchCsv(CSV_TYPE_URL),
            useAppsScript
                ? fetchFromAppsScript('getIndexSheet')
                : fetchCsv(CSV_INDEX_URL)
        ]);

        if(!typeRows.length || !idxRows.length) {
            throw new Error('필수 데이터를 로드할 수 없습니다');
        }

        // ... 나머지 로직
    } catch(err) {
        showCriticalError('초기화 실패', err);
        disableApp(); // 앱 비활성화
    }
}
```

### 2. **fetchFromAppsScript 함수 추가**

```javascript
async function fetchFromAppsScript(action) {
    const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: new URLSearchParams({ action })
    });

    if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Unknown error');
    }

    return result.data;
}
```

### 3. **에러 복구 메커니즘**

```javascript
async function loadInitialWithRetry(maxRetries = 3) {
    for(let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await loadInitial();
            return; // 성공
        } catch(err) {
            console.error(`시도 ${attempt}/${maxRetries} 실패:`, err);

            if(attempt === maxRetries) {
                // 최종 실패
                showFallbackUI();
                return;
            }

            // 재시도 전 대기
            await new Promise(r => setTimeout(r, 2000 * attempt));
        }
    }
}
```

---

## 📊 영향도 분석

| 문제점 | 현재 영향 | 개선 후 |
|--------|----------|---------|
| Apps Script 미사용 | 앱 완전 정지 | 정상 작동 |
| 하드코딩 URL | 유연성 없음 | 동적 설정 가능 |
| 조용한 실패 | 디버깅 어려움 | 명확한 에러 |
| 복구 없음 | 사용자 이탈 | 자동 재시도 |

---

## 🔧 즉시 적용 가능한 수정

### **Quick Fix (5분)**

```javascript
// index.html:4385-4386 수정
const [typeRows, idxRows] = await Promise.all([
    CSV_TYPE_URL.includes('http')
        ? fetchCsv(CSV_TYPE_URL)
        : fetchFromAppsScript('getTypeSheet'),  // Apps Script 사용
    CSV_INDEX_URL.includes('http')
        ? fetchCsv(CSV_INDEX_URL)
        : fetchFromAppsScript('getIndexSheet')  // Apps Script 사용
]);

// fetchFromAppsScript 함수 추가
async function fetchFromAppsScript(action) {
    const formData = new FormData();
    formData.append('action', action);

    const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    return result.success ? result.data : [];
}
```

---

## 🎯 결론

**loadInitial() 함수의 가장 큰 문제는 APPS_SCRIPT_URL을 사용하지 않는다는 것입니다.**

현재는 Google Sheets의 공개 URL을 직접 사용하고 있어, Apps Script 배포와 무관하게 작동합니다. 하지만 시트가 비공개거나 URL이 잘못되면 앱이 작동하지 않습니다.

**해결 우선순위**:
1. 🔴 Apps Script URL 통한 데이터 로드 구현
2. 🟠 에러 처리 강화
3. 🟡 재시도 로직 추가