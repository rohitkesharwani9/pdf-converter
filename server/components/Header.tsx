
import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { Sun, Moon, Zap } from 'lucide-react'; // Zap for logo

const Header: React.FC = () => {
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    // This should ideally not happen if ThemeProvider wraps the app
    return null; 
  }
  const { darkMode, toggleDarkMode } = themeContext;

  return (
    <header className="bg-primary dark:bg-neutral-800 text-white shadow-md">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Zap className="h-8 w-8 text-secondary-light" />
          <h1 className="text-2xl font-bold">PDF Converter Pro+</h1>
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-primary-dark dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-dark dark:focus:ring-offset-neutral-700 focus:ring-white"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
        </button>
      </div>
    </header>
  );
};

export default Header;
    