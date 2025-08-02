const fs = require('fs');
const path = require('path');

// Function to update gutter spacing
function updateGutterSpacing(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Replace gutter={[16, 16]} with gutter={[32, 32]}
  if (content.includes('gutter={[16, 16]}')) {
    content = content.replace(/gutter=\{\[16, 16\]\}/g, 'gutter={[32, 32]}');
    updated = true;
  }
  
  // Replace gutter={[16, 24]} with gutter={[32, 32]}
  if (content.includes('gutter={[16, 24]}')) {
    content = content.replace(/gutter=\{\[16, 24\]\}/g, 'gutter={[32, 32]}');
    updated = true;
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated gutter spacing in: ${filePath}`);
    return true;
  }
  
  return false;
}

// Function to find all TSX files recursively
function findTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTsxFiles(filePath, fileList);
    } else if (file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Find all TypeScript/TSX files in dashboard
const dashboardDir = path.join(__dirname, '../app/dashboard');
const files = findTsxFiles(dashboardDir);

console.log(`Found ${files.length} TSX files in dashboard directory\n`);

let updatedCount = 0;
files.forEach(file => {
  if (updateGutterSpacing(file)) {
    updatedCount++;
  }
});

console.log(`\n✨ Updated gutter spacing in ${updatedCount} files!`);