import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import Icon from '../components/ui/Icon';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');

  return (
    <div className="page page--not-found">
      <PageHeader
        eyebrow="404"
        title="This page does not exist"
        description="The link may be outdated, or the page may have moved. Your saved watchlist and portfolio are unaffected."
        actions={
          <Link to="/" className="button button--primary">
            Back to dashboard <Icon name="arrow-right" size={16} />
          </Link>
        }
      />
      <nav className="not-found-links" aria-label="Suggested pages">
        <Link to="/markets" className="button button--secondary">
          Markets
        </Link>
        <Link to="/news" className="button button--secondary">
          News
        </Link>
        <Link to="/portfolio" className="button button--secondary">
          Portfolio
        </Link>
        <Link to="/watchlist" className="button button--secondary">
          Watchlist
        </Link>
      </nav>
    </div>
  );
}
