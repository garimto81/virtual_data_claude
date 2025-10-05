/**
 * ============================================
 * 포커 핸드 로거 - 전역 설정 관리
 * ============================================
 */

import { APP_VERSION, DEFAULT_SPREADSHEET_ID } from './constants.js';

// 전역 APP_CONFIG 객체
export const APP_CONFIG = {
  isInitialized: false,
  appsScriptUrl: null,
  autoInit: false,
  version: APP_VERSION,
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

/**
 * localStorage에서 설정 초기화
 */
export function initializeSettings() {
  // Apps Script URL 로드
  const storedUrl = localStorage.getItem('appsScriptUrl');
  if (storedUrl) {
    APP_CONFIG.appsScriptUrl = storedUrl;
    console.log('✅ localStorage에서 Apps Script URL 복원:', storedUrl);
  } else {
    console.log('⚠️ localStorage에 Apps Script URL이 없음');
  }

  // Spreadsheet ID 로드 또는 기본값 설정
  const storedSpreadsheetId = localStorage.getItem('googleSheetsSpreadsheetId');
  if (!storedSpreadsheetId) {
    localStorage.setItem('googleSheetsSpreadsheetId', DEFAULT_SPREADSHEET_ID);
    console.log('✅ 기본 Spreadsheet ID 설정:', DEFAULT_SPREADSHEET_ID);
  } else {
    console.log('✅ localStorage에서 Spreadsheet ID 복원:', storedSpreadsheetId);
  }
}

/**
 * 네트워크 상태 모니터링 설정
 */
export function setupNetworkMonitoring() {
  window.addEventListener('online', () => {
    APP_CONFIG.state.isOnline = true;
    console.log('🌐 온라인 상태로 변경됨');
  });

  window.addEventListener('offline', () => {
    APP_CONFIG.state.isOnline = false;
    console.log('📱 오프라인 상태로 변경됨');
  });
}
