import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMapPreferences, updateMapPreferences } from "@/src/api/map-preferences";
import type { ApiClientError } from "@/src/api/client";
import type {
  GetMapPreferencesResponse,
  ScreenId,
  UpdateMapPreferencesRequest,
  UpdateMapPreferencesResponse,
} from "@/src/api-contracts";
import { queryKeys } from "@/src/query/query-keys";

/**
 * Fetch the authenticated user's map display preferences.
 * Shared across all parking screens — cache is keyed globally so switching
 * screens doesn't refetch an already-loaded value.
 */
export function useMapPreferences(screenId: ScreenId) {
  return useQuery<GetMapPreferencesResponse, ApiClientError>({
    queryKey: queryKeys.mapPreferences.self(),
    queryFn: () => getMapPreferences(screenId),
    staleTime: Infinity, // preferences rarely change — no auto-refetch
  });
}

/**
 * Patch the user's map display preferences. Only the keys present in the
 * request body are persisted; on success we update the cached query so
 * subscribers (legend sheet, map screens) re-render immediately.
 */
export function useUpdateMapPreferences(screenId: ScreenId) {
  const queryClient = useQueryClient();

  return useMutation<UpdateMapPreferencesResponse, ApiClientError, UpdateMapPreferencesRequest>({
    mutationFn: (body) => updateMapPreferences(screenId, body),
    onSuccess: (response) => {
      queryClient.setQueryData<GetMapPreferencesResponse>(
        queryKeys.mapPreferences.self(),
        { data: response.data },
      );
    },
  });
}
