# Lộ trình hoàn thiện FE Mobile StoryWeaver (đạt mức demo như Web)

Lập ngày 2026-11-09 · Nguồn đối chiếu: GitHub `main` — App `f84c4f9`, Web `c1311e5`, BE `82a372c` + nhánh `feat/mobile-error-i18n`.
Môi trường demo: Web `https://storyweaver.id.vn` · API `https://api.storyweaver.id.vn/api/v1` (lấy từ tài liệu deploy của BE).
Tài khoản demo **không ghi trong tài liệu hay source**; chủ dự án tự nhập khi test.

> Tiến độ: GĐ A và **GĐ B hoàn tất** (B1, B2, B3, hotfix Expo Go audio, bỏ `baseUrl` trong tsconfig đều đã merge vào `main`). **GĐ C** (trang Chính sách / Điều khoản, ô ngoại hình + gợi ý ở form hồ sơ bé) đã merge. **GĐ E1** (Chuyên gia: giám sát) đã merge. **GĐ F** (Admin: Gói & định giá, Doanh thu & đối soát, Cấu hình AI) đã merge. **GĐ D1** (mua / gia hạn gói qua payOS, lịch sử thanh toán, hoàn tiền) đang làm trên nhánh `feat/mobile-billing-payment`. Tiếp theo: phần còn lại của **D** (Chợ truyện, Bán truyện).
> Quyết định 2026-11-09: **không test thật sau từng đợt; mọi test thật dồn về GĐ G.** Mỗi đợt chỉ cần tsc + test fetch giả + review.
> Đã chạy thật trên máy ảo Android (Expo Go SDK 52) với BE deploy: đăng nhập và đọc dữ liệu OK (sau hotfix Expo Go audio).
>
> **Cách chạy với BE deploy:** mở terminal mới (không đặt `$env:EXPO_PUBLIC_API_URL`, để app đọc `apps/mobile/.env.local`), `cd App/apps/mobile`, chạy `npx expo start -c`, bật máy ảo Android trước rồi bấm `a`.

## 1. Mục tiêu và nguyên tắc

- Mobile làm được mọi việc demo trên Web, cho cả 3 role: Phụ huynh (kèm Kid Mode), Admin, Chuyên gia.
- Giữ nguyên phần Mobile đang tốt: Expo SDK 52, điều hướng hiện tại, `SessionProvider`, Design System. Chỉ thêm phần còn thiếu.
- Luồng tạo truyện và AI **được phép viết code và nối API**. Nhưng Claude **không được tự gọi** các API này. Chủ dự án tự test thật.
- Mỗi giai đoạn làm trên một nhánh riêng. Quy trình: push → review → merge vào `main`. Test thật trên BE demo dồn về GĐ G.

## 2. Hiện trạng (đã xác minh từ source)

| Role | Mobile đã có | Còn thiếu so với Web |
|---|---|---|
| Phụ huynh | Trang chủ, Tủ truyện, Chi tiết truyện, Trình đọc, Bé, Nhân vật, EQ, Ví (chỉ xem), Cài đặt, Trợ giúp; Wizard tạo truyện (Nhà mình, Chuyện mẫu) + theo dõi AI viết | Trình sửa truyện, lối "Tự viết", bật tranh AI + cảnh báo credit, vẽ chân dung nhân vật, xoá truyện, Điều khoản/Chính sách, mua/gia hạn gói, Chợ truyện, Bán truyện |
| Kid Mode | Tủ sách, Reader, điểm dừng EQ, PIN qua BE | Chưa test với BE thật |
| Admin | Tổng quan, Tài khoản, Rút tiền, Hoàn tiền, Kháng nghị, Nhật ký | Gói & định giá, Doanh thu & đối soát, Cấu hình AI |
| Chuyên gia | Hàng chờ, Lượt duyệt, Hồ sơ người bán, Báo cáo vi phạm | Tổng quan, Truyện tạm gỡ, Cảnh cáo, Kiểm tra ngẫu nhiên, Cảnh báo AI, Chuyện mẫu, Kỹ năng con, Mẫu câu hỏi, Soát câu hỏi AI, Tham số báo cáo, Từ khoá chặn |

API thuộc luồng truyện mà Web gọi nhưng Mobile chưa gọi:
- Trang: `POST/PUT/DELETE /stories/:id/pages`
- Điểm dừng: `POST/PUT/DELETE /stories/:id/checkpoints`
- Truyện: `PUT /stories/:id/cover`, `DELETE /stories/:id`
- Tranh và giọng đọc: `POST /stories/:id/images`, `POST /stories/:id/scenes/:sceneId/image`, `POST /stories/:id/narration/retry`
- Chân dung: `POST /characters/:id/portrait`

## 3. Các giai đoạn

Kích thước: S = nhỏ, M = vừa, L = lớn. Thứ tự đã xếp theo mức quan trọng cho buổi demo.

### GĐ A – Chuẩn bị (S) · ĐÃ XONG, đã merge
1. Sửa 4 điểm review trên `feat/mobile-error-i18n`, sau đó merge vào `main`.
2. Cập nhật `CLAUDE.md` theo phạm vi mới (§2.4, §11, §12).
3. Trỏ app tới BE demo: `EXPO_PUBLIC_API_URL=https://api.storyweaver.id.vn` trong `.env.local` (đã có trong `.gitignore`). Test trên Android/Expo Go; Expo Web có thể bị CORS của BE chặn.
4. Đề xuất (cần duyệt dependency): K1, giữ phiên đăng nhập sau khi tắt app, dùng `expo-secure-store`.

