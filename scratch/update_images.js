const fs = require('fs');
const path = require('path');

const targetId = "8270415000007";

const originalImages = [
  "https://look-10287.myshopify.com/cdn/shop/files/3_512x512.jpg?v=1781259492",
  "https://look-10287.myshopify.com/cdn/shop/files/1_512x512.jpg?v=1781259492"
];

const newImagesToAppend = [
  "Image/Apple%20iPad%20mini%20(6th%20Gen)%20256%20GB%20ROM%208.3%20inch%20with%20Wi-Fi%2B5G/2_869x869.webp",
  "Image/Apple%20iPad%20mini%20(6th%20Gen)%20256%20GB%20ROM%208.3%20inch%20with%20Wi-Fi%2B5G/4_869x869.webp",
  "Image/Apple%20iPad%20mini%20(6th%20Gen)%20256%20GB%20ROM%208.3%20inch%20with%20Wi-Fi%2B5G/5_547cc859-8e23-4c45-8556-c9726f67dc61_869x869.webp",
  "Image/Apple%20iPad%20mini%20(6th%20Gen)%20256%20GB%20ROM%208.3%20inch%20with%20Wi-Fi%2B5G/6_869x869.webp"
];

const newDescImages = [
  "Image/Apple%20iPad%20mini%20(6th%20Gen)%20256%20GB%20ROM%208.3%20inch%20with%20Wi-Fi%2B5G/1.webp",
  "Image/Apple%20iPad%20mini%20(6th%20Gen)%20256%20GB%20ROM%208.3%20inch%20with%20Wi-Fi%2B5G/2.webp",
  "Image/Apple%20iPad%20mini%20(6th%20Gen)%20256%20GB%20ROM%208.3%20inch%20with%20Wi-Fi%2B5G/3.webp",
  "Image/Apple%20iPad%20mini%20(6th%20Gen)%20256%20GB%20ROM%208.3%20inch%20with%20Wi-Fi%2B5G/4.webp",
  "Image/Apple%20iPad%20mini%20(6th%20Gen)%20256%20GB%20ROM%208.3%20inch%20with%20Wi-Fi%2B5G/5.webp"
];

const mainImage = originalImages[0];
const combinedImages = [...originalImages, ...newImagesToAppend];

// 1. Process products.json
const productsPath = path.join(__dirname, '..', 'products.json');
let products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

const prod = products.find(p => String(p.id) === targetId);
if (prod) {
    prod.image = mainImage;
    prod.images = combinedImages;
    prod.descriptionImages = newDescImages;
    console.log(`Updated images for product ${targetId} in products.json`);
} else {
    console.error(`Error: Product ${targetId} not found in products.json`);
    process.exit(1);
}

fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf8');

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

const endIndex = startIndex + lastClosingBracketIndex + 2;

// Extract content before and after
const before = appCoreContent.substring(0, startIndex);
const after = appCoreContent.substring(endIndex);

// Format INITIAL_PRODUCTS Javascript array
const newInitialProductsContent = `const INITIAL_PRODUCTS = ${JSON.stringify(products, null, 2)};`;

const updatedAppCoreContent = before + newInitialProductsContent + after;

fs.writeFileSync(appCorePath, updatedAppCoreContent, 'utf8');
console.log(`Updated images for product ${targetId} in app-core.js`);
