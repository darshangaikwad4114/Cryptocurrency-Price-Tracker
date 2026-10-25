import Icon from '../ui/Icon';
import Skeleton from '../ui/Skeleton';
import ChangeBadge from '../ui/ChangeBadge';
import DataFreshness from '../ui/DataFreshness';
import StatusPanel from '../ui/StatusPanel';
import { useFearGreed, useGlobal } from '../../api/hooks';
import { clamp, formatCompactCurrency, formatPercent } from '../../lib/format';

function fearTone(value) {
  if (!Number.isFinite(value)) return 'neutral';
  if (value <= 25) return 'extreme-fear';
  if (value <= 45) return 'fear';
  if (value <= 55) return 'neutral';
  if (value <= 75) return 'greed';
  return 'extreme-greed';
}

function MetricSkeleton() {
  return (
    <article className="metric-card" aria-hidden="true">
      <div className="metric-card__top">
        <Skeleton className="skeleton--icon" />
        <Skeleton className="skeleton--text-sm" style={{ width: '40%' }} />
      </div>
      <Skeleton className="skeleton--metric" />
      <Skeleton className="skeleton--text-sm" style={{ width: '55%' }} />
    </article>
  );
}

function MetricError({ onRetry, label }) {
  return (
    <article className="metric-card metric-card--error">
      <div className="metric-card__top">
        <span className="metric-card__icon">
          <Icon name="alert" size={18} />
        </span>
        <h3>{label}</h3>
      </div>
      <p className="metric-card__unavailable">Unavailable</p>
      <button type="button" className="text-button" onClick={onRetry}>
        <Icon name="refresh" size={13} /> Retry
      </button>
    </article>
  );
}

export default function MarketOverview() {
  const { global, meta, query: globalQuery } = useGlobal();
  const { fearGreed, query: fearQuery } = useFearGreed();

  const loading = globalQuery.isPending;
  const fearLoading = fearQuery.isPending;
  const turnover =
    Number.isFinite(global?.totalVolume24h) &&
    Number.isFinite(global?.totalMarketCap) &&
    global.totalMarketCap > 0
      ? (global.totalVolume24h / global.totalMarketCap) * 100
      : null;

  const refresh = () => {
    if (globalQuery.isError) globalQuery.refetch();
    if (fearQuery.isError) fearQuery.refetch();
  };

  return (
    <section className="market-overview" aria-labelledby="market-pulse-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Live snapshot</p>
          <h2 id="market-pulse-heading">Market pulse</h2>
        </div>
        <div className="section-heading__actions">
          <DataFreshness
            meta={meta}
            updatedAt={globalQuery.dataUpdatedAt}
            isFetching={globalQuery.isFetching}
          />
          <button
            type="button"
            className="icon-button"
            onClick={refresh}
            aria-label="Refresh market snapshot"
            title="Refresh market snapshot"
            disabled={globalQuery.isFetching || fearQuery.isFetching}
          >
            <Icon name="refresh" size={16} />
          </button>
        </div>
      </div>

      <div className="metric-grid">
        {loading ? (
          <MetricSkeleton />
        ) : globalQuery.isError || !global ? (
          <MetricError onRetry={() => globalQuery.refetch()} label="Market cap" />
        ) : (
          <article className="metric-card">
            <div className="metric-card__top">
              <span className="metric-card__icon">
                <Icon name="globe" size={18} />
              </span>
              <h3>Total market cap</h3>
            </div>
            <p className="metric-card__value">{formatCompactCurrency(global.totalMarketCap)}</p>
            <div className="metric-card__footer">
              <ChangeBadge value={global.marketCapChange24h} label="Market cap change 24h" size="sm" />
              <span>24h</span>
            </div>
          </article>
        )}

        {loading ? (
          <MetricSkeleton />
        ) : globalQuery.isError || !global ? (
          <MetricError onRetry={() => globalQuery.refetch()} label="24h volume" />
        ) : (
          <article className="metric-card">
            <div className="metric-card__top">
              <span className="metric-card__icon">
                <Icon name="activity" size={18} />
              </span>
              <h3>24h volume</h3>
            </div>
            <p className="metric-card__value">{formatCompactCurrency(global.totalVolume24h)}</p>
            <div className="metric-card__footer">
              {Number.isFinite(turnover) ? (
                <span>{turnover.toFixed(2)}% of market cap traded</span>
              ) : (
                <span>Across tracked markets</span>
              )}
            </div>
          </article>
        )}

        {loading ? (
          <MetricSkeleton />
        ) : globalQuery.isError || !global ? (
          <MetricError onRetry={() => globalQuery.refetch()} label="BTC dominance" />
        ) : (
          <article className="metric-card">
            <div className="metric-card__top">
              <span className="metric-card__icon">
                <Icon name="coins" size={18} />
              </span>
              <h3>BTC dominance</h3>
            </div>
            <p className="metric-card__value">{formatPercent(global.btcDominance, { signed: false })}</p>
            <div className="dominance-bar" aria-hidden="true">
              <span
                className="dominance-bar__btc"
                style={{ width: `${clamp(global.btcDominance ?? 0, 0, 100)}%` }}
              />
              <span
                className="dominance-bar__eth"
                style={{ width: `${clamp(global.ethDominance ?? 0, 0, 100)}%` }}
              />
            </div>
            <div className="metric-card__footer metric-card__legend">
              <span>
                <i className="legend-dot legend-dot--btc" /> BTC {formatPercent(global.btcDominance, { signed: false })}
              </span>
              <span>
                <i className="legend-dot legend-dot--eth" /> ETH {formatPercent(global.ethDominance, { signed: false })}
              </span>
            </div>
          </article>
        )}

        {fearLoading ? (
          <MetricSkeleton />
        ) : fearQuery.isError || !fearGreed ? (
          <MetricError onRetry={() => fearQuery.refetch()} label="Fear & Greed" />
        ) : (
          <article className={`metric-card metric-card--fear tone-${fearTone(fearGreed.value)}`}>
            <div className="metric-card__top">
              <span className="metric-card__icon">
                <Icon name="chart" size={18} />
              </span>
              <h3>Fear &amp; Greed</h3>
            </div>
            <div className="fear-value">
              <p className="metric-card__value">{fearGreed.value}</p>
              <span className="pill">{fearGreed.classification}</span>
            </div>
            <div
              className="fear-meter"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={fearGreed.value}
              aria-label={`Fear and Greed index: ${fearGreed.value} out of 100, ${fearGreed.classification}`}
            >
              <span style={{ width: `${clamp(fearGreed.value, 0, 100)}%` }} />
            </div>
            <div className="metric-card__footer">
              {Number.isFinite(fearGreed.previousValue) ? (
                <span>
                  Previous {fearGreed.previousValue} · {fearGreed.previousClassification}
                </span>
              ) : (
                <span>Alternative.me sentiment index</span>
              )}
            </div>
          </article>
        )}
      </div>

      {(globalQuery.isError || fearQuery.isError) && (
        <div className="market-overview__warning">
          <StatusPanel
            compact
            tone="warning"
            icon="clock"
            title="Some metrics could not be refreshed"
            message="Showing the latest available values. Retry to update."
            actions={
              <button type="button" className="button button--small button--secondary" onClick={refresh}>
                Retry
              </button>
            }
          />
        </div>
      )}
    </section>
  );
}
