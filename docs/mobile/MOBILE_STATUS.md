# StoryWeaver Mobile — Hiện trạng

> Cập nhật: 2026-11-27 · Nhánh `main` · Commit mới nhất `848c207` (sau GĐ E2b) + thay đổi chưa commit của đợt "Khớp Web trước demo" (§2).
> Lịch sử đợt cũ (R1–R9-A) vẫn ở §2b; chi tiết từng GĐ A–F, E1–E2b: [MOBILE_UPDATE_GAP_ANALYSIS.md](MOBILE_UPDATE_GAP_ANALYSIS.md), lộ trình: [LO_TRINH_MOBILE.md](LO_TRINH_MOBILE.md).
> Thang trạng thái: **PASS** (đã chạy thật) · **FIXTURE PASS** (dữ liệu giả, không phải E2E) · **OWNER_RESERVED** (chờ chủ dự án test thật) · **NOT RUN** · **NOT VERIFIED** · **BLOCKED**.

## 1. Kiến trúc hiện tại

- `apps/mobile`: Expo SDK 52, React Native 0.76.9, React 18.3.1, TypeScript, Reanimated ~3.16; **không** thêm dependency ngoài danh sách đã duyệt.
- **Điều hướng:** state-based (`navigation/routes.ts`, `useParentNavigation`), 5 tab Parent (Trang chủ · Tủ truyện · Sáng tác · Tiến độ · Hồ sơ); Ví là màn con (pill credit ở header). Không Expo Router (ADR-015).
- **State:** `SessionProvider` (auth / kid / parentData contexts), không Zustand (ADR-017).
- **API:** `services/` + `fetch` (`apiClient.apiFetch`, Kid dùng `kidFetch` với kid token riêng). Contract: [API_MAPPING.md](API_MAPPING.md). Địa chỉ: `EXPO_PUBLIC_API_URL` ([ENVIRONMENT.md](ENVIRONMENT.md)).
- **Lưu phiên:** Web = `localStorage`; **native = chỉ bộ nhớ** (`services/storage.ts`) — xem §6.
- **Giao diện:** design system "Warm Storybook Guardian" ([UI_UX_REDESIGN_PLAN.md](UI_UX_REDESIGN_PLAN.md)): token `theme/colors|typography|spacing|shadows|focus`, UI kit `components/ui/*` (HeyButton/Input/Card/Chip, Badge, Icon, Skeleton, Toast, StateView, Sheet, ScreenHeader, **Dialog**).
- **Lớp phủ:** khoá PIN Kid, Trình đọc phụ huynh, hộp thoại Web đều là **lớp phủ trong cây**, **không `<Modal>`** (Modal kẹt 0×0 trên Android New Architecture — lỗi CRIT-1 đã sửa ở R1). `Sheet` (form) vẫn dùng `Modal`.
- **Test tự động (không cần BE):** `apps/mobile/tests/*.test.ts` — **26 bộ** (quét mã nguồn + fetch giả); cách chạy: `apps/mobile/tests/README.md`. Lần chạy 2026-11-27: `tsc --noEmit` PASS, 26/26 bộ PASS.

## 2. Đối chiếu Mobile – Web – BE (rà soát 2026-11-27)

**Kết quả rà soát (`VERIFIED_FROM_SOURCE`, chỉ đọc code, chưa chạy BE thật):**
- Endpoint: mọi endpoint Web gọi (~130) đều có trong service Mobile; các endpoint chỉ Mobile gọi (quên/đặt lại mật khẩu, PIN, `/market/owned`, `/children/:id/eq-report`…) đều có route trong BE.
- Mọi hàm gọi API trong `services/` đều đã gắn vào ít nhất một màn hình (không có API bị bỏ không).
- Màn hình: mỗi trang Web của Phụ huynh, Kid, Admin, Chuyên gia đều có màn tương ứng. Nút Admin / Chuyên gia, Chợ truyện, Bán truyện, Gói & thanh toán khớp Web.

**Đợt "Khớp Web trước demo" (2026-11-27, chủ dự án duyệt, chưa commit) — FIXTURE PASS, `NOT_VERIFIED_AT_RUNTIME`:**

