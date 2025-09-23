const fs = require('fs');

function findExactError() {
  try {
    console.log('📄 HTML 파일 읽기 중...');
    const htmlContent = fs.readFileSync('C:/AI-tech/Claude-code-v2/virtual_data/index.html', 'utf8');

    // 메인 스크립트 블록 찾기 (가장 큰 스크립트 블록)
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

    // 가장 큰 스크립트 블록 찾기
    let mainScript = matches.reduce((largest, current) =>
      current.content.length > largest.content.length ? current : largest
    );

    console.log(`🎯 메인 스크립트 블록 발견 (${mainScript.content.length} 문자)`);

    const lines = mainScript.content.split('\n');
    console.log(`📊 총 ${lines.length} 라인 분석 중...`);

    // 각 라인을 추가하면서 "missing ) after argument list" 에러 찾기
    let errorLine = -1;

    for (let i = 0; i < lines.length; i++) {
      const cumulativeCode = lines.slice(0, i + 1).join('\n');

      try {
        // Function constructor로 문법 검사
        new Function(cumulativeCode);
      } catch (error) {
        if (error.message.includes('missing ) after argument list')) {
          errorLine = i;
          console.log(`\n❌ "missing ) after argument list" 에러 발견!`);
          console.log(`스크립트 내 라인: ${i + 1}`);
          console.log(`실제 HTML 라인: 계산 중...`);

          // HTML에서의 실제 라인 번호 계산
          const htmlBeforeScript = htmlContent.substring(0, mainScript.startIndex);
          const htmlLinesBeforeScript = htmlBeforeScript.split('\n');
          const actualHtmlLine = htmlLinesBeforeScript.length + i;

          console.log(`실제 HTML 라인: ${actualHtmlLine + 1}`);
          console.log(`문제 라인: "${lines[i]}"`);

          // 주변 라인 표시
          console.log('\n📍 주변 코드:');
          for (let j = Math.max(0, i - 3); j < Math.min(lines.length, i + 4); j++) {
            const prefix = j === i ? '>>> ' : '    ';
            const htmlLineNum = htmlLinesBeforeScript.length + j;
            console.log(`${prefix}${htmlLineNum + 1}: ${lines[j]}`);
          }

          // 에러 메시지 표시
          console.log(`\n💬 JavaScript 에러: ${error.message}`);

          // 이전 몇 라인의 코드도 확인 (괄호 매칭 문제일 수 있음)
          console.log('\n🔍 이전 라인들 분석:');
          for (let k = Math.max(0, i - 5); k <= i; k++) {
            const lineCode = lines[k];
            const openParens = (lineCode.match(/\(/g) || []).length;
            const closeParens = (lineCode.match(/\)/g) || []).length;
            const openBraces = (lineCode.match(/\{/g) || []).length;
            const closeBraces = (lineCode.match(/\}/g) || []).length;

            console.log(`라인 ${k + 1}: ( ${openParens} vs ) ${closeParens}, { ${openBraces} vs } ${closeBraces}`);
          }

          break;
        }
      }
    }

    if (errorLine === -1) {
      console.log('✅ "missing ) after argument list" 에러를 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error('❌ 처리 중 오류 발생:', error.message);
  }
}

findExactError();