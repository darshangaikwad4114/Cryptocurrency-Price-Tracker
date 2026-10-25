const fs = require('fs');

const filePath = 'src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Adding favorites hook...\n');

// The exact text to find and add after it
const marker = "  const [activePage, setActivePage] = useState('home');\n  \n  // Filter states";

const hookLine = "  const { favorites, toggleFavorite, isFavorite, favoritesCount } = useFavorites();\n  \n  ";

if (!content.includes('favoritesCount')) {
  content = content.replace(marker, "  const [activePage, setActivePage] = useState('home');\n  \n  const { favorites, toggleFavorite, isFavorite, favoritesCount } = useFavorites();\n  \n  // Filter states");
  console.log('✅ Added favorites hook');
  
  fs.writeFileSync(filePath, content);
  console.log('✅ File updated!');
  console.log('\nRefresh your browser now!');
} else {
  console.log('⚠️  Favorites hook already exists');
}
