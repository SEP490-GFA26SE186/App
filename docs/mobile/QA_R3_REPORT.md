# QA R3 — Khung điều hướng Parent (Tab bar + Header + Hồ sơ)

> **Ngày:** 2026-10-27 · **Phạm vi:** R3 theo [UI_UX_REDESIGN_PLAN.md](UI_UX_REDESIGN_PLAN.md) §5.2, tiến độ ở [UI_REDESIGN_PROGRESS.md](UI_REDESIGN_PROGRESS.md).
> **Ảnh:** [`qa/r3/`](qa/r3/) (`r3w*` = Expo Web, `r3a*` = Android SW_Test). Không có mật khẩu, PIN hay token trong ảnh. Có email của hai tài khoản test.
> Đây là báo cáo **triển khai + tự kiểm thử** của R3, chờ bạn review và nghiệm thu.

---

## 1. Kết luận

**R3 hoàn thành phạm vi yêu cầu và đạt kiểm thử trên Web lẫn Android SW_Test. Đề nghị nghiệm thu, chuyển R4 sau khi bạn review.**

- Không có lỗi CRITICAL, HIGH hay MEDIUM còn mở.
- Các lỗi tìm thấy **trong lúc kiểm thử** đều đã sửa và kiểm lại (§7).
- Còn **LOW** và các hạng mục **NOT VERIFIED** ở §8, §9.

---

## 2. Môi trường

| Thành phần | Giá trị |
|---|---|
| BE local | `node src/server.js`, `GET /api/v1/health` → 200. Tiến trình BE kết nối thật tới `127.0.0.1:5432` (DB `storyweaver`); `SUPABASE_URL` và `SUPABASE_SERVICE_KEY` để trống. Không sửa BE. |
| Tài khoản | Parent `me.lanhuong@storyweaver.vn`: bé "Bin", 4 truyện, **53 credit** (dữ liệu thật). Mật khẩu chỉ truyền qua biến môi trường lúc chạy, không lưu file. Kid Mode + PIN dùng tài khoản `qa_r1_1d2cf7` (PIN do QA R1 đặt; không đoán PIN của tài khoản Parent). |
| Web | Expo Web 8082 (cổng được CORS cho phép), Chrome headless qua CDP; 390×844, 320×568, 1280×800 |
| Android | SW_Test, Expo Go (New Architecture), Metro 8081, `adb reverse`; 1080×2400, và 540×960@240dpi (= 360×640dp) |
| Dữ liệu | Không tạo, không sửa, không xóa dữ liệu trong DB. |

---

## 3. Đã làm trong R3

| File | Thay đổi |
|---|---|
| `navigation/routes.ts` | `TAB_ROUTES` = Trang chủ · Tủ truyện · Sáng tác · Tiến độ · **Hồ sơ** (`MORE`); **Ví (`WALLET`) không còn là tab**. Thêm 3 hàm thuần để test: `navigateStack` (tab làm mới ngăn xếp; bỏ qua chạm lặp vào cùng màn), `activeTabFor` (Ví tô sáng Hồ sơ), `backStack`. |
| `navigation/useParentNavigation.ts` | Dùng các hàm trên. **Back của Android:** màn con → màn trước; tab khác Trang chủ → Trang chủ; ở Trang chủ → thoát app như cũ. |
| `components/parent/HeyTabBar.tsx` | Viết lại: thanh nổi dạng pill, icon Ionicons (outline khi không chọn, đặc khi chọn), nhãn **12px**, mỗi mục là nút `role=button` có `aria-current="page"` + `accessibilityState.selected`, vùng chạm **71×52** (Web), viền focus chỉ khi dùng bàn phím. Nút **Sáng tác** nổi; cả nút tròn lẫn nhãn nhận chạm. Credit đã bỏ. Không còn animation lò xo (trạng thái nhấn tức thời). Căn giữa, rộng tối đa 720px. |
| `components/parent/HeyTopBar.tsx` | Viết lại: logo cú (**chạm → Trang chủ**) · tên app (Comfortaa) · **pill Credit** (icon kim cương, số dư thật, mũi tên → Ví) · **avatar** (chữ cái đầu, chạm → Hồ sơ). Tất cả **44×44**. Bỏ nhãn "Bé Yêu" 8px, bỏ dấu `+` (chưa hỗ trợ mua credit trên app). Không còn emoji hay hex cứng. |
| `screens/parent/MoreScreen.tsx` | Thành màn **Hồ sơ**, chia nhóm **Gia đình / Tài khoản / An toàn trẻ em / Hỗ trợ**; mục có icon vector, `Pressable` + focus ring; thêm mục **Ví & Credit** (hiện số dư thật) và mục **Chế độ Bé** (nổi bật, dùng đúng `openKidMode` cũ). Nút Đăng xuất có icon. Nội dung các màn con không đổi. |
| `screens/parent/WalletScreen.tsx` | Thêm nút quay lại (prop `onBack`); Ví giờ là màn con. |
| `navigation/ParentTabs.tsx` | Nối các thay đổi trên; `openWallet` dùng chung cho pill credit, Hồ sơ và SellerDashboard. |
| `components/ui/Toast.tsx` | **Xử lý LOW-1:** toast chuyển xuống đáy, phía trên thanh tab (như Snackbar Android); `useToastBottomInset` để màn có thanh tab chừa chỗ. |
| `tests/navigation.test.ts` *(mới)* | 11 test cho logic điều hướng và các ràng buộc khung điều hướng. |

