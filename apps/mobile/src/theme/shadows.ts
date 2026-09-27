// apps/mobile/src/theme/shadows.ts — Fairy Glow Shadows
// Quy tắc: KHÔNG BAO GIỜ dùng shadow đen thô kệch
// Mọi shadow đều có màu tương ứng với nội dung element và dùng modern boxShadow
import { ViewStyle } from 'react-native';

export const Shadows: Record<string, any> = {
  // Card thông thường — shadow xanh lá nhẹ
  card: {
    boxShadow: '0 6px 16px rgba(107, 203, 119, 0.12)',
  },

  // Story card — shadow vàng ấm
  storyCard: {
    boxShadow: '0 8px 20px rgba(255, 217, 61, 0.20)',
  },

  // Floating CTA button
  ctaButton: {
    boxShadow: '0 6px 14px rgba(245, 196, 0, 0.38)',
  },

  // Floating pill tab bar
  tabBar: {
    boxShadow: '0 -4px 20px rgba(184, 196, 216, 0.25)',
  },

  // Mascot / Hero element
  hero: {
    boxShadow: '0 10px 24px rgba(255, 217, 61, 0.25)',
  },

  // Modal / Overlay card
  modal: {
    boxShadow: '0 12px 28px rgba(107, 203, 119, 0.20)',
  },

  // Small badge / chip
  badge: {
    boxShadow: '0 2px 6px rgba(255, 217, 61, 0.22)',
  },

  // Header bar
  header: {
    boxShadow: '0 4px 12px rgba(107, 203, 119, 0.12)',
  },

  // Sky accent elements
  sky: {
    boxShadow: '0 6px 16px rgba(77, 171, 247, 0.18)',
  },
};
