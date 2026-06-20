const fs = require('fs');
const path = require('path');

const targetId = "8270415000030";

const newDescription = `<h2>About this item</h2>
<ul>
  <li><strong>WHY IPAD AIR</strong> — iPad Air is powerful, versatile and comes in a choice of two sizes. Featuring a stunning Liquid Retina display and the amazing performance of the M2 chip, along with Touch ID, advanced cameras, superfast Wi-Fi 6E and a USB-C connector. Plus powerful productivity features in iPadOS and next-generation Apple Pencil Pro experience.</li>
  <li><strong>LIQUID RETINA DISPLAY</strong> — The gorgeous Liquid Retina display features advanced technologies like P3 wide colour, True Tone and ultra-low reflectivity, which make everything look stunning.</li>
  <li><strong>PERFORMANCE AND STORAGE</strong> — The M2 chip lets you multitask smoothly between powerful apps and play graphics-intensive games. And with all-day battery life, you can keep working and playing wherever you go. Choose up to 1TB of storage depending on the room you need for apps, music, movies and more.</li>
  <li><strong>IPADOS + APPS</strong> — iPadOS makes iPad more productive, intuitive and versatile. With iPadOS, run multiple apps at once, use Apple Pencil to write in any text field with Scribble, and edit and share photos. Stage Manager makes multitasking easy with resizable, overlapping apps and external display support. iPad Air comes with essential apps like Safari, Messages and Keynote, with over a million more apps available on the App Store.</li>
  <li><strong>APPLE PENCIL AND MAGIC KEYBOARD</strong> — Apple Pencil Pro transforms iPad Air into an immersive drawing canvas and the world’s best note‑taking device. Apple Pencil (USB-C) is also compatible with iPad Air. Magic Keyboard features a great typing experience and a built‑in trackpad, while doubling as a protective cover for iPad.</li>
  <li><strong>ADVANCED CAMERAS</strong> — iPad Pro features a landscape 12MP Ultra Wide front camera that supports Centre Stage for video conferencing or epic Portrait mode selfies. The 12MP Wide back camera with adaptive True Tone flash is great for capturing photos or 4K video with ProRes support. Four studio-quality microphones and a four-speaker audio system provide rich audio. And AR experiences are enhanced with the LiDAR Scanner to capture a depth map of any space.</li>
  <li><strong>CONNECTIVITY</strong> — Wi-Fi 6E gives you fast wireless connections for quick transfers of photos, documents and large video files. And when you’re away from Wi-Fi, superfast 5G gives you the flexibility to stay connected in more places.* Connect to external displays, drives and more using the USB-C connector with support for Thunderbolt / USB 4.</li>
  <li><strong>UNLOCK WITH FACE ID</strong> — Unlock your iPad Pro, sign in to apps and more — all with just a glance.*</li>
  <li><strong>LEGAL DISCLAIMERS</strong> — This is a summary of the main product features. See below to learn more.</li>
</ul>`;

// 1. Process products.json
const productsPath = path.join(__dirname, '..', 'products.json');
let products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

const prod = products.find(p => String(p.id) === targetId);
if (prod) {
    prod.description = newDescription;
    console.log(`Updated description for product ${targetId} in products.json`);
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
console.log(`Updated description for product ${targetId} in app-core.js`);
