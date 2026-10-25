import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import CoinLogo from '../components/ui/CoinLogo';
import Icon from '../components/ui/Icon';
import StatusPanel from '../components/ui/StatusPanel';
import { useCoins } from '../api/hooks';
import { useAlerts } from '../features/alerts/alertsContext';
import { useToast } from '../features/toast/useToast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  formatDateTime,
  formatPercent,
  formatPrice,
  formatRelativeTime,
} from '../lib/format';

const EMPTY_FORM = { coinId: '', direction: 'above', target: '' };

function permissionCopy(permission) {
  if (permission === 'unsupported') {
    return {
      tone: 'info',
      title: 'Desktop notifications are not supported',
      message: 'In-app alerts still appear while Crypto Tracker is open in this browser.',
    };
  }
  if (permission === 'granted') {
    return {
      tone: 'success',
      title: 'Desktop notifications are enabled',
      message: 'Alerts can reach you while the tab is in the background.',
    };
  }
  if (permission === 'denied') {
    return {
      tone: 'warning',
      title: 'Desktop notifications are blocked',
      message:
        'Alerts still appear in-app. To allow desktop alerts, update this site’s notification permission in your browser settings.',
    };
  }
  return {
    tone: 'info',
    title: 'Get alerts in the background',
    message:
      'Enable browser notifications to see triggered alerts when Crypto Tracker is in a background tab.',
  };
}

