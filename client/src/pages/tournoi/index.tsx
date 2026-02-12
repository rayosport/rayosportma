import { useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useActiveLeague, useStandings, useMatches, usePlayerStats, useTeams } from '@/hooks/use-tournoi';
import TournoiHero from '@/components/tournoi/TournoiHero';
import TournoiNav from '@/components/tournoi/TournoiNav';
import StandingsTable from '@/components/tournoi/StandingsTable';
import MatchCard from '@/components/tournoi/MatchCard';
import PlayerStatsRow from '@/components/tournoi/PlayerStatsRow';
import Loader from '@/components/ui/Loader';
import { Trophy, Calendar, Target, ArrowRight } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

const TournoiIndex = () => {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { data: league, isLoading: leagueLoading } = useActiveLeague();
  const { data: standings } = useStandings(league?.id);
  const { data: matches } = useMatches(league?.id);
  const { data: playerStats } = usePlayerStats(league?.id);
  const { data: teams } = useTeams(league?.id);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Tournoi Ramadan - Rayo Sport';
  }, []);

  const liveMatches = useMemo(() => matches?.filter(m => m.status === 'live') || [], [matches]);
  const completedMatches = useMemo(() => matches?.filter(m => m.status === 'completed') || [], [matches]);
  const scheduledMatches = useMemo(() => matches?.filter(m => m.status === 'scheduled') || [], [matches]);
  const lastMatch = completedMatches[completedMatches.length - 1];
  const nextMatch = scheduledMatches[0];
  const topScorers = useMemo(() => playerStats?.filter(p => p.goals > 0).slice(0, 3) || [], [playerStats]);

  const totalGoals = useMemo(() => {
    if (!playerStats) return 0;
    return playerStats.reduce((sum, p) => sum + p.goals + p.own_goals, 0);
  }, [playerStats]);

  const heroStats = useMemo(() => ({
    teams: teams?.length || 0,
    matches: completedMatches.length,
    goals: totalGoals,
  }), [teams, completedMatches, totalGoals]);

  if (leagueLoading) return <Loader />;

  return (
    <main className="min-h-screen bg-gray-900">
      <TournoiHero league={league} liveCount={liveMatches.length} stats={heroStats} />
      <TournoiNav liveCount={liveMatches.length} />

      {!league ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <Trophy className="w-12 h-12 text-gray-600 mb-4" />
          <h2 className="text-lg font-bold text-gray-400">{t('tournoi_no_league')}</h2>
          <p className="text-sm text-gray-500 mt-1">Le tournoi sera bientôt disponible</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* LIVE NOW banner */}
          {liveMatches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-xl bg-gradient-to-r from-jetblack via-gray-900 to-jetblack border border-neongreen/20 p-4 sm:p-5"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-neongreen/5 via-transparent to-rayoblue/5" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neongreen opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neongreen" />
                  </span>
                  <span className="text-xs font-bold text-neongreen uppercase tracking-wider">
                    En direct maintenant
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {liveMatches.map((match, i) => (
                    <div key={match.id} className="rounded-xl overflow-hidden border border-gray-700/30">
                      <MatchCard match={match} index={i} />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Standings Summary */}
          {standings && standings.length > 0 && (
            <AnimatedSection>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-5 bg-gradient-to-b from-rayoblue to-neongreen rounded-full" />
                  {t('tournoi_standings')}
                </h2>
                <button
                  onClick={() => setLocation('/tournoi/classement')}
                  className="text-xs text-rayoblue font-semibold hover:text-blue-400 flex items-center gap-1 group transition-colors"
                >
                  Voir tout <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
              <div className="bg-gray-800/80 rounded-xl border border-gray-700/30 overflow-hidden">
                <StandingsTable standings={standings} compact limit={5} />
              </div>
            </AnimatedSection>
          )}

          {/* Matches Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {nextMatch && (
              <AnimatedSection>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                  <span className="w-1 h-5 bg-neongreen rounded-full" />
                  Prochain match
                </h2>
                <div className="bg-gray-800/80 rounded-xl border border-gray-700/30 overflow-hidden">
                  <MatchCard match={nextMatch} />
                </div>
              </AnimatedSection>
            )}

            {lastMatch && (
              <AnimatedSection>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                  <span className="w-1 h-5 bg-gray-600 rounded-full" />
                  Dernier résultat
                </h2>
                <div className="bg-gray-800/80 rounded-xl border border-gray-700/30 overflow-hidden">
                  <MatchCard match={lastMatch} />
                </div>
              </AnimatedSection>
            )}
          </div>

          {/* Top Scorers */}
          {topScorers.length > 0 && (
            <AnimatedSection>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-5 bg-rayored rounded-full" />
                  {t('tournoi_top_scorers')}
                </h2>
                <button
                  onClick={() => setLocation('/tournoi/stats')}
                  className="text-xs text-rayoblue font-semibold hover:text-blue-400 flex items-center gap-1 group transition-colors"
                >
                  Voir tout <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
              <div className="bg-gray-800/80 rounded-xl border border-gray-700/30 overflow-hidden">
                {topScorers.map((p, i) => (
                  <PlayerStatsRow
                    key={p.player_id}
                    rank={i + 1}
                    index={i}
                    playerName={p.player_name}
                    teamName={p.team_name}
                    teamColor={p.team_color}
                    value={p.goals}
                  />
                ))}
              </div>
            </AnimatedSection>
          )}
        </div>
      )}
    </main>
  );
};

export default TournoiIndex;
