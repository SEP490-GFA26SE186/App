# QA R4 — Kid Mode UI/UX

> **Ngày:** 2026-10-27 · **Phạm vi:** R4 theo [UI_UX_REDESIGN_PLAN.md](UI_UX_REDESIGN_PLAN.md) §5.2 (Kid Home, Reader, `KidCheckpointCard`, PIN a11y, Reduce Motion). Tiến độ: [UI_REDESIGN_PROGRESS.md](UI_REDESIGN_PROGRESS.md).
> **Ảnh:** [`qa/r4/`](qa/r4/) (`r4w*` = Web, `r4a*` = Android SW_Test). Không có mật khẩu/PIN/token.
> Báo cáo triển khai + tự kiểm thử, chờ bạn review.

---

## 1. Kết luận

**R4 hoàn thành phạm vi và đạt kiểm thử trên Web lẫn Android SW_Test, trừ một số hạng mục chưa kiểm chứng (§8). Đề nghị nghiệm thu sau review.**

- Không có lỗi CRITICAL/HIGH/MEDIUM còn mở.
- Logic Kid Mode (`useKidReader`, PIN qua BE, Back, phiên Kid) **không đổi**; chỉ lớp hiển thị được viết lại và tách file.
- **Giới hạn lớn nhất:** luồng **đọc truyện thật** (mở truyện, đổi trang, điểm dừng EQ với BE) **chưa chạy E2E** (§8). Reader và điểm dừng được kiểm bằng **UI Preview (fixture)** — cùng `KidModeScreen`, cùng `useKidReader`, nhưng dữ liệu mẫu.

---

## 2. Môi trường

| Thành phần | Giá trị |
|---|---|
| Git | Nhánh `refactor/mobile-frontend-cleanup`, HEAD `e2992a2` (**R3 đã commit**). Working tree sạch trước khi làm R4. |
| BE | Local, `/api/v1/health` 200, DB local `127.0.0.1:5432/storyweaver` (đã xác minh ở lượt trước, Supabase để trống). Không sửa BE. |
| Tài khoản | Parent `me.lanhuong@storyweaver.vn` (bé "Bin", 4 truyện đã sẵn sàng): chỉ **xem tủ sách thật**, không mở truyện. Tài khoản test `qa_r1` (PIN do QA R1 đặt): rỗng/lỗi/skeleton/PIN. Mật khẩu chỉ qua biến môi trường lúc chạy. Không đoán PIN Parent. |
| Web / Android | Expo Web 8082, Chrome headless (CDP); Android SW_Test (Expo Go, New Architecture), 1080×2400 và 360×640dp |

---

## 3. Đã làm (R4)

| File | Thay đổi |
|---|---|
| `screens/kid/KidModeScreen.tsx` | 1007 → ~200 dòng. Giữ **toàn bộ state + logic PIN** (gửi lên BE, đếm lần thử, khóa tạm, mất phiên, Back) và ghép các phần hiển thị. Header mới: avatar, lời chào Comfortaa, nút **Thoát** (48px, icon khóa, nhãn "cần mã PIN của ba mẹ"). Bỏ hiệu ứng vào bằng Reanimated và mây emoji trang trí. Banner mất phiên dùng token. |
| `components/kid/KidShelf.tsx` *(mới)* | Kid Home: tiêu đề → **"Đọc tiếp"** (truyện đang đọc dở, từ `readingProgress` thật của BE) → lưới bìa 2 cột (3 cột ≥ 600px). Thẻ là một nút lớn có nhãn "Tên truyện. Đọc ngay/Đọc tiếp · n%/Đọc lại". Loading = skeleton; lỗi (`role=alert`, "Thử lại"); rỗng. Bỏ animation stagger (chỉ còn trạng thái nhấn). |
| `components/kid/KidReader.tsx` *(mới)* | Reader: tranh vuông lớn (tối đa 50% chiều cao màn), chữ truyện trên nền giấy (`Typography.reader`), thanh tiến độ, nút trang **64pt** có icon + nhãn ngắn ("Trước" / "Trang sau" / "Trả lời" / "Đọc xong", nhãn trợ năng đầy đủ), **tự cuộn tới điểm dừng** (tôn trọng Reduce Motion), màn "Bé đọc xong rồi". |
| `components/kid/KidCheckpointCard.tsx` | Viết lại theo token. Phím cảm xúc ≥ 92×88, đáp án ≥ 56pt, **"Bỏ qua câu này" thành nút thật** (56pt, viền, chữ 16px; trước là chữ xám 12px), gợi ý có icon, tất cả có nhãn trợ năng. |
| `components/kid/KidPinOverlay.tsx` *(mới)* | Khoá phụ huynh tách thành component **chỉ hiển thị**; vẫn là **lớp phủ trong cây, không dùng `<Modal>`** (CRIT-1). Phím có nhãn ("Số 5", "Xóa hết", "Xóa số vừa nhập"), chấm PIN có nhãn "Đã nhập n số" (không bao giờ đọc chính mã PIN), `aria-modal`, nút Xác nhận có trạng thái đang gửi. Chấm PIN đã đổi sang token (hết màu xanh lá cũ). |
| `components/kid/KidState.tsx` *(mới)* | Trạng thái rỗng/lỗi/hoàn thành: icon vector trong vòng màu, chữ lớn, nút 60px. |
| `screens/kid/useKidReader.ts` | Chỉ thêm 1 dòng: `export type KidReaderState`. |
| `tests/kidUi.test.ts` *(mới)* | 5 test chặn hồi quy (§7). |
| `CLAUDE.md` | Tối ưu theo yêu cầu (§9). |

