const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, '..');
const files = fs.readdirSync(dirPath);

let count = 0;
files.forEach(file => {
    if (file.endsWith('.html')) {
        const filePath = path.join(dirPath, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('app-core.js?v=10.0')) {
            content = content.replace(/app-core\.js\?v=10\.0/g, 'app-core.js?v=11.0');
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated version in: ${file}`);
            count++;
        }
    }
});

console.log(`Successfully updated version in ${count} HTML files.`);
