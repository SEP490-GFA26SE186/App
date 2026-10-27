# PHASE C – TIẾN ĐỘ TÍCH HỢP BACKEND API THẬT (C0 → C12)

Cập nhật: 2026-10-26 · Nhánh `refactor/mobile-web-integration` · Baseline: `47d1184` (Phase B). Thay đổi **chưa commit**.
Kết luận: **PHASE C: CODE INTEGRATED + STATIC VERIFIED. API RUNTIME TESTED = KHÔNG (C0 BLOCKED: chưa chạy được BE).** Không phải production-ready.

## Thang trạng thái

`CODE INTEGRATED` (code gọi đúng contract đã đọc từ source BE) · `STATIC VERIFIED` (tsc, Metro, grep, mock-fetch contract test) · `API RUNTIME TESTED` (đã gọi BE thật trên thiết bị/emulator) · `BLOCKED` · `NOT IMPLEMENTED`.
**Không có mục nào đạt `API RUNTIME TESTED`.** Mock-fetch chỉ chứng minh Mobile gửi/đọc đúng hình dạng contract, không chứng minh BE trả như vậy.

## C0 – Môi trường test: BLOCKED

- Contract được xác minh bằng **đọc source BE** (`BE/api/src/modules/*`: routes, zod validation, controller, service, format). Swagger `/api/v1/docs` chưa mở được (BE không chạy).
- Máy này **không có Docker, Postgres, Redis, `BE/.env`** → không chạy được API. BE hiện chỉ đọc (không sửa).
- Cách chạy để kiểm thử (làm bởi người dùng): theo `BE/SETUP.md` (Docker: Postgres + Redis + api + worker; AI chạy ngoài Docker nếu cần viết truyện thật). Sau đó đặt `EXPO_PUBLIC_API_URL=http://<ip-máy>:3000` (Android emulator: `http://10.0.2.2:3000`) và tạo tài khoản test ngoài repo (không dùng dữ liệu production).
- Phần phụ thuộc AI (analyze / generate / audio TTS) cần thêm service `ai/` và Cloudinary → kiểm thử E2E của C8/C11 cần cấu hình đó.

## Bảng trạng thái

