import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useNavContext } from "@/context/NavContext";
import { trackEvent } from "@/lib/analytics";

const Header = () => {
  const { t, setLanguage, language, direction } = useLanguage();
  const { activeSection } = useNavContext();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleLanguage = () => {
    const newLanguage = language === "fr" ? "ar" : "fr";
    setLanguage(newLanguage);
  };

  const navLinks = [
    { id: "upcoming-matches", label: "Matchs à venir" },
    { id: "about", label: t("nav_about") },
    { id: "how-it-works", label: t("nav_how") },
    { id: "rules", label: t("nav_rules") },
    { id: "leaderboard", label: t("nav_leaderboard") },
    { id: "faq", label: t("nav_faq") },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80;
      const elementPosition = element.offsetTop - headerHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
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
              isScrolled ? "text-black" : "text-white"
            }`}>
              <span className="text-rayoblue">RAYO</span>SPORT
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`font-medium transition-colors ${
                  activeSection === link.id 
                    ? (isScrolled ? "text-rayoblue" : "text-rayoblue") 
                    : (isScrolled ? "text-black hover:text-rayoblue" : "text-white hover:text-rayoblue")
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className={`flex items-center text-sm font-medium ${
                isScrolled ? "text-black hover:text-rayoblue" : "text-white hover:text-rayoblue"
              } transition-colors`}
            >
              {language === "fr" ? "العربية" : "Français"}
            </button>

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
            className="md:hidden text-2xl"
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
                {navLinks.map((link) => (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    className={`font-medium py-2 ${
                      activeSection === link.id ? "text-rayoblue" : "text-black hover:text-rayoblue"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <button
                  onClick={toggleLanguage}
                  className="text-left font-medium py-2 text-black hover:text-rayoblue"
                >
                  {language === "fr" ? "العربية" : "Français"}
                </button>
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