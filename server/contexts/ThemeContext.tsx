
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { DarkModeContextType } from '../types';

export const ThemeContext = createContext<DarkModeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode');
      return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', JSON.stringify(true));
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', JSON.stringify(false));
      }
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prevMode => !prevMode);
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
    