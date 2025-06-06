import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FiCalendar, FiMapPin, FiClock, FiUsers, FiCheck, FiX, FiStar, FiRefreshCw, FiFilter } from "react-icons/fi";
import { TbBuildingStadium } from "react-icons/tb";
import { trackEvent } from "@/lib/analytics";

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
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);

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
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="match-details-description">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-rayoblue">
              Détails du Match {selectedMatch.gameId}
            </DialogTitle>
            <div id="match-details-description" className="text-sm text-gray-600 mt-2">
              Informations complètes du match incluant le terrain, les horaires et la liste des joueurs
            </div>
          </DialogHeader>
          
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
              
              <div className="space-y-2">
                {selectedMatch.players
                  .sort((a, b) => a.ranking - b.ranking)
                  .map((player) => (
                  <div 
                    key={player.id}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-lg p-3 hover:shadow-md transition-shadow text-white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 relative"
                          style={{
                            background: `linear-gradient(135deg, 
                              ${player.isNewPlayer ? '#10b981, #059669' : '#3b82f6, #1d4ed8'})`
                          }}
                        >
                          <span className="font-bold text-white text-sm">
                            {player.username.charAt(0).toUpperCase()}
                          </span>
                          {player.isNewPlayer && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                              <FiStar className="w-2 h-2 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-white text-sm sm:text-base truncate block">
                            {player.username}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end text-right flex-shrink-0">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <span className="text-blue-400 font-semibold">#{player.ranking}</span>
                          <span className="text-gray-400">score {player.globalScore.toFixed(1)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {player.gamesPlayed} matchs
                        </div>
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

        <div className="space-y-6">
          {matches.map((match, index) => (
            <RevealAnimation key={match.id} delay={index * 0.1}>
              <div className="space-y-2">
                {/* Date en dehors de la carte */}
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {formatDayName(match.date)}
                  </h3>
                  <p className="text-gray-600 text-base font-medium">{formatDateWithoutYear(match.date)}</p>
                </div>
                
                <div 
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-700 text-white"
                  onClick={() => setSelectedMatch(match)}
                >
                    <div className="p-6">
                      {/* En haut : Heure et Terrain */}
                      <div className="flex justify-between items-start mb-4 gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <h3 className="text-xl font-bold text-white">
                              {match.time}
                            </h3>
                            <span className="text-gray-400 text-sm whitespace-nowrap">
                              {match.format}
                            </span>
                          </div>
                          <p className="text-lg text-gray-300 truncate">
                            {match.field}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const isMatchFull = match.players.length >= match.maxPlayers;
                            trackEvent('join_match_whatsapp', 'user_engagement', `Game_${match.gameId}`);
                            const message = isMatchFull 
                              ? `Bonjour, je souhaite rejoindre la liste d'attente pour ce match:%0A%0AGame ${match.gameId}%0ADate: ${formatDate(match.date)}%0AHeure: ${match.time}%0AEndroit: ${match.field}, ${match.city}%0A%0AMerci!`
                              : `Bonjour, je souhaite jouer ce match:%0A%0AGame ${match.gameId}%0ADate: ${formatDate(match.date)}%0AHeure: ${match.time}%0AEndroit: ${match.field}, ${match.city}%0A%0AMerci!`;
                            const whatsappUrl = `https://wa.me/212649076758?text=${message}`;
                            window.open(whatsappUrl, '_blank');
                          }}
                          className={`px-3 py-2 rounded-full text-white transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 text-xs sm:text-sm flex-shrink-0 whitespace-nowrap ${
                            match.players.length >= match.maxPlayers
                              ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                              : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                          }`}
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z"/>
                          </svg>
                          <span className="hidden sm:inline">
                            {match.players.length >= match.maxPlayers ? "Rejoindre Waitlist" : "Rejoindre"}
                          </span>
                          <span className="sm:hidden">
                            {match.players.length >= match.maxPlayers ? "Waitlist" : "Rejoindre"}
                          </span>
                        </button>
                      </div>

                      {/* Milieu : Adresse et ville */}
                      <div className="mb-6 pb-4 border-b border-gray-600">
                        <div className="flex items-center gap-2">
                          <FiMapPin className="text-blue-400 w-4 h-4" />
                          <p className="text-white text-lg font-semibold">{match.city}</p>
                        </div>
                      </div>

                      {/* Bas : Note moyenne + avatars à gauche, barre de progression à droite */}
                      <div className="flex justify-between items-end">
                        {/* Gauche : Note moyenne et avatars */}
                        <div>
                          <div className="mb-3">
                            <p className="text-gray-400 text-sm mb-1">Score moyen</p>
                            <p className="text-white text-2xl font-bold">
                              {(match.players.reduce((sum, p) => sum + p.globalScore, 0) / match.players.length).toFixed(1)}
                            </p>
                          </div>
                          
                          {/* Avatars des joueurs */}
                          <div className="flex -space-x-3">
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
                                  +{match.players.length - 5}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Droite : Barre de progression */}
                        <div className="text-right">
                          <p className="text-gray-400 text-sm mb-2">
                            {match.players.length >= match.maxPlayers ? "Complet" : "Places disponibles"}
                          </p>
                          <p className="text-white text-xl font-bold mb-2">
                            {match.players.length >= match.maxPlayers ? "0/15" : `${match.maxPlayers - match.players.length}/15`}
                          </p>
                          
                          {/* Barre de progression sans filtre */}
                          <div className="relative bg-gradient-to-r from-gray-600 to-gray-700 rounded-full px-3 py-1 shadow-inner border border-gray-600">
                            <div className="relative w-16 h-2 bg-gray-600 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ease-out ${
                                  match.status === "Complet" 
                                    ? "bg-gradient-to-r from-green-400 via-emerald-500 to-green-600" 
                                    : "bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600"
                                } shadow-sm`}
                                style={{ 
                                  width: `${Math.min((match.players.length / match.maxPlayers) * 100, 100)}%`,
                                  boxShadow: "0 0 6px rgba(59, 130, 246, 0.3)"
                                }}
                              />
                              {match.status === "Complet" && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bouton partage en bas de la carte - mobile uniquement */}
                      <div className="mt-4 pt-4 border-t border-gray-600 flex justify-center sm:hidden">
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
      
      {/* Modal WhatsApp */}
      {showWhatsappModal && <WhatsAppModal isOpen={showWhatsappModal} onClose={() => setShowWhatsappModal(false)} />}
    </section>
  );
};

export default UpcomingMatchesSection;