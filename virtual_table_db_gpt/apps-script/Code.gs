/****************************************************
 * Poker Hand Logger - Apps Script Backend
 * Version: 2.0.0
 * Last Updated: 2025-01-02 15:30 KST
 * 
 * 스프레드시트 구조:
 * - Hand 시트: 포커 핸드 로우 데이터
 * - Index 시트: 핸드 인덱스 (확장된 17개 열 구조)
 * - Type 시트: 플레이어 정보 (A:설정, B:Player, C:Table, D:Notable, E:Chips, F:UpdatedAt)
 * 
 * 주요 기능:
 * - handEdit 체크박스 업데이트
 * - handEditTime 자동 기록
 * - 알림을 위한 폴링 엔드포인트
 * - 실시간 모니터링 지원
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
      
      // RAISE 처리
      if (/^(RAISE|RAISES|RAISE TO|RAIES)$/.test(eventType)) {
        eventType = 'RAISE TO';
      }
      // 기타 이벤트 정규화
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
  
  // 1) form-urlencoded / multipart 방식
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
  
  // 2) application/json 방식
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

// ===== 시트 헤더 관리 =====

function _ensureIndexHeader(sheet) {
  const fullHeaderRow = [
    'handNumber', 'startRow', 'endRow', 'handUpdatedAt', 
    'handEdit', 'handEditTime', 'label', 'table', 
    'tableUpdatedAt', 'Cam', 'CamFile01name', 'CamFile01number',
    'CamFile02name', 'CamFile02number',
    'lastStreet', 'lastAction', 'workStatus'
  ];
  
  if (sheet.getLastRow() < 1) {
    // 헤더가 없으면 생성
    sheet.getRange(1, 1, 1, fullHeaderRow.length).setValues([fullHeaderRow]);
  } else {
    // 헤더 검증 - 최소한 필수 열들이 존재하는지 확인
    const lastCol = sheet.getLastColumn();
    if (lastCol < 17) {  // 17열로 확장
      sheet.getRange(1, 1, 1, fullHeaderRow.length).setValues([fullHeaderRow]);
    }
  }
}

// ===== 핸드 편집 상태 업데이트 =====
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
      
      // handEditTime 업데이트 (체크된 경우에만)
      if (checked) {
        const editTime = new Date();
        indexSheet.getRange(i + 1, handEditTimeColIndex + 1).setValue(editTime);
      } else {
        // 체크 해제시 시간도 지움
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

// ===== 알림을 위한 최근 핸드 조회 =====
function getRecentHands(limit = 10) {
  const spreadsheet = _open();
  const indexSheet = spreadsheet.getSheetByName('Index');
  
  if (!indexSheet || indexSheet.getLastRow() < 2) {
    return [];
  }
  
  const data = indexSheet.getDataRange().getValues();
  const hands = [];
  
  // 헤더 제외하고 마지막 N개 행 가져오기
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
  
  return hands.reverse(); // 최신 순으로 정렬
}

// ===== 메인 핸들러 =====

function doGet(e) {
  // 액션 파라미터로 분기
  const action = e.parameter.action;
  
  if (action === 'getRecentHands') {
    // 최근 핸드 조회 (알림용)
    const limit = parseInt(e.parameter.limit) || 10;
    const hands = getRecentHands(limit);
    
    return _json({
      status: 'success',
      hands: hands,
      timestamp: new Date().toISOString()
    });
  }
  
  // 기본 응답
  return _json({
    status: 'ok',
    method: 'GET',
    time: new Date().toISOString(),
    version: 'v53'
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
    
    // 액션 기반 라우팅
    if (body.action === 'updateHandEdit') {
      debugInfo.actionFound = true;
      Logger.log('Processing updateHandEdit for hand: ' + body.handNumber + ', checked: ' + body.checked);
      
      const result = updateHandEditStatus(body.handNumber, body.checked);
      Logger.log('updateHandEditStatus completed successfully');
      
      return _json({
        status: 'success',
        debug: debugInfo,
        ...result
      });
    } else {
      Logger.log('Action not matched, falling through to legacy handler');
      debugInfo.processingError = 'Action not matched: "' + body.action + '" !== "updateHandEdit"';
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
    
    // 데이터 검증
    if (!Array.isArray(rowsInput) || !rowsInput.length) {
      debugInfo.processingError = 'Missing rows data - this suggests the request was meant for updateHandEdit but action matching failed';
      Logger.log('ERROR: rows 데이터 누락 - action: "' + body.action + '", keys: ' + Object.keys(body));
      return _json({
        status: 'error',
        message: 'rows 데이터가 누락되었습니다.',
        debug: debugInfo
      });
    }
    
    // 이벤트 정규화 및 패딩
    const rows = _padRows(_normalizeEventRows(rowsInput));
    
    // HAND 정보 추출
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
    
    // 스프레드시트 열기
    const spreadsheet = _open();
    const handSheet = spreadsheet.getSheetByName('Hand') || spreadsheet.insertSheet('Hand');
    const indexSheet = spreadsheet.getSheetByName('Index') || spreadsheet.insertSheet('Index');
    const typeSheet = spreadsheet.getSheetByName('Type') || spreadsheet.insertSheet('Type');
    
    // ===== 1) Hand 시트에 데이터 기록 =====
    const startRow = handSheet.getLastRow() + 1;
    handSheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
    const endRow = startRow + rows.length - 1;
    
    // ===== 2) Index 시트 업데이트 =====
    _ensureIndexHeader(indexSheet);
    
    // 중복 체크
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
    
    // Index 데이터 추가
    const rawDate = indexMeta.handUpdatedAt || new Date().toISOString();
    const updatedAt = String(rawDate).split('T')[0];
    const editTime = new Date();
    
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
    
    indexSheet.appendRow(indexData);
    
    // ===== 3) Type 시트 업데이트 (칩 정보) =====
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
      version: 'v53'
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

function testGetRecentHands() {
  const hands = getRecentHands(5);
  console.log('최근 핸드:', hands);
  return hands;
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
      spreadsheetId: SHEET_ID
    };
  } catch (error) {
    console.error('연결 실패:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}