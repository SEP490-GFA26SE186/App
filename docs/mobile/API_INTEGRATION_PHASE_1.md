# API Integration — Phase 1: Child Profile & Bookshelf

Phạm vi: 8 endpoint BE có sẵn (prefix `/api/v1`), nhóm hồ sơ bé, hành trình EQ, thời gian đọc, tủ sách.
Ngày: 2026-10-29 · Nhánh: `refactor/mobile-frontend-cleanup` · Chưa commit.

**Trạng thái chung:** 7/8 IMPLEMENTED — MANUAL TEST PENDING · 1/8 BLOCKED — OWNER APPROVAL REQUIRED.
Không có endpoint nào được gọi với BE thật trong phase này; chưa có E2E PASS.

## 1. Tổng quan 8 endpoint

| ID | Endpoint | Trạng thái | Service Mobile | Màn hình / hành động |
|---|---|---|---|---|
| P1-01 | `GET /children/:id` | IMPLEMENTED — MANUAL TEST PENDING | `childService.getChild` | Bé nhà mình → **Chi tiết** → khối hồ sơ |
| P1-02 | `PUT /children/:id/avatar` | **BLOCKED — OWNER APPROVAL REQUIRED** | — | — |
| P1-03 | `GET /children/:id/eq-journey` | IMPLEMENTED — MANUAL TEST PENDING | `childService.getChildEqJourney` | Tab Tiến độ (EQ) → khối "Xu hướng 8 tuần gần đây" |
| P1-04 | `GET /children/:id/bookshelf` | IMPLEMENTED — MANUAL TEST PENDING | `childService.getChildBookshelf` | Chi tiết bé → khối "Tủ sách của bé" (đếm + 3 truyện mới nhất) |
| P1-05 | `GET /children/:id/usage` | IMPLEMENTED — MANUAL TEST PENDING | `childService.getChildUsage` | Chi tiết bé → "Thời gian đọc", chip 7 ngày |
| P1-06 | `GET /bookshelf` | IMPLEMENTED — MANUAL TEST PENDING | `storyService.getBookshelf` | Tủ truyện → nút chuyển **Tủ sách của {bé}** (lọc trạng thái, tải thêm) |
| P1-07 | `GET /bookshelf/check/:storyId` | IMPLEMENTED — MANUAL TEST PENDING | `storyService.checkShelf` | Chi tiết truyện → khối "Tủ sách của các bé" |
| P1-08 | `DELETE /bookshelf/:storyId?childId=` | IMPLEMENTED — MANUAL TEST PENDING | `storyService.removeFromShelf` (đã có, trước đây không ai gọi) | Nút **Gỡ** ở Tủ sách của bé và ở Chi tiết truyện (có xác nhận) |

`POST /bookshelf` (đã nối từ trước) giữ nguyên; nay được gọi thêm từ nút **Thêm** theo từng bé ở Chi tiết truyện. Menu "⋯ → Thêm vào tủ sách" ở Tủ truyện không đổi.

## 2. Contract BE thực tế (đối chiếu source BE, chỉ đọc)

Mọi route dùng middleware `auth` (token kid_session bị từ chối 403). Lỗi theo envelope chung `{ success:false, message, errors? }`.

