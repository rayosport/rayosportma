import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { trackEvent } from "@/lib/analytics";

const Paddel = () => {
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    trackEvent('page_view', 'navigation', 'padel_page');
  }, []);

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = '/images/gallery/optimized/df.jpg';
  }, []);

  // Show loading screen while image loads
  if (!imageLoaded) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Rayo Sport</h2>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white overflow-hidden">
          {/* Background image - no filters, starts from top */}
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url('/images/gallery/optimized/df.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              backgroundRepeat: 'no-repeat'
            }}
          ></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <RevealAnimation>
              <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">
                  <span className="block bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                    PADEL
                  </span>
                  <span className="block bg-gradient-to-r from-orange-300 to-yellow-400 bg-clip-text text-transparent">
                    RAYO SPORT
                  </span>
                </h1>
                <p className="text-lg mb-6 opacity-90">
                  Page en construction
                </p>
                <p className="text-base mb-8 opacity-80">
                  Nous travaillons actuellement sur cette section. 
                  Revenez bientôt pour découvrir nos programmes padel !
                </p>
              </div>
            </RevealAnimation>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Paddel;



