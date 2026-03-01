// ============================================================
// Tournoi Ramadan — TypeScript Types
// ============================================================

// --- Database row types ---

export interface Player {
  id: string;
  username: string;
  full_name: string;
  city: string | null;
  phone: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface PlayerConflict {
  id: string;
  existing_player_id: string | null;
  username: string;
  full_name: string;
  city: string | null;
  phone: string | null;
  status: 'pending' | 'resolved' | 'ignored';
  created_at: string;
}

export interface League {
  id: string;
  name: string;
  season: string;
  status: 'draft' | 'active' | 'completed';
  city: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  league_id: string;
  name: string;
  logo_url: string | null;
  color: string;
  created_at: string;
}

export interface TeamPlayer {
  id: string;
  team_id: string;
  player_id: string;
  jersey_number: number | null;
}

export interface Match {
  id: string;
  league_id: string;
  matchday: number;
  date: string | null;
  time: string | null;
  location: string | null;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  home_color: string | null;
  away_color: string | null;
  status: 'scheduled' | 'live' | 'completed';
  created_at: string;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  event_type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'own_goal' | 'mvp';
  minute: number | null;
  created_at: string;
}

export interface MatchLineup {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  jersey_number: number | null;
  is_starter: boolean;
  created_at: string;
}

export type MatchLineupWithPlayer = MatchLineup & { player: Player };

export interface StandingRow {
  league_id: string;
  team_id: string;
  team_name: string;
  team_color: string;
  team_logo_url: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface PlayerStats {
  player_id: string;
  player_name: string;
  player_username: string;
  team_name: string;
  team_color: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  own_goals: number;
  mvp_count: number;
}

// --- Extended types (with joined data for frontend) ---

export interface MatchWithTeams extends Match {
  home_team: Team;
  away_team: Team;
}

export interface MatchEventWithDetails extends MatchEvent {
  player: Player;
  team: Team;
}

export interface TeamWithPlayers extends Team {
  team_players: (TeamPlayer & { player: Player })[];
}

// --- Supabase Database type for typed client ---

export interface Database {
  public: {
    Tables: {
      players: {
        Row: Player;
        Insert: Omit<Player, 'id' | 'created_at'>;
        Update: Partial<Omit<Player, 'id'>>;
      };
      leagues: {
        Row: League;
        Insert: Omit<League, 'id' | 'created_at'>;
        Update: Partial<Omit<League, 'id'>>;
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id' | 'created_at'>;
        Update: Partial<Omit<Team, 'id'>>;
      };
      team_players: {
        Row: TeamPlayer;
        Insert: Omit<TeamPlayer, 'id'>;
        Update: Partial<Omit<TeamPlayer, 'id'>>;
      };
      matches: {
        Row: Match;
        Insert: Omit<Match, 'id' | 'created_at'>;
        Update: Partial<Omit<Match, 'id'>>;
      };
      match_events: {
        Row: MatchEvent;
        Insert: Omit<MatchEvent, 'id' | 'created_at'>;
        Update: Partial<Omit<MatchEvent, 'id'>>;
      };
    };
    Views: {
      standings_view: {
        Row: StandingRow;
      };
    };
    Functions: {
      get_player_stats: {
        Args: { p_league_id: string };
        Returns: PlayerStats[];
      };
    };
  };
}
