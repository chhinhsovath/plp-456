const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const publicDir = path.join(__dirname, '..', 'public');

// Create a simple favicon
const size = 32;
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
ctx.roundRect(0, 0, size, size, size * 0.2);
ctx.fill();
ctx.globalCompositeOperation = 'source-over';

// Add text
ctx.fillStyle = 'white';
ctx.font = 'bold 20px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('P', size / 2, size / 2);

// Save as favicon.ico (actually a PNG, but browsers accept it)
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), buffer);

console.log('Created favicon.ico successfully!');