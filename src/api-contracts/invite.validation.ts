/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/validation/invite.validation.ts
 * Generated at: 2026-06-08T06:02:53.094Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Invite input validation rules
 * Shared between backend DTOs and frontend/mobile form validation
 */

/** KR mobile phone: allows 010-1234-5678, 01012345678, 010 1234 5678 / 휴대폰 번호 형식 */
export const INVITE_PHONE_REGEX = /^01\d[-\s]?\d{3,4}[-\s]?\d{4}$/;

/** Standard email / 이메일 형식 */
export const INVITE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const INVITE_VALIDATION_MESSAGES = {
  phoneInvalid: '유효하지 않은 휴대폰 번호입니다.',
  emailInvalid: '유효하지 않은 이메일 주소입니다.',
  nameRequired: '수신자 이름을 입력해주세요.',
  nameTooLong: '수신자 이름은 최대 100자까지 입력할 수 있습니다.',
  recipientsRequired: '수신자를 한 명 이상 입력해주세요.',
  channelRequired: '발송 채널을 한 개 이상 선택해주세요.',
  tooManyRecipients: '채널별 수신자는 최대 50명까지 입력할 수 있습니다.',
  duplicateRecipient: '동일한 연락처가 중복되었습니다.',
  expiryInvalid: '유효하지 않은 만료 기간입니다.',
  inviteExpired: '만료된 초대입니다.',
  inviteUsed: '이미 사용된 초대입니다.',
  inviteRevoked: '취소된 초대입니다.',
  inviteNotFound: '초대를 찾을 수 없습니다.',
} as const;

/** Normalize phone: remove spaces/dashes so storage is consistent */
export function normalizeInvitePhone(phone: string): string {
  return phone.replace(/[-\s]/g, '').trim();
}

export function isValidInvitePhone(phone: string): boolean {
  return INVITE_PHONE_REGEX.test(phone.trim());
}

export function isValidInviteEmail(email: string): boolean {
  return INVITE_EMAIL_REGEX.test(email.trim());
}
