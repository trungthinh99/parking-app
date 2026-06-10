import { useMutation } from "@tanstack/react-query";

import { sendOtp, verifyOtp } from "@/src/api/auth";
import type { ApiClientError } from "@/src/api/client";
import type {
  ScreenId,
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "@/src/api-contracts";

/**
 * Send OTP mutation.
 * screenId is passed at call time since OTP is used across multiple screens
 * (FindId, FindPassword, Signup).
 */
export function useSendOtpMutation() {
  return useMutation<SendOtpResponse, ApiClientError, { body: SendOtpRequest; screenId: ScreenId }>(
    {
      mutationFn: ({ body, screenId }) => sendOtp(body, screenId),
    }
  );
}

/**
 * Verify OTP mutation.
 * screenId is passed at call time for the same reason as useSendOtpMutation.
 */
export function useVerifyOtpMutation() {
  return useMutation<
    VerifyOtpResponse,
    ApiClientError,
    { body: VerifyOtpRequest; screenId: ScreenId }
  >({
    mutationFn: ({ body, screenId }) => verifyOtp(body, screenId),
  });
}
