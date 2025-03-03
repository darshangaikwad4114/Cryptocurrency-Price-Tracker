import React from 'react';
import './ListHeader.css';

const ListHeader = ({ onSort, sortBy }) => {
  // Determine sorting direction indicators
  const getSortIndicator = (field) => {
    if (sortBy === field + '_asc') return '↑';
    if (sortBy === field + '_desc') return '↓';
    return '⇅';
  };
  
  // Handle column header click to sort
  const handleSort = (field) => {
    // Toggle between ascending and descending or set initial sort
    const newDirection = 
      sortBy === field + '_asc' ? 'desc' : 
      sortBy === field + '_desc' ? 'asc' : 'desc';
    
    onSort(`${field}_${newDirection}`);
  };

  return (
    <div className="list-header">
      <div 
        className="list-header-rank"
        onClick={() => handleSort('market_cap_rank')}
        title="Sort by Rank"
      >
        #
      </div>
      <div 
        className="list-header-name"
        onClick={() => handleSort('id')}
        title="Sort by Name"
      >
        Name
      </div>
      <div 
        className="list-header-price"
        onClick={() => handleSort('price')}
        title="Sort by Price"
      >
        Price
      </div>
      <div 
        className="list-header-change"
        onClick={() => handleSort('price_change_percentage_24h')}
        title="Sort by 24h Change"
      >
        24h Change
      </div>
      <div 
        className="list-header-marketcap"
        onClick={() => handleSort('market_cap')}
        title="Sort by Market Cap"
      >
        Market Cap
      </div>
      <div 
        className="list-header-volume"
        onClick={() => handleSort('volume')}
        title="Sort by Volume"
      >
        Volume (24h)
      </div>
    </div>
  );
};

export default ListHeader;
