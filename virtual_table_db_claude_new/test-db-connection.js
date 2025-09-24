const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkDatabase() {
  console.log('=== Supabase 데이터베이스 연결 테스트 ===\n');
  
  try {
    // tournaments 테이블 조회
    const { data: tournaments, error: tourError } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (tourError) {
      console.error('Tournaments 조회 실패:', tourError);
    } else {
      console.log(`✅ Tournaments 테이블: ${tournaments?.length || 0}개 레코드`);
      if (tournaments && tournaments.length > 0) {
        console.log('최근 토너먼트:', tournaments[0].tournament_name);
      }
    }
    
    // tournament_tables 테이블 조회
    const { data: tables, error: tableError } = await supabase
      .from('tournament_tables')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (tableError) {
      console.error('Tables 조회 실패:', tableError);
    } else {
      console.log(`✅ Tournament_tables 테이블: ${tables?.length || 0}개 레코드`);
      if (tables && tables.length > 0) {
        console.log('최근 테이블:', tables[0].table_name);
      }
    }
    
    console.log('\n=== 연결 테스트 완료 ===');
    
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error);
  }
}

checkDatabase();