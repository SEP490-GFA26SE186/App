# tests (offline, không cần Backend)

`authRace.test.ts` kiểm tra request đăng ký/đăng nhập bị hủy khi rời màn không được ghi token/phiên. Fetch giả chỉ nằm trong file test.

Chạy (không cần dependency mới; dùng `tsc` có sẵn và Node):
```
cd apps/mobile
npx tsc tests/authRace.test.ts --outDir %TEMP%/sw-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck --jsx react-jsx
node %TEMP%/sw-tests/tests/authRace.test.js
```
(Bash: dùng `$TEMP` thay cho `%TEMP%`.)

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
