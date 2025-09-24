// Hand 시트 시간 데이터 분석 스크립트
const fetch = require('node-fetch');

async function analyzeHandTimes() {
  const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSDY_i4330JANAjIz4sMncdJdRHsOkfUCjQusHTGQk2tykrhA4d09LeIp3XRbLd8hkN6SgSB47k_nux/pub?gid=1906746276&single=true&output=csv';
  
  console.log('📊 Hand 시트 시간 데이터 분석 시작...\n');
  
  try {
    const response = await fetch(CSV_URL + '&t=' + Date.now());
    const text = await response.text();
    
    // CSV 파싱
    const lines = text.split('\n').filter(line => line.trim());
    const rows = lines.map(line => {
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
    
    // HAND 행만 추출하여 시간 분석
    const handData = [];
    for (const row of rows) {
      if (row[1] === 'HAND' && row[2] && row[3]) {
        const handNumber = row[2];
        const timestamp = parseInt(row[3]);
        
        if (!isNaN(timestamp) && timestamp > 0) {
          const date = new Date(timestamp * 1000);
          handData.push({
            handNumber: handNumber,
            timestamp: timestamp,
            date: date,
            dateStr: date.toLocaleString('ko-KR'),
            hour: date.getHours(),
            dayOfWeek: date.getDay(),
            dateOnly: date.toLocaleDateString('ko-KR')
          });
        }
      }
    }
    
    // 시간순 정렬
    handData.sort((a, b) => a.timestamp - b.timestamp);
    
    console.log('=====================================');
    console.log('📈 분석 결과 요약');
    console.log('=====================================\n');
    
    console.log(`✅ 총 핸드 수: ${handData.length}개\n`);
    
    if (handData.length > 0) {
      // 기본 통계
      console.log('📅 시간 범위:');
      console.log(`  • 첫 핸드: ${handData[0].dateStr} (#${handData[0].handNumber})`);
      console.log(`  • 마지막 핸드: ${handData[handData.length-1].dateStr} (#${handData[handData.length-1].handNumber})`);
      
      const totalSeconds = handData[handData.length-1].timestamp - handData[0].timestamp;
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      console.log(`  • 전체 기간: ${days}일 ${hours}시간 ${minutes}분\n`);
      
      // 평균 핸드 간격
      if (handData.length > 1) {
        const avgInterval = totalSeconds / (handData.length - 1);
        const avgMinutes = Math.floor(avgInterval / 60);
        const avgSeconds = Math.floor(avgInterval % 60);
        console.log(`⏱️ 평균 핸드 간격: ${avgMinutes}분 ${avgSeconds}초\n`);
      }
      
      // 시간대별 분포
      console.log('🕐 시간대별 분포:');
      const hourlyDist = new Array(24).fill(0);
      handData.forEach(h => hourlyDist[h.hour]++);
      
      const peakHours = [];
      hourlyDist.forEach((count, hour) => {
        if (count > 0) {
          peakHours.push({hour, count});
        }
      });
      peakHours.sort((a, b) => b.count - a.count);
      
      console.log('  Top 5 활발한 시간대:');
      peakHours.slice(0, 5).forEach((p, i) => {
        const percentage = ((p.count / handData.length) * 100).toFixed(1);
        console.log(`    ${i+1}. ${p.hour}시: ${p.count}개 (${percentage}%)`);
      });
      
      // 요일별 분포
      console.log('\n📅 요일별 분포:');
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const dayDist = new Array(7).fill(0);
      handData.forEach(h => dayDist[h.dayOfWeek]++);
      
      dayDist.forEach((count, day) => {
        if (count > 0) {
          const percentage = ((count / handData.length) * 100).toFixed(1);
          console.log(`  • ${dayNames[day]}요일: ${count}개 (${percentage}%)`);
        }
      });
      
      // 날짜별 분포
      console.log('\n📆 날짜별 활동:');
      const dailyDist = {};
      handData.forEach(h => {
        dailyDist[h.dateOnly] = (dailyDist[h.dateOnly] || 0) + 1;
      });
      
      const sortedDates = Object.entries(dailyDist).sort((a, b) => b[1] - a[1]);
      console.log('  Top 5 활발한 날짜:');
      sortedDates.slice(0, 5).forEach((d, i) => {
        console.log(`    ${i+1}. ${d[0]}: ${d[1]}개 핸드`);
      });
      
      // 최근 10개 핸드
      console.log('\n🔍 최근 10개 핸드:');
      const recentHands = handData.slice(-10).reverse();
      recentHands.forEach((h, i) => {
        if (i > 0) {
          const prevHand = recentHands[i-1];
          const interval = prevHand.timestamp - h.timestamp;
          const minutes = Math.floor(interval / 60);
          const seconds = interval % 60;
          console.log(`  #${h.handNumber}: ${h.dateStr} (이전 핸드와 ${minutes}분 ${seconds}초 차이)`);
        } else {
          console.log(`  #${h.handNumber}: ${h.dateStr}`);
        }
      });
      
      // 긴 휴식 시간 분석
      console.log('\n⏸️ 가장 긴 휴식 시간 (Top 5):');
      const intervals = [];
      for (let i = 1; i < handData.length; i++) {
        const interval = handData[i].timestamp - handData[i-1].timestamp;
        intervals.push({
          from: handData[i-1],
          to: handData[i],
          interval: interval
        });
      }
      
      intervals.sort((a, b) => b.interval - a.interval);
      intervals.slice(0, 5).forEach((int, i) => {
        const hours = Math.floor(int.interval / 3600);
        const minutes = Math.floor((int.interval % 3600) / 60);
        console.log(`    ${i+1}. ${hours}시간 ${minutes}분`);
        console.log(`       #${int.from.handNumber} (${int.from.dateStr})`);
        console.log(`       → #${int.to.handNumber} (${int.to.dateStr})`);
      });
      
      // 세션 분석 (30분 이상 휴식을 세션 구분으로)
      console.log('\n🎮 게임 세션 분석 (30분 이상 휴식 시 새 세션):');
      const sessions = [];
      let currentSession = {hands: [handData[0]], start: handData[0], end: handData[0]};
      
      for (let i = 1; i < handData.length; i++) {
        const interval = handData[i].timestamp - handData[i-1].timestamp;
        if (interval > 1800) { // 30분 = 1800초
          sessions.push(currentSession);
          currentSession = {hands: [handData[i]], start: handData[i], end: handData[i]};
        } else {
          currentSession.hands.push(handData[i]);
          currentSession.end = handData[i];
        }
      }
      sessions.push(currentSession);
      
      console.log(`  • 총 세션 수: ${sessions.length}개`);
      
      const sessionStats = sessions.map(s => ({
        hands: s.hands.length,
        duration: s.end.timestamp - s.start.timestamp,
        start: s.start.dateStr,
        end: s.end.dateStr
      }));
      
      sessionStats.sort((a, b) => b.hands - a.hands);
      console.log('\n  가장 긴 세션 (Top 3):');
      sessionStats.slice(0, 3).forEach((s, i) => {
        const hours = Math.floor(s.duration / 3600);
        const minutes = Math.floor((s.duration % 3600) / 60);
        console.log(`    ${i+1}. ${s.hands}개 핸드 (${hours}시간 ${minutes}분)`);
        console.log(`       ${s.start} ~ ${s.end}`);
      });
      
      // 평균 세션 통계
      const avgSessionHands = Math.round(sessions.reduce((sum, s) => sum + s.hands.length, 0) / sessions.length);
      const avgSessionDuration = sessions.reduce((sum, s) => sum + (s.end.timestamp - s.start.timestamp), 0) / sessions.length;
      const avgHours = Math.floor(avgSessionDuration / 3600);
      const avgMinutes = Math.floor((avgSessionDuration % 3600) / 60);
      
      console.log(`\n  평균 세션 통계:`);
      console.log(`    • 세션당 평균 핸드: ${avgSessionHands}개`);
      console.log(`    • 평균 세션 시간: ${avgHours}시간 ${avgMinutes}분`);
      
    }
    
    console.log('\n=====================================');
    console.log('분석 완료! 🎯');
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

// 실행
analyzeHandTimes();