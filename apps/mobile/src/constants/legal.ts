// apps/mobile/src/constants/legal.ts
// GĐ C – Nội dung trang "Chính sách bảo mật" và "Điều khoản dịch vụ", CHÉP NGUYÊN VĂN từ Web:
// src/pages/legal/PrivacyPolicyPage.jsx, src/pages/legal/TermsPage.jsx, src/constants/legal.js (Web c1311e5).
// Web đổi nội dung thì chép lại ở đây. Mỗi phần tử `body`: chuỗi = một đoạn; mảng = một danh sách gạch đầu dòng.
import { formatNumber } from '../utils/format';

export const LEGAL_VERSION = '1.0';
export const LEGAL_EFFECTIVE_DATE = '18/10/2026';
// Web để trống (chưa có email hỗ trợ chính thức) → trang hiện hướng dẫn liên hệ chung
export const SUPPORT_EMAIL = '';

// Con số khớp cấu hình mặc định của hệ thống (Web constants/legal.js POLICY_NUMBERS)
export const POLICY_NUMBERS = {
  sellerSharePercent: 80,
  earningHoldDays: 3,
  refundWindowDays: 3,
  minWithdrawalVnd: 50000,
  reportThreshold: 3,
  strikeValidDays: 90,
  strikeLimit: 3,
};

export type LegalBody = string | string[];
export interface LegalSection {
  title: string;
  body: LegalBody[];
}
export interface LegalDocument {
  title: string;
  intro: string;
  sections: LegalSection[];
}
export type LegalDocKey = 'privacy' | 'terms';

