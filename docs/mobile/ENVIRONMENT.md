# ENVIRONMENT – Cấu hình địa chỉ Backend cho Mobile

Cập nhật: A0.2. Mobile đọc địa chỉ API từ biến công khai **`EXPO_PUBLIC_API_URL`** (Expo SDK 52 nhúng giá trị vào bundle lúc build/khởi động Metro).
**Không** đặt secret/token/mật khẩu vào biến `EXPO_PUBLIC_*`. Không có địa chỉ mặc định trong code; địa chỉ production chỉ được cấu hình khi nhóm BE xác nhận.

## Cách cấu hình
1. Tại `App/apps/mobile`: `copy .env.example .env` (file `.env*` đã nằm trong `.gitignore`, chỉ `.env.example` được commit).
2. Điền `EXPO_PUBLIC_API_URL`. Chấp nhận dạng gốc (`http://host:3000`) hoặc đầy đủ (`http://host:3000/api/v1`); app tự chuẩn hóa về `…/api/v1`, không bị lặp.
3. Khởi động lại Expo (`npx expo start -c`) để nhúng giá trị mới.

| Môi trường | Giá trị ví dụ |
|---|---|
| Expo Web (cùng máy chạy BE) | `http://localhost:3000` |
| Android Emulator | `http://10.0.2.2:3000` (10.0.2.2 = máy host) |
| iOS Simulator | `http://localhost:3000` |
| Thiết bị thật (Expo Go) | `http://<IP-LAN-máy-chạy-BE>:3000` – điện thoại và máy tính cùng mạng; BE phải lắng nghe trên mọi interface và firewall cho phép cổng |

Backend: cổng mặc định 3000 (`BE/api/src/config/env.js`), API mount tại `/api/v1` (`BE/api/src/app.js`).

## Hành vi khi cấu hình thiếu/sai
- Không đặt hoặc giá trị không phải `http(s)://…`: mọi request báo lỗi *"Chưa cấu hình địa chỉ máy chủ…"* (không gửi request, không dùng mock/phiên giả). Màn Login hiển thị cảnh báo này.
- Chế độ `__DEV__`: tab "API" trong AuthModal cho nhập địa chỉ tạm thời (ví dụ IP LAN) mà không cần khởi động lại; **không** có trong bản production.
