# QA R6 — Story Wizard (tạo truyện AI)

> **Ngày:** 2026-10-27 · **Phạm vi:** R6 theo [UI_UX_REDESIGN_PLAN.md](UI_UX_REDESIGN_PLAN.md) §5.2 · Tiến độ: [UI_REDESIGN_PROGRESS.md](UI_REDESIGN_PROGRESS.md).
> **Ảnh:** [`qa/r6/`](qa/r6/) (`r6w*` = Web, `r6a*` = Android SW_Test). Ảnh `r6w10–13` là **FIXTURE** (dữ liệu giả, xem §4.2). Không có mật khẩu/PIN/token trong ảnh.
> **Trạng thái:** đã triển khai + tự kiểm thử, **chờ chủ dự án review**. Chưa nghiệm thu, chưa commit.

---

## 1. Phạm vi và môi trường

- **Phạm vi R6 (từ kế hoạch):** chỉ **Story Wizard** — `StoryWizard.tsx`, `GenerationRunner/Panel`, `CharacterFormSheet`. Thư viện, Bé nhà mình, Nhân vật (màn quản lý) thuộc R7/R8, **không đụng**.
- **Git:** nhánh `refactor/mobile-frontend-cleanup`, HEAD `cf0e7c3` (R5 đã commit), working tree sạch trước R6. Chưa commit/push.
- **Môi trường:** BE local `127.0.0.1:3000` (không sửa BE/DB), Expo Web 8082 + Chrome headless (CDP), Android SW_Test (Expo Go, New Architecture) 1080×2400 và 360×640dp.
- **Tài khoản:** chỉ tài khoản test `qa_r1` (3 credit). Không dùng tài khoản demo. **Không bấm tạo truyện thật, không gọi AI, không tốn credit.** Có tạo 2 nhân vật test "Bà ngoại QA" trong tài khoản `qa_r1` (qua form của Wizard, để kiểm form).

## 2. Thiết kế đã làm

Một trang dài 4 mục → **stepper 3 bước** (state, quy tắc `missing`, thứ tự nhân vật chính, API, xử lý lỗi **giữ nguyên**; chỉ đổi phần hiển thị):

1. **Cách tạo:** 3 lối vào là nhóm radio (icon radio + chữ, không chỉ dựa vào màu); nhập lời kể (nhà mình) / chọn chuyện mẫu / "Tự viết" = chưa hỗ trợ.
2. **Nhân vật:** checkbox + ngôi sao đặt nhân vật chính (vùng chạm 44×44), "Thêm nhân vật" mở `CharacterFormSheet`.
3. **Hoàn tất:** **segmented độ dài** (Ngắn/Vừa/Dài kèm số trang và **giá credit thật từ `GET /stories/ai-pricing`**), tên truyện, giọng đọc, thẻ "Bé sẽ tập gì?" (lối nhà mình).

Chung: thanh tiến độ + tên 3 bước (`role=progressbar`, đọc "Bước n trên 3: …"), **chân trang cố định** với số dư và nút chính "Tạo truyện · N credit" (N từ BE; BE không trả giá thì không ghi số), nút quay lại bước trước, lỗi dạng `role=alert` có icon, Android Back ở bước 2–3 quay về bước trước (dữ liệu giữ nguyên). `GenerationPanel`: khi AI đang chạy hiện **cú Lu Lu "đang nghĩ"** (chỉ minh họa, **không** tiến độ/timer giả). `GenerationRunner` và `CharacterFormSheet`: token màu, icon vector, `loading` thay emoji.

## 3. File thay đổi

| File | Loại |
|---|---|
| `src/screens/parent/StoryWizard.tsx` | viết lại phần hiển thị (+ `BackHandler`) |
| `src/components/parent/GenerationPanel.tsx` | cú "đang nghĩ", token, icon |
| `src/components/parent/GenerationRunner.tsx` | token, icon, `role=alert` |
| `src/components/parent/CharacterFormSheet.tsx` | token, icon, `loading` |
| `tests/wizard.test.ts` (mới), `tests/README.md` | 6 test hồi quy |
| `docs/mobile/QA_R6_REPORT.md`, `UI_REDESIGN_PROGRESS.md`, `qa/r6/` | tài liệu |

Không đụng BE, Web, App_v2, dependency, `package.json`, Auth/phiên, PIN Kid.

## 4. QA Web (Chrome headless, 390×844 mobile emulation)

### 4.1 Dữ liệu thật từ BE (tài khoản test)

