import { useEffect, useMemo, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useMatch, useMatchEvents, useMatchLineups } from '@/hooks/use-tournoi';
import TournoiNav from '@/components/tournoi/TournoiNav';
import MatchEventTimeline from '@/components/tournoi/MatchEventTimeline';
import Loader from '@/components/ui/Loader';
import { ArrowLeft, Calendar, MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Team } from '@/lib/tournoi-types';

type TabId = 'resume' | 'lineup' | 'events';

function TeamBadge({ team, color, size = 'md' }: { team: Team; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';
  if (team.logo_url)
    return <img src={team.logo_url} alt={team.name} className={`${cls} object-contain flex-shrink-0`} style={{ filter: `drop-shadow(0 0 8px ${color}60)` }} />;
  return <span className={`${cls} rounded-full flex-shrink-0 ring-2 ring-white/20`} style={{ backgroundColor: color, boxShadow: `0 0 20px ${color}50` }} />;
}

const TournoiMatchDetail = () => {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/tournoi/match/:id');
  const matchId = params?.id;
  const [activeTab, setActiveTab] = useState<TabId>('resume');

  const { data: match, isLoading: matchLoading } = useMatch(matchId);
  const { data: events } = useMatchEvents(matchId);
  const { data: lineups } = useMatchLineups(matchId);

  const homeLineup = useMemo(() => lineups?.filter(l => l.team_id === match?.home_team_id) ?? [], [lineups, match]);
  const awayLineup = useMemo(() => lineups?.filter(l => l.team_id === match?.away_team_id) ?? [], [lineups, match]);

  const matchPlayerStats = useMemo(() => {
    const map = new Map<string, { goals: number; assists: number; yellowCards: number; redCards: number; mvp: boolean }>();
    lineups?.forEach(l => map.set(l.player_id, { goals: 0, assists: 0, yellowCards: 0, redCards: 0, mvp: false }));
    events?.forEach(ev => {
      const s = map.get(ev.player_id);
      if (!s) return;
      if (ev.event_type === 'goal') s.goals++;
      else if (ev.event_type === 'assist') s.assists++;
      else if (ev.event_type === 'yellow_card') s.yellowCards++;
      else if (ev.event_type === 'red_card') s.redCards++;
      else if (ev.event_type === 'mvp') s.mvp = true;
    });
    return map;
  }, [events, lineups]);

  const hasEvents = events && events.length > 0;
  const tabs: { id: TabId; label: string }[] = [
    { id: 'resume', label: 'Résumé' },
    { id: 'lineup', label: 'Composition' },
    ...(hasEvents ? [{ id: 'events' as TabId, label: 'Événements' }] : []),
  ];

  useEffect(() => { window.scrollTo(0, 0); document.title = 'Match · Tournoi Ramadan'; }, []);

  if (matchLoading || !match) return <Loader />;

  const homeColor = match.home_color ?? match.home_team.color;
  const awayColor = match.away_color ?? match.away_team.color;

  return (
    <main className="min-h-screen bg-gray-900">

      {/* ── Hero Score Header ── */}
      <section className="relative overflow-hidden pt-12 pb-7">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-gray-900" />
        <div className="absolute inset-0" style={{
          background: `linear-gradient(120deg, ${homeColor}18 0%, transparent 42%, ${awayColor}18 100%)`
        }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }} />

        <div className="relative z-10 max-w-4xl mx-auto px-4">

          {/* Back */}
          <button
            onClick={() => setLocation('/tournoi/matchs')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-xs mb-5 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Retour
          </button>

          {/* Badges row */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="px-2.5 py-0.5 rounded-full bg-white/8 text-gray-400 text-[10px] font-bold uppercase tracking-widest border border-white/8">
              Journée {match.matchday}
            </span>
            {match.status === 'live' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neongreen/15 text-neongreen border border-neongreen/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neongreen opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-neongreen" />
                </span>
                EN DIRECT
              </span>
            )}
            {match.status === 'completed' && (
              <span className="px-2.5 py-0.5 rounded-full bg-gray-700/60 text-gray-400 text-[10px] font-bold border border-gray-700/50 uppercase tracking-wider">
                Terminé
              </span>
            )}
          </div>

          {/* Teams + Score */}
          <div className="flex items-center justify-center gap-4 sm:gap-10 px-2 mb-5">

            {/* Home */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex-1 flex flex-col items-center gap-2.5 min-w-0"
            >
              <TeamBadge team={match.home_team} color={homeColor} size="lg" />
              <span className="text-white font-bold text-xs sm:text-sm text-center leading-tight line-clamp-2">
                {match.home_team.name}
              </span>
            </motion.div>

            {/* Score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.18, type: 'spring', stiffness: 220, damping: 18 }}
              className="flex-shrink-0 text-center"
            >
              {match.status === 'scheduled' ? (
                <div className="px-5 py-3.5 bg-white/6 rounded-2xl border border-white/10 flex flex-col items-center gap-1">
                  <span className="text-gray-300 font-black text-xl tracking-wider">VS</span>
                  {match.time && (
                    <span className="text-gray-600 text-[10px] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />{match.time.slice(0, 5)}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className={`text-5xl sm:text-6xl font-black tabular-nums leading-none ${
                    match.home_score > match.away_score ? 'text-white' :
                    match.home_score === match.away_score ? 'text-gray-200' : 'text-gray-600'
                  }`}>{match.home_score}</span>
                  <span className="text-gray-600 text-2xl font-bold pb-1">:</span>
                  <span className={`text-5xl sm:text-6xl font-black tabular-nums leading-none ${
                    match.away_score > match.home_score ? 'text-white' :
                    match.away_score === match.home_score ? 'text-gray-200' : 'text-gray-600'
                  }`}>{match.away_score}</span>
                </div>
              )}
            </motion.div>

            {/* Away */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex-1 flex flex-col items-center gap-2.5 min-w-0"
            >
              <TeamBadge team={match.away_team} color={awayColor} size="lg" />
              <span className="text-white font-bold text-xs sm:text-sm text-center leading-tight line-clamp-2">
                {match.away_team.name}
              </span>
            </motion.div>
          </div>

          {/* Date / Location */}
          {(match.date || match.location) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-3 text-[11px] text-gray-600"
            >
              {match.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(match.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {match.time && <> · {match.time.slice(0, 5)}</>}
                </span>
              )}
              {match.date && match.location && <span className="text-gray-800">·</span>}
              {match.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{match.location}
                </span>
              )}
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-900 to-transparent" />
      </section>

      <TournoiNav />

      {/* ── Sticky Tab Bar ── */}
      <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-md border-b border-gray-800/80">
        <div className="max-w-4xl mx-auto px-4 flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-bold transition-colors relative ${
                activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-3 right-3 h-0.5 rounded-t-full"
                  style={{ backgroundColor: '#3b82f6' }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="max-w-4xl mx-auto px-4 py-5">
        <AnimatePresence mode="wait">

          {/* ─ RÉSUMÉ ─ */}
          {activeTab === 'resume' && (
            <motion.div key="resume"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {/* Score cards per team */}
              <div className="grid grid-cols-2 gap-3">
                {([
                  { lineup: homeLineup, team: match.home_team, score: match.home_score, color: homeColor },
                  { lineup: awayLineup, team: match.away_team, score: match.away_score, color: awayColor },
                ] as const).map(({ lineup, team, score, color }) => {
                  const performers = [...lineup]
                    .sort((a, b) => (a.jersey_number ?? 999) - (b.jersey_number ?? 999))
                    .filter(l => {
                      const s = matchPlayerStats.get(l.player_id);
                      return s && (s.goals > 0 || s.assists > 0 || s.yellowCards > 0 || s.redCards > 0 || s.mvp);
                    });

                  return (
                    <div key={team.id} className="rounded-2xl overflow-hidden border border-gray-700/40 bg-gray-800/50">
                      {/* Team + Score */}
                      <div className="px-3 pt-3 pb-2 flex items-center gap-2"
                        style={{ background: `linear-gradient(135deg, ${color}12, transparent 70%)` }}>
                        <TeamBadge team={team} color={color} size="sm" />
                        <span className="text-[11px] font-bold text-white flex-1 truncate">{team.name}</span>
                        <span className="text-2xl font-black tabular-nums" style={{ color }}>
                          {score}
                        </span>
                      </div>

                      {/* Key performers */}
                      <div className="px-3 pb-3 pt-1 min-h-[40px]">
                        {performers.length === 0 ? (
                          <p className="text-[10px] text-gray-700 text-center py-2">—</p>
                        ) : (
                          <div className="space-y-1.5">
                            {performers.map(l => {
                              const s = matchPlayerStats.get(l.player_id)!;
                              return (
                                <div key={l.player_id} className="flex items-center gap-1.5">
                                  {l.jersey_number != null ? (
                                    <span className="w-4.5 h-4.5 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[8px] font-black text-white flex-shrink-0"
                                      style={{ backgroundColor: color }}>
                                      {l.jersey_number}
                                    </span>
                                  ) : <span className="w-[18px] flex-shrink-0" />}
                                  <span className="text-[10px] text-gray-300 flex-1 truncate">
                                    {(l.player.full_name || l.player.username).split(' ')[0]}
                                  </span>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {s.goals > 0 && (
                                      <span className="text-[9px] font-bold text-white flex items-center gap-0.5">
                                        ⚽{s.goals > 1 && <span>×{s.goals}</span>}
                                      </span>
                                    )}
                                    {s.assists > 0 && (
                                      <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                                        🎯{s.assists > 1 && <span>×{s.assists}</span>}
                                      </span>
                                    )}
                                    {s.yellowCards > 0 && <span className="w-2.5 h-3 rounded-[2px] bg-yellow-400 inline-block flex-shrink-0" />}
                                    {s.redCards > 0 && <span className="w-2.5 h-3 rounded-[2px] bg-red-500 inline-block flex-shrink-0" />}
                                    {s.mvp && <span className="text-amber-400 text-[9px]">⭐</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Timeline preview */}
              {hasEvents && (
                <div className="bg-gray-800/50 rounded-2xl border border-gray-700/40 p-4">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-rayoblue rounded-full" />
                    Chronologie
                  </p>
                  <MatchEventTimeline
                    events={events}
                    homeTeamId={match.home_team_id}
                    homeColor={homeColor}
                    awayColor={awayColor}
                    homeLineup={homeLineup}
                    awayLineup={awayLineup}
                  />
                </div>
              )}

              {!hasEvents && match.status === 'scheduled' && (
                <div className="text-center py-10 text-gray-600 text-sm">
                  Match à venir
                </div>
              )}
            </motion.div>
          )}

          {/* ─ COMPOSITION ─ */}
          {activeTab === 'lineup' && (
            <motion.div key="lineup"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {/* Mobile: stacked, Desktop: side by side */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                {([
                  { lineup: homeLineup, team: match.home_team, color: homeColor },
                  { lineup: awayLineup, team: match.away_team, color: awayColor },
                ] as const).map(({ lineup, team, color }) => (
                  <div key={team.id} className="rounded-2xl overflow-hidden border border-gray-700/40 bg-gray-800/50">
                    <div className="h-1 w-full" style={{ backgroundColor: color }} />
                    <div className="p-3">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-gray-700/40">
                        <TeamBadge team={team} color={color} size="sm" />
                        <span className="text-xs font-bold text-white truncate flex-1">{team.name}</span>
                        <span className="text-[10px] text-gray-600 font-semibold">{lineup.length}j</span>
                      </div>

                      {/* Players */}
                      {lineup.length === 0 ? (
                        <p className="text-[10px] text-gray-600 text-center py-3">Non disponible</p>
                      ) : (
                        <div className="space-y-1">
                          {[...lineup]
                            .sort((a, b) => (a.jersey_number ?? 999) - (b.jersey_number ?? 999))
                            .map(l => {
                              const s = matchPlayerStats.get(l.player_id);
                              const hasEvent = s && (s.goals > 0 || s.assists > 0 || s.yellowCards > 0 || s.redCards > 0 || s.mvp);
                              return (
                                <div key={l.id}
                                  className={`flex items-center gap-1.5 px-1.5 py-1 rounded-lg ${hasEvent ? 'bg-white/[0.04]' : ''}`}
                                >
                                  {l.jersey_number != null ? (
                                    <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[8px] font-black text-white flex-shrink-0"
                                      style={{ backgroundColor: color }}>
                                      {l.jersey_number}
                                    </span>
                                  ) : (
                                    <span className="w-[18px] h-[18px] rounded-full bg-gray-700 flex-shrink-0" />
                                  )}
                                  <span className="text-[10px] text-gray-300 flex-1 truncate leading-none">
                                    {l.player.full_name || l.player.username}
                                  </span>
                                  {s && (
                                    <div className="flex items-center gap-0.5 flex-shrink-0">
                                      {s.goals > 0 && <span className="text-[8px] leading-none">⚽</span>}
                                      {s.assists > 0 && <span className="text-[8px] leading-none">🎯</span>}
                                      {s.yellowCards > 0 && <span className="w-2 h-2.5 rounded-[1.5px] bg-yellow-400 inline-block" />}
                                      {s.redCards > 0 && <span className="w-2 h-2.5 rounded-[1.5px] bg-red-500 inline-block" />}
                                      {s.mvp && <span className="text-[8px] leading-none">⭐</span>}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─ ÉVÉNEMENTS ─ */}
          {activeTab === 'events' && hasEvents && (
            <motion.div key="events"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <div className="bg-gray-800/50 rounded-2xl border border-gray-700/40 p-4">
                <MatchEventTimeline
                  events={events}
                  homeTeamId={match.home_team_id}
                  homeLineup={homeLineup}
                  awayLineup={awayLineup}
                />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
};

export default TournoiMatchDetail;
