export { AppQueryProvider } from "./query-provider";
export { queryKeys } from "./query-keys";

// Auth
export {
  useLoginMutation,
  useLogoutMutation,
  useSignupMutation,
} from "./hooks/use-auth-queries";

// OTP
export { useSendOtpMutation, useVerifyOtpMutation } from "./hooks/use-otp-queries";
