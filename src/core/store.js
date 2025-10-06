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
      version: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '3.15.0',
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

    // Constants (from constants.js integration)
    this.constants = {
      APP: {
        VERSION: 'v3.15.0',
        VERSION_DATE: '2025-10-06',
        NAME: '포커 핸드 로거',
        GEMINI_API_PROXY: '/api/gemini/analyze',
        STORAGE_KEYS: {
          APPS_SCRIPT_URL: 'appsScriptUrl',
          SPREADSHEET_ID: 'googleSheetsSpreadsheetId',
          ACTION_STATE: 'actionState',
          SELECTED_TABLE: 'selectedTable',
          TIMEZONE: 'selectedTimezone'
        }
      },
      POKER: {
        MAX_PLAYERS_PER_TABLE: 10,
        MIN_PLAYERS_PER_TABLE: 2,
        MAX_TABLES: 50,
        STREETS: ['preflop', 'flop', 'turn', 'river'],
        STREET_LABELS: {
          preflop: 'Preflop',
          flop: 'Flop',
          turn: 'Turn',
          river: 'River'
        },
        SUITS: {
          s: '♠',
          h: '♥',
          d: '♦',
          c: '♣'
        },
        RANKS: ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'],
        POSITIONS: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'],
        ACTIONS: {
          FOLD: 'Fold',
          CHECK: 'Check',
          CALL: 'Call',
          BET: 'Bet',
          RAISE: 'Raise',
          ALLIN: 'All-in'
        }
      },
      UI: {
        FEEDBACK_DURATION: 2000,
        MODAL_AUTO_CLOSE_DELAY: 3000,
        DOUBLE_TAP_TIMEOUT: 2000,
        DEBOUNCE_DELAY: 300,
        TRANSITION_DURATION: 200,
        FADE_DURATION: 150,
        TABLES_PER_PAGE: 20,
        ITEMS_PER_PAGE: 50,
        COLORS: {
          PRIMARY: '#3B82F6',
          SUCCESS: '#10B981',
          WARNING: '#FBBF24',
          ERROR: '#EF4444',
          INFO: '#60A5FA'
        }
      },
      API: {
        TIMEOUT: 30000,
        MAX_RETRIES: 3,
        RETRY_DELAY_BASE: 1000,
        MAX_RETRY_DELAY: 5000,
        MAX_CONCURRENT_CALLS: 5,
        CACHE_EXPIRY: 60000
      },
      VALIDATION: {
        PLAYER_NAME_MIN_LENGTH: 1,
        PLAYER_NAME_MAX_LENGTH: 50,
        MIN_CHIPS: 0,
        MAX_CHIPS: 10000000,
        MIN_SEAT: 1,
        MAX_SEAT: 10,
        MIN_BET: 0,
        MAX_BET: 10000000
      },
      MESSAGES: {
        ERROR: {
          NETWORK_ERROR: '네트워크 연결을 확인해주세요',
          API_ERROR: 'API 요청에 실패했습니다',
          VALIDATION_ERROR: '입력 데이터가 올바르지 않습니다',
          UNAUTHORIZED: '인증이 필요합니다',
          NOT_FOUND: '데이터를 찾을 수 없습니다',
          TIMEOUT: '요청 시간이 초과되었습니다',
          UNKNOWN: '알 수 없는 오류가 발생했습니다'
        },
        SUCCESS: {
          SAVE_SUCCESS: '저장되었습니다',
          DELETE_SUCCESS: '삭제되었습니다',
          UPDATE_SUCCESS: '업데이트되었습니다',
          LOAD_SUCCESS: '로드되었습니다'
        }
      },
      REGEX: {
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        NUMBER: /^\d+$/,
        DECIMAL: /^\d+(\.\d+)?$/,
        CARD: /^[AKQJT2-9][shdc]$/i,
        APPS_SCRIPT_URL: /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/
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

  /**
   * 상수 가져오기
   * @param {string} category - 상수 카테고리 (APP, POKER, UI, API, VALIDATION, MESSAGES, REGEX)
   * @param {string} key - 상수 키 (선택)
   */
  getConstant(category, key) {
    if (!key) return this.constants[category];
    return this.constants[category]?.[key];
  }
}

// 싱글톤 인스턴스 생성
export const store = new AppStore();

// 디버깅용 전역 노출
window.__store__ = store;
