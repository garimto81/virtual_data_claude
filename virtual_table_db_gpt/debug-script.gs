// 디버그용 스크립트 - 현재 배포된 코드 버전 확인
function checkVersion() {
  // 이 함수를 Google Apps Script 에디터에서 실행하여
  // 현재 어떤 버전이 배포되었는지 확인
  
  const code = HtmlService.createHtmlOutput().getContent();
  
  // doPost 함수 내용 확인
  const doPostString = doPost.toString();
  
  console.log("=== 현재 doPost 함수 내용 ===");
  console.log(doPostString.substring(0, 500));
  
  // updateHandEditStatus 함수 존재 여부
  try {
    const updateFunc = updateHandEditStatus.toString();
    console.log("✅ updateHandEditStatus 함수 존재함");
    console.log(updateFunc.substring(0, 200));
  } catch (e) {
    console.log("❌ updateHandEditStatus 함수 없음 - v53입니다!");
  }
  
  // 버전 확인
  const response = doGet({});
  const content = response.getContent();
  console.log("GET 응답:", content);
  
  return {
    hasUpdateFunction: typeof updateHandEditStatus === 'function',
    version: JSON.parse(content).version || 'unknown'
  };
}

// 테스트 POST 요청
function testUpdateHandEdit() {
  const e = {
    parameter: {
      payload: JSON.stringify({
        action: 'updateHandEdit',
        handNumber: '1',
        checked: true
      })
    }
  };
  
  const result = doPost(e);
  console.log("테스트 결과:", result.getContent());
  return JSON.parse(result.getContent());
}