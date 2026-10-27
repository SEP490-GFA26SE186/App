# QA R1 — Design Tokens + Shared UI Components

> **Loại:** Review/QA (không sửa code trong lượt này).
> **Ngày:** 2026-10-27 · **Phạm vi:** thay đổi R1 ghi tại [UI_REDESIGN_PROGRESS.md](UI_REDESIGN_PROGRESS.md), so với thiết kế ở [UI_UX_REDESIGN_PLAN.md](UI_UX_REDESIGN_PLAN.md) §4 A.
> **Ảnh chụp:** [`qa/r1/`](qa/r1/) (JPEG thu nhỏ; `a*` = Android, `w*` = Web).

---

## 1. Kết luận nghiệm thu

> **Cập nhật 2026-10-27 (QA sau đăng nhập, §11):**
> - **Kết luận: R1 ĐẠT** về mặt thay đổi R1. HIGH-1 và LOW-1 đã sửa (§10). HIGH-2 đã kiểm tra xong. HIGH-3 đã sửa (§11).
> - Phát hiện một lỗi **CRITICAL có sẵn từ trước R1, không do R1 gây ra**: trên Android (Expo Go, New Architecture), modal PIN thoát Kid Mode không hiển thị (CRIT-1, §11.5). Cần tách thành task riêng trước demo hoặc trước R2/R4.
>
> *Phần dưới đây là kết luận ban đầu của lượt QA, giữ nguyên để đối chiếu.*

**R1 ĐẠT CÓ ĐIỀU KIỆN.**

- Kiểm tra kỹ thuật đạt hết: TypeScript, test, dependencies, bundle Web và Android.
- Phần quan sát được trên thiết bị đúng Design System R1. Không thấy regression ở Intro, Login, Register, Back, Kid Mode (Preview) và luồng điểm dừng EQ.
- **Không có lỗi CRITICAL.**

Còn **2 điều kiện** trước khi chốt R1 và sang R2:

1. **[HIGH-1] Sửa dải trống 48.8dp đầu màn Android** (`Screen.tsx`). Nguyên nhân đã xác định ở §4. Lỗi có sẵn từ commit HEAD chứ không do R1 gây ra, nhưng nằm trong component dùng chung mà R2 sẽ dựa vào và ảnh hưởng mọi màn. Sửa một dòng, rủi ro thấp.
2. **[HIGH-2] Kiểm tra trực quan các component R1 chỉ xuất hiện sau đăng nhập.** `HeyCard`, `HeyChip`, `Badge`, `StateView`, `ScreenHeader`, `Sheet`, cũng như Comfortaa trên Android, chưa được nhìn thấy trên thiết bị vì **không có phiên hợp lệ**. Cần người dùng cung cấp tài khoản test, hoặc cho phép tạo tài khoản trên BE dev.

Ngoài ra nên làm kèm **[LOW-1]**: khôi phục dòng comment đầu file `Screen.tsx` mà R1 lỡ xóa.

---

## 2. Môi trường kiểm thử

| Hạng mục | Giá trị |
|---|---|
| Android | AVD `SW_Test`, Android 37 (`google_apis_playstore_ps16k`, x86_64), 1080×2400, 420 dpi (1dp = 2.625px), Expo Go 2.32.19 |
| Web | Chrome headless (bản cài sẵn trên máy), điều khiển qua DevTools Protocol bằng script Node, không cài package. Viewport điện thoại 390×844 @2x (giả lập chạm) và desktop 1280×800 |
| Metro | `CI=1 EXPO_PUBLIC_API_URL=http://localhost:3000 npx expo start --port 8081`. Biến môi trường chỉ đặt cho tiến trình, **không ghi file `.env`** |
| Backend | BE local `node src/server.js` (port 3000) đang chạy sẵn, `/api/v1/health` → `ok`. Chỉ gửi **một** request đăng nhập với thông tin sai, không tạo dữ liệu |
| Phiên đăng nhập | **Không có.** Không có tài khoản test, và không tự Register vì sẽ ghi dữ liệu thật vào DB |
| Lưu ý | Expo Go **luôn bật New Architecture** (cảnh báo khi chạy); `app.json` không khai báo `newArchEnabled` |

---

## 3. Kết quả kiểm tra kỹ thuật

