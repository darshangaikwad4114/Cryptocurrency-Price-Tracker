import { lazy, Suspense, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import CoinLogo from '../components/ui/CoinLogo';
import ChangeBadge from '../components/ui/ChangeBadge';
import Icon from '../components/ui/Icon';
import Skeleton from '../components/ui/Skeleton';
import StatusPanel from '../components/ui/StatusPanel';
import WatchButton from '../components/market/WatchButton';
import { useCoin } from '../hooks/useMarketData';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  clamp,
  formatCompactCurrency,
  formatCompactNumber,
  formatDate,
  formatPrice,
} from '../utils/format';

const PriceChart = lazy(() => import('../components/chart/PriceChart'));

function Stat({ label, value, title }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd title={title}>{value}</dd>
    </div>
  );
}

function ChangeItem({ label, value }) {
  return (
    <div className="change-item">
      <span className="change-item__label">{label}</span>
      <ChangeBadge value={value} label={`${label} change`} size="sm" />
    </div>
  );
}

function CoinPageSkeleton() {
  return (
    <div className="page">
      <div className="coin-hero coin-hero--skeleton" aria-hidden="true">
        <Skeleton className="skeleton--avatar-lg" />
        <div className="coin-hero__skeleton-copy">
          <Skeleton className="skeleton--heading" />
          <Skeleton className="skeleton--metric" />
        </div>
      </div>
      <div className="stat-grid">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="stat" key={index}>
            <Skeleton className="skeleton--text-sm" style={{ width: '45%' }} />
            <Skeleton className="skeleton--text" style={{ width: '70%' }} />
          </div>
        ))}
      </div>
      <div className="panel">
        <Skeleton className="skeleton--chart" />
      </div>
    </div>
  );
}

