import { useContext } from "react";
import { AppToastContext, type AppToastContextValue } from "@/src/components/AppToastProvider";

/**
 * Hook to show global toast notifications.
 * Must be used within an AppToastProvider.
 *
 * @example
 * const { showToast } = useAppToast();
 * showToast({ message: "수정 정보가 시스템에 업데이트되었습니다" });
 */
export function useAppToast(): AppToastContextValue {
  const context = useContext(AppToastContext);
  if (!context) {
    throw new Error("useAppToast must be used within an AppToastProvider");
  }
  return context;
}
