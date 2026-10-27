# QA R8 — EQ, Ví/Credit, Bé nhà mình, Nhân vật, Cài đặt, Trợ giúp

> **Ngày:** 2026-10-27 · Kế hoạch: [UI_UX_REDESIGN_PLAN.md](UI_UX_REDESIGN_PLAN.md) §5.2 · Tiến độ: [UI_REDESIGN_PROGRESS.md](UI_REDESIGN_PROGRESS.md).
> **Ảnh:** [`qa/r8/`](qa/r8/) (`r8w*` Web, `r8a*` Android SW_Test). **`r8w20–23` là FIXTURE** (dữ liệu giả, §6.2). Không có mật khẩu/PIN/token trong ảnh (Cài đặt hiện email tài khoản test dùng một lần).
> **Trạng thái:** đã triển khai + tự kiểm thử, **chờ chủ dự án review**. Chưa nghiệm thu, chưa commit.

---

## 1. Phạm vi R8 (từ kế hoạch đã duyệt)

Dòng R8: EQ (tổng quan + thẻ năng lực + gợi ý cho ba mẹ), Wallet (thẻ số dư lớn, gói dạng thẻ, lịch sử nhóm theo ngày), các màn quản lý dùng list chuẩn. File: `EqReportScreen`, `WalletScreen`, `ChildrenScreen`, `CharactersScreen`, `SettingsScreen`, `HelpScreen` (+ `ChildFormSheet` và `constants/eq.ts` dùng chung). Không đụng Reader R7, Wizard R6, `MoreScreen` (R3), R9.

## 2. Git và môi trường

Nhánh `refactor/mobile-frontend-cleanup`, HEAD `5d0de47` (R7 đã commit), working tree sạch trước R8. Chưa commit/push. BE local `127.0.0.1:3000` (không sửa BE/DB); Expo Web 8082 + Chrome headless; Android SW_Test (Expo Go) 1080×2400 và 360×640dp. Tài khoản test `qa_r1` (1 bé, 3 nhân vật, 3 credit, gói Miễn phí). **Không dùng tài khoản demo.** Không lưu/xóa/đổi gì; không thanh toán.

## 3. Đã triển khai

- **EQ:** thẻ tổng quan "n/5 năng lực đã có dữ liệu" (đếm từ dữ liệu BE); thẻ năng lực: biểu tượng CASEL, thanh 3 mức **kèm chữ mức và nhãn trợ năng** ("Tự quản lý: Đang phát triển, mức 2 trên 3"), "Chưa có dữ liệu" khi `level = null`; gợi ý chuyện mẫu do BE trả; skeleton/lỗi + Thử lại; màu mức chuyển sang token (`constants/eq.ts`, hết hex). **Không điểm/%, không đánh giá tự suy.**
- **Ví & Credit (chỉ xem):** thẻ số dư lớn, gói hiện tại + **thanh mức dùng** (bé/nhân vật), gói dạng thẻ ("Đang dùng"), lịch sử **nhóm theo ngày** với +/− có dấu và nhãn đọc "cộng/trừ n credit", "Xem thêm", skeleton/lỗi từng khối. Không có thanh toán/nạp/nâng gói.
- **Bé nhà mình:** thẻ có avatar, tên, tuổi; **"Vào Chế độ Bé · {tên}" là hành động chính** (PIN vẫn do BE xác minh), Chọn/Sửa/Xóa là nút phụ icon + chữ, `loading` khi xóa; empty có nút thêm, lỗi dùng `StateView error`; thông báo chưa đặt PIN dạng thẻ.
- **Nhân vật:** lưới 2/3/4 cột (px theo bề ngang), ảnh hoặc chữ cái đầu, mô tả, nhãn trạng thái chân dung, Sửa/Xóa có nhãn theo tên (nhân vật của bé không có Xóa như trước).
- **Cài đặt:** token, thông báo lỗi/thành công có icon + `role=alert`, nút có `loading`; **J1:** địa chỉ máy chủ chỉ hiện khi `__DEV__` (trước đây còn lộ ở bản thường).
- **Trợ giúp:** hàng FAQ là nút ≥ 44pt có `expanded`, chevron thay ▸/▾.
- **`ChildFormSheet`:** token + icon, bỏ ⚠️/⏳. Test mới `tests/manage.test.ts` (7 test).

## 4. File thay đổi

`src/screens/parent/{EqReport,Wallet,Children,Characters,Settings,Help}Screen.tsx`, `src/components/parent/ChildFormSheet.tsx`, `src/constants/eq.ts`, `tests/manage.test.ts` (mới), `tests/README.md`, `docs/mobile/QA_R8_REPORT.md`, `UI_REDESIGN_PROGRESS.md`, `qa/r8/`. Không đụng BE, Web, App_v2, dependency, Auth/phiên, Kid PIN, API contract.

## 5. Kiểm tra tự động (chạy SAU lần sửa mã cuối)

