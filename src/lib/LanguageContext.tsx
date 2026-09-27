import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  UI_TRANSLATIONS 
} from './i18n/translations';
import { 
  PROTECTED_TRADING_TERMINOLOGY, 
  PROTECTED_PROPER_NAMES, 
  isProtectedTerm, 
  sanitizeTradingTerminology, 
  formatTraderAnalysis,
  ProtectedTermEntry
} from './i18n/tradingTerminology';

export type Language = 'id' | 'en';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isId: boolean;
  isEn: boolean;
  /**
   * Universal translation function:
   * 1. If called with (key): looks up key in UI_TRANSLATIONS dictionary.
   * 2. If called with (idText, enText): returns idText when language is 'id', or enText when 'en'.
   * In both cases, protected trading terminology is strictly preserved.
   */
  t: (keyOrIdText: string, enText?: string) => string;
  /**
   * Direct key lookup with optional fallback.
   */
  tKey: (key: string, fallback?: string) => string;
  /**
   * Sanitizes and preserves trading terminology (SMC, Price Action, Macro) in any string.
   */
  formatTradingText: (text: string) => string;
  /**
   * Check if a term or phrase is a locked trading term or proper name.
   */
  isProtected: (term: string) => boolean;
  /**
   * Dictionary of protected trading terminology.
   */
  protectedTerminology: Record<string, ProtectedTermEntry>;
  protectedProperNames: readonly string[];
}

const STORAGE_KEY = 'arahmarket_lang';

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'id' || saved === 'en') return saved;
      // Default to Indonesian as primary default for Indonesian traders, but easily toggled
      return 'id';
    }
    return 'id';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'id' ? 'en' : 'id');
  }, [language, setLanguage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const tKey = useCallback((key: string, fallback?: string): string => {
    const entry = UI_TRANSLATIONS[key];
    if (entry) {
      const raw = language === 'id' ? entry.id : entry.en;
      return sanitizeTradingTerminology(raw);
    }
    return fallback ? sanitizeTradingTerminology(fallback) : key;
  }, [language]);

  const t = useCallback((keyOrIdText: string, enText?: string): string => {
    // Mode 1: Called with (idText, enText)
    if (enText !== undefined) {
      const raw = language === 'id' ? keyOrIdText : enText;
      return sanitizeTradingTerminology(raw);
    }

    // Mode 2: Called with a dictionary key (e.g., 'nav.overview')
    if (UI_TRANSLATIONS[keyOrIdText]) {
      const entry = UI_TRANSLATIONS[keyOrIdText];
      const raw = language === 'id' ? entry.id : entry.en;
      return sanitizeTradingTerminology(raw);
    }

    // Fallback: If not found in dictionary, return text sanitized
    return sanitizeTradingTerminology(keyOrIdText);
  }, [language]);

  const formatTradingText = useCallback((text: string) => {
    return formatTraderAnalysis(text, language);
  }, [language]);

  const value = useMemo<LanguageContextType>(() => ({
    language,
    setLanguage,
    toggleLanguage,
    isId: language === 'id',
    isEn: language === 'en',
    t,
    tKey,
    formatTradingText,
    isProtected: isProtectedTerm,
    protectedTerminology: PROTECTED_TRADING_TERMINOLOGY,
    protectedProperNames: PROTECTED_PROPER_NAMES,
  }), [language, setLanguage, toggleLanguage, t, tKey, formatTradingText]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      language: 'id',
      setLanguage: () => {},
      toggleLanguage: () => {},
      isId: true,
      isEn: false,
      t: (keyOrIdText: string, enText?: string) => {
        if (enText !== undefined) return keyOrIdText;
        if (UI_TRANSLATIONS[keyOrIdText]) return UI_TRANSLATIONS[keyOrIdText].id;
        return keyOrIdText;
      },
      tKey: (key: string, fallback?: string) => fallback || key,
      formatTradingText: (text: string) => text,
      isProtected: isProtectedTerm,
      protectedTerminology: PROTECTED_TRADING_TERMINOLOGY,
      protectedProperNames: PROTECTED_PROPER_NAMES,
    };
  }
  return ctx;
};
