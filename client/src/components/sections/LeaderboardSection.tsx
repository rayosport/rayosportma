import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useCompanyContext } from "@/hooks/use-company-context";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { FaTrophy, FaMedal, FaAward, FaUser, FaGamepad } from "react-icons/fa";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FiTrendingUp, FiTarget, FiAward, FiUsers, FiStar, FiX, FiShield, FiZap, FiAlertTriangle } from "react-icons/fi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trackEvent } from "@/lib/analytics";

// Types pour les données du leaderboard
interface Player {
  rank: number;
  cityRank: number;
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
}

// Configuration Google Sheets - URL publique CSV
const DEFAULT_GOOGLE_SHEETS_CONFIG = {
  csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSDgQfkyS5KdTwQABcUDgu673_fSDrwX0HNgGeZiZ5DbSK6UEmYIcUrWPGsAGN5yuL50M6I3rYIJInL/pub?gid=1779046147&single=true&output=csv',
};

const LeaderboardSection = () => {
  // console.log('🎯 LeaderboardSection: Component rendering...');
  const { language } = useLanguage();
  const { customDataSources } = useCompanyContext();
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("Toutes les villes");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [showMorePlayers, setShowMorePlayers] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerCard, setShowPlayerCard] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<Player[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Handler pour ouvrir la carte joueur
  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setShowPlayerCard(true);
    trackEvent('leaderboard_player_card_view', 'interaction', player.username);
  };

  // Search handlers
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
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

  const handleSuggestionClick = (player: Player) => {
    setSearchQuery(player.firstName + " (" + player.username + ")");
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

  // FIFA Player Card Component for Leaderboard
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
      Rank: player.rank || 0
    };

    // Add advanced stats if available (percentages and decimal scores)
    const advancedStats: Record<string, number> = {};
    if (player.attackRatio !== undefined) {
      advancedStats['Attack %'] = parseFloat((player.attackRatio || 0).toFixed(1));
    }
    if (player.defenseRatio !== undefined) {
      advancedStats['Defense %'] = parseFloat((player.defenseRatio || 0).toFixed(1));
    }
    if (player.individualScore !== undefined) {
      advancedStats['Individual Score'] = parseFloat((player.individualScore || 0).toFixed(2));
    }
    if (player.teamScore !== undefined) {
      advancedStats['Team Score'] = parseFloat((player.teamScore || 0).toFixed(2));
    }
    // Balance hidden per user request
    // if (typeof player.solde === 'number') {
    //   advancedStats['Balance'] = player.solde;
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
            <div className={`w-72 max-w-[90vw] sm:w-72 rounded-3xl bg-gradient-to-br ${getCardGradient(player.globalScore, player.rank)} p-5 shadow-2xl text-white font-sans transform hover:scale-105 transition duration-300 ease-in-out relative`}>
              
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
                  <span className="text-xs font-bold text-white">#{player.rank}</span>
                </div>
              </div>

              {/* Player Avatar Area */}
              <div className="relative h-40 flex justify-center items-center">
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-white">
                      {player.firstName.charAt(0).toUpperCase()}
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

              {/* City and Rank */}
              <div className="text-center mt-1 text-sm opacity-90">
                {player.city} • Global #{player.rank}
              </div>

              {/* Payment Status and Balance Section */}
              <div className="text-center mt-2">
                {/* Payment Status - ONLY show for subscribers */}
                {player.paymentStatus === "Subscription" && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500 text-white">
                    Subscription
                  </span>
                )}
                
                {/* Balance Display - Show for ALL players including -1 values */}
                {player.solde !== undefined && (
                  <div className={`text-xs ${player.paymentStatus === "Subscription" ? "mt-1" : "mt-0"} opacity-80`}>
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

              {/* Player Stats Grid */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
                {Object.entries(playerStats).slice(0, 6).map(([stat, value]) => (
                  <div key={stat} className="bg-black/20 rounded-lg p-2">
                    <div className="font-bold text-sm">{value}</div>
                    <div className="text-xs opacity-80">{stat}</div>
                  </div>
                ))}
              </div>

              {/* Additional Stats for advanced players */}
              {Object.keys(advancedStats).length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2 text-center text-xs">
                  {Object.entries(advancedStats).map(([stat, value]) => (
                    <div key={stat} className="bg-black/20 rounded-lg p-2">
                      <div className="font-bold text-sm">{value}</div>
                      <div className="text-xs opacity-80">{stat}</div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
          <div id="player-card-description" className="sr-only">
            FIFA-style player card showing detailed statistics for {player.username}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Contenu en fonction de la langue
  const content = language === 'ar' ? {
    title: "🏆 لوحة الصدارة",
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
    title: "🏆 Leaderboard",
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

  // Fonction pour récupérer les données depuis Google Sheets CSV avec fallback vers fichier statique
  const fetchLeaderboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Essayer d'abord Google Sheets
      const csvUrl = customDataSources?.leaderboard || DEFAULT_GOOGLE_SHEETS_CONFIG.csvUrl;
      console.log('🔍 Leaderboard fetching from:', csvUrl);
      const response = await fetch(csvUrl, { cache: 'no-store', redirect: 'follow', headers: { 'Accept': 'text/csv,text/plain,*/*' } });
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
        
        const playersData = rows.slice(1)
          .filter(row => row[1] && row[1].trim() !== '' && row[1] !== '#VALUE!') // Filtrer les lignes avec des noms valides
          .map((row: string[]) => {
            // Parse the score properly handling European decimal format (comma as decimal separator)
            const rawScore = row[5];
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

            // Find PlayerUsername column and extract first name from it
            const playerUsername = row[2] || 'Username'; // Assuming PlayerUsername is in column C
            const firstName = playerUsername.split(' ')[0] || playerUsername; // Extract first part as name
            
            // Parse payment type from CSV to determine payment status
            const paymentType = row[16] ? row[16].toString().toLowerCase().trim() : '';
            // Parse subscriber balance from SubGamesLeft column
            let subGamesLeft = 0;
            const hasSubGamesLeft = headers.some(h => h.includes('SubGamesLeft'));
            if (hasSubGamesLeft) {
              const subGamesLeftIndex = headers.findIndex(h => h.includes('SubGamesLeft'));
              const subGamesLeftValue = row[subGamesLeftIndex]?.trim();
              if (subGamesLeftValue && subGamesLeftValue !== '#REF!' && subGamesLeftValue !== '#N/A' && subGamesLeftValue !== '#ERROR!' && subGamesLeftValue !== '') {
                subGamesLeft = parseInt(subGamesLeftValue) || 0;
              }
            }

            // Parse expiration date from ExpirationDate column
            let expirationDate = '';
            const hasExpirationDate = headers.some(h => h.includes('ExpirationDate'));
            
            if (hasExpirationDate) {
              const expirationDateIndex = headers.findIndex(h => h.includes('ExpirationDate'));
              const expirationDateValue = row[expirationDateIndex]?.trim();
              
              if (expirationDateValue && expirationDateValue !== '#REF!' && expirationDateValue !== '#N/A' && expirationDateValue !== '#ERROR!' && expirationDateValue !== '') {
                expirationDate = expirationDateValue;
              }
            }
            
            return {
              rank: parseInt(row[0]) || 0,               // Colonne A - Rank
              cityRank: parseInt(row[1]) || 0,          // Colonne B - City Rank
              firstName: firstName,                      // Extract from PlayerUsername
              username: playerUsername,                  // Full PlayerUsername
              city: convertToFrench(row[3] || 'Non spécifié'), // Colonne D - City
              globalScore: parseDecimal(row[5]) || 0,    // Colonne F - Global Score (fixed parsing)
              gamesPlayed: parseInt(row[6]) || 0,        // Colonne G - TGame played
              goals: parseInt(row[7]) || 0,              // Colonne H - TGoals
              assists: parseInt(row[8]) || 0,            // Colonne I - Assists
              teamWins: parseInt(row[9]) || 0,           // Colonne J - Team Wins
              attackRatio: parseDecimal(row[10]),        // Colonne K - Attack RATIO
              defenseRatio: parseDecimal(row[11]),       // Colonne L - Defense RATIO
              individualScore: parseDecimal(row[12]),    // Colonne M - Individuel Score
              teamScore: parseDecimal(row[13]),          // Colonne N - TEAM SCORE
              solde: subGamesLeft,                       // Colonne O - SubGamesLeft (subscriber balance)
              expirationDate: expirationDate,            // ExpirationDate column (dynamic index)
              isNewPlayer: (parseInt(row[6]) || 0) === 0, // New player if 0 games played
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
        
        // Sort players by Global Score (descending order) and assign proper ranks
        const sortedPlayers = playersData.sort((a, b) => b.globalScore - a.globalScore);
        const rankedPlayers = sortedPlayers.map((player, index) => ({
          ...player,
          rank: index + 1, // Proper rank starting from 1
          cityRank: index + 1 // Default city rank, will be recalculated in filtering
        }));

        // Extract unique cities - only actual city names, no invalid data
        const validCityNames = ['Casablanca', 'Fès', 'Tanger', 'Kénitra', 'Rabat', 'Marrakech', 'Agadir', 'Meknès', 'Oujda', 'Tétouan'];
        const allCities = rankedPlayers.flatMap(player => 
          player.city.split(',').map(city => city.trim())
        ).filter(city => validCityNames.includes(city));
        const cities = Array.from(new Set(allCities)).sort();
        setAvailableCities(cities);
        
        console.log('🎯 Leaderboard parsed players count:', rankedPlayers.length);
        console.log('🎯 Sample player:', rankedPlayers[0]);
        setPlayers(rankedPlayers);
        setFilteredPlayers(rankedPlayers);
      } else {
        setPlayers([]);
        setFilteredPlayers([]);
      }
    } catch (error) {
      console.warn('Échec du chargement depuis Google Sheets, essai avec le fichier statique:', error);
      try {
        const staticResponse = await fetch('/staticfolder/PublicLeaderBoard.csv', { cache: 'no-store', headers: { 'Accept': 'text/csv,text/plain,*/*' } });
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
              
              return {
                rank: parseInt(row[0]) || 0,
                cityRank: parseInt(row[1]) || 0,
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
          
          // Sort players by Global Score (descending order) and assign proper ranks
          const sortedPlayers = playersData.sort((a, b) => b.globalScore - a.globalScore);
          const rankedPlayers = sortedPlayers.map((player, index) => ({
            ...player,
            rank: index + 1,
            cityRank: index + 1
          }));

          // Extract unique cities
          const validCityNames = ['Casablanca', 'Fès', 'Tanger', 'Kénitra', 'Rabat', 'Marrakech', 'Agadir', 'Meknès', 'Oujda', 'Tétouan'];
          const allCities = rankedPlayers.flatMap(player => 
            player.city.split(',').map(city => city.trim())
          ).filter(city => validCityNames.includes(city));
          const cities = Array.from(new Set(allCities)).sort();
          setAvailableCities(cities);
          
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

  // Effect to handle city filtering and search
  useEffect(() => {
    
    setShowMorePlayers(false);
    
    // If there's an active search query, don't apply city filtering
    if (searchQuery.trim().length > 0) {
      return; // Search results are handled by handleSuggestionClick
    }
    
    // Apply city filtering when no search is active
    if (selectedCity === "Toutes les villes" || selectedCity === "جميع المدن") {
      setFilteredPlayers(players);
    } else {
      const filtered = players.filter(player => {
        const cities = player.city.split(',').map(city => city.trim());
        return cities.includes(selectedCity);
      });
      
      // Sort by Global Score for this city
      const sortedFiltered = filtered.sort((a, b) => b.globalScore - a.globalScore);
      
      // Recalculate ranks for filtered city (cityRank)
      const rerankedFiltered = sortedFiltered.map((player, index) => ({
        ...player,
        cityRank: index + 1
      }));
      setFilteredPlayers(rerankedFiltered);
    }
  }, [selectedCity, players, searchQuery, loading, error]);

  // Fonction pour obtenir l'icône en fonction du rang
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <FaTrophy className="text-yellow-500" />;
    if (rank === 2) return <FaMedal className="text-gray-400" />;
    if (rank === 3) return <FaAward className="text-amber-600" />;
    return <FaUser className="text-gray-600" />;
  };

  if (loading) {
    return (
      <section id="leaderboard" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement du classement...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error && error !== 'static-fallback') {
    return (
      <section id="leaderboard" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">{content.error}</p>
            <button 
              onClick={fetchLeaderboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="leaderboard" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">

        
        <RevealAnimation>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {content.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {content.subtitle}
            </p>
          </div>
        </RevealAnimation>

        {/* Warning triangle for static fallback */}
        {error === 'static-fallback' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2">
              <FiAlertTriangle className="text-yellow-500 text-xl" />
              <span className="text-yellow-600 text-sm">MHL</span>
            </div>
          </div>
        )}

        {/* Filtre par ville */}
        <RevealAnimation delay={0.15}>
          <div className="mb-8">
            {/* Desktop filter */}
            <div className="hidden md:flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-700 font-medium">{content.filterBy}:</span>
              </div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              >
                <option value="Toutes les villes">{content.allCities}</option>
                <option value="Casablanca">Casablanca</option>
                <option value="Berrechid">Berrechid</option>
                {availableCities.filter(city => !['Casablanca', 'Berrechid'].includes(city)).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Mobile filter - Boutons horizontaux */}
            <div className="md:hidden">
              <div className="text-center mb-4">
                <span className="text-gray-700 font-medium text-sm">{content.filterBy}</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setSelectedCity("Toutes les villes")}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCity === "Toutes les villes"
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {content.allCities}
                </button>
                <button
                  onClick={() => setSelectedCity("Casablanca")}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCity === "Casablanca"
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Casablanca
                </button>
                <button
                  onClick={() => setSelectedCity("Berrechid")}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCity === "Berrechid"
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Berrechid
                </button>
                {availableCities.filter(city => !['Casablanca', 'Berrechid'].includes(city)).map(city => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
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

        {/* Search Bar with Autocomplete */}
        <div className="mb-8 max-w-md mx-auto relative" style={{ zIndex: 30 }}>
          <RevealAnimation delay={0.2}>
            <div className="relative">
              <input
                type="text"
                placeholder={language === 'ar' ? "البحث عن لاعب..." : "Rechercher un joueur..."}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-gray-900"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <FiX className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </RevealAnimation>

          {/* Autocomplete Suggestions - Outside RevealAnimation to avoid stacking context issues */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-60 overflow-y-auto" style={{ zIndex: 40 }}>
              {searchSuggestions.map((suggestion) => (
                <button
                  key={suggestion.username}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {suggestion.firstName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{suggestion.firstName}</div>
                    <div className="text-sm text-gray-500">@{suggestion.username} • {suggestion.city}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-sm font-medium text-blue-600">#{suggestion.rank}</div>
                    <div className="text-xs text-gray-500">{suggestion.globalScore.toFixed(2)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tableau des scores - Desktop */}
        <RevealAnimation delay={0.4}>
          <div className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-4 py-4 text-left font-semibold">{content.rank}</th>
                    <th className="px-4 py-4 text-left font-semibold">{content.firstName}</th>
                    <th className="px-4 py-4 text-left font-semibold">{content.username}</th>
                    <th className="px-4 py-4 text-left font-semibold">{content.city}</th>
                    <th className="px-4 py-4 text-center font-semibold">{content.score}</th>
                    <th className="px-4 py-4 text-center font-semibold">{content.matches}</th>
                    <th className="px-4 py-4 text-center font-semibold">{content.goals}</th>
                    <th className="px-4 py-4 text-center font-semibold">{content.assists}</th>
                    <th className="px-4 py-4 text-center font-semibold">{content.teamWins}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.length > 0 ? (
                    filteredPlayers.slice(0, showMorePlayers ? 50 : 10).map((player, index) => (
                      <tr 
                        key={`${player.username}-${index}`}
                        className={`border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer hover:scale-[1.01] ${
                          (selectedCity === "All Cities" ? player.rank : player.cityRank) <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                        }`}
                        onClick={() => handlePlayerClick(player)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {getRankIcon(selectedCity !== "All Cities" ? player.cityRank : player.rank)}
                            <span className="font-bold text-lg">
                              {selectedCity !== "All Cities" ? player.cityRank : player.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-gray-900">{player.firstName}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-gray-700">{player.username}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {player.city}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-bold text-2xl text-blue-600">
                            {player.globalScore.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <FaGamepad className="text-gray-500" />
                            <span className="font-medium">{player.gamesPlayed}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-medium text-green-600">{player.goals}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-medium text-purple-600">{player.assists}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-medium text-orange-600">{player.teamWins}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                        {content.noData}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </RevealAnimation>

        {/* Vue mobile - Cartes compactes */}
        <div className="md:hidden space-y-2">
          {filteredPlayers.length > 0 ? (
            <>
              {filteredPlayers.slice(0, showMorePlayers ? 50 : 10).map((player, index) => (
                <div 
                  key={`mobile-${player.username}-${index}`}
                  className={`bg-white rounded-lg shadow-md p-3 border-l-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ${
                    (selectedCity === "All Cities" ? player.rank : player.cityRank) <= 3 
                      ? 'border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50' 
                      : 'border-l-blue-500'
                  }`}
                  onClick={() => handlePlayerClick(player)}
                >
                  {/* En-tête compact */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-bold text-base text-gray-900">{player.firstName}</div>
                        <div className="text-xs text-gray-600">@{player.username}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">#{selectedCity !== "All Cities" ? player.cityRank : player.rank}</div>
                    </div>
                  </div>

                  {/* Score et stats sur une ligne */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-blue-600">{player.globalScore.toFixed(2)}</span>
                      <span className="text-gray-500">pts</span>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="text-gray-600">{player.gamesPlayed} matchs</span>
                      <span className="text-green-600">{player.goals} buts</span>
                      <span className="text-purple-600">{player.assists} assists</span>
                      <span className="text-orange-600">{player.teamWins} wins</span>
                    </div>
                  </div>

                  {/* Mobile Payment Status and Balance Section */}
                  <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {/* Payment Status - ONLY show for subscribers */}
                      {player.paymentStatus === "Subscription" && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500 text-white">
                          Subscription
                        </span>
                      )}
                      
                      {/* Expiration Date Display - ONLY for subscribers */}
                      {player.paymentStatus === "Subscription" && player.expirationDate && (
                        <span className="text-xs text-orange-600">
                          Expire: {player.expirationDate}
                        </span>
                      )}
                    </div>
                    
                    {/* Balance Display - Show for ALL players */}
                    {player.solde !== undefined && (
                      <div className="text-xs">
                        <span className={`${
                          player.solde === -1 ? "text-red-600" :
                          player.solde === 0 ? "text-green-600" :
                          player.solde < 1 ? "text-red-600" :
                          player.solde === 1 ? "text-yellow-600" :
                          "text-green-600"
                        }`}>
                          Balance: {player.solde}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Bouton Voir plus / Voir moins */}
              {filteredPlayers.length > 10 && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setShowMorePlayers(!showMorePlayers)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-md"
                  >
                    {showMorePlayers ? content.showLess : content.showMore}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
              {content.noData}
            </div>
          )}
        </div>

        {/* Bouton Voir plus/moins - Desktop uniquement */}
        {filteredPlayers.length > 10 && (
          <RevealAnimation delay={0.5}>
            <div className="hidden md:flex justify-center mt-6">
              <button
                onClick={() => setShowMorePlayers(!showMorePlayers)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
              >
                {showMorePlayers ? (
                  <>
                    <ChevronUp size={16} />
                    {content.showLess}
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    {content.showMore}
                  </>
                )}
              </button>
            </div>
          </RevealAnimation>
        )}

        {/* Statistiques - Fixed values not affected by search */}
        {players.length > 0 && (
          <RevealAnimation delay={0.6}>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 text-center">
                <div className="text-2xl md:text-3xl font-bold text-blue-600">{players.length}</div>
                <div className="text-gray-600 text-sm md:text-base">Joueurs actifs</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 text-center">
                <div className="text-2xl md:text-3xl font-bold text-green-600">
                  {players.reduce((sum, player) => sum + player.goals, 0)}
                </div>
                <div className="text-gray-600 text-sm md:text-base">Total des buts</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 text-center">
                <div className="text-2xl md:text-3xl font-bold text-purple-600">
                  {players.reduce((sum, player) => sum + player.assists, 0)}
                </div>
                <div className="text-gray-600 text-sm md:text-base">Total des assists</div>
              </div>

            </div>
          </RevealAnimation>
        )}
      </div>

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