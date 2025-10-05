/**
 * ============================================
 * 포커 핸드 로거 - 상수 정의
 * ============================================
 */

// 버전 정보
export const APP_VERSION = 'v3.10.0 - Phase 2 Week 5 Complete: Pot Calculation Documentation';
export const VERSION_DATE = '2025-10-05';
export const VERSION_INFO = `포커 핸드 로거 ${APP_VERSION} (${VERSION_DATE})`;

// Spreadsheet ID
export const DEFAULT_SPREADSHEET_ID = '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U';

// CSV Export URLs
export const CSV_TYPE_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/export?format=csv&gid=0`;
export const CSV_INDEX_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/export?format=csv&gid=1234567890`;

// 캐시 설정
export const CACHE_TTL = 5 * 60 * 1000; // 5분 (밀리초)

// 재시도 설정
export const MAX_RETRIES = 3;
export const INITIAL_RETRY_DELAY = 1000; // 1초

// UI 설정
export const FEEDBACK_DURATION = 5000; // 5초
