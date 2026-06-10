/**
 * Centralized query key factory.
 *
 * Convention: [domain, entity, ...params]
 * - Top-level arrays enable broad invalidation (e.g. queryKeys.survey.all)
 * - Factory functions enable targeted invalidation (e.g. queryKeys.survey.stats(userId))
 */
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    session: () => ["auth", "session"] as const,
    devices: () => ["auth", "devices"] as const,
  },

  user: {
    all: ["user"] as const,
    profile: (userId: string) => ["user", "profile", userId] as const,
  },

  survey: {
    all: ["survey"] as const,
    stats: (userId: string) => ["survey", "stats", userId] as const,
    markers: (type: string) => ["survey", "markers", type] as const,
    detail: (surveyId: string) => ["survey", "detail", surveyId] as const,
  },

  messages: {
    all: ["messages"] as const,
    list: (filter: string) => ["messages", "list", filter] as const,
    detail: (messageId: string) => ["messages", "detail", messageId] as const,
    unreadCount: () => ["messages", "unread-count"] as const,
  },

  chat: {
    all: ["chat"] as const,
    messages: (adminId: string) => ["chat", "messages", adminId] as const,
  },

  parking: {
    all: ["parking"] as const,
    private: (filters?: Record<string, unknown>) => ["parking", "private", filters] as const,
    street: (filters?: Record<string, unknown>) => ["parking", "street", filters] as const,
    onStreet: (filters?: Record<string, unknown>) => ["parking", "on-street", filters] as const,
  },

  mapPreferences: {
    all: ["map-preferences"] as const,
    self: () => ["map-preferences", "self"] as const,
  },
} as const;
