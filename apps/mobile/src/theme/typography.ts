// apps/mobile/src/theme/typography.ts — Thang chữ (R1, UI_UX_REDESIGN_PLAN §4 A)
// Font giống Web: Comfortaa (tiêu đề) + Nunito Sans (nội dung). File .ttf tĩnh (SIL OFL 1.1, xem
// src/assets/fonts/OFL-*.txt), nạp bằng expo-font có sẵn trong App.tsx; đã kiểm tra đủ glyph tiếng Việt.
//
// QUAN TRỌNG: độ đậm chọn bằng fontFamily (mỗi độ đậm một file), KHÔNG đặt fontWeight cùng font tùy biến.
// Android (RN 0.76) gặp fontWeight >= 700 trên font nạp qua expo-font sẽ rơi về font hệ thống;
// Web sẽ tự "làm đậm giả". Mọi style ở đây đặt fontWeight: 'normal' để ghi đè fontWeight cũ khi gộp style.
import { TextStyle } from 'react-native';

export const FontFamily = {
  displaySemiBold: 'Comfortaa-SemiBold',
  displayBold: 'Comfortaa-Bold',
  regular: 'NunitoSans-Regular',
  semiBold: 'NunitoSans-SemiBold',
  bold: 'NunitoSans-Bold',
  extraBold: 'NunitoSans-ExtraBold',
} as const;

/** Bảng nạp cho useFonts (App.tsx). Tên khóa = fontFamily dùng trong style. */
export const FONT_ASSETS = {
  [FontFamily.displaySemiBold]: require('../assets/fonts/Comfortaa_600SemiBold.ttf'),
  [FontFamily.displayBold]: require('../assets/fonts/Comfortaa_700Bold.ttf'),
  [FontFamily.regular]: require('../assets/fonts/NunitoSans_400Regular.ttf'),
  [FontFamily.semiBold]: require('../assets/fonts/NunitoSans_600SemiBold.ttf'),
  [FontFamily.bold]: require('../assets/fonts/NunitoSans_700Bold.ttf'),
  [FontFamily.extraBold]: require('../assets/fonts/NunitoSans_800ExtraBold.ttf'),
};

const face = (fontFamily: string, fontSize: number, lineHeight: number): TextStyle => ({
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight: 'normal',
});

/**
 * Thang chữ. Parent: chữ thân >= 15, tối thiểu 12 (caption). Kid: chữ >= 18, đọc truyện 20.
 * Comfortaa nét mảnh ở cỡ nhỏ → chỉ dùng cho cỡ >= 17.
 */
export const Typography = {
  // Parent Mode
  display: face(FontFamily.displayBold, 28, 36),
  title: face(FontFamily.displayBold, 22, 30),
  heading: face(FontFamily.extraBold, 17, 24),
  body: face(FontFamily.regular, 15, 22),
  bodyStrong: face(FontFamily.bold, 15, 22),
  label: face(FontFamily.semiBold, 14, 20),
  caption: face(FontFamily.semiBold, 12, 17),
  button: face(FontFamily.extraBold, 15, 20),
  buttonSmall: face(FontFamily.extraBold, 13, 18),
  buttonLarge: face(FontFamily.extraBold, 17, 22),
  // Kid Mode
  kidTitle: face(FontFamily.displayBold, 24, 32),
  kidHeading: face(FontFamily.extraBold, 20, 28),
  kidBody: face(FontFamily.bold, 18, 28),
  kidButton: face(FontFamily.extraBold, 18, 24),
  // Reader (nền giấy)
  reader: face(FontFamily.regular, 20, 32),
} satisfies Record<string, TextStyle>;