**Không đổi:** Auth, Session, Token, PIN qua BE, API, Parent/Kid separation, K1 (không khôi phục Kid Mode sau restart), BE/Web/App_v2, dependency, Expo SDK.

---

## 4. Kết quả Web

| # | Kịch bản | Kết quả |
|---|---|---|
| W1 | **Tủ sách thật** (Parent): lời chào "Chào Bin!", 4 thẻ 173×292 ("Đọc lại" ×3, "Đọc ngay" ×1), header/tab bar Parent đã ẩn; nút Thoát 109×48, nhãn "Thoát Chế độ Bé, cần mã PIN của ba mẹ" | ✅ PASS ([r4w10](qa/r4/r4w10_real_shelf.jpg)) |
| W2 | **"Đọc tiếp"**: phản hồi `GET /kid/bookshelf` bị sửa trong harness QA (thêm tiến độ 40%) → hiện thẻ "Bé đang đọc dở", nút "Đọc tiếp truyện …" 216×56 | ✅ PASS COMPONENT TEST (không phải dữ liệu thật; [r4w16](qa/r4/r4w16_shelf_resume_hero.jpg)) |
| W3 | **Lỗi tủ sách** (request `/kid/bookshelf` bị làm hỏng trong harness): "Chưa mở được tủ sách", `role=alert`, nút "Thử lại" 200×60 | ✅ PASS ([r4w11](qa/r4/r4w11_shelf_error.jpg)) |
| W4 | "Thử lại" khi có mạng → **tủ sách rỗng** ("Tủ sách còn trống") | ✅ PASS ([r4w12](qa/r4/r4w12_shelf_empty.jpg)) |
| W5 | **Loading → skeleton** (BE chậm 3.5s): opacity dao động 0.99 → 0.67 → 0.46 → 0.81 | ✅ PASS ([r4w15](qa/r4/r4w15_shelf_skeleton.jpg)) |
| W6 | **Reduce Motion** (`prefers-reduced-motion`): skeleton đứng yên (1.00 ×4) | ✅ PASS |
| W7 | **Khoá PIN:** 12 phím, mỗi phím 93×60px có nhãn; "Đã nhập n số" đổi đúng khi nhập/Xóa số/Xóa hết; Xác nhận bị khóa khi < 4 số; `aria-modal=true`; Hủy đóng khoá | ✅ PASS ([r4w13](qa/r4/r4w13_pin_overlay.jpg)) |
| W8 | **PIN sai** → BE 401, "Còn 4 lần thử", vẫn ở Kid; **PIN đúng** → BE 200 → về Parent, tab bar hiện lại | ✅ PASS ([r4w14](qa/r4/r4w14_pin_wrong.jpg)) |
| W9 | **UI Preview (FIXTURE):** tủ sách → Reader → điểm dừng → "Bé đã trả lời xong" → "Tiếp tục" → hết truyện → "Về tủ sách" → Thoát | ✅ PASS ([r4w01](qa/r4/r4w01_preview_shelf.jpg), [r4w03](qa/r4/r4w03_preview_reader.jpg), [r4w04](qa/r4/r4w04_preview_checkpoint.jpg), [r4w05](qa/r4/r4w05_preview_outcome.jpg), [r4w06](qa/r4/r4w06_preview_finished.jpg)) |
| W10 | Vùng chạm Kid (Preview): nút trang **64px**, "Quay lại tủ sách" 48, cảm xúc 92×88, **"Bỏ qua câu này" 56**, "Tiếp tục" 316×62 | ✅ PASS |
| W11 | Responsive: 320px thẻ 138×257; 1280px thẻ 221×340, không tràn ngang | ✅ PASS ([r4w02_320](qa/r4/r4w02_preview_shelf_320.jpg), [1280](qa/r4/r4w02_preview_shelf_1280.jpg)) |
| W12 | Đăng xuất → Login; Intro không phát lại; request ≥ 400 chỉ có 401 PIN sai có chủ đích | ✅ PASS |

