const fs = require('fs');

const filePath = 'src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Check current state
console.log('Current line 5:', content.split('\n')[4]);
console.log('Current line 6:', content.split('\n')[5]);

// The EXACT pattern to replace - no extra newlines
const oldPattern = "import useDebounce from './hooks/useDebounce';\nimport './App.css';";
const newPattern = "import useDebounce from './hooks/useDebounce';\nimport useFavorites from './hooks/useFavorites';\nimport './App.css';";

console.log('\nLooking for pattern:', oldPattern);
console.log('Found:', content.includes(oldPattern));

if (content.includes(oldPattern)) {
  content = content.replace(oldPattern, newPattern);
  console.log('✅ Replaced pattern');
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Saved file');
} else {
  console.log('❌ Pattern not found, trying alternative...');
  
  // Try with \r\n (Windows line endings)
  const oldPatternWin = "import useDebounce from './hooks/useDebounce';\r\nimport './App.css';";
  const newPatternWin = "import useDebounce from './hooks/useDebounce';\r\nimport useFavorites from './hooks/useFavorites';\r\nimport './App.css';";
  
  if (content.includes(oldPatternWin)) {
    content = content.replace(oldPatternWin, newPatternWin);
    console.log('✅ Replaced with Windows line endings');
    fs.writeFileSync(filePath, content);
    console.log('✅ Saved file');
  } else {
    console.log('❌ Neither pattern found');
    console.log('\nFile starts with:');
    console.log(content.substring(0, 200));
  }
}
