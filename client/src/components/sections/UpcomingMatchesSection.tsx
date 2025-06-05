import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FiCalendar, FiMapPin, FiClock, FiUsers, FiCheck, FiX, FiStar, FiRefreshCw } from "react-icons/fi";
import { TbBuildingStadium } from "react-icons/tb";

// Types pour les matchs
interface Player {
  id: string;
  username: string;
  fullName: string;
  globalScore: number;
  gamesPlayed: number;
  ranking: number;
  cityRanking: number;
  paymentStatus: "Payé" | "Non payé" | "Nouveau joueur";
  isNewPlayer: boolean;
  goals?: number;
  assists?: number;
  teamWins?: number;
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
}

// Configuration Google Sheets
const MATCHES_SHEET_CONFIG = {
  csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDgQfkyS5KdTwQABcUDgu673_fSDrwX0HNgGeZiZ5DbSK6UEmYIcUrWPGsAGN5yuL50M6I3rYIJInL/pub?gid=216631647&output=csv"
};

const UpcomingMatchesSection = () => {
  const { t } = useLanguage();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

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

      const row = line.split(',').map(cell => cell.trim().replace(/"/g, '').replace(/\r/g, ''));
      
      // Dynamic parsing to handle both sheet formats
      const hasTerrain = headers.includes('Terrain');
      const gameId = row[0]?.trim(); // GameID
      const terrain = hasTerrain ? row[1]?.trim() : null; // Terrain (if exists)
      const dateTime = hasTerrain ? row[2]?.trim() : row[1]?.trim(); // Date
      const city = hasTerrain ? row[3]?.trim() : row[2]?.trim(); // City
      const status = hasTerrain ? row[4]?.trim() : row[3]?.trim(); // Status
      const playerUsername = hasTerrain ? row[5]?.trim() : row[4]?.trim(); // PlayerUsername
      const matchCount = parseInt(hasTerrain ? row[6] : row[5]) || 0; // Match (games played)
      const score = parseFloat(hasTerrain ? row[7] : row[6]) || 0; // Score
      const rank = parseInt(hasTerrain ? row[8] : row[7]) || 0; // Rank
      
      // Filtrer seulement les matchs programmés avec des joueurs valides
      if (status !== 'Scheduled' || !gameId || !playerUsername) continue;
      
      // Déterminer si c'est un nouveau joueur (0 matchs joués)
      const isNewPlayer = matchCount === 0;
      
      const player: Player = {
        id: `${gameId}_${playerUsername}`,
        username: playerUsername,
        fullName: playerUsername, // Utiliser username comme nom d'affichage
        globalScore: score,
        gamesPlayed: matchCount,
        ranking: rank,
        cityRanking: rank,
        paymentStatus: isNewPlayer ? "Nouveau joueur" : "Non payé",
        isNewPlayer: isNewPlayer
      };
      
      if (!matchesMap.has(gameId)) {
        // Parser la date et l'heure
        const dateObj = new Date(dateTime);
        const dateStr = dateObj.toISOString().split('T')[0];
        const timeStr = dateObj.toTimeString().slice(0, 5) + ' (60min)';
        
        const maxPlayers = 15;
        const match: Match = {
          id: `MATCH_${gameId}`,
          gameId: gameId,
          city: city || "Casablanca",
          field: terrain || "Terrain Rayo Sport",
          date: dateStr,
          time: timeStr,
          format: "5vs5",
          status: "Besoin d'autres joueurs",
          players: [],
          maxPlayers: maxPlayers
        };
        matchesMap.set(gameId, match);
      }
      
      const match = matchesMap.get(gameId)!;
      
      // Vérifier si le joueur existe déjà dans ce match (éviter les doublons)
      const existingPlayer = match.players.find(p => 
        p.username.toLowerCase() === playerUsername.toLowerCase() || 
        p.id === player.id
      );
      
      if (!existingPlayer) {
        match.players.push(player);
      }
      
      // Mettre à jour le statut en fonction du nombre de joueurs
      match.status = match.players.length >= match.maxPlayers ? "Complet" : "Besoin d'autres joueurs";
    }
    
    return Array.from(matchesMap.values());
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
      setMatches(parsedMatches);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Erreur lors du chargement des matchs:', err);
      setError('Impossible de charger les matchs à venir');
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    loadMatchesData();
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

  // Composant Modal des détails du match
  const MatchDetailsModal = () => {
    if (!selectedMatch) return null;

    return (
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="match-details-description">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-rayoblue">
              Détails du Match {selectedMatch.gameId}
            </DialogTitle>
          </DialogHeader>
          <div id="match-details-description" className="sr-only">
            Détails complets du match incluant les informations du terrain, horaires et liste des joueurs inscrits
          </div>
          
          <div className="space-y-6">
            {/* Informations du match */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <FiMapPin className="text-rayoblue" />
                  <span className="font-medium">{selectedMatch.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-rayoblue" />
                  <span>{formatDate(selectedMatch.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiClock className="text-rayoblue" />
                  <span>{selectedMatch.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiUsers className="text-rayoblue" />
                  <span>{selectedMatch.format}</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-600">Terrain: </span>
                <span className="font-medium">{selectedMatch.field}</span>
              </div>
            </div>

            {/* Note importante */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Les joueurs abonnés et ceux qui ont joué plusieurs matchs n'ont pas besoin de confirmation, car ils connaissent le concept.
              </p>
            </div>

            {/* Liste des joueurs */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Joueurs confirmés ({selectedMatch.players.length})
              </h3>
              
              <div className="space-y-3">
                {selectedMatch.players
                  .sort((a, b) => a.ranking - b.ranking)
                  .map((player) => (
                  <div 
                    key={player.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rayoblue bg-opacity-10 rounded-full flex items-center justify-center">
                          <span className="font-bold text-rayoblue">#{player.ranking}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">@{player.username}</span>
                            {player.isNewPlayer && (
                              <span className="px-2 py-1 text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            Score: {player.globalScore.toFixed(1)}/10
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                          player.isNewPlayer
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg" 
                            : "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                        }`}>
                          {player.isNewPlayer ? (
                            <>
                              <FiStar className="w-3 h-3" />
                              Nouveau joueur
                            </>
                          ) : (
                            <>
                              <FiUsers className="w-3 h-3" />
                              {player.gamesPlayed} matchs
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
              <button
                onClick={loadMatchesData}
                disabled={loading}
                className="relative overflow-hidden bg-gradient-to-r from-rayoblue to-blue-600 text-white px-6 py-3 rounded-xl hover:from-rayoblue/90 hover:to-blue-600/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-blue-500/20"
                title="Actualiser les données"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                <FiRefreshCw className={`w-5 h-5 relative z-10 ${loading ? 'animate-spin' : ''}`} />
                <span className="relative z-10">Actualiser</span>
                {loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-rayoblue/50 animate-pulse"></div>
                )}
              </button>
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

        <div className="space-y-4">
          {matches.map((match, index) => (
            <RevealAnimation key={match.id} delay={index * 0.1}>
              <div 
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer border border-gray-100"
                onClick={() => setSelectedMatch(match)}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Informations principales */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-4 mb-3">
                        <span className="bg-gradient-to-r from-rayoblue to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                          Game {match.gameId}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            match.status === "Complet" 
                              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md" 
                              : "bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md"
                          }`}>
                            {match.status}
                          </span>
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md">
                            Moy: {(match.players.reduce((sum, p) => sum + p.globalScore, 0) / match.players.length).toFixed(1)}/10
                          </span>
                        </div>
                        {/* Advanced Progress indicator */}
                        <div className="relative bg-gradient-to-r from-gray-50 to-gray-100 rounded-full px-4 py-2 shadow-inner border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="relative w-20 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ease-out ${
                                  match.status === "Complet" 
                                    ? "bg-gradient-to-r from-green-400 via-emerald-500 to-green-600" 
                                    : "bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600"
                                } shadow-sm`}
                                style={{ 
                                  width: `${Math.min((match.players.length / match.maxPlayers) * 100, 100)}%`,
                                  boxShadow: "0 0 8px rgba(59, 130, 246, 0.3)"
                                }}
                              />
                              {match.status === "Complet" && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-bold text-gray-800">
                                {match.players.length}
                              </span>
                              <span className="text-xs text-gray-500">/</span>
                              <span className="text-xs font-medium text-gray-600">
                                {match.maxPlayers}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg px-3 py-2 border-l-4 border-blue-400">
                          <FiMapPin className="text-blue-600 flex-shrink-0" />
                          <span className="font-semibold text-gray-800">{match.city}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg px-3 py-2 border-l-4 border-purple-400">
                          <FiCalendar className="text-purple-600 flex-shrink-0" />
                          <span className="font-semibold text-gray-800">{formatDate(match.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-green-100 rounded-lg px-3 py-2 border-l-4 border-green-400">
                          <FiClock className="text-green-600 flex-shrink-0" />
                          <span className="font-semibold text-gray-800">{match.time}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg px-3 py-2 border-l-4 border-orange-400">
                          {getFieldIcon()}
                          <span className="font-semibold text-gray-800">{match.field}</span>
                        </div>
                      </div>
                    </div>

                    {/* Avatars des joueurs */}
                    <div className="flex items-center justify-end">
                      <div className="flex -space-x-3">
                        {match.players.slice(0, 4).map((player, idx) => (
                          <div 
                            key={player.id}
                            className="relative w-10 h-10 rounded-full border-3 border-white shadow-lg overflow-hidden"
                            style={{
                              background: `linear-gradient(135deg, 
                                ${player.isNewPlayer ? '#10b981, #059669' : '#3b82f6, #1d4ed8'})`
                            }}
                          >
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {player.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {player.isNewPlayer && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                <FiStar className="w-2 h-2 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                        {match.players.length > 4 && (
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                            <span className="text-gray-600 font-bold text-xs">
                              +{match.players.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </RevealAnimation>
          ))}
        </div>

        {matches.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Aucun match à venir pour le moment</p>
          </div>
        )}
      </div>

      {/* Modal des détails */}
      <MatchDetailsModal />
    </section>
  );
};

export default UpcomingMatchesSection;