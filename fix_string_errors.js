const fs = require('fs');

function fixStringErrors() {
    const filePath = 'C:\\claude02\\virtual_data_claude\\index.html';
    let content = fs.readFileSync(filePath, 'utf8');
    
    console.log('🔧 JavaScript 문자열 에러 수정 중...');
    
    // 문제가 되는 패턴들을 찾아서 수정
    const fixes = [
        // alert 함수의 잘못된 문자열들
        {
            pattern: /alert\('([^']*)\n([^']*?)'\)/gs,
            replacement: (match, p1, p2) => `alert('${p1}\\n${p2.trim()}')`
        },
        
        // confirm 함수의 잘못된 문자열들 
        {
            pattern: /confirm\(\s*'([^']*)\n([^']*?)'\s*\+\s*\n\s*'([^']*)\n([^']*?)'\s*\+\s*\n\s*'([^']*)\n([^']*?)'\s*\)/gs,
            replacement: (match, p1, p2, p3, p4, p5, p6) => {
                return `confirm('${p1.trim()}\\n\\n${p3.trim()}\\n${p5.trim()}')`
            }
        },
        
        // 일반적인 여러 줄 문자열 패턴
        {
            pattern: /'([^']*)\n([^']*?)'\s*\+/g,
            replacement: "'$1\\n$2' +"
        },
        
        // 끝나지 않은 문자열 패턴들
        {
            pattern: /'([^']*)\n\s*'\s*\+/g,
            replacement: "'$1\\n' +"
        }
    ];
    
    let fixCount = 0;
    
    for (let i = 0; i < fixes.length; i++) {
        const { pattern, replacement } = fixes[i];
        const before = content;
        
        if (typeof replacement === 'function') {
            content = content.replace(pattern, replacement);
        } else {
            content = content.replace(pattern, replacement);
        }
        
        if (content !== before) {
            const matches = (before.match(pattern) || []).length;
            fixCount += matches;
            console.log(`✅ 패턴 ${i + 1}: ${matches}개 수정`);
        }
    }
    
    // 특정 문제 구문들을 직접 수정
    const specificFixes = [
        {
            search: "'✅ 중복 검사 완료",
            replace: "'✅ 중복 검사 완료'"
        },
        {
            search: "'🚨 에러 발생:",
            replace: "'🚨 에러 발생:'"
        },
        {
            search: "'⚠️ 경고:",
            replace: "'⚠️ 경고:'"
        }
    ];
    
    for (const fix of specificFixes) {
        if (content.includes(fix.search) && !content.includes(fix.replace)) {
            content = content.replace(new RegExp(fix.search, 'g'), fix.replace);
            fixCount++;
            console.log(`✅ 직접 수정: ${fix.search} -> ${fix.replace}`);
        }
    }
    
    // 수정된 내용을 파일에 저장
    fs.writeFileSync(filePath, content);
    
    console.log(`\n🎉 총 ${fixCount}개의 문자열 에러를 수정했습니다.`);
    
    // 구문 검사 실행
    console.log('\n🔍 수정 후 구문 검사...');
    
    try {
        // 인라인 스크립트 다시 추출
        const scriptStart = content.indexOf('  <script>');
        const scriptEnd = content.indexOf('  </script>', scriptStart);
        
        if (scriptStart !== -1 && scriptEnd !== -1) {
            const scriptContent = content.substring(scriptStart + '  <script>'.length, scriptEnd);
            
            try {
                new Function(scriptContent);
                console.log('✅ 구문 검사 성공! 모든 에러가 수정되었습니다.');
                return true;
            } catch (error) {
                console.log('❌ 아직 에러가 남아있습니다:');
                console.log(`에러: ${error.message}`);
                return false;
            }
        }
    } catch (error) {
        console.log('❌ 구문 검사 실행 중 에러:', error.message);
        return false;
    }
}

fixStringErrors();