import React from "react";
import "./CoinSkeleton.css";

const CoinSkeleton = () => {
  return (
    <div className="coin-skeleton">
      <div className="coin">
        <div className="skeleton-circle"></div>
        <div className="skeleton-line name"></div>
        <div className="skeleton-line symbol"></div>
      </div>
      <div className="coin-data">
        <div className="skeleton-line price"></div>
        <div className="skeleton-line volume"></div>
        <div className="skeleton-line percent"></div>
        <div className="skeleton-line marketcap"></div>
      </div>
    </div>
  );
};

export default CoinSkeleton;
