import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Icon from '../components/ui/Icon';
import DataFreshness from '../components/ui/DataFreshness';
import StatusPanel from '../components/ui/StatusPanel';
import MarketOverview from '../components/market/MarketOverview';
import MarketExplorer from '../components/market/MarketExplorer';
import MarketToolbar from '../components/market/MarketToolbar';
import CoinTable from '../components/market/CoinTable';
import CoinGrid from '../components/market/CoinGrid';
import CoinListSkeleton from '../components/market/CoinListSkeleton';
import { useCoins } from '../api/hooks';
import { useMarketFilters } from '../hooks/useMarketFilters';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { activeFilterCount, filterCoins, sortCoins } from '../lib/market';
import { readStorage, STORAGE_KEYS, writeStorage } from '../lib/storage';

export default function MarketsPage() {
  useDocumentTitle('Markets');
  const { coins, meta, query } = useCoins();
  const filters = useMarketFilters();
  const [view, setView] = useState(() => {
    const stored = readStorage(STORAGE_KEYS.viewMode, 'table');
    return stored === 'grid' ? 'grid' : 'table';
  });

  useEffect(() => {
    writeStorage(STORAGE_KEYS.viewMode, view);
  }, [view]);

  const visibleCoins = useMemo(() => {
    const filtered = filterCoins(coins, {
      search: filters.search,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      caps: filters.caps,
    });
    return sortCoins(filtered, filters.sort);
  }, [coins, filters.search, filters.minPrice, filters.maxPrice, filters.caps, filters.sort]);

  const filterCount = activeFilterCount({
    search: filters.search,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    caps: filters.caps,
  });

  const refresh = useCallback(() => query.refetch(), [query]);
  const unavailable = query.isError && coins.length === 0;

  return (
    <div className="page page--markets">
      <PageHeader
        eyebrow="Markets"
        title="Explore the top 100 assets"
        description="Search, filter, and sort live market data. Prices refresh automatically every minute."
        actions={
          <div className="page-header__meta">
            <DataFreshness
              meta={meta}
              updatedAt={query.dataUpdatedAt}
              isFetching={query.isFetching}
            />
            <button
              type="button"
              className="icon-button"
              onClick={refresh}
              aria-label="Refresh market data"
              title="Refresh market data"
              disabled={query.isFetching}
            >
              <Icon name="refresh" size={16} />
            </button>
          </div>
        }
      />

      <MarketOverview />

      <MarketToolbar
        search={filters.search}
        onSearchChange={filters.setSearch}
        sort={filters.sort}
        onSortChange={filters.setSort}
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        onPriceRangeChange={filters.setPriceRange}
        caps={filters.caps}
        onToggleCap={filters.toggleCap}
        view={view}
        onViewChange={setView}
        onReset={filters.reset}
        filterCount={filterCount}
        resultCount={visibleCoins.length}
        totalCount={coins.length}
      />

      {query.isError && coins.length > 0 && (
        <p className="inline-warning" role="status">
          <Icon name="clock" size={14} /> Live data could not be refreshed. Showing the last
          successful snapshot.
        </p>
      )}

      {query.isPending ? (
        <CoinListSkeleton view={view} count={view === 'grid' ? 8 : 10} />
      ) : unavailable ? (
        <StatusPanel
          tone="error"
          icon="alert"
          title="Market data unavailable"
          message="We could not reach the market data service. Check your connection and try again."
          actions={
            <button type="button" className="button button--secondary" onClick={refresh}>
              Retry
            </button>
          }
        />
      ) : visibleCoins.length === 0 ? (
        <StatusPanel
          tone="info"
          icon="search"
          title="No assets match these filters"
          message="Try a different search term or widen the price and market-cap filters."
          actions={
            <button type="button" className="button button--secondary" onClick={filters.reset}>
              Clear all filters
            </button>
          }
        />
      ) : view === 'grid' ? (
        <CoinGrid coins={visibleCoins} />
      ) : (
        <div className="panel panel--flush">
          <CoinTable
            coins={visibleCoins}
            sort={filters.sort}
            onSortChange={filters.setSort}
            caption="Cryptocurrency market table"
          />
        </div>
      )}

      <MarketExplorer />
    </div>
  );
}
