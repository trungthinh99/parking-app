/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/chat.contracts.ts
 * Generated at: 2026-06-08T06:02:53.089Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Chat Module Contracts
 * Real-time direct messaging between Back Office admins and Surveyors
 */

// ============================================
// Enums & Types
// ============================================

/** Sender type identifier / 발신자 유형 */
export type ChatSenderType = 'admin' | 'surveyor';

// ============================================
// Shared DTOs
// ============================================

/** Single chat message item / 채팅 메시지 항목 */
export interface ChatMessageItem {
  /** Message ID / 메시지 ID */
  id: string;
  /** Sender user ID / 발신자 ID */
  senderId: string;
  /** Sender type / 발신자 유형 */
  senderType: ChatSenderType;
  /** Message content / 메시지 내용 */
  content: string;
  /** Whether receiver has read the message / 읽음 여부 */
  isRead: boolean;
  /** Created epoch seconds / 생성 시각 */
  createdAt: number;
}

/** Conversation list item (for message list panel) / 대화 목록 항목 */
export interface ChatConversationItem {
  /** Surveyor user ID / 조사원 ID */
  surveyorId: string;
  /** Surveyor display name / 조사원 이름 */
  surveyorName: string;
  /** Surveyor code (e.g. S001) / 조사원 코드 */
  surveyorCode: string;
  /** Surveyor avatar URL (nullable) / 조사원 프로필 이미지 */
  surveyorAvatar: string | null;
  /** Whether the surveyor is currently online / 조사원 온라인 여부 */
  isOnline: boolean;
  /** Last message content preview / 마지막 메시지 미리보기 */
  lastMessage: string;
  /** Last message epoch seconds / 마지막 메시지 시각 */
  lastMessageAt: number;
  /** Unread message count from this surveyor / 읽지 않은 메시지 수 */
  unreadCount: number;
}

// ============================================
// GET /chat/conversations
// Screen: PARKING_ANALYSIS_MAP
// ============================================

/** GET /chat/conversations query params */
export interface GetChatConversationsRequest {
  /** Search by surveyor name or code / 조사원 이름/코드 검색 */
  search?: string;
}

/** GET /chat/conversations response */
export interface GetChatConversationsResponse {
  /** Conversation list / 대화 목록 */
  items: ChatConversationItem[];
  /** Total unread count across all conversations / 전체 읽지 않은 메시지 수 */
  totalUnreadCount: number;
}

// ============================================
// GET /chat/messages/:surveyorId
// Screen: PARKING_ANALYSIS_MAP
// ============================================

/** GET /chat/messages/:surveyorId query params */
export interface GetChatMessagesRequest {
  /** Cursor: load messages before this epoch seconds / 이 시각 이전 메시지 로드 */
  before?: number;
  /** Items per page (default 50) / 페이지당 항목 수 */
  limit?: number;
}

/** GET /chat/messages/:surveyorId response */
export interface GetChatMessagesResponse {
  /** Chat messages (oldest first) / 채팅 메시지 목록 (오래된 순) */
  messages: ChatMessageItem[];
  /** Whether there are more older messages / 이전 메시지 존재 여부 */
  hasMore: boolean;
}

// ============================================
// POST /chat/messages/:surveyorId
// Screen: PARKING_ANALYSIS_MAP
// ============================================

/** POST /chat/messages/:surveyorId request body */
export interface SendChatMessageRequest {
  /** Message content / 메시지 내용 */
  content: string;
}

/** POST /chat/messages/:surveyorId response */
export interface SendChatMessageResponse {
  /** Created message / 생성된 메시지 */
  message: ChatMessageItem;
}

// ============================================
// PATCH /chat/messages/:surveyorId/read
// Screen: PARKING_ANALYSIS_MAP
// ============================================

/** PATCH /chat/messages/:surveyorId/read response */
export interface MarkChatReadResponse {
  /** Whether the operation was successful / 성공 여부 */
  success: boolean;
  /** Number of messages marked as read / 읽음 처리된 메시지 수 */
  markedCount: number;
}

// ============================================
// GET /chat/unread-count
// Screen: PARKING_ANALYSIS_MAP
// ============================================

/** GET /chat/unread-count response */
export interface GetChatUnreadCountResponse {
  /** Total unread count / 읽지 않은 메시지 수 */
  unreadCount: number;
}

// ============================================
// App (Mobile) Chat Contracts
// ============================================

/** Conversation item for mobile (admin perspective) / 모바일 대화 항목 (관리자 관점) */
export interface AppChatConversationItem {
  /** Admin user ID / 관리자 ID */
  adminId: string;
  /** Admin display name / 관리자 이름 */
  adminName: string;
  /** Admin avatar URL (nullable) / 관리자 프로필 이미지 */
  adminAvatar: string | null;
  /** Last message content preview / 마지막 메시지 미리보기 */
  lastMessage: string;
  /** Last message epoch seconds / 마지막 메시지 시각 */
  lastMessageAt: number;
  /** Unread message count / 읽지 않은 메시지 수 */
  unreadCount: number;
}

/** GET /app/chat/conversations response */
export interface GetAppChatConversationsResponse {
  /** Conversation list / 대화 목록 */
  items: AppChatConversationItem[];
  /** Total unread count / 전체 읽지 않은 메시지 수 */
  totalUnreadCount: number;
}

/** GET /app/chat/messages/:adminId response */
export interface GetAppChatMessagesResponse {
  /** Chat messages (oldest first) / 채팅 메시지 목록 (오래된 순) */
  messages: ChatMessageItem[];
  /** Whether there are more older messages / 이전 메시지 존재 여부 */
  hasMore: boolean;
}

/** POST /app/chat/messages/:adminId request body */
export interface SendAppChatMessageRequest {
  /** Message content / 메시지 내용 */
  content: string;
}

/** POST /app/chat/messages/:adminId response */
export interface SendAppChatMessageResponse {
  /** Created message / 생성된 메시지 */
  message: ChatMessageItem;
}

// ============================================
// WebSocket Events
// ============================================

/** WebSocket event: new chat message received / 새 채팅 메시지 수신 이벤트 */
export interface ChatMessageEvent {
  /** The other party's user ID (surveyor for admin, admin for surveyor) / 상대방 ID */
  partnerId: string;
  /** The new message / 새 메시지 */
  message: ChatMessageItem;
}

/** WebSocket event: messages marked as read / 메시지 읽음 이벤트 */
export interface ChatReadEvent {
  /** The reader's user ID / 읽은 사용자 ID */
  readerId: string;
  /** Read up to this epoch seconds / 이 시각까지 읽음 */
  readUpTo: number;
}

/** WebSocket event: user online/offline status change / 사용자 접속 상태 변경 이벤트 */
export interface UserPresenceEvent {
  /** The user whose status changed / 상태가 변경된 사용자 ID */
  userId: string;
  /** Whether the user is now online / 온라인 여부 */
  isOnline: boolean;
}
