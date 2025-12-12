import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { trackEvent } from "@/lib/analytics";

const Kids = () => {
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    trackEvent('page_view', 'navigation', 'kids_page');
  }, []);

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = '/images/gallery/optimized/kid.jpg';
  }, []);

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
              <radialGradient id="dialBgKids" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#0f0f0f" />
                <stop offset="100%" stopColor="#0b0b0b" />
              </radialGradient>
            </defs>
            <circle cx="82" cy="88" r="64" fill="url(#dialBgKids)" stroke="#1f2937" strokeWidth="2" />
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

  return (
    <>
      <Header />
      
      <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600 text-white overflow-hidden">
          {/* Background image - no filters, starts from top */}
        <div 
          className="absolute inset-0 z-0"
          style={{
              backgroundImage: `url('/images/gallery/optimized/kid.jpg')`,
            backgroundSize: 'cover',
              backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat'
          }}
          ></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 w-full">
            <RevealAnimation>
              <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">
                  <span className="block bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent">
                    RAYO
                  </span>
                  <span className="block bg-gradient-to-r from-pink-300 to-purple-400 bg-clip-text text-transparent">
                    KIDS
                  </span>
                </h1>
                <p className="text-lg mb-6 opacity-90">
                  Page en construction
                </p>
                <p className="text-base mb-8 opacity-80">
                  Nous préparons des programmes sportifs extraordinaires pour vos enfants. 
                  Revenez bientôt pour découvrir Rayo Kids !
                </p>
                <button 
                  className="group px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-medium rounded-md hover:from-green-700 hover:to-emerald-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center gap-2 mx-auto"
                  onClick={() => {
                    trackEvent('voir_football_click', 'navigation', 'kids_page');
                    window.location.href = '/football';
                  }}
                >
                  <span className="font-semibold">Voir Football</span>
                  <span className="group-hover:translate-x-0.5 transition-transform duration-300">→</span>
                </button>
              </div>
            </RevealAnimation>
        </div>
      </section>
      </main>

      <Footer />
    </>
  );
};

export default Kids;



