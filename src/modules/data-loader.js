/**
 * data-loader.js
 * Google Sheets 데이터 로딩 및 IndexedDB 캐싱 관리
 */

import { store } from '../core/store.js';

/**
 * DataLoader 클래스
 * CSV 데이터 파싱, IndexedDB 캐싱, 초기 데이터 로딩 담당
 */
class DataLoader {
  constructor() {
    this.CACHE_TTL = 5 * 60 * 1000; // 5분
    this.db = window.db; // Dexie IndexedDB instance
  }

  /**
   * IndexedDB 오류 처리 래퍼 함수
   */
  async safeIndexedDBOperation(operation, fallbackValue = null, operationName = 'IndexedDB 작업') {
    try {
      return await operation();
    } catch (error) {
      console.error(`❌ ${operationName} 실패:`, error);

      if (error.name === 'QuotaExceededError') {
        console.log('💾 IndexedDB 용량 초과 - 캐시 정리 중...');
        try {
          await this.db.cache.clear();
          await this.db.players.clear();
          await this.db.tables.clear();
          console.log('✅ 캐시 정리 완료');
        } catch (clearError) {
          console.error('캐시 정리 실패:', clearError);
        }
      }

      if (error.name === 'InvalidStateError' || error.name === 'NotFoundError') {
        console.log('🔄 IndexedDB 재초기화 시도 중...');
        try {
          await this.db.open();
          console.log('✅ IndexedDB 재초기화 완료');
        } catch (reinitError) {
          console.error('IndexedDB 재초기화 실패:', reinitError);
        }
      }

      return fallbackValue;
    }
  }

  /**
   * IndexedDB에 플레이어 데이터 저장
   */
  async savePlayersToIndexedDB(players) {
    return await this.safeIndexedDBOperation(async () => {
      await this.db.players.clear();
      await this.db.cache.put({
        key: 'players_timestamp',
        value: Date.now()
      });
      await this.db.players.bulkAdd(players.map(p => ({
        ...p,
        id: `${p.table}_${p.name}`
      })));
      console.log('✅ IndexedDB에 플레이어 데이터 저장 완료:', players.length);
      return true;
    }, false, 'IndexedDB 플레이어 저장');
  }

  /**
   * IndexedDB에서 플레이어 데이터 로드
   */
  async loadPlayersFromIndexedDB() {
    return await this.safeIndexedDBOperation(async () => {
      const cacheInfo = await this.db.cache.get('players_timestamp');
      if (!cacheInfo || (Date.now() - cacheInfo.value > this.CACHE_TTL)) {
        console.log('⏰ 캐시 만료됨 (5분 경과)');
        return null;
      }

      const players = await this.db.players.toArray();
      console.log('✅ IndexedDB에서 플레이어 데이터 로드:', players.length);
      return players;
    }, null, 'IndexedDB 플레이어 로드');
  }

  /**
   * IndexedDB에 테이블 목록 저장
   */
  async saveTablesToIndexedDB(tables) {
    return await this.safeIndexedDBOperation(async () => {
      await this.db.tables.clear();
      const tableData = tables.map(name => ({
        name,
        updatedAt: Date.now()
      }));
      await this.db.tables.bulkAdd(tableData);
      console.log('✅ IndexedDB에 테이블 목록 저장 완료:', tables.length);
      return true;
    }, false, 'IndexedDB 테이블 저장');
  }

  /**
   * IndexedDB에서 테이블 목록 로드
   */
  async loadTablesFromIndexedDB() {
    return await this.safeIndexedDBOperation(async () => {
      const tables = await this.db.tables.toArray();
      return tables.map(t => t.name);
    }, null, 'IndexedDB 테이블 로드');
  }

