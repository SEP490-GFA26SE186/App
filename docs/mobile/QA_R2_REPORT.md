# QA R2 — Shared UI Components (UI kit)

> **Loại:** Review/QA, không sửa code trong lượt này.
> **Ngày:** 2026-10-27
> **Phạm vi:** thay đổi R2 ghi tại [UI_REDESIGN_PROGRESS.md](UI_REDESIGN_PROGRESS.md) §R2, so với [UI_UX_REDESIGN_PLAN.md](UI_UX_REDESIGN_PLAN.md) §5.2 R2.
> **Ảnh:** [`qa/r2/`](qa/r2/), gồm `q2a*` (Android SW_Test) và `q2w*` (Expo Web 390px).
> **Bundle kiểm thử:** cùng hash với bản cuối của R2 (Web `AppEntry-72d70537…`, Android `AppEntry-d94aa3ca…`), nên mã nguồn không đổi trong lượt QA.

---

## 1. Kết luận

> **Cập nhật 2026-10-27 (R2.1, §10): R2 ĐẠT — nghiệm thu, sẵn sàng chuyển R3.**
> - MED-1 và MED-2 đã FIXED, kiểm thử thật trên Web và Android (có toast E2E thật).
> - Không còn CRITICAL, HIGH hay MEDIUM.
> - Đọc bằng trình đọc màn hình thật: NOT VERIFIED.
>
> *Phần dưới là kết luận của lượt QA đầu, giữ nguyên để đối chiếu.*

**R2 ĐẠT CÓ ĐIỀU KIỆN.**
- Không có lỗi CRITICAL hay HIGH.
- Mọi chức năng của component R2 và mọi regression Auth/Kid/PIN đều PASS trên cả Android và Web.

**Hai lỗi MEDIUM nằm trong mục tiêu của chính R2.** Mỗi lỗi chỉ cần sửa vài dòng; nên sửa (R2.1) **trước khi bắt đầu R3**, vì R3 sẽ dùng `StateView` và `Toast` khắp khung điều hướng:

1. **MED-1:** 6 trạng thái lỗi ở 3 màn đang dùng `StateView variant="empty"`. Sau R2, lỗi hiện icon lá xanh của trạng thái rỗng, nên mục tiêu "error ≠ empty" chưa đạt trên app thật.
2. **MED-2:** live region của Toast chỉ được chèn vào DOM cùng lúc với nội dung. Trên Web, trình đọc màn hình có thể không đọc toast `success`/`info`.

Sau R2.1, **đủ điều kiện chuyển sang R3**. Các mục LOW chuyển vào backlog.

**BLOCKED:** luồng E2E tạo ra toast thành công (thêm truyện vào tủ sách, đánh dấu xem lại) cần truyện "sẵn sàng". Sinh truyện cần Redis và AI worker; trên máy này BE trả 503. Không cấu hình BE, không tạo dữ liệu giả. Toast được kiểm tra bằng **COMPONENT TEST** (§3).

---

## 2. Môi trường

| Thành phần | Giá trị |
|---|---|
| BE | `node src/server.js` local, cổng 3000, PostgreSQL `127.0.0.1:5432/storyweaver` (đã xác minh local ở QA R1 §11.1). Không sửa BE. |
| Web | Expo Web 8082 (cổng duy nhất được CORS cho phép), Chrome headless qua CDP, viewport 390×844 và 1280×800 |
| Android | Emulator SW_Test, Expo Go (New Architecture), Metro 8081, `adb reverse` |
| Tài khoản | `qa_r1_1d2cf7` (tài khoản test, dữ liệu tối thiểu từ QA R1). Không ghi mật khẩu hay PIN. |

---

## 3. Toast — COMPONENT TEST (không phải E2E)

**Cách làm:** không sửa mã app. Harness gọi `show(message, tone)` của `ToastProvider` đang chạy trong app thật:
- **Web:** CDP `Runtime.evaluate`, tìm context value có hàm `show` trong cây React. Script `w_qa_r2.mjs`.
- **Android:** nối vào runtime Hermes qua inspector của Metro (`/json/list` → CDP), dùng `__REACT_DEVTOOLS_GLOBAL_HOOK__.getFiberRoots`. Script `hermes_toast.mjs`.

Hai script nằm trong scratchpad QA, chưa đưa vào repo (xem §8).

