import PropTypes from 'prop-types';
import './ListHeader.css';

const ListHeader = ({ onSort, sortBy }) => {
  const renderSortIcon = (sortKey) => {
    if (!sortBy.includes(sortKey)) return '⇅';
    return sortBy.includes('asc') ? '↑' : '↓';
  };

  const handleSort = (key) => {
    const newSortBy = sortBy.includes(key) 
      ? sortBy.includes('asc') 
        ? `${key}_desc`
        : `${key}_asc`
      : `${key}_desc`;
    
    onSort(newSortBy);
  };

  return (
    <div className="list-header">
      <div 
        className="header-rank" 
        onClick={() => handleSort('market_cap_rank')}
        role="columnheader"
        aria-sort={sortBy.includes('market_cap_rank') ? (sortBy.includes('asc') ? 'ascending' : 'descending') : 'none'}
      >
        #
        <span className="sort-icon">{renderSortIcon('market_cap_rank')}</span>
      </div>
      
      <div 
        className="header-name"
        onClick={() => handleSort('id')}
        role="columnheader"
        aria-sort={sortBy.includes('id') ? (sortBy.includes('asc') ? 'ascending' : 'descending') : 'none'}
      >
        Name
        <span className="sort-icon">{renderSortIcon('id')}</span>
      </div>
      
      <div 
        className="header-price"
        onClick={() => handleSort('price')}
        role="columnheader"
        aria-sort={sortBy.includes('price') ? (sortBy.includes('asc') ? 'ascending' : 'descending') : 'none'}
      >
        Price
        <span className="sort-icon">{renderSortIcon('price')}</span>
      </div>
      
      <div 
        className="header-change"
        onClick={() => handleSort('price_change_24h')}
        role="columnheader"
        aria-sort={sortBy.includes('price_change_24h') ? (sortBy.includes('asc') ? 'ascending' : 'descending') : 'none'}
      >
        24h Change
        <span className="sort-icon">{renderSortIcon('price_change_24h')}</span>
      </div>
      
      <div 
        className="header-marketcap"
        onClick={() => handleSort('market_cap')}
        role="columnheader"
        aria-sort={sortBy.includes('market_cap') ? (sortBy.includes('asc') ? 'ascending' : 'descending') : 'none'}
      >
        Market Cap
        <span className="sort-icon">{renderSortIcon('market_cap')}</span>
      </div>
      
      <div 
        className="header-volume"
        onClick={() => handleSort('total_volume')}
        role="columnheader"
        aria-sort={sortBy.includes('total_volume') ? (sortBy.includes('asc') ? 'ascending' : 'descending') : 'none'}
      >
        Volume (24h)
        <span className="sort-icon">{renderSortIcon('total_volume')}</span>
      </div>
    </div>
  );
};

ListHeader.propTypes = {
  onSort: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired
};

export default ListHeader;
