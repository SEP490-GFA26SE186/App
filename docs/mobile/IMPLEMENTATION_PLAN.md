# IMPLEMENTATION PLAN – StoryWeaver Mobile

**Trạng thái:** T1.0 (rà soát, chỉ tài liệu) **HOÀN TẤT – CHỜ REVIEW**; kết quả ở [AUDIT_REPORT §5](./AUDIT_REPORT.md) (M01–M90). Mọi task **coding** (T1.1 trở đi, gồm T1.5–T1.12) **CHƯA BẮT ĐẦU / CHƯA DONE** – chỉ chạy khi có lệnh của người dùng.
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
| **T1.0** | Rà soát toàn bộ `screens/*`, `services/*`, `App.tsx`, `components/*` tìm mock/fallback (hoàn thiện U3) — **HOÀN TẤT, CHỜ REVIEW** | Danh sách đầy đủ file:dòng, cập nhật AUDIT_REPORT; không sửa code. Kết quả: 90 phát hiện (54 P0 / 29 P1 / 7 P2), 57 khối catch (A32/B18/C7), U3 đóng |
| **T1.1** | Dọn drift SDK 52 (`npx expo install --check`, **cần duyệt**) | `expo-asset`, `expo-font`, RN, haptics, speech đúng bản SDK 52; app khởi động; không đổi major |
| **T1.2** | Cấu hình env/base URL (không hardcode, không secret) — M03, M69 | Base URL đọc từ cấu hình; không còn URL localhost/PROD hardcode trong `config.ts` và UI; không lộ secret |
| **T1.3** | Gỡ chế độ `mock` và nút/prefill demo (`LoginScreen`, `AuthModal`, `config.ts`) — M01, M02, M60–M64, M67–M69 | Không còn `DEMO_CREDENTIALS`, giá trị `'mock'` trong `ApiEnvironment`, token giả demo, nút "Offline Demo", chip/nút demo, prefill email/mật khẩu/PIN, nhãn tiết lộ PIN mặc định; grep theo AUDIT_REPORT §5.1–5.9 sạch; `tsc --noEmit` pass |
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
`T1.0 → T1.2 → T2.1 → T2.2 → T3.x → T4.x → T5.x → T6.x → T7.1 → T9.1`; T1.3/T1.4 hoàn tất cùng T3.1/T3.3.
**M1-b (bổ sung từ T1.0):** `T1.0 → T1.3 → T1.5 → T1.7 → {T1.8, T1.9, T1.10, T1.11}`; `T1.4 + T1.6` hoàn tất cùng `T3.3` (sau T2.1/T2.2); T1.9 → nối thật ở T5.1/T5.2; T1.10 → T4.3/T6.x; T1.8 → T7.1; T1.12 liên quan T6.3/T9.2; T8.0 chờ quyết định M8.

## Câu hỏi cần nhóm trả lời trước khi tới task liên quan
1. PIN 4 hay 4–6 số (T3.2). 2. AI image placeholder (T5.4). 3. Audio BE hay TTS thiết bị (T6.3). 4. Phạm vi Seller/Specialist/Admin/Marketplace/Payment (M8). 5. BE có thêm mobile return URL payOS? (M8). 6. Expo Go/thiết bị với SDK 52 (T1.1).

## Rủi ro
- Runtime chưa kiểm chứng → cần chạy BE để test tích hợp (UNKNOWN U1).
- SDK 52 dần cũ; xem xét SDK 58 sau P0 bằng quyết định riêng.
- Contract có thể đổi khi BE cập nhật → đối chiếu lại Swagger trước mỗi task.
