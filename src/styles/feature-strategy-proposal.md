# Feature Strategy Proposal — Cryptocurrency Analytics Dashboard

## Current State Inventory

### What Exists Now
- **Data source**: CoinGecko `/coins/markets` (price, market cap, volume, 24h change)
- **Historical data**: `/coins/{id}/market_chart` (price history for charts)
- **Metrics present**: Fear & Greed (mock), BTC Dominance (computed), Trending tags (heuristic)
- **Screener present**: Top Gainers, Top Losers, Highest Volume (sorting only)
- **No technical indicators**: No RSI, MACD, moving averages, Bollinger Bands
- **No composite signals**: No buy/sell/neutral ratings
- **No alerting**: No WebSocket, no threshold-based notifications
- **News component exists**: NewsFeed present but sentiment not correlated

### API Constraints (CoinGecko Free Tier)
- Rate limit: ~10-30 calls/min
- `/coins/markets`: current snapshot only (no OHLCV for indicator computation)
- `/coins/{id}/market_chart`: provides price history, can compute indicators client-side
- No built-in technical indicators
- No order book depth, no social sentiment in free tier

---

## Prioritized Feature Proposals

### Phase 1 (1-2 weeks each) — Quick Wins / High Impact

| # | Feature | Why it improves buy/sell judgment | Complexity | Dependencies |
|---|---------|-----------------------------------|------------|--------------|
| 1 | **RSI Indicator Overlay** | RSI is the most-watched oscillator; overbought (>70) / oversold (<30) flags are universally recognized entry/exit signals | S | `technicalindicators` npm package, fetch 14-day historical closes from CoinGecko `/market_chart?days=14` |
| 2 | **Volume Spike Detection** | Sudden volume >2x 20-day average often precedes directional moves — lets users spot accumulation/distribution before price confirms | M | Compute 20-day avg volume from historical daily data; auto-detect spikes on poll; flag with icon/badge |
| 3 | **EMA Cross Signals (50/200)** | Golden cross / death cross is the most-followed trend-reversal signal; gives macro trend context at a glance | M | Compute EMA-50 and EMA-200 from historical closes; show crossover status as a badge on each coin card/list row |
| 4 | **Composite "Market Signal" Badge** | Single scannable rating ("Strong Buy / Buy / Neutral / Sell / Strong Sell") lets users triage 100 coins in seconds without reading every number | M | Blend RSI + EMA trend + 24h momentum + volume spike into weighted score; explain formula via tooltip |
| 5 | **Volatility Badge (ATR-based)** | High ATR = higher risk/reward; surfaces whether a coin is in a consolidation or explosive phase — critical for position sizing decisions | S | Compute ATR from 14-day high/low/close; bucket into Low/Medium/High |

### Phase 2 (3-4 weeks total) — Discovery & Context

| # | Feature | Why it improves buy/sell judgment | Complexity | Dependencies |
|---|---------|-----------------------------------|------------|--------------|
| 6 | **Signal-Based Screener** | Extends existing "Top Gainers/Losers" to filter by signal type (e.g., "all coins with RSI oversold + volume spike") — lets users find setups matching their strategy | L | Add signal filters to existing filter panel; compute signals server-side or cache in localStorage |
| 7 | **Relative Strength vs. BTC** | Coins outperforming BTC on a ratio chart often lead the next leg up; underperformers may lag or be in distribution — context beats absolute price action | M | Fetch BTC price history + coin history; compute ratio + regression; show as mini sparkline or % vs BTC |
| 8 | **Bollinger Band Position** | Price near upper band = extended/overbought; near lower band = oversold/contrarian entry — visual, intuitive | S | Compute 20-day SMA + 2 std dev bands; show % distance from bands as a small bar or label |

### Phase 3 (4-6 weeks total) — Real-time & Depth

| # | Feature | Why it improves buy/sell judgment | Complexity | Dependencies |
|---|---------|-----------------------------------|------------|--------------|
| 9 | **WebSocket Live Price Feed** | Trading decisions are time-sensitive; 60-second polling latency means missed entries/exits during fast moves | L | CoinGecko doesn't offer WS on free tier; alternative: Binance/OKX public WS for specific pairs; or reduce poll to 15s with smart caching |
| 10 | **Threshold-Based Alerts** | Users can't stare at screens 24/7; alerts mean they don't miss signal flips or volume events that happen while they're away | L | Session-based alerts (no accounts); store in localStorage; poll every 30s; in-app toast + optional browser notification |
| 11 | **"New Listings" Watchlist** | Newly listed coins often have the highest upside (and risk); surfacing them early with initial signal data gives traders a first-mover edge | S | CoinGecko returns `atl_date` / `genesis_date`; flag coins listed < 30 days; show basic signals from limited history |

### Deferred / Lower Priority

| Feature | Reason for deferral |
|---------|---------------------|
| MACD | Requires more historical data (50+ days); same compute cost as EMA cross but less visual scannability for non-chartists |
| Full backtesting ("this RSI preceded a bounce X% of the time") | Requires ≥2 years of OHLCV daily data per coin; CoinGecko free tier doesn't provide this granularity; would need paid API or CSV imports |
| Social sentiment scoring | No reliable free API with consistent sentiment labels; Reddit/Twitter APIs are rate-limited or paid |
| Correlation matrix | Interesting but overkill for scanning workflow; best as a premium research view, not a dashboard |
| Sector heatmaps | Requires tagging all coins by sector (DeFi, L1, etc.); CoinGecko has `categories` but they're noisy; manual curation needed |

