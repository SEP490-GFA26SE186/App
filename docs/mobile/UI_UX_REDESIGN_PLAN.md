# StoryWeaver AI — Kế hoạch Redesign UI/UX Mobile

> **Giai đoạn:** Nghiên cứu & đề xuất. **Chưa** sửa source UI, **chưa** cài dependency, **không** commit/push.
> **Phạm vi:** `App/apps/mobile` (Expo SDK 52, RN 0.76, React 18.3). BE, Web, App_v2 chỉ đọc để tham chiếu.
> **Ngày lập:** 2026-10-26

---

## 0. Tóm tắt điều hành

1. **Thương hiệu đang lệch giữa các nền tảng.** Mascot cú (`src/assets/mascot/owl_mascot.png`, ảnh gốc `D:\video_intro\image_7b8261.png`) và Web (`Web/src/index.css` – "Warm Modern Guardian") cùng dùng **cam `#FF7A00` + xanh ngọc `#00A896` + nền kem `#FFFDF9`, font Comfortaa/Nunito Sans**. Mobile lại dùng bộ "Fairy Garden" **vàng `#FFD93D` + xanh lá `#6BCB77` + xanh trời**, font hệ thống. → Ưu tiên số 1 là **đồng bộ token với Web và mascot**.
2. **Lỗi tương phản nghiêm trọng (WCAG).** Chữ trắng trên nút xanh lá (2.0:1), mint (1.9:1), xanh trời (2.5:1); link "Đăng ký ngay" màu vàng trên nền trắng (1.38:1); lỗi form hiển thị bằng **màu vàng**; chữ phụ `#7F8C8D` (3.48:1).
3. **Icon bằng emoji** ở tab bar, menu, nút; `@expo/vector-icons` đã có trong `package.json` nhưng **0 lần sử dụng** → có thể chuyển sang icon vector **không cần thêm thư viện**.
4. **Kid Mode và Parent Mode chưa tách bạch về cảm giác thị giác**; Parent Home dồn quá nhiều khối ngang hàng, thiếu điểm nhấn chính.
5. **Một số dữ liệu "bịa" còn trong UI thật:** `CuteMascot` có câu "Bé đã thu thập được 12 ⭐ sao rồi!" hiển thị cho mọi user — vi phạm nguyên tắc cấm dữ liệu giả.
6. **Đề xuất:** chọn **Phương án A – "Warm Storybook Guardian"** (đồng bộ Web) làm nền, kèm lớp token riêng cho Kid Mode; triển khai theo 6 đợt, bắt đầu từ Design Tokens + UI kit (tác động toàn app, rủi ro API = 0).

---

## 1. Hiểu dự án

### 1.1 Bối cảnh & ràng buộc (từ `App/CLAUDE.md`, `App/AGENTS.md`, `docs/mobile/*`)

| Hạng mục | Hiện trạng |
|---|---|
| Stack | Expo ~52, RN 0.76.9, React 18.3.1, TS. Reanimated 3.16, react-native-svg, expo-linear-gradient, expo-haptics, expo-font, expo-speech, expo-video, `@expo/vector-icons` |
| Điều hướng | State-based (ADR-015): `AppNavigator` → `BOOTING / BOOT_ERROR / LOGIN / REGISTER / APP`; trong APP: `KidModeScreen` **hoặc** `ParentTabs` |
| Parent tabs | `HOME · LIBRARY · CREATE · EQ · WALLET` + màn con `MORE, CHILDREN, CHARACTERS, STORY, SETTINGS, HELP, MARKET (SCOPE PENDING, chỉ __DEV__)` |
| Kid Mode | Tủ sách → đọc → điểm dừng EQ (`KidCheckpointCard`) → hoàn thành; thoát bằng PIN 4–6 số xác minh **qua BE** |
| Intro | `IntroScreen` phát `intro.mp4` một lần mỗi lần khởi động, có "Bỏ qua" |
| Quy tắc cứng | Giữ SDK 52; không thêm/đổi dependency khi chưa duyệt; cấm fake-success/mock; không sửa BE/Web/App_v2; Seller/Admin/Marketplace = SCOPE PENDING |

### 1.2 Hai chế độ người dùng

| | **Parent Mode** | **Kid Mode** |
|---|---|---|
| Người dùng | Cha mẹ (25–40 tuổi), dùng nhanh, xen kẽ việc khác | Trẻ ~3–9 tuổi, có thể chưa đọc thạo |
| Mục tiêu | Quản lý bé, tạo truyện AI, đưa truyện lên tủ sách, xem EQ, theo dõi credit | Chọn truyện, đọc/nghe, trả lời điểm dừng cảm xúc |
| Giọng thiết kế | Hiện đại, ấm, đáng tin – **không trẻ con** | Sinh động, nút lớn, ít chữ, phản hồi tức thì |
| Mascot | Xuất hiện tiết chế: logo, empty state, gợi ý | Người dẫn chuyện: chào bé, khen, động viên ở điểm dừng |

### 1.3 Mascot

- Mascot chính thức: **Cú Lu Lu** – cú phù thủy đội mũ sao, cầm đũa sách (cam/xanh ngọc/vàng kim). `constants/mascot.ts` đã đúng.
- **Còn dấu vết mascot chó cũ:** `soundFX.playPuppy()` ("Playful Puppy Yip… Shiba mascot", `utils/sound-fx.ts:158`) vẫn được gọi ở `OwlMascot.tsx:129` và `ParentHomeScreen.tsx:116`.
- **Vấn đề asset:** chỉ có **một** file PNG dạng **huy hiệu tròn có chữ "StoryWeaver AI" in sẵn**. Khi hiển thị 34–42px (top bar, PIN modal) chữ bị vỡ, viền tròn chồng lên khung `borderRadius`. Cần (do nhóm thiết kế cung cấp, không tự vẽ/sao chép):
  - `owl_full.png` – cú tách nền (không chữ, không viền), ≥ 512px.
  - `owl_head.png` – chỉ đầu cú cho avatar/logo nhỏ.
  - (tùy chọn) 4–5 tư thế: vẫy tay, đọc sách, vỗ tay, ngủ, suy nghĩ → thay cho việc "đổi màu nền" trong `OwlMascot.STATE_VISUALS`.

---

## 2. Nghiên cứu tham khảo

### 2.1 Về Mobbin MCP — KHÔNG khả dụng

Đã gọi thật `mcp__mobbin__search_screens` (3 truy vấn: login app học tập trẻ em, home app đọc truyện trẻ em, dashboard phụ huynh) và `mcp__mobbin__search_flows` (onboarding app đọc cho trẻ). **Tất cả trả lỗi:**

```
Mobbin MCP requires a paid plan. Upgrade at https://mobbin.com/pricing to continue.
```

