import React, { useState } from 'react';
import './Header.css';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

// Fallback logo component when SVG import fails
const LogoFallback = () => (
  <div 
    style={{
      width: 36,
      height: 36,
      backgroundColor: '#2c75ff',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16
    }}
  >
    CT
  </div>
);

const Header = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Use a try/catch to handle the case when ThemeProvider is not available
  let theme = "dark"; // Default theme
  try {
    const themeContext = useTheme();
    if (themeContext && themeContext.theme) {
      theme = themeContext.theme;
    }
  } catch (e) {
    console.warn("ThemeContext not available, using default theme");
  }
  
  // Import logo dynamically to handle potential missing file
  const [logo, setLogo] = useState(null);
  
  // Try to import logo (for development only)
  React.useEffect(() => {
    try {
      // Dynamic import attempt
      import('../../assets/logo.svg')
        .then(module => setLogo(module.default))
        .catch(() => console.log('Logo file not found, using fallback'));
    } catch (e) {
      console.log('Logo import error, using fallback');
    }
  }, []);
  
  return (
    <header className="header">
      <div className="logo-container">
        {logo ? (
          <img src={logo} alt="Cryptocurrency Tracker Logo" className="logo" width="36" height="36" />
        ) : (
          <LogoFallback />
        )}
        <h1>Crypto Tracker</h1>
      </div>
      <nav className="nav">
        <ul>
          <li>
            <a 
              href="#" 
              className={activeTab === 'dashboard' ? 'active' : ''} 
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('dashboard');
              }}
            >
              Dashboard
            </a>
          </li>
          <li>
            <a 
              href="#" 
              className={activeTab === 'markets' ? 'active' : ''} 
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('markets');
              }}
            >
              Markets
            </a>
          </li>
          <li>
            <a 
              href="#" 
              className={activeTab === 'about' ? 'active' : ''} 
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('about');
              }}
            >
              About
            </a>
          </li>
        </ul>
      </nav>
      <div className="header-right">
        <ThemeToggle compact={true} />
      </div>
    </header>
  );
};

export default Header;
