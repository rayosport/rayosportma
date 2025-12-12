import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useCompanyContext } from "@/hooks/use-company-context";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { FaTrophy, FaMedal, FaAward } from "react-icons/fa";
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { FiTrendingUp, FiTarget, FiAward, FiUsers, FiStar, FiX, FiShield, FiZap, FiRefreshCw } from "react-icons/fi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { trackEvent } from "@/lib/analytics";

// Types for ranked leaderboard data
interface RankedPlayer {
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
  expirationDate?: string;
  mvpCount?: number;
  level?: string;
  monthlyScore?: number;  // Current month score
  monthlyPoints?: number;  // MonthlyPoints from MonthlyPoints column
  monthlyRank?: number;  // MonthlyRank from MonthlyRank column
  monthlyMatches?: number;  // MonthlyMatches from MonthlyMatches column
  monthlyGoals?: number;  // MonthlyGoal from MonthlyGoal column
  monthlyAssists?: number;  // MonthlyAssist from MonthlyAssist column
  monthlyTeamWin?: number;  // MonthlyTeamWin from column AY
  monthlyTeamLoss?: number;  // MonthlyTeamLoss from column BC
  monthlyTeamGoal?: number;  // MonthlyTeamGoal from column AZ
  monthlyTeamGoalC?: number;  // MonthlyTeamGoalC from column BA
}

// Configuration Google Sheets - Foot_Players sheet (gid=1681767418)
const DEFAULT_GOOGLE_SHEETS_CONFIG = {
  csvUrl: 'https://rayobackend.onrender.com/api/sheets/Foot_Players',
};

interface RankedLeaderboardSectionProps {
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

const RankedLeaderboardSection = ({ 
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
}: RankedLeaderboardSectionProps = {}) => {
  const { language } = useLanguage();
  const { customDataSources } = useCompanyContext();
  const [players, setPlayers] = useState<RankedPlayer[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<RankedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rayoSupport, setRayoSupport] = useState<Map<string, boolean>>(new Map());
  const [selectedCity, setSelectedCity] = useState<string>(propSelectedCity || "Toutes les villes");
  const [availableCities, setAvailableCities] = useState<string[]>(propAvailableCities || []);
  const [currentPage, setCurrentPage] = useState(externalCurrentPage || 1);
  const playersPerPage = 10;
  const [selectedPlayer, setSelectedPlayer] = useState<RankedPlayer | null>(null);
  const [showPlayerCard, setShowPlayerCard] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>(propSearchQuery || "");
  const [searchSuggestions, setSearchSuggestions] = useState<RankedPlayer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState<string>("rank"); // Default sort by rank
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  // Sync with parent props
  useEffect(() => {
    if (propSelectedCity !== undefined) {
      setSelectedCity(propSelectedCity);
    }
  }, [propSelectedCity]);

  // Sync external current page
  useEffect(() => {
    if (externalCurrentPage !== undefined && externalCurrentPage !== currentPage) {
      setCurrentPage(externalCurrentPage);
    }
  }, [externalCurrentPage, currentPage]);

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
  const rankHierarchyScrollRef = useRef<HTMLDivElement>(null);

  // Get current month name
  const getCurrentMonthName = () => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[new Date().getMonth()];
  };

  // Handler for player click
  const handlePlayerClick = (player: RankedPlayer) => {
    if (onPlayerClick) {
      trackEvent('ranked_leaderboard_player_click', 'user_engagement', player.username);
      onPlayerClick(player.username);
      return;
    }
    
    setSelectedPlayer(player);
    setShowPlayerCard(true);
    trackEvent('ranked_leaderboard_player_card_view', 'interaction', player.username);
  };

  // Search handlers
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (onSearchQueryChange) {
      onSearchQueryChange(value);
    }
    
    if (value.trim().length > 0) {
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

  const handleSuggestionClick = (player: RankedPlayer) => {
    setSearchQuery(player.firstName + " (" + player.username + ")");
    setShowSuggestions(false);
  };

  // City filter handler
  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    if (onCityChange) {
      onCityChange(city);
    }
    setCurrentPage(1);
  };


