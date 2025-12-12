import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useCompanyContext } from "@/hooks/use-company-context";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FiCalendar, FiMapPin, FiClock, FiUsers, FiCheck, FiX, FiStar, FiRefreshCw, FiFilter, FiTrendingUp, FiTarget, FiAward, FiZap, FiShield, FiAlertTriangle, FiThumbsUp, FiThumbsDown, FiChevronLeft, FiChevronRight, FiInfo } from "react-icons/fi";
import { ChevronDown } from "lucide-react";
import { TbBuildingStadium } from "react-icons/tb";
import { trackEvent } from "@/lib/analytics";
import { useCityPreference } from "@/hooks/use-city-preference";
import { CitySelectionModal } from "@/components/ui/CitySelectionModal";
import { useIsMobile } from "@/hooks/use-mobile";

// Composant pour animer les changements de nombres
const AnimatedNumber = ({ value, className = "" }: { value: number | string, className?: string }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayValue !== value) {
      setIsAnimating(true);
      setTimeout(() => {
        setDisplayValue(value);
        setTimeout(() => setIsAnimating(false), 150);
      }, 150);
    }
  }, [value, displayValue]);

  return (
    <span className={`transition-all duration-300 ${isAnimating ? 'scale-110 text-green-400' : ''} ${className}`}>
      {displayValue}
    </span>
  );
};

// Helper functions for countdown timer
const parseMatchDateTime = (date: string, time: string): Date => {
  try {
    // Parse the date components
    let year: number, month: number, day: number;
    
    if (date.includes('-') && date.length === 10) {
      // ISO format: "2024-12-18"
      const parts = date.split('-');
      year = parseInt(parts[0]);
      month = parseInt(parts[1]) - 1; // Month is 0-indexed
      day = parseInt(parts[2]);
    } else if (date.includes('/')) {
      // Format: "18/12/2024" or "12/18/2024"
      const parts = date.split('/');
      if (parts[2] && parts[2].length === 4) {
        // Assume DD/MM/YYYY for European format
        day = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1; // Month is 0-indexed
        year = parseInt(parts[2]);
      } else {
        // Fallback to MM/DD/YYYY
        month = parseInt(parts[0]) - 1;
        day = parseInt(parts[1]);
        year = parseInt(parts[2]);
      }
    } else {
      console.error('Unrecognized date format:', date);
      return new Date();
    }
    
    // Parse time components
    const timeClean = time.replace(/\(.*\)/, '').trim();
    const timeParts = timeClean.split(':');
    const hours = parseInt(timeParts[0]) || 0;
    const minutes = parseInt(timeParts[1]) || 0;
    
    // Create date in local timezone
    const parsedDate = new Date(year, month, day, hours, minutes, 0, 0);
    
    // Validate the parsed date
    if (isNaN(parsedDate.getTime())) {
      console.error('Invalid date created:', { date, time, year, month, day, hours, minutes });
      return new Date();
    }
    
    return parsedDate;
  } catch (error) {
    console.error('Error parsing date/time:', date, time, error);
    return new Date();
  }
};

const getCountdownInfo = (matchDate: Date) => {
  // Get current time in local timezone
  const now = new Date();
  
  // Calculate time difference
  const timeDiff = matchDate.getTime() - now.getTime();
  
  const isPast = timeDiff < 0;
  const absTimeDiff = Math.abs(timeDiff);
  
  const days = Math.floor(absTimeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absTimeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absTimeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absTimeDiff % (1000 * 60)) / 1000);
  
  const totalHours = Math.floor(absTimeDiff / (1000 * 60 * 60));
  
  // Check if it's today or tomorrow using local timezone comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const matchDay = new Date(matchDate);
  matchDay.setHours(0, 0, 0, 0);
  
  const isToday = matchDay.getTime() === today.getTime();
  const isTomorrow = matchDay.getTime() === tomorrow.getTime();
  
  return {
    isPast,
    days,
    hours,
    minutes,
    seconds,
    totalHours,
    isToday,
    isTomorrow
  };
};

const getDayLabel = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    const formattedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    
    // Calculate if it's today or tomorrow
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const matchDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (matchDay.getTime() === today.getTime()) {
      return `${formattedDayName} (Aujourd'hui)`;
    } else if (matchDay.getTime() === tomorrow.getTime()) {
      return `${formattedDayName} (Demain)`;
    }
    
    return formattedDayName;
  } catch (error) {
    console.error('Error formatting day label:', dateStr, error);
    return dateStr; // Fallback to original string
  }
};

const formatCountdown = (days: number, hours: number, minutes: number, seconds: number): string => {
  // Vérifier que les valeurs sont valides
  if (isNaN(days) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
    return '';
  }
  
  if (days > 0) {
    return `${days}j ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m ${seconds}s`;
  }
};

const getMatchCardBorderStyle = (matchDate: Date): string => {
  const countdown = getCountdownInfo(matchDate);
  
  if (countdown.isPast) {
    return 'border-2 border-gray-300';
  } else if (countdown.isToday) {
    return 'border border-gray-200'; // Pas de border statique pour aujourd'hui, seulement l'overlay animé
  } else if (countdown.totalHours <= 4) {
    return 'border-2 border-orange-500';
  } else if (countdown.totalHours <= 24) {
    return 'border-2 border-green-500';
  }
  
  return 'border border-gray-200';
};

const getBorderAnimationClass = (matchDate: Date): string => {
  const countdown = getCountdownInfo(matchDate);
  
  if (countdown.isToday) {
    return 'animate-pulse';
  }
  
  return '';
};

const getStatusIndicator = (matchDate: Date, match: any) => {
  const countdown = getCountdownInfo(matchDate);
  
  if (countdown.isPast) {
    return { color: 'bg-gray-400', animate: false };
  }
  
  // Check if match has available spots
  const hasAvailableSpots = match.players.length < match.maxPlayers;
  const isWithin2Days = countdown.totalHours <= 48; // 2 days = 48 hours
  
  // Determine color based on availability
  const baseColor = hasAvailableSpots ? 'bg-green-500' : 'bg-orange-600';
  
  // Add animation if within 2 days
  const shouldAnimate = isWithin2Days;
  
  return { color: baseColor, animate: shouldAnimate };
};

