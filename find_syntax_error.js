const fs = require('fs');

function findSyntaxError() {
  try {
    console.log('📄 HTML 파일 읽기 중...');
    const htmlContent = fs.readFileSync('C:/AI-tech/Claude-code-v2/virtual_data/index.html', 'utf8');

    // 메인 스크립트 블록 추출 (라인 765-8147 사이)
    const scriptMatch = htmlContent.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (!scriptMatch) {
      console.log('❌ 스크립트 블록을 찾을 수 없습니다.');
      return;
    }

    const jsCode = scriptMatch[1];
    const lines = jsCode.split('\n');

    console.log(`📊 총 ${lines.length}개 라인의 JavaScript 코드 검사 중...`);

    // 이진 탐색으로 에러 위치 찾기
    let start = 0;
    let end = lines.length;
    let errorLine = -1;

    while (start < end) {
      const mid = Math.floor((start + end) / 2);
      const testCode = lines.slice(0, mid + 1).join('\n');

      try {
        new Function(testCode);
        // 이 부분까지는 문법 에러 없음
        start = mid + 1;
      } catch (error) {
        // 이 부분에 에러 있음
        if (mid === start) {
          errorLine = mid;
          break;
        }
        end = mid;
      }
    }

    if (errorLine !== -1) {
      console.log(`\n❌ 문법 에러 발견: 라인 ${errorLine + 1}`);
      console.log(`문제 라인: ${lines[errorLine]}`);

      // 주변 라인 표시 (실제 HTML 파일 라인 번호로 표시)
      const htmlLines = htmlContent.split('\n');
      const scriptStartLine = htmlContent.substring(0, scriptMatch.index).split('\n').length;
      const actualLineNum = scriptStartLine + errorLine;

      console.log(`\n📍 HTML 파일 기준 라인 번호: ${actualLineNum + 1}`);
      console.log('🔍 주변 코드:');

      for (let i = Math.max(0, errorLine - 3); i < Math.min(lines.length, errorLine + 4); i++) {
        const prefix = i === errorLine ? '>>> ' : '    ';
        const htmlLineNum = scriptStartLine + i;
        console.log(`${prefix}${htmlLineNum + 1}: ${lines[i]}`);
      }

      // 구체적인 문법 에러 메시지
      try {
        new Function(lines.slice(0, errorLine + 1).join('\n'));
      } catch (error) {
        console.log(`\n💬 에러 메시지: ${error.message}`);
      }
    } else {
      console.log('✅ 문법 에러를 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error('❌ 처리 중 오류 발생:', error.message);
  }
}

findSyntaxError();