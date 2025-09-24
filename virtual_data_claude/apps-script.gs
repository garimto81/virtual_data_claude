/**
 * 포커 핸드 로거 v35 - Google Apps Script Backend
 * 
 * 이 스크립트는 Google Sheets를 데이터베이스로 사용하여
 * 포커 핸드 기록을 관리하는 백엔드 API를 제공합니다.
 * 
 * @version 35.0.0
 * @author Claude Assistant
 */

// ===========================
// 설정 상수
// ===========================
const CONFIG = {
  SPREADSHEET_ID: '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U',
  SHEET_NAME: 'Hand',
  MAX_ROWS: 10000,
  CACHE_DURATION: 300, // 5분
  VERSION: '35.0.0'
};

// 열 인덱스 매핑 (1부터 시작)
const COLUMNS = {
  TIMESTAMP: 1,
  HAND_NUMBER: 2,
  TABLE_NAME: 3,
  SMALL_BLIND: 4,
  BIG_BLIND: 5,
  MY_POSITION: 6,
  MY_CARDS: 7,
  FLOP: 8,
  TURN: 9,
  RIVER: 10,
  PREFLOP_ACTION: 11,
  FLOP_ACTION: 12,
  TURN_ACTION: 13,
  RIVER_ACTION: 14,
  POT_SIZE: 15,
  RESULT: 16,
  PROFIT_LOSS: 17,
  NOTES: 18,
  PLAYERS_COUNT: 19,
  SHOWDOWN_CARDS: 20
};

// ===========================
// 메인 엔트리 포인트
// ===========================

/**
 * GET 요청 처리
 */
