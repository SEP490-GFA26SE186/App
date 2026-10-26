# IMPLEMENTATION PLAN – StoryWeaver Mobile

**Phiên bản roadmap:** **v2 (điều chỉnh 2026-10-26)** – thứ tự **S → A → B → C → D → E** (xem "ROADMAP v2" bên dưới). Task gốc T1.x–T9.x **giữ nguyên ID/nội dung** ở Phụ lục.
**Trạng thái hiện tại:**
- **M0, T1.0: HOÀN TẤT** (người dùng xác nhận). Kết quả T1.0 ở [AUDIT_REPORT §5](./AUDIT_REPORT.md) (M01–M90).
- **T1.3: đã commit `3379fed` – DONE-STATIC (tsc, `git diff --check`, grep đạt) – RUNTIME CHƯA PASS** (chưa chạy app/BE, U1). Còn lại: T1.3a (HeyInput `autoCapitalize`), T3.1b (validate response `register`).
- **Safety Gate (S0.1–S0.7, G-DEMO): DONE-STATIC** (chi tiết và giới hạn: [SAFETY_GATE_PROGRESS.md](./SAFETY_GATE_PROGRESS.md)); **RUNTIME CHƯA KIỂM THỬ**. Các task còn lại: NOT STARTED – chỉ chạy khi có lệnh của người dùng.
- **Roadmap v2: ĐÃ PHÊ DUYỆT CÓ ĐIỀU KIỆN (2026-10-26)** – điều kiện ở "§0". Safety Gate đã hoàn tất mức tĩnh; **chưa bắt đầu Phase A**, chờ người dùng review.
**Quyết định đã duyệt:** giữ Expo SDK 52 (A) · App là repo chính · Parent + Kid = P0 · Seller/Specialist/Admin/Marketplace/Payment = SCOPE PENDING · không xóa tính năng hiện có · không bắt buộc Expo Router / nâng SDK chỉ vì App_v2 dùng công nghệ khác.

## Quy tắc chung
- Mỗi task nhỏ, có acceptance criteria (AC); làm xong → dừng báo cáo → người dùng review.
- Dependency chỉ cài khi task ghi rõ và được duyệt, bằng `npx expo install` (SDK 52).
- Không sửa Web/BE/App_v2. Không commit/push nếu chưa yêu cầu.
- Mỗi task: `npx tsc --noEmit` pass + grep xác nhận không còn mock liên quan.
- Tham chiếu: [API_MAPPING](./API_MAPPING.md), [BUSINESS_FLOW_MATRIX](./BUSINESS_FLOW_MATRIX.md), [ARCHITECTURE_DECISIONS](./ARCHITECTURE_DECISIONS.md), [AUDIT_REPORT](./AUDIT_REPORT.md).


---
# ROADMAP v2 (điều chỉnh 2026-10-26)

**Thứ tự triển khai:** `S` (Safety Gate, nhỏ) → `A` Refactor cấu trúc → `B` Đồng bộ UI/nghiệp vụ với Web → `C` Tích hợp API thật → `D` Gỡ mock/fake/demo → `E` Kiểm thử & hoàn thiện.

**Nguyên tắc (xem thêm §0 Quyết định đã duyệt):** (1) Mọi task gốc (T1.x–T9.x) **được giữ nguyên ID và nội dung ở Phụ lục**, chỉ gán lại phase (§3). (2) Giữ Expo SDK 52, repo `App`, chưa bắt buộc Expo Router (ADR-015). (3) UI theo **nghiệp vụ Web** nhưng **tối ưu RN** (ADR-018). (4) Dữ liệu mẫu chỉ dùng trong **UI Preview tách biệt, chỉ `__DEV__`** (ADR-016, ADR-020); **không** thêm fake API, **không** thêm fake success. (5) **Safety tối thiểu (S-min)** xong trước A; các task S còn lại xử lý tại milestone ghi ở §0; **G-DEMO** phải đạt **trước mọi buổi demo/bàn giao**.

## 0. Quyết định đã duyệt (2026-10-26 – phê duyệt có điều kiện)
**0.1 Thứ tự:** Safety tối thiểu → A → B → C → D → E. **Không cần xong toàn bộ S0.1–S0.7 mới được bắt đầu A.**
- **S-min (làm trước A):**
  - **S0.1** – loại bỏ bypass PIN `1234` và PIN so sánh cục bộ.
  - **S0.2** – không vào Kid Mode bằng xác thực/token giả; không vào hoặc thoát khi xác minh thật thất bại (phần thoát nằm trong S0.1).
  - **S0.4** – không để ví/credit/thanh toán giả báo thành công.
  - **S0.5a** – không để thao tác ghi nhạy cảm (PIN, hồ sơ bé, nhân vật, truyện) báo thành công giả.
- **Hoãn có blocker rõ (xử lý tại milestone tương ứng):**

| Task | Làm tại | Blocker / lý do hoãn | Rủi ro tạm thời cần biết |
|---|---|---|---|
| S0.3 Phiên thật (bootstrap, bỏ DEMO user) | **A3** (stores + bootstrap) | Cần màn loading/bootstrap và tách state khỏi `App.tsx`; làm trước A3 sẽ phải sửa hai lần | Tới khi xong, `getMe` còn fallback DEMO → **không được demo luồng đăng nhập** (chặn bởi G-DEMO) |
| S0.5b StoryWizard giả | **B5** (UI) + **C8** (API) | Cần API T5.1/T5.2 và thiết kế lại wizard; liên quan AI image (T5.4, PENDING) | Wizard còn sinh truyện cục bộ → **không demo tạo truyện** trước B5/C8 |
| S0.5c AuthModal (hồ sơ/bé/PIN) | **B3 / B11** (+ **C4/C6**) | U8: BE chưa thấy API cập nhật hồ sơ phụ huynh → BLOCKED một phần | PIN đã không lưu thô (T1.3); phần còn lại chờ B3/B11 |
| S0.6 Cổng & nhãn dữ liệu demo | **A8** + **B** (theo ADR-016/020: chuyển demo vào UI Preview) | Cần cấu trúc thư mục A5/A8 | Dữ liệu demo cũ còn lẫn trong màn thật → **bọc `__DEV__` + banner tối thiểu khi tới G-DEMO** |
| S0.7 (T1.3a) HeyInput `autoCapitalize` | **A2** (UI kit) hoặc bất cứ lúc nào (task trivial) | Không có | Có thể bị tự viết hoa email/username (UNKNOWN theo nền tảng) |

- **G-DEMO** (cổng demo/bàn giao) **vẫn bắt buộc** trước bất kỳ buổi demo nào có đăng nhập, Kid Mode hoặc tiền/credit. Hoãn task S đồng nghĩa **chưa được demo** các luồng liên quan, không phải bỏ qua.

**0.2 Kid UI Preview – ĐỒNG Ý, triển khai sau.** Chi tiết yêu cầu ở task **B9-P** (§2 Phase B) và ADR-020. Chỉ triển khai khi tới task UI phù hợp; **chưa viết code preview ngay.** Điều kiện bắt buộc:
1. Chỉ trong `__DEV__` và phải bật bằng **thao tác chủ động** (không tự mở).
2. Không token giả, không fake authentication, **không bypass PIN**.
3. **Không đổi** trạng thái đăng nhập/Kid Mode thật để mở preview.
4. Không gọi API ghi dữ liệu, thanh toán hay nghiệp vụ thật.
5. Không lưu dữ liệu demo như dữ liệu người dùng thật.
6. Hiển thị rõ "UI Preview – dữ liệu mẫu".
7. Không tồn tại đường truy cập preview trong production.

**0.3 Công nghệ & dependency:** giữ Expo SDK 52 · **không** tự chuyển Expo Router · **không** tự thêm Zustand, Axios, date picker · ưu tiên thư viện và state management hiện có · mọi thư viện mới phải được người dùng phê duyệt trước. Hệ quả: **A4 giữ điều hướng state** (ADR-015); **A3 dùng React context/store tối giản** (ADR-017); **B3 nhập `birthDate` dạng text `YYYY-MM-DD` có kiểm tra**, không picker.

