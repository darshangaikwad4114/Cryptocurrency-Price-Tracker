const fs = require('fs');

const filePath = 'src/components/Coin/Coin.jsx';
let content = fs.readFileSync(filePath, 'utf8');
console.log('Adding star button to Coin component...\n');

// Find where to add the star button (in the coin card header area)
const coinCardStart = "      <div className=\"coin-card-header\">";
const starButton = `
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick({id, name, image, symbol, price, volume, priceChange, marketCap, rank});
        }}
        className="favorite-star"
        aria-label="Add to favorites"
        title="Add to favorites"
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(0, 0, 0, 0.3)',
          border: 'none',
          fontSize: '1.2rem',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '50%',
          color: '#fbbf24',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s',
          zIndex: 10
        }}
      >
        ⭐
      </button>
      `;

if (!content.includes('favorite-star') && content.includes('coin-card-header')) {
  content = content.replace(coinCardStart, starButton + "\n      " + coinCardStart);
  console.log('✅ Added star button to coin card');
}

fs.writeFileSync(filePath, content);
console.log('✅ Star button added!');
console.log('\nThe star will appear on each coin card.');
console.log('Click it to add coins to your favorites!');
