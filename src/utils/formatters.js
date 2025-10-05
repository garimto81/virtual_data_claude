/**
 * ============================================
 * 포커 핸드 로거 - 포맷팅 유틸리티
 * ============================================
 * 숫자, 날짜, 문자열 포맷팅 함수들
 */

/**
 * 숫자를 천 단위 구분자로 포맷
 * @param {string|number} val - 포맷할 값
 * @returns {string} 포맷된 숫자 문자열
 * @example formatNumber(1000) // "1,000"
 * @example formatNumber("1234567") // "1,234,567"
 */
export const formatNumber = (val) =>
  val ? new Intl.NumberFormat('en-US').format(String(val).replace(/,/g,'')) : '';

/**
 * 포맷된 숫자에서 쉼표 제거
 * @param {string} val - 포맷된 숫자 문자열
 * @returns {string} 쉼표가 제거된 숫자 문자열
 * @example unformatNumber("1,000") // "1000"
 */
export const unformatNumber = (val) =>
  String(val || '').replace(/,/g, '');

/**
 * 칩 수량을 K, M 단위로 포맷
 * @param {number} amount - 칩 수량
 * @returns {string} 포맷된 문자열
 * @example formatChips(1000) // "1K"
 * @example formatChips(1500000) // "1.5M"
 */
export function formatChips(amount) {
  if (!amount) return '0';

  const num = parseInt(amount, 10);

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * 4자리 숫자를 0으로 패딩
 * @param {string|number} n - 숫자
 * @returns {string} 4자리로 패딩된 문자열
 * @example pad4(1) // "0001"
 * @example pad4(123) // "0123"
 */
export const pad4 = (n) =>
  String(Math.max(0, parseInt(String(n||'0').replace(/\D/g,''),10)||0)).padStart(4, '0');

/**
 * 카멜 케이스로 변환
 * @param {string} str - 변환할 문자열
 * @returns {string} 카멜 케이스 문자열
 * @example toCamelCase("hello-world") // "helloWorld"
 */
export const toCamelCase = (str) =>
  str.replace(/-([a-z])/g, g => g[1].toUpperCase());

/**
 * 카드 ID를 표시용으로 포맷
 * @param {string} cardId - 카드 ID (예: "As", "Kh")
 * @returns {string} HTML 문자열
 * @example formatCardDisplay("As") // '<div class="card-display...">A♠</div>'
 */
export function formatCardDisplay(cardId) {
  if (!cardId) return '';

  const rank = cardId.slice(0, -1);
  const suitKey = cardId.slice(-1);
  const colorClass = (suitKey === 'h' || suitKey === 'd') ? 'text-red-500' : 'text-black';
  const suits = { s: '♠', h: '♥', d: '♦', c: '♣' };

  return `<div class="card-display h-full w-full ${colorClass}"><div class="rank">${rank}</div><div>${suits[suitKey] || ''}</div></div>`;
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
 * @example await sleep(1000); // 1초 대기
 */
export const sleep = (ms) =>
  new Promise(r => setTimeout(r, ms));
