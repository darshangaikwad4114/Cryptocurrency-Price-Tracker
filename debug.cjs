const fs = require('fs');
const content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');

console.log('Line 10 (index 9):');
console.log(JSON.stringify(lines[9]));
console.log('\nLine 11 (index 10):');
console.log(JSON.stringify(lines[10]));
console.log('\nLooking for: import CoinDetail from ./components/CoinDetail/CoinDetail;');
console.log('Found:', content.includes("import CoinDetail from './components/CoinDetail/CoinDetail';"));
