// 극도로 단순화된 버전 - 테스트용
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    version: 'v56-simple',
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  console.log('=== doPost 시작 (v56-simple) ===');
  
  // 모든 가능한 방법으로 action 찾기
  let action = null;
  let handNumber = null;
  let checked = false;
  
  // 1. URL 파라미터
  if (e.parameter && e.parameter.action) {
    console.log('URL 파라미터에서 action 발견');
    action = e.parameter.action;
    handNumber = e.parameter.handNumber;
    checked = e.parameter.checked === 'true';
  }
  
  // 2. FormData payload
  if (!action && e.parameter && e.parameter.payload) {
    console.log('FormData payload 발견:', e.parameter.payload);
    try {
      const parsed = JSON.parse(e.parameter.payload);
      action = parsed.action;
      handNumber = parsed.handNumber;
      checked = parsed.checked === true;
      console.log('파싱 성공:', parsed);
    } catch (err) {
      console.log('파싱 실패:', err.message);
    }
  }
  
  // 3. JSON body
  if (!action && e.postData && e.postData.contents) {
    console.log('JSON body 발견');
    try {
      const parsed = JSON.parse(e.postData.contents);
      action = parsed.action;
      handNumber = parsed.handNumber;
      checked = parsed.checked === true;
      console.log('JSON 파싱 성공:', parsed);
    } catch (err) {
      console.log('JSON 파싱 실패:', err.message);
    }
  }
  
  console.log('최종 action:', action);
  console.log('최종 handNumber:', handNumber);
  console.log('최종 checked:', checked);
  
  // updateHandEdit 처리
  if (action === 'updateHandEdit') {
    console.log('✅ updateHandEdit 액션 인식됨!');
    
    if (!handNumber) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'handNumber가 필요합니다',
        version: 'v56-simple'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    try {
      // 실제 업데이트 로직
      const spreadsheet = SpreadsheetApp.openById('1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U');
      const indexSheet = spreadsheet.getSheetByName('Index');
      
      if (!indexSheet) {
        throw new Error('Index 시트를 찾을 수 없습니다');
      }
      
      const data = indexSheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(handNumber)) {
          console.log('핸드 찾음: 행 ' + (i + 1));
          
          // E열 체크박스
          indexSheet.getRange(i + 1, 5).setValue(checked);
          
          // F열 타임스탬프
          if (checked) {
            indexSheet.getRange(i + 1, 6).setValue(new Date());
          } else {
            indexSheet.getRange(i + 1, 6).setValue('');
          }
          
          console.log('✅ 업데이트 완료');
          
          return ContentService.createTextOutput(JSON.stringify({
            success: true,
            handNumber: handNumber,
            checked: checked,
            editTime: checked ? new Date().toISOString() : null,
            version: 'v56-simple'
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      throw new Error('핸드 #' + handNumber + '를 찾을 수 없습니다');
      
    } catch (error) {
      console.error('에러:', error.message);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: error.message,
        version: 'v56-simple'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // action이 없거나 다른 경우
  console.log('❌ updateHandEdit 액션이 아님. action:', action);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'action이 updateHandEdit가 아닙니다. 받은 action: ' + action,
    receivedData: {
      action: action,
      handNumber: handNumber,
      checked: checked
    },
    version: 'v56-simple',
    debug: {
      hasParameter: e.parameter ? true : false,
      hasPayload: e.parameter && e.parameter.payload ? true : false,
      hasPostData: e.postData ? true : false
    }
  })).setMimeType(ContentService.MimeType.JSON);
}