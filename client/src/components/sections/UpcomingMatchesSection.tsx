import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FiCalendar, FiMapPin, FiClock, FiUsers, FiCheck, FiX, FiStar, FiRefreshCw, FiFilter, FiTrendingUp, FiTarget, FiAward, FiZap, FiShield } from "react-icons/fi";
import { TbBuildingStadium } from "react-icons/tb";
import { trackEvent } from "@/lib/analytics";
import { useCityPreference } from "@/hooks/use-city-preference";
import { CitySelectionModal } from "@/components/ui/CitySelectionModal";

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
    return `⏳ ${days} j ${hours}h ${minutes}min ${seconds}s`;
  } else if (hours > 0) {
    return `⏳ ${hours}h ${minutes}min ${seconds}s`;
  } else {
    return `⏳ ${minutes}min ${seconds}s`;
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

const getStatusIndicator = (matchDate: Date) => {
  const countdown = getCountdownInfo(matchDate);
  
  if (countdown.isPast) {
    return { color: 'bg-gray-400', animate: false };
  } else if (countdown.isToday) {
    return { color: 'bg-red-500', animate: true };
  } else if (countdown.totalHours <= 4) {
    return { color: 'bg-orange-500', animate: false };
  } else if (countdown.totalHours <= 24) {
    return { color: 'bg-green-500', animate: false };
  }
  
  return { color: 'bg-gray-300', animate: false };
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
    <div className="text-orange-500 text-xs font-medium mt-1 bg-orange-50 px-2 py-1 rounded-full border border-orange-200">
      <span className="text-gray-600">Le match est dans :</span> {countdownText}
    </div>
  );
};

// Types pour les matchs
interface Player {
  id: string;
  username: string;
  fullName: string;
  globalScore: number;
  gamesPlayed: number;
  ranking: number;
  cityRanking: number;
  paymentStatus: "Payé" | "Non payé" | "Nouveau joueur" | "Subscription";
  isNewPlayer: boolean;
  goals?: number;
  assists?: number;
  teamWins?: number;
  jerseyNumber?: number;
  team?: "Orange" | "Jaune" | "Blue" | "Yellow" | "Vert";
  attackRatio?: number;     // ATT from CSV
  defenseRatio?: number;    // DEF from CSV
  teamScore?: number;       // Team Score from CSV
  soloScore?: number;       // Solo Score from CSV
  solde?: number;           // Subscriber balance from SubGamesLeft column
  expirationDate?: string;  // Expiration date from ExpirationDate column
}

interface TeamPlayer {
  id: string;
  username: string;
  fullName: string;
  jerseyNumber: number;
  paymentStatus: "Payé" | "Non payé" | "Nouveau joueur" | "Subscription";
  solde?: number;           // Subscriber balance
  expirationDate?: string;  // Expiration date
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
}

// Configuration Google Sheets
const MATCHES_SHEET_CONFIG = {
  csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDgQfkyS5KdTwQABcUDgu673_fSDrwX0HNgGeZiZ5DbSK6UEmYIcUrWPGsAGN5yuL50M6I3rYIJInL/pub?gid=216631647&output=csv"
};

// Fonction pour créer les équipes basées sur les vrais joueurs
const createTeamsFromPlayers = (players: Player[], isRayoBattle: boolean = false): Team[] => {
  const teamMap = new Map<string, TeamPlayer[]>();
  
  // Grouper les joueurs par équipe
  players.forEach((player, index) => {
    if (player.team) {
      if (!teamMap.has(player.team)) {
        teamMap.set(player.team, []);
      }
      
      const teamPlayer: TeamPlayer = {
        id: player.id,
        username: player.username,
        fullName: player.fullName,
        jerseyNumber: player.jerseyNumber || (teamMap.get(player.team)!.length + 1), // Utiliser le numéro du CSV ou séquentiel
        paymentStatus: player.paymentStatus,
        solde: player.solde,
        expirationDate: player.expirationDate
      };
      
      teamMap.get(player.team)!.push(teamPlayer);
    }
  });
  
  // Créer les équipes avec leurs couleurs selon le mode de jeu
  const teams: Team[] = [];
  
  
  if (isRayoBattle) {
    // Pour Rayo Battle: obtenir toutes les couleurs d'équipe uniques du CSV
    const uniqueTeamNames = new Set<string>();
    players.forEach(player => {
      if (player.team) {
        uniqueTeamNames.add(player.team);
      }
    });

    // Pour Rayo Battle, toujours afficher les 4 équipes (même vides)
    const allRayoBattleTeams = [
      { name: "Blue", color: "bg-blue-500" },
      { name: "Orange", color: "bg-orange-500" },
      { name: "Jaune", color: "bg-yellow-500" },
      { name: "Vert", color: "bg-green-500" }
    ];

    // Toujours utiliser les 4 équipes pour Rayo Battle
    const teamNamesToUse = allRayoBattleTeams.map(t => t.name);
    
    teamNamesToUse.forEach((teamName, index) => {
      const colorConfig = allRayoBattleTeams.find(t => t.name === teamName) || allRayoBattleTeams[index % allRayoBattleTeams.length];
      
      // Toujours créer l'équipe, même si elle est vide
      const teamPlayers = teamMap.has(teamName) 
        ? teamMap.get(teamName)!.sort((a, b) => {
            const playerA = players.find(p => p.id === a.id);
            const playerB = players.find(p => p.id === b.id);
            return (playerA?.ranking || 999) - (playerB?.ranking || 999);
          })
        : []; // Équipe vide si aucun joueur assigné
      
      teams.push({
        name: teamName as "Orange" | "Jaune" | "Blue" | "Vert",
        color: colorConfig.color,
        players: teamPlayers
      });
    });
  } else {
    // Pour les matchs réguliers: 3 équipes classiques
    if (teamMap.has("Orange")) {
      const sortedPlayers = teamMap.get("Orange")!.sort((a, b) => {
        const playerA = players.find(p => p.id === a.id);
        const playerB = players.find(p => p.id === b.id);
        return (playerA?.ranking || 999) - (playerB?.ranking || 999);
      });
      
      teams.push({
        name: "Orange",
        color: "bg-orange-500",
        players: sortedPlayers
      });
    }
    
    if (teamMap.has("Jaune")) {
      const sortedPlayers = teamMap.get("Jaune")!.sort((a, b) => {
        const playerA = players.find(p => p.id === a.id);
        const playerB = players.find(p => p.id === b.id);
        return (playerA?.ranking || 999) - (playerB?.ranking || 999);
      });
      
      teams.push({
        name: "Jaune",
        color: "bg-yellow-500",
        players: sortedPlayers
      });
    }
    
    if (teamMap.has("Blue")) {
      const sortedPlayers = teamMap.get("Blue")!.sort((a, b) => {
        const playerA = players.find(p => p.id === a.id);
        const playerB = players.find(p => p.id === b.id);
        return (playerA?.ranking || 999) - (playerB?.ranking || 999);
      });
      
      teams.push({
        name: "Blue",
        color: "bg-blue-500",
        players: sortedPlayers
      });
    }
  }


  
  return teams;
};

