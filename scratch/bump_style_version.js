const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, '..');
const files = fs.readdirSync(dirPath);

let count = 0;
files.forEach(file => {
    if (file.endsWith('.html')) {
        const filePath = path.join(dirPath, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('style.css?v=2.3')) {
            content = content.replace(/style\.css\?v=2\.3/g, 'style.css?v=2.4');
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated style version in: ${file}`);
            count++;
        }
    }
});

console.log(`Successfully updated style version in ${count} HTML files.`);
