# Google Sheets API 설정 가이드

## 1. Google Cloud Console 설정

### 서비스 계정 생성 단계:

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/ 접속
   - 새 프로젝트 생성: "VirtualDataPokerManager"

2. **API 활성화**
   - 왼쪽 메뉴 → "API 및 서비스" → "라이브러리"
   - "Google Sheets API" 검색 → 활성화
   - "Google Drive API" 검색 → 활성화 (시트 접근 권한용)

3. **서비스 계정 생성**
   - "API 및 서비스" → "사용자 인증 정보"
   - "사용자 인증 정보 만들기" → "서비스 계정"
   - 서비스 계정 이름: "virtual-data-poker-service"
   - 역할: "편집자"

4. **키 파일 생성**
   - 생성된 서비스 계정 클릭
   - "키" 탭 → "키 추가" → "새 키 만들기"
   - JSON 형식 선택
   - 다운로드된 파일을 `/credentials/google-service-account.json`으로 저장

5. **Google Sheets 공유**
   - 기존 Google Sheets 문서 열기
   - 공유 버튼 클릭
   - 서비스 계정 이메일 추가 (예: virtual-data-poker-service@project-id.iam.gserviceaccount.com)
   - 편집 권한 부여

## 2. 필요한 정보

프로젝트 진행을 위해 다음 정보가 필요합니다:

```javascript
// config/googleSheets.js
module.exports = {
  spreadsheetId: 'YOUR_SPREADSHEET_ID', // Google Sheets URL에서 추출
  serviceAccountEmail: 'YOUR_SERVICE_ACCOUNT_EMAIL',
  privateKey: 'YOUR_PRIVATE_KEY' // JSON 파일에서 추출
};
```

### Spreadsheet ID 찾는 방법:
- Google Sheets URL: https://docs.google.com/spreadsheets/d/**[SPREADSHEET_ID]**/edit
- 굵게 표시된 부분이 Spreadsheet ID입니다

## 3. 테스트 준비 사항

다음 정보를 준비해주세요:
- [ ] Google Sheets Spreadsheet ID
- [ ] 서비스 계정 JSON 키 파일
- [ ] Google Sheets에 서비스 계정 이메일 공유 완료

이 정보가 준비되면 즉시 연동 테스트를 시작할 수 있습니다.