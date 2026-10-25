import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { PortfolioProvider } from './PortfolioProvider';
import { usePortfolio } from './portfolioContext';
import { STORAGE_KEYS } from '../../lib/storage';

const wrapper = ({ children }) => <PortfolioProvider>{children}</PortfolioProvider>;

function seed(holdings) {
  localStorage.setItem(STORAGE_KEYS.portfolio, JSON.stringify(holdings));
}

function storedHoldings() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.portfolio));
}

describe('PortfolioProvider', () => {
  it('adds a holding with numeric values and persists it', async () => {
    const { result } = renderHook(() => usePortfolio(), { wrapper });

    expect(result.current.holdings).toEqual([]);

    let created;
    act(() => {
      created = result.current.addHolding({
        coinId: 'bitcoin',
        amount: '0.5',
        buyPrice: '50000',
      });
    });

    expect(created).toMatchObject({ coinId: 'bitcoin', amount: 0.5, buyPrice: 50000 });
    expect(created.id).toEqual(expect.any(String));
    expect(result.current.holdings).toHaveLength(1);
    expect(result.current.count).toBe(1);

    await waitFor(() =>
      expect(storedHoldings()).toEqual([
        expect.objectContaining({ coinId: 'bitcoin', amount: 0.5, buyPrice: 50000 }),
      ]),
    );
  });

  it.each([
    [{ coinId: 'Bitcoin', amount: 1, buyPrice: 1 }, 'Choose a valid coin.'],
    [{ coinId: 'bitcoin', amount: 0, buyPrice: 1 }, 'Amount must be greater than zero.'],
    [{ coinId: 'bitcoin', amount: -1, buyPrice: 1 }, 'Amount must be greater than zero.'],
    [{ coinId: 'bitcoin', amount: 'abc', buyPrice: 1 }, 'Amount must be greater than zero.'],
    [{ coinId: 'bitcoin', amount: 1, buyPrice: 0 }, 'Buy price must be greater than zero.'],
    [{ coinId: 'bitcoin', amount: 1, buyPrice: null }, 'Buy price must be greater than zero.'],
  ])('rejects invalid input %#', (input, message) => {
    const { result } = renderHook(() => usePortfolio(), { wrapper });

    expect(() => act(() => result.current.addHolding(input))).toThrow(message);
    expect(result.current.holdings).toEqual([]);
  });

  it('removes a holding by id', async () => {
    const { result } = renderHook(() => usePortfolio(), { wrapper });

    let holding;
    act(() => {
      holding = result.current.addHolding({ coinId: 'ethereum', amount: 2, buyPrice: 2000 });
    });

    act(() => result.current.removeHolding(holding.id));

    expect(result.current.holdings).toEqual([]);
    await waitFor(() => expect(storedHoldings()).toEqual([]));
  });

  it('drops invalid persisted holdings and normalizes valid ones', () => {
    seed([
      { id: 'ok', coinId: 'bitcoin', amount: '0.25', buyPrice: '40000', addedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'bad-coin', coinId: 'Bad Coin', amount: 1, buyPrice: 1 },
      { id: 'zero-amount', coinId: 'ethereum', amount: 0, buyPrice: 10 },
      { id: 'zero-price', coinId: 'ethereum', amount: 1, buyPrice: 0 },
      null,
      'nope',
    ]);

    const { result } = renderHook(() => usePortfolio(), { wrapper });

    expect(result.current.holdings).toEqual([
      expect.objectContaining({
        id: 'ok',
        coinId: 'bitcoin',
        amount: 0.25,
        buyPrice: 40000,
        addedAt: '2026-01-01T00:00:00.000Z',
      }),
    ]);
  });
});
