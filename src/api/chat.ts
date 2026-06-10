import type {
  GetAppChatMessagesResponse,
  SendAppChatMessageResponse,
  MarkChatReadResponse,
} from "@/src/api-contracts";
import { SCREEN_IDS } from "@/src/api-contracts";
import { apiRequest } from "@/src/api/client";

const SCREEN_ID = SCREEN_IDS.APP_CHAT;

/**
 * Fetch chat messages between the current surveyor and a specific admin.
 */
export async function getChatMessages(
  adminId: string,
  params?: { before?: number; limit?: number },
): Promise<GetAppChatMessagesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.before) searchParams.set("before", String(params.before));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  return apiRequest<void, GetAppChatMessagesResponse>({
    method: "GET",
    path: `/app/chat/messages/${adminId}${qs ? `?${qs}` : ""}`,
    screenId: SCREEN_ID,
  });
}

/**
 * Send a chat message to an admin.
 */
export async function sendChatMessage(
  adminId: string,
  content: string,
): Promise<SendAppChatMessageResponse> {
  return apiRequest<{ content: string }, SendAppChatMessageResponse>({
    method: "POST",
    path: `/app/chat/messages/${adminId}`,
    screenId: SCREEN_ID,
    body: { content },
  });
}

/**
 * Mark all messages from an admin as read.
 */
export async function markChatAsRead(
  adminId: string,
): Promise<MarkChatReadResponse> {
  return apiRequest<void, MarkChatReadResponse>({
    method: "PATCH",
    path: `/app/chat/messages/${adminId}/read`,
    screenId: SCREEN_ID,
  });
}
