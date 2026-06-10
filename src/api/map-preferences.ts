import type {
  GetMapPreferencesResponse,
  UpdateMapPreferencesRequest,
  UpdateMapPreferencesResponse,
} from "@/src/api-contracts";
import type { ScreenId } from "@/src/api-contracts";
import { apiRequest } from "@/src/api/client";

/**
 * Fetch the authenticated user's saved map display preferences.
 * Caller passes the current screen ID since these endpoints are registered
 * under every parking-screen that might read/write the preferences.
 */
export async function getMapPreferences(
  screenId: ScreenId,
): Promise<GetMapPreferencesResponse> {
  return apiRequest<void, GetMapPreferencesResponse>({
    method: "GET",
    path: "/app/map-preferences",
    screenId,
  });
}

/**
 * Patch a subset of the user's map display preferences.
 * Only the keys sent in `body` are persisted — others keep their stored value.
 */
export async function updateMapPreferences(
  screenId: ScreenId,
  body: UpdateMapPreferencesRequest,
): Promise<UpdateMapPreferencesResponse> {
  return apiRequest<UpdateMapPreferencesRequest, UpdateMapPreferencesResponse>({
    method: "PATCH",
    path: "/app/map-preferences",
    screenId,
    body,
  });
}
