/**
 * TerraFusionPro - Theme Context
 * Manages application theme preferences (light/dark mode)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Create theme context
const ThemeContext = createContext();

// Hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Get initial theme from local storage or system preference
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('terraFusionTheme');
    
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check for system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  };
  
  const [theme, setTheme] = useState(getInitialTheme);
  
  // Apply theme class to body
  useEffect(() => {
    // Remove previous theme classes
    document.body.classList.remove('light-theme', 'dark-theme');
    
    // Add current theme class
    document.body.classList.add(`${theme}-theme`);
    
    // Store preference in local storage
    localStorage.setItem('terraFusionTheme', theme);
  }, [theme]);
  
  // Listen for system preference changes
  useEffect(() => {
    if (!window.matchMedia) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // Only change theme if user hasn't explicitly set a preference
      if (!localStorage.getItem('terraFusionTheme')) {
        setTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    // Add listener for system preference changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Older browser support
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      // Clean up listener
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Older browser support
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);
  
  // Toggle theme
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  // Set specific theme
  const setThemeExplicitly = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme);
    }
  };
  
  // Remove user preference and use system
  const useSystemTheme = () => {
    localStorage.removeItem('terraFusionTheme');
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };
  
  // Provide theme values and functions
  const value = {
    theme,
    toggleTheme,
    setTheme: setThemeExplicitly,
    useSystemTheme
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;