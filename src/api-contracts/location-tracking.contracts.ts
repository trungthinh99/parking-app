/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/location-tracking.contracts.ts
 * Generated at: 2026-06-08T06:02:53.090Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Location Tracking Contracts
 * Shared types for surveyor location tracking between mobile and backend
 */

/** Single location data point sent from the mobile client */
export interface LocationDataPoint {
  /** GPS latitude */
  latitude: number;
  /** GPS longitude */
  longitude: number;
  /** GPS accuracy in meters */
  accuracy?: number | null;
  /** Whether the device reports mock/fake GPS */
  isMock?: boolean;
  /** Client-side epoch seconds when location was captured */
  clientTimestamp?: number | null;
}

/** Request body for batch location tracking upload */
export interface SubmitLocationTrackingRequest {
  /** Screen ID where tracking occurred */
  screenId: string;
  /** Array of location data points (supports batch upload) */
  locations: LocationDataPoint[];
}

/** Response for location tracking submission */
export interface SubmitLocationTrackingResponse {
  /** Number of location records saved (upserted) */
  savedCount: number;
}

// ============================================
// Back-office: GET /api/location-tracking/surveyors
// Screen: PARKING_ANALYSIS_MAP
// ============================================

/** Surveyor status for location tracking / 위치추적 조사원 상태 */
export type SurveyorTrackingStatus = '대기' | '조사중' | '조사완료';

/** Last known location for back-office display / 마지막 위치 포인트 */
export interface SurveyorLocationPoint {
  /** GPS latitude / 위도 */
  latitude: number;
  /** GPS longitude / 경도 */
  longitude: number;
  /** GPS accuracy in meters / GPS 정확도 (미터) */
  accuracy: number | null;
  /** Client-side epoch timestamp / 클라이언트 타임스탬프 */
  clientTimestamp: number | null;
  /** Server-side epoch timestamp / 서버 타임스탬프 */
  timestamp: number;
}

/** Parking lot surveyed by a surveyor today / 오늘 조사한 주차장 포인트 */
export interface SurveyedParkingLotPoint {
  /** Parking lot ID / 주차장 ID */
  parkingLotId: number;
  /** Parking lot name / 주차장 이름 */
  parkingName: string | null;
  /** GPS latitude / 위도 */
  latitude: number;
  /** GPS longitude / 경도 */
  longitude: number;
  /** Epoch timestamp when surveyed / 조사 시각 */
  surveyedAt: number;
}

/** Surveyor location data / 조사원 위치 데이터 */
export interface SurveyorLocationData {
  /** Surveyor user ID / 조사원 ID */
  surveyorId: string;
  /** Surveyor display name / 조사원 이름 */
  surveyorName: string;
  /** Surveyor code (e.g. SVR-001) / 조사원 코드 */
  surveyorCode: string | null;
  /** Avatar relative path (e.g. "avatars/<file>") / 프로필 이미지 경로 */
  avatarUrl: string | null;
  /** Current tracking status / 현재 상태 */
  status: SurveyorTrackingStatus;
  /** Current assigned zone display name / 현재 조사구역 */
  currentZone: string | null;
  /** Most recent location (null if no data) / 현재 위치 */
  currentLocation: SurveyorLocationPoint | null;
  /** Parking lots surveyed today ordered by time ASC / 오늘 조사한 주차장 목록 */
  surveyedParkingLots: SurveyedParkingLotPoint[];
  /** @deprecated Use surveyedParkingLots instead */
  movementHistory: SurveyorLocationPoint[];
  /** Total distance today in meters / 오늘 이동 거리 (미터) */
  totalDistanceMeters: number;
  /** Number of surveys completed today / 오늘 조사 완료 건수 */
  todayCompletedCount: number;
}

/** Request: GET /api/location-tracking/surveyors */
export interface GetSurveyorLocationsRequest {
  /** Comma-separated surveyor IDs / 조사원 ID 목록 (콤마 구분) */
  surveyorIds: string;
  /** Date filter YYYY-MM-DD (defaults to today) / 날짜 필터 */
  date?: string;
  /** Start date filter YYYY-MM-DD (used with endDate for range queries) / 시작일 필터 */
  startDate?: string;
  /** End date filter YYYY-MM-DD (used with startDate for range queries) / 종료일 필터 */
  endDate?: string;
}

/** Response: GET /api/location-tracking/surveyors */
export interface GetSurveyorLocationsResponse {
  data: SurveyorLocationData[];
}
