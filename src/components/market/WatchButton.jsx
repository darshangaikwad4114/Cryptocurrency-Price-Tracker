import { useWatchlist } from '../../features/watchlist/watchlistContext';
import Icon from '../ui/Icon';

export default function WatchButton({ coinId, name, size = 'md' }) {
  const { isWatched, toggle } = useWatchlist();
  const watched = isWatched(coinId);

  return (
    <button
      type="button"
      className={`watch-button watch-button--${size}${watched ? ' is-watched' : ''}`}
      aria-pressed={watched}
      aria-label={watched ? `Remove ${name} from watchlist` : `Add ${name} to watchlist`}
      title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
      onClick={(event) => {
        event.stopPropagation();
        toggle(coinId);
      }}
    >
      <Icon name={watched ? 'star-filled' : 'star'} size={size === 'sm' ? 15 : 17} />
    </button>
  );
}
