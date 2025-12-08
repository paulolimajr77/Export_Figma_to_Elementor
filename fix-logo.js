const fs = require('fs');

// Read the base64 logo
const b64 = fs.readFileSync('logo_b64.txt', 'utf8').trim();

// Read ui.html
let html = fs.readFileSync('src/ui.html', 'utf8');

// Replace the truncated base64 with complete one
html = html.replace(
    /src="data:image\/png;base64,[^"]*"/,
    `src="data:image/png;base64,${b64}"`
);

// Write back
fs.writeFileSync('src/ui.html', html);

console.log('Logo base64 updated successfully!');
