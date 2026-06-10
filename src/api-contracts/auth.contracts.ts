/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/auth.contracts.ts
 * Generated at: 2026-06-08T06:02:53.089Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Auth Module Contracts
 * Định nghĩa tất cả Request/Response types cho Auth API
 * Frontend sẽ sync file này để sử dụng
 */

import type { ManagerRole } from './area-administrators.contracts';

// ============================================
// Common Types
// ============================================

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresInSec?: number;
}

// ============================================
// Login
// POST /auth/login
// Screen: AUTH_LOGIN
// ============================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  /** User full display name / 사용자 이름 */
  name: string;
  role: ManagerRole;
  region1: string;
  region2: string;
  /** Tenant's registered region1 (시/도) — always populated, used as the default for region selectors / 테넌트 담당 시·도 */
  tenantRegion1: string;
  /** Tenant's registered region2 list (구·군) — always populated, used to scope region2 selectors / 테넌트 담당 구·군 목록 */
  tenantRegion2: string[];
  tokens: AuthTokens;
}

// ============================================
// Check Username
// POST /auth/check-username
// Screen: AUTH_SIGNUP
// ============================================

export interface CheckUsernameRequest {
  username: string;
}

export interface CheckUsernameResponse {
  available: boolean;
  code: string;
  message: string;
}

// ============================================
// Signup
// POST /auth/signup
// Screen: AUTH_SIGNUP
// ============================================

export interface SignupRequest {
  username: string;
  name: string;
  password: string;
  phone: string;
  email?: string;
  region1: string;
  region2: string;
  /** Tenant the new admin is joining. Comes from the signup-tenant flow's
   *  business-reg verification step. Optional — when omitted, the signup
   *  is attached to the default tenant. */
  tenantId?: string;
}

export interface SignupResponse {
  signupId: string;
  otpDestinationMasked: string;
}

// ============================================
// OTP - Send
// POST /auth/otp/send
// Screen: AUTH_SIGNUP, AUTH_OTP, AUTH_FIND_PASSWORD
// ============================================

export type OtpContext = 'signup' | 'reset_password';

export interface SendOtpRequest {
  context: OtpContext;
  destination: string;
  /** Username for reset_password context validation / 비밀번호 재설정 시 아이디 검증용 */
  username?: string;
}

export interface SendOtpResponse {
  sent: boolean;
  otpDestinationMasked: string;
  /** Cooldown in seconds before can request again */
  cooldownSec?: number;
  /** Response code for debugging */
  code?: string;
  /** Error/info message */
  message?: string;
}

// ============================================
// OTP - Verify
// POST /auth/otp/verify
// Screen: AUTH_OTP, AUTH_FIND_PASSWORD
// ============================================

export interface VerifyOtpRequest {
  context: OtpContext;
  destination: string;
  otp: string;
}

export interface VerifyOtpResponse {
  verified: boolean;
  /** Token để sử dụng cho bước tiếp theo (như reset password) */
  verificationToken?: string;
}

// ============================================
// Find ID
// POST /auth/find-id
// Screen: AUTH_FIND_ID
// ============================================

export interface FindIdRequest {
  name: string;
  phone: string;
  verificationToken: string;
}

export interface FindIdResponse {
  userIdMasked: string;
  registeredAt?: string;
}

// ============================================
// Verify User (check username + phone exists)
// POST /auth/verify-user
// Screen: AUTH_FIND_PASSWORD
// ============================================

export interface VerifyUserRequest {
  username: string;
  phone: string;
  verificationToken: string;
}

export interface VerifyUserResponse {
  exists: boolean;
}

// ============================================
// Reset Password
// POST /auth/password/reset
// Screen: AUTH_FIND_PASSWORD
// ============================================

export interface ResetPasswordRequest {
  username: string;
  phone: string;
  verificationToken: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
}

