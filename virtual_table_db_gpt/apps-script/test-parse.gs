// Google Apps Script 에디터에서 이 함수를 실행하여 테스트

function testParseRequestBody() {
  // 프론트엔드에서 보내는 것과 동일한 형식
  const e = {
    parameter: {
      payload: JSON.stringify({
        action: 'updateHandEdit',
        handNumber: '1',
        checked: true
      })
    }
  };
  
  console.log("=== 테스트 시작 ===");
  console.log("e.parameter:", e.parameter);
  console.log("e.parameter.payload:", e.parameter.payload);
  
  // _parseRequestBody 테스트
  const body = _parseRequestBody(e);
  console.log("파싱 결과:", body);
  console.log("body.action:", body.action);
  console.log("body.handNumber:", body.handNumber);
  console.log("body.checked:", body.checked);
  
  // doPost 직접 호출
  const result = doPost(e);
  const content = result.getContent();
  console.log("doPost 결과:", content);
  
  const parsed = JSON.parse(content);
  if (parsed.success === true) {
    console.log("✅ 성공!");
  } else {
    console.log("❌ 실패:", parsed.message);
  }
  
  return parsed;
}

// _parseRequestBody 함수 디버깅 버전
function _parseRequestBody_debug(e) {
  console.log("=== _parseRequestBody 시작 ===");
  console.log("e 전체:", JSON.stringify(e));
  
  if (e && e.parameter && typeof e.parameter.payload === 'string') {
    console.log("✅ e.parameter.payload 발견");
    try {
      const parsed = JSON.parse(e.parameter.payload);
      console.log("✅ 파싱 성공:", parsed);
      return parsed;
    } catch (err) {
      console.error("❌ 파싱 실패:", err);
      return {};
    }
  }
  
  if (e && e.postData && e.postData.type && 
      e.postData.type.indexOf('application/json') !== -1) {
    console.log("✅ JSON postData 발견");
    try {
      const parsed = JSON.parse(e.postData.contents || '{}');
      console.log("✅ 파싱 성공:", parsed);
      return parsed;
    } catch (err) {
      console.error("❌ 파싱 실패:", err);
      return {};
    }
  }
  
  console.log("❌ 파싱할 데이터 없음");
  console.log("e.parameter:", e ? e.parameter : "없음");
  console.log("e.postData:", e ? e.postData : "없음");
  
  return {};
}