| # | Kịch bản | Web | Android | Ảnh |
|---|---|---|---|---|
| T1 | Tone `success`/`info`/`danger`: icon đúng, nền navy, chữ trắng **14.6:1** | ✅ PASS | ✅ PASS | [q2w_toast_success](qa/r2/q2w_toast_success.jpg), [q2w_toast_info](qa/r2/q2w_toast_info.jpg), [q2w_toast_danger](qa/r2/q2w_toast_danger.jpg), [q2a_toast_success](qa/r2/q2a_toast_success.jpg), [q2a_toast_info](qa/r2/q2a_toast_info.jpg), [q2a_toast_danger](qa/r2/q2a_toast_danger.jpg) |
| T2 | Tự đóng: Web đo được 3.38–3.50 s (cấu hình 3.5 s); Android còn ở giây thứ 1, mất ở khoảng giây 3.4–4.4 | ✅ PASS | ✅ PASS | – |
| T3 | Nhiều toast liên tiếp: toast mới **thay** toast cũ; hẹn giờ tính lại từ toast mới (B còn 3.5 s). Gọi 5 lần liền: chỉ toast cuối hiện | ✅ PASS (đúng thiết kế, xem LOW-3) | ✅ PASS | [q2a_toast_consecutive](qa/r2/q2a_toast_consecutive.jpg) |
| T4 | Chạm để ẩn | ✅ PASS | ✅ PASS | – |
| T5 | Vị trí: trên cùng, cách mép 8px, tránh status bar; **không che tab bar** | ✅ PASS | ✅ PASS | – |
| T6 | **Bàn phím đang mở:** toast ở trên nên không bị bàn phím che; không lấy focus khỏi ô đang nhập (Web: `activeElement` vẫn là INPUT) | ✅ PASS | ✅ PASS (`mInputShown=true`) | [q2w_toast_while_typing](qa/r2/q2w_toast_while_typing.jpg), [q2a_toast_keyboard](qa/r2/q2a_toast_keyboard.jpg) |
| T7 | Thông báo dài: xuống dòng, trong lề 16px; desktop 1280px: nằm giữa, rộng tối đa 720px | ✅ PASS | – | [q2w_toast_long_390](qa/r2/q2w_toast_long_390.jpg), [q2w_toast_desktop](qa/r2/q2w_toast_desktop.jpg) |
| T8 | **Che top bar:** toast phủ logo và một phần pill credit/avatar trong 3.5 s; chạm vào vùng đó sẽ ẩn toast thay vì mở màn | ⚠️ LOW-1 | ⚠️ LOW-1 | q2a_toast_success |
| T9 | **Toast khi `Sheet` (Modal) đang mở:** toast bị lớp nền mờ của Sheet đè lên, không chạm được, Android không có trong cây trợ năng | ❌ LOW-2 (chưa có chỗ gọi nào rơi vào tình huống này) | ❌ LOW-2 | [q2w_toast_with_sheet](qa/r2/q2w_toast_with_sheet.jpg), [q2a_toast_with_sheet](qa/r2/q2a_toast_with_sheet.jpg) |
| T10 | A11y Web: `success`/`info` có `aria-live="polite"`, không có role; `danger` có `role="alert"` + `aria-live="assertive"` | ⚠️ MED-2 | – | – |
| T11 | A11y Android: node toast có chữ, nhưng `clickable=false`, nên TalkBack không biết có thể chạm để ẩn | – | ⚠️ LOW-4 | – |
| T12 | Đọc thật bằng TalkBack/NVDA/VoiceOver | ⛔ chưa kiểm tra (không có trình đọc màn hình trong môi trường QA) | ⛔ | – |
| E2E | Toast thành công trong luồng thật (thêm vào tủ sách, đánh dấu xem lại) | ⛔ **BLOCKED** (cần Redis + AI worker) | ⛔ **BLOCKED** | – |

---

## 4. Skeleton, empty, error

