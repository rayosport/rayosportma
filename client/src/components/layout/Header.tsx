import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useNavContext } from "@/context/NavContext";

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
    setLanguage(language === "fr" ? "ar" : "fr");
  };

  const navLinks = [
    { id: "upcoming-matches", label: "Matchs à venir" },
    { id: "about", label: t("nav_about") },
    { id: "how-it-works", label: t("nav_how") },
    { id: "rules", label: t("nav_rules") },
    { id: "leaderboard", label: t("nav_leaderboard") },
    { id: "faq", label: t("nav_faq") },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white shadow-md py-3 text-black"
          : "bg-black/20 backdrop-blur-sm py-5 text-white"
      }`}
      dir={direction}
    >
      <div className="container flex justify-between items-center">
        {/* Logo */}
        <a href="#" className="text-2xl font-bold flex items-center">
          <span className={isScrolled ? "text-rayoblue" : "text-white"}>Rayo</span>
          <span className={isScrolled ? "text-black" : "text-rayoblue"}>Sport</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={`relative font-medium text-sm uppercase tracking-wider px-1 py-2 transition-colors ${
                activeSection === link.id
                  ? isScrolled
                    ? "text-rayoblue"
                    : "text-rayoblue"
                  : isScrolled
                  ? "text-black hover:text-rayoblue"
                  : "text-white hover:text-rayoblue"
              }`}
            >
              {link.label}
              {activeSection === link.id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-rayoblue"></span>
              )}
            </a>
          ))}
        </nav>

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
    </header>
  );
};

export default Header;