import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  League, Team, Match, MatchEvent, Player, PlayerConflict,
  StandingRow, PlayerStats, MatchWithTeams,
  MatchEventWithDetails, TeamWithPlayers, MatchLineupWithPlayer,
} from '@/lib/tournoi-types';

// ============================================================
// PUBLIC QUERIES
// ============================================================

export function useActiveLeague() {
  return useQuery<League | null>({
    queryKey: ['tournoi', 'active-league'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useLeagues() {
  return useQuery<League[]>({
    queryKey: ['tournoi', 'leagues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useStandings(leagueId: string | undefined) {
  return useQuery<StandingRow[]>({
    queryKey: ['tournoi', 'standings', leagueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standings_view')
        .select('*')
        .eq('league_id', leagueId!)
        .order('points', { ascending: false })
        .order('goal_difference', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!leagueId,
  });
}

export function useTeams(leagueId: string | undefined) {
  return useQuery<Team[]>({
    queryKey: ['tournoi', 'teams', leagueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('league_id', leagueId!)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!leagueId,
  });
}

export function useTeamWithPlayers(teamId: string | undefined) {
  return useQuery<TeamWithPlayers>({
    queryKey: ['tournoi', 'team-players', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_players(*, player:players(*))
        `)
        .eq('id', teamId!)
        .single();
      if (error) throw error;
      return data as unknown as TeamWithPlayers;
    },
    enabled: !!teamId,
  });
}

export function useTeamsWithPlayers(leagueId: string | undefined) {
  return useQuery<TeamWithPlayers[]>({
    queryKey: ['tournoi', 'teams-with-players', leagueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_players(*, player:players(*))
        `)
        .eq('league_id', leagueId!)
        .order('name');
      if (error) throw error;
      return (data || []) as unknown as TeamWithPlayers[];
    },
    enabled: !!leagueId,
  });
}

export function useMatches(leagueId: string | undefined, status?: string) {
  return useQuery<MatchWithTeams[]>({
    queryKey: ['tournoi', 'matches', leagueId, status],
    queryFn: async () => {
      let query = supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*)
        `)
        .eq('league_id', leagueId!)
        .order('matchday', { ascending: true })
        .order('date', { ascending: true });
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as MatchWithTeams[];
    },
    enabled: !!leagueId,
  });
}

export function useMatch(matchId: string | undefined) {
  return useQuery<MatchWithTeams>({
    queryKey: ['tournoi', 'match', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*)
        `)
        .eq('id', matchId!)
        .single();
      if (error) throw error;
      return data as unknown as MatchWithTeams;
    },
    enabled: !!matchId,
  });
}

export function useMatchLineups(matchId: string | undefined) {
  return useQuery<MatchLineupWithPlayer[]>({
    queryKey: ['tournoi', 'match-lineups', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_lineups')
        .select('*, player:players(*)')
        .eq('match_id', matchId!);
      if (error) throw error;
      return (data || []) as unknown as MatchLineupWithPlayer[];
    },
    enabled: !!matchId,
  });
}

export function useMatchEvents(matchId: string | undefined) {
  return useQuery<MatchEventWithDetails[]>({
    queryKey: ['tournoi', 'match-events', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_events')
        .select(`
          *,
          player:players(*),
          team:teams(*)
        `)
        .eq('match_id', matchId!)
        .order('minute', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as MatchEventWithDetails[];
    },
    enabled: !!matchId,
  });
}

export function usePlayerStats(leagueId: string | undefined) {
  return useQuery<PlayerStats[]>({
    queryKey: ['tournoi', 'player-stats', leagueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_player_stats', { p_league_id: leagueId! });
      if (error) throw error;
      return (data || []) as PlayerStats[];
    },
    enabled: !!leagueId,
  });
}

export function useSearchPlayers(search: string) {
  return useQuery<Player[]>({
    queryKey: ['tournoi', 'search-players', search],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .or(`username.ilike.%${search}%,full_name.ilike.%${search}%`)
        .order('username')
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: search.length >= 2,
  });
}

// ============================================================
// SYNC PLAYERS FROM BACKEND
// ============================================================

const BACKEND_PLAYERS_URL = 'https://rayobackend.onrender.com/api/sheets/Players';

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] || '').trim(); });
    return row;
  });
}

export function useSyncPlayers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ imported: number; skipped: number; conflicts: number }> => {
      // 1. Fetch CSV from backend
      const res = await fetch(BACKEND_PLAYERS_URL);
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const csv = await res.text();
      const rows = parseCSV(csv);

      // 2. Map CSV rows to player objects (skip Google Sheets errors)
      const isSheetError = (v: string) => /^#(VALUE|REF|N\/A|NUM|DIV|NAME|NULL)/.test(v);
      const allPlayers = rows
        .filter(r => r['Username']?.trim() && !isSheetError(r['Username'].trim()))
        .map(r => ({
          username: r['Username'].trim(),
          full_name: `${r['First name🔒'] || ''} ${r['Last name🔒'] || ''}`.trim(),
          city: (r['City'] && !isSheetError(r['City'])) ? r['City'].trim() : null,
          phone: r['Phone number']?.trim() || null,
        }))
        .filter(p => p.username && p.full_name);

      // 3. Deduplicate CSV: keep first occurrence, collect duplicates
      const uniqueMap = new Map<string, typeof allPlayers[0]>();
      const csvDuplicates: typeof allPlayers = [];
      for (const p of allPlayers) {
        if (!uniqueMap.has(p.username)) {
          uniqueMap.set(p.username, p);
        } else {
          csvDuplicates.push(p);
        }
      }
      const uniquePlayers = Array.from(uniqueMap.values());

      // 4. Get existing usernames + ids to skip already-imported
      const { data: existing } = await supabase
        .from('players')
        .select('id, username');
      const existingMap = new Map((existing || []).map((p: { id: string; username: string }) => [p.username, p.id]));

      const newPlayers = uniquePlayers.filter(p => !existingMap.has(p.username));

      // 5. Batch insert new unique players
      if (newPlayers.length > 0) {
        for (let i = 0; i < newPlayers.length; i += 500) {
          const chunk = newPlayers.slice(i, i + 500);
          const { error } = await supabase.from('players').insert(chunk);
          if (error) throw error;
        }
        // Refresh existing map with newly inserted players
        const { data: refreshed } = await supabase
          .from('players')
          .select('id, username');
        if (refreshed) {
          existingMap.clear();
          for (const p of refreshed) existingMap.set(p.username, p.id);
        }
      }

      // 6. Store CSV duplicates as conflicts (skip already-tracked ones)
      if (csvDuplicates.length > 0) {
        const { data: existingConflicts } = await supabase
          .from('player_conflicts')
          .select('username, full_name')
          .eq('status', 'pending');
        const existingConflictKeys = new Set(
          (existingConflicts || []).map((c: { username: string; full_name: string }) =>
            `${c.username}::${c.full_name}`
          )
        );

        const newConflicts = csvDuplicates
          .filter(d => !existingConflictKeys.has(`${d.username}::${d.full_name}`))
          .map(d => ({
            existing_player_id: existingMap.get(d.username) || null,
            username: d.username,
            full_name: d.full_name,
            city: d.city,
            phone: d.phone,
            status: 'pending',
          }));

        if (newConflicts.length > 0) {
          for (let i = 0; i < newConflicts.length; i += 500) {
            const chunk = newConflicts.slice(i, i + 500);
            await supabase.from('player_conflicts').insert(chunk);
          }
        }
      }

      return {
        imported: newPlayers.length,
        skipped: uniquePlayers.length - newPlayers.length,
        conflicts: csvDuplicates.length,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'search-players'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'player-conflicts'] });
    },
  });
}

