/**
 * Hand Recorder Module
 * 핸드 기록 및 Google Sheets 전송 기능
 */

import { store } from '../core/store.js';
import { unformatNumber } from './pure-utils.js';

export class HandRecorder {
  constructor() {
    this.isSending = false;
  }

  /**
   * CSV 행 생성
   * @returns {Object} { rows, epochSec, currentDate }
   */
  generateRows() {
    const out = [];
    let no = 1;
    const push = (arr) => {
      const a = [no, ...arr];
      while(a.length < 18) a.push('');
      out.push(a);
      no++;
    };

    const state = store.getState();
    const epochSec = Math.floor(Date.now() / 1000);
    const sb = unformatNumber(state.actionState.smallBlind) || '0';
    const bb = unformatNumber(state.actionState.bigBlind) || '0';
    const ante = state.actionState.hasBBAnte ? bb : '0';
    const table = state.selectedTable || '';
    const currentDate = new Date().toISOString().split('T')[0];

    // GAME / PAYOUTS
    push(['GAME', 'GGProd Hand Logger', 'Virtual Table', currentDate]);
    push(['PAYOUTS']);

    // HAND
    const handDate = this.formatISODateInTZ(new Date(), state.selectedTimezone);
    push(['HAND',
      String(state.actionState.handNumber),
      epochSec,
      'HOLDEM',
      state.actionState.hasBBAnte ? 'BB_ANTE' : 'NO_ANTE',
      ante,
      handDate,
      sb,
      bb,
      0, 1, 2, 3, 0, 0, 1,
      table
    ]);

    // PLAYERS
    const players = state.playersInHand.map((p, i) => ({
      ...p,
      seat: p.seat || (i + 1)
    }));

    players.forEach(p => {
      let initialChips = p.initialChips === undefined || p.initialChips === '' || p.initialChips === null
        ? parseInt(unformatNumber(p.chips) || 0, 10)
        : parseInt(unformatNumber(p.initialChips) || '0', 10);

      if (isNaN(initialChips)) initialChips = 0;

      const finalChips = parseInt(unformatNumber(p.chips) || 0, 10);

      // window 전역 함수 사용 (index.html에 정의됨)
      const positions = window.getPositionsForSeat?.(window.parseSeatNumber?.(p.seat) || 1) || [];
      const positionStr = positions.length > 0 ? positions.join(',') : '';

      push(['PLAYER', p.name, window.parseSeatNumber?.(p.seat) || 1, 0, initialChips, finalChips, p.hand?.length ? p.hand.join(' ') : '', positionStr]);
    });

    // EVENTS
    const addEv = (log) => {
      const p = players.find(x => x.name === log.player);
      const seat = p ? p.seat : '';
      const amt = log.amount ? unformatNumber(log.amount) : '';
      let t = (log.action || '').toUpperCase().replace(/S$/, '');
      if (t === 'BET/RAISES') t = 'RAISE TO';
      push(['EVENT', t, seat, amt, '']);
    };

    state.actionState.preflop.forEach(addEv);
    if (state.board.length >= 3) {
      push(['EVENT', 'BOARD', 1, state.board[0], '']);
      push(['EVENT', 'BOARD', 1, state.board[1], '']);
      push(['EVENT', 'BOARD', 1, state.board[2], '']);
    }
    state.actionState.flop.forEach(addEv);
    if (state.board.length >= 4) push(['EVENT', 'BOARD', 1, state.board[3], '']);
    state.actionState.turn.forEach(addEv);
    if (state.board.length >= 5) push(['EVENT', 'BOARD', 1, state.board[4], '']);
    state.actionState.river.forEach(addEv);

    out.push([no]);
    return { rows: out, epochSec, currentDate };
  }

  /**
   * ISO 날짜를 타임존에 맞게 포맷
   */
  formatISODateInTZ(date, tz) {
    const y = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year:'numeric' }).format(date);
    const m = new Intl.DateTimeFormat('en-CA', { timeZone: tz, month:'2-digit' }).format(date);
    const d = new Intl.DateTimeFormat('en-CA', { timeZone: tz, day:'2-digit' }).format(date);
    return `${y}-${m}-${d}`;
  }

  /**
   * Index 메타데이터 빌드
   */
  buildIndexMeta() {
    const state = store.getState();
    const handNumber = String(state.actionState.handNumber);
    const handUpdatedAt = new Date().toISOString().split('T')[0];
    const table = state.selectedTable || '';

    let lastActionDesc = '';
    const streets = ['river', 'turn', 'flop', 'preflop'];
    for (const st of streets) {
      const actions = state.actionState[st];
      if (actions.length > 0) {
        const last = actions[actions.length - 1];
        lastActionDesc = `${last.player} ${last.action} ${last.amount || ''}`.trim();
        break;
      }
    }

    const determineWorkStatus = () => {
      if (state.playersInHand.some(p => p.role === 'winner')) return '완료';
      if (state.currentStreet === 'river' && state.actionState.river.length > 0) return '검토필요';
      return '진행중';
    };

    // window 전역 함수 사용
    return {
      handNumber,
      handUpdatedAt,
      label: 'HOLDEM',
      table,
      tableUpdatedAt: handUpdatedAt,
      cam: `${state.camPreset.cam1 || ''}+${state.camPreset.cam2 || ''}`,
      camFile01name: state.camPreset.cam1 || '',
      camFile01number: window.getCamNumber?.('cam1') || '',
      camFile02name: state.camPreset.cam2 || '',
      camFile02number: window.getCamNumber?.('cam2') || '',
      lastStreet: state.currentStreet,
      lastAction: lastActionDesc,
      workStatus: determineWorkStatus()
    };
  }

  /**
   * Type 업데이트 빌드
   */
  buildTypeUpdates() {
    const state = store.getState();
    const table = state.selectedTable || '';
    return state.playersInHand
      .filter(p => p.chipsUpdatedAt)
      .map((p, index) => ({
        player: p.name,
        table,
        notable: p.notable || false,
        chips: String(p.chips || ''),
        updatedAt: p.chipsUpdatedAt,
        seat: String(p.seat || index + 1)
      }));
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
