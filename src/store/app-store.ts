import { create } from "zustand";

/** Pending marker to focus on when returning to a parking map screen */
export interface FocusMarkerRequest {
  id: number;
  lat: number;
  lng: number;
  /** Marker visual type for correct active style (e.g. building/updated/createdByApp/existing) */
  markerType?: string;
  /** On-street sub-type for correct marker style */
  onStreetSubType?: string;
  /** Whether the marker comes from the completed tab (조사 완료) — opens bottom sheet in read-only */
  isCompleted?: boolean;
}

interface AppState {
  /** Bottom sheet currently open (prevents multiple sheets at once) */
  activeBottomSheet: string | null;
  /** Marker to focus on when map screen gains focus (consumed once) */
  pendingFocusMarker: FocusMarkerRequest | null;
}

interface AppActions {
  setActiveBottomSheet: (sheetId: string | null) => void;
  setPendingFocusMarker: (marker: FocusMarkerRequest | null) => void;
}

export const useAppStore = create<AppState & AppActions>((set) => ({
  activeBottomSheet: null,
  pendingFocusMarker: null,

  setActiveBottomSheet: (sheetId) => set({ activeBottomSheet: sheetId }),
  setPendingFocusMarker: (marker) => set({ pendingFocusMarker: marker }),
}));