// Query + mutations for player conflicts
export function usePlayerConflicts() {
  return useQuery<(PlayerConflict & { existing_player?: Player })[]>({
    queryKey: ['tournoi', 'player-conflicts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_conflicts')
        .select('*, existing_player:players(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as any;
    },
  });
}

export function useResolveConflict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ conflictId, action, playerId }: {
      conflictId: string;
      action: 'resolved' | 'ignored';
      playerId?: string;
    }) => {
      // If resolved: update the existing player with conflict data
      if (action === 'resolved' && playerId) {
        const { data: conflict } = await supabase
          .from('player_conflicts')
          .select('*')
          .eq('id', conflictId)
          .single();
        if (conflict) {
          await supabase.from('players').update({
            full_name: conflict.full_name,
            city: conflict.city,
            phone: conflict.phone,
          }).eq('id', playerId);
        }
      }
      // Mark conflict as resolved/ignored
      const { error } = await supabase
        .from('player_conflicts')
        .update({ status: action })
        .eq('id', conflictId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'player-conflicts'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'search-players'] });
    },
  });
}

// ============================================================
// ADMIN MUTATIONS
// ============================================================

export function useCreateLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (league: { name: string; season: string; city?: string; status?: string }) => {
      const { data, error } = await supabase
        .from('leagues')
        .insert(league)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'leagues'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'active-league'] });
    },
  });
}

