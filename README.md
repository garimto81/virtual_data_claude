# 포커 핸드 로거 v35 - Enhanced Edition

## 📌 프로젝트 개요

포커 핸드 로거는 온라인 포커 게임을 기록하고 분석하는 웹 애플리케이션입니다. 
Google Sheets와 연동하여 게임 데이터를 자동으로 저장하고 관리할 수 있습니다.

### 주요 개선사항 (v35)
- ✅ **모듈화된 아키텍처**: 코드를 논리적 모듈로 분리
- ✅ **이벤트 기반 시스템**: EventBus를 통한 느슨한 결합
- ✅ **상태 관리 패턴**: 중앙집중식 상태 관리
- ✅ **보안 강화**: XSS 방지 및 입력 검증
- ✅ **성능 최적화**: 디바운싱, 쓰로틀링, 가상 DOM 렌더링
- ✅ **사용자 경험 개선**: 토스트 알림, 자동 저장, 키보드 단축키

## 🚀 시작하기

### 사전 요구사항
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)
- Google 계정 (Sheets 연동용)
- 인터넷 연결

### 설치
```bash
# 저장소 클론
git clone https://github.com/garimto81/virtual_data_claude.git

# 디렉토리 이동
cd virtual_data_claude

# 웹 서버 실행 (예: Python)
python -m http.server 8000

# 브라우저에서 열기
# http://localhost:8000
```

## 📁 프로젝트 구조

```
virtual_data_claude/
├── index.html              # 메인 HTML 파일
├── css/
│   └── styles.css         # 커스텀 스타일시트
├── js/
│   ├── app.js            # 메인 애플리케이션
│   ├── core/             # 핵심 모듈
│   │   ├── StateManager.js
│   │   ├── EventBus.js
│   │   └── UIController.js
│   ├── services/         # 서비스 레이어
│   │   ├── DataService.js
│   │   └── StorageService.js
│   ├── components/       # UI 컴포넌트
│   ├── utils/           # 유틸리티
│   │   ├── Logger.js
│   │   └── Toast.js
│   └── config/          # 설정
│       └── config.js
├── manifest.json        # PWA 매니페스트
└── README.md           # 프로젝트 문서
```

## 🎮 사용법

### 기본 워크플로우
1. **테이블 선택**: 드롭다운에서 포커 테이블 선택
2. **플레이어 추가**: 참여 플레이어 선택
3. **카드 입력**: 보드 카드와 플레이어 핸드 입력
4. **액션 기록**: 각 스트리트별 베팅 액션 기록
5. **역할 지정**: 승자/패자 지정
6. **데이터 전송**: Google Sheets로 자동 전송

### 키보드 단축키
- `Ctrl+S`: 로컬 저장
- `Ctrl+N`: 새 핸드 시작
- `Ctrl+R`: 데이터 새로고침
- `Ctrl+Z`: 실행 취소
- `Ctrl+Y`: 다시 실행

## ⚙️ Google Apps Script 설정

### 1. 새 스프레드시트 생성
- Google Sheets에서 새 스프레드시트 생성
- "Type" 시트와 "Hand" 시트 추가

### 2. Apps Script 배포
```javascript
// Apps Script 코드는 /docs/apps-script.js 참조
```

### 3. 배포 설정
- 배포 → 새 배포
- 유형: 웹 앱
- 실행: 나
- 액세스: 모든 사용자
- 배포 URL 복사

### 4. 애플리케이션에 URL 설정
- 설정 메뉴에서 Apps Script URL 입력
- 또는 config.js 파일 수정

## 🔧 설정

### config.js
```javascript
export const Config = {
    appsScriptUrl: 'YOUR_APPS_SCRIPT_URL',
    autoSaveInterval: 2000,
    maxHistorySize: 50,
    defaultTimezone: 'Asia/Seoul'
};
```

## 📊 데이터 형식

### Player 데이터
```javascript
{
    name: "PlayerName",
    chips: "10000",
    hand: ["As", "Kh"],
    role: "winner" | "loser" | null
}
```

### Action 데이터
```javascript
{
    player: "PlayerName",
    action: "Bets" | "Calls" | "Raises" | "Folds" | "Checks",
    amount: "1000",
    timestamp: "2025-01-28T12:00:00.000Z"
}
```

## 🛡️ 보안

- XSS 방지: 모든 사용자 입력 검증 및 이스케이프
- CORS 처리: Google Apps Script JSONP 지원
- 로컬 스토리지 암호화 (선택사항)
- API 키 환경변수 관리

## 🐛 문제 해결

### CORS 오류
- Apps Script 배포 설정 확인
- 액세스 권한이 "모든 사용자"로 설정되었는지 확인

### 데이터 전송 실패
- 네트워크 연결 확인
- Apps Script URL 유효성 확인
- 브라우저 콘솔에서 오류 메시지 확인

## 📝 라이센스

MIT License - 자유롭게 사용, 수정, 배포 가능

## 👥 기여

Pull Request와 Issue는 언제든 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

- GitHub: [@garimto81](https://github.com/garimto81)
- 프로젝트 링크: [https://github.com/garimto81/virtual_data_claude](https://github.com/garimto81/virtual_data_claude)

---

**v35** - Enhanced Edition | 2025년 1월 개발