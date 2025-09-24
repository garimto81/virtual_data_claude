// Virtual 시트에서 18:41 매칭 분석
const https = require('https');

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTq3wrZNUASAMxl9A6VvJxTT6DKj40xp0R2xcIGfeji6MxQ8wi6Zbu_FWPmxKkmJdPHYgMC6UIT9tvv/pub?gid=561799849&single=true&output=csv';

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

console.log('📊 Virtual 시트 분석 시작');
console.log('🔍 목표 시간: 18:41');
console.log('=' .repeat(70));

https.get(CSV_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const rows = parseCSV(data);
    console.log(`\n✅ 총 ${rows.length}개 행 로드됨\n`);
    
    // 헤더 확인
    if (rows.length > 0) {
      console.log('📋 헤더 (처음 8개 열):');
      const headers = rows[0].slice(0, 8);
      headers.forEach((h, i) => {
        console.log(`  ${String.fromCharCode(65 + i)}열: "${h}"`);
      });
      console.log('');
    }
    
    // 18:41 찾기
    const targetHours = 18;
    const targetMinutes = 41;
    const targetTotalMinutes = targetHours * 60 + targetMinutes;
    
    const matches = [];
    const closeMatches = [];
    
    console.log('🔍 C열 시간 데이터 분석:');
    console.log('=' .repeat(70));
    
    // 처음 20개 행의 C열 확인
    console.log('\n📊 C열 샘플 데이터 (처음 20개):');
    for (let i = 1; i < Math.min(21, rows.length); i++) {
      const cValue = rows[i][2]; // C열
      if (cValue && cValue.trim()) {
        console.log(`  행 ${i + 1}: "${cValue}"`);
      }
    }
    
    // 전체 데이터에서 18:41 매칭 찾기
    console.log('\n🎯 18:41 매칭 검색 중...\n');
    
    for (let i = 1; i < rows.length; i++) {
      const cValue = rows[i][2]; // C열
      if (!cValue || !cValue.trim()) continue;
      
      // 다양한 시간 형식 파싱
      let hours = 0, minutes = 0;
      let parsed = false;
      
      // HH:MM 형식
      const timeMatch = cValue.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        minutes = parseInt(timeMatch[2]);
        parsed = true;
      }
      
      if (parsed) {
        const totalMinutes = hours * 60 + minutes;
        const diff = Math.abs(totalMinutes - targetTotalMinutes);
        
        if (diff === 0) {
          // 정확히 일치
          matches.push({
            row: i + 1,
            cValue: cValue,
            aValue: rows[i][0],
            bValue: rows[i][1],
            dValue: rows[i][3],
            eValue: rows[i][4],
            fValue: rows[i][5]
          });
          console.log(`✅ 정확히 일치! 행 ${i + 1}:`);
          console.log(`   C열: "${cValue}"`);
          console.log(`   A열: "${rows[i][0]}"`);
          console.log(`   B열: "${rows[i][1]}"`);
          console.log(`   D열: "${rows[i][3]}"`);
          console.log('');
        } else if (diff <= 5) {
          // 5분 이내 근접
          closeMatches.push({
            row: i + 1,
            time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
            diff: diff,
            cValue: cValue,
            aValue: rows[i][0]
          });
        }
      }
    }
    
    console.log('=' .repeat(70));
    console.log('\n📌 최종 결과:');
    
    if (matches.length > 0) {
      console.log(`\n✅ 18:41과 정확히 일치하는 행: ${matches.length}개`);
      matches.forEach(m => {
        console.log(`\n  📍 행 ${m.row}:`);
        console.log(`     A열: "${m.aValue}"`);
        console.log(`     B열: "${m.bValue}"`);
        console.log(`     C열: "${m.cValue}"`);
        console.log(`     D열: "${m.dValue}"`);
        console.log(`     E열: "${m.eValue}"`);
        console.log(`     F열: "${m.fValue}"`);
      });
    } else {
      console.log('\n❌ 18:41과 정확히 일치하는 행을 찾을 수 없습니다');
      
      if (closeMatches.length > 0) {
        console.log('\n⚠️ 근접한 시간 (5분 이내):');
        closeMatches.sort((a, b) => a.diff - b.diff);
        closeMatches.forEach(m => {
          console.log(`  행 ${m.row}: ${m.time} (${m.diff}분 차이) - A열: "${m.aValue}"`);
        });
      }
    }
    
    // 18시대 통계
    let count18 = 0;
    for (let i = 1; i < rows.length; i++) {
      const cValue = rows[i][2];
      if (cValue && cValue.includes('18:')) {
        count18++;
      }
    }
    console.log(`\n📊 18시대 총 ${count18}개 행 존재`);
    
    console.log('\n✅ 분석 완료!');
  });
}).on('error', (err) => {
  console.error('❌ 오류:', err.message);
});