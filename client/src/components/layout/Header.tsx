import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { trackEvent } from "@/lib/analytics";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Header = () => {
  const [location, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportAmount, setSupportAmount] = useState(50); // Minimum 50, increments of 10
  
  const { t, direction } = useLanguage();
  
  const [, params] = useRoute("/:page");

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  // Navigation links - consistent across all pages
  const navLinks = [
    { id: "home", label: t("nav_home") },
    { id: "football", label: t("nav_football") },
    { id: "padel", label: t("nav_padel") },
    { id: "kids", label: t("nav_kids") },
    { id: "tournoi", label: t("nav_tournoi"), isExternal: true, href: "/tournoi" },
    { id: "universities", label: "Universités", isExternal: true, href: "/universite" },
    { id: "companies", label: "Entreprises", isExternal: true, href: "/entreprise" },
    { id: "store", label: "Store" },
    { id: "faq", label: t("nav_faq") },
  ];

  const handleNavClick = (link: any) => {
    if (link.isExternal && link.href) {
      setLocation(link.href);
      trackEvent('nav_external_click', 'navigation', link.id);
    } else if (link.id === 'home') {
      setLocation('/');
      trackEvent('nav_home_click', 'navigation', 'header');
    } else if (link.id === 'football') {
      setLocation('/football');
      trackEvent('nav_football_click', 'navigation', 'header');
    } else if (link.id === 'padel') {
      setLocation('/padel');
      trackEvent('nav_padel_click', 'navigation', 'header');
    } else if (link.id === 'kids') {
      setLocation('/kids');
      trackEvent('nav_kids_click', 'navigation', 'header');
    } else if (link.id === 'store') {
      setLocation('/store');
      trackEvent('nav_store_click', 'navigation', 'header');
    } else if (link.id === 'faq') {
      setLocation('/faq');
      trackEvent('nav_faq_click', 'navigation', 'header');
    }
  };


  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg" 
          : "bg-transparent"
      }`}
      dir={direction}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo - Compact */}
          <div className="flex items-center">
            <img 
              src={isScrolled ? "/images/gallery/optimized/logowhite.png" : "/images/gallery/optimized/logo.png"}
              alt="Rayo Sport"
              className="h-8 w-auto transition-all duration-300"
            />
          </div>

          {/* Desktop Navigation - Ultra Compact */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                  isScrolled 
                    ? "text-gray-700 hover:text-gray-900 hover:bg-gray-100" 
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right side - Compact Support + Contact + Mobile */}
          <div className="flex items-center space-x-2">
            {/* RAYO SUPPORT+ Button - Golden Design */}
            <button
              onClick={() => {
                trackEvent('rayo_support_click', 'navigation', 'header');
                setIsSupportModalOpen(true);
              }}
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-xs font-semibold transition-all duration-200 ${
                isScrolled 
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-900 shadow-lg shadow-amber-500/50 border border-amber-400" 
                  : "bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-amber-900 shadow-lg shadow-amber-400/50 border border-amber-300"
              }`}
            >
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 2H5v2h14v-2z"/>
              </svg>
              <span className="sm:hidden">SUPPORT+</span>
              <span className="hidden sm:inline">RAYO SUPPORT+</span>
            </button>

            {/* Contact Button - Ultra Compact */}
            <button
              onClick={() => {
                const message = encodeURIComponent("Salut ! Je suis intéressé par Rayo Sport. Pouvez-vous me donner plus d'informations ?");
                const phoneNumber = "212720707190";
                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
                window.open(whatsappUrl, '_blank');
                trackEvent('contact_us_click', 'navigation', 'header');
              }}
              className={`hidden sm:flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-xs font-semibold transition-all duration-200 ${
                isScrolled 
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-sm" 
                  : "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/30"
              }`}
            >
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              <span className="hidden md:inline">Contact</span>
            </button>

            {/* Mobile Menu - Compact */}
            <button
              className={`lg:hidden p-1.5 transition-colors duration-200 ${
                isScrolled ? "text-gray-600 hover:text-gray-900" : "text-white/80 hover:text-white"
              }`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className="w-4 h-4 flex flex-col justify-center space-y-0.5">
                <div className={`h-0.5 bg-current transition-all duration-200 ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-1' : ''
                }`}></div>
                <div className={`h-0.5 bg-current transition-all duration-200 ${
                  isMobileMenuOpen ? 'opacity-0' : ''
                }`}></div>
                <div className={`h-0.5 bg-current transition-all duration-200 ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-1' : ''
                }`}></div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Ultra Compact */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/50 py-2">
            <nav className="flex flex-col space-y-0.5">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    handleNavClick(link);
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  {link.label}
                </button>
              ))}
              
              {/* Mobile Contact Button - Compact */}
              <button
                onClick={() => {
                  const message = encodeURIComponent("Salut ! Je suis intéressé par Rayo Sport. Pouvez-vous me donner plus d'informations ?");
                  const phoneNumber = "212720707190";
                  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
                  window.open(whatsappUrl, '_blank');
                  setIsMobileMenuOpen(false);
                  trackEvent('contact_us_click', 'navigation', 'mobile_menu');
                }}
                className="flex items-center gap-2 py-2 px-3 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors duration-200 font-semibold text-sm"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                <span>Nous contacter</span>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* RAYO SUPPORT+ Modal - Dark Premium Design */}
      <Dialog open={isSupportModalOpen} onOpenChange={setIsSupportModalOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden border border-amber-500/30 shadow-2xl shadow-amber-500/20 rounded-2xl bg-gradient-to-b from-gray-900 via-gray-900 to-black max-h-[90vh] overflow-y-auto">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}></div>
          </div>
          
          {/* Golden Glow Effect */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative p-5">
            {/* Header */}
            <DialogHeader className="mb-4">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400 rounded-xl blur-lg opacity-50 animate-pulse"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-[2.5rem] font-black text-gray-900 leading-none">+</span>
                  </div>
                </div>
                <DialogTitle className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 tracking-wide">
                  RAYO SUPPORT+
                </DialogTitle>
              </div>
            </DialogHeader>

            {/* Description */}
            <div className="mb-4 space-y-3 text-[11px] text-gray-400 leading-relaxed text-center">
              <p>
                <span className="text-amber-400 font-semibold">RAYO SUPPORT+</span> est un badge ajouté au nom des joueurs qui aiment notre concept et souhaitent soutenir l'aventure. Si tu veux contribuer, tu peux faire un don du montant que tu veux, chaque soutien nous aide à améliorer l'expérience et faire grandir la communauté.
              </p>
              <p>
                En retour, les membres <span className="text-amber-400 font-semibold">RAYO SUPPORT+</span> bénéficient de <span className="text-blue-400 font-semibold">priorité sur les réservations</span> avant la publication des matchs, et participent à un <span className="text-blue-400 font-semibold">tirage au sort mensuel</span> pour tenter de gagner un match gratuit.
              </p>
              <p className="text-gray-500 font-bold">
                Merci à tous ceux qui soutiennent Rayo, l'histoire continue grâce à vous. 💛⚽
              </p>
            </div>

            {/* Benefits - Minimal Icons */}
            <div className="flex justify-center gap-6 mb-5">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">Priorité</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">Tirage</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 2H5v2h14v-2z"/>
                  </svg>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">Badge</span>
              </div>
            </div>

            {/* Amount Selector - Sleek */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <button
                onClick={() => supportAmount > 50 && setSupportAmount(supportAmount - 10)}
                disabled={supportAmount <= 50}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-200 ${
                  supportAmount <= 50
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-500/50'
                }`}
              >
                −
              </button>
              
              <div className="flex items-baseline gap-1 px-5 py-2 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/30 rounded-xl">
                <span className="text-3xl font-black text-amber-400">{supportAmount}</span>
                <span className="text-sm font-bold text-amber-500/70">DH</span>
              </div>
              
              <button
                onClick={() => setSupportAmount(supportAmount + 10)}
                className="w-10 h-10 rounded-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 hover:border-green-400 flex items-center justify-center text-lg font-bold transition-all duration-200"
              >
                +
              </button>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                trackEvent('become_supporter_click', 'navigation', 'support_modal', supportAmount);
                const message = encodeURIComponent(`Je veux devenir un Rayo Supporteur avec une contribution de ${supportAmount} DH`);
                window.open(`https://wa.me/212720707190?text=${message}`, '_blank');
              }}
              className="group w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              <span>Devenir un supporteur</span>
              <svg className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;