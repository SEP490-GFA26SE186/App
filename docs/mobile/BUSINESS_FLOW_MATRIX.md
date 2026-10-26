# BUSINESS FLOW MATRIX – StoryWeaver Mobile

Ưu tiên: **P0 = Parent + Kid**. Còn lại **SCOPE PENDING**. Trạng thái dựa trên đọc code tĩnh (runtime UNKNOWN).
Nguồn chuẩn: Web (`Web/src/pages/*`, `Web/src/services/*.js`, `Web/src/hooks/useStudio.js`) và BE (`BE/src/modules/*`).

## 1. Ma trận P0 (Parent + Kid)
| # | Luồng | Web | BE | Mobile hiện tại | Hành động |
|---|---|---|---|---|---|
| F1 | Đăng ký / đăng nhập | API thật | `/auth/register`, `/auth/login` | Có nhánh login demo giả | Nối thật, bỏ demo |
| F2 | Phiên & refresh token | single-flight refresh | rotating 15m/7d | Không có | Thêm client + SecureStore |
| F3 | Đặt / đổi Kid PIN | API thật | `/auth/kid-pin/set|change` (4–6 số) | Lưu/so sánh cục bộ | Nối thật |
| F4 | Quản lý hồ sơ trẻ | API thật | `/children` (quota theo plan) | Mapper bịa field | Sửa mapper |
| F5 | Nhân vật gia đình | API thật | `/characters` (không có `role`) | Đọc `role` | Sửa mapper |
| F6 | Tạo truyện (family/topic/handwritten) | 3 entry, analyze | `/stories`, `/stories/analyze` | `entry:'custom'`, endpoint không tồn tại | Làm lại |
| F7 | Generate + theo dõi | poll 3s | `/stories/:id/generate`, `/generation` | Fake timer | Làm lại |
| F8 | Biên tập & review | API thật | `/stories/:id/*`, `/review` | Chưa nối | Theo Web |
| F9 | Thêm truyện vào tủ sách trẻ | API thật | `/bookshelf` (ready-check) | Chưa đúng | Nối thật |
| F10 | Vào Kid Mode | API thật | `/auth/kid-mode/enter` (kid token 24h) | PIN cục bộ | Nối thật |
| F11 | Kid: tủ sách | API thật | `/bookshelf?childId` / kid shelf | Sai schema | Sửa mapper |
| F12 | Kid: đọc + checkpoint | `StoryReaderPage.jsx` | `/kid/sessions`, `/answer`, `/progress`, `/complete` | Sai schema | Làm lại |
| F13 | Thoát Kid (PIN) | PIN dialog | `/auth/kid-mode/exit` (lockout 5/15') | Backdoor `1234` | Nối thật |
| F14 | Báo cáo EQ / overview | API thật | `/children/:id/overview`, eq-report/journey | Fallback bịa | Nối thật |
| F15 | Gói / credit (xem) | API thật | `/plans`, `/subscriptions/me`, credit-history | Chưa rõ | Chỉ hiển thị, không nạp giả |

## 2. State transitions chính
**Phiên:** `anonymous → (login) → parent[accessToken+refreshToken] → (kid-mode/enter) → kid[kidSessionToken 24h] → (kid-mode/exit + PIN) → parent[tokens mới]`. 401 ở kid → kết thúc kid session (không refresh bằng parent token).

**Tạo truyện AI:** `draft → (generate) → generating[queued→processing] → ready | failed | blocked` ; generation stale sau 10 phút; 402 nếu thiếu credit; `review` hoàn tất (422 nếu thiếu).

**Kid session:** `start (story phải trong bookshelf & readiness.ready, nếu không 422) → đọc trang (progress) → checkpoint (chỉ qua khi done) → complete (idempotent)`; chỉ lần trả lời đầu ở lượt chơi đầu được chấm; sai lần đầu → hint → thử lại; session đã kết thúc → 409.

**PIN:** 5 lần sai → khóa 15 phút (429 `retryAfterSeconds`; 401 `attemptsLeft`); in-memory phía BE.

**Credit:** nguồn duy nhất là plan (không có top-up). Hiển thị `user.wallet.creditBalance`.

## 3. Rule nghiệp vụ BE cần tôn trọng
- Tạo truyện: topic cần `topicId`, không `situation`; family cần `situation` 20–2000 + `analysisToken`, không `topicId`; `characters` đúng 1 main; custom không AI.
- Child: `name ≤100`, `birthDate YYYY-MM-DD`; vượt quota → "maximum limit of N child profiles"; xóa mềm, hủy kid session.
- Character: `appearance` 3–1000 ký tự.
- Bookshelf: idempotent; 422 nếu truyện chưa ready.

## 4. SCOPE PENDING (giữ nguyên, không xóa, không phát triển thêm)
| Nhóm | Web | BE | Mobile | Ghi chú |
|---|---|---|---|---|
| Seller (parent + canSell) | có | `/sellers/*`, `/listings/*`, earnings/bank/withdrawals | màn hình hiện có (mock) | `publish-version`=501 (BLOCKED) |
| Specialist | `/specialist/*` | `/moderation/*`, `/topics`, `/sub-skills`, `/question-templates`, `/checkpoint-review`, `/pedagogy` | màn hình hiện có (mock) | chờ nhóm xác nhận |
| Admin | `/admin/*` | `/admin/*` | màn hình hiện có (mock) | chờ nhóm xác nhận |
| Marketplace | có | `/market/*` | màn hình hiện có | chờ nhóm xác nhận |
| Payment / checkout | có | `/payments/*`, payOS webhook | chưa/mock | deep link BLOCKED; top-up không tồn tại |

**Quy tắc cho SCOPE PENDING:** không thêm tính năng; không xóa; không được giả thanh toán/ví. Việc chuyển mock → "chưa kết nối" cần task riêng được duyệt.

## 5. Câu hỏi mở
- PIN mobile 4 hay 4–6 số? · AI image có placeholder? · Audio BE hay TTS thiết bị? · Phạm vi role/marketplace/payment có vào mobile không?
