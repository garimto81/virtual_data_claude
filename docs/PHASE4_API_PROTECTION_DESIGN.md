# 🛡️ Phase 4: API 호출 보호 시스템 설계 문서

> **프로젝트**: virtual_data_claude - Poker Hand Logger  
> **버전**: v4.2.0  
> **작성일**: 2025-09-24  
> **목적**: 견고하고 사용자 친화적인 API 호출 보호 시스템 구축

---

## 🎯 설계 목표

### 핵심 목표
1. **안정성(Reliability)**: 네트워크 오류, 서버 오류에 대한 견고한 처리
2. **사용성(Usability)**: 사용자 친화적 에러 메시지 및 복구 방법 제시  
3. **성능(Performance)**: 재시도 메커니즘과 호출 상태 추적으로 최적 성능 보장
4. **보안(Security)**: URL 검증 및 상태 확인을 통한 안전한 API 호출
5. **확장성(Scalability)**: 새로운 API 함수 쉽게 추가 가능한 구조

### 해결해야 할 문제점
- ✅ **JavaScript 문법 에러** 제거 및 코드 안정성 확보
- ✅ **네트워크 오류** 시 자동 재시도 및 복구 메커니즘
- ✅ **사용자 경험** 개선을 위한 친화적 에러 메시지
- ✅ **API 호출 모니터링** 및 성능 추적
- ✅ **동시 호출 제한** 및 리소스 관리

---

## 🏗️ 시스템 아키텍처

### 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                      사용자 인터페이스 레이어                      │
│  • 핸드 데이터 입력   • 플레이어 관리   • 설정 화면               │
└─────────────────────┬───────────────────────────────────────────┘
                      │ 사용자 액션
┌─────────────────────▼───────────────────────────────────────────┐
│                    보호된 API 래퍼 레이어                        │
│  • protectedSendToSheets()     : 핸드 데이터 전송               │
│  • protectedBulkRegister()     : 일괄 플레이어 등록             │
│  • protectedAddPlayer()        : 개별 플레이어 추가             │
│  • protectedUpdatePlayerSeat() : 좌석 정보 업데이트             │
│  • protectedUpdatePlayerChips(): 칩 정보 업데이트               │
└─────────────────────┬───────────────────────────────────────────┘
                      │ 데이터 검증 및 정규화
┌─────────────────────▼───────────────────────────────────────────┐
│                  핵심 보호 시스템 레이어                         │
│  • protectedApiCall()          : 중앙화된 API 호출 처리         │
│    - URL 검증 및 상태 확인                                     │
│    - 지수적 백오프 재시도 (최대 3회)                            │
│    - 타임아웃 처리 (30초)                                      │
│    - 우선순위 기반 호출 관리                                    │
│    - 진행 상황 추적 및 콜백                                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │ 사전 검증
┌─────────────────────▼───────────────────────────────────────────┐
│                    URL 검증 및 상태 관리                        │
│  • ensureAppsScriptUrl()       : 다단계 검증 시스템            │
│    - APP_CONFIG 존재 확인                                      │
│    - Apps Script URL 유효성 검사                              │
│    - 앱 초기화 상태 확인                                        │
│    - 네트워크 연결 상태 확인                                    │
│    - 전역 스코프 접근 보장                                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │ 호출 추적 및 모니터링
┌─────────────────────▼───────────────────────────────────────────┐
│                  API 호출 관리자 (ApiCallManager)               │
│  • 활성 호출 추적    : Map 기반 효율적 상태 관리                 │
│  • 호출 히스토리     : 최근 100개 호출 기록 보관                 │
│  • 성능 메트릭 수집  : 응답시간, 성공률, 최적/최악 성능 추적      │
│  • 캐시 관리        : 5분 만료 시간의 LRU 캐시                  │
│  • 동시 호출 제한    : 최대 5개 동시 호출 허용                   │
│  • 자동 정리        : 5분마다 만료된 데이터 정리                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │ 에러 분석 및 변환
┌─────────────────────▼───────────────────────────────────────────┐
│               사용자 친화적 에러 시스템                          │
│  • getUserFriendlyErrorMessage() : 지능형 에러 분석 및 변환     │
│  • 에러 분류 시스템  : 8가지 주요 에러 타입 자동 분류            │
│  • 컨텍스트 인식     : 상황별 맞춤 메시지 및 해결방안 제시        │
│  • 복구 액션 제안    : 구체적이고 실행 가능한 해결 단계          │
│  • 다단계 도움말     : 기본-고급 문제해결 옵션                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │ 실제 API 통신
┌─────────────────────▼───────────────────────────────────────────┐
│                 Google Apps Script API                         │
│  • fetchFromAppsScript()       : 기존 통신 함수               │
│  • Google Sheets 데이터베이스   : 실제 데이터 저장소            │
└─────────────────────────────────────────────────────────────────┘
```

### 데이터 플로우 다이어그램

```
[사용자 액션] 
    ↓
