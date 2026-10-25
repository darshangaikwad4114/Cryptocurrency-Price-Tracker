import Icon from './Icon';
import { formatDateTime, formatTime } from '../../utils/format';

export default function DataFreshness({ meta, updatedAt, isFetching = false, label = 'Updated' }) {
  const timestamp = meta?.cachedAt ?? (updatedAt ? new Date(updatedAt).toISOString() : null);
  if (!timestamp) return null;

  return (
    <span className="data-freshness" title={formatDateTime(timestamp)}>
      <span className={`live-dot${isFetching ? ' live-dot--pulsing' : ''}`} aria-hidden="true" />
      <span>
        {label} <time dateTime={timestamp}>{formatTime(timestamp)}</time>
      </span>
      {meta?.stale && (
        <span className="pill pill--warning">
          <Icon name="clock" size={12} /> Cached
        </span>
      )}
      <span className="visually-hidden" aria-live="polite">
        {isFetching ? 'Refreshing data' : 'Data is up to date'}
      </span>
    </span>
  );
}
