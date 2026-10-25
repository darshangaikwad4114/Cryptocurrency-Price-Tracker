import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import Skeleton from '../ui/Skeleton';
import StatusPanel from '../ui/StatusPanel';
import { useNews } from '../../api/hooks';
import { formatRelativeTime } from '../../lib/format';

export default function NewsPreview() {
  const { articles, query } = useNews(3);
  const unavailable = query.error?.code === 'NEWS_NOT_CONFIGURED';

  return (
    <section className="panel news-preview" aria-labelledby="news-preview-heading">
      <div className="panel__header">
        <div>
          <h2 id="news-preview-heading">Latest news</h2>
          <p>Headlines from the crypto market.</p>
        </div>
        <Link to="/news" className="text-link">
          All news <Icon name="chevron-right" size={14} />
        </Link>
      </div>

      {query.isPending ? (
        <div className="news-preview__skeletons" aria-hidden="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index}>
              <Skeleton className="skeleton--text" style={{ width: '88%' }} />
              <Skeleton className="skeleton--text-sm" style={{ width: '40%' }} />
            </div>
          ))}
        </div>
      ) : query.isError ? (
        unavailable ? (
          <p className="panel__note">
            News is not configured for this deployment. Add a CryptoCompare API key to enable it.
          </p>
        ) : (
          <StatusPanel
            compact
            tone="error"
            icon="alert"
            title="News unavailable"
            message="The news feed could not be loaded."
            actions={
              <button
                type="button"
                className="button button--small button--secondary"
                onClick={() => query.refetch()}
              >
                Retry
              </button>
            }
          />
        )
      ) : articles.length === 0 ? (
        <p className="panel__note">No recent articles.</p>
      ) : (
        <ul className="news-preview__list">
          {articles.map((article) => (
            <li key={article.id}>
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                <span className="news-preview__title">{article.title}</span>
                <span className="news-preview__meta">
                  {article.source}
                  {article.publishedAt && ` · ${formatRelativeTime(article.publishedAt)}`}
                  <Icon name="external" size={12} />
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
