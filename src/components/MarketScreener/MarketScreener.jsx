import { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import './MarketScreener.css';

const MarketScreener = ({ coins, loading }) => {
  const [selectedScreener, setSelectedScreener] = useState('exchanges');
  const [sectorPerformance, setSectorPerformance] = useState([]);
  const [topMovers, setTopMovers] = useState({ gainers: [], losers: [] });
  const [exchanges, setExchanges] = useState([]);
  const [nftCollections, setNftCollections] = useState([]);
  const [exchangesLoading, setExchangesLoading] = useState(false);
  const [nftLoading, setNftLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // Calculate sector performance based on coin data
  useEffect(() => {
    if (loading || !coins.length) return;
    
    // Mock sector data (in a real app, this would come from an API)
    const sectors = [
      { name: 'DeFi', change: 3.2, value: '64.8B', coins: ['uniswap', 'aave', 'compound'] },
      { name: 'NFT', change: -2.7, value: '23.1B', coins: ['flow', 'enjincoin', 'theta-token'] },
      { name: 'Smart Contract', change: 1.5, value: '624.3B', coins: ['ethereum', 'cardano', 'solana'] },
      { name: 'Privacy', change: -0.8, value: '12.5B', coins: ['monero', 'zcash', 'dash'] },
      { name: 'Storage', change: 5.4, value: '8.2B', coins: ['filecoin', 'storj', 'siacoin'] },
      { name: 'L1 Blockchain', change: 2.3, value: '815.7B', coins: ['bitcoin', 'ethereum', 'solana'] },
      { name: 'Meme Coins', change: 7.8, value: '43.2B', coins: ['dogecoin', 'shiba-inu'] },
      { name: 'Gaming', change: -1.2, value: '18.9B', coins: ['the-sandbox', 'axie-infinity', 'enjincoin'] }
    ];
    
    setSectorPerformance(sectors);
    
    // Calculate top gainers and losers
    const sortedCoins = [...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    setTopMovers({
      gainers: sortedCoins.slice(0, 5),
      losers: sortedCoins.slice(-5).reverse()
    });
  }, [coins, loading]);

  // Fetch exchanges data from CoinGecko API
  useEffect(() => {
    const fetchExchanges = async () => {
      if (selectedScreener !== 'exchanges') return;
      
      setExchangesLoading(true);
      setApiError(null);
      
      try {
        // Check if we've exceeded rate limits recently
        const lastExchangeCall = localStorage.getItem('lastExchangeCall');
        if (lastExchangeCall && Date.now() - parseInt(lastExchangeCall) < 60000) { // 1 minute cooldown
          const cachedExchanges = localStorage.getItem('exchangeData');
          if (cachedExchanges) {
            setExchanges(JSON.parse(cachedExchanges));
            setExchangesLoading(false);
            return;
          }
        }
        
        const response = await axios.get(
          'https://api.coingecko.com/api/v3/exchanges',
          {
            params: {
              per_page: 10,
              page: 1
            },
            timeout: 10000,
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        if (response.data && Array.isArray(response.data)) {
          // Format exchange data
          const formattedExchanges = response.data.map(exchange => ({
            id: exchange.id,
            name: exchange.name,
            logo: exchange.image,
            volume: `${(exchange.trade_volume_24h_btc / 1000).toFixed(1)}K BTC`,
            markets: exchange.markets || 'N/A',
            trustScore: exchange.trust_score || 0,
            year: exchange.year_established || 'N/A',
            country: exchange.country || 'Global'
          }));
          
          setExchanges(formattedExchanges);
          
          // Cache data for rate limit protection
          localStorage.setItem('exchangeData', JSON.stringify(formattedExchanges));
          localStorage.setItem('lastExchangeCall', Date.now().toString());
        }
      } catch (error) {
        console.error('Error fetching exchanges:', error);
        setApiError('Failed to load exchange data. Using fallback data.');
        
        // Use cached data if available
        const cachedExchanges = localStorage.getItem('exchangeData');
        if (cachedExchanges) {
          setExchanges(JSON.parse(cachedExchanges));
        } else {
          // Use fallback data
          setExchanges([
            { name: 'Binance', logo: 'https://assets.coingecko.com/markets/images/52/small/binance.jpg', volume: '12.8K BTC', markets: 1275, trustScore: 10, country: 'Global' },
            { name: 'Coinbase Exchange', logo: 'https://assets.coingecko.com/markets/images/23/small/Coinbase_Coin_Primary.png', volume: '2.7K BTC', markets: 564, trustScore: 9, country: 'USA' },
            { name: 'Kraken', logo: 'https://assets.coingecko.com/markets/images/29/small/kraken.jpg', volume: '1.1K BTC', markets: 392, trustScore: 9, country: 'USA' },
            { name: 'KuCoin', logo: 'https://assets.coingecko.com/markets/images/61/small/kucoin.png', volume: '1.7K BTC', markets: 692, trustScore: 8, country: 'Seychelles' },
            { name: 'FTX.US', logo: 'https://assets.coingecko.com/markets/images/451/small/ftx_us.jpg', volume: '0.2K BTC', markets: 142, trustScore: 8, country: 'USA' }
          ]);
        }
      } finally {
        setExchangesLoading(false);
      }
    };
    
    // Fetch NFT collections data - this would use CoinGecko's NFT endpoints in a real app
    const fetchNFTCollections = async () => {
      if (selectedScreener !== 'nfts') return;
      
      setNftLoading(true);
      setApiError(null);
      
      try {
        // For demonstration - using mock data since free tier doesn't have NFT access
        // In a real app with API key: const response = await axios.get('https://api.coingecko.com/api/v3/nfts/list')
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const mockNFTData = [
          { id: 'bored-ape-yacht-club', name: 'Bored Ape Yacht Club', symbol: 'BAYC', floor_price_eth: 30.5, market_cap_usd: 453000000, image: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?auto=format&w=1000', volume_24h_eth: 125.8, change_24h: 2.3 },
          { id: 'cryptopunks', name: 'CryptoPunks', symbol: 'PUNK', floor_price_eth: 28.9, market_cap_usd: 445000000, image: 'https://i.seadn.io/gae/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE?auto=format&w=1000', volume_24h_eth: 98.5, change_24h: -1.8 },
          { id: 'azuki', name: 'Azuki', symbol: 'AZUKI', floor_price_eth: 6.2, market_cap_usd: 62000000, image: 'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?auto=format&w=1000', volume_24h_eth: 45.2, change_24h: 5.7 },
          { id: 'doodles', name: 'Doodles', symbol: 'DOODLE', floor_price_eth: 2.79, market_cap_usd: 27900000, image: 'https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGPC_JV9f2H3K_0vQ16P77OD?auto=format&w=1000', volume_24h_eth: 18.9, change_24h: 0.5 },
          { id: 'pudgy-penguins', name: 'Pudgy Penguins', symbol: 'PUDGY', floor_price_eth: 3.85, market_cap_usd: 38500000, image: 'https://i.seadn.io/gae/yNi-XdGxsgQCPpqSio4o31ygAV6wURdIdInWRcFIl46UjUQ1eV7BEndGe8L661OoG-clRi7EgInLX4LPu9Jfw4fq0bnVYHqIDgOa?auto=format&w=1000', volume_24h_eth: 25.6, change_24h: 9.8 }
        ];
        
        setNftCollections(mockNFTData);
      } catch (error) {
        console.error('Error fetching NFT collections:', error);
        setApiError('Failed to load NFT data. Using fallback data.');
        // Provide fallback data in case of error
      } finally {
        setNftLoading(false);
      }
    };
    
    if (selectedScreener === 'exchanges') {
      fetchExchanges();
    } else if (selectedScreener === 'nfts') {
      fetchNFTCollections();
    }
  }, [selectedScreener]);

  const handleScreenerChange = (screenerType) => {
    setSelectedScreener(screenerType);
  };

  return (
    <div className="market-screener-section">
      <div className="screener-header">
        <h2>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M16.89,15.5L18.31,16.89C17.54,17.94 16.5,18.75 15.27,19.26V21.5H13.73V19.25C12.5,18.75 11.46,17.93 10.69,16.89L12.11,15.5C12.67,16.28 13.5,16.83 14.5,16.96V12.97C13.22,12.64 11.82,12.04 11.82,9.96C11.82,8.12 13.27,6.5 15,6.5C16.73,6.5 18.18,8.12 18.18,9.96C18.18,12.05 16.78,12.65 15.5,12.97V16.96C16.5,16.83 17.33,16.28 17.89,15.5M14.5,9.35L15.5,8.97C14.77,8.65 14.71,8.77 14.71,8.22C14.71,7.67 14.94,7.5 15.5,7.5C16.06,7.5 16.29,7.67 16.29,8.22C16.29,8.78 16.23,8.68 15.56,8.97L16.5,9.35C17.28,9.7 17.68,10.13 17.68,10.97C17.68,11.8 16.89,12.5 15.5,12.5C14.11,12.5 13.32,11.8 13.32,10.97C13.32,10.13 13.72,9.7 14.5,9.35M9,10H5V8H9M9,6H5V4H9M9,14H5V12H9M19,4H13V6H19M19,8H13V10H19M19,12H13V14H19V12Z" />
          </svg>
          Market Screeners
        </h2>
        <div className="screener-tabs">
          <button 
            className={selectedScreener === 'exchanges' ? 'active' : ''} 
            onClick={() => handleScreenerChange('exchanges')}
          >
            Exchanges
          </button>
          <button 
            className={selectedScreener === 'sectors' ? 'active' : ''} 
            onClick={() => handleScreenerChange('sectors')}
          >
            Sectors
          </button>
          <button 
            className={selectedScreener === 'movers' ? 'active' : ''} 
            onClick={() => handleScreenerChange('movers')}
          >
            Top Movers
          </button>
          <button 
            className={selectedScreener === 'nfts' ? 'active' : ''} 
            onClick={() => handleScreenerChange('nfts')}
          >
            NFT Collections
          </button>
        </div>
      </div>
      
      <div className="screener-content">
        {loading || exchangesLoading || nftLoading ? (
          <div className="screener-skeleton">
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
          </div>
        ) : selectedScreener === 'sectors' ? (
          <div className="sector-performance-table">
            <div className="sector-table-header">
              <div className="sector-name">Sector</div>
              <div className="sector-change">24h Change</div>
              <div className="sector-value">Market Cap</div>
            </div>
            {sectorPerformance.map(sector => (
              <div className="sector-item" key={sector.name}>
                <div className="sector-name">{sector.name}</div>
                <div className={`sector-change ${sector.change >= 0 ? 'positive' : 'negative'}`}>
                  {sector.change >= 0 ? '+' : ''}{sector.change}%
                </div>
                <div className="sector-value">${sector.value}</div>
              </div>
            ))}
          </div>
        ) : selectedScreener === 'movers' ? (
          <div className="top-movers-grid">
            <div className="movers-column">
              <h3 className="movers-title">Top Gainers</h3>
              <div className="movers-list">
                {topMovers.gainers.map(coin => (
                  <div className="mover-item" key={coin.id}>
                    <div className="mover-info">
                      <img src={coin.image} alt={coin.name} className="mover-image" />
                      <div className="mover-name">
                        <span className="name">{coin.name}</span>
                        <span className="symbol">{coin.symbol.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="mover-price">${coin.current_price.toLocaleString()}</div>
                    <div className="mover-change positive">
                      +{coin.price_change_percentage_24h.toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="movers-column">
              <h3 className="movers-title">Top Losers</h3>
              <div className="movers-list">
                {topMovers.losers.map(coin => (
                  <div className="mover-item" key={coin.id}>
                    <div className="mover-info">
                      <img src={coin.image} alt={coin.name} className="mover-image" />
                      <div className="mover-name">
                        <span className="name">{coin.name}</span>
                        <span className="symbol">{coin.symbol.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="mover-price">${coin.current_price.toLocaleString()}</div>
                    <div className="mover-change negative">
                      {coin.price_change_percentage_24h.toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : selectedScreener === 'nfts' ? (
          <div className="nft-collections-grid">
            <div className="nft-header">
              <div>Collection</div>
              <div>Floor Price</div>
              <div>Volume (24h)</div>
              <div>Change (24h)</div>
            </div>
            {nftCollections.map(nft => (
              <div className="nft-item" key={nft.id}>
                <div className="nft-name">
                  <img 
                    src={nft.image} 
                    alt={`${nft.name} logo`} 
                    className="nft-logo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCI+PC9jaXJjbGU+PC9zdmc+';
                    }}
                  />
                  <div className="nft-name-symbol">
                    <span className="name">{nft.name}</span>
                    <span className="symbol">{nft.symbol}</span>
                  </div>
                </div>
                <div className="nft-floor">{nft.floor_price_eth} ETH</div>
                <div className="nft-volume">{nft.volume_24h_eth} ETH</div>
                <div className={`nft-change ${nft.change_24h >= 0 ? 'positive' : 'negative'}`}>
                  {nft.change_24h >= 0 ? '+' : ''}{nft.change_24h}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="exchange-volume-grid">
            <div className="exchange-header">
              <div>Exchange</div>
              <div>24h Volume</div>
              <div>Markets</div>
              <div>Trust Score</div>
            </div>
            {exchanges.map(exchange => (
              <div className="exchange-item" key={exchange.name}>
                <div className="exchange-name">
                  <img 
                    src={exchange.logo} 
                    alt={`${exchange.name} logo`} 
                    className="exchange-logo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCI+PC9jaXJjbGU+PC9zdmc+';
                    }}
                  />
                  <span>{exchange.name}</span>
                </div>
                <div className="exchange-volume">{exchange.volume}</div>
                <div className="exchange-markets">{exchange.markets}</div>
                <div className="exchange-trust">
                  <div className="trust-score-bar" style={{ width: `${exchange.trustScore * 10}%` }}></div>
                  <span>{exchange.trustScore}/10</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {apiError && (
          <div className="api-error-message">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            </svg>
            <span>{apiError}</span>
          </div>
        )}
      </div>
    </div>
  );
};

MarketScreener.propTypes = {
  coins: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired
};

export default memo(MarketScreener);
