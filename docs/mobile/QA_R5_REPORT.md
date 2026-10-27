# QA R5 — Parent Home, Đăng nhập/Đăng ký & Mascot cú

> **Ngày:** 2026-10-27 · **Phạm vi:** R5 theo [UI_UX_REDESIGN_PLAN.md](UI_UX_REDESIGN_PLAN.md) §5.2. Tiến độ: [UI_REDESIGN_PROGRESS.md](UI_REDESIGN_PROGRESS.md).
> **Ảnh:** [`qa/r5/`](qa/r5/) (`r5w*` = Web, `r5a*` = Android SW_Test). Không có mật khẩu/PIN/token (ô mật khẩu chỉ hiện dấu chấm).
> **Trạng thái: nghiệm thu tạm thời — chờ chủ dự án duyệt cuối.** Đã rà soát cuối (§13).

---

## 1. Tổng quan

| Mục | Giá trị |
|---|---|
| Phạm vi | Parent Home (hero bé đang chọn + 3 ô số liệu thật), Đăng nhập, Đăng ký, BootScreen, mascot cú (`OwlMascot`, `CuteMascot`); sửa A2, A3, J1 |
| Git | Nhánh `refactor/mobile-frontend-cleanup`, HEAD `9118e7a` (R4 đã commit); working tree sạch trước R5. **Chưa commit/push.** |
| Môi trường | BE local `127.0.0.1:3000` (không sửa BE/DB); Expo Web 8082 + Chrome headless (CDP); Android SW_Test (Expo Go, New Architecture) 1080×2400 và 360×640dp |
| Tài khoản | Chỉ dùng tài khoản test `qa_r1` (1 bé "Bé QA", 1 truyện nháp, số liệu đọc = 0). **Không dùng tài khoản demo Parent.** |
| Mục tiêu | Home nhìn rõ "bé đang chọn", dữ liệu thật; mascot không bịa số liệu, không tiếng cún; Login/Register gọn, tương phản cao, không lộ URL máy chủ ngoài bản dev |

---

## 2. Thay đổi

- **Parent Home:** lời chào → mascot → nút chính "Sáng tác truyện" → thẻ hero bé đang chọn (avatar, tên, 3 ô: phút đọc hôm nay / truyện trên tủ sách / năng lực EQ có dữ liệu, dòng lượt đọc, nút "Vào Chế độ Bé · {tên}") → truyện gần đây → lối tắt Tủ truyện, Hành trình EQ → chuyện mẫu. Số liệu lấy từ `GET /children/:id/overview`; đang tải = skeleton, lỗi = thông báo + "Thử lại". Giữ nguyên props và mọi hành động/route cũ.
- **A2 (mascot bịa số liệu):** `TIPS` viết lại, chỉ nêu việc app thật sự làm; bỏ "12 ⭐" và nút "Sáng Tác AI". Bỏ luôn huy hiệu "Lv.1" bịa trong `OwlMascot`.
- **A3 (tiếng cún):** cú dùng `playSparkle` thay `playPuppy`; cú là nút thật (role button, nhãn, focus ring).
- **J1:** `Máy chủ (dev): {url}` chỉ render khi `__DEV__`; bản thường chỉ hiện cảnh báo khi **chưa cấu hình** API. Link UI Preview cũng chỉ ở dev.
- **Đăng nhập/Đăng ký:** token màu/chữ/bóng, link "Đăng ký ngay"/"Đăng nhập ngay" dùng `brandStrong` (5.18:1), vùng chạm ≥ 44pt (`Pressable` + focus ring), lỗi có icon + `role=alert`, nút có `loading`, **Enter ở ô cuối gửi form** (`HeyInput` thêm `onSubmitEditing`/`returnKeyType`), bỏ emoji trang trí. Logic (validate, AbortController, `authService`) **không đổi**.
- **BootScreen:** token, `role=progressbar`/`alert`.
- **Test mới:** `tests/homeAuth.test.ts` (6 test) + mục trong `tests/README.md`.