  /**
   * Type 시트에서 플레이어 데이터 파싱
   */
  buildTypeFromCsv(rows) {
    // Type 시트 구조 (v3.5.41 - 2025년 새 구조):
    // A:Poker Room, B:Table Name, C:Table No., D:Seat No., E:Players, F:Nationality, G:Chips, H:Keyplayer
    if (!rows || rows.length < 1) return;

    // 컬럼 인덱스 상수 정의
    const COLUMNS = {
      POKER_ROOM: 0,
      TABLE_NAME: 1,
      TABLE_NO: 2,
      SEAT_NO: 3,
      PLAYERS: 4,
      NATIONALITY: 5,
      CHIPS: 6,
      KEYPLAYER: 7
    };

    const header = rows[0] || [];

    // 호환성 체크 함수 - 데이터 구조 자동 감지
    function detectSheetStructure(headerRow, dataRows) {
      if (!headerRow || headerRow.length === 0) return 'unknown';

      const newStructureKeywords = ['poker room', 'table name', 'players', 'nationality', 'keyplayer'];
      const headerStr = headerRow.join('|').toLowerCase();

      const newStructureMatches = newStructureKeywords.filter(keyword =>
        headerStr.includes(keyword)
      ).length;

      const oldStructureKeywords = ['player', 'table', 'notable', 'status'];
      const oldStructureMatches = oldStructureKeywords.filter(keyword =>
        headerStr.includes(keyword)
      ).length;

      // 데이터 샘플로 추가 검증
      if (dataRows && dataRows.length > 0) {
        const sampleRow = dataRows[0];
        const hasPlayerInE = sampleRow && sampleRow[COLUMNS.PLAYERS] &&
          String(sampleRow[COLUMNS.PLAYERS]).trim().length > 0;

        if (newStructureMatches >= 3 && hasPlayerInE) return 'new';
        if (oldStructureMatches >= 3 && !hasPlayerInE) return 'old';
      }

      if (newStructureMatches >= 3) return 'new';
      if (oldStructureMatches >= 2) return 'old';

      return 'unknown';
    }

    const structureType = detectSheetStructure(header, rows.slice(1, 3));
    console.log(`[v3.5.41] 시트 구조 감지: ${structureType} (헤더: ${header.join(', ')})`);

    if (structureType === 'old') {
      console.warn(`[v3.5.41] ⚠️ 이전 구조 감지됨! 새 구조로 업데이트 필요`);
    } else if (structureType === 'unknown') {
      console.warn(`[v3.5.41] ⚠️ 알 수 없는 시트 구조. 새 구조로 가정하여 처리`);
    }

    // 카메라 프리셋 기본값 설정
    window.state.camPreset.cam1 = 'Cam1';
    window.state.camPreset.cam2 = 'Cam2';

    // localStorage에서 마지막 카메라 번호 읽어서 표시
    const lastCam1No = localStorage.getItem('pokerHandLogger_lastCam1');
    const lastCam2No = localStorage.getItem('pokerHandLogger_lastCam2');

    console.log(`🎞️ 카메라 버튼 초기화 (기본값):`);
    console.log(`  Cam1 저장된 번호: ${lastCam1No || '없음'}`);
    console.log(`  Cam2 저장된 번호: ${lastCam2No || '없음'}`);

    const pad4 = (n) => String(n).padStart(4, '0');

    if (lastCam1No) {
      const nextNo = parseInt(lastCam1No, 10) + 1;
      window.el.cam1.textContent = `Cam1${pad4(nextNo)}`;
      console.log(`  → Cam1 표시: ${pad4(nextNo)}`);
    } else {
      window.el.cam1.textContent = `Cam10001`;
      console.log(`  → Cam1 표시: 0001 (초기값)`);
    }

    if (lastCam2No) {
      const nextNo = parseInt(lastCam2No, 10) + 1;
      window.el.cam2.textContent = `Cam2${pad4(nextNo)}`;
      console.log(`  → Cam2 표시: ${pad4(nextNo)}`);
    } else {
      window.el.cam2.textContent = `Cam20001`;
      console.log(`  → Cam2 표시: 0001 (초기값)`);
    }

    const byTable = {};

    // 데이터 검증 함수
    function validateRowData(r, rowIndex) {
      const errors = [];

      if (!String(r[COLUMNS.PLAYERS] || '').trim()) {
        errors.push(`행 ${rowIndex}: Players 필드가 비어있음`);
      }
      if (!String(r[COLUMNS.TABLE_NO] || '').trim()) {
        errors.push(`행 ${rowIndex}: Table No. 필드가 비어있음`);
      }

      const chipsStr = String(r[COLUMNS.CHIPS] || '0').trim();
      const chips = parseInt(chipsStr.replace(/,/g, ''), 10);
      if (isNaN(chips) && chipsStr !== '') {
        console.warn(`[v3.5.41] 행 ${rowIndex}: Chips 필드 파싱 실패 (${chipsStr}) - 0으로 처리`);
      }

      return { errors, isValid: errors.length === 0 };
    }

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i] || [];

