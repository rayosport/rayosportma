import { useLocation } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { BarChart3, Calendar, TableProperties, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface TournoiNavProps {
  liveCount?: number;
}

const TournoiNav = ({ liveCount = 0 }: TournoiNavProps) => {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();

  const tabs = [
    { href: '/tournoi', label: t('tournoi_overview'), icon: Trophy, exact: true },
    { href: '/tournoi/classement', label: t('tournoi_standings'), icon: TableProperties },
    { href: '/tournoi/matchs', label: t('tournoi_matches'), icon: Calendar, showLive: true },
    { href: '/tournoi/stats', label: t('tournoi_stats'), icon: BarChart3 },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location === href;
    return location.startsWith(href);
  };

  return (
    <div className="sticky top-14 z-40 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/40 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-1 overflow-x-auto scrollbar-thin py-1.5 snap-x snap-mandatory" role="tablist" aria-label="Tournament navigation">
          {tabs.map((tab) => {
            const active = isActive(tab.href, tab.exact);
            return (
              <button
                key={tab.href}
                onClick={() => setLocation(tab.href)}
                role="tab"
                aria-selected={active}
                className={`relative flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors duration-200 snap-start ${
                  active
                    ? 'text-rayoblue'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="tournoiActiveTab"
                    className="absolute inset-0 bg-rayoblue/10 rounded-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.showLive && liveCount > 0 && (
                    <span className="relative flex items-center gap-1 ml-0.5 px-1.5 py-0.5 rounded-full bg-neongreen/15 text-neongreen text-[9px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-neongreen animate-pulse" />
                      {liveCount}
                    </span>
                  )}
                </span>
                {active && (
                  <motion.div
                    layoutId="tournoiActiveUnderline"
                    className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-rayoblue to-neongreen rounded-full"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default TournoiNav;
