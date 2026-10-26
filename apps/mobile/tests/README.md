# tests (offline, không cần Backend)

`authRace.test.ts` kiểm tra request đăng ký/đăng nhập bị hủy khi rời màn không được ghi token/phiên. Fetch giả chỉ nằm trong file test.

Chạy (không cần dependency mới; dùng `tsc` có sẵn và Node):
```
cd apps/mobile
npx tsc tests/authRace.test.ts --outDir %TEMP%/sw-tests --module commonjs --target es2022 --esModuleInterop --skipLibCheck --jsx react-jsx
node %TEMP%/sw-tests/tests/authRace.test.js
```
(Bash: dùng `$TEMP` thay cho `%TEMP%`.)
