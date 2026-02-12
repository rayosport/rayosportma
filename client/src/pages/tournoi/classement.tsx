import { useEffect, useMemo } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useActiveLeague, useStandings, useMatches } from '@/hooks/use-tournoi';
import TournoiHero from '@/components/tournoi/TournoiHero';
import TournoiNav from '@/components/tournoi/TournoiNav';
import StandingsTable from '@/components/tournoi/StandingsTable';
import Loader from '@/components/ui/Loader';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

const TournoiClassement = () => {
  const { t } = useLanguage();
  const { data: league, isLoading: leagueLoading } = useActiveLeague();
  const { data: standings, isLoading: standingsLoading } = useStandings(league?.id);
  const { data: matches } = useMatches(league?.id);

  const liveCount = useMemo(() => matches?.filter(m => m.status === 'live').length || 0, [matches]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Classement - Tournoi Ramadan - Rayo Sport';
  }, []);

  if (leagueLoading) return <Loader />;

  const leader = standings?.[0];

  return (
    <main className="min-h-screen bg-gray-900">
      <TournoiHero league={league} compact liveCount={liveCount} />
      <TournoiNav liveCount={liveCount} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Leader highlight card */}
        {leader && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 relative overflow-hidden rounded-xl bg-gray-800/80 border border-yellow-500/20 p-5"
          >
            <div className="absolute inset-0 opacity-[0.06]">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }} />
            </div>
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-yellow-400/10 rounded-full blur-[80px]" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/20">
                  <Trophy className="w-6 h-6 text-yellow-900" />
                </div>
                <div>
                  <p className="text-[10px] text-yellow-400/80 font-semibold uppercase tracking-wider">Leader</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="w-4 h-4 rounded-full ring-2 ring-white/20 shadow-sm"
                      style={{ backgroundColor: leader.team_color }}
                    />
                    <h3 className="text-xl font-black text-white">{leader.team_name}</h3>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-white">{leader.points}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Points</p>
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span>{leader.played} matchs</span>
              <span className="text-gray-600">|</span>
              <span>{leader.won}V {leader.drawn}N {leader.lost}D</span>
              <span className="text-gray-600">|</span>
              <span className={leader.goal_difference > 0 ? 'text-neongreen' : ''}>
                {leader.goal_difference > 0 ? '+' : ''}{leader.goal_difference} diff
              </span>
            </div>
          </motion.div>
        )}

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2"
        >
          <span className="w-1 h-5 bg-gradient-to-b from-rayoblue to-neongreen rounded-full" />
          {t('tournoi_standings')}
        </motion.h2>

        {standingsLoading ? (
          <div className="flex justify-center py-12"><Loader /></div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="bg-gray-800/80 rounded-xl border border-gray-700/30 overflow-hidden"
          >
            <StandingsTable standings={standings || []} />
          </motion.div>
        )}

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-5 flex flex-wrap gap-2"
        >
          {[
            { key: t('tournoi_played'), label: 'Matchs joués', color: 'bg-gray-800/60 text-gray-400 border border-gray-700/30' },
            { key: t('tournoi_won'), label: 'Victoires', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
            { key: t('tournoi_drawn'), label: 'Nuls', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
            { key: t('tournoi_lost'), label: 'Défaites', color: 'bg-red-500/10 text-red-400 border border-red-500/20' },
            { key: t('tournoi_goal_diff'), label: 'Différence', color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
            { key: t('tournoi_points'), label: '3V / 1N / 0D', color: 'bg-rayoblue/10 text-rayoblue border border-rayoblue/20' },
          ].map(item => (
            <span key={item.key} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${item.color}`}>
              <strong>{item.key}</strong> = {item.label}
            </span>
          ))}
        </motion.div>
      </div>
    </main>
  );
};

export default TournoiClassement;
