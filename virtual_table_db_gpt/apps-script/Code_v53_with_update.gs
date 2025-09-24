/****************************************************
 * Poker Hand Logger - Apps Script Backend v53-update
 * 기존 v53에 updateHandEdit 기능만 추가한 버전
 ****************************************************/

const SHEET_ID = '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U';

// ===== 유틸리티 함수 (기존 v53과 동일) =====

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _open() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function _padRows(rows) {
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

function _parseRequestBody(e) {
  console.log('_parseRequestBody called with:', JSON.stringify(e, null, 2));
  
  if (e && e.parameter && typeof e.parameter.payload === 'string') {
    console.log('Using form-urlencoded payload:', e.parameter.payload);
    try {
      const parsed = JSON.parse(e.parameter.payload);
      console.log('Successfully parsed payload:', parsed);
      return parsed;
    } catch (err) {
      console.error('Failed to parse payload:', err);
      return {};
    }
  }
  
  if (e && e.postData && e.postData.type && 
      e.postData.type.indexOf('application/json') !== -1) {
    console.log('Using JSON postData:', e.postData.contents);
    try {
      const parsed = JSON.parse(e.postData.contents || '{}');
      console.log('Successfully parsed JSON:', parsed);
      return parsed;
    } catch (err) {
      console.error('Failed to parse JSON:', err);
      return {};
    }
  }
  
  console.log('No valid request body found, returning empty object');
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

// ===== 핸드 편집 상태 업데이트 (v55에서 추가) =====

function updateHandEditStatus(handNumber, checked) {
  const spreadsheet = _open();
  const indexSheet = spreadsheet.getSheetByName('Index');
  
  if (!indexSheet) {
    throw new Error('Index 시트를 찾을 수 없습니다');
  }
  
  const data = indexSheet.getDataRange().getValues();
  const handNumberColIndex = 0; // A열: handNumber
  const handEditColIndex = 4;   // E열: handEdit
  const handEditTimeColIndex = 5; // F열: handEditTime
  
  // 해당 핸드 찾기
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][handNumberColIndex]) === String(handNumber)) {
      // handEdit 체크박스 업데이트
      indexSheet.getRange(i + 1, handEditColIndex + 1).setValue(checked);
      
      // handEditTime 업데이트
      if (checked) {
        const editTime = new Date();
        indexSheet.getRange(i + 1, handEditTimeColIndex + 1).setValue(editTime);
      } else {
        indexSheet.getRange(i + 1, handEditTimeColIndex + 1).setValue('');
      }
      
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
  const action = e.parameter.action;
  
  if (action === 'getRecentHands') {
    const limit = parseInt(e.parameter.limit) || 10;
    const hands = getRecentHands(limit);
    
    return _json({
      status: 'success',
      hands: hands,
      timestamp: new Date().toISOString()
    });
  }
  
  return _json({
    status: 'ok',
    method: 'GET',
    time: new Date().toISOString(),
    version: 'v53-update'
  });
}

