const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add import after CoinDetail import
const importText = "import LastUpdated from './components/LastUpdated';\n";
content = content.replace(
  "import CoinDetail from './components/CoinDetail/CoinDetail';\n",
  "import CoinDetail from './components/CoinDetail/CoinDetail';\n" + importText
);

// Add LastUpdated component after </header>
const componentHtml = "\n      <div style={{textAlign: 'center', padding: '0.5rem'}}>\n        <LastUpdated />\n      </div>\n";
content = content.replace(
  "      </header>\n\n      <main className=\"main-content\">",
  "      </header>" + componentHtml + "      <main className=\"main-content\">"
);

fs.writeFileSync(filePath, content);
console.log('✅ Successfully modified App.jsx!');
console.log('✅ Added LastUpdated import');
console.log('✅ Added LastUpdated component to header');
console.log('');
console.log('Check your browser - you should see a pulsing green dot!');
