import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Icon from '../components/ui/Icon';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Link to="/" className="brand brand--footer">
            <Logo size={32} />
            <span className="brand__text">
              <strong>Crypto Tracker</strong>
              <small>Market intelligence</small>
            </span>
          </Link>
          <p>
            A fast, private crypto market dashboard. Your watchlist, portfolio, and alerts stay in
            your browser.
          </p>
        </div>

        <div className="footer__column">
          <h2>Explore</h2>
          <Link to="/markets">Markets</Link>
          <Link to="/news">News</Link>
          <Link to="/portfolio">Portfolio</Link>
          <Link to="/watchlist">Watchlist</Link>
          <Link to="/alerts">Price alerts</Link>
        </div>

        <div className="footer__column">
          <h2>Data</h2>
          <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer">
            CoinGecko <Icon name="external" size={13} />
          </a>
          <a href="https://www.cryptocompare.com" target="_blank" rel="noopener noreferrer">
            CryptoCompare <Icon name="external" size={13} />
          </a>
          <a
            href="https://alternative.me/crypto/fear-and-greed-index/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Fear &amp; Greed <Icon name="external" size={13} />
          </a>
          <Link to="/about">How it works</Link>
        </div>
      </div>

      <div className="container footer__bottom">
        <p>
          © {year} Crypto Tracker. Market data is provided for information only and is not financial
          advice.
        </p>
        <p className="footer__privacy">
          <Icon name="shield" size={14} /> No accounts. No tracking. Data stored locally.
        </p>
      </div>
    </footer>
  );
}
