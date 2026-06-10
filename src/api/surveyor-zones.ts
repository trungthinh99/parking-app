import type {
  GetAppSurveyorRegionsResponse,
  GetAppSurveyorZoneBoundariesResponse,
  GetAppSurveyorZonesResponse,
  ScreenId,
} from "@/src/api-contracts";

import { apiRequest } from "@/src/api/client";

/**
 * Fetch the authenticated surveyor's assigned region names.
 * Used to display which areas the surveyor is allowed to survey.
 */
export async function getSurveyorRegions(params: {
  screenId: ScreenId;
}): Promise<GetAppSurveyorRegionsResponse> {
  return apiRequest<void, GetAppSurveyorRegionsResponse>({
    method: "GET",
    path: "/app/surveyor-regions",
    screenId: params.screenId,
  });
}

/**
 * Fetch the authenticated surveyor's assigned zones (region + zone code).
 * Used for the zone filter dropdown in the legend bottom sheet.
 */
export async function getSurveyorZones(params: {
  screenId: ScreenId;
}): Promise<GetAppSurveyorZonesResponse> {
  return apiRequest<void, GetAppSurveyorZonesResponse>({
    method: "GET",
    path: "/app/surveyor-zones",
    screenId: params.screenId,
  });
}

/**
 * Fetch the authenticated surveyor's assigned zone boundary polygons.
 * Used to validate that new markers are created within allowed areas.
 */
export async function getSurveyorZoneBoundaries(params: {
  screenId: ScreenId;
}): Promise<GetAppSurveyorZoneBoundariesResponse> {
  return apiRequest<void, GetAppSurveyorZoneBoundariesResponse>({
    method: "GET",
    path: "/app/surveyor-zone-boundaries",
    screenId: params.screenId,
  });
}
