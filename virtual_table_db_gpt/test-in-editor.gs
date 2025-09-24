// Google Apps Script 에디터에서 이 함수를 실행하여 테스트

function testCurrentCode() {
  // 프론트엔드가 보내는 것과 동일한 요청 생성
  const e = {
    parameter: {
      payload: JSON.stringify({
        action: 'updateHandEdit',
        handNumber: '1',
        checked: true
      })
    }
  };
  
  console.log('=== 테스트 시작 ===');
  console.log('요청 데이터:', e);
  
  // _parseRequestBody 테스트
  const body = _parseRequestBody(e);
  console.log('파싱된 body:', body);
  console.log('body.action:', body.action);
  console.log('body.action === "updateHandEdit"?', body.action === 'updateHandEdit');
  
  // doPost 테스트
  const result = doPost(e);
  const content = result.getContent();
  console.log('응답:', content);
  
  const parsed = JSON.parse(content);
  if (parsed.status === 'error' && parsed.message === 'rows 누락') {
    console.log('❌ 버그 확인! _parseRequestBody가 작동하지 않습니다.');
    console.log('📝 해결: _parseRequestBody 함수를 수정해야 합니다.');
  } else if (parsed.success === true) {
    console.log('✅ 정상 작동!');
  }
  
  return parsed;
}