export type Language = 'fr' | 'ar';

export const LANGUAGES: { [key in Language]: string } = {
  fr: 'Français',
  ar: 'العربية',
};

export const getDirection = (language: Language): 'ltr' | 'rtl' => {
  return language === 'ar' ? 'rtl' : 'ltr';
};

export const getFontFamily = (language: Language): string => {
  return language === 'ar' ? 'font-ar' : 'font-fr';
};
