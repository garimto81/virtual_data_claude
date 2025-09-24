# 🚀 포커 핸드 로거 v35 - 서버 실행 가이드

## ⚠️ 중요: CORS 문제 해결

브라우저에서 `file://` 프로토콜로 직접 HTML 파일을 열면 CORS(Cross-Origin Resource Sharing) 오류가 발생합니다.
반드시 로컬 웹 서버를 통해 실행해야 합니다.

## 📋 실행 방법

### 방법 1: Windows (배치 파일)
```cmd
start-server.bat
```
더블클릭하거나 명령 프롬프트에서 실행

### 방법 2: Mac/Linux (쉘 스크립트)
```bash
chmod +x start-server.sh
./start-server.sh
```

### 방법 3: Python 직접 실행
```bash
# Python 3
python -m http.server 8000

# Python 2 (구버전)
python -m SimpleHTTPServer 8000
```

### 방법 4: Node.js 사용 (npm 필요)
```bash
# 의존성 설치 (최초 1회)
npm install

# 서버 실행 (선택)
npm start       # http-server 사용
npm run dev     # live-server 사용 (자동 새로고침)
```

### 방법 5: VS Code Live Server
1. VS Code에서 `Live Server` 확장 설치
2. `index.html` 파일 우클릭
3. `Open with Live Server` 선택

## 🌐 접속 방법

서버 실행 후 브라우저에서:
```
http://localhost:8000
```

또는 대시보드 직접 접속:
```
http://localhost:8000/pages/dashboard.html
```

## ✅ 정상 작동 확인

브라우저 개발자 콘솔(F12)에서 다음과 같은 로그가 표시되면 정상:

```
========================================
📊 대시보드 페이지 로드 시작
========================================
⏰ 시작 시간: 2025-08-28T...
🔧 [INIT] 대시보드 초기화 시작...
  └─ Chart.js 로드 상태 확인 중...
  ✓ Chart.js 로드 확인 완료
📡 [DATA] 대시보드 데이터 로딩 시작...
```

## 🔧 문제 해결

### Python이 설치되어 있지 않은 경우
- [Python 다운로드](https://www.python.org/downloads/)
- 설치 시 "Add Python to PATH" 체크

### 포트 8000이 이미 사용 중인 경우
다른 포트로 변경:
```bash
python -m http.server 8080
```
접속: http://localhost:8080

### CORS 오류가 계속 발생하는 경우
- 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
- 시크릿/프라이빗 모드로 실행
- 서버가 정상적으로 실행 중인지 확인

## 📱 모바일 테스트

같은 네트워크에서 모바일 접속:
1. PC의 IP 주소 확인
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`
2. 모바일 브라우저에서 접속:
   ```
   http://[PC_IP_주소]:8000
   ```

## 🛑 서버 중지

- Windows: Ctrl + C
- Mac/Linux: Ctrl + C
- 또는 터미널/명령 프롬프트 창 닫기

---

문제가 있으면 GitHub Issues에 보고해주세요:
https://github.com/garimto81/virtual_data_claude/issues