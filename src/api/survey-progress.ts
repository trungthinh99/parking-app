import type { GetAppSurveyProgressResponse } from "@/src/api-contracts";
import { apiRequest } from "@/src/api/client";

/**
 * Fetch the authenticated surveyor's survey progress stats.
 * Returns completion counts by parking type for the control board.
 */
export async function getSurveyProgress(): Promise<GetAppSurveyProgressResponse> {
  return apiRequest<void, GetAppSurveyProgressResponse>({
    method: "GET",
    path: "/app/survey-progress",
    screenId: "APP_CONTROL_BOARD",
  });
}
