import { useState } from 'react';
import Icon from '../ui/Icon';
import { MARKET_CAP_BUCKETS, SORT_OPTIONS } from '../../lib/market';

export default function MarketToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  minPrice,
  maxPrice,
  onPriceRangeChange,
  caps,
  onToggleCap,
  view,
  onViewChange,
  onReset,
  filterCount,
  resultCount,
  totalCount,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasFilters = filterCount > 0;

  return (
    <section className="market-toolbar" aria-label="Market filters and sorting">
      <div className="market-toolbar__row">
        <div className="search-field">
          <Icon name="search" size={17} className="search-field__icon" />
          <label htmlFor="market-search" className="visually-hidden">
            Search assets
          </label>
          <input
            id="market-search"
            type="search"
            placeholder="Search by name or symbol"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            autoComplete="off"
          />
          {search && (
            <button
              type="button"
              className="search-field__clear"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              <Icon name="close" size={15} />
            </button>
          )}
        </div>

        <div className="toolbar-actions">
          <button
            type="button"
            className={`button button--secondary filter-toggle${hasFilters ? ' has-filters' : ''}`}
            aria-expanded={filtersOpen}
            aria-controls="market-filter-panel"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <Icon name="filter" size={16} />
            Filters
            {hasFilters && <span className="button__count">{filterCount}</span>}
          </button>

          <div className="select-field">
            <label htmlFor="market-sort" className="visually-hidden">
              Sort assets
            </label>
            <select
              id="market-sort"
              value={sort}
              onChange={(event) => onSortChange(event.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size={14} className="select-field__icon" />
          </div>

          <div className="view-toggle" role="group" aria-label="View mode">
            <button
              type="button"
              className={`view-toggle__button${view === 'table' ? ' is-active' : ''}`}
              aria-pressed={view === 'table'}
              aria-label="Table view"
              title="Table view"
              onClick={() => onViewChange('table')}
            >
              <Icon name="list" size={17} />
            </button>
            <button
              type="button"
              className={`view-toggle__button${view === 'grid' ? ' is-active' : ''}`}
              aria-pressed={view === 'grid'}
              aria-label="Grid view"
              title="Grid view"
              onClick={() => onViewChange('grid')}
            >
              <Icon name="grid" size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="filter-panel"
        id="market-filter-panel"
        hidden={!filtersOpen}
        aria-label="Filters"
      >
        <div className="filter-panel__grid">
          <div className="filter-group">
            <h3>Price range</h3>
            <p className="filter-group__hint">Filter by current USD price.</p>
            <div className="price-range">
              <label>
                <span className="visually-hidden">Minimum price</span>
                <span className="price-range__currency">$</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(event) => onPriceRangeChange(event.target.value, maxPrice)}
                />
              </label>
              <span aria-hidden="true">to</span>
              <label>
                <span className="visually-hidden">Maximum price</span>
                <span className="price-range__currency">$</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(event) => onPriceRangeChange(minPrice, event.target.value)}
                />
              </label>
            </div>
          </div>

          <fieldset className="filter-group">
            <legend>Market cap</legend>
            <p className="filter-group__hint">Choose one or more size categories.</p>
            <div className="cap-options">
              {MARKET_CAP_BUCKETS.map((bucket) => (
                <label key={bucket.id} className="check-option">
                  <input
                    type="checkbox"
                    checked={caps.includes(bucket.id)}
                    onChange={() => onToggleCap(bucket.id)}
                  />
                  <span>
                    <strong>{bucket.label}</strong>
                    <small>{bucket.hint}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="filter-panel__actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={onReset}
            disabled={!hasFilters}
          >
            Clear all
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={() => setFiltersOpen(false)}
          >
            Done
          </button>
        </div>
      </div>

      <div className="market-toolbar__meta">
        <p aria-live="polite">
          Showing <strong>{resultCount}</strong> of <strong>{totalCount}</strong> assets
          {hasFilters && ' matching your filters'}
        </p>
        {hasFilters && (
          <div className="active-filters" aria-label="Active filters">
            {search && (
              <button type="button" className="filter-chip" onClick={() => onSearchChange('')}>
                “{search}” <Icon name="close" size={12} />
                <span className="visually-hidden">Remove search filter</span>
              </button>
            )}
            {(minPrice !== '' || maxPrice !== '') && (
              <button
                type="button"
                className="filter-chip"
                onClick={() => onPriceRangeChange('', '')}
              >
                {minPrice === '' ? '$0' : `$${minPrice}`} – {maxPrice === '' ? 'Any' : `$${maxPrice}`}
                <Icon name="close" size={12} />
                <span className="visually-hidden">Remove price filter</span>
              </button>
            )}
            {caps.map((capId) => {
              const bucket = MARKET_CAP_BUCKETS.find((entry) => entry.id === capId);
              if (!bucket) return null;
              return (
                <button
                  key={capId}
                  type="button"
                  className="filter-chip"
                  onClick={() => onToggleCap(capId)}
                >
                  {bucket.label}
                  <Icon name="close" size={12} />
                  <span className="visually-hidden">Remove {bucket.label} filter</span>
                </button>
              );
            })}
            <button type="button" className="text-button" onClick={onReset}>
              Clear all
            </button>
          </div>
        )}
        <span className="market-toolbar__scope">Top 100 by market cap</span>
      </div>
    </section>
  );
}
