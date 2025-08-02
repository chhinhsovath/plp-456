import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  retry,
  retryDatabaseOperation,
  retryHttpRequest,
  retryWithCircuitBreaker,
  getCircuitBreaker,
  withTimeout,
  RateLimiter,
} from '@/lib/retry';

// Mock the error logger
jest.mock('@/lib/error-logger', () => ({
  errorLogger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Retry Mechanisms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Retry Function', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await retry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const retryPromise = retry(operation, {
        maxAttempts: 2,
        baseDelay: 100,
        retryCondition: (error) => error.message.includes('Network'),
      });

      // Fast-forward timers to complete the delay
      jest.advanceTimersByTime(200);
      
      const result = await retryPromise;
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable error', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Validation error'));
      
      await expect(retry(operation, {
        retryCondition: (error) => error.message.includes('Network'),
      })).rejects.toThrow('Validation error');
      
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should fail after max attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const retryPromise = retry(operation, {
        maxAttempts: 3,
        baseDelay: 100,
        retryCondition: (error) => error.message.includes('Network'),
      });

      // Fast-forward timers for all retry attempts
      jest.advanceTimersByTime(1000);
      
      await expect(retryPromise).rejects.toThrow('Network error');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should call retry callback', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const onRetry = jest.fn();
      
      const retryPromise = retry(operation, {
        maxAttempts: 2,
        baseDelay: 100,
        onRetry,
        retryCondition: (error) => error.message.includes('Network'),
      });

      jest.advanceTimersByTime(200);
      await retryPromise;
      
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should call max attempts reached callback', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));
      const onMaxAttemptsReached = jest.fn();
      
      const retryPromise = retry(operation, {
        maxAttempts: 2,
        baseDelay: 100,
        onMaxAttemptsReached,
        retryCondition: (error) => error.message.includes('Network'),
      });

      jest.advanceTimersByTime(500);
      
      await expect(retryPromise).rejects.toThrow();
      expect(onMaxAttemptsReached).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Exponential Backoff', () => {
    it('should increase delay exponentially', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = jest.fn().mockImplementation((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      });

      const retryPromise = retry(operation, {
        maxAttempts: 3,
        baseDelay: 1000,
        backoffFactor: 2,
        jitter: false,
        retryCondition: (error) => error.message.includes('Network'),
      });

      jest.advanceTimersByTime(10000);
      await retryPromise;
      
      expect(delays).toEqual([1000, 2000]); // 1s, 2s
      
      global.setTimeout = originalSetTimeout;
    });

    it('should respect max delay', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = jest.fn().mockImplementation((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      });

      const retryPromise = retry(operation, {
        maxAttempts: 3,
        baseDelay: 1000,
        backoffFactor: 10,
        maxDelay: 5000,
        jitter: false,
        retryCondition: (error) => error.message.includes('Network'),
      });

      jest.advanceTimersByTime(20000);
      await retryPromise;
      
      expect(delays[1]).toBeLessThanOrEqual(5000);
      
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('Database Operation Retry', () => {
    it('should retry on connection errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce({ code: 'P1001' }) // Connection error
        .mockResolvedValue('success');
      
      const retryPromise = retryDatabaseOperation(operation);
      jest.advanceTimersByTime(2000);
      
      const result = await retryPromise;
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on data validation errors', async () => {
      const operation = jest.fn().mockRejectedValue({ code: 'P2002' }); // Unique constraint
      
      await expect(retryDatabaseOperation(operation)).rejects.toEqual({ code: 'P2002' });
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('HTTP Request Retry', () => {
    it('should retry on 500 errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockResolvedValue('success');
      
      const retryPromise = retryHttpRequest(operation);
      jest.advanceTimersByTime(2000);
      
      const result = await retryPromise;
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on rate limiting', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce({ response: { status: 429 } })
        .mockResolvedValue('success');
      
      const retryPromise = retryHttpRequest(operation);
      jest.advanceTimersByTime(2000);
      
      const result = await retryPromise;
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 400 errors', async () => {
      const operation = jest.fn().mockRejectedValue({ response: { status: 400 } });
      
      await expect(retryHttpRequest(operation)).rejects.toEqual({ response: { status: 400 } });
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Circuit Breaker', () => {
    it('should allow requests when circuit is closed', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await retryWithCircuitBreaker(
        operation,
        'test-service',
        { maxAttempts: 1 }
      );
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should open circuit after failure threshold', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service error'));
      const circuitBreaker = getCircuitBreaker('test-service-fail', { failureThreshold: 2 });
      
      // First failure
      await expect(retryWithCircuitBreaker(
        operation,
        'test-service-fail',
        { maxAttempts: 1 }
      )).rejects.toThrow();
      
      // Second failure - should open circuit
      await expect(retryWithCircuitBreaker(
        operation,
        'test-service-fail',
        { maxAttempts: 1 }
      )).rejects.toThrow();
      
      // Third attempt should be blocked by open circuit
      await expect(retryWithCircuitBreaker(
        operation,
        'test-service-fail',
        { maxAttempts: 1 }
      )).rejects.toThrow('Circuit breaker is OPEN');
      
      expect(circuitBreaker.getState()).toBe('OPEN');
    });
  });

  describe('Timeout Wrapper', () => {
    it('should resolve when promise completes before timeout', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 100));
      
      const result = await withTimeout(promise, 200);
      expect(result).toBe('success');
    });

    it('should reject when promise times out', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 200));
      
      await expect(withTimeout(promise, 100)).rejects.toThrow('Operation timed out');
    });

    it('should use custom timeout message', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 200));
      
      await expect(withTimeout(promise, 100, 'Custom timeout')).rejects.toThrow('Custom timeout');
    });
  });

  describe('Rate Limiter', () => {
    it('should allow requests within capacity', async () => {
      const rateLimiter = new RateLimiter(10, 1); // 10 tokens, 1 per second
      
      await expect(rateLimiter.acquire(5)).resolves.toBeUndefined();
      await expect(rateLimiter.acquire(5)).resolves.toBeUndefined();
    });

    it('should delay requests when capacity exceeded', async () => {
      const rateLimiter = new RateLimiter(5, 1); // 5 tokens, 1 per second
      
      // Consume all tokens
      await rateLimiter.acquire(5);
      
      // This should require waiting
      const startTime = Date.now();
      const acquirePromise = rateLimiter.acquire(1);
      
      // Fast-forward timer
      jest.advanceTimersByTime(1000);
      
      await acquirePromise;
      
      // Should have waited for token refill
      expect(Date.now() - startTime).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle operation that throws non-Error objects', async () => {
      const operation = jest.fn().mockRejectedValue('string error');
      
      await expect(retry(operation, { maxAttempts: 1 })).rejects.toBe('string error');
    });

    it('should handle zero max attempts', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      await expect(retry(operation, { maxAttempts: 0 })).rejects.toThrow();
    });

    it('should handle negative base delay', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const retryPromise = retry(operation, {
        maxAttempts: 2,
        baseDelay: -100,
        retryCondition: () => true,
      });

      jest.advanceTimersByTime(100);
      const result = await retryPromise;
      
      expect(result).toBe('success');
    });
  });
});