/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/vehicle-registration.contracts.ts
 * Generated at: 2026-06-08T06:02:53.094Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Vehicle Registration Contracts
 * Shared types for vehicle registration upload/download feature
 */

// Upload status
export const VEHICLE_UPLOAD_STATUSES = ['pending', 'parsing', 'in_progress', 'completed', 'failed'] as const;
export type VehicleUploadStatus = (typeof VEHICLE_UPLOAD_STATUSES)[number];

// Ready status
export const VEHICLE_READY_STATUSES = ['preparing', 'completed'] as const;
export type VehicleReadyStatus = (typeof VEHICLE_READY_STATUSES)[number];

// Geocoding status
export const GEOCODE_STATUSES = ['pending', 'success', 'failed'] as const;
export type GeocodeStatus = (typeof GEOCODE_STATUSES)[number];

// Upload record DTO (for listing upload history)
export interface VehicleUploadDto {
  id: string;
  fileName: string;
  region: string;
  uploaderId: string;
  uploaderName: string;
  totalRows: number;
  successCount: number;
  failedCount: number;
  status: VehicleUploadStatus;
  progress: number;
  readyStatus: VehicleReadyStatus;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Request: Get upload history list
export interface GetVehicleUploadsRequest {
  page?: number;
  limit?: number;
  region?: string;
  /** Closed-period batchId — list comes from history snapshot when set. */
  batchId?: string;
}

// Response: Paginated upload history
export interface GetVehicleUploadsResponse {
  data: VehicleUploadDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Response: Upload Excel file
export interface UploadVehicleExcelResponse {
  data: VehicleUploadDto;
}

// Response: Get upload progress (polling)
export interface GetVehicleUploadProgressResponse {
  id: string;
  status: VehicleUploadStatus;
  progress: number;
  totalRows: number;
  successCount: number;
  failedCount: number;
  errorMessage?: string | null;
}

// Response: Delete upload
export interface DeleteVehicleUploadResponse {
  success: boolean;
}

// Response: Toggle ready status
export interface ToggleVehicleReadyStatusResponse {
  data: {
    id: string;
    readyStatus: VehicleReadyStatus;
  };
}

// Error detail item (failed row)
export interface VehicleUploadErrorItem {
  rowNumber: number;
  message: string;
}

// Request: Get upload error details
export interface GetVehicleUploadErrorsRequest {
  page?: number;
  limit?: number;
  /** Closed-period batchId — read from history snapshot when set */
  batchId?: string;
}

// Response: Paginated error details for an upload
export interface GetVehicleUploadErrorsResponse {
  data: VehicleUploadErrorItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Region stats for parking analysis map ──

// Dynamic vehicle count category (quartile-based buckets)
export type VehicleCountCategory = 'bucket0' | 'bucket1' | 'bucket2' | 'bucket3';

// Bucket definition computed from actual data
export interface VehicleCountBucket {
  /** Bucket key / 버킷 키 */
  key: VehicleCountCategory;
  /** Minimum count (inclusive) / 최소값 (포함) */
  min: number;
  /** Maximum count (exclusive), null = no upper bound / 최대값 (미포함), null = 상한 없음 */
  max: number | null;
  /** Display label / 표시 라벨 */
  label: string;
}

// Grid-clustered vehicle registration stats for map markers
export interface VehicleRegionStatDto {
  /** Cluster identifier (grid cell key) / 클러스터 식별자 */
  region: string;
  /** Total successful vehicle registrations in cluster / 클러스터 내 차량 등록 수 */
  count: number;
  /** Count category (dynamic quartile bucket) / 등록대수 범주 (동적 사분위 버킷) */
  category: VehicleCountCategory;
  /** Centroid latitude of cluster / 클러스터 중심 위도 */
  lat: number;
  /** Centroid longitude of cluster / 클러스터 중심 경도 */
  lng: number;
}

// Response: Region stats for map
export interface GetVehicleRegionStatsResponse {
  data: VehicleRegionStatDto[];
  /** Dynamic bucket definitions based on actual data / 실제 데이터 기반 동적 버킷 정의 */
  buckets: VehicleCountBucket[];
}

// ── Raw map data for parking analysis map (canvas clustering) ──

/** Individual vehicle registration coordinate for map rendering / 지도 렌더링용 차량 등록 좌표 */
export interface VehicleMapDto {
  /** Latitude / 위도 */
  lat: number;
  /** Longitude / 경도 */
  lng: number;
}

/** Response: Vehicle registration map data (raw coordinates, client clusters) / 차량 등록 지도 데이터 (원시 좌표, 클라이언트 클러스터링) */
export interface GetVehicleMapDataResponse {
  data: VehicleMapDto[];
}

/**
 * Compact columnar format for vehicle map data — reduces JSON size by ~50%.
 * Frontend reconstructs: { lat: lats[i], lng: lngs[i] }
 */
export interface GetVehicleMapDataCompactResponse {
  /** Latitudes / 위도 배열 */
  lats: number[];
  /** Longitudes / 경도 배열 */
  lngs: number[];
}
