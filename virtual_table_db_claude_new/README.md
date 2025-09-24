# Virtual Table DB Claude

Supabase를 활용한 가상 테이블 토너먼트 시스템

## 프로젝트 소개

온라인 포커 토너먼트를 관리하기 위한 백엔드 시스템입니다. Supabase를 데이터베이스로 사용하며 TypeScript로 구현되었습니다.

## 주요 기능

- 토너먼트 생성 및 관리
- 테이블 관리
- 플레이어 인증 및 관리
- 핸드 기록 및 추적
- **포커 핸드 모니터링 시스템 (v9.0.0)**
  - 실시간 포커 핸드 모니터링
  - Virtual 시트 연동 및 시간 기반 매칭
  - 키 플레이어 중심 분석
  - **Apps Script Gemini AI 통합**
  - **설정창 URL 유효성 검증**
  - **깔끔한 UI/UX 개선**

## ⚠️ 버전 관리 가이드라인

### 버전 일치 규칙
**모든 버전 표시는 반드시 동일하게 유지되어야 합니다:**

1. **HTML 파일 내 버전 위치** (`index.html`):
   - 주석 헤더: `Version: X.X.X` (4번째 줄)
   - 페이지 타이틀: `<title>포커 핸드 모니터링 vX.X.X - AI 분석 시스템</title>` (15번째 줄)
   - 대시보드 표시: `<span class="text-xs text-gray-500">vX.X.X</span>` (251번째 줄)

2. **문서 파일** (`README.md`):
   - 최신 업데이트 섹션 제목
   - 버전 히스토리 항목

3. **패키지 파일** (`package.json`):
   - `"version": "X.X.X"`

### 버전 업데이트 체크리스트
- [ ] `index.html` 주석 헤더 버전 업데이트
- [ ] `index.html` 타이틀 버전 업데이트  
- [ ] `index.html` 대시보드 표시 버전 업데이트
- [ ] `README.md` 최신 업데이트 섹션 버전 업데이트
- [ ] `package.json` 버전 업데이트 (필요시)
- [ ] 변경 날짜 업데이트
- [ ] 변경 내용 문서화

### 버전 번호 규칙
- **Major (X.0.0)**: 큰 기능 변경, 하위 호환성 없음
- **Minor (0.X.0)**: 새 기능 추가, 하위 호환성 유지
- **Patch (0.0.X)**: 버그 수정, 작은 개선

---

## 최신 업데이트 (v9.4.1 - 2025-01-09)

### 🔧 **Apps Script 호환성 버그 수정 (v9.4.1)**

**✅ 해결된 문제:**
- `updateHandInSheet` 함수에서 Apps Script 호환성 오류 수정
- `action: 'updateHand'` → `action: 'updateSheet'`로 변경
- 데이터 구조를 Apps Script 예상 형식으로 수정:
  - `virtualRow` → `rowNumber`
  - `aiSummary` → `aiAnalysis`
  - `sheetUrl` 필드 추가
- 시트 업데이트 시 발생하던 오류 완전 해결

### 🎆 **이전 작업 상황 (v9.3.3 - 2025-01-09 완료)**

**✅ 완료된 주요 수정사항:**

1. **시분초 표기 문제 해결** ✓
   - `getHours().toString().padStart()` 체이닝 문제로 인한 시간 표시 오류 수정
   - 각 시간 단위를 개별 변수로 분리하여 안정성 향상
   - `String()` 명시적 변환 후 `padStart()` 적용
   - Virtual 시트 매칭 정확도 개선

2. **카드 문양 심볼 표시** ✓
   - 이미 구현된 카드 심볼 (♠♥♦♣) 확인
   - 3줄 요약에도 심볼 적용되도록 수정
   - `getSuitSymbol()` 함수 활용하여 일관성 유지

3. **3줄 요약 간략화** ✓
   - 복잡한 분석 로직 제거
   - 간결한 형식으로 변경:
     - 1줄: `플레이어(카드♠♥) vs 플레이어(카드♦♣)`
     - 2줄: `보드: A♠ K♥ Q♦ J♣ 10♠`
     - 3줄: `팟: 25.5BB`
   - 불필요한 상세 분석 제거

