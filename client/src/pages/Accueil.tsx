import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";
import Footer from "@/components/layout/Footer";
import { trackEvent } from "@/lib/analytics";
import { FiCheckCircle } from "react-icons/fi";
import LeaderboardSectionComponent from "@/components/sections/LeaderboardSection";

const Accueil = () => {
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [sheetData, setSheetData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    trackEvent('page_view', 'navigation', 'accueil_page');
  }, []);

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = '/images/gallery/optimized/ss.jpg';
  }, []);

  // Fetch cities data (same as Football page) - optimized with caching
  useEffect(() => {
    const fetchSheetData = async () => {
      try {
        // Try direct fetch first (faster, no proxy latency)
        const sheetUrl = 'https://rayobackend.onrender.com/api/sheets/Total';
        let response: Response;
        
        try {
          // Try direct fetch first (faster)
          response = await fetch(sheetUrl, { 
            cache: 'default' // Allow browser caching
          });
          
          if (!response.ok) throw new Error('Direct fetch failed');
        } catch (directError) {
          // Fallback to CORS proxy if direct fetch fails
          const proxyUrl = 'https://api.allorigins.win/raw?url=';
          const encodedUrl = encodeURIComponent(sheetUrl);
          response = await fetch(proxyUrl + encodedUrl, { 
            cache: 'default' // Allow browser caching even with proxy
          });
        }
        
        const csvText = await response.text();
        
        // Parse CSV data - Updated to dynamically fetch all cities
        const parseCSV = (csvText: string) => {
          const lines = csvText.split('\n').filter(line => line.trim());
          const citiesData: Array<{name: string, players: number, gamesPerWeek: number}> = [];
          
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
            
            if (values.length >= 10) {
              const city = values[0]; // Column A - City name
              const players = parseInt(values[8]) || 0; // Column I - Players
              const gamesPerWeek = parseInt(values[9]) || 0; // Column J - Games per week
              
              // Only add cities with valid data
              if (city && city.trim() !== '' && (players > 0 || gamesPerWeek > 0)) {
                citiesData.push({
                  name: city.trim(),
                  players: players,
                  gamesPerWeek: gamesPerWeek
                });
              }
            }
          }
          
          return { cities: citiesData };
        };
        
        const parsedData = parseCSV(csvText);
        setSheetData(parsedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Sheet Total data:', error);
        // Set fallback values
        setSheetData({
          cities: [
            { name: "Casablanca", players: 800, gamesPerWeek: 4 },
            { name: "Marrakech", players: 200, gamesPerWeek: 2 },
            { name: "Tanger", players: 50, gamesPerWeek: 0 }
          ]
        });
        setLoading(false);
      }
    };

    fetchSheetData();
  }, []);

  // Fetch leaderboard data for search
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const sheetUrl = 'https://rayobackend.onrender.com/api/sheets/Foot_Players';
        let response: Response;
        
        try {
          response = await fetch(sheetUrl, { cache: 'default' });
          if (!response.ok) throw new Error('Direct fetch failed');
        } catch (directError) {
          const proxyUrl = 'https://api.allorigins.win/raw?url=';
          const encodedUrl = encodeURIComponent(sheetUrl);
          response = await fetch(proxyUrl + encodedUrl, { cache: 'default' });
        }
        
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) return;
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
        const players: any[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          const values = line.split(',').map(v => v.trim().replace(/\r/g, ''));
          if (values.length >= 3) {
            const username = values[headers.indexOf('Username')] || values[2];
            const firstName = values[headers.indexOf('FirstName')] || values[1];
            const rank = parseInt(values[headers.indexOf('Rank')] || values[0]) || 0;
            const gamesPlayed = parseInt(values[headers.indexOf('GamesPlayed')] || '0') || 0;
            
            if (username) {
              players.push({ username, firstName, rank, gamesPlayed });
            }
          }
        }
        
        setLeaderboardData(players);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      }
    };
    
    fetchLeaderboardData();
  }, []);

  // Search functionality
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length >= 2) {
      const filtered = leaderboardData.filter(player => 
        player.username.toLowerCase().includes(value.toLowerCase()) ||
        player.firstName.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
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
    trackEvent('hero_search_player_select', 'user_engagement', player.username);
    window.location.href = `/football#player-${player.username}`;
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      trackEvent('hero_search_player_submit', 'user_engagement', searchQuery);
      window.location.href = `/football#player-${searchQuery.trim()}`;
      setSearchQuery("");
      setShowSuggestions(false);
    }
  };

  // Show loading screen while image loads
  if (!imageLoaded) {
    return (
      <div className="fixed inset-0 bg-jetblack flex flex-col items-center justify-center z-50">
        <style>{`
          @keyframes handSweep { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes tick { 0%, 90% { opacity: .25; } 95% { opacity: 1; } 100% { opacity: .25; } }
          @keyframes buttonPulse { 0% { transform: scale(1); opacity: .4; } 50% { transform: scale(1.15); opacity: .9; } 100% { transform: scale(1); opacity: .4; } }
          @keyframes dialGlow { 0%, 100% { opacity: .16; } 50% { opacity: .28; } }
        `}</style>
        <div className="relative w-[164px] h-[164px] mb-4">
          <svg viewBox="0 0 164 164" className="w-full h-full">
            <defs>
              <radialGradient id="dialBgAccueil" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#0f0f0f" />
                <stop offset="100%" stopColor="#0b0b0b" />
              </radialGradient>
            </defs>
            <circle cx="82" cy="88" r="64" fill="url(#dialBgAccueil)" stroke="#1f2937" strokeWidth="2" />
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
        <h2 className="text-xl md:text-2xl font-bold text-white">RAYO SPORT</h2>
        <p className="text-white mt-1">Chargement...</p>
      </div>
    );
  }

  const handleVoteClick = () => {
    trackEvent('vote_click', 'user_engagement', 'accueil_hero');
    window.location.href = '/football';
  };

  return (
    <main className="overflow-hidden">
      {/* Hero Section - Same top section as Football page without city cards */}
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
                {/* Left side: Logo + Buttons + Search */}
                <div className="flex flex-col items-center relative z-10 w-full">
                  {/* Logo */}
                  <div className="relative w-full flex justify-center mb-2">
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
                          window.location.href = '/football';
                        }}
                      >
                        <span className="text-xs font-semibold">Jouer</span>
                        <span className="group-hover:translate-x-0.5 transition-transform duration-300 text-xs">→</span>
                      </button>
                      
                      <button 
                        className="group flex-1 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/25 text-white font-medium rounded-lg hover:bg-white/25 hover:border-white/40 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center"
                        onClick={() => {
                          trackEvent('previous_matches_click', 'navigation', 'cities_overview');
                          window.location.href = '/football';
                        }}
                      >
                        <span className="text-xs font-semibold">Historique</span>
                      </button>
                      
                      <button 
                        className="group flex-1 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/25 text-white font-medium rounded-lg hover:bg-white/25 hover:border-white/40 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center"
                        onClick={() => {
                          trackEvent('leaderboard_click', 'navigation', 'cities_overview');
                          window.location.href = '/football';
                        }}
                      >
                        <span className="text-xs font-semibold">Classement</span>
                      </button>
                    </div>
                  </div>
                  
                </div>
              </div>
            </RevealAnimation>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Accueil;
