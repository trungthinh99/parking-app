/**
 * Application route paths for navigation
 * Use these constants instead of hardcoded strings
 */

export const PATHS = {
  // Auth routes
  AUTH: {
    LOGIN: "/(auth)/login",
    SIGNUP: "/(auth)/signup",
    FIND_PASSWORD: "/(auth)/find-password",
    FIND_PASSWORD_SUCCESS: "/(auth)/find-password-success",
    FIND_ERROR: "/(auth)/find-error",
    RECEIVE_INVITE: "/(auth)/receive-invite",
    INVITE: "/(auth)/invite",
  },

  // Main app routes
  TABS: {
    HOME: "/(tabs)",
    CONTROL_BOARD: "/(tabs)/control-board",
    PRIVATE_PARKING: "/(tabs)/private-parking",
    STREET_PARKING: "/(tabs)/street-parking",
    ON_STREET_PARKING: "/(tabs)/on-street-parking",
    SETTINGS: "/(tabs)/settings",
    PROFILE: "/(tabs)/settings/profile",
    EDIT_PROFILE: "/(tabs)/settings/edit-profile",
    SECURITY_SETTINGS: "/(tabs)/settings/security-settings",
    MESSAGES: "/messages",
    MESSAGE_DETAIL: "/messages/[id]",
    ON_STREET_SURVEY_ZONE: "/on-street-survey-zone",
    OFF_STREET_SURVEY_ZONE: "/off-street-survey-zone",
    PRIVATE_SURVEY_ZONE: "/private-survey-zone",
  },

  // Modal routes
  MODAL: "/modal",
} as const;

// Type for all path values
export type AppPath =
  | (typeof PATHS.AUTH)[keyof typeof PATHS.AUTH]
  | (typeof PATHS.TABS)[keyof typeof PATHS.TABS]
  | typeof PATHS.MODAL;
