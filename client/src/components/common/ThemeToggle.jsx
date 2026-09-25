import React, { useContext } from 'react';
import { Moon, Sun } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';

const ThemeToggle = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const dark = theme === 'dark';
  return (
    <button type="button" className={`theme-toggle ${showLabel ? 'theme-toggle-labeled' : ''} ${className}`}
      onClick={toggleTheme} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
      title={`Switch to ${dark ? 'light' : 'dark'} mode`}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
      {showLabel && <span>{dark ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
};

export default ThemeToggle;
