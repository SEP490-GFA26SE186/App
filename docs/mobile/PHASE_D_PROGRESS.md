# PHASE D – GỠ MOCK / FAKE SUCCESS / DEMO DATA

Cập nhật: 2026-10-26 · Thay đổi **chưa commit** · Kết luận: **DONE-STATIC. RUNTIME CHƯA KIỂM THỬ** (chưa chạy app + BE thật; C0 BLOCKED). MOCK REMOVED = ✅ ở mức grep/đọc source cho tính năng P0.

Phương pháp: grep §6 + đọc source thực tế (không kết luận chỉ từ graph; graphify-out chưa có nên không dùng). `npx tsc --noEmit` = 0 lỗi sau thay đổi.

| Task | Kết quả | Bằng chứng |
|---|---|---|
| D1 | ĐẠT (đã có từ S0.3/A3) | `useParentData.loadAll` dùng `Promise.allSettled`, không thay dữ liệu mẫu khi lỗi; `dataStatus` `loading/error` hiển thị banner + "Thử lại" ở `ParentTabs.tsx` |
| D2 | ĐẠT | Không còn hằng số 55%/5.0/+10 Xu trong `ParentHomeScreen`, `KidModeScreen`; không `Math.random` ngoài hiệu ứng âm thanh (`sound-fx.ts`) |
| D3 | ĐẠT | `grep TEMP-DEMO`, `DemoBanner`, `demoGate` = 0 (kể cả màn SCOPE PENDING) |
| D4 | **ĐÃ DUYỆT (2026-10-26): giữ `src/dev/demo` + Kid UI Preview, chỉ `__DEV__`** | G7 ngoài `src/dev/**` = 0; `src/dev` không import apiClient/authService/kidService/storage |
| D5 | **ĐÃ DUYỆT: giữ source, ẩn lối vào chưa duyệt khỏi production** | Lối vào duy nhất (mục "Chợ truyện" ở menu Thêm, `ParentTabs.tsx`) chỉ hiện khi `__DEV__`. Chuyển vai Seller/Moderator/Admin không có UI kích hoạt (`HeyTopBar` không dùng `onRoleChange`). `ModeratorAdminScreen`: nút duyệt/từ chối không còn báo thành công giả, chỉ báo "Chưa kết nối máy chủ". Không xóa màn nào |
| D6 | **ĐÃ DUYỆT: giữ nguyên legacy ở gốc `App/`** | `server.ts`, `apps/api`, `src/utils/mockData.ts`, `src/shims/*` không bị chạm; `apps/mobile` không tham chiếu |
| D7 | ĐẠT (tĩnh) | Bảng dưới |

## D7 – Kết quả grep §6 (tại `App/apps/mobile`)
| # | Kết quả |
|---|---|
| G1 PIN cục bộ/`1234` | 0 |
| G2 token giả | 0 ngoài `src/dev/demo/` (`DEMO_PARENT_USER` chỉ trong fixture dev, không được import) |
| G3 | chỉ `onSkip` là prop "bỏ qua điểm dừng" hợp lệ của `KidCheckpointCard` (gửi `skipped:true` lên BE), không phải nút demo |
| G4 ví giả | 0 |
| G5 fake success trong catch | rà `services/*`, `stores/*`, `AuthModal`, `StoryWizard`: không `return true`/object giả. `useKidReader` 409: **đã sửa** (xem dưới) |
| G6 `ai-generate` | 0 |
| G7 | 0 ngoài `src/dev/**` |
| G8 | 0 |
| G9 | 0 |
| G10 | 0 |
| G11 | (a) `dev/preview` chỉ qua `require` trong nhánh `__DEV__` ở `App.tsx`; (b) `src/dev` không import apiClient/authService/kidService/storage (chỉ có comment) |

## Đối chiếu 409 (`useKidReader`) với BE
`BE/api/src/modules/kid/kid.service.js` `answer()` (dòng ~158-163): phiên `status !== 'in_progress'` → `409 'Lượt đọc này đã kết thúc.'`, **câu trả lời không được lưu**. Không có nghiệp vụ nào coi đó là "xong" → nhánh cũ (`done:true, correct:null`) là biến lỗi thành thành công. **Đã gỡ**: 409 hiện lỗi thật của BE qua `actionError`. Hệ quả: bé không bị kẹt âm thầm nhưng cũng không đọc tiếp qua điểm dừng đó trong phiên đã kết thúc; cách phục hồi UX (mở lại phiên mới) là việc của phase sau, chưa xác minh runtime.

## Xác minh cuối
Git repo gốc = `D:/fpt/SEP/SEP/App` (thư mục `SEP` không phải repo). Thay đổi Phase D: `ParentTabs.tsx`, `useKidReader.ts`, `ModeratorAdminScreen.tsx`, 2 file docs; không file nào bị xóa. `npx tsc --noEmit` = 0, `git diff --check` = 0 (import hợp lệ vì tsc đạt). Không sửa BE/Web/App_v2/shared-types, không thêm dependency, không commit.

## Giới hạn / chưa làm
- Chưa chạy app + BE thật → **không** kết luận runtime PASS.
- Chưa dùng graphify (chưa có `graphify-out`; không tự cài/ghi cấu hình).
- Chưa commit.