Theo lựa chọn của người dùng, phần tham khảo dưới đây dùng **nguồn web công khai có link thật** (App Store, trang chính thức, help center, bài phê bình UX, nghiên cứu học thuật). **Không có link Mobbin và không có ảnh chụp màn hình** trong báo cáo này; không bịa kết quả Mobbin. Khi có gói Mobbin, nên chạy lại các truy vấn ở Phụ lục B để bổ sung ảnh tham khảo.

> Lưu ý pháp lý: chỉ học **pattern**; không sao chép giao diện, nhân vật, minh họa hay tài sản có bản quyền của các app dưới đây.

### 2.2 Tham khảo theo nhóm màn hình

#### (1) Login / Register

| App | Nguồn | Pattern đáng học | Phù hợp / chưa phù hợp với StoryWeaver |
|---|---|---|---|
| Headspace | [Design critique – Pratt IXD (2026)](https://ixd.prattsi.org/2026/02/design-critique-headspace) · [Appcues GoodUX – onboarding](https://goodux.appcues.com/blog/headspaces-mindful-onboarding-sequence) | Onboarding dẫn dắt bằng minh họa, ít câu hỏi; phê bình chỉ ra nút "Start" chìm vào nền và mỗi màn thêm vào làm rơi người dùng (Headspace báo tỷ lệ rơi 38%) | ✅ Minh họa + 1 CTA rõ. ⚠️ StoryWeaver không cần onboarding dài: đã có Intro video → Login nên gọn, CTA tương phản cao |
| Headspace (redesign) | [Case study – Jennifer Qian](https://jenniferqian.cargo.site/headspace-redesign-1) | Giữ nhân vật minh họa + bảng màu cam ấm làm "chữ ký" thương hiệu; tránh trộn minh họa với ảnh chụp | ✅ Cú Lu Lu + cam/ngọc là chữ ký; không trộn ảnh `public/s1.jpg…` kiểu stock vào màn auth |
| ABC Kids (Úc) | [Education Today](https://educationtoday.com.au/news-detail/ABC-5134) | Đồng thiết kế với trẻ: "hấp dẫn nhưng không trẻ con" | ✅ Định hướng cho Parent Mode: ấm áp, không màu mè |

#### (2) Parent Home / Dashboard

| App | Nguồn | Pattern | Phù hợp / chưa |
|---|---|---|---|
| Epic – Kids' Books | [App Store](https://apps.apple.com/us/app/-/id719219382) · [TechHive hands-on](https://www.techhive.com/article/602406/hands-on-with-epic-the-all-you-can-read-ebook-service-for-kids.html) | Hồ sơ phụ huynh quản lý tối đa 4 bé; dashboard: số sách, số phút, lần đọc gần nhất; drill-down theo từng bé | ✅ Khớp `GET /children/:id/overview` (phút đọc, lượt đọc, sách trên tủ). Nên trình bày dạng **stat tiles** thay vì dòng chữ |
| Lingokids – Parents Area | [Help: Parents Area](https://help.lingokids.com/hc/en-us/articles/115005129325-Parents-Area) · [Help: Progress reports](https://help.lingokids.com/hc/en-us/articles/9569447484177-Lingokids-Progress-reports) | Khu phụ huynh tách riêng sau cổng; 4 mục rõ ràng; dashboard tóm tắt trước, chi tiết sau | ✅ Tách bạch Parent/Kid. ✅ "Tóm tắt trước, chi tiết sau" |
| Khan Academy (Parent Dashboard) | [Help center](https://support.khanacademy.org/hc/de/articles/360039664491) · [Góp ý của phụ huynh](https://support.khanacademy.org/hc/es/community/posts/360062531571/comments/4420586812429) | Dashboard là "hub"; phụ huynh phàn nàn khi chỉ thấy danh sách bài lẻ mà không thấy **tổng quan tiến độ** | ⚠️ Bài học: Home phải trả lời ngay "Hôm nay bé thế nào?" |

#### (3) Kid Home / Tủ sách của bé

| App | Nguồn | Pattern | Phù hợp / chưa |
|---|---|---|---|
| Khan Academy Kids | [Review – CSU Thinkspace](https://thinkspace.csu.edu.au/thelibrarykingdom/?p=185) · [Common Sense Media](https://www.commonsensemedia.org/app-reviews/khan-academy-kids) | Home rất gọn: avatar bé góc trên, **một nút Play lớn ở giữa**, nhân vật là điểm chạm, thư viện ở góc | ✅ Kid Home nên có **1 hành động chính "Đọc tiếp"** + lưới bìa sách lớn |
| Duolingo ABC | [Nghiên cứu so sánh – JPP (UM)](https://journals.um.ac.id/index.php/jpp/article/view/1406) · [iMore](https://imore.com/duolingo-releases-iphone-and-ipad-app-help-kids-learn-read) | Điều hướng tối thiểu số bước, màu cân bằng không quá kích thích, chữ sans-serif lớn, mascot biểu cảm tăng gắn kết | ✅ Toàn bộ kết luận áp dụng trực tiếp cho Kid Mode |
| Moshi Kids | [Common Sense Media](https://www.commonsensemedia.org/app-reviews/moshi-kids-sleep-meditation) · [App Store](https://apps.apple.com/in/app/id1306719339) | Hồ sơ riêng từng bé; bé tự chọn truyện mỗi tối (phụ huynh đánh giá cao); minh họa giúp chọn | ✅ Bé tự chọn từ tủ sách do cha mẹ kiểm soát (đúng mô hình `POST /bookshelf`) |
| Sago Mini World | [Thư gửi phụ huynh](https://sagomini.com/article/world-letter-to-parents/) · [Common Sense – Sago Mini Friends](https://www.commonsensemedia.org/app-reviews/sago-mini-friends) | Nút "Parents" nhỏ ở góc, có cổng (gesture) → trẻ tự khám phá an toàn | ✅ Nút "Thoát" của Kid Mode nên nhỏ, góc trên, dẫn vào PIN (đã có) — không cạnh tranh với nút đọc |

#### (4) Story Wizard (tạo truyện AI)

| App | Nguồn | Pattern | Phù hợp / chưa |
|---|---|---|---|
| My Bedtime Story: AI Stories | [App Store](https://apps.apple.com/us/app/my-bedtime-story-ai-stories/id6449901963) | Chọn nhân vật, bối cảnh, cốt truyện; app gợi ý; phụ huynh thêm bài học (moral); nhiều hồ sơ bé | ✅ Khớp bước "Bé sẽ tập gì?" (CASEL). ✅ Gợi ý sẵn giảm ô trống |
| My Magic Stories | [App Store](https://apps.apple.com/us/app/my-magic-stories/id6738098734?l=en-US) | Tạo nhân vật chính theo tên/tuổi/sở thích/tính cách + nhân vật phụ | ✅ Tương ứng "Nhân vật gia đình" + ⭐ nhân vật chính |
| Oscar Stories | [G2](https://ai.g2.com/marketplace/tools/oscar-stories) · [The Decoder](https://the-decoder.com/?p=3983) | Bé là nhân vật chính; truyện → audiobook giọng đọc | ✅ Định vị "bé là nhân vật chính" nên nổi bật ở bước chọn nhân vật |
| Your AI Bedtime Stories | [App Store](https://apps.apple.com/us/app/your-ai-bedtime-stories/id6756010994) | Chọn **độ dài** truyện như một lựa chọn rõ ràng | ✅ Bước "Độ dài" nên dạng segmented 3 lựa chọn kèm **chi phí credit** |
| AI credit UX | [Towards AI – "Show the cost before the click"](https://pub.towardsai.net/ai-credit-pricing-ux-show-the-cost-before-the-click-ce25489465c7) | Hiện chi phí **ngay cạnh nút** trước khi bấm | ✅ Nút "Tạo truyện" nên ghi "Tạo truyện · 💎 N credit" (N lấy từ BE; nếu BE không trả → không hiển thị số, ghi UNKNOWN) |

#### (5) Bookshelf (Tủ truyện phụ huynh)

| App | Nguồn | Pattern | Phù hợp / chưa |
|---|---|---|---|
| Epic | [TechHive](https://www.techhive.com/article/602406/hands-on-with-epic-the-all-you-can-read-ebook-service-for-kids.html) | Lưới bìa sách lớn, lọc theo bé | ✅ Bìa là "anh hùng" của thẻ; trạng thái là badge nhỏ |
| Khan Academy Kids | [CSU review](https://thinkspace.csu.edu.au/thelibrarykingdom/?p=185) | Thư viện chia theo định dạng & chủ đề | ✅ Tab lọc trạng thái (Nháp / Đang tạo / Hoàn thành) dạng segmented, không phải chip rời |
| Vooks | [FAQ](https://info.vooks.com/vooks-faq) | Thư viện tuyển chọn, không quảng cáo | ✅ Tủ truyện bé chỉ chứa sách cha mẹ đã duyệt |

#### (6) Reader (Trình đọc)

| App | Nguồn | Pattern | Phù hợp / chưa |
|---|---|---|---|
| Apple Books | [Apple Support – Books](https://support.apple.com/guide/books/ibks8923126d/mac) · [AppleInsider](https://appleinsider.com/inside/ios-18/tips/inside-apple-books----the-best-app-for-book-lovers/amp) | Giao diện đọc tối giản, **ẩn control đến khi chạm**; theme nền ấm (Quiet/Paper); chỉnh cỡ chữ "A/A" | ✅ Reader phụ huynh (`StoryReaderModal`): nền giấy kem, control ẩn/hiện, nút cỡ chữ |
| Vooks | [Read-Aloud Hub](https://info.vooks.com/read-aloud-hub) · [App Store](https://apps.apple.com/US/app/id1435813450) | **Tô sáng từng từ theo giọng đọc** (read-along) | ✅ Đã có `expo-speech`; highlight từng từ phụ thuộc sự kiện `onBoundary` (chỉ có ở một số nền tảng) → ghi **UNKNOWN**, cần thử trên Android/Web trước khi hứa |
| Moshi | [Common Sense Media](https://www.commonsensemedia.org/app-reviews/moshi-kids-sleep-meditation) | Phê bình: minh họa biến mất khi audio chạy → mất hứng thú | ✅ Khi đọc, **tranh luôn là trọng tâm** (≥ 50% chiều cao) |

#### (7) EQ Report

| App | Nguồn | Pattern | Phù hợp / chưa |
|---|---|---|---|
| Lingokids Progress Center | [Help: Progress reports](https://help.lingokids.com/hc/en-us/articles/9569447484177-Lingokids-Progress-reports) | **Cổng dữ liệu rỗng:** báo cáo trống cho tới khi bé xong 5 hoạt động, kèm giải thích | ✅ Khớp `level = null → "Chưa có dữ liệu"`; nên thêm **"cần đọc thêm N truyện có điểm dừng"** nếu BE cung cấp, không tự đoán N |
| Stop, Breathe & Think Kids / Breathe, Think, Do with Sesame | [Educational App Store](https://www.educationalappstore.com/app/breathe-think-do-with-sesame) · [App Store](https://apps.apple.com/app/id721853597) | Trẻ chọn **emoji cảm xúc**; phần phụ huynh có **gợi ý hoạt động** thay vì chỉ số liệu | ✅ Báo cáo EQ nên kèm "Gợi ý cho ba mẹ" theo năng lực (đã có `recommendations`) |
| Finch | [Pratt IXD critique](https://ixd.prattsi.org/2025/09/design-critique-finch-ios-app-2/) · [Vocal critique](https://vocal.media/critique/the-criousity-of-the-finch-app) | Mascot làm check-in cảm xúc bớt "nặng nề"; phê bình: mục tiêu hằng ngày gây cảm giác tội lỗi | ⚠️ **Không** dùng streak/điểm phạt cho trẻ; dùng ngôn ngữ khích lệ, không xếp hạng (khớp nguyên tắc "chỉ MỨC, không điểm/%" của `EqReportScreen`) |
| ClassDojo | [Connect Safely](https://connectsafely.org/classdojo-app-offers-students-parents-words-of-encouragement) · [eSchool News](https://www.eschoolnews.com/2015/01/26/classdojo-classroom-management-349/?print) | Tiến độ "nhìn lướt là hiểu", tập trung phản hồi tích cực | ✅ Mỗi năng lực: icon + tên + thanh 3 mức + 1 câu diễn giải |

#### (8) Wallet / Credit

| Nguồn | Pattern | Phù hợp / chưa |
|---|---|---|
| [ScreensDesign – Credits & tokens](https://screensdesign.com/explore/screens/credits-and-tokens/) | Số dư ở header hoặc thanh trạng thái cố định, chevron dẫn đến trang quản lý | ✅ Đã có pill credit ở top bar — cần vùng chạm ≥ 44pt |
| [Atria – AI credit breakdown](https://intercom.help/atria-e5456f8f6b7b/en/articles/16844665-your-ai-credit-breakdown) · [Figma forum](https://forum.figma.com/report-a-problem-6/ai-credits-exhausted-despite-limited-usage-52254) | Lịch sử chi tiết theo từng yêu cầu; người dùng mất niềm tin khi credit "tự giảm" | ✅ Lịch sử nhóm theo ngày, mỗi dòng có icon loại (viết/vẽ/giọng), +/− màu, liên kết tới truyện |
| [Schematic – AI credits](https://schematichq.com/blog/what-are-ai-credits) | Ghi rõ quy tắc reset/hết hạn credit | ✅ Hiển thị "credit tháng hết hạn ngày …" nếu BE trả `credit_expire` |

#### (9) Profile / Settings / Hồ sơ bé

| App | Nguồn | Pattern | Phù hợp / chưa |
|---|---|---|---|
| Moshi Kids | [Common Sense Media](https://www.commonsensemedia.org/app-reviews/moshi-kids-sleep-meditation) | Mỗi bé một hồ sơ; cá nhân hóa theo tuổi/sở thích | ✅ `ChildrenScreen` dạng thẻ avatar lớn + hành động "Vào Chế độ Bé" |
| Lingokids | [Help: Parents Area](https://help.lingokids.com/hc/en-us/articles/115005129325-Parents-Area) | Profile là 1 trong 4 mục rõ ràng của khu phụ huynh | ✅ Gộp "Thêm" thành màn **Hồ sơ** có nhóm: Gia đình / Tài khoản / An toàn trẻ em / Hỗ trợ |
| Sago Mini | [sagomini.com](https://sagomini.com/article/world-letter-to-parents/) | Cài đặt phụ huynh tách biệt, trẻ không chạm được | ✅ PIN Kid Mode đặt trong nhóm "An toàn trẻ em" |

---

## 3. Audit giao diện hiện tại

Phương pháp: đọc trực tiếp source các màn hình/component (không chỉ tên file), đo tương phản bằng công thức WCAG 2.1, đếm mẫu bằng grep. **Chưa** chạy app trên thiết bị trong giai đoạn này — các mục cần xác minh trên máy thật được ghi **[cần kiểm tra thiết bị]**.

Mức ưu tiên: **P0** = lỗi chặn/vi phạm quy tắc/khả năng tiếp cận nghiêm trọng · **P1** = ảnh hưởng lớn trải nghiệm · **P2** = đánh bóng.

### 3.1 Số liệu tổng quan

| Chỉ số | Giá trị | Ghi chú |
|---|---|---|
| Mã màu hex hard-code trong `screens/` + `components/` | **157** | Token `Colors` bị bỏ qua nhiều nơi (`#B91C1C`, `#2563EB`, `#FEE2E2`, `#F1F5F9`…) |
| Chữ cỡ ≤ 11px | **41** chỗ | Tab label 10px, tag 8px, env bar 10.5px |
| `accessibilityLabel/Role` | **8** trên toàn app | Hầu hết nút/icon không có nhãn cho trình đọc màn hình |
| `fontFamily` / `useFonts` | **0** | Dùng font hệ thống; Web dùng Comfortaa + Nunito Sans |
| `@expo/vector-icons` sử dụng | **0** (đã cài) | Toàn bộ icon là emoji |
| Component không được import | `components/auth/AuthModal.tsx` (681 dòng), `components/animations/CloudPopEntrance.tsx`, `components/ui/HeyProgressBar.tsx` | Mã chết — **không xóa khi chưa được duyệt** |

### 3.2 Tương phản màu (đo thực tế)

| Cặp màu | Tỷ lệ | Chuẩn AA (4.5 chữ thường / 3.0 chữ lớn) | Nơi dùng |
|---|---|---|---|
| Trắng trên `#6BCB77` (secondary) | 2.01 | ❌ | Nút `variant="secondary"`, nút Xác nhận PIN, nút "Tiếp tục" ở điểm dừng |
| Trắng trên `#7ECBA1` (mint/teal) | 1.92 | ❌ | Nút "Chế độ Bé" ở Parent Home |
| Trắng trên `#4DABF7` (sky) | 2.48 | ❌ | Nút `variant="sky"` |
| `#FFD93D` trên trắng | 1.38 | ❌ | Link "Đăng ký ngay ➔" (`LoginScreen`), **chữ lỗi của `HeyInput`** |
| `#7F8C8D` trên trắng | 3.48 | ❌ (chữ thường) | `textSecondary` – mô tả, phụ đề khắp app |
| `#6B4500` trên `#FFD93D` | 6.16 | ✅ | Nút primary (đạt) |
| *(tham khảo)* Trắng trên `#FF7A00` (Web primary) | 2.61 | ❌ | → Phương án mới cần sắc độ đậm hơn cho nền nút/chữ |

### 3.3 Vấn đề theo hạng mục

| # | Hạng mục | Vấn đề | Ưu tiên | File |
|---|---|---|---|---|
| A1 | Thương hiệu | Bảng màu vàng/xanh lá lệch với mascot cú (cam/ngọc) và Web (cam/ngọc/kem/navy) | **P0** | `theme/colors.ts`, `theme/shadows.ts` |
| A2 | Dữ liệu giả | Tip mascot "Bé đã thu thập được 12 ⭐ sao rồi!" hiển thị như dữ liệu thật; tip "Nhấn vào 'Sáng Tác AI'" sai tên nút | **P0** | `components/CuteMascot.tsx:30-37` |
| A3 | Thương hiệu | Âm thanh "puppy" (mascot chó cũ) gắn vào cú và nút Chế độ Bé | P1 | `utils/sound-fx.ts:158`, `OwlMascot.tsx:129`, `ParentHomeScreen.tsx:116` |
| A4 | Mascot | Asset duy nhất là huy hiệu có chữ; dùng ở 34–60px bị vỡ chữ, "badge trong badge" | P1 | `HeyTopBar.tsx`, `LoginScreen.tsx`, `KidModeScreen.tsx` (PIN modal) |
| B1 | Tương phản | Xem 3.2 | **P0** | `HeyButton.tsx`, `HeyInput.tsx`, `LoginScreen.tsx`, `KidCheckpointCard.tsx` |
| B2 | Form | Lỗi field hiển thị **màu vàng** (`Colors.primary`) – trông như cảnh báo nhẹ, không đọc được | **P0** | `HeyInput.tsx` (`inputError`, `errorText`) |
| B3 | Form | Viền input xanh lá 20% alpha gần như vô hình; không có trạng thái focus | P1 | `HeyInput.tsx` |
| C1 | Typography | Không có thang chữ (type scale); cỡ 8–26 tùy ý; weight 900 dùng tràn lan làm mất phân cấp | P1 | toàn bộ `screens/*` |
| C2 | Typography | Chữ ≤ 11px (tab label 10, tag "Bé Yêu" 8, tagline 10, env bar 10.5) | P1 | `HeyTabBar.tsx`, `HeyTopBar.tsx`, `LoginScreen.tsx` |
| C3 | Typography | Reader phụ huynh: thân truyện 15/22 – nhỏ cho đọc to cùng bé | P1 | `StoryReaderModal.tsx:327` |
| D1 | Icon | Emoji làm icon điều hướng (🌱📚🪄⭐💎), menu (👶⚙️❓), nút (🚀⏳➕) – hiển thị khác nhau giữa Android/iOS/Web, không đổi màu theo trạng thái active | P1 | `HeyTabBar.tsx`, `ParentTabs.tsx` (moreItems), nhiều nút |
| E1 | Bottom nav | Tab "Credit" chiếm 1 trong 5 vị trí chính dù tần suất dùng thấp; đã có pill credit ở top bar → trùng lặp | P1 | `HeyTabBar.tsx`, `navigation/routes.ts` |
| E2 | Bottom nav | Nút Kid Mode (`onOpenKidMode`) truyền vào tab bar nhưng **không hiển thị**; lối vào Kid Mode nằm rải rác (Home, Children) | P1 | `HeyTabBar.tsx` |
| E3 | Bottom nav | Vùng chạm tab: `paddingVertical: 4` + icon 19 + label 10 ≈ 40pt (< 44) | P1 | `HeyTabBar.tsx` |
| E4 | Top bar | Pill credit ~24pt cao, avatar 34pt – dưới 44pt; nút logo bấm chỉ để "nảy" (không có chức năng) | P1 | `HeyTopBar.tsx` |
| E5 | Top bar | Top bar giống nhau ở mọi tab; màn con dùng thêm `ScreenHeader` → 2 tầng header | P2 | `ParentTabs.tsx`, `ScreenHeader.tsx` |
| F1 | Hierarchy | Parent Home: lời chào → mascot bubble → switcher → 2 nút lớn → overview dạng text → truyện gần đây → 2 link card → chips. Không có "điểm nhấn" chính; overview là các dòng chữ có emoji | P1 | `ParentHomeScreen.tsx` |
| F2 | Hierarchy | Library: mỗi thẻ đều có nút outline "Thêm vào tủ sách bé" → lưới lặp nặng nề; chip lọc là 6 chip rời | P1 | `LibraryScreen.tsx` |
| F3 | Hierarchy | Story Wizard: 4 section dọc trên một trang dài, số bước tròn nhỏ; không có thanh tiến độ/sticky CTA; chi phí credit không nằm cạnh nút | P1 | `StoryWizard.tsx` |
| F4 | Hierarchy | EQ Report: 5 thẻ giống hệt nhau, không có tổng quan/diễn giải; khi lỗi dùng `variant="empty"` thay vì `error` | P1 | `EqReportScreen.tsx` |
| F5 | Hierarchy | Wallet: số dư, gói, lịch sử cùng trọng lượng thị giác; gói dạng danh sách dài | P2 | `WalletScreen.tsx` |
| G1 | States | Có `StateView` dùng chung (tốt) nhưng Kid Mode tự dựng empty/error riêng; error dùng icon ⚠️ cùng phong cách với empty | P2 | `StateView.tsx`, `KidModeScreen.tsx` |
| G2 | States | Loading chủ yếu là spinner; danh sách nên dùng skeleton để giảm "nhảy layout" | P2 | `LibraryScreen`, `KidModeScreen`, `ParentHomeScreen` |
| G3 | Feedback | 14 chỗ `Alert.alert` cho thành công/lỗi (vd "Đã thêm vào tủ sách") – hộp thoại hệ thống chặn luồng, trên Web hiển thị thô | P2 | `ParentTabs.tsx`, các màn Parent |
| H1 | Kid Mode | Cỡ chữ đọc 18/30 tốt; nút trang ~46pt, chữ "👈 Trang trước" dài → nên icon lớn + nhãn ngắn; nút "Bỏ qua" ở điểm dừng 12px chữ xám | P1 | `KidModeScreen.tsx`, `KidCheckpointCard.tsx` |
| H2 | Kid Mode | Nhiều emoji trang trí (☁️⛅) + animation stagger mỗi thẻ; chưa tôn trọng "giảm chuyển động" (Reduce Motion) | P2 | `KidModeScreen.tsx` |
| H3 | Kid Mode | PIN modal chiếm toàn màn với bàn phím tùy biến tốt; nút C/⌫ là ký tự không có nhãn trợ năng | P2 | `KidModeScreen.tsx` |
| I1 | Responsive | Kích thước đo `Dimensions.get('window')` một lần (không cập nhật khi xoay/đổi cửa sổ Web); Login có `maxWidth: 420` nhưng các màn Parent không giới hạn bề rộng → trên Web màn rộng, thẻ kéo dài cả màn | P1 | `HeyTabBar.tsx`, `StoryReaderModal.tsx`, các màn Parent |
| I2 | Responsive | `boxShadow` dùng cho mọi bóng đổ; trên RN 0.76 chỉ render khi bật **New Architecture** — `app.json` không khai báo `newArchEnabled` | P1 | `theme/shadows.ts` + mọi component **[cần kiểm tra thiết bị Android]** |
| J1 | Login | Hiển thị URL máy chủ cho người dùng cuối ở màn Login | P1 | `LoginScreen.tsx` (envBar) → chỉ hiện ở `__DEV__` |
| J2 | Login | Tiêu đề 26/900 + tagline in hoa 10px + bubble + card – 4 tầng nội dung trước form | P2 | `LoginScreen.tsx` |
| K1 | Discoverability | "Nhân vật gia đình", "Bé nhà mình" (cần cho Wizard) bị giấu trong menu "Thêm" sau avatar | P1 | `ParentTabs.tsx`, `MoreScreen.tsx` |
| K2 | Discoverability | Chips "Chuyện mẫu" ở Home đều mở Wizard nhưng **không chọn sẵn mẫu đó** | P2 | `ParentHomeScreen.tsx` |
| L1 | Code UI | `HeyCard` có 8 variant tên lệch nghĩa (`coral`, `purple` → thực ra vàng/tím nhạt); `HeyButton` có `primary`=`yellow`=`kid` | P2 | `HeyCard.tsx`, `HeyButton.tsx` |
| L2 | Code UI | `TouchableOpacity` khắp nơi, không có trạng thái pressed/focus nhất quán; trên Web không có focus ring | P2 | toàn app |

### 3.4 Điểm mạnh nên giữ

- Kiến trúc trạng thái rõ: `StateView` dùng chung, `useAsyncResource` có loading/error/reload, banner lỗi dữ liệu có "Thử lại".
- Ngôn ngữ thân thiện, đúng giọng "ba mẹ / bé".
- Kid Mode: cỡ chữ đọc 18/30, tiến độ trang, điểm dừng EQ có phản hồi từ BE, PIN xác minh qua BE.
- Intro video có "Bỏ qua", ẩn app bên dưới khỏi trình đọc màn hình.
- Animation Reanimated nhẹ, có spring cho phản hồi chạm.

---

## 4. Đề xuất hệ thống thiết kế StoryWeaver

Cả 3 phương án đều:
- Dùng **cam + xanh ngọc + kem/trắng** theo mascot.
- Dùng **`@expo/vector-icons`** (đã cài) thay emoji cho icon chức năng; emoji chỉ còn ở nội dung cảm xúc của trẻ (chọn cảm xúc ở điểm dừng).
- Font: nạp file `.ttf` (giấy phép SIL OFL, tải từ Google Fonts) vào `src/assets/fonts/` bằng **`expo-font` đã cài** → **không thêm package npm**. Việc thêm file font vẫn **cần người dùng duyệt** trước khi làm.
- Token đặt tại `src/theme/*` với tên **ngữ nghĩa** (`bg`, `surface`, `text`, `textMuted`, `brand`, `onBrand`…) để đổi phương án chỉ cần sửa token.
- Vùng chạm ≥ 44pt (Parent), ≥ 56pt (Kid); chữ thân ≥ 15px (Parent), ≥ 18px (Kid).

### Phương án A — "Warm Storybook Guardian" (đồng bộ Web) ⭐ Đề xuất

**Ý tưởng:** Mobile dùng cùng ngôn ngữ thị giác với Web: nền kem ấm, thẻ trắng có viền mảnh, cam là hành động chính, xanh ngọc là trạng thái tích cực/Kid Mode, navy là chữ. Kid Mode dùng **cùng palette** nhưng tăng kích thước, bo góc và độ bão hòa.

**Bảng màu**

| Token | HEX | Dùng cho | Tương phản |
|---|---|---|---|
| `brand` (cam) | `#FF7A00` | Nền nút chính với **chữ navy**, icon active, điểm nhấn | navy trên cam 5.60:1 ✅ |
| `brandStrong` | `#C2410C` | Chữ/link màu cam trên nền sáng, nút chính chữ trắng (tùy chọn) | trắng 5.18 ✅ |
| `brandTint` | `#FFF3E6` | Nền chip/badge cam, vùng nổi bật nhẹ | — |
| `teal` | `#00A896` | Kid Mode, thành công, tiến độ EQ (nền icon/thanh) | dùng chữ navy hoặc `tealStrong` |
| `tealStrong` | `#007A6E` | Chữ/nút xanh ngọc chữ trắng | trắng 5.24 ✅ |
| `tealTint` | `#E6F7F5` | Nền thẻ Kid/EQ | — |
| `gold` (mũ cú) | `#F5B83D` | Sao, phần thưởng, credit (chỉ trang trí, không làm nền chữ) | — |
| `canvas` | `#FFFDF9` | Nền màn hình | — |
| `surface` | `#FFFFFF` | Thẻ | — |
| `surfaceWarm` | `#FDF8F0` | Thẻ phụ, reader nền giấy | — |
| `outline` | `#F1E8DC` | Viền thẻ/input | — |
| `text` (navy) | `#1E293B` | Chữ chính | 14.4 ✅ |
| `textMuted` | `#6B5547` | Chữ phụ (đậm hơn `#8C7263` của Web để đạt 6.85) | ✅ |
| `danger` | `#BA1A1A` / tint `#FFDAD6` | Lỗi | trắng 6.46 ✅ |
| `info` | `#2563EB` / tint `#E8EDF7` | Thông tin | ✅ |

**Typography** (giống Web): Display **Comfortaa 700** (tiêu đề, tên app, số liệu lớn) · Body **Nunito Sans 400/600/800** (cả hai có hỗ trợ tiếng Việt – Web đang nạp `subset=vietnamese`).

| Cấp | Parent | Kid |
|---|---|---|
| Display | Comfortaa 28/36 | Comfortaa 32/40 |
| Title | Comfortaa 20/28 | Comfortaa 24/32 |
| Heading | Nunito Sans 800 17/24 | Nunito Sans 800 20/28 |
| Body | Nunito Sans 400 15/22 | Nunito Sans 700 18/30 (đọc truyện 20/32) |
| Caption | Nunito Sans 600 13/18 (tối thiểu 12) | ≥ 15 |

**Component**

| | Parent | Kid |
|---|---|---|
| Button | Pill, cao 48; Primary: nền `brand` chữ navy 800; Secondary: viền 1.5 `outline` chữ navy; Tertiary: chữ `brandStrong`; Destructive: `danger` | Cao 64, bo 24, icon 28 + nhãn 1–2 từ; Primary: `brand`; "Tiếp" luôn bên phải |
| Card | Bo 20, nền trắng, viền 1px `outline` + bóng rất nhẹ (ring), padding 16 | Bo 28, bìa sách chiếm 70% thẻ, nhãn dưới ≥ 16px |
| Input | Cao 52, bo 14, viền `outline`, focus viền `brand` 2px, nhãn trên, lỗi `danger` + icon dưới field | (không có form trong Kid Mode, trừ PIN) |
| Icon | Ionicons outline 24 (inactive) / filled (active) | Ionicons filled 32+ hoặc minh họa mascot |
| Chip/Segmented | Segmented control 3–4 lựa chọn (lọc trạng thái, độ dài truyện) | — |

**Navigation:** Bottom tab 4 mục + FAB giữa — `Trang chủ · Tủ truyện · [＋ Sáng tác] · EQ · Hồ sơ`. **Credit** chuyển vào pill ở header + mục trong Hồ sơ. Nút **"Chế độ Bé"** cố định ở header Home (nút teal có avatar bé), không chiếm tab.

**Bố cục chính:**
- *Parent Home:* Header (chào + avatar + credit pill) → **Thẻ hero của bé đang chọn** (avatar, tên, 3 stat tiles: phút đọc hôm nay / truyện trên tủ / năng lực EQ có dữ liệu, nút teal "Vào Chế độ Bé") → "Tiếp tục" (truyện gần nhất / bản nháp) → Lối tắt EQ → Chuyện mẫu (carousel ngang, bấm là chọn sẵn mẫu).
- *Kid Home:* Header teal nhạt cong, cú vẫy tay + "Chào {tên}!" → nút lớn "Đọc tiếp" (nếu có tiến độ) → lưới bìa 2 cột → nút Thoát nhỏ góc phải.

**Ưu điểm:** nhất quán Web ↔ Mobile ↔ mascot (một thương hiệu); token có sẵn từ Web nên ít tranh luận; đạt tương phản AA; trông "người lớn" đủ cho Parent mà vẫn ấm.
**Nhược điểm:** Kid Mode dễ bị "nhạt" nếu chỉ phóng to – cần đầu tư minh họa mascot; Comfortaa nét mảnh ở cỡ nhỏ (chỉ dùng ≥ 17px); cam chữ trắng không đạt → phải kỷ luật dùng chữ navy trên cam.

---

### Phương án B — "Soft Playful Clay"

**Ý tưởng:** phong cách *claymorphism nhẹ*: khối bo tròn dày, viền 2–3px, bóng kép (trong + ngoài), màu bão hòa hơn – cảm giác "đồ chơi". Áp dụng mạnh cho Kid Mode, nhẹ hơn cho Parent.

| Token | HEX |
|---|---|
| Primary (cam) | `#F97316` (chữ navy `#0F172A`) · Strong `#C2410C` |
| Teal | `#14B8A6` · Strong `#0F766E` (trắng 5.47) |
| Sun (vàng mũ cú) | `#FBBF24` |
| Background | `#FFF7ED` |
| Card | `#FFFFFF`, viền `#FED7AA` 2px |
| Text | `#1E293B` · Muted `#57534E` |
| Danger | `#DC2626` |

**Typography:** Display **Baloo 2 700** (tròn, dày, hỗ trợ tiếng Việt) · Body **Nunito 400/700**. *(Fredoka – font được bộ dữ liệu thiết kế gợi ý – không được chọn vì hỗ trợ dấu tiếng Việt chưa đảm bảo; cần kiểm tra nếu muốn dùng.)*

**Component:** Button cao 52/68 với "đế" bóng đậm phía dưới (nhấn xuống thì đế mất – cảm giác bấm thật); Card bo 24–32, viền màu; Input bo 16 viền 2px; Icon filled dày (MaterialCommunityIcons).

**Navigation:** Tab bar nổi dạng pill (giữ cấu trúc hiện tại) 5 mục: `Trang chủ · Tủ truyện · [Sáng tác] · EQ · Hồ sơ`.

**Bố cục:** Nhiều khối màu (thẻ cam, thẻ ngọc, thẻ vàng) xen kẽ; mascot xuất hiện ở hầu hết màn.

**Ưu điểm:** trẻ thích, rất "storybook"; gần với cảm giác hiện tại nên chuyển đổi ít sốc.
**Nhược điểm:** Parent Mode dễ "trẻ con" – trái mục tiêu; bóng kép phụ thuộc `boxShadow` (rủi ro Android chưa bật New Architecture – mục I2); nhiều khối màu làm loãng phân cấp; lệch phong cách Web.

---

### Phương án C — "Two Worlds" (tách hẳn Parent/Kid)

**Ý tưởng:** Parent Mode là ứng dụng **trung tính, hiện đại kiểu dashboard** (nhiều trắng, navy, cam chỉ là điểm nhấn); Kid Mode là **một "thế giới" riêng** rực rỡ, toàn màn hình, chuyển cảnh bằng animation "mở sách". Reader có chế độ **giấy** riêng.

| | Parent | Kid | Reader |
|---|---|---|---|
| Nền | `#F8FAFC` | `#FFF4E5` → gradient `#FFE3C2` | `#FBF6EC` (giấy) |
| Bề mặt | `#FFFFFF`, viền `#E2E8F0` | `#FFFFFF` bo 32 | — |
| Chữ | `#0F172A` / muted `#475569` | `#3A2A1E` | `#3A2A1E` (13.0:1) |
| Nhấn chính | `#EA580C` (chỉ CTA) | `#FF7A00` + `#00A896` | control `#6B5547` |
| Phụ | `#0F766E` | `#F5B83D` | — |

**Typography:** Parent **Be Vietnam Pro** (thiết kế cho tiếng Việt, rõ ràng, chuyên nghiệp) · Kid **Baloo 2** · Reader **Nunito 20/32**.

**Component:** Parent – button bo 12 (không pill), card phẳng viền xám, icon outline 22; Kid – nút tròn 72–88, thẻ bìa lớn; Reader – control ẩn, chạm để hiện.

**Navigation:** Parent dùng tab bar chuẩn 5 mục (không FAB nổi); Kid không có tab bar, chỉ có "Tủ sách ↔ Đọc".

**Ưu điểm:** phân biệt rõ nhất hai đối tượng; Parent trông "chuyên nghiệp" nhất (hợp đồ án demo cho hội đồng); Kid tự do sáng tạo.
**Nhược điểm:** hai hệ token → công bảo trì gấp đôi; dễ cảm giác "hai app khác nhau"; Parent quá trung tính làm mờ thương hiệu cú; lệch Web (Web dùng Comfortaa/cam đậm hơn).

---

### 4.4 Bảng so sánh phương án

| Tiêu chí | A. Warm Storybook Guardian | B. Soft Playful Clay | C. Two Worlds |
|---|---|---|---|
| Nhất quán với Web | ⭐⭐⭐⭐⭐ (cùng token, cùng font) | ⭐⭐ | ⭐⭐ |
| Nhất quán với mascot cú | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Parent "hiện đại, không trẻ con" | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Kid "sinh động, nút lớn" | ⭐⭐⭐⭐ (cần minh họa) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Reader tập trung nội dung | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Tương phản / Accessibility | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Rủi ro kỹ thuật (shadow Android, hiệu năng) | Thấp | **Trung bình – cao** | Thấp |
| Công sức triển khai | Trung bình | Trung bình | **Cao** (2 hệ token) |
| Thêm dependency | Không (font file + vector-icons có sẵn) | Không | Không |
| **Khuyến nghị** | ✅ **Chọn** | Lấy riêng "nút có đế" cho Kid Mode | Lấy riêng **Reader chế độ giấy** |

> **Đề xuất cuối:** **A làm nền** + mượn từ C chế độ Reader "giấy" + mượn từ B kiểu nút có đế cho Kid Mode (thực hiện bằng `borderBottomWidth`, không phụ thuộc `boxShadow`).

---

## 5. Lộ trình triển khai

### 5.1 Nguyên tắc bảo toàn (áp dụng mọi đợt)

- **Chỉ đổi lớp trình bày** (styles, layout, component UI). Không đổi `services/*`, `stores/*`, `apiClient`, mapper, kiểu dữ liệu, chữ ký props mà store/navigation đang dùng.
- **Không chạm logic:** auth/token/refresh single-flight, `SessionProvider`, kid session tách riêng, PIN qua BE, `IntroScreen` (chỉ được đổi màu nút "Bỏ qua" nếu cần), `BackHandler`.
- **Không dữ liệu giả:** số liệu chỉ từ BE; thiếu dữ liệu → empty/"chưa hỗ trợ". Ảnh minh họa demo chỉ trong UI Preview `__DEV__` (ADR-020).
- **Không thêm thư viện UI**, không nâng Expo SDK 52. Font: file `.ttf` + `expo-font` có sẵn — **cần duyệt trước**.
- **Không xóa màn/tính năng** (gồm cả `AuthModal`, `CloudPopEntrance`, `HeyProgressBar` chưa dùng) khi chưa được duyệt.
- Mỗi task: `npx tsc --noEmit`, `tests/authRace.test.ts`, chạy thử Android + Web, so sánh trước/sau bằng ảnh chụp.

### 5.2 Các đợt (ưu tiên theo tác động / rủi ro)

| Đợt | Nội dung | Tác động | Rủi ro API | File chính |
|---|---|---|---|---|
| **R0 – Chuẩn bị** (cần duyệt) | Chốt phương án; nhận asset cú tách nền; duyệt thêm file font; kiểm tra `boxShadow` trên Android thật (quyết định dùng `elevation`/viền thay thế) | — | 0 | `app.json` (chỉ đọc), `assets/` |
| **R1 – Design tokens** | Viết lại `theme/colors.ts` theo token ngữ nghĩa (giữ alias cũ tạm thời để không vỡ màn), `typography.ts` (thang chữ), `spacing.ts`, `shadows.ts` (an toàn Android); nạp font | Toàn app | 0 | `theme/*`, `App.tsx` (chỉ thêm `useFonts`, không đổi luồng Intro/Session) |
| **R2 – UI kit** | `HeyButton` (variant ngữ nghĩa: primary/secondary/tertiary/danger/kid, `Pressable`, ≥ 44pt, a11y), `HeyInput` (focus, lỗi đỏ + icon), `HeyCard`, `HeyChip` → Segmented, `Badge`, `StateView` (error ≠ empty, skeleton), `ScreenHeader`; thêm `Icon` wrapper cho `@expo/vector-icons`; toast nhẹ thay `Alert` cho thông báo thành công | Toàn app | 0 | `components/ui/*` |
| **R3 – Khung điều hướng Parent** | `HeyTopBar` (logo đầu cú, credit pill 44pt, bỏ tag 8px), `HeyTabBar` (icon vector, 4 tab + FAB, Credit → Hồ sơ), `MoreScreen` → "Hồ sơ" có nhóm | Mọi màn Parent | Thấp (chỉ đổi `TAB_ROUTES`, giữ `ROUTES.WALLET`) | `components/parent/HeyTopBar.tsx`, `HeyTabBar.tsx`, `navigation/routes.ts`, `screens/parent/MoreScreen.tsx` |
| **R4 – Kid Mode** | Kid Home (header, "Đọc tiếp", lưới bìa), Reader trẻ em (tranh lớn, nút trang 64pt), `KidCheckpointCard` (nút cảm xúc lớn, "Bỏ qua" rõ), PIN modal (nhãn a11y), Reduce Motion | Trải nghiệm cốt lõi của trẻ | Thấp (giữ `useKidReader`, `onExitKidMode`) | `screens/kid/KidModeScreen.tsx` (tách component con), `components/kid/*` |
| **R5 – Parent Home + Login/Register** | Home hero bé đang chọn + stat tiles từ `overview`; sửa tip mascot giả (A2) và âm thanh puppy (A3); Login/Register gọn, link tương phản, ẩn URL máy chủ ngoài `__DEV__` | Ấn tượng đầu, demo | Thấp | `ParentHomeScreen.tsx`, `CuteMascot.tsx`, `LoginScreen.tsx`, `RegisterScreen.tsx`, `BootScreen.tsx` |
| **R6 – Story Wizard** | Stepper có thanh tiến độ, mỗi bước một màn/khối, sticky CTA "Tạo truyện · 💎 N" (N từ BE), segmented độ dài; `GenerationRunner` có cú "đang suy nghĩ" | Tính năng chính | Trung bình (luồng tạo truyện có polling) → chỉ đổi phần hiển thị | `StoryWizard.tsx`, `components/parent/Generation*.tsx`, `CharacterFormSheet.tsx` |
| **R7 – Tủ truyện + Story Detail + Reader phụ huynh** | Lưới bìa sạch, "Thêm vào tủ sách" vào menu/chi tiết; Reader chế độ giấy, chỉnh cỡ chữ, control ẩn | Cao | Thấp | `LibraryScreen.tsx`, `StoryDetailScreen.tsx`, `StoryReaderModal.tsx` |
| **R8 – EQ Report + Wallet + Children/Characters/Settings/Help** | EQ: tổng quan + thẻ năng lực + gợi ý cho ba mẹ; Wallet: thẻ số dư lớn, gói dạng thẻ, lịch sử nhóm theo ngày; các màn quản lý dùng list chuẩn | Trung bình | Thấp | `EqReportScreen.tsx`, `WalletScreen.tsx`, `ChildrenScreen.tsx`, `CharactersScreen.tsx`, `SettingsScreen.tsx`, `HelpScreen.tsx` |
| **R9 – Hoàn thiện** | Responsive Web (giới hạn bề rộng nội dung ~720px, `useWindowDimensions`), rà a11y (nhãn, focus Web), tương phản cuối, ảnh chụp so sánh | Chất lượng | 0 | toàn app |

*SCOPE PENDING (`MarketplaceScreen`, `SellerDashboard`, `ModeratorAdminScreen`): chỉ tự hưởng token mới qua R1/R2, **không** redesign riêng.*

### 5.3 Checklist chấp nhận cho mỗi màn

- [ ] Tương phản chữ ≥ 4.5:1 (chữ lớn ≥ 3:1); không còn chữ < 12px (Parent) / < 15px (Kid).
- [ ] Vùng chạm ≥ 44pt (Parent) / ≥ 56pt (Kid); khoảng cách giữa vùng chạm ≥ 8px.
- [ ] Icon chức năng là vector có `accessibilityLabel`; emoji chỉ là nội dung.
- [ ] Đủ trạng thái loading (skeleton nếu là danh sách) / empty / error (có "Thử lại") / chưa hỗ trợ.
- [ ] Không màu hex hard-code ngoài `theme/`.
- [ ] Không thay đổi request/response API; `tsc` sạch; test auth race đạt.
- [ ] Chạy đúng trên Android (máy thật) và Web (360px và ≥ 1024px).
- [ ] Không có số liệu/nhãn bịa.

---

## Phụ lục A — Quyết định cần người dùng chốt

1. Chọn phương án **A / B / C** (đề xuất: A + Reader giấy của C + nút có đế của B).
2. Cho phép thêm file font `.ttf` (Comfortaa, Nunito Sans; OFL) vào `src/assets/fonts/` và nạp bằng `expo-font` có sẵn?
3. Nhóm có thể cung cấp asset cú **tách nền / không chữ** (và các tư thế) không? Nếu không, giữ huy hiệu hiện tại ở cỡ ≥ 64px và dùng chữ "StoryWeaver" + icon cho logo nhỏ.
4. Đồng ý chuyển **Credit** khỏi tab bar (giữ ở header + Hồ sơ)?
5. Đồng ý thay `Alert.alert` (thông báo thành công) bằng toast tự viết (không thư viện)?

## Phụ lục B — Truy vấn Mobbin để chạy lại khi có gói trả phí

`search_screens` (iOS): "children's learning app login screen" · "kids storybook reading app home screen" · "parent dashboard home screen in kids education app" · "AI story generator create story step" · "kids app bookshelf library grid" · "children's ebook reader page" · "child progress report emotional skills" · "credits balance and usage history" · "parent profile settings with child profiles" · "parental gate PIN keypad".
`search_flows` (iOS): "kids reading app onboarding" · "create AI story flow" · "switch to kid mode with parental gate".

## Phụ lục C — Nguồn

- Web tokens: `Web/src/index.css` (dòng 1–48), `Web/index.html` (Google Fonts Comfortaa + Nunito Sans, subset vietnamese).
- Mobile: các file đã dẫn trong mục 3.
- Tham khảo bên ngoài: tất cả link trong mục 2.2.
- Hướng dẫn thiết kế nội bộ (skill `ui-ux-pro-max`): ngưỡng 44pt, tương phản 4.5:1, không dùng emoji làm icon, `Pressable` + `hitSlop` cho React Native.
