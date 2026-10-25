import { describe, expect, it } from 'vitest';
import {
  clamp,
  formatAmount,
  formatCompactCurrency,
  formatCompactNumber,
  formatDate,
  formatDateTime,
  formatPercent,
  formatPrice,
  formatRelativeTime,
  toneFor,
} from './format';

describe('formatPrice', () => {
  it.each([
    [1234.5, '$1,234.50'],
    [0.123456, '$0.1235'],
    [0.0000123456, '$0.00001235'],
    [0, '$0.00'],
    [Number.NaN, '—'],
    [null, '—'],
    [undefined, '—'],
  ])('formats %p as %p', (value, expected) => {
    expect(formatPrice(value)).toBe(expected);
  });
});

describe('number and percent formatting', () => {
  it('formats compact currencies and counts', () => {
    expect(formatCompactCurrency(1_620_000_000_000)).toBe('$1.62T');
    expect(formatCompactCurrency(Number.NaN)).toBe('—');
    expect(formatCompactNumber(21_000_000)).toBe('21M');
    expect(formatCompactNumber(Number.POSITIVE_INFINITY)).toBe('—');
    expect(formatAmount(0.00000123)).toBe('0.00000123');
    expect(formatAmount(Number.NaN)).toBe('—');
  });

  it('formats percentages with optional signs', () => {
    expect(formatPercent(1.234)).toBe('+1.23%');
    expect(formatPercent(-1.5)).toBe('-1.50%');
    expect(formatPercent(0)).toBe('0.00%');
    expect(formatPercent(1.234, { signed: false })).toBe('1.23%');
    expect(formatPercent(Number.NaN)).toBe('—');
  });

  it('maps values to tones', () => {
    expect(toneFor(1)).toBe('positive');
    expect(toneFor(-1)).toBe('negative');
    expect(toneFor(0)).toBe('neutral');
    expect(toneFor(Number.NaN)).toBe('neutral');
  });

  it('clamps values', () => {
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(-2, 0, 10)).toBe(0);
    expect(clamp(4, 0, 10)).toBe(4);
  });
});

describe('date formatting', () => {
  const now = Date.UTC(2026, 9, 25, 12, 0, 0);

  it('formats relative times across units', () => {
    expect(formatRelativeTime(now - 30_000, now)).toBe('just now');
    expect(formatRelativeTime(now - 300_000, now)).toBe('5m ago');
    expect(formatRelativeTime(now - 7_200_000, now)).toBe('2h ago');
    expect(formatRelativeTime(now - 259_200_000, now)).toBe('3d ago');
    expect(formatRelativeTime(now - 864_000_000, now)).toMatch(/Oct \d{1,2}, 2026/);
  });

  it('handles invalid dates without throwing', () => {
    expect(formatRelativeTime('not-a-date')).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
    expect(formatDateTime('not-a-date')).toBe('—');
  });

  it('formats valid dates', () => {
    expect(formatDate(new Date(now))).toMatch(/Oct 2[45], 2026/);
    expect(formatDateTime(new Date(now))).toMatch(/Oct 2[45], 2026/);
  });
});
