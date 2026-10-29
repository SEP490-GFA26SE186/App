# API_INTEGRATION_STATUS_REPORT — StoryWeaver Mobile ↔ Backend

> Ngày audit: 2026-10-29 · Loại: **chỉ phân tích tĩnh mã nguồn** (không sửa code, không gọi API ghi).
> Mobile: `App` nhánh `refactor/mobile-frontend-cleanup` @ `08b26ef` · BE: `BE` nhánh `main` @ `b08a9f3` · Web: `Web` nhánh `main` @ `a6aeb5b`.
> Nguyên tắc: **BE có API ≠ Mobile đã nối ≠ đã E2E thật.** Mã nguồn là bằng chứng chính; tài liệu cũ chỉ để tham khảo.

---

## 1. Executive Summary

### 1.1 Đơn vị đếm

- **Endpoint** = một cặp (HTTP method, đường dẫn đầy đủ) duy nhất dưới `/api/v1`, lấy từ `BE/api/src/routes/v1/index.js` và các file `*.routes.js`. Không đếm Swagger (`/api/v1/docs`) và không đếm alias `/api/v1/content-library/ui-audio-assets/*` (cùng router với `/api/v1/ui-audio-assets/*`, [content-library.routes.js:46](../../../BE/api/src/modules/content-library/content-library.routes.js)).
- **Endpoint đã nối** = có hàm service Mobile gọi đúng method/path **và** hàm đó được một màn hình/store/interceptor đang hoạt động gọi tới. Nhiều màn cùng dùng một endpoint vẫn chỉ đếm 1.
- **Tính năng (workflow)** đếm riêng ở §1.3, không cộng lẫn với endpoint.

### 1.2 Số liệu endpoint (tổng 170)

| Hạng mục | Số endpoint |
|---|---:|
| Tổng endpoint BE tìm thấy | **170** |
| BE IMPLEMENTED | 169 |
| BE STUB (trả 501) | 1 — `POST /stories/:id/publish-version` |
| Mobile đã nối từ màn đang hoạt động | **63** |
| — trong đó REAL E2E VERIFIED (trong lần audit này) | **0** |
| — trong đó CONNECTED — NOT E2E VERIFIED | **63** |
| BE có sẵn, Mobile chưa nối (thuộc phạm vi Parent/Kid/Auth hiện tại) | **35** (gồm 2 endpoint đã có hàm service nhưng không ai gọi) |
| OUT OF MOBILE SCOPE (Marketplace/Seller/Payment, Admin & Specialist "Web only") | **71** |
| STUB/không dùng được | 1 |
| Kiểm tra cộng: 63 + 35 + 71 + 1 | = 170 ✔ |
| API Mobile cần nhưng BE **không có** | **3** (xem §7) |

> Ghi chú E2E: `MOBILE_STATUS.md` ghi "PASS (đã chạy thật)" cho một số luồng đọc (đăng nhập, Home overview, tủ sách Kid, PIN). Lần audit này **không** có BE chạy (`GET http://localhost:3000/api/v1/health` → không phản hồi) nên không xác minh lại được; các luồng đó được xếp **CONNECTED — NOT E2E VERIFIED (có ghi nhận PASS lịch sử)**. Admin/Specialist chỉ có **FIXTURE PASS** (fake BE) — không nâng lên E2E.

### 1.3 Số liệu tính năng (55 workflow ở §3: F01–F36, A1–A8, S1–S8, X1–X3)

| Trạng thái | Số workflow |
|---|---:|
| CONNECTED — REAL E2E VERIFIED | 0 |
| CONNECTED — NOT E2E VERIFIED | 35 |
| CONNECTED — PARTIAL | 5 |
| MOCK / HARDCODED (production code, chỉ hiện ở `__DEV__` hoặc không vào được) | 2 |
| BACKEND AVAILABLE — MOBILE NOT CONNECTED | 9 |
| BACKEND API MISSING | 1 (+2 nhu cầu không có API, ngoài phạm vi — §7) |
| BLOCKED (xác minh thật bị chặn bởi hạ tầng) | 3 (chồng lên trạng thái "CONNECTED", không đếm lại) |
| OUT OF MOBILE SCOPE | 3 (A8, S8, X3) |

### 1.4 Kết luận nhanh

1. **Không phát hiện lỗi contract nghiêm trọng (P0)** ở các endpoint Mobile đang gọi: method, path, payload, envelope và kiểm tra hình dạng response khớp BE ở mọi hàm đã đối chiếu (§8).
2. Khoảng trống lớn nhất của Parent là **tranh AI** (Mobile không bao giờ gửi `useAiImage`, không gọi `/images`), **gỡ truyện khỏi tủ sách** (hàm có nhưng không gọi), **giọng đọc server** (bỏ qua `audioUrl`, dùng TTS thiết bị) và **chỉnh sửa truyện** (nút "chưa hỗ trợ").
3. Admin/Specialist: 25 endpoint đã nối đúng contract; **chưa có bất kỳ bằng chứng E2E thật nào**; mọi thao tác ghi đều ảnh hưởng tiền/dữ liệu thật → chỉ test trên tài khoản QA.
4. Sinh truyện AI phụ thuộc Redis + worker + AI service + provider (Gemini/Claude, Cloudflare/Cloudinary/Supabase) → **BLOCKED** cho E2E đến khi hạ tầng bật.

---

## 2. Backend API Inventory

Prefix chung: `/api/v1` ([app.js:66](../../../BE/api/src/app.js)). Envelope: `{ success, message, data? }`; endpoint phân trang dùng `ApiResponse.paginated` → `{ success, message, data: [], pagination: { page, limit, total, totalPages } }` ([ApiResponse.js](../../../BE/api/src/utils/ApiResponse.js)). Lỗi: `{ success:false, message, errors[] }`.
Xác thực: `auth` = Bearer JWT phụ huynh/nhân sự, **từ chối token `kid_session` bằng 403** ([auth.middleware.js:21](../../../BE/api/src/middlewares/auth.middleware.js)); `kidAuth` = chỉ nhận token `kid_session` ([kidAuth.middleware.js:17](../../../BE/api/src/middlewares/kidAuth.middleware.js)).
Viết tắt cột Mobile: **C** = đã nối · **N** = chưa nối (trong phạm vi) · **O** = ngoài phạm vi Mobile · **S** = stub.

Đường dẫn BE dưới đây tương đối với `BE/api/src/modules/`.

### 2.1 Hệ thống & Auth

| ID | Method | Full Endpoint | Auth/Role | BE | Nguồn BE | Mobile |
|---|---|---|---|---|---|---|
| SYS-1 | GET | /api/v1/health | công khai | IMPLEMENTED | `routes/v1/index.js:33` | N |
| AU-1 | POST | /api/v1/auth/register | công khai | IMPLEMENTED | auth/auth.routes.js:9 | C |
| AU-2 | POST | /api/v1/auth/login | công khai | IMPLEMENTED | auth/auth.routes.js:10 | C |
| AU-3 | POST | /api/v1/auth/refresh-tokens | công khai (refreshToken) | IMPLEMENTED | auth/auth.routes.js:11 | C (interceptor) |
| AU-4 | POST | /api/v1/auth/logout | công khai (refreshToken) | IMPLEMENTED | auth/auth.routes.js:12 | C |
| AU-5 | GET | /api/v1/auth/me | auth | IMPLEMENTED | auth/auth.routes.js:13 | C |
| AU-6 | POST | /api/v1/auth/forgot-password | công khai | IMPLEMENTED (cần email: Brevo/SMTP) | auth/auth.routes.js:16 | N |
| AU-7 | POST | /api/v1/auth/reset-password | công khai | IMPLEMENTED | auth/auth.routes.js:17 | N |
| AU-8 | PUT | /api/v1/auth/change-password | auth | IMPLEMENTED | auth/auth.routes.js:18 | C |
| AU-9 | POST | /api/v1/auth/kid-pin/set | auth | IMPLEMENTED | auth/auth.routes.js:21 | C |
| AU-10 | PUT | /api/v1/auth/kid-pin/change | auth | IMPLEMENTED | auth/auth.routes.js:22 | C |
| AU-11 | POST | /api/v1/auth/kid-mode/enter | auth | IMPLEMENTED | auth/auth.routes.js:23 | C |
| AU-12 | POST | /api/v1/auth/kid-mode/exit | công khai (pin + kidSessionToken) | IMPLEMENTED | auth/auth.routes.js:24 | C |
| AU-13 | POST | /api/v1/auth/send-verification-email | auth | IMPLEMENTED (cần email) | auth/auth.routes.js:28 | N |
| AU-14 | POST | /api/v1/auth/verify-email | auth | IMPLEMENTED | auth/auth.routes.js:30 | N |

### 2.2 Parent — Hồ sơ bé, Nhân vật, EQ

