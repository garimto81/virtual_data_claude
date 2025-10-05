/**
 * Hand Recorder Module
 * 핸드 기록 및 Google Sheets 전송 기능
 */

import { store } from '../core/store.js';

export class HandRecorder {
  constructor() {
    this.isSending = false;
  }

  /**
   * Google Sheets로 핸드 데이터 전송
   * @param {Object} payload - 전송할 데이터 (rows, indexMeta, typeUpdates)
   * @returns {Promise<Object>} 응답 결과
   */
  async sendToGoogleSheet(payload) {
    const appsScriptUrl = store.getConfig('appsScriptUrl');

    if (!appsScriptUrl) {
      throw new Error('Apps Script URL이 설정되지 않았습니다.');
    }

    console.log('[HandRecorder] Apps Script URL:', appsScriptUrl);

    // x-www-form-urlencoded로 전송 (CORS 우회)
    const form = new URLSearchParams();
    form.append('payload', JSON.stringify(payload));

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: form.toString(),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`서버 응답 오류: ${response.status} ${text || ''}`);
    }

    return await response.json().catch(() => ({}));
  }

  /**
   * 전송 중 상태 확인
   */
  getIsSending() {
    return this.isSending;
  }

  /**
   * 전송 중 상태 설정
   */
  setIsSending(value) {
    this.isSending = value;
  }
}

// 싱글톤 인스턴스
export const handRecorder = new HandRecorder();
