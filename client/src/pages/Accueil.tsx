import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";
import Footer from "@/components/layout/Footer";
import { trackEvent } from "@/lib/analytics";

const Accueil = () => {
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    trackEvent('page_view', 'navigation', 'accueil_page');
  }, []);

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = '/images/gallery/optimized/ff.jpg';
  }, []);

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
    <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center text-white overflow-hidden">
        {/* Background image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('/images/gallery/optimized/ff.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/10 to-black/20"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
            <RevealAnimation>
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-black mb-6 text-white drop-shadow-2xl">
                <span className="block bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  ACCUEIL
                </span>
                <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  RAYO SPORT
                </span>
                </h1>
              
              <p className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto mb-8 drop-shadow-md">
                En construction
              </p>
              
              <p className="text-lg text-gray-200 max-w-2xl mx-auto mb-8">
                Cette section sera bientôt disponible avec toutes les informations sur Rayo Sport.
              </p>
              
              <div className="flex justify-center">
                <button 
                  className="px-6 py-3 bg-white/15 backdrop-blur-sm border border-white/30 text-white font-medium rounded-lg hover:bg-white/25 hover:border-white/50 transition-all duration-300 shadow-md hover:shadow-lg"
                  onClick={() => {
                    trackEvent('view_football_click', 'navigation', 'accueil_construction');
                    window.location.href = '/football';
                  }}
                >
                  Voir Football
                </button>
              </div>
            </div>
          </RevealAnimation>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Accueil;
