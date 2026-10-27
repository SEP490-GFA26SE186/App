# UI/UX Redesign — Tiến độ & backlog

Kế hoạch gốc: [UI_UX_REDESIGN_PLAN.md](UI_UX_REDESIGN_PLAN.md).

## Quyết định đã chốt (người dùng, 2026-10-26)

1. Phương án **A – Warm Storybook Guardian** làm nền; mượn **Reader nền giấy** (C) và **nút lớn "có đế" cho Kid Mode** (B).
2. Màu thương hiệu: cam `#FF7A00`, teal `#00A896`, nền kem, chữ navy; foreground/background chỉnh để đạt WCAG AA.
3. Font Comfortaa + Nunito Sans (SIL OFL 1.1), nạp bằng `expo-font` có sẵn, **không cài package mới**.
4. Mascot: giữ ảnh cú hiện tại, không tạo mascot khác. Asset tách nền: **chờ xử lý sau**.
5. Chuyển Credit khỏi tab bar sang Header Parent + Hồ sơ: làm ở **R3 (navigation)**, không làm trong R1.

---

## R1 – Design Tokens + component dùng chung — ĐẠT (QA 2026-10-27)

Kết quả QA, ảnh chụp và điều kiện nghiệm thu: [QA_R1_REPORT.md](QA_R1_REPORT.md).

- ✅ **R1 QA Fix (2026-10-27):** đã sửa HIGH-1 (khoảng trống 48.8dp đầu màn Android) và LOW-1 (comment đầu file) trong `components/ui/Screen.tsx`.
  - Android SW_Test: nội dung bắt đầu ở 128px thay vì 256px, sát dưới status bar.
  - Web: không đổi.
  - Chi tiết: QA_R1_REPORT §10.
- ✅ **HIGH-2 (2026-10-27):** đã kiểm tra các màn sau đăng nhập trên Web và Android bằng tài khoản test trên BE/PostgreSQL **local**.
  - Đạt: `HeyCard`, `HeyChip`, `Badge`, `StateView`, `ScreenHeader`, `Sheet`, font, điều hướng và đăng xuất.
  - Intro không phát lại khi đăng xuất hoặc chuyển tab.
  - Chi tiết: QA_R1_REPORT §11.
- ✅ **HIGH-3 (2026-10-27):** link "Đăng ký ngay" (`LoginScreen.tsx`, style `registerLink`) đổi sang `Colors.brandStrong`; tương phản từ 2.61:1 lên 5.18:1. Chỉ đổi màu.
- ✅ **CRIT-1 (có sẵn, KHÔNG do R1) — ĐÃ SỬA (2026-10-27):** khoá PIN thoát Kid Mode không hiện trên Android New Arch, vì Modal nằm cạnh header Reanimated bị kẹt kích thước 0×0.
  - Đã thay `Modal` bằng lớp phủ ngay trong cây component, thêm Back mở/đóng khoá, spinner khi chờ BE, thông báo lỗi mạng tiếng Việt, và dọn phiên cũ khi khởi động không có token Parent.
  - PIN chỉ được BE xác thực.
  - Restart luôn về màn Đăng nhập (không vượt PIN), nhưng **chưa khôi phục Kid Mode**: cần duyệt `expo-secure-store`.
  - Xem QA_R1_REPORT §12.
- ⛔ **BLOCKED:** BE local trả 503 khi sinh truyện AI, nên chưa kiểm tra được Reader và tủ sách có truyện thật.

### Đã làm

