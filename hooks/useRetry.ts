'use client';

import { useState, useCallback } from 'react';
import { message } from 'antd';
import { getUserFriendlyErrorMessage } from '@/lib/error-messages';
import { logClientErrorToServer } from '@/lib/error-logger';

export interface UseRetryOptions {
  maxAttempts?: number;
  onRetry?: (attempt: number, error: any) => void;
  onMaxAttemptsReached?: (error: any) => void;
  showErrorMessages?: boolean;
  retryCondition?: (error: any) => boolean;
}

export interface UseRetryReturn {
  execute: <T>(operation: () => Promise<T>, options?: UseRetryOptions) => Promise<T>;
  isLoading: boolean;
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
  reset: () => void;
}

export function useRetry(defaultOptions?: UseRetryOptions): UseRetryReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsRetrying(false);
    setRetryCount(0);
    setLastError(null);
  }, []);

  const execute = useCallback(
    async <T>(operation: () => Promise<T>, options?: UseRetryOptions): Promise<T> => {
      const config = { 
        maxAttempts: 3,
        showErrorMessages: true,
        retryCondition: (error: any) => {
          // Default retry condition: network errors and 5xx server errors
          return (
            error.code === 'NETWORK_ERROR' ||
            error.name === 'NetworkError' ||
            (error.response?.status >= 500 && error.response?.status < 600) ||
            error.message?.includes('fetch')
          );
        },
        ...defaultOptions,
        ...options,
      };

      setIsLoading(true);
      setLastError(null);
      setRetryCount(0);

      let lastError: any;

      for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
        try {
          if (attempt > 1) {
            setIsRetrying(true);
            setRetryCount(attempt - 1);
            config.onRetry?.(attempt - 1, lastError);
          }

          const result = await operation();
          
          // Success - reset state
          setIsLoading(false);
          setIsRetrying(false);
          setRetryCount(0);
          setLastError(null);
          
          return result;
        } catch (error) {
          lastError = error;
          setLastError(error as Error);

          // Log client error to server
          await logClientErrorToServer({
            message: (error as Error).message,
            stack: (error as Error).stack,
            url: window.location.href,
            userAgent: navigator.userAgent,
          });

          // Don't retry if condition is not met
          if (!config.retryCondition(error)) {
            setIsLoading(false);
            setIsRetrying(false);
            
            if (config.showErrorMessages) {
              const friendlyError = getUserFriendlyErrorMessage(
                (error as any).code || 'UNKNOWN_ERROR',
                (error as Error).message
              );
              message.error(friendlyError.message);
            }
            
            throw error;
          }

          // Don't retry on last attempt
          if (attempt === config.maxAttempts) {
            setIsLoading(false);
            setIsRetrying(false);
            config.onMaxAttemptsReached?.(error);
            
            if (config.showErrorMessages) {
              const friendlyError = getUserFriendlyErrorMessage(
                (error as any).code || 'UNKNOWN_ERROR',
                (error as Error).message
              );
              message.error(`${friendlyError.message} (បានព្យាយាម ${config.maxAttempts} ដង)`);
            }
            
            throw error;
          }

          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw lastError;
    },
    [defaultOptions]
  );

  return {
    execute,
    isLoading,
    isRetrying,
    retryCount,
    lastError,
    reset,
  };
}

// Specialized hooks for common operations

export function useApiCall() {
  return useRetry({
    maxAttempts: 3,
    retryCondition: (error) => {
      const status = error.response?.status || error.status;
      return (
        // Network errors
        error.name === 'NetworkError' ||
        error.code === 'NETWORK_ERROR' ||
        // Server errors
        (status >= 500 && status < 600) ||
        // Rate limiting
        status === 429
      );
    },
  });
}

export function useFileUpload() {
  return useRetry({
    maxAttempts: 2,
    retryCondition: (error) => {
      const status = error.response?.status || error.status;
      return (
        error.name === 'NetworkError' ||
        status === 408 || // Request Timeout
        status === 502 || // Bad Gateway
        status === 503 || // Service Unavailable
        status === 504    // Gateway Timeout
      );
    },
  });
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>() {
  const [optimisticState, setOptimisticState] = useState<T | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeOptimistically = useCallback(
    async (
      optimisticValue: T,
      operation: () => Promise<T>,
      options?: {
        onSuccess?: (result: T) => void;
        onError?: (error: Error) => void;
        revert?: boolean;
      }
    ): Promise<T | null> => {
      const { onSuccess, onError, revert = true } = options || {};

      // Apply optimistic update
      setOptimisticState(optimisticValue);
      setIsPending(true);
      setError(null);

      try {
        const result = await operation();
        
        // Success - update with real result
        setOptimisticState(result);
        setIsPending(false);
        onSuccess?.(result);
        
        return result;
      } catch (error) {
        setError(error as Error);
        setIsPending(false);
        
        // Revert optimistic update on error
        if (revert) {
          setOptimisticState(null);
        }
        
        onError?.(error as Error);
        
        // Show user-friendly error message
        const friendlyError = getUserFriendlyErrorMessage(
          (error as any).code || 'UNKNOWN_ERROR',
          (error as Error).message
        );
        message.error(friendlyError.message);
        
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setOptimisticState(null);
    setIsPending(false);
    setError(null);
  }, []);

  return {
    optimisticState,
    isPending,
    error,
    executeOptimistically,
    reset,
  };
}

// Hook for handling form submissions with error handling
export function useFormSubmission<T = any>() {
  const { execute, isLoading, lastError } = useRetry({
    maxAttempts: 1, // Forms usually shouldn't auto-retry
    showErrorMessages: false, // Handle form errors manually
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submitForm = useCallback(
    async (
      operation: () => Promise<T>,
      options?: {
        onSuccess?: (result: T) => void;
        onError?: (error: any) => void;
        validateBeforeSubmit?: () => boolean;
      }
    ): Promise<T | null> => {
      const { onSuccess, onError, validateBeforeSubmit } = options || {};

      // Clear previous errors
      setFieldErrors({});

      // Pre-submission validation
      if (validateBeforeSubmit && !validateBeforeSubmit()) {
        return null;
      }

      try {
        const result = await execute(operation);
        onSuccess?.(result);
        message.success('ប្រតិបត្តិការបានបញ្ចប់ដោយជោគជ័យ');
        return result;
      } catch (error: any) {
        // Handle validation errors
        if (error.code === 'VALIDATION_ERROR' && error.details) {
          const errors: Record<string, string> = {};
          error.details.forEach((detail: any) => {
            errors[detail.field] = detail.message;
          });
          setFieldErrors(errors);
        } else {
          // Handle other errors
          const friendlyError = getUserFriendlyErrorMessage(
            error.code || 'UNKNOWN_ERROR',
            error.message
          );
          message.error(friendlyError.message);
        }

        onError?.(error);
        return null;
      }
    },
    [execute]
  );

  return {
    submitForm,
    isSubmitting: isLoading,
    fieldErrors,
    lastError,
    clearErrors: () => setFieldErrors({}),
  };
}