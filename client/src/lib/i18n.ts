export type Language = 'fr' | 'en' | 'ar' | 'es';

export const LANGUAGES: { [key in Language]: string } = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
  es: 'Español',
};

export const getDirection = (language: Language): 'ltr' | 'rtl' => {
  return language === 'ar' ? 'rtl' : 'ltr';
};

export const getFontFamily = (language: Language): string => {
  if (language === 'ar') return 'font-ar';
  if (language === 'es') return 'font-es';
  if (language === 'en') return 'font-en';
  return 'font-fr';
};
