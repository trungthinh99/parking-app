import { useEffect, useState } from "react";
import { Redirect } from "expo-router";

import { PATHS } from "@/constants/Paths";
import { useAuthStore } from "@/src/store/auth-store";
import { getLastTab } from "@/src/lib/auth-storage";

/**
 * Root index route — redirects based on auth state.
 * Waits for hydration (SecureStore read) to finish before deciding.
 * Restores last visited tab only when EXPO_PUBLIC_RESTORE_LAST_TAB=true.
 */
export default function Index() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [lastTab, setLastTab] = useState<string | null>(null);
  const [tabLoaded, setTabLoaded] = useState(false);

  useEffect(() => {
    getLastTab().then((tab) => {
      setLastTab(tab);
      setTabLoaded(true);
    });
  }, []);

  // While hydrating or loading last tab, render nothing (splash screen is still visible)
  if (!isHydrated || !tabLoaded) return null;

  // Redirect to main app if authenticated, otherwise to login
  if (isAuthenticated) {
    const target = lastTab || PATHS.TABS.CONTROL_BOARD;
    return <Redirect href={target as any} />;
  }

  return <Redirect href={PATHS.AUTH.LOGIN} />;
}