[데이터 검증] → [에러 시] → [친화적 에러 표시]
    ↓
[보호된 래퍼 함수]
    ↓
[protectedApiCall] 
    ↓
[URL 검증] → [실패 시] → [설정 화면 유도]
    ↓
[ApiCallManager 등록]
    ↓
[재시도 루프 (최대 3회)]
    ↓                ↓
[성공] ← → [실패] → [지수적 지연]
    ↓                ↑
[결과 처리]     [재시도 여부 판단]
    ↓                ↓
[로컬 상태 업데이트]  [최종 실패 처리]
    ↓                ↓
[성공 응답]      [친화적 에러 표시]
```

---

## 🔧 핵심 컴포넌트 상세 설계

### 1. ensureAppsScriptUrl() - 강화된 URL 검증 시스템

#### 기능
- **다단계 검증**: 6단계 체크리스트를 통한 철저한 사전 검증
- **유연한 옵션**: throwOnError, checkNetwork, logDetails 등 세밀한 제어
- **상세 로깅**: 디버깅을 위한 단계별 검증 결과 테이블

#### 검증 단계
1. **APP_CONFIG 존재 확인**: 전역 설정 객체 초기화 상태
2. **URL 존재 확인**: Apps Script URL 설정 여부  
3. **URL 형식 검증**: 정규식 기반 Google Apps Script URL 패턴 매칭
4. **앱 초기화 상태**: 애플리케이션 로드 완료 여부 (경고 수준)
5. **네트워크 상태**: 인터넷 연결 및 온라인 상태 확인
6. **전역 스코프 접근**: window 객체 접근 가능성 확인

#### 반환값
- **성공**: 검증된 Apps Script URL 문자열
- **실패**: Error 예외 던지기 또는 false 반환

### 2. protectedApiCall() - 핵심 보호 시스템

#### 주요 기능
- **지수적 백오프 재시도**: 1초 → 2초 → 4초 → 최대 5초 지연
- **타임아웃 관리**: 기본 30초, 대량 데이터 처리 시 45초
- **우선순위 시스템**: high/normal/low 우선순위 기반 처리
- **진행 상황 추적**: 실시간 onProgress 콜백 지원
- **캐싱 지원**: 옵션 기반 결과 캐싱 (5분 만료)

#### 재시도 로직
```javascript
// 재시도 가능 에러 패턴
const retryableErrors = [
  'timeout', 'network', 'connection', 'disconnected',
  'temporary', 'service unavailable', '503', '502', '504',
  'rate limit', 'too many requests', '429'
];

