/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/parking-lot.contracts.ts
 * Generated at: 2026-06-08T06:02:53.091Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Parking Lot Contracts
 * Shared types for parking lot (주차장 DB) upload feature
 */

// Parking lot type (from Excel sheet name)
export const PARKING_LOT_TYPES = ['building', 'off_street', 'on_street'] as const;
export type ParkingLotType = (typeof PARKING_LOT_TYPES)[number];

export const PARKING_LOT_TYPE_LABELS: Record<ParkingLotType, string> = {
  building: '건축물부설',
  off_street: '노외',
  on_street: '노상',
};

// On-street display sub-types (legal/illegal × day/night)
export const ON_STREET_SUB_TYPES = [
  'on_street_legal_day',
  'on_street_legal_night',
  'on_street_illegal_day',
  'on_street_illegal_night',
] as const;
export type OnStreetSubType = (typeof ON_STREET_SUB_TYPES)[number];

// Display type for map markers (base types + on-street sub-types + app-created variants)
export type ParkingLotDisplayType = 'building' | 'building_app' | 'off_street' | 'off_street_app' | OnStreetSubType;

export const PARKING_LOT_DISPLAY_TYPE_LABELS: Record<ParkingLotDisplayType, string> = {
  building: '건축물부설 주차장',
  building_app: '건축물부설 주차장 (앱 등록)',
  off_street: '노외 주차장',
  off_street_app: '노외 주차장 (앱 등록)',
  on_street_legal_day: '노상합법(주간)',
  on_street_legal_night: '노상합법(야간)',
  on_street_illegal_day: '노상불법(주간)',
  on_street_illegal_night: '노상불법(야간)',
};

// Upload status
export const PARKING_LOT_UPLOAD_STATUSES = ['pending', 'parsing', 'in_progress', 'completed', 'failed', 'rate_limited'] as const;
export type ParkingLotUploadStatus = (typeof PARKING_LOT_UPLOAD_STATUSES)[number];

// Ready status
export const PARKING_LOT_READY_STATUSES = ['preparing', 'completed'] as const;
export type ParkingLotReadyStatus = (typeof PARKING_LOT_READY_STATUSES)[number];

// Type breakdown counts
export interface ParkingTypeBreakdown {
  building: number;
  offStreet: number;
  onStreet: number;
}

// Upload record DTO (for listing upload history)
export interface ParkingLotUploadDto {
  id: string;
  fileName: string;
  region: string;
  uploaderId: string;
  uploaderName: string;
  totalRows: number;
  successCount: number;
  failedCount: number;
  successBreakdown: ParkingTypeBreakdown;
  failedBreakdown: ParkingTypeBreakdown;
  status: ParkingLotUploadStatus;
  progress: number;
  readyStatus: ParkingLotReadyStatus;
  usedInSurvey: boolean;
  errorMessage?: string | null;
  memo?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Active conversion info for polling
export interface ParkingLotActiveConversion {
  id: string;
  fileName: string;
  region: string;
  status: ParkingLotUploadStatus;
  progress: number;
}

// Request: Get upload history list
export interface GetParkingLotUploadsRequest {
  page?: number;
  limit?: number;
  region?: string;
  /** Closed-period batchId — list comes from history snapshot when set. */
  batchId?: string;
}

// Response: Paginated upload history
export interface GetParkingLotUploadsResponse {
  data: ParkingLotUploadDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  activeConversion: ParkingLotActiveConversion | null;
}

// Response: Upload Excel file
export interface UploadParkingLotExcelResponse {
  data: ParkingLotUploadDto;
}

// Response: Get upload progress (polling)
export interface GetParkingLotUploadProgressResponse {
  id: string;
  status: ParkingLotUploadStatus;
  progress: number;
  totalRows: number;
  successCount: number;
  failedCount: number;
  errorMessage?: string | null;
}

// Response: Delete upload
export interface DeleteParkingLotUploadResponse {
  success: boolean;
}

// Response: Toggle ready status
export interface ToggleParkingLotReadyStatusResponse {
  data: {
    id: string;
    readyStatus: ParkingLotReadyStatus;
  };
}

// Request: Update memo for an upload record
export interface UpdateParkingLotMemoRequest {
  memo: string | null;
}

// Response: Updated memo
export interface UpdateParkingLotMemoResponse {
  data: {
    id: string;
    memo: string | null;
  };
}

// Error detail item (failed row)
export interface ParkingLotUploadErrorItem {
  rowNumber: number;
  parkingType: ParkingLotType;
  message: string;
}

// Request: Get upload error details
export interface GetParkingLotUploadErrorsRequest {
  page?: number;
  limit?: number;
  /** Closed-period batchId — read from history snapshot when set */
  batchId?: string;
}

// Response: Paginated error details for an upload
export interface GetParkingLotUploadErrorsResponse {
  data: ParkingLotUploadErrorItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Map data for parking analysis map ──

// Query params for map data endpoint (viewport-based loading)
export interface GetParkingLotMapDataQuery {
  /** Region filter / 지역 필터 */
  region?: string;
  /** Parking type filter / 주차장 유형 필터 */
  parkingType?: ParkingLotType;
  /** Southwest latitude of viewport / 뷰포트 남서 위도 */
  swLat?: number;
  /** Southwest longitude of viewport / 뷰포트 남서 경도 */
  swLng?: number;
  /** Northeast latitude of viewport / 뷰포트 북동 위도 */
  neLat?: number;
  /** Northeast longitude of viewport / 뷰포트 북동 경도 */
  neLng?: number;
}

// Map viewport bounds
export interface MapBounds {
  /** Southwest latitude / 남서 위도 */
  swLat: number;
  /** Southwest longitude / 남서 경도 */
  swLng: number;
  /** Northeast latitude / 북동 위도 */
  neLat: number;
  /** Northeast longitude / 북동 경도 */
  neLng: number;
}

/** Polygon coordinates for marker illustration / 마커 폴리곤 좌표 */
export interface PolygonCoordinates {
  /** Four corner points [lat, lng], order: TL→TR→BR→BL / 4개 꼭짓점 좌표 */
  corners: [number, number][];
  /** Rotation angle in radians / 회전 각도 (라디안) */
  rotation: number;
}

// Individual parking lot marker for map rendering (minimal fields for performance)
export interface ParkingLotMapDto {
  /** Parking lot DB row ID / 주차장 DB row ID */
  id: number;
  /** Display type (sub-type for on_street, base type otherwise) / 표시 유형 */
  parkingType: ParkingLotDisplayType;
  /** Latitude / 위도 */
  lat: number;
  /** Longitude / 경도 */
  lng: number;
  /** Whether this record has been manually updated / 수동 수정 여부 */
  isUpdated: boolean;
  /** Whether this record was created via the mobile app field survey / 앱 현장 신규 등록 여부 */
  isCreatedByApp: boolean;
  /** Whether this record has been confirmed/completed by surveyor / 조사 확인 완료 여부 */
  isConfirmed: boolean;
  /** Total parking spaces / 총주차면수 */
  totalSpaces: number;
  /** Peak daytime parked count (07~20) / 첨두시 주간 주차대수 */
  peakDaytimeCount: number | null;
  /** Peak nighttime parked count (20~07) / 첨두시 야간 주차대수 */
  peakNighttimeCount: number | null;
  /** Illustration polygon (if exists) / 마커 폴리곤 좌표 */
  polygonCoordinates?: PolygonCoordinates | null;
}

// Response: Parking lot data for map
export interface GetParkingLotMapDataResponse {
  data: ParkingLotMapDto[];
}

/** Single on-street parking lot polygon (illustration outline) */
export interface OnStreetPolygonDto {
  /** Parking lot DB row ID / 주차장 DB row ID */
  id: number;
  /** Polygon coordinates (4 corners + rotation) / 폴리곤 좌표 */
  polygon: PolygonCoordinates;
}

/** Response: on-street polygons for the analysis map */
export interface GetOnStreetPolygonsResponse {
  data: OnStreetPolygonDto[];
}

// ── Parking lot detail (single item) ──

/**
 * Raw data column mapping per parking type (1-indexed Excel columns).
 * null means the field does not exist for that parking type.
 */
export interface ParkingLotRawColumnMap {
  // BasicInfo tab
  buildingName: number | null;
  permitDate: number | null;
  mainUse: number | null;
  landArea: number | null;
  floorArea: number | null;
  basement: number | null;
  aboveGround: number | null;
  registeredSpaces: number | null;

