# 📡 Virtual Data - API 참조 문서
> API Reference & Developer Guide v3.5.32
> 최종 업데이트: 2025-10-04

---

## 📌 문서 개요

### 목적
본 문서는 Virtual Data의 모든 API 엔드포인트, 데이터 구조, 개발 가이드를 제공합니다.

### 대상 독자
- 프론트엔드 개발자
- 백엔드 개발자
- API 통합 개발자
- 시스템 관리자

---

## 🌐 API 개요

### Base URL
```
Production:  https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
Development: http://localhost:8080 (node server.js)
```

### 인증
현재: 없음 (Google Apps Script 공개 배포)
향후: OAuth 2.0 + JWT 토큰

### 응답 형식
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2025-10-04T12:34:56.789Z"
}
```

---

## 📚 Apps Script API (Backend)

### 1. 플레이어 관리 API

#### 1.1 플레이어 생성
```http
POST /exec
Content-Type: application/x-www-form-urlencoded

action=createPlayer&players={"name":"JohnDoe","tableNo":"1","seatNo":"#5","chips":10000}
```

**Request Body**:
```javascript
{
  "action": "createPlayer",
  "name": "JohnDoe",           // 필수, 1-50자
  "tableNo": "1",              // 필수
  "seatNo": "#5",              // 선택, #1-#10
  "chips": 10000,              // 필수, >= 0
  "nationality": "KR",         // 선택, 2자 코드
  "keyplayer": false,          // 선택, boolean
  "pokerRoom": "Merit Hall",   // 선택
  "tableName": "Ocean Blue"    // 선택
}
```

**Response (성공)**:
```json
{
  "success": true,
  "message": "플레이어 등록 성공",
  "action": "created"
}
```

**Response (실패 - 중복)**:
```json
{
  "success": false,
  "message": "Table 1 Seat #5에 이미 플레이어가 있습니다",
  "action": "duplicate_found"
}
```

#### 1.2 플레이어 업데이트
```http
POST /exec

action=updatePlayerInfo&tableNo=1&seatNo=#5&playerName=JohnDoe&updateData={"chips":15000}
```

**Request Body**:
```javascript
{
  "action": "updatePlayerInfo",
  "tableNo": "1",
  "seatNo": "#5",           // 또는 playerName 필수
  "playerName": "JohnDoe",  // 선택 (확인용)
  "updateData": {
    "chips": 15000,         // 선택
    "nationality": "US",    // 선택
    "keyplayer": true       // 선택
  }
}
```

#### 1.3 플레이어 삭제
```http
POST /exec

action=deletePlayer&tableNo=1&seatNo=#5&playerName=JohnDoe
```

**Request Body**:
```javascript
{
  "action": "deletePlayer",
  "tableNo": "1",
  "seatNo": "#5",           // 또는 playerName 필수
  "playerName": "JohnDoe"   // 선택 (확인용)
}
```

#### 1.4 일괄 업데이트 (Batch Update)
```http
POST /exec

action=batchUpdate&table=1&players=[...]&deleted=[...]
```

**Request Body**:
```javascript
{
  "action": "batchUpdate",
  "table": "1",
  "players": [
    {
      "name": "Alice",
      "seatNo": "#1",
      "chips": 20000
    },
    {
      "name": "Bob",
      "seatNo": "#2",
      "chips": 15000
    }
  ],
  "deleted": [
    "Charlie",              // 문자열 또는
    { "name": "Dave", "seatNo": "#4" }  // 객체
  ],
  "forceReplace": false     // 덮어쓰기 여부
}
```

**Response**:
```json
{
  "success": true,
  "message": "처리 완료: 성공 10, 실패 0, 생성 5, 교체 5",
  "successCount": 10,
  "errorCount": 0,
  "createdCount": 5,
  "replacedCount": 5,
  "duplicatesRemoved": 3,
  "results": [ ... ]
}
```

### 2. 데이터 조회 API

#### 2.1 Type 시트 조회 (CSV)
```http
GET /exec?getTypeSheet=true
```

**Response** (text/csv):
```csv
Poker Room,Table Name,Table No,Seat No,Players,Nationality,Chips,Keyplayer
Merit Hall,Ocean Blue,1,#1,Alice,KR,20000,TRUE
Merit Hall,Ocean Blue,1,#2,Bob,US,15000,
```

#### 2.2 Type 시트 조회 (JSON)
```http
POST /exec

