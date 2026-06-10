/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/app-survey-progress.contracts.ts
 * Generated at: 2026-06-08T06:02:53.088Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * App Survey Progress Contracts (모바일 조사 진행 현황)
 * Response types for the mobile control board / survey progress screen.
 * Shows how many parking lots the surveyor has completed out of assigned zones.
 */

// ============================================
// GET /api/app/survey-progress
// Screen: APP_CONTROL_BOARD
// ============================================

/** Per-parking-type progress breakdown / 주차장 유형별 진행 현황 */
export interface AppSurveyProgressByType {
  /** Parking type identifier / 주차장 유형 */
  parkingType: 'building' | 'off_street' | 'on_street';
  /** Display name (Korean) / 표시명 */
  name: string;
  /** Completed parking lots / 완료 주차장 수 */
  completed: number;
  /** Total assigned parking lots / 전체 배정 주차장 수 */
  total: number;
  /** Completion percentage / 완료율 (%) */
  percent: number;
  /** Chart color hex / 차트 색상 */
  color: string;
}

/** Overall survey progress for the authenticated surveyor / 조사원 전체 조사 진행 현황 */
export interface GetAppSurveyProgressResponse {
  /** Total completed parking lots across all types / 전체 완료 주차장 수 */
  totalCompleted: number;
  /** Total assigned parking lots across all types / 전체 배정 주차장 수 */
  totalAssigned: number;
  /** Overall completion percentage / 전체 완료율 (%) */
  overallPercent: number;
  /** Breakdown by parking type / 유형별 진행 현황 */
  byType: AppSurveyProgressByType[];
}
