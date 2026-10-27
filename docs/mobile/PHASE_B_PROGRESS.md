# PHASE B – TIẾN ĐỘ ĐỒNG BỘ UI & NGHIỆP VỤ VỚI WEB (B1 → B12)

Cập nhật: 2026-10-26 · Nhánh `refactor/mobile-web-integration` · Baseline: `afebd36` (Phase A).
Kết luận: **PHASE B DONE-STATIC (B9 PARTIAL) – RUNTIME VERIFICATION PENDING.** Thay đổi chưa commit.
Phase B **không** tích hợp API: chỉ giữ các lời gọi BE đã có (đăng nhập/đăng ký, tạo hồ sơ bé, tạo nhân vật, đặt/đổi PIN, tải danh sách). Mọi hành động chưa có API hiển thị "Chưa hỗ trợ", không đổi dữ liệu.

## Trạng thái task

| Task | Web tham chiếu                                | Màn Mobile                                          | Trạng thái                        | Ghi chú                                                                                                                                                                                                                                                                                                                                                                                       |
| ---- | --------------------------------------------- | --------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1   | `LoginPage`, `RegisterPage`, `authService.js` | `auth/LoginScreen`, `auth/RegisterScreen`           | DONE-STATIC                       | Kiểm tra từng ô khớp Web (email/username/mật khẩu ≥8, nhập lại khớp); Register có ô **tên đăng nhập** riêng (Web có, trước đây Mobile tự suy từ email); hiện/ẩn mật khẩu; lỗi BE dịch sang tiếng Việt; `KeyboardAvoidingView`; Register bỏ câu "tặng 50 credits" (không có căn cứ)                                                                                                            |
| B2   | `ParentDashboardPage`                         | `parent/ParentHomeScreen`                           | DONE-STATIC (số liệu chờ C7)      | Lời chào theo giờ, chọn bé (`ChildSwitcher`), Chế độ Bé theo bé đang chọn, truyện gần đây, truyện chờ xem lại (đếm bản nháp thật), chuyện mẫu thật; "Hôm nay của bé"/EQ = chưa kết nối (không số giả)                                                                                                                                                                                         |
| B3   | `ChildrenPage`                                | `parent/ChildrenScreen`, `ChildFormSheet`           | DONE-STATIC                       | Danh sách + chọn bé + thêm hồ sơ (bottom sheet, `birthDate` nhập chữ có kiểm tra, BE thật, lỗi BE hiển thị nguyên văn) + vào Chế độ Bé theo từng bé. **Sửa/xóa, quota gói: chờ API (C6/C12)**                                                                                                                                                                                                 |
| B4   | `FamilyCharactersPage`                        | `parent/CharactersScreen`, `CharacterFormSheet`     | DONE-STATIC                       | Lưới 2 cột, thêm nhân vật (name ≤100, appearance 3–1000, **không `role`**), nhãn `portraitStatus`. **Sửa/xóa chờ API**                                                                                                                                                                                                                                                                        |
| B5   | `CreateStoryPage`                             | `parent/StoryWizard`, `GenerationPanel`             | DONE-STATIC (tạo truyện chờ C8)   | Một trang các mục 1–4 như Web: 3 lối vào, lời kể 20–2000 ký tự / chọn chuyện mẫu, nhân vật (đúng 1 chính), độ dài + tên truyện + giọng đọc. Bấm "Tạo truyện" → `GenerationPanel` 'unsupported' (không gọi API, không truyện/tiến độ/credit giả). `GenerationPanel` đã có sẵn 5 trạng thái BE (queued/processing/succeeded/failed/blocked). **Bảng giá `ai-pricing` và bước analyze chưa nối** |
| B6   | `StoryEditorPage`                             | `parent/StoryDetailScreen`                          | **PARTIAL**                       | Xem trang của truyện đã có trong danh sách + nhãn trạng thái; "Chỉnh sửa", "Hoàn tất xem lại" → chưa hỗ trợ. Điểm dừng (checkpoint) và lỗi 422 `errors[]` chưa có dữ liệu (chờ C8); khung hiển thị `reviewErrors` đã có                                                                                                                                                                       |
| B7   | `LibraryPage`                                 | `parent/LibraryScreen`                              | DONE-STATIC (giá sách bé chờ C9)  | Danh sách truyện thật, lọc trạng thái + tìm theo tên, chọn bé, mở chi tiết. "Thêm vào tủ sách bé" → chưa hỗ trợ; lỗi 422 "chưa sẵn sàng" chờ C9                                                                                                                                                                                                                                               |
| B8   | `EqJourneyPage`                               | `parent/EqReportScreen`                             | DONE-STATIC (dữ liệu chờ C7)      | Prop-driven theo `EqReportDto`: 5 năng lực CASEL, mức 3 bậc + nhãn, "Chưa có dữ liệu" khi `level=null`, gợi ý chuyện mẫu. Hiện tại `report` chưa có → trạng thái chưa kết nối; không điểm bịa                                                                                                                                                                                                 |
| B9   | `KidBookshelfPage`, `StoryReaderPage`         | `kid/KidModeScreen`                                 | **PARTIAL**                       | Tủ sách theo Web ("Tủ sách của {bé}", trạng thái trống); **tủ sách thật để trống khi chưa nối API** (trước đây đổ toàn bộ truyện của phụ huynh vào Kid); bỏ đồng hồ 20 phút giả. **Chưa làm:** checkpoint 5 loại, gợi ý → thử lại, hiển thị lockout/`attemptsLeft`, tiến độ đọc (cần dữ liệu BE, C9/C10)                                                                                      |
| B9-P | (công cụ dev)                                 | `dev/preview/KidPreview`                            | DONE-STATIC                       | Đủ 7 điều kiện ADR-020 (xem dưới)                                                                                                                                                                                                                                                                                                                                                             |
| B10  | `BillingPage`                                 | `parent/WalletScreen` (route WALLET, tab "Credit")  | DONE-STATIC (gói/lịch sử chờ C12) | Chỉ xem: số dư từ BE hoặc "—"; **gỡ nạp/rút/lịch sử**; giải thích cách tính credit (tĩnh từ Web). Danh sách gói, quota, lịch sử credit: chưa kết nối                                                                                                                                                                                                                                          |
| B11  | `SettingsPage`, `HelpPage`                    | `parent/MoreScreen`, `SettingsScreen`, `HelpScreen` | DONE-STATIC                       | Menu "Thêm" (mở từ avatar trên thanh trên): Bé nhà mình, Nhân vật, Cài đặt, Trợ giúp, Chợ truyện (SCOPE PENDING), Đăng xuất. Cài đặt: hồ sơ chỉ xem (BE/Web không có API cập nhật – U8), PIN Kid (BE thật), địa chỉ máy chủ. Trợ giúp: FAQ từ Web. **Đổi mật khẩu chưa làm**                                                                                                                  |
| B12  | —                                             | —                                                   | DONE-STATIC                       | Cổng Phase B (xem "Kiểm tra"). Marketplace/Seller/Admin giữ nguyên, không phát triển thêm                                                                                                                                                                                                                                                                                                     |

