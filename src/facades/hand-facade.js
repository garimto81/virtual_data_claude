/**
 * Hand Facade
 * 기존 함수명을 유지하면서 모듈화된 HandRecorder 사용
 * onclick 이벤트 호환성 보장
 */

import { handRecorder } from '../modules/hand-recorder.js';

/**
 * CSV 행 생성 (기존 함수명 유지)
 */
export function generateRows_v46() {
  return handRecorder.generateRows();
}

/**
 * Index 메타데이터 빌드 (기존 함수명 유지)
 */
export function buildIndexMeta() {
  return handRecorder.buildIndexMeta();
}

/**
 * Type 업데이트 빌드 (기존 함수명 유지)
 */
export function buildTypeUpdates() {
  return handRecorder.buildTypeUpdates();
}

/**
 * Google Sheets로 핸드 데이터 전송 (기존 함수명 유지)
 */
export async function sendHandToGoogleSheet(payload) {
  return await handRecorder.sendToGoogleSheet(payload);
}

/**
 * 전송 중 상태 확인
 */
export function getIsSending() {
  return handRecorder.getIsSending();
}

/**
 * 전송 중 상태 설정
 */
export function setIsSending(value) {
  handRecorder.setIsSending(value);
}
