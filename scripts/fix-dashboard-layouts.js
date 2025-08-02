const fs = require('fs');
const path = require('path');

// Function to find all page.tsx files recursively
function findPageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findPageFiles(filePath, fileList);
    } else if (file === 'page.tsx') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to update layout wrapper
function updateLayoutWrapper(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Skip if already updated
  if (content.includes('min-h-screen w-full bg-gray-50')) {
    console.log(`✓ Already updated: ${filePath}`);
    return;
  }
  
  // Pattern to match return statements with simple div wrappers
  const patterns = [
    {
      // Match return ( <div> or return ( <div className="...">
      regex: /return\s*\(\s*<div(\s+className="[^"]*")?\s*>/,
      replacement: 'return (\n    <div className="min-h-screen w-full bg-gray-50">\n      <div className="w-full p-6 lg:p-8">'
    },
    {
      // Match simple closing </div> ); at end of component
      regex: /(\s*)<\/div>\s*\);\s*}/,
      replacement: '$1  </div>\n$1</div>\n  );\n}'
    }
  ];
  
  // Apply first pattern
  if (patterns[0].regex.test(content)) {
    content = content.replace(patterns[0].regex, patterns[0].replacement);
    updated = true;
  }
  
  // Apply second pattern only if first was successful
  if (updated && patterns[1].regex.test(content)) {
    content = content.replace(patterns[1].regex, patterns[1].replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } else if (updated) {
    console.log(`⚠️  Partially updated (needs manual check): ${filePath}`);
  } else {
    console.log(`❌ Skipped (different structure): ${filePath}`);
  }
}

// Main execution
const dashboardDir = path.join(__dirname, '../app/dashboard');
const pageFiles = findPageFiles(dashboardDir);

console.log(`Found ${pageFiles.length} page.tsx files in dashboard directory\n`);

// Skip admin page since it's already updated
const filesToUpdate = pageFiles.filter(file => !file.includes('/admin/page.tsx'));

filesToUpdate.forEach(file => {
  updateLayoutWrapper(file);
});

console.log('\n✨ Layout update complete!');