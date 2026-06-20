const fs = require('fs');
const path = require('path');

const targetId = "8270415000030";

const originalImages = [
  "https://look-10287.myshopify.com/cdn/shop/files/22_87148f00-12f9-4e5e-9951-8717bdcb21de_512x512.jpg?v=1781259482",
  "https://look-10287.myshopify.com/cdn/shop/files/11_0ea24f3d-9bcd-4e5f-a894-b4f66903a3c8_512x512.jpg?v=1781259481"
];

// Folder name containing double spaces and U+2033 (double prime)
const rawFolder = "Image/Apple iPad Air 11″ (M2) Liquid Retina Display, 256GB, Landscape 12MP Front Camera  12MP Back Camera, Wi-Fi 6E, Touch ID, All-Day Battery Life-Gray";

// Properly encode folder name to be URL safe
const folder = rawFolder.split('/').map(part => encodeURIComponent(part)).join('/');

const newImagesToAppend = [
  `${folder}/2_f84a81b2-c4ae-4742-baa9-c33c367e2bc1_679x679.webp`,
  `${folder}/3_7613bf5b-b1ed-4a3a-a721-0409829268cf_679x679.webp`,
  `${folder}/4_16843c15-81b3-47d1-837f-4fd3306ae717_679x679.jpg`,
  `${folder}/5_1a378377-d486-4f64-b137-6a7161cfc80d_679x679.webp`
];

// Feature images in the requested order: 4, 1, 2, 3
const newDescImages = [
  `${folder}/4.jpg`,
  `${folder}/1.jpg`,
  `${folder}/2.jpg`,
  `${folder}/3.jpg`
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
