# tests (offline, không cần Backend)

`authRace.test.ts` kiểm tra request đăng ký/đăng nhập bị hủy khi rời màn không được ghi token/phiên. Fetch giả chỉ nằm trong file test.

Chạy (không cần dependency mới; dùng `tsc` có sẵn và Node):
```
cd apps/mobile
npx tsc tests/authRace.test.ts --outDir %TEMP%/sw-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck --jsx react-jsx --types react-native,node
node %TEMP%/sw-tests/tests/authRace.test.js
```
(Bash: dùng `$TEMP` thay cho `%TEMP%`.)
(`--types react-native,node` khai báo `__DEV__` và `process` cho `tsc` chạy riêng; `npx tsc --noEmit` của dự án vốn đã có.)

`uiStates.test.ts` quét mã nguồn để chặn tái diễn QA_R2 MED-1 (trạng thái lỗi phải dùng `StateView variant="error"`) và MED-2 (Toast có vùng live mount sẵn, bản nhìn thấy không phải live region). Chạy từ `apps/mobile`:
```
npx tsc tests/uiStates.test.ts --outDir %TEMP%/sw-ui-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck
node %TEMP%/sw-ui-tests/uiStates.test.js
```

`navigation.test.ts` kiểm tra logic điều hướng thuần (`navigation/routes.ts`: `navigateStack`, `activeTabFor`, `backStack`) và các ràng buộc khung điều hướng R3 (Credit không còn là tab, Ví truy cập được từ header và Hồ sơ, số dư header lấy từ BE, toast ở đáy). Chạy từ `apps/mobile`:
```
npx tsc tests/navigation.test.ts --outDir %TEMP%/sw-nav-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck
node %TEMP%/sw-nav-tests/tests/navigation.test.js
```

`kidUi.test.ts` (R4) chặn hồi quy giao diện Kid Mode: không `<Modal>`/Reanimated (CRIT-1), không hex cứng, nhãn trợ năng PIN không lộ mã, thoát luôn qua khoá PIN và Back, kích thước nút Kid. Chạy từ `apps/mobile`:
```
npx tsc tests/kidUi.test.ts --outDir %TEMP%/sw-kid-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck
node %TEMP%/sw-kid-tests/kidUi.test.js
```

`homeAuth.test.ts` (R5) chặn hồi quy Parent Home, mascot và Đăng nhập/Đăng ký: không số liệu/nút bịa trong lời gợi ý (A2), không tiếng cún (A3), địa chỉ máy chủ chỉ hiện ở `__DEV__` (J1), không hex cứng, link >= 44pt có focus ring, Enter để gửi, hero lấy số liệu từ overview BE. Chạy từ `apps/mobile`:
```
npx tsc tests/homeAuth.test.ts --outDir %TEMP%/sw-home-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck
node %TEMP%/sw-home-tests/homeAuth.test.js
```

`wizard.test.ts` (R6) chặn hồi quy Story Wizard: không hex/emoji làm icon/`TouchableOpacity`, giữ nguyên lời gọi BE và quy tắc `missing`, chi phí lấy từ BE (không số cứng), không tiến độ giả khi AI viết, stepper/chân trang/vùng chạm. Chạy từ `apps/mobile`:
```
npx tsc tests/wizard.test.ts --outDir %TEMP%/sw-wiz-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck
node %TEMP%/sw-wiz-tests/wizard.test.js
```

`library.test.ts` (R7) chặn hồi quy Tủ truyện, Chi tiết truyện và Trình đọc phụ huynh: không hex/emoji/`TouchableOpacity`, Trình đọc không `<Modal>` và không gọi API, **tương phản thật ≥ 4.5:1 tính từ token** (audit B1), chỉnh cỡ chữ + điều khiển ẩn/hiện, lưới/segmented/menu "⋯" ở Tủ truyện, giữ nguyên lời gọi BE ở Chi tiết. Chạy từ `apps/mobile`:
```
npx tsc tests/library.test.ts --outDir %TEMP%/sw-lib-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck --types node
node %TEMP%/sw-lib-tests/library.test.js
```

`manage.test.ts` (R8) chặn hồi quy EQ, Ví/Credit, Bé nhà mình, Nhân vật, Cài đặt, Trợ giúp: không hex/emoji/`TouchableOpacity`, giữ nguyên lời gọi BE, Ví chỉ xem (không thanh toán), EQ không tự tính điểm, J1 ở Cài đặt, nhãn trợ năng. Chạy từ `apps/mobile`:
```
npx tsc tests/manage.test.ts --outDir %TEMP%/sw-manage-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck --types node
node %TEMP%/sw-manage-tests/manage.test.js
```

