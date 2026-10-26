# ARCHITECTURE DECISIONS – StoryWeaver Mobile

## ADR-001 – Target repo
- **Quyết định:** `App` (runtime `apps/mobile`) là repo chính. `App_v2` chỉ là mẫu tham khảo.
- **Hệ quả:** không thay App bằng App_v2; không copy nguyên khối mock của App_v2.

## ADR-002 – Expo SDK: giữ SDK 52 (Phương án A) – ĐÃ DUYỆT
| Phương án | Kết luận |
|---|---|
| **A. Giữ SDK 52 + kiến trúc App_v2** | **CHỌN.** Công sức thấp, rủi ro thấp, giữ code/API hiện có |
| B. Migrate sang SDK 58 | Không chọn: React 19, RN 0.88, Reanimated 3→4 (+worklets), bỏ `expo-av`, ảnh hưởng Kid Mode |
| C. Nâng từng SDK | Không chọn: chi phí cao, kéo dài |

- **Hệ quả:** mọi package phải khớp `bundledNativeModules.json` của SDK 52 (cài bằng `npx expo install`). Không dùng API chỉ có ở React 19/RN 0.88/expo-router 58.
- **Xem lại SDK 58:** chỉ sau khi P0 hoàn tất và có quyết định mới.
- **Rủi ro còn lại:** Expo Go/SDK 52 trên thiết bị nhóm (UNKNOWN).
- Dọn drift (`expo-asset`, `expo-font` ^57, RN 0.76.7→0.76.9, haptics, speech) – task T1.1, cần duyệt trước khi chạy.

## ADR-003 – Phạm vi
- **P0:** Parent + Kid Mode.
- **SCOPE PENDING:** Seller, Specialist, Admin, Marketplace, Payment/Subscription checkout.
- **Không xóa** tính năng/màn hình hiện có. Phần SCOPE PENDING giữ nguyên code; nơi đang dùng mock phải **không giả dữ liệu thành công** (chuyển thành trạng thái "chưa kết nối" khi được duyệt, task riêng).

## ADR-004 – Kiến trúc mã nguồn (học từ App_v2, tương thích SDK 52)
Đề xuất cấu trúc trong `apps/mobile/src/`:
```
api/        client (fetch wrapper), endpoints theo module, types DTO BE
services/   gọi API + mapper BE→UI (không bịa field)
store/      session (parent), kidSession (tách riêng)
hooks/      useXxx (poll generation, ...)
screens/    giữ hiện có, tách dần
components/ UI dùng chung
theme/      design tokens
config/     env/base URL
```
- **Điều hướng:** giai đoạn đầu giữ cơ chế hiện có; việc đưa router (React Navigation hoặc expo-router ~4.0.22) là **quyết định riêng, chưa duyệt**.
- Không copy `mockApi.ts`/`mocks/db.ts` của App_v2.

