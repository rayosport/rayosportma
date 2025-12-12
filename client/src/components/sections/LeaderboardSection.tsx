import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useCompanyContext } from "@/hooks/use-company-context";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { FaTrophy, FaMedal, FaAward, FaUser, FaGamepad } from "react-icons/fa";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FiTrendingUp, FiTarget, FiAward, FiUsers, FiStar, FiX, FiShield, FiZap, FiAlertTriangle, FiRefreshCw, FiSearch, FiMapPin } from "react-icons/fi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { trackEvent } from "@/lib/analytics";
import RankedLeaderboardSection from "./RankedLeaderboardSection";

// Types pour les données du leaderboard
interface Player {
  rank: number;
  cityRank: number;
  rankTier?: string;  // Rank tier from Rank column (e.g., "Predator", "Gold", "Silver", etc.)
  firstName: string;
  username: string;
  city: string;
  globalScore: number;
  gamesPlayed: number;
  goals: number;
  assists: number;
  teamWins: number;
  attackRatio?: number;
  defenseRatio?: number;
  individualScore?: number;
  teamScore?: number;
  isNewPlayer?: boolean;
  paymentStatus: "Payé" | "Non payé" | "Nouveau joueur" | "Subscription";
  solde?: number;
  expirationDate?: string;  // Expiration date from ExpirationDate column
  mvpCount?: number;  // MVP count from TMVP🔒 column
  level?: string;  // Level from Level column (e.g., "Street", "Pro", "Amateur")
  monthlyPoints?: number;  // MonthlyPoints from MonthlyPoints column
  rankLevel?: string;  // RankLevel from RankLevel column
  points?: number;  // Points from Points column (for leaderboard, different from MonthlyPoints)
  pointsRank?: number;  // Rank based on points sorting
}

// Configuration Google Sheets - Foot_Players sheet (gid=1681767418)
// This MUST use the Foot_Players sheet for leaderboard data
const DEFAULT_GOOGLE_SHEETS_CONFIG = {
  csvUrl: 'https://rayobackend.onrender.com/api/sheets/Foot_Players',
};

interface LeaderboardSectionProps {
  onPlayerClick?: (username: string) => void;
  onToggleChange?: (checked: boolean) => void;
  selectedCity?: string;
  onCityChange?: (city: string) => void;
  availableCities?: string[];
  onAvailableCitiesChange?: (cities: string[]) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  externalCurrentPage?: number;
  onPageChange?: (page: number) => void;
  onPaginationChange?: (info: { currentPage: number; totalPages: number; startIndex: number; endIndex: number; totalItems: number }) => void;
}

