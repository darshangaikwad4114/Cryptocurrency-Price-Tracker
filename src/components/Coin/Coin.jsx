import React from "react";
import "./Coin.css";
import { formatCurrency, formatCompactNumber } from "../../utils/formatters";

const Coin = ({
  id,
  name,
  price,
  symbol,
  marketcap,
  volume,
  image,
  priceChange,
}) => {
  // Handle undefined priceChange value
  const formattedPriceChange = priceChange !== undefined && !isNaN(priceChange) 
    ? Math.abs(priceChange).toFixed(2) 
    : "N/A";
  
  // Determine price change status
  const priceChangeStatus = priceChange < 0 ? "negative" : priceChange > 0 ? "positive" : "neutral";
  
  return (
    <div className="coin-row" data-testid={`coin-row-${id}`}>
      <div className="coin">
        <img src={image} alt={`${name} logo`} loading="lazy" width="36" height="36" />
        <h2 className="coin-name">{name}</h2>
        <p className="coin-symbol">{symbol}</p>
      </div>
      <div className="coin-data">
        <p className="coin-price">{formatCurrency(price)}</p>
        <p className="coin-volume">{formatCompactNumber(volume)}</p>
        <p className={`coin-percent ${priceChangeStatus}`} aria-label={`Price change: ${priceChangeStatus}`}>
          {priceChangeStatus !== "neutral" && (
            <span className="change-icon" aria-hidden="true">
              {priceChangeStatus === "negative" ? "↓" : "↑"}
            </span>
          )}
          {formattedPriceChange === "N/A" ? formattedPriceChange : `${formattedPriceChange}%`}
        </p>
        <p className="coin-marketcap">
          {formatCompactNumber(marketcap)}
        </p>
      </div>
    </div>
  );
};

export default React.memo(Coin);
