import { Link } from 'react-router-dom';
import CoinLogo from '../ui/CoinLogo';
import ChangeBadge from '../ui/ChangeBadge';
import Icon from '../ui/Icon';
import WatchButton from './WatchButton';
import { formatCompactCurrency, formatPrice } from '../../lib/format';

function SortHeader({ label, field, sort, onSortChange, align = 'left', sortable = true }) {
  const descendingKey = `${field}_desc`;
  const ascendingKey = `${field}_asc`;
  const active = sort === descendingKey || sort === ascendingKey;
  const direction = sort === ascendingKey ? 'ascending' : 'descending';
  const next = active && sort === descendingKey ? ascendingKey : descendingKey;

  if (!sortable) {
    return (
      <th scope="col" className={`align-${align}`}>
        {label}
      </th>
    );
  }

  return (
    <th scope="col" aria-sort={active ? direction : 'none'} className={`align-${align}`}>
      <button
        type="button"
        className={`table-sort${active ? ' is-active' : ''}`}
        onClick={() => onSortChange(next)}
      >
        {label}
        <Icon
          name={active && sort === ascendingKey ? 'arrow-up' : 'arrow-down'}
          size={12}
          className="table-sort__icon"
        />
      </button>
    </th>
  );
}

export default function CoinTable({
  coins,
  sort,
  onSortChange,
  showVolume = true,
  sortable = true,
  caption,
}) {
  return (
    <div className="table-scroll">
      <table className="coin-table">
        {caption && <caption className="visually-hidden">{caption}</caption>}
        <thead>
          <tr>
            <th scope="col" className="align-right table-rank">
              #
            </th>
            <SortHeader
              label="Asset"
              field="name"
              sort={sort}
              onSortChange={onSortChange}
              sortable={sortable}
            />
            <SortHeader
              label="Price"
              field="price"
              sort={sort}
              onSortChange={onSortChange}
              align="right"
              sortable={sortable}
            />
            <th
              scope="col"
              className="align-right"
              aria-sort={
                sortable
                  ? sort === 'change_desc'
                    ? 'descending'
                    : sort === 'change_asc'
                      ? 'ascending'
                      : 'none'
                  : undefined
              }
            >
              {sortable ? (
                <button
                  type="button"
                  className={`table-sort${sort.startsWith('change_') ? ' is-active' : ''}`}
                  onClick={() =>
                    onSortChange(sort === 'change_desc' ? 'change_asc' : 'change_desc')
                  }
                >
                  24h
                  {sort.startsWith('change_') && (
                    <Icon
                      name={sort === 'change_asc' ? 'arrow-up' : 'arrow-down'}
                      size={12}
                      className="table-sort__icon"
                    />
                  )}
                </button>
              ) : (
                '24h'
              )}
            </th>
            <SortHeader
              label="Market cap"
              field="market_cap"
              sort={sort}
              onSortChange={onSortChange}
              align="right"
              sortable={sortable}
            />
            {showVolume && (
              <SortHeader
                label="Volume"
                field="volume"
                sort={sort}
                onSortChange={onSortChange}
                align="right"
                sortable={sortable}
              />
            )}
            <th scope="col" className="align-right">
              <span className="visually-hidden">Watchlist</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => (
            <tr key={coin.id}>
              <td className="align-right table-rank">{coin.rank ?? '—'}</td>
              <td>
                <div className="asset-cell">
                  <CoinLogo src={coin.image} name={coin.name} symbol={coin.symbol} size={30} />
                  <div className="asset-cell__text">
                    <Link to={`/coins/${coin.id}`} className="asset-link">
                      {coin.name}
                    </Link>
                    <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
                  </div>
                </div>
              </td>
              <td className="align-right mono">{formatPrice(coin.price)}</td>
              <td className="align-right">
                <ChangeBadge value={coin.change24h} size="sm" />
              </td>
              <td className="align-right mono">{formatCompactCurrency(coin.marketCap)}</td>
              {showVolume && (
                <td className="align-right mono table-volume">
                  {formatCompactCurrency(coin.volume24h)}
                </td>
              )}
              <td className="align-right">
                <WatchButton coinId={coin.id} name={coin.name} size="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
