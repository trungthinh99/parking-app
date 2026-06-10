import type {
  GetParkingLotMapDataResponse,
  GetParkingLotDetailResponse,
  GetSurveyListResponse,
  UpdateParkingLotRequest,
  UpdateParkingLotResponse,
  CreateParkingLotRequest,
  CreateParkingLotResponse,
  GetNextSeqNumberResponse,
  UploadParkingLotPhotoResponse,
  UpdateParkingLotPhotoRequest,
  UpdateParkingLotPhotoResponse,
  GetParkingLotPhotosResponse,
  DeleteParkingLotPhotoResponse,
  ParkingLotPhotoCategory,
  ParkingLotType,
  ScreenId,
} from "@/src/api-contracts";

import { apiRequest, apiUploadWithFields } from "@/src/api/client";
import type { MapBounds } from "@/src/features/private-parking/KakaoMap";

/**
 * Fetch parking lot map data with viewport-based loading.
 * Filters by parkingType and map bounds for optimal performance.
 */
export async function getParkingLotMapData(params: {
  parkingType: ParkingLotType;
  bounds: MapBounds;
  screenId: ScreenId;
  region?: string;
}): Promise<GetParkingLotMapDataResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("parkingType", params.parkingType);
  searchParams.set("swLat", String(params.bounds.swLat));
  searchParams.set("swLng", String(params.bounds.swLng));
  searchParams.set("neLat", String(params.bounds.neLat));
  searchParams.set("neLng", String(params.bounds.neLng));
  if (params.region) {
    searchParams.set("region", params.region);
  }

  return apiRequest<void, GetParkingLotMapDataResponse>({
    method: "GET",
    path: `/app/parking-lots/map-data?${searchParams.toString()}`,
    screenId: params.screenId,
  });
}

/**
 * Fetch parking lot detail by ID.
 * Returns full information for bottom sheet display.
 */
export async function getParkingLotDetail(params: {
  id: number;
  screenId: ScreenId;
}): Promise<GetParkingLotDetailResponse> {
  return apiRequest<void, GetParkingLotDetailResponse>({
    method: "GET",
    path: `/app/parking-lots/${params.id}`,
    screenId: params.screenId,
  });
}

/**
 * Update parking lot fields from manual survey edit.
 * Sets isUpdated flag on the record, changing marker color to solid blue (#072AC8).
 */
export async function updateParkingLot(params: {
  id: number;
  screenId: ScreenId;
  data: UpdateParkingLotRequest;
}): Promise<UpdateParkingLotResponse> {
  return apiRequest<UpdateParkingLotRequest, UpdateParkingLotResponse>({
    method: "PATCH",
    path: `/app/parking-lots/${params.id}`,
    screenId: params.screenId,
    body: params.data,
  });
}

/**
 * Create a new parking lot from field survey (map tap).
 */
export async function createParkingLot(params: {
  screenId: ScreenId;
  data: CreateParkingLotRequest;
}): Promise<CreateParkingLotResponse> {
  return apiRequest<CreateParkingLotRequest, CreateParkingLotResponse>({
    method: "POST",
    path: `/app/parking-lots`,
    screenId: params.screenId,
    body: params.data,
  });
}

/**
 * Fetch the next seqNumber for a surveyArea (zone-wide, all parking types share the same counter).
 * Used to auto-fill uniqueNumber3 when placing a new marker.
 */
export async function getNextSeqNumber(params: {
  surveyArea: string;
  screenId: ScreenId;
}): Promise<GetNextSeqNumberResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("surveyArea", params.surveyArea);

  return apiRequest<void, GetNextSeqNumberResponse>({
    method: "GET",
    path: `/app/parking-lots/next-seq?${searchParams.toString()}`,
    screenId: params.screenId,
  });
}

/**
 * Fetch survey list for survey zone management screen.
 * Returns parking lots filtered by tab (data/completed) within surveyor's assigned zones.
 */