| Kiểm tra | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ Exit 0 |
| `tests/authRace.test.ts` | ✅ 5/5 PASS |
| `npx expo install --check` | ✅ "Dependencies are up to date" |
| `expo export` Web | ✅ 414–496 module, bundle 1.14 MB |
| `expo export` Android | ✅ 818 module, Hermes bundle 2.68 MB, đủ 6 font |
| `package.json` / lockfile / `app.json` | Có thay đổi chưa commit (`expo-video`), nhưng **có từ trước R1** (thời điểm sửa 22:15, trước khi R1 bắt đầu). R1 không đụng |
| Console Web | 1 cảnh báo: `props.pointerEvents is deprecated` (từ `App.tsx`, có sẵn trong HEAD) |

---

## 4. Điều tra dải trống đầu màn Android (ưu tiên)

### Hiện tượng
Mọi màn trên Android có một vùng trống màu kem giữa thanh trạng thái và nội dung (ảnh [a03_login](qa/r1/a03_login.jpg), [a10_kid_shelf](qa/r1/a10_kid_shelf.jpg)).

### Đính chính số liệu
Báo cáo R1 ghi "~95dp", **không chính xác**: con số đó đo từ mép trên màn hình, tức là gồm cả chính thanh trạng thái. Phần trống **thừa** thực tế là **128px = 48.8dp**, đúng bằng chiều cao status bar.

### Bằng chứng (uiautomator dump + dumpsys window)

| View | Toạ độ Y bắt đầu |
|---|---|
| Status bar hệ thống (`InsetsSource type=statusBars`) | `frame=[0,0][1080,128]` |
| `android:id/content` (root React) | **128** (hệ thống đã đặt nội dung dưới status bar) |
| `Screen` (SafeAreaView) | 128 |
| Nội dung Login (ScrollView) | **256** = 128 + `paddingTop` 128 |

### Nguyên nhân gốc
`src/components/ui/Screen.tsx`:
```ts
paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
```
Dòng này cộng **lần thứ hai** chiều cao status bar, vì:
- `StatusBar` không đặt `translucent` (mặc định `false`), và `app.json` không cấu hình `androidStatusBar`. Hệ thống tự đặt nội dung dưới status bar.
- `targetSdk = 34` (`react-native/gradle/libs.versions.toml`), nên Android 15+ **không ép** chế độ edge-to-edge. Bản build thật sẽ hành xử giống Expo Go, nghĩa là lỗi không chỉ xảy ra trên Expo Go.
- `SafeAreaView` của React Native core trên Android không thêm inset, nên không bù trừ được.

Dòng này có sẵn trong commit HEAD (`git show HEAD:apps/mobile/src/components/ui/Screen.tsx`); **R1 không thêm**, R1 chỉ đổi màu nền.

### Đề xuất sửa (chưa làm)
Bỏ `paddingTop` khỏi `Screen` (hoặc chỉ cộng khi `StatusBar` được đặt `translucent`). Nếu sau này chuyển sang edge-to-edge (nâng targetSdk, cần quyết định riêng) thì dùng `react-native-safe-area-context`, **đã có sẵn** trong `package.json`. Kiểm tra lại: mọi màn Android, Intro, Kid Preview, Sheet/Modal, Web và iOS (Web/iOS không bị ảnh hưởng vì nhánh chỉ áp dụng cho Android).

---

## 5. Kết quả theo màn hình

### 5.1 Android (SW_Test)

| # | Màn / luồng | Ảnh | Kết quả |
|---|---|---|---|
| 1 | Intro: đang tải (khung đen + "Bỏ qua") | [a01](qa/r1/a01_intro_start.jpg) | ✅ Nút Bỏ qua hiện ngay |
| 2 | Intro: video phát | [a02](qa/r1/a02_intro_playing.jpg) | ✅ Font gate của R1 không chặn Intro |
| 3 | Bấm **Bỏ qua** → Login | [a03](qa/r1/a03_login.jpg) | ✅ Chuyển đúng. Nền kem đồng nhất (hết dải lệch màu đã sửa trong R1); còn dải trống 48.8dp (§4) |
| 4 | Login: focus ô mật khẩu + bàn phím | [a04](qa/r1/a04_login_focus_keyboard.jpg) | ✅ Viền focus `brandStrong`. ⚠️ Bàn phím che nút Đăng nhập (MED-1) |
| 5 | Login: gửi thông tin sai tới BE thật | [a05](qa/r1/a05_login_loading.jpg), [a06](qa/r1/a06_login_be_error.jpg) | ✅ Hiện lỗi thật từ BE, xoá mật khẩu đúng thiết kế. Không chụp được trạng thái loading vì BE trả lời dưới 0.4s |
| 6 | Register | [a07](qa/r1/a07_register_top.jpg) | ✅ |
| 7 | Register: gửi form trống | [a08](qa/r1/a08_register_validation.jpg), [a09](qa/r1/a09_register_validation_bottom.jpg) | ✅ Lỗi đỏ theo từng ô, nút teal đậm chữ trắng, link teal 5.24:1 |
| 8 | Phím **Back** ở Register | – | ✅ Về Login, app không thoát |
| 9 | Kid UI Preview: tủ sách | [a10](qa/r1/a10_kid_shelf.jpg) | ✅ Nút cam chữ navy. Cây trợ năng (`uiautomator --compressed`): lớp Login bên dưới **được ẩn đúng** |
| 10 | Kid: trình đọc | [a11](qa/r1/a11_kid_reader.jpg) | ✅ Chữ đọc rõ; "Trả lời câu hỏi" nền teal đậm chữ trắng |
| 11 | Kid: điểm dừng EQ → chọn cảm xúc → Tiếp tục | [a12](qa/r1/a12_kid_checkpoint.jpg), [a13](qa/r1/a13_kid_checkpoint_result.jpg) | ✅ Luồng chạy trọn |
| 12 | Phím **Back** ở Preview | – | ✅ Đóng Preview về Login, app không thoát |

