const fs = require('fs');

const filePath = 'src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Adding favorites hook call...\n');

// Add favorites hook between activePage and Filter states
const oldText = "  const [activePage, setActivePage] = useState('home');\n  \n  // Filter states";
const newText = "  const [activePage, setActivePage] = useState('home');\n  \n  const { favorites, toggleFavorite, isFavorite, favoritesCount } = useFavorites();\n  \n  // Filter states";

if (!content.includes('favoritesCount')) {
  if (content.includes(oldText)) {
    content = content.replace(oldText, newText);
    console.log('✅ Added favorites hook call');
    fs.writeFileSync(filePath, content);
  } else {
    console.log('❌ Could not find marker text');
    console.log('Looking for:', oldText);
  }
} else {
  console.log('⚠️  Hook already exists');
}
