const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'products.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let imageCount = 0;
let imagesCount = 0;
let descImagesCount = 0;
let descCount = 0;

data.forEach((p, idx) => {
    // 1. Sanitize main image
    if (p.image && typeof p.image === 'string' && p.image.startsWith('data:image')) {
        p.image = 'https://picsum.photos/600/400';
        imageCount++;
    }

    // 2. Sanitize images array
    if (p.images && Array.isArray(p.images)) {
        p.images = p.images.map(img => {
            if (typeof img === 'string' && img.startsWith('data:image')) {
                imagesCount++;
                return 'https://picsum.photos/600/400';
            }
            return img;
        });
    }

    // 3. Sanitize descriptionImages array
    if (p.descriptionImages && Array.isArray(p.descriptionImages)) {
        p.descriptionImages = p.descriptionImages.map(img => {
            if (typeof img === 'string' && img.startsWith('data:image')) {
                descImagesCount++;
                return 'https://picsum.photos/600/400';
            }
            return img;
        });
    }

    // 4. Sanitize embedded base64 in HTML description string
    if (p.description && typeof p.description === 'string' && p.description.includes('data:image')) {
        // Regex to match data URI src inside img tags or standard quotes
        const regex = /src=["']data:image\/[^"';]+;base64,[^"']+["']/g;
        const matches = p.description.match(regex);
        if (matches) {
            descCount += matches.length;
            p.description = p.description.replace(regex, 'src="https://picsum.photos/600/400"');
        }
        
        // Also catch any data:image in general inside url(...) or source patterns
        const generalRegex = /data:image\/[^"';)]+;base64,[^"';)]+/g;
        const generalMatches = p.description.match(generalRegex);
        if (generalMatches) {
            // Only count if not already counted
            p.description = p.description.replace(generalRegex, 'https://picsum.photos/600/400');
        }
    }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

console.log(`Sanitization Complete:`);
console.log(`- Replaced ${imageCount} main images (p.image)`);
console.log(`- Replaced ${imagesCount} gallery images (p.images)`);
console.log(`- Replaced ${descImagesCount} description array images (p.descriptionImages)`);
console.log(`- Replaced ${descCount} embedded description HTML images (p.description)`);
console.log(`File saved back to: ${filePath}`);
