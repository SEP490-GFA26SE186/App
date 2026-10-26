# AUDIT REPORT – StoryWeaver Mobile (M0)

Commit phân tích (nhánh main): App `f1f5217` · App_v2 `211121c` · BE `83025f8` · Web `a6aeb5b`.
Đường dẫn tương đối theo `D:\fpt\SEP\SEP\`.
**Cập nhật T1.0** (rà soát mock/fallback, App HEAD `1f8a7b8`): mở rộng §5, §6, §8. Không sửa source.

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

## 5. Runtime mock / fake fallback – KẾT QUẢ T1.0 (rà soát tĩnh toàn bộ `apps/mobile`)

**Phạm vi & phương pháp.** Đọc code tĩnh `App/apps/mobile/App.tsx` + toàn bộ `src/**` (services, screens, components, theme) tại App HEAD `1f8a7b8`. Đối chiếu BE (`BE/api/src/modules/*/*.routes.js`, chỉ đọc). Không chạy app/BE → hành vi runtime vẫn **UNKNOWN (U1)**. Số dòng = dòng thực tế trong file hiện tại. Không in secret: các giá trị demo (mật khẩu/PIN/email) cố ý **không chép** vào tài liệu này, chỉ ghi vị trí.
Mọi dòng bên dưới: trạng thái **VERIFIED** (đã đọc code) trừ khi ghi *(UNKNOWN: …)*.

**Quy ước loại:** `RM` runtime mock data · `FS` fake success/fake response · `SC` catch nuốt lỗi, UI vẫn tiếp tục · `LS` state cục bộ giả kết quả BE · `HC` hardcode · `PH` placeholder UI.
**Mức:** P0 = giả auth/PIN/phiên, giả thành công thao tác ghi, giả credit/tiền, dữ liệu bé/EQ/truyện giả hiển thị như thật, chặn cổng Kid Mode · P1 = mặc định/fixture bịa ở luồng đọc, số liệu hardcode, fixture màn SCOPE PENDING, phụ thuộc legacy · P2 = placeholder, URL, nuốt lỗi vô hại.

### 5.0 Tổng kết

| Hạng mục | Số lượng |
|---|---|
| Phát hiện đã xác minh (M01–M90) | **90** (89 mock/fallback/fake/hardcode + 1 phụ thuộc legacy) |
| — P0 | **54** |
| — P1 | **29** |
| — P2 | **7** |
| Khối `catch` đã phân loại (services 38 + App/screens/components 19) | **57** → **A: 32 · B: 18 · C: 7** (chi tiết §5.12) |
| Test fixture / `__mocks__` / file test trong mobile | **0** (không có file test, không có script test/lint) |
| Màn hình/hàm chết (không tới được) | `IntroScreen` (không được import); `HeyTopBar.onRoleChange` không được gọi nên `activeRole` luôn `PARENT` → Seller/Moderator/Admin **không mở được từ UI** (fixture của chúng chỉ là nợ, không phải đường chạy hiện tại) |

**Phát hiện cấu trúc quan trọng (VERIFIED):**
1. Chế độ `mock` **chỉ là nhãn**: `config.ts:23-31` không có nhánh `mock` (mock rơi về URL dev). Mọi fallback giả chạy **vô điều kiện, ở mọi môi trường** (kể cả `prod`) – không có cờ `env === 'mock'` ở bất kỳ nơi nào (`getApiEnvironment` chỉ được dùng để hiển thị ở `AuthModal.tsx:67`, `LoginScreen.tsx:40`). → Đóng phần UNKNOWN "vị trí xử lý mock" của bản M0.
2. **Kid Mode không gọi BE khi đọc truyện**: `KidModeScreen.tsx:25` import `kidService` nhưng **không gọi hàm nào** (grep: chỉ 1 lần xuất hiện). Truyện kid = `stories` của phụ huynh truyền qua props; progress/answers/complete không bao giờ gửi BE; `onRecordEqSignal` chỉ `console.log` (`App.tsx:234-236`).
3. Toàn bộ `demoData.ts` được **export qua `services/index.ts:10`** và dùng ở runtime (App.tsx, auth/child/character/story/kid services).
4. Mobile phụ thuộc mã legacy deprecated `App/src/utils/{sound-fx,speech-tts}` (M90).
5. Luồng tạo truyện **gọi tạo 2 lần + trừ credit cục bộ** (M23/M24) và endpoint `/stories/ai-generate` **không tồn tại trong BE** (0 kết quả trong `BE/api/src/modules/**`).

### 5.1 `services/config.ts`, `services/demoData.ts`
| ID | Vị trí | Hành vi / rủi ro | Mức | API BE | Task |
|---|---|---|---|---|---|
| M01 | `config.ts:4,23-31,33-40` | [HC] Env `'mock'` tồn tại nhưng không có logic; cho chọn "mock" ở build thật; fallback chạy bất kể env (S4) | P0 | — | T1.3 |
| M02 | `config.ts:42-62` | [RM] `DEMO_CREDENTIALS` (parent/admin/specialist: email, mật khẩu, PIN kid) hardcode trong bundle, được import bởi LoginScreen/AuthModal (S7) | P0 | `POST /auth/login` | T1.3 |
| M03 | `config.ts:7-12,19-21` | [HC] `LOCAL_DEV_URL` (10.0.2.2/localhost), `PROD_URL`, env mặc định `dev` hardcode (S10). Không phải secret | P2 | — | T1.2 |
| M04 | `demoData.ts:11,24,39,58,94`; `index.ts:10` | [RM] `DEMO_PARENT_USER`(có PIN demo, dòng 17), `DEMO_CHILDREN`, `DEMO_CHARACTERS`, `DEMO_TEMPLATES`, `DEMO_STORIES` ("[Demo] …") là **dữ liệu runtime**, không phải test fixture; export public | P0 | — | T1.5, T1.7 |

### 5.2 `services/authService.ts`
| ID | Vị trí | Hành vi / rủi ro | Mức | API BE | Task |
|---|---|---|---|---|---|
| M05 | `:45-58` (demo 47-56) | [FS] `login` lỗi + khớp tài khoản demo → ghi token giả (`demo_mock_jwt_token`/refresh giả) + `DEMO_PARENT_USER`, trả thành công (S3). Che lỗi mạng/BE. Khác ⇒ rethrow (C) | P0 | `POST /auth/login` | T1.3 → T3.1 |
| M06 | `:92-100` (99) | [FS] `getMe` lỗi ⇒ trả user cache; không có cache ⇒ `DEMO_PARENT_USER`. Không bao giờ throw ⇒ app trông như đã đăng nhập | P0 | `GET /auth/me` | T1.5 → T3.1 |
| M07 | `:147-150` | [FS] `setKidPin` lỗi ⇒ `return true` ("Local fallback"). PIN tưởng đã lưu nhưng BE không có | P0 | `POST /auth/kid-pin/set` (auth.routes.js) | T1.7 → T3.2 |
| M08 | `:163-165` | [FS] `changeKidPin` lỗi ⇒ `return true` | P0 | `PUT /auth/kid-pin/change` | T1.7 → T3.2 |
| M09 | `:177` | [FS] `data?.session?.kidSessionToken \|\| 'mock_kid_session_token'`: thiếu token BE vẫn "thành công" | P0 | `POST /auth/kid-mode/enter` | T1.7 → T3.3 |
| M10 | `:181-187` | [FS] `enterKidMode` lỗi ⇒ ghi token `mock_kid_session_<childId>` + child `{id}`, trả thành công (S3) | P0 | `POST /auth/kid-mode/enter` | T1.7 → T3.3 |
| M11 | `:210-218` (212) | [FS] `exitKidMode` lỗi + PIN trùng PIN demo hardcode ⇒ thoát Kid Mode không qua BE (S1). Khác ⇒ rethrow (C) | P0 | `POST /auth/kid-mode/exit` | T1.4 → T3.3 |
| M12 | `:221-237` (223,226,229,232) | [HC] `formatUser` bịa: `kidModePinHash` mặc định = PIN demo (229), `creditBalance ?? 50` (232 — credit giả), id `usr_parent`, avatar ảnh ngoài (P2) | P0 | `GET /auth/me` (`wallet.creditBalance`, `hasKidPin`) | T1.5, T7.1 |
| M13 | `:115` | [SC] `logout` nuốt lỗi BE, vẫn xóa token cục bộ (hợp lý về UX; nhưng không báo refresh token chưa bị thu hồi) | P2 | `POST /auth/logout` | T3.1 |

### 5.3 `App.tsx`
| ID | Vị trí | Hành vi / rủi ro | Mức | API BE | Task |
|---|---|---|---|---|---|
| M14 | `:62-66` (+ import 44-48) | [RM] State khởi tạo = `DEMO_PARENT_USER/CHILDREN/CHARACTERS/TEMPLATES/STORIES`. Lỗi BE ⇒ UI hiển thị dữ liệu demo như thật | P0 | `/auth/me`, `/children`, `/characters`, `/stories`, `/topics` | T1.5 |
| M15 | `:197-201` | [FS] `LoginScreen.onSkip` ⇒ `setCurrentUser(DEMO_PARENT_USER)` + vào `APP` không token (S3) | P0 | — | T1.3/T1.5 |
| M16 | `:52-54` | `appPhase='APP'` nếu chỉ *có* access token (kể cả token giả M05). Không validate phiên | P1 | `GET /auth/me` | T2.2, T3.1 |
| M17 | `:95-115` | [SC] `loadAllData`: `catch {}` + `console.log`; kết hợp services trả DEMO ⇒ lỗi BE không bao giờ hiện; chỉ set state khi list>0 nên dữ liệu cũ/DEMO không bị thay bằng "rỗng" | P0 | như M14 | T1.5, T1.7 |
| M18 | `:117-127` | [SC] `handleOpenKidMode`: `enterKidMode` lỗi chỉ `console.log` rồi **vẫn `setIsKidMode(true)`** | P0 | `POST /auth/kid-mode/enter` | T1.6 → T3.3 |
| M19 | `:129-137` | [SC] `handleExitKidMode`: `catch {}`; `isKidMode=false` bất kể kết quả; nếu không truyền pin thì thoát không xác minh | P0 | `POST /auth/kid-mode/exit` | T1.6 → T3.3 |
| M20 | `:118,230` | [LS] Child luôn `childrenProfiles[0]` (có thể là child demo), không phải bé được chọn; `enterKidMode` có thể gửi id demo | P1 | `POST /auth/kid-mode/enter {childId}` | T1.6 |
| M21 | `:232` | [HC] `correctPin={kidModePinHash \|\| <PIN demo>}` ⇒ truyền PIN/backdoor vào KidModeScreen (S1,S2) | P0 | — | T1.4/T1.6 |
| M22 | `:234-236` | [LS] `onRecordEqSignal` chỉ `console.log` — tín hiệu EQ của bé bị bỏ, không gửi BE | P0 | `POST /kid/sessions/:id/answers` | T6.2 (gỡ giả: T1.6) |
| M23 | `:139-148,153` | [FS] `handleStoryCreated`: gọi `POST /stories` lần 2 với `{title, situation}` (thiếu `entry/length` ⇒ 400, audit #8) → `catch` ⇒ push **truyện giả cục bộ**; `selectedStoryToRead` luôn là `newStory` cục bộ, không phải bản BE | P0 | `POST /stories`, `POST /stories/:id/generate`, `GET /stories/:id/generation` | T1.9 → T5.1/T5.2 |
| M24 | `:149-152` | [LS] Trừ **3 credit cục bộ** sau khi tạo truyện (số 3 bịa; BE trừ khi `/generate`, 402 khi thiếu) | P0 | `GET /stories/ai-pricing`, `POST /stories/:id/generate` (402) — *(UNKNOWN: công thức trừ chính xác, cần Swagger)* | T1.8 → T5.2/T7.1 |
| M25 | `:157-176` | [FS] `handleAddChild`: lỗi ⇒ child giả (`ch_<timestamp>`, `gender 'MALE'`, themes bịa) + birthDate mặc định bịa (161) | P0 | `POST /children` | T1.7 → T4.1 |
| M26 | `:68-88` | [RM] `transactions` hardcode 2 giao dịch ("Nạp Credits qua PayOS QR", "Sáng tác AI…") hiển thị ở Ví như lịch sử thật | P0 | `GET /subscriptions/me/credit-history` (plans.routes.js) | T1.8 → T7.1 |
| M27 | `:259,293` | [FS] `alert('Đã gửi duyệt truyện …')` giả; `onStoryPurchased` prepend truyện cục bộ (hàm không được gọi). **SCOPE PENDING** | P1 | `/market/*`, `/publishing/*` (chưa xác minh) | T8.0 |
| M28 | `:178-184` | [SC] logout `catch {}` (xem M13) | P2 | `POST /auth/logout` | T3.1 |

### 5.4 `services/childService.ts`
| ID | Vị trí | Hành vi / rủi ro | Mức | API BE | Task |
|---|---|---|---|---|---|
| M29 | `:22-24` | [FS/RM] `getChildren` lỗi ⇒ `DEMO_CHILDREN` | P0 | `GET /children` | T1.7 → T4.1 |
| M30 | `:37-50` | [FS] `createChild` lỗi ⇒ child cục bộ (`ch_local_*`, age 4, gender/level/themes bịa) trả thành công | P0 | `POST /children` (quota error cần hiển thị) | T1.7 → T4.1 |
| M31 | `:63-71` | [FS] `updateChild` lỗi ⇒ object giả (`'Bé Yêu'`, age 4) | P0 | `PUT /children/:id` *(UNKNOWN: BE dùng PUT/PATCH — kiểm Swagger)* | T1.7 → T4.1 |
| M32 | `:83-85` | [FS] `deleteChild` lỗi ⇒ `true` | P0 | `DELETE /children/:id` | T1.7 → T4.1 |
| M33 | `:94-106` | [FS] `getChildOverview` lỗi ⇒ **EQ/readingStats bịa** (competency, 2 sách, 24 phút) | P0 | `GET /children/:id/overview` | T1.7 → T4.3 |
| M34 | `:115-120` | [SC] `getChildEqJourney` lỗi ⇒ `{evidence:[],trend:[]}` (lỗi hiển thị như "chưa có dữ liệu") | P1 | `GET /children/:id/eq-journey` | T4.3 |
| M35 | `:129-131` | [SC] `getChildBookshelf` lỗi ⇒ rỗng | P1 | `GET /children/:id/bookshelf` | T6.1 |
| M36 | `:134-155` (144,148-151) | [HC] `formatChild` bịa `parentId 'usr_parent'`, `age\|\|4`, `gender`, `readingLevel`, `favoriteThemes` (audit #4) | P1 | child `{id,name,birthDate,age,preferredVoice,character,...}` | T4.1 |

### 5.5 `services/characterService.ts`
| ID | Vị trí | Hành vi / rủi ro | Mức | API BE | Task |
|---|---|---|---|---|---|
| M37 | `:12-14` | [FS/RM] `getCharacters` lỗi ⇒ `DEMO_CHARACTERS` | P0 | `GET /characters` | T1.7 → T4.2 |
| M38 | `:24-33` | [FS] `createCharacter` lỗi ⇒ nhân vật cục bộ (`char_local_*`, traits bịa) | P0 | `POST /characters` | T1.7 → T4.2 |
| M39 | `:43-49` | [FS] `updateCharacter` lỗi ⇒ object giả | P0 | `PUT /characters/:id` *(UNKNOWN verb)* | T1.7 → T4.2 |
| M40 | `:56-58` | [FS] `deleteCharacter` lỗi ⇒ `true` | P0 | `DELETE /characters/:id` | T1.7 → T4.2 |
| M41 | `:61-71` (64,66,69) | [HC] `formatCharacter` bịa `parentId`, `role` (rev8 không có), `personalityTraits ['Tốt bụng']` (audit #6) | P1 | characters rev8 | T4.2 |

### 5.6 `services/storyService.ts`
| ID | Vị trí | Hành vi / rủi ro | Mức | API BE | Task |
|---|---|---|---|---|---|
| M42 | `:20-22` | [FS/RM] `getStories` lỗi ⇒ `DEMO_STORIES` | P0 | `GET /stories` | T1.7 → T6.1 |
| M43 | `:32-36` | [RM] `getStory` lỗi ⇒ truyện demo theo id; không có ⇒ rethrow | P0 | `GET /stories/:id` | T1.7 |
| M44 | `:43,58-76` | [FS] `createStory` lỗi ⇒ truyện cục bộ **`status:'PUBLISHED'`**, 1 trang bịa; payload `entry:'custom'` sai contract (audit #8) | P0 | `POST /stories` (`entry: topic\|family\|handwritten`, `length`) | T1.7 → T5.1 |
| M45 | `:89-91` | [FS] `addToShelf` lỗi ⇒ `true` | P0 | `POST /bookshelf` (khớp route) | T1.7 → T6.1 |
| M46 | `:103-105` | [FS] `removeFromShelf` lỗi ⇒ `true` | P0 | `DELETE /bookshelf/:storyId` | T1.7 → T6.1 |
| M47 | `:114-127` | [RM] `getTemplates`: rỗng **hoặc** lỗi ⇒ `DEMO_TEMPLATES` (id giả gửi tiếp làm `topicId`) | P1 | `GET /topics` | T1.7 → T5.1 |
| M48 | `:130-156` (133,136,139,146,150-152) | [HC] `formatStory` bịa `creatorId`, status mặc định `PUBLISHED` (che draft), ảnh bìa ngoài, `eqSignal 'EMPATHY'`, label "Tiếp tục câu chuyện" (audit #3) | P1 | story contract | T5.x/T6.x |

### 5.7 `services/kidService.ts` (không được UI gọi – xem cấu trúc #2)
| ID | Vị trí | Hành vi / rủi ro | Mức | API BE | Task |
|---|---|---|---|---|---|
| M49 | `:15-21` | [RM] `getKidShelf`: rỗng **hoặc** lỗi ⇒ `DEMO_STORIES`; đọc `item.story` sai contract (audit #2) | P0 | `GET /kid/bookshelf` | T1.7 → T6.1 |
| M50 | `:37-43` | [FS] `startReading` lỗi ⇒ session giả `sess_<ts>` + truyện demo | P0 | `POST /kid/sessions` | T1.7 → T6.2 |
| M51 | `:56-58` | [FS] `saveProgress` lỗi ⇒ `true` | P0 | `PUT /kid/sessions/:id/progress` | T1.7 → T6.2 |
| M52 | `:71-77` | [FS] `answerCheckpoint` lỗi ⇒ `{correct:true, done:true}` — kết quả EQ giả; gửi `emotionChoice` sai (audit #1) | P0 | `POST /kid/sessions/:id/answers` (`.strict()`) | T1.7 → T6.2 |
| M53 | `:89-91` | [FS] `completeReading` lỗi ⇒ `true` | P0 | `POST /kid/sessions/:id/complete` | T1.7 → T6.2 |

### 5.8 `screens/KidModeScreen.tsx`
| ID | Vị trí | Hành vi / rủi ro | Mức | API BE | Task |
|---|---|---|---|---|---|
| M54 | `:139-157` (146) | [FS] `handleVerifyPin`: `exitKidMode` lỗi + `pin === correctPin \|\| pin === <PIN demo>` ⇒ thoát. Backdoor (S1); cũng cho thoát offline bằng PIN client (S2) | P0 | `POST /auth/kid-mode/exit` | T1.4 (hoàn tất cùng T3.3) |
| M55 | `:25,232-243,319-324` | [LS] Không gọi `kidService`; đọc `stories` phụ huynh; lựa chọn rẽ nhánh chỉ nhảy trang cục bộ. Không có session/progress/answer/complete | P0 | `/kid/*` | T6.1, T6.2 |
| M56 | `:115,127-131` | [LS] Timer 20 phút cục bộ, về 0 không làm gì; không liên kết giới hạn BE *(UNKNOWN: BE có áp giới hạn qua `GET /children/:id/usage` — chưa xác minh mapping)* | P1 | `GET /children/:id/usage` | T1.10, T6.2 |
| M57 | `:193` | [HC] "⭐ 12 Ngôi Sao" hardcode | P1 | UNKNOWN (BE không thấy khái niệm sao) | T1.10 |
| M58 | `:320` | [HC] `onRecordEqSignal(eqSignal, 'Courage')` kỹ năng hardcode | P1 | checkpoint EQ | T6.2 |
| M59 | `:79,185` | [PH] ảnh bìa dự phòng ngoài; `gender` (field không có trong BE) quyết định emoji | P2 | — | T4.1 |

### 5.9 `screens/LoginScreen.tsx`, `screens/RegisterScreen.tsx`, `components/AuthModal.tsx`
| ID | Vị trí | Hành vi / rủi ro | Mức | API BE | Task |
|---|---|---|---|---|---|
| M60 | `LoginScreen.tsx:36-37` | [RM] Prefill email + mật khẩu demo (S7) | P1 | — | T1.3 |
| M61 | `LoginScreen.tsx:61-65,123-145` | [RM] Chip điền nhanh tài khoản demo parent/specialist/admin | P1 | — | T1.3 |
| M62 | `LoginScreen.tsx:165-170` (+ `App.tsx:197`) | [FS] Nút "Offline Demo" (`onSkip`) | P0 | — | T1.3/T1.5 |
| M63 | `LoginScreen.tsx:67-71,197-202` | [HC] Công tắc env có "Mock Demo (Offline)" (S4) | P0 | — | T1.3 |
| M64 | `AuthModal.tsx:55-59` | [RM] Prefill email/mật khẩu/họ tên/SĐT/PIN demo | P1 | — | T1.3 |
| M65 | `AuthModal.tsx:70-91` | [SC] `handleSaveProfile`: `catch {}` quanh `setKidPin`; rồi cập nhật user cục bộ `kidModePinHash = <PIN gõ>` + thông báo "thành công". PIN lưu ở client (S2); `fullName/phone` không gọi BE *(UNKNOWN: BE không thấy route cập nhật hồ sơ trong `auth.routes.js`; chưa kiểm Swagger/module khác)* | P0 | `POST /auth/kid-pin/set` | T1.11 → T3.2 |
| M66 | `AuthModal.tsx:160-181` | [FS] `handleAddNewChild`: lỗi ⇒ `onAddChild` giả + "Đã thêm bé …!"; luôn gửi `birthDate '2020-05-01'`, bỏ qua tuổi người dùng nhập (165) | P0 | `POST /children` | T1.11 → T4.1 |
| M67 | `AuthModal.tsx:362-366` | [HC] Nhãn/placeholder tiết lộ "Mặc định: <PIN demo>" | P1 | — | T1.3 |
| M68 | `AuthModal.tsx:377-397,190-195` | [RM] Nút điền nhanh tài khoản demo | P1 | — | T1.3 |
| M69 | `AuthModal.tsx:183-188,432-452` | [HC] Công tắc env "Mock Demo (Offline)" + URL localhost (S4,S10) | P0 | — | T1.3, T1.2 |
| M70 | `AuthModal.tsx:93-96` | [SC] logout `catch {}` | P2 | `POST /auth/logout` | T3.1 |
| — | `LoginScreen.tsx:51-58`, `RegisterScreen.tsx:53-71`, `AuthModal.tsx:110-123,137-157` | [C] Hiển thị lỗi BE đúng cách (không phải lỗi) | — | `/auth/login`, `/auth/register` | — |

### 5.10 `screens/StoryWizard.tsx`, `screens/WalletScreen.tsx`
| ID | Vị trí | Hành vi / rủi ro | Mức | API BE | Task |
|---|---|---|---|---|---|
| M71 | `StoryWizard.tsx:149-178` | [FS] `handleAddNewCharacter` lỗi ⇒ nhân vật cục bộ (`char_<ts>`) vẫn được chọn dùng | P0 | `POST /characters` | T1.9 → T4.2 |
| M72 | `StoryWizard.tsx:188-196` | [LS] `setTimeout` 1s/2.2s đặt tiến độ 45%/75% + chữ "Gemini AI đang sáng tạo…" — tiến độ giả | P1 | `GET /stories/:id/generation` (poll) | T1.9 → T5.2 |
| M73 | `StoryWizard.tsx:200-272` | [FS] Gọi `POST /stories/ai-generate` (**không tồn tại**); lỗi ⇒ **sinh truyện cục bộ** (3 trang, `PUBLISHED`, `priceVnd`/`ratingsAvg 5.0` bịa) (audit #7) | P0 | `POST /stories` + `POST /stories/:id/generate` + poll `/generation` | T1.9 → T5.1/T5.2 |
| M74 | `StoryWizard.tsx:274-278` | [FS] Luôn `progress 100`, "Tác phẩm hoàn thành xuất sắc!" + âm thanh thành công dù dùng truyện giả | P0 | — | T1.9 |
| M75 | `StoryWizard.tsx:279-281` | [SC] catch ngoài chỉ `setIsGenerating(false)`: kẹt Step 5, không báo lỗi | P1 | — | T1.9 |
| M76 | `StoryWizard.tsx:37-39,110-124` | [HC] Id mặc định `char_01`, `tpl_01`, `world_forest`; danh sách `STORY_WORLDS` tĩnh *(UNKNOWN: "thế giới" có tương ứng trong BE không)* | P2 | `GET /topics` | T5.1 |
| M77 | `WalletScreen.tsx:36-45,184` | [FS/LS] "Thanh toán PayOS" ⇒ **cộng credit cục bộ** + "Đã nạp thành công +N Credits" (không gọi BE/PayOS). B4: BE không có endpoint nạp credit | P0 | — (BLOCKED B4) | T1.8 |
| M78 | `WalletScreen.tsx:47-61,218` | [FS/LS] "Rút tiền" ⇒ trừ `sellerAvailableBalance` cục bộ + "Đã gửi yêu cầu rút … về Vietcombank!". **SCOPE PENDING** nhưng là tiền giả | P0 | `/market/withdrawals` (withdrawals.routes.js, chưa xác minh) | T1.8 → M8 |

### 5.11 Các màn hình còn lại
| ID | Vị trí | Hành vi / rủi ro | Mức | API BE | Task |
|---|---|---|---|---|---|
| M79 | `EqReportScreen.tsx:24-34` | [HC] Mặc định `ch_01`, stats `8 sách/65 phút`, child fallback `{Bé Bin, 6}` | P1 | `GET /children/:id/overview` | T1.10 → T4.3 |
| M80 | `EqReportScreen.tsx:36-44` | [SC] `.catch(() => {})` ⇒ giữ số liệu giả 8/65 khi lỗi | P1 | như trên | T1.10 → T4.3 |
| M81 | `EqReportScreen.tsx:46-52,65,99-111` | [RM] **5 điểm EQ hardcode (88/82/92/85/90)**, "14 lựa chọn", lời khuyên/điểm mạnh viết sẵn hiển thị như phân tích thật của bé | P0 | `GET /children/:id/eq-report`, `/overview` | T1.10 → T4.3 |
| M82 | `ParentHomeScreen.tsx:37-78,107` | [RM] `CURATED_DEMO_STORIES` thay danh sách khi `stories` rỗng (ảnh `/s1.jpg`… không phải URL RN) | P1 | `GET /stories` | T1.10 → T6.1 |
| M83 | `ParentHomeScreen.tsx:185,241` | [HC] Tiến độ "đang đọc" cố định 55%; rating mặc định `'5.0'` | P1 | `GET /children/:id/bookshelf` (`readingProgress`) | T1.10 → T6.1 |
| M84 | `ParentHomeScreen.tsx:314-324` | [HC] Nhiệm vụ đọc hằng ngày 1/2, thưởng "+10 Xu" cố định *(UNKNOWN: BE không thấy khái niệm quest/xu)* | P1 | UNKNOWN | T1.10 |
| M85 | `ParentHomeScreen.tsx:120,174` | [PH] Asset `'/hero_banner.jpg'`, `'/s1.jpg'` kiểu web — *(UNKNOWN: không resolve trên native, chưa chạy)* | P2 | — | T1.10 |
| M86 | `MarketplaceScreen.tsx:22,29,44-53` | [LS] "Chợ" = lọc `stories` cục bộ của chính phụ huynh; `onStoryPurchased` không dùng; không gọi `/market`. **SCOPE PENDING** | P1 | `/market/*` | T8.0 |
| M87 | `SellerDashboard.tsx:58-59,63-67` | [LS] KPI "Tổng truyện/Đang phát hành" = `stories.length`, số dư từ user (M12). **SCOPE PENDING**; không mở được từ UI | P1 | `/market/*` | T8.0 |
| M88 | `ModeratorAdminScreen.tsx:20-43` | [RM] `samplePendingStories` (truyện mẫu "Cô Thuỳ Trang") làm hàng đợi duyệt. **SCOPE PENDING**; không mở được từ UI | P1 | `/admin/*` | T8.0 |
| M89 | `ModeratorAdminScreen.tsx:46-56` | [FS] `handleApprove/Reject` chỉ lọc state cục bộ + "Đã phê duyệt và xuất bản lên Chợ!". **SCOPE PENDING** | P1 | `/admin/*` | T8.0 |
| M90 | `HeyTabBar.tsx:16`, `ShibaMascot.tsx:11`, `StoryReaderModal.tsx:15-16`, `ParentHomeScreen.tsx:20`, `StoryWizard.tsx:23-24` | [HC] Import `../../../../src/utils/{sound-fx,speech-tts}` = `App/src/utils` (prototype legacy deprecated). Không phải mock, nhưng runtime mobile phụ thuộc mã READ-ONLY *(UNKNOWN: Metro có bundle được không — chưa chạy)* | P1 | — | T1.12, T9.2 |

### 5.12 Phân loại khối `catch` (57 khối: A fake · B nuốt lỗi · C throw đúng)
- **A – Fake success/response (32):**
  - authService: login(`:45`), getMe(`:92`), setKidPin(`:147`), changeKidPin(`:163`), enterKidMode(`:181`), exitKidMode(`:210`, có điều kiện) — 6
  - childService: getChildren(`:22`), createChild(`:37`), updateChild(`:63`), deleteChild(`:83`), getChildOverview(`:94`) — 5
  - characterService: `:12`, `:24`, `:43`, `:56` — 4
  - storyService: getStories(`:20`), getStory(`:32`), createStory(`:58`), addToShelf(`:89`), removeFromShelf(`:103`), getTemplates(`:125`) — 6
  - kidService: `:19`, `:37`, `:56`, `:71`, `:89` — 5
  - App.tsx: handleStoryCreated(`:146`), handleAddChild(`:164`) — 2
  - StoryWizard: handleAddNewCharacter(`:161`), generation(`:210`) — 2
  - AuthModal: handleAddNewChild(`:171`) — 1; KidModeScreen: handleVerifyPin(`:145`) — 1
- **B – Nuốt lỗi, UI vẫn đi tiếp (18):** authService.logout(`:115`); childService eq-journey(`:115`), bookshelf(`:129`); apiClient JSON parse(`:114`,`:152` — 200 không JSON trả `null` thành công, P2); storage.ts(`:16,25,34,43` — nuốt lỗi localStorage, rơi về bộ nhớ RAM, *token không bền trên native → T2.2*); App.tsx: `:99`, `:112`, `:122` (**vào Kid Mode dù BE lỗi**), `:133` (**thoát Kid Mode**), `:181`; StoryWizard `:279`; AuthModal `:76` (**PIN**), `:96`; EqReportScreen `:42`.
- **C – Throw/reject đúng (7):** apiClient `:94` (network → `ApiError`), `:105` (refresh fail → `ApiError 401`, *chỉ xóa access token, không xóa refresh token → T2.1*), `kidFetch :145`; LoginScreen `:54`, RegisterScreen `:67`, AuthModal `:119`, `:153` (hiển thị `err.message`).
- Không tính: `IntroScreen.tsx:38,40` (`video.play().catch`) — màn hình chết, vô hại.

### 5.13 Không coi là lỗi (đã phân biệt)
- **Test fixture:** không có.
- **Dữ liệu tĩnh hợp lệ / UI:** `themes` (MarketplaceScreen `:36-42`), `EQ_TOPICS` (ParentHomeScreen `:80-87`, UNKNOWN có map `/topics`), bàn phím PIN, nhãn tab.
- **Placeholder UI:** ảnh dự phòng ngoài (`authService.ts:226`, `storyService.ts:136,146`, `KidModeScreen.tsx:79`, `MarketplaceScreen.tsx:106`, `SellerDashboard.tsx:87`), placeholder SĐT `RegisterScreen.tsx:123`.
- **`setTimeout`/`setInterval` hợp lệ (animation/UX):** `CuteMascot.tsx:57`, `ModeratorAdminScreen`/`WalletScreen`/`AuthModal` timer ẩn notice, `KidModeScreen.tsx:153` (reset lỗi PIN), `IntroScreen` (chết).
- **Đã kiểm tra, KHÔNG có mock:** `apiClient.ts` (ngoài các ghi chú ở §5.12), `storage.ts`, `theme/*`, `components/ui/*`, `CloudPopEntrance`, `HeyTopBar` (chỉ hiển thị `creditBalance`).
- **Không tìm thấy:** `AsyncStorage`, `Linking`, `expo-web-browser`, `Math.random` giả dữ liệu, `Promise.resolve`/`new Promise` giả nghiệp vụ.

### 5.14 Đối chiếu BE (chỉ đọc, đường dẫn thực tế `BE/api/src/modules/*`)
- Có: `auth.routes.js` (`/auth/login|register|refresh-tokens|logout|me|kid-pin/set|kid-pin/change|kid-mode/enter|kid-mode/exit`), `kid.routes.js` (`/kid/me|bookshelf|ui-audio|sessions…`), `bookshelf.routes.js`, `children.routes.js` (`/:id/overview|eq-report|eq-journey|bookshelf|usage|avatar`), `characters.routes.js`, `stories.routes.js` (`/analyze`, `/:id/generate`, `/:id/generation`, `/ai-pricing`, `/:id/review`…), `plans.routes.js` (`/subscriptions/me`, `/me/credit-history`).
- Không có: `/stories/ai-generate` (0 kết quả); endpoint nạp credit (B4); `kid.validation.js` xác nhận `answers` là `.strict()` với `emotion` enum (`happy|sad|angry|scared|neutral`) + `optionId`.
- Ghi chú sửa M0: audit M0 ghi `BE/src/...`; đường dẫn thật là `BE/api/src/...`.

## 6. Phát hiện bảo mật
| ID | Mức | Phát hiện | Bằng chứng |
|---|---|---|---|
| S1 | P0 | Backdoor PIN demo hardcode thoát Kid Mode (cả ở `KidModeScreen` lẫn `authService.exitKidMode`) | `KidModeScreen.tsx:146`, `authService.ts:212`, `App.tsx:232` (M54, M11, M21) |
| S2 | P0 | PIN xác minh/lưu phía client (`kidModePinHash` = PIN gõ; `correctPin` prop) | `AuthModal.tsx:59,82`, `KidModeScreen.tsx:146`, `App.tsx:232` (M65, M54) |
| S3 | P0 | Token giả + user DEMO khi lỗi → trông như đã đăng nhập; kid session giả | `authService.ts:52-55,99,177,183` , `App.tsx:197-201` (M05, M06, M09, M10, M15) |
| S4 | P0 | Mock mode bật được ở build thật; thực chất fallback giả chạy vô điều kiện ở mọi env | `config.ts:4,23-31`, `LoginScreen.tsx:197-202`, `AuthModal.tsx:448-452` (M01, M63, M69) |
| S5 | P1 | Chưa có lưu token an toàn (SecureStore); `storage.ts` rơi về RAM trên native | `package.json`, `storage.ts:4-46` |
| S6 | P1 | Chưa tách kid token khỏi parent token ở lớp lưu; refresh lỗi chỉ xóa access token; `kidFetch` không xử lý 401 | `apiClient.ts:49-50,105-108,127-162` |
| S7 | P1 | Prefill/hiển thị credential demo trong UI (mật khẩu, PIN) và bundle `DEMO_CREDENTIALS` | `LoginScreen.tsx:36-37`, `AuthModal.tsx:55-59,362-366`, `config.ts:42-62` (M02, M60, M64, M67) |
| S8 | P1 (BE – chỉ khuyến nghị) | PIN limiter in-memory (5 sai→khóa 15'; reset khi restart) | `BE/.../auth/lib/kidPinLimiter.js` |
| S9 | P1 (BE – chỉ khuyến nghị) | Không rate-limit chung login/register | BE |
| S10 | P2 | Base URL `localhost`/`10.0.2.2`/PROD hardcode trong code + UI | `config.ts:7-12`, `AuthModal.tsx:436` (M03) |
| S11 | P2 | Cloudinary signed URL không hết hạn | BE `assetUrl` |
| S12 | P0 | Fake credit/payment: nạp credit cục bộ, rút tiền cục bộ, trừ credit cục bộ, `creditBalance` mặc định bịa, lịch sử giao dịch hardcode | `WalletScreen.tsx:36-61`, `App.tsx:68-88,149-152`, `authService.ts:232` (M12, M24, M26, M77, M78) |
| S13 | P0 | Dữ liệu EQ/tiến bộ của bé giả (5 điểm hardcode, overview bịa) hiển thị như thật | `EqReportScreen.tsx:46-52,99-111`, `childService.ts:94-106` (M33, M81) |
| S14 | P0 | Kid Mode vào/thoát khi BE lỗi (`catch` vẫn `setIsKidMode`) | `App.tsx:117-137` (M18, M19) |
| S15 | P0 | Ghi (child/character/story/kid/PIN) báo thành công khi BE lỗi → mất dữ liệu âm thầm | các khối `catch` loại A: 26 ở services + 6 ở App/screens (§5.12) |
| S16 | P1 | Mobile import mã legacy `App/src/utils` (deprecated) | M90 |
| S17 | P1 | Mở Seller/Moderator/Admin chỉ chặn bằng state UI (`activeRole`), không có kiểm tra quyền từ BE; hiện không có đường UI tới chúng | `App.tsx:55,253-262`, `HeyTopBar.tsx:20-21` *(UNKNOWN: cần quyết định khi mở M8)* |

## 7. Dependencies – hiện trạng & đề xuất (CHƯA cài)
- Tương thích SDK 52 (theo `bundledNativeModules.json` expo@52.0.49): secure-store ~14.0.1, web-browser ~14.0.2, linking ~7.0.5, async-storage 1.23.1, expo-av ~15.0.2, expo-audio ~0.3.5 (sơ khai), expo-router ~4.0.22.
- Đề xuất: `expo-secure-store` (nên); giữ `fetch`, không thêm axios; react-query (tuỳ chọn, chờ duyệt); audio **chưa chọn** (UNKNOWN: chốt sau xác minh contract & thiết bị).
- Dọn drift SDK bằng `npx expo install --check` (chờ duyệt, task T1.1).

## 8. BLOCKED / UNKNOWN / SCOPE PENDING
**BLOCKED:** B1 deep link payOS về mobile (BE chỉ có `WEB_URL`) · B2 upload ảnh (BE không có upload) · B3 `publish-version` trả 501 · B4 nạp credit (không có endpoint) · B5 AI image BE tạm dừng.
**UNKNOWN (còn lại sau T1.0):** U1 hành vi runtime thật (chưa chạy app/BE) · U2 Expo Go/thiết bị nhóm với SDK 52 · ~~U3~~ **ĐÃ ĐÓNG ở T1.0** (xem dưới) · U5 `expo-speech` còn dùng hay chuyển audio BE · U6 PIN 4 vs 4–6 số (UI hiện cố định 4: `KidModeScreen.tsx:160-163`) · U7 base URL/`.env` mobile: không có `.env*` trong `apps/mobile`, `app.json` không có `extra`; URL hardcode ở `config.ts` (không đọc secret) ·
**U8** BE có API cập nhật hồ sơ phụ huynh (`fullName/phone`) không — không thấy trong `auth.routes.js`, chưa kiểm Swagger/module khác (ảnh hưởng M65) ·
**U9** `GET /children/:id/usage` có thay thế timer 20 phút cục bộ không (M56) ·
**U10** "Thế giới truyện" (`STORY_WORLDS`) và "Nhiệm vụ đọc/Xu/Ngôi sao" có khái niệm tương ứng trong BE không (M57, M76, M84) ·
**U11** Metro có bundle được `App/src/utils/*` từ mobile không (M90) và asset `/s1.jpg`, `/hero_banner.jpg` có resolve trên native không (M85) ·
**U12** Verb cập nhật child/character (`PUT` vs `PATCH`) và công thức trừ credit chính xác khi `/generate` (M24, M31, M39) — cần Swagger.

**Đóng U3 (T1.0):** đã rà soát tĩnh 100% file runtime của `apps/mobile`: `App.tsx`; `services/` (apiClient, authService, characterService, childService, config, demoData, index, kidService, storage, storyService); `screens/` (EqReport, KidMode, Login, Marketplace, ModeratorAdmin, ParentHome, Register, SellerDashboard, StoryWizard, Wallet); `components/` (AuthModal, CuteMascot, HeyTabBar, HeyTopBar, IntroScreen, ShibaMascot, StoryReaderModal, animations, ui/*); `theme/*`. Phương pháp: quét từ khóa toàn bộ `src/**` (demo/mock/fake/offline/setTimeout/Promise/catch/`fetch`/service call/hằng PIN-mật khẩu) + đọc tay mọi handler (`handle*`, `useEffect`, `catch`) và mọi điểm gọi mạng. Giới hạn: **không chạy app** (U1) và JSX thuần trình bày của file lớn (`StoryWizard`, `KidModeScreen`, `ParentHomeScreen`) chỉ quét theo từ khóa, không đọc từng dòng; nếu về sau phát hiện thêm sẽ ghi M91+.
**SCOPE PENDING:** Seller, Specialist, Admin, Marketplace, Payment (đã quyết định giữ nguyên, không xóa, không phát triển thêm).

## 9. Câu hỏi mở cho nhóm
1. Mobile có phục vụ Seller/Specialist/Admin không? Giữ màn hình hiện có như thế nào?
2. BE có thể thêm mobile return URL cho payOS? Nếu không, chấp nhận polling?
3. Nạp credit, publish marketplace (501), upload ảnh, AI image: có nằm trong phạm vi?
4. PIN mobile 4 số hay 4–6 số?
5. Audio: dùng `audioUrl` BE hay TTS thiết bị làm dự phòng?
6. Kiến nghị BE: rate-limit chung và PIN limiter bền (Redis).
