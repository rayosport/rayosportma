import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useCompanyContext } from "@/hooks/use-company-context";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FiCalendar, FiMapPin, FiClock, FiUsers, FiCheck, FiX, FiStar, FiRefreshCw, FiFilter, FiTrendingUp, FiTarget, FiAward, FiZap, FiShield, FiAlertTriangle, FiThumbsUp, FiThumbsDown } from "react-icons/fi";
import { ChevronDown } from "lucide-react";
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
  globalScore: number;      // Player score
  ranking: number;          // Player ranking
  gamesPlayed: number;      // Games played
  attackRatio?: number;     // Attack ratio
  defenseRatio?: number;    // Defense ratio
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
}

// Configuration Google Sheets par défaut
const DEFAULT_MATCHES_SHEET_CONFIG = {
  csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDgQfkyS5KdTwQABcUDgu673_fSDrwX0HNgGeZiZ5DbSK6UEmYIcUrWPGsAGN5yuL50M6I3rYIJInL/pub?gid=216631647&output=csv"
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

  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("All cities");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerCard, setShowPlayerCard] = useState(false);
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>(() => {
    // Get saved city from localStorage, default to Casablanca if first time
    const savedCity = localStorage.getItem('selectedCityFilter');
    return savedCity || 'Casablanca';
  });
  const [countdownTime, setCountdownTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
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

  // Filter matches by selected city
  const filteredMatches = matches.filter(match => match.city === selectedCityFilter);

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
      
      // Extract Price column
      let matchPrice = 0;
      const hasPrice = headers.includes('Price') || headers.includes('price');
      if (hasPrice) {
        const priceIndex = headers.findIndex(h => h.toLowerCase() === 'price');
        const priceValue = row[priceIndex]?.trim();
        if (priceValue && priceValue !== '#REF!' && priceValue !== '#N/A' && priceValue !== '#ERROR!' && priceValue !== '') {
          matchPrice = parseFloat(priceValue.toString().replace(',', '.').trim()) || 0;
        }
      }
      
      // Extract Level column
      let matchLevel = '';
      const hasLevel = headers.includes('Level') || headers.includes('level');
      if (hasLevel) {
        const levelIndex = headers.findIndex(h => h.toLowerCase() === 'level');
        const levelValue = row[levelIndex]?.trim();
        if (levelValue && levelValue !== '#REF!' && levelValue !== '#N/A' && levelValue !== '#ERROR!' && levelValue !== '') {
          matchLevel = levelValue;
        }
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
      
      // Look for Team1 column specifically
      const hasTeam1 = headers.includes('Team1');
      if (hasTeam1) {
        const teamIndex = headers.findIndex(h => h === 'Team1');
        teamLetter = row[teamIndex]?.trim() || '';
        // Ignorer les valeurs d'erreur Excel
        if (teamLetter === '#REF!' || teamLetter === '#N/A' || teamLetter === '#ERROR!') {
          teamLetter = '';
        }
      }
      
      // Look for Number column specifically
      const hasNumber = headers.includes('Number');
      if (hasNumber) {
        const numberIndex = headers.findIndex(h => h === 'Number');
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
        
        // Get PlayerPerTeam and Team columns to calculate max players
        const playerPerTeamIndex = headers.findIndex(h => h === 'PlayerPerTeam');
        const teamCountIndex = headers.findIndex(h => h === 'Team');
        
        let maxPlayers = 15;
        let gameFormat = '5vs5';
        let playersPerTeam = 5;
        let numberOfTeams = 2;
        
        // Get values from PlayerPerTeam and Team columns
        if (playerPerTeamIndex >= 0) {
          const playerPerTeamValue = row[playerPerTeamIndex]?.trim();
          if (playerPerTeamValue && playerPerTeamValue !== '#REF!' && playerPerTeamValue !== '#N/A' && playerPerTeamValue !== '#ERROR!') {
            playersPerTeam = parseInt(playerPerTeamValue) || 5;
          }
        }
        
        if (teamCountIndex >= 0) {
          const teamCountValue = row[teamCountIndex]?.trim();
          if (teamCountValue && teamCountValue !== '#REF!' && teamCountValue !== '#N/A' && teamCountValue !== '#ERROR!') {
            numberOfTeams = parseInt(teamCountValue) || 2;
          }
        }
        
        // Calculate max players: PlayerPerTeam * Team
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
          mode: gameMode.trim(),
          price: matchPrice,
          level: matchLevel
        };
        matchesMap.set(gameId, match);
      }
      
      // Ajouter le joueur seulement s'il existe
      if (playerUsername && playerUsername.trim()) {
        // Déterminer si c'est un nouveau joueur (0 matchs joués)
        const isNewPlayer = matchCount === 0;
        
        // Map team names from Team1 column
        let teamName: "Orange" | "Jaune" | "Blue" | "Yellow" | "Vert" | undefined;
        if (teamLetter) {
          switch (teamLetter.toLowerCase()) {
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

        // Parse subscriber balance from SubGamesLeft column
        let subGamesLeft = 0;
        const hasSubGamesLeft = headers.includes('SubGamesLeft');
        if (hasSubGamesLeft) {
          const subGamesLeftIndex = headers.findIndex(h => h === 'SubGamesLeft');
          const subGamesLeftValue = row[subGamesLeftIndex]?.trim();
          if (subGamesLeftValue && subGamesLeftValue !== '#REF!' && subGamesLeftValue !== '#N/A' && subGamesLeftValue !== '#ERROR!') {
            subGamesLeft = parseInt(subGamesLeftValue) || 0;
          }
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
          attackRatio: (() => {
            const attIndex = headers.findIndex(h => h === 'N');
            return attIndex >= 0 ? parseDecimal(row[attIndex]) : parseDecimal(row[13]);
          })(),    // Column N
          defenseRatio: (() => {
            const defIndex = headers.findIndex(h => h === 'O');
            return defIndex >= 0 ? parseDecimal(row[defIndex]) : parseDecimal(row[14]);
          })(),   // Column O  
          teamScore: parseDecimal(row[15]),      // Team Score column
          soloScore: parseDecimal(row[16]),      // Solo Score column
          solde: subGamesLeft,          // SubGamesLeft column (dynamic index)
          expirationDate: expirationDate // ExpirationDate column (dynamic index)
        };
        
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
            defenseRatio: player.defenseRatio
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
        players: players
      }));
    });
    
    return Array.from(matchesMap.values());
  };

  // Fonction pour charger les données depuis Google Sheets avec fallback vers fichier statique
  const loadMatchesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Essayer d'abord Google Sheets
      const timestamp = new Date().getTime();
      const random = Math.random().toString(36).substring(7);
      const csvUrl = customDataSources?.upcomingMatches || DEFAULT_MATCHES_SHEET_CONFIG.csvUrl;
      const urlWithCache = `${csvUrl}&_t=${timestamp}&v=${random}&refresh=true`;
      
      const response = await fetch(urlWithCache, {
        cache: 'no-store',
        redirect: 'follow',
        headers: {
          'Accept': 'text/csv,text/plain,*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const csvData = await response.text();
      
      // Vérifier si la réponse est bien du CSV (pas une page d'erreur HTML)
      if (csvData.includes('<!DOCTYPE html>') || csvData.includes('Page introuvable') || csvData.includes('<TITLE>Temporary Redirect</TITLE>')) {
        throw new Error('Google Sheets a retourné une page d\'erreur HTML au lieu des données CSV');
      }
      
      const parsedMatches = parseMatchesCSV(csvData);
      setMatches(parsedMatches);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.warn('Échec du chargement depuis Google Sheets, essai avec le fichier statique:', err);
      
      // Fallback vers le fichier CSV statique
      try {
        const staticResponse = await fetch('/staticfolder/WebsiteGame.csv', {
          cache: 'no-store'
        });
        
        if (!staticResponse.ok) {
          throw new Error(`Erreur HTTP fichier statique: ${staticResponse.status}`);
        }
        
        const staticCsvData = await staticResponse.text();
        const parsedMatches = parseMatchesCSV(staticCsvData);
        
        setMatches(parsedMatches);
        setLastUpdate(new Date());
        setError('static-fallback'); // Use a special code instead of text message
        
      } catch (staticErr) {
        console.error('Échec du chargement depuis le fichier statique:', staticErr);
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
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const sheetUrl = encodeURIComponent("https://docs.google.com/spreadsheets/d/e/2PACX-1vSDgQfkyS5KdTwQABcUDgu673_fSDrwX0HNgGeZiZ5DbSK6UEmYIcUrWPGsAGN5yuL50M6I3rYIJInL/pub?gid=601870692&output=csv");
      console.log('Fetching from URL:', proxyUrl + sheetUrl);
      const response = await fetch(proxyUrl + sheetUrl);

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
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-5xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-none shadow-2xl rounded-xl sm:rounded-2xl scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500 scrollbar-thumb-rounded-full scrollbar-track-rounded-full [&>button]:text-white [&>button]:hover:text-gray-300 [&>button]:hover:bg-gray-700/50">
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
                
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 text-xs">Score</span>
                  <div className="text-sm text-gray-300 font-medium">
                    {selectedMatch.players.length > 0 
                      ? (selectedMatch.players.reduce((sum, p) => sum + p.globalScore, 0) / selectedMatch.players.length).toFixed(1)
                      : '0.0'
                    }
                  </div>
                </div>
              </div>
              
              {hasTeams ? (
                /* Team-based Layout */
                <div className={`grid gap-2 ${
                  teams.length === 1 
                    ? 'grid-cols-1' 
                    : teams.length === 2 
                    ? 'grid-cols-1 sm:grid-cols-2' 
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                }`}>
                  {teams.map((team, teamIndex) => (
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
                        <div className="flex items-center gap-1.5 text-white font-bold text-xs flex-shrink-0">
                          <span className="text-gray-400 text-xs whitespace-nowrap">Score moyen:</span>
                          <span className="whitespace-nowrap">{(team.players.reduce((sum, p) => sum + p.globalScore, 0) / team.players.length).toFixed(1)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-0.5 p-1">
                        {team.players
                          .sort((a, b) => {
                            const jerseyA = a.jerseyNumber ?? 999;
                            const jerseyB = b.jerseyNumber ?? 999;
                            return jerseyA - jerseyB;
                          })
                          .map((player, playerIndex) => (
                          <div 
                            key={playerIndex}
                            className="flex items-center justify-between p-1.5 bg-gray-700 rounded hover:bg-gray-600 transition-colors cursor-pointer"
                            onClick={() => {
                              // Convert TeamPlayer to Player for the click handler
                              const fullPlayer = selectedMatch.players.find(p => p.id === player.id);
                              if (fullPlayer) handlePlayerClick(fullPlayer);
                            }}
                          >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div 
                            className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: team.color }}
                          >
                            {player.jerseyNumber || playerIndex + 1}
                          </div>
                          <div className="text-white font-medium text-xs min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="whitespace-nowrap">{player.username}</span>
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                player.paymentStatus === "Payé" ? "bg-green-400" : "bg-red-400"
                              }`}></div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs whitespace-nowrap">#{player.ranking} ({player.gamesPlayed}M)</span>
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center gap-0.5">
                                  <FiThumbsUp className="w-2 h-2 text-green-400 flex-shrink-0" />
                                  <span className="text-green-400 text-xs whitespace-nowrap">{getPlayerStats(player.username).likes}</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <FiThumbsDown className="w-2 h-2 text-red-400 flex-shrink-0" />
                                  <span className="text-red-400 text-xs whitespace-nowrap">{getPlayerStats(player.username).dislikes}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400 text-xs whitespace-nowrap">Score:</span>
                              <div className="text-white font-bold text-xs whitespace-nowrap">{player.globalScore.toFixed(1)}</div>
                            </div>
                            <div className="flex gap-1.5">
                              <div className="text-yellow-500 text-xs whitespace-nowrap">
                                ATT:{Math.round((player.attackRatio || 0) > 100 ? (player.attackRatio || 0) / 100 : (player.attackRatio || 0))}%
                              </div>
                              <div className="text-green-400 text-xs whitespace-nowrap">
                                DEF:{Math.round((player.defenseRatio || 0) > 100 ? (player.defenseRatio || 0) / 100 : (player.defenseRatio || 0))}%
                              </div>
                            </div>
                          </div>
                        </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Compact Stacked Player List */
                <div className="space-y-0.5">
                  {selectedMatch.players
                    .sort((a, b) => a.ranking - b.ranking)
                    .map((player) => (
                    <div 
                      key={player.id}
                      className="flex items-center justify-between p-1.5 bg-gray-800/50 rounded-md border border-gray-700/30 hover:border-blue-400/50 hover:bg-gray-700/50 transition-all cursor-pointer group"
                      onClick={() => handlePlayerClick(player)}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div 
                          className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold relative shadow-sm flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, 
                              ${player.isNewPlayer ? '#10b981, #059669' : '#3b82f6, #1d4ed8'})`
                          }}
                        >
                          {player.username.charAt(0).toUpperCase()}
                          {player.isNewPlayer && (
                            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full flex items-center justify-center">
                              <FiStar className="w-1 h-1 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <div className="font-medium text-white group-hover:text-blue-300 transition-colors text-xs whitespace-nowrap">{player.username}</div>
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
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 whitespace-nowrap">#{player.ranking} • {player.gamesPlayed}M</span>
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-0.5">
                                <FiThumbsUp className="w-2 h-2 text-green-400 flex-shrink-0" />
                                <span className="text-green-400 text-xs whitespace-nowrap">{getPlayerStats(player.username).likes}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <FiThumbsDown className="w-2 h-2 text-red-400 flex-shrink-0" />
                                <span className="text-red-400 text-xs whitespace-nowrap">{getPlayerStats(player.username).dislikes}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-xs whitespace-nowrap">ATT:</span>
                          <span className="text-white text-xs font-medium whitespace-nowrap">{player.attackRatio ? Math.round(player.attackRatio > 100 ? player.attackRatio / 100 : player.attackRatio) + '%' : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-xs whitespace-nowrap">DEF:</span>
                          <span className="text-white text-xs font-medium whitespace-nowrap">{player.defenseRatio ? Math.round(player.defenseRatio > 100 ? player.defenseRatio / 100 : player.defenseRatio) + '%' : 'N/A'}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-gray-400 text-xs whitespace-nowrap">Score:</span>
                            <div className="text-xs font-bold text-yellow-400 whitespace-nowrap">{player.globalScore.toFixed(1)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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


        {/* Ultra Compact Stacked Filter Bar */}
        {matches.length > 0 && (
          <div className="flex justify-center mb-2">
            {/* Ultra Modern Compact Filter - Responsive */}
            <div className="relative w-full md:w-auto">
              {/* Filter Box */}
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl md:rounded-2xl p-0.5 md:p-1 shadow-lg">
                <div className="bg-white rounded-lg md:rounded-xl px-2 md:px-4 py-1.5 md:py-2 flex items-center gap-2 md:gap-3 w-full md:min-w-[200px]">
                  {/* Filter Icon */}
                  <div className="w-4 h-4 md:w-5 md:h-5 bg-gradient-to-br from-pink-500 to-pink-600 rounded-md md:rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiTarget className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                  </div>
                  
                  {/* Filter Label */}
                  <span className="text-gray-700 font-semibold text-xs md:text-sm truncate">{getCityDisplayName(selectedCityFilter)}</span>
                  
                  {/* Dropdown Arrow */}
                  <div className="ml-auto">
                    <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                  </div>
                  
                  {/* Dropdown Select */}
                  <select
                    value={selectedCityFilter}
                    onChange={(e) => {
                      setSelectedCityFilter(e.target.value);
                      localStorage.setItem('selectedCityFilter', e.target.value);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none'
                    }}
                  >
                    {getUniqueCities(matches).map((city) => (
                      <option 
                        key={city} 
                        value={city}
                        className="bg-pink-800 text-white hover:bg-gradient-to-r hover:from-pink-600 hover:to-pink-700 hover:text-white focus:bg-gradient-to-r focus:from-pink-600 focus:to-pink-700 focus:text-white"
                        style={{
                          backgroundColor: '#9d174d',
                          color: '#ffffff',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}
                      >
                        {getCityDisplayName(city)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
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
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚽</div>
            <h3 className="text-2xl font-semibold text-gray-600 mb-2">
              Aucun match prévu
            </h3>
            <p className="text-gray-500">
              Revenez bientôt pour découvrir les prochains matchs !
            </p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {selectedCityFilter === 'all' 
                ? 'Aucun match prévu' 
                : `Aucun match prévu à ${selectedCityFilter}`
              }
            </h3>
            <p className="text-gray-500">
              {selectedCityFilter === 'all' 
                ? 'Revenez bientôt pour découvrir les prochains matchs !'
                : `Essayez de sélectionner une autre ville ou "Toutes les villes".`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map((match, index) => {
              const isNewDay = index === 0 || 
                new Date(filteredMatches[index - 1].date).toDateString() !== new Date(match.date).toDateString();
              
              return (
                <RevealAnimation key={match.id} delay={index * 0.1}>
                  <div className={`${isNewDay && index > 0 ? 'mt-6' : ''}`}>
                    {/* Date header - minimal and clean */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xs">
                            {new Date(match.date).getDate()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800">
                            {getDayLabel(match.date)}
                          </h3>
                          <p className="text-gray-500 text-xs" style={{fontSize: '10px'}}>{formatDateWithoutYear(match.date)}</p>
                        </div>
                      </div>
                      <div className="flex-1">
                        <CountdownTimer date={match.date} time={match.time} />
                      </div>
                    </div>
                  
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
                    } rounded-2xl hover:shadow-xl transition-all duration-300 cursor-pointer text-white relative overflow-hidden ${getMatchCardBorderStyle(parseMatchDateTime(match.date, match.time))}`}
                    onClick={() => setSelectedMatch(match)}
                  >
                    {/* Animated border overlay for matches within 2 days */}
                    {(() => {
                      const matchDate = parseMatchDateTime(match.date, match.time);
                      const countdown = getCountdownInfo(matchDate);
                      const isWithin2Days = countdown.totalHours <= 48;
                      const hasAvailableSpots = match.players.length < match.maxPlayers;
                      
                      if (isWithin2Days && !countdown.isPast) {
                        const borderColor = hasAvailableSpots ? 'border-green-400' : 'border-orange-600';
                        return (
                          <div className={`absolute inset-0 rounded-2xl border-2 ${borderColor} animate-pulse pointer-events-none`}></div>
                        );
                      }
                      return null;
                    })()}
                    
                    {/* Top section with time, location, and join button */}
                    <div className="p-3 pb-2">
                      <div className="flex items-start justify-between mb-2">
                        {/* Left: Time and location */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                              {match.format.includes('Rayo Battle') && (
                                <span className="text-yellow-200 text-sm">👑</span>
                              )}
                              {match.time}
                              {(() => {
                                const matchDate = parseMatchDateTime(match.date, match.time);
                                const countdown = getCountdownInfo(matchDate);
                                const statusIndicator = getStatusIndicator(matchDate, match);
                                
                                // Show dot for all upcoming matches (not past)
                                if (!countdown.isPast) {
                                  return (
                                    <div className={`w-2 h-2 rounded-full ${statusIndicator.color} ${statusIndicator.animate ? 'animate-pulse' : ''}`}></div>
                                  );
                                }
                                return null;
                              })()}
                            </h3>
                            {match.level && (() => {
                              const levelLower = match.level.toLowerCase();
                              const isPro = levelLower.includes('pro') || levelLower.includes('professionnel');
                              const isStreet = levelLower.includes('street');
                              
                              if (isPro) {
                                // PRO - Elite tier with premium effects
                                return (
                                  <span className="relative inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-black rounded-md uppercase tracking-widest overflow-hidden" style={{ 
                                    background: 'linear-gradient(135deg, #A4193D 0%, #8B1538 50%, #A4193D 100%)',
                                    color: '#FFDFB9',
                                    border: '1.5px solid #FFDFB9',
                                    boxShadow: '0 0 12px rgba(164, 25, 61, 0.7), 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.25), inset 0 -1px 1px rgba(0, 0, 0, 0.15)'
                                  }}>
                                    {/* Animated shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
                                    {/* Corner accent */}
                                    <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-white/40"></div>
                                    <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-white/40"></div>
                                    
                                    <FiStar className="w-2.5 h-2.5 relative z-10" style={{ fill: '#FFDFB9', color: '#FFDFB9', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }} />
                                    <span className="relative z-10 drop-shadow-[0_1px_3px_rgba(0,0,0,1)] leading-none text-[8px]" style={{ textShadow: '0 0 4px rgba(255, 223, 185, 0.4)' }}>{match.level}</span>
                                    
                                    {/* Inner glow */}
                                    <div className="absolute inset-[1px] rounded bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                                  </span>
                                );
                              } else if (isStreet) {
                                // STREET - Professional urban tier
                                return (
                                  <span className="relative inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-extrabold rounded-md uppercase tracking-wide overflow-hidden" style={{ 
                                    background: 'linear-gradient(135deg, #2D2926 0%, #1F1C1A 50%, #2D2926 100%)',
                                    color: '#FCF6F5',
                                    border: '1.5px solid #FCF6F5',
                                    boxShadow: '0 0 10px rgba(45, 41, 38, 0.6), 0 2px 6px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15), inset 0 -1px 1px rgba(0, 0, 0, 0.25)'
                                  }}>
                                    {/* Subtle shine */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
                                    
                                    {/* Indicator dot with glow */}
                                    <div className="relative z-10">
                                      <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_4px_currentColor]"></div>
                                    </div>
                                    <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] leading-tight text-[8px]">{match.level}</span>
                                  </span>
                                );
                              } else {
                                // AMATEUR - Clean entry level
                                return (
                                  <span className="relative inline-flex items-center px-1.5 py-0.5 text-[8px] font-bold rounded-full uppercase tracking-wide overflow-hidden" style={{ 
                                    background: 'linear-gradient(135deg, #0A174E 0%, #070F38 50%, #0A174E 100%)',
                                    color: '#F5D042',
                                    border: '1px solid #F5D042',
                                    boxShadow: '0 0 8px rgba(245, 208, 66, 0.4), 0 1px 4px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                                  }}>
                                    <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-tight text-[8px]">{match.level}</span>
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-full"></div>
                                  </span>
                                );
                              }
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
                          className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
                            (() => {
                              const matchDate = parseMatchDateTime(match.date, match.time);
                              const isPastMatch = getCountdownInfo(matchDate).isPast;
                              const isMatchFull = match.players.length >= match.maxPlayers;
                              
                              if (isPastMatch) {
                                return "bg-gray-500 cursor-not-allowed opacity-50";
                              } else if (isMatchFull) {
                                return "bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg transform hover:scale-105";
                              } else {
                                return "bg-green-700 hover:bg-green-800 text-white shadow-md hover:shadow-lg transform hover:scale-105";
                              }
                            })()
                          }`}
                          disabled={(() => {
                            const matchDate = parseMatchDateTime(match.date, match.time);
                            return getCountdownInfo(matchDate).isPast;
                          })()}
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z"/>
                          </svg>
                          <span>
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
                      
                      {/* Court name, city, and price */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-300 min-w-0 flex-1">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <FiMapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="font-medium truncate">{match.field}, {getCityDisplayName(match.city)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Create Google Maps search URL
                                const searchQuery = encodeURIComponent(`${match.field}, ${getCityDisplayName(match.city)}`);
                                const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
                                window.open(googleMapsUrl, '_blank');
                                trackEvent('view_location', 'user_engagement', `Game_${match.gameId}`);
                              }}
                              className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 rounded-md text-xs font-medium transition-all duration-200 hover:scale-105 flex-shrink-0 ml-1"
                              title="Voir sur Google Maps"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                              <span className="hidden sm:inline">Maps</span>
                            </button>
                          </div>
                        </div>
                        
                        {/* Price */}
                        <div className="text-sm font-semibold text-white">
                          {match.price && match.price > 0 ? `💰 ${match.price}DH` : (
                            (() => {
                              if (match.mode?.toLowerCase().includes('rayo-classic-8vs8') || match.format?.toLowerCase().includes('rayo classic 8vs8')) {
                                return "💰 70DH";
                              } else if (match.mode?.toLowerCase().includes('rayo-classic-7vs7') || match.format?.toLowerCase().includes('rayo classic 7vs7')) {
                                return "💰 60DH";
                              } else if (match.mode?.toLowerCase().includes('rayo-classic-5') || match.format?.toLowerCase().includes('rayo classic 5')) {
                                return "💰 60DH";
                              } else if (match.mode?.toLowerCase().includes('rayo rush5') || match.mode?.toLowerCase().includes('rayo rush6')) {
                                return "💰 40DH";
                              } else if (match.format.includes('Rayo Battle')) {
                                return "💰 50DH";
                              } else {
                                return "💰 50DH";
                              }
                            })()
                          )}
                        </div>
                      </div>
                      
                      {/* Game mode */}
                      <div className="mb-2">
                        <div className="text-xs text-gray-400 font-medium">
                          {(() => {
                            if (match.format.includes('Rayo Battle')) {
                              return "🏆 Rayo Battle - 4 équipes de 5 joueurs";
                            } else if (match.mode?.toLowerCase().includes('rayo-classic-8vs8') || match.format?.toLowerCase().includes('rayo classic 8vs8')) {
                              return "⚽ Rayo Classic 8vs8 - 2 équipes de 8 joueurs";
                            } else if (match.mode?.toLowerCase().includes('rayo-classic-7vs7') || match.format?.toLowerCase().includes('rayo classic 7vs7')) {
                              return "⚽ Rayo Classic 7vs7 - 2 équipes de 7 joueurs";
                            } else if (match.mode?.toLowerCase().includes('rayo-classic-5') || match.format?.toLowerCase().includes('rayo classic 5')) {
                              return "⚽ Rayo Classic 5vs5 - 2 équipes de 5 joueurs";
                            } else if (match.mode?.toLowerCase().includes('rayo rush5')) {
                              return "⚡ Rayo Rush 3x5 - 3 équipes de 5 joueurs";
                            } else if (match.mode?.toLowerCase().includes('rayo rush6')) {
                              return "⚡ Rayo Rush 3x6 - 3 équipes de 6 joueurs";
                            } else {
                              return "⚽ Match 5vs5 - 3 équipes de 5 joueurs";
                            }
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Bottom section with players and progress */}
                    <div className="px-3 pb-3">
                      <div className="flex items-center justify-between">
                        {/* Left: Player avatars and count */}
                        <div className="flex items-center gap-2">
                          {/* Player avatars */}
                          <div className="flex -space-x-2">
                            {match.players.length > 0 ? (
                              <>
                                {match.players.slice(0, 4).map((player, idx) => (
                                  <div 
                                    key={player.id}
                                    className="relative w-5 h-5 rounded-full border-2 border-white shadow-lg overflow-hidden"
                                    style={{
                                      background: `linear-gradient(135deg, 
                                        ${player.isNewPlayer ? '#10b981, #059669' : '#3b82f6, #1d4ed8'})`
                                    }}
                                  >
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="text-white font-bold text-xs" style={{fontSize: '10px'}}>
                                        {player.username.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    {player.isNewPlayer && (
                                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                        <FiStar className="w-1 h-1 text-white" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {match.players.length > 4 && (
                                  <div className="w-5 h-5 rounded-full border-2 border-white shadow-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                                    <span className="text-white font-bold text-xs" style={{fontSize: '10px'}}>
                                      +{match.players.length - 4}
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center">
                                <FiUsers className="w-2.5 h-2.5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Player count and average score */}
                          <div className="text-xs">
                            <div className="text-white font-semibold">
                              <AnimatedNumber value={match.players.length} />/{match.maxPlayers}
                            </div>
                            <div className="text-gray-400 text-xs" style={{fontSize: '10px'}}>
                              {match.players.length > 0 
                                ? `Score: ${(match.players.reduce((sum, p) => sum + p.globalScore, 0) / match.players.length).toFixed(1)}`
                                : "Aucun joueur"
                              }
                            </div>
                          </div>
                        </div>

                        {/* Right: Progress bar */}
                        <div className="flex items-center gap-1.5">
                          <div className="text-right text-xs text-gray-400" style={{fontSize: '10px'}}>
                            {match.players.length >= match.maxPlayers ? "Complet" : "Disponible"}
                          </div>
                          <div className="w-10 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500 ease-out"
                              style={{ 
                                width: `${Math.max(8, Math.min((match.players.length / match.maxPlayers) * 100, 100))}%`,
                                background: (() => {
                                  if (match.players.length >= match.maxPlayers) {
                                    return 'linear-gradient(to right, #f97316, #ea580c)'; // Orange gradient for "Complet"
                                  } else {
                                    return 'linear-gradient(to right, #10b981, #059669)'; // Green gradient for "Disponible"
                                  }
                                })()
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </RevealAnimation>
              );
            })}
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

