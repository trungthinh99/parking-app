import React, { useEffect, useState } from "react";
import { AppState } from "react-native";
import { QueryClientProvider, focusManager } from "@tanstack/react-query";
import { createQueryClient } from "./query-client";

/**
 * TanStack Query provider wrapper for the app.
 * Creates the QueryClient once and sets up AppState-based refetch for mobile.
 */
export function AppQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  // Sync React Native AppState with TanStack Query's focus manager
  // so queries refetch when the app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      focusManager.setFocused(status === "active");
    });
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
