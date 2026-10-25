import CoinCard from '../market/CoinCard';

export default function CoinGrid({ coins }) {
  return (
    <ul className="coin-grid" role="list">
      {coins.map((coin) => (
        <li key={coin.id}>
          <CoinCard coin={coin} />
        </li>
      ))}
    </ul>
  );
}
