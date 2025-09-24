export interface Tournament {
  id: string;
  tournament_name: string;
  start_date: string;
  end_date: string;
  venue: string;
  buy_in: number;
  starting_chips: number;
  status: 'upcoming' | 'active' | 'paused' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface TournamentTable {
  id: string;
  tournament_id: string;
  table_number: number;
  table_name: string;
  status: 'waiting' | 'active' | 'break' | 'closed';
  small_blind: number;
  big_blind: number;
  ante: number;
  hands_played: number;
  created_at?: string;
  updated_at?: string;
}

export interface PlayerRegistry {
  id: string;
  legal_name: string;
  nickname?: string;
  country_code?: string;
  email?: string;
  is_verified: boolean;
}

export interface TournamentEntry {
  id: string;
  tournament_id: string;
  player_id: string;
  table_id?: string;
  seat_number?: number;
  chip_count: number;
  status: 'active' | 'sitting_out' | 'eliminated' | 'moved';
  buy_in_paid: number;
}

export interface Hand {
  id: string;
  tournament_id: string;
  table_id: string;
  hand_number: number;
  started_at: string;
  ended_at?: string;
  community_cards: any;
  total_pot: number;
  winners: any;
}