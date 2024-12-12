import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      retry: (failureCount, error) => {
        // Don't retry on auth errors (401)
        if (error instanceof Error && error.message.includes('401')) {
          console.log('[React Query] Not retrying 401 error');
          return false;
        }
        // Only retry network or 5xx errors up to 3 times
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});