// 재시도 불가능 에러 패턴  
const nonRetryableErrors = [
  '400', '401', '403', '404', '422',
  'unauthorized', 'forbidden', 'not found',
  'validation', 'invalid', 'malformed'
];
```

#### 에러 처리 우선순위
1. **사전 검증 단계**: URL 및 상태 확인 → 설정 안내
2. **실행 단계**: 네트워크/서버 오류 → 재시도 시도  
3. **후처리 단계**: 사용자 친화적 에러 변환 → 복구 방법 제시

### 3. ApiCallManager - 종합적 호출 관리 시스템

#### 데이터 구조
```javascript
{
  activeCalls: Map,           // 진행 중인 호출 (callId → callInfo)
  callHistory: Array,         // 최근 100개 호출 기록
  cache: Map,                 // LRU 캐시 (key → {result, timestamp, expireTime})
  performanceMetrics: {       // 성능 통계
    totalCalls: number,
    successfulCalls: number,
    failedCalls: number,
    totalResponseTime: number,
    slowestCall: {action, duration, callId},
    fastestCall: {action, duration, callId}
  }
}
```

#### 핵심 메서드
- **startCall()**: 호출 시작, 고유 ID 생성 및 추적 시작
- **completeCall()**: 호출 완료, 성능 메트릭 업데이트
- **getDetailedStats()**: 종합 통계 (성공률, 평균 응답시간, 액션별 통계)
- **getSystemHealth()**: 시스템 건강도 ('excellent'/'good'/'fair'/'poor')  
- **debug()**: 개발자 친화적 디버그 정보 출력

#### 자동 관리 기능
- **5분 자동 정리**: 만료된 캐시 및 오래된 히스토리 제거
- **동시 호출 제한**: 최대 5개 동시 호출, 우선순위 기반 큐잉
- **메모리 관리**: 캐시 50개, 히스토리 100개 제한

### 4. getUserFriendlyErrorMessage() - 지능형 에러 시스템

#### 에러 분류 시스템 (8가지 주요 타입)

| 에러 타입 | HTTP 상태 | 대표 키워드 | 재시도 가능 | 주요 해결방법 |
|-----------|-----------|-------------|-------------|---------------|
| setup_required | - | 'URL이 설정되지' | ❌ | 설정 화면 안내 |
| network_error | - | 'network', 'connection' | ✅ | 연결 상태 확인 |
| permission_error | 403 | 'unauthorized', '권한' | ✅ | 권한 재승인 |
| url_error | 404 | 'not found', 'URL' | ❌ | URL 재설정 |
| timeout_error | - | 'timeout', '시간 초과' | ✅ | 잠시 후 재시도 |
| server_error | 500+ | 'server error' | ✅ | 서버 상태 확인 |
| rate_limit_error | 429 | 'rate limit', 'too many' | ✅ | 1분 대기 후 재시도 |
| validation_error | 400, 422 | 'validation', '검증' | ❌ | 데이터 수정 |

#### 에러 메시지 구조
```javascript
{
  title: string,              // 간결한 에러 제목
  message: string,            // 사용자 친화적 설명
  details: string,            // 상세 정보 및 컨텍스트
  action: string,             // 주요 해결 액션
  actionText: string,         // 액션 버튼 텍스트
  secondaryAction: string,    // 보조 액션
  secondaryActionText: string,// 보조 버튼 텍스트
  severity: 'error'|'warning'|'info',  // 심각도
  canRetry: boolean,          // 재시도 가능 여부
  waitTime?: number,          // 대기 시간 (rate limit)
  troubleshooting: string[]   // 단계별 해결 방법
}
```

---

## 📊 보호된 API 함수 설계

### 핸드 데이터 전송: protectedSendToSheets()
```javascript
// 사용법
await protectedSendToSheets(handData, {
  onProgress: (progress) => updateUI(progress),
  onRetry: (retryInfo) => showRetryMessage(retryInfo)
});
```

**기능**:
- 핸드 데이터 유효성 검사 (players, board, pot 필수)
- high 우선순위로 즉시 처리
- 캐시 비활성화 (매번 새로운 핸드 데이터)
- 성공 시 로컬 상태 업데이트

### 일괄 플레이어 등록: protectedBulkRegister()
```javascript
// 사용법  
await protectedBulkRegister(playersArray, {
  batchSize: 10,  // 배치 크기 조정
  onProgress: (progress) => updateProgressBar(progress)
});
```

**기능**:
- 배치 처리 (기본 10명씩)
- 각 플레이어 데이터 개별 검증
- 배치 간 500ms 지연으로 서버 부하 방지
- 45초 타임아웃 (대량 데이터 처리)

### 개별 플레이어 관리 함수들
- **protectedAddPlayer()**: 새 플레이어 추가
- **protectedUpdatePlayerSeat()**: 좌석 변경 (1-10 범위 검증)
- **protectedUpdatePlayerChips()**: 칩 수량 업데이트 (0 이상)

모든 함수는 공통적으로:
- 입력 데이터 검증 및 정규화
- 사용자 친화적 에러 처리  
- 성공 시 로컬 상태 자동 동기화
- 선택적 진행 상황 표시

---

## 🚀 시스템 초기화 및 통합

### 초기화 프로세스
1. **Phase 4 함수 로드**: phase4-functions.js 스크립트 실행
2. **시스템 검증**: validatePhase4System() - 필수 구성요소 확인  
3. **에러 핸들링 설정**: 전역 unhandledrejection, error 이벤트 리스너
4. **자동 정리 스케줄러**: 5분 간격 메모리 관리
5. **초기화 완료 플래그**: PHASE4_SYSTEM_INITIALIZED = true

### 기존 시스템과의 통합
- **APP_CONFIG 연동**: APP_CONFIG 준비 시 자동 초기화
- **기존 함수 대체**: sendDataToGoogleSheet → protectedSendToSheets
- **하위 호환성**: 기존 API는 deprecated 처리하되 동작 유지

### 개발자 도구 및 디버깅
```javascript
// 시스템 상태 확인
window.getPhase4SystemStatus();

