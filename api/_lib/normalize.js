const MAX_TEXT = 2000;
const MAX_NAME = 120;
const MAX_URL = 500;

const ENTITY_MAP = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
};

export function decodeEntities(value) {
  return String(value).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const isHex = entity[1] === 'x' || entity[1] === 'X';
      const codePoint = Number.parseInt(isHex ? entity.slice(2) : entity.slice(1), isHex ? 16 : 10);
      if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return ' ';
      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return ' ';
      }
    }
    return ENTITY_MAP[entity.toLowerCase()] ?? match;
  });
}

export function stripHtml(value, max = MAX_TEXT) {
  if (typeof value !== 'string') return '';
  const withoutBlocks = value
    .replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const withoutTags = withoutBlocks.replace(/<[^>]*>/g, ' ');
  return decodeEntities(withoutTags)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function cleanText(value, max = MAX_NAME) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

export function httpsUrl(value, max = MAX_URL) {
  if (typeof value !== 'string' || value.length > max) return null;
  const candidate = value.trim();
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function imageUrl(value) {
  const url = httpsUrl(value);
  if (!url) return null;
  if (!/\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i.test(new URL(url).pathname)) {
    return url;
  }
  return url;
}

export function finiteNumber(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

export function nonNegative(value) {
  const number = finiteNumber(value);
  return number === null || number < 0 ? null : number;
}

export function percentage(value) {
  const number = finiteNumber(value);
  if (number === null || Math.abs(number) > 1_000_000) return null;
  return Math.round(number * 100) / 100;
}

export function positiveInt(value) {
  const number = finiteNumber(value);
  if (number === null || !Number.isInteger(number) || number <= 0) return null;
  return number;
}

export function isoTimestamp(value) {
  let date;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    date = new Date(value < 1e12 ? value * 1000 : value);
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) {
      const numeric = Number(trimmed);
      date = new Date(numeric < 1e12 ? numeric * 1000 : numeric);
    } else {
      date = new Date(trimmed);
    }
  } else {
    return null;
  }
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function uniqueHttpsUrls(values, limit = 5) {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  const urls = [];
  for (const value of values) {
    const url = httpsUrl(value);
    if (url && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
    if (urls.length >= limit) break;
  }
  return urls;
}

export function normalizeCoin(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = cleanText(raw.id, 100);
  const name = cleanText(raw.name, MAX_NAME);
  const symbol = cleanText(raw.symbol, 20);
  if (!id || !name || !symbol) return null;

  return {
    id,
    symbol,
    name,
    image: imageUrl(raw.image),
    rank: positiveInt(raw.market_cap_rank),
    price: nonNegative(raw.current_price),
    marketCap: nonNegative(raw.market_cap),
    volume24h: nonNegative(raw.total_volume),
    change1h: percentage(raw.price_change_percentage_1h_in_currency),
    change24h: percentage(raw.price_change_percentage_24h_in_currency ?? raw.price_change_percentage_24h),
    change7d: percentage(raw.price_change_percentage_7d_in_currency),
    change30d: percentage(raw.price_change_percentage_30d_in_currency),
    high24h: nonNegative(raw.high_24h),
    low24h: nonNegative(raw.low_24h),
    circulatingSupply: nonNegative(raw.circulating_supply),
    totalSupply: nonNegative(raw.total_supply),
    maxSupply: nonNegative(raw.max_supply),
    ath: nonNegative(raw.ath),
    atl: nonNegative(raw.atl),
    lastUpdated: isoTimestamp(raw.last_updated),
  };
}

export function normalizeCoinDetail(raw) {
  const base = normalizeCoin({
    ...raw,
    current_price: raw?.market_data?.current_price?.usd,
    market_cap: raw?.market_data?.market_cap?.usd,
    total_volume: raw?.market_data?.total_volume?.usd,
    high_24h: raw?.market_data?.high_24h?.usd,
    low_24h: raw?.market_data?.low_24h?.usd,
    price_change_percentage_1h_in_currency:
      raw?.market_data?.price_change_percentage_1h_in_currency?.usd,
    price_change_percentage_24h_in_currency:
      raw?.market_data?.price_change_percentage_24h_in_currency?.usd,
    price_change_percentage_7d_in_currency:
      raw?.market_data?.price_change_percentage_7d_in_currency?.usd,
    price_change_percentage_30d_in_currency:
      raw?.market_data?.price_change_percentage_30d_in_currency?.usd,
    circulating_supply: raw?.market_data?.circulating_supply,
    total_supply: raw?.market_data?.total_supply,
    max_supply: raw?.market_data?.max_supply,
    ath: raw?.market_data?.ath?.usd,
    atl: raw?.market_data?.atl?.usd,
    last_updated: raw?.last_updated,
  });
  if (!base) return null;

  const links = raw?.links ?? {};
  return {
    ...base,
    description: stripHtml(raw?.description?.en, 4000),
    homepage: uniqueHttpsUrls(links.homepage, 3)[0] ?? null,
    explorer: uniqueHttpsUrls(links.blockchain_site, 3)[0] ?? null,
    community: uniqueHttpsUrls(
      [links.subreddit_url, ...(Array.isArray(links.chat_url) ? links.chat_url : [])],
      3,
    ),
    repos: uniqueHttpsUrls(links.repos_url?.github, 2),
    genesisDate: isoTimestamp(raw?.genesis_date),
    categories: Array.isArray(raw?.categories)
      ? [...new Set(raw.categories.map((c) => cleanText(c, 60)).filter(Boolean))].slice(0, 12)
      : [],
    hashingAlgorithm: cleanText(raw?.hashing_algorithm, 60) || null,
    fullyDilutedValuation: nonNegative(raw?.market_data?.fully_diluted_valuation?.usd),
    change14d: percentage(raw?.market_data?.price_change_percentage_14d_in_currency?.usd),
    change1y: percentage(raw?.market_data?.price_change_percentage_1y_in_currency?.usd),
    athDate: isoTimestamp(raw?.market_data?.ath_date?.usd),
    atlDate: isoTimestamp(raw?.market_data?.atl_date?.usd),
  };
}

export function normalizeChart(raw) {
  if (!Array.isArray(raw?.prices)) return null;
  const points = [];
  for (const entry of raw.prices) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const timestamp = finiteNumber(entry[0]);
    const price = nonNegative(entry[1]);
    if (timestamp === null || price === null) continue;
    points.push([timestamp, price]);
  }
  if (points.length < 2) return null;
  if (points.length <= 500) return points;

  const sampled = [];
  const step = (points.length - 1) / 499;
  for (let index = 0; index < 500; index += 1) {
    sampled.push(points[Math.round(index * step)]);
  }
  return sampled;
}

export function normalizeGlobal(raw) {
  const data = raw?.data;
  if (!data) return null;
  return {
    totalMarketCap: nonNegative(data.total_market_cap?.usd),
    totalVolume24h: nonNegative(data.total_volume?.usd),
    marketCapChange24h: percentage(data.market_cap_change_percentage_24h_usd),
    btcDominance: percentage(data.market_cap_percentage?.btc),
    ethDominance: percentage(data.market_cap_percentage?.eth),
    activeCryptocurrencies: positiveInt(data.active_cryptocurrencies) ?? 0,
    markets: positiveInt(data.markets) ?? 0,
    updatedAt: isoTimestamp(data.updated_at),
  };
}

export function normalizeCategories(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((category) => {
      const id = cleanText(category?.id, 80);
      const name = cleanText(category?.name, 80);
      if (!id || !name) return null;
      return {
        id,
        name,
        marketCap: nonNegative(category.market_cap),
        marketCapChange24h: percentage(category.market_cap_change_24h),
        volume24h: nonNegative(category.volume_24h),
        topCoinImages: uniqueHttpsUrls(category.top_3_coins, 3),
      };
    })
    .filter((category) => category && category.marketCap !== null)
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 12);
}

export function normalizeExchanges(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((exchange) => {
      const id = cleanText(exchange?.id, 80);
      const name = cleanText(exchange?.name, 80);
      if (!id || !name) return null;
      return {
        id,
        name,
        image: imageUrl(exchange.image),
        trustScore: finiteNumber(exchange.trust_score),
        trustScoreRank: positiveInt(exchange.trust_score_rank),
        volume24hBtc: nonNegative(exchange.trade_volume_24h_btc),
        yearEstablished: positiveInt(exchange.year_established),
        country: cleanText(exchange.country, 60) || null,
        url: httpsUrl(exchange.url),
      };
    })
    .filter(Boolean)
    .slice(0, 10);
}

export function normalizeTrending(raw) {
  const coins = Array.isArray(raw?.coins) ? raw.coins : [];
  return coins
    .map((entry) => {
      const item = entry?.item;
      if (!item) return null;
      const id = cleanText(item.id, 100);
      const name = cleanText(item.name, MAX_NAME);
      const symbol = cleanText(item.symbol, 20);
      if (!id || !name || !symbol) return null;
      return {
        id,
        name,
        symbol,
        image: imageUrl(item.small ?? item.thumb ?? item.large),
        rank: positiveInt(item.market_cap_rank),
        price: nonNegative(item.data?.price),
        change24h: percentage(item.data?.price_change_percentage_24h?.usd),
      };
    })
    .filter(Boolean)
    .slice(0, 10);
}

export function normalizeNews(raw) {
  const articles = Array.isArray(raw?.Data) ? raw.Data : [];
  const seen = new Set();
  const normalized = [];
  for (const article of articles) {
    const title = stripHtml(article?.title, 240);
    const url = httpsUrl(article?.url);
    if (!title || !url || seen.has(url)) continue;
    seen.add(url);
    const publishedOn = finiteNumber(article.published_on);
    normalized.push({
      id: String(article.id ?? url).slice(0, 100),
      title,
      url,
      source: stripHtml(article?.source_info?.name ?? article?.source, 80) || 'Unknown source',
      excerpt: stripHtml(article?.body, 260),
      image: imageUrl(article?.imageurl),
      categories: Array.isArray(article?.categories)
        ? article.categories.map((category) => cleanText(category, 40)).filter(Boolean)
        : typeof article?.categories === 'string'
          ? article.categories
              .split('|')
              .map((category) => cleanText(category, 40))
              .filter(Boolean)
          : [],
      publishedAt:
        publishedOn === null ? null : new Date(publishedOn * 1000).toISOString(),
    });
    if (normalized.length >= 60) break;
  }
  return normalized;
}

export function normalizeFearGreed(raw) {
  if (!Array.isArray(raw?.data) || raw.data.length === 0) return null;
  const latest = raw.data[0];
  const previous = raw.data[1];
  const value = finiteNumber(latest?.value);
  if (value === null) return null;
  return {
    value: Math.min(100, Math.max(0, Math.round(value))),
    classification: cleanText(latest?.value_classification, 40) || 'Unknown',
    updatedAt:
      finiteNumber(latest?.timestamp) === null
        ? null
        : new Date(Number(latest.timestamp) * 1000).toISOString(),
    previousValue: previous ? finiteNumber(previous.value) : null,
    previousClassification: previous ? cleanText(previous.value_classification, 40) : null,
  };
}

export const normalizers = {
  coins: (raw) =>
    (Array.isArray(raw) ? raw : [])
      .map(normalizeCoin)
      .filter(Boolean),
  global: normalizeGlobal,
  coin: normalizeCoinDetail,
  chart: normalizeChart,
  categories: normalizeCategories,
  exchanges: normalizeExchanges,
  trending: normalizeTrending,
  news: normalizeNews,
  'fear-greed': normalizeFearGreed,
};
