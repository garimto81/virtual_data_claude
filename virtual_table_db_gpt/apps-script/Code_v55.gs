/****************************************************
 * Poker Hand Logger - Apps Script Backend v55
 * 
 * 스프레드시트 구조:
 * - Hand 시트: 포커 핸드 로우 데이터
 * - Index 시트: 핸드 인덱스 (확장된 17개 열 구조)
 *   - E열(5번째): handEdit 체크박스
 *   - F열(6번째): handEditTime 타임스탬프
 * - Type 시트: 플레이어 정보
 * 
 * 주요 기능:
 * 1. 새 핸드 등록 시 E열에 체크박스 자동 생성
 * 2. updateHandEdit 액션으로 체크박스 상태 변경
 * 3. 체크 시 F열에 타임스탬프 자동 기록
 ****************************************************/

const SHEET_ID = '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U';

// ===== 유틸리티 함수 =====

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _open() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function _padRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  
  let maxCols = 0;
  for (const row of rows) {
    maxCols = Math.max(maxCols, (row || []).length);
  }
  
  return rows.map(row => {
    const arr = (row || []).slice();
    while (arr.length < maxCols) {
      arr.push('');
    }
    return arr;
  });
}

function _normalizeEventRows(rows) {
  if (!Array.isArray(rows)) return rows;
  
  const output = [];
  const SIMPLE_EVENTS = {
    'FOLDS': 'FOLD',
    'CHECKS': 'CHECK', 
    'CALLS': 'CALL',
    'BETS': 'BET'
  };
  
  for (const row of rows) {
    const r = (row || []).slice();
    
    if (r[1] === 'EVENT') {
      let eventType = String(r[2] || '').trim().toUpperCase();
      
      if (/^(RAISE|RAISES|RAISE TO|RAIES)$/.test(eventType)) {
        eventType = 'RAISE TO';
      }
      else if (SIMPLE_EVENTS[eventType]) {
        eventType = SIMPLE_EVENTS[eventType];
      }
      
      r[2] = eventType;
    }
    
    output.push(r);
  }
  
  return output;
}

function _fixPlayerRows(rows) {
  if (!Array.isArray(rows)) return rows;
  
  const output = [];
  
  for (const row of rows) {
    const r = (row || []).slice();
    
    if (r[1] === 'PLAYER') {
      const name = r[2];
      const seat = r[3];
      
      if (r[4] === 0 || r[4] === '0') {
        if (r[5] === 0 || r[5] === '0') {
          const initialChips = r[6];
          const finalChips = r[7];
          const cards = r[8] || '';
          output.push([r[0], 'PLAYER', name, seat, 0, initialChips, finalChips, cards]);
          console.log(`PLAYER 행 수정: ${name} - 0 두개 제거`);
        } else {
          output.push(r);
        }
      } else {
        const initialChips = r[4];
        const finalChips = r[5];
        const cards = r[6] || '';
        output.push([r[0], 'PLAYER', name, seat, 0, initialChips, finalChips, cards]);
        console.log(`PLAYER 행 수정: ${name} - 0 추가`);
      }
    } else {
      output.push(r);
    }
  }
  
  return output;
}

function _parseRequestBody(e) {
  if (e && e.parameter && typeof e.parameter.payload === 'string') {
    try {
      return JSON.parse(e.parameter.payload);
    } catch (err) {
      console.error('Failed to parse payload:', err);
      return {};
    }
  }
  
  if (e && e.postData && e.postData.type && 
      e.postData.type.indexOf('application/json') !== -1) {
    try {
      return JSON.parse(e.postData.contents || '{}');
    } catch (err) {
      console.error('Failed to parse JSON:', err);
      return {};
    }
  }
  
  return {};
}

