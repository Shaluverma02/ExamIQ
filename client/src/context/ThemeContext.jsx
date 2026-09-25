import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('app-theme') || 'light';
    } catch (error) {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.setAttribute('data-bs-theme', theme);
      document.body.setAttribute('data-theme', theme);
      document.body.setAttribute('data-bs-theme', theme);

      document.body.classList.toggle('dark-theme', theme === 'dark');
      document.body.classList.toggle('light-theme', theme === 'light');
      document.documentElement.classList.toggle('dark-theme', theme === 'dark');
      document.documentElement.classList.toggle('light-theme', theme === 'light');

      localStorage.setItem('app-theme', theme);
    } catch (error) {
      console.error('Failed to apply theme persistence:', error);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
