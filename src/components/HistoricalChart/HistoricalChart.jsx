import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import './HistoricalChart.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
  zoomPlugin
);

const timeframes = [
  { label: '24h', days: 1 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
];

const HistoricalChart = ({ coinId, coinName }) => {
  const [historicalData, setHistoricalData] = useState([]);
  const [timeframe, setTimeframe] = useState(timeframes[2]); // Default to 30 days
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const [dataCache, setDataCache] = useState({});
  const [priceInfo, setPriceInfo] = useState({ min: 0, max: 0, current: 0, change: 0 });
  const [screenSize, setScreenSize] = useState(window.innerWidth);

  // Calculate price statistics from the data - Move this up before useEffect
  const calculatePriceInfo = useCallback((data) => {
    if (!data || data.length === 0) return;
    
    const prices = data.map(item => item[1]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const current = prices[prices.length - 1];
    const first = prices[0];
    const change = ((current - first) / first) * 100;
    
    setPriceInfo({
      min,
      max,
      current,
      change
    });
  }, []);

  // Track window resize for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setScreenSize(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!coinId) return;
      
      // Check if we already have this data cached
      const cacheKey = `${coinId}-${timeframe.days}`;
      if (dataCache[cacheKey]) {
        setHistoricalData(dataCache[cacheKey]);
        calculatePriceInfo(dataCache[cacheKey]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
          {
            params: {
              vs_currency: 'usd',
              days: timeframe.days,
            },
            timeout: 10000,
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        if (response.data && response.data.prices) {
          let priceData = response.data.prices;
          
          // Optimize data points based on screen size and timeframe
          const maxPoints = screenSize < 768 ? 100 : 200;
          if (priceData.length > maxPoints) {
            const step = Math.ceil(priceData.length / maxPoints);
            priceData = priceData.filter((_, index) => index % step === 0);
          }
          
          setHistoricalData(priceData);
          calculatePriceInfo(priceData);
          
          // Cache the data
          setDataCache(prev => ({
            ...prev,
            [cacheKey]: priceData
          }));
        } else {
          setError('Invalid data format received from API');
        }
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError(
          err.name === 'AbortError' 
            ? 'Request timed out. Please try again.'
            : `Failed to fetch historical data: ${err.message || 'Unknown error'}`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [coinId, timeframe.days, dataCache, screenSize, calculatePriceInfo]);

  // Format price with appropriate precision
  const formatPrice = useCallback((price) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  }, []);

  // Create gradient for chart fill
  const createGradient = useCallback((ctx, chartArea, isPriceUp) => {
    if (!ctx || !chartArea) {
      return {
        backgroundColor: 'rgba(100, 255, 218, 0.1)',
        borderColor: 'rgba(100, 255, 218, 1)',
      };
    }

    const colorStart = isPriceUp ? 'rgba(100, 255, 218, 0.8)' : 'rgba(255, 99, 132, 0.8)';
    const colorEnd = isPriceUp ? 'rgba(100, 255, 218, 0.1)' : 'rgba(255, 99, 132, 0.1)';
    
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    
    return {
      backgroundColor: gradient,
      borderColor: isPriceUp ? 'rgba(100, 255, 218, 1)' : 'rgba(255, 99, 132, 1)',
    };
  }, []);

  // Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => {
    const isPriceUp = priceInfo.change >= 0;
    
    return {
      labels: historicalData.map(data => new Date(data[0])),
      datasets: [
        {
          label: 'Price (USD)',
          data: historicalData.map(data => data[1]),
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: isPriceUp ? 'rgba(100, 255, 218, 1)' : 'rgba(255, 99, 132, 1)',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          fill: true,
          tension: 0.4,
          // The actual colors will be set in the plugin below
        },
      ],
    };
  }, [historicalData, priceInfo.change]);

  // Mobile-friendly chart options
  const isMobile = screenSize < 768;
  const isTablet = screenSize >= 768 && screenSize < 1024;

  // Optimize chart options with useMemo
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    onResize: (chart, size) => {
      // Dynamically adjust point radius based on chart width
      if (size.width < 400) {
        chart.data.datasets[0].pointRadius = 0;
        chart.data.datasets[0].pointHoverRadius = 4;
      } else {
        chart.data.datasets[0].pointRadius = 0;
        chart.data.datasets[0].pointHoverRadius = 6;
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeframe.days <= 1 ? 'hour' : 
                timeframe.days <= 7 ? 'day' : 
                timeframe.days <= 90 ? 'week' : 'month',
          displayFormats: {
            hour: isMobile ? 'HH' : 'HH:mm',
            day: isMobile ? 'd' : 'MMM d',
            week: isMobile ? 'MMM' : 'MMM d',
            month: 'MMM'
          }
        },
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxRotation: 0,
          font: {
            size: isMobile ? 8 : isTablet ? 10 : 11,
          },
          maxTicksLimit: isMobile ? 4 : isTablet ? 6 : 8,
        },
        border: {
          display: false,
        }
      },
      y: {
        position: 'right',
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
          borderDash: [5, 5],
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          padding: isMobile ? 5 : 10,
          font: {
            size: isMobile ? 9 : isTablet ? 10 : 11,
          },
          callback: function(value) {
            if (value >= 1000) {
              return '$' + (value / 1000).toFixed(1) + 'k';
            } else if (value >= 1) {
              return '$' + value.toFixed(value >= 100 ? 0 : 1);
            } else {
              return '$' + value.toFixed(value >= 0.1 ? 2 : value >= 0.01 ? 3 : 4);
            }
          },
          maxTicksLimit: isMobile ? 4 : 6,
        },
        border: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: priceInfo.change >= 0 ? 'rgba(100, 255, 218, 1)' : 'rgba(255, 99, 132, 1)',
        bodyColor: '#fff',
        borderColor: priceInfo.change >= 0 ? 'rgba(100, 255, 218, 0.3)' : 'rgba(255, 99, 132, 0.3)',
        borderWidth: 1,
        padding: isMobile ? 6 : 10,
        cornerRadius: 6,
        displayColors: false,
        bodyFont: {
          size: isMobile ? 12 : 14,
        },
        titleFont: {
          size: isMobile ? 10 : 12,
          weight: '600'
        },
        callbacks: {
          title: function(tooltipItems) {
            const date = new Date(tooltipItems[0].parsed.x);
            return timeframe.days <= 1 
              ? date.toLocaleString([], { hour: '2-digit', minute: '2-digit' }) 
              : date.toLocaleDateString([], { 
                  month: 'short', 
                  day: 'numeric',
                  year: timeframe.days > 30 ? 'numeric' : undefined
                });
          },
          label: function(context) {
            let value = context.parsed.y;
            return formatPrice(value);
          }
        }
      },
      zoom: {
        pan: {
          enabled: true, // Enable for both mobile and desktop
          mode: 'x',
          modifierKey: 'ctrl', // Require ctrl key on desktop
        },
        zoom: {
          wheel: {
            enabled: !isMobile,
          },
          pinch: {
            enabled: true, // Enable pinch zoom on mobile
          },
          mode: 'x',
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1000,
    },
    elements: {
      line: {
        borderCapStyle: 'round',
        borderJoinStyle: 'round',
      },
      point: {
        hitRadius: 8,
      }
    },
    layout: {
      padding: {
        top: 20,
        bottom: isMobile ? 0 : 10,
        left: isMobile ? 0 : 10,
        right: isMobile ? 0 : 10
      }
    },
  }), [timeframe.days, isMobile, isTablet, priceInfo.change, formatPrice]);
  
  // Cache-busting mechanism for stale data
  const refreshChart = useCallback(() => {
    setLoading(true);
    setDataCache(prev => {
      const newCache = {...prev};
      delete newCache[`${coinId}-${timeframe.days}`];
      return newCache;
    });
  }, [coinId, timeframe.days]);

  // Reset zoom function
  const resetZoom = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  }, []);

  return (
    <div className="historical-chart-container" data-theme={priceInfo.change >= 0 ? "positive" : "negative"}>
      <div className="chart-header">
        <div className="chart-title-section">
          <h3>Price History {coinName && <span>({coinName})</span>}</h3>
          <div className="price-stats">
            <div className={`current-price ${priceInfo.change >= 0 ? 'positive' : 'negative'}`}>
              {formatPrice(priceInfo.current)}
            </div>
            <div className={`price-change ${priceInfo.change >= 0 ? 'positive' : 'negative'}`}>
              {priceInfo.change >= 0 ? '+' : ''}{priceInfo.change.toFixed(2)}%
            </div>
          </div>
        </div>
        
        <div className="chart-controls">
          <div className="timeframe-selector">
            {timeframes.map((tf) => (
              <button
                key={tf.label}
                className={`timeframe-btn ${timeframe.days === tf.days ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}
                aria-pressed={timeframe.days === tf.days}
                aria-label={`${tf.label} timeframe`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          
          {!isMobile && (
            <button className="reset-zoom-btn" onClick={resetZoom} title="Reset zoom">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 3H3v18h18V3z"></path>
                <path d="M21 3v18H3"></path>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="chart-content">
        {loading ? (
          <div className="chart-loading">
            <div className="chart-loading-animation"></div>
            <p>Loading chart data...</p>
          </div>
        ) : error ? (
          <div className="chart-error">
            <p>{error}</p>
            <button onClick={refreshChart}>Retry</button>
          </div>
        ) : historicalData.length > 0 ? (
          <>
            <div className="chart-wrapper">
              <Line 
                data={chartData} 
                options={chartOptions}
                plugins={[
                  {
                    id: 'customCanvasBackgroundColor',
                    beforeDraw: (chart) => {
                      const {ctx, chartArea} = chart;
                      if (!chartArea) {
                        return;
                      }
                      
                      const gradientColors = createGradient(ctx, chartArea, priceInfo.change >= 0);
                      chart.data.datasets[0].backgroundColor = gradientColors.backgroundColor;
                      chart.data.datasets[0].borderColor = gradientColors.borderColor;
                    }
                  }
                ]}
                ref={chartRef}
              />
            </div>
            <div className="price-range-info">
              <div className="range-item">
                <span>Low:</span> {formatPrice(priceInfo.min)}
              </div>
              <div className="range-item">
                <span>High:</span> {formatPrice(priceInfo.max)}
              </div>
            </div>
            {!isMobile && (
              <div className="chart-instructions">
                <span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  Scroll to zoom, drag to pan
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="no-data-message">
            <p>No historical data available for this timeframe</p>
          </div>
        )}
      </div>
    </div>
  );
};

HistoricalChart.propTypes = {
  coinId: PropTypes.string.isRequired,
  coinName: PropTypes.string
};

export default HistoricalChart;
