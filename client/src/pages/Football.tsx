// Import the sections for our new Rayo Sport website
import { useEffect, useState, useMemo, useCallback } from "react";
import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";
import Footer from "@/components/layout/Footer";
import LeaderboardSectionComponent from "@/components/sections/LeaderboardSection";
import RankedLeaderboardSectionComponent from "@/components/sections/RankedLeaderboardSection";
import UpcomingMatchesSectionComponent from "@/components/sections/UpcomingMatchesSection";
import PastGamesSectionComponent from "@/components/sections/PastGamesSection";
import NextMatchCountdown from "@/components/ui/NextMatchCountdown";
import { useNav } from "@/hooks/use-intersection";
import { useIsMobile } from "@/hooks/use-mobile";
import { FiUsers, FiCalendar, FiActivity, FiAward, FiX, FiCheckCircle, FiCheck, FiInfo, FiChevronLeft, FiChevronRight, FiTrendingUp, FiZap, FiRefreshCw, FiMapPin } from "react-icons/fi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trackEvent } from "@/lib/analytics";

// Cities Overview Section
const CitiesOverviewSection = ({ onJoinClick, onPlayerClick, onVoteClick }: { 
  onJoinClick: () => void; 
  onPlayerClick?: (username: string) => void;
  onVoteClick: () => void;
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  // Helper function to get current date/time in Moroccan timezone (Africa/Casablanca, UTC+1)
  const getMoroccanDate = () => {
    // Use Intl API to get date components in Moroccan timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Casablanca',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    });
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1; // JS months are 0-indexed
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
    return new Date(year, month, day);
  };
  
  // Helper function to get previous month in Moroccan timezone
  const getPreviousMonthMoroccan = () => {
    const moroccanDate = getMoroccanDate();
    const previousMonth = new Date(moroccanDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    return previousMonth;
  };
  
  // Helper function to get current month name in Moroccan timezone (French)
  const getCurrentMonthNameMoroccan = () => {
    const now = new Date();
    return now.toLocaleDateString('fr-FR', { month: 'long', timeZone: 'Africa/Casablanca' });
  };
  
  // Helper function to get previous month name in Moroccan timezone (French)
  const getPreviousMonthNameMoroccan = () => {
    const now = new Date();
    // Get previous month by subtracting 1 month from current date in Moroccan timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Casablanca',
      year: 'numeric',
      month: 'numeric'
    });
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1');
    
    // Calculate previous month
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }
    
    // Create a date in Moroccan timezone for the previous month
    const prevDate = new Date(prevYear, prevMonth - 1, 1); // JS months are 0-indexed
    return prevDate.toLocaleDateString('fr-FR', { month: 'long', timeZone: 'Africa/Casablanca' });
  };
  
  // Helper function to get month number and year in Moroccan timezone (for matching Excel columns)
  const getPreviousMonthKeyMoroccan = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Casablanca',
      year: 'numeric',
      month: 'numeric'
    });
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1');
    
    // Calculate previous month
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }
    
    return {
      month: prevMonth,
      year: prevYear,
      key: `${prevMonth}-${prevYear}`,
      keyAlt: `${prevMonth}/${prevYear}`
    };
  };
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [matchesData, setMatchesData] = useState<any[]>([]);
  const [pastGamesData, setPastGamesData] = useState<any[]>([]);
  const [playerGamesData, setPlayerGamesData] = useState<any[]>([]);
  const [sheetData, setSheetData] = useState<any>(null); // Start with null, only show real data
  const [sheetDataLoaded, setSheetDataLoaded] = useState(false);
  const [footPlayersData, setFootPlayersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rayoSupport, setRayoSupport] = useState<Map<string, boolean>>(new Map());
  
  // Reset state on mount to prevent stale data from previous renders
  useEffect(() => {
    setLeaderboardData([]);
    setMatchesData([]);
    setPastGamesData([]);
    setPlayerGamesData([]);
    setFootPlayersData([]);
    setLoading(true);
  }, []);
  
  // Player search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // City slider state
  const [currentCitySlide, setCurrentCitySlide] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  // Update window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Calculate cards per slide based on screen width
  // Show 2 cards if width >= 768px (tablet and above), 1 card if narrower
  const cardsPerSlide = windowWidth >= 768 ? 2 : 1;
  
  // Reset slide when screen size changes
  useEffect(() => {
    setCurrentCitySlide(0);
  }, [cardsPerSlide]);

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

  // Fetch Sheet Total data - optimized with caching
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const fetchSheetData = async () => {
      try {
        // Try direct fetch first (faster, no proxy latency)
        const sheetUrl = 'https://rayobackend.onrender.com/api/sheets/Total';
        let response: Response;
        
        try {
          // Try direct fetch first (faster)
          response = await fetch(sheetUrl, { 
            signal: abortController.signal,
            cache: 'default' // Allow browser caching
          });
          
          if (!response.ok) throw new Error('Direct fetch failed');
        } catch (directError) {
          // Fallback to CORS proxy if direct fetch fails
          const proxyUrl = 'https://api.allorigins.win/raw?url=';
          const encodedUrl = encodeURIComponent(sheetUrl);
          response = await fetch(proxyUrl + encodedUrl, { 
            signal: abortController.signal,
            cache: 'default' // Allow browser caching even with proxy
          });
        }
        const csvText = await response.text();
        
        if (!isMounted) return;
          // Parse CSV data - Updated to dynamically fetch all cities
          const parseCSV = (csvText: string) => {
            const lines = csvText.split('\n').filter(line => line.trim());
            const citiesData: Array<{name: string, players: number, gamesPerWeek: number, totalGames: number}> = [];
            
            // Log headers for debugging
            if (lines.length > 0) {
              const headerLine = lines[0];
              const headers: string[] = [];
              let current = '';
              let inQuotes = false;
              for (let j = 0; j < headerLine.length; j++) {
                const char = headerLine[j];
                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                  headers.push(current.trim());
                  current = '';
                } else {
                  current += char;
                }
              }
              headers.push(current.trim());
              console.log('📊 Sheet Total Headers:', headers);
              console.log('📊 Sheet Total Column K (index 10):', headers[10]);
            }
            
            // Skip header row (index 0), process all data rows
            for (let i = 1; i < lines.length; i++) {
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
              
              // Require at least 1 column (city name), but prefer 10+ columns for full data
              if (values.length >= 1) {
                const city = values[0]; // Column A - City name
                
                // Add all cities with valid names (don't require players/games > 0)
                if (city && city.trim() !== '') {
                  // Try to get players, gamesPerWeek, and totalGames if columns exist
                  const players = values.length >= 9 ? (parseInt(values[8]) || 0) : 0; // Column I - Players
                  const gamesPerWeek = values.length >= 10 ? (parseInt(values[9]) || 0) : 0; // Column J - Games per week
                  const totalGames = values.length >= 11 ? (parseInt(values[10]) || 0) : 0; // Column K - Total games
                  
                  console.log(`📊 Sheet Total: City=${city.trim()}, Players=${players}, GamesPerWeek=${gamesPerWeek}, TotalGames=${totalGames}`);
                  citiesData.push({
                    name: city.trim(),
                    players: players,
                    gamesPerWeek: gamesPerWeek,
                    totalGames: totalGames
                  });
                }
              }
            }
            
            return { cities: citiesData };
          };
          
          const parsedData = parseCSV(csvText);
          if (isMounted) {
            setSheetData(parsedData);
            setSheetDataLoaded(true);
          }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error('Error fetching Sheet Total data:', error);
        // Set fallback values only if component is still mounted
        // Don't set fallback data - only show real data
        console.error('Failed to load Sheet Total data, cities will not be displayed');
        if (isMounted) {
          setSheetDataLoaded(false);
        }
      }
    };

    fetchSheetData();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // Fetch leaderboard data using EXACT same logic as LeaderboardSection
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const fetchLeaderboardData = async () => {
      try {
        // MUST use Foot_Players sheet (gid=1681767418) for player search
        const response = await fetch('https://rayobackend.onrender.com/api/sheets/Foot_Players', { signal: abortController.signal });
        const csvText = await response.text();
        
        if (!isMounted) return;
        
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
          
          // Dynamic column lookup for Foot_Players sheet
          const getColumnIndex = (name: string): number => {
            const lowerName = name.toLowerCase();
            return headers.findIndex(h => h.toLowerCase().includes(lowerName) || lowerName.includes(h.toLowerCase()));
          };
          
          // Find column indices dynamically
          const usernameIdx = getColumnIndex('Username') >= 0 ? getColumnIndex('Username') : 
                             getColumnIndex('PlayerUsername') >= 0 ? getColumnIndex('PlayerUsername') : 3;
          const cityIdx = getColumnIndex('City') >= 0 ? getColumnIndex('City') : 4;
          const globalScoreIdx = getColumnIndex('Global Score') >= 0 ? getColumnIndex('Global Score') : 5;
          const gamesPlayedIdx = getColumnIndex('Games Played') >= 0 ? getColumnIndex('Games Played') : 
                                getColumnIndex('Matches') >= 0 ? getColumnIndex('Matches') : -1;
          const goalsIdx = getColumnIndex('Goals') >= 0 ? getColumnIndex('Goals') : 7;
          const assistsIdx = getColumnIndex('Assists') >= 0 ? getColumnIndex('Assists') : 8;
          const levelIdx = getColumnIndex('Level') >= 0 ? getColumnIndex('Level') : -1;
          // Rank column - column G in Foot_Players sheet
          const rankIdx = (() => {
            const exactMatch = headers.findIndex(h => h.toLowerCase().trim() === 'rank');
            if (exactMatch >= 0) return exactMatch;
            const byName = getColumnIndex('Rank');
            if (byName >= 0) return byName;
            return 6; // Default to column G
          })();
          
          console.log('🔍 Football Search: Column indices - Username:', usernameIdx, 'City:', cityIdx, 'Score:', globalScoreIdx, 'Level:', levelIdx, 'Rank:', rankIdx);
          
          // Parse score with decimal handling
          const parseDecimal = (value: string): number => {
            if (!value || value === '#REF!' || value === '#N/A' || value === '#ERROR!' || value === '') return 0;
            const cleanValue = value.toString().replace(',', '.').trim();
            const parsed = parseFloat(cleanValue);
            return isNaN(parsed) ? 0 : parsed;
          };
          
          // Convert city names to French
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
          
          // Parse players using dynamic column indices
          const playersData = rows.slice(1)
            .filter(row => {
              const username = usernameIdx >= 0 ? row[usernameIdx]?.trim() : '';
              return username && username !== '' && username !== '#VALUE!' && username !== '#N/A';
            })
            .map((row: string[]) => {
              const username = usernameIdx >= 0 ? row[usernameIdx]?.trim() || 'Unknown' : 'Unknown';
              
              // Get level value
              const levelValue = levelIdx >= 0 ? row[levelIdx]?.trim() || '' : '';
              
              // Get global score
              const score = parseDecimal(globalScoreIdx >= 0 ? row[globalScoreIdx] : '0');
              
              // Get rank tier from Rank column (same logic as RankedLeaderboardSection)
              const rankValue = rankIdx >= 0 ? (row[rankIdx]?.trim() || '') : '';
              let rank = 0;
              let rankTier: string | undefined = undefined;
              
              // Try to parse rank as number first
              const parsedRank = parseInt(rankValue);
              if (!isNaN(parsedRank) && rankValue !== '' && rankValue !== '#REF!' && rankValue !== '#N/A' && rankValue !== '#ERROR!') {
                rank = parsedRank;
              } else if (rankValue && rankValue !== '#REF!' && rankValue !== '#N/A' && rankValue !== '#ERROR!' && rankValue !== '') {
                // It's a string tier like "FOX 1", "Crocodile 2", "Predator #1", etc.
                rankTier = rankValue;
              }
              
              // Calculate rankTier from score if not already set (same as RankedLeaderboardSection)
              const getRankTierFromScore = (score: number, rank: number): string => {
                if (score === 0) return "Unranked";
                if (score < 50) return "Rookie";
                if (score < 100) return "FOX 1";
                if (score < 150) return "FOX 2";
                if (score < 250) return "FOX 3";
                if (score < 400) return "Crocodile 1";
                if (score < 600) return "Crocodile 2";
                if (score < 900) return "Crocodile 3";
                if (score < 1200) return "Gorilla 1";
                if (score < 1600) return "Gorilla 2";
                if (score < 2100) return "Gorilla 3";
                if (score < 2600) return "Goat 1";
                if (score < 3300) return "Goat 2";
                if (score < 4000) return "Goat 3";
                if (score >= 4000 && rank <= 10) return `Predator #${rank}`;
                return "Goat 3";
              };
              
              if (!rankTier) {
                rankTier = getRankTierFromScore(score, rank);
              }
              
              return {
                rank: rank,
                cityRank: 0,
                firstName: username.split(' ')[0] || username,
                username: username,
                city: convertToFrench(cityIdx >= 0 ? row[cityIdx]?.trim() || 'Non spécifié' : 'Non spécifié'),
                globalScore: score,
                gamesPlayed: parseInt(gamesPlayedIdx >= 0 ? row[gamesPlayedIdx] : '0') || 0,
                goals: parseInt(goalsIdx >= 0 ? row[goalsIdx] : '0') || 0,
                assists: parseInt(assistsIdx >= 0 ? row[assistsIdx] : '0') || 0,
                teamWins: 0,
                attackRatio: 0,
                defenseRatio: 0,
                individualScore: 0,
                teamScore: 0,
                level: levelValue,
                rankTier: rankTier
              };
            });
          
          // Sort by Global Score (descending) and assign proper ranks
          const sortedPlayers = playersData.sort((a, b) => b.globalScore - a.globalScore);
          const rankedPlayers = sortedPlayers.map((player, index) => ({
            ...player,
            rank: index + 1,
            cityRank: index + 1
          }));
          
          console.log('✅ Football Search: Loaded', rankedPlayers.length, 'players from Foot_Players sheet');
          
          if (isMounted) {
            setLeaderboardData(rankedPlayers);
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error('Error fetching leaderboard data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLeaderboardData();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // Fetch matches data using EXACT same logic as UpcomingMatchesSection
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const fetchMatchesData = async () => {
      try {
        // Use the exact same URL and approach as UpcomingMatchesSection
        // MUST use WebsiteGame sheet (gid=216631647) for upcoming matches data
        const csvUrl = 'https://rayobackend.onrender.com/api/sheets/WebsiteGame';
        
        // Use default cache - browser will cache for better performance
        const response = await fetch(csvUrl, {
          signal: abortController.signal,
          cache: 'default', // Allow browser caching
          redirect: 'follow',
          headers: {
            'Accept': 'text/csv,text/plain,*/*'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        if (!isMounted) return;
        
        // Check if the response is actually CSV data (not HTML error page)
        if (csvText.includes('<!DOCTYPE html>') || csvText.includes('Page introuvable') || csvText.includes('<TITLE>Temporary Redirect</TITLE>')) {
          throw new Error('Google Sheets a retourné une page d\'erreur HTML au lieu des données CSV');
        }
        
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
            // A: GameID, B: Terrain, C: Date, D: City, E: PlayerUsername, F: Match, G: Team, H: Number, I: Capitaine, J: Mode, K: Price, L: PlayerPerTeam, M: TeamQTY, N: Level
            const gameId = values[0] || '';           // Column A: GameID
            const terrain = values[1] || '';         // Column B: Terrain
            const dateTime = values[2] || '';        // Column C: Date (with time)
            const city = values[3] || '';            // Column D: City
            const playerName = values[4] || '';      // Column E: PlayerUsername (NOT Status!)
            const matchNumber = values[5] || '';     // Column F: Match
            const team = values[6] || '';            // Column G: Team
            const playerNumber = values[7] || '';    // Column H: Number
            const capitaine = values[8] || '';       // Column I: Capitaine
            const gameMode = values[9] || '';        // Column J: Mode
            const price = values[10] || '';           // Column K: Price
            const playersPerTeam = values[11] || ''; // Column L: PlayerPerTeam
            const teamQTY = values[12] || '';        // Column M: TeamQTY
            const level = values[13] || '';           // Column N: Level
            
            console.log(`WebsiteGame data for gameId ${gameId}:`);
            console.log(`  - PlayerPerTeam: ${playersPerTeam}, TeamQTY: ${teamQTY}, Team: ${team}`);
            
            if (!gameId || gameId.trim() === '' || gameId === '#N/A' || gameId === '#REF!' || gameId === '#ERROR!') {
              continue;
            }
            
            // Skip if no date/time
            if (!dateTime || dateTime === '#N/A' || dateTime === '#REF!' || dateTime === '#ERROR!') {
              continue;
            }
            
            // Parse date and check if it's upcoming (only show future matches)
            let matchDate: Date | null = null;
            try {
              matchDate = new Date(dateTime);
              if (isNaN(matchDate.getTime())) {
                console.warn(`Invalid date format for gameId ${gameId}: ${dateTime}`);
                continue;
              }
              // Only show upcoming matches
              if (matchDate <= new Date()) {
                continue; // Skip past matches
              }
            } catch (error) {
              console.warn(`Error parsing date for gameId ${gameId}: ${dateTime}`, error);
              continue;
            }
            
            // Parse date and time strings
            const dateStr = matchDate.toISOString().split('T')[0];
            const timeStr = matchDate.toTimeString().slice(0, 5);
            
            // Validate that we have the right data
            if (!city || city === '#N/A' || city === '#REF!' || city === '#ERROR!') {
              console.log(`  - Skipping invalid match data for gameId ${gameId} (missing city)`);
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
              // Calculate maxPlayers from PlayerPerTeam and TeamQTY columns
              let maxPlayers = 10; // Default fallback
              let gameFormat = '5vs5';
              
              const playersPerTeamNum = parseInt(playersPerTeam) || 5; // Default 5 players per team
              const teamCount = parseInt(teamQTY) || 2; // Default 2 teams
              
              maxPlayers = playersPerTeamNum * teamCount;
              
              // Set game format based on the calculated values
              if (teamCount === 2) {
                gameFormat = `${playersPerTeamNum}vs${playersPerTeamNum}`;
              } else if (teamCount === 3) {
                gameFormat = `3x${playersPerTeamNum}`;
              } else if (teamCount === 4) {
                gameFormat = `4x${playersPerTeamNum}`;
              } else {
                gameFormat = `${teamCount}x${playersPerTeamNum}`;
              }
              
              const matchPrice = price && price !== '#REF!' && price !== '#N/A' && price !== '#ERROR!' 
                ? parseFloat(price.toString().replace(',', '.').trim()) || 0 
                : 0;
              
              const matchLevel = level && level !== '#REF!' && level !== '#N/A' && level !== '#ERROR!' 
                ? level 
                : '';
              
              const captainName = capitaine && capitaine !== '#REF!' && capitaine !== '#N/A' && capitaine !== '#ERROR!' 
                ? capitaine 
                : playerName; // Fallback to first player if no captain
              
              console.log(`Calculating maxPlayers for gameId ${gameId}: ${playersPerTeamNum} players per team × ${teamCount} teams = ${maxPlayers} max players`);
              
              const match = {
                id: `MATCH_${gameId}`,
                gameId: gameId,
                city: convertToFrench(city || "Casablanca"),
                field: terrain || "Terrain Rayo Sport",
                date: dateStr,
                time: timeStr,
                format: gameFormat,
                status: "Besoin d'autres joueurs", // Will be calculated based on player count
                maxPlayers: maxPlayers,
                captain: captainName,
                mode: gameMode.trim() || "Classic",
                price: matchPrice,
                level: matchLevel,
                players: [] // Will be populated as we process players
              };
              console.log(`Creating match for gameId ${gameId}:`, match);
              matchesMap.set(gameId, match);
            }
            
            // Add player to the match
            const existingMatch = matchesMap.get(gameId);
            if (existingMatch && playerName && playerName.trim() && playerName !== '#N/A' && playerName !== '#REF!' && playerName !== '#ERROR!') {
              // Map team names
              let teamName: "Orange" | "Jaune" | "Blue" | "Yellow" | "Vert" | undefined;
              if (team) {
                const teamLower = team.toLowerCase().trim();
                switch (teamLower) {
                  case 'orange': teamName = "Orange"; break;
                  case 'jaune': case 'yellow': teamName = "Jaune"; break;
                  case 'blue': teamName = "Blue"; break;
                  case 'vert': case 'green': teamName = "Vert"; break;
                  case 'a': teamName = "Orange"; break;
                  case 'b': teamName = "Jaune"; break;
                  case 'c': teamName = "Blue"; break;
                  case 'd': teamName = "Vert"; break;
                }
              }
              
              const parsedPlayerNumber = playerNumber && playerNumber !== '#REF!' && playerNumber !== '#N/A' && playerNumber !== '#ERROR!' 
                ? parseInt(playerNumber) || undefined 
                : undefined;
              
              // Check if player already exists
              const existingPlayer = existingMatch.players.find(p => 
                p.username.toLowerCase() === playerName.toLowerCase() || 
                p.id === `${gameId}_${playerName}`
              );
              
              if (!existingPlayer) {
                existingMatch.players.push({
                  id: `${gameId}_${playerName}`,
                  username: playerName,
                  fullName: playerName,
                  globalScore: 0, // Not available in WebsiteGame
                  gamesPlayed: 0, // Not available in WebsiteGame
                  ranking: 0, // Not available in WebsiteGame
                  cityRanking: 0, // Not available in WebsiteGame
                  paymentStatus: "Non payé" as const,
                  isNewPlayer: false,
                  goals: 0,
                  assists: 0,
                  teamWins: 0,
                  team: teamName,
                  jerseyNumber: parsedPlayerNumber
                });
                console.log(`Added player ${playerName} to match ${gameId}. Total players: ${existingMatch.players.length}`);
              } else {
                // Update existing player's team
                existingPlayer.team = teamName;
                existingPlayer.jerseyNumber = parsedPlayerNumber ?? existingPlayer.jerseyNumber;
              }
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
            if (isMounted) {
              setMatchesData(parsedMatches);
            }
        } catch (parseError) {
          console.error('Error parsing matches CSV:', parseError);
          if (isMounted) {
            setMatchesData([]);
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error('Error fetching matches data:', error);
      }
    };

    fetchMatchesData();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // Fetch past games data - using same logic as PastGamesSection
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const fetchPastGamesData = async () => {
      try {
        const csvUrl = 'https://rayobackend.onrender.com/api/sheets/Foot_Team';

        const response = await fetch(csvUrl, {
          signal: abortController.signal,
          cache: 'no-store',
          redirect: 'follow',
          headers: {
            'Accept': 'text/csv,text/plain,*/*'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        if (csvText.includes('<!DOCTYPE html>') || csvText.includes('Page introuvable')) {
          throw new Error('Google Sheets returned HTML error page');
        }
        
        // Parse CSV - same logic as PastGamesSection
        const parseCSV = (csvData: string) => {
          const lines = csvData.split('\n').filter(line => line.trim());
          if (lines.length < 2) return [];
          
          const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
          const getColumnIndex = (columnName: string): number => {
            return headers.findIndex(header => header.toLowerCase() === columnName.toLowerCase());
          };
          
          const players: any[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            
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
            
            const gameId = row[getColumnIndex('Game ID')] || '';
            const city = row[getColumnIndex('City')] || '';
            const date = row[getColumnIndex('Date&Time')] || '';
            const playerUsername = row[getColumnIndex('PlayerUsername')] || row[getColumnIndex('Player Username')] || '';
            
            if (gameId && city) {
              players.push({ gameId, city, date, playerUsername });
            }
          }
          
          // Group by game ID and date, but keep player info for streak calculation
          const gamesMap = new Map<string, any>();
          const playerGames: any[] = [];
          
          players.forEach(player => {
            const gameKey = `${player.gameId}_${player.date}`;
            if (!gamesMap.has(gameKey)) {
              gamesMap.set(gameKey, {
                gameId: player.gameId,
                date: player.date,
                city: player.city
              });
            }
            
            // Also store player participation for streak calculation
            if (player.playerUsername) {
              playerGames.push({
                gameId: player.gameId,
                date: player.date,
                city: player.city,
                playerUsername: player.playerUsername
              });
            }
          });
          
          // Store both games and player participation
          return {
            games: Array.from(gamesMap.values()),
            playerGames: playerGames
          };
        };
        
        const parsedData = parseCSV(csvText);
        if (isMounted) {
          setPastGamesData(parsedData.games || []);
          // Store player games separately for streak calculation
          setPlayerGamesData(parsedData.playerGames || []);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error('Error fetching past games data:', error);
        if (isMounted) {
          setPastGamesData([]);
        }
      }
    };

    fetchPastGamesData();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // Fetch Foot_Players data for LevelValue-based top players
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const fetchFootPlayersData = async () => {
      try {
        const csvUrl = 'https://rayobackend.onrender.com/api/sheets/Foot_Players';
        const response = await fetch(csvUrl, { signal: abortController.signal });
        const csvText = await response.text();
        
        if (!isMounted) return;
        
        // Parse CSV
        const parseCSV = (csvText: string) => {
          const lines = csvText.split('\n').filter(line => line.trim());
          if (lines.length < 2) return [];
          
          // Parse header row with quoted values
          const parseCSVLine = (line: string): string[] => {
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
            return values;
          };
          
          const headers = parseCSVLine(lines[0]);
          console.log('Foot_Players headers:', headers);
          
          const levelValueIdx = headers.findIndex(h => h.toLowerCase().trim() === 'levelvalue' || h.toLowerCase().trim().includes('levelvalue'));
          const cityIdx = headers.findIndex(h => h.toLowerCase().trim() === 'city' || h.toLowerCase().trim().includes('city'));
          const usernameIdx = headers.findIndex(h => h.toLowerCase().trim() === 'username' || h.toLowerCase().trim().includes('username'));
          
          // Look for "Points" column - prioritize exact match, then any "points" that's not monthly
          let pointsIdx = headers.findIndex(h => {
            const hLower = h.toLowerCase().trim();
            return hLower === 'points';
          });
          
          // If exact match not found, try to find any points column that's not monthly
          if (pointsIdx === -1) {
            pointsIdx = headers.findIndex(h => {
              const hLower = h.toLowerCase().trim();
              return hLower.includes('points') && !hLower.includes('monthly');
            });
          }
          
          // Look for MonthlyPoints column
          const monthlyPointsIdx = headers.findIndex(h => {
            const hLower = h.toLowerCase().trim();
            return hLower === 'monthlypoints' || hLower.includes('monthlypoints');
          });
          
          // Look for Rank column
          const rankIdx = headers.findIndex(h => {
            const hLower = h.toLowerCase().trim();
            return hLower === 'rank' || (hLower.includes('rank') && !hLower.includes('monthly') && !hLower.includes('level'));
          });
          
          // Look for Streaks column
          const streaksIdx = headers.findIndex(h => {
            const hLower = h.toLowerCase().trim();
            return hLower === 'streaks' || hLower.includes('streak');
          });
          
          // Find RayoSupport column - MUST use column BD "RayoSupport" from Foot_Players sheet
          const rayoSupportIdx = (() => {
            // First try exact match for "RayoSupport" (column BD = index 55)
            const exactRayoSupportIndex = headers.findIndex(h => h.trim() === 'RayoSupport');
            if (exactRayoSupportIndex >= 0) {
              console.log('✅ CitiesOverview: Found RayoSupport column at index', exactRayoSupportIndex);
              return exactRayoSupportIndex;
            }
            // Fallback: case-insensitive search
            const rayoSupportIndex = headers.findIndex(h => h.toLowerCase().trim() === 'rayosupport');
            if (rayoSupportIndex >= 0) return rayoSupportIndex;
            console.warn('⚠️ CitiesOverview: RayoSupport column not found');
            return -1;
          })();
          
          // Find all monthly points columns by checking header format (MM-YYYY, MM/YYYY, or month names)
          const monthlyPointsColumns: { [key: string]: number } = {}; // key: header name, value: column index
          
          headers.forEach((header, index) => {
            const headerTrimmed = header.trim();
            
            // Check for MM-YYYY or MM/YYYY format (e.g., "10-2025", "1-2026", "11/2025")
            const dateFormatMatch = headerTrimmed.match(/^(\d{1,2})[-/](\d{4})$/);
            if (dateFormatMatch) {
              const month = parseInt(dateFormatMatch[1]);
              const year = parseInt(dateFormatMatch[2]);
              monthlyPointsColumns[headerTrimmed] = index;
              console.log(`Found monthly points column (MM-YYYY format): "${headerTrimmed}" (Month: ${month}, Year: ${year}) at index ${index}`);
            } else {
              // Also check for French month names as fallback
              const hLower = headerTrimmed.toLowerCase();
              const frenchMonths = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
              frenchMonths.forEach((month) => {
                if (hLower.includes(month)) {
                  monthlyPointsColumns[headerTrimmed] = index;
                  console.log(`Found monthly points column (French month): "${headerTrimmed}" for month "${month}" at index ${index}`);
                }
              });
            }
          });
          
          console.log('Foot_Players column indices:', {
            levelValueIdx,
            cityIdx,
            usernameIdx,
            pointsIdx,
            monthlyPointsIdx,
            rankIdx,
            streaksIdx,
            rayoSupportIdx,
            pointsColumnName: pointsIdx >= 0 ? headers[pointsIdx] : 'NOT FOUND',
            monthlyPointsColumnName: monthlyPointsIdx >= 0 ? headers[monthlyPointsIdx] : 'NOT FOUND',
            rankColumnName: rankIdx >= 0 ? headers[rankIdx] : 'NOT FOUND',
            streaksColumnName: streaksIdx >= 0 ? headers[streaksIdx] : 'NOT FOUND',
            rayoSupportColumnName: rayoSupportIdx >= 0 ? headers[rayoSupportIdx] : 'NOT FOUND',
            monthlyPointsColumns
          });
          
          if (levelValueIdx === -1 || cityIdx === -1 || usernameIdx === -1) {
            console.error('Required columns not found in Foot_Players sheet', {
              headers: headers,
              levelValueIdx,
              cityIdx,
              usernameIdx,
              pointsIdx,
              monthlyPointsIdx,
              rankIdx
            });
            return { players: [], monthlyPointsColumns: {}, rayoSupport: new Map<string, boolean>() };
          }
          
          const players: any[] = [];
          const rayoSupportMap = new Map<string, boolean>();
          
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            
            const levelValue = values[levelValueIdx]?.trim();
            const city = values[cityIdx]?.trim();
            const username = values[usernameIdx]?.trim();
            const points = pointsIdx >= 0 ? values[pointsIdx]?.trim() : '';
            const monthlyPoints = monthlyPointsIdx >= 0 ? values[monthlyPointsIdx]?.trim() : '';
            const rank = rankIdx >= 0 ? values[rankIdx]?.trim() : '';
            const streaks = streaksIdx >= 0 ? values[streaksIdx]?.trim() : '';
            
            // Extract RayoSupport from RayoSupport column (column BD "RayoSupport" in Foot_Players sheet)
            if (rayoSupportIdx >= 0 && rayoSupportIdx < values.length && username) {
              const rayoSupportValue = values[rayoSupportIdx]?.trim();
              if (rayoSupportValue && 
                  rayoSupportValue !== '#REF!' && 
                  rayoSupportValue !== '#N/A' && 
                  rayoSupportValue !== '#ERROR!' && 
                  rayoSupportValue !== '' &&
                  rayoSupportValue !== '#VALUE!') {
                // Check if value is "1" or "true" or "yes"
                const hasRayoSupport = rayoSupportValue === '1' || rayoSupportValue.toLowerCase() === 'true' || rayoSupportValue.toLowerCase() === 'yes';
                if (hasRayoSupport) {
                  rayoSupportMap.set(username.toLowerCase().trim(), true);
                }
              }
            }
            
            // Parse monthly points for each month (using header name as key)
            const monthlyPointsData: { [key: string]: number } = {};
            Object.keys(monthlyPointsColumns).forEach(headerName => {
              const colIdx = monthlyPointsColumns[headerName];
              if (colIdx >= 0 && colIdx < values.length && values[colIdx]) {
                const value = values[colIdx]?.trim() || '';
                // Skip error values
                if (value !== '#REF!' && value !== '#N/A' && value !== '#ERROR!' && value !== '') {
                  const numValue = value ? parseFloat(value.replace(',', '.')) : 0;
                  monthlyPointsData[headerName] = isNaN(numValue) ? 0 : numValue;
                }
              }
            });
            
            if (levelValue && city && username && 
                levelValue !== '#REF!' && levelValue !== '#N/A' && levelValue !== '#ERROR!' && levelValue !== '') {
              const levelValueNum = parseFloat(levelValue.replace(',', '.'));
              const pointsNum = points ? parseFloat(points.replace(',', '.')) : 0;
              const monthlyPointsNum = monthlyPoints ? parseFloat(monthlyPoints.replace(',', '.')) : 0;
              const streaksNum = streaks ? parseFloat(streaks.replace(',', '.')) : 0;
              if (!isNaN(levelValueNum)) {
                players.push({
                  username: username,
                  city: city,
                  levelValue: levelValueNum,
                  points: isNaN(pointsNum) ? 0 : pointsNum,
                  monthlyPoints: isNaN(monthlyPointsNum) ? 0 : monthlyPointsNum,
                  rank: rank || '',
                  streaks: isNaN(streaksNum) ? 0 : streaksNum,
                  monthlyPointsData: monthlyPointsData // Store all monthly points
                });
              }
            }
          }
          
          console.log(`✅ CitiesOverview: Loaded rayoSupport for ${rayoSupportMap.size} players`);
          
          return { players, monthlyPointsColumns, rayoSupport: rayoSupportMap };
        };
        
        const result = parseCSV(csvText) as { players: any[]; monthlyPointsColumns: { [key: string]: number }; rayoSupport: Map<string, boolean> };
        const players = result?.players || [];
        const monthlyPointsColumns = result?.monthlyPointsColumns || {};
        const rayoSupportData = result?.rayoSupport || new Map<string, boolean>();
        if (isMounted) {
          setFootPlayersData(players);
          setRayoSupport(rayoSupportData);
          // Store monthly points columns mapping for later use
          (window as any).footPlayersMonthlyColumns = monthlyPointsColumns;
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error('Error fetching Foot_Players data:', error);
        if (isMounted) {
          setFootPlayersData([]);
        }
      }
    };
    
    fetchFootPlayersData();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // Get rank tier name based on points (matching Google Sheets formula from RankedLeaderboardSection)
  const getRankTierFromPoints = (points: number, rank: number): string => {
    if (points === 0) return "Unranked";
    if (points < 50) return "Rookie";
    if (points < 100) return "FOX 1";
    if (points < 150) return "FOX 2";
    if (points < 250) return "FOX 3";
    if (points < 400) return "Crocodile 1";
    if (points < 600) return "Crocodile 2";
    if (points < 900) return "Crocodile 3";
    if (points < 1200) return "Gorilla 1";
    if (points < 1600) return "Gorilla 2";
    if (points < 2100) return "Gorilla 3";
    if (points < 2600) return "Goat 1";
    if (points < 3300) return "Goat 2";
    if (points < 4000) return "Goat 3";
    if (points >= 4000 && rank <= 10) return `Predator #${rank}`;
    return "Goat 3";
  };

  // Get previous month's champion for a city based on monthly points columns
  const getPreviousMonthChampion = (cityName: string) => {
    try {
      if (!footPlayersData || footPlayersData.length === 0) {
        console.log(`No Foot_Players data for ${cityName}`);
        return null;
      }
      
      // Get previous month in MM-YYYY format using Moroccan timezone
      const previousMonthInfo = getPreviousMonthKeyMoroccan();
      const previousMonthKey = previousMonthInfo.key; // e.g., "10-2025"
      const previousMonthKeyAlt = previousMonthInfo.keyAlt; // e.g., "10/2025" (alternative format)
      
      // Also try French month name as fallback (using Moroccan timezone)
      const previousMonthName = getPreviousMonthNameMoroccan();
      const previousMonthNameLower = previousMonthName.toLowerCase();
      
      console.log(`Looking for previous month champion for ${cityName}, month key: ${previousMonthKey} or ${previousMonthNameLower}`);
      
      // Get monthly columns mapping (key is the header name)
      const monthlyPointsColumns = (window as any).footPlayersMonthlyColumns || {};
      
      // Try to find the column by MM-YYYY format first, then by French month name
      let monthColumnKey = Object.keys(monthlyPointsColumns).find(header => {
        const headerTrimmed = header.trim();
        return headerTrimmed === previousMonthKey || headerTrimmed === previousMonthKeyAlt;
      });
      
      // If not found, try French month name
      if (!monthColumnKey) {
        monthColumnKey = Object.keys(monthlyPointsColumns).find(header => {
          const headerLower = header.toLowerCase().trim();
          return headerLower.includes(previousMonthNameLower);
        });
      }
      
      if (!monthColumnKey) {
        console.log(`No column found for previous month. Available columns:`, Object.keys(monthlyPointsColumns));
        return null;
      }
      
      console.log(`Found previous month column: "${monthColumnKey}"`);
      
      const normalizedCityName = cityName.trim();
      const cityLower = normalizedCityName.toLowerCase();
      
      // City name variations mapping (same as used in other functions)
      const cityVariations: { [key: string]: string[] } = {
        'Casablanca': ['Casablanca', 'Casa'],
        'Rabat': ['Rabat'],
        'Fez': ['Fez', 'Fès', 'Fes'],
        'Marrakech': ['Marrakech', 'Marrakesh'],
        'Tangier': ['Tangier', 'Tanger'],
        'Agadir': ['Agadir'],
        'Meknes': ['Meknes', 'Meknès'],
        'Oujda': ['Oujda'],
        'Kenitra': ['Kenitra', 'Kénitra'],
        'Tetouan': ['Tetouan', 'Tétouan'],
        'Safi': ['Safi'],
        'Mohammedia': ['Mohammedia'],
        'Khouribga': ['Khouribga'],
        'Beni Mellal': ['Beni Mellal', 'Béni Mellal'],
        'El Jadida': ['El Jadida'],
        'Taza': ['Taza'],
        'Nador': ['Nador'],
        'Settat': ['Settat'],
        'Larache': ['Larache'],
        'Ksar el Kebir': ['Ksar el Kebir', 'Ksar el-Kébir'],
        'Sale': ['Sale', 'Salé'],
        'Berrechid': ['Berrechid'],
        'Khemisset': ['Khemisset', 'Khémisset'],
        'Inezgane': ['Inezgane'],
        'Ait Melloul': ['Ait Melloul', 'Aït Melloul'],
        'Bouskoura': ['Bouskoura']
      };
      
      let allVariations: string[] = [];
      // Check for exact match first
      if (cityVariations[normalizedCityName]) {
        allVariations = cityVariations[normalizedCityName].map(v => v.toLowerCase());
      } else {
        // Try to find a partial match in cityVariations keys
        const matchingKey = Object.keys(cityVariations).find(key => {
          const keyLower = key.toLowerCase();
          return keyLower === cityLower || cityLower.includes(keyLower) || keyLower.includes(cityLower);
        });
        if (matchingKey) {
          allVariations = cityVariations[matchingKey].map(v => v.toLowerCase());
        } else {
          allVariations = [cityLower];
        }
      }
      
      // Special case: Always include both Marrakech and Marrakesh variations if searching for either
      if (cityLower.includes('marrakech') || cityLower.includes('marrakesh')) {
        allVariations = ['marrakech', 'marrakesh', 'marakkech', 'marakkesh'];
      }
      
      console.log(`City variations for ${cityName}:`, allVariations);
      
      // Filter players by city
      const cityPlayers = footPlayersData.filter((player: any) => {
        if (!player.city) return false;
        const playerCityRaw = (player.city || '').toLowerCase().trim();
        const playerCities = playerCityRaw.split(',').map((c: string) => c.trim().toLowerCase());
        
        const matches = playerCities.some((pc: string) => {
          // Check exact match with variations
          if (allVariations.some(v => v === pc)) return true;
          // Check if variation is included in player city
          if (allVariations.some(v => pc.includes(v))) return true;
          // Check if player city is included in variation
          if (allVariations.some(v => v.includes(pc))) return true;
          // Fallback: direct city name matching
          if (pc === cityLower || cityLower.includes(pc) || pc.includes(cityLower)) return true;
          return false;
        });
        
        // Additional check for raw city string (handles cases where city is not comma-separated)
        if (!matches && playerCityRaw) {
          if (allVariations.some(v => playerCityRaw.includes(v))) return true;
          if (playerCityRaw.includes(cityLower) || cityLower.includes(playerCityRaw)) return true;
        }
        
        return matches;
      });
      
      console.log(`Found ${cityPlayers.length} players for ${cityName} in Foot_Players data`);
      
        // Sort by previous month's points, filtering out players with 0 points in that month
        const sortedPlayers = cityPlayers
          .filter((player: any) => {
            // Only include players that have monthlyPointsData
            if (!player.monthlyPointsData || typeof player.monthlyPointsData !== 'object') {
              return false;
            }
            // Get previous month's points for this player
            const monthPoints = player.monthlyPointsData[monthColumnKey];
            const points = monthPoints ? parseFloat(String(monthPoints).replace(',', '.')) : 0;
            // Filter out players with 0 points (unranked in that month)
            return points > 0;
          })
          .sort((a: any, b: any) => {
          const aPoints = (a.monthlyPointsData && a.monthlyPointsData[monthColumnKey]) ? parseFloat(String(a.monthlyPointsData[monthColumnKey]).replace(',', '.')) : 0;
          const bPoints = (b.monthlyPointsData && b.monthlyPointsData[monthColumnKey]) ? parseFloat(String(b.monthlyPointsData[monthColumnKey]).replace(',', '.')) : 0;
          return bPoints - aPoints;
        });
      
      if (sortedPlayers.length === 0) {
        console.log(`No players found for ${cityName} in previous month`);
        return null;
      }
      
      const champion = sortedPlayers[0];
        const championPointsValue = champion.monthlyPointsData?.[monthColumnKey];
        const championPoints = championPointsValue ? parseFloat(String(championPointsValue).replace(',', '.')) : 0;
        
        // Filter out unranked players (0 points or unranked rank)
        if (championPoints === 0) {
          console.log(`Champion for ${cityName} has 0 points, skipping`);
          return null;
        }
        
        // Calculate rank tier based on previous month's points (not current rank)
        // The champion is rank 1 for that month
        const championRankTier = getRankTierFromPoints(championPoints, 1);
        
        // Final check: if calculated rank tier is unranked, skip
        if (championRankTier.toLowerCase().includes('unranked')) {
          console.log(`Champion for ${cityName} calculated rank is unranked, skipping`);
          return null;
        }
      
      console.log(`Previous month champion for ${cityName}:`, {
        name: champion.username,
        points: championPoints,
        rankTier: championRankTier,
        previousRank: champion.rank
      });
      
      return {
        name: champion.username || 'Unknown',
        points: Math.round(championPoints),
        rank: championRankTier, // Use calculated rank tier based on previous month points
        previousRank: champion.rank || '' // Keep original rank for reference if needed
      };
    } catch (error) {
      console.error(`Error getting previous month champion for ${cityName}:`, error);
      return null; // Return null on error to prevent breaking city cards
    }
  };

  // Get top 3 players for each city based on LevelValue from Foot_Players sheet
  const getTopPlayersForCity = (cityName: string) => {
    if (!footPlayersData || footPlayersData.length === 0) {
      console.log(`No Foot_Players data for ${cityName}`);
      return [];
    }
    
    // Normalize city name for matching (handle variations)
    const normalizedCityName = cityName.trim();
    const cityLower = normalizedCityName.toLowerCase();
    
    // Handle common city name variations (especially Marrakech/Marrakesh)
    const cityVariations: { [key: string]: string[] } = {
      'marrakech': ['marrakech', 'marrakesh', 'marakkech', 'marakkesh'],
      'casablanca': ['casablanca', 'casa', 'casablanka'],
      'rabat': ['rabat', 'ribat'],
      'tanger': ['tanger', 'tangier', 'tanger ville'],
      'fès': ['fès', 'fes', 'fez'],
      'agadir': ['agadir'],
      'meknès': ['meknès', 'meknes'],
      'oujda': ['oujda', 'oujdaa'],
      'kenitra': ['kenitra', 'kenitraa'],
      'tetouan': ['tetouan', 'tetouane'],
      'safi': ['safi', 'asfi'],
      'el jadida': ['el jadida', 'eljadida', 'jadida'],
      'berrechid': ['berrechid', 'berrechide']
    };
    
    // Get all possible variations for this city
    let allVariations: string[] = [];
    for (const [key, variations] of Object.entries(cityVariations)) {
      // Check if the city name matches the key or any of its variations
      const keyMatches = cityLower.includes(key) || key.includes(cityLower);
      const variationMatches = variations.some(v => cityLower.includes(v) || v.includes(cityLower));
      
      if (keyMatches || variationMatches) {
        allVariations.push(...variations);
        break; // Found matching key
      }
    }
    // If no variations found, use the original city name
    if (allVariations.length === 0) {
      allVariations.push(cityLower);
    }
    
    // Special case: Always include both Marrakech and Marrakesh variations if searching for either
    if (cityLower.includes('marrakech') || cityLower.includes('marrakesh')) {
      allVariations = ['marrakech', 'marrakesh', 'marakkech', 'marakkesh'];
    }
    
    console.log(`Looking for players in city: ${normalizedCityName}`);
    console.log(`City variations to match:`, allVariations);
    console.log(`Total players in leaderboard: ${leaderboardData.length}`);
    
    
    // Filter players by city using flexible matching
    const cityPlayers = footPlayersData.filter((player: any) => {
      if (!player.city) return false;
      const playerCityRaw = (player.city || '').toLowerCase().trim();
      const playerCities = playerCityRaw.split(',').map((c: string) => c.trim().toLowerCase());
      
      // Check if any player city matches any variation
      const matches = playerCities.some((pc: string) => {
        // Check exact match with any variation
        if (allVariations.some(v => v === pc)) return true;
        // Check if any variation is included in player city
        if (allVariations.some(v => pc.includes(v))) return true;
        // Check if player city is included in any variation
        if (allVariations.some(v => v.includes(pc))) return true;
        // Also check direct city name match
        if (pc === cityLower || cityLower.includes(pc) || pc.includes(cityLower)) return true;
        // Check the raw player city string as well (in case it's not comma-separated)
        if (allVariations.some(v => playerCityRaw.includes(v))) return true;
        if (playerCityRaw.includes(cityLower) || cityLower.includes(playerCityRaw)) return true;
        return false;
      });
      
      // Additional check on the raw city string if comma-separated check didn't match
      if (!matches && playerCityRaw) {
        if (allVariations.some(v => playerCityRaw.includes(v))) return true;
        if (playerCityRaw.includes(cityLower) || cityLower.includes(playerCityRaw)) return true;
      }
      
      return matches;
    });
    
    console.log(`Found ${cityPlayers.length} players for ${normalizedCityName} in Foot_Players`);
    if (cityPlayers.length > 0) {
      console.log(`Sample players:`, cityPlayers.slice(0, 3).map((p: any) => ({ name: p.username, city: p.city, levelValue: p.levelValue })));
    }
    
    // Sort by LevelValue (descending)
    const sortedPlayers = cityPlayers.sort((a: any, b: any) => (b.levelValue || 0) - (a.levelValue || 0));
    
    // Take top 3 and return with proper formatting
    const top3 = sortedPlayers.slice(0, 3).map((player: any, index: number) => {
      const levelValueInt = Math.round(player.levelValue || 0);
      const pointsInt = Math.round(player.points || 0);
      return {
        name: player.username || 'Unknown',
        levelValue: `Level ${levelValueInt}`,
        levelValueNum: levelValueInt, // Store numeric value for badge color
        points: pointsInt,
      rank: index + 1
      };
    });
    
    console.log(`Top 3 for ${cityName} by LevelValue:`, top3);
    return top3;
  };

  // Format rank tier for display (convert all rank numbers to Roman numerals)
  const formatRankTierForDisplay = (tier: string): string => {
    if (!tier) return '';
    const tierLower = tier.toLowerCase().trim();
    
    // FOX ranks (case-insensitive matching)
    if (tierLower === 'fox 1' || tier === 'FOX 1') return 'FOX I';
    if (tierLower === 'fox 2' || tier === 'FOX 2') return 'FOX II';
    if (tierLower === 'fox 3' || tier === 'FOX 3') return 'FOX III';
    // Crocodile ranks
    if (tierLower === 'crocodile 1' || tier === 'Crocodile 1') return 'Crocodile I';
    if (tierLower === 'crocodile 2' || tier === 'Crocodile 2') return 'Crocodile II';
    if (tierLower === 'crocodile 3' || tier === 'Crocodile 3') return 'Crocodile III';
    // Gorilla ranks (handle both with and without spaces)
    if (tierLower === 'gorilla 1' || tier === 'Gorilla 1' || tierLower === 'gorilla1' || tier === 'Gorilla1') return 'Gorilla I';
    if (tierLower === 'gorilla 2' || tier === 'Gorilla 2' || tierLower === 'gorilla2' || tier === 'Gorilla2') return 'Gorilla II';
    if (tierLower === 'gorilla 3' || tier === 'Gorilla 3' || tierLower === 'gorilla3' || tier === 'Gorilla3') return 'Gorilla III';
    // Goat ranks
    if (tierLower === 'goat 1' || tier === 'Goat 1') return 'Goat I';
    if (tierLower === 'goat 2' || tier === 'Goat 2') return 'Goat II';
    if (tierLower === 'goat 3' || tier === 'Goat 3') return 'Goat III';
    
    return tier;
  };

  // Get badge class for level (same as LeaderboardSection getLevelBadgeColor - gradient badges based on level segments)
  const getLevelBadgeClass = (levelValue: number): string => {
    if (levelValue <= 0) return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md';
    const segment = Math.floor(levelValue / 10);
    const colorMap: { [key: number]: string } = {
      0: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md',      // Level 1-9
      1: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md',      // Level 10-19
      2: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md',    // Level 20-29
      3: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-md',   // Level 30-39
      4: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md',  // Level 40-49
      5: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md',        // Level 50-59
      6: 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md',      // Level 60-69
      7: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md',  // Level 70-79
      8: 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md',  // Level 80-89
      9: 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md',      // Level 90-99
    };
    // For level 100+, cycle through colors again
    const cycleIndex = segment % 10;
    return colorMap[cycleIndex] || colorMap[0];
  };

  // Get badge class for rank name (same as RankedLeaderboardSection)
  const getRankBadgeClass = (rankName: string): string => {
    if (!rankName) return 'bg-blue-500 text-white';
    
    const tierLower = rankName.toLowerCase().trim();
    
    if (tierLower.includes('predator')) {
      return 'bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 via-cyan-400 to-yellow-400 text-white shadow-lg shadow-yellow-400/50 animate-gradient bg-[length:200%_200%] font-extrabold';
    } else if (tierLower.includes('goat')) {
      if (tierLower.includes('goat 3') || tierLower.includes('goat3')) {
        return 'bg-gradient-to-r from-pink-400 via-purple-500 to-rose-500 text-white shadow-lg shadow-pink-400/50 animate-gradient bg-[length:200%_200%] font-extrabold';
      } else if (tierLower.includes('goat 2') || tierLower.includes('goat2')) {
        return 'bg-gradient-to-r from-sky-300 via-cyan-400 to-blue-500 text-white shadow-lg shadow-sky-300/50 animate-gradient bg-[length:200%_200%] font-extrabold';
      } else {
        return 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-white shadow-lg shadow-yellow-400/50 animate-gradient bg-[length:200%_200%] font-extrabold';
      }
    } else if (tierLower.includes('gorilla')) {
      const gorillaNum = (tierLower.includes('gorilla 3') || tierLower.includes('gorilla3')) ? 'from-blue-600 to-cyan-600' : 
                        (tierLower.includes('gorilla 2') || tierLower.includes('gorilla2')) ? 'from-blue-500 to-cyan-500' : 
                        (tierLower.includes('gorilla 1') || tierLower.includes('gorilla1')) ? 'from-blue-400 to-cyan-400' :
                        'from-blue-400 to-cyan-400';
      return `bg-gradient-to-r ${gorillaNum} text-white shadow-md`;
    } else if (tierLower.includes('crocodile')) {
      const crocNum = tierLower.includes('crocodile 3') ? 'from-green-600 to-emerald-600' : 
                     tierLower.includes('crocodile 2') ? 'from-green-500 to-emerald-500' : 
                     'from-green-400 to-emerald-400';
      return `bg-gradient-to-r ${crocNum} text-white shadow-md`;
    } else if (tierLower.includes('fox 3')) {
      return 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md';
    } else if (tierLower.includes('fox 2')) {
      return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md';
    } else if (tierLower.includes('fox 1')) {
      return 'bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-md';
    } else if (tierLower.includes('rookie')) {
      return 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md';
    } else if (tierLower.includes('unranked')) {
      return 'bg-gray-500 text-white';
    } else {
      return 'bg-blue-500 text-white';
    }
  };

  // Get rank logo URL and styling based on rank name
  const getRankLogoForName = (rankName: string) => {
    if (!rankName) return { logoUrl: '', style: null };
    
    const rankLower = rankName.toLowerCase().trim();
    let logoUrl = '';
    let rankTier = 0;
    
    // Check for Predator with number (Predator #1, Predator #2, etc.)
    if (rankLower.includes('predator')) {
      rankTier = 9;
      logoUrl = '/images/gallery/optimized/Predator.png';
    } else if (rankLower.includes('goat 3') || rankLower.includes('goat3')) {
      rankTier = 8;
      logoUrl = '/images/gallery/optimized/Goat3.png';
    } else if (rankLower.includes('goat 2') || rankLower.includes('goat2')) {
      rankTier = 7;
      logoUrl = '/images/gallery/optimized/Goat2.png';
    } else if (rankLower.includes('goat 1') || rankLower.includes('goat1')) {
      rankTier = 6;
      logoUrl = '/images/gallery/optimized/Goat1.png';
    } else if (rankLower.includes('gorilla 3') || rankLower.includes('gorilla3')) {
      rankTier = 5;
      logoUrl = '/images/gallery/optimized/Gorilla3.png';
    } else if (rankLower.includes('gorilla 2') || rankLower.includes('gorilla2')) {
      rankTier = 4;
      logoUrl = '/images/gallery/optimized/Gorilla2.png';
    } else if (rankLower.includes('gorilla 1') || rankLower.includes('gorilla1')) {
      rankTier = 3;
      logoUrl = '/images/gallery/optimized/Gorilla1.png';
    } else if (rankLower.includes('crocodile 3')) {
      rankTier = 2;
      logoUrl = '/images/gallery/optimized/crocodile3.png';
    } else if (rankLower.includes('crocodile 2')) {
      rankTier = 2;
      logoUrl = '/images/gallery/optimized/crocodile2.png';
    } else if (rankLower.includes('crocodile 1')) {
      rankTier = 2;
      logoUrl = '/images/gallery/optimized/crocodile1.png';
    } else if (rankLower.includes('fox 3')) {
      rankTier = 1;
      logoUrl = '/images/gallery/optimized/fox3.png';
    } else if (rankLower.includes('fox 2')) {
      rankTier = 1;
      logoUrl = '/images/gallery/optimized/fox2.png';
    } else if (rankLower.includes('fox 1')) {
      rankTier = 1;
      logoUrl = '/images/gallery/optimized/fox1.png';
    } else if (rankLower.includes('rookie')) {
      rankTier = 0;
      logoUrl = '/images/gallery/optimized/Rookie.png';
    } else if (rankLower.includes('unranked')) {
      rankTier = -1;
      logoUrl = '/images/gallery/optimized/unranked.png';
    } else {
      // Default to unranked if no match found
      rankTier = -1;
      logoUrl = '/images/gallery/optimized/unranked.png';
    }
    
    // Border styles based on tier
    const borderStyles: any = {
      '-1': { border: 'border-[0.5px] border-gray-500', size: 'w-5 h-5' },
      0: { border: 'border-[0.5px] border-amber-800', size: 'w-5 h-5' },
      1: { border: 'border-[0.5px] border-slate-400', size: 'w-5 h-5' },
      2: { border: 'border-[0.5px] border-emerald-500', size: 'w-5 h-5' },
      3: { border: 'border-[0.5px] border-blue-500', size: 'w-5 h-5' },
      4: { border: 'border-[0.5px] border-cyan-400', size: 'w-5 h-5' },
      5: { border: 'border-[0.5px] border-indigo-500', size: 'w-5 h-5' },
      6: { border: 'border-[0.5px] border-yellow-400', size: 'w-5 h-5' },
      7: { border: 'border-[0.5px] border-sky-300', size: 'w-5 h-5' },
      8: { border: 'border-[0.5px] border-pink-400', size: 'w-5 h-5' },
      9: { border: 'border-0 border-transparent', size: 'w-5 h-5', isPredator: true }
    };
    
    const style = borderStyles[rankTier] || borderStyles['-1'] || borderStyles[0];
    
    return { logoUrl, style, rankTier, isPredator: rankTier === 9 };
  };

  // Get top 3 players for each city based on MonthlyPoints from Foot_Players sheet (for Top 3 Ranks)
  const getTopRanksForCity = (cityName: string) => {
    if (!footPlayersData || footPlayersData.length === 0) {
      console.log(`No Foot_Players data for ${cityName}`);
      return [];
    }
    
    // Normalize city name for matching (handle variations)
    const normalizedCityName = cityName.trim();
    const cityLower = normalizedCityName.toLowerCase();
    
    // Handle common city name variations (especially Marrakech/Marrakesh)
    const cityVariations: { [key: string]: string[] } = {
      'marrakech': ['marrakech', 'marrakesh', 'marakkech', 'marakkesh'],
      'casablanca': ['casablanca', 'casa', 'casablanka'],
      'rabat': ['rabat', 'ribat'],
      'tanger': ['tanger', 'tangier', 'tanger ville'],
      'fès': ['fès', 'fes', 'fez'],
      'agadir': ['agadir'],
      'meknès': ['meknès', 'meknes'],
      'oujda': ['oujda', 'oujdaa'],
      'kenitra': ['kenitra', 'kenitraa'],
      'tetouan': ['tetouan', 'tetouane'],
      'safi': ['safi', 'asfi'],
      'el jadida': ['el jadida', 'eljadida', 'jadida'],
      'berrechid': ['berrechid', 'berrechide']
    };
    
    // Get all possible variations for this city
    let allVariations: string[] = [];
    for (const [key, variations] of Object.entries(cityVariations)) {
      const keyMatches = cityLower.includes(key) || key.includes(cityLower);
      const variationMatches = variations.some(v => cityLower.includes(v) || v.includes(cityLower));
      
      if (keyMatches || variationMatches) {
        allVariations.push(...variations);
        break;
      }
    }
    if (allVariations.length === 0) {
      allVariations.push(cityLower);
    }
    
    // Special case: Always include both Marrakech and Marrakesh variations if searching for either
    if (cityLower.includes('marrakech') || cityLower.includes('marrakesh')) {
      allVariations = ['marrakech', 'marrakesh', 'marakkech', 'marakkesh'];
    }
    
    // Filter players by city using flexible matching
    const cityPlayers = footPlayersData.filter((player: any) => {
      if (!player.city) return false;
      const playerCityRaw = (player.city || '').toLowerCase().trim();
      const playerCities = playerCityRaw.split(',').map((c: string) => c.trim().toLowerCase());
      
      // Check if any player city matches any variation
      const matches = playerCities.some((pc: string) => {
        if (allVariations.some(v => v === pc)) return true;
        if (allVariations.some(v => pc.includes(v))) return true;
        if (allVariations.some(v => v.includes(pc))) return true;
        if (pc === cityLower || cityLower.includes(pc) || pc.includes(cityLower)) return true;
        if (allVariations.some(v => playerCityRaw.includes(v))) return true;
        if (playerCityRaw.includes(cityLower) || cityLower.includes(playerCityRaw)) return true;
        return false;
      });
      
      if (!matches && playerCityRaw) {
        if (allVariations.some(v => playerCityRaw.includes(v))) return true;
        if (playerCityRaw.includes(cityLower) || cityLower.includes(playerCityRaw)) return true;
      }
      
      return matches;
    });
    
    // Filter out unranked players
    const rankedPlayers = cityPlayers.filter((player: any) => {
      const rank = (player.rank || '').toLowerCase().trim();
      return rank && !rank.includes('unranked') && rank !== '';
    });
    
    // Sort by MonthlyPoints (descending)
    const sortedPlayers = rankedPlayers.sort((a: any, b: any) => (b.monthlyPoints || 0) - (a.monthlyPoints || 0));
    
    // Take top 3 and return with proper formatting
    const top3 = sortedPlayers.slice(0, 3).map((player: any, index: number) => {
      const monthlyPointsInt = Math.round(player.monthlyPoints || 0);
      return {
        name: player.username || 'Unknown',
        rank: player.rank || '',
        monthlyPoints: monthlyPointsInt,
        rankNum: index + 1
      };
    });
    
    console.log(`Top 3 Ranks for ${cityName} by MonthlyPoints:`, top3);
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

  // Helper function to parse match date/time (same logic as UpcomingMatchesSection)
  const parseMatchDateTime = (date: string, time: string): Date => {
      try {
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
          // Try parsing as full datetime string
          const parsed = new Date(`${date} ${time}`);
          if (!isNaN(parsed.getTime())) {
            return parsed;
          }
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

  // Get next upcoming match for each city
  const getNextMatchForCity = (cityName: string) => {
    if (!matchesData || matchesData.length === 0) {
      console.log(`No matches data for ${cityName}`);
      return null;
    }
    
    // Handle city name variations (especially Marrakech/Marrakesh)
    const cityVariations: { [key: string]: string[] } = {
      'marrakech': ['marrakech', 'marrakesh', 'marakkech', 'marakkesh'],
      'casablanca': ['casablanca', 'casa', 'casablanka'],
      'rabat': ['rabat', 'ribat'],
      'tanger': ['tanger', 'tangier', 'tanger ville'],
      'fès': ['fès', 'fes', 'fez'],
      'agadir': ['agadir'],
      'meknès': ['meknès', 'meknes'],
    };
    
    const normalizedCityName = cityName.trim();
    const cityLower = normalizedCityName.toLowerCase();
    
    // Get all variations for this city
    let allVariations: string[] = [];
    if (cityVariations[cityLower]) {
      allVariations = [...cityVariations[cityLower]];
    } else {
      allVariations.push(cityLower);
    }
    
    // Special case: Always include both Marrakech and Marrakesh variations if searching for either
    if (cityLower.includes('marrakech') || cityLower.includes('marrakesh')) {
      allVariations = ['marrakech', 'marrakesh', 'marakkech', 'marakkesh'];
    }
    
    console.log(`Looking for matches in city: ${normalizedCityName} (variations: ${allVariations.join(', ')})`);
    
    // Step 1: Filter by city (case-insensitive with flexible matching)
    const cityMatches = matchesData.filter(match => {
      const matchCity = match.city?.toLowerCase().trim();
      
      if (!matchCity) {
        return false;
      }
      
      // Check if match city matches any variation
      const matches = allVariations.some(variation => {
        if (matchCity === variation) {
          console.log(`  - ✅ Exact match: "${matchCity}" === "${variation}"`);
          return true;
        }
        if (matchCity.includes(variation) || variation.includes(matchCity)) {
          console.log(`  - ✅ Partial match: "${matchCity}" includes "${variation}"`);
          return true;
        }
        return false;
      });
      
      if (!matches) {
        console.log(`  - ❌ No match for ${cityName}: match city="${matchCity}"`);
      }
      
      return matches;
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
        const matchDateTime = parseMatchDateTime(match.date, match.time);
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
        const dateA = parseMatchDateTime(a.date, a.time);
        const dateB = parseMatchDateTime(b.date, b.time);
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

  // City configuration - assign colors, icons, etc. based on city name
  const getCityConfig = (cityName: string) => {
    const cityLower = cityName.toLowerCase();
    
    // Default configuration
    const defaultConfig = {
      color: "from-gray-500 to-gray-600",
      bgColor: "bg-gray-50",
      textColor: "text-gray-600",
      borderColor: "border-gray-200",
      icon: "🏙️",
      hasGenderGroups: false
    };
    
    // City-specific configurations
    const cityConfigs: Record<string, typeof defaultConfig> = {
      'casablanca': {
        color: "from-blue-500 to-blue-600",
        bgColor: "bg-blue-50",
        textColor: "text-blue-600",
        borderColor: "border-blue-200",
        icon: "🏙️",
        hasGenderGroups: true
      },
      'marrakech': {
        color: "from-orange-500 to-orange-600",
        bgColor: "bg-orange-50",
        textColor: "text-orange-600",
        borderColor: "border-orange-200",
        icon: "🏜️",
        hasGenderGroups: false
      },
      'tanger': {
        color: "from-green-500 to-green-600",
        bgColor: "bg-green-50",
        textColor: "text-green-600",
        borderColor: "border-green-200",
        icon: "🌊",
        hasGenderGroups: false
      },
      'rabat': {
        color: "from-purple-500 to-purple-600",
        bgColor: "bg-purple-50",
        textColor: "text-purple-600",
        borderColor: "border-purple-200",
        icon: "🏛️",
        hasGenderGroups: false
      },
      'fès': {
        color: "from-indigo-500 to-indigo-600",
        bgColor: "bg-indigo-50",
        textColor: "text-indigo-600",
        borderColor: "border-indigo-200",
        icon: "🕌",
        hasGenderGroups: false
      },
      'agadir': {
        color: "from-cyan-500 to-cyan-600",
        bgColor: "bg-cyan-50",
        textColor: "text-cyan-600",
        borderColor: "border-cyan-200",
        icon: "🏖️",
        hasGenderGroups: false
      },
      'berrechid': {
        color: "from-emerald-500 to-emerald-600",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-600",
        borderColor: "border-emerald-200",
        icon: "⚽",
        hasGenderGroups: false
      }
    };
    
    // Find matching config (check for partial matches)
    for (const [key, config] of Object.entries(cityConfigs)) {
      if (cityLower.includes(key) || key.includes(cityLower)) {
        return config;
      }
    }
    
    return defaultConfig;
  };

  // Calculate total matches played per city from past games sheet - same logic as PastGamesSection
  const getTotalMatchesForCity = (cityName: string) => {
    if (!pastGamesData || pastGamesData.length === 0) {
      return 0;
    }
    
    // Normalize city name for matching (handle variations)
    const normalizedCityName = cityName.trim();
    const cityLower = normalizedCityName.toLowerCase();
    
    // Handle common city name variations (especially Marrakech/Marrakesh)
    const cityVariations: { [key: string]: string[] } = {
      'marrakech': ['marrakech', 'marrakesh', 'marakkech', 'marakkesh'],
      'casablanca': ['casablanca', 'casa', 'casablanka'],
      'rabat': ['rabat', 'ribat'],
      'tanger': ['tanger', 'tangier', 'tanger ville'],
      'fès': ['fès', 'fes', 'fez'],
      'agadir': ['agadir'],
      'meknès': ['meknès', 'meknes'],
      'oujda': ['oujda', 'oujdaa'],
      'kenitra': ['kenitra', 'kenitraa'],
      'tetouan': ['tetouan', 'tetouane'],
      'safi': ['safi', 'asfi'],
      'el jadida': ['el jadida', 'eljadida', 'jadida'],
      'berrechid': ['berrechid', 'berrechide']
    };
    
    // Get all possible variations for this city
    let allVariations: string[] = [];
    for (const [key, variations] of Object.entries(cityVariations)) {
      // Check if the city name matches the key or any of its variations
      const keyMatches = cityLower.includes(key) || key.includes(cityLower);
      const variationMatches = variations.some(v => cityLower.includes(v) || v.includes(cityLower));
      
      if (keyMatches || variationMatches) {
        allVariations.push(...variations);
        break; // Found matching key
      }
    }
    // If no variations found, use the original city name
    if (allVariations.length === 0) {
      allVariations.push(cityLower);
    }
    
    // Special case: Always include both Marrakech and Marrakesh variations if searching for either
    if (cityLower.includes('marrakech') || cityLower.includes('marrakesh')) {
      allVariations = ['marrakech', 'marrakesh', 'marakkech', 'marakkesh'];
    }
    
    // Filter by city - games are already grouped by gameId and date
    const cityGames = pastGamesData.filter((game: any) => {
      if (!game.city) return false;
      const gameCity = (game.city || '').toLowerCase().trim();
      
      // Check if game city matches any variation
      return allVariations.some(v => {
        // Check exact match
        if (v === gameCity) return true;
        // Check if variation is included in game city
        if (gameCity.includes(v)) return true;
        // Check if game city is included in variation
        if (v.includes(gameCity)) return true;
        // Also check direct city name match
        if (gameCity === cityLower || cityLower.includes(gameCity) || gameCity.includes(cityLower)) return true;
        return false;
      });
    });
    
    // Return count of unique games (already grouped by gameId_date)
    return cityGames.length;
  };

  // Calculate streaks (consecutive weeks played) for players in a city
  const getTopStreaksForCity = (cityName: string) => {
    // First try to get streaks from Foot_Players data (preferred method)
    if (footPlayersData && footPlayersData.length > 0) {
      // Normalize city name for matching
      const normalizedCityName = cityName.trim();
      const cityLower = normalizedCityName.toLowerCase();
      
      // Handle city name variations
      const cityVariations: { [key: string]: string[] } = {
        'marrakech': ['marrakech', 'marrakesh', 'marakkech', 'marakkesh'],
        'casablanca': ['casablanca', 'casa', 'casablanka'],
        'rabat': ['rabat', 'ribat'],
        'tanger': ['tanger', 'tangier', 'tanger ville'],
        'fès': ['fès', 'fes', 'fez'],
        'agadir': ['agadir'],
        'meknès': ['meknès', 'meknes'],
        'oujda': ['oujda', 'oujdaa'],
        'kenitra': ['kenitra', 'kenitraa'],
        'tetouan': ['tetouan', 'tetouane'],
        'safi': ['safi', 'asfi'],
        'el jadida': ['el jadida', 'eljadida', 'jadida'],
        'berrechid': ['berrechid', 'berrechide']
      };
      
      // Get all possible variations for this city
      let allVariations: string[] = [];
      for (const [key, variations] of Object.entries(cityVariations)) {
        const keyMatches = cityLower.includes(key) || key.includes(cityLower);
        const variationMatches = variations.some(v => cityLower.includes(v) || v.includes(cityLower));
        if (keyMatches || variationMatches) {
          allVariations.push(...variations);
          break;
        }
      }
      if (allVariations.length === 0) {
        allVariations.push(cityLower);
      }
      
      // Filter players for this city from Foot_Players data
      const cityPlayers = footPlayersData.filter((player: any) => {
        const playerCity = (player.city || '').toLowerCase().trim();
        return allVariations.some(v => 
          playerCity === v || 
          playerCity.includes(v) || 
          v.includes(playerCity) ||
          playerCity === cityLower || 
          cityLower.includes(playerCity) || 
          playerCity.includes(cityLower)
        );
      });
      
      if (cityPlayers.length > 0) {
        // Get players with streaks > 0 and sort by streak
        const playerStreaks: Array<{ name: string; streak: number }> = cityPlayers
          .filter((player: any) => player.streaks && player.streaks > 0)
          .map((player: any) => ({
            name: player.username || '',
            streak: player.streaks || 0
          }))
          .sort((a, b) => b.streak - a.streak)
          .slice(0, 3);
        
        if (playerStreaks.length > 0) {
          console.log(`Found ${playerStreaks.length} players with streaks for ${cityName} from Foot_Players`);
          return playerStreaks;
        }
      }
    }
    
    // Fallback: Calculate streaks from playerGamesData if Foot_Players data is not available
    if (!playerGamesData || playerGamesData.length === 0) return [];
    
    // Normalize city name for matching
    const normalizedCityName = cityName.trim();
    const cityLower = normalizedCityName.toLowerCase();
    
    // Handle city name variations
    const cityVariations: { [key: string]: string[] } = {
      'marrakech': ['marrakech', 'marrakesh', 'marakkech', 'marakkesh'],
      'casablanca': ['casablanca', 'casa', 'casablanka'],
      'rabat': ['rabat', 'ribat'],
      'tanger': ['tanger', 'tangier', 'tanger ville'],
      'fès': ['fès', 'fes', 'fez'],
      'agadir': ['agadir'],
      'meknès': ['meknès', 'meknes'],
      'oujda': ['oujda', 'oujdaa'],
      'kenitra': ['kenitra', 'kenitraa'],
      'tetouan': ['tetouan', 'tetouane'],
      'safi': ['safi', 'asfi'],
      'el jadida': ['el jadida', 'eljadida', 'jadida'],
      'berrechid': ['berrechid', 'berrechide']
    };
    
    // Get all possible variations for this city
    let allVariations: string[] = [];
    for (const [key, variations] of Object.entries(cityVariations)) {
      const keyMatches = cityLower.includes(key) || key.includes(cityLower);
      const variationMatches = variations.some(v => cityLower.includes(v) || v.includes(cityLower));
      if (keyMatches || variationMatches) {
        allVariations.push(...variations);
        break;
      }
    }
    if (allVariations.length === 0) {
      allVariations.push(cityLower);
    }
    
    // Filter player games for this city
    const cityPlayerGames = playerGamesData.filter((pg: any) => {
      const gameCity = (pg.city || '').toLowerCase().trim();
      return allVariations.some(v => 
        gameCity === v || 
        gameCity.includes(v) || 
        v.includes(gameCity) ||
        gameCity === cityLower || 
        cityLower.includes(gameCity) || 
        gameCity.includes(cityLower)
      );
    });
    
    if (cityPlayerGames.length === 0) return [];
    
    // Helper function to get week identifier (YYYY-WW)
    const getWeekKey = (dateStr: string): string | null => {
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return null;
        
        const year = date.getFullYear();
        const weekNumber = getWeekNumber(date);
        return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
      } catch (error) {
        return null;
      }
    };
    
    // Helper function to get week number
    const getWeekNumber = (date: Date): number => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };
    
    // Helper function to check if two weeks are consecutive
    const isConsecutiveWeek = (week1: string, week2: string): boolean => {
      const [year1, weekNum1] = week1.split('-W').map(Number);
      const [year2, weekNum2] = week2.split('-W').map(Number);
      
      if (year1 === year2) {
        return weekNum2 === weekNum1 + 1;
      } else if (year2 === year1 + 1) {
        return weekNum2 === 1 && weekNum1 >= 52;
      }
      return false;
    };
    
    // Group by player and collect their weeks
    const playerWeeksMap = new Map<string, Set<string>>();
    
    cityPlayerGames.forEach((pg: any) => {
      if (!pg.playerUsername || !pg.date) return;
      
      const weekKey = getWeekKey(pg.date);
      if (!weekKey) return;
      
      const username = pg.playerUsername.trim();
      if (!playerWeeksMap.has(username)) {
        playerWeeksMap.set(username, new Set());
      }
      playerWeeksMap.get(username)!.add(weekKey);
    });
    
    // Calculate streaks for each player
    const playerStreaks: Array<{ name: string; streak: number }> = [];
    
    playerWeeksMap.forEach((weeks, username) => {
      if (weeks.size === 0) return;
      
      // Sort weeks chronologically
      const sortedWeeks = Array.from(weeks).sort();
      
      // Calculate longest consecutive streak
      let maxStreak = 1;
      let currentStreak = 1;
      
      for (let i = 1; i < sortedWeeks.length; i++) {
        if (isConsecutiveWeek(sortedWeeks[i - 1], sortedWeeks[i])) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
      
      if (maxStreak > 0) {
        playerStreaks.push({
          name: username,
          streak: maxStreak
        });
      }
    });
    
    // Sort by streak length (descending) and return top 3
    return playerStreaks
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 3);
  };

  // Only show cities when real data is loaded - no fallback data
  const basicCities = useMemo(() => {
    // Return empty array if sheet data not loaded yet
    if (!sheetDataLoaded || !sheetData?.cities || !Array.isArray(sheetData.cities) || sheetData.cities.length === 0) {
      return [];
    }
    
    const citiesData = sheetData.cities;
    
    return citiesData.map(cityData => {
      const cityName = cityData?.name || 'Unknown';
      const cityConfig = getCityConfig(cityName);
      const totalGamesValue = (cityData as any).totalGames || 0;
      console.log(`📊 basicCities: ${cityName} totalGames=${totalGamesValue}`);
      return {
        name: cityName,
        players: `${cityData.players || 0}+`,
        activePlayers: `${cityData.gamesPerWeek || 0}`,
        totalMatches: totalGamesValue, // Column K - Total games from Sheet Total
        nextMatch: 'Aucun match',
        location: 'TBA',
        status: 'Disponible',
        ...cityConfig,
        topPlayers: [],
        topLevelPlayers: [],
        topStreaks: [],
        previousMonthChampion: null
      };
    });
  }, [sheetData?.cities, sheetDataLoaded]); // Only recalculate when cities array changes or loaded state changes
  
  // Memoize city-specific data calculations separately for better performance
  // Use data length instead of full arrays to avoid unnecessary recalculations
  const cityPlayersData = useMemo(() => {
    if (footPlayersData.length === 0) return {};
    const data: Record<string, { topPlayers: any[]; topLevelPlayers: any[]; previousMonthChampion: any }> = {};
    const cityNames = basicCities.map(c => c.name);
    cityNames.forEach(cityName => {
      try {
        data[cityName] = {
          topPlayers: getTopRanksForCity(cityName) || [],
          topLevelPlayers: getTopPlayersForCity(cityName) || [],
          previousMonthChampion: getPreviousMonthChampion(cityName)
        };
      } catch (e) {
        data[cityName] = {
          topPlayers: [],
          topLevelPlayers: [],
          previousMonthChampion: null
        };
      }
    });
    return data;
  }, [footPlayersData.length, basicCities.length]);

  const cityStreaksData = useMemo(() => {
    if (footPlayersData.length === 0 && playerGamesData.length === 0) return {};
    const data: Record<string, any[]> = {};
    const cityNames = basicCities.map(c => c.name);
    cityNames.forEach(cityName => {
      try {
        data[cityName] = getTopStreaksForCity(cityName) || [];
      } catch (e) {
        data[cityName] = [];
      }
    });
    return data;
  }, [footPlayersData.length, playerGamesData.length, basicCities.length]);

  const cityMatchesData = useMemo(() => {
    if (pastGamesData.length === 0) return {};
    const data: Record<string, number> = {};
    const cityNames = basicCities.map(c => c.name);
    cityNames.forEach(cityName => {
      try {
        data[cityName] = getTotalMatchesForCity(cityName) || 0;
      } catch (e) {
        data[cityName] = 0;
      }
    });
    return data;
  }, [pastGamesData.length, basicCities.length]);

  // Memoize next match info calculation
  const cityNextMatches = useMemo(() => {
    if (matchesData.length === 0) return {};
    const data: Record<string, { nextMatch: string; location: string; status: string }> = {};
    const cityNames = basicCities.map(c => c.name);
    
    cityNames.forEach(cityName => {
      const nextMatch = getNextMatchForCity(cityName);
      
      if (!nextMatch) {
        const anyMatch = matchesData.find(match => {
          const matchCity = match.city?.toLowerCase().trim();
          const searchCity = cityName.toLowerCase().trim();
          return matchCity === searchCity || 
                 (matchCity && searchCity && (matchCity.includes(searchCity) || searchCity.includes(matchCity)));
        });
        
        if (anyMatch) {
          try {
            const matchDate = parseMatchDateTime(anyMatch.date, anyMatch.time);
            const dayName = matchDate.toLocaleDateString('fr-FR', { weekday: 'long' });
            const timeStr = formatTime(anyMatch.time || "TBA");
            const playerCount = anyMatch.players?.length || 0;
            const maxPlayers = anyMatch.maxPlayers || 15;
            let actualStatus = 'Disponible';
            if (playerCount >= maxPlayers) {
              actualStatus = 'Complet';
            } else if (playerCount > 0) {
              actualStatus = 'Besoin d\'autres joueurs';
            }
            const formattedDate = `${matchDate.getDate()} ${dayName} ${timeStr}`;
            data[cityName] = {
              nextMatch: formattedDate,
              location: anyMatch.field || "TBA",
              status: actualStatus
            };
          } catch (error) {
            data[cityName] = {
              nextMatch: `${anyMatch.date} ${anyMatch.time}`,
              location: anyMatch.field || "TBA",
              status: anyMatch.status || 'Disponible'
            };
          }
        } else {
          data[cityName] = { nextMatch: "Aucun match", location: "TBA", status: "Disponible" };
        }
      } else {
        try {
          const matchDate = parseMatchDateTime(nextMatch.date, nextMatch.time);
          const dayName = matchDate.toLocaleDateString('fr-FR', { weekday: 'long' });
          const timeStr = formatTime(nextMatch.time || "TBA");
          const playerCount = nextMatch.players?.length || 0;
          const maxPlayers = nextMatch.maxPlayers || 15;
          let actualStatus = 'Disponible';
          if (playerCount >= maxPlayers) {
            actualStatus = 'Complet';
          } else if (playerCount > 0) {
            actualStatus = 'Besoin d\'autres joueurs';
          }
          const formattedDate = `${matchDate.getDate()} ${dayName} ${timeStr}`;
          data[cityName] = {
            nextMatch: formattedDate,
            location: nextMatch.field || "TBA",
            status: actualStatus
          };
        } catch (error) {
          data[cityName] = {
            nextMatch: `${nextMatch.date} ${nextMatch.time}`,
            location: nextMatch.field || "TBA",
            status: nextMatch.status || 'Disponible'
          };
        }
      }
    });
    
    return data;
  }, [matchesData.length, basicCities.length]);

  // Enhanced: Combine all data efficiently
  const cities = useMemo(() => {
    return basicCities.map(city => {
      const cityName = city.name;
      const playersData = cityPlayersData[cityName] || {};
      const streaksData = cityStreaksData[cityName] || [];
      const matchesCount = cityMatchesData[cityName] ?? 0;
      const nextMatchInfo = cityNextMatches[cityName] || { nextMatch: 'Aucun match', location: 'TBA', status: 'Disponible' };
      
      return {
        ...city,
        totalMatches: city.totalMatches || matchesCount, // Use Sheet Total value (column K) if available, otherwise use matches count
        ...nextMatchInfo,
        topPlayers: playersData.topPlayers || [],
        topLevelPlayers: playersData.topLevelPlayers || [],
        topStreaks: streaksData,
        previousMonthChampion: playersData.previousMonthChampion ?? null
      };
    });
  }, [basicCities, cityPlayersData, cityStreaksData, cityMatchesData, cityNextMatches]);
  
  
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
        <div className="mb-8">
          <RevealAnimation>
            <div className="relative w-full">
              {/* Desktop: Two-column layout (Left: Logo/Buttons/Search, Right: City Cards) */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8 relative w-full">
                {/* Left side: Logo + Buttons + Search */}
                <div className="flex flex-col items-center lg:items-start relative z-10 w-full lg:w-1/3">
                  {/* Logo */}
                  <div className="relative w-full flex justify-center lg:justify-start mb-2">
                    {/* Subtle lighting effect behind logo */}
                    <div className="absolute inset-0 -z-10 blur-2xl opacity-40 bg-gradient-to-r from-yellow-400/30 via-orange-400/30 to-yellow-400/30 rounded-full scale-125"></div>
                    <img 
                      src="/images/gallery/optimized/Rayofootball.png" 
                      alt="Rayo Football" 
                      className="w-auto h-[300px] md:h-[400px] lg:h-[450px] object-contain relative z-10 drop-shadow-[0_0_20px_rgba(255,215,0,0.4)]"
                    />
                  </div>
                
                  {/* Compact Action Buttons Row */}
                  <div className="w-full max-w-md lg:max-w-sm relative mb-0 z-10">
                    <div className="flex items-center gap-1.5 w-full">
                    <button 
                      className="group flex-1 px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center gap-1"
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
                      <span className="text-xs font-semibold">Jouer</span>
                      <span className="group-hover:translate-x-0.5 transition-transform duration-300 text-xs">→</span>
                    </button>
                    
                    <button 
                      className="group flex-1 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/25 text-white font-medium rounded-lg hover:bg-white/25 hover:border-white/40 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center"
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
                      <span className="text-xs font-semibold">Historique</span>
                    </button>
                    
                    <button 
                      className="group flex-1 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/25 text-white font-medium rounded-lg hover:bg-white/25 hover:border-white/40 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center"
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
                  </div>
                  </div>
                  
                  {/* Compact Search Bar - Attached to buttons */}
                  <div className="w-full max-w-md lg:max-w-sm mt-1.5">
                    <RevealAnimation delay={0.2}>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Rechercher un joueur..."
                          value={searchQuery}
                          className="w-full px-2.5 py-1.5 bg-white/15 backdrop-blur-sm border border-white/25 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-xs"
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
                            setTimeout(() => setShowSuggestions(false), 200);
                          }}
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      
                      {/* Search Suggestions */}
                      {showSuggestions && searchSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 z-50">
                          <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-white/30 shadow-xl overflow-hidden">
                            {searchSuggestions.slice(0, 5).map((player, index) => {
                              // Get rank logo and styling (same as RankedLeaderboardSection)
                              const getRankLogoAndStyle = (rankTier: string) => {
                                const tierLower = (rankTier || '').toLowerCase();
                                
                                if (tierLower.includes('predator')) {
                                  return { logo: '/images/gallery/optimized/Predator.png', border: 'border-red-500 shadow-red-500/50', bg: 'from-red-500 to-rose-600' };
                                } else if (tierLower.includes('goat 3') || tierLower.includes('goat3')) {
                                  return { logo: '/images/gallery/optimized/Goat3.png', border: 'border-amber-400 shadow-amber-400/50', bg: 'from-amber-400 to-yellow-500' };
                                } else if (tierLower.includes('goat 2') || tierLower.includes('goat2')) {
                                  return { logo: '/images/gallery/optimized/Goat2.png', border: 'border-amber-400 shadow-amber-400/50', bg: 'from-amber-400 to-yellow-500' };
                                } else if (tierLower.includes('goat 1') || tierLower.includes('goat1')) {
                                  return { logo: '/images/gallery/optimized/Goat1.png', border: 'border-amber-400 shadow-amber-400/50', bg: 'from-amber-400 to-yellow-500' };
                                } else if (tierLower.includes('gorilla 3') || tierLower.includes('gorilla3')) {
                                  return { logo: '/images/gallery/optimized/Gorilla3.png', border: 'border-purple-500 shadow-purple-500/50', bg: 'from-purple-500 to-violet-600' };
                                } else if (tierLower.includes('gorilla 2') || tierLower.includes('gorilla2')) {
                                  return { logo: '/images/gallery/optimized/Gorilla2.png', border: 'border-cyan-400 shadow-cyan-400/50', bg: 'from-cyan-400 to-teal-500' };
                                } else if (tierLower.includes('gorilla 1') || tierLower.includes('gorilla1')) {
                                  return { logo: '/images/gallery/optimized/Gorilla1.png', border: 'border-blue-500 shadow-blue-500/50', bg: 'from-blue-500 to-blue-600' };
                                } else if (tierLower.includes('crocodile 3')) {
                                  return { logo: '/images/gallery/optimized/crocodile3.png', border: 'border-emerald-500 shadow-emerald-500/50', bg: 'from-emerald-500 to-green-600' };
                                } else if (tierLower.includes('crocodile 2')) {
                                  return { logo: '/images/gallery/optimized/crocodile2.png', border: 'border-emerald-500 shadow-emerald-500/50', bg: 'from-emerald-500 to-green-600' };
                                } else if (tierLower.includes('crocodile 1')) {
                                  return { logo: '/images/gallery/optimized/crocodile1.png', border: 'border-emerald-500 shadow-emerald-500/50', bg: 'from-emerald-500 to-green-600' };
                                } else if (tierLower.includes('fox 3')) {
                                  return { logo: '/images/gallery/optimized/fox3.png', border: 'border-slate-400 shadow-slate-400/50', bg: 'from-slate-400 to-gray-500' };
                                } else if (tierLower.includes('fox 2')) {
                                  return { logo: '/images/gallery/optimized/fox2.png', border: 'border-slate-400 shadow-slate-400/50', bg: 'from-slate-400 to-gray-500' };
                                } else if (tierLower.includes('fox 1')) {
                                  return { logo: '/images/gallery/optimized/fox1.png', border: 'border-slate-400 shadow-slate-400/50', bg: 'from-slate-400 to-gray-500' };
                                } else if (tierLower.includes('rookie')) {
                                  return { logo: '/images/gallery/optimized/Rookie.png', border: 'border-amber-800 shadow-amber-800/50', bg: 'from-amber-800 to-orange-800' };
                                } else {
                                  return { logo: '/images/gallery/optimized/unranked.png', border: 'border-gray-500 shadow-gray-500/50', bg: 'from-gray-400 to-gray-500' };
                                }
                              };
                              
                              // Get level badge color based on level value (same as LeaderboardSection)
                              const getLevelBadgeColor = (level: string) => {
                                const match = level?.match(/\d+/);
                                const levelValue = match ? parseInt(match[0], 10) : 0;
                                if (levelValue <= 0) return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
                                const segment = Math.floor(levelValue / 10);
                                const colorMap: { [key: number]: string } = {
                                  0: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white',
                                  1: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
                                  2: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
                                  3: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white',
                                  4: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
                                  5: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
                                  6: 'bg-gradient-to-r from-pink-500 to-pink-600 text-white',
                                  7: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
                                  8: 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white',
                                  9: 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white',
                                };
                                return colorMap[segment] || 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white';
                              };
                              
                              const rankStyle = getRankLogoAndStyle(player.rankTier);
                              
                              return (
                                <button
                                  key={index}
                                  onClick={() => handleSuggestionClick(player)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                                >
                                  {/* Rank Logo with border */}
                                  <div className={`w-9 h-9 rounded-lg border-2 ${rankStyle.border} shadow-md flex-shrink-0 overflow-hidden bg-gradient-to-br ${rankStyle.bg}`}>
                                    <img 
                                      src={rankStyle.logo} 
                                      alt={player.rankTier || 'Unranked'}
                                      className="w-full h-full object-contain p-0.5"
                                    />
                                  </div>
                                  <div className="flex-1 text-left min-w-0">
                                    <div className="font-semibold text-gray-900 text-sm truncate">{player.username}</div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                                      {player.level && (
                                        <>
                                          <span className={`px-1.5 py-0.5 rounded font-semibold shadow-sm ${getLevelBadgeColor(player.level)}`}>
                                            Level {player.level.replace(/[^0-9]/g, '')}
                                          </span>
                                          <span>•</span>
                                        </>
                                      )}
                                      <span>{player.gamesPlayed || 0} matchs</span>
                                    </div>
                                  </div>
                                  {/* Rank tier text badge */}
                                  <div className={`bg-gradient-to-r ${rankStyle.bg} text-white text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 shadow-sm`}>
                                    {player.rankTier || 'Unranked'}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </RevealAnimation>
                </div>
                </div>
                
                {/* Right side: City Cards on desktop */}
                <div className="flex-1 lg:w-2/3 relative mt-8 lg:mt-8 w-full" style={{ overflow: 'hidden' }}>
                  <div className={`relative ${isMobile ? 'px-0' : 'px-0'} w-full`} style={{ zIndex: 1, overflow: 'hidden' }}>
                    {/* Slider container */}
                    <div className="overflow-hidden relative w-full" style={{ boxSizing: 'border-box', width: '100%', maxWidth: '100%', overflow: 'hidden', clipPath: 'inset(0)' }}>
            {cities.length === 0 ? (
              <div className="text-center py-8 px-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-center">
                      <style>{`
                        @keyframes handSweep { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        @keyframes tick { 0%, 90% { opacity: .25; } 95% { opacity: 1; } 100% { opacity: .25; } }
                        @keyframes buttonPulse { 0% { transform: scale(1); opacity: .4; } 50% { transform: scale(1.15); opacity: .9; } 100% { transform: scale(1); opacity: .4; } }
                        @keyframes dialGlow { 0%, 100% { opacity: .16; } 50% { opacity: .28; } }
                      `}</style>
                      <div className="inline-block mb-4">
                        <svg viewBox="0 0 164 164" className="w-20 h-20 mx-auto">
                          <defs>
                            <radialGradient id="dialBgCities" cx="50%" cy="50%">
                              <stop offset="0%" stopColor="#0f0f0f" />
                              <stop offset="100%" stopColor="#0b0b0b" />
                            </radialGradient>
                          </defs>
                          <circle cx="82" cy="88" r="64" fill="url(#dialBgCities)" stroke="#1f2937" strokeWidth="2" />
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
                      <h2 className="text-xl font-bold text-white mb-2">RAYO SPORT</h2>
                      <p className="text-white">Chargement des villes...</p>
                    </div>
                  </div>
                ) : (
                  <RevealAnimation>
                    <div className="max-w-sm mx-auto">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                        <FiMapPin className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">
                        Aucune ville disponible
                      </h3>
                      <p className="text-sm text-white/80 mb-4">
                        Aucune ville disponible pour le moment
                      </p>
                      <button
                        onClick={() => {
                          window.location.reload();
                          trackEvent('reload_cities_empty', 'user_action');
                        }}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                      >
                        <FiRefreshCw className="w-4 h-4 mr-2" />
                        Recharger
                      </button>
                    </div>
                  </RevealAnimation>
                )}
              </div>
            ) : (() => {
              const totalSlides = Math.ceil(cities.length / cardsPerSlide);
              const slideWidthPercentage = 100 / totalSlides;
              return (
                <div 
                  className={`flex transition-transform duration-500 ease-in-out ${cardsPerSlide === 1 ? 'gap-0' : 'gap-3'}`}
              style={{ 
                    transform: `translateX(-${currentCitySlide * slideWidthPercentage}%)`,
                    width: `${totalSlides * 100}%`,
                    willChange: 'transform'
              }}
            >
              {/* Group cities into sets based on cardsPerSlide */}
              {Array.from({ length: totalSlides }).map((_, slideIndex) => {
                const citiesInSlide = cities.slice(slideIndex * cardsPerSlide, slideIndex * cardsPerSlide + cardsPerSlide);
                return (
                  <div key={slideIndex} className={`flex flex-shrink-0 ${cardsPerSlide === 1 ? 'gap-0' : 'gap-3'}`} style={{ width: `${slideWidthPercentage}%`, minWidth: `${slideWidthPercentage}%`, maxWidth: `${slideWidthPercentage}%`, boxSizing: 'border-box', padding: '0', position: 'relative' }}>
                    {citiesInSlide.map((city, cardIndex) => {
                      const index = slideIndex * cardsPerSlide + cardIndex;
                      const cardWidth = cardsPerSlide === 1 ? '100%' : `calc((100% - ${(cardsPerSlide - 1) * 0.75}rem) / ${cardsPerSlide})`;
                      return (
                        <div key={index} className="flex-shrink-0" style={{ width: cardWidth, flexShrink: 0, boxSizing: 'border-box', overflow: 'hidden' }}>
                        <RevealAnimation delay={cardIndex * 0.1}>
                          <div className={`relative bg-white/95 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white hover:shadow-lg transition-all duration-300 group overflow-hidden ${isMobile ? 'p-2' : 'p-3'}`} style={{ zIndex: 1, boxSizing: 'border-box', width: '100%', height: '100%' }}>
                {/* Subtle gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${city.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  {/* City header - ultra compact */}
                  <div className={`flex items-center justify-between ${isMobile ? 'mb-1.5' : 'mb-2'}`}>
                    <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                      <span className={isMobile ? "text-sm" : "text-sm"}>{city.icon}</span>
                      <h3 className={`${isMobile ? 'text-sm' : 'text-sm'} font-semibold text-gray-900`}>{city.name}</h3>
                    </div>
                    <div className={`${isMobile ? 'w-1 h-1' : 'w-1.5 h-1.5'} bg-gradient-to-r ${city.color} rounded-full`}></div>
                  </div>
                  
                  {/* Previous Month First Ranked */}
                  {(() => {
                    const previousMonthName = getPreviousMonthNameMoroccan();
                    const capitalizedPreviousMonth = previousMonthName.charAt(0).toUpperCase() + previousMonthName.slice(1);
                    const previousMonthChampion = city.previousMonthChampion;
                    
                    return (
                      <div className={`${isMobile ? 'mb-1.5' : 'mb-2'}`}>
                        <div className={`flex items-center ${isMobile ? 'gap-0.5' : 'gap-1'} ${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 ${isMobile ? 'mb-0.5' : 'mb-1'} font-medium`}>
                          <FiAward className={isMobile ? "w-3 h-3" : "w-3 h-3"} />
                          <span>Champion {capitalizedPreviousMonth}</span>
                        </div>
                        <div className="space-y-0.5">
                          {loading ? (
                            <div className={`${isMobile ? 'py-1' : 'py-1.5'} px-2`}>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 rounded-full animate-loading bg-[length:200%_100%]"></div>
                              </div>
                            </div>
                          ) : previousMonthChampion ? (
                            <div 
                              className="relative rounded-md p-[2px] bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 animate-gradient bg-[length:200%_200%] shadow-lg shadow-yellow-400/30"
                              onClick={() => {
                                if (onPlayerClick) {
                                  trackEvent('city_previous_month_top_player_click', 'user_engagement', previousMonthChampion.name);
                                  onPlayerClick(previousMonthChampion.name);
                                }
                              }}
                            >
                              <div 
                                className={`flex items-center justify-between ${isMobile ? 'p-0.5' : 'p-1'} rounded-md relative overflow-hidden cursor-pointer bg-white hover:bg-gray-50 transition-all duration-300`}
                              >
                              
                              <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'} min-w-0 flex-1 relative z-10`}>
                                {previousMonthChampion && (() => {
                                  const { logoUrl, style, isPredator } = getRankLogoForName(previousMonthChampion.rank || '');
                                  if (logoUrl && style) {
                                    return (
                                      <div className={`relative ${style.size} flex-shrink-0 ${style.border} rounded-lg overflow-hidden ${isPredator ? 'bg-transparent' : 'bg-white/80'}`}>
                                        {isPredator ? (
                                          <>
                                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 via-cyan-400 to-yellow-400 rounded-lg animate-gradient bg-[length:200%_200%] p-[1px]">
                                              <div className="w-full h-full bg-gray-900 rounded-lg">
                                                <img src={logoUrl} alt={previousMonthChampion.rank} className="w-full h-full object-cover rounded-lg" />
                                </div>
                                            </div>
                                          </>
                                        ) : (
                                          <img src={logoUrl} alt={previousMonthChampion.rank} className="w-full h-full object-cover rounded-lg" />
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                {(() => {
                                  const username = previousMonthChampion?.name?.trim() || '';
                                  const hasRayoSupport = username && rayoSupport.get(username.toLowerCase());
                                  return (
                                    <div className="flex items-center gap-1">
                                      <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium truncate ${
                                        hasRayoSupport ? 'text-amber-600' : 'text-gray-900'
                                      }`}>
                                        {previousMonthChampion ? previousMonthChampion.name : 'N/A'}
                                      </span>
                                      {hasRayoSupport && (
                                        <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-yellow-500 shadow-md shadow-yellow-500/30 flex-shrink-0 flex items-center justify-center">
                                          <svg className="w-2 h-2" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" viewBox="0 0 24 24">
                                            <path d="M12 5v14M5 12h14"/>
                                          </svg>
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0 relative z-10">
                                {previousMonthChampion && (
                                  <>
                                    <span className={`px-1.5 py-[2px] rounded ${isMobile ? 'text-[8px]' : 'text-[9px]'} font-bold ${getRankBadgeClass(previousMonthChampion.rank || '')}`}>
                                      {formatRankTierForDisplay(previousMonthChampion.rank || '') || 'N/A'}
                                </span>
                                    <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>
                                      {previousMonthChampion.points || '0'} pts
                                    </span>
                                  </>
                                )}
                              </div>
                              </div>
                            </div>
                          ) : (
                            <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 text-center ${isMobile ? 'py-0.5' : 'py-1'}`}>Aucun champion</div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Section 1: Top 3 Ranks */}
                  <div className={`${isMobile ? 'mb-1.5' : 'mb-2'}`}>
                    <div className={`flex items-center ${isMobile ? 'gap-0.5' : 'gap-1'} ${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 ${isMobile ? 'mb-0.5' : 'mb-1'} font-medium`}>
                      <FiTrendingUp className={isMobile ? "w-3 h-3" : "w-3 h-3"} />
                      <span>
                        Top 3 Ranks ({(() => {
                          const monthName = getCurrentMonthNameMoroccan();
                          return monthName.charAt(0).toUpperCase() + monthName.slice(1);
                        })()})
                      </span>
                    </div>
                    <div className={`bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-lg ${isMobile ? 'p-1.5' : 'p-2'} shadow-sm`}>
                      <div className="space-y-0.5">
                      {loading ? (
                        <div className={`${isMobile ? 'py-1' : 'py-1.5'} px-2`}>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full animate-loading bg-[length:200%_100%]"></div>
                          </div>
                        </div>
                      ) : (
                        Array.from({ length: 3 }, (_, index) => {
                          const player = (city.topPlayers || [])[index];
                          return (
                            <div 
                              key={index} 
                              className={`flex items-center justify-between ${isMobile ? 'p-0.5' : 'p-1'} rounded-md relative overflow-hidden ${
                                player ? 'cursor-pointer hover:bg-white/80 transition-colors' : 'bg-gray-100/50'
                              }`}
                              onClick={() => {
                                if (player && onPlayerClick) {
                                  trackEvent('city_top_rank_player_click', 'user_engagement', player.name);
                                  onPlayerClick(player.name);
                                }
                              }}
                            >
                              {(() => {
                                if (!player) return null;
                                const { logoUrl, style, isPredator } = getRankLogoForName(player.rank || '');
                                const tierLower = (player.rank || '').toLowerCase();
                                const isGoat = tierLower.includes('goat');
                                const isGoat1 = tierLower.includes('goat 1') || tierLower.includes('goat1');
                                const isGoat2 = tierLower.includes('goat 2') || tierLower.includes('goat2');
                                
                                // Background styling based on rank
                                let bgClass = 'bg-white/50';
                                if (isPredator) {
                                  bgClass = 'bg-gradient-to-br from-yellow-400/20 via-pink-500/20 via-purple-500/20 via-cyan-400/20 to-yellow-400/20';
                                } else if (isGoat) {
                                  if (isGoat1) {
                                    bgClass = 'bg-gradient-to-br from-amber-50/80 via-yellow-50/80 to-orange-50/80';
                                  } else if (isGoat2) {
                                    bgClass = 'bg-gradient-to-br from-sky-50/80 via-cyan-50/80 to-blue-50/80';
                                  } else {
                                    bgClass = 'bg-gradient-to-br from-pink-50/80 via-purple-50/80 to-rose-50/80';
                                  }
                                }
                                
                                return (
                                  <>
                                    {/* Predator Special Effects */}
                                    {isPredator && (
                                      <>
                                        <div className="absolute inset-0 rounded-md bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 via-cyan-400 to-yellow-400 opacity-50 animate-gradient bg-[length:200%_200%] -z-10 blur-sm"></div>
                                        <div className="absolute inset-[1px] rounded-md bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-sm -z-10"></div>
                                      </>
                                    )}
                                    
                                    {/* Goat Special Effects */}
                                    {isGoat && (
                                      <div className={`absolute inset-0 rounded-md border-[1px] -z-10 ${
                                        isGoat1 ? 'border-yellow-400/60' :
                                        isGoat2 ? 'border-sky-300/60' :
                                        'border-pink-400/60'
                                      }`}></div>
                                    )}
                                    
                                    <div className={`absolute inset-0 rounded-md ${bgClass} -z-10`}></div>
                                  </>
                                );
                              })()}
                              
                              <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'} min-w-0 flex-1 relative z-10`}>
                                {player && (() => {
                                  const { logoUrl, style, isPredator } = getRankLogoForName(player.rank || '');
                                  if (logoUrl && style) {
                                    return (
                                      <div className={`relative ${style.size} flex-shrink-0 ${style.border} rounded-lg overflow-hidden ${isPredator ? 'bg-transparent' : 'bg-white/80'}`}>
                                        {isPredator ? (
                                          <>
                                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 via-cyan-400 to-yellow-400 rounded-lg animate-gradient bg-[length:200%_200%] p-[1px]">
                                              <div className="w-full h-full bg-gray-900 rounded-lg">
                                                <img src={logoUrl} alt={player.rank} className="w-full h-full object-cover rounded-lg" />
                                              </div>
                                            </div>
                                          </>
                                        ) : (
                                          <img src={logoUrl} alt={player.rank} className="w-full h-full object-cover rounded-lg" />
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                {(() => {
                                  const username = player?.name?.trim() || '';
                                  const hasRayoSupport = username && rayoSupport.get(username.toLowerCase());
                                  const isPredator = player?.rank?.toLowerCase().includes('predator');
                                  return (
                                    <div className="flex items-center gap-1">
                                      <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium truncate ${
                                        player ? (
                                          isPredator 
                                            ? 'text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]' 
                                            : hasRayoSupport
                                            ? 'text-amber-600'
                                            : 'text-gray-900'
                                        ) : 'text-gray-400'
                                      }`}>
                                        {player ? player.name : 'N/A'}
                                      </span>
                                      {hasRayoSupport && (
                                        <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-yellow-500 shadow-md shadow-yellow-500/30 flex-shrink-0 flex items-center justify-center">
                                          <svg className="w-2 h-2" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" viewBox="0 0 24 24">
                                            <path d="M12 5v14M5 12h14"/>
                                          </svg>
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0 relative z-10">
                                {player && (
                                  <>
                                    <span className={`px-1.5 py-[2px] rounded ${isMobile ? 'text-[8px]' : 'text-[9px]'} font-bold ${getRankBadgeClass(player.rank || '')}`}>
                                      {formatRankTierForDisplay(player.rank || '') || 'N/A'}
                                    </span>
                                    <span className={`${isMobile ? 'text-xs' : 'text-xs'} ${
                                      player.rank?.toLowerCase().includes('predator') 
                                        ? 'text-gray-300 drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]' 
                                        : 'text-gray-500'
                                    }`}>
                                      {player.monthlyPoints || '0'} pts
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Top 3 Level */}
                  <div className={`${isMobile ? 'mb-1.5' : 'mb-2'}`}>
                    <div className={`flex items-center ${isMobile ? 'gap-0.5' : 'gap-1'} ${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 ${isMobile ? 'mb-0.5' : 'mb-1'} font-medium`}>
                      <FiAward className={isMobile ? "w-3 h-3" : "w-3 h-3"} />
                      <span>Top 3 Level</span>
                    </div>
                    <div className={`bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-lg ${isMobile ? 'p-1.5' : 'p-2'} shadow-sm`}>
                      <div className="space-y-0.5">
                      {loading ? (
                        <div className={`${isMobile ? 'py-1' : 'py-1.5'} px-2`}>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 rounded-full animate-loading bg-[length:200%_100%]"></div>
                          </div>
                        </div>
                      ) : (
                        Array.from({ length: 3 }, (_, index) => {
                          const player = (city.topLevelPlayers || [])[index];
                          // Rank-specific styling for levels
                          const rankStyles = [
                            { 
                              bg: 'from-green-50 to-emerald-50', 
                              border: 'border-green-200/60',
                              hover: 'hover:from-green-100 hover:to-emerald-100'
                            },
                            { 
                              bg: 'from-gray-50 to-slate-50', 
                              border: 'border-gray-200/60',
                              hover: 'hover:from-gray-100 hover:to-slate-100'
                            },
                            { 
                              bg: 'from-blue-50 to-cyan-50', 
                              border: 'border-blue-200/60',
                              hover: 'hover:from-blue-100 hover:to-cyan-100'
                            }
                          ];
                          const style = rankStyles[index] || rankStyles[2];
                          
                          return (
                            <div 
                              key={index} 
                              className={`flex items-center justify-between ${isMobile ? 'p-[3px]' : 'p-0.5'} rounded-md relative overflow-hidden ${
                                player 
                                  ? `bg-gradient-to-r ${style.bg} border ${style.border} cursor-pointer ${style.hover} transition-all duration-200` 
                                  : 'bg-gray-100/50'
                              }`}
                              onClick={() => {
                                if (player && onPlayerClick) {
                                  trackEvent('city_top_level_player_click', 'user_engagement', player.name);
                                  onPlayerClick(player.name);
                                }
                              }}
                            >
                              <div className={`flex items-center ${isMobile ? 'gap-0.5' : 'gap-1'} min-w-0 flex-1`}>
                                {(() => {
                                  const username = player?.name?.trim() || '';
                                  const hasRayoSupport = username && rayoSupport.get(username.toLowerCase());
                                  return (
                                    <div className="flex items-center gap-1">
                                      <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium truncate ${
                                        player ? (hasRayoSupport ? 'text-amber-600' : 'text-gray-900') : 'text-gray-400'
                                      }`}>
                                        {player ? player.name : 'N/A'}
                                      </span>
                                      {hasRayoSupport && (
                                        <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-yellow-500 shadow-md shadow-yellow-500/30 flex-shrink-0 flex items-center justify-center">
                                          <svg className="w-2 h-2" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" viewBox="0 0 24 24">
                                            <path d="M12 5v14M5 12h14"/>
                                          </svg>
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {player && (
                                  <>
                                    <span className={`px-1.5 py-[2px] rounded ${isMobile ? 'text-[8px]' : 'text-[9px]'} font-bold ${getLevelBadgeClass(player.levelValueNum || 0)}`}>
                                      {player.levelValue || 'Level 0'}
                                    </span>
                                    <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>
                                      {player.points || '0'} pts
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                      </div>
                    </div>
                  </div>

                  {/* Section: Top 3 Streaks */}
                  <div className={`${isMobile ? 'mb-1.5' : 'mb-2'}`}>
                    <div className={`flex items-center ${isMobile ? 'gap-0.5' : 'gap-1'} ${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 ${isMobile ? 'mb-0.5' : 'mb-1'} font-medium`}>
                      <FiZap className={isMobile ? "w-3 h-3" : "w-3 h-3"} />
                      <span>Top 3 Streaks</span>
                    </div>
                    <div className={`bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-lg ${isMobile ? 'p-1.5' : 'p-2'} shadow-sm`}>
                      <div className="space-y-[2px]">
                      {loading ? (
                        <div className={`${isMobile ? 'py-1' : 'py-1.5'} px-2`}>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 rounded-full animate-loading bg-[length:200%_100%]"></div>
                          </div>
                        </div>
                      ) : (
                        Array.from({ length: 3 }, (_, index) => {
                          const streakPlayer = (city.topStreaks || [])[index];
                          // Rank-specific styling for streaks
                          const rankStyles = [
                            { 
                              bg: 'from-orange-50 to-amber-50', 
                              border: 'border-orange-200/60',
                              badge: 'bg-gradient-to-r from-orange-500 to-amber-500',
                              text: 'text-orange-700',
                              hover: 'hover:from-orange-100 hover:to-amber-100'
                            },
                            { 
                              bg: 'from-gray-50 to-slate-50', 
                              border: 'border-gray-200/60',
                              badge: 'bg-gradient-to-r from-gray-400 to-slate-500',
                              text: 'text-gray-700',
                              hover: 'hover:from-gray-100 hover:to-slate-100'
                            },
                            { 
                              bg: 'from-amber-50 to-yellow-50', 
                              border: 'border-amber-200/60',
                              badge: 'bg-gradient-to-r from-amber-400 to-yellow-500',
                              text: 'text-amber-700',
                              hover: 'hover:from-amber-100 hover:to-yellow-100'
                            }
                          ];
                          const style = rankStyles[index] || rankStyles[2];
                          
                          return (
                            <div 
                              key={index} 
                              className={`flex items-center justify-between ${isMobile ? 'p-[3px]' : 'p-0.5'} rounded-md relative overflow-hidden ${
                                streakPlayer 
                                  ? `bg-gradient-to-r ${style.bg} border ${style.border} cursor-pointer ${style.hover} transition-all duration-200` 
                                  : 'bg-gray-100/50'
                              }`}
                              onClick={() => {
                                if (streakPlayer && onPlayerClick) {
                                  trackEvent('city_streak_player_click', 'user_engagement', streakPlayer.name);
                                  onPlayerClick(streakPlayer.name);
                                }
                              }}
                            >
                              <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'} min-w-0 flex-1`}>
                                {(() => {
                                  const username = streakPlayer?.name?.trim() || '';
                                  const hasRayoSupport = username && rayoSupport.get(username.toLowerCase());
                                  return (
                                    <div className="flex items-center gap-1">
                                      <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium truncate ${
                                        streakPlayer ? (hasRayoSupport ? 'text-amber-600' : 'text-gray-900') : 'text-gray-400'
                                      }`}>
                                        {streakPlayer ? streakPlayer.name : 'N/A'}
                                      </span>
                                      {hasRayoSupport && (
                                        <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-yellow-500 shadow-md shadow-yellow-500/30 flex-shrink-0 flex items-center justify-center">
                                          <svg className="w-2 h-2" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" viewBox="0 0 24 24">
                                            <path d="M12 5v14M5 12h14"/>
                                          </svg>
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {streakPlayer && (
                                  <div className={`flex items-center gap-0.5 px-1.5 py-[2px] rounded ${style.badge} shadow-sm`}>
                                    <FiZap className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-white`} />
                                    <span className={`${isMobile ? 'text-[8px]' : 'text-[9px]'} font-bold text-white`}>
                                      {streakPlayer.streak}
                                    </span>
                                    <span className={`${isMobile ? 'text-[8px]' : 'text-[9px]'} text-white/90 font-medium`}>
                                      sem
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Information */}
                  <div className={`${isMobile ? 'mb-1.5' : 'mb-2'}`}>
                    <div className={`flex items-center ${isMobile ? 'gap-0.5' : 'gap-1'} ${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 ${isMobile ? 'mb-0.5' : 'mb-0.5'} font-medium`}>
                          <FiInfo className={isMobile ? "w-3 h-3" : "w-3 h-3"} />
                      <span>Information</span>
                    </div>
                    <div className={`bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-lg ${isMobile ? 'p-1' : 'p-1.5'} shadow-sm`}>
                        <div className="flex gap-[2px]">
                          <div className={`flex flex-col items-center justify-center flex-1 ${isMobile ? 'px-1 py-1' : 'px-1.5 py-1.5'} bg-gray-50 rounded`}>
                        <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-600 font-medium truncate mb-0.5`}>{t('football_city_players')}</span>
                            <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-bold ${city.textColor} flex-shrink-0`}>{city.players}</span>
                    </div>
                          <div className={`flex flex-col items-center justify-center flex-1 ${isMobile ? 'px-1 py-1' : 'px-1.5 py-1.5'} bg-gray-50 rounded`}>
                        <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-600 font-medium truncate mb-0.5`}>{t('football_city_matches_per_week')}</span>
                            <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-bold ${city.textColor} flex-shrink-0`}>{city.activePlayers}</span>
                  </div>
                          <div className={`flex flex-col items-center justify-center flex-1 ${isMobile ? 'px-1 py-1' : 'px-1.5 py-1.5'} bg-gray-50 rounded`}>
                        <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-600 font-medium truncate mb-0.5`}>Matchs joués</span>
                            <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-bold ${city.textColor} flex-shrink-0`}>{city.totalMatches || 0}</span>
                          </div>
                        </div>
                         {/* Next match info - compact */}
                         <div 
                      className={`mt-1 rounded-md transition-all relative overflow-hidden ${isMobile ? 'min-h-[36px]' : 'min-h-[40px]'} flex flex-col justify-between ${
                             city.nextMatch === "Aucun match" 
                               ? `bg-gray-50 cursor-not-allowed opacity-60 ${isMobile ? 'px-1 py-0.5' : 'px-1.5 py-0.5'}` 
                               : `bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-300 cursor-pointer hover:from-blue-100 hover:to-blue-200 hover:border-blue-400 hover:shadow-md hover:scale-[1.02] ${isMobile ? 'px-1 py-0.5' : 'px-1.5 py-0.5'}`
                           }`}
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
                          <div className="flex flex-col justify-between h-full">
                            <div className={`flex items-center justify-between ${isMobile ? 'mb-0' : 'mb-0.5'}`}>
                          <div className={`flex items-center ${isMobile ? 'gap-0.5' : 'gap-1'} min-w-0`}>
                                <div className={`${isMobile ? 'w-1.5 h-1.5' : 'w-1.5 h-1.5'} rounded-full flex-shrink-0 ${city.nextMatch !== "Aucun match" ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></div>
                            <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-700 font-medium leading-tight truncate`}>{t('football_city_next_match')}</div>
                        </div>
                              {city.nextMatch !== "Aucun match" && (
                                <div className={`flex items-center ${isMobile ? 'gap-0.5' : 'gap-1'} bg-blue-500/10 rounded-full flex-shrink-0 ${isMobile ? 'px-1.5 py-0.5' : 'px-1.5 py-0.5'}`}>
                                  <span className={`text-blue-600 font-semibold ${isMobile ? 'text-[10px]' : 'text-[10px]'}`}>Voir</span>
                                  <svg className={`text-blue-600 flex-shrink-0 ${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            {loading ? (
                              <div className="w-full">
                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full animate-loading bg-[length:200%_100%]"></div>
                                </div>
                              </div>
                            ) : (
                          <div className={`flex flex-wrap items-start ${isMobile ? 'gap-1 mt-0.5' : 'gap-2'}`}>
                            <div className={`${isMobile ? 'text-xs' : 'text-xs'} font-semibold text-gray-900 leading-tight flex-1 min-w-0`} style={{ wordBreak: 'break-word' }}>{city.nextMatch}</div>
                                <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 leading-tight flex-shrink-0 whitespace-nowrap`}>{city.location}</div>
                              </div>
                            )}
                      </div>
                    </div>
                    </div>
                  </div>
                  
                  {/* Action buttons - compact */}
                  {city.hasGenderGroups ? (
                    <div className={`flex ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                      <button 
                        className={`flex-1 ${isMobile ? 'py-1' : 'py-1.5'} bg-gradient-to-r ${city.color} text-white rounded-md hover:shadow-md transition-all duration-200 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}
                        onClick={() => {
                          trackEvent('city_join_male_click', 'user_engagement', city.name);
                          const cityLower = city.name.toLowerCase();
                          // Open specific WhatsApp link for men in each city
                          if (cityLower.includes('casablanca')) {
                            window.open('https://chat.whatsapp.com/L6ePdMmtGrUIiF4VFEQ6eA', '_blank');
                          } else if (cityLower.includes('marrakech') || cityLower.includes('marrakesh')) {
                            window.open('https://chat.whatsapp.com/C33iLj6NFeq5yVH1Vx1BHf', '_blank');
                          } else if (cityLower.includes('tanger') || cityLower.includes('tangier')) {
                            window.open('https://chat.whatsapp.com/CDz3gbxv2swCqMs2TTUbHb', '_blank');
                          } else if (cityLower.includes('berrechid')) {
                            window.open('https://chat.whatsapp.com/KHcdMSbsph07VZaX8NnrPN', '_blank');
                          } else if (cityLower.includes('bouskoura')) {
                            window.open('https://chat.whatsapp.com/FAolLQ1PMkn7ItK2v2ZqQo', '_blank');
                          } else if (cityLower.includes('rabat')) {
                            window.open('https://chat.whatsapp.com/CEKKv7S4RZh6fhhTCpSg0h', '_blank');
                          } else {
                            onJoinClick();
                          }
                        }}
                      >
{t('football_city_men')}
                      </button>
                      <button 
                        className={`flex-1 ${isMobile ? 'py-1' : 'py-1.5'} bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-md hover:shadow-md transition-all duration-200 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}
                        onClick={() => {
                          trackEvent('city_join_female_click', 'user_engagement', city.name);
                          const cityLower = city.name.toLowerCase();
                          // Open specific WhatsApp link for women in each city
                          if (cityLower.includes('casablanca')) {
                            window.open('https://chat.whatsapp.com/DSJUbzlNymQ5hfAPhUmNtQ', '_blank');
                          } else if (cityLower.includes('marrakech') || cityLower.includes('marrakesh')) {
                            window.open('https://chat.whatsapp.com/C33iLj6NFeq5yVH1Vx1BHf', '_blank');
                          } else if (cityLower.includes('tanger') || cityLower.includes('tangier')) {
                            window.open('https://chat.whatsapp.com/CDz3gbxv2swCqMs2TTUbHb', '_blank');
                          } else if (cityLower.includes('berrechid')) {
                            window.open('https://chat.whatsapp.com/KHcdMSbsph07VZaX8NnrPN', '_blank');
                          } else if (cityLower.includes('bouskoura')) {
                            window.open('https://chat.whatsapp.com/FAolLQ1PMkn7ItK2v2ZqQo', '_blank');
                          } else if (cityLower.includes('rabat')) {
                            window.open('https://chat.whatsapp.com/CEKKv7S4RZh6fhhTCpSg0h', '_blank');
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
                      className={`w-full ${isMobile ? 'py-1' : 'py-1.5'} bg-gradient-to-r ${city.color} text-white rounded-md hover:shadow-md transition-all duration-200 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}
                      onClick={() => {
                        trackEvent('city_join_click', 'user_engagement', city.name);
                        const cityLower = city.name.toLowerCase();
                        // Open specific WhatsApp link for each city (same links as popup modal)
                        if (cityLower.includes('marrakech') || cityLower.includes('marrakesh')) {
                          window.open('https://chat.whatsapp.com/C33iLj6NFeq5yVH1Vx1BHf', '_blank');
                        } else if (cityLower.includes('tanger') || cityLower.includes('tangier')) {
                          window.open('https://chat.whatsapp.com/CDz3gbxv2swCqMs2TTUbHb', '_blank');
                        } else if (cityLower.includes('berrechid')) {
                          window.open('https://chat.whatsapp.com/KHcdMSbsph07VZaX8NnrPN', '_blank');
                        } else if (cityLower.includes('bouskoura')) {
                          window.open('https://chat.whatsapp.com/FAolLQ1PMkn7ItK2v2ZqQo', '_blank');
                        } else if (cityLower.includes('rabat')) {
                          window.open('https://chat.whatsapp.com/CEKKv7S4RZh6fhhTCpSg0h', '_blank');
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
                      </div>
                    );
                  })}
                  </div>
                );
              })}
            </div>
              );
            })()}
                    </div>
                    
                  </div> {/* Slider chrome */}
                  
                  {/* Navigation - Moved underneath city cards */}
                  {cities.length > cardsPerSlide && (
                    <div className={`flex items-center justify-center ${isMobile ? 'gap-3 mt-4' : 'gap-4 mt-6'}`}>
                      {/* Mobile: Left arrow - Dots - Right arrow */}
                      {isMobile ? (
                        <>
                          {/* Left Arrow */}
                          <button
                            onClick={() => {
                              const totalSlides = Math.ceil(cities.length / cardsPerSlide);
                              setCurrentCitySlide(prev => (prev > 0 ? prev - 1 : totalSlides - 1));
                              trackEvent('city_slider_prev', 'navigation', 'cities_overview');
                            }}
                            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 flex items-center justify-center border border-gray-200"
                            aria-label="Previous cities"
                          >
                            <FiChevronLeft className="w-4 h-4 text-gray-700" />
                          </button>
                          
                          {/* Dots Indicator */}
                          <div className="flex gap-2 items-center">
                            {Array.from({ length: Math.ceil(cities.length / cardsPerSlide) }).map((_, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setCurrentCitySlide(index);
                                  trackEvent('city_slider_indicator', 'navigation', `slide_${index}`);
                                }}
                                className={`rounded-full transition-all duration-300 ${
                                  currentCitySlide === index 
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 w-6 h-2 shadow-md' 
                                    : 'bg-gray-300 hover:bg-gray-400 w-2 h-2'
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                              />
                            ))}
                          </div>
                          
                          {/* Right Arrow */}
                          <button
                            onClick={() => {
                              const totalSlides = Math.ceil(cities.length / cardsPerSlide);
                              setCurrentCitySlide(prev => (prev < totalSlides - 1 ? prev + 1 : 0));
                              trackEvent('city_slider_next', 'navigation', 'cities_overview');
                            }}
                            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 flex items-center justify-center border border-gray-200"
                            aria-label="Next cities"
                          >
                            <FiChevronRight className="w-4 h-4 text-gray-700" />
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Desktop: Left arrow button */}
                          <button
                            onClick={() => {
                              const totalSlides = Math.ceil(cities.length / cardsPerSlide);
                              setCurrentCitySlide(prev => (prev > 0 ? prev - 1 : totalSlides - 1));
                              trackEvent('city_slider_prev', 'navigation', 'cities_overview');
                            }}
                            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white hover:shadow-lg transition-all duration-300 flex items-center justify-center border border-gray-200 hover:scale-110"
                            aria-label="Previous cities"
                          >
                            <FiChevronLeft className="w-4 h-4 text-gray-700" />
                          </button>
                          
                          {/* Enhanced Indicators */}
                          <div className="flex gap-3 items-center">
                            {Array.from({ length: Math.ceil(cities.length / cardsPerSlide) }).map((_, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setCurrentCitySlide(index);
                                  trackEvent('city_slider_indicator', 'navigation', `slide_${index}`);
                                }}
                                className={`rounded-full transition-all duration-300 ${
                                  currentCitySlide === index 
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 w-8 h-2.5 shadow-md' 
                                    : 'bg-gray-300 hover:bg-gray-400 w-2 h-2'
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                              />
                            ))}
                          </div>
                          
                          {/* Desktop: Right arrow button */}
                          <button
                            onClick={() => {
                              const totalSlides = Math.ceil(cities.length / cardsPerSlide);
                              setCurrentCitySlide(prev => (prev < totalSlides - 1 ? prev + 1 : 0));
                              trackEvent('city_slider_next', 'navigation', 'cities_overview');
                            }}
                            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white hover:shadow-lg transition-all duration-300 flex items-center justify-center border border-gray-200 hover:scale-110"
                            aria-label="Next cities"
                          >
                            <FiChevronRight className="w-4 h-4 text-gray-700" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div> {/* Right column */}
              </div> {/* Columns wrapper */}
            </div> {/* Relative wrapper */}
          </RevealAnimation>
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
      city: "Rayo Rabat",
      link: "https://chat.whatsapp.com/CEKKv7S4RZh6fhhTCpSg0h",
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