## Thay đổi điều hướng

- Thanh tab (5): **Trang chủ · Tủ truyện · Sáng tác · Tiến độ · Credit**. "Tủ truyện" trước đây mở `MarketplaceScreen` (một bộ lọc cục bộ, SCOPE PENDING); nay mở `LibraryScreen`. `MarketplaceScreen` vẫn còn, truy cập từ menu "Thêm".
- Màn con (`ROUTES.MORE/CHILDREN/CHARACTERS/STORY/SETTINGS/HELP/MARKET`) dùng ngăn xếp trong `useParentNavigation`; nút Back của Android quay lại màn trước, ở màn gốc thì thoát app như cũ. Không đổi framework điều hướng.
- **Bé đang chọn** (`selectedChild`, trong `useParentData`) thay `childrenProfiles[0]`: Chế độ Bé mặc định vào bé đang chọn; reset khi đăng xuất.

## Kid UI Preview (B9-P) – 7 điều kiện ADR-020

1. `__DEV__` và bật chủ động: nút "🧪 UI Preview (dev)" ở màn Login (chỉ render khi `__DEV__` và có prop).
2. Không token/xác thực giả/bypass PIN: preview **không có PIN**; `KidModeScreen` bỏ qua prop `preview` ngoài `__DEV__` (phòng thủ chiều sâu).
3. Không đổi trạng thái đăng nhập/Kid thật: preview là lớp phủ; `SessionProvider`/`AppNavigator` vẫn mount bên dưới, không gọi `enter/exit`.
4. Không API: `src/dev/**` không import service/storage (grep G11 sạch).
5. Không lưu dữ liệu: không ghi storage/store.
6. Nhãn "UI Preview – dữ liệu mẫu (không phải Chế độ Trẻ Em thật)".
7. Không có trong production: nạp bằng `require` trong nhánh `__DEV__`; bundle production **không chứa** `KidPreview`, dữ liệu demo (`[Demo]`, `usr_demo`) hay nhãn preview (grep = 0).

