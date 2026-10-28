# Admin & Chuyên gia sư phạm trên Mobile

Cập nhật: 2026-10-28. Nhánh `refactor/mobile-frontend-cleanup`. Phạm vi Admin/Specialist (trước đây là SCOPE PENDING trong `App/CLAUDE.md` §2.4) được chủ dự án mở bằng yêu cầu trực tiếp cho đợt này.

## 1. Phân tích Web và Backend

| Nguồn | Vị trí |
|---|---|
| Route Web | `Web/src/routes/AppRoutes.jsx`, `Web/src/constants/routes.js`, layout `Web/src/layouts/AdminLayout.jsx`, `SpecialistLayout.jsx` |
| Service Web | `Web/src/services/adminService.js`, `specialistService.js`; `WithdrawalsPage`/`AppealsPage` gọi API trực tiếp |
| BE | `BE/api/src/modules/admin/*` (`authorize('admin')`), `market/withdrawals.routes.js`, `monitoring/monitoring.routes.js` (`specialist`, `admin`), `publishing/publishing.routes.js` + `publishing.service.js` (kiểm duyệt) |

Role thật từ BE: `parent | specialist | admin` (chữ thường). Mobile viết hoa trong `authService.formatUser`.

Luật nghiệp vụ BE quan trọng đã áp vào Mobile:
- Lượt duyệt: phải **nhận bài** (giữ có thời hạn; người khác giữ → 409), **xem 100% trang** mới được `approved`, quyết định khác **bắt buộc nhận xét**, `decision` phải thuộc `allowedDecisions`; body **strict** (không gửi checklist). Checklist 7 nguyên tắc chỉ chặn nút phía client (như Web).
- Hoàn tiền: duyệt **bắt buộc mã giao dịch**, từ chối **bắt buộc ghi chú**.
- Rút tiền: từ chối cần lý do ≥ 3 ký tự. Tạm gỡ ≥ 5, cảnh cáo ≥ 10 ký tự.
- Kháng nghị: từ chối bắt buộc ghi chú; người ra cảnh cáo không tự xét (BE 403).
- Tài khoản: không tự khoá, không khoá Admin đang hoạt động; khoá → BE thu hồi phiên.

Xung đột Web ↔ BE: Web cho bấm "Đã chuyển trả — duyệt" khi trống mã giao dịch, BE trả 422. Mobile theo BE (chặn trước khi gửi).

## 2. Ma trận tính năng

| Vai trò | Tính năng Web | API BE | Mobile trước | Mobile sau | Ghi chú |
|---|---|---|---|---|---|
| Admin | Dashboard | `GET /admin/finance/summary`, `/admin/overview` | MISSING | API INTEGRATED | KPI, cột chồng/bảng số liệu, việc chờ; CSV: WEB ONLY |
| Admin | Tài khoản | `GET/PATCH /admin/accounts`, `POST /admin/accounts/moderators` | MISSING | API INTEGRATED | lọc, tìm, phân trang, khoá/mở, tạo Chuyên gia |
| Admin | Rút tiền người bán | `/admin/withdrawals`, `mark-paid`, `reject` | MOCK ONLY (chip) | API INTEGRATED | VietQR: WEB ONLY |
| Admin | Hoàn tiền | `/admin/refunds`, `/decision` | MISSING | API INTEGRATED | |
| Admin | Kháng nghị | `/admin/appeals`, `/decision` | MISSING | API INTEGRATED | |
| Admin | Nhật ký kiểm toán | `GET /admin/audit-logs` | MISSING | API INTEGRATED | chỉ đọc |
| Admin | Gói & định giá | `/admin/plans` | MISSING | WEB ONLY (chưa làm) | menu báo "Dùng trên Web" |
| Admin | Cấu hình AI | `/admin/settings` | MISSING | WEB ONLY (chưa làm) | |
| Admin | Doanh thu & đối soát | `/admin/finance/reconciliation` | MISSING | WEB ONLY (chưa làm) | |
| Specialist | Hàng chờ duyệt | `GET /moderation/submissions` | MOCK ONLY | API INTEGRATED | |
| Specialist | Lượt duyệt | `.../claim`, `.../pages/:id/view`, `.../decision` | MOCK ONLY | API INTEGRATED | nghe giọng đọc: WEB ONLY |
| Specialist | Hồ sơ người bán | `/moderation/sellers`, `/decision` | MISSING | API INTEGRATED | |
| Specialist | Báo cáo vi phạm | `/moderation/reports`, dismiss, suspend, strikes, hide review | MISSING | API INTEGRATED | |
| Specialist | Truyện tạm gỡ, Cảnh cáo, Kiểm tra ngẫu nhiên, Cảnh báo AI | `/moderation/listings`, `/strikes`, `/audits`, `/ai-flags` | MISSING | WEB ONLY (chưa làm) | |
| Specialist | Kỹ năng con, Mẫu câu hỏi, Chuyện mẫu, Soát câu hỏi AI, Tham số báo cáo, Từ khoá chặn | các module tương ứng | MISSING | WEB ONLY (chưa làm) | quản trị nội dung dạng bảng/form lớn |