**Không đổi:** Auth, Session, Token, Kid Mode, PIN, API, Intro, AI Generation, nội dung Parent Home/Library/Children/Characters/EQ/Wallet/Story Detail, BE, Web, App_v2, dependency.

---

## 4. Kết quả Web (Expo Web, BE local)

| # | Kịch bản | Kết quả |
|---|---|---|
| W1 | Login → Home; header: pill `Số dư 53 credit. Mở ví credit`, avatar `Hồ sơ của Mẹ Lan Hương`, logo — đều **44×44**, không tràn ngang | ✅ PASS ([r3w01](qa/r3/r3w01_home_header_tabs.jpg)) |
| W2 | **Credit hiển thị số dư thật:** header **53** khớp "Credit còn lại **53**" trong Ví và `Số dư 53 credit` trong Hồ sơ (cùng từ BE) | ✅ PASS |
| W3 | 5 tab: Trang chủ, Tủ truyện, Tiến độ, Hồ sơ lần lượt hiện đúng màn; `aria-current` chuyển đúng (active/inactive); nhãn 12px | ✅ PASS ([r3w02](qa/r3/r3w02_profile.jpg), [r3w03](qa/r3/r3w03_library.jpg)) |
| W4 | Sáng tác: vào Wizard, thanh tab ẩn (như cũ) | ✅ PASS ([r3w04](qa/r3/r3w04_create_no_tabbar.jpg)) |
| W5 | **Bấm pill Credit → Ví**: có nút Quay lại, tab "Hồ sơ" sáng; chạm pill thêm 2 lần khi đang ở Ví → Quay lại **1 lần** là về Home (không chồng màn) | ✅ PASS ([r3w05](qa/r3/r3w05_wallet_from_pill.jpg)) |
| W6 | **Hồ sơ → Ví & Credit** → Quay lại về Hồ sơ; Bé nhà mình, Trợ giúp mở và quay lại đúng | ✅ PASS |
| W7 | Mục **Chế độ Bé** ở Hồ sơ hiện `Chế độ Bé. Cho Bin đọc truyện, thoát bằng mã PIN` | ✅ PASS |
| W8 | **Bàn phím từ đầu trang:** Tab → logo → credit → avatar, mỗi nút có viền focus 2px; **chạm** nút thì không viền | ✅ PASS |
| W9 | **Enter** kích hoạt tab (Tủ truyện); **Space** kích hoạt tab (Tiến độ); Enter trên pill credit → Ví | ✅ PASS ([r3w07](qa/r3/r3w07_keyboard_focus_tabbar.jpg)) |
| W10 | **Toast dài (3 dòng) ở 390×844:** nằm ở đáy, cách nút Sáng tác 8px, **không chạm header** (đáy header 52px, đỉnh toast 651px); pill credit vẫn nhận chạm; tab bar vẫn nhận chạm khi toast đang hiện | ✅ PASS ([r3w08](qa/r3/r3w08_toast_long_above_tabbar.jpg)) |
| W11 | **Màn nhỏ 320×568:** header và 5 tab đủ trong màn, tab 57×52 | ✅ PASS ([r3w09](qa/r3/r3w09_320x568.jpg)) |
| W12 | **Desktop 1280×800:** thanh tab căn giữa rộng 720px; header rộng đủ như nội dung; không tràn ngang | ✅ PASS ([r3w10](qa/r3/r3w10_desktop_1280.jpg)) |
| W13 | **Số credit dài** `1234567890` và **tên rất dài** (phản hồi `/auth/me` bị sửa trong harness QA, **không phải dữ liệu thật**, không đổi DB; COMPONENT TEST): số dư hiển thị đủ, không bị cắt; pill + avatar nằm trong màn ở 390 và 320px; tên app nhường chỗ (ellipsis); Hồ sơ cắt tên tối đa 2 dòng | ✅ PASS ([r3w_long_header_390](qa/r3/r3w_long_header_390.jpg), [320](qa/r3/r3w_long_header_320.jpg), [r3w_long_profile_320](qa/r3/r3w_long_profile_320.jpg)) |
| W14 | Console / Network: chỉ cảnh báo `props.pointerEvents is deprecated` (có từ trước); không request ≥ 400 ngoài lỗi có chủ đích (401 PIN sai) | ✅ |

