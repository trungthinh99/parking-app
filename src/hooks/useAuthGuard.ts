import { useEffect } from "react";
import { useRouter } from "expo-router";

import { PATHS } from "@/constants/Paths";
import { useAuthStore } from "@/src/store/auth-store";

/**
 * Auth guard for layouts outside the (tabs) group.
 * Redirects to login when SecureStore hydration finishes and the user is unauthenticated.
 * Returns a flag indicating whether it is safe to render the protected subtree.
 */
export function useAuthGuard() {
  const router = useRouter();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace(PATHS.AUTH.LOGIN);
    }
  }, [isHydrated, isAuthenticated, router]);

  return isHydrated && isAuthenticated;
}