## 3. Quyết định thiết kế
- Dùng lại Design System R1–R2: `HeyCard`, `HeyButton`, `HeyInput`, `HeyChip`, `Badge`, `Sheet`, `StateView`, `Dialog`, `Toast`, `ScreenHeader`, `Icon`, token `Colors/Spacing/Radius/Typography`. Không thêm hex, thư viện hay dependency.
- Bảng desktop → thẻ; tab Web → chip cuộn ngang (`FilterChips`); biểu đồ SVG của Web → cột chồng vẽ bằng `View`, cuộn ngang khi nhiều ngày, kèm "Bảng số liệu" chính xác. Số liệu lấy nguyên từ BE.
- Thao tác nhạy cảm: `dialog.confirm` + sheet nhập lý do có kiểm độ dài như BE; `useMutationRunner` khoá bấm đúp, lỗi BE hiển thị nguyên văn, 401 kết thúc phiên.
- Tab "Thêm" dùng lại `MoreScreen` của Parent (thêm prop `title`, mặc định "Hồ sơ").

## 4. Điều hướng theo vai trò
- `AppNavigator` chọn khung theo `shellForRole(role)`: PARENT → giao diện cũ; ADMIN → `AdminNavigator`; SPECIALIST → `SpecialistNavigator`; role khác → màn "chưa dùng được" + Đăng xuất (không bao giờ rơi vào giao diện Phụ huynh).
- Dữ liệu Phụ huynh (bé, nhân vật, truyện) chỉ nạp cho PARENT (`SessionProvider`; `useAuthSession.bootstrap` trả thêm `user`).
- Admin: Tổng quan · Việc chờ · Tài khoản · Thêm (+ Rút tiền, Hoàn tiền, Kháng nghị, Nhật ký). Specialist: Hàng chờ · Người bán · Báo cáo · Thêm (+ Lượt duyệt). Badge số việc chờ trên tab. Android Back: màn con → quay lại, tab khác → tab đầu, tab đầu → hệ thống.

## 5. File thay đổi
Mới: `src/navigation/{managementRoutes.ts, ManagementShell.tsx, AdminNavigator.tsx, SpecialistNavigator.tsx}`, `src/components/management/ManagementUi.tsx`, `src/screens/admin/{AdminDashboard,Withdrawals,Refunds,Appeals,Accounts,AuditLogs}Screen.tsx`, `src/screens/specialist/{SpecialistQueue,ReviewWorkspace,SellerApplications,Reports}Screen.tsx`, `src/services/{adminService,moderationService}.ts`, `src/types/management.ts`, `src/constants/management.ts`, `src/utils/{format,managementRules}.ts`, `tests/management.test.ts`.
Sửa: `src/navigation/AppNavigator.tsx`, `src/stores/SessionProvider.tsx`, `src/stores/useAuthSession.ts`, `src/types/domain.ts` (thêm `SPECIALIST`), `src/screens/parent/MoreScreen.tsx` (prop `title`), `tests/README.md`.
Không đụng: `ModeratorAdminScreen.tsx` (mock cũ, không còn đường vào; đề xuất xoá khi được duyệt).

