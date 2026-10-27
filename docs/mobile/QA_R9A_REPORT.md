# QA R9-A — Hoàn thiện Frontend, sửa lỗi còn lại, hồi quy toàn bộ

> **Ngày:** 2026-10-27 · Kế hoạch: [UI_UX_REDESIGN_PLAN.md](UI_UX_REDESIGN_PLAN.md) §5.2 R9 (phần R9-A) · Tiến độ: [UI_REDESIGN_PROGRESS.md](UI_REDESIGN_PROGRESS.md).
> **Ảnh:** [`qa/r9a/`](qa/r9a/) (`r9aw*` Web, `r9aa*` Android). **`r9aw03` là FIXTURE** (lỗi 422 giả). Không có mật khẩu/PIN/token trong ảnh.
> **Trạng thái:** đã triển khai + tự kiểm thử, **chờ chủ dự án review**. Chưa commit.

---

## 1. Phạm vi R9-A

Sửa lỗi Frontend còn lại, responsive, a11y, vùng chạm, điều hướng/overlay, hồi quy R1–R8. **Không** gồm R9-B (AI thật, credit thật, R4.1, EQ thật, ghi DB, thanh toán): xem §18.

## 2. Git preflight

Nhánh `refactor/mobile-frontend-cleanup`, HEAD `046a458` (R8 đã commit), working tree sạch trước R9-A. Chưa commit/push.

## 3. Audit ban đầu → lỗi xác nhận

| ID | Mức | Màn/file | Mô tả | Trạng thái |
|---|---|---|---|---|
| R9A-1 | **HIGH (Web)** | 11 chỗ gọi `Alert.alert` (ParentTabs ×3, StoryDetail ×2, Children ×2, Characters ×2, `useKidSession` ×2) | **Nguyên nhân gốc:** `react-native-web` cài `Alert.alert` là **hàm rỗng** (`class Alert { static alert() {} }`, đọc từ `node_modules/react-native-web/dist/exports/Alert/index.js`). Trên Web: xác nhận xóa không hiện (xóa không bao giờ chạy), **mọi lỗi BE (vd 422 khi thêm vào tủ sách/hoàn tất xem lại), "chưa hỗ trợ", "không vào được Chế độ Bé" đều im lặng**. Android không bị. | ĐÃ SỬA |
| R9A-2 | MEDIUM (Web) | `HeyButton size="sm"`, `HeyChip` | Cao 36 trên Web (hitSlop không có tác dụng trên Web) | ĐÃ SỬA |
| R9A-3 | MEDIUM (Web) | Mọi màn Parent | Không giới hạn bề rộng nội dung (thẻ giãn kín màn 1280) | ĐÃ SỬA |
| R9A-4 | LOW (Web) | Chip/segmented/Wizard (radio, checkbox) | Phím **Space** không kích hoạt (RN-web chỉ cho Space với `role=button`) | ĐÃ SỬA |
| R9A-5 | LOW | `AuthModal` | Còn hiện địa chỉ máy chủ ngoài `__DEV__` (component hiện **chưa được import** ở đâu) | ĐÃ SỬA (phòng ngừa) |
| R9A-6 | LOW | `LibraryScreen` | Chân thẻ lệch khi tiêu đề 1–2 dòng | ĐÃ SỬA (`cardMain flex:1`); **FIXTURE PASS** (§20) |
| R9A-11 | LOW (Web) | `Dialog.tsx` (phát hiện khi review trước commit) | Hai hộp thoại nối tiếp trong hàng đợi dùng lại cùng một `WebDialog` → cờ `done`/focus/`inert` của hộp trước có thể kẹt | ĐÃ SỬA (`key={current.id}`); PASS (§20) |

## 4. Đã sửa

- **R9A-1:** thêm `components/ui/Dialog.tsx` (`DialogProvider`, `useDialog().confirm/notify`, cầu nối `notifyDialog` cho store ở trên Provider). **Native vẫn dùng `Alert.alert`** của hệ điều hành; **Web dùng lớp phủ trong cây** (không `<Modal>`): nút Hủy lấy focus đầu, Tab xoay vòng trong hộp thoại, nền `inert`, Esc = Hủy, chạm nền = Hủy, trả focus khi đóng, resolve **đúng một lần**; nút xóa dạng `danger`. 11 chỗ `Alert.alert` chuyển sang `dialog.confirm/notify`; xóa bé/nhân vật chỉ gọi BE **sau** `confirm → if (!ok) return`, vẫn chặn bấm đúp (`deletingId`).
- **R9A-2:** `sm` và chip cao 44 trên Web (native giữ 36 + `hitSlop` 44).
- **R9A-3:** `ParentTabs` `main` có `maxWidth: Layout.maxContentWidth (720)` + căn giữa; số cột Tủ truyện/Nhân vật tính theo bề rộng nội dung (≤ 720: 2 hoặc 3 cột).
- **R9A-4:** `utils/keyboard.ts` `spaceActivates` áp dụng cho `HeyChip`, segmented Tủ truyện, lựa chọn/segment/checkbox/ngôi sao ở Wizard.
- **R9A-5:** gói `__DEV__` ở `AuthModal`.

