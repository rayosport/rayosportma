import { useEffect, useMemo } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useActiveLeague, useTeamWithPlayers, useStandings, useMatches, usePlayerStats } from '@/hooks/use-tournoi';
import TournoiNav from '@/components/tournoi/TournoiNav';
import MatchCard from '@/components/tournoi/MatchCard';
import Loader from '@/components/ui/Loader';
import { ArrowLeft, Trophy, Users, Calendar, Star, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';

const posStyle = (pos: number) => {
  if (pos === 1) return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900';
  if (pos === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700';
  if (pos === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-amber-100';
  return 'bg-gray-200 text-gray-600';
};

const tooltipStyle = {
  backgroundColor: 'rgba(31, 41, 55, 0.95)',
  border: '1px solid #4b5563',
  borderRadius: '8px',
  padding: '8px 12px',
  color: '#fff',
};

const TournoiTeamDetail = () => {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/tournoi/team/:id');
  const teamId = params?.id;

  const { data: league } = useActiveLeague();
  const { data: teamData, isLoading: teamLoading } = useTeamWithPlayers(teamId);
  const { data: standings } = useStandings(league?.id);
  const { data: matches } = useMatches(league?.id);
  const { data: playerStats } = usePlayerStats(league?.id);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (teamData) document.title = `${teamData.name} - Tournoi Ramadan - Rayo Sport`;
  }, [teamData]);

  const sortedStandings = useMemo(() => {
    if (!standings) return [];
    return [...standings].sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference || b.goals_for - a.goals_for);
  }, [standings]);

  const position = useMemo(() => {
    const idx = sortedStandings.findIndex(s => s.team_id === teamId);
    return idx >= 0 ? idx + 1 : 0;
  }, [sortedStandings, teamId]);

  const teamStanding = sortedStandings.find(s => s.team_id === teamId);

  const { matchdayData, pointsProgression, form, streak, wins, draws, losses } = useMemo(() => {
    if (!matches || !teamId) return { matchdayData: [], pointsProgression: [], form: [], streak: '', wins: 0, draws: 0, losses: 0 };

    const teamMatches = matches.filter(m => m.home_team_id === teamId || m.away_team_id === teamId);
    const completed = teamMatches.filter(m => m.status === 'completed');

    const mdData = completed.map(m => {
      const isHome = m.home_team_id === teamId;
      const scored = isHome ? m.home_score : m.away_score;
      const conceded = isHome ? m.away_score : m.home_score;
      const result = scored > conceded ? 'W' : scored < conceded ? 'L' : 'D';
      const pts = result === 'W' ? 3 : result === 'D' ? 1 : 0;
      const opponent = isHome ? m.away_team : m.home_team;
      return { matchday: m.matchday, scored, conceded, result, pts, opponent, matchId: m.id };
    }).sort((a, b) => a.matchday - b.matchday);

    let cumPts = 0;
    const progression = mdData.map(md => {
      cumPts += md.pts;
      return { ...md, cumulativePoints: cumPts, label: `J${md.matchday}` };
    });

    const formData = mdData.slice(-5);

    let streakText = '';
    if (mdData.length > 0) {
      const lastResult = mdData[mdData.length - 1].result;
      let count = 0;
      for (let i = mdData.length - 1; i >= 0; i--) {
        if (mdData[i].result === lastResult) count++;
        else break;
      }
      const label = lastResult === 'W' ? 'victoire' : lastResult === 'D' ? 'nul' : 'défaite';
      const plural = count > 1 ? 's' : '';
      streakText = `${count} ${label}${plural} consécutive${plural}`;
    }

    return {
      matchdayData: mdData,
      pointsProgression: progression,
      form: formData,
      streak: streakText,
      wins: mdData.filter(m => m.result === 'W').length,
      draws: mdData.filter(m => m.result === 'D').length,
      losses: mdData.filter(m => m.result === 'L').length,
    };
  }, [matches, teamId]);

  const teamMatchesSorted = useMemo(() => {
    if (!matches || !teamId) return [];
    return matches
      .filter(m => (m.home_team_id === teamId || m.away_team_id === teamId) && m.status !== 'scheduled')
      .sort((a, b) => b.matchday - a.matchday);
  }, [matches, teamId]);

  const teamPlayerStatsData = useMemo(() => {
    if (!playerStats || !teamData) return [];
    const statsMap = new Map(
      playerStats
        .filter(ps => ps.team_name === teamData.name)
        .map(ps => [ps.player_id, ps])
    );

    const roster = teamData.team_players || [];
    const merged = roster.map(tp => {
      const ps = statsMap.get(tp.player_id);
      return {
        playerId: tp.player_id,
        name: tp.player.full_name || tp.player.username,
        jersey: tp.jersey_number,
        goals: ps ? Number(ps.goals) : 0,
        assists: ps ? Number(ps.assists) : 0,
        yellowCards: ps ? Number(ps.yellow_cards) : 0,
        redCards: ps ? Number(ps.red_cards) : 0,
        mvp: ps ? Number(ps.mvp_count) : 0,
      };
    });
    return merged.sort((a, b) => b.goals - a.goals || b.assists - a.assists);
  }, [playerStats, teamData]);

  const pieData = useMemo(() => [
    { name: 'V', value: wins, fill: '#10b981' },
    { name: 'N', value: draws, fill: '#f59e0b' },
    { name: 'D', value: losses, fill: '#ef4444' },
  ], [wins, draws, losses]);

  const hasChartData = matchdayData.length > 0;

  if (teamLoading || !teamData) return <Loader />;

  const team = teamData;
  const totalMatches = wins + draws + losses;

  return (
    <main className="min-h-screen bg-gray-900">
      {/* ===== HERO HEADER ===== */}
      <section className="pt-16 pb-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-jetblack via-gray-900 to-jetblack" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{ background: `radial-gradient(circle at 50% 80%, ${team.color}60, transparent 60%)` }}
        />
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }} />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setLocation('/tournoi/classement')}
            className="absolute left-4 top-2 flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-xs bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Classement
          </motion.button>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="mb-4"
          >
            <div
              className="w-16 h-16 rounded-full mx-auto ring-2 ring-white/20 shadow-lg"
              style={{ backgroundColor: team.color, boxShadow: `0 0 40px ${team.color}50` }}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-2xl font-black text-white mb-2"
          >
            {team.name}
          </motion.h1>

          {position > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${posStyle(position)}`}>
                <Trophy className="w-3 h-3" />
                #{position}
              </span>
            </motion.div>
          )}

          {teamStanding && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
            >
              {[
                { label: 'MJ', value: teamStanding.played },
                { label: 'V', value: teamStanding.won, color: 'text-emerald-400' },
                { label: 'N', value: teamStanding.drawn, color: 'text-amber-400' },
                { label: 'D', value: teamStanding.lost, color: 'text-red-400' },
                { label: 'BM', value: teamStanding.goals_for },
                { label: 'BE', value: teamStanding.goals_against },
                { label: 'Pts', value: teamStanding.points, color: 'text-rayoblue', bold: true },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center bg-white/5 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/5 min-w-[44px]">
                  <span className={`text-base font-black ${stat.color || 'text-white'}`}>{stat.value}</span>
                  <span className="text-[9px] text-gray-500 uppercase font-semibold tracking-wider">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-900 to-transparent" />
      </section>

      <TournoiNav />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-4">

        {/* ===== ROW 1: Forme récente (full width, compact) ===== */}
        {form.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gray-800/80 rounded-xl p-3 sm:p-4 border border-gray-700/30"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Forme récente</span>
                {streak && (
                  <span className="text-[10px] text-gray-400 ml-1">— {streak}</span>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {form.map((m, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-gray-900/50 rounded-lg px-2.5 py-1.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                      m.result === 'W' ? 'bg-emerald-500' : m.result === 'D' ? 'bg-amber-400' : 'bg-red-500'
                    }`}>
                      {m.result === 'W' ? 'V' : m.result === 'D' ? 'N' : 'D'}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white font-bold leading-none">{m.scored}-{m.conceded}</span>
                      <span className="text-[8px] text-gray-500 truncate max-w-[60px]">{m.opponent?.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* ===== ROW 2: Charts (3 cols desktop, stack mobile) ===== */}
        {hasChartData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {/* Goals scored */}
            <div className="bg-gray-800/80 rounded-xl p-3 border border-gray-700/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-emerald-400 font-semibold">Buts marqués</span>
                <span className="text-[10px] text-gray-500 font-medium">
                  moy. {(matchdayData.reduce((s, m) => s + m.scored, 0) / matchdayData.length).toFixed(1)}
                </span>
              </div>
              <div className="h-28 sm:h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={matchdayData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="goalsForGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.2} />
                    <XAxis dataKey="matchday" stroke="#9ca3af" fontSize={9} tick={{ fill: '#6b7280' }} tickFormatter={(v: number) => `J${v}`} height={18} />
                    <YAxis stroke="#9ca3af" fontSize={9} tick={{ fill: '#6b7280' }} allowDecimals={false} width={25} />
                    <RechartsTooltip contentStyle={tooltipStyle} labelStyle={{ color: '#d1d5db', marginBottom: '4px' }} formatter={(value: number) => [value, 'Marqués']} labelFormatter={(v: number) => `Journée ${v}`} />
                    <Area type="monotone" dataKey="scored" stroke="#10b981" strokeWidth={2} fill="url(#goalsForGrad)" dot={{ fill: '#10b981', r: 3, strokeWidth: 2, stroke: '#1f2937' }} activeDot={{ r: 5, fill: '#34d399' }} animationDuration={800} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Goals conceded */}
            <div className="bg-gray-800/80 rounded-xl p-3 border border-gray-700/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-red-400 font-semibold">Buts encaissés</span>
                <span className="text-[10px] text-gray-500 font-medium">
                  moy. {(matchdayData.reduce((s, m) => s + m.conceded, 0) / matchdayData.length).toFixed(1)}
                </span>
              </div>
              <div className="h-28 sm:h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={matchdayData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="goalsConcGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.2} />
                    <XAxis dataKey="matchday" stroke="#9ca3af" fontSize={9} tick={{ fill: '#6b7280' }} tickFormatter={(v: number) => `J${v}`} height={18} />
                    <YAxis stroke="#9ca3af" fontSize={9} tick={{ fill: '#6b7280' }} allowDecimals={false} width={25} />
                    <RechartsTooltip contentStyle={tooltipStyle} labelStyle={{ color: '#d1d5db', marginBottom: '4px' }} formatter={(value: number) => [value, 'Encaissés']} labelFormatter={(v: number) => `Journée ${v}`} />
                    <Area type="monotone" dataKey="conceded" stroke="#ef4444" strokeWidth={2} fill="url(#goalsConcGrad)" dot={{ fill: '#ef4444', r: 3, strokeWidth: 2, stroke: '#1f2937' }} activeDot={{ r: 5, fill: '#f87171' }} animationDuration={800} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Points progression */}
            <div className="bg-gray-800/80 rounded-xl p-3 border border-gray-700/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-blue-400 font-semibold">Points cumulés</span>
                <span className="text-[10px] text-gray-500 font-medium">
                  {pointsProgression.length > 0 ? pointsProgression[pointsProgression.length - 1].cumulativePoints : 0} pts
                </span>
              </div>
              <div className="h-28 sm:h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pointsProgression} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pointsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.2} />
                    <XAxis dataKey="matchday" stroke="#9ca3af" fontSize={9} tick={{ fill: '#6b7280' }} tickFormatter={(v: number) => `J${v}`} height={18} />
                    <YAxis stroke="#9ca3af" fontSize={9} tick={{ fill: '#6b7280' }} allowDecimals={false} width={25} domain={['dataMin - 1', 'dataMax + 1']} />
                    <RechartsTooltip contentStyle={tooltipStyle} labelStyle={{ color: '#d1d5db', marginBottom: '4px' }} formatter={(value: number) => [value, 'Points']} labelFormatter={(v: number) => `Journée ${v}`} />
                    <Area type="monotone" dataKey="cumulativePoints" stroke="#3b82f6" strokeWidth={2} fill="url(#pointsGrad)" dot={{ fill: '#3b82f6', r: 3, strokeWidth: 2, stroke: '#1f2937' }} activeDot={{ r: 5, fill: '#60a5fa' }} animationDuration={800} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== ROW 3: PieChart + Joueurs (side by side) ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">

          {/* Pie: V/N/D */}
          {hasChartData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-gray-800/80 rounded-xl p-3 border border-gray-700/30 flex flex-col items-center justify-center"
            >
              <span className="text-xs font-bold text-white mb-1">Résultats</span>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie
                    data={pieData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    dataKey="value"
                    paddingAngle={3}
                    strokeWidth={0}
                    animationDuration={800}
                  >
                    {pieData.filter(d => d.value > 0).map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-1">
                {pieData.map(d => {
                  const pct = totalMatches > 0 ? Math.round((d.value / totalMatches) * 100) : 0;
                  return (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-xs font-black text-white">{d.value}</span>
                      <span className="text-[10px] text-gray-500">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Joueurs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/80 rounded-xl border border-gray-700/30 overflow-hidden"
          >
            <div className="px-3 py-2.5 border-b border-gray-700/50 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Effectif</span>
              <span className="text-[10px] text-gray-500 ml-auto">{teamPlayerStatsData.length} joueurs</span>
            </div>
            {teamPlayerStatsData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700/50 text-[10px] uppercase tracking-wider text-gray-500 font-semibold bg-gray-900/30">
                      <th className="text-center py-2 w-10">#</th>
                      <th className="text-left py-2">Joueur</th>
                      <th className="text-center py-2 w-10" title="Buts">&#9917;</th>
                      <th className="text-center py-2 w-10" title="Assists">&#127919;</th>
                      <th className="text-center py-2 w-10 hidden sm:table-cell" title="Cartons jaunes">
                        <div className="w-2.5 h-3 rounded-[1px] bg-yellow-400 mx-auto" />
                      </th>
                      <th className="text-center py-2 w-10 hidden sm:table-cell" title="Cartons rouges">
                        <div className="w-2.5 h-3 rounded-[1px] bg-red-500 mx-auto" />
                      </th>
                      <th className="text-center py-2 w-10" title="MVP">
                        <Star className="w-3.5 h-3.5 text-amber-400 mx-auto fill-amber-400" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamPlayerStatsData.map((p, idx) => (
                      <motion.tr
                        key={p.playerId}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + idx * 0.02 }}
                        className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                      >
                        <td className="text-center py-2">
                          {p.jersey != null ? (
                            <span className="inline-flex items-center justify-center w-5.5 h-5.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: team.color }}>
                              {p.jersey}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-600">-</span>
                          )}
                        </td>
                        <td className="py-2 text-sm font-semibold text-gray-200">{p.name}</td>
                        <td className={`text-center py-2 font-bold ${p.goals > 0 ? 'text-white' : 'text-gray-600'}`}>{p.goals}</td>
                        <td className={`text-center py-2 font-bold ${p.assists > 0 ? 'text-white' : 'text-gray-600'}`}>{p.assists}</td>
                        <td className={`text-center py-2 hidden sm:table-cell font-bold ${p.yellowCards > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>{p.yellowCards}</td>
                        <td className={`text-center py-2 hidden sm:table-cell font-bold ${p.redCards > 0 ? 'text-red-400' : 'text-gray-600'}`}>{p.redCards}</td>
                        <td className={`text-center py-2 font-bold ${p.mvp > 0 ? 'text-amber-400' : 'text-gray-600'}`}>{p.mvp}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-6 text-sm text-gray-500">Aucun joueur dans cette équipe</p>
            )}
          </motion.div>
        </div>

        {/* ===== ROW 4: Résultats matchs (full width) ===== */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Résultats</span>
            <span className="text-[10px] text-gray-500">({teamMatchesSorted.length} matchs)</span>
          </div>
          {teamMatchesSorted.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {teamMatchesSorted.map((match, i) => (
                <div key={match.id} className="bg-gray-800/80 rounded-xl overflow-hidden border border-gray-700/30">
                  <MatchCard match={match} index={i} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800/80 rounded-xl border border-gray-700/30 p-8 text-center">
              <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucun match joué</p>
            </div>
          )}
        </motion.section>

      </div>
    </main>
  );
};

export default TournoiTeamDetail;