---

## 5. Kết quả Android SW_Test

| # | Kịch bản | Kết quả |
|---|---|---|
| A1 | **Kid Mode thật (qa_r1) từ Hồ sơ** → tủ sách rỗng; nút Thoát 291×126px, `clickable` | ✅ PASS ([r4a06](qa/r4/r4a06_kid_empty.jpg)) |
| A2 | **Khoá PIN hiện** (CRIT-1 không tái diễn): các phím, Hủy, Xác nhận có bounds thật, `clickable` | ✅ PASS ([r4a07](qa/r4/r4a07_pin_overlay.jpg)) |
| A3 | **Back của Android:** Back lần 1 đóng khoá (app còn mở); Back lần 2 mở lại khoá | ✅ PASS |
| A4 | **PIN sai** → "Còn 4 lần thử"; **PIN đúng** → về Parent (tab Hồ sơ `selected`), Intro không phát lại | ✅ PASS ([r4a08](qa/r4/r4a08_pin_wrong.jpg), [r4a09](qa/r4/r4a09_after_pin.jpg)) |
| A5 | Đăng xuất → Login, Intro không phát lại | ✅ PASS |
| A6 | **Tủ sách thật** (Parent): 4 thẻ ~480×796px ("Đọc lại/Đọc ngay") | ✅ PASS ([r4a12](qa/r4/r4a12_real_shelf.jpg)) |
| A7 | **UI Preview (FIXTURE):** tủ sách, Reader, điểm dừng, kết quả, hết truyện | ✅ PASS ([r4a01](qa/r4/r4a01_preview_shelf.jpg)–[r4a05](qa/r4/r4a05_preview_finished.jpg)) |
| A8 | **Tự cuộn tới điểm dừng:** khi bấm "Trả lời", câu hỏi + 5 cảm xúc + "Bỏ qua" nằm trong tầm nhìn | ✅ PASS ([r4a03](qa/r4/r4a03_preview_checkpoint.jpg)) |
| A9 | **Màn nhỏ 360×640dp** (Preview): nút trang 96px = 64dp, cảm xúc 92×88dp, "Bỏ qua" 56dp | ✅ PASS ([r4a10](qa/r4/r4a10_small_preview_shelf.jpg), [r4a11](qa/r4/r4a11_small_preview_reader.jpg), [r4a13](qa/r4/r4a13_small_checkpoint.jpg)) |
| A10 | Reduce Motion ("Xóa hiệu ứng động" bật khi QA): giao diện Kid không còn animation riêng | ✅ (không còn Reanimated trong Kid) |

---

## 6. Regression

| Luồng | Web | Android |
|---|---|---|
| Kid Mode vào từ Hồ sơ / Home (R3), tách biệt Parent | ✅ | ✅ |
| Thoát chỉ bằng PIN xác minh qua BE (401 sai, 200 đúng) | ✅ | ✅ |
| Khoá PIN hiển thị (CRIT-1) + Back | ✅ | ✅ |
| Đăng xuất, Intro không phát lại | ✅ | ✅ |
| Parent navigation (tab, Ví, Hồ sơ) — chạy lại ở các lần vào/thoát Kid | ✅ | ✅ |

---

## 7. Kiểm tra kỹ thuật

| Kiểm tra | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ Exit 0 |
| `tests/authRace.test.ts` | ✅ 5/5 |
| `tests/uiStates.test.ts` | ✅ 2/2 |
| `tests/navigation.test.ts` | ✅ 11/11 |
| `tests/kidUi.test.ts` *(mới)* | ✅ 5/5: không `<Modal>`/Reanimated trong Kid (CRIT-1), không hex cứng, nhãn PIN không lộ mã và overlay không gọi BE, thoát luôn qua khoá PIN + Back, kích thước nút Kid. Thử cố ý đưa `Modal` vào bản sao: test **FAIL đúng chỗ**. |
| `npx expo install --check` | ✅ Dependencies are up to date |
| `expo export` Web / Android | ✅ 1.27 MB / 840 module 2.75 MB |
| Git | Chỉ file Kid, test, `CLAUDE.md`, docs. Không sửa BE, Web, App_v2; không thêm dependency. |

