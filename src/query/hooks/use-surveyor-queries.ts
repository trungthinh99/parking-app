import { useQuery } from "@tanstack/react-query";

import { getSurveyorRegions, getSurveyorZones, getSurveyorZoneBoundaries } from "@/src/api/surveyor-zones";
import type { ApiClientError } from "@/src/api/client";
import type {
  GetAppSurveyorRegionsResponse,
  GetAppSurveyorZoneBoundariesResponse,
  GetAppSurveyorZonesResponse,
  ScreenId,
} from "@/src/api-contracts";

/**
 * Fetch the authenticated surveyor's assigned region names.
 * Cached for the session — regions rarely change.
 */
export function useSurveyorRegions(screenId: ScreenId) {
  return useQuery<GetAppSurveyorRegionsResponse, ApiClientError>({
    queryKey: ["surveyorRegions"],
    queryFn: () => getSurveyorRegions({ screenId }),
    staleTime: 5 * 60_000, // 5 minutes — regions change infrequently
  });
}

/**
 * Fetch the authenticated surveyor's assigned zones (region + zone code).
 * Used for the zone filter dropdown.
 */
export function useSurveyorZones(screenId: ScreenId) {
  return useQuery<GetAppSurveyorZonesResponse, ApiClientError>({
    queryKey: ["surveyorZones"],
    queryFn: () => getSurveyorZones({ screenId }),
    staleTime: 30_000,
    refetchInterval: 30_000, // Auto-refetch to pick up zone assignment changes from admin
  });
}

/**
 * Fetch the authenticated surveyor's assigned zone boundary polygons.
 * Used for client-side validation when creating new markers.
 */
export function useSurveyorZoneBoundaries(screenId: ScreenId) {
  return useQuery<GetAppSurveyorZoneBoundariesResponse, ApiClientError>({
    queryKey: ["surveyorZoneBoundaries"],
    queryFn: () => getSurveyorZoneBoundaries({ screenId }),
    staleTime: 30_000,
    refetchInterval: 30_000, // Auto-refetch to pick up zone assignment changes from admin
  });
}
