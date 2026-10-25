const priceFormatters = new Map();

function priceFormatter(maximumFractionDigits) {
  let formatter = priceFormatters.get(maximumFractionDigits);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: Math.min(2, maximumFractionDigits),
      maximumFractionDigits,
    });
    priceFormatters.set(maximumFractionDigits, formatter);
  }
  return formatter;
}

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 2,
});

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 2,
});

const integerNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

const amountNumber = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 8,
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function formatPrice(value) {
  if (!Number.isFinite(value)) return '—';
  const magnitude = Math.abs(value);
  const digits = magnitude >= 1 ? 2 : magnitude >= 0.01 ? 4 : magnitude >= 0.0001 ? 6 : 8;
  return priceFormatter(digits).format(value);
}

export function formatCompactCurrency(value) {
  if (!Number.isFinite(value)) return '—';
  return compactCurrency.format(value);
}

export function formatCompactNumber(value) {
  if (!Number.isFinite(value)) return '—';
  return compactNumber.format(value);
}

export function formatInteger(value) {
  if (!Number.isFinite(value)) return '—';
  return integerNumber.format(value);
}

export function formatAmount(value) {
  if (!Number.isFinite(value)) return '—';
  return amountNumber.format(value);
}

export function formatPercent(value, { signed = true } = {}) {
  if (!Number.isFinite(value)) return '—';
  const prefix = signed && value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}

export function formatTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : timeFormatter.format(date);
}

export function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export function formatRelativeTime(value, now = Date.now()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const seconds = Math.round((now - date.getTime()) / 1000);
  if (seconds < 45) return 'just now';
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))}m ago`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)}h ago`;
  if (seconds < 604_800) return `${Math.round(seconds / 86_400)}d ago`;
  return dateFormatter.format(date);
}

export function toneFor(value) {
  if (!Number.isFinite(value) || value === 0) return 'neutral';
  return value > 0 ? 'positive' : 'negative';
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
