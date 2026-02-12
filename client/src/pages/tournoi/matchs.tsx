import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useActiveLeague, useMatches } from '@/hooks/use-tournoi';
import TournoiHero from '@/components/tournoi/TournoiHero';
import TournoiNav from '@/components/tournoi/TournoiNav';
import MatchCard from '@/components/tournoi/MatchCard';
import Loader from '@/components/ui/Loader';
import { Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type StatusFilter = 'all' | 'scheduled' | 'completed' | 'live';

const TournoiMatchs = () => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const { data: league, isLoading: leagueLoading } = useActiveLeague();
  const { data: matches, isLoading: matchesLoading } = useMatches(league?.id);

  const liveCount = useMemo(() => matches?.filter(m => m.status === 'live').length || 0, [matches]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Matchs - Tournoi Ramadan - Rayo Sport';
  }, []);

  if (leagueLoading) return <Loader />;

  const filtered = matches?.filter(m => filter === 'all' || m.status === filter) || [];

  const matchdays = new Map<number, typeof filtered>();
  filtered.forEach(m => {
    const arr = matchdays.get(m.matchday) || [];
    arr.push(m);
    matchdays.set(m.matchday, arr);
  });
  const sortedMatchdays = Array.from(matchdays.entries()).sort((a, b) => a[0] - b[0]);

  const filters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'scheduled', label: t('tournoi_scheduled') },
    { value: 'live', label: t('tournoi_live') },
    { value: 'completed', label: t('tournoi_completed') },
  ];

  return (
    <main className="min-h-screen bg-gray-900">
      <TournoiHero league={league} compact liveCount={liveCount} />
      <TournoiNav liveCount={liveCount} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`relative px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-200 ${
                filter === f.value
                  ? 'text-white'
                  : 'bg-gray-800/60 text-gray-400 border border-gray-700/30 hover:border-rayoblue/30 hover:text-gray-200'
              }`}
            >
              {filter === f.value && (
                <motion.div
                  layoutId="matchFilterActive"
                  className="absolute inset-0 bg-rayoblue rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {f.label}
                {f.value === 'live' && liveCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-neongreen animate-pulse" />
                )}
              </span>
            </button>
          ))}
        </div>

        {matchesLoading ? (
          <div className="flex justify-center py-12"><Loader /></div>
        ) : sortedMatchdays.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="relative inline-block mb-4">
              <Calendar className="w-12 h-12 text-gray-600" />
              <div className="absolute inset-0 w-12 h-12 bg-rayoblue/10 rounded-full blur-xl" />
            </div>
            <p className="text-sm text-gray-500">{t('tournoi_no_matches')}</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {sortedMatchdays.map(([matchday, dayMatches]) => (
                <div key={matchday}>
                  {/* Matchday header */}
                  <div className="flex items-center gap-3 mb-2 px-1">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-rayoblue to-blue-600 text-white text-xs font-black shadow-sm shadow-rayoblue/20">
                      {matchday}
                    </span>
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      {t('tournoi_matchday')} {matchday}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-gray-700/50 to-transparent" />
                  </div>

                  {/* Matches list container */}
                  <div className="bg-gray-800/80 rounded-xl border border-gray-700/30 overflow-hidden divide-y divide-gray-700/30">
                    {dayMatches.map((match, i) => (
                      <MatchCard key={match.id} match={match} index={i} />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
  );
};

export default TournoiMatchs;
