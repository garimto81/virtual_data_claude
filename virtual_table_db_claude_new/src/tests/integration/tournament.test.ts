import { TournamentService } from '../../services/tournament.service';
import { supabase, supabaseAdmin } from '../../config/supabase';

describe('Tournament Integration Tests', () => {
  // Use admin mode for testing (service key to bypass RLS)
  const service = new TournamentService(true);
  let testTournamentId: string;

  beforeAll(async () => {
    console.log('Using Supabase client for testing');
    if (supabaseAdmin) {
      console.log('Using Service Key - RLS bypassed');
    } else {
      console.log('Using Anon Key - RLS policies apply');
    }
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    if (testTournamentId) {
      const client = supabaseAdmin || supabase;
      await client
        .from('tournaments')
        .delete()
        .eq('id', testTournamentId);
    }
  });

  test('should create a tournament', async () => {
    const tournamentData = {
      tournament_name: 'Test Tournament',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000).toISOString(),
      venue: 'Test Venue',
      buy_in: 1000000,
      starting_chips: 10000,
      status: 'upcoming' as const
    };

    const tournament = await service.createTournament(tournamentData);
    
    expect(tournament).toBeDefined();
    expect(tournament.tournament_name).toBe('Test Tournament');
    
    testTournamentId = tournament.id;
  });

  test('should create tables for tournament', async () => {
    const tableData = {
      tournament_id: testTournamentId,
      table_number: 1,
      table_name: 'Table 1',
      status: 'waiting' as const,
      small_blind: 50,
      big_blind: 100,
      ante: 0,
      hands_played: 0
    };

    const table = await service.createTable(tableData);
    
    expect(table).toBeDefined();
    expect(table.table_number).toBe(1);
  });

  test('should get all tables for tournament', async () => {
    const tables = await service.getTables(testTournamentId);
    
    expect(tables).toHaveLength(1);
    expect(tables[0].table_name).toBe('Table 1');
  });
});