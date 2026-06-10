/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/data-reset.contracts.ts
 * Generated at: 2026-06-08T06:02:53.089Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Data Reset Module Contracts
 *
 * Reset = move all current upload records of a given tab into a *_HISTORY table
 * (and clear the live table). Executed asynchronously via BullMQ so that large
 * datasets (millions of vehicle rows) do not block the request.
 *
 * Frontend flow: POST reset → receive jobId → poll job status → on completed,
 * refresh upload-history table + show toast.
 */

// ============================================
// Enums & Types
// ============================================

export const DATA_RESET_TARGETS = [
  'parking_lots',
  'survey_area_maps',
  'vehicle_registrations',
] as const;
export type DataResetTarget = (typeof DATA_RESET_TARGETS)[number];

export const DATA_RESET_JOB_STATUSES = [
  'pending',
  'running',
  'completed',
  'failed',
] as const;
export type DataResetJobStatus = (typeof DATA_RESET_JOB_STATUSES)[number];

// ============================================
// POST /api/data-reset/{target}
// Screen: DATA_UPLOAD_*
// ============================================

/** Response after enqueueing a reset job / 초기화 작업 등록 응답 */
export interface CreateDataResetJobResponse {
  /** Job ID for polling status / 상태 조회용 작업 ID */
  jobId: string;
  /** Current status (will start as `pending`) / 작업 상태 */
  status: DataResetJobStatus;
  /** Target dataset / 대상 데이터셋 */
  target: DataResetTarget;
}

// ============================================
// GET /api/data-reset/jobs/:id
// Screen: DATA_UPLOAD_*
// ============================================

/** Reset job state for polling / 초기화 작업 상태 */
export interface DataResetJobDto {
  id: string;
  target: DataResetTarget;
  status: DataResetJobStatus;
  /** Reset batch ID (uuid) used to group HISTORY rows / 이력 묶음 ID */
  batchId: string | null;
  /** Snapshot count moved to HISTORY (set when completed) / 이력으로 이동된 건수 */
  copiedCount: number | null;
  /** Error message when status=failed / 실패 시 오류 메시지 */
  errorMessage: string | null;
  /** ISO 8601 / 작업 생성 시각 */
  createdAt: string;
  /** ISO 8601, null while running / 작업 완료 시각 */
  completedAt: string | null;
  /** Admin user id who triggered the reset / 초기화 실행자 */
  createdBy: string | null;
}

// ============================================
// History list — same shape as the live upload list endpoints, just queried
// from the *_HISTORY tables. Each item carries reset metadata so the drawer
// can show "이력 일자".
// ============================================

export interface DataResetHistoryMeta {
  /** Reset batch this row belongs to / 이력 묶음 ID */
  resetBatchId: string;
  /** Epoch seconds when the reset ran / 초기화 시각 (epoch seconds) */
  resetAt: number;
  /** Admin user id who triggered the reset / 초기화 실행자 */
  resetBy: string | null;
}

/** Per-parking-type counts — same shape as the live ParkingLotUploadDto so
 *  the drawer can reuse the live table's success/failed cell components. */
export interface DataResetParkingBreakdown {
  building: number;
  offStreet: number;
  onStreet: number;
}

/** Parking-lot upload history row — mirrors the live ParkingLotUploadDto
 *  shape with reset metadata appended. */
export interface ParkingLotUploadHistoryItem {
  id: string;
  fileName: string;
  region: string | null;
  uploaderId: string | null;
  uploaderName: string | null;
  totalRows: number;
  successCount: number;
  failedCount: number;
  successBreakdown: DataResetParkingBreakdown;
  failedBreakdown: DataResetParkingBreakdown;
  status: string;
  progress: number;
  readyStatus: string;
  usedInSurvey: boolean;
  errorMessage: string | null;
  memo: string | null;
  /** ISO 8601 — original upload time / 업로드 시각 */
  createdAt: string;
  /** Reset metadata / 초기화 정보 */
  reset: DataResetHistoryMeta;
}

/** Survey-area-map upload history row */
export interface SurveyAreaMapUploadHistoryItem {
  id: string;
  fileName: string;
  region: string | null;
  uploaderId: string | null;
  uploaderName: string | null;
  featureCount: number;
  /** Line type used to render the layer (e.g. 'solid', 'dashed') / 선 타입 */
  lineType: string | null;
  /** Display color hex (e.g. '#3B82F6') / 표시 색상 */
  color: string | null;
  status: string;
  progress: number;
  readyStatus: string;
  errorMessage: string | null;
  createdAt: string;
  reset: DataResetHistoryMeta;
}

/** Vehicle registration upload history row */
export interface VehicleUploadHistoryItem {
  id: string;
  fileName: string;
  region: string | null;
  uploaderId: string | null;
  uploaderName: string | null;
  totalRows: number;
  successCount: number;
  failedCount: number;
  status: string;
  progress: number;
  readyStatus: string;
  errorMessage: string | null;
  createdAt: string;
  reset: DataResetHistoryMeta;
}

// ============================================
// Generic paginated response wrapper used by all 3 history endpoints
// ============================================

export interface DataResetHistoryRequest {
  page?: number;
  limit?: number;
  /** Filter by region / 지역 필터 */
  region?: string;
  /** Filter by reset batch id / 이력 묶음 필터 */
  batchId?: string;
}

export interface DataResetHistoryResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// GET /api/data-reset/survey-periods
// Screen: PARKING_ANALYSIS_MAP
//
// Returns the survey periods used to populate the 조사연도 dropdown on the
// 실태분석 Map page.
//
// A "survey period" is the data window between two reset boundaries:
//   - period_0    : starts at the configured first survey year
//                   (TBL_SYSTEM_SETTINGS key 'survey.firstYear'), closed by
//                   the first reset (its batchId is the period's identifier).
//   - period_i>0  : starts at YEAR(reset[i-1].resetAt), closed by reset[i]
//                   (its batchId is the period's identifier).
//   - period_last : the currently-active period — starts at YEAR of the last
//                   reset (or firstYear if no reset has run yet); batchId is
//                   `null`, meaning "query the live tables".
//
// The frontend sends `batchId` back to the map-data endpoint. A null batchId
// resolves to live data; a non-null batchId resolves to history rows whose
// RESET_BATCH_ID matches.
// ============================================

export interface SurveyPeriodItem {
  /** Display year for the dropdown / 표시 연도 */
  year: number;
  /**
   * Identifier of the reset that closed this period. `null` for the
   * currently-active period (data still lives in the production tables).
   * 이 시기를 닫은 초기화 작업의 batchId. 진행 중 시기는 null.
   */
  batchId: string | null;
}

export interface SurveyPeriodsResponse {
  /** Periods sorted newest-first / 시기 목록 (최신 시기 먼저) */
  periods: SurveyPeriodItem[];
}