  // Format rank tier for display (convert all rank numbers to Roman numerals)
  const formatRankTierForDisplay = (tier: string): string => {
    const tierLower = tier.toLowerCase().trim();
    
    // FOX ranks (case-insensitive matching)
    if (tierLower === 'fox 1' || tier === 'FOX 1') return 'FOX I';
    if (tierLower === 'fox 2' || tier === 'FOX 2') return 'FOX II';
    if (tierLower === 'fox 3' || tier === 'FOX 3') return 'FOX III';
    // Crocodile ranks
    if (tierLower === 'crocodile 1' || tier === 'Crocodile 1') return 'Crocodile I';
    if (tierLower === 'crocodile 2' || tier === 'Crocodile 2') return 'Crocodile II';
    if (tierLower === 'crocodile 3' || tier === 'Crocodile 3') return 'Crocodile III';
    // Gorilla ranks (handle both with and without spaces)
    if (tierLower === 'gorilla 1' || tier === 'Gorilla 1' || tierLower === 'gorilla1' || tier === 'Gorilla1') return 'Gorilla I';
    if (tierLower === 'gorilla 2' || tier === 'Gorilla 2' || tierLower === 'gorilla2' || tier === 'Gorilla2') return 'Gorilla II';
    if (tierLower === 'gorilla 3' || tier === 'Gorilla 3' || tierLower === 'gorilla3' || tier === 'Gorilla3') return 'Gorilla III';
    // Goat ranks
    if (tierLower === 'goat 1' || tier === 'Goat 1') return 'Goat I';
    if (tierLower === 'goat 2' || tier === 'Goat 2') return 'Goat II';
    if (tierLower === 'goat 3' || tier === 'Goat 3') return 'Goat III';
    
    return tier;
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

  // Get rank hierarchy value for sorting
  const getRankHierarchyValue = (rankTier: string | undefined, score: number = 0, rank: number = 0): number => {
    if (!rankTier) {
      const calculatedTier = getRankTierFromScore(score, rank);
      return getRankHierarchyValue(calculatedTier, score, rank);
    }
    
    const tier = rankTier.toLowerCase().trim();
    
    // Check for Predator with number (Predator #1, Predator #2, etc.)
    const predatorMatch = tier.match(/predator\s*#?\s*(\d+)/);
    if (predatorMatch) {
      const predatorNum = parseInt(predatorMatch[1]);
      return 2000 + (11 - predatorNum);
    }
    
    if (tier.includes('predator')) return 2000;
    if (tier.includes('goat 3')) return 1900;
    if (tier.includes('goat 2')) return 1800;
    if (tier.includes('goat 1')) return 1700;
    // Handle both "gorilla 3" and "gorilla3" formats
    if (tier.includes('gorilla 3') || tier.includes('gorilla3')) return 1600;
    if (tier.includes('gorilla 2') || tier.includes('gorilla2')) return 1500;
    if (tier.includes('gorilla 1') || tier.includes('gorilla1')) return 1400;
    if (tier.includes('crocodile 3')) return 1300;
    if (tier.includes('crocodile 2')) return 1200;
    if (tier.includes('crocodile 1')) return 1100;
    if (tier.includes('fox 3')) return 1000;
    if (tier.includes('fox 2')) return 900;
    if (tier.includes('fox 1')) return 800;
    if (tier.includes('rookie')) return 100;
    if (tier.includes('unranked')) return 0;
    
    return 0;
  };

  // Get rank logo with border style (same design as Casual leaderboard)
  // Uses Rank column value (rankTier) as primary source, falls back to score-based calculation if not available
  const getRankLogoBorder = (player: RankedPlayer, currentRank: number) => {
    // Priority: Use rankTier from Rank column first, then calculate from score if not available
    const displayTier = player.rankTier || getRankTierFromScore(player.globalScore, currentRank);
    const tierLower = displayTier.toLowerCase();
    
    // Determine logo URL and tier level (0-indexed for array access)
    let logoUrl = '';
    let rankTier = 0;
    
    if (tierLower.includes('predator')) {
      rankTier = 10; // Tier 11 (index 10) - Highest tier
      logoUrl = '/images/gallery/optimized/Predator.png';
    } else if (tierLower.includes('goat 3') || tierLower.includes('goat3')) {
      rankTier = 9; // Tier 10 (index 9)
      logoUrl = '/images/gallery/optimized/Goat3.png';
    } else if (tierLower.includes('goat 2') || tierLower.includes('goat2')) {
      rankTier = 8; // Tier 9 (index 8)
      logoUrl = '/images/gallery/optimized/Goat2.png';
    } else if (tierLower.includes('goat 1') || tierLower.includes('goat1')) {
      rankTier = 7; // Tier 8 (index 7)
      logoUrl = '/images/gallery/optimized/Goat1.png';
    // Handle both "gorilla 3" and "gorilla3" formats
    } else if (tierLower.includes('gorilla 3') || tierLower.includes('gorilla3')) {
      rankTier = 6; // Tier 7 (index 6)
      logoUrl = '/images/gallery/optimized/Gorilla3.png';
    } else if (tierLower.includes('gorilla 2') || tierLower.includes('gorilla2')) {
      rankTier = 5; // Tier 6 (index 5)
      logoUrl = '/images/gallery/optimized/Gorilla2.png';
    } else if (tierLower.includes('gorilla 1') || tierLower.includes('gorilla1')) {
      rankTier = 4; // Tier 5 (index 4)
      logoUrl = '/images/gallery/optimized/Gorilla1.png';
    } else if (tierLower.includes('crocodile 3')) {
      rankTier = 3; // Tier 4 (index 3)
      logoUrl = '/images/gallery/optimized/crocodile3.png';
    } else if (tierLower.includes('crocodile 2')) {
      rankTier = 3; // Tier 4 (index 3)
      logoUrl = '/images/gallery/optimized/crocodile2.png';
    } else if (tierLower.includes('crocodile 1')) {
      rankTier = 3; // Tier 4 (index 3)
      logoUrl = '/images/gallery/optimized/crocodile1.png';
    } else if (tierLower.includes('fox 3')) {
      rankTier = 2; // Tier 3 (index 2)
      logoUrl = '/images/gallery/optimized/fox3.png';
    } else if (tierLower.includes('fox 2')) {
      rankTier = 2; // Tier 3 (index 2)
      logoUrl = '/images/gallery/optimized/fox2.png';
    } else if (tierLower.includes('fox 1')) {
      rankTier = 2; // Tier 3 (index 2)
      logoUrl = '/images/gallery/optimized/fox1.png';
    } else if (tierLower.includes('rookie')) {
      rankTier = 1; // Tier 2 (index 1)
      logoUrl = '/images/gallery/optimized/Rookie.png';
    } else if (tierLower.includes('unranked')) {
      rankTier = 0; // Unranked - lowest tier (index 0)
      logoUrl = '/images/gallery/optimized/unranked.png';
    } else {
      rankTier = 0; // Default to unranked if no match found (index 0)
      logoUrl = '/images/gallery/optimized/unranked.png';
    }
    
    // Enhanced border styles with progressive colors that get better with rank level
    const borderStyles = [
      { // Tier 0: Unranked - Gray (lowest tier)
        border: 'border-[2px] border-gray-500',
        gradient: 'bg-gradient-to-br from-gray-500 via-gray-400 to-gray-600',
        innerBorder: 'border border-gray-300/50',
        shadow: 'shadow-md shadow-gray-600/40',
        glow: '',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_30%,rgba(255,255,255,.05)_50%,transparent_70%)] before:bg-[length:12px_12px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-gray-400/30 after:rounded-lg',
        size: 'w-10 h-10 sm:w-12 sm:h-12'
      },
      { // Tier 1: Rookie - Brown/Bronze
        border: 'border-[2.5px] border-amber-800',
        gradient: 'bg-gradient-to-br from-amber-800 via-orange-800 to-amber-900',
        innerBorder: 'border border-amber-600/50',
        shadow: 'shadow-lg shadow-amber-900/40',
        glow: '',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_30%,rgba(255,255,255,.08)_50%,transparent_70%)] before:bg-[length:12px_12px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-amber-500/30 after:rounded-lg',
        size: 'w-10 h-10 sm:w-12 sm:h-12'
      },
      { // Tier 2: FOX - Silver/Gray (better than bronze)
        border: 'border-[2.5px] border-slate-400',
        gradient: 'bg-gradient-to-br from-slate-400 via-gray-400 to-slate-500',
        innerBorder: 'border border-slate-300/50',
        shadow: 'shadow-lg shadow-slate-500/50',
        glow: '',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(135deg,transparent_25%,rgba(255,255,255,.12)_50%,transparent_75%)] before:bg-[length:10px_10px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-slate-200/40 after:rounded-lg',
        size: 'w-10 h-10 sm:w-12 sm:h-12'
      },
      { // Tier 3: Crocodile - Green/Emerald (better than silver)
        border: 'border-[3px] border-emerald-500',
        gradient: 'bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600',
        innerBorder: 'border border-emerald-300/60',
        shadow: 'shadow-lg shadow-emerald-600/60',
        glow: 'shadow-[0_0_12px_rgba(16,185,129,0.6)]',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.2)_40%,transparent_55%,rgba(255,255,255,.15)_70%,transparent_85%)] before:bg-[length:14px_14px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-emerald-300/50 after:rounded-lg',
        size: 'w-11 h-11 sm:w-13 sm:h-13'
      },
      { // Tier 4: Gorilla 1 - Blue (better than green)
        border: 'border-[3px] border-blue-500',
        gradient: 'bg-gradient-to-br from-blue-500 via-blue-400 to-blue-600',
        innerBorder: 'border border-blue-300/60',
        shadow: 'shadow-lg shadow-blue-600/60',
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.7)]',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent_15%,rgba(255,255,255,.18)_35%,transparent_55%,rgba(255,255,255,.15)_75%,transparent_95%)] before:bg-[length:16px_16px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-blue-300/50 after:rounded-lg',
        size: 'w-11 h-11 sm:w-13 sm:h-13'
      },
      { // Tier 5: Gorilla 2 - Cyan/Teal (better than blue)
        border: 'border-[3px] border-cyan-400',
        gradient: 'bg-gradient-to-br from-cyan-400 via-teal-400 to-cyan-500',
        innerBorder: 'border border-cyan-200/70',
        shadow: 'shadow-lg shadow-cyan-500/70',
        glow: 'shadow-[0_0_18px_rgba(34,211,238,0.8)]',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_20%,rgba(255,255,255,.22)_35%,transparent_50%,rgba(255,255,255,.18)_65%,transparent_80%,rgba(255,255,255,.12)_95%)] before:bg-[length:12px_12px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-cyan-200/60 after:rounded-lg',
        size: 'w-11 h-11 sm:w-13 sm:h-13'
      },
      { // Tier 6: Gorilla 3 - Indigo/Purple (better than cyan)
        border: 'border-[3.5px] border-indigo-500',
        gradient: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600',
        innerBorder: 'border-2 border-indigo-300/70',
        shadow: 'shadow-xl shadow-indigo-600/70',
        glow: 'shadow-[0_0_20px_rgba(99,102,241,0.9)]',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_15%,rgba(255,255,255,.25)_30%,transparent_45%,rgba(255,255,255,.2)_60%,transparent_75%,rgba(255,255,255,.15)_90%)] before:bg-[length:14px_14px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-indigo-300/60 after:rounded-lg',
        size: 'w-10 h-10 sm:w-12 sm:h-12'
      },
      { // Tier 7: Goat 1 - Gold/Amber (better than indigo)
        border: 'border-[3.5px] border-yellow-400',
        gradient: 'bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500',
        innerBorder: 'border-2 border-yellow-200/80',
        shadow: 'shadow-xl shadow-yellow-500/80',
        glow: 'shadow-[0_0_22px_rgba(250,204,21,1),0_0_40px_rgba(251,191,36,0.6)]',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent_10%,rgba(255,255,255,.3)_25%,transparent_40%,rgba(255,255,255,.25)_55%,transparent_70%,rgba(255,255,255,.2)_85%,transparent_100%)] before:bg-[length:18px_18px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-yellow-200/70 after:rounded-lg',
        size: 'w-10 h-10 sm:w-12 sm:h-12',
        animate: ''
      },
      { // Tier 8: Goat 2 - Platinum/Sky Blue (better than gold)
        border: 'border-[4px] border-sky-300',
        gradient: 'bg-gradient-to-br from-sky-300 via-cyan-300 to-sky-400',
        innerBorder: 'border-2 border-sky-100/90',
        shadow: 'shadow-xl shadow-sky-400/90',
        glow: 'shadow-[0_0_25px_rgba(125,211,252,1),0_0_50px_rgba(34,211,238,0.7)]',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_8%,rgba(255,255,255,.35)_20%,transparent_32%,rgba(255,255,255,.28)_48%,transparent_68%,rgba(255,255,255,.22)_80%,transparent_92%)] before:bg-[length:16px_16px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-sky-100/80 after:rounded-lg',
        size: 'w-10 h-10 sm:w-12 sm:h-12'
      },
      { // Tier 9: Goat 3 - Magenta/Pink (better than platinum)
        border: 'border-[4px] border-pink-400',
        gradient: 'bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500',
        innerBorder: 'border-2 border-pink-200/90',
        shadow: 'shadow-2xl shadow-pink-500/100',
        glow: 'shadow-[0_0_30px_rgba(244,114,182,1),0_0_60px_rgba(236,72,153,0.9),0_0_90px_rgba(219,39,119,0.7)]',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_5%,rgba(255,255,255,.4)_15%,transparent_25%,rgba(255,255,255,.35)_45%,transparent_55%,rgba(255,255,255,.3)_75%,transparent_85%,rgba(255,255,255,.25)_95%)] before:bg-[length:20px_20px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-pink-200/80 after:rounded-lg',
        size: 'w-10 h-10 sm:w-12 sm:h-12'
      },
      { // Tier 10: Predator - Rainbow/Multi-color (highest tier, index 10)
        border: 'border-[4.5px] border-transparent',
        gradient: 'bg-gradient-to-br from-yellow-400 via-pink-500 via-purple-500 via-cyan-400 to-yellow-400',
        innerBorder: 'border-2 border-white/90',
        shadow: 'shadow-2xl shadow-yellow-400/100',
        glow: 'shadow-[0_0_35px_rgba(250,204,21,1),0_0_70px_rgba(236,72,153,1),0_0_105px_rgba(168,85,247,1),0_0_140px_rgba(34,211,238,0.8)]',
        pattern: 'before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,.5)_8%,transparent_16%,rgba(255,255,255,.45)_24%,transparent_40%,rgba(255,255,255,.4)_48%,transparent_52%,rgba(255,255,255,.35)_72%,transparent_84%,rgba(255,255,255,.3)_92%,transparent_100%)] before:bg-[length:24px_24px]',
        corners: 'after:absolute after:inset-0 after:border-2 after:border-white/80 after:rounded-lg',
        size: 'w-10 h-10 sm:w-12 sm:h-12'
      }
    ];
    
    // rankTier now maps directly to array index (0 = unranked, 1 = rookie, ..., 10 = predator)
    const style = borderStyles[Math.min(rankTier, borderStyles.length - 1)] || borderStyles[0];
    
    return { logoUrl, style, rankTier, displayTier };
  };

  // Parse CSV function
  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField);
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (currentField || currentRow.length > 0) {
          currentRow.push(currentField);
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
        }
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
    }

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }

    return rows;
  };

  // Convert city names to French
  const convertToFrench = (city: string): string => {
    const cityMap: { [key: string]: string } = {
      'casablanca': 'Casablanca',
      'casa': 'Casablanca',
      'fes': 'Fès',
      'fès': 'Fès',
      'fez': 'Fès',
      'tanger': 'Tanger',
      'tangier': 'Tanger',
      'kenitra': 'Kénitra',
      'kénitra': 'Kénitra',
      'rabat': 'Rabat',
      'marrakech': 'Marrakech',
      'marrakesh': 'Marrakech',
      'agadir': 'Agadir',
      'meknes': 'Meknès',
      'meknès': 'Meknès',
      'oujda': 'Oujda',
      'tetouan': 'Tétouan',
      'tétouan': 'Tétouan'
    };
    
    const normalized = city.toLowerCase().trim();
    return cityMap[normalized] || city;
  };

  // Fetch ranked leaderboard data
  const fetchRankedLeaderboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const csvUrl = customDataSources?.footPlayers || DEFAULT_GOOGLE_SHEETS_CONFIG.csvUrl;
      console.log('🏆 Ranked Leaderboard fetching from:', csvUrl);
      
      // Use default cache - browser will cache for better performance
      const response = await fetch(csvUrl, {
        cache: 'default', // Allow browser caching
        redirect: 'follow',
        headers: {
          'Accept': 'text/csv,text/plain,*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      
      if (csvText.includes('<!DOCTYPE html>') || csvText.includes('Page introuvable') || csvText.includes('<TITLE>Temporary Redirect</TITLE>')) {
        throw new Error('Google Sheets a retourné une page d\'erreur HTML au lieu des données CSV');
      }
      
      const rows = parseCSV(csvText);
      
      if (rows.length > 1) {
        const headers = rows[0] || [];
        
        // Log headers for debugging
        console.log('📊 Ranked Leaderboard Headers:', headers);
        
        const getColumnIndex = (name: string): number => {
          const lowerName = name.toLowerCase().trim();
          return headers.findIndex(h => {
            const headerLower = h.toLowerCase().trim();
            return headerLower === lowerName || 
                   headerLower.includes(lowerName) || 
                   lowerName.includes(headerLower);
          });
        };
        
        // Helper function to convert Excel column letters to 0-based index
        // A=0, B=1, ..., Z=25, AA=26, AB=27, ..., AZ=51, BA=52
        const columnLetterToIndex = (letters: string): number => {
          let result = 0;
          for (let i = 0; i < letters.length; i++) {
            result = result * 26 + (letters.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
          }
          return result - 1; // Convert to 0-based index
        };
        
        // Log column positions for debugging
        console.log('🔍 Column Positions:', {
          'AZ (MonthlyTeamGoal)': columnLetterToIndex('AZ'),
          'BA (MonthlyTeamGoalC)': columnLetterToIndex('BA'),
          'AY (MonthlyTeamWin)': columnLetterToIndex('AY'),
          'BC (MonthlyTeamLoss)': columnLetterToIndex('BC'),
          'Total headers': headers.length
        });
        
        const rankIdx = (() => {
          // Try exact matches first
          const exactMatch = headers.findIndex(h => h.toLowerCase().trim() === 'rank');
          if (exactMatch >= 0) return exactMatch;
          
          const rankIndex = getColumnIndex('Rank');
          if (rankIndex >= 0) return rankIndex;
          const rangIndex = getColumnIndex('Rang');
          if (rangIndex >= 0) return rangIndex;
          const globalRankIndex = getColumnIndex('Global Rank');
          if (globalRankIndex >= 0) return globalRankIndex;
          return 0;
        })();
        
        const cityRankIdx = getColumnIndex('City Rank') >= 0 ? getColumnIndex('City Rank') : 
                           (getColumnIndex('Rang Ville') >= 0 ? getColumnIndex('Rang Ville') : 1);
        
        const playerUsernameIdx = (() => {
          // Try exact matches first
          const exactMatch = headers.findIndex(h => h.toLowerCase().trim() === 'playerusername' || h.toLowerCase().trim() === 'username');
          if (exactMatch >= 0) return exactMatch;
          
          const playerUsernameIndex = getColumnIndex('PlayerUsername');
          if (playerUsernameIndex >= 0) return playerUsernameIndex;
          const usernameIndex = getColumnIndex('Username');
          if (usernameIndex >= 0) return usernameIndex;
          const playerIndex = getColumnIndex('Player');
          if (playerIndex >= 0) return playerIndex;
          return 2;
        })();
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
        const levelIdx = getColumnIndex('Level') >= 0 ? getColumnIndex('Level') : 
                        (getColumnIndex('Niveau') >= 0 ? getColumnIndex('Niveau') : -1);
        
        // MonthlyPoints - be specific, don't match "Points" alone
        const monthlyPointsIdx = (() => {
          // Try exact matches first (case-insensitive)
          const exactMatch = headers.findIndex(h => {
            const headerLower = h.toLowerCase().trim();
            return headerLower === 'monthlypoints' || 
                   headerLower === 'monthly points' ||
                   headerLower === 'points mensuels' ||
                   headerLower === 'monthlypoints' ||
                   headerLower.replace(/\s+/g, '') === 'monthlypoints';
          });
          if (exactMatch >= 0) return exactMatch;
          
          // Try partial matches
          const spacedMatch = headers.findIndex(h => h.toLowerCase().trim() === 'monthly points');
          if (spacedMatch >= 0) return spacedMatch;
          const frenchMatch = headers.findIndex(h => h.toLowerCase().trim() === 'points mensuels');
          if (frenchMatch >= 0) return frenchMatch;
          
          // Try getColumnIndex as fallback
          const monthlyPointsIndex = getColumnIndex('MonthlyPoints');
          if (monthlyPointsIndex >= 0) return monthlyPointsIndex;
          
          return -1;
        })();
        
        // MonthlyRank - be specific, don't match "Rank" alone
        const monthlyRankIdx = (() => {
          // Try exact matches first (case-insensitive)
          const exactMatch = headers.findIndex(h => {
            const headerLower = h.toLowerCase().trim();
            return headerLower === 'monthlyrank' || 
                   headerLower === 'monthly rank' ||
                   headerLower === 'rang mensuel' ||
                   headerLower.replace(/\s+/g, '') === 'monthlyrank';
          });
          if (exactMatch >= 0) return exactMatch;
          
          // Try partial matches
          const spacedMatch = headers.findIndex(h => h.toLowerCase().trim() === 'monthly rank');
          if (spacedMatch >= 0) return spacedMatch;
          const frenchMatch = headers.findIndex(h => h.toLowerCase().trim() === 'rang mensuel');
          if (frenchMatch >= 0) return frenchMatch;
          
          // Try getColumnIndex as fallback
          const monthlyRankIndex = getColumnIndex('MonthlyRank');
          if (monthlyRankIndex >= 0) return monthlyRankIndex;
          
          return -1;
        })();
        
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
        
        // MonthlyMacthes - Note: Column name has typo "Macthes" instead of "Matches"
        const monthlyMatchesIdx = (() => {
          // Try exact matches first (case-insensitive) - prioritize the typo version
          const exactMatch = headers.findIndex(h => {
            const headerLower = h.toLowerCase().trim();
            return headerLower === 'monthlymacthes' ||
                   headerLower === 'monthly macthes' ||
                   headerLower.replace(/\s+/g, '') === 'monthlymacthes' ||
                   headerLower === 'monthlymatches' || 
                   headerLower === 'monthly matches' ||
                   headerLower === 'matchs mensuels' ||
                   headerLower.replace(/\s+/g, '') === 'monthlymatches';
          });
          if (exactMatch >= 0) return exactMatch;
          
          // Try partial matches - prioritize typo version
          const typoMatch = headers.findIndex(h => h.toLowerCase().trim() === 'monthly macthes');
          if (typoMatch >= 0) return typoMatch;
          const spacedMatch = headers.findIndex(h => h.toLowerCase().trim() === 'monthly matches');
          if (spacedMatch >= 0) return spacedMatch;
          const frenchMatch = headers.findIndex(h => h.toLowerCase().trim() === 'matchs mensuels');
          if (frenchMatch >= 0) return frenchMatch;
          
          // Try getColumnIndex as fallback - prioritize typo version
          const monthlyMacthesIndex = getColumnIndex('MonthlyMacthes');
          if (monthlyMacthesIndex >= 0) return monthlyMacthesIndex;
          const monthlyMatchesIndex = getColumnIndex('MonthlyMatches');
          if (monthlyMatchesIndex >= 0) return monthlyMatchesIndex;
          
          return -1;
        })();
        
        // MonthlyGoal column index
        const monthlyGoalsIdx = (() => {
          const exactMatch = headers.findIndex(h => {
            const headerLower = h.toLowerCase().trim();
            return headerLower === 'monthlygoal' ||
                   headerLower === 'monthly goal' ||
                   headerLower === 'but mensuel' ||
                   headerLower === 'buts mensuels' ||
                   headerLower.replace(/\s+/g, '') === 'monthlygoal';
          });
          if (exactMatch >= 0) return exactMatch;
          
          const spacedMatch = headers.findIndex(h => h.toLowerCase().trim() === 'monthly goal');
          if (spacedMatch >= 0) return spacedMatch;
          
          const frenchMatch = headers.findIndex(h => {
            const headerLower = h.toLowerCase().trim();
            return headerLower === 'but mensuel' || headerLower === 'buts mensuels';
          });
          if (frenchMatch >= 0) return frenchMatch;
          
          const fallback = getColumnIndex('MonthlyGoal');
          if (fallback >= 0) return fallback;
          
          return -1;
        })();
        
        // MonthlyAssist column index
        const monthlyAssistsIdx = (() => {
          const exactMatch = headers.findIndex(h => {
            const headerLower = h.toLowerCase().trim();
            return headerLower === 'monthlyassist' ||
                   headerLower === 'monthly assist' ||
                   headerLower === 'assistance mensuelle' ||
                   headerLower === 'assists mensuels' ||
                   headerLower.replace(/\s+/g, '') === 'monthlyassist';
          });
          if (exactMatch >= 0) return exactMatch;
          
          const spacedMatch = headers.findIndex(h => h.toLowerCase().trim() === 'monthly assist');
          if (spacedMatch >= 0) return spacedMatch;
          
          const frenchMatch = headers.findIndex(h => {
            const headerLower = h.toLowerCase().trim();
            return headerLower === 'assistance mensuelle' || headerLower === 'passes mensuelles' || headerLower === 'assists mensuels';
          });
          if (frenchMatch >= 0) return frenchMatch;
          
          const fallback = getColumnIndex('MonthlyAssist');
          if (fallback >= 0) return fallback;
          
          return -1;
        })();
        
        // MonthlyTeamWin column index (Column AY = index 50)
        const monthlyTeamWinIdx = (() => {
          const byName = getColumnIndex('MonthlyTeamWin');
          if (byName >= 0) return byName;
          const byPosition = columnLetterToIndex('AY');
          return byPosition < headers.length ? byPosition : -1;
        })();
        
        // MonthlyTeamLoss column index (Column BC = index 54)
        const monthlyTeamLossIdx = (() => {
          const byName = getColumnIndex('MonthlyTeamLoss');
          if (byName >= 0) return byName;
          const byPosition = columnLetterToIndex('BC');
          return byPosition < headers.length ? byPosition : -1;
        })();
        
        // MonthlyTeamGoal column index (Column AZ = index 51)
        // Use direct column position since we know the exact column
        const monthlyTeamGoalIdx = columnLetterToIndex('AZ');
        
        // MonthlyTeamGoalC column index (Column BA = index 52)
        // Use direct column position since we know the exact column
        const monthlyTeamGoalCIdx = columnLetterToIndex('BA');
        
        // Log the actual headers at these positions for debugging
        if (monthlyTeamGoalIdx >= 0 && monthlyTeamGoalIdx < headers.length) {
          console.log('📍 MonthlyTeamGoal at AZ (index', monthlyTeamGoalIdx, '):', headers[monthlyTeamGoalIdx]);
        } else {
          console.warn('❌ MonthlyTeamGoal column AZ (index', monthlyTeamGoalIdx, ') is out of range. Total headers:', headers.length);
        }
        
        if (monthlyTeamGoalCIdx >= 0 && monthlyTeamGoalCIdx < headers.length) {
          console.log('📍 MonthlyTeamGoalC at BA (index', monthlyTeamGoalCIdx, '):', headers[monthlyTeamGoalCIdx]);
        } else {
          console.warn('❌ MonthlyTeamGoalC column BA (index', monthlyTeamGoalCIdx, ') is out of range. Total headers:', headers.length);
        }
        
        // Log column indices for debugging
        console.log('📊 Column Indices:', {
          rank: rankIdx,
          rankColumn: headers[rankIdx],
          username: playerUsernameIdx,
          usernameColumn: headers[playerUsernameIdx],
          monthlyPoints: monthlyPointsIdx,
          monthlyPointsColumn: monthlyPointsIdx >= 0 ? headers[monthlyPointsIdx] : 'NOT FOUND',
          monthlyRank: monthlyRankIdx,
          monthlyRankColumn: monthlyRankIdx >= 0 ? headers[monthlyRankIdx] : 'NOT FOUND',
          monthlyMatches: monthlyMatchesIdx,
          monthlyMatchesColumn: monthlyMatchesIdx >= 0 ? headers[monthlyMatchesIdx] : 'NOT FOUND',
          monthlyGoals: monthlyGoalsIdx,
          monthlyGoalsColumn: monthlyGoalsIdx >= 0 ? headers[monthlyGoalsIdx] : 'NOT FOUND',
          monthlyAssists: monthlyAssistsIdx,
          monthlyAssistsColumn: monthlyAssistsIdx >= 0 ? headers[monthlyAssistsIdx] : 'NOT FOUND',
          monthlyTeamWin: monthlyTeamWinIdx,
          monthlyTeamWinColumn: monthlyTeamWinIdx >= 0 ? headers[monthlyTeamWinIdx] : 'NOT FOUND',
          monthlyTeamLoss: monthlyTeamLossIdx,
          monthlyTeamLossColumn: monthlyTeamLossIdx >= 0 ? headers[monthlyTeamLossIdx] : 'NOT FOUND',
          monthlyTeamGoal: monthlyTeamGoalIdx,
          monthlyTeamGoalColumn: monthlyTeamGoalIdx >= 0 ? headers[monthlyTeamGoalIdx] : 'NOT FOUND',
          monthlyTeamGoalC: monthlyTeamGoalCIdx,
          monthlyTeamGoalCColumn: monthlyTeamGoalCIdx >= 0 ? headers[monthlyTeamGoalCIdx] : 'NOT FOUND'
        });
        
        const playersData = rows.slice(1)
          .filter(row => {
            const playerUsername = playerUsernameIdx >= 0 ? row[playerUsernameIdx]?.trim() : '';
            return playerUsername && playerUsername !== '' && playerUsername !== '#VALUE!' && playerUsername !== '#N/A';
          })
          .map((row: string[]) => {
            const rawScore = globalScoreIdx >= 0 ? row[globalScoreIdx] : '';
            let parsedScore = 0;
            
            if (rawScore) {
              const cleanScore = rawScore.toString().replace(',', '.').trim();
              parsedScore = parseFloat(cleanScore);
              if (isNaN(parsedScore)) parsedScore = 0;
            }
            
            const parseDecimal = (value: string) => {
              if (!value || value.trim() === '') return undefined;
              const cleanValue = value.toString().replace(',', '.').trim();
              const parsed = parseFloat(cleanValue);
              return isNaN(parsed) ? undefined : parsed;
            };

            // Parse username - ensure it's clean and valid
            const playerUsername = playerUsernameIdx >= 0 ? (row[playerUsernameIdx]?.trim() || '') : '';
            const cleanUsername = playerUsername && playerUsername !== '#VALUE!' && playerUsername !== '#N/A' && playerUsername !== '#ERROR!' 
              ? playerUsername 
              : 'Username';
            const firstName = cleanUsername.split(' ')[0] || cleanUsername;
            
            // Parse Rank column - can be numeric (1, 2, 3) or tier string (FOX 1, Crocodile 2, etc.)
            const rankValue = rankIdx >= 0 ? (row[rankIdx]?.trim() || '') : '';
            let rank = 0;
            let rankTier: string | undefined = undefined;
            
            // Try to parse as number first
            const parsedRank = parseInt(rankValue);
            if (!isNaN(parsedRank) && rankValue !== '' && rankValue !== '#REF!' && rankValue !== '#N/A' && rankValue !== '#ERROR!') {
              rank = parsedRank;
            } else if (rankValue && rankValue !== '#REF!' && rankValue !== '#N/A' && rankValue !== '#ERROR!' && rankValue !== '') {
              // It's a string tier like "FOX 1", "Crocodile 2", "Predator #1", etc.
              rankTier = rankValue;
            }
            
            // Always calculate rankTier from score if not already set
            // This ensures we have a tier even if Rank column is numeric or empty
            if (!rankTier) {
              rankTier = getRankTierFromScore(parsedScore, rank);
            }

            let level = '';
            if (levelIdx >= 0) {
              const levelValue = row[levelIdx]?.trim();
              if (levelValue && levelValue !== '#REF!' && levelValue !== '#N/A' && levelValue !== '#ERROR!' && levelValue !== '') {
                level = levelValue;
              }
            }
            
            // Parse MonthlyPoints from MonthlyPoints column
            let monthlyPoints: number | undefined = undefined;
            if (monthlyPointsIdx >= 0) {
              const monthlyPointsValue = row[monthlyPointsIdx]?.trim();
              if (monthlyPointsValue && monthlyPointsValue !== '#REF!' && monthlyPointsValue !== '#N/A' && monthlyPointsValue !== '#ERROR!' && monthlyPointsValue !== '') {
                // Handle both comma and dot as decimal separators
                const cleanValue = monthlyPointsValue.replace(',', '.').trim();
                const parsedPoints = parseFloat(cleanValue);
                if (!isNaN(parsedPoints)) {
                  monthlyPoints = parsedPoints;
                }
              }
            }
            
            // Parse MonthlyRank from MonthlyRank column
            let monthlyRank: number | undefined = undefined;
            if (monthlyRankIdx >= 0) {
              const monthlyRankValue = row[monthlyRankIdx]?.trim();
              if (monthlyRankValue && monthlyRankValue !== '#REF!' && monthlyRankValue !== '#N/A' && monthlyRankValue !== '#ERROR!' && monthlyRankValue !== '') {
                const parsedRank = parseInt(monthlyRankValue);
                if (!isNaN(parsedRank)) {
                  monthlyRank = parsedRank;
                }
              }
            }
            
            // Parse MonthlyMatches from MonthlyMatches column
            let monthlyMatches: number | undefined = undefined;
            if (monthlyMatchesIdx >= 0) {
              const monthlyMatchesValue = row[monthlyMatchesIdx]?.trim();
              if (monthlyMatchesValue && monthlyMatchesValue !== '#REF!' && monthlyMatchesValue !== '#N/A' && monthlyMatchesValue !== '#ERROR!' && monthlyMatchesValue !== '') {
                const parsedMatches = parseInt(monthlyMatchesValue);
                if (!isNaN(parsedMatches)) {
                  monthlyMatches = parsedMatches;
                }
              }
            }
            
            // Parse MonthlyGoal from MonthlyGoal column
            let monthlyGoals: number | undefined = undefined;
            if (monthlyGoalsIdx >= 0) {
              const monthlyGoalsValue = row[monthlyGoalsIdx]?.trim();
              if (monthlyGoalsValue && monthlyGoalsValue !== '#REF!' && monthlyGoalsValue !== '#N/A' && monthlyGoalsValue !== '#ERROR!' && monthlyGoalsValue !== '') {
                const parsedGoals = parseInt(monthlyGoalsValue);
                if (!isNaN(parsedGoals)) {
                  monthlyGoals = parsedGoals;
                }
              }
            }
            
            // Parse MonthlyAssist from MonthlyAssist column
            let monthlyAssists: number | undefined = undefined;
            if (monthlyAssistsIdx >= 0) {
              const monthlyAssistsValue = row[monthlyAssistsIdx]?.trim();
              if (monthlyAssistsValue && monthlyAssistsValue !== '#REF!' && monthlyAssistsValue !== '#N/A' && monthlyAssistsValue !== '#ERROR!' && monthlyAssistsValue !== '') {
                const parsedAssists = parseInt(monthlyAssistsValue);
                if (!isNaN(parsedAssists)) {
                  monthlyAssists = parsedAssists;
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
            if (cleanUsername && rayoSupportValue) {
              rayoSupportMap.set(cleanUsername.toLowerCase().trim(), true);
            }
            
            const cityRank = cityRankIdx >= 0 ? (parseInt(row[cityRankIdx]) || 0) : 0;
            const city = cityIdx >= 0 ? convertToFrench(row[cityIdx] || 'Non spécifié') : 'Non spécifié';
            const gamesPlayed = gamesPlayedIdx >= 0 ? (parseInt(row[gamesPlayedIdx]) || 0) : 0;
            
            return {
              rank: rank,
              cityRank: cityRank,
              rankTier: rankTier,
              firstName: firstName,
              username: cleanUsername,
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
              level: level || undefined,
              monthlyPoints: monthlyPoints,  // MonthlyPoints from MonthlyPoints column (can be undefined)
              monthlyRank: monthlyRank,  // MonthlyRank from MonthlyRank column (can be undefined)
              monthlyMatches: monthlyMatches,  // MonthlyMatches from MonthlyMatches column (can be undefined)
              monthlyGoals: monthlyGoals,  // MonthlyGoal from MonthlyGoal column (can be undefined)
              monthlyAssists: monthlyAssists,  // MonthlyAssist from MonthlyAssist column (can be undefined)
              monthlyTeamWin: (() => {
                if (monthlyTeamWinIdx >= 0 && row[monthlyTeamWinIdx]) {
                  const value = row[monthlyTeamWinIdx].trim();
                  if (value && value !== '#REF!' && value !== '#N/A' && value !== '#ERROR!') {
                    const parsed = parseInt(value);
                    return !isNaN(parsed) ? parsed : undefined;
                  }
                }
                return undefined;
              })(),
              monthlyTeamLoss: (() => {
                if (monthlyTeamLossIdx >= 0 && row[monthlyTeamLossIdx]) {
                  const value = row[monthlyTeamLossIdx].trim();
                  if (value && value !== '#REF!' && value !== '#N/A' && value !== '#ERROR!') {
                    const parsed = parseInt(value);
                    return !isNaN(parsed) ? parsed : undefined;
                  }
                }
                return undefined;
              })(),
              monthlyTeamGoal: (() => {
                if (monthlyTeamGoalIdx >= 0 && row[monthlyTeamGoalIdx]) {
                  const value = row[monthlyTeamGoalIdx].trim();
                  if (value && value !== '#REF!' && value !== '#N/A' && value !== '#ERROR!') {
                    const parsed = parseDecimal(value);
                    return parsed !== undefined && !isNaN(parsed) ? parsed : undefined;
                  }
                }
                return undefined;
              })(),
              monthlyTeamGoalC: (() => {
                if (monthlyTeamGoalCIdx >= 0 && row[monthlyTeamGoalCIdx]) {
                  const value = row[monthlyTeamGoalCIdx].trim();
                  if (value && value !== '#REF!' && value !== '#N/A' && value !== '#ERROR!') {
                    const parsed = parseDecimal(value);
                    return parsed !== undefined && !isNaN(parsed) ? parsed : undefined;
                  }
                }
                return undefined;
              })(),
              isNewPlayer: gamesPlayed === 0,
              paymentStatus: "Non payé" as const
            };
          });
        
        // Sort by MonthlyRank (ascending: 1, 2, 3...), then by rank tier hierarchy
        const sortedPlayers = playersData.sort((a, b) => {
          // First, sort by MonthlyRank (ascending: small to big)
          // Players without MonthlyRank go to the end
          if (a.monthlyRank !== undefined && b.monthlyRank !== undefined) {
            if (a.monthlyRank !== b.monthlyRank) {
              return a.monthlyRank - b.monthlyRank;
            }
          } else if (a.monthlyRank === undefined && b.monthlyRank !== undefined) {
            return 1; // a goes after b
          } else if (a.monthlyRank !== undefined && b.monthlyRank === undefined) {
            return -1; // a goes before b
          }
          // If MonthlyRank is equal or both undefined, sort by rank tier hierarchy
          const aRankValue = getRankHierarchyValue(a.rankTier, a.globalScore, a.rank);
          const bRankValue = getRankHierarchyValue(b.rankTier, b.globalScore, b.rank);
          if (aRankValue !== bRankValue) {
            return bRankValue - aRankValue;
          }
          return b.globalScore - a.globalScore;
        });
        
        const rankedPlayers = sortedPlayers.map((player, index) => ({
          ...player,
          rank: index + 1
        }));
        
        const validCityNames = ['Casablanca', 'Fès', 'Tanger', 'Kénitra', 'Rabat', 'Marrakech', 'Agadir', 'Meknès', 'Oujda', 'Tétouan'];
        const allCities = rankedPlayers.flatMap(player => 
          player.city.split(',').map(city => city.trim())
        ).filter(city => validCityNames.includes(city));
        const cities = Array.from(new Set(allCities)).sort();
        setAvailableCities(cities);
        if (onAvailableCitiesChange) {
          onAvailableCitiesChange(cities);
        }
        
        console.log('🏆 Ranked Leaderboard parsed players count:', rankedPlayers.length);
        
        // Log sample player data for debugging Rank, MonthlyPoints, MonthlyRank, and username
        if (rankedPlayers.length > 0) {
          const samplePlayer = rankedPlayers[0];
          console.log('📊 Sample Player Data (Rank, MonthlyPoints, MonthlyRank, Username):', {
            username: samplePlayer.username,
            rank: samplePlayer.rank,
            rankTier: samplePlayer.rankTier,
            monthlyPoints: samplePlayer.monthlyPoints,
            monthlyRank: samplePlayer.monthlyRank,
            globalScore: samplePlayer.globalScore,
            cityRank: samplePlayer.cityRank
          });
        }
        
        setRayoSupport(rayoSupportMap);
        setPlayers(rankedPlayers);
        setFilteredPlayers(rankedPlayers);
      } else {
        setPlayers([]);
        setFilteredPlayers([]);
      }
    } catch (error) {
      console.warn('Échec du chargement depuis Google Sheets:', error);
      setError('Erreur lors du chargement du classement');
      setPlayers([]);
      setFilteredPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankedLeaderboardData();
  }, [customDataSources]);

  // Check scroll position for rank hierarchy indicators
  useEffect(() => {
    const checkScrollPosition = () => {
      if (rankHierarchyScrollRef.current) {
        const element = rankHierarchyScrollRef.current;
        const scrollLeft = element.scrollLeft;
        const scrollWidth = element.scrollWidth;
        const clientWidth = element.clientWidth;
        
        setShowLeftFade(scrollLeft > 10);
        setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    // Check on mount and resize
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    
    return () => {
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [players]); // Re-check when players data loads

  // Filter and sort players
  useEffect(() => {
    let filtered = [...players];
    
    // Use propSelectedCity if available, otherwise fall back to local selectedCity
    const activeCity = propSelectedCity !== undefined ? propSelectedCity : selectedCity;
    
    if (activeCity && activeCity !== "Toutes les villes") {
      filtered = filtered.filter(player => 
        player.city.split(',').map(city => city.trim()).includes(activeCity)
      );
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(player => 
        player.firstName.toLowerCase().includes(query) ||
        player.username.toLowerCase().includes(query) ||
        player.city.toLowerCase().includes(query)
      );
    }
    
    const sortedPlayers = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "rank":
          // Sort by MonthlyRank (ascending: small to big) as default for ranked leaderboard
          // Players without MonthlyRank go to the end
          if (a.monthlyRank !== undefined && b.monthlyRank !== undefined) {
            if (a.monthlyRank !== b.monthlyRank) {
              return a.monthlyRank - b.monthlyRank;
            }
          } else if (a.monthlyRank === undefined && b.monthlyRank !== undefined) {
            return 1; // a goes after b
          } else if (a.monthlyRank !== undefined && b.monthlyRank === undefined) {
            return -1; // a goes before b
          }
          // If MonthlyRank is equal or both undefined, sort by rank tier hierarchy
          const aRankValue = getRankHierarchyValue(a.rankTier, a.globalScore, a.rank);
          const bRankValue = getRankHierarchyValue(b.rankTier, b.globalScore, b.rank);
          if (aRankValue !== bRankValue) {
            return bRankValue - aRankValue;
          }
          return b.globalScore - a.globalScore;
        case "score":
          return b.globalScore - a.globalScore;
        case "goals":
          return b.goals - a.goals;
        case "assists":
          return b.assists - a.assists;
        default:
          // Default: sort by MonthlyRank (ascending)
          if (a.monthlyRank !== undefined && b.monthlyRank !== undefined) {
            if (a.monthlyRank !== b.monthlyRank) {
              return a.monthlyRank - b.monthlyRank;
            }
          } else if (a.monthlyRank === undefined && b.monthlyRank !== undefined) {
            return 1;
          } else if (a.monthlyRank !== undefined && b.monthlyRank === undefined) {
            return -1;
          }
          return b.globalScore - a.globalScore;
      }
    });
    
    const rerankedFiltered = sortedPlayers.map((player, index) => ({
      ...player,
      cityRank: index + 1
    }));
    setFilteredPlayers(rerankedFiltered);
  }, [propSelectedCity, selectedCity, players, searchQuery, sortBy]);

  // Pagination
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

  const getRankDisplay = (rank: number) => {
    return <span className="text-xs font-bold">{rank}</span>;
  };

  if (loading) {
    return (
      <section id="ranked-leaderboard" className="py-16 bg-gradient-to-br from-slate-50 to-blue-50 w-full">
        <div className="max-w-7xl mx-auto px-4 w-full">
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
                    <radialGradient id="dialBgRanked" cx="50%" cy="50%">
                      <stop offset="0%" stopColor="#0f0f0f" />
                      <stop offset="100%" stopColor="#0b0b0b" />
                    </radialGradient>
                  </defs>
                  <circle cx="82" cy="88" r="64" fill="url(#dialBgRanked)" stroke="#1f2937" strokeWidth="2" />
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
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="ranked-leaderboard" className="py-16 bg-gradient-to-br from-slate-50 to-blue-50 w-full">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="ranked-leaderboard" className="py-4 bg-gradient-to-br from-slate-50 to-blue-50 w-full">
      <div className="max-w-7xl mx-auto px-4 w-full">

        {/* Responsive Suggestions - Compact */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="w-full lg:w-auto mb-4">
            {/* Desktop: Horizontal layout */}
            <div className="hidden lg:flex gap-1.5 z-50">
              {searchSuggestions.slice(0, 3).map((player, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(player)}
                  className="flex items-center gap-1.5 px-2 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-white transition-all duration-200 group min-w-0 shadow-md"
                >
                  {/* Avatar */}
                  <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {player.firstName?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  
                  {/* Player Username */}
                  <div className="text-xs font-medium text-gray-700 truncate">
                    {player.username}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Mobile: Stacked layout */}
            <div className="lg:hidden flex flex-col gap-1.5 z-50">
              {searchSuggestions.slice(0, 3).map((player, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(player)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-white transition-all duration-200 group w-full shadow-md"
                >
                  {/* Avatar */}
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {player.firstName?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 text-left">
                    <div className="text-xs font-medium text-gray-700">{player.username}</div>
                    {player.firstName && (
                      <div className="text-xs text-gray-500">{player.firstName}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rank Index/Legend - Horizontal Flow Layout */}
        <RevealAnimation delay={0.25}>
          <div className="mb-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200/60 p-2 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                <FiAward className="w-3 h-3 text-yellow-600" />
                Rank Hierarchy
              </h3>
              <span className="text-[9px] text-gray-400 font-medium">Lowest → Highest</span>
            </div>
            
            {/* Horizontal flow with arrows - with scroll indicators */}
            <div className="relative">
              {/* Left fade indicator - only on mobile */}
              {showLeftFade && (
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50/95 via-gray-50/50 to-transparent pointer-events-none z-10 md:hidden">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200/60 flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7.5 3L4.5 6l3 3" />
                    </svg>
                  </div>
                </div>
              )}
              {/* Right fade indicator - only on mobile */}
              {showRightFade && (
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50/95 via-gray-50/50 to-transparent pointer-events-none z-10 md:hidden">
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200/60 flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.5 3l3 3-3 3" />
                    </svg>
                  </div>
                </div>
              )}
              <div 
                ref={rankHierarchyScrollRef}
                className="flex items-center justify-between md:justify-between gap-1 md:gap-0 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                onScroll={(e) => {
                  const target = e.target as HTMLDivElement;
                  const scrollLeft = target.scrollLeft;
                  const scrollWidth = target.scrollWidth;
                  const clientWidth = target.clientWidth;
                  
                  // Show left fade if scrolled right
                  setShowLeftFade(scrollLeft > 10);
                  
                  // Show right fade if there's more content to scroll
                  setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
                }}
              >
              {/* Rookie */}
              <div className="group relative flex flex-col items-center gap-0.5 bg-white/60 hover:bg-white rounded-lg px-1.5 py-1 border border-amber-300/40 hover:border-amber-400/60 transition-all cursor-default flex-shrink-0">
                <div className="relative w-6 h-6 flex-shrink-0 border-[2px] border-amber-800 rounded-lg shadow-sm overflow-hidden">
                  <img src="/images/gallery/optimized/Rookie.png" alt="Rookie" className="w-full h-full object-cover" />
                </div>
                <span className="text-[8px] font-semibold text-gray-700 whitespace-nowrap">Rookie</span>
                <span className="text-[7px] text-gray-500 font-medium">0-49 pts</span>
              </div>

              <div className="flex items-center justify-center min-w-[8px] md:min-w-[20px] md:flex-1">
                <div className="text-gray-300 text-[10px] md:text-base">→</div>
              </div>

              {/* FOX 1-3 */}
              {[1, 2, 3].map((num, idx) => {
                const foxPoints = [
                  '50-99 pts',   // FOX 1
                  '100-149 pts', // FOX 2
                  '150-249 pts'  // FOX 3
                ];
                return (
                  <>
                    <div key={`fox-${num}`} className="group relative flex flex-col items-center gap-0.5 bg-white/60 hover:bg-white rounded-lg px-1.5 py-1 border border-slate-300/40 hover:border-slate-400/60 transition-all cursor-default flex-shrink-0">
                      <div className="relative w-6 h-6 flex-shrink-0 border-[2px] border-slate-400 rounded-lg shadow-sm overflow-hidden">
                        <img src={`/images/gallery/optimized/fox${num}.png`} alt={`FOX ${num}`} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[8px] font-semibold text-gray-700 whitespace-nowrap">FOX {['I', 'II', 'III'][num - 1]}</span>
                      <span className="text-[7px] text-gray-500 font-medium">{foxPoints[num - 1]}</span>
                    </div>
                  {idx < 2 && (
                    <div key={`fox-arrow-${num}`} className="flex items-center justify-center min-w-[8px] md:min-w-[20px] md:flex-1">
                      <div className="text-gray-300 text-[10px] md:text-base">→</div>
                    </div>
                  )}
                  </>
                );
              })}

              <div className="flex items-center justify-center min-w-[8px] md:min-w-[20px] md:flex-1">
                <div className="text-gray-300 text-[10px] md:text-base">→</div>
              </div>

              {/* Crocodile 1-3 */}
              {[1, 2, 3].map((num, idx) => {
                const crocPoints = [
                  '250-399 pts', // Crocodile 1
                  '400-599 pts', // Crocodile 2
                  '600-899 pts'  // Crocodile 3
                ];
                return (
                  <>
                    <div key={`croc-${num}`} className="group relative flex flex-col items-center gap-0.5 bg-white/60 hover:bg-white rounded-lg px-1.5 py-1 border border-emerald-300/40 hover:border-emerald-400/60 transition-all cursor-default flex-shrink-0">
                      <div className="relative w-6 h-6 flex-shrink-0 border-[2.5px] border-emerald-500 rounded-lg shadow-sm overflow-hidden">
                        <img src={`/images/gallery/optimized/crocodile${num}.png`} alt={`Crocodile ${num}`} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[8px] font-semibold text-gray-700 whitespace-nowrap">Croc {['I', 'II', 'III'][num - 1]}</span>
                      <span className="text-[7px] text-gray-500 font-medium">{crocPoints[num - 1]}</span>
                    </div>
                  {idx < 2 && (
                    <div key={`croc-arrow-${num}`} className="flex items-center justify-center min-w-[8px] md:min-w-[20px] md:flex-1">
                      <div className="text-gray-300 text-[10px] md:text-base">→</div>
                    </div>
                  )}
                  </>
                );
              })}

              <div className="flex items-center justify-center min-w-[8px] md:min-w-[20px] md:flex-1">
                <div className="text-gray-300 text-[10px] md:text-base">→</div>
              </div>

              {/* Gorilla 1-3 */}
              {[1, 2, 3].map((num, idx) => {
                const gorillaPoints = [
                  '900-1199 pts',  // Gorilla 1
                  '1200-1599 pts', // Gorilla 2
                  '1600-2099 pts' // Gorilla 3
                ];
                const isGorilla3 = num === 3;
                return (
                  <>
                    <div key={`gorilla-${num}`} className={`group relative flex flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 transition-all cursor-default flex-shrink-0 overflow-hidden ${
                      isGorilla3
                        ? 'bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 border-[1.5px] border-indigo-400'
                        : 'bg-white/60 hover:bg-white border border-blue-300/40 hover:border-blue-400/60'
                    }`}>
                      {isGorilla3 && (
                        <>
                          <div className="absolute inset-0 rounded-lg opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,rgb(0,0,0)_1px,transparent_0)] bg-[length:20px_20px]"></div>
                          <div className="absolute top-0 left-0 w-2 h-2 border-t-[1px] border-l-[1px] border-indigo-400/40 rounded-tl-lg"></div>
                          <div className="absolute top-0 right-0 w-2 h-2 border-t-[1px] border-r-[1px] border-purple-400/40 rounded-tr-lg"></div>
                          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-[1px] border-l-[1px] border-indigo-400/40 rounded-bl-lg"></div>
                          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-[1px] border-r-[1px] border-indigo-400/40 rounded-br-lg"></div>
                        </>
                      )}
                      <div className={`relative w-6 h-6 flex-shrink-0 ${num === 3 ? 'border-[2.5px]' : 'border-[2px]'} ${num === 1 ? 'border-blue-500' : num === 2 ? 'border-cyan-400' : 'border-indigo-500'} rounded-lg shadow-sm overflow-hidden z-10`}>
                        <img src={`/images/gallery/optimized/Gorilla${num}.png`} alt={`Gorilla ${num}`} className="w-full h-full object-cover" />
                      </div>
                      <span className={`text-[8px] font-semibold whitespace-nowrap z-10 ${isGorilla3 ? 'text-indigo-900' : 'text-gray-700'}`}>Gorilla {['I', 'II', 'III'][num - 1]}</span>
                      <span className={`text-[7px] font-medium z-10 ${isGorilla3 ? 'text-indigo-700' : 'text-gray-500'}`}>{gorillaPoints[num - 1]}</span>
                    </div>
                  {idx < 2 && (
                    <div key={`gorilla-arrow-${num}`} className="flex items-center justify-center min-w-[8px] md:min-w-[20px] md:flex-1">
                      <div className="text-gray-300 text-[10px] md:text-base">→</div>
                    </div>
                  )}
                  </>
                );
              })}

              <div className="flex items-center justify-center min-w-[8px] md:min-w-[20px] md:flex-1">
                <div className="text-gray-300 text-[10px] md:text-base">→</div>
              </div>

              {/* Goat 1-3 */}
              {[1, 2, 3].map((num, idx) => {
                const borderColors = [
                  'border-yellow-400', // Goat 1
                  'border-sky-300',    // Goat 2
                  'border-pink-400'    // Goat 3
                ];
                const borderWidths = [
                  'border-[3.5px]',    // Goat 1
                  'border-[4px]',      // Goat 2
                  'border-[4px]'       // Goat 3
                ];
                const goatPoints = [
                  '2100-2599 pts', // Goat 1
                  '2600-3299 pts', // Goat 2
                  '3300-3999 pts'  // Goat 3
                ];
                const goatBgGradients = [
                  'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50', // Goat 1
                  'bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50',       // Goat 2
                  'bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50'     // Goat 3
                ];
                const goatTextColors = [
                  'text-amber-900', // Goat 1
                  'text-sky-900',   // Goat 2
                  'text-purple-900' // Goat 3
                ];
                const goatTextSecondary = [
                  'text-amber-700', // Goat 1
                  'text-sky-700',   // Goat 2
                  'text-purple-700' // Goat 3
                ];
                return (
                  <>
                    <div key={`goat-${num}`} className={`group relative flex flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 border-[1.5px] ${borderColors[num - 1]} transition-all cursor-default flex-shrink-0 overflow-hidden ${goatBgGradients[num - 1]}`}>
                      {/* Subtle pattern overlay */}
                      <div className="absolute inset-0 rounded-lg opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,rgb(0,0,0)_1px,transparent_0)] bg-[length:20px_20px]"></div>
                      {/* Corner decorations */}
                      {num === 1 && (
                        <>
                          <div className="absolute top-0 left-0 w-2 h-2 border-t-[1px] border-l-[1px] border-yellow-400/40 rounded-tl-lg z-10"></div>
                          <div className="absolute top-0 right-0 w-2 h-2 border-t-[1px] border-r-[1px] border-amber-400/40 rounded-tr-lg z-10"></div>
                          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-[1px] border-l-[1px] border-orange-400/40 rounded-bl-lg z-10"></div>
                          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-[1px] border-r-[1px] border-yellow-400/40 rounded-br-lg z-10"></div>
                        </>
                      )}
                      {num === 2 && (
                        <>
                          <div className="absolute top-0 left-0 w-2 h-2 border-t-[1px] border-l-[1px] border-sky-300/40 rounded-tl-lg z-10"></div>
                          <div className="absolute top-0 right-0 w-2 h-2 border-t-[1px] border-r-[1px] border-cyan-400/40 rounded-tr-lg z-10"></div>
                          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-[1px] border-l-[1px] border-blue-400/40 rounded-bl-lg z-10"></div>
                          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-[1px] border-r-[1px] border-sky-300/40 rounded-br-lg z-10"></div>
                        </>
                      )}
                      {num === 3 && (
                        <>
                          <div className="absolute top-0 left-0 w-2 h-2 border-t-[1px] border-l-[1px] border-pink-400/40 rounded-tl-lg z-10"></div>
                          <div className="absolute top-0 right-0 w-2 h-2 border-t-[1px] border-r-[1px] border-purple-400/40 rounded-tr-lg z-10"></div>
                          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-[1px] border-l-[1px] border-rose-400/40 rounded-bl-lg z-10"></div>
                          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-[1px] border-r-[1px] border-pink-400/40 rounded-br-lg z-10"></div>
                        </>
                      )}
                      <div className={`relative w-6 h-6 flex-shrink-0 ${borderWidths[num - 1]} ${borderColors[num - 1]} rounded-lg shadow-sm overflow-hidden z-10`}>
                        <img src={`/images/gallery/optimized/Goat${num}.png`} alt={`Goat ${num}`} className="w-full h-full object-cover" />
                      </div>
                      <span className={`text-[8px] font-semibold whitespace-nowrap z-10 ${goatTextColors[num - 1]}`}>Goat {['I', 'II', 'III'][num - 1]}</span>
                      <span className={`text-[7px] font-medium z-10 ${goatTextSecondary[num - 1]}`}>{goatPoints[num - 1]}</span>
                    </div>
                    {idx < 2 && (
                      <div key={`goat-arrow-${num}`} className="flex items-center justify-center min-w-[8px] md:min-w-[20px] md:flex-1">
                        <div className="text-gray-300 text-[10px] md:text-base">→</div>
                      </div>
                    )}
                  </>
                );
              })}

              <div className="flex items-center justify-center min-w-[8px] md:min-w-[20px] md:flex-1">
                <div className="text-gray-300 text-[10px] md:text-base">→</div>
              </div>

              {/* Predator */}
              <div className="group relative flex flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 border-2 border-transparent transition-all cursor-default flex-shrink-0 overflow-hidden bg-gradient-to-br from-yellow-400/20 via-pink-500/20 via-purple-500/20 via-cyan-400/20 to-yellow-400/20">
                {/* Animated rainbow border */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 via-cyan-400 to-yellow-400 opacity-75 animate-gradient bg-[length:200%_200%] -z-10 blur-sm"></div>
                <div className="absolute inset-[2px] rounded-lg bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-sm"></div>
                
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-[1px] border-l-[1px] border-yellow-400/60 rounded-tl-lg z-10"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t-[1px] border-r-[1px] border-pink-400/60 rounded-tr-lg z-10"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-[1px] border-l-[1px] border-purple-400/60 rounded-bl-lg z-10"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-[1px] border-r-[1px] border-cyan-400/60 rounded-br-lg z-10"></div>
                
                <div className="relative w-6 h-6 flex-shrink-0 rounded-lg overflow-hidden z-10">
                  {/* Animated rainbow border for logo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 via-cyan-400 to-yellow-400 rounded-lg animate-gradient bg-[length:200%_200%] p-[2px]">
                    <div className="w-full h-full bg-gray-900 rounded-lg">
                      <img src="/images/gallery/optimized/Predator.png" alt="Predator" className="w-full h-full object-cover rounded-lg" />
                    </div>
                  </div>
                  {/* Glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 via-cyan-400 to-yellow-400 rounded-lg opacity-30 blur-md animate-pulse"></div>
                </div>
                <span className="text-[8px] font-semibold text-white drop-shadow-[0_0_4px_rgba(250,204,21,0.8)] whitespace-nowrap z-10">Predator</span>
                <span className="text-[7px] text-yellow-300 drop-shadow-[0_0_2px_rgba(250,204,21,0.6)] font-medium z-10">4000+ & Top 10</span>
              </div>
              </div>
            </div>
          </div>
        </RevealAnimation>

        {/* Leaderboard List */}
        <RevealAnimation delay={0.3}>
          <div className="space-y-1">
            {currentPlayers.length > 0 ? (
              <>
                {currentPlayers.map((player, index) => {
                  const currentRank = selectedCity !== "Toutes les villes" ? player.cityRank : player.rank;
                  const isTopThree = currentRank <= 3;
                  const displayTier = player.rankTier || getRankTierFromScore(player.globalScore, currentRank);
                  const tierLower = displayTier.toLowerCase();
                  const isPredator = tierLower.includes('predator');
                  const isGoat1 = tierLower.includes('goat 1') || tierLower.includes('goat1');
                  const isGoat2 = tierLower.includes('goat 2') || tierLower.includes('goat2');
                  const isGoat3 = tierLower.includes('goat 3') || tierLower.includes('goat3');
                  const isGoat = isGoat1 || isGoat2 || isGoat3;
                  
                  return (
                    <div
                      key={`${player.username}-${index}`}
                      className={`group relative rounded-lg border transition-all duration-300 cursor-pointer overflow-hidden ${
                        isPredator
                          ? 'bg-gradient-to-br from-yellow-400/20 via-pink-500/20 via-purple-500/20 via-cyan-400/20 to-yellow-400/20 border-2 border-transparent shadow-2xl hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(250,204,21,0.6),0_0_80px_rgba(236,72,153,0.4),0_0_120px_rgba(168,85,247,0.3)]'
                          : isGoat
                          ? isGoat1
                            ? 'bg-gradient-to-br from-yellow-400/15 via-amber-500/15 to-orange-500/15 border-2 border-transparent shadow-xl hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(250,204,21,0.5),0_0_60px_rgba(251,191,36,0.3)]'
                            : isGoat2
                            ? 'bg-gradient-to-br from-sky-300/15 via-cyan-400/15 to-blue-400/15 border-2 border-transparent shadow-xl hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(125,211,252,0.5),0_0_60px_rgba(34,211,238,0.3)]'
                            : 'bg-gradient-to-br from-pink-900/90 via-purple-900/90 to-rose-900/90 border-2 border-pink-400/60 shadow-xl hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(244,114,182,0.5),0_0_60px_rgba(236,72,153,0.3)]'
                          : isTopThree
                          ? 'bg-white/80 backdrop-blur-sm border-yellow-400/50 bg-gradient-to-r from-yellow-50/80 to-orange-50/80 shadow-yellow-200/50 hover:scale-[1.02] hover:shadow-lg'
                          : 'bg-white/80 backdrop-blur-sm border-gray-200/50 hover:border-blue-300/50 hover:bg-blue-50/30 hover:scale-[1.02] hover:shadow-lg'
                      }`}
                      onClick={() => handlePlayerClick(player)}
                    >
                      {/* Predator Special Effects */}
                      {isPredator && (
                        <>
                          {/* Animated rainbow border */}
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 via-cyan-400 to-yellow-400 opacity-75 animate-gradient bg-[length:200%_200%] -z-10 blur-sm"></div>
                          <div className="absolute inset-[2px] rounded-lg bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-sm"></div>
                          
                          {/* Animated glow effect */}
                          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 via-cyan-400 to-yellow-400 rounded-lg opacity-20 blur-xl animate-pulse"></div>
                          
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                          
                          {/* Corner accents */}
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-yellow-400/60 rounded-tl-lg"></div>
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-pink-400/60 rounded-tr-lg"></div>
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-purple-400/60 rounded-bl-lg"></div>
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400/60 rounded-br-lg"></div>
                        </>
                      )}
                      
                      {/* Goat Special Effects - Elegant Premium Style */}
                      {isGoat && (
                        <>
                          {/* Elegant gradient background */}
                          <div className={`absolute inset-0 rounded-lg ${
                            isGoat1
                              ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50'
                              : isGoat2
                              ? 'bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50'
                              : 'bg-gradient-to-br from-pink-900 via-purple-900 to-rose-900'
                          }`}></div>
                          
                          {/* Premium border with gradient - no inner border */}
                          <div className={`absolute inset-0 rounded-lg border-[1.5px] ${
                            isGoat1
                              ? 'border-yellow-400'
                              : isGoat2
                              ? 'border-sky-300'
                              : 'border-pink-400'
                          }`}></div>
                          
                          {/* Subtle pattern overlay */}
                          <div className="absolute inset-0 rounded-lg opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,rgb(0,0,0)_1px,transparent_0)] bg-[length:20px_20px]"></div>
                          
                          {/* Elegant corner decorations */}
                          {isGoat1 && (
                            <>
                              <div className="absolute top-0 left-0 w-4 h-4 border-t-[2px] border-l-[2px] border-yellow-400/40 rounded-tl-lg"></div>
                              <div className="absolute top-0 right-0 w-4 h-4 border-t-[2px] border-r-[2px] border-amber-400/40 rounded-tr-lg"></div>
                              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-[2px] border-l-[2px] border-orange-400/40 rounded-bl-lg"></div>
                              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-[2px] border-r-[2px] border-yellow-400/40 rounded-br-lg"></div>
                            </>
                          )}
                          {isGoat2 && (
                            <>
                              <div className="absolute top-0 left-0 w-4 h-4 border-t-[2px] border-l-[2px] border-sky-300/40 rounded-tl-lg"></div>
                              <div className="absolute top-0 right-0 w-4 h-4 border-t-[2px] border-r-[2px] border-cyan-400/40 rounded-tr-lg"></div>
                              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-[2px] border-l-[2px] border-blue-400/40 rounded-bl-lg"></div>
                              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-[2px] border-r-[2px] border-sky-300/40 rounded-br-lg"></div>
                            </>
                          )}
                          {isGoat3 && (
                            <>
                              <div className="absolute top-0 left-0 w-4 h-4 border-t-[2px] border-l-[2px] border-pink-400/40 rounded-tl-lg"></div>
                              <div className="absolute top-0 right-0 w-4 h-4 border-t-[2px] border-r-[2px] border-purple-400/40 rounded-tr-lg"></div>
                              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-[2px] border-l-[2px] border-rose-400/40 rounded-bl-lg"></div>
                              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-[2px] border-r-[2px] border-pink-400/40 rounded-br-lg"></div>
                            </>
                          )}
                          
                          {/* Subtle shine effect on hover */}
                          <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${
                            isGoat1
                              ? 'from-yellow-200/0 via-yellow-100/20 to-transparent'
                              : isGoat2
                              ? 'from-sky-200/0 via-sky-100/20 to-transparent'
                              : 'from-pink-200/0 via-pink-100/20 to-transparent'
                          } opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                        </>
                      )}
                      
                      <div className={`p-1.5 relative z-10 ${isPredator ? 'text-white' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* Enhanced Rank Logo Border (same design as Casual leaderboard) */}
                              {(() => {
                                const { logoUrl, style, rankTier, displayTier } = getRankLogoBorder(player, currentRank);
                                const tierLower = displayTier.toLowerCase();
                                
                                // If we have a logo (Rookie, FOX 1-3, Crocodile 1-3, Gorilla 1-3, Goat 1-3, Predator), show it with border design
                                if (logoUrl) {
                                  // Predator logo - special animated rainbow border
                                  if (tierLower.includes('predator')) {
                                    return (
                                      <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-lg overflow-hidden">
                                        {/* Animated rainbow border */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 via-cyan-400 to-yellow-400 rounded-lg animate-gradient bg-[length:200%_200%] p-[2px]">
                                          <div className="w-full h-full bg-gray-900 rounded-lg">
                                            <img 
                                              src={logoUrl} 
                                              alt={displayTier}
                                              className="w-full h-full object-cover rounded-lg"
                                            />
                                          </div>
                                        </div>
                                        {/* Glow effect */}
                                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 via-cyan-400 to-yellow-400 rounded-lg opacity-30 blur-md animate-pulse"></div>
                                      </div>
                                    );
                                  }
                                  
                                  // Other logos with border design
                                  return (
                                    <div className={`relative ${style.size} flex-shrink-0 ${style.border} bg-transparent rounded-xl ${style.shadow} ${style.glow} overflow-hidden ${style.pattern}`}>
                                      {/* Corner accents */}
                                      <div className={style.corners}></div>
                                      {/* Logo image container */}
                                      <div className="relative w-full h-full rounded-lg overflow-hidden z-0 bg-transparent">
                                        <img 
                                          src={logoUrl} 
                                          alt={displayTier}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            // Fallback for fox2
                                            const target = e.target as HTMLImageElement;
                                            if (target.src.includes('fox2')) {
                                              target.src = '/images/gallery/optimized/FOX2.png';
                                            }
                                          }}
                                        />
                                      </div>
                                      {/* Shine effect for higher tiers (tier 7+ = index 6+) */}
                                      {rankTier >= 6 && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent rounded-xl z-20 pointer-events-none"></div>
                                      )}
                                    </div>
                                  );
                                }
                                
                                // For ranks without logos, show badge
                                // Note: All ranks now have logos, so this is just a fallback
                                let badgeClass = '';
                                if (tierLower.includes('goat')) {
                                  // Fallback badge styling (shouldn't be reached since all Goat ranks have logos)
                                  const goatNum = tierLower.includes('goat 3') ? 'from-purple-600 to-pink-600' : 
                                                 tierLower.includes('goat 2') ? 'from-purple-500 to-pink-500' : 
                                                 'from-purple-400 to-pink-400';
                                  badgeClass = `bg-gradient-to-r ${goatNum} text-white shadow-md`;
                                } else if (tierLower.includes('gorilla')) {
                                  // Check in order: gorilla 3/gorilla3, gorilla 2/gorilla2, then gorilla 1/gorilla1
                                  const gorillaNum = (tierLower.includes('gorilla 3') || tierLower.includes('gorilla3')) ? 'from-blue-600 to-cyan-600' : 
                                                    (tierLower.includes('gorilla 2') || tierLower.includes('gorilla2')) ? 'from-blue-500 to-cyan-500' : 
                                                    (tierLower.includes('gorilla 1') || tierLower.includes('gorilla1')) ? 'from-blue-400 to-cyan-400' :
                                                    'from-blue-400 to-cyan-400'; // Default for gorilla
                                  badgeClass = `bg-gradient-to-r ${gorillaNum} text-white shadow-md`;
                                } else if (tierLower.includes('crocodile')) {
                                  const crocNum = tierLower.includes('crocodile 3') ? 'from-green-600 to-emerald-600' : 
                                                 tierLower.includes('crocodile 2') ? 'from-green-500 to-emerald-500' : 
                                                 'from-green-400 to-emerald-400';
                                  badgeClass = `bg-gradient-to-r ${crocNum} text-white shadow-md`;
                                } else if (tierLower.includes('unranked')) {
                                  badgeClass = 'bg-gray-500 text-white';
                                } else {
                                  badgeClass = 'bg-blue-500 text-white';
                                }
                                
                                return (
                                  <div className="flex items-center gap-1">
                                    <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                                      {formatRankTierForDisplay(displayTier)}
                                    </div>
                                    {/* MonthlyPoints displayed to the right of badge (not logo) */}
                                    {player.monthlyPoints !== undefined && player.monthlyPoints > 0 && (
                                      <span className="text-orange-600 font-semibold text-[10px] whitespace-nowrap">
                                        {Math.round(player.monthlyPoints)} pts
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            
                            {/* Fallback numeric rank if no rank tier */}
                            {!player.rankTier && (() => {
                              const displayTier = getRankTierFromScore(player.globalScore, currentRank);
                              const tierLower = displayTier.toLowerCase();
                              // Only show numeric rank if not a tier with logo
                              if (!tierLower.includes('fox') && !tierLower.includes('rookie') && !tierLower.includes('predator') && !tierLower.includes('goat') && !tierLower.includes('gorilla') && !tierLower.includes('crocodile')) {
                                return (
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isTopThree
                                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                                      : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                  }`}>
                                    {getRankDisplay(currentRank)}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            
                            <div className="min-w-0 flex-1">
                              <div className={`font-bold text-sm truncate flex items-center gap-2 ${
                                isPredator 
                                  ? 'text-white drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' 
                                  : isGoat
                                  ? isGoat1
                                    ? 'text-amber-900'
                                    : isGoat2
                                    ? 'text-sky-900'
                                    : 'text-white drop-shadow-[0_0_4px_rgba(244,114,182,0.8)]'
                                  : 'text-gray-900'
                              }`}>
                                {(() => {
                                  const username = player.username?.trim() || '';
                                  const hasRayoSupport = username && rayoSupport.get(username.toLowerCase());
                                  const shouldShowGolden = hasRayoSupport && !isPredator && !isGoat;
                                  return (
                                    <>
                                      <span className={`truncate ${
                                        shouldShowGolden ? 'text-yellow-600' : ''
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
                                {player.monthlyRank !== undefined && player.monthlyRank > 0 && (
                                  <span className={`font-semibold text-xs whitespace-nowrap flex-shrink-0 ${
                                    isPredator 
                                      ? 'text-yellow-300 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]' 
                                      : isGoat
                                      ? isGoat1
                                        ? 'text-amber-700'
                                        : isGoat2
                                        ? 'text-sky-700'
                                        : 'text-pink-300 drop-shadow-[0_0_4px_rgba(244,114,182,0.6)]'
                                      : 'text-blue-600'
                                  }`}>
                                    #{player.monthlyRank}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate flex items-center gap-2">
                                {(() => {
                                  const displayTier = player.rankTier || getRankTierFromScore(player.globalScore, currentRank);
                                  const tierLower = displayTier.toLowerCase();
                                  
                                  let badgeClass = '';
                                  
                                  // Determine badge styling
                                  if (tierLower.includes('predator')) {
                                    badgeClass = 'bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 via-cyan-400 to-yellow-400 text-white shadow-lg shadow-yellow-400/50 animate-gradient bg-[length:200%_200%] font-extrabold';
                                  } else if (tierLower.includes('goat')) {
                                    if (tierLower.includes('goat 3') || tierLower.includes('goat3')) {
                                      badgeClass = 'bg-gradient-to-r from-pink-400 via-purple-500 to-rose-500 text-white shadow-lg shadow-pink-400/50 animate-gradient bg-[length:200%_200%] font-extrabold';
                                    } else if (tierLower.includes('goat 2') || tierLower.includes('goat2')) {
                                      badgeClass = 'bg-gradient-to-r from-sky-300 via-cyan-400 to-blue-500 text-white shadow-lg shadow-sky-300/50 animate-gradient bg-[length:200%_200%] font-extrabold';
                                    } else {
                                      badgeClass = 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-white shadow-lg shadow-yellow-400/50 animate-gradient bg-[length:200%_200%] font-extrabold';
                                    }
                                  } else if (tierLower.includes('gorilla')) {
                                    // Check in order: gorilla 3/gorilla3, gorilla 2/gorilla2, then gorilla 1/gorilla1
                                    const gorillaNum = (tierLower.includes('gorilla 3') || tierLower.includes('gorilla3')) ? 'from-blue-600 to-cyan-600' : 
                                                      (tierLower.includes('gorilla 2') || tierLower.includes('gorilla2')) ? 'from-blue-500 to-cyan-500' : 
                                                      (tierLower.includes('gorilla 1') || tierLower.includes('gorilla1')) ? 'from-blue-400 to-cyan-400' :
                                                      'from-blue-400 to-cyan-400'; // Default for gorilla
                                    badgeClass = `bg-gradient-to-r ${gorillaNum} text-white shadow-md`;
                                  } else if (tierLower.includes('crocodile')) {
                                    const crocNum = tierLower.includes('crocodile 3') ? 'from-green-600 to-emerald-600' : 
                                                   tierLower.includes('crocodile 2') ? 'from-green-500 to-emerald-500' : 
                                                   'from-green-400 to-emerald-400';
                                    badgeClass = `bg-gradient-to-r ${crocNum} text-white shadow-md`;
                                  } else if (tierLower.includes('fox 3')) {
                                    badgeClass = 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md';
                                  } else if (tierLower.includes('fox 2')) {
                                    badgeClass = 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md';
                                  } else if (tierLower.includes('fox 1')) {
                                    badgeClass = 'bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-md';
                                  } else if (tierLower.includes('rookie')) {
                                    badgeClass = 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md';
                                  } else if (tierLower.includes('unranked')) {
                                    badgeClass = 'bg-gray-500 text-white';
                                  } else {
                                    badgeClass = 'bg-blue-500 text-white';
                                  }
                                  
                                  return (
                                    <div className="flex items-center gap-2">
                                      <span className={`px-1.5 py-[2px] rounded text-[9px] font-bold ${badgeClass}`}>
                                        {formatRankTierForDisplay(displayTier)}
                                      </span>
                                      {player.monthlyPoints !== undefined && player.monthlyPoints > 0 && (
                                        <span className={`font-semibold whitespace-nowrap text-xs ${
                                          isPredator 
                                            ? 'text-yellow-300 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]' 
                                            : isGoat
                                            ? isGoat1
                                              ? 'text-amber-700'
                                              : isGoat2
                                              ? 'text-sky-700'
                                              : 'text-pink-300 drop-shadow-[0_0_4px_rgba(244,114,182,0.6)]'
                                            : 'text-orange-600'
                                        }`}>
                                          {Math.round(player.monthlyPoints)} pts
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                           <div className="flex items-center gap-1.5 md:gap-2.5 text-xs font-semibold flex-shrink-0">
                             <div className="text-center min-w-[30px] md:min-w-[40px]">
                               <div className={`font-bold text-[11px] flex items-center justify-center gap-0.5 ${isPredator || isGoat3 ? 'text-white' : 'text-gray-700'}`}>
                                 <FiUsers size={12} />
                                 {player.monthlyMatches !== undefined ? player.monthlyMatches : 0}
                               </div>
                               <div className={`text-[9px] ${isPredator || isGoat3 ? 'text-gray-300' : 'text-gray-400'}`}>
                                 Match{(player.monthlyMatches || 0) !== 1 ? 's' : ''}
                               </div>
                             </div>
                             <div className="text-center min-w-[45px] md:min-w-[55px]">
                               <div className="font-bold text-[11px] flex items-center justify-center gap-0.5">
                                 <FiAward size={12} className={isPredator || isGoat3 ? 'text-yellow-300' : 'text-amber-600'} />
                                 <span className={isPredator || isGoat3 ? 'text-green-300 drop-shadow-[0_0_4px_rgba(34,197,94,0.6)]' : 'text-green-600'}>
                                   {player.monthlyTeamWin !== undefined ? player.monthlyTeamWin : 0}
                                 </span>
                                 <span className={isPredator || isGoat3 ? 'text-gray-300' : 'text-gray-400'}>/</span>
                                 <span className={isPredator || isGoat3 ? 'text-red-300' : 'text-red-600'}>
                                   {player.monthlyTeamLoss !== undefined ? player.monthlyTeamLoss : 0}
                                 </span>
                               </div>
                               <div className={`text-[9px] ${isPredator || isGoat3 ? 'text-gray-300' : 'text-gray-400'}`}>
                                 Victoire
                               </div>
                             </div>
                             <div className="text-center min-w-[45px] md:min-w-[55px]">
                               <div className="font-bold text-[11px] flex items-center justify-center gap-0.5">
                                 <FiTarget size={12} className={isPredator || isGoat3 ? 'text-red-300' : 'text-red-600'} />
                                 <span className={isPredator || isGoat3 ? 'text-green-300 drop-shadow-[0_0_4px_rgba(34,197,94,0.6)]' : 'text-green-600'}>
                                   {player.monthlyTeamGoal !== undefined ? Math.round(player.monthlyTeamGoal) : 0}
                                 </span>
                                 <span className={isPredator || isGoat3 ? 'text-gray-300' : 'text-gray-400'}>/</span>
                                 <span className={isPredator || isGoat3 ? 'text-orange-300' : 'text-orange-600'}>
                                   {player.monthlyTeamGoalC !== undefined ? Math.round(player.monthlyTeamGoalC) : 0}
                                 </span>
                               </div>
                                 <div className={`text-[9px] ${isPredator || isGoat3 ? 'text-gray-300' : 'text-gray-400'}`}>
                                 TeamGoal
                               </div>
                             </div>
                             {sortBy !== 'rank' && (
                               <div className="text-center min-w-[30px] md:min-w-[40px]">
                                 <div className={`font-bold text-[11px] flex items-center justify-center gap-0.5 ${
                                   isPredator
                                     ? sortBy === 'score' ? 'text-yellow-300 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]' :
                                       sortBy === 'goals' ? 'text-green-300 drop-shadow-[0_0_4px_rgba(34,197,94,0.6)]' :
                                       sortBy === 'assists' ? 'text-purple-300 drop-shadow-[0_0_4px_rgba(168,85,247,0.6)]' :
                                       'text-white'
                                     : isGoat3
                                     ? sortBy === 'score' ? 'text-pink-300 drop-shadow-[0_0_4px_rgba(244,114,182,0.6)]' :
                                       sortBy === 'goals' ? 'text-green-300 drop-shadow-[0_0_4px_rgba(34,197,94,0.6)]' :
                                       sortBy === 'assists' ? 'text-purple-300 drop-shadow-[0_0_4px_rgba(168,85,247,0.6)]' :
                                       'text-white'
                                     : sortBy === 'score' ? 'text-blue-600' :
                                       sortBy === 'goals' ? 'text-green-600' :
                                       sortBy === 'assists' ? 'text-purple-600' :
                                       'text-gray-600'
                                 }`}>
                                   {sortBy === 'score' ? (
                                     <>
                                       <FiTrendingUp size={12} />
                                       {player.globalScore.toFixed(1)}
                                     </>
                                   ) : sortBy === 'goals' ? (
                                     <>
                                       <FiTarget size={12} />
                                       {player.goals}
                                     </>
                                   ) : sortBy === 'assists' ? (
                                     <>
                                       <FiZap size={12} />
                                       {player.assists}
                                     </>
                                   ) : (
                                     <>
                                       <FiUsers size={12} />
                                       {player.gamesPlayed}
                                     </>
                                   )}
                                 </div>
                                 <div className={`text-[9px] ${isPredator || isGoat3 ? 'text-gray-300' : 'text-gray-400'}`}>
                                   {sortBy === 'score' ? 'Score' :
                                    sortBy === 'goals' ? 'Buts' :
                                    sortBy === 'assists' ? 'Pass' :
                                    'Match'}
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
              <div className="text-center py-12 text-gray-500">
                Aucun joueur trouvé
              </div>
            )}
          </div>
        </RevealAnimation>

        {/* Ranked Player Card Modal */}
        {selectedPlayer && (
          <Dialog open={showPlayerCard} onOpenChange={() => {
            setSelectedPlayer(null);
            setShowPlayerCard(false);
          }}>
            <DialogContent className="max-w-7xl w-full mx-auto p-0 bg-transparent border-none" aria-describedby="player-dashboard-description">
              <DialogHeader className="sr-only">
                <DialogTitle>Player Dashboard for {selectedPlayer.username}</DialogTitle>
              </DialogHeader>
                  
              <div className="relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Close Button */}
                <button
                  onClick={() => {
                    setSelectedPlayer(null);
                    setShowPlayerCard(false);
                  }}
                  className="absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10"
                >
                  <FiX className="w-5 h-5 text-gray-600" />
                </button>

                {/* Desktop Layout */}
                <div className="hidden md:flex h-[80vh]">
                  {/* Left Side - Player Info */}
                  <div className="w-1/3 bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="text-center relative z-10">
                      {/* Avatar Skeleton */}
                      <div className="relative mb-8">
                        <div className="w-48 h-48 mx-auto rounded-full bg-gray-200 animate-pulse flex items-center justify-center">
                          <span className="text-7xl font-black text-gray-400">
                            {selectedPlayer.firstName?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      </div>
                      
                      <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                        {selectedPlayer.firstName || <span className="h-8 w-32 bg-gray-200 rounded animate-pulse inline-block" />}
                      </h2>
                      <p className="text-gray-600 mb-6 text-lg font-semibold">
                        @{selectedPlayer.username || <span className="h-5 w-24 bg-gray-200 rounded animate-pulse inline-block" />}
                      </p>
                      <div className="bg-white rounded-xl p-5 shadow-xl border-2 border-blue-200">
                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
                          {selectedPlayer.globalScore !== undefined ? selectedPlayer.globalScore.toFixed(1) : <span className="h-10 w-20 bg-gray-200 rounded animate-pulse inline-block" />}
                        </div>
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

                    {/* Key Metrics Grid - Skeleton */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-gray-400 mb-1">
                            {selectedPlayer.goals !== undefined && i === 1 ? selectedPlayer.goals :
                             selectedPlayer.assists !== undefined && i === 2 ? selectedPlayer.assists :
                             selectedPlayer.monthlyMatches !== undefined && i === 3 ? selectedPlayer.monthlyMatches :
                             selectedPlayer.monthlyPoints !== undefined && i === 4 ? Math.round(selectedPlayer.monthlyPoints) :
                             <span className="h-8 w-12 bg-gray-200 rounded animate-pulse inline-block" />}
                          </div>
                          <div className="text-sm text-gray-600">
                            {i === 1 ? 'Goals' : i === 2 ? 'Assists' : i === 3 ? 'Matches' : 'Points'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Stats Cards - Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl p-6 shadow-lg border">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {i === 1 ? 'Match Statistics' : i === 2 ? 'Performance Rating' : 'Advanced Stats'}
                          </h3>
                          <div className="space-y-3">
                            {[1, 2, 3].map((j) => (
                              <div key={j} className="flex justify-between">
                                <span className="text-gray-600">
                                  {i === 1 && j === 1 ? 'Total Matches' :
                                   i === 1 && j === 2 ? 'Goals per Match' :
                                   i === 1 && j === 3 ? 'Assists per Match' :
                                   i === 2 && j === 1 ? 'Global Rank' :
                                   i === 2 && j === 2 ? 'Monthly Rank' :
                                   i === 2 && j === 3 ? 'City' :
                                   i === 3 && j === 1 ? 'Team Wins' :
                                   i === 3 && j === 2 ? 'Attack Ratio' :
                                   'Defense Ratio'}
                                </span>
                                <span className="font-semibold">
                                  {selectedPlayer.gamesPlayed !== undefined && i === 1 && j === 1 ? selectedPlayer.gamesPlayed :
                                   selectedPlayer.rank !== undefined && i === 2 && j === 1 ? `#${selectedPlayer.rank}` :
                                   selectedPlayer.monthlyRank !== undefined && i === 2 && j === 2 ? `#${selectedPlayer.monthlyRank}` :
                                   selectedPlayer.city && i === 2 && j === 3 ? selectedPlayer.city :
                                   selectedPlayer.teamWins !== undefined && i === 3 && j === 1 ? selectedPlayer.teamWins :
                                   <span className="h-4 w-16 bg-gray-200 rounded animate-pulse inline-block" />}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden max-h-[90vh] overflow-y-auto">
                  {/* Mobile Header */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 text-center relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="relative mb-6">
                        <div className="w-36 h-36 mx-auto rounded-full bg-gray-200 animate-pulse flex items-center justify-center">
                          <span className="text-5xl font-black text-gray-400">
                            {selectedPlayer.firstName?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      </div>
                      
                      <h2 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">
                        {selectedPlayer.firstName || <span className="h-6 w-24 bg-gray-200 rounded animate-pulse inline-block" />}
                      </h2>
                      <p className="text-gray-600 mb-4 text-base font-semibold">
                        @{selectedPlayer.username || <span className="h-4 w-20 bg-gray-200 rounded animate-pulse inline-block" />}
                      </p>
                      <div className="bg-white rounded-xl p-4 shadow-xl border-2 border-blue-200 inline-block">
                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
                          {selectedPlayer.globalScore !== undefined ? selectedPlayer.globalScore.toFixed(1) : <span className="h-8 w-16 bg-gray-200 rounded animate-pulse inline-block" />}
                        </div>
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
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-gray-400 mb-1">
                            {selectedPlayer.goals !== undefined && i === 1 ? selectedPlayer.goals :
                             selectedPlayer.assists !== undefined && i === 2 ? selectedPlayer.assists :
                             selectedPlayer.monthlyMatches !== undefined && i === 3 ? selectedPlayer.monthlyMatches :
                             selectedPlayer.monthlyPoints !== undefined && i === 4 ? Math.round(selectedPlayer.monthlyPoints) :
                             <span className="h-6 w-10 bg-gray-200 rounded animate-pulse inline-block" />}
                          </div>
                          <div className="text-xs text-gray-600">
                            {i === 1 ? 'Goals' : i === 2 ? 'Assists' : i === 3 ? 'Matches' : 'Points'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mobile Stats Cards */}
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-lg p-4 shadow-md border">
                          <h3 className="text-base font-semibold text-gray-900 mb-3">
                            {i === 1 ? 'Match Statistics' : i === 2 ? 'Performance Rating' : 'Advanced Stats'}
                          </h3>
                          <div className="space-y-2">
                            {[1, 2, 3].map((j) => (
                              <div key={j} className="flex justify-between">
                                <span className="text-xs text-gray-600">
                                  {i === 1 && j === 1 ? 'Total Matches' :
                                   i === 1 && j === 2 ? 'Goals per Match' :
                                   i === 1 && j === 3 ? 'Assists per Match' :
                                   i === 2 && j === 1 ? 'Global Rank' :
                                   i === 2 && j === 2 ? 'Monthly Rank' :
                                   i === 2 && j === 3 ? 'City' :
                                   i === 3 && j === 1 ? 'Team Wins' :
                                   i === 3 && j === 2 ? 'Attack Ratio' :
                                   'Defense Ratio'}
                                </span>
                                <span className="text-sm font-semibold">
                                  {selectedPlayer.gamesPlayed !== undefined && i === 1 && j === 1 ? selectedPlayer.gamesPlayed :
                                   selectedPlayer.rank !== undefined && i === 2 && j === 1 ? `#${selectedPlayer.rank}` :
                                   selectedPlayer.monthlyRank !== undefined && i === 2 && j === 2 ? `#${selectedPlayer.monthlyRank}` :
                                   selectedPlayer.city && i === 2 && j === 3 ? selectedPlayer.city :
                                   selectedPlayer.teamWins !== undefined && i === 3 && j === 1 ? selectedPlayer.teamWins :
                                   <span className="h-3 w-12 bg-gray-200 rounded animate-pulse inline-block" />}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div id="player-dashboard-description" className="sr-only">
                Comprehensive player dashboard showing detailed statistics and analytics for {selectedPlayer.username}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </section>
  );
};

export default RankedLeaderboardSection;

