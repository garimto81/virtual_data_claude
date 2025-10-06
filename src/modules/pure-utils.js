/**
 * 순수 함수 모음 (외부 의존성 없음)
 * Step 2: 순수 함수 분리
 * Phase 2: formatters.js 통합
 */

/**
 * 좌석 번호 파싱
 * @param {string|number} seat - 좌석 정보 ("#5", "Seat 10", 5 등)
 * @returns {number} - 파싱된 좌석 번호 (실패시 0)
 */
export function parseSeatNumber(seat) {
  if (!seat && seat !== 0) return 0;
  const seatStr = String(seat).trim();
  if (!seatStr) return 0;

  // "#1", "#2" 등의 형식에서 숫자만 추출
  const cleanSeat = seatStr.replace(/[#]/g, '');
  const seatNum = parseInt(cleanSeat, 10);
  return isNaN(seatNum) ? 0 : seatNum;
}

/**
 * 좌석 번호 비교 함수
 * @param {object} a - 플레이어 객체 a
 * @param {object} b - 플레이어 객체 b
 * @returns {number} - 비교 결과
 */
export function compareSeatNumbers(a, b) {
  const seatA = parseSeatNumber(a.seat);
  const seatB = parseSeatNumber(b.seat);
  return seatA - seatB;
}

/**
 * 플레이어의 좌석 번호 가져오기
 * @param {object} player - 플레이어 객체
 * @returns {number} - 좌석 번호
 */
export function getPlayerSeatNumber(player) {
  return parseSeatNumber(player.seat);
}

/**
 * 칩 포맷 (천 단위 구분)
 * @param {number} chips - 칩 수량
 * @returns {string} - 포맷된 문자열 ("1,000")
 */
export function formatChips(chips) {
  if (!chips && chips !== 0) return '0';
  return chips.toLocaleString();
}

/**
 * 카드 표시 포맷 (As, Kh 등 → A♠️, K♥️)
 * @param {string} cardId - 카드 ID ("As", "Kh" 등)
 * @returns {string} - 포맷된 카드 문자열
 */
export function formatCardDisplay(cardId) {
  if (!cardId) return '';
  const rank = cardId.slice(0, -1);
  const suit = cardId.slice(-1);
  const suitSymbols = {
    h: '♥️',
    d: '♦️',
    c: '♣️',
    s: '♠️'
  };
  return rank + (suitSymbols[suit] || suit);
}

// ========== formatters.js 통합 ==========

/**
 * 숫자를 천 단위 구분자로 포맷
 * @param {string|number} val - 포맷할 값
 * @returns {string} 포맷된 숫자 문자열
 */
export function formatNumber(val) {
  return val ? new Intl.NumberFormat('en-US').format(String(val).replace(/,/g,'')) : '';
}

/**
 * 포맷된 숫자에서 쉼표 제거
 * @param {string} val - 포맷된 숫자 문자열
 * @returns {string} 쉼표가 제거된 숫자 문자열
 */
export function unformatNumber(val) {
  return String(val || '').replace(/,/g, '');
}

/**
 * 4자리 숫자를 0으로 패딩
 * @param {string|number} n - 숫자
 * @returns {string} 4자리로 패딩된 문자열
 */
export function pad4(n) {
  return String(Math.max(0, parseInt(String(n||'0').replace(/\D/g,''),10)||0)).padStart(4, '0');
}

/**
 * 카멜 케이스로 변환
 * @param {string} str - 변환할 문자열
 * @returns {string} 카멜 케이스 문자열
 */
export function toCamelCase(str) {
  return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
}

/**
 * 날짜를 로컬 포맷으로 변환
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} 포맷된 날짜 문자열
 */
export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * 시간을 로컬 포맷으로 변환
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} 포맷된 시간 문자열
 */
export function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * 날짜와 시간을 로컬 포맷으로 변환
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} 포맷된 날짜시간 문자열
 */
export function formatDateTime(date) {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * 상대 시간 포맷 (예: "5분 전")
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} 상대 시간 문자열
 */
export function formatRelativeTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return formatDate(date);
}

/**
 * 퍼센트 포맷
 * @param {number} value - 0-1 사이의 값
 * @param {number} decimals - 소수점 자리수
 * @returns {string} 퍼센트 문자열
 */
export function formatPercent(value, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 지정된 시간만큼 대기
 * @param {number} ms - 대기 시간 (밀리초)
 * @returns {Promise} - 대기 완료 Promise
 */
export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
