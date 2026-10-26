# PHASE A – TIẾN ĐỘ REFACTOR KIẾN TRÚC (A0.2 → A9)

Cập nhật: 2026-10-26 · Nhánh `refactor/mobile-web-integration` · Baseline: `3c01bba` (A0.1).
Kết luận: **PHASE A DONE-STATIC – RUNTIME VERIFICATION PENDING.** Thay đổi chưa commit. Không dùng bundle/tsc làm bằng chứng app chạy được.

## Trạng thái task
| Task | Nội dung | Trạng thái | Ghi chú |
|---|---|---|---|
| A0.1 | Căn chỉnh dependency SDK 52 | DONE-STATIC (commit `3c01bba`) | không đổi lại |
| A0.2 | Cấu hình `EXPO_PUBLIC_API_URL` | DONE-STATIC | không còn `localhost`/`10.0.2.2`/domain production trong code; thiếu cấu hình → lỗi rõ ràng, không gửi request; `.env.example` + `docs/mobile/ENVIRONMENT.md` |
| A1 | Baseline & quy ước | DONE | `tsc` pass; đường dẫn **tương đối**; alias `@/` **không dùng** (chưa xác minh Metro SDK 52 hỗ trợ không cần cấu hình thêm; `paths` trong tsconfig giữ nguyên, không dùng) |
| A2 | UI kit | **PARTIAL** | Đã có `Screen` (dùng ở mọi nhánh của navigator); `HeyInput` đã có `autoCapitalize/autoCorrect/editable` (S0.7). **Chưa làm** `Sheet`, `Toaster`, `SelectField`, `Badge`, `TextField`: chưa có màn hình nào cần, tạo trước là abstraction thừa → làm ở Phase B khi có nơi dùng |
| A3 | Stores phiên | DONE-STATIC | `stores/` = 3 hook độc lập + `SessionProvider` (React context). **Chưa có toast store** (chưa có nơi dùng; vẫn `Alert`) |
| A4 | Navigation layer | DONE-STATIC | `navigation/routes.ts` (ROUTES typed), `AppNavigator`, `ParentTabs`; không còn `setCurrentTab('…')`/chuỗi tab rải rác. **Không tạo `KidStack`** riêng: Kid Mode chỉ có 1 màn, wrapper rỗng là thừa |
| A5 | Tổ chức screens/components | DONE-STATIC | 15 file di chuyển (giữ ≥79% nội dung; `KidModeScreen` 99%), 86 import tự động viết lại, không xóa file/màn |
| A6 | DTO types | DONE-STATIC | `types/api.ts` chỉ chứa trường có trong API_MAPPING/BE; dùng làm generic cho `apiFetch` ở các service. Mapper `formatChild/Character/Story` còn nhận `any` (đọc trường legacy) → siết ở T4.1/T4.2 |
| A7 | Gỡ phụ thuộc legacy utils | DONE-STATIC | `sound-fx.ts`, `speech-tts.ts` **sao chép nguyên văn** vào `apps/mobile/src/utils` (bản gốc ở `App/src/utils` không đụng); không còn import ra ngoài `apps/mobile` ngoài `packages/shared-types` |
| A8 | Cô lập dữ liệu mẫu | DONE-STATIC | `services/demoData.ts` → `src/dev/demo/demoData.ts`; `CURATED_DEMO_STORIES` → `src/dev/demo/curatedStories.ts`; không file nào ngoài `src/dev/` import chúng |
| A9 | Cổng Phase A | DONE-STATIC | xem "Kiểm tra" |

