import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useActiveLeague, usePlayerStats, useMatches } from '@/hooks/use-tournoi';
import TournoiHero from '@/components/tournoi/TournoiHero';
import TournoiNav from '@/components/tournoi/TournoiNav';
import PlayerStatsRow from '@/components/tournoi/PlayerStatsRow';
import Loader from '@/components/ui/Loader';
import { Target, Star, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type StatsTab = 'scorers' | 'assists' | 'cards' | 'mvp';

function Podium({ players }: { players: { name: string; team: string; value: number; color: string }[] }) {
  if (players.length < 1) return null;

  const podiumOrder = players.length >= 3
    ? [players[1], players[0], players[2]]
    : players.length === 2
    ? [players[1], players[0]]
    : [players[0]];
  const heights = ['h-20', 'h-28', 'h-16'];
  const podiumHeights = players.length >= 3
    ? [heights[0], heights[1], heights[2]]
    : players.length === 2
    ? [heights[0], heights[1]]
    : [heights[1]];
  const ranks = players.length >= 3 ? [2, 1, 3] : players.length === 2 ? [2, 1] : [1];
  const rankColors = ['', 'from-yellow-400 to-amber-500', 'from-gray-300 to-gray-400', 'from-amber-600 to-amber-700'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-end justify-center gap-3 sm:gap-4 mb-8 pt-4"
    >
      {podiumOrder.map((player, i) => (
        <motion.div
          key={player.name}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="text-center">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mx-auto mb-1.5 ring-2 ring-white/20 shadow-lg"
              style={{
                backgroundColor: player.color,
                boxShadow: ranks[i] === 1 ? `0 0 20px ${player.color}60` : undefined
              }}
            />
            <p className={`font-bold text-gray-200 truncate max-w-[90px] sm:max-w-[110px] ${ranks[i] === 1 ? 'text-sm' : 'text-xs'}`}>
              {player.name}
            </p>
            <p className="text-[9px] text-gray-500 truncate max-w-[90px] sm:max-w-[110px]">{player.team}</p>
          </div>

          <div className={`w-20 sm:w-24 ${podiumHeights[i]} rounded-t-xl bg-gradient-to-t ${rankColors[ranks[i]]} flex flex-col items-center justify-start pt-2 relative overflow-hidden`}>
            <span className="text-xl sm:text-2xl font-black text-white/90">{player.value}</span>
            <span className="absolute bottom-2 text-[10px] font-bold text-white/50">#{ranks[i]}</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

const TournoiStats = () => {
  const { t } = useLanguage();
  const [tab, setTab] = useState<StatsTab>('scorers');
  const { data: league, isLoading: leagueLoading } = useActiveLeague();
  const { data: playerStats, isLoading: statsLoading } = usePlayerStats(league?.id);
  const { data: matches } = useMatches(league?.id);

  const liveCount = useMemo(() => matches?.filter(m => m.status === 'live').length || 0, [matches]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Statistiques - Tournoi Ramadan - Rayo Sport';
  }, []);

  if (leagueLoading) return <Loader />;

  const tabs: { value: StatsTab; label: string; icon: React.ReactNode }[] = [
    { value: 'scorers', label: t('tournoi_top_scorers'), icon: <Target className="w-3.5 h-3.5" /> },
    { value: 'assists', label: t('tournoi_top_assists'), icon: <span className="text-xs">&#127919;</span> },
    { value: 'cards', label: t('tournoi_cards'), icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    { value: 'mvp', label: t('tournoi_mvp'), icon: <Star className="w-3.5 h-3.5" /> },
  ];

  const getSortedStats = () => {
    if (!playerStats) return [];
    switch (tab) {
      case 'scorers':
        return playerStats.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals);
      case 'assists':
        return playerStats.filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists);
      case 'cards':
        return playerStats.filter(p => p.yellow_cards > 0 || p.red_cards > 0)
          .sort((a, b) => (b.red_cards * 10 + b.yellow_cards) - (a.red_cards * 10 + a.yellow_cards));
      case 'mvp':
        return playerStats.filter(p => p.mvp_count > 0).sort((a, b) => b.mvp_count - a.mvp_count);
    }
  };

  const getValue = (p: typeof playerStats extends (infer U)[] | undefined ? U : never) => {
    switch (tab) {
      case 'scorers': return p.goals;
      case 'assists': return p.assists;
      case 'cards': return p.yellow_cards + p.red_cards;
      case 'mvp': return p.mvp_count;
    }
  };

  const sorted = getSortedStats();

  const podiumPlayers = sorted.slice(0, 3).map(p => ({
    name: p.player_name,
    team: p.team_name,
    value: getValue(p),
    color: p.team_color,
  }));

  return (
    <main className="min-h-screen bg-gray-900">
      <TournoiHero league={league} compact liveCount={liveCount} />
      <TournoiNav liveCount={liveCount} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab selector */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-200 ${
                tab === t.value
                  ? 'text-white'
                  : 'bg-gray-800/60 text-gray-400 border border-gray-700/30 hover:border-rayoblue/30 hover:text-gray-200'
              }`}
            >
              {tab === t.value && (
                <motion.div
                  layoutId="statsTabActive"
                  className="absolute inset-0 bg-rayoblue rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {t.icon}
                {t.label}
              </span>
            </button>
          ))}
        </div>

        {statsLoading ? (
          <div className="flex justify-center py-12"><Loader /></div>
        ) : sorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="relative inline-block mb-4">
              {tab === 'scorers' && <Target className="w-12 h-12 text-gray-600" />}
              {tab === 'assists' && <span className="text-4xl opacity-30">&#127919;</span>}
              {tab === 'cards' && <AlertTriangle className="w-12 h-12 text-gray-600" />}
              {tab === 'mvp' && <Star className="w-12 h-12 text-gray-600" />}
            </div>
            <p className="text-sm text-gray-500">Aucune statistique disponible</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {/* Podium for top 3 */}
              {podiumPlayers.length >= 2 && tab !== 'cards' && (
                <Podium players={podiumPlayers} />
              )}

              {/* Full stats list */}
              <div className="bg-gray-800/80 rounded-xl border border-gray-700/30 overflow-hidden">
                {sorted.map((p, i) => {
                  if (tab === 'cards') {
                    return (
                      <motion.div
                        key={p.player_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                        className="flex items-center justify-between py-3 px-3 border-b border-gray-700/30 last:border-0 hover:bg-gray-700/20 transition-colors"
                        style={{ borderLeft: `3px solid ${p.team_color}` }}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold flex-shrink-0 ${
                            i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900 shadow-sm shadow-yellow-400/30'
                            : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 shadow-sm'
                            : i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-amber-100 shadow-sm'
                            : 'bg-gray-700 text-gray-400'
                          }`}>
                            {i + 1}
                          </span>
                          <span className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-white/10 shadow-sm" style={{ backgroundColor: p.team_color }} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-200 truncate">{p.player_name}</p>
                            <p className="text-[10px] text-gray-500 truncate">{p.team_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {p.yellow_cards > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-4 rounded-[2px] bg-yellow-400 shadow-sm shadow-yellow-400/30" />
                              <span className="text-xs font-bold text-gray-300">{p.yellow_cards}</span>
                            </div>
                          )}
                          {p.red_cards > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-4 rounded-[2px] bg-red-500 shadow-sm shadow-red-500/30" />
                              <span className="text-xs font-bold text-gray-300">{p.red_cards}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <PlayerStatsRow
                      key={p.player_id}
                      rank={i + 1}
                      index={i}
                      playerName={p.player_name}
                      teamName={p.team_name}
                      teamColor={p.team_color}
                      value={getValue(p)}
                    />
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
  );
};

export default TournoiStats;