const N = POLICY_NUMBERS;
const vnd = (n: number) => `${formatNumber(n)}đ`;

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: 'Ai dùng StoryWeaver và chúng tôi xử lý dữ liệu của ai',
    body: [
      'Tài khoản chỉ dành cho người lớn (phụ huynh, người giám hộ). Trẻ không tự tạo tài khoản; bé dùng Chế độ Trẻ Em (Kid Mode) bên trong tài khoản của ba mẹ và chỉ thoát ra được bằng mã PIN của ba mẹ.',
      'Vì vậy dữ liệu về bé luôn do ba mẹ cung cấp và quản lý. Ba mẹ đồng ý với chính sách này thay cho bé.',
    ],
  },
  {
    title: 'Dữ liệu chúng tôi thu thập',
    body: [
      [
        'Tài khoản phụ huynh: email, tên đăng nhập, họ tên, số điện thoại (không bắt buộc). Mật khẩu và mã PIN chỉ lưu dạng băm (bcrypt), không ai đọc được.',
        'Hồ sơ bé: tên gọi, ngày sinh (để gợi ý nội dung theo độ tuổi), giọng đọc ưa thích.',
        'Nhân vật gia đình: tên gọi và mô tả bằng chữ (ngoại hình, tính cách). Chúng tôi không yêu cầu và không lưu ảnh, giọng nói hay dữ liệu khuôn mặt của bé.',
        'Nội dung truyện: tình huống ba mẹ kể, các trang truyện, câu hỏi và các chỉnh sửa.',
        'Hoạt động đọc của bé: lượt đọc, trang đang đọc, câu trả lời ở các điểm dừng — dùng để tính Báo cáo EQ.',
        'Giao dịch: gói đã mua, đơn hàng, trạng thái thanh toán do đối tác thanh toán gửi về (kể cả thông tin tài khoản người chuyển khoản, chỉ dùng khi cần hoàn tiền).',
        'Người bán: biệt danh công khai, giới thiệu, tài khoản ngân hàng nhận tiền — số tài khoản được mã hoá (AES-256-GCM) khi lưu và chỉ hiện dạng che.',
        'Báo cáo vi phạm, đánh giá truyện, và nhật ký thao tác của kiểm duyệt viên / quản trị viên.',
      ],
    ],
  },
  {
    title: 'Chúng tôi dùng dữ liệu để làm gì',
    body: [
      [
        'Tạo và hiển thị truyện cho gia đình, đọc giọng kể truyện, chạy Chế độ Trẻ Em.',
        'Tính Báo cáo EQ (chỉ từ câu trả lời ở lượt đọc đầu tiên của mỗi truyện) và gợi ý hoạt động cho ba mẹ.',
        'Cấp credit theo gói, xử lý thanh toán, hoàn tiền và chi trả doanh thu cho người bán.',
        'Kiểm duyệt nội dung, xử lý báo cáo vi phạm và giữ an toàn cho trẻ.',
      ],
      'Chúng tôi không bán dữ liệu, không hiển thị quảng cáo và không dùng dữ liệu của bé để quảng cáo.',
    ],
  },
  {
    title: 'AI và tên thật của bé',
    body: [
      'Khi ba mẹ nhờ AI viết truyện, tên của bé và người thân được thay bằng mã (ví dụ {NV1}) trước khi gửi đi; mô tả nhân vật cũng được lọc tên. Hệ thống kiểm tra lại và từ chối gửi nếu còn sót tên thật.',
      'Tên thật chỉ được ghép lại trên máy chủ của chúng tôi: khi hiển thị cho gia đình và khi đọc giọng kể truyện. Giọng đọc được tạo trên máy chủ của hệ thống, không gửi cho dịch vụ giọng đọc bên ngoài.',
      'Chữ do AI viết đi qua bộ lọc từ khoá do kiểm duyệt viên quản lý, và chỉ đến với bé sau khi ba mẹ xem lại và bấm hoàn tất.',
    ],
  },
  {
    title: 'Khi ba mẹ đăng bán truyện',
    body: [
      'Bản đăng bán là một bản sao riêng: tên thật của gia đình được thay bằng tên chung do ba mẹ đặt, tình huống thật ba mẹ kể không đi theo bản bán, và hệ thống kiểm tra tên còn sót trước khi gửi duyệt. Nếu truyện có giọng đọc, giọng đọc được tạo lại bằng tên chung.',
      'Người mua chỉ thấy biệt danh người bán, không thấy tên thật hay email của ba mẹ.',
    ],
  },
  {
    title: 'Dịch vụ bên thứ ba',
    body: [
      [
        'Anthropic (Claude): viết chữ truyện — chỉ nhận nội dung đã thay tên bằng mã.',
        'Cloudinary: lưu file giọng đọc ở chế độ có xác thực; đường dẫn được ký, không công khai.',
        'Đối tác thanh toán (payOS): xử lý thanh toán bằng chuyển khoản / VietQR.',
        'Brevo: gửi email xác thực tài khoản và mã khôi phục mật khẩu.',
      ],
      'Các dịch vụ này chỉ nhận phần dữ liệu cần cho việc của họ.',
    ],
  },
  {
    title: 'Lưu trữ và bảo mật',
    body: [
      'Dữ liệu được truyền qua kết nối mã hoá. Mật khẩu, mã PIN lưu dạng băm; số tài khoản ngân hàng lưu dạng mã hoá. Sổ cái credit và doanh thu chỉ ghi thêm, không sửa xoá, để đối soát được.',
      'Truyện, nhân vật, hồ sơ bé bị xoá sẽ không còn hiển thị; một số bản ghi giao dịch được giữ lại theo yêu cầu kế toán và đối soát.',
    ],
  },
  {
    title: 'Quyền của ba mẹ',
    body: [
      [
        'Xem, sửa hoặc xoá hồ sơ bé, nhân vật gia đình và truyện bất cứ lúc nào trong ứng dụng.',
        'Bật / tắt giọng đọc cho từng truyện; quyết định truyện nào được đưa lên giá sách của bé.',
        'Yêu cầu xoá tài khoản hoặc xuất dữ liệu bằng cách liên hệ nhóm phát triển.',
      ],
    ],
  },
  {
    title: 'Thay đổi chính sách',
    body: ['Khi chính sách thay đổi, chúng tôi cập nhật phiên bản và ngày hiệu lực ở đầu trang, và thông báo trong ứng dụng nếu thay đổi ảnh hưởng đến cách dùng dữ liệu của bé.'],
  },
];

