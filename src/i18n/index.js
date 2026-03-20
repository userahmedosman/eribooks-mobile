import en from './translations/en.json';
import ar from './translations/ar.json';
import tg from './translations/tg.json';

const translations = { en, ar, tg };

/**
 * Simple translation helper
 * @param {string} key - Dot separated key (e.g. 'home.title')
 * @param {string} lang - Language code ('en', 'ar', 'tg')
 * @returns {string} - Translated string or key as fallback
 */
export const t = (key, lang = 'en') => {
  const dictionary = translations[lang] || translations.en;
  const keys = key.split('.');
  
  let value = dictionary;
  for (const k of keys) {
    if (value[k] === undefined) {
      // Fallback to English if not found in current language
      if (lang !== 'en') {
        return t(key, 'en');
      }
      return key;
    }
    value = value[k];
  }
  
  return value;
};
