const fs = require('fs');

const filePath = 'src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// The EXACT content from line 6 (with \r\n for Windows)
const line6 = "import useFavorites from './hooks/useFavorites';\r\n";
const line7 = "import './App.css';\r\n";

console.log('Looking for exact line 6...');
console.log('Line 6 found:', content.includes(line6));
console.log('Line 7 found:', content.includes(line7));

// Build the replacement
const newLines = [
  "import useFavorites from './hooks/useFavorites';\r\n",
  "import usePortfolio from './hooks/usePortfolio';\r\n",
  "import usePriceAlerts from './hooks/usePriceAlerts';\r\n",
  "import useErrorHandler from './hooks/useErrorHandler';\r\n",
  "import './App.css';\r\n"
];

const replacement = newLines.join('');

// Replace line 6 + line 7 with all new lines
const oldPattern = line6 + line7;
const newPattern = replacement;

console.log('\nOld pattern (line 6+7):', oldPattern.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));
console.log('New pattern:', newPattern.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));
console.log('\nFound old pattern:', content.includes(oldPattern));

if (content.includes(oldPattern) && !content.includes('usePortfolio')) {
  content = content.replace(oldPattern, newPattern);
  fs.writeFileSync(filePath, content);
  console.log('✅ SUCCESS! Added 3 new imports');
  console.log('File size now:', content.length, 'bytes');
} else if (content.includes('usePortfolio')) {
  console.log('⚠️  Imports already exist');
} else {
  console.log('❌ Pattern not found - need different approach');
  
  // Fallback: insert after line 6
  const idx = content.indexOf(line6);
  if (idx !== -1) {
    const insertPoint = idx + line6.length;
    const toInsert = "import usePortfolio from './hooks/usePortfolio';\r\nimport usePriceAlerts from './hooks/usePriceAlerts';\r\nimport useErrorHandler from './hooks/useErrorHandler';\r\n";
    content = content.substring(0, insertPoint) + toInsert + content.substring(insertPoint);
    fs.writeFileSync(filePath, content);
    console.log('✅ Added imports via fallback method');
    console.log('File size:', content.length);
  }
}
