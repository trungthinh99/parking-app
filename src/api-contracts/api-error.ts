/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/api-error.ts
 * Generated at: 2026-06-08T06:02:53.087Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * API Error Contract - Định nghĩa cấu trúc lỗi chuẩn
 * Frontend sẽ sử dụng interface này để xử lý lỗi
 */
export interface ApiError {
  /** HTTP status code */
  status: number;

  /** Error code cho việc phân loại lỗi */
  code?: string;

  /** Thông báo lỗi (tiếng Hàn) */
  message: string;

  /** Field-level errors cho form validation */
  fieldErrors?: Record<string, string>;

  /** Timestamp của lỗi */
  timestamp?: string;

  /** Request path gây ra lỗi */
  path?: string;
}

/**
 * Error Codes - Mã lỗi chuẩn hóa
 */
export const ERROR_CODES = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',

  // Authentication errors (401)
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Authorization errors (403)
  SCREEN_ID_REQUIRED: 'SCREEN_ID_REQUIRED',
  SCREEN_NOT_ALLOWED: 'SCREEN_NOT_ALLOWED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  ZONE_NOT_ALLOWED: 'ZONE_NOT_ALLOWED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  ACCOUNT_DELETED: 'ACCOUNT_DELETED',
  ACCOUNT_PENDING_APPROVAL: 'ACCOUNT_PENDING_APPROVAL',
  ACCOUNT_REJECTED: 'ACCOUNT_REJECTED',

  // Not found errors (404)
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // Conflict errors (409)
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Rate limit errors (429)
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  OTP_RATE_LIMITED: 'OTP_RATE_LIMITED',

  // OTP errors
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_INVALID: 'OTP_INVALID',
  OTP_MAX_ATTEMPTS: 'OTP_MAX_ATTEMPTS',

  // Area Administrator errors
  ADMIN_NOT_FOUND: 'ADMIN_NOT_FOUND',
  ADMIN_ID_ALREADY_EXISTS: 'ADMIN_ID_ALREADY_EXISTS',
  ADMIN_EMAIL_ALREADY_EXISTS: 'ADMIN_EMAIL_ALREADY_EXISTS',
  ADMIN_PHONE_ALREADY_EXISTS: 'ADMIN_PHONE_ALREADY_EXISTS',
  ADMIN_CANNOT_DELETE_ACTIVE: 'ADMIN_CANNOT_DELETE_ACTIVE',
  ADMIN_ALREADY_APPROVED: 'ADMIN_ALREADY_APPROVED',
  ADMIN_ALREADY_REJECTED: 'ADMIN_ALREADY_REJECTED',
  ADMIN_REGION_ALREADY_ASSIGNED: 'ADMIN_REGION_ALREADY_ASSIGNED',
  ADMIN_REGION_NOT_IN_TENANT: 'ADMIN_REGION_NOT_IN_TENANT',
  MESSAGE_SEND_FAILED: 'MESSAGE_SEND_FAILED',

  // Parking Fee errors
  PARKING_FEE_NOT_FOUND: 'PARKING_FEE_NOT_FOUND',
  PARKING_FEE_DUPLICATE: 'PARKING_FEE_DUPLICATE',
  PARKING_FEE_CANNOT_DELETE_ACTIVE: 'PARKING_FEE_CANNOT_DELETE_ACTIVE',

  // App User (Surveyor) errors
  APP_USER_NOT_FOUND: 'APP_USER_NOT_FOUND',
  APP_USER_ALREADY_APPROVED: 'APP_USER_ALREADY_APPROVED',
  APP_USER_ALREADY_REJECTED: 'APP_USER_ALREADY_REJECTED',
  SURVEYOR_CANNOT_DELETE_ACTIVE: 'SURVEYOR_CANNOT_DELETE_ACTIVE',
  SURVEYOR_ZONE_OUT_OF_REGION: 'SURVEYOR_ZONE_OUT_OF_REGION',
  SURVEYOR_ZONE_HAS_SURVEY: 'SURVEYOR_ZONE_HAS_SURVEY',

  // Change Password errors
  CURRENT_PASSWORD_INCORRECT: 'CURRENT_PASSWORD_INCORRECT',

  // Parking Lot Upload errors
  PARKING_LOT_NOT_FOUND: 'PARKING_LOT_NOT_FOUND',
  PARKING_LOT_UPLOAD_NOT_FOUND: 'PARKING_LOT_UPLOAD_NOT_FOUND',
  PARKING_LOT_UPLOAD_INVALID_FILE: 'PARKING_LOT_UPLOAD_INVALID_FILE',
  PARKING_LOT_UPLOAD_INVALID_HEADER: 'PARKING_LOT_UPLOAD_INVALID_HEADER',
  PARKING_LOT_UPLOAD_EMPTY: 'PARKING_LOT_UPLOAD_EMPTY',
  PARKING_LOT_UPLOAD_IN_PROGRESS: 'PARKING_LOT_UPLOAD_IN_PROGRESS',
  PARKING_LOT_UPLOAD_REGION_MISMATCH: 'PARKING_LOT_UPLOAD_REGION_MISMATCH',

  // Vehicle Registration errors
  VEHICLE_UPLOAD_NOT_FOUND: 'VEHICLE_UPLOAD_NOT_FOUND',
  VEHICLE_UPLOAD_INVALID_FILE: 'VEHICLE_UPLOAD_INVALID_FILE',
  VEHICLE_UPLOAD_INVALID_HEADER: 'VEHICLE_UPLOAD_INVALID_HEADER',
  VEHICLE_UPLOAD_EMPTY: 'VEHICLE_UPLOAD_EMPTY',
  VEHICLE_UPLOAD_IN_PROGRESS: 'VEHICLE_UPLOAD_IN_PROGRESS',
  VEHICLE_UPLOAD_REGION_MISMATCH: 'VEHICLE_UPLOAD_REGION_MISMATCH',
  GEOCODE_SERVICE_ERROR: 'GEOCODE_SERVICE_ERROR',

  // Parking Lot address edit errors
  ADDRESS_REGION_NOT_ALLOWED: 'ADDRESS_REGION_NOT_ALLOWED',
  ADDRESS_OUTSIDE_ZONE: 'ADDRESS_OUTSIDE_ZONE',
  DUPLICATE_PARKING_LOT_ADDRESS: 'DUPLICATE_PARKING_LOT_ADDRESS',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Response Codes - Mã phản hồi cho success/info responses (non-error)
 * Used alongside message for frontend debugging
 */
