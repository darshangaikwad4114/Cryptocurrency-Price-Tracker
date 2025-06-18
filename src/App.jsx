import { useState, useEffect, useRef, useCallback, lazy, Suspense, useMemo } from 'react';
import axios from 'axios';
import Coin from './components/Coin/Coin';
import CoinSkeleton from './components/Coin/CoinSkeleton';
import useDebounce from './hooks/useDebounce';
import './App.css';
import logo from './assets/logo.svg';
import ListHeader from './components/ListHeader/ListHeader';
import NewsFeed from './components/NewsFeed/NewsFeed';
import CoinDetail from './components/CoinDetail/CoinDetail';

// Lazy load components for better performance
const MarketMetrics = lazy(() => import('./components/MarketMetrics/MarketMetrics'));
const MarketScreener = lazy(() => import('./components/MarketScreener/MarketScreener'));
const MarketSummary = lazy(() => import('./components/MarketSummary/MarketSummary'));

function App() {
  const [coins, setCoins] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePage, setActivePage] = useState('home');
  
  // Filter states - removed unused showFilters
  const [sortBy, setSortBy] = useState('market_cap_desc');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  
  // UI states
  const [viewMode, setViewMode] = useState('grid');
  const [sideFilterOpen, setSideFilterOpen] = useState(false);
  const filterPanelRef = useRef(null);
  
  // Debounce search for performance
  const debouncedSearch = useDebounce(search, 300);
  
  // Move marketCapCategories to useMemo
  const marketCapCategories = useMemo(() => [
    { name: 'Large Cap (>$10B)', min: 10000000000, max: Infinity },
    { name: 'Mid Cap ($1B-$10B)', min: 1000000000, max: 10000000000 },
    { name: 'Small Cap (<$1B)', min: 0, max: 1000000000 },
  ], []);

  // Fetch data with error handling and loading state
  const fetchCoins = useCallback(async () => {
    if (loading && coins.length > 0) return; // Prevent duplicate fetches when already loading
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching cryptocurrency data...');
      
      // Check if we've exceeded rate limits recently
      const lastApiCall = localStorage.getItem('lastApiCall');
      if (lastApiCall && Date.now() - parseInt(lastApiCall) < 10000) { // 10 seconds cooldown
        console.log('Rate limit cooldown in effect, using cached data');
        const cachedData = localStorage.getItem('coinData');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          setCoins(parsed.data);
          setLoading(false);
          return;
        }
      }
      
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets',
        {
          params: {
            vs_currency: 'usd',
            order: sortBy,
            per_page: 100,
            page: 1,
            sparkline: false,
          },
          timeout: 15000, // Increased timeout
          headers: {
            'Accept': 'application/json'
            // Removed Content-Type header which is not needed for GET requests
          }
        }
      );
      
      // Record this successful API call time
      localStorage.setItem('lastApiCall', Date.now().toString());
      
      console.log('Data received:', response.data.length, 'coins');
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setCoins(response.data);
        setError(null);
        
        // Store in localStorage as a cache
        localStorage.setItem('coinData', JSON.stringify({
          data: response.data,
          timestamp: Date.now()
        }));
      } else {
        console.error('Empty or invalid response data:', response.data);
        setError('Received empty data from API');
      }
    } catch (error) {
      console.error('Error fetching cryptocurrency data:', error);
      
      // Enhanced error handling
      if (error.response) {
        // Server responded with an error
        if (error.response.status === 429) {
          setError('API rate limit exceeded. Please try again later.');
        } else if (error.response.status >= 500) {
          setError('The cryptocurrency server is experiencing issues. Please try again later.');
        } else {
          setError(`API error ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
        }
      } else if (error.request) {
        // No response received
        setError('No response received from API. Please check your internet connection.');
      } else {
        // Something happened in setting up the request
        setError(`Failed to fetch data: ${error.message || 'Unknown error'}`);
      }
      
      // Try to use cached data if available
      const cachedData = localStorage.getItem('coinData');
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (Date.now() - parsed.timestamp < 3600000) { // 1 hour
            console.log('Using cached data');
            setCoins(parsed.data);
          } else {
            // Fallback to mock data if cache is old
            setCoins(getMockData());
          }
        } catch (e) {
          setCoins(getMockData());
        }
      } else {
        setCoins(getMockData());
      }
    } finally {
      setLoading(false);
    }
  }, [sortBy, loading, coins.length]);

  // Initial data fetch and periodic refresh
  useEffect(() => {
    fetchCoins();
    const interval = setInterval(fetchCoins, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [fetchCoins]);

  // Close side filter panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (sideFilterOpen && 
          filterPanelRef.current && 
          !filterPanelRef.current.contains(event.target) && 
          !event.target.closest('.toggle-filters-btn')) {
        setSideFilterOpen(false);
      }
    }

    // Handle escape key for accessibility
    function handleEscapeKey(event) {
      if (event.key === 'Escape' && sideFilterOpen) {
        setSideFilterOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
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
  
  // Handle price range inputs - improved validation
  const handlePriceRangeChange = (e) => {
    const { name, value } = e.target;
    
    // Ensure only valid numbers are accepted
    if (value === '' || (!isNaN(value) && Number(value) >= 0)) {
      setPriceRange(prev => ({
        ...prev,
        [name]: value === '' ? '' : parseFloat(value)
      }));
    }
  };
  
  // Handle category selection with toggle
  const handleCategoryChange = useCallback((category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  }, []);
  
  // Handle sorting change
  const handleSortChange = useCallback((e) => {
    setSortBy(typeof e === 'string' ? e : e.target.value);
  }, []);
  
  // Toggle view mode between grid and list
  const toggleViewMode = useCallback((mode) => {
    setViewMode(mode);
    // Save preference to localStorage
    localStorage.setItem('preferredViewMode', mode);
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearch('');
    setSortBy('market_cap_desc');
    setPriceRange({ min: '', max: '' });
    setSelectedCategories([]);
  }, []);

  // Load user preferences from localStorage on initial load
  useEffect(() => {
    const savedViewMode = localStorage.getItem('preferredViewMode');
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Update active filter count whenever filters change
  useEffect(() => {
    let count = 0;
    
    if (debouncedSearch) count++;
    if (sortBy !== 'market_cap_desc') count++;
    if (priceRange.min !== '' || priceRange.max !== '') count++;
    if (selectedCategories.length > 0) count++;
    
    setActiveFilterCount(count);
  }, [debouncedSearch, sortBy, priceRange, selectedCategories]);

  // Apply all filters to the coins - moved to useCallback for memoization
  const filteredCoins = useCallback(() => {
    return coins.filter((coin) => {
      // Text search filter
      const matchesSearch = 
        !debouncedSearch || 
        coin.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(debouncedSearch.toLowerCase());
        
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
  }, [coins, debouncedSearch, priceRange, selectedCategories, marketCapCategories]);

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
                {priceRange.min !== '' ? ` $${Number(priceRange.min).toLocaleString()}` : ' $0'} 
                {' - '} 
                {priceRange.max !== '' ? `$${Number(priceRange.max).toLocaleString()}` : 'Any'}
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

  // Detail view state
  const [selectedCoinId, setSelectedCoinId] = useState(null);

  // Handle coin click to show detail view
  const handleCoinClick = (coinId) => {
    setSelectedCoinId(coinId);
    // Stop page scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  // Close detail view
  const handleCloseDetail = () => {
    setSelectedCoinId(null);
    // Re-enable page scrolling
    document.body.style.overflow = '';
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
          Showing {filteredCoins().length} of {coins.length} cryptocurrencies
        </p>
      </div>
      
      {/* Pass sorting function to ListHeader for interactive column headers */}
      {viewMode === 'list' && !loading && filteredCoins().length > 0 && 
        <ListHeader 
          onSort={setSortBy} 
          sortBy={sortBy} 
        />
      }
      
      <div className={`coins-container ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
        {loading ? (
          Array(10).fill(0).map((_, index) => <CoinSkeleton key={index} />)
        ) : filteredCoins().length > 0 ? (
          filteredCoins().map((coin) => (
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
              onClick={handleCoinClick}
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
      
      {/* Add coin detail overlay when a coin is selected */}
      {selectedCoinId && (
        <CoinDetail 
          coinId={selectedCoinId} 
          onClose={handleCloseDetail} 
        />
      )}
      
      {sideFilterOpen && <div className="filter-overlay" onClick={() => setSideFilterOpen(false)}></div>}
    </>
  );

  const renderMarkets = () => (
    <div className="markets-container">
      <h2 className="markets-header">Global Crypto Market Dashboard</h2>
      
      {/* Quick Market Summary */}
      <Suspense fallback={<div className="loading-metrics">Loading market summary...</div>}>
        <MarketSummary coins={coins} loading={loading} />
      </Suspense>
      
      {/* Use Suspense for lazy-loaded MarketMetrics component */}
      <Suspense fallback={<div className="loading-metrics">Loading market metrics...</div>}>
        <MarketMetrics coins={coins} loading={loading} />
      </Suspense>
      
      {/* Market Screeners */}
      <Suspense fallback={<div className="loading-metrics">Loading market screeners...</div>}>
        <MarketScreener coins={coins} loading={loading} />
      </Suspense>
      
      <div className="market-trends-grid">
        {/* Top Gainers Card */}
        <div className="market-trend-card">
          <div className="trend-card-header gainers">
            <h3>
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M7,15L12,10L17,15H7Z" />
              </svg>
              Top Gainers (24h)
            </h3>
            <span className="view-all">View All</span>
          </div>
          <table className="market-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredCoins()
                .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
                .slice(0, 5)
                .map(coin => (
                  <tr key={coin.id}>
                    <td>
                      <div className="coin-name-cell">
                        <img src={coin.image} alt={coin.name} className="mini-coin-logo" />
                        <div className="coin-name-symbol">
                          <span className="table-coin-name">{coin.name}</span>
                          <span className="table-coin-symbol">{coin.symbol.toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td>${coin.current_price.toLocaleString()}</td>
                    <td className="positive-change">+{coin.price_change_percentage_24h.toFixed(2)}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Top Losers Card */}
        <div className="market-trend-card">
          <div className="trend-card-header losers">
            <h3>
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M7,10L12,15L17,10H7Z" />
              </svg>
              Top Losers (24h)
            </h3>
            <span className="view-all">View All</span>
          </div>
          <table className="market-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredCoins()
                .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
                .slice(0, 5)
                .map(coin => (
                  <tr key={coin.id}>
                    <td>
                      <div className="coin-name-cell">
                        <img src={coin.image} alt={coin.name} className="mini-coin-logo" />
                        <div className="coin-name-symbol">
                          <span className="table-coin-name">{coin.name}</span>
                          <span className="table-coin-symbol">{coin.symbol.toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td>${coin.current_price.toLocaleString()}</td>
                    <td className="negative-change">{coin.price_change_percentage_24h.toFixed(2)}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        
        {/* Highest Volume Card */}
        <div className="market-trend-card">
          <div className="trend-card-header volume">
            <h3>
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M17,13H13V17H11V13H7V11H11V7H13V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
              </svg>
              Highest Volume (24h)
            </h3>
            <span className="view-all">View All</span>
          </div>
          <table className="market-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Volume</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredCoins()
                .sort((a, b) => b.total_volume - a.total_volume)
                .slice(0, 5)
                .map(coin => (
                  <tr key={coin.id}>
                    <td>
                      <div className="coin-name-cell">
                        <img src={coin.image} alt={coin.name} className="mini-coin-logo" />
                        <div className="coin-name-symbol">
                          <span className="table-coin-name">{coin.name}</span>
                          <span className="table-coin-symbol">{coin.symbol.toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td>${coin.current_price.toLocaleString()}</td>
                    <td className="volume-value">${(coin.total_volume / 1000000).toFixed(1)}M</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="about-container">
      <h2>About Cryptocurrency Price Tracker</h2>
      
      <section className="about-section">
        <h3>
          <svg viewBox="0 0 24 24">
            <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
          </svg>
          Overview
        </h3>
        <p>
          Cryptocurrency Price Tracker is a modern, responsive web application that provides real-time 
          information on cryptocurrency prices, market caps, volumes, and price changes. Built with 
          React and powered by the CoinGecko API, this app offers an intuitive interface for tracking 
          the crypto market with advanced filtering, sorting, and multiple view modes.
        </p>
        <p>
          Whether you&apos;re a casual investor or a crypto enthusiast, this application provides all the 
          essential tools you need to stay informed about the cryptocurrency market in a clean, 
          user-friendly interface.
        </p>
      </section>

      <section className="about-section">
        <h3>
          <svg viewBox="0 0 24 24">
            <path d="M17,22V20H20V17H22V20.5C22,20.89 21.84,21.24 21.54,21.54C21.24,21.84 20.89,22 20.5,22H17M7,22H3.5C3.11,22 2.76,21.84 2.46,21.54C2.16,21.24 2,20.89 2,20.5V17H4V20H7V22M17,2H20.5C20.89,2 21.24,2.16 21.54,2.46C21.84,2.76 22,3.11 22,3.5V7H20V4H17V2M4,2H7V4H4V7H2V3.5C2,3.11 2.16,2.76 2.46,2.46C2.76,2.16 3.11,2 3.5,2H7M13,17.25C13,16.84 12.66,16.5 12.25,16.5C11.84,16.5 11.5,16.84 11.5,17.25C11.5,17.66 11.84,18 12.25,18C12.66,18 13,17.66 13,17.25M13,10.75C13,10.34 12.66,10 12.25,10C11.84,10 11.5,10.34 11.5,10.75C11.5,11.16 11.84,11.5 12.25,11.5C12.66,11.5 13,11.16 13,10.75M10,17.25C10,16.84 9.66,16.5 9.25,16.5C8.84,16.5 8.5,16.84 8.5,17.25C8.5,17.66 8.84,18 9.25,18C9.66,18 10,17.66 10,17.25M10,10.75C10,10.34 9.66,10 9.25,10C8.84,10 8.5,10.34 8.5,10.75C8.5,11.16 8.84,11.5 9.25,11.5C9.66,11.5 10,11.16 10,10.75M16,17.25C16,16.84 15.66,16.5 15.25,16.5C14.84,16.5 14.5,16.84 14.5,17.25C14.5,17.66 14.84,18 15.25,18C15.66,18 16,17.66 16,17.25M16,10.75C16,10.34 15.66,10 15.25,10C14.84,10 14.5,10.34 14.5,10.75C14.5,11.16 14.84,11.5 15.25,11.5C15.66,11.5 16,11.16 16,10.75M16,13.75C16,13.34 15.66,13 15.25,13C14.84,13 14.5,13.34 14.5,13.75C14.5,14.16 14.84,14.5 15.25,14.5C15.66,14.5 16,14.16 16,13.75M10,13.75C10,13.34 9.66,13 9.25,13C8.84,13 8.5,13.34 8.5,13.75C8.5,14.16 8.84,14.5 9.25,14.5C9.66,14.5 10,14.16 10,13.75M13,13.75C13,13.34 12.66,13 12.25,13C11.84,13 11.5,13.34 11.5,13.75C11.5,14.16 11.84,14.5 12.25,14.5C12.66,14.5 13,14.16 13,13.75M7,8.75C7,8.34 6.66,8 6.25,8C5.84,8 5.5,8.34 5.5,8.75C5.5,9.16 5.84,9.5 6.25,9.5C6.66,9.5 7,9.16 7,8.75M19,8.75C19,8.34 18.66,8 18.25,8C17.84,8 17.5,8.34 17.5,8.75C17.5,9.16 17.84,9.5 18.25,9.5C18.66,9.5 19,9.16 19,8.75M19,12C19,11.59 18.66,11.25 18.25,11.25C17.84,11.25 17.5,11.59 17.5,12C17.5,12.41 17.84,12.75 18.25,12.75C18.66,12.75 19,12.41 19,12M13,8.75C13,8.34 12.66,8 12.25,8C11.84,8 11.5,8.34 11.5,8.75C11.5,9.16 11.84,9.5 12.25,9.5C12.66,9.5 13,9.16 13,8.75M7,12C7,11.59 6.66,11.25 6.25,11.25C5.84,11.25 5.5,11.59 5.5,12C5.5,12.41 5.84,12.75 6.25,12.75C6.66,12.75 7,12.41 7,12M7,15.25C7,14.84 6.66,14.5 6.25,14.5C5.84,14.5 5.5,14.84 5.5,15.25C5.5,15.66 5.84,16 6.25,16C6.66,16 7,15.66 7,15.25M19,15.25C19,14.84 18.66,14.5 18.25,14.5C17.84,14.5 17.5,14.84 17.5,15.25C17.5,15.66 17.84,16 18.25,16C18.66,16 19,15.66 19,15.25Z" />
          </svg>
          Key Features
        </h3>
        <div className="feature-list">
          <div className="feature-item">
            <svg viewBox="0 0 24 24">
              <path d="M2,2H4V20H22V22H2V2M7,10H17V13H7V10M7,15H14V18H7V15M7,5H20V8H7V5Z" />
            </svg>
            <span>Grid and list view options for data display</span>
          </div>
          <div className="feature-item">
            <svg viewBox="0 0 24 24">
              <path d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3V3H19V3C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z" />
            </svg>
            <span>Advanced filtering by price range, market cap</span>
          </div>
          <div className="feature-item">
            <svg viewBox="0 0 24 24">
              <path d="M12,10.11C13.03,10.11 13.87,10.95 13.87,12C13.87,13 13.03,13.85 12,13.85C10.97,13.85 10.13,13 10.13,12C10.13,10.95 10.97,10.11 12,10.11M7.37,20C8,20.38 9.38,19.8 10.97,18.3C11.5,17.8 12,17.2 12.3,16.6C12.07,16.58 11.83,16.56 11.6,16.56C10.3,16.56 9.12,16.76 8.12,17.16C7.37,17.42 6.73,17.73 6.19,18.26C6.04,19 6.03,19.77 6.13,20.54C6.5,20.38 6.94,20.19 7.37,20M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19.5,19A0.5,0.5 0 0,1 19,19.5H5A0.5,0.5 0 0,1 4.5,19V5A0.5,0.5 0 0,1 5,4.5H19A0.5,0.5 0 0,1 19.5,5V19Z" />
            </svg>
            <span>Interactive sorting by multiple parameters</span>
          </div>
          <div className="feature-item">
            <svg viewBox="0 0 24 24">
              <path d="M17.45,15.18L22,7.31V19L22,21H2V3H4V15.54L9.5,6L16,9.78L20.24,2.45L21.97,3.45L16.74,12.5L10.23,8.75L4.31,19H6.57L10.96,11.44L17.45,15.18Z" />
            </svg>
            <span>Visual price indicators with intuitive UI</span>
          </div>
          <div className="feature-item">
            <svg viewBox="0 0 24 24">
              <path d="M12,2A9,9 0 0,0 3,11C3,14.03 4.53,16.82 7,18.47V22H9V19H11V22H13V19H15V22H17V18.46C19.47,16.81 21,14 21,11A9,9 0 0,0 12,2M8,11A2,2 0 0,1 10,13A2,2 0 0,1 8,15A2,2 0 0,1 6,13A2,2 0 0,1 8,11M16,11A2,2 0 0,1 18,13A2,2 0 0,1 16,15A2,2 0 0,1 14,13A2,2 0 0,1 16,11M12,6.5A2,2 0 0,1 14,8.5A2,2 0 0,1 12,10.5A2,2 0 0,1 10,8.5A2,2 0 0,1 12,6.5Z" />
            </svg>
            <span>Comprehensive market data dashboard</span>
          </div>
          <div className="feature-item">
            <svg viewBox="0 0 24 24">
              <path d="M20,11H4V8H20M20,15H13V13H20M20,19H13V17H20M11,19H4V13H11M20.33,4.67L18.67,3L17,4.67L15.33,3L13.67,4.67L12,3L10.33,4.67L8.67,3L7,4.67L5.33,3L3.67,4.67L2,3V19A2,2 0 0,0 4,21H20A2,2 0 0,0 22,19V3L20.33,4.67Z" />
            </svg>
            <span>Latest cryptocurrency news and insights</span>
          </div>
          <div className="feature-item">
            <svg viewBox="0 0 24 24">
              <path d="M4,6H20V16H4M20,18A2,2 0 0,0 22,16V6C22,4.89 21.1,4 20,4H4C2.89,4 2,4.89 2,6V16A2,2 0 0,0 4,18H0V20H24V18H20Z" />
            </svg>
            <span>Fully responsive design for all devices</span>
          </div>
          <div className="feature-item">
            <svg viewBox="0 0 24 24">
              <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z" />
            </svg>
            <span>Market sector analysis and performance tracking</span>
          </div>
          <div className="feature-item">
            <svg viewBox="0 0 24 24">
              <path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2.06 12.11,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L6.04,7.5L12,10.85L17.96,7.5L12,4.15M5,15.91L11,19.29V12.58L5,9.21V15.91M19,15.91V9.21L13,12.58V19.29L19,15.91Z" />
            </svg>
            <span>Exchange volume comparison and NFT collections</span>
          </div>
          <div className="feature-item">
            <svg viewBox="0 0 24 24">
              <path d="M16,11.78L20.24,4.45L21.97,5.45L16.74,12.5L10.23,8.75L4.31,19H6.57L10.96,11.44L17.45,15.18Z" />
            </svg>
            <span>Top gainers and losers market screener</span>
          </div>
          <div className="feature-item">
            <svg viewBox="0 0 24 24">
              <path d="M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,12.5A1.5,1.5 0 0,1 10.5,11A1.5,1.5 0 0,1 12,9.5A1.5,1.5 0 0,1 13.5,11A1.5,1.5 0 0,1 12,12.5M12,7.2C9.9,7.2 8.2,8.9 8.2,11C8.2,14 12,17.5 12,17.5C12,17.5 15.8,14 15.8,11C15.8,8.9 14.1,7.2 12,7.2Z" />
            </svg>
            <span>Global market insights with real-time updates</span>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h3>
          <svg viewBox="0 0 24 24">
            <path d="M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
          </svg>
          Technology Stack
        </h3>
        <div className="tech-list">
          <div className="tech-item">
            <svg viewBox="0 0 24 24">
              <path d="M12,10.11C13.03,10.11 13.87,10.95 13.87,12C13.87,13 13.03,13.85 12,13.85C10.97,13.85 10.13,13 10.13,12C10.13,10.95 10.97,10.11 12,10.11M7.37,20C8,20.38 9.38,19.8 10.97,18.3C11.5,17.8 12,17.2 12.3,16.6C12.07,16.58 11.83,16.56 11.6,16.56C10.3,16.56 9.12,16.76 8.12,17.16C7.37,17.42 6.73,17.73 6.19,18.26C6.04,19 6.03,19.77 6.13,20.54C6.5,20.38 6.94,20.19 7.37,20M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19.5,19A0.5,0.5 0 0,1 19,19.5H5A0.5,0.5 0 0,1 4.5,19V5A0.5,0.5 0 0,1 5,4.5H19A0.5,0.5 0 0,1 19.5,5V19Z" />
            </svg>
            <span>React.js with hooks and context</span>
          </div>
          <div className="tech-item">
            <svg viewBox="0 0 24 24">
              <path d="M8,3A2,2 0 0,0 6,5V9A2,2 0 0,1 4,11H3V13H4A2,2 0 0,1 6,15V19A2,2 0 0,0 8,21H10V19H8V14A2,2 0 0,0 6,12A2,2 0 0,0 8,10V5H10V3M16,3A2,2 0 0,1 18,5V9A2,2 0 0,0 20,11H21V13H20A2,2 0 0,0 18,15V19A2,2 0 0,1 16,21H14V19H16V14A2,2 0 0,1 18,12A2,2 0 0,1 16,10V5H14V3H16Z" />
            </svg>
            <span>Axios for API requests</span>
          </div>
          <div className="tech-item">
            <svg viewBox="0 0 24 24">
              <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
            </svg>
            <span>CoinGecko cryptocurrency API</span>
          </div>
          <div className="tech-item">
            <svg viewBox="0 0 24 24">
              <path d="M20,17A2,2 0 0,0 22,15V4A2,2 0 0,0 20,2H9.46C9.81,2.61 10,3.3 10,4H20V15H11V17M15,7V9H9V22H7V16H5V22H3V14H1.5V9A2,2 0 0,1 3.5,7H15M8,4A2,2 0 0,1 6,6A2,2 0 0,1 4,4A2,2 0 0,1 6,2A2,2 0 0,1 8,4Z" />
            </svg>
            <span>CryptoCompare news API integration</span>
          </div>
          <div className="tech-item">
            <svg viewBox="0 0 24 24">
              <path d="M14.6,16.6L19.2,12L14.6,7.4L16,6L22,12L16,18L14.6,16.6M9.4,16.6L4.8,12L9.4,7.4L8,6L2,12L8,18L9.4,16.6Z" />
            </svg>
            <span>Custom CSS with responsive design</span>
          </div>
          <div className="tech-item">
            <svg viewBox="0 0 24 24">
              <path d="M12,18.08C5.37,18.08 0,15.36 0,12C0,8.64 5.37,5.92 12,5.92C18.63,5.92 24,8.64 24,12C24,15.36 18.63,18.08 12,18.08M6.81,10.13C7.35,10.13 7.72,10.23 7.9,10.44C8.08,10.64 8.12,11 8.03,11.47C7.93,12 7.74,12.34 7.45,12.56C7.17,12.78 6.74,12.89 6.16,12.89H5.29L5.82,10.13H6.81M3.31,15.68H4.75L5.09,13.93H6.32C6.86,13.93 7.3,13.87 7.65,13.76C8,13.64 8.32,13.45 8.61,13.18C8.85,12.96 9.04,12.72 9.19,12.45C9.34,12.19 9.45,11.89 9.5,11.57C9.66,10.79 9.55,10.18 9.17,9.75C8.78,9.31 8.18,9.1 7.35,9.1H4.59L3.31,15.68M10.56,7.35L9.28,13.93H10.7L11.44,10.16H12.58C12.94,10.16 13.18,10.22 13.29,10.34C13.4,10.46 13.42,10.68 13.36,11L12.79,13.93H14.24L14.83,10.86C14.96,10.24 14.86,9.79 14.56,9.5C14.26,9.23 13.71,9.1 12.91,9.1H11.64L12,7.35H10.56M18,10.13C18.55,10.13 18.91,10.23 19.09,10.44C19.27,10.64 19.31,11 19.22,11.47C19.12,12 18.93,12.34 18.65,12.56C18.36,12.78 17.93,12.89 17.35,12.89H16.5L17,10.13H18M14.5,15.68H15.94L16.28,13.93H17.5C18.05,13.93 18.5,13.87 18.85,13.76C19.2,13.64 19.5,13.45 19.8,13.18C20.04,12.96 20.24,12.72 20.38,12.45C20.53,12.19 20.64,11.89 20.7,11.57C20.85,10.79 20.74,10.18 20.36,9.75C20,9.31 19.37,9.1 18.54,9.1H15.79L14.5,15.68Z" />
            </svg>
            <span>Vite.js for development</span>
          </div>
          <div className="tech-item">
            <svg viewBox="0 0 24 24">
              <path d="M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z" />
            </svg>
            <span>Efficient data caching and error handling</span>
          </div>
          <div className="tech-item">
            <svg viewBox="0 0 24 24">
              <path d="M3,3H21V21H3V3M7.73,18.04C8.13,18.89 8.92,19.59 10.27,19.59C11.77,19.59 12.8,18.79 12.8,17.04V11.26H11.1V17C11.1,17.86 10.75,18.08 10.2,18.08C9.62,18.08 9.38,17.68 9.11,17.21L7.73,18.04M13.71,17.86C14.21,18.84 15.22,19.59 16.8,19.59C18.4,19.59 19.6,18.76 19.6,17.23C19.6,15.82 18.79,15.19 17.35,14.57L16.93,14.39C16.2,14.08 15.89,13.87 15.89,13.37C15.89,12.96 16.2,12.64 16.7,12.64C17.18,12.64 17.5,12.85 17.79,13.37L19.1,12.5C18.55,11.54 17.77,11.17 16.7,11.17C15.19,11.17 14.22,12.13 14.22,13.4C14.22,14.78 15.03,15.43 16.25,15.95L16.67,16.13C17.45,16.47 17.91,16.68 17.91,17.26C17.91,17.74 17.46,18.09 16.76,18.09C15.93,18.09 15.45,17.66 15.09,17.06L13.71,17.86Z" />
            </svg>
            <span>Chart.js for interactive price visualization</span>
          </div>
          <div className="tech-item">
            <svg viewBox="0 0 24 24">
              <path d="M3,3H21V21H3V3M13.71,17.86C14.21,18.84 15.22,19.59 16.8,19.59C18.4,19.59 19.6,18.76 19.6,17.23C19.6,15.82 18.79,15.19 17.35,14.57L16.93,14.39C16.2,14.08 15.89,13.87 15.89,13.37C15.89,12.96 16.2,12.64 16.7,12.64C17.18,12.64 17.5,12.85 17.79,13.37L19.1,12.5C18.55,11.54 17.77,11.17 16.7,11.17C15.19,11.17 14.22,12.13 14.22,13.4C14.22,14.78 15.03,15.43 16.25,15.95L16.67,16.13C17.45,16.47 17.91,16.68 17.91,17.26C17.91,17.74 17.46,18.09 16.76,18.09C15.93,18.09 15.45,17.66 15.09,17.06L13.71,17.86M7.73,18.04C8.13,18.89 8.92,19.59 10.27,19.59C11.77,19.59 12.8,18.79 12.8,17.04V11.26H11.1V17C11.1,17.86 10.75,18.08 10.2,18.08C9.62,18.08 9.38,17.68 9.11,17.21L7.73,18.04Z" />
            </svg>
            <span>Node.js environment</span>
          </div>
        </div>
      </section>
      
      <section className="about-section">
        <h3>
          <svg viewBox="0 0 24 24">
            <path d="M12,4C14.21,4 16,5.79 16,8C16,10.21 14.21,12 12,12C9.79,12 8,10.21 8,8C8,5.79 9.79,4 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
          </svg>
          Developer Information
        </h3>
        <p>
          This application was developed by Darshan Gaikwad, a passionate software engineer focused on creating 
          intuitive and responsive web applications. The project was built as a showcase of modern React 
          development practices and UI/UX design principles.
        </p>
        
        <div className="social-links">
          <a href="https://github.com/darshangaikwad4114" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="GitHub">
            <svg viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z" />
            </svg>
          </a>
          <a href="https://www.linkedin.com/in/darshan-gaikwad/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24">
              <path d="M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H19M18.5,18.5V13.2A3.26,3.26 0 0,0 15.24,9.94C14.39,9.94 13.4,10.46 12.92,11.24V10.13H10.13V18.5H12.92V13.57C12.92,12.8 13.54,12.17 14.31,12.17A1.4,1.4 0 0,1 15.71,13.57V18.5H18.5M6.88,8.56A1.68,1.68 0 0,0 8.56,6.88C8.56,5.95 7.81,5.19 6.88,5.19A1.69,1.69 0 0,0 5.19,6.88C5.19,7.81 5.95,8.56 6.88,8.56M8.27,18.5V10.13H5.5V18.5H8.27Z" />
            </svg>
          </a>
          <a href="mailto:darshangaikwad4114@gmail.com" className="social-link" aria-label="Email">
            <svg viewBox="0 0 24 24">
              <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
            </svg>
          </a>
        </div>
        
        <div className="about-footer">
          <p>Want to contribute or check out more of my work? Visit my <a href="https://darshan-gaikwad-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer" style={{color: 'var(--accent-color)'}}>portfolio website</a>!</p>
          <div className="version-info">Version 2.0.0</div>
        </div>
      </section>
    </div>
  );

  const renderNews = () => (
    <div className="news-container">
      <NewsFeed />
    </div>
  );

  const renderContent = () => {
    switch (activePage) {
      case 'home':
        return renderHome();
      case 'markets':
        return renderMarkets();
      case 'news':
        return renderNews();
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
          <img src={logo} alt="Logo" className="logo" />
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
            className={`nav-button ${activePage === 'news' ? 'active' : ''}`}
            onClick={() => setActivePage('news')}
          >
            News
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
        <p>© {new Date().getFullYear()} Cryptocurrency Price Tracker. Data provided by CoinGecko API.</p>
      </footer>
    </div>
  );
}

export default App;
