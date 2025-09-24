import { supabaseAdmin } from '../config/supabase';

interface TableInfo {
  name: string;
  type: string;
  columns: any[];
  rowCount?: number;
  sample?: any[];
}

async function getTableSummary() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           SUPABASE DATABASE TABLE SUMMARY                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // 테이블 목록 가져오기
    const { data: tables, error } = await supabaseAdmin!
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'schema_migrations');

    if (error) {
      // 대체 방법: 알려진 테이블 직접 조회
      await getKnownTables();
      return;
    }

    // 각 테이블 정보 조회
    for (const table of tables || []) {
      await displayTableInfo(table.table_name);
    }

  } catch (error) {
    console.error('오류 발생:', error);
    // 대체 방법 사용
    await getKnownTables();
  }
}

async function getKnownTables() {
  console.log('📋 프로젝트 테이블 정보\n');
  
  // 1. TOURNAMENTS 테이블
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ 📊 TABLE: tournaments                                       │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  
  const { data: tournaments, count: tourCount } = await supabaseAdmin!
    .from('tournaments')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('│ 📍 구조:                                                    │');
  console.log('│   • id (uuid) - Primary Key                                │');
  console.log('│   • tournament_name (text)                                  │');
  console.log('│   • start_date (timestamp)                                 │');
  console.log('│   • end_date (timestamp)                                   │');
  console.log('│   • venue (text)                                           │');
  console.log('│   • buy_in (integer)                                       │');
  console.log('│   • starting_chips (integer)                               │');
  console.log('│   • status (text) - upcoming/active/paused/completed       │');
  console.log('│   • created_at (timestamp)                                 │');
  console.log('│   • updated_at (timestamp)                                 │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log(`│ 📊 레코드 수: ${tourCount || 0}개                                         │`);
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│ 📝 최근 데이터 (3개):                                        │');
  
  tournaments?.forEach((t, i) => {
    console.log(`│   ${i + 1}. ${t.tournament_name.padEnd(40)} │`);
    console.log(`│      상태: ${t.status.padEnd(10)} 바이인: ₩${t.buy_in.toLocaleString().padEnd(15)} │`);
  });
  
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  // 2. TOURNAMENT_TABLES 테이블
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ 📊 TABLE: tournament_tables                                 │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  
  const { data: tables, count: tableCount } = await supabaseAdmin!
    .from('tournament_tables')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('│ 📍 구조:                                                    │');
  console.log('│   • id (uuid) - Primary Key                                │');
  console.log('│   • tournament_id (uuid) - Foreign Key → tournaments       │');
  console.log('│   • table_number (integer)                                 │');
  console.log('│   • table_name (text)                                      │');
  console.log('│   • status (text) - waiting/active/break/closed            │');
  console.log('│   • small_blind (integer)                                  │');
  console.log('│   • big_blind (integer)                                    │');
  console.log('│   • ante (integer)                                         │');
  console.log('│   • hands_played (integer)                                 │');
  console.log('│   • created_at (timestamp)                                 │');
  console.log('│   • updated_at (timestamp)                                 │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log(`│ 📊 레코드 수: ${tableCount || 0}개                                        │`);
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│ 📝 최근 데이터 (3개):                                        │');
  
  tables?.forEach((t, i) => {
    const tableName = t.table_name.length > 35 ? t.table_name.substring(0, 32) + '...' : t.table_name;
    console.log(`│   ${i + 1}. ${tableName.padEnd(40)} │`);
    console.log(`│      상태: ${t.status.padEnd(10)} 블라인드: ${t.small_blind}/${t.big_blind}              │`);
  });
  
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  // 3. PLAYER_REGISTRY 테이블 (있다면)
  try {
    const { count: playerCount } = await supabaseAdmin!
      .from('player_registry')
      .select('*', { count: 'exact', head: true });

    if (playerCount !== null) {
      console.log('┌─────────────────────────────────────────────────────────────┐');
      console.log('│ 📊 TABLE: player_registry                                   │');
      console.log('├─────────────────────────────────────────────────────────────┤');
      console.log('│ 📍 구조:                                                    │');
      console.log('│   • id (uuid) - Primary Key                                │');
      console.log('│   • legal_name (text)                                      │');
      console.log('│   • nickname (text)                                        │');
      console.log('│   • country_code (text)                                    │');
      console.log('│   • email (text)                                           │');
      console.log('│   • is_verified (boolean)                                  │');
      console.log('├─────────────────────────────────────────────────────────────┤');
      console.log(`│ 📊 레코드 수: ${playerCount}개                                           │`);
      console.log('└─────────────────────────────────────────────────────────────┘\n');
    }
  } catch (e) {
    // 테이블이 없을 수 있음
  }

  // 4. TOURNAMENT_ENTRIES 테이블 (있다면)
  try {
    const { count: entryCount } = await supabaseAdmin!
      .from('tournament_entries')
      .select('*', { count: 'exact', head: true });

    if (entryCount !== null) {
      console.log('┌─────────────────────────────────────────────────────────────┐');
      console.log('│ 📊 TABLE: tournament_entries                                │');
      console.log('├─────────────────────────────────────────────────────────────┤');
      console.log('│ 📍 구조:                                                    │');
      console.log('│   • id (uuid) - Primary Key                                │');
      console.log('│   • tournament_id (uuid) - Foreign Key → tournaments       │');
      console.log('│   • player_id (uuid) - Foreign Key → player_registry       │');
      console.log('│   • table_id (uuid) - Foreign Key → tournament_tables      │');
      console.log('│   • seat_number (integer)                                  │');
      console.log('│   • chip_count (integer)                                   │');
      console.log('│   • status (text) - active/sitting_out/eliminated/moved    │');
      console.log('│   • buy_in_paid (integer)                                  │');
      console.log('├─────────────────────────────────────────────────────────────┤');
      console.log(`│ 📊 레코드 수: ${entryCount}개                                           │`);
      console.log('└─────────────────────────────────────────────────────────────┘\n');
    }
  } catch (e) {
    // 테이블이 없을 수 있음
  }

  // 5. HANDS 테이블 (있다면)
  try {
    const { count: handCount } = await supabaseAdmin!
      .from('hands')
      .select('*', { count: 'exact', head: true });

    if (handCount !== null) {
      console.log('┌─────────────────────────────────────────────────────────────┐');
      console.log('│ 📊 TABLE: hands                                             │');
      console.log('├─────────────────────────────────────────────────────────────┤');
      console.log('│ 📍 구조:                                                    │');
      console.log('│   • id (uuid) - Primary Key                                │');
      console.log('│   • tournament_id (uuid) - Foreign Key → tournaments       │');
      console.log('│   • table_id (uuid) - Foreign Key → tournament_tables      │');
      console.log('│   • hand_number (integer)                                  │');
      console.log('│   • started_at (timestamp)                                 │');
      console.log('│   • ended_at (timestamp)                                   │');
      console.log('│   • community_cards (jsonb)                                │');
      console.log('│   • total_pot (integer)                                    │');
      console.log('│   • winners (jsonb)                                        │');
      console.log('├─────────────────────────────────────────────────────────────┤');
      console.log(`│ 📊 레코드 수: ${handCount}개                                           │`);
      console.log('└─────────────────────────────────────────────────────────────┘\n');
    }
  } catch (e) {
    // 테이블이 없을 수 있음
  }

  // 요약 통계
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                     📈 DATABASE SUMMARY                      ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║                                                              ║');
  console.log(`║  • 총 토너먼트: ${(tourCount || 0).toString().padEnd(10)}                              ║`);
  console.log(`║  • 총 테이블: ${(tableCount || 0).toString().padEnd(10)}                                ║`);
  
  // 상태별 통계
  const { data: statusStats } = await supabaseAdmin!
    .from('tournaments')
    .select('status');
  
  const statusCount = {
    active: 0,
    upcoming: 0,
    completed: 0,
    paused: 0
  };
  
  statusStats?.forEach(s => {
    statusCount[s.status as keyof typeof statusCount]++;
  });
  
  console.log('║                                                              ║');
  console.log('║  토너먼트 상태:                                             ║');
  console.log(`║    - 진행중 (active): ${statusCount.active}개                               ║`);
  console.log(`║    - 예정 (upcoming): ${statusCount.upcoming}개                              ║`);
  console.log(`║    - 완료 (completed): ${statusCount.completed}개                             ║`);
  console.log(`║    - 일시중지 (paused): ${statusCount.paused}개                            ║`);
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

async function displayTableInfo(tableName: string) {
  console.log(`\n📊 TABLE: ${tableName}`);
  console.log('─'.repeat(60));
  
  // 테이블 구조 정보 조회 시도
  const { data: columns } = await supabaseAdmin!
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_schema', 'public')
    .eq('table_name', tableName);

  if (columns && columns.length > 0) {
    console.log('📍 구조:');
    columns.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
      console.log(`  • ${col.column_name}: ${col.data_type} ${nullable}`);
    });
  }

  // 레코드 수 조회
  const { count } = await supabaseAdmin!
    .from(tableName)
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📊 레코드 수: ${count || 0}개`);
  
  // 샘플 데이터 조회
  const { data: sample } = await supabaseAdmin!
    .from(tableName)
    .select('*')
    .limit(2);
  
  if (sample && sample.length > 0) {
    console.log('\n📝 샘플 데이터:');
    console.log(JSON.stringify(sample[0], null, 2));
  }
  
  console.log('─'.repeat(60));
}

// 실행
if (!supabaseAdmin) {
  console.error('❌ Service Key가 설정되지 않았습니다.');
  process.exit(1);
}

getTableSummary();