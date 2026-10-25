const fs = require('fs');

const Appjsx = fs.readFileSync('src/App.jsx', 'utf8');
const lines = Appjsx.split('\n');

console.log('═══════════════════════════════════════════');
console.log('CODE DIAGNOSTIC REPORT');
console.log('═══════════════════════════════════════════\n');

console.log('Total lines:', lines.length);
console.log('Total bytes:', Appjsx.length, '\n');

console.log('SEARCHING FOR FEATURES:');
console.log('─'.repeat(50));

const features = [
  { name: 'usePortfolio', search: 'usePortfolio', found: Appjsx.includes('usePortfolio') },
  { name: 'usePriceAlerts', search: 'usePriceAlerts', found: Appjsx.includes('usePriceAlerts') },
  { name: 'showHoldings variable', search: 'showHoldings', found: Appjsx.includes('showHoldings') },
  { name: 'showAlerts variable', search: 'showAlerts', found: Appjsx.includes('showAlerts') },
  { name: 'holdingsCount', search: 'holdingsCount', found: Appjsx.includes('holdingsCount') },
  { name: 'alertsCount', search: 'alertsCount', found: Appjsx.includes('alertsCount') },
  { name: 'Portfolio button UI', search: 'Price Alerts', found: Appjsx.includes('Price Alerts') },
  { name: 'LastUpdated (working)', search: 'LastUpdated', found: Appjsx.includes('LastUpdated') }
];

features.forEach(f => {
  const status = f.found ? '✅' : '❌';
  console.log(`${status} ${f.name}: ${f.found ? 'FOUND' : 'NOT FOUND'}`);
});

console.log('\n─'.repeat(50));
console.log('IMPORT STATEMENTS (Lines 1-20):');
console.log('─'.repeat(50));
lines.slice(0, 20).forEach((line, i) => {
  console.log(`Line ${i+1}: ${line}`);
});

console.log('\n─'.repeat(50));
console.log('STATE VARIABLES (Look for favorites/portfolio):');
console.log('─'.repeat(50));
lines.forEach((line, i) => {
  if (line.includes('const {') || line.includes('useState') || line.includes('portfolio') || line.includes('alerts')) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
});

console.log('\n─'.repeat(50));
console.log('FOOTER SECTION:');
console.log('─'.repeat(50));
const footerStart = Appjsx.lastIndexOf('<footer');
const footerEnd = Appjsx.lastIndexOf('</footer>') + 10;
if (footerStart !== -1) {
  console.log(Appjsx.substring(footerStart, footerEnd));
} else {
  console.log('Footer not found');
}

console.log('\n═══════════════════════════════════════════');
console.log('CONCLUSION:');
console.log('═══════════════════════════════════════════');
const missing = features.filter(f => !f.found);
if (missing.length > 0) {
  console.log('\n❌ MISSING FEATURES:', missing.map(f => f.name).join(', '));
  console.log('\nThe imports were added but the hooks/UI were NOT integrated yet.');
} else {
  console.log('\n✅ All features are in the code!');
  console.log('Try refreshing browser with Ctrl+F5 (hard refresh)');
}