| ID | Method | Full Endpoint | Auth/Role | BE | Nguồn BE | Mobile |
|---|---|---|---|---|---|---|
| CH-1 | POST | /api/v1/children | auth (chủ sở hữu) | IMPLEMENTED (giới hạn theo gói) | children/children.routes.js:12 | C |
| CH-2 | GET | /api/v1/children | auth | IMPLEMENTED | children/children.routes.js:12 | C |
| CH-3 | GET | /api/v1/children/:id | auth | IMPLEMENTED | children/children.routes.js:17 | N |
| CH-4 | PUT | /api/v1/children/:id | auth | IMPLEMENTED | children/children.routes.js:17 | C |
| CH-5 | DELETE | /api/v1/children/:id | auth | IMPLEMENTED | children/children.routes.js:17 | C |
| CH-6 | GET | /api/v1/children/:id/overview | auth | IMPLEMENTED | children/children.routes.js:23 | C |
| CH-7 | PUT | /api/v1/children/:id/avatar | auth | IMPLEMENTED | children/children.routes.js:27 | N |
| CH-8 | GET | /api/v1/children/:id/eq-report | auth | IMPLEMENTED | children/children.routes.js:31 | C |
| CH-9 | GET | /api/v1/children/:id/eq-journey | auth | IMPLEMENTED | children/children.routes.js:35 | N |
| CH-10 | GET | /api/v1/children/:id/bookshelf | auth | IMPLEMENTED | children/children.routes.js:39 | N |
| CH-11 | GET | /api/v1/children/:id/usage | auth | IMPLEMENTED | children/children.routes.js:43 | N |
| CR-1 | POST | /api/v1/characters | auth | IMPLEMENTED | characters/characters.routes.js:12 | C |
| CR-2 | GET | /api/v1/characters | auth | IMPLEMENTED | characters/characters.routes.js:12 | C |
| CR-3 | GET | /api/v1/characters/:id | auth | IMPLEMENTED | characters/characters.routes.js:17 | N |
| CR-4 | PUT | /api/v1/characters/:id | auth | IMPLEMENTED | characters/characters.routes.js:17 | C |
| CR-5 | DELETE | /api/v1/characters/:id | auth | IMPLEMENTED | characters/characters.routes.js:17 | C |
| CR-6 | POST | /api/v1/characters/:id/portrait | auth | IMPLEMENTED (AI ảnh, trừ credit) | characters/characters.routes.js:23 | N |
| EQ-1 | GET | /api/v1/eq-skills | công khai | IMPLEMENTED | eq-skills/eq-skills.routes.js:7 | N |
| EQ-2 | GET | /api/v1/eq-skills/:id | công khai | IMPLEMENTED | eq-skills/eq-skills.routes.js:8 | N |
| EQ-3 | GET | /api/v1/sub-skills | auth | IMPLEMENTED | sub-skills/sub-skills.routes.js:10 | N |
| EQ-4 | PUT | /api/v1/sub-skills/:id | specialist, admin | IMPLEMENTED | sub-skills/sub-skills.routes.js:11 | O |

### 2.3 Story / Library / AI / Bookshelf

| ID | Method | Full Endpoint | Auth/Role | BE | Nguồn BE | Mobile |
|---|---|---|---|---|---|---|
| ST-1 | GET | /api/v1/stories/ai-pricing | auth | IMPLEMENTED | stories/stories.routes.js:13 | C |
| ST-2 | POST | /api/v1/stories/analyze | parent | IMPLEMENTED (AI đồng bộ) | stories/stories.routes.js:15 | C |
| ST-3 | POST | /api/v1/stories | auth | IMPLEMENTED | stories/stories.routes.js:19 | C |
| ST-4 | GET | /api/v1/stories | auth | IMPLEMENTED (paginated, limit ≤100) | stories/stories.routes.js:19 | C |
| ST-5 | GET | /api/v1/stories/:id | auth | IMPLEMENTED | stories/stories.routes.js:24 | C |
| ST-6 | PUT | /api/v1/stories/:id | auth | IMPLEMENTED | stories/stories.routes.js:24 | N |
| ST-7 | DELETE | /api/v1/stories/:id | auth | IMPLEMENTED | stories/stories.routes.js:24 | N |
| ST-8 | PUT | /api/v1/stories/:id/cover | parent | IMPLEMENTED | stories/stories.routes.js:30 | N |
| ST-9 | PUT | /api/v1/stories/:id/characters | auth | IMPLEMENTED | stories/stories.routes.js:31 | N |
| ST-10 | POST | /api/v1/stories/:id/pages | auth | IMPLEMENTED | stories/stories.routes.js:34 | N |
| ST-11 | PUT | /api/v1/stories/:id/pages/:pageId | auth | IMPLEMENTED | stories/stories.routes.js:36 | N |
| ST-12 | DELETE | /api/v1/stories/:id/pages/:pageId | auth | IMPLEMENTED | stories/stories.routes.js:36 | N |
| ST-13 | POST | /api/v1/stories/:id/checkpoints | auth | IMPLEMENTED | stories/stories.routes.js:40 | N |
| ST-14 | PUT | /api/v1/stories/:id/checkpoints/:cpId | auth | IMPLEMENTED | stories/stories.routes.js:42 | N |
| ST-15 | DELETE | /api/v1/stories/:id/checkpoints/:cpId | auth | IMPLEMENTED | stories/stories.routes.js:42 | N |
| ST-16 | POST | /api/v1/stories/:id/review | auth | IMPLEMENTED (422 nếu chưa đủ điều kiện) | stories/stories.routes.js:46 | C |
| ST-17 | POST | /api/v1/stories/:id/narration/retry | auth | IMPLEMENTED (202, queue narration) | stories/stories.routes.js:47 | N |
| ST-18 | POST | /api/v1/stories/:id/publish-version | auth | **STUB 501** | stories/stories.routes.js:48 → stories/stories.controller.js:146 | S |
| ST-19 | POST | /api/v1/stories/:id/generate | auth | IMPLEMENTED (202, giữ credit, queue Redis) | stories/stories.routes.js:51 | C |
| ST-20 | POST | /api/v1/stories/:id/images | auth | IMPLEMENTED (202, trừ credit/ảnh) | stories/stories.routes.js:53 | N |
| ST-21 | POST | /api/v1/stories/:id/scenes/:sceneId/image | auth | IMPLEMENTED (202) | stories/stories.routes.js:54 | N |
| ST-22 | GET | /api/v1/stories/:id/generation | auth | IMPLEMENTED | stories/stories.routes.js:55 | C |
| TP-1 | GET | /api/v1/topics | auth | IMPLEMENTED (data = mảng) | topics/topics.routes.js:10 | C |
| TP-2 | POST | /api/v1/topics | specialist, admin | IMPLEMENTED | topics/topics.routes.js:11 | O |
| TP-3 | PUT | /api/v1/topics/:id | specialist, admin | IMPLEMENTED | topics/topics.routes.js:12 | O |
| TP-4 | DELETE | /api/v1/topics/:id | specialist, admin | IMPLEMENTED | topics/topics.routes.js:13 | O |
| BS-1 | GET | /api/v1/bookshelf | auth | IMPLEMENTED | bookshelf/bookshelf.routes.js:11 | N |
| BS-2 | POST | /api/v1/bookshelf | auth | IMPLEMENTED (idempotent, 422 nếu chưa sẵn sàng) | bookshelf/bookshelf.routes.js:12 | C |
| BS-3 | GET | /api/v1/bookshelf/check/:storyId | auth | IMPLEMENTED | bookshelf/bookshelf.routes.js:13 | N |
| BS-4 | DELETE | /api/v1/bookshelf/:storyId?childId= | auth | IMPLEMENTED | bookshelf/bookshelf.routes.js:14 | N (có hàm, không gọi) |

### 2.4 Kid Mode (kidAuth)

| ID | Method | Full Endpoint | Auth/Role | BE | Nguồn BE | Mobile |
|---|---|---|---|---|---|---|
| KD-1 | GET | /api/v1/kid/me | kid_session | IMPLEMENTED | kid/kid.routes.js:10 | N |
| KD-2 | GET | /api/v1/kid/bookshelf | kid_session | IMPLEMENTED | kid/kid.routes.js:11 | C |
| KD-3 | GET | /api/v1/kid/ui-audio | kid_session | IMPLEMENTED | kid/kid.routes.js:12 | N (có hàm, không gọi) |
| KD-4 | POST | /api/v1/kid/sessions | kid_session | IMPLEMENTED (201) | kid/kid.routes.js:13 | C |
| KD-5 | GET | /api/v1/kid/sessions/:sessionId | kid_session | IMPLEMENTED | kid/kid.routes.js:14 | N |
| KD-6 | PUT | /api/v1/kid/sessions/:sessionId/progress | kid_session | IMPLEMENTED | kid/kid.routes.js:15 | C |
| KD-7 | POST | /api/v1/kid/sessions/:sessionId/answers | kid_session | IMPLEMENTED (body `.strict()`) | kid/kid.routes.js:16 | C |
| KD-8 | POST | /api/v1/kid/sessions/:sessionId/complete | kid_session | IMPLEMENTED (idempotent) | kid/kid.routes.js:17 | C |

### 2.5 Gói, Credit, Thanh toán

| ID | Method | Full Endpoint | Auth/Role | BE | Nguồn BE | Mobile |
|---|---|---|---|---|---|---|
| PL-1 | GET | /api/v1/plans | công khai | IMPLEMENTED | plans/plans.routes.js:13 | C |
| PL-2 | GET | /api/v1/plans/:id | công khai | IMPLEMENTED | plans/plans.routes.js:14 | N |
| PL-3 | GET | /api/v1/subscriptions/me | auth | IMPLEMENTED | plans/plans.routes.js:20 | C |
| PL-4 | GET | /api/v1/subscriptions/me/credit-history | auth | IMPLEMENTED | plans/plans.routes.js:21 | C |
| PAY-1 | POST | /api/v1/payments/payos/webhook | công khai (payOS ký) | IMPLEMENTED | billing/billing.routes.js:9 | O |
| PAY-2 | POST | /api/v1/payments/plans/checkout | parent | IMPLEMENTED (payOS) | billing/billing.routes.js:11 | O |
| PAY-3 | GET | /api/v1/payments/orders/:orderId | auth | IMPLEMENTED | billing/billing.routes.js:12 | O |
| PAY-4 | GET | /api/v1/payments/orders | parent | IMPLEMENTED | admin/admin.routes.js:128 | O |
| PAY-5 | POST | /api/v1/payments/order-items/:itemId/refund | parent | IMPLEMENTED (lý do ≥10) | admin/admin.routes.js:129 | O |

