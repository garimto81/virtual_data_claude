const { chromium } = require('playwright');

// Phase 4 Playwright 테스트 스크립트
async function runPhase4Tests() {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🚀 Phase 4 테스트 시작...');

  try {
    // 페이지 콘솔 에러 수집
    const consoleMessages = [];
    const errors = [];

    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });

    page.on('pageerror', error => {
      errors.push(error);
      console.log('❌ 페이지 JavaScript 에러:', error);
    });

    // 1. 메인 애플리케이션 페이지 로드
    console.log('📄 메인 애플리케이션 로드 중...');
    await page.goto('http://localhost:8080/index.html');
    await page.waitForLoadState('networkidle');

    // 페이지가 완전히 로드될 때까지 추가 대기
    console.log('⏳ 페이지 완전 로드 대기 중...');
    await page.waitForTimeout(3000);

    // 콘솔 에러 확인
    console.log('🔍 브라우저 콘솔 메시지 확인...');
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    if (errorMessages.length > 0) {
      console.log('❌ 발견된 JavaScript 에러들:');
      errorMessages.forEach(err => {
        console.log(`  - ${err.text} (${err.location?.url}:${err.location?.lineNumber})`);
      });
    } else {
      console.log('✅ JavaScript 에러 없음');
    }

    if (errors.length > 0) {
      console.log('❌ 페이지 에러들:');
      errors.forEach(err => console.log(`  - ${err.message}`));
    }

    // 2. 개발자 콘솔에서 Phase 4 함수들이 정의되었는지 확인 (여러 번 시도)
    console.log('🔍 Phase 4 함수 정의 확인...');

    let functionsCheck = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`🔄 함수 정의 확인 시도 ${attempt}/3...`);

      functionsCheck = await page.evaluate(() => {
        const results = {};

        // window 객체를 통한 확인
        results.ensureAppsScriptUrl = typeof window.ensureAppsScriptUrl;
        results.protectedApiCall = typeof window.protectedApiCall;
        results.ApiCallManager = typeof window.ApiCallManager;
        results.getUserFriendlyErrorMessage = typeof window.getUserFriendlyErrorMessage;

        // 글로벌 변수 확인
        results.APP_CONFIG = typeof window.APP_CONFIG;
        results.validateAppsScriptUrl = typeof validateAppsScriptUrl;

        // 전역 스코프 확인 (window 없이)
        results.ensureAppsScriptUrl_global = typeof ensureAppsScriptUrl;
        results.protectedApiCall_global = typeof protectedApiCall;

        return results;
      });

      console.log(`📊 시도 ${attempt} - 함수 정의 상태:`, functionsCheck);

      // 함수들이 정의되었는지 확인
      if (functionsCheck.ensureAppsScriptUrl === 'function' ||
          functionsCheck.ensureAppsScriptUrl_global === 'function') {
        console.log('✅ 함수들이 정의됨!');
        break;
      }

      // 마지막 시도가 아니면 잠시 대기
      if (attempt < 3) {
        console.log('⏳ 2초 대기 후 재시도...');
        await page.waitForTimeout(2000);
      }
    }

    // 3. URL 검증 함수 테스트
    console.log('🔒 URL 검증 테스트...');

    const urlValidationTest = await page.evaluate(() => {
      try {
        // APP_CONFIG 초기화가 안된 상태에서 테스트
        if (!window.APP_CONFIG.appsScriptUrl) {
          ensureAppsScriptUrl();
          return { success: false, error: 'Should have thrown error for missing URL' };
        }
      } catch (error) {
        return {
          success: true,
          expectedError: error.message,
          testResult: 'URL 누락 에러가 올바르게 발생함'
        };
      }
      return { success: false, error: 'URL validation test failed' };
    });

    console.log('🧪 URL 검증 테스트 결과:', urlValidationTest);

    // 4. 테스트용 Apps Script URL 설정
    console.log('⚙️ 테스트용 URL 설정...');

    const urlSetResult = await page.evaluate(() => {
      try {
        // 가짜 Apps Script URL 설정
        const testUrl = 'https://script.google.com/macros/s/1234567890abcdef1234567890abcdef12345678/exec';
        window.APP_CONFIG.appsScriptUrl = testUrl;
        window.APP_CONFIG.isInitialized = true;
        window.APP_CONFIG.state.isOnline = true;

        // URL 검증 다시 시도
        const validatedUrl = ensureAppsScriptUrl();

        return {
          success: true,
          url: validatedUrl,
          message: 'URL 설정 및 검증 성공'
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    console.log('🔧 URL 설정 결과:', urlSetResult);

    // 5. 보호된 API 호출 테스트 (네트워크 요청은 실제로 하지 않음)
    console.log('🛡️ 보호된 API 호출 기본 구조 테스트...');

    const protectedCallTest = await page.evaluate(() => {
      try {
        // protectedApiCall 함수가 존재하고 호출 가능한지 확인
        // 실제 네트워크 요청은 하지 않고 함수 구조만 확인
        const isFunction = typeof protectedApiCall === 'function';
        const hasParams = protectedApiCall.length >= 1; // 최소 1개 매개변수 필요

        return {
          success: true,
          isFunction,
          hasParams,
          message: 'protectedApiCall 함수 구조 확인 완료'
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    console.log('🔒 보호된 API 호출 테스트 결과:', protectedCallTest);

    // 6. API Call Manager 테스트
    console.log('📊 API Call Manager 테스트...');

    const apiManagerTest = await page.evaluate(() => {
      try {
        if (typeof ApiCallManager === 'undefined') {
          return { success: false, error: 'ApiCallManager가 정의되지 않음' };
        }

        // 기본 메서드들이 존재하는지 확인
        const hasAddCall = typeof ApiCallManager.addCall === 'function';
        const hasGetStats = typeof ApiCallManager.getStats === 'function';
        const hasReset = typeof ApiCallManager.reset === 'function';

        return {
          success: true,
          hasAddCall,
          hasGetStats,
          hasReset,
          message: 'ApiCallManager 메서드 확인 완료'
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    console.log('🎯 API Manager 테스트 결과:', apiManagerTest);

    // 7. 에러 메시지 함수 테스트
    console.log('⚠️ 에러 메시지 생성 테스트...');

    const errorMessageTest = await page.evaluate(() => {
      try {
        if (typeof getUserFriendlyErrorMessage === 'undefined') {
          return { success: false, error: 'getUserFriendlyErrorMessage가 정의되지 않음' };
        }

        // 다양한 에러 타입 테스트
        const testTypes = ['URL_VALIDATION_ERROR', 'NETWORK_ERROR', 'API_ERROR', 'UNKNOWN_ERROR'];
        const messages = {};

        testTypes.forEach(type => {
          messages[type] = getUserFriendlyErrorMessage(type);
        });

        return {
          success: true,
          messages,
          messageCount: Object.keys(messages).length
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    console.log('💬 에러 메시지 테스트 결과:', errorMessageTest);

    // 8. Phase 4 테스트 페이지로 이동하여 추가 테스트
    console.log('📋 Phase 4 전용 테스트 페이지 로드...');

    await page.goto('http://localhost:8080/test_phase4.html');
    await page.waitForLoadState('networkidle');

    // 테스트 페이지에서 자동 테스트 실행
    await page.waitForSelector('#appsScriptUrl');

    // 테스트 URL 입력
    await page.fill('#appsScriptUrl', 'https://script.google.com/macros/s/1234567890abcdef1234567890abcdef12345678/exec');
    await page.click('button:has-text("URL 설정")');

    await page.waitForTimeout(1000);

    // URL 검증 테스트 실행
    await page.click('button:has-text("URL 검증 실행")');
    await page.waitForTimeout(1000);

    // 테스트 결과 확인
    const testPageResults = await page.evaluate(() => {
      const urlStatus = document.getElementById('urlStatus').textContent;
      const urlValidationResult = document.getElementById('urlValidationResult').textContent;
      const testLog = document.getElementById('testLog').textContent;

      return {
        urlStatus,
        urlValidationResult,
        logLength: testLog.length,
        hasSuccessMessage: testLog.includes('URL 검증 성공')
      };
    });

    console.log('📊 테스트 페이지 결과:', testPageResults);

    // 9. 종합 평가
    console.log('\n📋 Phase 4 테스트 종합 결과:');
    console.log('================================');

    const overallResults = {
      functionsExist: Object.values(functionsCheck).every(v => v === true),
      urlValidation: urlValidationTest.success,
      urlSetting: urlSetResult.success,
      protectedCall: protectedCallTest.success,
      apiManager: apiManagerTest.success,
      errorMessages: errorMessageTest.success,
      testPageWorking: testPageResults.hasSuccessMessage
    };

    const passedTests = Object.values(overallResults).filter(v => v === true).length;
    const totalTests = Object.keys(overallResults).length;

    console.log(`✅ 통과: ${passedTests}/${totalTests} 테스트`);
    console.log('상세 결과:', overallResults);

    if (passedTests === totalTests) {
      console.log('🎉 Phase 4 모든 테스트 통과!');
    } else {
      console.log('❌ Phase 4 일부 테스트 실패, 수정 필요');

      // 실패한 테스트들 나열
      Object.entries(overallResults).forEach(([test, passed]) => {
        if (!passed) {
          console.log(`❌ 실패: ${test}`);
        }
      });
    }

    return overallResults;

  } catch (error) {
    console.error('❌ Phase 4 테스트 중 오류 발생:', error);
    return null;
  } finally {
    await browser.close();
  }
}

// 테스트 실행
runPhase4Tests().then(results => {
  console.log('\n🏁 Phase 4 자동 테스트 완료');
  if (results) {
    const success = Object.values(results).every(v => v === true);
    process.exit(success ? 0 : 1);
  } else {
    process.exit(1);
  }
}).catch(error => {
  console.error('테스트 실행 실패:', error);
  process.exit(1);
});