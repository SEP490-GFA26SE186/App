# ARCHITECTURE CLEANUP REPORT – App (Mobile only)

Ngày: 2026-10-26 · Nhánh `refactor/mobile-web-integration` · HEAD khi bắt đầu `3121bf5`, working tree sạch. **Chưa commit.**
Kết luận: **DONE-STATIC. API RUNTIME = NOT TESTED** (Backend không chạy được; chưa smoke test trên thiết bị).

## Giai đoạn 1 – App_v2 (READ-ONLY)
App_v2: Expo SDK 58, Expo Router (`src/app`), TanStack Query, Zustand, `components/{auth,kid,parent,ui}`, `hooks`, `services`, `stores`, `theme`, `types`, `utils`, `mocks`.
| Khía cạnh | App_v2 | App (sau cleanup) | Quyết định |
|---|---|---|---|
| Phân lớp thư mục | components/hooks/services/stores/types/utils/theme | components/screens/services/stores/types/utils/theme/constants/navigation | Tương đương, giữ |
| Điều hướng | Expo Router | state trong `navigation/` (ADR-015) | Không đổi (giữ SDK 52) |
| Data fetching/state | TanStack Query + Zustand | `services/` + `stores/` (React context) | Không thêm dependency |
| Mock | thư mục `mocks` | chỉ `src/dev/**` (`__DEV__`) | Không sao chép mock |
| SDK | 58 | 52 | Không nâng |

## Giai đoạn 2 – Audit (phân loại)
| Phần | Loại | Bằng chứng |
|---|---|---|
| `apps/mobile/**`, `docs/mobile/**`, AGENTS/CLAUDE/README/.gitignore | KEEP | |
| `packages/shared-types` | REFACTOR | 24 file Mobile import qua `../../packages/shared-types` → chuyển vào `apps/mobile/src/types/domain.ts` (git mv, 220 dòng chỉ là type, không có logic) |
| `apps/api` (6 file AI/cron/payment/moderation/EQ, Gemini SDK) | REMOVE | grep: Mobile không import; code server phía BE |
| `prisma/`, `server.ts`, `package.json`/lock/`tsconfig.json` gốc, `vite.config.ts`, `index.html`, `metadata.json`, `src/` gốc (prototype Vite + shims + mockData), `.env.example` gốc (GEMINI_API_KEY/PORT) | REMOVE | Mobile không tham chiếu (G9 = 0); `apps/mobile` có package.json/lock/tsconfig riêng |
| `public/` gốc, `video_intro_app/` | REMOVE | `apps/mobile/public` có bản riêng của asset Mobile dùng (`/intro.mp4`, `s1-3.jpg`); gốc chỉ phục vụ Vite |
| `metro.config.js` watch workspace root / `tsconfig` paths alias | REFACTOR | bỏ phụ thuộc vào file ngoài `apps/mobile` |
| Màn SCOPE PENDING | KEEP | Không loại tính năng nào khỏi App (đã ẩn lối vào ở production từ Phase D) |
| `src/dev/demo`, `src/dev/preview` | KEEP | Preview `__DEV__`; bundle production không chứa (xem GĐ5) |

