import React, { useState } from "react";
import "./Coin.css";
import { formatCurrency, formatCompactNumber } from "../../utils/formatters";

const Coin = ({
  id,
  name,
  image,
  symbol,
  price,
  volume,
  priceChange,
  marketCap,
  rank
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={`coin-card ${expanded ? 'expanded' : ''}`} onClick={toggleExpanded}>
      <div className="coin-basic-info">
        <div className="coin-rank">#{rank}</div>
        <img src={image} alt={name} className="coin-image" />
        <div className="coin-name-container">
          <h3 className="coin-name">{name}</h3>
          <span className="coin-symbol">{symbol.toUpperCase()}</span>
        </div>
        <div className="coin-price-container">
          <p className="coin-price">${price.toLocaleString()}</p>
          <p className={`coin-percent ${priceChange < 0 ? 'red' : 'green'}`}>
            {priceChange < 0 ? (
              <span className="arrow down">&#9660;</span>
            ) : (
              <span className="arrow up">&#9650;</span>
            )}
            {Math.abs(priceChange).toFixed(2)}%
          </p>
        </div>
      </div>
      
      <div className="coin-details">
        <div className="coin-detail-item">
          <span className="detail-label">Market Cap</span>
          <span className="detail-value">${marketCap.toLocaleString()}</span>
        </div>
        <div className="coin-detail-item">
          <span className="detail-label">24h Volume</span>
          <span className="detail-value">${volume.toLocaleString()}</span>
        </div>
        <div className="coin-detail-item">
          <span className="detail-label">Price Change (24h)</span>
          <span className={`detail-value ${priceChange < 0 ? 'red' : 'green'}`}>
            {priceChange.toFixed(2)}%
          </span>
        </div>
      </div>
      
      <div className="coin-expand-hint">
        {expanded ? 'Click to collapse' : 'Click for more details'}
      </div>
    </div>
  );
};

export default React.memo(Coin);
