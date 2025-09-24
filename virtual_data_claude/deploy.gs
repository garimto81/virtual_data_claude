/**
 * Google Apps Script - 포커 핸드 로거 백엔드
 * Version: 35.0.0
 * V8 런타임 호환
 * 
 * 설정 방법:
 * 1. Google Apps Script 에디터에서 이 코드 붙여넣기
 * 2. 스프레드시트 ID는 자동으로 설정됨
 * 3. 배포 > 새 배포 > 웹 앱으로 배포
 * 4. 액세스 권한: 모든 사용자
 */

// 스프레드시트 설정
var SPREADSHEET_ID = '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U';
var SHEET_NAME = 'Hand';

/**
 * GET 요청 처리 - 데이터 조회
 */
function doGet(e) {
  var action = e.parameter.action || 'ping';
  var callback = e.parameter.callback;
  var result = {};
  
  try {
    Logger.log('GET Request - Action: ' + action);
    
    switch(action) {
      case 'ping':
        result = handlePing();
        break;
        
      case 'get':
      case 'getHistory':
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
        result = createBackup();
        break;
        
      case 'getSheet':
        result = getSheetInfo();
        break;
        
      default:
        result = {
          success: false,
          error: 'Unknown action: ' + action,
          availableActions: ['ping', 'get', 'getLatest', 'getStats', 'search', 'backup', 'getSheet']
        };
    }
    
  } catch(error) {
    Logger.log('Error in doGet: ' + error.toString());
    result = {
      success: false,
      error: error.toString(),
      message: error.message,
      action: action
    };
  }
  
  // JSONP 응답 처리
  if (callback) {
    var jsonpResponse = callback + '(' + JSON.stringify(result) + ')';
    return ContentService
      .createTextOutput(jsonpResponse)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  // 일반 JSON 응답
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST 요청 처리 - 데이터 저장/수정/삭제
 */
function doPost(e) {
  var result = {};
  
  try {
    var data = null;
    var action = null;
    
    // POST 데이터 파싱
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
        action = data.action;
      } catch(parseError) {
        // URL 인코딩된 데이터 처리
        action = e.parameter.action;
        data = e.parameter;
      }
    } else if (e.parameter) {
      action = e.parameter.action;
      data = e.parameter;
    }
    
    Logger.log('POST Request - Action: ' + action);
    
    if (!action) {
      throw new Error('No action specified');
    }
    
    switch(action) {
      case 'save':
      case 'saveHand':
        result = saveHand(data);
        break;
        
      case 'update':
      case 'updateHand':
        result = updateHand(data);
        break;
        
      case 'delete':
      case 'deleteHand':
        result = deleteHand(data);
        break;
        
      case 'bulkSave':
        result = bulkSaveHands(data);
        break;
        
      case 'restore':
        result = restoreBackup(data);
        break;
        
      case 'clearAll':
        result = clearAllData(data);
        break;
        
      default:
        result = {
          success: false,
          error: 'Unknown action: ' + action,
          availableActions: ['save', 'update', 'delete', 'bulkSave', 'restore', 'clearAll']
        };
    }
    
  } catch(error) {
    Logger.log('Error in doPost: ' + error.toString());
    result = {
      success: false,
      error: error.toString(),
      message: error.message
    };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 핑 테스트
 */
function handlePing() {
  return {
    success: true,
    message: 'Poker Hand Logger API is running',
    timestamp: new Date().toISOString(),
    version: '35.0.0',
    spreadsheetId: SPREADSHEET_ID,
    sheetName: SHEET_NAME
  };
}

/**
 * 스프레드시트 초기화 및 가져오기
 */
function getSheet() {
  try {
    var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      // 시트가 없으면 생성
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
        'SmallBlind',
        'BigBlind',
        'RawData'
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // 헤더 스타일 설정
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#2563eb')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      
      // 열 너비 조정
      sheet.setColumnWidth(1, 150);  // Timestamp
      sheet.setColumnWidth(2, 120);  // HandNumber
      sheet.setColumnWidth(3, 100);  // Table
      sheet.setColumnWidth(8, 300);  // Actions
      sheet.setColumnWidth(11, 200); // Notes
      sheet.setColumnWidth(15, 400); // RawData
      
      Logger.log('Created new sheet: ' + SHEET_NAME);
    }
    
    return sheet;
  } catch(error) {
    Logger.log('Error getting sheet: ' + error.toString());
    throw error;
  }
}

/**
 * 시트 정보 가져오기
 */
function getSheetInfo() {
  try {
    var sheet = getSheet();
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    
    return {
      success: true,
      info: {
        spreadsheetId: SPREADSHEET_ID,
        sheetName: SHEET_NAME,
        totalRows: lastRow,
        totalColumns: lastColumn,
        dataRows: Math.max(0, lastRow - 1),
        headers: lastRow > 0 ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : []
      }
    };
  } catch(error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 핸드 저장
 */
function saveHand(data) {
  try {
    var sheet = getSheet();
    var timestamp = new Date().toISOString();
    var handNumber = data.handNumber || generateHandNumber();
    
    // 데이터 행 생성
    var row = [
      timestamp,
      handNumber,
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
      data.smallBlind || '',
      data.bigBlind || '',
      JSON.stringify(data) // 전체 데이터 백업
    ];
    
    // 데이터 추가
    sheet.appendRow(row);
    
    Logger.log('Hand saved: ' + handNumber);
    
    return {
      success: true,
      handNumber: handNumber,
      timestamp: timestamp,
      message: 'Hand saved successfully'
    };
    
  } catch(error) {
    Logger.log('Error saving hand: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 핸드 업데이트
 */
function updateHand(data) {
  try {
    if (!data.handNumber) {
      throw new Error('Hand number is required for update');
    }
    
    var sheet = getSheet();
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    
    // 헤더 제외하고 검색
    for (var i = 1; i < values.length; i++) {
      if (values[i][1] == data.handNumber) {
        // 기존 타임스탬프 유지, 나머지 업데이트
        var updatedRow = [
          values[i][0], // 원래 timestamp 유지
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
          data.smallBlind || values[i][12],
          data.bigBlind || values[i][13],
          JSON.stringify(data)
        ];
        
        sheet.getRange(i + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
        
        Logger.log('Hand updated: ' + data.handNumber);
        
        return {
          success: true,
          handNumber: data.handNumber,
          message: 'Hand updated successfully'
        };
      }
    }
    
    return {
      success: false,
      error: 'Hand not found: ' + data.handNumber
    };
    
  } catch(error) {
    Logger.log('Error updating hand: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 핸드 삭제
 */
function deleteHand(data) {
  try {
    if (!data.handNumber) {
      throw new Error('Hand number is required for deletion');
    }
    
    var sheet = getSheet();
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    
    // 역순으로 검색 (삭제 시 인덱스 변경 방지)
    for (var i = values.length - 1; i >= 1; i--) {
      if (values[i][1] == data.handNumber) {
        sheet.deleteRow(i + 1);
        
        Logger.log('Hand deleted: ' + data.handNumber);
        
        return {
          success: true,
          handNumber: data.handNumber,
          message: 'Hand deleted successfully'
        };
      }
    }
    
    return {
      success: false,
      error: 'Hand not found: ' + data.handNumber
    };
    
  } catch(error) {
    Logger.log('Error deleting hand: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 핸드 히스토리 조회
 */
function getHandHistory(params) {
  try {
    var sheet = getSheet();
    var lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return {
        success: true,
        hands: [],
        total: 0,
        message: 'No hands found'
      };
    }
    
    // 데이터 가져오기 (헤더 제외)
    var dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    var values = dataRange.getValues();
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // 데이터 변환
    var hands = [];
    for (var i = 0; i < values.length; i++) {
      var hand = {};
      for (var j = 0; j < headers.length; j++) {
        var key = headers[j].toLowerCase().replace(/\s+/g, '');
        var value = values[i][j];
        
        // JSON 문자열 파싱
        if ((key === 'actions' || key === 'rawdata') && value) {
          try {
            hand[key] = JSON.parse(value);
          } catch(e) {
            hand[key] = value;
          }
        } else {
          hand[key] = value;
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
    
  } catch(error) {
    Logger.log('Error getting hand history: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
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
 * 통계 생성
 */
function getStatistics(params) {
  try {
    var history = getHandHistory(params || {});
    
    if (!history.success) {
      return history;
    }
    
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
      byDate: {},
      positions: ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB']
    };
    
    // 통계 계산
    hands.forEach(function(hand) {
      // 총 팟
      var pot = parseFloat(hand.pot) || 0;
      stats.totalPot += pot;
      
      // 승/패
      if (hand.result) {
        var resultLower = String(hand.result).toLowerCase();
        if (resultLower.indexOf('win') >= 0 || resultLower.indexOf('won') >= 0) {
          stats.winCount++;
        } else if (resultLower.indexOf('lose') >= 0 || resultLower.indexOf('lost') >= 0) {
          stats.loseCount++;
        }
      }
      
      // 포지션별
      if (hand.myposition) {
        var position = hand.myposition.toUpperCase();
        if (!stats.byPosition[position]) {
          stats.byPosition[position] = {
            count: 0,
            wins: 0,
            totalPot: 0
          };
        }
        stats.byPosition[position].count++;
        stats.byPosition[position].totalPot += pot;
        
        if (hand.result && hand.result.toLowerCase().indexOf('win') >= 0) {
          stats.byPosition[position].wins++;
        }
      }
      
      // 테이블별
      if (hand.table) {
        if (!stats.byTable[hand.table]) {
          stats.byTable[hand.table] = {
            count: 0,
            totalPot: 0
          };
        }
        stats.byTable[hand.table].count++;
        stats.byTable[hand.table].totalPot += pot;
      }
      
      // 날짜별
      if (hand.timestamp) {
        var date = new Date(hand.timestamp).toISOString().split('T')[0];
        if (!stats.byDate[date]) {
          stats.byDate[date] = {
            count: 0,
            totalPot: 0,
            wins: 0
          };
        }
        stats.byDate[date].count++;
        stats.byDate[date].totalPot += pot;
        
        if (hand.result && hand.result.toLowerCase().indexOf('win') >= 0) {
          stats.byDate[date].wins++;
        }
      }
    });
    
    // 비율 계산
    if (stats.winCount + stats.loseCount > 0) {
      stats.winRate = Math.round((stats.winCount / (stats.winCount + stats.loseCount)) * 100);
    }
    
    if (hands.length > 0) {
      stats.avgPot = Math.round(stats.totalPot / hands.length);
    }
    
    // 포지션별 승률 계산
    Object.keys(stats.byPosition).forEach(function(pos) {
      var posStats = stats.byPosition[pos];
      if (posStats.count > 0) {
        posStats.winRate = Math.round((posStats.wins / posStats.count) * 100);
        posStats.avgPot = Math.round(posStats.totalPot / posStats.count);
      }
    });
    
    return {
      success: true,
      stats: stats
    };
    
  } catch(error) {
    Logger.log('Error getting statistics: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 핸드 검색
 */
function searchHands(params) {
  try {
    var query = params.query || params.q || '';
    
    if (!query) {
      return {
        success: true,
        hands: [],
        total: 0,
        message: 'No search query provided'
      };
    }
    
    var history = getHandHistory({});
    
    if (!history.success) {
      return history;
    }
    
    var queryLower = query.toLowerCase();
    var results = history.hands.filter(function(hand) {
      // 모든 필드에서 검색
      for (var key in hand) {
        if (hand.hasOwnProperty(key) && hand[key]) {
          var value = typeof hand[key] === 'object' ? 
            JSON.stringify(hand[key]) : String(hand[key]);
          if (value.toLowerCase().indexOf(queryLower) >= 0) {
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
    
  } catch(error) {
    Logger.log('Error searching hands: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 백업 생성
 */
function createBackup() {
  try {
    var sheet = getSheet();
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    
    return {
      success: true,
      backup: {
        timestamp: new Date().toISOString(),
        version: '35.0.0',
        spreadsheetId: SPREADSHEET_ID,
        sheetName: SHEET_NAME,
        data: values,
        rows: values.length,
        columns: values[0] ? values[0].length : 0
      }
    };
    
  } catch(error) {
    Logger.log('Error creating backup: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 백업 복원
 */
function restoreBackup(data) {
  try {
    if (!data.backup || !data.backup.data) {
      throw new Error('Invalid backup data');
    }
    
    var sheet = getSheet();
    
    // 현재 데이터 백업
    var currentData = sheet.getDataRange().getValues();
    
    try {
      // 시트 클리어
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
      
      Logger.log('Backup restored successfully');
      
      return {
        success: true,
        message: 'Backup restored successfully',
        restoredRows: backupData.length,
        previousRows: currentData.length
      };
      
    } catch(restoreError) {
      // 복원 실패 시 원래 데이터로 롤백
      Logger.log('Restore failed, rolling back: ' + restoreError.toString());
      
      sheet.clear();
      if (currentData.length > 0 && currentData[0].length > 0) {
        sheet.getRange(1, 1, currentData.length, currentData[0].length)
          .setValues(currentData);
      }
      
      throw restoreError;
    }
    
  } catch(error) {
    Logger.log('Error restoring backup: ' + error.toString());
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
  try {
    if (!data.hands || !Array.isArray(data.hands)) {
      throw new Error('Invalid hands data');
    }
    
    var sheet = getSheet();
    var rows = [];
    var timestamp = new Date().toISOString();
    
    data.hands.forEach(function(hand) {
      var row = [
        timestamp,
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
        hand.smallBlind || '',
        hand.bigBlind || '',
        JSON.stringify(hand)
      ];
      rows.push(row);
    });
    
    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length)
        .setValues(rows);
    }
    
    Logger.log('Bulk saved ' + rows.length + ' hands');
    
    return {
      success: true,
      saved: rows.length,
      total: data.hands.length,
      message: rows.length + ' hands saved successfully'
    };
    
  } catch(error) {
    Logger.log('Error in bulk save: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 모든 데이터 삭제
 */
function clearAllData(data) {
  try {
    // 확인 코드 체크
    if (data.confirmCode !== 'DELETE_ALL_DATA') {
      return {
        success: false,
        error: 'Invalid confirmation code. Use confirmCode: "DELETE_ALL_DATA"'
      };
    }
    
    var sheet = getSheet();
    var lastRow = sheet.getLastRow();
    
    if (lastRow > 1) {
      // 헤더는 유지하고 데이터만 삭제
      sheet.deleteRows(2, lastRow - 1);
    }
    
    Logger.log('All data cleared');
    
    return {
      success: true,
      message: 'All data has been cleared',
      deletedRows: Math.max(0, lastRow - 1)
    };
    
  } catch(error) {
    Logger.log('Error clearing data: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 핸드 번호 생성
 */
function generateHandNumber() {
  return 'HAND_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9).toUpperCase();
}

/**
 * 테스트 함수
 */
function test() {
  Logger.log('===== 포커 핸드 로거 테스트 시작 =====');
  
  try {
    // 1. 핑 테스트
    var pingResult = handlePing();
    Logger.log('1. Ping Test: ' + (pingResult.success ? 'PASS' : 'FAIL'));
    Logger.log('   Version: ' + pingResult.version);
    
    // 2. 시트 정보 테스트
    var sheetInfo = getSheetInfo();
    Logger.log('2. Sheet Info Test: ' + (sheetInfo.success ? 'PASS' : 'FAIL'));
    Logger.log('   Total Rows: ' + sheetInfo.info.totalRows);
    
    // 3. 저장 테스트
    var testHand = {
      handNumber: 'TEST_' + Date.now(),
      table: 'Test Table',
      players: 6,
      myPosition: 'BTN',
      myCards: 'As Ks',
      communityCards: 'Ah Kh Qh 10h Jh',
      pot: 1000,
      result: 'Win',
      notes: 'Test hand - Royal Flush',
      smallBlind: 50,
      bigBlind: 100
    };
    
    var saveResult = saveHand(testHand);
    Logger.log('3. Save Test: ' + (saveResult.success ? 'PASS' : 'FAIL'));
    Logger.log('   Hand Number: ' + saveResult.handNumber);
    
    // 4. 조회 테스트
    var historyResult = getHandHistory({limit: 5});
    Logger.log('4. History Test: ' + (historyResult.success ? 'PASS' : 'FAIL'));
    Logger.log('   Total Hands: ' + historyResult.total);
    
    // 5. 통계 테스트
    var statsResult = getStatistics({});
    Logger.log('5. Statistics Test: ' + (statsResult.success ? 'PASS' : 'FAIL'));
    Logger.log('   Win Rate: ' + statsResult.stats.winRate + '%');
    
    // 6. 검색 테스트
    var searchResult = searchHands({query: 'Test'});
    Logger.log('6. Search Test: ' + (searchResult.success ? 'PASS' : 'FAIL'));
    Logger.log('   Found: ' + searchResult.total + ' hands');
    
    // 7. 업데이트 테스트
    if (saveResult.success) {
      testHand.handNumber = saveResult.handNumber;
      testHand.notes = 'Updated test hand';
      var updateResult = updateHand(testHand);
      Logger.log('7. Update Test: ' + (updateResult.success ? 'PASS' : 'FAIL'));
      
      // 8. 삭제 테스트
      var deleteResult = deleteHand({handNumber: saveResult.handNumber});
      Logger.log('8. Delete Test: ' + (deleteResult.success ? 'PASS' : 'FAIL'));
    }
    
    Logger.log('===== 테스트 완료 =====');
    Logger.log('모든 테스트가 성공적으로 완료되었습니다!');
    
  } catch(error) {
    Logger.log('테스트 중 오류 발생: ' + error.toString());
  }
}

/**
 * 수동 설정 함수 (필요시 실행)
 */
function setup() {
  try {
    var sheet = getSheet();
    Logger.log('Setup completed successfully');
    Logger.log('Spreadsheet ID: ' + SPREADSHEET_ID);
    Logger.log('Sheet Name: ' + SHEET_NAME);
    return true;
  } catch(error) {
    Logger.log('Setup failed: ' + error.toString());
    return false;
  }
}