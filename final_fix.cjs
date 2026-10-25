const fs = require('fs');

const filePath = 'src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Final fixes...\n');

// Fix 1: Add useFavorites import if missing
const importLine = "import useFavorites from './hooks/useFavorites';\n";
if (!content.includes(importLine)) {
  content = content.replace(
    "import useDebounce from './hooks/useDebounce';\n",
    "import useDebounce from './hooks/useDebounce';\n" + importLine
  );
  console.log('✅ Added useFavorites import');
}

// Fix 2: Add favorites hook if missing
const hookLine = "  const { favorites, toggleFavorite, isFavorite, favoritesCount } = useFavorites();\n";
if (!content.includes('favoritesCount')) {
  content = content.replace(
    "  const [activePage, setActivePage] = useState('home');\n  \n  // Filter states",
    "  const [activePage, setActivePage] = useState('home');\n  \n  " + hookLine + "  \n  // Filter states"
  );
  console.log('✅ Added favorites hook');
}

fs.writeFileSync(filePath, content);
console.log('\n✅ All fixes applied!');
console.log('\nRefresh your browser (F5) to see:');
console.log('  ⭐ Star buttons on coins');
console.log('  ⭐ Favorites bar when you star coins');
console.log('  📊 Version badge in footer');