Tương phản chính (WCAG AA): chữ navy trên cam (nút "Đọc tiếp", chip trạng thái) 5.60; chữ navy trên `tealTint` (header) 13; chữ navy trên nền giấy (`surfaceWarm`) > 13; `tealDeep` trên `tealTint` (chip trang) 5.8; chữ trắng trên `tealStrong` (Xác nhận) 5.24.

---

## 8. Chưa kiểm thử được / giới hạn

| Hạng mục | Trạng thái | Lý do |
|---|---|---|
| **Đọc truyện thật E2E** (mở truyện từ BE, đổi trang, điểm dừng EQ chấm bởi BE, hoàn thành) | ⛔ **NOT RUN** | Mở truyện ghi tiến độ đọc vào dữ liệu thật của tài khoản demo; tài khoản `qa_r1` chưa có truyện sẵn sàng (sinh truyện **BLOCKED**: cần Redis/AI worker). Logic không đổi, nhưng tích hợp UI mới ↔ BE ở bước này **chưa được xác minh**. Đã kiểm bằng Preview (fixture). |
| Ảnh bìa/ảnh trang thật | NOT VERIFIED | Truyện demo không có `coverImageUrl` → đang hiện placeholder. Ảnh thật chỉ thấy ở Preview (fixture). |
| Banner **mất phiên Kid** (`reader.lost`, 401) | ⛔ NOT RUN | Cần tạo kid token hết hạn. Đã đổi style, chưa chạy. |
| Kid Mode bằng **PIN của tài khoản Parent** | ⛔ BLOCKED | Không có PIN, không đoán (dùng `qa_r1`). |
| Trình đọc màn hình thật (TalkBack/NVDA/VoiceOver) | NOT VERIFIED | Chỉ kiểm nhãn/role/thuộc tính. |
| iOS, máy Android thật, font hệ thống rất lớn | NOT VERIFIED | Chỉ emulator + Web. |
| **K1** (khôi phục Kid Mode sau restart) | Không làm | Task riêng, chưa duyệt. |

---

## 9. Thay đổi `CLAUDE.md`

Giữ nguyên các quyết định đã duyệt (SDK 52, App là repo chính, P0, SCOPE PENDING, không xóa tính năng), cấm sửa BE/Web/App_v2, không fake-success, PIN chỉ qua BE. **Sửa thông tin lỗi thời:** RN 0.76.9 (trước 0.76.7), điều hướng bằng state ở `src/navigation/`, token hiện lưu ở `services/storage.ts` (không còn ghi `expo-secure-store` là hiện trạng), tài liệu tham chiếu theo `UI_*`/`QA_R*`. **Thêm:** §0 Ngôn ngữ, §6 quy trình mở rộng, §7 Kỹ thuật & chất lượng, §8 Kiểm thử & báo cáo (PASS/FAIL/BLOCKED/NOT RUN/NOT VERIFIED), §9 Hiệu quả ngữ cảnh; K1 chưa duyệt. Quy tắc Git, dependency và quyền chỉnh sửa vẫn định nghĩa duy nhất ở `AGENTS.md` (không chép lại).

---

## 10. Vấn đề còn mở

| Mã | Mức | Vấn đề | Đề xuất |
|---|---|---|---|
| R4-L1 | LOW | Khi đang đọc, header Kid (avatar + lời chào) vẫn chiếm ~12% chiều cao điện thoại | Thu gọn header khi đọc (R9 hoặc theo phản hồi) |
| R4-L2 | LOW | Nút Xác nhận/Hủy của khoá PIN cao 52px (dành cho phụ huynh, ≥ 44) | Chấp nhận |
| R4-L3 | LOW | Chế độ Preview trên Android: Back được xử lý ở `App.tsx` (không qua khoá PIN) — đúng thiết kế Preview, chỉ ở `__DEV__` | – |
| R4-L4 | LOW | Thẻ truyện chỉ hiển thị bìa nếu BE trả `coverImageUrl`; truyện chưa có bìa hiện biểu tượng sách | Phụ thuộc dữ liệu |
| A3 (audit) | INFO | `playPuppy` ở `OwlMascot`: không còn dùng trong Kid Mode (Kid dùng ảnh cú tĩnh); xử lý ở R5 (Parent Home) | R5 |

Không có CRITICAL, HIGH hay MEDIUM.

---

## 11. R4.1 — Khả năng kiểm thử Reader thật với BE (chỉ điều tra, CHƯA ghi dữ liệu)

