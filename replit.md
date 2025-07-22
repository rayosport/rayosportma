# Replit.md

## Overview

RayoSport is a full-stack web application that combines a modern React frontend with an Express.js backend API. The application serves as a sports community platform focusing on football/soccer games in Morocco, featuring game management, player statistics, and community engagement tools. The system integrates with Google Sheets for data management and includes both a main web application and a standalone API service.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Custom design system built on Radix UI primitives with Tailwind CSS
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom component library and theme support
- **Internationalization**: Custom i18n system supporting French and Arabic (RTL)

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Data Sources**: Google Sheets integration via CSV export
- **Caching**: In-memory caching with 5-minute TTL
- **Session Management**: Connect-pg-simple for PostgreSQL session storage

### Database Architecture
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon Database serverless PostgreSQL
- **Session Storage**: PostgreSQL-backed session management

## Key Components

### Data Management
- **Google Sheets Integration**: Fetches game data from public Google Sheets CSV export
- **Data Transformation**: CSV parsing with proper handling of quoted values and type conversion
- **Caching Strategy**: 5-minute in-memory cache with fallback to cached data on API errors
- **Response Metadata**: Includes source (api/cache), timestamps, and cache age information

### Authentication & User Management
- **User Schema**: Basic user table with username/password authentication
- **Storage Layer**: Abstracted storage interface with in-memory implementation for development
- **Session Management**: PostgreSQL-backed sessions with configurable expiration

### API Endpoints
- **Games API** (`/api/games`): Returns all game data with caching and metadata
- **Health Check** (`/`): Basic server status and endpoint information
- **Static Assets**: Served via Express with Vite integration in development

### Frontend Features
- **Responsive Design**: Mobile-first approach with custom breakpoints
- **Theme System**: Custom theme configuration with Radix UI integration
- **Animation System**: Custom reveal animations and parallax effects
- **Analytics Integration**: Google Analytics 4 with page view and event tracking
- **Loading States**: Custom loader with progress indication

## Data Flow

### Game Data Pipeline
1. **Data Source**: Google Sheets contains game information (GameID, Terrain, Date, City, Status, etc.)
2. **API Fetch**: Backend fetches CSV data from Google Sheets public URL
3. **Data Processing**: CSV parsing and transformation to JSON with proper type conversion
4. **Caching**: Processed data cached in memory for 5 minutes
5. **API Response**: Structured JSON response with metadata and game array
6. **Frontend Display**: React components consume API data for various sections

### User Interaction Flow
1. **Page Load**: Initial loading screen with progress animation
2. **Navigation**: Smooth scrolling navigation with active section tracking
3. **Language Toggle**: Dynamic language switching with RTL support for Arabic
4. **Analytics**: Automatic page view and user interaction tracking
5. **Error Handling**: Graceful error states with fallback content

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React 18, React Query, React Hook Form, Wouter
- **UI Components**: Radix UI primitives, Headless UI components
- **Styling**: Tailwind CSS with custom plugin integrations
- **Database**: Drizzle ORM, Neon Database, PostgreSQL drivers
- **Build Tools**: Vite, ESBuild, TypeScript compiler
- **Development**: TSX for TypeScript execution, various Vite plugins

### Third-Party Services
- **Google Sheets**: Public CSV export for data source
- **Google Analytics**: GA4 for user behavior tracking
- **Neon Database**: Serverless PostgreSQL hosting
- **Font Services**: Google Fonts for typography (Montserrat, Open Sans, Poppins)

### Development Tools
- **Linting**: TypeScript compiler with strict mode
- **Bundling**: Vite for development server and production builds
- **Database Management**: Drizzle Kit for schema management and migrations

## Deployment Strategy

### Production Build
- **Frontend**: Vite build process generates optimized static assets
- **Backend**: ESBuild bundles Node.js application for production
- **Database**: Drizzle push for schema deployment to production database

### Environment Configuration
- **Development**: Local development with Vite dev server and hot reload
- **Production**: Node.js application serving static files and API endpoints
- **Database**: Environment-based DATABASE_URL configuration

### Hosting Requirements
- **Runtime**: Node.js 20+ environment
- **Database**: PostgreSQL-compatible database service
- **Static Assets**: CDN-ready static file serving
- **Environment Variables**: DATABASE_URL, session secrets, analytics keys

## Changelog

```
Changelog:
- July 20, 2025. Fixed CSV column mapping after Score Manuel addition
  - Corrected all column indices after "Score Manuel" was added at index 8
  - Updated player data parsing to map: ID, Date&Time, Status, MODE, Game ID, PlayerUsername, Team, Number, Score Manuel, TScore, etc.
  - Implemented fallback logic: Score Manuel → TScore → Goals for ranking and display
  - Fixed both desktop table and mobile cards to show correct scores with appropriate labels
  - Enhanced scoring display to show "pts match" for Score Manuel or "pts" for TScore fallback
- July 20, 2025. Added Match Score ranking system for past games
  - Added "Score Manuel" column support for individual match scoring
  - Players now ranked by Match Score instead of goals in game details
  - Updated both desktop table and mobile cards to display Match Score prominently
  - Match Score shown with 1 decimal place precision for accurate ranking
  - Past games modal now uses same leaderboard-style UI format
- July 20, 2025. Replaced automatic refresh with manual refresh button
  - Removed automatic 120-second refresh that was disturbing card details
  - Added manual refresh button next to "Matchs à venir" title
  - Button shows loading state with spinning icon during refresh
  - Added last update timestamp display
  - Improved user control over data refresh timing
- July 20, 2025. Fixed Arena match visibility and city filtering
  - Added "Bouskoura" to city mapping for Arena matches
  - Resolved city filtering issue that was hiding Arena matches
  - Removed "6vs6" badge from Rayo Rush6 match cards
  - Enhanced debugging for city-based match filtering
- July 4, 2025. Enhanced game mode system with Rayo Battle support
  - Added Mode column detection for game type differentiation
  - Implemented 4-team structure for Rayo Battle matches (Red Dragons, Blue Sharks, Green Eagles, Gold Lions)  
  - Maintained 3-team structure for regular matches (Orange, Jaune, Blue)
  - Updated team creation logic with isRayoBattle parameter
  - Set proper player limits: 20 for Rayo Battle, 15 for regular matches
  - Updated pricing display format for Rayo Rush matches
- June 14, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```