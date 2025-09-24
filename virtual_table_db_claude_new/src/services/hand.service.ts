import { supabase } from '../config/supabase';
import { Hand } from '../types/database.types';

export class HandService {
  async createHand(data: Omit<Hand, 'id'>): Promise<Hand> {
    const { data: hand, error } = await supabase
      .from('hands')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return hand;
  }

  async getHand(id: string): Promise<Hand | null> {
    const { data, error } = await supabase
      .from('hands')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getHandsByTable(tableId: string, limit: number = 10): Promise<Hand[]> {
    const { data, error } = await supabase
      .from('hands')
      .select('*')
      .eq('table_id', tableId)
      .order('hand_number', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getHandsByTournament(tournamentId: string, limit: number = 50): Promise<Hand[]> {
    const { data, error } = await supabase
      .from('hands')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async updateHand(id: string, updates: Partial<Hand>): Promise<Hand> {
    const { data, error } = await supabase
      .from('hands')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async endHand(id: string, winners: any, totalPot: number): Promise<Hand> {
    const updates = {
      ended_at: new Date().toISOString(),
      winners,
      total_pot: totalPot
    };

    return this.updateHand(id, updates);
  }
}