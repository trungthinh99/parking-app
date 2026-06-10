import { QueryClient } from "@tanstack/react-query";
import { ApiClientError } from "@/src/api/client";

/**
 * Create a QueryClient with sensible defaults for a mobile app.
 *
 * - staleTime 5 min: survey data doesn't change rapidly; avoid re-fetches on tab switches
 * - gcTime 30 min: keep cached data around for back navigation
 * - retry 1 for queries, 0 for mutations
 * - No retry on 401/403/404 (auth/authorization/not-found errors)
 * - refetchOnWindowFocus disabled (not relevant for mobile)
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: (failureCount, error) => {
          if (error instanceof ApiClientError) {
            const status = error.status;
            if (status === 401 || status === 403 || status === 404) {
              return false;
            }
          }
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