4. **시트 업데이트 모달 버그 수정** (v9.3.1) ✓
   - 매칭된 행 정보가 시트 업데이트 모달로 전달되지 않는 문제 해결
   - `window.currentMatchedRowData` 전역 변수로 매칭 정보 저장
   - 시트 업데이트 시 정확한 행 번호 참조 보장

5. **시간 표시 형식 개선** (v9.3.2) ✓
   - 모든 시간 표시를 시:분:초 형식으로 통일
   - 핸드 목록의 시간 표시 개선
   - 매칭 결과에 핸드 시간과 시트 시간 모두 표시
   - 시트 업데이트 모달에 시간 정보 추가

6. **BB 및 팟 계산 로직 개선** (v9.3.3) ✓
   - 초기 팟에 SB와 BB 자동 포함
   - 플레이어별 기여금 추적 시스템 추가
   - BB 단위 변환 정확도 향상
   - 디버그 로깅으로 계산 과정 추적

7. **이전 문제들 해결:**
   - addEventListener null 오류 해결 ✓
   - CORS 정책 문제 해결 ✓
   - UI 정리 및 최적화 ✓
   - Virtual 시트 매칭 무한 로딩 해결 ✓

**📊 현재 상태:**
- 모든 기능 정상 작동
- 시간 표시 및 Virtual 시트 매칭 안정화
- 카드 심볼 올바른 표시
- 3줄 요약 간략화 완료

**🔧 개발 환경 설정:**
```bash
# HTTP 서버 실행 (로컬 테스트용)
cd C:\claude\virtual_table_db_claude_new
python -m http.server 8080

# 브라우저 접속
http://localhost:8080/index.html
```

**🎯 다음 작업 시 체크 포인트:**
1. Virtual 시트 URL 설정 확인
2. Apps Script URL 연동 테스트
3. 핸드 완료 처리 프로세스 테스트
4. 시간 매칭 정확도 확인
5. 3줄 요약 출력 형식 확인

**💻 개발 환경 요구사항:**
- HTTP 서버 실행: `cd E:\claude02\virtual_table_db_claude && python -m http.server 8080`
- 브라우저 접속: `http://localhost:8080`
- 디버깅: 브라우저 개발자 도구 콘솔 확인

**🔍 현재 문제 디버깅 단계:**
1. **Virtual 시트 매칭 오류 재현**:
   - 포커 핸드 완료 버튼 클릭
   - "Virtual 시트 매칭 중..." 메시지 후 무한 대기
   
2. **콘솔 확인 항목**:
   - `CONFIG.READ_SHEET_URL: ''` (빈 문자열 확인)
   - Virtual 시트 접근 오류 메시지
   - CORS 프록시 사용 여부
   
3. **임시 해결책**:
   - 설정 모달 → Apps Script 시트 연동
   - 읽기용 CSV URL에 올바른 Virtual 시트 CSV URL 입력
   - 설정 저장 후 매칭 재시도

### 🧹 UI/UX 개선 및 코드 정리 (v9.0.0)
- **메인 대시보드 간소화**: 불필요한 링크 입력창 제거로 깔끔한 인터페이스
- **설정창 URL 유효성 검증**: 
  - 읽기용 CSV URL, 쓰기용 시트 URL, Apps Script URL 실시간 검증
  - 색상 피드백으로 입력 상태 직관적 표시
  - 구체적인 오류 메시지 및 해결 방법 제공
- **클라이언트 AI API 설정 제거**: 
  - GitHub Actions Secret 활용으로 서버사이드 AI 처리
  - 불필요한 클라이언트 AI API 키 입력 필드 완전 제거
  - Apps Script Gemini AI 통합으로 안전한 AI 분석
- **코드 최적화**: AI 관련 클라이언트 코드 정리 및 불필요한 함수 제거

