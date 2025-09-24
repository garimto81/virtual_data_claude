#!/bin/bash

echo "========================================"
echo "포커 핸드 로거 v35 - 로컬 서버 시작"
echo "========================================"
echo ""

# Python이 설치되어 있는지 확인
if ! command -v python3 &> /dev/null
then
    echo "[오류] Python3가 설치되어 있지 않습니다."
    echo "Python3를 먼저 설치해주세요: https://www.python.org/"
    exit 1
fi

echo "[정보] Python 서버를 시작합니다..."
echo "[정보] 브라우저에서 http://localhost:8000 으로 접속하세요"
echo ""
echo "서버를 중지하려면 Ctrl+C를 누르세요"
echo "========================================"
echo ""

# Python 3 HTTP 서버 시작
python3 -m http.server 8000