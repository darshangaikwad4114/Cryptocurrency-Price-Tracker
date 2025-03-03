import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Coin from './components/Coin/Coin';
import CoinSkeleton from './components/Coin/CoinSkeleton';
import './App.css';
import logo from './assets/logo.svg';

function App() {
  const [coins, setCoins] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePage, setActivePage] = useState('home');
  
  // Filter states
  const [sortBy, setSortBy] = useState('market_cap_desc');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  
  // Market cap categories
  const marketCapCategories = [
    { name: 'Large Cap (>$10B)', min: 10000000000, max: Infinity },
    { name: 'Mid Cap ($1B-$10B)', min: 1000000000, max: 10000000000 },
    { name: 'Small Cap (<$1B)', min: 0, max: 1000000000 },
  ];

  // Add view mode state
  const [viewMode, setViewMode] = useState('grid');
  const [sideFilterOpen, setSideFilterOpen] = useState(false);
  const filterPanelRef = useRef(null);

  useEffect(() => {
    const fetchCoins = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching cryptocurrency data...');
        const response = await axios.get(
          'https://api.coingecko.com/api/v3/coins/markets',
          {
            params: {
              vs_currency: 'usd',
              order: sortBy, // Use the sortBy state
              per_page: 100,
              page: 1,
              sparkline: false,
            },
            timeout: 10000, // Add timeout to prevent hanging requests
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            }
          }
        );
        
        console.log('Data received:', response.data.length, 'coins');
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setCoins(response.data);
          setError(null);
        } else {
          console.error('Empty or invalid response data:', response.data);
          setError('Received empty data from API');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(`Failed to fetch data: ${error.message || 'Unknown error'}`);
        
        // Check if we should use mock data on failure
        if (coins.length === 0) {
          console.log('Using fallback mock data');
          setCoins(getMockData());
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
    const interval = setInterval(fetchCoins, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [sortBy]); // Add sortBy to dependency array to refetch when sorting changes

  useEffect(() => {
    // Close side filter panel when clicking outside of it
    function handleClickOutside(event) {
      if (sideFilterOpen && 
          filterPanelRef.current && 
          !filterPanelRef.current.contains(event.target) && 
          !event.target.closest('.toggle-filters-btn')) {
        setSideFilterOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sideFilterOpen]);

  // Mock data for fallback
  const getMockData = () => {
    return [
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        current_price: 58000,
        market_cap: 1100000000000,
        market_cap_rank: 1,
        total_volume: 38000000000,
        price_change_percentage_24h: 2.5,
      },
      {
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
        current_price: 3500,
        market_cap: 420000000000,
        market_cap_rank: 2,
        total_volume: 21000000000,
        price_change_percentage_24h: 1.8,
      },
      // Add a few more mock cryptocurrencies if needed
    ];
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };
  
  // Handle price range inputs
  const handlePriceRangeChange = (e) => {
    const { name, value } = e.target;
    setPriceRange(prev => ({
      ...prev,
      [name]: value === '' ? '' : parseFloat(value)
    }));
  };
  
  // Handle category selection
  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };
  
  // Handle sorting change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };
  
  // Toggle view mode between grid and list
  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearch('');
    setSortBy('market_cap_desc');
    setPriceRange({ min: '', max: '' });
    setSelectedCategories([]);
  };

  // Update active filter count whenever filters change
  useEffect(() => {
    let count = 0;
    
    if (search) count++;
    if (sortBy !== 'market_cap_desc') count++;
    if (priceRange.min !== '' || priceRange.max !== '') count++;
    if (selectedCategories.length > 0) count++;
    
    setActiveFilterCount(count);
  }, [search, sortBy, priceRange, selectedCategories]);

  // Apply all filters to the coins
  const filteredCoins = coins.filter((coin) => {
    // Text search filter
    const matchesSearch = 
      coin.name.toLowerCase().includes(search.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(search.toLowerCase());
      
    // Price range filter
    const matchesPrice = 
      (priceRange.min === '' || coin.current_price >= priceRange.min) && 
      (priceRange.max === '' || coin.current_price <= priceRange.max);
      
    // Category filter
    let matchesCategory = true;
    if (selectedCategories.length > 0) {
      matchesCategory = selectedCategories.some(category => {
        const cat = marketCapCategories.find(c => c.name === category);
        return cat && coin.market_cap >= cat.min && coin.market_cap < cat.max;
      });
    }
    
    return matchesSearch && matchesPrice && matchesCategory;
  });

  const renderFilters = () => (
    <div 
      className={`side-filters-panel ${sideFilterOpen ? 'active' : ''}`}
      ref={filterPanelRef}
    >
      <div className="filters-header">
        <h2>Filter</h2>
        <button 
          onClick={() => setSideFilterOpen(false)} 
          className="close-filters-btn"
          aria-label="Close filters"
        >
          ×
        </button>
      </div>
      
      <div className="filter-section">
        <h3>Sort by</h3>
        <select 
          value={sortBy} 
          onChange={handleSortChange}
          className="filter-select"
        >
          <option value="market_cap_desc">Market Cap (High to Low)</option>
          <option value="market_cap_asc">Market Cap (Low to High)</option>
          <option value="volume_desc">Volume (High to Low)</option>
          <option value="volume_asc">Volume (Low to High)</option>
          <option value="price_desc">Price (High to Low)</option>
          <option value="price_asc">Price (Low to High)</option>
          <option value="id_asc">Name (A-Z)</option>
          <option value="id_desc">Name (Z-A)</option>
        </select>
      </div>

      <div className="filter-section">
        <h3>Price Range (USD)</h3>
        <div className="price-range-inputs">
          <div className="price-input-group">
            <span className="currency-symbol">$</span>
            <input
              type="number"
              name="min"
              placeholder="Min"
              value={priceRange.min}
              onChange={handlePriceRangeChange}
              className="price-input"
              min="0"
            />
          </div>
          <span className="range-separator">to</span>
          <div className="price-input-group">
            <span className="currency-symbol">$</span>
            <input
              type="number"
              name="max"
              placeholder="Max"
              value={priceRange.max}
              onChange={handlePriceRangeChange}
              className="price-input"
              min={priceRange.min || 0}
            />
          </div>
        </div>
      </div>

      <div className="filter-section">
        <h3>Market Cap</h3>
        <div className="category-checkboxes">
          {marketCapCategories.map((category) => (
            <label key={category.name} className="category-checkbox">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.name)}
                onChange={() => handleCategoryChange(category.name)}
              />
              <span className="checkbox-custom"></span>
              {category.name}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-actions">
        <button 
          className="apply-filters-btn" 
          onClick={() => setSideFilterOpen(false)}
        >
          Apply
        </button>
        <button 
          className="reset-filters-btn" 
          onClick={resetFilters}
          disabled={activeFilterCount === 0}
        >
          Reset
        </button>
      </div>
    </div>
  );

  const renderActiveFilters = () => {
    if (activeFilterCount === 0) return null;
    
    return (
      <div className="active-filters">
        <div className="active-filters-header">
          <h3>Active Filters</h3>
          <button 
            className="clear-all-btn" 
            onClick={resetFilters}
          >
            Clear All
          </button>
        </div>
        <div className="filter-tags">
          {search && (
            <div className="filter-tag">
              <span>Search: {search}</span>
              <button onClick={() => setSearch('')}>×</button>
            </div>
          )}
          
          {sortBy !== 'market_cap_desc' && (
            <div className="filter-tag">
              <span>Sort: {sortBy.replace('_', ' ').replace('asc', '↑').replace('desc', '↓')}</span>
              <button onClick={() => setSortBy('market_cap_desc')}>×</button>
            </div>
          )}
          
          {(priceRange.min !== '' || priceRange.max !== '') && (
            <div className="filter-tag">
              <span>
                Price: 
                {priceRange.min !== '' ? ` $${priceRange.min}` : ' $0'} 
                {' - '} 
                {priceRange.max !== '' ? `$${priceRange.max}` : 'Any'}
              </span>
              <button onClick={() => setPriceRange({ min: '', max: '' })}>×</button>
            </div>
          )}
          
          {selectedCategories.map(cat => (
            <div key={cat} className="filter-tag">
              <span>{cat}</span>
              <button onClick={() => handleCategoryChange(cat)}>×</button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHome = () => (
    <>
      <div className="top-controls">
        <div className="search-and-filter-container">
          <div className="search-container">
            <div className="search-icon">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search cryptocurrencies..."
              className="search-input"
              value={search}
              onChange={handleSearch}
            />
            {search && (
              <button 
                className="clear-search" 
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          
          <div className="view-filter-controls">
            <div className="view-options">
              <button 
                className={`view-option-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => toggleViewMode('grid')}
                aria-label="Grid view"
              >
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M3,3H10V10H3V3M13,3H21V10H13V3M3,13H10V21H3V13M13,13H21V21H13V13Z" />
                </svg>
              </button>
              <button 
                className={`view-option-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => toggleViewMode('list')}
                aria-label="List view"
              >
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M3,4H21V8H3V4M3,10H21V14H3V10M3,16H21V20H3V16Z" />
                </svg>
              </button>
            </div>
            
            <button 
              className={`toggle-filters-btn ${activeFilterCount > 0 ? 'has-filters' : ''}`}
              onClick={() => setSideFilterOpen(prev => !prev)}
            >
              <svg className="filter-icon" viewBox="0 0 24 24" width="16" height="16">
                <path d="M4,4H20V6.172L13,13.172V18L11,20V13.172L4,6.172V4Z" />
              </svg>
              {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filter'}
            </button>
          </div>
        </div>
      </div>
      
      {renderFilters()}
      {renderActiveFilters()}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <p>Using fallback data or data from last successful fetch.</p>
        </div>
      )}
      
      <div className="results-summary">
        <p className="results-summary-text">
          Showing {filteredCoins.length} of {coins.length} cryptocurrencies
        </p>
      </div>
      
      <div className={`coins-container ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
        {loading ? (
          Array(10).fill(0).map((_, index) => <CoinSkeleton key={index} />)
        ) : filteredCoins.length > 0 ? (
          filteredCoins.map((coin) => (
            <Coin
              key={coin.id}
              id={coin.id}
              name={coin.name}
              image={coin.image}
              symbol={coin.symbol}
              price={coin.current_price}
              volume={coin.total_volume}
              priceChange={coin.price_change_percentage_24h}
              marketCap={coin.market_cap}
              rank={coin.market_cap_rank}
              viewMode={viewMode}
            />
          ))
        ) : (
          <div className="no-coins-message">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path d="M12,2C17.5,2 22,6.5 22,12C22,17.5 17.5,22 12,22C6.5,22 2,17.5 2,12C2,6.5 6.5,2 12,2M12,4C7.58,4 4,7.58 4,12C4,16.42 7.58,20 12,20C16.42,20 20,16.42 20,12C20,7.58 16.42,4 12,4M11,7H13V13H11V7M11,15H13V17H11V15Z" />
            </svg>
            <p>No cryptocurrencies found.</p>
            <p className="no-results-tip">
              {error 
                ? 'API request failed.' 
                : activeFilterCount > 0 
                  ? 'Try removing some filters or changing your search criteria.' 
                  : 'Try a different search term.'}
            </p>
            {activeFilterCount > 0 && (
              <button className="clear-filters-btn" onClick={resetFilters}>
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
      
      {sideFilterOpen && <div className="filter-overlay" onClick={() => setSideFilterOpen(false)}></div>}
    </>
  );

  const renderMarkets = () => (
    <div className="markets-container">
      <h2>Market Overview</h2>
      <div className="market-stats">
        <div className="stat-card">
          <h3>Global Market Cap</h3>
          <p>$2.1T</p>
        </div>
        <div className="stat-card">
          <h3>24h Volume</h3>
          <p>$78.5B</p>
        </div>
        <div className="stat-card">
          <h3>BTC Dominance</h3>
          <p>42.1%</p>
        </div>
        <div className="stat-card">
          <h3>Active Cryptocurrencies</h3>
          <p>10,000+</p>
        </div>
      </div>
      <div className="market-trends">
        <h3>Top Gainers (24h)</h3>
        <table className="market-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filteredCoins
              .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
              .slice(0, 5)
              .map(coin => (
                <tr key={coin.id}>
                  <td>
                    <img src={coin.image} alt={coin.name} className="mini-coin-logo" />
                    {coin.name}
                  </td>
                  <td>${coin.current_price.toLocaleString()}</td>
                  <td className="positive-change">+{coin.price_change_percentage_24h.toFixed(2)}%</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="about-container">
      <h2>About Cryptocurrency Price Tracker</h2>
      <p>
        Cryptocurrency Price Tracker is a modern web application built with React
        that provides real-time information on cryptocurrency prices, market caps,
        and price changes.
      </p>
      
      <h3>Features</h3>
      <ul className="feature-list">
        <li>Real-time cryptocurrency price tracking</li>
        <li>Search functionality to find specific coins</li>
        <li>Detailed information on each cryptocurrency</li>
        <li>Visual indicators for price movements</li>
        <li>Responsive design for desktop and mobile devices</li>
      </ul>
      
      <h3>Data Source</h3>
      <p>
        All cryptocurrency data is fetched from the CoinGecko API, providing
        reliable and up-to-date information on thousands of cryptocurrencies.
      </p>
      
      <h3>Technologies Used</h3>
      <ul className="tech-list">
        <li>React</li>
        <li>Axios for API requests</li>
        <li>CSS3 with animations and transitions</li>
        <li>CoinGecko API</li>
      </ul>
    </div>
  );

  const renderContent = () => {
    switch (activePage) {
      case 'home':
        return renderHome();
      case 'markets':
        return renderMarkets();
      case 'about':
        return renderAbout();
      default:
        return renderHome();
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo-container">
          <img src={logo} className="logo" alt="Crypto Tracker Logo" />
          <h1>Crypto Tracker</h1>
        </div>
        <nav className="navigation">
          <button 
            className={`nav-button ${activePage === 'home' ? 'active' : ''}`}
            onClick={() => setActivePage('home')}
          >
            Home
          </button>
          <button 
            className={`nav-button ${activePage === 'markets' ? 'active' : ''}`}
            onClick={() => setActivePage('markets')}
          >
            Markets
          </button>
          <button 
            className={`nav-button ${activePage === 'about' ? 'active' : ''}`}
            onClick={() => setActivePage('about')}
          >
            About
          </button>
        </nav>
      </header>
      <main className="main-content">
        {renderContent()}
      </main>
      <footer className="footer">
        <p>© 2023 Cryptocurrency Price Tracker. Data provided by CoinGecko API.</p>
      </footer>
    </div>
  );
}

export default App;
