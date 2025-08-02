import { errorLogger } from './error-logger';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitter?: boolean;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
  onMaxAttemptsReached?: (error: any) => void;
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringWindow?: number;
}

// Default retry configuration
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true,
  retryCondition: (error: any) => {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'TIMEOUT' ||
      (error.statusCode >= 500 && error.statusCode < 600) ||
      error.name === 'AbortError' ||
      error.name === 'TimeoutError'
    );
  },
  onRetry: () => {},
  onMaxAttemptsReached: () => {},
};

// Circuit breaker states
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private readonly options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      resetTimeout: options.resetTimeout ?? 60000, // 1 minute
      monitoringWindow: options.monitoringWindow ?? 300000, // 5 minutes
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = CircuitState.CLOSED;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (
      this.failureCount >= this.options.failureThreshold ||
      this.state === CircuitState.HALF_OPEN
    ) {
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.successCount = 0;
  }
}

// Global circuit breakers for different services
const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker(options));
  }
  return circuitBreakers.get(name)!;
}

// Retry with exponential backoff and jitter
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if condition is not met
      if (!config.retryCondition(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === config.maxAttempts) {
        config.onMaxAttemptsReached(error);
        throw error;
      }

      // Calculate delay with exponential backoff and optional jitter
      const baseDelay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );

      const delay = config.jitter
        ? baseDelay + Math.random() * baseDelay * 0.1
        : baseDelay;

      // Call retry callback
      config.onRetry(attempt, error);

      // Log retry attempt
      await errorLogger.warn(
        `Retrying operation after failure (attempt ${attempt}/${config.maxAttempts})`,
        {
          attempt,
          maxAttempts: config.maxAttempts,
          delay,
          error: error.message,
          errorCode: error.code || error.name,
        }
      );

      // Wait before next attempt
      await sleep(delay);
    }
  }

  throw lastError;
}

// Retry with circuit breaker
export async function retryWithCircuitBreaker<T>(
  operation: () => Promise<T>,
  circuitBreakerName: string,
  retryOptions: RetryOptions = {},
  circuitBreakerOptions: CircuitBreakerOptions = {}
): Promise<T> {
  const circuitBreaker = getCircuitBreaker(circuitBreakerName, circuitBreakerOptions);

  return retry(
    () => circuitBreaker.execute(operation),
    {
      ...retryOptions,
      retryCondition: (error) => {
        // Don't retry if circuit breaker is open
        if (error.message === 'Circuit breaker is OPEN') {
          return false;
        }
        return retryOptions.retryCondition?.(error) ?? DEFAULT_RETRY_OPTIONS.retryCondition(error);
      },
    }
  );
}

// Specialized retry functions for different scenarios

// Database operations
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  return retry(operation, {
    maxAttempts: 3,
    baseDelay: 1000,
    backoffFactor: 1.5,
    retryCondition: (error) => {
      // Retry on connection errors, timeouts, and deadlocks
      return (
        error.code === 'P1001' || // Connection error
        error.code === 'P1008' || // Timeout
        error.code === 'P2034' || // Transaction conflict
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('ETIMEDOUT') ||
        error.message?.includes('ENOTFOUND')
      );
    },
    ...options,
  });
}

// HTTP requests
export async function retryHttpRequest<T>(
  request: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  return retry(request, {
    maxAttempts: 3,
    baseDelay: 1000,
    retryCondition: (error) => {
      const status = error.response?.status || error.statusCode;
      return (
        // Network errors
        error.code === 'ECONNRESET' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNREFUSED' ||
        // HTTP 5xx errors
        (status >= 500 && status < 600) ||
        // Rate limiting
        status === 429
      );
    },
    ...options,
  });
}

// File operations
export async function retryFileOperation<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  return retry(operation, {
    maxAttempts: 5,
    baseDelay: 500,
    backoffFactor: 1.2,
    retryCondition: (error) => {
      return (
        error.code === 'EBUSY' ||
        error.code === 'EMFILE' ||
        error.code === 'ENFILE' ||
        error.code === 'ENOENT' ||
        error.code === 'EPERM'
      );
    },
    ...options,
  });
}

// External API calls with circuit breaker
export async function retryExternalApiCall<T>(
  apiCall: () => Promise<T>,
  serviceName: string,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  return retryWithCircuitBreaker(
    apiCall,
    `external-api-${serviceName}`,
    {
      maxAttempts: 3,
      baseDelay: 2000,
      maxDelay: 10000,
      ...options,
    },
    {
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
    }
  );
}

// Bulk operations with partial retry
export async function retryBulkOperation<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  options: {
    maxAttempts?: number;
    concurrency?: number;
    continueOnError?: boolean;
    retryIndividualItems?: boolean;
  } = {}
): Promise<{ results: R[]; errors: Array<{ item: T; error: any }> }> {
  const {
    maxAttempts = 3,
    concurrency = 5,
    continueOnError = true,
    retryIndividualItems = true,
  } = options;

  const results: R[] = [];
  const errors: Array<{ item: T; error: any }> = [];
  const semaphore = new Semaphore(concurrency);

  const processItem = async (item: T): Promise<void> => {
    await semaphore.acquire();
    try {
      const operationWithRetry = retryIndividualItems
        ? () => retry(() => operation(item), { maxAttempts })
        : () => operation(item);

      const result = await operationWithRetry();
      results.push(result);
    } catch (error) {
      errors.push({ item, error });
      if (!continueOnError) {
        throw error;
      }
    } finally {
      semaphore.release();
    }
  };

  await Promise.all(items.map(processItem));

  return { results, errors };
}

// Semaphore for concurrency control
class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release(): void {
    this.permits++;
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      this.permits--;
      next();
    }
  }
}

// Utility function for sleep
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Timeout wrapper
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}

// Rate limiter
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async acquire(tokens = 1): Promise<void> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }

    // Wait until enough tokens are available
    const waitTime = ((tokens - this.tokens) / this.refillRate) * 1000;
    await sleep(waitTime);
    await this.acquire(tokens);
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / 1000) * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// React hook for retry operations (to be used in components)
// Note: This should be moved to a separate hooks file for client-side use
export interface UseRetryReturn {
  retryOperation: <T>(operation: () => Promise<T>, options?: RetryOptions) => Promise<T>;
  isRetrying: boolean;
  retryCount: number;
}