| # | Kịch bản | Kết quả | Ảnh |
|---|---|---|---|
| S1 | Loading (BE chậm 6s, Tủ truyện): 3 thẻ skeleton, `role=progressbar` + nhãn "Đang tải truyện..." | ✅ PASS (Web) | [q2w_r05_skeleton_library](qa/r2/q2w_r05_skeleton_library.jpg) |
| S2 | Nhấp nháy khi bình thường: opacity đo được 0.45 → 0.70 → 1.00 | ✅ PASS (Web) | – |
| S3 | **Reduce Motion** (`prefers-reduced-motion: reduce`): opacity luôn 1.00 | ✅ PASS (Web) | – |
| S4 | Reduce Motion trên Android ("Xóa hiệu ứng động"): Reanimated tự tắt hoạt ảnh `OwlMascot` | ✅ PASS (đo ở R2, [g05](qa/r2/g05_android_reduce_motion_home.jpg)) | – |
| S5 | Skeleton trên Android | ⛔ chưa kiểm tra: không giả lập được độ trễ mạng trên emulator mà không chạm BE hay proxy | – |
| S6 | Empty state (lọc "Đã viết xong"): icon lá trong vòng xanh + "Không có truyện phù hợp" | ✅ PASS | [q2w_empty_state](qa/r2/q2w_empty_state.jpg) |
| S7 | **Error state** (mất mạng ở màn Tiến độ EQ): tiêu đề "Chưa tải được báo cáo EQ" và nút "Thử lại" chạy đúng, nhưng **icon là lá xanh của trạng thái rỗng**, không có `role=alert` | ❌ **MED-1** | [q2w_error_state](qa/r2/q2w_error_state.jpg) |

**MED-1, chi tiết:** không chỗ nào trong app dùng `variant="error"`. 6 trạng thái lỗi đang dùng `variant="empty"`:
- `EqReportScreen.tsx`: "Chưa tải được báo cáo EQ".
- `StoryDetailScreen.tsx` ×2: "Không tải được truyện", "Chưa tải được nội dung truyện".
- `WalletScreen.tsx` ×3: "Chưa tải được gói hiện tại", "…danh sách gói", "…lịch sử credit".

Trước R2 cả hai variant đều là emoji 🌱 nên không thấy khác biệt. R2 làm khác biệt rõ ràng ở component, nhưng các màn chưa dùng đúng variant. **Sửa:** 6 chỗ `variant="empty"` → `"error"`. Mỗi chỗ một chữ, màn sẽ có thêm icon đỏ và `role=alert`.

---

## 5. Icon, Button variants, Focus ring, Accessibility

| # | Kiểm tra | Web | Android | Ghi chú |
|---|---|---|---|---|
| I1 | Icon vector hiển thị: quay lại, đóng ✕, lỗi `alert-circle`, mắt mật khẩu | ✅ | ✅ | Ảnh R2: r2w06, r2w07, g03, g04 |
| I2 | Icon trang trí ẩn khỏi cây a11y; nút chỉ có icon vẫn có tên ("Quay lại", "Đóng", "Hiện mật khẩu") | ✅ AX tree: Bé nhà mình 5 button, Tủ truyện 1 button, **0 nút thiếu tên** | ✅ `content-desc` đúng | – |
| B1 | Tương phản variant (tính từ Palette): `primary` 5.60, `secondary` 5.24, `tertiary` chữ 14.63 / viền 3.18, `danger` 6.46, `sky` 5.17, `ghost` 14.40, `kid` 5.60 | ✅ đều ≥ AA | ✅ | `danger`, `tertiary`, `iconName` **chưa có màn nào dùng**, nên chỉ kiểm tra tĩnh |
| B2 | Nút R2 chạy đúng ở Login, Home, Sheet, StateView, PIN | ✅ | ✅ | – |
| F1 | Focus ring: chạm → không viền; Tab → viền 2px #C2410C (5.1:1 trên nền kem); chạm lại → mất viền | ✅ | N/A | [q2w_r03a](qa/r2/q2w_r03a_after_touch_no_ring.jpg), [q2w_r03](qa/r2/q2w_r03_focus_ring_keyboard.jpg) |
| F2 | Phần tử của `HeyTopBar`/`HeyTabBar` và 93 `TouchableOpacity` trong màn: viền mặc định của trình duyệt | ℹ️ ngoài phạm vi R2 → R3+ | – | – |
| C1 | `HeyChip` chọn-một: Web `role=radio` + `aria-checked` đổi đúng; Android `RadioButton`, `checkable=true`, `checked` đúng | ✅ | ✅ | [q2a_chips](qa/r2/q2a_chips.jpg) |
| C2 | Bàn phím: **Enter** chọn chip ✅; **Space không chọn** (RN Web chỉ xử lý Space cho role button); không có điều hướng bằng phím mũi tên hay `radiogroup` | ⚠️ LOW-5 | – | [q2w_keyboard_chip](qa/r2/q2w_keyboard_chip.jpg) |
| C3 | Kích thước chip 36px: Android có `hitSlop` lên 44dp; **Web không áp dụng `hitSlop`** nên vùng chạm 36px (≥ 24px của WCAG 2.5.8, < 44 theo hướng dẫn) | ⚠️ LOW-6 (có từ R1) | ✅ | – |
| A1 | Tương phản icon trạng thái: rỗng 4.74, lỗi 5.00, chưa hỗ trợ 4.74; icon toast trên navy 4.91 / 12.46 / 11.32 | ✅ | ✅ | – |