| # | Kiểm tra | Kết quả |
|---|---|---|
| W1 | Vào Wizard từ Home; thanh tab ẩn; "Bước 1 trên 3: Cách tạo"; vùng chạm lối vào 358×113, nút 140×52 | PASS |
| W2 | Tiếp tục khi chưa chọn → "Ba mẹ chọn một lối vào nhé", ở nguyên bước 1 | PASS |
| W3 | Lối nhà mình: lời kể quá ngắn → lỗi "ít nhất 20 ký tự"; bộ đếm ký tự hiển thị | PASS |
| W4 | Chuyện mẫu: 8 mẫu thật từ BE (radio); không chọn → lỗi; chọn → sang bước 2 | PASS |
| W5 | Bước 2: không chọn nhân vật → lỗi; mở sheet → lỗi rỗng ("nhập tên", "Mô tả tối thiểu 3"); tạo nhân vật test → tự được chọn và làm nhân vật chính; ngôi sao 44×44 | PASS |
| W6 | Bước 3: 3 lựa chọn "Ngắn, 6 trang, 1 credit / Vừa, 8 trang, 2 credit / Dài, 10 trang, 3 credit" (**từ BE**); nút "Tạo truyện · 2 credit" đổi thành "· 1 credit" khi chọn Ngắn; "Số dư hiện tại: 3 credit" | PASS |
| W7 | Thiếu tên → "Ba mẹ đặt tên cho truyện nhé"; Quay lại bước 2 giữ nguyên lựa chọn, sang lại bước 3 giữ nguyên tên | PASS |
| W8 | Bàn phím: Tab đi hết header → Quay lại → 3 lựa chọn → tên → giọng đọc → nút quay lại bước trước; **tất cả có focus ring** | PASS |
| W9 | Responsive 320×568, 768×1024, 1280×800: không tràn ngang | PASS |
| W10 | Hồi quy (script R5): Home, tab, Tủ truyện, Hành trình EQ, Sáng tác, Kid Mode + PIN sai/đúng qua BE, về Home | PASS |

### 4.2 FIXTURE UI — **không phải E2E thật, không gọi AI, không tốn credit**

Trong trình duyệt, request `POST /stories`, `/stories/analyze`, `/generate`, `GET /generation` bị chặn và trả dữ liệu **giả** (BE không nhận request nào trong nhóm này).

| # | Kiểm tra | Kết quả |
|---|---|---|
| F1 | Lối nhà mình → "Xem bé sẽ tập gì" → thẻ "Bé sẽ tập gì?" (tóm tắt + 2 kỹ năng giả) → nút "Tạo truyện · 1 credit" | PASS (fixture) |
| F2 | Tạo → màn "AI đang viết truyện": cú "đang nghĩ", badge "AI đang viết", dòng giải thích; không có thanh % | PASS (fixture) |
| F3 | Trạng thái `failed`: badge "Chưa viết được", lý do, "Thử lại", "Quay lại" | PASS (fixture) |
| F4 | `generate` trả 402 → "Ba mẹ không đủ credit để AI viết truyện này." (`role=alert`) | PASS (fixture) |

**NOT RUN (thật):** tạo truyện thật, phân tích AI thật (`/stories/analyze`), polling thật, hoàn credit khi lỗi thật, mở truyện sau khi viết xong. Cần phê duyệt vì tốn credit/AI.

## 5. QA Android (SW_Test)

| # | Kiểm tra | Kết quả |
|---|---|---|
| A1 | Home → Wizard; "Bước 1 trên 3"; lỗi khi chưa chọn; chọn chuyện mẫu → bước 2 → chọn nhân vật → bước 3 | PASS |
| A2 | Bước 3: giá segmented từ BE, chân trang cố định hiển thị đủ | PASS |
| A3 | Bàn phím mở khi nhập tên truyện: ô nhập, số dư và nút "Tạo truyện · 2 credit" vẫn nhìn thấy trên bàn phím | PASS |
| A4 | Màn 360×640dp: bước 1 (cuộn để thấy danh sách mẫu), bước 3, chân trang không che nội dung | PASS |
| A5 | Android Back: bước 3 → bước 2 → bước 1 (dữ liệu giữ nguyên) → Home | PASS |
| A6 | Vùng chạm, Safe area (thanh gesture không đè nút) | PASS (quan sát ảnh) |

## 6. Accessibility và responsive

