/**
 * 순수 함수 모음 (외부 의존성 없음)
 * Step 2: 순수 함수 분리
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