## 3. File thay đổi

| File | Loại |
|---|---|
| `src/screens/parent/ParentHomeScreen.tsx` | viết lại |
| `src/components/parent/ChildHeroCard.tsx` | mới |
| `src/components/CuteMascot.tsx`, `src/components/OwlMascot.tsx` | sửa |
| `src/components/ui/HeyInput.tsx` | +2 prop tùy chọn |
| `src/screens/auth/LoginScreen.tsx`, `RegisterScreen.tsx`, `BootScreen.tsx` | UI viết lại, logic giữ |
| `tests/homeAuth.test.ts`, `tests/README.md` | mới / sửa |
| `docs/mobile/QA_R5_REPORT.md`, `UI_REDESIGN_PROGRESS.md`, `qa/r5/` | tài liệu |

Không đụng BE, Web, App_v2, dependency, `package.json`.

---

## 4. QA Web (Chrome headless, Expo Web, 390×844 mobile emulation)

| # | Kiểm tra | Kết quả |
|---|---|---|
| W1 | Login hiển thị đúng; không tràn ngang; link 105×44, nút 300×52 | PASS |
| W2 | Gửi rỗng → lỗi theo ô; sai mật khẩu → "Email/Tên đăng nhập hoặc mật khẩu chưa đúng" (BE 401) trong `role=alert` | PASS |
| W3 | Bật/tắt hiện mật khẩu (`type` đổi password↔text, nhãn "Ẩn mật khẩu") | PASS |
| W4 | Login → Đăng ký → quay lại; Đăng ký: lỗi bắt buộc + lỗi định dạng (tên ngắn, email sai, mật khẩu < 8, nhập lại không khớp) | PASS |
| W5 | Đăng nhập thành công bằng **Enter** ở ô mật khẩu; intro không phát lại | PASS |
| W6 | Home: hero + 3 ô khớp response `/overview` (đều 0 với tài khoản test) | PASS (giá trị ≠ 0: W14, fixture) |
| W7 | Mascot: 7 lần chạm → 6 lời gợi ý khác nhau, không số/⭐; không có "12 ⭐"/"Sáng Tác AI"/"Lv.1"; chạm cú chỉ tạo `AudioContext` (âm tổng hợp), **không phát file âm thanh nào** | PASS |
| W8 | Trạng thái hero: lỗi (chặn `/overview`) → "Thử lại" → hồi phục; đang tải (giữ request) → skeleton có nhãn | PASS |
| W9 | Điều hướng: Truyện chờ xem lại → Tủ truyện; Hành trình EQ → Tiến độ; Sáng tác truyện → wizard; tab về Trang chủ | PASS |
| W10 | Kid Mode từ hero; PIN sai (BE 401, "Còn n lần thử") rồi đúng (BE 200) → về Parent Home | PASS |
| W11 | Bàn phím: 14 lần Tab đi qua header, cú, Sáng tác, Vào Chế độ Bé, truyện, 2 lối tắt, chip — **tất cả có focus ring** | PASS |
| W12 | Responsive 320×568, 768×1024, 1280×800: không tràn ngang | PASS |
| W14 | **Fixture UI (không phải E2E thật):** response `/overview` được sửa trong trình duyệt (không ghi BE/DB): ô số liệu hiện 25 / 7 / 3/5, dòng "3 lượt đọc · 2 hoàn thành hôm nay · 5 lượt đọc xong tổng cộng", "Đọc gần nhất: …". Ảnh `r5w16_hero_fixture_nonzero` (dữ liệu giả, chỉ minh họa UI) | PASS |
| W13 | Console: chỉ cảnh báo có sẵn `props.pointerEvents is deprecated` (thư viện); network lỗi duy nhất là 401 chủ động (sai mật khẩu, PIN sai) | PASS |

## 5. QA Android (SW_Test, Expo Go)

