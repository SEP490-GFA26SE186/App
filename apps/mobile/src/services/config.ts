// apps/mobile/src/services/config.ts
//
// Địa chỉ API đọc từ biến môi trường công khai EXPO_PUBLIC_API_URL (không phải bí mật).
// Expo thay giá trị lúc bundle nên PHẢI viết nguyên văn `process.env.EXPO_PUBLIC_API_URL`.
// Chấp nhận có hoặc không có hậu tố /api/v1 (BE mount tại /api/v1); luôn chuẩn hóa về một dạng.
// Thiếu/sai cấu hình → null: nơi gọi báo lỗi rõ ràng, KHÔNG rơi về URL mặc định hay mock.

const API_PREFIX = '/api/v1';

declare const process: { env: { EXPO_PUBLIC_API_URL?: string } };

export const normalizeApiBaseUrl = (value: string | undefined | null): string | null => {
  const trimmed = (value ?? '').trim().replace(/\/+$/, '');
  if (!/^https?:\/\/[^\s/]+/i.test(trimmed)) return null;
  return trimmed.endsWith(API_PREFIX) ? trimmed : `${trimmed}${API_PREFIX}`;
};

const ENV_API_URL = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);

// Chỉ dùng khi __DEV__ (nhập địa chỉ máy chủ LAN lúc chạy thử trên thiết bị thật).
let devOverrideUrl: string | null = null;

/** Base URL đã chuẩn hóa (kết thúc bằng /api/v1) hoặc null nếu chưa cấu hình. */
export const getApiBaseUrl = (): string | null => (__DEV__ && devOverrideUrl) || ENV_API_URL;

export const isApiConfigured = (): boolean => getApiBaseUrl() !== null;

/** Đặt/xóa địa chỉ tạm thời (chỉ __DEV__). Trả về false nếu địa chỉ không hợp lệ hoặc không phải __DEV__. */
export const setDevApiBaseUrl = (value: string | null): boolean => {
  if (!__DEV__) return false;
  if (value === null || value.trim() === '') {
    devOverrideUrl = null;
    return true;
  }
  const normalized = normalizeApiBaseUrl(value);
  if (!normalized) return false;
  devOverrideUrl = normalized;
  return true;
};

export const API_NOT_CONFIGURED_MESSAGE =
  'Chưa cấu hình địa chỉ máy chủ. Hãy đặt EXPO_PUBLIC_API_URL (xem docs/mobile/ENVIRONMENT.md) rồi khởi động lại.';
