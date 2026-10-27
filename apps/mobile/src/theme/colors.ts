// apps/mobile/src/theme/colors.ts — Warm Storybook Guardian (R1, docs/mobile/UI_UX_REDESIGN_PLAN.md §4 A)
// Cùng bảng màu với Web (Web/src/index.css) và mascot cú: cam + xanh ngọc + nền kem + chữ navy.
// Quy tắc tương phản (WCAG 2.1 AA, đã đo): chữ trên nền `brand` dùng `onBrand` (navy, 5.6:1), KHÔNG dùng chữ trắng
// (2.6:1). Chữ/viền màu cam trên nền sáng dùng `brandStrong` (5.2:1). Nền teal có chữ trắng dùng `tealStrong` (5.2:1).

// Màu gốc — chỉ dùng trong file này; component dùng token ngữ nghĩa bên dưới.
const Palette = {
  orange500: '#FF7A00', // cam thương hiệu (Web --color-primary)
  orange700: '#C2410C',
  orange800: '#994700', // Web --color-primary-dark
  orangeInk: '#4A2400', // chữ nâu đậm trên nền cam/kem cam
  orange50: '#FFF3E6', // Web --color-primary-tint
  teal500: '#00A896', // xanh ngọc thương hiệu (Web --color-secondary)
  teal700: '#007A6E',
  teal800: '#006B5F', // Web --color-secondary-dark
  teal50: '#E6F7F5', // Web --color-secondary-tint
  gold400: '#F5B83D', // mũ sao của cú — chỉ trang trí, không làm nền chữ trắng
  gold50: '#FFF8E6',
  navy900: '#1E293B', // Web --color-navy
  navy600: '#545F73', // Web --color-navy-soft
  navy50: '#E8EDF7',
  cream: '#FFFDF9', // Web --color-canvas
  creamWarm: '#FDF8F0', // Web --color-surface
  sand100: '#F7F1E8',
  sand200: '#EADFD0',
  sand500: '#A38B73', // viền ô nhập (≥ 3:1 với nền)
  white: '#FFFFFF',
  red700: '#BA1A1A', // Web --color-danger
  red50: '#FFDAD6',
  blue600: '#2563EB',
  blue700: '#1D4ED8',
  lavender: '#C8A8E9',
  lavender50: '#F3EDFB',
  pink: '#FFB3C6',
  pink50: '#FFF0F5',
  gray500: '#6B7280',
};

export const Colors = {
  // === Thương hiệu ===
  brand: Palette.orange500, // nền nút chính, điểm nhấn; chữ trên nền này: onBrand
  brandStrong: Palette.orange700, // chữ/link/viền màu cam trên nền sáng, nền nút cam có chữ trắng
  brandDeep: Palette.orange800,
  brandInk: Palette.orangeInk, // chữ trên brand hoặc brandTint khi muốn sắc ấm thay vì navy
  brandTint: Palette.orange50,
  tealBright: Palette.teal500, // trang trí, thanh tiến độ, icon — không đặt chữ trắng lên
  tealStrong: Palette.teal700, // nền nút teal chữ trắng, chữ teal trên nền sáng
  tealDeep: Palette.teal800,
  tealTint: Palette.teal50,
  gold: Palette.gold400,
  goldTint: Palette.gold50,

  // === Bề mặt ===
  canvas: Palette.cream, // nền màn hình
  surface: Palette.white, // thẻ
  surfaceWarm: Palette.creamWarm, // thẻ phụ, Reader nền giấy
  surfaceMuted: Palette.sand100, // nút phụ dạng nền, vùng tách nhóm
  outline: Palette.sand200, // viền thẻ, đường kẻ
  outlineStrong: Palette.sand500, // viền ô nhập, thành phần cần nhìn thấy ranh giới
  overlay: 'rgba(30, 41, 59, 0.45)', // nền mờ sau sheet/modal

  // === Chữ ===
  text: Palette.navy900, // 14.4:1 trên canvas
  textMuted: Palette.navy600, // 6.3:1 trên canvas
  textPlaceholder: Palette.gray500, // 4.8:1
  onBrand: Palette.navy900,
  onStrong: Palette.white, // chữ trên brandStrong / tealStrong / danger / info

  // === Trạng thái ===
  success: Palette.teal700,
  successTint: Palette.teal50,
  successText: Palette.teal800,
  warning: Palette.orange800,
  warningTint: Palette.orange50,
  danger: Palette.red700,
  dangerTint: Palette.red50,
  info: Palette.blue600,
  infoText: Palette.blue700,
  infoTint: Palette.navy50,
  focus: Palette.orange700, // viền focus của ô nhập/nút (>= 3:1 với nền sáng; cam 500 chỉ 2.6:1)

  // === Alias cũ (Fairy Garden v2) ===
  // Giữ tên để các màn chưa redesign không vỡ; trỏ sang sắc độ mới đã kiểm tra tương phản theo cách màn đang dùng.
  // Màn nào được redesign (R3+) thì chuyển sang token ngữ nghĩa ở trên.
  primary: Palette.orange500, // màn dùng làm nền với chữ textOnYellow → navy
  primaryDark: Palette.orange700,
  primaryLight: Palette.orange50,
  primaryText: Palette.orangeInk, // chữ trên nền primary (5.2:1) hoặc primaryLight (12:1)
  secondary: Palette.teal700, // màn dùng làm nền nút chữ trắng → 5.2:1
  secondaryDark: Palette.teal800,
  secondaryLight: Palette.teal50,
  accent: Palette.blue600, // nền chữ trắng 5.2:1
  accentDark: Palette.blue700,
  accentLight: Palette.navy50,
  peach: Palette.gold400,
  peachLight: Palette.orange50,
  lavender: Palette.lavender,
  lavenderLight: Palette.lavender50,
  mint: Palette.teal700, // HeyButton variant "teal": nền chữ trắng
  mintLight: Palette.teal50,
  background: Palette.cream,
  textPrimary: Palette.navy900,
  textSecondary: Palette.navy600,
  textOnYellow: Palette.navy900,
  textOnGreen: Palette.teal800,
  error: Palette.red700,
  borderLight: 'rgba(30, 41, 59, 0.06)',
  borderMedium: 'rgba(30, 41, 59, 0.14)',
  borderSunshine: 'rgba(255, 122, 0, 0.30)',
  borderSky: 'rgba(37, 99, 235, 0.25)',
  green: Palette.teal700,
  greenLight: Palette.teal50,
  teal: Palette.teal700, // màn dùng làm chữ (link) và nền chữ trắng → bản đậm
  tealLight: Palette.teal50,
  yellow: Palette.gold400,
  yellowLight: Palette.gold50,
  pink: Palette.pink,
  pinkLight: Palette.pink50,
  textDark: Palette.navy900,
  border: Palette.sand200,
  borderColor: Palette.sand200,
  cardBg: Palette.white,
  kidCardBg: Palette.creamWarm,
};
