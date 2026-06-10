import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "parking_access_token";
const REFRESH_TOKEN_KEY = "parking_refresh_token";
const USER_ID_KEY = "parking_user_id";

export async function saveAuthTokens(tokens: {
  accessToken: string;
  refreshToken?: string;
  userId: string;
}): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
  await SecureStore.setItemAsync(USER_ID_KEY, tokens.userId);
  if (tokens.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function getUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(USER_ID_KEY);
}

export async function clearAuthTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_ID_KEY);
}

// ---- Saved phone persistence (아이디 저장 → phone is the login identifier) ----

const SAVED_PHONE_KEY = "parking_saved_phone";

/** Save phone for auto-fill on next login */
export async function savePhone(phone: string): Promise<void> {
  await SecureStore.setItemAsync(SAVED_PHONE_KEY, phone);
}

/** Get saved phone (returns null if not saved) */
export async function getSavedPhone(): Promise<string | null> {
  return SecureStore.getItemAsync(SAVED_PHONE_KEY);
}

/** Clear saved phone */
export async function clearSavedPhone(): Promise<void> {
  await SecureStore.deleteItemAsync(SAVED_PHONE_KEY);
}

// ---- Last tab persistence (controlled by env flag) ----

const LAST_TAB_KEY = "parking_last_tab";

const isRestoreLastTabEnabled = process.env.EXPO_PUBLIC_RESTORE_LAST_TAB === "true";

/** Save last visited tab route (only when EXPO_PUBLIC_RESTORE_LAST_TAB=true) */
export async function saveLastTab(route: string): Promise<void> {
  if (!isRestoreLastTabEnabled) return;
  await SecureStore.setItemAsync(LAST_TAB_KEY, route);
}

/** Get last visited tab route (returns null when flag is disabled) */
export async function getLastTab(): Promise<string | null> {
  if (!isRestoreLastTabEnabled) return null;
  return SecureStore.getItemAsync(LAST_TAB_KEY);
}
