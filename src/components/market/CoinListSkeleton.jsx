import Skeleton from '../ui/Skeleton';

export default function CoinListSkeleton({ view = 'table', count = 8 }) {
  if (view === 'grid') {
    return (
      <ul className="coin-grid" role="status" aria-label="Loading assets">
        {Array.from({ length: Math.min(count, 8) }, (_, index) => (
          <li key={index}>
            <div className="coin-card coin-card--skeleton" aria-hidden="true">
              <div className="coin-card__top">
                <Skeleton className="skeleton--text-sm" style={{ width: 32 }} />
                <Skeleton className="skeleton--icon-sm" />
              </div>
              <div className="coin-card__identity">
                <Skeleton className="skeleton--avatar" />
                <div>
                  <Skeleton className="skeleton--text" style={{ width: 90 }} />
                  <Skeleton className="skeleton--text-sm" style={{ width: 40 }} />
                </div>
              </div>
              <Skeleton className="skeleton--metric" />
              <div className="coin-card__stats">
                <Skeleton className="skeleton--text-sm" style={{ width: '60%' }} />
                <Skeleton className="skeleton--text-sm" style={{ width: '60%' }} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="table-skeleton" role="status" aria-label="Loading assets">
      {Array.from({ length: count }, (_, index) => (
        <div className="table-skeleton__row" key={index} aria-hidden="true">
          <Skeleton className="skeleton--text-sm" style={{ width: 18 }} />
          <Skeleton className="skeleton--avatar-sm" />
          <Skeleton className="skeleton--text" style={{ width: 120 }} />
          <Skeleton className="skeleton--text" style={{ width: 80 }} />
          <Skeleton className="skeleton--text-sm" style={{ width: 60 }} />
          <Skeleton className="skeleton--text" style={{ width: 90 }} />
        </div>
      ))}
    </div>
  );
}
