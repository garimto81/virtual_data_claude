import { supabaseAdmin } from '../config/supabase';
import { Tournament, TournamentTable } from '../types/database.types';

async function seedData() {
  console.log('🌱 데이터 시딩 시작...\n');

  try {
    // 1. 토너먼트 5개 생성
    const tournaments: Omit<Tournament, 'id'>[] = [
      {
        tournament_name: 'Korea Poker Championship 2025',
        start_date: '2025-02-15T09:00:00Z',
        end_date: '2025-02-20T23:00:00Z',
        venue: '서울 그랜드 호텔',
        buy_in: 3000000,
        starting_chips: 30000,
        status: 'upcoming'
      },
      {
        tournament_name: 'Spring Festival Main Event',
        start_date: '2025-03-01T10:00:00Z',
        end_date: '2025-03-05T22:00:00Z',
        venue: '부산 파라다이스 카지노',
        buy_in: 5000000,
        starting_chips: 50000,
        status: 'upcoming'
      },
      {
        tournament_name: 'High Roller Tournament',
        start_date: '2025-01-10T14:00:00Z',
        end_date: '2025-01-12T23:00:00Z',
        venue: '제주 드림타워',
        buy_in: 10000000,
        starting_chips: 100000,
        status: 'active'
      },
      {
        tournament_name: 'Beginner Friendly Series',
        start_date: '2025-01-20T09:00:00Z',
        end_date: '2025-01-22T20:00:00Z',
        venue: '온라인',
        buy_in: 500000,
        starting_chips: 10000,
        status: 'active'
      },
      {
        tournament_name: 'Year End Championship 2024',
        start_date: '2024-12-28T10:00:00Z',
        end_date: '2024-12-31T23:59:00Z',
        venue: '서울 워커힐 카지노',
        buy_in: 2000000,
        starting_chips: 20000,
        status: 'completed'
      }
    ];

    console.log('📋 토너먼트 생성 중...');
    const createdTournaments = [];
    
    for (const tournament of tournaments) {
      const { data, error } = await supabaseAdmin!
        .from('tournaments')
        .insert(tournament)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ 토너먼트 생성 실패 (${tournament.tournament_name}):`, error.message);
      } else {
        createdTournaments.push(data);
        console.log(`✅ 생성됨: ${data.tournament_name}`);
      }
    }

    console.log(`\n✅ ${createdTournaments.length}개 토너먼트 생성 완료\n`);

    // 2. 각 토너먼트에 테이블 2개씩 생성 (총 10개)
    console.log('🎲 테이블 생성 중...');
    let tableCount = 0;

    for (const tournament of createdTournaments.slice(0, 5)) {
      const tables: Omit<TournamentTable, 'id'>[] = [
        {
          tournament_id: tournament.id,
          table_number: 1,
          table_name: `${tournament.tournament_name} - Table 1`,
          status: tournament.status === 'completed' ? 'closed' : 
                  tournament.status === 'active' ? 'active' : 'waiting',
          small_blind: 100,
          big_blind: 200,
          ante: 25,
          hands_played: Math.floor(Math.random() * 100)
        },
        {
          tournament_id: tournament.id,
          table_number: 2,
          table_name: `${tournament.tournament_name} - Table 2`,
          status: tournament.status === 'completed' ? 'closed' : 
                  tournament.status === 'active' ? 'active' : 'waiting',
          small_blind: 100,
          big_blind: 200,
          ante: 25,
          hands_played: Math.floor(Math.random() * 100)
        }
      ];

      for (const table of tables) {
        const { data, error } = await supabaseAdmin!
          .from('tournament_tables')
          .insert(table)
          .select()
          .single();
        
        if (error) {
          console.error(`❌ 테이블 생성 실패:`, error.message);
        } else {
          tableCount++;
          console.log(`✅ 생성됨: ${data.table_name}`);
        }
      }
    }

    console.log(`\n✅ ${tableCount}개 테이블 생성 완료\n`);

    // 3. 생성된 데이터 요약
    const { count: tournamentCount } = await supabaseAdmin!
      .from('tournaments')
      .select('*', { count: 'exact', head: true });
    
    const { count: tableCount2 } = await supabaseAdmin!
      .from('tournament_tables')
      .select('*', { count: 'exact', head: true });

    console.log('📊 데이터베이스 현재 상태:');
    console.log(`   - 토너먼트: ${tournamentCount}개`);
    console.log(`   - 테이블: ${tableCount2}개`);
    console.log('\n🎉 데이터 시딩 완료!');

  } catch (error) {
    console.error('❌ 시딩 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (!supabaseAdmin) {
  console.error('❌ Service Key가 설정되지 않았습니다. .env 파일을 확인하세요.');
  process.exit(1);
}

seedData();