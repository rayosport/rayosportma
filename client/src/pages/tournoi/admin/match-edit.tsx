import { useState, useEffect, useMemo } from 'react';
import { useRoute, useLocation } from 'wouter';
import {
  useMatch, useMatchEvents, useUpdateMatch,
  useCreateMatchEvent, useDeleteMatchEvent,
  useAddGoalWithAssist, useDeleteGoalWithAssist, computeScoreFromEvents,
  useMatchLineups, useUpdateMatchLineupJersey,
} from '@/hooks/use-tournoi';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/tournoi/AdminLayout';
import type { MatchEvent, MatchLineupWithPlayer } from '@/lib/tournoi-types';
import { ArrowLeft, Save, Plus, Trash2, AlertTriangle, X, Pencil, Check } from 'lucide-react';
import ConfirmDialog from '@/components/tournoi/ConfirmDialog';

const otherEventOptions: { value: MatchEvent['event_type']; label: string }[] = [
  { value: 'yellow_card', label: 'Carton jaune' },
  { value: 'red_card', label: 'Carton rouge' },
  { value: 'mvp', label: 'MVP' },
];

const allEventLabels: Record<string, string> = {
  goal: 'But', assist: 'Passe D.', yellow_card: 'Carton jaune',
  red_card: 'Carton rouge', own_goal: 'C.S.C', mvp: 'MVP',
};

/** All players sorted: with jersey first, nulls last */
function getSortedPlayers(lineup?: MatchLineupWithPlayer[]) {
  if (!lineup) return [];
  return [...lineup].sort((a, b) => (a.jersey_number ?? 999) - (b.jersey_number ?? 999));
}