function doGet(e) {
  console.log('GET 요청 받음:', JSON.stringify(e.parameter));
  
  try {
    const params = e.parameter;
    const action = params.action || 'ping';
    const callback = params.callback || null;
    
    let response;
    
    switch(action) {
      case 'ping':
        response = handlePing();
        break;
        
      case 'getStats':
        response = handleGetStats();
        break;
        
      case 'getLatest':
        response = handleGetLatest(params.limit);
        break;
        
      case 'getHand':
        response = handleGetHand(params.handNumber);
        break;
        
      case 'search':
        response = handleSearch(params);
        break;
        
      case 'backup':
        response = handleBackup();
        break;
        
      default:
        response = {
          success: false,
          error: `알 수 없는 액션: ${action}`
        };
    }
    
    // JSONP 콜백 처리
    if (callback) {
      return ContentService
        .createTextOutput(`${callback}(${JSON.stringify(response)})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    // 일반 JSON 응답
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('GET 처리 중 오류:', error);
    const errorResponse = {
      success: false,
      error: error.toString(),
      stack: error.stack
    };
    
    if (e.parameter.callback) {
      return ContentService
        .createTextOutput(`${e.parameter.callback}(${JSON.stringify(errorResponse)})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POST 요청 처리
 */
function doPost(e) {
  console.log('POST 요청 받음');
  
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || '';
    
    let response;
    
    switch(action) {
      case 'saveHand':
        response = handleSaveHand(data.hand);
        break;
        
      case 'updateHand':
        response = handleUpdateHand(data.handNumber, data.updates);
        break;
        
      case 'deleteHand':
        response = handleDeleteHand(data.handNumber);
        break;
        
      case 'bulkSave':
        response = handleBulkSave(data.hands);
        break;
        
      case 'restore':
        response = handleRestore(data.backup);
        break;
        
      default:
        response = {
          success: false,
          error: `알 수 없는 액션: ${action}`
        };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('POST 처리 중 오류:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        stack: error.stack
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===========================
// 핸들러 함수들
// ===========================

/**
 * 연결 테스트
 */
function handlePing() {
  console.log('Ping 요청 처리');
  return {
    success: true,
    message: '포커 핸드 로거 API v' + CONFIG.VERSION,
    timestamp: new Date().toISOString(),
    spreadsheetId: CONFIG.SPREADSHEET_ID,
    sheetName: CONFIG.SHEET_NAME
  };
}

/**
 * 통계 데이터 조회
 */
function handleGetStats() {
  console.log('통계 데이터 조회 시작');
  
  try {
    const sheet = getSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return {
        success: true,
        stats: getEmptyStats()
      };
    }
    
    // 데이터 범위 가져오기
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 20);
    const data = dataRange.getValues();
    
    // 통계 계산
    const stats = calculateStats(data);
    
    console.log('통계 계산 완료:', JSON.stringify(stats));
    
    return {
      success: true,
      stats: stats
    };
    
  } catch (error) {
    console.error('통계 조회 오류:', error);
    throw error;
  }
}

/**
 * 최근 핸드 조회
 */
function handleGetLatest(limit = 10) {
  console.log(`최근 ${limit}개 핸드 조회 시작`);
  
  try {
    const sheet = getSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return {
        success: true,
        hands: []
      };
    }
    
    // 조회할 행 수 계산
    const numRows = Math.min(parseInt(limit) || 10, lastRow - 1);
    const startRow = Math.max(2, lastRow - numRows + 1);
    
    // 데이터 가져오기
    const dataRange = sheet.getRange(startRow, 1, numRows, 20);
    const data = dataRange.getValues();
    
    // 데이터를 객체 배열로 변환 (최신순으로 정렬)
    const hands = data.map(rowToHand).reverse();
    
    console.log(`${hands.length}개 핸드 조회 완료`);
    
    return {
      success: true,
      hands: hands,
      total: lastRow - 1
    };
    
  } catch (error) {
    console.error('최근 핸드 조회 오류:', error);
    throw error;
  }
}

/**
 * 특정 핸드 조회
 */
function handleGetHand(handNumber) {
  console.log('핸드 조회:', handNumber);
  
  try {
    const sheet = getSheet();
    const row = findHandRow(sheet, handNumber);
    
    if (!row) {
      return {
        success: false,
        error: '핸드를 찾을 수 없습니다'
      };
    }
    
    const data = sheet.getRange(row, 1, 1, 20).getValues()[0];
    const hand = rowToHand(data);
    
    return {
      success: true,
      hand: hand
    };
    
  } catch (error) {
    console.error('핸드 조회 오류:', error);
    throw error;
  }
}

/**
 * 핸드 검색
 */
function handleSearch(params) {
  console.log('검색 요청:', JSON.stringify(params));
  
  try {
    const sheet = getSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return {
        success: true,
        hands: [],
        total: 0
      };
    }
    
    // 모든 데이터 가져오기
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 20);
    const data = dataRange.getValues();
    
    // 필터링
    let filtered = data;
    
    if (params.position) {
      filtered = filtered.filter(row => row[COLUMNS.MY_POSITION - 1] === params.position);
    }
    
    if (params.dateFrom) {
      const fromDate = new Date(params.dateFrom);
      filtered = filtered.filter(row => new Date(row[COLUMNS.TIMESTAMP - 1]) >= fromDate);
    }
    
    if (params.dateTo) {
      const toDate = new Date(params.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(row => new Date(row[COLUMNS.TIMESTAMP - 1]) <= toDate);
    }
    
    if (params.result) {
      filtered = filtered.filter(row => row[COLUMNS.RESULT - 1] === params.result);
    }
    
    // 결과 변환
    const hands = filtered.map(rowToHand);
    
    // 정렬 (최신순)
    hands.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // 페이징
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.pageSize) || 50;
    const start = (page - 1) * pageSize;
    const paged = hands.slice(start, start + pageSize);
    
    return {
      success: true,
      hands: paged,
      total: hands.length,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(hands.length / pageSize)
    };
    
  } catch (error) {
    console.error('검색 오류:', error);
    throw error;
  }
}

/**
 * 핸드 저장
 */
function handleSaveHand(hand) {
  console.log('핸드 저장:', JSON.stringify(hand));
  
  try {
    const sheet = getSheet();
    
    // 핸드 번호 생성 (타임스탬프 기반)
    if (!hand.handnumber) {
      hand.handnumber = 'H' + Date.now();
    }
    
    // 타임스탬프 설정
    if (!hand.timestamp) {
      hand.timestamp = new Date().toISOString();
    }
    
    // 행 데이터 준비
    const rowData = handToRow(hand);
    
    // 시트에 추가
    sheet.appendRow(rowData);
    
    console.log('핸드 저장 완료:', hand.handnumber);
    
    return {
      success: true,
      handNumber: hand.handnumber,
      message: '핸드가 성공적으로 저장되었습니다'
    };
    
  } catch (error) {
    console.error('핸드 저장 오류:', error);
    throw error;
  }
}

/**
 * 핸드 수정
 */
function handleUpdateHand(handNumber, updates) {
  console.log('핸드 수정:', handNumber);
  
  try {
    const sheet = getSheet();
    const row = findHandRow(sheet, handNumber);
    
    if (!row) {
      return {
        success: false,
        error: '핸드를 찾을 수 없습니다'
      };
    }
    
    // 기존 데이터 가져오기
    const existingData = sheet.getRange(row, 1, 1, 20).getValues()[0];
    const existingHand = rowToHand(existingData);
    
    // 업데이트 병합
    const updatedHand = { ...existingHand, ...updates };
    updatedHand.timestamp = existingHand.timestamp; // 타임스탬프는 유지
    updatedHand.handnumber = handNumber; // 핸드 번호는 유지
    
    // 행 데이터 준비
    const rowData = handToRow(updatedHand);
    
    // 시트 업데이트
    sheet.getRange(row, 1, 1, 20).setValues([rowData]);
    
    console.log('핸드 수정 완료');
    
    return {
      success: true,
      message: '핸드가 성공적으로 수정되었습니다'
    };
    
  } catch (error) {
    console.error('핸드 수정 오류:', error);
    throw error;
  }
}

/**
 * 핸드 삭제
 */
function handleDeleteHand(handNumber) {
  console.log('핸드 삭제:', handNumber);
  
  try {
    const sheet = getSheet();
    const row = findHandRow(sheet, handNumber);
    
    if (!row) {
      return {
        success: false,
        error: '핸드를 찾을 수 없습니다'
      };
    }
    
    // 행 삭제
    sheet.deleteRow(row);
    
    console.log('핸드 삭제 완료');
    
    return {
      success: true,
      message: '핸드가 성공적으로 삭제되었습니다'
    };
    
  } catch (error) {
    console.error('핸드 삭제 오류:', error);
    throw error;
  }
}

/**
 * 대량 저장
 */
function handleBulkSave(hands) {
  console.log(`대량 저장: ${hands.length}개 핸드`);
  
  try {
    const sheet = getSheet();
    const rows = [];
    
    for (const hand of hands) {
      // 핸드 번호 생성
      if (!hand.handnumber) {
        hand.handnumber = 'H' + Date.now() + Math.random().toString(36).substr(2, 9);
      }
      
      // 타임스탬프 설정
      if (!hand.timestamp) {
        hand.timestamp = new Date().toISOString();
      }
      
      rows.push(handToRow(hand));
    }
    
    // 시트에 추가
    if (rows.length > 0) {
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow + 1, 1, rows.length, 20).setValues(rows);
    }
    
    console.log('대량 저장 완료');
    
    return {
      success: true,
      count: hands.length,
      message: `${hands.length}개 핸드가 저장되었습니다`
    };
    
  } catch (error) {
    console.error('대량 저장 오류:', error);
    throw error;
  }
}

/**
 * 백업 생성
 */
function handleBackup() {
  console.log('백업 생성 시작');
  
  try {
    const sheet = getSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return {
        success: true,
        backup: {
          version: CONFIG.VERSION,
          timestamp: new Date().toISOString(),
          hands: []
        }
      };
    }
    
    // 모든 데이터 가져오기
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 20);
    const data = dataRange.getValues();
    
    // 객체 배열로 변환
    const hands = data.map(rowToHand);
    
    console.log(`백업 생성 완료: ${hands.length}개 핸드`);
    
    return {
      success: true,
      backup: {
        version: CONFIG.VERSION,
        timestamp: new Date().toISOString(),
        spreadsheetId: CONFIG.SPREADSHEET_ID,
        sheetName: CONFIG.SHEET_NAME,
        count: hands.length,
        hands: hands
      }
    };
    
  } catch (error) {
    console.error('백업 생성 오류:', error);
    throw error;
  }
}

