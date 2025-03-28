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
      console.error('Error fetching data:', error);
      
      // More specific error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        if (error.response.status === 429) {
          setError('Rate limit exceeded. Please try again in a minute.');
        } else if (error.response.status >= 500) {
          setError('CoinGecko API service is currently unavailable. Please try again later.');
        } else {
          setError(`API Error: ${error.response.status} - ${error.response.statusText}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
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
      
      {/* Use Suspense for lazy-loaded MarketMetrics component */}
      <Suspense fallback={<div className="loading-metrics">Loading market metrics...</div>}>
        <MarketMetrics coins={coins} loading={loading} />
      </Suspense>
      
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
        
        {/* Highest Volume Card - FIXED: removed extra closing div */}
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
        
        {/* Market Cap Leaders Card - FIXED: restructured to match others */}
        <div className="market-trend-card">
          <div className="trend-card-header market-cap">
            <h3>
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M6,16.5L3,19.44V11H6M11,14.66L9.43,13.32L8,14.64V7H11M16,13L13,16V3H16M18.81,12.81L17,11H22V16L20.21,14.21L13,21.36L9.53,18.34L5.75,22H3L9.47,15.66L13,18.64" />
              </svg>
              Market Cap Leaders
            </h3>
            <span className="view-all">View All</span>
          </div>
          <table className="market-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredCoins()
                .sort((a, b) => b.market_cap - a.market_cap)
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
                    <td className="marketcap-value">${(coin.market_cap / 1000000000).toFixed(1)}B</td>
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
