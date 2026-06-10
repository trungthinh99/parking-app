/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/survey-area-map.contracts.ts
 * Generated at: 2026-06-08T06:02:53.092Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Survey Area Map Contracts
 * Shared types for survey area map DWG upload/conversion feature
 */

// Upload status
export const SURVEY_MAP_UPLOAD_STATUSES = ['pending', 'converting', 'completed', 'failed'] as const;
export type SurveyMapUploadStatus = (typeof SURVEY_MAP_UPLOAD_STATUSES)[number];

// Ready status
export const SURVEY_MAP_READY_STATUSES = ['preparing', 'completed'] as const;
export type SurveyMapReadyStatus = (typeof SURVEY_MAP_READY_STATUSES)[number];

// Upload record DTO (for listing upload history)
export interface SurveyAreaMapUploadDto {
  id: string;
  fileName: string;
  region: string;
  areaType: string | null;
  lineType: string;
  color: string;
  uploaderId: string;
  uploaderName: string;
  featureCount: number;
  status: SurveyMapUploadStatus;
  readyStatus: SurveyMapReadyStatus;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Active conversion info (included in list response)
export interface ActiveConversionInfo {
  id: string;
  fileName: string;
  region: string;
  areaType: string | null;
  lineType: string;
  status: SurveyMapUploadStatus;
}

// Response: Paginated upload history
export interface GetSurveyAreaMapUploadsResponse {
  data: SurveyAreaMapUploadDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  activeConversion: ActiveConversionInfo | null;
}

// Response: Upload DWG file
export interface UploadSurveyAreaMapResponse {
  data: SurveyAreaMapUploadDto;
}

// Response: Delete upload
export interface DeleteSurveyAreaMapUploadResponse {
  success: boolean;
}

// Request: Update upload fields
export interface UpdateSurveyAreaMapUploadRequest {
  areaType?: string;
  lineType?: string;
  color?: string;
}

// Response: Update upload fields
export interface UpdateSurveyAreaMapUploadResponse {
  data: SurveyAreaMapUploadDto;
}

// Request: Check duplicate upload
export interface CheckSurveyAreaMapDuplicateRequest {
  region: string;
  areaType?: string;
  lineType: string;
}

// Response: Check duplicate upload
export interface CheckSurveyAreaMapDuplicateResponse {
  duplicate: boolean;
  existingUpload: Pick<SurveyAreaMapUploadDto, 'id' | 'fileName' | 'region' | 'areaType' | 'lineType' | 'uploaderName' | 'createdAt'> | null;
}

// Response: Toggle ready status
export interface ToggleSurveyMapReadyStatusResponse {
  data: {
    id: string;
    readyStatus: SurveyMapReadyStatus;
  };
}

// --- Map Features (for parking analysis map display) ---

// Single geometry feature for map display.
// `uploadId` and `properties` are optional: the live map endpoint omits them to
// shrink the payload (uploadId is redundant with the parent layer, and only the
// Point `Text` property is ever rendered). History/snapshot responses may still
// include the full objects.
export interface SurveyAreaMapFeatureDto {
  id: string;
  uploadId?: string;
  layerName: string | null;
  geometryType: string | null;
  geometry: object | null;
  properties?: object | null;
}

// Upload layer group with its features for map display
export interface SurveyAreaMapLayerDto {
  uploadId: string;
  region: string;
  areaType: string | null;
  lineType: string;
  color: string;
  fileName: string;
  features: SurveyAreaMapFeatureDto[];
}

// Feature subset selector for the map endpoint.
// - 'zone': only survey-zone boundary layers (조사구역/구역번호) — tiny payload.
// - 'building': everything else (cadastral / building outlines) — large payload.
// - 'all': both (default; backward compatible).
export const SURVEY_MAP_FEATURE_KINDS = ['zone', 'building', 'all'] as const;
export type SurveyMapFeatureKind = (typeof SURVEY_MAP_FEATURE_KINDS)[number];

// Request: Get map features
export interface GetSurveyAreaMapFeaturesRequest {
  region?: string;
  kind?: SurveyMapFeatureKind;
}

// Response: Get map features
export interface GetSurveyAreaMapFeaturesResponse {
  data: SurveyAreaMapLayerDto[];
}