### 5.2 Expo Web

| # | Màn / luồng | Ảnh | Kết quả |
|---|---|---|---|
| 1 | Intro (390px) | [w01](qa/r1/w01_mobile_intro.jpg) | ✅ |
| 2 | **Bỏ qua** | – | ✅ Bằng bàn phím (Tab → focus nút → Enter) và `button.click()`: overlay mờ rồi được gỡ sau ~0.5s, không lỗi console. ⚠️ Chạm giả lập của Chrome headless không kích hoạt được thẻ `<button>` HTML thuần; đây là giới hạn của môi trường giả lập (các nút RN-web như "Đăng ký ngay" nhận chạm bình thường) |
| 3 | Login | [w02](qa/r1/w02_mobile_login.jpg) | ✅ |
| 4 | Login: gửi form trống | [w03](qa/r1/w03_mobile_login_validation.jpg) | ✅ Lỗi đỏ |
| 5 | Focus bàn phím | [w04](qa/r1/w04_mobile_login_tabfocus.jpg) | ✅ Thấy viền focus (mặc định của trình duyệt). Chưa có focus ring theo thương hiệu (L2, R2) |
| 6 | Register | [w05](qa/r1/w05_mobile_register.jpg) | ✅ Không cuộn ngang |
| 7 | Kid Preview: tủ sách / đọc | [w06](qa/r1/w06_mobile_kid_shelf.jpg), [w07](qa/r1/w07_mobile_kid_reader.jpg) | ✅ |
| 8 | Desktop 1280: Login | [w08](qa/r1/w08_desktop_login.jpg) | ✅ Thẻ Login giới hạn 420px |
| 9 | Desktop 1280: Kid tủ sách | [w09](qa/r1/w09_desktop_kid_shelf.jpg) | ⚠️ Thẻ kéo giãn toàn bề rộng, bìa bị cắt thành dải thấp (MED-4) |

### 5.3 Chưa kiểm tra được (cần phiên hợp lệ)
Parent Home, Tủ truyện, Story Wizard, Story Detail + Reader phụ huynh, EQ Report, Wallet, Bé nhà mình, Nhân vật, Cài đặt, Trợ giúp, `HeyTopBar`, `HeyTabBar`, Kid Mode thật (PIN, BE). Do đó **chưa nhìn thấy trên thiết bị**: `HeyCard`, `HeyChip`, `Badge`, `StateView`, `ScreenHeader`, `Sheet` và Comfortaa trên Android.

---

## 6. Đối chiếu với Design System R1