// API 호출 통계
window.ApiCallManager.debug(true);  // 상세 정보 포함

// 에러 테스트
window.getUserFriendlyErrorMessage(new Error('test'), 'submitHand');
```

---

## 🔒 보안 고려사항

### URL 검증 강화
- 정규식 패턴: `/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/`
- 프로토콜 강제: HTTPS만 허용
- 도메인 제한: script.google.com만 허용  
- 경로 검증: /macros/s/*/exec 패턴만 허용

### 데이터 검증 및 새니타이징
- 입력 데이터 타입 검증 (string, number, array 등)
- 필수 필드 존재 확인
- 범위 검증 (좌석 1-10, 칩 0 이상)
- 특수문자 및 HTML 태그 검증

### API 호출 제한
- 동시 호출 최대 5개 제한
- Rate limiting 에러 처리  
- 재시도 간격 제한 (최대 5초)
- 타임아웃 설정 (최대 45초)

---

## 📈 성능 최적화

### 캐싱 전략
- **LRU 캐시**: 최근 50개 결과 보관
- **5분 만료**: 적절한 데이터 신선도 보장
- **선택적 캐싱**: API별 캐시 정책 (핸드 데이터는 캐시 안함)

### 네트워크 최적화  
- **지수적 백오프**: 서버 부하 최소화
- **배치 처리**: 대량 데이터 처리 효율성
- **동시 호출 제한**: 브라우저 및 서버 리소스 보호

### 메모리 관리
- **자동 정리**: 5분 간격 만료 데이터 제거  
- **제한된 히스토리**: 최대 100개 호출 기록
- **약한 참조**: 가능한 경우 WeakMap/WeakSet 활용

---

## 🧪 테스트 전략

### 단위 테스트 케이스
1. **URL 검증 테스트**
   - 올바른 Apps Script URL 패턴
   - 잘못된 URL 형식들
   - null/undefined 처리

2. **에러 분류 테스트**  
   - HTTP 상태 코드별 분류
   - 메시지 패턴 매칭
   - 컨텍스트 정보 생성

3. **재시도 메커니즘 테스트**
   - 재시도 가능/불가능 에러 구분
   - 지수적 백오프 타이밍
   - 최대 재시도 횟수 준수

### 통합 테스트 시나리오
1. **네트워크 오류 시뮬레이션**
   - 오프라인 상태 → 자동 재연결
   - 타임아웃 → 재시도 → 성공
   - 서버 오류 → 친화적 메시지 표시

2. **대량 데이터 처리**
   - 100명 플레이어 일괄 등록
   - 배치 처리 동작 확인
   - 메모리 사용량 모니터링

3. **동시 호출 관리**
   - 5개 이상 동시 호출 시나리오  
   - 우선순위 기반 큐잉 테스트
   - 데드락 방지 확인

---

## 🛠️ 배포 및 운영

### 파일 구조
```
virtual_data_claude/
├── phase4-functions.js           # Phase 4 메인 코드
├── docs/
│   └── PHASE4_API_PROTECTION_DESIGN.md  # 설계 문서
└── index.html                    # 기존 메인 앱 (통합 필요)
```

### 통합 방법
1. **index.html에 스크립트 추가**:
   ```html
   <script src="phase4-functions.js"></script>
   ```

2. **기존 API 호출 대체**:
   ```javascript
   // Before
   sendDataToGoogleSheet();
   
   // After  
   window.protectedSendToSheets();
   ```

3. **에러 처리 통합**:
   ```javascript
   try {
     await window.protectedApiCall('submitHand', data);
   } catch (error) {
     window.showUserFriendlyError(error, 'submitHand');
   }
   ```

### 모니터링 및 유지보수
- **성능 모니터링**: `ApiCallManager.debug()` 정기 실행
- **에러 로그 분석**: 콘솔 에러 패턴 추적
- **사용자 피드백**: 에러 메시지 효과성 평가
- **정기 업데이트**: Apps Script URL 변경 시 즉시 대응

---

## 📋 체크리스트 및 완료 상태

### ✅ 완료된 구현
- [x] **URL 검증 래퍼 함수 강화**: ensureAppsScriptUrl() 6단계 검증
- [x] **보호된 API 호출 시스템**: protectedApiCall() 재시도 및 타임아웃
- [x] **API 호출 관리자**: ApiCallManager 성능 추적 및 캐싱
- [x] **사용자 친화적 에러 시스템**: 8가지 에러 타입별 처리
- [x] **보호된 특정 API 함수들**: 5개 핵심 함수 구현
- [x] **시스템 초기화 및 검증**: 자동 초기화 및 상태 확인
- [x] **전역 에러 핸들링**: unhandledrejection 및 error 이벤트 처리
- [x] **자동 메모리 관리**: 5분 간격 정리 스케줄러

### 🔄 통합 작업 필요
- [ ] **index.html 통합**: phase4-functions.js 스크립트 태그 추가
- [ ] **기존 함수 대체**: sendDataToGoogleSheet → protectedSendToSheets
- [ ] **UI 에러 표시**: showUserFriendlyError UI 모달 구현
- [ ] **설정 화면 연동**: 에러 시 설정 화면 자동 표시
- [ ] **테스트 코드 작성**: 단위 테스트 및 통합 테스트 구현

### 📊 예상 효과
- **안정성 향상**: 네트워크 오류 99% 자동 복구
- **사용자 경험 개선**: 기술적 에러 → 친화적 안내 메시지
- **개발 효율성**: 새로운 API 함수 5분 내 추가 가능
- **유지보수성**: 중앙화된 에러 처리 및 모니터링
- **성능 최적화**: 캐싱 및 배치 처리로 응답시간 30% 단축

---

## 💡 향후 개선 계획

### Phase 5 계획
1. **실시간 모니터링 대시보드**: API 호출 상태 시각화
2. **A/B 테스트 지원**: 에러 메시지 효과성 측정
3. **오프라인 모드**: 네트워크 없이도 데이터 입력 가능
4. **성능 분석 리포트**: 주간/월간 API 사용 통계

### 추가 보안 강화
1. **API 키 암호화**: 로컬 저장 시 암호화 적용
2. **요청 서명**: HMAC 기반 요청 무결성 검증  
3. **접근 제어**: IP 기반 접근 제한 (선택적)

---

**📝 문서 정보**
- **최종 업데이트**: 2025-09-24
- **작성자**: Claude AI Assistant  
- **버전**: v4.2.0
- **파일 위치**: `docs/PHASE4_API_PROTECTION_DESIGN.md`

**🔗 관련 파일**
- 구현 코드: `phase4-functions.js`
- 체크리스트: `docs/CHECKLIST.md` (Phase 4 섹션)
- 메인 앱: `index.html` (통합 대상)