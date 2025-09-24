const { test, expect } = require('@playwright/test');

test('브라우저 JavaScript 에러 확인', async ({ page }) => {
  const errors = [];
  const consoleMessages = [];
  
  // 콘솔 메시지 수집
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    console.log(`브라우저 콘솔: [${msg.type()}] ${msg.text()}`);
  });
  
  // JavaScript 에러 수집
  page.on('pageerror', error => {
    errors.push(error);
    console.error('JavaScript 에러:', error.message);
    console.error('스택:', error.stack);
  });
  
  // 네트워크 에러 확인
  page.on('response', response => {
    if (!response.ok()) {
      console.log(`네트워크 에러: ${response.url()} - ${response.status()}`);
    }
  });
  
  try {
    console.log('페이지 로드 시작...');
    await page.goto('http://localhost:3000/index.html');
    
    // 페이지 로드 완료 대기
    await page.waitForLoadState('networkidle');
    console.log('페이지 로드 완료');
    
    // 잠시 대기해서 지연된 스크립트 에러도 확인
    await page.waitForTimeout(2000);
    
    // 결과 출력
    console.log('\n=== 에러 요약 ===');
    console.log(`JavaScript 에러 수: ${errors.length}`);
    console.log(`콘솔 메시지 수: ${consoleMessages.length}`);
    
    if (errors.length > 0) {
      console.log('\n=== JavaScript 에러 상세 ===');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
        console.log(`   위치: ${error.stack?.split('\n')[1] || '알 수 없음'}`);
      });
    }
    
    // 에러 메시지에서 구문 에러 찾기
    const syntaxErrors = errors.filter(error => 
      error.message.includes('SyntaxError') || 
      error.message.includes('Unexpected token') ||
      error.message.includes('Invalid or unexpected')
    );
    
    if (syntaxErrors.length > 0) {
      console.log('\n=== 구문 에러 발견 ===');
      syntaxErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
        console.log(`   스택: ${error.stack}`);
      });
    }
    
  } catch (error) {
    console.error('테스트 실행 중 에러:', error);
  }
});