const fs = require('fs');

const filePath = 'src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Inserting hooks after line 27...\n');

// Hook code to insert
const hooksToInsert = [
  "",
  "  // Favorites/Watchlist",
  "  const { favorites, toggleFavorite, isFavorite, favoritesCount } = useFavorites();",
  "",
  "  // Portfolio tracking", 
  "  const { holdings, showPortfolio, setShowPortfolio, portfolioValue, totalInvested, totalProfitLoss, profitLossPercentage, removeHolding, holdingsCount } = usePortfolio(coins);",
  "",
  "  // Price alerts",
  "  const { alerts, addAlert, removeAlert, notificationsEnabled, requestNotificationPermission, alertsCount } = usePriceAlerts(coins);",
  "",
  "  // Error handling",
  "  const { logError, errors, dismissError } = useErrorHandler();",
  "",
  "  // Toggle panels",
  "  const [showAlerts, setShowAlerts] = useState(false);",
  ""
];

// Insert after line 27 (index 26)
const newLines = [
  ...lines.slice(0, 27),
  ...hooksToInsert,
  ...lines.slice(27)
];

const newContent = newLines.join('\n');
fs.writeFileSync(filePath, newContent);

console.log('✅ Hooks inserted!');
console.log('New file size:', newContent.length);
console.log('Lines added:', hooksToInsert.length);