| Task | Nội dung                                | Trạng thái                                                     | Ghi chú                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---- | --------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| C0   | Môi trường test                         | **BLOCKED**                                                    | xem trên                                                                                                                                                                                                                                                                                                                                                                                                                             |
| C1   | API client                              | **CODE INTEGRATED · STATIC VERIFIED**                          | timeout 20 s (AbortController) → `ApiError.status 0`; `raw` envelope cho API phân trang; `errors[]` giữ `attemptsLeft/retryAfterSeconds/narration`; 401 → single-flight refresh (đã có); 402/403/409/422/429 truyền nguyên status + message BE                                                                                                                                                                                       |
| C2   | Lưu token an toàn                       | **NOT IMPLEMENTED (cần duyệt dependency `expo-secure-store`)** | vẫn RAM trên native (mất phiên khi tắt app; Web dùng localStorage). Kid token tách khóa riêng, logout/enter-kid xóa token đúng (đã có từ Safety Gate)                                                                                                                                                                                                                                                                                |
| C3   | Auth thật                               | **CODE INTEGRATED · STATIC VERIFIED**                          | login/me/logout/register (validate `user`+`tokens`, đã có từ T1.3/T3.1b); **thêm đổi mật khẩu** `PUT /auth/change-password` (B11 còn thiếu)                                                                                                                                                                                                                                                                                          |
| C4   | PIN Kid set/change                      | **CODE INTEGRATED · STATIC VERIFIED**                          | `POST /auth/kid-pin/set`, `PUT /auth/kid-pin/change`; nhận **4–6 số** khớp BE                                                                                                                                                                                                                                                                                                                                                        |
| C5   | Enter/Exit Kid Mode                     | **CODE INTEGRATED · STATIC VERIFIED**                          | thoát qua `POST /auth/kid-mode/exit`; hiển thị nguyên văn "Còn N lần thử" (401 `attemptsLeft`) và khóa tạm (429 `retryAfterSeconds`, khóa bàn phím tới hết hạn); keypad nhận 4–6 số + nút Xác nhận                                                                                                                                                                                                                                   |
| C6   | Children + Characters + mapper          | **CODE INTEGRATED · STATIC VERIFIED**                          | CRUD thật: `GET/POST/PUT/DELETE /children`, `GET/POST/PUT/DELETE /characters`; mapper chỉ lấy trường BE (đã bỏ `gender/readingLevel/favoriteThemes/age                                                                                                                                                                                                                                                                               |     | 4`, `role`, `personalityTraits` bịa); lỗi quota 403, 422 nhân vật-của-bé hiển thị nguyên văn. Không có chân dung AI (`POST /characters/:id/portrait`) |
| C7   | Overview + EQ                           | **CODE INTEGRATED · STATIC VERIFIED**                          | Trang chủ: `GET /children/:id/overview`; Hành trình EQ: `GET /children/:id/eq-report` (level `null` → "Chưa có dữ liệu"). **`eq-journey` (xu hướng/bằng chứng/hội thoại) NOT IMPLEMENTED**                                                                                                                                                                                                                                           |
| C8   | Tạo truyện / generate / review          | **CODE INTEGRATED · STATIC VERIFIED (một phần)**               | `GET /stories` (đọc hết trang), `GET /stories/:id`, `GET /stories/ai-pricing`, `POST /stories/analyze`, `POST /stories` (topic, family), `POST /stories/:id/generate`, poll `GET /stories/:id/generation` mỗi 3 s, `POST /stories/:id/review` (422 `errors[]`). **NOT IMPLEMENTED:** lối "Tự viết", sửa chữ trang/điểm dừng (PUT pages/checkpoints), thêm/xóa trang, `narration/retry`, tranh AI, `subSkillIds` tùy chọn, xóa truyện |
| C9   | Bookshelf + Kid shelf                   | **CODE INTEGRATED · STATIC VERIFIED**                          | `POST /bookshelf` (422 hiển thị lý do BE), `GET /kid/bookshelf` (đọc `items[].storyId`, đã sửa lỗi cũ đọc `item.story`). **NOT IMPLEMENTED:** xem/gỡ truyện trên tủ sách của bé phía Parent (`GET /bookshelf`, `DELETE`) — service `removeFromShelf` có, chưa có UI                                                                                                                                                                  |
| C10  | Kid session / checkpoint / progress     | **CODE INTEGRATED · STATIC VERIFIED**                          | `POST /kid/sessions` (tiếp tục đúng trang), `PUT .../progress`, `POST .../answers` (body `.strict()`: `checkpointId, emotion, optionId, skipped, timeToFirstMs`), `POST .../complete`; 5 kiểu điểm dừng, gợi ý → chọn lại, đáp án, bỏ qua (trừ reflection); 401 → phiên Kid mất → đăng nhập lại; 409 → bỏ qua chấm. Không tự chấm điểm phía client                                                                                   |
| C11  | Audio                                   | **NOT IMPLEMENTED (cần duyệt thư viện phát audio)**            | chỉ có `expo-speech` (TTS máy), không phát URL `audioUrl` của BE. `GET /kid/ui-audio` có service nhưng chưa dùng. Đã **gỡ nút 🔊 giả** (chỉ bật/tắt state). `questionReplays` không gửi                                                                                                                                                                                                                                              |
| C12  | Plans / subscription / credit (chỉ xem) | **CODE INTEGRATED · STATIC VERIFIED**                          | `GET /plans` (công khai), `GET /subscriptions/me`, `GET /subscriptions/me/credit-history` (phân trang "Xem thêm"). Không nạp credit / thanh toán                                                                                                                                                                                                                                                                                     |

## Điểm lệch giữa tài liệu cũ và BE thật (ưu tiên BE) – đã sửa API_MAPPING

1. Trả lời điểm dừng là **`POST /kid/sessions/:id/answers`** (số nhiều), không phải `/answer`; response `data.result`.
2. `GET /kid/bookshelf` trả `items[{storyId,title,cover,coverImageUrl,totalPages,addedAt,readingProgress}]` – **không có `story`/`pages`**.
3. `GET /stories` (và `/bookshelf`) dùng `ApiResponse.paginated`: **`data` là mảng, `pagination` ở top-level** (không lồng).
4. `GET /plans` trả `data.plans` (không phải mảng trần); `priceVnd` là chuỗi (BigInt → JSON).
5. `PUT /auth/change-password` **tồn tại** (API_MAPPING cũ ghi "chưa").
6. Story `status` của BE là chữ thường `draft|generating|ready`; chi tiết `GET /stories/:id` có `scenes[].imageUrl`, `pages[].sceneId` (ảnh trang lấy từ scene).
7. Nhân vật đại diện bé (`childId`): đổi tên → 422, xóa → 422, phải thao tác ở hồ sơ bé.