| # | Nội dung | File chính |
|---|---|---|
| 1 | Kid Mode đọc to như Web: lật trang tự đọc giọng của trang (`page.audioUrl`), nút "Nghe lại trang này", nút Tắt/Bật tiếng ở thanh trên, câu "Hết truyện" (`prompt.story_end`). Không phát được file (Expo Go SDK 52 thiếu `expo-audio`, truyện tắt giọng đọc) → đọc chữ bằng giọng máy (`speechTTS`); các nút "Nghe" ở điểm dừng cũng dùng cách này | `screens/kid/useKidUiAudio.ts`, `utils/kidUiAudio.ts`, `components/kid/KidReader.tsx`, `screens/kid/KidModeScreen.tsx` |
| 2 | "Kể chuyện nhà mình": thêm "Chỉ kể truyện, không chấm điểm" (`scored: false`), "Đổi kỹ năng" (chọn 1–2 kỹ năng con → `POST /stories/analyze { subSkillIds }`), "Sửa lời kể", dòng "Truyện sẽ thêm" (`seedEvent`) | `screens/parent/StoryWizard.tsx`, `components/parent/SubSkillPickerSheet.tsx` |
| 3 | Chọn giọng đọc của bé trong form hồ sơ (`preferredVoice`, null = giọng mặc định); Chi tiết bé hiện nhãn tiếng Việt | `components/parent/ChildFormSheet.tsx`, `constants/voices.ts`, `services/childService.ts` |
| 4 | Hành trình EQ: "Tạo truyện" ở gợi ý chuyện mẫu → Wizard lối Chuyện mẫu đã chọn sẵn | `screens/parent/EqReportScreen.tsx`, `navigation/{ParentTabs.tsx,routes.ts}` |
| 5 | Nhân vật gia đình: hiện `n/giới hạn` theo gói (`GET /subscriptions/me`), đủ thì khoá "Thêm nhân vật" + lối "Xem Gói & Credit" | `screens/parent/CharactersScreen.tsx` |

Test: cập nhật `kidUiAudio`, `wizard`, `storyMedia`; thêm `webParity.test.ts`.

**Còn khác Web (có chủ đích hoặc chưa làm):**
- Xuất CSV tài chính (Admin) chỉ có trên Web (màn Mobile ghi rõ).
- Khác chỗ đặt nút, đủ chức năng: "Đăng bán truyện này" (Web: trong trình sửa truyện; Mobile: Bán truyện → "Đăng truyện mới"); PIN Kid Mode (Web: trang Bé; Mobile: Cài đặt); sau khi tạo truyện AI, Mobile hiện màn "AI đang viết" rồi mở Chi tiết truyện (Web mở trình sửa ngay).
- Giọng máy là phần dự phòng riêng của Mobile (Web chỉ phát file BE).

## 2b. Lịch sử: đã hoàn thành R0–R9-A (Frontend)

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

- **Phụ huynh:** đăng nhập/đăng ký/quên mật khẩu/xác minh email · chọn bé · Home số liệu thật + truyện chờ xem lại · Wizard 3 lối (Nhà mình, Chuyện mẫu, Tự viết) + tranh AI + giọng đọc · Sửa truyện (trang, điểm dừng, bìa, hoàn tất, xoá) · tranh/giọng đọc/thử lại · Tủ truyện, tủ sách từng bé · Trình đọc phụ huynh · Hành trình EQ · Bé nhà mình, Nhân vật + chân dung AI · Gói & Credit, mua/gia hạn qua payOS, lịch sử thanh toán, hoàn tiền · Chợ truyện (mua, nhận miễn phí, đánh giá, báo cáo) · Bán truyện (hồ sơ, đăng bán, phiên bản, doanh thu, ngân hàng, rút tiền, cảnh cáo + kháng nghị, trả lời đánh giá) · Cài đặt (mật khẩu, PIN) · Trợ giúp + Chính sách/Điều khoản.
- **Kid Mode:** tủ sách, đọc tiếp, Reader + điểm dừng EQ, đọc to (§2), thoát bằng PIN do BE xác minh.
- **Admin:** Tổng quan, Việc chờ, Tài khoản, Rút tiền, Hoàn tiền, Kháng nghị, Nhật ký, Gói & định giá (+ cài đặt `market`/`moderation`), Doanh thu & đối soát, Cấu hình AI.
- **Chuyên gia:** Hàng chờ/Tổng quan, Lượt duyệt, Hồ sơ người bán, Báo cáo vi phạm, Truyện tạm gỡ, Cảnh cáo, Kiểm tra ngẫu nhiên, Cảnh báo AI, Chuyện mẫu, Kỹ năng con, Mẫu câu hỏi, Soát câu hỏi AI, Tham số báo cáo, Từ khoá chặn.