export function useUpdateLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<League>) => {
      const { data, error } = await supabase
        .from('leagues')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'leagues'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'active-league'] });
    },
  });
}

export function useDeleteLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leagues').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournoi'] });
    },
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (team: { league_id: string; name: string; color?: string; logo_url?: string }) => {
      const { data, error } = await supabase
        .from('teams')
        .insert(team)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'teams'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'teams-with-players'] });
    },
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'teams'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'teams-with-players'] });
    },
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; color?: string; name?: string; logo_url?: string }) => {
      const { error } = await supabase.from('teams').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'teams'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'teams-with-players'] });
    },
  });
}

export function useCreatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (player: { username: string; full_name: string; city?: string }): Promise<Player> => {
      const { data, error } = await supabase
        .from('players')
        .insert(player)
        .select()
        .single();
      if (error) throw error;
      return data as Player;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'search-players'] });
    },
  });
}

export function useAddPlayerToTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tp: { team_id: string; player_id: string; jersey_number?: number }) => {
      const { data, error } = await supabase
        .from('team_players')
        .insert(tp)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'teams-with-players'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'team-players'] });
    },
  });
}

export function useRemovePlayerFromTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('team_players').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'teams-with-players'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'team-players'] });
    },
  });
}

export function useUpdateJerseyNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, jersey_number }: { id: string; jersey_number: number | null }) => {
      const { data, error } = await supabase
        .from('team_players')
        .update({ jersey_number })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'teams-with-players'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'team-players'] });
    },
  });
}

export function useUpdateMatchLineupJersey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, match_id, jersey_number }: { id: string; match_id: string; jersey_number: number | null }) => {
      const { data, error } = await supabase
        .from('match_lineups')
        .update({ jersey_number })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { data, match_id };
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'match-lineups', variables.match_id] });
    },
  });
}

// ============================================================
// SCORE CALCULATION
// ============================================================

export function computeScoreFromEvents(
  events: MatchEventWithDetails[],
  homeTeamId: string,
  awayTeamId: string
): { homeScore: number; awayScore: number } {
  let homeScore = 0;
  let awayScore = 0;
  for (const ev of events) {
    if (ev.event_type === 'goal') {
      if (ev.team_id === homeTeamId) homeScore++;
      else if (ev.team_id === awayTeamId) awayScore++;
    } else if (ev.event_type === 'own_goal') {
      if (ev.team_id === homeTeamId) awayScore++;
      else if (ev.team_id === awayTeamId) homeScore++;
    }
  }
  return { homeScore, awayScore };
}

async function syncMatchScore(matchId: string, homeTeamId: string, awayTeamId: string) {
  const { data: allEvents, error: fetchErr } = await supabase
    .from('match_events')
    .select('*, player:players(*), team:teams(*)')
    .eq('match_id', matchId)
    .order('minute', { ascending: true });
  if (fetchErr) throw fetchErr;
  const events = (allEvents || []) as unknown as MatchEventWithDetails[];
  const { homeScore, awayScore } = computeScoreFromEvents(events, homeTeamId, awayTeamId);
  const { error: updateErr } = await supabase
    .from('matches')
    .update({ home_score: homeScore, away_score: awayScore })
    .eq('id', matchId);
  if (updateErr) throw updateErr;
}

