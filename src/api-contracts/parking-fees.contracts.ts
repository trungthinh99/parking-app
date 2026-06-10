/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/parking-fees.contracts.ts
 * Generated at: 2026-06-08T06:02:53.091Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Parking Fees Module Contracts
 * Request/Response types for Parking Fee Settings API
 */

// ============================================
// Enums & Types
// ============================================

export const PARKING_GRADES = ['GRADE_1', 'GRADE_2', 'GRADE_3'] as const;
export type ParkingGrade = (typeof PARKING_GRADES)[number];

export const PARKING_TYPES = ['ON_STREET', 'OFF_STREET'] as const;
export type ParkingType = (typeof PARKING_TYPES)[number];

export const FEE_TYPES = ['SINGLE', 'DAILY', 'MONTHLY'] as const;
export type FeeType = (typeof FEE_TYPES)[number];

export const TIME_SLOT_TYPES = ['ALL_DAY', 'DAYTIME', 'NIGHTTIME'] as const;
export type TimeSlotType = (typeof TIME_SLOT_TYPES)[number];

// ============================================
// Display label maps (English enum → Korean UI text)
// ============================================

export const PARKING_GRADE_LABELS: Record<ParkingGrade, string> = {
  GRADE_1: '1급지',
  GRADE_2: '2급지',
  GRADE_3: '3급지',
};

export const PARKING_TYPE_LABELS: Record<ParkingType, string> = {
  ON_STREET: '노상',
  OFF_STREET: '노외',
};

export const FEE_TYPE_LABELS: Record<FeeType, string> = {
  SINGLE: '1회주차',
  DAILY: '일일권',
  MONTHLY: '월정기권',
};

export const TIME_SLOT_TYPE_LABELS: Record<TimeSlotType, string> = {
  ALL_DAY: '전일',
  DAYTIME: '주간',
  NIGHTTIME: '야간',
};

// ============================================
// Sub-entities (API Response shapes)
// ============================================

export interface TimeSlotDto {
  id: string;
  timeSlotType: TimeSlotType;
  timeSlotValue: string;
  baseTime: number | null;
  baseFee: number | null;
  dailyFee: number | null;
  monthlyFee: number | null;
}

export interface ParkingFeeDto {
  id: string;
  parkingGrade: ParkingGrade;
  parkingType: ParkingType;
  feeType: FeeType;
  isActive: boolean;
  timeSlots: TimeSlotDto[];
  /** Summary string for table display, e.g., "전일 (24시간)" */
  timeSlotSummary: string;
  /** Summary string for fee detail, e.g., "500원/10분" */
  feeDetailSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeAreaMappingDto {
  id: string;
  parkingFeeId: string;
  surveyAreaId: string;
  createdAt: string;
}

// ============================================
// GET /api/parking-fees
// Screen: PARKING_FEE_SETTINGS
// ============================================

export interface GetParkingFeesRequest {
  page?: number;
  limit?: number;
  parkingGrades?: ParkingGrade[];
  parkingTypes?: ParkingType[];
  feeTypes?: FeeType[];
  /** Closed-period batchId — list comes from history snapshot when set. */
  batchId?: string;
}

export interface GetParkingFeesResponse {
  data: ParkingFeeDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// GET /api/parking-fees/:id
// Screen: PARKING_FEE_SETTINGS
// ============================================

export interface GetParkingFeeResponse {
  data: ParkingFeeDto;
}

// ============================================
// POST /api/parking-fees
// Screen: PARKING_FEE_SETTINGS
// ============================================

export interface CreateTimeSlotRequest {
  timeSlotType: TimeSlotType;
  timeSlotValue: string;
  baseTime?: number;
  baseFee?: number;
  dailyFee?: number;
  monthlyFee?: number;
}

export interface CreateParkingFeeRequest {
  parkingGrade: ParkingGrade;
  parkingType: ParkingType;
  feeType: FeeType;
  isActive: boolean;
  timeSlots: CreateTimeSlotRequest[];
}

export interface CreateParkingFeeResponse {
  data: ParkingFeeDto;
}

// ============================================
// PATCH /api/parking-fees/:id
// Screen: PARKING_FEE_SETTINGS
// ============================================

export interface UpdateTimeSlotRequest {
  id?: string;
  timeSlotType: TimeSlotType;
  timeSlotValue: string;
  baseTime?: number;
  baseFee?: number;
  dailyFee?: number;
  monthlyFee?: number;
}

export interface UpdateParkingFeeRequest {
  parkingGrade?: ParkingGrade;
  parkingType?: ParkingType;
  feeType?: FeeType;
  isActive?: boolean;
  timeSlots?: UpdateTimeSlotRequest[];
}

export interface UpdateParkingFeeResponse {
  data: ParkingFeeDto;
}

// ============================================
// PATCH /api/parking-fees/:id/status
// Screen: PARKING_FEE_SETTINGS
// ============================================

export interface ToggleParkingFeeStatusRequest {
  isActive: boolean;
}

export interface ToggleParkingFeeStatusResponse {
  data: ParkingFeeDto;
}

// ============================================
// GET /api/parking-fees/:id/mappings
// Screen: PARKING_FEE_SETTINGS
// ============================================

export interface GetFeeAreaMappingsResponse {
  data: FeeAreaMappingDto[];
}

// ============================================
// POST /api/parking-fees/:id/mappings
// Screen: PARKING_FEE_SETTINGS
// ============================================

export interface SaveFeeAreaMappingsRequest {
  surveyAreaIds: string[];
}

export interface SaveFeeAreaMappingsResponse {
  success: boolean;
  mappedCount: number;
}