| Hạng mục | Thiết kế R1 | Thực tế | Kết quả |
|---|---|---|---|
| Nền | `canvas #FFFDF9` | Kem đồng nhất trên Login, Register, Kid (Android + Web) | ✅ |
| Nút chính | Cam `#FF7A00` + chữ navy (5.6:1) | Đúng (a06, w03) | ✅ |
| Nút teal | `#007A6E` + chữ trắng (5.24:1) | Đúng (Register, Kid "Trả lời câu hỏi", "Tiếp tục") | ✅ |
| Lỗi form | `danger #BA1A1A` chữ + viền | Đúng (a08, w03) | ✅ |
| Focus ô nhập | `brandStrong #C2410C` | Đúng (a04) | ✅ |
| Viền ô nhập | `outlineStrong #A38B73`, 1.5px | Đúng | ✅ |
| Font Nunito Sans | Nhãn SemiBold 14, ô nhập Regular 16, nút ExtraBold, `fontWeight` 400 | Web đo bằng `getComputedStyle`: khớp hoàn toàn, không faux-bold. Android: nhìn khớp (a04, a06) | ✅ |
| Font Comfortaa | Tiêu đề `ScreenHeader`, `Typography.title/display` | Web: `@font-face` đăng ký, tải được, hiển thị đúng chữ tiếng Việt (đo bề rộng). Android: chưa thấy (§5.3) | ⏳ |
| Vùng chạm | ≥ 44pt Parent / ≥ 56pt Kid | Ô nhập 48dp, nút hiện/ẩn mật khẩu 44×48dp, nút chính 52dp, thẻ truyện Kid 182×219dp, nút cảm xúc 84×85dp | ✅ (component dùng chung) |
| Elevation | Theo nền tảng, không phụ thuộc `boxShadow` | Không kiểm chứng được khác biệt trên Expo Go (luôn bật New Architecture, `boxShadow` vẫn chạy). Cần bản build thật để xác nhận | ⏳ |
| Trộn font | Màn chưa redesign vẫn dùng font hệ thống | Đúng như ghi nhận (tiêu đề "StoryWeaver", "Đăng nhập tài khoản") | ℹ️ Chuyển tiếp |

---

## 7. Danh sách vấn đề

Cột **Nguồn**: *R1* = do thay đổi R1; *Có sẵn* = tồn tại từ trước R1 (xác minh bằng HEAD hoặc đã có trong audit).

### CRITICAL
Lượt QA đầu không phát hiện. **CRIT-1** (có sẵn trước R1) được phát hiện ở lượt QA sau đăng nhập, xem §11.5.

### HIGH

| Mã | Vấn đề | Nguồn | File | Đề xuất / đợt |
|---|---|---|---|---|
| HIGH-1 | Dải trống thừa **48.8dp** đầu mọi màn Android do `paddingTop: StatusBar.currentHeight` (§4) | Có sẵn | `components/ui/Screen.tsx` | ✅ **Đã sửa** (§10) |
| HIGH-2 | Chưa kiểm tra trực quan các component R1 dùng sau đăng nhập (`HeyCard`, `HeyChip`, `Badge`, `StateView`, `ScreenHeader`, `Sheet`) và Comfortaa trên Android | Phạm vi QA | – | ✅ **Đã kiểm tra** (§11) |
| HIGH-3 | Link "Đăng ký ngay" màu `Colors.primary` trên nền trắng: **2.61:1** (chưa đạt AA; trước R1 là 1.38:1) | Có sẵn (R1 cải thiện một phần) | `screens/auth/LoginScreen.tsx` | ✅ **Đã sửa** → `Colors.brandStrong`, 5.18:1 (§11) |

### MEDIUM

| Mã | Vấn đề | Nguồn | File | Đợt |
|---|---|---|---|---|
| MED-1 | Bàn phím Android che nút "Đăng nhập ngay" (`KeyboardAvoidingView behavior=undefined` trên Android) | Có sẵn | `LoginScreen.tsx`, `RegisterScreen.tsx` | R5 |
| MED-2 | Hộp lỗi Login/Register `#DC2626` trên `#FEE2E2`: **3.95:1** (< 4.5, chữ 12px) | Có sẵn | `LoginScreen.tsx:282-290`, `RegisterScreen.tsx:287-295` | R5 (dùng `Colors.danger/dangerTint` = 5.0:1) |
| MED-3 | Tagline Login `#F57F17` trên `#FFF9C4`: **2.47:1** | Có sẵn | `LoginScreen.tsx:242` | R5 |
| MED-4 | Web desktop: Kid tủ sách kéo giãn 1280px, bìa bị cắt (chưa có `maxContentWidth`) | Có sẵn (I1) | `KidModeScreen.tsx` | R9 |
| MED-5 | Vùng chạm nhỏ ở cấp màn hình: "← Đăng nhập" (Register) **28.6dp**, "← Tủ truyện" (Kid) **30.5dp**, "Thoát Preview" **26.7dp** | Có sẵn | `RegisterScreen.tsx`, `KidModeScreen.tsx` | R4 / R5 |
| MED-6 | Expo Go luôn bật New Architecture còn `app.json` không bật, nên giao diện Expo Go có thể khác bản build (I4) | Có sẵn | `app.json` | Cần người dùng quyết định |

### LOW

