# StoryWeaver Mobile — Hiện trạng

> Cập nhật: 2026-10-27 · Nhánh `refactor/mobile-frontend-cleanup` · Commit Frontend mới nhất `a9160a7` (R9-A).
> Thay thế các báo cáo tiến độ/QA từng đợt (R1–R9-A, Phase A–E, Safety Gate, audit/kế hoạch cũ) đã xóa; bản gốc vẫn khôi phục được từ Git (`git show a9160a7:docs/mobile/<tên-file>`).
> Thang trạng thái: **PASS** (đã chạy thật) · **FIXTURE PASS** (dữ liệu giả trong trình duyệt, không phải E2E) · **NOT RUN** (chủ động không chạy) · **NOT VERIFIED** (thiếu bằng chứng) · **BLOCKED** (bị chặn có bằng chứng).

## 1. Kiến trúc hiện tại

- `apps/mobile`: Expo SDK 52, React Native 0.76.9, React 18.3.1, TypeScript, Reanimated ~3.16; **không** thêm dependency ngoài danh sách đã duyệt.
- **Điều hướng:** state-based (`navigation/routes.ts`, `useParentNavigation`), 5 tab Parent (Trang chủ · Tủ truyện · Sáng tác · Tiến độ · Hồ sơ); Ví là màn con (pill credit ở header). Không Expo Router (ADR-015).
- **State:** `SessionProvider` (auth / kid / parentData contexts), không Zustand (ADR-017).
- **API:** `services/` + `fetch` (`apiClient.apiFetch`, Kid dùng `kidFetch` với kid token riêng). Contract: [API_MAPPING.md](API_MAPPING.md). Địa chỉ: `EXPO_PUBLIC_API_URL` ([ENVIRONMENT.md](ENVIRONMENT.md)).
- **Lưu phiên:** Web = `localStorage`; **native = chỉ bộ nhớ** (`services/storage.ts`) — xem §6.
- **Giao diện:** design system "Warm Storybook Guardian" ([UI_UX_REDESIGN_PLAN.md](UI_UX_REDESIGN_PLAN.md)): token `theme/colors|typography|spacing|shadows|focus`, UI kit `components/ui/*` (HeyButton/Input/Card/Chip, Badge, Icon, Skeleton, Toast, StateView, Sheet, ScreenHeader, **Dialog**).
- **Lớp phủ:** khoá PIN Kid, Trình đọc phụ huynh, hộp thoại Web đều là **lớp phủ trong cây**, **không `<Modal>`** (Modal kẹt 0×0 trên Android New Architecture — lỗi CRIT-1 đã sửa ở R1). `Sheet` (form) vẫn dùng `Modal`.
- **Test tự động (không cần BE):** `apps/mobile/tests/*.test.ts` — 9 bộ, **56 test** (quét mã nguồn + `authRace`); cách chạy: `apps/mobile/tests/README.md`.

## 2. Đã hoàn thành R0–R9-A (Frontend)

| Đợt | Nội dung | Kết quả |
|---|---|---|
| R1 | Token màu/chữ/khoảng cách/bóng, font Comfortaa + Nunito Sans, sửa khoảng trống 48.8dp đầu màn Android (`Screen.tsx`, "HIGH-1"), sửa CRIT-1 khoá PIN | PASS (Web + Android SW_Test) |
| R2 / R2.1 | UI kit: variant ngữ nghĩa, `Pressable` + focus ring bàn phím, `Icon`, `Skeleton`, `Toast` (live region), `StateView` lỗi/rỗng/skeleton | PASS |
| R3 | Khung điều hướng: tab bar 5 mục, top bar (logo, pill credit thật, avatar), màn Hồ sơ; Back Android | PASS |
| R4 | Kid Mode: tủ sách, "Đọc tiếp", Reader trẻ em, thẻ điểm dừng EQ ≥ 56pt, khoá PIN có nhãn trợ năng, Reduce Motion | PASS (tủ sách/PIN thật); Reader **chỉ FIXTURE** (UI Preview) — xem §7 |
| R5 | Parent Home (hero số liệu thật `/children/:id/overview`), Đăng nhập/Đăng ký, mascot (bỏ số liệu bịa, bỏ tiếng cún), URL máy chủ chỉ ở `__DEV__` | PASS |
| R6 | Story Wizard 3 bước, nút "Tạo truyện · N credit" (giá từ BE), cú "đang nghĩ" khi AI chạy | UI PASS; tạo truyện thật **NOT RUN/BLOCKED** |
| R7 | Tủ truyện (lưới, lọc segmented, menu "⋯"), Chi tiết truyện, Trình đọc phụ huynh nền giấy (A−/A+, ẩn điều khiển, Esc/←/→/Back) | PASS (dữ liệu đọc); truyện có chữ/ảnh **FIXTURE** |
| R8 | EQ (mức 3 bậc, không điểm), Ví (chỉ xem), Bé nhà mình, Nhân vật, Cài đặt, Trợ giúp | PASS (đọc); CRUD thật **NOT RUN** |
| R9-A | Hộp thoại Web (`Dialog`), vùng chạm 44 trên Web, nội dung ≤ 720px, phím Space cho radio/checkbox | PASS; xóa thật **NOT RUN** (đã chặn request khi QA) |

