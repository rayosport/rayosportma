import { useContext } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

export const useLanguage = () => {
  // Get all context values from LanguageContext
  const context = useContext(LanguageContext);
  
  // Add t function directly to the context
  const t = (key: string) => {
    if (!translations[context.language] || !translations[context.language][key]) {
      // Fallback to the key if translation not found
      return key;
    }
    return translations[context.language][key];
  };

  return { ...context, t };
};

// Keep for backward compatibility
export const useTranslation = () => {
  const { language } = useLanguage();
  
  return (key: string) => {
    if (!translations[language] || !translations[language][key]) {
      // Fallback to the key if translation not found
      return key;
    }
    return translations[language][key];
  };
};