| Endpoint | Request | Response | Ghi chú |
|---|---|---|---|
| `GET /children/:id` | `id` uuid | `data.child` = `{id, name, birthDate, age, preferredVoice, character{id,name,appearance,portraitImageKey,portraitImageUrl,portraitStatus,portraitFailure}\|null, booksCount, completedSessionsCount, createdAt, updatedAt}` | Chỉ bé của chính phụ huynh; khác → 404 |
| `PUT /children/:id/avatar` | body `{appearance?: string≤500, portraitImageKey?: string≤300}` | `data.avatar` = character | **Không nhận file ảnh.** Chỉ nhận khóa ảnh đã có trong storage; BE không có endpoint upload |
| `GET /children/:id/eq-journey` | query `weeks` 4..26 (mặc định 8) | `data` = `{childId, childName, settings, competencies[], recommendations[], evidence[], conversation[], trend[]}`; `trend[i]` = `{weekStart:'YYYY-MM-DD', competencies:{[caselCode]:{items, level}}}` (cũ → mới) | Mobile chỉ dùng `trend`; `level` có thể `null` |
| `GET /children/:id/bookshelf` | query `page`, `limit`(BE kẹp ≤50), `search`, `status` all\|reading\|completed\|not_started, `competency` | `data` = `{child{id,name}, items[], pagination, counts{all,reading,completed,not_started}, continueReading[]}` | Envelope thường |
| `GET /children/:id/usage` | query `date` `YYYY-MM-DD` (giờ VN; mặc định hôm nay) | `data` = `{childId, date, usedMinutes, usedSeconds, sessionsCount, completedCount}` | Mỗi lượt đọc tính tối đa 60 phút |
| `GET /bookshelf` | query `childId` (bắt buộc ở service), `page`, `limit`, `search`, `status`, `competency` | `{success, message, data: items[], child, pagination}` — **`child` và `pagination` ở top-level**, không có `counts` | Cùng dữ liệu với `/children/:id/bookshelf`, khác envelope |
| `GET /bookshelf/check/:storyId` | `storyId` uuid; `childId` tùy chọn (Mobile không gửi → mọi bé) | `data` = `{storyId, children:[{childId, name, inBookshelf, addedAt\|null}]}` | |
| `DELETE /bookshelf/:storyId` | query `childId` uuid **bắt buộc** | `{success, message:'Đã bỏ truyện khỏi giá sách'}` | Chỉ xóa dòng `bookshelf_items`; truyện gốc và `play_sessions` giữ nguyên. Không có trên giá → 404 |

Item giá sách: `{storyId, title, kind, length, totalPages, useTts, useAiImage, topic{title,competency}|null, cover{imageUrl,competency}, addedAt, readingProgress{isCompleted,currentPageOrder,progressPercentage,lastActivityAt}|null}`.

## 3. UI/UX đã thêm/đổi

- **Chi tiết bé (màn mới `ChildDetailScreen`, route `CHILD_DETAIL`)**: mở từ nút **Chi tiết** trên thẻ bé ở "Bé nhà mình". Ba khối nạp độc lập, mỗi khối có skeleton / lỗi + Thử lại / trống:
  - Hồ sơ: ảnh chân dung nhân vật đại diện nếu BE có `portraitImageUrl` (không thì emoji như cũ), tuổi, ngày sinh, số truyện trên tủ, số lượt đọc xong, ngoại hình, giọng ưa thích.
  - Thời gian đọc: chip "Hôm nay / Hôm qua / dd/MM" cho 7 ngày, hiện thời gian, số lượt đọc, số lượt đọc xong. Không có lượt đọc → trạng thái trống, không hiện "0 phút" giả.
  - Tủ sách: đếm theo trạng thái (BE `counts`) + 3 truyện mới thêm + nút **Quản lý tủ sách của bé**. Nút này chọn bé đó rồi mở Tủ truyện ở chế độ tủ sách.
- **Tủ truyện**: thêm thanh chuyển *Truyện gia đình* / *Tủ sách của {bé}*. Chế độ tủ sách (`ChildShelfPanel`): chọn bé (ChildSwitcher có sẵn), lọc Tất cả / Đang đọc / Đã đọc xong / Chưa đọc, danh sách có tiến độ đọc, **Tải thêm** theo `pagination.total`, nút **Gỡ** mỗi truyện. Lưới truyện gia đình giữ nguyên.
- **Chi tiết truyện**: nút đơn "Thêm vào tủ sách của {bé đang chọn}" được thay bằng khối **Tủ sách của các bé**: mỗi bé một dòng, nhãn "Đã có trên tủ" / "Chưa có trên tủ", nút **Thêm** hoặc **Gỡ**. Bé đang chọn đứng đầu. Sau mỗi thao tác thì kiểm tra lại. Xem lại / Cho AI viết / Đọc thử / Chỉnh sửa không đổi.
- **Tiến độ EQ**: thêm thẻ "Xu hướng 8 tuần gần đây" dưới các thẻ năng lực: cột số câu trả lời mỗi tuần + dải ô mức năng lực cuối mỗi tuần cho từng năng lực (nhạt → đậm, xám = chưa có dữ liệu). Nạp riêng, lỗi không chặn báo cáo chính. Không có câu trả lời nào → câu thông báo, không vẽ biểu đồ rỗng. Không hiện điểm/%.

