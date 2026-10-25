const fs = require('fs');

// Add enhanced animations to Coin.css
const coinCSS = fs.readFileSync('src/components/Coin/Coin.css', 'utf8');

const animationsToAdd = `
/* Enhanced Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(102, 126, 234, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(102, 126, 234, 0.8);
  }
}

.coin-card {
  animation: fadeInUp 0.5s ease-out;
  animation-fill-mode: both;
}

.coin-card:nth-child(1) { animation-delay: 0.05s; }
.coin-card:nth-child(2) { animation-delay: 0.1s; }
.coin-card:nth-child(3) { animation-delay: 0.15s; }
.coin-card:nth-child(4) { animation-delay: 0.2s; }
.coin-card:nth-child(5) { animation-delay: 0.25s; }
.coin-card:nth-child(6) { animation-delay: 0.3s; }
.coin-card:nth-child(7) { animation-delay: 0.35s; }
.coin-card:nth-child(8) { animation-delay: 0.4s; }
.coin-card:nth-child(9) { animation-delay: 0.45s; }
.coin-card:nth-child(10) { animation-delay: 0.5s; }

.coin-card:hover {
  transform: translateY(-8px) scale(1.02);
}

.coin-list-item {
  animation: fadeInUp 0.4s ease-out;
  animation-fill-mode: both;
}

.coin-list-item:nth-child(1) { animation-delay: 0.02s; }
.coin-list-item:nth-child(2) { animation-delay: 0.04s; }
.coin-list-item:nth-child(3) { animation-delay: 0.06s; }
.coin-list-item:nth-child(4) { animation-delay: 0.08s; }
.coin-list-item:nth-child(5) { animation-delay: 0.1s; }

/* Skeleton Loading Animation */
.coin-skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 25%,
    var(--color-bg-tertiary) 50%,
    var(--color-bg-secondary) 75%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite linear;
}

/* Enhanced price change indicators */
.price-change-value.positive {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));
  position: relative;
  overflow: hidden;
}

.price-change-value.positive::after {
  content: '▲';
  margin-left: 0.25rem;
  font-size: 0.75rem;
}

.price-change-value.negative {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1));
  position: relative;
  overflow: hidden;
}

.price-change-value.negative::after {
  content: '▼';
  margin-left: 0.25rem;
  font-size: 0.75rem;
}
`;

if (!coinCSS.includes('fadeInUp')) {
  fs.writeFileSync('src/components/Coin/Coin.css', coinCSS + animationsToAdd);
  console.log('✅ Enhanced Coin.css with animations');
}

// Enhance App.css with smooth transitions
const appCSS = fs.readFileSync('src/App.css', 'utf8');

const appEnhancements = `
/* Smooth Scrolling */
html {
  scroll-behavior: smooth;
}

/* Selection Styling */
::selection {
  background: rgba(102, 126, 234, 0.3);
  color: white;
}

/* Smooth transitions for all interactive elements */
button, a, input, select {
  transition: all 0.2s ease;
}

/* Enhanced search input */
.search-input {
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.search-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  transform: scale(1.01);
}

/* Enhanced loading skeleton */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 25%,
    var(--color-bg-tertiary) 50%,
    var(--color-bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}

/* Smooth card transitions */
.coin-card,
.coin-list-item {
  will-change: transform;
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
}

/* Better focus states */
button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Smooth color transitions */
* {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}
`;

if (!appCSS.includes('scroll-behavior')) {
  fs.writeFileSync('src/App.css', appCSS + appEnhancements);
  console.log('✅ Enhanced App.css with smooth transitions');
}

console.log('\n🎨 UI Polish Applied:');
console.log('  • Smooth fade-in animations for coins');
console.log('  • Staggered animation delays (cascade effect)');
console.log('  • Shimmer loading effect');
console.log('  • Enhanced hover effects');
console.log('  • Smooth scroll behavior');
console.log('  • Better focus indicators');
console.log('  • Price change arrows (▲/▼)');
console.log('  • Smooth transitions everywhere');
