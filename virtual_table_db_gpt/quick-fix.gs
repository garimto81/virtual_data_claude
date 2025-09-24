// === 이 코드를 Code.gs의 doPost 함수 안, 260행 근처에 추가 ===
// "if (body.action === 'updateHandEdit')" 부분을 찾아서 다음으로 교체:

    // updateHandEdit 액션 처리 (긴급 수정)
    if (body.action === 'updateHandEdit') {
      Logger.log('updateHandEdit 처리 시작');
      
      try {
        const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
        const indexSheet = spreadsheet.getSheetByName('Index');
        
        if (!indexSheet) {
          return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Index 시트를 찾을 수 없습니다'
          })).setMimeType(ContentService.MimeType.JSON);
        }
        
        const handNumber = String(body.handNumber);
        const checked = body.checked === true;
        
        const data = indexSheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][0]) === handNumber) {
            // E열 (5번째) 체크박스 업데이트
            indexSheet.getRange(i + 1, 5).setValue(checked);
            
            // F열 (6번째) 타임스탬프
            if (checked) {
              indexSheet.getRange(i + 1, 6).setValue(new Date());
            } else {
              indexSheet.getRange(i + 1, 6).setValue('');
            }
            
            return ContentService.createTextOutput(JSON.stringify({
              success: true,
              handNumber: handNumber,
              checked: checked,
              editTime: checked ? new Date().toISOString() : null
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        return ContentService.createTextOutput(JSON.stringify({
          status: 'error',
          message: '핸드 #' + handNumber + '를 찾을 수 없습니다'
        })).setMimeType(ContentService.MimeType.JSON);
        
      } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'error',
          message: error.message
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }