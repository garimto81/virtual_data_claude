/**
 * Virtual Data - Poker Hand Logger
 * Google Apps Script Backend
 * Version: v71.0.3 ULTIMATE
 * Last Modified: 2025-09-23
 *
 * v71.0.3 업데이트 내용:
 * - Type 시트 자동 스타일 적용 (Roboto 11pt, 중앙 정렬)
 * - 플레이어 추가/수정/삭제 시 자동 스타일 적용
 * - 성능 최적화: 행별 스타일 적용 함수 추가
 *
 * v71.0.2 업데이트 내용:
 * - CORS 문제 완벽 해결: HTML Service → ContentService.JSON 변경
 * - 순수 JSON API로 전환
 * - 표준 REST API 방식 적용
 *
 * v71.0.1 업데이트 내용:
 * - doGet/doPost 함수 undefined 파라미터 처리 추가
 * - e.parameter null 체크 강화
 *
 * v71 업데이트 내용:
 * - PlayerIndex 클래스 기반 고속 검색
 * - 데이터 구조 정규화 완벽 지원
 * - Config 시트 지원
 * - 일괄 업데이트 성능 최적화
 *
 * Type 시트 구조 (8열):
 * A: Poker Room
 * B: Table Name
 * C: Table No
 * D: Seat No (#1, #2 형식)
 * E: Players (이름)
 * F: Nationality (국가 코드)
 * G: Chips (칩 수량)
 * H: Keyplayer (TRUE/FALSE 또는 빈값)
 */

// ==================== 설정 및 상수 ====================

const SPREADSHEET_ID = '1gZN9S2rP5_U9zdxX1cJHBzBAl-Nup4PD4QXuW44rnSE'; // 필요시 변경
const TYPE_SHEET_NAME = 'Type';
const INDEX_SHEET_NAME = 'Index';
const HAND_SHEET_NAME = 'Hand';
const CONFIG_SHEET_NAME = 'Config';

// Type 시트 컬럼 인덱스 (0부터 시작)
const TYPE_COLUMNS = {
  POKER_ROOM: 0,   // A: Poker Room
  TABLE_NAME: 1,   // B: Table Name
  TABLE_NO: 2,     // C: Table No
  SEAT_NO: 3,      // D: Seat No
  PLAYERS: 4,      // E: Players
  NATIONALITY: 5,  // F: Nationality
  CHIPS: 6,        // G: Chips
  KEYPLAYER: 7     // H: Keyplayer
};

// 버전 정보
const VERSION_INFO = {
  version: '71.0.4',
  lastUpdate: '2025-09-23',
  features: [
    'CORS 완벽 해결 (ContentService.JSON)',
    '순수 JSON REST API',
    'PlayerIndex 클래스 고속 검색',
    '새로운 Type 시트 구조 (8컬럼)',
    'Config 시트 지원',
    '스마트 업데이트 시스템',
    '중복 제거 자동화',
    'FormData + URL 인코딩 동시 지원'
  ]
};

// ==================== PlayerIndex 클래스 ====================

class PlayerIndex {
  constructor() {
    this.indexByKey = new Map();
    this.indexByName = new Map();
    this.indexByTable = new Map();
    this.lastBuildTime = 0;
    this.cacheExpiry = 60000; // 1분
  }

  needsRebuild() {
    return Date.now() - this.lastBuildTime > this.cacheExpiry;
  }

  build(data) {
    console.log('[PlayerIndex] 인덱스 빌드 시작');
    this.clear();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 8) continue;

      const tableNo = String(row[TYPE_COLUMNS.TABLE_NO] || '').trim();
      const seatNo = String(row[TYPE_COLUMNS.SEAT_NO] || '').trim();
      const name = String(row[TYPE_COLUMNS.PLAYERS] || '').trim();

      if (!tableNo || !name) continue; // seatNo는 선택사항

      const key = `${tableNo}_${seatNo}`;

      // 키 인덱스
      if (seatNo) {
        this.indexByKey.set(key, i);
      }

      // 이름 인덱스
      if (!this.indexByName.has(name)) {
        this.indexByName.set(name, []);
      }
      this.indexByName.get(name).push(i);

      // 테이블 인덱스
      if (!this.indexByTable.has(tableNo)) {
        this.indexByTable.set(tableNo, []);
      }
      this.indexByTable.get(tableNo).push(i);
    }

    this.lastBuildTime = Date.now();
    console.log(`[PlayerIndex] 빌드 완료: ${this.indexByKey.size}개 키, ${this.indexByName.size}명`);
  }

  clear() {
    this.indexByKey.clear();
    this.indexByName.clear();
    this.indexByTable.clear();
  }

  findByKey(tableNo, seatNo) {
    const key = `${tableNo}_${seatNo}`;
    return this.indexByKey.get(key);
  }

  findByName(name, tableNo = null) {
    const rows = this.indexByName.get(name) || [];
    if (tableNo) {
      return rows.filter(row => {
        const tableRows = this.indexByTable.get(tableNo) || [];
        return tableRows.includes(row);
      });
    }
    return rows;
  }

  findByTable(tableNo) {
    return this.indexByTable.get(tableNo) || [];
  }
}

// 전역 인덱스 인스턴스
const playerIndex = new PlayerIndex();

// ==================== Config 시트에서 URL 가져오기 ====================

function getAppsScriptUrlFromConfig() {
  try {
    const sheet = getSheet(CONFIG_SHEET_NAME);
    if (!sheet) {
      console.log('Config 시트가 없습니다');
      return null;
    }

    // A1 셀에서 URL 가져오기
    const url = sheet.getRange('A1').getValue();
    if (url && url.toString().startsWith('http')) {
      console.log('Config 시트에서 URL 로드:', url);
      return url.toString();
    }

    return null;
  } catch (error) {
    console.error('Config URL 로드 오류:', error);
    return null;
  }
}

// ==================== CORS 해결을 위한 HTML Service ====================

function doGet(e) {
  // e가 undefined인 경우 처리
  if (!e || !e.parameter) {
    return createCorsResponse({
      success: false,
      error: 'No parameters provided',
      version: VERSION_INFO.version
    });
  }

  const params = e.parameter;

  // POST 데이터 처리 (GET 파라미터로 전달된 경우)
  if (params.action && params.data) {
    try {
      const data = JSON.parse(params.data);
      data.action = params.action;

      const result = processAction(data);
      return createCorsResponse(result);

    } catch (error) {
      return createCorsResponse({
        success: false,
        message: error.toString(),
        stack: error.stack
      });
    }
  }

  // API 테스트
  if (params.test === 'true') {
    return createCorsResponse({
      success: true,
      message: 'v71 Ultimate API 테스트 모드',
      version: VERSION_INFO.version,
      features: VERSION_INFO.features,
      timestamp: new Date().toISOString(),
      configUrl: getAppsScriptUrlFromConfig()
    });
  }

  // Config 시트에서 URL 가져오기 요청
  if (params.action === 'getConfigUrl') {
    return createCorsResponse({
      success: true,
      url: getAppsScriptUrlFromConfig(),
      version: VERSION_INFO.version
    });
  }

  // 테이블 조회
  if (params.table) {
    const players = getTablePlayers(params.table);
    return createCorsResponse({
      success: true,
      table: params.table,
      players: players,
      count: players.length,
      timestamp: new Date().toISOString()
    });
  }

  // Type 시트 조회 (CSV)
  if (params.getTypeSheet === 'true') {
    return handleGetTypeSheet();
  }

  // 기본 응답
  return createCorsResponse({
    success: true,
    message: 'v71 Ultimate API 정상 작동 중',
    version: VERSION_INFO.version,
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    console.log('[v71] doPost 시작:', new Date().toLocaleString());

    // e가 undefined인 경우 처리
    if (!e) {
      return createCorsResponse({
        success: false,
        error: 'No request data provided',
        version: VERSION_INFO.version
      });
    }

    let data;

    // 요청 데이터 파싱 (JSON 또는 FormData)
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonError) {
        // FormData 방식 파싱
        data = e.parameter || {};
        if (data.players) {
          data.players = JSON.parse(data.players);
        }
        if (data.deleted) {
          data.deleted = JSON.parse(data.deleted);
        }
      }
    } else {
      // URL 인코딩 방식
      data = e.parameter || {};
      if (data.players) {
        data.players = JSON.parse(data.players);
      }
      if (data.deleted) {
        data.deleted = JSON.parse(data.deleted);
      }
    }

    console.log('[v71] 요청 액션:', data.action);

    const result = processAction(data);
    return createCorsResponse(result);

  } catch (error) {
    console.error('[v71] doPost 오류:', error);
    return createCorsResponse({
      success: false,
      message: error.toString(),
      stack: error.stack
    });
  }
}

// 액션 처리 통합 함수
function processAction(data) {
  switch(data.action) {
    case 'batchUpdate':
      return handleBatchUpdateEnhanced(data);

    case 'getTypeSheet':
      return handleGetTypeSheetJSON();

    case 'createPlayer':
    case 'addPlayer':
      return createPlayer(convertToV71Structure(data, data.tableNo || data.table));

    case 'updatePlayer':
    case 'updatePlayerInfo':
      return updatePlayerInfo(
        data.tableNo || data.table,
        data.seatNo || data.seat,
        data.playerName || data.name || data.oldName,
        data.updateData || data
      );

    case 'replacePlayer':
      return replacePlayer(
        data.tableNo || data.table,
        data.seatNo || data.seat,
        convertToV71Structure(data, data.tableNo || data.table)
      );

    case 'smartUpdate':
      return smartUpdatePlayer(convertToV71Structure(data, data.tableNo || data.table));

    case 'deletePlayer':
      return deletePlayer(
        data.tableNo || data.table,
        data.seatNo || data.seat,
        data.playerName || data.name
      );

    case 'updatePlayerChips':
      return handleUpdatePlayerChips(data);

    case 'getTablePlayers':
      const players = getTablePlayers(data.tableNo || data.table);
      return {
        success: true,
        players: players,
        count: players.length
      };

    case 'getAllPlayers':
      return handleGetAllPlayers();

    case 'removeDuplicatePlayers':
    case 'removeDuplicates':
      return removeDuplicatePlayers();

    case 'sortTypeSheet':
      sortTypeSheet();
      return {
        success: true,
        message: 'Type 시트 정렬 완료'
      };

    case 'clearSheet':
      return clearTypeSheet();

    case 'applyStyle':
      return applyFullSheetStyle();

    case 'saveConfig':
      return saveConfigToSheet(data.configType, data.value);

    case 'getConfig':
      return {
        success: true,
        value: getConfigFromSheet(data.configType)
      };

    default:
      return {
        success: false,
        message: `알 수 없는 액션: ${data.action}`
      };
  }
}

// CORS 응답 생성 함수
function createCorsResponse(data) {
  // 순수 JSON 응답 반환 (CORS 자동 처리)
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== Sheet 접근 함수 ====================

function getSheet(sheetName = TYPE_SHEET_NAME) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    return spreadsheet.getSheetByName(sheetName);
  } catch (error) {
    console.log('[getSheet] openById 실패, 활성 시트 사용:', error.toString());
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      throw new Error('스프레드시트에 접근할 수 없습니다. Apps Script를 Google Sheets에서 실행해주세요.');
    }
    return spreadsheet.getSheetByName(sheetName);
  }
}

function getTypeSheetData() {
  const sheet = getSheet(TYPE_SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  // 헤더가 없으면 추가
  if (data.length === 0 || data[0][0] !== 'Poker Room') {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, 8).setValues([[
      'Poker Room', 'Table Name', 'Table No', 'Seat No',
      'Players', 'Nationality', 'Chips', 'Keyplayer'
    ]]);
    data.unshift(['Poker Room', 'Table Name', 'Table No', 'Seat No',
                   'Players', 'Nationality', 'Chips', 'Keyplayer']);
  }

  if (playerIndex.needsRebuild()) {
    playerIndex.build(data);
  }

  return data;
}

// ==================== Type 시트 조회 ====================

function handleGetTypeSheet() {
  const sheet = getSheet(TYPE_SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  return ContentService
    .createTextOutput(data.map(row => row.join(',')).join('\n'))
    .setMimeType(ContentService.MimeType.TEXT);
}

function handleGetTypeSheetJSON() {
  const data = getTypeSheetData();
  const players = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 8) continue;

    players.push({
      pokerRoom: row[TYPE_COLUMNS.POKER_ROOM],
      tableName: row[TYPE_COLUMNS.TABLE_NAME],
      tableNo: row[TYPE_COLUMNS.TABLE_NO],
      seatNo: row[TYPE_COLUMNS.SEAT_NO],
      name: row[TYPE_COLUMNS.PLAYERS],
      nationality: row[TYPE_COLUMNS.NATIONALITY],
      chips: row[TYPE_COLUMNS.CHIPS],
      keyplayer: row[TYPE_COLUMNS.KEYPLAYER] === 'TRUE' || row[TYPE_COLUMNS.KEYPLAYER] === true
    });
  }

  return {
    success: true,
    players: players,
    count: players.length
  };
}

// ==================== 플레이어 관리 함수 ====================

function createPlayer(playerData) {
  const sheet = getSheet(TYPE_SHEET_NAME);
  const data = getTypeSheetData();

  const tableNo = String(playerData.tableNo || '').trim();
  const seatNo = String(playerData.seatNo || '').trim();
  const name = String(playerData.name || '').trim();

  // 중복 체크 (테이블+좌석 또는 테이블+이름)
  if (seatNo) {
    const existingRow = playerIndex.findByKey(tableNo, seatNo);
    if (existingRow) {
      return {
        success: false,
        message: `Table ${tableNo} Seat ${seatNo}에 이미 플레이어가 있습니다`,
        action: 'duplicate_found'
      };
    }
  }

  // 같은 테이블에 같은 이름 체크
  const nameRows = playerIndex.findByName(name, tableNo);
  if (nameRows.length > 0) {
    return {
      success: false,
      message: `Table ${tableNo}에 ${name} 플레이어가 이미 있습니다`,
      action: 'duplicate_name'
    };
  }

  // 새 플레이어 추가
  const newRow = [
    playerData.pokerRoom || 'Merit Hall',
    playerData.tableName || 'Ocean Blue',
    tableNo,
    seatNo,
    name,
    playerData.nationality || '',
    playerData.chips || 0,
    playerData.keyplayer === true ? 'TRUE' : ''
  ];

  sheet.appendRow(newRow);
  playerIndex.clear(); // 인덱스 재빌드 필요

  // 새로 추가된 행에 스타일 적용
  const lastRow = sheet.getLastRow();
  applyRowStyle(sheet, lastRow);

  return {
    success: true,
    message: '플레이어 등록 성공',
    action: 'created'
  };
}

function updatePlayerInfo(tableNo, seatNo, playerName, updateData) {
  const sheet = getSheet(TYPE_SHEET_NAME);
  const data = getTypeSheetData();

  let rowIndex = -1;

  // 좌석 번호가 있으면 키로 검색
  if (seatNo) {
    rowIndex = playerIndex.findByKey(tableNo, seatNo);
  } else if (playerName) {
    // 좌석 번호가 없으면 이름으로 검색
    const nameRows = playerIndex.findByName(playerName, tableNo);
    if (nameRows.length === 1) {
      rowIndex = nameRows[0];
    } else if (nameRows.length > 1) {
      return {
        success: false,
        message: '같은 이름의 플레이어가 여러 명 있습니다. 좌석 번호를 지정해주세요.'
      };
    }
  }

  if (!rowIndex || rowIndex < 0) {
    return {
      success: false,
      message: '플레이어를 찾을 수 없습니다'
    };
  }

  const row = data[rowIndex];

  // 이름 확인 (선택사항)
  if (playerName && row[TYPE_COLUMNS.PLAYERS] !== playerName) {
    return {
      success: false,
      message: '플레이어 이름이 일치하지 않습니다'
    };
  }

  // 업데이트할 필드만 수정
  if (updateData.chips !== undefined) {
    sheet.getRange(rowIndex + 1, TYPE_COLUMNS.CHIPS + 1).setValue(updateData.chips);
  }
  if (updateData.nationality !== undefined) {
    sheet.getRange(rowIndex + 1, TYPE_COLUMNS.NATIONALITY + 1).setValue(updateData.nationality);
  }
  if (updateData.keyplayer !== undefined) {
    sheet.getRange(rowIndex + 1, TYPE_COLUMNS.KEYPLAYER + 1)
      .setValue(updateData.keyplayer ? 'TRUE' : '');
  }
  if (updateData.pokerRoom !== undefined) {
    sheet.getRange(rowIndex + 1, TYPE_COLUMNS.POKER_ROOM + 1).setValue(updateData.pokerRoom);
  }
  if (updateData.tableName !== undefined) {
    sheet.getRange(rowIndex + 1, TYPE_COLUMNS.TABLE_NAME + 1).setValue(updateData.tableName);
  }
  if (updateData.name !== undefined && updateData.name !== row[TYPE_COLUMNS.PLAYERS]) {
    sheet.getRange(rowIndex + 1, TYPE_COLUMNS.PLAYERS + 1).setValue(updateData.name);
  }
  if (updateData.seatNo !== undefined && updateData.seatNo !== row[TYPE_COLUMNS.SEAT_NO]) {
    sheet.getRange(rowIndex + 1, TYPE_COLUMNS.SEAT_NO + 1).setValue(updateData.seatNo);
  }

  playerIndex.clear();

  // 수정된 행에 스타일 적용
  applyRowStyle(sheet, rowIndex + 1);

  return {
    success: true,
    message: '플레이어 정보 업데이트 성공',
    action: 'updated'
  };
}

function replacePlayer(tableNo, seatNo, newPlayerData) {
  const sheet = getSheet(TYPE_SHEET_NAME);
  const data = getTypeSheetData();

  const rowIndex = playerIndex.findByKey(tableNo, seatNo);
  if (!rowIndex) {
    return createPlayer(newPlayerData);
  }

  // 기존 플레이어 교체
  const updatedRow = [
    newPlayerData.pokerRoom || 'Merit Hall',
    newPlayerData.tableName || 'Ocean Blue',
    tableNo,
    seatNo,
    newPlayerData.name || '',
    newPlayerData.nationality || '',
    newPlayerData.chips || 0,
    newPlayerData.keyplayer === true ? 'TRUE' : ''
  ];

  const range = sheet.getRange(rowIndex + 1, 1, 1, 8);
  range.setValues([updatedRow]);

  playerIndex.clear();

  return {
    success: true,
    message: '플레이어 교체 성공',
    action: 'replaced'
  };
}

function smartUpdatePlayer(playerData) {
  const tableNo = String(playerData.tableNo || '').trim();
  const seatNo = String(playerData.seatNo || '').trim();
  const name = String(playerData.name || '').trim();

  const data = getTypeSheetData();

  // 좌석이 있는 경우
  if (seatNo) {
    const existingRow = playerIndex.findByKey(tableNo, seatNo);

    if (!existingRow) {
      return createPlayer(playerData);
    }

    const currentPlayer = data[existingRow][TYPE_COLUMNS.PLAYERS];

    if (currentPlayer !== name) {
      if (playerData.forceReplace) {
        return replacePlayer(tableNo, seatNo, playerData);
      }

      return {
        success: false,
        action: 'need_confirm',
        message: '자리에 다른 플레이어가 있습니다',
        currentPlayer: currentPlayer,
        newPlayer: name,
        tableNo: tableNo,
        seatNo: seatNo
      };
    }

    return updatePlayerInfo(tableNo, seatNo, name, playerData);
  }

  // 좌석이 없는 경우 - 이름으로 찾거나 새로 생성
  const nameRows = playerIndex.findByName(name, tableNo);
  if (nameRows.length === 1) {
    const row = data[nameRows[0]];
    return updatePlayerInfo(tableNo, row[TYPE_COLUMNS.SEAT_NO], name, playerData);
  } else if (nameRows.length > 1) {
    return {
      success: false,
      message: '같은 이름의 플레이어가 여러 명 있습니다',
      action: 'multiple_found'
    };
  }

  return createPlayer(playerData);
}

