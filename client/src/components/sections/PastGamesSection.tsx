import { useState, useEffect, useMemo, useCallback } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useCompanyContext } from "@/hooks/use-company-context";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FiCalendar, FiMapPin, FiClock, FiUsers, FiStar, FiRefreshCw, FiBarChart2, FiTarget, FiAward, FiSearch, FiChevronDown, FiAlertTriangle, FiThumbsUp, FiThumbsDown, FiInfo } from "react-icons/fi";
import { TbBuildingStadium } from "react-icons/tb";
import { trackEvent } from "@/lib/analytics";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// Configuration for Past Games Google Sheets - NOW USING FOOT_TEAM
const DEFAULT_PAST_GAMES_SHEET_CONFIG = {
  csvUrl: "https://rayobackend.onrender.com/api/sheets/Foot_Team"
};

// Configuration for Leaderboard Google Sheets - Foot_Players sheet (gid=1681767418)
// This MUST use the Foot_Players sheet for leaderboard data (same as LeaderboardSection)
const DEFAULT_LEADERBOARD_SHEET_CONFIG = {
  csvUrl: 'https://rayobackend.onrender.com/api/sheets/Foot_Players',
};

// Configuration for Foot_Team sheet - TeamScoreScaled from Column Q
// Foot_Team sheet is in the same spreadsheet as Foot_Players
const DEFAULT_FOOT_TEAM_SHEET_CONFIG = {
  csvUrl: 'https://rayobackend.onrender.com/api/sheets/Foot_Team',
};

// Types for past games data
interface PastGamePlayer {
  id: string;
  gameId: string;
  date: string;
  status: string;
  mode: string;
  city?: string;
  terrain?: string;
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
  interception?: string;
  teamScore?: string;
  teamWin?: string;
  teamLoss?: string;
  teamCleanSheet?: string;
  teamMiniGame?: string;
  teamGoals?: string;
  teamGC?: string;
  captain?: string;
  points?: string;
  matchScoreAdjusted?: string;
}

interface PastGame {
  gameId: string;
  date: string;
  mode: string;
  city?: string;
  terrain?: string;
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
  captain?: string;
}

// Helper function to format date properly
const formatDate = (dateString: string) => {
  try {
    console.log('🔍 formatDate input:', dateString);
    
    // Handle date format like "18/07/2025 19:30" or just "18/07/2025"
    let datePart: string;
    
    if (dateString.includes(' ')) {
      [datePart] = dateString.split(' ');
    } else {
      datePart = dateString;
    }
    
    console.log('🔍 datePart after split:', datePart);
    
    // Parse DD/MM/YYYY format (from Google Sheets CSV)
    const parts = datePart.split('/');
    console.log('🔍 parts after split:', parts);
    
    if (parts.length !== 3) {
      console.log('🔍 Not enough parts, returning original:', dateString);
      return dateString;
    }
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);  
    const year = parseInt(parts[2]);
    
    console.log('🔍 parsed values:', { day, month, year });
    
    // Create date object properly - month is 0-indexed in JS
    const date = new Date(year, month - 1, day);
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const result = `${day} ${months[date.getMonth()]} ${year}`;
    console.log('🔍 formatDate result:', result);
    
    return result;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Helper function to get day name in French with day number
const getDayNameInFrench = (dateString: string) => {
  try {
    console.log('🔍 getDayNameInFrench input:', dateString);
    
    // Handle date format like "18/07/2025 19:30" or just "18/07/2025"
    let datePart: string;
    
    if (dateString.includes(' ')) {
      [datePart] = dateString.split(' ');
    } else {
      datePart = dateString;
    }
    
    console.log('🔍 datePart after split:', datePart);
    
    // Parse MM/DD/YYYY format (from Google Sheets CSV)
    const parts = datePart.split('/');
    console.log('🔍 parts after split:', parts);
    
    if (parts.length !== 3) {
      console.log('🔍 Not enough parts, returning empty');
      return '';
    }
    
    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);  
    const year = parseInt(parts[2]);
    
    console.log('🔍 parsed values:', { day, month, year });
    
    // Create date object properly - month is 0-indexed in JS
    const date = new Date(year, month - 1, day);
    
    const weekdays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const result = `${weekdays[date.getDay()]} ${day} ${months[date.getMonth()]} ${year}`;
    console.log('🔍 getDayNameInFrench result:', result);
    
    return result;
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
  console.log('📊 PastGames CSV Headers:', headers);
  
  // Find column indices dynamically
  const getColumnIndex = (columnName: string): number => {
    const index = headers.findIndex(header => header.toLowerCase() === columnName.toLowerCase());
    console.log(`📊 Column ${columnName} found at index:`, index);
    return index >= 0 ? index : -1;
  };

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

    // Map CSV columns to player data using Foot_Team column names
    // X = Column not available in Foot_Team sheet
    const player: PastGamePlayer = {
      id: row[getColumnIndex('ID')] || '',                    // ID - Column C
      date: row[getColumnIndex('Date&Time')] || '',           // Date&Time - Column D
      status: row[getColumnIndex('Status')] || '',            // Status - Column E
      mode: row[getColumnIndex('MODE')] || '',                // MODE - Column F
      city: row[getColumnIndex('City')] || '',                // City - NEW! Added at end of Foot_Team
      terrain: row[getColumnIndex('Terrain')] || '',          // Terrain - NEW! Added at end of Foot_Team
      gameId: row[getColumnIndex('Game ID')] || '',           // Game ID - Column A
      playerUsername: row[getColumnIndex('Username')] || '',  // Username - Column B (different name!)
      team: row[getColumnIndex('Team')] || '',                // Team - Column G
      number: row[getColumnIndex('Number')] || '',            // Number - Column H
      scoreManuel: 'X',                                       // Score Manuel - NOT IN FOOT_TEAM
      tScore: 'X',                                            // TScore - NOT IN FOOT_TEAM
      tMatch: 'X',                                            // TMatch - NOT IN FOOT_TEAM
      tgoals: 'X',                                            // Tgoals - NOT IN FOOT_TEAM
      soloScore: row[getColumnIndex('SoloScore')] || '',      // SoloScore - Column P
      tTeamScore: 'X',                                        // tTeamScore - NOT IN FOOT_TEAM
      att: 'X',                                               // ATT - NOT IN FOOT_TEAM
      def: 'X',                                               // DEF - NOT IN FOOT_TEAM
      rank: 'X',                                              // Rank - NOT IN FOOT_TEAM
      goal: row[getColumnIndex('Goal')] || '',                // Goal - Column I
      assist: row[getColumnIndex('Assist')] || '',            // Assist - Column J
      hattrick: row[getColumnIndex('Hattrick')] || '',        // Hattrick - Column K
      ownGoal: row[getColumnIndex('OwnGoal')] || '',          // OwnGoal - Column L
      interception: row[getColumnIndex('Interception')] || '', // Interception - Column M
      matchTotalScore: row[getColumnIndex('MatchScore')] || '', // MatchScore - Column O (equivalent?)
      teamScore: row[getColumnIndex('TeamScore')] || '',      // TeamScore - Column R
      mvp: row[getColumnIndex('MVP')] || '',                  // MVP - Column T
      teamWin: row[getColumnIndex('TeamWins')] || '',         // TeamWins - Column AQ (different name!)
      teamLoss: row[getColumnIndex('TeamLoss')] || '',        // TeamLoss - Column AR
      teamCleanSheet: row[getColumnIndex('TeamCleanSheet')] || '', // TeamCleanSheet - Column AU
      teamMiniGame: row[getColumnIndex('TeamsGamePlayed')] || '', // TeamsGamePlayed - Column AP (using for TeamMiniGame)
      teamGoals: row[getColumnIndex('TeamGoals')] || '',      // TeamGoals - Column AS
      teamGC: row[getColumnIndex('TeamGoalsC')] || '',        // TeamGoalsC - Column AT (different name!)
      captain: row[getColumnIndex('Capitaine')] || ''         // Capitaine - NEW! Added at end of Foot_Team
    };

    // Only include players from PLAYED games (filter out scheduled, cancelled, etc.)
    if (player.gameId && player.playerUsername && player.status && player.status.toLowerCase() === 'played') {
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
        city: player.city || '',
        terrain: player.terrain || '',
        players: [],
        teams: {},
        totalGoals: 0,
        totalPlayers: 0,
        captain: player.captain || '' // Use captain from CSV
      });
    }

    const game = gamesMap.get(gameKey)!;
    game.players.push(player);

    // Group by team - filter out "none" team names
    const rawTeamName = player.team || '';
    const teamName = (rawTeamName.toLowerCase() === 'none' || rawTeamName.trim() === '') ? 'Unknown' : rawTeamName;
    
    // Skip players with "none" team names
    if (rawTeamName.toLowerCase() === 'none' || rawTeamName.trim() === '') {
      return; // Skip this player
    }
    
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