const LeaderboardSection = ({ 
  onPlayerClick, 
  onToggleChange,
  selectedCity: propSelectedCity,
  onCityChange,
  availableCities: propAvailableCities,
  onAvailableCitiesChange,
  searchQuery: propSearchQuery,
  onSearchQueryChange,
  externalCurrentPage,
  onPageChange,
  onPaginationChange
}: LeaderboardSectionProps = {}) => {
  // console.log('🎯 LeaderboardSection: Component rendering...');
  const { language } = useLanguage();
  const { customDataSources } = useCompanyContext();
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rayoSupport, setRayoSupport] = useState<Map<string, boolean>>(new Map());
  const [selectedCity, setSelectedCity] = useState<string>(propSelectedCity || "Toutes les villes");
  const [availableCities, setAvailableCities] = useState<string[]>(propAvailableCities || []);
  const [currentPage, setCurrentPage] = useState(externalCurrentPage || 1);
  const playersPerPage = 10;
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerCard, setShowPlayerCard] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>(propSearchQuery || "");
  const [searchSuggestions, setSearchSuggestions] = useState<Player[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState<string>("points");
  const [toggleChecked, setToggleChecked] = useState<boolean>(true);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  // Sync with parent props
  useEffect(() => {
    if (propSelectedCity !== undefined) {
      setSelectedCity(propSelectedCity);
    }
  }, [propSelectedCity]);

  useEffect(() => {
    if (propAvailableCities !== undefined && onAvailableCitiesChange) {
      setAvailableCities(propAvailableCities);
    }
  }, [propAvailableCities, onAvailableCitiesChange]);

  useEffect(() => {
    if (propSearchQuery !== undefined) {
      setSearchQuery(propSearchQuery);
    }
  }, [propSearchQuery]);

  // Sync external current page
  useEffect(() => {
    if (externalCurrentPage !== undefined && externalCurrentPage !== currentPage) {
      setCurrentPage(externalCurrentPage);
    }
  }, [externalCurrentPage, currentPage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCityDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-dropdown]')) {
          setIsCityDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCityDropdownOpen]);

  // Handler pour ouvrir la carte joueur
  const handlePlayerClick = (player: Player) => {
    // If onPlayerClick prop is provided, use the new player analytics dashboard
    if (onPlayerClick) {
      trackEvent('leaderboard_player_click', 'user_engagement', player.username);
      onPlayerClick(player.username);
      return;
    }
    
    // Fallback to old FIFA card if no prop provided
    setSelectedPlayer(player);
    setShowPlayerCard(true);
    trackEvent('leaderboard_player_card_view', 'interaction', player.username);
  };

  // Helper function to get rank logo and style (same as Football.tsx)
  const getRankLogoAndStyle = (rankTier: string | undefined) => {
    if (!rankTier) {
      return { logo: '/images/gallery/optimized/unranked.png', border: 'border-gray-500 shadow-gray-500/50', bg: 'from-gray-400 to-gray-500' };
    }
    
    const tierLower = rankTier.toLowerCase();
    
    if (tierLower.includes('predator')) {
      return { logo: '/images/gallery/optimized/Predator.png', border: 'border-red-500 shadow-red-500/50', bg: 'from-red-500 to-rose-600' };
    } else if (tierLower.includes('goat 3') || tierLower.includes('goat3')) {
      return { logo: '/images/gallery/optimized/Goat3.png', border: 'border-amber-400 shadow-amber-400/50', bg: 'from-amber-400 to-yellow-500' };
    } else if (tierLower.includes('goat 2') || tierLower.includes('goat2')) {
      return { logo: '/images/gallery/optimized/Goat2.png', border: 'border-amber-400 shadow-amber-400/50', bg: 'from-amber-400 to-yellow-500' };
    } else if (tierLower.includes('goat 1') || tierLower.includes('goat1')) {
      return { logo: '/images/gallery/optimized/Goat1.png', border: 'border-amber-400 shadow-amber-400/50', bg: 'from-amber-400 to-yellow-500' };
    } else if (tierLower.includes('gorilla 3') || tierLower.includes('gorilla3')) {
      return { logo: '/images/gallery/optimized/Gorilla3.png', border: 'border-purple-500 shadow-purple-500/50', bg: 'from-purple-500 to-violet-600' };
    } else if (tierLower.includes('gorilla 2') || tierLower.includes('gorilla2')) {
      return { logo: '/images/gallery/optimized/Gorilla2.png', border: 'border-cyan-400 shadow-cyan-400/50', bg: 'from-cyan-400 to-teal-500' };
    } else if (tierLower.includes('gorilla 1') || tierLower.includes('gorilla1')) {
      return { logo: '/images/gallery/optimized/Gorilla1.png', border: 'border-blue-500 shadow-blue-500/50', bg: 'from-blue-500 to-blue-600' };
    } else if (tierLower.includes('crocodile 3')) {
      return { logo: '/images/gallery/optimized/crocodile3.png', border: 'border-emerald-500 shadow-emerald-500/50', bg: 'from-emerald-500 to-green-600' };
    } else if (tierLower.includes('crocodile 2')) {
      return { logo: '/images/gallery/optimized/crocodile2.png', border: 'border-emerald-500 shadow-emerald-500/50', bg: 'from-emerald-500 to-green-600' };
    } else if (tierLower.includes('crocodile 1')) {
      return { logo: '/images/gallery/optimized/crocodile1.png', border: 'border-emerald-500 shadow-emerald-500/50', bg: 'from-emerald-500 to-green-600' };
    } else if (tierLower.includes('fox 3')) {
      return { logo: '/images/gallery/optimized/fox3.png', border: 'border-slate-400 shadow-slate-400/50', bg: 'from-slate-400 to-gray-500' };
    } else if (tierLower.includes('fox 2')) {
      return { logo: '/images/gallery/optimized/fox2.png', border: 'border-slate-400 shadow-slate-400/50', bg: 'from-slate-400 to-gray-500' };
    } else if (tierLower.includes('fox 1')) {
      return { logo: '/images/gallery/optimized/fox1.png', border: 'border-slate-400 shadow-slate-400/50', bg: 'from-slate-400 to-gray-500' };
    } else if (tierLower.includes('rookie')) {
      return { logo: '/images/gallery/optimized/Rookie.png', border: 'border-amber-800 shadow-amber-800/50', bg: 'from-amber-800 to-orange-800' };
    } else {
      return { logo: '/images/gallery/optimized/unranked.png', border: 'border-gray-500 shadow-gray-500/50', bg: 'from-gray-400 to-gray-500' };
    }
  };

  // Search handlers
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (onSearchQueryChange) {
      onSearchQueryChange(value);
    }
    
    if (value.trim().length >= 2) {
      const suggestions = players.filter(player => 
        player.firstName.toLowerCase().includes(value.toLowerCase()) ||
        player.username.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (player: Player) => {
    const query = player.firstName + " (" + player.username + ")";
    setSearchQuery(query);
    if (onSearchQueryChange) {
      onSearchQueryChange(query);
    }
    setShowSuggestions(false);
    // Filter to show only this player
    setFilteredPlayers([player]);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSuggestions(false);
    setSearchSuggestions([]);
    // Reset to city filter or all players - trigger the useEffect for proper filtering
    // This will be handled by the useEffect that watches selectedCity and players
  };

  // City filter handler
  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setIsCityDropdownOpen(false);
    if (onCityChange) {
      onCityChange(city);
    }
    trackEvent('leaderboard_city_filter', 'user_action', city);
  };

  // Player Dashboard Component
  const FIFAPlayerCard = ({ player, onClose }: { player: Player; onClose: () => void }) => {
    // Calculate performance metrics
    const performanceData = {
      goals: player.goals || 0,
      assists: player.assists || 0,
      matches: player.gamesPlayed || 0,
      attack: Math.round(player.attackRatio || 0),
      defense: Math.round(player.defenseRatio || 0),
      score: parseFloat((player.globalScore || 0).toFixed(1))
    };

    // Calculate averages
    const goalsPerMatch = performanceData.matches > 0 ? (performanceData.goals / performanceData.matches).toFixed(2) : 0;
    const assistsPerMatch = performanceData.matches > 0 ? (performanceData.assists / performanceData.matches).toFixed(2) : 0;

    // Dynamic score-based styling system
    const getScoreBasedStyle = (score: number) => {
      // Normalize score to 0-10 scale (assuming max score is around 10)
      const normalizedScore = Math.min(score / 1.0, 10);
      
      if (normalizedScore >= 9) {
        // Legendary - Purple/Pink with intense effects
        return {
          borderGradient: 'from-purple-500 via-pink-500 via-rose-500 to-purple-500',
          avatarGradient: 'from-purple-600 via-pink-600 to-rose-600',
          bgGradient: 'from-purple-50 via-pink-50 to-rose-50',
          energyColor1: 'bg-purple-400',
          energyColor2: 'bg-pink-400',
          energyColor3: 'bg-rose-400',
          glowIntensity: 'opacity-40',
          blurIntensity: 'blur-3xl',
          spinSpeed: 'animate-spin-fast', // 3s - faster for legendary
          pulseSpeed: 'animate-pulse',
          borderWidth: 'p-2',
          energyBursts: 4,
          waveIntensity: 'opacity-30'
        };
      } else if (normalizedScore >= 7) {
        // Elite - Cyan/Blue with strong effects
        return {
          borderGradient: 'from-cyan-400 via-blue-500 via-indigo-500 to-cyan-400',
          avatarGradient: 'from-cyan-500 via-blue-600 to-indigo-600',
          bgGradient: 'from-cyan-50 via-blue-50 to-indigo-50',
          energyColor1: 'bg-cyan-400',
          energyColor2: 'bg-blue-400',
          energyColor3: 'bg-indigo-400',
          glowIntensity: 'opacity-30',
          blurIntensity: 'blur-2xl',
          spinSpeed: 'animate-spin-medium', // 5s - medium for elite
          pulseSpeed: 'animate-pulse',
          borderWidth: 'p-1.5',
          energyBursts: 3,
          waveIntensity: 'opacity-25'
        };
      } else if (normalizedScore >= 5) {
        // Advanced - Gold/Yellow with moderate effects
        return {
          borderGradient: 'from-yellow-400 via-amber-500 via-orange-500 to-yellow-400',
          avatarGradient: 'from-yellow-500 via-amber-600 to-orange-600',
          bgGradient: 'from-yellow-50 via-amber-50 to-orange-50',
          energyColor1: 'bg-yellow-400',
          energyColor2: 'bg-amber-400',
          energyColor3: 'bg-orange-400',
          glowIntensity: 'opacity-25',
          blurIntensity: 'blur-xl',
          spinSpeed: 'animate-spin-slow',
          pulseSpeed: 'animate-pulse',
          borderWidth: 'p-1',
          energyBursts: 2,
          waveIntensity: 'opacity-20'
        };
      } else if (normalizedScore >= 3) {
        // Intermediate - Silver/Gray with subtle effects
        return {
          borderGradient: 'from-gray-300 via-gray-400 via-slate-400 to-gray-300',
          avatarGradient: 'from-gray-400 via-slate-500 to-gray-500',
          bgGradient: 'from-gray-50 via-slate-50 to-gray-50',
          energyColor1: 'bg-gray-400',
          energyColor2: 'bg-slate-400',
          energyColor3: 'bg-gray-300',
          glowIntensity: 'opacity-20',
          blurIntensity: 'blur-lg',
          spinSpeed: 'animate-spin-slow',
          pulseSpeed: '',
          borderWidth: 'p-1',
          energyBursts: 1,
          waveIntensity: 'opacity-15'
        };
      } else {
        // Beginner - Bronze/Copper with minimal effects
        return {
          borderGradient: 'from-amber-700 via-orange-600 via-red-600 to-amber-700',
          avatarGradient: 'from-amber-600 via-orange-500 to-red-500',
          bgGradient: 'from-amber-50 via-orange-50 to-red-50',
          energyColor1: 'bg-amber-400',
          energyColor2: 'bg-orange-400',
          energyColor3: '',
          glowIntensity: 'opacity-15',
          blurIntensity: 'blur-md',
          spinSpeed: 'animate-spin-slow',
          pulseSpeed: '',
          borderWidth: 'p-0.5',
          energyBursts: 1,
          waveIntensity: 'opacity-10'
        };
      }
    };

    const scoreStyle = getScoreBasedStyle(performanceData.score);

    return (
      <Dialog open={showPlayerCard} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-7xl w-full mx-auto p-0 bg-transparent border-none" aria-describedby="player-dashboard-description">
          <DialogHeader className="sr-only">
            <DialogTitle>Player Dashboard for {player.username}</DialogTitle>
          </DialogHeader>
              
          <div className="relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Close Button */}
              <button
                onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10"
              >
              <FiX className="w-5 h-5 text-gray-600" />
              </button>

            {/* Desktop Layout */}
            <div className="hidden md:flex h-[80vh]">
              {/* Left Side - Player Body Placeholder */}
              <div className={`w-1/3 bg-gradient-to-br ${scoreStyle.bgGradient} p-8 flex flex-col items-center justify-center relative overflow-hidden`}>
                {/* Animated background energy waves - Dynamic intensity */}
                <div className={`absolute inset-0 ${scoreStyle.waveIntensity}`}>
                  <div className={`absolute top-0 left-1/4 w-64 h-64 ${scoreStyle.energyColor1} rounded-full ${scoreStyle.blurIntensity} ${scoreStyle.pulseSpeed}`}></div>
                  <div className={`absolute bottom-0 right-1/4 w-64 h-64 ${scoreStyle.energyColor2} rounded-full ${scoreStyle.blurIntensity} ${scoreStyle.pulseSpeed}`} style={{ animationDelay: '1s' }}></div>
                  {scoreStyle.energyBursts >= 3 && (
                    <div className={`absolute top-1/2 right-1/4 w-48 h-48 ${scoreStyle.energyColor3} rounded-full ${scoreStyle.blurIntensity} ${scoreStyle.pulseSpeed}`} style={{ animationDelay: '0.5s' }}></div>
                  )}
                </div>
                
                <div className="text-center relative z-10">
                  {/* Sporty Energetic Avatar - Dynamic based on score */}
                  <div className="relative mb-8">
                    {/* Outer energy ring - Dynamic colors and intensity */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-56 h-56 rounded-full bg-gradient-to-r ${scoreStyle.borderGradient} ${scoreStyle.glowIntensity} ${scoreStyle.spinSpeed} ${scoreStyle.blurIntensity}`}></div>
                    </div>
                    
                    {/* Pulsing glow effect - Dynamic intensity */}
                    {scoreStyle.pulseSpeed && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-48 h-48 rounded-full bg-gradient-to-br ${scoreStyle.avatarGradient} ${scoreStyle.glowIntensity} animate-ping`} style={{ animationDuration: '2s' }}></div>
                      </div>
                    )}
                    
                    {/* Main avatar container */}
                    <div className="relative w-48 h-48 mx-auto">
                      {/* Rotating border with energy effect - Dynamic gradient */}
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${scoreStyle.borderGradient} ${scoreStyle.spinSpeed} ${scoreStyle.borderWidth}`}>
                        <div className={`w-full h-full rounded-full bg-gradient-to-br ${scoreStyle.bgGradient}`}></div>
                      </div>
                      
                      {/* Inner avatar circle - Dynamic gradient */}
                      <div className={`absolute inset-2 rounded-full bg-gradient-to-br ${scoreStyle.avatarGradient} flex items-center justify-center shadow-2xl border-4 border-white`}>
                        <span className="text-7xl font-black text-white drop-shadow-lg">
                          {player.firstName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      {/* Energy burst effects - Dynamic count and colors */}
                      {scoreStyle.energyBursts >= 1 && (
                        <div className={`absolute -top-2 -right-2 w-8 h-8 ${scoreStyle.energyColor1} rounded-full ${scoreStyle.pulseSpeed} shadow-lg ${scoreStyle.energyColor1}/50`}></div>
                      )}
                      {scoreStyle.energyBursts >= 2 && (
                        <div className={`absolute -bottom-2 -left-2 w-6 h-6 ${scoreStyle.energyColor2} rounded-full ${scoreStyle.pulseSpeed} shadow-lg ${scoreStyle.energyColor2}/50`} style={{ animationDelay: '0.5s' }}></div>
                      )}
                      {scoreStyle.energyBursts >= 3 && (
                        <div className={`absolute top-1/2 -right-2 w-5 h-5 ${scoreStyle.energyColor3} rounded-full ${scoreStyle.pulseSpeed} shadow-lg ${scoreStyle.energyColor3}/50`} style={{ animationDelay: '1s' }}></div>
                      )}
                      {scoreStyle.energyBursts >= 4 && (
                        <div className={`absolute top-1/2 -left-2 w-5 h-5 ${scoreStyle.energyColor1} rounded-full ${scoreStyle.pulseSpeed} shadow-lg ${scoreStyle.energyColor1}/50`} style={{ animationDelay: '1.5s' }}></div>
                      )}
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">{player.firstName}</h2>
                  <p className="text-gray-600 mb-6 text-lg font-semibold">@{player.username}</p>
                  <div className="bg-white rounded-xl p-5 shadow-xl border-2 border-blue-200 transform hover:scale-105 transition-transform">
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">{performanceData.score}</div>
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Global Score</div>
                  </div>
                </div>
              </div>

              {/* Right Side - Statistics Dashboard */}
              <div className="w-2/3 p-8 overflow-y-auto">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Player Dashboard</h1>
                  <p className="text-gray-600">Detailed statistics and performance analytics</p>
                  </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">{performanceData.goals}</div>
                    <div className="text-sm text-gray-600">Goals</div>
                </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{performanceData.assists}</div>
                    <div className="text-sm text-gray-600">Assists</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{performanceData.attack}%</div>
                    <div className="text-sm text-gray-600">Attack</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{performanceData.defense}%</div>
                    <div className="text-sm text-gray-600">Defense</div>
                </div>
              </div>

                {/* Performance Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Goals vs Assists Chart */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Goals vs Assists</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Goals</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${Math.min((performanceData.goals / 20) * 100, 100)}%` }}
                            ></div>
                  </div>
                          <span className="text-sm font-medium">{performanceData.goals}</span>
                </div>
                  </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Assists</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full" 
                              style={{ width: `${Math.min((performanceData.assists / 20) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{performanceData.assists}</span>
                        </div>
                      </div>
                    </div>
              </div>

                  {/* Attack vs Defense Chart */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Attack vs Defense</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Attack</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full" 
                              style={{ width: `${performanceData.attack}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{performanceData.attack}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Defense</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${performanceData.defense}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{performanceData.defense}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>

                {/* Detailed Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-lg border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Matches</span>
                        <span className="font-semibold">{performanceData.matches}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Goals per Match</span>
                        <span className="font-semibold">{goalsPerMatch}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assists per Match</span>
                        <span className="font-semibold">{assistsPerMatch}</span>
                      </div>
                    </div>
              </div>

                  <div className="bg-white rounded-xl p-6 shadow-lg border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Rating</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Global Score</span>
                        <span className="font-semibold text-blue-600">{performanceData.score}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Global Rank</span>
                        <span className="font-semibold">
                          {player.rank > 0 ? `#${player.rank}` : ''}
                          {(() => {
                            const displayTier = player.rankTier || getRankTierFromScore(player.globalScore, player.rank);
                            const tierLower = displayTier.toLowerCase();
                            
                            let badgeClass = '';
                            if (tierLower.includes('predator')) {
                              badgeClass = 'bg-red-100 text-red-700 border border-red-300';
                            } else if (tierLower.includes('goat')) {
                              badgeClass = 'bg-purple-100 text-purple-700 border border-purple-300';
                            } else if (tierLower.includes('gorilla')) {
                              badgeClass = 'bg-blue-100 text-blue-700 border border-blue-300';
                            } else if (tierLower.includes('crocodile')) {
                              badgeClass = 'bg-green-100 text-green-700 border border-green-300';
                            } else if (tierLower.includes('fox')) {
                              badgeClass = 'bg-orange-100 text-orange-700 border border-orange-300';
                            } else if (tierLower.includes('rookie')) {
                              badgeClass = 'bg-amber-100 text-amber-700 border border-amber-300';
                            } else if (tierLower.includes('unranked')) {
                              badgeClass = 'bg-gray-100 text-gray-600 border border-gray-300';
                            } else {
                              badgeClass = 'bg-blue-100 text-blue-700 border border-blue-300';
                            }
                            
                            return (
                              <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${badgeClass}`}>
                                {displayTier}
                              </span>
                            );
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">City</span>
                        <span className="font-semibold">{player.city}</span>
                      </div>
                      {player.level && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Level</span>
                          <span className={`font-semibold px-2 py-1 rounded text-xs ${
                            getLevelBadgeColor(getLevelNumericValue(player.level))
                          }`}>
                            {player.level}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-lg border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Stats</h3>
                    <div className="space-y-3">
                      {player.individualScore && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Individual Score</span>
                          <span className="font-semibold">{player.individualScore.toFixed(1)}</span>
                        </div>
                      )}
                      {player.teamScore && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Team Score</span>
                          <span className="font-semibold">{player.teamScore.toFixed(1)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Team Wins</span>
                        <span className="font-semibold">{player.teamWins || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden max-h-[90vh] overflow-y-auto">
              {/* Mobile Header - Player Info */}
              <div className={`bg-gradient-to-br ${scoreStyle.bgGradient} p-6 text-center relative overflow-hidden`}>
                {/* Animated background energy waves - Dynamic intensity */}
                <div className={`absolute inset-0 ${scoreStyle.waveIntensity}`}>
                  <div className={`absolute top-0 left-1/4 w-48 h-48 ${scoreStyle.energyColor1} rounded-full ${scoreStyle.blurIntensity} ${scoreStyle.pulseSpeed}`}></div>
                  <div className={`absolute bottom-0 right-1/4 w-48 h-48 ${scoreStyle.energyColor2} rounded-full ${scoreStyle.blurIntensity} ${scoreStyle.pulseSpeed}`} style={{ animationDelay: '1s' }}></div>
                  {scoreStyle.energyBursts >= 3 && (
                    <div className={`absolute top-1/2 right-1/4 w-36 h-36 ${scoreStyle.energyColor3} rounded-full ${scoreStyle.blurIntensity} ${scoreStyle.pulseSpeed}`} style={{ animationDelay: '0.5s' }}></div>
                  )}
                </div>
                
                <div className="relative z-10">
                  {/* Sporty Energetic Avatar - Dynamic based on score */}
                  <div className="relative mb-6">
                    {/* Outer energy ring - Dynamic colors and intensity */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-40 h-40 rounded-full bg-gradient-to-r ${scoreStyle.borderGradient} ${scoreStyle.glowIntensity} ${scoreStyle.spinSpeed} ${scoreStyle.blurIntensity}`}></div>
                    </div>
                    
                    {/* Pulsing glow effect - Dynamic intensity */}
                    {scoreStyle.pulseSpeed && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-36 h-36 rounded-full bg-gradient-to-br ${scoreStyle.avatarGradient} ${scoreStyle.glowIntensity} animate-ping`} style={{ animationDuration: '2s' }}></div>
                      </div>
                    )}
                    
                    {/* Main avatar container */}
                    <div className="relative w-36 h-36 mx-auto">
                      {/* Rotating border with energy effect - Dynamic gradient */}
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${scoreStyle.borderGradient} ${scoreStyle.spinSpeed} ${scoreStyle.borderWidth}`}>
                        <div className={`w-full h-full rounded-full bg-gradient-to-br ${scoreStyle.bgGradient}`}></div>
                      </div>
                      
                      {/* Inner avatar circle - Dynamic gradient */}
                      <div className={`absolute inset-2 rounded-full bg-gradient-to-br ${scoreStyle.avatarGradient} flex items-center justify-center shadow-2xl border-4 border-white`}>
                        <span className="text-5xl font-black text-white drop-shadow-lg">
                          {player.firstName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      {/* Energy burst effects - Dynamic count and colors */}
                      {scoreStyle.energyBursts >= 1 && (
                        <div className={`absolute -top-1 -right-1 w-6 h-6 ${scoreStyle.energyColor1} rounded-full ${scoreStyle.pulseSpeed} shadow-lg ${scoreStyle.energyColor1}/50`}></div>
                      )}
                      {scoreStyle.energyBursts >= 2 && (
                        <div className={`absolute -bottom-1 -left-1 w-5 h-5 ${scoreStyle.energyColor2} rounded-full ${scoreStyle.pulseSpeed} shadow-lg ${scoreStyle.energyColor2}/50`} style={{ animationDelay: '0.5s' }}></div>
                      )}
                      {scoreStyle.energyBursts >= 3 && (
                        <div className={`absolute top-1/2 -right-1 w-4 h-4 ${scoreStyle.energyColor3} rounded-full ${scoreStyle.pulseSpeed} shadow-lg ${scoreStyle.energyColor3}/50`} style={{ animationDelay: '1s' }}></div>
                      )}
                      {scoreStyle.energyBursts >= 4 && (
                        <div className={`absolute top-1/2 -left-1 w-4 h-4 ${scoreStyle.energyColor1} rounded-full ${scoreStyle.pulseSpeed} shadow-lg ${scoreStyle.energyColor1}/50`} style={{ animationDelay: '1.5s' }}></div>
                      )}
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">{player.firstName}</h2>
                  <p className="text-gray-600 mb-4 text-base font-semibold">@{player.username}</p>
                  <div className="bg-white rounded-xl p-4 shadow-xl border-2 border-blue-200 inline-block">
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">{performanceData.score}</div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Global Score</div>
                  </div>
                </div>
              </div>

              {/* Mobile Content */}
              <div className="p-4">
                <div className="mb-4">
                  <h1 className="text-xl font-bold text-gray-900 mb-1">Player Dashboard</h1>
                  <p className="text-sm text-gray-600">Performance analytics</p>
                  </div>

                {/* Mobile Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-green-600 mb-1">{performanceData.goals}</div>
                    <div className="text-xs text-gray-600">Goals</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-purple-600 mb-1">{performanceData.assists}</div>
                    <div className="text-xs text-gray-600">Assists</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-orange-600 mb-1">{performanceData.attack}%</div>
                    <div className="text-xs text-gray-600">Attack</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-blue-600 mb-1">{performanceData.defense}%</div>
                    <div className="text-xs text-gray-600">Defense</div>
                  </div>
              </div>

                {/* Mobile Performance Charts */}
                <div className="space-y-4 mb-6">
                  {/* Goals vs Assists Chart */}
                  <div className="bg-white rounded-lg p-4 shadow-md border">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Goals vs Assists</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Goals</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${Math.min((performanceData.goals / 20) * 100, 100)}%` }}
                            ></div>
                  </div>
                          <span className="text-xs font-medium">{performanceData.goals}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Assists</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full" 
                              style={{ width: `${Math.min((performanceData.assists / 20) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">{performanceData.assists}</span>
                        </div>
                      </div>
                    </div>
              </div>

                  {/* Attack vs Defense Chart */}
                  <div className="bg-white rounded-lg p-4 shadow-md border">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Attack vs Defense</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Attack</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full" 
                              style={{ width: `${performanceData.attack}%` }}
                            ></div>
                    </div>
                          <span className="text-xs font-medium">{performanceData.attack}%</span>
                </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Defense</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${performanceData.defense}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">{performanceData.defense}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Detailed Statistics */}
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-md border">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Match Statistics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Total Matches</span>
                        <span className="text-sm font-semibold">{performanceData.matches}</span>
            </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Goals per Match</span>
                        <span className="text-sm font-semibold">{goalsPerMatch}</span>
          </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Assists per Match</span>
                        <span className="text-sm font-semibold">{assistsPerMatch}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-md border">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Performance Rating</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Global Score</span>
                        <span className="text-sm font-semibold text-blue-600">{performanceData.score}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Global Rank</span>
                        <span className="text-sm font-semibold">
                          {player.rank > 0 ? `#${player.rank}` : ''}
                          {(() => {
                            const displayTier = player.rankTier || getRankTierFromScore(player.globalScore, player.rank);
                            const tierLower = displayTier.toLowerCase();
                            
                            let badgeClass = '';
                            if (tierLower.includes('predator')) {
                              badgeClass = 'bg-red-100 text-red-700 border border-red-300';
                            } else if (tierLower.includes('goat')) {
                              badgeClass = 'bg-purple-100 text-purple-700 border border-purple-300';
                            } else if (tierLower.includes('gorilla')) {
                              badgeClass = 'bg-blue-100 text-blue-700 border border-blue-300';
                            } else if (tierLower.includes('crocodile')) {
                              badgeClass = 'bg-green-100 text-green-700 border border-green-300';
                            } else if (tierLower.includes('fox')) {
                              badgeClass = 'bg-orange-100 text-orange-700 border border-orange-300';
                            } else if (tierLower.includes('rookie')) {
                              badgeClass = 'bg-amber-100 text-amber-700 border border-amber-300';
                            } else if (tierLower.includes('unranked')) {
                              badgeClass = 'bg-gray-100 text-gray-600 border border-gray-300';
                            } else {
                              badgeClass = 'bg-blue-100 text-blue-700 border border-blue-300';
                            }
                            
                            return (
                              <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${badgeClass}`}>
                                {displayTier}
                              </span>
                            );
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">City</span>
                        <span className="text-sm font-semibold">{player.city}</span>
                      </div>
                      {player.level && (
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">Level</span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            getLevelBadgeColor(getLevelNumericValue(player.level))
                          }`}>
                            {player.level}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-md border">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Advanced Stats</h3>
                    <div className="space-y-2">
                      {player.individualScore && (
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">Individual Score</span>
                          <span className="text-sm font-semibold">{player.individualScore.toFixed(1)}</span>
                        </div>
                      )}
                      {player.teamScore && (
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">Team Score</span>
                          <span className="text-sm font-semibold">{player.teamScore.toFixed(1)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Team Wins</span>
                        <span className="text-sm font-semibold">{player.teamWins || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div id="player-dashboard-description" className="sr-only">
            Comprehensive player dashboard showing detailed statistics, charts, and analytics for {player.username}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Contenu en fonction de la langue
  const content = language === 'ar' ? {
    title: "لوحة الصدارة",
    subtitle: "أفضل لاعبي رايو سبورت",
    rank: "المرتبة",
    cityRank: "ترتيب المدينة",
    firstName: "الاسم",
    username: "اسم المستخدم",
    city: "المدينة",
    score: "النقاط",
    matches: "المباريات",
    goals: "الأهداف",
    assists: "التمريرات",
    teamWins: "انتصارات الفريق",
    teamWinsDesc: "المباريات الفردية (5 دقائق)",
    allCities: "جميع المدن",
    filterBy: "تصفية حسب المدينة",
    noData: "لا توجد بيانات متاحة حالياً",
    error: "خطأ في تحميل البيانات",
    showMore: "عرض المزيد",
    showLess: "عرض أقل"
  } : {
    title: "Leaderboard",
    subtitle: "Les meilleurs joueurs Rayo Sport",
    rank: "Rang Global",
    cityRank: "Rang Ville",
    firstName: "Prénom",
    username: "Username",
    city: "Ville",
    score: "Score Global",
    matches: "Matchs",
    goals: "Buts",
    assists: "Passes",
    teamWins: "Team Wins",
    teamWinsDesc: "Matchs individuels (5 min)",
    allCities: "Toutes les villes",
    filterBy: "Filtrer par ville",
    noData: "Aucune donnée disponible pour le moment",
    error: "Erreur lors du chargement des données",
    showMore: "Voir plus",
    showLess: "Voir moins"
  };

  // Fonction pour parser les données CSV
  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.split('\n');
    return lines.map(line => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current);
      return result;
    });
  };

  // Get rank tier name based on score (matching Google Sheets formula)
  const getRankTierFromScore = (score: number, rank: number): string => {
    if (score === 0) return "Unranked";
    if (score < 50) return "Rookie";
    if (score < 100) return "FOX 1";
    if (score < 150) return "FOX 2";
    if (score < 250) return "FOX 3";
    if (score < 400) return "Crocodile 1";
    if (score < 600) return "Crocodile 2";
    if (score < 900) return "Crocodile 3";
    if (score < 1200) return "Gorilla 1";
    if (score < 1600) return "Gorilla 2";
    if (score < 2100) return "Gorilla 3";
    if (score < 2600) return "Goat 1";
    if (score < 3300) return "Goat 2";
    if (score < 4000) return "Goat 3";
    if (score >= 4000 && rank <= 10) return `Predator #${rank}`;
    return "Goat 3";
  };

  // Fonction pour récupérer les données depuis Google Sheets CSV avec fallback vers fichier statique
  const fetchLeaderboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Essayer d'abord Google Sheets - MUST use Foot_Players sheet (gid=1681767418)
      const csvUrl = customDataSources?.leaderboard || DEFAULT_GOOGLE_SHEETS_CONFIG.csvUrl;
      console.log('🔍 Leaderboard fetching from Foot_Players sheet (gid=1681767418):', csvUrl);
      // Use default cache - browser will cache for better performance
      const response = await fetch(csvUrl, { cache: 'default', redirect: 'follow', headers: { 'Accept': 'text/csv,text/plain,*/*' } });
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const csvText = await response.text();
      console.log('📄 Leaderboard CSV length:', csvText.length);
      console.log('📄 Leaderboard CSV first 300 chars:', csvText.substring(0, 300));
      
      if (csvText.includes('<!DOCTYPE html>') || csvText.includes('Page introuvable') || csvText.includes('<TITLE>Temporary Redirect</TITLE>')) {
        throw new Error('Google Sheets a retourné une page d\'erreur HTML au lieu des données CSV');
      }
      
      const rows = parseCSV(csvText);
      
      if (rows.length > 1) { // Ignorer la première ligne (en-têtes)
        // Extract headers from first row
        const headers = rows[0] || [];
        
        // Find column indices by header name (case-insensitive) - more robust than position-based
        const getColumnIndex = (name: string): number => {
          const lowerName = name.toLowerCase();
          return headers.findIndex(h => h.toLowerCase().includes(lowerName) || lowerName.includes(h.toLowerCase()));
        };
        
        // Find Rank column - try multiple variations
        const rankIdx = (() => {
          const rankIndex = getColumnIndex('Rank');
          if (rankIndex >= 0) return rankIndex;
          const rangIndex = getColumnIndex('Rang');
          if (rangIndex >= 0) return rangIndex;
          const globalRankIndex = getColumnIndex('Global Rank');
          if (globalRankIndex >= 0) return globalRankIndex;
          // Fallback to position 0 if not found
          return 0;
        })();
        const cityRankIdx = getColumnIndex('City Rank') >= 0 ? getColumnIndex('City Rank') : 
                           (getColumnIndex('Rang Ville') >= 0 ? getColumnIndex('Rang Ville') : 1);
        const playerUsernameIdx = getColumnIndex('PlayerUsername') >= 0 ? getColumnIndex('PlayerUsername') : 
                                 (getColumnIndex('Username') >= 0 ? getColumnIndex('Username') : 
                                 (getColumnIndex('Player') >= 0 ? getColumnIndex('Player') : 2));
        const cityIdx = getColumnIndex('City') >= 0 ? getColumnIndex('City') : 
                       (getColumnIndex('Ville') >= 0 ? getColumnIndex('Ville') : 3);
        const globalScoreIdx = getColumnIndex('Global Score') >= 0 ? getColumnIndex('Global Score') : 
                              (getColumnIndex('Score') >= 0 ? getColumnIndex('Score') : 5);
        const gamesPlayedIdx = getColumnIndex('Games Played') >= 0 ? getColumnIndex('Games Played') : 
                              (getColumnIndex('TGame') >= 0 ? getColumnIndex('TGame') : 
                              (getColumnIndex('Matches') >= 0 ? getColumnIndex('Matches') : 6));
        const goalsIdx = getColumnIndex('Goals') >= 0 ? getColumnIndex('Goals') : 
                        (getColumnIndex('TGoals') >= 0 ? getColumnIndex('TGoals') : 7);
        const assistsIdx = getColumnIndex('Assists') >= 0 ? getColumnIndex('Assists') : 8;
        const teamWinsIdx = getColumnIndex('Team Wins') >= 0 ? getColumnIndex('Team Wins') : 
                           (getColumnIndex('Wins') >= 0 ? getColumnIndex('Wins') : 9);
        const attackRatioIdx = getColumnIndex('Attack') >= 0 ? getColumnIndex('Attack') : 
                              (getColumnIndex('ATT') >= 0 ? getColumnIndex('ATT') : 10);
        const defenseRatioIdx = getColumnIndex('Defense') >= 0 ? getColumnIndex('Defense') : 
                               (getColumnIndex('DEF') >= 0 ? getColumnIndex('DEF') : 11);
        const individualScoreIdx = getColumnIndex('Individual Score') >= 0 ? getColumnIndex('Individual Score') : 
                                  (getColumnIndex('Individuel') >= 0 ? getColumnIndex('Individuel') : 12);
        const teamScoreIdx = getColumnIndex('Team Score') >= 0 ? getColumnIndex('Team Score') : 13;
        const paymentTypeIdx = getColumnIndex('Payment') >= 0 ? getColumnIndex('Payment') : 
                              (getColumnIndex('Paiement') >= 0 ? getColumnIndex('Paiement') : 16);
        const levelIdx = getColumnIndex('Level') >= 0 ? getColumnIndex('Level') : 
                        (getColumnIndex('Niveau') >= 0 ? getColumnIndex('Niveau') : -1);
        // RankLevel column
        const rankLevelIdx = getColumnIndex('RankLevel') >= 0 ? getColumnIndex('RankLevel') : 
                            (getColumnIndex('Rank Level') >= 0 ? getColumnIndex('Rank Level') : -1);
        // Points column (for leaderboard, different from MonthlyPoints)
        const pointsIdx = (() => {
          // Try exact match first
          const exactMatch = headers.findIndex(h => h.toLowerCase().trim() === 'points');
          if (exactMatch >= 0) return exactMatch;
          // Try getColumnIndex as fallback
          const pointsIndex = getColumnIndex('Points');
          if (pointsIndex >= 0) return pointsIndex;
          return -1;
        })();
        // MonthlyPoints - be specific, don't match "Points" alone
        const monthlyPointsIdx = (() => {
          const exactMatch = headers.findIndex(h => h.toLowerCase().trim() === 'monthlypoints');
          if (exactMatch >= 0) return exactMatch;
          const spacedMatch = headers.findIndex(h => h.toLowerCase().trim() === 'monthly points');
          if (spacedMatch >= 0) return spacedMatch;
          const frenchMatch = headers.findIndex(h => h.toLowerCase().trim() === 'points mensuels');
          if (frenchMatch >= 0) return frenchMatch;
          // Only match if it contains "monthly" to avoid matching just "Points"
          const containsMonthly = headers.findIndex(h => h.toLowerCase().includes('monthly') && h.toLowerCase().includes('point'));
          if (containsMonthly >= 0) return containsMonthly;
          return -1;
        })();
        
        console.log('📊 Foot_Players Headers found:', {
          Rank: rankIdx,
          CityRank: cityRankIdx,
          PlayerUsername: playerUsernameIdx,
          City: cityIdx,
          GlobalScore: globalScoreIdx,
          GamesPlayed: gamesPlayedIdx,
          Goals: goalsIdx,
          Assists: assistsIdx,
          TeamWins: teamWinsIdx,
          AttackRatio: attackRatioIdx,
          DefenseRatio: defenseRatioIdx,
          IndividualScore: individualScoreIdx,
          TeamScore: teamScoreIdx,
          PaymentType: paymentTypeIdx,
          Level: levelIdx,
          RankLevel: rankLevelIdx,
          Points: pointsIdx,
          MonthlyPoints: monthlyPointsIdx,
          'All headers': headers
        });
        
        // Find RayoSupport column index
        const rayoSupportIdx = (() => {
          const exactMatch = headers.findIndex(h => h.toLowerCase().trim() === 'rayosupport');
          if (exactMatch >= 0) return exactMatch;
          const spacedMatch = headers.findIndex(h => h.toLowerCase().trim() === 'rayo support');
          if (spacedMatch >= 0) return spacedMatch;
          const byName = getColumnIndex('RayoSupport');
          if (byName >= 0) return byName;
          return -1;
        })();
        
        const rayoSupportMap = new Map<string, boolean>();
        
        const playersData = rows.slice(1)
          .filter(row => {
            const playerUsername = playerUsernameIdx >= 0 ? row[playerUsernameIdx]?.trim() : '';
            return playerUsername && playerUsername !== '' && playerUsername !== '#VALUE!' && playerUsername !== '#N/A';
          })
          .map((row: string[]) => {
            // Parse the score properly handling European decimal format (comma as decimal separator)
            const rawScore = globalScoreIdx >= 0 ? row[globalScoreIdx] : '';
            let parsedScore = 0;
            
            if (rawScore) {
              // Convert European decimal format (comma) to standard format (dot)
              const cleanScore = rawScore.toString().replace(',', '.').trim();
              parsedScore = parseFloat(cleanScore);
              
              if (isNaN(parsedScore)) {
                parsedScore = 0;
              }
            }
            
            // Parse additional statistics with proper decimal handling
            const parseDecimal = (value: string) => {
              if (!value || value.trim() === '') return undefined;
              const cleanValue = value.toString().replace(',', '.').trim();
              const parsed = parseFloat(cleanValue);
              return isNaN(parsed) ? undefined : parsed;
            };

            // Get PlayerUsername from correct column
            const playerUsername = playerUsernameIdx >= 0 ? (row[playerUsernameIdx]?.trim() || 'Username') : 'Username';
            const firstName = playerUsername.split(' ')[0] || playerUsername; // Extract first part as name
            
            // Parse payment type from CSV to determine payment status
            const paymentType = paymentTypeIdx >= 0 ? (row[paymentTypeIdx]?.toString().toLowerCase().trim() || '') : '';
            
            // Parse subscriber balance from SubGamesLeft column
            let subGamesLeft = 0;
            const subGamesLeftIdx = getColumnIndex('SubGamesLeft');
            if (subGamesLeftIdx >= 0) {
              const subGamesLeftValue = row[subGamesLeftIdx]?.trim();
              if (subGamesLeftValue && subGamesLeftValue !== '#REF!' && subGamesLeftValue !== '#N/A' && subGamesLeftValue !== '#ERROR!' && subGamesLeftValue !== '') {
                subGamesLeft = parseInt(subGamesLeftValue) || 0;
              }
            }

            // Parse expiration date from ExpirationDate column
            let expirationDate = '';
            const expirationDateIdx = getColumnIndex('ExpirationDate');
            if (expirationDateIdx >= 0) {
              const expirationDateValue = row[expirationDateIdx]?.trim();
              if (expirationDateValue && expirationDateValue !== '#REF!' && expirationDateValue !== '#N/A' && expirationDateValue !== '#ERROR!' && expirationDateValue !== '') {
                expirationDate = expirationDateValue;
              }
            }

            // Parse MVP count from TMVP🔒 column
            let mvpCount = 0;
            const mvpCountIdx = getColumnIndex('TMVP');
            if (mvpCountIdx >= 0) {
              const mvpCountValue = row[mvpCountIdx]?.trim();
              if (mvpCountValue && mvpCountValue !== '#REF!' && mvpCountValue !== '#N/A' && mvpCountValue !== '#ERROR!' && mvpCountValue !== '') {
                mvpCount = parseInt(mvpCountValue) || 0;
              }
            }

            // Parse Level from Level column
            let level = '';
            if (levelIdx >= 0) {
              const levelValue = row[levelIdx]?.trim();
              if (levelValue && levelValue !== '#REF!' && levelValue !== '#N/A' && levelValue !== '#ERROR!' && levelValue !== '') {
                level = levelValue;
              }
            }

            // Parse RankLevel from RankLevel column
            let rankLevel = '';
            if (rankLevelIdx >= 0) {
              const rankLevelValue = row[rankLevelIdx]?.trim();
              if (rankLevelValue && rankLevelValue !== '#REF!' && rankLevelValue !== '#N/A' && rankLevelValue !== '#ERROR!' && rankLevelValue !== '') {
                rankLevel = rankLevelValue;
              }
            }

            // Parse Points from Points column (for leaderboard)
            let points: number | undefined = undefined;
            if (pointsIdx >= 0) {
              const pointsValue = row[pointsIdx]?.trim();
              if (pointsValue && pointsValue !== '#REF!' && pointsValue !== '#N/A' && pointsValue !== '#ERROR!' && pointsValue !== '') {
                const parsedPoints = parseFloat(pointsValue.replace(',', '.'));
                if (!isNaN(parsedPoints)) {
                  points = parsedPoints;
                }
              }
            }

            // Parse MonthlyPoints from MonthlyPoints column
            let monthlyPoints = 0;
            if (monthlyPointsIdx >= 0) {
              const monthlyPointsValue = row[monthlyPointsIdx]?.trim();
              if (monthlyPointsValue && monthlyPointsValue !== '#REF!' && monthlyPointsValue !== '#N/A' && monthlyPointsValue !== '#ERROR!' && monthlyPointsValue !== '') {
                const parsedPoints = parseFloat(monthlyPointsValue.replace(',', '.'));
                if (!isNaN(parsedPoints)) {
                  monthlyPoints = parsedPoints;
                }
              }
            }
            
            // Parse RayoSupport
            let rayoSupportValue = false;
            if (rayoSupportIdx >= 0 && rayoSupportIdx < row.length) {
              const rayoSupportVal = row[rayoSupportIdx]?.trim();
              if (rayoSupportVal && 
                  rayoSupportVal !== '#REF!' && 
                  rayoSupportVal !== '#N/A' && 
                  rayoSupportVal !== '#ERROR!' && 
                  rayoSupportVal !== '' &&
                  rayoSupportVal !== '#VALUE!') {
                rayoSupportValue = rayoSupportVal === '1' || rayoSupportVal.toLowerCase() === 'true' || rayoSupportVal.toLowerCase() === 'yes';
              }
            }
            
            // Store rayoSupport in map
            if (playerUsername && rayoSupportValue) {
              rayoSupportMap.set(playerUsername.toLowerCase().trim(), true);
            }
            
            // Get values using header-based indices
            // Parse Rank - could be numeric or tier string (Predator, Gold, etc.)
            const rankValue = rankIdx >= 0 ? (row[rankIdx]?.trim() || '') : '';
            let rank = 0;
            let rankTier: string | undefined = undefined;
            
            // Try to parse as number first
            const parsedRank = parseInt(rankValue);
            if (!isNaN(parsedRank) && rankValue !== '') {
              rank = parsedRank;
            } else if (rankValue && rankValue !== '#REF!' && rankValue !== '#N/A' && rankValue !== '#ERROR!') {
              // It's a string tier like "Predator", "Gold", etc.
              rankTier = rankValue;
            }
            
            const cityRank = cityRankIdx >= 0 ? (parseInt(row[cityRankIdx]) || 0) : 0;
            const city = cityIdx >= 0 ? convertToFrench(row[cityIdx] || 'Non spécifié') : 'Non spécifié';
            const gamesPlayed = gamesPlayedIdx >= 0 ? (parseInt(row[gamesPlayedIdx]) || 0) : 0;
            
            return {
              rank: rank,
              cityRank: cityRank,
              rankTier: rankTier,  // Rank tier from Rank column (Predator, Gold, etc.)
              firstName: firstName,
              username: playerUsername,
              city: city,
              globalScore: parsedScore,
              gamesPlayed: gamesPlayed,
              goals: goalsIdx >= 0 ? (parseInt(row[goalsIdx]) || 0) : 0,
              assists: assistsIdx >= 0 ? (parseInt(row[assistsIdx]) || 0) : 0,
              teamWins: teamWinsIdx >= 0 ? (parseInt(row[teamWinsIdx]) || 0) : 0,
              attackRatio: attackRatioIdx >= 0 ? parseDecimal(row[attackRatioIdx]) : undefined,
              defenseRatio: defenseRatioIdx >= 0 ? parseDecimal(row[defenseRatioIdx]) : undefined,
              individualScore: individualScoreIdx >= 0 ? parseDecimal(row[individualScoreIdx]) : undefined,
              teamScore: teamScoreIdx >= 0 ? parseDecimal(row[teamScoreIdx]) : undefined,
              solde: subGamesLeft,
              expirationDate: expirationDate,
              mvpCount: mvpCount,
              level: level || undefined,  // Level from Level column
              rankLevel: rankLevel || undefined,  // RankLevel from RankLevel column
              points: points,  // Points from Points column (for leaderboard)
              monthlyPoints: monthlyPoints || undefined,  // MonthlyPoints from MonthlyPoints column
              isNewPlayer: gamesPlayed === 0,
              paymentStatus: (() => {
                if (paymentType === 'sub' || paymentType === 'subscription') {
                  return "Subscription" as const;
                } else if (paymentType === 'payé' || paymentType === 'paid') {
                  return "Payé" as const;
                } else if (paymentType === 'non payé' || paymentType === 'unpaid') {
                  return "Non payé" as const;
                } else if (gamesPlayed === 0) {
                  return "Nouveau joueur" as const;
                } else {
                  return "Non payé" as const;
                }
              })()
            };
          });
        
        // Use ranks from CSV if available, otherwise sort by Global Score and assign ranks
        // Check if ranks are already provided in the CSV (non-zero values)
        const hasRanksFromCSV = playersData.some(p => p.rank > 0);
        
        let rankedPlayers: Player[];
        if (hasRanksFromCSV) {
          // Use ranks from CSV, but ensure they're sorted by rank
          rankedPlayers = playersData.sort((a, b) => a.rank - b.rank);
        } else {
        // Sort players by Global Score (descending order) and assign proper ranks
        const sortedPlayers = playersData.sort((a, b) => b.globalScore - a.globalScore);
          rankedPlayers = sortedPlayers.map((player, index) => ({
          ...player,
          rank: index + 1, // Proper rank starting from 1
          cityRank: index + 1 // Default city rank, will be recalculated in filtering
        }));
        }

        // Extract unique cities - only actual city names, no invalid data
        const validCityNames = ['Casablanca', 'Fès', 'Tanger', 'Kénitra', 'Rabat', 'Marrakech', 'Agadir', 'Meknès', 'Oujda', 'Tétouan'];
        const allCities = rankedPlayers.flatMap(player => 
          player.city.split(',').map(city => city.trim())
        ).filter(city => validCityNames.includes(city));
        const cities = Array.from(new Set(allCities)).sort();
        const citiesArray = Array.from(new Set(cities)).sort();
        setAvailableCities(citiesArray);
        if (onAvailableCitiesChange) {
          onAvailableCitiesChange(citiesArray);
        }
        
        console.log('🎯 Leaderboard parsed players count:', rankedPlayers.length);
        console.log('🎯 Sample player:', rankedPlayers[0]);
        setRayoSupport(rayoSupportMap);
        setPlayers(rankedPlayers);
        setFilteredPlayers(rankedPlayers);
      } else {
        setPlayers([]);
        setFilteredPlayers([]);
      }
    } catch (error) {
      console.warn('Échec du chargement depuis Google Sheets, essai avec le fichier statique:', error);
      try {
        const staticResponse = await fetch('/staticfolder/PublicLeaderBoard.csv', { cache: 'default', headers: { 'Accept': 'text/csv,text/plain,*/*' } });
        if (!staticResponse.ok) throw new Error(`Erreur HTTP fichier statique: ${staticResponse.status}`);
        const staticCsvText = await staticResponse.text();
        
        const rows = parseCSV(staticCsvText);
        
        if (rows.length > 1) {
          const headers = rows[0] || [];
          
          const playersData = rows.slice(1)
            .filter(row => row[1] && row[1].trim() !== '' && row[1] !== '#VALUE!')
            .map((row: string[]) => {
              const rawScore = row[5];
              let parsedScore = 0;
              
              if (rawScore) {
                const cleanScore = rawScore.toString().replace(',', '.').trim();
                parsedScore = parseFloat(cleanScore);
                if (isNaN(parsedScore)) {
                  parsedScore = 0;
                }
              }
              
              const parseDecimal = (value: string) => {
                if (!value || value.trim() === '') return undefined;
                const cleanValue = value.toString().replace(',', '.').trim();
                const parsed = parseFloat(cleanValue);
                return isNaN(parsed) ? undefined : parsed;
              };

              const playerUsername = row[2] || 'Username';
              const firstName = playerUsername.split(' ')[0] || playerUsername;
              const paymentType = row[16] ? row[16].toString().toLowerCase().trim() : '';
              
              let subGamesLeft = 0;
              const hasSubGamesLeft = headers.some(h => h.includes('SubGamesLeft'));
              if (hasSubGamesLeft) {
                const subGamesLeftIndex = headers.findIndex(h => h.includes('SubGamesLeft'));
                const subGamesLeftValue = row[subGamesLeftIndex]?.trim();
                if (subGamesLeftValue && subGamesLeftValue !== '#REF!' && subGamesLeftValue !== '#N/A' && subGamesLeftValue !== '#ERROR!' && subGamesLeftValue !== '') {
                  subGamesLeft = parseInt(subGamesLeftValue) || 0;
                }
              }

              let expirationDate = '';
              const hasExpirationDate = headers.some(h => h.includes('ExpirationDate'));
              if (hasExpirationDate) {
                const expirationDateIndex = headers.findIndex(h => h.includes('ExpirationDate'));
                const expirationDateValue = row[expirationDateIndex]?.trim();
                if (expirationDateValue && expirationDateValue !== '#REF!' && expirationDateValue !== '#N/A' && expirationDateValue !== '#ERROR!' && expirationDateValue !== '') {
                  expirationDate = expirationDateValue;
                }
              }

              // Parse Level from Level column
              let level = '';
              const hasLevel = headers.some(h => h.toLowerCase().includes('level') && !h.toLowerCase().includes('rank'));
              if (hasLevel) {
                const levelIndex = headers.findIndex(h => h.toLowerCase().includes('level') && !h.toLowerCase().includes('rank'));
                const levelValue = row[levelIndex]?.trim();
                if (levelValue && levelValue !== '#REF!' && levelValue !== '#N/A' && levelValue !== '#ERROR!' && levelValue !== '') {
                  level = levelValue;
                }
              }

              // Parse RankLevel from RankLevel column
              let rankLevel = '';
              const hasRankLevel = headers.some(h => h.toLowerCase().includes('ranklevel') || (h.toLowerCase().includes('rank') && h.toLowerCase().includes('level')));
              if (hasRankLevel) {
                const rankLevelIndex = headers.findIndex(h => h.toLowerCase().includes('ranklevel') || (h.toLowerCase().includes('rank') && h.toLowerCase().includes('level')));
                const rankLevelValue = row[rankLevelIndex]?.trim();
                if (rankLevelValue && rankLevelValue !== '#REF!' && rankLevelValue !== '#N/A' && rankLevelValue !== '#ERROR!' && rankLevelValue !== '') {
                  rankLevel = rankLevelValue;
                }
              }

              // Parse Points from Points column (for leaderboard)
              let points: number | undefined = undefined;
              const hasPoints = headers.some(h => h.toLowerCase().trim() === 'points' && !h.toLowerCase().includes('monthly'));
              if (hasPoints) {
                const pointsIndex = headers.findIndex(h => h.toLowerCase().trim() === 'points' && !h.toLowerCase().includes('monthly'));
                const pointsValue = row[pointsIndex]?.trim();
                if (pointsValue && pointsValue !== '#REF!' && pointsValue !== '#N/A' && pointsValue !== '#ERROR!' && pointsValue !== '') {
                  const parsedPoints = parseFloat(pointsValue.replace(',', '.'));
                  if (!isNaN(parsedPoints)) {
                    points = parsedPoints;
                  }
                }
              }
              
              // Parse Rank - could be numeric or tier string (Predator, Gold, etc.)
              const rankValue = row[0]?.trim() || '';
              let rank = 0;
              let rankTier: string | undefined = undefined;
              
              // Try to parse as number first
              const parsedRank = parseInt(rankValue);
              if (!isNaN(parsedRank) && rankValue !== '') {
                rank = parsedRank;
                // If we have a numeric rank but no tier, calculate tier from score
                // This will be set after we have parsedScore
              } else if (rankValue && rankValue !== '#REF!' && rankValue !== '#N/A' && rankValue !== '#ERROR!') {
                // It's a string tier like "Predator", "Gold", etc.
                rankTier = rankValue;
              }
              
              // Always calculate rankTier from score if not already set
              // This ensures we have a tier even if Rank column is numeric or empty
              if (!rankTier) {
                rankTier = getRankTierFromScore(parsedScore, rank);
              }
              
              return {
                rank: rank,
                cityRank: parseInt(row[1]) || 0,
                rankTier: rankTier,  // Rank tier from Rank column (Predator, Gold, etc.)
                firstName: firstName,
                username: playerUsername,
                city: convertToFrench(row[3] || 'Non spécifié'),
                globalScore: parseDecimal(row[5]) || 0,
                gamesPlayed: parseInt(row[6]) || 0,
                goals: parseInt(row[7]) || 0,
                assists: parseInt(row[8]) || 0,
                teamWins: parseInt(row[9]) || 0,
                attackRatio: parseDecimal(row[10]),
                defenseRatio: parseDecimal(row[11]),
                individualScore: parseDecimal(row[12]),
                teamScore: parseDecimal(row[13]),
                solde: subGamesLeft,
                expirationDate: expirationDate,
                level: level || undefined,  // Level from Level column
                rankLevel: rankLevel || undefined,  // RankLevel from RankLevel column
                points: points,  // Points from Points column (for leaderboard)
                monthlyPoints: undefined,  // MonthlyPoints not available in static CSV fallback
                isNewPlayer: (parseInt(row[6]) || 0) === 0,
                paymentStatus: (() => {
                  if (paymentType === 'sub' || paymentType === 'subscription') {
                    return "Subscription" as const;
                  } else if (paymentType === 'payé' || paymentType === 'paid') {
                    return "Payé" as const;
                  } else if (paymentType === 'non payé' || paymentType === 'unpaid') {
                    return "Non payé" as const;
                  } else if ((parseInt(row[6]) || 0) === 0) {
                    return "Nouveau joueur" as const;
                  } else {
                    return "Non payé" as const;
                  }
                })()
              };
            });
          
          // Use ranks from CSV if available, otherwise sort by Global Score and assign ranks
          const hasRanksFromCSV = playersData.some(p => p.rank > 0);
          
          let rankedPlayers: Player[];
          if (hasRanksFromCSV) {
            // Use ranks from CSV, but ensure they're sorted by rank
            rankedPlayers = playersData.sort((a, b) => a.rank - b.rank);
          } else {
          // Sort players by Global Score (descending order) and assign proper ranks
          const sortedPlayers = playersData.sort((a, b) => b.globalScore - a.globalScore);
            rankedPlayers = sortedPlayers.map((player, index) => ({
            ...player,
            rank: index + 1,
            cityRank: index + 1
          }));
          }

          // Extract unique cities
          const validCityNames = ['Casablanca', 'Fès', 'Tanger', 'Kénitra', 'Rabat', 'Marrakech', 'Agadir', 'Meknès', 'Oujda', 'Tétouan'];
          const allCities = rankedPlayers.flatMap(player => 
            player.city.split(',').map(city => city.trim())
          ).filter(city => validCityNames.includes(city));
          const cities = Array.from(new Set(allCities)).sort();
          const citiesArray = Array.from(new Set(cities)).sort();
        setAvailableCities(citiesArray);
        if (onAvailableCitiesChange) {
          onAvailableCitiesChange(citiesArray);
        }
          
          setPlayers(rankedPlayers);
          setFilteredPlayers(rankedPlayers);
          setError('static-fallback'); // Use a special code instead of text message
        } else {
          throw new Error('Aucune donnée trouvée dans le fichier statique');
        }
      } catch (staticError) {
        console.error('Échec du chargement depuis le fichier statique:', staticError);
        setError('Impossible de charger le classement depuis Google Sheets et le fichier statique');
      }
    } finally { 
      setLoading(false); 
    }
  };

  // Effet pour charger les données au montage du composant
  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  // Function to convert cities to French
  const convertToFrench = (city: string): string => {
    const cityMap: Record<string, string> = {
      'Casablanca': 'Casablanca',
      'Rabat': 'Rabat',
      'Fez': 'Fès',
      'Marrakech': 'Marrakech',
      'Tangier': 'Tanger',
      'Agadir': 'Agadir',
      'Meknes': 'Meknès',
      'Oujda': 'Oujda',
      'Kenitra': 'Kénitra',
      'Tetouan': 'Tétouan',
      'Safi': 'Safi',
      'Mohammedia': 'Mohammedia',
      'Khouribga': 'Khouribga',
      'Beni Mellal': 'Béni Mellal',
      'El Jadida': 'El Jadida',
      'Taza': 'Taza',
      'Nador': 'Nador',
      'Settat': 'Settat',
      'Larache': 'Larache',
      'Ksar el Kebir': 'Ksar el-Kébir',
      'Sale': 'Salé',
      'Berrechid': 'Berrechid',
      'Khemisset': 'Khémisset',
      'Inezgane': 'Inezgane',
      'Ait Melloul': 'Aït Melloul'
    };
    return cityMap[city] || city;
  };

  // Effect to handle city filtering, sorting and search
  useEffect(() => {
    
    setCurrentPage(1);
    
    // If there's an active search query, don't apply city filtering
    if (searchQuery.trim().length > 0) {
      return; // Search results are handled by handleSuggestionClick
    }
    
    let filtered = players;
    
    // Use propSelectedCity if available, otherwise fall back to local selectedCity
    const activeCity = propSelectedCity !== undefined ? propSelectedCity : selectedCity;
    
    // Apply city filtering when no search is active
    if (activeCity && activeCity !== "Toutes les villes" && activeCity !== "جميع المدن") {
      filtered = players.filter(player => {
        const cities = player.city.split(',').map(city => city.trim());
        return cities.includes(activeCity);
      });
    }
    
    // Apply sorting
    const sortedPlayers = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "goals":
          return b.goals - a.goals;
        case "assists":
          return b.assists - a.assists;
        case "attack":
          return (b.attackRatio || 0) - (a.attackRatio || 0);
        case "defense":
          return (b.defenseRatio || 0) - (a.defenseRatio || 0);
        case "matches":
          return b.gamesPlayed - a.gamesPlayed;
        case "mvp_count":
          return (b.mvpCount || 0) - (a.mvpCount || 0);
        case "mvp_average":
          const aMvpAvg = a.gamesPlayed > 0 ? (a.mvpCount || 0) / a.gamesPlayed : 0;
          const bMvpAvg = b.gamesPlayed > 0 ? (b.mvpCount || 0) / b.gamesPlayed : 0;
          return bMvpAvg - aMvpAvg;
        case "goals_average":
          const aGoalsAvg = a.gamesPlayed > 0 ? a.goals / a.gamesPlayed : 0;
          const bGoalsAvg = b.gamesPlayed > 0 ? b.goals / b.gamesPlayed : 0;
          return bGoalsAvg - aGoalsAvg;
        case "assists_average":
          const aAssistsAvg = a.gamesPlayed > 0 ? a.assists / a.gamesPlayed : 0;
          const bAssistsAvg = b.gamesPlayed > 0 ? b.assists / b.gamesPlayed : 0;
          return bAssistsAvg - aAssistsAvg;
        case "points":
          return (b.points || 0) - (a.points || 0);
        case "rank":
          // Sort by rank tier hierarchy (higher rank = higher value)
          const aRankValue = getRankHierarchyValue(a.rankTier, a.globalScore, a.rank);
          const bRankValue = getRankHierarchyValue(b.rankTier, b.globalScore, b.rank);
          if (aRankValue !== bRankValue) {
            return bRankValue - aRankValue; // Higher rank first
          }
          // If same rank tier, sort by score (higher score first)
          return b.globalScore - a.globalScore;
        case "level":
          // Sort by level tier (calculated from level + score)
          const aLevelTier = getLevelTierValue(a);
          const bLevelTier = getLevelTierValue(b);
          if (aLevelTier !== bLevelTier) {
            return bLevelTier - aLevelTier; // Higher tier first
          }
          // If same tier, sort by score
          return b.globalScore - a.globalScore;
        case "score":
        default:
          return b.globalScore - a.globalScore;
      }
    });
    
    // Calculate points rank (rank based on points, regardless of current sort)
    const pointsSorted = [...filtered].sort((a, b) => (b.points || 0) - (a.points || 0));
    const pointsRankMap = new Map<string, number>();
    
    // Assign ranks based on points, handling ties
    let currentRank = 1;
    let previousPoints: number | undefined = undefined;
    pointsSorted.forEach((player, index) => {
      const currentPoints = player.points || 0;
      if (previousPoints !== undefined && currentPoints < previousPoints) {
        currentRank = index + 1;
      }
      pointsRankMap.set(player.username, currentRank);
      previousPoints = currentPoints;
    });
    
    // Recalculate ranks
    const rerankedFiltered = sortedPlayers.map((player, index) => ({
        ...player,
        cityRank: index + 1,
        pointsRank: pointsRankMap.get(player.username)
      }));
      setFilteredPlayers(rerankedFiltered);
  }, [propSelectedCity, selectedCity, players, searchQuery, loading, error, sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
  const startIndex = (currentPage - 1) * playersPerPage;
  const endIndex = startIndex + playersPerPage;
  const currentPlayers = filteredPlayers.slice(startIndex, endIndex);

  // Notify parent of pagination changes
  useEffect(() => {
    if (onPaginationChange) {
      onPaginationChange({
        currentPage,
        totalPages,
        startIndex,
        endIndex,
        totalItems: filteredPlayers.length
      });
    }
  }, [currentPage, totalPages, startIndex, endIndex, filteredPlayers.length, onPaginationChange]);

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      if (onPageChange) {
        onPageChange(newPage);
      }
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      if (onPageChange) {
        onPageChange(newPage);
      }
    }
  };

  // Fonction pour obtenir l'icône en fonction du rang
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <FaTrophy className="text-yellow-500" />;
    if (rank === 2) return <FaMedal className="text-gray-400" />;
    if (rank === 3) return <FaAward className="text-amber-600" />;
    return <FaUser className="text-gray-600" />;
  };

  // Fonction pour obtenir l'affichage du rang (numéro seulement)
  const getRankDisplay = (rank: number) => {
    return (
      <span className="text-xs font-bold">{rank}</span>
    );
  };

  // Extract numeric level value from strings like "Level 12" or "Lvl 5"
  const getLevelNumericValue = (level?: string): number => {
    if (!level) return 0;
    const match = level.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // Get color for level badge based on 10-level segments (1-9 same color, 10-19 another, etc.)
  const getLevelBadgeColor = (levelValue: number): string => {
    if (levelValue <= 0) return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md';
    const segment = Math.floor(levelValue / 10);
    const colorMap: { [key: number]: string } = {
      0: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md',      // Level 1-9
      1: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md',      // Level 10-19
      2: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md',    // Level 20-29
      3: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-md',   // Level 30-39
      4: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md',  // Level 40-49
      5: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md',        // Level 50-59
      6: 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md',      // Level 60-69
      7: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md',  // Level 70-79
      8: 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md',  // Level 80-89
      9: 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md',      // Level 90-99
    };
    // For level 100+, cycle through colors again
    const cycleIndex = segment % 10;
    return colorMap[cycleIndex] || colorMap[0];
  };

  // Get level-based avatar border style (Enhanced Rocket League style progression)
  const getLevelAvatarBorder = (player: Player) => {
    const level = player.level?.toLowerCase() || '';
    const score = player.globalScore || 0;
    const gamesPlayed = player.gamesPlayed || 0;
    
    // Calculate level tier based on score, level, and games played
    let levelTier = 0;
    if (level === 'pro') {
      if (score >= 9.5) levelTier = 10; // Legendary Pro
      else if (score >= 8.5) levelTier = 9; // Master Pro
      else if (score >= 7.5) levelTier = 8; // Elite Pro
      else if (score >= 6.5) levelTier = 7; // Pro
      else levelTier = 6; // Advanced Pro
    } else if (level === 'street') {
      if (score >= 7) levelTier = 6; // Advanced Street
      else if (score >= 5.5) levelTier = 5; // Street
      else if (score >= 4) levelTier = 4; // Beginner Street
      else levelTier = 3; // Rookie Street
    } else if (level === 'amateur') {
      if (score >= 5) levelTier = 3; // Advanced Amateur
      else if (score >= 3.5) levelTier = 2; // Amateur
      else levelTier = 1; // Rookie
    } else {
      // Default based on score only
      if (score >= 8) levelTier = 6;
      else if (score >= 6.5) levelTier = 5;
      else if (score >= 5) levelTier = 4;
      else if (score >= 3.5) levelTier = 3;
      else if (score >= 2) levelTier = 2;
      else levelTier = 1;
    }
    
    // Generate avatar URL
    const avatarUrl = `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(player.username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    
    // Enhanced border styles with more elaborate designs
    const borderStyles = [
      { // Tier 1: Rookie - Bronze with simple frame
        border: 'border-[2.5px] border-amber-700',
        gradient: 'bg-gradient-to-br from-amber-700 via-orange-700 to-amber-800',
        innerBorder: 'border border-amber-500/50',
        shadow: 'shadow-lg shadow-amber-900/40',
        glow: '',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_30%,rgba(255,255,255,.08)_50%,transparent_70%)] before:bg-[length:12px_12px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-amber-400/30 after:rounded-lg',
        size: 'w-10 h-10 sm:w-12 sm:h-12'
      },
      { // Tier 2: Amateur - Silver with diagonal pattern
        border: 'border-[2.5px] border-gray-500',
        gradient: 'bg-gradient-to-br from-gray-500 via-slate-500 to-gray-600',
        innerBorder: 'border border-gray-300/50',
        shadow: 'shadow-lg shadow-gray-600/50',
        glow: '',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(135deg,transparent_25%,rgba(255,255,255,.12)_50%,transparent_75%)] before:bg-[length:10px_10px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-gray-300/40 after:rounded-lg',
        size: 'w-10 h-10 sm:w-12 sm:h-12'
      },
      { // Tier 3: Advanced Amateur - Gold with shine effect
        border: 'border-[3px] border-yellow-500',
        gradient: 'bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500',
        innerBorder: 'border border-yellow-300/60',
        shadow: 'shadow-lg shadow-yellow-600/60',
        glow: 'shadow-[0_0_12px_rgba(234,179,8,0.6)]',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.2)_40%,transparent_55%,rgba(255,255,255,.15)_70%,transparent_85%)] before:bg-[length:14px_14px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-yellow-300/50 after:rounded-lg',
        size: 'w-11 h-11 sm:w-13 sm:h-13'
      },
      { // Tier 4: Street - Blue with geometric shapes
        border: 'border-[3px] border-blue-500',
        gradient: 'bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600',
        innerBorder: 'border border-blue-300/60',
        shadow: 'shadow-lg shadow-blue-600/60',
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.7)]',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent_15%,rgba(255,255,255,.18)_35%,transparent_55%,rgba(255,255,255,.15)_75%,transparent_95%)] before:bg-[length:16px_16px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-blue-300/50 after:rounded-lg',
        size: 'w-11 h-11 sm:w-13 sm:h-13'
      },
      { // Tier 5: Advanced Street - Cyan with layered effects
        border: 'border-[3px] border-cyan-400',
        gradient: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500',
        innerBorder: 'border border-cyan-200/70',
        shadow: 'shadow-lg shadow-cyan-500/70',
        glow: 'shadow-[0_0_18px_rgba(34,211,238,0.8)]',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_20%,rgba(255,255,255,.22)_35%,transparent_50%,rgba(255,255,255,.18)_65%,transparent_80%,rgba(255,255,255,.12)_95%)] before:bg-[length:12px_12px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-cyan-200/60 after:rounded-lg',
        size: 'w-11 h-11 sm:w-13 sm:h-13'
      },
      { // Tier 6: Elite - Purple with complex geometric
        border: 'border-[3.5px] border-purple-500',
        gradient: 'bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600',
        innerBorder: 'border-2 border-purple-300/70',
        shadow: 'shadow-xl shadow-purple-600/70',
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.9)]',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_15%,rgba(255,255,255,.25)_30%,transparent_45%,rgba(255,255,255,.2)_60%,transparent_75%,rgba(255,255,255,.15)_90%)] before:bg-[length:14px_14px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-purple-300/60 after:rounded-lg',
        size: 'w-12 h-12 sm:w-14 sm:h-14'
      },
      { // Tier 7: Pro - Gold with metallic shine
        border: 'border-[3.5px] border-yellow-400',
        gradient: 'bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500',
        innerBorder: 'border-2 border-yellow-200/80',
        shadow: 'shadow-xl shadow-yellow-500/80',
        glow: 'shadow-[0_0_22px_rgba(250,204,21,1),0_0_40px_rgba(251,191,36,0.6)]',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent_10%,rgba(255,255,255,.3)_25%,transparent_40%,rgba(255,255,255,.25)_55%,transparent_70%,rgba(255,255,255,.2)_85%,transparent_100%)] before:bg-[length:18px_18px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-yellow-200/70 after:rounded-lg',
        size: 'w-12 h-12 sm:w-14 sm:h-14',
        animate: ''
      },
      { // Tier 8: Elite Pro - Platinum with energy waves
        border: 'border-[4px] border-cyan-300',
        gradient: 'bg-gradient-to-br from-cyan-300 via-blue-400 to-indigo-400',
        innerBorder: 'border-2 border-cyan-100/90',
        shadow: 'shadow-xl shadow-cyan-400/90',
        glow: 'shadow-[0_0_25px_rgba(103,232,249,1),0_0_50px_rgba(59,130,246,0.7)]',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_8%,rgba(255,255,255,.35)_20%,transparent_32%,rgba(255,255,255,.28)_48%,transparent_68%,rgba(255,255,255,.22)_80%,transparent_92%)] before:bg-[length:16px_16px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-cyan-100/80 after:rounded-lg',
        size: 'w-12 h-12 sm:w-14 sm:h-14',
        animate: 'animate-pulse'
      },
      { // Tier 9: Master Pro - Diamond with intense multi-glow
        border: 'border-[4px] border-purple-400',
        gradient: 'bg-gradient-to-br from-purple-400 via-pink-400 to-rose-400',
        innerBorder: 'border-2 border-purple-200/90',
        shadow: 'shadow-2xl shadow-purple-500/100',
        glow: 'shadow-[0_0_30px_rgba(192,132,252,1),0_0_60px_rgba(236,72,153,0.9),0_0_90px_rgba(168,85,247,0.7)]',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_5%,rgba(255,255,255,.4)_15%,transparent_25%,rgba(255,255,255,.35)_45%,transparent_55%,rgba(255,255,255,.3)_75%,transparent_85%,rgba(255,255,255,.25)_95%)] before:bg-[length:20px_20px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-purple-200/80 after:rounded-lg',
        size: 'w-13 h-13 sm:w-15 sm:h-15',
        animate: 'animate-pulse'
      },
      { // Tier 10: Legendary Pro - Rainbow with extreme multi-layer effects
        border: 'border-[4.5px] border-transparent',
        gradient: 'bg-gradient-to-br from-yellow-400 via-pink-500 via-purple-500 via-cyan-400 to-yellow-400',
        innerBorder: 'border-2 border-white/90',
        shadow: 'shadow-2xl shadow-yellow-400/100',
        glow: 'shadow-[0_0_35px_rgba(250,204,21,1),0_0_70px_rgba(236,72,153,1),0_0_105px_rgba(168,85,247,1),0_0_140px_rgba(34,211,238,0.8)]',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,.5)_8%,transparent_16%,rgba(255,255,255,.45)_24%,transparent_40%,rgba(255,255,255,.4)_48%,transparent_52%,rgba(255,255,255,.35)_72%,transparent_84%,rgba(255,255,255,.3)_92%,transparent_100%)] before:bg-[length:24px_24px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-white/80 after:rounded-lg',
        size: 'w-13 h-13 sm:w-15 sm:h-15',
        animate: 'animate-pulse'
      }
    ];
    
    const style = borderStyles[Math.min(levelTier - 1, borderStyles.length - 1)] || borderStyles[0];
    
    return { avatarUrl, style, levelTier };
  };
  
  // Get level tier value for sorting (higher = better level)
  const getLevelTierValue = (player: Player): number => {
    const level = player.level?.toLowerCase() || '';
    const score = player.globalScore || 0;
    
    if (level === 'pro') {
      if (score >= 9.5) return 1000;
      else if (score >= 8.5) return 900;
      else if (score >= 7.5) return 800;
      else if (score >= 6.5) return 700;
      else return 600;
    } else if (level === 'street') {
      if (score >= 7) return 500;
      else if (score >= 5.5) return 400;
      else if (score >= 4) return 300;
      else return 200;
    } else if (level === 'amateur') {
      if (score >= 5) return 100;
      else if (score >= 3.5) return 50;
      else return 10;
    } else {
      // Default based on score
      if (score >= 8) return 500;
      else if (score >= 6.5) return 400;
      else if (score >= 5) return 300;
      else if (score >= 3.5) return 200;
      else if (score >= 2) return 100;
      else return 10;
    }
  };

  // Get rank hierarchy value for sorting (higher number = higher rank)
  const getRankHierarchyValue = (rankTier: string | undefined, score: number = 0, rank: number = 0): number => {
    if (!rankTier) {
      // Calculate tier from score if no rankTier provided
      const calculatedTier = getRankTierFromScore(score, rank);
      return getRankHierarchyValue(calculatedTier, score, rank);
    }
    
    const tier = rankTier.toLowerCase().trim();
    
    // Check for Predator with number (Predator #1, Predator #2, etc.)
    const predatorMatch = tier.match(/predator\s*#?\s*(\d+)/);
    if (predatorMatch) {
      const predatorNum = parseInt(predatorMatch[1]);
      return 2000 + (11 - predatorNum); // Predator #1 = 2010, Predator #2 = 2009, etc.
    }
    
    // Check for just "Predator" (no number)
    if (tier.includes('predator')) return 2000;
    
    // Goat tiers
    if (tier.includes('goat 3')) return 1900;
    if (tier.includes('goat 2')) return 1800;
    if (tier.includes('goat 1')) return 1700;
    
    // Gorilla tiers (handle both with and without spaces)
    if (tier.includes('gorilla 3') || tier.includes('gorilla3')) return 1600;
    if (tier.includes('gorilla 2') || tier.includes('gorilla2')) return 1500;
    if (tier.includes('gorilla 1') || tier.includes('gorilla1')) return 1400;
    
    // Crocodile tiers
    if (tier.includes('crocodile 3')) return 1300;
    if (tier.includes('crocodile 2')) return 1200;
    if (tier.includes('crocodile 1')) return 1100;
    
    // FOX tiers
    if (tier.includes('fox 3')) return 1000;
    if (tier.includes('fox 2')) return 900;
    if (tier.includes('fox 1')) return 800;
    
    // Rookie and Unranked
    if (tier.includes('rookie')) return 100;
    if (tier.includes('unranked')) return 0;
    
    // Unknown rank - put at bottom
    return 0;
  };

  return (
    <section id="leaderboard" className="py-12 bg-gradient-to-br from-slate-50 to-blue-50 w-full">
      <div className="max-w-7xl mx-auto px-4 w-full">
        <RevealAnimation>
          <div className="mb-8">
            {/* Ultra Compact Modern Pro Banner */}
            <div className="relative bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-3 mb-6 overflow-hidden border border-gray-700/50">
              {/* Minimal background accent */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              
              <div className="relative z-10">
                {/* Ultra compact single line layout */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiAward className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white leading-none">{content.title}</h2>
                      <p className="text-gray-400 text-xs font-medium">{content.subtitle}</p>
                    </div>
                  </div>
                  
                  {/* Stats indicator */}
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-400 text-xs font-medium">
                      {loading ? '...' : filteredPlayers.length} {language === 'ar' ? 'لاعب' : 'joueurs'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Switch Toggle with Modern Compact Badges and Filters */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-4 mt-3">
              {/* Toggle Switch */}
              <label htmlFor="leaderboard-toggle" className="flex items-center gap-2 cursor-pointer group">
                {/* Carrière Badge */}
                <div className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all duration-300 flex items-center gap-1.5 ${
                  !toggleChecked 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50 scale-105 border border-blue-300/50' 
                    : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-600 border border-gray-300 hover:from-gray-300 hover:to-gray-400 hover:border-gray-400'
                }`}>
                  <FiTrendingUp className="w-3.5 h-3.5" />
                  {language === 'ar' ? 'لوحة الصدارة' : language === 'fr' ? 'Carrière' : 'Leaderboard'}
                </div>
                
                <Switch
                  id="leaderboard-toggle"
                  checked={toggleChecked}
                  onCheckedChange={(checked) => {
                    setToggleChecked(checked);
                    if (onToggleChange) {
                      onToggleChange(checked);
                    }
                  }}
                  className="data-[state=checked]:bg-blue-600"
                />
                
                {/* Ranked Badge - Legendary Style */}
                <div className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all duration-300 flex items-center gap-1.5 relative ${
                  toggleChecked 
                    ? 'bg-gradient-to-r from-yellow-400 via-orange-500 via-pink-500 to-purple-600 text-white shadow-lg shadow-purple-500/50 scale-105 border border-yellow-300/50' 
                    : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-600 border border-gray-300 hover:from-gray-300 hover:to-gray-400 hover:border-gray-400'
                }`}>
                  {toggleChecked && (
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-yellow-400 via-orange-500 via-pink-500 to-purple-600 opacity-75 animate-pulse blur-sm -z-10"></div>
                  )}
                  <FiTarget className={`w-3.5 h-3.5 ${toggleChecked ? 'drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]' : ''}`} />
                  <span className={toggleChecked ? 'drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]' : ''}>
                    {language === 'ar' 
                      ? `مصنفة (${new Date().toLocaleDateString('ar', { month: 'long' })})` 
                      : `Ranked (${new Date().toLocaleDateString('fr-FR', { month: 'long' }).charAt(0).toUpperCase() + new Date().toLocaleDateString('fr-FR', { month: 'long' }).slice(1)})`}
                  </span>
                </div>
              </label>

              {/* City Filter and Search Bar - Right Side */}
              <div className="flex flex-col lg:flex-row items-center gap-4">
                {/* City Filter + Pagination Row (side by side on mobile) */}
                <div className="flex items-center gap-2">
                  {/* City Filter */}
                  {availableCities.length > 0 && (
                    <div className="relative w-full sm:w-auto" data-dropdown>
                      <button
                        onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                        className="group w-full sm:w-auto flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                          <span className="text-xs font-medium">
                            {selectedCity || (language === 'ar' ? 'اختر مدينة' : language === 'fr' ? 'Sélectionner une ville' : 'Select a city')}
                          </span>
                        </div>
                        <svg 
                          className={`w-3 h-3 transition-transform duration-200 flex-shrink-0 text-gray-500 ml-auto ${isCityDropdownOpen ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dynamic Width Dropdown Menu - Shows above button */}
                      {isCityDropdownOpen && (
                        <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden w-full sm:w-auto">
                          <div className="py-1">
                            {/* All Cities Option */}
                            <button
                              onClick={() => handleCitySelect(language === 'ar' ? 'جميع المدن' : 'Toutes les villes')}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-150 whitespace-nowrap ${
                                selectedCity === 'Toutes les villes' || selectedCity === 'جميع المدن'
                                  ? "bg-blue-50 text-blue-600" 
                                  : "text-gray-700"
                              }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                selectedCity === 'Toutes les villes' || selectedCity === 'جميع المدن'
                                  ? "bg-blue-500" 
                                  : "bg-gray-400"
                              }`}></div>
                              <span className="text-xs font-medium">
                                {language === 'ar' ? 'جميع المدن' : 'Toutes les villes'}
                              </span>
                              {(selectedCity === 'Toutes les villes' || selectedCity === 'جميع المدن') && (
                                <svg className="w-3 h-3 ml-auto text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                            {/* City Options */}
                            {availableCities.map((city) => (
                              <button
                                key={city}
                                onClick={() => handleCitySelect(city)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-150 whitespace-nowrap ${
                                  selectedCity === city ? "bg-blue-50 text-blue-600" : "text-gray-700"
                                }`}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                  selectedCity === city ? "bg-blue-500" : "bg-gray-400"
                                }`}></div>
                                <span className="text-xs font-medium">{city}</span>
                                {selectedCity === city && (
                                  <svg className="w-3 h-3 ml-auto text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pagination Controls - Next to City Filter */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1 px-2 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Previous page"
                      >
                        <ChevronUp className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      <span className="text-[10px] font-medium text-gray-700 min-w-[32px] text-center">
                        {currentPage}/{totalPages}
                      </span>
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Next page"
                      >
                        <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Search Input */}
                <div className="relative w-full lg:w-auto lg:min-w-[250px]">
                  <div className="group flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-1.5 flex-1">
                      <div className="w-1.5 h-1.5 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
                      <input
                        type="text"
                        placeholder={language === 'ar' ? 'ابحث عن لاعب...' : language === 'fr' ? 'Rechercher un joueur...' : 'Search for a player...'}
                        value={searchQuery}
                        className="flex-1 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-xs font-medium"
                        onChange={(e) => {
                          handleSearchChange(e.target.value);
                        }}
                      />
                    </div>
                    {searchQuery.trim().length > 0 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSearch();
                        }}
                        className="flex-shrink-0 hover:bg-gray-100 rounded p-0.5 transition-colors"
                      >
                        <FiX className="w-3 h-3 text-gray-500 hover:text-gray-700" />
                      </button>
                    ) : (
                      <FiSearch className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealAnimation>

        {/* Conditionally render Leaderboard or Ranked Leaderboard */}
        {toggleChecked ? (
          // Render RankedLeaderboardSection when toggle is ON (it handles its own loading/error states)
          <div className="-mt-8 -mx-4">
            <RankedLeaderboardSection 
              onPlayerClick={onPlayerClick}
              onToggleChange={onToggleChange}
              selectedCity={selectedCity}
              onCityChange={(city) => {
                setSelectedCity(city);
                if (onCityChange) onCityChange(city);
              }}
              availableCities={availableCities}
              onAvailableCitiesChange={(cities) => {
                setAvailableCities(cities);
                if (onAvailableCitiesChange) onAvailableCitiesChange(cities);
              }}
              searchQuery={searchQuery}
              onSearchQueryChange={(query) => {
                setSearchQuery(query);
                if (onSearchQueryChange) onSearchQueryChange(query);
              }}
              externalCurrentPage={currentPage}
              onPageChange={(page) => {
                setCurrentPage(page);
                if (onPageChange) onPageChange(page);
              }}
            />
          </div>
        ) : (
          // Render regular Leaderboard when toggle is OFF
          <>
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <style>{`
                    @keyframes handSweep { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    @keyframes tick { 0%, 90% { opacity: .25; } 95% { opacity: 1; } 100% { opacity: .25; } }
                    @keyframes buttonPulse { 0% { transform: scale(1); opacity: .4; } 50% { transform: scale(1.15); opacity: .9; } 100% { transform: scale(1); opacity: .4; } }
                    @keyframes dialGlow { 0%, 100% { opacity: .16; } 50% { opacity: .28; } }
                  `}</style>
                  <div className="inline-block mb-4">
                    <svg viewBox="0 0 164 164" className="w-20 h-20 mx-auto">
                      <defs>
                        <radialGradient id="dialBgLeaderboard" cx="50%" cy="50%">
                          <stop offset="0%" stopColor="#0f0f0f" />
                          <stop offset="100%" stopColor="#0b0b0b" />
                        </radialGradient>
                      </defs>
                      <circle cx="82" cy="88" r="64" fill="url(#dialBgLeaderboard)" stroke="#1f2937" strokeWidth="2" />
                      <rect x="74" y="18" width="16" height="10" rx="2" fill="#1f2937" />
                      <rect x="70" y="10" width="24" height="10" rx="3" fill="#ffffff" opacity=".1" />
                      <circle cx="130" cy="50" r="6" fill="#ffffff" opacity=".5" style={{ animation: 'buttonPulse 1.8s .2s ease-in-out infinite' }} />
                      <circle cx="34" cy="50" r="6" fill="#ffffff" opacity=".35" style={{ animation: 'buttonPulse 1.8s .6s ease-in-out infinite' }} />
                      {Array.from({length:12}).map((_,i)=>{
                        const angle = (i/12)*2*Math.PI;
                        const x1 = 82 + Math.cos(angle)*50;
                        const y1 = 88 + Math.sin(angle)*50;
                        const x2 = 82 + Math.cos(angle)*58;
                        const y2 = 88 + Math.sin(angle)*58;
                        return (
                          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffffff" strokeOpacity="0.3" strokeWidth={i%3===0?2:1} />
                        );
                      })}
                      <circle cx="82" cy="88" r="44" fill="none" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="2" style={{ animation: 'dialGlow 2.2s ease-in-out infinite' }} />
                      <g style={{ transformOrigin: '82px 88px', animation: 'handSweep 1.2s cubic-bezier(.4,.1,.2,1) infinite' }}>
                        <line x1="82" y1="88" x2="82" y2="34" stroke="#ffffff" strokeWidth="2" />
                        <circle cx="82" cy="88" r="3" fill="#ffffff" />
                        <circle cx="82" cy="34" r="4" fill="#ffffff" />
                      </g>
                      <circle cx="82" cy="30" r="3" fill="#ffffff" style={{ animation: 'tick 1.2s .0s linear infinite' }} />
                      <circle cx="136" cy="88" r="3" fill="#ffffff" style={{ animation: 'tick 1.2s .3s linear infinite' }} />
                      <circle cx="82" cy="146" r="3" fill="#ffffff" style={{ animation: 'tick 1.2s .6s linear infinite' }} />
                      <circle cx="28" cy="88" r="3" fill="#ffffff" style={{ animation: 'tick 1.2s .9s linear infinite' }} />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">RAYO SPORT</h2>
                  <p className="text-gray-600">Chargement du classement...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && error !== 'static-fallback' && !loading && (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{content.error}</p>
                <button 
                  onClick={fetchLeaderboardData}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            )}

            {/* Content - Only show when not loading and no error */}
            {!loading && (!error || error === 'static-fallback') && (
              <>
                {/* Warning triangle for static fallback */}
            {error === 'static-fallback' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2">
                  <FiAlertTriangle className="text-yellow-500 text-xl" />
                  <span className="text-yellow-600 text-sm">MHL</span>
                </div>
              </div>
            )}

            {/* Ultra Modern Compact Filters - Stacked on Mobile, Side by Side on Desktop */}
        <RevealAnimation delay={0.15}>
          <div className="mb-4 flex flex-col gap-3">
            {/* Filters Row */}
            <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-3">
            {/* Sort Filter */}
            <div className="relative">
              {/* Sort Filter Box */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl md:rounded-2xl p-0.5 md:p-1 shadow-lg">
                <div className="bg-white rounded-lg md:rounded-xl px-2 md:px-4 py-1.5 md:py-2 flex items-center gap-2 md:gap-3 min-w-[140px] md:min-w-[200px]">
                  {/* Sort Icon */}
                  <div className="w-4 h-4 md:w-5 md:h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md md:rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiTrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                  </div>
                  
                  {/* Sort Label */}
                  <span className="text-gray-700 font-semibold text-xs md:text-sm truncate">
                    {sortBy === 'points' ? 'Points' : 
                     sortBy === 'score' ? 'Score' : 
                     sortBy === 'goals' ? 'Buts' : 
                     sortBy === 'assists' ? 'Passes' : 
                     sortBy === 'attack' ? 'Attaque' : 
                     sortBy === 'defense' ? 'Défense' : 
                     sortBy === 'matches' ? 'Matches' : 
                     sortBy === 'mvp_count' ? 'MVP Count' : 
                     sortBy === 'mvp_average' ? 'MVP Average' : 
                     sortBy === 'goals_average' ? 'Goals Average' : 
                     sortBy === 'assists_average' ? 'Assists Average' :
                     sortBy === 'rank' ? 'Rank' :
                     sortBy === 'level' ? 'Level' : 'Points'}
                  </span>
                  
                  {/* Dropdown Arrow */}
                  <div className="ml-auto">
                    <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                  </div>
                  
                  {/* Dropdown Select */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none'
                    }}
                  >
                    <option 
                      value="points"
                      className="bg-blue-800 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:text-white focus:bg-gradient-to-r focus:from-blue-600 focus:to-blue-700 focus:text-white"
                      style={{
                        backgroundColor: '#1e40af',
                        color: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      Points
                    </option>
                    <option 
                      value="goals"
                      className="bg-blue-800 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:text-white focus:bg-gradient-to-r focus:from-blue-600 focus:to-blue-700 focus:text-white"
                      style={{
                        backgroundColor: '#1e40af',
                        color: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      Goals
                    </option>
                    <option 
                      value="assists"
                      className="bg-blue-800 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:text-white focus:bg-gradient-to-r focus:from-blue-600 focus:to-blue-700 focus:text-white"
                      style={{
                        backgroundColor: '#1e40af',
                        color: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      Passes
                    </option>
                    <option 
                      value="matches"
                      className="bg-blue-800 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:text-white focus:bg-gradient-to-r focus:from-blue-600 focus:to-blue-700 focus:text-white"
                      style={{
                        backgroundColor: '#1e40af',
                        color: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      Match
                    </option>
              </select>
            </div>
        </div>
            </div>
        </div>


          </div>
        </RevealAnimation>

        {/* Ultra Compact Modern Leaderboard */}
        <RevealAnimation delay={0.4}>
          <div className="space-y-1">
          {currentPlayers.length > 0 ? (
            <>
              {currentPlayers.map((player, index) => {
                const currentRank = selectedCity !== "All Cities" ? player.cityRank : player.rank;
                const isTopThree = currentRank <= 3;
                
                return (
                <div 
                      key={`${player.username}-${index}`}
                      className={`group relative bg-white/80 backdrop-blur-sm rounded-lg border transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-lg ${
                      isTopThree 
                          ? 'border-yellow-400/50 bg-gradient-to-r from-yellow-50/80 to-orange-50/80 shadow-yellow-200/50' 
                          : 'border-gray-200/50 hover:border-blue-300/50 hover:bg-blue-50/30'
                  }`}
                  onClick={() => handlePlayerClick(player)}
                >
                      <div className="p-2">
                        {/* Responsive Layout - Single Row with All Stats on Right */}
                      <div className="flex items-center justify-between">
                          {/* Left: Rank + Avatar + Name */}
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {/* Enhanced Level Avatar Border (Rocket League style) */}
                            {(() => {
                              const { avatarUrl, style, levelTier } = getLevelAvatarBorder(player);
                              return (
                                <div className={`relative ${style.size} flex-shrink-0 ${style.border} bg-transparent rounded-xl ${style.shadow} ${style.glow} ${style.animate || ''} overflow-hidden ${style.pattern}`}>
                                  {/* Inner border layer */}
                                  <div className={`absolute inset-[2px] ${style.innerBorder} rounded-lg z-10 pointer-events-none`}></div>
                                  {/* Corner accents */}
                                  <div className={style.corners}></div>
                                  {/* Avatar image container */}
                                  <div className="relative w-full h-full rounded-lg overflow-hidden z-0 bg-transparent">
                                    <img 
                                      src={avatarUrl} 
                                      alt={player.username}
                                      className="w-full h-full object-cover scale-110"
                                    />
                                  </div>
                                  {/* Shine effect for higher tiers */}
                                  {levelTier >= 7 && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent rounded-xl z-20 pointer-events-none animate-pulse"></div>
                                  )}
                                </div>
                              );
                            })()}
                            
                            {/* Player Info - Only 2 rows */}
                          <div className="min-w-0 flex-1">
                              {/* Row 1: Username and Points Rank */}
                              <div className="font-bold text-sm truncate flex items-center gap-2">
                                {(() => {
                                  const username = player.username?.trim() || '';
                                  const hasRayoSupport = username && rayoSupport.get(username.toLowerCase());
                                  return (
                                    <>
                                      <span className={`truncate ${
                                        hasRayoSupport ? 'text-yellow-600' : 'text-gray-900'
                                      }`}>
                                        {player.username}
                                      </span>
                                      {hasRayoSupport && (
                                        <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500 shadow-md shadow-yellow-500/30 flex-shrink-0 flex items-center justify-center">
                                          <svg className="w-1.5 h-1.5" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" viewBox="0 0 24 24">
                                            <path d="M12 5v14M5 12h14"/>
                                          </svg>
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                                {player.pointsRank !== undefined && (
                                  <span className="text-blue-600 font-semibold text-xs whitespace-nowrap flex-shrink-0">
                                    #{player.pointsRank}
                                  </span>
                                )}
                              </div>
                              {/* Row 2: Level and pts */}
                              <div className="text-xs text-gray-500 truncate flex items-center gap-2">
                                {player.level && (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    getLevelBadgeColor(getLevelNumericValue(player.level))
                                  }`}>
                                    {player.level}
                                  </span>
                                )}
                                {player.points !== undefined && player.points > 0 && (
                                  <span className="text-orange-600 font-semibold text-xs whitespace-nowrap">
                                    {Math.round(player.points)} pts
                                  </span>
                                )}
                              </div>
                    </div>
                  </div>
                          
                          {/* Right: Goals, Assists, Matches */}
                          <div className="flex items-center gap-1 md:gap-3 text-xs font-semibold flex-shrink-0">
                            {player.gamesPlayed !== undefined && player.gamesPlayed > 0 && (
                              <div className="text-center min-w-[35px] md:min-w-[50px]">
                                <div className="font-bold text-xs text-gray-700">
                                  {player.gamesPlayed}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  Match{player.gamesPlayed > 1 ? 's' : ''}
                                </div>
                              </div>
                            )}
                            {player.goals !== undefined && player.goals > 0 && (
                              <div className="text-center min-w-[35px] md:min-w-[50px]">
                                <div className="font-bold text-xs text-green-600">
                                  {player.goals}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  Goal{player.goals > 1 ? 's' : ''}
                                </div>
                              </div>
                            )}
                            {player.assists !== undefined && player.assists > 0 && (
                              <div className="text-center min-w-[35px] md:min-w-[50px]">
                                <div className="font-bold text-xs text-purple-600">
                                  {player.assists}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  Assist{player.assists > 1 ? 's' : ''}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                  </div>
                </div>
                );
              })}
            </>
          ) : (
            <div className="text-center py-8 px-4">
              <RevealAnimation>
                <div className="max-w-sm mx-auto">
                  {/* Compact Icon */}
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center">
                    <FaTrophy className="w-8 h-8 text-yellow-600" />
                  </div>
                  
                  {/* Compact Message */}
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    Aucune donnée disponible
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Le classement sera bientôt disponible
                  </p>
                  
                  {/* Compact Action Button */}
                  <button
                    onClick={() => {
                      fetchLeaderboardData();
                      trackEvent('refresh_leaderboard_empty_state', 'user_action');
                    }}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-sm font-medium rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Actualisation...' : 'Actualiser'}
                  </button>
                </div>
              </RevealAnimation>
            </div>
          )}
            </div>
          </RevealAnimation>
              </>
            )}
          </>
        )}

      </div>

      {/* Points Index */}
      {filteredPlayers.length > 0 && (
        <RevealAnimation delay={0.3}>
          <div className="mt-4 bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-4 border border-gray-200/60 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <FiAward className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">Index des Points</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Positive Points */}
              <div className="bg-white rounded-lg p-3 border border-green-200/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1.5 pb-1.5 border-b border-green-100">
                  <div className="w-5 h-5 bg-green-100 rounded-md flex items-center justify-center">
                    <FiTrendingUp className="w-3 h-3 text-green-600" />
                  </div>
                  Points Positifs
                </div>
                <div className="space-y-1">
                  {[
                    { l: 'Goal', v: '+7.2' },
                    { l: 'Assist', v: '+10.8' },
                    { l: 'Hattrick', v: '+10.8' },
                    { l: 'Interception', v: '+3.6' },
                    { l: "Facteur d'âge", v: '+0.36/an' },
                    { l: 'MVP', v: '+60', highlight: true },
                    { l: 'Challenge 1', v: '+10' },
                    { l: 'Challenge 2', v: '+20' },
                    { l: 'Challenge 3', v: '+40' },
                    { l: 'Challenge 4', v: '+60' },
                    { l: 'Challenge 5', v: '+100', highlight: true },
                  ].map((i, idx) => (
                    <div key={idx} className={`flex justify-between items-center text-[11px] py-0.5 px-1.5 rounded ${i.highlight ? 'bg-green-50' : 'hover:bg-gray-50'} transition-colors`}>
                      <span className="text-gray-700 font-medium">{i.l}</span>
                      <span className={`font-bold ${i.highlight ? 'text-green-700' : 'text-green-600'}`}>{i.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Negative Points */}
              <div className="bg-white rounded-lg p-3 border border-red-200/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5 pb-1.5 border-b border-red-100">
                  <div className="w-5 h-5 bg-red-100 rounded-md flex items-center justify-center">
                    <FiAlertTriangle className="w-3 h-3 text-red-600" />
                  </div>
                  Points Négatifs
                </div>
                <div className="space-y-1">
                  {[
                    { l: 'OwnGoal', v: '-3.6' },
                    { l: 'Retard', v: '-11' },
                    { l: 'Absent', v: '-13' },
                    { l: 'Avertissement', v: '-11' },
                    { l: 'Ban', v: '-25', highlight: true },
                  ].map((i, idx) => (
                    <div key={idx} className={`flex justify-between items-center text-[11px] py-0.5 px-1.5 rounded ${i.highlight ? 'bg-red-50' : 'hover:bg-gray-50'} transition-colors`}>
                      <span className="text-gray-700 font-medium">{i.l}</span>
                      <span className={`font-bold ${i.highlight ? 'text-red-700' : 'text-red-600'}`}>{i.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team-based Points */}
              <div className="bg-white rounded-lg p-3 border border-blue-200/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1.5 pb-1.5 border-b border-blue-100">
                  <div className="w-5 h-5 bg-blue-100 rounded-md flex items-center justify-center">
                    <FiUsers className="w-3 h-3 text-blue-600" />
                  </div>
                  Points d'Équipe
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-100">
                        <th className="text-left font-semibold pb-1.5 pr-2"></th>
                        <th className="text-center font-semibold pb-1.5 px-1">Rush</th>
                        <th className="text-center font-semibold pb-1.5 px-1">5x5</th>
                        <th className="text-center font-semibold pb-1.5 px-1">7x7</th>
                        <th className="text-center font-semibold pb-1.5 px-1">8x8</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="py-1 text-gray-700 font-medium">Goal Conceded</td>
                        <td className="text-center font-bold text-red-600">-19.2</td>
                        <td className="text-center font-bold text-red-600">-9.6</td>
                        <td className="text-center font-bold text-red-600">-14.4</td>
                        <td className="text-center font-bold text-red-600">-14.4</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="py-1 text-gray-700 font-medium">Victoire</td>
                        <td className="text-center font-bold text-green-600">+38.4</td>
                        <td className="text-center font-bold text-green-600">+19.2</td>
                        <td className="text-center font-bold text-green-600">+28.8</td>
                        <td className="text-center font-bold text-green-600">+28.8</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="py-1 text-gray-700 font-medium">Goal équipe</td>
                        <td className="text-center font-bold text-green-600">+19.2</td>
                        <td className="text-center font-bold text-green-600">+9.6</td>
                        <td className="text-center font-bold text-green-600">+14.4</td>
                        <td className="text-center font-bold text-green-600">+14.4</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="py-1 text-gray-700 font-medium">Clean sheet</td>
                        <td className="text-center font-bold text-green-600">+28.8</td>
                        <td className="text-center font-bold text-green-600">+14.4</td>
                        <td className="text-center font-bold text-green-600">+21.6</td>
                        <td className="text-center font-bold text-green-600">+21.6</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </RevealAnimation>
      )}

      {/* FIFA Player Card Modal */}
      {selectedPlayer && (
        <FIFAPlayerCard 
          player={selectedPlayer} 
          onClose={() => {
            setSelectedPlayer(null);
            setShowPlayerCard(false);
          }} 
        />
      )}
    </section>
  );
};

export default LeaderboardSection;