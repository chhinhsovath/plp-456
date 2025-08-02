# Evidence-Based Debugging Workflow

## Overview
This document outlines the systematic approach to debugging issues in the PLP-456 application using evidence collection, analysis, and layer-by-layer resolution.

## Core Principles

### 1. Fix Deepest Layer First
- **Logic before styling**: Fix data/state issues before UI
- **Inside-out approach**: Core functionality → API → UI → Styling
- **State management**: Trace data flow from source to display

### 2. Evidence Collection Strategy

#### Browser DevTools Setup
```javascript
// Enable verbose logging in development
if (process.env.NODE_ENV === 'development') {
  window.DEBUG = {
    api: true,
    state: true,
    render: true,
    performance: true
  };
}
```

#### Console Logging Standards
```javascript
// Use structured logging
console.group('🔍 Component: UserProfile');
console.log('Props:', props);
console.log('State:', state);
console.log('Computed:', computedValues);
console.groupEnd();

// API call logging
console.log('🌐 API Call:', {
  method: 'GET',
  endpoint: '/api/users/123',
  timestamp: new Date().toISOString()
});
```

## Debugging Layers

### Layer 1: Data Layer (Deepest)

#### Database Issues
```bash
# Check database state
npm run prisma:studio

# Verify migrations
npx prisma migrate status

# Test queries directly
npx prisma db execute --file test-query.sql
```

#### Evidence Collection
```javascript
// Add debug middleware for database queries
const prismaDebug = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Log all database operations
prismaDebug.$on('query', (e) => {
  console.log('Query: ', e.query);
  console.log('Params: ', e.params);
  console.log('Duration: ', e.duration);
});
```

### Layer 2: API Layer

#### Request/Response Debugging
```javascript
// API route debugging wrapper
export function withDebug(handler) {
  return async (req, res) => {
    const start = Date.now();
    console.log(`📥 ${req.method} ${req.url}`, {
      body: req.body,
      query: req.query,
      headers: req.headers
    });
    
    const originalJson = res.json;
    res.json = function(data) {
      console.log(`📤 Response:`, {
        status: res.statusCode,
        duration: Date.now() - start,
        data
      });
      originalJson.call(this, data);
    };
    
    try {
      await handler(req, res);
    } catch (error) {
      console.error(`❌ API Error:`, error);
      res.status(500).json({ error: error.message });
    }
  };
}
```

#### Testing API Layer
```bash
# Use the API test suite
npm run test:api

# Test individual endpoints
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

### Layer 3: State Management

#### React State Debugging
```javascript
// Custom hook for state debugging
function useDebugState(initialState, name) {
  const [state, setState] = React.useState(initialState);
  
  React.useEffect(() => {
    console.log(`🔄 State Update [${name}]:`, state);
  }, [state, name]);
  
  const setStateWithLog = React.useCallback((newState) => {
    console.log(`🔧 Setting State [${name}]:`, {
      old: state,
      new: newState
    });
    setState(newState);
  }, [state, name]);
  
  return [state, setStateWithLog];
}
```

#### React DevTools Setup
1. Install React DevTools browser extension
2. Enable "Highlight updates when components render"
3. Use Profiler to identify performance issues
4. Track component props and state changes

### Layer 4: UI Layer

#### Component Debugging
```javascript
// Debug wrapper component
const DebugWrapper = ({ children, name }) => {
  const renderCount = useRef(0);
  renderCount.current++;
  
  useEffect(() => {
    console.log(`🎨 Render [${name}]: ${renderCount.current}`);
  });
  
  if (process.env.NODE_ENV === 'development') {
    return (
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: 'red',
          color: 'white',
          padding: '2px 5px',
          fontSize: '10px',
          zIndex: 9999
        }}>
          {name} ({renderCount.current})
        </div>
        {children}
      </div>
    );
  }
  
  return children;
};
```

#### Visual Debugging with Puppeteer
```javascript
// Automated visual regression testing
const captureUIState = async (page, scenario) => {
  // Capture screenshots at different states
  await page.screenshot({ 
    path: `evidence/ui/${scenario}-initial.png`,
    fullPage: true 
  });
  
  // Interact with UI
  await page.click('.submit-button');
  await page.waitForTimeout(1000);
  
  // Capture after interaction
  await page.screenshot({ 
    path: `evidence/ui/${scenario}-after-click.png`,
    fullPage: true 
  });
  
  // Capture console logs
  const logs = await page.evaluate(() => window.consoleLogs || []);
  fs.writeFileSync(
    `evidence/ui/${scenario}-console.json`,
    JSON.stringify(logs, null, 2)
  );
};
```

## Debugging Workflow

### Step 1: Reproduce the Issue
```javascript
// Create a minimal test case
describe('Bug Reproduction', () => {
  it('should reproduce the issue', async () => {
    // 1. Set up initial state
    // 2. Perform actions
    // 3. Assert expected vs actual
    // 4. Capture evidence
  });
});
```

### Step 2: Collect Evidence
```bash
# Run evidence collection
npm run test:e2e -- --grep "Bug Reproduction"

