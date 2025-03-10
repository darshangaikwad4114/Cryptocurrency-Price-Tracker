import React from 'react';
import PropTypes from 'prop-types';
import './ListHeader.css';

const ListHeader = ({ onSort, sortBy }) => {
  // Helper to determine if the column is currently sorted
  const isSortedBy = (column) => {
    return sortBy.startsWith(column);
  };
  
  // Helper to determine sort direction
  const getSortDirection = (column) => {
    if (!isSortedBy(column)) return null;
    return sortBy.endsWith('_desc') ? 'desc' : 'asc';
  };
  
  // Helper to toggle sort direction or set new sort column
  const handleSort = (column) => {
    if (isSortedBy(column)) {
      // Toggle direction if already sorting by this column
      const newDirection = sortBy.endsWith('_desc') ? 'asc' : 'desc';
      onSort(`${column}_${newDirection}`);
    } else {
      // Default to descending for new sort column
      onSort(`${column}_desc`);
    }
  };
  
  // Render sort arrow if column is sorted
  const renderSortArrow = (column) => {
    const direction = getSortDirection(column);
    if (!direction) return null;
    
    return (
      <span className={`sort-arrow ${direction}`}>
        {direction === 'desc' ? '▼' : '▲'}
      </span>
    );
  };
  
  return (
    <div className="list-header">
      <div className="header-rank">
        #
      </div>
      <div 
        className="header-name"
        onClick={() => handleSort('id')}
        role="button"
        tabIndex={0}
        aria-sort={getSortDirection('id')}
      >
        Name {renderSortArrow('id')}
      </div>
      <div 
        className="header-price"
        onClick={() => handleSort('price')}
        role="button"
        tabIndex={0}
        aria-sort={getSortDirection('price')}
      >
        Price {renderSortArrow('price')}
      </div>
      <div 
        className="header-change"
        onClick={() => handleSort('price_change_percentage_24h')}
        role="button"
        tabIndex={0}
        aria-sort={getSortDirection('price_change_percentage_24h')}
      >
        24h Change {renderSortArrow('price_change_percentage_24h')}
      </div>
      <div 
        className="header-marketcap"
        onClick={() => handleSort('market_cap')}
        role="button"
        tabIndex={0}
        aria-sort={getSortDirection('market_cap')}
      >
        Market Cap {renderSortArrow('market_cap')}
      </div>
      <div 
        className="header-volume"
        onClick={() => handleSort('volume')}
        role="button"
        tabIndex={0}
        aria-sort={getSortDirection('volume')}
      >
        Volume (24h) {renderSortArrow('volume')}
      </div>
    </div>
  );
};

ListHeader.propTypes = {
  onSort: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired
};

export default ListHeader;
