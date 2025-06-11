import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FiCalendar, FiMapPin, FiClock, FiUsers, FiCheck, FiX, FiStar, FiRefreshCw, FiFilter } from "react-icons/fi";
import { TbBuildingStadium } from "react-icons/tb";
import { trackEvent } from "@/lib/analytics";

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
  team?: "Orange" | "Jaune" | "Blue";
}

interface TeamPlayer {
  id: string;
  username: string;
  fullName: string;
  jerseyNumber: number;
  paymentStatus: "Payé" | "Non payé" | "Nouveau joueur" | "Subscription";
}

interface Team {
  name: "Orange" | "Jaune" | "Blue";
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
}

// Configuration Google Sheets
const MATCHES_SHEET_CONFIG = {
  csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDgQfkyS5KdTwQABcUDgu673_fSDrwX0HNgGeZiZ5DbSK6UEmYIcUrWPGsAGN5yuL50M6I3rYIJInL/pub?gid=216631647&output=csv"
};

// Fonction pour créer les équipes basées sur les vrais joueurs
const createTeamsFromPlayers = (players: Player[]): Team[] => {
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
        paymentStatus: player.paymentStatus
      };
      
      teamMap.get(player.team)!.push(teamPlayer);
    }
  });
  
  // Créer les équipes avec leurs couleurs
  const teams: Team[] = [];
  
  if (teamMap.has("Orange")) {
    // Sort players by ranking within the team
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
    // Sort players by ranking within the team
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
    // Sort players by ranking within the team
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
      const row = [];
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
      
      const gameId = row[0]?.trim(); // GameID
      const terrain = hasTerrain ? row[1]?.trim() : null; // Terrain (if exists)
      const dateTime = hasTerrain ? row[2]?.trim() : row[1]?.trim(); // Date
      const city = hasTerrain ? row[3]?.trim() : row[2]?.trim(); // City
      const status = hasTerrain ? row[4]?.trim() : row[3]?.trim(); // Status
      const playerUsername = hasTerrain ? row[5]?.trim() : row[4]?.trim(); // PlayerUsername
      const matchCount = parseInt(hasTerrain ? row[6] : row[5]) || 0; // Match (games played)
      const score = parseFloat(hasTerrain ? row[7] : row[6]) || 0; // Score
      const rank = parseInt(hasTerrain ? row[8] : row[7]) || 0; // Rank
      
      // Extraire l'équipe, le numéro et le statut de paiement si ils existent
      let teamLetter = '';
      let playerNumber = null;
      let paymentStatus = '';
      
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
      
      // Ajouter le joueur seulement s'il existe
      if (playerUsername && playerUsername.trim()) {
        // Déterminer si c'est un nouveau joueur (0 matchs joués)
        const isNewPlayer = matchCount === 0;
        
        // Mapper les équipes directement par nom de couleur
        let teamName: "Orange" | "Jaune" | "Blue" | undefined;
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
          // Support legacy mapping A->Orange, B->Jaune, C->Blue
          case 'a':
            teamName = "Orange";
            break;
          case 'b':
            teamName = "Jaune";
            break;
          case 'c':
            teamName = "Blue";
            break;
        }

        // Mapper le statut de paiement depuis la colonne CSV
        let finalPaymentStatus: "Payé" | "Non payé" | "Nouveau joueur" | "Subscription";
        
        if (paymentStatus.toLowerCase() === 'sub') {
          finalPaymentStatus = "Subscription";
        } else if (paymentStatus.toLowerCase() === 'pay') {
          finalPaymentStatus = "Payé";
        } else if (paymentStatus.toLowerCase() === 'nopay') {
          finalPaymentStatus = "Non payé";
        } else {
          // Fallback pour les anciennes données ou valeurs manquantes
          finalPaymentStatus = isNewPlayer ? "Nouveau joueur" : "Non payé";
        }

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
          jerseyNumber: playerNumber ?? undefined
        };
        
        const match = matchesMap.get(gameId)!;
        
        // Vérifier si le joueur existe déjà dans ce match (éviter les doublons)
        const existingPlayer = match.players.find(p => 
          p.username.toLowerCase() === playerUsername.toLowerCase() || 
          p.id === player.id
        );
        
        if (!existingPlayer) {
          match.players.push(player);
        }
      }
    }
    
    // Mettre à jour le statut de tous les matchs et créer les équipes
    Array.from(matchesMap.values()).forEach(matchItem => {
      matchItem.status = matchItem.players.length >= matchItem.maxPlayers ? "Complet" : "Besoin d'autres joueurs";
      
      // Créer les équipes seulement pour les matchs complets (15 joueurs) qui ont des équipes assignées
      if (matchItem.players.length === 15 && matchItem.players.some(p => p.team)) {
        matchItem.teams = createTeamsFromPlayers(matchItem.players);
      }
    });
    
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
                  {selectedMatch.status === "Complet" ? " (3 x 5 joueurs)" : ` (${selectedMatch.players.length}/${selectedMatch.maxPlayers} joueurs)`}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {selectedMatch.teams.map((team, teamIndex) => (
                    <div key={team.name} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                      {/* En-tête de l'équipe avec gradient */}
                      <div className={`${team.color} bg-gradient-to-r text-white p-4 text-center relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                        <div className="relative z-10">
                          <h4 className="font-bold text-xl mb-1">Équipe {team.name}</h4>
                          <div className="text-sm opacity-90 font-medium">
                            {team.players.length} joueurs • Moy: {
                              (selectedMatch.players
                                .filter(p => p.team === team.name)
                                .reduce((sum, p) => sum + p.globalScore, 0) / 
                               selectedMatch.players.filter(p => p.team === team.name).length
                              ).toFixed(1)
                            }
                          </div>
                        </div>
                      </div>
                      
                      {/* Score moyen de l'équipe */}
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                        <div className="text-center text-sm text-gray-700">
                          <span className="font-semibold">Équipe {team.name}</span> • Score moyen: 
                          <span className="font-bold text-blue-600 ml-1">
                            {selectedMatch.players.filter(p => p.team === team.name).length > 0
                              ? (selectedMatch.players
                                  .filter(p => p.team === team.name)
                                  .reduce((sum, p) => sum + p.globalScore, 0) / 
                                 selectedMatch.players.filter(p => p.team === team.name).length
                                ).toFixed(1)
                              : '0.0'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Liste des joueurs de l'équipe */}
                      <div className="p-4 space-y-3">
                        {team.players.map((player, playerIndex) => (
                          <div 
                            key={player.id}
                            className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 hover:from-blue-50 hover:to-indigo-50 hover:shadow-md transition-all duration-200 border border-gray-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {/* Numéro de maillot avec style amélioré */}
                                <div className={`w-10 h-10 ${team.color} text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg hover:scale-110 transition-transform duration-200`}>
                                  {player.jerseyNumber}
                                </div>
                                
                                {/* Info joueur */}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 text-sm truncate flex items-center gap-1">
                                    {player.fullName}
                                    {/* Tag "New Player" pour les joueurs avec 0 match */}
                                    {selectedMatch.players.find(p => p.id === player.id)?.gamesPlayed === 0 && (
                                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                                        Nouveau
                                      </span>
                                    )}
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
                              
                              {/* Statut avec cercle coloré ou étoile */}
                              <div className="flex items-center gap-2">
                                {player.paymentStatus === "Subscription" ? (
                                  <FiStar className="w-4 h-4 text-green-500 fill-current" />
                                ) : (
                                  <div className={`w-4 h-4 rounded-full ${
                                    player.paymentStatus === "Payé" 
                                      ? "bg-green-500 shadow-green-500/50 shadow-lg" 
                                      : player.paymentStatus === "Non payé"
                                      ? "bg-red-500 shadow-red-500/50 shadow-lg"
                                      : "bg-orange-500 shadow-orange-500/50 shadow-lg"
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
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white text-sm sm:text-base truncate">
                                {player.username}
                              </span>
                              {/* Tag "New Player" pour les joueurs avec 0 match */}
                              {player.gamesPlayed === 0 && (
                                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                                  Nouveau
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end text-right flex-shrink-0">
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <span className="text-blue-400 font-semibold">#{player.ranking}</span>
                            <span className="text-gray-400">score {player.globalScore.toFixed(1)}</span>
                            {/* Statut de paiement */}
                            {player.paymentStatus === "Subscription" ? (
                              <FiStar className="w-4 h-4 text-green-500 fill-current" />
                            ) : (
                              <div className={`w-4 h-4 rounded-full ${
                                player.paymentStatus === "Payé" 
                                  ? "bg-green-500 shadow-green-500/50 shadow-lg" 
                                  : "bg-red-500 shadow-red-500/50 shadow-lg"
                              }`}></div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-purple-400 font-semibold">{player.gamesPlayed}</span> matchs
                            </div>
                            <div>
                              <span className="text-blue-400 font-semibold">#{player.ranking}</span> rang global
                            </div>
                          </div>
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
                onChange={(e) => setSelectedCity(e.target.value)}
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

        <div className="space-y-6">
          {filteredMatches.map((match, index) => (
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
    </section>
  );
};

export default UpcomingMatchesSection;