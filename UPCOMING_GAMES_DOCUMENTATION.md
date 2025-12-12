# Upcoming Games Feature - Documentation

## Overview
The upcoming games feature displays future matches from a Google Sheets data source. It filters out past matches and only shows games that are scheduled for future dates/times.

## Data Source

### Primary Source: Google Sheets
- **Sheet Name**: WebsiteGame
- **Sheet ID (gid)**: `216631647`
- **CSV Export URL**: 
  ```
  https://docs.google.com/spreadsheets/d/e/2PACX-1vTi6A5hpJa5RYhn7u61CpwEkqMT5FaKbH8CNt0zpo1uPfSAknLzxK9dCYCE29g5x1q_srDJjXlvkuFb/pub?gid=216631647&single=true&output=csv
  ```

### Fallback Source: Static CSV File
- **Location**: `/staticfolder/WebsiteGame.csv`
- **Used when**: Google Sheets fails to load or returns an error

## Google Sheet Column Structure

The WebsiteGame sheet has the following column structure (columns A through N):

| Column | Letter | Field Name | Description | Data Type |
|--------|--------|------------|-------------|-----------|
| A | 0 | **GameID** | Unique identifier for each game/match | String |
| B | 1 | **Terrain** | Field/venue name where the match will be played | String |
| C | 2 | **Date** | Date and time of the match (format: "MM/DD/YYYY HH:MM:SS") | DateTime |
| D | 3 | **City** | City where the match takes place | String |
| E | 4 | **PlayerUsername** | Username of the player registered for this match | String |
| F | 5 | **Match** | Match number (legacy field, not heavily used) | String |
| G | 6 | **Team** | Team assignment (Orange, Jaune, Blue, Vert, or A/B/C/D) | String |
| H | 7 | **Number** | Player's jersey number for this match | Integer |
| I | 8 | **Capitaine** | Captain name for the match | String |
| J | 9 | **Mode** | Game mode (e.g., "rayo-classic-5", "Rayo Rush5") | String |
| K | 10 | **Price** | Price to participate in the match | Number |
| L | 11 | **PlayerPerTeam** | Number of players per team | Integer |
| M | 12 | **TeamQTY** | Number of teams in the match | Integer |
| N | 13 | **Level** | Skill level required (e.g., "Beginner", "Intermediate", "Advanced") | String |

## Data Processing Flow

### 1. Data Loading (`loadMatchesData` function)
- Fetches CSV data from Google Sheets with cache-busting parameters
- Validates that the response is actual CSV (not an HTML error page)
- Falls back to static CSV file if Google Sheets fails
- Parses CSV data using `parseMatchesCSV` function

### 2. CSV Parsing (`parseMatchesCSV` function)
The parser:
- Handles CSV with quoted values (e.g., prices like "7,5")
- Groups rows by `GameID` (multiple rows per game = multiple players)
- Filters out:
  - Rows with invalid GameID (#N/A, #REF!, #ERROR!)
  - Rows with invalid dates
  - **Past matches** (only shows future matches)

### 3. Match Object Creation
For each unique `GameID`, creates a `Match` object:

```typescript
interface Match {
  id: string;                    // "MATCH_{GameID}"
  gameId: string;                // From Column A
  city: string;                  // From Column D (converted to French)
  field: string;                 // From Column B
  date: string;                  // ISO date format (YYYY-MM-DD)
  time: string;                  // Time format (HH:MM (60min))
  format: string;                // Calculated: "5vs5", "3x5", "4x5", etc.
  status: "Complet" | "Besoin d'autres joueurs";  // Based on player count
  players: Player[];             // Array of registered players
  maxPlayers: number;            // Calculated: PlayerPerTeam × TeamQTY
  captain?: string;              // From Column I
  mode?: string;                 // From Column J
  price?: number;                // From Column K
  level?: string;                // From Column N
  teams?: Team[];                // Organized by team color
}
```

### 4. Player Object Creation
For each player row, creates a `Player` object:

```typescript
interface Player {
  id: string;                    // "{GameID}_{PlayerUsername}"
  username: string;              // From Column E
  fullName: string;              // Same as username
  team?: "Orange" | "Jaune" | "Blue" | "Yellow" | "Vert";  // From Column G
  jerseyNumber?: number;         // From Column H
  paymentStatus: "Non payé";     // Default (not in WebsiteGame sheet)
  // Note: WebsiteGame sheet doesn't have payment/score data
  // These fields default to 0 or undefined
  globalScore: 0;
  gamesPlayed: 0;
  ranking: 0;
  // ... other fields defaulted
}
```

### 5. Team Organization
- Players are grouped by team (Column G)
- Team colors are assigned:
  - Orange → #f97316
  - Jaune/Yellow → #eab308
  - Blue → #3b82f6
  - Vert/Green → #22c55e

### 6. Game Format Calculation
The format is calculated from `PlayerPerTeam` (Column L) and `TeamQTY` (Column M):
- 2 teams: `"5vs5"` (if 5 players per team)
- 3 teams: `"3x5"` (if 5 players per team)
- 4 teams: `"4x5"` (if 5 players per team)
- etc.

### 7. Status Calculation
- **"Complet"**: When `players.length >= maxPlayers`
- **"Besoin d'autres joueurs"**: When `players.length < maxPlayers`

## City Name Conversion
The system converts English city names to French:
- `Fez` → `Fès`
- `Tangier` → `Tanger`
- `Meknes` → `Meknès`
- etc.

## Date/Time Filtering
- Only matches with `matchDate > currentDate` are displayed
- Past matches are automatically filtered out during parsing
- Date format expected: `"MM/DD/YYYY HH:MM:SS"` or ISO format

## Key Features

### 1. Real-time Updates
- Data is fetched on component mount
- Cache-busting ensures fresh data
- Manual refresh button available

### 2. City Filtering
- Users can filter matches by city
- Default city is saved in localStorage
- City preference modal on first visit

### 3. Player Interaction
- Click on player to see player card
- Like/dislike players (stored in localStorage)
- View player statistics

### 4. Match Details
- Shows match date, time, location
- Displays registered players organized by team
- Shows match status (Complete/Need Players)
- Displays price and level requirements

## Custom Data Sources
The system supports custom data sources via `useCompanyContext`:
- `customDataSources.upcomingMatches` can override the default Google Sheets URL
- Falls back to `DEFAULT_MATCHES_SHEET_CONFIG.csvUrl` if not provided

## Error Handling
- If Google Sheets fails → tries static CSV file
- If static CSV fails → shows error message
- Invalid rows are skipped (logged to console)
- Invalid dates are skipped (logged to console)

## Component Location
- **File**: `client/src/components/sections/UpcomingMatchesSection.tsx`
- **Usage**: Used in `Football.tsx` page and other pages

## Related Files
- Static CSV fallback: `client/public/staticfolder/WebsiteGame.csv`
- Company context: `client/src/hooks/use-company-context.ts`
- City preference: `client/src/hooks/use-city-preference.ts`