function deletePlayer(tableNo, seatNo, playerName) {
  const sheet = getSheet(TYPE_SHEET_NAME);
  const data = getTypeSheetData();

  let rowIndex = -1;

  // 좌석 번호가 있으면 키로 검색
  if (seatNo) {
    rowIndex = playerIndex.findByKey(tableNo, seatNo);
  } else if (playerName) {
    // 좌석 번호가 없으면 이름으로 검색
    const nameRows = playerIndex.findByName(playerName, tableNo);
    if (nameRows.length === 1) {
      rowIndex = nameRows[0];
    } else if (nameRows.length > 1) {
      // 여러 명이면 첫 번째 삭제
      rowIndex = nameRows[0];
    }
  }

  if (!rowIndex || rowIndex < 0) {
    return {
      success: false,
      message: '플레이어를 찾을 수 없습니다'
    };
  }

  // 이름 확인 (선택사항)
  if (playerName && data[rowIndex][TYPE_COLUMNS.PLAYERS] !== playerName) {
    return {
      success: false,
      message: '플레이어 이름이 일치하지 않습니다'
    };
  }

  sheet.deleteRow(rowIndex + 1);
  playerIndex.clear();

  // 스타일 자동 적용
  applyRowStyle(sheet);

  return {
    success: true,
    message: '플레이어 삭제 성공',
    action: 'deleted'
  };
}

function handleUpdatePlayerChips(params) {
  const name = params.name;
  const chips = params.chips;
  const table = params.table || params.tableNo;

  const sheet = getSheet(TYPE_SHEET_NAME);
  const data = getTypeSheetData();

  // 이름으로 찾기
  const nameRows = playerIndex.findByName(name, table);

  if (nameRows.length > 0) {
    const rowIndex = nameRows[0];
    sheet.getRange(rowIndex + 1, TYPE_COLUMNS.CHIPS + 1).setValue(chips);

    return {
      success: true,
      message: '칩 업데이트 완료'
    };
  }

  // 플레이어가 없으면 추가
  sheet.appendRow([
    'Merit Hall',      // Poker Room
    'Ocean Blue',      // Table Name
    table,             // Table No
    '',                // Seat No
    name,              // Players
    '',                // Nationality
    chips,             // Chips
    false              // Keyplayer
  ]);

  playerIndex.clear();

  return {
    success: true,
    message: '새 플레이어 추가 및 칩 설정 완료'
  };
}

function getTablePlayers(tableNo) {
  const data = getTypeSheetData();
  const players = [];

  const rowIndices = playerIndex.findByTable(tableNo);

  for (const rowIndex of rowIndices) {
    const row = data[rowIndex];
    players.push({
      pokerRoom: row[TYPE_COLUMNS.POKER_ROOM],
      tableName: row[TYPE_COLUMNS.TABLE_NAME],
      tableNo: row[TYPE_COLUMNS.TABLE_NO],
      seatNo: row[TYPE_COLUMNS.SEAT_NO],
      name: row[TYPE_COLUMNS.PLAYERS],
      nationality: row[TYPE_COLUMNS.NATIONALITY],
      chips: row[TYPE_COLUMNS.CHIPS],
      keyplayer: row[TYPE_COLUMNS.KEYPLAYER] === 'TRUE' || row[TYPE_COLUMNS.KEYPLAYER] === true
    });
  }

  // 좌석 번호 순으로 정렬
  players.sort((a, b) => {
    const seatA = parseInt(String(a.seatNo).replace('#', '')) || 999;
    const seatB = parseInt(String(b.seatNo).replace('#', '')) || 999;
    return seatA - seatB;
  });

  return players;
}

function handleGetAllPlayers() {
  const data = getTypeSheetData();
  const players = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 8) continue;

    players.push({
      pokerRoom: row[TYPE_COLUMNS.POKER_ROOM],
      tableName: row[TYPE_COLUMNS.TABLE_NAME],
      tableNo: row[TYPE_COLUMNS.TABLE_NO],
      seatNo: row[TYPE_COLUMNS.SEAT_NO],
      name: row[TYPE_COLUMNS.PLAYERS],
      nationality: row[TYPE_COLUMNS.NATIONALITY],
      chips: row[TYPE_COLUMNS.CHIPS],
      keyplayer: row[TYPE_COLUMNS.KEYPLAYER] === 'TRUE' || row[TYPE_COLUMNS.KEYPLAYER] === true
    });
  }

  return {
    success: true,
    players: players,
    count: players.length
  };
}