## 3. Quyết định UI/UX quan trọng

Phương án A "Warm Storybook Guardian" + Reader nền giấy + nút Kid "có đế"; cam `#FF7A00` (chữ cam trên nền sáng dùng `brandStrong` ≥ 4.9:1), teal `#00A896`, nền kem, chữ navy; vùng chạm Parent ≥ 44pt, Kid ≥ 56pt; không số liệu/thành tích bịa (chỉ dữ liệu BE, thiếu thì hiện "Chưa có dữ liệu"); emoji chỉ là nội dung, icon chức năng là vector; dữ liệu mẫu chỉ trong UI Preview `__DEV__` (ADR-016/020).

## 4. Tính năng chính đã có (Frontend)

Đăng nhập/đăng ký/đăng xuất · chọn bé · Home có số liệu thật · Wizard 3 lối vào (Nhà mình, Chuyện mẫu; "Tự viết" = chưa hỗ trợ) · theo dõi AI viết (polling 3 s) · Tủ truyện/lọc/tìm · Chi tiết + Xem lại + Lên tủ sách · Trình đọc phụ huynh (TTS thiết bị `expo-speech`) · Kid Mode (vào/thoát bằng PIN do BE xác minh) · Reader trẻ em + điểm dừng EQ · Báo cáo EQ · Ví/gói/lịch sử credit (chỉ xem) · CRUD bé/nhân vật · đổi mật khẩu/PIN · Trợ giúp.

## 5. Hạn chế đã xác nhận (còn mở)

| Mức | Vấn đề |
|---|---|
| LOW | Toast bị `Sheet` đè; toast không xếp hàng; toast ở đáy có thể che hàng cuối 3,5 s (chạm để ẩn) |
| LOW | `Sheet` (Modal) chưa kiểm trên máy thật; header Kid chiếm ~12% chiều cao khi đọc |
| LOW | Trình đọc không nhớ cỡ chữ sau khi **khởi động lại app** (trong một phiên thì nhớ) |
| LOW | Nút sm/chip native 36pt + `hitSlop` 44 (Web đã 44 thật) |
| INFO | Ảnh cú dạng huy hiệu có chữ, vỡ ở 34–42px — chờ asset tách nền (A4) |
| INFO | Expo Go luôn bật New Architecture nhưng `app.json` không khai báo `newArchEnabled` (I4) — cần quyết định cấu hình build |
| INFO | `AuthModal` không còn được dùng (giữ, chưa duyệt xóa); màn Seller/Moderator/Admin/Marketplace **SCOPE PENDING**, chỉ chặn bằng state UI (bảo mật: cần kiểm quyền BE nếu mở lại) |
| NOT VERIFIED | TalkBack/VoiceOver thật, iOS, thiết bị Android thật, production build (J1 chỉ kiểm bằng mã/test) |

## 6. Phiên trên Android (R9A-7)

Mở lại Expo Go / tạo lại Activity (đổi `wm size`) → **về màn Đăng nhập**. Nguyên nhân: `safeStorage` trên native chỉ giữ token **trong bộ nhớ**; repo không có `expo-secure-store` / AsyncStorage / MMKV. **Đúng thiết kế hiện tại**, không phải lỗi hồi quy, không phải lỗi BE, không phải K1. Muốn giữ phiên → cần **duyệt dependency + quyết định bảo mật** (đề xuất: refresh token trong `expo-secure-store`, bootstrap qua `/auth/me` sẵn có). Kid Mode không khôi phục sau restart (K1, chưa duyệt).

## 7. R4.1 — Kid Reader ↔ BE thật

