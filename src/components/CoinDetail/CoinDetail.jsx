import { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import HistoricalChart from '../HistoricalChart/HistoricalChart';
import './CoinDetail.css';

const CoinDetail = ({ coinId, onClose }) => {
  const [coinData, setCoinData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCoinData = async () => {
      if (!coinId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${coinId}`,
          {
            params: {
              localization: false,
              tickers: false,
              market_data: true,
              community_data: true,
              developer_data: false,
              sparkline: false
            },
            timeout: 10000
          }
        );
        
        setCoinData(response.data);
      } catch (err) {
        console.error('Error fetching coin data:', err);
        setError(`Failed to fetch coin data: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCoinData();
  }, [coinId]);

  // Format market cap, etc. with appropriate suffix (B, M)
  const formatValue = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };
  
  // Format percentage changes
  const formatPercentChange = (percent) => {
    if (percent === null || percent === undefined) return 'N/A';
    return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };
  
  const renderChangeLabel = (change) => {
    if (change === null || change === undefined) return 'neutral';
    return change > 0 ? 'positive' : 'negative';
  };

  return (
    <div className="coin-detail-overlay">
      <div className="coin-detail-container">
        <div className="coin-detail-header">
          <div className="coin-detail-title">
            {loading ? (
              <div className="coin-detail-loading-title">
                <div className="skeleton-circle"></div>
                <div className="skeleton-line"></div>
              </div>
            ) : error ? (
              <h2>Error Loading Coin</h2>
            ) : coinData && (
              <>
                <img src={coinData.image.large} alt={coinData.name} />
                <div>
                  <h2>{coinData.name} <span className="coin-symbol">({coinData.symbol.toUpperCase()})</span></h2>
                  <div className="coin-rank">Rank #{coinData.market_cap_rank}</div>
                </div>
              </>
            )}
          </div>
          <button className="coin-detail-close" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {loading ? (
          <div className="coin-detail-loading">
            <div className="coin-detail-loading-animation"></div>
            <p>Loading coin data...</p>
          </div>
        ) : error ? (
          <div className="coin-detail-error">
            <p>{error}</p>
            <button onClick={() => setLoading(true)}>Retry</button>
          </div>
        ) : coinData && (
          <>
            <div className="coin-price-section">
              <div className="current-price">
                <h3>${coinData.market_data.current_price.usd.toLocaleString()}</h3>
                <span className={`price-change ${renderChangeLabel(coinData.market_data.price_change_percentage_24h)}`}>
                  {formatPercentChange(coinData.market_data.price_change_percentage_24h)} (24h)
                </span>
              </div>
              
              <div className="price-changes">
                <div className="change-item">
                  <span className="change-label">1h</span>
                  <span className={`change-value ${renderChangeLabel(coinData.market_data.price_change_percentage_1h_in_currency?.usd)}`}>
                    {formatPercentChange(coinData.market_data.price_change_percentage_1h_in_currency?.usd)}
                  </span>
                </div>
                <div className="change-item">
                  <span className="change-label">24h</span>
                  <span className={`change-value ${renderChangeLabel(coinData.market_data.price_change_percentage_24h)}`}>
                    {formatPercentChange(coinData.market_data.price_change_percentage_24h)}
                  </span>
                </div>
                <div className="change-item">
                  <span className="change-label">7d</span>
                  <span className={`change-value ${renderChangeLabel(coinData.market_data.price_change_percentage_7d)}`}>
                    {formatPercentChange(coinData.market_data.price_change_percentage_7d)}
                  </span>
                </div>
                <div className="change-item">
                  <span className="change-label">30d</span>
                  <span className={`change-value ${renderChangeLabel(coinData.market_data.price_change_percentage_30d)}`}>
                    {formatPercentChange(coinData.market_data.price_change_percentage_30d)}
                  </span>
                </div>
                <div className="change-item">
                  <span className="change-label">1y</span>
                  <span className={`change-value ${renderChangeLabel(coinData.market_data.price_change_percentage_1y)}`}>
                    {formatPercentChange(coinData.market_data.price_change_percentage_1y)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="price-chart-section">
              <HistoricalChart coinId={coinId} coinName={coinData?.name} />
            </div>
            
            <div className="market-stats-section">
              <h3 className="section-title">Market Stats</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Market Cap</span>
                  <span className="stat-value">{formatValue(coinData.market_data.market_cap.usd)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">24h Trading Vol</span>
                  <span className="stat-value">{formatValue(coinData.market_data.total_volume.usd)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Fully Diluted Val</span>
                  <span className="stat-value">{coinData.market_data.fully_diluted_valuation?.usd ? 
                    formatValue(coinData.market_data.fully_diluted_valuation.usd) : 'N/A'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Circulating Supply</span>
                  <span className="stat-value">{coinData.market_data.circulating_supply ? 
                    `${coinData.market_data.circulating_supply.toLocaleString()} ${coinData.symbol.toUpperCase()}` : 'N/A'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Max Supply</span>
                  <span className="stat-value">{coinData.market_data.max_supply ? 
                    `${coinData.market_data.max_supply.toLocaleString()} ${coinData.symbol.toUpperCase()}` : 'Unlimited'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Supply</span>
                  <span className="stat-value">{coinData.market_data.total_supply ? 
                    `${coinData.market_data.total_supply.toLocaleString()} ${coinData.symbol.toUpperCase()}` : 'N/A'}</span>
                </div>
              </div>
            </div>
            
            {coinData.description?.en && (
              <div className="about-section">
                <h3 className="section-title">About {coinData.name}</h3>
                <div 
                  className="coin-description" 
                  dangerouslySetInnerHTML={{ 
                    __html: coinData.description.en
                      .split(' ')
                      .slice(0, 100)
                      .join(' ') + '...' 
                  }}
                ></div>
                <a 
                  href={coinData.links.homepage[0]} 
                  className="coin-website-link" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Visit Official Website
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

CoinDetail.propTypes = {
  coinId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

export default CoinDetail;
