import { useCallback, useEffect, useMemo, useState } from 'react';
import { PortfolioContext } from './portfolioContext';
import { readArray, STORAGE_KEYS, uid, writeStorage } from '../../lib/storage';

const MAX_ITEMS = 200;
const COIN_ID = /^[a-z0-9][a-z0-9-]{0,79}$/;

function normalize(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((holding) => {
      if (!holding || typeof holding !== 'object') return null;
      const amount = Number(holding.amount);
      const buyPrice = Number(holding.buyPrice);
      if (
        typeof holding.coinId !== 'string' ||
        !COIN_ID.test(holding.coinId) ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !Number.isFinite(buyPrice) ||
        buyPrice <= 0
      ) {
        return null;
      }
      return {
        id: typeof holding.id === 'string' ? holding.id : uid(),
        coinId: holding.coinId,
        amount,
        buyPrice,
        addedAt:
          typeof holding.addedAt === 'string' && !Number.isNaN(Date.parse(holding.addedAt))
            ? holding.addedAt
            : new Date().toISOString(),
      };
    })
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
}

export function PortfolioProvider({ children }) {
  const [holdings, setHoldings] = useState(() => normalize(readArray(STORAGE_KEYS.portfolio)));

  useEffect(() => {
    writeStorage(STORAGE_KEYS.portfolio, holdings);
  }, [holdings]);

  const addHolding = useCallback(({ coinId, amount, buyPrice }) => {
    if (typeof coinId !== 'string' || !COIN_ID.test(coinId)) {
      throw new Error('Choose a valid coin.');
    }
    const numericAmount = Number(amount);
    const numericBuyPrice = Number(buyPrice);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new Error('Amount must be greater than zero.');
    }
    if (!Number.isFinite(numericBuyPrice) || numericBuyPrice <= 0) {
      throw new Error('Buy price must be greater than zero.');
    }
    const holding = {
      id: uid(),
      coinId,
      amount: numericAmount,
      buyPrice: numericBuyPrice,
      addedAt: new Date().toISOString(),
    };
    setHoldings((current) => [holding, ...current].slice(0, MAX_ITEMS));
    return holding;
  }, []);

  const removeHolding = useCallback((holdingId) => {
    setHoldings((current) => current.filter((holding) => holding.id !== holdingId));
  }, []);

  const value = useMemo(
    () => ({ holdings, count: holdings.length, addHolding, removeHolding }),
    [holdings, addHolding, removeHolding],
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}
