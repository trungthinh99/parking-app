import type {
  GetInviteInfoResponse,
  RespondSurveyorRegionInviteResponse,
} from "@/src/api-contracts";
import { SCREEN_IDS } from "@/src/api-contracts";
import { apiRequest } from "@/src/api/client";

/**
 * Public lookup of invite details by code.
 * Backend endpoint is @Public() so this can be called before the user has an auth token.
 */
export async function getInviteInfo(code: string): Promise<GetInviteInfoResponse> {
  return apiRequest<undefined, GetInviteInfoResponse>({
    method: "GET",
    path: `/invites/${encodeURIComponent(code)}`,
    // Any valid ScreenId works — the endpoint has no @AllowedScreens decorator so ScreenGuard skips it.
    screenId: SCREEN_IDS.APP_AUTH_SIGNUP,
    skipAuth: true,
  });
}

/**
 * Accept a region invite by code — used when an already logged-in surveyor
 * opens the deep link and accepts. Adds the granted region to their account
 * (promotes/creates the TBL_SURVEYOR_REGIONS grant to active).
 */
export async function acceptRegionInviteByCode(
  code: string
): Promise<RespondSurveyorRegionInviteResponse> {
  return apiRequest<undefined, RespondSurveyorRegionInviteResponse>({
    method: "POST",
    path: `/app/region-invites/by-code/${encodeURIComponent(code)}/accept`,
    screenId: SCREEN_IDS.APP_REGION_INVITES,
  });
}
