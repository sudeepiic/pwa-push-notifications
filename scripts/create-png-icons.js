const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIcon(size, filename) {
  // Create a simple circular icon design
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#000000" rx="${size * 0.1}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size * 0.3125}" fill="#ffffff"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size * 0.207}" fill="#000000"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size * 0.104}" fill="#ffffff"/>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(__dirname, '../public', filename));

  console.log(`Created ${filename}`);
}

async function createIcons() {
  await Promise.all([
    createIcon(192, 'icon-192x192.png'),
    createIcon(512, 'icon-512x512.png'),
    createIcon(180, 'apple-touch-icon.png'),
  ]);

  console.log('All icons created successfully!');
}

createIcons().catch(console.error);