Gỡ truyện: luôn hỏi xác nhận (Dialog có sẵn, kiểu destructive), chỉ gỡ cho đúng `childId` của dòng/bé đang chọn, khóa nút trong lúc gửi (ref + `disabled`), lỗi hiện qua Dialog, luôn làm mới danh sách sau đó (kể cả 404 khi đã bị gỡ ở nơi khác).

## 4. File tạo/sửa

Tạo:
- `apps/mobile/src/screens/parent/ChildDetailScreen.tsx`
- `apps/mobile/src/components/parent/ChildShelfPanel.tsx`
- `apps/mobile/src/components/parent/ShelfItemRow.tsx`
- `apps/mobile/tests/phase1.test.ts`
- `docs/mobile/API_INTEGRATION_PHASE_1.md` (file này)

Sửa:
- `apps/mobile/src/types/api.ts` — DTO `ShelfItemDto`, `ChildBookshelfDto`, `BookshelfPageDto`, `BookshelfCheckDto`, `EqTrendWeekDto`, `EqJourneyDto`, `ShelfStatus`
- `apps/mobile/src/services/childService.ts` — `getChild`, `getChildUsage`, `getChildEqJourney`, `getChildBookshelf`
- `apps/mobile/src/services/storyService.ts` — `getBookshelf`, `checkShelf` (chỉ thêm; hàm AI/tạo truyện không đổi)
- `apps/mobile/src/utils/child.ts` — `vnDateDaysAgo`, `readingTimeLabel`
- `apps/mobile/src/navigation/routes.ts` — route `CHILD_DETAIL`, params `childId`, `view: 'shelf'`; chặn chạm lặp so cả `childId`
- `apps/mobile/src/navigation/ParentTabs.tsx` — render `ChildDetailScreen`, `onOpenDetail`, `LibraryScreen initialView`
- `apps/mobile/src/screens/parent/ChildrenScreen.tsx` — nút **Chi tiết**
- `apps/mobile/src/screens/parent/LibraryScreen.tsx` — thanh chuyển chế độ; `onOpenStory` nhận `Pick<Story,'id'>`
- `apps/mobile/src/screens/parent/StoryDetailScreen.tsx` — chỉ khối tủ sách (check / thêm / gỡ)
- `apps/mobile/src/screens/parent/EqReportScreen.tsx` — thẻ xu hướng tuần

Không đụng: StoryWizard, GenerationRunner/Panel, sinh tranh/chân dung/giọng đọc, billing, auth/PIN, Kid Mode, Admin/Specialist, BE, Web, App_v2. Không thêm dependency.

Tái sử dụng: `apiFetch` (kể cả `raw: true` cho envelope phân trang), `useAsyncResource`, `StateView`, `HeyCard`, `HeyButton`, `HeyChip`, `Badge`, `HeyProgressBar`, `StoryCover`, `ScreenHeader`, `ChildSwitcher`, `useDialog().confirm`, `useToast`, `CASEL`/`EQ_LEVELS`, điều hướng stack ADR-015 (Android Back tự xử lý vì `CHILD_DETAIL` là màn con).