function _ensureIndexHeader(sheet) {
  const fullHeaderRow = [
    'handNumber', 'startRow', 'endRow', 'handUpdatedAt', 
    'handEdit', 'handEditTime', 'label', 'table', 
    'tableUpdatedAt', 'Cam', 'CamFile01name', 'CamFile01number',
    'CamFile02name', 'CamFile02number',
    'lastStreet', 'lastAction', 'workStatus'
  ];
  
  if (sheet.getLastRow() < 1) {
    sheet.getRange(1, 1, 1, fullHeaderRow.length).setValues([fullHeaderRow]);
  } else {
    const lastCol = sheet.getLastColumn();
    if (lastCol < 17) {
      sheet.getRange(1, 1, 1, fullHeaderRow.length).setValues([fullHeaderRow]);
    }
  }
}

/**
 * Index 시트의 모든 체크박스 초기화 (신규 v55)
 * E열 전체에 체크박스가 없으면 생성
 */
function _ensureCheckboxes(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return; // 헤더만 있으면 종료
  
  const checkboxCol = 5; // E열
  const range = sheet.getRange(2, checkboxCol, lastRow - 1, 1);
  
  // 현재 데이터 검증 규칙 확인
  const validations = range.getDataValidations();
  let needsUpdate = false;
  
  for (let i = 0; i < validations.length; i++) {
    if (!validations[i][0] || validations[i][0].getCriteriaType() !== SpreadsheetApp.DataValidationCriteria.CHECKBOX) {
      needsUpdate = true;
      break;
    }
  }
  
  // 체크박스가 없는 셀에만 추가
  if (needsUpdate) {
    const checkboxRule = SpreadsheetApp.newDataValidation()
      .requireCheckbox()
      .setAllowInvalid(false)
      .build();
    
    range.setDataValidation(checkboxRule);
    console.log(`체크박스 생성 완료: ${lastRow - 1}개 행`);
  }
}

// ===== 핸드 편집 상태 업데이트 (신규 v55) =====

function updateHandEditStatus(handNumber, checked) {
  const spreadsheet = _open();
  const indexSheet = spreadsheet.getSheetByName('Index');
  
  if (!indexSheet) {
    throw new Error('Index 시트를 찾을 수 없습니다');
  }
  
  // 체크박스 확인 및 생성
  _ensureCheckboxes(indexSheet);
  
  const data = indexSheet.getDataRange().getValues();
  const handNumberColIndex = 0; // A열: handNumber
  const handEditColIndex = 4;   // E열: handEdit (체크박스)
  const handEditTimeColIndex = 5; // F열: handEditTime
  
  // 해당 핸드 찾기
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][handNumberColIndex]) === String(handNumber)) {
      // 체크박스 상태 업데이트
      indexSheet.getRange(i + 1, handEditColIndex + 1).setValue(checked);
      
      // 타임스탬프 업데이트
      if (checked) {
        const editTime = new Date();
        indexSheet.getRange(i + 1, handEditTimeColIndex + 1).setValue(editTime);
      } else {
        // 체크 해제 시 타임스탬프 제거
        indexSheet.getRange(i + 1, handEditTimeColIndex + 1).setValue('');
      }
      
      console.log(`핸드 #${handNumber} 편집 상태 업데이트: ${checked}`);
      
      return {
        success: true,
        handNumber: handNumber,
        checked: checked,
        editTime: checked ? new Date().toISOString() : null
      };
    }
  }
  
  throw new Error(`핸드 #${handNumber}를 찾을 수 없습니다`);
}

// ===== 메인 핸들러 =====

function doGet(e) {
  // 액션 파라미터로 분기
  const action = e.parameter.action;
  
  if (action === 'getCheckboxStatus') {
    // 특정 핸드의 체크박스 상태 조회
    const handNumber = e.parameter.handNumber;
    if (!handNumber) {
      return _json({
        status: 'error',
        message: 'handNumber가 필요합니다'
      });
    }
    
    try {
      const spreadsheet = _open();
      const indexSheet = spreadsheet.getSheetByName('Index');
      const data = indexSheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(handNumber)) {
          return _json({
            status: 'success',
            handNumber: handNumber,
            checked: data[i][4] === true,
            editTime: data[i][5] || null
          });
        }
      }
      
      return _json({
        status: 'error',
        message: `핸드 #${handNumber}를 찾을 수 없습니다`
      });
    } catch (error) {
      return _json({
        status: 'error',
        message: error.message
      });
    }
  }
  
  return _json({
    status: 'ok',
    method: 'GET',
    time: new Date().toISOString(),
    version: 'v55'
  });
}

