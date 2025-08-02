// Debug utilities for evidence-based debugging

// Global debug configuration
export const DEBUG_CONFIG = {
  enabled: process.env.NODE_ENV === 'development',
  logLevel: process.env.DEBUG_LEVEL || 'info',
  captureScreenshots: process.env.CAPTURE_SCREENSHOTS === 'true',
  saveToFile: process.env.SAVE_DEBUG_LOGS === 'true'
};

// Debug logger with structured output
export class DebugLogger {
  constructor(module) {
    this.module = module;
    this.logs = [];
  }

  log(level, message, data = {}) {
    if (!DEBUG_CONFIG.enabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      data,
      stack: new Error().stack
    };

    // Console output with color coding
    const colors = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[36m',
      debug: '\x1b[37m',
      success: '\x1b[32m'
    };

    const resetColor = '\x1b[0m';
    const color = colors[level] || colors.info;

    console.log(
      `${color}[${this.module}] ${level.toUpperCase()}:${resetColor} ${message}`,
      data
    );

    // Store for later analysis
    this.logs.push(logEntry);

    // Send to debug panel if available
    if (typeof window !== 'undefined' && window.__debugPanel) {
      window.__debugPanel.addLog(logEntry);
    }
  }

  error(message, data) {
    this.log('error', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  info(message, data) {
    this.log('info', message, data);
  }

  debug(message, data) {
    this.log('debug', message, data);
  }

  success(message, data) {
    this.log('success', message, data);
  }

  // Export logs for analysis
  exportLogs() {
    return {
      module: this.module,
      logs: this.logs,
      summary: {
        total: this.logs.length,
        errors: this.logs.filter(l => l.level === 'error').length,
        warnings: this.logs.filter(l => l.level === 'warn').length
      }
    };
  }
}

// API debugging wrapper
export function withApiDebug(handler, routeName) {
  const logger = new DebugLogger(`API:${routeName}`);

  return async (req, res) => {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();

    // Log request
    logger.info('Request received', {
      requestId,
      method: req.method,
      url: req.url,
      query: req.query,
      body: req.body,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']
      }
    });

    // Wrap response methods to capture data
    const originalJson = res.json;
    const originalStatus = res.status;
    let responseData = null;
    let statusCode = 200;

    res.status = function(code) {
      statusCode = code;
      return originalStatus.call(this, code);
    };

    res.json = function(data) {
      responseData = data;
      const duration = Date.now() - startTime;

      logger.info('Response sent', {
        requestId,
        statusCode,
        duration,
        dataSize: JSON.stringify(data).length
      });

      return originalJson.call(this, data);
    };

    try {
      await handler(req, res);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Request failed', {
        requestId,
        error: error.message,
        stack: error.stack,
        duration
      });

      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error',
          requestId,
          message: DEBUG_CONFIG.enabled ? error.message : undefined
        });
      }
    }
  };
}