> **Cập nhật 2026-10-26:** cấu trúc đích chi tiết và quyết định điều hướng nằm ở [ADR-015](#adr-015--cấu-trúc-thư-mục-đích--điều-hướng). ADR-004 giữ nguyên làm lịch sử.

## ADR-005 – HTTP: tiếp tục dùng `fetch`
- Lý do: envelope BE đơn giản; axios không có tính năng bắt buộc.
- Wrapper cần: base URL từ env, timeout, parse `{success,message,data,errors[]}`, header Bearer, **single-flight refresh** khi 401 (loại trừ `/auth/login|register|refresh-tokens|logout`, theo `Web/src/services/api.js`), lỗi có kiểu (401/402/403/409/422/429/502).
- **Không thêm axios.**

## ADR-006 – Session & lưu trữ
- Parent: `accessToken` (15m) + `refreshToken` (7d, rotating) lưu bằng `expo-secure-store` (đề xuất, ~14.0.1 cho SDK 52; **chờ duyệt cài**).
- Kid: `kidSessionToken` (24h) + child lưu **tách riêng**; hết hạn/401 → kết thúc kid session; **không** refresh bằng parent token (theo `kidApi` ở Web).
- Dữ liệu không nhạy cảm (UI) có thể dùng AsyncStorage 1.23.1 (tuỳ chọn).
- Cấm lưu PIN/hash PIN ở client.

## ADR-007 – Kid PIN
- Chỉ xác minh qua BE: `/auth/kid-pin/set`, `/auth/kid-pin/change`, `/auth/kid-mode/enter`, `/auth/kid-mode/exit`.
- Xử lý 401 `attemptsLeft`, 429 `retryAfterSeconds`. Xóa backdoor `1234`.
- Độ dài PIN: BE 4–6 số; mobile chọn sau khi nhóm trả lời (UNKNOWN U6).

## ADR-008 – Không fake-success
- Cấm: token giả, user DEMO, mode "mock/offline demo", ví/credit/thanh toán giả, dữ liệu bịa khi API lỗi.
- Khi API lỗi/BLOCKED: hiển thị lỗi thật, trạng thái rỗng, hoặc "chưa hỗ trợ".

## ADR-009 – Tạo truyện
- Theo Web: 3 entry (family/topic/handwritten); `POST /stories` → `POST /stories/:id/generate` → poll `GET /stories/:id/generation` (2–3s, tối đa theo BE ~10 phút stale) → editor/review.
- Xử lý 402 (thiếu credit), 422 (errors[]), 429/502 (analyze). AI image hiện tạm dừng: dùng placeholder (cần xác nhận B5).

## ADR-010 – Audio
- **Chưa chọn thư viện.** Contract đã biết: audio là HTTPS URL công khai (`audioUrl` page, question/hint/feedback audio, `GET /kid/ui-audio`); `useTts=false` → `audioUrl=null`.
- SDK 52: `expo-av ~15.0.2` hoặc `expo-audio ~0.3.5` (sơ khai). Quyết định sau khi xác minh yêu cầu (tự động phát, mute, nền) và thiết bị. Chưa cài gì.

## ADR-011 – Thanh toán (SCOPE PENDING)
- Không triển khai ở P0. Khi được duyệt: mở `checkoutUrl` bằng `expo-web-browser` + polling `GET /payments/orders/:id`. Deep link **BLOCKED** (BE chỉ có `WEB_URL`). Không có top-up credit (BE không có).

## ADR-012 – Mã legacy
- `App/server.ts`, `App/apps/api`, `App/src/utils/mockData.ts`, `App/src/shims/*`: **deprecated, giữ nguyên**, không dùng trong mobile. Chỉ xóa/di chuyển khi được duyệt.

## ADR-013 – Chất lượng
- Hiện chưa có test/lint. Tối thiểu: `npx tsc --noEmit` mỗi task; unit test cho API client/mapper sau khi được duyệt thêm tooling (dependency → cần duyệt).

---
# Điều chỉnh roadmap 2026-10-26 (ADR-014 → ADR-020)

> **Trạng thái: ĐÃ PHÊ DUYỆT CÓ ĐIỀU KIỆN (2026-10-26).** Các điều kiện đã được ghi trong từng ADR dưới đây và trong `IMPLEMENTATION_PLAN.md` §0. Chưa bắt đầu coding; task kế tiếp chờ lệnh: S0.1.

## ADR-014 – Thứ tự triển khai v2 và Safety Gate
- **Quyết định (đã duyệt):** thứ tự **Safety tối thiểu → A → B → C → D → E**: A Refactor cấu trúc theo App_v2 · B Đồng bộ UI/nghiệp vụ với Web · C Tích hợp API thật · D Gỡ mock/fake/demo · E Kiểm thử & hoàn thiện. Chi tiết task ở `IMPLEMENTATION_PLAN.md`.
- **Không bắt buộc hoàn thành toàn bộ S0.1–S0.7 trước khi bắt đầu A.** Chỉ **S-min** làm trước A:
  1. **S0.1** – loại bỏ bypass PIN `1234` và so sánh PIN cục bộ;
  2. **S0.2** – không vào/thoát Kid Mode bằng xác thực giả hoặc khi xác minh thật thất bại;
  3. **S0.4 + S0.5a** – không để thao tác ghi nhạy cảm, thanh toán hoặc credit giả báo thành công như BE thật.
- **Hoãn có blocker, xử lý tại milestone:** S0.3 → A3 · S0.5b → B5/C8 · S0.5c → B3/B11 (U8) · S0.6 → A8/B · S0.7 → A2. Phần cần refactor lớn hoặc phụ thuộc API chưa có được ghi rõ blocker trong `IMPLEMENTATION_PLAN.md` §0.1.
- **G-DEMO vẫn bắt buộc** trước mọi buổi demo/bàn giao có đăng nhập, Kid Mode hoặc tiền/credit; hoãn S đồng nghĩa chưa được demo luồng liên quan.
- **Hệ quả:** không task gốc nào bị xóa; chỉ gán lại phase. Quy tắc "mỗi lần một task nhỏ, dừng chờ review" giữ nguyên.

## ADR-015 – Cấu trúc thư mục đích & điều hướng
- **Mục tiêu:** học **cách tổ chức** của App_v2 (tách screen/component/service/store/hook/constants/types), **không** bắt buộc dùng công nghệ của App_v2 (Expo Router, zustand, react-query, Expo 58).
- **Điều hướng – quyết định hiện tại:** giữ điều hướng bằng state nhưng **đưa sau một lớp trừu tượng**: `navigation/routes.ts` (hằng `ROUTES` có kiểu, mô phỏng `App_v2/src/constants/routes.ts`), `AppNavigator`, `ParentTabs` (Home · Library · Studio · Marketplace[SCOPE PENDING] · More), `KidStack`. Màn hình chỉ gọi `navigate(ROUTES.x)`, không gọi `setCurrentTab(...)` trực tiếp. Nhờ đó đổi sang React Navigation hoặc `expo-router ~4.0.22` sau này chỉ sửa lớp này.
- **Đã duyệt:** không tự chuyển sang Expo Router; không thêm thư viện điều hướng khi chưa được người dùng phê duyệt.
- **Không dùng Expo Router/React Navigation ở phase A** vì cần thêm dependency (cần duyệt) và không cần thiết để đạt mục tiêu refactor. Xem lại ở cổng A9 nếu nhu cầu deep link/back stack thực sự phát sinh (payOS deep link hiện BLOCKED nên chưa cần).
- **Cấu trúc đích** (`apps/mobile/src/`; chỉ di chuyển, không xóa):
```
navigation/   routes.ts, AppNavigator, ParentTabs, KidStack
screens/
  auth/  parent/  kid/  scope-pending/   (Seller, Moderator/Admin, Marketplace, Wallet-payment: giữ nguyên)
components/
  ui/ (Hey* hiện có + Screen, Sheet, Toaster, SelectField, Badge, TextField)
  auth/  parent/  kid/
services/     apiClient, authService, childService, ... (BE → UI mapper, không bịa field)
stores/       auth, kidSession (tách riêng), toast
hooks/        useXxx (poll generation, ...)
constants/    routes, casel, eqLevels, story
types/        DTO theo BE rev8 (mobile-local)
utils/        format, child, audio/speech cho mobile (thay import legacy, T1.12)
theme/        tokens (colors, spacing, shadows) – bổ sung từ App_v2
config/       env/base URL (T1.2)
dev/demo/     dữ liệu demo tạm thời (ADR-016) – chỉ import qua demoGate
```
- **Types:** `packages/shared-types` nằm ngoài `apps/mobile` và **READ-ONLY** → mobile tạo `src/types/` riêng theo BE rev8, chuyển import dần; không sửa `packages/`.
- **Alias import** (`@/`): chỉ dùng nếu xác minh Metro SDK 52 hỗ trợ **không cần dependency**; mặc định dùng đường dẫn tương đối.
- **Nguyên tắc refactor:** không đổi hành vi; mỗi task một thay đổi nhỏ; sau mỗi task `tsc` pass và app khởi động; không xóa màn hình/file (kể cả `IntroScreen` chưa được import).

## ADR-016 – Dữ liệu mẫu: chỉ trong UI Preview tách biệt
- **Bối cảnh:** cần dữ liệu mẫu để phát triển UI ở phase A–B trước khi nối API. ADR-008 (cấm fake-success) **vẫn hiệu lực**. *(Thay thế bản nháp ngày 2026-10-26 cho phép demo trộn trong màn thật; bản duyệt hạn chế hơn.)*
- **Đã duyệt:** dữ liệu mẫu được dùng **trong preview tách biệt** (ADR-020). Màn thật không âm thầm hiển thị dữ liệu mẫu như dữ liệu thật; **production khi chưa có dữ liệu thật hiển thị trạng thái rỗng hoặc thông báo phù hợp**.
- **Cách tổ chức:**
  1. Dữ liệu mẫu gom ở `src/dev/demo/`; chỉ `src/dev/preview/` (và lớp chuyển tiếp có nhãn, bên dưới) được import.
  2. Màn hình viết dạng trình bày (nhận dữ liệu qua props/hook): màn thật cấp dữ liệu từ service, preview cấp dữ liệu mẫu.
  3. **Lớp chuyển tiếp** (cho code demo cũ chưa kịp chuyển): bọc `__DEV__` + `DemoBanner` + marker `// TEMP-DEMO(<task xóa>)`; production thấy trạng thái rỗng. Xóa dần ở A8/B/D.
  4. Màn `API INTEGRATED` phải ngừng dùng dữ liệu mẫu ngay trong task tích hợp.
  5. Xóa `src/dev/demo/` ở D4 (cần duyệt riêng).
- **Cấm tuyệt đối (kể cả tạm thời):** fake API/endpoint; mô phỏng thành công cho **đăng nhập thật, quyền truy cập thật, ghi dữ liệu BE, thanh toán**, PIN, phiên; token/user/ví/credit giả; so sánh PIN cục bộ; số liệu EQ/tiến độ hardcode hiển thị như dữ liệu thật.
- **Thao tác ghi ở phase A–B:** gọi `notConnected()` hiển thị "Chưa kết nối API", không đổi state như thể đã thành công.

## ADR-017 – Quản lý state
- **Đã duyệt:** không tự thêm Zustand, Axios hay thư viện state/HTTP khác; ưu tiên thư viện và state management hiện có; thư viện mới phải được người dùng phê duyệt trước.
- **Quyết định:** không thêm thư viện state ở giai đoạn này. Dùng React context + store tối giản trong `stores/`, giữ **kid session tách riêng parent session** (ADR-006).
- **Lý do:** `zustand`/`react-query` là dependency mới (cần duyệt, AGENTS §2); nhu cầu hiện tại nhỏ. Xem lại khi bắt đầu phase C nếu cache/refetch trở nên phức tạp; khi đó đề xuất duyệt riêng.
- App_v2 dùng zustand persist (AsyncStorage) chỉ là tham chiếu; **không** lưu token trong store persist thường — token đi qua `expo-secure-store` (T2.2, chờ duyệt).

## ADR-018 – UI: theo nghiệp vụ Web, tối ưu cho React Native
- **Nghiệp vụ & luồng người dùng** theo Web (`Web/src/pages/**`, `services/*.js`): cùng bước, cùng quy tắc kiểm tra, cùng thông báo lỗi (Việt hoá như `VI_MESSAGES`). **Bố cục/tương tác** theo App_v2 và thói quen mobile, không sao chép layout desktop.
- **Nguyên tắc RN:** safe area; `KeyboardAvoidingView`; `FlatList` cho danh sách dài; vùng chạm ≥44pt; bottom sheet thay modal/trang phụ khi hợp lý; pull-to-refresh; không phụ thuộc hover; chạy tốt ở 2 cỡ màn hình; Kid Mode ưu tiên chạm lớn.
- **Mọi màn** có đủ 3 trạng thái: loading · empty · error (kèm thử lại). Lỗi lấy từ `ApiError`, không bịa.
- **Không thêm dependency UI** (chart, date picker, icon…) khi chưa duyệt; nếu thiếu thì ghi UNKNOWN/đề xuất. **Đã duyệt:** không thêm date picker — `birthDate` nhập text `YYYY-MM-DD` có kiểm tra (B3).
- **SCOPE PENDING:** giữ nguyên màn hiện có, không phát triển thêm (ADR-003).

## ADR-019 – Bốn trục trạng thái tính năng & Definition of Done
- Mỗi tính năng (F1–F15 và SCOPE PENDING) được theo dõi bằng **4 trục độc lập**: `UI COMPLETE` · `API INTEGRATED` · `RUNTIME TESTED` · `MOCK REMOVED`; ký hiệu ✅ ◐ ❌ —. Định nghĩa và bằng chứng yêu cầu ở `IMPLEMENTATION_PLAN.md` §1.2; ma trận hiện tại ở §1.3.
- **Quy tắc:**
  - `UI COMPLETE` được chứng minh bằng dữ liệu mẫu trong UI Preview tách biệt (ADR-020); **không** suy ra `API INTEGRATED`.
  - `API INTEGRATED` chỉ chứng minh code đúng contract; **không** suy ra chạy được.
  - `RUNTIME TESTED` chỉ đánh ✅ khi đã chạy thật với BE thật và ghi Nhật ký (ngày, commit BE/App, thiết bị, ca test, kết quả). Không có bằng chứng → ❌ hoặc "CHƯA CHẠY".
  - `MOCK REMOVED` chỉ đánh ✅ khi grep cổng của tính năng sạch (IMPLEMENTATION_PLAN §6).
- **Trạng thái task** tách riêng: `NOT STARTED → IN PROGRESS → DONE-STATIC → ACCEPTED` (+ `BLOCKED`). `ACCEPTED` chỉ do người dùng xác nhận.
- **Áp dụng hiện tại:** T1.3 = `DONE-STATIC`, RUNTIME TESTED = ❌ cho tới khi chạy cùng BE.

## ADR-020 – UI Preview (công cụ dev) & Kid UI Preview
- **Bối cảnh:** S0.2 chặn vào Kid Mode khi BE lỗi nên không xem được UI Kid khi BE chưa chạy. **Đã duyệt** tạo Kid UI Preview riêng để phát triển giao diện; mở rộng cùng cơ chế cho các màn khác khi cần.
- **Thời điểm:** chỉ triển khai khi tới task UI phù hợp (**B9-P**). **Chưa viết code preview** ở giai đoạn này.
- **Điều kiện bắt buộc (cả 7):**
  1. Chỉ khả dụng khi `__DEV__` và phải **bật bằng thao tác chủ động** (không tự mở).
  2. **Không** dùng token giả, fake authentication hay bypass PIN.
  3. **Không** thay đổi trạng thái đăng nhập/Kid Mode thật để mở preview (cây preview tách khỏi cây điều hướng và store phiên thật).
  4. **Không** gọi API ghi dữ liệu, thanh toán hay nghiệp vụ thật.
  5. **Không** lưu dữ liệu mẫu như dữ liệu người dùng thật (không ghi vào `safeStorage`/SecureStore, không đẩy vào store phiên).
  6. Hiển thị rõ "UI Preview – dữ liệu mẫu".
  7. **Không tồn tại đường truy cập preview trong production.**
- **Cách kiểm chứng:** cổng grep G11 (`IMPLEMENTATION_PLAN.md` §6): `dev/preview` chỉ xuất hiện trong nhánh `__DEV__`; `src/dev/**` không import `apiClient`, `safeStorage`, `authService`, `kidService`. Kiểm tra bản build production không có lối vào ở phase E.
- **Phân biệt với phiên thật:** preview **không phải** Kid Mode; thoát preview không dùng PIN và không đổi phiên. Vào Kid Mode thật vẫn bắt buộc qua `/auth/kid-mode/enter` (S0.2).

## Ghi chú – các quyết định còn PENDING (không tự quyết)
- **Độ dài PIN:** theo validation thực tế của BE. Đã xác minh (đọc BE, không sửa): `BE/api/src/modules/auth/auth.validation.js` – `setKidPin`, `changeKidPin.newPin`, `exitKidMode.pin` đều `^\d{4,6}$`. UI hiện cố định 4 số → điều chỉnh ở T3.2/T3.3; chi tiết giao diện do người dùng duyệt (ADR-007, U6).
- **AI Image (T5.4) và Audio (T6.3, ADR-010):** chờ task liên quan; chưa chọn thư viện.
- **Seller, Specialist, Admin, Marketplace, Payment:** SCOPE PENDING (ADR-003, ADR-011). Không tự xóa màn hình hiện có khi nhóm chưa thống nhất loại bỏ.

## Ghi chú hiện thực hóa Phase A (2026-10-26)
- **ADR-015 đã áp dụng** (cấu trúc thực tế: `PHASE_A_PROGRESS.md`): `navigation/` (ROUTES typed, giữ điều hướng bằng state), `screens/{auth,parent,kid,scope-pending}`, `components/{ui,auth,parent}`, `dev/demo/`. Thư mục `components/kid/`, `hooks/`, `constants/`, `config/` **chưa tạo** vì chưa có module nào cần.
- **ADR-017 đã áp dụng:** `stores/` gồm 3 hook state + `SessionProvider` (3 context riêng: phiên Parent, dữ liệu Parent, Kid session). Không thêm thư viện.
- **Cấu hình API (A0.2, thay thế phần "URL hardcode" của ADR-004):** địa chỉ lấy từ `EXPO_PUBLIC_API_URL` (công khai, không bí mật), chuẩn hóa về `…/api/v1`; thiếu cấu hình → lỗi rõ ràng, không dùng URL mặc định. Hướng dẫn: `docs/mobile/ENVIRONMENT.md`. Địa chỉ production chỉ cấu hình khi nhóm BE xác nhận.
- **ADR-016:** fixture đã tách vào `src/dev/demo/`; không file nào ngoài `src/dev/` import chúng.
- **Type DTO:** `types/api.ts` (chỉ trường BE trả) + view model `types/sessionUser.ts`; `packages/shared-types` vẫn chỉ đọc.
- **Alias `@/`:** không dùng (chưa xác minh Metro SDK 52 hỗ trợ không cần cấu hình thêm); dùng đường dẫn tương đối.

## Ghi chú hiện thực hóa Phase B (2026-10-26)
- **ADR-015 (điều hướng):** vẫn state, nhưng có ngăn xếp màn con (`useParentNavigation`) + nút Back Android; thanh tab 5 mục là Trang chủ · Tủ truyện · Sáng tác · Tiến độ · Credit; menu "Thêm" mở các màn con. Không thêm thư viện.
- **Bé đang chọn** là state dữ liệu Parent (`useParentData.selectedChild`), không phải state điều hướng; Kid Mode mặc định theo bé này.
- **ADR-018 (UI):** primitive dùng chung thật sự có nơi dùng: `Badge`, `StateView` (loading/empty/error/chưa hỗ trợ), `Sheet`, `ScreenHeader`; chưa tạo `SelectField/TextField/Toaster`.
- **ADR-020 (UI Preview):** đã hiện thực cho Kid (`src/dev/preview/KidPreview`): lớp phủ `__DEV__`, bật chủ động ở màn Login, nạp bằng `require` trong nhánh `__DEV__`, không PIN/phiên/API/storage. `KidModeScreen` bỏ qua prop `preview` ngoài `__DEV__`.
- **Kid shelf thật:** để trống tới khi nối API kệ sách Kid (C9); không dùng danh sách truyện của phụ huynh làm tủ sách của bé.
- **Quy tắc ghi dữ liệu trong Phase B:** chỉ các lời gọi ghi đã có và đúng contract (đăng nhập/đăng ký, tạo bé, tạo nhân vật, đặt/đổi PIN); mọi thao tác ghi khác hiện "Chưa hỗ trợ".
- `AuthModal` đã DEPRECATED (không mount), chờ duyệt xóa.

## Ghi chú hiện thực hóa Phase C (2026-10-26)
- **Nguồn contract:** đọc trực tiếp source BE (`routes` + zod `*.validation.js` + `*.controller.js` + `*.service.js`/`lib/*format*.js`). Khi lệch tài liệu cũ, BE thắng (danh sách ở PHASE_C_PROGRESS).
- **ADR-008 (service throw):** mọi service mới (`billingService`, `kidService`, `storyService`, ...) throw `ApiError` khi lỗi/sai hình dạng (502 cho response 2xx sai contract); không `catch` trả giả.
- **API client:** thêm timeout 20 s và tùy chọn `raw` (nguyên envelope) để đọc `pagination`; `ApiError.errors` giữ trường phụ (`attemptsLeft`, `retryAfterSeconds`, `narration`).
- **Kid Mode dùng nguồn dữ liệu tiêm vào (`KidDataSource`):** `KidModeScreen` nhận `source`; thật = `kidService`, UI Preview = fixture trong `src/dev/preview`. Kiểu `KidDataSource` nằm ở `types/` để `src/dev` không import service (G11). Một đường UI duy nhất cho cả hai.
- **Logic đọc truyện** tách khỏi giao diện: `screens/kid/useKidReader.ts` (shelf, session, checkpoint, chống bấm đúp, phát hiện 401 = phiên Kid mất).
- **Tài nguyên theo màn:** hook `utils/useAsyncResource` (loading/ready/error + reload, bỏ kết quả cũ khi đổi bé) cho Trang chủ, EQ, Credit. Không thêm thư viện cache.
- **Story view model:** `StoryView = Story & {...}`; danh sách là bản tóm tắt (`detailLoaded=false`), chi tiết nạp theo yêu cầu ở `StoryDetailScreen`. Ảnh trang lấy từ `scenes[].imageUrl`; không có ảnh → khung giữ chỗ.
- **Generation:** `GenerationRunner` poll `GET /stories/:id/generation` mỗi 3 s, hiển thị đúng trạng thái BE (không tiến độ giả); dừng khi unmount, job tiếp tục ở BE.
- **Còn chờ duyệt:** `expo-secure-store` (C2), thư viện phát audio (C11); lối "Tự viết" và trình sửa trang/điểm dừng (C8) chưa làm.
