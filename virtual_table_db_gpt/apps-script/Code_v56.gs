/****************************************************
 * Poker Hand Logger - Apps Script Backend v56
 * 완전히 재작성된 버전 - updateHandEdit 기능 포함
 * 
 * 스프레드시트 구조:
 * - Hand 시트: 포커 핸드 로우 데이터
 * - Index 시트: 핸드 인덱스 (17개 열)
 *   - E열(5번째): handEdit 체크박스
 *   - F열(6번째): handEditTime 타임스탬프
 * - Type 시트: 플레이어 정보
 ****************************************************/

const SHEET_ID = '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U';
const DEBUG = true; // 디버그 모드

// ===== 유틸리티 함수 =====

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _open() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function _log(message, data = null) {
  if (DEBUG) {
    if (data) {
      console.log(message, JSON.stringify(data));
    } else {
      console.log(message);
    }
  }
}

// ===== 요청 파싱 함수 (v56 개선) =====
function _parseRequestBody(e) {
  _log('=== _parseRequestBody 시작 ===');
  
  // e가 없으면 빈 객체 반환
  if (!e) {
    _log('❌ e가 undefined');
    return {};
  }
  
  // 1. FormData 방식 (payload 파라미터)
  if (e.parameter && e.parameter.payload) {
    _log('✅ FormData payload 발견:', e.parameter.payload);
    try {
      const parsed = JSON.parse(e.parameter.payload);
      _log('✅ 파싱 성공:', parsed);
      return parsed;
    } catch (err) {
      _log('❌ FormData 파싱 실패:', err.message);
    }
  }
  
  // 2. JSON Body 방식
  if (e.postData && e.postData.type === 'application/json') {
    _log('✅ JSON body 발견');
    try {
      const parsed = JSON.parse(e.postData.contents);
      _log('✅ JSON 파싱 성공:', parsed);
      return parsed;
    } catch (err) {
      _log('❌ JSON 파싱 실패:', err.message);
    }
  }
  
  // 3. URL 파라미터 방식 (fallback)
  if (e.parameter) {
    _log('URL 파라미터 사용:', e.parameter);
    return e.parameter;
  }
  
  _log('❌ 파싱할 데이터 없음');
  return {};
}

// ===== 핸드 편집 상태 업데이트 함수 (v56 핵심) =====
function updateHandEditStatus(handNumber, checked) {
  _log(`updateHandEditStatus 호출: 핸드 #${handNumber}, 체크: ${checked}`);
  
  try {
    const spreadsheet = _open();
    const indexSheet = spreadsheet.getSheetByName('Index');
    
    if (!indexSheet) {
      throw new Error('Index 시트를 찾을 수 없습니다');
    }
    
    const data = indexSheet.getDataRange().getValues();
    _log(`Index 시트 데이터 행 수: ${data.length}`);
    
    // 헤더 제외하고 검색
    for (let i = 1; i < data.length; i++) {
      const currentHandNumber = String(data[i][0]); // A열: handNumber
      
      if (currentHandNumber === String(handNumber)) {
        _log(`핸드 찾음: 행 ${i + 1}`);
        
        // E열 (5번째): handEdit 체크박스
        const checkboxRange = indexSheet.getRange(i + 1, 5);
        checkboxRange.setValue(checked ? true : false);
        
        // F열 (6번째): handEditTime
        const timeRange = indexSheet.getRange(i + 1, 6);
        if (checked) {
          timeRange.setValue(new Date());
        } else {
          timeRange.setValue('');
        }
        
        _log(`✅ 업데이트 완료`);
        
        return {
          success: true,
          handNumber: handNumber,
          checked: checked,
          editTime: checked ? new Date().toISOString() : null
        };
      }
    }
    
    throw new Error(`핸드 #${handNumber}를 찾을 수 없습니다`);
    
  } catch (error) {
    _log('❌ updateHandEditStatus 에러:', error.message);
    throw error;
  }
}

// ===== 메인 핸들러 =====

function doGet(e) {
  _log('=== doGet 호출됨 ===');
  
  return _json({
    status: 'ok',
    version: 'v56',
    timestamp: new Date().toISOString(),
    message: 'Poker Hand Logger API v56 - Ready'
  });
}