| # | Kiểm tra | Kết quả |
|---|---|---|
| A1 | Login: bố cục, URL dev hiện (đúng vì `__DEV__`), nút/link ≥ 44pt | PASS |
| A2 | Gửi rỗng → lỗi; Login ↔ Đăng ký | PASS |
| A3 | Đăng nhập bằng phím Enter trên bàn phím mềm → Home | PASS |
| A4 | Home: hero, lời chào, tab bar; chạm cú đổi lời gợi ý (lần 1→2 xác nhận bằng dump; lần 3 chỉ xác nhận bằng ảnh) | PASS (một phần, xem Q-1) |
| A5 | Kid Mode từ hero; PIN sai → BE từ chối; PIN đúng → về Home | PASS |
| A6 | 360×640dp: Login, Đăng ký đọc được, không cắt nội dung; Login cuộn tới link Đăng ký | PASS |

## 6. Accessibility

- Cú: role button, nhãn "Cú Lu Lu. Chạm để nghe lời gợi ý khác", bong bóng `aria-live=polite`; lối tắt và truyện gần đây là nút có nhãn "tiêu đề. mô tả".
- Vùng chạm đo thật trên Web: link 44, nút 52, hàng lối tắt 75, cú 72.
- Lỗi form `role=alert` + icon (không chỉ dựa vào màu); focus ring chỉ khi dùng bàn phím (Web); số liệu hero có `accessibilityLabel` "nhãn: giá trị".
- Tương phản: link `brandStrong` 5.18:1; lỗi `danger` trên `dangerTint` 5.0:1; chữ ô số liệu navy/brandInk trên `brandTint` ≥ 12:1 (theo token R1, **không đo lại bằng công cụ trong R5**).
- Reduce Motion: cú/bong bóng dùng Reanimated (tự theo cài đặt hệ thống, đã xác minh ở R2). **NOT VERIFIED riêng cho R5** (không bật Reduce Motion khi chạy).
- Trình đọc màn hình thật (TalkBack/VoiceOver): **NOT VERIFIED**.

## 7. Hồi quy

PASS: đăng nhập thành công/sai/validation, form Đăng ký, Login↔Register, hiện mật khẩu, tab, Kid Mode + PIN qua BE, intro không phát lại sau đăng nhập, font (Comfortaa/Nunito hiển thị đúng trên Web và Android), điều hướng từ Home.
NOT RUN: đăng xuất → đăng nhập lại ở R5 (không đổi code, đã PASS ở R3), Android Back, Ví từ header (không đụng R3), session bootstrap sau khởi động lạnh (xem Q-2).

## 8. Kiểm tra tự động

| Lệnh (từ `apps/mobile`) | Kết quả |
|---|---|
| `npx tsc --noEmit` | PASS (exit 0) |
| `homeAuth` / `kidUi` / `navigation` / `uiStates` / `authRace` (`tsc` → `node`, cách chạy trong `tests/README.md`) | PASS 6/6, 5/5, 11/11, 2/2, 5/5 |
| `npx expo install --check` | PASS ("Dependencies are up to date") |
| `npx expo export --platform web` | PASS |
| `npx expo export --platform android` | PASS (Hermes bundle 2.76 MB) |

Lưu ý (đã xử lý, §13): `tsc` biên dịch riêng `authRace.test.ts` từng báo `__DEV__`/`process` chưa khai báo; nguyên nhân là lệnh chạy riêng thiếu kiểu RN/Node. Tsc/bundle chỉ chứng minh biên dịch, không thay cho chạy thật ở §4–5.

## 9. Lỗi tìm thấy và đã sửa