**0.4 Quyết định còn PENDING (không tự quyết):**
- **Độ dài PIN:** tuân theo validation thực tế của BE. *Đã xác minh (đọc BE, không sửa):* `BE/api/src/modules/auth/auth.validation.js` – `setKidPin` `^\d{4,6}$` (`:66-70`), `changeKidPin` `newPin` `^\d{4,6}$` (`:79-81`), `exitKidMode` `pin` `^\d{4,6}$` (`:99-101`). UI hiện cố định 4 số (`KidModeScreen.tsx:160-163`, U6) → khi làm T3.2/T3.3 phải cho nhập 4–6 số theo BE; chi tiết giao diện do người dùng duyệt tại task đó.
- **AI Image và Audio:** chờ task liên quan (T5.4, T6.3); không chọn thư viện trước.
- **Seller, Specialist, Admin, Marketplace, Payment:** SCOPE PENDING; không phát triển thêm.
- **Không tự xóa màn hình hiện có** chưa được nhóm thống nhất loại bỏ.

**0.5 Dữ liệu mẫu:** được dùng trong **preview tách biệt** khi phát triển UI. **Cấm** dùng mock/fake success để giả lập đăng nhập thật, quyền truy cập thật, ghi dữ liệu BE hoặc thanh toán. **Production** khi chưa có dữ liệu thật phải hiển thị **trạng thái rỗng/thông báo phù hợp**, không âm thầm hiển thị dữ liệu demo như dữ liệu thật.

## 1. Mô hình trạng thái

### 1.1 Trạng thái task
`NOT STARTED` → `IN PROGRESS` → `DONE-STATIC` (tsc + grep + `git diff --check` đạt) → `ACCEPTED` (người dùng nghiệm thu). `BLOCKED` khi cần quyền/BE. Không task nào lên `ACCEPTED` khi chưa được người dùng review.

### 1.2 Bốn trục trạng thái tính năng (tách biệt, không suy ra nhau)
| Trục | Điều kiện được đánh ✅ | Bằng chứng bắt buộc |
|---|---|---|
| **UI COMPLETE** | Màn hình khớp luồng Web, có đủ trạng thái loading/empty/error, đã tối ưu RN (safe area, bàn phím, vùng chạm ≥44pt, danh sách ảo hóa), người dùng đã xem. **Được phép chứng minh bằng dữ liệu mẫu trong UI Preview tách biệt (`__DEV__`); màn thật không hiện dữ liệu mẫu.** | Ảnh/video màn hình hoặc xác nhận của người dùng |
| **API INTEGRATED** | Màn/service gọi **đúng contract BE** (API_MAPPING), mapper không bịa field, xử lý đủ mã lỗi (400/401/402/403/409/422/429/5xx/mạng), `catch` không fake. **Chưa chứng minh app chạy.** | Diff + `tsc` + grep + đối chiếu BE/Swagger |
| **RUNTIME TESTED** | Đã **thực sự chạy** app (emulator/thiết bị) với **BE thật**, đủ ca thành công + lỗi, và ghi vào Nhật ký runtime (§8). | Ngày, commit BE/App, thiết bị, kết quả từng ca |
| **MOCK REMOVED** | Grep cổng của tính năng sạch: không `DEMO_*`, không `catch` trả thành công giả, không hằng số bịa hiển thị như thật, không timer tiến độ giả. | Lệnh grep + kết quả (§6) |

Quy ước ký hiệu: ✅ đạt · ◐ một phần · ❌ chưa · — không áp dụng. **Cấm đánh ✅ RUNTIME TESTED nếu chưa chạy thật.** Một task chỉ `DONE` khi đạt đủ các trục ghi trong AC của nó.