## 5. Kết quả kiểm tra tĩnh

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` | Không lỗi |
| 11 test offline trong `apps/mobile/tests` (cách chạy: `tests/README.md`) | Tất cả PASS: authRace 5/5, homeAuth 6/6, kidUi 5/5, library 7/7, manage 7/7, management 19/19, navigation 11/11, **phase1 4/4**, r9a 7/7, uiStates 2/2, wizard 6/6 |
| `npx expo export --platform android` (ra thư mục tạm) | Bundle thành công (AppEntry .hbc 2,97 MB) |

Các test này chỉ quét mã nguồn / dùng fetch giả, không gọi BE, không chạm luồng AI hay trả phí. Đây **không** phải E2E. Lần đầu `manage` đỏ vì thanh cột EQ dùng chiều cao `%`, vi phạm luật "EQ không hiện %". Đã sửa sang `flex`, không sửa test.

## 6. BLOCKED — OWNER APPROVAL REQUIRED

**P1-02 `PUT /children/:id/avatar`**
- BE chỉ nhận `portraitImageKey` (khóa file đã nằm trong storage) và/hoặc `appearance`. Không có endpoint upload ảnh trong BE (`grep multer|upload|presign` không thấy). Mobile không thể tạo ra khóa hợp lệ từ ảnh chọn trên máy.
- Mobile chưa có thư viện chọn ảnh (`expo-image-picker` không có trong `package.json`), nên cần thêm dependency.
- `appearance` là đầu vào cho chân dung AI (owner-reserved). Gửi chuỗi rỗng sẽ **gỡ nhân vật đại diện**; gửi `portraitImageKey` rỗng sẽ xóa chân dung đã tạo. Rủi ro mất dữ liệu đã trả phí.
- Cần chủ dự án quyết: (a) thêm endpoint upload ở BE + `expo-image-picker`, hoặc (b) chỉ cho đổi `appearance` (thực chất trùng `PUT /children/:id` đã nối trong form sửa bé), hoặc (c) để chân dung chỉ đi qua luồng AI portrait do chủ dự án giữ.

## 7. Rủi ro đã biết

- `GET /children/:id/bookshelf` và `GET /bookshelf` trả cùng dữ liệu. Phase 1 dùng cả hai ở hai ngữ cảnh: tóm tắt có `counts` ở Chi tiết bé, danh sách phân trang ở Tủ truyện. Nếu sau này muốn gọn có thể bỏ một.
- Màn EQ gọi cả `eq-report` (đã nối từ trước) và `eq-journey` (superset). BE tính báo cáo hai lần. Giữ vậy để không đổi luồng EQ đang ổn định; có thể gộp sau khi chủ dự án duyệt.
- Truyện đã mua (`kind ≠ 'private'`) trên giá sách không mở được Chi tiết truyện (màn đó dùng `GET /stories/:id` của truyện riêng), nên dòng đó không bấm được, chỉ gỡ được.
- Ngày cho `/usage` tính ở client theo UTC+7 cố định (khớp BE `vnDate`). Đồng hồ máy sai thì chip ngày lệch theo.
- Sau khi gỡ ở Chi tiết truyện / Tủ sách, `booksCount` trong Chi tiết bé chỉ cập nhật khi mở lại màn đó (mỗi lần mở là nạp mới).
- `POST /bookshelf` có thể trả 422 (truyện chưa sẵn sàng / thiếu giọng đọc). Lỗi hiện qua Dialog như cũ. Phase 1 không đổi điều kiện sẵn sàng.

## 8. Hướng dẫn kiểm thử thủ công cho chủ dự án

Chuẩn bị: BE + PostgreSQL chạy, `EXPO_PUBLIC_API_URL` trỏ BE dev. Tài khoản **Parent QA** có ít nhất 2 bé (A, B). Có 1 truyện riêng đã hoàn tất + đã xem lại + đủ giọng đọc (truyện S) và ít nhất 1 truyện khác đã nằm trên giá của bé A. Không cần Redis/worker/AI service: không bước nào dưới đây sinh nội dung hay tiêu credit. Theo dõi request bằng log BE hoặc network inspector.

| Test ID | Role | Dữ liệu cần | Mở màn | Thao tác | HTTP mong đợi | UI mong đợi | Trạng thái BE mong đợi | Đổi dữ liệu? | Status |
|---|---|---|---|---|---|---|---|---|---|
| QA-P1-01 | Parent | Bé A | Hồ sơ → Bé nhà mình | Bấm **Chi tiết** trên thẻ bé A | `GET /api/v1/children/{A}` → 200 | Tên, tuổi/ngày sinh, số truyện trên tủ, lượt đọc xong, ngoại hình/giọng nếu có; ảnh chân dung nếu BE có URL. Tắt BE rồi mở lại → khối lỗi + Thử lại | Không đổi | Không | NOT TESTED — OWNER MANUAL QA |
| QA-P1-02 | Parent | — | — | (BLOCKED, không có UI) | — | — | — | — | BLOCKED — OWNER APPROVAL REQUIRED |
| QA-P1-03 | Parent | Bé A đã trả lời câu hỏi điểm dừng (có thể không) | Tab Tiến độ, chọn bé A | Cuộn xuống thẻ "Xu hướng 8 tuần gần đây" | `GET /api/v1/children/{A}/eq-journey?weeks=8` → 200 (cùng lúc với `/eq-report`) | Có dữ liệu: 8 cột số câu/tuần khớp `trend[].competencies[*].items`, dải ô mức theo `level`. Không có: "Chưa có câu trả lời nào trong 8 tuần qua." Đổi sang bé B → dữ liệu bé B, không lẫn | Không đổi | Không | NOT TESTED — OWNER MANUAL QA |
| QA-P1-04 | Parent | Bé A có ≥1 truyện trên giá | Chi tiết bé A | Xem khối "Tủ sách của bé" | `GET /api/v1/children/{A}/bookshelf?page=1&limit=3&status=all` → 200 | Đếm Tất cả/Đang đọc/Đã xong/Chưa đọc khớp `counts`; tối đa 3 truyện mới thêm với tiến độ. Bé không có truyện → "Tủ sách đang trống" | Không đổi | Không | NOT TESTED — OWNER MANUAL QA |
| QA-P1-05 | Parent | Bé A đã đọc hôm nay hoặc hôm qua (tùy) | Chi tiết bé A | Bấm chip Hôm nay, Hôm qua, một ngày khác | `GET /api/v1/children/{A}/usage?date=YYYY-MM-DD` (mỗi chip một ngày, giờ VN) → 200 | Thời gian ("Dưới 1 phút" nếu <60 giây), số lượt đọc, lượt đọc xong; ngày không đọc → "Bé chưa đọc truyện nào ngày này" | Không đổi | Không | NOT TESTED — OWNER MANUAL QA |
| QA-P1-06 | Parent | Bé A có >20 truyện để thử Tải thêm (tùy) | Tủ truyện → **Tủ sách của A** (hoặc Chi tiết bé A → Quản lý tủ sách) | Đổi bộ lọc trạng thái; đổi bé bằng ChildSwitcher; bấm Tải thêm | `GET /api/v1/bookshelf?childId={A}&page=1&limit=20&status=…` → 200; Tải thêm → `page=2` | Danh sách đúng bé đang chọn, lọc đúng trạng thái; đổi bé → danh sách bé mới, không lẫn | Không đổi | Không | NOT TESTED — OWNER MANUAL QA |
| QA-P1-07 | Parent | Truyện S, bé A chưa có S, bé B đã có S | Tủ truyện → mở truyện S | Xem khối "Tủ sách của các bé"; bấm **Thêm** ở bé A | Khi mở: `GET /api/v1/bookshelf/check/{S}` → 200. Thêm: `POST /api/v1/bookshelf {childId:A, storyId:S}` → 201, rồi `GET /bookshelf/check/{S}` lần nữa | A: "Chưa có trên tủ" → sau khi thêm "Đã có trên tủ" + toast; B: "Đã có trên tủ". Truyện chưa sẵn sàng → Dialog lý do 422 | Thêm 1 dòng `bookshelf_items (A, S)` | **Có** (thêm vào giá) | NOT TESTED — OWNER MANUAL QA |
| QA-P1-08a | Parent | Bé A có S trên giá | Chi tiết truyện S | Bấm **Gỡ** ở bé A → Hủy; rồi bấm lại → **Gỡ khỏi tủ** | Hủy: không request. Đồng ý: `DELETE /api/v1/bookshelf/{S}?childId={A}` → 200, rồi `GET /bookshelf/check/{S}` | Dialog xác nhận nêu tên bé; nút khóa khi đang gửi; toast "Đã gỡ…"; A chuyển "Chưa có trên tủ"; dòng bé B không đổi | Xóa đúng dòng `bookshelf_items (A, S)`; truyện S, giá của B và `play_sessions` của A còn nguyên | **Có** (gỡ khỏi giá) | NOT TESTED — OWNER MANUAL QA |
| QA-P1-08b | Parent | Bé A có ≥1 truyện trên giá | Tủ truyện → Tủ sách của A | Bấm **Gỡ** một truyện → xác nhận; bấm Gỡ liên tục nhiều lần | Một `DELETE /api/v1/bookshelf/{storyId}?childId={A}` duy nhất → 200, rồi `GET /bookshelf?childId={A}…` | Truyện biến mất khỏi danh sách; các nút Gỡ khác bị khóa trong lúc gửi. Gỡ truyện đã bị gỡ ở thiết bị khác → Dialog lỗi (404) và danh sách làm mới | Như 08a | **Có** | NOT TESTED — OWNER MANUAL QA |

Kiểm tra thêm (không gọi API mới): Android Back ở Chi tiết bé quay về "Bé nhà mình"; bấm tab Tủ truyện luôn mở lại chế độ "Truyện gia đình".