  // FacilitySize tab
  unauthorizedUse: number | null;
  functionNotMaintained: number | null;
  selfIndoor: number | null;
  selfOutdoor: number | null;
  selfOther: number | null;
  mechType: number | null;
  mechCount: number | null;
  dedicatedDisabled: number | null;
  dedicatedCompact: number | null;
  dedicatedFamily: number | null;
  dedicatedElectric: number | null;
  dedicatedSharing: number | null;
  dedicatedOther: number | null;
  peakDaytimeTime: number | null;
  peakDaytimeCount: number | null;
  peakNighttimeTime: number | null;
  peakNighttimeCount: number | null;

  // OperationFee tab
  isOpen: number | null;
  alternatingType: number | null;
  /** Parking operation type (시간제, 거주자우선, 관광버스, 이륜차) / 주차장 운영방식 */
  operationType: number | null;
  weekdayHours: number | null;
  saturdayHours: number | null;
  holidayHours: number | null;
  /** Resident priority parking hours / 거주자우선주차 운영시간 */
  residentHours: number | null;
  paymentMethod: number | null;
  hasCollector: number | null;
  feeType: number | null;
  parkingZone: number | null;
  residentDay: number | null;
  residentNight: number | null;
  residentAllDay: number | null;
  carBaseTime: number | null;
  carExtraTime: number | null;
  carBaseFee: number | null;
  carExtraFee: number | null;
  carAllDay: number | null;
  carMonthly: number | null;
  busBaseTime: number | null;
  busExtraTime: number | null;
  busBaseFee: number | null;
  busExtraFee: number | null;
  busAllDay: number | null;
  busMonthly: number | null;
  bikeBaseTime: number | null;
  bikeExtraTime: number | null;
  bikeBaseFee: number | null;
  bikeExtraFee: number | null;
  bikeAllDay: number | null;
  bikeMonthly: number | null;
  discountDisabled: number | null;
  discountVeteran: number | null;
  discountMultiChild: number | null;
  discountEco: number | null;
  discountDayOff: number | null;
  discountTenDay: number | null;
  discountOther: number | null;

