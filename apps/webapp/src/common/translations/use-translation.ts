import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { Language, translations, TranslationKeys, languages } from './translations';

export type TranslationString = keyof TranslationKeys;

export const useTranslation = () => {
  const { push, pathname, asPath, query, locale: _locale } = useRouter();
  const locale: Language = languages.includes((_locale as Language) ?? 'en') ? (_locale as Language) : 'en';
  const current_translations: TranslationKeys = translations[locale];

  const getItem = useCallback(
    <P extends TranslationString>(key: P, locale?: 'en') =>
      (locale ? translations[locale][key] : current_translations[key]) ?? `key:${key}`,
    [current_translations]
  );

  const setLng = (locale: string) => {
    push({ pathname, query }, asPath, { locale });
  };

  return {
    t: getItem,
    locale,
    setLng,
  };
};
