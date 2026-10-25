import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from '../ui/Logo';
import Icon from '../ui/Icon';
import ThemeToggle from './ThemeToggle';
import { useWatchlist } from '../../features/watchlist/watchlistContext';
import { useAlerts } from '../../features/alerts/alertsContext';
import { useCoins } from '../../api/hooks';
import { formatTime } from '../../lib/format';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/markets', label: 'Markets' },
  { to: '/news', label: 'News' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/watchlist', label: 'Watchlist' },
];

export default function Header() {
  const location = useLocation();
  const [openMenuPath, setOpenMenuPath] = useState(null);
  const menuOpen = openMenuPath === location.pathname;
  const closeMenu = () => setOpenMenuPath(null);
  const { count: watchlistCount } = useWatchlist();
  const { activeCount } = useAlerts();
  const { coins, query } = useCoins();

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpenMenuPath(null);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('no-scroll');
    };
  }, [menuOpen]);

  const lastUpdated = query.data?.meta?.cachedAt;

  return (
    <header className="site-header">
      <div className="container header__inner">
        <Link to="/" className="brand">
          <Logo size={36} />
          <span className="brand__text">
            <strong>Crypto Tracker</strong>
            <small>Market intelligence</small>
          </span>
        </Link>

        <nav className="primary-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => {
                const active =
                  isActive || (item.to === '/markets' && location.pathname.startsWith('/coins/'));
                return `primary-nav__link${active ? ' is-active' : ''}`;
              }}
            >
              {item.label}
              {item.to === '/watchlist' && watchlistCount > 0 && (
                <span className="nav-count" aria-label={`${watchlistCount} saved coins`}>
                  {watchlistCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="header__actions">
          <span className="header__status" title={lastUpdated ? `Data updated ${formatTime(lastUpdated)}` : 'Connecting to market data'}>
            <span className={`live-dot${query.isFetching ? ' live-dot--pulsing' : ''}`} />
            <span>{coins.length ? 'Live' : 'Connecting'}</span>
          </span>

          <Link
            to="/alerts"
            className="icon-button alerts-link"
            aria-label={`Price alerts, ${activeCount} active`}
            title="Price alerts"
          >
            <Icon name="bell" size={19} />
            {activeCount > 0 && <span className="nav-count nav-count--floating">{activeCount}</span>}
          </Link>

          <ThemeToggle />

          <button
            type="button"
            className="icon-button menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setOpenMenuPath(menuOpen ? null : location.pathname)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={21} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="mobile-nav" id="mobile-navigation" aria-label="Mobile">
          <div className="container mobile-nav__inner">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `mobile-nav__link${isActive ? ' is-active' : ''}`}
                onClick={closeMenu}
              >
                {item.label}
                {item.to === '/watchlist' && watchlistCount > 0 && (
                  <span className="nav-count">{watchlistCount}</span>
                )}
              </NavLink>
            ))}
            <NavLink to="/alerts" className="mobile-nav__link" onClick={closeMenu}>
              Price alerts
              {activeCount > 0 && <span className="nav-count">{activeCount}</span>}
            </NavLink>
            <NavLink to="/about" className="mobile-nav__link" onClick={closeMenu}>
              About
            </NavLink>
            {lastUpdated && (
              <p className="mobile-nav__status">
                <span className="live-dot" /> Market data updated {formatTime(lastUpdated)}
              </p>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
