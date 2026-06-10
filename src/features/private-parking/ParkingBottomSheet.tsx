import IconClose from "@/src/assets/images/icons/icon-close-24.svg";
import BottomSheetKeyboardAwareScrollView from "@/src/components/BottomSheetKeyboardAwareScrollView";
import { LoadingOverlay } from "@/src/components/LoadingOverlay";
import { Text } from "@/src/components/Text";
import { useTabBarHeight } from "@/src/hooks/useTabBarHeight";
import BottomSheet from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  useParkingLotDetail,
  useUpdateParkingLot,
  useCreateParkingLot,
  useNextSeqNumber,
  useParkingLotPhotos,
  useUploadParkingLotPhoto,
  useDeleteParkingLotPhoto,
} from "@/src/query/hooks/use-parking-lot-queries";
import { PARKING_LOT_TYPE_LABELS, ERROR_CODES, type ParkingLotType } from "@/src/api-contracts";
import { ApiClientError } from "@/src/api/client";
import { useAppModal } from "@/src/hooks/useAppModal";
import { useAppToast } from "@/src/hooks/useAppToast";
import { formatDateDot } from "@/src/lib/format-date";
import { Keyboard, Platform, StyleSheet, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { TouchableOpacity as GHTouchableOpacity } from "react-native-gesture-handler";
import type { ScrollView as RNScrollView } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  makeMutable,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HeaderIconButton } from "./HeaderIconButton";
import { ParkingMarker } from "./KakaoMap";
import { SearchBar } from "./SearchBar";
import type { TabId } from "./ParkingBottomSheetContent";
import {
  BASIC_INFO_DEFAULT_VALUES,
  BasicInfoContent,
  EQUIPMENT_SAFETY_DEFAULT_VALUES,
  FACILITY_SIZE_DEFAULT_VALUES,
  OPERATION_FEE_DEFAULT_VALUES,
  TABS,
  type BasicInfoFormValues,
  type EquipmentSafetyFormValues,
  type FacilitySizeFormValues,
  type OperationFeeFormValues,
} from "./ParkingBottomSheetContent";
import {
  ACTION_BAR_DEFAULT_VALUES,
  ActionBar,
  type ActionBarFormValues,
} from "@/src/components/ActionBar";
import { DragHandle } from "@/src/components/DragHandle";
import { EquipmentSafetyContent } from "./tabs/EquipmentSafetyContent";
import { FacilitySizeContent } from "./tabs/FacilitySizeContent";
import { OperationFeeContent } from "./tabs/OperationFeeContent";
import { MainUseBottomSheet, type MainUseOption } from "./tabs/pickers/MainUseBottomSheet";
import {
  MechanicalTypeBottomSheet,
  mechTypeCodeToLabel,
  mechTypeLabelToCode,
  type MechanicalTypeOption,
} from "./tabs/pickers/MechanicalTypeBottomSheet";
import {
  ParkingZoneBottomSheet,
  type ParkingZoneOption,
} from "./tabs/pickers/ParkingZoneBottomSheet";
import type { PendingPhoto } from "@/src/components/PhotoSection";

interface ParkingBottomSheetProps {
  marker: ParkingMarker | null;
  onClose?: () => void;
  onSaveSuccess?: (markerId: string, hasChanges: boolean) => void;
  /** Called after a new parking lot is successfully created (passes the new DB id and marker location) */
  onCreateSuccess?: (newId: string, lat: number, lng: number, parkingType: import("@/src/api-contracts").ParkingLotDisplayType) => void;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSearchBarPress: () => void;
  onFilterPress: () => void;
  /** Called when user taps the clipboard icon to open survey zone management */
  onClipboardPress?: () => void;
  /** Called when user taps the address field to open address search overlay */
  onAddressSearchPress?: () => void;
  /** Called to register a setter that fills address + GPS coordinates from external search */
  onAddressSearchRef?: (setter: (address: string, lat: number, lng: number) => void) => void;
  /** Called after save when the marker location changed via address search — moves marker + map */
  onMarkerLocationChange?: (markerId: string, lat: number, lng: number) => void;
  screenId?: import("@/src/api-contracts").ScreenId;
}

