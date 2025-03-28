import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import './NewsFeed.css';
import { withRetry } from '../../utils/apiHelpers';

const NewsFeed = ({ limit = 9 }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  
  const categories = useMemo(() => [
    { id: 'all', label: 'All' },
    { id: 'BTC', label: 'Bitcoin' },
    { id: 'ETH', label: 'Ethereum' },
    { id: 'Altcoins', label: 'Altcoins' },
    { id: 'Trading', label: 'Trading' },
    { id: 'Business', label: 'Business' }
  ], []);
  
  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Set cache key for storing news data
    const cacheKey = 'crypto_news_cache';
    const cachedData = sessionStorage.getItem(cacheKey);
    const cachedTimestamp = sessionStorage.getItem(`${cacheKey}_timestamp`);
    
    // Check if we have valid cached data (less than 15 min old)
    if (cachedData && cachedTimestamp) {
      const isStillValid = (Date.now() - parseInt(cachedTimestamp, 10)) < 15 * 60 * 1000;
      if (isStillValid) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setNews(parsedData);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to parse cached data:", e);
          // Continue to fetch fresh data
        }
      }
    }
    
    try {
      // Add AbortController for cleanup
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // Increased timeout
      
      // Use environment variable for API key
      const apiKey = import.meta.env.VITE_CRYPTOCOMPARE_API_KEY;
      
      // Use our retry utility
      const response = await withRetry(
        () => axios.get(
          'https://min-api.cryptocompare.com/data/v2/news/?lang=EN',
          { 
            timeout: 15000,
            signal: controller.signal,
            params: {
              api_key: apiKey,
              categories: 'BTC,ETH,Cryptocurrency,Trading,Business'
            }
          }
        ),
        { maxRetries: 2, retryDelay: 2000 }
      );
      
      clearTimeout(timeoutId);
      
      if (response.data && response.data.Data) {
        // Store news in state
        const newsData = response.data.Data;
        setNews(newsData);
        
        // Cache the news data
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(newsData));
          sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
        } catch (e) {
          console.warn("Failed to cache news data:", e);
          // Non-fatal error, continue execution
        }
      } else {
        setError('Invalid news data format received');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      
      let errorMessage;
      if (err.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Connection timed out. The news API may be experiencing high traffic.';
      } else if (err.response) {
        errorMessage = `API error: ${err.response.status} - ${err.response.statusText}`;
      } else {
        errorMessage = `Failed to fetch news: ${err.message || 'Unknown error'}`;
      }
      
      setError(errorMessage);
      
      // Try to use stale cached data if available
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          setNews(parsedData);
          console.log("Using stale cached news data due to fetch failure");
        } catch (e) {
          console.error("Failed to parse stale cached data:", e);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchNews();
    
    // Refresh news every 15 minutes
    const interval = setInterval(fetchNews, 15 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [fetchNews]);
  
  // Format relative time (e.g., "2 hours ago")
  const getRelativeTime = useCallback((timestamp) => {
    const now = new Date();
    const publishedDate = new Date(timestamp * 1000); // Convert from Unix timestamp
    const diffInSeconds = Math.floor((now - publishedDate) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) { // Less than 7 days
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      // Format as date for older articles
      return publishedDate.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  }, []);
  
  // Filter news by category
  const filteredNews = useMemo(() => {
    if (activeCategory === 'all') {
      return news.slice(0, limit);
    }
    
    return news
      .filter(article => {
        const articleCategories = article.categories.split('|');
        return articleCategories.includes(activeCategory);
      })
      .slice(0, limit);
  }, [news, activeCategory, limit]);
  
  return (
    <section className="news-feed-container">
      <div className="news-header">
        <h2>Crypto News</h2>
        <a 
          href="https://www.cryptocompare.com/news/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="view-all-news"
        >
          View All News
        </a>
      </div>
      
      <div className="news-categories">
        {categories.map(category => (
          <button
            key={category.id}
            className={`news-category-btn ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
            aria-pressed={activeCategory === category.id}
          >
            {category.label}
          </button>
        ))}
      </div>
      
      {loading ? (
        <div className="news-loading" role="status" aria-live="polite">
          <div className="news-loading-animation"></div>
          <p>Loading latest crypto news...</p>
        </div>
      ) : error ? (
        <div className="news-error" role="alert">
          <p>{error}</p>
          <button onClick={fetchNews} aria-label="Retry fetching news">Retry</button>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="no-news-message">
          <p>No news articles found for this category.</p>
          <button onClick={() => setActiveCategory('all')} className="reset-category-btn">
            Show all news
          </button>
        </div>
      ) : (
        <div className="news-grid">
          {filteredNews.map((article) => (
            <article className="news-card" key={article.id}>
              <div className="news-card-image">
                <img 
                  src={article.imageurl} 
                  alt="" // Decorative image
                  loading="lazy" 
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x160?text=No+Image+Available';
                    e.target.alt = 'No image available';
                  }}
                />
                {article.categories && (
                  <span className="news-category-tag">
                    {article.categories.split('|')[0]}
                  </span>
                )}
              </div>
              <div className="news-card-content">
                <h3 className="news-title">
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label={article.title}
                  >
                    {article.title}
                  </a>
                </h3>
                <p className="news-excerpt">{article.body.substring(0, 100)}...</p>
                <div className="news-meta">
                  <span className="news-source">{article.source}</span>
                  <time className="news-time" dateTime={new Date(article.published_on * 1000).toISOString()}>
                    {getRelativeTime(article.published_on)}
                  </time>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

NewsFeed.propTypes = {
  limit: PropTypes.number
};

export default NewsFeed;