## 5. Hạn chế đã xác nhận (còn mở)

| Mức | Vấn đề |
|---|---|
| LOW | Toast bị `Sheet` đè; toast không xếp hàng; toast ở đáy có thể che hàng cuối 3,5 s (chạm để ẩn) |
| LOW | `Sheet` (Modal) chưa kiểm trên máy thật; header Kid chiếm ~12% chiều cao khi đọc |
| LOW | Trình đọc không nhớ cỡ chữ sau khi **khởi động lại app** (trong một phiên thì nhớ) |
| LOW | Nút sm/chip native 36pt + `hitSlop` 44 (Web đã 44 thật) |
| INFO | Ảnh cú dạng huy hiệu có chữ, vỡ ở 34–42px — chờ asset tách nền (A4) |
| INFO | Expo Go luôn bật New Architecture nhưng `app.json` không khai báo `newArchEnabled` (I4) — cần quyết định cấu hình build |
| INFO | `AuthModal` không còn được dùng (giữ, chưa duyệt xóa) |
| INFO | Expo Go SDK 52 không có `expo-audio`: Kid Mode chỉ có giọng máy; file giọng đọc của BE chỉ phát trên bản build (APK / development build) |
| INFO | payOS trả về trang **Web** sau thanh toán; ba mẹ tự quay lại app rồi bấm "Kiểm tra thanh toán" (đề xuất BE ở `LO_TRINH_MOBILE.md` §6) |
| NOT VERIFIED | TalkBack/VoiceOver thật, iOS, thiết bị Android thật, production build (J1 chỉ kiểm bằng mã/test) |

## 6. Phiên trên Android (R9A-7)

Mở lại Expo Go / tạo lại Activity (đổi `wm size`) → **về màn Đăng nhập**. Nguyên nhân: `safeStorage` trên native chỉ giữ token **trong bộ nhớ**; repo không có `expo-secure-store` / AsyncStorage / MMKV. **Đúng thiết kế hiện tại**, không phải lỗi hồi quy, không phải lỗi BE, không phải K1. Muốn giữ phiên → cần **duyệt dependency + quyết định bảo mật** (đề xuất: refresh token trong `expo-secure-store`, bootstrap qua `/auth/me` sẵn có). Kid Mode không khôi phục sau restart (K1, chưa duyệt).

## 7. R4.1 — Kid Reader ↔ BE thật

**NOT RUN / DEFERRED.** Chưa kiểm: mở truyện thật, điểm dừng EQ do BE chấm, lưu và tiếp tục tiến độ, hoàn thành, ảnh thật. Các bước này **ghi dữ liệu** (`play_sessions`, `checkpoint_answers`) không khôi phục được → chỉ chạy trên tài khoản test. **Bắt buộc xong trước demo/bàn giao.** Ca test: R9B-06 trong R9B_MANUAL_TEST_PLAN.md (tài liệu chưa có trong repo). Không tạo DB QA cô lập (phương án cũ chỉ là đề xuất, không hiệu lực).

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

Chi tiết và đề nghị gửi BE: QA_R9B_READINESS.md (tài liệu chưa có trong repo) §1, §8, §12.

## 9. Việc tiếp theo trước demo (GĐ G — chủ dự án)

1. Review và commit đợt "Khớp Web trước demo" (§2).
2. Chạy thật trên Android (Expo Go SDK 52 hoặc APK) với BE deploy, tài khoản demo: Kid Mode đọc to + tắt tiếng; Wizard "Chỉ kể truyện" / "Đổi kỹ năng"; giọng đọc của bé; "Tạo truyện" từ Hành trình EQ; giới hạn nhân vật — đều `OWNER_RESERVED`.
3. Ma trận test thật theo vai trò (Phụ huynh, Kid, Admin, Chuyên gia) cho các GĐ A–F, E1–E2b (hiện đều FIXTURE PASS).
4. Thao tác tốn credit / giao dịch (tạo truyện AI, tranh, chân dung, payOS, rút/hoàn tiền) chỉ chạy trên tài khoản demo, do chủ dự án làm.

## 10. Quyết định cần chủ dự án

1. Lưu phiên bền trên native (dependency + bảo mật) — R9A-7: thoát app là mất phiên, ảnh hưởng demo.
2. K1: khôi phục Kid Mode sau restart.
3. `newArchEnabled` trong `app.json` (I4); asset cú tách nền (A4).
4. Demo bằng Android (iPhone không chạy Expo Go SDK 52).
