// 키 플레이어 중심 포커 핸드 분석 모듈

// Type 시트에서 Notable 플레이어 가져오기
async function getNotablePlayers() {
  const TYPE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSDY_i4330JANAjIz4sMncdJdRHsOkfUCjQusHTGQk2tykrhA4d09LeIp3XRbLd8hkN6SgSB47k_nux/pub?gid=YOUR_GID&single=true&output=csv';
  
  try {
    const response = await fetch(TYPE_SHEET_URL);
    const text = await response.text();
    const rows = parseCSV(text);
    
    const notablePlayers = [];
    for (let i = 1; i < rows.length; i++) {
      const playerName = rows[i][1]; // B열: Player
      const isNotable = rows[i][3];  // D열: Notable
      
      if (isNotable === 'Y' || isNotable === 'y') {
        notablePlayers.push(playerName);
      }
    }
    
    console.log('Notable 플레이어:', notablePlayers);
    return notablePlayers;
  } catch (error) {
    console.error('Type 시트 로드 실패:', error);
    return [];
  }
}

// 키 플레이어 중심 데이터 구조화
async function structureKeyPlayerData(handNumber) {
  // Notable 플레이어 목록 가져오기
  const notablePlayers = await getNotablePlayers();
  
  // 핸드 데이터 로드
  const handData = await loadHandData(handNumber);
  
  if (!handData) {
    return null;
  }
  
  // 분석 데이터 구조
  const analysis = {
    handNumber: handNumber,
    keyPlayer: null,
    opponents: [],
    board: handData.board || [],
    pot: handData.pot,
    winner: handData.winner,
    streets: handData.streets,
    timestamp: handData.timestamp
  };
  
  // 플레이어 분류
  for (const player of handData.players) {
    const playerInfo = {
      name: player.name,
      position: player.position,
      cards: player.cards || [],
      chips: player.chips,
      status: player.status
    };
    
    // Notable 플레이어인지 확인
    if (notablePlayers.includes(player.name)) {
      analysis.keyPlayer = playerInfo;
      analysis.keyPlayer.isHero = true;
    } else {
      analysis.opponents.push(playerInfo);
    }
  }
  
  // 키 플레이어가 없으면 첫 번째 플레이어를 키 플레이어로
  if (!analysis.keyPlayer && handData.players.length > 0) {
    analysis.keyPlayer = {
      name: handData.players[0].name,
      position: handData.players[0].position,
      cards: handData.players[0].cards || [],
      chips: handData.players[0].chips,
      status: handData.players[0].status,
      isHero: false
    };
    analysis.opponents = handData.players.slice(1).map(p => ({
      name: p.name,
      position: p.position,
      cards: p.cards || [],
      chips: p.chips,
      status: p.status
    }));
  }
  
  return analysis;
}

// 향상된 AI 프롬프트 생성
function createEnhancedPrompt(analysis) {
  if (!analysis || !analysis.keyPlayer) {
    return null;
  }
  
  // 키 플레이어 액션 추출
  const keyPlayerActions = {};
  ['preflop', 'flop', 'turn', 'river'].forEach(street => {
    if (analysis.streets[street]) {
      keyPlayerActions[street] = analysis.streets[street]
        .filter(a => a.player === analysis.keyPlayer.name)
        .map(a => `${a.action} ${a.amount || ''}`.trim())
        .join(', ') || 'No action';
    }
  });
  
  // 상대방 중 쇼다운에 참여한 플레이어 찾기
  const showdownOpponents = analysis.opponents.filter(opp => 
    opp.cards && opp.cards.length > 0
  );
  
  const prompt = `
당신은 세계적인 포커 코치입니다. 다음 핸드를 키 플레이어 관점에서 분석해주세요.

【핸드 #${analysis.handNumber}】

🎯 키 플레이어: ${analysis.keyPlayer.name}
• 포지션: ${analysis.keyPlayer.position}
• 홀카드: ${analysis.keyPlayer.cards.join(' ') || '알 수 없음'}
• 스택: ${analysis.keyPlayer.chips || '알 수 없음'}

👥 상대방:
${analysis.opponents.map((opp, idx) => 
  `${idx + 1}. ${opp.name} (${opp.position})
   • 홀카드: ${opp.cards.length > 0 ? opp.cards.join(' ') : '숨김'}
   • 스택: ${opp.chips || '알 수 없음'}`
).join('\n')}

🃏 보드: ${analysis.board.join(' ') || '보드 없음'}

📊 키 플레이어 액션:
• Preflop: ${keyPlayerActions.preflop || '-'}
• Flop: ${keyPlayerActions.flop || '-'}
• Turn: ${keyPlayerActions.turn || '-'}
• River: ${keyPlayerActions.river || '-'}

💰 결과:
• 최종 팟: ${analysis.pot}
• 승자: ${analysis.winner?.player || '알 수 없음'}
• 승리 핸드: ${analysis.winner?.hand || '알 수 없음'}

다음 3가지 관점에서 분석해주세요 (각 40자 이내):
1. [핸드 평가] 키 플레이어의 핸드 강도와 플레이 적절성
2. [핵심 결정] 가장 중요한 의사결정과 대안
3. [개선점] 더 나은 결과를 위한 조정 방향
`;
  
  return prompt;
}