## Mock / fallback đã loại bỏ trong Phase C

- Bịa dữ liệu trong mapper: `gender 'MALE'`, `readingLevel 'BEGINNER'`, `favoriteThemes`, `age||4`, `role||'HERO'`, `personalityTraits ['Tốt bụng']`, trạng thái truyện mặc định `'PUBLISHED'`, `createdAt now`, ảnh bìa/ảnh trang Unsplash, mô tả mặc định chuyện mẫu, `category 'EMOTIONAL_INTELLIGENCE'`.
- Ảnh đại diện Unsplash mặc định (TopBar, `formatUser`) và ảnh bìa/trang Unsplash ở reader → khung giữ chỗ / chữ cái đầu.
- Kid Mode: `stories=[]` + `shelfNotice` tạm; `onRecordEqSignal` (console.log giả); `eqSignal 'EMPATHY'`; nút audio giả; chọn "choices" cục bộ → thay bằng điểm dừng BE.
- Trang chủ "Hôm nay của bé — Chưa kết nối", EQ "chưa kết nối", Ví "chưa kết nối", wizard `'unsupported'` → API thật.
- **Giữ nguyên (có chủ đích):** `src/dev/demo` + `KidPreview` (UI Preview, ADR-020); màn SCOPE PENDING (Marketplace/Seller/Moderator) còn fixture.

## Kiểm tra đã chạy (KHÔNG phải runtime app)

- `npx tsc --noEmit`: pass. `git diff --check`: sạch (chỉ cảnh báo LF/CRLF). `npx expo install --check`: up to date.
- Metro: `expo export` **Android** và **Web** thành công.
- Bundle Web production: 0 kết quả cho `[Demo]`, `usr_demo`, `KidPreview`, `UI Preview`, `mock_`, `demo_session`, ảnh avatar Unsplash cũ.
- Contract test bằng mock `fetch` (scratchpad, **ngoài repo**): `run_c.js` **48/48**; harness cũ `run.js` **56/56** (+8/8 khi thiếu cấu hình) – không regression.
- Đồ thị import: 82 file, **0 vòng**; orphan không đổi (IntroScreen, CloudPopEntrance, AuthModal(deprecated), HeyProgressBar, dev/demo/curatedStories, theme/index). `src/dev/**` không import service/storage (G11 sạch).
- BE / Web / App_v2 / `packages/**`: 0 thay đổi.

## Chưa kiểm thử (API RUNTIME NOT TESTED)

Toàn bộ luồng trên BE thật: đăng nhập/refresh thật; CRUD bé & nhân vật (cả lỗi quota); overview/EQ với dữ liệu thật; analyze → create → generate → poll → review (cần AI service); thêm tủ sách + 422 narration; Kid enter → shelf → đọc → checkpoint (đúng/sai/gợi ý/bỏ qua) → complete → exit PIN (sai/khóa 429); gói & lịch sử credit; ngắt mạng/timeout; hiển thị trên 2 cỡ màn hình, bàn phím, Android Back.

## Rủi ro/giới hạn còn lại

- Token chỉ ở RAM (native): tắt app là phải đăng nhập lại (C2).
- `strict:false` – lỗi null không bị tsc bắt; đã rà tay các chỗ mới.
- Poll generation dừng khi rời màn hình (component unmount); job vẫn chạy ở BE, vào lại chi tiết truyện sẽ theo dõi tiếp (status `GENERATING`).
- Danh sách truyện đọc tối đa 10 trang × 100; nhiều hơn sẽ bị cắt (hiếm).
- Hook/reader/GenerationRunner/store chưa có test tự động (không có test runner; E3).
- Các mapper `StoryView.createdAt` có thể là chuỗi rỗng nếu BE không trả (chi tiết luôn trả).