### 📊 Apps Script 시트 업데이트 연동 (v8.9.0)
- **시트 업데이트 팝업**: 매칭 완료 후 팝업창으로 시트 업데이트 가능
- **읽기/쓰기 시트 분리**: 매칭용 CSV 시트와 업데이트용 시트 URL 분리 관리
- **Apps Script 연동**: F열(파일명), H열(AI분석) 자동 업데이트
- **설정 관리**: localStorage를 통한 Apps Script URL 및 시트 URL 저장
- **연결 테스트**: Apps Script 연결 상태 테스트 기능
- **시트 업데이트 UI**: 직관적인 팝업 인터페이스로 쉬운 시트 관리

### 🔧 Virtual 시트 매칭 기준 변경 (v8.8.0)
- **B열 기준 매칭**: Virtual 시트 시간 매칭 기준을 C열(Seoul)에서 B열(Cyprus)로 변경
- **로직 최적화**: B열의 Cyprus 시간대 데이터를 기준으로 포커 핸드 시간 매칭
- **디버깅 메시지 업데이트**: 모든 로그와 에러 메시지가 B열 기준으로 변경
- **문서 동기화**: README.md와 코드 주석이 B열 기준으로 통일

### 🔗 Google Sheets URL 실시간 유효성 검증 시스템 (v8.7.0)
- **실시간 검증**: URL 입력 시 즉시 유효성 검증 및 시각적 피드백
- **스마트 URL 분석**: 웹 게시 CSV, 일반 웹 게시, 편집 URL 자동 감지
- **시각적 피드백**: 색상 테두리로 URL 상태 표시
  - 🟢 초록: 완벽한 웹 게시 CSV URL (권장)
  - 🟡 노랑: 웹 게시 URL (자동 변환됨)
  - 🟠 주황: 편집 URL (권한 문제 가능)
  - 🔴 빨강: 지원되지 않는 형식
- **완료 전 검증**: 핸드 분석 시작 전 URL 유효성 재확인
- **향상된 사용자 가이드**: 도움말 버튼 및 상세한 URL 형식 안내

## 🚨 개발 히스토리 (2025-09-06 ~ 2025-01-09)

### 📍 **현재 단계: Virtual 시트 매칭 구현 및 디버깅**

#### ✅ **완료된 작업들:**

1. **시간 매칭 정밀도 개선 (v8.5.0)**
   - 분 단위 → 초 단위 정확도 향상
   - Seoul 시간대(UTC+9) 자동 변환 구현
   - 다양한 시간 형식 지원 (HH:MM:SS, HH:MM, 한국어)
   - 스마트 매칭 분류 시스템 (정확/근사/대략적 매칭)

2. **URL 유효성 검증 시스템 (v8.6.0)**
   - 실시간 Google Sheets URL 검증
   - 웹 게시 CSV/일반/편집 URL 자동 감지
   - 시각적 피드백 (색상 테두리)
   - 완료 버튼 클릭 시 URL 재검증

3. **디버깅 시스템 구현**
   - 상세한 콘솔 로깅 시스템
   - CSV 데이터 파싱 과정 추적
   - 시간 매칭 과정 단계별 로그
   - 매칭 결과 시각화

#### 🔧 **현재 구현된 핵심 로직:**

**`index.html` 주요 함수들:**
- `validateGoogleSheetsUrl(url)`: URL 유효성 검증 (1548-1617행)
- `updateUrlValidationUI(validationResult)`: UI 피드백 업데이트 (1619-1636행)
- `findClosestVirtualRow(targetTime, virtualSheetUrl)`: Virtual 시트 매칭 (1638행~)
- 시간 파싱 패턴: HH:MM:SS, HH:MM, 한국어 시간 형식 지원
- Seoul 시간대 변환 로직 구현

#### ✅ **해결된 문제:**

**이전 문제:**
```
❌ 매칭되는 행을 찾을 수 없음 (CORS 문제로 인한 CSV 접근 실패)
```

