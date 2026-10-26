# SAFETY GATE – TIẾN ĐỘ (S0.3 → S0.7, G-DEMO)

Cập nhật: 2026-10-26 · Nhánh `refactor/mobile-web-integration` · Baseline: commit `8a258b7` (S0.1 + S0.2).
Mọi thay đổi bên dưới **chưa commit**. **RUNTIME CHƯA KIỂM THỬ** (chưa chạy app/BE; U1).

## Trạng thái
| Task | Trạng thái | Ghi chú |
|---|---|---|
| S0.1, S0.2 | DONE-STATIC (đã commit `8a258b7`) | không đổi lại |
| S0.3a Auth service | DONE-STATIC | `getMe` throw; không cache/DEMO; `formatUser` không bịa user/credit; `register` cũng validate response |
| S0.3b Bootstrap | DONE-STATIC | BOOTING → xác minh `getMe` (timeout 15s) → APP; 401/403 → Login; mạng/5xx → màn lỗi + Thử lại; chống race bằng `sessionRef` |
| S0.3c Dữ liệu thật/rỗng/lỗi | DONE-STATIC | 4 hàm đọc throw khi lỗi, rỗng hợp lệ; dải thông báo lỗi + Thử lại; credit chưa biết = "—" (`SessionUser`) |
| S0.3d Cô lập Parent token | DONE-STATIC | xóa access/refresh token khi vào Kid Mode thành công; thoát PIN đúng → BE cấp token mới |
| S0.3e Khôi phục kid session | DONE-STATIC | phân biệt PIN sai (`attemptsLeft`) vs session mất (401 không `attemptsLeft`) → nút "Đăng nhập lại bằng mật khẩu" |
| S0.4 Ví/credit/thanh toán giả | DONE-STATIC | nạp/rút bị vô hiệu hóa "Chưa hỗ trợ"; bỏ trừ credit cục bộ, lịch sử giao dịch giả |
| S0.5a Ghi giả ở services | DONE-STATIC | child/character/story/kid/PIN không còn `return true`/object giả/ID cục bộ |
| S0.5b Tạo truyện | DONE-STATIC | wizard giữ nguyên các bước; bước tạo hiển thị "Chưa hỗ trợ"; không gọi `/stories/ai-generate`, không sinh truyện/timer/credit giả |
| S0.5c AuthModal | DONE-STATIC | PIN set/change qua BE và hiện lỗi; thêm bé gửi đúng `birthDate`, hiện lỗi; hồ sơ phụ huynh chỉ xem (BLOCKED: BE/Web không có API cập nhật hồ sơ) |
| S0.6 Tách dữ liệu demo | DONE-STATIC | không còn `DEMO_*` trong runtime; bỏ export `demoData` khỏi `services/index.ts`; EQ hardcode, quest, nhân vật, sao, rating/pages giả bị gỡ |
| S0.7 Input | DONE-STATIC | `HeyInput` thêm `autoCapitalize`/`autoCorrect`/`editable` (tùy chọn, mặc định không đổi); áp dụng cho email/mật khẩu/PIN |
| G-DEMO | DONE-STATIC | grep + tsc + Metro bundle sạch; chưa có runtime |

## File đã thay đổi
Mới: `apps/mobile/src/types/sessionUser.ts`.
Sửa: `App.tsx`; `components/{AuthModal,HeyTopBar}.tsx`, `components/ui/HeyInput.tsx`; `screens/{EqReport,KidMode,Login,Marketplace,ParentHome,Register,SellerDashboard,StoryWizard,Wallet}Screen|Dashboard|Wizard.tsx`; `services/{apiClient,authService,characterService,childService,index,kidService,storyService}.ts`.

## Kiểm tra đã chạy
- `npx tsc --noEmit` pass (lưu ý `strict: false` nên `null` không bị TS chặn → đã rà thủ công `creditBalance`).
- `git diff --check` sạch.
- Metro bundle web (`expo export`, thư mục tạm): 455 module, thành công.
- Bộ kiểm tra logic 42 ca với `fetch` giả (không phải runtime app): login/register/getMe/refresh/enter/exit/logout và các service đọc/ghi — 42/42 đạt.
- Grep cổng: không còn `'1234'`, `correctPin`, `mock_`, `DEMO_*` (ngoài `demoData.ts`), `ai-generate`, phép tính credit cục bộ.

## Giới hạn / quyết định cần người dùng
1. **PIN 4 số:** AuthModal chỉ cho đặt PIN đúng 4 số vì bàn phím PIN của Kid Mode cố định 4 số; BE chấp nhận 4–6. Nếu cho 5–6 số, bé có thể bị kẹt khi thoát. Xử lý cùng T3.3 theo quyết định PIN.
2. **S0.3d:** xóa Parent token khi vào Kid Mode → nếu thoát không thành công thì phải đăng nhập lại bằng mật khẩu (chủ ý). Refresh token cũ vẫn còn hiệu lực ở BE đến khi hết hạn (không gọi logout để tránh có thể thu hồi cả kid session – UNKNOWN).
3. **Chọn bé:** vẫn `childrenProfiles[0]` (TODO B2).
4. **`strict: false`** trong `tsconfig.json` làm TypeScript không bắt lỗi null/undefined.
5. Token chỉ nằm trong RAM trên native (chưa SecureStore – T2.2): mở lại app phải đăng nhập lại.
6. Timer 20 phút trong `KidModeScreen`, URL ảnh `/s1.jpg`… vẫn còn (P1/P2, T1.10 → D2).
7. Mapper `formatChild/formatCharacter/formatStory` còn giá trị mặc định (age 4, gender…) – T4.1/T4.2.
8. Marketplace/Seller/Admin: SCOPE PENDING, giữ nguyên; `Alert` không hiển thị trên Expo Web.