| Lệnh (từ `apps/mobile`) | Kết quả |
|---|---|
| `npx tsc --noEmit` | PASS |
| `manage` (mới) / `library` / `wizard` / `homeAuth` / `kidUi` / `navigation` / `uiStates` / `authRace` | PASS 7/7, 7/7, 6/6, 6/6, 5/5, 11/11, 2/2, 5/5 |
| `npx expo install --check` | PASS |
| `npx expo export --platform web` / `--platform android` | PASS / PASS |

## 6. QA Web (Chrome headless, 390 mobile + 320/768/1280)

### 6.1 Dữ liệu BE THẬT (chỉ GET, form chỉ mở/kiểm validation, không lưu)

| # | Kiểm tra | Kết quả |
|---|---|---|
| W1 | EQ: 5 thanh có nhãn "…: Chưa có dữ liệu", tổng quan 0/5, ghi chú sư phạm; chặn `/eq-report` → "Chưa tải được báo cáo EQ" → Thử lại hồi phục | PASS |
| W2 | Ví: số dư 3, gói Miễn phí đến 27/11/2026, mức dùng 1/1 và 3/5, 3 gói (Miễn phí / 49.000đ / 490.000đ), lịch sử thật (có dòng "Hoàn credit") | PASS |
| W3 | Bé nhà mình: thẻ "Bé QA" 6 tuổi, nút "Vào Chế độ Bé của Bé QA" 322×48; mở form Sửa → để trống tên → "Ba mẹ nhập tên bé nhé" (không lưu) | PASS |
| W4 | Nhân vật: "3 nhân vật", thẻ + nút Sửa/Xóa có nhãn theo tên; mở form → "nhập tên nhân vật", "Mô tả tối thiểu 3" (không lưu) | PASS |
| W5 | Cài đặt: thông tin tài khoản; đổi mật khẩu thiếu → "nhập mật khẩu hiện tại"; mới < 8 → "từ 8 đến 100 ký tự" (kiểm phía máy khách, **không gọi BE**); địa chỉ máy chủ hiện ở bản dev | PASS |
| W6 | Trợ giúp: bấm một câu → `aria-expanded` false→true, hàng 324×44 | PASS |
| W7 | Bàn phím: Tab đi qua Quay lại → Thêm hồ sơ → Vào Chế độ Bé → Sửa → Xóa → tab bar, **có focus ring** | PASS |
| W8 | 320/768/1280 cho cả 6 màn: không tràn ngang | PASS |
| W9 | Hồi quy: Home, tab, Kid Mode + PIN sai/đúng qua BE, mở Wizard, Hành trình EQ | PASS |

### 6.2 FIXTURE UI — **không phải E2E thật, không ghi BE**

Trong trình duyệt, response `GET /children/:id/eq-report`, `/credit-history`, `/characters` bị sửa.

| # | Kiểm tra | Kết quả |
|---|---|---|
| F1 | EQ có dữ liệu: nhãn "Đang làm quen, mức 1 trên 3 / … / Vững, mức 3 trên 3 / Chưa có dữ liệu", tổng quan 4/5, gợi ý | FIXTURE PASS |
| F2 | Ví: lịch sử nhóm 3 ngày, nhãn "trừ 2 credit/cộng 2 credit", nút "Xem thêm" khi còn trang | FIXTURE PASS |
| F3 | Nhân vật 6 thẻ (có ảnh, tên dài, trạng thái "đang vẽ/chưa vẽ được"): 4 cột ở 1280, không tràn ở 320/768 | FIXTURE PASS |

## 7. QA Android (SW_Test, dữ liệu thật)

| # | Kiểm tra | Kết quả |
|---|---|---|
| A1 | Tiến độ (EQ), Ví (cuộn), Bé nhà mình (+ sheet Sửa), Nhân vật (+ sheet Thêm), Cài đặt, Trợ giúp hiển thị đúng; Android Back từ Ví về Hồ sơ | PASS |
| A2 | Lưới nhân vật 2 cột; 360×640dp: EQ, Nhân vật, Bé nhà mình, Ví đọc được, không cắt | PASS |
| A3 | Địa chỉ máy chủ ở Cài đặt (bản dev) | NOT VERIFIED trên Android (nằm dưới màn hình, đã kiểm Web + test mã) |
| A4 | Bàn phím khi nhập ở Cài đặt | NOT RUN (không nhập mật khẩu/PIN thật) |

## 8. Accessibility và responsive

Thanh mức EQ `role=progressbar` + nhãn; hàng FAQ `expanded`; nút theo thẻ có nhãn kèm tên ("Xóa nhân vật X", "Vào Chế độ Bé của X"); +/− số credit có dấu và nhãn đọc; lỗi form `role=alert` + icon; focus ring Web đã đo; vùng chạm đo thật: nút chính 48, mục FAQ 44, Quay lại 44; **nút phụ nhỏ (Sửa/Xóa/Tải lại) cao 36 trên Web** — native có `hitSlop` lên 44, Web không áp dụng (LOW-6 đã có, R9). Reduce Motion: không animation mới. TalkBack/VoiceOver, iOS: NOT VERIFIED.

