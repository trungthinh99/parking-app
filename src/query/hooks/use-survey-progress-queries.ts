import { useQuery } from "@tanstack/react-query";

import { getSurveyProgress } from "@/src/api/survey-progress";
import type { ApiClientError } from "@/src/api/client";
import type { GetAppSurveyProgressResponse } from "@/src/api-contracts";
import { queryKeys } from "@/src/query/query-keys";

/**
 * Fetch the authenticated surveyor's survey progress stats.
 * Used on the control board screen to show completion rates by parking type.
 */
export function useSurveyProgress() {
  return useQuery<GetAppSurveyProgressResponse, ApiClientError>({
    queryKey: queryKeys.survey.all,
    queryFn: getSurveyProgress,
    staleTime: 2 * 60_000, // 2 minutes — progress changes as surveyor submits data
  });
}
