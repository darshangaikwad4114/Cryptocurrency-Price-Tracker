import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import Icon from '../components/ui/Icon';
import StatusPanel from '../components/ui/StatusPanel';
import CoinTable from '../components/market/CoinTable';
import CoinListSkeleton from '../components/market/CoinListSkeleton';
import { useCoins } from '../hooks/useMarketData';
import { useWatchlist } from '../features/watchlist/watchlistContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { SORT_OPTIONS, sortCoins } from '../utils/market';
import { formatInteger, formatPercent, toneFor } from '../utils/format';

export default function WatchlistPage() {
  useDocumentTitle('Watchlist');
  const { ids, count, remove } = useWatchlist();
  const { coins, query } = useCoins();
  const [sort, setSort] = useState('market_cap_desc');

  const byId = useMemo(() => new Map(coins.map((coin) => [coin.id, coin])), [coins]);
  const saved = useMemo(() => ids.map((id) => byId.get(id)).filter(Boolean), [ids, byId]);
  const sorted = useMemo(() => sortCoins(saved, sort), [saved, sort]);
  const missing = query.isSuccess ? ids.filter((id) => !byId.has(id)) : [];
  const averageChange = saved.length
    ? saved.reduce((total, coin) => total + (coin.change24h ?? 0), 0) / saved.length
    : null;

  return (
    <div className="page page--watchlist">
      <PageHeader
        eyebrow="Watchlist"
        title="Your saved assets"
        description="A private shortlist stored in this browser. Star any asset from the market pages to add it here."
        actions={
          <Link to="/markets" className="button button--secondary">
            <Icon name="plus" size={15} /> Add assets
          </Link>
        }
      />

      {count > 0 && (
        <div className="summary-pills" aria-label="Watchlist summary">
          <span className="pill">
            <Icon name="star-filled" size={12} /> {formatInteger(count)} saved
          </span>
          {saved.length > 0 && (
            <span className={`pill tone-${toneFor(averageChange)}`}>
              Average 24h {formatPercent(averageChange)}
            </span>
          )}
          <span className="pill pill--muted">Stored locally</span>
        </div>
      )}

      {count === 0 ? (
        <StatusPanel
          tone="info"
          icon="star"
          title="Your watchlist is empty"
          message="Save assets from Markets or any coin page to build a focused shortlist. Nothing is uploaded to a server."
          actions={
            <Link to="/markets" className="button button--primary">
              Browse markets <Icon name="arrow-right" size={15} />
            </Link>
          }
        />
      ) : query.isPending ? (
        <CoinListSkeleton view="table" count={Math.min(ids.length, 8)} />
      ) : query.isError && coins.length === 0 ? (
        <StatusPanel
          tone="error"
          icon="alert"
          title="Market data unavailable"
          message="Your watchlist is intact, but prices could not be loaded right now."
          actions={
            <button
              type="button"
              className="button button--secondary"
              onClick={() => query.refetch()}
            >
              Retry
            </button>
          }
        />
      ) : (
        <>
          {sorted.length > 0 && (
            <div className="list-toolbar">
              <p>
                Showing <strong>{sorted.length}</strong> saved{' '}
                {sorted.length === 1 ? 'asset' : 'assets'}
              </p>
              <div className="select-field">
                <label htmlFor="watchlist-sort" className="visually-hidden">
                  Sort watchlist
                </label>
                <select
                  id="watchlist-sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Icon name="chevron-down" size={14} className="select-field__icon" />
              </div>
            </div>
          )}

          {sorted.length > 0 ? (
            <div className="panel panel--flush">
              <CoinTable
                coins={sorted}
                sort={sort}
                onSortChange={setSort}
                caption="Saved cryptocurrencies"
              />
            </div>
          ) : (
            <StatusPanel
              tone="info"
              icon="search"
              title="No saved assets are in the top 100"
              message="The assets you saved are not in the current top 100 market snapshot, so live prices are unavailable."
            />
          )}

          {missing.length > 0 && (
            <section className="panel" aria-labelledby="missing-assets-heading">
              <div className="panel__header">
                <div>
                  <h2 id="missing-assets-heading">Outside the top 100</h2>
                  <p>
                    {missing.length === 1
                      ? 'One saved asset is'
                      : `${missing.length} saved assets are`}{' '}
                    not in the current market snapshot. You can remove them safely.
                  </p>
                </div>
              </div>
              <ul className="chip-list">
                {missing.map((id) => (
                  <li key={id}>
                    <span className="tag">{id}</span>
                    <button
                      type="button"
                      className="icon-button icon-button--danger"
                      onClick={() => remove(id)}
                      aria-label={`Remove ${id} from watchlist`}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
