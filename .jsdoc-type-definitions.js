/**
 * ============================================
 * JSDoc Type Definitions
 * Virtual Data - Poker Hand Logger
 * ============================================
 *
 * 프로젝트 전체에서 사용하는 공통 타입 정의
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - 검증 성공 여부
 * @property {string} [error] - 에러 메시지 (검증 실패 시)
 * @property {*} [value] - 검증된 값
 * @property {string[]} [missing] - 누락된 필드 (validateRequiredFields)
 */

/**
 * @typedef {Object} Player
 * @property {string} name - 플레이어 이름
 * @property {number} chips - 칩 수량
 * @property {number} seat - 좌석 번호 (1-10)
 * @property {string} table - 테이블 이름
 * @property {string} [status] - 상태 (IN/OUT)
 * @property {string} [position] - 포지션 (BTN/SB/BB/UTG/MP/CO)
 */

/**
 * @typedef {Object} HandData
 * @property {string} handId - 핸드 ID
 * @property {string} table - 테이블 이름
 * @property {string} street - 스트릿 (preflop/flop/turn/river)
 * @property {number} pot - 팟 사이즈
 * @property {string[]} boardCards - 보드 카드 배열
 * @property {Action[]} actions - 액션 배열
 * @property {Date} timestamp - 생성 시간
 */

/**
 * @typedef {Object} Action
 * @property {string} playerId - 플레이어 ID
 * @property {string} type - 액션 타입 (Fold/Check/Call/Bet/Raise/AllIn)
 * @property {number} [amount] - 금액 (베팅 액션의 경우)
 * @property {string} street - 스트릿
 * @property {Date} timestamp - 실행 시간
 */

/**
 * @typedef {Object} CacheEntry
 * @property {*} value - 캐시된 값
 * @property {number} expiresAt - 만료 시간 (타임스탬프)
 */

/**
 * @typedef {Object} CacheStats
 * @property {number} hits - 캐시 히트 횟수
 * @property {number} misses - 캐시 미스 횟수
 * @property {number} sets - 캐시 저장 횟수
 * @property {number} evictions - 제거 횟수
 * @property {number} size - 현재 크기
 * @property {string} hitRate - 히트율 (퍼센트)
 */

/**
 * @typedef {Object} PerformanceMetric
 * @property {number} duration - 실행 시간 (ms)
 * @property {number} memoryDelta - 메모리 변화량 (MB)
 * @property {number} timestamp - 측정 시간
 */

/**
 * @typedef {Object} FunctionStats
 * @property {number} count - 호출 횟수
 * @property {string} avg - 평균 실행 시간 (ms)
 * @property {string} min - 최소 실행 시간 (ms)
 * @property {string} max - 최대 실행 시간 (ms)
 * @property {string} p50 - 중간값 (ms)
 * @property {string} p95 - 95 백분위수 (ms)
 * @property {string} p99 - 99 백분위수 (ms)
 */

/**
 * @typedef {Object} APIStats
 * @property {number} totalCalls - 전체 호출 횟수
 * @property {string} successRate - 성공률 (퍼센트)
 * @property {string} avgDuration - 평균 응답 시간 (ms)
 * @property {string} p95Duration - 95 백분위수 응답 시간 (ms)
 * @property {string} maxDuration - 최대 응답 시간 (ms)
 */

/**
 * @typedef {Object} BatchItem
 * @property {*} data - 배치 데이터
 * @property {Function} resolve - Promise resolve 함수
 * @property {Function} reject - Promise reject 함수
 * @property {number} priority - 우선순위 (0-10)
 * @property {number} retryCount - 재시도 횟수
 * @property {number} timestamp - 추가 시간
 */

/**
 * @typedef {Object} BatcherStats
 * @property {number} totalQueued - 전체 큐 추가 횟수
 * @property {number} totalProcessed - 전체 처리 완료 횟수
 * @property {number} totalFailed - 전체 실패 횟수
 * @property {number} batchCount - 배치 실행 횟수
 * @property {number} queueSize - 현재 큐 크기
 * @property {boolean} processing - 처리 중 여부
 */

/**
 * @typedef {Object} AppError
 * @property {string} message - 에러 메시지
 * @property {string} code - 에러 코드
 * @property {string} userMessage - 사용자용 메시지
 * @property {Object} details - 추가 상세 정보
 */

/**
 * @typedef {Object} LoggerConfig
 * @property {number} level - 로그 레벨 (DEBUG/INFO/WARN/ERROR)
 * @property {boolean} isDevelopment - 개발 환경 여부
 * @property {boolean} isProduction - 프로덕션 환경 여부
 */

/**
 * @typedef {'DEBUG'|'INFO'|'WARN'|'ERROR'} LogLevel
 */

/**
 * @typedef {'loaded'|'loading'|'not-loaded'} LoadingStatus
 */

/**
 * @typedef {Object} LazyLoadOptions
 * @property {boolean} [defer=false] - defer 속성 사용 여부
 * @property {boolean} [async=true] - async 속성 사용 여부
 * @property {number} [timeout=10000] - 타임아웃 (ms)
 */

/**
 * @typedef {Object} CacheOptions
 * @property {string} [name='default'] - 캐시 이름
 * @property {number} [maxSize=100] - 최대 크기
 * @property {number} [ttl=300000] - TTL (ms)
 */

/**
 * @typedef {Object} BatcherOptions
 * @property {string} [name='default'] - 배처 이름
 * @property {number} [batchSize=10] - 배치 크기
 * @property {number} [flushInterval=1000] - 플러시 간격 (ms)
 * @property {number} [maxRetries=3] - 최대 재시도 횟수
 * @property {Function} processFn - 배치 처리 함수
 */

/**
 * @callback ProcessFunction
 * @param {Array<*>} batch - 배치 데이터 배열
 * @returns {Promise<Array<{success: boolean, data?: *, error?: string}>>}
 */

/**
 * Enum for poker positions
 * @readonly
 * @enum {string}
 */
const PokerPosition = {
  BTN: 'BTN',
  SB: 'SB',
  BB: 'BB',
  UTG: 'UTG',
  MP: 'MP',
  CO: 'CO'
};

/**
 * Enum for poker streets
 * @readonly
 * @enum {string}
 */
const PokerStreet = {
  PREFLOP: 'preflop',
  FLOP: 'flop',
  TURN: 'turn',
  RIVER: 'river'
};

/**
 * Enum for poker actions
 * @readonly
 * @enum {string}
 */
const PokerAction = {
  FOLD: 'Fold',
  CHECK: 'Check',
  CALL: 'Call',
  BET: 'Bet',
  RAISE: 'Raise',
  ALL_IN: 'AllIn'
};

/**
 * Enum for error codes
 * @readonly
 * @enum {string}
 */
const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};