function doPost(e) {
  try {
    console.log('=== doPost v55 시작 ===');
    
    const body = _parseRequestBody(e) || {};
    
    // updateHandEdit 액션 처리 (신규 v55)
    if (body.action === 'updateHandEdit') {
      console.log('updateHandEdit 액션 감지:', body.handNumber, body.checked);
      
      if (!body.handNumber) {
        return _json({
          status: 'error',
          message: 'handNumber가 필요합니다'
        });
      }
      
      try {
        const result = updateHandEditStatus(body.handNumber, body.checked === true);
        return _json(result);
      } catch (error) {
        return _json({
          status: 'error',
          message: error.message
        });
      }
    }
    
    // 기존 핸드 데이터 저장 로직
    if (!body || Object.keys(body).length === 0) {
      return _json({
        status: 'error',
        message: '요청 데이터가 비어있습니다'
      });
    }
    
    const rowsInput = body.rows;
    const indexMeta = body.indexMeta || {};
    const typeUpdates = Array.isArray(body.typeUpdates) ? body.typeUpdates : [];
    
    if (!Array.isArray(rowsInput) || !rowsInput.length) {
      return _json({
        status: 'error',
        message: 'rows 데이터가 누락되었습니다.'
      });
    }
    
    // 데이터 처리
    let rows = _normalizeEventRows(rowsInput);
    rows = _fixPlayerRows(rows);
    rows = _padRows(rows);
    
    // HAND 정보 추출
    let handNumber = '';
    let handCode = '';
    
    for (const row of rows) {
      if (row[1] === 'HAND') {
        handNumber = String(row[2] || '');
        handCode = String(row[3] || '');
        break;
      }
    }
    
    // 스프레드시트 열기
    const spreadsheet = _open();
    const handSheet = spreadsheet.getSheetByName('Hand') || spreadsheet.insertSheet('Hand');
    const indexSheet = spreadsheet.getSheetByName('Index') || spreadsheet.insertSheet('Index');
    const typeSheet = spreadsheet.getSheetByName('Type') || spreadsheet.insertSheet('Type');
    
    // Hand 시트에 데이터 기록
    const startRow = handSheet.getLastRow() + 1;
    let maxCols = 0;
    for (const row of rows) {
      maxCols = Math.max(maxCols, (row || []).length);
    }
    
    handSheet.getRange(startRow, 1, rows.length, maxCols).setValues(rows);
    const endRow = startRow + rows.length - 1;
    
    // Index 시트 업데이트
    _ensureIndexHeader(indexSheet);
    
    // 중복 체크
    const existingData = indexSheet.getDataRange().getValues();
    const handNumberColIndex = 0;
    
    for (let i = 1; i < existingData.length; i++) {
      if (String(existingData[i][handNumberColIndex]) === String(handNumber)) {
        return _json({
          status: 'duplicate',
          message: `핸드 #${handNumber}는 이미 기록되어 있습니다`,
          handNumber: handNumber,
          existingRow: i + 1
        });
      }
    }
    
    // Index 데이터 추가
    const rawDate = indexMeta.handUpdatedAt || new Date().toISOString();
    const updatedAt = String(rawDate).split('T')[0];
    
    const indexData = [
      handNumber || String(indexMeta.handNumber || ''),
      startRow,
      endRow,
      updatedAt,
      false,  // handEdit - 초기값은 false (체크되지 않음)
      '',     // handEditTime - 초기값은 비움
      indexMeta.label || '',
      indexMeta.table || '',
      indexMeta.tableUpdatedAt || updatedAt,
      indexMeta.cam || '',
      indexMeta.camFile01name || '',
      indexMeta.camFile01number || '',
      indexMeta.camFile02name || '',
      indexMeta.camFile02number || '',
      indexMeta.lastStreet || 'preflop',
      indexMeta.lastAction || '',
      indexMeta.workStatus || '진행중'
    ];
    
    const newRowIndex = indexSheet.getLastRow() + 1;
    indexSheet.appendRow(indexData);
    
    // 새로 추가된 행의 E열에 체크박스 생성
    const checkboxRange = indexSheet.getRange(newRowIndex, 5); // E열
    const checkboxRule = SpreadsheetApp.newDataValidation()
      .requireCheckbox()
      .setAllowInvalid(false)
      .build();
    checkboxRange.setDataValidation(checkboxRule);
    checkboxRange.setValue(false); // 초기값은 체크 해제
    
    console.log(`핸드 #${handNumber} Index 추가 완료, 체크박스 생성됨`);
    
    // Type 시트 업데이트
    if (typeUpdates.length > 0) {
      const typeData = typeSheet.getDataRange().getValues();
      const playerColIndex = 1;
      const tableColIndex = 2;
      const chipsColIndex = 4;
      const updatedAtColIndex = 5;
      
      typeUpdates.forEach(update => {
        const rowIndex = typeData.findIndex((row, idx) => {
          return idx > 0 && 
                 row[playerColIndex] === update.player &&
                 row[tableColIndex] === update.table;
        });
        
        if (rowIndex > 0) {
          typeSheet.getRange(rowIndex + 1, chipsColIndex + 1).setValue(update.chips || '');
          const updateTime = update.updatedAt ? new Date(update.updatedAt) : new Date();
          typeSheet.getRange(rowIndex + 1, updatedAtColIndex + 1).setValue(updateTime);
        }
      });
    }
    
    // 성공 응답
    return _json({
      status: 'success',
      handNumber: handNumber || indexMeta.handNumber || '',
      rowsAdded: rows.length,
      startRow: startRow,
      endRow: endRow,
      updatedAt: updatedAt,
      version: 'v55',
      message: '핸드 추가 및 체크박스 생성 완료'
    });
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return _json({
      status: 'error',
      message: String(error && error.message || error),
      stack: String(error && error.stack || ''),
      version: 'v55'
    });
  }
}