---

## Recommended Phased Roadmap

### Phase 1 (Weeks 1-2): Scannable Signal Layer
**Goal**: Make the dashboard a "signal scanner" rather than just a price table.

1. Add Volume Spike Detection badge to each coin card/list row (appears when volume >2x 20d avg)
2. Add EMA-50/200 crossover badge ("Golden Cross" / "Death Cross" / "No Signal")
3. Add Composite Signal badge (Strong Buy / Buy / Neutral / Sell / Strong Sell) — blend state
4. Add Volatility badge (Low / Medium / High) based on ATR
5. Tooltip on each badge explaining calculation methodology

### Phase 2 (Weeks 3-5): Discovery & Filtering
**Goal**: Let users find coins matching specific setups.

6. Rebuild the filter panel to include signal type, volatility, volume spike toggles
7. Add "Relative Strength vs BTC" mini-sparkline on coin cards
8. Add Bollinger Band position indicator (% distance)

### Phase 3 (Weeks 6-9): Real-time & Alerting
**Goal**: Reduce latency and surface events proactively.

9. Reduce polling to 15s and add ETag/Conditional-Request caching
10. Build session-based alert system (localStorage-backed)
11. Add Browser Notifications API integration (opt-in)

---

## Legal / Compliance Flags

### Disclaimer Requirement
Any signal/indicator presented as a "buy" or "sell" suggestion — even with explicit labels like "Strong Buy" — can be construed as investment advice in some jurisdictions (SEC, FCA, ASIC).

**Required disclaimer language** (display on first load + signals page):
> "All signals, scores, and indicators on this dashboard are generated algorithmically for **informational and educational purposes only**. They do not constitute financial advice, a solicitation to buy or sell, or a recommendation of any security. Cryptocurrency investments are volatile and high-risk. Always conduct your own research and consult a licensed financial advisor before making investment decisions."

### Specific concerns by feature:

| Feature | Risk | Mitigation |
|---------|------|------------|
| Composite "Buy/Sell" badge | High — looks like a recommendation | Always pair with disclaimer; label as "Momentum Score" not "Buy Rating"; show calculation steps in tooltip |
| RSI / MACD / Bollinger Bands | Low — standard TA tools | Well-known indicators; lower risk if presented as educational |
| Volume spike alert | Low — factual event | Pure data observation, not a judgment |
| Relative strength vs BTC | Low — comparative metric | Present as ratio, not as recommendation |
| Backtesting context ("RSI preceded bounce X%") | Medium — implies predictive power | Must include disclaimer: "Past performance does not guarantee future results" |
| New listings | Low — factual | Include risk warning about low liquidity / scam risk |

### Compliance Touchpoints
1. **Onboarding / Settings**: Clear acceptance of disclaimer on first visit
2. **Every signals card**: Small "ℹ️" icon linking to methodology + disclaimer
3. **Footer**: Permanent disclaimer text
4. **Alert emails (if added later)**: Must include disclaimer in every message

---

## Technical Notes

### Indicator Computation Strategy
- CoinGecko `/market_chart?days=30` returns ~720 data points (30 days × hourly)
- Sufficient for RSI(14), EMA(50), ATR(14), Bollinger(20)
- Pre-compute indicators lazily (Stale-While-Revalidate pattern) and cache in `localStorage` keyed by coin ID + day range
- Hash the raw price array + indicator params to detect cache invalidation

### Rate-Limit Respect
- Batch indicator requests: one call per coin for 30d history, not per indicator
- Parallel limit: 3 concurrent requests max with `p-limit` or simple semaphore
- Exponential backoff on 429s (already implemented in `apiHelpers.js`)
- Stale cache for 5 minutes to absorb refetch storms

### Dependency Additions (Phase 1)
```json
{
  "technicalindicators": "^3.1.0",
  "p-limit": "^5.0.0"
}
```

### New File Structure
```
src/
  utils/
    indicators.js      # RSI, EMA, ATR, Bollinger computations
    signalScore.js     # Composite signal scoring logic + explanation strings
  hooks/
    useTechnicalIndicators.js  # Memoized indicator fetching + caching
  components/
    SignalBadge/       # Reusable badge for all signal types
    IndicatorTooltip/  # Unified tooltip explaining methodology
    BollingerMeter/    # Mini bar showing BB position
    VolumeAlert/       # Spike detection toast/notification
```

---

## Summary: What This Transforms

| From | To |
|------|-----|
| Price table with sorting | **Signal-first scanner** — coins are ranked by actionable composite scores, not just market cap |
| Passive data display | **Active research tool** — traders filter by setup (oversold RSI + volume spike + golden cross) |
| 60s polling with static snapshot | **15s polling with live spike alerts** |
| "Here's a price" | **"Here's why this coin is interesting right now"** — with transparent methodology |