export const RESPONSE_CODES = {
  // Username check
  USERNAME_AVAILABLE: 'USERNAME_AVAILABLE',
  DUPLICATE_USERNAME: 'DUPLICATE_USERNAME',

  // Phone/OTP check
  DUPLICATE_PHONE: 'DUPLICATE_PHONE',
} as const;

export type ResponseCode = (typeof RESPONSE_CODES)[keyof typeof RESPONSE_CODES];

/**
 * Response Messages - Thông báo mặc định cho response codes (tiếng Hàn)
 */
export const RESPONSE_MESSAGES: Record<ResponseCode, string> = {
  USERNAME_AVAILABLE: '사용 가능한 아이디입니다.',
  DUPLICATE_USERNAME: '이미 사용 중인 아이디입니다.',
  DUPLICATE_PHONE: '이미 등록된 휴대폰 번호입니다.',
};

/**
 * Validation Messages - DTO validation messages (tiếng Hàn)
 * Used in class-validator decorators (@IsNotEmpty, @MinLength, etc.)
 */
export const VALIDATION_MESSAGES = {
  // Common field names
  USERNAME_REQUIRED: '사용자명은 필수입니다.',
  USERNAME_ENTER: '아이디를 입력하세요.',
  PASSWORD_ENTER: '비밀번호를 입력하세요.',
  PASSWORD_MIN_LENGTH: '비밀번호는 8자 이상이어야 합니다.',
  NAME_REQUIRED: '사용자명을 입력하세요.',
  PHONE_REQUIRED: '휴대폰 번호는 필수입니다.',
  PHONE_ENTER: '휴대폰 번호를 입력하세요.',
  EMAIL_INVALID: '올바른 이메일 주소를 입력하세요.',
  OTP_ENTER: '인증번호를 입력하세요.',
  REFRESH_TOKEN_REQUIRED: '리프레시 토큰은 필수입니다.',

  // Region fields
  REGION1_REQUIRED: '광역지역을 선택하세요.',
  REGION2_REQUIRED: '시/군/구를 선택하세요.',

  // OTP context
  OTP_CONTEXT_INVALID: 'context는 signup 또는 reset_password여야 합니다.',
  OTP_DESTINATION_REQUIRED: '수신 대상을 입력하세요.',

  // Area administrator fields
  ADMIN_NAME_REQUIRED: '관리자명을 입력하세요.',
  ADMIN_STATUS_INVALID: '활성 상태 값이 올바르지 않습니다.',

  // Message fields
  MESSAGE_RECIPIENTS_REQUIRED: '수신자를 최소 1명 선택하세요.',
  MESSAGE_TITLE_REQUIRED: '메시지 제목을 입력하세요.',
  MESSAGE_CONTENT_REQUIRED: '메시지 내용을 입력하세요.',

  // Parking fee fields
  PARKING_GRADE_REQUIRED: '주차장 급지를 선택하세요.',
  PARKING_TYPE_REQUIRED: '주차장 유형을 선택하세요.',
  FEE_TYPE_REQUIRED: '요금 종류를 선택하세요.',
  TIME_SLOTS_REQUIRED: '시간대를 1개 이상 등록하세요.',
  TIME_SLOT_TYPE_REQUIRED: '시간대 유형을 선택하세요.',
  TIME_SLOT_VALUE_REQUIRED: '시간대 값을 입력하세요.',
  FEE_STATUS_INVALID: '적용 상태 값이 올바르지 않습니다.',
  SURVEY_AREAS_REQUIRED: '조사구역을 최소 1개 이상 선택하세요.',

  // Vehicle registration fields
  VEHICLE_REGION_REQUIRED: '지역을 선택하세요.',
  VEHICLE_FILE_REQUIRED: '엑셀 파일을 업로드하세요.',
} as const;

