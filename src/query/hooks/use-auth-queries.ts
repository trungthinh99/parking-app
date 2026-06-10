import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { login, appLogout, appWithdraw, changePassword, getMyProfile, checkPhone, appSignup, updateAvatar, updateProfile, getDeviceSessions, revokeDeviceSession, updateDeviceLocation } from "@/src/api/auth";
import { reportDeviceLocation } from "@/src/lib/report-device-location";
import type { ApiClientError } from "@/src/api/client";
import { clearSavedPhone, savePhone } from "@/src/lib/auth-storage";
import { useAuthStore } from "@/src/store/auth-store";
import { useAppModal } from "@/src/hooks/useAppModal";
import { PATHS } from "@/constants/Paths";
import { queryKeys } from "@/src/query/query-keys";
import type {
  AppLoginRequest,
  AppLoginResponse,
  AppSignupRequest,
  AppSignupResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  UpdateAvatarResponse,
  CheckPhoneRequest,
  CheckPhoneResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UserProfileResponse,
  WithdrawRequest,
  WithdrawResponse,
  GetDeviceSessionsResponse,
  RevokeDeviceSessionRequest,
  RevokeDeviceSessionResponse,
  UpdateDeviceLocationRequest,
  UpdateDeviceLocationResponse,
} from "@/src/api-contracts";

/**
 * Login mutation variables — extends AppLoginRequest with client-only saveId flag.
 */
type LoginMutationVariables = AppLoginRequest & { saveId?: boolean };

/**
 * Login mutation hook.
 * Handles token persistence, saved phone, auth store update, and navigation on success.
 * Displays error modal on failure.
 */
export function useLoginMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const { showModal } = useAppModal();

  return useMutation<AppLoginResponse, ApiClientError, LoginMutationVariables>({
    mutationFn: ({ saveId: _, ...req }) => login(req),
    onSuccess: async (data, variables) => {
      // Persist or clear saved phone before navigating away
      if (variables.saveId) {
        await savePhone(variables.phone);
      } else {
        await clearSavedPhone();
      }
      await setAuthenticated({
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
        userId: data.userId,
      });
      // Clear any stale cached data from previous session
      queryClient.clear();
      // Report device location to server (fire-and-forget)
      reportDeviceLocation();
      router.replace(PATHS.TABS.CONTROL_BOARD);
    },
    onError: (error) => {
      const message =
        error.apiError?.message ??
        error.message ??
        "잘못된 계정 또는 비밀번호";
      showModal({ title: "로그인", message });
    },
  });
}

/**
 * Change password mutation hook.
 * Calls the API and returns success/error for the caller to handle.
 */
export function useChangePasswordMutation() {
  const queryClient = useQueryClient();

  return useMutation<ChangePasswordResponse, ApiClientError, ChangePasswordRequest>({
    mutationFn: changePassword,
    onSuccess: () => {
      // Refetch profile to get updated passwordHint
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

/**
 * Fetch current user's profile.
 * Enabled only when the user is authenticated.
 */
export function useMyProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<UserProfileResponse, ApiClientError>({
    queryKey: ["myProfile"],
    queryFn: getMyProfile,
    enabled: isAuthenticated,
  });
}

/**
 * Update avatar mutation hook.
 * Uploads new avatar image and invalidates profile cache.
 */
export function useUpdateAvatarMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateAvatarResponse,
    ApiClientError,
    { fileUri: string; fileName: string; mimeType: string }
  >({
    mutationFn: ({ fileUri, fileName, mimeType }) => updateAvatar(fileUri, fileName, mimeType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

/**
 * Update profile (phone, birthDate) mutation hook.
 * Invalidates profile cache on success.
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation<UpdateProfileResponse, ApiClientError, UpdateProfileRequest>({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

/**
 * Check phone availability mutation hook.
 * Returns available=true if the phone belongs to the current user or is unused.
 */
export function useCheckPhoneMutation() {
  return useMutation<CheckPhoneResponse, ApiClientError, CheckPhoneRequest>({
    mutationFn: checkPhone,
  });
}

/**
 * Signup mutation hook.
 * Accepts form data + optional avatar URI via variables.
 */
export function useSignupMutation() {
  return useMutation<
    AppSignupResponse,
    ApiClientError,
    { body: AppSignupRequest; avatarUri?: string | null }
  >({
    mutationFn: ({ body, avatarUri }) => appSignup(body, avatarUri),
  });
}

/**
 * Logout mutation hook.
 * Clears auth store, query cache, and navigates to login.
 */
export function useLogoutMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      // Call server to revoke tokens, then clear local state
      try {
        await appLogout();
      } catch {
        // Proceed with local logout even if server call fails
      }
      await logout();
    },
    onSuccess: () => {
      queryClient.clear();
      router.replace(PATHS.AUTH.LOGIN);
    },
  });
}

/**
 * Fetch active device sessions for the current user.
 */
export function useDeviceSessions() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<GetDeviceSessionsResponse, ApiClientError>({
    queryKey: queryKeys.auth.devices(),
    queryFn: getDeviceSessions,
    enabled: isAuthenticated,
    staleTime: 0,
  });
}

/**
 * Revoke a specific device session.
 * Invalidates device list on success.
 */
export function useRevokeDeviceSessionMutation() {
  const queryClient = useQueryClient();
  const { showModal } = useAppModal();

  return useMutation<RevokeDeviceSessionResponse, ApiClientError, RevokeDeviceSessionRequest>({
    mutationFn: revokeDeviceSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.devices() });
    },
    onError: (error) => {
      showModal({
        title: "기기 로그아웃",
        message: error.apiError?.message ?? error.message ?? "서버에 문제가 발생했습니다.",
      });
    },
  });
}

/**
 * Update current device location mutation hook.
 * Sends GPS coordinates + address to server, then refreshes device list.
 */
export function useUpdateDeviceLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation<UpdateDeviceLocationResponse, ApiClientError, UpdateDeviceLocationRequest>({
    mutationFn: updateDeviceLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.devices() });
    },
  });
}

/**
 * Withdraw (delete account) mutation hook.
 * Calls withdraw API, clears auth state, and navigates to login.
 */
export function useWithdrawMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  return useMutation<WithdrawResponse, ApiClientError, WithdrawRequest>({
    mutationFn: appWithdraw,
    onSuccess: async () => {
      await logout();
      queryClient.clear();
      router.replace(PATHS.AUTH.LOGIN);
    },
  });
}
