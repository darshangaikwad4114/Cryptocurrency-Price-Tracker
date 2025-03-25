const CoinSkeleton = () => {
  return (
    <div className="coin-skeleton">
      <div className="skeleton-basic-info">
        <div className="skeleton-rank"></div>
        <div className="skeleton-image"></div>
        <div className="skeleton-name-container">
          <div className="skeleton-name"></div>
          <div className="skeleton-symbol"></div>
        </div>
        <div className="skeleton-price-container">
          <div className="skeleton-price"></div>
          <div className="skeleton-percent"></div>
        </div>
      </div>
    </div>
  );
};

export default CoinSkeleton;
