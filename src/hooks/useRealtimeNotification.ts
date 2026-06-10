import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { AppState, type AppStateStatus } from "react-native";
import { getAccessToken } from "@/src/lib/auth-storage";
import { queryKeys } from "@/src/query/query-keys";
import { useAuthStore } from "@/src/store/auth-store";

/**
 * Derive WebSocket base URL from the API base URL.
 * API URL is like "http://host:port/api" — WS needs "http://host:port"
 */
function getWsBaseUrl(): string {
  const apiBase =
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";
  // Strip trailing /api or /api/
  return apiBase.replace(/\/api\/?$/, "");
}

/**
 * Connect to WebSocket when app is in foreground and user is authenticated.
 * Invalidate message queries on 'new-message' event so badge dot appears instantly.
 * Auto-disconnect when app goes to background to save battery.
 */
export function useRealtimeNotification() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const invalidateMessages = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    };

    const connect = async () => {
      const token = await getAccessToken();
      if (!token) return;

      // Disconnect existing socket before creating new one
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const newSocket = io(`${getWsBaseUrl()}/notifications`, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 3000,
      });

      newSocket.on("new-message", invalidateMessages);

      newSocket.on("chat:message", () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.all });
        invalidateMessages();
      });

      socketRef.current = newSocket;
    };

    connect();

    // Disconnect on background, reconnect on foreground
    const appStateSubscription = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active") {
          // Refetch messages to catch events missed while in background
          invalidateMessages();
          if (!socketRef.current?.connected) {
            connect();
          }
        } else {
          socketRef.current?.disconnect();
        }
      },
    );

    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      appStateSubscription.remove();
    };
  }, [isAuthenticated, queryClient]);
}
