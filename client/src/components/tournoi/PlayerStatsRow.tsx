import { motion } from 'framer-motion';

interface PlayerStatsRowProps {
  rank: number;
  playerName: string;
  teamName: string;
  teamColor: string;
  value: number;
  icon?: React.ReactNode;
  index?: number;
}

const PlayerStatsRow = ({ rank, playerName, teamName, teamColor, value, icon, index = 0 }: PlayerStatsRowProps) => {
  const isTop3 = rank <= 3;

  const rankStyle = () => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900 shadow-sm shadow-yellow-400/30';
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 shadow-sm';
    if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-amber-100 shadow-sm';
    return 'bg-gray-700 text-gray-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`flex items-center justify-between border-b border-gray-700/30 last:border-0 hover:bg-gray-700/20 transition-colors duration-150 ${
        isTop3 ? 'py-3.5 px-3' : 'py-2.5 px-3'
      }`}
      style={{ borderLeft: `3px solid ${teamColor}` }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className={`inline-flex items-center justify-center flex-shrink-0 rounded-full text-[10px] font-bold ${rankStyle()} ${
          isTop3 ? 'w-7 h-7' : 'w-6 h-6'
        }`}>
          {rank}
        </span>
        <span
          className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-white/10 shadow-sm"
          style={{ backgroundColor: teamColor }}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-200 truncate">{playerName}</p>
          <p className="text-[10px] text-gray-500 truncate">{teamName}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {icon}
        <span className={`font-black text-rayoblue ${isTop3 ? 'text-xl' : 'text-lg'}`}>{value}</span>
      </div>
    </motion.div>
  );
};

export default PlayerStatsRow;