`r9a.test.ts` (R9-A) chặn hồi quy các lỗi đợt hoàn thiện: không còn `Alert.alert` (rỗng trên Web), Dialog Web (Esc, focus, inert, resolve một lần), xóa chỉ sau xác nhận, vùng chạm 44 trên Web, Space cho radio, giới hạn bề rộng 720, AuthModal (legacy) đã xóa và không còn nơi import. Chạy từ `apps/mobile`:
```
npx tsc tests/r9a.test.ts --outDir %TEMP%/sw-r9a-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck --types node
node %TEMP%/sw-r9a-tests/tests/r9a.test.js
```

`management.test.ts` (Admin / Chuyên gia sư phạm) chặn hồi quy định tuyến theo role (role lạ không rơi vào giao diện Phụ huynh, dữ liệu Phụ huynh chỉ nạp cho PARENT), điều hướng ngăn xếp quản trị, luật nghiệp vụ khớp BE (hoàn tiền, tạo Chuyên gia, khoá tài khoản, lượt duyệt), endpoint/body gửi lên BE (fetch giả trong test), không dữ liệu mẫu/hex, thao tác nhạy cảm có xác nhận. Chạy từ `apps/mobile`:
```
npx tsc tests/management.test.ts --outDir %TEMP%/sw-mgmt-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck --jsx react-jsx --types react-native,node
node %TEMP%/sw-mgmt-tests/tests/management.test.js
```

`errorMessages.test.ts` kiểm tra bộ dịch lỗi BE → tiếng Việt (`services/errorMessages.ts`, chép từ Web: đủ 94 message + 13 regex) và quy tắc của `apiClient`: chỉ 500 bị thay bằng câu chung, 502/503 giữ câu tiếng Việt của BE, `errors[]` (vd. `attemptsLeft`) giữ nguyên. Fetch giả trong test. Chạy từ `apps/mobile`:
```
npx tsc tests/errorMessages.test.ts --outDir %TEMP%/sw-err-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck --jsx react-jsx --types react-native,node
node %TEMP%/sw-err-tests/tests/errorMessages.test.js
```

`storyEditor.test.ts` (GĐ B1) kiểm màn Sửa truyện và lối "Tự viết": đúng method/path/body cho 8 endpoint editor + review (fetch giả), map lỗi 422 của review theo trang/điểm dừng (từ khoá chặn báo riêng), luật điểm dừng phía client giống BE `editorRules.js`, điểm dừng khoá không có nút Sửa (không gửi PUT), "Tự viết" gửi `length: 'custom'` không có `entry`/`analysisToken`, editor không gọi API AI. Chạy từ `apps/mobile`:
```
npx tsc tests/storyEditor.test.ts --outDir %TEMP%/sw-editor-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck --jsx react-jsx --types react-native,node
node %TEMP%/sw-editor-tests/tests/storyEditor.test.js
```

`storyMedia.test.ts` (GĐ B2) kiểm tranh AI và giọng đọc: đúng method/path cho `POST /stories/:id/images`, `/scenes/:sceneId/image`, `/narration/retry` (fetch giả), lỗi 402/409/503 không thành công giả, công thức chi phí tranh + 3 mức cảnh báo credit, payload Wizard (`useAiImage`/`useTts` từng lối), poller dừng khi xong / lỗi / quá trần / rời màn (hẹn giờ giả), tải lại credit sau khi vẽ. Chạy từ `apps/mobile`:
```
npx tsc tests/storyMedia.test.ts --outDir %TEMP%/sw-media-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck --jsx react-jsx --types react-native,node
node %TEMP%/sw-media-tests/tests/storyMedia.test.js
```

`characterPortrait.test.ts` (GĐ B3) kiểm chân dung nhân vật AI: đúng method/path `POST /characters/:id/portrait` (fetch giả), câu lỗi 402/409/422/503, nút khoá khi thiếu mô tả / chưa biết giá / thiếu credit và ẩn khi đang vẽ, Dialog xác nhận "trừ N credit" trước khi gọi BE, polling 4 s dừng khi xong / lỗi / quá trần / rời màn (hẹn giờ giả), tải lại credit sau khi vẽ, gợi ý mô tả ngoại hình. Chạy từ `apps/mobile`:
```
npx tsc tests/characterPortrait.test.ts --outDir %TEMP%/sw-portrait-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck --jsx react-jsx --types react-native,node
node %TEMP%/sw-portrait-tests/tests/characterPortrait.test.js
```