  // EquipmentSafety tab
  barrier: number | null;
  plateRecognition: number | null;
  exitAlarm: number | null;
  alarmSound: number | null;
  cctv: number | null;
  videoStorage: number | null;
  fallPrevention: number | null;
  mechParkingStaff: number | null;
  mechParkingOperation: number | null;
  mechParkingInspection: number | null;
  inspectionCert: number | null;
}

/**
 * Column mappings for extracting fields from rawData JSON.
 * Derived from Excel template headers (row 1 + row 2).
 *
 * 건축물부설 (building):   87 cols total
 * 노외주차장 (off_street): 88 cols total
 * 노상주차장 (on_street):  72 cols total
 */
export const RAW_DATA_COLUMN_MAPS: Record<ParkingLotType, ParkingLotRawColumnMap> = {
  building: {
    // BasicInfo
    buildingName: 10, permitDate: 12, mainUse: 13, landArea: 14,
    floorArea: 15, basement: 16, aboveGround: 17, registeredSpaces: 18,
    // FacilitySize
    unauthorizedUse: 19, functionNotMaintained: 20,
    selfIndoor: 22, selfOutdoor: 23, selfOther: 24,
    mechType: 25, mechCount: 26,
    dedicatedDisabled: 27, dedicatedCompact: 28, dedicatedFamily: 29,
    dedicatedElectric: 30, dedicatedSharing: 31, dedicatedOther: 32,
    peakDaytimeTime: 33, peakDaytimeCount: 34,
    peakNighttimeTime: 35, peakNighttimeCount: 36,
    // OperationFee
    isOpen: 37, alternatingType: 38, operationType: null,
    weekdayHours: 39, saturdayHours: 40, holidayHours: 41, residentHours: null,
    paymentMethod: 42, hasCollector: 43, feeType: 44, parkingZone: 45,
    residentDay: 46, residentNight: 47, residentAllDay: 48,
    carBaseTime: 49, carExtraTime: 50, carBaseFee: 51, carExtraFee: 52, carAllDay: 53, carMonthly: 54,
    busBaseTime: 55, busExtraTime: 56, busBaseFee: 57, busExtraFee: 58, busAllDay: 59, busMonthly: 60,
    bikeBaseTime: 61, bikeExtraTime: 62, bikeBaseFee: 63, bikeExtraFee: 64, bikeAllDay: 65, bikeMonthly: 66,
    discountDisabled: 67, discountVeteran: 68, discountMultiChild: 69,
    discountEco: 70, discountDayOff: 71, discountTenDay: 72, discountOther: 73,
    // EquipmentSafety
    barrier: 74, plateRecognition: 75, exitAlarm: 76, alarmSound: 77,
    cctv: 78, videoStorage: 79,
    fallPrevention: 80, mechParkingStaff: 81, mechParkingOperation: 82,
    mechParkingInspection: 83, inspectionCert: 84,
  },
  off_street: {
    // BasicInfo (no building info for off_street, but permitDate = col 11 = 설치일)
    buildingName: null, permitDate: 11, mainUse: null, landArea: null,
    floorArea: null, basement: null, aboveGround: null, registeredSpaces: 12,
    // FacilitySize
    unauthorizedUse: 17, functionNotMaintained: 18,
    selfIndoor: 20, selfOutdoor: 21, selfOther: null,
    mechType: 22, mechCount: 23,
    dedicatedDisabled: 24, dedicatedCompact: 25, dedicatedFamily: 26,
    dedicatedElectric: 27, dedicatedSharing: 28, dedicatedOther: 29,
    peakDaytimeTime: 30, peakDaytimeCount: 31,
    peakNighttimeTime: 32, peakNighttimeCount: 33,
    // OperationFee
    isOpen: 34, alternatingType: 35, operationType: 36,
    weekdayHours: 37, saturdayHours: 38, holidayHours: 39, residentHours: 40,
    paymentMethod: 43, hasCollector: 44, feeType: 45, parkingZone: 46,
    residentDay: 47, residentNight: 48, residentAllDay: 49,
    carBaseTime: 50, carExtraTime: 51, carBaseFee: 52, carExtraFee: 53, carAllDay: 54, carMonthly: 55,
    busBaseTime: 56, busExtraTime: 57, busBaseFee: 58, busExtraFee: 59, busAllDay: 60, busMonthly: 61,
    bikeBaseTime: 62, bikeExtraTime: 63, bikeBaseFee: 64, bikeExtraFee: 65, bikeAllDay: 66, bikeMonthly: 67,
    discountDisabled: 68, discountVeteran: 69, discountMultiChild: 70,
    discountEco: 71, discountDayOff: 72, discountTenDay: 73, discountOther: 74,
    // EquipmentSafety
    barrier: 75, plateRecognition: 76, exitAlarm: 77, alarmSound: 78,
    cctv: 79, videoStorage: 80,
    fallPrevention: 81, mechParkingStaff: 82, mechParkingOperation: 83,
    mechParkingInspection: 84, inspectionCert: 85,
  },
  on_street: {
    // BasicInfo (no building info for on_street)
    buildingName: null, permitDate: null, mainUse: null, landArea: null,
    floorArea: null, basement: null, aboveGround: null, registeredSpaces: null,
    // FacilitySize (on_street has dedicated spaces but no indoor/outdoor/mech)
    unauthorizedUse: null, functionNotMaintained: null,
    selfIndoor: null, selfOutdoor: null, selfOther: null,
    mechType: null, mechCount: null,
    dedicatedDisabled: 6, dedicatedCompact: 7, dedicatedFamily: 8,
    dedicatedElectric: 9, dedicatedSharing: 10, dedicatedOther: 11,
    peakDaytimeTime: null, peakDaytimeCount: null,
    peakNighttimeTime: null, peakNighttimeCount: null,
    // OperationFee
    isOpen: null, alternatingType: null, operationType: null,
    weekdayHours: 34, saturdayHours: 35, holidayHours: 36, residentHours: null,
    paymentMethod: 40, hasCollector: null, feeType: 41, parkingZone: 42,
    residentDay: 43, residentNight: 44, residentAllDay: 45,
    carBaseTime: 46, carExtraTime: 47, carBaseFee: 48, carExtraFee: 49, carAllDay: 50, carMonthly: 51,
    busBaseTime: 52, busExtraTime: 53, busBaseFee: 54, busExtraFee: 55, busAllDay: 56, busMonthly: 57,
    bikeBaseTime: 58, bikeExtraTime: 59, bikeBaseFee: 60, bikeExtraFee: 61, bikeAllDay: 62, bikeMonthly: 63,
    discountDisabled: 64, discountVeteran: 65, discountMultiChild: 66,
    discountEco: 67, discountDayOff: 68, discountTenDay: 69, discountOther: 70,
    // EquipmentSafety (on_street has none)
    barrier: null, plateRecognition: null, exitAlarm: null, alarmSound: null,
    cctv: null, videoStorage: null,
    fallPrevention: null, mechParkingStaff: null, mechParkingOperation: null,
    mechParkingInspection: null, inspectionCert: null,
  },
};

/** Parking lot detail DTO (full info for bottom sheet) */
export interface ParkingLotDetailDto {
  /** DB row ID / DB 행 ID */
  id: number;
  /** Parking type / 주차장 유형 */
  parkingType: ParkingLotType;
  /** On-street display sub-type / 노상 세부 유형 */
  onStreetSubType: OnStreetSubType | null;
  /** Whether this record has been manually updated / 수동 수정 여부 */
  isUpdated: boolean;
  /** Whether this record was created via the mobile app field survey / 앱 현장 신규 등록 여부 */
  isCreatedByApp: boolean;
  /** Whether this record has been confirmed/completed by surveyor / 조사 확인 완료 여부 */
  isConfirmed: boolean;
  /** ID of the user who created this record / 생성자 ID */
  createdBy: string | null;
  /** Survey area / 조사구역 */
  surveyArea: string | null;
  /** Sequence number / 연번 */
  seqNumber: number | null;
  /** Parking kind label (editable by surveyor) / 주차장종류 (조사원 편집 가능) */
  parkingKindLabel: string | null;
  /** Sequence label (editable by surveyor) / 연번 (조사원 편집 가능) */
  seqLabel: string | null;
  /** Contact phone / 연락처 */
  contact: string | null;
  /** Jibun address / 지번 주소 */
  jibunAddress: string | null;
  /** Road address / 도로명 주소 */
  roadAddress: string | null;
  /** Latitude / 위도 */
  latitude: number | null;
  /** Longitude / 경도 */
  longitude: number | null;
  /** Parking lot name / 주차장명 */
  parkingName: string | null;
  /** Total parking spaces / 총주차면수 */
  totalSpaces: number | null;
  /** Region from upload / 지역 */
  region: string;
  /** Surveyor name assigned to this area (via zone assignment) / 담당 조사원명 */
  surveyorName: string | null;
  /** All surveyor names assigned to this area / 해당 구역 담당 조사원 목록 */
  surveyorNames: string[];

