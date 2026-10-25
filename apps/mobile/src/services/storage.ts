// apps/mobile/src/services/storage.ts
// Cross-platform safe storage (Expo Web localStorage + in-memory fallback for Native)

const memoryStore: Record<string, string> = {};

const isWebWithStorage = (): boolean => {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
};

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (isWebWithStorage()) {
        return window.localStorage.getItem(key);
      }
    } catch {}
    return memoryStore[key] ?? null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (isWebWithStorage()) {
        window.localStorage.setItem(key, value);
      }
    } catch {}
    memoryStore[key] = value;
  },

  removeItem: (key: string): void => {
    try {
      if (isWebWithStorage()) {
        window.localStorage.removeItem(key);
      }
    } catch {}
    delete memoryStore[key];
  },

  clear: (): void => {
    try {
      if (isWebWithStorage()) {
        window.localStorage.clear();
      }
    } catch {}
    Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'sw_mobile_access_token',
  REFRESH_TOKEN: 'sw_mobile_refresh_token',
  USER_DATA: 'sw_mobile_user_data',
  KID_SESSION_TOKEN: 'sw_mobile_kid_session_token',
  CURRENT_CHILD_ID: 'sw_mobile_current_child_id',
  API_ENV: 'sw_mobile_api_env',
};
