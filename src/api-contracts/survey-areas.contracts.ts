/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/survey-areas.contracts.ts
 * Generated at: 2026-06-08T06:02:53.093Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Survey Areas Module Contracts
 * Request/Response types for Survey Areas API (조사구역 관리)
 */

import type { SortOrder } from './area-administrators.contracts';

// ============================================
// Enums & Types
// ============================================

export const SURVEY_AREA_STATUSES = ['미배정', '배정됨', '조사중', '완료'] as const;
export type SurveyAreaStatus = (typeof SURVEY_AREA_STATUSES)[number];

export const SURVEY_AREA_SORT_FIELDS = ['name', 'code', 'regionName', 'status', 'updatedAt', 'areaKm2'] as const;
export type SurveyAreaSortField = (typeof SURVEY_AREA_SORT_FIELDS)[number];

// ============================================
// Entity (API Response shapes)
// ============================================

export interface SurveyAreaAssigneeDto {
  id: string;
  assigneeId: string;
  name: string;
  surveyorCode: string | null;
  avatarUrl?: string | null;
}

export interface SurveyAreaItem {
  id: string;
  code: string;
  name: string;
  region1: string;
  region2: string;
  regionName: string;
  status: SurveyAreaStatus;
  areaKm2: number | null;
  isActive: boolean;
  year: number | null;
  assignees: SurveyAreaAssigneeDto[];
  extraAssigneeCount: number;
  /** Total parking lots in this zone / 해당 구역 내 주차장 수 */
  parkingLotCount: number;
  /** Survey progress percentage (0-100) / 조사 진행률 (0-100) */
  surveyProgress: number;
  updatedAt: string;
}

export interface SurveyAreaPolygonPoint {
  lat: number;
  lng: number;
}

export interface SurveyAreaDetail extends SurveyAreaItem {
  polygon: SurveyAreaPolygonPoint[] | null;
  mapFeatureIds: string[];
  createdAt: string;
}

// ============================================
// GET /api/survey-areas
// Screen: SURVEY_AREA_MANAGEMENT
// ============================================

export interface GetSurveyAreasRequest {
  page?: number;
  limit?: number;
  search?: string;
  region1?: string;
  region2?: string;
  status?: SurveyAreaStatus;
  year?: number;
  /** Closed-period batch id — routes the list to the history snapshot. */
  batchId?: string;
  code?: string;
  sortBy?: SurveyAreaSortField;
  sortOrder?: SortOrder;
}

export interface GetSurveyAreasResponse {
  data: SurveyAreaItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// GET /api/survey-areas/:id
// Screen: SURVEY_AREA_MANAGEMENT
// ============================================

export interface GetSurveyAreaDetailResponse {
  data: SurveyAreaDetail;
}

// ============================================
// POST /api/survey-areas
// Screen: SURVEY_AREA_MANAGEMENT
// ============================================

export interface CreateSurveyAreaRequest {
  name: string;
  code: string;
  region1: string;
  region2: string;
  areaKm2?: number | null;
  status?: SurveyAreaStatus;
  isActive?: boolean;
  year?: number | null;
  mapFeatureIds?: string[];
}

export interface CreateSurveyAreaResponse {
  data: SurveyAreaDetail;
}

// ============================================
// PATCH /api/survey-areas/:id
// Screen: SURVEY_AREA_MANAGEMENT
// ============================================

export interface UpdateSurveyAreaRequest {
  name?: string;
  code?: string;
  region1?: string;
  region2?: string;
  areaKm2?: number | null;
  status?: SurveyAreaStatus;
  isActive?: boolean;
  year?: number | null;
  mapFeatureIds?: string[];
}

export interface UpdateSurveyAreaResponse {
  data: SurveyAreaDetail;
}

// ============================================
// DELETE /api/survey-areas/:id
// Screen: SURVEY_AREA_MANAGEMENT
// ============================================

export interface DeleteSurveyAreaResponse {
  message: string;
}

// ============================================
// POST /api/survey-areas/:id/assignees
// Screen: SURVEY_AREA_MANAGEMENT
// ============================================

export interface AddSurveyAreaAssigneesRequest {
  assigneeIds: string[];
}

export interface AddSurveyAreaAssigneesResponse {
  data: SurveyAreaAssigneeDto[];
}

// ============================================
// DELETE /api/survey-areas/:id/assignees/:assigneeId
// Screen: SURVEY_AREA_MANAGEMENT
// ============================================

export interface RemoveSurveyAreaAssigneeResponse {
  message: string;
}