---

## 6. Regression nhanh

| Luồng | Web | Android |
|---|---|---|
| Login (icon mắt hiện/ẩn mật khẩu chạy đúng) | ✅ | ✅ |
| Parent Home | ✅ | ✅ [q2a03](qa/r2/q2a03_parent_home.jpg) |
| Vào Kid Mode | ✅ | ✅ [q2a01_kid](qa/r2/q2a01_kid.jpg) |
| PIN sai → BE 401, "Còn 4 lần thử", vẫn ở Kid | ✅ | ✅ [q2a02](qa/r2/q2a02_pin_wrong.jpg) |
| PIN đúng → BE 200 → Parent | ✅ | ✅ |
| Đăng xuất → Login, Intro không phát lại; đăng nhập lại | ✅ | ✅ [q2a_after_logout](qa/r2/q2a_after_logout.jpg) |
| Request lỗi ngoài lỗi có chủ đích (401 PIN sai, 401 `/auth/me` khi reload sau Kid Mode) | ✅ không có | – |

Trong lúc QA, emulator một lần hiện "System UI isn't responding" (lỗi của emulator, không phải app). Chọn "Wait" thì chạy tiếp bình thường.

---

## 7. Kiểm tra kỹ thuật

| Kiểm tra | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ Exit 0 |
| `tests/authRace.test.ts` | ✅ 5/5 |
| `npx expo install --check` | ✅ Dependencies are up to date |
| `expo export` Web / Android | ✅ 1.27 MB / 2.74 MB (Hermes); hash trùng bản cuối R2 |

---

## 8. Danh sách vấn đề

| Mã | Mức | Vấn đề | Nguồn | Đề xuất |
|---|---|---|---|---|
| MED-1 | MEDIUM | 6 trạng thái lỗi dùng `StateView variant="empty"` nên hiện icon "rỗng" màu xanh, không có `role=alert` | Có sẵn ở màn; lộ rõ sau R2 | **R2.1:** đổi 6 chỗ sang `variant="error"` |
| MED-2 | MEDIUM | Toast `success`/`info`: phần tử `aria-live` chỉ được chèn kèm nội dung, nên NVDA/VoiceOver Web thường không đọc. `danger` dùng `role=alert` nên ổn hơn. Chưa kiểm chứng bằng trình đọc màn hình thật. | R2 | **R2.1:** luôn mount sẵn một vùng `aria-live`/`role="status"` rỗng (ẩn), khi `show()` thì đổi chữ trong vùng đó |
| LOW-1 | LOW | Toast phủ logo và pill credit/avatar ở top bar trong 3.5s; chạm vào đó chỉ ẩn toast | R2 | Khi làm lại top bar ở R3: đặt toast dưới top bar, hoặc trên tab bar |
| LOW-2 | LOW | Toast gọi khi `Sheet` đang mở bị lớp nền của Sheet đè (cả 2 nền tảng) | R2 | Hiện chưa có chỗ gọi nào như vậy. Quy ước: đóng Sheet rồi mới `show()`; hoặc sau này render toast trong Sheet |
| LOW-3 | LOW | Toast không xếp hàng: gọi nhanh nhiều lần chỉ còn toast cuối | Thiết kế R2 | Chấp nhận cho thông báo thành công; ghi vào hướng dẫn dùng |
| LOW-4 | LOW | Android: toast `clickable=false` (role `text`), nên TalkBack không biết có thể chạm để ẩn | R2 | Dùng role `button` + nhãn "Ẩn thông báo", hoặc bỏ chạm-để-ẩn (đã tự ẩn) |
| LOW-5 | LOW | Chip radio: Space không chọn trên Web; chưa có `radiogroup` / phím mũi tên | R2 / RN Web | Thêm container `radiogroup` khi redesign từng màn (R3+); xử lý Space bằng `onKeyDown` nếu cần |
| LOW-6 | LOW | Web không áp dụng `hitSlop`: chip và nút `sm` có vùng chạm 36px | Có sẵn từ R1 | R9 (responsive/a11y) hoặc tăng `minHeight` trên Web |
| LOW-7 | LOW | `useReduceMotion` đọc cài đặt bất đồng bộ, nên có thể có vài khung hình chuyển động trước khi tắt. Lượt đo đầu tiên (300ms) đã thấy đứng yên. | R2 (review mã) | Cache giá trị ở cấp module để lần mount sau dùng ngay |
| INFO | – | Khối skeleton `sand100` trên trắng chỉ 1.12:1. Là trang trí nên không bắt buộc, khung thẻ vẫn thấy rõ nhờ viền. | R2 | Cân nhắc đậm hơn khi redesign |
| INFO | – | `danger`, `tertiary`, `iconName`, `HeyCard` variant mới chưa có màn dùng | R2 | Kiểm tra lúc chạy khi R3+ dùng tới |