## 6. Kết quả kiểm thử
- `npx tsc --noEmit`: PASS. `npx expo install --check`: PASS. `expo export` web + android (ra thư mục tạm): PASS.
- Test tự động: 9 bộ cũ (56 ca) + `management.test.ts` (16 ca) PASS.
- Runtime Web (Expo Web 390×844, Chrome headless) và Android (`SW_Test`, Expo Go): **FIXTURE PASS** — dùng fake BE cô lập ngoài repo, trả dữ liệu đúng hình dạng DTO; không có mock trong source app. Đã kiểm: đăng nhập theo role, KPI/biểu đồ/bảng, xác nhận rút tiền (request thật tới fake BE), chặn validation (rút tiền, hoàn tiền, kháng nghị, cảnh cáo, tạo tài khoản — không request nào lọt), phân trang, 409 nhận bài, cổng Duyệt (3/3 trang + 7/7 checklist), body quyết định không có checklist, Back Android, đóng sheet bằng Back, không tràn ngang, 0 lỗi console.
- **Real E2E: NOT RUN / BLOCKED** — BE local không chạy và không có tài khoản Admin/Specialist thật; không thực hiện mutation thật.

## 7. Hồi quy Parent/Kid
- Fixture Web + Android: Phụ huynh đăng nhập vào đúng giao diện cũ, không thấy màn quản trị, Hồ sơ/Đăng xuất bình thường.
- Kid PIN, Story Wizard, Reader: không đổi mã; chỉ được bảo vệ bởi test tĩnh hiện có (PASS). Runtime: NOT VERIFIED trong đợt này.

## 8. Bảo mật
- Không bỏ qua kiểm tra BE; quyền do BE quyết định, Mobile chỉ ẩn/chặn sớm. Không token/user giả trong app. Fake BE và ảnh QA nằm ngoài repo.
- Ảnh VietQR không đưa lên Mobile (gửi STK tới dịch vụ ngoài).

## 9. Việc tiếp theo
1. Chạy E2E thật với BE + tài khoản Admin/Specialist thử nghiệm (đặc biệt: claim hết hạn, 403 kháng nghị tự xét, 422 giọng đọc chưa xong).
2. Quyết định phạm vi Mobile cho: Gói & định giá, Cấu hình AI, Doanh thu & đối soát, các trang giám sát còn lại, quản trị nội dung sư phạm.
3. Duyệt xoá `src/screens/scope-pending/ModeratorAdminScreen.tsx` và nhánh `activeRole` MODERATOR/ADMIN không còn dùng trong `ParentTabs.tsx`.
4. Nghe giọng đọc khi duyệt (cần trình phát audio; `expo-av`/`expo-audio` chưa cài).

## 10. Review trước commit (2026-10-28)

### Lỗi xác nhận và đã sửa (chỉ trong module quản trị)
| # | Lỗi | Sửa | Kiểm chứng |
|---|---|---|---|
| R1 | BE trả 404/409 khi thao tác (hết hạn giữ bài, hồ sơ/yêu cầu đã có người xử lý) nhưng màn vẫn giữ dữ liệu cũ; ở Lượt duyệt không hiện lại nút "Nhận bài" | `useMutationRunner(onStale)` nạp lại dữ liệu khi 404/409; 422 giữ nguyên nội dung đang nhập. Nối vào 7 màn có thao tác | test `management.test.ts`; Web fixture: hết hạn giữ bài → nút Nhận bài hiện lại |
| R2 | `ReasonSheet` mở lại cho yêu cầu khác vẫn còn lý do của yêu cầu trước | Xoá nội dung mỗi lần sheet mở | test; Web fixture: ô lý do trống khi mở lại |

### Phân loại tính năng (đối chiếu source)
| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| Dashboard | PARTIAL | thiếu Xuất CSV (Web only) |
| Tài khoản, Hoàn tiền, Kháng nghị, Nhật ký kiểm toán | IMPLEMENTED | |
| Rút tiền | PARTIAL | thiếu ảnh VietQR (cố ý) |
| Hàng chờ, Hồ sơ người bán, Báo cáo vi phạm | IMPLEMENTED | |
| Lượt duyệt | PARTIAL | chưa nghe được giọng đọc |
| Tất cả màn trên | NOT VERIFIED với BE thật | chỉ FIXTURE PASS; E2E thật BLOCKED |

13 tính năng còn ở Web (không làm trong review này):

