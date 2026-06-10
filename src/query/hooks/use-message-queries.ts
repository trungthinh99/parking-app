import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

import {
  getMessages,
  getMessageDetail,
  markMessageAsRead,
  getUnreadCount,
} from "@/src/api/messages";
import type { ApiClientError } from "@/src/api/client";
import type {
  GetAppMessagesResponse,
  GetAppMessageDetailResponse,
  MarkMessageReadResponse,
  GetUnreadCountResponse,
} from "@/src/api-contracts";
import { queryKeys } from "@/src/query/query-keys";

/**
 * Fetch paginated message list with filter support.
 */
export function useMessages(filter: "all" | "unread" = "all") {
  return useQuery<GetAppMessagesResponse, ApiClientError>({
    queryKey: queryKeys.messages.list(filter),
    queryFn: () => getMessages({ filter }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetch message detail (all messages from the same sender).
 * Backend auto-marks the target message as read on GET.
 * After successful fetch, invalidate list + unread count so red dot disappears.
 */
export function useMessageDetail(messageId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery<GetAppMessageDetailResponse, ApiClientError>({
    queryKey: queryKeys.messages.detail(messageId ?? ""),
    queryFn: async () => {
      const result = await getMessageDetail(messageId!);
      // Backend marks message as read on GET — invalidate list + unread count
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.list("all"),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.list("unread"),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.unreadCount(),
      });
      return result;
    },
    enabled: !!messageId,
    staleTime: 60_000,
  });

  return query;
}

/**
 * Get unread message count for badge display.
 * - refetchOnWindowFocus: re-check when app returns from background
 * - refetchOnMount: always re-check when component mounts (tab switch)
 * - refetchInterval: 60s fallback in case WebSocket is disconnected
 */
export function useUnreadMessageCount() {
  return useQuery<GetUnreadCountResponse, ApiClientError>({
    queryKey: queryKeys.messages.unreadCount(),
    queryFn: getUnreadCount,
    staleTime: 10_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
  });
}

/**
 * Mutation to mark a message as read and invalidate related queries.
 */
export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();

  return useMutation<MarkMessageReadResponse, ApiClientError, string>({
    mutationFn: markMessageAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    },
  });
}