---

## 9. Đề xuất kiểm thử tự động

Dự án **chưa có hạ tầng test component**: không có `jest`, `@testing-library/react-native`; chỉ có `tests/authRace.test.ts` chạy bằng `tsc` + `node`.

**Phương án A — không thêm dependency** (cùng cách với `authRace`). Tách phần logic thuần ra khỏi component rồi test bằng node:

| Test | Logic cần tách | Trường hợp |
|---|---|---|
| `toastController.test.ts` | Hẹn giờ và thay thế của `ToastProvider` (truyền `setTimeout`/`clearTimeout` giả) | `show` → hiện; sau 3500ms → ẩn; `show` lần 2 ở 1500ms → hẹn giờ tính lại từ đầu; `hide` → xóa hẹn giờ; unmount → không còn hẹn giờ |
| `focusModality.test.ts` | Bộ theo dõi kiểu nhập trong `theme/focus.ts` (truyền `document` giả) | `keydown` → bật viền; `pointerdown`/`touchstart` → tắt; `keydown` kèm meta/ctrl/alt → không bật |
| `chipA11y.test.ts` | Hàm `(selected, hasOnPress) → { role, state }` của `HeyChip` | radio/checked, button, text |
| `buttonVariants.test.ts` | Bảng `VARIANTS` của `HeyButton` + Palette | Mọi variant trong type đều có style; alias trỏ đúng; tương phản chữ/nền ≥ 4.5:1 |
| `stateViewUsage.test.ts` | Quét mã nguồn `screens/**` | Title chứa "tải được"/"lỗi" thì phải là `variant="error"` (chặn tái phát MED-1) |

**Phương án B — cần duyệt dependency** (`jest-expo`, `@testing-library/react-native`): test render thật cho `Toast` (role, live region, tự ẩn với fake timers), `HeyChip` (`accessibilityState`), `HeyButton` (`disabled`/`busy`), `StateView` (role alert).

**E2E** (cần duyệt công cụ, ví dụ Maestro): luồng thêm truyện vào tủ sách → toast. Chỉ chạy được khi có môi trường Redis + AI worker.

Có thể đưa hai harness của lượt QA này (`w_qa_r2.mjs`, `hermes_toast.mjs`) vào `apps/mobile/tests/harness/` làm công cụ kiểm tra thủ công. **Cần người dùng đồng ý** vì đó là thêm file vào repo.

---

## 10. R2.1 — Sửa MED-1, MED-2 và nghiệm thu lại (2026-10-27)

### 10.1 Môi trường

- **BE local:** `GET /api/v1/health` → 200. Tiến trình BE kết nối thật tới `127.0.0.1:5432` (DB `storyweaver`); `SUPABASE_URL` và `SUPABASE_SERVICE_KEY` để trống. Không sửa BE.
- **Tài khoản Parent:** `me.lanhuong@storyweaver.vn`, có dữ liệu thật: 1 bé "Bin", 4 truyện đã viết xong, EQ 2/5 năng lực, Ví gói Miễn phí 53 credit. Mật khẩu chỉ truyền qua biến môi trường lúc chạy; không ghi vào file, ảnh hay báo cáo.
- **Kid Mode / PIN:** **chưa có PIN của tài khoản Parent** nên không đoán. Phần PIN dùng tài khoản test `qa_r1_1d2cf7` (PIN do QA R1 tự đặt), để tránh làm khóa PIN của tài khoản Parent khi nhập sai.
- **Web:** Expo Web 8082, `EXPO_PUBLIC_API_URL=http://localhost:3000`, Chrome headless qua CDP.
- **Android:** SW_Test, Expo Go, Metro 8081, `adb reverse tcp:3000`. Cắt kết nối BE bằng cách gỡ `adb reverse` để tạo lỗi API thật.

