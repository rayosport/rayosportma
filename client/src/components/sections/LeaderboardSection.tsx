import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { FaTrophy, FaMedal, FaAward, FaUser, FaGamepad } from "react-icons/fa";
import { ChevronDown, ChevronUp } from "lucide-react";

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
}

// Configuration Google Sheets - URL publique CSV
const GOOGLE_SHEETS_CONFIG = {
  csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSDgQfkyS5KdTwQABcUDgu673_fSDrwX0HNgGeZiZ5DbSK6UEmYIcUrWPGsAGN5yuL50M6I3rYIJInL/pub?gid=1779046147&single=true&output=csv',
};

const LeaderboardSection = () => {
  const { language } = useLanguage();
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("All Cities");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [showMorePlayers, setShowMorePlayers] = useState(false);

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
    allCities: "All Cities",
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

  // Fonction pour récupérer les données depuis Google Sheets CSV
  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer des données fraîches à chaque requête
      const response = await fetch(GOOGLE_SHEETS_CONFIG.csvUrl, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const csvText = await response.text();
      const rows = parseCSV(csvText);
      
      if (rows.length > 1) { // Ignorer la première ligne (en-têtes)
        const playersData = rows.slice(1)
          .filter(row => row[1] && row[1].trim() !== '' && row[1] !== '#VALUE!') // Filtrer les lignes avec des noms valides
          .map((row: string[]) => {
            return {
              rank: 0, // Sera mis à jour après le tri
              cityRank: 0, // Sera calculé selon le filtre
              firstName: row[1] || 'Joueur',             // Colonne B - First name
              username: row[2] || 'Username',            // Colonne C - Username
              city: row[3] || 'Non spécifié',            // Colonne D - Main City
              globalScore: parseFloat(row[5]) || 0,      // Colonne F - Global Score
              gamesPlayed: parseInt(row[6]) || 0,        // Colonne G - TGame played
              goals: parseInt(row[7]) || 0,              // Colonne H - TGoals
              assists: parseInt(row[8]) || 0,            // Colonne I - Assists
              teamWins: parseInt(row[9]) || 0            // Colonne J - Team Wins
            };
          });
        
        // Trier par Global Score (ordre décroissant)
        const sortedPlayers = playersData.sort((a, b) => b.globalScore - a.globalScore);
        
        // Mettre à jour les rangs après le tri
        const rankedPlayers = sortedPlayers.map((player, index) => ({
          ...player,
          rank: index + 1
        }));

        // Extraire les villes uniques (gérer le cas des villes multiples séparées par des virgules)
        const allCities = rankedPlayers.flatMap(player => 
          player.city.split(',').map(city => city.trim())
        ).filter(city => city && city !== 'Non spécifié');
        const cities = Array.from(new Set(allCities));
        setAvailableCities(cities);
        
        setPlayers(rankedPlayers);
        setFilteredPlayers(rankedPlayers);
      } else {
        setPlayers([]);
        setFilteredPlayers([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les données au montage du composant
  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  // Effet pour filtrer par ville
  useEffect(() => {
    // Réinitialiser l'état "voir plus" quand on change de ville
    setShowMorePlayers(false);
    
    if (selectedCity === "All Cities" || selectedCity === "جميع المدن") {
      setFilteredPlayers(players);
    } else {
      // Filtrer les joueurs qui ont joué dans la ville sélectionnée
      // Gérer le cas où un joueur a joué dans plusieurs villes (séparées par des virgules)
      const filtered = players.filter(player => {
        const cities = player.city.split(',').map(city => city.trim());
        return cities.includes(selectedCity);
      });
      
      // Trier par Global Score pour cette ville
      const sortedFiltered = filtered.sort((a, b) => b.globalScore - a.globalScore);
      
      // Recalculer les rangs pour la ville filtrée (cityRank)
      const rerankedFiltered = sortedFiltered.map((player, index) => ({
        ...player,
        cityRank: index + 1
      }));
      setFilteredPlayers(rerankedFiltered);
    }
  }, [selectedCity, players]);

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

  if (error) {
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

        {/* Filtre par ville */}
        <RevealAnimation delay={0.2}>
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
                <option value="All Cities">{content.allCities}</option>
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
                  onClick={() => setSelectedCity("All Cities")}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCity === "All Cities"
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



        {/* Tableau des scores - Desktop */}
        <RevealAnimation delay={0.4}>
          <div className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-4 py-4 text-left font-semibold">{selectedCity !== "All Cities" ? content.cityRank : content.rank}</th>
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
                        className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                          (selectedCity === "All Cities" ? player.rank : player.cityRank) <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                        }`}
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
                  className={`bg-white rounded-lg shadow-md p-3 border-l-4 ${
                    (selectedCity === "All Cities" ? player.rank : player.cityRank) <= 3 
                      ? 'border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50' 
                      : 'border-l-blue-500'
                  }`}
                >
                  {/* En-tête compact */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getRankIcon(selectedCity !== "All Cities" ? player.cityRank : player.rank)}
                      <div>
                        <div className="font-bold text-base text-gray-900">{player.firstName}</div>
                        <div className="text-xs text-gray-600">@{player.username}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">#{selectedCity !== "All Cities" ? player.cityRank : player.rank}</div>
                      <div className="text-xs text-blue-600">{player.city}</div>
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
                      <span className="text-purple-600">{player.assists} passes</span>
                      <span className="text-orange-600">{player.teamWins} wins</span>
                    </div>
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

        {/* Statistiques */}
        {filteredPlayers.length > 0 && (
          <RevealAnimation delay={0.6}>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 text-center">
                <div className="text-2xl md:text-3xl font-bold text-blue-600">{filteredPlayers.length}</div>
                <div className="text-gray-600 text-sm md:text-base">Joueurs actifs</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 text-center">
                <div className="text-2xl md:text-3xl font-bold text-green-600">
                  {filteredPlayers.reduce((sum, player) => sum + player.goals, 0)}
                </div>
                <div className="text-gray-600 text-sm md:text-base">Total des buts</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 text-center">
                <div className="text-2xl md:text-3xl font-bold text-purple-600">
                  {filteredPlayers.reduce((sum, player) => sum + player.assists, 0)}
                </div>
                <div className="text-gray-600 text-sm md:text-base">Total des passes</div>
              </div>

            </div>
          </RevealAnimation>
        )}
      </div>
    </section>
  );
};

export default LeaderboardSection;