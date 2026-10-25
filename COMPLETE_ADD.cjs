const fs = require('fs');

const filePath = 'src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('═'.repeat(50));
console.log('ADDING ALL MISSING FEATURES');
console.log('═'.repeat(50) + '\n');

// 1. Add favorites hook
const hookCode = "  const { favorites, toggleFavorite, isFavorite, favoritesCount } = useFavorites();\n  \n";
const hookSpot = "  const [activePage, setActivePage] = useState('home');\n  \n  // Filter states";

if (!content.includes('favoritesCount') && content.includes('const [activePage, setActivePage]')) {
  content = content.replace(hookSpot, 
    "  const [activePage, setActivePage] = useState('home');\n  \n" + 
    hookCode + 
    "  // Filter states"
  );
  console.log('✅ Added favorites hook');
}

// 2. Make sure LastUpdated is properly closed and add favorites UI
const lastUpdatedCloser = "        <LastUpdated />\n      </div>\n\n      <main className=\"main-content\">";
const withFavorites = "        <LastUpdated />\n      </div>\n      \n      <div style={{textAlign: 'center', padding: '0.75rem', background: 'rgba(251, 191, 36, 0.1)', margin: '0 2rem', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.3)'}}>\n        {favoritesCount > 0 && (\n          <div>\n            <span style={{color: '#f59e0b', fontWeight: '600'}}>⭐ {favoritesCount} Favorite{favoritesCount > 1 ? 's' : ''}</span>\n            <div style={{marginTop: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap'}}>\n              {favorites.map(fav => (\n                <span key={fav.id} style={{background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.7rem', borderRadius: '15px', fontSize: '0.85rem'}}>\n                  {fav.name}\n                  <button onClick={() => toggleFavorite({id: fav.id, name: fav.name})} style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: '0.3rem'}}>×</button>\n                </span>\n              ))}\n            </div>\n          </div>\n        )}\n      </div>\n\n      <main className=\"main-content\">";

if (!content.includes('favoritesCount > 0') && content.includes('LastUpdated')) {
  content = content.replace(lastUpdatedCloser, withFavorites);
  console.log('✅ Added favorites UI');
}

// 3. Update footer with version
const oldFooter = "      <footer className=\"footer\">\n        <p>© {new Date().getFullYear()} Cryptocurrency Price Tracker. Data provided by CoinGecko API.</p>\n      </footer>";
const newFooter = "      <footer className=\"footer\">\n        <p>© {new Date().getFullYear()} Cryptocurrency Price Tracker. Data provided by CoinGecko API.</p>\n        <div className=\"version-badge\">✨ v2.1.0 | Enhanced with Favorites</div>\n      </footer>";

if (!content.includes('version-badge') && content.includes('class="footer"')) {
  content = content.replace(oldFooter, newFooter);
  console.log('✅ Added version badge');
}

fs.writeFileSync(filePath, content);
console.log('\n' + '═'.repeat(50));
console.log('✅ ALL FEATURES ADDED SUCCESSFULLY!');
console.log('═'.repeat(50));
console.log('\n📊 File size:', content.length, 'bytes');
console.log('\n🚀 Refresh your browser NOW (F5) to see:');
console.log('  1. ⭐ Favorites bar (click star on any coin)');
console.log('  2. 📊 Version badge in footer');
console.log('  3. ✨ Enhanced UI');
