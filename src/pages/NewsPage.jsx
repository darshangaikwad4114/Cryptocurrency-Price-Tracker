import PageHeader from '../components/ui/PageHeader';
import Icon from '../components/ui/Icon';
import NewsFeed from '../components/news/NewsFeed';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NewsPage() {
  useDocumentTitle('News');

  return (
    <div className="page page--news">
      <PageHeader
        eyebrow="News"
        title="Headlines that move markets"
        description="Latest cryptocurrency coverage from CryptoCompare, refreshed every few minutes. Every headline links to the original publisher."
        actions={
          <a
            href="https://www.cryptocompare.com/news/"
            target="_blank"
            rel="noopener noreferrer"
            className="button button--secondary"
          >
            CryptoCompare news <Icon name="external" size={14} />
          </a>
        }
      />

      <NewsFeed limit={24} />

      <p className="page-note">
        <Icon name="info" size={14} /> Headlines are aggregated by CryptoCompare. Crypto Tracker
        does not edit article content and is not responsible for third-party reporting.
      </p>
    </div>
  );
}
