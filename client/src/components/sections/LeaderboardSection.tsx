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
  mvpCount?: number;  // MVP count from TMVP🔒 column
}

// Configuration Google Sheets - URL publique CSV
const DEFAULT_GOOGLE_SHEETS_CONFIG = {
  csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSDgQfkyS5KdTwQABcUDgu673_fSDrwX0HNgGeZiZ5DbSK6UEmYIcUrWPGsAGN5yuL50M6I3rYIJInL/pub?gid=1779046147&single=true&output=csv',
};

interface LeaderboardSectionProps {
  onPlayerClick?: (username: string) => void;
}

const LeaderboardSection = ({ onPlayerClick }: LeaderboardSectionProps = {}) => {
  // console.log('🎯 LeaderboardSection: Component rendering...');
  const { language } = useLanguage();
  const { customDataSources } = useCompanyContext();
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("Toutes les villes");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 10;
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerCard, setShowPlayerCard] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<Player[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState<string>("score");

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
              <div className="w-1/3 bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex flex-col items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg mb-6">
                    <span className="text-4xl font-bold text-white">
                      {player.firstName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{player.firstName}</h2>
                  <p className="text-gray-600 mb-4">@{player.username}</p>
                  <div className="bg-white rounded-lg p-4 shadow-md">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{performanceData.score}</div>
                    <div className="text-sm text-gray-500">Global Score</div>
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
                        <span className="font-semibold">#{player.rank}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">City</span>
                        <span className="font-semibold">{player.city}</span>
                      </div>
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
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">
                    {player.firstName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{player.firstName}</h2>
                <p className="text-gray-600 mb-3">@{player.username}</p>
                <div className="bg-white rounded-lg p-3 shadow-md inline-block">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{performanceData.score}</div>
                  <div className="text-xs text-gray-500">Global Score</div>
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
                        <span className="text-sm font-semibold">#{player.rank}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">City</span>
                        <span className="text-sm font-semibold">{player.city}</span>
                      </div>
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

            // Parse MVP count from TMVP🔒 column
            let mvpCount = 0;
            const hasMvpCount = headers.some(h => h.includes('TMVP🔒'));
            
            if (hasMvpCount) {
              const mvpCountIndex = headers.findIndex(h => h.includes('TMVP🔒'));
              const mvpCountValue = row[mvpCountIndex]?.trim();
              
              if (mvpCountValue && mvpCountValue !== '#REF!' && mvpCountValue !== '#N/A' && mvpCountValue !== '#ERROR!' && mvpCountValue !== '') {
                mvpCount = parseInt(mvpCountValue) || 0;
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
              mvpCount: mvpCount,                        // TMVP🔒 column - MVP count
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

  // Effect to handle city filtering, sorting and search
  useEffect(() => {
    
    setCurrentPage(1);
    
    // If there's an active search query, don't apply city filtering
    if (searchQuery.trim().length > 0) {
      return; // Search results are handled by handleSuggestionClick
    }
    
    let filtered = players;
    
    // Apply city filtering when no search is active
    if (selectedCity !== "Toutes les villes" && selectedCity !== "جميع المدن") {
      filtered = players.filter(player => {
        const cities = player.city.split(',').map(city => city.trim());
        return cities.includes(selectedCity);
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
        case "score":
        default:
          return b.globalScore - a.globalScore;
      }
    });
    
    // Recalculate ranks
    const rerankedFiltered = sortedPlayers.map((player, index) => ({
        ...player,
        cityRank: index + 1
      }));
      setFilteredPlayers(rerankedFiltered);
  }, [selectedCity, players, searchQuery, loading, error, sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
  const startIndex = (currentPage - 1) * playersPerPage;
  const endIndex = startIndex + playersPerPage;
  const currentPlayers = filteredPlayers.slice(startIndex, endIndex);

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
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
    <section id="leaderboard" className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">

        
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
                      <h2 className="text-lg font-bold text-white leading-none">Classement</h2>
                      <p className="text-gray-400 text-xs font-medium">Meilleurs joueurs & Statistiques</p>
                    </div>
                  </div>
                  
                  {/* Stats indicator */}
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-400 text-xs font-medium">{players.length} joueurs</span>
                  </div>
                </div>
              </div>
            </div>
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
        {/* Ultra Modern Compact Filters - Stacked on Mobile, Side by Side on Desktop */}
        <RevealAnimation delay={0.15}>
          <div className="mb-4 flex flex-col gap-3">
            {/* Filters Row */}
            <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-3">
            {/* City Filter */}
            <div className="relative">
              {/* Filter Box */}
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl md:rounded-2xl p-0.5 md:p-1 shadow-lg">
                <div className="bg-white rounded-lg md:rounded-xl px-2 md:px-4 py-1.5 md:py-2 flex items-center gap-2 md:gap-3 min-w-[140px] md:min-w-[200px]">
                  {/* Filter Icon */}
                  <div className="w-4 h-4 md:w-5 md:h-5 bg-gradient-to-br from-pink-500 to-pink-600 rounded-md md:rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiTarget className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
              </div>
                  
                  {/* Filter Label */}
                  <span className="text-gray-700 font-semibold text-xs md:text-sm truncate">{selectedCity}</span>
                  
                  {/* Dropdown Arrow */}
                  <div className="ml-auto">
                    <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                  </div>
                  
                  {/* Dropdown Select */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none'
                    }}
                  >
                    <option 
                      value="Toutes les villes"
                      className="bg-pink-800 text-white hover:bg-gradient-to-r hover:from-pink-600 hover:to-pink-700 hover:text-white focus:bg-gradient-to-r focus:from-pink-600 focus:to-pink-700 focus:text-white"
                      style={{
                        backgroundColor: '#9d174d',
                        color: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                >
                  {content.allCities}
                    </option>
                    <option 
                      value="Casablanca"
                      className="bg-pink-800 text-white hover:bg-gradient-to-r hover:from-pink-600 hover:to-pink-700 hover:text-white focus:bg-gradient-to-r focus:from-pink-600 focus:to-pink-700 focus:text-white"
                      style={{
                        backgroundColor: '#9d174d',
                        color: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                >
                  Casablanca
                    </option>
                    <option 
                      value="Berrechid"
                      className="bg-pink-800 text-white hover:bg-gradient-to-r hover:from-pink-600 hover:to-pink-700 hover:text-white focus:bg-gradient-to-r focus:from-pink-600 focus:to-pink-700 focus:text-white"
                      style={{
                        backgroundColor: '#9d174d',
                        color: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                >
                  Berrechid
                    </option>
                {availableCities.filter(city => !['Casablanca', 'Berrechid'].includes(city)).map(city => (
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
                    {city}
                      </option>
                ))}
                  </select>
              </div>
            </div>
          </div>

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
                  <span className="text-gray-700 font-semibold text-xs md:text-sm truncate">{sortBy === 'score' ? 'Score' : sortBy === 'goals' ? 'Buts' : sortBy === 'assists' ? 'Passes' : sortBy === 'attack' ? 'Attaque' : sortBy === 'defense' ? 'Défense' : sortBy === 'matches' ? 'Matches' : sortBy === 'mvp_count' ? 'MVP Count' : sortBy === 'mvp_average' ? 'MVP Average' : sortBy === 'goals_average' ? 'Goals Average' : 'Assists Average'}</span>
                  
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
                      value="score"
                      className="bg-blue-800 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:text-white focus:bg-gradient-to-r focus:from-blue-600 focus:to-blue-700 focus:text-white"
                      style={{
                        backgroundColor: '#1e40af',
                        color: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      Score
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
                      Buts
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
                      value="attack"
                      className="bg-blue-800 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:text-white focus:bg-gradient-to-r focus:from-blue-600 focus:to-blue-700 focus:text-white"
                      style={{
                        backgroundColor: '#1e40af',
                        color: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      Attaque
                    </option>
                    <option 
                      value="defense"
                      className="bg-blue-800 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:text-white focus:bg-gradient-to-r focus:from-blue-600 focus:to-blue-700 focus:text-white"
                      style={{
                        backgroundColor: '#1e40af',
                        color: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      Défense
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
                      Matches
                    </option>
                    <option 
                      value="mvp_count"
                      className="bg-blue-800 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:text-white focus:bg-gradient-to-r focus:from-blue-600 focus:to-blue-700 focus:text-white"
                      style={{
                        backgroundColor: '#1e40af',
                        color: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      MVP Count
                    </option>
                    <option 
                      value="mvp_average"
                      className="bg-blue-800 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:text-white focus:bg-gradient-to-r focus:from-blue-600 focus:to-blue-700 focus:text-white"
                      style={{
                        backgroundColor: '#1e40af',
                        color: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      MVP Average
                    </option>
                    <option 
                      value="goals_average"
                      className="bg-blue-800 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:text-white focus:bg-gradient-to-r focus:from-blue-600 focus:to-blue-700 focus:text-white"
                      style={{
                        backgroundColor: '#1e40af',
                        color: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      Goals Average
                    </option>
                    <option 
                      value="assists_average"
                      className="bg-blue-800 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:text-white focus:bg-gradient-to-r focus:from-blue-600 focus:to-blue-700 focus:text-white"
                      style={{
                        backgroundColor: '#1e40af',
                        color: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      Assists Average
                    </option>
              </select>
            </div>
        </div>
            </div>
        </div>

            {/* Pagination Controls - Desktop: Right side, Mobile: Below */}
            {totalPages > 1 && (
              <div className="hidden md:flex items-center justify-center gap-2">
                {/* Compact Page Info */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl px-3 py-1.5 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                      {currentPage}/{totalPages}
                    </span>
                    <span className="text-gray-500">
                      {startIndex + 1}-{Math.min(endIndex, filteredPlayers.length)}
                    </span>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-1">
                  {/* Previous Button */}
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
                    }`}
                  >
                    <ChevronUp size={16} />
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
                    }`}
                  >
                    <ChevronDown size={16} />
                  </button>
                              </div>
                          </div>
            )}

            {/* Pagination Controls - Mobile: Below filters */}
            {totalPages > 1 && (
              <div className="flex md:hidden items-center justify-center gap-3">
                {/* Compact Page Info */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl px-4 py-2 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 text-xs font-medium text-gray-600">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                      {currentPage}/{totalPages}
                          </span>
                    <span className="text-gray-500">
                      {startIndex + 1}-{Math.min(endIndex, filteredPlayers.length)} sur {filteredPlayers.length}
                          </span>
                          </div>
            </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
                    }`}
                  >
                    <ChevronUp size={18} />
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
                    }`}
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
              </div>
            )}
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
                            {/* Rank Badge */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isTopThree 
                              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' 
                              : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                          }`}>
                              {getRankDisplay(currentRank)}
                      </div>
                            
                            {/* Player Info */}
                          <div className="min-w-0 flex-1">
                              <div className="font-bold text-sm text-gray-900 truncate">{player.username}</div>
                              <div className="text-xs text-gray-500 truncate">{player.globalScore.toFixed(1)} • {player.city}</div>
                    </div>
                  </div>

                          {/* Right: All Stats in One Row */}
                          <div className="flex items-center gap-1 md:gap-3 text-xs font-semibold flex-shrink-0">
                            {/* Dynamic Sort Stat - hide when sorting by matches since it's already shown */}
                            {sortBy !== 'matches' && (
                              <div className="text-center min-w-[35px] md:min-w-[50px]">
                                <div className={`font-bold text-xs ${
                                  sortBy === 'score' ? 'text-blue-600' :
                                  sortBy === 'goals' ? 'text-green-600' :
                                  sortBy === 'assists' ? 'text-purple-600' :
                                  sortBy === 'attack' ? 'text-orange-600' :
                                  sortBy === 'defense' ? 'text-blue-600' :
                                sortBy === 'mvp_count' ? 'text-yellow-600' :
                                sortBy === 'mvp_average' ? 'text-yellow-600' :
                                sortBy === 'goals_average' ? 'text-green-600' :
                                sortBy === 'assists_average' ? 'text-purple-600' :
                                'text-gray-600'
                                }`}>
                                  {sortBy === 'score' ? player.globalScore.toFixed(1) :
                                   sortBy === 'goals' ? player.goals :
                                   sortBy === 'assists' ? player.assists :
                                   sortBy === 'attack' ? (player.attackRatio ? Math.round(player.attackRatio) : 0) + '%' :
                                   sortBy === 'defense' ? (player.defenseRatio ? Math.round(player.defenseRatio) : 0) + '%' :
                                   sortBy === 'mvp_count' ? (player.mvpCount || 0) :
                                   sortBy === 'mvp_average' ? (player.gamesPlayed > 0 ? ((player.mvpCount || 0) / player.gamesPlayed).toFixed(1) : '0.0') :
                                   sortBy === 'goals_average' ? (player.gamesPlayed > 0 ? (player.goals / player.gamesPlayed).toFixed(1) : '0.0') :
                                   sortBy === 'assists_average' ? (player.gamesPlayed > 0 ? (player.assists / player.gamesPlayed).toFixed(1) : '0.0') :
                                   player.gamesPlayed}
                    </div>
                                <div className="text-gray-400 text-xs">
                                  {sortBy === 'score' ? 'Score' :
                                   sortBy === 'goals' ? 'Buts' :
                                   sortBy === 'assists' ? 'Pass' :
                                   sortBy === 'attack' ? 'ATT' :
                                   sortBy === 'defense' ? 'DEF' :
                                   sortBy === 'mvp_count' ? 'MVP' :
                                   sortBy === 'mvp_average' ? 'MVP Avg' :
                                   sortBy === 'goals_average' ? 'Goals Avg' :
                                   sortBy === 'assists_average' ? 'Pass Avg' :
                                   'Match'}
                    </div>
                  </div>
                            )}
                            
                            {/* Always show matches */}
                            <div className="text-center min-w-[25px] md:min-w-[30px]">
                              <div className="text-gray-600 font-bold text-xs">{player.gamesPlayed}</div>
                              <div className="text-gray-400 text-xs">Match</div>
                          </div>
                            
                            {/* Show additional stats for score, goals, assists, and matches */}
                            {(sortBy === 'score' || sortBy === 'goals' || sortBy === 'assists' || sortBy === 'matches') && (
                              <>
                                {/* Attack/Defense */}
                                <div className="text-center min-w-[35px] md:min-w-[50px]">
                                  <div className="text-orange-600 font-bold text-xs">
                                    {player.attackRatio ? Math.round(player.attackRatio) : 0}%
                        </div>
                                  <div className="text-gray-400 text-xs">ATT</div>
                    </div>
                    
                                <div className="text-center min-w-[35px] md:min-w-[50px]">
                                  <div className="text-blue-600 font-bold text-xs">
                                    {player.defenseRatio ? Math.round(player.defenseRatio) : 0}%
                      </div>
                                  <div className="text-gray-400 text-xs">DEF</div>
                                </div>
                              </>
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
                <div className="text-lg">{content.noData}</div>
            </div>
          )}
            </div>
          </RevealAnimation>



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