action=getTypeSheet
```

**Response**:
```json
{
  "success": true,
  "players": [
    {
      "pokerRoom": "Merit Hall",
      "tableName": "Ocean Blue",
      "tableNo": "1",
      "seatNo": "#1",
      "name": "Alice",
      "nationality": "KR",
      "chips": 20000,
      "keyplayer": true
    }
  ],
  "count": 123
}
```

#### 2.3 테이블별 플레이어 조회
```http
GET /exec?table=1

또는

POST /exec
action=getTablePlayers&tableNo=1
```

**Response**:
```json
{
  "success": true,
  "players": [ ... ],
  "count": 10
}
```

#### 2.4 전체 플레이어 조회
```http
POST /exec

action=getAllPlayers
```

### 3. 유틸리티 API

#### 3.1 중복 플레이어 제거
```http
POST /exec

action=removeDuplicatePlayers
```

**Response**:
```json
{
  "success": true,
  "message": "5개 중복 제거",
  "duplicates": [
    {
      "row": 15,
      "table": "1",
      "player": "Alice"
    }
  ]
}
```

#### 3.2 시트 정렬
```http
POST /exec

action=sortTypeSheet
```

**정렬 기준**: Table No (오름차순) → Seat No (오름차순)

#### 3.3 시트 초기화
```http
POST /exec

action=clearSheet
```

**주의**: 모든 플레이어 데이터 삭제 (헤더 유지)

#### 3.4 스타일 적용
```http
POST /exec

action=applyStyle
```

**적용 스타일**:
- 폰트: Roboto 11pt
- 정렬: 중앙 정렬
- 헤더: 굵게, 회색 배경

### 4. Config API

#### 4.1 설정 저장
```http
POST /exec

action=saveConfig&configType=appsScriptUrl&value=https://...
```

#### 4.2 설정 조회
```http
POST /exec

action=getConfig&configType=appsScriptUrl
```

**Response**:
```json
{
  "success": true,
  "value": "https://script.google.com/macros/s/.../exec"
}
```

---

## 🔌 프론트엔드 API (Phase 4)

### 보호된 API 호출

모든 API 호출은 Phase 4 보호 시스템을 통해 실행됩니다.

#### ensureAppsScriptUrl()
```javascript
/**
 * Apps Script URL 유효성 검증
 * @returns {Object} { isValid: boolean, error?: string }
 */
function ensureAppsScriptUrl() {
  // 1. APP_CONFIG 존재 확인
  if (!window.APP_CONFIG) {
    return { isValid: false, error: 'APP_CONFIG가 초기화되지 않았습니다' };
  }

  // 2. URL 설정 확인
  const url = window.APP_CONFIG.appsScriptUrl || APPS_SCRIPT_URL;
  if (!url) {
    return { isValid: false, error: 'Apps Script URL이 설정되지 않았습니다' };
  }

  // 3. URL 형식 검증
  const urlPattern = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/;
  if (!urlPattern.test(url)) {
    return { isValid: false, error: 'URL 형식이 올바르지 않습니다' };
  }

  // 4. 앱 초기화 확인
  if (!window.APP_CONFIG.isInitialized) {
    return { isValid: false, error: '앱이 초기화되지 않았습니다' };
  }

  // 5. 네트워크 상태 확인
  if (!navigator.onLine) {
    return { isValid: false, error: '네트워크에 연결되지 않았습니다' };
  }

  return { isValid: true };
}
```

#### protectedApiCall()
```javascript
/**
 * 보호된 API 호출 (재시도 + 타임아웃)
 * @param {Function} apiFunction - API 호출 함수
 * @param {Object} options - 옵션
 * @returns {Promise<Object>} { success, data, error }
 */
