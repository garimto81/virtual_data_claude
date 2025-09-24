const fs = require('fs');
const path = require('path');

// HTML 파일에서 script 태그 추출
function extractScriptTags(htmlContent) {
    const scriptRegex = /<script[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
    const inlineScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    
    const externalScripts = [];
    const inlineScripts = [];
    
    let match;
    
    // 외부 스크립트 추출
    while ((match = scriptRegex.exec(htmlContent)) !== null) {
        externalScripts.push(match[1]);
    }
    
    // 인라인 스크립트 추출
    while ((match = inlineScriptRegex.exec(htmlContent)) !== null) {
        if (match[1].trim()) {
            inlineScripts.push(match[1]);
        }
    }
    
    return { externalScripts, inlineScripts };
}

// JavaScript 구문 검사
function checkJavaScriptSyntax(code, filename) {
    try {
        // Node.js에서 구문 검사 (실행하지 않고)
        new Function(code);
        return null;
    } catch (error) {
        return {
            file: filename,
            error: error.message,
            line: error.lineNumber || 'unknown'
        };
    }
}

async function findJavaScriptErrors() {
    const basePath = 'C:\\claude02\\virtual_data_claude';
    const htmlPath = path.join(basePath, 'index.html');
    
    try {
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        const { externalScripts, inlineScripts } = extractScriptTags(htmlContent);
        
        console.log('🔍 JavaScript 에러 검사 시작...\n');
        
        const errors = [];
        
        // 외부 스크립트 파일 검사
        console.log('📂 외부 스크립트 파일 검사:');
        for (const scriptSrc of externalScripts) {
            // 쿼리 파라미터 제거
            const cleanSrc = scriptSrc.split('?')[0];
            const fullPath = path.resolve(basePath, cleanSrc);
            
            console.log(`  - ${scriptSrc}`);
            
            try {
                if (fs.existsSync(fullPath)) {
                    const scriptContent = fs.readFileSync(fullPath, 'utf8');
                    const error = checkJavaScriptSyntax(scriptContent, scriptSrc);
                    if (error) {
                        errors.push(error);
                        console.log(`    ❌ 구문 에러 발견: ${error.error}`);
                    } else {
                        console.log(`    ✅ 구문 OK`);
                    }
                } else {
                    console.log(`    ⚠️ 파일 없음: ${fullPath}`);
                    errors.push({
                        file: scriptSrc,
                        error: 'File not found',
                        line: 0
                    });
                }
            } catch (e) {
                console.log(`    ❌ 읽기 실패: ${e.message}`);
            }
        }
        
        // 인라인 스크립트 검사
        console.log('\n📄 인라인 스크립트 검사:');
        inlineScripts.forEach((script, index) => {
            console.log(`  - 인라인 스크립트 #${index + 1}`);
            const error = checkJavaScriptSyntax(script, `inline-script-${index + 1}`);
            if (error) {
                errors.push(error);
                console.log(`    ❌ 구문 에러 발견: ${error.error}`);
                // 에러 주변 코드 표시
                const lines = script.split('\n');
                const errorLineNum = parseInt(error.line) || 1;
                console.log(`    📍 에러 위치 (추정 ${errorLineNum}번째 줄):`);
                console.log(`    ${lines[errorLineNum - 1] || lines[0]}`);
            } else {
                console.log(`    ✅ 구문 OK`);
            }
        });
        
        // 결과 요약
        console.log('\n' + '='.repeat(50));
        console.log(`📊 검사 결과: ${errors.length}개의 에러 발견`);
        
        if (errors.length > 0) {
            console.log('\n🚨 발견된 에러들:');
            errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.file}`);
                console.log(`   에러: ${error.error}`);
                console.log(`   위치: ${error.line}번째 줄`);
                console.log('');
            });
        } else {
            console.log('✅ 모든 JavaScript 파일에 구문 에러가 없습니다.');
        }
        
    } catch (error) {
        console.error('❌ 검사 중 에러 발생:', error.message);
    }
}

findJavaScriptErrors();