---

## 5. Kết quả Android SW_Test

| # | Kịch bản | Kết quả |
|---|---|---|
| A1 | Login Parent → Home. **Safe area:** header bắt đầu ngay dưới status bar (status bar 0–128px, header 149px: chỉ có padding 8dp, **không có khoảng trắng dư**) | ✅ PASS ([r3a01](qa/r3/r3a01_home.jpg)) |
| A2 | Cây trợ năng: header và 5 tab đều là `Button` `clickable=true`; tab đang chọn `selected=true`, các tab khác `false`; mỗi tab 198×136px (≈ 75×52dp) | ✅ PASS |
| A3 | 4 tab chuyển đúng, `selected` đổi theo | ✅ PASS ([r3a02](qa/r3/r3a02_tabs_home.jpg)) |
| A4 | **Pill Credit → Ví**: nút Quay lại, tab Hồ sơ `selected`; chạm pill lặp lại + **Back 1 lần** → về Home, Ví không còn | ✅ PASS ([r3a03](qa/r3/r3a03_wallet_from_pill.jpg)) |
| A5 | **Hồ sơ → Ví & Credit → Back** → về Hồ sơ, tab Hồ sơ `selected` | ✅ PASS ([r3a04](qa/r3/r3a04_profile.jpg), [r3a07](qa/r3/r3a07_back_to_profile.jpg)) |
| A6 | **Toast dài:** nằm ở y 1828–2059px, **trên** nút Sáng tác (đỉnh 2138px); header không bị che; chạm tab Tiến độ khi toast đang hiện vẫn chuyển được | ✅ PASS COMPONENT TEST ([r3a05](qa/r3/r3a05_toast_long.jpg)) |
| A7 | **Toast + bàn phím mở:** thanh tab nằm trên bàn phím, toast nằm trên thanh tab (toast 1113–1239px, đỉnh Sáng tác 1318px) | ✅ PASS COMPONENT TEST ([r3a06](qa/r3/r3a06_toast_keyboard.jpg)) |
| A8 | **Màn nhỏ 360×640dp:** header và 5 tab trong màn (tab 98×78px = 65×52dp), toast dài 3 dòng nằm trên thanh tab | ✅ PASS ([r3a08](qa/r3/r3a08_small_home.jpg), [r3a09](qa/r3/r3a09_small_toast.jpg), [r3a10](qa/r3/r3a10_small_profile.jpg)) |
| A9 | **Điều hướng 3 nút** của Android: thanh tab nằm ngay trên thanh hệ thống, không bị đè | ✅ PASS ([r3a16](qa/r3/r3a16_3button_nav.jpg)) |
| A10 | Thanh điều hướng cử chỉ (mặc định) | ✅ PASS (mọi ảnh còn lại) |
| A11 | **Nút Back:** từ tab Hồ sơ → Trang chủ (app còn mở); từ tab Tủ truyện → Trang chủ; từ Ví (mở bằng pill) → Trang chủ; **ở Trang chủ → thoát app** như cũ | ✅ PASS |

