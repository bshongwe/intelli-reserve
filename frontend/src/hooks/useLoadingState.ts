import { useState, useCallback } from "react";

interface UseLoadingStateReturn {
  readonly isLoading: boolean;
  readonly withLoading: <T,>(fn: () => Promise<T>) => Promise<T>;
}

export function useLoadingState(): UseLoadingStateReturn {
  const [isLoading, setIsLoading] = useState(false);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      try {
        return await fn();
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { isLoading, withLoading };
}
