const fs = require('fs');

const filePath = 'src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original length:', content.length);

// Use \r\n for Windows line endings
const importToAdd = "import LastUpdated from './components/LastUpdated';\r\n";
const searchString = "import CoinDetail from './components/CoinDetail/CoinDetail';\r\n";

if (content.includes(searchString) && !content.includes(importToAdd)) {
  content = content.replace(searchString, searchString + importToAdd);
  console.log('✅ Added LastUpdated import');
}

const componentToAdd = "\r\n      <div style={{textAlign: 'center', padding: '0.5rem'}}>\r\n        <LastUpdated />\r\n      </div>";
const searchHeader = "      </header>\r\n\r\n      <main className=\"main-content\">";

if (content.includes(searchHeader) && !content.includes('<LastUpdated')) {
  content = content.replace(
    searchHeader,
    "      </header>" + componentToAdd + "\r\n      <main className=\"main-content\">"
  );
  console.log('✅ Added LastUpdated component after header');
}

fs.writeFileSync(filePath, content);
console.log('New length:', content.length);
console.log('\n✅ SUCCESS! Check your browser - changes should appear now!');
