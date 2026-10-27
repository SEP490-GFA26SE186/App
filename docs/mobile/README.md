# Tài liệu StoryWeaver Mobile

Mục lục tài liệu của `apps/mobile` (Expo SDK 52, React Native 0.76.9). Cập nhật: 2026-10-27.

**Hiện trạng:** R0–R9-A (UI/UX + ổn định Frontend) xong; **R9-B** (tích hợp API + test nghiệp vụ thật) đang chuẩn bị — tạo truyện AI bị chặn do Redis/AI worker/AI service chưa chạy. Chi tiết: [MOBILE_STATUS.md](MOBILE_STATUS.md).

| Tài liệu | Dùng để |
|---|---|
| [API_MAPPING.md](API_MAPPING.md) | Contract Mobile ↔ BE (nguồn chính khi gọi API) |
| [API_INTEGRATION_AUDIT.md](API_INTEGRATION_AUDIT.md) | Độ phủ endpoint BE trong phạm vi Mobile |
| [API_SWAGGER_TEST_MATRIX.md](API_SWAGGER_TEST_MATRIX.md) | Ma trận test endpoint theo Swagger |
| [BUSINESS_FLOW_MATRIX.md](BUSINESS_FLOW_MATRIX.md) | Luồng nghiệp vụ Parent/Kid |
| [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md) | ADR + phụ lục cổng grep G1–G11 |
| [UI_UX_REDESIGN_PLAN.md](UI_UX_REDESIGN_PLAN.md) | Design system "Warm Storybook Guardian" và lộ trình R0–R9 |
| [ENVIRONMENT.md](ENVIRONMENT.md) | Cấu hình `EXPO_PUBLIC_API_URL` |

Báo cáo QA từng đợt (R1–R9-A), ảnh QA, tiến độ Phase A–E/Safety Gate, audit và kế hoạch cũ đã được gộp vào [MOBILE_STATUS.md](MOBILE_STATUS.md) và xóa khỏi thư mục; bản gốc vẫn khôi phục được: `git show a9160a7:docs/mobile/<tên-file>`.