## 5. Chưa sửa / quyết định cần bạn

| ID | Mức | Vấn đề | Lý do | Cần quyết định |
|---|---|---|---|---|
| R9A-7 | INFO (thiết kế) | **Android: phiên mất khi khởi động lại Expo Go / tạo lại Activity (đổi `wm size`).** | Xem §11: do `safeStorage` trên native **chỉ giữ trong bộ nhớ** (không lưu bền), **không phải lỗi mới và không do K1** | Muốn lưu phiên Parent giữa các lần mở app → cần package lưu bền (AsyncStorage/SecureStore) = **dependency mới + quyết định bảo mật, chưa được duyệt**. Đề xuất tách riêng, không làm trong R9-A |
| R9A-8 | LOW | Toast bị Sheet đè, toast không xếp hàng (QA R2 LOW-2/3) | không phát sinh lỗi trong QA R9-A; không đụng | Để sau |
| R9A-9 | INFO | Mascot nhỏ (34–42px) vỡ chữ trên huy hiệu (A4) | cần asset tách nền | Chờ asset |
| R9A-10 | INFO | Cỡ chữ Reader mất khi **khởi động lại app** | **Không tái hiện** trong một phiên: cỡ chữ giữ khi đóng/mở lại Reader (§9); chỉ mất khi app khởi động lại (cùng gốc R9A-7) | cùng R9A-7 |

## 6. File thay đổi

`App.tsx` (bọc `DialogProvider`), `src/components/ui/Dialog.tsx` (mới), `src/utils/keyboard.ts` (mới), `src/components/ui/{HeyButton,HeyChip}.tsx`, `src/components/auth/AuthModal.tsx`, `src/navigation/ParentTabs.tsx`, `src/screens/parent/{CharactersScreen,ChildrenScreen,LibraryScreen,StoryDetailScreen,StoryWizard}.tsx`, `src/stores/useKidSession.ts`, `tests/r9a.test.ts` (mới), `tests/manage.test.ts` (cập nhật kỳ vọng `dialog.confirm`), `tests/README.md`, `docs/mobile/QA_R9A_REPORT.md`, `UI_REDESIGN_PROGRESS.md`, `qa/r9a/`. Không đụng BE, Web, App_v2, dependency, Auth/phiên, Kid PIN, API contract.

## 7. Kiểm tra tự động (chạy SAU lần sửa mã cuối)

| Lệnh (từ `apps/mobile`) | Kết quả |
|---|---|
| `npx tsc --noEmit` | PASS |
| `r9a` (mới) / `manage` / `library` / `wizard` / `homeAuth` / `kidUi` / `navigation` / `uiStates` / `authRace` | PASS 7/7, 7/7, 7/7, 6/6, 6/6, 5/5, 11/11, 2/2, 5/5 (**56 test**; bản trước ghi nhầm 57) |
| `npx expo install --check` | PASS |
| `npx expo export --platform web` / `--platform android` | PASS / PASS |

Lưu ý: lần chạy đầu `manage` FAIL vì kỳ vọng cũ `Alert.alert(`; đã cập nhật test cho đúng thiết kế mới (chỉ đổi test, không đổi mã nguồn) rồi chạy lại PASS.

## 8. QA Web (Chrome headless; BE thật chỉ đọc)

**Request ghi bị chặn trong trình duyệt** (`DELETE /children|characters`, `POST /bookshelf` → trả dữ liệu giả, BE **không nhận**).

