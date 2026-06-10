import type {
  AppFindPasswordRequest,
  AppFindPasswordResponse,
  AppLoginRequest,
  AppLoginResponse,
  AppResetPasswordRequest,
  AppResetPasswordResponse,
  AppSignupRequest,
  AppSignupResponse,
  UpdateAvatarResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  LogoutResponse,
  WithdrawRequest,
  WithdrawResponse,
  ScreenId,
  SendOtpRequest,
  SendOtpResponse,
  CheckPhoneRequest,
  CheckPhoneResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UserProfileResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  GetDeviceSessionsResponse,
  RevokeDeviceSessionRequest,
  RevokeDeviceSessionResponse,
  UpdateDeviceLocationRequest,
  UpdateDeviceLocationResponse,
} from "@/src/api-contracts";
import { SCREEN_IDS } from "@/src/api-contracts";

import { apiRequest, apiUpload, apiUploadWithFields } from "@/src/api/client";
import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";

/** Build device info headers from platform data */
function getDeviceHeaders(): Record<string, string> {
  const deviceName = Device.modelName ?? Constants.deviceName ?? `${Platform.OS} Device`;
  const deviceOs = `${Platform.OS === "ios" ? "iOS" : "Android"} ${Platform.Version}`;
  return {
    "x-device-name": deviceName,
    "x-device-os": deviceOs,
  };
}

export async function login(body: AppLoginRequest): Promise<AppLoginResponse> {
  return apiRequest<AppLoginRequest, AppLoginResponse>({
    method: "POST",
    path: "/app/auth/login",
    screenId: SCREEN_IDS.APP_AUTH_LOGIN,
    body,
    extraHeaders: getDeviceHeaders(),
  });
}

/** Upload and update avatar for authenticated user */
export async function updateAvatar(
  fileUri: string,
  fileName: string,
  mimeType: string,
): Promise<UpdateAvatarResponse> {
  return apiUpload<UpdateAvatarResponse>({
    path: "/app/auth/avatar/update",
    screenId: SCREEN_IDS.APP_MY_PROFILE,
    fieldName: "avatar",
    fileUri,
    fileName,
    mimeType,
  });
}

export async function appSignup(
  body: AppSignupRequest,
  avatarUri?: string | null,
): Promise<AppSignupResponse> {
  const file = avatarUri
    ? {
        fieldName: "avatar",
        fileUri: avatarUri,
        fileName: avatarUri.split("/").pop() ?? "avatar.jpg",
        mimeType: avatarUri.endsWith(".png") ? "image/png" : "image/jpeg",
      }
    : undefined;

  return apiUploadWithFields<AppSignupResponse>({
    path: "/app/auth/signup",
    screenId: SCREEN_IDS.APP_AUTH_SIGNUP,
    body: body as unknown as Record<string, unknown>,
    file,
  });
}

export async function sendOtp(
  body: SendOtpRequest,
  screenId: ScreenId = SCREEN_IDS.AUTH_SIGNUP
): Promise<SendOtpResponse> {
  return apiRequest<SendOtpRequest, SendOtpResponse>({
    method: "POST",
    path: "/auth/otp/send",
    screenId,
    body,
  });
}

export async function verifyOtp(
  body: VerifyOtpRequest,
  screenId: ScreenId = SCREEN_IDS.APP_AUTH_FIND_PASSWORD
): Promise<VerifyOtpResponse> {
  return apiRequest<VerifyOtpRequest, VerifyOtpResponse>({
    method: "POST",
    path: "/auth/otp/verify",
    screenId,
    body,
  });
}

export async function appFindPassword(body: AppFindPasswordRequest): Promise<AppFindPasswordResponse> {
  return apiRequest<AppFindPasswordRequest, AppFindPasswordResponse>({
    method: "POST",
    path: "/app/auth/find-password",
    screenId: SCREEN_IDS.APP_AUTH_FIND_PASSWORD,
    body,
  });
}

export async function appResetPassword(body: AppResetPasswordRequest): Promise<AppResetPasswordResponse> {
  return apiRequest<AppResetPasswordRequest, AppResetPasswordResponse>({
    method: "POST",
    path: "/app/auth/reset-password",
    screenId: SCREEN_IDS.APP_AUTH_FIND_PASSWORD,
    body,
  });
}

export async function changePassword(body: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  return apiRequest<ChangePasswordRequest, ChangePasswordResponse>({
    method: "POST",
    path: "/app/auth/change-password",
    screenId: SCREEN_IDS.APP_SECURITY_SETTINGS,
    body,
  });
}

export async function checkPhone(body: CheckPhoneRequest): Promise<CheckPhoneResponse> {
  return apiRequest<CheckPhoneRequest, CheckPhoneResponse>({
    method: "POST",
    path: "/app/auth/check-phone",
    screenId: SCREEN_IDS.APP_MY_PROFILE,
    body,
  });
}

export async function updateProfile(body: UpdateProfileRequest): Promise<UpdateProfileResponse> {
  return apiRequest<UpdateProfileRequest, UpdateProfileResponse>({
    method: "PATCH",
    path: "/app/auth/profile",
    screenId: SCREEN_IDS.APP_MY_PROFILE,
    body,
  });
}

export async function getMyProfile(): Promise<UserProfileResponse> {
  return apiRequest<void, UserProfileResponse>({
    method: "GET",
    path: "/app/auth/me",
    screenId: SCREEN_IDS.APP_MY_PROFILE,
  });
}

export async function appLogout(): Promise<LogoutResponse> {
  const { getRefreshToken } = await import("@/src/lib/auth-storage");
  const refreshToken = await getRefreshToken();
  const extraHeaders: Record<string, string> = {};
  if (refreshToken) {
    extraHeaders["x-refresh-token"] = refreshToken;
  }
  return apiRequest<void, LogoutResponse>({
    method: "POST",
    path: "/app/auth/logout",
    screenId: SCREEN_IDS.APP_SECURITY_SETTINGS,
    extraHeaders,
  });
}

export async function appWithdraw(body: WithdrawRequest): Promise<WithdrawResponse> {
  return apiRequest<WithdrawRequest, WithdrawResponse>({
    method: "POST",
    path: "/app/auth/withdraw",
    screenId: SCREEN_IDS.APP_SECURITY_SETTINGS,
    body,
  });
}

export async function getDeviceSessions(): Promise<GetDeviceSessionsResponse> {
  const { getRefreshToken } = await import("@/src/lib/auth-storage");
  const refreshToken = await getRefreshToken();
  const extraHeaders: Record<string, string> = {};
  if (refreshToken) {
    extraHeaders["x-refresh-token"] = refreshToken;
  }
  return apiRequest<void, GetDeviceSessionsResponse>({
    method: "GET",
    path: "/app/auth/devices",
    screenId: SCREEN_IDS.APP_SECURITY_SETTINGS,
    extraHeaders,
  });
}

export async function revokeDeviceSession(body: RevokeDeviceSessionRequest): Promise<RevokeDeviceSessionResponse> {
  return apiRequest<RevokeDeviceSessionRequest, RevokeDeviceSessionResponse>({
    method: "POST",
    path: "/app/auth/devices/revoke",
    screenId: SCREEN_IDS.APP_SECURITY_SETTINGS,
    body,
  });
}

export async function updateDeviceLocation(body: UpdateDeviceLocationRequest): Promise<UpdateDeviceLocationResponse> {
  return apiRequest<UpdateDeviceLocationRequest, UpdateDeviceLocationResponse>({
    method: "POST",
    path: "/app/auth/devices/location",
    screenId: SCREEN_IDS.APP_SECURITY_SETTINGS,
    body,
  });
}
