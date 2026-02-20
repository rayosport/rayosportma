import { useLanguage } from '@/hooks/use-language';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import type { StandingRow } from '@/lib/tournoi-types';

interface StandingsTableProps {
  standings: StandingRow[];
  compact?: boolean;
  limit?: number;
}

const StandingsTable = ({ standings, compact = false, limit }: StandingsTableProps) => {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const rows = limit ? standings.slice(0, limit) : standings;

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Aucune donnée de classement disponible
      </div>
    );
  }

  const posStyle = (pos: number) => {
    if (pos === 1) return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900 shadow-sm shadow-yellow-400/30';
    if (pos === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 shadow-sm';
    if (pos === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-amber-100 shadow-sm';
    return 'bg-gray-700 text-gray-400';
  };

  const rowBg = (pos: number) => {
    if (pos === 1) return 'bg-gradient-to-r from-yellow-500/[0.08] via-yellow-500/[0.03] to-transparent';
    if (pos === 2) return 'bg-gradient-to-r from-gray-400/[0.06] via-gray-400/[0.02] to-transparent';
    if (pos === 3) return 'bg-gradient-to-r from-amber-500/[0.06] via-amber-500/[0.02] to-transparent';
    return '';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700/50 text-[10px] uppercase tracking-wider text-gray-500 font-semibold bg-gray-900/30">
            <th className="text-center py-2.5 w-10">#</th>
            <th className="text-left py-2.5">{t('tournoi_team')}</th>
            <th className="text-center py-2.5 w-10">{t('tournoi_played')}</th>
            <th className="text-center py-2.5 w-10 hidden sm:table-cell">{t('tournoi_won')}</th>
            <th className="text-center py-2.5 w-10 hidden sm:table-cell">{t('tournoi_drawn')}</th>
            <th className="text-center py-2.5 w-10 hidden sm:table-cell">{t('tournoi_lost')}</th>
            <th className="text-center py-2.5 w-10 hidden md:table-cell">{t('tournoi_goals_for')}</th>
            <th className="text-center py-2.5 w-10 hidden md:table-cell">{t('tournoi_goals_against')}</th>
            <th className="text-center py-2.5 w-12 hidden sm:table-cell">{t('tournoi_goal_diff')}</th>
            <th className="text-center py-2.5 w-14 font-bold">{t('tournoi_points')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const pos = idx + 1;
            return (
              <motion.tr
                key={row.team_id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                onClick={() => setLocation(`/tournoi/team/${row.team_id}`)}
                className={`border-b border-gray-700/30 transition-colors duration-150 hover:bg-gray-700/20 cursor-pointer ${rowBg(pos)}`}
                style={{ borderLeft: `3px solid ${row.team_color}` }}
              >
                <td className="text-center py-3">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${posStyle(pos)}`}>
                    {pos}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    {row.team_logo_url ? (
                      <img src={row.team_logo_url} alt={row.team_name} className="w-6 h-6 flex-shrink-0 object-contain" />
                    ) : (
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-1 ring-white/10 shadow-sm"
                        style={{ backgroundColor: row.team_color }}
                      />
                    )}
                    <span className={`font-semibold text-gray-200 ${compact ? 'text-xs' : 'text-sm'}`}>
                      {row.team_name}
                    </span>
                  </div>
                </td>
                <td className="text-center py-3 text-gray-400 font-medium">{row.played}</td>
                <td className="text-center py-3 text-gray-400 hidden sm:table-cell">{row.won}</td>
                <td className="text-center py-3 text-gray-400 hidden sm:table-cell">{row.drawn}</td>
                <td className="text-center py-3 text-gray-400 hidden sm:table-cell">{row.lost}</td>
                <td className="text-center py-3 text-gray-400 hidden md:table-cell">{row.goals_for}</td>
                <td className="text-center py-3 text-gray-400 hidden md:table-cell">{row.goals_against}</td>
                <td className={`text-center py-3 font-semibold hidden sm:table-cell ${
                  row.goal_difference > 0 ? 'text-emerald-400' : row.goal_difference < 0 ? 'text-red-400' : 'text-gray-500'
                }`}>
                  {row.goal_difference > 0 ? '+' : ''}{row.goal_difference}
                </td>
                <td className="text-center py-3">
                  <span className={`inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded-full font-black text-sm ${
                    pos === 1
                      ? 'bg-rayoblue/15 text-rayoblue'
                      : 'text-rayoblue'
                  }`}>
                    {row.points}
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StandingsTable;
