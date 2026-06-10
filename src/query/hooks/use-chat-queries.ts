import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getChatMessages,
  sendChatMessage,
  markChatAsRead,
} from "@/src/api/chat";
import type { ApiClientError } from "@/src/api/client";
import type {
  GetAppChatMessagesResponse,
  SendAppChatMessageResponse,
  MarkChatReadResponse,
} from "@/src/api-contracts";
import { queryKeys } from "@/src/query/query-keys";

/**
 * Fetch chat messages with an admin (bidirectional conversation).
 */
export function useChatMessages(adminId: string | null) {
  return useQuery<GetAppChatMessagesResponse, ApiClientError>({
    queryKey: queryKeys.chat.messages(adminId ?? ""),
    queryFn: () => getChatMessages(adminId!),
    enabled: !!adminId,
    staleTime: 30_000,
  });
}

/**
 * Send a chat message to an admin.
 */
export function useSendChatMessage(adminId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    SendAppChatMessageResponse,
    ApiClientError,
    string
  >({
    mutationFn: (content: string) => sendChatMessage(adminId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(adminId),
      });
      // Also refresh message lists (unread counts may change)
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.all,
      });
    },
  });
}

/**
 * Mark all chat messages from an admin as read.
 */
export function useMarkChatAsRead(adminId: string) {
  const queryClient = useQueryClient();

  return useMutation<MarkChatReadResponse, ApiClientError, void>({
    mutationFn: () => markChatAsRead(adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(adminId),
      });
    },
  });
}