| Tính năng | Quan trọng | Cần trên Mobile | BE | Độ phức tạp | Rủi ro | Khuyến nghị |
|---|---|---|---|---|---|---|
| Cảnh báo AI (xem + khoá AI) | Cao (an toàn) | Trung bình | Có | Thấp | Trung bình | Làm tiếp theo |
| Truyện tạm gỡ (xem) | Trung bình | Trung bình | Có | Thấp | Thấp | Làm tiếp theo (chỉ đọc) |
| Cảnh cáo tác giả (xem) | Trung bình | Trung bình | Có | Thấp | Thấp | Làm tiếp theo (chỉ đọc) |
| Doanh thu & đối soát | Cao | Trung bình | Có | Trung bình | Trung bình (tính lại bộ đếm) | Chỉ đọc trên Mobile; thao tác sửa ở Web |
| Kiểm tra ngẫu nhiên | Trung bình | Thấp | Có | Thấp | Trung bình (tạo lượt duyệt) | Web only |
| Gói & định giá | Cao | Thấp | Có | Trung bình | Cao (giá) | Web only |
| Cấu hình AI | Trung bình | Thấp | Có | Thấp | Cao (giá credit) | Web only |
| Từ khoá chặn | Trung bình | Thấp | Có | Trung bình | Trung bình | Web only |
| Kỹ năng con, Mẫu câu hỏi, Chuyện mẫu, Soát câu hỏi AI, Tham số báo cáo | Trung bình | Thấp | Có | Cao (bảng/form lớn) | Trung bình | Web only |

### Phân tích file dùng chung
- `AppNavigator.tsx`: tách phần Parent cũ thành `ParentNavigator` (giữ nguyên hook/Kid Mode), thêm chọn khung theo role. Cần để Admin/Specialist không vào giao diện Phụ huynh. Không đổi hành vi Parent.
- `SessionProvider.tsx` + `useAuthSession.ts`: `bootstrap` trả thêm `user`; chỉ nạp dữ liệu Phụ huynh khi role PARENT. Thay đổi nhỏ nhất có thể (không có user thì không biết role).
- `domain.ts`: thêm `SPECIALIST` vào `Role`. `MoreScreen.tsx`: prop `title` tuỳ chọn, mặc định "Hồ sơ".

### Quyền & bảo mật
- Role do BE xác nhận; role lạ → màn "chưa dùng được" + Đăng xuất. Mọi quyền vẫn do BE kiểm; 401 kết thúc phiên, 403/404/409/422 hiện nguyên văn.
- Phát hiện (chưa sửa, cần duyệt — thuộc auth chung): `authService.formatUser` mặc định `PARENT` khi BE không trả `role`. BE hiện luôn trả `role`, nên rủi ro thấp.

### Kiểm thử của review
- `npx tsc --noEmit` PASS; 10 bộ test PASS (74 ca: 56 cũ + 18 quản trị); `npx expo install --check` PASS; `expo export` web + android PASS (chạy sau lần sửa mã cuối).
- Web fixture (bundle mới): Admin, Specialist, Parent, Kid PIN (vào/sai PIN/đúng PIN qua BE), R1, R2 — PASS. Lưu ý: lần QA Web/Android trước review chạy trên một dev server khởi động trước vài sửa nhỏ cuối; Web đã chạy lại toàn bộ, Android chưa chạy lại.
- Story Wizard, Parent Reader: runtime NOT VERIFIED (mã không đổi; test tĩnh PASS).

### Việc cần chủ dự án quyết định
1. Chạy E2E thật (BE + tài khoản thử nghiệm Admin/Specialist).
2. Phạm vi 13 tính năng còn lại theo bảng trên.
3. Xoá `ModeratorAdminScreen.tsx` + nhánh MODERATOR/ADMIN không còn dùng trong `ParentTabs.tsx`.
4. Có đổi mặc định role khi BE không trả `role` (auth chung) hay không.
5. `App/CLAUDE.md` §2.4 vẫn ghi Admin/Specialist là SCOPE PENDING — cập nhật khi chốt phạm vi.

## 11. Quyết định đã duyệt và thực hiện (2026-10-28)
- Role: `authService.formatUser` không còn mặc định `PARENT`. Role thiếu/rỗng/không phải chuỗi → lỗi dữ liệu 502 (đăng nhập báo lỗi; khởi động app → màn lỗi có Thử lại/Đăng xuất). Role lạ → màn "chưa dùng được". Test: `management.test.ts`.
- Đã xoá `src/screens/scope-pending/ModeratorAdminScreen.tsx`, nhánh MODERATOR/ADMIN trong `ParentTabs.tsx` và `'MODERATOR'` khỏi `Role` (không còn nơi dùng). Giữ nguyên `SellerDashboard`, `MarketplaceScreen`, `ParentNavigator`. Mục 5 và 9 ở trên đã lỗi thời về điểm này.
- `App/CLAUDE.md` §2.4 cập nhật phạm vi Admin/Specialist; §10 giữ nguyên.
