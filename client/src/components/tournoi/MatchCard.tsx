import { useLocation } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import type { MatchWithTeams } from '@/lib/tournoi-types';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface MatchCardProps {
  match: MatchWithTeams;
  index?: number;
}

function getCountdown(dateStr: string, timeStr?: string | null): string | null {
  try {
    const dateTime = timeStr ? `${dateStr}T${timeStr}` : dateStr;
    const target = new Date(dateTime).getTime();
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}j ${hours}h`;
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins}min`;
  } catch {
    return null;
  }
}

const MatchCard = ({ match, index = 0 }: MatchCardProps) => {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const countdown = useMemo(() => {
    if (match.status !== 'scheduled' || !match.date) return null;
    return getCountdown(match.date, match.time);
  }, [match.date, match.time, match.status]);

  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const homeWin = isCompleted && match.home_score > match.away_score;
  const awayWin = isCompleted && match.away_score > match.home_score;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={() => setLocation(`/tournoi/match/${match.id}`)}
      className={`relative group cursor-pointer rounded-xl border transition-all duration-200 overflow-hidden ${
        isLive
          ? 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-neongreen/30 shadow-lg shadow-neongreen/10'
          : 'bg-gray-800/60 border-white/[0.06] hover:border-white/[0.12] hover:bg-gray-800/80'
      }`}
    >
      {/* Live indicator bar */}
      {isLive && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-neongreen to-transparent" />
      )}

      {/* Top meta bar: date, matchday, location */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          {match.date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(match.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {match.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {match.location}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neongreen opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neongreen" />
              </span>
              <span className="text-[10px] font-bold text-neongreen uppercase tracking-wider">{t('tournoi_live')}</span>
            </div>
          )}
          {isCompleted && (
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{t('tournoi_completed')}</span>
          )}
          {!isLive && !isCompleted && countdown && (
            <span className="text-[10px] font-semibold text-rayoblue">{countdown}</span>
          )}
          {!isLive && !isCompleted && !countdown && match.time && (
            <span className="text-xs font-bold text-gray-400">{match.time.slice(0, 5)}</span>
          )}
        </div>
      </div>

      {/* Horizontal scorecard */}
      <div className="flex items-center px-4 pb-3 pt-1 gap-1.5 sm:gap-2">
        {/* Home team */}
        <div className="flex-1 flex items-center gap-1.5 sm:gap-2.5 min-w-0 justify-end overflow-hidden">
          <span className={`text-xs sm:text-sm md:text-[15px] truncate text-right max-w-full ${
            homeWin ? 'font-extrabold text-white' : isCompleted && awayWin ? 'font-medium text-gray-500' : 'font-semibold text-gray-300'
          }`}>
            {match.home_team.name}
          </span>
          <span
            className={`w-6 h-6 sm:w-7 sm:h-8 rounded-full flex-shrink-0 ring-2 shadow-md ${
              homeWin ? 'ring-neongreen/50' : 'ring-white/10'
            }`}
            style={{ backgroundColor: match.home_team.color }}
          />
        </div>

        {/* Score center */}
        <div className={`flex-shrink-0 flex items-center justify-center gap-1 px-2 sm:px-3 py-1 rounded-lg min-w-[60px] sm:min-w-[72px] ${
          isLive
            ? 'bg-neongreen/10 border border-neongreen/20'
            : isCompleted
              ? 'bg-white/[0.05]'
              : 'bg-white/[0.03]'
        }`}>
          <span className={`text-base sm:text-lg md:text-xl font-black tabular-nums ${
            isLive ? 'text-neongreen' : homeWin ? 'text-white' : isCompleted ? 'text-gray-500' : 'text-gray-600'
          }`}>
            {isCompleted || isLive ? match.home_score : '-'}
          </span>
          <span className={`text-xs font-bold mx-0.5 ${isLive ? 'text-neongreen/50' : 'text-gray-600'}`}>:</span>
          <span className={`text-base sm:text-lg md:text-xl font-black tabular-nums ${
            isLive ? 'text-neongreen' : awayWin ? 'text-white' : isCompleted ? 'text-gray-500' : 'text-gray-600'
          }`}>
            {isCompleted || isLive ? match.away_score : '-'}
          </span>
        </div>

        {/* Away team */}
        <div className="flex-1 flex items-center gap-1.5 sm:gap-2.5 min-w-0 overflow-hidden">
          <span
            className={`w-6 h-6 sm:w-7 sm:h-8 rounded-full flex-shrink-0 ring-2 shadow-md ${
              awayWin ? 'ring-neongreen/50' : 'ring-white/10'
            }`}
            style={{ backgroundColor: match.away_team.color }}
          />
          <span className={`text-xs sm:text-sm md:text-[15px] truncate max-w-full ${
            awayWin ? 'font-extrabold text-white' : isCompleted && homeWin ? 'font-medium text-gray-500' : 'font-semibold text-gray-300'
          }`}>
            {match.away_team.name}
          </span>
        </div>

        {/* Chevron */}
        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-gray-600 group-hover:text-rayoblue group-hover:translate-x-0.5 transition-all ml-0.5" />
      </div>
    </motion.div>
  );
};

export default MatchCard;
