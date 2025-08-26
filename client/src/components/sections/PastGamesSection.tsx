import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FiCalendar, FiMapPin, FiClock, FiUsers, FiStar, FiRefreshCw, FiBarChart2, FiTarget, FiAward, FiSearch, FiChevronDown, FiAlertTriangle } from "react-icons/fi";
import { TbBuildingStadium } from "react-icons/tb";
import { trackEvent } from "@/lib/analytics";
// Configuration for Past Games Google Sheets
const PAST_GAMES_SHEET_CONFIG = {
  csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDgQfkyS5KdTwQABcUDgu673_fSDrwX0HNgGeZiZ5DbSK6UEmYIcUrWPGsAGN5yuL50M6I3rYIJInL/pub?gid=876296498&single=true&output=csv"
};

// Types for past games data
interface PastGamePlayer {
  id: string;
  gameId: string;
  date: string;
  status: string;
  mode: string;
  playerUsername: string;
  team: string;
  number: string;
  tScore: string;
  tMatch: string;
  tgoals: string;
  soloScore: string;
  tTeamScore: string;
  att: string;
  def: string;
  attackRatio?: string;
  defenseRatio?: string;
  rank: string;
  goal: string;
  assist: string;
  hattrick: string;
  matchTotalScore: string;
  mvp: string;
  scoreManuel: string;
  // Additional stats from CSV
  ownGoal?: string;
  teamScore?: string;
  teamWin?: string;
  teamLoss?: string;
  teamCleanSheet?: string;
  teamMiniGame?: string;
  teamGoals?: string;
  teamGC?: string;
}

interface PastGame {
  gameId: string;
  date: string;
  mode: string;
  players: PastGamePlayer[];
  teams: {
    [teamName: string]: {
      players: PastGamePlayer[];
      totalGoals: number;
      totalPlayers: number;
    };
  };
  totalGoals: number;
  totalPlayers: number;
  mvpPlayer?: PastGamePlayer;
  topScorer?: PastGamePlayer;
}

// Helper function to get day name in French
const getDayNameInFrench = (dateString: string) => {
  try {
    // Handle date format like "18/07/2025 19:30" or just "18/07/2025"
    let datePart: string;
    
    if (dateString.includes(' ')) {
      [datePart] = dateString.split(' ');
    } else {
      datePart = dateString;
    }
    
    // Parse MM/DD/YYYY format (from Google Sheets CSV)
    const parts = datePart.split('/');
    if (parts.length !== 3) {
      return '';
    }
    
    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);  
    const year = parseInt(parts[2]);
    
    // Create date object properly - month is 0-indexed in JS
    const date = new Date(year, month - 1, day);
    
    const weekdays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
    return weekdays[date.getDay()];
  } catch (error) {
    console.error('Error parsing date:', error);
    return '';
  }
};

