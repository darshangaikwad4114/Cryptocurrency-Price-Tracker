import { Link } from 'react-router-dom';
import CoinLogo from '../ui/CoinLogo';
import ChangeBadge from '../ui/ChangeBadge';
import Icon from '../ui/Icon';
import Skeleton from '../ui/Skeleton';
import StatusPanel from '../ui/StatusPanel';
import { useTrending } from '../../api/hooks';
import { formatPrice } from '../../lib/format';

export default function TrendingPanel() {
  const { trending, query } = useTrending();

  return (
    <section className="panel trending-panel" aria-labelledby="trending-heading">
      <div className="panel__header">
        <div>
          <h2 id="trending-heading">Trending</h2>
          <p>What the market is searching for.</p>
        </div>
        <span className="pill">
          <Icon name="spark" size={12} /> Live
        </span>
      </div>

      {query.isPending ? (
        <ul className="trending-list" aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index}>
              <Skeleton className="skeleton--avatar-sm" />
              <Skeleton className="skeleton--text" style={{ width: '45%' }} />
            </li>
          ))}
        </ul>
      ) : query.isError ? (
        <StatusPanel
          compact
          tone="error"
          icon="alert"
          title="Trending unavailable"
          message="CoinGecko trending data could not be loaded."
          actions={
            <button
              type="button"
              className="button button--small button--secondary"
              onClick={() => query.refetch()}
            >
              Retry
            </button>
          }
        />
      ) : trending.length === 0 ? (
        <p className="panel__note">No trending assets right now.</p>
      ) : (
        <ol className="trending-list">
          {trending.slice(0, 5).map((coin, index) => (
            <li key={coin.id}>
              <Link to={`/coins/${coin.id}`} className="trending-row">
                <span className="trending-row__rank">{index + 1}</span>
                <CoinLogo src={coin.image} name={coin.name} symbol={coin.symbol} size={26} />
                <div className="trending-row__name">
                  <strong>{coin.name}</strong>
                  <span>{coin.symbol.toUpperCase()}</span>
                </div>
                <div className="trending-row__price">
                  <span>{formatPrice(coin.price)}</span>
                  <ChangeBadge value={coin.change24h} size="sm" />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