### 10.2 Thay đổi

| File | Thay đổi |
|---|---|
| `screens/parent/EqReportScreen.tsx` | MED-1: nhánh `res.status === 'error'`: `variant="empty"` → `"error"` (1 chỗ) |
| `screens/parent/StoryDetailScreen.tsx` | MED-1: nhánh không có truyện và không đang tải, cùng nhánh `status === 'error'` (2 chỗ) |
| `screens/parent/WalletScreen.tsx` | MED-1: lỗi gói hiện tại, danh sách gói, lịch sử credit (3 chỗ) |
| `components/ui/Toast.tsx` | MED-2: xem §10.3. Thêm: `id` toast dùng bộ đếm (trước là `Date.now()`, có thể trùng key); toast nhìn thấy có role `button` + nhãn = nội dung (xử lý luôn LOW-4) |
| `tests/uiStates.test.ts` *(mới)*, `tests/README.md` | Test quét mã nguồn, không dependency, chặn MED-1 và MED-2 tái diễn |

**Không đổi:** logic fetch, điều kiện lỗi, API, Auth, Session, Kid Mode, PIN, BE, Web, App_v2, dependency.

Giữ nguyên 4 trạng thái rỗng hợp lệ: EQ "Chưa có hồ sơ bé" và "Chưa có dữ liệu EQ"; Story Detail "Truyện chưa có trang nào"; Wallet "Chưa có giao dịch credit".

### 10.3 MED-2 — cách sửa

- **Web:** `ToastProvider` luôn render 2 vùng ẩn khỏi màn hình nhưng vẫn trong cây trợ năng:
  - `role="status" aria-live="polite"` cho `success`/`info`;
  - `role="alert" aria-live="assertive"` cho `danger`.
- **Cách cập nhật:** khi `show()`, chỉ chèn nút chữ (có `key` theo từng toast) vào đúng vùng đã có sẵn. Khi đóng, nội dung vùng được xóa.
- **Native:** RN Web có `announceForAccessibility` là hàm rỗng, nên chỉ native (Android/iOS) dùng hàm này.
- **Không đọc trùng:** toast nhìn thấy không còn `aria-live`/`accessibilityLiveRegion`. Mỗi thông báo chỉ đi qua một kênh.

### 10.4 Kết quả MED-1

| Kịch bản | Web | Android | Ảnh |
|---|---|---|---|
| EQ có dữ liệu thật (Tự nhận thức "Đang phát triển", Kỹ năng quan hệ "Vững") | ✅ | ✅ | r21w01 |
| **EQ lỗi API** → vòng đỏ #FFDAD6, icon `!`, tiêu đề đỏ, `role=alert`, "Thử lại" → có mạng lại thì hiện dữ liệu thật | ✅ PASS | ✅ PASS | [r21w_eq_error](qa/r2/r21w_eq_error.jpg), [r21a04](qa/r2/r21a04_eq_error.jpg) |
| **Wallet lỗi API** (bấm "Tải lại" khi mất kết nối) → đủ **3** view lỗi | ✅ PASS (3/3) | ✅ PASS (3/3; cần cuộn để thấy cái thứ 3) | [r21w_wallet_errors_top](qa/r2/r21w_wallet_errors_top.jpg), [r21a05](qa/r2/r21a05_wallet_error.jpg), [r21a05b](qa/r2/r21a05b_wallet_history_error.jpg) |
| Wallet hồi phục ("Tải lại" khi có mạng) → hết lỗi, hiện lại gói/mức dùng/lịch sử | ✅ | ✅ | [r21a08](qa/r2/r21a08_wallet_recovered.jpg) |
| **Story Detail nhánh 2** (có tóm tắt, nạp chi tiết lỗi) → view lỗi, tóm tắt vẫn hiện; "Thử lại" → "Các trang (5)" | ✅ PASS | ✅ PASS | [r21w_story_detail_error](qa/r2/r21w_story_detail_error.jpg), [r21a06](qa/r2/r21a06_story_detail_error.jpg), [r21a07](qa/r2/r21a07_story_detail_retry.jpg) |
| **Story Detail nhánh 1** (mở chi tiết khi chưa có tóm tắt) | ⛔ NOT RUN | ⛔ NOT RUN | – |
| Empty hợp lệ (lọc "Bản nháp" ở Tủ truyện) → vòng xanh, **không** `role=alert` | ✅ | – | [r21w_library_empty_filter](qa/r2/r21w_library_empty_filter.jpg) |
| Loading → Skeleton (BE chậm 6s), không đổi | ✅ (opacity 0.45 → 0.70 → 1.00; Reduce Motion: 1.00 cố định) | – | [r21w_skeleton_library](qa/r2/r21w_skeleton_library.jpg) |
| `tests/uiStates.test.ts` | ✅ 2/2. Thử cố ý trả 3 chỗ Wallet về `"empty"` trên bản sao: test **FAIL đúng 3 chỗ** | | |

