// apps/mobile/src/theme/spacing.ts — Khoảng cách, bo góc, vùng chạm (R1, UI_UX_REDESIGN_PLAN §4 A)

export const Radius = {
  xs: 8, // Tags, badges nhỏ
  sm: 12, // Chips, thumbnail
  md: 14, // Input fields
  lg: 20, // Thẻ Parent
  xl: 24, // Sheet, thẻ lớn
  xxl: 28, // Thẻ Kid Mode, bìa truyện
  xxxl: 32, // Hero card, tab bar nổi
  full: 9999, // Pills, circles
};

// Lưới 4pt
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 24, // Giữa các khối nội dung
  page: 16, // Lề ngang màn hình
};

/** Kích thước vùng chạm tối thiểu (pt). Parent theo chuẩn 44pt; Kid lớn hơn cho ngón tay trẻ. */
export const Touch = {
  min: 44,
  kid: 56,
  kidLarge: 64,
};

/** hitSlop bù cho phần tử hiển thị nhỏ hơn vùng chạm tối thiểu: (44 - cao hiển thị) / 2 mỗi phía. */
export const hitSlopFor = (visualSize: number, target: number = Touch.min) => {
  const pad = Math.max(0, Math.ceil((target - visualSize) / 2));
  return { top: pad, bottom: pad, left: pad, right: pad };
};

export const Layout = {
  /** Bề rộng nội dung tối đa khi chạy Web/tablet (áp dụng dần từ R9). */
  maxContentWidth: 720,
};