| Mã | Vấn đề | Nguồn | File | Đợt |
|---|---|---|---|---|
| LOW-1 | R1 xoá mất dòng comment đầu file `// apps/mobile/src/components/ui/Screen.tsx` (vi phạm quy tắc giữ comment) | **R1** | `components/ui/Screen.tsx` | ✅ **Đã khôi phục** (§10) |
| LOW-2 | Placeholder `#6B7280` (4.83:1) khá đậm, ví dụ "Mẹ Lan Phương" dễ bị nhầm là giá trị đã nhập | **R1** | `theme/colors.ts` (`textPlaceholder`) | R2: cân nhắc giữ màu nhưng thêm tiền tố "VD:" ở màn, hoặc dùng sắc trung gian vẫn ≥ 4.5 |
| LOW-3 | URL máy chủ hiển thị ở Login cho người dùng cuối | Có sẵn (J1) | `LoginScreen.tsx` | R5 |
| LOW-4 | Emoji trong nút (🚀, 🧪) hiển thị khác nhau giữa Android và Web | Có sẵn (D1) | nhiều màn | R2 (Icon) |
| LOW-5 | Cảnh báo Web `props.pointerEvents is deprecated` | Có sẵn | `App.tsx` | R9 |
| LOW-6 | Expo Go trên SW_Test là 2.32.19 (CLI khuyến nghị 2.32.20); CLI dừng ở chế độ không tương tác nên phải mở bằng deep link | Môi trường | – | Không ảnh hưởng app |

---

## 8. Kiểm tra regression

| Chức năng | Android | Web | Ghi chú |
|---|---|---|---|
| Intro phát video | ✅ | ✅ | |
| Nút Bỏ qua | ✅ (chạm) | ✅ (bàn phím, click) | |
| Font gate không chặn app | ✅ | ✅ | Intro/Login hiện bình thường |
| Login: validate | ✅ | ✅ | |
| Login: gọi BE thật, lỗi thật | ✅ | – | |
| Register: validate | ✅ | ✅ (hiển thị) | Không gửi form hợp lệ (tránh tạo dữ liệu) |
| Back: Register → Login | ✅ | – | |
| Back: đóng Preview | ✅ | – | |
| Kid Preview: tủ sách → đọc → điểm dừng → tiếp tục | ✅ | ✅ (tủ sách, đọc) | |
| Ẩn lớp dưới khỏi trình đọc màn hình khi mở Preview | ✅ | – | |
| Session / token / Kid Mode thật / PIN | ⏳ | ⏳ | Cần tài khoản |
| Navigation Parent (tab, màn con) | ⏳ | ⏳ | Cần tài khoản |

---

## 9. Việc cần làm trước R2

1. ~~**HIGH-1 + LOW-1**~~ ✅ Đã xong (§10).
2. **HIGH-2**: người dùng cung cấp tài khoản test (hoặc cho phép tạo tài khoản trên BE dev) để chụp và kiểm tra Parent Home, Tủ truyện, EQ, Wallet, Bé nhà mình, các Sheet, cùng Kid Mode thật với PIN.
3. *(Tuỳ chọn)* HIGH-3: đổi link "Đăng ký ngay" sang `Colors.brandStrong`, hoặc để R5 xử lý.

---

## 10. R1 QA Fix — HIGH-1 + LOW-1 (2026-10-27)

### Thay đổi (1 file: `src/components/ui/Screen.tsx`)

| | Trước | Sau |
|---|---|---|
| Padding đầu | `paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0` | **Bỏ**: hệ thống đã đặt nội dung dưới status bar |
| `StatusBar` | `translucent` không khai báo (mặc định `false`) | `translucent={false}` khai báo tường minh (**hành vi không đổi**), kèm comment giải thích, để giả định "không edge-to-edge" hiện rõ trong code |
| Import | `Platform` | Bỏ `Platform` (không còn dùng) |
| Comment đầu file | Bị R1 xoá | Khôi phục `// apps/mobile/src/components/ui/Screen.tsx` (diff với HEAD không còn dòng này) |

Không đổi: navigation, Intro, auth, API, business logic, New Architecture, dependency. `Screen` là nơi duy nhất trong mã nguồn dùng `StatusBar.currentHeight` hoặc tự cộng inset (đã grep).

### Đo lại vị trí (uiautomator, Android SW_Test, 1dp = 2.625px)

