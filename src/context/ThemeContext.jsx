import { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Create context in a separate file
const ThemeContext = createContext();

// Rename to prevent name collision
const ThemeProviderComponent = ({ children }) => {
  // Check localStorage first, then system preference, default to dark
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    
    // Default to dark theme
    return 'dark';
  };
  
  const [theme, setTheme] = useState(getInitialTheme);
  
  // Apply theme to body element and store in localStorage
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Apply theme classes to body for CSS selectors
    if (theme === 'dark') {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
  }, [theme]);
  
  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };
  
  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      // Only update if user hasn't manually set a preference
      if (!localStorage.getItem('theme')) {
        setTheme(newTheme);
      }
    };
    
    // Add event listener with fallback for older browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Deprecated method for Safari < 14
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Deprecated method for Safari < 14
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProviderComponent.propTypes = {
  children: PropTypes.node.isRequired
};

export { ThemeContext, ThemeProviderComponent as ThemeProvider };
