# QA R7 — Tủ truyện, Chi tiết truyện, Trình đọc phụ huynh

> **Ngày:** 2026-10-27 · Kế hoạch: [UI_UX_REDESIGN_PLAN.md](UI_UX_REDESIGN_PLAN.md) §5.2 · Tiến độ: [UI_REDESIGN_PROGRESS.md](UI_REDESIGN_PROGRESS.md).
> **Ảnh:** [`qa/r7/`](qa/r7/) (`r7w*` Web, `r7a*` Android SW_Test). Ảnh **`r7w10`, `r7w11–13`, `r7w14–18`, `r7w20–22` là FIXTURE** (dữ liệu giả, xem §5.2). Không có mật khẩu/PIN/token trong ảnh (một ảnh Android từng lộ mật khẩu ở R6 đã xóa; R7 đã quét lại).
> **Trạng thái:** đã triển khai + tự kiểm thử, **chờ chủ dự án review**. Chưa nghiệm thu, chưa commit.

---

## 1. Phạm vi R7 (từ kế hoạch đã duyệt)

Dòng "R7 – Tủ truyện + Story Detail + Reader phụ huynh": lưới bìa sạch, "Thêm vào tủ sách" chuyển vào menu/chi tiết; Reader chế độ giấy, chỉnh cỡ chữ, control ẩn. File: `LibraryScreen.tsx`, `StoryDetailScreen.tsx`, `StoryReaderModal.tsx`. Kèm backlog: B1 (tương phản Reader), F2 (nút lặp trên thẻ, chip lọc rời), C3 (chữ Reader nhỏ), G2 (skeleton). **Không** gồm Bé nhà mình/Nhân vật/Ví/EQ (R8), giới hạn bề rộng Web (R9).

## 2. Môi trường và Git

Nhánh `refactor/mobile-frontend-cleanup`, HEAD `7c2b550` (R6 đã commit), working tree sạch trước R7. Chưa commit/push. BE local `127.0.0.1:3000` (không sửa BE/DB); Expo Web 8082 + Chrome headless (CDP); Android SW_Test (Expo Go) 1080×2400 và 360×640dp. Tài khoản test `qa_r1` (1 bé, 1 truyện nháp "Truyện QA R1" có **6 trang rỗng chữ** thật từ BE). **Không dùng tài khoản demo.**

## 3. Đã triển khai

- **Tủ truyện:** lưới bìa (2/3/4 cột theo bề ngang, ô trống đệm để thẻ cuối không giãn), cả thẻ là một nút mở truyện; bộ lọc **segmented** chọn-một (thay 4 chip rời); nút lặp "Thêm vào tủ sách bé" bỏ khỏi mọi thẻ, chuyển vào menu "⋯" (Sheet: Xem chi tiết / Thêm vào tủ sách của {bé}); lỗi tải = `StateView error`; tìm kiếm/lọc/skeleton giữ nguyên.
- **Chi tiết truyện:** token màu/chữ, nút xếp cột full-width với icon vector, "Đọc thử" nổi bật, trạng thái `loading` thay emoji, lý do `not_reviewed` của BE được dịch ("ba mẹ cần bấm Hoàn tất xem lại"; mã lạ giữ nguyên chữ BE). Mọi hành động/lời gọi BE giữ nguyên.
- **Trình đọc phụ huynh:** nền giấy, tranh 4:3 là trọng tâm, chữ 20/32 mặc định, **A−/A+ (18/20/24/28)**, **chạm vào chữ để ẩn/hiện điều khiển**, nút trang 56pt + "Nghe đọc", thanh tiến độ "Trang n/N". Lớp phủ **trong cây (không `<Modal>`)**, Android Back đóng trình đọc, Web: focus không lọt ra ngoài (inert), ←/→ lật trang, Esc đóng, Tab hiện điều khiển; trình đọc màn hình luôn thấy điều khiển (native). Trang rỗng chữ hiện "(trang chưa có chữ)". Trình đọc **không gọi API** (chỉ xem).
- **B1 (tương phản), tính từ token (`tests/library.test.ts`):** trắng trên `primary` cũ **2.61:1** → `onStrong` trên `brandStrong` **5.18:1**; nhãn chủ đề cũ `primary` trên giấy **2.47:1** → `brandStrong` **4.90:1**; chữ navy trên giấy 13.84:1; mũi tên trắng trên `tealStrong` 5.24:1.

