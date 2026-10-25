const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');
console.log('Original file length:', content.length);

// Add import
const newImport = "import LastUpdated from './components/LastUpdated';\n";
if (!content.includes(newImport)) {
  content = content.replace(
    "import CoinDetail from './components/CoinDetail/CoinDetail';\n",
    "import CoinDetail from './components/CoinDetail/CoinDetail';\n" + newImport
  );
  console.log('✅ Added LastUpdated import');
}

// Add component after </header>
const componentCode = "\n      <div style={{textAlign: 'center', padding: '0.5rem'}}>\n        <LastUpdated />\n      </div>";
if (!content.includes('<LastUpdated')) {
  content = content.replace(
    "      </header>\n\n      <main className=\"main-content\">",
    "      </header>" + componentCode + "\n      <main className=\"main-content\">"
  );
  console.log('✅ Added LastUpdated component after header');
}

fs.writeFileSync(filePath, content);
console.log('\n✅ File saved successfully!');
console.log('New file length:', content.length);
console.log('\nRefresh your browser to see the changes!');