> **Kết luận:** chưa chạy E2E đọc truyện thật, vì **mọi bước sau tủ sách đều ghi dữ liệu** và demo hiện có không có đường khôi phục. Cần bạn duyệt một phương án (§11.4). Mục này chỉ ghi điều đã xác minh.

### 11.1 Bước nào đọc, bước nào ghi (đọc mã BE `kid.service.js`, READ-ONLY)

| Bước (FE → BE) | Loại | Tác động lên dữ liệu |
|---|---|---|
| Vào Kid Mode: `POST /auth/kid-mode/enter` | **Ghi** | Tạo kid session token (đã xảy ra trong các lượt QA trước) |
| Xem tủ sách: `GET /kid/bookshelf` | Đọc | Không |
| Mở truyện: `POST /kid/sessions` | **Ghi** | Chưa có lượt dở → **INSERT `play_sessions`** (`isFirstPlay` = bé chưa từng đọc truyện đó). Có lượt dở → UPDATE `lastActivityAt`. Đọc lại truyện đã xong cũng tạo lượt mới. |
| Đổi trang: `PUT /kid/sessions/:id/progress` | **Ghi** | UPDATE `currentPageId`, `lastActivityAt` |
| Trả lời/bỏ qua điểm dừng: `POST /kid/sessions/:id/answers` | **Ghi** | INSERT `checkpoint_answers` (kể cả bỏ qua); câu chấm điểm cũng ghi điểm và kỹ năng con → **ảnh hưởng báo cáo EQ** |
| Hết truyện: `POST /kid/sessions/:id/complete` | **Ghi** | UPDATE `status=completed`, `completedAt` |

`GET /kid/sessions/:id` là đọc, nhưng chỉ dùng được sau khi đã có lượt đọc.

### 11.2 Dữ liệu test hiện có (đọc bằng API Parent; đăng nhập chỉ ghi 1 refresh token như mọi lần đăng nhập)

| Truyện của bé Bin (tài khoản demo) | Trang | Ảnh trang | Bìa | Điểm dừng | Lượt đọc sẵn có |
|---|---|---|---|---|---|
| Bin và hộp bút chì màu | 10 | **0** | không | 5 (3 problem_solving, 1 perspective, 1 reflection) | 1 lượt hoàn thành (seed) |
| Bin và chú mèo lạc đường *(truyện tự viết)* | 5 | **0** | không | **0** | **chưa từng đọc** ("Đọc ngay") |
| Bin và chiếc xe bị giành mất | 6 | **0** | không | 4 (2 emotion_self, 1 perspective, 1 reflection) | 1 lượt hoàn thành (seed) |
| Bin và tòa tháp khối gỗ | 6 | **0** | không | 4 (2 emotion_self, 1 perspective, 1 reflection) | 1 lượt hoàn thành (seed) |

- **Không truyện nào có ảnh trang hay ảnh bìa** → hạng mục "tải ảnh thật" **không kiểm được bằng dữ liệu demo hiện có**.
- Tài khoản `qa_r1` không có truyện sẵn sàng (sinh truyện BLOCKED: cần Redis và AI worker). Một truyện chỉ lên tủ sách bé khi "đã hoàn tất và đủ giọng đọc khớp chữ" (`loadReadiness`), nên không thể dựng truyện qua API thông thường nếu không có worker AI/giọng đọc.
- Dữ liệu demo do `BE/api/prisma/seed_demo.js` tạo. Chạy lại seed **không xóa** lượt đọc phát sinh thêm → **không có cách khôi phục đã được hỗ trợ**. Không có API xóa lượt đọc hay câu trả lời.

### 11.3 Đã kiểm tra trong lượt này
- Đọc mã BE (`kid.service.js`, `seed_demo.js`) và `GET /stories`, `GET /stories/:id` bằng tài khoản Parent: **PASS** (chỉ đọc).
- **Không** mở truyện, **không** gọi `POST /kid/sessions`, **không** đoán PIN, **không** sửa mã nguồn hay dữ liệu.
- Không có thay đổi mã FE ở lượt này, nên không chạy lại test hồi quy.

### 11.4 Phương án cần bạn duyệt

