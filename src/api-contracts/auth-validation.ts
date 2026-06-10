/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/validation/auth-validation.ts
 * Generated at: 2026-06-08T06:02:53.094Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Auth Validation Rules - Pattern + message for input validation
 * Used in class-validator @Matches decorators in DTOs
 */
export const AUTH_VALIDATION = {
  username: {
    minLength: 6,
    maxLength: 20,
    pattern: /^[a-z\d]{6,20}$/,
    message: '영문 소문자, 숫자 / 6~20자',
  },
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
    message: '8자 이상, 대·소문자·숫자·특수문자 포함',
  },
  phone: {
    pattern: /^01[0-9]-?\d{3,4}-?\d{4}$/,
    message: '올바른 휴대폰 번호를 입력하세요.',
  },
  otp: {
    length: 6,
    pattern: /^\d{6}$/,
    message: '6자리 숫자를 입력하세요.',
  },
} as const;
