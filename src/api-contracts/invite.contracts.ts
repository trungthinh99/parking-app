/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/invite.contracts.ts
 * Generated at: 2026-06-08T06:02:53.090Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Invite Module Contracts
 * Request/Response types for surveyor invite API
 */

// ============================================
// Enums & constants
// ============================================

/** Allowed link expiry options in days (matches UI dropdown) / 링크 만료 기간 옵션 */
export const INVITE_EXPIRY_OPTIONS = [1, 7, 30] as const;
export type InviteExpiryDays = (typeof INVITE_EXPIRY_OPTIONS)[number];

/** Supported delivery channels / 발송 채널 */
export const INVITE_CHANNELS = ['kakao', 'sms', 'email'] as const;
export type InviteChannel = (typeof INVITE_CHANNELS)[number];

/** Max recipients per channel per request (anti-spam) / 채널별 최대 수신자 수 */
export const INVITE_MAX_RECIPIENTS_PER_CHANNEL = 50;

/** Max length of recipient display name / 수신자 이름 최대 길이 */
export const INVITE_RECIPIENT_NAME_MAX = 100;

// ============================================
// Recipient shape
// ============================================

/** Single recipient with display name + delivery target / 수신자 (이름 + 연락처) */
export interface InviteRecipient {
  /** Display name shown in the message body / 메시지에 표시되는 이름 */
  name: string;
  /** Phone number (kakao/sms) or email (email) / 전화번호 또는 이메일 */
  value: string;
}

// ============================================
// Create invite (admin-only)
// ============================================

export interface CreateInviteRequest {
  /** Link expiry in days (1, 7, or 30) / 링크 만료 기간 (일) */
  expiryDays: InviteExpiryDays;
  /** Channels to dispatch (must contain at least one) / 발송 채널 */
  channels: InviteChannel[];
  /** SMS recipients / SMS 수신자 */
  smsRecipients?: InviteRecipient[];
  /** Email recipients / 이메일 수신자 */
  emailRecipients?: InviteRecipient[];
  /** Kakao recipients / Kakao 수신자 */
  kakaoRecipients?: InviteRecipient[];
  /** Invitee role (defaults to 'surveyor') / 초대 대상 역할 */
  role?: 'surveyor';
  /**
   * Metropolitan area (시/도) to grant. REQUIRED for super_admin inviters
   * (chosen in the modal); ignored for area_admin (taken from their own region).
   * 부여할 광역지역 — 슈퍼관리자는 필수, 지역관리자는 무시됨(본인 지역 사용).
   */
  region1?: string;
  /** District (시군구) to grant — same rules as region1 / 부여할 시군구 */
  region2?: string;
}

export interface CreateInviteResponse {
  inviteId: string;
  /** Invite code shown to the recipient (entered manually in app) / 초대 코드 */
  code: string;
  expiresAt: string;
  dispatchedCount: number;
}

// ============================================
// Public invite info (used by mobile ReceiveInviteScreen)
// ============================================

export interface GetInviteInfoResponse {
  /** Whether the invite is still usable / 초대 유효 여부 */
  valid: boolean;
  code: string;
  inviterName: string;
  tenantName: string;
  tenantCode: string;
  role: string;
  /** Human-readable expiry date (YYYY.MM.DD) / 만료일 표시 */
  expireDate: string;
  /** Whether the invite has already been consumed / 사용 여부 */
  used: boolean;
  /** Granted metropolitan area (시/도) / 부여 광역지역 */
  region1: string;
  /** Granted district (시군구) / 부여 시군구 */
  region2: string;
  /** Managed area display string "region1 region2" / 표시용 관리지역 */
  managedArea: string;
}

// ============================================
// Revoke invite
// ============================================

export interface RevokeInviteResponse {
  success: boolean;
}

// ============================================
// Invite history (admin list)
// ============================================

export const INVITE_USED_FILTERS = ['all', 'used', 'unused'] as const;
export type InviteUsedFilter = (typeof INVITE_USED_FILTERS)[number];

/**
 * UI-facing combined state filter — matches the badge column in the history table.
 * Server resolves each value into the right combination of status / used / revoked / expired.
 */
export const INVITE_STATE_FILTERS = [
  'pending',
  'sent',
  'failed',
  'used',
  'revoked',
  'expired',
  // Region-grant acceptance states (re-invites of an existing surveyor by a
  // second admin). Resolved by joining the invite to its SurveyorRegion grant.
  'accept_pending',
  'accept_accepted',
  'accept_rejected',
] as const;
export type InviteStateFilter = (typeof INVITE_STATE_FILTERS)[number];

export interface ListInvitesQuery {
  page?: number;
  pageSize?: number;
  /** Search across recipientName / recipient (phone or email) / code */
  search?: string;
  channel?: InviteChannel;
  /** Combined state filter (matches the badge in the history table) */
  state?: InviteStateFilter;
  /** Inclusive epoch seconds — created at >= dateFrom */
  dateFrom?: number;
  /** Inclusive epoch seconds — created at <= dateTo */
  dateTo?: number;
}

/**
 * Acceptance state of the region grant produced by an invite, shown in the
 * history table. Only meaningful for invites that target an already-registered
 * surveyor (re-invite by a second admin), which produce a pending grant the
 * surveyor accepts/rejects in the app. `none` = no grant tracked (e.g. a normal
 * first-time signup invite, where region is applied directly on signup).
 * 초대로 부여된 지역의 수락 상태.
 */
export const INVITE_ACCEPT_STATUSES = ['none', 'pending', 'accepted', 'rejected'] as const;
export type InviteAcceptStatus = (typeof INVITE_ACCEPT_STATUSES)[number];

export interface InviteHistoryItem {
  id: string;
  code: string;
  channel: InviteChannel;
  recipient: string;
  recipientName: string;
  status: 'pending' | 'sent' | 'failed';
  inviterName: string;
  /** Granted metropolitan area / 부여 광역지역 */
  region1: string | null;
  /** Granted district / 부여 시군구 */
  region2: string | null;
  /** Region-grant acceptance state (for re-invites of existing surveyors) / 지역 수락 상태 */
  acceptStatus: InviteAcceptStatus;
  expiresAt: string;
  createdAt: string;
  sentAt: string | null;
  usedAt: string | null;
  revokedAt: string | null;
  errorMessage: string | null;
}

export interface ListInvitesResponse {
  items: InviteHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================
// Surveyor region invites (app — accept/reject a second admin's grant)
// ============================================

/**
 * A pending region grant offered to an already-registered surveyor by a second
 * admin. Surfaced in the app so the surveyor can accept (gain the region) or
 * reject it. 다른 관리자가 제안한 보류 중인 지역 부여.
 */
export interface SurveyorRegionInvite {
  /** SurveyorRegion grant ID / 지역 부여 ID */
  id: string;
  region1: string;
  region2: string;
  /** Managed area display string "region1 region2" / 표시용 관리지역 */
  managedArea: string;
  /** Inviting admin display name / 초대한 관리자 이름 */
  inviterName: string;
  /** Created epoch seconds / 생성 시각 */
  createdAt: string;
}

export interface ListSurveyorRegionInvitesResponse {
  items: SurveyorRegionInvite[];
}

export interface RespondSurveyorRegionInviteResponse {
  success: boolean;
}