// Live Countdown Badge Component
const LiveCountdownBadge = ({ matchDate }: { matchDate: Date }) => {
  const [liveCountdown, setLiveCountdown] = useState(() => getCountdownInfo(matchDate));
  
  // Update countdown in real-time
  useEffect(() => {
    const updateCountdown = () => {
      const newCountdown = getCountdownInfo(matchDate);
      setLiveCountdown(newCountdown);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [matchDate.getTime()]);
  
  if (liveCountdown.isPast) {
    return null;
  }
  
  // Format countdown text
  let countdownText = '';
  const totalMinutes = liveCountdown.days * 24 * 60 + liveCountdown.hours * 60 + liveCountdown.minutes;
  
  if (totalMinutes < 60) {
    // Less than 1 hour - show minutes and seconds
    countdownText = `${liveCountdown.minutes}m ${liveCountdown.seconds}s`;
  } else if (totalMinutes < 1440) {
    // Less than 24 hours - show hours and minutes
    countdownText = `${liveCountdown.hours}h ${liveCountdown.minutes}m`;
  } else {
    // More than 24 hours - show days, hours, minutes
    if (liveCountdown.hours > 0) {
      countdownText = `${liveCountdown.days}j ${liveCountdown.hours}h ${liveCountdown.minutes}m`;
    } else {
      countdownText = `${liveCountdown.days}j ${liveCountdown.minutes}m`;
    }
  }
  
  return (
    <div className="flex items-center gap-1 bg-gradient-to-r from-orange-400 to-orange-600 text-white px-2 py-1 rounded-full text-[10px] font-semibold shadow-sm">
      <div className="w-1 h-1 bg-orange-200 rounded-full"></div>
      <span>{countdownText}</span>
    </div>
  );
};

// Countdown Timer Component
const CountdownTimer = ({ date, time }: { date: string; time: string }) => {
  const [countdown, setCountdown] = useState(() => {
    try {
      const matchDate = parseMatchDateTime(date, time);
      return getCountdownInfo(matchDate);
    } catch (error) {
      console.error('Error initializing countdown:', error);
      return { isPast: false, days: 0, hours: 0, minutes: 0, seconds: 0, totalHours: 0, isToday: false, isTomorrow: false };
    }
  });

  useEffect(() => {
    try {
      const matchDate = parseMatchDateTime(date, time);
      
      const updateCountdown = () => {
        const newCountdown = getCountdownInfo(matchDate);
        setCountdown(newCountdown);
      };

      // Update immediately
      updateCountdown();
      
      // Update every second for dynamic feeling
      const interval = setInterval(updateCountdown, 1000);
      
      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error setting up countdown timer:', error);
    }
  }, [date, time]);

  if (countdown.isPast) {
    return null; // Don't show countdown for past matches
  }

  const countdownText = formatCountdown(countdown.days, countdown.hours, countdown.minutes, countdown.seconds);
  
  if (!countdownText) {
    return null; // Don't show if countdown text is invalid
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
        <span style={{fontSize: '10px'}}>{countdownText}</span>
      </div>
    </div>
  );
};

// Types pour les matchs
interface Player {
  id: string;
  username: string;
  fullName: string;
  globalScore: number;
  points?: number;  // Points from Points column (for display, different from Global Score)
  gamesPlayed: number;
  ranking: number;
  cityRanking: number;
  rankTier?: string;        // Rank tier from Rank column (e.g., "Predator", "Goat", "FOX 1", etc.)
  level?: string;           // Level from Level column (e.g., "Street", "Pro", "Amateur", "Level 12", etc.)
  paymentStatus: "Payé" | "Non payé" | "Nouveau joueur" | "Subscription";
  isNewPlayer: boolean;
  goals?: number;
  assists?: number;
  goalsConceded?: number;
  teamWins?: number;
  jerseyNumber?: number;
  team?: "Orange" | "Jaune" | "Blue" | "Yellow" | "Vert";
  attackRatio?: number;     // ATT from CSV
  defenseRatio?: number;    // DEF from CSV
  teamScore?: number;       // Team Score from CSV
  soloScore?: number;       // Solo Score from CSV
  solde?: number;           // Subscriber balance from SubGamesLeft column
  expirationDate?: string;  // Expiration date from ExpirationDate column
  streak?: number;          // Win streak or consecutive games streak
  age?: number;             // Age from Age column
  position?: string;         // Player position (e.g., "CM", "AT", "DF", "GK", etc.)
}

interface TeamPlayer {
  id: string;
  username: string;
  fullName: string;
  jerseyNumber: number;
  paymentStatus: "Payé" | "Non payé" | "Nouveau joueur" | "Subscription";
  solde?: number;           // Subscriber balance
  expirationDate?: string;  // Expiration date
  globalScore: number;      // Player score
  points?: number;          // Points from Points column (for display, different from Global Score)
  ranking: number;          // Player ranking
  rankTier?: string;        // Rank tier from Rank column (e.g., "Predator", "Goat", "FOX 1", etc.)
  level?: string;           // Level from Level column (e.g., "Street", "Pro", "Amateur", "Level 12", etc.)
  gamesPlayed: number;      // Games played
  attackRatio?: number;     // Attack ratio
  defenseRatio?: number;    // Defense ratio
  streak?: number;          // Win streak or consecutive games streak
  teamWins?: number;        // Team wins from Team Win column
  goals?: number;           // Goals from Goals column
  assists?: number;         // Assists from Assists column
  goalsConceded?: number;   // Goals Conceded from Goals Conceded column
  teamScore?: number;       // Team Score from Team Score column
  age?: number;             // Age from Age column
  position?: string;         // Player position (e.g., "CM", "AT", "DF", "GK", etc.)
}

interface Team {
  name: "Orange" | "Jaune" | "Blue" | "Yellow" | "Vert";
  color: string;
  players: TeamPlayer[];
}

interface Match {
  id: string;
  gameId: string;
  city: string;
  field: string;
  date: string;
  time: string;
  format: string;
  status: "Complet" | "Besoin d'autres joueurs";
  players: Player[];
  maxPlayers: number;
  teams?: Team[];
  captain?: string;
  mode?: string;
  price?: number;
  level?: string;
  playersPerTeam?: number; // Number of players per team
  numberOfTeams?: number; // Number of teams
}

// Configuration Google Sheets par défaut - WebsiteGame sheet (gid=216631647)
// This MUST use the WebsiteGame sheet for upcoming matches data
const DEFAULT_MATCHES_SHEET_CONFIG = {
  csvUrl: "https://rayobackend.onrender.com/api/sheets/WebsiteGame"
};

// Configuration for Foot_Players sheet (for player statistics)
const DEFAULT_FOOT_PLAYERS_SHEET_CONFIG = {
  csvUrl: 'https://rayobackend.onrender.com/api/sheets/Foot_Players',
};

const UpcomingMatchesSection = ({ onPlayerClick }: { onPlayerClick?: (username: string) => void } = {}) => {
  const { t } = useLanguage();
  const { customDataSources } = useCompanyContext();
  
  // Player stats state for like/dislike counts
  const [playerStats, setPlayerStats] = useState<{[key: string]: {likes: number, dislikes: number, views: number, userVote: 'like' | 'dislike' | null}}>({});
  
  // Load player stats from localStorage
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem('playerStats');
      if (savedStats) {
        setPlayerStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.error('Error loading player stats:', error);
    }
  }, []);

  // Get player stats
  const getPlayerStats = (playerUsername: string) => {
    return playerStats[playerUsername] || { likes: 0, dislikes: 0, views: 0, userVote: null };
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

  // Format rank tier for display (convert all rank numbers to Roman numerals)
  const formatRankTierForDisplay = (tier: string | undefined): string => {
    if (!tier) return '';
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

  // Get badge class for rank name
  const getRankBadgeClass = (rankName: string | undefined): string => {
    if (!rankName) return 'bg-gray-500 text-white';
    
    const tierLower = rankName.toLowerCase().trim();
    
    if (tierLower.includes('predator')) {
      return 'bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 via-cyan-400 to-yellow-400 text-white shadow-lg shadow-yellow-400/50 animate-gradient bg-[length:200%_200%] font-extrabold';
    } else if (tierLower.includes('goat')) {
      if (tierLower.includes('goat 3') || tierLower.includes('goat3')) {
        return 'bg-gradient-to-r from-pink-400 via-purple-500 to-rose-500 text-white shadow-lg shadow-pink-400/50 animate-gradient bg-[length:200%_200%] font-extrabold';
      } else if (tierLower.includes('goat 2') || tierLower.includes('goat2')) {
        return 'bg-gradient-to-r from-sky-300 via-cyan-400 to-blue-500 text-white shadow-lg shadow-sky-300/50 animate-gradient bg-[length:200%_200%] font-extrabold';
      } else {
        return 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-white shadow-lg shadow-yellow-400/50 animate-gradient bg-[length:200%_200%] font-extrabold';
      }
    } else if (tierLower.includes('gorilla')) {
      const gorillaNum = (tierLower.includes('gorilla 3') || tierLower.includes('gorilla3')) ? 'from-blue-600 to-cyan-600' : 
                        (tierLower.includes('gorilla 2') || tierLower.includes('gorilla2')) ? 'from-blue-500 to-cyan-500' : 
                        (tierLower.includes('gorilla 1') || tierLower.includes('gorilla1')) ? 'from-blue-400 to-cyan-400' :
                        'from-blue-400 to-cyan-400';
      return `bg-gradient-to-r ${gorillaNum} text-white shadow-md`;
    } else if (tierLower.includes('crocodile')) {
      const crocNum = tierLower.includes('crocodile 3') ? 'from-green-600 to-emerald-600' : 
                     tierLower.includes('crocodile 2') ? 'from-green-500 to-emerald-500' : 
                     'from-green-400 to-emerald-400';
      return `bg-gradient-to-r ${crocNum} text-white shadow-md`;
    } else if (tierLower.includes('fox 3')) {
      return 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md';
    } else if (tierLower.includes('fox 2')) {
      return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md';
    } else if (tierLower.includes('fox 1')) {
      return 'bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-md';
    } else if (tierLower.includes('rookie')) {
      return 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md';
    } else if (tierLower.includes('unranked')) {
      return 'bg-gray-500 text-white';
    } else {
      return 'bg-gray-500 text-white';
    }
  };

  // Get points text color to match rank badge color
  const getRankPointsColor = (rankName: string | undefined): string => {
    if (!rankName) return 'text-gray-400';
    
    const tierLower = rankName.toLowerCase().trim();
    
    if (tierLower.includes('predator')) {
      return 'text-yellow-400';
    } else if (tierLower.includes('goat')) {
      if (tierLower.includes('goat 3') || tierLower.includes('goat3')) {
        return 'text-pink-400';
      } else if (tierLower.includes('goat 2') || tierLower.includes('goat2')) {
        return 'text-cyan-400';
      } else {
        return 'text-amber-400';
      }
    } else if (tierLower.includes('gorilla')) {
      return 'text-blue-400';
    } else if (tierLower.includes('crocodile')) {
      return 'text-emerald-400';
    } else if (tierLower.includes('fox')) {
      return 'text-orange-400';
    } else if (tierLower.includes('rookie')) {
      return 'text-amber-500';
    } else {
      return 'text-gray-400';
    }
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

  // Get text color for level based on 10-level segments (matching badge colors)
  const getLevelTextColor = (levelValue: number): string => {
    if (levelValue <= 0) return 'text-gray-400';
    const segment = Math.floor(levelValue / 10);
    const colorMap: { [key: number]: string } = {
      0: 'text-gray-400',      // Level 1-9
      1: 'text-blue-500',      // Level 10-19
      2: 'text-green-500',     // Level 20-29
      3: 'text-yellow-500',    // Level 30-39
      4: 'text-orange-500',    // Level 40-49
      5: 'text-red-500',       // Level 50-59
      6: 'text-pink-500',      // Level 60-69
      7: 'text-purple-500',    // Level 70-79
      8: 'text-indigo-500',    // Level 80-89
      9: 'text-cyan-500',      // Level 90-99
    };
    // For level 100+, cycle through colors again
    const cycleIndex = segment % 10;
    return colorMap[cycleIndex] || colorMap[0];
  };

  // Get rank logo URL and styling based on rank name
  const getRankLogoForName = (rankName: string | undefined) => {
    if (!rankName) {
      // Default to unranked if no rank name
      return { 
        logoUrl: '/images/gallery/optimized/unranked.png', 
        style: { border: '', size: 'w-4 h-4' },
        rankTier: -1,
        isPredator: false
      };
    }
    
    const rankLower = rankName.toLowerCase().trim();
    let logoUrl = '';
    let rankTier = 0;
    
    // Check for Predator with number (Predator #1, Predator #2, etc.)
    if (rankLower.includes('predator')) {
      rankTier = 9;
      logoUrl = '/images/gallery/optimized/Predator.png';
    } else if (rankLower.includes('goat 3') || rankLower.includes('goat3')) {
      rankTier = 8;
      logoUrl = '/images/gallery/optimized/Goat3.png';
    } else if (rankLower.includes('goat 2') || rankLower.includes('goat2')) {
      rankTier = 7;
      logoUrl = '/images/gallery/optimized/Goat2.png';
    } else if (rankLower.includes('goat 1') || rankLower.includes('goat1')) {
      rankTier = 6;
      logoUrl = '/images/gallery/optimized/Goat1.png';
    } else if (rankLower.includes('gorilla 3') || rankLower.includes('gorilla3')) {
      rankTier = 5;
      logoUrl = '/images/gallery/optimized/Gorilla3.png';
    } else if (rankLower.includes('gorilla 2') || rankLower.includes('gorilla2')) {
      rankTier = 4;
      logoUrl = '/images/gallery/optimized/Gorilla2.png';
    } else if (rankLower.includes('gorilla 1') || rankLower.includes('gorilla1')) {
      rankTier = 3;
      logoUrl = '/images/gallery/optimized/Gorilla1.png';
    } else if (rankLower.includes('crocodile 3')) {
      rankTier = 2;
      logoUrl = '/images/gallery/optimized/crocodile3.png';
    } else if (rankLower.includes('crocodile 2')) {
      rankTier = 2;
      logoUrl = '/images/gallery/optimized/crocodile2.png';
    } else if (rankLower.includes('crocodile 1')) {
      rankTier = 2;
      logoUrl = '/images/gallery/optimized/crocodile1.png';
    } else if (rankLower.includes('fox 3')) {
      rankTier = 1;
      logoUrl = '/images/gallery/optimized/fox3.png';
    } else if (rankLower.includes('fox 2')) {
      rankTier = 1;
      logoUrl = '/images/gallery/optimized/fox2.png';
    } else if (rankLower.includes('fox 1')) {
      rankTier = 1;
      logoUrl = '/images/gallery/optimized/fox1.png';
    } else if (rankLower.includes('rookie')) {
      rankTier = 0;
      logoUrl = '/images/gallery/optimized/Rookie.png';
    } else if (rankLower.includes('unranked')) {
      rankTier = -1;
      logoUrl = '/images/gallery/optimized/unranked.png';
    } else {
      // Default to unranked if no match found
      rankTier = -1;
      logoUrl = '/images/gallery/optimized/unranked.png';
    }
    
    // Border styles based on tier
    const borderStyles: any = {
      '-1': { border: '', size: 'w-4 h-4' },
      0: { border: '', size: 'w-4 h-4' },
      1: { border: '', size: 'w-4 h-4' },
      2: { border: '', size: 'w-4 h-4' },
      3: { border: '', size: 'w-4 h-4' },
      4: { border: '', size: 'w-4 h-4' },
      5: { border: '', size: 'w-4 h-4' },
      6: { border: '', size: 'w-4 h-4' },
      7: { border: '', size: 'w-4 h-4' },
      8: { border: '', size: 'w-4 h-4' },
      9: { border: '', size: 'w-4 h-4', isPredator: true }
    };
    
    const style = borderStyles[rankTier] || borderStyles['-1'] || borderStyles[0];
    
    return { logoUrl, style, rankTier, isPredator: rankTier === 9 };
  };

  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [playerStatsMap, setPlayerStatsMap] = useState<Map<string, { gamesPlayed: number; ranking: number; globalScore: number; points?: number; rankTier?: string; level?: string; streak?: number; teamWins?: number; goals?: number; assists?: number; goalsConceded?: number; teamScore?: number; age?: number }>>(new Map());
  const [rayoSupport, setRayoSupport] = useState<Map<string, boolean>>(new Map());
  const [selectedCity, setSelectedCity] = useState<string>("All cities");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerCard, setShowPlayerCard] = useState(false);
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>(() => {
    // Get saved city from localStorage, default to "Casablanca" if first time or if "all" was selected
    const savedCity = localStorage.getItem('selectedCityFilter');
    if (!savedCity || savedCity === 'all' || savedCity === 'Toutes les villes') {
      return 'Casablanca'; // Default to Casablanca instead of showing all cities
    }
    return savedCity;
  });
  const [countdownTime, setCountdownTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // City preference management
  const { selectedCity: savedCity, isFirstVisit, saveCityPreference } = useCityPreference();
  const [showCityModal, setShowCityModal] = useState(false);
  
  const isMobile = useIsMobile();

  // Handle city selection
  const handleCitySelect = (city: string) => {
    saveCityPreference(city);
    setSelectedCity(city);
    setShowCityModal(false);
    trackEvent('city_preference_selected', 'user_preference', city);
  };
  
  // Get city configuration
  const getCityConfig = (cityName: string) => {
    const cityLower = cityName.toLowerCase();
    const cityConfigs: Record<string, { color: string; icon: string; textColor: string }> = {
      'casablanca': { color: "from-blue-500 to-blue-600", icon: "🏙️", textColor: "text-blue-600" },
      'marrakech': { color: "from-orange-500 to-orange-600", icon: "🏜️", textColor: "text-orange-600" },
      'marrakesh': { color: "from-orange-500 to-orange-600", icon: "🏜️", textColor: "text-orange-600" },
      'tanger': { color: "from-green-500 to-green-600", icon: "🌊", textColor: "text-green-600" },
      'rabat': { color: "from-purple-500 to-purple-600", icon: "🏛️", textColor: "text-purple-600" },
      'fès': { color: "from-indigo-500 to-indigo-600", icon: "🕌", textColor: "text-indigo-600" },
      'fes': { color: "from-indigo-500 to-indigo-600", icon: "🕌", textColor: "text-indigo-600" },
      'agadir': { color: "from-cyan-500 to-cyan-600", icon: "🏖️", textColor: "text-cyan-600" },
      'berrechid': { color: "from-emerald-500 to-emerald-600", icon: "⚽", textColor: "text-emerald-600" },
      'bouskoura': { color: "from-pink-500 to-pink-600", icon: "🌟", textColor: "text-pink-600" }
    };
    
    for (const [key, config] of Object.entries(cityConfigs)) {
      if (cityLower.includes(key) || key.includes(cityLower)) {
        return config;
      }
    }
    return { color: "from-gray-500 to-gray-600", icon: "🏙️", textColor: "text-gray-600" };
  };
  
  // Get city stats from matches
  const getCityStats = (cityName: string) => {
    const cityMatches = matches.filter(m => {
      const matchCity = m.city?.toLowerCase().trim();
      const searchCity = cityName.toLowerCase().trim();
      return matchCity === searchCity || 
             (matchCity && searchCity && (matchCity.includes(searchCity) || searchCity.includes(matchCity)));
    });
    
    const upcomingMatches = cityMatches.filter(match => {
      try {
        const matchDate = parseMatchDateTime(match.date, match.time);
        return matchDate > new Date();
      } catch {
        return false;
      }
    });
    
    const nextMatch = upcomingMatches.length > 0 ? upcomingMatches[0] : null;
    let nextMatchInfo = "Aucun match";
    let location = "TBA";
    
    if (nextMatch) {
      try {
        const matchDate = parseMatchDateTime(nextMatch.date, nextMatch.time);
        const dayName = matchDate.toLocaleDateString('fr-FR', { weekday: 'short' });
        const timeStr = nextMatch.time?.substring(0, 5) || "TBA";
        nextMatchInfo = `${matchDate.getDate()} ${dayName} ${timeStr}`;
        location = nextMatch.field || "TBA";
      } catch {
        nextMatchInfo = `${nextMatch.date} ${nextMatch.time}`;
        location = nextMatch.field || "TBA";
      }
    }
    
    // Count unique players in city matches
    const uniquePlayers = new Set<string>();
    cityMatches.forEach(match => {
      match.players?.forEach(player => {
        if (player.username) uniquePlayers.add(player.username);
      });
    });
    
    return {
      totalMatches: cityMatches.length,
      upcomingMatches: upcomingMatches.length,
      players: uniquePlayers.size,
      nextMatch: nextMatchInfo,
      location: location
    };
  };

  // Get unique cities from matches
  const getUniqueCities = (matches: Match[]): string[] => {
    const cities = matches.map(match => match.city).filter(Boolean);
    return Array.from(new Set(cities)).sort();
  };

  // Map city names for display (internal name -> display name)
  const getCityDisplayName = (city: string): string => {
    const cityDisplayMap: Record<string, string> = {
      'Marrakesh': 'Marrakech',
      'Marrakech': 'Marrakech',
      'Casablanca': 'Casablanca',
      'Tanger': 'Tanger',
      'Rabat': 'Rabat',
      'Fès': 'Fès',
      'Agadir': 'Agadir'
    };
    return cityDisplayMap[city] || city;
  };

  // Parse weekly planning data from Google Sheet
  const parseWeeklyPlanningCSV = (csvData: string): Record<string, Record<string, string>> => {
    console.log('=== PARSING WEEKLY PLANNING CSV ===');
    console.log('Raw CSV data length:', csvData.length);
    console.log('Raw CSV first 500 chars:', csvData.substring(0, 500));
    
    const lines = csvData.split('\n').filter(line => line.trim());
    console.log('CSV lines count:', lines.length);
    if (lines.length < 2) {
      console.log('Not enough lines in CSV data');
      return {};
    }

    const planning: Record<string, Record<string, string>> = {};
    
    // Parse header row (B1 to H1) - days of the week
    const headerLine = lines[0];
    console.log('Header line:', headerLine);
    const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('Headers:', headers);
    const dayColumns = headers.slice(1, 8); // B1 to H1 (7 days)
    console.log('Day columns:', dayColumns);
    
    // Map French day names (handle case variations)
    const dayMapping: Record<string, string> = {
      'Lundi': 'Lundi',
      'lundi': 'Lundi',
      'Mardi': 'Mardi', 
      'mardi': 'Mardi',
      'Mercredi': 'Mercredi',
      'mercredi': 'Mercredi',
      'Jeudi': 'Jeudi',
      'jeudi': 'Jeudi',
      'Vendredi': 'Vendredi',
      'vendredi': 'Vendredi',
      'Samedi': 'Samedi',
      'samedi': 'Samedi',
      'Dimanche': 'Dimanche',
      'dimanche': 'Dimanche'
    };

    // Parse data rows (A2 onwards) - cities and their schedules
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      console.log(`Processing line ${i}:`, line);
      const row = line.split(',').map(cell => cell.trim().replace(/"/g, ''));
      console.log(`Row ${i} parsed:`, row);
      
      if (row.length < 8) {
        console.log(`Skipping incomplete row ${i} (length: ${row.length})`);
        continue; // Skip incomplete rows
      }
      
      const city = row[0]?.trim(); // Column A - city name
      console.log(`City found: "${city}"`);
      if (!city) continue;
      
      // Handle "Marrakesh" vs "Marrakech" naming
      const normalizedCity = city === 'Marrakesh' ? 'Marrakech' : city;
      planning[normalizedCity] = {};
      console.log(`Creating planning entry for city: ${normalizedCity}`);
      
      // Parse each day's schedule (B2 to H2, etc.)
      for (let j = 1; j < 8; j++) {
        const dayName = dayMapping[dayColumns[j - 1]] || dayColumns[j - 1];
        const schedule = row[j]?.trim();
        console.log(`Day ${j-1} (${dayColumns[j-1]} -> ${dayName}): "${schedule}"`);
        if (schedule && schedule !== '') {
          planning[normalizedCity][dayName] = schedule;
          console.log(`Added schedule for ${normalizedCity} on ${dayName}: ${schedule}`);
        }
      }
    }
    
    console.log('Final planning data:', planning);
    console.log('=== END PARSING WEEKLY PLANNING CSV ===');
    
    return planning;
  };

  // Filter matches by selected city (per city only, no "all" option)
  const filteredMatches = matches.filter(match => {
    return match.city === selectedCityFilter;
  });
  
  // Get match counts per city
  const getCityMatchCount = (city: string): number => {
    return matches.filter(match => match.city === city).length;
  };
  
  // Get all unique cities with match counts
  const citiesWithCounts = useMemo(() => {
    const cities = getUniqueCities(matches);
    return cities.map(city => ({
      name: city,
      displayName: getCityDisplayName(city),
      count: getCityMatchCount(city)
    })).sort((a, b) => b.count - a.count); // Sort by count descending
  }, [matches]);

  // Auto-select the first city with matches if the current selected city has no matches
  useEffect(() => {
    if (matches.length > 0 && citiesWithCounts.length > 0) {
      const currentCityHasMatches = matches.some(match => match.city === selectedCityFilter);
      if (!currentCityHasMatches) {
        // Select the first city that has matches
        const firstCityWithMatches = citiesWithCounts[0]?.name;
        if (firstCityWithMatches) {
          setSelectedCityFilter(firstCityWithMatches);
          localStorage.setItem('selectedCityFilter', firstCityWithMatches);
        }
      }
    }
  }, [matches, citiesWithCounts, selectedCityFilter]);

  // Handler pour ouvrir la carte joueur
  const handlePlayerClick = (player: Player) => {
    // If onPlayerClick prop is provided, use the Advanced Performance Analysis dashboard
    if (onPlayerClick) {
      trackEvent('upcoming_match_player_click', 'user_engagement', player.username);
      onPlayerClick(player.username);
      return;
    }
    
    // Fallback to old FIFA card if no prop provided
    setSelectedPlayer(player);
    setShowPlayerCard(true);
    trackEvent('player_card_view', 'interaction', player.username);
  };

  // Generate random position for players
  const getRandomPosition = (): string => {
    const positions = ['GK', 'DF', 'LW', 'RW', 'ST'];
    return positions[Math.floor(Math.random() * positions.length)];
  };

  // Fonction pour parser les données CSV du nouveau Google Sheet
  const parseMatchesCSV = (csvData: string): Match[] => {
    console.log('=== PARSING WEBSITEGAME CSV ===');
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      console.log('Not enough lines in CSV data');
      return [];
    }

    // Parse CSV header to find column indices by name (more robust than position-based)
    const headerLine = lines[0];
    const headerRow: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < headerLine.length; j++) {
      const char = headerLine[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        headerRow.push(current.trim().replace(/"/g, '').replace(/\r/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    headerRow.push(current.trim().replace(/"/g, '').replace(/\r/g, ''));
    
    // Find column indices by header name (case-insensitive)
    const getColumnIndex = (name: string): number => {
      const lowerName = name.toLowerCase();
      return headerRow.findIndex(h => h.toLowerCase() === lowerName);
    };
    
    const gameIdIdx = getColumnIndex('GameID');
    const terrainIdx = getColumnIndex('Terrain');
    const dateIdx = getColumnIndex('Date');
    const cityIdx = getColumnIndex('City');
    const playerUsernameIdx = getColumnIndex('PlayerUsername');
    const matchIdx = getColumnIndex('Match');
    const teamIdx = getColumnIndex('Team');
    const numberIdx = getColumnIndex('Number');
    // Try both "Capitaine" and "Capitain name" for captain column
    const capitaineIdx = getColumnIndex('Capitaine') >= 0 ? getColumnIndex('Capitaine') : getColumnIndex('Capitain name');
    const modeIdx = getColumnIndex('Mode');
    const priceIdx = getColumnIndex('Price');
    const playerPerTeamIdx = getColumnIndex('PlayerPerTeam');
    const teamQTYIdx = getColumnIndex('TeamQTY');
    const levelIdx = getColumnIndex('Level');
    const ageIdx = getColumnIndex('Age');
    
    // Also try alternative column names for price
    const priceIdxAlt = getColumnIndex('Prix');
    const finalPriceIdx = priceIdx >= 0 ? priceIdx : (priceIdxAlt >= 0 ? priceIdxAlt : -1);
    
    console.log('CSV Headers found:', {
      GameID: gameIdIdx,
      Terrain: terrainIdx,
      Date: dateIdx,
      City: cityIdx,
      PlayerUsername: playerUsernameIdx,
      Match: matchIdx,
      Team: teamIdx,
      Number: numberIdx,
      Capitaine: capitaineIdx,
      Mode: modeIdx,
      Price: priceIdx,
      'Price (Prix)': priceIdxAlt,
      'Price (final)': finalPriceIdx,
      PlayerPerTeam: playerPerTeamIdx,
      TeamQTY: teamQTYIdx,
      Level: levelIdx,
      Age: ageIdx,
      'All headers': headerRow
    });
    
    // Warn if critical columns are missing
    if (cityIdx < 0) {
      console.error('❌ City column not found in CSV!');
    }
    if (playerUsernameIdx < 0) {
      console.error('❌ PlayerUsername column not found in CSV!');
    }
    if (gameIdIdx < 0) {
      console.error('❌ GameID column not found in CSV!');
    }
    
    const matchesMap = new Map<string, Match>();
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Parser CSV en gérant les virgules dans les guillemets (comme "7,5")
      const row: string[] = [];
      current = '';
      inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim().replace(/"/g, '').replace(/\r/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.trim().replace(/"/g, '').replace(/\r/g, ''));
      
      // Map CSV columns using header-based indices
      const gameId = gameIdIdx >= 0 ? row[gameIdIdx]?.trim() || '' : '';
      const terrain = terrainIdx >= 0 ? row[terrainIdx]?.trim() || '' : '';
      const dateTime = dateIdx >= 0 ? row[dateIdx]?.trim() || '' : '';
      const city = cityIdx >= 0 ? row[cityIdx]?.trim() || '' : '';
      const playerUsername = playerUsernameIdx >= 0 ? row[playerUsernameIdx]?.trim() || '' : '';
      const matchNumber = matchIdx >= 0 ? row[matchIdx]?.trim() || '' : '';
      const team = teamIdx >= 0 ? row[teamIdx]?.trim() || '' : '';
      const playerNumber = numberIdx >= 0 ? row[numberIdx]?.trim() || '' : '';
      const capitaine = capitaineIdx >= 0 ? row[capitaineIdx]?.trim() || '' : '';
      const gameMode = modeIdx >= 0 ? row[modeIdx]?.trim() || '' : '';
      // Try to get price from Price column, or alternative names
      const price = finalPriceIdx >= 0 ? row[finalPriceIdx]?.trim() || '' : '';
      const playerPerTeam = playerPerTeamIdx >= 0 ? row[playerPerTeamIdx]?.trim() || '' : '';
      const teamQTY = teamQTYIdx >= 0 ? row[teamQTYIdx]?.trim() || '' : '';
      const level = levelIdx >= 0 ? row[levelIdx]?.trim() || '' : '';
      const ageValue = ageIdx >= 0 ? row[ageIdx]?.trim() || '' : '';
      
      // Skip if no gameId
      if (!gameId || gameId === '#N/A' || gameId === '#REF!' || gameId === '#ERROR!' || gameId.trim() === '') {
        continue;
      }
      
      // Skip if no date/time
      if (!dateTime || dateTime === '#N/A' || dateTime === '#REF!' || dateTime === '#ERROR!' || dateTime.trim() === '') {
        continue;
      }
      
      // Skip if city is empty or "Other" (placeholder rows)
      if (!city || city.trim() === '' || city.trim().toLowerCase() === 'other') {
        continue;
      }
      
      // Parse date and check if it's upcoming (only show future matches)
      let matchDate: Date | null = null;
      try {
        // Date format: "MM/DD/YYYY HH:MM:SS" or "M/D/YYYY H:MM:SS"
        matchDate = new Date(dateTime);
        if (isNaN(matchDate.getTime())) {
          console.warn(`Invalid date format for gameId ${gameId}: ${dateTime}`);
          continue;
        }
        // Only show upcoming matches
        const now = new Date();
        if (matchDate <= now) {
          console.log(`Skipping past match ${gameId}: ${dateTime} (parsed as ${matchDate.toISOString()}, now is ${now.toISOString()})`);
          continue; // Skip past matches
        }
        console.log(`✓ Upcoming match ${gameId}: ${dateTime} (parsed as ${matchDate.toISOString()})`);
      } catch (error) {
        console.warn(`Error parsing date for gameId ${gameId}: ${dateTime}`, error);
        continue;
      }
      
      // Parse values from columns
      // Price, PlayerPerTeam, TeamQTY, and Level may not be in the CSV export
      // Try to parse price from CSV, or calculate from mode
      let matchPrice = 0;
      if (price && price !== '#REF!' && price !== '#N/A' && price !== '#ERROR!' && price.trim() !== '') {
        // Handle both comma and dot as decimal separator
        const priceStr = price.toString().replace(',', '.').trim();
        matchPrice = parseFloat(priceStr) || 0;
      }
      
      // If price not found in CSV, calculate from mode
      if (matchPrice === 0 && gameMode) {
        const modeLower = gameMode.toLowerCase();
        if (modeLower.includes('rayo-classic-8vs8') || modeLower.includes('rayo classic 8vs8')) {
          matchPrice = 70;
        } else if (modeLower.includes('rayo-classic-7vs7') || modeLower.includes('rayo classic 7vs7')) {
          matchPrice = 60;
        } else if (modeLower.includes('rayo-classic-5') || modeLower.includes('rayo classic 5')) {
          matchPrice = 60;
        } else if (modeLower.includes('rayo rush5') || modeLower.includes('rayo rush6')) {
          matchPrice = 40;
        } else if (modeLower.includes('battle')) {
          matchPrice = 50;
        } else {
          matchPrice = 50; // Default price
        }
      }
      
      const matchLevel = level && level !== '#REF!' && level !== '#N/A' && level !== '#ERROR!' && level.trim() !== ''
        ? level.trim()
        : '';
      
      const captainName = capitaine && capitaine !== '#REF!' && capitaine !== '#N/A' && capitaine !== '#ERROR!' 
        ? capitaine 
        : '';
      
      const teamLetter = team && team !== '#REF!' && team !== '#N/A' && team !== '#ERROR!' 
        ? team 
        : '';
      
      const parsedPlayerNumber = playerNumber && playerNumber !== '#REF!' && playerNumber !== '#N/A' && playerNumber !== '#ERROR!' 
        ? parseInt(playerNumber) || null 
        : null;
      
      // Use PlayerPerTeam and TeamQTY from CSV if available, otherwise extract from Mode field
      let maxPlayers = 15;
      let gameFormat = '5vs5';
      let playersPerTeam = 5;
      let numberOfTeams = 2;
      
      // First, try to use PlayerPerTeam and TeamQTY from CSV (if columns exist)
      let hasPlayerPerTeamFromCSV = false;
      let hasTeamQTYFromCSV = false;
      
      if (playerPerTeam && playerPerTeam !== '#REF!' && playerPerTeam !== '#N/A' && playerPerTeam !== '#ERROR!' && playerPerTeam.trim() !== '') {
        const parsedPlayerPerTeam = parseInt(playerPerTeam);
        if (!isNaN(parsedPlayerPerTeam) && parsedPlayerPerTeam > 0) {
          playersPerTeam = parsedPlayerPerTeam;
          hasPlayerPerTeamFromCSV = true;
        }
      }
      
      if (teamQTY && teamQTY !== '#REF!' && teamQTY !== '#N/A' && teamQTY !== '#ERROR!' && teamQTY.trim() !== '') {
        const parsedTeamQTY = parseInt(teamQTY);
        if (!isNaN(parsedTeamQTY) && parsedTeamQTY > 0) {
          numberOfTeams = parsedTeamQTY;
          hasTeamQTYFromCSV = true;
        }
      }
      
      // If PlayerPerTeam or TeamQTY not available from CSV, extract from Mode field
      if (!hasPlayerPerTeamFromCSV || !hasTeamQTYFromCSV) {
        if (gameMode) {
          const modeLower = gameMode.toLowerCase();
          
          // Extract number of players per team from mode (e.g., "rayo-classic-5" = 5, "Rayo Rush5" = 5, "rayo-classic-7" = 7)
          const numberMatch = modeLower.match(/(\d+)/);
          if (numberMatch && !hasPlayerPerTeamFromCSV) {
            playersPerTeam = parseInt(numberMatch[1]) || 5;
          }
          
          // Determine number of teams based on mode
          if (!hasTeamQTYFromCSV) {
            if (modeLower.includes('rush')) {
              numberOfTeams = 3; // Rush mode is typically 3 teams
            } else if (modeLower.includes('battle')) {
              numberOfTeams = 4; // Battle mode is typically 4 teams
            } else {
              numberOfTeams = 2; // Classic mode is typically 2 teams
            }
          }
        }
      }
      
      // Calculate max players: PlayerPerTeam * TeamQTY
      maxPlayers = playersPerTeam * numberOfTeams;
      
      // Set game format based on the calculated values
      if (numberOfTeams === 2) {
        gameFormat = `${playersPerTeam}vs${playersPerTeam}`;
      } else if (numberOfTeams === 3) {
        gameFormat = `3x${playersPerTeam}`;
      } else if (numberOfTeams === 4) {
        gameFormat = `4x${playersPerTeam}`;
      } else {
        gameFormat = `${numberOfTeams}x${playersPerTeam}`;
      }
      
      // Create the match if it doesn't exist
      if (!matchesMap.has(gameId)) {
        // Parse date and time - preserve local date to avoid timezone shifts
        // Format date as YYYY-MM-DD from local date components (not UTC)
        const year = matchDate.getFullYear();
        const month = String(matchDate.getMonth() + 1).padStart(2, '0');
        const day = String(matchDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        // Format time as HH:MM from local time components (not UTC)
        const hours = String(matchDate.getHours()).padStart(2, '0');
        const minutes = String(matchDate.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes} (60min)`;
        
        // Function to convert cities to French
        const convertToFrench = (cityName: string): string => {
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
            'Ait Melloul': 'Aït Melloul',
            'Bouskoura': 'Bouskoura'
          };
          return cityMap[cityName] || cityName;
        };

        const convertedCity = convertToFrench(city || "Casablanca");
        console.log(`City conversion: "${city}" -> "${convertedCity}" for gameId ${gameId}`);
        
        const match: Match = {
          id: `MATCH_${gameId}`,
          gameId: gameId,
          city: convertedCity,
          field: terrain || "Terrain Rayo Sport",
          date: dateStr,
          time: timeStr,
          format: gameFormat,
          status: "Besoin d'autres joueurs",
          players: [],
          maxPlayers: maxPlayers,
          captain: captainName,
          mode: gameMode.trim() || 'Classic',
          price: matchPrice,
          level: matchLevel,
          playersPerTeam: playersPerTeam,
          numberOfTeams: numberOfTeams
        };
        console.log(`Created match for gameId ${gameId}:`, match);
        matchesMap.set(gameId, match);
      }
      
      // Add player to the match if playerUsername exists
      const match = matchesMap.get(gameId);
      if (match && playerUsername && playerUsername.trim() && playerUsername !== '#N/A' && playerUsername !== '#REF!' && playerUsername !== '#ERROR!') {
        
        // Map team names from Team column (Column G)
        let teamName: "Orange" | "Jaune" | "Blue" | "Yellow" | "Vert" | undefined;
        if (teamLetter) {
          const teamLower = teamLetter.toLowerCase().trim();
          switch (teamLower) {
            case 'orange':
            case 'équipe orange':
            case 'team orange':
              teamName = "Orange";
              break;
            case 'jaune':
            case 'équipe jaune':
            case 'team jaune':
            case 'yellow':
            case 'équipe yellow':
            case 'team yellow':
              teamName = "Jaune";
              break;
            case 'blue':
            case 'équipe blue':
            case 'team blue':
              teamName = "Blue";
              break;
            case 'vert':
            case 'équipe vert':
            case 'team vert':
            case 'green':
            case 'équipe green':
            case 'team green':
              teamName = "Vert";
              break;
            // Support legacy mapping A->Orange, B->Jaune, C->Blue, D->Vert
            case 'a':
              teamName = "Orange";
              break;
            case 'b':
              teamName = "Jaune";
              break;
            case 'c':
              teamName = "Blue";
              break;
            case 'd':
              teamName = "Vert";
              break;
          }
        }

        // WebsiteGame doesn't have payment status, score, or games played columns
        // Set default values
        const finalPaymentStatus: "Payé" | "Non payé" | "Nouveau joueur" | "Subscription" = "Non payé";

        // Parse age from Age column (column O)
        let parsedAge: number | undefined = undefined;
        if (ageValue && ageValue !== '#REF!' && ageValue !== '#N/A' && ageValue !== '#ERROR!' && ageValue.trim() !== '') {
          const ageNum = parseInt(ageValue.trim());
          if (!isNaN(ageNum) && ageNum > 0) {
            parsedAge = ageNum;
          }
        }

        const player: Player = {
          id: `${gameId}_${playerUsername}`,
          username: playerUsername,
          fullName: playerUsername,
          globalScore: 0, // Not available in WebsiteGame
          gamesPlayed: 0, // Not available in WebsiteGame
          ranking: 0, // Not available in WebsiteGame
          cityRanking: 0, // Not available in WebsiteGame
          paymentStatus: finalPaymentStatus,
          isNewPlayer: false, // Not available in WebsiteGame
          team: teamName,
          jerseyNumber: parsedPlayerNumber ?? undefined,
          age: parsedAge, // Age from Age column (column O)
          position: undefined, // Will be loaded from Foot_Players FootPos column
          // Statistics not available in WebsiteGame - set defaults
          goals: 0,
          assists: 0,
          teamWins: 0,
          attackRatio: undefined,
          defenseRatio: undefined,
          teamScore: undefined,
          soloScore: undefined,
          solde: undefined, // Not available in WebsiteGame
          expirationDate: undefined // Not available in WebsiteGame
        };
        
        console.log(`Adding player ${playerUsername} to match ${gameId}, team: ${teamName}`);
        const match = matchesMap.get(gameId);
        
        if (match) {
          // Vérifier si le joueur existe déjà dans ce match (éviter les doublons)
          const existingPlayer = match.players.find(p => 
            p.username.toLowerCase() === playerUsername.toLowerCase() || 
            p.id === player.id
          );
          
          if (!existingPlayer) {
            match.players.push(player);
            console.log(`Added player ${playerUsername} to match ${gameId}. Total players: ${match.players.length}`);
          } else {
            // Update existing player's team if it changed
            existingPlayer.team = teamName;
            existingPlayer.jerseyNumber = parsedPlayerNumber ?? existingPlayer.jerseyNumber;
            console.log(`Player ${playerUsername} already exists in match ${gameId}, updated team to ${teamName}`);
          }
        } else {
          console.warn(`Match ${gameId} not found when trying to add player ${playerUsername}`);
        }
      }
    }
    
    // Mettre à jour le statut de tous les matchs et organiser les équipes
    Array.from(matchesMap.values()).forEach(matchItem => {
      matchItem.status = matchItem.players.length >= matchItem.maxPlayers ? "Complet" : "Besoin d'autres joueurs";
      
      // Organiser les joueurs en équipes
      const teamsMap = new Map<string, TeamPlayer[]>();
      
      matchItem.players.forEach(player => {
        if (player.team) {
          if (!teamsMap.has(player.team)) {
            teamsMap.set(player.team, []);
          }
          teamsMap.get(player.team)!.push({
            id: player.id,
            username: player.username,
            fullName: player.fullName,
            jerseyNumber: player.jerseyNumber || 0,
            paymentStatus: player.paymentStatus,
            solde: player.solde,
            expirationDate: player.expirationDate,
            globalScore: player.globalScore,
            ranking: player.ranking,
            gamesPlayed: player.gamesPlayed,
            attackRatio: player.attackRatio,
            defenseRatio: player.defenseRatio,
            age: player.age,
            level: player.level,
            rankTier: player.rankTier,
            points: player.points,
            position: player.position
          });
        }
      });
      
      // Créer les équipes avec les couleurs appropriées
      const teamColors: { [key: string]: string } = {
        'Orange': '#f97316',
        'Jaune': '#eab308', 
        'Blue': '#3b82f6',
        'Yellow': '#eab308',
        'Vert': '#22c55e'
      };
      
      matchItem.teams = Array.from(teamsMap.entries()).map(([teamName, players]) => ({
        name: teamName as "Orange" | "Jaune" | "Blue" | "Yellow" | "Vert",
        color: teamColors[teamName] || '#6b7280',
        players: players.sort((a, b) => {
          // Sort by level (descending - highest level first)
          const aLevel = getLevelNumericValue(a.level);
          const bLevel = getLevelNumericValue(b.level);
          if (bLevel !== aLevel) {
            return bLevel - aLevel;
          }
          // If levels are equal, sort by jersey number (ascending)
          return (a.jerseyNumber || 0) - (b.jerseyNumber || 0);
        })
      }));
    });
    
    const finalMatches = Array.from(matchesMap.values());
    console.log(`=== END PARSING WEBSITEGAME CSV: ${finalMatches.length} matches created ===`);
    return finalMatches;
  };

  // Load player statistics from Foot_Players sheet
  const loadPlayerStatistics = async (): Promise<{ statsMap: Map<string, { gamesPlayed: number; ranking: number; globalScore: number; points?: number; rankTier?: string; level?: string; streak?: number; teamWins?: number; goals?: number; assists?: number; goalsConceded?: number; teamScore?: number; age?: number; position?: string }>; rayoSupport: Map<string, boolean> }> => {
    const statsMap = new Map<string, { gamesPlayed: number; ranking: number; globalScore: number; points?: number; rankTier?: string; level?: string; streak?: number; teamWins?: number; goals?: number; assists?: number; goalsConceded?: number; teamScore?: number; age?: number; position?: string }>();
    const rayoSupportMap = new Map<string, boolean>();
    
    try {
      const csvUrl = customDataSources?.footPlayers || customDataSources?.leaderboard || DEFAULT_FOOT_PLAYERS_SHEET_CONFIG.csvUrl;
      console.log('🔍 UpcomingMatches: Loading player stats from Foot_Players sheet:', csvUrl);
      
      const response = await fetch(csvUrl, {
        cache: 'default',
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
        throw new Error('Google Sheets returned HTML error page instead of CSV data');
      }
      
      // Parse CSV
      const parseCSV = (csvText: string) => {
        const lines = csvText.split('\n').filter(line => line.trim());
        return lines.map(line => {
          const values = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim().replace(/^"|"$/g, ''));
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim().replace(/^"|"$/g, ''));
          return values;
        });
      };
      
      const rows = parseCSV(csvText);
      
      if (rows.length > 1) {
        const headers = rows[0] || [];
        
        // Find column indices
        const getColumnIndex = (name: string): number => {
          const lowerName = name.toLowerCase();
          return headers.findIndex(h => h.toLowerCase().includes(lowerName) || lowerName.includes(h.toLowerCase()));
        };
        
        const playerUsernameIdx = getColumnIndex('PlayerUsername') >= 0 ? getColumnIndex('PlayerUsername') : 
                                 (getColumnIndex('Username') >= 0 ? getColumnIndex('Username') : 
                                 (getColumnIndex('Player') >= 0 ? getColumnIndex('Player') : 2));
        const matchesIdx = getColumnIndex('Matches') >= 0 ? getColumnIndex('Matches') : 
                          (getColumnIndex('Games Played') >= 0 ? getColumnIndex('Games Played') : 
                          (getColumnIndex('TGame') >= 0 ? getColumnIndex('TGame') : -1));
        // Find Rank column - try multiple variations (matching RankedLeaderboardSection logic)
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
          // Fallback to position 0 if not found
          return 0;
        })();
        const globalScoreIdx = getColumnIndex('Global Score') >= 0 ? getColumnIndex('Global Score') : 
                              (getColumnIndex('Score') >= 0 ? getColumnIndex('Score') : 5);
        // Points column (for leaderboard, different from Global Score)
        // Also check for MonthlyPoints column which is what determines rank
        const pointsIdx = (() => {
          // First try MonthlyPoints (this is what determines rank)
          const monthlyPointsExact = headers.findIndex(h => h.toLowerCase().trim() === 'monthlypoints');
          if (monthlyPointsExact >= 0) return monthlyPointsExact;
          const monthlyPointsIndex = getColumnIndex('MonthlyPoints');
          if (monthlyPointsIndex >= 0) return monthlyPointsIndex;
          
          // Fallback to Points column
          const pointsExact = headers.findIndex(h => h.toLowerCase().trim() === 'points');
          if (pointsExact >= 0) return pointsExact;
          const pointsIndex = getColumnIndex('Points');
          if (pointsIndex >= 0) return pointsIndex;
          return -1;
        })();
        const levelIdx = getColumnIndex('Level') >= 0 ? getColumnIndex('Level') : 
                        (getColumnIndex('Niveau') >= 0 ? getColumnIndex('Niveau') : -1);
        const streakIdx = getColumnIndex('Streaks') >= 0 ? getColumnIndex('Streaks') : 
                         (getColumnIndex('Streak') >= 0 ? getColumnIndex('Streak') : -1);
        const teamWinsIdx = getColumnIndex('Team Win') >= 0 ? getColumnIndex('Team Win') : 
                           (getColumnIndex('TeamWins') >= 0 ? getColumnIndex('TeamWins') : 
                           (getColumnIndex('Team Wins') >= 0 ? getColumnIndex('Team Wins') : -1));
        // Team Goal is in column AE - ONLY look for "Team Goal", not "Goal" or "Goals"
        const goalsIdx = (() => {
          // Try exact match first
          const exactMatch = headers.findIndex(h => h.toLowerCase().trim() === 'team goal');
          if (exactMatch >= 0) return exactMatch;
          // Try without space
          const noSpaceMatch = headers.findIndex(h => h.toLowerCase().trim() === 'teamgoal');
          if (noSpaceMatch >= 0) return noSpaceMatch;
          // Try case variations
          const caseMatch = headers.findIndex(h => h.trim() === 'Team Goal');
          if (caseMatch >= 0) return caseMatch;
          return -1;
        })();
        const assistsIdx = getColumnIndex('Assists') >= 0 ? getColumnIndex('Assists') : 
                          (getColumnIndex('Assist') >= 0 ? getColumnIndex('Assist') : -1);
        // Team GoalC is in column AF - ONLY look for "Team GoalC", not other variations
        const goalsConcededIdx = (() => {
          // Try exact match first
          const exactMatch = headers.findIndex(h => h.toLowerCase().trim() === 'team goalc');
          if (exactMatch >= 0) return exactMatch;
          // Try without space
          const noSpaceMatch = headers.findIndex(h => h.toLowerCase().trim() === 'teamgoalc');
          if (noSpaceMatch >= 0) return noSpaceMatch;
          // Try case variations
          const caseMatch = headers.findIndex(h => h.trim() === 'Team GoalC');
          if (caseMatch >= 0) return caseMatch;
          return -1;
        })();
        const teamScoreIdx = getColumnIndex('Team Score') >= 0 ? getColumnIndex('Team Score') : 
                            (getColumnIndex('TeamScore') >= 0 ? getColumnIndex('TeamScore') : -1);
        const ageIdx = getColumnIndex('Age') >= 0 ? getColumnIndex('Age') : -1;
        
        // Find RayoSupport column - MUST use column BD "RayoSupport" from Foot_Players sheet
        const rayoSupportIdx = (() => {
          // First try exact match for "RayoSupport" (column BD = index 55)
          const exactRayoSupportIndex = headers.findIndex(h => h.trim() === 'RayoSupport');
          if (exactRayoSupportIndex >= 0) {
            console.log('✅ UpcomingMatches: Found RayoSupport column at index', exactRayoSupportIndex);
            return exactRayoSupportIndex;
          }
          // Fallback: case-insensitive search
          const rayoSupportIndex = headers.findIndex(h => h.toLowerCase().trim() === 'rayosupport');
          if (rayoSupportIndex >= 0) return rayoSupportIndex;
          console.warn('⚠️ UpcomingMatches: RayoSupport column not found');
          return -1;
        })();
        
        // Find FootPos column - column BE "FootPos" from Foot_Players sheet (index 56)
        const footPosIdx = (() => {
          // First try exact match for "FootPos"
          const exactFootPosIndex = headers.findIndex(h => h.trim() === 'FootPos');
          if (exactFootPosIndex >= 0) {
            console.log('✅ UpcomingMatches: Found FootPos column at index', exactFootPosIndex);
            return exactFootPosIndex;
          }
          // Fallback: case-insensitive search
          const footPosIndex = headers.findIndex(h => h.toLowerCase().trim() === 'footpos');
          if (footPosIndex >= 0) return footPosIndex;
          console.warn('⚠️ UpcomingMatches: FootPos column not found');
          return -1;
        })();
        
        console.log('📊 Foot_Players columns found:', {
          PlayerUsername: playerUsernameIdx,
          PlayerUsernameColumn: headers[playerUsernameIdx],
          Matches: matchesIdx,
          MatchesColumn: headers[matchesIdx],
          Rank: rankIdx,
          RankColumn: headers[rankIdx],
          GlobalScore: globalScoreIdx,
          GlobalScoreColumn: headers[globalScoreIdx],
          Points: pointsIdx,
          PointsColumn: pointsIdx >= 0 ? headers[pointsIdx] : 'NOT FOUND',
          Level: levelIdx,
          LevelColumn: levelIdx >= 0 ? headers[levelIdx] : 'NOT FOUND',
          Streaks: streakIdx,
          StreaksColumn: streakIdx >= 0 ? headers[streakIdx] : 'NOT FOUND',
          TeamWin: teamWinsIdx,
          TeamWinColumn: teamWinsIdx >= 0 ? headers[teamWinsIdx] : 'NOT FOUND',
          TeamGoal: goalsIdx,
          TeamGoalColumn: goalsIdx >= 0 ? headers[goalsIdx] : 'NOT FOUND',
          TeamGoalC: goalsConcededIdx,
          TeamGoalCColumn: goalsConcededIdx >= 0 ? headers[goalsConcededIdx] : 'NOT FOUND',
          AllHeaders: headers
        });
        
        // Log a few sample rows to see what we're getting
        if (rows.length > 1) {
          for (let i = 1; i < Math.min(4, rows.length); i++) {
            const sampleRow = rows[i];
            const username = sampleRow[playerUsernameIdx]?.trim() || '';
            const rankValue = rankIdx >= 0 ? (sampleRow[rankIdx]?.trim() || '') : '';
            const globalScore = sampleRow[globalScoreIdx]?.trim() || '';
            console.log(`📊 Sample row ${i} (${username}):`, {
              rankValue: rankValue,
              rankValueType: typeof rankValue,
              rankValueLength: rankValue.length,
              globalScore: globalScore,
              parsedRank: !isNaN(parseInt(rankValue)) ? parseInt(rankValue) : 'not a number'
            });
          }
        }
        
        // Build stats map
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const username = playerUsernameIdx >= 0 ? row[playerUsernameIdx]?.trim() : '';
          
          if (username && username !== '' && username !== '#VALUE!' && username !== '#N/A') {
            const gamesPlayed = matchesIdx >= 0 ? (parseInt(row[matchesIdx]) || 0) : 0;
            const globalScore = globalScoreIdx >= 0 ? (parseFloat(row[globalScoreIdx]?.toString().replace(',', '.')) || 0) : 0;
            
            // Parse MonthlyPoints/Points from column (this determines rank)
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
            
            // Parse Rank column - can be numeric (1, 2, 3) or tier string (FOX 1, Crocodile 2, etc.)
            // This matches the logic from RankedLeaderboardSection
            const rankValue = rankIdx >= 0 ? (row[rankIdx]?.trim() || '') : '';
            let ranking = 0;
            let rankTier: string | undefined = undefined;
            
            // Try to parse as number first
            const parsedRank = parseInt(rankValue);
            if (!isNaN(parsedRank) && rankValue !== '' && rankValue !== '#REF!' && rankValue !== '#N/A' && rankValue !== '#ERROR!') {
              // It's a numeric rank
              ranking = parsedRank;
            } else if (rankValue && rankValue !== '#REF!' && rankValue !== '#N/A' && rankValue !== '#ERROR!' && rankValue !== '') {
              // It's a string tier like "FOX 1", "Crocodile 2", "Predator #1", "Goat 3", etc.
              rankTier = rankValue;
            }
            
            // Always calculate rankTier from score if not already set
            // This ensures we have a tier even if Rank column is numeric or empty
            // BUT: If Rank column already contains a tier name, we use that directly (don't override)
            if (!rankTier) {
              rankTier = getRankTierFromScore(globalScore, ranking);
            }
            
            // Parse Level from Level column
            let level: string | undefined = undefined;
            if (levelIdx >= 0) {
              const levelValue = row[levelIdx]?.trim() || '';
              if (levelValue && levelValue !== '#REF!' && levelValue !== '#N/A' && levelValue !== '#ERROR!' && levelValue !== '') {
                level = levelValue;
              }
            }
            
            // Parse Streaks from Streaks column (column AQ)
            let streak: number | undefined = undefined;
            if (streakIdx >= 0) {
              const streakValue = row[streakIdx]?.trim() || '';
              if (streakValue && streakValue !== '#REF!' && streakValue !== '#N/A' && streakValue !== '#ERROR!' && streakValue !== '') {
                const parsedStreak = parseInt(streakValue);
                if (!isNaN(parsedStreak)) {
                  streak = parsedStreak;
                }
              }
            }
            
            // Parse Team Win from Team Win column
            let teamWins: number | undefined = undefined;
            if (teamWinsIdx >= 0) {
              const teamWinsValue = row[teamWinsIdx]?.trim() || '';
              if (teamWinsValue && teamWinsValue !== '#REF!' && teamWinsValue !== '#N/A' && teamWinsValue !== '#ERROR!' && teamWinsValue !== '') {
                const parsedTeamWins = parseInt(teamWinsValue);
                if (!isNaN(parsedTeamWins)) {
                  teamWins = parsedTeamWins;
                }
              }
            }
            
            // Parse Team Goal from Team Goal column (column AE)
            let goals: number | undefined = undefined;
            if (goalsIdx >= 0) {
              const goalsValue = row[goalsIdx]?.trim() || '';
              if (goalsValue && goalsValue !== '#REF!' && goalsValue !== '#N/A' && goalsValue !== '#ERROR!' && goalsValue !== '') {
                const parsedGoals = parseInt(goalsValue);
                if (!isNaN(parsedGoals)) {
                  goals = parsedGoals;
                }
              }
            }
            
            // Parse Assists from Assists column
            let assists: number | undefined = undefined;
            if (assistsIdx >= 0) {
              const assistsValue = row[assistsIdx]?.trim() || '';
              if (assistsValue && assistsValue !== '#REF!' && assistsValue !== '#N/A' && assistsValue !== '#ERROR!' && assistsValue !== '') {
                const parsedAssists = parseInt(assistsValue);
                if (!isNaN(parsedAssists)) {
                  assists = parsedAssists;
                }
              }
            }
            
            // Parse Team GoalC from Team GoalC column (column AF)
            let goalsConceded: number | undefined = undefined;
            if (goalsConcededIdx >= 0) {
              const goalsConcededValue = row[goalsConcededIdx]?.trim() || '';
              if (goalsConcededValue && goalsConcededValue !== '#REF!' && goalsConcededValue !== '#N/A' && goalsConcededValue !== '#ERROR!' && goalsConcededValue !== '') {
                const parsedGoalsConceded = parseInt(goalsConcededValue);
                if (!isNaN(parsedGoalsConceded)) {
                  goalsConceded = parsedGoalsConceded;
                }
              }
            }
            
            // Parse Team Score from Team Score column
            let teamScore: number | undefined = undefined;
            if (teamScoreIdx >= 0) {
              const teamScoreValue = row[teamScoreIdx]?.trim() || '';
              if (teamScoreValue && teamScoreValue !== '#REF!' && teamScoreValue !== '#N/A' && teamScoreValue !== '#ERROR!' && teamScoreValue !== '') {
                const parsedTeamScore = parseFloat(teamScoreValue.replace(',', '.'));
                if (!isNaN(parsedTeamScore)) {
                  teamScore = parsedTeamScore;
                }
              }
            }
            
            // Parse Age from Age column
            let age: number | undefined = undefined;
            if (ageIdx >= 0) {
              const ageValue = row[ageIdx]?.trim() || '';
              if (ageValue && ageValue !== '#REF!' && ageValue !== '#N/A' && ageValue !== '#ERROR!' && ageValue !== '') {
                const parsedAge = parseInt(ageValue);
                if (!isNaN(parsedAge)) {
                  age = parsedAge;
                }
              }
            }
            
            // Extract RayoSupport from RayoSupport column (column BD "RayoSupport" in Foot_Players sheet)
            if (rayoSupportIdx >= 0 && rayoSupportIdx < row.length) {
              const rayoSupportValue = row[rayoSupportIdx]?.trim();
              if (rayoSupportValue && 
                  rayoSupportValue !== '#REF!' && 
                  rayoSupportValue !== '#N/A' && 
                  rayoSupportValue !== '#ERROR!' && 
                  rayoSupportValue !== '' &&
                  rayoSupportValue !== '#VALUE!') {
                // Check if value is "1" or "true" or "yes"
                const hasRayoSupport = rayoSupportValue === '1' || rayoSupportValue.toLowerCase() === 'true' || rayoSupportValue.toLowerCase() === 'yes';
                if (hasRayoSupport) {
                  rayoSupportMap.set(username.toLowerCase().trim(), true);
                }
              }
            }
            
            // Extract FootPos (position) from FootPos column (column BE "FootPos" in Foot_Players sheet)
            let position: string | undefined = undefined;
            if (footPosIdx >= 0 && footPosIdx < row.length) {
              const footPosValue = row[footPosIdx]?.trim();
              if (footPosValue && 
                  footPosValue !== '#REF!' && 
                  footPosValue !== '#N/A' && 
                  footPosValue !== '#ERROR!' && 
                  footPosValue !== '' &&
                  footPosValue !== '#VALUE!') {
                position = footPosValue;
              }
            }
            
            console.log(`📊 Player ${username}: rankValue="${rankValue}", ranking=${ranking}, rankTier="${rankTier}", globalScore=${globalScore}, points=${points}, level="${level}", streak=${streak}, teamWins=${teamWins}, goals=${goals}, assists=${assists}, goalsConceded=${goalsConceded}, teamScore=${teamScore}, age=${age}, position="${position}"`);
            
            statsMap.set(username, { gamesPlayed, ranking, globalScore, points, rankTier, level, streak, teamWins, goals, assists, goalsConceded, teamScore, age, position });
          }
        }
        
        console.log(`✅ Loaded stats for ${statsMap.size} players from Foot_Players sheet`);
        console.log(`✅ Loaded rayoSupport for ${rayoSupportMap.size} players`);
      }
    } catch (error) {
      console.warn('Failed to load player statistics from Foot_Players sheet:', error);
    }
    
    return { statsMap, rayoSupport: rayoSupportMap };
  };

  // Enrich matches with player statistics
  const enrichMatchesWithPlayerStats = (matches: Match[], statsMap: Map<string, { gamesPlayed: number; ranking: number; globalScore: number; points?: number; rankTier?: string; level?: string; streak?: number; teamWins?: number; goals?: number; assists?: number; goalsConceded?: number; teamScore?: number; age?: number; position?: string }>): Match[] => {
    return matches.map(match => ({
      ...match,
      players: match.players.map(player => {
        const stats = statsMap.get(player.username);
        if (stats) {
          return {
            ...player,
            gamesPlayed: stats.gamesPlayed,
            ranking: stats.ranking,
            globalScore: stats.globalScore,
            points: stats.points,
            rankTier: stats.rankTier,
            level: stats.level,
            streak: stats.streak,
            teamWins: stats.teamWins,
            goals: stats.goals,
            assists: stats.assists,
            goalsConceded: stats.goalsConceded,
            teamScore: stats.teamScore,
            // Preserve age from WebsiteGame if it exists, otherwise use stats.age
            age: player.age !== undefined && player.age > 0 ? player.age : stats.age,
            // Use position from Foot_Players FootPos column if available
            position: stats.position || player.position
          };
        }
        return player;
      }),
      teams: match.teams ? match.teams.map(team => ({
        ...team,
        players: team.players.map(player => {
          const stats = statsMap.get(player.username);
          if (stats) {
            return {
              ...player,
              gamesPlayed: stats.gamesPlayed,
              ranking: stats.ranking,
              globalScore: stats.globalScore,
              rankTier: stats.rankTier,
              level: stats.level,
              streak: stats.streak,
              points: stats.points,
              teamWins: stats.teamWins,
              goals: stats.goals,
              assists: stats.assists,
              goalsConceded: stats.goalsConceded,
              teamScore: stats.teamScore,
              // Preserve age from WebsiteGame if it exists, otherwise use stats.age
              age: player.age !== undefined && player.age > 0 ? player.age : stats.age,
              // Use position from Foot_Players FootPos column if available
              position: stats.position || player.position
            };
          }
          return player;
        })
      })) : []
    }));
  };

  // Helper function to add timeout to fetch
  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = 30000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: Le chargement prend trop de temps');
      }
      throw error;
    }
  };

  // Fonction pour charger les données depuis Google Sheets avec fallback vers fichier statique
  const loadMatchesData = async (retryCount: number = 0) => {
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 2000; // 2 seconds
    
    try {
      setLoading(true);
      setError(null);
      
      // Load player statistics and matches in parallel with timeout
      const [playerStatsResult, matchesResponse] = await Promise.all([
        loadPlayerStatistics(),
        fetchWithTimeout(
          customDataSources?.upcomingMatches || DEFAULT_MATCHES_SHEET_CONFIG.csvUrl,
          {
            cache: 'default',
            redirect: 'follow',
            headers: {
              'Accept': 'text/csv,text/plain,*/*'
            }
          },
          30000 // 30 second timeout
        )
      ]);
      
      const statsMap = playerStatsResult.statsMap;
      setPlayerStatsMap(statsMap);
      setRayoSupport(playerStatsResult.rayoSupport);
      
      // Essayer d'abord Google Sheets - MUST use WebsiteGame sheet (gid=216631647)
      const csvUrl = customDataSources?.upcomingMatches || DEFAULT_MATCHES_SHEET_CONFIG.csvUrl;
      
      console.log('🔍 UpcomingMatches: Fetching from WebsiteGame sheet (gid=216631647):', csvUrl);
      
      if (!matchesResponse.ok) {
        throw new Error(`Erreur HTTP: ${matchesResponse.status}`);
      }
      
      const csvData = await matchesResponse.text();
      
      // Vérifier si la réponse est bien du CSV (pas une page d'erreur HTML)
      if (csvData.includes('<!DOCTYPE html>') || csvData.includes('Page introuvable') || csvData.includes('<TITLE>Temporary Redirect</TITLE>')) {
        throw new Error('Google Sheets a retourné une page d\'erreur HTML au lieu des données CSV');
      }
      
      let parsedMatches = parseMatchesCSV(csvData);
      
      // Enrich matches with player statistics
      parsedMatches = enrichMatchesWithPlayerStats(parsedMatches, statsMap);
      
      console.log(`✅ Parsed ${parsedMatches.length} upcoming matches from Google Sheets CSV`);
      if (parsedMatches.length > 0) {
        console.log('Sample matches:', parsedMatches.slice(0, 3).map(m => ({ gameId: m.gameId, city: m.city, date: m.date, time: m.time, players: m.players.length, format: m.format })));
      } else {
        console.warn('⚠️ No upcoming matches found in CSV data');
      }
      setMatches(parsedMatches);
      setLastUpdate(new Date());
      
    } catch (err: any) {
      // Handle timeout or network errors with automatic retry
      if (retryCount < MAX_RETRIES && (
        err instanceof Error && (
          err.message.includes('timeout') || 
          err.message.includes('Timeout') ||
          err.message.includes('network') ||
          err.message.includes('Network') ||
          err.message.includes('Failed to fetch') ||
          err.message.includes('aborted') ||
          err.message.includes('Le chargement prend trop de temps')
        )
      )) {
        console.log(`⏳ Retry ${retryCount + 1}/${MAX_RETRIES} after ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return loadMatchesData(retryCount + 1);
      }
      
      // If not a retryable error or max retries reached, proceed to static fallback
      console.warn('Échec du chargement depuis Google Sheets, essai avec le fichier statique:', err);
      
      // Fallback vers le fichier CSV statique
      try {
        const staticResponse = await fetchWithTimeout('/staticfolder/WebsiteGame.csv', {
          cache: 'default'
        }, 30000);
        
        if (!staticResponse.ok) {
          throw new Error(`Erreur HTTP fichier statique: ${staticResponse.status}`);
        }
        
        const staticCsvData = await staticResponse.text();
        let parsedMatches = parseMatchesCSV(staticCsvData);
        
        // Try to load player stats even for static fallback
        const playerStatsResult = await loadPlayerStatistics();
        const statsMap = playerStatsResult.statsMap;
        if (statsMap.size > 0) {
          parsedMatches = enrichMatchesWithPlayerStats(parsedMatches, statsMap);
        }
        setRayoSupport(playerStatsResult.rayoSupport);
        
        console.log(`✅ Parsed ${parsedMatches.length} upcoming matches from static CSV`);
        if (parsedMatches.length > 0) {
          console.log('Sample matches:', parsedMatches.slice(0, 3).map(m => ({ gameId: m.gameId, city: m.city, date: m.date, time: m.time, players: m.players.length, format: m.format })));
        } else {
          console.warn('⚠️ No upcoming matches found in static CSV data');
        }
        
        setMatches(parsedMatches);
        setLastUpdate(new Date());
        setError('static-fallback'); // Use a special code instead of text message
        
      } catch (staticErr: any) {
        console.error('Échec du chargement depuis le fichier statique:', staticErr);
        
        // Final retry if it's a network/timeout error
        if (retryCount < MAX_RETRIES && (
          staticErr instanceof Error && (
            staticErr.message.includes('timeout') || 
            staticErr.message.includes('Timeout') ||
            staticErr.message.includes('network') ||
            staticErr.message.includes('Network') ||
            staticErr.message.includes('Failed to fetch') ||
            staticErr.message.includes('Le chargement prend trop de temps')
          )
        )) {
          console.log(`⏳ Final retry ${retryCount + 1}/${MAX_RETRIES} after ${RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return loadMatchesData(retryCount + 1);
        }
        
        setError('Impossible de charger les matchs à venir depuis Google Sheets et le fichier statique');
      }
    } finally {
      setLoading(false);
    }
  };

  // Weekly Program State
  const [weeklyProgram, setWeeklyProgram] = useState<{[key: string]: {[key: string]: string}}>({});

  // Fetch weekly program from Google Sheets
  const fetchWeeklyProgram = useCallback(async () => {
    console.log('=== FETCHING WEEKLY PROGRAM ===');
    try {
      const sheetUrl = "https://rayobackend.onrender.com/api/sheets/Total";
      console.log('Fetching from URL:', sheetUrl);
      const response = await fetch(sheetUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const csvText = await response.text();
      console.log('CSV response received, length:', csvText.length);
      const programData = parseWeeklyPlanningCSV(csvText);
      console.log('Parsed program data:', programData);
      setWeeklyProgram(programData);
    } catch (error) {
      console.error('Error fetching weekly program:', error);
      console.log('Using fallback data');
      // Fallback data
      setWeeklyProgram({
        'Casablanca': {
          'Lundi': '20:00 5v5',
          'Mercredi': '19:30 5v5v5',
          'Vendredi': '21:30 5v5v5',
          'Dimanche': '20:00 7v7'
        },
        'Marrakech': {
          'Vendredi': '20:00 5v5v5',
          'Samedi': '20:30 8v8'
        },
        'Tanger': {}
      });
    }
    console.log('=== END FETCHING WEEKLY PROGRAM ===');
  }, []);

  // Charger les données au montage du composant
  useEffect(() => {
    loadMatchesData();
    fetchWeeklyProgram();
  }, [fetchWeeklyProgram]);

  // Countdown timer for next games publication
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextSaturday = new Date();
      
      // Find next Saturday at 23:59
      const currentDay = now.getDay();
      let daysUntilSaturday = (6 - currentDay + 7) % 7;
      
      if (currentDay === 6 && (now.getHours() > 23 || (now.getHours() === 23 && now.getMinutes() >= 59))) {
        daysUntilSaturday = 7;
      }
      
      if (daysUntilSaturday === 0) {
        daysUntilSaturday = 7;
      }
      
      nextSaturday.setDate(now.getDate() + daysUntilSaturday);
      nextSaturday.setHours(23, 59, 0, 0);
      
      const difference = nextSaturday.getTime() - now.getTime();
      
      if (difference > 0) {
        setCountdownTime({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setCountdownTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Update immediately
    updateCountdown();
    
    // Update every second
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Fonction pour formater la date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fonction pour obtenir le nom du jour
  const formatDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    return dayName.charAt(0).toUpperCase() + dayName.slice(1);
  };

  // Fonction pour obtenir la date sans année
  const formatDateWithoutYear = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long'
    });
  };

  // Fonction pour obtenir l'icône du terrain (toujours un stade)
  const getFieldIcon = () => {
    return <TbBuildingStadium className="text-orange-600 flex-shrink-0" />;
  };

  // Fonction pour obtenir la couleur du streak
  const getStreakColor = (streak: number | undefined): string => {
    if (streak === undefined || streak === 0) return 'text-gray-400';
    if (streak >= 10) return 'text-purple-400'; // Very high streak - purple
    if (streak >= 7) return 'text-pink-400';    // High streak - pink
    if (streak >= 5) return 'text-red-400';     // Medium-high streak - red
    if (streak >= 3) return 'text-orange-400';   // Medium streak - orange
    return 'text-yellow-400';                    // Low streak - yellow (default)
  };

  // Fonction pour obtenir la couleur de l'icône du streak
  const getStreakIconColor = (streak: number | undefined): string => {
    if (streak === undefined || streak === 0) return 'text-gray-400';
    if (streak >= 10) return 'text-purple-400';
    if (streak >= 7) return 'text-pink-400';
    if (streak >= 5) return 'text-red-400';
    if (streak >= 3) return 'text-orange-400';
    return 'text-yellow-400';
  };

  // Composant Modal des détails du match
  const MatchDetailsModal = useCallback(() => {
    if (!selectedMatch) return null;

    // Format date for display
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    // Get team assignments if teams exist
    const teams = selectedMatch.teams || [];
    const hasTeams = teams.length > 0;

    return (
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className={`w-[95vw] max-w-[95vw] ${hasTeams && teams.length >= 3 ? 'md:max-w-7xl' : hasTeams ? 'md:max-w-6xl' : 'sm:max-w-5xl'} max-h-[95vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-none shadow-2xl rounded-xl sm:rounded-2xl scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500 scrollbar-thumb-rounded-full scrollbar-track-rounded-full [&>button]:text-white [&>button]:hover:text-gray-300 [&>button]:hover:bg-gray-700/50`}>
          <DialogHeader className="pb-2">
            {/* Match Title */}
            <div className="text-center mb-3">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Match {selectedMatch.gameId}
              </h2>
              <p className="text-gray-300 text-xs">
                {formatDate(selectedMatch.date)}
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
              {/* Single Row Compact Layout */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                 {/* Left: Match Info */}
                 <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <FiClock className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-white text-xs font-medium whitespace-nowrap">{selectedMatch.time}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <FiMapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-white text-xs font-medium whitespace-nowrap">{getCityDisplayName(selectedMatch.city)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <TbBuildingStadium className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span className="text-white text-xs font-medium whitespace-nowrap">{selectedMatch.field}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <FiTarget className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span className="text-white text-xs font-medium whitespace-nowrap">{selectedMatch.format}</span>
                  </div>
                  
                  {selectedMatch.level && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <FiAward className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span className="text-white text-xs font-medium whitespace-nowrap">{selectedMatch.level}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <FiZap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <span className="text-white text-xs font-medium whitespace-nowrap">{selectedMatch.price || 'N/A'} DH</span>
                  </div>
                </div>
                
                 {/* Right: Status Badge */}
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     const matchDate = parseMatchDateTime(selectedMatch.date, selectedMatch.time);
                     const isPastMatch = getCountdownInfo(matchDate).isPast;
                     const isMatchFull = selectedMatch.players.length >= selectedMatch.maxPlayers;
                     
                     if (isPastMatch) return;
                     
                     trackEvent('join_match_whatsapp_popup', 'user_engagement', `Game_${selectedMatch.gameId}`);
                     const message = isMatchFull 
                       ? `Bonjour, je souhaite rejoindre la liste d'attente pour ce match:%0A%0AGame ${selectedMatch.gameId}%0ADate: ${formatDate(selectedMatch.date)}%0AHeure: ${selectedMatch.time}%0AEndroit: ${selectedMatch.field}, ${getCityDisplayName(selectedMatch.city)}%0A%0AMerci!`
                       : `Bonjour, je souhaite jouer ce match:%0A%0AGame ${selectedMatch.gameId}%0ADate: ${formatDate(selectedMatch.date)}%0AHeure: ${selectedMatch.time}%0AEndroit: ${selectedMatch.field}, ${getCityDisplayName(selectedMatch.city)}%0A%0AMerci!`;
                     const whatsappUrl = `https://wa.me/212720707190?text=${message}`;
                     window.open(whatsappUrl, '_blank');
                   }}
                   className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 transition-all duration-200 hover:scale-105 cursor-pointer ${
                     selectedMatch.status === "Complet" 
                       ? "bg-orange-600 text-white hover:bg-orange-700" 
                       : "bg-yellow-500 text-black hover:bg-yellow-400"
                   }`}
                 >
                   {selectedMatch.status === "Complet" ? "Complet" : "Disponible"}
                 </button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Captain Section */}
            <div className="bg-gradient-to-r from-red-900 to-red-950 rounded-lg p-2 border border-red-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-800 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">C</span>
                </div>
                <div className="text-red-300 text-xs">Capitaine:</div>
                <div className="text-white font-bold text-xs">
                  {selectedMatch.captain || 'Non assigné'}
                </div>
              </div>
            </div>

            {/* Players Section */}
            <div className="flex-1">
              {/* Minimalist Compact Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 text-xs">Joueurs</span>
                  <div className="text-white font-bold text-sm">
                    <AnimatedNumber value={selectedMatch.players.length} className="text-blue-400" />
                    <span className="text-gray-400">/{selectedMatch.maxPlayers}</span>
                  </div>
                  <div className="w-8 h-1 bg-gray-600 rounded-full">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(selectedMatch.players.length / selectedMatch.maxPlayers) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-2 py-0.5 bg-gray-800/50 rounded border border-gray-700/30">
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-yellow-400 flex-shrink-0"></div>
                    <span className="text-gray-400 text-[9px]">Level:</span>
                    <span className="text-[10px] text-white font-semibold">
                      {selectedMatch.players.length > 0 
                        ? (() => {
                            const playersWithLevel = selectedMatch.players.filter(p => {
                              const levelValue = getLevelNumericValue(p.level);
                              return levelValue > 0;
                            });
                            return playersWithLevel.length > 0
                              ? (playersWithLevel.reduce((sum, p) => sum + getLevelNumericValue(p.level), 0) / playersWithLevel.length).toFixed(1)
                              : '--';
                          })()
                        : '--'
                      }
                    </span>
                  </div>
                  <div className="w-px h-3 bg-gray-600/40"></div>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0"></div>
                    <span className="text-gray-400 text-[9px]">Age:</span>
                    <span className="text-[10px] text-white font-semibold">
                      {selectedMatch.players.length > 0 
                        ? (() => {
                            const playersWithAge = selectedMatch.players.filter(p => p.age !== undefined && p.age > 0);
                            return playersWithAge.length > 0
                              ? `${(playersWithAge.reduce((sum, p) => sum + (p.age || 0), 0) / playersWithAge.length).toFixed(1)} ans`
                              : '--';
                          })()
                        : '--'
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {hasTeams ? (
                /* Team-based Layout - flexible width for 3 teams */
                <div className={`grid gap-2 ${
                  teams.length === 1 
                    ? 'grid-cols-1 max-w-2xl mx-auto' 
                    : teams.length === 2 
                    ? 'grid-cols-1 sm:grid-cols-2' 
                    : 'grid-cols-1 md:grid-cols-3'
                }`}>
                  {(() => {
                    // Calculate highest level and highest MonthlyPoints for all players in match
                    const allPlayers = selectedMatch.players;
                    const highestLevel = Math.max(
                      ...allPlayers.map(p => getLevelNumericValue(p.level)),
                      0
                    );
                    const highestPoints = Math.max(
                      ...allPlayers.map(p => p.points || 0),
                      0
                    );
                    
                    return teams.map((team, teamIndex) => {
                      return (
                      <div key={teamIndex} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                        <div className="flex items-center justify-between p-1.5 bg-gray-600 gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div 
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{ backgroundColor: team.color }}
                            >
                              {team.name.charAt(0)}
                            </div>
                            <div className="text-white font-bold text-xs whitespace-nowrap">{team.name}</div>
                          </div>
                          <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded border flex-shrink-0" style={{ backgroundColor: `${team.color}15`, borderColor: `${team.color}60` }}>
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-yellow-400 flex-shrink-0"></div>
                              <span className="text-gray-200 text-[9px]">Level:</span>
                              <span className="text-[10px] text-white font-semibold">
                                {(() => {
                                  const playersWithLevel = team.players.filter(p => {
                                    const levelValue = getLevelNumericValue(p.level);
                                    return levelValue > 0;
                                  });
                                  return playersWithLevel.length > 0
                                    ? (playersWithLevel.reduce((sum, p) => sum + getLevelNumericValue(p.level), 0) / playersWithLevel.length).toFixed(1)
                                    : '--';
                                })()}
                              </span>
                            </div>
                            <div className="w-px h-3" style={{ backgroundColor: `${team.color}50` }}></div>
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0"></div>
                              <span className="text-gray-200 text-[9px]">Age:</span>
                              <span className="text-[10px] text-white font-semibold">
                                {(() => {
                                  const playersWithAge = team.players.filter(p => p.age !== undefined && p.age > 0);
                                  return playersWithAge.length > 0
                                    ? `${(playersWithAge.reduce((sum, p) => sum + (p.age || 0), 0) / playersWithAge.length).toFixed(1)} ans`
                                    : '--';
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-0.5 p-1">
                          {team.players
                            .sort((a, b) => {
                              // Sort by level first (descending - highest level first)
                              const aLevel = getLevelNumericValue(a.level);
                              const bLevel = getLevelNumericValue(b.level);
                              if (bLevel !== aLevel) {
                                return bLevel - aLevel;
                              }
                              // If levels are equal, sort by jersey number (ascending)
                              const jerseyA = a.jerseyNumber ?? 999;
                              const jerseyB = b.jerseyNumber ?? 999;
                              return jerseyA - jerseyB;
                            })
                            .map((player, playerIndex) => {
                              const isHighestLevel = getLevelNumericValue(player.level) === highestLevel && highestLevel > 0;
                              const isHighestRank = (player.points || 0) === highestPoints && highestPoints > 0;
                              const isLegendary = isHighestLevel && isHighestRank;
                              
                              return (
                          <div 
                            key={playerIndex}
                            className={`flex items-center justify-between py-1 px-1.5 rounded transition-all cursor-pointer group relative overflow-hidden ${
                              isLegendary
                                ? 'border-2 border-purple-400/80 shadow-2xl shadow-purple-500/40 hover:border-purple-300 hover:shadow-purple-400/50'
                                : isHighestLevel 
                                ? 'border-2 border-yellow-400/60 shadow-lg shadow-yellow-500/20 hover:border-yellow-300 hover:shadow-yellow-400/30'
                                : isHighestRank
                                ? 'border-2 border-blue-400/60 shadow-lg shadow-blue-500/20 hover:border-blue-300 hover:shadow-blue-400/30'
                                : 'border border-transparent hover:border-white/20'
                            }`}
                            style={{
                              backgroundColor: isLegendary 
                                ? undefined 
                                : isHighestLevel 
                                ? undefined 
                                : isHighestRank 
                                ? undefined 
                                : `${team.color}25` // Team color with 25% opacity for normal players
                            }}
                            onClick={() => {
                              // Convert TeamPlayer to Player for the click handler
                              const fullPlayer = selectedMatch.players.find(p => p.id === player.id);
                              if (fullPlayer) handlePlayerClick(fullPlayer);
                            }}
                          >
                            {isLegendary && (
                              <>
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-pink-600/30 via-cyan-600/30 to-yellow-600/30 animate-gradient bg-[length:200%_200%]"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                              </>
                            )}
                            {isHighestLevel && !isLegendary && (
                              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 animate-pulse"></div>
                            )}
                            {isHighestRank && !isLegendary && !isHighestLevel && (
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20 animate-pulse"></div>
                            )}
                        <div className="flex items-center gap-2 flex-1 min-w-0 relative z-10">
                          <div 
                            className={`w-6 h-6 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                              isLegendary 
                                ? 'ring-2 ring-purple-400/70 ring-offset-1 ring-offset-gray-800 shadow-lg shadow-purple-500/50' 
                                : isHighestLevel 
                                ? 'ring-2 ring-yellow-400/50 ring-offset-1 ring-offset-gray-800'
                                : isHighestRank
                                ? 'ring-2 ring-blue-400/50 ring-offset-1 ring-offset-gray-800'
                                : ''
                            }`}
                            style={{ 
                              background: isLegendary
                                ? 'linear-gradient(135deg, #a855f7, #ec4899, #06b6d4, #eab308, #a855f7)'
                                : isHighestLevel
                                ? `linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)`
                                : isHighestRank
                                ? `linear-gradient(135deg, #3b82f6, #06b6d4, #14b8a6)`
                                : team.color
                            }}
                          >
                            <span className="relative z-10">{player.jerseyNumber || playerIndex + 1}</span>
                            {isLegendary && (
                              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-purple-400/70 z-20">
                                <FiStar className="w-1.5 h-1.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className={`font-medium text-xs min-w-0 flex-1 ${
                            isLegendary
                              ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 via-cyan-300 to-yellow-300 group-hover:from-purple-200 group-hover:via-pink-200 group-hover:via-cyan-200 group-hover:to-yellow-200 font-black drop-shadow-[0_0_4px_rgba(168,85,247,0.8)]'
                              : isHighestLevel 
                              ? 'text-yellow-200 group-hover:text-yellow-100 font-bold'
                              : isHighestRank
                              ? 'text-blue-200 group-hover:text-blue-100 font-bold'
                              : 'text-white'
                          }`}>
                            <div className="flex items-center justify-between gap-1 flex-nowrap">
                              <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                                <span className="whitespace-nowrap text-xs">{player.username}</span>
                                {player.position && (
                                  <span className="text-gray-400 text-[9px] px-1 py-0.5 bg-gray-700/50 rounded border border-gray-600/30 flex-shrink-0">{player.position}</span>
                                )}
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                  player.paymentStatus === "Payé" ? "bg-green-400" : "bg-red-400"
                                }`}></div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0 flex-nowrap">
                                {(() => {
                                  const displayTier = player.rankTier || 'Unranked';
                                  const { logoUrl, style, isPredator } = getRankLogoForName(displayTier);
                                  
                                  return (
                                    <>
                                      {logoUrl && (
                                        <div className={`relative ${style.size} flex-shrink-0 ${style.border} rounded-lg overflow-hidden ${isPredator ? 'bg-transparent' : 'bg-white/80'} ${
                                          isHighestRank && !isLegendary
                                            ? 'ring-2 ring-blue-400/70 ring-offset-1 ring-offset-gray-800 shadow-lg shadow-blue-500/50'
                                            : ''
                                        }`}>
                                          {isHighestRank && !isLegendary && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-teal-500/30 rounded-lg animate-pulse -z-10"></div>
                                          )}
                                          {isPredator ? (
                                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 via-cyan-400 to-yellow-400 rounded-lg animate-gradient bg-[length:200%_200%] p-[1px]">
                                              <div className="w-full h-full bg-gray-900 rounded-lg">
                                                <img src={logoUrl} alt={displayTier} className="w-full h-full object-cover rounded-lg" />
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              {isHighestRank && !isLegendary && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-teal-400/20 rounded-lg"></div>
                                              )}
                                              <img src={logoUrl} alt={displayTier} className={`w-full h-full object-cover relative z-10 ${
                                                isHighestRank && !isLegendary ? 'drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]' : ''
                                              }`} />
                                            </>
                                          )}
                                          {isHighestRank && !isLegendary && (
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/70 z-20">
                                              <div className="absolute inset-0 bg-blue-300 rounded-full animate-ping"></div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getRankBadgeClass(displayTier)}`}>
                                        {formatRankTierForDisplay(displayTier)}
                                      </span>
                                      {/* MonthlyPoints displayed to the right of badge */}
                                      <span className={`text-[9px] font-bold whitespace-nowrap ${getRankPointsColor(displayTier)}`}>
                                        {player.points !== undefined ? Math.round(player.points) : 0}
                                        <span className="opacity-60 ml-0.5">pts</span>
                                      </span>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-1 flex-nowrap overflow-hidden">
                              <div className="flex items-center gap-0.5 flex-nowrap whitespace-nowrap min-w-0 flex-shrink">
                                {player.level && (
                                  <>
                                    <span className={`text-[10px] font-medium whitespace-nowrap ${
                                      isLegendary
                                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 font-black drop-shadow-[0_0_3px_rgba(168,85,247,0.9)]'
                                        : isHighestLevel 
                                        ? 'text-yellow-300 font-bold drop-shadow-[0_0_2px_rgba(251,191,36,0.8)]'
                                        : getLevelTextColor(getLevelNumericValue(player.level))
                                    }`}>
                                      {player.level}
                                    </span>
                                    <span className={`text-[10px] font-bold mx-0.5 ${
                                      isLegendary 
                                        ? 'text-purple-400/60' 
                                        : isHighestLevel 
                                        ? 'text-yellow-400/50'
                                        : 'text-gray-500'
                                    }`}>|</span>
                                  </>
                                )}
                                <span className="text-gray-400 text-[10px] whitespace-nowrap">{player.gamesPlayed}M</span>
                                <span className="text-gray-500 text-[10px] font-bold mx-0.5">|</span>
                                <FiZap className={`w-2.5 h-2.5 flex-shrink-0 ${getStreakIconColor(player.streak)}`} />
                                <span className={`text-[10px] font-medium whitespace-nowrap ${getStreakColor(player.streak)}`}>
                                  {player.streak !== undefined ? `${player.streak}` : '--'}
                                </span>
                              </div>
                              <div className="flex items-center gap-0.5 flex-shrink-0 flex-nowrap whitespace-nowrap">
                                <span className="text-gray-400 text-[9px] font-bold">{playerIndex === 0 ? 'Victoire:' : 'Vict:'}</span>
                                {player.teamWins !== undefined && player.gamesPlayed !== undefined ? (
                                  <>
                                    <span className="text-[9px] font-bold text-green-400">{player.teamWins}</span>
                                    <span className="text-[9px] font-bold text-gray-500">/</span>
                                    <span className="text-[9px] font-bold text-red-400">{player.gamesPlayed - player.teamWins}</span>
                                  </>
                                ) : (
                                  <span className="text-[9px] font-bold text-gray-500">--</span>
                                )}
                                <span className="text-gray-500 text-[9px] font-bold mx-0.5">|</span>
                                <span className="text-gray-400 text-[9px] font-bold">{playerIndex === 0 ? 'TeamGoal:' : 'TmGl:'}</span>
                                {player.goals !== undefined ? (
                                  <>
                                    <span className="text-[9px] font-bold text-orange-400">{player.goals}</span>
                                    <span className="text-[9px] font-bold text-gray-500">/</span>
                                    <span className="text-[9px] font-bold text-red-400">{player.goalsConceded !== undefined ? player.goalsConceded : 0}</span>
                                  </>
                                ) : (
                                  <span className="text-[9px] font-bold text-gray-500">--</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                          </div>
                            );
                          })}
                        </div>
                      </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                /* Compact Stacked Player List */
                <div className="space-y-0.5">
                  {(() => {
                    // Sort players by Level (highest first), then by Points (highest first)
                    const sortedPlayers = [...selectedMatch.players].sort((a, b) => {
                      const aLevel = getLevelNumericValue(a.level);
                      const bLevel = getLevelNumericValue(b.level);
                      // First sort by Level (descending - highest first)
                      if (bLevel !== aLevel) {
                        return bLevel - aLevel;
                      }
                      // If levels are equal, sort by Points (descending - highest first)
                      const aPoints = a.points || 0;
                      const bPoints = b.points || 0;
                      return bPoints - aPoints;
                    });
                    
                    // Calculate highest level and highest MonthlyPoints for highlighting
                    const highestLevel = Math.max(
                      ...sortedPlayers.map(p => getLevelNumericValue(p.level)),
                      0
                    );
                    // Highest rank = highest MonthlyPoints (points field)
                    const highestPoints = Math.max(
                      ...sortedPlayers.map(p => p.points || 0),
                      0
                    );
                    
                    // Debug: Log players with their points to identify highest MonthlyPoints
                    console.log('🔍 Checking MonthlyPoints (points) for players in match:');
                    sortedPlayers.forEach((player) => {
                      console.log(`  - ${player.username}: points=${player.points || 0}, level=${player.level || 'N/A'}, ranking=${player.ranking}`);
                    });
                    console.log(`  ✅ Highest MonthlyPoints: ${highestPoints} (Level: ${highestLevel})`);
                    const highestPointsPlayers = sortedPlayers.filter(p => (p.points || 0) === highestPoints && highestPoints > 0);
                    if (highestPointsPlayers.length > 0) {
                      console.log(`  🏆 Player(s) with highest MonthlyPoints: ${highestPointsPlayers.map(p => p.username).join(', ')}`);
                    }
                    
                    return sortedPlayers.map((player, playerIndex) => {
                      const isHighestLevel = getLevelNumericValue(player.level) === highestLevel && highestLevel > 0;
                      const isHighestRank = (player.points || 0) === highestPoints && highestPoints > 0;
                      const isLegendary = isHighestLevel && isHighestRank;
                      
                      // Debug: Log legendary status
                      if (isLegendary) {
                        console.log(`  ✨ LEGENDARY: ${player.username} (Level: ${player.level}, Points: ${player.points})`);
                      } else if (isHighestRank) {
                        console.log(`  🥇 Highest MonthlyPoints: ${player.username} (Points: ${player.points})`);
                      } else if (isHighestLevel) {
                        console.log(`  ⭐ Highest Level: ${player.username} (Level: ${player.level})`);
                      }
                      
                      return (
                    <div 
                      key={player.id}
                      className={`flex items-center justify-between py-1 px-1.5 rounded-md transition-all cursor-pointer group relative overflow-hidden ${
                        isLegendary
                          ? 'bg-gradient-to-r from-purple-600/30 via-pink-600/30 via-cyan-600/30 to-yellow-600/30 border-2 border-purple-400/80 shadow-2xl shadow-purple-500/40 hover:border-purple-300 hover:shadow-purple-400/50'
                          : isHighestLevel 
                          ? 'bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 border-2 border-yellow-400/60 shadow-lg shadow-yellow-500/20 hover:border-yellow-300 hover:shadow-yellow-400/30'
                          : isHighestRank
                          ? 'bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20 border-2 border-blue-400/60 shadow-lg shadow-blue-500/20 hover:border-blue-300 hover:shadow-blue-400/30'
                          : 'bg-gray-800/50 border border-gray-700/30 hover:border-blue-400/50 hover:bg-gray-700/50'
                      }`}
                      onClick={() => handlePlayerClick(player)}
                    >
                      {isLegendary && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 via-cyan-500/20 to-yellow-500/20 animate-gradient bg-[length:200%_200%]"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                        </>
                      )}
                      {isHighestLevel && !isLegendary && (
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-amber-400/10 to-orange-400/10 animate-pulse"></div>
                      )}
                      {isHighestRank && !isLegendary && !isHighestLevel && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-cyan-400/10 to-teal-400/10 animate-pulse"></div>
                      )}
                      <div className="flex items-center gap-2 min-w-0 flex-1 relative z-10">
                        <div 
                          className={`w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold relative shadow-sm flex-shrink-0 ${
                            isLegendary 
                              ? 'ring-2 ring-purple-400/70 ring-offset-1 ring-offset-gray-800 shadow-lg shadow-purple-500/50' 
                              : isHighestLevel 
                              ? 'ring-2 ring-yellow-400/50 ring-offset-1 ring-offset-gray-800'
                              : isHighestRank
                              ? 'ring-2 ring-blue-400/50 ring-offset-1 ring-offset-gray-800'
                              : ''
                          }`}
                          style={{
                            background: isLegendary
                              ? `linear-gradient(135deg, #a855f7, #ec4899, #06b6d4, #eab308, #a855f7)`
                              : isHighestLevel 
                              ? `linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)`
                              : isHighestRank
                              ? `linear-gradient(135deg, #3b82f6, #06b6d4, #14b8a6)`
                              : `linear-gradient(135deg, 
                                ${player.isNewPlayer ? '#10b981, #059669' : '#3b82f6, #1d4ed8'})`
                          }}
                        >
                          {player.username.charAt(0).toUpperCase()}
                          {isLegendary && (
                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-purple-400/70">
                              <FiStar className="w-1.5 h-1.5 text-white" />
                            </div>
                          )}
                          {isHighestLevel && !isLegendary && (
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                              <FiStar className="w-1 h-1 text-white" />
                            </div>
                          )}
                          {isHighestRank && !isLegendary && !isHighestLevel && (
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-400 rounded-full flex items-center justify-center animate-pulse">
                              <FiStar className="w-1 h-1 text-white" />
                            </div>
                          )}
                          {player.isNewPlayer && !isHighestLevel && !isHighestRank && (
                            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full flex items-center justify-center">
                              <FiStar className="w-1 h-1 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {(() => {
                                const username = player.username?.trim() || '';
                                const hasRayoSupport = username && rayoSupport.get(username.toLowerCase());
                                return (
                                  <div className="flex items-center gap-1">
                                    <div className={`font-medium transition-colors text-xs whitespace-nowrap ${
                                      isLegendary
                                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 via-cyan-300 to-yellow-300 group-hover:from-purple-200 group-hover:via-pink-200 group-hover:via-cyan-200 group-hover:to-yellow-200 font-black drop-shadow-[0_0_4px_rgba(168,85,247,0.8)]'
                                        : hasRayoSupport
                                        ? 'text-yellow-400 group-hover:text-yellow-300'
                                        : isHighestLevel 
                                        ? 'text-yellow-200 group-hover:text-yellow-100 font-bold'
                                        : isHighestRank
                                        ? 'text-blue-200 group-hover:text-blue-100 font-bold'
                                        : 'text-white group-hover:text-blue-300'
                                    }`}>
                                      {player.username}
                                      {player.position && (
                                        <span className="ml-1.5 text-gray-400 text-[9px] px-1 py-0.5 bg-gray-700/50 rounded border border-gray-600/30">{player.position}</span>
                                      )}
                                    </div>
                                    {hasRayoSupport && (
                                      <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-yellow-500 shadow-md shadow-yellow-500/30 flex-shrink-0 flex items-center justify-center">
                                        <svg className="w-2 h-2" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" viewBox="0 0 24 24">
                                          <path d="M12 5v14M5 12h14"/>
                                        </svg>
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                              <div className="flex items-center flex-shrink-0">
                                {player.paymentStatus === "Subscription" ? (
                                  <FiStar className={`w-2 h-2 sm:w-3 sm:h-3 ${
                                    (typeof player.solde === 'number' && player.solde < 1) ? "text-red-400" :
                                    (typeof player.solde === 'number' && player.solde === 1) ? "text-yellow-400" :
                                    "text-green-400"
                                  }`} />
                                ) : (
                                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                                    player.paymentStatus === "Payé" ? "bg-green-400" : "bg-red-400"
                                  }`}></div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {(() => {
                                const displayTier = player.rankTier || 'Unranked';
                                const { logoUrl, style, isPredator } = getRankLogoForName(displayTier);
                                
                                return (
                                  <>
                                    {logoUrl && (
                                      <div className={`relative ${style.size} flex-shrink-0 ${style.border} rounded-lg overflow-hidden ${isPredator ? 'bg-transparent' : 'bg-white/80'} ${
                                        isHighestRank && !isLegendary
                                          ? 'ring-2 ring-blue-400/70 ring-offset-1 ring-offset-gray-800 shadow-lg shadow-blue-500/50'
                                          : ''
                                      }`}>
                                        {isHighestRank && !isLegendary && (
                                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-teal-500/30 rounded-lg animate-pulse -z-10"></div>
                                        )}
                                        {isPredator ? (
                                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 via-cyan-400 to-yellow-400 rounded-lg animate-gradient bg-[length:200%_200%] p-[1px]">
                                            <div className="w-full h-full bg-gray-900 rounded-lg">
                                              <img src={logoUrl} alt={displayTier} className="w-full h-full object-cover rounded-lg" />
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            {isHighestRank && !isLegendary && (
                                              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-teal-400/20 rounded-lg"></div>
                                            )}
                                            <img src={logoUrl} alt={displayTier} className={`w-full h-full object-cover relative z-10 ${
                                              isHighestRank && !isLegendary ? 'drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]' : ''
                                            }`} />
                                          </>
                                        )}
                                        {isHighestRank && !isLegendary && (
                                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/70 z-20">
                                            <div className="absolute inset-0 bg-blue-300 rounded-full animate-ping"></div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getRankBadgeClass(displayTier)}`}>
                                      {formatRankTierForDisplay(displayTier)}
                                    </span>
                                    {/* MonthlyPoints displayed to the right of badge */}
                                    <span className={`text-[9px] font-bold whitespace-nowrap ${getRankPointsColor(displayTier)}`}>
                                      {player.points !== undefined ? Math.round(player.points) : 0}
                                      <span className="opacity-60 ml-0.5">pts</span>
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-0.5">
                              {player.level && (
                                <>
                                  <span className={`text-[10px] font-medium ${
                                    isLegendary
                                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 font-black drop-shadow-[0_0_3px_rgba(168,85,247,0.9)]'
                                      : isHighestLevel 
                                      ? 'text-yellow-300 font-bold drop-shadow-[0_0_2px_rgba(251,191,36,0.8)]'
                                      : getLevelTextColor(getLevelNumericValue(player.level))
                                  }`}>
                                    {player.level}
                                  </span>
                                  <span className={`text-[10px] font-bold mx-0.5 ${
                                    isLegendary 
                                      ? 'text-purple-400/60' 
                                      : isHighestLevel 
                                      ? 'text-yellow-400/50'
                                      : 'text-gray-500'
                                  }`}>|</span>
                                </>
                              )}
                              <span className="text-[10px] text-gray-400 whitespace-nowrap">{player.gamesPlayed}M</span>
                              <span className="text-[10px] text-gray-500 font-bold mx-0.5">|</span>
                              <FiZap className={`w-3 h-3 ${getStreakIconColor(player.streak)}`} />
                              <span className={`text-[10px] font-medium ${getStreakColor(player.streak)}`}>
                                {player.streak !== undefined ? `${player.streak}` : '--'}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <span className="text-gray-400 text-[9px] font-bold">{playerIndex === 0 ? 'Victoire:' : 'Vict:'}</span>
                              {player.teamWins !== undefined && player.gamesPlayed !== undefined ? (
                                <>
                                  <span className="text-[9px] font-bold text-green-400">{player.teamWins}</span>
                                  <span className="text-[9px] font-bold text-gray-500">/</span>
                                  <span className="text-[9px] font-bold text-red-400">{player.gamesPlayed - player.teamWins}</span>
                                </>
                              ) : (
                                <span className="text-[9px] font-bold text-gray-500">--</span>
                              )}
                              <span className="text-gray-500 text-[9px] font-bold mx-0.5">|</span>
                              <span className="text-gray-400 text-[9px] font-bold">{playerIndex === 0 ? 'TeamGoal:' : 'TmGl:'}</span>
                              {player.goals !== undefined ? (
                                <>
                                  <span className="text-[9px] font-bold text-orange-400">{player.goals}</span>
                                  <span className="text-[9px] font-bold text-gray-500">/</span>
                                  <span className="text-[9px] font-bold text-red-400">{player.goalsConceded !== undefined ? player.goalsConceded : 0}</span>
                                </>
                              ) : (
                                <span className="text-[9px] font-bold text-gray-500">--</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }, [selectedMatch]);

  return (
    <section id="upcoming-matches" className="py-12 bg-gray-50 w-full">
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
                      <FiCalendar className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white leading-none">Matchs à venir</h2>
                      <p className="text-gray-400 text-xs font-medium">Prochains matchs disponibles</p>
                    </div>
                  </div>
                  
                  {/* Stats indicator */}
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-400 text-xs font-medium">{filteredMatches.length} matchs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealAnimation>


        {/* Improved City Filter - Quick Filter Buttons Only */}
        {matches.length > 0 && (
          <div className="mb-6">
            {/* Quick Filter Buttons - Per City Only (no "All" option) */}
            <div className="flex flex-wrap items-center gap-2 justify-center">
              {citiesWithCounts.map((city) => (
                <button
                  key={city.name}
                  onClick={() => {
                    setSelectedCityFilter(city.name);
                    localStorage.setItem('selectedCityFilter', city.name);
                    trackEvent('filter_city', 'user_action', city.name);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    selectedCityFilter === city.name
                      ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {city.displayName} ({city.count})
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            {error === 'static-fallback' ? (
              // Show only warning triangle for static fallback
              <div className="flex items-center justify-center gap-2">
                <FiAlertTriangle className="text-yellow-500 text-xl" />
                <span className="text-yellow-600 text-sm">MHL</span>
              </div>
            ) : (
              // Show normal error message for other errors
              <p className="text-red-800 text-center">{error}</p>
            )}
          </div>
        )}

        {loading ? (
          // État de chargement des cards
          <div className="text-center py-12">
            <style>{`
              @keyframes handSweep { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              @keyframes tick { 0%, 90% { opacity: .25; } 95% { opacity: 1; } 100% { opacity: .25; } }
              @keyframes buttonPulse { 0% { transform: scale(1); opacity: .4; } 50% { transform: scale(1.15); opacity: .9; } 100% { transform: scale(1); opacity: .4; } }
              @keyframes dialGlow { 0%, 100% { opacity: .16; } 50% { opacity: .28; } }
            `}</style>
            <div className="inline-block mb-4">
              <svg viewBox="0 0 164 164" className="w-20 h-20 mx-auto">
                <defs>
                  <radialGradient id="dialBgMatches" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#0f0f0f" />
                    <stop offset="100%" stopColor="#0b0b0b" />
                  </radialGradient>
                </defs>
                <circle cx="82" cy="88" r="64" fill="url(#dialBgMatches)" stroke="#1f2937" strokeWidth="2" />
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
            <p className="mt-4 text-gray-600">Chargement des matchs...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-8 px-4">
            <RevealAnimation>
              <div className="max-w-sm mx-auto">
                {/* Compact Icon */}
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <FiCalendar className="w-8 h-8 text-blue-600" />
                </div>
                
                {/* Compact Message */}
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Aucun match prévu
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Les prochains matchs seront bientôt disponibles
                </p>
                
                {/* Compact Action Button */}
                <button
                  onClick={() => {
                    setIsRefreshing(true);
                    loadMatchesData().finally(() => setIsRefreshing(false));
                    trackEvent('refresh_matches_empty_state', 'user_action');
                  }}
                  disabled={isRefreshing}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiRefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Actualisation...' : 'Actualiser'}
                </button>
              </div>
            </RevealAnimation>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map((match, index) => {
              const isNewDay = index === 0 || 
                new Date(filteredMatches[index - 1].date).toDateString() !== new Date(match.date).toDateString();
              
              return (
                <RevealAnimation key={match.id} delay={index * 0.1}>
                  <div>
                    <div 
                      className={`${
                      (() => {
                        if (match.format.includes('Rayo Battle')) {
                          return 'bg-gradient-to-br from-yellow-800 via-yellow-900 to-amber-950 border border-yellow-600 shadow-lg shadow-yellow-500/40';
                        } else if (match.mode?.toLowerCase().includes('rayo-classic-8vs8') || match.format?.toLowerCase().includes('rayo classic 8vs8')) {
                          return 'bg-gradient-to-br from-indigo-800 via-indigo-900 to-indigo-950 border border-indigo-600 shadow-lg shadow-indigo-500/40';
                        } else if (match.mode?.toLowerCase().includes('rayo-classic-7vs7') || match.format?.toLowerCase().includes('rayo classic 7vs7')) {
                          return 'bg-gradient-to-br from-purple-800 via-purple-900 to-purple-950 border border-purple-600 shadow-lg shadow-purple-500/40';
                        } else if (match.mode?.toLowerCase().includes('rayo-classic-5') || match.format?.toLowerCase().includes('rayo classic 5')) {
                          return 'bg-gradient-to-br from-pink-800 via-pink-900 to-pink-950 border border-pink-600 shadow-lg shadow-pink-500/40';
                        } else if (match.mode?.toLowerCase().includes('rayo rush5')) {
                          return 'bg-gradient-to-br from-orange-800 via-orange-900 to-orange-950 border border-orange-600 shadow-lg shadow-orange-500/40';
                        } else if (match.mode?.toLowerCase().includes('rayo rush6')) {
                          return 'bg-gradient-to-br from-red-800 via-red-900 to-red-950 border border-red-600 shadow-lg shadow-red-500/40';
                        } else {
                          return 'bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 border border-blue-600 shadow-lg shadow-blue-500/40';
                        }
                      })()
                    } ${(() => {
                      if (!match.level) return '';
                      const levelLower = match.level.toLowerCase();
                      if (levelLower.includes('pro') || levelLower.includes('professionnel')) {
                        return 'border-l-4 border-l-red-500';
                      } else if (levelLower.includes('street')) {
                        return 'border-l-4 border-l-blue-500';
                      } else {
                        return 'border-l-4 border-l-green-500';
                      }
                    })()} rounded-2xl hover:shadow-xl transition-all duration-300 cursor-pointer text-white relative overflow-hidden ${getMatchCardBorderStyle(parseMatchDateTime(match.date, match.time))}`}
                    onClick={() => setSelectedMatch(match)}
                  >
                    {/* Compact header section */}
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        {/* Left: Time and info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {match.format.includes('Rayo Battle') && (
                              <span className="text-yellow-300">👑</span>
                            )}
                            {(() => {
                              const matchDate = parseMatchDateTime(match.date, match.time);
                              
                              // Get full day name and short month name in French
                              let dayName = '';
                              let dateNumber = '';
                              let monthName = '';
                              let dayOfWeek = 0;
                              try {
                                dayName = matchDate.toLocaleDateString('fr-FR', { weekday: 'long' });
                                dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                                dateNumber = matchDate.getDate().toString();
                                monthName = matchDate.toLocaleDateString('fr-FR', { month: 'short' });
                                monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                                // Add period after short month if not present
                                if (!monthName.endsWith('.')) {
                                  monthName += '.';
                                }
                                dayOfWeek = matchDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
                              } catch (e) {
                                console.error('Error getting day name:', e);
                              }
                              
                              // Color mapping for each day of the week
                              const dayColors: { [key: number]: { from: string; via: string; to: string; border: string; hoverFrom: string; hoverVia: string; hoverTo: string } } = {
                                0: { // Dimanche (Sunday)
                                  from: 'from-purple-500/95',
                                  via: 'via-pink-500/95',
                                  to: 'to-rose-500/95',
                                  border: 'border-purple-400/60',
                                  hoverFrom: 'hover:from-purple-400',
                                  hoverVia: 'hover:via-pink-400',
                                  hoverTo: 'hover:to-rose-400'
                                },
                                1: { // Lundi (Monday)
                                  from: 'from-blue-500/95',
                                  via: 'via-cyan-500/95',
                                  to: 'to-teal-500/95',
                                  border: 'border-blue-400/60',
                                  hoverFrom: 'hover:from-blue-400',
                                  hoverVia: 'hover:via-cyan-400',
                                  hoverTo: 'hover:to-teal-400'
                                },
                                2: { // Mardi (Tuesday)
                                  from: 'from-green-500/95',
                                  via: 'via-emerald-500/95',
                                  to: 'to-teal-500/95',
                                  border: 'border-green-400/60',
                                  hoverFrom: 'hover:from-green-400',
                                  hoverVia: 'hover:via-emerald-400',
                                  hoverTo: 'hover:to-teal-400'
                                },
                                3: { // Mercredi (Wednesday)
                                  from: 'from-yellow-500/95',
                                  via: 'via-orange-500/95',
                                  to: 'to-amber-500/95',
                                  border: 'border-yellow-400/60',
                                  hoverFrom: 'hover:from-yellow-400',
                                  hoverVia: 'hover:via-orange-400',
                                  hoverTo: 'hover:to-amber-400'
                                },
                                4: { // Jeudi (Thursday)
                                  from: 'from-indigo-500/95',
                                  via: 'via-purple-500/95',
                                  to: 'to-violet-500/95',
                                  border: 'border-indigo-400/60',
                                  hoverFrom: 'hover:from-indigo-400',
                                  hoverVia: 'hover:via-purple-400',
                                  hoverTo: 'hover:to-violet-400'
                                },
                                5: { // Vendredi (Friday)
                                  from: 'from-cyan-500/95',
                                  via: 'via-blue-500/95',
                                  to: 'to-indigo-500/95',
                                  border: 'border-cyan-400/60',
                                  hoverFrom: 'hover:from-cyan-400',
                                  hoverVia: 'hover:via-blue-400',
                                  hoverTo: 'hover:to-indigo-400'
                                },
                                6: { // Samedi (Saturday)
                                  from: 'from-pink-500/95',
                                  via: 'via-rose-500/95',
                                  to: 'to-red-500/95',
                                  border: 'border-pink-400/60',
                                  hoverFrom: 'hover:from-pink-400',
                                  hoverVia: 'hover:via-rose-400',
                                  hoverTo: 'hover:to-red-400'
                                }
                              };
                              
                              const colors = dayColors[dayOfWeek] || dayColors[5]; // Default to Friday if not found
                              
                              // Clean time string - remove any parentheses content
                              const cleanTime = match.time.replace(/\(.*?\)/g, '').trim();
                              
                              return (
                                <div className="group relative inline-flex items-center gap-1.5">
                                  {/* Modern Compact Date Badge with day-specific colors */}
                                  <div className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r ${colors.from} ${colors.via} ${colors.to} backdrop-blur-sm rounded-lg shadow-md border ${colors.border} overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${colors.hoverFrom} ${colors.hoverVia} ${colors.hoverTo}`}>
                                    {/* Animated shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                    
                                    {/* Date number, day and month: "15 Vendredi, Dec." */}
                                    <span className="relative z-10 text-white font-semibold text-xs leading-none whitespace-nowrap">
                                      <span className="font-black">{dateNumber}</span> {dayName}, {monthName}
                                    </span>
                                  </div>
                                  
                                  {/* Compact Time Badge - same height as date badge */}
                                  <div className="relative inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-gray-700/90 to-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-600/50 shadow-sm">
                                    <FiClock className="w-3 h-3 text-cyan-300 flex-shrink-0" />
                                    <span className="text-white font-semibold text-xs">{cleanTime}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        
                        {/* Right: Join button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const matchDate = parseMatchDateTime(match.date, match.time);
                            const isPastMatch = getCountdownInfo(matchDate).isPast;
                            const isMatchFull = match.players.length >= match.maxPlayers;
                            
                            if (isPastMatch) return;
                            
                            trackEvent('join_match_whatsapp', 'user_engagement', `Game_${match.gameId}`);
                            const message = isMatchFull 
                              ? `Bonjour, je souhaite rejoindre la liste d'attente pour ce match:%0A%0AGame ${match.gameId}%0ADate: ${formatDate(match.date)}%0AHeure: ${match.time}%0AEndroit: ${match.field}, ${getCityDisplayName(match.city)}%0A%0AMerci!`
                              : `Bonjour, je souhaite jouer ce match:%0A%0AGame ${match.gameId}%0ADate: ${formatDate(match.date)}%0AHeure: ${match.time}%0AEndroit: ${match.field}, ${getCityDisplayName(match.city)}%0A%0AMerci!`;
                            const whatsappUrl = `https://wa.me/212720707190?text=${message}`;
                            window.open(whatsappUrl, '_blank');
                          }}
                          className={`relative px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 overflow-hidden group ${
                            (() => {
                              const matchDate = parseMatchDateTime(match.date, match.time);
                              const isPastMatch = getCountdownInfo(matchDate).isPast;
                              const isMatchFull = match.players.length >= match.maxPlayers;
                              
                              if (isPastMatch) {
                                return "bg-gray-700/20 cursor-not-allowed opacity-50 text-gray-400";
                              } else if (isMatchFull) {
                                return "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl";
                              } else {
                                return "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl";
                              }
                            })()
                          }`}
                          disabled={(() => {
                            const matchDate = parseMatchDateTime(match.date, match.time);
                            return getCountdownInfo(matchDate).isPast;
                          })()}
                        >
                          {/* Shine effect on hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                          
                          <svg className="w-3 h-3 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z"/>
                          </svg>
                          <span className="relative z-10">
                            {(() => {
                              const matchDate = parseMatchDateTime(match.date, match.time);
                              const isPastMatch = getCountdownInfo(matchDate).isPast;
                              const isMatchFull = match.players.length >= match.maxPlayers;
                              
                              if (isPastMatch) {
                                return "Terminé";
                              } else if (isMatchFull) {
                                return "Waitlist";
                              } else {
                                return "Rejoindre";
                              }
                            })()}
                          </span>
                        </button>
                      </div>
                      
                      {/* Compact info row */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-300 min-w-0 flex-1">
                          <FiMapPin className="w-3 h-3 flex-shrink-0 text-blue-400" />
                          <span className="truncate font-medium leading-none">{match.field}, {getCityDisplayName(match.city)}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Create Google Maps search URL
                              const searchQuery = encodeURIComponent(`${match.field}, ${getCityDisplayName(match.city)}`);
                              const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
                              window.open(googleMapsUrl, '_blank');
                              trackEvent('view_location', 'user_engagement', `Game_${match.gameId}`);
                            }}
                            className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 rounded text-[10px] font-medium transition-all duration-200 hover:scale-105 flex-shrink-0 ml-1"
                            title="Voir sur Google Maps"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                            <span className="hidden sm:inline">Maps</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-white font-semibold leading-none">{match.price && match.price > 0 ? `${match.price}DH` : (
                            (() => {
                              if (match.mode?.toLowerCase().includes('rayo-classic-8vs8') || match.format?.toLowerCase().includes('rayo classic 8vs8')) {
                                return "70DH";
                              } else if (match.mode?.toLowerCase().includes('rayo-classic-7vs7') || match.format?.toLowerCase().includes('rayo classic 7vs7')) {
                                return "60DH";
                              } else if (match.mode?.toLowerCase().includes('rayo-classic-5') || match.format?.toLowerCase().includes('rayo classic 5')) {
                                return "60DH";
                              } else if (match.mode?.toLowerCase().includes('rayo rush5') || match.mode?.toLowerCase().includes('rayo rush6')) {
                                return "40DH";
                              } else if (match.format.includes('Rayo Battle')) {
                                return "50DH";
                              } else {
                                return "50DH";
                              }
                            })()
                          )}</span>
                        </div>
                      </div>
                      
                      {/* Game mode */}
                      <div className="mt-2">
                        <div className="text-[10px] text-gray-400 font-medium">
                          {(() => {
                            const playersPerTeam = match.playersPerTeam || 5;
                            const numberOfTeams = match.numberOfTeams || 2;
                            const modeLower = match.mode?.toLowerCase() || '';
                            
                            // Determine if it's Rush, Classic, or Battle based on mode
                            const isRush = modeLower.includes('rush');
                            const isBattle = modeLower.includes('battle') || numberOfTeams === 4;
                            const isClassic = !isRush && !isBattle;
                            
                            if (isBattle) {
                              return `🏆 Rayo Battle - ${numberOfTeams} équipes de ${playersPerTeam} joueurs`;
                            } else if (isRush) {
                              return `⚡ Rayo Rush ${playersPerTeam} - ${numberOfTeams} équipes de ${playersPerTeam} joueurs`;
                            } else if (isClassic) {
                              return `⚽ Rayo Classique ${playersPerTeam} - ${numberOfTeams} équipes de ${playersPerTeam} joueurs`;
                            } else {
                              // Fallback
                              return `⚽ Match ${playersPerTeam}vs${playersPerTeam} - ${numberOfTeams} équipes de ${playersPerTeam} joueurs`;
                            }
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Compact bottom section */}
                    <div className="px-3 py-2.5 bg-black/10 border-t border-white/5">
                      <div className="flex items-center justify-between gap-3">
                        {/* Left: Player avatars and count */}
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1.5">
                            {match.players.length > 0 ? (
                              <>
                                {match.players.slice(0, 3).map((player) => (
                                  <div 
                                    key={player.id}
                                    className="relative w-5 h-5 rounded-full border border-white/50 overflow-hidden"
                                    style={{
                                      background: `linear-gradient(135deg, 
                                        ${player.isNewPlayer ? '#10b981, #059669' : '#3b82f6, #1d4ed8'})`
                                    }}
                                  >
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="text-white font-bold text-[10px]">
                                        {player.username.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {match.players.length > 3 && (
                                  <div className="w-5 h-5 rounded-full border border-white/50 bg-gray-600 flex items-center justify-center">
                                    <span className="text-white font-bold text-[9px]">
                                      +{match.players.length - 3}
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-dashed border-gray-500 flex items-center justify-center">
                                <FiUsers className="w-2.5 h-2.5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="text-xs">
                            <div className="flex items-center gap-2">
                              <div className="text-white font-semibold">
                                <AnimatedNumber value={match.players.length} />/{match.maxPlayers}
                              </div>
                              {match.level && (() => {
                                const levelLower = match.level.toLowerCase();
                                const isPro = levelLower.includes('pro') || levelLower.includes('professionnel');
                                const isStreet = levelLower.includes('street');
                                
                                if (isPro) {
                                  return (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-red-600 text-white font-bold text-[9px] uppercase tracking-tight rounded-full shadow-sm">
                                      {match.level}
                                    </span>
                                  );
                                } else if (isStreet) {
                                  return (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-blue-600 text-white font-bold text-[9px] uppercase tracking-tight rounded-full shadow-sm">
                                      {match.level}
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-emerald-600 text-white font-bold text-[9px] uppercase tracking-tight rounded-full shadow-sm">
                                      {match.level}
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Right: Progress and status */}
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-gray-700/60 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${Math.max(8, Math.min((match.players.length / match.maxPlayers) * 100, 100))}%`,
                                background: match.players.length >= match.maxPlayers 
                                  ? 'linear-gradient(to right, #f97316, #ea580c)' 
                                  : 'linear-gradient(to right, #10b981, #059669)'
                              }}
                            />
                          </div>
                          <div className={`text-[10px] font-semibold ${match.players.length >= match.maxPlayers ? 'text-orange-400' : 'text-green-400'}`}>
                            {match.players.length >= match.maxPlayers ? "Complet" : `${Math.max(0, match.maxPlayers - match.players.length)} places`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                </RevealAnimation>
              );
            })}

            {/* Join Match CTA Card - Always Visible */}
            <RevealAnimation delay={0.05}>
              <div 
                className="group relative bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200/60 rounded-lg hover:border-green-400/60 hover:shadow-md hover:shadow-green-500/10 transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => {
                  const message = encodeURIComponent(`Bonjour, je souhaite rejoindre un match à ${getCityDisplayName(selectedCityFilter)}. Merci!`);
                  const whatsappUrl = `https://wa.me/212720707190?text=${message}`;
                  window.open(whatsappUrl, '_blank');
                  trackEvent('join_match_cta_whatsapp', 'user_engagement', 'CTA_Card');
                }}
              >
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,rgb(0,0,0)_1px,transparent_0)] [background-size:16px_16px]"></div>
                
                <div className="relative p-3">
                  <div className="flex items-center gap-2.5">
                    {/* Icon with modern design */}
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                        <FiUsers className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className="text-xs font-bold text-gray-900 tracking-tight">Rejoindre un Match</h3>
                        <div className="flex items-center gap-1 text-green-600 opacity-60 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-medium">WhatsApp</span>
                          <svg className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.214 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214a10.13 10.13 0 01-3.772-3.771l-.214-.361a9.88 9.88 0 01-1.378-5.032c0-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.978 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-snug">
                        {filteredMatches.length === 0 
                          ? `Aucun match à ${getCityDisplayName(selectedCityFilter)}. Contactez-nous !`
                          : "Contactez-nous pour rejoindre un match"}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Animated border on hover */}
                <div className="absolute inset-0 rounded-lg border-2 border-green-400/0 group-hover:border-green-400/30 transition-all duration-300 pointer-events-none"></div>
                
                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover:via-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
              </div>
            </RevealAnimation>
          </div>
        )}

        {/* Countdown Timer Card with Weekly Program */}
        <div className="mt-4 mb-3">
          <div className="bg-black rounded-lg p-3 lg:p-4 shadow-lg border border-gray-800">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative">
              {/* Modern professional line separator for desktop */}
              <div className="hidden lg:block absolute left-1/2 top-6 bottom-6 w-0.5 bg-gradient-to-b from-transparent via-white/60 to-transparent transform -translate-x-1/2"></div>
              {/* Left side - Countdown Timer */}
              <div className="flex flex-col items-center justify-center space-y-0.5 lg:space-y-1 h-full">
                <div className="flex items-center gap-2 mb-0.5 lg:mb-1">
                  <h3 className="text-white text-sm font-semibold">Nouveaux matchs publiés dans :</h3>
                </div>
                
                <div className="flex justify-center items-center gap-1 mb-0.5 lg:mb-1">
                  {countdownTime.days === 0 && countdownTime.hours === 0 && countdownTime.minutes === 0 && countdownTime.seconds === 0 ? (
                    <div className="bg-green-400 text-black font-bold text-sm px-3 py-1.5 rounded-md shadow-md">
                      Publiés maintenant !
                    </div>
                  ) : (
                    <>
                      <div className="bg-yellow-400 text-black font-bold text-sm px-1 py-0.5 lg:px-1.5 lg:py-1 rounded-md shadow-md">
                        {countdownTime.days.toString().padStart(2, '0')}j
                      </div>
                      <div className="bg-yellow-400 text-black font-bold text-sm px-1 py-0.5 lg:px-1.5 lg:py-1 rounded-md shadow-md">
                        {countdownTime.hours.toString().padStart(2, '0')}h
                      </div>
                      <div className="bg-yellow-400 text-black font-bold text-sm px-1 py-0.5 lg:px-1.5 lg:py-1 rounded-md shadow-md">
                        {countdownTime.minutes.toString().padStart(2, '0')}m
                      </div>
                      <div className="bg-yellow-400 text-black font-bold text-sm px-1 py-0.5 lg:px-1.5 lg:py-1 rounded-md shadow-md">
                        {countdownTime.seconds.toString().padStart(2, '0')}s
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile separator */}
              <div className="lg:hidden w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent my-1"></div>

              {/* Right side - Weekly Program */}
              <div className="flex flex-col items-center">
                <div className="text-center mb-1">
                  <h4 className="text-white font-bold text-sm">
                    <span className="hidden lg:inline">Programme de la semaine prochaine - {getCityDisplayName(selectedCityFilter)}</span>
                    <span className="lg:hidden">Programme de la semaine prochaine</span>
                  </h4>
                  <p className="text-gray-300 text-xs lg:hidden">{getCityDisplayName(selectedCityFilter)}</p>
                </div>

                <div className="space-y-2 w-full">
                  {[selectedCityFilter].map((city) => {
                    console.log('Looking for weekly program for city:', city);
                    console.log('Available cities in weeklyProgram:', Object.keys(weeklyProgram));
                    console.log('Weekly program data:', weeklyProgram);
                    
                    // Handle city name mapping for weekly program
                    let cityKey = city;
                    if (city === 'Marrakech' && weeklyProgram?.['Marrakesh']) {
                      cityKey = 'Marrakesh';
                    } else if (city === 'Marrakesh' && weeklyProgram?.['Marrakech']) {
                      cityKey = 'Marrakech';
                    }
                    
                    const citySchedule = weeklyProgram?.[cityKey];
                    const hasSchedule = citySchedule && Object.keys(citySchedule).length > 0;
                    console.log(`City schedule for ${city} (key: ${cityKey}):`, citySchedule);
                    
                    return (
                      <div key={city}>
                        {!hasSchedule ? (
                          <div className="text-center text-gray-400 text-xs py-2">
                            Aucun programme disponible pour {getCityDisplayName(city)}
                          </div>
                        ) : (
                          <>
                            {/* Desktop: Ultra compact stacked day boxes */}
                            <div className="hidden lg:flex justify-center">
                          <div className="flex gap-0 items-center">
                            {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day, index) => {
                              const schedule = citySchedule?.[day];
                              const hasGame = schedule && schedule !== '';
                              
                              return (
                                <div key={day} className="flex items-center">
                                  {index > 0 && (
                                    <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-500/50 to-transparent mx-1.5"></div>
                                  )}
                                  <div 
                                    className={`w-11 h-12 rounded-md p-1 text-center transition-all duration-200 flex flex-col justify-center ${
                                      hasGame 
                                        ? 'bg-gradient-to-br from-pink-600/60 to-pink-700/60 border border-pink-500/80 shadow-md shadow-pink-500/20' 
                                        : 'bg-gray-600/40 border border-gray-500/40'
                                    }`}
                                  >
                                    <div className="text-gray-400 text-xs font-medium mb-0.5 leading-none" style={{fontSize: '10px'}}>
                                      {day.substring(0, 3)}
                                    </div>
                                    {hasGame && schedule ? (
                                      <>
                                        <div className="text-white font-semibold leading-none mb-0.5" style={{fontSize: '10px'}}>
                                          {schedule.split(' ')[0] || '-'}
                                        </div>
                                        <div className="text-white font-semibold leading-none" style={{fontSize: '10px'}}>
                                          {schedule.split(' ')[1] || ''}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-gray-500 font-semibold leading-none" style={{fontSize: '10px'}}>
                                        -
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Mobile: Ultra compact list format */}
                        <div className="lg:hidden space-y-0.5">
                          {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => {
                            const schedule = citySchedule?.[day];
                            const hasGame = schedule && schedule !== '';
                            
                            return (
                              <div 
                                key={day} 
                                className={`flex items-center justify-between px-2 py-1 rounded-sm transition-all duration-200 ${
                                  hasGame 
                                    ? 'bg-gradient-to-r from-pink-600/30 to-pink-700/30 border border-pink-500/40' 
                                    : 'bg-gray-600/20 border border-gray-500/20'
                                }`}
                              >
                                <div className="text-gray-300 text-xs font-medium">
                                  {day.substring(0, 3)}
                                </div>
                                <div className={`text-xs font-semibold ${
                                  hasGame ? 'text-white' : 'text-gray-500'
                                }`}>
                                  {hasGame && schedule ? (
                                    <span>
                                      {schedule.split(' ')[0]} {schedule.split(' ')[1]}
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal des détails */}
        <MatchDetailsModal />
        
        {/* City Selection Modal */}
        <CitySelectionModal 
          isOpen={showCityModal}
          onCitySelect={handleCitySelect}
        />
      </div>
    </section>
  );
};

export default UpcomingMatchesSection;

