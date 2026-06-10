/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/surveyors.contracts.ts
 * Generated at: 2026-06-08T06:02:53.093Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Surveyors Module Contracts
 * Request/Response types for Surveyors (App Users) API
 */

// ============================================
// Enums & Types
// ============================================

export const SURVEYOR_TAB_FILTERS = ['all', 'active', 'inactive', 'pending'] as const;
export type SurveyorTabFilter = (typeof SURVEYOR_TAB_FILTERS)[number];

export const SURVEYOR_PENDING_STATUSES = ['pending_approval', 'rejected'] as const;
export type SurveyorPendingStatus = (typeof SURVEYOR_PENDING_STATUSES)[number];

/** Surveyor work status derived from assigned zones' parking lot progress / 조사원 작업 상태 */
export const SURVEYOR_WORK_STATUSES = ['pending', 'in_progress', 'completed'] as const;
export type SurveyorWorkStatus = (typeof SURVEYOR_WORK_STATUSES)[number];

// ============================================
// Entity (API Response shape)
// ============================================

export interface AppUser {
  id: string;
  surveyorCode: string | null;
  name: string;
  phone: string;
  birthDate: string;
  email: string | null;
  companyCode: string | null;
  isActive: boolean;
  isPendingApproval: boolean;
  pendingStatus: SurveyorPendingStatus | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Surveyor list item (includes mock fields for future)
// ============================================

/** Assigned zone codes grouped by region2 (구·군) / 지역별 할당 구역번호 */
export interface SurveyorRegionZones {
  /** Full upload region (e.g. "서울특별시 강동구") / 업로드 지역 전체 이름 */
  region: string;
  /** District-only (region2) display name (e.g. "강동구") / 구·군 이름 */
  region2: string;
  /** Zone codes (raw text, may include duplicates from CAD) / 구역 코드 목록 */
  zoneCodes: string[];
}

export interface SurveyorListItem {
  id: string;
  surveyorCode: string | null;
  name: string;
  phone: string;
  /** Avatar relative path (e.g. "avatars/<file>") / 프로필 이미지 경로 */
  avatarUrl: string | null;
  /** Survey regions assigned to this surveyor / 조사원에게 할당된 조사 지역 목록 */
  regions: string[];
  assignedAreaCodes: string[];
  /** Per-region grouped zone codes for the merged list-column UI / 지역별 그룹화 구역 코드 */
  regionZones: SurveyorRegionZones[];
  /**
   * District names (region2) this surveyor is GRANTED (active status), i.e. the
   * districts zones may be allocated in. Drives the zone-edit cell's region
   * picker — independent of which districts already have zones assigned.
   * 조사원에게 부여된 시군구 목록 (활성). 조사구역 할당 가능 범위.
   */
  allowedRegion2: string[];
  /** Work status derived from assigned zones' parking lot survey progress.
   *  - 'pending': assigned zones but no item completed/draft yet (대기)
   *  - 'in_progress': at least one item completed or saved as draft (조사중)
   *  - 'completed': all parking lots in assigned zones are completed (조사완료)
   *  / 조사 진행 상태 */
  surveyStatus: SurveyorWorkStatus;
  isActive: boolean;
  createdAt: string;
}

// ============================================
// GET /api/surveyors
// Screen: SURVEYORS
// ============================================

export interface GetSurveyorsRequest {
  page?: number;
  limit?: number;
  search?: string;
  tab?: SurveyorTabFilter;
  /** Filter by survey region (e.g. "서울 강남구") / 조사 지역 필터 */
  region?: string;
  /**
   * Filter to surveyors GRANTED this district (region2, e.g. "강동구") in active
   * status — independent of whether they already have zones there. Drives the
   * 조사원 배정 picker so only surveyors eligible for the zone's district appear.
   * 부여된 시군구로 필터 (활성 부여 기준).
   */
  grantedRegion2?: string;
  /** Filter by join date from (YYYY-MM-DD) / 가입일 시작 */
  joinDateFrom?: string;
  /** Filter by join date to (YYYY-MM-DD) / 가입일 종료 */
  joinDateTo?: string;
  /** Filter by account status / 계정 상태 필터 */
  accountStatus?: 'active' | 'inactive';
  /** Filter by zone assignment status / 조사구역 할당 상태 필터 */
  zoneAssignment?: 'assigned' | 'unassigned';
  /** Filter by a specific zone feature ID — only return surveyors assigned to this zone / 특정 조사구역에 배정된 조사원만 조회 */
  zoneFeatureId?: string;
  /** When true, exclude surveyors who have no zone assignment (used by analysis map panel) / 배정된 구역이 없는 조사원 제외 */
  requireAssignment?: boolean;
  /** Closed-period batchId — list comes from history snapshot when set. */
  batchId?: string;
}

/** Tab counts for surveyors / 탭별 건수 */
export interface SurveyorTabCounts {
  all: number;
  active: number;
  inactive: number;
  pending: number;
}

export interface GetSurveyorsResponse {
  data: SurveyorListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  /** Tab counts (always returned regardless of current tab) / 탭별 건수 */
  tabCounts: SurveyorTabCounts;
}

// ============================================
// GET /api/surveyors/:id
// Screen: SURVEYORS
// ============================================

export interface SurveyorDetail {
  id: string;
  surveyorCode: string | null;
  name: string;
  phone: string;
  birthDate: string;
  email: string | null;
  isActive: boolean;
  /** Assigned zones grouped by region / 지역별 할당 구역 */
  zones: SurveyZone[];
  createdAt: string;
}

export interface GetSurveyorDetailResponse {
  data: SurveyorDetail;
}

// ============================================
// PATCH /api/surveyors/:id/toggle-active
// Screen: SURVEYORS
// ============================================

export interface ToggleSurveyorActiveRequest {
  isActive: boolean;
}

export interface ToggleSurveyorActiveResponse {
  data: SurveyorListItem;
}

// ============================================
// GET /api/surveyors/pending-users
// Screen: SURVEYORS
// ============================================

export interface GetPendingAppUsersRequest {
  page?: number;
  limit?: number;
  search?: string;
  /** Filter by region / 관리 지역 필터 */
  region?: string;
  /** Filter by join date from (YYYY-MM-DD) / 가입일 시작 */
  joinDateFrom?: string;
  /** Filter by join date to (YYYY-MM-DD) / 가입일 종료 */
  joinDateTo?: string;
  /** Filter by pending status / 상태 필터 */
  pendingStatus?: SurveyorPendingStatus;
}

export interface GetPendingAppUsersResponse {
  data: AppUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  /** Tab counts (always returned regardless of current tab) / 탭별 건수 */
  tabCounts: SurveyorTabCounts;
}

// ============================================
// POST /api/surveyors/pending-users/:id/approve
// Screen: SURVEYORS
// ============================================

export interface ApproveAppUserResponse {
  data: AppUser;
}

// ============================================
// POST /api/surveyors/pending-users/:id/reject
// Screen: SURVEYORS
// ============================================

export interface RejectAppUserResponse {
  success: boolean;
}

// ============================================
// DELETE /api/surveyors/:id
// Screen: SURVEYORS
// ============================================

export interface DeleteSurveyorResponse {
  success: boolean;
}

// ============================================
// Survey Zone Assignment
// ============================================

/** Survey zone derived from Point/Text features in uploaded CAD files */
export interface SurveyZone {
  /** Feature ID (Point feature in TBL_SURVEY_AREA_MAPS) / 피쳐 ID */
  featureId: string;
  /** Upload ID / 업로드 ID */
  uploadId: string;
  /** Region from upload (e.g. "금천구") / 업로드 지역 */
  region: string;
  /** Zone code - original text from CAD file (e.g. "13") / 구역 코드 */
  zoneCode: string;
  /** Display name (e.g. "금천구 13") / 표시 이름 */
  displayName: string;
}

// ============================================
// GET /api/surveyors/available-zones
// Screen: SURVEYORS
// ============================================

export interface GetAvailableZonesRequest {
  /** Filter by region / 지역 필터 */
  region?: string;
}

export interface GetAvailableZonesResponse {
  data: SurveyZone[];
}

// ============================================
// PUT /api/surveyors/:id/zones
// Screen: SURVEYORS
// ============================================

export interface UpdateSurveyorZonesRequest {
  /** Feature IDs to assign / 할당할 피쳐 ID 목록 */
  featureIds: string[];
}

export interface UpdateSurveyorZonesResponse {
  data: SurveyZone[];
  /**
   * Zone codes that were kept (NOT removed) because the surveyor already
   * surveyed them or registered a parking lot there. The UI shows these as a
   * soft warning. / 조사 진행·주차장 등록으로 삭제하지 못한 구역 코드
   */
  blocked?: string[];
}

// ============================================
// POST /api/surveyors/:id/zones/quick-add
// Screen: SURVEYORS
// ============================================

/**
 * Quick-add zone codes from the list table's inline input. Server resolves
 * each code against available zones in `region2` and unions with existing
 * assignments (existing codes are skipped silently).
 */
export interface QuickAddSurveyorZonesRequest {
  /** Target district (e.g. "강동구") / 대상 구·군 */
  region2: string;
  /** Raw text codes (e.g. ["1","3","5"]) / 추가할 구역 코드 목록 */
  zoneCodes: string[];
}

export interface QuickAddSurveyorZonesResponse {
  /** Codes actually added (excludes duplicates) / 실제 추가된 코드 */
  added: string[];
  /** Codes that didn't match any available zone in this region2 / 매칭 실패 코드 */
  notFound: string[];
}

// ============================================
// POST /api/surveyors/:id/zones/quick-remove
// Screen: SURVEYORS
// ============================================

/**
 * Quick-remove zone codes from a surveyor for a specific region2 (구·군).
 * Resolves each code against the surveyor's CURRENT assignments in that
 * district and unassigns them. Codes not currently assigned are skipped.
 */
export interface QuickRemoveSurveyorZonesRequest {
  /** Target district (e.g. "강동구") / 대상 구·군 */
  region2: string;
  /** Raw text codes to remove (e.g. ["1","3","5"]) / 삭제할 구역 코드 */
  zoneCodes: string[];
}

export interface QuickRemoveSurveyorZonesResponse {
  /** Codes actually removed (excludes ones that weren't assigned) / 실제 삭제된 코드 */
  removed: string[];
  /**
   * Codes that were kept (NOT removed) because the surveyor already surveyed
   * them or registered a parking lot there. / 조사 진행·주차장 등록으로 삭제하지 못한 코드
   */
  blocked?: string[];
}

// ============================================
// GET /api/surveyors/:id/zones
// Screen: SURVEYORS
// ============================================

export interface GetSurveyorZonesResponse {
  data: SurveyZone[];
}

// ============================================
// GET /api/app/surveyor-zones
// Screen: APP_PRIVATE_PARKING, APP_STREET_PARKING, APP_ON_STREET_PARKING
// ============================================

/** Response: Get assigned zones for the authenticated surveyor (mobile app) */
export interface GetAppSurveyorZonesResponse {
  data: SurveyZone[];
}

/** Response: Get assigned regions for the authenticated surveyor (mobile app) */
export interface GetAppSurveyorRegionsResponse {
  /** Unique region names assigned to the surveyor / 조사원에게 할당된 지역명 목록 */
  data: string[];
}

// ============================================
// GET /api/app/surveyor-zone-boundaries
// Screen: APP_PRIVATE_PARKING, APP_STREET_PARKING, APP_ON_STREET_PARKING
// ============================================

/** Polygon boundary with coordinates and bounding box / 폴리곤 경계 데이터 */
export interface ZoneBoundaryPolygon {
  /** Polygon coordinates as [lng, lat] tuples / 폴리곤 좌표 (경도, 위도) */
  coords: [number, number][];
  /** Bounding box for quick spatial checks / 바운딩 박스 */
  bbox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  /** Zone display name (e.g. "금천구 13") / 구역 표시 이름 */
  displayName?: string;
}

/** Response: Get zone boundary polygons for the authenticated surveyor (mobile app) */
export interface GetAppSurveyorZoneBoundariesResponse {
  /** Zone boundary polygons assigned to the surveyor / 조사원에게 할당된 구역 경계 폴리곤 목록 */
  data: ZoneBoundaryPolygon[];
}

// ============================================
// POST /api/surveyors/message
// Screen: SURVEYORS
// ============================================

/** Request: Send message to surveyors / 조사원에게 메시지 발송 */
export interface SendSurveyorMessageRequest {
  /** Target surveyor IDs / 수신 조사원 ID 목록 */
  surveyorIds: string[];
  /**
   * One or more delivery methods to use for this single message.
   * The server fans out one dispatch job per (recipient × method).
   * / 발송 방식 목록 (다중)
   */
  sendMethods: Array<'sms' | 'kakao' | 'app'>;
  /** Message content / 메시지 내용 */
  content: string;
}

/** Response: Send message result / 메시지 발송 결과 */
export interface SendSurveyorMessageResponse {
  success: boolean;
  sentCount: number;
}