| # | Kiểm tra | Kết quả |
|---|---|---|
| W1 | Xóa bé: mở hộp thoại "Xóa hồ sơ của Bé QA?", focus ở **Hủy**; Tab xoay vòng Xóa↔Hủy (không ra nền); nền `inert` | PASS |
| W2 | Esc → đóng, trả focus về nút "Xóa", **0 request DELETE**; mở lại → Hủy → **0 request** | PASS |
| W3 | Xác nhận + **bấm đúp** → đúng **1** request DELETE (đã chặn, trả giả) | PASS (FIXTURE: không xóa thật) |
| W4 | Xóa nhân vật: hộp thoại đúng tên; Hủy → 0 request | PASS |
| W5 | Lỗi BE trên Web: thêm vào tủ sách trả 422 giả → hộp thoại "Chưa thêm được | <lời BE> | Đã hiểu" (trước đây im lặng) | FIXTURE PASS |
| W6 | Vùng chạm đo thật: Sửa/Xóa nhân vật 76×**44**, Tải lại 90×**44**, Quay lại 44×44 | PASS |
| W7 | Space trên radio segmented → `aria-checked=true` | PASS |
| W8 | Reader: cỡ chữ giữ sau đóng/mở lại (truyện thật, chỉ xem) | PASS |
| W9 | 9 màn × 6 bề rộng (320/360/390/768/1024/1280): **không tràn ngang**; ≥ 768 nội dung = **720px** (Home, EQ, Ví, Cài đặt đo được; Tủ truyện/Nhân vật xem ảnh 1024/1280) | PASS |
| W10 | Hồi quy R5–R8 (chạy lại script cũ): Home/Kid Mode + PIN sai/đúng, Wizard bước/lỗi, Tủ truyện, Chi tiết, Trình đọc (fixture), EQ/Ví/Bé/Nhân vật/Cài đặt/Trợ giúp | PASS |

## 9. QA Android (SW_Test, dữ liệu thật; không bấm xác nhận xóa)

| # | Kiểm tra | Kết quả |
|---|---|---|
| A1 | Xóa bé và nhân vật: hộp thoại **`Alert` hệ điều hành** hiện, HỦY → vẫn còn dữ liệu (không đổi hành vi) | PASS |
| A2 | Kid Mode vào được; "Thoát" hiện **lớp phủ PIN trong cây**; Back đóng lớp phủ, vẫn ở Kid Mode | PASS |
| A3 | Trình đọc: Back đóng; Wizard: Back về Home | PASS |
| A4 | Khởi động lại Expo Go → về Đăng nhập (xem §11) | PASS (xác nhận hành vi) |
| A5 | Màn 360×640dp lần này | **NOT RUN** (không đổi bố cục native; đã PASS ở R6–R8) |
| A6 | Xóa thật, hộp thoại lỗi Web trên Android | NOT RUN |

## 10. Accessibility

Dialog: `role=alert` + `aria-modal`, nhãn = tiêu đề, focus trong hộp, Esc, trả focus; nút xác nhận có nhãn. Vùng chạm Web đã đo 44. Space cho radio/checkbox. Reader inert (R7) đã kiểm lại ở chuỗi hồi quy. TalkBack/VoiceOver thật, iOS: **NOT VERIFIED**.

## 11. Android — điều tra mất phiên (R9A-7)

**Bằng chứng:**
1. `src/services/storage.ts`: `safeStorage` chỉ dùng `localStorage` khi **Web**; trên **native chỉ có `memoryStore`** (đối tượng trong bộ nhớ JS). Token (`ACCESS/REFRESH_TOKEN`) lưu qua `safeStorage` (`authService.ts`).
2. `package.json` không có `@react-native-async-storage`, `expo-secure-store`, `mmkv` → **không có kho lưu bền**.
3. Tái hiện (Android, 2 lần): đăng nhập → `force-stop` + mở lại Expo Go → **màn Đăng nhập**. Web: tải lại trang vẫn giữ phiên (localStorage).
4. Đổi `wm size` tạo lại Activity/JS context → mất bộ nhớ → Đăng nhập (đã quan sát ở R5–R8).

**Kết luận:** thuộc loại **(1) đăng xuất mong đợi vì thiết kế hiện chỉ lưu phiên trong bộ nhớ** (kèm (3) hành vi Expo Go khi tải lại). **Không phải lỗi hồi quy**, không phải lỗi BE, **không phải K1**. Không sửa vì cần package lưu bền (chưa duyệt). **Đề xuất** (cần duyệt riêng): lưu refresh token bằng `expo-secure-store`, bootstrap qua `/auth/me` đã có; Kid Mode vẫn không khôi phục (K1 riêng).

## 12. Responsive audit

Xem W9. Ảnh: `r9aw_{library,characters,wallet,wizard}_{1024,1280}`. Header và thanh tab giữ như R3 (header full-width, tab bar tối đa 720).

## 13. Hồi quy R1–R8

