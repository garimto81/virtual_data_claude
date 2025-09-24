import { supabaseAdmin } from '../config/supabase';

async function viewData() {
  console.log('📊 데이터베이스 내용 조회\n');
  console.log('='.repeat(50));

  try {
    // 토너먼트 조회
    const { data: tournaments, error: tourError } = await supabaseAdmin!
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (tourError) {
      console.error('토너먼트 조회 실패:', tourError);
    } else {
      console.log('\n🏆 토너먼트 목록:\n');
      tournaments?.forEach((t, i) => {
        console.log(`${i + 1}. ${t.tournament_name}`);
        console.log(`   - 상태: ${t.status}`);
        console.log(`   - 장소: ${t.venue}`);
        console.log(`   - 바이인: ₩${t.buy_in.toLocaleString()}`);
        console.log(`   - 시작일: ${new Date(t.start_date).toLocaleDateString('ko-KR')}`);
        console.log('');
      });
    }

    // 테이블 조회
    const { data: tables, error: tableError } = await supabaseAdmin!
      .from('tournament_tables')
      .select('*')
      .order('tournament_id', { ascending: true })
      .order('table_number', { ascending: true });

    if (tableError) {
      console.error('테이블 조회 실패:', tableError);
    } else {
      console.log('='.repeat(50));
      console.log('\n🎲 테이블 목록:\n');
      tables?.forEach((t, i) => {
        console.log(`${i + 1}. ${t.table_name}`);
        console.log(`   - 테이블 번호: ${t.table_number}`);
        console.log(`   - 상태: ${t.status}`);
        console.log(`   - 블라인드: ${t.small_blind}/${t.big_blind} (앤티: ${t.ante})`);
        console.log(`   - 플레이된 핸드: ${t.hands_played}개`);
        console.log('');
      });
    }

    // 통계
    console.log('='.repeat(50));
    console.log('\n📈 통계:\n');
    console.log(`총 토너먼트: ${tournaments?.length || 0}개`);
    console.log(`총 테이블: ${tables?.length || 0}개`);
    
    const activeTourn = tournaments?.filter(t => t.status === 'active').length || 0;
    const upcomingTourn = tournaments?.filter(t => t.status === 'upcoming').length || 0;
    const completedTourn = tournaments?.filter(t => t.status === 'completed').length || 0;
    
    console.log(`\n토너먼트 상태:`);
    console.log(`  - 진행중: ${activeTourn}개`);
    console.log(`  - 예정: ${upcomingTourn}개`);
    console.log(`  - 완료: ${completedTourn}개`);

  } catch (error) {
    console.error('조회 중 오류:', error);
  }
}

if (!supabaseAdmin) {
  console.error('❌ Service Key가 설정되지 않았습니다.');
  process.exit(1);
}

viewData();