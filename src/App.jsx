import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import Coin from "./components/Coin/Coin";
import Header from "./components/Header/Header";
import ThemeToggle from "./components/ThemeToggle/ThemeToggle";
import { useTheme } from "./context/ThemeContext";
import CoinSkeleton from "./components/Coin/CoinSkeleton";
import useDebounce from "./hooks/useDebounce";

function App() {
  const [coins, setCoins] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  
  // Debounce search term to avoid excessive filtering
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false"
        );
        setCoins(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch data. Please try again later.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();

    // Set up polling every 60 seconds to get fresh data
    const interval = setInterval(fetchCoins, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setSearch(e.target.value);
  };

  // Filter coins based on search term
  const filteredCoins = coins.filter((coin) =>
    coin.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className={`app ${theme}`}>
      <div className="app-container">
        <Header />
        <div className="coin-search">
          <h1 className="coin-text">Search a cryptocurrency</h1>
          <div className="search-input-container">
            <input
              className="coin-input"
              type="text"
              onChange={handleChange}
              placeholder="Search by name or symbol"
              aria-label="Search for a cryptocurrency"
              value={search}
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
        </div>
        
        {loading ? (
          <div className="loader-container" role="alert" aria-busy="true">
            <div className="loader"></div>
            <p>Loading cryptocurrency data...</p>
            <div className="skeleton-container">
              {[...Array(5)].map((_, index) => (
                <CoinSkeleton key={index} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="error-message" role="alert">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : (
          <>
            <div className="coin-container" role="region" aria-label="Cryptocurrency list">
              <div className="coin-header">
                <div className="coin-row header">
                  <div className="coin">
                    <p>Cryptocurrency</p>
                  </div>
                  <div className="coin-data">
                    <p className="coin-price">Price</p>
                    <p className="coin-volume">Volume</p>
                    <p className="coin-percent">24h Change</p>
                    <p className="coin-marketcap">Market Cap</p>
                  </div>
                </div>
              </div>
              
              {filteredCoins.length > 0 ? (
                filteredCoins.map((coin) => {
                  return (
                    <Coin
                      key={coin.id}
                      id={coin.id}
                      name={coin.name}
                      price={coin.current_price}
                      symbol={coin.symbol}
                      marketcap={coin.market_cap}
                      volume={coin.total_volume}
                      image={coin.image}
                      priceChange={coin.price_change_percentage_24h}
                    />
                  );
                })
              ) : (
                <div className="no-coins">
                  <p>No cryptocurrencies found matching "{debouncedSearch}"</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <footer className="footer">
        <p>Data provided by CoinGecko API</p>
        <p>&copy; {new Date().getFullYear()} Crypto Tracker</p>
      </footer>
      <ThemeToggle />
    </div>
  );
}

export default App;