### GĐ B – Luồng tạo truyện (L) · trọng tâm của demo · test thật ở GĐ G
Chia 3 đợt, mỗi đợt một nhánh:
- **B1** `feat/mobile-story-editor`: Trình sửa truyện (trang, điểm dừng, ảnh bìa, hoàn tất, xoá truyện) + lối "Tự viết" + sửa `StoryDetailScreen.tsx:117`. Không gọi API AI nào.
- **B2** `feat/mobile-story-ai-media`: bật tranh AI + cảnh báo credit trong Wizard, vẽ tranh/vẽ tiếp/vẽ lại cảnh, giọng đọc + thử lại, làm mới credit.
- **B3** `feat/mobile-character-portrait`: vẽ/vẽ lại chân dung, gợi ý mô tả ngoại hình.

Chi tiết:
1. Wizard: thêm lối "Tự viết"; bật/tắt tranh AI, kèm cảnh báo credit (đủ / chỉ đủ N cảnh / không có tranh) theo `GET /stories/ai-pricing`.
2. **Trình sửa truyện** (màn mới, mở từ Chi tiết truyện): sửa và thêm/xoá trang; sửa và thêm/xoá điểm dừng, kèm chọn kỹ năng con; chọn ảnh bìa; thanh lưu; checkpoint của truyện AI chỉ cho xem, theo đúng luật của Web.
3. Tranh và giọng đọc: vẽ tranh từng cảnh / cả truyện, khung "vẽ tiếp"; trạng thái giọng đọc và nút thử lại; làm mới số credit trên thanh trên cùng khi vẽ xong hoặc lỗi.
4. Nhân vật: nút vẽ chân dung; gợi ý mô tả ngoại hình; nút vẽ lại khi lỗi.
5. Xoá truyện.
6. Sửa luôn `StoryDetailScreen.tsx:117` (đọc lỗi qua `errors.map`, có thể còn tiếng Anh).

### GĐ C – Phụ huynh còn lại (S)
- Thêm trang Điều khoản và Chính sách bảo mật, lấy nội dung từ Web.

### GĐ D – Gói, thanh toán, Chợ truyện, Bán truyện (L)
1. **D1** – Mua và gia hạn gói: mở link thanh toán payOS bằng trình duyệt ngoài (`Linking`, không thêm thư viện); quay lại app thì tải lại gói. Lịch sử thanh toán + yêu cầu hoàn tiền trong hạn. **Lưu ý:** BE đặt `returnUrl`/`cancelUrl` của payOS về **Web** (`BE/api/src/modules/billing/billing.service.js:58-59`), nên thanh toán xong ba mẹ thấy trang kết quả của Web; ba mẹ tự quay lại app, app kiểm tra đơn khi trở lại (hoặc bấm "Kiểm tra thanh toán").
2. Chợ truyện: danh sách, lọc theo giá, chi tiết truyện, khung người bán; hồ sơ người bán công khai; mua truyện, truyện đã mua, báo cáo vi phạm.
3. Bán truyện: đăng ký người bán, sửa hồ sơ bán; đăng truyện, cập nhật phiên bản; doanh thu, tài khoản ngân hàng, rút tiền.

### GĐ E – Chuyên gia (M + L)
- **E1 (M), hợp với điện thoại:** Tổng quan, Truyện tạm gỡ, Cảnh cáo, Kiểm tra ngẫu nhiên, Cảnh báo AI.
- **E2 (L), quản lý nội dung:** Chuyện mẫu, Kỹ năng con, Mẫu câu hỏi (chọn năng lực CASEL), Soát câu hỏi AI, Tham số báo cáo, Từ khoá chặn.

### GĐ F – Admin (M)
- Gói & định giá, Doanh thu & đối soát, Cấu hình AI.

### GĐ G – Kiểm thử và chuẩn bị demo (chủ dự án)
- Ma trận test API theo từng role; regression các luồng có sẵn; kịch bản demo trên điện thoại.
- Các thao tác ghi dữ liệu và luồng tốn token chỉ chạy trên tài khoản demo.

## 4. Quy trình mỗi giai đoạn
1. Claude (chat) lập bảng đối chiếu chi tiết Web – BE – Mobile cho giai đoạn đó và viết prompt triển khai.
2. Claude Code trên máy làm trên nhánh `feat/mobile-<giai-đoạn>`: chạy `tsc` và test (fetch giả), commit, rồi dừng.
3. Chủ dự án push, Claude (chat) review diff và tự chạy lại `tsc` cùng test.
4. Chủ dự án merge. Test thật trên BE demo làm một lần ở GĐ G.

## 5. Thứ tự đề xuất
A → B → C → E1 → F → D → E2 → G

## 6. Quyết định chờ chủ dự án

- **Đề xuất cho BE (D1):** cho `POST /payments/plans/checkout` nhận thêm `returnUrl` (hoặc tham số `client=app`) trong danh sách cho phép, ví dụ deep link `storyweaver://billing/result?orderId=…`, để payOS đưa ba mẹ thẳng về app thay vì về Web. Khi có, Mobile chỉ cần thêm scheme + bắt link (cần duyệt vì đụng cấu hình Expo). Hiện tại Mobile không đổi BE và vẫn chạy được nhờ kiểm tra đơn khi quay lại app.

- **Demo trên iPhone?** App giữ Expo SDK 52, mà Expo Go trên iOS (App Store) chỉ chạy được SDK mới nhất, nên iPhone không mở được app bằng Expo Go. Muốn chạy trên iPhone phải build riêng (development build / TestFlight, cần tài khoản Apple Developer) hoặc nâng SDK (trái quyết định đã duyệt). **Đề xuất: demo bằng Android**: Expo Go trên Google Play cũng chỉ theo SDK mới nhất, nhưng Android cài được bản Expo Go cũ cho SDK 52 (file APK) hoặc một bản build APK của app. Cần kiểm lại trên máy demo ở GĐ G.
