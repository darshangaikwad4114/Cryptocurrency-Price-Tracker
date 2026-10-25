const fs = require('fs');

const filePath = 'src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');
console.log('Adding favorites feature...\n');

// Add favorites hook after loading state
const hookCode = "  const { favorites, toggleFavorite, isFavorite, favoritesCount } = useFavorites();\n";
const searchFor = "  const [error, setError] = useState(null);\n  const [activePage, setActivePage] = useState('home');";

if (!content.includes('favoritesCount')) {
  content = content.replace(searchFor, searchFor + "\n\n" + hookCode);
  console.log('✅ Added favorites hook');
}

fs.writeFileSync(filePath, content);
console.log('✅ Step 1 complete - Hook added');
console.log('\nNext: Add favorites UI and version badge...');
