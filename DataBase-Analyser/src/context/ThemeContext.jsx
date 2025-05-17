import React, { createContext, useEffect, useContext } from 'react';

// Create a context for theme management
export const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Always use dark theme
  const theme = 'dark';
  
  // Set dark theme on document element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('dark');
    
    // Save theme to localStorage for consistency
    localStorage.setItem('theme', 'dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};