/**
 * 백업 복원
 */
function handleRestore(backup) {
  console.log('백업 복원 시작');
  
  try {
    const sheet = getSheet();
    
    // 기존 데이터 삭제 (헤더 제외)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    
    // 백업 데이터 복원
    if (backup.hands && backup.hands.length > 0) {
      const rows = backup.hands.map(handToRow);
      sheet.getRange(2, 1, rows.length, 20).setValues(rows);
    }
    
    console.log(`백업 복원 완료: ${backup.hands ? backup.hands.length : 0}개 핸드`);
    
    return {
      success: true,
      restored: backup.hands ? backup.hands.length : 0,
      message: '백업이 성공적으로 복원되었습니다'
    };
    
  } catch (error) {
    console.error('백업 복원 오류:', error);
    throw error;
  }
}

// ===========================
// 유틸리티 함수들
// ===========================

/**
 * 시트 가져오기
 */
function getSheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    // 시트가 없으면 생성
    if (!sheet) {
      console.log('시트 생성:', CONFIG.SHEET_NAME);
      sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
      initializeSheet(sheet);
    }
    
    // 헤더가 없으면 추가
    const lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      initializeSheet(sheet);
    }
    
    return sheet;
  } catch (error) {
    console.error('시트 가져오기 오류:', error);
    throw new Error('스프레드시트에 접근할 수 없습니다: ' + error.toString());
  }
}

