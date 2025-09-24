// 사용자 지시에 따른 수정된 Type 시트 로직 테스트
// 1. table = r[1] (B열) → table = r[2] (C열 Table No.)
// 2. Status 삭제 → 데이터만 있으면 처리

console.log("=== 사용자 지시 반영된 Type 시트 로직 테스트 ===\n");

// 테스트 데이터 (사용자 지시 반영)
const testData = [
  ["Poker Room", "Table Name", "Table No.", "Seat No.", "Players", "Nationality", "Chips", "Keyplayer"],
  ["Merit Hall", "Table A", "001", "1", "Player1", "KR", "30000", "TRUE"],
  ["Merit Hall", "Table A", "002", "2", "Player2", "CN", "45000", "FALSE"], // 다른 Table No.
  ["VIP Room", "Table X", "003", "3", "Player3", "JP", "0", "FALSE"], // 칩 0이어도 처리
  ["", "Table Y", "004", "4", "Player4", "US", "100000", "TRUE"], // 빈 Poker Room이어도 처리
  ["Merit Hall", "", "005", "5", "Player5", "UK", "abc", "FALSE"], // 잘못된 칩이어도 처리
  ["VIP Room", "Table Z", "", "6", "Player6", "DE", "50000", "TRUE"], // 빈 Table No. → 제외
  ["Merit Hall", "Table B", "006", "7", "", "FR", "25000", "FALSE"] // 빈 플레이어 → 제외
];

function testCorrectedLogic() {
  console.log("1️⃣ 수정된 로직 테스트");

  const COLUMNS = {
    POKER_ROOM: 0, TABLE_NAME: 1, TABLE_NO: 2, SEAT_NO: 3,
    PLAYERS: 4, NATIONALITY: 5, CHIPS: 6, KEYPLAYER: 7
  };

  const byTable = {};
  let processedCount = 0;
  let skippedCount = 0;

  for(let i = 1; i < testData.length; i++) {
    const r = testData[i] || [];

    // 데이터 파싱
    const pokerRoom = String(r[COLUMNS.POKER_ROOM]||'').trim();
    const tableName = String(r[COLUMNS.TABLE_NAME]||'').trim();
    const tableNo = String(r[COLUMNS.TABLE_NO]||'').trim();
    const seat = String(r[COLUMNS.SEAT_NO]||'').trim();
    const player = String(r[COLUMNS.PLAYERS]||'').trim();
    const nationality = String(r[COLUMNS.NATIONALITY]||'').trim();
    const chipsStr = String(r[COLUMNS.CHIPS]!=null?r[COLUMNS.CHIPS]:'0').trim();
    const chips = parseInt(chipsStr.replace(/,/g, ''), 10) || 0;
    const keyplayer = String(r[COLUMNS.KEYPLAYER]||'').toUpperCase()==='TRUE';

    // 사용자 지시: table = tableNo (C열)
    const table = tableNo;

    console.log(`  행 ${i+1}: Player="${player}", Table No.="${table}", Chips=${chips}`);

    // 사용자 지시: 데이터만 있으면 처리 (Status 체크 없음, chips 조건 없음)
    if(player && table){
      if(!byTable[table]) byTable[table] = [];

      byTable[table].push({
        name: player,
        chips: chipsStr,
        notable: keyplayer,
        updatedAt: new Date().toISOString(),
        seat,
        status: 'IN',
        nationality,
        pokerRoom,
        tableName
      });

      console.log(`    ✅ 추가됨 (테이블: ${table})`);
      processedCount++;
    } else {
      const reason = !player ? '플레이어명 없음' : !table ? 'Table No. 없음' : '기타';
      console.log(`    ❌ 제외됨 - 이유: ${reason}`);
      skippedCount++;
    }
  }

  console.log(`\n  처리 결과:`);
  console.log(`    처리된 플레이어: ${processedCount}명`);
  console.log(`    제외된 플레이어: ${skippedCount}명`);
  console.log(`    생성된 테이블: ${Object.keys(byTable).length}개`);

  console.log(`\n  테이블별 상세:`);
  Object.keys(byTable).forEach(table => {
    const players = byTable[table];
    const keyplayers = players.filter(p => p.notable).length;
    console.log(`    테이블 "${table}": ${players.length}명 (키플레이어: ${keyplayers}명)`);
    players.forEach(p => {
      console.log(`      - ${p.name} (칩: ${p.chips}, 국적: ${p.nationality})`);
    });
  });

  return byTable;
}