/**
 * Bottom sheet displaying parking lot detail information
 * When expanded to full height, merges with the search header into one block
 */

const PADDING_TOP = 16;
const INPUT_HEIGHT = 34;

export function ParkingBottomSheet({
  marker,
  onClose,
  onSaveSuccess,
  onCreateSuccess,
  searchQuery,
  onSearchChange,
  onSearchBarPress,
  onFilterPress,
  onClipboardPress,
  onAddressSearchPress,
  onAddressSearchRef,
  onMarkerLocationChange,
  screenId = "APP_PRIVATE_PARKING",
}: ParkingBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const scrollViewRef = useRef<RNScrollView>(null);
  const { showModal } = useAppModal();
  const { showToast } = useAppToast();
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [mainUseSheetVisible, setMainUseSheetVisible] = useState(false);
  const [mechTypeSheetVisible, setMechTypeSheetVisible] = useState(false);
  const [parkingZoneSheetVisible, setParkingZoneSheetVisible] = useState(false);
  // Saving state: blocks duplicate submits and powers the loading overlay
  const [isSaving, setIsSaving] = useState(false);
  const isCreateMode = marker?.mode === "new";
  // Markers that have been confirmed by surveyor are read-only (no editing, no saving)
  const isReadOnly = !!marker?.isConfirmed;

  // Fetch parking lot detail when an existing marker is selected
  const markerId = marker?.mode === "existing" ? Number(marker.id) : null;
  const { data: detailData } = useParkingLotDetail(markerId, screenId);
  const { mutateAsync: updateLot } = useUpdateParkingLot(screenId);
  const { mutateAsync: createLot } = useCreateParkingLot(screenId);

  // When a different marker is selected, reset tab to first
  useEffect(() => {
    if (marker) {
      setActiveTab("basic");
    }
  }, [marker?.id]);

  // Separate forms per tab
  const basicInfoForm = useForm<BasicInfoFormValues>({
    defaultValues: BASIC_INFO_DEFAULT_VALUES,
  });

  const facilitySizeForm = useForm<FacilitySizeFormValues>({
    defaultValues: FACILITY_SIZE_DEFAULT_VALUES,
  });
  const operationFeeForm = useForm<OperationFeeFormValues>({
    defaultValues: OPERATION_FEE_DEFAULT_VALUES,
  });
  const equipmentSafetyForm = useForm<EquipmentSafetyFormValues>({
    defaultValues: EQUIPMENT_SAFETY_DEFAULT_VALUES,
  });
  const actionBarForm = useForm<ActionBarFormValues>({
    defaultValues: ACTION_BAR_DEFAULT_VALUES,
  });

  // Watch functionNotMaintained to activate camera button in action bar
  const functionNotMaintained = useWatch({ control: facilitySizeForm.control, name: "functionNotMaintained" });

  // Override coordinates from address search (null = use original marker/detail coords)
  const [searchedCoords, setSearchedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Photos selected from camera/library but not yet uploaded to the server
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  // IDs of already-uploaded photos the user tapped to remove — actual DELETE is deferred until save
  const [pendingDeletionIds, setPendingDeletionIds] = useState<Set<number>>(new Set());
  const { mutateAsync: uploadPhotoMutation } = useUploadParkingLotPhoto(screenId);
  const { mutateAsync: deletePhotoMutation } = useDeleteParkingLotPhoto(screenId);

  // Already-uploaded photos for the currently selected (existing) lot
  const { data: photosData } = useParkingLotPhotos(markerId, screenId);
  const uploadedPhotos = photosData?.data ?? [];

  // Reset searched coords + pending photo state when marker changes
  useEffect(() => {
    setSearchedCoords(null);
    setPendingPhotos([]);
    setPendingDeletionIds(new Set());
  }, [marker?.id]);

  const handleAddPendingPhoto = useCallback((photo: PendingPhoto) => {
    setPendingPhotos((prev) => [...prev, photo]);
  }, []);

  const handleRemovePendingPhoto = useCallback((localId: string) => {
    setPendingPhotos((prev) => prev.filter((p) => p.localId !== localId));
  }, []);

  // Queue an uploaded photo for deletion — UI hides it immediately, server is hit on save
  const handleMarkUploadedPhotoForDeletion = useCallback((photoId: number) => {
    setPendingDeletionIds((prev) => {
      const next = new Set(prev);
      next.add(photoId);
      return next;
    });
  }, []);

  // Delete all queued photo IDs from the server, then clear the queue.
  // Run before uploads so the user can replace photos in a single save action.
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
  // Failures show a toast but do not block save success — server already has the parent record.
  const flushPendingPhotos = async (lotId: number) => {
    if (pendingPhotos.length === 0) return;
    const photos = pendingPhotos;
    setPendingPhotos([]);
    try {
      for (const p of photos) {
        await uploadPhotoMutation({
          parkingLotId: lotId,
          fileUri: p.uri,
          fileName: p.fileName,
          mimeType: p.mimeType,
          capturedAt: new Date().toISOString(),
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

  // Expose address + GPS setter so the parent screen can fill from SearchOverlay
  // Round coordinates to 7 decimal places (~1cm precision) to match backend storage
  // and prevent visual changes between pre-save and post-save display.
  useEffect(() => {
    onAddressSearchRef?.((address: string, lat: number, lng: number) => {
      basicInfoForm.setValue("address", address);
      setSearchedCoords({
        lat: Math.round(lat * 1e7) / 1e7,
        lng: Math.round(lng * 1e7) / 1e7,
      });
    });
  }, [onAddressSearchRef, basicInfoForm]);

  // Auto-fill / reset all create mode forms when a new marker is placed on the map
  useEffect(() => {
    if (marker?.mode !== "new") return;
    const parkingType = (marker.parkingType ?? "building") as ParkingLotType;
    const typeLabel = PARKING_LOT_TYPE_LABELS[parkingType] ?? "";
    basicInfoForm.reset({
      ...BASIC_INFO_DEFAULT_VALUES,
      uniqueNumber1: marker.surveyArea ?? "",
      uniqueNumber2: typeLabel,
      address: marker.address ?? "",
    });
    facilitySizeForm.reset(FACILITY_SIZE_DEFAULT_VALUES);
    operationFeeForm.reset(OPERATION_FEE_DEFAULT_VALUES);
    equipmentSafetyForm.reset(EQUIPMENT_SAFETY_DEFAULT_VALUES);
  }, [marker, basicInfoForm, facilitySizeForm, operationFeeForm, equipmentSafetyForm]);

  // Auto-fill uniqueNumber3 (seqNumber) for new markers based on the next available
  // sequence number within the (surveyArea + parkingType) scope.
  const newMarkerSurveyArea = marker?.mode === "new" ? marker.surveyArea ?? null : null;
  const { data: nextSeqData } = useNextSeqNumber(newMarkerSurveyArea, screenId);
  useEffect(() => {
    if (marker?.mode !== "new") return;
    const next = nextSeqData?.data?.nextSeqNumber;
    if (next == null) return;
    basicInfoForm.setValue("uniqueNumber3", String(next));
  }, [marker?.mode, nextSeqData, basicInfoForm]);

  // Populate all forms when detail data arrives (including after save refetch)
  // Clear searchedCoords so GPS display falls back to the fresh backend values
  useEffect(() => {
    if (!detailData?.data) return;
    setSearchedCoords(null);
    const d = detailData.data;
    const s = (v: string | null | undefined) => v ?? "";

    // BasicInfo
    const typeLabel = PARKING_LOT_TYPE_LABELS[d.parkingType] ?? "";
    basicInfoForm.reset({
      uniqueNumber1: s(d.surveyArea),
      uniqueNumber2: s(d.parkingKindLabel) || typeLabel,
      uniqueNumber3: s(d.seqLabel) || (d.seqNumber != null ? String(d.seqNumber) : ""),
      address: s(d.roadAddress) || s(d.jibunAddress),
      buildingName: s(d.buildingName),
      parkingName: s(d.parkingName),
      permitDate: formatDateDot(d.permitDate),
      mainUse: s(d.mainUse),
      landArea: s(d.landArea),
      floorArea: s(d.floorArea),
      basement: s(d.basement),
      aboveGround: s(d.aboveGround),
      totalRegistered: d.registeredSpaces ?? (d.totalSpaces != null ? `${d.totalSpaces}` : ""),
      contact: s(d.contact),
    });

    // FacilitySize
    facilitySizeForm.reset({
      unauthorizedUse: d.unauthorizedUse === "Y" || d.unauthorizedUse === "1",
      functionNotMaintained: d.functionNotMaintained === "Y" || d.functionNotMaintained === "1",
      selfIndoor: s(d.selfIndoor),
      selfOutdoor: s(d.selfOutdoor),
      selfOther: s(d.selfOther),
      mechType: mechTypeCodeToLabel(d.mechType),
      mechCount: mechTypeCodeToLabel(d.mechType) === "기타" ? s(d.mechCount) : "",
      dedicatedDisabled: s(d.dedicatedDisabled),
      dedicatedCompact: s(d.dedicatedCompact),
      dedicatedFamily: s(d.dedicatedFamily),
      dedicatedElectric: s(d.dedicatedElectric),
      dedicatedSharing: s(d.dedicatedSharing),
      dedicatedOther: s(d.dedicatedOther),
      peakDaytimeCount: s(d.peakDaytimeCount),
      peakNighttimeCount: s(d.peakNighttimeCount),
    });

    // OperationFee
    operationFeeForm.reset({
      isOpen: s(d.isOpen),
      alternatingEnabled: false,
      alternatingType: s(d.alternatingType) || "미시행",
      weekdayNotOp: d.weekdayNotOp === "Y" ? true : d.weekdayNotOp === "N" ? false : !d.weekdayHours,
      saturdayNotOp: d.saturdayNotOp === "Y" ? true : d.saturdayNotOp === "N" ? false : !d.saturdayHours,
      holidayNotOp: d.holidayNotOp === "Y" ? true : d.holidayNotOp === "N" ? false : !d.holidayHours,
      paymentMethod: s(d.paymentMethod),
      hasCollector: s(d.hasCollector),
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

    // EquipmentSafety
    equipmentSafetyForm.reset({
      barrier: s(d.barrier),
      plateRecognition: s(d.plateRecognition),
      exitAlarm: s(d.exitAlarm),
      alarmSound: s(d.alarmSound),
      cctv: s(d.cctv),
      videoStorage: s(d.videoStorage),
      fallPrevention: s(d.fallPrevention),
      mechParkingStaff: s(d.mechParkingStaff),
      mechParkingOperation: s(d.mechParkingOperation),
      mechParkingInspection: s(d.mechParkingInspection),
      inspectionCert: s(d.inspectionCert),
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

  // Build update payload from all tab forms and call PATCH API
  // Build update payload and call PATCH API. isDraft controls whether marker color changes.
  const submitUpdate = async (isDraft: boolean) => {
    if (!markerId) return;

    const basic = basicInfoForm.getValues();
    const facility = facilitySizeForm.getValues();
    const op = operationFeeForm.getValues();
    const safety = equipmentSafetyForm.getValues();

    const s = (v: string) => v.trim() || null;

    try {
      const result = await updateLot({
        id: markerId,
        data: {
          isDraft,
          // Location (updated when address is changed via search)
          ...(searchedCoords ? {
            jibunAddress: s(basic.address),
            roadAddress: s(basic.address),
            latitude: searchedCoords.lat,
            longitude: searchedCoords.lng,
          } : {}),
          // Identity
          surveyArea: s(basic.uniqueNumber1),
          seqLabel: s(basic.uniqueNumber3),
          parkingKindLabel: s(basic.uniqueNumber2),
          // BasicInfo
          parkingName: s(basic.parkingName),
          contact: s(basic.contact),
          buildingName: s(basic.buildingName),
          permitDate: s(basic.permitDate),
          mainUse: s(basic.mainUse),
          landArea: s(basic.landArea),
          floorArea: s(basic.floorArea),
          basement: s(basic.basement),
          aboveGround: s(basic.aboveGround),
          registeredSpaces: s(basic.totalRegistered.replace(/면$/, "")),
          totalSpaces: basic.totalRegistered ? Number(basic.totalRegistered.replace(/면$/, "")) || null : null,
          // FacilitySize
          unauthorizedUse: facility.unauthorizedUse ? "Y" : null,
          functionNotMaintained: facility.functionNotMaintained ? "Y" : null,
          selfIndoor: s(facility.selfIndoor),
          selfOutdoor: s(facility.selfOutdoor),
          selfOther: s(facility.selfOther),
          mechType: mechTypeLabelToCode(facility.mechType),
          mechCount: facility.mechType === "기타" ? s(facility.mechCount) : null,
          dedicatedDisabled: s(facility.dedicatedDisabled),
          dedicatedCompact: s(facility.dedicatedCompact),
          dedicatedFamily: s(facility.dedicatedFamily),
          dedicatedElectric: s(facility.dedicatedElectric),
          dedicatedSharing: s(facility.dedicatedSharing),
          dedicatedOther: s(facility.dedicatedOther),
          peakDaytimeCount: s(facility.peakDaytimeCount),
          peakNighttimeCount: s(facility.peakNighttimeCount),
          // OperationFee
          isOpen: s(op.isOpen),
          alternatingType: s(op.alternatingType) || "미시행",
          weekdayNotOp: op.weekdayNotOp ? "Y" : "N",
          saturdayNotOp: op.saturdayNotOp ? "Y" : "N",
          holidayNotOp: op.holidayNotOp ? "Y" : "N",
          paymentMethod: s(op.paymentMethod),
          hasCollector: s(op.hasCollector),
          feeType: s(op.feeType),
          parkingZone: s(op.parkingZone),
          residentDay: s(op.residentDay), residentNight: s(op.residentNight), residentAllDay: s(op.residentAllDay),
          carBaseTime: s(op.carBaseTime), carExtraTime: s(op.carExtraTime),
          carBaseFee: s(op.carBaseFee), carExtraFee: s(op.carExtraFee),
          carAllDay: s(op.carAllDay), carMonthly: s(op.carMonthly),
          busBaseTime: s(op.busBaseTime), busExtraTime: s(op.busExtraTime),
          busBaseFee: s(op.busBaseFee), busExtraFee: s(op.busExtraFee),
          busAllDay: s(op.busAllDay), busMonthly: s(op.busMonthly),
          bikeBaseTime: s(op.bikeBaseTime), bikeExtraTime: s(op.bikeExtraTime),
          bikeBaseFee: s(op.bikeBaseFee), bikeExtraFee: s(op.bikeExtraFee),
          bikeAllDay: s(op.bikeAllDay), bikeMonthly: s(op.bikeMonthly),
          discountDisabled: s(op.discountDisabled), discountVeteran: s(op.discountVeteran),
          discountMultiChild: s(op.discountMultiChild), discountEco: s(op.discountEco),
          discountDayOff: s(op.discountDayOff), discountTenDay: s(op.discountTenDay),
          discountOther: s(op.discountOther),
          // EquipmentSafety
          barrier: s(safety.barrier), plateRecognition: s(safety.plateRecognition),
          exitAlarm: s(safety.exitAlarm), alarmSound: s(safety.alarmSound),
          cctv: s(safety.cctv), videoStorage: s(safety.videoStorage),
          fallPrevention: s(safety.fallPrevention),
          mechParkingStaff: s(safety.mechParkingStaff),
          mechParkingOperation: s(safety.mechParkingOperation),
          mechParkingInspection: s(safety.mechParkingInspection),
          inspectionCert: s(safety.inspectionCert),
        },
      });

      // Apply queued photo deletions, then upload any newly picked photos
      await flushPendingDeletions(markerId);
      await flushPendingPhotos(markerId);

      if (isDraft) {
        showToast({ message: "임시저장이 완료되었습니다." });
      } else {
        // Notify parent with whether data actually changed (backend determines this)
        const hasChanges = result.data.isUpdated;
        onSaveSuccess?.(marker!.id, hasChanges);
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

  // Build create payload from edit forms and call POST + PATCH APIs
  const submitCreate = async (isDraft: boolean) => {
    if (!marker) return;
    const basic = basicInfoForm.getValues();
    const facility = facilitySizeForm.getValues();
    const op = operationFeeForm.getValues();
    const safety = equipmentSafetyForm.getValues();
    const s = (v: string) => v.trim() || null;

    // Create mode only uses base parking types (building, off_street, on_street)
    const baseType = (marker.parkingType ?? "building") as import("@/src/api-contracts").ParkingLotType;

    try {
      // Use searched coordinates if address was changed, otherwise original marker position
      const createLat = searchedCoords?.lat ?? marker.lat;
      const createLng = searchedCoords?.lng ?? marker.lng;

      // Step 1: Create the parking lot with basic info
      const seqNumberValue = basic.uniqueNumber3 ? Number(basic.uniqueNumber3) : null;
      const result = await createLot({
        parkingType: baseType,
        latitude: createLat,
        longitude: createLng,
        parkingName: s(basic.parkingName),
        jibunAddress: s(basic.address),
        roadAddress: s(basic.address),
        totalSpaces: basic.totalRegistered ? Number(basic.totalRegistered.replace(/면$/, "")) || null : null,
        registeredSpaces: s(basic.totalRegistered.replace(/면$/, "")),
        surveyArea: s(basic.uniqueNumber1),
        seqNumber: seqNumberValue != null && !Number.isNaN(seqNumberValue) ? seqNumberValue : null,
      });

      const newId = result.data.id;

      // Step 2: Update with all remaining data (skipStatusFlags to keep only isCreatedByApp)
      await updateLot({
        id: newId,
        data: {
          skipStatusFlags: true,
          // BasicInfo extras not in CreateParkingLotRequest
          seqLabel: s(basic.uniqueNumber3),
          parkingKindLabel: s(basic.uniqueNumber2),
          buildingName: s(basic.buildingName),
          contact: s(basic.contact),
          permitDate: s(basic.permitDate),
          mainUse: s(basic.mainUse),
          landArea: s(basic.landArea),
          floorArea: s(basic.floorArea),
          basement: s(basic.basement),
          aboveGround: s(basic.aboveGround),
          registeredSpaces: s(basic.totalRegistered.replace(/면$/, "")),
          totalSpaces: basic.totalRegistered ? Number(basic.totalRegistered.replace(/면$/, "")) || null : null,
          // FacilitySize
          unauthorizedUse: facility.unauthorizedUse ? "Y" : null,
          functionNotMaintained: facility.functionNotMaintained ? "Y" : null,
          selfIndoor: s(facility.selfIndoor),
          selfOutdoor: s(facility.selfOutdoor),
          selfOther: s(facility.selfOther),
          mechType: mechTypeLabelToCode(facility.mechType),
          mechCount: facility.mechType === "기타" ? s(facility.mechCount) : null,
          dedicatedDisabled: s(facility.dedicatedDisabled),
          dedicatedCompact: s(facility.dedicatedCompact),
          dedicatedFamily: s(facility.dedicatedFamily),
          dedicatedElectric: s(facility.dedicatedElectric),
          dedicatedSharing: s(facility.dedicatedSharing),
          dedicatedOther: s(facility.dedicatedOther),
          peakDaytimeCount: s(facility.peakDaytimeCount),
          peakNighttimeCount: s(facility.peakNighttimeCount),
          // OperationFee
          isOpen: s(op.isOpen),
          alternatingType: s(op.alternatingType) || "미시행",
          weekdayNotOp: op.weekdayNotOp ? "Y" : "N",
          saturdayNotOp: op.saturdayNotOp ? "Y" : "N",
          holidayNotOp: op.holidayNotOp ? "Y" : "N",
          paymentMethod: s(op.paymentMethod),
          hasCollector: s(op.hasCollector),
          feeType: s(op.feeType),
          parkingZone: s(op.parkingZone),
          residentDay: s(op.residentDay), residentNight: s(op.residentNight), residentAllDay: s(op.residentAllDay),
          carBaseTime: s(op.carBaseTime), carExtraTime: s(op.carExtraTime),
          carBaseFee: s(op.carBaseFee), carExtraFee: s(op.carExtraFee),
          carAllDay: s(op.carAllDay), carMonthly: s(op.carMonthly),
          busBaseTime: s(op.busBaseTime), busExtraTime: s(op.busExtraTime),
          busBaseFee: s(op.busBaseFee), busExtraFee: s(op.busExtraFee),
          busAllDay: s(op.busAllDay), busMonthly: s(op.busMonthly),
          bikeBaseTime: s(op.bikeBaseTime), bikeExtraTime: s(op.bikeExtraTime),
          bikeBaseFee: s(op.bikeBaseFee), bikeExtraFee: s(op.bikeExtraFee),
          bikeAllDay: s(op.bikeAllDay), bikeMonthly: s(op.bikeMonthly),
          discountDisabled: s(op.discountDisabled), discountVeteran: s(op.discountVeteran),
          discountMultiChild: s(op.discountMultiChild), discountEco: s(op.discountEco),
          discountDayOff: s(op.discountDayOff), discountTenDay: s(op.discountTenDay),
          discountOther: s(op.discountOther),
          // EquipmentSafety
          barrier: s(safety.barrier), plateRecognition: s(safety.plateRecognition),
          exitAlarm: s(safety.exitAlarm), alarmSound: s(safety.alarmSound),
          cctv: s(safety.cctv), videoStorage: s(safety.videoStorage),
          fallPrevention: s(safety.fallPrevention),
          mechParkingStaff: s(safety.mechParkingStaff),
          mechParkingOperation: s(safety.mechParkingOperation),
          mechParkingInspection: s(safety.mechParkingInspection),
          inspectionCert: s(safety.inspectionCert),
        },
      });

      // Apply queued deletions (no-op for create) and upload any newly picked photos
      await flushPendingDeletions(newId);
      await flushPendingPhotos(newId);

      if (isDraft) {
        showToast({ message: "임시저장이 완료되었습니다." });
      } else {
        // Trigger marker color change for final save (use searched coords if address was changed)
        onCreateSuccess?.(String(newId), createLat, createLng, marker.parkingType ?? "building");
        showToast({ message: "수정 정보가 시스템에 업데이트되었습니다" });
      }
      // Move marker + map if address was changed via search
      if (searchedCoords) {
        onMarkerLocationChange?.(String(newId), createLat, createLng);
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
    // Validate dedicated parking zones do not exceed total spaces
    const fv = facilitySizeForm.getValues();
    const total =
      (parseInt(fv.selfIndoor) || 0) +
      (parseInt(fv.selfOutdoor) || 0) +
      (parseInt(fv.selfOther) || 0);
    const dedicated =
      (parseInt(fv.dedicatedDisabled) || 0) +
      (parseInt(fv.dedicatedCompact) || 0) +
      (parseInt(fv.dedicatedFamily) || 0) +
      (parseInt(fv.dedicatedElectric) || 0) +
      (parseInt(fv.dedicatedSharing) || 0) +
      (parseInt(fv.dedicatedOther) || 0);
    if (dedicated > total) {
      showToast({ message: "입력한 총 면수가 전체 주차면수를 초과했습니다", type: "error" });
      return;
    }

    setIsSaving(true);
    try {
      if (!isCreateMode && markerId) {
        await submitUpdate(isDraft);
        return;
      }
      if (isCreateMode) {
        // react-hook-form's handleSubmit returns a Promise we can await
        await basicInfoForm.handleSubmit(() => submitCreate(isDraft))();
        return;
      }
    } finally {
      setIsSaving(false);
    }
  };
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
      // snapPoints index: 0 = 8%, 1 = 50%, 2 = max
      if (currentIndexRef.current < 2) {
        bottomSheetRef.current?.snapToIndex(2);
      }
    });
    return () => sub.remove();
  }, []);

  // Animated style for the header (search bar + GPS + filter buttons)
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

  // Animated style for the white backdrop that covers exposed map above the sheet.
  // It stretches from screen top down to overlap the sheet's top edge,
  // creating a seamless white block as the sheet expands.
  // Only appears when sheet is between 50% and max snap point.
  const OVERLAP = 20;
  // Position when sheet is at 50% snap point
  const halfPosition = screenHeight - navBarHeight - (screenHeight - navBarHeight) * 0.5;
  // Position when sheet is at max snap point
  const maxPosition = insets.top + TOP_PADDING;
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    const h = animatedPosition.value + OVERLAP;
    // Fade in only when sheet goes above 50% toward max
    const opacity = interpolate(
      animatedPosition.value,
      [maxPosition, halfPosition],
      [1, 0],
      Extrapolation.CLAMP
    );

    return {
      height: h,
      opacity,
    };
  });

  if (!marker) return null;

  return (
    <>
      {/* White backdrop covering the exposed map above the bottom sheet.
          Sits between the map layer and the header, overlaps the sheet's
          top rounded corners to create a seamless white block. */}
      <Animated.View
        style={[styles.mapBackdrop, backdropAnimatedStyle]}
        pointerEvents="none"
      />

      {/* Header overlay - search bar + icons (fades out when sheet is fully expanded) */}
      {/* needsOffscreenAlphaCompositing forces Android to render children into an offscreen
          buffer first, then apply opacity — this prevents elevation shadows from leaking through */}
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
          <Text style={styles.title}>부설 주차장</Text>
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
                  onPress={() => {
                    setActiveTab(tab.id);
                    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
                  }}
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
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bottomOffset={40}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {activeTab === "basic" && (
            <BasicInfoContent
              control={basicInfoForm.control}
              onMainUsePress={isReadOnly ? undefined : () => setMainUseSheetVisible(true)}
              onAddressSearchPress={isReadOnly ? undefined : onAddressSearchPress}
              isEditing={!isReadOnly}
              latitude={searchedCoords?.lat ?? (isCreateMode ? marker?.lat : detailData?.data?.latitude)}
              longitude={searchedCoords?.lng ?? (isCreateMode ? marker?.lng : detailData?.data?.longitude)}
              uploadedPhotos={uploadedPhotos}
              pendingPhotos={pendingPhotos}
              pendingDeletionIds={pendingDeletionIds}
              onAddPendingPhoto={handleAddPendingPhoto}
              onRemovePendingPhoto={handleRemovePendingPhoto}
              onMarkUploadedPhotoForDeletion={handleMarkUploadedPhotoForDeletion}
            />
          )}
          {activeTab === "facility" && (
            <FacilitySizeContent
              control={facilitySizeForm.control}
              onMechTypePress={isReadOnly ? undefined : () => setMechTypeSheetVisible(true)}
              isEditing={!isReadOnly}
            />
          )}
          {activeTab === "operation" && (
            <OperationFeeContent
              control={operationFeeForm.control}
              onParkingZonePress={isReadOnly ? undefined : () => setParkingZoneSheetVisible(true)}
              isEditing={!isReadOnly}
            />
          )}
          {activeTab === "safety" && (
            <EquipmentSafetyContent control={equipmentSafetyForm.control} isEditing={!isReadOnly} />
          )}
        </BottomSheetKeyboardAwareScrollView>

        {/* Bottom action bar: hidden for already-updated markers (read-only mode) */}
        {!isReadOnly && (
          <ActionBar
            control={actionBarForm.control}
            isCameraEnabled={functionNotMaintained}
            isCreateMode={isCreateMode}
            onDraftSave={() => onSubmit(true)}
            onSubmit={() => onSubmit(false)}
          />
        )}
      </BottomSheet>

      {/* Main use selection bottom sheet */}
      <MainUseBottomSheet
        visible={mainUseSheetVisible}
        selectedValue={basicInfoForm.watch("mainUse") as MainUseOption}
        onClose={() => setMainUseSheetVisible(false)}
        onSelect={(value) => basicInfoForm.setValue("mainUse", value)}
      />

      {/* Mechanical type selection bottom sheet */}
      <MechanicalTypeBottomSheet
        visible={mechTypeSheetVisible}
        selectedValue={facilitySizeForm.watch("mechType") as MechanicalTypeOption}
        onClose={() => setMechTypeSheetVisible(false)}
        onSelect={(value) => {
          facilitySizeForm.setValue("mechType", value);
          if (value !== "기타") facilitySizeForm.setValue("mechCount", "");
        }}
      />

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
