import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { th, TranslationKeys } from '../locales/th';
import { en } from '../locales/en';

export type Language = 'th' | 'en';

interface LanguageContextType {
  currentLang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: TranslationKeys, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_LANG_KEY = 'fixflow_lang';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY);
      if (saved === 'en' || saved === 'th') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'th'; // Default Thai
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LANG_KEY, currentLang);
      document.documentElement.lang = currentLang;
    } catch {
      // ignore
    }
  }, [currentLang]);

  const setLang = (lang: Language) => {
    setCurrentLangState(lang);
  };

  const toggleLang = () => {
    setCurrentLangState((prev) => (prev === 'th' ? 'en' : 'th'));
  };

  const t = (key: TranslationKeys, fallback?: string): string => {
    const dict = currentLang === 'en' ? en : th;
    if (key in dict) {
      return dict[key];
    }
    // Fallback to th dictionary or provided fallback
    if (key in th) {
      return th[key];
    }
    return fallback || (key as string);
  };

  return (
    <LanguageContext.Provider value={{ currentLang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const defaultFallbackContext: LanguageContextType = {
  currentLang: 'th',
  setLang: () => {},
  toggleLang: () => {},
  t: (key: TranslationKeys, fallback?: string): string => {
    if (key in th) {
      return th[key];
    }
    return fallback || (key as string);
  },
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    return defaultFallbackContext;
  }
  return context;
};

