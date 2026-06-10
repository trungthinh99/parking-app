/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/app-messages.contracts.ts
 * Generated at: 2026-06-08T06:02:53.088Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * App Messages Contracts - Mobile message endpoints
 * Surveyors and Area Admins receive messages sent from Back Office
 */

// ─── GET /app/messages ────────────────────────────────────────────
/** Conversation item grouped by sender / 발신자별 그룹화된 대화 항목 */
export interface AppMessageListItem {
  /** Latest message ID (used for navigation) / 최신 메시지 ID */
  id: string;
  /** Sender ID / 발신자 ID */
  senderId: string;
  /** Sender display name / 발신자 이름 */
  senderName: string;
  /** Sender avatar URL (nullable) / 발신자 프로필 이미지 */
  senderAvatar: string | null;
  /** Latest message content preview (truncated) / 최신 메시지 내용 미리보기 */
  contentPreview: string;
  /** Number of unread messages in this conversation / 읽지 않은 메시지 수 */
  unreadCount: number;
  /** Total messages in this conversation / 총 메시지 수 */
  messageCount: number;
  /** Latest message created epoch seconds / 최신 메시지 생성 시각 */
  createdAt: number;
}

/** GET /app/messages query params */
export interface GetAppMessagesRequest {
  /** Filter: 'all' | 'unread' */
  filter?: 'all' | 'unread';
  /** Page number (1-based) */
  page?: number;
  /** Items per page (default 20) */
  limit?: number;
}

/** GET /app/messages response */
export interface GetAppMessagesResponse {
  /** List of messages */
  items: AppMessageListItem[];
  /** Total number of messages */
  total: number;
  /** Current page */
  page: number;
  /** Items per page */
  limit: number;
  /** Total unread count (always returned for badge) / 읽지 않은 메시지 수 */
  unreadCount: number;
}

// ─── GET /app/messages/:id ────────────────────────────────────────
/** Message detail for conversation view */
export interface AppMessageDetail {
  /** Message ID / 메시지 ID */
  id: string;
  /** Sender display name / 발신자 이름 */
  senderName: string;
  /** Sender avatar URL (nullable) / 발신자 프로필 이미지 */
  senderAvatar: string | null;
  /** Full message content / 메시지 내용 */
  content: string;
  /** Created epoch seconds / 생성 시각 */
  createdAt: number;
  /** Whether the current user has read the message / 읽음 여부 */
  isRead: boolean;
}

/** GET /app/messages/:id response - returns all messages from the same sender */
export interface GetAppMessageDetailResponse {
  /** Sender user ID (admin) / 발신자 ID */
  senderId: string;
  /** Sender display name / 발신자 이름 */
  senderName: string;
  /** Sender avatar URL (nullable) / 발신자 프로필 이미지 */
  senderAvatar: string | null;
  /** All messages from this sender to the current user / 해당 발신자의 메시지 목록 */
  messages: AppMessageDetail[];
}

// ─── PATCH /app/messages/:id/read ─────────────────────────────────
/** PATCH /app/messages/:id/read response */
export interface MarkMessageReadResponse {
  /** Whether the operation was successful / 성공 여부 */
  success: boolean;
}

// ─── GET /app/messages/unread-count ───────────────────────────────
/** GET /app/messages/unread-count response */
export interface GetUnreadCountResponse {
  /** Total unread count / 읽지 않은 메시지 수 */
  unreadCount: number;
}
