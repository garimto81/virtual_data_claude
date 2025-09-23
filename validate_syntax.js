const fs = require('fs');
const { Worker } = require('worker_threads');

// HTML 파일에서 JavaScript 코드만 추출하는 함수
function extractJavaScript(htmlContent) {
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  const scripts = [];

  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    // src 속성이 없는 인라인 스크립트만 추출
    const openTag = match[0].substring(0, match[0].indexOf('>') + 1);
    if (!openTag.includes('src=')) {
      scripts.push({
        content: match[1],
        fullMatch: match[0]
      });
    }
  }

  return scripts;
}

// 문법 검사를 위한 함수
function validateSyntax(jsCode, scriptIndex) {
  try {
    // Function constructor로 문법 검사
    new Function(jsCode);
    console.log(`✅ Script ${scriptIndex}: 문법 오류 없음`);
    return true;
  } catch (error) {
    console.log(`❌ Script ${scriptIndex}: ${error.message}`);

    // 에러 위치 추정
    if (error.message.includes('line')) {
      const lines = jsCode.split('\n');
      const errorLine = parseInt(error.message.match(/line (\d+)/)?.[1]) || 0;

      if (errorLine > 0 && errorLine <= lines.length) {
        console.log(`   문제 라인 ${errorLine}: ${lines[errorLine - 1].trim()}`);

        // 주변 라인도 표시
        for (let i = Math.max(0, errorLine - 3); i < Math.min(lines.length, errorLine + 2); i++) {
          const prefix = i === errorLine - 1 ? '>>> ' : '    ';
          console.log(`   ${prefix}${i + 1}: ${lines[i]}`);
        }
      }
    }

    return false;
  }
}

async function main() {
  try {
    console.log('📄 HTML 파일 읽기 중...');
    const htmlContent = fs.readFileSync('C:/AI-tech/Claude-code-v2/virtual_data/index.html', 'utf8');

    console.log('🔍 JavaScript 코드 추출 중...');
    const scripts = extractJavaScript(htmlContent);

    console.log(`📊 총 ${scripts.length}개의 인라인 스크립트 발견`);

    let hasError = false;
    scripts.forEach((script, index) => {
      console.log(`\n🧪 Script ${index + 1} 검사 중... (길이: ${script.content.length} 문자)`);

      if (!validateSyntax(script.content, index + 1)) {
        hasError = true;
      }
    });

    if (hasError) {
      console.log('\n❌ JavaScript 문법 에러가 발견되었습니다.');
    } else {
      console.log('\n✅ 모든 JavaScript 코드의 문법이 올바릅니다.');
    }

  } catch (error) {
    console.error('❌ 파일 읽기 실패:', error.message);
  }
}

main();