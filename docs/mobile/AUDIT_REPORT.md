# AUDIT REPORT – StoryWeaver Mobile (M0)

Commit phân tích (nhánh main): App `f1f5217` · App_v2 `211121c` · BE `83025f8` · Web `a6aeb5b`.
Đường dẫn tương đối theo `D:\fpt\SEP\SEP\`.

> **Giới hạn:** chỉ đọc code tĩnh. KHÔNG chạy BE/DB, KHÔNG gọi API thật → hành vi runtime là **UNKNOWN**.
> Ký hiệu: **VERIFIED** (đã đọc code) · **UNKNOWN** · **BLOCKED** · **SCOPE PENDING**.

## 1. Cấu trúc & môi trường
- Runtime mobile: `App/apps/mobile` – Expo ~52, RN 0.76.7, React 18.3.1, TS ^5.3.3. Entry `node_modules/expo/AppEntry.js` → `App.tsx`. Không có router; điều hướng bằng `useState` (`appPhase/currentTab/isKidMode`). VERIFIED.
- Không có AsyncStorage, SecureStore, router, react-query, script lint/test. VERIFIED (`apps/mobile/package.json`).
- `metro.config.js` watch workspace root (`../../packages/shared-types`); `babel.config.js` dùng `react-native-reanimated/plugin` (dùng ở `KidModeScreen`, `CloudPopEntrance`).
- Lockfile: expo 52.0.49, react-native 0.76.7 (SDK 52 bundled 0.76.9).
- **Drift SDK 52:** `expo-asset ^57`, `expo-font ^57` (bundled ~11.0.5 / ~13.0.4); `expo-haptics ~14.0.0` (bundled ~14.0.1); `expo-speech ~13.0.0` (~13.0.1).
- Gốc `App/` có prototype Vite: `server.ts` (35 route mock), `apps/api` (Gemini/payOS stub), `src/utils/mockData.ts`, `src/shims/*` → không phải runtime mobile (deprecated).
- Node v24.14.0 / npm 11.9.0 (môi trường kiểm tra).

## 2. App_v2 (mẫu)
- expo-router + `Stack.Protected` (`App_v2/src/app/_layout.tsx`), react-query, zustand persist (AsyncStorage). Expo 58.
- Toàn bộ service là **mock** (`src/services/mockApi.ts`, `src/mocks/db.ts`), README xác nhận "UI only". Không có axios/secure-store/audio/web-browser.
- Types `types/models.ts` theo BE schema rev8. Không có màn hình Specialist/Admin.
- Dùng làm tham chiếu: cấu trúc thư mục, tách service/hook/store, design tokens, bố cục màn hình.

## 3. BE (nguồn contract)
- Express 5, zod 4, Prisma 6, BullMQ/redis, `@payos/node`, helmet, cors. Mount `/api/v1`; Swagger `/api/v1/docs` (`BE/src/docs/swagger.js`).
- Envelope `{success,message,data?}`; phân trang `pagination{page,limit,total,totalPages}`; lỗi `{success:false,message,errors?[{path,message}]}`.
- Role BE: **parent, specialist, admin**. "Seller" không phải role (parent + seller profile + plan `canSell`).
- JWT access 15m, refresh 7d (rotating). **Không có upload (multer), không có `express-rate-limit`.**
- `BE/docs/roadmap-tich-hop.md` **lỗi thời** → không dùng.

## 4. Sai lệch Mobile ⇄ BE (VERIFIED)
| # | Vị trí Mobile | Vấn đề | BE thực tế |
|---|---|---|---|
| 1 | `kidService.answerCheckpoint` | gửi `emotionChoice` → 400 | schema `.strict()` `{checkpointId, emotion?, optionId?, skipped?, timeToFirstMs?, questionReplays?}` |
| 2 | `kidService.getKidShelf` | đọc `items[].story` | `items[{storyId,title,cover,coverImageUrl,totalPages,readingProgress}]` |
| 3 | `kidService.formatStory` | đọc `contentText/choices/eqSignal` | `POST /kid/sessions` trả `{session, story{pages,checkpoints}}`; EQ theo checkpoint |
| 4 | `formatChild` | bịa `gender/readingLevel/favoriteThemes/age||4` | child `{id,name,birthDate,age,preferredVoice,character,booksCount,completedSessionsCount,...}` |
| 5 | `getChildOverview` | fallback bịa competency | `{profile,todayUsage,readingStats,eqReport}` |
| 6 | `formatCharacter` | đọc `raw.role` | rev8 không có `role` |
| 7 | `StoryWizard` (~dòng 201) | gọi `POST /stories/ai-generate` (không tồn tại), fake progress timer, story giả `priceVnd:49000/ratingAvg:5.0` | `POST /stories` + `POST /stories/:id/generate` + poll `/generation` |
| 8 | tạo truyện | gửi `entry:'custom'`, thiếu `length` → 400 | `entry: topic|family|handwritten`, `length` bắt buộc |

## 5. Runtime mock / fake fallback (VERIFIED + cần soát lại)
Gốc `App/apps/mobile/src/`:
- `services/authService.ts` ~46–56: login demo `demo_mock_jwt_token`; ~93–99 `getMe` fallback DEMO user; PIN set/change có fallback giả. **P0**
- `screens/KidModeScreen.tsx:146`: `pin === correctPin || pin === '1234'`. **P0**
- `components/AuthModal.tsx`: prefill demo (55–59, PIN `1234`), nút demo parent/specialist/admin (190, 377–397), công tắc môi trường dev/prod/**mock** (432–452). **P0/P1**
- `screens/LoginScreen.tsx`: mật khẩu mặc định `123456` (37), nút demo (61, 123–168), "Offline Demo" (168), công tắc env gồm mock (173–202). **P0/P1**
- Mode `mock` ("tự dùng dữ liệu demo khi không có mạng") – cần xác định nơi xử lý trong `services/*`. **UNKNOWN vị trí đầy đủ**
- **UNKNOWN:** quét từ khóa chưa phủ hết `screens/*` và `services/*`; số dòng `authService.ts` lấy từ phân tích trước. Task M1 phải rà soát toàn bộ.

## 6. Phát hiện bảo mật
| ID | Mức | Phát hiện | Bằng chứng |
|---|---|---|---|
| S1 | P0 | Backdoor PIN `1234` thoát Kid Mode | `KidModeScreen.tsx:146` |
| S2 | P0 | PIN xác minh/lưu phía client (`kidModePinHash`) | `AuthModal.tsx:59`, `KidModeScreen.tsx` |
| S3 | P0 | Token giả + user DEMO khi lỗi → trông như đã đăng nhập | `authService.ts` |
| S4 | P0 | Mock mode bật được ở build thật | `LoginScreen.tsx`, `AuthModal.tsx` |
| S5 | P1 | Chưa có lưu token an toàn (SecureStore) | `package.json` |
| S6 | P1 | Không có single-flight refresh; chưa tách kid token khỏi parent token | so sánh `Web/src/services/api.js`, `kidApi` |
| S7 | P1 | Prefill credential demo trong UI | `LoginScreen.tsx:37` |
| S8 | P1 (BE – chỉ khuyến nghị) | PIN limiter in-memory (5 sai→khóa 15'; reset khi restart) | `BE/.../auth/lib/kidPinLimiter.js` |
| S9 | P1 (BE – chỉ khuyến nghị) | Không rate-limit chung login/register | BE |
| S10 | P2 | Base URL `localhost`/`10.0.2.2` hardcode trong UI | `AuthModal.tsx:436` |
| S11 | P2 | Cloudinary signed URL không hết hạn | BE `assetUrl` |

## 7. Dependencies – hiện trạng & đề xuất (CHƯA cài)
- Tương thích SDK 52 (theo `bundledNativeModules.json` expo@52.0.49): secure-store ~14.0.1, web-browser ~14.0.2, linking ~7.0.5, async-storage 1.23.1, expo-av ~15.0.2, expo-audio ~0.3.5 (sơ khai), expo-router ~4.0.22.
- Đề xuất: `expo-secure-store` (nên); giữ `fetch`, không thêm axios; react-query (tuỳ chọn, chờ duyệt); audio **chưa chọn** (UNKNOWN: chốt sau xác minh contract & thiết bị).
- Dọn drift SDK bằng `npx expo install --check` (chờ duyệt, task T1.1).

## 8. BLOCKED / UNKNOWN / SCOPE PENDING
**BLOCKED:** B1 deep link payOS về mobile (BE chỉ có `WEB_URL`) · B2 upload ảnh (BE không có upload) · B3 `publish-version` trả 501 · B4 nạp credit (không có endpoint) · B5 AI image BE tạm dừng.
**UNKNOWN:** U1 hành vi runtime thật · U2 Expo Go/thiết bị nhóm với SDK 52 còn được store hỗ trợ không · U3 phần còn lại `screens/*`,`services/*` · U5 `expo-speech` còn dùng hay chuyển audio BE · U6 PIN 4 vs 4–6 số · U7 trạng thái `.env`/base URL mobile (không đọc secret).
**SCOPE PENDING:** Seller, Specialist, Admin, Marketplace, Payment (đã quyết định giữ nguyên, không xóa, không phát triển thêm).

## 9. Câu hỏi mở cho nhóm
1. Mobile có phục vụ Seller/Specialist/Admin không? Giữ màn hình hiện có như thế nào?
2. BE có thể thêm mobile return URL cho payOS? Nếu không, chấp nhận polling?
3. Nạp credit, publish marketplace (501), upload ảnh, AI image: có nằm trong phạm vi?
4. PIN mobile 4 số hay 4–6 số?
5. Audio: dùng `audioUrl` BE hay TTS thiết bị làm dự phòng?
6. Kiến nghị BE: rate-limit chung và PIN limiter bền (Redis).
