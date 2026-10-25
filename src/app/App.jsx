import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import { ThemeProvider } from '../features/theme/ThemeProvider';
import { ToastProvider } from '../features/toast/ToastProvider';
import { WatchlistProvider } from '../features/watchlist/WatchlistProvider';
import { PortfolioProvider } from '../features/portfolio/PortfolioProvider';
import { AlertsProvider } from '../features/alerts/AlertsProvider';
import AppLayout from '../layouts/AppLayout';
import ErrorBoundary from '../layouts/ErrorBoundary';
import DashboardPage from '../pages/DashboardPage';
import MarketsPage from '../pages/MarketsPage';
import CoinPage from '../pages/CoinPage';
import NewsPage from '../pages/NewsPage';
import PortfolioPage from '../pages/PortfolioPage';
import WatchlistPage from '../pages/WatchlistPage';
import AlertsPage from '../pages/AlertsPage';
import AboutPage from '../pages/AboutPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <WatchlistProvider>
              <PortfolioProvider>
                <AlertsProvider>
                  <BrowserRouter>
                    <Routes>
                      <Route element={<AppLayout />}>
                        <Route index element={<DashboardPage />} />
                        <Route path="markets" element={<MarketsPage />} />
                        <Route path="coins/:coinId" element={<CoinPage />} />
                        <Route path="news" element={<NewsPage />} />
                        <Route path="portfolio" element={<PortfolioPage />} />
                        <Route path="watchlist" element={<WatchlistPage />} />
                        <Route path="alerts" element={<AlertsPage />} />
                        <Route path="about" element={<AboutPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                      </Route>
                    </Routes>
                  </BrowserRouter>
                </AlertsProvider>
              </PortfolioProvider>
            </WatchlistProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
