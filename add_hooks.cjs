const fs = require('fs');

const filePath = 'src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Adding hooks...\n');

const hooksToAdd = `
  // Portfolio tracking
  const { holdings, showPortfolio, setShowPortfolio, portfolioValue, totalInvested, totalProfitLoss, profitLossPercentage, addHolding, removeHolding, getHoldingDetails, holdingsCount } = usePortfolio(coins);

  // Price alerts
  const { alerts, addAlert, removeAlert, notificationsEnabled, requestNotificationPermission, alertsCount } = usePriceAlerts(coins);

  // Error handling
  const { logError, errors, dismissError } = useErrorHandler();
`;

const marker = "  const [error, setError] = useState(null);\n  const [activePage, setActivePage] = useState('home');";
const markerWithFav = marker + "\n  \n  const { favorites, toggleFavorite, isFavorite, favoritesCount } = useFavorites();";

if (!content.includes('showPortfolio') && content.includes('favoritesCount')) {
  content = content.replace(markerWithFav, markerWithFav + "\n" + hooksToAdd);
  console.log('✅ Added portfolio, alerts, and error hooks');
} else if (!content.includes('showPortfolio')) {
  content = content.replace(marker, marker + "\n" + hooksToAdd);
  console.log('✅ Added portfolio, alerts, and error hooks (no favorites)');
}

fs.writeFileSync(filePath, content);