// Load leaderboard data to get current player rankings, global scores, goals per match rankings, assists per match rankings, MVP per match rankings, player levels, rank tiers, player positions, team win, team loss, team clean sheet, match types, and streaks
const loadLeaderboardData = async (customDataSources?: any): Promise<{ rankings: Map<string, number>, globalScores: Map<string, number>, goalsPerMatchRankings: Map<string, number>, assistsPerMatchRankings: Map<string, number>, mvpPerMatchRankings: Map<string, number>, playerLevels: Map<string, string>, playerRanks: Map<string, number>, playerRankTiers: Map<string, string>, playerPositions: Map<string, string>, teamWins: Map<string, number>, teamLosses: Map<string, number>, teamCleanSheets: Map<string, number>, matchesC5: Map<string, number>, matchesC7: Map<string, number>, matchesR5: Map<string, number>, miniMatchesR5: Map<string, number>, playerPoints: Map<string, number>, rayoSupport: Map<string, boolean>, playerStreaks: Map<string, number> }> => {
  try {
    const config = customDataSources?.leaderboard || DEFAULT_LEADERBOARD_SHEET_CONFIG;
    const response = await fetch(config.csvUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvData = await response.text();
    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      console.warn('⚠️ PastGamesSection: Not enough lines in leaderboard CSV');
      return { rankings: new Map(), globalScores: new Map(), goalsPerMatchRankings: new Map(), assistsPerMatchRankings: new Map(), mvpPerMatchRankings: new Map(), playerLevels: new Map(), playerRanks: new Map(), playerRankTiers: new Map(), playerPositions: new Map(), teamWins: new Map(), teamLosses: new Map(), teamCleanSheets: new Map(), matchesC5: new Map(), matchesC7: new Map(), matchesR5: new Map(), miniMatchesR5: new Map(), playerPoints: new Map(), rayoSupport: new Map(), playerStreaks: new Map() };
    }
    
    const rows = lines.map(line => {
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
      return row;
    });
    
    // Parse decimal values (same logic as LeaderboardSection)
    const parseDecimal = (value: string): number => {
      if (!value || value.trim() === '' || value === '#VALUE!') return 0;
      const cleaned = value.replace(/[^\d.,-]/g, '');
      const normalized = cleaned.replace(',', '.');
      const parsed = parseFloat(normalized);
      return isNaN(parsed) ? 0 : parsed;
    };
    
    const headers = rows[0] || [];
    // Find Level column dynamically
    const getColumnIndex = (name: string): number => {
      const lowerName = name.toLowerCase();
      return headers.findIndex(h => h.toLowerCase().includes(lowerName) || lowerName.includes(h.toLowerCase()));
    };
    const levelIdx = getColumnIndex('Level') >= 0 ? getColumnIndex('Level') : -1;
    
    // Find Rank column dynamically - MUST use column G "Rank" from Foot_Players sheet
    const rankIdx = (() => {
      // First try exact match for "Rank" (case-sensitive)
      const exactRankIndex = headers.findIndex(h => h.trim() === 'Rank');
      if (exactRankIndex >= 0) {
        console.log('✅ PastGamesSection: Found Rank column at index', exactRankIndex, '(column', String.fromCharCode(65 + exactRankIndex) + ')');
        return exactRankIndex;
      }
      
      // Try case-insensitive match
      const rankIndex = getColumnIndex('Rank');
      if (rankIndex >= 0) {
        console.log('✅ PastGamesSection: Found Rank column (case-insensitive) at index', rankIndex, '(column', String.fromCharCode(65 + rankIndex) + ')');
        return rankIndex;
      }
      
      // Fallback options
      const rangIndex = getColumnIndex('Rang');
      if (rangIndex >= 0) {
        console.log('⚠️ PastGamesSection: Using "Rang" column at index', rangIndex);
        return rangIndex;
      }
      
      const globalRankIndex = getColumnIndex('Global Rank');
      if (globalRankIndex >= 0) {
        console.log('⚠️ PastGamesSection: Using "Global Rank" column at index', globalRankIndex);
        return globalRankIndex;
      }
      
      console.error('❌ PastGamesSection: Rank column NOT FOUND! Available headers:', headers.slice(0, 10));
      return -1; // Return -1 if not found instead of 0
    })();
    
    // Find Global Score column for rank tier calculation
    const globalScoreIdx = getColumnIndex('Global Score') >= 0 ? getColumnIndex('Global Score') : 
                          (getColumnIndex('Score') >= 0 ? getColumnIndex('Score') : 5);
    
    // Find PlayerUsername column - MUST use column D "Username" from Foot_Players sheet
    const playerUsernameIdx = (() => {
      // First try exact match for "Username" (column D)
      const exactUsernameIndex = headers.findIndex(h => h.trim() === 'Username');
      if (exactUsernameIndex >= 0) {
        console.log('✅ PastGamesSection: Found Username column at index', exactUsernameIndex, '(column', String.fromCharCode(65 + exactUsernameIndex) + ')');
        return exactUsernameIndex;
      }
      
      // Try case-insensitive match
      const usernameIndex = getColumnIndex('Username');
      if (usernameIndex >= 0) return usernameIndex;
      
      // Fallback options
      const playerUsernameIndex = getColumnIndex('PlayerUsername');
      if (playerUsernameIndex >= 0) return playerUsernameIndex;
      const playerIndex = getColumnIndex('Player');
      if (playerIndex >= 0) return playerIndex;
      
      console.warn('⚠️ PastGamesSection: Username column not found, using fallback index 2');
      return 2; // Fallback to column C (index 2)
    })();
    
    // Find FootPos column - MUST use column K "FootPos" from Foot_Players sheet
    const footPosIdx = (() => {
      // First try exact match for "FootPos" (column K = index 10)
      const exactFootPosIndex = headers.findIndex(h => h.trim() === 'FootPos');
      if (exactFootPosIndex >= 0) {
        console.log('✅ PastGamesSection: Found FootPos column at index', exactFootPosIndex, '(column', String.fromCharCode(65 + exactFootPosIndex) + ')');
        return exactFootPosIndex;
      }
      
      // Try case-insensitive match
      const footPosIndex = getColumnIndex('FootPos');
      if (footPosIndex >= 0) return footPosIndex;
      
      // Try variations
      const positionIndex = getColumnIndex('Position');
      if (positionIndex >= 0) return positionIndex;
      const posIndex = getColumnIndex('Pos');
      if (posIndex >= 0) return posIndex;
      
      console.warn('⚠️ PastGamesSection: FootPos column not found');
      return -1;
    })();
    
    // Find Team Win column - MUST use column AD "Team Win" from Foot_Players sheet
    const teamWinIdx = (() => {
      // First try exact match for "Team Win" (column AD = index 29)
      const exactTeamWinIndex = headers.findIndex(h => h.trim() === 'Team Win');
      if (exactTeamWinIndex >= 0) {
        console.log('✅ PastGamesSection: Found Team Win column at index', exactTeamWinIndex, '(column', String.fromCharCode(65 + exactTeamWinIndex) + ')');
        return exactTeamWinIndex;
      }
      
      // Try case-insensitive match
      const teamWinIndex = getColumnIndex('Team Win');
      if (teamWinIndex >= 0) return teamWinIndex;
      
      // Try variations
      const teamWinIndex2 = getColumnIndex('TeamWin');
      if (teamWinIndex2 >= 0) return teamWinIndex2;
      
      console.warn('⚠️ PastGamesSection: Team Win column not found');
      return -1;
    })();
    
    // Find Team Loss column - MUST use column AH "Team Loss" from Foot_Players sheet
    const teamLossIdx = (() => {
      // First try exact match for "Team Loss" (column AH = index 33)
      const exactTeamLossIndex = headers.findIndex(h => h.trim() === 'Team Loss');
      if (exactTeamLossIndex >= 0) {
        console.log('✅ PastGamesSection: Found Team Loss column at index', exactTeamLossIndex, '(column', String.fromCharCode(65 + exactTeamLossIndex) + ')');
        return exactTeamLossIndex;
      }
      
      // Try case-insensitive match
      const teamLossIndex = getColumnIndex('Team Loss');
      if (teamLossIndex >= 0) return teamLossIndex;
      
      // Try variations
      const teamLossIndex2 = getColumnIndex('TeamLoss');
      if (teamLossIndex2 >= 0) return teamLossIndex2;
      
      console.warn('⚠️ PastGamesSection: Team Loss column not found');
      return -1;
    })();
    
    // Find TeamCS column - MUST use column AG "TeamCS" from Foot_Players sheet
    const teamCSIdx = (() => {
      // First try exact match for "TeamCS" (column AG = index 32)
      const exactTeamCSIndex = headers.findIndex(h => h.trim() === 'TeamCS');
      if (exactTeamCSIndex >= 0) {
        console.log('✅ PastGamesSection: Found TeamCS column at index', exactTeamCSIndex, '(column', String.fromCharCode(65 + exactTeamCSIndex) + ')');
        return exactTeamCSIndex;
      }
      
      // Try case-insensitive match
      const teamCSIndex = getColumnIndex('TeamCS');
      if (teamCSIndex >= 0) return teamCSIndex;
      
      // Try variations
      const teamCSIndex2 = getColumnIndex('Team CleanSheet');
      if (teamCSIndex2 >= 0) return teamCSIndex2;
      const teamCSIndex3 = getColumnIndex('TeamCleanSheet');
      if (teamCSIndex3 >= 0) return teamCSIndex3;
      
      console.warn('⚠️ PastGamesSection: TeamCS column not found');
      return -1;
    })();
    
    // Find Match type columns - MatchesC5, MatchesC7, MatchesR5, MiniMatchesR5
    const matchesC5Idx = (() => {
      const exactIndex = headers.findIndex(h => h.trim() === 'MatchesC5');
      if (exactIndex >= 0) {
        console.log('✅ PastGamesSection: Found MatchesC5 column at index', exactIndex);
        return exactIndex;
      }
      const index = getColumnIndex('MatchesC5');
      if (index >= 0) return index;
      return -1;
    })();
    
    const matchesC7Idx = (() => {
      const exactIndex = headers.findIndex(h => h.trim() === 'MatchesC7');
      if (exactIndex >= 0) {
        console.log('✅ PastGamesSection: Found MatchesC7 column at index', exactIndex);
        return exactIndex;
      }
      const index = getColumnIndex('MatchesC7');
      if (index >= 0) return index;
      return -1;
    })();
    
    const matchesR5Idx = (() => {
      const exactIndex = headers.findIndex(h => h.trim() === 'MatchesR5');
      if (exactIndex >= 0) {
        console.log('✅ PastGamesSection: Found MatchesR5 column at index', exactIndex);
        return exactIndex;
      }
      const index = getColumnIndex('MatchesR5');
      if (index >= 0) return index;
      return -1;
    })();
    
    const miniMatchesR5Idx = (() => {
      const exactIndex = headers.findIndex(h => h.trim() === 'MiniMatchesR5');
      if (exactIndex >= 0) {
        console.log('✅ PastGamesSection: Found MiniMatchesR5 column at index', exactIndex);
        return exactIndex;
      }
      const index = getColumnIndex('MiniMatchesR5');
      if (index >= 0) return index;
      return -1;
    })();
    
    // Find Points column - MUST use column Q "Points" from Foot_Players sheet
    const pointsIdx = (() => {
      // First try exact match for "Points" (column Q = index 16)
      const exactPointsIndex = headers.findIndex(h => h.trim() === 'Points');
      if (exactPointsIndex >= 0) {
        console.log('✅ PastGamesSection: Found Points column at index', exactPointsIndex, '(column', String.fromCharCode(65 + exactPointsIndex) + ')');
        return exactPointsIndex;
      }
      
      // Try case-insensitive match
      const pointsIndex = getColumnIndex('Points');
      if (pointsIndex >= 0) return pointsIndex;
      
      console.warn('⚠️ PastGamesSection: Points column not found');
      return -1;
    })();
    
    // Find RayoSupport column - MUST use column BD "RayoSupport" from Foot_Players sheet
    const rayoSupportIdx = (() => {
      // First try exact match for "RayoSupport" (column BD = index 55)
      const exactRayoSupportIndex = headers.findIndex(h => h.trim() === 'RayoSupport');
      if (exactRayoSupportIndex >= 0) {
        console.log('✅ PastGamesSection: Found RayoSupport column at index', exactRayoSupportIndex, '(column', String.fromCharCode(65 + exactRayoSupportIndex) + ')');
        return exactRayoSupportIndex;
      }
      
      // Try case-insensitive match
      const rayoSupportIndex = getColumnIndex('RayoSupport');
      if (rayoSupportIndex >= 0) return rayoSupportIndex;
      
      console.warn('⚠️ PastGamesSection: RayoSupport column not found');
      return -1;
    })();
    
    // Find Streaks column - column AQ "Streaks" from Foot_Players sheet
    const streakIdx = (() => {
      const streakIndex = getColumnIndex('Streaks') >= 0 ? getColumnIndex('Streaks') : 
                         (getColumnIndex('Streak') >= 0 ? getColumnIndex('Streak') : -1);
      if (streakIndex >= 0) {
        console.log('✅ PastGamesSection: Found Streaks column at index', streakIndex);
      } else {
        console.warn('⚠️ PastGamesSection: Streaks column not found');
      }
      return streakIndex;
    })();
    
    // Extract player data
    const playersData = rows.slice(1)
      .filter(row => {
        const playerUsername = playerUsernameIdx >= 0 ? (row[playerUsernameIdx]?.trim() || '') : (row[2] || '');
        return playerUsername && playerUsername !== '' && playerUsername !== '#VALUE!' && playerUsername !== '#N/A';
      })
      .map((row: string[]) => {
        const playerUsername = (playerUsernameIdx >= 0 ? (row[playerUsernameIdx]?.trim() || '') : (row[2] || '')).trim();
        const globalScore = parseDecimal(row[5]) || 0;
        const goals = parseInt(row[7]) || 0;
        const assists = parseInt(row[8]) || 0;
        const gamesPlayed = parseInt(row[6]) || 0;
        
        // Find MVP count column dynamically
        let mvpCount = 0;
        const mvpCountIndex = headers.findIndex(h => h.includes('TMVP🔒'));
        if (mvpCountIndex !== -1 && row[mvpCountIndex]) {
          mvpCount = parseInt(row[mvpCountIndex]) || 0;
        }
        
        // Extract Level from Level column
        let level = '';
        if (levelIdx >= 0) {
          const levelValue = row[levelIdx]?.trim();
          if (levelValue && levelValue !== '#REF!' && levelValue !== '#N/A' && levelValue !== '#ERROR!' && levelValue !== '') {
            level = levelValue;
          }
        }
        
        // Extract FootPos from FootPos column (column K "FootPos")
        let footPos = '';
        if (footPosIdx >= 0 && footPosIdx < row.length) {
          const footPosValue = row[footPosIdx]?.trim();
          if (footPosValue && 
              footPosValue !== '#REF!' && 
              footPosValue !== '#N/A' && 
              footPosValue !== '#ERROR!' && 
              footPosValue !== '' &&
              footPosValue !== '#VALUE!') {
            footPos = footPosValue;
          }
        }
        
        // Extract Team Win from Team Win column (column AD "Team Win")
        let teamWin = 0;
        if (teamWinIdx >= 0 && teamWinIdx < row.length) {
          const teamWinValue = row[teamWinIdx]?.trim();
          if (teamWinValue && 
              teamWinValue !== '#REF!' && 
              teamWinValue !== '#N/A' && 
              teamWinValue !== '#ERROR!' && 
              teamWinValue !== '' &&
              teamWinValue !== '#VALUE!') {
            const parsed = parseInt(teamWinValue);
            if (!isNaN(parsed)) {
              teamWin = parsed;
            }
          }
        }
        
        // Extract Team Loss from Team Loss column (column AH "Team Loss")
        let teamLoss = 0;
        if (teamLossIdx >= 0 && teamLossIdx < row.length) {
          const teamLossValue = row[teamLossIdx]?.trim();
          if (teamLossValue && 
              teamLossValue !== '#REF!' && 
              teamLossValue !== '#N/A' && 
              teamLossValue !== '#ERROR!' && 
              teamLossValue !== '' &&
              teamLossValue !== '#VALUE!') {
            const parsed = parseInt(teamLossValue);
            if (!isNaN(parsed)) {
              teamLoss = parsed;
            }
          }
        }
        
        // Extract TeamCS from TeamCS column (column AG "TeamCS")
        let teamCS = 0;
        if (teamCSIdx >= 0 && teamCSIdx < row.length) {
          const teamCSValue = row[teamCSIdx]?.trim();
          if (teamCSValue && 
              teamCSValue !== '#REF!' && 
              teamCSValue !== '#N/A' && 
              teamCSValue !== '#ERROR!' && 
              teamCSValue !== '' &&
              teamCSValue !== '#VALUE!') {
            const parsed = parseInt(teamCSValue);
            if (!isNaN(parsed)) {
              teamCS = parsed;
            }
          }
        }
        
        // Extract Match type values
        let matchesC5 = 0;
        if (matchesC5Idx >= 0 && matchesC5Idx < row.length) {
          const value = row[matchesC5Idx]?.trim();
          if (value && value !== '#REF!' && value !== '#N/A' && value !== '#ERROR!' && value !== '' && value !== '#VALUE!') {
            const parsed = parseInt(value);
            if (!isNaN(parsed)) matchesC5 = parsed;
          }
        }
        
        let matchesC7 = 0;
        if (matchesC7Idx >= 0 && matchesC7Idx < row.length) {
          const value = row[matchesC7Idx]?.trim();
          if (value && value !== '#REF!' && value !== '#N/A' && value !== '#ERROR!' && value !== '' && value !== '#VALUE!') {
            const parsed = parseInt(value);
            if (!isNaN(parsed)) matchesC7 = parsed;
          }
        }
        
        let matchesR5 = 0;
        if (matchesR5Idx >= 0 && matchesR5Idx < row.length) {
          const value = row[matchesR5Idx]?.trim();
          if (value && value !== '#REF!' && value !== '#N/A' && value !== '#ERROR!' && value !== '' && value !== '#VALUE!') {
            const parsed = parseInt(value);
            if (!isNaN(parsed)) matchesR5 = parsed;
          }
        }
        
        let miniMatchesR5 = 0;
        if (miniMatchesR5Idx >= 0 && miniMatchesR5Idx < row.length) {
          const value = row[miniMatchesR5Idx]?.trim();
          if (value && value !== '#REF!' && value !== '#N/A' && value !== '#ERROR!' && value !== '' && value !== '#VALUE!') {
            const parsed = parseInt(value);
            if (!isNaN(parsed)) miniMatchesR5 = parsed;
          }
        }
        
        // Extract Points from Points column (column Q "Points" in Foot_Players sheet)
        let points = 0;
        if (pointsIdx >= 0 && pointsIdx < row.length) {
          const pointsValue = row[pointsIdx]?.trim();
          if (pointsValue && 
              pointsValue !== '#REF!' && 
              pointsValue !== '#N/A' && 
              pointsValue !== '#ERROR!' && 
              pointsValue !== '' &&
              pointsValue !== '#VALUE!') {
            const parsed = parseDecimal(pointsValue);
            if (!isNaN(parsed)) {
              points = parsed;
            }
          }
        }
        
        // Extract RayoSupport from RayoSupport column (column BD "RayoSupport" in Foot_Players sheet)
        let rayoSupport = false;
        if (rayoSupportIdx >= 0 && rayoSupportIdx < row.length) {
          const rayoSupportValue = row[rayoSupportIdx]?.trim();
          if (rayoSupportValue && 
              rayoSupportValue !== '#REF!' && 
              rayoSupportValue !== '#N/A' && 
              rayoSupportValue !== '#ERROR!' && 
              rayoSupportValue !== '' &&
              rayoSupportValue !== '#VALUE!') {
            // Check if value is "1" or "true" or "yes"
            rayoSupport = rayoSupportValue === '1' || rayoSupportValue.toLowerCase() === 'true' || rayoSupportValue.toLowerCase() === 'yes';
          }
        }
        
        // Extract Streaks from Streaks column (column AQ "Streaks" in Foot_Players sheet)
        let streak: number | undefined = undefined;
        if (streakIdx >= 0 && streakIdx < row.length) {
          const streakValue = row[streakIdx]?.trim() || '';
          if (streakValue && streakValue !== '#REF!' && streakValue !== '#N/A' && streakValue !== '#ERROR!' && streakValue !== '') {
            const parsedStreak = parseInt(streakValue);
            if (!isNaN(parsedStreak)) {
              streak = parsedStreak;
            }
          }
        }
        
        // Extract Rank and RankTier from Rank column (column G "Rank" in Foot_Players sheet)
        let rank = 0;
        let rankTier: string | undefined = undefined;
        
        // Always use Rank column value if available (column G "Rank")
        if (rankIdx >= 0 && rankIdx < row.length) {
          const rankValue = row[rankIdx]?.trim() || '';
          
          // Check if it's a valid rank value (not error values)
          if (rankValue && 
              rankValue !== '#REF!' && 
              rankValue !== '#N/A' && 
              rankValue !== '#ERROR!' && 
              rankValue !== '' &&
              rankValue !== '#VALUE!') {
            
            // The Rank column typically contains rank tier names (like "FOX 1", "Goat 2", "Predator #1", etc.)
            // Store it as rankTier directly
            rankTier = rankValue;
            
            // Also try to extract numeric rank if it's in the format "Predator #1" or just a number
            const predatorMatch = rankValue.match(/predator\s*#?\s*(\d+)/i);
            if (predatorMatch) {
              rank = parseInt(predatorMatch[1]);
            } else {
              // Try to parse as pure number (though Rank column usually has tier names)
              const parsedRank = parseInt(rankValue);
              if (!isNaN(parsedRank) && rankValue === parsedRank.toString()) {
                rank = parsedRank;
              }
            }
          }
        }
        
        // Only calculate rank tier from score as LAST RESORT if Rank column is empty/invalid
        // This should rarely happen if Rank column is properly populated
        if (!rankTier && rank === 0 && globalScore > 0) {
          if (globalScore < 50) rankTier = "Unranked";
          else if (globalScore < 100) rankTier = "FOX 1";
          else if (globalScore < 150) rankTier = "FOX 2";
          else if (globalScore < 250) rankTier = "FOX 3";
          else if (globalScore < 400) rankTier = "Crocodile 1";
          else if (globalScore < 600) rankTier = "Crocodile 2";
          else if (globalScore < 900) rankTier = "Crocodile 3";
          else if (globalScore < 1200) rankTier = "Gorilla 1";
          else if (globalScore < 1600) rankTier = "Gorilla 2";
          else if (globalScore < 2100) rankTier = "Gorilla 3";
          else if (globalScore < 2600) rankTier = "Goat 1";
          else if (globalScore < 3300) rankTier = "Goat 2";
          else if (globalScore < 4000) rankTier = "Goat 3";
          else if (globalScore >= 4000 && rank <= 10) rankTier = `Predator #${rank}`;
          else rankTier = "Goat 3";
        }
        
        const goalsPerMatch = gamesPlayed > 0 ? goals / gamesPlayed : 0;
        const assistsPerMatch = gamesPlayed > 0 ? assists / gamesPlayed : 0;
        const mvpPerMatch = gamesPlayed > 0 ? mvpCount / gamesPlayed : 0;
        return { username: playerUsername, globalScore, goals, assists, gamesPlayed, goalsPerMatch, assistsPerMatch, mvpCount, mvpPerMatch, level, rank, rankTier: rankTier || undefined, footPos: footPos || undefined, teamWin, teamLoss, teamCS, matchesC5, matchesC7, matchesR5, miniMatchesR5, points, rayoSupport, streak };
      });
    
    // Sort by Global Score (descending order) and assign proper ranks
    const sortedByScore = playersData.sort((a, b) => b.globalScore - a.globalScore);
    
    // Sort by Goals Per Match (descending order) and assign proper ranks
    const sortedByGoalsPerMatch = [...playersData].sort((a, b) => b.goalsPerMatch - a.goalsPerMatch);
    
    // Sort by Assists Per Match (descending order) and assign proper ranks
    const sortedByAssistsPerMatch = [...playersData].sort((a, b) => b.assistsPerMatch - a.assistsPerMatch);
    
    // Sort by MVP Per Match (descending order) and assign proper ranks
    const sortedByMvpPerMatch = [...playersData].sort((a, b) => b.mvpPerMatch - a.mvpPerMatch);
    
    // Create mapping of username to current rank, global score, goals per match rank, assists per match rank, MVP per match rank, level, rank, and rank tier
    const rankMap = new Map<string, number>();
    const globalScoreMap = new Map<string, number>();
    const goalsPerMatchRankMap = new Map<string, number>();
    const assistsPerMatchRankMap = new Map<string, number>();
    const mvpPerMatchRankMap = new Map<string, number>();
    const playerLevelsMap = new Map<string, string>();
    const playerRanksMap = new Map<string, number>();
    const playerRankTiersMap = new Map<string, string>();
    const playerPositionsMap = new Map<string, string>();
    const teamWinsMap = new Map<string, number>();
    const teamLossesMap = new Map<string, number>();
    const teamCleanSheetsMap = new Map<string, number>();
    const matchesC5Map = new Map<string, number>();
    const matchesC7Map = new Map<string, number>();
    const matchesR5Map = new Map<string, number>();
    const miniMatchesR5Map = new Map<string, number>();
    const playerPointsMap = new Map<string, number>();
    const rayoSupportMap = new Map<string, boolean>();
    const playerStreaksMap = new Map<string, number>();
    
    sortedByScore.forEach((player, index) => {
      if (player.username) {
        const normalizedUsername = player.username.trim();
        rankMap.set(normalizedUsername, index + 1);
        globalScoreMap.set(normalizedUsername, player.globalScore);
        if (player.level) {
          playerLevelsMap.set(normalizedUsername, player.level);
        }
        if (player.rank > 0) {
          playerRanksMap.set(normalizedUsername, player.rank);
        }
        // Always store rankTier from Rank column if available
        if (player.rankTier) {
          playerRankTiersMap.set(normalizedUsername, player.rankTier);
          // Debug log for first few players
          if (index < 5) {
            console.log(`📊 PastGamesSection: Player ${normalizedUsername} - Rank column value: "${player.rankTier}"`);
          }
        } else if (index < 5) {
          console.warn(`⚠️ PastGamesSection: Player ${normalizedUsername} has no rankTier from Rank column`);
        }
        
        // Store FootPos from FootPos column (column K)
        if (player.footPos) {
          playerPositionsMap.set(normalizedUsername, player.footPos);
        }
        
        // Store Team Win from Team Win column (column AD)
        if (player.teamWin !== undefined && player.teamWin > 0) {
          teamWinsMap.set(normalizedUsername, player.teamWin);
        }
        
        // Store Team Loss from Team Loss column (column AH)
        if (player.teamLoss !== undefined && player.teamLoss > 0) {
          teamLossesMap.set(normalizedUsername, player.teamLoss);
        }
        
        // Store TeamCS from TeamCS column (column AG)
        if (player.teamCS !== undefined && player.teamCS > 0) {
          teamCleanSheetsMap.set(normalizedUsername, player.teamCS);
        }
        
        // Store Match type values
        if (player.matchesC5 !== undefined && player.matchesC5 > 0) {
          matchesC5Map.set(normalizedUsername, player.matchesC5);
        }
        if (player.matchesC7 !== undefined && player.matchesC7 > 0) {
          matchesC7Map.set(normalizedUsername, player.matchesC7);
        }
        if (player.matchesR5 !== undefined && player.matchesR5 > 0) {
          matchesR5Map.set(normalizedUsername, player.matchesR5);
        }
        if (player.miniMatchesR5 !== undefined && player.miniMatchesR5 > 0) {
          miniMatchesR5Map.set(normalizedUsername, player.miniMatchesR5);
        }
        
        // Store Points from Points column (column Q)
        if (player.points !== undefined && player.points > 0) {
          playerPointsMap.set(normalizedUsername, player.points);
        }
        
        // Store RayoSupport from RayoSupport column (column BD)
        if (player.rayoSupport !== undefined && player.rayoSupport) {
          rayoSupportMap.set(normalizedUsername, player.rayoSupport);
        }
        
        // Store Streaks from Streaks column (column AQ)
        if (player.streak !== undefined && player.streak > 0) {
          playerStreaksMap.set(normalizedUsername, player.streak);
        }
      }
    });
    
    sortedByGoalsPerMatch.forEach((player, index) => {
      if (player.username) {
        goalsPerMatchRankMap.set(player.username, index + 1);
      }
    });
    
    sortedByAssistsPerMatch.forEach((player, index) => {
      if (player.username) {
        assistsPerMatchRankMap.set(player.username, index + 1);
      }
    });
    
    sortedByMvpPerMatch.forEach((player, index) => {
      if (player.username) {
        mvpPerMatchRankMap.set(player.username, index + 1);
      }
    });
    
    console.log('📊 PastGamesSection: Loaded current rankings, global scores, goals per match rankings, assists per match rankings, MVP per match rankings, player levels, ranks, rank tiers, positions, team wins, team losses, and team clean sheets for', rankMap.size, 'players');
    console.log('📊 PastGamesSection: Rank column index (should be column G):', rankIdx);
    console.log('📊 PastGamesSection: Rank column header:', rankIdx >= 0 && headers[rankIdx] ? headers[rankIdx] : 'NOT FOUND');
    console.log('📊 PastGamesSection: FootPos column index (should be column K):', footPosIdx);
    console.log('📊 PastGamesSection: FootPos column header:', footPosIdx >= 0 && headers[footPosIdx] ? headers[footPosIdx] : 'NOT FOUND');
    console.log('📊 PastGamesSection: Team Win column index (should be column AD):', teamWinIdx);
    console.log('📊 PastGamesSection: Team Win column header:', teamWinIdx >= 0 && headers[teamWinIdx] ? headers[teamWinIdx] : 'NOT FOUND');
    console.log('📊 PastGamesSection: Team Loss column index (should be column AH):', teamLossIdx);
    console.log('📊 PastGamesSection: Team Loss column header:', teamLossIdx >= 0 && headers[teamLossIdx] ? headers[teamLossIdx] : 'NOT FOUND');
    console.log('📊 PastGamesSection: TeamCS column index (should be column AG):', teamCSIdx);
    console.log('📊 PastGamesSection: TeamCS column header:', teamCSIdx >= 0 && headers[teamCSIdx] ? headers[teamCSIdx] : 'NOT FOUND');
    console.log('📊 PastGamesSection: Player levels loaded:', Array.from(playerLevelsMap.entries()).slice(0, 10));
    console.log('📊 PastGamesSection: Player rank tiers loaded:', Array.from(playerRankTiersMap.entries()).slice(0, 10));
    console.log('📊 PastGamesSection: Player positions loaded:', Array.from(playerPositionsMap.entries()).slice(0, 10));
    console.log('📊 PastGamesSection: Team wins loaded:', Array.from(teamWinsMap.entries()).slice(0, 10));
    console.log('📊 PastGamesSection: Team losses loaded:', Array.from(teamLossesMap.entries()).slice(0, 10));
    console.log('📊 PastGamesSection: Team clean sheets loaded:', Array.from(teamCleanSheetsMap.entries()).slice(0, 10));
    console.log('📊 PastGamesSection: Sample rank tier data:', Array.from(playerRankTiersMap.entries()).slice(0, 5).map(([username, tier]) => `${username}: "${tier}"`));
    return { rankings: rankMap, globalScores: globalScoreMap, goalsPerMatchRankings: goalsPerMatchRankMap, assistsPerMatchRankings: assistsPerMatchRankMap, mvpPerMatchRankings: mvpPerMatchRankMap, playerLevels: playerLevelsMap, playerRanks: playerRanksMap, playerRankTiers: playerRankTiersMap, playerPositions: playerPositionsMap, teamWins: teamWinsMap, teamLosses: teamLossesMap, teamCleanSheets: teamCleanSheetsMap, matchesC5: matchesC5Map, matchesC7: matchesC7Map, matchesR5: matchesR5Map, miniMatchesR5: miniMatchesR5Map, playerPoints: playerPointsMap, rayoSupport: rayoSupportMap, playerStreaks: playerStreaksMap };
    
  } catch (error) {
    console.error('Error loading leaderboard data for rankings:', error);
    return { rankings: new Map(), globalScores: new Map(), goalsPerMatchRankings: new Map(), assistsPerMatchRankings: new Map(), mvpPerMatchRankings: new Map(), playerLevels: new Map(), playerRanks: new Map(), playerRankTiers: new Map(), playerPositions: new Map(), teamWins: new Map(), teamLosses: new Map(), teamCleanSheets: new Map(), matchesC5: new Map(), matchesC7: new Map(), matchesR5: new Map(), miniMatchesR5: new Map(), playerPoints: new Map(), rayoSupport: new Map(), playerStreaks: new Map() };
  }
};

// Load team data from Foot_Team sheet to get TeamScoreScaled from Column Q, Points from Column U, and MatchScoreAdjusted from Column S
const loadTeamData = async (customDataSources?: any): Promise<{ teamScoreMap: Map<string, string>, pointsMap: Map<string, string>, matchScoreAdjustedMap: Map<string, string> }> => {
  const teamScoreMap = new Map<string, string>();
  const pointsMap = new Map<string, string>();
  const matchScoreAdjustedMap = new Map<string, string>();
  
  try {
    // Try custom data source first, then default config
    // Foot_Team might be in the same spreadsheet as Foot_Players or Past Games
    const config = customDataSources?.footTeam || DEFAULT_FOOT_TEAM_SHEET_CONFIG;
    const csvUrl = config.csvUrl;
    
    console.log('🔍 PastGamesSection: Loading team data from Foot_Team sheet:', csvUrl);
    
    const response = await fetch(csvUrl, {
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'Accept': 'text/csv,text/plain,*/*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvData = await response.text();
    
    if (csvData.includes('<!DOCTYPE html>') || csvData.includes('Page introuvable') || csvData.includes('<TITLE>Temporary Redirect</TITLE>')) {
      throw new Error('Google Sheets returned HTML error page instead of CSV data');
    }
    
    // Parse CSV
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      console.warn('⚠️ PastGamesSection: Not enough lines in Foot_Team CSV');
      return { teamScoreMap, pointsMap, matchScoreAdjustedMap };
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
    
    // Find columns we need - Game ID, Team, TeamScoreScaled (Column Q = index 16), and Points (Column U = index 20)
    const getColumnIndex = (columnName: string): number => {
      const index = headers.findIndex(header => header.toLowerCase() === columnName.toLowerCase());
      return index >= 0 ? index : -1;
    };
    
    const gameIdIdx = getColumnIndex('Game ID') >= 0 ? getColumnIndex('Game ID') : getColumnIndex('GameID');
    const teamIdx = getColumnIndex('Team') >= 0 ? getColumnIndex('Team') : -1;
    // Try to find PlayerUsername column for matching Points per player
    const playerUsernameIdx = getColumnIndex('PlayerUsername') >= 0 ? getColumnIndex('PlayerUsername') : 
                              (getColumnIndex('Player Username') >= 0 ? getColumnIndex('Player Username') : 
                              (getColumnIndex('Username') >= 0 ? getColumnIndex('Username') : -1));
    // Try to find TeamScoreScaled by name first, then fall back to Column Q (index 16)
    const teamScoreIdxByName = getColumnIndex('TeamScoreScaled');
    const teamScoreIdx = teamScoreIdxByName >= 0 ? teamScoreIdxByName : 16; // Column Q (0-based index 16)
    // Try to find Points by name first, then fall back to Column U (index 20)
    const pointsIdxByName = getColumnIndex('Points');
    const pointsIdx = pointsIdxByName >= 0 ? pointsIdxByName : 20; // Column U (0-based index 20)
    // Try to find MatchScoreAdjusted by name first, then fall back to Column S (index 18)
    const matchScoreAdjustedIdxByName = getColumnIndex('MatchScoreAdjusted');
    const matchScoreAdjustedIdx = matchScoreAdjustedIdxByName >= 0 ? matchScoreAdjustedIdxByName : 18; // Column S (0-based index 18)
    
    console.log('📊 PastGamesSection: Foot_Team columns - Game ID:', gameIdIdx, 'Team:', teamIdx, 'PlayerUsername:', playerUsernameIdx, 'TeamScoreScaled:', teamScoreIdx, 'Points:', pointsIdx, 'MatchScoreAdjusted:', matchScoreAdjustedIdx, '(by name:', matchScoreAdjustedIdxByName, ', fallback to S:', matchScoreAdjustedIdx === 18 && matchScoreAdjustedIdxByName < 0 ? 'yes' : 'no', ')');
    
    // Parse rows
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
      
      if (row.length <= Math.max(teamScoreIdx, pointsIdx, matchScoreAdjustedIdx)) continue;
      
      const gameId = (gameIdIdx >= 0 ? row[gameIdIdx] : '').trim();
      const team = (teamIdx >= 0 ? row[teamIdx] : '').trim();
      const playerUsername = (playerUsernameIdx >= 0 ? row[playerUsernameIdx] : '').trim();
      const teamScore = (row[teamScoreIdx] || '').trim();
      const points = (row[pointsIdx] || '').trim();
      const matchScoreAdjusted = (row[matchScoreAdjustedIdx] || '').trim();
      
      // Create key for TeamScore: gameId_team (team-level data)
      const teamScoreKey = gameId && team ? `${gameId}_${team}` : team || gameId || '';
      
      if (teamScoreKey && teamScore) {
        teamScoreMap.set(teamScoreKey, teamScore);
        // Also store with lowercase key for case-insensitive matching
        teamScoreMap.set(teamScoreKey.toLowerCase(), teamScore);
      }
      
      // Create key for Points: gameId_playerUsername (player-level data)
      // If PlayerUsername is available, use it; otherwise fall back to gameId_team
      let pointsKey = '';
      if (gameId && playerUsername) {
        pointsKey = `${gameId}_${playerUsername}`;
      } else if (gameId && team) {
        pointsKey = `${gameId}_${team}`;
      } else {
        pointsKey = playerUsername || team || gameId || '';
      }
      
      if (pointsKey && points) {
        pointsMap.set(pointsKey, points);
        // Also store with lowercase key for case-insensitive matching
        pointsMap.set(pointsKey.toLowerCase(), points);
        if (i <= 5) { // Log first 5 entries for debugging
          console.log(`📊 PastGamesSection: Foot_Team entry ${i}: pointsKey="${pointsKey}", points="${points}", playerUsername="${playerUsername}"`);
        }
      }
      
      // Store MatchScoreAdjusted using the same key as Points (player-level)
      if (pointsKey && matchScoreAdjusted) {
        matchScoreAdjustedMap.set(pointsKey, matchScoreAdjusted);
        // Also store with lowercase key for case-insensitive matching
        matchScoreAdjustedMap.set(pointsKey.toLowerCase(), matchScoreAdjusted);
        if (i <= 5) { // Log first 5 entries for debugging
          console.log(`📊 PastGamesSection: Foot_Team entry ${i}: matchScoreAdjustedKey="${pointsKey}", matchScoreAdjusted="${matchScoreAdjusted}", playerUsername="${playerUsername}"`);
        }
      }
    }
    
    console.log('✅ PastGamesSection: Loaded', teamScoreMap.size, 'team scores,', pointsMap.size, 'points, and', matchScoreAdjustedMap.size, 'match scores from Foot_Team sheet');
    if (teamScoreMap.size > 0 || pointsMap.size > 0 || matchScoreAdjustedMap.size > 0) {
      const sampleKeys = Array.from(teamScoreMap.keys()).slice(0, 3);
      console.log('📊 PastGamesSection: Sample keys from Foot_Team:', sampleKeys);
    }
    return { teamScoreMap, pointsMap, matchScoreAdjustedMap };
  } catch (error) {
    console.warn('⚠️ PastGamesSection: Failed to load team data from Foot_Team sheet:', error);
    return { teamScoreMap, pointsMap, matchScoreAdjustedMap };
  }
};

// Load past games data from Google Sheets with static file fallback
const loadPastGamesData = async (customDataSources?: any): Promise<{ data: PastGame[], usedFallback: boolean }> => {
  try {
    // First, try to load from Google Sheets
    const csvUrl = customDataSources?.pastGames || DEFAULT_PAST_GAMES_SHEET_CONFIG.csvUrl;

    console.log('🔍 PastGames fetching from:', csvUrl);

          const response = await fetch(csvUrl, {
        cache: 'no-store',
        redirect: 'follow',
        headers: {
          'Accept': 'text/csv,text/plain,*/*'
        }
      });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvData = await response.text();
    
    console.log("📊 PastGames CSV Data loaded successfully, length:", csvData.length);
    console.log("📊 PastGames CSV preview (first 500 chars):", csvData.substring(0, 500));
    
    // Check if the response is actually CSV data (not HTML error page)
    if (csvData.includes('<!DOCTYPE html>') || csvData.includes('Page introuvable') || csvData.includes('<TITLE>Temporary Redirect</TITLE>')) {
      throw new Error('Google Sheets returned HTML error page instead of CSV data');
    }
    
    const data = parsePastGamesCSV(csvData);
    console.log('🎯 PastGames parsed games count:', data.length);
    console.log('🎯 Sample past game:', data[0]);
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
    'Orange': { bg: 'bg-orange-800', text: 'text-orange-100', border: 'border-orange-700' },
    'Jaune': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    'Green': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    'Red': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    'Vert': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' }
  };
  
  return teamColors[teamName] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
};

interface PastGamesSectionProps {
  initialPlayerUsername?: string;
  onPlayerModalClose?: () => void;
}

// Player Avatar Component with Dynamic Border Based on Score
interface PlayerAvatarWithDynamicBorderProps {
  username: string;
  score: number;
  size?: "sm" | "md" | "lg";
}

const PlayerAvatarWithDynamicBorder = ({ username, score, size = "md" }: PlayerAvatarWithDynamicBorderProps) => {
  // Generate profile picture URL using DiceBear API (lorelei style) - Premium, modern avatars
  // Lorelei provides high-quality, professional avatars perfect for sports platforms
  const avatarUrl = `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,ffcc5c,ff6b9d,4ecdc4,95e1d3,ffa07a,98d8c8,f38181,aa96da,fcbad3,a8e6cf,ffd3a5,fd9853,fc6c85,ffa8b6,ffb3ba`;
  
  // Determine border style based on score - Enhanced with more dynamic effects
  const getBorderStyle = (score: number) => {
    if (score >= 9) {
      // Diamond/Platinum - Purple/Pink gradient with intense effects
      return {
        borderColor: 'from-purple-500 via-pink-500 via-rose-500 to-purple-500',
        avatarGradient: 'from-purple-600 via-pink-600 to-rose-600',
        borderWidth: 'border-[3px]',
        shadow: 'shadow-purple-500/50',
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]',
        animation: 'animate-pulse',
        glowIntensity: 'opacity-40',
        blurIntensity: 'blur-3xl',
        energyBursts: 4,
        energyColor1: 'bg-purple-400',
        energyColor2: 'bg-pink-400',
        energyColor3: 'bg-rose-400',
        pulseSpeed: 'animate-pulse',
        spinSpeed: 'animate-spin-fast' // 3s - faster for legendary
      };
    } else if (score >= 7) {
      // Platinum - Cyan/Blue gradient with strong effects
      return {
        borderColor: 'from-cyan-400 via-blue-500 via-indigo-500 to-cyan-400',
        avatarGradient: 'from-cyan-500 via-blue-600 to-indigo-600',
        borderWidth: 'border-[3px]',
        shadow: 'shadow-cyan-500/50',
        glow: 'shadow-[0_0_15px_rgba(6,182,212,0.5)]',
        animation: '',
        glowIntensity: 'opacity-30',
        blurIntensity: 'blur-2xl',
        energyBursts: 3,
        energyColor1: 'bg-cyan-400',
        energyColor2: 'bg-blue-400',
        energyColor3: 'bg-indigo-400',
        pulseSpeed: 'animate-pulse',
        spinSpeed: 'animate-spin-medium' // 5s - medium for elite
      };
    } else if (score >= 5) {
      // Gold - Gold/Yellow gradient with moderate effects
      return {
        borderColor: 'from-yellow-400 via-amber-500 via-orange-500 to-yellow-400',
        avatarGradient: 'from-yellow-500 via-amber-600 to-orange-600',
        borderWidth: 'border-[2.5px]',
        shadow: 'shadow-yellow-500/50',
        glow: 'shadow-[0_0_12px_rgba(234,179,8,0.4)]',
        animation: '',
        glowIntensity: 'opacity-25',
        blurIntensity: 'blur-xl',
        energyBursts: 2,
        energyColor1: 'bg-yellow-400',
        energyColor2: 'bg-amber-400',
        energyColor3: 'bg-orange-400',
        pulseSpeed: 'animate-pulse'
      };
    } else if (score >= 3) {
      // Silver - Gray/Silver gradient with subtle effects
      return {
        borderColor: 'from-gray-300 via-gray-400 via-slate-400 to-gray-300',
        avatarGradient: 'from-gray-400 via-slate-500 to-gray-500',
        borderWidth: 'border-[2px]',
        shadow: 'shadow-gray-400/40',
        glow: 'shadow-[0_0_8px_rgba(156,163,175,0.3)]',
        animation: '',
        glowIntensity: 'opacity-20',
        blurIntensity: 'blur-lg',
        energyBursts: 1,
        energyColor1: 'bg-gray-400',
        energyColor2: 'bg-slate-400',
        energyColor3: '',
        pulseSpeed: ''
      };
    } else {
      // Bronze - Brown/Copper gradient with minimal effects
      return {
        borderColor: 'from-amber-700 via-orange-600 via-red-600 to-amber-700',
        avatarGradient: 'from-amber-600 via-orange-500 to-red-500',
        borderWidth: 'border-[2px]',
        shadow: 'shadow-amber-600/30',
        glow: 'shadow-[0_0_6px_rgba(217,119,6,0.2)]',
        animation: '',
        glowIntensity: 'opacity-15',
        blurIntensity: 'blur-md',
        energyBursts: 1,
        energyColor1: 'bg-amber-400',
        energyColor2: 'bg-orange-400',
        energyColor3: '',
        pulseSpeed: ''
      };
    }
  };

  const borderStyle = getBorderStyle(score);
  
  // Size classes - Made bigger for sporty design
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24 sm:w-32 sm:h-32',
    lg: 'w-40 h-40 sm:w-48 sm:h-48'
  };

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-3xl sm:text-4xl',
    lg: 'text-5xl sm:text-6xl'
  };

  // Get border colors for conic gradient
  const getBorderColors = (score: number) => {
    if (score >= 9) {
      return 'rgb(168,85,247), rgb(236,72,153), rgb(168,85,247)';
    } else if (score >= 7) {
      return 'rgb(6,182,212), rgb(59,130,246), rgb(6,182,212)';
    } else if (score >= 5) {
      return 'rgb(234,179,8), rgb(245,158,11), rgb(234,179,8)';
    } else if (score >= 3) {
      return 'rgb(156,163,175), rgb(209,213,219), rgb(156,163,175)';
    } else {
      return 'rgb(217,119,6), rgb(251,146,60), rgb(217,119,6)';
    }
  };

  const borderWidth = score >= 9 ? 3 : score >= 7 ? 3 : score >= 5 ? 2.5 : 2;

  return (
    <div className="relative inline-block" style={{ padding: `${borderWidth * 2}px` }}>
      {/* Outer energy burst effect - Dynamic intensity based on score */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-full h-full rounded-full bg-gradient-to-r ${borderStyle.borderColor} ${borderStyle.glowIntensity} ${borderStyle.spinSpeed || 'animate-spin-slow'} ${borderStyle.blurIntensity}`}></div>
      </div>
      
      {/* Pulsing glow ring - Dynamic based on score */}
      {borderStyle.pulseSpeed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-full h-full rounded-full bg-gradient-to-br ${borderStyle.borderColor} ${borderStyle.glowIntensity} animate-ping`} style={{ animationDuration: '2s' }}></div>
        </div>
      )}
      
      {/* Outer animated rotating border ring - Dynamic colors and speed */}
      <div 
        className={`absolute inset-0 rounded-full ${borderStyle.shadow} ${borderStyle.glow}`}
        style={{
          background: `conic-gradient(from 0deg, ${getBorderColors(score)})`,
          padding: `${borderWidth * 2}px`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          animation: score >= 9 ? 'spin-fast 3s linear infinite' : score >= 7 ? 'spin-medium 4s linear infinite' : 'spin-slow 5s linear infinite',
        }}
      ></div>
      
      {/* Static inner border for depth and glow effect - Dynamic opacity */}
      <div 
        className="absolute rounded-full"
        style={{
          inset: `${borderWidth * 2 + 2}px`,
          border: `${Math.max(borderWidth, 2)}px solid`,
          borderImage: `linear-gradient(135deg, ${getBorderColors(score).split(',')[0]}, ${getBorderColors(score).split(',')[1]}) 1`,
          opacity: score >= 9 ? 0.7 : score >= 7 ? 0.6 : score >= 5 ? 0.5 : 0.4,
          pointerEvents: 'none'
        }}
      ></div>
      
      {/* Avatar Container with sporty effects - Dynamic gradient */}
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden z-10 shadow-2xl`}>
        {/* Inner glow effect - Dynamic intensity */}
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-br to-transparent"
          style={{
            background: `linear-gradient(to bottom right, rgba(255,255,255,${score >= 9 ? 0.3 : score >= 7 ? 0.25 : score >= 5 ? 0.2 : 0.15}), transparent)`
          }}
        ></div>
        
        <Avatar className={`w-full h-full ${sizeClasses[size]} border-4 border-white/80`}>
          <AvatarImage 
            src={avatarUrl} 
            alt={username}
            className="w-full h-full object-cover"
          />
          <AvatarFallback className={`bg-gradient-to-br ${borderStyle.avatarGradient || 'from-blue-500 via-purple-600 to-pink-500'} ${textSizeClasses[size]} font-black text-white drop-shadow-lg`}>
            {username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      
      {/* Energy burst effects - Dynamic count and colors based on score */}
      {borderStyle.energyBursts >= 1 && borderStyle.energyColor1 && (
        <div className={`absolute -top-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 ${borderStyle.energyColor1} rounded-full ${borderStyle.pulseSpeed} shadow-lg ${borderStyle.energyColor1}/70 z-20`}></div>
      )}
      {borderStyle.energyBursts >= 2 && borderStyle.energyColor2 && (
        <div className={`absolute -bottom-1 -left-1 w-3 h-3 sm:w-5 sm:h-5 ${borderStyle.energyColor2} rounded-full ${borderStyle.pulseSpeed} shadow-lg ${borderStyle.energyColor2}/70 z-20`} style={{ animationDelay: '0.5s' }}></div>
      )}
      {borderStyle.energyBursts >= 3 && borderStyle.energyColor3 && (
        <div className={`absolute top-1/2 -left-1 w-2.5 h-2.5 sm:w-4 sm:h-4 ${borderStyle.energyColor3} rounded-full ${borderStyle.pulseSpeed} shadow-lg ${borderStyle.energyColor3}/70 z-20`} style={{ animationDelay: '1s' }}></div>
      )}
      {borderStyle.energyBursts >= 4 && borderStyle.energyColor1 && (
        <div className={`absolute top-1/2 -right-1 w-2.5 h-2.5 sm:w-4 sm:h-4 ${borderStyle.energyColor1} rounded-full ${borderStyle.pulseSpeed} shadow-lg ${borderStyle.energyColor1}/70 z-20`} style={{ animationDelay: '1.5s' }}></div>
      )}
      
      {/* Status indicator dot - Enhanced with dynamic pulse */}
      <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-4 border-white shadow-xl z-20 ${borderStyle.pulseSpeed || ''}`}></div>
    </div>
  );
};