- Radio/checkbox có `accessibilityState`/`aria-checked`; nhãn đọc đủ ("Ngắn, 6 trang, 1 credit", "Đặt … làm nhân vật chính"); tiến độ đọc "Bước n trên 3"; lỗi `role=alert`; focus ring bàn phím (Web); `Switch` có nhãn.
- Vùng chạm đo thật trên Web: lối vào 358×113, nút 52, ngôi sao 44×44, hàng nhân vật ≥ 56.
- Màu: chữ trắng (`onStrong`) trên `brandStrong` cho chấm bước; còn lại dùng token R1 (**không đo lại tương phản bằng công cụ** trong R6).
- Reduce Motion: cú dùng Reanimated (tự theo cài đặt hệ thống, xác minh ở R2); **NOT VERIFIED riêng cho R6**. TalkBack/VoiceOver thật: **NOT VERIFIED**.

## 7. Kiểm tra tự động

| Lệnh (từ `apps/mobile`) | Kết quả |
|---|---|
| `npx tsc --noEmit` | PASS |
| `wizard` (mới) / `homeAuth` / `kidUi` / `navigation` / `uiStates` / `authRace` | PASS 6/6, 6/6, 5/5, 11/11, 2/2, 5/5 |
| `npx expo install --check` | PASS |
| `npx expo export --platform web` / `--platform android` | PASS / PASS (chạy trước khi thêm `BackHandler`; sau đó chỉ chạy `tsc` + Metro/Web/Android thật) |

## 8. Hồi quy

PASS (Web): đăng nhập, Home, hero số liệu, tab, Tủ truyện, Hành trình EQ, Kid Mode + PIN qua BE, mở Wizard từ Home. PASS (Android): đăng nhập, Home, Wizard. NOT RUN: đăng xuất/đăng nhập lại, Ví, R4.1 (đọc truyện thật E2E, hoãn), K1.

## 9. Lỗi tìm thấy và đã sửa

| Mã | Vấn đề | Xử lý |
|---|---|---|
| R6-1 (HIGH khi dev) | Nút chính ở chân trang tràn mép phải và **không nhận chạm** (vùng chạm lệch): `HeyButton` bọc `View` không flex nên `flex:1` không tác dụng | Bọc nút trong `View flex:1, minWidth:0`; nút quay lại thành nút icon 56×56 |
| R6-2 | Chữ số bước trên nền cam dùng màu navy (tương phản thấp) | Dùng `onStrong` |
| R6-3 | Android Back rời cả Wizard (mất dữ liệu) | `BackHandler` quay về bước trước; bước 1/đang viết để điều hướng chung |
| (công cụ QA) | Intro che app sau reload; gõ vào nhãn thay vì ô nhập; phím Space kích hoạt nút khi không có ô nào focus; mật khẩu lọt vào ảnh chụp (đã **xóa ảnh**) | Sửa script; ảnh chứa mật khẩu đã xóa khỏi `qa/r6/` và thư mục tạm |

## 10. Vấn đề còn tồn tại

- **CRITICAL / HIGH / MEDIUM:** không có.
- **LOW**
  - Android Back ở bước 1 rời Wizard (hành vi chung của điều hướng, như trước R6); state Wizard không được giữ khi thoát (như trước).
  - Wizard chưa giới hạn bề rộng trên Web ≥ 1024px (thuộc R9).
  - `CharacterFormSheet` dùng `Modal` (Sheet dùng chung) — hoạt động trên cả Web và Android trong QA; chưa kiểm trên máy thật.
- **INFO**
  - Android: sau khi đổi `wm size`/relaunch Expo Go, phiên có lúc bị mất (đã ghi ở QA R5 Q-2); chưa điều tra, không giả định nguyên nhân, không liên quan Wizard.
  - Web: một request `401 /auth/me` xuất hiện trong lần chạy hồi quy (token hết hạn/làm mới); chưa điều tra, không thuộc R6.
  - Lối "Tự viết" vẫn "chưa hỗ trợ" (không đổi).

## 11. Giới hạn tích hợp đã biết

Chưa chạy thật: `POST /stories`, `/stories/analyze`, `/generate`, polling, hoàn credit, mở truyện vừa viết (cần duyệt vì tốn credit/AI). Ảnh minh họa AI không kiểm. iOS, thiết bị thật, TalkBack/VoiceOver, production build: NOT VERIFIED.

## 12. Đề xuất nghiệm thu

Code R6 đủ phạm vi đã duyệt, kiểm tự động sạch, Web + Android chạy thật với dữ liệu BE (đọc/validation), các trạng thái viết truyện chỉ qua **fixture** (ghi rõ). **Đề nghị chủ dự án review**; nghiệm thu đầy đủ cần thêm một lần chạy tạo truyện thật có kiểm soát credit. Chưa đánh dấu "đã nghiệm thu".
