import { supabaseAdmin } from '../config/supabase';

async function deleteAllData() {
  console.log('⚠️  데이터 삭제 시작...\n');
  console.log('='.repeat(50));

  try {
    // 1. tournament_tables 먼저 삭제 (외래키 제약 때문에)
    console.log('🗑️  tournament_tables 테이블 데이터 삭제 중...');
    
    const { data: deletedTables, error: tableError } = await supabaseAdmin!
      .from('tournament_tables')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 레코드 삭제
      .select();
    
    if (tableError) {
      console.error('❌ tournament_tables 삭제 실패:', tableError.message);
    } else {
      console.log(`✅ tournament_tables: ${deletedTables?.length || 0}개 레코드 삭제됨`);
    }

    // 2. tournaments 삭제
    console.log('\n🗑️  tournaments 테이블 데이터 삭제 중...');
    
    const { data: deletedTournaments, error: tourError } = await supabaseAdmin!
      .from('tournaments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 레코드 삭제
      .select();
    
    if (tourError) {
      console.error('❌ tournaments 삭제 실패:', tourError.message);
    } else {
      console.log(`✅ tournaments: ${deletedTournaments?.length || 0}개 레코드 삭제됨`);
    }

    // 3. 삭제 결과 확인
    console.log('\n📊 삭제 후 데이터 확인...');
    
    const { count: tourCount } = await supabaseAdmin!
      .from('tournaments')
      .select('*', { count: 'exact', head: true });
    
    const { count: tableCount } = await supabaseAdmin!
      .from('tournament_tables')
      .select('*', { count: 'exact', head: true });

    console.log('\n' + '='.repeat(50));
    console.log('📈 최종 상태:');
    console.log(`   - tournaments 테이블: ${tourCount || 0}개 레코드`);
    console.log(`   - tournament_tables 테이블: ${tableCount || 0}개 레코드`);
    
    if (tourCount === 0 && tableCount === 0) {
      console.log('\n✅ 모든 데이터가 성공적으로 삭제되었습니다!');
    } else {
      console.log('\n⚠️  일부 데이터가 남아있습니다.');
    }

  } catch (error) {
    console.error('❌ 삭제 중 오류 발생:', error);
  }
}

// 실행
if (!supabaseAdmin) {
  console.error('❌ Service Key가 설정되지 않았습니다.');
  process.exit(1);
}

console.log('⚠️  WARNING: 이 스크립트는 모든 데이터를 삭제합니다!');
console.log('tournaments와 tournament_tables의 모든 레코드가 삭제됩니다.\n');

// 실행
deleteAllData();