Web: Auth (Login/validation), Home, 5 tab, Kid Mode + PIN (BE 401/200), Wizard (lỗi bước, giá từ BE), Tủ truyện (lọc/tìm/menu), Chi tiết, Trình đọc, EQ/Ví/Bé/Nhân vật/Cài đặt (validation chỉ phía máy khách)/Trợ giúp: PASS. Android: đăng nhập, Hồ sơ → các mục, Kid + PIN overlay, Reader, Wizard, Back: PASS. NOT RUN: đăng xuất/đăng nhập lại, Auth Register end-to-end.

## 14. Backend/AI bỏ qua (R9-B)

Không chạy: sinh truyện AI, ảnh/TTS AI, credit trừ/hoàn, thanh toán, tạo/xóa bé/nhân vật thật, đổi mật khẩu/PIN, review/thêm tủ sách thật, tiến độ đọc/EQ Kid. Chỉ GET thật; mọi request ghi bị chặn trong trình duyệt (§8). Không có lỗi BE nào cản R9-A; một `401 /auth/me` khi khởi động chưa có token là bình thường.

## 15. Rủi ro còn lại

- **CRITICAL/HIGH/MEDIUM:** không còn.
- **LOW:** toast/Sheet (R9A-8); `Sheet` Modal chưa kiểm máy thật; Android 360×640 chưa chạy lại ở R9-A.
- **INFO:** R9A-7, R9A-9, R9A-10.

## 16. Đề xuất nghiệm thu

**Frontend R9-A: đề nghị nghiệm thu có điều kiện sau review** (lỗi HIGH Web R9A-1 đã sửa và kiểm bằng chặn request; vùng chạm/responsive/Space đạt; 56 test PASS). **Chưa phải nghiệm thu E2E**: toàn bộ §18 còn MANUAL PENDING. Chưa đánh dấu "đã nghiệm thu".

## 17. Gợi ý commit

`fix(mobile): complete R9-A web dialogs, touch targets, responsive width and keyboard fixes` (kèm `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`).

## 18. Bàn giao R9-B — test thủ công (MANUAL PENDING, chưa chạy)

Quy ước chung: dùng **tài khoản test riêng** (không dùng tài khoản demo), BE/AI/Redis đang chạy, chuẩn bị ghi lại ảnh (che mật khẩu/PIN/token). Kết quả thực tế để trống; trạng thái ban đầu **MANUAL PENDING**; mọi ca cần chủ dự án duyệt trước khi chạy vì có tác dụng phụ.

| ID | Mục tiêu | Điều kiện | Các bước | Kết quả mong đợi | Tác dụng phụ | Bằng chứng |
|---|---|---|---|---|---|---|
| R9B-01 | Tạo truyện AI (Chuyện mẫu) | AI worker + Redis chạy; tài khoản test còn ≥ 1–3 credit; ≥ 1 nhân vật | Sáng tác → Chuyện mẫu → chọn mẫu → chọn nhân vật chính → Ngắn → đặt tên → "Tạo truyện · N credit" | Truyện nháp được tạo; màn "AI đang viết" (cú nghĩ) → poll → READY; mở được truyện | **Tốn credit/AI**, tạo truyện | ảnh từng bước + log BE |
| R9B-02 | Phân tích lời kể (Nhà mình) | như trên | Nhà mình → nhập ≥ 20 ký tự → "Xem bé sẽ tập gì" → xác nhận tạo | Thẻ "Bé sẽ tập gì?" từ BE; tạo + viết như R9B-01 | AI + credit | ảnh + log |
| R9B-03 | Credit giữ/hoàn | sau R9B-01/02 | So số dư trước/sau; thử một ca lỗi (nếu BE cho) → kiểm "Hoàn credit" trong lịch sử Ví | Trừ đúng giá `ai-pricing`; hoàn khi lỗi; lịch sử khớp | credit | ảnh Ví trước/sau |
| R9B-04 | Trình đọc phụ huynh truyện thật | truyện READY có ảnh + giọng | Chi tiết → Đọc thử; đổi trang; A−/A+; Nghe đọc | Chữ + tranh đúng; TTS phát (máy thật); Back/Esc đóng | không (chỉ xem) | ảnh + ghi âm ngắn |
| R9B-05 | Review + thêm tủ sách | truyện READY; bé đã có | Hoàn tất xem lại; Thêm vào tủ sách của bé | Toast thành công; truyện hiện ở Kid; 422 hiển thị đúng lời BE (hộp thoại) | ghi trạng thái truyện/tủ sách | ảnh + log |
| R9B-06 | Kid Reader (R4.1) | truyện đã lên tủ sách; PIN đã đặt | Vào Chế độ Bé → mở truyện → đọc → trả lời điểm dừng EQ → thoát giữa chừng → vào lại (tiếp tục) → đọc hết | Nội dung thật; câu trả lời được BE chấm; tiến độ lưu và tiếp tục đúng; màn hoàn thành | ghi tiến độ, câu trả lời EQ | ảnh + log |
| R9B-07 | Báo cáo EQ thật | sau R9B-06 | Tiến độ → xem 5 năng lực | Mức khớp dữ liệu BE; không số liệu bịa | không | ảnh + response `eq-report` |
| R9B-08 | Quản lý bé | tài khoản test | Thêm bé (kiểm giới hạn gói) → Sửa → Xóa (xác nhận bằng hộp thoại R9-A) | CRUD đúng; 422 giới hạn gói hiển thị; xóa chỉ sau xác nhận | tạo/sửa/xóa bé | ảnh + log |
| R9B-09 | Quản lý nhân vật | tài khoản test | Thêm → Sửa → Xóa (nhân vật thường; nhân vật của bé không có Xóa) | CRUD đúng | ghi nhân vật | ảnh + log |
| R9B-10 | Đổi mật khẩu & PIN | tài khoản test riêng | Cài đặt → đổi mật khẩu (đăng nhập lại bằng mật khẩu mới); đặt/đổi PIN; thoát Kid bằng PIN mới | Thành công; PIN sai bị BE từ chối | đổi bí mật tài khoản test | ảnh (che bí mật) |
| R9B-11 | Phiên Android | thiết bị/emulator | Đăng nhập → đóng/mở lại app | Hiện trạng: về Đăng nhập (xem R9A-7); ghi nhận sau quyết định lưu phiên | không | ghi chú |

