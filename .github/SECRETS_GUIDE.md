# GitHub Secrets 설정 가이드

이 가이드는 Poker Trend 프로젝트에 필요한 GitHub Secrets 설정 방법을 설명합니다.

## 📋 필수 Secrets

### 1. YouTube Data API
```
YOUTUBE_API_KEY
```
- **용도**: YouTube 트렌드 데이터 수집
- **획득 방법**:
  1. [Google Cloud Console](https://console.cloud.google.com) 접속
  2. 새 프로젝트 생성 또는 기존 프로젝트 선택
  3. YouTube Data API v3 활성화
  4. 사용자 인증 정보 → API 키 생성
- **할당량**: 일일 10,000 유닛

### 2. Slack Webhook
```
SLACK_WEBHOOK_URL
```
- **용도**: 일일 트렌드 리포트 전송
- **획득 방법**:
  1. [Slack API](https://api.slack.com/apps) 접속
  2. Create New App → From scratch
  3. Incoming Webhooks 활성화
  4. Add New Webhook to Workspace
- **형식**: `https://hooks.slack.com/services/XXX/YYY/ZZZ`

### 3. OpenAI API
```
OPENAI_API_KEY
```
- **용도**: AI 스크립트 생성
- **획득 방법**:
  1. [OpenAI Platform](https://platform.openai.com) 가입
  2. API keys 메뉴에서 새 키 생성
  3. 사용량 제한 설정 권장
- **요금**: 사용량 기반 과금

### 4. Google Gemini API
```
GEMINI_API_KEY
```
- **용도**: 백업 AI 서비스
- **획득 방법**:
  1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
  2. Get API key 클릭
  3. 프로젝트 선택 후 생성

## 📋 선택적 Secrets

### 5. Twitter API
```
TWITTER_BEARER_TOKEN
```
- **용도**: Twitter 트렌드 모니터링
- **획득 방법**:
  1. [Twitter Developer Portal](https://developer.twitter.com) 가입
  2. 앱 생성 → Bearer Token 발급
- **제한**: 월 500,000 트윗 (Essential)

### 6. Reddit API
```
REDDIT_CLIENT_ID
REDDIT_CLIENT_SECRET
```
- **용도**: Reddit 포커 커뮤니티 모니터링
- **획득 방법**:
  1. [Reddit Apps](https://www.reddit.com/prefs/apps) 접속
  2. Create App → Script type 선택
  3. Client ID와 Secret 확인

### 7. TikTok API
```
TIKTOK_ACCESS_TOKEN
```
- **용도**: TikTok 트렌드 분석 및 업로드
- **획득 방법**: TikTok for Developers 신청 필요

### 8. Discord Webhook
```
DISCORD_WEBHOOK_URL
```
- **용도**: Discord 알림 (Slack 대안)
- **획득 방법**:
  1. Discord 서버 설정 → 연동 → 웹후크
  2. 새 웹후크 생성
  3. 웹후크 URL 복사

## 🔧 설정 방법

### GitHub Secrets 추가하기

1. **저장소 Settings 접속**
   ```
   https://github.com/garimto81/poker-trend/settings
   ```

2. **Secrets and variables → Actions 클릭**

3. **New repository secret 클릭**

4. **각 Secret 추가**
   - Name: 위의 Secret 이름 입력
   - Value: 실제 API 키 값 입력
   - Add secret 클릭

### 확인 방법
```bash
# GitHub CLI로 확인 (값은 표시되지 않음)
gh secret list

# Actions 워크플로우에서 확인
echo "YouTube API: ${{ secrets.YOUTUBE_API_KEY != '' && '✅' || '❌' }}"
```

## 🔒 보안 주의사항

### Do's ✅
- 각 서비스별로 별도 API 키 사용
- 최소 권한 원칙 적용
- 정기적으로 키 로테이션
- 사용량 제한 설정
- 접근 로그 모니터링

### Don'ts ❌
- 코드에 직접 API 키 하드코딩
- Public 저장소에 .env 파일 커밋
- 로그에 API 키 출력
- 클라이언트 사이드에서 API 키 사용
- 만료된 키 방치

## 📊 권장 설정

### API 사용량 제한
- YouTube API: 일일 5,000 유닛으로 제한
- OpenAI: 월 $10 제한 설정
- Twitter: Rate limit 모니터링

### 알림 설정
- API 사용량 80% 도달 시 알림
- 에러 발생 시 즉시 알림
- 일일 사용량 리포트

## 🚨 문제 해결

### Secret이 작동하지 않을 때
1. Secret 이름 오타 확인
2. 값에 불필요한 공백 확인
3. Actions 권한 설정 확인
4. 워크플로우 로그 확인

### API 제한 초과
1. 캐싱 구현
2. 요청 빈도 조절
3. 여러 API 키 로테이션
4. 유료 플랜 업그레이드

## 📚 참고 자료

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [YouTube API Quota](https://developers.google.com/youtube/v3/getting-started#quota)
- [OpenAI Pricing](https://openai.com/pricing)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)

---

**보안 관련 문의**: GitHub Issues에 민감한 정보 없이 문의해주세요.