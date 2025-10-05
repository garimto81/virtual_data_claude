# 포커 트렌드 분석 자동 스케줄러 가이드

## 📅 스케줄링 정보

### 🗓️ 월간 리포트
- **실행 시간**: 매월 첫째주 월요일 오후 2시 (한국시간)
- **분석 기간**: 지난 달 (30일)
- **사용 분석기**: `enhanced_validated_analyzer.py`
- **특징**: 가장 정밀한 검증 및 상세 분석

### 📅 주간 리포트  
- **실행 시간**: 매주 월요일 오전 11시 (한국시간)
- **분석 기간**: 지난 주 (7일)
- **사용 분석기**: `validated_analyzer_with_translation.py`
- **특징**: 영상 검증 + 한글 번역 통합

### 📋 일간 리포트
- **실행 시간**: 평일(화-금) 오전 10시 (한국시간)
- **분석 기간**: 오늘 (1일)
- **사용 분석기**: `quick_validated_analyzer.py`
- **특징**: 빠른 검증 및 실시간 분석

## 🔧 GitHub Secrets 설정 필요

다음 secrets를 GitHub 저장소에 설정해야 합니다:

```
YOUTUBE_API_KEY=your_youtube_api_key
GEMINI_API_KEY=your_gemini_api_key
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

## 🚀 수동 실행

GitHub Actions 탭에서 "포커 트렌드 분석 자동 스케줄러" 워크플로우를 수동으로 실행할 수 있습니다:

- **daily**: 일간 분석
- **weekly**: 주간 분석  
- **monthly**: 월간 분석

## 📊 스케줄 상세 정보

### Cron 표현식
```yaml
# 매월 첫째주 월요일 오후 2시 (KST) = UTC 05:00
- cron: '0 5 1-7 * 1'

# 매주 월요일 오전 11시 (KST) = UTC 02:00  
- cron: '0 2 * * 1'

# 평일 오전 10시 (KST) = UTC 01:00
- cron: '0 1 * * 2-6'
```

### 시간대 변환
- **한국시간 (KST)** = UTC + 9시간
- 모든 cron은 UTC 기준으로 설정됨

## 🎯 분석기별 특징

| 분석기 | 속도 | 정확도 | 번역 | 검증 레벨 |
|--------|------|--------|------|-----------|
| `quick_validated_analyzer.py` | ⚡ 빠름 | 🎯 높음 | ✅ 포함 | 기본 |
| `validated_analyzer_with_translation.py` | 🔄 보통 | 🎯 높음 | ✅ 포함 | 강화 |
| `enhanced_validated_analyzer.py` | 🐌 느림 | 🎯 최고 | ✅ 포함 | 최고 |

## 📁 결과 파일

분석 결과는 다음 위치에 저장됩니다:
- `backend/data-collector/scripts/reports/`
- GitHub Actions 아티팩트로 30일간 보관

## 🔔 알림 시스템

- **성공시**: 분석 결과가 Slack 채널로 자동 전송
- **실패시**: 오류 알림이 Slack으로 전송
- **포함 정보**: 실행 시간, 리포트 타입, GitHub Actions 링크

## 🛠️ 트러블슈팅

### 일반적인 문제들

1. **API 할당량 초과**:
   - YouTube API: 일일 10,000 쿼터
   - Gemini API: 분당 요청 제한 확인

2. **시간대 문제**:
   - 모든 로그는 KST 기준으로 표시
   - cron은 UTC 기준으로 설정

3. **Slack 알림 실패**:
   - SLACK_WEBHOOK_URL 확인
   - 채널 권한 확인

### 로그 확인 방법

1. GitHub → Actions 탭
2. "포커 트렌드 분석 자동 스케줄러" 클릭
3. 해당 실행 로그 확인

## 📈 최적화 팁

- **월간**: 정밀한 분석이 필요하므로 시간이 오래 걸림
- **주간**: 균형잡힌 속도와 정확도
- **일간**: 빠른 실행으로 실시간성 확보

---

## 🎯 요약

이 스케줄러는 포커 트렌드를 지속적으로 모니터링하여:
- 📊 **데이터 수집**: YouTube API 기반
- 🔍 **영상 검증**: 재생 가능 여부 확인  
- 🌐 **다국어 지원**: 원본 언어 보존 + 한글 번역
- 🤖 **AI 분석**: Gemini AI 트렌드 인사이트
- 📱 **자동 알림**: Slack 통합

**완전 자동화된 포커 트렌드 분석 시스템**입니다! 🚀