  // On-street survey-only fields
  /** Parking section presence / 주차구획 유무 */
  parkingSection: string | null;
  /** Dedicated section type / 전용 주차구획 종류 */
  dedicatedSection: string | null;
  /** Vehicle type / 차량종류 */
  vehicleType: string | null;
  /** Sloped parking presence / 경사진 주차장 유무 */
  slopedParking: string | null;
  /** Safety management facility / 안전관리시설 */
  safetyFacility: string | null;
  /** Safety facility other text / 안전관리시설 기타 내용 */
  safetyFacilityOtherText: string | null;
  /** Parking section number / 주차구간번호 */
  sectionNumber: string | null;
  /** Parking zone number / 주차구획번호 */
  zoneNumber: string | null;
  /** Group management number / 그룹관리번호 */
  groupNumber: string | null;
  /** Parking section install date / 주차구획 설치일 */
  installDate: string | null;
  /** Ownership / 소유 */
  ownership: string | null;
  /** Ownership company name (when 민간) / 소유 업체명 */
  ownershipCompanyName: string | null;
  /** Operation entity / 운영주체 */
  operation: string | null;
  /** Consignment name / 위탁 업체명 */
  consignmentName: string | null;
  /** Hourly parking operation / 시간제주차 운영 */
  opTimeParking: string | null;
  /** Resident parking operation / 거주자우선주차장 운영 */
  opResidentParking: string | null;
  /** Tour bus parking operation / 관광버스 주차장 운영 */
  opTourBusParking: string | null;
  /** Motorcycle parking operation / 이륜차주차장 운영 */
  opMotorcycleParking: string | null;
  /** Weekday non-operation / 평일 미운영 */
  weekdayNotOp: string | null;
  /** Saturday non-operation / 토요일 미운영 */
  saturdayNotOp: string | null;
  /** Holiday non-operation / 공휴일 미운영 */
  holidayNotOp: string | null;
  /** Resident weekday non-operation / 거주자 평일 미운영 */
  residentWeekdayNotOp: string | null;
  /** Resident Saturday non-operation / 거주자 토요일 미운영 */
  residentSaturdayNotOp: string | null;
  /** Resident holiday non-operation / 거주자 공휴일 미운영 */
  residentHolidayNotOp: string | null;