export default function CoinPage() {
  const { coinId } = useParams();
  const { coin, query } = useCoin(coinId);
  const [expandedFor, setExpandedFor] = useState(null);
  const expanded = expandedFor === coinId;

  useDocumentTitle(coin ? `${coin.name} (${coin.symbol.toUpperCase()})` : 'Asset details');

  if (query.isPending) {
    return <CoinPageSkeleton />;
  }

  if (query.isError) {
    const notFound = query.error?.status === 404 || query.error?.status === 400;
    return (
      <div className="page">
        <StatusPanel
          tone={notFound ? 'warning' : 'error'}
          icon={notFound ? 'search' : 'alert'}
          title={notFound ? 'Asset not found' : 'Asset data unavailable'}
          message={
            notFound
              ? `We could not find an asset with the id “${coinId}”. It may have been removed from the market index.`
              : 'The latest data for this asset could not be loaded. Please try again.'
          }
          actions={
            <>
              <Link to="/markets" className="button button--primary">
                Back to markets
              </Link>
              {!notFound && (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => query.refetch()}
                >
                  Retry
                </button>
              )}
            </>
          }
        />
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="page">
        <StatusPanel
          tone="warning"
          icon="info"
          title="No data available"
          message="This asset does not have a market snapshot right now."
          actions={
            <Link to="/markets" className="button button--secondary">
              Back to markets
            </Link>
          }
        />
      </div>
    );
  }

  const description = coin.description ?? '';
  const descriptionLong = description.length > 640;
  const shownDescription =
    descriptionLong && !expanded ? `${description.slice(0, 640).trimEnd()}…` : description;
  const rangePercent = clamp(
    Number.isFinite(coin.high24h) &&
      Number.isFinite(coin.low24h) &&
      coin.high24h > coin.low24h &&
      Number.isFinite(coin.price)
      ? ((coin.price - coin.low24h) / (coin.high24h - coin.low24h)) * 100
      : 50,
    0,
    100,
  );

  const links = [
    coin.homepage && { href: coin.homepage, label: 'Website', icon: 'globe' },
    coin.explorer && { href: coin.explorer, label: 'Block explorer', icon: 'search' },
    ...coin.community.slice(0, 2).map((href, index) => ({
      href,
      label: index === 0 ? 'Community' : 'Chat',
      icon: 'external',
    })),
    ...coin.repos.slice(0, 1).map((href) => ({ href, label: 'Source code', icon: 'external' })),
  ].filter(Boolean);

  return (
    <div className="page page--coin">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/markets">Markets</Link>
        <Icon name="chevron-right" size={13} />
        <span aria-current="page">{coin.name}</span>
      </nav>

      <PageHeader
        eyebrow={`Rank #${coin.rank ?? '—'} · ${coin.categories[0] ?? 'Cryptocurrency'}`}
        title={
          <span className="coin-title">
            <CoinLogo src={coin.image} name={coin.name} symbol={coin.symbol} size={44} />
            {coin.name} <span className="coin-title__symbol">{coin.symbol.toUpperCase()}</span>
          </span>
        }
        description={coin.hashingAlgorithm ? `Hashing algorithm: ${coin.hashingAlgorithm}` : null}
        actions={
          <>
            <WatchButton coinId={coin.id} name={coin.name} />
            {coin.homepage && (
              <a
                href={coin.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="button button--secondary"
              >
                Official website <Icon name="external" size={14} />
              </a>
            )}
          </>
        }
      />

      <section className="coin-hero panel" aria-labelledby="coin-price-heading">
        <div className="coin-hero__price">
          <p className="eyebrow" id="coin-price-heading">
            Current price
          </p>
          <div className="coin-hero__price-row">
            <strong>{formatPrice(coin.price)}</strong>
            <ChangeBadge value={coin.change24h} label="24 hour change" />
          </div>
          <p className="coin-hero__timestamp">
            {coin.lastUpdated
              ? `Market data updated ${formatDate(coin.lastUpdated)}`
              : 'Live market data'}
          </p>
        </div>

        <div className="coin-hero__range">
          <div className="range-labels">
            <span>24h low {formatPrice(coin.low24h)}</span>
            <span>24h high {formatPrice(coin.high24h)}</span>
          </div>
          <div
            className="range-bar"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(rangePercent)}
            aria-label="Current price position within the 24 hour range"
          >
            <span style={{ left: `${rangePercent}%` }} />
          </div>
        </div>

        <div className="coin-hero__changes">
          <ChangeItem label="1h" value={coin.change1h} />
          <ChangeItem label="24h" value={coin.change24h} />
          <ChangeItem label="7d" value={coin.change7d} />
          <ChangeItem label="30d" value={coin.change30d} />
          <ChangeItem label="1y" value={coin.change1y} />
        </div>
      </section>

      <Suspense
        fallback={
          <div className="panel" aria-label="Loading price chart">
            <Skeleton className="skeleton--chart" />
          </div>
        }
      >
        <PriceChart coinId={coin.id} coinName={coin.name} />
      </Suspense>

      <section className="panel" aria-labelledby="coin-stats-heading">
        <div className="panel__header">
          <div>
            <h2 id="coin-stats-heading">Market statistics</h2>
            <p>Valuation and supply information reported by CoinGecko.</p>
          </div>
        </div>
        <dl className="stat-grid">
          <Stat label="Market cap" value={formatCompactCurrency(coin.marketCap)} />
          <Stat
            label="Fully diluted valuation"
            value={formatCompactCurrency(coin.fullyDilutedValuation)}
          />
          <Stat label="24h volume" value={formatCompactCurrency(coin.volume24h)} />
          <Stat
            label="Circulating supply"
            value={`${formatCompactNumber(coin.circulatingSupply)} ${coin.symbol.toUpperCase()}`}
          />
          <Stat
            label="Total supply"
            value={`${formatCompactNumber(coin.totalSupply)} ${coin.symbol.toUpperCase()}`}
          />
          <Stat
            label="Max supply"
            value={
              coin.maxSupply
                ? `${formatCompactNumber(coin.maxSupply)} ${coin.symbol.toUpperCase()}`
                : 'Uncapped'
            }
          />
          <Stat
            label="All-time high"
            value={formatPrice(coin.ath)}
            title={coin.athDate ? formatDate(coin.athDate) : undefined}
          />
          <Stat
            label="All-time low"
            value={formatPrice(coin.atl)}
            title={coin.atlDate ? formatDate(coin.atlDate) : undefined}
          />
        </dl>
      </section>

      <div className="coin-detail-grid">
        <section className="panel" aria-labelledby="about-coin-heading">
          <div className="panel__header">
            <div>
              <h2 id="about-coin-heading">About {coin.name}</h2>
              <p>Project background from the CoinGecko description.</p>
            </div>
          </div>
          {description ? (
            <>
              <p className="coin-description">{shownDescription}</p>
              {descriptionLong && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setExpandedFor(expanded ? null : coinId)}
                  aria-expanded={expanded}
                >
                  {expanded ? 'Show less' : 'Read more'}
                  <Icon name={expanded ? 'arrow-up' : 'chevron-down'} size={14} />
                </button>
              )}
            </>
          ) : (
            <p className="panel__note">No description is available for this asset.</p>
          )}

          {coin.categories.length > 0 && (
            <div className="tag-list" aria-label="Categories">
              {coin.categories.map((category) => (
                <span className="tag" key={category}>
                  {category}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="coin-links-heading">
          <div className="panel__header">
            <div>
              <h2 id="coin-links-heading">Resources</h2>
              <p>Official project links, verified as HTTPS before display.</p>
            </div>
          </div>
          {coin.genesisDate && (
            <p className="resource-meta">
              <Icon name="clock" size={14} /> Launched {formatDate(coin.genesisDate)}
            </p>
          )}
          <ul className="resource-list">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  <Icon name={link.icon} size={15} />
                  {link.label}
                  <Icon name="external" size={12} className="resource-list__external" />
                </a>
              </li>
            ))}
          </ul>
          {links.length === 0 && <p className="panel__note">No external links are available.</p>}
          <p className="panel__source">
            Always verify project links independently. A listing here is not an endorsement.
          </p>
        </section>
      </div>
    </div>
  );
}
