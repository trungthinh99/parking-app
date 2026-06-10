/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/message-history.contracts.ts
 * Generated at: 2026-06-08T06:02:53.091Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Message History contracts — back-office screen `메시지 발송 이력`.
 *
 * Lists every outbound message sent from the back office (조사원 / 관리자 tabs),
 * with per-recipient dispatch status. Read-only.
 */

export type MessageHistoryGroup = 'surveyor' | 'admin';
export type MessageHistorySendMethod = 'sms' | 'kakao' | 'app';
export type MessageHistoryStatus = 'pending' | 'sent' | 'failed';
export type MessageHistoryRecipientStatus = 'pending' | 'sent' | 'failed';

/** Query params for GET /messages/history */
export interface GetMessageHistoryQuery {
  /** Which tab the UI is on. Required. */
  group: MessageHistoryGroup;
  /** 1-indexed page number. Defaults to 1. */
  page?: number;
  /** Page size. Defaults to 10. */
  pageSize?: number;
  /** Filter by send method (single value, kept for backward compat). */
  sendMethod?: MessageHistorySendMethod;
  /** Multi-select method filter — matches messages with ANY of these methods. */
  sendMethods?: MessageHistorySendMethod[];
  /** Filter by overall status. */
  status?: MessageHistoryStatus;
  /** Full-text search on content or sender name. */
  search?: string;
  /** Filter by created date range (epoch seconds, inclusive). */
  startEpoch?: number;
  endEpoch?: number;
  /** Closed-period batchId — list comes from history snapshot when set. */
  batchId?: string;
}

/** Row in the list table. */
export interface MessageHistoryListItem {
  id: string;
  /** Created date (ISO 8601). */
  createdAt: string;
  /** Sender display name (resolved from Manager.name). */
  senderName: string;
  /** Sender id — kept so a future profile drill-in is possible. */
  senderId: string;
  /** All delivery methods used for this message. */
  sendMethods: MessageHistorySendMethod[];
  recipientGroup: MessageHistoryGroup;
  /** Short content preview (first ~80 chars). */
  contentPreview: string;
  /** Unique recipient count (people, not people × method). */
  recipientCount: number;
  /** Per-dispatch counts: each (recipient × method) row contributes 1. */
  sentCount: number;
  failedCount: number;
  /** Total dispatch rows = recipients × methods. */
  dispatchCount: number;
  status: MessageHistoryStatus;
}

export interface GetMessageHistoryResponse {
  items: MessageHistoryListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/** Per-recipient row inside the detail modal. One row per (recipient × method). */
export interface MessageHistoryRecipient {
  recipientId: string;
  /** Display name resolved from Manager / UserApp at read time. */
  recipientName: string;
  /** Phone number snapshotted at send time (may be null for 'app'). */
  phone: string | null;
  /** Recipient code (SVR-xxx / admin code) — null if not resolvable. */
  code: string | null;
  /** Which delivery method this row tracks. */
  method: MessageHistorySendMethod;
  status: MessageHistoryRecipientStatus;
  error: string | null;
  /** Dispatch completion epoch — null if still pending. */
  dispatchedAt: string | null;
  /** Read epoch (for app channel). */
  readAt: string | null;
}

export interface GetMessageHistoryDetailResponse {
  id: string;
  createdAt: string;
  senderName: string;
  senderId: string;
  /** All delivery methods used for this message. */
  sendMethods: MessageHistorySendMethod[];
  recipientGroup: MessageHistoryGroup;
  status: MessageHistoryStatus;
  content: string;
  recipients: MessageHistoryRecipient[];
}
