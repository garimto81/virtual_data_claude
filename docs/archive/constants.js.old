/**
 * 📦 애플리케이션 상수
 * Virtual Data - Poker Hand Logger
 * Version: 1.0.0
 *
 * 모든 하드코딩된 값을 중앙에서 관리합니다
 */

(function() {
  'use strict';

  /**
   * 애플리케이션 설정
   */
  const APP_CONFIG = {
    VERSION: 'v3.8.0',
    VERSION_DATE: '2025-10-02',
    NAME: '포커 핸드 로거',

    // API 엔드포인트
    GEMINI_API_PROXY: '/api/gemini/analyze',

    // 로컬 스토리지 키
    STORAGE_KEYS: {
      APPS_SCRIPT_URL: 'appsScriptUrl',
      SPREADSHEET_ID: 'googleSheetsSpreadsheetId',
      ACTION_STATE: 'actionState',
      SELECTED_TABLE: 'selectedTable',
      TIMEZONE: 'selectedTimezone'
    }
  };

  /**
   * 포커 게임 상수
   */
  const POKER_CONFIG = {
    // 테이블 설정
    MAX_PLAYERS_PER_TABLE: 10,
    MIN_PLAYERS_PER_TABLE: 2,
    MAX_TABLES: 50,

    // 스트릿
    STREETS: ['preflop', 'flop', 'turn', 'river'],
    STREET_LABELS: {
      preflop: 'Preflop',
      flop: 'Flop',
      turn: 'Turn',
      river: 'River'
    },

    // 카드
    SUITS: {
      s: '♠',
      h: '♥',
      d: '♦',
      c: '♣'
    },
    RANKS: ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'],

    // 포지션
    POSITIONS: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'],

    // 액션
    ACTIONS: {
      FOLD: 'Fold',
      CHECK: 'Check',
      CALL: 'Call',
      BET: 'Bet',
      RAISE: 'Raise',
      ALLIN: 'All-in'
    }
  };

  /**
   * UI 상수
   */
  const UI_CONFIG = {
    // 타임아웃
    FEEDBACK_DURATION: 2000,           // 피드백 표시 시간
    MODAL_AUTO_CLOSE_DELAY: 3000,      // 모달 자동 닫기
    DOUBLE_TAP_TIMEOUT: 2000,          // 더블탭 타임아웃
    DEBOUNCE_DELAY: 300,               // 디바운스 지연

    // 애니메이션
    TRANSITION_DURATION: 200,          // 기본 트랜지션
    FADE_DURATION: 150,                // 페이드 애니메이션

    // 페이지네이션
    TABLES_PER_PAGE: 20,               // 테이블 목록 페이지당 개수
    ITEMS_PER_PAGE: 50,                // 일반 목록 페이지당 개수

    // 색상
    COLORS: {
      PRIMARY: '#3B82F6',
      SUCCESS: '#10B981',
      WARNING: '#FBBF24',
      ERROR: '#EF4444',
      INFO: '#60A5FA'
    }
  };

  /**
   * API 설정
   */
  const API_CONFIG = {
    // 타임아웃
    TIMEOUT: 30000,                    // 30초

    // 재시도
    MAX_RETRIES: 3,
    RETRY_DELAY_BASE: 1000,            // 1초
    MAX_RETRY_DELAY: 5000,             // 5초

    // 동시 호출 제한
    MAX_CONCURRENT_CALLS: 5,

    // 캐시
    CACHE_EXPIRY: 60000                // 1분
  };

  /**
   * 검증 규칙
   */
  const VALIDATION_RULES = {
    // 플레이어
    PLAYER_NAME_MIN_LENGTH: 1,
    PLAYER_NAME_MAX_LENGTH: 50,

    // 칩
    MIN_CHIPS: 0,
    MAX_CHIPS: 10000000,

    // 좌석
    MIN_SEAT: 1,
    MAX_SEAT: 10,

    // 베팅
    MIN_BET: 0,
    MAX_BET: 10000000
  };

  /**
   * 에러 메시지
   */
  const ERROR_MESSAGES = {
    NETWORK_ERROR: '네트워크 연결을 확인해주세요',
    API_ERROR: 'API 요청에 실패했습니다',
    VALIDATION_ERROR: '입력 데이터가 올바르지 않습니다',
    UNAUTHORIZED: '인증이 필요합니다',
    NOT_FOUND: '데이터를 찾을 수 없습니다',
    TIMEOUT: '요청 시간이 초과되었습니다',
    UNKNOWN: '알 수 없는 오류가 발생했습니다'
  };

  /**
   * 성공 메시지
   */
  const SUCCESS_MESSAGES = {
    SAVE_SUCCESS: '저장되었습니다',
    DELETE_SUCCESS: '삭제되었습니다',
    UPDATE_SUCCESS: '업데이트되었습니다',
    LOAD_SUCCESS: '로드되었습니다'
  };

  /**
   * 정규식 패턴
   */
  const REGEX_PATTERNS = {
    // 이메일
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    // 숫자
    NUMBER: /^\d+$/,
    DECIMAL: /^\d+(\.\d+)?$/,

    // 카드
    CARD: /^[AKQJT2-9][shdc]$/i,

    // Apps Script URL
    APPS_SCRIPT_URL: /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/
  };

  /**
   * 헬퍼 함수
   */
  const HELPERS = {
    /**
     * 버전 정보 문자열 생성
     */
    getVersionInfo() {
      return `${APP_CONFIG.NAME} ${APP_CONFIG.VERSION} (${APP_CONFIG.VERSION_DATE})`;
    },

    /**
     * 스트릿 라벨 가져오기
     */
    getStreetLabel(street) {
      return POKER_CONFIG.STREET_LABELS[street] || street;
    },

    /**
     * 액션 라벨 가져오기
     */
    getActionLabel(action) {
      return POKER_CONFIG.ACTIONS[action.toUpperCase()] || action;
    },

    /**
     * 색상 가져오기
     */
    getColor(type) {
      return UI_CONFIG.COLORS[type.toUpperCase()] || UI_CONFIG.COLORS.INFO;
    }
  };

  // 전역 객체에 노출
  window.APP_CONSTANTS = APP_CONFIG;
  window.POKER_CONFIG = POKER_CONFIG;
  window.UI_CONFIG = UI_CONFIG;
  window.API_CONFIG = API_CONFIG;
  window.VALIDATION_RULES = VALIDATION_RULES;
  window.ERROR_MESSAGES = ERROR_MESSAGES;
  window.SUCCESS_MESSAGES = SUCCESS_MESSAGES;
  window.REGEX_PATTERNS = REGEX_PATTERNS;
  window.CONSTANTS_HELPERS = HELPERS;

  // 하위 호환성을 위한 별칭
  window.APP_VERSION = APP_CONFIG.VERSION;
  window.VERSION_DATE = APP_CONFIG.VERSION_DATE;
  window.VERSION_INFO = HELPERS.getVersionInfo();

  logger.info('📦 Constants v1.0.0 Loaded');
  logger.debug('App Version:', APP_CONFIG.VERSION);

})();
