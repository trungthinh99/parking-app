import Constants from "expo-constants";

/**
 * Build the full URL for an avatar image path returned by the API.
 * avatarPath is stored as "avatars/<uuid>.ext" and served at /uploads/avatars/<uuid>.ext
 */
export function getAvatarUrl(avatarPath: string | null | undefined): string | null {
  if (!avatarPath) return null;

  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const fromExtra = typeof extra?.apiBaseUrl === "string" ? extra.apiBaseUrl : undefined;
  const baseUrl = (envUrl ?? fromExtra ?? "http://localhost:3000/api").trim();

  // Remove /api suffix to get server root
  const serverRoot = baseUrl.replace(/\/api\/?$/, "");
  return `${serverRoot}/uploads/${avatarPath}`;
}