// ============================================
// App Find Password (Mobile)
// POST /app/auth/find-password
// Screen: APP_AUTH_FIND_PASSWORD
// ============================================

export interface AppFindPasswordRequest {
  /** Phone number (login identifier) / 휴대폰 번호 (로그인 식별자) */
  phone: string;
  /** OTP verification token / OTP 인증 완료 토큰 */
  verificationToken: string;
}

export interface AppFindPasswordResponse {
  /** Whether the user was found / 사용자 존재 여부 */
  found: boolean;
}

// ============================================
// App Reset Password (Mobile, unauthenticated)
// POST /app/auth/reset-password
// Screen: APP_AUTH_FIND_PASSWORD
// ============================================

export interface AppResetPasswordRequest {
  /** Phone number (login identifier) / 휴대폰 번호 (로그인 식별자) */
  phone: string;
  /** OTP verification token / OTP 인증 완료 토큰 */
  verificationToken: string;
  /** New password / 새 비밀번호 */
  newPassword: string;
}

export interface AppResetPasswordResponse {
  /** Whether password was changed successfully / 비밀번호 변경 성공 여부 */
  success: boolean;
}

// ============================================
// Refresh Token
// POST /auth/refresh
// ============================================

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Response reuses LoginResponse (userId + tokens)

// ============================================
// App Login (Mobile)
// POST /app/auth/login
// Screen: APP_AUTH_LOGIN
// ============================================

export interface AppLoginRequest {
  /** Phone number (login identifier) / 휴대폰 번호 (로그인 식별자) */
  phone: string;
  /** Password / 비밀번호 */
  password: string;
}

export interface AppLoginResponse {
  userId: string;
  tokens: AuthTokens;
}

// ============================================
// App Signup (Mobile)
// POST /app/auth/signup
// Screen: APP_AUTH_SIGNUP
// ============================================

export interface AppSignupRequest {
  /** User full name / 사용자 이름 */
  name: string;
  password: string;
  /** Phone number (login identifier) / 휴대폰 번호 (로그인 식별자) */
  phone: string;
  /** Date of birth in YYYY.MM.DD format */
  birthDate: string;
  email?: string;
  /** Invite code (nanoid) — required, assigns user to the invite's tenant / 조사업체(초대) 코드 */
  inviteCode: string;
  // Avatar is sent as a file part in multipart/form-data, not as a field
}

export interface AppSignupResponse {
  success: boolean;
  message: string;
}

// ============================================
// Update Avatar (Mobile, authenticated)
// POST /app/auth/avatar/update
// Screen: APP_MY_PROFILE
// ============================================

export interface UpdateAvatarResponse {
  /** Whether avatar was updated successfully / 프로필 사진 변경 성공 여부 */
  success: boolean;
  /** New avatar relative path / 새 프로필 사진 경로 */
  avatarPath: string;
}

// ============================================
// User Profile (Mobile)
// GET /app/auth/me
// Screen: APP_MY_PROFILE
// ============================================

export interface UserProfileResponse {
  /** User UUID / 사용자 UUID */
  id: string;
  /** Full name / 이름 */
  name: string;
  /** Mobile phone number / 휴대폰 번호 */
  phone: string;
  /** Date of birth (YYYY.MM.DD) / 생년월일 */
  birthDate: string;
  /** Email address / 이메일 주소 */
  email: string | null;
  /** Company code / 조사업체 코드 */
  companyCode: string | null;
  /** Surveyor code (auto-generated) / 조사원 코드 */
  surveyorCode: string | null;
  /** Avatar image path / 프로필 사진 경로 */
  avatarPath: string | null;
  /** Masked password hint (e.g. Ab*******) / 비밀번호 힌트 (마스킹) */
  passwordHint: string | null;
}

// ============================================
// Check Phone (Mobile)
// POST /app/auth/check-phone
// Screen: APP_MY_PROFILE
// ============================================

