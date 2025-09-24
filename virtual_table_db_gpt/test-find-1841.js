const https = require('https');

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTq3wrZNUASAMxl9A6VvJxTT6DKj40xp0R2xcIGfeji6MxQ8wi6Zbu_FWPmxKkmJdPHYgMC6UIT9tvv/pub?gid=561799849&single=true&output=csv';

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const row = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const next = line[j + 1];
      
      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        j++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current);
    result.push(row);
  }
  
  return result;
}

console.log('🔍 Virtual 시트에서 18:41 찾기');
console.log('=' .repeat(70));

https.get(CSV_URL, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const rows = parseCSV(data);
    console.log(`\n✅ 총 ${rows.length}개 행 로드됨\n`);
    
    // 헤더 확인
    if (rows.length > 0) {
      console.log('📋 헤더:');
      const headers = rows[0].slice(0, 10);
      headers.forEach((h, i) => {
        console.log(`  ${String.fromCharCode(65 + i)}열: "${h}"`);
      });
      console.log('');
    }
    
    console.log('🎯 18:41 검색 시작...\n');
    
    const matches = [];
    
    // 모든 행과 열 검색
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        
        // 정확히 18:41인 경우
        if (cell === '18:41') {
          matches.push({
            row: i + 1,
            col: String.fromCharCode(65 + j),
            colIndex: j,
            value: cell,
            rowData: row
          });
          console.log(`✅ 찾았다! 행 ${i + 1}, ${String.fromCharCode(65 + j)}열 (${j + 1}번째 열)`);
          console.log(`   전체 행: [${row.slice(0, 8).join(' | ')}]`);
        }
      }
    }
    
    console.log('\n' + '=' .repeat(70));
    
    if (matches.length > 0) {
      console.log(`\n📍 18:41 위치 요약:`);
      matches.forEach(m => {
        console.log(`   행 ${m.row}, ${m.col}열`);
      });
    } else {
      console.log('\n❌ 18:41을 찾을 수 없습니다');
      
      // 18시대 찾기
      console.log('\n💡 18시대 시간들:');
      let count = 0;
      for (let i = 0; i < Math.min(rows.length, 100); i++) {
        const row = rows[i];
        for (let j = 0; j < row.length; j++) {
          if (row[j] && row[j].includes('18:')) {
            count++;
            if (count <= 10) {
              console.log(`   행 ${i + 1}, ${String.fromCharCode(65 + j)}열: "${row[j]}"`);
            }
          }
        }
      }
    }
  });
}).on('error', (err) => {
  console.error('❌ 오류:', err.message);
});