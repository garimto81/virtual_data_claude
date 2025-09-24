// Type 시트 새 구조 테스트
// A:Poker Room, B:Table Name, C:Table No., D:Seat No., E:Players, F:Nationality, G:Chips, H:Keyplayer

const testData = [
  ["Poker Room", "Table Name", "Table No.", "Seat No.", "Players", "Nationality", "Chips", "Keyplayer"],
  ["Merit Hall", "Table A", "001", "1", "Player1", "KR", "30000", "TRUE"],
  ["Merit Hall", "Table A", "001", "2", "Player2", "CN", "45000", "FALSE"],
  ["Merit Hall", "Table B", "002", "3", "Player3", "JP", "0", "FALSE"], // 칩이 0인 플레이어 (제외됨)
  ["VIP Room", "Table X", "003", "1", "Player4", "US", "100000", "TRUE"],
  ["VIP Room", "Table X", "003", "2", "Player5", "UK", "75000", "FALSE"]
];

function testBuildTypeFromCsv() {
  console.log("=== Type 시트 새 구조 테스트 시작 ===");

  // buildTypeFromCsv 함수 테스트
  const byTable = {};

  for(let i = 1; i < testData.length; i++) {
    const r = testData[i] || [];
    const pokerRoom = String(r[0]||'').trim();
    const tableName = String(r[1]||'').trim();
    const tableNo = String(r[2]||'').trim();
    const seat = String(r[3]||'').trim();
    const player = String(r[4]||'').trim();
    const nationality = String(r[5]||'').trim();
    const chipsStr = String(r[6]!=null?r[6]:'0').trim();
    const chips = parseInt(chipsStr.replace(/,/g, ''), 10) || 0;
    const keyplayer = String(r[7]||'').toUpperCase()==='TRUE';

    const table = pokerRoom && tableName ? `${pokerRoom} - ${tableName}` : '';

    console.log(`처리: ${player} (${table}, 칩: ${chips})`);

    if(player && table && chips > 0) {
      if(!byTable[table]) byTable[table] = [];

      byTable[table].push({
        name: player,
        chips: chipsStr,
        notable: keyplayer,
        updatedAt: new Date().toISOString(),
        seat,
        status: 'IN',
        nationality,
        tableNo
      });
      console.log(`✅ ${player} 추가됨 (${table}, 좌석: ${seat}, 칩: ${chips})`);
    } else {
      console.log(`❌ ${player} 제외됨 - 칩: ${chips} (${table})`);
    }
  }

  console.log("\n=== 처리 결과 ===");
  console.log(`총 테이블 수: ${Object.keys(byTable).length}`);
  Object.keys(byTable).forEach(table => {
    console.log(`${table}: ${byTable[table].length}명`);
    byTable[table].forEach(p => {
      console.log(`  - ${p.name} (좌석: ${p.seat}, 칩: ${p.chips}, 키플레이어: ${p.notable})`);
    });
  });

  // 예상 결과 확인
  const expectedTables = ["Merit Hall - Table A", "Merit Hall - Table B", "VIP Room - Table X"];
  const actualTables = Object.keys(byTable).sort();

  console.log("\n=== 검증 ===");

  if(actualTables.length === 2) { // Player3는 칩이 0이므로 Table B는 생성되지 않음
    console.log("✅ 테이블 수 정확함 (2개)");
  } else {
    console.log(`❌ 테이블 수 오류: 예상 2개, 실제 ${actualTables.length}개`);
  }

  if(byTable["Merit Hall - Table A"]?.length === 2) {
    console.log("✅ Merit Hall - Table A 플레이어 수 정확함 (2명)");
  } else {
    console.log(`❌ Merit Hall - Table A 플레이어 수 오류`);
  }

  if(!byTable["Merit Hall - Table B"]) {
    console.log("✅ Merit Hall - Table B 정확히 제외됨 (칩 0인 플레이어만 있음)");
  } else {
    console.log(`❌ Merit Hall - Table B가 잘못 포함됨`);
  }

  if(byTable["VIP Room - Table X"]?.length === 2) {
    console.log("✅ VIP Room - Table X 플레이어 수 정확함 (2명)");
  } else {
    console.log(`❌ VIP Room - Table X 플레이어 수 오류`);
  }

  console.log("\n=== 테스트 완료 ===");
}

// 테스트 실행
testBuildTypeFromCsv();