## Component

Mới: `ui/{Badge, StateView, Sheet, ScreenHeader}`, `parent/{ChildSwitcher, ChildFormSheet, CharacterFormSheet, GenerationPanel}`; `HeyInput` thêm `revealable`. Chưa tạo `SelectField`, `TextField`, `Toaster` (chưa có nơi dùng; dùng chip, `HeyInput`, `Alert`).
Hằng số/tiện ích: `constants/{story, eq, faq}`, `utils/{validation, child}`, `types/viewModels` (`CharacterView`), `types/api` (+ `EqReportDto`).

## Thay đổi hành vi / dữ liệu đáng chú ý

- Gỡ số liệu giả còn sót: "⭐ 12" ở thanh trên, đồng hồ 20 phút ở Kid, "Tặng 50 credits" ở Register, thống kê hardcode ở Trang chủ cũ.
- Viết lại hoàn toàn nội dung (giữ màn/route): `ParentHomeScreen`, `StoryWizard`, `EqReportScreen`, `WalletScreen`. **Các phần cũ không có ở Web bị bỏ:** 6 "thế giới" và "tông truyện" của wizard (không có trong BE – U10), banner hero, quest "+10 Xu", lưới chủ đề tĩnh.
- `AuthModal` không còn được mount (đánh dấu DEPRECATED; chức năng chuyển sang Settings/Children/More); **chưa xóa file**. `HeyProgressBar`, `IntroScreen`, `CloudPopEntrance` cũng chưa được import ở đâu (giữ nguyên).
- Tab "Ví Sao" → "Credit"; bỏ chức năng rút tiền khỏi màn Parent (Seller = SCOPE PENDING; `SellerDashboard` giữ nguyên).

## Kiểm tra đã chạy (không phải runtime app)

- `npx tsc --noEmit` pass; `git diff --check` sạch; `npx expo install --check` "up to date".
- Metro bundle **Android (779 module)** và **Web (441 module)** thành công.
- Bundle production Web: không chứa `[Demo]`, `usr_demo`, `KidPreview`, nhãn preview, `mock_`; chuỗi `1234` duy nhất là placeholder SĐT.
- Bộ test logic tạm (scratchpad, mock `fetch`; không nằm trong repo): **56/56** ca có cấu hình + **8/8** ca thiếu cấu hình (thêm: dịch lỗi đăng ký, validation email/username/ngày sinh).
- Đồ thị import: 75 file, 0 vòng phụ thuộc; chỉ import ngoài `apps/mobile` là `packages/shared-types`.

## Chưa kiểm thử (RUNTIME NOT TESTED)

Chưa chạy app thật. Cần kiểm tra trên thiết bị/emulator + BE: bố cục từng màn ở 2 cỡ màn hình; bàn phím không che form (Login/Register/Sheet); Back của Android; chọn bé → Chế độ Bé đúng bé; thêm bé/nhân vật (kể cả lỗi vượt giới hạn gói); PIN set/change; wizard; Preview (bật/thoát, không ảnh hưởng phiên); Kid Mode thật (shelf trống, thoát bằng PIN); không có `boxShadow` lỗi trên Android (HeyCard dùng `boxShadow` có từ trước).

## Việc cho Phase C

Nối: danh sách gói/quota/lịch sử credit (C12), `ai-pricing` + analyze + generate + poll (C8), sửa/xóa bé & nhân vật (C6), overview/EQ (C7), bookshelf + kid shelf (C9), kid session/checkpoint (C10), âm thanh (C11), chi tiết truyện `GET /stories/:id` (C8), đổi mật khẩu, refresh token bền (C2).