export default function PastGamesSection({ initialPlayerUsername, onPlayerModalClose }: PastGamesSectionProps = {}) {
  const { language, t } = useLanguage();
  const { customDataSources } = useCompanyContext();
  const [selectedGame, setSelectedGame] = useState<PastGame | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [pastGames, setPastGames] = useState<PastGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const gamesPerSlide = 3;
  const [searchPlayer, setSearchPlayer] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [currentRankings, setCurrentRankings] = useState<Map<string, number>>(new Map());
  const [globalScores, setGlobalScores] = useState<Map<string, number>>(new Map());
  const [goalsPerMatchRankings, setGoalsPerMatchRankings] = useState<Map<string, number>>(new Map());
  const [assistsPerMatchRankings, setAssistsPerMatchRankings] = useState<Map<string, number>>(new Map());
  const [mvpPerMatchRankings, setMvpPerMatchRankings] = useState<Map<string, number>>(new Map());
  const [playerStreaks, setPlayerStreaks] = useState<Map<string, number>>(new Map());
  const [playerLevels, setPlayerLevels] = useState<Map<string, string>>(new Map());
  const [playerRanks, setPlayerRanks] = useState<Map<string, number>>(new Map());
  const [playerRankTiers, setPlayerRankTiers] = useState<Map<string, string>>(new Map());
  const [playerPositions, setPlayerPositions] = useState<Map<string, string>>(new Map());
  const [teamWins, setTeamWins] = useState<Map<string, number>>(new Map());
  const [teamLosses, setTeamLosses] = useState<Map<string, number>>(new Map());
  const [teamCleanSheets, setTeamCleanSheets] = useState<Map<string, number>>(new Map());
  const [matchesC5, setMatchesC5] = useState<Map<string, number>>(new Map());
  const [matchesC7, setMatchesC7] = useState<Map<string, number>>(new Map());
  const [matchesR5, setMatchesR5] = useState<Map<string, number>>(new Map());
  const [miniMatchesR5, setMiniMatchesR5] = useState<Map<string, number>>(new Map());
  const [playerPoints, setPlayerPoints] = useState<Map<string, number>>(new Map());
  const [rayoSupport, setRayoSupport] = useState<Map<string, boolean>>(new Map());
  const [allPlayersFromSheet, setAllPlayersFromSheet] = useState<any[]>([]);

  // Load all players from Foot_Players sheet for search suggestions (same as Football.tsx)
  useEffect(() => {
    const fetchAllPlayers = async () => {
      try {
        const response = await fetch('https://rayobackend.onrender.com/api/sheets/Foot_Players');
        const csvText = await response.text();
        
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
          
          const getColumnIndex = (name: string): number => {
            const lowerName = name.toLowerCase();
            return headers.findIndex(h => h.toLowerCase().includes(lowerName) || lowerName.includes(h.toLowerCase()));
          };
          
          const usernameIdx = getColumnIndex('Username') >= 0 ? getColumnIndex('Username') : 
                             getColumnIndex('PlayerUsername') >= 0 ? getColumnIndex('PlayerUsername') : 3;
          const cityIdx = getColumnIndex('City') >= 0 ? getColumnIndex('City') : 4;
          const globalScoreIdx = getColumnIndex('Global Score') >= 0 ? getColumnIndex('Global Score') : 5;
          const gamesPlayedIdx = getColumnIndex('Games Played') >= 0 ? getColumnIndex('Games Played') : 
                                getColumnIndex('Matches') >= 0 ? getColumnIndex('Matches') : -1;
          const levelIdx = getColumnIndex('Level') >= 0 ? getColumnIndex('Level') : -1;
          const rankIdx = (() => {
            const exactMatch = headers.findIndex(h => h.toLowerCase().trim() === 'rank');
            if (exactMatch >= 0) return exactMatch;
            const byName = getColumnIndex('Rank');
            if (byName >= 0) return byName;
            return 6;
          })();
          
          const parseDecimal = (value: string): number => {
            if (!value || value === '#REF!' || value === '#N/A' || value === '#ERROR!' || value === '') return 0;
            const cleanValue = value.toString().replace(',', '.').trim();
            const parsed = parseFloat(cleanValue);
            return isNaN(parsed) ? 0 : parsed;
          };
          
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
          
          const players = rows.slice(1)
            .filter(row => {
              const username = usernameIdx >= 0 ? row[usernameIdx]?.trim() : '';
              return username && username !== '' && username !== '#VALUE!' && username !== '#N/A';
            })
            .map((row: string[]) => {
              const username = usernameIdx >= 0 ? row[usernameIdx]?.trim() || 'Unknown' : 'Unknown';
              const levelValue = levelIdx >= 0 ? row[levelIdx]?.trim() || '' : '';
              const score = parseDecimal(globalScoreIdx >= 0 ? row[globalScoreIdx] : '0');
              const rankValue = rankIdx >= 0 ? (row[rankIdx]?.trim() || '') : '';
              let rank = 0;
              let rankTier: string | undefined = undefined;
              
              const parsedRank = parseInt(rankValue);
              if (!isNaN(parsedRank) && rankValue !== '' && rankValue !== '#REF!' && rankValue !== '#N/A' && rankValue !== '#ERROR!') {
                rank = parsedRank;
              } else if (rankValue && rankValue !== '#REF!' && rankValue !== '#N/A' && rankValue !== '#ERROR!' && rankValue !== '') {
                rankTier = rankValue;
              }
              
              if (!rankTier) {
                rankTier = getRankTierFromScore(score, rank);
              }
              
              return {
                username: username,
                level: levelValue,
                gamesPlayed: parseInt(gamesPlayedIdx >= 0 ? row[gamesPlayedIdx] : '0') || 0,
                rankTier: rankTier,
                globalScore: score
              };
            })
            .filter((player: any) => player.username && player.username !== '');
          
          setAllPlayersFromSheet(players);
          console.log('✅ PastGames: Loaded', players.length, 'players from Foot_Players sheet for search');
        }
      } catch (error) {
        console.error('Error fetching all players for search:', error);
      }
    };
    
    fetchAllPlayers();
  }, []);

  // Save city selection to localStorage
  const handleCitySelect = useCallback((city: string) => {
    setSelectedCity(city);
    setIsCityDropdownOpen(false);
    localStorage.setItem('pastGamesSelectedCity', city);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCityDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-dropdown]')) {
          setIsCityDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCityDropdownOpen]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Player Analytics State
  const [selectedPlayer, setSelectedPlayer] = useState<PastGamePlayer | null>(null);
  const [isPlayerAnalyticsOpen, setIsPlayerAnalyticsOpen] = useState(false);
  
  // Captain Dashboard State
  const [selectedCaptain, setSelectedCaptain] = useState<string | null>(null);
  const [isCaptainDashboardOpen, setIsCaptainDashboardOpen] = useState(false);
  
  // Social Stats State
  const [playerStats, setPlayerStats] = useState<{[key: string]: {likes: number, dislikes: number, views: number, userVote: 'like' | 'dislike' | null}}>({});
  
  // Voting and View Tracking State
  const [gameVotes, setGameVotes] = useState<{[key: string]: {good: number, bad: number, votedIPs: string[]}}>({});
  const [captainVotes, setCaptainVotes] = useState<{[key: string]: {good: number, bad: number, votedIPs: string[]}}>({});
  const [gameViews, setGameViews] = useState<{[key: string]: number}>({});
  const [captainViews, setCaptainViews] = useState<{[key: string]: number}>({});
  const [userIP, setUserIP] = useState<string>('');

  // Get user IP address
  const getUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setUserIP(data.ip);
      return data.ip;
    } catch (error) {
      console.error('Error getting IP:', error);
      // Fallback to a random IP for development
      const fallbackIP = `dev_${Math.random().toString(36).substr(2, 9)}`;
      setUserIP(fallbackIP);
      return fallbackIP;
    }
  };

  // Load voting and view data from localStorage
  const loadVotingData = () => {
    try {
      const savedGameVotes = localStorage.getItem('gameVotes');
      const savedCaptainVotes = localStorage.getItem('captainVotes');
      const savedGameViews = localStorage.getItem('gameViews');
      const savedCaptainViews = localStorage.getItem('captainViews');
      
      if (savedGameVotes) setGameVotes(JSON.parse(savedGameVotes));
      if (savedCaptainVotes) setCaptainVotes(JSON.parse(savedCaptainVotes));
      if (savedGameViews) setGameViews(JSON.parse(savedGameViews));
      if (savedCaptainViews) setCaptainViews(JSON.parse(savedCaptainViews));
    } catch (error) {
      console.error('Error loading voting data:', error);
    }
  };

  // Save voting and view data to localStorage
  const saveVotingData = () => {
    try {
      localStorage.setItem('gameVotes', JSON.stringify(gameVotes));
      localStorage.setItem('captainVotes', JSON.stringify(captainVotes));
      localStorage.setItem('gameViews', JSON.stringify(gameViews));
      localStorage.setItem('captainViews', JSON.stringify(captainViews));
    } catch (error) {
      console.error('Error saving voting data:', error);
    }
  };

  // Track game view
  const trackGameView = (gameId: string, date: string) => {
    const key = `${gameId}_${date}`;
    setGameViews(prev => {
      const newViews = { ...prev, [key]: (prev[key] || 0) + 1 };
      return newViews;
    });
    trackEvent('game_viewed', key);
  };

  // Track captain view
  const trackCaptainView = (captainName: string) => {
    setCaptainViews(prev => {
      const newViews = { ...prev, [captainName]: (prev[captainName] || 0) + 1 };
      return newViews;
    });
    trackEvent('captain_viewed', captainName);
  };

  // Handle game vote
  const handleGameVote = (gameId: string, date: string, vote: 'good' | 'bad') => {
    const key = `${gameId}_${date}`;
    const currentIP = userIP;
    
    if (!currentIP) {
      console.error('No IP address available for voting');
      return;
    }

    setGameVotes(prev => {
      const currentVotes = prev[key] || { good: 0, bad: 0, votedIPs: [] };
      
      // Check if this IP already voted
      if (currentVotes.votedIPs.includes(currentIP)) {
        console.log('This IP has already voted for this game');
        return prev;
      }

      const newVotes = {
        ...prev,
        [key]: {
          ...currentVotes,
          [vote]: currentVotes[vote] + 1,
          votedIPs: [...currentVotes.votedIPs, currentIP]
        }
      };
      
      return newVotes;
    });

    trackEvent('game_voted', `${key}_${vote}`);
  };

  // Handle captain vote (per game)
  const handleCaptainVote = (gameId: string, captainName: string, vote: 'good' | 'bad') => {
    const currentIP = userIP;
    
    if (!currentIP) {
      console.error('No IP address available for voting');
      return;
    }

    const voteKey = `${gameId}_${captainName}`;

    setCaptainVotes(prev => {
      const currentVotes = prev[voteKey] || { good: 0, bad: 0, votedIPs: [] };
      
      // Check if this IP already voted for this captain in this game
      if (currentVotes.votedIPs.includes(currentIP)) {
        console.log('This IP has already voted for this captain in this game');
        return prev;
      }

      const newVotes = {
        ...prev,
        [voteKey]: {
          ...currentVotes,
          [vote]: currentVotes[vote] + 1,
          votedIPs: [...currentVotes.votedIPs, currentIP]
        }
      };
      
      return newVotes;
    });

    trackEvent('captain_voted', `${gameId}_${captainName}_${vote}`);
  };

  // Handle player like/dislike
  const handlePlayerLike = (playerUsername: string, action: 'like' | 'dislike') => {
    setPlayerStats(prev => {
      const currentStats = prev[playerUsername] || { likes: 0, dislikes: 0, views: 0, userVote: null };
      
      // Check if user already voted
      if (currentStats.userVote === action) {
        // Remove vote if clicking same button
        return {
          ...prev,
          [playerUsername]: {
            ...currentStats,
            [action === 'like' ? 'likes' : 'dislikes']: Math.max(0, currentStats[action === 'like' ? 'likes' : 'dislikes'] - 1),
            userVote: null
          }
        };
      } else if (currentStats.userVote) {
        // Change vote from one to another
        const oldAction = currentStats.userVote;
        return {
          ...prev,
          [playerUsername]: {
            ...currentStats,
            [oldAction === 'like' ? 'likes' : 'dislikes']: Math.max(0, currentStats[oldAction === 'like' ? 'likes' : 'dislikes'] - 1),
            [action === 'like' ? 'likes' : 'dislikes']: currentStats[action === 'like' ? 'likes' : 'dislikes'] + 1,
            userVote: action
          }
        };
      } else {
        // New vote
        return {
          ...prev,
          [playerUsername]: {
            ...currentStats,
            [action === 'like' ? 'likes' : 'dislikes']: currentStats[action === 'like' ? 'likes' : 'dislikes'] + 1,
            userVote: action
          }
        };
      }
    });

    trackEvent('player_voted', `${playerUsername}_${action}`);
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
    loadPlayerStats();
    loadVotingData();
    getUserIP();
  }, []);

  // Save voting data when it changes
  useEffect(() => {
    saveVotingData();
  }, [gameVotes, captainVotes, gameViews, captainViews]);

  // Track game view when modal opens
  useEffect(() => {
    if (selectedGame && isStatsModalOpen) {
      trackGameView(selectedGame.gameId, selectedGame.date);
    }
  }, [selectedGame, isStatsModalOpen]);

  // Track captain view when dashboard opens
  useEffect(() => {
    if (selectedCaptain && isCaptainDashboardOpen) {
      trackCaptainView(selectedCaptain);
    }
  }, [selectedCaptain, isCaptainDashboardOpen]);

  // Handle initial player selection from props
  useEffect(() => {
    if (initialPlayerUsername && pastGames.length > 0 && !selectedPlayer) {
      // Find the player in the past games data
      const allPlayers = pastGames.flatMap(game => game.players);
      const player = allPlayers.find(p => p.playerUsername === initialPlayerUsername);
      
      if (player) {
        setSelectedPlayer(player);
        setIsPlayerAnalyticsOpen(true);
        handleView(player.playerUsername);
      }
    }
  }, [initialPlayerUsername, pastGames, selectedPlayer]);

  // Load player stats from localStorage
  const loadPlayerStats = () => {
    try {
      const savedStats = localStorage.getItem('playerStats');
      if (savedStats) {
        setPlayerStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.error('Error loading player stats:', error);
    }
  };

  // Save player stats to localStorage
  const savePlayerStats = (stats: typeof playerStats) => {
    try {
      localStorage.setItem('playerStats', JSON.stringify(stats));
      setPlayerStats(stats);
    } catch (error) {
      console.error('Error saving player stats:', error);
    }
  };

  // Get unique device identifier
  const getDeviceId = (): string => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      // Generate a unique device ID based on browser fingerprint
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
      }
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL()
      ].join('|');
      
      deviceId = btoa(fingerprint).substring(0, 16);
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  // Handle like/dislike voting
  const handleVote = (playerUsername: string, voteType: 'like' | 'dislike') => {
    const deviceId = getDeviceId();
    const currentStats = { ...playerStats };
    
    if (!currentStats[playerUsername]) {
      currentStats[playerUsername] = { likes: 0, dislikes: 0, views: 0, userVote: null };
    }
    
    const playerStat = currentStats[playerUsername];
    const previousVote = playerStat.userVote;
    
    // Remove previous vote if exists
    if (previousVote === 'like') {
      playerStat.likes = Math.max(0, playerStat.likes - 1);
    } else if (previousVote === 'dislike') {
      playerStat.dislikes = Math.max(0, playerStat.dislikes - 1);
    }
    
    // Add new vote if different from previous
    if (previousVote !== voteType) {
      if (voteType === 'like') {
        playerStat.likes += 1;
      } else {
        playerStat.dislikes += 1;
      }
      playerStat.userVote = voteType;
    } else {
      // If clicking the same vote, remove it
      playerStat.userVote = null;
    }
    
    savePlayerStats(currentStats);
  };

  // Handle view count (increment every time)
  const handleView = (playerUsername: string) => {
    const currentStats = { ...playerStats };
    
    if (!currentStats[playerUsername]) {
      currentStats[playerUsername] = { likes: 0, dislikes: 0, views: 0, userVote: null };
    }
    
    currentStats[playerUsername].views += 1;
    savePlayerStats(currentStats);
  };

  // Get player stats
  const getPlayerStats = (playerUsername: string) => {
    return playerStats[playerUsername] || { likes: 0, dislikes: 0, views: 0, userVote: null };
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load past games data, leaderboard rankings, and team data
      const [pastGamesResult, leaderboardData, teamData] = await Promise.all([
        loadPastGamesData(customDataSources),
        loadLeaderboardData(customDataSources),
        loadTeamData(customDataSources)
      ]);
      
      const { teamScoreMap, pointsMap, matchScoreAdjustedMap } = teamData;
      
      // Enrich past games with TeamScore, Points, and MatchScoreAdjusted from Foot_Team sheet
      const enrichedGames = pastGamesResult.data.map(game => {
        const enrichedPlayers = game.players.map(player => {
          // Normalize values for matching
          const normalizedGameId = (player.gameId || '').trim();
          const normalizedTeam = (player.team || '').trim();
          const normalizedUsername = (player.playerUsername || '').trim().toLowerCase();
          
          // Try multiple key formats for matching
          let teamScoreFromSheet: string | undefined;
          let pointsFromSheet: string | undefined;
          let matchScoreAdjustedFromSheet: string | undefined;
          
          // For TeamScore: Try gameId_team (team-level data)
          if (normalizedGameId && normalizedTeam) {
            const teamScoreKey = `${normalizedGameId}_${normalizedTeam}`;
            teamScoreFromSheet = teamScoreMap.get(teamScoreKey) || teamScoreMap.get(teamScoreKey.toLowerCase());
          }
          
          // For Points: Try gameId_playerUsername first (player-level data)
          if (normalizedGameId && normalizedUsername) {
            const pointsKey1 = `${normalizedGameId}_${normalizedUsername}`;
            pointsFromSheet = pointsMap.get(pointsKey1) || pointsMap.get(pointsKey1.toLowerCase());
            matchScoreAdjustedFromSheet = matchScoreAdjustedMap.get(pointsKey1) || matchScoreAdjustedMap.get(pointsKey1.toLowerCase());
            
            // Also try with original case username
            if ((!pointsFromSheet || !matchScoreAdjustedFromSheet) && player.playerUsername) {
              const pointsKey1Original = `${normalizedGameId}_${player.playerUsername.trim()}`;
              if (!pointsFromSheet) {
                pointsFromSheet = pointsMap.get(pointsKey1Original) || pointsMap.get(pointsKey1Original.toLowerCase());
              }
              if (!matchScoreAdjustedFromSheet) {
                matchScoreAdjustedFromSheet = matchScoreAdjustedMap.get(pointsKey1Original) || matchScoreAdjustedMap.get(pointsKey1Original.toLowerCase());
              }
            }
          }
          
          // Fallback for Points and MatchScoreAdjusted: Try gameId_team if player-level match failed
          if ((!pointsFromSheet || !matchScoreAdjustedFromSheet) && normalizedGameId && normalizedTeam) {
            const pointsKey2 = `${normalizedGameId}_${normalizedTeam}`;
            if (!pointsFromSheet) {
              pointsFromSheet = pointsMap.get(pointsKey2) || pointsMap.get(pointsKey2.toLowerCase());
            }
            if (!matchScoreAdjustedFromSheet) {
              matchScoreAdjustedFromSheet = matchScoreAdjustedMap.get(pointsKey2) || matchScoreAdjustedMap.get(pointsKey2.toLowerCase());
            }
          }
          
          // Fallback for TeamScore: Try just team name
          if (!teamScoreFromSheet && normalizedTeam) {
            const teamLower = normalizedTeam.toLowerCase();
            teamScoreMap.forEach((value, key) => {
              if (!teamScoreFromSheet && (
                key.toLowerCase().endsWith(`_${teamLower}`) || 
                key.toLowerCase() === teamLower
              )) {
                teamScoreFromSheet = value;
              }
            });
          }
          
          // Fallback for Points and MatchScoreAdjusted: Try just username
          if ((!pointsFromSheet || !matchScoreAdjustedFromSheet) && normalizedUsername) {
            pointsMap.forEach((value, key) => {
              if (!pointsFromSheet && (
                key.toLowerCase().endsWith(`_${normalizedUsername}`) ||
                key.toLowerCase() === normalizedUsername
              )) {
                pointsFromSheet = value;
              }
            });
            matchScoreAdjustedMap.forEach((value, key) => {
              if (!matchScoreAdjustedFromSheet && (
                key.toLowerCase().endsWith(`_${normalizedUsername}`) ||
                key.toLowerCase() === normalizedUsername
              )) {
                matchScoreAdjustedFromSheet = value;
              }
            });
          }
          
          // Use TeamScore, Points, and MatchScoreAdjusted from Foot_Team sheet if available
          const enrichedPlayer = { ...player };
          if (teamScoreFromSheet) {
            enrichedPlayer.teamScore = teamScoreFromSheet;
          }
          if (pointsFromSheet) {
            enrichedPlayer.points = pointsFromSheet;
            console.log(`✅ PastGamesSection: Matched points for ${normalizedGameId}_${normalizedUsername}: ${pointsFromSheet}`);
          } else {
            console.log(`⚠️ PastGamesSection: No points match for ${normalizedGameId}_${normalizedUsername}`);
          }
          if (matchScoreAdjustedFromSheet) {
            enrichedPlayer.matchScoreAdjusted = matchScoreAdjustedFromSheet;
            console.log(`✅ PastGamesSection: Matched matchScoreAdjusted for ${normalizedGameId}_${normalizedUsername}: ${matchScoreAdjustedFromSheet}`);
          } else {
            console.log(`⚠️ PastGamesSection: No matchScoreAdjusted match for ${normalizedGameId}_${normalizedUsername}`);
          }
          
          return enrichedPlayer;
        });
        
        return { ...game, players: enrichedPlayers };
      });
      
      setPastGames(enrichedGames);
      setCurrentRankings(leaderboardData.rankings);
      setGlobalScores(leaderboardData.globalScores);
      setGoalsPerMatchRankings(leaderboardData.goalsPerMatchRankings);
      setAssistsPerMatchRankings(leaderboardData.assistsPerMatchRankings);
      setMvpPerMatchRankings(leaderboardData.mvpPerMatchRankings);
      setPlayerStreaks(leaderboardData.playerStreaks);
      setPlayerLevels(leaderboardData.playerLevels);
      setPlayerRanks(leaderboardData.playerRanks);
      setPlayerRankTiers(leaderboardData.playerRankTiers);
      setPlayerPositions(leaderboardData.playerPositions);
      setTeamWins(leaderboardData.teamWins);
      setTeamLosses(leaderboardData.teamLosses);
      setTeamCleanSheets(leaderboardData.teamCleanSheets);
      setMatchesC5(leaderboardData.matchesC5);
      setMatchesC7(leaderboardData.matchesC7);
      setMatchesR5(leaderboardData.matchesR5);
      setMiniMatchesR5(leaderboardData.miniMatchesR5);
      setPlayerPoints(leaderboardData.playerPoints);
      setRayoSupport(leaderboardData.rayoSupport);
      
      if (pastGamesResult.usedFallback) {
        setError('static-fallback');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error loading past games:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = useCallback(async () => {
    try {
      setIsRefetching(true);
      setError(null);
      
      // Load both past games data and current leaderboard rankings
      const [pastGamesResult, leaderboardData] = await Promise.all([
        loadPastGamesData(customDataSources),
        loadLeaderboardData(customDataSources)
      ]);
      
      setPastGames(pastGamesResult.data);
      setCurrentRankings(leaderboardData.rankings);
      setGlobalScores(leaderboardData.globalScores);
      setGoalsPerMatchRankings(leaderboardData.goalsPerMatchRankings);
      setAssistsPerMatchRankings(leaderboardData.assistsPerMatchRankings);
      setMvpPerMatchRankings(leaderboardData.mvpPerMatchRankings);
      setPlayerStreaks(leaderboardData.playerStreaks);
      setPlayerLevels(leaderboardData.playerLevels);
      setPlayerRanks(leaderboardData.playerRanks);
      setPlayerRankTiers(leaderboardData.playerRankTiers);
      setPlayerPositions(leaderboardData.playerPositions);
      setTeamWins(leaderboardData.teamWins);
      setTeamLosses(leaderboardData.teamLosses);
      setTeamCleanSheets(leaderboardData.teamCleanSheets);
      setMatchesC5(leaderboardData.matchesC5);
      setMatchesC7(leaderboardData.matchesC7);
      setMatchesR5(leaderboardData.matchesR5);
      setMiniMatchesR5(leaderboardData.miniMatchesR5);
      setPlayerPoints(leaderboardData.playerPoints);
      setRayoSupport(leaderboardData.rayoSupport);
      
      if (pastGamesResult.usedFallback) {
        setError('static-fallback');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error refreshing past games:', err);
    } finally {
      setIsRefetching(false);
    }
  }, [customDataSources]);

  const handleGameClick = useCallback((game: PastGame) => {
    setSelectedGame(game);
    setIsStatsModalOpen(true);
    trackEvent('past_game_click', 'user_action', game.gameId);

    // Remove captain votes for this game when clicking on it
    if (game.captain) {
      const voteKey = `${game.gameId}_${game.captain}`;
      setCaptainVotes(prev => {
        const newVotes = { ...prev };
        delete newVotes[voteKey];
        return newVotes;
      });
    }
  }, []);

  const handlePlayerClick = useCallback((player: PastGamePlayer) => {
    setSelectedPlayer(player);
    setIsPlayerAnalyticsOpen(true);
    trackEvent('player_analytics_click', 'user_action', player.playerUsername);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
    trackEvent('past_games_refresh', 'user_action', 'manual');
  }, [refetch]);

  // Extract numeric level value from strings like "Level 12" or "Lvl 5" (same as LeaderboardSection)
  const getLevelNumericValue = (level?: string): number => {
    if (!level) return 0;
    const match = level.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // Get color for level badge based on 10-level segments (1-9 same color, 10-19 another, etc.) - same as LeaderboardSection
  const getLevelBadgeColor = (levelValue: number): string => {
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

  // Format rank tier for display (convert all rank numbers to Roman numerals) - same as RankedLeaderboardSection
  const formatRankTierForDisplay = (tier: string): string => {
    if (!tier) return 'Unranked';
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

  // Get rank logo URL and styling based on rank name (same as RankedLeaderboardSection)
  const getRankLogoForName = (rankName: string | undefined) => {
    if (!rankName) {
      return { logoUrl: '/images/gallery/optimized/unranked.png', size: 'w-5 h-5 sm:w-6 sm:h-6' };
    }
    
    const rankLower = rankName.toLowerCase().trim();
    let logoUrl = '';
    let size = 'w-5 h-5 sm:w-6 sm:h-6';
    
    // Check for Predator with number (Predator #1, Predator #2, etc.)
    if (rankLower.includes('predator')) {
      logoUrl = '/images/gallery/optimized/Predator.png';
      size = 'w-6 h-6 sm:w-7 sm:h-7';
    } else if (rankLower.includes('goat 3') || rankLower.includes('goat3')) {
      logoUrl = '/images/gallery/optimized/Goat3.png';
      size = 'w-5 h-5 sm:w-6 sm:h-6';
    } else if (rankLower.includes('goat 2') || rankLower.includes('goat2')) {
      logoUrl = '/images/gallery/optimized/Goat2.png';
      size = 'w-5 h-5 sm:w-6 sm:h-6';
    } else if (rankLower.includes('goat 1') || rankLower.includes('goat1')) {
      logoUrl = '/images/gallery/optimized/Goat1.png';
      size = 'w-5 h-5 sm:w-6 sm:h-6';
    } else if (rankLower.includes('gorilla 3') || rankLower.includes('gorilla3')) {
      logoUrl = '/images/gallery/optimized/Gorilla3.png';
      size = 'w-5 h-5 sm:w-6 sm:h-6';
    } else if (rankLower.includes('gorilla 2') || rankLower.includes('gorilla2')) {
      logoUrl = '/images/gallery/optimized/Gorilla2.png';
      size = 'w-5 h-5 sm:w-6 sm:h-6';
    } else if (rankLower.includes('gorilla 1') || rankLower.includes('gorilla1')) {
      logoUrl = '/images/gallery/optimized/Gorilla1.png';
      size = 'w-5 h-5 sm:w-6 sm:h-6';
    } else if (rankLower.includes('crocodile 3')) {
      logoUrl = '/images/gallery/optimized/crocodile3.png';
      size = 'w-5 h-5 sm:w-6 sm:h-6';
    } else if (rankLower.includes('crocodile 2')) {
      logoUrl = '/images/gallery/optimized/crocodile2.png';
      size = 'w-5 h-5 sm:w-6 sm:h-6';
    } else if (rankLower.includes('crocodile 1')) {
      logoUrl = '/images/gallery/optimized/crocodile1.png';
      size = 'w-5 h-5 sm:w-6 sm:h-6';
    } else if (rankLower.includes('fox 3')) {
      logoUrl = '/images/gallery/optimized/fox3.png';
      size = 'w-5 h-5 sm:w-6 sm:h-6';
    } else if (rankLower.includes('fox 2')) {
      logoUrl = '/images/gallery/optimized/fox2.png';
      size = 'w-5 h-5 sm:w-6 sm:h-6';
    } else if (rankLower.includes('fox 1')) {
      logoUrl = '/images/gallery/optimized/fox1.png';
      size = 'w-5 h-5 sm:w-6 sm:h-6';
    } else if (rankLower.includes('rookie')) {
      logoUrl = '/images/gallery/optimized/Rookie.png';
      size = 'w-5 h-5 sm:w-6 sm:h-6';
    } else if (rankLower.includes('unranked')) {
      logoUrl = '/images/gallery/optimized/unranked.png';
      size = 'w-5 h-5 sm:w-6 sm:h-6';
    } else {
      logoUrl = '/images/gallery/optimized/unranked.png';
      size = 'w-5 h-5 sm:w-6 sm:h-6';
    }
    
    return { logoUrl, size };
  };

  // Get badge class for rank name (same as Football.tsx and RankedLeaderboardSection)
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

  // Get unique cities from past games using City column only
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    pastGames.forEach(game => {
      // Use only the game's city field (from City column in CSV)
      if (game.city && game.city.trim()) {
        cities.add(game.city.trim());
        console.log(`🏙️ Found city: "${game.city}" in game ${game.gameId}`);
      }
    });
    console.log('🏙️ Available cities for filter:', Array.from(cities));
    console.log('🏙️ Total games:', pastGames.length);
    return Array.from(cities).sort();
  }, [pastGames]);

  // Load saved city preference or set random city
  useEffect(() => {
    if (availableCities.length > 0) {
      const savedCity = localStorage.getItem('pastGamesSelectedCity');
      if (savedCity && availableCities.includes(savedCity)) {
        setSelectedCity(savedCity);
      } else if (!selectedCity) {
        // Random city selection for first-time users
        const randomCity = availableCities[Math.floor(Math.random() * availableCities.length)];
        setSelectedCity(randomCity);
        localStorage.setItem('pastGamesSelectedCity', randomCity);
      }
    }
  }, [availableCities, selectedCity]);

  // Filter games based on search and city
  const filteredGames = useMemo(() => {
    let filtered = pastGames;
    
    // Filter by search first - if searching for a player, show games from all cities
    if (searchPlayer.trim()) {
      filtered = filtered.filter(game => 
        game.players.some(player => 
          player.playerUsername.toLowerCase().includes(searchPlayer.toLowerCase())
        )
      );
    } else {
      // Only filter by city if not searching for a player
    if (selectedCity) {
      filtered = filtered.filter(game => {
        const gameCity = game.city?.trim().toLowerCase();
        const selectedCityLower = selectedCity.toLowerCase();
        console.log(`🔍 Filtering: game.city="${game.city}" vs selectedCity="${selectedCity}"`);
        console.log(`🔍 Match: ${gameCity === selectedCityLower}`);
        return gameCity === selectedCityLower;
      });
    }
    }
    
    console.log(`🔍 Filter results: ${filtered.length} games found${searchPlayer.trim() ? ` for player "${searchPlayer}"` : ` for city "${selectedCity}"`}`);
    return filtered;
  }, [pastGames, searchPlayer, selectedCity]);

  // Navigation functions for slider - defined after filteredGames
  const nextSlide = useCallback(() => {
    const maxSlide = Math.ceil(filteredGames.length / gamesPerSlide) - 1;
    setCurrentSlide(prev => prev < maxSlide ? prev + 1 : 0);
  }, [filteredGames.length, gamesPerSlide]);
  
  const prevSlide = useCallback(() => {
    const maxSlide = Math.ceil(filteredGames.length / gamesPerSlide) - 1;
    setCurrentSlide(prev => prev > 0 ? prev - 1 : maxSlide);
  }, [filteredGames.length, gamesPerSlide]);
  
  // Get current slide games
  const getCurrentSlideGames = useCallback(() => {
    const startIndex = currentSlide * gamesPerSlide;
    return filteredGames.slice(startIndex, startIndex + gamesPerSlide);
  }, [currentSlide, filteredGames, gamesPerSlide]);

  // Get suggestions for autocomplete - use all players from Foot_Players sheet (same as Football.tsx)
  const suggestions = useMemo(() => {
    if (!searchPlayer.trim()) return [];
    
    // Use allPlayersFromSheet if available, otherwise fallback to allPlayers from past games
    if (allPlayersFromSheet.length > 0) {
      return allPlayersFromSheet.filter((player: any) =>
        player.username.toLowerCase().includes(searchPlayer.toLowerCase())
      ).slice(0, 8);
    } else {
      // Fallback to string array from past games
      return allPlayers.filter((player: string) =>
      player.toLowerCase().includes(searchPlayer.toLowerCase())
    ).slice(0, 8);
    }
  }, [allPlayersFromSheet, allPlayers, searchPlayer]);

  // Get games to display (using slider logic)
  const displayedGames = filteredGames;

  // Helper function for search suggestions (same as Football.tsx)
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

  const handlePlayerSelect = useCallback((player: string | any) => {
    const username = typeof player === 'string' ? player : player.username;
    setSearchPlayer(username);
    trackEvent('player_search', 'user_action', username);
  }, []);

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
    <section id="past-games" className="py-12 bg-cover bg-center bg-no-repeat w-full" style={{ backgroundImage: 'url(/images/gallery/optimized/t2.jpg)' }}>
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
                      <h2 className="text-lg font-bold text-white leading-none">Matchs Passés</h2>
                      <p className="text-gray-400 text-xs font-medium">Résultats & Statistiques</p>
                    </div>
                  </div>
                  
                  {/* Stats indicator */}
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-400 text-xs font-medium">{pastGames.length} matchs</span>
                  </div>
                </div>
              </div>
            </div>
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

          {/* Search Bar with City Filter */}
          <div className="relative max-w-4xl mx-auto mb-8 px-4 sm:px-0">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              {/* City Filter - Left Side */}
              <div className="relative inline-block" data-dropdown>
                <button
                  onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                  className="group flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-black/50 transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                    <span className="text-xs font-medium">
                      {selectedCity || "Sélectionner une ville"}
                    </span>
                  </div>
                  <svg 
                    className={`w-3 h-3 transition-transform duration-200 flex-shrink-0 ${isCityDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dynamic Width Dropdown Menu */}
                {isCityDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white/95 backdrop-blur-lg border border-white/30 rounded-lg shadow-xl z-50 overflow-hidden min-w-full">
                    <div className="py-1">
                      {/* City Options */}
                      {availableCities.map((city) => (
                        <button
                          key={city}
                          onClick={() => handleCitySelect(city)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-150 whitespace-nowrap ${
                            selectedCity === city ? "bg-blue-50 text-blue-600" : "text-gray-700"
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            selectedCity === city ? "bg-blue-500" : "bg-gray-400"
                          }`}></div>
                          <span className="text-xs font-medium">{city}</span>
                          {selectedCity === city && (
                            <svg className="w-3 h-3 ml-auto text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Search Input - Compact Stacked */}
              <div className="w-full lg:flex-1 relative">
                <div className="group flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-black/50 transition-all duration-200 shadow-md hover:shadow-lg">
                  <div className="flex items-center gap-1.5 flex-1">
                    <div className="w-1.5 h-1.5 bg-gradient-to-r from-green-400 to-blue-400 rounded-full"></div>
              <input
                type="text"
                placeholder="Rechercher un joueur..."
                value={searchPlayer}
                      className="flex-1 bg-transparent text-white placeholder-gray-300 focus:outline-none text-xs font-medium"
                onChange={(e) => {
                  setSearchPlayer(e.target.value);
                }}
              />
                  </div>
                  <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
            </div>
            </div>
          </div>

          {isLoading ? (
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
                      <radialGradient id="dialBgPastGames" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="#0f0f0f" />
                        <stop offset="100%" stopColor="#0b0b0b" />
                      </radialGradient>
                    </defs>
                    <circle cx="82" cy="88" r="64" fill="url(#dialBgPastGames)" stroke="#1f2937" strokeWidth="2" />
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
                <p className="text-white">Chargement...</p>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 px-2 md:px-0">
                {getCurrentSlideGames().map((game) => (
                <div
                  key={`${game.gameId}_${game.date}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border border-gray-200 overflow-hidden cursor-pointer group"
                  onClick={() => handleGameClick(game)}
                >
                  {/* Ultra Compact Header */}
                  <div className="bg-slate-800 px-2 py-1.5 border-b border-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs min-w-[32px] max-w-[32px] flex-shrink-0">
                          {game.gameId}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-white text-xs truncate">{getDayNameInFrench(game.date)}</h3>
                          <p className="text-slate-400 text-xs truncate">{game.terrain || game.city || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-slate-400 text-xs">MVP</div>
                        <div className="font-bold text-xs text-white break-words">{game.mvpPlayer?.playerUsername || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Content */}
                  <div className="p-2 md:p-3">
                    {/* Teams with Stats */}
                    <div className="mb-2 md:mb-3">
                      <div className="space-y-0 md:space-y-1">
                        {Object.entries(game.teams)
                          .filter(([teamName]) => teamName.toLowerCase() !== 'none' && teamName.trim() !== '')
                          .sort(([,a], [,b]) => b.totalGoals - a.totalGoals)
                          .map(([teamName, teamData], index) => {
                            const teamPlayers = game.players.filter(p => p.team.toLowerCase() === teamName.toLowerCase());
                            
                            // Get team color based on team name
                            const getTeamTextColor = (teamName: string) => {
                              const name = teamName.toLowerCase();
                              if (name.includes('orange')) return 'text-orange-600';
                              if (name.includes('blue') || name.includes('bleu')) return 'text-blue-600';
                              if (name.includes('red') || name.includes('rouge')) return 'text-red-600';
                              if (name.includes('green') || name.includes('vert')) return 'text-green-600';
                              if (name.includes('yellow') || name.includes('jaune')) return 'text-yellow-600';
                              if (name.includes('purple') || name.includes('violet')) return 'text-purple-600';
                              if (name.includes('pink') || name.includes('rose')) return 'text-pink-600';
                              if (name.includes('indigo')) return 'text-indigo-600';
                              if (name.includes('cyan')) return 'text-cyan-600';
                              if (name.includes('lime')) return 'text-lime-600';
                              if (name.includes('emerald') || name.includes('emeraude')) return 'text-emerald-600';
                              if (name.includes('teal')) return 'text-teal-600';
                              if (name.includes('sky') || name.includes('ciel')) return 'text-sky-600';
                              if (name.includes('violet')) return 'text-violet-600';
                              if (name.includes('fuchsia')) return 'text-fuchsia-600';
                              if (name.includes('rose')) return 'text-rose-600';
                              if (name.includes('amber')) return 'text-amber-600';
                              if (name.includes('lime')) return 'text-lime-600';
                              if (name.includes('stone')) return 'text-stone-600';
                              if (name.includes('zinc')) return 'text-zinc-600';
                              if (name.includes('neutral')) return 'text-neutral-600';
                              if (name.includes('slate')) return 'text-slate-600';
                              return 'text-gray-600'; // Default fallback
                            };
                            
                            // Calculate team stats
                            const firstPlayer = teamPlayers[0];
                            const miniMatch = parseInt(firstPlayer?.teamMiniGame || '0');
                            const wins = parseInt(firstPlayer?.teamWin || '0');
                            const losses = parseInt(firstPlayer?.teamLoss || '0');
                            const cleanSheet = parseInt(firstPlayer?.teamCleanSheet || '0');
                            const goals = parseInt(firstPlayer?.teamGoals || '0');
                            const goalsConceded = parseInt(firstPlayer?.teamGC || '0');
                            const score = parseInt(firstPlayer?.teamScore || '0');
                            
                            return (
                              <div key={teamName} className="py-0.5 md:py-1.5 px-1 md:px-2 bg-slate-50 rounded text-xs">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className={`w-3 h-3 rounded-full flex items-center justify-center font-bold text-xs ${
                                    index === 0 ? 'bg-yellow-500 text-yellow-900' :
                                    index === 1 ? 'bg-gray-400 text-gray-900' :
                                    index === 2 ? 'bg-amber-600 text-amber-900' :
                                    'bg-gray-300 text-gray-700'
                                  }`}>
                                    {index + 1}
                                  </div>
                                    <div className="flex items-center gap-1">
                                      <span className={`font-bold text-xs ${getTeamTextColor(teamName)}`}>Équipe {teamName} ({teamPlayers.length})</span>
                                    <span className="text-slate-400 text-xs">|</span>
                                    <span className="text-slate-500 text-xs">MiniMatch</span>
                                    <span className="font-bold text-slate-900 text-xs">{miniMatch}</span>
                                    <span className="text-slate-400 text-xs">|</span>
                                    <span className="text-slate-500 text-xs">Score</span>
                                    <span className="font-bold text-orange-600 text-xs">{score}</span>
                                        </div>
                                        </div>
                                {/* Mobile: Compact single line layout */}
                                <div className="block md:hidden">
                                  <div className="flex items-center text-xs gap-1 flex-wrap">
                                    <div className="flex items-center gap-0.5">
                                      <span className="text-slate-500">Win</span>
                                      <span className="font-bold text-green-600">{wins}</span>
                                    </div>
                                    <span className="text-slate-500">-</span>
                                    <div className="flex items-center gap-0.5">
                                      <span className="text-slate-500">Goal</span>
                                      <span className="font-bold text-blue-600">{goals}</span>
                                      </div>
                                    <span className="text-slate-500">-</span>
                                    <div className="flex items-center gap-0.5">
                                      <span className="text-slate-500">GoalConceded</span>
                                      <span className="font-bold text-red-600">{goalsConceded}</span>
                                    </div>
                                    <span className="text-slate-500">-</span>
                                    <div className="flex items-center gap-0.5">
                                      <span className="text-slate-500">CleanSheet</span>
                                      <span className="font-bold text-purple-600">{cleanSheet}</span>
                                    </div>
                                  </div>
                                </div>
                                {/* Desktop: Compact single line layout */}
                                <div className="hidden md:flex items-center text-xs gap-1 flex-wrap">
                                  <div className="flex items-center gap-0.5">
                                    <span className="text-slate-500">Win:</span>
                                    <span className="font-bold text-green-600">{wins}</span>
                                  </div>
                                  <span className="text-slate-500">-</span>
                                  <div className="flex items-center gap-0.5">
                                    <span className="text-slate-500">Goal:</span>
                                    <span className="font-bold text-blue-600">{goals}</span>
                                  </div>
                                  <span className="text-slate-500">-</span>
                                  <div className="flex items-center gap-0.5">
                                    <span className="text-slate-500">GoalConceded:</span>
                                    <span className="font-bold text-red-600">{goalsConceded}</span>
                                  </div>
                                  <span className="text-slate-500">-</span>
                                  <div className="flex items-center gap-0.5">
                                    <span className="text-slate-500">CleanSheet:</span>
                                    <span className="font-bold text-purple-600">{cleanSheet}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Clickable Indicator */}
                    <div className="flex items-center justify-center">
                      <div className="inline-flex items-center gap-1 text-slate-400 text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span>Cliquer pour voir les détails</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>

              {/* Slider Navigation */}
              {filteredGames.length > gamesPerSlide && (
                <div className="flex items-center justify-center gap-6 mt-8">
                  {/* Previous Button */}
                  <button
                    onClick={prevSlide}
                    className="group relative flex items-center justify-center w-10 h-10 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <svg className="relative w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {/* Slide Indicator */}
                  <div className="flex items-center gap-3">
                    {/* Dots - Hidden on mobile, visible on desktop */}
                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: Math.ceil(filteredGames.length / gamesPerSlide) }, (_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentSlide 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 scale-125' 
                              : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                    {/* Page indicator - Always visible */}
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {currentSlide + 1} / {Math.ceil(filteredGames.length / gamesPerSlide)}
                    </span>
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={nextSlide}
                    className="group relative flex items-center justify-center w-10 h-10 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <svg className="relative w-4 h-4 transform group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </RevealAnimation>

        {/* Stats Modal - Modern Compact Pro Design */}
        <Dialog open={isStatsModalOpen} onOpenChange={setIsStatsModalOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-none shadow-2xl rounded-xl sm:rounded-2xl scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500 scrollbar-thumb-rounded-full scrollbar-track-rounded-full [&>button]:text-white [&>button]:hover:text-gray-300 [&>button]:hover:bg-gray-700/50">
            <DialogHeader className="pb-2">
              {/* Match Title */}
              <div className="text-center mb-3">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Match {selectedGame?.gameId}
                </h2>
                <p className="text-gray-300 text-xs">
                  {selectedGame?.date && new Date(selectedGame.date).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </p>
              </div>

              {/* Match Info - Compact Single Row */}
              <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  {/* Left: Match Info */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <FiMapPin className="w-4 h-4 text-blue-400" />
                      <span className="text-white text-xs font-medium">{selectedGame?.city || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <TbBuildingStadium className="w-4 h-4 text-orange-400" />
                      <span className="text-white text-xs font-medium truncate">{selectedGame?.terrain || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <FiTarget className="w-4 h-4 text-purple-400" />
                      <span className="text-white text-xs font-medium">{selectedGame?.mode || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <FiUsers className="w-4 h-4 text-green-400" />
                      <span className="text-white text-xs font-medium">{selectedGame?.totalPlayers || 0} Joueurs</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <FiTarget className="w-4 h-4 text-red-400" />
                      <span className="text-white text-xs font-medium">{selectedGame?.totalGoals || 0} Goal{selectedGame?.totalGoals !== 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <FiUsers className="w-4 h-4 text-yellow-400" />
                      <span className="text-white text-xs font-medium">{Object.keys(selectedGame?.teams || {}).length} Équipes</span>
                    </div>
                  </div>
                  
                  {/* Right: MVP Badge */}
                  <div className="px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 bg-yellow-600 text-white">
                    MVP: {selectedGame?.mvpPlayer?.playerUsername || 'N/A'}
                  </div>
                </div>
              </div>
            </DialogHeader>
            
            {selectedGame && (
              <div className="space-y-4">

                {/* Captain Information */}
                {selectedGame.captain && (
                  <div 
                    className="bg-gradient-to-r from-red-900 to-red-950 rounded-lg p-2 border border-red-800 cursor-pointer hover:from-red-950 hover:to-black transition-colors"
                    onClick={() => {
                      setSelectedCaptain(selectedGame.captain!);
                      setIsCaptainDashboardOpen(true);
                      trackEvent('captain_dashboard_opened', selectedGame.captain || '');
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-800 rounded-full flex items-center justify-center border border-red-700">
                        <span className="text-white font-bold text-xs">C</span>
                      </div>
                      <div className="text-red-200 text-xs">Capitaine:</div>
                      <div className="text-white font-bold text-xs">
                        {selectedGame.captain}
                      </div>
                    </div>
                  </div>
                )}

                {/* Team Statistics - Matching Past Game Card Design */}
                {selectedGame.teams && Object.keys(selectedGame.teams).length > 0 && (
                  <div className="bg-gray-800/50 rounded-lg p-2 sm:p-2.5 border border-gray-700/30">
                    <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
                      <div className="w-0.5 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                      <h3 className="font-bold text-xs sm:text-sm text-white">Statistiques des Équipes</h3>
                    </div>
                    <div className="space-y-1.5">
                      {Object.entries(selectedGame.teams)
                        .filter(([teamName]) => teamName.toLowerCase() !== 'none' && teamName.trim() !== '')
                        .sort(([,a], [,b]) => b.totalGoals - a.totalGoals)
                        .map(([teamName, team], index) => {
                          // Get team stats from first player in team (all players on same team have same team stats)
                          const firstPlayer = team.players[0];
                          const miniMatch = parseInt(firstPlayer?.teamMiniGame || '0') || 0;
                          const wins = parseInt(firstPlayer?.teamWin || '0') || 0;
                          const losses = parseInt(firstPlayer?.teamLoss || '0') || 0;
                          const cleanSheet = parseInt(firstPlayer?.teamCleanSheet || '0') || 0;
                          const goals = parseInt(firstPlayer?.teamGoals || '0') || 0;
                          const goalsConceded = parseInt(firstPlayer?.teamGC || '0') || 0;
                          // Get score from TeamScoreScaled (Column Q from Foot_Team sheet) - same logic as past game card
                          const score = parseInt(firstPlayer?.teamScore || '0');
                          
                          // Get team color based on team name (same logic as card)
                          const getTeamTextColor = (teamName: string) => {
                            const name = teamName.toLowerCase();
                            if (name.includes('orange')) return 'text-orange-500';
                            if (name.includes('blue') || name.includes('bleu')) return 'text-blue-500';
                            if (name.includes('red') || name.includes('rouge')) return 'text-red-500';
                            if (name.includes('green') || name.includes('vert')) return 'text-green-500';
                            if (name.includes('yellow') || name.includes('jaune')) return 'text-yellow-500';
                            if (name.includes('purple') || name.includes('violet')) return 'text-purple-500';
                            if (name.includes('pink') || name.includes('rose')) return 'text-pink-500';
                            return 'text-gray-300';
                          };
                          
                          return (
                            <div 
                              key={teamName}
                              className="bg-gray-700/40 rounded-md px-2 py-1.5 sm:px-2.5 sm:py-2 border border-gray-600/30 hover:bg-gray-700/60 transition-colors"
                            >
                              {/* Header Row - Rank, Team Name, MiniMatch, Score */}
                              <div className="flex items-start sm:items-center gap-1.5 sm:gap-2 mb-1.5">
                                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs flex-shrink-0 mt-0.5 sm:mt-0 ${
                                  index === 0 ? 'bg-yellow-500 text-yellow-900' :
                                  index === 1 ? 'bg-gray-400 text-gray-900' :
                                  index === 2 ? 'bg-amber-600 text-amber-900' :
                                  'bg-gray-500 text-gray-900'
                                }`}>
                                  {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  {/* Mobile: Stack team name and stats */}
                                  <div className="block sm:hidden">
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className={`font-bold text-[11px] ${getTeamTextColor(teamName)} truncate`}>
                                        Équipe {teamName}
                                      </span>
                                      <span className="text-gray-500 text-[10px]">({team.totalPlayers})</span>
                                    </div>
                                    <div className="flex items-center gap-1 flex-wrap text-[10px]">
                                      <span className="text-gray-400">MiniMatch:</span>
                                      <span className="font-bold text-gray-200">{miniMatch}</span>
                                      <span className="text-gray-600 mx-0.5">|</span>
                                      <span className="text-gray-400">Score:</span>
                                      <span className="font-bold text-orange-400">{score}</span>
                                    </div>
                                  </div>
                                  {/* Desktop: Single line */}
                                  <div className="hidden sm:flex items-center gap-1.5 flex-1 min-w-0">
                                    <span className={`font-bold text-xs ${getTeamTextColor(teamName)}`}>
                                      Équipe {teamName}
                                    </span>
                                    <span className="text-gray-500 text-xs">({team.totalPlayers})</span>
                                    <span className="text-gray-600 text-xs">|</span>
                                    <span className="text-gray-400 text-xs">MiniMatch</span>
                                    <span className="font-bold text-gray-200 text-xs">{miniMatch}</span>
                                    <span className="text-gray-600 text-xs">|</span>
                                    <span className="text-gray-400 text-xs">Score</span>
                                    <span className="font-bold text-orange-400 text-xs">{score}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Stats Row - Win, Goal, GoalConceded, CleanSheet */}
                              <div className="flex items-center text-[10px] sm:text-xs gap-1 sm:gap-1.5 flex-wrap pl-[26px] sm:pl-7">
                                <div className="flex items-center gap-0.5 sm:gap-1">
                                  <span className="text-gray-400">Win:</span>
                                  <span className="font-bold text-green-400">{wins}</span>
                                </div>
                                <span className="text-gray-600">-</span>
                                <div className="flex items-center gap-0.5 sm:gap-1">
                                  <span className="text-gray-400">Goal:</span>
                                  <span className="font-bold text-blue-400">{goals}</span>
                                </div>
                                <span className="text-gray-600">-</span>
                                <div className="flex items-center gap-0.5 sm:gap-1">
                                  <span className="text-gray-400">GoalConceded:</span>
                                  <span className="font-bold text-red-400">{goalsConceded}</span>
                                </div>
                                <span className="text-gray-600">-</span>
                                <div className="flex items-center gap-0.5 sm:gap-1">
                                  <span className="text-gray-400">CleanSheet:</span>
                                  <span className="font-bold text-purple-400">{cleanSheet}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Player Statistics - Ultra Compact Table */}
                <div>
                  <div className="bg-gray-800 rounded-lg p-2">
                    <h3 className="font-bold text-sm text-white mb-1.5">Statistiques des Joueurs</h3>
                  
                    {/* Desktop Table - Ultra Compact Pro Design */}
                  <div className="hidden md:block">
                      <div className="bg-gray-700 rounded-lg overflow-hidden">
                      <table className="w-full">
                          <thead className="bg-gray-600">
                            <tr>
                              <th className="px-1.5 py-0.5 text-left text-xs font-bold text-gray-200">#</th>
                              <th className="px-1.5 py-0.5 text-left text-xs font-bold text-gray-200">Joueur</th>
                              <th className="px-1.5 py-0.5 text-center text-xs font-bold text-gray-200">Num</th>
                              <th className="px-1.5 py-0.5 text-center text-xs font-bold text-gray-200">Équipe</th>
                              <th className="px-1.5 py-0.5 text-center text-xs font-bold text-gray-200">Score</th>
                              <th className="px-1.5 py-0.5 text-center text-xs font-bold text-gray-200">Goal</th>
                              <th className="px-1.5 py-0.5 text-center text-xs font-bold text-gray-200">Assists</th>
                              <th className="px-1.5 py-0.5 text-center text-xs font-bold text-gray-200">Points</th>
                              <th className="px-1.5 py-0.5 text-center text-xs font-bold text-gray-200">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedGame.players
                            .sort((a, b) => {
                              // Helper function to get score (prefer matchScoreAdjusted, fallback to matchTotalScore)
                              const getScore = (player: PastGamePlayer): number => {
                                const scoreStr = player.matchScoreAdjusted || player.matchTotalScore || '';
                                if (scoreStr && scoreStr.trim() !== '') {
                                  const parsed = parseFloat(scoreStr.replace(',', '.'));
                                  return isNaN(parsed) ? 0 : parsed;
                                }
                                return 0;
                              };
                              
                              const scoreA = getScore(a);
                              const scoreB = getScore(b);
                              
                              // Sort by score (descending)
                              if (scoreA !== scoreB) {
                                return scoreB - scoreA;
                              }
                              
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
                              className={`border-b border-gray-600 hover:bg-gray-600 transition-colors ${
                                player.mvp === '1' ? 'bg-gradient-to-r from-yellow-900/20 to-amber-900/20' :
                                index <= 2 ? 'bg-gradient-to-r from-yellow-900/10 to-orange-900/10' : ''
                              }`}
                            >
                              <td className="px-1.5 py-1">
                                <div className="flex items-center gap-1">
                                  {index === 0 ? <FiAward className="text-yellow-400 w-2.5 h-2.5" /> :
                                   index === 1 ? <FiAward className="text-gray-400 w-2.5 h-2.5" /> :
                                   index === 2 ? <FiAward className="text-amber-500 w-2.5 h-2.5" /> :
                                   <span className="w-2.5 h-2.5"></span>}
                                  <span className="font-bold text-xs text-white">{index + 1}</span>
                                </div>
                              </td>
                              <td className="px-1.5 py-1">
                                <div 
                                  className={`font-semibold text-xs cursor-pointer transition-colors flex items-center gap-1 ${
                                    rayoSupport.get(player.playerUsername) 
                                      ? 'text-yellow-400 hover:text-yellow-300' 
                                      : 'text-white hover:text-blue-400'
                                  }`}
                                  onClick={() => handlePlayerClick(player)}
                                >
                                  {player.playerUsername}
                                  {rayoSupport.get(player.playerUsername) && (
                                    <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-yellow-500 shadow-md shadow-yellow-500/30 flex-shrink-0 flex items-center justify-center">
                                      <svg className="w-2 h-2" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" viewBox="0 0 24 24">
                                        <path d="M12 5v14M5 12h14"/>
                                      </svg>
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-1.5 py-1 text-center">
                                <div className={`w-5 h-5 text-white rounded-full flex items-center justify-center text-xs font-bold mx-auto ${
                                  player.team.toLowerCase() === 'orange' ? 'bg-orange-500' :
                                  player.team.toLowerCase() === 'blue' ? 'bg-blue-500' :
                                  player.team.toLowerCase() === 'jaune' ? 'bg-yellow-500' :
                                  player.team.toLowerCase() === 'red' ? 'bg-red-500' :
                                  player.team.toLowerCase() === 'green' ? 'bg-green-500' :
                                  'bg-gray-500'
                                }`}>
                                  {player.number || '?'}
                                </div>
                              </td>
                              <td className="px-1.5 py-1 text-center">
                                <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                                  player.team.toLowerCase() === 'orange' ? 'bg-orange-500 text-orange-100' :
                                  player.team.toLowerCase() === 'blue' ? 'bg-blue-500 text-blue-100' :
                                  player.team.toLowerCase() === 'jaune' ? 'bg-yellow-500 text-white' :
                                  player.team.toLowerCase() === 'red' ? 'bg-red-500 text-red-100' :
                                  player.team.toLowerCase() === 'green' ? 'bg-green-500 text-green-100' :
                                  'bg-gray-500 text-gray-100'
                                }`}>
                                  {player.team}
                                </span>
                              </td>
                              <td className="px-1.5 py-1 text-center">
                                <span className="font-bold text-sm text-blue-400">
                                  {(() => {
                                    const scoreStr = player.matchScoreAdjusted || player.matchTotalScore || '';
                                    if (scoreStr && scoreStr.trim() !== '') {
                                      return parseFloat(scoreStr.replace(',', '.')).toFixed(1);
                                    }
                                    return '-';
                                  })()}
                                </span>
                              </td>
                              <td className="px-1.5 py-1 text-center">
                                <span className="font-bold text-xs text-green-400">{player.goal || '0'}</span>
                              </td>
                              <td className="px-1.5 py-1 text-center">
                                <span className="font-bold text-xs text-purple-400">{player.assist || '0'}</span>
                              </td>
                              <td className="px-1.5 py-1 text-center">
                                {(() => {
                                  if (!player.points || player.points.trim() === '') {
                                    return <span className="font-bold text-xs text-gray-400">-</span>;
                                  }
                                  const pointsValue = parseFloat(player.points.replace(',', '.'));
                                  const isPositive = pointsValue > 0;
                                  return (
                                    <span className={`font-bold text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                      {isPositive ? '+' : ''}{pointsValue.toFixed(0)}
                                </span>
                                  );
                                })()}
                              </td>
                              <td className="px-1.5 py-1 text-center">
                                <div className="flex justify-center gap-0.5">
                                  {player.mvp === '1' && (
                                    <span className="bg-yellow-500 text-yellow-900 px-0.5 py-0.5 rounded text-xs font-bold">
                                      MVP
                                    </span>
                                  )}
                                  {player.hattrick === '1' && (
                                    <span className="bg-green-500 text-green-900 px-0.5 py-0.5 rounded text-xs font-bold">
                                      H
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

                    {/* Mobile List - Compact Row Design */}
                  <div className="md:hidden space-y-1">
                    {selectedGame.players
                      .sort((a, b) => {
                        // Helper function to get score (prefer matchScoreAdjusted, fallback to matchTotalScore)
                        const getScore = (player: PastGamePlayer): number => {
                          const scoreStr = player.matchScoreAdjusted || player.matchTotalScore || '';
                          if (scoreStr && scoreStr.trim() !== '') {
                            const parsed = parseFloat(scoreStr.replace(',', '.'));
                            return isNaN(parsed) ? 0 : parsed;
                          }
                          return 0;
                        };
                        
                        const scoreA = getScore(a);
                        const scoreB = getScore(b);
                        
                        // Sort by score (descending)
                        if (scoreA !== scoreB) {
                          return scoreB - scoreA;
                        }
                        
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
                        className={`flex items-center justify-between p-1.5 rounded border-l-2 transition-all duration-200 ${
                          player.mvp === '1' 
                              ? 'border-l-yellow-500 bg-gradient-to-r from-yellow-900/20 to-amber-900/20' 
                            : index <= 2 
                              ? 'border-l-yellow-400 bg-gradient-to-r from-yellow-900/10 to-orange-900/10' 
                              : 'border-l-blue-500 bg-gray-800'
                        }`}
                      >
                        {/* Left: Rank + Jersey + Name + Score + Status */}
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-xs text-white">#{index + 1}</span>
                            <span 
                              className={`font-semibold text-xs cursor-pointer transition-colors truncate flex items-center gap-0.5 ${
                                rayoSupport.get(player.playerUsername) 
                                  ? 'text-yellow-400 hover:text-yellow-300' 
                                  : 'text-white hover:text-blue-400'
                              }`}
                              onClick={() => handlePlayerClick(player)}
                            >
                              {player.playerUsername}
                              {rayoSupport.get(player.playerUsername) && (
                                <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-yellow-500 shadow-md shadow-yellow-500/30 flex-shrink-0 flex items-center justify-center">
                                  <svg className="w-2 h-2" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" viewBox="0 0 24 24">
                                    <path d="M12 5v14M5 12h14"/>
                                  </svg>
                            </span>
                              )}
                            </span>
                            <div className={`w-4 h-4 text-white rounded-full flex items-center justify-center text-xs font-bold ${
                              player.team.toLowerCase() === 'orange' ? 'bg-orange-500' :
                              player.team.toLowerCase() === 'blue' ? 'bg-blue-500' :
                              player.team.toLowerCase() === 'jaune' ? 'bg-yellow-500' :
                              player.team.toLowerCase() === 'red' ? 'bg-red-500' :
                              player.team.toLowerCase() === 'green' ? 'bg-green-500' :
                              'bg-gray-500'
                            }`}>
                              {player.number || '?'}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            <span className="text-xs text-gray-400">Score:</span>
                            <div className="font-bold text-xs text-blue-400">
                              {(() => {
                                const scoreStr = player.matchScoreAdjusted || player.matchTotalScore || '';
                                if (scoreStr && scoreStr.trim() !== '') {
                                  return parseFloat(scoreStr.replace(',', '.')).toFixed(1);
                                }
                                return '-';
                              })()}
                            </div>
                            {player.mvp === '1' && (
                              <span className="text-xs text-yellow-400 font-bold">
                                MVP
                              </span>
                            )}
                            {player.hattrick === '1' && (
                              <span className="text-xs text-green-400 font-bold">
                                H
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Stats */}
                        <div className="flex items-center gap-2 text-center flex-shrink-0">
                          <div className="text-center min-w-0">
                            <div className="font-bold text-xs text-green-400">{player.goal || '0'}</div>
                            <div className="text-xs text-gray-400">GOAL</div>
                          </div>
                          <div className="text-center min-w-0">
                            <div className="font-bold text-xs text-purple-400">{player.assist || '0'}</div>
                            <div className="text-xs text-gray-400">ASSIST</div>
                          </div>
                          <div className="text-center min-w-0">
                            {(() => {
                              if (!player.points || player.points.trim() === '') {
                                return (
                                  <>
                                    <div className="font-bold text-xs text-gray-400">-</div>
                                    <div className="text-xs text-gray-400">POINTS</div>
                                  </>
                                );
                              }
                              const pointsValue = parseFloat(player.points.replace(',', '.'));
                              const isPositive = pointsValue > 0;
                              return (
                                <>
                                  <div className={`font-bold text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                    {isPositive ? '+' : ''}{pointsValue.toFixed(0)}
                            </div>
                                  <div className="text-xs text-gray-400">POINTS</div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Professional Player Analytics Dashboard */}
        <Dialog open={isPlayerAnalyticsOpen} onOpenChange={(open) => {
          setIsPlayerAnalyticsOpen(open);
          if (!open) {
            setSelectedPlayer(null);
            if (onPlayerModalClose) {
              onPlayerModalClose();
            }
          }
        }}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto overflow-x-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-none shadow-2xl rounded-xl sm:rounded-2xl scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500 scrollbar-thumb-rounded-full scrollbar-track-rounded-full [&>button]:text-white [&>button]:hover:text-gray-300 [&>button]:hover:bg-gray-700/50 [&>button]:absolute [&>button]:top-2 [&>button]:right-2 [&>button]:z-10">
            
            {selectedPlayer && (() => {
              // Calculate all advanced KPIs
              const playerGames = pastGames.filter(game => 
                game.players.some(p => p.playerUsername === selectedPlayer.playerUsername)
              );
              
              const playerStats = playerGames.map(game => {
                const player = game.players.find(p => p.playerUsername === selectedPlayer.playerUsername);
                return {
                  gameId: game.gameId,
                  date: game.date,
                  mode: game.mode || '',
                  team: player?.team || '',
                  number: player?.number || '',
                  score: (() => {
                    const scoreStr = player?.matchScoreAdjusted || player?.matchTotalScore || '';
                    return scoreStr ? parseFloat(scoreStr.replace(',', '.')) : 0;
                  })(),
                  points: (() => {
                    const pointsStr = player?.points || '';
                    return pointsStr ? parseFloat(pointsStr.replace(',', '.')) : 0;
                  })(),
                  goals: parseInt(player?.goal || '0'),
                  assists: parseInt(player?.assist || '0'),
                  attack: player?.att ? parseFloat(player.att.replace(',', '.')) : 0,
                  defense: player?.def ? parseFloat(player.def.replace(',', '.')) : 0,
                  mvp: player?.mvp === '1',
                  hattrick: player?.hattrick === '1',
                  ownGoal: parseInt(player?.ownGoal || '0'),
                  interception: parseInt(player?.interception || '0'),
                  teamWin: parseInt(player?.teamWin || '0'),
                  teamLoss: parseInt(player?.teamLoss || '0'),
                  teamCleanSheet: parseInt(player?.teamCleanSheet || '0'),
                  teamMiniGame: parseInt(player?.teamMiniGame || '0'),
                  teamGoals: parseInt(player?.teamGoals || '0'),
                  teamGC: parseInt(player?.teamGC || '0'),
                  teamScore: parseInt(player?.teamScore || '0')
                };
              }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

              // Advanced KPI Calculations
              const totalMatches = playerStats.length;
              const totalGoals = playerStats.reduce((sum, stat) => sum + stat.goals, 0);
              const totalAssists = playerStats.reduce((sum, stat) => sum + stat.assists, 0);
              const totalScore = playerStats.reduce((sum, stat) => sum + stat.score, 0);
              const avgScore = totalMatches > 0 ? totalScore / totalMatches : 0;
              const goalsPerMatch = totalMatches > 0 ? totalGoals / totalMatches : 0;
              const assistsPerMatch = totalMatches > 0 ? totalAssists / totalMatches : 0;
              const mvpCount = playerStats.filter(stat => stat.mvp).length;
              const mvpRate = totalMatches > 0 ? (mvpCount / totalMatches) * 100 : 0;
              const hattrickCount = playerStats.filter(stat => stat.hattrick).length;
              const totalOwnGoals = playerStats.reduce((sum, stat) => sum + stat.ownGoal, 0);
              const totalInterceptions = playerStats.reduce((sum, stat) => sum + stat.interception, 0);
              const avgAttack = playerStats.reduce((sum, stat) => sum + stat.attack, 0) / totalMatches;
              const avgDefense = playerStats.reduce((sum, stat) => sum + stat.defense, 0) / totalMatches;
              const bestScore = Math.max(...playerStats.map(stat => stat.score));
              const worstScore = Math.min(...playerStats.map(stat => stat.score));
              const scoreConsistency = totalMatches > 0 ? (1 - (Math.max(...playerStats.map(stat => stat.score)) - Math.min(...playerStats.map(stat => stat.score))) / 10) * 100 : 0;
              
              // Team Performance
              // Team Win comes from Foot_Players sheet column AD "Team Win"
              const teamWinFromSheet = teamWins.get(selectedPlayer?.playerUsername || '') || 0;
              // Team Loss comes from Foot_Players sheet column AH "Team Loss"
              const teamLossFromSheet = teamLosses.get(selectedPlayer?.playerUsername || '') || 0;
              const teamWinRate = (teamWinFromSheet + teamLossFromSheet) > 0 ? (teamWinFromSheet / (teamWinFromSheet + teamLossFromSheet)) * 100 : 0;
              // Team Clean Sheet comes from Foot_Players sheet column AG "TeamCS"
              const teamCleanSheetsFromSheet = teamCleanSheets.get(selectedPlayer?.playerUsername || '') || 0;
              const teamGoalsFor = playerStats.reduce((sum, stat) => sum + stat.teamGoals, 0);
              const teamGoalsAgainst = playerStats.reduce((sum, stat) => sum + stat.teamGC, 0);
              const teamGoalDifference = teamGoalsFor - teamGoalsAgainst;
              
              // Team Averages
              const winAvg = totalMatches > 0 ? teamWinFromSheet / totalMatches : 0;
              const lossesAvg = totalMatches > 0 ? teamLossFromSheet / totalMatches : 0;
              const goalsAvg = totalMatches > 0 ? teamGoalsFor / totalMatches : 0;
              const goalConcededAvg = totalMatches > 0 ? teamGoalsAgainst / totalMatches : 0;
              const cleanSheetAvg = totalMatches > 0 ? teamCleanSheetsFromSheet / totalMatches : 0;
              
              // Performance Trends (Last 5 games)
              const recentGames = playerStats.slice(-5);
              const recentGoals = recentGames.reduce((sum, stat) => sum + stat.goals, 0);
              const recentAssists = recentGames.reduce((sum, stat) => sum + stat.assists, 0);
              const recentAvgScore = recentGames.length > 0 ? recentGames.reduce((sum, stat) => sum + stat.score, 0) / recentGames.length : 0;
              
              // Calculate individual rankings compared to all players
              const allPlayers = pastGames.flatMap(game => game.players);
              const uniquePlayers = allPlayers.reduce((acc, player) => {
                if (!acc[player.playerUsername]) {
                  acc[player.playerUsername] = {
                    username: player.playerUsername,
                    totalScore: 0,
                    totalPoints: 0,
                    totalGoals: 0,
                    totalAssists: 0,
                    totalMvp: 0,
                    totalMatches: 0,
                    matchCount: 0
                  };
                }
                const scoreStr = player.matchScoreAdjusted || player.matchTotalScore || '';
                acc[player.playerUsername].totalScore += scoreStr ? parseFloat(scoreStr.replace(',', '.')) : 0;
                const pointsStr = player.points || '';
                acc[player.playerUsername].totalPoints += pointsStr ? parseFloat(pointsStr.replace(',', '.')) : 0;
                acc[player.playerUsername].totalGoals += parseInt(player.goal || '0');
                acc[player.playerUsername].totalAssists += parseInt(player.assist || '0');
                acc[player.playerUsername].totalMvp += player.mvp === '1' ? 1 : 0;
                acc[player.playerUsername].totalMatches += 1;
                acc[player.playerUsername].matchCount += 1;
                return acc;
              }, {} as Record<string, any>);

              const playerStatsForRanking = Object.values(uniquePlayers).map((p: any) => ({
                username: p.username,
                totalPoints: p.totalPoints,
                totalGoals: p.totalGoals,
                totalAssists: p.totalAssists,
                totalMvp: p.totalMvp,
                totalMatches: p.totalMatches
              }));

              // Sort and rank players by totals
              const pointsRanking = [...playerStatsForRanking].sort((a, b) => b.totalPoints - a.totalPoints);
              const goalsRanking = [...playerStatsForRanking].sort((a, b) => b.totalGoals - a.totalGoals);
              const assistsRanking = [...playerStatsForRanking].sort((a, b) => b.totalAssists - a.totalAssists);
              const mvpRanking = [...playerStatsForRanking].sort((a, b) => b.totalMvp - a.totalMvp);
              const matchesRanking = [...playerStatsForRanking].sort((a, b) => b.totalMatches - a.totalMatches);

              // Find current player's rankings
              const currentPlayerUsername = selectedPlayer?.playerUsername || '';
              const pointsRank = pointsRanking.findIndex(p => p.username === currentPlayerUsername) + 1;
              const goalsRank = goalsRanking.findIndex(p => p.username === currentPlayerUsername) + 1;
              const assistsRank = assistsRanking.findIndex(p => p.username === currentPlayerUsername) + 1;
              const mvpRank = mvpRanking.findIndex(p => p.username === currentPlayerUsername) + 1;
              const matchesRank = matchesRanking.findIndex(p => p.username === currentPlayerUsername) + 1;
              
              // Performance Progression
              const firstHalf = playerStats.slice(0, Math.ceil(playerStats.length / 2));
              const secondHalf = playerStats.slice(Math.ceil(playerStats.length / 2));
              const firstHalfAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, stat) => sum + stat.score, 0) / firstHalf.length : 0;
              const secondHalfAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, stat) => sum + stat.score, 0) / secondHalf.length : 0;
              const improvement = secondHalfAvg - firstHalfAvg;
              
              return (
                <div className="space-y-2 sm:space-y-3">
                  {/* Player Dashboard Header with Centered Avatar */}
                  <div className="bg-gray-800 rounded-xl sm:rounded-2xl overflow-hidden mb-2 sm:mb-3 border border-gray-700/30 shadow-xl relative">
                    {/* Cover Photo Section - More Compact - Reduced height on mobile */}
                    <div className="relative w-full h-28 sm:h-36 md:h-44 overflow-visible">
                      {/* Cover Image */}
                      <img 
                        src="/images/gallery/optimized/couv.jpg" 
                        alt="Player cover" 
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          // Fallback to gradient if image fails to load
                          const target = e.currentTarget;
                          target.style.display = 'none';
                        }}
                      />
                      {/* Gradient overlay - subtle tint based on score */}
                      <div className={`absolute inset-0 ${
                        avgScore >= 9 ? 'bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-rose-600/20' :
                        avgScore >= 7 ? 'bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-indigo-600/20' :
                        avgScore >= 5 ? 'bg-gradient-to-br from-yellow-500/20 via-amber-600/20 to-orange-600/20' :
                        avgScore >= 3 ? 'bg-gradient-to-br from-gray-400/20 via-slate-500/20 to-gray-600/20' :
                        'bg-gradient-to-br from-amber-600/20 via-orange-500/20 to-red-500/20'
                      }`}></div>
                      {/* Subtle light overlay for depth */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>
                      
                      {/* Avatar - Positioned on the left, centered vertically within cover photo image area, overlapping into info section */}
                    <div className="absolute left-3 sm:left-4 md:left-5 z-[100]" style={{
                        top: '47%',
                        transform: 'translateY(-50%)',
                    }}>
                      <div className="relative">
                        {/* Stars above avatar - like national teams, based on level */}
                        {(() => {
                          // Calculate number of stars based on level: level / 10 (rounded down)
                          // Level 10-19: 1 star, Level 20-29: 2 stars, etc.
                          const username = selectedPlayer?.playerUsername?.trim() || '';
                          const playerLevel = username ? playerLevels.get(username) : null;
                          const levelNumber = playerLevel ? getLevelNumericValue(playerLevel) : 0;
                          const starCount = Math.floor(levelNumber / 10);
                          
                          if (starCount > 0) {
                            return (
                              <div className="absolute -left-0.5 sm:-left-1 md:-left-1 top-1/2 transform -translate-y-1/2 z-[101] flex flex-col items-center gap-0.5 sm:gap-1">
                                {Array.from({ length: starCount }).map((_, index) => (
                                  <img 
                                    key={index}
                                    src="/images/gallery/optimized/star.png" 
                                    alt="Star" 
                                    className="w-2.5 h-2.5 sm:w-4 sm:h-4 md:w-5 md:h-5 drop-shadow-lg"
                                    loading="lazy"
                                    decoding="async"
                                    width="20"
                                    height="20"
                                  />
                                ))}
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        {/* Simple clean avatar without glowing effects */}
                        {(() => {
                          // Premium, modern avatar using lorelei style - High quality and professional
                          const avatarUrl = `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(selectedPlayer?.playerUsername || 'Player')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,ffcc5c,ff6b9d,4ecdc4,95e1d3,ffa07a,98d8c8,f38181,aa96da,fcbad3,a8e6cf,ffd3a5,fd9853,fc6c85,ffa8b6,ffb3ba`;
                          
                          // Get border color based on score
                          const getBorderColor = (score: number) => {
                            if (score >= 9) return 'border-purple-500';
                            if (score >= 7) return 'border-cyan-500';
                            if (score >= 5) return 'border-yellow-500';
                            if (score >= 3) return 'border-gray-400';
                            return 'border-amber-600';
                          };
                          
                          const borderColor = getBorderColor(avgScore);
                          const borderWidth = avgScore >= 9 ? 'border-3' : avgScore >= 7 ? 'border-3' : avgScore >= 5 ? 'border-2' : 'border-2';
                          
                          return (
                            <div className={`relative w-20 h-24 sm:w-28 sm:h-36 md:w-32 md:h-40 rounded-lg sm:rounded-xl ${borderWidth} ${borderColor} bg-gray-800 p-0.5 sm:p-1 shadow-2xl z-[100]`}>
                              <Avatar className="w-full h-full rounded-lg sm:rounded-xl z-[100]">
                                <AvatarImage 
                                  src={avatarUrl} 
                                  alt={selectedPlayer?.playerUsername || 'Player'}
                                  className="w-full h-full object-cover z-[100] rounded-lg sm:rounded-xl"
                                />
                                <AvatarFallback className={`bg-gradient-to-br ${
                                  avgScore >= 9 ? 'from-purple-600 via-pink-600 to-rose-600' :
                                  avgScore >= 7 ? 'from-cyan-500 via-blue-600 to-indigo-600' :
                                  avgScore >= 5 ? 'from-yellow-500 via-amber-600 to-orange-600' :
                                  avgScore >= 3 ? 'from-gray-400 via-slate-500 to-gray-500' :
                                  'from-amber-600 via-orange-500 to-red-500'
                                } text-xl sm:text-2xl md:text-2xl font-black text-white z-[100] rounded-lg sm:rounded-xl`}>
                                  {(selectedPlayer?.playerUsername || 'Player').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          );
                        })()}
                      </div>
                      </div>
                    </div>
                    
                    {/* Profile Info Section - Below Cover Photo, with avatar overlap - Compact */}
                    <div className="pt-0 sm:pt-2.5 md:pt-3 pb-2 sm:pb-2.5 px-3 sm:px-4 md:px-5 relative z-0 bg-gray-800 overflow-visible">
                      {/* Mobile: Professional layout - Username starts from far left, avatar overlaps from above */}
                      <div className="flex sm:hidden flex-col gap-0.5 pt-1">
                        {/* Username with Position and Rank Badge on the right */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <h2 className={`text-base font-bold truncate ${
                              (() => {
                                const username = selectedPlayer?.playerUsername?.trim() || '';
                                return username && rayoSupport.get(username) ? 'text-yellow-400' : 'text-white';
                              })()
                            }`}>
                              {selectedPlayer?.playerUsername || 'Player'}
                            </h2>
                            {(() => {
                              const username = selectedPlayer?.playerUsername?.trim() || '';
                              return username && rayoSupport.get(username) ? (
                                <span className="w-4 h-4 rounded-full bg-yellow-400 border border-yellow-500 shadow-md shadow-yellow-500/30 flex-shrink-0 flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" viewBox="0 0 24 24">
                                    <path d="M12 5v14M5 12h14"/>
                                  </svg>
                                </span>
                              ) : null;
                            })()}
                            {/* Position from FootPos column - Right after username */}
                            {(() => {
                              const username = selectedPlayer?.playerUsername?.trim() || '';
                              const playerPosition = username ? playerPositions.get(username) : null;
                              
                              return playerPosition ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold whitespace-nowrap bg-gray-700/50 text-gray-200 border border-gray-600/50 flex-shrink-0">
                                  {playerPosition}
                          </span>
                              ) : null;
                            })()}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Rank Logo and Badge */}
                            {(() => {
                              const username = selectedPlayer?.playerUsername?.trim() || '';
                              const playerRankTier = username ? playerRankTiers.get(username) : null;
                              
                              if (!playerRankTier) return null;
                              
                              const { logoUrl, size } = getRankLogoForName(playerRankTier);
                              
                              return (
                                <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                                  {/* Rank Logo on the left */}
                                  <img 
                                    src={logoUrl} 
                                    alt={formatRankTierForDisplay(playerRankTier)}
                                    className={`${size} object-contain flex-shrink-0`}
                                    loading="lazy"
                                    decoding="async"
                                  />
                                  {/* Rank Badge on the right */}
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold whitespace-nowrap ${getRankBadgeClass(playerRankTier)}`}>
                                    {formatRankTierForDisplay(playerRankTier)}
                                  </span>
                          </div>
                              );
                            })()}
                          </div>
                        </div>
                        
                         {/* Player info - Also starts from far left */}
                         <div className="flex flex-col gap-1.5 -mt-0.5">
                           
                           {/* Level Badge and Match Info - Compact row */}
                           <div className="flex flex-wrap items-center gap-1.5">
                             {(() => {
                               const username = selectedPlayer?.playerUsername?.trim() || '';
                               const playerLevel = username ? playerLevels.get(username) : null;
                               
                               return playerLevel ? (
                                 <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap flex-shrink-0 ${getLevelBadgeColor(getLevelNumericValue(playerLevel))}`}>
                                   {playerLevel}
                                 </span>
                               ) : null;
                             })()}
                             <span className="text-[10px] text-gray-400 whitespace-nowrap">{totalMatches} matches</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Desktop: Original layout */}
                      <div className="hidden sm:flex sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-2">
                        {/* Left: Player Name and Info - At far left on desktop */}
                        <div className="flex-1 min-w-0 relative z-0 overflow-hidden">
                           {/* Username with Position and Rank Badge on the right */}
                           <div className="flex items-center gap-2 mb-0.5">
                             <div className="flex items-center gap-1.5 flex-1 min-w-0">
                               <h2 className={`text-base sm:text-lg md:text-xl font-bold truncate ${
                                 (() => {
                                   const username = selectedPlayer?.playerUsername?.trim() || '';
                                   return username && rayoSupport.get(username) ? 'text-yellow-400' : 'text-white';
                                 })()
                               }`}>
                                 {selectedPlayer?.playerUsername || 'Player'}
                               </h2>
                               {(() => {
                                 const username = selectedPlayer?.playerUsername?.trim() || '';
                                 return username && rayoSupport.get(username) ? (
                                   <span className="w-5 h-5 rounded-full bg-yellow-400 border border-yellow-500 shadow-md shadow-yellow-500/30 flex-shrink-0 flex items-center justify-center">
                                     <svg className="w-3 h-3" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" viewBox="0 0 24 24">
                                       <path d="M12 5v14M5 12h14"/>
                                     </svg>
                                   </span>
                                 ) : null;
                               })()}
                               {/* Position from FootPos column - Right after username */}
                               {(() => {
                                 const username = selectedPlayer?.playerUsername?.trim() || '';
                                 const playerPosition = username ? playerPositions.get(username) : null;
                                 
                                 return playerPosition ? (
                                   <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold whitespace-nowrap bg-gray-700/50 text-gray-200 border border-gray-600/50 flex-shrink-0">
                                     {playerPosition}
                                   </span>
                                 ) : null;
                               })()}
                             </div>
                             <div className="flex items-center gap-1.5 flex-shrink-0">
                               {/* Rank Logo and Badge */}
                               {(() => {
                                 const username = selectedPlayer?.playerUsername?.trim() || '';
                                 const playerRankTier = username ? playerRankTiers.get(username) : null;
                                 
                                 if (!playerRankTier) return null;
                                 
                                 const { logoUrl, size } = getRankLogoForName(playerRankTier);
                                 
                                 return (
                                   <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                                     {/* Rank Logo on the left */}
                                     <img 
                                       src={logoUrl} 
                                       alt={formatRankTierForDisplay(playerRankTier)}
                                       className={`${size} object-contain flex-shrink-0`}
                                     />
                                     {/* Rank Badge on the right */}
                                     <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold whitespace-nowrap ${getRankBadgeClass(playerRankTier)}`}>
                                       {formatRankTierForDisplay(playerRankTier)}
                                     </span>
                                   </div>
                                 );
                               })()}
                             </div>
                           </div>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 relative z-0">
                             {(() => {
                               const username = selectedPlayer?.playerUsername?.trim() || '';
                               const playerLevel = username ? playerLevels.get(username) : null;
                               
                               return playerLevel ? (
                                 <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold whitespace-nowrap flex-shrink-0 ${getLevelBadgeColor(getLevelNumericValue(playerLevel))}`}>
                                   {playerLevel}
                            </span>
                               ) : null;
                             })()}
                            <span className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">{totalMatches} matches</span>
                          </div>
                         </div>
                       </div>
                          </div>
                        </div>
                        
                  {/* Enhanced Player Summary - Stats Grid */}
                  <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-2 sm:p-3 mb-2 sm:mb-3 border border-gray-700/30 shadow-xl">
                    {/* Title: Total statistiques */}
                    <h3 className="text-sm sm:text-base font-bold text-white mb-2 sm:mb-3 text-center">Total statistiques</h3>

                    {/* Main Stats Grid - Mobile First */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-2 mb-2">
                      {/* Matches */}
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-gray-700/30">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-500 rounded-full"></div>
                          <span className="text-xs font-semibold text-gray-300">Matches</span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Matches</span>
                            <span className={`text-xs font-medium ${
                              totalMatches >= 20 ? 'text-green-400' :
                              totalMatches >= 10 ? 'text-yellow-400' :
                              totalMatches >= 5 ? 'text-orange-400' : 'text-red-400'
                            }`}>{totalMatches}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Classic5x5</span>
                            <span className={`text-xs font-medium ${
                              (matchesC5.get(selectedPlayer?.playerUsername || '') || 0) >= 10 ? 'text-green-400' :
                              (matchesC5.get(selectedPlayer?.playerUsername || '') || 0) >= 5 ? 'text-yellow-400' :
                              (matchesC5.get(selectedPlayer?.playerUsername || '') || 0) >= 1 ? 'text-orange-400' : 'text-gray-400'
                            }`}>{matchesC5.get(selectedPlayer?.playerUsername || '') || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Classic7x7</span>
                            <span className={`text-xs font-medium ${
                              (matchesC7.get(selectedPlayer?.playerUsername || '') || 0) >= 10 ? 'text-green-400' :
                              (matchesC7.get(selectedPlayer?.playerUsername || '') || 0) >= 5 ? 'text-yellow-400' :
                              (matchesC7.get(selectedPlayer?.playerUsername || '') || 0) >= 1 ? 'text-orange-400' : 'text-gray-400'
                            }`}>{matchesC7.get(selectedPlayer?.playerUsername || '') || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Rush5x5x5</span>
                            <span className={`text-xs font-medium ${
                              (matchesR5.get(selectedPlayer?.playerUsername || '') || 0) >= 10 ? 'text-green-400' :
                              (matchesR5.get(selectedPlayer?.playerUsername || '') || 0) >= 5 ? 'text-yellow-400' :
                              (matchesR5.get(selectedPlayer?.playerUsername || '') || 0) >= 1 ? 'text-orange-400' : 'text-gray-400'
                            }`}>{matchesR5.get(selectedPlayer?.playerUsername || '') || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">MiniRush</span>
                            <span className={`text-xs font-medium ${
                              (miniMatchesR5.get(selectedPlayer?.playerUsername || '') || 0) >= 10 ? 'text-green-400' :
                              (miniMatchesR5.get(selectedPlayer?.playerUsername || '') || 0) >= 5 ? 'text-yellow-400' :
                              (miniMatchesR5.get(selectedPlayer?.playerUsername || '') || 0) >= 1 ? 'text-orange-400' : 'text-gray-400'
                            }`}>{miniMatchesR5.get(selectedPlayer?.playerUsername || '') || 0}</span>
                          </div>
                        </div>
                        </div>

                      {/* Individual Performance */}
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-gray-700/30">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-orange-500 rounded-full"></div>
                          <span className="text-xs font-semibold text-gray-300">Individual</span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Goal</span>
                            <span className={`text-xs font-medium ${
                              totalGoals >= 20 ? 'text-green-400' :
                              totalGoals >= 10 ? 'text-yellow-400' :
                              totalGoals >= 5 ? 'text-orange-400' : 'text-red-400'
                            }`}>{totalGoals}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Assist</span>
                            <span className={`text-xs font-medium ${
                              totalAssists >= 15 ? 'text-green-400' :
                              totalAssists >= 8 ? 'text-yellow-400' :
                              totalAssists >= 3 ? 'text-orange-400' : 'text-red-400'
                            }`}>{totalAssists}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Hattrick</span>
                            <span className={`text-xs font-medium ${
                              hattrickCount >= 3 ? 'text-green-400' :
                              hattrickCount >= 2 ? 'text-yellow-400' :
                              hattrickCount >= 1 ? 'text-orange-400' : 'text-red-400'
                            }`}>{hattrickCount}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">OwnGoal</span>
                            <span className={`text-xs font-medium ${
                              totalOwnGoals >= 3 ? 'text-red-400' :
                              totalOwnGoals >= 2 ? 'text-orange-400' :
                              totalOwnGoals >= 1 ? 'text-yellow-400' : 'text-gray-400'
                            }`}>{totalOwnGoals}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Interception</span>
                            <span className={`text-xs font-medium ${
                              totalInterceptions >= 20 ? 'text-green-400' :
                              totalInterceptions >= 10 ? 'text-yellow-400' :
                              totalInterceptions >= 5 ? 'text-orange-400' : 'text-red-400'
                            }`}>{totalInterceptions}</span>
                          </div>
                        </div>
                      </div>

                      {/* Team Performance */}
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-gray-700/30">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-500 rounded-full"></div>
                          <span className="text-xs font-semibold text-gray-300">Team</span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Win</span>
                            <span className={`text-xs font-medium ${
                              (teamWins.get(selectedPlayer?.playerUsername || '') || 0) >= 10 ? 'text-green-400' :
                              (teamWins.get(selectedPlayer?.playerUsername || '') || 0) >= 5 ? 'text-yellow-400' :
                              (teamWins.get(selectedPlayer?.playerUsername || '') || 0) >= 2 ? 'text-orange-400' : 'text-red-400'
                            }`}>{teamWins.get(selectedPlayer?.playerUsername || '') || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Losses</span>
                            <span className={`text-xs font-medium ${
                              (teamLosses.get(selectedPlayer?.playerUsername || '') || 0) >= 10 ? 'text-red-400' :
                              (teamLosses.get(selectedPlayer?.playerUsername || '') || 0) >= 5 ? 'text-orange-400' :
                              (teamLosses.get(selectedPlayer?.playerUsername || '') || 0) >= 2 ? 'text-yellow-400' : 'text-gray-400'
                            }`}>{teamLosses.get(selectedPlayer?.playerUsername || '') || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Goal</span>
                            <span className={`text-xs font-medium ${
                              teamGoalsFor >= 20 ? 'text-green-400' :
                              teamGoalsFor >= 10 ? 'text-yellow-400' :
                              teamGoalsFor >= 5 ? 'text-orange-400' : 'text-red-400'
                            }`}>{teamGoalsFor}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">GoalConceded</span>
                            <span className={`text-xs font-medium ${
                              teamGoalsAgainst >= 20 ? 'text-red-400' :
                              teamGoalsAgainst >= 10 ? 'text-orange-400' :
                              teamGoalsAgainst >= 5 ? 'text-yellow-400' : 'text-gray-400'
                            }`}>{teamGoalsAgainst}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Clean sheet</span>
                            <span className={`text-xs font-medium ${
                              (teamCleanSheets.get(selectedPlayer?.playerUsername || '') || 0) >= 5 ? 'text-green-400' :
                              (teamCleanSheets.get(selectedPlayer?.playerUsername || '') || 0) >= 3 ? 'text-yellow-400' :
                              (teamCleanSheets.get(selectedPlayer?.playerUsername || '') || 0) >= 1 ? 'text-orange-400' : 'text-red-400'
                            }`}>{teamCleanSheets.get(selectedPlayer?.playerUsername || '') || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Global Skills */}
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-gray-700/30">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full"></div>
                          <span className="text-xs font-semibold text-gray-300">Global</span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">MVP</span>
                            <span className={`text-xs font-medium ${
                              mvpCount >= 10 ? 'text-green-400' :
                              mvpCount >= 5 ? 'text-yellow-400' :
                              mvpCount >= 2 ? 'text-orange-400' : 'text-red-400'
                            }`}>{mvpCount}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Streak</span>
                            <span className={`text-xs font-medium ${
                              (playerStreaks.get(selectedPlayer?.playerUsername || '') || 0) >= 10 ? 'text-purple-400' :
                              (playerStreaks.get(selectedPlayer?.playerUsername || '') || 0) >= 7 ? 'text-pink-400' :
                              (playerStreaks.get(selectedPlayer?.playerUsername || '') || 0) >= 5 ? 'text-red-400' :
                              (playerStreaks.get(selectedPlayer?.playerUsername || '') || 0) >= 3 ? 'text-orange-400' :
                              (playerStreaks.get(selectedPlayer?.playerUsername || '') || 0) >= 1 ? 'text-yellow-400' : 'text-gray-400'
                            }`}>{playerStreaks.get(selectedPlayer?.playerUsername || '') || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">But avg</span>
                            <span className={`text-xs font-medium ${
                              goalsPerMatch >= 1.5 ? 'text-green-400' :
                              goalsPerMatch >= 1.0 ? 'text-yellow-400' :
                              goalsPerMatch >= 0.5 ? 'text-orange-400' : 'text-red-400'
                            }`}>{goalsPerMatch.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Assist avg</span>
                            <span className={`text-xs font-medium ${
                              assistsPerMatch >= 1.0 ? 'text-green-400' :
                              assistsPerMatch >= 0.5 ? 'text-yellow-400' :
                              assistsPerMatch >= 0.2 ? 'text-orange-400' : 'text-red-400'
                            }`}>{assistsPerMatch.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">MVP avg</span>
                            <span className={`text-xs font-medium ${
                              (mvpCount / totalMatches) >= 0.5 ? 'text-green-400' :
                              (mvpCount / totalMatches) >= 0.3 ? 'text-yellow-400' :
                              (mvpCount / totalMatches) >= 0.1 ? 'text-orange-400' : 'text-red-400'
                            }`}>{(totalMatches > 0 ? (mvpCount / totalMatches) : 0).toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Team avg */}
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-gray-700/30">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full"></div>
                          <span className="text-xs font-semibold text-gray-300">Team avg</span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Win avg</span>
                            <span className={`text-xs font-medium ${
                              winAvg >= 0.7 ? 'text-green-400' :
                              winAvg >= 0.5 ? 'text-yellow-400' :
                              winAvg >= 0.3 ? 'text-orange-400' : 'text-red-400'
                            }`}>{winAvg.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Losses avg</span>
                            <span className={`text-xs font-medium ${
                              lossesAvg <= 0.2 ? 'text-green-400' :
                              lossesAvg <= 0.4 ? 'text-yellow-400' :
                              lossesAvg <= 0.6 ? 'text-orange-400' : 'text-red-400'
                            }`}>{lossesAvg.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Goals avg</span>
                            <span className={`text-xs font-medium ${
                              goalsAvg >= 3.0 ? 'text-green-400' :
                              goalsAvg >= 2.0 ? 'text-yellow-400' :
                              goalsAvg >= 1.0 ? 'text-orange-400' : 'text-red-400'
                            }`}>{goalsAvg.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">GoalConceded avg</span>
                            <span className={`text-xs font-medium ${
                              goalConcededAvg <= 1.0 ? 'text-green-400' :
                              goalConcededAvg <= 2.0 ? 'text-yellow-400' :
                              goalConcededAvg <= 3.0 ? 'text-orange-400' : 'text-red-400'
                            }`}>{goalConcededAvg.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Clean sheet avg</span>
                            <span className={`text-xs font-medium ${
                              cleanSheetAvg >= 0.5 ? 'text-green-400' :
                              cleanSheetAvg >= 0.3 ? 'text-yellow-400' :
                              cleanSheetAvg >= 0.1 ? 'text-orange-400' : 'text-red-400'
                            }`}>{cleanSheetAvg.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ranking */}
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-gray-700/30">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-yellow-500 rounded-full"></div>
                          <span className="text-xs font-semibold text-gray-300">Ranking</span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Points</span>
                            <span className={`text-xs font-medium ${
                              pointsRank <= 5 ? 'text-green-400' :
                              pointsRank <= 10 ? 'text-yellow-400' :
                              pointsRank <= 20 ? 'text-orange-400' : 'text-red-400'
                            }`}>#{pointsRank || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Goal</span>
                            <span className={`text-xs font-medium ${
                              goalsRank <= 5 ? 'text-green-400' :
                              goalsRank <= 10 ? 'text-yellow-400' :
                              goalsRank <= 20 ? 'text-orange-400' : 'text-red-400'
                            }`}>#{goalsRank || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Assist</span>
                            <span className={`text-xs font-medium ${
                              assistsRank <= 5 ? 'text-green-400' :
                              assistsRank <= 10 ? 'text-yellow-400' :
                              assistsRank <= 20 ? 'text-orange-400' : 'text-red-400'
                            }`}>#{assistsRank || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">MVP</span>
                            <span className={`text-xs font-medium ${
                              mvpRank <= 5 ? 'text-green-400' :
                              mvpRank <= 10 ? 'text-yellow-400' :
                              mvpRank <= 20 ? 'text-orange-400' : 'text-red-400'
                            }`}>#{mvpRank || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Match</span>
                            <span className={`text-xs font-medium ${
                              matchesRank <= 5 ? 'text-green-400' :
                              matchesRank <= 10 ? 'text-yellow-400' :
                              matchesRank <= 20 ? 'text-orange-400' : 'text-red-400'
                            }`}>#{matchesRank || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current Month Stats Grid */}
                  <div className="bg-gradient-to-br from-blue-900/40 via-indigo-900/40 to-purple-900/40 rounded-xl sm:rounded-2xl p-2 sm:p-3 mb-2 sm:mb-3 border border-blue-700/50 shadow-xl">
                    {(() => {
                      // Filter stats for current month only
                      const now = new Date();
                      const currentMonth = now.getMonth();
                      const currentYear = now.getFullYear();
                      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                      const monthName = months[currentMonth];
                      
                      const currentMonthStats = playerStats.filter(stat => {
                        const statDate = new Date(stat.date);
                        return statDate.getMonth() === currentMonth && statDate.getFullYear() === currentYear;
                      });
                      
                      // Count unique games (by gameId) for the current month
                      const uniqueGamesInMonth = new Set(currentMonthStats.map(stat => stat.gameId));
                      const monthTotalMatches = uniqueGamesInMonth.size;
                      
                      // Helper function to determine match type from mode
                      const getMatchType = (mode: string): 'C5' | 'C7' | 'R5' | 'MiniR5' | 'Other' => {
                        const modeLower = (mode || '').toLowerCase().trim();
                        
                        // Check for Mini Rush first (before regular Rush)
                        if (modeLower.includes('mini') && modeLower.includes('rush')) {
                          return 'MiniR5';
                        }
                        
                        // Check for Classic 7x7
                        if (modeLower.includes('classic') && (modeLower.includes('7') || modeLower.includes('7x7'))) {
                          return 'C7';
                        }
                        
                        // Check for Classic 5x5
                        if (modeLower.includes('classic') && (modeLower.includes('5') || modeLower.includes('5x5'))) {
                          return 'C5';
                        }
                        
                        // Check for Rush (not mini)
                        if (modeLower.includes('rush')) {
                          return 'R5';
                        }
                        
                        return 'Other';
                      };
                      
                      // Count matches by mode for current month (unique games only)
                      const matchesByMode = {
                        C5: 0,
                        C7: 0,
                        R5: 0,
                        MiniR5: 0,
                        Other: 0
                      };
                      
                      uniqueGamesInMonth.forEach(gameId => {
                        const stat = currentMonthStats.find(s => s.gameId === gameId);
                        if (stat) {
                          const matchType = getMatchType(stat.mode);
                          matchesByMode[matchType]++;
                        }
                      });
                      const monthTotalGoals = currentMonthStats.reduce((sum, stat) => sum + stat.goals, 0);
                      const monthTotalAssists = currentMonthStats.reduce((sum, stat) => sum + stat.assists, 0);
                      const monthMvpCount = currentMonthStats.filter(stat => stat.mvp).length;
                      const monthGoalsPerMatch = monthTotalMatches > 0 ? monthTotalGoals / monthTotalMatches : 0;
                      const monthAssistsPerMatch = monthTotalMatches > 0 ? monthTotalAssists / monthTotalMatches : 0;
                      const monthMvpAvg = monthTotalMatches > 0 ? monthMvpCount / monthTotalMatches : 0;
                      
                      // Team stats for current month - calculate from actual games played
                      const monthTeamGoalsFor = currentMonthStats.reduce((sum, stat) => sum + stat.teamGoals, 0);
                      const monthTeamGoalsAgainst = currentMonthStats.reduce((sum, stat) => sum + stat.teamGC, 0);
                      
                      // Count unique games where team won/lost/had clean sheet (by gameId)
                      const teamWinsInMonth = new Set<string>();
                      const teamLossesInMonth = new Set<string>();
                      const teamCleanSheetsInMonth = new Set<string>();
                      
                      uniqueGamesInMonth.forEach(gameId => {
                        const stat = currentMonthStats.find(s => s.gameId === gameId);
                        if (stat) {
                          if (stat.teamWin === 1) {
                            teamWinsInMonth.add(gameId);
                          }
                          if (stat.teamLoss === 1) {
                            teamLossesInMonth.add(gameId);
                          }
                          if (stat.teamCleanSheet === 1) {
                            teamCleanSheetsInMonth.add(gameId);
                          }
                        }
                      });
                      
                      const monthTeamWin = teamWinsInMonth.size;
                      const monthTeamLoss = teamLossesInMonth.size;
                      const monthTeamCleanSheets = teamCleanSheetsInMonth.size;
                      
                      const monthWinAvg = monthTotalMatches > 0 ? monthTeamWin / monthTotalMatches : 0;
                      const monthLossesAvg = monthTotalMatches > 0 ? monthTeamLoss / monthTotalMatches : 0;
                      const monthGoalsAvg = monthTotalMatches > 0 ? monthTeamGoalsFor / monthTotalMatches : 0;
                      const monthGoalConcededAvg = monthTotalMatches > 0 ? monthTeamGoalsAgainst / monthTotalMatches : 0;
                      const monthCleanSheetAvg = monthTotalMatches > 0 ? monthTeamCleanSheets / monthTotalMatches : 0;
                      
                      // Calculate rankings for current month only
                      const allPlayersCurrentMonth = pastGames
                        .filter(game => {
                          const gameDate = new Date(game.date);
                          return gameDate.getMonth() === currentMonth && gameDate.getFullYear() === currentYear;
                        })
                        .flatMap(game => game.players);
                      
                      const uniquePlayersCurrentMonth = allPlayersCurrentMonth.reduce((acc, player) => {
                        if (!acc[player.playerUsername]) {
                          acc[player.playerUsername] = {
                            username: player.playerUsername,
                            totalPoints: 0,
                            totalGoals: 0,
                            totalAssists: 0,
                            totalMvp: 0,
                            totalMatches: 0
                          };
                        }
                        const pointsStr = player.points || '';
                        acc[player.playerUsername].totalPoints += pointsStr ? parseFloat(pointsStr.replace(',', '.')) : 0;
                        acc[player.playerUsername].totalGoals += parseInt(player.goal || '0');
                        acc[player.playerUsername].totalAssists += parseInt(player.assist || '0');
                        acc[player.playerUsername].totalMvp += player.mvp === '1' ? 1 : 0;
                        acc[player.playerUsername].totalMatches += 1;
                        return acc;
                      }, {} as Record<string, any>);
                      
                      const playerStatsForRankingCurrentMonth = Object.values(uniquePlayersCurrentMonth).map((p: any) => ({
                        username: p.username,
                        totalPoints: p.totalPoints,
                        totalGoals: p.totalGoals,
                        totalAssists: p.totalAssists,
                        totalMvp: p.totalMvp,
                        totalMatches: p.totalMatches
                      }));
                      
                      const monthPointsRanking = [...playerStatsForRankingCurrentMonth].sort((a, b) => b.totalPoints - a.totalPoints);
                      const monthGoalsRanking = [...playerStatsForRankingCurrentMonth].sort((a, b) => b.totalGoals - a.totalGoals);
                      const monthAssistsRanking = [...playerStatsForRankingCurrentMonth].sort((a, b) => b.totalAssists - a.totalAssists);
                      const monthMvpRanking = [...playerStatsForRankingCurrentMonth].sort((a, b) => b.totalMvp - a.totalMvp);
                      const monthMatchesRanking = [...playerStatsForRankingCurrentMonth].sort((a, b) => b.totalMatches - a.totalMatches);
                      
                      const currentPlayerUsername = selectedPlayer?.playerUsername || '';
                      const monthPointsRank = monthPointsRanking.findIndex(p => p.username === currentPlayerUsername) + 1;
                      const monthGoalsRank = monthGoalsRanking.findIndex(p => p.username === currentPlayerUsername) + 1;
                      const monthAssistsRank = monthAssistsRanking.findIndex(p => p.username === currentPlayerUsername) + 1;
                      const monthMvpRank = monthMvpRanking.findIndex(p => p.username === currentPlayerUsername) + 1;
                      const monthMatchesRank = monthMatchesRanking.findIndex(p => p.username === currentPlayerUsername) + 1;
                      
                      // If no matches played this month, show message
                      if (monthTotalMatches === 0) {
                        return (
                          <>
                            <h4 className="text-xs sm:text-sm font-semibold text-gray-400 mb-2 text-center">{monthName} {currentYear} Statistiques</h4>
                            <div className="text-center py-4 sm:py-6">
                              <p className="text-sm sm:text-base text-gray-400">{t("no_game_played_this_month")}</p>
                            </div>
                          </>
                        );
                      }
                      
                      return (
                        <>
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-400 mb-2 text-center">{monthName} {currentYear} Statistiques</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-2">
                          {/* Matches */}
                          <div className="bg-blue-800/30 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-blue-600/40">
                            <div className="flex items-center gap-1 mb-1">
                              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-500 rounded-full"></div>
                              <span className="text-xs font-semibold text-gray-300">Matches</span>
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Matches</span>
                                <span className={`text-xs font-medium ${
                                  monthTotalMatches >= 10 ? 'text-green-400' :
                                  monthTotalMatches >= 5 ? 'text-yellow-400' :
                                  monthTotalMatches >= 2 ? 'text-orange-400' : 'text-red-400'
                                }`}>{monthTotalMatches}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Classic5x5</span>
                                <span className={`text-xs font-medium ${
                                  matchesByMode.C5 >= 5 ? 'text-green-400' :
                                  matchesByMode.C5 >= 2 ? 'text-yellow-400' :
                                  matchesByMode.C5 >= 1 ? 'text-orange-400' : 'text-gray-400'
                                }`}>{matchesByMode.C5}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Classic7x7</span>
                                <span className={`text-xs font-medium ${
                                  matchesByMode.C7 >= 5 ? 'text-green-400' :
                                  matchesByMode.C7 >= 2 ? 'text-yellow-400' :
                                  matchesByMode.C7 >= 1 ? 'text-orange-400' : 'text-gray-400'
                                }`}>{matchesByMode.C7}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Rush5x5x5</span>
                                <span className={`text-xs font-medium ${
                                  matchesByMode.R5 >= 5 ? 'text-green-400' :
                                  matchesByMode.R5 >= 2 ? 'text-yellow-400' :
                                  matchesByMode.R5 >= 1 ? 'text-orange-400' : 'text-gray-400'
                                }`}>{matchesByMode.R5}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">MiniRush</span>
                                <span className={`text-xs font-medium ${
                                  matchesByMode.MiniR5 >= 5 ? 'text-green-400' :
                                  matchesByMode.MiniR5 >= 2 ? 'text-yellow-400' :
                                  matchesByMode.MiniR5 >= 1 ? 'text-orange-400' : 'text-gray-400'
                                }`}>{matchesByMode.MiniR5}</span>
                              </div>
                            </div>
                          </div>

                          {/* Individual */}
                          <div className="bg-indigo-800/30 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-indigo-600/40">
                            <div className="flex items-center gap-1 mb-1">
                              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-orange-500 rounded-full"></div>
                              <span className="text-xs font-semibold text-gray-300">Individual</span>
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Goal</span>
                                <span className={`text-xs font-medium ${
                                  monthTotalGoals >= 10 ? 'text-green-400' :
                                  monthTotalGoals >= 5 ? 'text-yellow-400' :
                                  monthTotalGoals >= 2 ? 'text-orange-400' : 'text-red-400'
                                }`}>{monthTotalGoals}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Assist</span>
                                <span className={`text-xs font-medium ${
                                  monthTotalAssists >= 8 ? 'text-green-400' :
                                  monthTotalAssists >= 4 ? 'text-yellow-400' :
                                  monthTotalAssists >= 2 ? 'text-orange-400' : 'text-red-400'
                                }`}>{monthTotalAssists}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Hattrick</span>
                                <span className={`text-xs font-medium ${
                                  currentMonthStats.filter(stat => stat.hattrick).length >= 2 ? 'text-green-400' :
                                  currentMonthStats.filter(stat => stat.hattrick).length >= 1 ? 'text-yellow-400' : 'text-orange-400'
                                }`}>{currentMonthStats.filter(stat => stat.hattrick).length}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">OwnGoal</span>
                                <span className={`text-xs font-medium ${
                                  currentMonthStats.reduce((sum, stat) => sum + stat.ownGoal, 0) >= 2 ? 'text-red-400' :
                                  currentMonthStats.reduce((sum, stat) => sum + stat.ownGoal, 0) >= 1 ? 'text-orange-400' : 'text-gray-400'
                                }`}>{currentMonthStats.reduce((sum, stat) => sum + stat.ownGoal, 0)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Interception</span>
                                <span className={`text-xs font-medium ${
                                  currentMonthStats.reduce((sum, stat) => sum + stat.interception, 0) >= 10 ? 'text-green-400' :
                                  currentMonthStats.reduce((sum, stat) => sum + stat.interception, 0) >= 5 ? 'text-yellow-400' :
                                  currentMonthStats.reduce((sum, stat) => sum + stat.interception, 0) >= 2 ? 'text-orange-400' : 'text-red-400'
                                }`}>{currentMonthStats.reduce((sum, stat) => sum + stat.interception, 0)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Team */}
                          <div className="bg-purple-800/30 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-purple-600/40">
                            <div className="flex items-center gap-1 mb-1">
                              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-500 rounded-full"></div>
                              <span className="text-xs font-semibold text-gray-300">Team</span>
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Win</span>
                                <span className={`text-xs font-medium ${
                                  monthTeamWin >= 5 ? 'text-green-400' :
                                  monthTeamWin >= 2 ? 'text-yellow-400' :
                                  monthTeamWin >= 1 ? 'text-orange-400' : 'text-red-400'
                                }`}>{monthTeamWin}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Losses</span>
                                <span className={`text-xs font-medium ${
                                  monthTeamLoss >= 5 ? 'text-red-400' :
                                  monthTeamLoss >= 2 ? 'text-orange-400' :
                                  monthTeamLoss >= 1 ? 'text-yellow-400' : 'text-gray-400'
                                }`}>{monthTeamLoss}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Goal</span>
                                <span className={`text-xs font-medium ${
                                  monthTeamGoalsFor >= 10 ? 'text-green-400' :
                                  monthTeamGoalsFor >= 5 ? 'text-yellow-400' :
                                  monthTeamGoalsFor >= 2 ? 'text-orange-400' : 'text-red-400'
                                }`}>{monthTeamGoalsFor}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">GoalConceded</span>
                                <span className={`text-xs font-medium ${
                                  monthTeamGoalsAgainst >= 10 ? 'text-red-400' :
                                  monthTeamGoalsAgainst >= 5 ? 'text-orange-400' :
                                  monthTeamGoalsAgainst >= 2 ? 'text-yellow-400' : 'text-gray-400'
                                }`}>{monthTeamGoalsAgainst}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Clean sheet</span>
                                <span className={`text-xs font-medium ${
                                  monthTeamCleanSheets >= 3 ? 'text-green-400' :
                                  monthTeamCleanSheets >= 2 ? 'text-yellow-400' :
                                  monthTeamCleanSheets >= 1 ? 'text-orange-400' : 'text-red-400'
                                }`}>{monthTeamCleanSheets}</span>
                              </div>
                            </div>
                          </div>

                          {/* Global */}
                          <div className="bg-cyan-800/30 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-cyan-600/40">
                            <div className="flex items-center gap-1 mb-1">
                              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full"></div>
                              <span className="text-xs font-semibold text-gray-300">Global</span>
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">MVP</span>
                                <span className={`text-xs font-medium ${
                                  monthMvpCount >= 5 ? 'text-green-400' :
                                  monthMvpCount >= 2 ? 'text-yellow-400' :
                                  monthMvpCount >= 1 ? 'text-orange-400' : 'text-red-400'
                                }`}>{monthMvpCount}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Streak</span>
                                <span className={`text-xs font-medium ${
                                  (playerStreaks.get(selectedPlayer?.playerUsername || '') || 0) >= 10 ? 'text-purple-400' :
                                  (playerStreaks.get(selectedPlayer?.playerUsername || '') || 0) >= 7 ? 'text-pink-400' :
                                  (playerStreaks.get(selectedPlayer?.playerUsername || '') || 0) >= 5 ? 'text-red-400' :
                                  (playerStreaks.get(selectedPlayer?.playerUsername || '') || 0) >= 3 ? 'text-orange-400' :
                                  (playerStreaks.get(selectedPlayer?.playerUsername || '') || 0) >= 1 ? 'text-yellow-400' : 'text-gray-400'
                                }`}>{playerStreaks.get(selectedPlayer?.playerUsername || '') || 0}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">But avg</span>
                                <span className={`text-xs font-medium ${
                                  monthGoalsPerMatch >= 1.5 ? 'text-green-400' :
                                  monthGoalsPerMatch >= 1.0 ? 'text-yellow-400' :
                                  monthGoalsPerMatch >= 0.5 ? 'text-orange-400' : 'text-red-400'
                                }`}>{monthGoalsPerMatch.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Assist avg</span>
                                <span className={`text-xs font-medium ${
                                  monthAssistsPerMatch >= 1.0 ? 'text-green-400' :
                                  monthAssistsPerMatch >= 0.5 ? 'text-yellow-400' :
                                  monthAssistsPerMatch >= 0.2 ? 'text-orange-400' : 'text-red-400'
                                }`}>{monthAssistsPerMatch.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">MVP avg</span>
                                <span className={`text-xs font-medium ${
                                  monthMvpAvg >= 0.5 ? 'text-green-400' :
                                  monthMvpAvg >= 0.3 ? 'text-yellow-400' :
                                  monthMvpAvg >= 0.1 ? 'text-orange-400' : 'text-red-400'
                                }`}>{(monthTotalMatches > 0 ? monthMvpAvg : 0).toFixed(1)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Team avg */}
                          <div className="bg-violet-800/30 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-violet-600/40">
                            <div className="flex items-center gap-1 mb-1">
                              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full"></div>
                              <span className="text-xs font-semibold text-gray-300">Team avg</span>
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Win avg</span>
                                <span className={`text-xs font-medium ${
                                  monthWinAvg >= 0.7 ? 'text-green-400' :
                                  monthWinAvg >= 0.5 ? 'text-yellow-400' :
                                  monthWinAvg >= 0.3 ? 'text-orange-400' : 'text-red-400'
                                }`}>{monthWinAvg.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Losses avg</span>
                                <span className={`text-xs font-medium ${
                                  monthLossesAvg <= 0.2 ? 'text-green-400' :
                                  monthLossesAvg <= 0.4 ? 'text-yellow-400' :
                                  monthLossesAvg <= 0.6 ? 'text-orange-400' : 'text-red-400'
                                }`}>{monthLossesAvg.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Goals avg</span>
                                <span className={`text-xs font-medium ${
                                  monthGoalsAvg >= 3.0 ? 'text-green-400' :
                                  monthGoalsAvg >= 2.0 ? 'text-yellow-400' :
                                  monthGoalsAvg >= 1.0 ? 'text-orange-400' : 'text-red-400'
                                }`}>{monthGoalsAvg.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">GoalConceded avg</span>
                                <span className={`text-xs font-medium ${
                                  monthGoalConcededAvg <= 1.0 ? 'text-green-400' :
                                  monthGoalConcededAvg <= 2.0 ? 'text-yellow-400' :
                                  monthGoalConcededAvg <= 3.0 ? 'text-orange-400' : 'text-red-400'
                                }`}>{monthGoalConcededAvg.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Clean sheet avg</span>
                                <span className={`text-xs font-medium ${
                                  monthCleanSheetAvg >= 0.5 ? 'text-green-400' :
                                  monthCleanSheetAvg >= 0.3 ? 'text-yellow-400' :
                                  monthCleanSheetAvg >= 0.1 ? 'text-orange-400' : 'text-red-400'
                                }`}>{monthCleanSheetAvg.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Ranking */}
                          <div className="bg-pink-800/30 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-pink-600/40">
                            <div className="flex items-center gap-1 mb-1">
                              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-yellow-500 rounded-full"></div>
                              <span className="text-xs font-semibold text-gray-300">Ranking</span>
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Points</span>
                                <span className={`text-xs font-medium ${
                                  monthPointsRank <= 5 ? 'text-green-400' :
                                  monthPointsRank <= 10 ? 'text-yellow-400' :
                                  monthPointsRank <= 20 ? 'text-orange-400' : 'text-red-400'
                                }`}>#{monthPointsRank || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Goal</span>
                                <span className={`text-xs font-medium ${
                                  monthGoalsRank <= 5 ? 'text-green-400' :
                                  monthGoalsRank <= 10 ? 'text-yellow-400' :
                                  monthGoalsRank <= 20 ? 'text-orange-400' : 'text-red-400'
                                }`}>#{monthGoalsRank || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Assist</span>
                                <span className={`text-xs font-medium ${
                                  monthAssistsRank <= 5 ? 'text-green-400' :
                                  monthAssistsRank <= 10 ? 'text-yellow-400' :
                                  monthAssistsRank <= 20 ? 'text-orange-400' : 'text-red-400'
                                }`}>#{monthAssistsRank || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">MVP</span>
                                <span className={`text-xs font-medium ${
                                  monthMvpRank <= 5 ? 'text-green-400' :
                                  monthMvpRank <= 10 ? 'text-yellow-400' :
                                  monthMvpRank <= 20 ? 'text-orange-400' : 'text-red-400'
                                }`}>#{monthMvpRank || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Match</span>
                                <span className={`text-xs font-medium ${
                                  monthMatchesRank <= 5 ? 'text-green-400' :
                                  monthMatchesRank <= 10 ? 'text-yellow-400' :
                                  monthMatchesRank <= 20 ? 'text-orange-400' : 'text-red-400'
                                }`}>#{monthMatchesRank || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Level Progression Section with Axe Visualization */}
                  <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-2 sm:p-3 mb-2 sm:mb-3 border border-gray-700/30 shadow-xl overflow-visible">
                    <h3 className="font-bold text-sm sm:text-base text-white mb-2 sm:mb-3">Level Progression</h3>
                    {(() => {
                      const username = selectedPlayer?.playerUsername?.trim() || '';
                      const currentPoints = username ? (playerPoints.get(username) || 0) : 0;
                      
                      // Calculate current level (0-based: L0 = 0-99, L1 = 100-199, etc.)
                      const currentLevelNumber = Math.floor(currentPoints / 100);
                      
                      // Determine which segment (0-5, 5-10, 10-15, etc.) the user is in
                      // Each segment shows 6 levels (0-5, 5-10, 10-15, etc.)
                      const segmentStart = Math.floor(currentLevelNumber / 5) * 5;
                      const segmentEnd = segmentStart + 5; // Inclusive, so 0-5 means levels 0,1,2,3,4,5
                      
                      // Generate milestones for current segment only (6 levels)
                      const visibleMilestones = [];
                      for (let level = segmentStart; level <= segmentEnd; level++) {
                        visibleMilestones.push(level * 100);
                      }
                      
                      const currentLevel = Math.floor(currentPoints / 100) * 100;
                      const nextLevel = currentLevel + 100;
                      const nextLevelNumber = currentLevelNumber + 1;
                      const progressInCurrentLevel = Math.floor(currentPoints % 100);
                      const progressPercentage = (progressInCurrentLevel / 100) * 100;
                      
                      // Calculate min and max for the visible segment
                      const segmentMin = segmentStart * 100;
                      const segmentMax = segmentEnd * 100;
                      
                      return (
                        <div className="space-y-2">
                          {/* Current Points Display - Compact */}
                          <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-1.5 sm:p-2 border border-gray-700/30">
                            <div>
                              <p className="text-[9px] sm:text-[10px] text-gray-400">Points</p>
                              <p className="text-base sm:text-lg font-bold text-white">{Math.floor(currentPoints).toLocaleString()} pts</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] sm:text-[10px] text-gray-400">Next Level {nextLevelNumber}</p>
                              <p className="text-[10px] sm:text-xs text-cyan-400">-{100 - progressInCurrentLevel} points</p>
                            </div>
                          </div>

                          {/* Compact Axis with Pins */}
                          <div className="relative overflow-visible px-1 sm:px-2">
                            {/* Segment Info */}
                            <div className="text-center mb-1">
                              <span className="text-[10px] sm:text-xs text-gray-400">
                                Levels {segmentStart} - {segmentEnd}
                              </span>
                            </div>
                            
                            {/* Current Points Badge Above Axis */}
                            {currentPoints >= segmentMin && currentPoints <= segmentMax && (
                              <div className="relative mb-1 h-5 overflow-visible">
                                <div
                                  className="absolute flex flex-col items-center"
                                  style={{ 
                                    left: `${((currentPoints - segmentMin) / (segmentMax - segmentMin)) * 100}%`, 
                                    transform: 'translateX(-50%)'
                                  }}
                                >
                                  <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold bg-cyan-400/20 text-cyan-400 border border-cyan-400/50 whitespace-nowrap">
                                    {Math.floor(currentPoints)} pts
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {/* Horizontal Axis Line */}
                            <div className="relative h-1 bg-gray-700 rounded-full overflow-hidden">
                              {/* Progress fill - relative to segment */}
                              <div 
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-500"
                                style={{ 
                                  width: `${Math.min(Math.max(((currentPoints - segmentMin) / (segmentMax - segmentMin)) * 100, 0), 100)}%` 
                                }}
                              ></div>
                            </div>
                            
                            {/* Pins on Axis */}
                            <div className="relative mt-1.5 pb-4 sm:pb-5 min-h-[55px] sm:min-h-[60px] overflow-visible">
                              {visibleMilestones.map((milestone, index) => {
                                const isReached = currentPoints >= milestone;
                                // Position relative to segment range
                                const position = ((milestone - segmentMin) / (segmentMax - segmentMin)) * 100;
                                const level = milestone / 100; // Level number (100 pts = L1, 200 pts = L2, etc.)
                                const isFirst = index === 0;
                                const isLast = index === visibleMilestones.length - 1;
                                
                                // Adjust transform for edge cases to prevent overflow
                                // For first pin, align left; for last, align right; others center
                                let transformStyle = 'translateX(-50%)';
                                
                                if (isFirst) {
                                  transformStyle = 'translateX(0)';
                                } else if (isLast) {
                                  transformStyle = 'translateX(-100%)';
                                }
                                
                                return (
                                  <div
                                    key={milestone}
                                    className="absolute flex flex-col items-center"
                                    style={{ 
                                      left: `${position}%`, 
                                      transform: transformStyle,
                                      maxWidth: isFirst || isLast ? 'none' : '80px'
                                    }}
                                  >
                                    {/* Level Badge */}
                                    <div className="mb-0.5 sm:mb-1 whitespace-nowrap">
                                      <span className={`px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-bold ${
                                        isReached 
                                          ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50' 
                                          : 'bg-gray-700/50 text-gray-500 border border-gray-600/50'
                                      }`}>
                                        L{level}
                                      </span>
                                    </div>
                                    
                                    {/* Pin */}
                                    <div className={`relative ${
                                      isReached ? 'text-yellow-400' : 'text-gray-500'
                                    }`}>
                                      {/* Pin head */}
                                      <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-2 ${
                                        isReached 
                                          ? 'bg-yellow-400 border-yellow-300 shadow-md shadow-yellow-500/50' 
                                          : 'bg-gray-600 border-gray-500'
                                      }`}></div>
                                      {/* Pin line */}
                                      <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-2 sm:h-3 ${
                                        isReached ? 'bg-yellow-400' : 'bg-gray-600'
                                      }`}></div>
                                    </div>
                                    
                                    {/* Point label */}
                                    <div className="mt-0.5 sm:mt-1 whitespace-nowrap">
                                      <span className={`text-[8px] sm:text-[9px] font-semibold ${
                                        isReached ? 'text-yellow-400' : 'text-gray-500'
                                      }`}>
                                        {milestone}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {/* Current position indicator */}
                              {currentPoints >= segmentMin && currentPoints <= segmentMax && (
                                <div
                                  className="absolute top-0 flex flex-col items-center"
                                  style={{ 
                                    left: `${((currentPoints - segmentMin) / (segmentMax - segmentMin)) * 100}%`, 
                                    transform: 'translateX(-50%)',
                                    maxWidth: '100%'
                                  }}
                                >
                                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-cyan-400 rounded-full border-2 border-white shadow-lg shadow-cyan-500/50 relative z-10">
                                    <div className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-75"></div>
                                  </div>
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-3 sm:h-4 bg-cyan-400"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Rank Progression Section */}
                  <div className="bg-gradient-to-br from-amber-900/40 via-yellow-900/40 to-orange-900/40 rounded-xl sm:rounded-2xl p-2 sm:p-3 mb-2 sm:mb-3 border border-amber-700/50 shadow-xl overflow-visible">
                    <h3 className="font-bold text-sm sm:text-base text-white mb-2 sm:mb-3">Rank Progression</h3>
                    {(() => {
                      const username = selectedPlayer?.playerUsername?.trim() || '';
                      const currentGlobalScore = username ? (globalScores.get(username) || 0) : 0;
                      
                      // Rank tier thresholds with colors
                      const rankTiers = [
                        { name: "Unranked", min: 0, max: 49, color: "gray" },
                        { name: "FOX 1", min: 50, max: 99, color: "blue" },
                        { name: "FOX 2", min: 100, max: 149, color: "blue" },
                        { name: "FOX 3", min: 150, max: 249, color: "blue" },
                        { name: "Crocodile 1", min: 250, max: 399, color: "green" },
                        { name: "Crocodile 2", min: 400, max: 599, color: "green" },
                        { name: "Crocodile 3", min: 600, max: 899, color: "green" },
                        { name: "Gorilla 1", min: 900, max: 1199, color: "orange" },
                        { name: "Gorilla 2", min: 1200, max: 1599, color: "orange" },
                        { name: "Gorilla 3", min: 1600, max: 2099, color: "orange" },
                        { name: "Goat 1", min: 2100, max: 2599, color: "purple" },
                        { name: "Goat 2", min: 2600, max: 3299, color: "purple" },
                        { name: "Goat 3", min: 3300, max: 3999, color: "purple" },
                        { name: "Predator", min: 4000, max: Infinity, color: "red" }
                      ];
                      
                      // Find current rank tier
                      const currentTierIndex = rankTiers.findIndex(tier => 
                        currentGlobalScore >= tier.min && currentGlobalScore <= tier.max
                      );
                      const currentTier = currentTierIndex >= 0 ? rankTiers[currentTierIndex] : rankTiers[0];
                      const nextTier = currentTierIndex < rankTiers.length - 1 ? rankTiers[currentTierIndex + 1] : null;
                      const isMaxRank = currentTier.max === Infinity;
                      
                      // Calculate progress within current tier
                      const progressInCurrentTier = isMaxRank 
                        ? 0 
                        : currentGlobalScore - currentTier.min;
                      const tierRange = isMaxRank 
                        ? 1 
                        : currentTier.max - currentTier.min + 1;
                      const progressPercentage = tierRange > 0 ? (progressInCurrentTier / tierRange) * 100 : 0;
                      const pointsNeeded = nextTier ? Math.max(0, nextTier.min - currentGlobalScore) : 0;
                      
                      // Determine which segment to show (show current tier and 2-3 tiers around it)
                      const segmentStart = Math.max(0, currentTierIndex - 2);
                      const segmentEnd = Math.min(rankTiers.length - 1, currentTierIndex + 3);
                      const visibleTiers = rankTiers.slice(segmentStart, segmentEnd + 1);
                      
                      // Calculate min and max for the visible segment
                      const segmentMin = visibleTiers[0].min;
                      const segmentMax = visibleTiers[visibleTiers.length - 1].max === Infinity 
                        ? Math.max(segmentMin + 2000, currentGlobalScore + 500)
                        : visibleTiers[visibleTiers.length - 1].max;
                      
                      // Get color classes for rank tier
                      const getTierColorClasses = (tier: typeof rankTiers[0], isReached: boolean, isCurrent: boolean) => {
                        if (isCurrent) {
                          return {
                            badge: 'bg-yellow-400/30 text-yellow-300 border-yellow-400/70 shadow-md shadow-yellow-500/30',
                            pin: 'bg-yellow-400 border-yellow-300 shadow-lg shadow-yellow-500/60',
                            text: 'text-yellow-300'
                          };
                        }
                        if (isReached) {
                          const colors: Record<string, any> = {
                            blue: { badge: 'bg-blue-400/20 text-blue-300 border-blue-400/50', pin: 'bg-blue-400 border-blue-300', text: 'text-blue-300' },
                            green: { badge: 'bg-green-400/20 text-green-300 border-green-400/50', pin: 'bg-green-400 border-green-300', text: 'text-green-300' },
                            orange: { badge: 'bg-orange-400/20 text-orange-300 border-orange-400/50', pin: 'bg-orange-400 border-orange-300', text: 'text-orange-300' },
                            purple: { badge: 'bg-purple-400/20 text-purple-300 border-purple-400/50', pin: 'bg-purple-400 border-purple-300', text: 'text-purple-300' },
                            red: { badge: 'bg-red-400/20 text-red-300 border-red-400/50', pin: 'bg-red-400 border-red-300', text: 'text-red-300' },
                            gray: { badge: 'bg-gray-400/20 text-gray-300 border-gray-400/50', pin: 'bg-gray-400 border-gray-300', text: 'text-gray-300' }
                          };
                          return colors[tier.color] || colors.gray;
                        }
                        return {
                          badge: 'bg-gray-700/50 text-gray-500 border-gray-600/50',
                          pin: 'bg-gray-600 border-gray-500',
                          text: 'text-gray-500'
                        };
                      };
                      
                      return (
                        <div className="space-y-2">
                          {/* Current Global Score Display - Enhanced */}
                          <div className="flex items-center justify-between bg-gradient-to-r from-amber-800/30 to-orange-800/30 rounded-lg p-2 sm:p-3 border border-amber-600/40 shadow-lg">
                            <div>
                              <p className="text-[9px] sm:text-[10px] text-gray-400 mb-0.5">Global Score</p>
                              <p className="text-lg sm:text-xl font-bold text-white">{Math.floor(currentGlobalScore).toLocaleString()} pts</p>
                              <p className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">Current Rank: <span className="text-yellow-400 font-semibold">{currentTier.name}</span></p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] sm:text-[10px] text-gray-400 mb-0.5">Next Rank</p>
                              {nextTier && !isMaxRank ? (
                                <>
                                  <p className="text-sm sm:text-base font-bold text-yellow-400">{nextTier.name}</p>
                                  <p className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">-{pointsNeeded.toLocaleString()} points</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm sm:text-base font-bold text-purple-400">Max Rank</p>
                                  <p className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">Achieved!</p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Progress Bar for Current Tier */}
                          {!isMaxRank && nextTier && (
                            <div className="bg-amber-800/30 rounded-lg p-2 border border-amber-600/40">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] sm:text-[10px] text-gray-400">Progress to {nextTier.name}</span>
                                <span className="text-[9px] sm:text-[10px] text-yellow-400 font-semibold">{progressPercentage.toFixed(1)}%</span>
                              </div>
                              <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all duration-500 rounded-full"
                                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between mt-1">
                                <span className="text-[8px] sm:text-[9px] text-gray-500">{currentTier.min}</span>
                                <span className="text-[8px] sm:text-[9px] text-gray-500">{nextTier.min}</span>
                              </div>
                            </div>
                          )}

                          {/* Compact Axis with Pins */}
                          <div className="relative overflow-visible px-1 sm:px-2">
                            {/* Current Rank Badge Above Axis */}
                            {currentGlobalScore >= segmentMin && currentGlobalScore <= segmentMax && (
                              <div className="relative mb-2 h-6 overflow-visible">
                                <div
                                  className="absolute flex flex-col items-center"
                                  style={{ 
                                    left: `${Math.min(Math.max(((currentGlobalScore - segmentMin) / (segmentMax - segmentMin)) * 100, 0), 100)}%`, 
                                    transform: 'translateX(-50%)'
                                  }}
                                >
                                  <span className="px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-bold bg-yellow-400/30 text-yellow-300 border-2 border-yellow-400/70 shadow-lg shadow-yellow-500/40 whitespace-nowrap">
                                    {Math.floor(currentGlobalScore)} pts
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {/* Horizontal Axis Line */}
                            <div className="relative h-1.5 bg-gray-700 rounded-full overflow-hidden shadow-inner">
                              {/* Progress fill - relative to segment */}
                              <div 
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all duration-500 rounded-full"
                                style={{ 
                                  width: `${Math.min(Math.max(((currentGlobalScore - segmentMin) / (segmentMax - segmentMin)) * 100, 0), 100)}%` 
                                }}
                              ></div>
                            </div>
                            
                            {/* Pins on Axis */}
                            <div className="relative mt-2 pb-5 sm:pb-6 min-h-[60px] sm:min-h-[70px] overflow-visible">
                              {visibleTiers.map((tier, index) => {
                                const isReached = currentGlobalScore >= tier.min;
                                const isCurrent = currentTierIndex === segmentStart + index;
                                const tierStart = tier.min;
                                // Position relative to segment range
                                const position = ((tierStart - segmentMin) / (segmentMax - segmentMin)) * 100;
                                const isFirst = index === 0;
                                const isLast = index === visibleTiers.length - 1;
                                
                                const colorClasses = getTierColorClasses(tier, isReached, isCurrent);
                                
                                // Adjust transform for edge cases to prevent overflow
                                let transformStyle = 'translateX(-50%)';
                                
                                if (isFirst) {
                                  transformStyle = 'translateX(0)';
                                } else if (isLast) {
                                  transformStyle = 'translateX(-100%)';
                                }
                                
                                return (
                                  <div
                                    key={tier.name}
                                    className="absolute flex flex-col items-center"
                                    style={{ 
                                      left: `${Math.min(Math.max(position, 0), 100)}%`, 
                                      transform: transformStyle,
                                      maxWidth: isFirst || isLast ? 'none' : '110px'
                                    }}
                                  >
                                    {/* Rank Badge */}
                                    <div className="mb-1 sm:mb-1.5 whitespace-nowrap">
                                      <span className={`px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-bold border ${colorClasses.badge}`}>
                                        {tier.name}
                                      </span>
                                    </div>
                                    
                                    {/* Pin */}
                                    <div className={`relative ${colorClasses.text}`}>
                                      {/* Pin head */}
                                      <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 ${colorClasses.pin}`}></div>
                                      {/* Pin line */}
                                      <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-2.5 sm:h-3 ${isReached || isCurrent ? colorClasses.text.replace('text-', 'bg-') : 'bg-gray-600'}`}></div>
                                    </div>
                                    
                                    {/* Score label */}
                                    <div className="mt-1 sm:mt-1.5 whitespace-nowrap">
                                      <span className={`text-[8px] sm:text-[9px] font-semibold ${colorClasses.text}`}>
                                        {tier.max === Infinity ? `${tier.min}+` : tier.min}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {/* Current position indicator */}
                              {currentGlobalScore >= segmentMin && currentGlobalScore <= segmentMax && (
                                <div
                                  className="absolute top-0 flex flex-col items-center z-20"
                                  style={{ 
                                    left: `${Math.min(Math.max(((currentGlobalScore - segmentMin) / (segmentMax - segmentMin)) * 100, 0), 100)}%`, 
                                    transform: 'translateX(-50%)',
                                    maxWidth: '100%'
                                  }}
                                >
                                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-yellow-400 rounded-full border-2 border-white shadow-xl shadow-yellow-500/60 relative z-10">
                                    <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                                  </div>
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-1 h-4 sm:h-5 bg-yellow-400"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Performance Progression Charts - Mobile Optimized */}
                  <div className="bg-gray-800 rounded-lg px-1 py-2 sm:p-4">
                    <h3 className="font-bold text-base sm:text-lg text-white mb-2 sm:mb-4 pl-1 sm:pl-0">Performance Progression</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-6">
                      {/* Points Trend Line Chart */}
                      <div className="rounded-lg pl-0 pr-1 py-1 sm:p-4">
                        <div className="flex justify-between items-center mb-1.5 sm:mb-3">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-xs sm:text-base text-gray-300 font-medium">Points Trend</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="text-gray-400 hover:text-gray-300 transition-colors">
                                    <FiInfo className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 border-gray-700 text-gray-200 max-w-xs">
                                  <p className="text-sm">This chart shows your points earned over the last 10 matches. Points reflect your overall performance and contributions to your team.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-400">
                            {(() => {
                              const recentPoints = playerStats.slice(-10).map(stat => stat.points);
                              const avgPoints = recentPoints.length > 0 ? recentPoints.reduce((sum, p) => sum + p, 0) / recentPoints.length : 0;
                              return `Avg: ${avgPoints.toFixed(1)}`;
                            })()}
                              </span>
                        </div>
                        <div className="relative h-32 sm:h-48 rounded pl-0 pr-0.5 py-0.5 sm:p-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={playerStats.slice(-10).map((stat, index) => {
                                const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                                return {
                                  game: isMobile ? `${index + 1}` : `#${stat.gameId}`,
                                  points: stat.points,
                                  date: stat.date
                                };
                              })}
                              margin={{ top: 0, right: 0, left: -5, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.3} />
                              <XAxis 
                                dataKey="game" 
                                stroke="#9ca3af" 
                                fontSize={10}
                                tick={{ fill: '#9ca3af' }}
                                height={20}
                              />
                              <YAxis 
                                domain={['dataMin - 5', 'dataMax + 5']}
                                stroke="#9ca3af" 
                                fontSize={10}
                                tick={{ fill: '#9ca3af' }}
                                width={30}
                                padding={{ top: 5, bottom: 5 }}
                              />
                              <RechartsTooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(31, 41, 55, 0.95)',
                                  border: '1px solid #4b5563',
                                  borderRadius: '8px',
                                  padding: '8px 12px',
                                  color: '#fff'
                                }}
                                labelStyle={{ color: '#d1d5db', marginBottom: '4px' }}
                                formatter={(value: number) => [value.toFixed(1), 'Points']}
                              />
                              <Area
                                type="monotone"
                                dataKey="points"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fill="url(#pointsGradient)"
                                dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, fill: '#60a5fa' }}
                                animationDuration={800}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Goals Trend Line Chart */}
                      <div className="rounded-lg pl-0 pr-1 py-1 sm:p-4">
                        <div className="flex justify-between items-center mb-1.5 sm:mb-3">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-xs sm:text-base text-gray-300 font-medium">Goals Trend</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="text-gray-400 hover:text-gray-300 transition-colors">
                                    <FiInfo className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 border-gray-700 text-gray-200 max-w-xs">
                                  <p className="text-sm">This chart displays the number of goals you scored in each of your last 10 matches. The average shows your recent goal-scoring performance.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-400">
                            Avg: {recentGames.length > 0 ? (recentGames.reduce((sum, stat) => sum + stat.goals, 0) / recentGames.length).toFixed(1) : '0.0'}
                          </span>
                        </div>
                        <div className="relative h-32 sm:h-48 rounded pl-0 pr-0.5 py-0.5 sm:p-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={playerStats.slice(-10).map((stat, index) => {
                                const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                                return {
                                  game: isMobile ? `${index + 1}` : `#${stat.gameId}`,
                                  goals: stat.goals,
                                  date: stat.date
                                };
                              })}
                              margin={{ top: 0, right: 0, left: -5, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="goalsGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.3} />
                              <XAxis 
                                dataKey="game" 
                                stroke="#9ca3af" 
                                fontSize={10}
                                tick={{ fill: '#9ca3af' }}
                                height={20}
                              />
                              <YAxis 
                                domain={['auto', 'auto']}
                                stroke="#9ca3af" 
                                fontSize={10}
                                tick={{ fill: '#9ca3af' }}
                                allowDecimals={false}
                                width={30}
                                padding={{ top: 5, bottom: 5 }}
                              />
                              <RechartsTooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(31, 41, 55, 0.95)',
                                  border: '1px solid #4b5563',
                                  borderRadius: '8px',
                                  padding: '8px 12px',
                                  color: '#fff'
                                }}
                                labelStyle={{ color: '#d1d5db', marginBottom: '4px' }}
                                formatter={(value: number) => [value, 'Goals']}
                              />
                              <Area
                                type="monotone"
                                dataKey="goals"
                                stroke="#10b981"
                                strokeWidth={3}
                                fill="url(#goalsGradient)"
                                dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, fill: '#34d399' }}
                                animationDuration={800}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                </div>
              </div>

                      {/* Assists Trend Line Chart */}
                      <div className="rounded-lg pl-0 pr-1 py-1 sm:p-4">
                        <div className="flex justify-between items-center mb-1.5 sm:mb-3">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-xs sm:text-base text-gray-300 font-medium">Assists Trend</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="text-gray-400 hover:text-gray-300 transition-colors">
                                    <FiInfo className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 border-gray-700 text-gray-200 max-w-xs">
                                  <p className="text-sm">This chart shows the number of assists you provided in each of your last 10 matches. Assists represent key passes or plays that directly led to goals scored by teammates.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-400">
                            Avg: {recentGames.length > 0 ? (recentGames.reduce((sum, stat) => sum + stat.assists, 0) / recentGames.length).toFixed(1) : '0.0'}
                          </span>
                        </div>
                        <div className="relative h-32 sm:h-48 rounded pl-0 pr-0.5 py-0.5 sm:p-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={playerStats.slice(-10).map((stat, index) => {
                                const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                                return {
                                  game: isMobile ? `${index + 1}` : `#${stat.gameId}`,
                                  assists: stat.assists,
                                  date: stat.date
                                };
                              })}
                              margin={{ top: 0, right: 0, left: -5, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="assistsGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.3} />
                              <XAxis 
                                dataKey="game" 
                                stroke="#9ca3af" 
                                fontSize={10}
                                tick={{ fill: '#9ca3af' }}
                                height={20}
                              />
                              <YAxis 
                                domain={['auto', 'auto']}
                                stroke="#9ca3af" 
                                fontSize={10}
                                tick={{ fill: '#9ca3af' }}
                                allowDecimals={false}
                                width={30}
                                padding={{ top: 5, bottom: 5 }}
                              />
                              <RechartsTooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(31, 41, 55, 0.95)',
                                  border: '1px solid #4b5563',
                                  borderRadius: '8px',
                                  padding: '8px 12px',
                                  color: '#fff'
                                }}
                                labelStyle={{ color: '#d1d5db', marginBottom: '4px' }}
                                formatter={(value: number) => [value, 'Assists']}
                              />
                              <Area
                                type="monotone"
                                dataKey="assists"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                fill="url(#assistsGradient)"
                                dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, fill: '#a78bfa' }}
                                animationDuration={800}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Matches Per Month Trend */}
                      <div className="rounded-lg pl-0 pr-1 py-1 sm:p-4">
                        <div className="flex justify-between items-center mb-1.5 sm:mb-3">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-xs sm:text-base text-gray-300 font-medium">Match Par Mois</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="text-gray-400 hover:text-gray-300 transition-colors">
                                    <FiInfo className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 border-gray-700 text-gray-200 max-w-xs">
                                  <p className="text-sm">This chart displays the number of matches you played each month over the last 6 months. It helps track your activity and participation frequency.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-400">Total: {totalMatches} matches</span>
                        </div>
                        <div className="relative h-32 sm:h-48 rounded pl-0 pr-0.5 py-0.5 sm:p-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={(() => {
                              const now = new Date();
                                const monthsData = [];
                              
                              // Get last 6 months
                              for (let i = 5; i >= 0; i--) {
                                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                                const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
                                
                                // Count matches in this month
                                const matchesInMonth = playerStats.filter(stat => {
                                  const statDate = new Date(stat.date);
                                  const statMonthKey = `${statDate.getFullYear()}-${String(statDate.getMonth() + 1).padStart(2, '0')}`;
                                  return statMonthKey === monthKey;
                                }).length;
                                
                                monthsData.push({
                                  month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
                                    matches: matchesInMonth
                                  });
                                }
                                
                                return monthsData;
                              })()}
                              margin={{ top: 0, right: 0, left: -5, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="matchesGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.3} />
                              <XAxis 
                                dataKey="month" 
                                stroke="#9ca3af" 
                                fontSize={10}
                                tick={{ fill: '#9ca3af' }}
                                height={20}
                              />
                              <YAxis 
                                domain={['auto', 'auto']}
                                stroke="#9ca3af" 
                                fontSize={10}
                                tick={{ fill: '#9ca3af' }}
                                allowDecimals={false}
                                width={30}
                                padding={{ top: 5, bottom: 5 }}
                              />
                              <RechartsTooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(31, 41, 55, 0.95)',
                                  border: '1px solid #4b5563',
                                  borderRadius: '8px',
                                  padding: '8px 12px',
                                  color: '#fff'
                                }}
                                labelStyle={{ color: '#d1d5db', marginBottom: '4px' }}
                                formatter={(value: number) => [value, 'Matches']}
                              />
                              <Area
                                type="monotone"
                                dataKey="matches"
                                stroke="#f59e0b"
                                strokeWidth={3}
                                fill="url(#matchesGradient)"
                                dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, fill: '#fbbf24' }}
                                animationDuration={800}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                </div>
                      </div>

                    </div>
                  </div>



                  {/* Challenges Section */}
                  <div className="bg-gray-800 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                    <h3 className="font-bold text-sm sm:text-base text-white mb-2 sm:mb-3">Challenges</h3>
                    <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-lg p-2.5 sm:p-3 border border-gray-600/50 relative overflow-hidden">
                      {/* Coming Soon Overlay */}
                      <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-lg">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Coming Soon</span>
                      </div>
                      
                      {/* Challenge Content */}
                      <div className="relative z-0 opacity-50">
                        <div className="flex items-center gap-2">
                          <span className="text-lg sm:text-xl">🎯</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-white">Score Master</h4>
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Score 8+ in 5 matches</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Complete Match History Table - Mobile Optimized */}
                  <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                    <h3 className="font-bold text-base sm:text-lg text-white mb-3 sm:mb-4">Complete Match History</h3>

                    {/* Status Tags Legend */}
                    <div className="bg-gray-700/50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 border border-gray-600/30">
                      <div className="flex items-center gap-1.5 mb-2">
                        <FiInfo className="text-gray-400 text-xs sm:text-sm" />
                        <span className="text-[10px] sm:text-xs font-semibold text-gray-300">Index des Tags</span>
                      </div>

                      {/* Mobile Version - 2 columns */}
                      <div className="grid grid-cols-2 gap-2 sm:hidden">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 text-[9px] font-bold border border-green-500/30">
                            V
                          </span>
                          <span className="text-[9px] text-gray-400">Victoire</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[9px] font-bold border border-red-500/30">
                            L
                          </span>
                          <span className="text-[9px] text-gray-400">Défaite</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[9px] font-bold border border-blue-500/30">
                            CS
                          </span>
                          <span className="text-[9px] text-gray-400">Clean Sheet</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-[9px] font-bold border border-yellow-500/30">
                            MVP
                          </span>
                          <span className="text-[9px] text-gray-400">Meilleur Joueur</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold border border-purple-500/30">
                            H
                          </span>
                          <span className="text-[9px] text-gray-400">Hattrick (3+ buts)</span>
                        </div>
                      </div>

                      {/* Desktop Version - Single row */}
                      <div className="hidden sm:flex sm:flex-wrap sm:gap-3 sm:items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-green-500 text-green-900 px-1 py-0.5 rounded text-xs font-bold">
                            V
                          </span>
                          <span className="text-xs text-gray-400">Victoire</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-red-500 text-red-900 px-1 py-0.5 rounded text-xs font-bold">
                            L
                          </span>
                          <span className="text-xs text-gray-400">Défaite</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-blue-500 text-blue-900 px-1 py-0.5 rounded text-xs font-bold">
                            CS
                          </span>
                          <span className="text-xs text-gray-400">Clean Sheet</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-yellow-500 text-yellow-900 px-1 py-0.5 rounded text-xs font-bold">
                            MVP
                          </span>
                          <span className="text-xs text-gray-400">Meilleur Joueur</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-purple-500 text-purple-900 px-1 py-0.5 rounded text-xs font-bold">
                            H
                          </span>
                          <span className="text-xs text-gray-400">Hattrick (3+ buts)</span>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Cards View */}
                    <div className="block sm:hidden space-y-1.5">
                      {playerStats
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 10)
                        .map((stat, index) => {
                          const game = pastGames.find(g => g.gameId === stat.gameId);
                          const gameMode = game?.mode || 'Standard';
                          const player = game?.players.find(p => p.playerUsername === selectedPlayer?.playerUsername);
                          const points = player?.points ? parseFloat(player.points.replace(',', '.')) : 0;
                          
                          // Check if it's a Rush game
                          const isRushGame = (gameMode || '').toLowerCase().includes('rush');
                          
                          // Calculate win/loss/clean sheet for Rush games
                          let isWin = false;
                          let isLoss = false;
                          let isCleanSheet = false;
                          
                          if (isRushGame && stat.teamMiniGame > 0) {
                            const winRatio = stat.teamWin / stat.teamMiniGame;
                            const cleanSheetRatio = stat.teamCleanSheet / stat.teamMiniGame;
                            isWin = winRatio >= 0.5;
                            isLoss = !isWin; // If not a win, it's a loss
                            isCleanSheet = cleanSheetRatio >= 0.5;
                          } else {
                            // For non-Rush games, use the original logic
                            isWin = stat.teamWin === 1;
                            isLoss = stat.teamLoss === 1;
                            isCleanSheet = stat.teamCleanSheet === 1;
                          }
                          
                          return (
                            <div key={`mobile-${stat.gameId}_${stat.date}`} className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-2 border border-gray-600/50">
                              {/* Header Row */}
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[10px] font-bold text-gray-300">#{stat.gameId}</span>
                                    <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${
                                      stat.team.toLowerCase() === 'orange' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                                      stat.team.toLowerCase() === 'blue' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                      stat.team.toLowerCase() === 'jaune' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                      stat.team.toLowerCase() === 'red' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                      stat.team.toLowerCase() === 'green' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                      'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                    }`}>
                                      {stat.team}
                                    </span>
                                    {stat.number && (
                                      <span className={`w-4 h-4 rounded-full text-white flex items-center justify-center font-bold text-[9px] ${
                                        stat.team.toLowerCase() === 'orange' ? 'bg-orange-500' :
                                        stat.team.toLowerCase() === 'blue' ? 'bg-blue-500' :
                                        stat.team.toLowerCase() === 'jaune' ? 'bg-yellow-500' :
                                        stat.team.toLowerCase() === 'red' ? 'bg-red-500' :
                                        stat.team.toLowerCase() === 'green' ? 'bg-green-500' :
                                        'bg-gray-600'
                                      }`}>
                                        {stat.number}
                                      </span>
                                    )}
                                </div>
                                  <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                                    <span>{new Date(stat.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    <span className="text-gray-500">•</span>
                                    <span>{gameMode}</span>
                              </div>
                                </div>
                                <button
                                  onClick={() => {
                                    if (game) {
                                      setSelectedGame(game);
                                      setIsStatsModalOpen(true);
                                    }
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg transition-colors duration-200 flex items-center justify-center ml-2 flex-shrink-0"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                              </div>
                              
                              {/* Stats Row */}
                              <div className="grid grid-cols-4 gap-1.5 pt-1.5 border-t border-gray-600/50">
                                <div className="text-center">
                                  <div className="text-[9px] text-gray-400 mb-0.5">Score</div>
                                  <div className="text-xs font-bold text-blue-400">{stat.score.toFixed(1)}</div>
                            </div>
                                <div className="text-center">
                                  <div className="text-[9px] text-gray-400 mb-0.5">Goal</div>
                                  <div className="text-xs font-bold text-green-400">{stat.goals}</div>
                          </div>
                                <div className="text-center">
                                  <div className="text-[9px] text-gray-400 mb-0.5">Assist</div>
                                  <div className="text-xs font-bold text-purple-400">{stat.assists}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-[9px] text-gray-400 mb-0.5">Points</div>
                                  {points !== 0 ? (
                                    <div className={`text-xs font-bold ${points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      {points > 0 ? '+' : ''}{points.toFixed(1)}
                                    </div>
                                  ) : (
                                    <div className="text-xs font-bold text-gray-500">-</div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Status Badge */}
                              {(stat.mvp || stat.hattrick || isWin || isLoss || isCleanSheet) && (
                                <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-gray-600/50">
                                  {isWin && (
                                    <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 text-[9px] font-bold border border-green-500/30">
                                      V
                                    </span>
                                  )}
                                  {isLoss && (
                                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[9px] font-bold border border-red-500/30">
                                      L
                                    </span>
                                  )}
                                  {isCleanSheet && (
                                    <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[9px] font-bold border border-blue-500/30">
                                      CS
                                    </span>
                                  )}
                                  {stat.mvp && (
                                    <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-[9px] font-bold border border-yellow-500/30">
                                      MVP
                                    </span>
                                  )}
                                  {stat.hattrick && (
                                    <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold border border-purple-500/30">
                                      H
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-700">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-bold text-gray-200">Date</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Game ID</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Mode</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Team</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Number</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Score</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Goal</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Assist</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Points</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Status</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">View</th>
                          </tr>
                        </thead>
                        <tbody>
                          {playerStats
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((stat, index) => {
                              // Find the game to get mode and team info
                              const game = pastGames.find(g => g.gameId === stat.gameId);
                              const gameMode = game?.mode || 'Standard';
                              const player = game?.players.find(p => p.playerUsername === selectedPlayer?.playerUsername);
                              const points = player?.points ? parseFloat(player.points.replace(',', '.')) : 0;
                              
                              // Check if it's a Rush game
                              const isRushGame = (gameMode || '').toLowerCase().includes('rush');
                              
                              // Calculate win/loss/clean sheet for Rush games
                              let isWin = false;
                              let isLoss = false;
                              let isCleanSheet = false;
                              
                              if (isRushGame && stat.teamMiniGame > 0) {
                                const winRatio = stat.teamWin / stat.teamMiniGame;
                                const cleanSheetRatio = stat.teamCleanSheet / stat.teamMiniGame;
                                isWin = winRatio >= 0.5;
                                isLoss = !isWin; // If not a win, it's a loss
                                isCleanSheet = cleanSheetRatio >= 0.5;
                              } else {
                                // For non-Rush games, use the original logic
                                isWin = stat.teamWin === 1;
                                isLoss = stat.teamLoss === 1;
                                isCleanSheet = stat.teamCleanSheet === 1;
                              }
                              
                              return (
                                <tr key={`${stat.gameId}_${stat.date}`} className="border-b border-gray-600 hover:bg-gray-700 transition-colors">
                                  <td className="px-3 py-2 text-sm text-white whitespace-nowrap">
                                    {new Date(stat.date).toLocaleDateString('fr-FR', { 
                                      weekday: 'long',
                                      day: 'numeric', 
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </td>
                                  <td className="px-3 py-2 text-center text-sm text-white whitespace-nowrap">#{stat.gameId}</td>
                                  <td className="px-3 py-2 text-center whitespace-nowrap">
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-200">
                                      {gameMode}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      stat.team.toLowerCase() === 'orange' ? 'bg-orange-500 text-orange-100' :
                                      stat.team.toLowerCase() === 'blue' ? 'bg-blue-500 text-blue-100' :
                                      stat.team.toLowerCase() === 'jaune' ? 'bg-yellow-500 text-yellow-100' :
                                      stat.team.toLowerCase() === 'red' ? 'bg-red-500 text-red-100' :
                                      stat.team.toLowerCase() === 'green' ? 'bg-green-500 text-green-100' :
                                      'bg-gray-500 text-gray-100'
                                    }`}>
                                      {stat.team}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {stat.number ? (
                                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-white font-bold text-xs ${
                                        stat.team.toLowerCase() === 'orange' ? 'bg-orange-500' :
                                        stat.team.toLowerCase() === 'blue' ? 'bg-blue-500' :
                                        stat.team.toLowerCase() === 'jaune' ? 'bg-yellow-500' :
                                        stat.team.toLowerCase() === 'red' ? 'bg-red-500' :
                                        stat.team.toLowerCase() === 'green' ? 'bg-green-500' :
                                        'bg-gray-600'
                                      }`}>
                                        {stat.number}
                                      </span>
                                    ) : (
                                      <span className="text-gray-500">-</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="font-bold text-blue-400">{stat.score.toFixed(1)}</span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="font-bold text-green-400">{stat.goals}</span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="font-bold text-purple-400">{stat.assists}</span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {points !== 0 ? (
                                      <span className={`font-bold ${points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {points > 0 ? '+' : ''}{points.toFixed(1)}
                                      </span>
                                    ) : (
                                      <span className="text-gray-500">-</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <div className="flex justify-center gap-1">
                                      {isWin && (
                                        <span className="bg-green-500 text-green-900 px-1 py-0.5 rounded text-xs font-bold">
                                          V
                                        </span>
                                      )}
                                      {isLoss && (
                                        <span className="bg-red-500 text-red-900 px-1 py-0.5 rounded text-xs font-bold">
                                          L
                                        </span>
                                      )}
                                      {isCleanSheet && (
                                        <span className="bg-blue-500 text-blue-900 px-1 py-0.5 rounded text-xs font-bold">
                                          CS
                                        </span>
                                      )}
                                      {stat.mvp && (
                                        <span className="bg-yellow-500 text-yellow-900 px-1 py-0.5 rounded text-xs font-bold">
                                          MVP
                                        </span>
                                      )}
                                      {stat.hattrick && (
                                        <span className="bg-purple-500 text-purple-900 px-1 py-0.5 rounded text-xs font-bold">
                                          H
                                        </span>
                                      )}
                                      {!stat.mvp && !stat.hattrick && !isWin && !isLoss && !isCleanSheet && (
                                        <span className="text-gray-500 text-xs">-</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <button
                                      onClick={() => {
                                        if (game) {
                                          setSelectedGame(game);
                                          setIsStatsModalOpen(true);
                                        }
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      View
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                        </div>
                      </div>
                  </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Captain Dashboard Modal */}
        <Dialog open={isCaptainDashboardOpen} onOpenChange={setIsCaptainDashboardOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">C</span>
                </div>
                {selectedCaptain}
              </DialogTitle>
            </DialogHeader>
            
            {selectedCaptain && (
              <div className="space-y-2">

                {/* Captain Stats Overview - Compact */}
                <div className="bg-gradient-to-r from-red-900 to-red-950 rounded-lg p-2 border border-red-800">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-sm font-bold text-white">
                        {pastGames.filter(game => game.captain === selectedCaptain).length}
                      </div>
                      <div className="text-xs text-red-200">Matchs</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {Object.values(captainVotes).reduce((total, votes) => total + (votes.good || 0), 0)}
                      </div>
                      <div className="text-xs text-red-200">✓ Votes</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {Object.values(captainVotes).reduce((total, votes) => total + (votes.bad || 0), 0)}
                      </div>
                      <div className="text-xs text-red-200">✗ Votes</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {captainViews[selectedCaptain] || 0}
                      </div>
                      <div className="text-xs text-red-200">Vues</div>
                    </div>
                  </div>
                </div>

                {/* Captain Performance Chart */}
                <div className="bg-gray-800 rounded-lg p-2">
                  <h3 className="text-sm font-bold text-white mb-2">Performance par Match</h3>
                  
                  {/* Performance Chart */}
                  <div className="bg-gray-700 rounded-lg p-3 mb-3">
                    <div className="text-xs text-gray-300 mb-2">Différence Votes (✓ - ✗)</div>
                    <div className="relative h-32">
                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400">
                        <span>+5</span>
                        <span>+2</span>
                        <span>0</span>
                        <span>-2</span>
                        <span>-5</span>
                      </div>
                      
                      {/* Chart area */}
                      <div className="ml-8 mr-4 h-full relative">
                        {/* Grid lines */}
                        <div className="absolute inset-0">
                          <div className="h-full w-full flex flex-col justify-between">
                            {[0, 1, 2, 3, 4].map(i => (
                              <div key={i} className="border-t border-gray-600"></div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Zero line at Y=50% */}
                        <div className="absolute left-0 right-0 border-t-2 border-gray-500" style={{top: '50%'}}></div>
                        
                        {/* X-axis pins for game positions */}
                        {(() => {
                          const captainGames = pastGames
                            .filter(game => game.captain === selectedCaptain)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .slice(0, 10);
                          
                          return captainGames.map((game, index) => {
                            const x = captainGames.length === 1 ? 50 : (1 - index / (captainGames.length - 1)) * 100;
                            return (
                              <div
                                key={`pin-${game.gameId}_${game.date}`}
                                className="absolute w-px h-1 bg-gray-400"
                                style={{left: `${x}%`, bottom: '0'}}
                                title={`Game ${game.gameId}`}
                              />
                            );
                          });
                        })()}
                        
                        {/* Line chart */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          {(() => {
                            const captainGames = pastGames
                              .filter(game => game.captain === selectedCaptain)
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .slice(0, 10);
                            
                            if (captainGames.length === 0) return null;
                            
                            const points = captainGames.map((game, index) => {
                              const gameVoteKey = `${game.gameId}_${selectedCaptain}`;
                              const gameVotes = captainVotes[gameVoteKey] || { good: 0, bad: 0 };
                              const netScore = gameVotes.good - gameVotes.bad;
                              // Reverse X positioning so recent games are on the right
                              const x = captainGames.length === 1 ? 50 : (1 - index / (captainGames.length - 1)) * 100;
                              // Scale Y: -5 to +5 maps to 10 to 90 (with 50 as center)
                              const rawY = 50 - (netScore / 5) * 40;
                              const y = Math.max(10, Math.min(90, rawY));
                              return { x, y, netScore, game };
                            });
                            
                            const pathData = points.map((point, index) => 
                              `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                            ).join(' ');
                            
                            // Create smooth curve using quadratic Bézier curves
                            const createSmoothPath = (points: any[]) => {
                              if (points.length < 2) return '';
                              
                              let path = `M ${points[0].x} ${points[0].y}`;
                              
                              for (let i = 1; i < points.length; i++) {
                                const prev = points[i - 1];
                                const curr = points[i];
                                
                                // Calculate control point for smooth curve
                                const cp1x = prev.x + (curr.x - prev.x) * 0.3;
                                const cp1y = prev.y;
                                const cp2x = curr.x - (curr.x - prev.x) * 0.3;
                                const cp2y = curr.y;
                                
                                path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${curr.x} ${curr.y}`;
                              }
                              
                              return path;
                            };
                            
                            return (
                              <>
                                <path
                                  d={createSmoothPath(points)}
                                  fill="none"
                                  stroke="#ffffff"
                                  strokeWidth="1.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                {points.map((point, index) => (
                                  <line
                                    key={`point-${point.game.gameId}_${point.game.date}`}
                                    x1={point.x}
                                    y1={point.y}
                                    x2={point.x}
                                    y2={point.y + 3}
                                    stroke={point.netScore > 0 ? "#10b981" : point.netScore < 0 ? "#ef4444" : "#3b82f6"}
                                    strokeWidth="0.5"
                                    className="cursor-pointer"
                                  />
                                ))}
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                      
                      {/* X-axis labels positioned at pin locations */}
                      <div className="absolute bottom-0 left-8 right-4 h-6">
                        {(() => {
                          const lastGames = pastGames
                            .filter(game => game.captain === selectedCaptain)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .slice(0, 10);
                          
                          return lastGames.map((game, index) => {
                            const x = lastGames.length === 1 ? 50 : (1 - index / (lastGames.length - 1)) * 100;
                            return (
                              <div
                                key={`label-${game.gameId}_${game.date}`}
                                className="absolute text-xs text-gray-400 text-center"
                                style={{left: `${x}%`, transform: 'translateX(-50%)'}}
                              >
                                {game.gameId}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Captain's Past Games - Compact List */}
                  <div className="space-y-1">
                    {pastGames
                      .filter(game => game.captain === selectedCaptain)
                      .map((game, index) => {
                        const gameVoteKey = `${game.gameId}_${selectedCaptain}`;
                        const gameVotes = captainVotes[gameVoteKey] || { good: 0, bad: 0 };
                        return (
                      <div key={`${game.gameId}_${game.date}`} className="bg-gray-700 rounded p-2 border border-gray-600 hover:bg-gray-600 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 flex-1">
                            {/* Game ID Rectangle */}
                            <div className={`w-8 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                              gameVotes.good > gameVotes.bad ? 'bg-green-600' : 
                              gameVotes.good < gameVotes.bad ? 'bg-red-600' : 
                              'bg-blue-600'
                            }`}>
                              <span className="text-white font-bold text-xs">{game.gameId}</span>
                            </div>
                            
                            <div className="flex-1">
                              <div className="text-white font-semibold text-xs">
                                {formatDate(game.date)}
                              </div>
                              <div className="text-gray-400 text-xs">
                                {game.mode} • {game.totalPlayers} joueurs • {game.totalGoals} buts
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-gray-400">
                              MVP: {game.mvpPlayer?.playerUsername || 'N/A'}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <div className="text-green-400">
                                ✓ {gameVotes.good}
                              </div>
                              <div className="text-red-400">
                                ✗ {gameVotes.bad}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedGame(game);
                                setIsStatsModalOpen(true);
                                setIsCaptainDashboardOpen(false);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                            >
                              Voir
                            </button>
                          </div>
                        </div>
                      </div>
                    )})}
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