const fs = require('fs');
const path = require('path');

const targetId = "8270415000010";

const originalImages = [
  "https://look-10287.myshopify.com/cdn/shop/files/ikko-mindone-pro-black1_512x512.png?v=1781259499",
  "https://look-10287.myshopify.com/cdn/shop/files/ikko-mindone-pro-white_2_512x512.png?v=1781259499"
];

// Folder name containing spaces
const rawFolder = "Image/MindOne Pro Card-Sized AI Smartphone";

// Properly encode folder name to be URL safe
const folder = rawFolder.split('/').map(part => encodeURIComponent(part)).join('/');

const newImagesToAppend = [
  `${folder}/ikko-mindone-pro-black2_800x800.webp`,
  `${folder}/ikko-mindone-pro-white_back-1_800x800.webp`,
  `${folder}/MindOnepro__flipcameraslide2___iKKO_869x695.webp`,
  `${folder}/ikko-mindone-flip-camera_800x800.webp`,
  `${folder}/ikko-mindone-in-hands_800x800.webp`,
  `${folder}/ikko-mind-one-ai-phone-card-sized-2000-01-1_869x869.webp`,
  `${folder}/ikko-mind-one-ai-phone-card-sized-2000-04_869x869.webp`
];

// Feature images: ikko1.webp, ikko_2.webp, ikko_3.webp, ikko_4.webp, ikko_11.webp, ikko_22.webp
const newDescImages = [
  `${folder}/ikko1.webp`,
  `${folder}/ikko_2.webp`,
  `${folder}/ikko_3.webp`,
  `${folder}/ikko_4.webp`,
  `${folder}/ikko_11.webp`,
  `${folder}/ikko_22.webp`
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
