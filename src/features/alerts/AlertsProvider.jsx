import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertsContext } from './alertsContext';
import { readArray, STORAGE_KEYS, uid, writeStorage } from '../../lib/storage';

const MAX_ITEMS = 100;
const COIN_ID = /^[a-z0-9][a-z0-9-]{0,79}$/;

function normalize(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((alert) => {
      if (!alert || typeof alert !== 'object') return null;
      const target = Number(alert.target);
      if (
        typeof alert.coinId !== 'string' ||
        !COIN_ID.test(alert.coinId) ||
        !['above', 'below'].includes(alert.direction) ||
        !Number.isFinite(target) ||
        target <= 0
      ) {
        return null;
      }
      return {
        id: typeof alert.id === 'string' ? alert.id : uid(),
        coinId: alert.coinId,
        direction: alert.direction,
        target,
        createdAt:
          typeof alert.createdAt === 'string' && !Number.isNaN(Date.parse(alert.createdAt))
            ? alert.createdAt
            : new Date().toISOString(),
        triggeredAt:
          typeof alert.triggeredAt === 'string' && !Number.isNaN(Date.parse(alert.triggeredAt))
            ? alert.triggeredAt
            : null,
        triggeredPrice:
          alert.triggeredPrice === null || alert.triggeredPrice === undefined
            ? null
            : Number.isFinite(Number(alert.triggeredPrice))
              ? Number(alert.triggeredPrice)
              : null,
      };
    })
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
}

function initialPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

export function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState(() => normalize(readArray(STORAGE_KEYS.alerts)));
  const [permission, setPermission] = useState(initialPermission);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.alerts, alerts);
  }, [alerts]);

  const addAlert = useCallback(({ coinId, direction, target }) => {
    if (typeof coinId !== 'string' || !COIN_ID.test(coinId)) {
      throw new Error('Choose a valid coin.');
    }
    if (!['above', 'below'].includes(direction)) {
      throw new Error('Choose whether the price should rise above or fall below your target.');
    }
    const numericTarget = Number(target);
    if (!Number.isFinite(numericTarget) || numericTarget <= 0) {
      throw new Error('Target price must be greater than zero.');
    }
    const alert = {
      id: uid(),
      coinId,
      direction,
      target: numericTarget,
      createdAt: new Date().toISOString(),
      triggeredAt: null,
      triggeredPrice: null,
    };
    setAlerts((current) => [alert, ...current].slice(0, MAX_ITEMS));
    return alert;
  }, []);

  const removeAlert = useCallback((alertId) => {
    setAlerts((current) => current.filter((alert) => alert.id !== alertId));
  }, []);

  const markTriggered = useCallback((alertId, price) => {
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === alertId && !alert.triggeredAt
          ? {
              ...alert,
              triggeredAt: new Date().toISOString(),
              triggeredPrice: Number.isFinite(price) ? price : null,
            }
          : alert,
      ),
    );
  }, []);

  const clearTriggered = useCallback(() => {
    setAlerts((current) => current.filter((alert) => !alert.triggeredAt));
  }, []);

  const requestNotifications = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'unsupported';
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      setPermission(Notification.permission);
      return Notification.permission;
    }
  }, []);

  const value = useMemo(
    () => ({
      alerts,
      activeCount: alerts.filter((alert) => !alert.triggeredAt).length,
      addAlert,
      removeAlert,
      markTriggered,
      clearTriggered,
      notificationPermission: permission,
      requestNotifications,
    }),
    [
      alerts,
      addAlert,
      removeAlert,
      markTriggered,
      clearTriggered,
      permission,
      requestNotifications,
    ],
  );

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}
