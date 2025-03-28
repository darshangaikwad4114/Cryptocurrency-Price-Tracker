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
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
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
  TimeScale
);

const timeframes = [
  { label: '24h', days: 1 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
];

const HistoricalChart = ({ coinId }) => {
  const [historicalData, setHistoricalData] = useState([]);
  const [timeframe, setTimeframe] = useState(timeframes[2]); // Default to 30 days
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const [dataCache, setDataCache] = useState({});

  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!coinId) return;
      
      // Check if we already have this data cached
      const cacheKey = `${coinId}-${timeframe.days}`;
      if (dataCache[cacheKey]) {
        setHistoricalData(dataCache[cacheKey]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Use AbortController for request cancellation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
        
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
          // For performance, limit number of data points for longer timeframes
          let priceData = response.data.prices;
          if (timeframe.days > 30 && priceData.length > 200) {
            // Sample data for better performance on longer timeframes
            const step = Math.ceil(priceData.length / 200);
            priceData = priceData.filter((_, index) => index % step === 0);
          }
          
          setHistoricalData(priceData);
          
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
  }, [coinId, timeframe, dataCache]);

  // Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => ({
    labels: historicalData.map(data => new Date(data[0])),
    datasets: [
      {
        label: 'Price (USD)',
        data: historicalData.map(data => data[1]),
        borderColor: 'rgba(100, 255, 218, 1)',
        backgroundColor: 'rgba(100, 255, 218, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: 'rgba(100, 255, 218, 1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }), [historicalData]);

  // Optimize chart options with useMemo
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeframe.days <= 1 ? 'hour' : 
                 timeframe.days <= 7 ? 'day' : 
                 timeframe.days <= 90 ? 'week' : 'month',
          tooltipFormat: timeframe.days <= 1 ? 'HH:mm' : 'MMM d',
          displayFormats: {
            hour: 'HH:mm',
            day: 'MMM d',
            week: 'MMM d',
            month: 'MMM yyyy'
          }
        },
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          maxRotation: 0,
          autoSkipPadding: 15,
          font: {
            size: 10
          },
          maxTicksLimit: timeframe.days <= 1 ? 6 : 
                        timeframe.days <= 7 ? 7 : 
                        timeframe.days <= 30 ? 6 : 5,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          callback: function(value) {
            if (value >= 1000) {
              return '$' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            } else if (value >= 1) {
              return '$' + value.toFixed(2);
            } else {
              return '$' + value.toFixed(6);
            }
          },
          font: {
            size: 11
          }
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
        backgroundColor: 'rgba(13, 20, 33, 0.9)',
        titleColor: 'rgba(100, 255, 218, 1)',
        bodyColor: '#fff',
        borderColor: 'rgba(100, 255, 218, 0.2)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          title: function(tooltipItems) {
            const date = new Date(tooltipItems[0].parsed.x);
            return timeframe.days <= 1 
              ? date.toLocaleString([], { hour: '2-digit', minute: '2-digit' }) 
              : date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
          },
          label: function(context) {
            let value = context.parsed.y;
            if (value >= 1000) {
              return '$' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            } else if (value >= 1) {
              return '$' + value.toFixed(2);
            } else {
              return '$' + value.toFixed(6);
            }
          }
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
      }
    },
  }), [timeframe.days]);

  // Cache-busting mechanism for stale data
  const refreshChart = useCallback(() => {
    setLoading(true);
    // Clear cache for this specific item
    setDataCache(prev => {
      const newCache = {...prev};
      delete newCache[`${coinId}-${timeframe.days}`];
      return newCache;
    });
  }, [coinId, timeframe.days]);

  return (
    <div className="historical-chart-container">
      <div className="chart-header">
        <h3>Price History</h3>
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
      </div>
      
      <div className="chart-content">
        {loading ? (
          <div className="chart-loading" role="status" aria-live="polite">
            <div className="chart-loading-animation"></div>
            <p>Loading chart data...</p>
          </div>
        ) : error ? (
          <div className="chart-error" role="alert">
            <p>{error}</p>
            <button onClick={refreshChart}>Retry</button>
          </div>
        ) : historicalData.length > 0 ? (
          <div className="chart-wrapper" ref={chartRef}>
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="no-data-message" role="alert">
            <p>No historical data available for this timeframe</p>
          </div>
        )}
      </div>
    </div>
  );
};

HistoricalChart.propTypes = {
  coinId: PropTypes.string.isRequired
};

export default HistoricalChart;