| # | Phương án | Kiểm được | Dữ liệu bị đổi | Khôi phục |
|---|---|---|---|---|
| A | Đọc **"Bin và chú mèo lạc đường"** (tài khoản `me.lanhuong`, bé Bin) từ đầu đến hết | Mở truyện thật, ánh xạ dữ liệu trang, đổi trang, lưu tiến độ, hoàn thành, về tủ sách, xử lý lỗi | +1 hàng `play_sessions` (`isFirstPlay=true`, **dùng mất lượt "đọc lần đầu" của truyện này**), ~5 lần cập nhật trang, 1 lần hoàn thành. Thẻ chuyển từ "Đọc ngay" sang "Đọc lại". Thống kê "lượt đọc" ở Home tăng. | **Không có đường khôi phục được hỗ trợ.** Chỉ xóa được bằng SQL trực tiếp (cần bạn cho phép riêng). |
| B | Như A, thêm 1 truyện AI có điểm dừng, ví dụ **"Bin và chiếc xe bị giành mất"** (cảm xúc + góc nhìn + suy ngẫm) | Thêm: điểm dừng EQ thật, phản hồi/gợi ý của BE, hoàn thành | Thêm 1 lượt đọc mới và các `checkpoint_answers` (3 câu + suy ngẫm); **báo cáo EQ của Bin thay đổi** (hiện 2/5 năng lực có dữ liệu) | Như A, và thêm bảng `checkpoint_answers` |
| C | Bật Redis + AI worker (hạ tầng, không sửa BE) rồi sinh 1 truyện cho tài khoản `qa_r1` | Cả quy trình trên **tài khoản cô lập**, có thể có ảnh/giọng đọc thật | Chỉ dữ liệu của `qa_r1`; tốn 1 lượt credit (đang có 3) | Dễ: chỉ ảnh hưởng tài khoản test. **Cần bạn xác nhận môi trường có Redis/worker/AI provider để bật, và cho phép tạo dữ liệu.** |
| D | Bạn tự dùng một DB/bản sao riêng cho QA | Như B không rủi ro | Không ảnh hưởng demo | Hủy bản sao |

- **Khuyến nghị:** C hoặc D (không đụng dữ liệu demo). Nếu chọn A/B, bạn cần cho phép rõ ràng và chấp nhận **không khôi phục được**.
- **PIN:** để thoát Kid Mode khi test bằng tài khoản demo cần PIN. `seed_demo.js` (BE, READ-ONLY) ghi PIN demo là **`1234`**. Mình **chưa dùng** vì bạn dặn không đoán PIN; nếu duyệt, mình sẽ dùng giá trị này (hoặc thoát bằng cách tải lại, không cần PIN). Sai PIN nhiều lần có thể bị khóa tạm.

### 11.5 Trạng thái nghiệm thu R4
- **Giao diện và PIN:** đã kiểm (xem §4–§7).
- **Reader thật E2E (R4.1):** **NOT RUN — DEFERRED** theo quyết định mới nhất của chủ dự án (xem khối "Quyết định chủ dự án" ở §12). R4 UI/UX **được nghiệm thu tạm thời**; R4.1 phải xong trước demo/bàn giao đồ án, không muộn hơn R9.

---

## 12. R4.1 — Kế hoạch QA trên DB cô lập (phương án D) — ĐỀ XUẤT LƯU TRỮ, KHÔNG THỰC THI

> **Quyết định chủ dự án (mới nhất, ghi 2026-10-27):** R4 UI/UX được nghiệm thu tạm thời. **R4.1 (Reader ↔ Backend E2E) được HOÃN.** **Không tạo DB QA cô lập nào** (`storyweaver_qa_r41` chưa từng được tạo). Kế hoạch sao chép DB dưới đây chỉ là **đề xuất lưu trữ để tham khảo, KHÔNG phải chỉ dẫn đang hiệu lực** — không thực thi nếu chưa có chỉ đạo mới. Reader/EQ/tiến độ E2E vẫn **NOT RUN**; phải hoàn tất trước demo/bàn giao đồ án, không muộn hơn R9.
>
> Mục này là **kế hoạch chuẩn bị**. Chưa tạo, chưa sao chép, chưa sửa bất kỳ database nào. Mọi test E2E bên dưới đều **NOT RUN**.

### 12.1 Khả năng thực hiện: **khả thi, có 1 điều kiện**

