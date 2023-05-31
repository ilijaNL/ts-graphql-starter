import defaultLanguage from './default';
export type TranslationKeys = typeof defaultLanguage;

export const languages = ['en'] as const;

export type Language = typeof languages[number];

export const translations: Record<Language, TranslationKeys> = {
  en: defaultLanguage,
};
