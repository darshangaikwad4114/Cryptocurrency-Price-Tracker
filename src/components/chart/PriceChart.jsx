import { useMemo, useRef, useState } from 'react';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line } from 'react-chartjs-2';
import Icon from '../ui/Icon';
import Skeleton from '../ui/Skeleton';
import StatusPanel from '../ui/StatusPanel';
import { useChart } from '../../hooks/useMarketData';
import { useTheme } from '../../features/theme/themeContext';
import {
  formatCompactCurrency,
  formatDateTime,
  formatPercent,
  formatPrice,
} from '../../utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Legend,
  Tooltip,
  zoomPlugin,
);

const RANGES = [
  { days: 1, label: '1D' },
  { days: 7, label: '1W' },
  { days: 30, label: '1M' },
  { days: 90, label: '3M' },
  { days: 365, label: '1Y' },
];

const PALETTE = {
  dark: {
    grid: 'rgba(230, 241, 255, 0.08)',
    text: '#8892b0',
    tooltip: '#1e3355',
    tooltipText: '#e6f1ff',
  },
  light: {
    grid: 'rgba(15, 23, 42, 0.08)',
    text: '#475569',
    tooltip: '#ffffff',
    tooltipText: '#0f172a',
  },
};

function toRgba(hex, alpha) {
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function axisLabel(date, days) {
  if (days <= 1) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (days >= 365) {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function PriceChart({ coinId, coinName }) {
  const [days, setDays] = useState(30);
  const [zoomedDays, setZoomedDays] = useState(null);
  const chartRef = useRef(null);
  const { theme } = useTheme();
  const { points, query } = useChart(coinId, days);
  const zoomed = zoomedDays === days;

  const summary = useMemo(() => {
    if (!points.length) return null;
    const prices = points.map(([, price]) => price);
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = first > 0 ? ((last - first) / first) * 100 : null;
    const low = Math.min(...prices);
    const high = Math.max(...prices);
    return { first, last, change, low, high };
  }, [points]);

  const chartData = useMemo(() => {
    if (!points.length) return null;
    const color = (summary?.change ?? 0) >= 0 ? '#4caf50' : '#f44336';
    return {
      labels: points.map(([timestamp]) => axisLabel(new Date(timestamp), days)),
      timestamps: points.map(([timestamp]) => timestamp),
      datasets: [
        {
          data: points.map(([, price]) => price),
          borderColor: color,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: color,
          pointHoverBorderColor: color,
          pointHitRadius: 12,
          tension: 0.25,
          fill: true,
          backgroundColor(context) {
            const { ctx, chartArea } = context.chart;
            if (!chartArea) return 'transparent';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, toRgba(color, 0.28));
            gradient.addColorStop(1, toRgba(color, 0));
            return gradient;
          },
        },
      ],
    };
  }, [points, days, summary]);

  const options = useMemo(() => {
    const palette = PALETTE[theme] ?? PALETTE.dark;
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: palette.tooltip,
          titleColor: palette.tooltipText,
          bodyColor: palette.tooltipText,
          borderColor: palette.grid,
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            title(items) {
              const index = items[0]?.dataIndex;
              const timestamp = chartData?.timestamps?.[index];
              return timestamp ? formatDateTime(timestamp) : '';
            },
            label(item) {
              return formatPrice(item.parsed.y);
            },
          },
        },
        zoom: {
          pan: { enabled: true, mode: 'x', modifierKey: 'shift' },
          zoom: {
            wheel: { enabled: true, speed: 0.08 },
            pinch: { enabled: true },
            mode: 'x',
          },
          limits: { x: { minRange: 5 } },
          onZoomComplete: () => setZoomedDays(days),
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: palette.text,
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 6,
            font: { size: 11 },
          },
        },
        y: {
          position: 'right',
          grid: { color: palette.grid },
          border: { display: false },
          ticks: {
            color: palette.text,
            maxTicksLimit: 6,
            font: { size: 11 },
            callback: (value) => formatCompactCurrency(value),
          },
        },
      },
    };
  }, [theme, chartData, days]);

  const resetZoom = () => {
    chartRef.current?.resetZoom();
    setZoomedDays(null);
  };

  return (
    <section className="panel price-chart" aria-labelledby="price-chart-heading">
      <div className="panel__header panel__header--wrap">
        <div>
          <h2 id="price-chart-heading">Price history</h2>
          <p>{coinName} priced in USD. Data from CoinGecko, sampled for a fast render.</p>
        </div>
        <div className="chart-controls">
          {zoomed && (
            <button type="button" className="text-button" onClick={resetZoom}>
              <Icon name="refresh" size={13} /> Reset zoom
            </button>
          )}
          <div className="segmented" role="group" aria-label="Chart timeframe">
            {RANGES.map((range) => (
              <button
                key={range.days}
                type="button"
                className={days === range.days ? 'is-active' : ''}
                aria-pressed={days === range.days}
                onClick={() => setDays(range.days)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {query.isPending ? (
        <div className="chart-skeleton" aria-hidden="true">
          <Skeleton className="skeleton--chart" />
        </div>
      ) : query.isError ? (
        <StatusPanel
          tone="error"
          icon="alert"
          title="Chart unavailable"
          message="Price history could not be loaded for this range."
          actions={
            <button
              type="button"
              className="button button--secondary"
              onClick={() => query.refetch()}
            >
              Retry
            </button>
          }
        />
      ) : !chartData || !summary ? (
        <p className="panel__note">No price history is available for this range.</p>
      ) : (
        <>
          <dl className="chart-summary">
            <div>
              <dt>Period change</dt>
              <dd className={summary.change >= 0 ? 'tone-positive' : 'tone-negative'}>
                {formatPercent(summary.change)}
              </dd>
            </div>
            <div>
              <dt>Period low</dt>
              <dd>{formatPrice(summary.low)}</dd>
            </div>
            <div>
              <dt>Period high</dt>
              <dd>{formatPrice(summary.high)}</dd>
            </div>
            <div>
              <dt>Latest</dt>
              <dd>{formatPrice(summary.last)}</dd>
            </div>
          </dl>

          <figure className="chart-figure">
            <div
              className="chart-canvas"
              role="img"
              aria-label={`${coinName} price chart for the selected range. ${formatPercent(
                summary.change,
              )} over the period, low ${formatPrice(summary.low)}, high ${formatPrice(
                summary.high,
              )}, latest ${formatPrice(summary.last)}.`}
            >
              <Line ref={chartRef} key={days} data={chartData} options={options} />
            </div>
            <figcaption className="chart-hint">
              Scroll to zoom, shift-drag to pan. Data is informational only.
            </figcaption>
          </figure>
        </>
      )}
    </section>
  );
}
