const fs = require('fs');
const path = require('path');

// Files to fix
const filesToFix = [
  'app/dashboard/observations/new/page.tsx',
  'app/dashboard/observations/[id]/page.tsx',
];

filesToFix.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the useEffect pattern
  content = content.replace(
    /if \(!session\) \{\s*router\.push\('\/login'\);\s*return;\s*\}/g,
    `if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }`
  );
  
  // Fix fetch calls to include credentials
  content = content.replace(
    /await fetch\((['`][^'`]+['`])\)/g,
    'await fetch($1, { credentials: \'include\' })'
  );
  
  // Fix fetch calls that already have options
  content = content.replace(
    /await fetch\((['`][^'`]+['`]), \{([^}]+)\}\)/g,
    (match, url, options) => {
      if (!options.includes('credentials')) {
        return `await fetch(${url}, {${options}, credentials: 'include' })`;
      }
      return match;
    }
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${file}`);
});

console.log('Done!');