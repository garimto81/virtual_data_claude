/**
 * ✅ 검증 유틸리티
 * Virtual Data - Poker Hand Logger
 * Version: 1.0.0
 *
 * 입력 데이터 검증 함수들
 */

(function() {
  'use strict';

  /**
   * 플레이어 이름 검증
   * @param {string} name - 플레이어 이름
   * @returns {object} { valid: boolean, error?: string }
   */
  function validatePlayerName(name) {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: '플레이어 이름을 입력해주세요' };
    }

    const trimmed = name.trim();

    if (trimmed.length < VALIDATION_RULES.PLAYER_NAME_MIN_LENGTH) {
      return { valid: false, error: '플레이어 이름이 너무 짧습니다' };
    }

    if (trimmed.length > VALIDATION_RULES.PLAYER_NAME_MAX_LENGTH) {
      return { valid: false, error: '플레이어 이름이 너무 깁니다' };
    }

    return { valid: true };
  }

  /**
   * 칩 수량 검증
   * @param {number|string} chips - 칩 수량
   * @returns {object} { valid: boolean, error?: string }
   */
  function validateChips(chips) {
    const num = parseInt(unformatNumber(chips), 10);

    if (isNaN(num)) {
      return { valid: false, error: '올바른 숫자를 입력해주세요' };
    }

    if (num < VALIDATION_RULES.MIN_CHIPS) {
      return { valid: false, error: `최소 칩은 ${VALIDATION_RULES.MIN_CHIPS}입니다` };
    }

    if (num > VALIDATION_RULES.MAX_CHIPS) {
      return { valid: false, error: `최대 칩은 ${formatNumber(VALIDATION_RULES.MAX_CHIPS)}입니다` };
    }

    return { valid: true, value: num };
  }

  /**
   * 좌석 번호 검증
   * @param {number|string} seat - 좌석 번호
   * @returns {object} { valid: boolean, error?: string }
   */
  function validateSeat(seat) {
    const num = parseInt(seat, 10);

    if (isNaN(num)) {
      return { valid: false, error: '올바른 좌석 번호를 입력해주세요' };
    }

    if (num < VALIDATION_RULES.MIN_SEAT || num > VALIDATION_RULES.MAX_SEAT) {
      return {
        valid: false,
        error: `좌석 번호는 ${VALIDATION_RULES.MIN_SEAT}-${VALIDATION_RULES.MAX_SEAT} 사이여야 합니다`
      };
    }

    return { valid: true, value: num };
  }

  /**
   * 베팅 금액 검증
   * @param {number|string} amount - 베팅 금액
   * @returns {object} { valid: boolean, error?: string }
   */
  function validateBet(amount) {
    const num = parseInt(unformatNumber(amount), 10);

    if (isNaN(num)) {
      return { valid: false, error: '올바른 금액을 입력해주세요' };
    }

    if (num < VALIDATION_RULES.MIN_BET) {
      return { valid: false, error: `최소 베팅은 ${VALIDATION_RULES.MIN_BET}입니다` };
    }

    if (num > VALIDATION_RULES.MAX_BET) {
      return { valid: false, error: `최대 베팅은 ${formatNumber(VALIDATION_RULES.MAX_BET)}입니다` };
    }

    return { valid: true, value: num };
  }

  /**
   * 이메일 검증
   * @param {string} email - 이메일 주소
   * @returns {object} { valid: boolean, error?: string }
   */
  function validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: '이메일을 입력해주세요' };
    }

    if (!REGEX_PATTERNS.EMAIL.test(email)) {
      return { valid: false, error: '올바른 이메일 형식이 아닙니다' };
    }

    return { valid: true };
  }

  /**
   * 카드 검증
   * @param {string} card - 카드 (예: "As", "Kh")
   * @returns {object} { valid: boolean, error?: string }
   */
  function validateCard(card) {
    if (!card || typeof card !== 'string') {
      return { valid: false, error: '카드를 입력해주세요' };
    }

    if (!REGEX_PATTERNS.CARD.test(card)) {
      return { valid: false, error: '올바른 카드 형식이 아닙니다 (예: As, Kh)' };
    }

    return { valid: true };
  }

  /**
   * Apps Script URL 검증
   * @param {string} url - Apps Script URL
   * @returns {object} { valid: boolean, error?: string }
   */
  function validateAppsScriptUrl(url) {
    if (!url || typeof url !== 'string') {
      return { valid: false, error: 'Apps Script URL을 입력해주세요' };
    }

    if (!REGEX_PATTERNS.APPS_SCRIPT_URL.test(url)) {
      return {
        valid: false,
        error: '올바른 Apps Script URL 형식이 아닙니다'
      };
    }

    return { valid: true };
  }

  /**
   * 필수 필드 검증
   * @param {object} data - 검증할 데이터
   * @param {string[]} requiredFields - 필수 필드 배열
   * @returns {object} { valid: boolean, error?: string, missing?: string[] }
   */
  function validateRequiredFields(data, requiredFields) {
    const missing = [];

    for (const field of requiredFields) {
      if (!data[field]) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return {
        valid: false,
        error: `필수 필드가 누락되었습니다: ${missing.join(', ')}`,
        missing
      };
    }

    return { valid: true };
  }

  /**
   * 범위 검증
   * @param {number} value - 검증할 값
   * @param {number} min - 최소값
   * @param {number} max - 최대값
   * @returns {object} { valid: boolean, error?: string }
   */
  function validateRange(value, min, max) {
    const num = parseFloat(value);

    if (isNaN(num)) {
      return { valid: false, error: '올바른 숫자를 입력해주세요' };
    }

    if (num < min || num > max) {
      return {
        valid: false,
        error: `${min}에서 ${max} 사이의 값을 입력해주세요`
      };
    }

    return { valid: true, value: num };
  }

  /**
   * URL 검증
   * @param {string} url - URL
   * @returns {object} { valid: boolean, error?: string }
   */
  function validateUrl(url) {
    if (!url || typeof url !== 'string') {
      return { valid: false, error: 'URL을 입력해주세요' };
    }

    try {
      new URL(url);
      return { valid: true };
    } catch {
      return { valid: false, error: '올바른 URL 형식이 아닙니다' };
    }
  }

  // 전역 노출
  window.validatePlayerName = validatePlayerName;
  window.validateChips = validateChips;
  window.validateSeat = validateSeat;
  window.validateBet = validateBet;
  window.validateEmail = validateEmail;
  window.validateCard = validateCard;
  window.validateAppsScriptUrl = validateAppsScriptUrl;
  window.validateRequiredFields = validateRequiredFields;
  window.validateRange = validateRange;
  window.validateUrl = validateUrl;

  logger.debug('✅ Validators loaded');

})();
