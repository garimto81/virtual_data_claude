const { chromium } = require('playwright');

async function runTest() {
    console.log('🚀 Virtual Data Claude Phase 4 테스트 시작...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000 
    });
    
    try {
        const page = await browser.newPage();
        
        // 콘솔 메시지 수집
        const consoleMessages = [];
        const jsErrors = [];
        
        page.on('console', msg => {
            const message = {
                type: msg.type(),
                text: msg.text(),
                timestamp: new Date().toISOString()
            };
            consoleMessages.push(message);
            console.log(`[브라우저 ${message.type.toUpperCase()}] ${message.text}`);
        });
        
        page.on('pageerror', error => {
            jsErrors.push({
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            console.error('❌ JavaScript 에러:', error.message);
        });
        
        // 페이지 로드
        console.log('📄 페이지 로딩 중...');
        await page.goto('http://localhost:8080', { 
            waitUntil: 'networkidle',
            timeout: 30000
        });
        
        console.log('✅ 페이지 로드 완료');
        
        // 페이지 제목 확인
        const title = await page.title();
        console.log(`📋 페이지 제목: "${title}"`);
        
        // 3초 대기 후 JavaScript 실행 상태 확인
        console.log('⏰ JavaScript 실행 완료 대기 중 (3초)...');
        await page.waitForTimeout(3000);
        
        // DOM 요소 확인
        const bodyExists = await page.$('body') !== null;
        console.log(`📍 Body 요소 존재: ${bodyExists ? '✅' : '❌'}`);
        
        // 전역 변수 및 함수 확인
        const globals = await page.evaluate(() => {
            const results = {};
            
            // 기본 전역 객체 확인
            results.window = typeof window !== 'undefined';
            results.document = typeof document !== 'undefined';
            results.console = typeof console !== 'undefined';
            
            // Phase 4 관련 가능한 전역 함수들
            const possibleFunctions = [
                'initializeApp',
                'loadHandHistory',
                'setupEventListeners',
                'validateConfiguration',
                'actionManager',
                'handManager',
                'dataManager'
            ];
            
            possibleFunctions.forEach(funcName => {
                results[funcName] = typeof window[funcName] !== 'undefined';
            });
            
            return results;
        });
        
        console.log('\n🔍 전역 객체/함수 접근성:');
        Object.entries(globals).forEach(([name, exists]) => {
            console.log(`  ${name}: ${exists ? '✅' : '❌'}`);
        });
        
        // 스크립트 태그 확인
        const scripts = await page.$$eval('script', scripts => 
            scripts.map(script => ({
                src: script.src || null,
                hasContent: !!script.textContent,
                contentLength: script.textContent ? script.textContent.length : 0
            }))
        );
        
        console.log('\n📜 스크립트 태그 분석:');
        scripts.forEach((script, index) => {
            if (script.src) {
                console.log(`  ${index + 1}. 외부 스크립트: ${script.src}`);
            } else if (script.hasContent) {
                console.log(`  ${index + 1}. 인라인 스크립트: ${script.contentLength} 문자`);
            }
        });
        
        // 최종 대기 및 결과 정리
        await page.waitForTimeout(2000);
        
        console.log('\n📊 테스트 결과 요약:');
        console.log(`  📋 페이지 제목: "${title}"`);
        console.log(`  💬 콘솔 메시지: ${consoleMessages.length}개`);
        console.log(`  ❌ 콘솔 에러: ${consoleMessages.filter(m => m.type === 'error').length}개`);
        console.log(`  🔥 JavaScript 런타임 에러: ${jsErrors.length}개`);
        console.log(`  📜 스크립트 태그: ${scripts.length}개`);
        
        // 에러 상세 출력
        if (jsErrors.length > 0) {
            console.log('\n🔍 JavaScript 런타임 에러 상세:');
            jsErrors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.message}`);
                if (error.stack) {
                    console.log(`     스택: ${error.stack.split('\n')[1] || 'N/A'}`);
                }
            });
        }
        
        const consoleErrors = consoleMessages.filter(m => m.type === 'error');
        if (consoleErrors.length > 0) {
            console.log('\n🔍 콘솔 에러 상세:');
            consoleErrors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.text}`);
            });
        }
        
    } catch (error) {
        console.error('❌ 테스트 실행 중 오류:', error.message);
    } finally {
        await browser.close();
        console.log('\n✅ 테스트 완료');
    }
}

runTest();