Nhánh 1 của Story Detail chỉ xảy ra ngay sau khi tạo truyện mới bằng Wizard (`ParentTabs` điều hướng tới truyện vừa tạo, chưa có trong danh sách). Tạo truyện là ghi dữ liệu, và sinh truyện đang BLOCKED. Nhánh này được xác minh bằng đọc code và bằng `uiStates.test.ts`.

### 10.5 Kết quả MED-2 và Toast

| Kịch bản | Web | Android | Loại |
|---|---|---|---|
| **Toast E2E thật:** Tủ truyện → "Thêm vào tủ sách bé" → BE 201 (`alreadyInBookshelf`, không đổi dữ liệu) → toast "Đã thêm “[Demo] Bin và hộp bút chì màu” lên tủ sách của Bin." | ✅ PASS | ✅ PASS | **E2E** ([r21w_toast_e2e_shelf](qa/r2/r21w_toast_e2e_shelf.jpg), [r21a02](qa/r2/r21a02_toast_e2e.jpg)) |
| Tự đóng toast E2E: Web khoảng 3.2 s; Android còn ở giây 1, mất ở giây ~5 | ✅ | ✅ | E2E |
| Vùng live **có sẵn trước toast đầu tiên**: `status=1`, `alert=1`, đều rỗng | ✅ PASS | N/A (native dùng `announceForAccessibility`) | Cấu trúc DOM |
| `success`/`info` → chữ vào vùng `status`; `danger` → chữ vào vùng `alert`; vùng kia rỗng | ✅ PASS | – | COMPONENT TEST |
| Toast nhìn thấy không còn `aria-live` → không đọc trùng | ✅ PASS | ✅ (không còn live region) | COMPONENT TEST |
| Cùng nội dung 2 lần liên tiếp → nút chữ được chèn lại 2 lần (trình đọc đọc cả 2) | ✅ PASS (MutationObserver đếm 2) | – | COMPONENT TEST |
| Toast mới thay toast cũ (`info` thay `danger`; vùng live đổi theo) | ✅ | ✅ | COMPONENT TEST |
| Chuyển màn khi toast đang hiện → toast vẫn hiện rồi tự đóng | ✅ | – | COMPONENT TEST |
| Chạm để ẩn → toast mất, vùng live được xóa | ✅ | ✅ | COMPONENT TEST |
| Android: node toast = `android.widget.Button`, `clickable=true`, `content-desc` = nội dung (trước: `clickable=false`, LOW-4) | – | ✅ PASS | COMPONENT TEST ([r21a03](qa/r2/r21a03_toast_danger.jpg)) |
| **Đọc thật bằng NVDA / TalkBack / VoiceOver** | ⚠️ **NOT VERIFIED** | ⚠️ **NOT VERIFIED** | Không có trình đọc màn hình trong môi trường QA. Mới xác minh **cấu trúc** live region và lời gọi `announceForAccessibility`. |

### 10.6 Regression

