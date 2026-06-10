import Constants from "expo-constants";

import type { ApiError, RefreshTokenRequest, AppLoginResponse } from "@/src/api-contracts";
import type { ScreenId } from "@/src/api-contracts";
import { ERROR_CODES, SCREEN_IDS } from "@/src/api-contracts";
import {
  getAccessToken,
  getRefreshToken,
  saveAuthTokens,
  clearAuthTokens,
} from "@/src/lib/auth-storage";
import { emitAuthExpired } from "@/src/lib/auth-event";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiRequestOptions<TBody> = {
  method: HttpMethod;
  path: string;
  screenId: ScreenId;
  body?: TBody;
  /** Skip auth header (used for login/signup requests) */
  skipAuth?: boolean;
  /** Additional headers to include in the request */
  extraHeaders?: Record<string, string>;
};

export class ApiClientError extends Error {
  public readonly apiError?: ApiError;
  public readonly status?: number;

  public constructor(message: string, args?: { apiError?: ApiError; status?: number }) {
    super(message);
    this.name = "ApiClientError";
    this.apiError = args?.apiError;
    this.status = args?.status;
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

/** Returns the server origin (without /api path) for static asset URLs */
export function getServerOrigin(): string {
  const base = getBaseUrl();
  // Strip trailing /api or /api/ to get the origin
  return base.replace(/\/api\/?$/, "");
}

function getBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) return normalizeBaseUrl(envUrl);

  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const fromExtra = typeof extra?.apiBaseUrl === "string" ? extra.apiBaseUrl : undefined;
  if (fromExtra) return normalizeBaseUrl(fromExtra);

  return "http://localhost:3000/api";
}

async function tryParseJson<T>(res: Response): Promise<T | undefined> {
  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) return undefined;
  try {
    return (await res.json()) as T;
  } catch {
    return undefined;
  }
}

// ---- Token refresh logic ----

let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns true if refresh succeeded, false otherwise.
 * Uses a singleton promise to avoid concurrent refresh requests.
 */
async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;

      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/app/auth/refresh`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-screen-id": SCREEN_IDS.APP_AUTH_REFRESH,
        },
        body: JSON.stringify({ refreshToken } satisfies RefreshTokenRequest),
      });

      if (!res.ok) return false;

      const data = await tryParseJson<AppLoginResponse>(res);
      if (!data?.tokens?.accessToken) return false;

      await saveAuthTokens({
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
        userId: data.userId,
      });
      return true;
    } catch {
      return false;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/** Force logout: clear tokens and emit event so the UI can redirect */
async function forceLogout(): Promise<void> {
  await clearAuthTokens();
  emitAuthExpired();
}

// ---- Main API request ----

export async function apiRequest<TBody, TResponse>(
  options: ApiRequestOptions<TBody>
): Promise<TResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${options.path.startsWith("/") ? "" : "/"}${options.path}`;

  // Build headers with optional auth token
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-screen-id": options.screenId,
    ...options.extraHeaders,
  };

  if (!options.skipAuth) {
    const token = await getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    method: options.method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (res.ok) {
    const data = await tryParseJson<TResponse>(res);
    return data ?? (undefined as unknown as TResponse);
  }

  // Handle 401 - attempt token refresh then retry once
  if (res.status === 401 && !options.skipAuth) {
    const apiError = await tryParseJson<ApiError>(res);
    const code = apiError?.code;

    if (code === ERROR_CODES.TOKEN_EXPIRED || code === ERROR_CODES.TOKEN_INVALID) {
      const refreshed = await tryRefreshToken();

      if (refreshed) {
        // Retry the original request with new token
        const newToken = await getAccessToken();
        const retryHeaders: Record<string, string> = {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-screen-id": options.screenId,
        };
        if (newToken) {
          retryHeaders["Authorization"] = `Bearer ${newToken}`;
        }

        const retryRes = await fetch(url, {
          method: options.method,
          headers: retryHeaders,
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
        });

        if (retryRes.ok) {
          const data = await tryParseJson<TResponse>(retryRes);
          return data ?? (undefined as unknown as TResponse);
        }

        // Retry also failed - force logout
        await forceLogout();
        const retryError = await tryParseJson<ApiError>(retryRes);
        const message = retryError?.message ?? "세션이 만료되었습니다. 다시 로그인해주세요.";
        throw new ApiClientError(message, {
          apiError: retryError,
          status: retryRes.status,
        });
      }

      // Refresh failed - force logout
      await forceLogout();
      const message = apiError?.message ?? "세션이 만료되었습니다. 다시 로그인해주세요.";
      throw new ApiClientError(message, { apiError, status: res.status });
    }

    // Non-token 401 (e.g. wrong password) — body already consumed, reuse parsed result
    const message = apiError?.message ?? "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
    throw new ApiClientError(message, { apiError, status: res.status });
  }

  const apiError = await tryParseJson<ApiError>(res);
  const message = apiError?.message ?? "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  throw new ApiClientError(message, { apiError, status: res.status });
}

// Multipart form-data with text fields + optional file (for React Native)
type UploadWithFieldsOptions = {
  path: string;
  screenId: ScreenId;
  body: Record<string, unknown>;
  file?: {
    fieldName: string;
    fileUri: string;
    fileName: string;
    mimeType: string;
  };
};