## 4. File thay đổi

| File | Loại |
|---|---|
| `src/screens/parent/LibraryScreen.tsx` | viết lại phần hiển thị |
| `src/screens/parent/StoryDetailScreen.tsx` | restyle + dịch lý do BE |
| `src/components/parent/StoryReaderModal.tsx` | viết lại (không Modal) |
| `src/navigation/ParentTabs.tsx` | **1 dòng**: ẩn thanh tab khi đang đọc (xem lỗi R7-1) |
| `tests/library.test.ts` (mới, 7 test), `tests/README.md` | hồi quy |
| `docs/mobile/QA_R7_REPORT.md`, `UI_REDESIGN_PROGRESS.md`, `qa/r7/` | tài liệu |

Không đụng BE, Web, App_v2, dependency, Auth/phiên, Kid PIN, API contract.

## 5. QA Web (Chrome headless)

### 5.1 Dữ liệu BE THẬT (chỉ GET)

| # | Kiểm tra | Kết quả |
|---|---|---|
| W1 | Tủ truyện: 1 truyện thật, 0 nút "Thêm vào tủ sách bé" trên thẻ, nút "⋯" 44×44, segmented 84×44, 4 radio (`aria-checked`) | PASS |
| W2 | Lọc "Đã viết xong" → "Không có truyện phù hợp"; "Bản nháp" → 1 truyện; tìm không khớp → rỗng | PASS |
| W3 | Menu "⋯" mở Sheet với "Xem chi tiết" + "Thêm vào tủ sách của Bé QA" (**không bấm Thêm: ghi BE**) | PASS |
| W4 | Chi tiết truyện thật (GET `/stories/:id`): ảnh bìa placeholder, badge, nhân vật "(chính)", 4 nút, 6 trang rỗng chữ, ghi chú readiness | PASS |

### 5.2 FIXTURE UI — **không phải E2E thật, không ghi BE**

Trong trình duyệt, response `GET /stories` (thêm 5 truyện giả) và `GET /stories/:id` (thêm 3 trang có chữ + tranh SVG giả) bị sửa. Không bấm "Hoàn tất xem lại"/"Thêm vào tủ sách"/"Cho AI viết".

| # | Kiểm tra | Kết quả |
|---|---|---|
| F1 | Lưới 6 thẻ: 2 cột (390), 2 (320), 3 (768), không tràn ngang ở 320/768/1280; lọc "AI đang viết" ra đúng truyện giả | FIXTURE PASS |
| F2 | Chi tiết: 4 nút hành động, trang, điểm dừng | FIXTURE PASS |
| F3 | Trình đọc: `aria-modal`, "Trang 1/3", chữ 20/32px; A+ → 24/38; A− → 18/29; trang dài (đoạn 5 câu) cuộn trọn vẹn | FIXTURE PASS |
| F4 | Chạm vào chữ → điều khiển mờ hẳn (opacity 0), chạm lại → hiện | FIXTURE PASS |
| F5 | Bàn phím: Tab đi qua Đóng, A−, A+, chữ, Trước, Nghe đọc, Sau (**có focus ring**, không lọt ra nền); ←/→ đổi trang; đóng → ngoài hết `inert` | FIXTURE PASS |
| F6 | Responsive Trình đọc 320/768/1280: không tràn ngang | FIXTURE PASS |
| F7 | Nút "Nghe đọc" đổi nhãn "Dừng đọc" khi bấm (chỉ giao diện; **không** kiểm âm thanh thật) | FIXTURE PASS (giao diện) |

## 6. QA Android (SW_Test, dữ liệu thật)

