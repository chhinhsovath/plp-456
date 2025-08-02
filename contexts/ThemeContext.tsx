'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemePreset, themePresets, primaryColors } from '@/lib/themes';

interface ThemeContextType {
  currentTheme: ThemePreset;
  setTheme: (theme: ThemePreset) => void;
  availableThemes: ThemePreset[];
  primaryColors: string[];
  isCompact: boolean;
  setIsCompact: (compact: boolean) => void;
  customPrimaryColor: string;
  setCustomPrimaryColor: (color: string) => void;
  borderRadius: number;
  setBorderRadius: (radius: number) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'plp-theme-preferences';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Find the default light theme or use the first one
  const defaultTheme = themePresets.find(t => t.key === 'default') || themePresets[0];
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(defaultTheme);
  const [isCompact, setIsCompact] = useState(false);
  const [customPrimaryColor, setCustomPrimaryColor] = useState(defaultTheme.primaryColor);
  const [borderRadius, setBorderRadius] = useState(6);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        const preferences = JSON.parse(stored);
        
        // Find the theme preset
        const theme = themePresets.find(t => t.key === preferences.themeKey) || themePresets[0];
        setCurrentTheme(theme);
        
        // Load other preferences
        if (preferences.isCompact !== undefined) setIsCompact(preferences.isCompact);
        if (preferences.customPrimaryColor) setCustomPrimaryColor(preferences.customPrimaryColor);
        if (preferences.borderRadius !== undefined) setBorderRadius(preferences.borderRadius);
      }
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save theme preferences to localStorage
  useEffect(() => {
    if (!isLoaded) return;

    try {
      const preferences = {
        themeKey: currentTheme.key,
        isCompact,
        customPrimaryColor,
        borderRadius,
      };
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save theme preferences:', error);
    }
  }, [currentTheme, isCompact, customPrimaryColor, borderRadius, isLoaded]);

  const setTheme = (theme: ThemePreset) => {
    setCurrentTheme(theme);
    setCustomPrimaryColor(theme.primaryColor);
  };

  if (!isLoaded) {
    // Return a loading state or the default theme while loading
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        availableThemes: themePresets,
        primaryColors,
        isCompact,
        setIsCompact,
        customPrimaryColor,
        setCustomPrimaryColor,
        borderRadius,
        setBorderRadius,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}