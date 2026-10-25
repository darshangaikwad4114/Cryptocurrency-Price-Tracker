import { useState } from 'react';

export default function CoinLogo({ src, name, symbol, size = 32, className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = failedSrc === src;

  const initials = (symbol || name || '?').slice(0, 3).toUpperCase();

  return (
    <span
      className={`coin-logo ${className}`.trim()}
      style={{ '--coin-logo-size': `${size}px` }}
      aria-hidden="true"
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span className="coin-logo__fallback">{initials}</span>
      )}
    </span>
  );
}