// Parse CSV data for past games
const parsePastGamesCSV = (csvData: string): PastGame[] => {
  const lines = csvData.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    console.warn('⚠️ PastGamesSection: Not enough lines in CSV');
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
  const players: PastGamePlayer[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parse CSV handling quoted values
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
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



    // Map CSV columns to player data
    // Headers: ["ID","Date&Time","Status","MODE","Game ID","PlayerUsername","Team","Number","Score Manuel","TScore","TMatch","Tgoals","SoloScore","tTeamScore","ATT","DEF","Rank","Goal","Assist","Hattrick","OwnGoal","Match Total Score","IndividualScore","TeamScore","MVP","TeamWin","TeamLoss","TeamCleanSheet","TeamMiniGame","TeamGoals","TeamGC"]
    const player: PastGamePlayer = {
      id: row[0] || '',                    // ID
      date: row[1] || '',                  // Date&Time
      status: row[2] || '',                // Status
      mode: row[3] || '',                  // MODE
      gameId: row[4] || '',                // Game ID
      playerUsername: row[5] || '',        // PlayerUsername
      team: row[6] || '',                  // Team
      number: row[7] || '',                // Number
      scoreManuel: row[8] || '',           // Score Manuel
      tScore: row[9] || '',                // TScore
      tMatch: row[10] || '',               // TMatch
      tgoals: row[11] || '',               // Tgoals
      soloScore: row[12] || '',            // SoloScore
      tTeamScore: row[13] || '',           // tTeamScore
      att: row[14] || '',                  // ATT
      def: row[15] || '',                  // DEF
      rank: row[16] || '',                 // Rank
      goal: row[17] || '',                 // Goal
      assist: row[18] || '',               // Assist
      hattrick: row[19] || '',             // Hattrick
      ownGoal: row[20] || '',              // OwnGoal
      matchTotalScore: row[21] || '',      // Match Total Score
      teamScore: row[23] || '',            // TeamScore
      mvp: row[24] || '',                  // MVP
      teamWin: row[25] || '',              // TeamWin
      teamLoss: row[26] || '',             // TeamLoss
      teamCleanSheet: row[27] || '',       // TeamCleanSheet
      teamMiniGame: row[28] || '',         // TeamMiniGame
      teamGoals: row[29] || '',            // TeamGoals
      teamGC: row[30] || ''                // TeamGC
    };

    if (player.gameId && player.playerUsername) {
      players.push(player);
    }
  }

  // Group players by game ID and date
  const gamesMap = new Map<string, PastGame>();

  players.forEach(player => {
    const gameKey = `${player.gameId}_${player.date}`;
    
    if (!gamesMap.has(gameKey)) {
      gamesMap.set(gameKey, {
        gameId: player.gameId,
        date: player.date,
        mode: player.mode,
        players: [],
        teams: {},
        totalGoals: 0,
        totalPlayers: 0
      });
    }

    const game = gamesMap.get(gameKey)!;
    game.players.push(player);

    // Group by team
    const teamName = player.team || 'Unknown';
    if (!game.teams[teamName]) {
      game.teams[teamName] = {
        players: [],
        totalGoals: 0,
        totalPlayers: 0
      };
    }
    
    game.teams[teamName].players.push(player);
    game.teams[teamName].totalPlayers++;
    
    const goals = parseInt(player.goal || '0') || 0;
    game.teams[teamName].totalGoals += goals;
    game.totalGoals += goals;
    game.totalPlayers++;

    // Track MVP and top scorer
    if (player.mvp === '1') {
      game.mvpPlayer = player;
    }
    
    if (!game.topScorer || goals > parseInt(game.topScorer.goal || '0')) {
      game.topScorer = player;
    }
  });

  const result = Array.from(gamesMap.values()).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return result;
};

// Load past games data from Google Sheets with static file fallback
const loadPastGamesData = async (): Promise<{ data: PastGame[], usedFallback: boolean }> => {
  try {
    // First, try to load from Google Sheets
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(7);
    const urlWithCache = `${PAST_GAMES_SHEET_CONFIG.csvUrl}&_t=${timestamp}&v=${random}&refresh=true`;
    
          const response = await fetch(urlWithCache, {
        cache: 'no-store',
        redirect: 'follow'
      });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvData = await response.text();
    
    // Check if the response is actually CSV data (not HTML error page)
    if (csvData.includes('<!DOCTYPE html>') || csvData.includes('Page introuvable') || csvData.includes('<TITLE>Temporary Redirect</TITLE>')) {
      throw new Error('Google Sheets returned HTML error page instead of CSV data');
    }
    
    const data = parsePastGamesCSV(csvData);
    return { data, usedFallback: false };
  } catch (error) {
    console.warn('Failed to load from Google Sheets, trying static file:', error);
    
    // Fallback to static CSV file
    try {
      const staticResponse = await fetch('/staticfolder/pastGames.csv', {
        cache: 'no-store'
      });
      
      if (!staticResponse.ok) {
        throw new Error(`Static file HTTP error! status: ${staticResponse.status}`);
      }
      
      const staticCsvData = await staticResponse.text();
      const data = parsePastGamesCSV(staticCsvData);
      return { data, usedFallback: true };
    } catch (staticError) {
      console.error('Failed to load from static file:', staticError);
      throw new Error('Impossible de charger les données des matchs passés depuis Google Sheets et le fichier statique');
    }
  }
};

