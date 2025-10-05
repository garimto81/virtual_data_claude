# 프로젝트 설정 가이드

**프로젝트:** Virtual Data - Poker Hand Logger v3.6.0
**최종 수정:** 2025-10-05
**난이도:** ⭐ 초급

---

## 📋 목차

1. [사전 요구사항](#사전-요구사항)
2. [Apps Script 배포](#apps-script-배포)
3. [Frontend 설정](#frontend-설정)
4. [검증](#검증)
5. [문제 해결](#문제-해결)

---

## 🎯 아키텍처 개요

### 데이터 흐름
```
┌─────────────────┐
│  Frontend       │
│  (index.html)   │
└────────┬────────┘
         │
         ├─ 읽기 ──────────┐
         │                  │
         │          ┌───────▼────────┐
         │          │ Google Sheets  │
         │          │ (CSV Export)   │
         │          └────────────────┘
         │                  │
         │                  ▼
         │          Type, Index, Hand
         │
         ├─ 쓰기 ──────────┐
         │                  │
         │          ┌───────▼────────┐
         │          │ Apps Script    │
         │          │ (doPost)       │
         │          └────────────────┘
         │                  │
         │                  ▼
         │          createPlayer()
         │          updatePlayer()
         │          deletePlayer()
         │
         └─ 로컬 서버 ─────┐
                          │
                  ┌───────▼────────┐
                  │ http.server    │
                  │ :5000          │
                  └────────────────┘
```

---

## 1️⃣ 사전 요구사항

### 필수 항목
- ✅ Google 계정
- ✅ Google Sheets 접근 권한
- ✅ 브라우저 (Chrome/Edge/Firefox 최신 버전)
- ✅ Python 3.x (로컬 서버용)

### 선택 항목
- Git (버전 관리)
- VS Code (코드 편집)

---

## 2️⃣ Apps Script 배포

### Step 1: Google Sheets 열기
1. 브라우저에서 Google Sheets 접속
2. 프로젝트 시트 열기: https://docs.google.com/spreadsheets/d/1gZN9S2rP5_U9zdxX1cJHBzBAl-Nup4PD4QXuW44rnSE
3. 시트 구조 확인:
   - ✅ **Type** 시트: 플레이어 정보
   - ✅ **Index** 시트: 핸드 인덱스
   - ✅ **Hand** 시트: 핸드 상세

### Step 2: Apps Script 편집기 열기
1. 상단 메뉴: **확장 프로그램** → **Apps Script**
2. 새 탭에서 Apps Script 편집기 열림

### Step 3: 코드 복사
1. 로컬 파일 열기: `apps-script/Code_v71.1.0.gs`
2. **전체 선택** (Ctrl+A)
3. **복사** (Ctrl+C)

### Step 4: 코드 교체
1. Apps Script 편집기에서 기존 코드 **전체 선택** (Ctrl+A)
2. **삭제**
3. **붙여넣기** (Ctrl+V)
4. 💾 **저장** (Ctrl+S)

### Step 5: 배포
1. 우측 상단 **배포** 버튼 클릭
2. **새 배포** 선택
3. 설정:
   - **유형 선택:** 웹 앱
   - **설명:** `v71.1.0 - Phase 0 Week 1`
   - **다음 사용자로 실행:** 나
   - **액세스 권한:** 전체 사용자
4. **배포** 클릭
5. **승인** (Google 계정 권한 허용)
6. **웹 앱 URL 복사** (중요!)
   ```
   예: https://script.google.com/macros/s/AKfycbxxx.../exec
   ```

### ⚠️ 중요 사항
- 코드 수정 후 **반드시 새 배포** 필요
- 기존 배포 수정 시: "새 버전 배포" 선택

---

## 3️⃣ Frontend 설정

### Step 1: 로컬 서버 실행
```bash
# 프로젝트 폴더로 이동
cd c:\claude\virtual_data_claude

# Python 서버 실행
python -m http.server 5000
```

**출력 확인:**
```
Serving HTTP on 0.0.0.0 port 5000 (http://0.0.0.0:5000/) ...
```

### Step 2: 브라우저에서 앱 열기
```
http://localhost:5000
```

### Step 3: Apps Script URL 설정
1. 우측 상단 **⚙️ 관리** 버튼 클릭
2. "Apps Script URL" 섹션 찾기
3. **복사한 배포 URL 붙여넣기**
   ```
   https://script.google.com/macros/s/AKfycbxxx.../exec
   ```
4. **확인** 클릭
5. 성공 메시지 확인:
   ```
   ✅ Apps Script URL이 성공적으로 저장되었습니다!
   ```

### Step 4: CSV URLs 자동 설정
CSV URLs는 **자동으로 설정**됩니다 (index.html line 776-778):
```javascript
const CSV_TYPE_URL = 'https://docs.google.com/spreadsheets/d/1gZN9S2rP5_U9zdxX1cJHBzBAl-Nup4PD4QXuW44rnSE/export?format=csv&gid=1155662404';
const CSV_INDEX_URL = 'https://docs.google.com/spreadsheets/d/1gZN9S2rP5_U9zdxX1cJHBzBAl-Nup4PD4QXuW44rnSE/export?format=csv&gid=0';
const CSV_HAND_URL = 'https://docs.google.com/spreadsheets/d/1gZN9S2rP5_U9zdxX1cJHBzBAl-Nup4PD4QXuW44rnSE/export?format=csv&gid=2037677849';
```

**변경이 필요한 경우만** 수동 수정하세요.

---

## 4️⃣ 검증

### Test 1: 앱 로딩
```
1. http://localhost:5000 접속
2. 로딩 화면 확인
3. 버전 확인: "v3.6.0 - Phase 0 Week 1"
```

**예상 결과:**
- ✅ 앱 정상 로딩
- ✅ 테이블 선택 가능
- ✅ 플레이어 목록 표시

### Test 2: 플레이어 추가
```
1. 테이블 선택: "Table 1"
2. 플레이어 이름: "테스트"
3. 좌석: "#1"
4. 칩: "10000"
5. "추가" 버튼 클릭
```

**예상 결과:**
- ✅ 피드백: "✅ 테스트 추가됨"
- ✅ Google Sheets Type 시트에 새 행 추가

### Test 3: 중복 플레이어 업데이트
```
1. 동일 테이블 + 동일 이름 다시 추가
2. 칩: "20000" (변경)
```

**예상 결과:**
- ✅ 피드백: "✅ 테스트 정보 업데이트 (칩: 20000, 좌석: #1)"
- ✅ Type 시트에 **새 행 추가 안 됨** (기존 행 업데이트만)

### Test 4: 핸드 로깅
```
1. 플레이어 3명 추가
2. "핸드 시작" 버튼
3. 각 플레이어 액션 기록
4. "핸드 저장"
```

**예상 결과:**
- ✅ Hand 시트에 데이터 저장
- ✅ Index 시트에 메타데이터 저장

---

## 5️⃣ 문제 해결

### ❌ "Failed to fetch" 에러
**원인:** 로컬 서버 미실행

**해결:**
```bash
python -m http.server 5000
```

### ❌ "Apps Script URL이 설정되지 않았습니다"
**원인:** Apps Script URL 미입력

**해결:**
1. ⚙️ 관리 → Apps Script URL 입력
2. 배포 URL 확인 (Apps Script 편집기에서)

### ❌ "플레이어 추가 중 오류 발생"
**원인:** Apps Script 권한 오류

**해결:**
1. Apps Script 편집기 → 배포 → 새 배포
2. "다음 사용자로 실행: **나**" 확인
3. "액세스 권한: **전체 사용자**" 확인

### ❌ "TypeError: window.googleSheetsAPI.setSpreadsheetId is not a function"
**원인:** 구버전 코드 사용 중

**해결:**
1. 브라우저 강제 새로고침 (Ctrl+Shift+R)
2. 캐시 삭제: F12 → Application → Clear storage
3. index.html 최신 버전 확인

### ❌ CORS 에러
**원인:** `file://` 프로토콜 사용

**해결:**
- ❌ `file:///c:/claude/virtual_data_claude/index.html`
- ✅ `http://localhost:5000`

로컬 서버 **필수** 사용!

---

## 📊 설정 체크리스트

### 필수 설정
- [ ] Google Sheets 접근 권한
- [ ] Apps Script 배포 완료
- [ ] Apps Script URL 복사
- [ ] 로컬 서버 실행 (port 5000)
- [ ] 브라우저에서 http://localhost:5000 접속
- [ ] Apps Script URL 설정 완료

### 선택 설정
- [ ] CSV URLs 커스터마이징
- [ ] 기본 테이블명 변경
- [ ] 기본 Poker Room 변경

---

## 🔗 관련 문서

- [ARCHITECTURE_DECISION.md](ARCHITECTURE_DECISION.md) - 아키텍처 선택 이유
- [ROOT_CAUSE_ANALYSIS.md](ROOT_CAUSE_ANALYSIS.md) - 문제 발견 과정
- [PHASE0_WEEK1_CHANGELOG.md](../PHASE0_WEEK1_CHANGELOG.md) - 최신 변경사항
- [PHASE0_WEEK1_TEST_CHECKLIST.md](../new_virtual_table/docs/PHASE0_WEEK1_TEST_CHECKLIST.md) - 상세 테스트

---

## 📞 지원

### 문제 신고
- GitHub Issues: https://github.com/garimto81/virtual_data_claude/issues

### 로그 확인
```
F12 → Console 탭
```

**정상 로그:**
```
✅ v3.6.0 - Phase 0 Week 1 초기화 시작
✅ Apps Script URL: https://script.google.com/...
✅ CSV 데이터 로드 완료
✅ 플레이어 추가/업데이트: {action: "added", ...}
```

**에러 로그:**
```
❌ 에러 메시지 확인
→ 위 "문제 해결" 섹션 참고
```

---

## ✅ 설정 완료 확인

**모든 항목이 ✅ 이면 설정 완료:**
- [ ] Apps Script 배포 완료
- [ ] Apps Script URL 설정 완료
- [ ] http://localhost:5000 접속 가능
- [ ] 플레이어 추가 성공
- [ ] 중복 플레이어 업데이트 성공
- [ ] 핸드 로깅 성공

**축하합니다! 🎉**
이제 Poker Hand Logger를 사용할 준비가 완료되었습니다.

---

**최종 업데이트:** 2025-10-05
**작성자:** Phase 0 구현팀
**버전:** 1.0