| Luồng | Web | Android |
|---|---|---|
| Login tài khoản Parent → Parent Home (dữ liệu thật) | ✅ | ✅ [r21a01](qa/r2/r21a01_parent_home.jpg) |
| Chuyển 4 tab, mở EQ và Wallet | ✅ | ✅ |
| Intro không phát lại khi đổi tab, đăng xuất, đăng nhập lại | ✅ | ✅ |
| Kid Mode (tài khoản `qa_r1`): vào Kid → "🔒 Thoát" → khoá PIN hiện (CRIT-1 vẫn ổn) | ✅ | ✅ [r21a09](qa/r2/r21a09_kid_pin.jpg) |
| PIN sai → BE `POST /auth/kid-mode/exit` **401**, "Còn 4 lần thử", vẫn ở Kid | ✅ | ✅ |
| PIN đúng → BE **200** → Parent | ✅ | ✅ [r21a10](qa/r2/r21a10_parent_after_pin.jpg) |
| Đăng xuất → Login | ✅ | ✅ [r21a11](qa/r2/r21a11_after_logout.jpg) |
| Kid Mode **với tài khoản Parent** | ⛔ BLOCKED: chưa có PIN, không đoán | ⛔ BLOCKED |
| Console Web | Chỉ còn cảnh báo `props.pointerEvents is deprecated` (có từ trước). Không có request ≥ 400 ngoài 401 PIN sai có chủ đích. | – |

### 10.7 Kiểm tra kỹ thuật

| Kiểm tra | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ Exit 0 |
| `tests/authRace.test.ts` | ✅ 5/5 |
| `tests/uiStates.test.ts` *(mới)* | ✅ 2/2 |
| `npx expo install --check` | ✅ Dependencies are up to date |
| `expo export` Web / Android | ✅ 566 / 836 module; 1.27 MB / 2.74 MB |
| Git diff | Chỉ 3 màn (đổi `variant`), `Toast.tsx`, `tests/*`, docs. Không có file nào ngoài `App/apps/mobile` và `App/docs/mobile`. |

### 10.8 Vấn đề còn lại

| Mã | Mức | Trạng thái |
|---|---|---|
| MED-1 | MEDIUM | ✅ **FIXED** (Web + Android) |
| MED-2 | MEDIUM | ✅ **FIXED** về cấu trúc và hành vi (Web + Android); đọc thật bằng trình đọc màn hình **NOT VERIFIED** |
| LOW-4 | LOW | ✅ FIXED kèm MED-2 (toast là `Button`, `clickable=true`) |
| LOW-1 | LOW | Mở: toast che top bar (thấy rõ với toast 2 dòng ở r21w_toast_e2e_shelf) → xử lý cùng top bar ở **R3** |
| LOW-2, LOW-3, LOW-5, LOW-6, LOW-7 | LOW | Mở, như §8 |
| INFO | – | Wallet khi lỗi vẫn hiện thẻ "Mức đang dùng" với dữ liệu cũ bên cạnh view lỗi (có từ trước, hành vi màn → R8) |
| INFO | – | Nút "Thử lại" của lịch sử credit gọi `loadHistory(page + 1)` (có từ trước). Một lần bấm khi QA chưa xóa được lỗi, nhưng không xác định được lần đó bấm trúng nút nào; "Tải lại" thì hồi phục đúng. **Chưa kết luận là lỗi** → xem ở R8. |

Không có CRITICAL hay HIGH.

### 10.9 Chưa kiểm thử được

- Trình đọc màn hình thật (NVDA, TalkBack, VoiceOver): không có trong môi trường QA → **NOT VERIFIED**.
- Story Detail nhánh lỗi 1: cần tạo truyện mới qua Wizard → **NOT RUN** (đã có code review + test).
- Toast "Đã xem lại" (đánh dấu xem lại truyện): sẽ đổi trạng thái truyện thật của tài khoản Parent → **NOT RUN**. Cùng component đã được kiểm tra E2E qua toast thêm vào tủ sách.
- Sinh truyện AI: cần Redis + AI worker → **BLOCKED**.
- Kid Mode với tài khoản Parent: chưa có PIN → **BLOCKED** (đã kiểm tra bằng tài khoản `qa_r1`).
- Skeleton trên Android: không giả lập được mạng chậm trên emulator mà không động tới BE hay proxy.

### 10.10 Kết luận

**R2 ĐẠT — nghiệm thu, sẵn sàng chuyển sang R3 (Navigation).**
- MED-1 và MED-2 đã FIXED, kiểm thử thật trên Web và Android SW_Test.
- Không có CRITICAL, HIGH hay MEDIUM còn mở.
- Regression Auth/Kid/PIN/Logout/Intro PASS; CRIT-1 không bị ảnh hưởng.
- **Lưu ý duy nhất:** việc đọc toast bằng trình đọc màn hình thật là **NOT VERIFIED**. Cấu trúc đã đúng chuẩn (vùng live có sẵn, tách polite/assertive, không đọc trùng). Nên kiểm tra nhanh bằng NVDA/TalkBack khi có thiết bị.