## Giai đoạn 3 – Đã xóa (39 file theo `git status`)
`apps/api/**` (6), `prisma/schema.prisma`, `server.ts`, `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `metadata.json`, `.env.example` (gốc), `src/**` gốc (14: App, main, index.css, components ×3, shims ×3, utils ×4), `public/**` gốc (8), `video_intro_app/**` (1), `packages/shared-types.ts`, `packages/shared-types/package.json`.
**Dependency gốc đã gỡ cùng package.json gốc:** @google/genai, express, dotenv, vite, tailwind, react 19, motion, lucide-react, tsx… (toàn bộ thuộc prototype Vite/Express). `apps/mobile/package.json` **không đổi**.
Không đụng dữ liệu thật hay credentials (không đọc giá trị trong `.env*`).

## Giai đoạn 4 – Sửa / di chuyển
- `git mv packages/shared-types/index.ts → apps/mobile/src/types/domain.ts`; 24 file đổi import thành đường dẫn tương đối nội bộ; sửa comment cũ trong `types/api.ts`, `sessionUser.ts`, `viewModels.ts`.
- `apps/mobile/tsconfig.json`: bỏ paths alias tới packages. `apps/mobile/metro.config.js`: về cấu hình mặc định Expo.
- `README.md` viết lại; `CLAUDE.md` cập nhật dòng legacy.
- Kiến trúc `apps/mobile` đã đồng dạng App_v2 ở mức phù hợp; không refactor thêm để tránh rủi ro. Giữ 409 thật của Kid Reader, endpoint/contract, Preview chỉ dev. C2/C11 không đổi.

## Giai đoạn 5 – Kiểm tra
| Kiểm tra | Kết quả |
|---|---|
| `npx tsc --noEmit` (apps/mobile) | 0 lỗi |
| `npx expo install --check` | "Dependencies are up to date" |
| `expo export --platform android` | OK (AppEntry .hbc 2.63 MB) |
| `expo export --platform web` | OK (1.1 MB) |
| Import graph | không còn import ra ngoài `apps/mobile` (grep `packages/`, `../../../../src`) ; không import prisma/express/@google/genai |
| Bundle production (web) | không chứa `UI Preview`, `KidPreview`, `DEMO_CHILDREN`, `prisma`, `GEMINI`, `genai` |
| Scripts/entry | `apps/mobile/package.json` `main: expo/AppEntry.js` → `App.tsx`; script gốc `mobile` đã biến mất cùng package.json gốc (README hướng dẫn chạy trong `apps/mobile`) |
| `git diff --check` | 0 (chỉ cảnh báo LF→CRLF) |
| Smoke test thiết bị / API runtime | **NOT TESTED** |

## Final review (đã được duyệt: AGENTS.md, bỏ `kidModePinHash`, giữ SCOPE PENDING)
- **Quyết định thực hiện:** `App/AGENTS.md` cập nhật theo Mobile-only (chỉ dòng "file khác trong App" và mô tả repo; quy tắc BE/Web/App_v2 giữ nguyên). `SEP/AGENTS.md` chỉ include `App/AGENTS.md`, không có tham chiếu lỗi thời nên không đổi. Đã xóa `kidModePinHash: '1234'` trong `src/dev/demo/demoData.ts` (trường tùy chọn; các nơi khác chỉ đọc `!!kidModePinHash` từ `hasKidPin` của BE; không thêm PIN thay thế). Màn SCOPE PENDING giữ nguyên, vẫn ẩn lối vào ở production.
- **Git diff:** 39 file xóa (không file nào dưới `apps/mobile` hay `docs`), 1 rename (`shared-types/index.ts` → `src/types/domain.ts`, chỉ đổi 1 dòng comment đầu file; các type giữ nguyên), 30 file sửa (24 import + tsconfig/metro/3 comment/README/CLAUDE/AGENTS/demoData), 1 file mới (báo cáo này).
- **Tham chiếu tới root package.json/Vite/Prisma/server.ts/apps/api:** không có `.github`/CI; grep trong `apps/mobile` (src, App.tsx, package.json, app.json, .env.example) không thấy prisma/vite/express/genai/GEMINI/api key; `AGENTS.md`/`CLAUDE.md` đã cập nhật. Các file `docs/mobile/*` cũ (AUDIT_REPORT, PHASE_*, ARCHITECTURE_DECISIONS…) vẫn nhắc các thư mục đã xóa như **bối cảnh lịch sử**, giữ nguyên.
- **Import ngoài `apps/mobile`:** quét tự động mọi import tương đối → 0.
- **API service/DTO/business flow:** `services/*`, `types/api.ts`, `stores/*`, `screens/*` không bị xóa; chỉ đổi đường dẫn import type.
- **Secrets/mock vào production:** bundle web production không chứa `DEMO_`/`UI Preview`; không có secret server trong Mobile (`.env.example` chỉ có `EXPO_PUBLIC_API_URL`).
- **Kiểm tra lại:** `tsc --noEmit` = 0; `expo export` Android và Web OK; `git diff --check` = 0 (chỉ cảnh báo LF/CRLF).
- Review thực hiện thủ công bằng grep/diff/tsc (không chạy skill code-review riêng để tránh trùng lặp).

## Còn tồn tại
1. Ảnh Unsplash trong fixture các màn SCOPE PENDING; phạm vi chờ nhóm xác nhận.
2. Docs lịch sử còn nhắc `apps/api`, `server.ts`… (cố ý giữ).
3. Chưa smoke test thiết bị; API RUNTIME = NOT TESTED; C2 (token an toàn) và C11 (audio) chưa làm.
