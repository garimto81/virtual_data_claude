/**
 * ============================================
 * 포커 핸드 로거 - 좌석 파싱 유틸리티
 * ============================================
 */

/**
 * 좌석 번호 파싱 - "#1", "#2" 형식을 숫자로 변환
 * @param {string|number} seat - 좌석 정보
 * @returns {number} - 파싱된 좌석 번호 (실패시 0)
 * @example parseSeatNumber("#1") // 1
 * @example parseSeatNumber("2") // 2
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
