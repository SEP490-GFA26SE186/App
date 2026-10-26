# API MAPPING – Mobile ⇄ Web ⇄ BE

> Xác minh bằng đọc code tĩnh (BE `83025f8`, Web `a6aeb5b`, App `f1f5217`); **hiệu chỉnh ở Phase C (2026-10-26) theo source BE** – các dòng đánh dấu ✔C là đã đối chiếu trực tiếp. **Runtime chưa kiểm chứng.** Điểm không chắc ghi UNKNOWN. Swagger: `/api/v1/docs`. Nguồn Web: `Web/src/services/*.js`.

Ký hiệu: ✅ khớp/có API · ⚠️ lệch · ❌ BE không có · 🔒 BLOCKED · ⏸ SCOPE PENDING

## 0. Quy ước chung
- Base: `/api/v1`. Envelope: `{success, message, data?}`. Phân trang: `data` + `pagination{page,limit,total,totalPages}`.
- Lỗi: `{success:false, message, errors?[{path,message,...}]}`.
- Auth: `Authorization: Bearer <accessToken>` (parent) hoặc `kidSessionToken` (route `/kid/*`). Token `kid_session` bị 403 ở route parent.
- Mã lỗi cần xử lý: 400/401/402 (thiếu credit)/403/409/422/429/502.
- Media: URL Cloudinary HTTPS (signed, không expire) hoặc `null` nếu BE chưa cấu hình; audio là URL công khai, không cần header.

