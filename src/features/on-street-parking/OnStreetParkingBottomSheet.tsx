import BottomSheet from "@gorhom/bottom-sheet";
import BottomSheetKeyboardAwareScrollView from "@/src/components/BottomSheetKeyboardAwareScrollView";
import { LoadingOverlay } from "@/src/components/LoadingOverlay";
import IconClose from "@/src/assets/images/icons/icon-close-24.svg";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Image, Keyboard, Platform, StyleSheet, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { TouchableOpacity as GHTouchableOpacity } from "react-native-gesture-handler";
import { ScrollView } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  makeMutable,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HeaderIconButton } from "@/src/features/private-parking/HeaderIconButton";
import { SearchBar } from "@/src/features/private-parking/SearchBar";
import { OnStreetParkingMarker } from "./OnStreetKakaoMap";
import type { TabId } from "./OnStreetParkingBottomSheetContent";
import {
  UsageStatusContent,
  type UsageStatusFormValues,
  USAGE_STATUS_DEFAULT_VALUES,
  TABS,
} from "./OnStreetParkingBottomSheetContent";
import { ActionBar, type ActionBarFormValues } from "@/src/components/ActionBar";
import { DragHandle } from "@/src/components/DragHandle";
import {
  ParkingZoneBottomSheet,
  type ParkingZoneOption,
} from "./tabs/pickers/ParkingZoneBottomSheet";
import {
  OnStreetSafetyContent,
  type OnStreetSafetyFormValues,
  ON_STREET_SAFETY_DEFAULT_VALUES,
} from "./tabs/OnStreetSafetyContent";
import {
  OnStreetOperationFeeContent,
  type OnStreetOperationFeeFormValues,
  ON_STREET_OPERATION_FEE_DEFAULT_VALUES,
} from "./tabs/OnStreetOperationFeeContent";
import {
  OnStreetBasicInfoContent,
  type OnStreetBasicInfoFormValues,
  ON_STREET_BASIC_INFO_DEFAULT_VALUES,
} from "./tabs/OnStreetBasicInfoContent";
import {
  CapturedPhotoInfo,
  type CapturedPhotoData,
} from "@/src/features/street-parking/CapturedPhotoInfo";
import { Text } from "@/src/components/Text";
import { useTabBarHeight } from "@/src/hooks/useTabBarHeight";
import { useAppModal } from "@/src/hooks/useAppModal";
import { useAppToast } from "@/src/hooks/useAppToast";
import { ERROR_CODES, type OnStreetSubType, type ScreenId } from "@/src/api-contracts";
import { ApiClientError, getServerOrigin } from "@/src/api/client";
import { formatDateDot } from "@/src/lib/format-date";
import { useParkingLotDetail, useUpdateParkingLot, useUploadParkingLotPhoto, useParkingLotPhotos, useUpdateParkingLotPhoto, useDeleteParkingLotPhoto } from "@/src/query/hooks/use-parking-lot-queries";
import type { PendingPhoto } from "@/src/components/PhotoSection";
import { reverseGeocode } from "@/src/hooks/useKakaoAddressSearch";
import { useCurrentLocation } from "@/src/hooks/useCurrentLocation";

interface OnStreetParkingBottomSheetProps {
  marker: OnStreetParkingMarker | null;
  onClose?: () => void;
  /** Called after a successful save with the marker ID, updated sub-type, and draft flag */
  onSaveSuccess?: (markerId: string, hasChanges: boolean, newSubType?: OnStreetSubType, isDraft?: boolean) => void;
  /** Called after successful creation with new ID, coordinates, and sub-type */
  onCreateSuccess?: (newId: string, lat: number, lng: number, onStreetSubType?: string) => void;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSearchBarPress?: () => void;
  onFilterPress: () => void;
  /** Called when user taps the clipboard icon to open survey zone management */
  onClipboardPress?: () => void;
  /** Called when user taps the draw-polygon icon (only visible for non-confirmed markers) */
  onDrawPolygonPress?: () => void;
  /** Called when user taps the address field to open address search overlay */
  onAddressSearchPress?: () => void;
  /** Called to register a setter that fills address + GPS coordinates from external search */
  onAddressSearchRef?: (setter: (address: string, lat: number, lng: number) => void) => void;
  /** Called after save when the marker location changed via address search — moves marker + map */
  onMarkerLocationChange?: (markerId: string, lat: number, lng: number) => void;
  /** Screen ID for API calls */
  screenId?: ScreenId;
}

/**
 * Bottom sheet displaying on-street (노외) parking lot detail information
 * When expanded to full height, merges with the search header into one block
 */

const PADDING_TOP = 16;
const INPUT_HEIGHT = 34;