### 2.6 Marketplace / Seller / Listings (toàn bộ OUT OF MOBILE SCOPE)

| ID | Method | Full Endpoint | Auth/Role | Nguồn BE |
|---|---|---|---|---|
| MK-1..5 | GET/GET/GET/GET/POST | /market/listings · /market/listings/:listingId · /market/sellers/:sellerId · /market/owned · /market/checkout | auth; owned/checkout = parent | market/market.routes.js:12-16 |
| MK-6..7 | GET/POST | /market/report-categories · /market/listings/:listingId/reports | auth; report = parent | monitoring/monitoring.routes.js:102-103 |
| MK-8..11 | GET/PUT/POST/POST | /market/listings/:listingId/reviews · /market/listings/:listingId/review · /market/reviews/:reviewId/reply · /market/reviews/:reviewId/reports | auth; ghi = parent | reviews/reviews.routes.js:14,20,36,43 |
| SL-1..3 | GET/POST/PUT | /sellers/me · /sellers/apply · /sellers/me | parent | publishing/publishing.routes.js:8-10 |
| SL-4..7 | GET/PUT/POST/DELETE | /sellers/me/earnings · /sellers/me/bank · /sellers/me/withdrawals · /sellers/me/withdrawals/:id | parent | market/withdrawals.routes.js:14,15,28,34 |
| SL-8..9 | GET/POST | /sellers/me/strikes · /sellers/me/strikes/:strikeId/appeal | parent | monitoring/monitoring.routes.js:121-122 |
| LS-1..3 | GET/POST/POST | /listings/mine · /listings · /listings/:listingId/versions | parent | publishing/publishing.routes.js:13-15 |

Tất cả IMPLEMENTED (28 endpoint, tính cả 5 PAY ở §2.5).

### 2.7 Admin (`authorize('admin')`)

| ID | Method | Full Endpoint | BE | Nguồn BE | Mobile |
|---|---|---|---|---|---|
| AD-1 | GET | /api/v1/admin/overview | IMPLEMENTED → `{ navBadges:{withdrawals,refunds,appeals} }` | admin/admin.routes.js:18 | C |
| AD-2 | GET | /api/v1/admin/accounts?role&status&search&page&limit | IMPLEMENTED | admin/admin.routes.js:21 | C |
| AD-3 | PATCH | /api/v1/admin/accounts/:userId `{isActive}` | IMPLEMENTED (khoá → thu hồi phiên) | admin/admin.routes.js:27 | C |
| AD-4 | POST | /api/v1/admin/accounts/moderators | IMPLEMENTED (201) | admin/admin.routes.js:33 | C |
| AD-5 | GET | /api/v1/admin/plans | IMPLEMENTED | admin/admin.routes.js:59 | O |
| AD-6 | POST | /api/v1/admin/plans | IMPLEMENTED | admin/admin.routes.js:60 | O |
| AD-7 | PUT | /api/v1/admin/plans/:planId | IMPLEMENTED | admin/admin.routes.js:76 | O |
| AD-8 | GET | /api/v1/admin/settings | IMPLEMENTED (cấu hình AI/credit) | admin/admin.routes.js:84 | O |
| AD-9 | PUT | /api/v1/admin/settings/:key | IMPLEMENTED | admin/admin.routes.js:85 | O |
| AD-10 | GET | /api/v1/admin/refunds?status (mặc định pending) | IMPLEMENTED | admin/admin.routes.js:93 | C |
| AD-11 | POST | /api/v1/admin/refunds/:refundId/decision | IMPLEMENTED | admin/admin.routes.js:99 | C |
| AD-12 | GET | /api/v1/admin/finance/summary?range | IMPLEMENTED | admin/admin.routes.js:107 | C |
| AD-13 | GET | /api/v1/admin/finance/reconciliation | IMPLEMENTED | admin/admin.routes.js:113 | O |
| AD-14 | POST | /api/v1/admin/finance/reconciliation/fix-counters | IMPLEMENTED | admin/admin.routes.js:114 | O |
| AD-15 | GET | /api/v1/admin/audit-logs?action&page&limit | IMPLEMENTED | admin/admin.routes.js:117 | C |
| AD-16 | GET | /api/v1/admin/withdrawals?status (mặc định requested) | IMPLEMENTED | market/withdrawals.routes.js:39 | C |
| AD-17 | POST | /api/v1/admin/withdrawals/:id/mark-paid | IMPLEMENTED | market/withdrawals.routes.js:45 | C |
| AD-18 | POST | /api/v1/admin/withdrawals/:id/reject | IMPLEMENTED | market/withdrawals.routes.js:51 | C |
| AD-19 | GET | /api/v1/admin/appeals?status (mặc định pending) | IMPLEMENTED | monitoring/monitoring.routes.js:131 | C |
| AD-20 | POST | /api/v1/admin/appeals/:appealId/decision | IMPLEMENTED | monitoring/monitoring.routes.js:138 | C |

### 2.8 Specialist / Moderation (`authorize('specialist','admin')`)

| ID | Method | Full Endpoint | BE | Nguồn BE | Mobile |
|---|---|---|---|---|---|
| MD-1 | GET | /api/v1/moderation/sellers?status | IMPLEMENTED → `{sellers}` | publishing/publishing.routes.js:20 | C |
| MD-2 | POST | /api/v1/moderation/sellers/:userId/decision `{approve}` | IMPLEMENTED | publishing/publishing.routes.js:21 | C |
| MD-3 | GET | /api/v1/moderation/submissions | IMPLEMENTED → `{queue}` | publishing/publishing.routes.js:22 | C |
| MD-4 | POST | /api/v1/moderation/submissions/:reviewId/claim | IMPLEMENTED (409 nếu người khác giữ) → chi tiết | publishing/publishing.routes.js:23 | C |
| MD-5 | GET | /api/v1/moderation/submissions/:reviewId | IMPLEMENTED → `{review,listing,seller,story,pageViews,progress}` | publishing/publishing.routes.js:24 | C |
| MD-6 | POST | /api/v1/moderation/submissions/:reviewId/pages/:pageId/view | IMPLEMENTED (phải đang giữ bài) | publishing/publishing.routes.js:25 | C |
| MD-7 | POST | /api/v1/moderation/submissions/:reviewId/decision | IMPLEMENTED (body strict) | publishing/publishing.routes.js:26 | C |
| MD-8 | GET | /api/v1/moderation/keywords | IMPLEMENTED | keywords/keywords.routes.js:22 | O |
| MD-9 | POST | /api/v1/moderation/keywords | IMPLEMENTED | keywords/keywords.routes.js:39 | O |
| MD-10 | POST | /api/v1/moderation/keywords/bulk | IMPLEMENTED | keywords/keywords.routes.js:53 | O |
| MD-11 | PUT | /api/v1/moderation/keywords/:id | IMPLEMENTED | keywords/keywords.routes.js:72 | O |
| MD-12 | DELETE | /api/v1/moderation/keywords/:id | IMPLEMENTED | keywords/keywords.routes.js:83 | O |
| MD-13 | GET | /api/v1/moderation/reports?status | IMPLEMENTED → `{groups}` | monitoring/monitoring.routes.js:22 | C |
| MD-14 | POST | /api/v1/moderation/reports/:reportId/dismiss | IMPLEMENTED | monitoring/monitoring.routes.js:28 | C |
| MD-15 | GET | /api/v1/moderation/listings?status | IMPLEMENTED | monitoring/monitoring.routes.js:35 | O |
| MD-16 | POST | /api/v1/moderation/listings/:listingId/suspend | IMPLEMENTED | monitoring/monitoring.routes.js:41 | C |
| MD-17 | GET | /api/v1/moderation/strikes | IMPLEMENTED | monitoring/monitoring.routes.js:48 | O |
| MD-18 | POST | /api/v1/moderation/strikes | IMPLEMENTED (201) | monitoring/monitoring.routes.js:54 | C |
| MD-19 | GET | /api/v1/moderation/audits | IMPLEMENTED | monitoring/monitoring.routes.js:70 | O |
| MD-20 | POST | /api/v1/moderation/audits/run | IMPLEMENTED | monitoring/monitoring.routes.js:76 | O |
| MD-21 | GET | /api/v1/moderation/ai-flags | IMPLEMENTED | monitoring/monitoring.routes.js:83 | O |
| MD-22 | POST | /api/v1/moderation/ai-flags/:userId/block | IMPLEMENTED | monitoring/monitoring.routes.js:89 | O |
| MD-23 | POST | /api/v1/moderation/product-reviews/:reviewId/hide | IMPLEMENTED | reviews/reviews.routes.js:57 | C |
| CK-1..5 | GET/GET/POST/POST/DELETE | /checkpoint-review/stats · /checkpoint-review · /:checkpointId/ok · /:checkpointId/flag · /:checkpointId/flag | IMPLEMENTED | checkpoint-review/checkpoint-review.routes.js:9-13 | O |
| PD-1..2 | GET/PUT | /pedagogy/report-settings | IMPLEMENTED | pedagogy-settings/pedagogy-settings.routes.js:10-11 | O |
| QT-1..7 | GET/POST/PUT/POST/PUT/POST/DELETE | /question-templates · /:id · /:id/duplicate · /:id/draft · /:id/publish · /:id | IMPLEMENTED | question-templates/question-templates.routes.js:9-15 | O |
| UA-1..6 | GET/POST/GET/GET/PUT/DELETE | /ui-audio-assets · /by-key/:key · /:id (GET công khai; ghi = specialist/admin) | IMPLEMENTED | content-library/content-library.routes.js:15-35 | O |
| CL-1 | GET | /api/v1/content-library/stats | IMPLEMENTED | content-library/content-library.routes.js:43 | O |