## 9. Hồi quy

Xem W9: Login/Home/tab/Kid Mode + PIN/Wizard/EQ PASS (Web). Android: đăng nhập, điều hướng Hồ sơ → các mục, Back PASS. NOT RUN: đăng xuất/đăng nhập lại, R4.1, K1.

## 10. Lỗi tìm thấy và đã sửa

| Mã | Mức | Vấn đề | Xử lý |
|---|---|---|---|
| R8-1 | MEDIUM | Lưới nhân vật chỉ 1 cột: rộng thẻ theo % + khe px > 100% nên tràn dòng | Tính rộng thẻ bằng px (trừ lề và khe); xác nhận 2 cột (Android 360/1080), 4 cột (Web 1280) |
| R8-2 | MEDIUM | Cài đặt lộ địa chỉ máy chủ ở bản thường (còn sót từ J1) | Chỉ hiện khi `__DEV__`; test chặn |
| R8-3 | LOW | Màu mức EQ còn hex trong `constants/eq.ts` | Chuyển sang token |
| (công cụ QA) | | `rewriteJson` nhiều pattern ghi đè nhau → fixture lệch | Viết bộ định tuyến theo URL trong script QA |

## 11. Backend/AI dependency và kịch bản chưa chạy

| Tính năng | Endpoint | Phụ thuộc | Bằng chứng | Trạng thái | Ảnh hưởng | Lý do bỏ qua | FE xong? | Chủ | Việc cần làm |
|---|---|---|---|---|---|---|---|---|---|
| Thêm/Sửa/Xóa hồ sơ bé | `POST/PUT/DELETE /children` | BE ghi | không gọi (chỉ kiểm validation) | NOT RUN | cốt lõi quản lý | ghi dữ liệu | Có | Integration QA | Chạy trên tài khoản test riêng, kiểm giới hạn gói (422) |
| Thêm/Sửa/Xóa nhân vật | `POST/PUT/DELETE /characters` | BE ghi | không gọi | NOT RUN | cốt lõi quản lý | ghi dữ liệu | Có | Integration QA | như trên |
| Xác nhận xóa (Web) | — | RN-web: `Alert.alert` có nút **không hiển thị** | quan sát từ mã | NOT VERIFIED | FE (có sẵn từ trước) | không thể kiểm không xóa thật | **Chưa** | FE (R9/sau) | Dùng hộp thoại tự dựng hoặc `window.confirm` trên Web |
| Đổi mật khẩu / đặt-đổi PIN | `/auth/change-password`, `/auth/kid-pin` | BE ghi/bảo mật | không gọi | NOT RUN | bảo mật | không đổi mật khẩu/PIN tài khoản | Có | Integration QA | Chạy trên tài khoản test riêng |
| Thanh toán/nâng gói | — | không có endpoint | — | NOT RUN (không hỗ trợ) | ngoài phạm vi | đúng thiết kế | N/A | PM/BE | chờ quyết định phạm vi |
| EQ có dữ liệu thật | `GET /children/:id/eq-report` | cần dữ liệu đọc (R4.1) | tài khoản test: 0/5 | NOT VERIFIED (thật), FIXTURE PASS | hiển thị thật | cần đọc truyện thật | Có | QA sau R4.1 | Kiểm sau khi có tiến độ đọc |

Các GET (`/children/:id/eq-report`, `/subscriptions/me`, `/plans`, `/credit-history`, `/children`, `/characters`) đều 200 với tài khoản test. Không có lỗi BE nào cản R8.

## 12. Vấn đề còn tồn tại

- **CRITICAL / HIGH / MEDIUM:** không còn.
- **LOW:** nút phụ cao 36 trên Web (R9); xác nhận Xóa trên Web không hoạt động (có sẵn từ trước, xem §11); các màn chưa giới hạn bề rộng nội dung ≥ 1024px (R9); `Sheet` (Modal) chưa kiểm máy thật.
- **INFO:** phiên Android hay mất khi relaunch Expo Go (QA R5 Q-2); `401 /auth/me` trong log là do khởi động sau khi xóa phiên.

## 13. Đề xuất nghiệm thu

**UI/UX R8: đề nghị nghiệm thu có điều kiện sau review** (đủ 6 màn, kiểm tự động sạch, Web + Android chạy thật với dữ liệu đọc-chỉ). **Chức năng ghi (thêm/sửa/xóa, đổi mật khẩu/PIN) và EQ thật: chưa E2E.** Chưa đánh dấu "đã nghiệm thu".

## 14. Backlog cho R9 và QA tích hợp

1. R9: giới hạn bề rộng nội dung, `hitSlop` tương đương trên Web (nút phụ ≥ 44), hộp xác nhận xóa dùng được trên Web, rà a11y toàn app.
2. Integration QA (tài khoản test riêng): thêm/sửa/xóa bé và nhân vật, đổi mật khẩu/PIN, giới hạn gói.
3. Sau R4.1: EQ với dữ liệu đọc thật.
