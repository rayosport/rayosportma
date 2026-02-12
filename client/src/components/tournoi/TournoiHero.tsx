import { useLanguage } from '@/hooks/use-language';
import { Trophy, Users, Swords, Target } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { League } from '@/lib/tournoi-types';

interface TournoiHeroProps {
  league?: League | null;
  compact?: boolean;
  liveCount?: number;
  stats?: { teams: number; matches: number; goals: number };
}

function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionVal, value, { duration, ease: 'easeOut' });
    return controls.stop;
  }, [value, duration, motionVal]);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => {
      if (ref.current) ref.current.textContent = String(v);
    });
    return unsubscribe;
  }, [rounded]);

  return <span ref={ref}>0</span>;
}

const TournoiHero = ({ league, compact = false, liveCount = 0, stats }: TournoiHeroProps) => {
  const { t } = useLanguage();

  return (
    <section className={`relative ${compact ? 'pt-20 pb-8' : 'pt-24 pb-16'} bg-gradient-to-br from-jetblack via-gray-900 to-jetblack overflow-hidden`}>
      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Animated gradient blobs */}
      <motion.div
        className="absolute top-[-10%] left-[30%] w-[500px] h-[300px] bg-rayoblue/15 rounded-full blur-[120px]"
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-10%] right-[10%] w-[400px] h-[250px] bg-neongreen/8 rounded-full blur-[100px]"
        animate={{ x: [0, -30, 20, 0], y: [0, 20, -30, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[20%] right-[30%] w-[300px] h-[200px] bg-rayored/5 rounded-full blur-[100px]"
        animate={{ x: [0, 20, -30, 0], y: [0, -20, 10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Ramadan crescent decoration */}
      {!compact && (
        <div className="absolute top-8 right-8 sm:right-16 opacity-[0.06] pointer-events-none">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <path d="M80 10C50 10 25 35 25 65s25 55 55 55c-20 0-40-20-40-55S60 10 80 10z" fill="white"/>
            <circle cx="85" cy="25" r="3" fill="white"/>
          </svg>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Live banner */}
        {liveCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neongreen/10 border border-neongreen/25 mb-4"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neongreen opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neongreen" />
            </span>
            <span className="text-xs font-bold text-neongreen uppercase tracking-wider">
              {liveCount} match{liveCount > 1 ? 's' : ''} en direct
            </span>
          </motion.div>
        )}

        {!compact && liveCount === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rayoblue/10 border border-rayoblue/20 mb-4"
          >
            <Trophy className="w-4 h-4 text-rayoblue" />
            <span className="text-xs font-semibold text-rayoblue uppercase tracking-wider">
              {t('tournoi_title')}
            </span>
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className={`font-black text-white ${compact ? 'text-2xl md:text-3xl' : 'text-3xl md:text-5xl lg:text-6xl'} leading-tight`}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
            {t('tournoi_title')}
          </span>
        </motion.h1>

        {league && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-3 flex items-center justify-center gap-3 flex-wrap"
          >
            <span className="text-gray-400 text-sm md:text-base font-medium">
              {league.name} &mdash; {league.season}
            </span>
            {league.city && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/10 backdrop-blur-sm">
                {league.city}
              </span>
            )}
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold backdrop-blur-sm ${
              league.status === 'active'
                ? 'bg-neongreen/20 text-neongreen border border-neongreen/30'
                : league.status === 'completed'
                ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              {league.status === 'active' ? 'En cours' : league.status === 'completed' ? 'Terminé' : 'Brouillon'}
            </span>
          </motion.div>
        )}

        {/* Quick stats row */}
        {!compact && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-8 flex items-center justify-center gap-3 sm:gap-6"
          >
            {[
              { icon: Users, label: 'Équipes', value: stats.teams, color: 'text-rayoblue' },
              { icon: Swords, label: 'Matchs', value: stats.matches, color: 'text-neongreen' },
              { icon: Target, label: 'Buts', value: stats.goals, color: 'text-rayored' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm min-w-[80px]"
              >
                <stat.icon className={`w-4 h-4 ${stat.color} opacity-70`} />
                <span className="text-2xl font-black text-white">
                  <AnimatedCounter value={stat.value} />
                </span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-900 to-transparent" />
    </section>
  );
};

export default TournoiHero;