| File | Thay đổi |
|---|---|
| `src/theme/colors.ts` | Bảng màu mới (Palette nội bộ + token ngữ nghĩa `brand/brandStrong/brandInk/brandTint`, `tealBright/tealStrong/tealDeep/tealTint`, `canvas/surface/surfaceWarm/surfaceMuted`, `outline/outlineStrong`, `text/textMuted/textPlaceholder/onBrand/onStrong`, `success/warning/danger/info/focus`). **Giữ toàn bộ alias cũ** (`primary`, `secondary`, `teal`, `mint`, `accent`, `textOnYellow`…) nhưng trỏ sang sắc độ đã đo tương phản theo cách các màn đang dùng → màn chưa redesign không vỡ. |
| `src/theme/typography.ts` *(mới)* | `FontFamily`, `FONT_ASSETS`, thang chữ `Typography` (Parent / Kid / Reader). Độ đậm chọn bằng fontFamily, luôn `fontWeight: 'normal'` (tránh Android rơi về font hệ thống và Web làm đậm giả). |
| `src/theme/spacing.ts` | `Radius`, `Spacing` (lưới 4pt), **`Touch`** (44 / 56 / 64pt), `hitSlopFor()`, `Layout.maxContentWidth`. |
| `src/theme/shadows.ts` | **`Elevation`** (none/low/mid/high) theo nền tảng: Web `boxShadow`, Android `elevation`, iOS `shadow*`. Không phụ thuộc New Architecture. `Shadows` cũ thành alias. |
| `src/theme/index.ts` | Export thêm `Elevation`, `Touch`, `hitSlopFor`, `Layout`, `FontFamily`, `FONT_ASSETS`, `Typography`. |
| `src/assets/fonts/*` *(mới)* | Comfortaa 600/700, Nunito Sans 400/600/700/800 (.ttf tĩnh, sinh từ Google Fonts) + `OFL-Comfortaa.txt`, `OFL-NunitoSans.txt` (trùng nội dung `google/fonts/ofl/*/OFL.txt`). Đã kiểm tra cmap: đủ 200/200 ký tự tiếng Việt + `₫`. |
| `App.tsx` | `useFonts(FONT_ASSETS)`; giao diện chờ font tối đa 3s (sau đó dùng font hệ thống). `SessionProvider` vẫn mount ngay → bootstrap phiên, Intro, Preview, BackHandler không đổi. |
| `components/ui/HeyButton.tsx` | Giữ props/variant. Cam + chữ navy; teal/xanh đậm + chữ trắng; `minHeight` 36(sm, bù hitSlop→44)/48/52/60, kid ≥ 56 + đế `borderBottom`; `accessibilityRole/Label/State`; font theo Typography. |
| `components/ui/HeyInput.tsx` | Lỗi màu **đỏ** (trước: vàng); viền `outlineStrong` 2px (≥ 3:1), focus `brandStrong`; cao ≥ 48; chữ 16; nút hiện/ẩn mật khẩu 44pt; nhãn trợ năng; lỗi đọc bằng live region. |
| `components/ui/HeyCard.tsx` | Nền theo token, viền `outline` luôn có, chỉ thẻ trắng có `Elevation.low`. |
| `components/ui/HeyChip.tsx` | Cao 36 + hitSlop 44; trạng thái chọn: nền + viền + chữ `brandInk` (trước: chữ vàng trên nền vàng nhạt); `accessibilityState.selected`. |
| `components/ui/Badge.tsx` | Mọi tone ≥ 4.5:1, chữ 12 (trước 11). |
| `components/ui/StateView.tsx` | Typography; error có tiêu đề `danger`, `accessibilityRole="alert"`. |
| `components/ui/ScreenHeader.tsx` | Nút quay lại 44pt + nhãn "Quay lại"; tiêu đề Comfortaa, `accessibilityRole="header"`. |
| `components/ui/Screen.tsx` | Nền + thanh trạng thái `canvas`. **QA Fix:** bỏ `paddingTop: StatusBar.currentHeight` cộng trùng (HIGH-1), `StatusBar translucent={false}` tường minh, khôi phục comment đầu file (LOW-1). |
| `components/ui/Sheet.tsx` | Overlay/handle/bề mặt theo token, `Elevation.high`, nút đóng 44pt + nhãn "Đóng". |
| `components/ui/StoryCover.tsx` | Placeholder `brandTint`. |
| `screens/auth/LoginScreen.tsx`, `screens/auth/RegisterScreen.tsx`, `screens/kid/KidModeScreen.tsx` | **Chỉ 1 dòng mỗi file:** nền hard-code `'#FAFFFE'` → `Colors.background`. Lý do: sau khi `Screen` đổi sang nền kem, màu cũ tạo dải lệch màu ở đầu màn (thấy trên emulator). Không đổi logic. |

### Không làm trong R1 (đúng phạm vi)

- Không sửa màn hình (`screens/*`), `HeyTopBar`, `HeyTabBar`, navigation, Credit tab, services, stores, API.
- Không đổi props/API của component dùng chung; không chuyển `TouchableOpacity` → `Pressable`; không thêm variant mới; không thay emoji bằng icon vector (R2).
- `HeyProgressBar`, `AuthModal`, `CloudPopEntrance` (chưa được import) giữ nguyên.

### Hệ quả chuyển tiếp cần biết

- Chữ trong **màn hình** vẫn dùng font hệ thống cho tới khi từng màn chuyển sang `Typography` (R3–R8); chỉ component dùng chung dùng font mới → giai đoạn này có trộn font.
- Màn hình có `fontWeight: '800'/'900'` truyền vào `textStyle` của `HeyButton` sẽ hiển thị font hệ thống đậm trên Android (không lỗi, chỉ chưa đúng font) — xử lý khi redesign màn đó.

---

## Backlog từ audit — giao cho đợt phù hợp (CHƯA làm)

