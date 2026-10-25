const fs = require('fs');

const filePath = 'src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Adding imports...\n');

const newImports = [
  "import usePortfolio from './hooks/usePortfolio';\n",
  "import usePriceAlerts from './hooks/usePriceAlerts';\n",
  "import useErrorHandler from './hooks/useErrorHandler';\n"
];

let added = 0;
newImports.forEach(imp => {
  if (!content.includes(imp)) {
    content = content.replace(
      "import './App.css';\n",
      "import './App.css';\n" + imp
    );
    console.log('✅ Added:', imp.trim());
    added++;
  }
});

fs.writeFileSync(filePath, content);
console.log(`\n✅ Added ${added} new imports`);
