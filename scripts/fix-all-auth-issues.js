const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all files that import useSession
const files = glob.sync('app/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**']
});

let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Skip if no useSession
  if (!content.includes('useSession')) {
    return;
  }
  
  // Fix all fetch calls to include credentials
  if (content.includes('fetch(') && !content.includes('credentials:')) {
    content = content.replace(
      /fetch\(([^,)]+)\)/g,
      'fetch($1, { credentials: \'include\' })'
    );
    
    // Fix fetch calls that already have options but no credentials
    content = content.replace(
      /fetch\(([^,]+),\s*\{([^}]+)\}\)/g,
      (match, url, options) => {
        if (!options.includes('credentials')) {
          const cleanOptions = options.trim();
          if (cleanOptions.endsWith(',')) {
            return `fetch(${url}, { ${options} credentials: 'include' })`;
          } else {
            return `fetch(${url}, { ${options}, credentials: 'include' })`;
          }
        }
        return match;
      }
    );
    modified = true;
  }
  
  // Fix session checks to use status instead of !session
  if (content.includes('if (!session)') || content.includes('if (session)')) {
    content = content.replace(
      /if \(!session\) \{/g,
      'if (status === \'unauthenticated\') {'
    );
    content = content.replace(
      /if \(session\) \{/g,
      'if (status === \'authenticated\') {'
    );
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`Fixed: ${file}`);
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} files!`);