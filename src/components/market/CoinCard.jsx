import { Link } from 'react-router-dom';
import CoinLogo from '../ui/CoinLogo';
import ChangeBadge from '../ui/ChangeBadge';
import WatchButton from './WatchButton';
import { formatCompactCurrency, formatPrice } from '../../lib/format';

export default function CoinCard({ coin }) {
  return (
    <article className="coin-card">
      <div className="coin-card__top">
        <span className="coin-rank">#{coin.rank ?? '—'}</span>
        <WatchButton coinId={coin.id} name={coin.name} size="sm" />
      </div>

      <Link to={`/coins/${coin.id}`} className="coin-card__link">
        <div className="coin-card__identity">
          <CoinLogo src={coin.image} name={coin.name} symbol={coin.symbol} size={44} />
          <div>
            <h3>{coin.name}</h3>
            <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
          </div>
        </div>

        <div className="coin-card__price">
          <span className="coin-card__price-value">{formatPrice(coin.price)}</span>
          <ChangeBadge value={coin.change24h} />
        </div>

        <dl className="coin-card__stats">
          <div>
            <dt>Market cap</dt>
            <dd>{formatCompactCurrency(coin.marketCap)}</dd>
          </div>
          <div>
            <dt>Volume</dt>
            <dd>{formatCompactCurrency(coin.volume24h)}</dd>
          </div>
        </dl>
      </Link>
    </article>
  );
}
