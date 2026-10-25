const fs = require('fs');
const content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');

console.log('Line 27:', JSON.stringify(lines[26]));
console.log('Line 28:', JSON.stringify(lines[27]));
console.log('Line 29:', JSON.stringify(lines[28]));
