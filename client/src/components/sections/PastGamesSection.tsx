import { useState, useEffect, useMemo } from "react";
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
// Configuration for Past Games Google Sheets
const DEFAULT_PAST_GAMES_SHEET_CONFIG = {
  csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDgQfkyS5KdTwQABcUDgu673_fSDrwX0HNgGeZiZ5DbSK6UEmYIcUrWPGsAGN5yuL50M6I3rYIJInL/pub?gid=876296498&single=true&output=csv"
};

// Configuration for Leaderboard Google Sheets (for current rankings)
const DEFAULT_LEADERBOARD_SHEET_CONFIG = {
  csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSDgQfkyS5KdTwQABcUDgu673_fSDrwX0HNgGeZiZ5DbSK6UEmYIcUrWPGsAGN5yuL50M6I3rYIJInL/pub?gid=1779046147&single=true&output=csv',
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
  teamScore?: string;
  teamWin?: string;
  teamLoss?: string;
  teamCleanSheet?: string;
  teamMiniGame?: string;
  teamGoals?: string;
  teamGC?: string;
  captain?: string;
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

    // Map CSV columns to player data using dynamic column indices
    const player: PastGamePlayer = {
      id: row[getColumnIndex('ID')] || '',                    // ID
      date: row[getColumnIndex('Date&Time')] || '',           // Date&Time
      status: row[getColumnIndex('Status')] || '',            // Status
      mode: row[getColumnIndex('MODE')] || '',                // MODE
      city: row[getColumnIndex('City')] || '',                 // City
      terrain: row[getColumnIndex('Terrain')] || '',           // Terrain
      gameId: row[getColumnIndex('Game ID')] || '',           // Game ID
      playerUsername: row[getColumnIndex('PlayerUsername')] || '', // PlayerUsername
      team: row[getColumnIndex('Team')] || '',                // Team
      number: row[getColumnIndex('Number')] || '',           // Number
      scoreManuel: row[getColumnIndex('Score Manuel')] || '', // Score Manuel
      tScore: row[getColumnIndex('TScore')] || '',            // TScore
      tMatch: row[getColumnIndex('TMatch')] || '',           // TMatch
      tgoals: row[getColumnIndex('Tgoals')] || '',           // Tgoals
      soloScore: row[getColumnIndex('SoloScore')] || '',     // SoloScore
      tTeamScore: row[getColumnIndex('tTeamScore')] || '',   // tTeamScore
      att: row[getColumnIndex('ATT')] || '',                  // ATT
      def: row[getColumnIndex('DEF')] || '',                  // DEF
      rank: row[getColumnIndex('Rank')] || '',                // Rank
      goal: row[getColumnIndex('Goal')] || '',                // Goal
      assist: row[getColumnIndex('Assist')] || '',            // Assist
      hattrick: row[getColumnIndex('Hattrick')] || '',       // Hattrick
      ownGoal: row[getColumnIndex('OwnGoal')] || '',          // OwnGoal
      matchTotalScore: row[getColumnIndex('Match Total Score')] || '', // Match Total Score
      teamScore: row[getColumnIndex('TeamScore')] || '',      // TeamScore
      mvp: row[getColumnIndex('MVP')] || '',                  // MVP
      teamWin: row[getColumnIndex('TeamWin')] || '',          // TeamWin
      teamLoss: row[getColumnIndex('TeamLoss')] || '',        // TeamLoss
      teamCleanSheet: row[getColumnIndex('TeamCleanSheet')] || '', // TeamCleanSheet
      teamMiniGame: row[getColumnIndex('TeamMiniGame')] || '', // TeamMiniGame
      teamGoals: row[getColumnIndex('TeamGoals')] || '',      // TeamGoals
      teamGC: row[getColumnIndex('TeamGC')] || '',            // TeamGC
      captain: row[getColumnIndex('Capitaine')] || ''         // Capitaine
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

// Load leaderboard data to get current player rankings, global scores, goals per match rankings, assists per match rankings, and MVP per match rankings
const loadLeaderboardData = async (customDataSources?: any): Promise<{ rankings: Map<string, number>, globalScores: Map<string, number>, goalsPerMatchRankings: Map<string, number>, assistsPerMatchRankings: Map<string, number>, mvpPerMatchRankings: Map<string, number> }> => {
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
      return { rankings: new Map(), globalScores: new Map(), goalsPerMatchRankings: new Map(), assistsPerMatchRankings: new Map(), mvpPerMatchRankings: new Map() };
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
    
    // Extract player data
    const playersData = rows.slice(1)
      .filter(row => row[1] && row[1].trim() !== '' && row[1] !== '#VALUE!')
      .map((row: string[]) => {
        const playerUsername = row[2] || '';
        const globalScore = parseDecimal(row[5]) || 0;
        const goals = parseInt(row[7]) || 0;
        const assists = parseInt(row[8]) || 0;
        const gamesPlayed = parseInt(row[6]) || 0;
        
        // Find MVP count column dynamically
        let mvpCount = 0;
        const headers = rows[0] || [];
        const mvpCountIndex = headers.findIndex(h => h.includes('TMVP🔒'));
        if (mvpCountIndex !== -1 && row[mvpCountIndex]) {
          mvpCount = parseInt(row[mvpCountIndex]) || 0;
        }
        
        const goalsPerMatch = gamesPlayed > 0 ? goals / gamesPlayed : 0;
        const assistsPerMatch = gamesPlayed > 0 ? assists / gamesPlayed : 0;
        const mvpPerMatch = gamesPlayed > 0 ? mvpCount / gamesPlayed : 0;
        return { username: playerUsername, globalScore, goals, assists, gamesPlayed, goalsPerMatch, assistsPerMatch, mvpCount, mvpPerMatch };
      });
    
    // Sort by Global Score (descending order) and assign proper ranks
    const sortedByScore = playersData.sort((a, b) => b.globalScore - a.globalScore);
    
    // Sort by Goals Per Match (descending order) and assign proper ranks
    const sortedByGoalsPerMatch = [...playersData].sort((a, b) => b.goalsPerMatch - a.goalsPerMatch);
    
    // Sort by Assists Per Match (descending order) and assign proper ranks
    const sortedByAssistsPerMatch = [...playersData].sort((a, b) => b.assistsPerMatch - a.assistsPerMatch);
    
    // Sort by MVP Per Match (descending order) and assign proper ranks
    const sortedByMvpPerMatch = [...playersData].sort((a, b) => b.mvpPerMatch - a.mvpPerMatch);
    
    // Create mapping of username to current rank, global score, goals per match rank, assists per match rank, and MVP per match rank
    const rankMap = new Map<string, number>();
    const globalScoreMap = new Map<string, number>();
    const goalsPerMatchRankMap = new Map<string, number>();
    const assistsPerMatchRankMap = new Map<string, number>();
    const mvpPerMatchRankMap = new Map<string, number>();
    
    sortedByScore.forEach((player, index) => {
      if (player.username) {
        rankMap.set(player.username, index + 1);
        globalScoreMap.set(player.username, player.globalScore);
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
    
    console.log('📊 PastGamesSection: Loaded current rankings, global scores, goals per match rankings, assists per match rankings, and MVP per match rankings for', rankMap.size, 'players');
    return { rankings: rankMap, globalScores: globalScoreMap, goalsPerMatchRankings: goalsPerMatchRankMap, assistsPerMatchRankings: assistsPerMatchRankMap, mvpPerMatchRankings: mvpPerMatchRankMap };
    
  } catch (error) {
    console.error('Error loading leaderboard data for rankings:', error);
    return { rankings: new Map(), globalScores: new Map(), goalsPerMatchRankings: new Map(), assistsPerMatchRankings: new Map(), mvpPerMatchRankings: new Map() };
  }
};

// Load past games data from Google Sheets with static file fallback
const loadPastGamesData = async (customDataSources?: any): Promise<{ data: PastGame[], usedFallback: boolean }> => {
  try {
    // First, try to load from Google Sheets
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(7);
    const csvUrl = customDataSources?.pastGames || DEFAULT_PAST_GAMES_SHEET_CONFIG.csvUrl;
    const urlWithCache = `${csvUrl}&_t=${timestamp}&v=${random}&refresh=true`;
    
    console.log('🔍 PastGames fetching from:', urlWithCache);
    
          const response = await fetch(urlWithCache, {
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
  // Generate profile picture URL using DiceBear API (avatars style)
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  
  // Determine border style based on score
  const getBorderStyle = (score: number) => {
    if (score >= 9) {
      // Diamond/Platinum - Purple/Pink gradient with shimmer
      return {
        borderColor: 'from-purple-500 via-pink-500 to-purple-500',
        borderWidth: 'border-[3px]',
        shadow: 'shadow-purple-500/50',
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]',
        animation: 'animate-pulse'
      };
    } else if (score >= 7) {
      // Platinum - Cyan/Blue gradient
      return {
        borderColor: 'from-cyan-400 via-blue-500 to-cyan-400',
        borderWidth: 'border-[3px]',
        shadow: 'shadow-cyan-500/50',
        glow: 'shadow-[0_0_15px_rgba(6,182,212,0.5)]',
        animation: ''
      };
    } else if (score >= 5) {
      // Gold - Gold/Yellow gradient
      return {
        borderColor: 'from-yellow-400 via-amber-500 to-yellow-400',
        borderWidth: 'border-[2.5px]',
        shadow: 'shadow-yellow-500/50',
        glow: 'shadow-[0_0_12px_rgba(234,179,8,0.4)]',
        animation: ''
      };
    } else if (score >= 3) {
      // Silver - Gray/Silver gradient
      return {
        borderColor: 'from-gray-300 via-gray-400 to-gray-300',
        borderWidth: 'border-[2px]',
        shadow: 'shadow-gray-400/40',
        glow: 'shadow-[0_0_8px_rgba(156,163,175,0.3)]',
        animation: ''
      };
    } else {
      // Bronze - Brown/Copper gradient
      return {
        borderColor: 'from-amber-700 via-orange-600 to-amber-700',
        borderWidth: 'border-[2px]',
        shadow: 'shadow-amber-600/30',
        glow: 'shadow-[0_0_6px_rgba(217,119,6,0.2)]',
        animation: ''
      };
    }
  };

  const borderStyle = getBorderStyle(score);
  
  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 sm:w-12 sm:h-12',
    lg: 'w-16 h-16 sm:w-20 sm:h-20'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm sm:text-base',
    lg: 'text-lg sm:text-xl'
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
    <div className="relative inline-block" style={{ padding: `${borderWidth}px` }}>
      {/* Outer animated rotating border ring */}
      <div 
        className={`absolute inset-0 rounded-full ${borderStyle.shadow} ${borderStyle.glow}`}
        style={{
          background: `conic-gradient(from 0deg, ${getBorderColors(score)})`,
          padding: `${borderWidth}px`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          animation: 'spin-slow 3s linear infinite',
        }}
      ></div>
      
      {/* Static inner border for depth and glow effect */}
      <div 
        className="absolute rounded-full"
        style={{
          inset: `${borderWidth + 1}px`,
          border: `${Math.max(borderWidth * 0.5, 1)}px solid`,
          borderImage: `linear-gradient(135deg, ${getBorderColors(score).split(',')[0]}, ${getBorderColors(score).split(',')[1]}) 1`,
          opacity: 0.4,
          pointerEvents: 'none'
        }}
      ></div>
      
      {/* Avatar Container */}
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden z-10`}>
        <Avatar className={`w-full h-full ${sizeClasses[size]}`}>
          <AvatarImage 
            src={avatarUrl} 
            alt={username}
            className="w-full h-full object-cover"
          />
          <AvatarFallback className={`bg-gradient-to-br from-blue-500 via-purple-600 to-blue-600 ${textSizeClasses[size]} font-bold text-white`}>
            {username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      
      {/* Status indicator dot */}
      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-500 rounded-full border-2 border-gray-900 shadow-lg z-20"></div>
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

  // Save city selection to localStorage
  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setIsCityDropdownOpen(false);
    localStorage.setItem('pastGamesSelectedCity', city);
  };

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
  
  // Navigation functions for slider
  const nextSlide = () => {
    const maxSlide = Math.ceil(filteredGames.length / gamesPerSlide) - 1;
    setCurrentSlide(prev => prev < maxSlide ? prev + 1 : 0);
  };
  
  const prevSlide = () => {
    const maxSlide = Math.ceil(filteredGames.length / gamesPerSlide) - 1;
    setCurrentSlide(prev => prev > 0 ? prev - 1 : maxSlide);
  };
  
  // Get current slide games
  const getCurrentSlideGames = () => {
    const startIndex = currentSlide * gamesPerSlide;
    return filteredGames.slice(startIndex, startIndex + gamesPerSlide);
  };
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

  const refetch = async () => {
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
      
      if (pastGamesResult.usedFallback) {
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

  const handlePlayerClick = (player: PastGamePlayer) => {
    setSelectedPlayer(player);
    setIsPlayerAnalyticsOpen(true);
    trackEvent('player_analytics_click', 'user_action', player.playerUsername);
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
    
    // Filter by city (always filter by selected city)
    if (selectedCity) {
      filtered = filtered.filter(game => {
        const gameCity = game.city?.trim().toLowerCase();
        const selectedCityLower = selectedCity.toLowerCase();
        console.log(`🔍 Filtering: game.city="${game.city}" vs selectedCity="${selectedCity}"`);
        console.log(`🔍 Match: ${gameCity === selectedCityLower}`);
        return gameCity === selectedCityLower;
      });
    }
    
    // Filter by search
    if (searchPlayer.trim()) {
      filtered = filtered.filter(game => 
      game.players.some(player => 
        player.playerUsername.toLowerCase().includes(searchPlayer.toLowerCase())
      )
    );
    }
    
    console.log(`🔍 Filter results: ${filtered.length} games found for city "${selectedCity}"`);
    return filtered;
  }, [pastGames, searchPlayer, selectedCity]);

  // Get suggestions for autocomplete
  const suggestions = useMemo(() => {
    if (!searchPlayer.trim()) return [];
    
    return allPlayers.filter(player =>
      player.toLowerCase().includes(searchPlayer.toLowerCase())
    ).slice(0, 8);
  }, [allPlayers, searchPlayer]);

  // Get games to display (using slider logic)
  const displayedGames = filteredGames;

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
                  className="group flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
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
                <div className="group flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200 shadow-md hover:shadow-lg">
                  <div className="flex items-center gap-1.5 flex-1">
                    <div className="w-1.5 h-1.5 bg-gradient-to-r from-green-400 to-blue-400 rounded-full"></div>
              <input
                type="text"
                placeholder="Rechercher un joueur..."
                value={searchPlayer}
                      className="flex-1 bg-transparent text-white placeholder-gray-300 focus:outline-none text-xs font-medium"
                onChange={(e) => {
                  setSearchPlayer(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
                  </div>
                  <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
            </div>
            
              {/* Responsive Suggestions - Compact */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="w-full lg:w-auto">
                  {/* Desktop: Horizontal layout */}
                  <div className="hidden lg:flex gap-1.5 z-50">
                    {suggestions.slice(0, 3).map((player, index) => {
                      const playerData = pastGames.flatMap(game => game.players).find(p => p.playerUsername === player);
                      const matchCount = pastGames.filter(game => 
                        game.players.some(p => p.playerUsername === player)
                      ).length;
                      return (
                  <button
                    key={index}
                    onClick={() => handlePlayerSelect(player)}
                          className="flex items-center gap-1.5 px-2 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200 group min-w-0"
                        >
                          {/* Avatar */}
                          <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                            <span className="text-white text-xs font-bold">
                              {player.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          
                          {/* Player Username */}
                          <div className="text-xs font-medium text-white truncate">
                            {player}
                          </div>
                          
                          {/* Rank & Match Count Badges */}
                          {playerData && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                              #{currentRankings.get(player) || 'N/A'}
                              </div>
                              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                                {matchCount}M
                              </div>
              </div>
            )}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Mobile: Stacked layout */}
                  <div className="lg:hidden flex flex-col gap-1.5 z-50">
                    {suggestions.slice(0, 3).map((player, index) => {
                      const playerData = pastGames.flatMap(game => game.players).find(p => p.playerUsername === player);
                      const matchCount = pastGames.filter(game => 
                        game.players.some(p => p.playerUsername === player)
                      ).length;
                      return (
              <button
                          key={index}
                          onClick={() => handlePlayerSelect(player)}
                          className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200 group w-full"
                        >
                          {/* Avatar */}
                          <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                            <span className="text-white text-xs font-bold">
                              {player.charAt(0).toUpperCase()}
                            </span>
          </div>

                          {/* Player Info */}
                          <div className="flex-1 text-left">
                            <div className="text-xs font-medium text-white">{player}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-300">
                              <span>{currentRankings.get(player) ? `#${currentRankings.get(player)}` : 'N/A'}</span>
                              <span>•</span>
                              <span>{matchCount} matches</span>
                            </div>
                          </div>
                          
                          {/* Rank Badge */}
                          {playerData && (
                            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold flex-shrink-0">
                              #{currentRankings.get(player) || 'N/A'}
            </div>
          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1.5">
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
                                </div>
                                        </div>
                                        </div>
                                {/* Mobile: Compact single line layout */}
                                <div className="block md:hidden">
                                  <div className="flex items-center text-xs gap-1 flex-wrap">
                                    <div className="flex items-center gap-0.5">
                                      <span className="text-slate-500">Match</span>
                                      <span className="font-bold text-slate-900">{miniMatch}</span>
                                      </div>
                                    <span className="text-slate-500">-</span>
                                    <div className="flex items-center gap-0.5">
                                      <span className="text-slate-500">Win</span>
                                      <span className="font-bold text-green-600">{wins}</span>
                                    </div>
                                    <span className="text-slate-500">-</span>
                                    <div className="flex items-center gap-0.5">
                                      <span className="text-slate-500">Buts</span>
                                      <span className="font-bold text-blue-600">{goals}</span>
                                      </div>
                                    <span className="text-slate-500">-</span>
                                    <div className="flex items-center gap-0.5">
                                      <span className="text-slate-500">Enc</span>
                                      <span className="font-bold text-red-600">{goalsConceded}</span>
                                    </div>
                                    <span className="text-slate-500">-</span>
                                    <div className="flex items-center gap-0.5">
                                      <span className="text-slate-500">CS</span>
                                      <span className="font-bold text-purple-600">{cleanSheet}</span>
                                    </div>
                                    <span className="text-slate-500">-</span>
                                    <div className="flex items-center gap-0.5">
                                      <span className="text-slate-500">Score</span>
                                      <span className="font-bold text-orange-600">{score}</span>
                                    </div>
                                  </div>
                                </div>
                                {/* Desktop: Compact single line layout */}
                                <div className="hidden md:flex items-center text-xs gap-1 flex-wrap">
                                  <div className="flex items-center gap-0.5">
                                    <span className="text-slate-500">MiniMatch:</span>
                                    <span className="font-bold text-slate-900">{miniMatch}</span>
                                  </div>
                                  <span className="text-slate-500">-</span>
                                  <div className="flex items-center gap-0.5">
                                    <span className="text-slate-500">Win:</span>
                                    <span className="font-bold text-green-600">{wins}</span>
                                  </div>
                                  <span className="text-slate-500">-</span>
                                  <div className="flex items-center gap-0.5">
                                    <span className="text-slate-500">Buts:</span>
                                    <span className="font-bold text-blue-600">{goals}</span>
                                  </div>
                                  <span className="text-slate-500">-</span>
                                  <div className="flex items-center gap-0.5">
                                    <span className="text-slate-500">Enc.:</span>
                                    <span className="font-bold text-red-600">{goalsConceded}</span>
                                  </div>
                                  <span className="text-slate-500">-</span>
                                  <div className="flex items-center gap-0.5">
                                    <span className="text-slate-500">CS:</span>
                                    <span className="font-bold text-purple-600">{cleanSheet}</span>
                                  </div>
                                  <span className="text-slate-500">-</span>
                                  <div className="flex items-center gap-0.5">
                                    <span className="text-slate-500">Score:</span>
                                    <span className="font-bold text-orange-600">{score}</span>
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
                      <span className="text-white text-xs font-medium">{selectedGame?.totalGoals || 0} Buts</span>
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


                {/* Game Voting Section - Ultra Compact */}
                <div className="bg-gray-800/50 rounded-lg p-1.5 border border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white text-xs font-medium">
                      <FiTarget className="w-3 h-3 text-white" />
                      <span>Votez sur ce match</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleGameVote(selectedGame.gameId, selectedGame.date, 'good')}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-1.5 py-0.5 rounded text-xs font-medium transition-colors flex items-center gap-0.5 border border-green-500/30"
                      >
                        <FiThumbsUp className="w-2.5 h-2.5" />
                        <span>{gameVotes[`${selectedGame.gameId}_${selectedGame.date}`]?.good || 0}</span>
                      </button>
                      <button
                        onClick={() => handleGameVote(selectedGame.gameId, selectedGame.date, 'bad')}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-1.5 py-0.5 rounded text-xs font-medium transition-colors flex items-center gap-0.5 border border-red-500/30"
                      >
                        <FiThumbsDown className="w-2.5 h-2.5" />
                        <span>{gameVotes[`${selectedGame.gameId}_${selectedGame.date}`]?.bad || 0}</span>
                      </button>
                      <div className="text-gray-500 text-xs ml-1">
                        {gameViews[`${selectedGame.gameId}_${selectedGame.date}`] || 0} vues
                      </div>
                    </div>
                  </div>
                </div>

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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-red-800 rounded-full flex items-center justify-center border border-red-700">
                          <span className="text-white font-bold text-xs">C</span>
                        </div>
                        <div className="text-red-200 text-xs">Capitaine:</div>
                        <div className="text-white font-bold text-xs">
                          {selectedGame.captain}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCaptainVote(selectedGame.gameId, selectedGame.captain!, 'good');
                          }}
                          className="bg-green-900/20 border border-green-500/30 rounded-full px-2 py-1 flex items-center gap-1 hover:bg-green-800/30 hover:border-green-400/50 transition-all duration-200"
                        >
                          <span className="text-green-400 font-bold text-xs">✓</span>
                          <span className="text-green-300 font-medium text-xs">{captainVotes[`${selectedGame.gameId}_${selectedGame.captain}`]?.good || 0}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCaptainVote(selectedGame.gameId, selectedGame.captain!, 'bad');
                          }}
                          className="bg-red-900/20 border border-red-500/30 rounded-full px-2 py-1 flex items-center gap-1 hover:bg-red-800/30 hover:border-red-400/50 transition-all duration-200"
                        >
                          <span className="text-red-400 font-bold text-xs">✗</span>
                          <span className="text-red-300 font-medium text-xs">{captainVotes[`${selectedGame.gameId}_${selectedGame.captain}`]?.bad || 0}</span>
                        </button>
                      </div>
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
                              <th className="px-1.5 py-0.5 text-center text-xs font-bold text-gray-200">Buts</th>
                              <th className="px-1.5 py-0.5 text-center text-xs font-bold text-gray-200">Assists</th>
                              <th className="px-1.5 py-0.5 text-center text-xs font-bold text-gray-200">ATT</th>
                              <th className="px-1.5 py-0.5 text-center text-xs font-bold text-gray-200">DEF</th>
                              <th className="px-1.5 py-0.5 text-center text-xs font-bold text-gray-200">Status</th>
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
                                  className="font-semibold text-xs text-white cursor-pointer hover:text-blue-400 transition-colors"
                                  onClick={() => handlePlayerClick(player)}
                                >
                                  {player.playerUsername}
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
                                  player.team.toLowerCase() === 'jaune' ? 'bg-yellow-500 text-yellow-100' :
                                  player.team.toLowerCase() === 'red' ? 'bg-red-500 text-red-100' :
                                  player.team.toLowerCase() === 'green' ? 'bg-green-500 text-green-100' :
                                  'bg-gray-500 text-gray-100'
                                }`}>
                                  {player.team}
                                </span>
                              </td>
                              <td className="px-1.5 py-1 text-center">
                                <span className="font-bold text-sm text-blue-400">
                                  {player.matchTotalScore && player.matchTotalScore.trim() !== '' 
                                    ? parseFloat(player.matchTotalScore.replace(',', '.')).toFixed(1)
                                    : '-'}
                                </span>
                              </td>
                              <td className="px-1.5 py-1 text-center">
                                <span className="font-bold text-xs text-green-400">{player.goal || '0'}</span>
                              </td>
                              <td className="px-1.5 py-1 text-center">
                                <span className="font-bold text-xs text-purple-400">{player.assist || '0'}</span>
                              </td>
                              <td className="px-1.5 py-1 text-center">
                                <span className="font-bold text-xs text-orange-400">
                                  {player.att && player.att.trim() !== '' ? `${parseFloat(player.att.replace(',', '.')).toFixed(0)}%` : '-'}
                                </span>
                              </td>
                              <td className="px-1.5 py-1 text-center">
                                <span className="font-bold text-xs text-red-400">
                                  {player.def && player.def.trim() !== '' ? `${parseFloat(player.def.replace(',', '.')).toFixed(0)}%` : '-'}
                                </span>
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
                              className="font-semibold text-xs text-white cursor-pointer hover:text-blue-400 transition-colors truncate"
                              onClick={() => handlePlayerClick(player)}
                            >
                              {player.playerUsername}
                            </span>
                            <div className={`w-3 h-3 text-white rounded-full flex items-center justify-center text-xs font-bold ${
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
                              {player.matchTotalScore && player.matchTotalScore.trim() !== '' 
                                ? parseFloat(player.matchTotalScore.replace(',', '.')).toFixed(1)
                                : '-'}
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
                        <div className="flex items-center gap-0.5 text-center flex-shrink-0">
                          <div className="text-center min-w-0">
                            <div className="font-bold text-xs text-green-400">{player.goal || '0'}</div>
                            <div className="text-xs text-gray-400">BUT</div>
                          </div>
                          <div className="text-center min-w-0">
                            <div className="font-bold text-xs text-purple-400">{player.assist || '0'}</div>
                            <div className="text-xs text-gray-400">AST</div>
                          </div>
                          <div className="text-center min-w-0">
                            <div className="font-bold text-xs text-orange-400">
                              {player.att && player.att.trim() !== '' ? `${parseFloat(player.att.replace(',', '.')).toFixed(0)}%` : '-'}
                            </div>
                            <div className="text-xs text-gray-400">ATT</div>
                          </div>
                          <div className="text-center min-w-0">
                            <div className="font-bold text-xs text-red-400">
                              {player.def && player.def.trim() !== '' ? `${parseFloat(player.def.replace(',', '.')).toFixed(0)}%` : '-'}
                            </div>
                            <div className="text-xs text-gray-400">DEF</div>
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
                  team: player?.team || '',
                  score: player?.matchTotalScore ? parseFloat(player.matchTotalScore.replace(',', '.')) : 0,
                  goals: parseInt(player?.goal || '0'),
                  assists: parseInt(player?.assist || '0'),
                  attack: player?.att ? parseFloat(player.att.replace(',', '.')) : 0,
                  defense: player?.def ? parseFloat(player.def.replace(',', '.')) : 0,
                  mvp: player?.mvp === '1',
                  hattrick: player?.hattrick === '1',
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
              const avgAttack = playerStats.reduce((sum, stat) => sum + stat.attack, 0) / totalMatches;
              const avgDefense = playerStats.reduce((sum, stat) => sum + stat.defense, 0) / totalMatches;
              const bestScore = Math.max(...playerStats.map(stat => stat.score));
              const worstScore = Math.min(...playerStats.map(stat => stat.score));
              const scoreConsistency = totalMatches > 0 ? (1 - (Math.max(...playerStats.map(stat => stat.score)) - Math.min(...playerStats.map(stat => stat.score))) / 10) * 100 : 0;
              
              // Team Performance
              const teamWins = playerStats.reduce((sum, stat) => sum + stat.teamWin, 0);
              const teamLosses = playerStats.reduce((sum, stat) => sum + stat.teamLoss, 0);
              const teamWinRate = (teamWins + teamLosses) > 0 ? (teamWins / (teamWins + teamLosses)) * 100 : 0;
              const teamCleanSheets = playerStats.reduce((sum, stat) => sum + stat.teamCleanSheet, 0);
              const teamGoalsFor = playerStats.reduce((sum, stat) => sum + stat.teamGoals, 0);
              const teamGoalsAgainst = playerStats.reduce((sum, stat) => sum + stat.teamGC, 0);
              const teamGoalDifference = teamGoalsFor - teamGoalsAgainst;
              
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
                    totalGoals: 0,
                    totalAssists: 0,
                    totalMvp: 0,
                    totalMatches: 0,
                    matchCount: 0
                  };
                }
                acc[player.playerUsername].totalScore += player.matchTotalScore ? parseFloat(player.matchTotalScore.replace(',', '.')) : 0;
                acc[player.playerUsername].totalGoals += parseInt(player.goal || '0');
                acc[player.playerUsername].totalAssists += parseInt(player.assist || '0');
                acc[player.playerUsername].totalMvp += player.mvp === '1' ? 1 : 0;
                acc[player.playerUsername].totalMatches += 1;
                acc[player.playerUsername].matchCount += 1;
                return acc;
              }, {} as Record<string, any>);

              const playerStatsForRanking = Object.values(uniquePlayers).map((p: any) => ({
                username: p.username,
                avgScore: p.totalMatches > 0 ? p.totalScore / p.totalMatches : 0,
                goalsPerMatch: p.totalMatches > 0 ? p.totalGoals / p.totalMatches : 0,
                assistsPerMatch: p.totalMatches > 0 ? p.totalAssists / p.totalMatches : 0,
                mvpRate: p.totalMatches > 0 ? (p.totalMvp / p.totalMatches) * 100 : 0,
                totalMatches: p.totalMatches
              }));

              // Sort and rank players
              const scoreRanking = [...playerStatsForRanking].sort((a, b) => b.avgScore - a.avgScore);
              const goalsRanking = [...playerStatsForRanking].sort((a, b) => b.goalsPerMatch - a.goalsPerMatch);
              const assistsRanking = [...playerStatsForRanking].sort((a, b) => b.assistsPerMatch - a.assistsPerMatch);
              const mvpRanking = [...playerStatsForRanking].sort((a, b) => b.mvpRate - a.mvpRate);
              const matchesRanking = [...playerStatsForRanking].sort((a, b) => b.totalMatches - a.totalMatches);

              // Find current player's rankings
              const currentPlayerUsername = selectedPlayer?.playerUsername || '';
              const scoreRank = scoreRanking.findIndex(p => p.username === currentPlayerUsername) + 1;
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
                  {/* Enhanced Player Summary */}
                  <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-2 sm:p-3 mb-2 sm:mb-3 border border-gray-700/30 shadow-xl">
                    {/* Header Section - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <PlayerAvatarWithDynamicBorder 
                          username={selectedPlayer?.playerUsername || 'Player'}
                          score={avgScore}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-sm sm:text-lg font-bold text-white mb-0.5 truncate">{selectedPlayer?.playerUsername || 'Player'}</h2>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
                                <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30 w-fit">Professional</span>
                                <span className="text-xs text-gray-400">{totalMatches} matches</span>
                              </div>
                            </div>
                            {/* Mobile Like/Dislike Buttons */}
                            <div className="flex items-center gap-1 sm:hidden">
                              <button 
                                onClick={() => handleVote(selectedPlayer?.playerUsername || '', 'like')}
                                className={`flex items-center gap-0.5 px-1 py-0.5 border rounded transition-all duration-200 ${
                                  getPlayerStats(selectedPlayer?.playerUsername || '').userVote === 'like'
                                    ? 'bg-green-500/20 border-green-400/50 text-green-300'
                                    : 'bg-gray-800/50 hover:bg-gray-700/50 border-gray-600/30 hover:border-gray-500/50 text-white'
                                }`}
                              >
                                <svg className="w-2.5 h-2.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.818a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
                                </svg>
                                <span className="text-xs font-medium">{getPlayerStats(selectedPlayer?.playerUsername || '').likes}</span>
                              </button>
                              
                              <button 
                                onClick={() => handleVote(selectedPlayer?.playerUsername || '', 'dislike')}
                                className={`flex items-center gap-0.5 px-1 py-0.5 border rounded transition-all duration-200 ${
                                  getPlayerStats(selectedPlayer?.playerUsername || '').userVote === 'dislike'
                                    ? 'bg-red-500/20 border-red-400/50 text-red-300'
                                    : 'bg-gray-800/50 hover:bg-gray-700/50 border-gray-600/30 hover:border-gray-500/50 text-white'
                                }`}
                              >
                                <svg className="w-2.5 h-2.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.333v-5.818a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4L13.2 12.067a4 4 0 00.8-2.4z"/>
                                </svg>
                                <span className="text-xs font-medium">{getPlayerStats(selectedPlayer?.playerUsername || '').dislikes}</span>
                              </button>
                              
                              <div className="flex items-center gap-0.5 px-1 py-0.5 bg-gray-800/50 border border-gray-600/30 rounded text-white">
                                <svg className="w-2.5 h-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span className="text-xs font-medium text-gray-300">{getPlayerStats(selectedPlayer?.playerUsername || '').views}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Social Stats - Desktop Only */}
                      <div className="hidden sm:flex items-center gap-0.5 sm:gap-1 flex-wrap">
                          <button 
                            onClick={() => handleVote(selectedPlayer?.playerUsername || '', 'like')}
                            className={`flex items-center gap-0.5 px-1.5 py-0.5 border rounded transition-all duration-200 ${
                              getPlayerStats(selectedPlayer?.playerUsername || '').userVote === 'like'
                                ? 'bg-green-500/20 border-green-400/50 text-green-300'
                                : 'bg-gray-800/50 hover:bg-gray-700/50 border-gray-600/30 hover:border-gray-500/50 text-white'
                            }`}
                          >
                            <svg className="w-2.5 h-2.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.818a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
                            </svg>
                            <span className="text-xs font-medium">{getPlayerStats(selectedPlayer?.playerUsername || '').likes}</span>
                          </button>
                          
                          <button 
                            onClick={() => handleVote(selectedPlayer?.playerUsername || '', 'dislike')}
                            className={`flex items-center gap-0.5 px-1.5 py-0.5 border rounded transition-all duration-200 ${
                              getPlayerStats(selectedPlayer?.playerUsername || '').userVote === 'dislike'
                                ? 'bg-red-500/20 border-red-400/50 text-red-300'
                                : 'bg-gray-800/50 hover:bg-gray-700/50 border-gray-600/30 hover:border-gray-500/50 text-white'
                            }`}
                          >
                            <svg className="w-2.5 h-2.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.333v-5.818a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4L13.2 12.067a4 4 0 00.8-2.4z"/>
                            </svg>
                            <span className="text-xs font-medium">{getPlayerStats(selectedPlayer?.playerUsername || '').dislikes}</span>
                          </button>
                          
                          <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-800/30 border border-gray-600/20 rounded">
                            <svg className="w-2.5 h-2.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="text-xs text-gray-300 font-medium">{getPlayerStats(selectedPlayer?.playerUsername || '').views}</span>
                          </div>
                        </div>
                    </div>

                    {/* Main Stats Grid - Mobile First */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-2 mb-2">
                      {/* Physical Info */}
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-gray-700/30">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full"></div>
                          <span className="text-xs font-semibold text-gray-300">Physical</span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">H</span>
                            <span className="text-xs font-medium text-white">N/A</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">W</span>
                            <span className="text-xs font-medium text-white">N/A</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Age</span>
                            <span className="text-xs font-medium text-white">N/A</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Foot</span>
                            <span className="text-xs font-medium text-white">N/A</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Pos</span>
                            <span className="text-xs font-medium text-white">N/A</span>
                          </div>
                        </div>
                      </div>

                      {/* Technical Skills */}
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-gray-700/30">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-500 rounded-full"></div>
                          <span className="text-xs font-semibold text-gray-300">Technical</span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">ATT</span>
                            <span className="text-xs font-medium text-gray-400">N/A</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">DEF</span>
                            <span className="text-xs font-medium text-gray-400">N/A</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Balance</span>
                            <span className="text-xs font-medium text-gray-400">N/A</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Overall</span>
                            <span className="text-xs font-medium text-gray-400">N/A</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Grade</span>
                            <span className="text-xs font-medium text-gray-400">N/A</span>
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
                            <span className="text-xs text-gray-400">But avg</span>
                            <span className={`text-xs font-medium ${
                              goalsPerMatch >= 1.5 ? 'text-green-400' :
                              goalsPerMatch >= 1.0 ? 'text-yellow-400' :
                              goalsPerMatch >= 0.5 ? 'text-orange-400' : 'text-red-400'
                            }`}>{goalsPerMatch.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Pass avg</span>
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
                            }`}>{(mvpCount / totalMatches).toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">ATT</span>
                            <span className={`text-xs font-medium ${
                              avgAttack >= 80 ? 'text-green-400' :
                              avgAttack >= 60 ? 'text-yellow-400' :
                              avgAttack >= 40 ? 'text-orange-400' : 'text-red-400'
                            }`}>{avgAttack.toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">DEF</span>
                            <span className={`text-xs font-medium ${
                              avgDefense >= 80 ? 'text-green-400' :
                              avgDefense >= 60 ? 'text-yellow-400' :
                              avgDefense >= 40 ? 'text-orange-400' : 'text-red-400'
                            }`}>{avgDefense.toFixed(0)}%</span>
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
                            <span className="text-xs text-gray-400">Score</span>
                            <span className={`text-xs font-medium ${
                              (globalScores.get(selectedPlayer?.playerUsername || '') || 0) >= 100 ? 'text-green-400' :
                              (globalScores.get(selectedPlayer?.playerUsername || '') || 0) >= 50 ? 'text-yellow-400' :
                              (globalScores.get(selectedPlayer?.playerUsername || '') || 0) >= 20 ? 'text-orange-400' : 'text-red-400'
                            }`}>{globalScores.get(selectedPlayer?.playerUsername || '') || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">But</span>
                            <span className={`text-xs font-medium ${
                              totalGoals >= 20 ? 'text-green-400' :
                              totalGoals >= 10 ? 'text-yellow-400' :
                              totalGoals >= 5 ? 'text-orange-400' : 'text-red-400'
                            }`}>{totalGoals}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Pass</span>
                            <span className={`text-xs font-medium ${
                              totalAssists >= 15 ? 'text-green-400' :
                              totalAssists >= 8 ? 'text-yellow-400' :
                              totalAssists >= 3 ? 'text-orange-400' : 'text-red-400'
                            }`}>{totalAssists}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">MVP</span>
                            <span className={`text-xs font-medium ${
                              mvpCount >= 5 ? 'text-green-400' :
                              mvpCount >= 3 ? 'text-yellow-400' :
                              mvpCount >= 1 ? 'text-orange-400' : 'text-red-400'
                            }`}>{mvpCount}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Match</span>
                            <span className={`text-xs font-medium ${
                              totalMatches >= 20 ? 'text-green-400' :
                              totalMatches >= 10 ? 'text-yellow-400' :
                              totalMatches >= 5 ? 'text-orange-400' : 'text-red-400'
                            }`}>{totalMatches}</span>
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
                            <span className="text-xs text-gray-400">Win Rate</span>
                            <span className={`text-xs font-medium ${
                              teamWinRate >= 70 ? 'text-green-400' :
                              teamWinRate >= 50 ? 'text-yellow-400' :
                              teamWinRate >= 30 ? 'text-orange-400' : 'text-red-400'
                            }`}>{teamWinRate.toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Wins</span>
                            <span className={`text-xs font-medium ${
                              teamWins >= 10 ? 'text-green-400' :
                              teamWins >= 5 ? 'text-yellow-400' :
                              teamWins >= 2 ? 'text-orange-400' : 'text-red-400'
                            }`}>{teamWins}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Clean</span>
                            <span className={`text-xs font-medium ${
                              teamCleanSheets >= 5 ? 'text-green-400' :
                              teamCleanSheets >= 3 ? 'text-yellow-400' :
                              teamCleanSheets >= 1 ? 'text-orange-400' : 'text-red-400'
                            }`}>{teamCleanSheets}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">GF</span>
                            <span className={`text-xs font-medium ${
                              teamGoalsFor >= 20 ? 'text-green-400' :
                              teamGoalsFor >= 10 ? 'text-yellow-400' :
                              teamGoalsFor >= 5 ? 'text-orange-400' : 'text-red-400'
                            }`}>{teamGoalsFor}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">GD</span>
                            <span className={`text-xs font-medium ${
                              teamGoalDifference >= 10 ? 'text-green-400' :
                              teamGoalDifference >= 5 ? 'text-yellow-400' :
                              teamGoalDifference >= 0 ? 'text-orange-400' : 'text-red-400'
                            }`}>{teamGoalDifference}</span>
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
                            <span className="text-xs text-gray-400">Score</span>
                            <span className={`text-xs font-medium ${
                              (currentRankings.get(selectedPlayer?.playerUsername || '') || 0) <= 5 ? 'text-green-400' :
                              (currentRankings.get(selectedPlayer?.playerUsername || '') || 0) <= 10 ? 'text-yellow-400' :
                              (currentRankings.get(selectedPlayer?.playerUsername || '') || 0) <= 20 ? 'text-orange-400' : 'text-red-400'
                            }`}>#{currentRankings.get(selectedPlayer?.playerUsername || '') || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">But Avg</span>
                            <span className={`text-xs font-medium ${
                              (goalsPerMatchRankings.get(selectedPlayer?.playerUsername || '') || 0) <= 5 ? 'text-green-400' :
                              (goalsPerMatchRankings.get(selectedPlayer?.playerUsername || '') || 0) <= 10 ? 'text-yellow-400' :
                              (goalsPerMatchRankings.get(selectedPlayer?.playerUsername || '') || 0) <= 20 ? 'text-orange-400' : 'text-red-400'
                            }`}>#{goalsPerMatchRankings.get(selectedPlayer?.playerUsername || '') || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Pass Avg</span>
                            <span className={`text-xs font-medium ${
                              (assistsPerMatchRankings.get(selectedPlayer?.playerUsername || '') || 0) <= 5 ? 'text-green-400' :
                              (assistsPerMatchRankings.get(selectedPlayer?.playerUsername || '') || 0) <= 10 ? 'text-yellow-400' :
                              (assistsPerMatchRankings.get(selectedPlayer?.playerUsername || '') || 0) <= 20 ? 'text-orange-400' : 'text-red-400'
                            }`}>#{assistsPerMatchRankings.get(selectedPlayer?.playerUsername || '') || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">MVP Avg</span>
                            <span className={`text-xs font-medium ${
                              (mvpPerMatchRankings.get(selectedPlayer?.playerUsername || '') || 0) <= 5 ? 'text-green-400' :
                              (mvpPerMatchRankings.get(selectedPlayer?.playerUsername || '') || 0) <= 10 ? 'text-yellow-400' :
                              (mvpPerMatchRankings.get(selectedPlayer?.playerUsername || '') || 0) <= 20 ? 'text-orange-400' : 'text-red-400'
                            }`}>#{mvpPerMatchRankings.get(selectedPlayer?.playerUsername || '') || 'N/A'}</span>
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

                  {/* Performance Progression Charts - Mobile Optimized */}
                  <div className="bg-gray-800 rounded-lg px-1 py-2 sm:p-4">
                    <h3 className="font-bold text-base sm:text-lg text-white mb-2 sm:mb-4 pl-1 sm:pl-0">📈 Performance Progression</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-6">
                      {/* Score Trend Line Chart */}
                      <div className="rounded-lg pl-0 pr-1 py-1 sm:p-4">
                        <div className="flex justify-between items-center mb-1.5 sm:mb-3">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-xs sm:text-base text-gray-300 font-medium">Score Trend</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="text-gray-400 hover:text-gray-300 transition-colors">
                                    <FiInfo className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 border-gray-700 text-gray-200 max-w-xs">
                                  <p className="text-sm">This chart shows your performance score over the last 10 matches. The score (out of 10) reflects your overall performance including goals, assists, attack, and defense contributions.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-400">
                            {improvement > 0 ? `+${improvement.toFixed(1)}` : improvement.toFixed(1)} ↑
                              </span>
                        </div>
                        <div className="relative h-32 sm:h-48 rounded pl-0 pr-0.5 py-0.5 sm:p-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={playerStats.slice(-10).map((stat, index) => {
                                const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                                return {
                                  game: isMobile ? `${index + 1}` : `#${stat.gameId}`,
                                  score: stat.score,
                                  date: stat.date
                                };
                              })}
                              margin={{ top: 0, right: 0, left: -5, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
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
                                domain={[0, 10]}
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
                                formatter={(value: number) => [value.toFixed(2), 'Score']}
                              />
                              <Area
                                type="monotone"
                                dataKey="score"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fill="url(#scoreGradient)"
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
                            <BarChart
                              data={playerStats.slice(-10).map((stat, index) => ({
                                game: `${index + 1}`,
                                goals: stat.goals,
                                date: stat.date
                              }))}
                              margin={{ top: 0, right: 0, left: -5, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="goalsGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
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
                              <Bar
                                dataKey="goals"
                                fill="url(#goalsGradient)"
                                radius={[4, 4, 0, 0]}
                                animationDuration={800}
                              />
                            </BarChart>
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
                            <BarChart
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
                                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3}/>
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
                              <Bar
                                dataKey="matches"
                                fill="url(#matchesGradient)"
                                radius={[4, 4, 0, 0]}
                                animationDuration={800}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                    </div>
                  </div>



                  {/* Complete Match History Table - Mobile Optimized */}
                  <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                    <h3 className="font-bold text-base sm:text-lg text-white mb-3 sm:mb-4">📅 Complete Match History</h3>
                    {/* Mobile Cards View */}
                    <div className="block sm:hidden space-y-1.5">
                      {playerStats
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 5)
                        .map((stat, index) => (
                          <div key={`mobile-${stat.gameId}_${stat.date}`} className="bg-gray-700 rounded-lg p-2 border border-gray-600">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-xs font-semibold text-white">#{stat.gameId}</div>
                                <div className="text-xs text-gray-400">
                                  {new Date(stat.date).toLocaleDateString('fr-FR', { 
                                    day: 'numeric', 
                                    month: 'short'
                                  })}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-xs font-bold text-blue-400">{stat.score.toFixed(1)}</div>
                                <div className="flex gap-1 text-xs">
                                  <span className="text-green-400 font-bold">{stat.goals}G</span>
                                  <span className="text-purple-400 font-bold">{stat.assists}A</span>
                                  <span className="text-orange-400 font-bold">{stat.teamWin || 'N/A'}W</span>
                                  <span className="text-red-400 font-bold">{stat.teamLoss || 'N/A'}L</span>
                                </div>
                                <button
                                  onClick={() => {
                                    const game = pastGames.find(g => g.gameId === stat.gameId);
                                    if (game) {
                                      setSelectedGame(game);
                                      setIsStatsModalOpen(true);
                                    }
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded transition-colors duration-200 flex items-center justify-center"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-700">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-bold text-gray-200">Date</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Game</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Mode</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Team</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Score</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">G</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">A</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Team Score</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Team Win</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Team Loss</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Clean Sheet</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Mini Game</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Team Goals</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Team GC</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Status</th>
                            <th className="px-3 py-2 text-center text-xs font-bold text-gray-200">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {playerStats
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((stat, index) => {
                              // Find the game to get mode and team info
                              const game = pastGames.find(g => g.gameId === stat.gameId);
                              const gameMode = game?.mode || 'Standard';
                              const teamInfo = game?.teams[stat.team.toLowerCase()] || null;
                              
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
                                    <span className="font-bold text-blue-400">{stat.score.toFixed(1)}</span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="font-bold text-green-400">{stat.goals}</span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="font-bold text-purple-400">{stat.assists}</span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="font-bold text-blue-400">{stat.teamScore || 'N/A'}</span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="font-bold text-green-400">{stat.teamWin || 'N/A'}</span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="font-bold text-red-400">{stat.teamLoss || 'N/A'}</span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="font-bold text-yellow-400">{stat.teamCleanSheet || 'N/A'}</span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="font-bold text-purple-400">{stat.teamMiniGame || 'N/A'}</span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="font-bold text-green-400">{stat.teamGoals || 'N/A'}</span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="font-bold text-red-400">{stat.teamGC || 'N/A'}</span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <div className="flex justify-center gap-1">
                                      {stat.mvp && (
                                        <span className="bg-yellow-500 text-yellow-900 px-1 py-0.5 rounded text-xs font-bold">
                                          MVP
                              </span>
                            )}
                                      {stat.hattrick && (
                                        <span className="bg-green-500 text-green-900 px-1 py-0.5 rounded text-xs font-bold">
                                          H
                              </span>
                            )}
                          </div>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <button
                                      onClick={() => {
                                        const game = pastGames.find(g => g.gameId === stat.gameId);
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
                                      Détails
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