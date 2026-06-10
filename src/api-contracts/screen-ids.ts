/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/screen-ids.ts
 * Generated at: 2026-06-08T06:02:53.092Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Screen IDs - Định nghĩa tất cả màn hình trong hệ thống
 * Frontend và Backend PHẢI sử dụng chung file này
 *
 * @description Mỗi screen ID đại diện cho một màn hình/page cụ thể.
 * API chỉ trả dữ liệu cho các screen đã được đăng ký.
 */
export const SCREEN_IDS = {
  // Auth Module
  AUTH_LOGIN: 'AUTH_LOGIN',
  AUTH_SIGNUP: 'AUTH_SIGNUP',
  AUTH_SIGNUP_TENANT_CHOICE: 'AUTH_SIGNUP_TENANT_CHOICE',
  AUTH_SIGNUP_ORGANIZATION: 'AUTH_SIGNUP_ORGANIZATION',
  AUTH_OTP: 'AUTH_OTP',
  AUTH_FIND_ID: 'AUTH_FIND_ID',
  AUTH_FIND_PASSWORD: 'AUTH_FIND_PASSWORD',
  AUTH_SUCCESS: 'AUTH_SUCCESS',

  // App Module (Mobile)
  APP_AUTH_LOGIN: 'APP_AUTH_LOGIN',
  APP_AUTH_REFRESH: 'APP_AUTH_REFRESH',
  APP_AUTH_SIGNUP: 'APP_AUTH_SIGNUP',
  APP_AUTH_FIND_PASSWORD: 'APP_AUTH_FIND_PASSWORD',
  APP_MY_PROFILE: 'APP_MY_PROFILE',
  APP_SECURITY_SETTINGS: 'APP_SECURITY_SETTINGS',
  APP_PRIVATE_PARKING: 'APP_PRIVATE_PARKING',
  APP_STREET_PARKING: 'APP_STREET_PARKING',
  APP_ON_STREET_PARKING: 'APP_ON_STREET_PARKING',
  APP_MESSAGES: 'APP_MESSAGES',
  APP_CHAT: 'APP_CHAT',

  // Back Office Chat (global, accessible from any page)
  BO_CHAT: 'BO_CHAT',
  APP_SURVEY_ZONE_MANAGEMENT: 'APP_SURVEY_ZONE_MANAGEMENT',
  APP_CONTROL_BOARD: 'APP_CONTROL_BOARD',
  APP_REGION_INVITES: 'APP_REGION_INVITES',

  // Survey Area Management Module
  SURVEY_AREA_MANAGEMENT: 'SURVEY_AREA_MANAGEMENT',

  // System Management Module
  AREA_ADMINISTRATORS: 'AREA_ADMINISTRATORS',
  SURVEYORS: 'SURVEYORS',
  PARKING_FEE_SETTINGS: 'PARKING_FEE_SETTINGS',
  SYSTEM_LOGS: 'SYSTEM_LOGS',
  MESSAGE_HISTORY: 'MESSAGE_HISTORY',

  // Survey Progress Module
  SURVEY_PROGRESS: 'SURVEY_PROGRESS',

  // Parking Analysis Module
  PARKING_ANALYSIS_MAP: 'PARKING_ANALYSIS_MAP',
  REPORT_OUTPUT: 'REPORT_OUTPUT',
  ANALYSIS_DATA_LIST: 'ANALYSIS_DATA_LIST',

  // Data Upload Module
  DATA_UPLOAD_VEHICLE: 'DATA_UPLOAD_VEHICLE',
  DATA_UPLOAD_SURVEY_MAP: 'DATA_UPLOAD_SURVEY_MAP',
  DATA_UPLOAD_PARKING_DB: 'DATA_UPLOAD_PARKING_DB',
} as const;

export type ScreenId = (typeof SCREEN_IDS)[keyof typeof SCREEN_IDS];

/**
 * Screen Registry - Đăng ký các endpoint cho từng screen
 * Mỗi screen chỉ có thể gọi các endpoint đã được đăng ký
 */
