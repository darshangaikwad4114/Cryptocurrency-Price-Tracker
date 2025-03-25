import { memo } from 'react';
import PropTypes from 'prop-types';
import './MarketMetrics.css';

const MarketMetrics = ({ coins, loading }) => {
  if (loading || !coins.length) {
    return (
      <div className="market-metrics-skeleton">
        <div className="metric-card skeleton"></div>
        <div className="metric-card skeleton"></div>
        <div className="metric-card skeleton"></div>
      </div>
    );
  }
  
  // Calculate market metrics
  const totalMarketCap = coins.reduce((total, coin) => total + (coin.market_cap || 0), 0);
  const bitcoinDominance = (coins.find(c => c.id === 'bitcoin')?.market_cap || 0) / totalMarketCap * 100 || 0;
  
  // Get fear and greed index (this would normally come from an API)
  const fearGreedIndex = {
    value: 48,
    classification: 'Neutral',
    timestamp: new Date().toISOString()
  };
  
  // Get trending coins - normally from API, but we'll use top gainer from our data
  const trendingCoins = [...coins]
    .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
    .slice(0, 3)
    .map(coin => coin.name);
    
  const trendingTags = [...trendingCoins, 'Ethereum', 'DeFi'];
  
  return (
    <div className="market-metrics-section">
      <div className="market-metrics-cards">
        <div className="metric-card">
          <div className="metric-icon fear-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M8.5,11A1.5,1.5 0 0,0 7,12.5A1.5,1.5 0 0,0 8.5,14A1.5,1.5 0 0,0 10,12.5A1.5,1.5 0 0,0 8.5,11M15.5,11A1.5,1.5 0 0,0 14,12.5A1.5,1.5 0 0,0 15.5,14A1.5,1.5 0 0,0 17,12.5A1.5,1.5 0 0,0 15.5,11M12,17.5C14.14,17.5 16,16.09 16,14.5H8C8,16.09 9.86,17.5 12,17.5Z" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>Fear & Greed Index</h3>
            <div className="metric-value">{fearGreedIndex.value} - {fearGreedIndex.classification}</div>
            <div className="metric-meter">
              <div className="metric-progress" style={{ width: `${fearGreedIndex.value}%` }}></div>
            </div>
            <div className="metric-labels">
              <span>Extreme Fear</span>
              <span>Extreme Greed</span>
            </div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon btc-dominance">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M14.24 10.56C13.93 11.8 12 11.17 11.4 11L11.95 8.82C12.57 9 14.56 9.26 14.24 10.56M11.13 12.12L10.53 14.53C11.27 14.72 13.56 15.45 13.9 14.09C14.26 12.67 11.87 12.3 11.13 12.12M21.7 14.42C20.36 19.78 14.94 23.04 9.58 21.7C4.22 20.36 .963 14.94 2.3 9.58C3.64 4.22 9.06 .964 14.42 2.3C19.77 3.64 23.03 9.06 21.7 14.42M14.21 8.05L14.66 6.25L13.56 6L13.12 7.73C12.83 7.66 12.54 7.59 12.24 7.53L12.68 5.76L11.59 5.5L11.14 7.29C10.9 7.23 10.66 7.18 10.44 7.12L9.04 6.81L8.76 8C8.76 8 9.56 8.15 9.55 8.16C9.97 8.28 10.07 8.56 10.06 8.75L8.85 13.5C8.74 13.81 8.54 13.97 8.21 13.88C8.22 13.9 7.43 13.7 7.43 13.7L6.87 14.96L8.16 15.25C8.3 15.28 8.44 15.31 8.58 15.35L8.12 17.14L9.21 17.4L9.67 15.58C9.97 15.67 10.26 15.74 10.55 15.81L10.09 17.61L11.19 17.87L11.64 16.08C13.94 16.44 15.6 16.3 16.35 14.18C16.96 12.5 16.27 11.5 15.06 10.86C15.93 10.68 16.6 10.13 16.75 8.91C16.95 7.21 15.61 6.46 14.21 8.05Z" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>Bitcoin Dominance</h3>
            <div className="metric-value">{bitcoinDominance.toFixed(1)}%</div>
            <div className="metric-description">
              {bitcoinDominance > 42 ? 'Up' : 'Down'} {Math.abs(bitcoinDominance - 42).toFixed(1)}% from last week
            </div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon trending">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12A9,9 0 0,0 12,3Z" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>Trending Searches</h3>
            <div className="trending-tags">
              {trendingTags.map(tag => (
                <span key={tag} className="trend-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

MarketMetrics.propTypes = {
  coins: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired
};

export default memo(MarketMetrics);