`legal.test.ts` (GĐ C) kiểm trang Chính sách bảo mật / Điều khoản dịch vụ: đủ 9 / 10 đề mục, chép nguyên văn từ Web (đọc thẳng `Web/src/pages/legal/*.jsx` nếu workspace có Web cạnh App, không có thì bỏ qua), liên kết ở Đăng nhập / Đăng ký / Trợ giúp, Back về đúng màn trước, form hồ sơ bé có ô ngoại hình + gợi ý và chỉ gửi `null` khi xoá mô tả đang có. Chạy từ `apps/mobile`:
```
npx tsc tests/legal.test.ts --outDir %TEMP%/sw-legal-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck --jsx react-jsx --types react-native,node
node %TEMP%/sw-legal-tests/tests/legal.test.js
```

`specialistMonitoring.test.ts` (GĐ E1) kiểm 4 màn giám sát của Chuyên gia: đúng method/path/query/body cho `/moderation/listings`, `/strikes`, `/audits`, `/audits/run`, `/ai-flags`, `/ai-flags/:userId/block` (fetch giả), cảnh cáo theo nguồn, lỗi BE đã dịch, tổng quan ghép số như Web, Dialog xác nhận bắt buộc trước chọn đợt kiểm tra / khoá-mở khoá AI, điều hướng màn con. Chạy từ `apps/mobile`:
```
npx tsc tests/specialistMonitoring.test.ts --outDir %TEMP%/sw-spec-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck --jsx react-jsx --types react-native,node
node %TEMP%/sw-spec-tests/tests/specialistMonitoring.test.js
```

`adminPlansFinance.test.ts` (GĐ F) kiểm 3 màn Admin: đúng method/path/body cho `/admin/plans` (GET, POST, PUT), `/admin/finance/reconciliation` (+ `fix-counters`), `/admin/settings` (GET, PUT) với fetch giả, lỗi BE (409 / 422) không thành công giả, validate form gói khớp `planFields` + luật gói FREE, Dialog xác nhận bắt buộc trước mọi thao tác ghi, Cấu hình AI chỉ hiện nhóm `ai`, điều hướng màn con. Chạy từ `apps/mobile`:
```
npx tsc tests/adminPlansFinance.test.ts --outDir %TEMP%/sw-admin-f-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck --jsx react-jsx --types react-native,node
node %TEMP%/sw-admin-f-tests/tests/adminPlansFinance.test.js
```

`billingPayment.test.ts` (GĐ D1) kiểm mua / gia hạn gói và hoàn tiền với fetch giả, Linking giả, AppState giả (không gọi BE, không mở trình duyệt): đúng method/path/body cho `POST /payments/plans/checkout`, `GET /payments/orders/:id`, `GET /payments/orders`, `POST /payments/order-items/:id/refund`; nút theo gói hiện tại khớp Web (gia hạn / đang dùng / chuyển về / thanh toán, hết hạn mới); Dialog trước khi tạo đơn; mở đúng `checkoutUrl`, không mở được thì báo lỗi; quay lại app thì kiểm tra đơn đúng một lần, không polling; ẩn nút hoàn tiền khi quá hạn. Chạy từ `apps/mobile`:
```
npx tsc tests/billingPayment.test.ts --outDir %TEMP%/sw-billing-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck --jsx react-jsx --types react-native,node
node %TEMP%/sw-billing-tests/tests/billingPayment.test.js
```

`marketplace.test.ts` (GĐ D2) kiểm Chợ truyện với fetch giả và Linking giả (không gọi BE, không mở trình duyệt): đúng method/path/query/body 9 hàm `/market/*`; nút theo trạng thái sở hữu (của mình / đã có / nhận miễn phí / mua); mua 0đ không mở trình duyệt, > 0đ qua `checkoutAndOpen`; Dialog trước mọi thao tác ghi; kiểm đánh giá (1–5 sao, ≤ 1000 ký tự, thẻ của BE) và báo cáo (6 loại, ≤ 2000 ký tự) như BE; nhóm cài đặt `market` chỉ đúng 4 khoá + ràng buộc hạn hoàn tiền ≤ ngày giữ doanh thu; lối vào và điều hướng. Chạy từ `apps/mobile`:
```
npx tsc tests/marketplace.test.ts --outDir %TEMP%/sw-market-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck --jsx react-jsx --types react-native,node
node %TEMP%/sw-market-tests/tests/marketplace.test.js
```