function doPost(e) {
  _log('=== doPost v56 시작 ===');
  
  try {
    // 요청 본문 파싱
    const body = _parseRequestBody(e);
    _log('파싱된 body:', body);
    
    // 빈 요청 체크
    if (!body || Object.keys(body).length === 0) {
      _log('❌ 빈 요청');
      return _json({
        status: 'error',
        message: '요청 데이터가 비어있습니다',
        version: 'v56'
      });
    }
    
    // ===== updateHandEdit 액션 처리 (최우선) =====
    if (body.action === 'updateHandEdit') {
      _log('📝 updateHandEdit 액션 감지');
      
      // 필수 파라미터 체크
      if (!body.handNumber) {
        return _json({
          status: 'error',
          message: 'handNumber가 필요합니다',
          version: 'v56'
        });
      }
      
      try {
        // 체크박스 업데이트 실행
        const result = updateHandEditStatus(
          body.handNumber,
          body.checked === true || body.checked === 'true'
        );
        
        _log('✅ updateHandEdit 성공:', result);
        return _json(result);
        
      } catch (error) {
        _log('❌ updateHandEdit 실패:', error.message);
        return _json({
          status: 'error',
          message: error.message,
          version: 'v56'
        });
      }
    }
    
    // ===== 기존 핸드 데이터 저장 로직 =====
    _log('기존 핸드 저장 로직 진입');
    
    const rowsInput = body.rows;
    const indexMeta = body.indexMeta || {};
    const typeUpdates = Array.isArray(body.typeUpdates) ? body.typeUpdates : [];
    
    // rows 데이터 검증
    if (!Array.isArray(rowsInput) || rowsInput.length === 0) {
      _log('❌ rows 데이터 누락');
      return _json({
        status: 'error',
        message: 'rows 누락',
        version: 'v56'
      });
    }
    
    // 데이터 처리
    const rows = _padRows(_normalizeEventRows(rowsInput));
    
    // 핸드 정보 추출
    let handNumber = '';
    for (const row of rows) {
      if (row[1] === 'HAND') {
        handNumber = String(row[2] || '');
        break;
      }
    }
    
    // 스프레드시트 열기
    const spreadsheet = _open();
    const handSheet = spreadsheet.getSheetByName('Hand') || spreadsheet.insertSheet('Hand');
    const indexSheet = spreadsheet.getSheetByName('Index') || spreadsheet.insertSheet('Index');
    
    // Hand 시트에 저장
    const startRow = handSheet.getLastRow() + 1;
    handSheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
    const endRow = startRow + rows.length - 1;
    
    // Index 시트 업데이트
    _ensureIndexHeader(indexSheet);
    
    // 중복 체크
    const existingData = indexSheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (String(existingData[i][0]) === handNumber) {
        return _json({
          status: 'duplicate',
          message: `핸드 #${handNumber}는 이미 존재합니다`,
          handNumber: handNumber,
          version: 'v56'
        });
      }
    }
    
    // Index 데이터 추가
    const indexData = [
      handNumber,
      startRow,
      endRow,
      indexMeta.handUpdatedAt || new Date().toISOString().split('T')[0],
      false, // handEdit 초기값
      '',    // handEditTime 초기값
      indexMeta.label || '',
      indexMeta.table || '',
      indexMeta.tableUpdatedAt || '',
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
    
    return _json({
      status: 'success',
      handNumber: handNumber,
      rowsAdded: rows.length,
      version: 'v56'
    });
    
  } catch (error) {
    _log('❌ doPost 에러:', error.message);
    _log('에러 스택:', error.stack);
    
    return _json({
      status: 'error',
      message: error.message,
      stack: error.stack,
      version: 'v56'
    });
  }
}

// ===== 헬퍼 함수들 (기존 코드에서 가져옴) =====

function _padRows(rows) {
  if (!Array.isArray(rows)) return [];
  
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
  }
}

// ===== 테스트 함수 =====

function testUpdateHandEdit() {
  _log('=== testUpdateHandEdit 시작 ===');
  
  // 테스트용 요청 생성
  const e = {
    parameter: {
      payload: JSON.stringify({
        action: 'updateHandEdit',
        handNumber: '1',
        checked: true
      })
    }
  };
  
  // doPost 호출
  const result = doPost(e);
  const content = result.getContent();
  
  _log('테스트 결과:', content);
  
  const parsed = JSON.parse(content);
  if (parsed.success === true) {
    _log('✅ 테스트 성공!');
  } else {
    _log('❌ 테스트 실패:', parsed.message);
  }
  
  return parsed;
}

function testConnection() {
  try {
    const ss = _open();
    const sheets = ss.getSheets().map(s => s.getName());
    
    _log('연결 성공! 시트 목록:', sheets);
    
    return {
      status: 'success',
      sheets: sheets,
      version: 'v56'
    };
  } catch (error) {
    _log('연결 실패:', error.message);
    return {
      status: 'error',
      message: error.message
    };
  }
}