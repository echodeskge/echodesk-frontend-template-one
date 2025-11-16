"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getStoreConfig, StoreConfig } from "@/lib/store-config";

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  muted_foreground: string;
  destructive: string;
  border: string;
  card: string;
  card_foreground: string;
}

interface ThemeConfig {
  preset: string;
  colors: ThemeColors;
  radius: string;
  store_name: string;
}

const StoreConfigContext = createContext<StoreConfig | null>(null);

export function useStoreConfig() {
  const config = useContext(StoreConfigContext);
  if (!config) {
    throw new Error("useStoreConfig must be used within StoreConfigProvider");
  }
  return config;
}

interface StoreConfigProviderProps {
  children: React.ReactNode;
}

// Helper to format color - keep HSL values as-is since our CSS expects raw HSL values
const formatColor = (colorString: string): string | null => {
  const trimmed = colorString.trim();
  const parts = trimmed.split(/\s+/);

  // If it's already in "H S% L%" format (e.g., "240 5.9% 10%"), return as-is
  if (parts.length === 3 && parts[1].includes('%') && parts[2].includes('%')) {
    return trimmed;
  }

  // If it's a hex color, convert to HSL values
  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }

  return null;
};

// Apply theme to CSS variables
const applyTheme = (theme: ThemeConfig) => {
  const root = document.documentElement;

  // Apply all color variables
  const colorMappings: Record<keyof ThemeColors, string> = {
    primary: '--primary',
    secondary: '--secondary',
    accent: '--accent',
    background: '--background',
    foreground: '--foreground',
    muted: '--muted',
    muted_foreground: '--muted-foreground',
    destructive: '--destructive',
    border: '--border',
    card: '--card',
    card_foreground: '--card-foreground',
  };

  Object.entries(colorMappings).forEach(([key, cssVar]) => {
    const colorValue = theme.colors[key as keyof ThemeColors];
    if (colorValue) {
      const formattedColor = formatColor(colorValue);
      if (formattedColor) {
        root.style.setProperty(cssVar, formattedColor);
      }
    }
  });

  // Apply border radius
  if (theme.radius) {
    root.style.setProperty('--radius', theme.radius);
  }

  // Also set input and ring colors based on border
  if (theme.colors.border) {
    const borderColor = formatColor(theme.colors.border);
    if (borderColor) {
      root.style.setProperty('--input', borderColor);
    }
  }

  // Set ring color based on primary
  if (theme.colors.primary) {
    const primaryColor = formatColor(theme.colors.primary);
    if (primaryColor) {
      root.style.setProperty('--ring', primaryColor);
    }
  }

  // Set primary-foreground based on background (inverted for contrast)
  if (theme.colors.background) {
    const bgColor = formatColor(theme.colors.background);
    if (bgColor) {
      root.style.setProperty('--primary-foreground', bgColor);
      root.style.setProperty('--destructive-foreground', bgColor);
    }
  }

  // Set secondary-foreground based on foreground
  if (theme.colors.foreground) {
    const fgColor = formatColor(theme.colors.foreground);
    if (fgColor) {
      root.style.setProperty('--secondary-foreground', fgColor);
      root.style.setProperty('--accent-foreground', fgColor);
      root.style.setProperty('--popover-foreground', fgColor);
    }
  }

  // Set popover colors same as card
  if (theme.colors.card) {
    const cardColor = formatColor(theme.colors.card);
    if (cardColor) {
      root.style.setProperty('--popover', cardColor);
    }
  }
};

// Fetch theme from API
const fetchTheme = async (): Promise<ThemeConfig | null> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://demo.api.echodesk.ge";

  try {
    // Check localStorage cache first
    const cached = localStorage.getItem('echodesk_theme');
    const cacheTime = localStorage.getItem('echodesk_theme_time');

    // Use cache if less than 5 minutes old
    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < 5 * 60 * 1000) {
        return JSON.parse(cached);
      }
    }

    const response = await fetch(`${apiUrl}/api/ecommerce/client/theme/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch theme, using defaults');
      return null;
    }

    const theme = await response.json();

    // Cache the theme
    localStorage.setItem('echodesk_theme', JSON.stringify(theme));
    localStorage.setItem('echodesk_theme_time', Date.now().toString());

    return theme;
  } catch (error) {
    console.warn('Error fetching theme:', error);
    return null;
  }
};

export function StoreConfigProvider({ children }: StoreConfigProviderProps) {
  const config = getStoreConfig();
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    // Fetch and apply theme from API
    const loadTheme = async () => {
      const theme = await fetchTheme();

      if (theme) {
        applyTheme(theme);
      } else {
        // Fallback to static config
        const root = document.documentElement;

        // Set primary color
        if (config.theme.primaryColor) {
          const color = formatColor(config.theme.primaryColor);
          if (color) {
            root.style.setProperty("--primary", color);
          }
        }

        // Set secondary color
        if (config.theme.secondaryColor) {
          const color = formatColor(config.theme.secondaryColor);
          if (color) {
            root.style.setProperty("--secondary", color);
          }
        }

        // Set accent color
        if (config.theme.accentColor) {
          const color = formatColor(config.theme.accentColor);
          if (color) {
            root.style.setProperty("--accent", color);
          }
        }
      }

      // Update meta theme-color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor && config.theme.primaryColor) {
        const color = formatColor(config.theme.primaryColor);
        if (color) {
          metaThemeColor.setAttribute("content", color);
        }
      }

      setThemeLoaded(true);
    };

    loadTheme();
  }, [config.theme]);

  return (
    <StoreConfigContext.Provider value={config}>
      {children}
    </StoreConfigContext.Provider>
  );
}

// Helper to convert HSL to Hex for meta tags
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