// CSV 파싱 헬퍼 함수
function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.map(line => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const next = line[i + 1];
      
      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  });
}

// 메인 분석 함수
async function analyzeHandWithKeyPlayer(handNumber) {
  try {
    // 1. 데이터 구조화
    const analysisData = await structureKeyPlayerData(handNumber);
    
    if (!analysisData) {
      return '핸드 데이터를 찾을 수 없습니다.';
    }
    
    // 2. 프롬프트 생성
    const prompt = createEnhancedPrompt(analysisData);
    
    // 3. AI 호출 (설정된 서비스에 따라)
    let result = '';
    
    if (CONFIG.AI_SERVICE === 'gemini' && CONFIG.AI_API_KEY) {
      result = await callGeminiWithPrompt(prompt);
    } else if (CONFIG.AI_SERVICE === 'openai' && CONFIG.AI_API_KEY) {
      result = await callOpenAIWithPrompt(prompt);
    } else {
      // 기본 분석 (AI 없이)
      result = generateBasicAnalysis(analysisData);
    }
    
    return result;
  } catch (error) {
    console.error('키 플레이어 분석 오류:', error);
    return '분석 실패: ' + error.message;
  }
}

// 기본 분석 생성 (AI 없을 때)
function generateBasicAnalysis(analysis) {
  const keyPlayer = analysis.keyPlayer;
  const winner = analysis.winner;
  
  const lines = [];
  
  // 1. 핸드 평가
  if (keyPlayer.cards && keyPlayer.cards.length > 0) {
    const cardStr = keyPlayer.cards.join('');
    if (cardStr.includes('A')) {
      lines.push('에이스 하이 핸드로 공격적 플레이');
    } else if (cardStr.match(/[KQJ]/g)?.length >= 2) {
      lines.push('브로드웨이 핸드로 표준 플레이');
    } else {
      lines.push('미디엄 핸드로 신중한 접근');
    }
  } else {
    lines.push('핸드 정보 부족으로 평가 불가');
  }
  
  // 2. 핵심 결정
  if (winner && winner.player === keyPlayer.name) {
    lines.push(`승리 - 팟 ${winner.amount} 획득`);
  } else {
    lines.push('상대에게 팟 내줌 - 폴드 타이밍 검토');
  }
  
  // 3. 개선점
  lines.push('포지션과 스택 대비 베팅 사이즈 조정 필요');
  
  return lines.join('\n');
}

// Gemini API 호출
async function callGeminiWithPrompt(prompt) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${CONFIG.AI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200,
            topP: 0.8,
            topK: 10
          }
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Gemini API 오류: ${response.status}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error('Gemini API 호출 실패:', error);
    return null;
  }
}

// Export 함수들
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getNotablePlayers,
    structureKeyPlayerData,
    createEnhancedPrompt,
    analyzeHandWithKeyPlayer
  };
}