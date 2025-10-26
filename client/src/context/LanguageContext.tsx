import { createContext, ReactNode, useState, useEffect } from "react";
import { Language, getDirection, getFontFamily } from "@/lib/i18n";

interface LanguageContextProps {
  language: Language;
  setLanguage: (language: Language) => void;
  direction: "ltr" | "rtl";
  fontFamily: string;
  t?: (key: string) => string;
}

// Create context with default values to avoid undefined errors
export const LanguageContext = createContext<LanguageContextProps>({
  language: "fr",
  setLanguage: () => {},
  direction: "ltr",
  fontFamily: "font-fr"
});

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>("fr");
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  const [fontFamily, setFontFamily] = useState<string>("font-fr");

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem("language", newLanguage);
  };

  useEffect(() => {
    // Check if there's a language preference in localStorage
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && (savedLanguage === "fr" || savedLanguage === "en" || savedLanguage === "ar" || savedLanguage === "es")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Update direction and font family when language changes
    setDirection(getDirection(language));
    setFontFamily(getFontFamily(language));
    
    // Update document lang attribute and dir
    document.documentElement.lang = language;
    document.documentElement.dir = getDirection(language);
    
    // Add the font class to the body
    document.body.className = getFontFamily(language);
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, direction, fontFamily }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
