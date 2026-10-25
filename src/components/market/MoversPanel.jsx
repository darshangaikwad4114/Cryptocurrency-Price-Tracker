import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CoinLogo from '../ui/CoinLogo';
import ChangeBadge from '../ui/ChangeBadge';
import Icon from '../ui/Icon';
import Skeleton from '../ui/Skeleton';
import { getTopMovers } from '../../lib/market';
import { formatPrice } from '../../lib/format';

export default function MoversPanel({ coins, loading }) {
  const [tab, setTab] = useState('gainers');
  const { gainers, losers } = useMemo(() => getTopMovers(coins, 4), [coins]);
  const items = tab === 'gainers' ? gainers : losers;

  return (
    <section className="panel movers-panel" aria-labelledby="movers-heading">
      <div className="panel__header">
        <div>
          <h2 id="movers-heading">Market movers</h2>
          <p>Largest 24h moves in the top 100.</p>
        </div>
        <Link to="/markets" className="text-link">
          Markets <Icon name="chevron-right" size={14} />
        </Link>
      </div>

      <div className="segmented" role="group" aria-label="Mover type">
        <button
          type="button"
          className={tab === 'gainers' ? 'is-active' : ''}
          aria-pressed={tab === 'gainers'}
          onClick={() => setTab('gainers')}
        >
          <Icon name="trending-up" size={14} /> Gainers
        </button>
        <button
          type="button"
          className={tab === 'losers' ? 'is-active' : ''}
          aria-pressed={tab === 'losers'}
          onClick={() => setTab('losers')}
        >
          <Icon name="arrow-down" size={14} /> Losers
        </button>
      </div>

      {loading ? (
        <ul className="mover-list" aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index}>
              <Skeleton className="skeleton--avatar-sm" />
              <Skeleton className="skeleton--text" style={{ width: '38%' }} />
              <Skeleton className="skeleton--text" style={{ width: '18%' }} />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="panel__note">
          No {tab === 'gainers' ? 'gainers' : 'losers'} in the current snapshot.
        </p>
      ) : (
        <ul className="mover-list">
          {items.map((coin) => (
            <li key={coin.id}>
              <Link to={`/coins/${coin.id}`} className="mover-row">
                <CoinLogo src={coin.image} name={coin.name} symbol={coin.symbol} size={28} />
                <div className="mover-row__name">
                  <strong>{coin.symbol.toUpperCase()}</strong>
                  <span>{coin.name}</span>
                </div>
                <span className="mover-row__price">{formatPrice(coin.price)}</span>
                <ChangeBadge value={coin.change24h} size="sm" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