### 2.9 Không phải REST công khai

- **AI service (Python FastAPI, `BE/ai`)**: `/health`, `/ready`, `/analyze`, `/generate`, `/portrait`, `/scene`, `/synthesize` — dịch vụ nội bộ, bảo vệ bằng `internal_token`, chỉ `BE/api` gọi qua `clients/aiClient.js`. **Mobile không được gọi trực tiếp.**
- **Queue/worker**: BullMQ trên Redis (`queues/ai.queue.js`, `queues/narration.queue.js`, `workers/ai.processor.js`, `workers/narration.processor.js`). Không có HTTP route.

---

## 3. Mobile API Integration Matrix

Đường dẫn Mobile tương đối với `App/apps/mobile/src/`. Tất cả "NOT E2E" = chưa có bằng chứng E2E thật trong lần audit này.

### 3.1 Auth & phiên

| ID | Role | Màn / UI Action | Mobile Service | Method/Endpoint | BE Match | Integration Status | Evidence |
|---|---|---|---|---|---|---|---|
| F01 | Mọi role | LoginScreen → Đăng nhập | `authService.login` (services/authService.ts:54) | POST /auth/login | ✔ AU-2 | CONNECTED — NOT E2E (PASS lịch sử) | screens/auth/LoginScreen.tsx:75 |
| F02 | Parent | RegisterScreen → Đăng ký | `authService.register` (:94) | POST /auth/register | ✔ AU-1 | CONNECTED — NOT E2E | screens/auth/RegisterScreen.tsx:72 |
| F03 | Mọi role | Khởi động/refresh credit | `authService.getMe` (:128) | GET /auth/me | ✔ AU-5 | CONNECTED — NOT E2E | stores/useAuthSession.ts:70, navigation/ParentTabs.tsx:69 |
| F04 | Mọi role | 401 tự làm mới | `refreshAccessToken` (services/apiClient.ts:74) | POST /auth/refresh-tokens | ✔ AU-3 | CONNECTED — NOT E2E | apiClient.ts:170 |
| F05 | Mọi role | Đăng xuất | `authService.logout` (:160) | POST /auth/logout | ✔ AU-4 | CONNECTED — NOT E2E | navigation/AppNavigator.tsx:45 |
| F06 | Parent | Cài đặt → Đổi mật khẩu | `authService.changePassword` (:193) | PUT /auth/change-password | ✔ AU-8 | CONNECTED — NOT E2E | screens/parent/SettingsScreen.tsx:86 |
| F07 | Parent | Đặt/đổi PIN | `setKidPin` (:207), `changeKidPin` (:219) | POST /auth/kid-pin/set, PUT /auth/kid-pin/change | ✔ AU-9/10 | CONNECTED — NOT E2E (PASS lịch sử) | components/auth/AuthModal.tsx:68, SettingsScreen.tsx:119 |
| F08 | Parent→Kid | Vào/thoát Chế độ Bé | `enterKidMode` (:230), `exitKidMode` (:264) | POST /auth/kid-mode/enter, /exit | ✔ AU-11/12 | CONNECTED — NOT E2E (PASS lịch sử) | stores/useKidSession.ts:31,42; screens/kid/KidModeScreen.tsx:89 |
| F09 | Parent | Quên mật khẩu / xác thực email | — | AU-6, AU-7, AU-13, AU-14 | BE có | BACKEND AVAILABLE — MOBILE NOT CONNECTED | không có service/màn |

### 3.2 Parent

| ID | Màn / UI Action | Mobile Service | Method/Endpoint | BE Match | Integration Status | Evidence |
|---|---|---|---|---|---|---|
| F10 | Tải dữ liệu phụ huynh (bé, nhân vật, truyện, chủ đề) | `childService.getChildren`, `characterService.getCharacters`, `storyService.getStories`, `storyService.getTemplates` | GET /children, /characters, /stories?page&limit=100, /topics | ✔ CH-2, CR-2, ST-4, TP-1 | CONNECTED — NOT E2E | stores/useParentData.ts:46-49 |
| F11 | Home → hero số liệu | `childService.getChildOverview` (services/childService.ts:64) | GET /children/:id/overview | ✔ CH-6 | CONNECTED — NOT E2E (PASS lịch sử) | screens/parent/ParentHomeScreen.tsx:95 |
| F12 | Bé nhà mình (thêm/sửa/xoá) | `createChild` (:30), `updateChild` (:42), `deleteChild` (:54) | POST/PUT/DELETE /children[/:id] | ✔ CH-1/4/5 | CONNECTED — PARTIAL (thiếu avatar CH-7, usage CH-11) | components/parent/ChildFormSheet.tsx:62; screens/parent/ChildrenScreen.tsx:65 |
| F13 | Nhân vật gia đình (CRUD) | `characterService.create/update/delete` (services/characterService.ts:20,29,38) | POST/PUT/DELETE /characters[/:id] | ✔ CR-1/4/5 | CONNECTED — PARTIAL (thiếu vẽ chân dung CR-6) | components/parent/CharacterFormSheet.tsx:63,68; screens/parent/CharactersScreen.tsx:71 |
| F14 | Báo cáo EQ | `getChildEqReport` (childService.ts:73) | GET /children/:id/eq-report | ✔ CH-8 | CONNECTED — NOT E2E | screens/parent/EqReportScreen.tsx:53 |
| F15 | Hành trình EQ theo tuần | — | GET /children/:id/eq-journey | BE có | BACKEND AVAILABLE — MOBILE NOT CONNECTED | Web có gọi; Mobile không |
| F16 | Ví & Credit (chỉ xem) | `billingService.getPlans/getSubscription/getCreditHistory` (services/billingService.ts:8,15,22) | GET /plans, /subscriptions/me, /subscriptions/me/credit-history | ✔ PL-1/3/4 | CONNECTED — NOT E2E | screens/parent/WalletScreen.tsx:92,93,115 |
| F17 | Thư viện truyện + lọc | `storyService.getStories` | GET /stories | ✔ ST-4 | CONNECTED — NOT E2E | screens/parent/LibraryScreen.tsx (qua useParentData) |
| F18 | Chi tiết truyện + "Đã xem lại" | `getStory` (storyService.ts:56), `reviewStory` (:109) | GET /stories/:id, POST /stories/:id/review | ✔ ST-5/16 | CONNECTED — PARTIAL (chỉnh sửa trang → "chưa hỗ trợ"; không xoá truyện, đổi bìa, thử lại giọng đọc) | screens/parent/StoryDetailScreen.tsx:70,106,236 |
| F19 | Đưa truyện lên tủ sách bé | `storyService.addToShelf` (:116) | POST /bookshelf `{childId,storyId}` | ✔ BS-2 | CONNECTED — PARTIAL (thêm được; **không có gỡ/xem tủ**) | navigation/ParentTabs.tsx:76; StoryDetailScreen.tsx:120 |
| F20 | Gỡ truyện khỏi tủ sách | `storyService.removeFromShelf` (:125) — **không nơi nào gọi** | DELETE /bookshelf/:storyId?childId | ✔ BS-4 | BACKEND AVAILABLE — MOBILE NOT CONNECTED | grep: 0 call site |
| F21 | Xem tủ sách của từng bé (phía phụ huynh) | — | GET /children/:id/bookshelf (hoặc GET /bookshelf, /bookshelf/check/:storyId) | BE có | BACKEND AVAILABLE — MOBILE NOT CONNECTED | Web gọi `/children/:id/bookshelf`, `/bookshelf/check/:id` |
| F22 | Trình đọc phụ huynh | không gọi API (dùng dữ liệu `getStory`) + TTS thiết bị `expo-speech` | — | — | CONNECTED — PARTIAL (dữ liệu có; giọng đọc server không dùng) | components/parent/StoryReaderModal.tsx; `audioNarrationUrl` được map ở storyService.ts:173 nhưng không màn nào đọc |

### 3.3 Story Wizard / AI

