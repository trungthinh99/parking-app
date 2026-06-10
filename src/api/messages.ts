import type {
  GetAppMessagesResponse,
  GetAppMessageDetailResponse,
  MarkMessageReadResponse,
  GetUnreadCountResponse,
} from "@/src/api-contracts";
import { SCREEN_IDS } from "@/src/api-contracts";
import { apiRequest } from "@/src/api/client";

const SCREEN_ID = SCREEN_IDS.APP_MESSAGES;

/**
 * Fetch paginated list of messages for the current user.
 */
export async function getMessages(params?: {
  filter?: "all" | "unread";
  page?: number;
  limit?: number;
}): Promise<GetAppMessagesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.filter) searchParams.set("filter", params.filter);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  return apiRequest<void, GetAppMessagesResponse>({
    method: "GET",
    path: `/app/messages${qs ? `?${qs}` : ""}`,
    screenId: SCREEN_ID,
  });
}

/**
 * Fetch message detail - returns all messages from the same sender.
 * Also auto-marks the message as read on the server.
 */
export async function getMessageDetail(
  messageId: string,
): Promise<GetAppMessageDetailResponse> {
  return apiRequest<void, GetAppMessageDetailResponse>({
    method: "GET",
    path: `/app/messages/${messageId}`,
    screenId: SCREEN_ID,
  });
}

/**
 * Mark a specific message as read.
 */
export async function markMessageAsRead(
  messageId: string,
): Promise<MarkMessageReadResponse> {
  return apiRequest<void, MarkMessageReadResponse>({
    method: "PATCH",
    path: `/app/messages/${messageId}/read`,
    screenId: SCREEN_ID,
  });
}

/**
 * Get unread message count for badge display.
 */
export async function getUnreadCount(): Promise<GetUnreadCountResponse> {
  return apiRequest<void, GetUnreadCountResponse>({
    method: "GET",
    path: "/app/messages/unread-count",
    screenId: SCREEN_ID,
  });
}