  // BasicInfo (building type only)
  buildingName: string | null;
  permitDate: string | null;
  mainUse: string | null;
  landArea: string | null;
  floorArea: string | null;
  basement: string | null;
  aboveGround: string | null;
  registeredSpaces: string | null;

  // FacilitySize
  unauthorizedUse: string | null;
  functionNotMaintained: string | null;
  selfIndoor: string | null;
  selfOutdoor: string | null;
  selfOther: string | null;
  mechType: string | null;
  mechCount: string | null;
  dedicatedDisabled: string | null;
  dedicatedCompact: string | null;
  dedicatedFamily: string | null;
  dedicatedElectric: string | null;
  dedicatedSharing: string | null;
  dedicatedOther: string | null;
  peakDaytimeTime: string | null;
  peakDaytimeCount: string | null;
  peakNighttimeTime: string | null;
  peakNighttimeCount: string | null;

  // OperationFee
  isOpen: string | null;
  alternatingType: string | null;
  /** Parking operation type / 주차장 운영방식 */
  operationType: string | null;
  weekdayHours: string | null;
  saturdayHours: string | null;
  holidayHours: string | null;
  /** Resident priority parking hours / 거주자우선주차 운영시간 */
  residentHours: string | null;
  paymentMethod: string | null;
  hasCollector: string | null;
  feeType: string | null;
  parkingZone: string | null;
  residentDay: string | null;
  residentNight: string | null;
  residentAllDay: string | null;
  carBaseTime: string | null;
  carExtraTime: string | null;
  carBaseFee: string | null;
  carExtraFee: string | null;
  carAllDay: string | null;
  carMonthly: string | null;
  busBaseTime: string | null;
  busExtraTime: string | null;
  busBaseFee: string | null;
  busExtraFee: string | null;
  busAllDay: string | null;
  busMonthly: string | null;
  bikeBaseTime: string | null;
  bikeExtraTime: string | null;
  bikeBaseFee: string | null;
  bikeExtraFee: string | null;
  bikeAllDay: string | null;
  bikeMonthly: string | null;
  discountDisabled: string | null;
  discountVeteran: string | null;
  discountMultiChild: string | null;
  discountEco: string | null;
  discountDayOff: string | null;
  discountTenDay: string | null;
  discountOther: string | null;

  // EquipmentSafety
  barrier: string | null;
  plateRecognition: string | null;
  exitAlarm: string | null;
  alarmSound: string | null;
  cctv: string | null;
  videoStorage: string | null;
  fallPrevention: string | null;
  mechParkingStaff: string | null;
  mechParkingOperation: string | null;
  mechParkingInspection: string | null;
  inspectionCert: string | null;
  /** Illustration polygon / 마커 폴리곤 좌표 */
  polygonCoordinates: PolygonCoordinates | null;
  /** Last updated epoch seconds (null if never updated) / 최종 수정 시각 */
  updatedAt: number | null;
  /** Last updated by user display name (admin or surveyor) / 최종 수정자명 */
  updatedByName: string | null;
}

/** Response: Get parking lot detail */
export interface GetParkingLotDetailResponse {
  data: ParkingLotDetailDto;
}

/** Request: Update parking lot fields (manual survey edit) */
export interface UpdateParkingLotRequest {
  /** Draft save flag — when true, saves without marking as updated / 임시 저장 플래그 */
  isDraft?: boolean;
  /** Skip status flag changes (isDraft/isUpdated) — used by create flow Step 2 / 상태 플래그 변경 건너뛰기 */
  skipStatusFlags?: boolean;
  /** Skip flipping isConfirmed to true — used by back-office admin edits where
   *  the lot's survey status should not change just because an admin tweaked
   *  fields / 관리자 수정 시 조사 상태 변경 건너뛰기 */
  skipConfirm?: boolean;

  // Location (updated via address search)
  /** Jibun address / 지번 주소 */
  jibunAddress?: string | null;
  /** Road address / 도로명 주소 */
  roadAddress?: string | null;
  /** Latitude / 위도 */
  latitude?: number | null;
  /** Longitude / 경도 */
  longitude?: number | null;

  // Identity
  surveyArea?: string | null;
  seqNumber?: number | null;
  /** Parking kind label (editable by surveyor) / 주차장종류 (조사원 편집 가능) */
  parkingKindLabel?: string | null;
  /** Sequence label (editable by surveyor) / 연번 (조사원 편집 가능) */
  seqLabel?: string | null;

  /** On-street display sub-type / 노상 세부 유형 (day/night × legal/illegal) */
  onStreetSubType?: OnStreetSubType | null;

