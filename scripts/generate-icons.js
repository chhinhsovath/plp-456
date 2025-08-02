const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Function to create an icon with text
function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#1890ff');
  gradient.addColorStop(1, '#0050b3');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Add rounded corners
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.1);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Add text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.3}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PLP', size / 2, size / 2 - size * 0.1);

  // Add subtitle
  ctx.font = `${size * 0.08}px Arial`;
  ctx.fillText('Teacher Tool', size / 2, size / 2 + size * 0.15);

  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(publicDir, filename), buffer);
  console.log(`Created ${filename}`);
}

// Generate PNG icons
createIcon(192, 'icon-192x192.png');
createIcon(512, 'icon-512x512.png');

// Generate additional sizes for favicon
createIcon(16, 'favicon-16x16.png');
createIcon(32, 'favicon-32x32.png');
createIcon(48, 'favicon-48x48.png');

console.log('All icons generated successfully!');