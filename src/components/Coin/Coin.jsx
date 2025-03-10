import React, { memo } from 'react';
import PropTypes from 'prop-types';
import './Coin.css';

const Coin = ({ 
  id, 
  name, 
  image, 
  symbol, 
  price, 
  volume, 
  priceChange, 
  marketCap,
  rank,
  viewMode = 'grid' 
}) => {
  const priceChangeClass = priceChange < 0 ? 'negative' : 'positive';
  const formattedMarketCap = marketCap?.toLocaleString() || 'N/A';
  const formattedPrice = price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A';
  const formattedVolume = volume?.toLocaleString() || 'N/A';
  const formattedPriceChange = priceChange?.toFixed(2) || 'N/A';
  
  // Convert market cap to readable format (B for billions, M for millions)
  const readableMarketCap = marketCap >= 1e9 
    ? `$${(marketCap / 1e9).toFixed(2)}B` 
    : marketCap >= 1e6 
      ? `$${(marketCap / 1e6).toFixed(2)}M` 
      : `$${marketCap}`;
      
  // Convert volume to readable format
  const readableVolume = volume >= 1e9 
    ? `$${(volume / 1e9).toFixed(2)}B` 
    : volume >= 1e6 
      ? `$${(volume / 1e6).toFixed(2)}M` 
      : `$${volume}`;

  if (viewMode === 'list') {
    return (
      <div 
        className="coin-list-item" 
        role="row"
        tabIndex={0}
        aria-label={`${name} at $${formattedPrice}, ${priceChange > 0 ? 'up' : 'down'} ${Math.abs(priceChange)}% in 24 hours`}
      >
        <div className="coin-rank-list" aria-label={`Rank ${rank}`}>{rank}</div>
        <div className="coin-info-list">
          <img src={image} alt={`${name} logo`} className="coin-image-list" loading="lazy" />
          <div className="coin-name-container">
            <h2 className="coin-name-list">{name}</h2>
            <span className="coin-symbol-list">{symbol.toUpperCase()}</span>
          </div>
        </div>
        <div className="coin-price-list" aria-label={`Price: $${formattedPrice}`}>${formattedPrice}</div>
        <div 
          className={`coin-percent-list ${priceChangeClass}`}
          aria-label={`${priceChange > 0 ? 'Increased' : 'Decreased'} by ${Math.abs(formattedPriceChange)}% in 24 hours`}
        >
          {priceChange > 0 ? '+' : ''}{formattedPriceChange}%
        </div>
        <div className="coin-marketcap-list" aria-label={`Market Cap: ${readableMarketCap}`}>{readableMarketCap}</div>
        <div className="coin-volume-list" aria-label={`24h Volume: ${readableVolume}`}>{readableVolume}</div>
      </div>
    );
  }

  // Grid view with enhanced accessibility
  return (
    <div 
      className="coin-card"
      tabIndex={0}
      aria-label={`${name} cryptocurrency card`}
    >
      <div className="coin-card-header">
        <div className="coin-rank" aria-label={`Rank ${rank}`}>#{rank}</div>
        <img src={image} alt={`${name} logo`} className="coin-image" loading="lazy" />
      </div>
      <div className="coin-content">
        <h2 className="coin-name">{name}</h2>
        <p className="coin-symbol">{symbol.toUpperCase()}</p>
      </div>
      <div className="coin-data">
        <div className="coin-price-container">
          <span className="coin-price-label">Price</span>
          <span className="coin-price-value" aria-label={`Price: $${formattedPrice}`}>${formattedPrice}</span>
        </div>
        <div className="coin-price-change">
          <span className="price-change-label">24h Change</span>
          <span 
            className={`price-change-value ${priceChangeClass}`}
            aria-label={`${priceChange > 0 ? 'Increased' : 'Decreased'} by ${Math.abs(formattedPriceChange)}% in 24 hours`}
          >
            {priceChange > 0 ? '+' : ''}{formattedPriceChange}%
          </span>
        </div>
        <div className="coin-market-cap">
          <span className="market-cap-label">Market Cap</span>
          <span className="market-cap-value" aria-label={`Market Cap: ${readableMarketCap}`}>{readableMarketCap}</span>
        </div>
      </div>
    </div>
  );
};

Coin.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  symbol: PropTypes.string.isRequired,
  price: PropTypes.number,
  volume: PropTypes.number,
  priceChange: PropTypes.number,
  marketCap: PropTypes.number,
  rank: PropTypes.number,
  viewMode: PropTypes.oneOf(['grid', 'list'])
};

// Memoize the component to prevent unnecessary re-renders
export default memo(Coin);