const UpcomingMatchesSection = () => {
  const { t } = useLanguage();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("All cities");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerCard, setShowPlayerCard] = useState(false);
  
  // City preference management
  const { selectedCity: savedCity, isFirstVisit, saveCityPreference } = useCityPreference();
  const [showCityModal, setShowCityModal] = useState(false);

  // Handle city selection
  const handleCitySelect = (city: string) => {
    saveCityPreference(city);
    setSelectedCity(city);
    setShowCityModal(false);
    trackEvent('city_preference_selected', 'user_preference', city);
  };


  // Handler pour ouvrir la carte joueur
  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setShowPlayerCard(true);
    trackEvent('player_card_view', 'interaction', player.username);
  };

  // FIFA Player Card Component
  const FIFAPlayerCard = ({ player, onClose }: { player: Player; onClose: () => void }) => {
    const getCardGradient = (score: number, rank: number) => {
      // Gold theme for top 3 players
      if (rank <= 3) return 'from-yellow-500 via-yellow-600 to-yellow-800';
      
      // Score-based colors for other players
      if (score >= 8.5) return 'from-yellow-500 via-yellow-600 to-yellow-800';
      if (score >= 7.5) return 'from-green-600 via-emerald-600 to-teal-800';
      if (score >= 6.5) return 'from-blue-600 via-indigo-600 to-purple-800';
      if (score >= 5.5) return 'from-purple-600 via-violet-600 to-pink-800';
      return 'from-gray-600 via-slate-600 to-gray-800';
    };

    // Map our stats with full words instead of abbreviations
    const baseStats = {
      Matches: player.gamesPlayed || 0,
      Score: parseFloat((player.globalScore || 0).toFixed(2)), // Show as 8.80 instead of 880
      Goals: player.goals || 0,
      Assists: player.assists || 0,
      Wins: player.teamWins || 0,
      Rank: player.ranking || 0
    };

    // Add advanced stats if available (percentages and decimal scores)
    const advancedStats: Record<string, number> = {};
    if (player.attackRatio !== undefined) {
      advancedStats['Attack %'] = parseFloat((player.attackRatio || 0).toFixed(1));
    }
    if (player.defenseRatio !== undefined) {
      advancedStats['Defense %'] = parseFloat((player.defenseRatio || 0).toFixed(1));
    }
    if (player.teamScore !== undefined) {
      advancedStats['Team Score'] = parseFloat((player.teamScore || 0).toFixed(2));
    }
    if (player.soloScore !== undefined) {
      advancedStats['Solo Score'] = parseFloat((player.soloScore || 0).toFixed(2));
    }
    // Balance hidden per user request
    // if (player.paymentStatus === "Subscription" && player.solde !== undefined) {
    //   advancedStats['Balance'] = player.solde || 0;
    // }

    const playerStats = { ...baseStats, ...advancedStats };

    return (
      <Dialog open={showPlayerCard} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-sm w-full mx-auto p-0 bg-transparent border-none flex items-center justify-center" aria-describedby="player-card-description">
          <DialogHeader className="sr-only">
            <DialogTitle>Player Statistics for {player.username}</DialogTitle>
          </DialogHeader>
          <div className="relative flex items-center justify-center w-full">
            {/* FIFA Card */}
            <div className={`w-72 max-w-[90vw] sm:w-72 rounded-3xl bg-gradient-to-br ${getCardGradient(player.globalScore, player.ranking)} p-5 shadow-2xl text-white font-sans transform hover:scale-105 transition duration-300 ease-in-out relative`}>
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-2 right-2 w-8 h-8 bg-black/20 rounded-full flex items-center justify-center hover:bg-black/40 transition-colors z-10"
              >
                <FiX className="w-4 h-4 text-white" />
              </button>

              {/* Header with Rating only */}
              <div className="flex justify-between items-center text-2xl font-extrabold drop-shadow-md">
                <span>{(player.globalScore || 0).toFixed(2)}</span>
              </div>

              {/* Moroccan Flag and Rank */}
              <div className="flex justify-between mt-3 mb-4">
                <div className="h-6 w-10 rounded shadow-md relative overflow-hidden">
                  {/* Red section */}
                  <div className="absolute top-0 left-0 w-full h-full bg-red-600"></div>
                  {/* Green pentagram star in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                </div>
                <div className="h-6 px-2 bg-orange-500 rounded shadow-md flex items-center justify-center">
                  <span className="text-xs font-bold text-white">#{player.ranking}</span>
                </div>
              </div>

              {/* Player Avatar Area */}
              <div className="relative h-40 flex justify-center items-center">
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-white">
                      {player.fullName.split(' ')[0].charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                {player.isNewPlayer && (
                  <div className="absolute top-2 right-8 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
                    NEW
                  </div>
                )}
              </div>

              {/* Player Name */}
              <div className="text-center text-lg mt-3 font-bold uppercase tracking-wide border-t border-white pt-2">
                {player.username}
              </div>

              {/* Payment Status and Subscriber Games Left */}
              {player.paymentStatus && (
                <div className="text-center mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    player.paymentStatus === "Subscription" ? "bg-green-500" :
                    player.paymentStatus === "Payé" ? "bg-blue-500" :
                    player.paymentStatus === "Non payé" ? "bg-red-500" :
                    "bg-yellow-500"
                  } text-white`}>
                    {player.paymentStatus}
                  </span>
                  
                  {/* Balance Display - Show for ALL players including -1 values */}
                  {player.solde !== undefined && (
                    <div className="text-xs mt-1 opacity-80">
                      <span className={`${
                        player.solde === -1 ? "text-red-300" :
                        player.solde === 0 ? "text-green-300" :
                        player.solde < 1 ? "text-red-300" :
                        player.solde === 1 ? "text-yellow-300" :
                        "text-green-300"
                      }`}>
                        Balance: {player.solde}
                      </span>
                    </div>
                  )}
                  
                  {/* Expiration Date Display - ONLY for subscribers */}
                  {player.paymentStatus === "Subscription" && player.expirationDate && (
                    <div className="text-xs mt-1 opacity-80 text-orange-200">
                      Expire: {player.expirationDate}
                    </div>
                  )}
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mt-4 bg-black bg-opacity-20 p-3 rounded-lg shadow-inner">
                {Object.entries(playerStats).map(([key, val]) => (
                  <div key={key} className="flex justify-between font-semibold">
                    <span>{key}</span>
                    <span>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div id="player-card-description" className="sr-only">
              FIFA-style player card showing detailed statistics for {player.username}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Fonction pour obtenir l'icône du terrain (toujours un stade)
  const getFieldIcon = () => {
    return <TbBuildingStadium className="text-orange-600 flex-shrink-0" />;
  };

  // Fonction pour parser les données CSV du nouveau Google Sheet
  const parseMatchesCSV = (csvData: string): Match[] => {
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Headers: GameID,Terrain,Date,City,Status,PlayerUsername,Match,Score,Rank or GameID,Date,City,Status,PlayerUsername,Match,Score,Rank
    const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
    
    const matchesMap = new Map<string, Match>();
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Parser CSV en gérant les virgules dans les guillemets (comme "7,5")
      const row: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
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
      
      // Dynamic parsing to handle both sheet formats
      const hasTerrain = headers.includes('Terrain');
      const hasTeam = headers.includes('Team') || headers.includes('team');
      const hasMode = headers.includes('Mode') || headers.includes('mode');
      
      const gameId = row[0]?.trim(); // GameID
      const terrain = hasTerrain ? row[1]?.trim() : null; // Terrain (if exists)
      const dateTime = hasTerrain ? row[2]?.trim() : row[1]?.trim(); // Date
      const city = hasTerrain ? row[3]?.trim() : row[2]?.trim(); // City
      const status = hasTerrain ? row[4]?.trim() : row[3]?.trim(); // Status
      const playerUsername = hasTerrain ? row[5]?.trim() : row[4]?.trim(); // PlayerUsername
      const matchCount = parseInt(hasTerrain ? row[6] : row[5]) || 0; // Match (games played)
      // Parse score with European decimal format handling (comma to dot conversion)
      const rawScore = hasTerrain ? row[7] : row[6];
      const score = rawScore ? parseFloat(rawScore.toString().replace(',', '.').trim()) || 0 : 0; // Score
      const rank = parseInt(hasTerrain ? row[8] : row[7]) || 0; // Rank
      
      // Extract Mode column
      let gameMode = '';
      if (hasMode) {
        const modeIndex = headers.findIndex(h => h.toLowerCase() === 'mode');
        gameMode = row[modeIndex]?.trim() || '';
      }
      
      // Extraire le capitaine, l'équipe, le numéro et le statut de paiement si ils existent
      let captainName = '';
      let teamLetter = '';
      let playerNumber = null;
      let paymentStatus = '';
      
      // Extraire le capitaine
      const hasCaptain = headers.includes('Capitain name');
      if (hasCaptain) {
        const captainIndex = headers.findIndex(h => h === 'Capitain name');
        captainName = row[captainIndex]?.trim() || '';
        // Ignorer les valeurs d'erreur Excel
        if (captainName === '#REF!' || captainName === '#N/A' || captainName === '#ERROR!') {
          captainName = '';
        }
      }
      
      if (hasTeam) {
        const teamIndex = headers.findIndex(h => h.toLowerCase() === 'team');
        teamLetter = row[teamIndex]?.trim() || '';
        // Ignorer les valeurs d'erreur Excel
        if (teamLetter === '#REF!' || teamLetter === '#N/A' || teamLetter === '#ERROR!') {
          teamLetter = '';
        }
      }
      
      // Extraire le numéro du joueur
      const hasNumber = headers.includes('Number') || headers.includes('number');
      if (hasNumber) {
        const numberIndex = headers.findIndex(h => h.toLowerCase() === 'number');
        const numberValue = row[numberIndex]?.trim();
        if (numberValue && numberValue !== '#REF!' && numberValue !== '#N/A' && numberValue !== '#ERROR!') {
          playerNumber = parseInt(numberValue) || null;
        }
      }
      
      // Extraire le statut de paiement
      const hasPaiement = headers.includes('Paiement') || headers.includes('paiement');
      if (hasPaiement) {
        const paiementIndex = headers.findIndex(h => h.toLowerCase() === 'paiement');
        paymentStatus = row[paiementIndex]?.trim() || '';
        // Ignorer les valeurs d'erreur Excel
        if (paymentStatus === '#REF!' || paymentStatus === '#N/A' || paymentStatus === '#ERROR!') {
          paymentStatus = '';
        }
      }
      
      // Filtrer seulement les matchs programmés
      if (status !== 'Scheduled' || !gameId) continue;
      
      // Créer le match d'abord s'il n'existe pas
      if (!matchesMap.has(gameId)) {
        // Parser la date et l'heure
        const dateObj = new Date(dateTime);
        const dateStr = dateObj.toISOString().split('T')[0];
        const timeStr = dateObj.toTimeString().slice(0, 5) + ' (60min)';
        
        // Set max players and format based on mode
        const isRayoBattle = gameMode.toLowerCase() === 'rayo battle';
        const maxPlayers = isRayoBattle ? 20 : 15;
        const gameFormat = isRayoBattle ? 'Rayo Battle 4x5' : '5vs5';
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
            'Ait Melloul': 'Aït Melloul'
          };
          return cityMap[cityName] || cityName;
        };

        const match: Match = {
          id: `MATCH_${gameId}`,
          gameId: gameId,
          city: convertToFrench(city || "Casablanca"),
          field: terrain || "Terrain Rayo Sport",
          date: dateStr,
          time: timeStr,
          format: gameFormat,
          status: "Besoin d'autres joueurs",
          players: [],
          maxPlayers: maxPlayers,
          captain: captainName,
          mode: gameMode
        };
        matchesMap.set(gameId, match);
      }
      
      // Ajouter le joueur seulement s'il existe
      if (playerUsername && playerUsername.trim()) {
        // Déterminer si c'est un nouveau joueur (0 matchs joués)
        const isNewPlayer = matchCount === 0;
        
        // Mapper les équipes directement par nom de couleur
        let teamName: "Orange" | "Jaune" | "Blue" | "Yellow" | "Vert" | undefined;
        switch (teamLetter.toLowerCase()) {
          case 'orange':
            teamName = "Orange";
            break;
          case 'jaune':
            teamName = "Jaune";
            break;
          case 'blue':
            teamName = "Blue";
            break;
          case 'yellow':
            teamName = "Yellow";
            break;
          case 'vert':
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

        // Parse subscriber balance from SubGamesLeft column
        let subGamesLeft = 0;
        const hasSubGamesLeft = headers.includes('SubGamesLeft');
        if (hasSubGamesLeft) {
          const subGamesLeftIndex = headers.findIndex(h => h === 'SubGamesLeft');
          const subGamesLeftValue = row[subGamesLeftIndex]?.trim();
          if (subGamesLeftValue && subGamesLeftValue !== '#REF!' && subGamesLeftValue !== '#N/A' && subGamesLeftValue !== '#ERROR!') {
            subGamesLeft = parseInt(subGamesLeftValue) || 0;
            // console.log(`Debug Balance Check: Player ${playerUsername}, Status: ${paymentStatus}, Balance: ${subGamesLeft}, Final Status will be: Subscription`);
          }
        } else {
          // console.log('Debug: SubGamesLeft column not found in headers:', headers);
        }

        // Parse expiration date from ExpirationDate column
        let expirationDate = '';
        const hasExpirationDate = headers.includes('ExpirationDate');
        if (hasExpirationDate) {
          const expirationDateIndex = headers.findIndex(h => h === 'ExpirationDate');
          const expirationDateValue = row[expirationDateIndex]?.trim();
          if (expirationDateValue && expirationDateValue !== '#REF!' && expirationDateValue !== '#N/A' && expirationDateValue !== '#ERROR!') {
            expirationDate = expirationDateValue;
          }
        }
        
        // Mapper le statut de paiement depuis la colonne CSV
        let finalPaymentStatus: "Payé" | "Non payé" | "Nouveau joueur" | "Subscription";
        
        if (paymentStatus.toLowerCase() === 'sub') {
          // All subscribers keep "Subscription" status regardless of balance
          finalPaymentStatus = "Subscription";
        } else if (paymentStatus.toLowerCase() === 'pay') {
          finalPaymentStatus = "Payé";
        } else if (paymentStatus.toLowerCase() === 'nopay') {
          finalPaymentStatus = "Non payé";
        } else {
          // Fallback pour les anciennes données ou valeurs manquantes
          finalPaymentStatus = isNewPlayer ? "Nouveau joueur" : "Non payé";
        }

        // Parse additional statistics with proper decimal handling
        const parseDecimal = (value: string | undefined) => {
          if (!value || value.trim() === '') return undefined;
          const cleanValue = value.toString().replace(',', '.').trim();
          const parsed = parseFloat(cleanValue);
          return isNaN(parsed) ? undefined : parsed;
        };

        // Extract Goals, Assists, and Wins from CSV if available
        const extractStatByHeader = (statName: string) => {
          const headerIndex = headers.findIndex(h => h.toLowerCase() === statName.toLowerCase());
          if (headerIndex !== -1) {
            const value = row[headerIndex]?.trim();
            if (value && value !== '#REF!' && value !== '#N/A' && value !== '#ERROR!' && value !== '') {
              return parseInt(value) || 0;
            }
          }
          return 0;
        };

        const player: Player = {
          id: `${gameId}_${playerUsername}`,
          username: playerUsername,
          fullName: playerUsername, // Utiliser username comme nom d'affichage
          globalScore: score,
          gamesPlayed: matchCount,
          ranking: rank,
          cityRanking: rank,
          paymentStatus: finalPaymentStatus,
          isNewPlayer: isNewPlayer,
          team: teamName,
          jerseyNumber: playerNumber ?? undefined,
          // Extract Goals, Assists, Wins from CSV
          goals: extractStatByHeader('goals'),
          assists: extractStatByHeader('assists'),
          teamWins: extractStatByHeader('wins'),
          // New statistics from CSV columns (if available)
          attackRatio: parseDecimal(row[13]),    // ATT column
          defenseRatio: parseDecimal(row[14]),   // DEF column  
          teamScore: parseDecimal(row[15]),      // Team Score column
          soloScore: parseDecimal(row[16]),      // Solo Score column
          solde: subGamesLeft,          // SubGamesLeft column (dynamic index)
          expirationDate: expirationDate // ExpirationDate column (dynamic index)
        };
        
        // Debug: Log the player data to verify balance values
        if (finalPaymentStatus === "Subscription") {
          // console.log(`🎯 Creating Player: ${playerUsername}, Balance: ${subGamesLeft}, Will assign solde: ${subGamesLeft}`);
        }
        
        const match = matchesMap.get(gameId)!;
        
        // Vérifier si le joueur existe déjà dans ce match (éviter les doublons)
        const existingPlayer = match.players.find(p => 
          p.username.toLowerCase() === playerUsername.toLowerCase() || 
          p.id === player.id
        );
        
        if (!existingPlayer) {
          match.players.push(player);
        } else {
          // Update existing player with latest balance data if it's a subscriber
          if (finalPaymentStatus === "Subscription" && typeof subGamesLeft === 'number') {
            existingPlayer.solde = subGamesLeft;
            existingPlayer.paymentStatus = finalPaymentStatus;
          }
        }
      }
    }
    
    // Mettre à jour le statut de tous les matchs et créer les équipes
    Array.from(matchesMap.values()).forEach(matchItem => {
      matchItem.status = matchItem.players.length >= matchItem.maxPlayers ? "Complet" : "Besoin d'autres joueurs";
      
      // Créer les équipes pour les matchs qui ont des équipes assignées
      // Rayo Battle: 20 joueurs avec 4 équipes de 5
      // Regular: 15 joueurs avec 3 équipes de 5
      const isRayoBattle = matchItem.mode?.toLowerCase() === 'rayo battle';
      
      // For Rayo Battle matches, always show teams (even if empty)
      // For regular matches, only show teams if there are enough players with team assignments
      const shouldCreateTeams = isRayoBattle || 
        (matchItem.players.some(p => p.team) && matchItem.players.length >= 3);
      
      if (shouldCreateTeams) {
        matchItem.teams = createTeamsFromPlayers(matchItem.players, isRayoBattle);
      }
    });
    
    return Array.from(matchesMap.values());
  };





  // Function to create fake Kings League match data
  const createFakeKingsLeagueMatch = (): Match => {
    // Kings League teams with 5 players each
    const kingsLeagueTeams = [
      {
        name: "Blue" as const,
        color: "from-blue-500 to-blue-700",
        players: [
          "mohamed al.01", "youssef ka.02", "hassan be.03", "omar sa.04", "ahmed el.05"
        ]
      },
      {
        name: "Orange" as const,
        color: "from-orange-500 to-orange-700", 
        players: [
          "karim ra.06", "ayoub ma.07", "said ch.08", "rachid bo.09", "zakaria ha.10"
        ]
      },
      {
        name: "Jaune" as const,
        color: "from-yellow-500 to-yellow-700",
        players: [
          "hamza ja.11", "ismail gh.12", "amine ze.13", "hicham mo.14", "abdellah fa.15"
        ]
      },
      {
        name: "Vert" as const,
        color: "from-green-500 to-green-700",
        players: [
          "tarik ben.16", "nabil qu.17", "walid ah.18", "redouane el.19", "mounir ka.20"
        ]
      }
    ];

    const allPlayers: Player[] = [];
    const teams: Team[] = [];

    kingsLeagueTeams.forEach((kingsTeam, teamIndex) => {
      const teamPlayers: TeamPlayer[] = [];
      
      kingsTeam.players.forEach((username, playerIndex) => {
        const firstName = username.split(' ')[0];
        const jerseyNumber = (teamIndex * 5) + playerIndex + 1;
        
        const player: Player = {
          id: `kl-${jerseyNumber}`,
          username: username,
          fullName: firstName,
          globalScore: Math.floor(Math.random() * 50) + 50,
          gamesPlayed: Math.floor(Math.random() * 10) + 5,
          ranking: jerseyNumber,
          cityRanking: jerseyNumber,
          paymentStatus: Math.random() > 0.5 ? "Subscription" : "Payé",
          isNewPlayer: false,
          goals: Math.floor(Math.random() * 8),
          assists: Math.floor(Math.random() * 5),
          teamWins: Math.floor(Math.random() * 6),
          jerseyNumber: jerseyNumber,
          team: kingsTeam.name as any,
          attackRatio: Math.random() * 10,
          defenseRatio: Math.random() * 10,
          teamScore: Math.random() * 30,
          soloScore: Math.random() * 20,
          solde: Math.floor(Math.random() * 10) - 1,
          expirationDate: Math.random() > 0.7 ? "2025-02-15" : undefined
        };

        const teamPlayer: TeamPlayer = {
          id: player.id,
          username: player.username,
          fullName: player.fullName,
          jerseyNumber: jerseyNumber,
          paymentStatus: player.paymentStatus,
          solde: player.solde,
          expirationDate: player.expirationDate
        };

        allPlayers.push(player);
        teamPlayers.push(teamPlayer);
      });

      teams.push({
        name: kingsTeam.name as any,
        color: kingsTeam.color,
        players: teamPlayers
      });
    });

    // Create Kings League match
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    return {
      id: "kings-league-demo",
      gameId: "KL001",
      city: "Casablanca",
      field: "Stade Mohammed V",
      date: dateStr,
      time: "19:00 (60min)",
      format: "Rayo Battle 4x5",
      status: "Complet",
      players: allPlayers,
      maxPlayers: 20,
      teams: teams,
      captain: "mohamed al.01"
    };
  };

  // Fonction pour charger les données depuis Google Sheets
  const loadMatchesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ajouter plusieurs paramètres anti-cache pour forcer la récupération de données fraîches
      const timestamp = new Date().getTime();
      const random = Math.random().toString(36).substring(7);
      const urlWithCache = `${MATCHES_SHEET_CONFIG.csvUrl}&_t=${timestamp}&v=${random}&refresh=true`;
      
      const response = await fetch(urlWithCache, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const csvData = await response.text();
      const parsedMatches = parseMatchesCSV(csvData);
      
      // Debug: Check if we have any Rayo Battle matches
      console.log('🎯 Parsed matches:', parsedMatches.map(m => ({ gameId: m.gameId, format: m.format, mode: m.mode })));
      const rayoBattleMatches = parsedMatches.filter(m => m.mode?.toLowerCase() === 'rayo battle');
      console.log('⚔️ Rayo Battle matches found:', rayoBattleMatches.length);
      
      // Add demo players to existing Rayo Battle matches or create a demo match
      if (rayoBattleMatches.length > 0) {
        // Add demo players to the first real Rayo Battle match
        const realRayoBattleMatch = parsedMatches.find(m => m.mode?.toLowerCase() === 'rayo battle');
        console.log('🔍 Real Rayo Battle match found:', realRayoBattleMatch?.gameId, 'players:', realRayoBattleMatch?.players.length);
        if (realRayoBattleMatch && realRayoBattleMatch.players.length > 0) {
          // Keep original team assignments from CSV for Rayo Battle
          console.log('✨ Using original team assignments from CSV for Rayo Battle');
        } else if (realRayoBattleMatch && realRayoBattleMatch.players.length === 0) {
          // Create demo players for the real Rayo Battle match
          const demoPlayers: Player[] = [
            {
              id: "demo1",
              username: "captain.01",
              fullName: "Captain Red",
              globalScore: 2850,
              gamesPlayed: 45,
              ranking: 1,
              cityRanking: 1,
              paymentStatus: "Payé",
              isNewPlayer: false,
              goals: 28,
              assists: 15,
              teamWins: 32,
              jerseyNumber: 10,
              team: "Red Dragons",
              attackRatio: 85,
              defenseRatio: 78,
              teamScore: 2400,
              soloScore: 450
            },
            {
              id: "demo2",
              username: "shark.02",
              fullName: "Blue Striker",
              globalScore: 2650,
              gamesPlayed: 38,
              ranking: 3,
              cityRanking: 2,
              paymentStatus: "Payé",
              isNewPlayer: false,
              goals: 22,
              assists: 12,
              teamWins: 25,
              jerseyNumber: 9,
              team: "Blue Sharks",
              attackRatio: 82,
              defenseRatio: 75,
              teamScore: 2200,
              soloScore: 450
            },
            {
              id: "demo3",
              username: "eagle.03",
              fullName: "Green Defender",
              globalScore: 2480,
              gamesPlayed: 42,
              ranking: 5,
              cityRanking: 3,
              paymentStatus: "Payé",
              isNewPlayer: false,
              goals: 8,
              assists: 25,
              teamWins: 28,
              jerseyNumber: 5,
              team: "Green Eagles",
              attackRatio: 65,
              defenseRatio: 92,
              teamScore: 2100,
              soloScore: 380
            },
            {
              id: "demo4",
              username: "lion.04",
              fullName: "Golden Midfielder",
              globalScore: 2320,
              gamesPlayed: 35,
              ranking: 8,
              cityRanking: 4,
              paymentStatus: "Payé",
              isNewPlayer: false,
              goals: 15,
              assists: 18,
              teamWins: 22,
              jerseyNumber: 8,
              team: "Gold Lions",
              attackRatio: 75,
              defenseRatio: 80,
              teamScore: 2000,
              soloScore: 320
            },
            {
              id: "demo5",
              username: "dragon.05",
              fullName: "Red Winger",
              globalScore: 2180,
              gamesPlayed: 28,
              ranking: 12,
              cityRanking: 5,
              paymentStatus: "Subscription",
              isNewPlayer: false,
              goals: 12,
              assists: 8,
              teamWins: 18,
              jerseyNumber: 7,
              team: "Red Dragons",
              attackRatio: 78,
              defenseRatio: 68,
              teamScore: 1900,
              soloScore: 280,
              solde: 3,
              expirationDate: "2025-01-15"
            },
            {
              id: "demo6",
              username: "newbie.06",
              fullName: "Fresh Talent",
              globalScore: 0,
              gamesPlayed: 0,
              ranking: 999,
              cityRanking: 999,
              paymentStatus: "Nouveau joueur",
              isNewPlayer: true,
              goals: 0,
              assists: 0,
              teamWins: 0,
              jerseyNumber: 22,
              team: "Blue Sharks",
              attackRatio: 0,
              defenseRatio: 0,
              teamScore: 0,
              soloScore: 0
            }
          ];
          
          realRayoBattleMatch.players = demoPlayers;
          realRayoBattleMatch.captain = "captain.01";
          console.log('✨ Added demo players to real Rayo Battle match:', realRayoBattleMatch.gameId);
          console.log('🎮 Demo players:', demoPlayers.map(p => ({ username: p.username, team: p.team })));
        }
      } else if (rayoBattleMatches.length === 0) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        
        // Create demo players for Rayo Battle
        const demoPlayers: Player[] = [
          {
            id: "demo1",
            username: "captain.01",
            fullName: "Captain Red",
            globalScore: 2850,
            gamesPlayed: 45,
            ranking: 1,
            cityRanking: 1,
            paymentStatus: "Payé",
            isNewPlayer: false,
            goals: 28,
            assists: 15,
            teamWins: 32,
            jerseyNumber: 10,
            team: "Red Dragons",
            attackRatio: 85,
            defenseRatio: 78,
            teamScore: 2400,
            soloScore: 450
          },
          {
            id: "demo2",
            username: "shark.02",
            fullName: "Blue Striker",
            globalScore: 2650,
            gamesPlayed: 38,
            ranking: 3,
            cityRanking: 2,
            paymentStatus: "Payé",
            isNewPlayer: false,
            goals: 22,
            assists: 12,
            teamWins: 25,
            jerseyNumber: 9,
            team: "Blue Sharks",
            attackRatio: 82,
            defenseRatio: 75,
            teamScore: 2200,
            soloScore: 450
          },
          {
            id: "demo3",
            username: "eagle.03",
            fullName: "Green Defender",
            globalScore: 2480,
            gamesPlayed: 42,
            ranking: 5,
            cityRanking: 3,
            paymentStatus: "Payé",
            isNewPlayer: false,
            goals: 8,
            assists: 25,
            teamWins: 28,
            jerseyNumber: 5,
            team: "Green Eagles",
            attackRatio: 65,
            defenseRatio: 92,
            teamScore: 2100,
            soloScore: 380
          },
          {
            id: "demo4",
            username: "lion.04",
            fullName: "Golden Midfielder",
            globalScore: 2320,
            gamesPlayed: 35,
            ranking: 8,
            cityRanking: 4,
            paymentStatus: "Payé",
            isNewPlayer: false,
            goals: 15,
            assists: 18,
            teamWins: 22,
            jerseyNumber: 8,
            team: "Gold Lions",
            attackRatio: 75,
            defenseRatio: 80,
            teamScore: 2000,
            soloScore: 320
          },
          {
            id: "demo5",
            username: "dragon.05",
            fullName: "Red Winger",
            globalScore: 2180,
            gamesPlayed: 28,
            ranking: 12,
            cityRanking: 5,
            paymentStatus: "Subscription",
            isNewPlayer: false,
            goals: 12,
            assists: 8,
            teamWins: 18,
            jerseyNumber: 7,
            team: "Red Dragons",
            attackRatio: 78,
            defenseRatio: 68,
            teamScore: 1900,
            soloScore: 280,
            solde: 3,
            expirationDate: "2025-01-15"
          },
          {
            id: "demo6",
            username: "newbie.06",
            fullName: "Fresh Talent",
            globalScore: 0,
            gamesPlayed: 0,
            ranking: 999,
            cityRanking: 999,
            paymentStatus: "Nouveau joueur",
            isNewPlayer: true,
            goals: 0,
            assists: 0,
            teamWins: 0,
            jerseyNumber: 22,
            team: "Blue Sharks",
            attackRatio: 0,
            defenseRatio: 0,
            teamScore: 0,
            soloScore: 0
          }
        ];

        const demoRayoBattleMatch: Match = {
          id: "DEMO_RAYO_BATTLE",
          gameId: "RB001",
          city: "Casablanca",
          field: "Stade Mohammed V",
          date: dateStr,
          time: "19:00 (60min)",
          format: "Rayo Battle 4x5",
          status: "Besoin d'autres joueurs",
          players: demoPlayers,
          maxPlayers: 20,
          mode: "Rayo Battle",
          captain: "captain.01"
        };
        
        parsedMatches.unshift(demoRayoBattleMatch);
        console.log('✨ Added demo Rayo Battle match for preview');
        console.log('🎮 Demo players:', demoPlayers.map(p => ({ username: p.username, team: p.team })));
      }
      
      setMatches(parsedMatches);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Erreur lors du chargement des matchs:', err);
      setError('Impossible de charger les matchs à venir');
    } finally {
      setLoading(false);
    }
  };

  // Fonction de rafraîchissement silencieux (sans loading)
  const silentRefreshData = async () => {
    try {
      setIsRefreshing(true);
      
      // Ajouter plusieurs paramètres anti-cache pour forcer la récupération de données fraîches
      const timestamp = new Date().getTime();
      const random = Math.random().toString(36).substring(7);
      const urlWithCache = `${MATCHES_SHEET_CONFIG.csvUrl}&_t=${timestamp}&v=${random}&refresh=true`;
      
      const response = await fetch(urlWithCache, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const csvData = await response.text();
      const parsedMatches = parseMatchesCSV(csvData);
      
      // Ne pas mettre à jour si le modal est ouvert
      if (selectedMatch) {
        return;
      }
      
      // Comparer avec les données existantes avant de mettre à jour
      const hasChanges = JSON.stringify(parsedMatches) !== JSON.stringify(matches);
      
      if (hasChanges) {
        setMatches(parsedMatches);
        setLastUpdate(new Date());
        console.log('🔄 Données mises à jour silencieusement');
      }
      
    } catch (err) {
      console.error('Erreur lors du rafraîchissement silencieux:', err);
      // En cas d'erreur, on ne change pas l'état d'erreur pour éviter de perturber l'UI
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sync saved city preference with local state
  useEffect(() => {
    if (savedCity) {
      setSelectedCity(savedCity);
    }
  }, [savedCity]);

  // Show city selection modal for first-time visitors
  useEffect(() => {
    if (isFirstVisit && matches.length > 0) {
      setShowCityModal(true);
    }
  }, [isFirstVisit, matches.length]);

  // Charger les données au montage du composant
  useEffect(() => {
    loadMatchesData();
  }, []);

  // Configurer le rafraîchissement automatique toutes les 120 secondes
  useEffect(() => {
    // Commencer le rafraîchissement automatique seulement après le premier chargement
    if (!loading && matches.length > 0) {
      const interval = setInterval(silentRefreshData, 120000); // 120 secondes
      setRefreshInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [loading, matches.length]);

  // Nettoyer l'interval au démontage
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  // Obtenir la liste unique des villes
  const getUniqueCities = () => {
    const cities = matches.map(match => match.city);
    return ["All cities", ...Array.from(new Set(cities))];
  };

  // Filtrer et trier les matchs par ordre chronologique
  const filteredMatches = (selectedCity === "All cities" 
    ? matches 
    : matches.filter(match => match.city === selectedCity))
    .sort((a, b) => {
      // Convertir les dates et heures en objets Date pour comparaison
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

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

  // Composant Modal des détails du match
  const MatchDetailsModal = () => {
    if (!selectedMatch) return null;

    return (
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 border-none shadow-2xl rounded-2xl" aria-describedby="match-details-description">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-rayoblue to-blue-600 bg-clip-text text-transparent">
              Match {selectedMatch.gameId}
            </DialogTitle>
            <div id="match-details-description" className="text-sm text-gray-600 mt-2">
              Informations complètes du match incluant le terrain, les horaires et la composition des équipes
            </div>
          </DialogHeader>
          
          <div className="space-y-6 p-2">
            {/* Informations du match - Style carte moderne */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                      <FiMapPin className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Ville</div>
                      <div className="font-semibold text-gray-900">{selectedMatch.city}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                      <FiCalendar className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Date</div>
                      <div className="font-semibold text-gray-900">{formatDate(selectedMatch.date)}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                      <FiClock className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Horaire</div>
                      <div className="font-semibold text-gray-900">{selectedMatch.time}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                      <FiUsers className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Format</div>
                      <div className="font-semibold text-gray-900">{selectedMatch.format}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-white/50">
                <div className="flex items-center gap-2">
                  {getFieldIcon()}
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Terrain</div>
                    <div className="font-semibold text-gray-900">{selectedMatch.field}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Note importante - Style amélioré */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <p className="text-blue-800 text-sm leading-relaxed">
                  <strong>Note importante:</strong> Les joueurs abonnés et ceux qui ont joué plusieurs matchs n'ont pas besoin de confirmation, car ils connaissent déjà le concept Rayo Sport.
                </p>
              </div>
            </div>

            {/* Affichage des équipes si elles existent, sinon liste des joueurs */}
            {selectedMatch.teams ? (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-center">
                  Composition des équipes
                  {selectedMatch.status === "Complet" ? 
                    (selectedMatch.mode?.toLowerCase() === 'rayo battle' ? " (4 x 5 joueurs)" : " (3 x 5 joueurs)") : 
                    ` (${selectedMatch.players.length}/${selectedMatch.maxPlayers} joueurs)`}
                </h3>
                
                {/* Capitaine Rayo - sous le titre et avant les équipes */}
                {selectedMatch.captain && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg border-l-4 border-orange-400">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-8 bg-orange-700 rounded-full flex items-center justify-center shadow-lg gap-1">
                        <span className="text-orange-100 text-xs">📋</span>
                        <span className="text-orange-100 text-xs">👨‍⚖️</span>
                      </div>
                      <div className="text-center">
                        <div className="text-orange-100 text-xs font-semibold uppercase tracking-wide">Rayo Sport Capitaine</div>
                        <div className="text-white font-bold text-lg">{selectedMatch.captain}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {selectedMatch.teams.map((team, teamIndex) => (
                    <div key={team.name} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                      {/* En-tête de l'équipe avec gradient */}
                      <div className={`${team.color} bg-gradient-to-r text-white p-4 text-center relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                        <div className="relative z-10">
                          <h4 className="font-bold text-xl mb-1">Équipe {team.name}</h4>
                          <div className="text-sm opacity-90 font-medium flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1 sm:gap-2">
                            <span>{team.players.length} joueurs</span>
                            <span className="hidden sm:inline">•</span>
                            <span>Score Moyen: {
                              team.players.length > 0 ? (
                                team.players.reduce((sum, p) => {
                                  const player = selectedMatch.players.find(pl => pl.id === p.id);
                                  return sum + (player?.globalScore || 0);
                                }, 0) / team.players.length
                              ).toFixed(1) : '0.0'
                            }</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Score moyen de l'équipe */}
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                        <div className="text-center text-sm text-gray-700">
                          <span className="font-semibold">Équipe {team.name}</span> • Score moyen: 
                          <span className="font-bold text-blue-600 ml-1">
                            {team.players.length > 0 ? (
                              team.players.reduce((sum, p) => {
                                const player = selectedMatch.players.find(pl => pl.id === p.id);
                                return sum + (player?.globalScore || 0);
                              }, 0) / team.players.length
                            ).toFixed(1) : '0.0'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Liste des joueurs de l'équipe */}
                      <div className="p-4 space-y-3">
                        {team.players.map((player, playerIndex) => (
                          <div 
                            key={player.id}
                            className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 hover:from-blue-50 hover:to-indigo-50 hover:shadow-md transition-all duration-200 border border-gray-200 cursor-pointer hover:scale-[1.02]"
                            onClick={() => {
                              const fullPlayer = selectedMatch.players.find(p => p.id === player.id);
                              if (fullPlayer) handlePlayerClick(fullPlayer);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {/* Numéro de maillot avec style amélioré et étoile pour nouveaux joueurs */}
                                <div className={`w-10 h-10 ${team.color} text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg hover:scale-110 transition-transform duration-200 relative`}>
                                  {player.jerseyNumber}
                                  {selectedMatch.players.find(p => p.id === player.id)?.gamesPlayed === 0 && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                      <FiStar className="w-2 h-2 text-white" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Info joueur */}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 text-sm truncate">
                                    {player.fullName}
                                  </div>

                                  {/* Statistiques du joueur */}
                                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                                    {(() => {
                                      const playerData = selectedMatch.players.find(p => p.id === player.id);
                                      return playerData ? (
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                          <div>
                                            <div className="font-semibold text-blue-600">#{playerData.ranking}</div>
                                            <div className="text-xs">Rank</div>
                                          </div>
                                          <div>
                                            <div className="font-semibold text-green-600">{playerData.globalScore.toFixed(1)}</div>
                                            <div className="text-xs">Score</div>
                                          </div>
                                          <div>
                                            <div className="font-semibold text-purple-600">{playerData.gamesPlayed}</div>
                                            <div className="text-xs">Matchs</div>
                                          </div>
                                        </div>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Statut avec étoiles colorées pour subscribers, cercles pour autres */}
                              <div className="flex items-center gap-2">
                                {player.paymentStatus === "Subscription" ? (
                                  (() => {
                                    const balance = player.solde;
                                    const color = (typeof balance === 'number' && balance < 1) ? "text-red-500" :
                                                  (typeof balance === 'number' && balance === 1) ? "text-yellow-500" :
                                                  "text-green-500";
                                    // console.log(`🎨 RENDERING Star Color for ${player.username}: Balance=${balance}, Type=${typeof balance}, Color=${color}`);
                                    return <FiStar className={`w-4 h-4 fill-current ${color}`} />;
                                  })()
                                ) : (
                                  <div className={`w-4 h-4 rounded-full ${
                                    player.paymentStatus === "Payé" 
                                      ? "bg-green-500 shadow-green-500/50 shadow-lg" 
                                      : "bg-red-500 shadow-red-500/50 shadow-lg"
                                  }`}></div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                



              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Joueurs confirmés ({selectedMatch.players.length})
                </h3>
                
                {/* Capitaine Rayo - sous le titre et avant la liste des joueurs */}
                {selectedMatch.captain && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg border-l-4 border-orange-400">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-8 bg-orange-700 rounded-full flex items-center justify-center shadow-lg gap-1">
                        <span className="text-orange-100 text-xs">📋</span>
                        <span className="text-orange-100 text-xs">👨‍⚖️</span>
                      </div>
                      <div className="text-center">
                        <div className="text-orange-100 text-xs font-semibold uppercase tracking-wide">Rayo Sport Capitaine</div>
                        <div className="text-white font-bold text-lg">{selectedMatch.captain}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  {selectedMatch.players
                    .sort((a, b) => a.ranking - b.ranking)
                    .map((player) => (
                    <div 
                      key={player.id}
                      className="bg-white rounded-lg shadow-md p-3 border-l-4 border-l-blue-500 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                      onClick={() => handlePlayerClick(player)}
                    >
                      {/* En-tête compact - même format que leaderboard */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 relative"
                            style={{
                              background: `linear-gradient(135deg, 
                                ${player.isNewPlayer ? '#10b981, #059669' : '#3b82f6, #1d4ed8'})`
                            }}
                          >
                            <span className="font-bold text-white text-xs">
                              {player.username.charAt(0).toUpperCase()}
                            </span>
                            {player.isNewPlayer && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                <FiStar className="w-1.5 h-1.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-base text-gray-900">{player.username}</div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div className="text-lg font-bold text-blue-600">#{player.ranking}</div>
                          {/* Statut de paiement */}
                          {player.paymentStatus === "Subscription" ? (
                            (() => {
                              const color = (typeof player.solde === 'number' && player.solde < 1) ? "text-red-500" :
                                            (typeof player.solde === 'number' && player.solde === 1) ? "text-yellow-500" :
                                            "text-green-500";
                              console.log(`⭐ Star Color Card for ${player.username}: Balance=${player.solde}, Type=${typeof player.solde}, Color=${color}`);
                              return <FiStar className={`w-4 h-4 fill-current ${color}`} />;
                            })()
                          ) : (
                            <div className={`w-4 h-4 rounded-full ${
                              player.paymentStatus === "Payé" 
                                ? "bg-green-500 shadow-green-500/50 shadow-lg" 
                                : "bg-red-500 shadow-red-500/50 shadow-lg"
                            }`}></div>
                          )}
                        </div>
                      </div>

                      {/* Score et stats sur une ligne - même format que leaderboard */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-blue-600">{player.globalScore.toFixed(2)}</span>
                          <span className="text-gray-500">pts</span>
                        </div>
                        <div className="flex gap-3 text-xs">
                          <span className="text-gray-600">{player.gamesPlayed} matchs</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Composant modal WhatsApp
  const WhatsAppModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const whatsappGroups = [
      {
        city: "Casablanca",
        link: "https://chat.whatsapp.com/F7HJjxgjGi55qc7qJrHiNz",
        color: "from-blue-500 to-purple-600"
      },
      {
        city: "Rabat",
        link: "#",
        color: "from-green-500 to-blue-600"
      },
      {
        city: "Marrakech",
        link: "#",
        color: "from-red-500 to-pink-600"
      },
      {
        city: "Fès",
        link: "#",
        color: "from-orange-500 to-red-600"
      }
    ];

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto bg-gradient-to-br from-white to-gray-50 border-none shadow-2xl rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl md:text-2xl font-bold bg-gradient-to-r from-rayoblue to-blue-600 bg-clip-text text-transparent mb-2">
              Rejoindre un groupe WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 md:space-y-6 p-4 md:p-6">
            <p className="text-center text-gray-600 mb-8">
              Choisissez votre ville pour rejoindre le groupe WhatsApp
            </p>
            {whatsappGroups.map((group, index) => (
              <div key={index} className="relative bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 hover:border-green-400/30 group overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 opacity-10">
                  <div className={`w-full h-full bg-gradient-to-br ${group.color} rounded-full transform translate-x-4 md:translate-x-8 -translate-y-4 md:-translate-y-8`}></div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-3 md:gap-4 flex-1">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z"/>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-gray-900 text-base md:text-lg block truncate">{group.city}</span>
                      <div className="w-10 h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mt-1"></div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (group.link !== "#") {
                        trackEvent('whatsapp_join', 'user_engagement', group.city);
                        window.open(group.link, '_blank');
                      }
                    }}
                    disabled={group.link === "#"}
                    className={`px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto ${
                      group.link === "#" 
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                        : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-xl"
                    }`}
                  >
                    {group.link === "#" ? "Bientôt" : "Rejoindre"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rayoblue mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des matchs...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="upcoming-matches" className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <RevealAnimation>
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Matchs à venir
              </h2>
              {/* Indicateur de mise à jour moderne */}
              <div className="relative">
                <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  isRefreshing 
                    ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                    : 'bg-gray-300'
                }`}>
                  {isRefreshing && (
                    <div className="absolute inset-0 rounded-full bg-green-500 animate-ping"></div>
                  )}
                </div>
                {isRefreshing && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Mise à jour...
                  </div>
                )}
              </div>
            </div>
            <p className="text-lg text-gray-600">
              Découvrez les prochains matchs et rejoignez la compétition
            </p>
          </div>
        </RevealAnimation>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-center">{error}</p>
          </div>
        )}

        {/* Filtre par ville */}
        <RevealAnimation delay={0.2}>
          <div className="mb-8">
            {/* Desktop filter */}
            <div className="hidden md:flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-700 font-medium">Filtrer par ville:</span>
              </div>
              <select
                value={selectedCity}
                onChange={(e) => handleCitySelect(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              >
                {getUniqueCities().map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Mobile filter - Boutons horizontaux */}
            <div className="md:hidden">
              <div className="text-center mb-4">
                <span className="text-gray-700 font-medium text-sm">Filtrer par ville</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {getUniqueCities().map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCitySelect(city)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCity === city
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </RevealAnimation>

        <div className="space-y-6">
          {filteredMatches.map((match, index) => (
            <RevealAnimation key={match.id} delay={index * 0.1}>
              <div className="space-y-2">
                {/* Date en dehors de la carte */}
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {getDayLabel(match.date)}
                  </h3>
                  <div className="flex items-center gap-3">
                    <p className="text-gray-600 text-base font-medium">{formatDateWithoutYear(match.date)}</p>
                    <CountdownTimer date={match.date} time={match.time} />
                  </div>
                </div>
                
                <div 
                  className={`${
                    match.format.includes('Rayo Battle') 
                      ? 'bg-gradient-to-br from-yellow-600 via-yellow-700 to-amber-800 border-2 border-yellow-400 shadow-xl shadow-yellow-500/20' 
                      : 'bg-gradient-to-br from-gray-800 to-gray-900'
                  } rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer text-white relative ${getMatchCardBorderStyle(parseMatchDateTime(match.date, match.time))}`}
                  onClick={() => setSelectedMatch(match)}
                >
                  {/* Animated border overlay for today's matches */}
                  {getCountdownInfo(parseMatchDateTime(match.date, match.time)).isToday && (
                    <div className="absolute inset-0 rounded-xl border-4 border-red-500 animate-pulse pointer-events-none"></div>
                  )}
                    <div className="p-6">
                      {/* En haut : Heure et Terrain */}
                      <div className="flex justify-between items-start mb-4 gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                              {match.format.includes('Rayo Battle') && (
                                <span className="text-yellow-300 text-lg">👑</span>
                              )}
                              {match.time}
                              {(() => {
                                const matchDate = parseMatchDateTime(match.date, match.time);
                                const countdown = getCountdownInfo(matchDate);
                                const statusIndicator = getStatusIndicator(matchDate);
                                
                                // Only show circle if match is within 24 hours or is today/urgent
                                if (countdown.totalHours <= 24 || countdown.isToday || countdown.isPast) {
                                  return (
                                    <div className={`w-3 h-3 rounded-full ${statusIndicator.color} ${statusIndicator.animate ? 'animate-pulse' : ''}`}></div>
                                  );
                                }
                                return null;
                              })()}
                            </h3>

                          </div>
                          <p className="text-lg text-gray-300 truncate">
                            {match.field}
                          </p>
                        </div>
                        {(() => {
                          const matchDate = parseMatchDateTime(match.date, match.time);
                          const isPastMatch = getCountdownInfo(matchDate).isPast;
                          const isMatchFull = match.players.length >= match.maxPlayers;
                          
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isPastMatch) return; // Disable for past matches
                                
                                trackEvent('join_match_whatsapp', 'user_engagement', `Game_${match.gameId}`);
                                const message = isMatchFull 
                                  ? `Bonjour, je souhaite rejoindre la liste d'attente pour ce match:%0A%0AGame ${match.gameId}%0ADate: ${formatDate(match.date)}%0AHeure: ${match.time}%0AEndroit: ${match.field}, ${match.city}%0A%0AMerci!`
                                  : `Bonjour, je souhaite jouer ce match:%0A%0AGame ${match.gameId}%0ADate: ${formatDate(match.date)}%0AHeure: ${match.time}%0AEndroit: ${match.field}, ${match.city}%0A%0AMerci!`;
                                const whatsappUrl = `https://wa.me/212649076758?text=${message}`;
                                window.open(whatsappUrl, '_blank');
                              }}
                              disabled={isPastMatch}
                              className={`px-3 py-2 rounded-full text-white transition-all duration-300 font-semibold shadow-lg flex items-center gap-2 text-xs sm:text-sm flex-shrink-0 whitespace-nowrap ${
                                isPastMatch
                                  ? "bg-gray-500 cursor-not-allowed opacity-70"
                                  : isMatchFull
                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-xl transform hover:scale-105"
                                    : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:shadow-xl transform hover:scale-105"
                              }`}
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z"/>
                              </svg>
                              <span className="hidden sm:inline">
                                {isPastMatch ? "Match played" : isMatchFull ? "Rejoindre Waitlist" : "Rejoindre"}
                              </span>
                              <span className="sm:hidden">
                                {isPastMatch ? "Played" : isMatchFull ? "Waitlist" : "Rejoindre"}
                              </span>
                            </button>
                          );
                        })()}
                      </div>

                      {/* Milieu : Adresse, ville et capitaine */}
                      <div className="mb-6 pb-4 border-b border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiMapPin className="text-blue-400 w-4 h-4" />
                            <p className="text-white text-lg font-semibold">{match.city}</p>
                            {match.format.includes('Rayo Battle') && (
                              <span className="text-yellow-200 bg-yellow-900/30 px-2 py-1 rounded-full font-semibold text-sm">
                                🏆 {match.format}
                              </span>
                            )}
                            {match.mode?.toLowerCase() === 'rayo rush' && (
                              <span className="text-green-200 bg-green-900/30 px-2 py-1 rounded-full font-semibold text-sm">
                                💰 <span className="whitespace-pre-line">1er match ? 25DH{'\n'}💰 déjà joué ? 50DH</span>
                              </span>
                            )}
                          </div>
                          
                          {/* Capitaine - visible sur desktop */}
                          {match.captain && (
                            <div className="hidden sm:flex items-center gap-2">
                              <div className="w-7 h-5 bg-orange-600 rounded-full flex items-center justify-center">
                                <span className="text-orange-100" style={{fontSize: '10px'}}>👨‍⚖️</span>
                              </div>
                              <div>
                                <div className="text-orange-400 text-xs font-semibold">Rayo Capitaine</div>
                                <div className="text-white font-bold text-sm">{match.captain}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bas : Note moyenne + avatars à gauche, barre de progression à droite */}
                      <div className="flex justify-between items-end">
                        {/* Gauche : Note moyenne et avatars */}
                        <div>
                          <div className="mb-3">
                            <p className="text-gray-400 text-sm mb-1">Score moyen</p>
                            <p className="text-white text-2xl font-bold">
                              <AnimatedNumber 
                                value={match.players.length > 0 
                                  ? (match.players.reduce((sum, p) => sum + p.globalScore, 0) / match.players.length).toFixed(1)
                                  : "N/A"
                                }
                              />
                            </p>
                          </div>
                          
                          {/* Avatars des joueurs */}
                          <div className="flex -space-x-3">
                            {match.players.length > 0 ? (
                              <>
                                {match.players.slice(0, 5).map((player, idx) => (
                                  <div 
                                    key={player.id}
                                    className="relative w-7 h-7 rounded-full border-2 border-gray-700 shadow-lg overflow-hidden"
                                    style={{
                                      background: `linear-gradient(135deg, 
                                        ${player.isNewPlayer ? '#10b981, #059669' : '#3b82f6, #1d4ed8'})`
                                    }}
                                  >
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="text-white font-bold text-xs">
                                        {player.username.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    {player.isNewPlayer && (
                                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                        <FiStar className="w-1 h-1 text-white" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {match.players.length > 5 && (
                                  <div className="w-7 h-7 rounded-full border-2 border-gray-700 shadow-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">
                                      +<AnimatedNumber value={match.players.length - 5} />
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center">
                                  <FiUsers className="w-3 h-3 text-gray-400" />
                                </div>
                                <span className="text-gray-400 text-sm">Aucun joueur inscrit</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Droite : Barre de progression */}
                        <div className="text-right">
                          <p className="text-gray-400 text-sm mb-2">
                            {match.players.length >= match.maxPlayers ? "Complet" : "Joueurs inscrits"}
                          </p>
                          <p className="text-white text-xl font-bold mb-2">
                            <AnimatedNumber value={match.players.length} />/{match.maxPlayers}
                          </p>
                          
                          {/* Barre de progression avec container fixe */}
                          <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden shadow-inner relative">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ease-out shadow-sm`}
                              style={{ 
                                width: `${Math.max(6, Math.min((match.players.length / match.maxPlayers) * 100, 100))}%`,
                                background: (() => {
                                  if (match.players.length === 0) {
                                    return '#ef4444'; // Rouge si aucun joueur
                                  } else if (match.players.length >= match.maxPlayers) {
                                    return 'linear-gradient(to right, #10b981, #059669)'; // Vert quand complet
                                  } else if (match.players.length <= match.maxPlayers * 0.3) {
                                    return '#f59e0b'; // Orange si peu de joueurs (1-4 joueurs)
                                  } else if (match.players.length <= match.maxPlayers * 0.7) {
                                    return '#eab308'; // Jaune si moyennement rempli (5-10 joueurs)
                                  } else {
                                    return '#10b981'; // Vert si presque complet (11-14 joueurs)
                                  }
                                })()
                              }}
                            />
                            {match.players.length >= match.maxPlayers && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Section partage avec capitaine - mobile uniquement */}
                      <div className="mt-4 pt-4 border-t border-gray-600 sm:hidden">
                        <div className="flex justify-between items-center">
                          {/* Capitaine à gauche */}
                          {match.captain && (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-5 bg-orange-600 rounded-full flex items-center justify-center">
                                <span className="text-orange-100" style={{fontSize: '10px'}}>👨‍⚖️</span>
                              </div>
                              <div>
                                <div className="text-orange-400 text-xs font-semibold">Rayo Capitaine</div>
                                <div className="text-white font-bold text-sm">{match.captain}</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Bouton partage à droite */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const shareData = {
                                title: `Match Rayo Sport - Game ${match.gameId}`,
                                text: `Rejoins-moi pour ce match de foot !

🏟️ ${match.field}, ${match.city}
📅 ${formatDayName(match.date)} ${formatDateWithoutYear(match.date)}
⏰ ${match.time}
⚽ ${match.format}

Pour rejoindre : https://wa.me/212649076758`,
                                url: window.location.href
                              };

                              if (navigator.share) {
                                navigator.share(shareData).catch((err) => {
                                  console.log('Erreur de partage:', err);
                                });
                              } else {
                                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text)}`;
                                window.open(whatsappUrl, '_blank');
                              }
                              trackEvent('share_match', 'user_engagement', `Game_${match.gameId}`);
                            }}
                            className="flex items-center gap-2 text-blue-500 hover:text-blue-400 transition-all duration-300 transform hover:scale-105"
                          >
                            <svg 
                              className="w-4 h-4 transition-transform duration-300 -rotate-25 hover:rotate-0" 
                              fill="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                            <span className="text-sm font-medium">Invite un ami</span>
                          </button>
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            </RevealAnimation>
          ))}
        </div>

        {/* Compteur de résultats */}
        {!loading && filteredMatches.length > 0 && (
          <div className="text-center mb-4">
            <p className="text-gray-600 text-sm">
              {filteredMatches.length} match{filteredMatches.length > 1 ? 's' : ''} 
              {selectedCity !== "Toutes les villes" ? ` à ${selectedCity}` : ''}
            </p>
          </div>
        )}

        {filteredMatches.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {selectedCity === "Toutes les villes" 
                ? "Aucun match à venir pour le moment" 
                : `Aucun match à venir à ${selectedCity}`}
            </p>
            {selectedCity !== "Toutes les villes" && (
              <button 
                onClick={() => setSelectedCity("Toutes les villes")}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Voir tous les matchs
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal des détails */}
      <MatchDetailsModal />
      
      {/* Modal WhatsApp */}
      {showWhatsappModal && <WhatsAppModal isOpen={showWhatsappModal} onClose={() => setShowWhatsappModal(false)} />}
      
      {/* City Selection Modal */}
      <CitySelectionModal 
        isOpen={showCityModal}
        onCitySelect={handleCitySelect}
      />
      
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

export default UpcomingMatchesSection;