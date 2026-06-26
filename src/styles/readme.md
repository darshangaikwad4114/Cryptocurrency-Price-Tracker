# UI/UX Redesign — Audit & Implementation Plan

## Audit of Current Layout Issues

### 1. Spacing Inconsistencies (Critical)
- **App.css (3110 lines)** has classes defined 3× over. e.g. `.search-input` defined at lines 511, 1018, 1614, 2189. Multiple conflicting versions co-exist.
- Mix of `px`, `rem`, `em` values with no base scale: `gap: 1.5rem`, `gap: 10px`, `gap: 12px`, `gap: 16px` all used interchangeably.
- `padding: 1rem` vs `padding: 16px` vs `padding: 0.75rem 1rem` — ad-hoc everywhere.

### 2. Alignment Problems
- **ListHeader grid** (in App.css line 1963): `grid-template-columns: 0.5fr 3fr 1.5fr 1fr 2fr 2fr`
- **Coin list item grid** (in Coin.css line 313): Same template — **but Coin.css doesn't import App.css, so they can drift**.
- Market trends table: `th` and `td` use `padding: 0.75rem 1.25rem` but some rows are missing the `th` scope.

### 3. Visual Hierarchy Weak
- Grid card: price, 24h change, market cap all equally weighted with same font size (1rem).
- Most decision-relevant data (price + % change) should be larger, market cap/volume smaller.
- No volume spike indicator or signal badge in current grid view.

### 4. Responsive Gaps
- Table columns hide at breakpoints but no horizontal scroll option.
- Grid view collapses to 1 column too early (below 480px).

### 5. Color Signal Inconsistency
- Positive changes use `var(--accent-color)` in Coin.css (teal/cyan) BUT `var(--success-color)` in App.css (green).
- Light theme redefines accent from teal to blue — breaks the teal=positive convention.

## Proposed Spacing/Typography Scale
**File: `src/styles/design-tokens.css`**
- 4px base spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
- Semantic color tokens (bullish/bearish, not accent/success)
- Monospace font token for tabular price alignment
- Border, shadow, radius tokens
- Light theme overrides

## Implementation Order
1. ✅ Create design tokens file
2. Consolidate App.css (remove duplicates, apply tokens)
3. Fix alignment between ListHeader + Coin list items
4. Improve grid card visual hierarchy
5. Standardize signal colors across all components
6. Add tabular-nums + monospace for prices
7. Responsive layout improvements
8. Before/after notes