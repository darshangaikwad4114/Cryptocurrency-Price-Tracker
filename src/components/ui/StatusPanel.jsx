import Icon from './Icon';

export default function StatusPanel({
  tone = 'info',
  icon = 'info',
  title,
  message,
  actions = null,
  compact = false,
}) {
  return (
    <div
      className={`status-panel status-panel--${tone}${compact ? ' status-panel--compact' : ''}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span className="status-panel__icon">
        <Icon name={icon} size={compact ? 18 : 22} />
      </span>
      <div className="status-panel__content">
        {title && <h3>{title}</h3>}
        {message && <p>{message}</p>}
        {actions && <div className="status-panel__actions">{actions}</div>}
      </div>
    </div>
  );
}
