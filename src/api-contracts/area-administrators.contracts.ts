/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/area-administrators.contracts.ts
 * Generated at: 2026-06-08T06:02:53.088Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Area Administrators Module Contracts
 * Request/Response types for Area Administrators API
 */

// ============================================
// Enums & Types
// ============================================

export const ADMIN_TAB_FILTERS = ['all', 'active', 'inactive', 'pending'] as const;
export type AdminTabFilter = (typeof ADMIN_TAB_FILTERS)[number];

export const ADMIN_SORT_FIELDS = ['managedArea', 'joinDate', 'isActive'] as const;
export type AdminSortField = (typeof ADMIN_SORT_FIELDS)[number];

export const ACCOUNT_STATUSES = ['active', 'inactive'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const MANAGER_ROLES = ['area_admin', 'super_admin'] as const;
export type ManagerRole = (typeof MANAGER_ROLES)[number];

export const PENDING_STATUSES = ['pending_approval', 'rejected'] as const;
export type PendingStatus = (typeof PENDING_STATUSES)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

// ============================================
// Entity (API Response shape)
// ============================================

export interface AreaAdministrator {
  id: string;
  adminId: string;
  username: string;
  name: string;
  phone: string;
  email: string | null;
  region1: string;
  region2: string;
  managedArea: string;
  joinDate: string;
  lastLogin: string | null;
  isActive: boolean;
  isPendingApproval: boolean;
  pendingStatus?: PendingStatus | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// GET /api/area-administrators
// Screen: AREA_ADMINISTRATORS
// ============================================

export interface GetAreaAdministratorsRequest {
  page?: number;
  limit?: number;
  tab?: AdminTabFilter;
  search?: string;
  sortBy?: AdminSortField;
  sortOrder?: SortOrder;
  managedArea?: string;
  /** Filter by region2 (구/군) within the selected region1 / 선택한 시/도 내 구·군 필터 */
  region2?: string;
  joinDateFrom?: string;
  joinDateTo?: string;
  accountStatus?: AccountStatus;
  /** Closed-period batchId — list comes from history snapshot when set. */
  batchId?: string;
}

/** Tab counts for area administrators / 탭별 건수 */
export interface AdminTabCounts {
  all: number;
  active: number;
  inactive: number;
  pending: number;
}

export interface GetAreaAdministratorsResponse {
  data: AreaAdministrator[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  /** Tab counts (always returned regardless of current tab) / 탭별 건수 */
  tabCounts: AdminTabCounts;
}

// ============================================
// GET /api/area-administrators/:id
// Screen: AREA_ADMINISTRATORS
// ============================================

export interface GetAreaAdministratorResponse {
  data: AreaAdministrator;
}

// ============================================
// POST /api/area-administrators
// Screen: AREA_ADMINISTRATORS
// ============================================

export interface CreateAreaAdministratorRequest {
  username: string;
  name: string;
  phone: string;
  password: string;
  email?: string;
  region1: string;
  region2: string;
}

export interface CreateAreaAdministratorResponse {
  data: AreaAdministrator;
}

// ============================================
// PATCH /api/area-administrators/:id
// Screen: AREA_ADMINISTRATORS
// ============================================

export interface UpdateAreaAdministratorRequest {
  name?: string;
  phone?: string;
  email?: string;
  region1?: string;
  region2?: string;
}

export interface UpdateAreaAdministratorResponse {
  data: AreaAdministrator;
}

// ============================================
// DELETE /api/area-administrators/:id
// Screen: AREA_ADMINISTRATORS
// ============================================

export interface DeleteAreaAdministratorResponse {
  success: boolean;
}

// ============================================
// PATCH /api/area-administrators/:id/status
// Screen: AREA_ADMINISTRATORS
// ============================================

export interface ToggleAdminStatusRequest {
  isActive: boolean;
}

export interface ToggleAdminStatusResponse {
  data: AreaAdministrator;
}

// ============================================
// POST /api/area-administrators/:id/approve
// Screen: AREA_ADMINISTRATORS
// ============================================

export interface ApproveAdminResponse {
  data: AreaAdministrator;
}

// ============================================
// POST /api/area-administrators/:id/reject
// Screen: AREA_ADMINISTRATORS
// ============================================

export interface RejectAdminResponse {
  success: boolean;
}

// ============================================
// POST /api/area-administrators/message
// Screen: AREA_ADMINISTRATORS
// ============================================

export type SendMethod = 'sms' | 'kakao' | 'app';

export interface SendMessageRequest {
  adminIds: string[];
  /**
   * One or more delivery methods. Server fans out one dispatch job per
   * (recipient × method). / 발송 방식 목록 (다중)
   */
  sendMethods: SendMethod[];
  content: string;
}

export interface SendMessageResponse {
  success: boolean;
  sentCount: number;
}