**NOT RUN / DEFERRED.** Chưa kiểm: mở truyện thật, điểm dừng EQ do BE chấm, lưu và tiếp tục tiến độ, hoàn thành, ảnh thật. Các bước này **ghi dữ liệu** (`play_sessions`, `checkpoint_answers`) không khôi phục được → chỉ chạy trên tài khoản test. **Bắt buộc xong trước demo/bàn giao.** Ca test: R9B-06 trong [R9B_MANUAL_TEST_PLAN.md](R9B_MANUAL_TEST_PLAN.md). Không tạo DB QA cô lập (phương án cũ chỉ là đề xuất, không hiệu lực).

## 8. Chặn phía Backend/hạ tầng (đã kiểm 2026-10-27)

| Mã | Mức | Vấn đề | Bằng chứng |
|---|---|---|---|
| B-1 | HIGH | Redis không chạy/không cài (cổng 6379 đóng, không Docker) | `ai_requests`: `story_text · failed · ENQUEUE_FAILED: Không đẩy được job vào queue sau 5000ms` (credit đã hoàn) |
| B-2 | HIGH | `AI_SERVICE_URL` thiếu trong `BE/api/.env` → worker không khởi động, `/stories/analyze` không tới AI | `worker.js` `requireEnv` |
| B-3 | HIGH | AI service (`BE/ai`, cổng 8000) không chạy, chưa có `BE/ai/.env` (mặc định mock) | cổng 8000 đóng |
| B-4 | MEDIUM | Gemini chưa cấu hình (`GEMINI_API_KEY`, `GEMINI_TEXT_MODEL`) | `ai/app/config.py` |
| B-5 | MEDIUM | Cloudinary trống → ảnh/audio server không có | `BE/api/.env` |
| B-6 | INFO | Chạy AI `mock` **vẫn trừ credit** (bản ghi có `credits_charged=1`) | `ai_requests` |
| — | — | Không có nạp credit/thanh toán, upload ảnh, return URL payOS cho mobile (ngoài phạm vi, SCOPE PENDING) | audit cũ |
| — | Khuyến nghị BE | Giới hạn sai PIN lưu trong bộ nhớ (reset khi restart BE); chưa rate-limit chung login/register; URL Cloudinary ký không hết hạn | audit bảo mật cũ |

Chi tiết và đề nghị gửi BE: [QA_R9B_READINESS.md](QA_R9B_READINESS.md) §1, §8, §12.

## 9. Sẵn sàng R9-B

Sẵn sàng: Mobile, PostgreSQL, các endpoint đọc, đăng nhập/PIN. **Bị chặn:** tạo truyện AI, phân tích lời kể, credit giữ/hoàn thật (B-1…B-3). Chạy được ngay: ca chỉ xem (R9B-04, R9B-07, R9B-11) và ca ghi không cần AI trên tài khoản test (R9B-08/09/10, cần bạn duyệt). Kế hoạch: [R9B_MANUAL_TEST_PLAN.md](R9B_MANUAL_TEST_PLAN.md).

## 10. Chức năng/độ phủ còn chờ

| Hạng mục | Trạng thái |
|---|---|
| Tạo truyện AI (chuyện mẫu, nhà mình), polling thật, credit giữ/hoàn | BLOCKED (B-1…B-3) |
| Xem lại + lên tủ sách với truyện mới tạo | NOT RUN (cần truyện READY của tài khoản test) |
| Kid Reader thật (R4.1), EQ sau khi đọc thật | NOT RUN |
| CRUD bé/nhân vật, đổi mật khẩu/PIN thật | NOT RUN (cần duyệt) |
| Ảnh AI, giọng đọc server, TTS thiết bị trên máy thật | NOT VERIFIED |
| "Tự viết" (soạn từng trang), sửa trang/điểm dừng | Chưa hỗ trợ trên Mobile |

## 11. Quyết định cần chủ dự án

1. Lưu phiên bền trên native (dependency + bảo mật) — R9A-7.
2. K1: khôi phục Kid Mode sau restart.
3. Phạm vi Seller/Moderator/Admin/Marketplace/Payment (SCOPE PENDING).
4. `newArchEnabled` trong `app.json` (I4); asset cú tách nền (A4).
5. Duyệt từng ca ghi dữ liệu / tốn credit trong R9-B.

## 12. Việc tiếp theo trước demo

1. BE bật Redis + worker + AI service (+ Gemini/Cloudinary nếu cần nội dung thật).
2. Chạy R9-B theo thứ tự trong [R9B_MANUAL_TEST_PLAN.md](R9B_MANUAL_TEST_PLAN.md) (bắt đầu R9B-04).
3. Hoàn tất R4.1 (R9B-06) trên tài khoản test.
4. Sửa lỗi Frontend phát sinh (nếu có), chạy lại 56 test + export, cập nhật tài liệu này.
