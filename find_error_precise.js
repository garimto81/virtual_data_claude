const fs = require('fs');

function findPreciseError() {
  try {
    console.log('📄 HTML 파일 읽기 중...');
    const htmlContent = fs.readFileSync('C:/AI-tech/Claude-code-v2/virtual_data/index.html', 'utf8');

    // 모든 스크립트 블록 추출
    const scriptRegex = /<script[^>]*>([^]*?)<\/script>/g;
    let match;
    let scriptIndex = 0;

    while ((match = scriptRegex.exec(htmlContent)) !== null) {
      const jsCode = match[1];
      const scriptStart = match.index;
      const htmlLines = htmlContent.substring(0, scriptStart).split('\n');
      const startLineNumber = htmlLines.length;

      console.log(`\n🔍 Script ${scriptIndex + 1} 검사 중... (시작 라인: ${startLineNumber})`);

      try {
        // Function constructor로 문법 검사
        new Function(jsCode);
        console.log(`✅ Script ${scriptIndex + 1}: 문법 오류 없음`);

      } catch (error) {
        console.log(`❌ Script ${scriptIndex + 1}: ${error.message}`);

        // 에러가 있는 스크립트에 대해 이진 탐색으로 정확한 위치 찾기
        if (error.message.includes('missing ) after argument list')) {
          console.log('🎯 "missing ) after argument list" 에러 위치 탐색 중...');

          const lines = jsCode.split('\n');
          console.log(`총 ${lines.length}개 라인 중 문제 라인 찾는 중...`);

          // 각 라인을 점진적으로 추가하면서 에러 발생 지점 찾기
          for (let i = 0; i < lines.length; i++) {
            const testCode = lines.slice(0, i + 1).join('\n');

            try {
              new Function(testCode);
            } catch (testError) {
              if (testError.message.includes('missing ) after argument list')) {
                const actualLineNum = startLineNumber + i;
                console.log(`\n🎯 문제 라인 발견: ${actualLineNum + 1}`);
                console.log(`문제 코드: ${lines[i]}`);

                // 주변 5라인 표시
                console.log('\n📍 주변 코드:');
                for (let j = Math.max(0, i - 5); j < Math.min(lines.length, i + 6); j++) {
                  const prefix = j === i ? '>>> ' : '    ';
                  const htmlLineNum = startLineNumber + j;
                  console.log(`${prefix}${htmlLineNum + 1}: ${lines[j]}`);
                }

                return;
              }
            }
          }
        }
      }

      scriptIndex++;
    }

  } catch (error) {
    console.error('❌ 처리 중 오류 발생:', error.message);
  }
}

findPreciseError();