export async function getSurveyList(params: {
  tab: "data" | "completed";
  screenId: ScreenId;
  parkingType?: ParkingLotType;
  /** Comma-separated status filters: original,updated,new */
  status?: string;
  /** Filter by isCreatedByApp: true = 새로 등록, false = 기존 데이터 */
  isCreatedByApp?: boolean;
  /** Filter by isUpdated: true = 업데이트된 데이터, false = 기존 데이터 */
  isUpdated?: boolean;
  /** Comma-separated onStreetSubType filters */
  onStreetSubType?: string;
}): Promise<GetSurveyListResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("tab", params.tab);
  if (params.parkingType) {
    searchParams.set("parkingType", params.parkingType);
  }
  if (params.status) {
    searchParams.set("status", params.status);
  }
  if (params.isCreatedByApp !== undefined) {
    searchParams.set("isCreatedByApp", String(params.isCreatedByApp));
  }
  if (params.isUpdated !== undefined) {
    searchParams.set("isUpdated", String(params.isUpdated));
  }
  if (params.onStreetSubType) {
    searchParams.set("onStreetSubType", params.onStreetSubType);
  }

  return apiRequest<void, GetSurveyListResponse>({
    method: "GET",
    path: `/app/parking-lots/survey-list?${searchParams.toString()}`,
    screenId: params.screenId,
  });
}

/**
 * Upload a photo for a parking lot with metadata (address, vehicle plate, GPS, timestamp).
 */
export async function uploadParkingLotPhoto(params: {
  parkingLotId: number;
  screenId: ScreenId;
  fileUri: string;
  fileName: string;
  mimeType: string;
  capturedAt?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  address?: string;
  vehiclePlate?: string;
  /** Distinguishes basic-info gallery photos from the operation-fee vehicle photo */
  category?: ParkingLotPhotoCategory;
}): Promise<UploadParkingLotPhotoResponse> {
  return apiUploadWithFields<UploadParkingLotPhotoResponse>({
    path: `/app/parking-lots/${params.parkingLotId}/photos`,
    screenId: params.screenId,
    body: {
      capturedAt: params.capturedAt,
      gpsLatitude: params.gpsLatitude,
      gpsLongitude: params.gpsLongitude,
      address: params.address,
      vehiclePlate: params.vehiclePlate,
      category: params.category,
    },
    file: {
      fieldName: "photo",
      fileUri: params.fileUri,
      fileName: params.fileName,
      mimeType: params.mimeType,
    },
  });
}

/**
 * Get photos for a parking lot, optionally filtered by category.
 */
export async function getParkingLotPhotos(params: {
  parkingLotId: number;
  screenId: ScreenId;
  category?: ParkingLotPhotoCategory;
}): Promise<GetParkingLotPhotosResponse> {
  const query = params.category ? `?category=${encodeURIComponent(params.category)}` : "";
  return apiRequest<void, GetParkingLotPhotosResponse>({
    method: "GET",
    path: `/app/parking-lots/${params.parkingLotId}/photos${query}`,
    screenId: params.screenId,
  });
}

/**
 * Update photo metadata (address, vehicle plate).
 */
export async function updateParkingLotPhoto(params: {
  parkingLotId: number;
  photoId: number;
  screenId: ScreenId;
  data: UpdateParkingLotPhotoRequest;
}): Promise<UpdateParkingLotPhotoResponse> {
  return apiRequest<UpdateParkingLotPhotoRequest, UpdateParkingLotPhotoResponse>({
    method: "PATCH",
    path: `/app/parking-lots/${params.parkingLotId}/photos/${params.photoId}`,
    screenId: params.screenId,
    body: params.data,
  });
}

/**
 * Delete a parking lot photo (removes both DB row and the file on the server).
 */
export async function deleteParkingLotPhoto(params: {
  parkingLotId: number;
  photoId: number;
  screenId: ScreenId;
}): Promise<DeleteParkingLotPhotoResponse> {
  return apiRequest<void, DeleteParkingLotPhotoResponse>({
    method: "DELETE",
    path: `/app/parking-lots/${params.parkingLotId}/photos/${params.photoId}`,
    screenId: params.screenId,
  });
}