| Mã | Vấn đề | Xử lý |
|---|---|---|
| A2 | Tip mascot bịa "12 ⭐" và nhắc nút "Sáng Tác AI" | Viết lại `TIPS`; test chặn tái diễn |
| A3 | Chạm cú phát tiếng cún | `playSparkle`; test chặn |
| J1 | URL máy chủ hiện cho người dùng cuối | Chỉ `__DEV__`; test kiểm chỉ có 1 nơi render `{apiBaseUrl}` |
| R5-1 | `OwlMascot` có huy hiệu "Lv.1" bịa | Gỡ |
| R5-2 | `tsc`: `Elevation` (có `overflow: 'scroll'`) không gán được vào style `Image` | Bọc logo trong `View` mang bóng |
| R5-3 | Link Login/Register nhỏ hơn 44pt, `TouchableOpacity` không có focus ring | `Pressable` + `focusRing`, `minHeight: Touch.min` |

Các "lỗi" do công cụ QA (lớp intro che app sau reload, listener Fetch cũ làm hỏng request, gõ email Android bị méo) đã được sửa trong script QA, không phải lỗi app.

## 10. Vấn đề còn tồn tại

- **CRITICAL / HIGH:** không có.
- **MEDIUM:** không có.
- **LOW**
  - **H-1** Hero với dữ liệu **demo thật** ≠ 0 chưa kiểm (không dùng tài khoản demo; giá trị ≠ 0 chỉ qua fixture W14).
  - **Q-1** Android: chỉ xác nhận lời gợi ý #2 bằng dump UI (lời #3 chứa dấu nháy kép nên regex của script không khớp; ảnh `r5a06` có chụp).
- **INFO**
  - **Q-2** Sau khi đổi `wm size` trên emulator (Activity tạo lại, intro chạy lại), app hiện Login thay vì Home. **Nguyên nhân chưa biết, chưa điều tra** (có thể do Expo Go reload, cách lưu phiên native, hoặc thao tác QA); **không giả định K1**. Không do code R5 sửa (R5 không đụng phiên), nhưng chưa tái hiện riêng để chứng minh. Không refactor phiên trong R5; xác minh riêng sau (trước demo).
  - `SettingsScreen` ("Máy chủ") và `AuthModal` vẫn hiện URL máy chủ — ngoài phạm vi J1/Login; để R sau.
  - J1 ở **bản không phải dev** chỉ xác minh bằng mã + test (`__DEV__` luôn true trong Expo dev server); chưa chạy bản production.

## 11. Giới hạn đã biết

iOS, thiết bị thật, TalkBack/VoiceOver, Reduce Motion bật thật, đọc truyện thật E2E (R4.1, hoãn, bắt buộc xong trước demo/không muộn hơn R9), Home với dữ liệu demo thật. Âm thanh cú chỉ xác nhận trên Web (không có file phát); Android chưa nghe thử. Ảnh `r5a*` chụp trên emulator; ảnh Web do Chrome headless.

## 12. Đề xuất nghiệm thu

Code R5 đủ phạm vi, kiểm tự động sạch, Web + Android chạy thật không có lỗi CRITICAL/HIGH/MEDIUM. **Nghiệm thu tạm thời; chờ chủ dự án duyệt cuối**, kèm các mục LOW/INFO ở §10. Chưa commit/push.

---

## 13. Rà soát cuối (cùng ngày)

- **Fixture W14:** xem §4. Chỉ sửa response trong trình duyệt; BE/DB không bị ghi; kết quả tách biệt khỏi E2E thật.
- **`authRace` `tsc` riêng:** thêm `--types react-native,node` vào lệnh trong `tests/README.md` → `tsc` exit 0, test vẫn PASS 5/5. **Không đổi mã nguồn hay logic Auth** (chỉ tài liệu lệnh chạy).
- **Phiên Android:** ghi ở Q-2, không giả định nguyên nhân.
- **R4.1:** vẫn **NOT RUN / DEFERRED**; không tạo DB; xem QA_R4_REPORT §12.
- **Không đo/xác minh:** production build, iOS, TalkBack/VoiceOver thật, phần cứng âm thanh, R4.1 E2E.
- Không có file nguồn thay đổi trong đợt rà soát này nên không chạy lại bộ kiểm tĩnh đầy đủ; kết quả §8 là từ lần chạy trước trên cùng mã nguồn.