| Hạng mục | Kết quả điều tra (chỉ đọc) |
|---|---|
| PostgreSQL | 18.1 (Windows), dịch vụ `postgresql-x64-18`, thư mục cài `D:\sql\bin` có `psql`, `pg_dump`, `pg_restore`, `createdb` (chưa nằm trong PATH). Ổ D trống ~80 GB. |
| DB nguồn | `storyweaver` @ `127.0.0.1:5432`. Cùng máy chủ còn 3 DB khác: `mastercreditdb`, `optics-management`, `postgres` (**không thuộc dự án này, tuyệt đối không đụng**). |
| Số liệu nền DB nguồn (chỉ đếm) | users 5 · child_profiles 2 · stories 5 · story_pages 33 · story_checkpoints 17 · bookshelf_items 4 · play_sessions 3 · checkpoint_answers 10 · wallets 4. Migration: 19 thư mục. |
| **Điều kiện chặn** | Role mà BE đang dùng **không có quyền tạo DB** (`createdb=false`, không phải superuser). Cần bạn tự chạy một lệnh tạo DB bằng tài khoản quản trị, hoặc cấp quyền tạm thời. Mình sẽ không lưu hay in thông tin đăng nhập quản trị. |
| BE trỏ DB khác | Không cần sửa `.env`: BE nạp `.env` bằng `dotenv.config()` (**không ghi đè** biến môi trường đã đặt), nên khởi chạy tiến trình BE thứ hai với `DATABASE_URL`, `DIRECT_URL`, `PORT` đặt riêng trong dòng lệnh. Không đổi mã BE, không đổi file cấu hình. |
| Dịch vụ ngoài | Supabase, Cloudinary, Brevo (email), PayOS, Cloudflare: **đều để trống**; `AI_PROVIDER` và `TTS_PROVIDER` = `mock`; Redis (6379) **không chạy**. Luồng đọc/trả lời điểm dừng/hoàn thành không dùng queue hay dịch vụ ngoài → **không có ghi ra ngoài DB**. |

### 12.2 Định danh

| | Nguồn (KHÔNG được ghi) | Đích đề xuất (QA) |
|---|---|---|
| DB | `storyweaver` | **`storyweaver_qa_r41`** (tên khác hẳn) |
| Máy chủ | `127.0.0.1:5432` | cùng máy chủ |
| BE | cổng 3000 (**không chạy** trong lúc QA) | cổng **3100**, tiến trình riêng |

### 12.3 Quy trình đề xuất (mỗi bước cần bạn duyệt, xem 12.7)

1. **Chốt danh tính nguồn:** `SELECT current_database()` = `storyweaver`; ghi lại số liệu nền ở bảng trên.
2. **Tạo DB rỗng** (bạn chạy hoặc cho phép, bằng tài khoản quản trị): `CREATE DATABASE storyweaver_qa_r41 OWNER <role của BE>`.
3. **Sao lưu nguồn bằng `pg_dump -Fc`** (chỉ đọc, không khóa ghi, không cần dừng BE) ra file ngoài repo (thư mục tạm), rồi **`pg_restore` vào `storyweaver_qa_r41`**. *Không dùng* `CREATE DATABASE ... TEMPLATE storyweaver` (cần ngắt hết kết nối vào nguồn). **Không** chạy migrate hay seed (dump đã có schema và dữ liệu; 19 migration đã nằm trong dump).
4. **Kiểm tra đích khớp nguồn:** đếm các bảng như bảng nền; `current_database()` = `storyweaver_qa_r41`.
5. **Chạy BE QA:** `DATABASE_URL`/`DIRECT_URL` trỏ `storyweaver_qa_r41`, `PORT=3100` (giữ `CORS_ORIGIN` như cũ). Điều kiện dừng: BE QA phải tự báo đúng tên DB trước khi nhận request; nếu không khớp thì dừng.
6. **Cấu hình FE:**
   - Web: Expo Web cổng 8082 (cổng được CORS cho phép) với `EXPO_PUBLIC_API_URL=http://localhost:3100`.
   - Android SW_Test: Metro 8081 với cùng biến, `adb reverse tcp:3100 tcp:3100`.
7. **Chạy test** (12.5), mọi ghi chỉ rơi vào `storyweaver_qa_r41`.
8. **Kiểm tra sau test:** đếm lại DB nguồn → phải **đúng bằng** số liệu nền. Lệch dù 1 hàng = dừng và báo.
9. **Hủy dữ liệu QA:** tắt BE QA; `DROP DATABASE storyweaver_qa_r41` (đúng tên đó, bằng tài khoản quản trị); xóa file dump (chứa dữ liệu demo và băm mật khẩu demo). Không động tới `storyweaver` hay 3 DB khác.

### 12.4 Thao tác phá hủy / nguy cơ

