import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiClientError } from "@/src/api/client";
import { acceptRegionInviteByCode, getInviteInfo } from "@/src/api/invites";
import type {
  GetInviteInfoResponse,
  RespondSurveyorRegionInviteResponse,
} from "@/src/api-contracts";

/**
 * Fetch public invite info (used by ReceiveInviteScreen).
 * Does not require auth; falls back gracefully when `code` is absent.
 */
export function useInviteInfoQuery(code: string | undefined) {
  return useQuery<GetInviteInfoResponse, ApiClientError>({
    queryKey: ["invites", "info", code] as const,
    queryFn: () => getInviteInfo(code as string),
    enabled: !!code,
    staleTime: 60_000,
    retry: 0,
  });
}

/**
 * Accept a region invite by code for an already-logged-in surveyor (deep-link
 * "add region" flow). On success, invalidate the surveyor's zone/region/boundary
 * queries so the newly granted region appears on the map without a restart.
 */
export function useRespondRegionInviteByCode() {
  const queryClient = useQueryClient();

  const accept = useMutation<RespondSurveyorRegionInviteResponse, ApiClientError, string>({
    mutationFn: (code: string) => acceptRegionInviteByCode(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveyorRegions"] });
      queryClient.invalidateQueries({ queryKey: ["surveyorZones"] });
      queryClient.invalidateQueries({ queryKey: ["surveyorZoneBoundaries"] });
    },
  });

  return { accept };
}