## 1. Auth & Session (P0)
| Endpoint | Request | Response | Mobile hiện tại | KL |
|---|---|---|---|---|
| `POST /auth/register` | `username ^[a-zA-Z0-9_]{3,50}$`, `email`, `password≥8`, `fullName?`, `phone?` | user + tokens (UNKNOWN: xác nhận chính xác khi implement) | cần đối chiếu | ⚠️ |
| `POST /auth/login` | `{emailOrUsername\|email\|username, password}` | `{user{id,role,username,email,fullName,phone,hasKidPin,emailVerifiedAt,createdAt}, tokens{accessToken,refreshToken,expiresIn}}` | nhánh demo giả (`authService.ts` ~46–56) | ⚠️ |
| `POST /auth/refresh-tokens` | refresh token (rotating) | tokens mới | không có | ⚠️ |
| `POST /auth/logout` | — | — | UNKNOWN | ⚠️ |
| `GET /auth/me` | — | `{user{…,hasKidPin, wallet{creditBalance, earningAvailableVnd}}}` (không avatarUrl, bankAccount) | fallback DEMO (~93–99) | ⚠️ |
| `POST /auth/kid-pin/set` | `{pin 4–6 số}` (UNKNOWN: tên field chính xác – đọc `BE` auth schema) | — | cục bộ | ⚠️ |
| `PUT /auth/kid-pin/change` | `{newPin, currentPin\|password}` | — | cục bộ | ⚠️ |
| `POST /auth/kid-mode/enter` | `{childId uuid}` (Bearer parent; cần PIN đã set) | `{child{id,name,birthDate,preferredVoice}, session{kidSessionToken, expiresIn:'24h'}}` | PIN cục bộ | ⚠️ |
| `POST /auth/kid-mode/exit` | `{pin, kidSessionToken?}` (public) | `{tokens}` mới (consume kid token) | `pin==='1234'` backdoor | ❌ |
- Lỗi PIN: 401 `attemptsLeft`; 429 `retryAfterSeconds` (5 sai → khóa 15', in-memory).
- Web refer: `Web/src/services/api.js` (single-flight refresh; loại trừ `/auth/login|register|refresh-tokens|logout`), `authStore`, `kidSessionStore`, `kidApi`.

## 2. Children & Characters (P0)
| Endpoint | Request | Response | Mobile | KL |
|---|---|---|---|---|
| `GET /children` | — | child `{id,name,birthDate,age,preferredVoice,character{id,name,appearance,portraitImageKey,portraitImageUrl,portraitStatus,portraitFailure},booksCount,completedSessionsCount,createdAt,updatedAt}` | `formatChild` bịa `gender/readingLevel/favoriteThemes/age||4` | ⚠️ |
| `POST /children` | `{name≤100, birthDate YYYY-MM-DD, preferredVoice, appearance, portraitImageKey}` | child | — | ✅ (quota → lỗi "maximum limit of N child profiles") |
| `PUT/DELETE /children/:id` | — | xóa mềm, hủy kid session | — | ✅ |
| `GET /children/:id/usage?date` | — | `{childId,date,usedMinutes,usedSeconds,sessionsCount,completedCount}` | — | ✅ |
| `GET /children/:id/overview` (UNKNOWN: xác nhận path) | — | `{profile, todayUsage, readingStats{booksInBookshelf,completedStories,lastReadStory,lastReadAt}, eqReport}` | fallback bịa competency | ⚠️ |
| EQ report / journey | `weeks` 4–26 | `{childId,childName,settings,competencies[{caselCode,nameVi,level(emerging|developing|secure|null),subSkills[]}],recommendations[]}`; journey thêm `evidence,conversation,trend` | — | ✅ |
| `PUT /children/:id/avatar` | `{appearance, portraitImageKey}` (key, không file) | — | — | 🔒 upload không có |
| `GET /characters` | — | `{characters}` | `formatCharacter` đọc `role` | ⚠️ |
| `POST /characters` | `{name, appearance(3–1000), childId?, portraitImageKey?, genPrompt?}` (không có `role`) | character | — | ⚠️ |
| `POST /characters/:id/portrait` | — | 202 `{character, aiRequestId}` (giữ credit) | — | ✅ |

## 3. Stories (P0)
| Endpoint | Request | Response | Mobile | KL |
|---|---|---|---|---|
| `POST /stories/analyze` | `{situation, characters, length, subSkillIds?}` | `{momentSummary, seedEvent, subSkills, analysisToken, expiresAt}`; 422/429/502 | — | ✅ |
| `POST /stories` | `{entry: topic\|family\|handwritten, topicId?, length: short\|medium\|long\|custom, title≤200, situation?, characters:[{characterId,isMain}] (đúng 1 main), analysisToken?, scored?, useAiImage=false, useTts=true}` | story | gửi `entry:'custom'`, thiếu `length` → 400 | ❌ |
| `POST /stories/:id/generate` | — | 202 `{aiRequestId}`; 402 thiếu credit | gọi `/stories/ai-generate` (không tồn tại) | ❌ |
| `GET /stories/:id/generation` | — | `{generation{status: queued\|processing\|succeeded\|failed\|blocked, errorCode, errorMessage}\|null}`; poll 2–3s | fake timer | ❌ |
| `GET /stories` | `status(draft\|generating\|ready), reviewed, page, limit≤100` | `{items,pagination}` | — | ✅ |
| `GET /stories/:id` | — | `data.story`: `cover, narration, readiness{ready,reason}, scenes, pages{id,pageOrder,contentText,audioUrl,audioStatus}, checkpoints(locked)` | — | ✅ |
| Editor endpoints | — | trả full story | — | ✅ |
| `POST /stories/:id/review` | — | 422 `errors[]` nếu chưa đủ | — | ✅ |
| `POST /stories/:id/narration/retry` | — | 202 | — | ✅ |
| `GET /stories/ai-pricing` | — | `{lengths[{length,pages,checkpoints,credits}], images{…}}` | — | ✅ |
| `publish-version` | — | luôn **501** | — | 🔒 |
| `/images`, `/scenes/:id/image` | — | tồn tại; AI image tạm dừng | — | 🔒 B5 |
- Rule: topic cần `topicId` & không `situation`; family cần `situation` 20–2000 + `analysisToken` & không `topicId`; custom không AI. Generation stale sau 10 phút.

## 4. Bookshelf & Kid (P0)
| Endpoint | Request | Response | Mobile | KL |
|---|---|---|---|---|
| `GET /bookshelf?childId` | — | `{child,items,pagination,counts,continueReading}` | — | ✅ |
| `POST /bookshelf` | `{childId,storyId}` | idempotent; 422 nếu chưa ready; cần truyện private của mình hoặc đã mua | — | ✅ |
| `GET /bookshelf/check/:storyId` | — | — | — | ✅ |
| `DELETE /bookshelf/:storyId?childId` | — | — | — | ✅ |
| `GET /children/:id/bookshelf` | `status(all\|reading\|completed\|not_started)`, competency | — | — | ✅ |
| Kid shelf | — | `items[{storyId,title,cover{imageUrl,competency},coverImageUrl,totalPages,addedAt?,readingProgress}]` (không có pages) | đọc `items[].story` | ❌ |
| `GET /kid/me` | kid token | — | — | ✅ |
| `POST /kid/sessions` | `{storyId}` | 201 `{session{id,storyId,isFirstPlay,status,currentPageId,startedAt,completedAt}, story{id,title,useTts,topic,pages[{id,pageOrder,text,audioUrl,imageUrl}], checkpoints[{id,afterPageId,afterPageOrder,type,question,questionAudioUrl,options[{id,text,textAudioUrl}],result}]}}`; 422 `errors[{path:'storyId',narration}]` nếu chưa ready/không trong bookshelf | `formatStory` đọc `contentText/choices/eqSignal` | ❌ |
| `GET /kid/sessions/:id` | — | — | — | ✅ |
| `POST /kid/sessions/:id/answers` ✔C (số nhiều) | `{checkpointId, emotion?(happy\|sad\|angry\|scared\|neutral), optionId?, skipped?, timeToFirstMs?, questionReplays?}` (`.strict()`) | `data.result = {checkpointId,attempts,skipped,done,correct,hint?,hintAudioUrl?,answer?,feedback?,feedbackAudioUrl?}`; session xong → 409 | gửi `emotionChoice` → 400 | ❌ |
| `PUT /kid/sessions/:id/progress` | `{pageId}` | — | — | ✅ |
| `POST /kid/sessions/:id/complete` | — | idempotent | — | ✅ |
| `GET /kid/ui-audio` | — | `{assets:{key:{text,audioUrl}}}` | — | ✅ |
- Checkpoint type: `emotion_self\|emotion_other\|perspective\|problem_solving\|reflection`. Chỉ lần trả lời đầu của lượt đầu được chấm.
- ✔C Path answer là `/kid/sessions/:id/answers` (kid.routes.js). Kid shelf: `items[]` có `storyId` (không `story`).

## 5. Plans / Credit (P0 – chỉ xem)
| Endpoint | Response | KL |
|---|---|---|
| `GET /plans` ✔C | `data.plans[]` `{code,name,durationMonths,priceVnd(chuỗi),creditsPerMonth,maxChildren,maxCharacters,canSell}` | ✅ |
| `GET /subscriptions/me` | `{isFallback, plan, status, periodStart, periodEnd, nextCreditGrantAt, usage{childrenCount,charactersCount}}` (free: 2 children, 5 characters) | ✅ |
| `GET /subscriptions/me/credit-history?page&limit≤50` | `{entries[{id,createdAt,entryType,amount,balanceAfter,context}], pagination}` | ✅ |
| Top-up credit | **không tồn tại** | ❌ không tạo ví giả |

## 6. ⏸ SCOPE PENDING – Payment / Marketplace
| Endpoint | Ghi chú | KL |
|---|---|---|
| `POST /payments/plans/checkout {planId}` | `{order, checkoutUrl\|null}` (giá 0 → giao ngay) | ⏸ |
| `POST /market/checkout {listingId}` | 422 truyện của mình, 409 đã sở hữu | ⏸ |
| `GET /payments/orders/:id` | BE tự poll payOS & fulfill; status pending\|paid\|cancelled\|expired\|failed | ⏸ |
| `GET /payments/orders`, `POST /payments/order-items/:id/refund` | `{refundWindowDays, orders[]}` | ⏸ |
| Webhook `/payments/payos/webhook` | public, BE xử lý | — |
| **Deep link return** | payOS `returnUrl/cancelUrl = ${WEB_URL}/parent/billing/result?orderId=` (hoặc marketplace/result); không có scheme mobile | 🔒 B1 |
| Cách khả thi không sửa BE | `expo-web-browser` mở `checkoutUrl` + polling order | đề xuất, chưa duyệt |
| `GET /market/listings` | `search, competency, age, priceMin, priceMax, narration, sort(best_selling\|rating\|newest\|price_asc), page, limit` | ⏸ |
| `/market/listings/:id`, `/market/owned`, `/market/sellers/:id`, reviews, reports | — | ⏸ |
| Seller `/sellers/me`, `/sellers/apply`, `/listings/mine`, `POST /listings`, earnings, `PUT /sellers/me/bank`, withdrawals | giá 0 hoặc 5.000–500.000 bội của 1.000; bank `bankBin` 6 số | ⏸ |
| Specialist `/moderation/*`, `/topics`, `/sub-skills`, `/question-templates`, `/checkpoint-review`, `/pedagogy` | — | ⏸ |
| Admin `/admin/*` | withdrawals, appeals, accounts, plans, refunds, finance, audit logs | ⏸ |

## 7. Checklist đối chiếu khi implement mỗi API
1. Đọc validation (zod) trong `BE/src/modules/<module>`. 2. Đối chiếu Swagger. 3. Đối chiếu Web service. 4. Viết type DTO theo BE. 5. Mapper không bịa field. 6. Xử lý đủ mã lỗi.

## 8. Hiệu chỉnh Phase C (đối chiếu source BE)
- `GET /stories`, `GET /bookshelf`: `ApiResponse.paginated` → `{success,message,data:[…],pagination}` (mảng ở `data`, `pagination` top-level; bookshelf thêm `child`).
- `PUT /auth/change-password {currentPassword,newPassword(8–100)}` tồn tại (400 `Account password is incorrect`).
- `POST /stories`: `entry` ∈ topic|family|handwritten; `length` ∈ short|medium|long|custom; family cần `situation` 20–2000 + `analysisToken`; topic cần `topicId` và **không** gửi `situation`; `useAiImage` mặc định false, `useTts` mặc định true.
- `GET /stories/:id`: `pages[].{id,pageOrder,sceneId,contentText,audioUrl}`, `scenes[].{id,imageUrl}`, `checkpoints[].{afterPageOrder,type,question,locked,options}`, `readiness{ready,reason}`.
- `POST /auth/kid-mode/exit`: 401 `errors[0].attemptsLeft` (PIN sai) / 429 `errors[0].retryAfterSeconds` (khóa 15 phút); route công khai nhận `kidSessionToken`.
- `GET /children/:id/overview` = `{profile,todayUsage{usedMinutes,sessionsCount,completedCount…},readingStats{booksInBookshelf,completedStories,lastReadStory,lastReadAt},eqReport}`.
- `GET /subscriptions/me` = `{isFallback,plan,status,periodStart,periodEnd,nextCreditGrantAt,usage{childrenCount,charactersCount}}`.