| ID | Màn / UI Action | Mobile Service | Method/Endpoint | BE Match | Integration Status | Evidence |
|---|---|---|---|---|---|---|
| F23 | Wizard: hiện giá credit | `getAiPricing` (storyService.ts:88) | GET /stories/ai-pricing | ✔ ST-1 | CONNECTED — NOT E2E | screens/parent/StoryWizard.tsx:109 |
| F24 | Wizard "Chuyện mẫu" → tạo + sinh | `createStory` (:63) → `startGeneration` (:95) | POST /stories `{entry:'topic',topicId,length,title,characters,useTts}` → POST /stories/:id/generate | ✔ ST-3/19 | CONNECTED — NOT E2E · **BLOCKED** (AI infra) | StoryWizard.tsx:221-229; components/parent/GenerationRunner.tsx:91 |
| F25 | Wizard "Kể chuyện nhà mình" → phân tích → tạo | `analyze` (:73) → `createStory` | POST /stories/analyze → POST /stories `{entry:'family',situation,analysisToken,scored:true,…}` | ✔ ST-2/3 | CONNECTED — NOT E2E · **BLOCKED** (AI infra) | StoryWizard.tsx:231-256 |
| F26 | Theo dõi tiến độ sinh, 402/failed/blocked | `getGeneration` (:102), poll 3 s | GET /stories/:id/generation | ✔ ST-22 | CONNECTED — NOT E2E · **BLOCKED** | GenerationRunner.tsx:49-104 |
| F27 | Wizard "Tự viết" (handwritten) | — | POST /stories `{length:'custom', entry:'handwritten'}` + ST-10..15 | BE có | BACKEND AVAILABLE — MOBILE NOT CONNECTED | MOBILE_STATUS: "Tự viết = chưa hỗ trợ" |
| F28 | Tranh AI cho truyện / vẽ lại cảnh | — (Mobile không gửi `useAiImage`, BE mặc định `false`) | POST /stories/:id/images, POST /stories/:id/scenes/:sceneId/image | BE có | BACKEND AVAILABLE — MOBILE NOT CONNECTED | StoryWizard.tsx:221-256 không có `useAiImage`; BE stories.validation.js:66 `default(false)` |
| F29 | Giọng đọc server (narration) | — | `audioUrl` trong GET /stories/:id và POST /kid/sessions; POST /stories/:id/narration/retry | BE có | BACKEND AVAILABLE — MOBILE NOT CONNECTED | Mobile gửi `useTts` (mặc định BE `true`) nhưng không phát `audioUrl` |
| F30 | Chỉnh sửa trang / điểm dừng / bìa / nhân vật / xoá truyện | — (nút "Chỉnh sửa (chưa hỗ trợ)") | ST-6..15 | BE có | BACKEND AVAILABLE — MOBILE NOT CONNECTED | StoryDetailScreen.tsx:236 |

### 3.4 Kid

| ID | Màn / UI Action | Mobile Service | Method/Endpoint | BE Match | Integration Status | Evidence |
|---|---|---|---|---|---|---|
| F31 | Tủ sách của bé | `kidService.getShelf` (services/kidService.ts:14) | GET /kid/bookshelf | ✔ KD-2 | CONNECTED — NOT E2E (PASS lịch sử) | screens/kid/useKidReader.ts:46 |
| F32 | Mở truyện / đọc tiếp | `startReading` (:24) | POST /kid/sessions `{storyId}` | ✔ KD-4 | CONNECTED — NOT E2E (MOBILE_STATUS §7: NOT RUN) | useKidReader.ts:89 |
| F33 | Lưu trang | `saveProgress` (:36) | PUT /kid/sessions/:id/progress `{pageId}` | ✔ KD-6 | CONNECTED — NOT E2E | useKidReader.ts:78 |
| F34 | Trả lời điểm dừng EQ | `answer` (:47) | POST /kid/sessions/:id/answers (đúng 6 trường strict) | ✔ KD-7 | CONNECTED — NOT E2E | components/kid/KidCheckpointCard.tsx:59, useKidReader.ts:167 |
| F35 | Hoàn thành lượt đọc | `complete` (:67) | POST /kid/sessions/:id/complete | ✔ KD-8 | CONNECTED — NOT E2E | useKidReader.ts:117-189 |
| F36 | Câu đọc giao diện (tên cảm xúc) | `getUiAudio` (:72) — **không nơi nào gọi** | GET /kid/ui-audio | ✔ KD-3 | BACKEND AVAILABLE — MOBILE NOT CONNECTED | grep: 0 call site |

### 3.5 Admin (`navigation/AdminNavigator.tsx`)

| ID | Màn / UI Action | Mobile Service (services/adminService.ts) | Method/Endpoint | BE Match | Integration Status | Evidence |
|---|---|---|---|---|---|---|
| A1 | Badge việc chờ | `getOverview` (:38) | GET /admin/overview | ✔ AD-1 | CONNECTED — NOT E2E (FIXTURE PASS) | navigation/AdminNavigator.tsx:29 |
| A2 | Dashboard tài chính | `getFinanceSummary` (:45) | GET /admin/finance/summary?range | ✔ AD-12 | CONNECTED — NOT E2E (FIXTURE PASS) | screens/admin/AdminDashboardScreen.tsx:109 |
| A3 | Tài khoản: lọc/tìm/khoá/tạo Chuyên gia | `getAccounts` (:52), `setAccountActive` (:59), `createSpecialist` (:63) | GET /admin/accounts, PATCH /admin/accounts/:userId, POST /admin/accounts/moderators | ✔ AD-2/3/4 | CONNECTED — NOT E2E (FIXTURE PASS) | screens/admin/AccountsScreen.tsx:54,101,113 |
| A4 | Rút tiền người bán | `getWithdrawals` (:67), `markWithdrawalPaid` (:70), `rejectWithdrawal` (:73) | AD-16/17/18 | ✔ | CONNECTED — NOT E2E (FIXTURE PASS) | screens/admin/WithdrawalsScreen.tsx:29,47,53 |
| A5 | Hoàn tiền | `getRefunds` (:76), `decideRefund` (:79) | AD-10/11 | ✔ | CONNECTED — NOT E2E (FIXTURE PASS) | screens/admin/RefundsScreen.tsx:56,102 |
| A6 | Kháng nghị cảnh cáo | `getAppeals` (:83), `decideAppeal` (:86) | AD-19/20 | ✔ | CONNECTED — NOT E2E (FIXTURE PASS) | screens/admin/AppealsScreen.tsx:31,54 |
| A7 | Nhật ký kiểm toán | `getAuditLogs` (:90) | GET /admin/audit-logs?action&page | ✔ AD-15 | CONNECTED — NOT E2E (FIXTURE PASS) | screens/admin/AuditLogsScreen.tsx:20 |
| A8 | Gói & định giá, Cấu hình AI, Đối soát | — | AD-5..9, AD-13/14 | BE có | OUT OF MOBILE SCOPE ("WEB ONLY") | ADMIN_SPECIALIST_MOBILE_IMPLEMENTATION.md §2 |

### 3.6 Specialist (`navigation/SpecialistNavigator.tsx`)

| ID | Màn / UI Action | Mobile Service (services/moderationService.ts) | Method/Endpoint | BE Match | Integration Status | Evidence |
|---|---|---|---|---|---|---|
| S1 | Hàng chờ duyệt | `getQueue` (:25) | GET /moderation/submissions | ✔ MD-3 | CONNECTED — NOT E2E (FIXTURE PASS) | navigation/SpecialistNavigator.tsx:21 |
| S2 | Xem / nhận bài | `getReview` (:29), `claimReview` (:31) | GET …/:reviewId, POST …/:reviewId/claim | ✔ MD-4/5 | CONNECTED — NOT E2E (FIXTURE PASS) | screens/specialist/ReviewWorkspaceScreen.tsx:67,151 |
| S3 | Đánh dấu đã xem trang (+ nhận xét) | `viewPage` (:33) | POST …/pages/:pageId/view `{comment?}` | ✔ MD-6 | CONNECTED — NOT E2E (FIXTURE PASS) | ReviewWorkspaceScreen.tsx:204 |
| S4 | Quyết định duyệt | `decide` (:39) | POST …/decision `{decision,comment?,issueStrike?}` | ✔ MD-7 | CONNECTED — NOT E2E (FIXTURE PASS) | ReviewWorkspaceScreen.tsx:120 |
| S5 | Trả bài (release claim) | — | **không có** | ✘ | BACKEND API MISSING | grep `release|unclaim` trong publishing/: 0 kết quả; claim chỉ hết hạn theo thời gian |
| S6 | Hồ sơ người bán | `getSellerApplications` (:43), `decideSeller` (:46) | MD-1/2 | ✔ | CONNECTED — NOT E2E (FIXTURE PASS) | screens/specialist/SellerApplicationsScreen.tsx:26,37 |
| S7 | Báo cáo vi phạm: bỏ qua / tạm gỡ / cảnh cáo / ẩn đánh giá | `getReportGroups` (:49), `dismissReport` (:52), `suspendListing` (:54), `issueStrike` (:56), `hideProductReview` (:58) | MD-13/14/16/18/23 | ✔ | CONNECTED — NOT E2E (FIXTURE PASS) | screens/specialist/ReportsScreen.tsx:31,42,49,57,60 |
| S8 | Truyện tạm gỡ, danh sách cảnh cáo, kiểm tra ngẫu nhiên, cờ AI, từ khoá chặn, mẫu câu hỏi, kỹ năng con, chủ đề, tham số báo cáo, soát điểm dừng | — | MD-8..12, 15, 17, 19..22; CK, PD, QT, TP-2..4, EQ-4, UA, CL | BE có | OUT OF MOBILE SCOPE ("WEB ONLY") | ADMIN_SPECIALIST_MOBILE_IMPLEMENTATION.md §2 |

### 3.7 Phạm vi chờ (SCOPE PENDING)