| Mã audit | Vấn đề | Đợt | File |
|---|---|---|---|
| A2 | Tip mascot bịa số liệu "Bé đã thu thập được 12 ⭐ sao rồi!" + tip sai tên nút "Sáng Tác AI" | **R5** | `components/CuteMascot.tsx` |
| A3 | Âm thanh `playPuppy` (mascot chó cũ) ở cú và nút Chế độ Bé | **R5** (Home) / **R4** (OwlMascot trong Kid) | `utils/sound-fx.ts`, `components/OwlMascot.tsx`, `screens/parent/ParentHomeScreen.tsx` |
| A4 | Asset cú dạng huy hiệu có chữ, vỡ ở 34–42px | Chờ asset tách nền (quyết định #4) | `HeyTopBar`, `LoginScreen`, PIN modal |
| B1 (màn) | Chữ trắng trên `primary` ở nút giọng đọc Reader (2.6:1) | **R7** | `components/parent/StoryReaderModal.tsx` (`audioBtnTextActive`) |
| B1 (màn) | Link màu `primary` trên nền trắng (Reader title, scope-pending) — 2.6:1, cần `brandStrong`. *Login "Đăng ký ngay" ✅ đã sửa (HIGH-3).* | **R7** | `StoryReaderModal.tsx:241` |
| CRIT-1 ✅ **ĐÃ SỬA** | Modal PIN thoát Kid Mode root 0×0 trên Android New Arch → đã chuyển sang lớp phủ trong cây (QA_R1_REPORT §12) | Xong | `screens/kid/KidModeScreen.tsx` |
| K1 *(mới, cần duyệt)* | Khôi phục Kid Mode sau restart bằng `GET /kid/me`; native cần storage lưu bền (`expo-secure-store` = dependency mới) | **Chờ người dùng duyệt** — trước hoặc cùng R4 | `stores/*`, `services/storage.ts` |
| QA-new | Nhãn "Sáng tác" không nhận chạm (R3); thẻ truyện đơn giãn full width (R7); `HeyChip` thiếu `aria-selected` trên Web (R2); chấm PIN màu cũ + nút Xác nhận disabled (R4) | R2 / R3 / R4 / R7 | QA_R1_REPORT §11.7 |
| C2 / E3 / E4 | Tab label 10px, tag 8px, vùng chạm tab ~40pt, credit pill ~24pt, avatar 34pt | **R3** | `HeyTabBar.tsx`, `HeyTopBar.tsx` |
| D1 | Emoji làm icon điều hướng/menu/nút | **R2** (Icon wrapper) → R3+ áp dụng | toàn app |
| E1 / E2 | Credit tab → Header + Hồ sơ; lối vào Kid Mode | **R3** | `HeyTabBar.tsx`, `navigation/routes.ts`, `MoreScreen.tsx` |
| G2 / G3 | Skeleton loading; toast thay `Alert.alert` | **R2** | `components/ui/*` |
| H1 / H3 | Nút trang Kid, nút "Bỏ qua" 12px, nhãn trợ năng phím PIN | **R4** | `KidModeScreen.tsx`, `KidCheckpointCard.tsx` |
| H2 | Tôn trọng Reduce Motion | **R4** | `KidModeScreen.tsx` |
| I1 | `Dimensions.get` một lần; giới hạn bề rộng Web | **R9** | `HeyTabBar.tsx`, `StoryReaderModal.tsx`, màn Parent |
| I3 ✅ **ĐÃ SỬA** (R1 QA Fix) | Dải trống **48.8dp** (128px) thừa phía trên mọi màn Android. Đã xác định nguyên nhân trong [QA_R1_REPORT.md](QA_R1_REPORT.md) §4: `Screen` cộng `StatusBar.currentHeight` trong khi hệ thống đã đặt nội dung dưới status bar (không translucent, targetSdk 34). Có sẵn từ HEAD (R1 chỉ đổi màu nền). *(Ghi "~95dp" trước đây là sai, vì đã tính cả chiều cao status bar.)* | **Trước R2** (HIGH-1) | `components/ui/Screen.tsx` |
| I4 *(mới)* | Expo Go luôn bật New Architecture nhưng `app.json` không khai báo `newArchEnabled` → giao diện trong Expo Go có thể khác bản build thật (vd. `boxShadow` hard-code trong màn). Bật/tắt là quyết định cấu hình build — **cần người dùng quyết** | Quyết định riêng | `app.json` |
| I2 | `boxShadow` hard-code trong màn/khung (ngoài component dùng chung) | Theo từng màn R3–R8 (dùng `Elevation`) | `HeyTopBar`, `HeyTabBar`, `KidModeScreen`, `LoginScreen`… |
| J1 | URL máy chủ hiện ở Login cho người dùng cuối | **R5** | `LoginScreen.tsx` |
| L1 / L2 | Variant ngữ nghĩa cho `HeyButton/HeyCard`, `Pressable`, focus ring Web | **R2** | `components/ui/*` |
| — | 157 mã hex hard-code trong màn hình | Theo từng màn R3–R8 | `screens/*` |