export interface CheckPhoneRequest {
  /** Phone number to check / 확인할 휴대폰 번호 */
  phone: string;
}

export interface CheckPhoneResponse {
  /** Whether the phone number is available / 사용 가능 여부 */
  available: boolean;
}

// ============================================
// Update Profile (Mobile)
// PATCH /app/auth/profile
// Screen: APP_MY_PROFILE
// ============================================

export interface UpdateProfileRequest {
  /** Mobile phone number / 휴대폰 번호 */
  phone?: string;
  /** Date of birth (YYYY.MM.DD) / 생년월일 */
  birthDate?: string;
}

export interface UpdateProfileResponse {
  /** Whether profile was updated successfully / 프로필 수정 성공 여부 */
  success: boolean;
}

// ============================================
// Change Password (Mobile)
// POST /app/auth/change-password
// Screen: APP_SECURITY_SETTINGS
// ============================================

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
}

// ============================================
// Device Sessions (Mobile)
// GET /app/auth/devices
// POST /app/auth/devices/revoke
// Screen: APP_SECURITY_SETTINGS
// ============================================

export interface DeviceSessionItem {
  /** Session ID (refresh token ID) / 세션 ID */
  id: string;
  /** Device name / 기기 이름 */
  deviceName: string | null;
  /** Device OS / 기기 운영체제 */
  deviceOs: string | null;
  /** IP address / IP 주소 */
  ipAddress: string | null;
  /** Last known location address / 마지막 위치 주소 */
  lastLocationAddress: string | null;
  /** Last used time (ISO string) / 마지막 사용 시각 */
  lastUsedAt: string | null;
  /** Created time (ISO string) / 생성 시각 */
  createdAt: string;
  /** Whether this is the current device / 현재 기기 여부 */
  isCurrent: boolean;
}

export interface GetDeviceSessionsResponse {
  /** List of active device sessions / 활성 기기 세션 목록 */
  devices: DeviceSessionItem[];
}

export interface RevokeDeviceSessionRequest {
  /** Session ID to revoke / 해제할 세션 ID */
  sessionId: string;
}

export interface RevokeDeviceSessionResponse {
  /** Whether revocation was successful / 해제 성공 여부 */
  success: boolean;
}

// ============================================
// Update Device Location (Mobile)
// POST /app/auth/devices/location
// Screen: APP_SECURITY_SETTINGS
// ============================================

export interface UpdateDeviceLocationRequest {
  /** Latitude / 위도 */
  latitude: number;
  /** Longitude / 경도 */
  longitude: number;
  /** Reverse-geocoded address / 역지오코딩 주소 */
  address: string;
}

export interface UpdateDeviceLocationResponse {
  /** Whether update was successful / 업데이트 성공 여부 */
  success: boolean;
}

// ============================================
// Logout
// POST /auth/logout (requires Bearer token)
// ============================================

export interface LogoutResponse {
  success: boolean;
}

// ============================================
// Withdraw (Account Deletion)
// POST /app/auth/withdraw
// Screen: APP_SETTINGS
// ============================================

export interface WithdrawRequest {
  /** Current password for verification / 비밀번호 확인 */
  password: string;
}

export interface WithdrawResponse {
  /** Whether withdrawal was successful / 회원 탈퇴 성공 여부 */
  success: boolean;
}

// ============================================
// Region Options (South Korea administrative divisions)
// ============================================

/**
 * Real Korean administrative divisions mapping
 * region1 (시/도) -> region2[] (시/군/구)
 */