| Màn | Mốc | Trước (px) | Sau (px) | Chênh |
|---|---|---|---|---|
| Mọi màn | `android:id/content` (root React) | 128 | 128 | 0 (không đổi, đúng) |
| Login | ScrollView nội dung | 256 | **128** | −128 (−48.8dp) |
| Login | "Đăng nhập tài khoản" | 951 | 823 | −128 |
| Register | ScrollView nội dung | 256 | **128** | −128 |
| Register | "← Đăng nhập" | 298 | 170 | −128 |
| Kid Preview | Banner "UI Preview" | 271 | 143 | −128 |
| Kid Preview | "Chào Bé Bin" | 411 | 283 | −128 |
| Kid Reader | "← Tủ truyện" | ~572 | 444 | −128 |
| Kid Reader | Nút "Trả lời câu hỏi" (bám đáy) | ~2181 | 2180 | 0 → **vùng đọc rộng thêm 128px** |
| Intro (overlay ngoài `Screen`) | Nút "Bỏ qua" | ~2178 (tâm) | 2186 (đỉnh) | Không ảnh hưởng |

**Khoảng cách root → nội dung: 128px trước → 0px sau.** Khoảng trống thừa đã hết.

### Ảnh trước/sau

| Màn | Trước | Sau |
|---|---|---|
| Intro | [a01](qa/r1/a01_intro_start.jpg) | [b01](qa/r1/b01_intro_after.jpg) |
| Login | [a03](qa/r1/a03_login.jpg) | [b02](qa/r1/b02_login_after.jpg) |
| Register | [a07](qa/r1/a07_register_top.jpg) | [b03](qa/r1/b03_register_after.jpg): form vừa trọn một màn, thấy nút "Hoàn tất đăng ký" mà không cần cuộn |
| Kid Preview | [a10](qa/r1/a10_kid_shelf.jpg) | [b04](qa/r1/b04_kid_preview_after.jpg): banner sát ngay dưới status bar, không đè icon hệ thống |
| Kid Reader | [a11](qa/r1/a11_kid_reader.jpg) | [b05](qa/r1/b05_kid_reader_after.jpg) |

*Ảnh "trước" là ảnh của lượt QA, chụp trên cùng mã nguồn và cùng emulator, ngay trước khi sửa.*

### Regression

| Kiểm tra | Kết quả |
|---|---|
| Intro phát, nút Bỏ qua (Android: chạm; Web: Tab + Enter) | ✅ |
| Login hiển thị, Register hiển thị | ✅ |
| Back: Register → Login | ✅ |
| Kid Preview: tủ sách → đọc → "Trả lời câu hỏi" → điểm dừng hiện | ✅ |
| Back: đóng Preview về Login, app không thoát | ✅ |
| Web 390px: vị trí nội dung Login (hàng pixel đầu tiên có nội dung) | ✅ 72px, **giống hệt trước khi sửa** |
| Web: font, không cuộn ngang, Register | ✅ Không đổi |
| `npx tsc --noEmit` | ✅ Exit 0 |
| `tests/authRace.test.ts` | ✅ 5/5 |
| `npx expo install --check` | ✅ Up to date |
| `expo export` Web / Android | ✅ 493 / 818 module |

### Chưa kiểm tra được
Màn sau đăng nhập (Parent, Kid Mode thật) và Modal/Sheet: vẫn chờ HIGH-2. `Modal` của React Native không nằm trong `Screen`, nên không chịu ảnh hưởng của thay đổi này.

---

## 11. QA sau đăng nhập (HIGH-2) + sửa HIGH-3 (2026-10-27)

### 11.1 Xác minh database là local (trước khi tạo dữ liệu)

| Kiểm tra | Kết quả |
|---|---|
| Cấu hình DB của BE (`BE/.env`, chỉ đọc theo dạng **che giá trị**, không in mật khẩu) | Host `127.0.0.1`, cổng `5432`, DB `storyweaver` |
| Biến Supabase | Rỗng |
| Kết nối thực tế của tiến trình BE (cổng 3000) | Chỉ tới `127.0.0.1:5432`, dịch vụ Windows `postgresql-x64-18` |
| `AI_PROVIDER` | `mock` |

→ **LOCAL, đã xác minh.** Không có kết nối tới Supabase, staging hay production. Không đổi schema, không xóa dữ liệu có sẵn, không sửa source BE.

*Ghi chú:* BE chỉ cho phép CORS từ `http://localhost:8082`, nên QA Web chạy trên server Expo Web có sẵn ở cổng 8082. Android chạy qua Metro 8081 kèm `adb reverse`.

### 11.2 Dữ liệu test (tối thiểu, tạo qua giao diện Mobile)

| Dữ liệu | Giá trị |
|---|---|
| Tài khoản | username `qa_r1_1d2cf7` · email `qa.r1.1d2cf7@example.com` (tài khoản test mới, không phải tài khoản thật) |
| Hồ sơ bé | "Bé QA" |
| Mã PIN Kid Mode | Đã đặt qua màn Cài đặt (BE lưu và kiểm tra) |
| Nhân vật | "Bé QA" |
| Truyện | "Truyện QA R1", trạng thái bản nháp |
| Credit | 3 (không đổi, xem §11.6) |

