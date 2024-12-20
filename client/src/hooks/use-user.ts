import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, InsertUser } from "@db/schema";

type RequestResult = {
  ok: true;
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: InsertUser
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status >= 500) {
        return { ok: false, message: response.statusText };
      }

      const message = await response.text();
      return { ok: false, message };
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e.toString() };
  }
}

async function fetchUser(): Promise<User | null> {
  console.log('[useUser] Fetching user session...');
  let retryCount = 0;
  const maxRetries = 3;
  const backoffMs = 1000; // Start with 1 second

  while (retryCount < maxRetries) {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log('[useUser] Response status:', response.status);
      const responseText = await response.text();
      console.log('[useUser] Response body:', responseText);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('[useUser] Not authenticated (401)');
          return null;
        }

        if (response.status >= 500) {
          throw new Error(`Server error: ${response.status}`);
        }

        throw new Error(`Request failed: ${response.status}`);
      }

      try {
        const userData = JSON.parse(responseText);
        console.log('[useUser] Successfully fetched user:', userData);
        return userData;
      } catch (e) {
        console.error('[useUser] Error parsing user data:', e);
        throw new Error('Invalid user data received');
      }
    } catch (error) {
      console.error(`[useUser] Attempt ${retryCount + 1} failed:`, error);
      
      if (retryCount === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, backoffMs * Math.pow(2, retryCount))
      );
      retryCount++;
    }
  }

  throw new Error('Failed to fetch user after max retries');
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading, isFetching } = useQuery<User | null, Error>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: 0, // Always consider data stale
    gcTime: 24 * 60 * 60 * 1000, // Keep unused data in cache for 24 hours
    retry: (failureCount, error) => {
      console.log('[useUser] Retry attempt:', failureCount, 'Error:', error);
      // Don't retry on auth errors (401)
      if (error instanceof Error && error.message.includes('401')) {
        console.log('[useUser] Not retrying 401 error');
        return false;
      }
      // Only retry network or 5xx errors
      if (error instanceof Error && error.message.includes('5')) {
        console.log('[useUser] Retrying 5xx error');
        return failureCount < 3;
      }
      return false;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: true,
    refetchOnMount: 'always', // Always refetch on mount
    refetchOnReconnect: true,
    refetchInterval: false, // Disable automatic refetching
    refetchIntervalInBackground: false,
    initialData: null,
    enabled: true
  });

  const loginMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: (userData) => handleRequest('/api/login', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const logoutMutation = useMutation<RequestResult, Error>({
    mutationFn: () => handleRequest('/api/logout', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const registerMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: (userData) => handleRequest('/api/register', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return {
    user,
    error,
    isLoading,
    isFetching: isFetching || loginMutation.isPending || logoutMutation.isPending || registerMutation.isPending,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}
