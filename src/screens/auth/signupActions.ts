import { ApiClientError } from "@/src/api/client";
import { AUTH_VALIDATION } from "@/src/api-contracts";
import type { ShowModalOptions } from "@/src/components/AppModalProvider";

/** Show a signup-related modal. Caller must provide showModal from useAppModal(). */
export function alertSignup(showModal: (options: ShowModalOptions) => void, message: string) {
  showModal({ title: "회원가입", message });
}

export function validatePhoneOrAlert(
  showModal: (options: ShowModalOptions) => void,
  phone: string
): boolean {
  const trimmed = phone.trim();
  if (!trimmed) {
    alertSignup(showModal, "휴대폰 번호를 입력해주세요.");
    return false;
  }
  if (!AUTH_VALIDATION.phone.pattern.test(trimmed)) {
    alertSignup(showModal, "전화번호 형식이 올바르지 않습니다.");
    return false;
  }
  return true;
}

export function getSignupErrorMessage(e: unknown): string {
  if (e instanceof ApiClientError) {
    return e.apiError?.message ?? e.message;
  }
  return "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
}
