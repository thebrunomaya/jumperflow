/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useLayoutEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      // Check DOM first for immediate sync
      const isDomDark = document.documentElement.classList.contains('dark');
      if (isDomDark) return 'dark';
      
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return (saved === 'light' || saved === 'dark') ? saved : (prefersDark ? 'dark' : 'light');
    } catch {
      return 'dark';
    }
  });

  useLayoutEffect(() => {
    localStorage.setItem('theme', theme);
    const isDark = theme === 'dark';
    const hasClass = document.documentElement.classList.contains('dark');
    
    if (isDark && !hasClass) {
      document.documentElement.classList.add('dark');
    } else if (!isDark && hasClass) {
      document.documentElement.classList.remove('dark');
    }
    
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};