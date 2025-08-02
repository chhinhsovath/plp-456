const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const publicDir = path.join(__dirname, '..', 'public');

function createModernIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Create rounded rectangle background
  const cornerRadius = size * 0.2;
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#40a9ff');  // Light blue
  gradient.addColorStop(1, '#1890ff');  // Primary blue
  
  // Draw rounded rectangle
  ctx.beginPath();
  ctx.moveTo(cornerRadius, 0);
  ctx.lineTo(size - cornerRadius, 0);
  ctx.quadraticCurveTo(size, 0, size, cornerRadius);
  ctx.lineTo(size, size - cornerRadius);
  ctx.quadraticCurveTo(size, size, size - cornerRadius, size);
  ctx.lineTo(cornerRadius, size);
  ctx.quadraticCurveTo(0, size, 0, size - cornerRadius);
  ctx.lineTo(0, cornerRadius);
  ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
  ctx.closePath();
  
  ctx.fillStyle = gradient;
  ctx.fill();

  // Add inner shadow effect
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  const innerGradient = ctx.createLinearGradient(0, 0, 0, size);
  innerGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
  innerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = innerGradient;
  ctx.fill();
  ctx.restore();

  // Draw text
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Main text "PLP"
  ctx.font = `bold ${size * 0.35}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
  ctx.fillText('PLP', size / 2, size / 2 - size * 0.05);
  
  // Subtitle (only for larger sizes)
  if (size >= 128) {
    ctx.font = `${size * 0.08}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
    ctx.fillText('TEACHER TOOL', size / 2, size / 2 + size * 0.2);
  }

  // Add subtle highlight
  const highlightGradient = ctx.createLinearGradient(0, 0, 0, size * 0.5);
  highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
  highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.beginPath();
  ctx.moveTo(cornerRadius, 0);
  ctx.lineTo(size - cornerRadius, 0);
  ctx.quadraticCurveTo(size, 0, size, cornerRadius);
  ctx.lineTo(size, size * 0.5);
  ctx.lineTo(0, size * 0.5);
  ctx.lineTo(0, cornerRadius);
  ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
  ctx.closePath();
  
  ctx.fillStyle = highlightGradient;
  ctx.fill();

  // Save file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(publicDir, filename), buffer);
  console.log(`Created ${filename}`);
}

// Generate all icon sizes
console.log('Generating modern icons...');

// PWA icons
createModernIcon(192, 'icon-192x192.png');
createModernIcon(512, 'icon-512x512.png');

// Favicon sizes
createModernIcon(16, 'favicon-16x16.png');
createModernIcon(32, 'favicon-32x32.png');
createModernIcon(48, 'favicon-48x48.png');

// Additional common sizes
createModernIcon(64, 'icon-64x64.png');
createModernIcon(128, 'icon-128x128.png');
createModernIcon(256, 'icon-256x256.png');

// Copy 32x32 as favicon.ico and favicon.png
fs.copyFileSync(
  path.join(publicDir, 'favicon-32x32.png'),
  path.join(publicDir, 'favicon.ico')
);
fs.copyFileSync(
  path.join(publicDir, 'favicon-32x32.png'),
  path.join(publicDir, 'favicon.png')
);

console.log('All icons generated successfully!');