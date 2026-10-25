const fs = require('fs');

const filePath = 'src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');
console.log('Adding version badge...\n');

// Add version badge styling and enhanced footer
const versionBadgeCSS = `
      .version-badge {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 0.35rem 1rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.5px;
        margin-top: 0.75rem;
        box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
      }
`;

// Find App.css reference and we'll add the CSS there instead
const oldFooter = `      <footer className="footer">
        <p>© {new Date().getFullYear()} Cryptocurrency Price Tracker. Data provided by CoinGecko API.</p>
      </footer>`;

const newFooter = `      <footer className="footer">
        <p>© {new Date().getFullYear()} Cryptocurrency Price Tracker. Data provided by CoinGecko API.</p>
        <div className="version-badge">
          v2.1.0 | Enhanced with Favorites, Live Updates & React Router
        </div>
      </footer>`;

if (!content.includes('version-badge') && content.includes('class="footer"')) {
  content = content.replace(oldFooter, newFooter);
  console.log('✅ Added version badge to footer');
}

// Also add the CSS class to App.css
const cssPath = 'src/App.css';
let css = fs.readFileSync(cssPath, 'utf8');

const cssToAdd = `
/* Version Badge */
.version-badge {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem 1.2rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-top: 0.75rem;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0%, 100% {
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  }
  50% {
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.6);
  }
}

.footer {
  text-align: center;
  padding: 2rem 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  border-top: 1px solid var(--border-color);
  margin-top: 3rem;
}
`;

if (!css.includes('.version-badge')) {
  css += cssToAdd;
  fs.writeFileSync(cssPath, css);
  console.log('✅ Added version badge CSS');
}

fs.writeFileSync(filePath, content);
console.log('\n✅ Version badge added!');
console.log('\n🎨 UI Improvements Applied:');
console.log('  • Animated gradient version badge in footer');
console.log('  • Shimmer animation effect');
console.log('  • Enhanced footer styling');