export const REGION_MAP: Record<string, readonly string[]> = {
  서울특별시: [
    '강남구', '강동구', '강북구', '강서구', '관악구',
    '광진구', '구로구', '금천구', '노원구', '도봉구',
    '동대문구', '동작구', '마포구', '서대문구', '서초구',
    '성동구', '성북구', '송파구', '양천구', '영등포구',
    '용산구', '은평구', '종로구', '중구', '중랑구',
  ],
  부산광역시: [
    '강서구', '금정구', '기장군', '남구', '동구',
    '동래구', '부산진구', '북구', '사상구', '사하구',
    '서구', '수영구', '연제구', '영도구', '중구', '해운대구',
  ],
  대구광역시: [
    '남구', '달서구', '달성군', '동구', '북구',
    '서구', '수성구', '중구', '군위군',
  ],
  인천광역시: [
    '강화군', '계양구', '남동구', '동구', '미추홀구',
    '부평구', '서구', '연수구', '옹진군', '중구',
  ],
  광주광역시: [
    '광산구', '남구', '동구', '북구', '서구',
  ],
  대전광역시: [
    '대덕구', '동구', '서구', '유성구', '중구',
  ],
  울산광역시: [
    '남구', '동구', '북구', '울주군', '중구',
  ],
  세종특별자치시: [
    '세종시',
  ],
  경기도: [
    '가평군', '고양시', '과천시', '광명시', '광주시',
    '구리시', '군포시', '김포시', '남양주시', '동두천시',
    '부천시', '성남시', '수원시', '시흥시', '안산시',
    '안성시', '안양시', '양주시', '양평군', '여주시',
    '연천군', '오산시', '용인시', '의왕시', '의정부시',
    '이천시', '파주시', '평택시', '포천시', '하남시',
    '화성시',
  ],
  강원특별자치도: [
    '강릉시', '고성군', '동해시', '삼척시', '속초시',
    '양구군', '양양군', '영월군', '원주시', '인제군',
    '정선군', '철원군', '춘천시', '태백시', '평창군',
    '홍천군', '화천군', '횡성군',
  ],
  충청북도: [
    '괴산군', '단양군', '보은군', '영동군', '옥천군',
    '음성군', '제천시', '증평군', '진천군', '청주시',
    '충주시',
  ],
  충청남도: [
    '계룡시', '공주시', '금산군', '논산시', '당진시',
    '보령시', '부여군', '서산시', '서천군', '아산시',
    '예산군', '천안시', '청양군', '태안군', '홍성군',
  ],
  전북특별자치도: [
    '고창군', '군산시', '김제시', '남원시', '무주군',
    '부안군', '순창군', '완주군', '익산시', '임실군',
    '장수군', '전주시', '정읍시', '진안군',
  ],
  전라남도: [
    '강진군', '고흥군', '곡성군', '광양시', '구례군',
    '나주시', '담양군', '목포시', '무안군', '보성군',
    '순천시', '신안군', '여수시', '영광군', '영암군',
    '완도군', '장성군', '장흥군', '진도군', '함평군',
    '해남군', '화순군',
  ],
  경상북도: [
    '경산시', '경주시', '고령군', '구미시', '김천시',
    '문경시', '봉화군', '상주시', '성주군', '안동시',
    '영덕군', '영양군', '영주시', '영천시', '예천군',
    '울릉군', '울진군', '의성군', '청도군', '청송군',
    '칠곡군', '포항시',
  ],
  경상남도: [
    '거제시', '거창군', '고성군', '김해시', '남해군',
    '밀양시', '사천시', '산청군', '양산시', '의령군',
    '진주시', '창녕군', '창원시', '통영시', '하동군',
    '함안군', '함양군', '합천군',
  ],
  제주특별자치도: [
    '제주시', '서귀포시',
  ],
};

/** List of all region1 (시/도) options */
export const REGION1_OPTIONS = Object.keys(REGION_MAP) as readonly string[];

/** Get region2 (시/군/구) options for a given region1 */
export function getRegion2Options(region1: string): readonly string[] {
  return REGION_MAP[region1] ?? [];
}

// Backward-compatible flat export (deprecated)
export const REGION_OPTIONS = {
  region1: REGION1_OPTIONS,
  region2: [] as readonly string[],
};

export type Region1 = string;
export type Region2 = string;
