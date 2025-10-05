/**
 * 중앙 상태 관리 스토어
 * Step 3: 전역 스토어 구축
 */
class AppStore {
  constructor() {
    // 기존 window.state 통합
    this.state = {
      currentStreet: 'preflop',
      camNumbers: { cam1no: '', cam2no: '' },
      lastCamNo: null,

      playerDataByTable: {},
      camPreset: { cam1: '', cam2: '' },
      allTables: [],
      indexRows: [],
      allHandNumbers: [],
      handCsvCache: null,
      allHandData: {},
      selectedTable: null,
      playersInHand: [],
      board: [],
      playerStatus: {},
      buttonPosition: null,
      seatMap: {},
      nextActionSeat: null,

      // 액션 자동 매핑 시스템
      actionInputMode: localStorage.getItem('actionInputMode') || 'auto',
      currentActionIndex: 0,
      actionQueue: [],
      nextActionPlayer: null,
      smartCheckCall: true,

      actionState: {
        handNumber: '',
        smallBlind: '',
        bigBlind: '',
        hasBBAnte: false,
        preflop: [],
        flop: [],
        turn: [],
        river: [],
      },

      modalState: {
        cardTarget: null,
        actionPadStreet: null,
        actionPadPlayer: null,
        actionPadCurrentAction: null,
        keypadTarget: null,
        keypadOptions: {},
      },

      selectedTimezone: 'Asia/Seoul',

      // 칩 분석 관련 상태
      chipColors: [],
      maxChips: 5,
      currentChipSlot: null,
      playerStacks: {},
      currentAnalyzingPlayer: null,
      stackImages: []
    };

    // 기존 window.APP_CONFIG 통합
    const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwEcsF1F_RLLW_qkQIFkrwmut-zN0fHOqsAKs5B8PgHZAz2_O5sA8o2W5zZ3nD-5tjY/exec';

    this.config = {
      isInitialized: false,
      appsScriptUrl: localStorage.getItem('appsScriptUrl') || DEFAULT_APPS_SCRIPT_URL,
      autoInit: false,
      version: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '3.11.0',
      spreadsheetId: localStorage.getItem('googleSheetsSpreadsheetId') || '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U',
      data: {},
      settings: {
        debugMode: false,
        autoSave: true,
        offlineMode: false
      },
      state: {
        lastConnection: null,
        connectionAttempts: 0,
        isOnline: navigator.onLine
      }
    };
  }

  /**
   * 전체 상태 가져오기
   */
  getState() {
    return this.state;
  }

  /**
   * 상태 업데이트 (병합)
   * @param {object} newState - 업데이트할 상태
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
  }

  /**
   * 설정 값 가져오기
   * @param {string} key - 설정 키
   */
  getConfig(key) {
    return this.config[key];
  }

  /**
   * 설정 값 설정
   * @param {string} key - 설정 키
   * @param {any} value - 설정 값
   */
  setConfig(key, value) {
    this.config[key] = value;

    // localStorage 동기화 (특정 키만)
    if (key === 'appsScriptUrl') {
      localStorage.setItem('appsScriptUrl', value);
    } else if (key === 'spreadsheetId') {
      localStorage.setItem('googleSheetsSpreadsheetId', value);
    }
  }

  /**
   * 전체 설정 가져오기
   */
  getAllConfig() {
    return this.config;
  }
}

// 싱글톤 인스턴스 생성
export const store = new AppStore();

// 디버깅용 전역 노출
window.__store__ = store;
