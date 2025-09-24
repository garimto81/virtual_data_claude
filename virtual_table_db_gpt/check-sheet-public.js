// Google Sheets 공개 URL로 직접 접근
const https = require('https');

// 공개 CSV URL (pub 형식 사용)
const PUB_URL = 'https://docs.google.com/spreadsheets/d/1M-LM2KkwLNOTygtrPVdnYLqqBoz4MmZvbglUaptSYqE/pub?gid=561799849&single=true&output=csv';

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

console.log('🔍 Virtual 시트 접근 시도');
console.log('📊 URL:', PUB_URL.substring(0, 80) + '...');
console.log('');

https.get(PUB_URL, (res) => {
  console.log('📡 응답 코드:', res.statusCode);
  console.log('📡 Content-Type:', res.headers['content-type']);
  console.log('');
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    // 처음 500자 확인
    console.log('📄 응답 데이터 처음 500자:');
    console.log(data.substring(0, 500));
    console.log('\n' + '='.repeat(70));
    
    // HTML인지 CSV인지 확인
    if (data.includes('<html') || data.includes('<HTML')) {
      console.log('❌ HTML 응답을 받았습니다. 시트가 비공개이거나 권한이 필요합니다.');
      console.log('\n💡 해결 방법:');
      console.log('1. Google Sheets에서 파일 > 공유 > "링크가 있는 모든 사용자" 설정');
      console.log('2. 또는 파일 > 웹에 게시 선택');
      return;
    }
    
    // CSV 파싱 시도
    try {
      const rows = parseCSV(data);
      console.log(`✅ CSV 파싱 성공: ${rows.length}개 행`);
      
      if (rows.length > 0) {
        console.log('\n📋 첫 5개 행 데이터:');
        rows.slice(0, 5).forEach((row, idx) => {
          console.log(`행 ${idx + 1}: [${row.slice(0, 5).join(' | ')}]`);
        });
        
        // C열에서 시간 찾기
        console.log('\n🔍 C열에서 18:41 검색:');
        let found = false;
        
        for (let i = 0; i < rows.length; i++) {
          const cValue = rows[i][2];
          if (cValue && (cValue.includes('18:41') || cValue.includes('18:4'))) {
            console.log(`✅ 행 ${i + 1}: "${cValue}"`);
            found = true;
          }
        }
        
        if (!found) {
          console.log('❌ 18:41을 찾을 수 없습니다');
          
          // 18시대 시간 찾기
          console.log('\n💡 18시대 시간들:');
          for (let i = 0; i < Math.min(rows.length, 50); i++) {
            const cValue = rows[i][2];
            if (cValue && cValue.includes('18:')) {
              console.log(`  행 ${i + 1}: "${cValue}"`);
            }
          }
        }
      }
    } catch (error) {
      console.log('❌ CSV 파싱 실패:', error.message);
    }
  });
}).on('error', (err) => {
  console.error('❌ 네트워크 오류:', err.message);
});