Mật khẩu và PIN **không ghi trong báo cáo**. Ảnh chụp không chứa mật khẩu hay PIN: ô mật khẩu luôn bị che, PIN chỉ hiện dạng chấm.

### 11.3 Sửa HIGH-3 (chỉ đổi màu)

- **File:** `src/screens/auth/LoginScreen.tsx`, style `registerLink`.
- **Thay đổi:** `color: Colors.primary` → `color: Colors.brandStrong` (`#C2410C`).
- **Tương phản trên nền trắng:** 2.61:1 → **5.18:1**, đạt AA.
- **Không đổi gì khác:** cỡ chữ, độ đậm, layout và logic giữ nguyên.
- **Xác minh trên Web:** màu render là `rgb(194, 65, 12)` ([p01](qa/r1/p01_web_login_highfix.jpg), [p25](qa/r1/p25_web_after_logout.jpg)).

### 11.4 Kết quả theo màn (tài khoản test thật, BE local)

Ký hiệu ảnh: `p*` = Web 390px, `c*` = Android SW_Test (Expo Go), `h*` = Android chạy bản HEAD trước R1 để đối chứng.

| Màn / component R1 | Web | Android | Ảnh |
|---|---|---|---|
| Login (HIGH-3) → Parent Home | ✅ | ✅ | p01, p02, c01 |
| Parent Home: `HeyCard`, header, avatar | ✅ | ✅ | p02, p19, c01 |
| Màn "Thêm" | ✅ | ✅ | p24, c02 |
| Quản lý bé: `StateView` rỗng, `ScreenHeader` (nút quay lại 44pt) | ✅ | ✅ | p03, p06, c03 |
| `Sheet` thêm bé, lỗi validate màu đỏ, nút đóng 44pt | ✅ | ✅ | p04, p05, c04, c05 |
| Cài đặt: đặt PIN, `Badge` "Đã đặt" | ✅ | ✅ | p07, p08, c06 |
| Wizard tạo truyện, `Sheet` thêm nhân vật | ✅ | – | p09–p13 |
| Chi tiết truyện, `Badge` trạng thái | ✅ | – | p14 |
| Tủ truyện: lọc `HeyChip`, tìm kiếm `HeyInput`, `StateView` "Không có truyện phù hợp" | ✅ | ✅ | p15, p16, c07 |
| Tiến độ EQ (`StateView` rỗng) | ✅ | ✅ | p17, c08 |
| Credit / Ví: `Badge` "Đang dùng" | ✅ | ✅ | p18, c09 |
| Kid Mode thật: vào, tủ sách rỗng | ✅ | ✅ | p20, c10 |
| Kid Mode: PIN sai (BE trả 401, hiện "Còn 4 lần thử") → PIN đúng → về Parent | ✅ | ❌ **CRIT-1** | p21–p23, c11, c11b, c12 |
| Đăng xuất → Login → đăng nhập lại | ✅ | ✅ | p25, p26, c13 |
| Font Comfortaa và Nunito Sans | ✅ | ✅ Comfortaa render ở tiêu đề `ScreenHeader` và `Sheet` | – |

**Intro (yêu cầu: không phát lại khi đăng xuất hoặc chuyển tab):**

| Thao tác | Web | Android |
|---|---|---|
| Chuyển 4 tab | ✅ Không phát lại | ✅ Không phát lại |
| Vào và thoát Kid Mode | ✅ Không phát lại | – (không thoát được, CRIT-1) |
| Đăng xuất | ✅ Không phát lại | ✅ Không phát lại |
| Đăng nhập lại | ✅ Không phát lại | ✅ Không phát lại |
| Tải lại trang hoặc khởi động lại app | Có phát (lần mở app mới, đúng thiết kế) | Có phát (lần mở app mới, đúng thiết kế) |

### 11.5 CRIT-1 — Modal PIN thoát Kid Mode không hiển thị trên Android (có sẵn, không do R1)

