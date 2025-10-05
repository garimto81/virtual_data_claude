/**
 * ============================================
 * 포커 핸드 로거 - CSV 파싱 유틸리티
 * ============================================
 */

/**
 * CSV 텍스트를 파싱하여 2차원 배열로 변환
 * @param {string} text - CSV 텍스트
 * @returns {Array<Array<string>>} - 파싱된 2차원 배열
 * 
 * Papa Parse 라이브러리 사용
 * [Phase 0 Week 2] Papa Parse로 CSV 파싱 교체 (기존 150줄 → 6줄)
 */
export function parseCSV(text) {
  const result = Papa.parse(text, {
    header: false,
    skipEmptyLines: true
  });
  return result.data;
}
