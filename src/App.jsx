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
            <path d="M6,3A3,3 0 0,1 9,6C9,7.31 8.17,8.42 7,8.83V15.17C8.17,15.58 9,16.69 9,18A3,3 0 0,1 6,21A3,3 0 0,1 3,18C3,16.69 3.83,15.58 5,15.17V8.83C3.83,8.42 3,7.31 3,6A3,3 0 0,1 6,3M6,5A1,1 0 0,0 5,6A1,1 0 0,0 6,7A1,1 0 0,0 7,6A1,1 0 0,0 6,5M6,17A1,1 0 0,0 5,18A1,1 0 0,0 6,19A1,1 0 0,0 7,18A1,1 0 0,0 6,17M21,18A3,3 0 0,1 18,21A3,3 0 0,1 15,18C15,16.69 15.83,15.58 17,15.17V7H15V10.25L10.75,6L15,1.75V5H17A2,2 0 0,1 19,7V15.17C20.17,15.58 21,16.69 21,18M18,17A1,1 0 0,0 17,18A1,1 0 0,0 18,19A1,1 0 0,0 19,18A1,1 0 0,0 18,17Z" />
          </svg>
          Key Features
        </h3>
        <div className="feature-list">
          <div className="feature-item">
            <svg viewBox="0 0 24 24">
              <path d="M12,6V9L16,5L12,1V4A8,8 0 0,0 4,12C4,13.57 4.46,15.03 5.24,16.26L6.7,14.8C6.25,13.97 6,13 6,12A6,6 0 0,1 12,6M18.76,7.74L17.3,9.2C17.74,10.04 18,11 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.43 19.54,8.97 18.76,7.74Z" />
            </svg>
            <span>Real-time price updates with automatic refresh</span>
          </div>
          <div className="feature-item">
            <svg viewBox="0 0 24 24">
              <path d="M2,2H4V20H22V22H2V2M7,10H17V13H7V10M7,15H14V18H7V15M7,5H20V8H7V5Z" />
            </svg>
            <span>Grid and list view options for data display</span>
          </div>
          <div className="feature-item">
            <svg viewBox="0 0 24 24">
              <path d="M15,19L9,16.89V5L15,7.11V19M20.5,3C20.5,3 20,4.5 20,8.5C20,12.5 20.5,14 20.5,14C20.5,14 20,15.5 20,19.5C20,23.5 20.5,25 20.5,25H16V17.89L18,19V7L16,8.11V1H4A2,2 0 0,0 2,3V11H5A1,1 0 0,1 6,12A1,1 0 0,1 5,13H2V21A2,2 0 0,0 4,23H16V25H20.5C20.5,25 21,23.5 21,19.5C21,15.5 20.5,14 20.5,14C20.5,14 21,12.5 21,8.5C21,4.5 20.5,3 20.5,3Z" />
            </svg>
            <span>Advanced filtering by price range, market cap</span>
          </div>
          <div className="feature-item">
            <svg viewBox="0 0 24 24">
              <path d="M3,14L3.5,14.07L8.07,9.5C7.89,8.85 8.06,8.11 8.59,7.59C9.37,6.8 10.63,6.8 11.41,7.59C11.94,8.11 12.11,8.85 11.93,9.5L14.5,12.07L15,12C15.18,12 15.35,12 15.5,12.07L19.07,8.5C19,8.35 19,8.18 19,8A2,2 0 0,1 21,6A2,2 0 0,1 23,8A2,2 0 0,1 21,10C20.82,10 20.65,10 20.5,9.93L16.93,13.5C17,13.65 17,13.82 17,14A2,2 0 0,1 15,16A2,2 0 0,1 13,14L13.07,13.5L10.5,10.93C10.18,11 9.82,11 9.5,10.93L4.93,15.5L5,16A2,2 0 0,1 3,18A2,2 0 0,1 1,16A2,2 0 0,1 3,14Z" />
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
              <path d="M13,2.05V4.05C17.39,4.59 20.5,8.58 19.96,12.97C19.5,16.61 16.64,19.5 13,19.93V21.93C18.5,21.38 22.5,16.5 21.95,11C21.5,6.25 17.73,2.5 13,2.03V2.05M5.67,19.74C7.18,21 9.04,21.79 11,22V20C9.58,19.82 8.23,19.25 7.1,18.37L5.67,19.74M7.1,5.74C8.22,4.84 9.57,4.26 11,4.06V2.06C9.05,2.25 7.19,3 5.67,4.26L7.1,5.74M5.69,7.1L4.26,5.67C3,7.19 2.26,9.04 2.05,11H4.05C4.24,9.58 4.8,8.23 5.69,7.1M4.06,13H2.06C2.26,14.96 3.03,16.81 4.27,18.33L5.69,16.9C4.81,15.77 4.24,14.42 4.06,13M10,16.5L16,12L10,7.5V16.5Z" />
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
              <path d="M16,11.78L20.24,4.45L21.97,5.45L16.74,14.5L10.23,10.75L5.46,19H22V21H2V3H4V17.54L9.5,8L16,11.78Z" />
            </svg>
            <span>Comprehensive market data dashboard</span>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h3>
          <svg viewBox="0 0 24 24">
            <path d="M17,16.47V7.39L11,4.45V2H13V0H11A2,2 0 0,0 9,2V4.45L3,7.39V16.47C3,16.97 3.27,17.39 3.71,17.62L9.78,20.77L15.86,17.62C16.27,17.34 16.57,16.97 17,16.47M10.09,18.89L5.5,16.57L5.5,9.35L10.09,12.03V18.89M12,11.34L7.5,8.56L12,5.75L16.5,8.56L12,11.34M18.5,16.57L13.91,18.89V12.03L18.5,9.35V16.57Z" />
          </svg>
          Technology Stack
        </h3>
        <div className="tech-list">
          <div className="tech-item">
            <svg viewBox="0 0 24 24">
              <path d="M12,10.11C13.03,10.11 13.87,10.95 13.87,12C13.87,13 13.03,13.85 12,13.85C10.97,13.85 10.13,13 10.13,12C10.13,10.95 10.97,10.11 12,10.11M7.37,20C8,20.38 9.38,19.8 10.97,18.3C11.5,17.8 12,17.2 12.3,16.6C12.07,16.58 11.83,16.56 11.6,16.56C10.3,16.56 9.12,16.76 8.12,17.16C7.37,17.42 6.73,17.73 6.19,18.26C6.04,19 6.37,19.66 7.37,20M7.09,14.42C7.09,14.25 7.12,14.08 7.16,13.92C6.5,14.09 5.88,14.32 5.41,14.6C4.88,14.92 4.5,15.28 4.5,15.69C4.5,16.11 4.88,16.47 5.41,16.79C5.88,17.08 6.5,17.31 7.16,17.5C7.12,17.33 7.09,17.17 7.09,17C7.09,16.2 7.09,15.56 7.09,14.42M18.91,14.42C18.91,15.56 18.91,16.2 18.91,17C18.91,17.17 18.88,17.33 18.84,17.5C19.5,17.31 20.12,17.08 20.59,16.79C21.12,16.47 21.5,16.11 21.5,15.69C21.5,15.28 21.12,14.92 20.59,14.6C20.12,14.32 19.5,14.09 18.84,13.92C18.88,14.08 18.91,14.25 18.91,14.42M16.88,17.16C15.88,16.76 14.7,16.56 13.4,16.56C13.17,16.56 12.93,16.58 12.7,16.6C13,17.2 13.5,17.8 14.03,18.3C15.62,19.8 17,20.38 17.63,20C18.63,19.66 18.96,19 18.81,18.26C18.27,17.73 17.63,17.42 16.88,17.16M12,13.85C11.97,13.85 11.93,13.84 11.9,13.82C11.97,13.84 12.03,13.85 12.1,13.85C12.17,13.85 12.23,13.84 12.3,13.82C12.27,13.84 12.23,13.85 12.2,13.85H12M14.6,12C14.6,10.76 13.7,9.76 12.5,9.58V8.53C13.96,8.78 15.09,10.25 14.98,12C15.09,13.75 13.96,15.22 12.5,15.47V14.42C13.7,14.24 14.6,13.24 14.6,12M11.69,10.53C10.67,11.12 9.6,11.75 9.6,12C9.6,12.25 10.67,12.88 11.69,13.47V10.53M11.5,9.58C10.3,9.76 9.4,10.76 9.4,12C9.4,13.24 10.3,14.24 11.5,14.42V15.47C10.04,15.22 8.91,13.75 9.02,12C8.91,10.25 10.04,8.78 11.5,8.53V9.58M12.31,10.53V13.47C13.33,12.88 14.4,12.25 14.4,12C14.4,11.75 13.33,11.12 12.31,10.53Z" />
            </svg>
            <span>React.js with Hooks</span>
          </div>
          <div className="tech-item">
            <svg viewBox="0 0 24 24">
              <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z" />
            </svg>
            <span>Axios for API requests</span>
          </div>
          <div className="tech-item">
            <svg viewBox="0 0 24 24">
              <path d="M3,3H21V21H3V3M7.73,18.04C8.13,18.89 8.92,19.59 10.27,19.59C11.77,19.59 12.8,18.79 12.8,17.04V11.26H11.1V17C11.1,17.86 10.75,18.08 10.2,18.08C9.62,18.08 9.38,17.68 9.11,17.21L7.73,18.04M13.71,17.86C14.21,18.84 15.22,19.59 16.8,19.59C18.4,19.59 19.6,18.76 19.6,17.23C19.6,15.82 18.79,15.19 17.35,14.57L16.93,14.39C16.2,14.08 15.89,13.87 15.89,13.37C15.89,12.96 16.2,12.64 16.7,12.64C17.18,12.64 17.5,12.85 17.79,13.37L19.1,12.5C18.55,11.54 17.77,11.17 16.7,11.17C15.19,11.17 14.22,12.13 14.22,13.4C14.22,14.78 15.03,15.43 16.25,15.95L16.67,16.13C17.45,16.47 17.91,16.68 17.91,17.26C17.91,17.74 17.46,18.09 16.76,18.09C15.93,18.09 15.45,17.66 15.09,17.06L13.71,17.86Z" />
            </svg>
            <span>JavaScript ES6+</span>
          </div>
          <div className="tech-item">
            <svg viewBox="0 0 24 24">
              <path d="M5,3L4.35,6.34H17.94L17.5,8.5H3.92L3.26,11.83H16.85L16.09,15.64L10.61,17.45L5.86,15.64L6.19,14H2.85L2.06,18L9.91,21L18.96,18L20.16,11.97L20.4,10.76L21.94,3H5Z" />
            </svg>
            <span>CSS3 with custom properties</span>
          </div>
          <div className="tech-item">
            <svg viewBox="0 0 24 24">
              <path d="M19.35,11.72L17.22,13.85L15.81,12.43L8.1,20.14L3.5,22L2,20.5L3.86,15.9L11.57,8.19L10.15,6.78L12.28,4.65L19.35,11.72M16.76,3C17.93,1.83 19.83,1.83 21,3C22.17,4.17 22.17,6.07 21,7.24L19.08,9.16L14.84,4.92L16.76,3M5.56,17.03L4.5,19.5L6.97,18.44L14.4,11L13,9.6L5.56,17.03Z" />
            </svg>
            <span>Chart.js for data visualization</span>
          </div>
          <div className="tech-item">
            <svg viewBox="0 0 24 24">
              <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
            </svg>
            <span>CoinGecko cryptocurrency API</span>
          </div>
          <div className="tech-item">
            <svg viewBox="0 0 24 24">
              <path d="M16.67,4.77C16.67,3.73 15.82,2.88 14.79,2.88C14.08,2.88 13.44,3.25 13.1,3.81C12.89,3.71 12.67,3.63 12.42,3.63C11.39,3.63 10.54,4.47 10.54,5.5C10.54,5.64 10.56,5.78 10.6,5.91C10.12,6.33 9.36,6.92 8.63,7.75L8.77,7.91C9.13,7.79 9.5,7.75 9.83,7.75C10.88,7.75 11.74,8.15 12.33,8.56C12.71,8.13 13.17,7.82 13.71,7.65L13.97,7.14C13.8,7.06 13.63,7 13.44,7C12.7,7 12.32,7.6 12.13,8.13C11.42,7.64 10.67,7.3 9.83,7.3C9.5,7.3 9.17,7.35 8.88,7.47L8.12,6.62C8.92,5.73 9.75,5.08 10.27,4.64C10.34,4.89 10.47,5.31 10.5,5.5C10.5,5.5 10.98,3.83 11.96,4.01C11.96,4.01 11.7,5.7 13.03,6.08C13.03,6.08 14.1,4.7 14.9,5.5C14.9,5.5 15.03,7.09 16.64,6.16C16.63,5.16 16.63,6.25 16.67,4.77M16.44,5.53C16.16,6.17 15.45,6.41 15.2,6.13C14.95,5.85 15.42,5.21 15.7,4.57C15.98,3.93 16.16,3.17 16.44,3.45C16.71,3.73 16.71,4.89 16.44,5.53M14.3,6.31C13.94,6.87 13.2,7.12 12.97,6.88C12.74,6.64 13.16,5.94 13.53,5.38C13.9,4.82 14.47,4.29 14.7,4.53C14.93,4.77 14.67,5.76 14.3,6.31M11.45,5.04C11.08,5.59 10.64,5.92 10.46,5.74C10.29,5.56 10.4,5.04 10.77,4.5C11.14,3.93 11.67,3.53 11.85,3.71C12.03,3.89 11.82,4.5 11.45,5.04M10.45,5.86C10.68,5.33 10.58,4.8 10.25,4.72C9.92,4.64 9.33,5.03 9.11,5.56C8.88,6.09 8.9,6.64 9.23,6.72C9.56,6.8 10.22,6.39 10.45,5.86M7.91,7.97C7.91,7.97 7.22,7.33 7.39,6.97C7.56,6.62 9.68,7.42 9.68,7.42L8.21,9.16L7.91,7.97M17.04,8.88C17.19,8.88 17.35,8.88 17.5,8.91C19.22,9.09 20.58,10.54 20.58,12.31C20.58,13.33 20.11,14.26 19.36,14.9C19.33,14.93 19.29,14.96 19.25,15C19.17,15.07 19.08,15.14 19,15.2C18.97,15.22 18.95,15.23 18.92,15.25C18.77,15.34 18.62,15.43 18.46,15.5C18.43,15.53 18.39,15.54 18.35,15.55C18.23,15.61 18.12,15.66 18,15.7C17.94,15.71 17.89,15.73 17.83,15.74C17.71,15.78 17.59,15.81 17.47,15.82C17.39,15.84 17.31,15.84 17.23,15.85C17.15,15.85 17.07,15.86 17,15.87C17,15.87 16.78,15.87 16.5,15.87C16.22,15.87 16,15.87 16,15.87C15.93,15.87 15.85,15.86 15.77,15.85C15.69,15.85 15.61,15.84 15.53,15.82C15.4,15.81 15.29,15.77 15.16,15.74C15.1,15.73 15.05,15.71 15,15.7C14.88,15.66 14.76,15.61 14.65,15.56C14.61,15.54 14.57,15.53 14.54,15.5C14.38,15.43 14.23,15.35 14.08,15.25C14.05,15.23 14.03,15.22 14,15.2C13.92,15.14 13.83,15.07 13.75,15C13.72,14.97 13.68,14.94 13.64,14.9C12.88,14.26 12.42,13.33 12.42,12.31C12.42,10.54 13.78,9.09 15.5,8.91C15.65,8.89 15.81,8.88 15.96,8.88H17.04M12.75,15.75V16.5H15V17.25H16.5V16.5H18.75V15.75H12.75Z" />
            </svg>
            <span>Vite.js for development</span>
          </div>
          <div className="tech-item">
            <svg viewBox="0 0 24 24">
              <path d="M12,1.85C11.73,1.85 11.45,1.92 11.22,2.05L3.78,6.35C3.3,6.63 3,7.15 3,7.71V16.29C3,16.85 3.3,17.37 3.78,17.65L5.73,18.77C6.68,19.23 7,19.24 7.44,19.24C8.84,19.24 9.65,18.39 9.65,16.91V8.44C9.65,8.32 9.55,8.22 9.43,8.22H8.5C8.37,8.22 8.27,8.32 8.27,8.44V16.91C8.27,17.57 7.59,18.22 6.5,17.67L4.45,16.5C4.38,16.45 4.34,16.37 4.34,16.29V7.71C4.34,7.62 4.38,7.54 4.45,7.5L11.89,3.21C11.95,3.17 12.05,3.17 12.11,3.21L19.55,7.5C19.62,7.54 19.66,7.62 19.66,7.71V16.29C19.66,16.37 19.62,16.45 19.55,16.5L12.11,20.79C12.05,20.83 11.95,20.83 11.88,20.79L10,19.65C9.92,19.62 9.84,19.61 9.79,19.64C9.26,19.94 9.16,20 8.67,20.15C8.55,20.19 8.36,20.26 8.74,20.47L11.22,21.94C11.46,22.08 11.72,22.15 12,22.15C12.28,22.15 12.54,22.08 12.78,21.94L20.22,17.65C20.7,17.37 21,16.85 21,16.29V7.71C21,7.15 20.7,6.63 20.22,6.35L12.78,2.05C12.55,1.92 12.28,1.85 12,1.85M14,8C11.88,8 10.61,8.89 10.61,10.39C10.61,12 11.87,12.47 13.91,12.67C16.34,12.91 16.53,13.27 16.53,13.75C16.53,14.58 15.86,14.93 14.3,14.93C12.32,14.93 11.9,14.44 11.75,13.46C11.73,13.36 11.64,13.28 11.53,13.28H10.57C10.45,13.28 10.36,13.37 10.36,13.5C10.36,14.74 11.04,16.24 14.3,16.24C16.65,16.24 18,15.31 18,13.69C18,12.08 16.92,11.66 14.63,11.35C12.32,11.05 12.09,10.89 12.09,10.35C12.09,9.9 12.29,9.3 14,9.3C15.5,9.3 16.09,9.63 16.32,10.66C16.34,10.76 16.43,10.83 16.53,10.83H17.5C17.55,10.83 17.61,10.81 17.65,10.76C17.69,10.72 17.72,10.66 17.7,10.6C17.56,8.82 16.38,8 14,8Z" />
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
              <path d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19M18.5 18.5V13.2A3.26 3.26 0 0 0 15.24 9.94C14.39 9.94 13.4 10.46 12.92 11.24V10.13H10.13V18.5H12.92V13.57C12.92 12.8 13.54 12.17 14.31 12.17A1.4 1.4 0 0 1 15.71 13.57V18.5H18.5M6.88 8.56A1.68 1.68 0 0 0 8.56 6.88C8.56 5.95 7.81 5.19 6.88 5.19A1.69 1.69 0 0 0 5.19 6.88C5.19 7.81 5.95 8.56 6.88 8.56M8.27 18.5V10.13H5.5V18.5H8.27Z" />
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
          <div className="version-info">Version 1.0.0</div>
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