# Check evidence directory
ls -la tests/puppeteer/evidence/
```

### Step 3: Analyze from Bottom Up
1. Check database state
2. Verify API responses
3. Trace state changes
4. Inspect UI behavior
5. Review styling issues

### Step 4: Implement Fix
```javascript
// Document the fix with comments
// BUG FIX: Issue #123 - User profile not updating
// Root cause: Stale cache in API layer
// Solution: Invalidate cache on profile update
```

### Step 5: Verify Fix
```bash
# Run focused tests
npm test -- --grep "profile update"

# Run full test suite
npm test

# Manual verification with evidence
npm run test:e2e
```

## Common Debugging Patterns

### Pattern 1: API Not Returning Expected Data
```javascript
// Debug checklist:
// 1. Check network tab for actual response
// 2. Verify database has correct data
// 3. Check API query parameters
// 4. Verify authentication/permissions
// 5. Check for caching issues

// Add temporary debug endpoint
app.get('/api/debug/user/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { _count: true }
  });
  res.json({ user, cache: getCacheStatus() });
});
```

### Pattern 2: State Not Updating in UI
```javascript
// Debug checklist:
// 1. Verify API call succeeds
// 2. Check if state setter is called
// 3. Verify no errors in console
// 4. Check for stale closures
// 5. Verify component re-renders

// Add debug hooks
useEffect(() => {
  console.log('Dependencies changed:', { user, loading, error });
}, [user, loading, error]);
```

### Pattern 3: Intermittent Failures
```javascript
// Add retry logic with logging
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1} for ${url}`);
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## Evidence Storage Structure
```
evidence/
├── screenshots/
│   ├── bug-123-before.png
│   ├── bug-123-after.png
│   └── bug-123-error-state.png
├── logs/
│   ├── console-2024-01-15.json
│   ├── network-2024-01-15.har
│   └── performance-2024-01-15.json
├── database/
│   ├── schema-snapshot.sql
│   ├── data-dump.sql
│   └── query-results.json
└── reports/
    ├── bug-123-analysis.md
    └── bug-123-resolution.md
```

## Debug Mode Implementation
```javascript
// Enable debug mode via URL parameter
// http://localhost:3000?debug=true

// components/DebugPanel.jsx
export function DebugPanel() {
  if (!window.location.search.includes('debug=true')) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 right-0 bg-black text-white p-4 z-50">
      <h3>Debug Panel</h3>
      <button onClick={() => console.log(store.getState())}>
        Log State
      </button>
      <button onClick={() => localStorage.clear()}>
        Clear Storage
      </button>
      <button onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  );
}
```

## Performance Debugging
```javascript
// Measure component render time
function measurePerformance(Component) {
  return function MeasuredComponent(props) {
    const start = performance.now();
    
    useEffect(() => {
      const duration = performance.now() - start;
      if (duration > 16) { // Longer than one frame
        console.warn(`Slow render: ${Component.name} took ${duration}ms`);
      }
    });
    
    return <Component {...props} />;
  };
}
```

## Debugging Checklist

### Before Starting
- [ ] Can reproduce the issue consistently
- [ ] Have clear expected vs actual behavior
- [ ] Checked browser console for errors
- [ ] Checked network tab for failed requests
- [ ] Verified not a browser/extension issue

### During Debugging
- [ ] Started from deepest layer (data)
- [ ] Collected evidence at each layer
- [ ] Documented findings
- [ ] Used proper debugging tools
- [ ] Avoided making assumptions

### After Fixing
- [ ] Root cause identified and documented
- [ ] Fix implemented at appropriate layer
- [ ] Added tests to prevent regression
- [ ] Updated documentation if needed
- [ ] Verified fix in multiple scenarios

## Emergency Debugging

### Production Issues
```bash
# Quick diagnostics
curl https://api.example.com/health
curl https://api.example.com/api/debug/status

# Check logs
heroku logs --tail --app plp-456
vercel logs plp-456 --follow

# Database state
heroku pg:psql --app plp-456
```

### Rollback Procedure
```bash
# Git rollback
git revert HEAD
git push origin main

# Deployment rollback
vercel rollback plp-456
heroku rollback --app plp-456
```

Remember: Always collect evidence before making changes!