---

## 6. Regression Auth / Kid / PIN / Intro / Logout

| Luồng | Web | Android |
|---|---|---|
| Login Parent → Home | ✅ | ✅ |
| Đổi tab nhiều lần: Intro **không** phát lại | ✅ | ✅ |
| **Kid Mode vào từ mục "Chế độ Bé" ở Hồ sơ** (tài khoản `qa_r1`); thanh tab/header Parent **ẩn** trong Kid | ✅ | ✅ ([r3a12](qa/r3/r3a12_kid_from_profile.jpg)) |
| Khoá PIN hiện (CRIT-1 vẫn ổn) | ✅ | ✅ ([r3a13](qa/r3/r3a13_pin_open.jpg)) |
| **PIN sai** → BE `POST /auth/kid-mode/exit` **401**, "Còn 4 lần thử", vẫn ở Kid | ✅ | ✅ |
| **PIN đúng** → BE **200** → về Parent đúng tab Hồ sơ (nơi bắt đầu), thanh tab hiện lại | ✅ ([r3w11](qa/r3/r3w11_back_from_kid.jpg)) | ✅ ([r3a14](qa/r3/r3a14_after_pin.jpg)) |
| Đăng xuất (nút ở Hồ sơ) → Login, Intro **không** phát lại | ✅ | ✅ ([r3a15](qa/r3/r3a15_after_logout.jpg)) |
| Đăng nhập lại Parent; Intro không phát lại | ✅ | – |
| Màn không đổi: Home, Tủ truyện, EQ, Wallet, Bé nhà mình, Trợ giúp mở được | ✅ | ✅ (Home, Tủ truyện, EQ, Hồ sơ, Ví) |

**Kid Mode với PIN của tài khoản Parent: BLOCKED** (không có PIN, không đoán). Đã kiểm tra bằng tài khoản `qa_r1`.

---

## 7. Lỗi tìm thấy trong lúc kiểm thử (đã sửa và kiểm lại)

| Mã | Mức | Vấn đề | Cách xử lý |
|---|---|---|---|
| FIX-1 | HIGH (do chính R3, chưa từng lên bản chốt) | Toast đặt ở đáy với `marginBottom` → vùng margin nằm trong phần tử nhận chạm → **chặn thanh tab trong 3.5 giây** (`elementFromPoint` trả về không phải nút tab; chạm "Tiến độ" không chuyển tab) | Dời host bằng `bottom` thay vì margin; kiểm lại: tab bar nhận chạm khi toast hiện (W10, A6). Test `navigation.test.ts` chặn tái diễn. |
| FIX-2 | MEDIUM | Pill credit cắt số dư dài (`123456…`) → hiển thị sai số | Không cắt số; tên app nhường chỗ (W13) |
| FIX-3 | MEDIUM | Nút header Web chỉ 40px (Web không áp dụng `hitSlop`) | Kích thước thật 44px (W1) |
| FIX-4 | LOW | Desktop: header căn giữa 720px lệch với nội dung rộng 1280px | Header rộng đủ như nội dung; chỉ thanh tab căn giữa (W12) |
| FIX-5 | MEDIUM | Hồ sơ thành tab nên Back của Android thoát app (trước đây quay lại màn trước) | `backStack`: Back ở tab khác Trang chủ → Trang chủ; kiểm lại ở A11 |

---

## 8. Vấn đề còn mở

