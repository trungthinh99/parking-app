/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/audit-log.contracts.ts
 * Generated at: 2026-06-08T06:02:53.089Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Audit Log Module Contracts
 * Request/Response types for Audit Log API
 */

// ============================================
// Enums & Types
// ============================================

export const AUDIT_ACTION_TYPES = [
  'LOGIN',
  'LOGOUT',
  'CREATE',
  'UPDATE',
  'DELETE',
  'STATUS_CHANGE',
  'PASSWORD_RESET',
  'APPROVE',
  'REJECT',
  'UPLOAD',
  'SETTINGS_CHANGE',
  'DATA_RESET',
] as const;
export type AuditActionType = (typeof AUDIT_ACTION_TYPES)[number];

export const AUDIT_TARGET_ENTITIES = [
  'Manager',
  'UserApp',
  'ParkingFee',
  'VehicleUpload',
  'SurveyAreaMap',
  'SurveyArea',
  'ParkingLotUpload',
  'ParkingLot',
  'SurveyorZoneAssignment',
  'Message',
  'System',
  'ChatMessage',
  'InviteLink',
  'Tenant',
  'DataReset',
] as const;
export type AuditTargetEntity = (typeof AUDIT_TARGET_ENTITIES)[number];

export const AUDIT_SORT_FIELDS = ['createdAt', 'actionType', 'actorName'] as const;
export type AuditSortField = (typeof AUDIT_SORT_FIELDS)[number];

// ============================================
// Entity (API Response shape)
// ============================================

export interface AuditLogEntry {
  id: string;
  actionType: AuditActionType;
  targetEntity: AuditTargetEntity;
  targetId: string | null;
  targetName: string | null;
  actorId: string;
  actorName: string;
  actorUsername: string;
  description: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  screenId: string | null;
  createdAt: string;
}

// ============================================
// GET /api/audit-logs
// Screen: SYSTEM_LOGS
// ============================================

export interface GetAuditLogsRequest {
  page?: number;
  limit?: number;
  search?: string;
  actionType?: AuditActionType;
  targetEntity?: AuditTargetEntity;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: AuditSortField;
  sortOrder?: 'asc' | 'desc';
  /** Closed-period batchId — list comes from history snapshot when set. */
  batchId?: string;
}

export interface GetAuditLogsResponse {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// GET /api/audit-logs/:id
// Screen: SYSTEM_LOGS
// ============================================

export interface GetAuditLogDetailResponse {
  data: AuditLogEntry;
}
