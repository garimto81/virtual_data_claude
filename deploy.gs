/**
 * Google Apps Script - 포커 핸드 로거 백엔드
 * Version: 35.0.0
 * V8 런타임 호환
 */

// 스프레드시트 ID 설정
var SPREADSHEET_ID = '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U';
var SHEET_NAME = 'Hand';

/**
 * GET 요청 처리
 */
function doGet(e) {
  var action = e.parameter.action;
  var callback = e.parameter.callback;
  var result = {};
  
  try {
    switch(action) {
      case 'get':
        result = getHandHistory(e.parameter);
        break;
      case 'getLatest':
        result = getLatestHands(e.parameter);
        break;
      case 'getStats':
        result = getStatistics(e.parameter);
        break;
      case 'search':
        result = searchHands(e.parameter);
        break;
      case 'backup':
        result = getBackup();
        break;
      case 'ping':
        result = { status: 'ok', timestamp: new Date().toISOString() };
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
    
    result.success = !result.error;
    
  } catch(error) {
    result = {
      success: false,
      error: error.toString(),
      stack: error.stack
    };
  }
  
  // JSONP 응답
  if (callback) {
    var jsonp = callback + '(' + JSON.stringify(result) + ')';
    return ContentService
      .createTextOutput(jsonp)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  // JSON 응답
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST 요청 처리
 */
function doPost(e) {
  var result = {};
  
  try {
    var data = null;
    
    // POST 데이터 파싱
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch(parseError) {
        // URL 인코딩된 데이터 처리
        data = e.parameter;
      }
    } else {
      data = e.parameter;
    }
    
    var action = data.action || e.parameter.action;
    
    switch(action) {
      case 'save':
        result = saveHand(data);
        break;
      case 'update':
        result = updateHand(data);
        break;
      case 'delete':
        result = deleteHand(data);
        break;
      case 'bulkSave':
        result = bulkSaveHands(data);
        break;
      case 'restore':
        result = restoreBackup(data);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
    
    result.success = !result.error;
    
  } catch(error) {
    result = {
      success: false,
      error: error.toString(),
      stack: error.stack
    };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 스프레드시트 초기화
 */
function initSpreadsheet() {
  var spreadsheet;
  
  try {
    spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch(e) {
    // 새 스프레드시트 생성
    spreadsheet = SpreadsheetApp.create('Poker Hand Logger Data');
    SPREADSHEET_ID = spreadsheet.getId();
    Logger.log('Created new spreadsheet: ' + SPREADSHEET_ID);
  }
  
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    
    // 헤더 설정
    var headers = [
      'Timestamp',
      'HandNumber',
      'Table',
      'Players',
      'MyPosition',
      'MyCards',
      'CommunityCards',
      'Actions',
      'Pot',
      'Result',
      'Notes',
      'Tags',
      'Data'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#2563eb')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
  }
  
  return sheet;
}

/**
 * 핸드 저장
 */
function saveHand(data) {
  var sheet = initSpreadsheet();
  
  var row = [
    new Date().toISOString(),
    data.handNumber || generateHandNumber(),
    data.table || '',
    data.players || '',
    data.myPosition || '',
    data.myCards || '',
    data.communityCards || '',
    JSON.stringify(data.actions || []),
    data.pot || 0,
    data.result || '',
    data.notes || '',
    data.tags || '',
    JSON.stringify(data)
  ];
  
  sheet.appendRow(row);
  
  return {
    success: true,
    handNumber: row[1],
    timestamp: row[0]
  };
}

/**
 * 핸드 업데이트
 */
function updateHand(data) {
  var sheet = initSpreadsheet();
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  for (var i = 1; i < values.length; i++) {
    if (values[i][1] == data.handNumber) {
      values[i] = [
        values[i][0], // Timestamp 유지
        data.handNumber,
        data.table || values[i][2],
        data.players || values[i][3],
        data.myPosition || values[i][4],
        data.myCards || values[i][5],
        data.communityCards || values[i][6],
        JSON.stringify(data.actions || JSON.parse(values[i][7] || '[]')),
        data.pot || values[i][8],
        data.result || values[i][9],
        data.notes || values[i][10],
        data.tags || values[i][11],
        JSON.stringify(data)
      ];
      
      sheet.getRange(i + 1, 1, 1, values[i].length).setValues([values[i]]);
      
      return {
        success: true,
        handNumber: data.handNumber,
        updated: true
      };
    }
  }
  
  return {
    success: false,
    error: 'Hand not found: ' + data.handNumber
  };
}

/**
 * 핸드 삭제
 */
function deleteHand(data) {
  var sheet = initSpreadsheet();
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  for (var i = values.length - 1; i >= 1; i--) {
    if (values[i][1] == data.handNumber) {
      sheet.deleteRow(i + 1);
      return {
        success: true,
        handNumber: data.handNumber,
        deleted: true
      };
    }
  }
  
  return {
    success: false,
    error: 'Hand not found: ' + data.handNumber
  };
}

/**
 * 핸드 히스토리 조회
 */
function getHandHistory(params) {
  var sheet = initSpreadsheet();
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  if (values.length <= 1) {
    return {
      success: true,
      hands: [],
      total: 0
    };
  }
  
  var hands = [];
  var headers = values[0];
  
  // 데이터 변환
  for (var i = 1; i < values.length; i++) {
    var hand = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      var value = values[i][j];
      
      // JSON 문자열 파싱
      if (key === 'Actions' || key === 'Data') {
        try {
          hand[key.toLowerCase()] = JSON.parse(value || '{}');
        } catch(e) {
          hand[key.toLowerCase()] = value;
        }
      } else {
        hand[key.toLowerCase()] = value;
      }
    }
    hands.push(hand);
  }
  
  // 필터링
  if (params.table) {
    hands = hands.filter(function(h) { 
      return h.table == params.table; 
    });
  }
  
  if (params.startDate) {
    var startDate = new Date(params.startDate);
    hands = hands.filter(function(h) { 
      return new Date(h.timestamp) >= startDate; 
    });
  }
  
  if (params.endDate) {
    var endDate = new Date(params.endDate);
    hands = hands.filter(function(h) { 
      return new Date(h.timestamp) <= endDate; 
    });
  }
  
  // 정렬 (최신순)
  hands.sort(function(a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  
  // 페이징
  var limit = parseInt(params.limit) || 100;
  var offset = parseInt(params.offset) || 0;
  var paged = hands.slice(offset, offset + limit);
  
  return {
    success: true,
    hands: paged,
    total: hands.length,
    offset: offset,
    limit: limit
  };
}

/**
 * 최근 핸드 조회
 */
function getLatestHands(params) {
  var limit = parseInt(params.limit) || 10;
  params.limit = limit;
  params.offset = 0;
  
  return getHandHistory(params);
}

/**
 * 통계 조회
 */
function getStatistics(params) {
  var history = getHandHistory(params);
  var hands = history.hands;
  
  var stats = {
    totalHands: hands.length,
    totalPot: 0,
    winCount: 0,
    loseCount: 0,
    winRate: 0,
    avgPot: 0,
    byPosition: {},
    byTable: {},
    byDate: {}
  };
  
  hands.forEach(function(hand) {
    // 총 팟 계산
    stats.totalPot += parseFloat(hand.pot) || 0;
    
    // 승/패 카운트
    if (hand.result) {
      if (hand.result.toLowerCase().indexOf('win') >= 0) {
        stats.winCount++;
      } else if (hand.result.toLowerCase().indexOf('lose') >= 0) {
        stats.loseCount++;
      }
    }
    
    // 포지션별 통계
    if (hand.myposition) {
      if (!stats.byPosition[hand.myposition]) {
        stats.byPosition[hand.myposition] = { count: 0, wins: 0 };
      }
      stats.byPosition[hand.myposition].count++;
      if (hand.result && hand.result.toLowerCase().indexOf('win') >= 0) {
        stats.byPosition[hand.myposition].wins++;
      }
    }
    
    // 테이블별 통계
    if (hand.table) {
      if (!stats.byTable[hand.table]) {
        stats.byTable[hand.table] = { count: 0, totalPot: 0 };
      }
      stats.byTable[hand.table].count++;
      stats.byTable[hand.table].totalPot += parseFloat(hand.pot) || 0;
    }
    
    // 날짜별 통계
    if (hand.timestamp) {
      var date = new Date(hand.timestamp).toISOString().split('T')[0];
      if (!stats.byDate[date]) {
        stats.byDate[date] = { count: 0, totalPot: 0 };
      }
      stats.byDate[date].count++;
      stats.byDate[date].totalPot += parseFloat(hand.pot) || 0;
    }
  });
  
  // 승률 계산
  if (stats.winCount + stats.loseCount > 0) {
    stats.winRate = (stats.winCount / (stats.winCount + stats.loseCount) * 100).toFixed(2);
  }
  
  // 평균 팟 계산
  if (hands.length > 0) {
    stats.avgPot = (stats.totalPot / hands.length).toFixed(2);
  }
  
  return {
    success: true,
    stats: stats
  };
}

/**
 * 핸드 검색
 */
function searchHands(params) {
  var history = getHandHistory({});
  var hands = history.hands;
  var query = params.query;
  
  if (!query) {
    return {
      success: true,
      hands: [],
      total: 0
    };
  }
  
  query = query.toLowerCase();
  
  var results = hands.filter(function(hand) {
    // 모든 필드에서 검색
    for (var key in hand) {
      if (hand[key]) {
        var value = typeof hand[key] === 'object' ? 
          JSON.stringify(hand[key]) : String(hand[key]);
        if (value.toLowerCase().indexOf(query) >= 0) {
          return true;
        }
      }
    }
    return false;
  });
  
  return {
    success: true,
    hands: results,
    total: results.length,
    query: query
  };
}

/**
 * 백업 생성
 */
function getBackup() {
  var sheet = initSpreadsheet();
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  return {
    success: true,
    backup: {
      timestamp: new Date().toISOString(),
      version: '35.0.0',
      data: values,
      rows: values.length,
      columns: values[0] ? values[0].length : 0
    }
  };
}

/**
 * 백업 복원
 */
function restoreBackup(data) {
  if (!data.backup || !data.backup.data) {
    return {
      success: false,
      error: 'Invalid backup data'
    };
  }
  
  var sheet = initSpreadsheet();
  
  // 기존 데이터 백업
  var currentData = sheet.getDataRange().getValues();
  
  try {
    // 시트 초기화
    sheet.clear();
    
    // 백업 데이터 복원
    var backupData = data.backup.data;
    if (backupData.length > 0 && backupData[0].length > 0) {
      sheet.getRange(1, 1, backupData.length, backupData[0].length)
        .setValues(backupData);
      
      // 헤더 스타일 복원
      sheet.getRange(1, 1, 1, backupData[0].length)
        .setBackground('#2563eb')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
    }
    
    return {
      success: true,
      restored: true,
      rows: backupData.length,
      previousRows: currentData.length
    };
    
  } catch(error) {
    // 복원 실패 시 이전 데이터로 롤백
    sheet.clear();
    if (currentData.length > 0 && currentData[0].length > 0) {
      sheet.getRange(1, 1, currentData.length, currentData[0].length)
        .setValues(currentData);
    }
    
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 대량 저장
 */
function bulkSaveHands(data) {
  if (!data.hands || !Array.isArray(data.hands)) {
    return {
      success: false,
      error: 'Invalid hands data'
    };
  }
  
  var sheet = initSpreadsheet();
  var rows = [];
  var savedCount = 0;
  
  data.hands.forEach(function(hand) {
    var row = [
      new Date().toISOString(),
      hand.handNumber || generateHandNumber(),
      hand.table || '',
      hand.players || '',
      hand.myPosition || '',
      hand.myCards || '',
      hand.communityCards || '',
      JSON.stringify(hand.actions || []),
      hand.pot || 0,
      hand.result || '',
      hand.notes || '',
      hand.tags || '',
      JSON.stringify(hand)
    ];
    rows.push(row);
    savedCount++;
  });
  
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length)
      .setValues(rows);
  }
  
  return {
    success: true,
    saved: savedCount,
    total: data.hands.length
  };
}

/**
 * 핸드 번호 생성
 */
function generateHandNumber() {
  return 'HAND_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 테스트 함수
 */
function test() {
  Logger.log('Testing Poker Hand Logger Backend...');
  
  // 테스트 데이터
  var testHand = {
    action: 'save',
    handNumber: 'TEST_' + Date.now(),
    table: 'Test Table',
    players: 6,
    myPosition: 'BTN',
    myCards: 'AsKs',
    communityCards: 'AhKhQh',
    pot: 100,
    result: 'Win',
    notes: 'Test hand'
  };
  
  // 저장 테스트
  var saveResult = saveHand(testHand);
  Logger.log('Save result: ' + JSON.stringify(saveResult));
  
  // 조회 테스트
  var historyResult = getHandHistory({limit: 10});
  Logger.log('History result: ' + JSON.stringify(historyResult));
  
  // 통계 테스트
  var statsResult = getStatistics({});
  Logger.log('Stats result: ' + JSON.stringify(statsResult));
  
  Logger.log('Test completed successfully!');
}