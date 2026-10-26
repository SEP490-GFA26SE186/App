# AGENTS.md – Quy tắc phạm vi chỉnh sửa cho mọi AI agent (StoryWeaver)

Áp dụng cho **tất cả AI agents** (Claude Code, Antigravity, v.v.) làm việc trong workspace `D:\fpt\SEP\SEP` (4 repo: `App`, `App_v2`, `Web`, `BE`; `App` nay chỉ gồm Mobile `apps/mobile` + `docs/mobile`). Đây là quy tắc **bắt buộc**. Nếu có xung đột với chỉ dẫn khác, quy tắc trong file này được ưu tiên; chỉ người dùng mới được nới lỏng, bằng lời cho phép rõ ràng.

Đường dẫn dưới đây tính từ gốc workspace `D:\fpt\SEP\SEP`.

## 1. Bảng quyền chỉnh sửa

| Đường dẫn | Quyền |
|---|---|
| `App/apps/mobile/**` | **ĐƯỢC SỬA** source (theo task đã được giao) |
| `App/docs/mobile/**` | Chỉ sửa cho mục đích **tài liệu** |
| `App/CLAUDE.md`, `App/AGENTS.md`, `AGENTS.md` (gốc workspace) | Chỉ sửa cho mục đích **cấu hình AI** |
| `BE/**` | **READ-ONLY tuyệt đối** |
| `Web/**` | **READ-ONLY tuyệt đối** |
| `App_v2/**` | **READ-ONLY tuyệt đối** (chỉ tham khảo kiến trúc/UI) |
| Mọi file khác trong `App/**` (cấu hình gốc repo, ví dụ `.gitignore`; không còn Backend/Vite/Prisma/`packages` ở gốc sau Architecture Cleanup) | **READ-ONLY**, trừ khi người dùng cho phép rõ ràng |
| Ngoài các repo trên | Không chỉnh sửa |

- "READ-ONLY" nghĩa là: được đọc/phân tích; **không** tạo, sửa, xóa, đổi tên, format hay chạy lệnh làm thay đổi file ở đó.
- Quyền sửa `App/apps/mobile/**` không bao gồm việc đổi dependency (xem mục 2).
- Muốn sửa nơi đang READ-ONLY: dừng, nêu lý do và đường dẫn cụ thể, chờ người dùng cho phép rõ ràng (cho từng trường hợp).

## 2. Hành động cần được cho phép rõ ràng
Không tự ý thực hiện:
- `git commit`, `git push`, `git reset`, `git rebase`, `git stash`, tạo/xóa branch/tag (chỉ thực hiện khi người dùng yêu cầu rõ ràng trong chính lượt đó).
- Migration (Expo SDK, React Native, framework, database, schema).
- Cài, gỡ, nâng, hạ **dependency** (`npm/yarn/pnpm install`, `npx expo install`, sửa `package.json`/lockfile).
- Xóa tính năng/màn hình hiện có.
- Chạy lệnh có tác dụng phá hủy hoặc không thể hoàn tác.

## 3. Khi API BE thiếu hoặc sai
- Báo **BLOCKED**, nêu: endpoint, hành vi mong đợi, hành vi thực tế, bằng chứng (file path/dòng trong BE hoặc Web).
- **Tuyệt đối không sửa BE** (dù chỉ một dòng) và không đề xuất "sửa nhanh" bằng cách chỉnh BE.
- **Không dùng mock data, token/user/ví/thanh toán giả hoặc fallback bịa để che giấu lỗi hay thiếu sót của BE.** Hiển thị lỗi thật hoặc trạng thái "chưa hỗ trợ".
- Không đoán API/nghiệp vụ; điều chưa xác minh ghi **UNKNOWN** và hỏi người dùng.

## 4. Bảo mật
- Không đọc, in, ghi lại hay commit nội dung secret trong `.env*`. Không hardcode secret/URL nhạy cảm vào code hoặc tài liệu.

## 5. Quy trình làm việc
1. Đọc `App/CLAUDE.md` và `App/docs/mobile/*` trước khi làm.
2. Chỉ làm task được giao; mỗi lần một task nhỏ.
3. Trước khi chỉnh sửa, kiểm tra đường dẫn đích có nằm trong vùng "ĐƯỢC SỬA" hoặc "chỉ tài liệu/cấu hình AI" của mục 1.
4. Sau khi xong: liệt kê file đã thay đổi, rồi dừng chờ người dùng review.

## 6. Quan hệ với các file khác
- `App/CLAUDE.md` import file này bằng `@AGENTS.md`; nội dung quyền chỉnh sửa chỉ được định nghĩa **ở đây** để tránh mâu thuẫn.
- `AGENTS.md` ở gốc workspace chỉ include file này cho Antigravity.
