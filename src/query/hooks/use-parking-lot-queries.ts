import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getParkingLotMapData,
  getParkingLotDetail,
  updateParkingLot,
  createParkingLot,
  getNextSeqNumber,
  getSurveyList,
  uploadParkingLotPhoto,
  getParkingLotPhotos,
  updateParkingLotPhoto,
  deleteParkingLotPhoto,
} from "@/src/api/parking-lots";
import type { ApiClientError } from "@/src/api/client";
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
import type { MapBounds } from "@/src/features/private-parking/KakaoMap";

/**
 * Fetch parking lot map data with viewport-based loading.
 * Only fetches when bounds are available (map has initialized).
 */
export function useParkingLotMapData(
  parkingType: ParkingLotType,
  bounds: MapBounds | null,
  screenId: ScreenId,
  region?: string,
) {
  return useQuery<GetParkingLotMapDataResponse, ApiClientError>({
    queryKey: ["parkingLotMapData", parkingType, bounds, region],
    queryFn: () =>
      getParkingLotMapData({
        parkingType,
        bounds: bounds!,
        screenId,
        region,
      }),
    enabled: bounds !== null,
    staleTime: 30_000,
    refetchInterval: 30_000, // Auto-refetch to pick up zone assignment changes from admin
    placeholderData: (prev) => prev,
  });
}

/**
 * Fetch parking lot detail by ID for bottom sheet display.
 * Only fetches when a valid parking lot ID is provided.
 */
export function useParkingLotDetail(
  id: number | null,
  screenId: ScreenId,
) {
  return useQuery<GetParkingLotDetailResponse, ApiClientError>({
    queryKey: ["parkingLotDetail", id],
    queryFn: () => getParkingLotDetail({ id: id!, screenId }),
    enabled: id !== null,
    staleTime: 60_000,
  });
}

/**
 * Mutation hook for updating parking lot fields from manual survey edit.
 * On success, invalidates the detail cache so bottom sheet shows fresh data.
 */
export function useUpdateParkingLot(screenId: ScreenId) {
  const queryClient = useQueryClient();

  return useMutation<UpdateParkingLotResponse, ApiClientError, { id: number; data: UpdateParkingLotRequest }>({
    mutationFn: ({ id, data }) => updateParkingLot({ id, screenId, data }),
    onSuccess: (_, { id, data }) => {
      // Invalidate detail cache so bottom sheet re-fetches with updated data
      queryClient.invalidateQueries({ queryKey: ["parkingLotDetail", id] });

      // Patch every cached viewport entry in-place so stale polygon data can't leak back
      // through `placeholderData: (prev) => prev` on the next bounds change. Only touch
      // fields we just mutated — leave everything else as-is.
      if (data.polygonCoordinates !== undefined) {
        queryClient.setQueriesData<GetParkingLotMapDataResponse>(
          { queryKey: ["parkingLotMapData"] },
          (old) => {
            if (!old?.data) return old;
            let changed = false;
            const nextData = old.data.map((lot) => {
              if (lot.id !== id) return lot;
              changed = true;
              return { ...lot, polygonCoordinates: data.polygonCoordinates ?? null };
            });
            return changed ? { ...old, data: nextData } : old;
          },
        );
      }

      // Then refetch in the background so other server-side changes (flags, etc.) sync too.
      queryClient.invalidateQueries({ queryKey: ["parkingLotMapData"] });
    },
  });
}

/**
 * Mutation hook for creating a new parking lot from field survey.
 */
export function useCreateParkingLot(screenId: ScreenId) {
  return useMutation<CreateParkingLotResponse, ApiClientError, CreateParkingLotRequest>({
    mutationFn: (data) => createParkingLot({ screenId, data }),
  });
}

/**
 * Fetch the next sequence number for a surveyArea.
 * seqNumber is zone-wide (shared across all parking types) — only surveyArea is needed.
 * Disabled until surveyArea is known. staleTime=0 so it always refetches on new marker open.
 */
export function useNextSeqNumber(
  surveyArea: string | null | undefined,
  screenId: ScreenId,
) {
  return useQuery<GetNextSeqNumberResponse, ApiClientError>({
    queryKey: ["parkingLotNextSeq", surveyArea],
    queryFn: () => getNextSeqNumber({ surveyArea: surveyArea!, screenId }),
    enabled: !!surveyArea,
    staleTime: 0,
  });
}

/**
 * Fetch survey list for survey zone management screen.
 * Filters by tab (data = draft/not-updated, completed = updated).
 */
