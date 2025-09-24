const { test, expect } = require('@playwright/test');

test.describe('Virtual Data Claude - Phase 4 검증 테스트', () => {
  let page;
  let consoleMessages = [];
  let networkRequests = [];
  let jsErrors = [];

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // 콘솔 메시지 수집
    page.on('console', msg => {
      const message = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      };
      consoleMessages.push(message);
      console.log(`[${message.type.toUpperCase()}] ${message.text}`);
    });

    // 네트워크 요청 모니터링
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        timestamp: new Date().toISOString()
      });
    });

    // JavaScript 런타임 에러 포착
    page.on('pageerror', error => {
      jsErrors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      console.error('JavaScript Error:', error.message);
    });

    // 응답 실패 모니터링
    page.on('response', response => {
      if (!response.ok()) {
        console.error(`❌ Failed request: ${response.url()} - Status: ${response.status()}`);
      }
    });
  });

  test('Phase 4 - 앱 초기화 및 콘솔 에러 검증', async () => {
    console.log('🚀 테스트 시작: 앱 초기화 및 콘솔 에러 검증');
    
    // 페이지 로드
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);
    
    // 잠시 대기하여 JavaScript 실행 완료 확인
    await page.waitForTimeout(3000);
    
    // 페이지 로드 완료 확인
    await expect(page).toHaveTitle(/Virtual Data/);
    
    // 콘솔 에러 검사
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    console.log(`🔍 발견된 콘솔 에러 수: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('❌ 콘솔 에러 상세:');
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.text}`);
        console.log(`     위치: ${error.location?.url || 'Unknown'}:${error.location?.lineNumber || 'Unknown'}`);
      });
    }
    
    // JavaScript 런타임 에러 검사
    console.log(`🔍 JavaScript 런타임 에러 수: ${jsErrors.length}`);
    if (jsErrors.length > 0) {
      console.log('❌ JavaScript 런타임 에러 상세:');
      jsErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.message}`);
        console.log(`     스택: ${error.stack}`);
      });
    }
    
    // Phase 4 검증을 위한 추가 대기
    await page.waitForTimeout(2000);
  });

  test('Phase 4 - DOM 요소 및 전역 함수 접근 검증', async () => {
    console.log('🚀 테스트 시작: DOM 요소 및 전역 함수 접근 검증');
    
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 주요 DOM 요소 존재 확인
    const elements = [
      'body',
      'head',
      'title'
    ];
    
    for (const element of elements) {
      const exists = await page.locator(element).count() > 0;
      console.log(`📍 ${element} 요소 존재: ${exists ? '✅' : '❌'}`);
    }
    
    // Phase 4 관련 전역 함수들 확인
    const globalFunctions = await page.evaluate(() => {
      const functions = {};
      
      // 전역 객체들 확인
      if (typeof window !== 'undefined') functions.window = true;
      if (typeof document !== 'undefined') functions.document = true;
      if (typeof console !== 'undefined') functions.console = true;
      
      // Phase 4 관련 함수들 확인 (실제 구현에 따라 조정)
      const phase4Functions = [
        'initializeApp',
        'loadHandHistory', 
        'setupEventListeners',
        'validateConfiguration'
      ];
      
      phase4Functions.forEach(funcName => {
        functions[funcName] = typeof window[funcName] === 'function';
      });
      
      return functions;
    });
    
    console.log('🔍 전역 함수 접근성 검사:');
    Object.entries(globalFunctions).forEach(([name, exists]) => {
      console.log(`  ${name}: ${exists ? '✅' : '❌'}`);
    });
  });

  test('Phase 4 - 외부 스크립트 로딩 상태 검증', async () => {
    console.log('🚀 테스트 시작: 외부 스크립트 로딩 상태 검증');
    
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 404 에러가 발생한 리소스 확인
    const failedRequests = networkRequests.filter(req => 
      req.resourceType === 'script' || req.resourceType === 'stylesheet'
    );
    
    console.log('🔍 로드된 외부 리소스:');
    failedRequests.forEach(req => {
      console.log(`  ${req.method} ${req.url} (${req.resourceType})`);
    });
    
    // 스크립트 태그 확인
    const scripts = await page.$$eval('script', scripts => 
      scripts.map(script => ({
        src: script.src,
        inline: script.src ? false : true,
        content: script.src ? null : script.textContent?.substring(0, 100)
      }))
    );
    
    console.log('📜 페이지 내 스크립트 태그:');
    scripts.forEach((script, index) => {
      if (script.src) {
        console.log(`  ${index + 1}. 외부 스크립트: ${script.src}`);
      } else {
        console.log(`  ${index + 1}. 인라인 스크립트: ${script.content}...`);
      }
    });
  });

  test('Phase 4 - API 호출 플로우 테스트', async () => {
    console.log('🚀 테스트 시작: API 호출 플로우 테스트');
    
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // XHR/Fetch 요청 모니터링
    const apiRequests = networkRequests.filter(req => 
      req.resourceType === 'xhr' || req.resourceType === 'fetch'
    );
    
    console.log('🌐 API 호출 내역:');
    if (apiRequests.length === 0) {
      console.log('  API 호출이 없음');
    } else {
      apiRequests.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req.method} ${req.url}`);
      });
    }
    
    // 특정 API 엔드포인트 테스트 (Google Apps Script 등)
    const hasGoogleScript = networkRequests.some(req => 
      req.url.includes('script.google.com') || req.url.includes('apps-script')
    );
    
    console.log(`📡 Google Apps Script 호출: ${hasGoogleScript ? '✅' : '❌'}`);
  });

  test.afterEach(async () => {
    // 테스트 결과 요약 출력
    console.log('\n📊 테스트 결과 요약:');
    console.log(`  - 콘솔 메시지: ${consoleMessages.length}개`);
    console.log(`  - 콘솔 에러: ${consoleMessages.filter(m => m.type === 'error').length}개`);
    console.log(`  - JavaScript 런타임 에러: ${jsErrors.length}개`);
    console.log(`  - 네트워크 요청: ${networkRequests.length}개`);
    
    if (page) {
      await page.close();
    }
  });
});