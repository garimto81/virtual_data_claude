const fs = require('fs');

function findAllErrors() {
  try {
    console.log('📄 HTML 파일 읽기 중...');
    const htmlContent = fs.readFileSync('C:/AI-tech/Claude-code-v2/virtual_data/index.html', 'utf8');

    // 메인 스크립트 블록 찾기
    const scriptRegex = /<script[^>]*>([^]*?)<\/script>/g;
    let matches = [];
    let match;

    while ((match = scriptRegex.exec(htmlContent)) !== null) {
      matches.push({
        content: match[1],
        startIndex: match.index,
        fullMatch: match[0]
      });
    }

    // 가장 큰 스크립트 블록
    let mainScript = matches.reduce((largest, current) =>
      current.content.length > largest.content.length ? current : largest
    );

    console.log(`🎯 메인 스크립트 블록 발견 (${mainScript.content.length} 문자)`);

    const lines = mainScript.content.split('\n');
    console.log(`📊 총 ${lines.length} 라인 분석 중...`);

    // 모든 "missing ) after argument list" 에러 찾기
    let errors = [];
    let currentError = null;

    for (let i = 0; i < lines.length; i++) {
      const cumulativeCode = lines.slice(0, i + 1).join('\n');

      try {
        new Function(cumulativeCode);
        // 이전에 에러가 있었다면 이제 해결됨
        if (currentError) {
          currentError.endLine = i - 1;
          errors.push(currentError);
          currentError = null;
        }
      } catch (error) {
        if (error.message.includes('missing ) after argument list')) {
          if (!currentError) {
            // 새로운 에러 시작
            const htmlBeforeScript = htmlContent.substring(0, mainScript.startIndex);
            const htmlLinesBeforeScript = htmlBeforeScript.split('\n');
            const actualHtmlLine = htmlLinesBeforeScript.length + i;

            currentError = {
              scriptLine: i + 1,
              htmlLine: actualHtmlLine + 1,
              errorMessage: error.message,
              code: lines[i],
              startLine: i
            };

            console.log(`\n❌ 에러 발견: 스크립트 라인 ${i + 1}, HTML 라인 ${actualHtmlLine + 1}`);
            console.log(`문제 코드: "${lines[i]}"`);
          }
        }
      }
    }

    // 마지막 에러가 끝까지 계속되는 경우
    if (currentError) {
      currentError.endLine = lines.length - 1;
      errors.push(currentError);
    }

    console.log(`\n📊 총 ${errors.length}개의 "missing ) after argument list" 에러 발견`);

    errors.forEach((error, index) => {
      console.log(`\n🔍 에러 ${index + 1}:`);
      console.log(`  - 스크립트 라인: ${error.scriptLine}`);
      console.log(`  - HTML 라인: ${error.htmlLine}`);
      console.log(`  - 문제 코드: "${error.code}"`);
      console.log(`  - 에러 범위: 라인 ${error.startLine + 1}~${error.endLine + 1}`);

      // 주변 코드 표시
      console.log('  📍 주변 코드:');
      for (let j = Math.max(0, error.startLine - 2); j < Math.min(lines.length, error.startLine + 3); j++) {
        const prefix = j === error.startLine ? '  >>> ' : '      ';
        const htmlBeforeScript = htmlContent.substring(0, mainScript.startIndex);
        const htmlLinesBeforeScript = htmlBeforeScript.split('\n');
        const htmlLineNum = htmlLinesBeforeScript.length + j;
        console.log(`${prefix}${htmlLineNum + 1}: ${lines[j]}`);
      }
    });

  } catch (error) {
    console.error('❌ 처리 중 오류 발생:', error.message);
  }
}

findAllErrors();