  // On-street survey-only fields (entered by surveyor via app)
  /** Parking section presence / 주차구획 유무 ("유"/"무") */
  parkingSection?: string | null;
  /** Dedicated section type / 전용 주차구획 종류 (e.g. "장애인", "경차") */
  dedicatedSection?: string | null;
  /** Vehicle type / 차량종류 (e.g. "승용차", "화물차") */
  vehicleType?: string | null;
  /** Sloped parking presence / 경사진 주차장 유무 ("유"/"무") */
  slopedParking?: string | null;
  /** Safety management facility / 안전관리시설 (e.g. "고인목(스토퍼)", "기타") */
  safetyFacility?: string | null;
  /** Safety facility other text / 안전관리시설 기타 내용 */
  safetyFacilityOtherText?: string | null;
  /** Parking section number / 주차구간번호 */
  sectionNumber?: string | null;
  /** Parking zone number / 주차구획번호 */
  zoneNumber?: string | null;
  /** Group management number / 그룹관리번호 */
  groupNumber?: string | null;
  /** Parking section install date / 주차구획 설치일 */
  installDate?: string | null;
  /** Ownership / 소유 ("시"/"구"/"민간") */
  ownership?: string | null;
  /** Ownership company name (when 민간) / 소유 업체명 */
  ownershipCompanyName?: string | null;
  /** Operation entity / 운영주체 ("자치구"/"공단"/"민간"/"민간위탁") */
  operation?: string | null;
  /** Consignment name / 위탁 업체명 */
  consignmentName?: string | null;
  /** Hourly parking operation checkbox states / 시간제주차 운영방식 체크 ("Y"/"N") */
  opTimeParking?: string | null;
  /** Resident parking operation checkbox / 거주자우선주차장 체크 ("Y"/"N") */
  opResidentParking?: string | null;
  /** Tour bus parking operation checkbox / 관광버스 주차장 체크 ("Y"/"N") */
  opTourBusParking?: string | null;
  /** Motorcycle parking operation checkbox / 이륜차주차장 체크 ("Y"/"N") */
  opMotorcycleParking?: string | null;
  /** Weekday non-operation flag / 평일 미운영 ("Y"/"N") */
  weekdayNotOp?: string | null;
  /** Saturday non-operation flag / 토요일 미운영 ("Y"/"N") */
  saturdayNotOp?: string | null;
  /** Holiday non-operation flag / 공휴일 미운영 ("Y"/"N") */
  holidayNotOp?: string | null;
  /** Resident weekday non-operation flag / 거주자 평일 미운영 ("Y"/"N") */
  residentWeekdayNotOp?: string | null;
  /** Resident Saturday non-operation flag / 거주자 토요일 미운영 ("Y"/"N") */
  residentSaturdayNotOp?: string | null;
  /** Resident holiday non-operation flag / 거주자 공휴일 미운영 ("Y"/"N") */
  residentHolidayNotOp?: string | null;

  // BasicInfo
  buildingName?: string | null;
  permitDate?: string | null;
  mainUse?: string | null;
  landArea?: string | null;
  floorArea?: string | null;
  basement?: string | null;
  aboveGround?: string | null;
  registeredSpaces?: string | null;
  /** Total parking spaces (normalized int, kept in sync with registeredSpaces) / 총주차면수 */
  totalSpaces?: number | null;
  parkingName?: string | null;
  contact?: string | null;

  // FacilitySize
  unauthorizedUse?: string | null;
  functionNotMaintained?: string | null;
  selfIndoor?: string | null;
  selfOutdoor?: string | null;
  selfOther?: string | null;
  mechType?: string | null;
  mechCount?: string | null;
  dedicatedDisabled?: string | null;
  dedicatedCompact?: string | null;
  dedicatedFamily?: string | null;
  dedicatedElectric?: string | null;
  dedicatedSharing?: string | null;
  dedicatedOther?: string | null;
  peakDaytimeCount?: string | null;
  peakNighttimeCount?: string | null;

  // OperationFee
  isOpen?: string | null;
  alternatingType?: string | null;
  /** Parking operation type / 주차장 운영방식 */
  operationType?: string | null;
  weekdayHours?: string | null;
  saturdayHours?: string | null;
  holidayHours?: string | null;
  /** Resident priority parking hours / 거주자우선주차 운영시간 */
  residentHours?: string | null;
  paymentMethod?: string | null;
  hasCollector?: string | null;
  feeType?: string | null;
  parkingZone?: string | null;
  residentDay?: string | null;
  residentNight?: string | null;
  residentAllDay?: string | null;
  carBaseTime?: string | null;
  carExtraTime?: string | null;
  carBaseFee?: string | null;
  carExtraFee?: string | null;
  carAllDay?: string | null;
  carMonthly?: string | null;
  busBaseTime?: string | null;
  busExtraTime?: string | null;
  busBaseFee?: string | null;
  busExtraFee?: string | null;
  busAllDay?: string | null;
  busMonthly?: string | null;
  bikeBaseTime?: string | null;
  bikeExtraTime?: string | null;
  bikeBaseFee?: string | null;
  bikeExtraFee?: string | null;
  bikeAllDay?: string | null;
  bikeMonthly?: string | null;
  discountDisabled?: string | null;
  discountVeteran?: string | null;
  discountMultiChild?: string | null;
  discountEco?: string | null;
  discountDayOff?: string | null;
  discountTenDay?: string | null;
  discountOther?: string | null;

  // EquipmentSafety
  barrier?: string | null;
  plateRecognition?: string | null;
  exitAlarm?: string | null;
  alarmSound?: string | null;
  cctv?: string | null;
  videoStorage?: string | null;
  fallPrevention?: string | null;
  mechParkingStaff?: string | null;
  mechParkingOperation?: string | null;
  mechParkingInspection?: string | null;
  inspectionCert?: string | null;

