import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import Icon from '../components/ui/Icon';
import StatusPanel from '../components/ui/StatusPanel';
import MarketOverview from '../components/market/MarketOverview';
import MoversPanel from '../components/market/MoversPanel';
import TrendingPanel from '../components/market/TrendingPanel';
import NewsPreview from '../components/news/NewsPreview';
import CoinTable from '../components/market/CoinTable';
import CoinListSkeleton from '../components/market/CoinListSkeleton';
import { useCoins } from '../hooks/useMarketData';
import { useWatchlist } from '../features/watchlist/watchlistContext';
import { usePortfolio } from '../features/portfolio/portfolioContext';
import { useAlerts } from '../features/alerts/alertsContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatCompactCurrency, formatInteger } from '../utils/format';

function WorkspaceCard({ to, icon, label, value, meta }) {
  return (
    <Link to={to} className="workspace-card">
      <span className="workspace-card__icon">
        <Icon name={icon} size={19} />
      </span>
      <span className="workspace-card__copy">
        <span className="workspace-card__label">{label}</span>
        <strong>{value}</strong>
        <span className="workspace-card__meta">{meta}</span>
      </span>
      <Icon name="chevron-right" size={16} className="workspace-card__chevron" />
    </Link>
  );
}

function WorkspaceStrip({ portfolioValue, holdingsCount }) {
  const { count: watchlistCount } = useWatchlist();
  const { activeCount } = useAlerts();

  return (
    <section className="workspace-strip" aria-label="Your workspace">
      <WorkspaceCard
        to="/watchlist"
        icon="star"
        label="Watchlist"
        value={formatInteger(watchlistCount)}
        meta={watchlistCount === 1 ? 'saved asset' : 'saved assets'}
      />
      <WorkspaceCard
        to="/portfolio"
        icon="wallet"
        label="Portfolio value"
        value={holdingsCount > 0 ? formatCompactCurrency(portfolioValue) : '—'}
        meta={
          holdingsCount > 0
            ? `${formatInteger(holdingsCount)} ${holdingsCount === 1 ? 'holding' : 'holdings'}`
            : 'Add your first holding'
        }
      />
      <WorkspaceCard
        to="/alerts"
        icon="bell"
        label="Active alerts"
        value={formatInteger(activeCount)}
        meta={activeCount > 0 ? 'Watching your targets' : 'Set a price target'}
      />
    </section>
  );
}

export default function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { coins, query } = useCoins();
  const { holdings } = usePortfolio();

  const portfolioValue = useMemo(() => {
    if (!holdings.length || !coins.length) return 0;
    const prices = new Map(coins.map((coin) => [coin.id, coin.price]));
    return holdings.reduce((total, holding) => {
      const price = prices.get(holding.coinId);
      return Number.isFinite(price) ? total + price * holding.amount : total;
    }, 0);
  }, [holdings, coins]);

  const topAssets = coins.slice(0, 8);
  const unavailable = query.isError && coins.length === 0;

  return (
    <div className="page page--dashboard">
      <PageHeader
        eyebrow="Overview"
        title="The crypto market at a glance"
        description="Live prices, market structure, and the headlines that matter — with your watchlist and portfolio close at hand."
        actions={
          <Link to="/markets" className="button button--primary">
            Explore markets <Icon name="arrow-right" size={16} />
          </Link>
        }
      />

      <WorkspaceStrip portfolioValue={portfolioValue} holdingsCount={holdings.length} />

      <MarketOverview />

      <div className="dashboard-grid">
        <MoversPanel coins={coins} loading={query.isPending} />
        <TrendingPanel />
      </div>

      <section className="panel" aria-labelledby="top-assets-heading">
        <div className="panel__header">
          <div>
            <h2 id="top-assets-heading">Top assets</h2>
            <p>The largest crypto assets by market capitalization.</p>
          </div>
          <Link to="/markets" className="text-link">
            All markets <Icon name="chevron-right" size={14} />
          </Link>
        </div>

        {query.isPending ? (
          <CoinListSkeleton view="table" count={6} />
        ) : unavailable ? (
          <StatusPanel
            tone="error"
            icon="alert"
            title="Market data unavailable"
            message="We could not load the market snapshot. Your saved data is still available."
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
        ) : topAssets.length === 0 ? (
          <p className="panel__note">No assets are available right now.</p>
        ) : (
          <>
            {query.isError && (
              <p className="inline-warning" role="status">
                <Icon name="clock" size={14} /> Showing the last snapshot while we reconnect.
              </p>
            )}
            <CoinTable
              coins={topAssets}
              sort="market_cap_desc"
              sortable={false}
              showVolume={false}
              caption="Top cryptocurrencies by market capitalization"
            />
            <div className="panel__footer">
              <Link to="/markets" className="button button--secondary button--small">
                View all 100 assets
              </Link>
            </div>
          </>
        )}
      </section>

      <NewsPreview />
    </div>
  );
}
