import { supabase, supabaseAdmin } from '../config/supabase';
import { Tournament, TournamentTable } from '../types/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

export class TournamentService {
  private client: SupabaseClient;

  constructor(useAdmin: boolean = false) {
    // Use admin client if available and requested (for testing)
    this.client = (useAdmin && supabaseAdmin) ? supabaseAdmin : supabase;
  }

  async createTournament(data: Omit<Tournament, 'id'>): Promise<Tournament> {
    const { data: tournament, error } = await this.client
      .from('tournaments')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return tournament;
  }

  async getTournament(id: string): Promise<Tournament | null> {
    const { data, error } = await this.client
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createTable(data: Omit<TournamentTable, 'id'>): Promise<TournamentTable> {
    const { data: table, error } = await this.client
      .from('tournament_tables')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return table;
  }

  async getTables(tournamentId: string): Promise<TournamentTable[]> {
    const { data, error } = await this.client
      .from('tournament_tables')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('table_number');

    if (error) throw error;
    return data || [];
  }
}