- **Hiện tượng:** chạm "🔒 Thoát" trong Kid Mode thì không thấy modal PIN (c11, c11b, c12). uiautomator cho thấy root của `Modal` có kích thước **0×0**, nên không chạm được bàn phím số. Phụ huynh **không thoát được Kid Mode bằng PIN** trên Android.
- **Đối chứng:** chạy bản **HEAD trước R1** (Metro 8083, bản sao mã nguồn tạm) trên cùng emulator thì **lỗi y hệt** (h03, h04). Kết luận: lỗi có sẵn, **R1 không gây ra**.
- **Phạm vi:** Web hoạt động đúng (p21–p23). Lỗi chỉ xảy ra trên Android Expo Go, luôn chạy New Architecture. Modal ở đây là `<Modal transparent animationType="fade">` và không có `onRequestClose`.
- **Đường thoát hiện có:** trạng thái Kid Mode chỉ nằm trong bộ nhớ (`useState` trong `stores/useKidSession.ts`, không lưu xuống máy). Vì vậy tắt hẳn app rồi mở lại sẽ ra khỏi Kid Mode.
- **Rủi ro bảo mật:** việc tắt app để thoát Kid Mode cũng là cách vượt qua PIN. Đây là thiết kế có sẵn và cần quyết định riêng.
- **Đề xuất:** tách thành **task riêng (P0)** trước demo hoặc trước R2/R4. Theo phạm vi lượt này, **chưa sửa**.

### 11.6 Chặn — AI sinh truyện (BLOCKED, do BE)

`POST /stories/:id/generate` trả **503** từ BE local. FE hiển thị đúng thông báo hoàn credit, và số credit giữ nguyên ở 3. Do đó **không kiểm tra được** các màn có truyện đã viết xong: Reader thật, tủ sách Kid có truyện, ảnh bìa thật. Không sửa BE theo phạm vi.

### 11.7 Phát hiện mới (không chặn R1)

| Mã | Vấn đề | Nguồn | Đợt |
|---|---|---|---|
| MED-new-1 | Nhãn "Sáng tác" dưới nút giữa tab bar không nhận chạm, chỉ nút tròn nhận | Có sẵn | R3 |
| MED-new-2 | Tủ truyện có 1 truyện: thẻ giãn hết chiều ngang | Có sẵn | R7 |
| LOW-new-1 | `HeyChip` trên Web không xuất `aria-selected`, dù `accessibilityState.selected` đã đặt | R1 / RN Web | R2 |
| LOW-new-2 | Hoạt ảnh vô hạn của `OwlMascot` không tôn trọng Reduce Motion, và làm uiautomator không chờ được trạng thái idle | Có sẵn | R2 |
| LOW-new-3 | Chấm PIN trong modal vẫn màu xanh lá cũ; nút "Xác nhận" kid khi disabled có tương phản thấp | Có sẵn | R4 |
| INFO | Chữ trong các màn hình (chưa redesign) vẫn dùng font hệ thống, ví dụ "Tủ sách của Bé QA" trên Android | Đúng phạm vi R1 | R3–R8 |

### 11.8 Kiểm tra kỹ thuật (sau khi sửa HIGH-3)

| Kiểm tra | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ Exit 0 |
| `tests/authRace.test.ts` | ✅ 5/5 PASS. Bước biên dịch riêng lẻ có cảnh báo kiểu do thiếu cấu hình dự án, như các lượt trước; JS vẫn được sinh và chạy |
| `npx expo install --check` | ✅ Dependencies are up to date |
| `npx expo export --platform web --platform android` | ✅ Web bundle 1.14 MB, Android bundle 2.68 MB (Hermes), đủ 6 file font |

### 11.9 Regression

| Kiểm tra | Kết quả |
|---|---|
| HIGH-1: Android không còn dải trống đầu màn ở các màn sau đăng nhập | ✅ (c01–c10) |
| Đăng nhập, đăng xuất, đăng nhập lại; BE thật trả lỗi đúng | ✅ |
| Kid PIN được BE kiểm tra (sai → 401, đếm số lần thử) | ✅ Web |
| Điều hướng tab, nút quay lại | ✅ |
| Không có request ≥ 400 ngoài lỗi có chủ đích (PIN sai 401, generate 503) | ✅ |
| Không còn regression do R1 | ✅ |

### 11.10 Kết luận

**R1 ĐẠT. Phần thay đổi R1 đủ điều kiện nghiệm thu:** HIGH-1, LOW-1, HIGH-2 và HIGH-3 đều đã xong, và không có regression do R1.

**Ứng dụng chưa đủ điều kiện demo trên Android** cho tới khi sửa **CRIT-1**. Lỗi này có từ trước R1. Việc mở task riêng (đề xuất: trước R2 hoặc gộp vào R4 Kid Mode) do người dùng quyết định.

Còn **chưa kiểm tra được** Reader và tủ sách có truyện thật, vì BE local trả 503 khi sinh truyện (§11.6).
