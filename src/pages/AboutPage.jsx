import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import Icon from '../components/ui/Icon';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const STACK = [
  ['React 18', 'Routed SPA with hooks, context, and Suspense.'],
  ['TanStack Query', 'Cache-aware data fetching, retries, and background refresh.'],
  ['Vite', 'Build tooling with code splitting for the chart bundle.'],
  ['Serverless API', 'Vercel or Netlify functions proxy upstream data and keep keys server-side.'],
  ['CoinGecko', 'Market prices, coin metadata, categories, exchanges, and trending assets.'],
  ['CryptoCompare', 'News headlines, proxied without exposing the API key to browsers.'],
  ['alternative.me', 'Fear & Greed sentiment index.'],
];

export default function AboutPage() {
  useDocumentTitle('About');

  return (
    <div className="page page--about">
      <PageHeader
        eyebrow="About"
        title="Market data without the noise"
        description="Crypto Tracker is a focused, private dashboard for following the cryptocurrency market. There are no accounts, no tracking pixels, and no server-side copies of your watchlist or portfolio."
      />

      <div className="about-grid">
        <section className="panel" aria-labelledby="how-it-works-heading">
          <div className="panel__header">
            <div>
              <h2 id="how-it-works-heading">How it works</h2>
              <p>From upstream APIs to your screen.</p>
            </div>
          </div>
          <ol className="steps">
            <li>
              <span className="steps__number">1</span>
              <div>
                <h3>Serverless proxy</h3>
                <p>
                  The browser calls <code>/api/market</code> and <code>/api/news</code> on the same
                  origin. The function validates parameters, fetches only allow-listed upstream
                  resources, normalizes the payload, and returns compact JSON.
                </p>
              </div>
            </li>
            <li>
              <span className="steps__number">2</span>
              <div>
                <h3>Shared cache and limits</h3>
                <p>
                  Responses are cached in memory with endpoint-specific TTLs, stale fallback, and
                  per-IP rate limiting. Upstream API keys stay in server environment variables.
                </p>
              </div>
            </li>
            <li>
              <span className="steps__number">3</span>
              <div>
                <h3>Local-first workspace</h3>
                <p>
                  Watchlist, portfolio, alerts, theme, and view preferences are stored in your
                  browser&apos;s local storage. Clearing site data removes them permanently.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section className="panel" aria-labelledby="stack-heading">
          <div className="panel__header">
            <div>
              <h2 id="stack-heading">Technology</h2>
              <p>What powers the dashboard.</p>
            </div>
          </div>
          <dl className="stack-list">
            {STACK.map(([name, description]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="panel" aria-labelledby="limits-heading">
          <div className="panel__header">
            <div>
              <h2 id="limits-heading">Limits and disclaimers</h2>
              <p>What this tool does and does not do.</p>
            </div>
          </div>
          <ul className="check-list">
            <li>Market coverage is the top 100 assets by market cap, not every listed token.</li>
            <li>Upstream data can be delayed or briefly unavailable; cached values are labeled.</li>
            <li>Price alerts only run while a Crypto Tracker tab is open and online.</li>
            <li>Portfolio calculations do not include fees, taxes, staking rewards, or transfers.</li>
            <li>Nothing here is financial advice. Verify prices on an exchange before trading.</li>
            <li>
              Coin logos and metadata belong to their respective owners and are displayed for
              identification only.
            </li>
          </ul>
        </section>

        <section className="panel" aria-labelledby="privacy-heading">
          <div className="panel__header">
            <div>
              <h2 id="privacy-heading">Privacy</h2>
              <p>No account. No analytics. No cross-site tracking.</p>
            </div>
          </div>
          <p>
            There is no authentication or database in this deployment. Your watchlist, portfolio,
            and alerts never leave the browser. The API proxy receives standard request metadata
            such as IP address for rate limiting but does not log it. In-memory caches are cleared
            whenever the serverless function cold-starts.
          </p>
          <div className="button-row">
            <Link to="/markets" className="button button--primary">
              Explore markets <Icon name="arrow-right" size={16} />
            </Link>
            <Link to="/news" className="button button--secondary">
              Read the news
            </Link>
          </div>
        </section>
      </div>

      <section className="panel about-author" aria-labelledby="author-heading">
        <div className="panel__header">
          <div>
            <h2 id="author-heading">Built by Darshan Gaikwad</h2>
            <p>Full-stack developer · Version 3.0.0</p>
          </div>
        </div>
        <p>
          This project started as a React learning exercise and was hardened into a
          production-oriented dashboard: strict API boundaries, server-side credentials, accessible
          components, and no fabricated market data.
        </p>
        <div className="button-row">
          <a
            href="https://darshan-gaikwad-portfolio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="button button--secondary"
          >
            Portfolio <Icon name="external" size={14} />
          </a>
          <a
            href="https://github.com/darshangaikwad4114"
            target="_blank"
            rel="noopener noreferrer"
            className="button button--secondary"
          >
            GitHub <Icon name="external" size={14} />
          </a>
          <a href="mailto:darshangaikwad4114@gmail.com" className="button button--ghost">
            Email
          </a>
        </div>
        <p className="panel__source">
          Market data by CoinGecko, news by CryptoCompare, sentiment by alternative.me.
        </p>
      </section>
    </div>
  );
}