export function useAddGoalWithAssist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      match_id: string;
      home_team_id: string;
      away_team_id: string;
      scorer_player_id: string;
      scorer_team_id: string;
      assist_player_id?: string;
      assist_team_id?: string;
      is_own_goal: boolean;
      minute?: number;
    }) => {
      const goalType = params.is_own_goal ? 'own_goal' : 'goal';
      const { error: goalError } = await supabase
        .from('match_events')
        .insert({
          match_id: params.match_id,
          player_id: params.scorer_player_id,
          team_id: params.scorer_team_id,
          event_type: goalType,
          minute: params.minute,
        });
      if (goalError) throw goalError;

      if (!params.is_own_goal && params.assist_player_id && params.assist_team_id) {
        const { error: assistError } = await supabase
          .from('match_events')
          .insert({
            match_id: params.match_id,
            player_id: params.assist_player_id,
            team_id: params.assist_team_id,
            event_type: 'assist',
            minute: params.minute,
          });
        if (assistError) throw assistError;
      }

      await syncMatchScore(params.match_id, params.home_team_id, params.away_team_id);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'match-events', variables.match_id] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'match', variables.match_id] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'matches'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'standings'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'player-stats'] });
    },
  });
}

export function useDeleteGoalWithAssist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalEventId, matchId, minute, homeTeamId, awayTeamId }: {
      goalEventId: string;
      matchId: string;
      minute: number | null;
      homeTeamId: string;
      awayTeamId: string;
    }) => {
      await supabase.from('match_events').delete().eq('id', goalEventId);

      if (minute != null) {
        const { data: assists } = await supabase
          .from('match_events')
          .select('id')
          .eq('match_id', matchId)
          .eq('event_type', 'assist')
          .eq('minute', minute);
        if (assists && assists.length > 0) {
          await supabase.from('match_events').delete().eq('id', assists[0].id);
        }
      }

      await syncMatchScore(matchId, homeTeamId, awayTeamId);
      return matchId;
    },
    onSuccess: (matchId) => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'match-events', matchId] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'match', matchId] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'matches'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'standings'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'player-stats'] });
    },
  });
}

export function useCreateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (match: {
      league_id: string;
      matchday: number;
      date?: string;
      time?: string;
      location?: string;
      home_team_id: string;
      away_team_id: string;
    }) => {
      const { data, error } = await supabase
        .from('matches')
        .insert(match)
        .select()
        .single();
      if (error) throw error;

      // Auto-populate match_lineups from team_players default jersey numbers
      const { data: teamPlayers } = await supabase
        .from('team_players')
        .select('team_id, player_id, jersey_number')
        .in('team_id', [match.home_team_id, match.away_team_id]);

      if (teamPlayers && teamPlayers.length > 0) {
        const lineups = teamPlayers.map((tp: { team_id: string; player_id: string; jersey_number: number | null }) => ({
          match_id: data.id,
          team_id: tp.team_id,
          player_id: tp.player_id,
          jersey_number: tp.jersey_number,
        }));
        await supabase.from('match_lineups').insert(lineups);
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'matches'] });
    },
  });
}

export function useUpdateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Match>) => {
      const { data, error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'match', variables.id] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'matches'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'standings'] });
    },
  });
}

export function useDeleteMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('matches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'matches'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'standings'] });
    },
  });
}

export function useCreateMatchEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: {
      match_id: string;
      player_id: string;
      team_id: string;
      event_type: MatchEvent['event_type'];
      minute?: number;
    }) => {
      const { data, error } = await supabase
        .from('match_events')
        .insert(event)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'match-events', variables.match_id] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'player-stats'] });
    },
  });
}

export function useDeleteMatchEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, matchId, homeTeamId, awayTeamId }: {
      id: string;
      matchId: string;
      homeTeamId?: string;
      awayTeamId?: string;
    }) => {
      const { error } = await supabase.from('match_events').delete().eq('id', id);
      if (error) throw error;
      if (homeTeamId && awayTeamId) {
        await syncMatchScore(matchId, homeTeamId, awayTeamId);
      }
      return matchId;
    },
    onSuccess: (matchId) => {
      qc.invalidateQueries({ queryKey: ['tournoi', 'match-events', matchId] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'match', matchId] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'matches'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'standings'] });
      qc.invalidateQueries({ queryKey: ['tournoi', 'player-stats'] });
    },
  });
}
