import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { trackEvent } from "@/lib/analytics";

const Header = () => {
  const [location, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
    { id: "universities", label: "Universités", isExternal: true, href: "/universite" },
    { id: "companies", label: "Entreprises", isExternal: true, href: "/entreprise" },
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

          {/* Right side - Compact Contact + Mobile */}
          <div className="flex items-center space-x-2">
            {/* Contact Button - Ultra Compact */}
            <button
              onClick={() => {
                const message = encodeURIComponent("Salut ! Je suis intéressé par Rayo Sport. Pouvez-vous me donner plus d'informations ?");
                const phoneNumber = "2120649076758";
                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
                window.open(whatsappUrl, '_blank');
                trackEvent('contact_us_click', 'navigation', 'header');
              }}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                isScrolled 
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-sm" 
                  : "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/30"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
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
                  const phoneNumber = "2120649076758";
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
    </header>
  );
};

export default Header;