// Virtual 시트에서 18:41 찾기
const https = require('https');

const SHEET_ID = '1M-LM2KkwLNOTygtrPVdnYLqqBoz4MmZvbglUaptSYqE';
const GID = '561799849';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

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

function findTime(targetTime) {
  console.log('🔍 Virtual 시트에서 18:41 찾기');
  console.log('📊 Sheet ID:', SHEET_ID);
  console.log('📊 GID:', GID);
  console.log('');

  https.get(CSV_URL, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const rows = parseCSV(data);
      console.log(`✅ 총 ${rows.length}개 행 로드됨\n`);
      
      // 헤더 확인
      if (rows.length > 0) {
        console.log('📋 헤더 (A-H열):');
        console.log(rows[0].slice(0, 8).map((h, i) => `${String.fromCharCode(65+i)}열: "${h}"`).join(' | '));
        console.log('');
      }
      
      const targetHours = 18;
      const targetMinutes = 41;
      const targetTotalMinutes = targetHours * 60 + targetMinutes;
      
      console.log(`🎯 찾는 시간: ${targetHours}:${targetMinutes.toString().padStart(2, '0')}\n`);
      console.log('='.repeat(70));
      
      const exactMatches = [];
      const closeMatches = [];
      const allTimes = [];
      
      // 모든 행 검사
      for (let i = 1; i < rows.length; i++) {
        const cValue = rows[i][2]; // C열
        
        if (!cValue || !cValue.trim()) continue;
        
        // 시간 형식 파싱
        let hours = 0, minutes = 0;
        let parsed = false;
        
        // HH:MM 또는 HH:MM:SS 형식
        const timeMatch = cValue.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          hours = parseInt(timeMatch[1]);
          minutes = parseInt(timeMatch[2]);
          parsed = true;
        }
        
        if (parsed) {
          const totalMinutes = hours * 60 + minutes;
          const diff = Math.abs(totalMinutes - targetTotalMinutes);
          const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          
          allTimes.push({
            row: i + 1,
            time: timeStr,
            original: cValue,
            diff: diff,
            aCol: rows[i][0],
            dCol: rows[i][3],
            eCol: rows[i][4]
          });
          
          if (diff === 0) {
            exactMatches.push(i + 1);
            console.log(`✅ 행 ${i + 1}: 정확히 일치! "${cValue}"`);
            console.log(`   A열: "${rows[i][0]}" | D열: "${rows[i][3]}" | E열: "${rows[i][4]}"`);
          } else if (diff <= 10) {
            closeMatches.push({ row: i + 1, time: timeStr, diff: diff });
          }
        }
      }
      
      console.log('\n' + '='.repeat(70));
      console.log('\n📌 결과 요약:');
      
      if (exactMatches.length > 0) {
        console.log(`\n✅ 18:41과 정확히 일치하는 행: ${exactMatches.join(', ')}`);
      } else {
        console.log('\n❌ 18:41과 정확히 일치하는 행을 찾을 수 없습니다');
        
        if (closeMatches.length > 0) {
          console.log('\n⚠️ 근접한 시간 (10분 이내):');
          closeMatches.sort((a, b) => a.diff - b.diff);
          closeMatches.slice(0, 5).forEach(m => {
            console.log(`  행 ${m.row}: ${m.time} (${m.diff}분 차이)`);
          });
        }
        
        // 가장 가까운 시간 찾기
        allTimes.sort((a, b) => a.diff - b.diff);
        console.log('\n💡 가장 가까운 시간 TOP 10:');
        allTimes.slice(0, 10).forEach((t, idx) => {
          console.log(`  ${idx + 1}. 행 ${t.row}: ${t.time} (${t.diff}분 차이)`);
          if (idx < 3) {
            console.log(`     원본: "${t.original}"`);
            console.log(`     A열: "${t.aCol}" | D열: "${t.dCol}"`);
          }
        });
      }
      
      // 시간 분포 통계
      const hourDist = {};
      allTimes.forEach(t => {
        const hour = t.time.split(':')[0];
        hourDist[hour] = (hourDist[hour] || 0) + 1;
      });
      
      console.log('\n📊 시간대별 분포:');
      Object.entries(hourDist).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([hour, count]) => {
        if (parseInt(hour) >= 17 && parseInt(hour) <= 20) {
          console.log(`  ${hour}시: ${count}개 행 ${hour === '18' ? '← 18시대' : ''}`);
        }
      });
      
      console.log('\n✅ 분석 완료!');
    });
  }).on('error', (err) => {
    console.error('❌ 오류:', err.message);
  });
}

// 실행
findTime('18:41');