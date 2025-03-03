import { useState, useEffect } from 'react';
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
              order: 'market_cap_desc',
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
  }, []);

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

  const filteredCoins = coins.filter((coin) =>
    coin.name.toLowerCase().includes(search.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const renderHome = () => (
    <>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search for a cryptocurrency..."
          className="search-input"
          onChange={handleSearch}
        />
      </div>
      
      {/* Add error message display */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <p>Using fallback data or data from last successful fetch.</p>
        </div>
      )}
      
      <div className="coins-container">
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
            />
          ))
        ) : (
          <div className="no-coins-message">
            <p>No cryptocurrencies found. {error ? 'API request failed.' : 'Try a different search term.'}</p>
          </div>
        )}
      </div>
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