const TERMS_SECTIONS: LegalSection[] = [
  {
    title: 'Tài khoản',
    body: [
      'Người tạo tài khoản phải là người lớn và chịu trách nhiệm cho việc trẻ sử dụng Chế độ Trẻ Em. Ba mẹ giữ bí mật mật khẩu và mã PIN thoát Chế độ Trẻ Em.',
      'Tài khoản vi phạm điều khoản có thể bị tạm khoá. Quyền dùng AI có thể bị tạm khoá riêng nếu nhiều lần yêu cầu nội dung bị chặn; khi đó ba mẹ vẫn đọc và tự viết truyện được.',
    ],
  },
  {
    title: 'Gói dịch vụ và credit',
    body: [
      [
        'Credit dùng cho các lần AI viết truyện; số credit cho mỗi lần do hệ thống công bố trước khi bắt đầu. Lần viết lỗi được hoàn credit.',
        'Mỗi gói cấp credit theo từng tháng. Credit chưa dùng hết hạn khi sang tháng mới, không quy đổi thành tiền và không mua lẻ.',
        'Gói trả trước, gia hạn thủ công; đổi gói giữa kỳ thì kỳ mới bắt đầu ngay và credit còn lại được giữ một lần.',
        'Thanh toán bằng chuyển khoản ngân hàng hoặc quét mã VietQR. Truyện tự viết không tốn credit.',
      ],
    ],
  },
  {
    title: 'Nội dung do AI hỗ trợ',
    body: [
      'AI có thể viết chưa đúng ý hoặc chưa phù hợp với từng bé. Ba mẹ có trách nhiệm đọc lại và chỉnh sửa trước khi bấm hoàn tất; chỉ truyện đã hoàn tất mới lên giá sách của bé.',
      'Không yêu cầu AI viết nội dung bạo lực, đáng sợ, phân biệt đối xử hoặc chứa thông tin cá nhân của người khác. Hệ thống tự chặn các từ khoá không phù hợp.',
    ],
  },
  {
    title: 'Quyền đối với truyện',
    body: [
      'Truyện ba mẹ viết (kể cả có AI hỗ trợ) thuộc về ba mẹ. Ba mẹ cho phép StoryWeaver lưu trữ, hiển thị và đọc giọng truyện để cung cấp dịch vụ cho gia đình.',
      'Khi đăng bán, ba mẹ cho phép StoryWeaver hiển thị bản đăng bán trên Chợ truyện và cung cấp cho người mua đọc trong gia đình họ.',
    ],
  },
  {
    title: 'Đăng bán trên Chợ truyện',
    body: [
      [
        'Cần gói có quyền bán (gói Gia đình) và hồ sơ người bán được kiểm duyệt viên duyệt.',
        'Bản đăng bán dùng tên chung thay cho tên thật của gia đình. Kiểm duyệt viên đọc 100% số trang theo checklist sư phạm trước khi truyện lên Chợ; truyện có giọng đọc chỉ được duyệt khi giọng đọc đã tạo xong.',
        `Người bán nhận ${N.sellerSharePercent}% giá niêm yết của mỗi lượt bán. Doanh thu được giữ ${N.earningHoldDays} ngày (để xử lý hoàn tiền) rồi mới rút được; mức rút tối thiểu ${vnd(N.minWithdrawalVnd)}. Quản trị viên chuyển khoản số tiền rút về tài khoản ngân hàng người bán đã khai.`,
        'Giá chọn theo các bậc giá do nền tảng quy định.',
      ],
    ],
  },
  {
    title: 'Mua truyện và hoàn tiền',
    body: [
      'Mua truyện là mua quyền đọc trong gia đình: truyện được đưa lên giá sách của các bé trong tài khoản. Không sao chép, phát tán lại nội dung truyện.',
      `Ba mẹ có thể yêu cầu hoàn tiền trong ${N.refundWindowDays} ngày kể từ lúc thanh toán, ở mục Lịch sử thanh toán. Khi được duyệt, tiền được chuyển trả vào tài khoản đã thanh toán và quyền đọc truyện (hoặc gói) bị thu hồi.`,
      'Truyện bị tạm gỡ để kiểm tra lại sẽ tạm không đọc được cho đến khi có quyết định.',
    ],
  },
  {
    title: 'Đánh giá và báo cáo',
    body: [
      'Chỉ ba mẹ đã mua truyện và có bé đã đọc hết truyện mới đánh giá được. Đánh giá vi phạm quy định cộng đồng có thể bị ẩn.',
      `Ba mẹ có thể báo cáo truyện hoặc đánh giá không phù hợp. Khi đủ ${N.reportThreshold} phụ huynh khác nhau báo cáo một truyện trong 24 giờ, truyện tự tạm gỡ để kiểm duyệt viên xem lại.`,
    ],
  },
  {
    title: 'Cảnh cáo người bán và kháng nghị',
    body: [
      `Vi phạm (truyện bị gỡ hẳn, vi phạm nghiêm trọng khi duyệt, báo cáo đúng) có thể bị cảnh cáo. Mỗi cảnh cáo có hiệu lực ${N.strikeValidDays} ngày; đủ ${N.strikeLimit} cảnh cáo còn hiệu lực thì tài khoản bán bị khoá và truyện tạm ẩn khỏi Chợ. Doanh thu đã có vẫn rút được.`,
      'Người bán được kháng nghị mỗi cảnh cáo một lần; quản trị viên (không phải người ra cảnh cáo) xem xét. Kháng nghị được chấp thuận thì cảnh cáo được gỡ.',
    ],
  },
  {
    title: 'Giới hạn trách nhiệm',
    body: [
      'StoryWeaver là sản phẩm của đồ án SEP490 đang ở giai đoạn thử nghiệm. Dịch vụ được cung cấp theo hiện trạng; chúng tôi cố gắng giữ dịch vụ ổn định nhưng có thể gián đoạn khi bảo trì hoặc khi dịch vụ bên thứ ba gặp sự cố.',
      'Báo cáo EQ là công cụ tham khảo giúp ba mẹ đồng hành cùng con, không thay thế đánh giá của chuyên gia tâm lý hay giáo dục.',
    ],
  },
  {
    title: 'Thay đổi điều khoản',
    body: ['Khi điều khoản thay đổi, chúng tôi cập nhật phiên bản và ngày hiệu lực ở đầu trang. Tiếp tục sử dụng dịch vụ sau ngày hiệu lực nghĩa là ba mẹ đồng ý với điều khoản mới.'],
  },
];

export const LEGAL_DOCS: Record<LegalDocKey, LegalDocument> = {
  privacy: {
    title: 'Chính sách bảo mật',
    intro:
      'StoryWeaver AI làm truyện cho trẻ nhỏ, nên chúng tôi thu thập ít nhất có thể và giữ tên thật của gia đình ở lại trong hệ thống. Trang này nói rõ chúng tôi lưu gì, dùng vào việc gì và chia sẻ với ai.',
    sections: PRIVACY_SECTIONS,
  },
  terms: {
    title: 'Điều khoản dịch vụ',
    intro: 'Các điều khoản dưới đây áp dụng khi ba mẹ dùng StoryWeaver AI để tạo truyện cho con, mua hoặc đăng bán truyện trên Chợ truyện.',
    sections: TERMS_SECTIONS,
  },
};

/** Nhãn liên kết ở chân trang Đăng nhập / Đăng ký (Web AuthShell FOOTER_LINKS) */
export const AUTH_FOOTER_LINKS: { doc: LegalDocKey; label: string }[] = [
  { doc: 'privacy', label: 'Chính sách bảo mật' },
  { doc: 'terms', label: 'Điều khoản sử dụng' },
];
