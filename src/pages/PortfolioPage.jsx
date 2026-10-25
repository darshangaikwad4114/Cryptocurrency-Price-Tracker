import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import CoinLogo from '../components/ui/CoinLogo';
import Icon from '../components/ui/Icon';
import Skeleton from '../components/ui/Skeleton';
import StatusPanel from '../components/ui/StatusPanel';
import { useCoins } from '../api/hooks';
import { usePortfolio } from '../features/portfolio/portfolioContext';
import { useToast } from '../features/toast/useToast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  formatAmount,
  formatCompactCurrency,
  formatInteger,
  formatPercent,
  formatPrice,
  toneFor,
} from '../lib/format';

const EMPTY_FORM = { coinId: '', amount: '', buyPrice: '' };

export default function PortfolioPage() {
  useDocumentTitle('Portfolio');
  const { holdings, addHolding, removeHolding } = usePortfolio();
  const { coins, query } = useCoins();
  const { notify } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const rows = useMemo(() => {
    const byId = new Map(coins.map((coin) => [coin.id, coin]));
    return holdings.map((holding) => {
      const coin = byId.get(holding.coinId) ?? null;
      const price = Number.isFinite(coin?.price) ? coin.price : null;
      const cost = holding.amount * holding.buyPrice;
      const value = price !== null ? price * holding.amount : null;
      const pnl = value !== null ? value - cost : null;
      const pnlPercent = pnl !== null && cost > 0 ? (pnl / cost) * 100 : null;
      return { ...holding, coin, price, cost, value, pnl, pnlPercent };
    });
  }, [holdings, coins]);

  const totals = useMemo(() => {
    let value = 0;
    let resolvedCost = 0;
    let cost = 0;
    let unresolved = 0;
    for (const row of rows) {
      cost += row.cost;
      if (row.value !== null) {
        value += row.value;
        resolvedCost += row.cost;
      } else {
        unresolved += 1;
      }
    }
    const pnl = value - resolvedCost;
    return {
      value,
      cost,
      pnl,
      pnlPercent: resolvedCost > 0 ? (pnl / resolvedCost) * 100 : null,
      unresolved,
    };
  }, [rows]);

  const selectedCoin = coins.find((coin) => coin.id === form.coinId) ?? null;
  const coinsById = useMemo(
    () => [...coins].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity)),
    [coins],
  );

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (formError) setFormError('');
  };

  const useCurrentPrice = () => {
    if (selectedCoin) {
      setForm((current) => ({ ...current, buyPrice: String(selectedCoin.price ?? '') }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError('');
    try {
      addHolding({
        coinId: form.coinId,
        amount: form.amount,
        buyPrice: form.buyPrice,
      });
      const label = selectedCoin ? selectedCoin.symbol.toUpperCase() : 'Holding';
      notify(`${label} added to your portfolio.`, { tone: 'success', title: 'Portfolio updated' });
      setForm(EMPTY_FORM);
    } catch (error) {
      setFormError(error.message);
    }
  };

  const handleRemove = (holding) => {
    const label = holding.coin?.symbol?.toUpperCase() ?? holding.coinId;
    removeHolding(holding.id);
    notify(`${label} removed from your portfolio.`, { tone: 'info' });
  };

  const hasHoldings = holdings.length > 0;

  return (
    <div className="page page--portfolio">
      <PageHeader
        eyebrow="Portfolio"
        title="Track your positions privately"
        description="Add holdings manually to estimate value and unrealized profit or loss. Everything stays in this browser — there is no account, wallet connection, or server sync."
        actions={
          <Link to="/markets" className="button button--secondary">
            Browse markets <Icon name="arrow-right" size={15} />
          </Link>
        }
      />

      <section className="portfolio-summary" aria-label="Portfolio summary">
        <article className="summary-card">
          <span className="summary-card__label">Estimated value</span>
          <strong>{hasHoldings ? formatCompactCurrency(totals.value) : '—'}</strong>
          <span className="summary-card__meta">
            {totals.unresolved > 0
              ? `${formatInteger(totals.unresolved)} holding${
                  totals.unresolved === 1 ? '' : 's'
                } unpriced`
              : 'Based on top-100 prices'}
          </span>
        </article>
        <article className="summary-card">
          <span className="summary-card__label">Total invested</span>
          <strong>{hasHoldings ? formatCompactCurrency(totals.cost) : '—'}</strong>
          <span className="summary-card__meta">Cost basis, excluding fees</span>
        </article>
        <article className="summary-card">
          <span className="summary-card__label">Unrealized P/L</span>
          <strong className={hasHoldings ? `tone-${toneFor(totals.pnl)}` : undefined}>
            {hasHoldings && totals.pnlPercent !== null
              ? `${totals.pnl >= 0 ? '+' : '−'}${formatCompactCurrency(Math.abs(totals.pnl))}`
              : '—'}
          </strong>
          <span className={`summary-card__meta${hasHoldings ? ` tone-${toneFor(totals.pnl)}` : ''}`}>
            {hasHoldings && totals.pnlPercent !== null
              ? `${formatPercent(totals.pnlPercent)} on priced holdings`
              : 'Add a holding to begin'}
          </span>
        </article>
        <article className="summary-card">
          <span className="summary-card__label">Holdings</span>
          <strong>{formatInteger(holdings.length)}</strong>
          <span className="summary-card__meta">Stored in local storage</span>
        </article>
      </section>

      <div className="portfolio-grid">
        <section className="panel" aria-labelledby="add-holding-heading">
          <div className="panel__header">
            <div>
              <h2 id="add-holding-heading">Add a holding</h2>
              <p>Enter the amount and the average price you paid.</p>
            </div>
          </div>

          {query.isPending ? (
            <div className="form-skeleton" aria-hidden="true">
              <Skeleton className="skeleton--field" />
              <Skeleton className="skeleton--field" />
              <Skeleton className="skeleton--field" />
              <Skeleton className="skeleton--button" />
            </div>
          ) : coins.length === 0 ? (
            <p className="panel__note">
              Market data is unavailable, so new holdings cannot be priced yet. Your existing
              holdings remain saved.
            </p>
          ) : (
            <form className="form" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="holding-coin">Asset</label>
                <div className="select-field select-field--block">
                  <select
                    id="holding-coin"
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
                      Use as buy price
                    </button>
                  </p>
                )}
              </div>

              <div className="field">
                <label htmlFor="holding-amount">Amount</label>
                <input
                  id="holding-amount"
                  name="amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={updateField('amount')}
                  required
                />
                <p className="field__hint">The quantity of the asset you hold.</p>
              </div>

              <div className="field">
                <label htmlFor="holding-buy-price">Average buy price (USD)</label>
                <input
                  id="holding-buy-price"
                  name="buyPrice"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={form.buyPrice}
                  onChange={updateField('buyPrice')}
                  required
                />
                <p className="field__hint">Used to estimate your cost basis and profit or loss.</p>
              </div>

              {formError && (
                <p className="form__error" role="alert">
                  <Icon name="alert" size={14} /> {formError}
                </p>
              )}

              <button type="submit" className="button button--primary button--block">
                <Icon name="plus" size={16} /> Add holding
              </button>
              <p className="form__note">
                Estimates only. Fees, taxes, and transfers are not included.
              </p>
            </form>
          )}
        </section>

        <section className="panel panel--flush" aria-labelledby="holdings-heading">
          <div className="panel__header panel__header--padded">
            <div>
              <h2 id="holdings-heading">Your holdings</h2>
              <p>{hasHoldings ? 'Live valuations from the top-100 snapshot.' : 'No positions yet.'}</p>
            </div>
          </div>

          {!hasHoldings ? (
            <div className="panel__empty">
              <StatusPanel
                compact
                tone="info"
                icon="wallet"
                title="No holdings yet"
                message="Add your first position with the form. Nothing is sent anywhere."
              />
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table portfolio-table">
                <thead>
                  <tr>
                    <th scope="col">Asset</th>
                    <th scope="col" className="align-right">
                      Amount
                    </th>
                    <th scope="col" className="align-right">
                      Avg buy
                    </th>
                    <th scope="col" className="align-right">
                      Price
                    </th>
                    <th scope="col" className="align-right">
                      Value
                    </th>
                    <th scope="col" className="align-right">
                      P/L
                    </th>
                    <th scope="col" className="align-right">
                      <span className="visually-hidden">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="asset-cell">
                          <CoinLogo
                            src={row.coin?.image}
                            name={row.coin?.name ?? row.coinId}
                            symbol={row.coin?.symbol ?? row.coinId}
                            size={28}
                          />
                          <div className="asset-cell__text">
                            {row.coin ? (
                              <Link to={`/coins/${row.coin.id}`} className="asset-link">
                                {row.coin.name}
                              </Link>
                            ) : (
                              <span className="asset-link asset-link--plain">{row.coinId}</span>
                            )}
                            <span className="coin-symbol">
                              {row.coin?.symbol.toUpperCase() ?? 'Unpriced'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="align-right mono">{formatAmount(row.amount)}</td>
                      <td className="align-right mono">{formatPrice(row.buyPrice)}</td>
                      <td className="align-right mono">
                        {row.price !== null ? formatPrice(row.price) : '—'}
                      </td>
                      <td className="align-right mono">
                        {row.value !== null ? formatCompactCurrency(row.value) : '—'}
                      </td>
                      <td className="align-right">
                        {row.pnl !== null ? (
                          <span className={`pl-cell tone-${toneFor(row.pnl)}`}>
                            <strong>
                              {row.pnl >= 0 ? '+' : '−'}
                              {formatCompactCurrency(Math.abs(row.pnl))}
                            </strong>
                            <small>{formatPercent(row.pnlPercent)}</small>
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="align-right">
                        <button
                          type="button"
                          className="icon-button icon-button--danger"
                          onClick={() => handleRemove(row)}
                          aria-label={`Remove ${row.coin?.name ?? row.coinId} holding`}
                          title="Remove holding"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totals.unresolved > 0 && (
            <p className="inline-warning" role="status">
              <Icon name="info" size={14} /> {formatInteger(totals.unresolved)} holding
              {totals.unresolved === 1 ? ' is' : 's are'} outside the top 100 and excluded from
              valuation totals. Their cost basis is still included in “Total invested”.
            </p>
          )}
        </section>
      </div>

      <p className="page-note">
        <Icon name="shield" size={14} /> Portfolio data is stored only in this browser. Clearing
        site data permanently removes it.
      </p>
    </div>
  );
}
