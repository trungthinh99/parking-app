/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/survey-progress.contracts.ts
 * Generated at: 2026-06-08T06:02:53.093Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Survey Progress Module Contracts
 * Request/Response types for Survey Progress API (조사 진행 현황)
 */

// ============================================
// Enums & Types
// ============================================

export const SURVEY_PROGRESS_STATUSES = ['completed', 'in_progress', 'not_started'] as const;
export type SurveyProgressStatus = (typeof SURVEY_PROGRESS_STATUSES)[number];

// ============================================
// GET /api/survey-areas/progress
// Screen: SURVEY_PROGRESS
// ============================================

export interface GetSurveyProgressRequest {
  /** Region 1 filter, comma-separated (city/province) / 조사지역 필터 */
  region1?: string;
  /** Region 2 filter, comma-separated as full "region1 region2" pairs / 조사구역 필터 */
  region2?: string;
  /** Zone feature IDs filter (comma-separated) / 조사구역번호 필터 */
  zoneFeatureIds?: string;
  /** Parking type filter: 'building' | 'off_street' | 'on_street' | 'all' / 주차장 유형 필터 */
  parkingType?: string;
  /** Page number / 페이지 번호 */
  page?: number;
  /** Items per page / 페이지당 항목 수 */
  limit?: number;
  /** Closed-period batch id — routes the aggregation to TBL_PARKING_LOTS_HISTORY / 종료된 조사연도 배치 ID */
  batchId?: string;
}

/** A single row in the survey progress table / 조사 진행 현황 테이블 행 */
export interface SurveyProgressItem {
  /** Composite ID / 복합 ID */
  id: string;
  /** Zone code from survey area / 조사구역 코드 */
  areaCode: string;
  /** Region name from upload / 조사지역명 */
  regionName: string;
  /** Parking type / 주차장 유형 */
  parkingType: 'building' | 'off_street' | 'on_street';
  /** Completed parking lots (isUpdated=true, isDraft=false) / 완료 주차장 수 */
  completedCount: number;
  /** Total parking lots in zone / 전체 주차장 수 */
  totalCount: number;
  /** Derived status / 파생 상태 */
  status: SurveyProgressStatus;
}

/** Summary stats per parking type category / 유형별 요약 통계 */
export interface SurveyProgressSummary {
  /** Number of zones with completed status / 완료 구역 수 */
  completed: number;
  /** Number of zones in progress / 진행중 구역 수 */
  inProgress: number;
  /** Number of zones not started / 미진행 구역 수 */
  notStarted: number;
  /** Completion percentage / 완료율 */
  percent: number;
}

// ============================================
// GET /api/survey-areas/progress/detail
// Screen: SURVEY_PROGRESS
// ============================================

export interface GetSurveyProgressDetailRequest {
  /** Region name (e.g. "서울특별시 강동구") / 조사지역명 */
  region: string;
  /** Survey area zone code (e.g. "12") / 조사구역 코드 */
  areaCode: string;
  /** Parking type: 'building' | 'off_street' | 'on_street' / 주차장 유형 */
  parkingType: 'building' | 'off_street' | 'on_street';
  /** Search keyword (address, parking name) / 검색어 */
  search?: string;
  /** Page number / 페이지 번호 */
  page?: number;
  /** Items per page / 페이지당 항목 수 */
  limit?: number;
  /** Filter table rows by a single survey-area zone code (selected from the bar chart) / 조사구역 코드로 행 필터링 */
  zoneCode?: string;
  /** Closed-period batch id — routes the read to TBL_PARKING_LOTS_HISTORY / 종료된 조사연도 배치 ID */
  batchId?: string;
}

/** Per-zone progress entry shown in the detail-page bar chart.
 *  Each bar represents one survey-area zone within the selected region. /
 *  상세 페이지 바 차트의 조사구역별 진행 통계 */
export interface SurveyProgressDetailZone {
  /** Survey area zone code (e.g. SVR-008, "12") / 조사구역 코드 */
  zoneCode: string;
  /** Total parking lots in this zone / 해당 조사구역의 전체 대상 수 */
  totalCount: number;
  /** Completed parking lots in this zone / 해당 조사구역의 완료 수 */
  completedCount: number;
}

/** Summary info for the detail header card / 상세 헤더 카드 요약 정보 */
export interface SurveyProgressDetailSummary {
  /** Zone code / 조사구역번호 */
  areaCode: string;
  /** Region name / 조사지역 */
  regionName: string;
  /** Survey year / 조사연도 */
  surveyYear: number;
  /** Parking type / 조사유형 */
  parkingType: 'building' | 'off_street' | 'on_street';
  /** Total parking lots / 전체 조사 대상 수 */
  totalCount: number;
  /** Completed parking lots / 완료 수 */
  completedCount: number;
  /** Completion percentage / 진행율 (%) */
  percent: number;
  /** Derived status / 상태 */
  status: SurveyProgressStatus;
}

/** A single parking lot in the detail table / 상세 테이블 주차장 행 */
export interface SurveyProgressDetailItem {
  /** Parking lot ID / 주차장 ID */
  id: number;
  /** Display code (surveyArea + seqNumber) / 표시 코드 */
  displayCode: string;
  /** Survey area zone code (e.g. "40") / 조사구역 코드 */
  zoneCode: string | null;
  /** Address / 주차장 주소 */
  address: string;
  /** Parking lot name / 주차장명 */
  parkingName: string | null;
  /** Assigned surveyor name (first of surveyorNames, kept for compatibility) / 담당 조사원 */
  surveyorName: string | null;
  /** All surveyors assigned to the zone containing this lot / 해당 구역 담당 조사원 목록 */
  surveyorNames: string[];
  /** Survey period (start - end) / 조사 기간 */
  surveyPeriod: string | null;
  /** Vehicle registration count / 자동차 등록 대수 */
  vehicleCount: number | null;
  /** Survey status / 상태 */
  status: 'completed' | 'not_completed';
  /** Latitude / 위도 */
  lat: number | null;
  /** Longitude / 경도 */
  lng: number | null;
  /** Survey area boundary polygon (for map display) / 조사구역 경계 폴리곤 */
  polygon?: Array<{ lat: number; lng: number }> | null;
}

export interface GetSurveyProgressDetailResponse {
  summary: SurveyProgressDetailSummary;
  /** Per-zone breakdown for the bar chart (computed on full filtered set, before paging/zone filter) /
   *  바 차트용 조사구역별 진행 통계 */
  zones: SurveyProgressDetailZone[];
  data: SurveyProgressDetailItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetSurveyProgressResponse {
  data: SurveyProgressItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  /** Summary stats for charts (computed on full filtered dataset, not paginated) / 차트용 요약 통계 */
  summary: {
    /** Attached parking (building) / 부설주차장 */
    attached: SurveyProgressSummary;
    /** Outdoor parking (off_street) / 노외주차장 */
    outdoor: SurveyProgressSummary;
    /** On-street parking (on_street) / 노상주차장 */
    onStreet: SurveyProgressSummary;
    /** Total / 전체 */
    total: SurveyProgressSummary;
  };
}