/**
 * 시트 초기화
 */
function initializeSheet(sheet) {
  const headers = [
    'Timestamp',
    'Hand Number',
    'Table Name',
    'Small Blind',
    'Big Blind',
    'My Position',
    'My Cards',
    'Flop',
    'Turn',
    'River',
    'Preflop Action',
    'Flop Action',
    'Turn Action',
    'River Action',
    'Pot Size',
    'Result',
    'Profit/Loss',
    'Notes',
    'Players Count',
    'Showdown Cards'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  console.log('시트 헤더 초기화 완료');
}

/**
 * 핸드 찾기
 */
function findHandRow(sheet, handNumber) {
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) return null;
  
  const handNumbers = sheet.getRange(2, COLUMNS.HAND_NUMBER, lastRow - 1, 1).getValues();
  
  for (let i = 0; i < handNumbers.length; i++) {
    if (handNumbers[i][0] === handNumber) {
      return i + 2; // 행 번호는 1부터 시작, 헤더 제외
    }
  }
  
  return null;
}

/**
 * 행 데이터를 핸드 객체로 변환
 */
function rowToHand(row) {
  return {
    timestamp: row[0] || '',
    handnumber: row[1] || '',
    table: row[2] || '',
    smallblind: row[3] || 0,
    bigblind: row[4] || 0,
    myposition: row[5] || '',
    mycards: row[6] || '',
    flop: row[7] || '',
    turn: row[8] || '',
    river: row[9] || '',
    preflopaction: row[10] || '',
    flopaction: row[11] || '',
    turnaction: row[12] || '',
    riveraction: row[13] || '',
    pot: row[14] || 0,
    result: row[15] || '',
    profitloss: row[16] || 0,
    notes: row[17] || '',
    playerscount: row[18] || 0,
    showdowncards: row[19] || ''
  };
}

/**
 * 핸드 객체를 행 데이터로 변환
 */
function handToRow(hand) {
  return [
    hand.timestamp || new Date().toISOString(),
    hand.handnumber || '',
    hand.table || '',
    hand.smallblind || 0,
    hand.bigblind || 0,
    hand.myposition || '',
    hand.mycards || '',
    hand.flop || '',
    hand.turn || '',
    hand.river || '',
    hand.preflopaction || '',
    hand.flopaction || '',
    hand.turnaction || '',
    hand.riveraction || '',
    hand.pot || 0,
    hand.result || '',
    hand.profitloss || 0,
    hand.notes || '',
    hand.playerscount || 0,
    hand.showdowncards || ''
  ];
}

/**
 * 통계 계산
 */
