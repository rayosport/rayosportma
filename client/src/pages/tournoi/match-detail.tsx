import { useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useMatch, useMatchEvents, useTeamWithPlayers } from '@/hooks/use-tournoi';
import TournoiNav from '@/components/tournoi/TournoiNav';
import MatchEventTimeline from '@/components/tournoi/MatchEventTimeline';
import Loader from '@/components/ui/Loader';
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const TournoiMatchDetail = () => {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/tournoi/match/:id');
  const matchId = params?.id;

  const { data: match, isLoading: matchLoading } = useMatch(matchId);
  const { data: events } = useMatchEvents(matchId);
  const { data: homeTeamData } = useTeamWithPlayers(match?.home_team_id);
  const { data: awayTeamData } = useTeamWithPlayers(match?.away_team_id);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Match - Tournoi Ramadan - Rayo Sport';
  }, []);

  if (matchLoading || !match) return <Loader />;

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Score Header with team color gradient wings */}
      <section className="pt-16 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-jetblack via-gray-900 to-jetblack" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            background: `linear-gradient(to right, ${match.home_team.color}33, transparent 30%, transparent 70%, ${match.away_team.color}33)`
          }}
        />
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setLocation('/tournoi/matchs')}
            className="absolute left-4 top-2 flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-xs bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Retour
          </motion.button>

          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-block px-3 py-0.5 rounded-full bg-white/10 text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-5 backdrop-blur-sm border border-white/5"
          >
            {t('tournoi_matchday')} {match.matchday}
          </motion.span>

          {/* Teams + Score */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-8 px-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="flex-1 text-right min-w-0 overflow-hidden"
            >
              <div className="flex items-center justify-end gap-1.5 sm:gap-2 md:gap-3">
                <span className="text-white font-bold text-xs sm:text-sm md:text-lg truncate max-w-full">
                  {match.home_team.name}
                </span>
                {match.home_team.logo_url ? (
                  <img src={match.home_team.logo_url} alt={match.home_team.name} className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex-shrink-0 object-contain" style={{ filter: `drop-shadow(0 0 10px ${match.home_team.color}40)` }} />
                ) : (
                  <span
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex-shrink-0 ring-2 ring-white/20 shadow-lg"
                    style={{
                      backgroundColor: match.home_team.color,
                      boxShadow: `0 0 20px ${match.home_team.color}40`
                    }}
                  />
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.4, type: 'spring' }}
              className="flex-shrink-0"
            >
              {match.status === 'scheduled' ? (
                <span className="text-gray-500 font-bold text-base sm:text-xl bg-white/5 backdrop-blur-sm rounded-xl px-3 sm:px-5 py-2 border border-white/10">VS</span>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-3 sm:px-5 py-2 sm:py-3 border border-white/10">
                  <span className={`text-2xl sm:text-3xl md:text-4xl font-black transition-colors ${
                    match.home_score >= match.away_score ? 'text-white' : 'text-gray-500'
                  }`}>
                    {match.home_score}
                  </span>
                  <span className="text-gray-500 text-xs sm:text-sm font-bold">:</span>
                  <span className={`text-2xl sm:text-3xl md:text-4xl font-black transition-colors ${
                    match.away_score >= match.home_score ? 'text-white' : 'text-gray-500'
                  }`}>
                    {match.away_score}
                  </span>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="flex-1 text-left min-w-0 overflow-hidden"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                {match.away_team.logo_url ? (
                  <img src={match.away_team.logo_url} alt={match.away_team.name} className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex-shrink-0 object-contain" style={{ filter: `drop-shadow(0 0 10px ${match.away_team.color}40)` }} />
                ) : (
                  <span
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex-shrink-0 ring-2 ring-white/20 shadow-lg"
                    style={{
                      backgroundColor: match.away_team.color,
                      boxShadow: `0 0 20px ${match.away_team.color}40`
                    }}
                  />
                )}
                <span className="text-white font-bold text-xs sm:text-sm md:text-lg truncate max-w-full">
                  {match.away_team.name}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Match info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-5 flex items-center justify-center gap-4 text-[11px] text-gray-500"
          >
            {match.date && (
              <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full">
                <Calendar className="w-3 h-3" />
                {new Date(match.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                {match.time && ` · ${match.time.slice(0, 5)}`}
              </span>
            )}
            {match.location && (
              <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full">
                <MapPin className="w-3 h-3" />
                {match.location}
              </span>
            )}
          </motion.div>

          {/* Live badge */}
          {match.status === 'live' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neongreen/20 text-neongreen border border-neongreen/30 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neongreen opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-neongreen" />
                </span>
                {t('tournoi_live')}
              </span>
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-900 to-transparent" />
      </section>

      <TournoiNav />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Events Timeline */}
        {events && events.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-rayoblue to-neongreen rounded-full" />
              {t('tournoi_events')}
            </h3>
            <div className="bg-gray-800/80 rounded-xl border border-gray-700/30 p-4">
              <MatchEventTimeline
                events={events}
                homeTeamId={match.home_team_id}
                homeTeamPlayers={homeTeamData?.team_players}
                awayTeamPlayers={awayTeamData?.team_players}
              />
            </div>
          </motion.section>
        )}

        {/* Lineups */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            {t('tournoi_lineup')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Home team */}
            <div className="bg-gray-800/80 rounded-xl border border-gray-700/30 overflow-hidden">
              <div
                className="h-1 w-full"
                style={{ backgroundColor: match.home_team.color }}
              />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700/50">
                  {match.home_team.logo_url ? (
                    <img src={match.home_team.logo_url} alt={match.home_team.name} className="w-5 h-5 object-contain" />
                  ) : (
                    <span
                      className="w-4 h-4 rounded-full ring-1 ring-white/10 shadow-sm"
                      style={{ backgroundColor: match.home_team.color }}
                    />
                  )}
                  <span className="text-xs font-bold text-white">{match.home_team.name}</span>
                </div>
                {homeTeamData?.team_players && homeTeamData.team_players.length > 0 ? (
                  <div className="space-y-2">
                    {homeTeamData.team_players.map((tp, i) => (
                      <motion.div
                        key={tp.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.03 }}
                        className="flex items-center gap-2.5 text-xs"
                      >
                        {tp.jersey_number != null && (
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: match.home_team.color }}
                          >
                            {tp.jersey_number}
                          </span>
                        )}
                        <span className="text-gray-300 truncate">
                          {tp.player.full_name || tp.player.username}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500">Composition non disponible</p>
                )}
              </div>
            </div>

            {/* Away team */}
            <div className="bg-gray-800/80 rounded-xl border border-gray-700/30 overflow-hidden">
              <div
                className="h-1 w-full"
                style={{ backgroundColor: match.away_team.color }}
              />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700/50">
                  {match.away_team.logo_url ? (
                    <img src={match.away_team.logo_url} alt={match.away_team.name} className="w-5 h-5 object-contain" />
                  ) : (
                    <span
                      className="w-4 h-4 rounded-full ring-1 ring-white/10 shadow-sm"
                      style={{ backgroundColor: match.away_team.color }}
                    />
                  )}
                  <span className="text-xs font-bold text-white">{match.away_team.name}</span>
                </div>
                {awayTeamData?.team_players && awayTeamData.team_players.length > 0 ? (
                  <div className="space-y-2">
                    {awayTeamData.team_players.map((tp, i) => (
                      <motion.div
                        key={tp.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.03 }}
                        className="flex items-center gap-2.5 text-xs"
                      >
                        {tp.jersey_number != null && (
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: match.away_team.color }}
                          >
                            {tp.jersey_number}
                          </span>
                        )}
                        <span className="text-gray-300 truncate">
                          {tp.player.full_name || tp.player.username}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500">Composition non disponible</p>
                )}
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
};

export default TournoiMatchDetail;