const AdminMatchEdit = () => {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/tournoi/admin/match/:id');
  const matchId = params?.id;
  const { toast } = useToast();

  const { data: match, isLoading } = useMatch(matchId);
  const { data: events } = useMatchEvents(matchId);
  const { data: lineups } = useMatchLineups(matchId);
  const updateMatch = useUpdateMatch();
  const createEvent = useCreateMatchEvent();
  const deleteEvent = useDeleteMatchEvent();
  const addGoal = useAddGoalWithAssist();
  const deleteGoal = useDeleteGoalWithAssist();

  const [status, setStatus] = useState<'scheduled' | 'live' | 'completed'>('scheduled');

  // Goal entry — store player IDs directly
  const [goalTeamSide, setGoalTeamSide] = useState<'home' | 'away'>('home');
  const [isOwnGoal, setIsOwnGoal] = useState(false);
  const [scorerPlayerId, setScorerPlayerId] = useState<string | null>(null);
  const [assistPlayerId, setAssistPlayerId] = useState<string | null>(null);
  const [goalMinute, setGoalMinute] = useState('');

  // Other event form
  const [otherEventType, setOtherEventType] = useState<MatchEvent['event_type']>('yellow_card');
  const [otherEventPlayerId, setOtherEventPlayerId] = useState('');
  const [otherEventTeamId, setOtherEventTeamId] = useState('');
  const [otherEventMinute, setOtherEventMinute] = useState('');

  const [deleteEventTarget, setDeleteEventTarget] = useState<{ id: string; label: string; eventType: string; minute: number | null } | null>(null);
  const [editingLineupJersey, setEditingLineupJersey] = useState<{ id: string; value: string } | null>(null);
  const updateLineupJersey = useUpdateMatchLineupJersey();

  useEffect(() => { document.title = 'Éditer Match - Admin Tournoi'; }, []);
  useEffect(() => { if (match) setStatus(match.status); }, [match]);

  // Reset scorer/assist when switching team side
  useEffect(() => { setScorerPlayerId(null); setAssistPlayerId(null); }, [goalTeamSide]);

  // Auto-computed score
  const computedScore = useMemo(() => {
    if (!events || !match) return { homeScore: 0, awayScore: 0 };
    return computeScoreFromEvents(events, match.home_team_id, match.away_team_id);
  }, [events, match]);

  // Split lineups by team
  const homeLineup = useMemo(() => lineups?.filter(l => l.team_id === match?.home_team_id) ?? [], [lineups, match]);
  const awayLineup = useMemo(() => lineups?.filter(l => l.team_id === match?.away_team_id) ?? [], [lineups, match]);
  const activeTeamId = goalTeamSide === 'home' ? match?.home_team_id : match?.away_team_id;
  const activeLineup = goalTeamSide === 'home' ? homeLineup : awayLineup;

  // Sorted players for chip grid
  const sortedPlayers = useMemo(() => getSortedPlayers(activeLineup), [activeLineup]);

  // Jersey map for events list
  const playerJerseyMap = useMemo(() => {
    const map = new Map<string, number>();
    lineups?.forEach(l => { if (l.jersey_number != null) map.set(l.player_id, l.jersey_number); });
    return map;
  }, [lineups]);

  // Player name map for quick lookups
  const playerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    lineups?.forEach(l => map.set(l.player_id, l.player.full_name || l.player.username));
    return map;
  }, [lineups]);

  // Players missing jersey
  const playersWithoutJersey = useMemo(() => {
    return (lineups ?? []).filter(l => l.jersey_number == null).map(l => l.player.full_name);
  }, [lineups]);

  const handleSaveLineupJersey = async () => {
    if (!editingLineupJersey || !matchId) return;
    const num = editingLineupJersey.value ? parseInt(editingLineupJersey.value) : null;
    try {
      await updateLineupJersey.mutateAsync({ id: editingLineupJersey.id, match_id: matchId, jersey_number: num });
      setEditingLineupJersey(null);
    } catch (err: any) { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); }
  };

  const handleSaveStatus = async () => {
    if (!matchId) return;
    try {
      await updateMatch.mutateAsync({ id: matchId, status });
      toast({ title: 'Statut mis à jour' });
    } catch (err: any) { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); }
  };

  const handleAddGoal = async () => {
    if (!matchId || !match || !scorerPlayerId || !activeTeamId) return;
    try {
      await addGoal.mutateAsync({
        match_id: matchId,
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
        scorer_player_id: scorerPlayerId,
        scorer_team_id: activeTeamId,
        assist_player_id: (!isOwnGoal && assistPlayerId) ? assistPlayerId : undefined,
        assist_team_id: (!isOwnGoal && assistPlayerId) ? activeTeamId : undefined,
        is_own_goal: isOwnGoal,
        minute: goalMinute ? parseInt(goalMinute) : undefined,
      });
      toast({ title: isOwnGoal ? 'C.S.C ajouté' : 'But ajouté' });
      setScorerPlayerId(null);
      setAssistPlayerId(null);
      setGoalMinute('');
      setIsOwnGoal(false);
    } catch (err: any) { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); }
  };

  const handleAddOtherEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchId || !otherEventPlayerId || !otherEventTeamId) return;
    try {
      await createEvent.mutateAsync({
        match_id: matchId,
        player_id: otherEventPlayerId,
        team_id: otherEventTeamId,
        event_type: otherEventType,
        minute: otherEventMinute ? parseInt(otherEventMinute) : undefined,
      });
      toast({ title: 'Événement ajouté' });
      setOtherEventPlayerId('');
      setOtherEventMinute('');
    } catch (err: any) { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); }
  };

  const handleOtherPlayerSelect = (playerId: string) => {
    setOtherEventPlayerId(playerId);
    const entry = lineups?.find(l => l.player_id === playerId);
    if (entry) setOtherEventTeamId(entry.team_id);
  };

  const handleDeleteEvent = async () => {
    if (!matchId || !match || !deleteEventTarget) return;
    try {
      if (deleteEventTarget.eventType === 'goal' || deleteEventTarget.eventType === 'own_goal') {
        await deleteGoal.mutateAsync({
          goalEventId: deleteEventTarget.id,
          matchId,
          minute: deleteEventTarget.minute,
          homeTeamId: match.home_team_id,
          awayTeamId: match.away_team_id,
        });
      } else {
        await deleteEvent.mutateAsync({
          id: deleteEventTarget.id,
          matchId,
          homeTeamId: match.home_team_id,
          awayTeamId: match.away_team_id,
        });
      }
      toast({ title: 'Événement supprimé' });
      setDeleteEventTarget(null);
    } catch (err: any) { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); }
  };

  const teamColor = goalTeamSide === 'home' ? match?.home_team.color : match?.away_team.color;

  const backBtn = (
    <button onClick={() => setLocation('/tournoi/admin/matchs')} className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-gray-400 text-xs font-semibold rounded-lg hover:bg-gray-700 transition-all border border-gray-700">
      <ArrowLeft className="w-3.5 h-3.5" /> Retour aux matchs
    </button>
  );

  if (isLoading || !match) {
    return (
      <AdminLayout title="Éditer le match" actions={backBtn}>
        <p className="text-sm text-gray-500 text-center py-12">Chargement...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Éditer le match"
      subtitle={`Journée ${match.matchday} · ${match.home_team.name} vs ${match.away_team.name}`}
      actions={backBtn}
    >
      <div className="space-y-6 max-w-2xl">
        {/* Warning: players without jersey numbers */}
        {playersWithoutJersey.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-300 mb-1">Joueurs sans numéro de maillot</p>
              <p className="text-[10px] text-amber-400/70">
                {playersWithoutJersey.join(', ')} — Assignez-leur un numéro dans la page Équipes.
              </p>
            </div>
          </div>
        )}

        {/* Score (auto-calculated) & Status */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5">Score & Statut</h3>

          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: match.home_team.color }} />
                <span className="text-xs font-bold text-gray-200">{match.home_team.name}</span>
              </div>
              <span className="w-14 h-12 flex items-center justify-center text-3xl font-black text-white">
                {computedScore.homeScore}
              </span>
            </div>
            <span className="text-gray-600 font-bold text-xl mt-6">-</span>
            <div className="text-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-gray-200">{match.away_team.name}</span>
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: match.away_team.color }} />
              </div>
              <span className="w-14 h-12 flex items-center justify-center text-3xl font-black text-white">
                {computedScore.awayScore}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-gray-600 text-center mb-4">Score calculé automatiquement</p>

          <div className="flex items-center justify-center gap-2 mb-5">
            {(['scheduled', 'live', 'completed'] as const).map(s => (
              <button
                key={s} onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  status === s
                    ? s === 'live' ? 'bg-green-500/20 text-green-400 border-green-500/30' : s === 'completed' ? 'bg-gray-700 text-white border-gray-600' : 'bg-rayoblue/20 text-rayoblue border-rayoblue/30'
                    : 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700'
                }`}
              >
                {s === 'scheduled' ? 'Programmé' : s === 'live' ? 'En direct' : 'Terminé'}
              </button>
            ))}
          </div>

          <button onClick={handleSaveStatus} disabled={updateMatch.isPending}
            className="w-full py-2.5 bg-rayoblue text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {updateMatch.isPending ? 'Sauvegarde...' : 'Sauvegarder le statut'}
          </button>
        </div>

        {/* Lineup jersey numbers editor */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Numéros de maillot</h3>
          <div className="grid grid-cols-2 gap-4">
            {([{ lineup: homeLineup, team: match.home_team }, { lineup: awayLineup, team: match.away_team }]).map(({ lineup, team }) => (
              <div key={team.id}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color }} />
                  <span className="text-[10px] font-bold text-gray-400">{team.name}</span>
                </div>
                <div className="space-y-1">
                  {[...lineup].sort((a, b) => (a.jersey_number ?? 999) - (b.jersey_number ?? 999)).map(l => (
                    <div key={l.id} className="flex items-center gap-2">
                      {editingLineupJersey?.id === l.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editingLineupJersey.value}
                            onChange={e => setEditingLineupJersey({ ...editingLineupJersey, value: e.target.value })}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveLineupJersey(); if (e.key === 'Escape') setEditingLineupJersey(null); }}
                            autoFocus
                            className="w-10 h-6 px-1 bg-gray-800 border border-rayoblue/50 rounded text-[10px] text-white text-center focus:outline-none"
                          />
                          <button onClick={handleSaveLineupJersey} className="p-0.5 text-green-400 hover:bg-green-500/10 rounded">
                            <Check className="w-3 h-3" />
                          </button>
                          <button onClick={() => setEditingLineupJersey(null)} className="p-0.5 text-gray-500 hover:bg-gray-700 rounded">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingLineupJersey({ id: l.id, value: l.jersey_number != null ? String(l.jersey_number) : '' })}
                          className="w-6 h-6 rounded bg-gray-800 text-gray-400 flex items-center justify-center text-[10px] font-bold border border-gray-700 hover:border-rayoblue/50 hover:text-rayoblue transition-all"
                        >
                          {l.jersey_number != null ? l.jersey_number : <Pencil className="w-2.5 h-2.5 text-gray-600" />}
                        </button>
                      )}
                      <span className="text-[10px] text-gray-400 truncate">{l.player.full_name || l.player.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Goal — Player Chip Grid */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Ajouter un but</h3>

          {/* Team side toggle */}
          <div className="flex gap-2 mb-4">
            {(['home', 'away'] as const).map(side => {
              const t = side === 'home' ? match.home_team : match.away_team;
              const active = goalTeamSide === side;
              return (
                <button
                  key={side}
                  type="button"
                  onClick={() => setGoalTeamSide(side)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                    active ? 'border-transparent' : 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700'
                  }`}
                  style={active ? { backgroundColor: t.color + '30', borderColor: t.color + '50', color: t.color } : undefined}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.name}
                </button>
              );
            })}
          </div>

          {/* Own goal toggle */}
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <div className={`w-8 h-5 rounded-full transition-colors relative ${isOwnGoal ? 'bg-red-500' : 'bg-gray-700'}`}
              onClick={() => { setIsOwnGoal(!isOwnGoal); setAssistPlayerId(null); }}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isOwnGoal ? 'left-3.5' : 'left-0.5'}`} />
            </div>
            <span className={`text-xs font-semibold ${isOwnGoal ? 'text-red-400' : 'text-gray-500'}`}>
              C.S.C (Contre son camp)
            </span>
          </label>

          {/* Step 1: Select Scorer */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                {isOwnGoal ? '1. Joueur CSC' : '1. Buteur'}
              </span>
              {scorerPlayerId && (
                <button onClick={() => { setScorerPlayerId(null); setAssistPlayerId(null); }}
                  className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-0.5">
                  <X className="w-3 h-3" /> Effacer
                </button>
              )}
            </div>
            {sortedPlayers.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                {sortedPlayers.map(tp => {
                  const selected = scorerPlayerId === tp.player_id;
                  return (
                    <button
                      key={tp.player_id}
                      type="button"
                      onClick={() => {
                        setScorerPlayerId(selected ? null : tp.player_id);
                        if (assistPlayerId === tp.player_id) setAssistPlayerId(null);
                      }}
                      className={`relative rounded-xl p-2 text-center transition-all border ${
                        selected
                          ? 'border-transparent ring-2 scale-[1.02]'
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
                      }`}
                      style={selected ? {
                        backgroundColor: teamColor + '25',
                        borderColor: teamColor,
                        boxShadow: `0 0 12px ${teamColor}30`,
                      } : undefined}
                    >
                      <div className={`text-lg font-black leading-none mb-0.5 ${selected ? 'text-white' : tp.jersey_number == null ? 'text-gray-600' : 'text-gray-300'}`}>
                        {tp.jersey_number ?? '?'}
                      </div>
                      <div className={`text-[8px] leading-tight truncate ${selected ? 'text-gray-200' : 'text-gray-500'}`}>
                        {(tp.player.full_name || tp.player.username).split(' ')[0]}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[10px] text-gray-600 py-3 text-center">Aucun joueur avec numéro dans cette équipe</p>
            )}
          </div>

          {/* Step 2: Select Assist (only for regular goals) */}
          {!isOwnGoal && scorerPlayerId && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  2. Passeur <span className="text-gray-600 normal-case">(optionnel)</span>
                </span>
                {assistPlayerId && (
                  <button onClick={() => setAssistPlayerId(null)}
                    className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-0.5">
                    <X className="w-3 h-3" /> Effacer
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                {sortedPlayers
                  .filter(tp => tp.player_id !== scorerPlayerId)
                  .map(tp => {
                    const selected = assistPlayerId === tp.player_id;
                    return (
                      <button
                        key={tp.player_id}
                        type="button"
                        onClick={() => setAssistPlayerId(selected ? null : tp.player_id)}
                        className={`relative rounded-xl p-2 text-center transition-all border ${
                          selected
                            ? 'border-transparent ring-2 scale-[1.02]'
                            : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
                        }`}
                        style={selected ? {
                          backgroundColor: '#a855f730',
                          borderColor: '#a855f7',
                          boxShadow: '0 0 12px #a855f730',
                        } : undefined}
                      >
                        <div className={`text-lg font-black leading-none mb-0.5 ${selected ? 'text-white' : tp.jersey_number == null ? 'text-gray-600' : 'text-gray-300'}`}>
                          {tp.jersey_number ?? '?'}
                        </div>
                        <div className={`text-[8px] leading-tight truncate ${selected ? 'text-purple-200' : 'text-gray-500'}`}>
                          {(tp.player.full_name || tp.player.username).split(' ')[0]}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Minute + Submit */}
          {scorerPlayerId && (
            <div className="flex gap-2 mt-3">
              <input
                type="number"
                value={goalMinute}
                onChange={e => setGoalMinute(e.target.value)}
                placeholder="Min"
                min={0}
                max={120}
                className="w-20 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white text-center focus:outline-none focus:border-rayoblue/50 transition-all"
              />
              <button
                type="button"
                onClick={handleAddGoal}
                disabled={addGoal.isPending}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 border ${
                  isOwnGoal
                    ? 'bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/25'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25'
                }`}
              >
                <Plus className="w-4 h-4" />
                {addGoal.isPending ? 'Ajout...' : isOwnGoal ? 'C.S.C' : (
                  <>
                    But #{playerJerseyMap.get(scorerPlayerId)}
                    {assistPlayerId && <span className="text-purple-400 ml-1">/ #{playerJerseyMap.get(assistPlayerId)}</span>}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Selection summary */}
          {scorerPlayerId && (
            <div className="mt-3 px-3 py-2 rounded-xl bg-gray-800/50 border border-gray-700/50">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">{isOwnGoal ? 'CSC:' : 'B:'}</span>
                <span className="font-bold text-white">#{playerJerseyMap.get(scorerPlayerId)}</span>
                <span className="text-gray-400">{playerNameMap.get(scorerPlayerId)}</span>
                {!isOwnGoal && assistPlayerId && (
                  <>
                    <span className="text-gray-600 mx-1">/</span>
                    <span className="text-gray-500">A:</span>
                    <span className="font-bold text-purple-400">#{playerJerseyMap.get(assistPlayerId)}</span>
                    <span className="text-gray-400">{playerNameMap.get(assistPlayerId)}</span>
                  </>
                )}
                {goalMinute && (
                  <>
                    <span className="text-gray-600 mx-1">·</span>
                    <span className="text-gray-500">{goalMinute}'</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Other Events (cards, MVP) */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Autres événements</h3>
          <form onSubmit={handleAddOtherEvent} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select value={otherEventType} onChange={e => setOtherEventType(e.target.value as MatchEvent['event_type'])}
              className="px-2.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-rayoblue/50">
              {otherEventOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={otherEventPlayerId} onChange={e => handleOtherPlayerSelect(e.target.value)} required
              className="px-2.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-rayoblue/50">
              <option value="">Joueur</option>
              {homeLineup.length > 0 && (
                <optgroup label={match.home_team.name}>
                  {[...homeLineup]
                    .sort((a, b) => (a.jersey_number ?? 999) - (b.jersey_number ?? 999))
                    .map(l => (
                      <option key={l.player_id} value={l.player_id}>
                        {l.jersey_number != null ? `#${l.jersey_number} — ` : ''}{l.player.full_name || l.player.username}
                      </option>
                    ))}
                </optgroup>
              )}
              {awayLineup.length > 0 && (
                <optgroup label={match.away_team.name}>
                  {[...awayLineup]
                    .sort((a, b) => (a.jersey_number ?? 999) - (b.jersey_number ?? 999))
                    .map(l => (
                      <option key={l.player_id} value={l.player_id}>
                        {l.jersey_number != null ? `#${l.jersey_number} — ` : ''}{l.player.full_name || l.player.username}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
            <input type="number" value={otherEventMinute} onChange={e => setOtherEventMinute(e.target.value)} placeholder="Min" min={0} max={120}
              className="px-2.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white text-center focus:outline-none focus:border-rayoblue/50" />
            <button type="submit" disabled={createEvent.isPending}
              className="px-3 py-2.5 bg-emerald-500/15 text-emerald-400 text-xs font-semibold rounded-xl hover:bg-emerald-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-1 border border-emerald-500/20">
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </form>
        </div>

        {/* Events list */}
        {events && events.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Événements ({events.filter(e => e.event_type !== 'assist').length})
            </h3>
            <div className="space-y-1">
              {events.filter(ev => ev.event_type !== 'assist').map(ev => {
                const jerseyNum = playerJerseyMap.get(ev.player_id);
                const pairedAssist = ev.event_type === 'goal' && ev.minute != null
                  ? events.find(a => a.event_type === 'assist' && a.minute === ev.minute && a.team_id === ev.team_id)
                  : null;
                const assistJNum = pairedAssist ? playerJerseyMap.get(pairedAssist.player_id) : null;

                return (
                  <div key={ev.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-2.5 text-xs flex-1 min-w-0">
                      <span className="w-8 text-center font-bold text-gray-500 shrink-0">
                        {ev.minute != null ? `${ev.minute}'` : '-'}
                      </span>
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ev.team.color }} />
                      {jerseyNum != null && (
                        <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-[9px] font-bold border border-gray-700 shrink-0">
                          #{jerseyNum}
                        </span>
                      )}
                      <span className="font-semibold text-gray-300 truncate">{ev.player.full_name || ev.player.username}</span>
                      {pairedAssist && (
                        <span className="text-purple-400 text-[10px] shrink-0">
                          ({assistJNum != null ? `#${assistJNum} ` : ''}{pairedAssist.player.full_name || pairedAssist.player.username})
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border shrink-0 ${
                        ev.event_type === 'goal' ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' :
                        ev.event_type === 'own_goal' ? 'bg-red-500/15 text-red-400 border-red-500/20' :
                        ev.event_type === 'yellow_card' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' :
                        ev.event_type === 'red_card' ? 'bg-red-500/15 text-red-400 border-red-500/20' :
                        ev.event_type === 'mvp' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                        'bg-gray-800 text-gray-400 border-gray-700'
                      }`}>
                        {allEventLabels[ev.event_type] || ev.event_type}
                      </span>
                    </div>
                    <button
                      onClick={() => setDeleteEventTarget({
                        id: ev.id,
                        label: `${ev.player.full_name || ev.player.username} - ${allEventLabels[ev.event_type] || ev.event_type}`,
                        eventType: ev.event_type,
                        minute: ev.minute,
                      })}
                      className="text-gray-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 shrink-0 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteEventTarget}
        onClose={() => setDeleteEventTarget(null)}
        onConfirm={handleDeleteEvent}
        title="Supprimer cet événement ?"
        description={
          deleteEventTarget?.eventType === 'goal'
            ? `Le but de "${deleteEventTarget.label}" et son assist associé seront supprimés.`
            : `L'événement "${deleteEventTarget?.label}" sera supprimé.`
        }
        loading={deleteEvent.isPending || deleteGoal.isPending}
      />
    </AdminLayout>
  );
};

export default AdminMatchEdit;