### 1.3 Ma trận tính năng hiện tại (ước lượng từ audit tĩnh T1.0 + commit `3379fed`; **chưa có test runtime nào**)
| Tính năng (F#) | UI COMPLETE | API INTEGRATED | RUNTIME TESTED | MOCK REMOVED | Task chính |
|---|---|---|---|---|---|
| F1 Đăng nhập | ◐ (màn có, chưa sync Web) | ◐ (gọi API thật, validate response; **chưa chạy**) | ❌ | ◐ (login demo đã gỡ; còn `getMe`/`formatUser`) | T1.3 ✔static · S0.3 · B1 · T3.1 |
| F1 Đăng ký | ◐ | ◐ (**chưa validate response/token**) | ❌ | ✅ (không có mock; xem T3.1b) | B1 · T3.1b · T3.1 |
| F2 Phiên/refresh | — | ◐ (single-flight có, token chỉ RAM) | ❌ | ❌ (`getMe` fallback DEMO) | S0.3 · T2.1 · T2.2 |
| F3 Kid PIN set/change | ◐ | ◐ (gọi API nhưng `return true` khi lỗi) | ❌ | ❌ | S0.5a · T3.2 |
| F4 Hồ sơ bé | ◐ (chỉ tab trong AuthModal) | ◐ (mapper bịa field) | ❌ | ❌ | B3 · T4.1 |
| F5 Nhân vật | ◐ (trong wizard) | ◐ (đọc `role`) | ❌ | ❌ | B4 · T4.2 |
| F6/F7 Tạo & generate truyện | ◐ (wizard) | ❌ (endpoint không tồn tại) | ❌ | ❌ | S0.5b · B5 · T5.1 · T5.2 |
| F8 Editor/review | ❌ (chưa có màn) | ❌ | ❌ | — | B6 · T5.3 |
| F9 Thư viện/tủ sách | ◐ | ❌/◐ | ❌ | ❌ | B7 · T6.1 |
| F10 Vào Kid Mode | ◐ | ◐ | ❌ | ❌ (vào được khi BE lỗi) | S0.2 · T3.3 |
| F11 Kid: tủ sách | ◐ | ❌ (`kidService` không được gọi) | ❌ | ❌ | B9 · T6.1 |
| F12 Kid: đọc + checkpoint | ◐ | ❌ | ❌ | ❌ | B9 · T6.2 |
| F13 Thoát Kid (PIN) | ◐ | ◐ | ❌ | ❌ (**backdoor 1234**) | **S0.1** · T3.3 |
| F14 EQ/Overview | ◐ | ◐ (fallback bịa) | ❌ | ❌ (5 điểm hardcode) | S0.6 · B8 · T4.3 |
| F15 Gói/credit (xem) | ◐ (WalletScreen có nạp/rút giả) | ❌ | ❌ | ❌ (**ví giả**) | **S0.4** · B10 · T7.1 |
| SCOPE PENDING (Seller/Specialist/Admin/Marketplace/Payment) | ◐ (giữ nguyên) | ❌ | ❌ | ❌ (fixture) | T8.0 → D5 (không phát triển thêm) |

## 2. Roadmap theo phase

### Phase S – Safety Gate (S-min trước A; phần còn lại theo §0.1)
Mục tiêu: chặn các lỗi P0 (PIN `1234`, kid token/phiên giả, ví/thanh toán giả, ghi giả) **mà không cần xong refactor**. Là các task gốc được kéo lên ở dạng **chặn tối thiểu**; phần hoàn thiện nằm ở phase C/D. **S-min = S0.1, S0.2, S0.4, S0.5a** (làm trước A). S0.3, S0.5b, S0.5c, S0.6, S0.7 hoãn tới milestone ghi ở §0.1. **G-DEMO bắt buộc trước demo** dù đã hoãn.

| ID | Nội dung | Gốc | Phụ thuộc | AC | Test |
|---|---|---|---|---|---|
| **S0.1** *(S-min)* | Chặn backdoor PIN: bỏ `pin === '1234'` (`KidModeScreen.tsx:146`), nhánh fallback `exitKidMode` (`authService.ts:211-217`), prop `correctPin`/`|| '1234'` (`App.tsx:227`), PIN mặc định trong `formatUser` (`authService.ts:229`). Thoát Kid chỉ khi BE 2xx; lỗi/PIN sai → ở nguyên, hiện lỗi (chi tiết `attemptsLeft`/`retryAfterSeconds` ở T3.3) | T1.4 (M11, M54, M21, M12-PIN) | T1.3 | Không còn so sánh PIN cục bộ; `grep -rn "1234"` ngoài `demoData.ts` = 0 và không giá trị nào từ demo chảy vào xác thực; BE lỗi → không thoát được; `tsc` pass | `tsc`; grep; thủ công BE tắt/bật (chờ runtime) |
| **S0.2** *(S-min)* | Cổng vào Kid Mode: chỉ `setIsKidMode(true)` khi `enterKidMode` thành công; bỏ token kid giả `mock_kid_session_*` và `'mock_kid_session_token'` (`authService.ts:177,181-187`); truyền đúng bé được chọn, không `childrenProfiles[0]` | T1.6 core + M09, M10 (T1.7) | S0.1 | BE lỗi → ở nguyên + hiện lỗi; không ghi token kid giả; bé không có id thật từ BE → chặn kèm thông báo; `tsc` pass | `tsc`; grep `mock_kid`; thủ công |
| **S0.3** *(hoãn → A3)* | Phiên thật: `getMe` lỗi → throw (bỏ cache/`DEMO_PARENT_USER`); bootstrap `BOOTING → LOGIN \| APP` (chỉ vào APP khi `getMe` hợp lệ); bỏ `DEMO_PARENT_USER` làm danh tính khởi tạo; `formatUser` không bịa PIN/credit (`creditBalance` thiếu → `null`, UI hiện "—"); token hết hạn → về Login | T1.5 core (M06, M12, M14-user, M16) | S0.1 | Không import `DEMO_PARENT_USER` trong `App.tsx`/`authService.ts`; không có đường vào APP khi không có phiên hợp lệ; `tsc` pass | `tsc`; grep; thủ công: không token → Login; token hết hạn → Login |
| **S0.4** *(S-min)* | Chặn ví/credit/thanh toán giả: bỏ trừ credit cục bộ (`App.tsx:149-152`), lịch sử giao dịch hardcode (`:68-88`), nạp/rút cục bộ (`WalletScreen.tsx:36-61`) → hiển thị "Chưa hỗ trợ" (nạp: BLOCKED B4; rút: SCOPE PENDING). **Không xóa màn hình** | T1.8 (M12, M24, M26, M77, M78) | S0.1 | Không code tự cộng/trừ `creditBalance`/`sellerAvailableBalance`; không thông báo "thành công" khi không gọi BE; số dư chỉ từ BE; `tsc` pass | `tsc`; grep phép tính credit; thủ công: bấm nạp/rút → báo chưa hỗ trợ |
| **S0.5a** *(S-min)* | Ghi giả ở services: `setKidPin`/`changeKidPin`/child/character/story write không `return true`/object giả trong `catch` → throw `ApiError`; thêm xử lý lỗi ở nơi gọi (`handleAddChild`…) | T1.7 (chỉ các hàm **ghi**; danh sách M-id đầy đủ xem dòng T1.7 ở Phụ lục) | S0.2 | Không `catch` ghi nào trả thành công giả; không unhandled rejection; lỗi 4xx/quota hiển thị `ApiError.message`; `tsc` pass | `tsc`; grep; thủ công |
| **S0.5b** *(hoãn → B5/C8)* | StoryWizard: gỡ sinh truyện cục bộ + `/stories/ai-generate` + tiến độ/success giả + nhân vật cục bộ + tạo truyện lần 2 (`App.handleStoryCreated`) → "chưa hỗ trợ"/lỗi thật tới khi C | T1.9 (M23, M71–M75) | S0.5a | Không có truyện `PUBLISHED` cục bộ, không timer tiến độ giả, không kẹt Step 5 | `tsc`; grep `ai-generate`; thủ công |
| **S0.5c** *(hoãn → B3/B11)* | AuthModal: `handleSaveProfile` không nuốt lỗi `setKidPin`; `handleAddNewChild` không fallback giả; `birthDate` đúng giá trị người nhập; khóa `fullName/phone` nếu BE không có API hồ sơ (U8 → BLOCKED) | T1.11 (M65, M66) | S0.5a | Lỗi hiển thị, không báo thành công khi BE lỗi | `tsc`; thủ công |
| **S0.6** *(hoãn → A8 + B)* | Kiểm soát dữ liệu demo còn lại trong màn thật (ADR-016/020): (a) màn thật **không** import dữ liệu mẫu; dữ liệu mẫu chỉ vào qua **UI Preview** (`src/dev/preview`, B9-P và tương tự); (b) trong thời gian chuyển tiếp, mọi điểm demo cũ còn trong màn thật được bọc `__DEV__` + `DemoBanner` + marker `// TEMP-DEMO(<task xóa>)` — production hiển thị **trạng thái rỗng**; (c) EQ 5 điểm hardcode (`EqReportScreen.tsx:46-52,99-111`) → "Chưa có dữ liệu" hoặc nhãn demo | T1.10 (P0 phần EQ: M79–M81) + ADR-016 | S0.3 (A3) | Production build không hiện dữ liệu demo; không màn thật nào import `dev/demo` ngoài lớp chuyển tiếp có nhãn; grep `TEMP-DEMO` liệt kê đủ điểm dùng | `tsc`; grep; thủ công: build không `__DEV__` → trạng thái rỗng |
| **S0.7 (T1.3a)** *(hoãn → A2)* | `HeyInput` thêm `autoCapitalize`/`autoCorrect` (ô email/username/mật khẩu = `none`/`false`) — phát hiện khi review T1.3 | Review T1.3 | T1.3 | Ô đăng nhập không tự viết hoa; không đổi giao diện khác | `tsc`; thủ công iOS/Android |
| **G-DEMO** | **Cổng demo/bàn giao:** các task S liên quan luồng được demo ở trạng thái `DONE-STATIC` (hoặc luồng đó bị ẩn/chặn rõ ràng) + checklist §6 sạch + người dùng ký duyệt | — | S0.* tương ứng | Xem §6 | grep §6 |

### Phase A – Refactor cấu trúc `apps/mobile` theo App_v2 (không đổi hành vi)
Nguyên tắc: **di chuyển/tách, không đổi hành vi, không xóa màn hình, không thêm dependency, mỗi task một PR nhỏ**; sau mỗi task `tsc` pass và app khởi động (Metro). Cấu trúc đích: ADR-015.

| ID | Nội dung | Gốc | Phụ thuộc | AC | Test |
|---|---|---|---|---|---|
| **A0.1** | Dọn drift SDK 52 (`npx expo install --check`, **cần duyệt**) | T1.1 | — | `expo-asset/font/haptics/speech`, RN đúng bản SDK 52; app khởi động; không đổi major | Metro chạy; `tsc` |
| **A0.2** | Config env/base URL, không hardcode, không secret (U7) | T1.2 | A0.1 | URL đọc từ cấu hình; không `localhost/10.0.2.2/PROD` hardcode trong UI | grep; `tsc` |
| **A1** | Baseline & quy ước: chốt `tsc`, danh sách import, đường dẫn tương đối (alias `@/` **chỉ dùng nếu xác minh Metro SDK 52 hỗ trợ không cần dependency**) | — | S | Ghi baseline vào PR; không đổi hành vi | `tsc` |
| **A2** | *(+ S0.7/T1.3a)* Design tokens & UI kit: bổ sung từ App_v2 `theme` + `components/ui` các primitive còn thiếu (`Screen`, `Sheet`, `Toaster`, `SelectField`, `Badge`, `TextField`) cạnh `Hey*`; **giữ `Hey*`**; kèm `HeyInput` `autoCapitalize`/`autoCorrect` | — | A1 | Có primitive mới dùng được; không màn nào bị đổi giao diện; ô email/username không tự viết hoa | `tsc`; mở từng màn |
| **A3** | *(+ S0.3)* Stores phiên: tách state khỏi `App.tsx` thành `stores/` (auth, kidSession, toast) bằng React context + store tối giản (**không thêm zustand**, ADR-017); kèm bootstrap phiên thật `BOOTING → LOGIN \| APP` và bỏ DEMO user (S0.3) | S0.3 | A1, S-min | `App.tsx` chỉ còn khung; kid session tách riêng parent; AC của S0.3 đạt | `tsc`; thủ công luồng Login→APP→Kid |
| **A4** | Navigation layer: `navigation/routes.ts` (ROUTES typed, học `App_v2/constants/routes.ts`), `AppNavigator`, `ParentTabs`/`KidStack`, giữ cơ chế state; ẩn sau interface để đổi router sau | — | A3 | Mọi điều hướng đi qua `navigate(ROUTES.x)`; không còn `setCurrentTab('…')` rải rác; tab hiện có đều mở được | `tsc`; thủ công mọi tab |
| **A5** | Tổ chức `screens/` theo nhóm (`auth/`, `parent/`, `kid/`, `scope-pending/`) và `components/` (`ui/`, `auth/`, `parent/`, `kid/`); **chỉ di chuyển + sửa import** | — | A4 | Không file nào bị xóa; không màn nào mất; `tsc` pass | `tsc`; grep import hỏng |
| **A6** | Types DTO theo BE rev8 trong `src/types/` (học `App_v2/types/models.ts`), mobile-local vì `packages/shared-types` là READ-ONLY; chuyển import dần | T2.3 | A5 | Types khớp API_MAPPING; không field bịa; không sửa `packages/` | `tsc` |
| **A7** | Gỡ phụ thuộc mã legacy `App/src/utils/{sound-fx,speech-tts}`: bản dùng cho mobile trong `apps/mobile/src/utils` | T1.12 (**duyệt**) | A5 | Không import ra ngoài `apps/mobile`; app khởi động | grep `../../../../src`; Metro (U11) |
| **A8** | *(+ S0.6)* Cô lập dữ liệu mẫu: chuyển `demoData.ts` → `src/dev/demo/` (một thư mục, chỉ dùng bởi `src/dev/preview/` và lớp chuyển tiếp có nhãn); gỡ `export * from './demoData'` khỏi `services/index.ts` | (chuẩn bị D) | S0.6, A5 | Xóa thư mục này sau này = chỉ lỗi biên dịch đúng chỗ cần sửa; **không xóa file** | `tsc`; grep |
| **A9** | Cổng phase A | — | A0–A8 | `tsc` pass; Metro khởi động; mọi màn hiện có vẫn mở; diff chỉ là di chuyển | thủ công + grep |

### Phase B – Đồng bộ UI & nghiệp vụ với Web (UI COMPLETE; dữ liệu mẫu chỉ trong UI Preview `__DEV__`)
Quy tắc phase B: màn hình viết dạng **trình bày (nhận dữ liệu qua props/hook)** để dùng chung cho màn thật (dữ liệu từ service → rỗng/lỗi khi chưa có) và **UI Preview** (dữ liệu mẫu, `__DEV__`, ADR-020). **Nút ghi** (tạo/sửa/xóa/mua/nạp) **không được mô phỏng thành công** — gọi `notConnected()` hiển thị "Chưa kết nối API" cho tới phase C. Chỉ dữ liệu **đọc** là mẫu và chỉ trong preview. Mỗi màn có trạng thái loading/empty/error. Tham chiếu: Web `Web/src/pages/**`, App_v2 `src/app/**` + `components/**`.

| ID | Màn hình | Web tham chiếu | App_v2 tham chiếu | Điểm tối ưu RN | AC (UI COMPLETE) |
|---|---|---|---|---|---|
| **B1** | Login / Register | `pages/auth/*`, `services/authService.js` (regex, `VI_MESSAGES`) | `login.tsx`, `register.tsx`, `AuthShell` | Bàn phím, `KeyboardAvoidingView`, autofill | Validate khớp Web (email/username regex, mật khẩu ≥8, username `^[a-zA-Z0-9_]{3,50}$`); thông báo VI; trạng thái loading/lỗi |
| **B2** | Dashboard phụ huynh | `ParentDashboardPage` | `(tabs)/index`, `components/parent/dashboard` | Pull-to-refresh, thẻ cuộn | Chọn bé, tiến độ đọc, tóm tắt EQ, "tiếp tục đọc"; empty khi chưa có dữ liệu |
| **B3** | Hồ sơ bé | `ChildrenPage` | `children.tsx`, `parent/children` | Bottom sheet thêm/sửa; `birthDate` nhập text `YYYY-MM-DD` có kiểm tra (**không picker**, đã quyết định §0.3) | Danh sách + form theo BE (`name≤100`, `birthDate`), hiển thị quota, không `gender/readingLevel` |
| **B4** | Nhân vật gia đình | `FamilyCharactersPage` | `family-characters.tsx`, `CharacterPortrait` | Lưới 2 cột, ảnh lazy | Form `appearance` 3–1000 ký tự; **không có `role`**; trạng thái `portraitStatus` |
| **B5** | Xưởng truyện + tạo truyện (3 entry) | `studio/StudioPage`, `CreateStoryPage` | `(tabs)/studio`, `story/new`, `parent/studio` | Wizard từng bước, bước lưu nháp cục bộ UI | 3 entry (family/topic/handwritten), `length`, 1 main character, bảng giá `ai-pricing`; bước theo dõi generation có 4 trạng thái UI (queued/processing/succeeded/failed/blocked) **không timer giả** |
| **B6** | Biên tập & review | `StoryEditorPage` | `story/[storyId].tsx` | Danh sách trang ảo hóa | Xem trang/checkpoint (locked), nút review hiển thị `errors[]` 422 |
| **B7** | Thư viện / tủ sách | `LibraryPage` | `(tabs)/library`, `parent/library`, `ShelfToggles` | `FlatList`, lọc theo chip | Lọc trạng thái, thêm vào tủ sách bé, trạng thái "chưa sẵn sàng (422)" |
| **B8** | Hành trình EQ | `EqJourneyPage` | `eq-journey.tsx`, `RadarChart`, `constants/casel|eqLevels` | Biểu đồ nhẹ (SVG có sẵn? **UNKNOWN**, không thêm dependency) | Hiển thị `competencies[level emerging\|developing\|secure\|null]`, `recommendations`; **không điểm bịa**; empty khi BE rỗng |
| **B9** | Kid: tủ sách + trình đọc | `kid/KidBookshelfPage`, `StoryReaderPage` | `kid/index`, `kid/story/[storyId]`, `KidCheckpoint`, `KidDialogs` | Chạm lớn, dọc/ngang, giữ màn hình sáng (nếu có sẵn) | Trang, checkpoint (5 type), hint → thử lại, hoàn thành; dialog thoát PIN; hiển thị lockout; nút âm thanh (thư viện audio chốt ở T6.3) |
| **B10** | Gói & credit (chỉ xem) | `billing/BillingPage` | `billing.tsx` | — | Hiển thị plan, quota, lịch sử; **không nút nạp credit**; thanh toán = SCOPE PENDING |
| **B11** | Cài đặt / Trợ giúp / Hồ sơ phụ huynh | `SettingsPage`, `HelpPage` | `settings.tsx`, `help.tsx`, `(tabs)/more` | Danh sách cài đặt chuẩn mobile | Đổi PIN Kid (UI), đăng xuất; hồ sơ khóa nếu BE không hỗ trợ (U8) |
| **B9-P** | **Kid UI Preview** (dev-only) – *chỉ triển khai khi tới B9; chưa viết code* | Không có (công cụ dev) | `kid/*` | Toàn màn, tách khỏi cây điều hướng thật | Đủ **7 điều kiện §0.2**: `__DEV__` + bật chủ động · không token/auth giả/bypass PIN · không đổi trạng thái đăng nhập/Kid Mode thật · không API ghi/thanh toán · không lưu demo như dữ liệu thật · nhãn "UI Preview – dữ liệu mẫu" · không có đường truy cập production. Grep G11 sạch; đạt khi người dùng review |
| **B12** | Cổng phase B + màn SCOPE PENDING | — | — | — | Mọi màn B ở chế độ preview có nhãn "UI Preview – dữ liệu mẫu"; màn thật không hiện dữ liệu mẫu; màn SCOPE PENDING giữ nguyên (T8.0); người dùng review UI từng màn |

Test phase B: `tsc`; Metro; duyệt UI thủ công từng màn ở 2 kích thước màn hình; grep `notConnected` cho mọi nút ghi; grep không có `setState` giả kết quả BE.

### Phase C – Tích hợp Backend API thật
Quy tắc phase C: mỗi tích hợp **đối chiếu 6 bước** (API_MAPPING §7); service **throw** khi lỗi (không `catch` trả giả); nơi gọi hiển thị lỗi + retry; sau khi một màn tích hợp xong, **gỡ luôn mock/fallback của chính màn đó** (MOCK REMOVED theo tính năng). Cần **BE chạy** (U1) và tài khoản test **do người dùng cấp, không commit vào repo**.

| ID | Nội dung | Gốc | Phụ thuộc |
|---|---|---|---|
| **C0** | Môi trường test: BE chạy local, tài khoản test (ngoài repo), Expo Go/thiết bị (U1, U2) | — | A9 |
| **C1** | API client `fetch` (envelope, timeout, `errors[]`, single-flight refresh, 402/422/429) | T2.1 | C0 |
| **C2** | Lưu token `expo-secure-store` (**cần duyệt**), kid token tách riêng, logout xóa sạch | T2.2 | C1 |
| **C3** | Auth thật: login/me/logout + **register validate `user`+`tokens`** (T3.1b, ưu tiên cao) | T3.1 + **T3.1b** | C2 |
| **C4** | Kid PIN set/change qua BE | T3.2 | C3 |
| **C5** | Enter/Exit Kid Mode qua BE, `attemptsLeft`/`retryAfterSeconds` | T3.3 (hoàn tất T1.4/T1.6) | C4 |
| **C6** | Children + Characters + mapper | T4.1, T4.2 | C3 |
| **C7** | Overview + EQ report/journey | T4.3 | C6 |
| **C8** | Create story + analyze; Generate + poll `/generation`; Editor/review; AI image placeholder | T5.1–T5.4 | C6 |
| **C9** | Bookshelf + Kid shelf | T6.1 | C6, C5 |
| **C10** | Kid session/pages/checkpoint/answer/progress/complete | T6.2 | C9 |
| **C11** | Audio (chốt thư viện, **cần duyệt**), `GET /kid/ui-audio` | T6.3, T6.4 | C10 |
| **C12** | Plans/subscription/credit-history (chỉ xem) | T7.1 | C3 |

AC chi tiết từng task: giữ nguyên ở Phụ lục (M2–M7). AC bổ sung chung phase C: **API INTEGRATED = ✅** cho tính năng tương ứng; lỗi BE hiển thị lỗi thật; 401 kid → kết thúc kid session; không fallback demo trong service đã tích hợp.

### Phase D – Gỡ mock / fake success / demo data
Mục tiêu: quét sạch phần còn lại và **chứng minh bằng grep**. Việc xóa file/màn hình chỉ làm sau khi được duyệt riêng.

| ID | Nội dung | Gốc | AC |
|---|---|---|---|
| **D1** | Phần còn lại của bootstrap/session: `loadAllData` không nuốt lỗi, trạng thái loading/error/empty | T1.5 (còn lại: M17) | Lỗi `/children`,`/characters`,`/stories`,`/topics` hiện lỗi thật |
| **D2** | Số liệu hardcode hiển thị như thật (P1): `ParentHomeScreen`, `KidModeScreen` | T1.10 (còn lại) | Không còn hằng số 55%/5.0/1/2/+10 Xu…; "chưa có dữ liệu" khi rỗng |
| **D3** | Gỡ `DemoBanner`, `demoGate`, marker `TEMP-DEMO` khỏi các màn đã tích hợp | ADR-016 | `grep TEMP-DEMO` chỉ còn màn SCOPE PENDING |
| **D4** | Xóa `src/dev/demo/` và mọi import (**cần duyệt riêng**) | T1.7 (xóa `demoData`) | `grep -rn "DEMO_\|demoData\|dev/demo" apps/mobile` = 0 |
| **D5** | Quyết định xử lý fixture màn SCOPE PENDING (giữ/ẩn/"chưa kết nối") | T8.0 | Có quyết định bằng văn bản; không xóa khi chưa duyệt |
| **D6** | Quyết định mã legacy (`server.ts`, `apps/api`, `mockData.ts`, `shims`) | T9.2 | Có quyết định bằng văn bản |
| **D7** | Cổng phase D: chạy toàn bộ grep §6 | — | Tất cả grep sạch; **MOCK REMOVED = ✅** cho mọi tính năng P0 |

### Phase E – Kiểm thử & hoàn thiện
| ID | Nội dung | Gốc | AC |
|---|---|---|---|
| **E1** | Kịch bản test runtime F1–F15 với BE thật (BUSINESS_FLOW_MATRIX) + ghi Nhật ký (§8) | T9.1 | **RUNTIME TESTED = ✅** cho từng tính năng, kèm bằng chứng; gồm ca BE tắt/lỗi 401/402/422/429 |
| **E2** | Ma trận thiết bị: Android emulator + thiết bị thật; iOS nếu có (U2) | — | Ghi rõ thiết bị/OS/Expo Go; lỗi khác biệt nền tảng |
| **E3** | Test tự động (jest/RNTL) cho client + mapper (**cần duyệt dependency**) | ADR-013 | Test pass cho refresh single-flight, parse lỗi, mapper |
| **E4** | Hiệu năng & trải nghiệm: danh sách dài, ảnh, bàn phím, offline/mạng chậm, accessibility | — | Không crash; có trạng thái khi mất mạng |
| **E5** | Quét bảo mật cuối: PIN, token, secret, log | AUDIT §6 | S1–S7 đóng; không lộ secret/PIN trong log |
| **E6** | Cập nhật tài liệu cuối (AUDIT, API_MAPPING, matrix trạng thái) | — | Ma trận §1.3 phản ánh đúng thực tế |
| **E7** | Nghiệm thu phát hành | — | Người dùng ký duyệt |

## 3. Bảng ánh xạ task gốc → roadmap v2 (giữ nguyên trạng thái, không xóa task)
| Task gốc | Phase v2 | Trạng thái hiện tại | Ghi chú |
|---|---|---|---|
| M0 | — | **HOÀN TẤT** | Người dùng xác nhận |
| T1.0 | — | **HOÀN TẤT** | 90 phát hiện; người dùng xác nhận |
| T1.1 | A0.1 | NOT STARTED | cần duyệt |
| T1.2 | A0.2 | NOT STARTED | |
| **T1.3** | S (đã làm) | **ĐÃ COMMIT `3379fed` · DONE-STATIC · RUNTIME CHƯA PASS** | Còn lại: T1.3a (S0.7), T3.1b; xem §8 |
| T1.4 | S0.1 (chặn) → C5 (hoàn tất cùng T3.3) | **S0.1 DONE-STATIC** (commit `8a258b7`) · runtime chưa chạy | phần còn lại: T3.3 |
| T1.5 | S0.3 (core) → D1 (còn lại) | **S0.3 DONE-STATIC** (chưa commit) · runtime chưa chạy | S0.3 làm sớm hơn kế hoạch theo yêu cầu người dùng; còn lại: D1 |
| T1.6 | S0.2 (gate) → C5 | **S0.2 DONE-STATIC** (commit `8a258b7`) · runtime chưa chạy | chọn bé: B2 |
| T1.7 | S0.5a (ghi) → D4 (đọc, xóa demoData) | **S0.5a + phần đọc DONE-STATIC** (chưa commit) | còn lại: D4 xóa `demoData.ts` (cần duyệt) |
| T1.8 | S0.4 → C12 | **S0.4 DONE-STATIC** (chưa commit) | số dư/lịch sử thật: C12 |
| T1.9 | S0.5b → C8 | **S0.5b DONE-STATIC** (chưa commit) | tạo truyện thật: C8 |
| T1.10 | S0.6 (EQ P0) → D2 | **S0.6 DONE-STATIC** (chưa commit); còn số liệu P1 (timer Kid, v.v.) → D2 | |
| T1.11 | S0.5c → C4/C6 | **S0.5c DONE-STATIC** (chưa commit); hồ sơ phụ huynh BLOCKED (BE không có API) | |
| T1.12 | A7 | NOT STARTED | cần duyệt |
| T8.0 | D5 | NOT STARTED | |
| T2.1 / T2.2 / T2.3 | C1 / C2 / A6 | NOT STARTED | T2.2 cần duyệt |
| T3.1 / T3.2 / T3.3 | C3 / C4 / C5 | NOT STARTED | **T3.1b (mới)** validate register |
| T4.1–T4.3 | C6, C7 | NOT STARTED | |
| T5.1–T5.4 | C8 | NOT STARTED | |
| T6.1–T6.4 | C9–C11 | NOT STARTED | T6.3 cần duyệt |
| T7.1 | C12 | NOT STARTED | |
| T9.1 / T9.2 | E1 / D6 | NOT STARTED | |

**Task mới thêm (không thay task cũ):** S0.6, S0.7 (T1.3a), G-DEMO, A1–A5, A8, A9, B1–B12, **B9-P (Kid UI Preview)**, C0, T3.1b, D3, D7, E2–E7.

## 4. Phụ thuộc giữa các phase
`T1.3 ✔ → S0.1 → S0.2 → S0.4 → S0.5a (S-min) → A0 → A1 → A2(+S0.7) → A3(+S0.3) → A4 → A5 → A6 / A7 / A8(+S0.6) → A9 → B1…B12 (B9-P tại B9) → C0 → C1 → C2 → C3 → C4 → C5; C3 → C6 → C7 / C8 / C9 → C10 → C11; C3 → C12 → D1…D7 → E1…E7`. Hoãn tại milestone: `S0.5c → B3/B11`, `S0.5b → B5/C8`.
Phase B có thể làm song song theo màn khi A9 xong; phase C chỉ bắt đầu khi có BE chạy (C0). **G-DEMO** chặn mọi buổi demo trong suốt các phase.

## 5. Trạng thái các quyết định (đã chốt 2026-10-26)
| # | Câu hỏi | Kết quả |
|---|---|---|
| 1 | Thứ tự S so với A | **Chốt:** S-min trước A; S còn lại tại milestone (§0.1) |
| 2 | Xem UI Kid khi chưa có BE | **Chốt:** Kid UI Preview dev-only, 7 điều kiện (§0.2, ADR-020); triển khai ở B9-P |
| 3 | Router | **Chốt:** giữ điều hướng state; không Expo Router (ADR-015) |
| 4 | State lib | **Chốt:** không Zustand; context/store có sẵn (ADR-017) |
| 5 | Date picker `birthDate` | **Chốt:** không thêm; nhập text `YYYY-MM-DD` |
| 6 | PIN 4 hay 4–6 số | **Theo validation BE** (4–6 số, đã xác minh §0.4); không tự quyết giao diện |
| 7 | AI image (T5.4), audio (T6.3) | **PENDING** tới task liên quan |
| 8 | Phạm vi Seller/Specialist/Admin/Marketplace/Payment | **SCOPE PENDING** |
| 9 | BE có API cập nhật hồ sơ phụ huynh (U8) | **UNKNOWN** – xác minh ở B11/S0.5c |

## 6. Cổng kiểm tra (grep) – dùng cho G-DEMO, D7, E5
Chạy tại `App/apps/mobile`. Kỳ vọng "0 kết quả" trừ khi ghi chú.
| # | Mục tiêu | Lệnh gợi ý | Khi nào bắt buộc |
|---|---|---|---|
| G1 | PIN cục bộ/backdoor | `grep -rn "'1234'\|correctPin" App.tsx src` | G-DEMO |
| G2 | Token/phiên giả | `grep -rn "mock_\|demo_mock\|DEMO_PARENT_USER" App.tsx src` (ngoài `dev/demo/`) | G-DEMO |
| G3 | Mock env/nút demo | `grep -rn "'mock'\|Offline Demo\|DEMO_CREDENTIALS\|onSkip" App.tsx src` | G-DEMO (đã sạch sau T1.3, comment trong `config.ts` được phép) |
| G4 | Ví/credit giả | `grep -rn "creditBalance *[-+]\|sellerAvailableBalance *[-+]\|Đã nạp thành công" App.tsx src` | G-DEMO |
| G5 | Fake success trong catch | rà `catch` ở `services/*`, `App.tsx`, `components/AuthModal.tsx`, `screens/StoryWizard.tsx` — không `return true`/object giả | G-DEMO, D7 |
| G6 | Endpoint không tồn tại | `grep -rn "ai-generate" src` | G-DEMO |
| G7 | Demo data vào runtime | `grep -rn "DEMO_\|demoData\|dev/demo" App.tsx src` | D4/D7 (G-DEMO: chỉ trong `src/dev/**` hoặc lớp chuyển tiếp có nhãn `__DEV__`) |
| G8 | Marker demo | `grep -rn "TEMP-DEMO" App.tsx src` | G-DEMO: đủ banner; D3: chỉ SCOPE PENDING |
| G9 | Import legacy | `grep -rn "\.\./\.\./\.\./\.\./src" App.tsx src` | A7 |
| G10 | Secret/URL hardcode | `grep -rn "localhost\|10.0.2.2\|api.storyweaver" src App.tsx` | A0.2 |
| G11 | Cô lập UI Preview | (a) `grep -rn "dev/preview" App.tsx src --include=*.ts*` — chỉ xuất hiện trong nhánh `__DEV__`; (b) `grep -rn "apiClient\|safeStorage\|authService\|kidService" src/dev` = 0 (preview không chạm API/token/storage) | B9-P, G-DEMO |
Luôn kèm: `npx tsc --noEmit`, `git diff --check`.

## 7. Quy tắc dữ liệu mẫu (tóm tắt ADR-016, ADR-020)
- Dữ liệu mẫu **chỉ dùng trong UI Preview tách biệt** (`__DEV__`, bật chủ động, có nhãn "UI Preview – dữ liệu mẫu"). Màn thật lấy dữ liệu từ service; khi chưa có dữ liệu thật → **trạng thái rỗng/thông báo phù hợp**.
- Lớp chuyển tiếp: điểm dùng demo cũ còn trong màn thật phải bọc `__DEV__` + `DemoBanner` + marker `// TEMP-DEMO(<task xóa>)` cho tới khi chuyển vào preview hoặc bị xóa (A8/B/D).
- **Cấm:** fake API, mô phỏng thành công cho đăng nhập/quyền truy cập/ghi BE/thanh toán/PIN/phiên, token/user/ví/credit giả, dữ liệu mẫu hiển thị như dữ liệu thật trong production.
- Màn đã `API INTEGRATED` phải ngừng dùng dữ liệu mẫu ngay trong task tích hợp.

## 8. Nhật ký RUNTIME TESTED (chỉ ghi khi đã chạy thật)
| Ngày | Task/Tính năng | BE commit | App commit | Thiết bị/OS | Ca test | Kết quả | Bằng chứng |
|---|---|---|---|---|---|---|---|
| — | T1.3 – R1…R12 (xem checklist review T1.3) | — | `3379fed` | — | — | **CHƯA CHẠY** | — |

Checklist T1.3 cần chạy khi có BE (C0): R1 màn Login trống/không demo · R2 BE tắt → lỗi, không token · R3 sai mật khẩu → 401 VI · R4 ô trống · R5 tài khoản khóa → 403 · R6 tài khoản thật vào app · R7 chống double-submit (Login + AuthModal) · R8 các tab AuthModal/Env · R9 Register không hồi quy · R10 hồ sơ sau login qua AuthModal · R11 Kid Mode BE bật/tắt · R12 tự viết hoa ô email (iOS/Android).

---
# PHỤ LỤC – TASK GỐC (nội dung giữ nguyên; **thứ tự thực hiện theo Roadmap v2 ở trên**)

## M1 – Nền tảng & dọn mock P0 (cần duyệt trước khi bắt đầu)
| Task | Nội dung | Acceptance criteria |
|---|---|---|
| **T1.0** | Rà soát toàn bộ `screens/*`, `services/*`, `App.tsx`, `components/*` tìm mock/fallback (hoàn thiện U3) — **HOÀN TẤT** (người dùng xác nhận) | Danh sách đầy đủ file:dòng, cập nhật AUDIT_REPORT; không sửa code. Kết quả: 90 phát hiện (54 P0 / 29 P1 / 7 P2), 57 khối catch (A32/B18/C7), U3 đóng |
| **T1.1** | Dọn drift SDK 52 (`npx expo install --check`, **cần duyệt**) | `expo-asset`, `expo-font`, RN, haptics, speech đúng bản SDK 52; app khởi động; không đổi major |
| **T1.2** | Cấu hình env/base URL (không hardcode, không secret) — M03, M69 | Base URL đọc từ cấu hình; không còn URL localhost/PROD hardcode trong `config.ts` và UI; không lộ secret |
| **T1.3** | Gỡ chế độ `mock` và nút/prefill demo (`LoginScreen`, `AuthModal`, `config.ts`) — M01, M02, M60–M64, M67–M69 | Không còn `DEMO_CREDENTIALS`, giá trị `'mock'` trong `ApiEnvironment`, token giả demo, nút "Offline Demo", chip/nút demo, prefill email/mật khẩu/PIN, nhãn tiết lộ PIN mặc định; grep theo AUDIT_REPORT §5.1–5.9 sạch; `tsc --noEmit` pass **[ĐÃ COMMIT `3379fed` · DONE-STATIC · RUNTIME CHƯA PASS · còn: T1.3a, T3.1b]** |
| **T1.4** | Xóa backdoor PIN demo ở `KidModeScreen.tsx:146` và `authService.ts:212` — M11, M54 (+ M21 `correctPin`) | Thoát Kid Mode chỉ khi BE xác nhận; không so sánh PIN cục bộ (hoàn tất cùng T3.3) |

> T1.3/T1.4 là **sửa hành vi giả**, không xóa tính năng nghiệp vụ; mọi màn hình khác giữ nguyên.

### M1-b – Task P0 bổ sung từ T1.0 (cần duyệt từng task trước khi làm; trạng thái tất cả: **CHƯA BẮT ĐẦU**)
Nguyên tắc chung: không tạo mock mới; lỗi BE → `throw ApiError` → UI hiển thị lỗi thật + trạng thái rỗng/thử lại; khi service bỏ fallback thì **cùng task phải thêm xử lý lỗi ở nơi gọi** (tránh unhandled rejection); không xóa file/màn hình (xóa `demoData.ts` chỉ sau khi được duyệt riêng — task chỉ gỡ import/export).

| Task | Ưu tiên | Nội dung (phát hiện) | Phụ thuộc | Acceptance criteria | Chiến lược test |
|---|---|---|---|---|---|
| **T1.5** | P0 #2 | Bootstrap/session sạch DEMO: bỏ state khởi tạo DEMO (`App.tsx:62-66`), `onSkip` (`:197-201`), `getMe` fallback DEMO/cache (`authService.ts:92-100`), `formatUser` mặc định bịa PIN/credit (`:229,232`), `loadAllData` nuốt lỗi (`:95-115`); thêm trạng thái loading/error/rỗng. (M04, M06, M12, M14, M15, M17) | T1.0, T1.3 | Không import `DEMO_*` trong `App.tsx`/`authService.ts`; `getMe` lỗi → throw, UI về Login hoặc hiện lỗi; lỗi `/children`,`/characters`,`/stories`,`/topics` hiện lỗi thật, không dữ liệu demo; `creditBalance` chỉ từ `wallet.creditBalance` (thiếu → "—"); `tsc` pass | `tsc --noEmit`; grep `DEMO_`/`onSkip` trong 2 file; thủ công (BE tắt): mở app không token → Login, token hết hạn → Login; (BE bật) login thật → dữ liệu thật |
| **T1.7** | P0 #3 | Services: gỡ fake-success — auth PIN/enter-kid (`authService.ts:147-150,163-165,177,181-187`), child (`childService.ts:22,37,63,83,94`), character (`characterService.ts:12,24,43,56`), story (`storyService.ts:20,32,58,89,103,114-127`), kid (`kidService.ts:15-21,37,56,71,89`); gỡ `export * from './demoData'` và import demoData; báo lỗi ở nơi gọi (`App.handleAddChild`, `AuthModal.handleAddNewChild`, `StoryWizard.handleAddNewCharacter`). (M04, M07–M10, M25, M29–M33, M37–M40, M42–M47, M49–M53, M66, M71) | T1.5 | Không service nào `return true`/object giả/`DEMO_*` trong `catch`; mọi `catch` hoặc throw, hoặc trả trạng thái lỗi rõ; `grep -rn "DEMO_\|demoData" apps/mobile --include=*.ts*` chỉ còn `demoData.ts` (chờ quyết định xóa); lỗi 4xx/quota hiển thị `ApiError.message`; `tsc` pass. **Không sửa contract** (thuộc T4/T5/T6) | `tsc`; grep; thủ công từng service với BE tắt/bật |
| **T1.6** | P0 #4 | Kid Mode gate ở `App.tsx`: chỉ `setIsKidMode(true)` khi `enterKidMode` thành công; chỉ thoát khi `exitKidMode` thành công; bỏ prop `correctPin`; truyền đúng bé được chọn (không `childrenProfiles[0]`); bỏ `catch {}` (`App.tsx:117-137,230-236`). (M18, M19, M20, M21) | T1.4, T1.5; **hoàn tất cùng T3.3** | BE lỗi/PIN sai → ở nguyên trạng thái, hiện lỗi (`retryAfterSeconds`/`attemptsLeft` do T3.3); không còn prop/biến PIN cục bộ; `onRecordEqSignal` không còn chỉ `console.log` (nối API ở T6.2) hoặc ghi UNKNOWN rõ | `tsc`; thủ công: BE tắt → không vào được Kid Mode; PIN sai → không thoát; PIN đúng → thoát + nhận token mới |
| **T1.8** | P0 #5 | Credit/ví giả: bỏ trừ credit cục bộ (`App.tsx:149-152`), lịch sử giao dịch hardcode (`:68-88`), nạp/rút cục bộ (`WalletScreen.tsx:36-61`) → hiển thị "chưa hỗ trợ" (nạp: BLOCKED B4; rút: SCOPE PENDING). **Thay hành vi giả bằng "chưa hỗ trợ", không xóa màn hình → cần duyệt** (M8: "đổi mock → chưa kết nối cần task riêng"). (M12, M24, M26, M77, M78) | T1.5 | Không còn code tự cộng/trừ `creditBalance`/`sellerAvailableBalance`; không thông báo "nạp/rút thành công" khi không gọi BE; lịch sử rỗng đến khi T7.1; số dư chỉ từ BE | `tsc`; grep phép tính `creditBalance`; thủ công: nhấn nạp/rút → báo chưa hỗ trợ, số dư không đổi |
| **T1.9** | P0 #6 | StoryWizard: gỡ sinh truyện cục bộ + endpoint không tồn tại + tiến độ/success giả (`StoryWizard.tsx:188-281`), nhân vật cục bộ (`:161-174`), tạo truyện lần 2 + local fallback (`App.tsx:139-155`) → hiện lỗi thật/"chưa hỗ trợ" tới khi T5.1/T5.2 nối luồng BE. (M23, M71–M75) | T1.5, T1.7 | Không gọi `/stories/ai-generate`; không có truyện `PUBLISHED` tạo cục bộ; không timer tiến độ giả; lỗi hiển thị, không kẹt Step 5; không tạo truyện 2 lần | `tsc`; grep `ai-generate`, timer tiến độ; thủ công: BE tắt → hiện lỗi, không có truyện mới |
| **T1.10** | P0 #7 (EQ) · P1 (còn lại) | Số liệu hardcode hiển thị như thật: `EqReportScreen.tsx:24-34,36-52,65,99-111` (P0), `ParentHomeScreen.tsx:37-78,107,185,241,314-324` (P1), `KidModeScreen.tsx:115,127-131,193,320` (P1) → trạng thái "chưa có dữ liệu" hoặc ẩn; dữ liệu thật chờ T4.3/T6.x. **Không xóa màn hình.** (M33, M56–M58, M79–M85) | T1.5, T1.7 | Không còn điểm EQ/giờ/sách/sao/xu/tiến độ hardcode; lỗi `/overview` hiện lỗi; rỗng khi BE rỗng | `tsc`; grep các hằng số đã liệt kê; thủ công BE tắt/bật, bé chưa có dữ liệu |
| **T1.11** | P0 #8 | AuthModal: `handleSaveProfile` nuốt lỗi + lưu PIN client (`:70-91`), `handleAddNewChild` fallback giả + `birthDate` cố định (`:160-181`); nếu BE không có API hồ sơ (U8) → khóa sửa `fullName/phone`, ghi BLOCKED. (M65, M66) | T1.3, T1.7; PIN → T3.2 | Không `kidModePinHash = <PIN gõ>`; lỗi `setKidPin` hiển thị; không báo thành công khi BE lỗi; tuổi/ngày sinh gửi đúng giá trị người nhập (hoặc yêu cầu `birthDate` theo BE) | `tsc`; thủ công BE tắt/bật |
| **T1.12** | P1 (cần duyệt) | Mobile import `App/src/utils/{sound-fx,speech-tts}` (legacy, READ-ONLY): `HeyTabBar.tsx:16`, `ShibaMascot.tsx:11`, `StoryReaderModal.tsx:15-16`, `ParentHomeScreen.tsx:20`, `StoryWizard.tsx:23-24`. Đề xuất: tách bản dùng cho mobile trong `apps/mobile/src/utils` (không sửa legacy); chốt thư viện audio ở T6.3. (M90) | T1.0; liên quan T6.3/T9.2 | Không còn import ra ngoài `apps/mobile`; app khởi động được | `tsc`; grep `../../../../src`; chạy Metro (U11) |
| **T8.0** | P1 (quyết định) | Chốt cách xử lý fixture runtime của màn **SCOPE PENDING**: `ModeratorAdminScreen.tsx:20-56`, `MarketplaceScreen` (lọc local), `SellerDashboard.tsx:58-67`, `App.tsx:259,293` → giữ nguyên/ẩn/hiện "chưa kết nối". Không phát triển thêm. (M27, M86–M89, S17) | quyết định nhóm (M8) | Có quyết định bằng văn bản; không xóa khi chưa duyệt | — |

> *(Thứ tự CŨ – đã được thay bằng Roadmap v2; giữ để tham chiếu.)*
**Thứ tự ưu tiên P0 đề xuất:** T1.3 → T1.5 → T1.7 → (T1.4 + T1.6 cùng T3.3) → T1.8 → T1.9 → T1.10 → T1.11. Lý do: chặn đăng nhập/phiên giả trước, rồi bỏ fake-success ở lớp service, sau đó cổng Kid Mode, tiếp theo tiền/credit, truyện, số liệu EQ. T1.12/T8.0 là P1.

**Ma trận test chung cho M1-b (chưa có test runner, chưa được thêm dependency):** (1) `npx tsc --noEmit` bắt buộc; (2) grep chứng minh theo AC từng task; (3) kiểm thủ công 2 trạng thái **BE tắt** (phải hiện lỗi thật, không dữ liệu/token giả) và **BE bật** (dữ liệu thật) — yêu cầu chạy BE (U1); (4) test tự động (jest/RNTL) chỉ thêm sau khi người dùng duyệt cài dependency (ngoài phạm vi T1.x). Không task nào được đánh dấu DONE trước khi người dùng review.

## M2 – API client & Session
| Task | Nội dung | AC |
|---|---|---|
| **T2.1** | API client bằng `fetch` (envelope, timeout, lỗi `errors[]`, single-flight refresh) | Test: nhiều request 401 → refresh đúng 1 lần; 402/422/429 parse đúng; loại trừ route auth |
| **T2.2** | Lưu token bằng `expo-secure-store` (**cần duyệt cài**) | Restart giữ phiên; logout xóa sạch; kid token tách riêng |
| **T2.3** | Types DTO theo BE | Types khớp API_MAPPING; không field bịa |

## M3 – Auth & Kid PIN
| Task | Nội dung | AC |
|---|---|---|
| **T3.1** | Login/Register/Me/Logout thật | Đăng nhập tài khoản thật; sai mật khẩu hiện lỗi BE; không fake success; `getMe` lỗi → báo lỗi, không user DEMO |
| **T3.2** | Kid PIN set/change qua BE | PIN không lưu ở client; chính sách độ dài theo quyết định nhóm |
| **T3.3** | Enter/Exit Kid Mode qua BE | Dùng `kidSessionToken`; 5 sai → hiện `retryAfterSeconds`/`attemptsLeft`; không backdoor; exit nhận tokens mới |

## M4 – Children, Characters, EQ
| Task | Nội dung | AC |
|---|---|---|
| **T4.1** | Children service + mapper | Không còn `gender/readingLevel/favoriteThemes`; quota error hiển thị đúng |
| **T4.2** | Characters mapper (không `role`) | Tạo/hiển thị đúng schema rev8 |
| **T4.3** | Overview + EQ report thật | Không bịa competency; trạng thái rỗng khi BE rỗng |

## M5 – Tạo & biên tập truyện
| Task | Nội dung | AC |
|---|---|---|
| **T5.1** | Create story (family/topic/handwritten) + analyze | Gửi đúng `entry`, `length`, 1 main character; 400/422 hiển thị lỗi |
| **T5.2** | Generate + poll `/generation` | Poll 2–3s tới succeeded/failed/blocked; 402 báo thiếu credit; bỏ `/stories/ai-generate` |
| **T5.3** | Editor/review | `POST /review` 422 hiển thị `errors[]` |
| **T5.4** | Quyết định AI image (placeholder) | Theo trả lời nhóm (B5) |

## M6 – Bookshelf & Kid reader
| Task | Nội dung | AC |
|---|---|---|
| **T6.1** | Bookshelf + Kid shelf đúng contract | Đọc `items[{storyId,...}]`; 422 not-ready có thông báo |
| **T6.2** | Kid session/pages/checkpoint/answer/progress/complete | Gửi `emotion`/`optionId`; hint → retry; complete idempotent; 409 xử lý; 401 kid → kết thúc kid session |
| **T6.3** | Audio (chốt thư viện sau xác minh; **cần duyệt**) | Phát `audioUrl`, mute, `useTts=false` không lỗi; tương thích SDK 52 |
| **T6.4** | `GET /kid/ui-audio` | Dùng asset từ BE, không hardcode |

## M7 – Plans/Credit (chỉ xem)
| Task | Nội dung | AC |
|---|---|---|
| **T7.1** | Plans, subscription, credit history | Credit = `wallet.creditBalance`; không có nút nạp/ví giả |

## M8 – SCOPE PENDING (CHỈ khi nhóm xác nhận + người dùng duyệt)
Seller, Specialist, Admin, Marketplace, Payment. Mỗi hạng mục cần quyết định phạm vi, API khả dụng và task riêng.
- Payment khả thi: `expo-web-browser` + polling `GET /payments/orders/:id`; deep link **BLOCKED**.
- Màn hình hiện có giữ nguyên; việc đổi mock → "chưa kết nối" cần task riêng.

## M9 – Hoàn thiện
| Task | Nội dung | AC |
|---|---|---|
| **T9.1** | Test & rà soát cuối | Test luồng F1–F15 (BUSINESS_FLOW_MATRIX); grep không còn mock P0; S1–S7 đóng |
| **T9.2** | Quyết định về mã legacy (`server.ts`, `apps/api`, `mockData.ts`, `shims`) | Có quyết định bằng văn bản; không xóa khi chưa duyệt |

---
## Phụ thuộc giữa các task
> *(Phụ thuộc CŨ – xem §4 Roadmap v2 cho thứ tự hiện hành.)*
`T1.0 → T1.2 → T2.1 → T2.2 → T3.x → T4.x → T5.x → T6.x → T7.1 → T9.1`; T1.3/T1.4 hoàn tất cùng T3.1/T3.3.
**M1-b (bổ sung từ T1.0):** `T1.0 → T1.3 → T1.5 → T1.7 → {T1.8, T1.9, T1.10, T1.11}`; `T1.4 + T1.6` hoàn tất cùng `T3.3` (sau T2.1/T2.2); T1.9 → nối thật ở T5.1/T5.2; T1.10 → T4.3/T6.x; T1.8 → T7.1; T1.12 liên quan T6.3/T9.2; T8.0 chờ quyết định M8.

## Câu hỏi cần nhóm trả lời trước khi tới task liên quan
1. PIN 4 hay 4–6 số (T3.2). 2. AI image placeholder (T5.4). 3. Audio BE hay TTS thiết bị (T6.3). 4. Phạm vi Seller/Specialist/Admin/Marketplace/Payment (M8). 5. BE có thêm mobile return URL payOS? (M8). 6. Expo Go/thiết bị với SDK 52 (T1.1).

## Rủi ro
- Runtime chưa kiểm chứng → cần chạy BE để test tích hợp (UNKNOWN U1).
- SDK 52 dần cũ; xem xét SDK 58 sau P0 bằng quyết định riêng.
- Contract có thể đổi khi BE cập nhật → đối chiếu lại Swagger trước mỗi task.