export async function apiUploadWithFields<TResponse>(
  options: UploadWithFieldsOptions
): Promise<TResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${options.path.startsWith("/") ? "" : "/"}${options.path}`;

  const formData = new FormData();

  // Append text fields
  for (const [key, value] of Object.entries(options.body)) {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  }

  // Append file if provided
  if (options.file) {
    formData.append(options.file.fieldName, {
      uri: options.file.fileUri,
      name: options.file.fileName,
      type: options.file.mimeType,
    } as unknown as Blob);
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    "x-screen-id": options.screenId,
  };
  const token = await getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (res.ok) {
    const data = await tryParseJson<TResponse>(res);
    return data ?? (undefined as unknown as TResponse);
  }

  // Handle 401 - attempt token refresh then retry once
  if (res.status === 401) {
    const apiError = await tryParseJson<ApiError>(res);
    const code = apiError?.code;

    if (code === ERROR_CODES.TOKEN_EXPIRED || code === ERROR_CODES.TOKEN_INVALID) {
      const refreshed = await tryRefreshToken();

      if (refreshed) {
        // Rebuild form data for retry
        const retryFormData = new FormData();
        for (const [key, value] of Object.entries(options.body)) {
          if (value !== undefined && value !== null) {
            retryFormData.append(key, String(value));
          }
        }
        if (options.file) {
          retryFormData.append(options.file.fieldName, {
            uri: options.file.fileUri,
            name: options.file.fileName,
            type: options.file.mimeType,
          } as unknown as Blob);
        }

        const newToken = await getAccessToken();
        const retryHeaders: Record<string, string> = {
          Accept: "application/json",
          "x-screen-id": options.screenId,
        };
        if (newToken) {
          retryHeaders["Authorization"] = `Bearer ${newToken}`;
        }

        const retryRes = await fetch(url, {
          method: "POST",
          headers: retryHeaders,
          body: retryFormData,
        });

        if (retryRes.ok) {
          const data = await tryParseJson<TResponse>(retryRes);
          return data ?? (undefined as unknown as TResponse);
        }

        await forceLogout();
        const retryError = await tryParseJson<ApiError>(retryRes);
        const message = retryError?.message ?? "세션이 만료되었습니다. 다시 로그인해주세요.";
        throw new ApiClientError(message, { apiError: retryError, status: retryRes.status });
      }

      await forceLogout();
      const message = apiError?.message ?? "세션이 만료되었습니다. 다시 로그인해주세요.";
      throw new ApiClientError(message, { apiError, status: res.status });
    }

    const message = apiError?.message ?? "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
    throw new ApiClientError(message, { apiError, status: res.status });
  }

  const apiError = await tryParseJson<ApiError>(res);
  const message = apiError?.message ?? "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  throw new ApiClientError(message, { apiError, status: res.status });
}

// File upload via multipart/form-data (for React Native)
type UploadOptions = {
  path: string;
  screenId: ScreenId;
  fieldName: string;
  fileUri: string;
  fileName: string;
  mimeType: string;
};

export async function apiUpload<TResponse>(options: UploadOptions): Promise<TResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${options.path.startsWith("/") ? "" : "/"}${options.path}`;

  const formData = new FormData();
  formData.append(options.fieldName, {
    uri: options.fileUri,
    name: options.fileName,
    type: options.mimeType,
  } as unknown as Blob);

  // Build headers with optional auth token
  const headers: Record<string, string> = {
    Accept: "application/json",
    "x-screen-id": options.screenId,
  };
  const token = await getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (res.ok) {
    const data = await tryParseJson<TResponse>(res);
    return data ?? (undefined as unknown as TResponse);
  }

  // Handle 401 - attempt token refresh then retry once
  if (res.status === 401) {
    const apiError = await tryParseJson<ApiError>(res);
    const code = apiError?.code;

    if (code === ERROR_CODES.TOKEN_EXPIRED || code === ERROR_CODES.TOKEN_INVALID) {
      const refreshed = await tryRefreshToken();

      if (refreshed) {
        const retryFormData = new FormData();
        retryFormData.append(options.fieldName, {
          uri: options.fileUri,
          name: options.fileName,
          type: options.mimeType,
        } as unknown as Blob);

        const newToken = await getAccessToken();
        const retryHeaders: Record<string, string> = {
          Accept: "application/json",
          "x-screen-id": options.screenId,
        };
        if (newToken) {
          retryHeaders["Authorization"] = `Bearer ${newToken}`;
        }

        const retryRes = await fetch(url, {
          method: "POST",
          headers: retryHeaders,
          body: retryFormData,
        });

        if (retryRes.ok) {
          const data = await tryParseJson<TResponse>(retryRes);
          return data ?? (undefined as unknown as TResponse);
        }

        await forceLogout();
        const retryError = await tryParseJson<ApiError>(retryRes);
        const message = retryError?.message ?? "세션이 만료되었습니다. 다시 로그인해주세요.";
        throw new ApiClientError(message, { apiError: retryError, status: retryRes.status });
      }

      await forceLogout();
      const message = apiError?.message ?? "세션이 만료되었습니다. 다시 로그인해주세요.";
      throw new ApiClientError(message, { apiError, status: res.status });
    }

    const message = apiError?.message ?? "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
    throw new ApiClientError(message, { apiError, status: res.status });
  }

  const apiError = await tryParseJson<ApiError>(res);
  const message = apiError?.message ?? "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  throw new ApiClientError(message, { apiError, status: res.status });
}
