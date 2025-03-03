import React from 'react';
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

  if (viewMode === 'list') {
    return (
      <div className="coin-list-item">
        <div className="coin-rank-list">{rank}</div>
        <div className="coin-info-list">
          <img src={image} alt={name} className="coin-image-list" />
          <div className="coin-name-container">
            <h2 className="coin-name-list">{name}</h2>
            <span className="coin-symbol-list">{symbol.toUpperCase()}</span>
          </div>
        </div>
        <div className="coin-price-list">${formattedPrice}</div>
        <div className={`coin-percent-list ${priceChangeClass}`}>
          {priceChange > 0 ? '+' : ''}{formattedPriceChange}%
        </div>
        <div className="coin-marketcap-list">${formattedMarketCap}</div>
        <div className="coin-volume-list">${formattedVolume}</div>
      </div>
    );
  }

  // Default grid view code remains unchanged
  return (
    <div className="coin-card">
      <div className="coin-card-header">
        <div className="coin-rank">#{rank}</div>
        <img src={image} alt={name} className="coin-image" />
      </div>
      <div className="coin-content">
        <h2 className="coin-name">{name}</h2>
        <p className="coin-symbol">{symbol.toUpperCase()}</p>
      </div>
      <div className="coin-data">
        <div className="coin-price-container">
          <span className="coin-price-label">Price</span>
          <span className="coin-price-value">${formattedPrice}</span>
        </div>
        <div className="coin-price-change">
          <span className="price-change-label">24h Change</span>
          <span className={`price-change-value ${priceChangeClass}`}>
            {priceChange > 0 ? '+' : ''}{formattedPriceChange}%
          </span>
        </div>
        <div className="coin-market-cap">
          <span className="market-cap-label">Market Cap</span>
          <span className="market-cap-value">${formattedMarketCap}</span>
        </div>
      </div>
    </div>
  );
};

export default Coin;
