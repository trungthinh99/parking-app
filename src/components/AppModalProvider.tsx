import React, { createContext, useCallback, useMemo, useState } from "react";
import { AppModal, AppModalButton } from "./AppModal";

/** Options for showing a modal */
export interface ShowModalOptions {
  title: string;
  message: string;
  buttons?: AppModalButton[];
}

/** Context value for modal operations */
export interface AppModalContextValue {
  showModal: (options: ShowModalOptions) => void;
}

export const AppModalContext = createContext<AppModalContextValue | null>(null);

/**
 * Global modal provider. Wrap this around the root layout
 * to enable useAppModal() hook throughout the app.
 */
export function AppModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<ShowModalOptions | null>(null);

  const showModal = useCallback((options: ShowModalOptions) => {
    setModalState(options);
  }, []);

  const handleClose = useCallback(() => {
    setModalState(null);
  }, []);

  const contextValue = useMemo(() => ({ showModal }), [showModal]);

  return (
    <AppModalContext.Provider value={contextValue}>
      {children}
      <AppModal
        visible={modalState !== null}
        title={modalState?.title ?? ""}
        message={modalState?.message ?? ""}
        buttons={modalState?.buttons}
        onClose={handleClose}
      />
    </AppModalContext.Provider>
  );
}