**해결책 구현 (2025-09-07):**
1. **다중 CSV 접근 방법 구현** - `fetchCsvWithFallback()` 함수
   - 🥇 **직접 fetch** (우선순위 1): 가장 빠른 방법, 웹 게시 CSV에서 주로 성공
   - 🥈 **Google Apps Script** (우선순위 2): CORS 정책 완전 우회, 서버사이드 접근
   - 🥉 **AllOrigins 프록시** (우선순위 3): 최후 수단, 외부 프록시 서비스

2. **검증된 해결책 출처**
   - GitHub 저장소: `garimto81/virtual_data_claude`
   - Apps Script URL: `AKfycbzRRDP0v9LT3Y1Wos_pj7dXg4IVCIC-hAmFpUFUovZBsE2h5hCulMspZsJwANLf1Kl9`
   - 테스트 완료: `sheets-test-fixed.html` 개발로 검증

#### 🚨 **남은 잠재적 이슈:**

**향후 모니터링 필요:**
   - 예상과 다른 CSV 구조
   - 인코딩 문제 (UTF-8 BOM, CP949 등)
   - 빈 행이나 헤더 처리 오류

3. **시간 형식 매칭 문제**
   - Virtual 시트의 시간 형식이 예상과 다름
   - 시간대 변환 오류
   - 시간 패턴 정규식 매칭 실패

4. **데이터 구조 불일치**
   - Virtual 시트의 컬럼 구조 변경
   - B열(Cyprus 시간)이 다른 위치에 있음
   - 시트 ID(gid) 오류

#### 🔍 **디버깅 현황:**

**구현된 디버깅 도구:**
- URL 형식 감지 및 변환 로그
- HTTP 응답 상태 및 헤더 확인
- CSV 데이터 미리보기 (첫 500자)
- 시간 파싱 과정 상세 로그
- 매칭 결과 단계별 추적

**확인 가능한 정보:**
```javascript
console.log('📄 CSV 데이터 크기:', text.length);
console.log('📄 CSV 데이터 미리보기:', text.substring(0, 500));
console.log('🕐 타겟 시간:', new Date(targetTime * 1000));
console.log('📊 유효한 시간 발견:', validTimeFoundCount);
```

#### 🎯 **다음 단계 (재작업 시 수행해야 할 작업들):**

1. **실제 Google Sheets 테스트**
   - 실제 웹 게시 CSV URL로 테스트
   - 다양한 시트 구조 테스트
   - CORS 문제 해결 확인

2. **CSV 데이터 구조 분석**
   - Virtual 시트의 정확한 컬럼 구조 파악
   - 시간 데이터가 실제로 어느 컬럼에 있는지 확인
   - 헤더 행 존재 여부 확인

3. **시간 형식 패턴 확장**
   - Virtual 시트에서 실제 사용하는 시간 형식 파악
   - 필요시 추가 시간 패턴 구현
   - 시간대 변환 로직 검증

4. **에러 핸들링 강화**
   - 각 단계별 실패 원인 구체적 파악
   - 사용자 친화적 오류 메시지
   - 자동 재시도 메커니즘

#### 📂 **관련 파일들:**

**핵심 파일:**
- `index.html`: 메인 모니터링 시스템 (2600+ 줄)
- `README.md`: 프로젝트 문서 (현재 파일)
- `package.json`: v1.5.0

**주요 코드 위치:**
- URL 검증: index.html 1548-1636행
- Virtual 시트 매칭: index.html 1638행 이후
- 시간 파싱 패턴: index.html ~1686-1696행
- 완료 버튼 로직: index.html ~2499행

#### 💡 **개발자 노트:**

**성공적인 매칭을 위한 조건:**
1. 올바른 웹 게시 CSV URL 형식
2. C열에 Seoul 시간 데이터 존재  
3. 시간 형식이 지원되는 패턴과 일치
4. CORS 정책 통과

**테스트 시나리오:**
1. 간단한 Google Sheets 생성
2. C열에 시간 데이터 입력 (예: "14:30:25")
3. 웹에 게시 → CSV 선택
4. 생성된 URL로 시스템 테스트