export const SCREEN_ENDPOINT_REGISTRY: Record<ScreenId, string[]> = {
  AUTH_LOGIN: ['POST /auth/login'],
  AUTH_SIGNUP: ['POST /auth/check-username', 'POST /auth/signup', 'POST /auth/otp/send', 'GET /tenants/*/public'],
  AUTH_SIGNUP_TENANT_CHOICE: ['POST /tenants/check-business-reg'],
  AUTH_SIGNUP_ORGANIZATION: ['POST /auth/check-username', 'POST /auth/otp/send', 'POST /auth/otp/verify', 'POST /tenants/register', 'GET /tenants/region2-availability'],
  AUTH_OTP: ['POST /auth/otp/verify', 'POST /auth/otp/send'],
  AUTH_FIND_ID: ['POST /auth/find-id'],
  AUTH_FIND_PASSWORD: ['POST /auth/otp/send', 'POST /auth/otp/verify', 'POST /auth/verify-user', 'POST /auth/password/reset'],
  AUTH_SUCCESS: [],

  // App Module (Mobile)
  APP_AUTH_LOGIN: ['POST /app/auth/login'],
  APP_AUTH_REFRESH: ['POST /app/auth/refresh'],
  APP_AUTH_SIGNUP: ['POST /app/auth/signup', 'POST /auth/otp/send', 'POST /auth/otp/verify'],
  APP_AUTH_FIND_PASSWORD: ['POST /auth/otp/send', 'POST /auth/otp/verify', 'POST /app/auth/find-password', 'POST /app/auth/reset-password'],
  APP_MY_PROFILE: ['GET /app/auth/me', 'POST /app/auth/avatar/update', 'PATCH /app/auth/profile', 'POST /app/auth/check-phone', 'POST /auth/otp/send', 'POST /auth/otp/verify'],
  APP_SECURITY_SETTINGS: ['POST /app/auth/logout', 'POST /app/auth/change-password', 'POST /app/auth/withdraw', 'GET /app/auth/devices', 'POST /app/auth/devices/revoke', 'POST /app/auth/devices/location'],
  APP_PRIVATE_PARKING: ['GET /app/parking-lots/map-data', 'GET /app/parking-lots/*', 'PATCH /app/parking-lots/*', 'POST /app/parking-lots', 'GET /app/surveyor-zones', 'GET /app/surveyor-regions', 'GET /app/surveyor-zone-boundaries', 'POST /app/location-tracking', 'POST /app/parking-lots/*/photos', 'GET /app/parking-lots/*/photos', 'PATCH /app/parking-lots/*/photos/*', 'DELETE /app/parking-lots/*/photos/*', 'GET /app/map-preferences', 'PATCH /app/map-preferences'],
  APP_STREET_PARKING: ['GET /app/parking-lots/map-data', 'GET /app/parking-lots/*', 'PATCH /app/parking-lots/*', 'GET /app/surveyor-zones', 'GET /app/surveyor-regions', 'GET /app/surveyor-zone-boundaries', 'POST /app/location-tracking', 'POST /app/parking-lots/*/photos', 'GET /app/parking-lots/*/photos', 'PATCH /app/parking-lots/*/photos/*', 'DELETE /app/parking-lots/*/photos/*', 'GET /app/map-preferences', 'PATCH /app/map-preferences'],
  APP_ON_STREET_PARKING: ['GET /app/parking-lots/map-data', 'GET /app/parking-lots/*', 'PATCH /app/parking-lots/*', 'GET /app/surveyor-zones', 'GET /app/surveyor-regions', 'GET /app/surveyor-zone-boundaries', 'POST /app/location-tracking', 'POST /app/parking-lots/*/photos', 'GET /app/parking-lots/*/photos', 'PATCH /app/parking-lots/*/photos/*', 'DELETE /app/parking-lots/*/photos/*', 'GET /app/map-preferences', 'PATCH /app/map-preferences'],
  APP_MESSAGES: ['GET /app/messages', 'GET /app/messages/*', 'PATCH /app/messages/*'],
  APP_CHAT: ['GET /app/chat/conversations', 'GET /app/chat/messages/*', 'POST /app/chat/messages/*', 'PATCH /app/chat/messages/*'],

  // Back Office Chat (global)
  BO_CHAT: [
    'GET /chat/conversations',
    'GET /chat/messages/*',
    'POST /chat/messages/*',
    'PATCH /chat/messages/*',
    'GET /chat/unread-count',
  ],
  APP_SURVEY_ZONE_MANAGEMENT: ['GET /app/parking-lots/survey-list', 'PATCH /app/parking-lots/*'],
  APP_CONTROL_BOARD: ['GET /app/survey-progress'],
  APP_REGION_INVITES: [
    'GET /app/region-invites',
    'POST /app/region-invites/*/accept',
    'POST /app/region-invites/*/reject',
    'POST /app/region-invites/by-code/*/accept',
  ],

  // Survey Area Management
  SURVEY_AREA_MANAGEMENT: [
    'GET /survey-areas',
    'GET /survey-areas/*',
    'POST /survey-areas/*/assignees',
    'DELETE /survey-areas/*/assignees/*',
    'GET /surveyors',
    'GET /survey-area-maps/features',
    'GET /data-reset/survey-periods',
  ],

  // System Management
  AREA_ADMINISTRATORS: [
    'GET /area-administrators',
    'GET /area-administrators/*',
    'POST /area-administrators',
    'POST /area-administrators/*',
    'PATCH /area-administrators/*',
    'DELETE /area-administrators/*',
    'GET /data-reset/survey-periods',
  ],
  SURVEYORS: [
    'GET /surveyors',
    'PATCH /surveyors/*',
    'DELETE /surveyors/*',
    'POST /surveyors/message',
    'GET /surveyors/pending-users',
    'POST /surveyors/pending-users/*',
    'GET /surveyors/available-zones',
    'GET /surveyors/*/zones',
    'PUT /surveyors/*/zones',
    'POST /surveyors/*/zones/quick-add',
    'POST /surveyors/*/zones/quick-remove',
    'GET /survey-areas',
    'GET /invites',
    'POST /invites',
    'POST /invites/*/resend',
    'DELETE /invites/*',
    'GET /data-reset/survey-periods',
  ],
  PARKING_FEE_SETTINGS: [
    'GET /parking-fees',
    'GET /parking-fees/*',
    'POST /parking-fees',
    'PATCH /parking-fees/*',
    'GET /data-reset/survey-periods',
  ],
  SYSTEM_LOGS: [
    'GET /audit-logs',
    'GET /audit-logs/*',
    'GET /data-reset/survey-periods',
  ],
  MESSAGE_HISTORY: [
    'GET /messages/history',
    'GET /messages/history/*',
    'GET /data-reset/survey-periods',
  ],

  // Survey Progress
  SURVEY_PROGRESS: [
    'GET /surveyors/available-zones',
    'GET /survey-areas/progress',
    'GET /survey-areas/progress/detail',
    'GET /data-reset/survey-periods',
  ],

  // Parking Analysis
  PARKING_ANALYSIS_MAP: [
    'GET /survey-area-maps/features',
    'GET /vehicle-registrations/region-stats',
    'GET /vehicle-registrations/map-data',
    'GET /parking-lots/map-data',
    'GET /parking-lots/on-street-polygons',
    'GET /parking-lots/*',
    'PATCH /parking-lots/*',
    'GET /parking-lots/*/photos',
    'POST /parking-lots/*/photos',
    'PATCH /parking-lots/*/photos/*',
    'DELETE /parking-lots/*/photos/*',
    'GET /surveyors/available-zones',
    'GET /surveyors',
    'GET /location-tracking/surveyors',
    'POST /surveyors/message',
    'GET /chat/conversations',
    'GET /chat/messages/*',
    'POST /chat/messages/*',
    'PATCH /chat/messages/*',
    'GET /chat/unread-count',
    'GET /data-reset/survey-periods',
    'GET /survey-areas',
  ],

  // Analysis Data list (실태분석 자료) — list/edit/delete parking lot rows
  ANALYSIS_DATA_LIST: [
    'GET /parking-lots/analysis-data',
    'GET /parking-lots/analysis-data/download',
    'GET /parking-lots/*',
    'PATCH /parking-lots/*',
    'DELETE /parking-lots/*',
    'POST /parking-lots/bulk-delete',
    'GET /parking-lots/*/photos',
    'POST /parking-lots/*/photos',
    'PATCH /parking-lots/*/photos/*',
    'DELETE /parking-lots/*/photos/*',
    'GET /data-reset/survey-periods',
  ],

  // Report Output (보고서 출력)
  REPORT_OUTPUT: [
    'GET /reports/parking-analysis',
    'GET /reports/parking-analysis/batch',
    'GET /reports/survey-areas',
    'GET /survey-areas',
    'GET /survey-area-maps/features',
    'GET /parking-lots/map-data',
    'GET /data-reset/survey-periods',
  ],

  // Data Upload - Vehicle Registration
  DATA_UPLOAD_VEHICLE: [
    'POST /vehicle-registrations/upload',
    'GET /vehicle-registrations/uploads',
    'GET /vehicle-registrations/uploads/*',
    'DELETE /vehicle-registrations/uploads/*',
    'POST /vehicle-registrations/uploads/*',
    'POST /data-reset/vehicle-registrations',
    'POST /data-reset/all',
    'GET /data-reset/jobs/*',
    'GET /data-reset/survey-periods',
  ],

  // Data Upload - Parking DB
  DATA_UPLOAD_PARKING_DB: [
    'POST /parking-lots/upload',
    'GET /parking-lots/uploads',
    'GET /parking-lots/uploads/*',
    'DELETE /parking-lots/uploads/*',
    'POST /parking-lots/uploads/*',
    'GET /parking-lots/template',
    'POST /data-reset/parking-lots',
    'POST /data-reset/all',
    'GET /data-reset/jobs/*',
    'GET /data-reset/survey-periods',
  ],

  // Data Upload - Survey Area Map
  DATA_UPLOAD_SURVEY_MAP: [
    'POST /survey-area-maps/upload',
    'GET /survey-area-maps/check-duplicate',
    'GET /survey-area-maps/uploads',
    'GET /survey-area-maps/uploads/*',
    'PATCH /survey-area-maps/uploads/*',
    'DELETE /survey-area-maps/uploads/*',
    'POST /survey-area-maps/uploads/*',
    'POST /data-reset/survey-area-maps',
    'POST /data-reset/all',
    'GET /data-reset/jobs/*',
    'GET /data-reset/survey-periods',
  ],
};

/**
 * Kiểm tra xem screen có quyền gọi endpoint không
 */
export function isEndpointAllowedForScreen(
  screenId: ScreenId,
  method: string,
  path: string,
): boolean {
  const allowedEndpoints = SCREEN_ENDPOINT_REGISTRY[screenId];
  if (!allowedEndpoints) return false;

  const endpoint = `${method.toUpperCase()} ${path}`;
  return allowedEndpoints.some(allowed => {
    // Support wildcard matching if needed
    if (allowed.includes('*')) {
      const regex = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
      return regex.test(endpoint);
    }
    return allowed === endpoint;
  });
}
