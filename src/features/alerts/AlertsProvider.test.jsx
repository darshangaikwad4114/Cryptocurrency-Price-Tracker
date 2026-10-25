import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AlertsProvider } from './AlertsProvider';
import { useAlerts } from './alertsContext';
import { STORAGE_KEYS } from '../../utils/storage';

const wrapper = ({ children }) => <AlertsProvider>{children}</AlertsProvider>;

function seed(alerts) {
  localStorage.setItem(STORAGE_KEYS.alerts, JSON.stringify(alerts));
}

function storedAlerts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.alerts));
}

describe('AlertsProvider', () => {
  it('creates an active alert and persists it', async () => {
    const { result } = renderHook(() => useAlerts(), { wrapper });

    let created;
    act(() => {
      created = result.current.addAlert({
        coinId: 'bitcoin',
        direction: 'above',
        target: '100000',
      });
    });

    expect(created).toMatchObject({
      coinId: 'bitcoin',
      direction: 'above',
      target: 100000,
      triggeredAt: null,
      triggeredPrice: null,
    });
    expect(result.current.activeCount).toBe(1);

    await waitFor(() =>
      expect(storedAlerts()).toEqual([
        expect.objectContaining({ coinId: 'bitcoin', direction: 'above', target: 100000 }),
      ]),
    );
  });

  it.each([
    [{ coinId: 'Bitcoin', direction: 'above', target: 1 }, 'Choose a valid coin.'],
    [
      { coinId: 'bitcoin', direction: 'sideways', target: 1 },
      'Choose whether the price should rise above or fall below your target.',
    ],
    [
      { coinId: 'bitcoin', direction: 'above', target: 0 },
      'Target price must be greater than zero.',
    ],
    [
      { coinId: 'bitcoin', direction: 'above', target: 'abc' },
      'Target price must be greater than zero.',
    ],
  ])('rejects invalid input %#', (input, message) => {
    const { result } = renderHook(() => useAlerts(), { wrapper });

    expect(() => act(() => result.current.addAlert(input))).toThrow(message);
    expect(result.current.alerts).toEqual([]);
  });

  it('marks an alert as triggered exactly once', async () => {
    const { result } = renderHook(() => useAlerts(), { wrapper });

    let created;
    act(() => {
      created = result.current.addAlert({ coinId: 'bitcoin', direction: 'below', target: 50000 });
    });

    act(() => result.current.markTriggered(created.id, 49000));
    expect(result.current.alerts[0]).toMatchObject({ triggeredPrice: 49000 });
    expect(result.current.alerts[0].triggeredAt).toEqual(expect.any(String));
    expect(result.current.activeCount).toBe(0);

    const firstTrigger = result.current.alerts[0].triggeredAt;
    act(() => result.current.markTriggered(created.id, 48000));

    expect(result.current.alerts[0].triggeredAt).toBe(firstTrigger);
    expect(result.current.alerts[0].triggeredPrice).toBe(49000);

    await waitFor(() => expect(storedAlerts()).toHaveLength(1));
  });

  it('stores null when triggered with a non-finite price', () => {
    const { result } = renderHook(() => useAlerts(), { wrapper });

    let created;
    act(() => {
      created = result.current.addAlert({ coinId: 'ethereum', direction: 'above', target: 4000 });
    });
    act(() => result.current.markTriggered(created.id, Number.NaN));

    expect(result.current.alerts[0].triggeredPrice).toBeNull();
    expect(result.current.alerts[0].triggeredAt).toEqual(expect.any(String));
  });

  it('keeps a persisted null triggeredPrice null instead of coercing it to zero', async () => {
    seed([
      {
        id: 'triggered',
        coinId: 'bitcoin',
        direction: 'above',
        target: 60000,
        createdAt: '2026-01-01T00:00:00.000Z',
        triggeredAt: '2026-01-02T00:00:00.000Z',
        triggeredPrice: null,
      },
      {
        id: 'active',
        coinId: 'ethereum',
        direction: 'below',
        target: 1000,
        createdAt: '2026-01-01T00:00:00.000Z',
        triggeredAt: null,
        triggeredPrice: 999,
      },
    ]);

    const { result } = renderHook(() => useAlerts(), { wrapper });

    expect(result.current.alerts[0].triggeredPrice).toBeNull();
    expect(result.current.alerts[1].triggeredPrice).toBe(999);
    expect(result.current.activeCount).toBe(1);

    await waitFor(() => expect(storedAlerts()[0].triggeredPrice).toBeNull());
  });

  it('removes individual alerts and clears triggered ones', () => {
    const { result } = renderHook(() => useAlerts(), { wrapper });

    const created = [];
    act(() => {
      created.push(result.current.addAlert({ coinId: 'bitcoin', direction: 'above', target: 1 }));
      created.push(result.current.addAlert({ coinId: 'ethereum', direction: 'below', target: 2 }));
      created.push(result.current.addAlert({ coinId: 'solana', direction: 'above', target: 3 }));
    });
    act(() => result.current.markTriggered(created[0].id, 5));

    expect(result.current.alerts).toHaveLength(3);

    act(() => result.current.removeAlert(created[1].id));
    expect(result.current.alerts.map((alert) => alert.coinId)).toEqual(['solana', 'bitcoin']);

    act(() => result.current.clearTriggered());
    expect(result.current.alerts.map((alert) => alert.coinId)).toEqual(['solana']);
  });

  it('drops invalid persisted alerts', () => {
    seed([
      { id: 'ok', coinId: 'bitcoin', direction: 'above', target: '100', triggeredAt: 'nope' },
      { id: 'bad-coin', coinId: 'Not A Coin', direction: 'above', target: 1 },
      { id: 'bad-direction', coinId: 'bitcoin', direction: 'across', target: 1 },
      { id: 'bad-target', coinId: 'bitcoin', direction: 'below', target: 0 },
      null,
    ]);

    const { result } = renderHook(() => useAlerts(), { wrapper });

    expect(result.current.alerts).toEqual([
      expect.objectContaining({
        id: 'ok',
        coinId: 'bitcoin',
        direction: 'above',
        target: 100,
        triggeredAt: null,
      }),
    ]);
    expect(result.current.notificationPermission).toBe('unsupported');
  });
});