// ==================== 시트 관리 함수 ====================

function clearTypeSheet() {
  const sheet = getSheet(TYPE_SHEET_NAME);
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }

  playerIndex.clear();

  return {
    success: true,
    message: 'Type 시트 초기화 완료'
  };
}

function sortTypeSheet() {
  const sheet = getSheet(TYPE_SHEET_NAME);
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    const range = sheet.getRange(2, 1, lastRow - 1, 8);
    range.sort([
      {column: TYPE_COLUMNS.TABLE_NO + 1, ascending: true},
      {column: TYPE_COLUMNS.SEAT_NO + 1, ascending: true}
    ]);
  }

  playerIndex.clear(); // 정렬 후 인덱스 재빌드 필요
}

function applyFullSheetStyle() {
  const sheet = getSheet(TYPE_SHEET_NAME);
  const range = sheet.getDataRange();

  range.setFontFamily('Roboto');
  range.setFontSize(11);
  range.setHorizontalAlignment('center');
  range.setVerticalAlignment('middle');

  const headerRange = sheet.getRange(1, 1, 1, 8);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f0f0f0');

  return {
    success: true,
    message: '스타일 적용 완료'
  };
}

// 특정 행에만 스타일 적용 (성능 최적화)
function applyRowStyle(sheet, rowNum) {
  try {
    let range;
    if (rowNum) {
      // 특정 행만 스타일 적용
      range = sheet.getRange(rowNum, 1, 1, 8);
    } else {
      // 전체 데이터 영역 스타일 적용
      range = sheet.getDataRange();
    }

    range.setFontFamily('Roboto');
    range.setFontSize(11);
    range.setHorizontalAlignment('center');
    range.setVerticalAlignment('middle');

    // 헤더 스타일은 유지
    if (!rowNum) {
      const headerRange = sheet.getRange(1, 1, 1, 8);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f0f0f0');
    }
  } catch (error) {
    console.log('스타일 적용 중 오류:', error);
  }
}

// ==================== 중복 제거 ====================

function removeDuplicatePlayers() {
  const sheet = getSheet(TYPE_SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  const seen = new Map();
  const duplicates = [];
  const toDelete = [];

  // 헤더 스킵, 역순으로 처리
  for (let i = data.length - 1; i >= 1; i--) {
    const tableNo = String(data[i][TYPE_COLUMNS.TABLE_NO] || '').trim();
    const name = String(data[i][TYPE_COLUMNS.PLAYERS] || '').trim();

    if (!tableNo || !name) continue;

    const key = `${tableNo}_${name}`;

    if (seen.has(key)) {
      duplicates.push({
        row: i + 1,
        table: tableNo,
        player: name
      });
      toDelete.push(i + 1);
    } else {
      seen.set(key, true);
    }
  }

  // 중복 삭제 (역순으로 삭제)
  toDelete.sort((a, b) => b - a);
  toDelete.forEach(row => {
    sheet.deleteRow(row);
  });

  playerIndex.clear();

  return {
    success: true,
    message: `${duplicates.length}개 중복 제거`,
    duplicates: duplicates
  };
}

// ==================== Config 시트 관리 ====================

function saveConfigToSheet(configType, value) {
  try {
    let sheet = getSheet(CONFIG_SHEET_NAME);
    if (!sheet) {
      const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      sheet = spreadsheet.insertSheet(CONFIG_SHEET_NAME);
      sheet.appendRow(['ConfigType', 'Value', 'UpdatedAt']);
    }

    const data = sheet.getDataRange().getValues();
    let configRow = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === configType) {
        configRow = i + 1;
        break;
      }
    }

    const now = new Date().toISOString();

    if (configRow > 0) {
      sheet.getRange(configRow, 2).setValue(value);
      sheet.getRange(configRow, 3).setValue(now);
    } else {
      sheet.appendRow([configType, value, now]);
    }

    return { success: true };
  } catch (error) {
    console.error('Config 저장 오류:', error);
    return { success: false, error: error.toString() };
  }
}

