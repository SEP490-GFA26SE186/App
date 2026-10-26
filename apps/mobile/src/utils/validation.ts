// apps/mobile/src/utils/validation.ts
// Quy tắc kiểm tra khớp Web (Web/src/services/authService.js) và BE (auth.validation.js, children.validation.js).

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,50}$/;
export const MIN_REGISTER_PASSWORD = 8;

/** BE cho đăng nhập bằng email hoặc username */
export const isValidIdentity = (value: string): boolean => EMAIL_REGEX.test(value) || USERNAME_REGEX.test(value);

/** Ngày sinh YYYY-MM-DD (BE) – hợp lệ, có thật, không ở tương lai. Trả thông báo lỗi hoặc null. */
export const validateBirthDate = (value: string): string | null => {
  const v = value.trim();
  if (!v) return 'Ba mẹ nhập ngày sinh của bé nhé';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'Ngày sinh cần đúng dạng YYYY-MM-DD (ví dụ 2020-05-01)';
  const [y, m, d] = v.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return 'Ngày sinh không tồn tại';
  if (date.getTime() > Date.now()) return 'Ngày sinh không thể ở tương lai';
  return null;
};

export const CHILD_NAME_MAX = 100;
export const CHARACTER_NAME_MAX = 100;
export const APPEARANCE_MIN = 3;
export const APPEARANCE_MAX = 1000;
