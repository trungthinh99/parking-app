/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/report.contracts.ts
 * Generated at: 2026-06-08T06:02:53.092Z
 *
 * To regenerate, run: npm run sync:contracts
 */

// ============================================================================
// Report output (보고서 출력) — aggregated parking analysis stats per survey area
// ============================================================================

/** Per-row figures for the supply/demand/illegal table. */
export interface ReportTableRow {
  /** 공급면수 (registered parking spaces) */
  supply: number;
  /** 주차수요 주간 (peak daytime occupancy / on-street day count) */
  demandDay: number;
  /** 주차수요 야간 (peak nighttime occupancy / on-street night count) */
  demandNight: number;
  /** 불법주차 주간 — only meaningful for 노상; null otherwise */
  illegalDay: number | null;
  /** 불법주차 야간 — only meaningful for 노상; null otherwise */
  illegalNight: number | null;
}

/** Aggregated analysis numbers (percentages, 0–∞ as raw ratios × 100). */
export interface ReportAnalysis {
  /** 주차장 확보율 = 총 공급 / 자동차 등록대수 × 100 */
  securingRate: number;
  /** 주차장 수급률 주간 = 총 공급 / 총 주차수요 주간 × 100 */
  supplyRateDay: number;
  /** 주차장 수급률 야간 = 총 공급 / 총 주차수요 야간 × 100 */
  supplyRateNight: number;
  /** 주차장 이용률 주간 = 총 주차수요 주간 / 총 공급 × 100 */
  utilizationDay: number;
  /** 주차장 이용률 야간 = 총 주차수요 야간 / 총 공급 × 100 */
  utilizationNight: number;
  /** 노상 불법주차율 주간 = 노상 불법(주간) / 노상 주차수요(주간) × 100 */
  illegalRateDay: number;
  /** 노상 불법주차율 야간 = 노상 불법(야간) / 노상 주차수요(야간) × 100 */
  illegalRateNight: number;
}

export interface ReportData {
  /** Filter echo: region (구/군) used to scope the aggregation */
  region: string | null;
  /** Filter echo: survey area number/label */
  surveyArea: string | null;
  /** Per-type rows for the main figures table */
  rows: {
    onStreet: ReportTableRow;
    offStreet: ReportTableRow;
    building: ReportTableRow;
    total: ReportTableRow;
  };
  /** Total registered vehicles in the region (자동차 등록대수) */
  vehicleCount: number;
  /** Computed analysis percentages */
  analysis: ReportAnalysis;
}

export interface GetReportRequest {
  region?: string;
  surveyArea?: string;
}

export interface GetReportResponse {
  data: ReportData;
}

/**
 * Batch response keyed by survey area code. The empty string "" is the
 * aggregate row (whole region). Lets the report screen fetch one payload
 * instead of one request per sheet (~20× saving when many zones are picked).
 */
export interface GetReportBatchResponse {
  data: Record<string, ReportData>;
}
