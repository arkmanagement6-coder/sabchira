const fs = require('fs');
const path = require('path');

const allowedIds = [
  "8270415000000",
  "8270415000005",
  "8270415000007",
  "8270415000008",
  "8270415000030",
  "8270415000010"
];

// 1. Process products.json
const productsPath = path.join(__dirname, '..', 'products.json');
let products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

// Update stock status
products.forEach(p => {
    if (allowedIds.includes(String(p.id))) {
        p.stockStatus = "in-stock";
    } else {
        p.stockStatus = "out-of-stock";
    }
});

// Sort products: in-stock first, then out-of-stock
products.sort((a, b) => {
    const aIn = a.stockStatus === 'in-stock' ? 1 : 0;
    const bIn = b.stockStatus === 'in-stock' ? 1 : 0;
    return bIn - aIn; // in-stock (1) comes before out-of-stock (0)
});

fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf8');
console.log('Successfully updated and sorted products.json');

// 2. Process app-core.js
const appCorePath = path.join(__dirname, '..', 'app-core.js');
let appCoreContent = fs.readFileSync(appCorePath, 'utf8');

const startStr = 'const INITIAL_PRODUCTS = [';
const nextSectionStr = '// Database Initialization';

const startIndex = appCoreContent.indexOf(startStr);
const nextSectionIndex = appCoreContent.indexOf(nextSectionStr);

if (startIndex === -1 || nextSectionIndex === -1) {
    console.error('Error: Could not find INITIAL_PRODUCTS or Database Initialization markers in app-core.js');
    process.exit(1);
}

// Find the last "];" before the next section
const arrayContentAndClosing = appCoreContent.substring(startIndex, nextSectionIndex);
const lastClosingBracketIndex = arrayContentAndClosing.lastIndexOf('];');

if (lastClosingBracketIndex === -1) {
    console.error('Error: Could not find closing bracket of INITIAL_PRODUCTS array');
    process.exit(1);
}

const endIndex = startIndex + lastClosingBracketIndex + 2; // Include the closing bracket and semicolon if it exists

// Extract content before and after
const before = appCoreContent.substring(0, startIndex);
const after = appCoreContent.substring(endIndex);

// Format INITIAL_PRODUCTS Javascript array
const newInitialProductsContent = `const INITIAL_PRODUCTS = ${JSON.stringify(products, null, 2)};`;

const updatedAppCoreContent = before + newInitialProductsContent + after;

fs.writeFileSync(appCorePath, updatedAppCoreContent, 'utf8');
console.log('Successfully updated and sorted INITIAL_PRODUCTS in app-core.js');
