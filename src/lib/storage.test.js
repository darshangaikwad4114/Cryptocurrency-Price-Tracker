import { describe, expect, it } from 'vitest';
import { readArray, readStorage, STORAGE_KEYS, uid, writeStorage } from './storage';

describe('storage helpers', () => {
  it('round-trips JSON values', () => {
    expect(writeStorage('test-key', { enabled: true })).toBe(true);
    expect(readStorage('test-key', null)).toEqual({ enabled: true });
  });

  it('returns the fallback for missing or corrupt values', () => {
    expect(readStorage('missing', 'fallback')).toBe('fallback');
    localStorage.setItem('broken', '{not-json');
    expect(readStorage('broken', 'fallback')).toBe('fallback');
  });

  it('only returns arrays from readArray', () => {
    expect(readArray('missing')).toEqual([]);
    localStorage.setItem('object', JSON.stringify({ a: 1 }));
    expect(readArray('object')).toEqual([]);
    localStorage.setItem('array', JSON.stringify(['a', 'b']));
    expect(readArray('array')).toEqual(['a', 'b']);
  });

  it('exposes stable storage keys', () => {
    expect(STORAGE_KEYS.theme).toBe('cryptotracker.theme');
    expect(STORAGE_KEYS.watchlist).toMatch(/\.v1$/);
  });

  it('generates unique ids', () => {
    expect(uid()).not.toBe(uid());
  });
});
