/**
 * TerraFusionPro Web Client - Theme Context
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the theme context
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Available themes
const themes = {
  light: 'light',
  dark: 'dark'
};

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to light
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem('terraFusionTheme');
    return savedTheme || themes.light;
  });

  // Update body class and localStorage when theme changes
  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
    localStorage.setItem('terraFusionTheme', currentTheme);
  }, [currentTheme]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setCurrentTheme(prevTheme => 
      prevTheme === themes.light ? themes.dark : themes.light
    );
  };

  // Set a specific theme
  const setTheme = (theme) => {
    if (Object.values(themes).includes(theme)) {
      setCurrentTheme(theme);
    }
  };

  const value = {
    currentTheme,
    toggleTheme,
    setTheme,
    isLightTheme: currentTheme === themes.light,
    isDarkTheme: currentTheme === themes.dark
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;