| # | Kiểm tra | Kết quả |
|---|---|---|
| A1 | Tủ truyện: lưới, segmented, lọc rỗng, tìm; menu "⋯" → Sheet | PASS |
| A2 | Chi tiết truyện thật → "Đọc thử" mở Trình đọc với 6 trang thật (rỗng chữ → "(trang chưa có chữ)") | PASS |
| A3 | Trình đọc: A+/A−, Trang sau → "Trang 2/6", Android Back đóng trình đọc về Chi tiết, thanh tab hiện lại | PASS |
| A4 | 360×640dp: Tủ truyện (cuộn tới "⋯"), Sheet, Trình đọc (nút trang/nghe đọc/tiến độ nhìn thấy đủ) | PASS |
| A5 | **Nghe đọc (TTS thật)** | NOT VERIFIED: trang rỗng chữ; emulator không phát được/không kiểm âm thanh |
| A6 | Tranh minh họa thật | NOT VERIFIED: truyện test không có ảnh |

## 7. Accessibility và responsive

Radio/`aria-checked` ở bộ lọc, thẻ có nhãn "Mở truyện {tên}. {trạng thái}", nút "⋯" có nhãn theo tên truyện, tiến độ trang `role=progressbar`, nút A−/A+ ghi cỡ hiện tại, Trình đọc `aria-modal`, focus ring Web đã đo, vùng chạm: ⋯ 44, segmented 44, nút trang 56, đóng 44. Tương phản tính từ token (§3). Màn 320/360/390/768/1280 không tràn ngang. Reduce Motion: không có animation mới. TalkBack/VoiceOver thật, iOS: **NOT VERIFIED**.

## 8. Kiểm tra tự động (chạy SAU lần sửa mã cuối)

| Lệnh (từ `apps/mobile`) | Kết quả |
|---|---|
| `npx tsc --noEmit` | PASS |
| `library` (mới) / `wizard` / `homeAuth` / `kidUi` / `navigation` / `uiStates` / `authRace` | PASS 7/7, 6/6, 6/6, 5/5, 11/11, 2/2, 5/5 |
| `npx expo install --check` | PASS |
| `npx expo export --platform web` / `--platform android` | PASS / PASS |

Tsc/bundle chỉ chứng minh biên dịch, không thay cho chạy thật ở §5–6.

## 9. Hồi quy

PASS (Web): đăng nhập, Home, tab, Hành trình EQ, mở Wizard từ Home, Kid Mode + PIN sai/đúng qua BE về Home. PASS (Android): đăng nhập, Tủ truyện, Chi tiết, Trình đọc, Back. NOT RUN: đăng xuất/đăng nhập lại, Ví, R4.1, K1.

## 10. Lỗi tìm thấy và đã sửa

| Mã | Mức | Vấn đề | Xử lý |
|---|---|---|---|
| R7-1 | HIGH (Android) | Thanh tab (có `elevation`) nổi lên trên lớp phủ Trình đọc, che nút Trước/Nghe đọc/Sau | Ẩn thanh tab khi đang đọc (`ParentTabs`, 1 dòng) + `elevation` cho lớp phủ; Android kiểm lại PASS |
| R7-2 | MEDIUM | Thẻ truyện đơn giãn kín bề ngang (`flex:1` với 1 thẻ) | Đệm ô trống cho hàng cuối |
| R7-3 | MEDIUM | Nút Chi tiết không giãn (`HeyButton` bọc `View` không flex) | Xếp cột, `alignSelf: stretch` |
| R7-4 | MEDIUM (Web) | Bàn phím Tab lọt ra nền khi Trình đọc mở | `inert` + `aria-hidden` cho phần còn lại, Tab hiện điều khiển |
| R7-5 | MEDIUM (Web) | `react-native-web` luôn báo đang bật trình đọc màn hình → điều khiển không bao giờ ẩn | Bỏ dò trên Web; bàn phím vẫn hiện lại được |
| R7-6 | LOW | Lý do BE `not_reviewed` hiện thô; nhãn "undefined tuổi" tiềm ẩn ở thẻ chủ đề | Dịch lý do; chỉ ghép tuổi khi có |
| (công cụ QA) | | Chọn nhầm nút trùng nhãn; lệch layout khi bàn phím mở; session Android mất khi relaunch | Sửa script, không phải lỗi app |

## 11. Backend/AI dependency và các kịch bản chưa chạy