// Team color mapping
const getTeamColor = (teamName: string): { bg: string; text: string; border: string } => {
  const teamColors: { [key: string]: { bg: string; text: string; border: string } } = {
    'Blue': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    'Orange': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    'Jaune': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    'Green': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    'Red': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    'Vert': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' }
  };
  
  return teamColors[teamName] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
};

export default function PastGamesSection() {
  const { language, t } = useLanguage();
  const [selectedGame, setSelectedGame] = useState<PastGame | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [pastGames, setPastGames] = useState<PastGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [showAllGames, setShowAllGames] = useState(false);
  const [searchPlayer, setSearchPlayer] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, usedFallback } = await loadPastGamesData();
      setPastGames(data);
      if (usedFallback) {
        setError('static-fallback');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error loading past games:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async () => {
    try {
      setIsRefetching(true);
      setError(null);
      const { data, usedFallback } = await loadPastGamesData();
      setPastGames(data);
      if (usedFallback) {
        setError('static-fallback');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error refreshing past games:', err);
    } finally {
      setIsRefetching(false);
    }
  };

  const handleGameClick = (game: PastGame) => {
    setSelectedGame(game);
    setIsStatsModalOpen(true);
    trackEvent('past_game_click', 'user_action', game.gameId);
  };

  const handleRefresh = () => {
    refetch();
    trackEvent('past_games_refresh', 'user_action', 'manual');
  };

  // Get unique players for autocomplete
  const allPlayers = useMemo(() => {
    const playersSet = new Set<string>();
    pastGames.forEach(game => {
      game.players.forEach(player => {
        if (player.playerUsername) {
          playersSet.add(player.playerUsername);
        }
      });
    });
    return Array.from(playersSet).sort();
  }, [pastGames]);

  // Filter games based on search
  const filteredGames = useMemo(() => {
    
    if (!searchPlayer.trim()) {
      return pastGames;
    }
    
    return pastGames.filter(game => 
      game.players.some(player => 
        player.playerUsername.toLowerCase().includes(searchPlayer.toLowerCase())
      )
    );
  }, [pastGames, searchPlayer]);

  // Get suggestions for autocomplete
  const suggestions = useMemo(() => {
    if (!searchPlayer.trim()) return [];
    
    return allPlayers.filter(player =>
      player.toLowerCase().includes(searchPlayer.toLowerCase())
    ).slice(0, 8);
  }, [allPlayers, searchPlayer]);

  // Get games to display (limited or all)
  const displayedGames = useMemo(() => {
    const games = filteredGames;
    return showAllGames ? games : games.slice(0, 3);
  }, [filteredGames, showAllGames]);

  const handlePlayerSelect = (player: string) => {
    setSearchPlayer(player);
    setShowSuggestions(false);
    trackEvent('player_search', 'user_action', player);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  if (error && error !== 'static-fallback') {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Matchs Passés</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-600">Erreur lors du chargement des matchs passés</p>
              <button 
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="past-games" className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <RevealAnimation>
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Matchs Passés
              </h2>
              <button
                onClick={handleRefresh}
                disabled={isLoading || isRefetching}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isLoading || isRefetching
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-md hover:shadow-lg'
                }`}
                title={isLoading || isRefetching ? "Mise à jour en cours..." : "Actualiser les données"}
              >
                <FiRefreshCw className={`w-4 h-4 ${isLoading || isRefetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isLoading || isRefetching ? 'Actualisation...' : 'Actualiser'}
                </span>
              </button>
            </div>
            <p className="text-lg text-gray-600">
              Découvrez les résultats et statistiques des matchs passés
            </p>
          </div>

          {/* Warning triangle for static fallback */}
          {error === 'static-fallback' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2">
                <FiAlertTriangle className="text-yellow-500 text-xl" />
                <span className="text-yellow-600 text-sm">MHL</span>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto mb-8 px-4 sm:px-0">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un joueur..."
                value={searchPlayer}
                onChange={(e) => {
                  setSearchPlayer(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-base"
              />
            </div>
            
            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {suggestions.map((player, index) => (
                  <button
                    key={index}
                    onClick={() => handlePlayerSelect(player)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="font-medium">{player}</span>
                  </button>
                ))}
              </div>
            )}

            {searchPlayer && (
              <button
                onClick={() => {
                  setSearchPlayer("");
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Search Results Info */}
          {searchPlayer && (
            <div className="text-center mb-6">
              <p className="text-gray-600">
                {filteredGames.length} match{filteredGames.length !== 1 ? 's' : ''} trouvé{filteredGames.length !== 1 ? 's' : ''} pour{' '}
                <span className="font-semibold text-blue-600">{searchPlayer}</span>
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : displayedGames.length === 0 ? (
            <div className="text-center py-12">
              <TbBuildingStadium className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchPlayer ? 'Aucun match trouvé pour ce joueur' : 'Aucun match passé trouvé'}
              </h3>
              <p className="text-gray-500">
                {searchPlayer ? 'Essayez un autre nom de joueur' : 'Les résultats des matchs passés apparaîtront ici'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {displayedGames.map((game) => (
                <div
                  key={`${game.gameId}_${game.date}`}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer group"
                  onClick={() => handleGameClick(game)}
                >
                  {/* Game Header with gradient - Updated layout */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FiCalendar className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {formatDate(game.date)}
                            {getDayNameInFrench(game.date) && ` (${getDayNameInFrench(game.date)})`}
                          </span>
                        </div>
                        <div className="text-right">
                          <h3 className="font-bold text-lg">Game {game.gameId}</h3>
                        </div>
                      </div>
                      
                      {/* Game mode tag and MVP on same line */}
                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          {game.mode && (
                            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full">
                              {game.mode}
                            </span>
                          )}
                        </div>
                        
                        {/* MVP badge with crown at top right corner */}
                        {game.mvpPlayer && (
                          <div className="relative">
                            <span className="absolute -top-1 -right-1 text-yellow-400 text-xs leading-none z-10">👑</span>
                            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                              MVP {game.mvpPlayer.playerUsername}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Game Content - Optimized spacing */}
                  <div className="p-3">
                    {/* Team Scores with compact design and sorting */}
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1.5 text-sm">
                        <FiTarget className="w-3.5 h-3.5 text-blue-600" />
                        Classement des Équipes
                      </h4>
                      <div className="space-y-1.5">
                        {Object.entries(game.teams)
                          .sort(([,a], [,b]) => b.totalGoals - a.totalGoals) // Sort by goals descending
                          .map(([teamName, teamData], index) => {
                            const colors = getTeamColor(teamName);
                            const teamPlayers = game.players.filter(p => p.team.toLowerCase() === teamName.toLowerCase());
                            // Get team stats from first player (since it's the same for all players in the team)
                            const firstPlayer = teamPlayers[0];
                            const teamWins = parseInt(firstPlayer?.teamWin || '0');
                            const teamLosses = parseInt(firstPlayer?.teamLoss || '0');
                            const teamCleanSheets = parseInt(firstPlayer?.teamCleanSheet || '0');
                            const teamGoals = parseInt(firstPlayer?.teamGoals || '0');
                            const teamGC = parseInt(firstPlayer?.teamGC || '0');
                            const teamAssists = teamPlayers.reduce((sum, p) => sum + parseInt(p.assist || '0'), 0);
                            
                            return (
                              <div key={teamName} className={`relative rounded-lg border ${colors.border} ${colors.bg} hover:shadow-md transition-all duration-200 p-2.5`}>
                                {/* Position & Crown - Compact */}
                                <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                                    index === 0 ? 'bg-yellow-500 text-yellow-900' :
                                    index === 1 ? 'bg-gray-400 text-gray-900' :
                                    index === 2 ? 'bg-amber-600 text-amber-900' :
                                    'bg-gray-300 text-gray-700'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  {index === 0 && <span className="text-yellow-500 text-xs">👑</span>}
                                </div>
                                
                                <div className="pl-7">
                                  {/* Team Header - Super Compact */}
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <div className={`w-3 h-3 rounded-full ${colors.bg.replace('bg-', 'bg-').replace('-50', '-500')}`}></div>
                                      <div className="flex items-center gap-1.5">
                                        <h5 className={`font-medium text-xs ${colors.text}`}>Équipe {teamName}</h5>
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                          <FiUsers className="w-2.5 h-2.5" />
                                          <span>{teamPlayers.length}</span>
                                        </div>
                                        <div className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                          {firstPlayer?.teamScore || '0'} pts
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className={`text-lg font-bold ${colors.text} flex items-center gap-1`}>
                                        <span>⚽</span>
                                        <span>{teamData.totalGoals}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Ultra Compact Team Stats */}
                                  <div className="flex gap-3 text-xs flex-wrap">
                                    <span className="font-medium whitespace-nowrap">
                                      <span className="text-gray-500">Win/L </span>
                                      <span className="text-green-600">{teamWins}</span>
                                      <span className="text-gray-400">/</span>
                                      <span className="text-red-600">{teamLosses}</span>
                                    </span>
                                    <span className="font-medium whitespace-nowrap">
                                      <span className="text-gray-500">Goal/GC </span>
                                      <span className="text-green-600">{teamGoals}</span>
                                      <span className="text-gray-400">/</span>
                                      <span className="text-red-600">{teamGC}</span>
                                    </span>
                                    <span className="text-purple-600 font-medium whitespace-nowrap">{teamAssists} Assists</span>
                                    <span className="text-blue-600 font-medium whitespace-nowrap">{teamCleanSheets} Clean-Sheet</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>





                    {/* Action Button with same style as upcoming matches */}
                    <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium group-hover:shadow-lg">
                      <FiBarChart2 className="w-4 h-4" />
                      Voir les statistiques détaillées
                    </button>
                  </div>
                </div>
              ))}
              </div>

              {/* Show More Button */}
              {!showAllGames && filteredGames.length > 3 && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => {
                      setShowAllGames(true);
                      trackEvent('show_more_past_games', 'user_action', 'expand');
                    }}
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 bg-white border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
                  >
                    <span>Voir plus de matchs ({filteredGames.length - 3} restants)</span>
                    <FiChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}

              {showAllGames && filteredGames.length > 3 && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => {
                      setShowAllGames(false);
                      trackEvent('show_less_past_games', 'user_action', 'collapse');
                    }}
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 bg-white border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
                  >
                    <span>Voir moins</span>
                    <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </RevealAnimation>

        {/* Stats Modal - FIFA Card Style like Leaderboard */}
        <Dialog open={isStatsModalOpen} onOpenChange={setIsStatsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <FiBarChart2 className="w-6 h-6" />
                Match {selectedGame?.gameId} - Statistiques des Joueurs
              </DialogTitle>
            </DialogHeader>
            
            {selectedGame && (
              <div className="space-y-6">
                {/* Match Overview */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-white">
                  <h3 className="font-semibold text-lg mb-3">Résumé du Match</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{selectedGame.totalPlayers}</div>
                      <div className="text-sm opacity-90">Joueurs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{selectedGame.totalGoals}</div>
                      <div className="text-sm opacity-90">Buts Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{Object.keys(selectedGame.teams).length}</div>
                      <div className="text-sm opacity-90">Équipes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">
                        {selectedGame.mvpPlayer ? selectedGame.mvpPlayer.playerUsername : 'Aucun'}
                      </div>
                      <div className="text-sm opacity-90">MVP</div>
                    </div>
                  </div>
                </div>

                {/* Player Statistics - Exact same format as Leaderboard */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Statistiques des Joueurs</h3>
                  
                  {/* Desktop Table - Same as Leaderboard */}
                  <div className="hidden md:block">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                          <tr>
                            <th className="px-4 py-4 text-left font-semibold">Position</th>
                            <th className="px-4 py-4 text-left font-semibold">Joueur</th>
                            <th className="px-4 py-4 text-center font-semibold">Équipe</th>
                            <th className="px-4 py-4 text-center font-semibold">Match Score</th>
                            <th className="px-4 py-4 text-center font-semibold">Buts</th>
                            <th className="px-4 py-4 text-center font-semibold">Assists</th>
                            <th className="px-4 py-4 text-center font-semibold">ATT</th>
                            <th className="px-4 py-4 text-center font-semibold">DEF</th>
                            <th className="px-4 py-4 text-center font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedGame.players
                            .sort((a, b) => {
                              // Use Match Total Score for ranking
                              const hasManualA = a.matchTotalScore && a.matchTotalScore.trim() !== '' && parseFloat(a.matchTotalScore.replace(',', '.')) > 0;
                              const hasManualB = b.matchTotalScore && b.matchTotalScore.trim() !== '' && parseFloat(b.matchTotalScore.replace(',', '.')) > 0;
                              
                              // If both have manual scores, sort by manual score
                              if (hasManualA && hasManualB) {
                                return parseFloat(b.matchTotalScore.replace(',', '.')) - parseFloat(a.matchTotalScore.replace(',', '.'));
                              }
                              
                              // If only one has manual score, prioritize that player
                              if (hasManualA && !hasManualB) return -1;
                              if (hasManualB && !hasManualA) return 1;
                              
                              // If neither has manual score, sort by goals, then assists
                              const aGoals = parseInt(a.goal || '0');
                              const bGoals = parseInt(b.goal || '0');
                              if (aGoals !== bGoals) return bGoals - aGoals;
                              
                              const aAssists = parseInt(a.assist || '0');
                              const bAssists = parseInt(b.assist || '0');
                              return bAssists - aAssists;
                            })
                            .map((player, index) => (
                            <tr 
                              key={`${player.playerUsername}_${index}`}
                              className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                                index <= 2 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                              }`}
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  {index === 0 ? <FiAward className="text-yellow-500" /> :
                                   index === 1 ? <FiAward className="text-gray-400" /> :
                                   index === 2 ? <FiAward className="text-amber-600" /> :
                                   <span className="w-4 h-4"></span>}
                                  <span className="font-bold text-lg">{index + 1}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="font-semibold text-gray-900">{player.playerUsername}</div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTeamColor(player.team).bg} ${getTeamColor(player.team).text}`}>
                                  {player.team}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="font-bold text-2xl text-blue-600">
                                  {player.matchTotalScore && player.matchTotalScore.trim() !== '' 
                                    ? parseFloat(player.matchTotalScore.replace(',', '.')).toFixed(1)
                                    : '-'}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="font-medium text-green-600">{player.goal || '0'}</span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="font-medium text-purple-600">{player.assist || '0'}</span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="font-medium text-orange-600">
                                  {player.att && player.att.trim() !== '' ? `${parseFloat(player.att.replace(',', '.')).toFixed(2)}%` : '-'}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="font-medium text-red-600">
                                  {player.def && player.def.trim() !== '' ? `${parseFloat(player.def.replace(',', '.')).toFixed(2)}%` : '-'}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <div className="flex justify-center gap-1 flex-wrap">
                                  {player.mvp === '1' && (
                                    <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-medium">
                                      MVP
                                    </span>
                                  )}
                                  {player.hattrick === '1' && (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                      Hat-trick
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Cards - Same as Leaderboard */}
                  <div className="md:hidden space-y-2">
                    {selectedGame.players
                      .sort((a, b) => {
                        // Use Match Total Score for ranking
                        const hasManualA = a.matchTotalScore && a.matchTotalScore.trim() !== '' && parseFloat(a.matchTotalScore.replace(',', '.')) > 0;
                        const hasManualB = b.matchTotalScore && b.matchTotalScore.trim() !== '' && parseFloat(b.matchTotalScore.replace(',', '.')) > 0;
                        
                        // If both have manual scores, sort by manual score
                        if (hasManualA && hasManualB) {
                          return parseFloat(b.matchTotalScore.replace(',', '.')) - parseFloat(a.matchTotalScore.replace(',', '.'));
                        }
                        
                        // If only one has manual score, prioritize that player
                        if (hasManualA && !hasManualB) return -1;
                        if (hasManualB && !hasManualA) return 1;
                        
                        // If neither has manual score, sort by goals, then assists
                        const aGoals = parseInt(a.goal || '0');
                        const bGoals = parseInt(b.goal || '0');
                        if (aGoals !== bGoals) return bGoals - aGoals;
                        
                        const aAssists = parseInt(a.assist || '0');
                        const bAssists = parseInt(b.assist || '0');
                        return bAssists - aAssists;
                      })
                      .map((player, index) => (
                      <div 
                        key={`mobile-${player.playerUsername}_${index}`}
                        className={`rounded-lg shadow-md p-3 border-l-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ${
                          player.mvp === '1' 
                            ? 'border-l-yellow-600 bg-gradient-to-r from-yellow-100 via-yellow-50 to-amber-50 shadow-yellow-200/50' 
                            : index <= 2 
                            ? 'border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50' 
                            : 'border-l-blue-500 bg-white'
                        }`}
                      >
                        {/* En-tête compact */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-base ${player.mvp === '1' ? 'text-yellow-700' : 'text-gray-900'}`}>
                                {player.playerUsername}
                              </span>
                              {player.mvp === '1' && (
                                <span className="bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold border border-yellow-600">
                                  🏆 MVP
                                </span>
                              )}
                              <div className={`w-3 h-3 rounded-full ${
                                player.team.toLowerCase() === 'orange' ? 'bg-orange-500' :
                                player.team.toLowerCase() === 'blue' ? 'bg-blue-500' :
                                player.team.toLowerCase() === 'jaune' ? 'bg-yellow-500' :
                                player.team.toLowerCase() === 'red' ? 'bg-red-500' :
                                player.team.toLowerCase() === 'green' ? 'bg-green-500' :
                                player.team.toLowerCase() === 'purple' ? 'bg-purple-500' :
                                player.team.toLowerCase() === 'pink' ? 'bg-pink-500' :
                                'bg-gray-500'
                              }`}></div>
                              {player.matchTotalScore && player.matchTotalScore.trim() !== '' && (
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${player.mvp === '1' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
                                  Score: {parseFloat(player.matchTotalScore.replace(',', '.')).toFixed(1)}
                                </span>
                              )}
                              {player.hattrick === '1' && (
                                <span className="bg-green-500 text-green-900 px-2 py-1 rounded-full text-xs font-bold border border-green-600">
                                  ⚽ Hat-trick
                                </span>
                              )}
                              {player.ownGoal && parseInt(player.ownGoal) > 0 && (
                                <span className="bg-gray-500 text-gray-900 px-2 py-1 rounded-full text-xs font-bold border border-gray-600">
                                  🔴 Own Goal
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${player.mvp === '1' ? 'text-yellow-600' : 'text-blue-600'}`}>
                              #{index + 1}
                            </div>
                          </div>
                        </div>

                        {/* Individual stats only */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex gap-3 text-xs flex-wrap">
                            <span className="text-green-600 font-medium">{player.goal || '0'} buts</span>
                            <span className="text-purple-600 font-medium">{player.assist || '0'} assists</span>
                            {player.att && player.att.trim() !== '' && (
                              <span className="text-orange-600 font-medium">
                                ATT {parseFloat(player.att.replace(',', '.')).toFixed(2)}%
                              </span>
                            )}
                            {player.def && player.def.trim() !== '' && (
                              <span className="text-red-600 font-medium">
                                DEF {parseFloat(player.def.replace(',', '.')).toFixed(2)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}