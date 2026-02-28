import { useMemo } from 'react';
import type { MatchEventWithDetails, MatchLineupWithPlayer } from '@/lib/tournoi-types';
import { Star, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface MatchEventTimelineProps {
  events: MatchEventWithDetails[];
  homeTeamId: string;
  homeLineup?: MatchLineupWithPlayer[];
  awayLineup?: MatchLineupWithPlayer[];
}

const eventIcon = (type: string) => {
  switch (type) {
    case 'goal':
      return <span className="text-sm">&#9917;</span>;
    case 'own_goal':
      return <span className="text-sm text-red-400">&#9917;</span>;
    case 'assist':
      return <span className="text-sm">&#127919;</span>;
    case 'yellow_card':
      return <div className="w-3 h-4 rounded-[2px] bg-yellow-400 shadow-sm shadow-yellow-400/30" />;
    case 'red_card':
      return <div className="w-3 h-4 rounded-[2px] bg-red-500 shadow-sm shadow-red-500/30" />;
    case 'mvp':
      return <Star className="w-4 h-4 text-amber-400 fill-amber-400" />;
    default:
      return <AlertTriangle className="w-3 h-3" />;
  }
};

const eventLabel = (type: string) => {
  switch (type) {
    case 'goal': return 'But';
    case 'own_goal': return 'C.S.C';
    case 'assist': return 'Passe D.';
    case 'yellow_card': return 'Carton jaune';
    case 'red_card': return 'Carton rouge';
    case 'mvp': return 'MVP';
    default: return type;
  }
};

const eventBadgeColor = (type: string) => {
  switch (type) {
    case 'goal': return 'bg-rayoblue/15 text-rayoblue';
    case 'own_goal': return 'bg-red-500/15 text-red-400';
    case 'assist': return 'bg-emerald-500/15 text-emerald-400';
    case 'yellow_card': return 'bg-yellow-500/15 text-yellow-400';
    case 'red_card': return 'bg-red-500/15 text-red-400';
    case 'mvp': return 'bg-amber-500/15 text-amber-400';
    default: return 'bg-gray-700/50 text-gray-400';
  }
};

const MatchEventTimeline = ({ events, homeTeamId, homeLineup, awayLineup }: MatchEventTimelineProps) => {
  const jerseyMap = useMemo(() => {
    const map = new Map<string, number>();
    homeLineup?.forEach(l => { if (l.jersey_number != null) map.set(l.player_id, l.jersey_number); });
    awayLineup?.forEach(l => { if (l.jersey_number != null) map.set(l.player_id, l.jersey_number); });
    return map;
  }, [homeLineup, awayLineup]);

  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        Aucun événement enregistré
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[39px] top-2 bottom-2 w-px bg-gradient-to-b from-gray-600 via-gray-700 to-transparent" />

      <div className="space-y-0.5">
        {events.map((event, idx) => {
          const isHome = event.team_id === homeTeamId;
          const isGoal = event.event_type === 'goal';

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: isHome ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className={`flex items-center gap-2 py-2.5 px-2 rounded-lg transition-colors hover:bg-gray-700/20 ${
                isHome ? '' : 'flex-row-reverse'
              }`}
            >
              <span className={`text-[10px] font-bold w-9 flex-shrink-0 text-center px-1.5 py-0.5 rounded-full ${
                isGoal ? 'bg-rayoblue/15 text-rayoblue' : 'bg-gray-700/50 text-gray-500'
              }`}>
                {event.minute != null ? `${event.minute}'` : ''}
              </span>

              <div className="flex-shrink-0 w-3 flex items-center justify-center relative z-10">
                <div
                  className={`rounded-full ${isGoal ? 'w-2.5 h-2.5' : 'w-2 h-2'}`}
                  style={{ backgroundColor: event.team.color }}
                />
              </div>

              <div className="flex-shrink-0 w-6 flex items-center justify-center">
                {eventIcon(event.event_type)}
              </div>

              <div className={`flex-1 min-w-0 ${isHome ? 'text-left' : 'text-right'}`}>
                <span className={`text-xs font-semibold text-gray-200 ${isGoal ? 'text-sm' : ''}`}>
                  {jerseyMap.get(event.player_id) != null && (
                    <span className="text-gray-500 mr-1">#{jerseyMap.get(event.player_id)}</span>
                  )}
                  {event.player.full_name || event.player.username}
                </span>
                <span className={`inline-block ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${eventBadgeColor(event.event_type)}`}>
                  {eventLabel(event.event_type)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchEventTimeline;
