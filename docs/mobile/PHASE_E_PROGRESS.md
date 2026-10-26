# PHASE E – KIỂM THỬ RUNTIME (FE Mobile)

Cập nhật: 2026-10-26 (lượt 3) · Chưa commit. **API RUNTIME: NOT TESTED / BLOCKED** (Backend không chạy: không Docker/Postgres/Redis/`BE/.env`, xem C0). Không mock API, không phiên giả, không dùng dữ liệu Preview để vào Parent.
**Phase E CHƯA hoàn tất**: mọi luồng Parent/Kid thật vẫn BLOCKED.

## Môi trường đã chạy thật
- Android Emulator **SW_Test** (AVD riêng, Pixel 6, Android 37 16 KB-page, x86_64, data 8 GB; AVD `Medium_Phone` có sẵn đã đầy 97% nên không dùng/không wipe).
- Expo SDK 52 qua Expo Go 2.32.20 (CLI tự cài lên emulator; không thêm dependency). `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000` qua biến môi trường tiến trình, không tạo `.env`.
- Hộp thoại "16 KB compatibility" là của Android + Expo Go, không phải lỗi app.
- Tự động hóa: `adb` + `uiautomator dump` (tìm theo text) + ảnh chụp màn hình. Nhập liệu bằng `adb input text` đôi khi lệch ô/ký tự → kết quả nào nghi do công cụ đều ghi rõ.
- Lưu ý khi kiểm thử: nút Back chỉ đưa Expo Go ra nền, tiến trình JS vẫn sống; muốn nạp bản code mới phải `am force-stop host.exp.exponent` rồi mở lại.
- Chưa thử thiết bị thật.

## Ma trận
| Luồng | Kết quả | Ghi chú / bằng chứng |
|---|---|---|
| Bundle Android/Web + khởi động | **PASS** | Vào thẳng Login |
| Login hiển thị, dòng "Máy chủ: …/api/v1" | **PASS** | |
| Login validation: để trống | **PASS** | "Ba mẹ nhập email hoặc tên đăng nhập nhé" + "…mật khẩu nhé" |
| Login validation: định dạng sai ("ab") | **PASS** | "Email hoặc tên đăng nhập chưa đúng định dạng" |
| Hiện/ẩn mật khẩu (Login) | **PASS** | Đổi giữa ••• và "Passw0rd1" |
| Login loading → lỗi khi BE không kết nối | **PASS** | "⏳ Đang đăng nhập…" (nút khóa) rồi "Không thể kết nối đến máy chủ…" |
| Retry sau lỗi mạng | **FAIL → ĐÃ SỬA → PASS** | Trước: mật khẩu bị xóa sau lỗi mạng. Sau sửa: giữ mật khẩu, bấm lại → loading → lỗi lại |
| Register hiển thị, cuộn | **PASS** | |
| Register validation (4 lỗi: username/email/mật khẩu ngắn/không khớp) | **PASS** | Thông báo đúng từng ô. *(Sửa ghi chú cũ: nút "Hoàn tất đăng ký" không bị khóa, chỉ là màu teal; lỗi hiện khi bấm gửi.)* |
| Register gửi hợp lệ khi BE tắt | **PASS (error state)** | Loading → lỗi mạng, dữ liệu form được giữ |
| Back Android ở Register → Login | **PASS** | Kiểm tra lại sau force-stop; Back khi đang gửi cũng về Login, không crash, lỗi cũ không rò sang Login |
| Back ở Login | **PASS** | Thoát app (hành vi gốc) |
| Back trong Kid UI Preview | **FAIL → ĐÃ SỬA → PASS** | Trước: thoát cả app. Sau: đóng Preview, về Login (log xác nhận handler chạy) |
| Kid UI Preview: tủ sách, trình đọc 1/3→3/3, điểm dừng, chọn cảm xúc, "Bé đã trả lời xong", "Đọc xong", "Về tủ sách", Thoát Preview | **PASS** | Banner "UI Preview – dữ liệu mẫu" luôn hiện; không vào được Parent |
| Kích thước 720×1280 + font 1.3: Login | **PASS** | Cuộn tới được nút Đăng nhập/Đăng ký. Placeholder đã sửa (xem P3) |
| Bàn phím không che ô nhập (màn 1080×2400) | **PASS** | Ô "Nhập lại mật khẩu" vẫn thấy trên bàn phím |
| Bàn phím ở cỡ nhỏ 720×1280, Register | **NOT TESTED** | Tự động hóa lỗi ở bước này |
| Safe area (status bar, thanh điều hướng) | **PASS (quan sát)** | Nội dung không chui vào status bar ở Login/Register/Preview |
| Màn hình lớn/tablet, xoay ngang | **NOT TESTED** | |
| Login/Register thành công, session, bootstrap, logout | **BLOCKED** | Cần BE |
| Parent UI (Home, Library, EQ, Characters, Children, Settings, Wallet), StoryWizard | **BLOCKED** | Cần đăng nhập thật |
| Kid Mode thật: PIN, enter/exit, shelf, session, 409, 401 | **BLOCKED** | Cần BE |
| Mất kết nối giữa phiên đã đăng nhập | **BLOCKED** | Cần phiên thật (lỗi mạng ở Login/Register = PASS) |
| Thiết bị thật | **NOT TESTED** | |

## Review `RegisterScreenWithBack` (AppNavigator.tsx)
- Cleanup đúng (`sub.remove()` khi unmount/đổi `onGoLogin`). `showLogin` không memo nên listener đăng ký lại mỗi render — vô hại.
- Back trong lúc đang gửi đăng ký → về Login, request vẫn chạy. **Rủi ro lý thuyết khi BE chạy**: nếu request thành công sau khi đã về Login thì `onRegisterSuccess` vẫn bắt đầu phiên (tài khoản đã tạo thật). Chưa xác nhận được vì BE tắt → cần thử tay. Nếu muốn chặn: bỏ qua Back khi đang loading.
- Thứ tự handler: handler của Preview (App.tsx) đăng ký sau nên chạy trước; không xung đột.