function getConfigFromSheet(configType) {
  try {
    const sheet = getSheet(CONFIG_SHEET_NAME);
    if (!sheet) return null;

    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === configType) {
        return data[i][1];
      }
    }

    return null;
  } catch (error) {
    console.error('Config 조회 오류:', error);
    return null;
  }
}

// ==================== 일괄 업데이트 ====================

function handleBatchUpdateEnhanced(data) {
  console.log('[v71] Enhanced 배치 업데이트 시작');

  const tableNo = data.table || data.tableNo;
  const players = data.players || [];
  const deleted = data.deleted || [];

  let successCount = 0;
  let errorCount = 0;
  let replacedCount = 0;
  let createdCount = 0;
  const results = [];

  // 1. 삭제 처리
  for (const deletedPlayer of deleted) {
    try {
      const playerName = typeof deletedPlayer === 'string' ? deletedPlayer : deletedPlayer.name;
      const seatNo = typeof deletedPlayer === 'object' ? (deletedPlayer.seatNo || deletedPlayer.seat) : '';

      const result = deletePlayer(tableNo, seatNo, playerName);

      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
      results.push(result);
    } catch (error) {
      errorCount++;
      console.error(`[v71] 삭제 오류:`, error);
    }
  }

  // 2. 추가/업데이트 처리
  for (const player of players) {
    try {
      const playerData = convertToV71Structure(player, tableNo);
      playerData.forceReplace = data.forceReplace || false;

      const result = smartUpdatePlayer(playerData);

      if (result.success) {
        successCount++;
        if (result.action === 'replaced') {
          replacedCount++;
        } else if (result.action === 'created') {
          createdCount++;
        }
      } else if (result.action === 'need_confirm') {
        errorCount++;
      } else {
        errorCount++;
      }

      results.push(result);
    } catch (error) {
      errorCount++;
      console.error(`[v71] 처리 오류:`, error);
    }
  }

  // 3. 정렬
  sortTypeSheet();

  // 4. 중복 제거
  const dupResult = removeDuplicatePlayers();

  // 5. 전체 시트 스타일 적용 (일괄 업데이트 후)
  applyFullSheetStyle();
  if (dupResult.duplicates && dupResult.duplicates.length > 0) {
    results.push(dupResult);
  }

  return {
    success: errorCount === 0,
    message: `처리 완료: 성공 ${successCount}, 실패 ${errorCount}, 생성 ${createdCount}, 교체 ${replacedCount}`,
    successCount: successCount,
    errorCount: errorCount,
    createdCount: createdCount,
    replacedCount: replacedCount,
    duplicatesRemoved: dupResult.duplicates ? dupResult.duplicates.length : 0,
    results: results
  };
}

// ==================== 헬퍼 함수 ====================

function convertToV71Structure(oldData, defaultTableNo) {
  console.log('[v71] 데이터 변환:', JSON.stringify(oldData));

  // 좌석 번호 정규화
  let seatNo = oldData.seatNo || oldData.seat || '';
  if (seatNo) {
    seatNo = seatNo.toString().replace(/^#0*/, '#');
    if (!seatNo.startsWith('#')) {
      seatNo = `#${seatNo}`;
    }
  }

  // 칩 파싱
  let chips = oldData.chips || 0;
  if (typeof chips === 'string') {
    chips = parseInt(chips.replace(/,/g, '')) || 0;
  }

  // keyplayer/notable 변환
  let keyplayer = oldData.keyplayer;
  if (keyplayer === undefined && oldData.notable !== undefined) {
    keyplayer = oldData.notable;
  }

  return {
    pokerRoom: oldData.pokerRoom || 'Merit Hall',
    tableName: oldData.tableName || 'Ocean Blue',
    tableNo: oldData.tableNo || oldData.table || defaultTableNo || '',
    seatNo: seatNo,
    name: oldData.name || oldData.player || oldData.Players || '',
    nationality: oldData.nationality || oldData.Nationality || '',
    chips: chips,
    keyplayer: keyplayer === true || keyplayer === 'TRUE' || keyplayer === 'true',
    forceReplace: oldData.forceReplace || false
  };
}

console.log('[v71.0.0 ULTIMATE] 완벽 통합 버전 로드 완료');