// React component debugging HOC
export function withComponentDebug(Component, componentName) {
  if (!DEBUG_CONFIG.enabled) return Component;

  return function DebuggedComponent(props) {
    const logger = new DebugLogger(`Component:${componentName}`);
    const renderCount = React.useRef(0);
    const previousProps = React.useRef(props);

    React.useEffect(() => {
      renderCount.current++;
      
      // Log renders
      logger.debug('Component rendered', {
        renderCount: renderCount.current,
        props
      });

      // Log prop changes
      const changedProps = {};
      Object.keys(props).forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            old: previousProps.current[key],
            new: props[key]
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        logger.info('Props changed', changedProps);
      }

      previousProps.current = props;
    });

    // Add debug overlay in development
    if (DEBUG_CONFIG.enabled && typeof window !== 'undefined') {
      return (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: 'rgba(255, 0, 0, 0.7)',
              color: 'white',
              padding: '2px 5px',
              fontSize: '10px',
              zIndex: 9999,
              pointerEvents: 'none'
            }}
          >
            {componentName} ({renderCount.current})
          </div>
          <Component {...props} />
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// State debugging hook
export function useDebugState(initialState, stateName) {
  const [state, setState] = React.useState(initialState);
  const logger = new DebugLogger(`State:${stateName}`);

  const setDebugState = React.useCallback((newState) => {
    const actualNewState = typeof newState === 'function' 
      ? newState(state) 
      : newState;

    logger.info('State update', {
      old: state,
      new: actualNewState,
      type: typeof newState === 'function' ? 'updater' : 'value'
    });

    setState(newState);
  }, [state, logger]);

  // Log initial state
  React.useEffect(() => {
    logger.debug('State initialized', { initialState });
  }, []);

  return [state, setDebugState];
}

// Performance measurement utility
export class PerformanceMonitor {
  constructor(name) {
    this.name = name;
    this.marks = new Map();
    this.measures = [];
    this.logger = new DebugLogger(`Performance:${name}`);
  }

  mark(label) {
    const timestamp = performance.now();
    this.marks.set(label, timestamp);
    this.logger.debug(`Mark: ${label}`, { timestamp });
  }

  measure(label, startMark, endMark) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (!start) {
      this.logger.error(`Start mark not found: ${startMark}`);
      return;
    }

    const duration = end - start;
    const measure = { label, start, end, duration };
    this.measures.push(measure);

    this.logger.info(`Measure: ${label}`, {
      duration: `${duration.toFixed(2)}ms`,
      start: startMark,
      end: endMark || 'now'
    });

    // Warn if operation took too long
    if (duration > 1000) {
      this.logger.warn(`Slow operation: ${label} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  getReport() {
    return {
      name: this.name,
      measures: this.measures,
      summary: {
        total: this.measures.reduce((sum, m) => sum + m.duration, 0),
        average: this.measures.reduce((sum, m) => sum + m.duration, 0) / this.measures.length,
        slowest: this.measures.reduce((max, m) => m.duration > max.duration ? m : max, { duration: 0 })
      }
    };
  }
}

// Error boundary with debugging
export class DebugErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.logger = new DebugLogger('ErrorBoundary');
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.logger.error('Component error caught', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      props: this.props
    });

    this.setState({
      error,
      errorInfo
    });

    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Sentry, LogRocket, etc.
    }
  }

  render() {
    if (this.state.hasError) {
      if (DEBUG_CONFIG.enabled) {
        return (
          <div style={{ padding: '20px', background: '#fee', border: '1px solid #fcc' }}>
            <h2>Debug: Component Error</h2>
            <details style={{ whiteSpace: 'pre-wrap' }}>
              <summary>Error Details</summary>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </details>
          </div>
        );
      }

      return <div>Something went wrong. Please refresh the page.</div>;
    }

    return this.props.children;
  }
}

// Network request debugging
export async function debugFetch(url, options = {}) {
  const logger = new DebugLogger('Network');
  const requestId = Math.random().toString(36).substring(7);
  const startTime = performance.now();

  logger.info('Fetch request', {
    requestId,
    url,
    method: options.method || 'GET',
    headers: options.headers
  });

  try {
    const response = await fetch(url, options);
    const duration = performance.now() - startTime;

    logger.info('Fetch response', {
      requestId,
      status: response.status,
      statusText: response.statusText,
      duration: `${duration.toFixed(2)}ms`,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      logger.error('Fetch failed', {
        requestId,
        status: response.status,
        statusText: response.statusText
      });
    }

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error('Fetch error', {
      requestId,
      error: error.message,
      duration: `${duration.toFixed(2)}ms`
    });
    
    throw error;
  }
}

// Debug data inspector
export function DebugInspector({ data, title = 'Debug Data' }) {
  if (!DEBUG_CONFIG.enabled) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      maxWidth: 400,
      maxHeight: 300,
      overflow: 'auto',
      background: 'rgba(0, 0, 0, 0.8)',
      color: '#0f0',
      padding: 10,
      borderRadius: 5,
      fontFamily: 'monospace',
      fontSize: 12,
      zIndex: 10000
    }}>
      <div style={{ marginBottom: 10, fontWeight: 'bold' }}>{title}</div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

// Export all logs to file
export function exportDebugLogs() {
  const allLogs = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    logs: window.__allDebugLogs || []
  };

  const blob = new Blob([JSON.stringify(allLogs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `debug-logs-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}