export default function AlertsPage() {
  useDocumentTitle('Price alerts');
  const { alerts, addAlert, removeAlert, clearTriggered, notificationPermission, requestNotifications } =
    useAlerts();
  const { coins } = useCoins();
  const { notify } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [requesting, setRequesting] = useState(false);

  const byId = useMemo(() => new Map(coins.map((coin) => [coin.id, coin])), [coins]);
  const coinsById = useMemo(
    () => [...coins].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity)),
    [coins],
  );
  const active = alerts.filter((alert) => !alert.triggeredAt);
  const triggered = alerts.filter((alert) => alert.triggeredAt);
  const selectedCoin = byId.get(form.coinId) ?? null;
  const copy = permissionCopy(notificationPermission);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (formError) setFormError('');
  };

  const useCurrentPrice = () => {
    if (selectedCoin && Number.isFinite(selectedCoin.price)) {
      setForm((current) => ({ ...current, target: String(selectedCoin.price) }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError('');
    try {
      addAlert({
        coinId: form.coinId,
        direction: form.direction,
        target: form.target,
      });
      const symbol = selectedCoin ? selectedCoin.symbol.toUpperCase() : 'Asset';
      notify(
        `${symbol} ${form.direction === 'above' ? 'above' : 'below'} ${formatPrice(
          Number(form.target),
        )} — we will watch it while this tab is open.`,
        { tone: 'success', title: 'Price alert created' },
      );
      setForm((current) => ({ ...EMPTY_FORM, coinId: current.coinId, direction: current.direction }));
    } catch (error) {
      setFormError(error.message);
    }
  };

  const handleRemove = (alert) => {
    const symbol = byId.get(alert.coinId)?.symbol.toUpperCase() ?? alert.coinId;
    removeAlert(alert.id);
    notify(`${symbol} alert removed.`, { tone: 'info' });
  };

  const handlePermission = async () => {
    setRequesting(true);
    try {
      const result = await requestNotifications();
      if (result === 'granted') {
        notify('Desktop notifications enabled.', { tone: 'success' });
      } else if (result === 'denied') {
        notify('Notifications were blocked. In-app alerts still work.', { tone: 'info' });
      }
    } finally {
      setRequesting(false);
    }
  };

  const distanceFor = (alert, price) => {
    if (!Number.isFinite(price) || price <= 0) return null;
    const difference =
      alert.direction === 'above' ? alert.target - price : price - alert.target;
    return (difference / price) * 100;
  };

  return (
    <div className="page page--alerts">
      <PageHeader
        eyebrow="Alerts"
        title="Watch a price target"
        description="Set a threshold and Crypto Tracker checks it against the latest top-100 snapshot every minute while this tab is open. Alerts are stored in your browser."
        actions={
          <Link to="/markets" className="button button--secondary">
            Find an asset <Icon name="arrow-right" size={15} />
          </Link>
        }
      />

      <StatusPanel
        compact
        tone={copy.tone}
        icon={copy.tone === 'success' ? 'check' : 'bell'}
        title={copy.title}
        message={copy.message}
        actions={
          notificationPermission === 'default' ? (
            <button
              type="button"
              className="button button--small button--secondary"
              onClick={handlePermission}
              disabled={requesting}
            >
              {requesting ? 'Requesting…' : 'Enable notifications'}
            </button>
          ) : null
        }
      />

      <div className="alerts-grid">
        <section className="panel" aria-labelledby="new-alert-heading">
          <div className="panel__header">
            <div>
              <h2 id="new-alert-heading">New alert</h2>
              <p>You can create up to 100 alerts.</p>
            </div>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="alert-coin">Asset</label>
              <div className="select-field select-field--block">
                <select
                  id="alert-coin"
                  name="coinId"
                  value={form.coinId}
                  onChange={updateField('coinId')}
                  required
                >
                  <option value="">Select an asset</option>
                  {coinsById.map((coin) => (
                    <option key={coin.id} value={coin.id}>
                      {coin.name} ({coin.symbol.toUpperCase()})
                    </option>
                  ))}
                </select>
                <Icon name="chevron-down" size={14} className="select-field__icon" />
              </div>
              {selectedCoin && (
                <p className="field__hint">
                  Current price {formatPrice(selectedCoin.price)}
                  <button
                    type="button"
                    className="text-button text-button--inline"
                    onClick={useCurrentPrice}
                  >
                    Use as target
                  </button>
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="alert-direction">Condition</label>
              <div className="select-field select-field--block">
                <select
                  id="alert-direction"
                  name="direction"
                  value={form.direction}
                  onChange={updateField('direction')}
                >
                  <option value="above">Price rises above target</option>
                  <option value="below">Price falls below target</option>
                </select>
                <Icon name="chevron-down" size={14} className="select-field__icon" />
              </div>
            </div>

            <div className="field">
              <label htmlFor="alert-target">Target price (USD)</label>
              <input
                id="alert-target"
                name="target"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="0.00"
                value={form.target}
                onChange={updateField('target')}
                required
              />
              <p className="field__hint">
                The alert triggers once per target, on the first refresh that crosses it.
              </p>
            </div>

            {formError && (
              <p className="form__error" role="alert">
                <Icon name="alert" size={14} /> {formError}
              </p>
            )}

            <button type="submit" className="button button--primary button--block">
              <Icon name="bell" size={16} /> Create alert
            </button>
            <p className="form__note">
              In-app alerts require an open tab. Desktop notifications require browser permission
              and an HTTPS deployment.
            </p>
          </form>
        </section>

        <section className="panel panel--flush" aria-labelledby="active-alerts-heading">
          <div className="panel__header panel__header--padded">
            <div>
              <h2 id="active-alerts-heading">Active alerts</h2>
              <p>
                {active.length === 0
                  ? 'No alerts are waiting.'
                  : `${active.length} ${active.length === 1 ? 'alert is' : 'alerts are'} watching the market.`}
              </p>
            </div>
          </div>

          {active.length === 0 ? (
            <div className="panel__empty">
              <StatusPanel
                compact
                tone="info"
                icon="bell"
                title="Nothing to watch yet"
                message="Create an alert with the form to start monitoring a price target."
              />
            </div>
          ) : (
            <ul className="alert-list">
              {active.map((alert) => {
                const coin = byId.get(alert.coinId) ?? null;
                const price = coin?.price ?? null;
                const distance = distanceFor(alert, price);
                return (
                  <li key={alert.id} className="alert-card">
                    <div className="alert-card__identity">
                      <CoinLogo
                        src={coin?.image}
                        name={coin?.name ?? alert.coinId}
                        symbol={coin?.symbol ?? alert.coinId}
                        size={32}
                      />
                      <div>
                        <strong>{coin?.name ?? alert.coinId}</strong>
                        <span>
                          {coin ? coin.symbol.toUpperCase() : 'Not in top 100'}
                        </span>
                      </div>
                    </div>

                    <div className="alert-card__condition">
                      <span className={`pill pill--${alert.direction === 'above' ? 'positive' : 'negative'}`}>
                        <Icon name={alert.direction === 'above' ? 'arrow-up' : 'arrow-down'} size={12} />
                        {alert.direction === 'above' ? 'Above' : 'Below'} {formatPrice(alert.target)}
                      </span>
                      <span className="alert-card__current">
                        Now {price !== null ? formatPrice(price) : '—'}
                        {Number.isFinite(distance) && (
                          <>
                            {' · '}
                            {distance > 0
                              ? `${formatPercent(distance, { signed: false })} away`
                              : 'target crossed'}
                          </>
                        )}
                      </span>
                      <span className="alert-card__created">
                        Created {formatRelativeTime(alert.createdAt)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="icon-button icon-button--danger"
                      onClick={() => handleRemove(alert)}
                      aria-label={`Remove ${coin?.name ?? alert.coinId} alert`}
                      title="Remove alert"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {coins.length === 0 && active.length > 0 && (
            <p className="inline-warning" role="status">
              <Icon name="clock" size={14} /> Market prices are unavailable right now, so alerts
              cannot be evaluated until data returns.
            </p>
          )}
        </section>
      </div>

      <section className="panel panel--flush" aria-labelledby="triggered-heading">
        <div className="panel__header panel__header--padded">
          <div>
            <h2 id="triggered-heading">Triggered</h2>
            <p>Alerts that have fired. They will not fire again.</p>
          </div>
          {triggered.length > 0 && (
            <button type="button" className="button button--ghost button--small" onClick={clearTriggered}>
              <Icon name="trash" size={14} /> Clear all
            </button>
          )}
        </div>

        {triggered.length === 0 ? (
          <div className="panel__empty">
            <p className="panel__note">No alerts have triggered yet.</p>
          </div>
        ) : (
          <ul className="alert-list">
            {triggered.map((alert) => {
              const coin = byId.get(alert.coinId) ?? null;
              return (
                <li key={alert.id} className="alert-card alert-card--triggered">
                  <div className="alert-card__identity">
                    <CoinLogo
                      src={coin?.image}
                      name={coin?.name ?? alert.coinId}
                      symbol={coin?.symbol ?? alert.coinId}
                      size={32}
                    />
                    <div>
                      <strong>{coin?.name ?? alert.coinId}</strong>
                      <span>{coin ? coin.symbol.toUpperCase() : 'Triggered'}</span>
                    </div>
                  </div>

                  <div className="alert-card__condition">
                    <span className="pill pill--success">
                      <Icon name="check" size={12} /> {alert.direction === 'above' ? 'Above' : 'Below'}{' '}
                      {formatPrice(alert.target)}
                    </span>
                    <span className="alert-card__current">
                      Triggered at {alert.triggeredPrice !== null ? formatPrice(alert.triggeredPrice) : 'an unavailable price'}
                    </span>
                    <span className="alert-card__created" title={formatDateTime(alert.triggeredAt)}>
                      {formatRelativeTime(alert.triggeredAt)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="icon-button icon-button--danger"
                    onClick={() => handleRemove(alert)}
                    aria-label={`Remove triggered alert for ${coin?.name ?? alert.coinId}`}
                    title="Remove alert"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="page-note">
        <Icon name="shield" size={14} /> Alerts are local to this browser and are evaluated only
        while a Crypto Tracker tab is open and online.
      </p>
    </div>
  );
}
