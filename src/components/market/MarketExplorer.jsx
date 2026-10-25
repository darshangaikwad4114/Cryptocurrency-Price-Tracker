import { useState } from 'react';
import Icon from '../ui/Icon';
import Skeleton from '../ui/Skeleton';
import StatusPanel from '../ui/StatusPanel';
import ChangeBadge from '../ui/ChangeBadge';
import CoinLogo from '../ui/CoinLogo';
import { useCategories, useExchanges } from '../../api/hooks';
import { clamp, formatCompactCurrency, formatCompactNumber } from '../../lib/format';

function CategoriesPanel() {
  const { categories, query } = useCategories();

  if (query.isPending) {
    return (
      <div className="explorer-skeleton" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index}>
            <Skeleton className="skeleton--text" style={{ width: '35%' }} />
            <Skeleton className="skeleton--text" style={{ width: '20%' }} />
            <Skeleton className="skeleton--text" style={{ width: '18%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <StatusPanel
        tone="error"
        icon="alert"
        title="Categories unavailable"
        message="Sector-level market data could not be loaded."
        actions={
          <button type="button" className="button button--secondary" onClick={() => query.refetch()}>
            Retry
          </button>
        }
      />
    );
  }

  if (!categories.length) {
    return <p className="panel__note">No category data available right now.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Top assets</th>
            <th scope="col" className="align-right">
              24h
            </th>
            <th scope="col" className="align-right">
              Market cap
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td className="data-table__name">{category.name}</td>
              <td>
                <div className="mini-assets">
                  {category.topCoinImages.map((image, index) => (
                    <img
                      key={image}
                      src={image}
                      alt=""
                      width="22"
                      height="22"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        event.currentTarget.style.visibility = 'hidden';
                      }}
                      style={{ zIndex: 3 - index }}
                    />
                  ))}
                </div>
              </td>
              <td className="align-right">
                <ChangeBadge value={category.marketCapChange24h} size="sm" />
              </td>
              <td className="align-right mono">{formatCompactCurrency(category.marketCap)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExchangesPanel() {
  const { exchanges, query } = useExchanges();

  if (query.isPending) {
    return (
      <div className="explorer-skeleton" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index}>
            <Skeleton className="skeleton--avatar-sm" />
            <Skeleton className="skeleton--text" style={{ width: '30%' }} />
            <Skeleton className="skeleton--text" style={{ width: '20%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <StatusPanel
        tone="error"
        icon="alert"
        title="Exchanges unavailable"
        message="Spot exchange data could not be loaded."
        actions={
          <button type="button" className="button button--secondary" onClick={() => query.refetch()}>
            Retry
          </button>
        }
      />
    );
  }

  if (!exchanges.length) {
    return <p className="panel__note">No exchange data available right now.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="data-table exchange-table">
        <thead>
          <tr>
            <th scope="col">Exchange</th>
            <th scope="col" className="align-right">
              24h volume
            </th>
            <th scope="col">Trust score</th>
          </tr>
        </thead>
        <tbody>
          {exchanges.map((exchange) => (
            <tr key={exchange.id}>
              <td>
                <div className="asset-cell">
                  <CoinLogo
                    src={exchange.image}
                    name={exchange.name}
                    symbol={exchange.name}
                    size={28}
                  />
                  <div className="asset-cell__text">
                    {exchange.url ? (
                      <a
                        href={exchange.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="asset-link"
                      >
                        {exchange.name} <Icon name="external" size={11} />
                      </a>
                    ) : (
                      <span className="asset-link asset-link--plain">{exchange.name}</span>
                    )}
                    <span className="coin-symbol">{exchange.country ?? 'Global'}</span>
                  </div>
                </div>
              </td>
              <td className="align-right mono">
                {formatCompactNumber(exchange.volume24hBtc)} BTC
              </td>
              <td>
                {Number.isFinite(exchange.trustScore) ? (
                  <div className="trust-cell">
                    <div className="trust-bar" aria-hidden="true">
                      <span style={{ width: `${clamp(exchange.trustScore * 10, 0, 100)}%` }} />
                    </div>
                    <span>{exchange.trustScore.toFixed(0)}/10</span>
                  </div>
                ) : (
                  <span className="muted">Not rated</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MarketExplorer() {
  const [tab, setTab] = useState('categories');

  return (
    <section className="panel market-explorer" aria-labelledby="explorer-heading">
      <div className="panel__header panel__header--wrap">
        <div>
          <h2 id="explorer-heading">Market explorer</h2>
          <p>Sector performance and spot exchange activity.</p>
        </div>
        <div className="tabs" role="tablist" aria-label="Market explorer views">
          <button
            type="button"
            role="tab"
            id="categories-tab"
            aria-selected={tab === 'categories'}
            aria-controls="categories-panel"
            className={tab === 'categories' ? 'is-active' : ''}
            onClick={() => setTab('categories')}
          >
            Categories
          </button>
          <button
            type="button"
            role="tab"
            id="exchanges-tab"
            aria-selected={tab === 'exchanges'}
            aria-controls="exchanges-panel"
            className={tab === 'exchanges' ? 'is-active' : ''}
            onClick={() => setTab('exchanges')}
          >
            Exchanges
          </button>
        </div>
      </div>

      <div
        role="tabpanel"
        id="categories-panel"
        aria-labelledby="categories-tab"
        hidden={tab !== 'categories'}
      >
        <CategoriesPanel />
      </div>
      <div
        role="tabpanel"
        id="exchanges-panel"
        aria-labelledby="exchanges-tab"
        hidden={tab !== 'exchanges'}
      >
        <ExchangesPanel />
      </div>

      <p className="panel__source">
        Category data by CoinGecko. Exchange volume is reported in BTC by upstream and trust scores
        are CoinGecko estimates, not endorsements.
      </p>
    </section>
  );
}
