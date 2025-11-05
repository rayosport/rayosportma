// Import the sections for our new Rayo Sport website
import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";
import Footer from "@/components/layout/Footer";
import LeaderboardSectionComponent from "@/components/sections/LeaderboardSection";
import UpcomingMatchesSectionComponent from "@/components/sections/UpcomingMatchesSection";
import PastGamesSectionComponent from "@/components/sections/PastGamesSection";
import NextMatchCountdown from "@/components/ui/NextMatchCountdown";
import { useNav } from "@/hooks/use-intersection";
import { FiUsers, FiCalendar, FiActivity, FiAward, FiX, FiCheckCircle, FiCheck } from "react-icons/fi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trackEvent } from "@/lib/analytics";

// Cities Overview Section
const CitiesOverviewSection = ({ onJoinClick, onPlayerClick, onVoteClick }: { 
  onJoinClick: () => void; 
  onPlayerClick?: (username: string) => void;
  onVoteClick: () => void;
}) => {
  const { t } = useLanguage();
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [matchesData, setMatchesData] = useState<any[]>([]);
  const [sheetData, setSheetData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // Player search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Search functionality
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length >= 2) {
      const filtered = leaderboardData.filter(player => 
        player.username.toLowerCase().includes(value.toLowerCase()) ||
        player.firstName.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      setSearchSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (player: any) => {
    setSearchQuery(player.username);
    setShowSuggestions(false);
    if (onPlayerClick) {
      trackEvent('hero_search_player_select', 'user_engagement', player.username);
      onPlayerClick(player.username);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim() && onPlayerClick) {
      trackEvent('hero_search_player_submit', 'user_engagement', searchQuery);
      onPlayerClick(searchQuery.trim());
      setSearchQuery("");
      setShowSuggestions(false);
    }
  };

  // Fetch Sheet Total data
  useEffect(() => {
    const fetchSheetData = async () => {
      try {
        // Use CORS proxy to avoid CORS issues
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const sheetUrl = encodeURIComponent('https://docs.google.com/spreadsheets/d/e/2PACX-1vSDgQfkyS5KdTwQABcUDgu673_fSDrwX0HNgGeZiZ5DbSK6UEmYIcUrWPGsAGN5yuL50M6I3rYIJInL/pub?gid=601870692&output=csv');
        const response = await fetch(proxyUrl + sheetUrl);
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        const csvText = await response.text();
        console.log('CSV Response length:', csvText.length);
        console.log('CSV Response first 500 chars:', csvText.substring(0, 500));
        
        // Parse CSV data - Updated to match the actual Total sheet structure
        const parseCSV = (csvText: string) => {
          const lines = csvText.split('\n').filter(line => line.trim());
          const data: any = {};
          
          console.log('CSV lines for Sheet Total:', lines);
          
          // Skip header row (index 0), process data rows (indices 1-3)
          for (let i = 1; i < lines.length && i <= 3; i++) {
            const line = lines[i];
            const values = [];
            let current = '';
            let inQuotes = false;
            
            // Parse CSV properly handling quoted values
            for (let j = 0; j < line.length; j++) {
              const char = line[j];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            values.push(current.trim());
            
            console.log(`Row ${i} parsed:`, values);
            
            if (values.length >= 10) {
              const city = values[0]; // Column A - City name
              const players = parseInt(values[8]) || 0; // Column I - Players
              const gamesPerWeek = parseInt(values[9]) || 0; // Column J - Games per week
              
              console.log(`City: ${city}, Players: ${players}, Games: ${gamesPerWeek}`);
              
              // Map city names to our data structure
              if (city.toLowerCase().includes('casablanca')) {
                data.casablancaPlayers = players;
                data.casablancaGamesPerWeek = gamesPerWeek;
              } else if (city.toLowerCase().includes('marrakech') || city.toLowerCase().includes('marrakesh')) {
                data.marrakechPlayers = players;
                data.marrakechGamesPerWeek = gamesPerWeek;
              } else if (city.toLowerCase().includes('tanger')) {
                data.tangerPlayers = players;
                data.tangerGamesPerWeek = gamesPerWeek;
              }
            }
          }
          
          return data;
        };
        
        const parsedData = parseCSV(csvText);
        console.log('🎉 Sheet Total data loaded successfully:', parsedData);
        console.log('🎉 Casablanca:', parsedData.casablancaPlayers, 'players,', parsedData.casablancaGamesPerWeek, 'games/week');
        console.log('🎉 Marrakech:', parsedData.marrakechPlayers, 'players,', parsedData.marrakechGamesPerWeek, 'games/week');
        console.log('🎉 Tanger:', parsedData.tangerPlayers, 'players,', parsedData.tangerGamesPerWeek, 'games/week');
        setSheetData(parsedData);
      } catch (error) {
        console.error('Error fetching Sheet Total data:', error);
        // Set fallback values
        setSheetData({
          casablancaPlayers: 800,
          marrakechPlayers: 200,
          tangerPlayers: 50,
          casablancaGamesPerWeek: 4,
          marrakechGamesPerWeek: 2,
          tangerGamesPerWeek: 0,
          cancelled: 98,
          scheduled: 7
        });
      }
    };

    fetchSheetData();
  }, []);

  // Fetch leaderboard data using EXACT same logic as LeaderboardSection
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vSDgQfkyS5KdTwQABcUDgu673_fSDrwX0HNgGeZiZ5DbSK6UEmYIcUrWPGsAGN5yuL50M6I3rYIJInL/pub?gid=1779046147&single=true&output=csv');
        const csvText = await response.text();
        
        // Parse CSV using the EXACT same logic as LeaderboardSection
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
                values.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            values.push(current.trim());
            return values;
          });
        };
        
        const rows = parseCSV(csvText);
        
        if (rows.length > 1) {
          const headers = rows[0] || [];
          
          // Parse players using EXACT same logic as LeaderboardSection
          const playersData = rows.slice(1)
            .filter(row => row[1] && row[1].trim() !== '' && row[1] !== '#VALUE!')
            .map((row: string[]) => {
              // Parse score with decimal handling (same as leaderboard)
              const parseDecimal = (value: string): number => {
                if (!value || value === '#REF!' || value === '#N/A' || value === '#ERROR!' || value === '') return 0;
                const cleanValue = value.toString().replace(',', '.').trim();
                const parsed = parseFloat(cleanValue);
                return isNaN(parsed) ? 0 : parsed;
              };
              
              // Convert city names to French (same as leaderboard)
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
                  'Tetouan': 'Tétouan'
                };
                return cityMap[city] || city;
              };
              
              return {
                rank: parseInt(row[0]) || 0,
                cityRank: parseInt(row[1]) || 0,
                firstName: row[2]?.split(' ')[0] || 'Unknown',
                username: row[2] || 'Unknown',
                city: convertToFrench(row[3] || 'Non spécifié'),
                globalScore: parseDecimal(row[5]) || 0,
                gamesPlayed: parseInt(row[6]) || 0,
                goals: parseInt(row[7]) || 0,
                assists: parseInt(row[8]) || 0,
                teamWins: parseInt(row[9]) || 0,
                attackRatio: parseDecimal(row[10]),
                defenseRatio: parseDecimal(row[11]),
                individualScore: parseDecimal(row[12]),
                teamScore: parseDecimal(row[13])
              };
            });
          
          // Sort by Global Score (descending) and assign proper ranks (same as leaderboard)
          const sortedPlayers = playersData.sort((a, b) => b.globalScore - a.globalScore);
          const rankedPlayers = sortedPlayers.map((player, index) => ({
            ...player,
            rank: index + 1,
            cityRank: index + 1
          }));
          
          console.log('Parsed leaderboard data:', rankedPlayers.length, 'players');
          console.log('Sample players:', rankedPlayers.slice(0, 3));
          setLeaderboardData(rankedPlayers);
        }
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  // Fetch matches data using EXACT same logic as UpcomingMatchesSection
  useEffect(() => {
    const fetchMatchesData = async () => {
      try {
        // Use the exact same URL and approach as UpcomingMatchesSection
        const timestamp = new Date().getTime();
        const random = Math.random().toString(36).substring(7);
        const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSDgQfkyS5KdTwQABcUDgu673_fSDrwX0HNgGeZiZ5DbSK6UEmYIcUrWPGsAGN5yuL50M6I3rYIJInL/pub?gid=216631647&output=csv';
        const urlWithCache = `${csvUrl}&_t=${timestamp}&v=${random}&refresh=true`;
        
        console.log('Fetching matches from:', urlWithCache);
        
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
        
        const csvText = await response.text();
        
        // Check if the response is actually CSV data (not HTML error page)
        if (csvText.includes('<!DOCTYPE html>') || csvText.includes('Page introuvable') || csvText.includes('<TITLE>Temporary Redirect</TITLE>')) {
          throw new Error('Google Sheets a retourné une page d\'erreur HTML au lieu des données CSV');
        }
        
        console.log('CSV response length:', csvText.length);
        console.log('CSV response first 500 chars:', csvText.substring(0, 500));
        
        // Parse CSV using the EXACT same logic as UpcomingMatchesSection
        const parseMatchesCSV = (csvData: string) => {
          const lines = csvData.split('\n').filter(line => line.trim());
          console.log('CSV lines count:', lines.length);
          console.log('CSV headers:', lines[0]);
          
          const matchesMap = new Map();
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
              const char = line[j];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            values.push(current.trim());
            
            // Debug: Log the raw values to see the actual CSV structure
            if (i <= 5) { // Only log first 5 lines to avoid spam
              console.log(`Raw CSV values for line ${i}:`, values);
              console.log(`Available columns:`, values.length);
            }
            
            // Correct CSV structure based on WebsiteGame sheet:
            // A: GameID, B: Terrain, C: Date, D: City, E: Status, F: PlayerUsername, etc.
            const gameId = values[0] || '';           // Column A: GameID
            const terrain = values[1] || '';         // Column B: Terrain
            const dateTime = values[2] || '';        // Column C: Date (with time)
            const city = values[3] || '';            // Column D: City
            const status = values[4] || '';          // Column E: Status
            const playerName = values[5] || '';      // Column F: PlayerUsername
            const playersPerTeam = values[25] || '';  // Column Z: PlayerPerTeam
            const team = values[26] || '';            // Column AA: Team1
            const matchNumber = values[8] || '';     // Column I: Match
            const score = values[9] || '';           // Column J: Score
            const rank = values[10] || '';           // Column K: Rank
            
            console.log(`PlayersPerTeam: ${playersPerTeam}, Team1: ${team}`);
            
            if (!gameId || gameId.trim() === '') {
              continue;
            }
            
            // Parse date and time from the combined dateTime field
            let dateStr = '';
            let timeStr = '';
            try {
              // The dateTime field contains "MM/DD/YYYY HH:MM:SS"
              const dateTimeParts = dateTime.split(' ');
              dateStr = dateTimeParts[0] || '';
              timeStr = dateTimeParts[1] || '';
            } catch (error) {
              console.error('Error parsing dateTime:', dateTime, error);
              continue;
            }
            
            // Validate that we have the right data types
            console.log(`Validating match data for gameId ${gameId}:`);
            console.log(`  - City: "${city}" (should be city name)`);
            console.log(`  - Date: "${dateStr}" (should be date)`);
            console.log(`  - Time: "${timeStr}" (should be time)`);
            console.log(`  - Field: "${terrain}" (should be field name)`);
            console.log(`  - Status: "${status}" (should be Scheduled/Completed)`);
            
            // Skip if the data looks wrong or if status is not Scheduled
            if (!city || city === '#N/A' || !dateStr || !timeStr || status !== 'Scheduled') {
              console.log(`  - Skipping invalid match data for gameId ${gameId} (city: ${city}, status: ${status})`);
              continue;
            }
            
            // Convert cities to French (same as UpcomingMatchesSection)
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
                'Tetouan': 'Tétouan'
              };
              return cityMap[cityName] || cityName;
            };
            
            if (!matchesMap.has(gameId)) {
              // Calculate maxPlayers from PlayersPerTeam and Team columns
              let maxPlayers = 10; // Default fallback
              
              const playersPerTeamNum = parseInt(playersPerTeam) || 5; // Default 5 players per team
              const teamCount = parseInt(team) || 2; // Default 2 teams
              
              maxPlayers = playersPerTeamNum * teamCount;
              
              console.log(`Calculating maxPlayers for gameId ${gameId}: ${playersPerTeamNum} players per team × ${teamCount} teams = ${maxPlayers} max players`);
              
              const match = {
                id: `MATCH_${gameId}`,
                gameId: gameId,
                city: convertToFrench(city || "Casablanca"),
                field: terrain || "Terrain Rayo Sport",
                date: dateStr,
                time: timeStr,
                format: "Rayo Classic 5vs5", // Default format since not in CSV
                status: "Besoin d'autres joueurs", // Will be calculated based on player count
                maxPlayers: maxPlayers, // Dynamic based on terrain
                captain: playerName, // Use first player as captain
                mode: "Classic", // Default mode
                price: 0, // Default price
                players: [] // Will be populated as we process players
              };
              console.log(`Creating match for gameId ${gameId}:`, match);
              console.log(`Max players determined: ${maxPlayers} for terrain: ${terrain}`);
              matchesMap.set(gameId, match);
            }
            
            // Add player to the match
            const existingMatch = matchesMap.get(gameId);
            if (existingMatch) {
              existingMatch.players.push({
                id: `${gameId}_${playerName}`,
                username: playerName,
                fullName: playerName,
                globalScore: parseFloat(score) || 0,
                gamesPlayed: parseInt(matchNumber) || 0,
                ranking: parseInt(rank) || 0,
                cityRanking: parseInt(rank) || 0,
                paymentStatus: "Non payé" as const,
                isNewPlayer: false,
                goals: 0,
                assists: 0,
                teamWins: 0,
                team: team as any
              });
              console.log(`Added player ${playerName} to match ${gameId}. Total players: ${existingMatch.players.length}`);
            }
          }
          
          // Calculate final status for all matches based on player count
          Array.from(matchesMap.values()).forEach(match => {
            if (match.players.length >= match.maxPlayers) {
              match.status = "Complet";
            } else if (match.players.length > 0) {
              match.status = "Besoin d'autres joueurs";
            } else {
              match.status = "Besoin d'autres joueurs";
            }
            console.log(`Final status for match ${match.gameId}: ${match.status} (${match.players.length}/${match.maxPlayers} players) - Terrain: ${match.field} - City: ${match.city}`);
            
            // Special debugging for Casablanca matches
            if (match.city.toLowerCase().includes('casablanca')) {
              console.log(`🔍 CASABLANCA MATCH DEBUG:`, {
                gameId: match.gameId,
                city: match.city,
                players: match.players.length,
                maxPlayers: match.maxPlayers,
                status: match.status,
                playerNames: match.players.map(p => p.username)
              });
            }
          });
          
          return Array.from(matchesMap.values());
        };
        
        console.log('Raw CSV data length:', csvText.length);
        console.log('Raw CSV first 500 chars:', csvText.substring(0, 500));
        console.log('CSV headers (first line):', csvText.split('\n')[0]);
        
        try {
          const parsedMatches = parseMatchesCSV(csvText);
          console.log('=== MATCHES DATA LOADED ===');
          console.log('Parsed matches data:', parsedMatches.length, 'matches');
          console.log('Sample matches:', parsedMatches.slice(0, 3));
          console.log('All match cities:', parsedMatches.map(m => m.city));
          console.log('All match gameIds:', parsedMatches.map(m => m.gameId));
          console.log('=== END MATCHES DATA ===');
          setMatchesData(parsedMatches);
        } catch (parseError) {
          console.error('Error parsing matches CSV:', parseError);
          console.log('CSV content that failed to parse:', csvText.substring(0, 1000));
          setMatchesData([]);
        }
      } catch (error) {
        console.error('Error fetching matches data:', error);
      }
    };

    fetchMatchesData();
  }, []);

  // Get top 3 players for each city - using EXACT same filtering logic as leaderboard
  const getTopPlayersForCity = (cityName: string) => {
    if (!leaderboardData || leaderboardData.length === 0) {
      console.log(`No leaderboard data for ${cityName}`);
      return [];
    }
    
    // Convert city name to match leaderboard format (same as leaderboard)
    const cityMap: Record<string, string> = {
      'Casablanca': 'Casablanca',
      'Marrakech': 'Marrakech', 
      'Tangier': 'Tanger'
    };
    const mappedCityName = cityMap[cityName] || cityName;
    
    console.log(`Looking for players in city: ${mappedCityName}`);
    console.log(`Total players in leaderboard: ${leaderboardData.length}`);
    console.log(`Sample cities:`, leaderboardData.slice(0, 3).map(p => p.city));
    
    // Filter players by city using EXACT same logic as leaderboard
    const cityPlayers = leaderboardData.filter(player => {
      const cities = player.city.split(',').map(city => city.trim());
      return cities.includes(mappedCityName);
    });
    
    console.log(`Found ${cityPlayers.length} players for ${mappedCityName}`);
    
    // Sort by Global Score (descending) - same as leaderboard
    const sortedPlayers = cityPlayers.sort((a, b) => b.globalScore - a.globalScore);
    
    // Recalculate city ranks (same as leaderboard)
    const rerankedPlayers = sortedPlayers.map((player, index) => ({
      ...player,
      cityRank: index + 1
    }));
    
    // Take top 3 and return with proper formatting
    const top3 = rerankedPlayers.slice(0, 3).map((player, index) => ({
      name: player.username || player.firstName || 'Unknown',
      score: player.globalScore.toFixed(1),
      rank: index + 1
    }));
    
    console.log(`Top 3 for ${cityName}:`, top3);
    return top3;
  };

  // Format time to HH:MM without seconds
  const formatTime = (timeStr: string): string => {
    try {
      // If timeStr is already in HH:MM format, return as is
      if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
        return timeStr;
      }
      
      // If timeStr is in HH:MM:SS format, remove seconds
      if (/^\d{1,2}:\d{2}:\d{2}$/.test(timeStr)) {
        return timeStr.substring(0, 5);
      }
      
      // Try to parse as Date and format
      const date = new Date(`2000-01-01T${timeStr}`);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      return timeStr; // Fallback to original
    } catch (error) {
      console.error('Error formatting time:', timeStr, error);
      return timeStr;
    }
  };

  // Get next upcoming match for each city
  const getNextMatchForCity = (cityName: string) => {
    if (!matchesData || matchesData.length === 0) {
      console.log(`No matches data for ${cityName}`);
      return null;
    }
    
    console.log(`=== QUERYING MATCHES FOR ${cityName.toUpperCase()} ===`);
    console.log(`Total matches available: ${matchesData.length}`);
    console.log(`All available cities:`, [...new Set(matchesData.map(m => m.city))]);
    
    // Step 1: Filter by city (case-insensitive)
    const cityMatches = matchesData.filter(match => {
      const matchCity = match.city?.toLowerCase().trim();
      const searchCity = cityName.toLowerCase().trim();
      
      console.log(`  - Checking match ${match.gameId}: city="${matchCity}" vs search="${searchCity}"`);
      
      // Direct match
      if (matchCity === searchCity) {
        console.log(`  - ✅ Direct match found for ${cityName}`);
        return true;
      }
      
      // Try city mapping
      const cityMap: Record<string, string> = {
        'casablanca': 'casablanca',
        'marrakech': 'marrakesh',  // Fix: CSV has "Marrakesh" not "Marrakech"
        'tanger': 'tanger'
      };
      const mappedCity = cityMap[searchCity];
      if (mappedCity && matchCity === mappedCity) {
        console.log(`  - ✅ Mapped match found for ${cityName} (${searchCity} -> ${mappedCity})`);
        return true;
      }
      
      // Additional check for Marrakesh
      if (searchCity === 'marrakech' && matchCity === 'marrakesh') {
        console.log(`  - ✅ Marrakesh match found for Marrakech`);
        return true;
      }
      
      console.log(`  - ❌ No match for ${cityName}`);
      return false;
    });
    
    console.log(`Step 1 - Filtered by city: ${cityMatches.length} matches found`);
    if (cityMatches.length > 0) {
      console.log(`Sample city matches:`, cityMatches.slice(0, 3).map(m => ({
        gameId: m.gameId,
        city: m.city,
        date: m.date,
        time: m.time,
        field: m.field
      })));
    }
    
    if (cityMatches.length === 0) {
      console.log(`No matches found for ${cityName}`);
      return null;
    }
    
    // Step 2: Filter out past matches and sort by date and time
    const now = new Date();
    console.log(`Current date/time: ${now.toISOString()}`);
    
    const upcomingMatches = cityMatches.filter(match => {
      try {
        const matchDateTime = new Date(`${match.date} ${match.time}`);
        const isUpcoming = matchDateTime > now;
        console.log(`Match ${match.gameId}: ${match.date} ${match.time} -> ${matchDateTime.toISOString()} (upcoming: ${isUpcoming})`);
        return isUpcoming;
      } catch (error) {
        console.error('Error parsing match date:', match.date, match.time, error);
        return false;
      }
    });
    
    console.log(`Step 2 - Upcoming matches: ${upcomingMatches.length} matches found`);
    
    if (upcomingMatches.length === 0) {
      console.log(`No upcoming matches found for ${cityName}`);
      return null;
    }
    
    // Step 3: Sort upcoming matches by date and time
    const sortedMatches = upcomingMatches.sort((a, b) => {
      try {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      } catch (error) {
        console.error('Error sorting dates:', error);
        return 0;
      }
    });
    
    console.log(`Step 3 - Sorted upcoming matches:`, sortedMatches.slice(0, 3).map(m => ({
      gameId: m.gameId,
      date: m.date,
      time: m.time,
      city: m.city
    })));
    
    // Step 4: Pick the next upcoming match (first one after sorting)
    const selectedMatch = sortedMatches[0];
    console.log(`Step 4 - Selected match:`, {
      gameId: selectedMatch.gameId,
      city: selectedMatch.city,
      date: selectedMatch.date,
      time: selectedMatch.time,
      field: selectedMatch.field,
      format: selectedMatch.format
    });
    
    return selectedMatch;
  };

  // Recalculate cities with real data when leaderboard data changes
  const cities = useMemo(() => {
    console.log('=== RECALCULATING CITIES ===');
    console.log('Leaderboard data length:', leaderboardData.length);
    console.log('Matches data length:', matchesData.length);
    
    const getNextMatchInfo = (cityName: string) => {
      console.log(`Getting next match info for: ${cityName}`);
      const nextMatch = getNextMatchForCity(cityName);
      if (!nextMatch) {
        console.log(`No upcoming match found for ${cityName}, trying any match...`);
        
        // Fallback: Try to get any match for this city (for testing)
        const anyMatch = matchesData.find(match => {
          const matchCity = match.city?.toLowerCase().trim();
          const searchCity = cityName.toLowerCase().trim();
          return matchCity === searchCity || 
                 (searchCity === 'tanger' && matchCity === 'tanger') ||
                 (searchCity === 'marrakech' && matchCity === 'marrakech') ||
                 (searchCity === 'casablanca' && matchCity === 'casablanca');
        });
        
        if (anyMatch) {
          console.log(`Found fallback match for ${cityName}:`, anyMatch);
          try {
            const matchDate = new Date(`${anyMatch.date} ${anyMatch.time}`);
            const dayName = matchDate.toLocaleDateString('fr-FR', { weekday: 'long' });
            const timeStr = formatTime(anyMatch.time || "TBA");
            
        // Calculate actual status based on player count
        const playerCount = anyMatch.players?.length || 0;
        const maxPlayers = anyMatch.maxPlayers || 15;
        let actualStatus = 'Disponible';
        if (playerCount >= maxPlayers) {
          actualStatus = 'Complet';
        } else if (playerCount > 0) {
          actualStatus = 'Besoin d\'autres joueurs';
        }
        
        // Format date as "24 vendredi 20:00"
        const formattedDate = `${matchDate.getDate()} ${dayName.toLowerCase()} ${timeStr}`;
        
        return {
          nextMatch: formattedDate,
          location: anyMatch.field || "TBA",
          status: actualStatus,
          date: anyMatch.date
        };
          } catch (error) {
            console.error('Error parsing fallback match date:', error);
            return {
              nextMatch: `${anyMatch.date} ${anyMatch.time}`,
              location: anyMatch.field || "TBA",
              status: anyMatch.status || 'Disponible'
            };
          }
        }
        
        console.log(`No match found for ${cityName}`);
        return {
          nextMatch: "Aucun match",
          location: "TBA",
          status: "Disponible"
        };
      }
      
      // Format date and time
      try {
        const matchDate = new Date(`${nextMatch.date} ${nextMatch.time}`);
        const dayName = matchDate.toLocaleDateString('fr-FR', { weekday: 'long' });
        const timeStr = formatTime(nextMatch.time || "TBA");
        
        // Calculate actual status based on player count
        const playerCount = nextMatch.players?.length || 0;
        const maxPlayers = nextMatch.maxPlayers || 15;
        let actualStatus = 'Disponible';
        if (playerCount >= maxPlayers) {
          actualStatus = 'Complet';
        } else if (playerCount > 0) {
          actualStatus = 'Besoin d\'autres joueurs';
        }
        
        // Format date as "24 vendredi 20:00"
        const formattedDate = `${matchDate.getDate()} ${dayName.toLowerCase()} ${timeStr}`;
        
        return {
          nextMatch: formattedDate,
          location: nextMatch.field || "TBA",
          status: actualStatus,
          date: nextMatch.date
        };
      } catch (error) {
        console.error('Error parsing match date:', nextMatch.date, nextMatch.time, error);
        return {
          nextMatch: `${nextMatch.date} ${nextMatch.time}`,
          location: nextMatch.field || "TBA",
          status: nextMatch.status || 'Disponible'
        };
      }
    };
    
    return [
      {
        name: "Casablanca",
        players: `${sheetData.casablancaPlayers || 800}+`,
        activePlayers: `${sheetData.casablancaGamesPerWeek || 4}`,
        ...getNextMatchInfo("Casablanca"),
        color: "from-blue-500 to-blue-600",
        bgColor: "bg-blue-50",
        textColor: "text-blue-600",
        borderColor: "border-blue-200",
        icon: "🏙️",
        hasGenderGroups: true,
        topPlayers: getTopPlayersForCity("Casablanca")
      },
      {
        name: "Marrakech",
        players: `${sheetData.marrakechPlayers || 200}+`,
        activePlayers: `${sheetData.marrakechGamesPerWeek || 2}`,
        ...getNextMatchInfo("Marrakech"),
        color: "from-orange-500 to-orange-600",
        bgColor: "bg-orange-50",
        textColor: "text-orange-600",
        borderColor: "border-orange-200",
        icon: "🏜️",
        hasGenderGroups: false,
        topPlayers: getTopPlayersForCity("Marrakech")
      },
      {
        name: "Tanger",
        players: `${sheetData.tangerPlayers || 50}+`,
        activePlayers: `${sheetData.tangerGamesPerWeek || 0}`,
        ...getNextMatchInfo("Tanger"),
        color: "from-green-500 to-green-600",
        bgColor: "bg-green-50",
        textColor: "text-green-600",
        borderColor: "border-green-200",
        icon: "🌊",
        hasGenderGroups: false,
        topPlayers: getTopPlayersForCity("Tanger")
      }
    ];
  }, [leaderboardData, matchesData, sheetData]);
  
  // Debug: Log the final cities data
  console.log('=== FINAL CITIES DATA ===');
  console.log('SheetData:', sheetData);
  console.log('MatchesData length:', matchesData.length);
  console.log('LeaderboardData length:', leaderboardData.length);
  console.log('Cities with match info:', cities.map(city => ({
    name: city.name,
    players: city.players,
    activePlayers: city.activePlayers,
    nextMatch: city.nextMatch,
    location: city.location,
    status: city.status,
    topPlayers: city.topPlayers.length,
    hasUpcomingGame: city.nextMatch !== "Aucun match"
  })));
  console.log('=== END CITIES DATA ===');
  
  // Summary of what should be displayed
  console.log('=== CITY CARDS SUMMARY ===');
  cities.forEach(city => {
    if (city.nextMatch !== "Aucun match") {
      console.log(`✅ ${city.name}: ${city.nextMatch} at ${city.location}`);
    } else {
      console.log(`❌ ${city.name}: No upcoming match found`);
    }
  });
  console.log('=== END SUMMARY ===');
  
  // Test: Force show a match for Casablanca if no matches found
  if (matchesData.length > 0) {
    console.log('=== FORCING MATCH FOR CASABLANCA ===');
    const testMatch = matchesData[0];
    console.log('Test match:', testMatch);
  }
  
  return (
    <section id="cities-overview" className="relative py-16 md:py-20 bg-gradient-to-br from-gray-50 to-white overflow-hidden w-full">
      {/* Background image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('/images/gallery/optimized/ss.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/10 to-black/20"></div>
        
        {/* Subtle gradient overlays */}
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-full blur-2xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10 w-full">
        <div className="text-center mb-12">
          <RevealAnimation>
            {/* Compact header with badge */}
            <div className="flex flex-col items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full text-white text-xs font-semibold">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
                <span className="text-center">
                  {loading ? t('football_hero_loading') : 
                   `${(sheetData.casablancaPlayers || 0) + (sheetData.marrakechPlayers || 0) + (sheetData.tangerPlayers || 0)}+ ${t('football_hero_active_players')}`}
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white drop-shadow-2xl leading-tight text-center px-4">
                <span className="block bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  FOOTBALL
                </span>
                <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  RAYO SPORT
                </span>
              </h1>
            </div>
            
            {/* Compact message */}
            <div className="max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
              <p className="text-base sm:text-lg md:text-xl text-gray-100 font-medium mb-2">
                {t('football_hero_where_every_player')}
              </p>
              <div className="text-xs sm:text-sm md:text-base text-gray-200 leading-relaxed text-center">
                <span className="inline-block">Débutant ou Pro • Junior ou Senior</span>
                <br className="sm:hidden" />
                <span className="inline-block sm:ml-2">Homme ou Femme</span>
              </div>
            </div>
            
            {/* Compact stats grid */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-sm sm:max-w-md mx-auto mb-6 sm:mb-8 px-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">3</div>
                <div className="text-xs text-gray-300">{t('football_hero_cities')}</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {loading ? '...' : 
                   `${((sheetData.casablancaGamesPerWeek || 4) + (sheetData.marrakechGamesPerWeek || 2) + (sheetData.tangerGamesPerWeek || 0)) * 4}+`}
                </div>
                <div className="text-xs text-gray-300">{t('football_hero_matches_per_month')}</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">24/7</div>
                <div className="text-xs text-gray-300">{t('football_hero_available')}</div>
              </div>
            </div>
                {/* Ultra Compact action buttons */}
                <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 justify-center max-w-2xl mx-auto px-2">
                  <button 
                    className="group w-full px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-medium rounded-md hover:from-green-700 hover:to-emerald-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.01] flex items-center justify-center gap-1"
                    onClick={() => {
                      trackEvent('join_match_click', 'user_engagement', 'cities_overview');
                      const upcomingMatchesSection = document.getElementById('upcoming-matches');
                      if (upcomingMatchesSection) {
                        const headerHeight = 80;
                        const elementPosition = upcomingMatchesSection.offsetTop - headerHeight;
                        window.scrollTo({
                          top: elementPosition,
                          behavior: 'smooth'
                        });
                      }
                    }}
                  >
                    <span className="text-xs font-semibold">{t('football_hero_play_now')}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform duration-300 text-xs">→</span>
                  </button>
                  
                  <div className="flex gap-1 w-full sm:w-auto">
                    <button 
                      className="group flex-1 sm:flex-none px-2 py-1.5 sm:py-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white font-medium rounded-md hover:bg-white/25 hover:border-white/40 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.01] flex items-center justify-center sm:min-w-[80px]"
                      onClick={() => {
                        trackEvent('previous_matches_click', 'navigation', 'cities_overview');
                        const pastGamesSection = document.getElementById('past-games');
                        if (pastGamesSection) {
                          const headerHeight = 80;
                          const elementPosition = pastGamesSection.offsetTop - headerHeight;
                          window.scrollTo({
                            top: elementPosition,
                            behavior: 'smooth'
                          });
                        }
                      }}
                    >
                      <span className="text-xs font-semibold">Précédents</span>
                    </button>
                    
                    <button 
                      className="group flex-1 sm:flex-none px-2 py-1.5 sm:py-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white font-medium rounded-md hover:bg-white/25 hover:border-white/40 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.01] flex items-center justify-center sm:min-w-[80px]"
                      onClick={() => {
                        trackEvent('leaderboard_click', 'navigation', 'cities_overview');
                        const leaderboardSection = document.getElementById('leaderboard');
                        if (leaderboardSection) {
                          const headerHeight = 80;
                          const elementPosition = leaderboardSection.offsetTop - headerHeight;
                          window.scrollTo({
                            top: elementPosition,
                            behavior: 'smooth'
                          });
                        }
                      }}
                    >
                      <span className="text-xs font-semibold">Classement</span>
                    </button>
                    
                    <button 
                      className="group flex-1 sm:flex-none px-2 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-md transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.01] flex items-center justify-center sm:min-w-[80px]"
                      onClick={onVoteClick}
                    >
                      <FiCheckCircle className="w-3 h-3 mr-0.5" />
                      <span className="text-xs font-semibold">Voter</span>
                    </button>
                  </div>
                </div>
                
                {/* Player Search Bar */}
                <div className="mt-2 sm:mt-3 max-w-2xl mx-auto px-2 relative">
                  <RevealAnimation delay={0.3}>
                    <div className="flex flex-col lg:flex-row items-center gap-1 sm:gap-2">
                      {/* Search Input */}
                      <div className="w-full lg:flex-1 relative">
                        <input
                          type="text"
                          placeholder="Rechercher un joueur..."
                          value={searchQuery}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-md text-white placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-xs sm:text-sm"
                          onChange={(e) => handleSearchChange(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSearchSubmit();
                            }
                          }}
                          onFocus={() => {
                            if (searchSuggestions.length > 0) {
                              setShowSuggestions(true);
                            }
                          }}
                          onBlur={() => {
                            // Delay hiding suggestions to allow clicking
                            setTimeout(() => setShowSuggestions(false), 200);
                          }}
                        />
                        <div className="absolute right-1.5 sm:right-2 top-1/2 transform -translate-y-1/2">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Responsive Suggestions */}
                      {showSuggestions && searchSuggestions.length > 0 && (
                        <div className="w-full lg:w-auto">
                          {/* Desktop: Horizontal layout */}
                          <div className="hidden lg:flex gap-1 z-50">
                            {searchSuggestions.slice(0, 3).map((player, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestionClick(player)}
                                className="flex items-center gap-1.5 px-2 py-1.5 bg-white/90 backdrop-blur-sm border border-white/30 rounded-md hover:bg-white hover:shadow-lg transition-all duration-200 group min-w-0"
                              >
                                {/* Avatar */}
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                                  <span className="text-white text-xs font-bold">
                                    {player.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                
                                {/* Player Username */}
                                <div className="text-xs font-medium text-gray-900 truncate">
                                  {player.username}
                                </div>
                                
                                {/* Rank & Match Count Badge */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                                    #{player.rank}
                                  </div>
                                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                                    {player.gamesPlayed || 0}M
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                          
                          {/* Mobile: Compact Stacked layout */}
                          <div className="lg:hidden flex flex-col gap-1 sm:gap-2 z-50">
                            {searchSuggestions.slice(0, 3).map((player, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestionClick(player)}
                                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white hover:shadow-lg transition-all duration-200 group w-full"
                              >
                                {/* Avatar */}
                                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                                  <span className="text-white text-xs sm:text-sm font-bold">
                                    {player.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                
                                {/* Player Info */}
                                <div className="flex-1 text-left min-w-0">
                                  <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{player.username}</div>
                                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                                    <span>#{player.rank}</span>
                                    <span>•</span>
                                    <span>{player.gamesPlayed || 0} matches</span>
                                  </div>
                                </div>
                                
                                {/* Rank Badge */}
                                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold flex-shrink-0">
                                  #{player.rank}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </RevealAnimation>
                </div>
          </RevealAnimation>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3" style={{ zIndex: 1 }}>
          {cities.map((city, index) => (
            <RevealAnimation key={index} delay={index * 0.1}>
              <div className="relative bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-white/20 hover:bg-white hover:shadow-lg transition-all duration-300 group overflow-hidden" style={{ zIndex: 1 }}>
                {/* Subtle gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${city.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  {/* City header - ultra compact */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{city.icon}</span>
                      <h3 className="text-sm font-semibold text-gray-900">{city.name}</h3>
                    </div>
                    <div className={`w-1.5 h-1.5 bg-gradient-to-r ${city.color} rounded-full`}></div>
                  </div>
                  
                  {/* Stats - ultra compact grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="text-center">
                      <div className={`text-sm font-bold ${city.textColor}`}>{city.players}</div>
                      <div className="text-xs text-gray-500">{t('football_city_players')}</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-bold ${city.textColor}`}>{city.activePlayers}</div>
                      <div className="text-xs text-gray-500">{t('football_city_matches_per_week')}</div>
                    </div>
                  </div>
                  
                  {/* Next match info - compact */}
                  <div className="mb-3 p-1.5 bg-gray-50 rounded-md">
                    <div className="text-xs text-gray-600 mb-1">{t('football_city_next_match')}</div>
                    {loading ? (
                      <div className="text-xs text-gray-500">{t('football_city_loading')}</div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-medium text-gray-900 truncate">{city.nextMatch}</div>
                          {/* More Info button */}
                          <button 
                            className={`py-0.5 px-1.5 rounded text-xs font-medium transition-colors ${
                              city.nextMatch === "Aucun match" 
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                                : "bg-blue-500 hover:bg-blue-600 text-white"
                            }`}
                            disabled={city.nextMatch === "Aucun match"}
                            onClick={() => {
                              if (city.nextMatch !== "Aucun match") {
                                trackEvent('city_more_info_click', 'user_engagement', city.name);
                                const upcomingMatchesSection = document.getElementById('upcoming-matches');
                                if (upcomingMatchesSection) {
                                  const headerHeight = 80;
                                  const elementPosition = upcomingMatchesSection.offsetTop - headerHeight;
                                  window.scrollTo({
                                    top: elementPosition,
                                    behavior: 'smooth'
                                  });
                                }
                              }
                            }}
                          >
                            {t('football_city_more_info')}
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">{city.location}</div>
                      </>
                    )}
                  </div>
                  
                  {/* Top 3 Players - compact */}
                  <div className="mb-3">
                    <div className="text-xs text-gray-600 mb-1.5 font-medium">{t('football_city_top_players')}</div>
                    <div className="space-y-0.5">
                      {loading ? (
                        <div className="text-xs text-gray-500 text-center py-1">{t('football_city_loading_players')}</div>
                      ) : (
                        // Always show 3 slots, fill with N/A if no players
                        Array.from({ length: 3 }, (_, index) => {
                          const player = city.topPlayers[index];
                          return (
                            <div 
                              key={index} 
                              className={`flex items-center justify-between p-1.5 rounded-md ${
                                player ? 'bg-white/50 cursor-pointer hover:bg-white/80 transition-colors' : 'bg-gray-100/50'
                              }`}
                              onClick={() => {
                                if (player && onPlayerClick) {
                                  trackEvent('city_top_player_click', 'user_engagement', player.name);
                                  onPlayerClick(player.name);
                                }
                              }}
                            >
                              <div className="flex items-center gap-1.5">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                                  player 
                                    ? `text-white ${
                                        index === 0 ? 'bg-yellow-500' :
                                        index === 1 ? 'bg-gray-400' :
                                        'bg-orange-500'
                                      }`
                                    : 'bg-gray-300 text-gray-500'
                                }`}>
                                  {index + 1}
                                </div>
                                <span className={`text-xs font-medium truncate ${
                                  player ? 'text-gray-900' : 'text-gray-400'
                                }`}>
                                  {player ? player.name : 'N/A'}
                                </span>
                              </div>
                              {player && (
                                <div className={`text-xs font-bold ${city.textColor}`}>
                                  {player.score}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  
                  {/* Action buttons - compact */}
                  {city.hasGenderGroups ? (
                    <div className="flex gap-1.5">
                      <button 
                        className={`flex-1 py-1.5 bg-gradient-to-r ${city.color} text-white rounded-md hover:shadow-md transition-all duration-200 font-medium text-xs`}
                        onClick={() => {
                          trackEvent('city_join_male_click', 'user_engagement', city.name);
                          // Open specific WhatsApp link for men in each city
                          if (city.name === "Casablanca") {
                            window.open('https://chat.whatsapp.com/L6ePdMmtGrUIiF4VFEQ6eA', '_blank');
                          } else if (city.name === "Marrakech") {
                            window.open('https://chat.whatsapp.com/C33iLj6NFeq5yVH1Vx1BHf', '_blank');
                          } else if (city.name === "Tanger") {
                            window.open('https://chat.whatsapp.com/CDz3gbxv2swCqMs2TTUbHb', '_blank');
                          } else {
                            onJoinClick();
                          }
                        }}
                      >
{t('football_city_men')}
                      </button>
                      <button 
                        className={`flex-1 py-1.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-md hover:shadow-md transition-all duration-200 font-medium text-xs`}
                        onClick={() => {
                          trackEvent('city_join_female_click', 'user_engagement', city.name);
                          // Open specific WhatsApp link for women in each city
                          if (city.name === "Casablanca") {
                            window.open('https://chat.whatsapp.com/DSJUbzlNymQ5hfAPhUmNtQ', '_blank');
                          } else if (city.name === "Marrakech") {
                            window.open('https://chat.whatsapp.com/C33iLj6NFeq5yVH1Vx1BHf', '_blank');
                          } else if (city.name === "Tanger") {
                            window.open('https://chat.whatsapp.com/CDz3gbxv2swCqMs2TTUbHb', '_blank');
                          } else {
                            onJoinClick();
                          }
                        }}
                      >
{t('football_city_women')}
                      </button>
                    </div>
                  ) : (
                    <button 
                      className={`w-full py-1.5 bg-gradient-to-r ${city.color} text-white rounded-md hover:shadow-md transition-all duration-200 font-medium text-xs`}
                      onClick={() => {
                        trackEvent('city_join_click', 'user_engagement', city.name);
                        // Open specific WhatsApp link for each city
                        if (city.name === "Marrakech") {
                          window.open('https://chat.whatsapp.com/C33iLj6NFeq5yVH1Vx1BHf', '_blank');
                        } else if (city.name === "Tanger") {
                          window.open('https://chat.whatsapp.com/CDz3gbxv2swCqMs2TTUbHb', '_blank');
                        } else {
                          onJoinClick();
                        }
                      }}
                    >
                      Rejoindre WhatsApp
                    </button>
                  )}
                </div>
              </div>
            </RevealAnimation>
          ))}
        </div>
      </div>
    </section>
  );
};

// About Section
const AboutSection = () => {
  const { t } = useLanguage();
  
  return (
    <section id="about" className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <RevealAnimation>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-rayoblue to-gray-800 bg-clip-text text-transparent">{t("about_title")}</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t("about_subtitle")}
            </p>
          </RevealAnimation>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <RevealAnimation delay={0.1}>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 hover:border-rayoblue/30 group">
              <div className="w-16 h-16 bg-gradient-to-br from-rayoblue to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t("about_concept_title")}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t("about_concept_text")}
              </p>
            </div>
          </RevealAnimation>
          
          <RevealAnimation delay={0.2}>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 hover:border-rayoblue/30 group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">🚀</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t("about_mission_title")}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t("about_mission_text")}
              </p>
            </div>
          </RevealAnimation>
          
          <RevealAnimation delay={0.3}>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 hover:border-rayoblue/30 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">✨</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t("about_vision_title")}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t("about_vision_text")}
              </p>
            </div>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

// How It Works Section
const HowItWorksSection = ({ onJoinClick }: { onJoinClick: () => void }) => {
  const { t } = useLanguage();
  
  const steps = [
    {
      icon: <FiUsers className="w-8 h-8" />,
      title: t("how_step1_title"),
      description: t("how_step1_description"),
      color: "from-blue-500 to-rayoblue"
    },
    {
      icon: <FiCalendar className="w-8 h-8" />,
      title: t("how_step2_title"),
      description: t("how_step2_description"),
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <FiActivity className="w-8 h-8" />,
      title: t("how_step3_title"),
      description: t("how_step3_description"),
      color: "from-purple-500 to-indigo-600"
    },
    {
      icon: <FiAward className="w-8 h-8" />,
      title: t("how_step4_title"),
      description: t("how_step4_description"),
      color: "from-orange-500 to-red-600"
    }
  ];
  
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <RevealAnimation>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-rayoblue to-gray-800 bg-clip-text text-transparent">{t("how_title")}</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t("how_subtitle")}
            </p>
          </RevealAnimation>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <RevealAnimation key={index} delay={index * 0.1}>
              <div className="relative bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 hover:border-rayoblue/30 group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                  <div className={`w-full h-full bg-gradient-to-br ${step.color} rounded-full transform translate-x-8 -translate-y-8`}></div>
                </div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {step.icon}
                  </div>
                  <div className="w-8 h-1 bg-gradient-to-r from-transparent via-rayoblue to-transparent mb-4"></div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </RevealAnimation>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <RevealAnimation>
            <button 
              className="relative overflow-hidden bg-gradient-to-r from-rayoblue to-blue-600 text-white px-10 py-4 text-lg rounded-2xl hover:from-rayoblue/90 hover:to-blue-600/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
              onClick={() => {
                trackEvent('join_click', 'user_engagement', 'how_it_works_section');
                onJoinClick();
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">{t("how_cta_button")}</span>
            </button>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

// Upcoming Matches Section
const UpcomingMatchesSection = () => {
  return <UpcomingMatchesSectionComponent />;
};

// Past Games Section
const PastGamesSection = () => {
  return <PastGamesSectionComponent />;
};

// Leaderboard Section
const LeaderboardSection = () => {
  return <LeaderboardSectionComponent />;
};

// Formats & Rules Section
const RulesSection = () => {
  return <RulesSectionComponent />;
};

// FAQ Section (importé depuis notre composant spécifique)
const FaqSection = () => {
  return <FaqSectionComponent />;
};

// CTA Section
const CtaSection = ({ onJoinClick }: { onJoinClick: () => void }) => {
  const { t } = useLanguage();
  
  return (
    <section id="cta" className="py-24 bg-gradient-to-br from-rayoblue via-blue-600 to-indigo-700 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-white/5 to-transparent rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <RevealAnimation>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{t("cta_title")}</h2>
          <p className="text-xl max-w-3xl mx-auto mb-10 opacity-90">
            {t("cta_subtitle")}
          </p>
          
          <div className="flex flex-wrap gap-6 justify-center">
            <button 
              className="relative overflow-hidden bg-white text-rayoblue px-8 py-4 text-lg rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3 group"
              onClick={() => {
                trackEvent('join_click', 'user_engagement', 'cta_section');
                onJoinClick();
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">{t("cta_whatsapp")}</span>
              <svg className="relative z-10 group-hover:rotate-12 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </button>
            <button 
              className="relative overflow-hidden border-2 border-white/30 text-white px-8 py-4 text-lg rounded-2xl font-semibold hover:bg-white/10 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 group backdrop-blur-sm"
              onClick={() => {
                trackEvent('instagram_click', 'social_media', 'cta_section');
                window.open('https://www.instagram.com/rayosport.ma/', '_blank');
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">{t("cta_instagram")}</span>
              <svg className="relative z-10 group-hover:rotate-12 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </button>
          </div>
          
          <p 
            className="mt-10 opacity-70 text-sm cursor-pointer hover:opacity-100 transition-all duration-300 hover:scale-105 inline-block"
            onClick={() => window.open('https://www.instagram.com/rayosport.ma/', '_blank')}
          >
            {t("cta_button_app")}
          </p>
        </RevealAnimation>
      </div>
    </section>
  );
};

// WhatsApp Groups Modal Component
const WhatsAppGroupsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useLanguage();
  
  const whatsappGroups = [
    {
      city: "Rayo Casablanca",
      link: "https://chat.whatsapp.com/L6ePdMmtGrUIiF4VFEQ6eA",
      color: "from-blue-500 to-rayoblue"
    },
    {
      city: "Rayo Berrechid", 
      link: "https://chat.whatsapp.com/KHcdMSbsph07VZaX8NnrPN",
      color: "from-green-500 to-emerald-600"
    },
    {
      city: "Rayo Bouskoura",
      link: "https://chat.whatsapp.com/FAolLQ1PMkn7ItK2v2ZqQo",
      color: "from-purple-500 to-indigo-600"
    },
    {
      city: "Rayo Marrakech",
      link: "https://chat.whatsapp.com/C33iLj6NFeq5yVH1Vx1BHf",
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

const Football = () => {
  // Initialize navigation tracking
  useNav();
  
  // State for WhatsApp modal
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Player dashboard state - shared across all sections
  const [selectedPlayerUsername, setSelectedPlayerUsername] = useState<string | null>(null);
  
  // Voting state
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [votedCities, setVotedCities] = useState<string[]>([]);
  const [cityVoteCounts, setCityVoteCounts] = useState<Record<string, number>>({});
  const [userIP, setUserIP] = useState<string | null>(null);
  const [voteMessage, setVoteMessage] = useState<string>("");
  
  // Moroccan cities list - sorted alphabetically
  const moroccanCities = [
    "Agadir", "Ain El Aouda", "Ain Harrouda", "Ain Taoujdate", "Al Hoceïma", "Azrou",
    "Ben Guerir", "Beni Mellal", "Beni Yakhlef", "Berkane", "Bni Chiker", "Boujniba", "Bouznika",
    "Casablanca", "Dar Bouazza", "Drargua", "El Jadida", "Erfoud", "Errachidia",
    "Fès", "Had Soualem", "Hajeb", "Harhoura", "Jorf Lasfar", "Kénitra", "Khemis Zemamra",
    "Khemisset", "Khenichet", "Ksar El Kebir", "Lahraouyine", "Lalla Mimouna", "Lalla Takerkoust",
    "Larache", "M'diq", "Marrakech", "Meknès", "Midelt", "Mohammedia", "Moulay Bousselham",
    "Moulay Idriss Zerhoun", "Nador", "Ouarzazate", "Oujda", "Oulad Amrane", "Oulad Frej",
    "Oulad M'Barek", "Oulad Said", "Oulad Tayeb", "Oulad Zbair", "Ourika", "Rabat",
    "Safi", "Sefrou", "Settat", "Sidi Allal Bahraoui", "Sidi Allal Tazi", "Sidi Bennour",
    "Sidi Ghanem", "Sidi Kacem", "Sidi Larbi", "Sidi Rahal", "Sidi Rahal Chatai",
    "Sidi Slimane", "Sidi Smail", "Sidi Taibi", "Sidi Yahya El Gharb", "Sidi Yahya Zaer",
    "Skhirat", "Skoura", "Souk El Arbaa", "Tanger", "Taza", "Témara", "Tétouan",
    "Tiflet", "Tiznit", "Youssoufia", "Zagora"
  ];
  
  // Load vote counts for all cities
  const loadVoteCounts = () => {
    const counts: Record<string, number> = {};
    moroccanCities.forEach(city => {
      const cityVotes = localStorage.getItem(`city_votes_${city}`);
      counts[city] = cityVotes ? parseInt(cityVotes) : 0;
    });
    setCityVoteCounts(counts);
  };

  // Get user IP and load previously voted cities
  useEffect(() => {
    const getUserIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setUserIP(data.ip);
        
        // Load previously voted cities
        const votedCitiesData = localStorage.getItem(`voted_cities_${data.ip}`);
        if (votedCitiesData) {
          const parsedCities = JSON.parse(votedCitiesData);
          setVotedCities(parsedCities);
          setSelectedCities([]); // Start with empty selection for new votes
          setVoteMessage(`Vous avez déjà voté pour: ${parsedCities.join(', ')}. Vous pouvez ajouter d'autres villes.`);
        }
        
        // Load vote counts
        loadVoteCounts();
      } catch (error) {
        console.error('Error getting IP:', error);
        // Fallback to a random identifier if IP detection fails
        const fallbackId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setUserIP(fallbackId);
        loadVoteCounts();
      }
    };
    
    getUserIP();
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    trackEvent('page_view', 'navigation', 'football_page');
  }, []);

  // Handle city selection
  const handleCityToggle = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  // Handle vote button click
  const handleVoteClick = () => {
    setIsVoteModalOpen(true);
    trackEvent('vote_modal_open', 'user_engagement', 'voting_system');
  };

  // Handle vote submission
  const handleVoteSubmit = () => {
    if (selectedCities.length === 0) {
      setVoteMessage("Veuillez sélectionner au moins une ville.");
      return;
    }

    if (userIP) {
      // Get previously voted cities
      const existingVotes = localStorage.getItem(`voted_cities_${userIP}`);
      let allVotedCities = existingVotes ? JSON.parse(existingVotes) : [];
      
      // Add new cities (avoid duplicates)
      const newCities = selectedCities.filter(city => !allVotedCities.includes(city));
      allVotedCities = [...allVotedCities, ...newCities];
      
      // Store updated vote in localStorage with IP as key
      localStorage.setItem(`voted_cities_${userIP}`, JSON.stringify(allVotedCities));
      
      // Update individual city vote counts
      newCities.forEach(city => {
        const currentCount = parseInt(localStorage.getItem(`city_votes_${city}`) || '0');
        localStorage.setItem(`city_votes_${city}`, (currentCount + 1).toString());
      });
      
      // Reload vote counts
      loadVoteCounts();
      
      if (newCities.length > 0) {
        setVoteMessage(`Merci ! Vous avez ajouté: ${newCities.join(', ')}. Total: ${allVotedCities.join(', ')}`);
        trackEvent('city_vote_submitted', 'user_engagement', 'voting_system');
      } else {
        setVoteMessage("Toutes les villes sélectionnées ont déjà été votées.");
      }
      
      // Update voted cities and reset selection
      setVotedCities(allVotedCities);
      setSelectedCities([]);
    }
  };

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = '/images/gallery/optimized/ff.jpg';
  }, []);

  // Listen for WhatsApp modal events from header
  useEffect(() => {
    const handleOpenModal = () => {
      setIsWhatsAppModalOpen(true);
    };

    window.addEventListener('openWhatsAppModal', handleOpenModal);
    
    return () => {
      window.removeEventListener('openWhatsAppModal', handleOpenModal);
    };
  }, []);

  const handleJoinClick = () => {
    setIsWhatsAppModalOpen(true);
  };

  // Show loading screen while image loads
  if (!imageLoaded) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Rayo Sport</h2>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="overflow-hidden w-full">
      <div className="w-full max-w-[100vw] mx-auto">
        <CitiesOverviewSection 
          onJoinClick={handleJoinClick} 
          onPlayerClick={setSelectedPlayerUsername}
          onVoteClick={handleVoteClick}
        />
        <UpcomingMatchesSectionComponent onPlayerClick={setSelectedPlayerUsername} />
        <PastGamesSectionComponent 
          initialPlayerUsername={selectedPlayerUsername || undefined}
          onPlayerModalClose={() => setSelectedPlayerUsername(null)}
        />
        <LeaderboardSectionComponent onPlayerClick={setSelectedPlayerUsername} />
        <Footer />
      </div>
      
      {/* WhatsApp Groups Modal */}
      <WhatsAppGroupsModal 
        isOpen={isWhatsAppModalOpen} 
        onClose={() => setIsWhatsAppModalOpen(false)} 
      />
      
      {/* City Voting Modal - Ultra Compact Dark Theme */}
      <Dialog open={isVoteModalOpen} onOpenChange={setIsVoteModalOpen}>
        <DialogContent className="max-w-xs sm:max-w-lg bg-gray-900 border-gray-700 p-2 sm:p-3 overflow-y-auto">
          <DialogHeader className="pb-0.5 relative min-h-[2rem]">
            <button
              onClick={() => {
                setIsVoteModalOpen(false);
                setVoteMessage("");
              }}
              className="absolute -top-1 -right-1 text-gray-400 hover:text-white transition-colors duration-200 p-2 rounded-full hover:bg-gray-700 z-10"
            >
              <FiX className="w-4 h-4" />
            </button>
            <DialogTitle className="text-sm font-bold text-center text-white mt-6">
              Où voulez-vous Rayo Sport ?
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-0.5">
            
            {/* Cities grid - Ultra Compact */}
                <div className="bg-gray-800 rounded-md p-1.5">
                   <div className="flex items-center justify-between mb-1">
                     <h4 className="text-xs font-semibold text-gray-300">Sélectionnez votre ville</h4>
                     <span className="text-xs text-gray-500">{moroccanCities.length}</span>
                   </div>
                   <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                      {moroccanCities.map((city) => {
                        const isVoted = votedCities.includes(city);
                        const isSelected = selectedCities.includes(city);
                        const voteCount = cityVoteCounts[city] || 0;

                        return (
                          <button
                            key={city}
                            onClick={() => !isVoted && handleCityToggle(city)}
                            disabled={isVoted}
                            className={`p-1 text-xs font-medium rounded transition-all duration-200 ${
                              isVoted
                                ? 'bg-green-900/30 text-green-400 cursor-not-allowed border border-green-700'
                                : isSelected
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="truncate text-xs flex-1 text-left">{city}</span>
                              <div className="flex items-center gap-1 ml-1">
                                <span className="text-xs text-gray-400">
                                  {voteCount}
                                </span>
                                {(isVoted || isSelected) && (
                                  <FiCheck className="w-2 h-2 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
            
            {/* Action buttons - Ultra Compact */}
            <div className="flex gap-0.5 justify-end pt-0.5">
              <button
                onClick={() => {
                  setIsVoteModalOpen(false);
                  setVoteMessage("");
                }}
                className="px-2 py-1 text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded transition-colors duration-200"
              >
                Fermer
              </button>
              <button
                onClick={handleVoteSubmit}
                disabled={selectedCities.length === 0}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors duration-200 ${
                  selectedCities.length === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-sm hover:shadow-md'
                }`}
              >
                {selectedCities.length === 0 ? 'Sélectionnez' : `+${selectedCities.length}`}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
    </main>
  );
};

export default Football;