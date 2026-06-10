import { useContext } from "react";
import { AppModalContext } from "@/src/components/AppModalProvider";
import type { AppModalContextValue } from "@/src/components/AppModalProvider";

/**
 * Hook to show the global app modal from any component.
 * Must be used within an AppModalProvider.
 */
export function useAppModal(): AppModalContextValue {
  const context = useContext(AppModalContext);
  if (!context) {
    throw new Error("useAppModal must be used within an AppModalProvider");
  }
  return context;
}
