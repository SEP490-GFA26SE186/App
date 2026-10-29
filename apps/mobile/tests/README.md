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