function calculateStats(data) {
  const stats = {
    totalHands: data.length,
    totalProfit: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    avgPot: 0,
    largestPot: 0,
    smallestPot: Infinity,
    byPosition: {},
    byDate: {},
    byTable: {},
    recentTrend: []
  };
  
  let totalPot = 0;
  
  for (const row of data) {
    const hand = rowToHand(row);
    
    // 결과별 집계
    if (hand.result === 'Win') stats.wins++;
    else if (hand.result === 'Lose') stats.losses++;
    else if (hand.result === 'Tie') stats.ties++;
    
    // 수익 집계
    const profit = parseFloat(hand.profitloss) || 0;
    stats.totalProfit += profit;
    
    // 팟 집계
    const pot = parseFloat(hand.pot) || 0;
    totalPot += pot;
    if (pot > stats.largestPot) stats.largestPot = pot;
    if (pot < stats.smallestPot && pot > 0) stats.smallestPot = pot;
    
    // 포지션별 집계
    const position = hand.myposition || 'Unknown';
    if (!stats.byPosition[position]) {
      stats.byPosition[position] = {
        count: 0,
        wins: 0,
        profit: 0,
        avgPot: 0
      };
    }
    stats.byPosition[position].count++;
    if (hand.result === 'Win') stats.byPosition[position].wins++;
    stats.byPosition[position].profit += profit;
    
    // 날짜별 집계
    const date = hand.timestamp ? new Date(hand.timestamp).toISOString().split('T')[0] : 'Unknown';
    if (!stats.byDate[date]) {
      stats.byDate[date] = {
        count: 0,
        profit: 0,
        wins: 0
      };
    }
    stats.byDate[date].count++;
    stats.byDate[date].profit += profit;
    if (hand.result === 'Win') stats.byDate[date].wins++;
    
    // 테이블별 집계
    const table = hand.table || 'Unknown';
    if (!stats.byTable[table]) {
      stats.byTable[table] = {
        count: 0,
        profit: 0
      };
    }
    stats.byTable[table].count++;
    stats.byTable[table].profit += profit;
  }
  
  // 평균 계산
  stats.avgPot = data.length > 0 ? Math.round(totalPot / data.length) : 0;
  stats.winRate = data.length > 0 ? Math.round((stats.wins / data.length) * 100) : 0;
  
  // 포지션별 승률 계산
  for (const position in stats.byPosition) {
    const posData = stats.byPosition[position];
    posData.winRate = posData.count > 0 ? Math.round((posData.wins / posData.count) * 100) : 0;
  }
  
  // 최근 추세 (최근 10개)
  const recent = data.slice(-10).reverse();
  stats.recentTrend = recent.map(row => {
    const hand = rowToHand(row);
    return {
      date: hand.timestamp,
      profit: parseFloat(hand.profitloss) || 0
    };
  });
  
  if (stats.smallestPot === Infinity) stats.smallestPot = 0;
  
  return stats;
}

/**
 * 빈 통계 객체 반환
 */
function getEmptyStats() {
  return {
    totalHands: 0,
    totalProfit: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    avgPot: 0,
    largestPot: 0,
    smallestPot: 0,
    winRate: 0,
    byPosition: {},
    byDate: {},
    byTable: {},
    recentTrend: []
  };
}

// ===========================
// 테스트 함수 (개발용)
// ===========================

/**
 * 테스트 데이터 생성
 */
function createTestData() {
  const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
  const results = ['Win', 'Lose', 'Tie'];
  const hands = [];
  
  for (let i = 0; i < 20; i++) {
    const hand = {
      handnumber: 'TEST_' + Date.now() + '_' + i,
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      table: 'Test Table ' + (i % 3 + 1),
      smallblind: 50,
      bigblind: 100,
      myposition: positions[i % positions.length],
      mycards: 'AK',
      flop: 'A23',
      turn: '4',
      river: '5',
      preflopaction: 'Raise',
      flopaction: 'Bet',
      turnaction: 'Check',
      riveraction: 'Fold',
      pot: Math.round(Math.random() * 1000) + 100,
      result: results[i % results.length],
      profitloss: (i % results.length === 0) ? Math.round(Math.random() * 500) : -Math.round(Math.random() * 200),
      notes: 'Test hand ' + i,
      playerscount: 6,
      showdowncards: ''
    };
    hands.push(hand);
  }
  
  return handleBulkSave(hands);
}

/**
 * 테스트 실행
 */
function runTests() {
  console.log('테스트 시작');
  
  try {
    // Ping 테스트
    console.log('Ping 테스트:', handlePing());
    
    // 통계 테스트
    console.log('통계 테스트:', handleGetStats());
    
    // 최근 핸드 테스트
    console.log('최근 핸드 테스트:', handleGetLatest(5));
    
    console.log('테스트 완료');
    return '모든 테스트 통과';
    
  } catch (error) {
    console.error('테스트 실패:', error);
    return '테스트 실패: ' + error.toString();
  }
}