export function useSurveyList(
  tab: "data" | "completed",
  screenId: ScreenId,
  parkingType?: ParkingLotType,
  status?: string,
  isCreatedByApp?: boolean,
  onStreetSubType?: string,
  isUpdated?: boolean,
) {
  return useQuery<GetSurveyListResponse, ApiClientError>({
    queryKey: ["surveyList", tab, parkingType, status, isCreatedByApp, onStreetSubType, isUpdated],
    queryFn: () => getSurveyList({ tab, screenId, parkingType, status, isCreatedByApp, onStreetSubType, isUpdated }),
    staleTime: 30_000,
  });
}

/**
 * Mutation hook for uploading a parking lot photo with metadata.
 * On success, invalidates the photos list cache (all categories so any
 * variant queryKey re-fetches).
 */
export function useUploadParkingLotPhoto(screenId: ScreenId) {
  const queryClient = useQueryClient();

  return useMutation<
    UploadParkingLotPhotoResponse,
    ApiClientError,
    {
      parkingLotId: number;
      fileUri: string;
      fileName: string;
      mimeType: string;
      capturedAt?: string;
      gpsLatitude?: number;
      gpsLongitude?: number;
      address?: string;
      vehiclePlate?: string;
      category?: ParkingLotPhotoCategory;
    }
  >({
    mutationFn: (params) => uploadParkingLotPhoto({ ...params, screenId }),
    onSuccess: (_, { parkingLotId }) => {
      queryClient.invalidateQueries({ queryKey: ["parkingLotPhotos", parkingLotId] });
    },
  });
}

/**
 * Fetch photos for a parking lot, optionally filtered by category.
 * Category is part of the queryKey so 'basic' and 'vehicle' caches stay separate.
 */
export function useParkingLotPhotos(
  parkingLotId: number | null,
  screenId: ScreenId,
  category?: ParkingLotPhotoCategory,
) {
  return useQuery<GetParkingLotPhotosResponse, ApiClientError>({
    queryKey: ["parkingLotPhotos", parkingLotId, category ?? "all"],
    queryFn: () => getParkingLotPhotos({ parkingLotId: parkingLotId!, screenId, category }),
    enabled: parkingLotId !== null,
    staleTime: 60_000,
  });
}

/**
 * Mutation hook for updating parking lot photo metadata (address, vehicle plate).
 * On success, invalidates the photos list cache.
 */
export function useUpdateParkingLotPhoto(screenId: ScreenId) {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateParkingLotPhotoResponse,
    ApiClientError,
    { parkingLotId: number; photoId: number; data: UpdateParkingLotPhotoRequest }
  >({
    mutationFn: ({ parkingLotId, photoId, data }) =>
      updateParkingLotPhoto({ parkingLotId, photoId, screenId, data }),
    onSuccess: (_, { parkingLotId }) => {
      queryClient.invalidateQueries({ queryKey: ["parkingLotPhotos", parkingLotId] });
    },
  });
}

/**
 * Mutation hook for deleting a parking lot photo.
 * Optimistically removes the photo from the cache so the UI updates immediately.
 */
export function useDeleteParkingLotPhoto(screenId: ScreenId) {
  const queryClient = useQueryClient();

  return useMutation<
    DeleteParkingLotPhotoResponse,
    ApiClientError,
    { parkingLotId: number; photoId: number }
  >({
    mutationFn: ({ parkingLotId, photoId }) =>
      deleteParkingLotPhoto({ parkingLotId, photoId, screenId }),
    onMutate: async ({ parkingLotId, photoId }) => {
      await queryClient.cancelQueries({ queryKey: ["parkingLotPhotos", parkingLotId] });
      const previous = queryClient.getQueryData<GetParkingLotPhotosResponse>([
        "parkingLotPhotos",
        parkingLotId,
      ]);
      if (previous) {
        queryClient.setQueryData<GetParkingLotPhotosResponse>(
          ["parkingLotPhotos", parkingLotId],
          { data: previous.data.filter((p) => p.id !== photoId) },
        );
      }
      return { previous };
    },
    onError: (_err, { parkingLotId }, context) => {
      // Roll back the optimistic removal on failure
      const ctx = context as { previous?: GetParkingLotPhotosResponse } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(["parkingLotPhotos", parkingLotId], ctx.previous);
      }
    },
    onSettled: (_data, _err, { parkingLotId }) => {
      queryClient.invalidateQueries({ queryKey: ["parkingLotPhotos", parkingLotId] });
    },
  });
}