      const validation = validateRowData(r, i + 1);
      if (!validation.isValid) {
        console.warn(`[v3.5.41] 데이터 검증 실패:`, validation.errors);
        continue;
      }

      const pokerRoom = String(r[COLUMNS.POKER_ROOM] || '').trim();
      const tableName = String(r[COLUMNS.TABLE_NAME] || '').trim();
      const tableNo = String(r[COLUMNS.TABLE_NO] || '').trim();
      const seat = String(r[COLUMNS.SEAT_NO] || '').trim();
      const player = String(r[COLUMNS.PLAYERS] || '').trim();
      const nationality = String(r[COLUMNS.NATIONALITY] || '').trim();
      const chipsStr = String(r[COLUMNS.CHIPS] != null ? r[COLUMNS.CHIPS] : '0').trim();
      const chips = parseInt(chipsStr.replace(/,/g, ''), 10) || 0;
      const keyplayer = String(r[COLUMNS.KEYPLAYER] || '').toUpperCase() === 'TRUE';

      const table = tableNo;

      console.log(`[v3.5.41] 플레이어 처리: ${player} (${table}, 칩: ${chips})`);

      if (player && table) {
        if (!byTable[table]) byTable[table] = [];

        const playerData = {
          name: player,
          chips: chipsStr,
          notable: keyplayer,
          updatedAt: new Date().toISOString(),
          seat,
          status: 'IN',
          nationality,
          tableNo,
          pokerRoom,
          originalIndex: i
        };

        byTable[table].push(playerData);
        console.log(`[v3.5.41] ✅ ${player} 추가됨 (테이블: ${table}, 좌석: ${seat}, 칩: ${chips}, 키: ${keyplayer})`);
      } else {
        const reason = !player ? '플레이어명 없음' :
          !table ? 'Table No. 없음' : '기타';
        console.log(`[v3.5.41] ❌ ${player || '[없음]'} 제외됨 - 이유: ${reason}`);
      }
    }

    // 처리 결과 요약 로그
    console.log(`[v3.5.41] === buildTypeFromCsv 완료 ===`);
    console.log(`[v3.5.41] 총 테이블 수: ${Object.keys(byTable).length}`);

    let totalPlayers = 0;
    let keyplayerCount = 0;

    Object.keys(byTable).forEach(table => {
      const players = byTable[table];
      const keyplayers = players.filter(p => p.notable).length;
      totalPlayers += players.length;
      keyplayerCount += keyplayers;

      console.log(`[v3.5.41] ${table}: ${players.length}명 (키플레이어: ${keyplayers}명)`);
    });

    console.log(`[v3.5.41] 전체 통계 - 총 플레이어: ${totalPlayers}명, 키플레이어: ${keyplayerCount}명`);

    window.state.playerDataByTable = byTable;
    window.state.allTables = Object.keys(byTable).sort();
  }

  /**
   * Index 시트에서 핸드 인덱스 데이터 파싱
   */
  buildIndexFromCsv(rows) {
    // Index CSV columns:
    // A handNumber | B startRow | C endRow | D handUpdatedAt | E handEdit | F handEditTime | G label | H table | I tableUpdatedAt | J Cam | K CamFile01name | L CamFile01number | M CamFile02name | N CamFile02number
    // O lastStreet | P lastAction | Q workStatus
    const out = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i] || [];
      const item = {
        handNumber: String(r[0] || ''),
        startRow: +(r[1] || 0),
        endRow: +(r[2] || 0),
        handUpdatedAt: String(r[3] || ''),
        handEdit: r[4],
        handEditTime: r[5],
        label: r[6],
        table: String(r[7] || ''),
        tableUpdatedAt: r[8],
        cam: r[9],
        cam1: r[10],
        cam1no: r[11],
        cam2: r[12],
        cam2no: r[13],
        lastStreet: String(r[14] || ''),
        lastAction: String(r[15] || ''),
        workStatus: String(r[16] || '')
      };
      if (item.handNumber) out.push(item);
    }
    window.state.indexRows = out;
    // 최신 우선 정렬
    out.sort((a, b) => a.handUpdatedAt < b.handUpdatedAt ? 1 : -1);
    window.state.allHandNumbers = [...new Set(out.map(x => x.handNumber))];
  }

  /**
   * Hand CSV에서 특정 핸드 번호의 데이터 파싱
   */
  parseHandBlock(rows, handNumber, preferDate) {
    // HAND 시작 위치 수집
    const starts = [];
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] || [];
      if (row[1] === 'HAND') {
        const no = String(row[2] || '');
        if (no === String(handNumber)) {
          starts.push({ r });
        }
      }
    }
    if (!starts.length) return null;

    // Index에서 최신 updatedAt 기준 블록 범위 찾기
    let updatedAt = preferDate || null;
    if (!updatedAt) {
      const candidates = window.state.indexRows.filter(x => x.handNumber === String(handNumber));
      candidates.sort((a, b) => a.handUpdatedAt < b.handUpdatedAt ? 1 : -1);
      updatedAt = candidates[0]?.handUpdatedAt || null;
    }
    let startRowIdx = -1, endRowIdx = -1;
    const idxRow = window.state.indexRows.find(x => x.handNumber === String(handNumber) && x.handUpdatedAt === updatedAt);
    if (idxRow) {
      startRowIdx = idxRow.startRow - 1;
      endRowIdx = idxRow.endRow - 1;
    } else {
      const last = starts[starts.length - 1].r;
      startRowIdx = last;
      let r = last + 1;
      while (r < rows.length && rows[r][1] !== 'HAND') r++;
      endRowIdx = r - 1;
    }
    if (startRowIdx < 0 || endRowIdx < startRowIdx) return null;

    const block = rows.slice(startRowIdx, endRowIdx + 1);

    // 파싱
    let handInfo = null, players = [], board = [], smallBlind = '', bigBlind = '', ante = 0, table = '';
    const streets = { preflop: [], flop: [], turn: [], river: [] };
    let street = 'preflop';
    let seenBoard = 0;

    for (const row of block) {
      if (row[1] === 'HAND') {
        handInfo = row;
        ante = parseInt(row[6] || 0, 10) || 0;
        smallBlind = row[8] || '';
        bigBlind = row[9] || '';
        table = row[17] || '';
      } else if (row[1] === 'PLAYER') {
        const name = row[2];
        const seat = row[3];
        const init = row[5], final = row[6];
        const cards = (row[7] || '').trim() ? String(row[7]).trim().split(' ') : [];
        players.push({ name, seat, initialChips: init, finalChips: final, hand: cards });
      } else if (row[1] === 'EVENT') {
        const etype = String(row[2] || '').toUpperCase();
        if (etype === 'BOARD') {
          const card = row[4];
          if (card) board.push(card);
          seenBoard++;
          if (seenBoard === 3) street = 'flop';
          else if (seenBoard === 4) street = 'turn';
          else if (seenBoard === 5) street = 'river';
        } else {
          const seat = row[3];
          const amount = row[4];
          const time = row[5];
          const p = players.find(pp => String(pp.seat) === String(seat));
          const name = p ? p.name : '';
          streets[street].push({
            player: name,
            action: etype,
            amount: amount || null,
            timestamp: time || null
          });
        }
      }
    }

    // 승자 판단 로직: 가장 많은 칩 증가량을 가진 플레이어
    let winnerName = null;
    let maxGain = 0;

    players.forEach(p => {
      const initial = parseInt(p.initialChips || 0, 10);
      const final = parseInt(p.finalChips || 0, 10);
      const gain = final - initial;

      if (gain > maxGain) {
        maxGain = gain;
        winnerName = p.name;
      }
    });

    return {
      handInfo,
      table,
      ante,
      smallBlind,
      bigBlind,
      hasBBAnte: ante > 0,
      board,
      actions: streets,
      players: players.map(p => ({
        name: p.name,
        initialChips: p.initialChips,
        finalChips: p.finalChips,
        hand: p.hand,
        role: (p.name === winnerName && maxGain > 0) ? 'winner' : null
      }))
    };
  }

  /**
   * 초기 데이터 로딩 (Type, Index)
   */
  async loadInitial() {
    const openLogModal = window.openLogModal;
    const logMessage = window.logMessage;
    const fetchCsv = window.fetchCsv;
    const APP_VERSION = window.APP_VERSION;
    const el = window.el;
    const CSV_TYPE_URL = window.CSV_TYPE_URL;
    const CSV_INDEX_URL = window.CSV_INDEX_URL;

    openLogModal();
    el.logDisplay.innerHTML = '';
    logMessage(`🚀 ${APP_VERSION} 초기 데이터 로딩 시작 (Type/Index) ...`);

    try {
      // IndexedDB 캐시 우선 시도
      logMessage('💾 IndexedDB 캐시 확인 중...');
      const cachedPlayers = await this.loadPlayersFromIndexedDB();

      let typeRows, idxRows;

      if (cachedPlayers && cachedPlayers.length > 0) {
        // 캐시 히트
        logMessage(`⚡ 캐시에서 ${cachedPlayers.length}명 플레이어 로드 (250배 빠름)`);

        window.state.playerDataByTable = {};
        cachedPlayers.forEach(p => {
          if (!window.state.playerDataByTable[p.table]) {
            window.state.playerDataByTable[p.table] = [];
          }
          window.state.playerDataByTable[p.table].push({
            name: p.name,
            chips: p.chips,
            seat: p.seat,
            nationality: p.nationality,
            keyplayer: p.keyplayer
          });
        });

        window.state.allTables = Object.keys(window.state.playerDataByTable);

        // 백그라운드 CSV 새로고침
        logMessage('🔄 백그라운드 CSV 새로고침 시작...');
        Promise.all([
          CSV_TYPE_URL.includes('http') ? fetchCsv(CSV_TYPE_URL) : Promise.resolve([]),
          CSV_INDEX_URL.includes('http') ? fetchCsv(CSV_INDEX_URL) : Promise.resolve([])
        ]).then(async ([freshTypeRows, freshIdxRows]) => {
          if (freshTypeRows.length) {
            this.buildTypeFromCsv(freshTypeRows);
            await this.savePlayersToIndexedDB(freshTypeRows);
            logMessage('✅ CSV 새로고침 완료 및 캐시 업데이트');
          }
          if (freshIdxRows.length) this.buildIndexFromCsv(freshIdxRows);
        }).catch(err => {
          console.log('⚠️ 백그라운드 CSV 새로고침 실패:', err.message);
        });

        // Index는 항상 최신 데이터 필요
        idxRows = CSV_INDEX_URL.includes('http') ? await fetchCsv(CSV_INDEX_URL) : [];
        if (idxRows.length) this.buildIndexFromCsv(idxRows);
      } else {
        // 캐시 미스
        logMessage('📡 CSV에서 데이터 로드 중...');
        const [freshTypeRows, freshIdxRows] = await Promise.all([
          CSV_TYPE_URL.includes('http') ? fetchCsv(CSV_TYPE_URL) : Promise.resolve([]),
          CSV_INDEX_URL.includes('http') ? fetchCsv(CSV_INDEX_URL) : Promise.resolve([])
        ]);

        typeRows = freshTypeRows;
        idxRows = freshIdxRows;

        if (typeRows.length) {
          this.buildTypeFromCsv(typeRows);
          await this.savePlayersToIndexedDB(typeRows);
          logMessage('✅ 플레이어 데이터 캐시 저장 완료');
        }
        if (idxRows.length) this.buildIndexFromCsv(idxRows);
      }

      window.state.actionState.handNumber = (window.state.allHandNumbers.length > 0 ? Math.max(...window.state.allHandNumbers.map(n => parseInt(n, 10) || 0)) + 1 : 1).toString();
      el.handNumberDisplay.textContent = `#${window.state.actionState.handNumber}`;
      el.dataStamp.textContent = `IDX rows: ${window.state.indexRows.length}`;

      // Index에서 마지막 카메라 번호 찾기
      logMessage('📷 카메라 번호 데이터 분석 시작...');

      if (window.state.indexRows.length > 0) {
        logMessage(`📊 총 ${window.state.indexRows.length}개의 핸드 데이터 검색 중...`);

        const sortedRows = window.state.indexRows.slice().sort((a, b) => {
          const numA = parseInt(a.handNumber, 10) || 0;
          const numB = parseInt(b.handNumber, 10) || 0;
          return numB - numA;
        });

        let maxCam1 = 0, maxCam2 = 0;
        let foundInHand = null;

        for (const row of sortedRows) {
          const cam1Num = parseInt(row.cam1no, 10) || 0;
          const cam2Num = parseInt(row.cam2no, 10) || 0;

          if (cam1Num > maxCam1) {
            maxCam1 = cam1Num;
            if (!foundInHand) foundInHand = row.handNumber;
          }
          if (cam2Num > maxCam2) {
            maxCam2 = cam2Num;
            if (!foundInHand) foundInHand = row.handNumber;
          }

          if (maxCam1 > 0 && maxCam2 > 0) break;
        }

        if (maxCam1 > 0 || maxCam2 > 0) {
          logMessage(`✅ 카메라 번호 발견 (핸드 #${foundInHand})`);
          if (maxCam1 > 0) {
            localStorage.setItem('pokerHandLogger_lastCam1', maxCam1);
            logMessage(`  → Cam1: ${maxCam1}`);
          }
          if (maxCam2 > 0) {
            localStorage.setItem('pokerHandLogger_lastCam2', maxCam2);
            logMessage(`  → Cam2: ${maxCam2}`);
          }
        }
      }

      // 초기 블라인드 설정
      const actionState = window.state.actionState;
      if (!actionState.smallBlind || !actionState.bigBlind) {
        actionState.smallBlind = '10K';
        actionState.bigBlind = '20K';
        actionState.hasBBAnte = false;
        logMessage('🎲 블라인드 초기값 설정 완료 (10K/20K)');
      }

      logMessage(`✅ 초기 데이터 로딩 완료 (핸드 #${window.state.actionState.handNumber})`);
      logMessage(`📊 플레이어: ${Object.values(window.state.playerDataByTable).flat().length}명, 테이블: ${window.state.allTables.length}개`);
    } catch (err) {
      console.error('초기 로딩 오류:', err);
      logMessage(`❌ 초기 로딩 실패: ${err.message}`, true);
    }
  }
}

// 싱글톤 인스턴스 생성
export const dataLoader = new DataLoader();

// 디버깅용 전역 노출
window.__dataLoader__ = dataLoader;
