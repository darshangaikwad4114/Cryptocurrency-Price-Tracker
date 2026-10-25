import { useMemo, useState } from 'react';
import Icon from '../ui/Icon';
import Skeleton from '../ui/Skeleton';
import StatusPanel from '../ui/StatusPanel';
import DataFreshness from '../ui/DataFreshness';
import { useNews } from '../../hooks/useMarketData';
import { formatRelativeTime } from '../../utils/format';

const PAGE_SIZE = 9;

function ArticleImage({ src }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = failedSrc === src;

  if (!src || failed) {
    return (
      <div className="news-card__image news-card__image--fallback" aria-hidden="true">
        <Icon name="globe" size={30} />
      </div>
    );
  }

  return (
    <div className="news-card__image">
      <img
        src={src}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src)}
      />
    </div>
  );
}

export default function NewsFeed({ limit = 24 }) {
  const { articles, query, meta } = useNews(limit);
  const [category, setCategory] = useState('all');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const categories = useMemo(() => {
    const counts = new Map();
    for (const article of articles) {
      for (const tag of article.categories ?? []) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [articles]);

  const filtered = useMemo(
    () =>
      category === 'all'
        ? articles
        : articles.filter((article) => article.categories?.includes(category)),
    [articles, category],
  );

  const unavailable = query.error?.code === 'NEWS_NOT_CONFIGURED';

  const selectCategory = (nextCategory) => {
    setCategory(nextCategory);
    setVisible(PAGE_SIZE);
  };

  if (query.isPending) {
    return (
      <div className="news-grid" role="status" aria-label="Loading news">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="news-card news-card--skeleton" key={index} aria-hidden="true">
            <Skeleton className="skeleton--news-image" />
            <div className="news-card__body">
              <Skeleton className="skeleton--text-sm" style={{ width: '35%' }} />
              <Skeleton className="skeleton--text" style={{ width: '92%' }} />
              <Skeleton className="skeleton--text" style={{ width: '70%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <StatusPanel
        tone={unavailable ? 'info' : 'error'}
        icon={unavailable ? 'info' : 'alert'}
        title={unavailable ? 'News is not enabled' : 'News feed unavailable'}
        message={
          unavailable
            ? 'This deployment does not have a CryptoCompare API key configured. Market data still works normally.'
            : 'The latest crypto headlines could not be loaded. Please try again.'
        }
        actions={
          !unavailable && (
            <button
              type="button"
              className="button button--secondary"
              onClick={() => query.refetch()}
            >
              Retry
            </button>
          )
        }
      />
    );
  }

  return (
    <section className="news-feed" aria-label="Crypto news">
      <div className="news-feed__toolbar">
        <div className="chip-row" role="group" aria-label="Filter news by category">
          <button
            type="button"
            className={`chip${category === 'all' ? ' is-active' : ''}`}
            aria-pressed={category === 'all'}
            onClick={() => selectCategory('all')}
          >
            All
          </button>
          {categories.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`chip${category === tag ? ' is-active' : ''}`}
              aria-pressed={category === tag}
              onClick={() => selectCategory(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="news-feed__freshness">
          <DataFreshness
            meta={meta}
            updatedAt={query.dataUpdatedAt}
            isFetching={query.isFetching}
          />
          <button
            type="button"
            className="icon-button"
            onClick={() => query.refetch()}
            aria-label="Refresh news"
            title="Refresh news"
            disabled={query.isFetching}
          >
            <Icon name="refresh" size={16} />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <StatusPanel
          tone="info"
          icon="search"
          title="No matching headlines"
          message={`No recent articles in the ${category} category.`}
          actions={
            <button
              type="button"
              className="button button--secondary"
              onClick={() => selectCategory('all')}
            >
              Show all news
            </button>
          }
        />
      ) : (
        <>
          <div className="news-grid">
            {filtered.slice(0, visible).map((article) => (
              <article className="news-card" key={article.id}>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-card__media-link"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <ArticleImage src={article.image} />
                </a>
                <div className="news-card__body">
                  <div className="news-card__topline">
                    {article.categories?.[0] && (
                      <span className="pill pill--accent">{article.categories[0]}</span>
                    )}
                    {article.publishedAt && (
                      <time dateTime={article.publishedAt}>
                        {formatRelativeTime(article.publishedAt)}
                      </time>
                    )}
                  </div>
                  <h2>
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                  </h2>
                  {article.excerpt && <p>{article.excerpt}</p>}
                  <div className="news-card__meta">
                    <span>{article.source}</span>
                    <span className="news-card__link">
                      Read article <Icon name="external" size={13} />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {visible < filtered.length && (
            <div className="load-more">
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setVisible((current) => current + PAGE_SIZE)}
              >
                Load more headlines
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