function doPost(e) {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    requestReceived: true,
    parseError: null,
    actionFound: false,
    processingError: null
  };
  
  try {
    Logger.log('=== doPost 시작 ===');
    Logger.log('Request parameter keys: ' + (e.parameter ? Object.keys(e.parameter) : 'none'));
    Logger.log('Request postData type: ' + (e.postData ? e.postData.type : 'none'));
    
    const body = _parseRequestBody(e) || {};
    debugInfo.parsedBody = body;
    debugInfo.bodyKeys = Object.keys(body);
    debugInfo.actionValue = body.action;
    
    Logger.log('Parsed body keys: ' + Object.keys(body));
    Logger.log('Body action value: "' + body.action + '"');
    Logger.log('Action comparison result: ' + (body.action === 'updateHandEdit'));
    
    // updateHandEdit 액션 처리 (v55에서 추가)
    if (body.action === 'updateHandEdit') {
      debugInfo.actionFound = true;
      Logger.log('Processing updateHandEdit for hand: ' + body.handNumber + ', checked: ' + body.checked);
      
      if (!body.handNumber) {
        return _json({
          status: 'error',
          message: 'handNumber가 필요합니다'
        });
      }
      
      try {
        const result = updateHandEditStatus(body.handNumber, body.checked === true);
        Logger.log('updateHandEditStatus completed successfully');
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
      debugInfo.processingError = 'Empty request body';
      return _json({
        status: 'error',
        message: '요청 데이터가 비어있습니다',
        debug: debugInfo
      });
    }
    
    const rowsInput = body.rows;
    const indexMeta = body.indexMeta || {};
    const typeUpdates = Array.isArray(body.typeUpdates) ? body.typeUpdates : [];
    
    if (!Array.isArray(rowsInput) || !rowsInput.length) {
      debugInfo.processingError = 'Missing rows data';
      Logger.log('ERROR: rows 데이터 누락 - action: "' + body.action + '", keys: ' + Object.keys(body));
      return _json({
        status: 'error',
        message: 'rows 데이터가 누락되었습니다.',
        debug: debugInfo
      });
    }
    
    const rows = _padRows(_normalizeEventRows(rowsInput));
    
    let handNumber = '';
    let handCode = '';
    let epochTimestamp = '';
    
    for (const row of rows) {
      if (row[1] === 'HAND') {
        handNumber = String(row[2] || '');
        handCode = String(row[3] || '');
        epochTimestamp = String(row[3] || '');
        break;
      }
    }
    
    const spreadsheet = _open();
    const handSheet = spreadsheet.getSheetByName('Hand') || spreadsheet.insertSheet('Hand');
    const indexSheet = spreadsheet.getSheetByName('Index') || spreadsheet.insertSheet('Index');
    const typeSheet = spreadsheet.getSheetByName('Type') || spreadsheet.insertSheet('Type');
    
    const startRow = handSheet.getLastRow() + 1;
    handSheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
    const endRow = startRow + rows.length - 1;
    
    _ensureIndexHeader(indexSheet);
    
    const existingData = indexSheet.getDataRange().getValues();
    const handNumberColIndex = 0;
    
    for (let i = 1; i < existingData.length; i++) {
      if (String(existingData[i][handNumberColIndex]) === String(handNumber)) {
        console.log(`핸드 #${handNumber}는 이미 존재합니다.`);
        return _json({
          status: 'duplicate',
          message: `핸드 #${handNumber}는 이미 기록되어 있습니다`,
          handNumber: handNumber,
          existingRow: i + 1
        });
      }
    }
    
    const rawDate = indexMeta.handUpdatedAt || new Date().toISOString();
    const updatedAt = String(rawDate).split('T')[0];
    const editTime = new Date();
    
    const indexData = [
      handNumber || String(indexMeta.handNumber || ''),
      startRow,
      endRow,
      updatedAt,
      false,
      '',
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
    
    indexSheet.appendRow(indexData);
    
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
    
    return _json({
      status: 'success',
      handNumber: handNumber || indexMeta.handNumber || '',
      rowsAdded: rows.length,
      startRow: startRow,
      endRow: endRow,
      updatedAt: updatedAt,
      version: 'v53-update'
    });
    
  } catch (error) {
    Logger.log('ERROR in doPost: ' + error.message);
    Logger.log('ERROR stack: ' + error.stack);
    debugInfo.processingError = 'Exception: ' + error.message;
    return _json({
      status: 'error',
      message: String(error && error.message || error),
      stack: String(error && error.stack || ''),
      debug: debugInfo
    });
  }
}

// ===== 테스트 함수 =====

function testUpdateHandEdit() {
  try {
    const result = updateHandEditStatus('1', true);
    console.log('업데이트 성공:', result);
  } catch (error) {
    console.error('업데이트 실패:', error);
  }
}

function getRecentHands(limit = 10) {
  const spreadsheet = _open();
  const indexSheet = spreadsheet.getSheetByName('Index');
  
  if (!indexSheet || indexSheet.getLastRow() < 2) {
    return [];
  }
  
  const data = indexSheet.getDataRange().getValues();
  const hands = [];
  
  const startRow = Math.max(1, data.length - limit);
  
  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    hands.push({
      handNumber: row[0],
      handUpdatedAt: row[3],
      handEdit: row[4],
      table: row[7],
      lastStreet: row[14],
      lastAction: row[15],
      workStatus: row[16]
    });
  }
  
  return hands.reverse();
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
      version: 'v53-update'
    };
  } catch (error) {
    console.error('연결 실패:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}