export function OnStreetParkingBottomSheet({
  marker,
  onClose,
  onSaveSuccess,
  onCreateSuccess,
  searchQuery,
  onSearchChange,
  onSearchBarPress,
  onFilterPress,
  onClipboardPress,
  onDrawPolygonPress,
  onAddressSearchPress,
  onAddressSearchRef,
  onMarkerLocationChange,
  screenId = "APP_ON_STREET_PARKING",
}: OnStreetParkingBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { showModal } = useAppModal();
  const { showToast } = useAppToast();
  const { getCurrentLocation } = useCurrentLocation();
  const [activeTab, setActiveTab] = useState<TabId>("usage");
  // Saving state: blocks duplicate submits and powers the loading overlay
  const [isSaving, setIsSaving] = useState(false);
  // Markers that have already been updated are read-only (no editing, no saving)
  const isReadOnly = !!marker?.isConfirmed;
  const [parkingZoneSheetVisible, setParkingZoneSheetVisible] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhotoData | null>(null);
  const [photoAddress, setPhotoAddress] = useState("");
  const [photoPlateNumber, setPhotoPlateNumber] = useState("");
  // Override coordinates from address search (null = use original marker/detail coords)
  const [searchedCoords, setSearchedCoords] = useState<{ lat: number; lng: number } | null>(null);
  // Track which photo URI we've already auto-filled the address for, so user edits aren't overwritten
  const autoFilledPhotoUriRef = useRef<string | null>(null);
  // Local overrides for server photo metadata (address, vehiclePlate) keyed by photo ID
  const [serverPhotoEdits, setServerPhotoEdits] = useState<
    Map<number, { address: string; vehiclePlate: string; gpsLatitude?: number; gpsLongitude?: number }>
  >(new Map());

  // Fetch parking lot detail when an existing marker is selected
  const markerId = marker?.mode === "existing" ? Number(marker.id) : null;
  const { data: detailData } = useParkingLotDetail(markerId, screenId);
  const { mutateAsync: updateLot } = useUpdateParkingLot(screenId);
  const { mutateAsync: uploadPhoto } = useUploadParkingLotPhoto(screenId);
  // Two separate photo buckets backed by the same endpoint with `category` filter:
  // - basic: multi-photo gallery in the 기본정보 tab
  // - vehicle: single vehicle-in-lot photo in the 운영요금 tab
  const { data: basicPhotosData } = useParkingLotPhotos(markerId, screenId, "basic");
  const { data: vehiclePhotosData } = useParkingLotPhotos(markerId, screenId, "vehicle");
  const { mutateAsync: updatePhoto } = useUpdateParkingLotPhoto(screenId);
  const { mutateAsync: deletePhotoMutation } = useDeleteParkingLotPhoto(screenId);

  // Photos selected from camera/library in the basic-info PhotoSection (not yet uploaded)
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  // IDs of already-uploaded photos the user tapped to remove — actual DELETE is deferred until save
  const [pendingDeletionIds, setPendingDeletionIds] = useState<Set<number>>(new Set());

  // Basic-info tab: multi-photo gallery (parking lot info photos)
  const uploadedPhotos = basicPhotosData?.data ?? [];
  // Operation-fee tab: single vehicle-in-lot photo. Hide rows queued for deletion
  // so they disappear immediately on tap; the server delete happens on save.
  const vehiclePhotos = (vehiclePhotosData?.data ?? []).filter(
    (p) => !pendingDeletionIds.has(p.id),
  );

  const handleAddPendingPhoto = useCallback((photo: PendingPhoto) => {
    setPendingPhotos((prev) => [...prev, photo]);
  }, []);

  const handleRemovePendingPhoto = useCallback((localId: string) => {
    setPendingPhotos((prev) => prev.filter((p) => p.localId !== localId));
  }, []);

  const handleMarkUploadedPhotoForDeletion = useCallback((photoId: number) => {
    setPendingDeletionIds((prev) => {
      const next = new Set(prev);
      next.add(photoId);
      return next;
    });
  }, []);

  // Apply queued photo deletions on the server, then clear the queue
  const flushPendingDeletions = async (lotId: number) => {
    if (pendingDeletionIds.size === 0) return;
    const ids = Array.from(pendingDeletionIds);
    setPendingDeletionIds(new Set());
    try {
      for (const photoId of ids) {
        await deletePhotoMutation({ parkingLotId: lotId, photoId });
      }
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? (error.apiError?.message ?? "사진 삭제에 실패했습니다.")
          : "사진 삭제에 실패했습니다.";
      showToast({ message, type: "error" });
    }
  };

  // Upload all queued pending photos for the given lot id, then clear the queue.
  // These come from the basic-info tab gallery, so they're tagged with category 'basic'.
  const flushPendingPhotos = async (lotId: number) => {
    if (pendingPhotos.length === 0) return;
    const photos = pendingPhotos;
    setPendingPhotos([]);
    try {
      for (const p of photos) {
        await uploadPhoto({
          parkingLotId: lotId,
          fileUri: p.uri,
          fileName: p.fileName,
          mimeType: p.mimeType,
          capturedAt: new Date().toISOString(),
          category: "basic",
        });
      }
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? (error.apiError?.message ?? "사진 업로드에 실패했습니다.")
          : "사진 업로드에 실패했습니다.";
      showToast({ message, type: "error" });
    }
  };

  const { control: actionBarControl } = useForm<ActionBarFormValues>({
    defaultValues: { isChecked: false },
  });
  const usageStatusForm = useForm<UsageStatusFormValues>({
    defaultValues: USAGE_STATUS_DEFAULT_VALUES,
  });
  const basicInfoForm = useForm<OnStreetBasicInfoFormValues>({
    defaultValues: ON_STREET_BASIC_INFO_DEFAULT_VALUES,
  });
  const operationFeeForm = useForm<OnStreetOperationFeeFormValues>({
    defaultValues: ON_STREET_OPERATION_FEE_DEFAULT_VALUES,
  });
  const onStreetSafetyForm = useForm<OnStreetSafetyFormValues>({
    defaultValues: ON_STREET_SAFETY_DEFAULT_VALUES,
  });

  // When a different marker is selected, reset tab and photo state
  useEffect(() => {
    if (marker) {
      setActiveTab("usage");
      setCapturedPhoto(null);
      setPhotoAddress("");
      setPhotoPlateNumber("");
      setServerPhotoEdits(new Map());
      setPendingPhotos([]);
      setPendingDeletionIds(new Set());
      setSearchedCoords(null);
      autoFilledPhotoUriRef.current = null;
    }
  }, [marker?.id]);

  // Register a setter the parent can call when the user picks an address from the search overlay.
  // Round coordinates to 7 decimal places (~1cm precision) to match backend storage
  // and prevent visual changes between pre-save and post-save display.
  useEffect(() => {
    onAddressSearchRef?.((address: string, lat: number, lng: number) => {
      usageStatusForm.setValue("address", address);
      setSearchedCoords({
        lat: Math.round(lat * 1e7) / 1e7,
        lng: Math.round(lng * 1e7) / 1e7,
      });
    });
  }, [onAddressSearchRef, usageStatusForm]);

  // Auto-fill 주소 from the captured photo's GPS (EXIF) — fall back to the device's
  // current location if the picked image had no GPS metadata. Each photo URI is
  // only filled once so manual edits aren't clobbered on re-render.
  useEffect(() => {
    if (!capturedPhoto) return;
    if (autoFilledPhotoUriRef.current === capturedPhoto.uri) return;
    autoFilledPhotoUriRef.current = capturedPhoto.uri;

    let cancelled = false;
    const run = async () => {
      let lat = capturedPhoto.gpsLatitude;
      let lng = capturedPhoto.gpsLongitude;
      if (!lat || !lng) {
        const loc = await getCurrentLocation();
        if (!loc) return;
        lat = loc.lat;
        lng = loc.lng;
        if (!cancelled) {
          // Persist the resolved coords back onto the photo so they get uploaded with it
          setCapturedPhoto((prev) =>
            prev && prev.uri === capturedPhoto.uri
              ? { ...prev, gpsLatitude: lat, gpsLongitude: lng }
              : prev
          );
        }
      }
      const address = await reverseGeocode(lat, lng);
      if (!cancelled && address) {
        setPhotoAddress(address);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [capturedPhoto, getCurrentLocation]);

  // Reset all forms to defaults when a new marker is placed (create mode)
  useEffect(() => {
    if (marker?.mode !== "new") return;
    usageStatusForm.reset(USAGE_STATUS_DEFAULT_VALUES);
    basicInfoForm.reset(ON_STREET_BASIC_INFO_DEFAULT_VALUES);
    operationFeeForm.reset(ON_STREET_OPERATION_FEE_DEFAULT_VALUES);
    onStreetSafetyForm.reset(ON_STREET_SAFETY_DEFAULT_VALUES);
  }, [marker, usageStatusForm, basicInfoForm, operationFeeForm, onStreetSafetyForm]);

  // Populate all forms when detail data arrives (existing marker)
  // Clear searchedCoords so GPS display falls back to the fresh backend values
  useEffect(() => {
    if (!detailData?.data) return;
    setSearchedCoords(null);
    const d = detailData.data;
    const s = (v: string | null | undefined) => v ?? "";

    // UsageStatus
    usageStatusForm.reset({
      uniqueNumber1: s(d.surveyArea),
      uniqueNumber2: s(d.parkingKindLabel) || (d.onStreetSubType?.includes("night") ? "야간" : "주간"),
      uniqueNumber3: s(d.seqLabel) || (d.seqNumber != null ? String(d.seqNumber) : ""),
      address: s(d.roadAddress) || s(d.jibunAddress),
      parkingSection: s(d.parkingSection) || USAGE_STATUS_DEFAULT_VALUES.parkingSection,
      dedicatedSection: s(d.dedicatedSection) || USAGE_STATUS_DEFAULT_VALUES.dedicatedSection,
      dedicatedOtherText: USAGE_STATUS_DEFAULT_VALUES.dedicatedOtherText,
      vehicleType: s(d.vehicleType) || USAGE_STATUS_DEFAULT_VALUES.vehicleType,
      parkingForm: d.onStreetSubType?.includes("illegal") ? "불법" : "합법",
    });

    // BasicInfo
    basicInfoForm.reset({
      parkingName: s(d.parkingName),
      sectionNumber: s(d.sectionNumber) || ON_STREET_BASIC_INFO_DEFAULT_VALUES.sectionNumber,
      zoneNumber: s(d.zoneNumber) || ON_STREET_BASIC_INFO_DEFAULT_VALUES.zoneNumber,
      groupNumber: s(d.groupNumber) || ON_STREET_BASIC_INFO_DEFAULT_VALUES.groupNumber,
      installDate: formatDateDot(d.installDate) || formatDateDot(d.permitDate),
      ownership: s(d.ownership) || ON_STREET_BASIC_INFO_DEFAULT_VALUES.ownership,
      operation: s(d.operation) || ON_STREET_BASIC_INFO_DEFAULT_VALUES.operation,
      consignmentName: s(d.consignmentName) || ON_STREET_BASIC_INFO_DEFAULT_VALUES.consignmentName,
      contact: s(d.contact),
    });

    // OperationFee
    const opType = s(d.operationType);
    operationFeeForm.reset({
      opTimeParking: d.opTimeParking === "Y" || (d.opTimeParking === null && opType.includes("시간제")),
      opResidentParking: d.opResidentParking === "Y" || (d.opResidentParking === null && opType.includes("거주자")),
      opTourBusParking: d.opTourBusParking === "Y" || (d.opTourBusParking === null && opType.includes("관광버스")),
      opMotorcycleParking: d.opMotorcycleParking === "Y" || (d.opMotorcycleParking === null && opType.includes("이륜차")),
      weekdayNotOp: d.weekdayNotOp === "Y" || (d.weekdayNotOp === null && !d.weekdayHours),
      saturdayNotOp: d.saturdayNotOp === "Y" || (d.saturdayNotOp === null && !d.saturdayHours),
      holidayNotOp: d.holidayNotOp === "Y" || (d.holidayNotOp === null && !d.holidayHours),
      residentWeekdayNotOp: d.residentWeekdayNotOp === "Y" || (d.residentWeekdayNotOp === null && !d.residentHours),
      residentSaturdayNotOp: d.residentSaturdayNotOp === "Y",
      residentHolidayNotOp: d.residentHolidayNotOp === "Y",
      paymentMethod: s(d.paymentMethod),
      feeType: s(d.feeType),
      parkingZone: s(d.parkingZone),
      residentDay: s(d.residentDay),
      residentNight: s(d.residentNight),
      residentAllDay: s(d.residentAllDay),
      carBaseTime: s(d.carBaseTime),
      carExtraTime: s(d.carExtraTime),
      carBaseFee: s(d.carBaseFee),
      carExtraFee: s(d.carExtraFee),
      carAllDay: s(d.carAllDay),
      carMonthly: s(d.carMonthly),
      busBaseTime: s(d.busBaseTime),
      busExtraTime: s(d.busExtraTime),
      busBaseFee: s(d.busBaseFee),
      busExtraFee: s(d.busExtraFee),
      busAllDay: s(d.busAllDay),
      busMonthly: s(d.busMonthly),
      bikeBaseTime: s(d.bikeBaseTime),
      bikeExtraTime: s(d.bikeExtraTime),
      bikeBaseFee: s(d.bikeBaseFee),
      bikeExtraFee: s(d.bikeExtraFee),
      bikeAllDay: s(d.bikeAllDay),
      bikeMonthly: s(d.bikeMonthly),
      discountDisabled: s(d.discountDisabled),
      discountVeteran: s(d.discountVeteran),
      discountMultiChild: s(d.discountMultiChild),
      discountEco: s(d.discountEco),
      discountDayOff: s(d.discountDayOff),
      discountTenDay: s(d.discountTenDay),
      discountOther: s(d.discountOther),
    });

    // Safety
    onStreetSafetyForm.reset({
      slopedParking: s(d.slopedParking) || s(d.fallPrevention) || ON_STREET_SAFETY_DEFAULT_VALUES.slopedParking,
      safetyFacility: s(d.safetyFacility) || ON_STREET_SAFETY_DEFAULT_VALUES.safetyFacility,
      safetyFacilityOtherText: s(d.safetyFacilityOtherText) || ON_STREET_SAFETY_DEFAULT_VALUES.safetyFacilityOtherText,
    });
  }, [detailData]);

  // Show zone restriction modal when the operation is outside assigned zones
  const showZoneError = () => {
    showModal({
      title: "알림",
      message: "해당 구역에서 작업할 수 없습니다.",
      buttons: [{ text: "확인", style: "default" }],
    });
  };

  /**
   * Derive on-street sub-type from form values.
   * - parkingForm: "합법" → legal, "불법" → illegal
   * - uniqueNumber2: "야간" → night, "주간" → day
   */
  const deriveOnStreetSubType = (): OnStreetSubType => {
    const usage = usageStatusForm.getValues();
    const isIllegal = usage.parkingForm === "불법";
    const isNight = usage.uniqueNumber2 === "야간";
    if (isNight) {
      return isIllegal ? "on_street_illegal_night" : "on_street_legal_night";
    }
    return isIllegal ? "on_street_illegal_day" : "on_street_legal_day";
  };

  // Build update payload from all tab forms and call PATCH API
  const submitUpdate = async (isDraft: boolean) => {
    if (!markerId) return;

    const usage = usageStatusForm.getValues();
    const basic = basicInfoForm.getValues();
    const op = operationFeeForm.getValues();
    const safety = onStreetSafetyForm.getValues();

    const s = (v: string) => v.trim() || null;
    const newSubType = deriveOnStreetSubType();

    // Build operation type string from checkboxes
    const opTypeParts: string[] = [];
    if (op.opTimeParking) opTypeParts.push("시간제");
    if (op.opResidentParking) opTypeParts.push("거주자");
    if (op.opTourBusParking) opTypeParts.push("관광버스");
    if (op.opMotorcycleParking) opTypeParts.push("이륜차");

    try {
      const result = await updateLot({
        id: markerId,
        data: {
          isDraft,
          // Location (updated when address is changed via search)
          ...(searchedCoords
            ? {
                jibunAddress: s(usage.address),
                roadAddress: s(usage.address),
                latitude: searchedCoords.lat,
                longitude: searchedCoords.lng,
              }
            : {}),
          // Identity
          surveyArea: s(usage.uniqueNumber1),
          seqLabel: s(usage.uniqueNumber3),
          parkingKindLabel: s(usage.uniqueNumber2),
          // On-street sub-type (derived from day/night + legal/illegal)
          onStreetSubType: newSubType,
          // On-street survey-only fields
          parkingSection: s(usage.parkingSection),
          dedicatedSection: s(usage.dedicatedSection),
          vehicleType: s(usage.vehicleType),
          // BasicInfo
          parkingName: s(basic.parkingName),
          contact: s(basic.contact),
          permitDate: s(basic.installDate),
          sectionNumber: s(basic.sectionNumber),
          zoneNumber: s(basic.zoneNumber),
          groupNumber: s(basic.groupNumber),
          installDate: s(basic.installDate),
          ownership: s(basic.ownership),
          operation: s(basic.operation),
          consignmentName: s(basic.consignmentName),
          // OperationFee
          operationType: opTypeParts.length > 0 ? opTypeParts.join(",") : null,
          opTimeParking: op.opTimeParking ? "Y" : "N",
          opResidentParking: op.opResidentParking ? "Y" : "N",
          opTourBusParking: op.opTourBusParking ? "Y" : "N",
          opMotorcycleParking: op.opMotorcycleParking ? "Y" : "N",
          weekdayNotOp: op.weekdayNotOp ? "Y" : "N",
          saturdayNotOp: op.saturdayNotOp ? "Y" : "N",
          holidayNotOp: op.holidayNotOp ? "Y" : "N",
          residentWeekdayNotOp: op.residentWeekdayNotOp ? "Y" : "N",
          residentSaturdayNotOp: op.residentSaturdayNotOp ? "Y" : "N",
          residentHolidayNotOp: op.residentHolidayNotOp ? "Y" : "N",
          weekdayHours: op.weekdayNotOp ? null : undefined,
          saturdayHours: op.saturdayNotOp ? null : undefined,
          holidayHours: op.holidayNotOp ? null : undefined,
          residentHours: op.residentWeekdayNotOp ? null : undefined,
          paymentMethod: s(op.paymentMethod),
          feeType: s(op.feeType),
          parkingZone: s(op.parkingZone),
          residentDay: s(op.residentDay),
          residentNight: s(op.residentNight),
          residentAllDay: s(op.residentAllDay),
          carBaseTime: s(op.carBaseTime),
          carExtraTime: s(op.carExtraTime),
          carBaseFee: s(op.carBaseFee),
          carExtraFee: s(op.carExtraFee),
          carAllDay: s(op.carAllDay),
          carMonthly: s(op.carMonthly),
          busBaseTime: s(op.busBaseTime),
          busExtraTime: s(op.busExtraTime),
          busBaseFee: s(op.busBaseFee),
          busExtraFee: s(op.busExtraFee),
          busAllDay: s(op.busAllDay),
          busMonthly: s(op.busMonthly),
          bikeBaseTime: s(op.bikeBaseTime),
          bikeExtraTime: s(op.bikeExtraTime),
          bikeBaseFee: s(op.bikeBaseFee),
          bikeExtraFee: s(op.bikeExtraFee),
          bikeAllDay: s(op.bikeAllDay),
          bikeMonthly: s(op.bikeMonthly),
          discountDisabled: s(op.discountDisabled),
          discountVeteran: s(op.discountVeteran),
          discountMultiChild: s(op.discountMultiChild),
          discountEco: s(op.discountEco),
          discountDayOff: s(op.discountDayOff),
          discountTenDay: s(op.discountTenDay),
          discountOther: s(op.discountOther),
          // Safety
          slopedParking: s(safety.slopedParking),
          safetyFacility: s(safety.safetyFacility),
          safetyFacilityOtherText: s(safety.safetyFacilityOtherText),
          fallPrevention: s(safety.slopedParking),
        },
      });

      // Upload captured photo if present — surface failures so the user can retry.
      // This is the operation-fee tab's vehicle-in-lot photo, tagged 'vehicle'.
      if (capturedPhoto) {
        try {
          const fileName = capturedPhoto.uri.split("/").pop() ?? "photo.jpg";
          await uploadPhoto({
            parkingLotId: markerId,
            fileUri: capturedPhoto.uri,
            fileName,
            mimeType: "image/jpeg",
            capturedAt: capturedPhoto.timestamp,
            gpsLatitude: capturedPhoto.gpsLatitude,
            gpsLongitude: capturedPhoto.gpsLongitude,
            address: photoAddress || undefined,
            vehiclePlate: photoPlateNumber || undefined,
            category: "vehicle",
          });
          setCapturedPhoto(null);
          setPhotoAddress("");
          setPhotoPlateNumber("");
        } catch (error) {
          const message =
            error instanceof ApiClientError
              ? (error.apiError?.message ?? "사진 업로드에 실패했습니다.")
              : "사진 업로드에 실패했습니다.";
          showToast({ message, type: "error" });
        }
      }

      // Flush edits to already-uploaded photos (address / vehiclePlate changes)
      if (serverPhotoEdits.size > 0) {
        const edits = Array.from(serverPhotoEdits.entries());
        setServerPhotoEdits(new Map());
        try {
          for (const [photoId, data] of edits) {
            await updatePhoto({
              parkingLotId: markerId,
              photoId,
              data: {
                address: data.address || null,
                vehiclePlate: data.vehiclePlate || null,
                ...(data.gpsLatitude !== undefined ? { gpsLatitude: data.gpsLatitude } : {}),
                ...(data.gpsLongitude !== undefined ? { gpsLongitude: data.gpsLongitude } : {}),
              },
            });
          }
        } catch (error) {
          const message =
            error instanceof ApiClientError
              ? (error.apiError?.message ?? "사진 정보 수정에 실패했습니다.")
              : "사진 정보 수정에 실패했습니다.";
          showToast({ message, type: "error" });
        }
      }

      // Apply queued PhotoSection deletions, then upload any newly picked photos
      await flushPendingDeletions(markerId);
      await flushPendingPhotos(markerId);

      // Always notify parent of sub-type change so the active marker visual updates immediately
      const hasChanges = result.data.isUpdated;
      onSaveSuccess?.(marker!.id, hasChanges, newSubType, isDraft);

      if (isDraft) {
        showToast({ message: "임시저장이 완료되었습니다." });
      } else {
        showToast({ message: "수정 정보가 시스템에 업데이트되었습니다" });
      }
      // Move marker + map if address was changed via search
      if (searchedCoords) {
        onMarkerLocationChange?.(marker!.id, searchedCoords.lat, searchedCoords.lng);
      }
    } catch (error) {
      if (error instanceof ApiClientError && error.apiError?.code === ERROR_CODES.ZONE_NOT_ALLOWED) {
        showZoneError();
        return;
      }
      throw error;
    }
  };

  // Submit handler: isDraft=true for draft save, isDraft=false for final save
  const onSubmit = async (isDraft: boolean) => {
    if (isSaving) return;
    if (!markerId) return;
    setIsSaving(true);
    try {
      await submitUpdate(isDraft);
    } finally {
      setIsSaving(false);
    }
  };

  // Launch device camera and capture photo with metadata
  const handleCameraPress = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showModal({
        title: "권한 필요",
        message: "카메라를 사용하려면 권한이 필요합니다.",
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      exif: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const exif = asset.exif;
      setCapturedPhoto({
        uri: asset.uri,
        timestamp: new Date().toISOString(),
        gpsLatitude: exif?.GPSLatitude ?? 0,
        gpsLongitude: exif?.GPSLongitude ?? 0,
      });
      // Switch to operation tab so the photo is visible
      setActiveTab("operation");
    }
  }, [showModal]);

  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const navBarHeight = useTabBarHeight();

  // Animated position tracks the sheet's top Y position (pixels from top)
  const [animatedPosition] = useState(() => makeMutable(screenHeight));

  // Header visual height (used for fade animation threshold)
  const headerHeight = insets.top + PADDING_TOP + INPUT_HEIGHT + 16;

  // Sheet expands up to safe area top with extra padding
  // Container height = screenHeight - navBarHeight (due to bottomInset)
  // Max sheet height as percentage of container to ensure consistent behavior on both platforms
  const TOP_PADDING = 16;
  const containerHeight = screenHeight - navBarHeight;
  const maxSheetHeight = containerHeight - insets.top - TOP_PADDING;
  const maxSnapPercent = `${Math.min(Math.round((maxSheetHeight / containerHeight) * 100), 100)}%`;
  const maxSnapPercent2 = `${100 - Math.round((insets.top / screenHeight) * 100 - 2)}%`;

  const snapPoints = useMemo(() => ["8%", "50%", maxSnapPercent2], [maxSnapPercent2]);

  // Track current snap index to decide whether to expand on keyboard show
  const currentIndexRef = useRef(1);

  // Disable header pointer events when the sheet is fully expanded (snap index 2).
  // Without this, Android still routes taps inside the faded-out header to its
  // children (search bar, clipboard/filter/notification buttons) because
  // pointerEvents="box-none" lets descendants receive touches even at opacity 0.
  const [isHeaderInteractive, setIsHeaderInteractive] = useState(true);

  const handleSheetChanges = useCallback(
    (index: number) => {
      currentIndexRef.current = index;
      setIsHeaderInteractive(index < 2);
      if (index === -1) {
        onClose?.();
      }
    },
    [onClose]
  );

  // When keyboard appears and bottom sheet is NOT at max snap, expand to max
  useEffect(() => {
    const event = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const sub = Keyboard.addListener(event, () => {
      if (currentIndexRef.current < 2) {
        bottomSheetRef.current?.snapToIndex(2);
      }
    });
    return () => sub.remove();
  }, []);

  // Animated style for the header (search bar + filter + notification buttons)
  // Fades out as the bottom sheet approaches the header area, fades in when pulled down
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedPosition.value,
      [headerHeight + 80, headerHeight],
      [1, 0],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  // Threshold positions for showing/hiding content below the title
  // Available height excludes the bottom nav bar
  const availableHeight = screenHeight - navBarHeight;
  const collapsedTop = availableHeight * 0.85 + navBarHeight;
  const expandedTop = availableHeight * 0.5 + navBarHeight;

  // Animated style for content below the title (tabs, scroll, action bar)
  // Fades out as sheet approaches 15% and fades in as it approaches 50%
  const contentAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedPosition.value,
      [expandedTop, collapsedTop],
      [1, 0],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  // Animated style for the white backdrop that covers exposed map above the sheet
  const OVERLAP = 20;
  const halfPosition = screenHeight - navBarHeight - (screenHeight - navBarHeight) * 0.5;
  const maxPosition = insets.top + TOP_PADDING;
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    const h = animatedPosition.value + OVERLAP;
    const opacity = interpolate(
      animatedPosition.value,
      [maxPosition, halfPosition],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { height: h, opacity };
  });

  if (!marker) return null;

  return (
    <>
      {/* White backdrop covering exposed map above the bottom sheet */}
      <Animated.View
        style={[styles.mapBackdrop, backdropAnimatedStyle]}
        pointerEvents="none"
      />

      {/* Header overlay - search bar + icons (fades out when sheet is fully expanded) */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 16 }, headerAnimatedStyle]}
        needsOffscreenAlphaCompositing
        pointerEvents={isHeaderInteractive ? "box-none" : "none"}
      >
        <View style={styles.searchRow}>
          <SearchBar
            value={searchQuery}
            onChangeText={onSearchChange}
            onSubmit={onSearchBarPress}
            onPress={onSearchBarPress}
            style={styles.searchBar}
          />
          {!isReadOnly && onDrawPolygonPress && (
            <TouchableOpacity
              style={styles.drawPolygonBtn}
              onPress={onDrawPolygonPress}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image
                source={require("@/src/assets/images/icons/icon-draw-polygon.png")}
                style={styles.drawPolygonIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
          <HeaderIconButton icon="clipboard" onPress={onClipboardPress ?? (() => {})} />
          <HeaderIconButton icon="filter" onPress={onFilterPress} />
          <HeaderIconButton icon="notification" onPress={() => {}} />
        </View>
      </Animated.View>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        handleComponent={() => <DragHandle />}
        backgroundStyle={styles.sheetBackground}
        animatedPosition={animatedPosition}
        enableDynamicSizing={false}
        overDragResistanceFactor={20}
        bottomInset={navBarHeight}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        {/* Title with close button */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>노상 주차장</Text>
          <GHTouchableOpacity
            onPress={() => {
              bottomSheetRef.current?.close();
              onClose?.();
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <IconClose width={24} height={24} />
          </GHTouchableOpacity>
        </View>

        {/* Tab bar - fades out at 7% */}
        <Animated.View style={contentAnimatedStyle}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const IconComponent = tab.icon;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                >
                  <IconComponent
                    size={16}
                    color={isActive ? "#FFFFFF" : "#454545"}
                    variant="Linear"
                  />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Scrollable form content - direct child of BottomSheet for proper flex layout */}
        <BottomSheetKeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bottomOffset={40}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {activeTab === "usage" && (
            <UsageStatusContent
              control={usageStatusForm.control}
              isEditing={!isReadOnly}
              onAddressSearchPress={isReadOnly ? undefined : onAddressSearchPress}
              latitude={searchedCoords?.lat ?? detailData?.data?.latitude ?? marker?.lat}
              longitude={searchedCoords?.lng ?? detailData?.data?.longitude ?? marker?.lng}
            />
          )}
          {activeTab === "safety" && (
            <OnStreetSafetyContent control={onStreetSafetyForm.control} isEditing={!isReadOnly} />
          )}
          {activeTab === "basic" && (
            <OnStreetBasicInfoContent
              control={basicInfoForm.control}
              isEditing={!isReadOnly}
              uploadedPhotos={uploadedPhotos}
              pendingPhotos={pendingPhotos}
              pendingDeletionIds={pendingDeletionIds}
              onAddPendingPhoto={handleAddPendingPhoto}
              onRemovePendingPhoto={handleRemovePendingPhoto}
              onMarkUploadedPhotoForDeletion={handleMarkUploadedPhotoForDeletion}
            />
          )}
          {activeTab === "operation" && (
            <>
              <OnStreetOperationFeeContent
                control={operationFeeForm.control}
                onParkingZonePress={isReadOnly ? undefined : () => setParkingZoneSheetVisible(true)}
                isEditing={!isReadOnly}
                hideCameraButton={!!capturedPhoto || vehiclePhotos.length > 0}
                onCapturePhoto={(photo) => setCapturedPhoto(photo)}
              />
              {/* Captured photo info - shown after camera capture.
                  Delete just drops the local state; nothing has been uploaded yet. */}
              {capturedPhoto && (
                <CapturedPhotoInfo
                  photo={capturedPhoto}
                  address={photoAddress}
                  onAddressChange={setPhotoAddress}
                  plateNumber={photoPlateNumber}
                  onPlateNumberChange={setPhotoPlateNumber}
                  isEditing={!isReadOnly}
                  hideTopBorder
                  addressActionLabel="위치확인"
                  onAddressSearch={async () => {
                    // Re-resolve address from the device's current GPS, and persist
                    // the new coords back onto the photo so they get uploaded on save.
                    const loc = await getCurrentLocation();
                    if (!loc) return;
                    const address = await reverseGeocode(loc.lat, loc.lng);
                    setCapturedPhoto((prev) =>
                      prev ? { ...prev, gpsLatitude: loc.lat, gpsLongitude: loc.lng } : prev,
                    );
                    if (address) setPhotoAddress(address);
                  }}
                  onDelete={() => {
                    setCapturedPhoto(null);
                    setPhotoAddress("");
                    setPhotoPlateNumber("");
                    autoFilledPhotoUriRef.current = null;
                  }}
                />
              )}
              {/* Previously saved vehicle photos from server (operation-fee tab only) */}
              {vehiclePhotos.map((p, index) => {
                const edits = serverPhotoEdits.get(p.id);
                const addr = edits?.address ?? p.address ?? "";
                const plate = edits?.vehiclePlate ?? p.vehiclePlate ?? "";
                // The first server photo sits directly under the "사진" label;
                // drop its top divider when no captured photo is shown above it.
                const hideTopBorder = !capturedPhoto && index === 0;
                return (
                  <CapturedPhotoInfo
                    key={p.id}
                    photo={{
                      uri: p.filePath.startsWith("http") ? p.filePath : `${getServerOrigin()}/uploads/${p.filePath}`,
                      timestamp: p.capturedAt ?? new Date(p.createdAt * 1000).toISOString(),
                      gpsLatitude: p.gpsLatitude ?? 0,
                      gpsLongitude: p.gpsLongitude ?? 0,
                    }}
                    address={addr}
                    onAddressChange={(text) => {
                      setServerPhotoEdits((prev) => {
                        const next = new Map(prev);
                        const existing = next.get(p.id);
                        next.set(p.id, { ...existing, address: text, vehiclePlate: plate });
                        return next;
                      });
                    }}
                    plateNumber={plate}
                    onPlateNumberChange={(text) => {
                      setServerPhotoEdits((prev) => {
                        const next = new Map(prev);
                        const existing = next.get(p.id);
                        next.set(p.id, { ...existing, address: addr, vehiclePlate: text });
                        return next;
                      });
                    }}
                    isEditing={!isReadOnly}
                    hideTopBorder={hideTopBorder}
                    addressActionLabel="위치확인"
                    onAddressSearch={async () => {
                      const loc = await getCurrentLocation();
                      if (!loc) return;
                      const newAddress = await reverseGeocode(loc.lat, loc.lng);
                      setServerPhotoEdits((prev) => {
                        const next = new Map(prev);
                        next.set(p.id, {
                          address: newAddress ?? addr,
                          vehiclePlate: plate,
                          gpsLatitude: loc.lat,
                          gpsLongitude: loc.lng,
                        });
                        return next;
                      });
                    }}
                    onDelete={() => handleMarkUploadedPhotoForDeletion(p.id)}
                  />
                );
              })}
            </>
          )}
        </BottomSheetKeyboardAwareScrollView>

        {/* Bottom action bar: hidden for already-updated markers (read-only mode) */}
        {!isReadOnly && (
          <ActionBar
            control={actionBarControl}
            onCameraPress={handleCameraPress}
            onDraftSave={() => onSubmit(true)}
            onSubmit={() => onSubmit(false)}
          />
        )}
      </BottomSheet>

      {/* Parking zone selection bottom sheet */}
      <ParkingZoneBottomSheet
        visible={parkingZoneSheetVisible}
        selectedValue={operationFeeForm.watch("parkingZone") as ParkingZoneOption}
        onClose={() => setParkingZoneSheetVisible(false)}
        onSelect={(value) => operationFeeForm.setValue("parkingZone", value)}
      />

      {/* Full-screen saving overlay — shown while save/upload requests are in flight */}
      {isSaving && (
        <View style={styles.savingOverlay} pointerEvents="auto">
          <LoadingOverlay visible />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // Full-screen overlay that sits above the bottom sheet while saving is in progress.
  // zIndex must beat the BottomSheet (and its backdrops/headers) so taps are blocked.
  savingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  mapBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 5,
  },
  sheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  // Header overlay
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  searchBar: {
    flex: 1,
  },
  drawPolygonBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  drawPolygonIcon: {
    width: 20,
    height: 20,
  },

  // Title
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#151515",
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 6,
    paddingBottom: 16,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 32,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#E9E9E9",
    gap: 4,
    paddingHorizontal: 16,
  },
  tabActive: {
    backgroundColor: "#238AAF",
    borderColor: "#238AAF",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#454545",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // Scroll view
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
