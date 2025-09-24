const fs = require('fs');

// index.html에서 인라인 스크립트 추출
function extractInlineScript() {
    const htmlContent = fs.readFileSync('C:\\claude02\\virtual_data_claude\\index.html', 'utf8');
    
    // <script> 태그 찾기 (첫 번째 인라인 스크립트)
    const scriptStart = htmlContent.indexOf('  <script>');
    const scriptEnd = htmlContent.indexOf('  </script>', scriptStart);
    
    if (scriptStart === -1 || scriptEnd === -1) {
        console.log('인라인 스크립트를 찾을 수 없습니다.');
        return;
    }
    
    // script 태그 내용만 추출 (태그 제외)
    const scriptStartPos = scriptStart + '  <script>'.length;
    const scriptContent = htmlContent.substring(scriptStartPos, scriptEnd);
    
    console.log(`스크립트 시작 위치: ${scriptStart}`);
    console.log(`스크립트 끝 위치: ${scriptEnd}`);
    console.log(`스크립트 길이: ${scriptContent.length} 문자`);
    
    // 추출된 스크립트를 파일로 저장
    fs.writeFileSync('C:\\claude02\\virtual_data_claude\\extracted_script.js', scriptContent);
    console.log('스크립트를 extracted_script.js로 저장했습니다.');
    
    // Node.js로 구문 검사
    try {
        new Function(scriptContent);
        console.log('✅ 구문 검사 통과');
    } catch (error) {
        console.log('❌ 구문 에러 발견:');
        console.log(`에러: ${error.message}`);
        
        // 에러 위치 찾기
        if (error.stack) {
            console.log(`스택: ${error.stack}`);
        }
        
        // 에러가 발생한 라인 추정
        const lines = scriptContent.split('\n');
        console.log(`총 라인 수: ${lines.length}`);
        
        // 에러 메시지에서 라인 번호 추출 시도
        const lineMatch = error.stack?.match(/(\d+):(\d+)/);
        if (lineMatch) {
            const lineNum = parseInt(lineMatch[1]);
            const colNum = parseInt(lineMatch[2]);
            console.log(`\n🎯 에러 위치: ${lineNum}번째 줄, ${colNum}번째 문자`);
            
            if (lines[lineNum - 1]) {
                console.log(`문제가 있는 줄: ${lines[lineNum - 1]}`);
            }
            
            // 주변 코드도 표시
            for (let i = Math.max(0, lineNum - 3); i < Math.min(lines.length, lineNum + 2); i++) {
                const marker = (i === lineNum - 1) ? '>>> ' : '    ';
                console.log(`${marker}${i + 1}: ${lines[i]}`);
            }
        }
    }
}

extractInlineScript();