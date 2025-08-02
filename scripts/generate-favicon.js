const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const ICO = require('ico-js');

async function generateFavicon() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Read the PNG files we created
  const sizes = [16, 32, 48];
  const images = [];
  
  for (const size of sizes) {
    const pngPath = path.join(publicDir, `favicon-${size}x${size}.png`);
    
    if (fs.existsSync(pngPath)) {
      const buffer = fs.readFileSync(pngPath);
      images.push({
        width: size,
        height: size,
        data: buffer
      });
    } else {
      // If PNG doesn't exist, create it
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, '#1890ff');
      gradient.addColorStop(1, '#0050b3');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Add text
      ctx.fillStyle = 'white';
      ctx.font = `bold ${size * 0.5}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', size / 2, size / 2);

      const buffer = canvas.toBuffer('image/png');
      images.push({
        width: size,
        height: size,
        data: buffer
      });
    }
  }
  
  // For now, just copy the 32x32 PNG as favicon.ico
  // since ico-js requires specific format
  const favicon32Path = path.join(publicDir, 'favicon-32x32.png');
  const faviconPath = path.join(publicDir, 'favicon.ico');
  
  if (fs.existsSync(favicon32Path)) {
    fs.copyFileSync(favicon32Path, faviconPath);
    console.log('Created favicon.ico (using 32x32 PNG)');
  }
}

generateFavicon().catch(console.error);