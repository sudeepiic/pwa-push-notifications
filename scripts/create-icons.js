const fs = require('fs');
const path = require('path');

// Simple SVG icons converted to base64 PNG
// We'll create SVG files that can be used directly

const icon192Svg = `<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#000000"/>
  <circle cx="96" cy="96" r="60" fill="#ffffff"/>
  <circle cx="96" cy="96" r="40" fill="#000000"/>
  <circle cx="96" cy="96" r="20" fill="#ffffff"/>
</svg>`;

const icon512Svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#000000"/>
  <circle cx="256" cy="256" r="160" fill="#ffffff"/>
  <circle cx="256" cy="256" r="106" fill="#000000"/>
  <circle cx="256" cy="256" r="53" fill="#ffffff"/>
</svg>`;

const appleTouchIconSvg = `<svg width="180" height="180" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="180" fill="#000000" rx="40"/>
  <circle cx="90" cy="90" r="56" fill="#ffffff"/>
  <circle cx="90" cy="90" r="37" fill="#000000"/>
  <circle cx="90" cy="90" r="18" fill="#ffffff"/>
</svg>`;

// Write SVG files
fs.writeFileSync(path.join(__dirname, '../public/icon-192x192.svg'), icon192Svg);
fs.writeFileSync(path.join(__dirname, '../public/icon-512x512.svg'), icon512Svg);
fs.writeFileSync(path.join(__dirname, '../public/apple-touch-icon.svg'), appleTouchIconSvg);

// Also create PNG files (simplified - in production you'd use sharp or canvas)
// For now, we'll create a simple placeholder
console.log('Icons created successfully!');
console.log('Note: SVG icons have been created. For PNG files, use:');
console.log('1. Convert the SVG files to PNG using an online tool or');
console.log('2. Install sharp and run a conversion script');