#### 🔬 **기술적 세부사항:**

**현재 지원하는 시간 패턴:**
```javascript
const timePatterns = [
  { pattern: /(\d{1,2}):(\d{2}):(\d{2})/, name: 'HH:MM:SS' },
  { pattern: /(\d{1,2}):(\d{2})/, name: 'HH:MM' },
  { pattern: /(\d{1,2})시\s*(\d{1,2})분\s*(\d{1,2})초/, name: '한국어 시:분:초' },
  { pattern: /(\d{1,2})시\s*(\d{1,2})분/, name: '한국어 시:분' }
];
```

**CSV 데이터 접근 로직:**
```javascript
// 1. 웹 게시 CSV URL (권장)
if (url.includes('/pub?') && url.includes('output=csv'))

// 2. 웹 게시 일반 URL → CSV 변환
if (url.includes('/spreadsheets/d/e/2PACX-'))

// 3. 편집 URL → export 방식 (비추천)
if (url.includes('/spreadsheets/d/') && !url.includes('/e/'))
```

**시간 매칭 알고리즘:**
1. CSV 데이터를 행별로 파싱
2. 각 행의 C열(Seoul 시간) 추출
3. 시간 패턴 매칭 시도
4. Seoul 시간대(UTC+9) 기준으로 초 단위 계산
5. 타겟 시간과의 차이 계산 및 최소값 찾기

**예상 CSV 구조:**
```csv
A열(Blinds),B열(Cyprus),C열(Seoul),D열(#)
"100/200","13:30:25","14:30:25","1"
"150/300","13:35:45","14:35:45","2"
```

#### 🐛 **알려진 이슈들:**

1. **CORS 정책**
   - 브라우저에서 직접 Google Sheets에 접근 시 CORS 제한
   - 웹 게시 CSV URL 사용으로 해결 시도 중

2. **시간 형식 변이**
   - Google Sheets에서 시간 형식이 자동 변환될 수 있음
   - 로케일 설정에 따라 다른 형식 사용 가능

3. **데이터 인코딩**
   - UTF-8 BOM, CP949 등 다양한 인코딩 가능성
   - 특수 문자나 공백 처리 문제

#### 🛠️ **디버깅 체크리스트:**

**1단계: URL 접근 확인**
- [ ] HTTP 응답 코드 200 확인
- [ ] Content-Type이 CSV인지 확인
- [ ] CSV 데이터 길이가 0이 아닌지 확인

**2단계: CSV 데이터 구조 확인**
- [ ] CSV 첫 500자 출력으로 구조 파악
- [ ] 헤더 행 존재 여부 확인
- [ ] 컬럼 구분자(쉼표, 탭 등) 확인

**3단계: 시간 데이터 확인**
- [ ] C열에 시간 데이터가 실제로 있는지 확인
- [ ] 시간 형식이 지원 패턴과 일치하는지 확인
- [ ] 빈 셀이나 null 값 처리 확인

**4단계: 매칭 로직 확인**
- [ ] 타겟 시간이 올바르게 변환되는지 확인
- [ ] Seoul 시간대 변환 로직 검증
- [ ] 시간 차이 계산이 정확한지 확인

#### 📋 **재작업 시 우선순위:**

**높음 (즉시 해결 필요)**
1. 실제 Google Sheets CSV URL로 기본 접근 테스트
2. CSV 데이터 파싱 및 구조 확인
3. 시간 형식 패턴 매칭 검증

**중간 (기능 개선)**
4. 다양한 CSV 구조 대응
5. 에러 메시지 개선
6. 재시도 메커니즘 구현

**낮음 (최적화)**
7. 성능 최적화
8. UI/UX 개선
9. 추가 시간 형식 지원

#### 🔧 **개발 환경 정보:**

**현재 Git 상태:**
- 브랜치: `feature/supabase-integration`
- 최신 커밋: `v8.9.0` (Apps Script 시트 업데이트 연동)
- 버전: HTML v8.9.0, Package v1.5.0