| ID | Màn | Trạng thái | Evidence |
|---|---|---|---|
| X1 | Chợ truyện (`screens/scope-pending/MarketplaceScreen.tsx`) | MOCK / HARDCODED + OUT OF SCOPE — chỉ hiện ở `__DEV__`; không gọi `/market/*`; lọc truyện của chính phụ huynh theo `status === 'PUBLISHED'` (BE không bao giờ trả trạng thái này → luôn rỗng); `onStoryPurchased={() => {}}` | MarketplaceScreen.tsx:37-45; navigation/ParentTabs.tsx:107, 224-232 |
| X2 | Seller Dashboard (`screens/scope-pending/SellerDashboard.tsx`) | MOCK / HARDCODED + OUT OF SCOPE — chỉ render khi `activeRole === 'SELLER'`, nhưng `HeyTopBar` không bao giờ gọi `onRoleChange` → không vào được; "Gửi duyệt" = hộp thoại "Chưa hỗ trợ" | navigation/ParentTabs.tsx:267-275; components/parent/HeyTopBar.tsx:18 |
| X3 | Nạp credit / mua gói | OUT OF MOBILE SCOPE (ADR-011); BE chỉ có mua gói qua payOS (PAY-2), không có API "gói credit lẻ" | services/billingService.ts:2 |

---

## 4. APIs Already Connected

Toàn bộ 63 endpoint dưới đây: **CONNECTED — NOT E2E VERIFIED** (không có cái nào REAL E2E VERIFIED trong lần audit này).

| Nhóm | Endpoint (ID §2) | Ghi chú bằng chứng |
|---|---|---|
| Authentication (10) | AU-1, 2, 3, 4, 5, 8, 9, 10, 11, 12 | AU-2/5/9/11/12: PASS lịch sử trong MOBILE_STATUS (R3–R5), chưa xác minh lại |
| Parent (13) | CH-1, 2, 4, 5, 6, 8; CR-1, 2, 4, 5; PL-1, 3, 4 | CH-6 PASS lịch sử (R5); CRUD "NOT RUN" theo MOBILE_STATUS |
| Story / Library (6) | ST-4, 5, 16; BS-2; TP-1; ST-1 | |
| AI (4) | ST-2, 3, 19, 22 | BLOCKED cho E2E: cần Redis + worker + AI service |
| Kid (5) | KD-2, 4, 6, 7, 8 | KD-2 PASS lịch sử; Reader thật NOT RUN (MOBILE_STATUS §7) |
| EQ | (CH-8 đã tính ở Parent) | |
| Admin (13) | AD-1, 2, 3, 4, 10, 11, 12, 15, 16, 17, 18, 19, 20 | chỉ FIXTURE PASS |
| Specialist (12) | MD-1, 2, 3, 4, 5, 6, 7, 13, 14, 16, 18, 23 | chỉ FIXTURE PASS |

---

## 5. APIs Not Yet Connected (trong phạm vi Mobile)

| Feature | Available BE API | Missing Mobile Connection | Priority | Recommended Next Step |
|---|---|---|---|---|
| Gỡ truyện khỏi tủ sách bé | BS-4 `DELETE /bookshelf/:storyId?childId=` | `storyService.removeFromShelf` có sẵn (storyService.ts:125) nhưng không màn nào gọi | P1 | Thêm nút "Gỡ khỏi tủ" ở StoryDetailScreen, xác nhận trước khi gọi |
| Xem tủ sách từng bé / trạng thái "đã lên tủ" | CH-10 `GET /children/:id/bookshelf`, BS-3 `GET /bookshelf/check/:storyId` | không có service | P1 | Thêm `childService.getChildBookshelf`; dùng để hiện trạng thái nút thêm/gỡ |
| Tranh AI | ST-20, ST-21; trường `useAiImage` của ST-3 | Wizard không gửi `useAiImage`; không có nút vẽ tranh | P1 | Thêm tuỳ chọn "Có tranh" (hiện giá từ `ai-pricing.images`) + nút "Vẽ tranh" ở chi tiết; xử lý 402/409 |
| Giọng đọc server | `audioUrl` (GET /stories/:id, POST /kid/sessions); ST-17 retry | Reader không phát `audioUrl`; không có nút thử lại | P2 | Phát `audioUrl` khi có, fallback TTS thiết bị; nút "Tạo lại giọng đọc" |
| Vẽ chân dung nhân vật | CR-6 | không có service | P2 | Nút "Vẽ chân dung" ở CharacterFormSheet; poll `portraitStatus` |
| Chỉnh sửa truyện | ST-6..15 | nút "chưa hỗ trợ" | P2 | Bắt đầu với ST-11 (sửa chữ trang) và ST-7 (xoá truyện) |
| Truyện tự viết | ST-3 (`length:'custom'`) + ST-10..15 | Wizard không có lối "Tự viết" | P3 | Phụ thuộc editor (hàng trên) |
| Hành trình EQ | CH-9 | không có service | P2 | Thêm biểu đồ tuần ở EqReportScreen |
| Thời lượng dùng / avatar bé | CH-11, CH-7 | không có service | P3 | |
| Quên mật khẩu / xác thực email | AU-6, 7, 13, 14 | không có màn | P2 | Màn "Quên mật khẩu" (cần BE cấu hình email) |
| Câu đọc giao diện Kid | KD-3 | `kidService.getUiAudio` có, không gọi | P3 | Gọi khi vào Kid Mode, cache; phát âm thanh khi chốt thư viện audio |
| Khôi phục phiên đọc / hồ sơ Kid | KD-1, KD-5 | không có service | P3 | Chỉ cần nếu muốn khôi phục sau khi app bị kill |
| Danh mục kỹ năng | EQ-1..3 | `analyze` hỗ trợ `subSkillIds` nhưng Mobile không chọn | P3 | Tuỳ chọn |
| Chi tiết gói / health | PL-2, SYS-1 | — | P3 | SYS-1 hữu ích cho màn "Kiểm tra máy chủ" ở `__DEV__` |

---

## 6. Mobile Mock / Fixture Audit

### 6.1 Mock/hardcode trong code production

| Vị trí | Mô tả | Có lọt vào production build? |
|---|---|---|
| src/screens/scope-pending/MarketplaceScreen.tsx:37-45 | Mảng chủ đề cứng; danh sách lấy từ truyện riêng của phụ huynh lọc `PUBLISHED` (không có thật) | Lối vào chỉ hiện khi `__DEV__` (navigation/ParentTabs.tsx:107) → **không** |
| src/screens/scope-pending/SellerDashboard.tsx | Màn người bán dựng từ `data.stories`, không có API seller | Không vào được (không có nơi set `activeRole='SELLER'`) |
| navigation/ParentTabs.tsx:48 `notSupported` | Hộp thoại "Chưa hỗ trợ" — không giả thành công | Có (đúng chủ đích, không phải mock) |
| screens/parent/StoryDetailScreen.tsx:236 | Nút "Chỉnh sửa (chưa hỗ trợ)" | Có (đúng chủ đích) |
| services/authService.ts:306 | `createdAt: raw.createdAt \|\| new Date().toISOString()` — tự điền ngày tạo nếu BE thiếu | Có; ảnh hưởng thấp |

Không tìm thấy fallback mock trong service: mọi service throw `ApiError`/`invalidResponseError` khi BE lỗi hoặc sai hình dạng (ADR-008). Hằng `constants/story.ts` (`AI_LENGTHS`, số trang 6/8/10) và `constants/management.ts` (`REVIEW_CHECKLIST`, nhãn trạng thái) là hằng UI, giá credit vẫn lấy từ BE (`/stories/ai-pricing`).

### 6.2 Fixture chỉ dùng cho dev/test (không tính là thiếu tích hợp)

