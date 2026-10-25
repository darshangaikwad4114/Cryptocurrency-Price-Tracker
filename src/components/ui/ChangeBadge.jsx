import Icon from './Icon';
import { formatPercent, toneFor } from '../../utils/format';

export default function ChangeBadge({ value, label = '24h change', size = 'md' }) {
  const tone = toneFor(value);
  if (!Number.isFinite(value)) {
    return <span className={`change-badge change-badge--neutral change-badge--${size}`}>—</span>;
  }
  return (
    <span
      className={`change-badge change-badge--${tone} change-badge--${size}`}
      aria-label={`${label}: ${value > 0 ? 'up' : value < 0 ? 'down' : 'unchanged'} ${Math.abs(
        value,
      ).toFixed(2)} percent`}
    >
      <Icon name={value >= 0 ? 'arrow-up' : 'arrow-down'} size={12} strokeWidth={2.2} />
      {formatPercent(value)}
    </span>
  );
}
