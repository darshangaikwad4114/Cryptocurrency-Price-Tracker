const fs = require('fs');

const filePath = 'src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');
console.log('Adding favorites UI...\n');

// Find the LastUpdated closing div and add favorites section after it
const lastUpdatedEnd = "        <LastUpdated />\n      </div>";
const favoritesSection = `
      </div>
      
      {/* Favorites Section */}
      {favoritesCount > 0 && (
        <div style={{
          textAlign: 'center',
          padding: '1rem 2rem',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
          borderBottom: '1px solid rgba(251, 191, 36, 0.3)',
          marginBottom: '1rem',
          maxWidth: '1200px',
          margin: '0 auto 1rem auto',
          borderRadius: '12px'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem'
          }}>
            <span style={{fontSize: '1.25rem'}}>⭐</span>
            <span style={{
              color: '#f59e0b',
              fontWeight: '600',
              fontSize: '0.95rem'
            }}>
              {favoritesCount} Favorite{favoritesCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            justifyContent: 'center'
          }}>
            {favorites.slice(0, 5).map(fav => (
              <div key={fav.id} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '0.4rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                color: 'white',
                border: '1px solid rgba(251, 191, 36, 0.4)'
              }}>
                <img src={fav.image} alt={fav.name} style={{width: '16px', height: '16px', borderRadius: '50%'}} />
                <span>{fav.name}</span>
                <button 
                  onClick={() => toggleFavorite({id: fav.id, name: fav.name})}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '0',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )`;

if (!content.includes('Favorites Section') && content.includes('LastUpdated')) {
  content = content.replace(lastUpdatedEnd, favoritesSection);
  console.log('✅ Added favorites UI');
}

fs.writeFileSync(filePath, content);
console.log('✅ Favorites UI added!');
