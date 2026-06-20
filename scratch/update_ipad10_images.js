const fs = require('fs');
const path = require('path');

const targetId = "8270415000008";

const originalImages = [
  "https://look-10287.myshopify.com/cdn/shop/files/222_a31333ca-5a60-4f70-8cf4-f8d0ab6e9ae1_512x512.jpg?v=1781259494",
  "https://look-10287.myshopify.com/cdn/shop/files/111_5d8330f6-2140-4f2d-89ab-ff89dfbfbc93_512x512.jpg?v=1781259494"
];

// URL-encoded paths to prevent loading issues on Vercel
const newImagesToAppend = [
  "Image/Apple%20iPad%20(10th%20Generation)%20with%20A14%20Bionic%20chip,%20256GB,%20Wi-Fi%206,%2012MP%20front12MP%20Back%20Camera,%20Touch%20ID,%20All-Day%20Battery%20Life-Pink/2_c28939b4-ce02-4685-be4a-03f16a0123d0_869x869.webp",
  "Image/Apple%20iPad%20(10th%20Generation)%20with%20A14%20Bionic%20chip,%20256GB,%20Wi-Fi%206,%2012MP%20front12MP%20Back%20Camera,%20Touch%20ID,%20All-Day%20Battery%20Life-Pink/5_36170484-27ca-49a7-9c46-00159c951e29_150x150_crop_center.avif",
  "Image/Apple%20iPad%20(10th%20Generation)%20with%20A14%20Bionic%20chip,%20256GB,%20Wi-Fi%206,%2012MP%20front12MP%20Back%20Camera,%20Touch%20ID,%20All-Day%20Battery%20Life-Pink/4_22e8c211-6655-48e3-8a56-d47a1a194eb8_869x869.jpg"
];

const newDescImages = [
  "Image/Apple%20iPad%20(10th%20Generation)%20with%20A14%20Bionic%20chip,%20256GB,%20Wi-Fi%206,%2012MP%20front12MP%20Back%20Camera,%20Touch%20ID,%20All-Day%20Battery%20Life-Pink/1.webp",
  "Image/Apple%20iPad%20(10th%20Generation)%20with%20A14%20Bionic%20chip,%20256GB,%20Wi-Fi%206,%2012MP%20front12MP%20Back%20Camera,%20Touch%20ID,%20All-Day%20Battery%20Life-Pink/2.webp",
  "Image/Apple%20iPad%20(10th%20Generation)%20with%20A14%20Bionic%20chip,%20256GB,%20Wi-Fi%206,%2012MP%20front12MP%20Back%20Camera,%20Touch%20ID,%20All-Day%20Battery%20Life-Pink/3.webp",
  "Image/Apple%20iPad%20(10th%20Generation)%20with%20A14%20Bionic%20chip,%20256GB,%20Wi-Fi%206,%2012MP%20front12MP%20Back%20Camera,%20Touch%20ID,%20All-Day%20Battery%20Life-Pink/4.webp"
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