## Cấu trúc thực tế (`apps/mobile`)
```
App.tsx                      13 dòng: <SessionProvider><AppNavigator/></SessionProvider>
.env.example                 mẫu EXPO_PUBLIC_API_URL (không bí mật)
src/
  navigation/                routes.ts (ROUTES), AppNavigator (theo appPhase → Login/Register/Boot/Parent/Kid), ParentTabs (khung Parent)
  stores/                    useAuthSession (phiên Parent), useParentData (bé/nhân vật/truyện/mẫu + trạng thái tải),
                             useKidSession (Kid Mode, tách riêng), SessionProvider (ghép + 3 context: useAuth/useParentData/useKidSession)
  screens/
    auth/                    LoginScreen, RegisterScreen, BootScreen (+BootErrorScreen)
    parent/                  ParentHomeScreen, StoryWizard, EqReportScreen, WalletScreen
    kid/                     KidModeScreen
    scope-pending/           MarketplaceScreen, SellerDashboard, ModeratorAdminScreen (giữ nguyên, không phát triển thêm)
  components/
    ui/                      Hey* + Screen (primitive dùng chung)
    auth/                    AuthModal
    parent/                  HeyTopBar, HeyTabBar, StoryReaderModal
    (gốc)                    CuteMascot, ShibaMascot, IntroScreen(chưa dùng), animations/CloudPopEntrance(chưa dùng)
  services/                  config (đọc env), apiClient, authService, childService, characterService, storyService, kidService, storage
  types/                     sessionUser (view model), api (DTO của BE)
  theme/                     colors, spacing, shadows (không đổi)
  utils/                     sound-fx, speech-tts (bản dùng cho mobile)
  dev/demo/                  demoData, curatedStories — fixture UI Preview, KHÔNG dùng trong runtime thật
```

## Quyết định
1. State nằm đúng chỗ: dữ liệu phiên trong `stores/`; trạng thái điều hướng (tab, role) trong `AuthedNavigator` (mount trong phiên → tự reset khi đăng xuất/đổi tài khoản, vẫn giữ tab khi vào/thoát Kid Mode); modal/đang đọc truyện là state cục bộ của `ParentTabs`.
2. Cô lập Kid khỏi Parent: 2 context riêng; `SessionProvider` chỉ nối chúng qua callback (`onReset`, `onExited`).
3. Biến môi trường: chấp nhận origin hoặc kèm `/api/v1`, luôn chuẩn hóa; chỉ `__DEV__` mới cho nhập địa chỉ tạm thời ở tab "API".
4. Không thêm dependency, không đổi Expo/`tsconfig`, không sửa BE/Web/App_v2/`packages/`.

## Thay đổi hành vi có chủ ý (ngoài di chuyển)
- A0.2: bỏ công tắc Dev/Prod và URL hardcode ở màn Login và AuthModal; thiếu cấu hình hiển thị cảnh báo.
- A6: `formatUser` bỏ 6 lần đọc trường BE không trả (`avatarUrl`, `updatedAt`, `creditBalance`, `sellerAvailableBalance`, `sellerPendingBalance`, `bankAccount`) → luôn `undefined` từ trước, kết quả không đổi.
- `MarketplaceScreen.onStoryPurchased` trước đây thêm truyện cục bộ; callback này chưa từng được gọi → nay no-op.

## Kiểm tra đã chạy (không phải runtime app)
- `npx tsc --noEmit` pass; `git diff --check` sạch; `npx expo install --check` "up to date".
- Metro bundle **Android** và **Web** thành công (có và không có `EXPO_PUBLIC_API_URL`); giá trị biến được nhúng đúng; bundle không chứa `10.0.2.2`/domain production.
- Bộ test logic tạm (scratchpad, mock `fetch`, **không nằm trong repo**): 48/48 ca có cấu hình + 8/8 ca thiếu cấu hình.
- Đồ thị import: 52 file, **0 vòng phụ thuộc**; import ra ngoài `apps/mobile` chỉ còn `packages/shared-types`; 5 file chưa được import đều đã chưa được import từ trước hoặc là fixture (`IntroScreen`, `CloudPopEntrance`, `theme/index`, `dev/demo/*`).
- Grep cổng: không còn `'1234'`, `mock_`, `DEMO_*` ngoài `src/dev/`, `ai-generate`, `localhost`, `10.0.2.2`.

## Chưa kiểm thử (RUNTIME NOT TESTED)
Chưa chạy app trên emulator/thiết bị/Expo Go và chưa chạy BE. Cần kiểm: khởi động với và không có `.env`; BOOTING → Login/APP; đăng nhập/đăng xuất/đổi tài khoản; mất mạng ở BOOTING; điều hướng 5 tab; vào/thoát Kid Mode (PIN đúng/sai) và quay lại đúng tab; Kid session hết hạn; Wallet bị khóa; trạng thái rỗng/lỗi; tab "API" ở `__DEV__`.
Store/navigation (React) chưa có test tự động (không có test runner, chưa được duyệt thêm).

## Việc tiếp theo
Phase B (chờ lệnh): đồng bộ UI/nghiệp vụ với Web; khi đó bổ sung các primitive A2 còn thiếu và UI chọn bé (B2).