/**
 * Error Messages - Thông báo lỗi mặc định (tiếng Hàn)
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: '입력 정보가 올바르지 않습니다.',
  INVALID_INPUT: '요청이 올바르지 않습니다. 다시 확인해주세요.',
  INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다.',
  INVALID_CREDENTIALS: '아이디 또는 비밀번호가 올바르지 않습니다.',
  TOKEN_EXPIRED: '세션이 만료되었습니다. 다시 로그인해주세요.',
  TOKEN_INVALID: '인증 정보가 유효하지 않습니다.',
  SCREEN_ID_REQUIRED: 'Screen ID가 필요합니다. x-screen-id 헤더를 포함해주세요.',
  SCREEN_NOT_ALLOWED: '해당 화면에서 이 요청을 수행할 수 없습니다.',
  ACCESS_DENIED: '접근 권한이 없습니다.',
  ZONE_NOT_ALLOWED: '해당 구역에서 작업할 수 없습니다.',
  ACCOUNT_DISABLED: '비활성화된 계정입니다.',
  ACCOUNT_DELETED: '삭제된 계정입니다. 관리자에게 문의해주세요.',
  ACCOUNT_PENDING_APPROVAL: '승인 대기 중인 계정입니다. 관리자 승인 후 이용 가능합니다.',
  ACCOUNT_REJECTED: '승인이 반려된 계정입니다. 관리자에게 문의해주세요.',
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  RESOURCE_NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  USER_ALREADY_EXISTS: '이미 존재하는 사용자입니다.',
  DUPLICATE_ENTRY: '이미 존재하는 데이터입니다.',
  TOO_MANY_REQUESTS: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  OTP_RATE_LIMITED: '인증번호 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  OTP_EXPIRED: '인증번호가 만료되었습니다. 다시 요청해주세요.',
  OTP_INVALID: '인증번호가 올바르지 않습니다.',
  OTP_MAX_ATTEMPTS: '인증 시도 횟수를 초과했습니다. 다시 요청해주세요.',
  ADMIN_NOT_FOUND: '관리자를 찾을 수 없습니다.',
  ADMIN_ID_ALREADY_EXISTS: '이미 사용 중인 관리자 ID입니다.',
  ADMIN_EMAIL_ALREADY_EXISTS: '이미 등록된 이메일 주소입니다.',
  ADMIN_PHONE_ALREADY_EXISTS: '이미 등록된 휴대폰 번호입니다.',
  ADMIN_CANNOT_DELETE_ACTIVE: '활성 상태의 관리자는 삭제할 수 없습니다. 먼저 비활성화하세요.',
  ADMIN_ALREADY_APPROVED: '이미 승인된 관리자입니다.',
  ADMIN_ALREADY_REJECTED: '이미 거부된 요청입니다.',
  ADMIN_REGION_ALREADY_ASSIGNED: '해당 관리 지역에 이미 승인된 관리자가 있습니다.',
  ADMIN_REGION_NOT_IN_TENANT: '테넌트의 담당 구·군이 아닙니다. 담당 구·군 중에서 선택해주세요.',
  MESSAGE_SEND_FAILED: '메시지 발송에 실패했습니다.',
  PARKING_FEE_NOT_FOUND: '요금 기준을 찾을 수 없습니다.',
  PARKING_FEE_DUPLICATE: '동일한 급지/유형/요금종류 조합이 이미 존재합니다.',
  PARKING_FEE_CANNOT_DELETE_ACTIVE: '활성 상태의 요금 기준은 삭제할 수 없습니다. 먼저 비활성화하세요.',
  APP_USER_NOT_FOUND: '앱 사용자를 찾을 수 없습니다.',
  APP_USER_ALREADY_APPROVED: '이미 승인된 사용자입니다.',
  APP_USER_ALREADY_REJECTED: '이미 거부된 요청입니다.',
  SURVEYOR_CANNOT_DELETE_ACTIVE: '활성 상태의 조사원은 삭제할 수 없습니다. 먼저 비활성화하세요.',
  SURVEYOR_ZONE_OUT_OF_REGION: '조사원에게 부여된 지역 내의 조사구역만 할당할 수 있습니다.',
  SURVEYOR_ZONE_HAS_SURVEY: '조사가 진행되었거나 주차장을 등록한 조사구역은 삭제할 수 없습니다.',
  CURRENT_PASSWORD_INCORRECT: '현재 비밀번호가 올바르지 않습니다.',
  PARKING_LOT_NOT_FOUND: '주차장을 찾을 수 없습니다.',
  PARKING_LOT_UPLOAD_NOT_FOUND: '주차장 업로드 기록을 찾을 수 없습니다.',
  PARKING_LOT_UPLOAD_INVALID_FILE: '유효하지 않은 파일 형식입니다. 엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.',
  PARKING_LOT_UPLOAD_INVALID_HEADER: '엑셀 파일의 시트 또는 헤더가 주차장 템플릿과 일치하지 않습니다.',
  PARKING_LOT_UPLOAD_EMPTY: '엑셀 파일에 주차장 데이터가 없습니다.',
  PARKING_LOT_UPLOAD_IN_PROGRESS: '현재 주차장 데이터 처리 중입니다. 완료 후 다시 시도해주세요.',
  PARKING_LOT_UPLOAD_REGION_MISMATCH: '담당 지역이 아닌 데이터는 업로드할 수 없습니다.',
  VEHICLE_UPLOAD_NOT_FOUND: '업로드 기록을 찾을 수 없습니다.',
  VEHICLE_UPLOAD_INVALID_FILE: '유효하지 않은 파일 형식입니다. 엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.',
  VEHICLE_UPLOAD_INVALID_HEADER: '엑셀 파일의 헤더가 템플릿과 일치하지 않습니다.',
  VEHICLE_UPLOAD_EMPTY: '엑셀 파일에 데이터가 없습니다.',
  VEHICLE_UPLOAD_IN_PROGRESS: '현재 지오코딩 처리 중입니다. 완료 후 다시 시도해주세요.',
  VEHICLE_UPLOAD_REGION_MISMATCH: '담당 지역이 아닌 데이터는 업로드할 수 없습니다.',
  GEOCODE_SERVICE_ERROR: '지오코딩 서비스에 오류가 발생했습니다.',
  ADDRESS_REGION_NOT_ALLOWED: '선택한 주소가 담당 구역이 아닙니다.',
  ADDRESS_OUTSIDE_ZONE: '선택한 주소가 조사구역에 포함되지 않습니다.',
  DUPLICATE_PARKING_LOT_ADDRESS: '동일한 주차장 유형에 같은 주소가 이미 존재합니다.',
  INTERNAL_ERROR: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
  SERVICE_UNAVAILABLE: '서비스를 일시적으로 사용할 수 없습니다.',
};