**테스트 방법:**
1. `index.html` 브라우저에서 직접 열기
2. F12 → Console 탭에서 디버깅 로그 확인
3. Virtual Sheet URL 입력 후 완료 버튼 클릭
4. 매칭 과정 단계별 로그 분석

### 📋 **이전 업데이트 히스토리:**

#### v8.5.0 (Virtual 시트 시간 매칭 정밀도 개선)
- **초 단위 정확도**: 기존 분 단위에서 초 단위 매칭으로 정밀도 대폭 향상
- **Seoul 시간대 지원**: UTC+9 시간대 자동 변환으로 정확한 로컬 시간 매칭
- **다양한 시간 형식**: HH:MM:SS, HH:MM, 한국어 시간 표기 지원
- **스마트 매칭 시스템**: 
  - 🎯 정확 매칭 (5초 이내)
  - ✅ 근사 매칭 (30초 이내)  
  - ⚠️ 대략적 매칭 (그 이상)
- **향상된 UI**: 매칭 정확도 시각화 및 상세 시간 차이 표시

## Supabase Integration

### Setup

1. 저장소 클론
```bash
git clone https://github.com/garimto81/virtual_table_db_claude.git
cd virtual_table_db_claude
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 열어 Supabase 인증 정보 입력
```

4. 데이터베이스 마이그레이션 실행
```bash
npm run db:migrate
```

## 테스트 실행

### 유닛 테스트

유닛 테스트는 외부 의존성 없이 실행됩니다:

```bash
npm run test:unit
```

### 통합 테스트

통합 테스트를 실행하려면 Supabase 설정이 필요합니다:

1. Supabase 프로젝트에서 RLS(Row Level Security) 정책 설정
2. 테스트용 사용자 계정 생성
3. `.env` 파일에 서비스 키 추가

```bash
npm run test:integration
```

**참고**: 현재 통합 테스트는 RLS 정책 설정이 필요하여 스킵되어 있습니다.

### 모든 테스트 실행

```bash
npm test
```

### Watch 모드

```bash
npm run test:watch
```

### 코드 커버리지

```bash
npm run test:coverage
```

## 프로젝트 구조

```
src/
├── config/         # 설정 파일 (Supabase 클라이언트 등)
├── services/       # 비즈니스 로직 및 서비스 레이어
├── tests/          # 테스트 파일
│   ├── integration/  # 통합 테스트
│   └── unit/        # 유닛 테스트
└── types/          # TypeScript 타입 정의
```

## 사용 가능한 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - TypeScript 컴파일
- `npm test` - 테스트 실행
- `npm run lint` - 코드 린팅

## API 서비스

### Tournament Service
- `createTournament()` - 새 토너먼트 생성
- `getTournament()` - 토너먼트 정보 조회
- `createTable()` - 테이블 생성
- `getTables()` - 토너먼트 테이블 목록 조회

### Auth Service
- `signIn()` - 사용자 로그인
- `signUp()` - 새 사용자 등록
- `signOut()` - 로그아웃
- `getCurrentUser()` - 현재 사용자 정보 조회

### Hand Service
- `createHand()` - 새 핸드 생성
- `getHand()` - 핸드 정보 조회
- `getHandsByTable()` - 테이블별 핸드 목록 조회
- `updateHand()` - 핸드 정보 업데이트

## 환경 변수

`.env` 파일에 다음 환경 변수를 설정해야 합니다:

- `SUPABASE_URL` - Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY` - Supabase Anonymous Key
- `SUPABASE_SERVICE_KEY` - Supabase Service Key (테스트용)

## CI/CD

GitHub Actions를 통한 자동 테스트가 구성되어 있습니다. main 또는 develop 브랜치에 푸시하거나 main 브랜치로 PR을 생성하면 자동으로 테스트가 실행됩니다.

## 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 라이선스

ISC

## 문의

Issues 탭을 통해 문의해 주세요.