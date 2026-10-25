import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { WatchlistProvider } from './WatchlistProvider';
import { useWatchlist } from './watchlistContext';
import { STORAGE_KEYS } from '../../utils/storage';

const wrapper = ({ children }) => <WatchlistProvider>{children}</WatchlistProvider>;

function seed(ids) {
  localStorage.setItem(STORAGE_KEYS.watchlist, JSON.stringify(ids));
}

function storedIds() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.watchlist));
}

describe('WatchlistProvider', () => {
  it('starts empty and persists the initial list', async () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper });

    expect(result.current.ids).toEqual([]);
    expect(result.current.count).toBe(0);
    await waitFor(() => expect(storedIds()).toEqual([]));
  });

  it('toggles coins on and off', async () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper });

    act(() => result.current.toggle('bitcoin'));
    expect(result.current.ids).toEqual(['bitcoin']);
    expect(result.current.isWatched('bitcoin')).toBe(true);
    expect(result.current.count).toBe(1);

    act(() => result.current.toggle('ethereum'));
    expect(result.current.ids).toEqual(['ethereum', 'bitcoin']);

    act(() => result.current.remove('bitcoin'));
    expect(result.current.ids).toEqual(['ethereum']);
    expect(result.current.isWatched('bitcoin')).toBe(false);

    await waitFor(() => expect(storedIds()).toEqual(['ethereum']));
  });

  it('ignores malformed coin ids', () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper });

    act(() => result.current.toggle(''));
    act(() => result.current.toggle('Bitcoin'));
    act(() => result.current.toggle('bad id'));
    act(() => result.current.toggle(42));

    expect(result.current.ids).toEqual([]);
  });

  it('sanitizes persisted entries and de-duplicates them', () => {
    seed(['bitcoin', 'bitcoin', 'bad id', '', 'ethereum', 7, 'solana']);

    const { result } = renderHook(() => useWatchlist(), { wrapper });

    expect(result.current.ids).toEqual(['bitcoin', 'ethereum', 'solana']);
  });

  it('falls back to an empty list when storage is corrupt', () => {
    localStorage.setItem(STORAGE_KEYS.watchlist, '{not-json');

    const { result } = renderHook(() => useWatchlist(), { wrapper });

    expect(result.current.ids).toEqual([]);
  });
});