## 19. Backlog sau R9-A

R9A-7 (quyết định lưu phiên bền), R9A-8, R9A-9 (asset), Android 360×640 chạy lại, TalkBack/VoiceOver thật, iOS.

## 20. Rà soát trước commit (cùng ngày)

| Hạng mục | Cách kiểm | Kết quả |
|---|---|---|
| Tổng số test | Chạy lại 9 bộ, cộng số `OK n/n` từ output | **56** (7+7+7+6+6+5+11+2+5). Báo cáo trước ghi nhầm 57 → đã sửa §7, §16 |
| R9A-6 chân thẻ | Web, **FIXTURE** sửa `GET /stories` (thêm truyện tiêu đề 1 dòng và 2 dòng cùng hàng), đo vị trí nút "⋯" theo hàng | Mọi hàng thẳng: 390px (511/511, 796/796, 1081/1081), 768px (559×3, 893×3). Ảnh `r9aw04_cards_footer_390_fixture`, `…_768_fixture` — **FIXTURE PASS** |
| `useKidSession.ts` | `git diff` | Chỉ đổi 3 dòng: `import { Alert }` → `notifyDialog`, 2 lời gọi `Alert.alert` → `notifyDialog` (cùng tiêu đề/nội dung). **Không đổi** `authService.enterKidMode`, chặn vào trùng (`enteringRef`), điều kiện chọn bé, xác minh PIN (vẫn ở BE/`KidPinOverlay`), hợp đồng API |
| `DialogProvider` + 11 lời gọi | Đọc mã | Native vẫn `Alert.alert` (`onDismiss` = Hủy); nội dung thông báo giữ nguyên; xóa chỉ chạy sau `confirm`. **Phát hiện R9A-11** (hộp nối tiếp dùng lại instance) → sửa bằng `key` |
| R9A-11 sau sửa | Web, DELETE `/children/*` bị chặn trả **500 giả**: xác nhận Xóa → hộp "Không xóa được hồ sơ" mở mới → "Đã hiểu" đóng | PASS: 1 request (giả), hộp thứ hai đóng được, không còn `inert`, bé vẫn trong danh sách. Ảnh `r9aw05_delete_error_chain_fixture` |
| Hồi quy Dialog sau sửa | Chạy lại `w_r9a` (xóa bé/nhân vật, Esc, Tab, bấm đúp, thông báo 422 giả, vùng chạm, Space, 9 màn × 6 bề rộng) | PASS như §8; 0 tràn ngang |
| Kiểm tĩnh sau lần sửa mã cuối | `tsc --noEmit`, 9 bộ test, `expo install --check`, export web + android | PASS |
| Android sau sửa R9A-11 | — | **NOT RUN**: thay đổi chỉ ở nhánh Web (`Platform.OS === 'web'`), native vẫn `Alert` (đã PASS §9) |

Không chạy request ghi nào tới BE, không AI, không R9-B.
