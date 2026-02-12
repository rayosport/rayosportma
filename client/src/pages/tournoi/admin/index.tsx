import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useActiveLeague, useTeamsWithPlayers, useMatches, usePlayerConflicts, useStandings } from '@/hooks/use-tournoi';
import AdminLayout from '@/components/tournoi/AdminLayout';
import { Trophy, Users, Calendar, TrendingUp, Swords, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

const AdminDashboard = () => {
  const [, setLocation] = useLocation();
  const { data: league } = useActiveLeague();
  const { data: teams } = useTeamsWithPlayers(league?.id);
  const { data: matches } = useMatches(league?.id);
  const { data: conflicts } = usePlayerConflicts();
  const { data: standings } = useStandings(league?.id);

  useEffect(() => {
    document.title = 'Dashboard - Admin Tournoi';
  }, []);

  const completedCount = matches?.filter(m => m.status === 'completed').length || 0;
  const scheduledCount = matches?.filter(m => m.status === 'scheduled').length || 0;
  const liveCount = matches?.filter(m => m.status === 'live').length || 0;
  const totalPlayers = teams?.reduce((sum, t) => sum + t.team_players.length, 0) || 0;
  const totalGoals = matches?.reduce((sum, m) => sum + (m.home_score || 0) + (m.away_score || 0), 0) || 0;

  const recentMatches = matches
    ?.filter(m => m.status === 'completed')
    .slice(-3)
    .reverse() || [];

  const upcomingMatches = matches
    ?.filter(m => m.status === 'scheduled')
    .slice(0, 3) || [];

  const stats = [
    { label: 'Équipes', value: teams?.length || 0, icon: Users, color: 'from-blue-500/20 to-blue-600/5 border-blue-500/20', iconColor: 'text-blue-400', valueColor: 'text-blue-400' },
    { label: 'Joueurs', value: totalPlayers, icon: Users, color: 'from-violet-500/20 to-violet-600/5 border-violet-500/20', iconColor: 'text-violet-400', valueColor: 'text-violet-400' },
    { label: 'Matchs joués', value: completedCount, icon: Swords, color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20', iconColor: 'text-emerald-400', valueColor: 'text-emerald-400' },
    { label: 'Buts marqués', value: totalGoals, icon: TrendingUp, color: 'from-amber-500/20 to-amber-600/5 border-amber-500/20', iconColor: 'text-amber-400', valueColor: 'text-amber-400' },
  ];

  return (
    <AdminLayout title="Dashboard" subtitle={league ? `${league.name} · ${league.season}` : 'Aucune league active'}>
      <div className="space-y-6">
        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(stat => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-2xl border p-5 transition-all hover:scale-[1.02]`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
              <p className={`text-3xl font-black ${stat.valueColor}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {(liveCount > 0 || (conflicts && conflicts.length > 0) || !league) && (
          <div className="space-y-3">
            {!league && (
              <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-300">Aucune league active</p>
                  <p className="text-xs text-yellow-500/80 mt-0.5">Créez et activez une league pour commencer</p>
                </div>
                <button onClick={() => setLocation('/tournoi/admin/league')} className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-lg hover:bg-yellow-500/30 transition-colors">
                  Créer
                </button>
              </div>
            )}
            {liveCount > 0 && (
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-sm font-semibold text-green-300 flex-1">{liveCount} match{liveCount > 1 ? 's' : ''} en direct</p>
                <button onClick={() => setLocation('/tournoi/admin/matchs')} className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-lg hover:bg-green-500/30 transition-colors">
                  Voir
                </button>
              </div>
            )}
            {conflicts && conflicts.length > 0 && (
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-300">{conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} joueurs</p>
                  <p className="text-xs text-amber-500/80 mt-0.5">Doublons détectés lors de la synchronisation</p>
                </div>
                <button onClick={() => setLocation('/tournoi/admin/teams')} className="px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-lg hover:bg-amber-500/30 transition-colors">
                  Traiter
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Standings preview */}
          {standings && standings.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Classement</h3>
                <button onClick={() => window.open('/tournoi/classement', '_blank')} className="text-[10px] text-gray-500 hover:text-rayoblue font-medium transition-colors flex items-center gap-1">
                  Voir tout <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1">
                <div className="grid grid-cols-[2rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem] gap-1 text-[9px] font-semibold text-gray-600 uppercase tracking-wider px-2 pb-2">
                  <span>#</span><span>Équipe</span><span className="text-center">J</span><span className="text-center">V</span><span className="text-center">DB</span><span className="text-center">Pts</span>
                </div>
                {standings.slice(0, 6).map((s, i) => (
                  <div key={s.team_id} className={`grid grid-cols-[2rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem] gap-1 items-center px-2 py-2 rounded-lg ${i < 1 ? 'bg-rayoblue/10 border border-rayoblue/10' : 'hover:bg-gray-800/50'} transition-colors`}>
                    <span className={`text-xs font-bold ${i < 1 ? 'text-rayoblue' : 'text-gray-500'}`}>{i + 1}</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.team_color }} />
                      <span className="text-xs font-medium text-gray-300 truncate">{s.team_name}</span>
                    </div>
                    <span className="text-xs text-gray-500 text-center">{s.played}</span>
                    <span className="text-xs text-gray-500 text-center">{s.won}</span>
                    <span className="text-xs text-gray-500 text-center">{s.goal_difference > 0 ? '+' : ''}{s.goal_difference}</span>
                    <span className="text-xs font-bold text-white text-center">{s.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent & Upcoming matches */}
          <div className="space-y-6">
            {recentMatches.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Derniers résultats</h3>
                  <button onClick={() => setLocation('/tournoi/admin/matchs')} className="text-[10px] text-gray-500 hover:text-rayoblue font-medium transition-colors flex items-center gap-1">
                    Tous les matchs <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {recentMatches.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setLocation(`/tournoi/admin/match/${m.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 hover:bg-gray-800/70 border border-gray-800 hover:border-gray-700 transition-all text-left"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: m.home_team.color }} />
                        <span className="text-xs font-medium text-gray-300 truncate">{m.home_team.name}</span>
                      </div>
                      <div className="px-3 py-1 rounded-lg bg-gray-900 border border-gray-700">
                        <span className="text-sm font-black text-white">{m.home_score} - {m.away_score}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-xs font-medium text-gray-300 truncate">{m.away_team.name}</span>
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: m.away_team.color }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {upcomingMatches.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    Prochains matchs
                  </h3>
                </div>
                <div className="space-y-2">
                  {upcomingMatches.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-800">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: m.home_team.color }} />
                        <span className="text-xs font-medium text-gray-400 truncate">{m.home_team.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-600">vs</span>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-xs font-medium text-gray-400 truncate">{m.away_team.name}</span>
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: m.away_team.color }} />
                      </div>
                      {m.date && (
                        <span className="text-[10px] text-gray-600 shrink-0 ml-1">
                          {new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setLocation('/tournoi/admin/teams')}
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/40 border border-gray-800 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors">Gérer les équipes</p>
                <p className="text-[10px] text-gray-600">Ajouter joueurs & équipes</p>
              </div>
            </button>
            <button
              onClick={() => setLocation('/tournoi/admin/matchs')}
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/40 border border-gray-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors">Planifier un match</p>
                <p className="text-[10px] text-gray-600">Créer & saisir résultats</p>
              </div>
            </button>
            <button
              onClick={() => setLocation('/tournoi/admin/league')}
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/40 border border-gray-800 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                <Trophy className="w-5 h-5 text-violet-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors">Gérer la league</p>
                <p className="text-[10px] text-gray-600">Créer, activer, terminer</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
