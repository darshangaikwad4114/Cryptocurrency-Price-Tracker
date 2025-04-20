import { useMemo } from 'react';
import PropTypes from 'prop-types';
import './MarketSummary.css';

const MarketSummary = ({ coins, loading }) => {
  const marketMetrics = useMemo(() => {
    if (loading || !coins.length) {
      return {
        totalMarketCap: 0,
        totalVolume: 0,
        btcDominance: 0,
        activeCoins: 0,
        market24hChange: 0,
        avgChange: 0
      };
    }

    const totalMarketCap = coins.reduce((sum, coin) => sum + (coin.market_cap || 0), 0);
    const totalVolume = coins.reduce((sum, coin) => sum + (coin.total_volume || 0), 0);
    const btcMarketCap = coins.find(coin => coin.id === 'bitcoin')?.market_cap || 0;
    const btcDominance = (btcMarketCap / totalMarketCap) * 100;
    
    // Calculate average 24h change
    const validChanges = coins.filter(coin => typeof coin.price_change_percentage_24h === 'number');
    const avgChange = validChanges.reduce((sum, coin) => sum + coin.price_change_percentage_24h, 0) / validChanges.length;
    
    // Calculate overall market change (weighted by market cap)
    const marketCapSum = validChanges.reduce((sum, coin) => sum + (coin.market_cap || 0), 0);
    const market24hChange = validChanges.reduce((sum, coin) => 
      sum + (coin.price_change_percentage_24h * (coin.market_cap || 0)), 0) / marketCapSum;
    
    return {
      totalMarketCap,
      totalVolume,
      btcDominance,
      activeCoins: coins.length,
      market24hChange,
      avgChange
    };
  }, [coins, loading]);

  // Format large numbers
  const formatValue = (value, decimals = 1) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(decimals)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(decimals)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(decimals)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(decimals)}K`;
    return `$${value.toFixed(decimals)}`;
  };

  if (loading) {
    return (
      <div className="market-summary-container skeleton">
        <div className="summary-metric skeleton"></div>
        <div className="summary-metric skeleton"></div>
        <div className="summary-metric skeleton"></div>
        <div className="summary-metric skeleton"></div>
        <div className="summary-metric skeleton"></div>
        <div className="summary-metric skeleton"></div>
      </div>
    );
  }

  return (
    <div className="market-summary-container">
      <div className="summary-metric">
        <div className="metric-icon market-cap">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M6,16.5L3,19.44V11H6M11,14.66L9.43,13.32L8,14.64V7H11M16,13L13,16V3H16M18.81,12.81L17,11H22V16L20.21,14.21L13,21.36L9.53,18.34L5.75,22H3L9.47,15.66L13,18.64" />
          </svg>
        </div>
        <div className="metric-info">
          <span className="metric-label">Market Cap</span>
          <span className="metric-value">{formatValue(marketMetrics.totalMarketCap)}</span>
        </div>
      </div>
      
      <div className="summary-metric">
        <div className="metric-icon volume">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M17,13H13V17H11V13H7V11H11V7H13V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
          </svg>
        </div>
        <div className="metric-info">
          <span className="metric-label">24h Volume</span>
          <span className="metric-value">{formatValue(marketMetrics.totalVolume)}</span>
        </div>
      </div>
      
      <div className="summary-metric">
        <div className="metric-icon dominance">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M14.24 10.56C13.93 11.8 12 11.17 11.4 11L11.95 8.82C12.57 9 14.56 9.26 14.24 10.56M11.13 12.12L10.53 14.53C11.27 14.72 13.56 15.45 13.9 14.09C14.26 12.67 11.87 12.3 11.13 12.12M21.7 14.42C20.36 19.78 14.94 23.04 9.58 21.7C4.22 20.36 .963 14.94 2.3 9.58C3.64 4.22 9.06 .964 14.42 2.3C19.77 3.64 23.03 9.06 21.7 14.42M13.33 11.5L16.7 10.67C18.1 10.23 17.05 10.89 17.05 10.89L17.83 10.26C18.3 9.84 18.65 9.5 18.5 8.86C18.25 7.76 17 7.53 16.1 7.53C15.2 7.53 14.31 7.2 14.11 6.09C13.92 5 14.03 4.37 14.03 3.38C13.08 4.2 12.1 6.71 11.91 7.28C11.91 7.28 11.3 7.38 10.5 7.38L9.61 7.35L8.88 10.38C8.88 10.38 8 10.45 7.4 10.45C6.78 10.45 6.26 10.34 5.59 9.82C5.91 11.3 6.97 12.39 8.08 13.18L7.65 15.58C7.65 15.58 7.63 15.87 8.43 15.91C9.23 15.95 12.08 15.35 12.79 17.35C13.5 19.35 13.85 20.33 14.55 20.69C13 17.89 12.53 18.08 10.8 17.96L11.13 16.08C11.13 16.08 12.02 16.25 12.94 15.95C12.94 15.95 13.88 15.75 14.21 14.55L13.33 11.5Z" />
          </svg>
        </div>
        <div className="metric-info">
          <span className="metric-label">BTC Dominance</span>
          <span className="metric-value">{marketMetrics.btcDominance.toFixed(1)}%</span>
        </div>
      </div>
      
      <div className="summary-metric">
        <div className="metric-icon coins">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7Z" />
          </svg>
        </div>
        <div className="metric-info">
          <span className="metric-label">Active Coins</span>
          <span className="metric-value">{marketMetrics.activeCoins}</span>
        </div>
      </div>
      
      <div className="summary-metric">
        <div className={`metric-icon ${marketMetrics.market24hChange >= 0 ? 'positive' : 'negative'}`}>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d={marketMetrics.market24hChange >= 0 
              ? "M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z" 
              : "M16,18L18.29,15.71L13.41,10.83L9.41,14.83L2,7.41L3.41,6L9.41,12L13.41,8L19.71,14.29L22,12V18H16Z"} 
            />
          </svg>
        </div>
        <div className="metric-info">
          <span className="metric-label">Market 24h</span>
          <span className={`metric-value ${marketMetrics.market24hChange >= 0 ? 'positive' : 'negative'}`}>
            {marketMetrics.market24hChange >= 0 ? '+' : ''}{marketMetrics.market24hChange.toFixed(2)}%
          </span>
        </div>
      </div>
      
      <div className="summary-metric">
        <div className={`metric-icon ${marketMetrics.avgChange >= 0 ? 'positive' : 'negative'}`}>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M3,14L3.5,14.07L8.07,9.5C7.89,8.85 8.06,8.11 8.59,7.59C9.37,6.8 10.63,6.8 11.41,7.59C11.94,8.11 12.11,8.85 11.93,9.5L14.5,12.07L15,12C15.18,12 15.35,12 15.5,12.07L19.07,8.5C19,8.35 19,8.18 19,8A2,2 0 0,1 21,6A2,2 0 0,1 23,8A2,2 0 0,1 21,10C20.82,10 20.65,10 20.5,9.93L16.93,13.5C17,13.65 17,13.82 17,14A2,2 0 0,1 15,16A2,2 0 0,1 13,14L13.07,13.5L10.5,10.93C10.18,11 9.82,11 9.5,10.93L4.93,15.5L5,16A2,2 0 0,1 3,18A2,2 0 0,1 1,16A2,2 0 0,1 3,14Z" />
          </svg>
        </div>
        <div className="metric-info">
          <span className="metric-label">Avg. Change</span>
          <span className={`metric-value ${marketMetrics.avgChange >= 0 ? 'positive' : 'negative'}`}>
            {marketMetrics.avgChange >= 0 ? '+' : ''}{marketMetrics.avgChange.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

MarketSummary.propTypes = {
  coins: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired
};

export default MarketSummary;
