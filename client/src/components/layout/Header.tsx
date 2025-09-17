import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useNavContext } from "@/context/NavContext";
import { trackEvent } from "@/lib/analytics";
import { FiChevronDown, FiGlobe } from "react-icons/fi";
import { Language } from "@/lib/i18n";
import { useLocation } from "wouter";

const Header = () => {
  const { t, setLanguage, language, direction } = useLanguage();
  const { activeSection } = useNavContext();
  const [location, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Détecter si on est sur une page hub (entreprise/universite)
  const isHubPage = location === '/entreprise' || location === '/universite';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isMatchesDropdownOpen, setIsMatchesDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const matchesDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
      if (matchesDropdownRef.current && !matchesDropdownRef.current.contains(event.target as Node)) {
        setIsMatchesDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setIsLanguageDropdownOpen(false);
  };

  // Navigation links conditionnelle selon la page
  const navLinks = isHubPage ? [
    { id: "home", label: "🏠 Accueil", isExternal: true, href: "/" },
    { id: "universities", label: "🏛️ Universités", isExternal: true, href: "/universite" },
    { id: "companies", label: "🏢 Entreprises", isExternal: true, href: "/entreprise" },
  ] : [
    { 
      id: "matches", 
      label: "⚽ Rayo Matchs", 
      isDropdown: true,
      subItems: [
        { id: "upcoming-matches", label: "Matchs à venir" },
        { id: "past-games", label: "Matchs passés" },
        { id: "leaderboard", label: t("nav_leaderboard") },
      ]
    },
    { id: "universities", label: "🏛️ Universités", isExternal: true, href: "/universite" },
    { id: "companies", label: "🏢 Entreprises", isExternal: true, href: "/entreprise" },
    { id: "rules", label: t("nav_rules") },
    { id: "about", label: t("nav_about") },
    { id: "faq", label: t("nav_faq") },
  ];

  const handleNavClick = (link: any) => {
    if (link.isExternal && link.href) {
      // Navigation externe
      setLocation(link.href);
      trackEvent('nav_external_click', 'navigation', link.id);
    } else {
      // Navigation interne (scroll)
      const element = document.getElementById(link.id);
      if (element) {
        const headerHeight = 80;
        const elementPosition = element.offsetTop - headerHeight;
        window.scrollTo({
          top: elementPosition,
          behavior: "smooth"
        });
      }
    }
  };

  const languageOptions = [
    { code: "fr" as Language, label: "Fr", flag: "🇫🇷" },
    { code: "ar" as Language, label: "Ar", flag: "🇲🇦" }
  ];

  const currentLanguage = languageOptions.find(lang => lang.code === language);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isHubPage
          ? "bg-white/95 backdrop-blur-md shadow-lg" 
          : "bg-transparent"
      }`}
      dir={direction}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <div className={`font-bold text-2xl transition-colors ${
              isScrolled || isHubPage ? "text-black" : "text-white"
            }`}>
              <span className="text-rayoblue">RAYO</span>SPORT
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              if (link.isDropdown) {
                return (
                  <div key={link.id} className="relative" ref={matchesDropdownRef}>
                    <button
                      onClick={() => setIsMatchesDropdownOpen(!isMatchesDropdownOpen)}
                      className={`flex items-center space-x-1 font-medium transition-colors text-sm ${
                        ['upcoming-matches', 'past-games', 'leaderboard'].includes(activeSection)
                          ? (isScrolled || isHubPage ? "text-rayoblue" : "text-rayoblue") 
                          : (isScrolled || isHubPage ? "text-black hover:text-rayoblue" : "text-white hover:text-rayoblue")
                      }`}
                    >
                      <span>{link.label}</span>
                      <FiChevronDown 
                        className={`w-3 h-3 transition-transform ${
                          isMatchesDropdownOpen ? "rotate-180" : ""
                        }`} 
                      />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {isMatchesDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        {link.subItems?.map((subItem) => (
                          <button
                            key={subItem.id}
                            onClick={() => {
                              handleNavClick(subItem);
                              setIsMatchesDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors text-sm ${
                              activeSection === subItem.id ? "bg-rayoblue/10 text-rayoblue" : "text-gray-700"
                            }`}
                          >
                            {subItem.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link)}
                  className={`font-medium transition-colors text-sm ${
                    activeSection === link.id 
                      ? (isScrolled || isHubPage ? "text-rayoblue" : "text-rayoblue") 
                      : (isScrolled || isHubPage ? "text-black hover:text-rayoblue" : "text-white hover:text-rayoblue")
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isScrolled || isHubPage
                    ? "text-black hover:text-rayoblue hover:bg-gray-100" 
                    : "text-white hover:text-rayoblue hover:bg-white/10"
                }`}
              >
                <FiGlobe className="w-4 h-4" />
                <span>{currentLanguage?.flag}</span>
                <span className="hidden lg:inline">{currentLanguage?.label}</span>
                <FiChevronDown 
                  className={`w-3 h-3 transition-transform ${
                    isLanguageDropdownOpen ? "rotate-180" : ""
                  }`} 
                />
              </button>

              {/* Dropdown Menu */}
              {isLanguageDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {languageOptions.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors flex items-center space-x-2 ${
                        language === lang.code ? "bg-rayoblue/10 text-rayoblue" : "text-gray-700"
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span className="text-sm font-medium">{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Join button */}
            <button 
              className="btn-primary"
              onClick={() => {
                trackEvent('join_click', 'user_engagement', 'header_navigation');
                // Trigger WhatsApp modal
                window.dispatchEvent(new CustomEvent('openWhatsAppModal'));
              }}
            >
              {t("nav_join")}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden text-2xl transition-colors ${
              isScrolled || isHubPage ? "text-black" : "text-white"
            }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white shadow-xl py-4 absolute top-full left-0 w-full">
            <div className="container">
              <nav className="flex flex-col space-y-3">
                {navLinks.map((link) => {
                  if (link.isDropdown) {
                    return (
                      <div key={link.id}>
                        <div className="font-medium py-2 text-left text-gray-800 border-b border-gray-200">
                          {link.label}
                        </div>
                        {link.subItems?.map((subItem) => (
                          <button
                            key={subItem.id}
                            onClick={() => {
                              handleNavClick(subItem);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`font-medium py-2 text-left ml-4 block ${
                              activeSection === subItem.id ? "text-rayoblue" : "text-gray-600 hover:text-rayoblue"
                            }`}
                          >
                            • {subItem.label}
                          </button>
                        ))}
                      </div>
                    );
                  }
                  
                  return (
                    <button
                      key={link.id}
                      onClick={() => {
                        handleNavClick(link);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`font-medium py-2 text-left ${
                        activeSection === link.id ? "text-rayoblue" : "text-black hover:text-rayoblue"
                      }`}
                    >
                      {link.label}
                    </button>
                  );
                })}
                
                {/* Mobile Language Selection */}
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm text-gray-600 mb-2 font-medium">Fr / Ar</p>
                  <div className="flex space-x-2">
                    {languageOptions.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          changeLanguage(lang.code);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          language === lang.code 
                            ? "bg-rayoblue text-white" 
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <button 
                  className="btn-primary mt-3"
                  onClick={() => {
                    // Trigger WhatsApp modal
                    window.dispatchEvent(new CustomEvent('openWhatsAppModal'));
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {t("nav_join")}
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;