| Vị trí | Cách cô lập |
|---|---|
| src/dev/demo/demoData.ts, src/dev/demo/curatedStories.ts | Chỉ `src/dev/preview/KidPreview.tsx` import; App.tsx:19 nạp `KidPreview` bằng `require` trong `__DEV__` |
| apps/mobile/tests/*.test.ts (10 file) | Test đơn vị/fixture; không nằm trong bundle app |
| Fake BE cho QA Admin/Specialist | Ngoài repo (theo ADMIN_SPECIALIST_MOBILE_IMPLEMENTATION.md:63) → chỉ FIXTURE PASS |

---

## 7. APIs Missing or Incomplete on Backend

| # | Nhu cầu Mobile | Tình trạng BE | Ảnh hưởng |
|---|---|---|---|
| M1 | Specialist **trả bài** đang giữ (release claim) | **Không có route**; claim chỉ hết hạn (`claimExpiresAt`) | Specialist lỡ nhận bài phải chờ hết hạn; Mobile không chặn được luồng chính → P3 (đề xuất BE) |
| M2 | Đăng bán phiên bản truyện | `POST /stories/:id/publish-version` → **501** (stories.controller.js:146); luồng thật dùng `POST /listings` | Ngoài phạm vi Mobile hiện tại |
| M3 | Nạp credit lẻ / gói credit | **Không có API**; chỉ có mua gói tháng/năm qua payOS (PAY-2) | Ngoài phạm vi (ADR-011); Ví Mobile chỉ xem |

Không phải "thiếu BE": tranh AI, giọng đọc, editor, tự viết, EQ journey, quên mật khẩu — BE đều có, chỉ Mobile chưa nối (§5).

---

## 8. API Contract Mismatches

Đã đối chiếu từng hàm service Mobile với validation (zod) và response của BE. **Không có mismatch P0** (sai path, sai method, thiếu trường bắt buộc, sai envelope). Các điểm cần chú ý:

| # | Mobile | BE | Kỳ vọng | Hành vi hiện tại | Mức | Sửa tối thiểu đề xuất |
|---|---|---|---|---|---|---|
| C1 | screens/parent/StoryWizard.tsx:221-256 (payload `createStory`) | stories/stories.validation.js:66 `useAiImage: default(false)`; kid/lib/play.js:130 chỉ trả `imageUrl` khi `useAiImage` | Truyện muốn có tranh phải gửi `useAiImage:true` hoặc gọi `/images` | Không gửi → mọi truyện tạo từ Mobile **không có tranh**; KidReader luôn hiện nền trống | MEDIUM (khoảng trống chức năng, không phải lỗi request) | Thêm tuỳ chọn `useAiImage` + hiển thị chi phí; hoặc nút "Vẽ tranh" gọi ST-20 |
| C2 | services/storyService.ts:173 `audioNarrationUrl`; components/parent/StoryReaderModal.tsx | stories (page `audioUrl`), kid/lib/play.js:128 | BE sinh giọng đọc (useTts mặc định `true`) | Mobile bỏ qua `audioUrl`, đọc bằng `expo-speech` → BE vẫn sinh audio (tốn tài nguyên) mà không dùng | MEDIUM | Phát `audioUrl` khi có |
| C3 | screens/scope-pending/MarketplaceScreen.tsx:45 | Trạng thái truyện BE: draft/generating/ready (`STORY_STATUSES`) | — | Lọc `status === 'PUBLISHED'` không bao giờ khớp | LOW (chỉ `__DEV__`) | Giữ nguyên tới khi chốt phạm vi; nếu mở lại phải dùng `/market/listings` |
| C4 | services/storyService.ts:34 `MAX_PAGES = 10` | ST-4 limit ≤100 | Đọc hết danh sách | Cắt im lặng ở 1.000 truyện | LOW | Ghi log/hiện cảnh báo khi chạm giới hạn |
| C5 | types/management.ts:73 `WithdrawalStatus = requested\|paid\|rejected` | market/withdrawals.routes.js:42 enum có thêm `processing`, `cancelled` | Lọc đủ trạng thái | Admin không xem được yêu cầu `processing`/`cancelled` | LOW | Thêm 2 giá trị vào kiểu + chip lọc |
| C6 | services/adminService.ts:21 `toQuery` bỏ giá trị `'all'` | AD-10, AD-19 mặc định `pending` (không phải `all`) | Nếu UI chọn "Tất cả" phải gửi `status=all` | Hiện **không** gây lỗi vì RefundsScreen/AppealsScreen không có tab "all"; sẽ thành lỗi nếu thêm tab "all" | LOW (rủi ro tiềm ẩn) | Ghi chú tại `toQuery` hoặc gửi `status` tường minh như `getReportGroups` (moderationService.ts:49) |
| C7 | services/authService.ts:306 | AU-5 trả `createdAt` | Không bịa dữ liệu | Thiếu `createdAt` → điền thời điểm hiện tại | LOW | Để `null` |
| C8 | services/apiClient.ts:201 `kidFetch` | kidAuth trả 401 (phiên mất) / 403 (sai loại token) | — | Không tự refresh (đúng: kid session không refresh được); màn xử lý 401 ở useKidReader.ts:11, KidModeScreen.tsx:66. 403 không được coi là "mất phiên" | LOW | Cân nhắc coi 403 từ `/kid/*` như mất phiên |

Đã xác nhận khớp (không phải lỗi): `/stories` dùng `raw:true` đọc `pagination` top-level (storyService.ts:46 ↔ stories.controller.js:22); `/topics` trả mảng (topics.service ↔ storyService.ts:135); `kid answers` gửi đúng 6 trường cho schema `.strict()` (kid.validation.js:20); `decision` không gửi checklist cho schema strict (publishing.validation.js:54-62); `viewPage` gửi `{}` khi không có nhận xét (BE `.default({})`); claim/view/decision đều trả chi tiết `getReview` (publishing.service.js:389, 490) khớp `detailOrThrow`; `exitKidMode` gửi `kidSessionToken` trong body với `skipAuth` (auth.validation.js:102); `admin/overview → navBadges` (admin.service.js:26).

Xung đột Web ↔ BE đã biết (không phải lỗi Mobile): Web cho "Đã chuyển trả — duyệt" hoàn tiền khi trống mã giao dịch, BE trả 422; Mobile chặn trước (ADMIN_SPECIALIST_MOBILE_IMPLEMENTATION.md:22). Web **không** gọi `/admin/withdrawals` và `/admin/appeals` qua service (gọi trực tiếp trong trang) — Mobile đối chiếu thẳng BE.

---

## 9. API Authentication and Role Matrix

| Nhóm endpoint | Không token | Parent token | Kid token (`kid_session`) | Specialist | Admin |
|---|---|---|---|---|---|
| AU-1/2/3/4/6/7/12, PL-1/2, EQ-1/2, UA GET, SYS-1, PAY-1 | ✔ | ✔ | (AU-12 nhận kid token trong body/header) | ✔ | ✔ |
| `auth` chung: AU-5/8/9/10/11/13/14, CH-*, CR-*, ST-* (trừ ST-2/8), BS-*, TP-1, EQ-3, PL-3/4, PAY-3, MK-1..3, MK-6/8 | 401 | ✔ (chủ sở hữu) | **403** "Đang ở Kid Mode" | ✔ (về kỹ thuật) | ✔ |
| `parent` riêng: ST-2, ST-8, PAY-2/4/5, MK-4/5/7/9/10/11, SL-*, LS-* | 401 | ✔ | 403 | 403 | 403 |
| `kidAuth`: KD-* | 401 | **403** "Chỉ dùng được trong Kid Mode" | ✔ | 403 | 403 |
| `specialist, admin`: MD-*, CK-*, PD-*, QT-*, TP-2..4, EQ-4, UA ghi, CL-1 | 401 | 403 | 403 | ✔ | ✔ |
| `admin`: AD-* | 401 | 403 | 403 | 403 | ✔ |

Mobile: điều hướng theo `role` từ `/auth/me` (`formatUser` viết hoa, thiếu role → lỗi, không mặc định PARENT — authService.ts:294). Vào Kid Mode xoá token Parent khỏi máy (authService.ts:254-255) → không thể gắn nhầm token Parent ở Kid Mode. Seller không phải role BE: "người bán" là parent có `sellerProfile`.

---

## 10. External Infrastructure Dependencies

Chỉ liệt kê **tên biến cấu hình**, không có giá trị. "Runtime" = trạng thái quan sát được trong audit.

| Thành phần | Cấu hình nguồn | Dùng cho | Runtime trong audit |
|---|---|---|---|
| PostgreSQL (Prisma) | `DATABASE_URL` (bắt buộc, BE/api/src/config/env.js:88) | Mọi endpoint | Không xác minh (BE không chạy) |
| Redis + BullMQ | `REDIS_URL`; `AI_JOB_ATTEMPTS`, `AI_WORKER_CONCURRENCY`, `AI_TIMEOUT_MS_*` | ST-19/20/21, CR-6, ST-17 (queue + worker `workers/ai.processor.js`, `narration.processor.js`) | Không xác minh |
| AI service (BE/ai) | `AI_SERVICE_URL`, `INTERNAL_TOKEN` (API) · `llm_provider`, `gemini_api_key`, `anthropic_api_key`, `tts_provider` (AI) | ST-2 analyze (đồng bộ), sinh chữ, ảnh, TTS | Không xác minh |
| Ảnh AI | AI: `cloudflare_account_id/api_token`, `image_profile_*` | Chân dung, tranh cảnh | Không xác minh |
| Lưu trữ đối tượng | API: `CLOUDINARY_*`; AI: `cloudinary_*`, `supabase_url/service_key/bucket` | URL ảnh/audio (`clients/assetUrl.js`) | Không xác minh |
| Thanh toán | `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` | PAY-1/2, chợ truyện | Ngoài phạm vi Mobile |
| Email | `BREVO_*`, `SMTP_*`, `EMAIL_FROM` | AU-6/13 | Không xác minh |
| JWT | `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | Mọi phiên, kid session | — |
| Mobile | `EXPO_PUBLIC_API_URL` (services/config.ts; thiếu → lỗi rõ ràng, không đoán URL) | Mọi request | — |

Hệ quả: các luồng **không cần** Redis/AI: Auth, PIN, Kid Mode, CRUD bé/nhân vật, đọc truyện đã có, tủ sách, EQ, Ví (xem), Admin, Specialist. Các luồng **cần** Redis + worker + AI service + provider: tạo/sinh truyện, phân tích lời kể, tranh, giọng đọc, chân dung, credit giữ/hoàn.

---

## 11. Priority Integration Roadmap

### P0 — Tích hợp hiện có đang sai

**Không có.** Không tìm thấy endpoint Mobile đang gọi sai path/method/payload/envelope. (Lưu ý: kết luận dựa trên phân tích tĩnh; E2E thật có thể lộ lỗi runtime — xem §12.)

### P1 — Luồng nghiệp vụ thiết yếu còn thiếu

| # | Hạng mục | Owner | Endpoint | File dự kiến | Phụ thuộc | Test | Rủi ro | Tiêu chí nghiệm thu |
|---|---|---|---|---|---|---|---|---|
| P1-1 | Chạy E2E thật cho luồng đã nối (Auth → Parent đọc → Kid Reader) | Mobile + QA | AU-*, CH-6/8, ST-4/5, BS-2, KD-* | không sửa code | BE + PostgreSQL chạy, tài khoản QA parent | R9B_MANUAL_TEST_PLAN (theo MOBILE_STATUS) | Ghi `play_sessions`/`checkpoint_answers` | Có log request/response thật cho từng bước; cập nhật trạng thái thành REAL E2E VERIFIED |
| P1-2 | Gỡ truyện khỏi tủ sách | Mobile | BS-4 | screens/parent/StoryDetailScreen.tsx, navigation/ParentTabs.tsx | — (service có sẵn) | test đơn vị + E2E trên tài khoản QA | Thấp | Gỡ xong, `GET /kid/bookshelf` không còn truyện |
| P1-3 | Hiển thị trạng thái tủ sách theo bé | Mobile | CH-10 hoặc BS-3 | services/childService.ts hoặc storyService.ts; StoryDetailScreen.tsx | — | test hình dạng response | Thấp | Nút hiển thị đúng "Thêm"/"Gỡ" |
| P1-4 | Tranh AI | Mobile | ST-3 (`useAiImage`), ST-20, ST-21, ST-1 (`images`) | StoryWizard.tsx, StoryDetailScreen.tsx, services/storyService.ts | Redis + worker + provider ảnh + storage | 402 thiếu credit, 409 đang viết, poll `imageStatus` | **Tốn credit thật** | Truyện có `imageUrl` ở Parent và Kid Reader |
| P1-5 | E2E thật Admin/Specialist (đọc trước, ghi sau) | Mobile + QA | AD-*, MD-* đã nối | không sửa code | Tài khoản admin + specialist QA, dữ liệu mẫu (listing chờ duyệt, refund, withdrawal, appeal) | §12 | Mutation đụng tiền/trạng thái người bán | Mỗi màn có bằng chứng thật; không nâng FIXTURE PASS |

### P2 — Tính năng phụ

| # | Hạng mục | Owner | Endpoint | File dự kiến | Rủi ro | Tiêu chí |
|---|---|---|---|---|---|---|
| P2-1 | Phát giọng đọc server | Mobile | `audioUrl`, ST-17 | StoryReaderModal.tsx, components/kid/KidReader.tsx | Thư viện audio (expo-av/expo-audio) cần duyệt dependency | Phát được, fallback TTS khi `audioUrl` null |
| P2-2 | Vẽ chân dung nhân vật | Mobile | CR-6 | CharacterFormSheet.tsx, characterService.ts | Tốn credit | `portraitStatus` → ready, hiện ảnh |
| P2-3 | Sửa chữ trang / xoá truyện | Mobile | ST-11, ST-7 | StoryDetailScreen.tsx, storyService.ts | Mất dữ liệu nếu xoá nhầm → xác nhận 2 bước | Thay đổi phản ánh ở GET /stories/:id |
| P2-4 | Hành trình EQ | Mobile | CH-9 | EqReportScreen.tsx, childService.ts | Thấp | Hiện xu hướng theo tuần |
| P2-5 | Quên mật khẩu | Mobile (+BE cấu hình email) | AU-6, AU-7 | screens/auth/* | Phụ thuộc email | Đặt lại được mật khẩu |
| P2-6 | Sửa C5 (trạng thái rút tiền) | Mobile | AD-16 | types/management.ts, WithdrawalsScreen.tsx | Thấp | Lọc được `processing`, `cancelled` |

### P3 — Tuỳ chọn / tương lai

Truyện tự viết + editor checkpoint (ST-10..15), `kid/ui-audio` (KD-3), khôi phục phiên Kid (KD-1/5), avatar/usage bé (CH-7/11), chọn sub-skill khi phân tích (EQ-3), release claim (cần **BE** thêm route — M1), Marketplace/Seller/Payment (chờ chốt phạm vi).

---

## 12. Real E2E Test Readiness

| Nhóm | Workflow | Điều kiện |
|---|---|---|
| **Chỉ đọc — chạy ngay khi BE + DB bật** | Đăng nhập, `/auth/me`, Home overview, thư viện, chi tiết truyện, EQ report, Ví/gói/lịch sử credit, Kid tủ sách; Admin: overview, dashboard, accounts (GET), refunds/withdrawals/appeals (GET), audit-logs; Specialist: queue, seller list, reports | Tài khoản QA mỗi role |
| **Cần tài khoản QA** | Mọi luồng trên + PIN/Kid Mode | Parent QA có PIN, ≥1 bé; Admin QA; Specialist QA (tạo bằng AD-4 cần Admin) |
| **Cần dữ liệu test** | Kid Reader (truyện `ready` trên tủ bé), Specialist duyệt (listing ở trạng thái chờ), refund/withdrawal/appeal pending | Seed trên DB QA |
| **Cần BE/hạ tầng thêm** | Tạo truyện AI, phân tích lời kể, tranh, giọng đọc, chân dung, credit giữ/hoàn | Redis + worker + AI service + provider + storage |
| **Cần cho phép mutation** | CRUD bé/nhân vật, đổi mật khẩu/PIN, thêm/gỡ tủ sách, Kid answers/complete, khoá tài khoản, tạo Chuyên gia, mark-paid/reject rút tiền, decide refund (**tiền thật**), decide appeal, claim/view/decide duyệt, decide seller, dismiss/suspend/strike/hide | Chỉ trên tài khoản/dữ liệu QA; ghi lại trước/sau |
| **Bị chặn hiện tại** | Toàn bộ E2E | BE không chạy trong môi trường audit |

### Thứ tự kiểm thử thủ công đề xuất

1. Bật BE + PostgreSQL; `GET /api/v1/health`; đặt `EXPO_PUBLIC_API_URL`.
2. Parent QA: đăng nhập → Home → Thư viện → Chi tiết → EQ → Ví (chỉ đọc).
3. Admin QA: overview → dashboard → accounts → các danh sách (chỉ đọc).
4. Specialist QA: queue → seller list → reports (chỉ đọc).
5. (Duyệt mutation) Parent: tạo bé/nhân vật QA → đặt PIN → thêm truyện `ready` lên tủ → vào Kid Mode → đọc, trả lời, hoàn thành → thoát bằng PIN → kiểm EQ report thay đổi.
6. (Duyệt mutation) Specialist: claim → view 100% trang → decision trên listing QA; thử 409 bằng hai tài khoản.
7. (Duyệt mutation, dữ liệu tiền QA) Admin: reject/mark-paid rút tiền, decide refund, decide appeal, khoá/mở tài khoản QA.
8. (Khi có Redis/AI) Tạo truyện chuyện mẫu → poll → review → lên tủ; thử 402 với tài khoản hết credit; kiểm hoàn credit khi lỗi.

---

## 13. Recommended Next Actions

1. **Trước tiên:** bật BE + DB local, tạo 3 tài khoản QA (parent/admin/specialist), chạy bước 1–4 ở §12 (chỉ đọc). Ghi bằng chứng request/response → nâng các dòng tương ứng lên REAL E2E VERIFIED. Đây là cách nhanh nhất lộ lỗi runtime mà phân tích tĩnh không thấy.
2. **Thứ hai:** nối P1-2 và P1-3 (gỡ/xem tủ sách) — nhỏ, service đã có, không phụ thuộc AI; sau đó chạy bước 5 (Kid Reader thật — MOBILE_STATUS ghi "bắt buộc trước demo").
3. **Thứ ba:** khi hạ tầng AI sẵn sàng, chạy bước 8 rồi nối P1-4 (tranh AI); song song chạy bước 6–7 cho Admin/Specialist trên dữ liệu QA.

Không cần đổi kiến trúc: `apiClient` + service + `invalidResponseError` hiện tại đủ cho các hạng mục trên.

---

## 14. Audit Limitations

- **Backend có chạy không:** Không. `curl GET http://localhost:3000/api/v1/health` không phản hồi; không có `docker` trong môi trường shell.
- **Tài khoản thật:** Không có/không dùng.
- **Gọi API thật:** Không. Không có request GET/POST nào tới BE thật; không mutation, không AI, không credit, không thanh toán.
- **Kết nối DB:** Không xác minh.
- **Chỉ dựa trên phân tích tĩnh:** toàn bộ trạng thái "CONNECTED", mọi kết luận khớp contract (§8), hình dạng response (đọc từ service/controller BE), phân quyền (§9), phụ thuộc hạ tầng (§10).
- **Trạng thái "PASS lịch sử"** lấy từ `App/docs/mobile/MOBILE_STATUS.md`, không được xác minh lại.
- **Chưa đọc hết:** nội dung chi tiết mọi service BE ngoài các hàm liên quan tới endpoint Mobile gọi (ví dụ logic tính credit chi tiết, `finance.summary` từng trường so với `FinanceSummary` của Mobile — chỉ kiểm `revenue/series/sellerFunds`), App_v2 (không cần cho đối chiếu contract), toàn bộ màn Web (chỉ đọc lớp `Web/src/services`), Swagger `BE/api/src/docs` (chỉ dùng tham chiếu `useAiImage`).
- Số dòng trích dẫn đúng tại commit nêu ở đầu báo cáo; App có 3 file đang sửa chưa commit (`LoginScreen.tsx`, `tests/homeAuth.test.ts`, `docs/mobile/ENVIRONMENT.md`) — số dòng LoginScreen có thể lệch nhẹ.
