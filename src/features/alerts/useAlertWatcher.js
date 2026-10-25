import { useEffect } from 'react';
import { useAlerts } from './useAlerts';
import { useToast } from '../toast/useToast';
import { formatPrice } from '../../lib/format';

export function useAlertWatcher(coins) {
  const { alerts, markTriggered } = useAlerts();
  const { notify } = useToast();

  useEffect(() => {
    if (!coins.length || !alerts.length) return;
    const byId = new Map(coins.map((coin) => [coin.id, coin]));

    for (const alert of alerts) {
      if (alert.triggeredAt) continue;
      const coin = byId.get(alert.coinId);
      if (!coin || !Number.isFinite(coin.price)) continue;

      const hit =
        alert.direction === 'above' ? coin.price >= alert.target : coin.price <= alert.target;
      if (!hit) continue;

      markTriggered(alert.id, coin.price);
      const message = `${coin.symbol.toUpperCase()} is ${alert.direction} ${formatPrice(
        alert.target,
      )} — now ${formatPrice(coin.price)}.`;
      notify(message, { tone: 'info', title: 'Price alert' });

      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted' &&
        document.hidden
      ) {
        try {
          new Notification('Crypto Tracker price alert', {
            body: message,
            tag: `price-alert-${alert.id}`,
          });
        } catch {
          // Browser notifications are best-effort; the in-app toast still fires.
        }
      }
    }
  }, [coins, alerts, markTriggered, notify]);
}
