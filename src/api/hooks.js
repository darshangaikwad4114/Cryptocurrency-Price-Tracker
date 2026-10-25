import { useQuery } from '@tanstack/react-query';
import {
  categoriesQuery,
  chartQuery,
  coinQuery,
  coinsQuery,
  exchangesQuery,
  fearGreedQuery,
  globalQuery,
  newsQuery,
  trendingQuery,
} from './queries';

export function useCoins() {
  const query = useQuery(coinsQuery);
  return {
    query,
    coins: query.data?.data ?? [],
    meta: query.data?.meta ?? null,
  };
}

export function useGlobal() {
  const query = useQuery(globalQuery);
  return { query, global: query.data?.data ?? null, meta: query.data?.meta ?? null };
}

export function useFearGreed() {
  const query = useQuery(fearGreedQuery);
  return { query, fearGreed: query.data?.data ?? null };
}

export function useCategories() {
  const query = useQuery(categoriesQuery);
  return { query, categories: query.data?.data ?? [] };
}

export function useExchanges() {
  const query = useQuery(exchangesQuery);
  return { query, exchanges: query.data?.data ?? [] };
}

export function useTrending() {
  const query = useQuery(trendingQuery);
  return { query, trending: query.data?.data ?? [] };
}

export function useCoin(id) {
  const query = useQuery(coinQuery(id));
  return { query, coin: query.data?.data ?? null };
}

export function useChart(id, days) {
  const query = useQuery(chartQuery(id, days));
  return { query, points: query.data?.data ?? [] };
}

export function useNews(limit = 24) {
  const query = useQuery(newsQuery(limit));
  return {
    query,
    articles: query.data?.data ?? [],
    meta: query.data?.meta ?? null,
  };
}
