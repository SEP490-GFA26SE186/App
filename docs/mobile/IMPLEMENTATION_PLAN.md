# IMPLEMENTATION PLAN – StoryWeaver Mobile

**Trạng thái:** CHƯA BẮT ĐẦU. M1 chưa được phép chạy khi chưa có lệnh của người dùng.
**Quyết định đã duyệt:** giữ Expo SDK 52 (A) · App là repo chính · Parent + Kid = P0 · Seller/Specialist/Admin/Marketplace/Payment = SCOPE PENDING · không xóa tính năng hiện có.

## Quy tắc chung
- Mỗi task nhỏ, có acceptance criteria (AC); làm xong → dừng báo cáo → người dùng review.
- Dependency chỉ cài khi task ghi rõ và được duyệt, bằng `npx expo install` (SDK 52).
- Không sửa Web/BE/App_v2. Không commit/push nếu chưa yêu cầu.
- Mỗi task: `npx tsc --noEmit` pass + grep xác nhận không còn mock liên quan.
- Tham chiếu: [API_MAPPING](./API_MAPPING.md), [BUSINESS_FLOW_MATRIX](./BUSINESS_FLOW_MATRIX.md), [ARCHITECTURE_DECISIONS](./ARCHITECTURE_DECISIONS.md), [AUDIT_REPORT](./AUDIT_REPORT.md).

---
## M1 – Nền tảng & dọn mock P0 (cần duyệt trước khi bắt đầu)
| Task | Nội dung | Acceptance criteria |
|---|---|---|
| **T1.0** | Rà soát toàn bộ `screens/*`, `services/*` tìm mock/fallback còn sót (hoàn thiện U3) | Danh sách đầy đủ file:dòng, cập nhật AUDIT_REPORT; không sửa code |
| **T1.1** | Dọn drift SDK 52 (`npx expo install --check`, **cần duyệt**) | `expo-asset`, `expo-font`, RN, haptics, speech đúng bản SDK 52; app khởi động; không đổi major |
| **T1.2** | Cấu hình env/base URL (không hardcode, không secret) | Base URL đọc từ cấu hình; không còn `localhost` hardcode trong UI; không lộ secret |
| **T1.3** | Gỡ chế độ `mock` và nút/prefill demo (`LoginScreen`, `AuthModal`) | Không còn `demo_mock_jwt_token`, "Offline Demo", mật khẩu `123456`, PIN `1234` prefill; grep sạch |
| **T1.4** | Xóa backdoor PIN `1234` ở `KidModeScreen.tsx:146` | Thoát Kid Mode chỉ khi BE xác nhận (hoàn tất cùng T3.3) |

> T1.3/T1.4 là **sửa hành vi giả**, không xóa tính năng nghiệp vụ; mọi màn hình khác giữ nguyên.

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
`T1.0 → T1.2 → T2.1 → T2.2 → T3.x → T4.x → T5.x → T6.x → T7.1 → T9.1`; T1.3/T1.4 hoàn tất cùng T3.1/T3.3.

## Câu hỏi cần nhóm trả lời trước khi tới task liên quan
1. PIN 4 hay 4–6 số (T3.2). 2. AI image placeholder (T5.4). 3. Audio BE hay TTS thiết bị (T6.3). 4. Phạm vi Seller/Specialist/Admin/Marketplace/Payment (M8). 5. BE có thêm mobile return URL payOS? (M8). 6. Expo Go/thiết bị với SDK 52 (T1.1).

## Rủi ro
- Runtime chưa kiểm chứng → cần chạy BE để test tích hợp (UNKNOWN U1).
- SDK 52 dần cũ; xem xét SDK 58 sau P0 bằng quyết định riêng.
- Contract có thể đổi khi BE cập nhật → đối chiếu lại Swagger trước mỗi task.
