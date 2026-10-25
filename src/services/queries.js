import { queryOptions } from '@tanstack/react-query';
import { api } from './apiClient';

export const coinsQuery = queryOptions({
  queryKey: ['market', 'coins', 'top-100'],
  queryFn: ({ signal }) =>
    api.market({ resource: 'coins', order: 'market_cap_desc', per_page: 100, page: 1 }, { signal }),
  staleTime: 60_000,
  refetchInterval: 60_000,
});

export const globalQuery = queryOptions({
  queryKey: ['market', 'global'],
  queryFn: ({ signal }) => api.market({ resource: 'global' }, { signal }),
  staleTime: 120_000,
  refetchInterval: 120_000,
});

export const fearGreedQuery = queryOptions({
  queryKey: ['market', 'fear-greed'],
  queryFn: ({ signal }) => api.market({ resource: 'fear-greed' }, { signal }),
  staleTime: 300_000,
  refetchInterval: 300_000,
});

export const categoriesQuery = queryOptions({
  queryKey: ['market', 'categories'],
  queryFn: ({ signal }) => api.market({ resource: 'categories' }, { signal }),
  staleTime: 300_000,
});

export const exchangesQuery = queryOptions({
  queryKey: ['market', 'exchanges'],
  queryFn: ({ signal }) => api.market({ resource: 'exchanges' }, { signal }),
  staleTime: 300_000,
});

export const trendingQuery = queryOptions({
  queryKey: ['market', 'trending'],
  queryFn: ({ signal }) => api.market({ resource: 'trending' }, { signal }),
  staleTime: 120_000,
  refetchInterval: 120_000,
});

export function coinQuery(id) {
  return queryOptions({
    queryKey: ['market', 'coin', id],
    queryFn: ({ signal }) => api.market({ resource: 'coin', id }, { signal }),
    enabled: Boolean(id),
    staleTime: 120_000,
  });
}

export function chartQuery(id, days) {
  return queryOptions({
    queryKey: ['market', 'chart', id, days],
    queryFn: ({ signal }) => api.market({ resource: 'chart', id, days }, { signal }),
    enabled: Boolean(id),
    staleTime: 300_000,
  });
}

export function newsQuery(limit = 24) {
  return queryOptions({
    queryKey: ['news', limit],
    queryFn: ({ signal }) => api.news(limit, { signal }),
    staleTime: 180_000,
    refetchInterval: 180_000,
  });
}