  /** Illustration polygon coordinates / 마커 폴리곤 좌표 */
  polygonCoordinates?: PolygonCoordinates | null;
}

/** Response: Update parking lot */
export interface UpdateParkingLotResponse {
  data: ParkingLotDetailDto;
}

/** Request: Create a new parking lot from field survey */
export interface CreateParkingLotRequest {
  /** Parking type / 주차장 유형 */
  parkingType: ParkingLotType;
  /** Latitude from map tap / 지도 탭 위도 */
  latitude: number;
  /** Longitude from map tap / 지도 탭 경도 */
  longitude: number;
  /** Parking lot name / 주차장명 */
  parkingName?: string | null;
  /** Jibun address / 지번 주소 */
  jibunAddress?: string | null;
  /** Road address / 도로명 주소 */
  roadAddress?: string | null;
  /** Total parking spaces / 총주차면수 */
  totalSpaces?: number | null;
  /** Registered spaces (raw string, kept in sync with totalSpaces) / 건축물대장 총등록주차면 */
  registeredSpaces?: string | null;
  /** Contact phone / 연락처 */
  contact?: string | null;
  /** Survey area / 조사구역 */
  surveyArea?: string | null;
  /** Sequence number within survey area / 조사구역 내 일련번호 */
  seqNumber?: number | null;
  /** Draft save flag — when true, saves without marking as updated / 임시 저장 플래그 */
  isDraft?: boolean;
}

/** Response: Create parking lot */
export interface CreateParkingLotResponse {
  data: ParkingLotDetailDto;
}

/** Response: Next sequence number for a survey area (zone-wide, all parking types) */
export interface GetNextSeqNumberResponse {
  /** Next sequence number (max seqNumber + 1, or 1 if no markers exist yet) / 다음 일련번호 */
  data: { nextSeqNumber: number };
}

/**
 * Compact columnar format for map data — reduces JSON size by ~60%.
 * Instead of array-of-objects, data is split into typed flat arrays.
 * Frontend reconstructs: { id: ids[i], parkingType: types[typeIndices[i]], lat: lats[i], lng: lngs[i] }
 */
export interface GetParkingLotMapDataCompactResponse {
  /** Distinct display types used in the dataset / 데이터에 사용된 표시 유형 목록 */
  types: ParkingLotDisplayType[];
  /** Parking lot DB row IDs / 주차장 DB row ID 배열 */
  ids: number[];
  /** Index into `types` array for each row / 각 행의 유형 인덱스 */
  typeIndices: number[];
  /** Latitudes / 위도 배열 */
  lats: number[];
  /** Longitudes / 경도 배열 */
  lngs: number[];
  /** Whether each lot has been manually updated (완료) / 수동 수정 여부 배열 */
  isUpdatedFlags: number[];
  /** Whether each lot has been confirmed/completed by surveyor / 조사 확인 완료 여부 배열 */
  isConfirmedFlags: number[];
  /** Total parking spaces per lot / 총주차면수 배열 */
  totalSpacesArr: number[];
  /** Peak daytime parked count (07~20) per lot / 첨두시 주간 주차대수 배열 */
  peakDaytimeArr: number[];
  /** Peak nighttime parked count (20~07) per lot / 첨두시 야간 주차대수 배열 */
  peakNighttimeArr: number[];
}

// ── Survey zone management list (mobile app) ──

/** List item for survey zone management screen / 조사 구역 관리 목록 아이템 */
export interface SurveyListItem {
  /** DB row ID / DB 행 ID */
  id: number;
  /** Parking type / 주차장 유형 */
  parkingType: ParkingLotType;
  /** On-street sub-type (only for on_street) / 노상 세부 유형 */
  onStreetSubType: OnStreetSubType | null;
  /** Display address (road or jibun) / 표시 주소 */
  address: string | null;
  /** Survey area code / 조사구역 코드 */
  surveyArea: string | null;
  /** Latitude / 위도 */
  lat: number;
  /** Longitude / 경도 */
  lng: number;
  /** Last modified ISO date / 최종 수정일 */
  lastModifiedDate: string | null;
  /** Whether this record has been manually updated / 수동 수정 여부 */
  isUpdated: boolean;
  /** Whether this record was created via the mobile app / 앱 현장 등록 여부 */
  isCreatedByApp: boolean;
  /** Whether this record is a draft / 임시 저장 여부 */
  isDraft: boolean;
  /** Whether this record has been confirmed/completed by surveyor / 조사 확인 완료 여부 */
  isConfirmed: boolean;
}

/** Status filter for survey list / 조사 목록 상태 필터 */
export type SurveyStatusFilter = 'original' | 'updated' | 'new';

/** Query params for survey list / 조사 목록 조회 쿼리 */
export interface GetSurveyListQuery {
  /** Tab filter: data (draft/not-updated) or completed (updated) / 탭 필터 */
  tab: 'data' | 'completed';
  /** Filter by parking type / 주차장 유형 필터 */
  parkingType?: ParkingLotType;
  /** Filter by status (comma-separated: original,updated,new) / 상태 필터 */
  status?: string;
}

/** Response: Survey list for mobile app / 조사 목록 응답 */
export interface GetSurveyListResponse {
  data: SurveyListItem[];
  total: number;
}

// ── Parking lot photo (주차장 사진) ──

/**
 * Photo category. Used to separate the multi-photo parking lot info gallery
 * (basic info tab) from the single vehicle-in-lot photo (operation fee tab).
 * 사진 분류: 'basic' = 기본정보 사진, 'vehicle' = 운영요금 차량 사진
 */
export type ParkingLotPhotoCategory = 'basic' | 'vehicle';

/** DTO for a parking lot photo record / 주차장 사진 DTO */
export interface ParkingLotPhotoDto {
  /** Photo record ID / 사진 ID */
  id: number;
  /** Parent parking lot ID / 소속 주차장 ID */
  parkingLotId: number;
  /** Photo file URL path / 사진 파일 경로 */
  filePath: string;
  /** Original file name / 원본 파일명 */
  originalName: string;
  /** File size in bytes / 파일 크기 */
  fileSize: number;
  /** MIME type / MIME 타입 */
  mimeType: string;
  /** Capture timestamp (ISO string) / 촬영 시각 */
  capturedAt: string | null;
  /** GPS latitude at capture / 촬영 위도 */
  gpsLatitude: number | null;
  /** GPS longitude at capture / 촬영 경도 */
  gpsLongitude: number | null;
  /** Address where photo was taken / 촬영 주소 */
  address: string | null;
  /** Vehicle plate number / 차량 번호 */
  vehiclePlate: string | null;
  /** Photo category / 사진 분류 */
  category: ParkingLotPhotoCategory;
  /** Created epoch seconds / 생성 시각 */
  createdAt: number;
  /** Created by user ID / 생성자 ID */
  createdBy: string | null;
  /** Last updated epoch seconds / 최종 수정 시각 */
  updatedAt: number | null;
  /** Last updated by user ID / 최종 수정자 ID */
  updatedBy: string | null;
}

/** Response: Upload parking lot photo / 주차장 사진 업로드 응답 */
export interface UploadParkingLotPhotoResponse {
  data: ParkingLotPhotoDto;
}

/** Request: Update parking lot photo metadata / 주차장 사진 메타데이터 수정 요청 */
export interface UpdateParkingLotPhotoRequest {
  /** Address where photo was taken / 촬영 주소 */
  address?: string | null;
  /** Vehicle plate number / 차량 번호 */
  vehiclePlate?: string | null;
  /** GPS latitude at capture / 촬영 위도 */
  gpsLatitude?: number | null;
  /** GPS longitude at capture / 촬영 경도 */
  gpsLongitude?: number | null;
}

/** Response: Update parking lot photo / 주차장 사진 수정 응답 */
export interface UpdateParkingLotPhotoResponse {
  data: ParkingLotPhotoDto;
}

/** Response: Get parking lot photos list / 주차장 사진 목록 응답 */
export interface GetParkingLotPhotosResponse {
  data: ParkingLotPhotoDto[];
}

/** Response: Delete parking lot photo / 주차장 사진 삭제 응답 */
export interface DeleteParkingLotPhotoResponse {
  /** Deleted photo ID / 삭제된 사진 ID */
  id: number;
}

// ── Analysis Data list (실태분석 자료) ──

/** Single row in the analysis-data table / 실태분석 자료 테이블 항목 */
export interface ParkingLotAnalysisItemDto {
  /** Parking lot DB row ID / 주차장 DB row ID */
  id: number;
  /** Sequence number from Excel (연번) — used as the displayed 번호 column / 번호 */
  seqNumber: number | null;
  /** Region name / 지역명 */
  region: string | null;
  /** Survey area number / 구역번호 */
  surveyArea: string | null;
  /** Parking lot name / 주차장명 */
  parkingName: string | null;
  /** Address (road address fallback to jibun) / 주소 */
  address: string | null;
  /** Total parking spaces / 주차면수 */
  totalSpaces: number | null;
  /** Peak daytime parked count / 주간 주차수요 */
  peakDaytimeCount: number | null;
  /** Peak nighttime parked count / 야간 주차수요 */
  peakNighttimeCount: number | null;
  /** Created epoch seconds / 등록일 */
  createdAt: number;
}

/** Request: Get analysis-data list / 실태분석 자료 목록 조회 요청 */
export interface GetParkingLotAnalysisListRequest {
  /** Page (1-based) / 페이지 (1부터) */
  page?: number;
  /** Page size / 페이지 크기 */
  limit?: number;
  /** Date range start (epoch seconds, inclusive) / 시작 일자 */
  dateFrom?: number;
  /** Date range end (epoch seconds, inclusive) / 종료 일자 */
  dateTo?: number;
  /** Survey area filter / 조사구역 필터 */
  surveyArea?: string;
  /** Region filter (matches u.REGION exactly or as prefix) / 지역 필터 */
  region?: string;
  /** Search keyword (matches region, parkingName, address) / 검색어 */
  search?: string;
  /**
   * Closed-period batch id. When set, list is read from
   * TBL_PARKING_LOTS_HISTORY (snapshot taken at data-reset time).
   * Omit / null → live tables (current active period).
   * / 종료된 조사연도(리셋 배치) 식별자
   */
  batchId?: string;
}

/** Response: Paginated analysis-data list / 실태분석 자료 페이징 응답 */
export interface GetParkingLotAnalysisListResponse {
  data: ParkingLotAnalysisItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  /** Distinct survey areas for filter dropdown / 필터 드롭다운용 구역 목록 */
  surveyAreas: string[];
}

/** Response: Soft-delete a single parking lot / 주차장 단건 삭제 응답 */
export interface DeleteParkingLotResponse {
  success: boolean;
  id: number;
}

/** Request: Bulk soft-delete parking lots / 주차장 일괄 삭제 요청 */
export interface BulkDeleteParkingLotsRequest {
  ids: number[];
}

/** Response: Bulk soft-delete parking lots / 주차장 일괄 삭제 응답 */
export interface BulkDeleteParkingLotsResponse {
  success: boolean;
  /** Number of rows actually soft-deleted / 실제 삭제된 행 수 */
  deletedCount: number;
}