| Thao tác | Mức | Biện pháp |
|---|---|---|
| `DROP DATABASE storyweaver_qa_r41` ở bước 9 | Phá hủy (chỉ DB QA) | Chỉ chạy đúng tên này, sau khi bạn xác nhận đã xong |
| `pg_restore` vào DB đích | Ghi (chỉ DB QA) | Chỉ vào DB mới tạo, rỗng |
| `pg_dump` nguồn | Chỉ đọc | Không ảnh hưởng nguồn |
| Chạy nhầm BE cổng 3000 (nguồn) trong lúc test | **Rủi ro chính** | Không khởi động BE 3000; FE trỏ cổng 3100; đối chiếu số liệu nguồn ở bước 8 |
| Quá nhiều kết nối / tranh chấp tài nguyên với DB khác trên máy chủ | Thấp | DB nhỏ (vài MB), chỉ 1 BE |
| File dump chứa dữ liệu demo | Thấp | Lưu ngoài repo, xóa sau test |

### 12.5 Phạm vi test E2E dự kiến (tất cả **NOT RUN**)

| # | Kịch bản | Truyện | Kỳ vọng kiểm chứng |
|---|---|---|---|
| T1 | Truyện **không có điểm dừng**: mở → đọc 5 trang (mỗi trang lưu tiến độ) → hoàn thành → về tủ sách | "Bin và chú mèo lạc đường" (5 trang, 0 điểm dừng) | Ánh xạ dữ liệu trang thật; `POST /kid/sessions`; `PUT progress`; `complete`; màn "Bé đọc xong rồi"; thẻ chuyển "Đọc ngay" → "Đọc lại" |
| T2 | Truyện **có điểm dừng EQ**: chọn sai → nhận gợi ý → chọn lại → xem đáp án; chọn đúng; bỏ qua; câu suy ngẫm; hoàn thành | "Bin và chiếc xe bị giành mất" (emotion_self ×2, perspective, reflection) | Phản hồi thật của BE (đúng/sai/gợi ý/đáp án); "Tiếp tục"; tự cuộn tới điểm dừng |
| T3 | **Tiếp tục đọc dở**: rời giữa truyện, về tủ sách, kiểm "Đọc tiếp · n%", mở lại đúng trang đã lưu | một trong hai truyện trên | Tiến độ đọc thật; hero "Đọc tiếp" bằng dữ liệu thật (thay cho COMPONENT TEST) |
| T4 | **Lỗi:** ngắt BE QA giữa lúc đọc/gửi đáp án; (tùy chọn) mất phiên Kid | – | Thông báo lỗi, giữ trạng thái, banner mất phiên (đang NOT RUN) |
| T5 | **Thoát bằng PIN:** PIN sai → 401; PIN đúng → về Parent. **Không dùng tải lại để vượt PIN** | – | BE xác minh PIN; về đúng tab |
| T6 | Kiểm tra DB QA sau test (đếm hàng `play_sessions`, `checkpoint_answers`) và **đối chiếu DB nguồn không đổi** | – | Cách ly |

Chạy T1–T5 trên **Web và Android SW_Test**; T6 một lần. Ảnh trang/bìa thật vẫn **NOT VERIFIED**: truyện demo không có ảnh, và lưu trữ ảnh (Supabase/Cloudinary) chưa cấu hình. Muốn kiểm ảnh cần dựng nguồn ảnh cục bộ cho DB QA (có thể làm sau, cần duyệt riêng).

### 12.6 Thông tin xác thực
- Đăng nhập Parent: dùng tài khoản demo bạn đã cấp, truyền qua biến môi trường lúc chạy.
- **PIN:** bạn cung cấp qua biến môi trường lúc chạy, hoặc xác nhận cho dùng PIN demo ghi trong `seed_demo.js` (BE). Không ghi PIN/mật khẩu vào tài liệu, log, ảnh hay Git. Không thử sai nhiều lần (BE khóa tạm sau vài lần sai).

### 12.7 Thao tác cần bạn duyệt rõ ràng

1. Tạo DB `storyweaver_qa_r41` (bạn chạy lệnh, hoặc cung cấp cách dùng tài khoản quản trị mà mình không lưu lại).
2. `pg_dump` DB nguồn (chỉ đọc) ra file tạm ngoài repo, và `pg_restore` vào DB QA.
3. Khởi chạy BE thứ hai (cổng 3100) với biến môi trường trỏ DB QA; khởi chạy Expo Web/Metro với `EXPO_PUBLIC_API_URL` cổng 3100.
4. Cách cấp PIN (mục 12.6).
5. Ghi dữ liệu **trong DB QA** khi chạy test (lượt đọc, câu trả lời).
6. Sau test: `DROP DATABASE storyweaver_qa_r41` và xóa file dump.

### 12.8 Trạng thái
- Phương án D: **khả thi**, chờ duyệt mục 12.7 (điều kiện chặn: cần quyền tạo DB).
- Reader thật E2E: **NOT RUN**. R4 **chưa** nghiệm thu hoàn toàn.