| Mã | Mức | Vấn đề | Đề xuất |
|---|---|---|---|
| R3-L1 | LOW | Toast ở đáy có thể che phần dưới nội dung (vd. nút "Thêm vào tủ sách bé" ở hàng cuối) trong 3.5 giây; chạm toast để ẩn | Chấp nhận (như Snackbar). Xem lại ở R7 nếu thấy vướng. |
| R3-L2 | LOW | Toast khi `Sheet` đang mở vẫn bị lớp nền Sheet đè (QA_R2 LOW-2) | Quy ước: đóng Sheet rồi mới `show()` |
| R3-L3 | LOW | Nội dung các màn chưa giới hạn bề rộng trên desktop; chỉ thanh tab nổi được căn giữa | R9 |
| R3-L4 | LOW | `HeyChip` chưa chọn được bằng Space; chưa có `radiogroup` (QA_R2 LOW-5) | R3+ khi redesign từng màn |
| R3-L5 | LOW | Hồ sơ: mục **Trợ giúp** và **Chợ truyện** (chỉ `__DEV__`) nằm cuối danh sách, bị thanh tab nổi che một phần khi chưa cuộn | Đây là hành vi sẵn có của thanh tab nổi; cuộn là thấy |
| INFO | – | Chưa thấy màn nào dùng `HeyButton variant="danger"` / `iconName` ngoài Đăng xuất (R2 INFO) | – |
| INFO | – | Màn Home vẫn dùng emoji trong tiêu đề nút (🪄 👶) — thuộc R5 | R5 |

Không có CRITICAL, HIGH hay MEDIUM còn mở.

---

## 9. Chưa kiểm thử được / giới hạn

- **Toast thật (E2E):** vẫn chỉ kiểm bằng COMPONENT TEST (gọi `show()`). Luồng thêm truyện vào tủ sách đã chạy E2E ở QA R2.1; R3 chỉ đổi vị trí toast.
- **Trình đọc màn hình thật** (TalkBack, NVDA, VoiceOver): NOT VERIFIED. Đã kiểm tra cây trợ năng và thuộc tính (`selected`, `aria-current`, nhãn).
- **iOS:** NOT VERIFIED (không có thiết bị). Phần `SafeAreaView` của host toast và tab bar chưa chạy trên iOS.
- **Máy Android thật:** chỉ chạy emulator. Chưa kiểm tra tai thỏ/camera lỗ, font hệ thống rất lớn (đã giới hạn phóng chữ ở header ×1.3 nhưng chưa thử).
- **Reduce Motion:** thanh tab và header không có chuyển động riêng. Toast vẫn dùng `useReduceMotion` (QA R2).
- **Kid Mode với PIN của tài khoản Parent:** BLOCKED.
- **Sinh truyện AI:** không thuộc R3.
- Emulator: đổi kích thước màn hình và điều hướng 3 nút làm Expo Go khởi động lại (Intro phát lại là đúng). Đã trả về mặc định (`wm size reset`, điều hướng cử chỉ). Mình có tắt tính năng "stylus handwriting" của Gboard trên emulator để bỏ hộp thoại giới thiệu che bàn phím; cài đặt này không ảnh hưởng app.

---

## 10. Kiểm tra kỹ thuật

| Kiểm tra | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ Exit 0 |
| `tests/authRace.test.ts` | ✅ 5/5 |
| `tests/uiStates.test.ts` | ✅ 2/2 |
| `tests/navigation.test.ts` *(mới)* | ✅ 11/11 |
| `npx expo install --check` | ✅ Dependencies are up to date |
| `expo export` Web / Android | ✅ Web 1.27 MB, Android 836 module 2.74 MB (Hermes) |
| Git diff | 8 file trong `apps/mobile/src` + `tests/` + docs. Không sửa BE, Web, App_v2; không thêm dependency. |

### Tương phản (WCAG AA, tính từ Palette)

| Cặp | Tỉ lệ |
|---|---|
| Nhãn tab không chọn `textMuted` / trắng | 6.44 |
| Nhãn tab chọn `brandInk` / `brandTint` | 12.45 |
| Icon tab chọn `brandStrong` / `brandTint` | 4.74 (icon ≥ 3:1) |
| Icon Sáng tác navy / cam | 5.60 |
| Số credit `tealDeep` / `tealTint` | 5.81 |
| Chữ cái avatar `brandInk` / `brandTint` | 12.45 |
| Phụ đề / tiêu đề nhóm `textMuted` / nền | 6.44 / 6.34 |
| Viền focus `#C2410C` / nền kem | 5.10 |
| Icon "Chế độ Bé" trắng / `tealStrong` | 5.24 |