## Lỗi FE đã sửa lượt 2 (3)
1. `AppNavigator.tsx` – Back Android ở Register quay về Login thay vì thoát app.
2. `LoginScreen.tsx` – lỗi mạng/máy chủ (status 0 hoặc ≥500) không xóa mật khẩu, để bấm thử lại; lỗi 4xx vẫn xóa.
3. `App.tsx` – Back Android đóng Kid UI Preview thay vì thoát app.
Không đổi API/contract. `tsc --noEmit` = 0; `expo export` Android + Web OK; bundle web production không chứa "UI Preview"/log debug.

## Lượt 3 – ổn định offline (P1/P2/P3)
**P1 – Race Register/Login khi rời màn: CÓ THẬT, ĐÃ SỬA.**
- Nguyên nhân (đọc source): `RegisterScreen`/`LoginScreen` không hủy request khi unmount. Khi BE thành công muộn, `authService.register/login` ghi token vào storage rồi màn (đã unmount) vẫn gọi `onRegisterSuccess/onLoginSuccess` → `startSession` từ phase LOGIN → tự đăng nhập (tài khoản/phiên đổi sau khi người dùng đã rời màn).
- Sửa: `apiClient.fetchWithTimeout` nhận `AbortSignal` của người gọi (hủy → ném AbortError, không đổi thành lỗi timeout); `authService.login/register(…, signal?)` truyền signal và **không ghi token/user nếu đã hủy** (kiểm ngay trước khi ghi); hai màn tạo `AbortController`, hủy khi unmount, và bỏ qua kết quả/lỗi nếu đã hủy. Không đổi endpoint/body/contract; `signal` là tham số tùy chọn.
- Test (fetch giả deferred chỉ trong test): `apps/mobile/tests/authRace.test.ts` – 5/5 PASS (hoàn tất bình thường; Back khi gửi; response về sau khi hủy dù fetch không reject; login; signal đã hủy sẵn). Đối chứng âm tính: gỡ guard trong `authService` → 2 case FAIL (exit 1). Cách chạy: `tests/README.md`.
- Trên emulator (BE tắt): Register → gửi → Back → về Login, không crash, không rò lỗi/phiên. Nhánh "BE thành công muộn" chỉ được chứng minh bằng test đơn vị, **chưa chạy với BE thật**.
- Ghi chú: `components/auth/AuthModal.tsx` còn gọi login/register cùng kiểu nhưng không được import ở đâu (mã chết) → không sửa.

**P2 – Accessibility khi Preview mở: ĐÃ SỬA.** `App.tsx` bọc app thật trong `View` với `importantForAccessibility="no-hide-descendants"` + `accessibilityElementsHidden` khi `previewOpen`. Kiểm bằng `uiautomator dump --compressed` (chỉ nút accessibility-important): Preview mở → "Đăng nhập tài khoản" = 0, "Thoát Preview" = 1; thoát Preview → Login hiện lại. (Dump không nén vẫn liệt kê mọi node nên không dùng để kết luận.) Preview vẫn chỉ trong `__DEV__`; bundle web production không chứa "UI Preview".

**P3 – Placeholder email bị cắt: ĐÃ SỬA.** Đổi placeholder `"email@example.com hoặc tên đăng nhập"` → `"email@example.com"` (nhãn phía trên đã nói "Email hoặc Tên đăng nhập"). Chụp lại ở font 1.3: hiển thị đủ; không tắt font scaling.

**Hồi quy trên emulator sau các sửa đổi (BE tắt):** Login trống/định dạng sai, hiện/ẩn mật khẩu, loading → lỗi mạng, mật khẩu được giữ; Register 3 lỗi khi để trống (ô nhập lại khớp vì cùng rỗng — đúng), điền hợp lệ → loading; Back mid-flight; Back trong Preview (đóng Preview, về Login — từ trình đọc cũng đóng hẳn Preview, chưa lùi từng cấp); Preview đọc/trả lời điểm dừng; bàn phím không che ô "Nhập lại mật khẩu"; cuộn; safe area. Tất cả PASS.

## Quan sát chưa sửa
- Back trong Preview đóng cả Preview thay vì lùi từng cấp (trình đọc → tủ sách). Chỉ `__DEV__`.
- Đổi `font_scale` hệ thống làm Expo Go nạp lại app (khung trắng thoáng qua) — hành vi Expo Go, không phải lỗi app.
- Back trong Kid Mode thật chưa kiểm thử (cần BE).

## Việc cần bạn làm trực tiếp
1. Chạy BE (`BE/SETUP.md`), đặt `EXPO_PUBLIC_API_URL` (`http://10.0.2.2:3000` emulator / `http://<IP-LAN>:3000` máy thật), `npx expo start --android`.
2. Thử tay: đăng ký/đăng nhập thật; Back khi đang đăng ký (xem có tự đăng nhập không); tạo bé; đặt PIN 4–6 số; vào/thoát Kid Mode (sai PIN → "Còn N lần thử"); Back trong Kid Mode; tạo truyện; thư viện; EQ; ví credit; 409 (kết thúc lượt đọc ở máy khác rồi trả lời điểm dừng); tắt mạng giữa phiên; bàn phím trên điện thoại thật và máy nhỏ.
3. Báo kết quả để cập nhật ma trận.

## Giới hạn
Không có test tự động. Chưa commit. API RUNTIME vẫn NOT TESTED.
