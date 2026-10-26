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