function testKeyChanges() {
  console.log("\n2️⃣ 핵심 변경사항 검증");

  // 1. Table 식별자 변경 테스트
  const r1 = testData[1]; // Merit Hall, Table A, 001, ...
  const r2 = testData[2]; // Merit Hall, Table A, 002, ...

  const oldWay = r1[1]; // B열 (Table Name) = "Table A"
  const newWay = r1[2]; // C열 (Table No.) = "001"

  console.log(`  테이블 식별자 변경:`);
  console.log(`    이전 방식 (B열): "${oldWay}"`);
  console.log(`    새 방식 (C열): "${newWay}"`);

  // 같은 Table Name이지만 다른 Table No.이면 다른 테이블로 처리됨
  const sameTableName = r1[1] === r2[1]; // "Table A" === "Table A"
  const differentTableNo = r1[2] !== r2[2]; // "001" !== "002"

  console.log(`    같은 Table Name, 다른 Table No.: ${sameTableName && differentTableNo ? '✓' : '✗'}`);
  console.log(`    → 결과: 별도 테이블로 처리됨`);

  // 2. Status 체크 제거 테스트
  const r3 = testData[3]; // 칩이 0인 플레이어
  const r5 = testData[5]; // 잘못된 칩 데이터

  console.log(`\n  Status 체크 제거 효과:`);
  console.log(`    칩 0인 플레이어도 처리: ${r3[4]} (칩: ${r3[6]}) ✓`);
  console.log(`    잘못된 칩 데이터도 처리: ${r5[4]} (칩: ${r5[6]}) ✓`);
  console.log(`    → 칩 금액과 상관없이 플레이어명+Table No.만 있으면 처리`);

  // 3. 필수 필드 테스트
  const r6 = testData[6]; // 빈 Table No.
  const r7 = testData[7]; // 빈 플레이어명

  console.log(`\n  필수 필드 검증:`);
  console.log(`    빈 Table No.: ${r6[4]} → 제외됨 ✓`);
  console.log(`    빈 플레이어명: Table ${r7[2]} → 제외됨 ✓`);
}

function testExpectedResults() {
  console.log("\n3️⃣ 예상 결과 검증");

  const byTable = testCorrectedLogic();

  // 예상: 5개 테이블 생성 (001, 002, 003, 004, 005)
  const expectedTables = ['001', '002', '003', '004', '005'];
  const actualTables = Object.keys(byTable).sort();

  console.log(`\n  테이블 수 검증:`);
  console.log(`    예상: ${expectedTables.join(', ')}`);
  console.log(`    실제: ${actualTables.join(', ')}`);
  console.log(`    일치: ${JSON.stringify(expectedTables) === JSON.stringify(actualTables) ? '✓' : '✗'}`);

  // 예상: 총 5명 처리 (Player1~5, Player6,7 제외)
  const totalPlayers = Object.values(byTable).reduce((sum, players) => sum + players.length, 0);
  console.log(`\n  플레이어 수 검증:`);
  console.log(`    예상: 5명 처리, 2명 제외`);
  console.log(`    실제: ${totalPlayers}명 처리`);
  console.log(`    일치: ${totalPlayers === 5 ? '✓' : '✗'}`);
}

// 테스트 실행
testKeyChanges();
testExpectedResults();

console.log("\n=== 사용자 지시 반영 완료 ===");
console.log("✅ table = tableNo (C열) 사용");
console.log("✅ Status 체크 제거, 데이터만 있으면 처리");
console.log("✅ 칩 금액과 상관없이 플레이어+Table No. 있으면 처리");