// ===== 테스트 함수 =====

function testUpdateHandEdit() {
  try {
    // 테스트용 핸드 번호 (실제 존재하는 핸드 번호로 변경 필요)
    const result = updateHandEditStatus('1', true);
    console.log('업데이트 성공:', result);
  } catch (error) {
    console.error('업데이트 실패:', error);
  }
}

function testCheckboxCreation() {
  const spreadsheet = _open();
  const indexSheet = spreadsheet.getSheetByName('Index');
  
  if (!indexSheet) {
    console.error('Index 시트를 찾을 수 없습니다');
    return;
  }
  
  _ensureCheckboxes(indexSheet);
  console.log('체크박스 생성 완료');
}

function testConnection() {
  try {
    const ss = _open();
    const sheets = ss.getSheets().map(s => s.getName());
    
    console.log('연결 성공!');
    console.log('시트 목록:', sheets);
    
    return {
      status: 'success',
      sheets: sheets,
      spreadsheetId: SHEET_ID,
      version: 'v55'
    };
  } catch (error) {
    console.error('연결 실패:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * 일괄 체크박스 초기화 (수동 실행용)
 * Index 시트의 모든 행에 체크박스가 없으면 생성
 */
function initializeAllCheckboxes() {
  const spreadsheet = _open();
  const indexSheet = spreadsheet.getSheetByName('Index');
  
  if (!indexSheet) {
    console.error('Index 시트를 찾을 수 없습니다');
    return;
  }
  
  _ensureCheckboxes(indexSheet);
  
  // 기존 데이터의 handEdit 열 값 보존
  const data = indexSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const currentValue = data[i][4]; // E열
    if (currentValue === 'TRUE' || currentValue === true) {
      indexSheet.getRange(i + 1, 5).setValue(true);
    } else {
      indexSheet.getRange(i + 1, 5).setValue(false);
    }
  }
  
  console.log('모든 체크박스 초기화 완료');
}