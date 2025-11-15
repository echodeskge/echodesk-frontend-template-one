"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// Import translation messages
import en from "@/i18n/messages/en.json";
import ka from "@/i18n/messages/ka.json";
import ru from "@/i18n/messages/ru.json";

type Messages = typeof en;

const messages: Record<string, Messages> = {
  en,
  ka,
  ru,
};

interface Language {
  code: string;
  name: Record<string, string>;
  is_default: boolean;
  is_active: boolean;
}

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  availableLanguages: Language[];
  t: (key: string, params?: Record<string, string | number>) => string;
  getLocalizedValue: (value: string | Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "store-language";

// Default languages if API is not available
const defaultLanguages: Language[] = [
  { code: "en", name: { en: "English", ka: "ინგლისური", ru: "Английский" }, is_default: true, is_active: true },
  { code: "ka", name: { en: "Georgian", ka: "ქართული", ru: "Грузинский" }, is_default: false, is_active: true },
  { code: "ru", name: { en: "Russian", ka: "რუსული", ru: "Русский" }, is_default: false, is_active: true },
];

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<string>("en");
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>(defaultLanguages);

  // Load saved language on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && messages[saved]) {
      setCurrentLanguage(saved);
    } else {
      // Check for default language from config or browser
      const browserLang = navigator.language.split("-")[0];
      if (messages[browserLang]) {
        setCurrentLanguage(browserLang);
      }
    }

    // Fetch available languages from API
    fetchLanguages();
  }, []);

  // Update HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const fetchLanguages = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      if (!apiUrl) return;

      const response = await fetch(`${apiUrl}/api/ecommerce/client/languages/`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setAvailableLanguages(data.results.filter((lang: Language) => lang.is_active));

          // Set default language if not already set
          const saved = localStorage.getItem(STORAGE_KEY);
          if (!saved) {
            const defaultLang = data.results.find((lang: Language) => lang.is_default);
            if (defaultLang && messages[defaultLang.code]) {
              setCurrentLanguage(defaultLang.code);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch languages:", error);
    }
  };

  const setLanguage = useCallback((lang: string) => {
    if (messages[lang]) {
      setCurrentLanguage(lang);
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }, []);

  // Translation function
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split(".");
      let value: unknown = messages[currentLanguage] || messages.en;

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          // Fallback to English
          value = messages.en;
          for (const fallbackKey of keys) {
            if (value && typeof value === "object" && fallbackKey in value) {
              value = (value as Record<string, unknown>)[fallbackKey];
            } else {
              return key; // Return key if not found
            }
          }
          break;
        }
      }

      if (typeof value !== "string") {
        return key;
      }

      // Replace parameters
      if (params) {
        let result = value;
        for (const [paramKey, paramValue] of Object.entries(params)) {
          result = result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramValue));
        }
        return result;
      }

      return value;
    },
    [currentLanguage]
  );

  // Get localized value from JSON field (for product names, etc.)
  const getLocalizedValue = useCallback(
    (value: string | Record<string, string>): string => {
      if (typeof value === "string") {
        return value;
      }
      if (typeof value === "object" && value !== null) {
        return value[currentLanguage] || value.en || Object.values(value)[0] || "";
      }
      return "";
    },
    [currentLanguage]
  );

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        availableLanguages,
        t,
        getLocalizedValue,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
