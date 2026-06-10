import React, { createContext, useCallback, useMemo, useState } from "react";
import { AppToast, type ToastConfig } from "./AppToast";

/** Options for showing a toast */
export interface ShowToastOptions {
  message: string;
  type?: ToastConfig["type"];
  duration?: number;
}

/** Context value for toast operations */
export interface AppToastContextValue {
  showToast: (options: ShowToastOptions) => void;
}

export const AppToastContext = createContext<AppToastContextValue | null>(null);

/**
 * Global toast provider. Wrap this around the root layout
 * to enable useAppToast() hook throughout the app.
 */
export function AppToastProvider({ children }: { children: React.ReactNode }) {
  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);

  const showToast = useCallback((options: ShowToastOptions) => {
    setToastConfig({
      message: options.message,
      type: options.type ?? "success",
      duration: options.duration,
    });
  }, []);

  const handleDismiss = useCallback(() => {
    setToastConfig(null);
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <AppToastContext.Provider value={contextValue}>
      {children}
      <AppToast config={toastConfig} onDismiss={handleDismiss} />
    </AppToastContext.Provider>
  );
}