async function protectedApiCall(apiFunction, options = {}) {
  const {
    maxRetries = 3,
    timeout = 30000,
    priority = 'normal',
    onProgress = null
  } = options;

  // URL 검증
  const validation = ensureAppsScriptUrl();
  if (!validation.isValid) {
    return {
      success: false,
      error: getUserFriendlyErrorMessage(new Error(validation.error))
    };
  }

  // 재시도 로직
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 진행 상황 콜백
      if (onProgress) {
        onProgress({ attempt: attempt + 1, maxRetries });
      }

      // API 호출 (타임아웃 적용)
      const result = await Promise.race([
        apiFunction(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);

      return { success: true, data: result };

    } catch (error) {
      // 마지막 시도 실패
      if (attempt === maxRetries - 1) {
        return {
          success: false,
          error: getUserFriendlyErrorMessage(error)
        };
      }

      // 지수 백오프 대기
      const delay = 1000 * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

#### 보호된 래퍼 함수들

```javascript
// 핸드 데이터 전송
async function protectedSendToSheets(handData) {
  return protectedApiCall(
    () => sendDataToGoogleSheet(handData),
    { priority: 'high', timeout: 45000 }
  );
}

// 일괄 플레이어 등록
async function protectedBulkRegister(players, deleted) {
  return protectedApiCall(
    () => batchUpdatePlayers(players, deleted),
    { priority: 'high', timeout: 60000 }
  );
}

// 플레이어 추가
async function protectedAddPlayer(playerData) {
  return protectedApiCall(
    () => addNewPlayer(playerData),
    { priority: 'normal' }
  );
}

// 좌석 업데이트
async function protectedUpdatePlayerSeat(player, newSeat) {
  // 입력 검증
  if (newSeat < 1 || newSeat > 10) {
    return {
      success: false,
      error: '좌석 번호는 1-10 사이여야 합니다'
    };
  }

  return protectedApiCall(
    () => updatePlayerSeat(player, newSeat),
    { priority: 'normal' }
  );
}

// 칩 업데이트
async function protectedUpdatePlayerChips(player, newChips) {
  // 입력 검증
  if (newChips < 0) {
    return {
      success: false,
      error: '칩은 0 이상이어야 합니다'
    };
  }

  return protectedApiCall(
    () => updatePlayerChips(player, newChips),
    { priority: 'normal' }
  );
}
```

### ApiCallManager

```javascript
/**
 * API 호출 상태 관리 및 모니터링
 */
class ApiCallManager {
  constructor() {
    this.activeCalls = new Map();
    this.callHistory = [];
    this.maxHistorySize = 100;
    this.cache = new Map();
    this.cacheExpiry = 300000; // 5분
  }

  /**
   * 호출 추적 시작
   */
  startCall(callId, metadata = {}) {
    this.activeCalls.set(callId, {
      id: callId,
      startTime: Date.now(),
      metadata: metadata,
      status: 'pending'
    });
  }

  /**
   * 호출 완료 기록
   */
  endCall(callId, result) {
    const call = this.activeCalls.get(callId);
    if (call) {
      call.endTime = Date.now();
      call.duration = call.endTime - call.startTime;
      call.status = result.success ? 'success' : 'failed';
      call.result = result;

      // 히스토리 저장
      this.callHistory.push(call);
      if (this.callHistory.length > this.maxHistorySize) {
        this.callHistory.shift();
      }

      this.activeCalls.delete(callId);
    }
  }

  /**
   * 통계 조회
   */
  getStats() {
    const total = this.callHistory.length;
    const successful = this.callHistory.filter(c => c.status === 'success').length;
    const failed = this.callHistory.filter(c => c.status === 'failed').length;
    const avgDuration = this.callHistory.reduce((sum, c) => sum + c.duration, 0) / total;

    return {
      total,
      successful,
      failed,
      successRate: (successful / total * 100).toFixed(2) + '%',
      avgDurationMs: Math.round(avgDuration),
      activeCalls: this.activeCalls.size
    };
  }
}

// 전역 인스턴스
window.apiCallManager = new ApiCallManager();
```

---

## 🚦 에러 처리

### 에러 코드

| 코드 | 설명 | HTTP 상태 | 해결 방법 |
|-----|------|----------|----------|
| `PLAYER_NOT_FOUND` | 플레이어를 찾을 수 없음 | 404 | 플레이어 존재 확인 |
| `DUPLICATE_PLAYER` | 중복 플레이어 | 409 | 기존 플레이어 확인 |
| `INVALID_INPUT` | 잘못된 입력 | 400 | 입력 데이터 검증 |
| `NETWORK_ERROR` | 네트워크 오류 | 503 | 네트워크 확인 |
| `TIMEOUT` | 타임아웃 | 504 | 재시도 |
| `PERMISSION_DENIED` | 권한 없음 | 403 | Apps Script 권한 확인 |
| `RATE_LIMIT` | 요청 제한 초과 | 429 | 잠시 후 재시도 |
| `SERVER_ERROR` | 서버 내부 오류 | 500 | 관리자 문의 |

### 사용자 친화적 에러 메시지

```javascript
function getUserFriendlyErrorMessage(error) {
  const errorPatterns = [
    {
      pattern: /network|fetch|cors/i,
      type: 'NETWORK_ERROR',
      message: '🌐 네트워크 연결 오류',
      details: '인터넷 연결을 확인해주세요',
      actions: [
        '1. WiFi 또는 데이터 연결 확인',
        '2. VPN 사용 중이라면 해제 후 재시도',
        '3. 잠시 후 다시 시도'
      ]
    },
    {
      pattern: /timeout/i,
      type: 'TIMEOUT',
      message: '⏱️ 요청 시간 초과',
      details: '서버 응답이 30초를 초과했습니다',
      actions: [
        '1. 네트워크 속도 확인',
        '2. 잠시 후 다시 시도',
        '3. 문제가 계속되면 관리자에게 문의'
      ]
    },
    {
      pattern: /url.*not.*valid|url.*설정/i,
      type: 'CONFIG_ERROR',
      message: '⚙️ Apps Script URL 설정 필요',
      details: 'Apps Script URL이 설정되지 않았거나 올바르지 않습니다',
      actions: [
        '1. 설정(⚙️) 메뉴 열기',
        '2. Apps Script URL 입력',
        '3. "저장" 버튼 클릭'
      ]
    }
    // ... 8가지 패턴
  ];

  for (const { pattern, type, message, details, actions } of errorPatterns) {
    if (pattern.test(error.message || error.toString())) {
      return {
        type,
        title: message,
        message: details,
        actions,
        originalError: error.message
      };
    }
  }

  // 기본 에러 메시지
  return {
    type: 'UNKNOWN_ERROR',
    title: '❌ 알 수 없는 오류',
    message: error.message || '오류가 발생했습니다',
    actions: ['관리자에게 문의해주세요'],
    originalError: error.stack
  };
}
```

---

## 🔧 개발 가이드

### 환경 설정

#### 1. 로컬 개발 서버 실행
```bash
# Node.js 서버
cd virtual_data_claude
node server.js
# http://localhost:8080

# 또는 Python 서버
python -m http.server 8000
# http://localhost:8000
```

#### 2. Apps Script 배포

**단계 1: 코드 복사**
```bash
# Apps Script 파일 열기
cat apps-script/Code_v71.0.3.gs
```

**단계 2: Script Properties 설정**
1. Apps Script 편집기 → 프로젝트 설정 (⚙️)
2. 스크립트 속성 추가:
   - `SPREADSHEET_ID`: `YOUR_SPREADSHEET_ID`

**단계 3: 배포**
1. 배포 → 새 배포
2. 유형: 웹 앱
3. 액세스: 모든 사용자
4. 배포 URL 복사

**단계 4: 프론트엔드 설정**
```javascript
// index.html 또는 설정 메뉴
const APPS_SCRIPT_URL = 'YOUR_DEPLOYMENT_URL';
localStorage.setItem('vd_appsScriptUrl', APPS_SCRIPT_URL);
```

### 새 API 추가 방법

#### 백엔드 (Apps Script)
```javascript
// 1. processAction()에 케이스 추가
function processAction(data) {
  switch(data.action) {
    // ... 기존 케이스

    case 'myNewAction':
      return handleMyNewAction(data);

    default:
      return { success: false, message: `알 수 없는 액션: ${data.action}` };
  }
}

// 2. 핸들러 함수 구현
function handleMyNewAction(data) {
  try {
    // 로직 구현
    return {
      success: true,
      message: '성공',
      data: { ... }
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}
```

#### 프론트엔드
```javascript
// 1. 보호된 래퍼 함수 추가
async function protectedMyNewAction(params) {
  return protectedApiCall(
    () => callMyNewAction(params),
    { priority: 'normal', timeout: 30000 }
  );
}

// 2. 실제 API 호출 함수
async function callMyNewAction(params) {
  const formData = new FormData();
  formData.append('action', 'myNewAction');
  formData.append('params', JSON.stringify(params));

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: formData
  });

  return await response.json();
}
```

### 디버깅

#### 프론트엔드 디버깅
```javascript
// 1. 콘솔 로그 활성화
window.DEBUG = true;

// 2. API 호출 추적
window.apiCallManager.getStats();

// 3. 네트워크 탭 확인
// Chrome DevTools → Network → Filter: fetch/xhr
```

#### 백엔드 디버깅
```javascript
// 1. Logger.log() 사용
function handleMyAction(data) {
  Logger.log('입력 데이터: ' + JSON.stringify(data));
  // ...
}

// 2. 실행 로그 확인
// Apps Script 편집기 → 실행 → 로그
```

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|-----|------|----------|--------|
| 2025-10-04 | 3.5.32 | 21개 문서 통합, API 문서 최초 작성 | Claude |
| 2025-09-24 | 3.5.0 | Phase 5 API 반영 | - |
| 2025-09-23 | 3.4.25 | Phase 4 보호 API 추가 | - |

---

**다음 업데이트 예정일**: API 변경 시 즉시 업데이트