| Tính năng | Endpoint | Phụ thuộc | Bằng chứng | Trạng thái | Ảnh hưởng | Lý do bỏ qua | FE xong? | Chủ | Việc cần làm |
|---|---|---|---|---|---|---|---|---|---|
| Thêm truyện vào tủ sách bé | `POST /bookshelf` | BE thường, **ghi dữ liệu** | không gọi | NOT RUN | một phần chức năng | ghi vào dữ liệu tài khoản | Có (menu + chi tiết) | Integration QA | Chạy trên tài khoản test có truyện READY; kiểm 422 `not_reviewed` |
| Hoàn tất xem lại | `POST /stories/:id/review` | BE, ghi | không gọi | NOT RUN | một phần | ghi trạng thái truyện | Có | Integration QA | như trên |
| Cho AI viết (từ Chi tiết) | `/generate`, `/generation` | AI worker/Redis, tốn credit | không gọi | NOT RUN | luồng cốt lõi demo | tốn credit/AI | Có (UI từ R6) | BE + QA | Chạy khi BE/AI sẵn sàng và được duyệt |
| Truyện có ảnh/giọng đọc thật | `GET /stories/:id` (cover/scene/audio) | AI ảnh/TTS | truyện test không có ảnh | NOT VERIFIED | hiển thị ảnh thật | không có dữ liệu | Có (placeholder + fixture) | BE/QA | Kiểm với truyện READY thật |
| Nghe đọc (TTS thiết bị) | không (expo-speech) | thiết bị | trang rỗng chữ; không kiểm âm | NOT VERIFIED | tính năng phụ | không có trang có chữ thật | Có | QA thiết bị thật | Thử trên máy Android thật |
| Đọc truyện thật có tiến độ/EQ (Kid) | `/play-sessions`… | BE, ghi | — | NOT RUN (R4.1 hoãn) | cốt lõi, **không thuộc R7** | quy định R4.1 | — | Integration QA | Trước demo, không muộn hơn R9 |

Không có phản hồi lỗi BE nào cản trở R7: các GET (`/stories`, `/stories/:id`, `/children`…) hoạt động bình thường với tài khoản test. Không kết luận Redis/AI hỏng; chỉ **chưa gọi** các endpoint tốn credit/ghi. `401 /auth/me` thấy trong log sau khi tôi xóa phiên (khởi động chưa có token) là hành vi mong đợi.

## 12. Vấn đề còn tồn tại

- **CRITICAL / HIGH:** không có.
- **MEDIUM:** không có.
- **LOW:** hàng thẻ không đều chiều cao khi tiêu đề 1–2 dòng (chân thẻ lệch); Trình đọc chưa ghi nhớ cỡ chữ giữa các lần mở (không lưu trữ); `Sheet` (Modal) chưa kiểm trên máy thật; chưa giới hạn bề rộng ≥ 1024px cho Tủ truyện (R9).
- **INFO:** phiên Android hay mất khi relaunch Expo Go/đổi `wm size` (như QA R5 Q-2, chưa điều tra); ảnh Android `r7a01–04` chụp trước khi đổi tỉ lệ bìa 4:5 → 1:1 (bố cục thẻ khác nhẹ).

## 13. Giới hạn đã biết

Truyện test thiếu chữ/ảnh nên nội dung Trình đọc thật chỉ có khung; nội dung đầy đủ chỉ qua fixture. TTS, ảnh AI, ghi dữ liệu: xem §11. iOS, máy thật, TalkBack/VoiceOver, production build: NOT VERIFIED.

## 14. Đề xuất nghiệm thu

**Nghiệm thu UI/UX: đề nghị có điều kiện, sau review của chủ dự án** (code đủ phạm vi, kiểm tự động sạch, Web + Android chạy thật với dữ liệu BE đọc-chỉ, Trình đọc không ghi dữ liệu). **Nghiệm thu chức năng end-to-end: chưa đủ** do §11. Chưa đánh dấu "đã nghiệm thu".

## 15. Backlog QA hoãn

1. Trên tài khoản test có truyện READY có chữ/ảnh: mở truyện thật trong Trình đọc, Thêm vào tủ sách, Hoàn tất xem lại (kiểm 422 và toast).
2. Nghe đọc bằng TTS trên Android thật.
3. TalkBack: thứ tự đọc của thẻ, menu "⋯", Trình đọc (điều khiển ẩn).
4. R4.1 (Reader trẻ em ↔ BE) trước demo, không muộn hơn R9; K1 chưa duyệt.
