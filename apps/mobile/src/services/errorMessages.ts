// apps/mobile/src/services/errorMessages.ts
// Bộ dịch lỗi BE → tiếng Việt, chép nguyên từ Web/src/services/errorMessages/* (Web c1311e5, PR #13).
// Giữ nguyên câu chữ và thứ tự nhóm của Web; Web thêm message mới thì chép thêm vào đây.
// Message lạ hoặc BE đã trả tiếng Việt → giữ nguyên.

type Translation = string | ((match: RegExpMatchArray) => string);
type Group = { messages: Record<string, string>; patterns?: [RegExp, Translation][] };

// Lỗi chung của BE: message mặc định của ApiError, route không tồn tại, lỗi validate tổng, lỗi đọc body của express.
const system: Group = {
  messages: {
    'Route not found': 'Không tìm thấy chức năng này, thử tải lại trang nhé',
    'Resource not found': 'Không tìm thấy dữ liệu, có thể đã bị xoá',
    'Validation failed': 'Thông tin gửi lên chưa hợp lệ, kiểm tra lại giúp mình nhé',
    'Internal server error': 'Máy chủ đang gặp sự cố, thử lại sau ít phút nhé',
    'request entity too large': 'Dữ liệu gửi lên quá lớn, thử rút gọn lại nhé',
  },
};

// Lỗi Prisma / Postgres đã được BE đổi sang 4xx (src/utils/prismaError.js của BE).
const database: Group = {
  messages: {
    'Resource already exists': 'Dữ liệu này đã tồn tại',
    'Related resource does not exist or is still referenced': 'Dữ liệu liên quan không còn tồn tại hoặc vẫn đang được dùng ở nơi khác',
    'A provided value is too long for its column': 'Có thông tin nhập vào dài quá, rút gọn lại giúp mình nhé',
    'Write conflict, please retry': 'Hệ thống đang bận xử lý dữ liệu này, thử lại sau giây lát nhé',
    'Operation not allowed by a database rule': 'Thao tác này không được phép',
    'A required field is missing': 'Còn thiếu thông tin bắt buộc',
    'Data violates a database constraint': 'Dữ liệu chưa hợp lệ',
  },
  patterns: [
    // P2002 kèm tên cột: "Resource already exists: email"
    [/^Resource already exists: .+$/, 'Dữ liệu này đã tồn tại'],
    // Vi phạm CHECK kèm tên constraint: "Data violates constraint wallets_balance_check"
    [/^Data violates constraint \S+$/, 'Dữ liệu chưa hợp lệ'],
  ],
};

// Lỗi phiên đăng nhập / token (auth.middleware.js, token.service.js của BE).
const SIGN_IN_AGAIN = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
const session: Group = {
  messages: {
    'Access token is missing': 'Bạn cần đăng nhập để tiếp tục',
    'Invalid or expired access token': SIGN_IN_AGAIN,
    'Invalid or already used refresh token': SIGN_IN_AGAIN,
    'Refresh token has expired': SIGN_IN_AGAIN,
    'Refresh token is required': SIGN_IN_AGAIN,
    'User not found or deactivated': 'Tài khoản không tồn tại hoặc đã bị khoá',
    'User not found': 'Không tìm thấy tài khoản',
    'Parent account not found': 'Không tìm thấy tài khoản phụ huynh',
  },
};

// Lỗi phân quyền (role.middleware.js và message mặc định của ApiError.unauthorized / forbidden ở BE).
const access: Group = {
  messages: {
    Unauthorized: 'Bạn cần đăng nhập để tiếp tục',
    'Authentication required': 'Bạn cần đăng nhập để tiếp tục',
    Forbidden: 'Bạn không có quyền thực hiện thao tác này',
    'You do not have permission to access this resource': 'Tài khoản của bạn không có quyền vào mục này',
  },
};

// Message mặc định của zod v4 (mẫu câu từ zod/v4/locales/en.js).
const LIMIT_WORDS: Record<string, string> = { '<=': 'tối đa', '<': 'ít hơn', '>=': 'ít nhất', '>': 'nhiều hơn' };
const sizeMessage = ([, origin, op, amount]: RegExpMatchArray): string => {
  const n = Number(amount);
  if (origin === 'string') {
    if (op === '>=' && n === 1) return 'Không được để trống';
    return op.startsWith('>') ? `Cần ${LIMIT_WORDS[op]} ${n} ký tự` : `Nội dung dài quá, ${LIMIT_WORDS[op]} ${n} ký tự`;
  }
  if (origin === 'array' || origin === 'set') return `Chọn ${LIMIT_WORDS[op]} ${n} mục`;
  return `Dung lượng ${LIMIT_WORDS[op]} ${n}`;
};
const NUMBER_LIMIT: Record<string, string> = { '<=': 'Giá trị tối đa là', '<': 'Giá trị phải nhỏ hơn', '>=': 'Giá trị tối thiểu là', '>': 'Giá trị phải lớn hơn' };
const numberMessage = ([, , op, amount]: RegExpMatchArray): string => `${NUMBER_LIMIT[op]} ${amount}`;

const zod: Group = {
  messages: {
    'Invalid input': 'Thông tin chưa hợp lệ',
    'Invalid UUID': 'Mã định danh không hợp lệ',
    'Invalid email address': 'Email chưa đúng định dạng',
    'Invalid URL': 'Đường dẫn chưa đúng định dạng',
    'Invalid ISO date': 'Ngày chưa đúng định dạng',
    'Invalid ISO datetime': 'Thời gian chưa đúng định dạng',
  },
  patterns: [
    // Thiếu field: zod v4 bỏ qua required_error nên trả "expected string, received undefined"
    [/^Invalid input: expected \w+, received (undefined|null)$/, 'Còn thiếu thông tin bắt buộc'],
    [/^Invalid input: expected \w+, received \w+$/, 'Thông tin nhập vào chưa đúng định dạng'],
    [/^Invalid (input: expected .+|option: expected one of .+)$/, 'Lựa chọn chưa hợp lệ'],
    [/^Too (?:big|small): expected (\w+) to have (<=|<|>=|>)(\d+) \w+$/, sizeMessage],
    [/^Too (?:big|small): expected (\w+) to be (<=|<|>=|>)(-?[\d.]+)$/, numberMessage],
    [/^Invalid string: .+$/, 'Thông tin chưa đúng định dạng'],
    [/^Invalid number: .+$/, 'Giá trị chưa hợp lệ'],
    [/^Unrecognized keys?: .+$/, 'Có thông tin không được hỗ trợ'],
  ],
};

// Lỗi đăng nhập / đăng ký (auth.service.js, auth.validation.js của BE).
const auth: Group = {
  messages: {
    'Invalid email/username or password': 'Email/Tên đăng nhập hoặc mật khẩu chưa đúng',
    'Your account has been deactivated. Please contact support.': 'Tài khoản đã bị khóa, ba mẹ liên hệ hỗ trợ nhé',
    'Email is already registered': 'Email này đã được đăng ký, ba mẹ đăng nhập nhé',
    'Username is already taken': 'Tên đăng nhập đã có người dùng',
    'Username is required': 'Ba mẹ nhập tên đăng nhập nhé',
    'Username must be at least 3 characters': 'Tên đăng nhập có ít nhất 3 ký tự',
    'Username cannot exceed 50 characters': 'Tên đăng nhập tối đa 50 ký tự',
    'Username can only contain letters, numbers, and underscores': 'Tên đăng nhập chỉ gồm chữ không dấu, số và dấu _',
    'Email is required': 'Ba mẹ nhập email nhé',
    'Email cannot exceed 255 characters': 'Email tối đa 255 ký tự',
    'Email or username is required': 'Ba mẹ nhập email hoặc tên đăng nhập nhé',
    'Password is required': 'Ba mẹ nhập mật khẩu nhé',
    'Password must be at least 8 characters': 'Mật khẩu có ít nhất 8 ký tự',
    'New password must be at least 8 characters': 'Mật khẩu mới có ít nhất 8 ký tự',
    'Account password is incorrect': 'Mật khẩu tài khoản chưa đúng',
    'Full name cannot exceed 150 characters': 'Họ tên tối đa 150 ký tự',
    'Phone number cannot exceed 20 characters': 'Số điện thoại tối đa 20 ký tự',
    // Xác thực email: BE đã trả tiếng Việt, chỉ chỉnh giọng cho ba mẹ
    'Email đã được xác thực': 'Email này đã được xác thực rồi',
    'Mã xác thực không hợp lệ hoặc đã được sử dụng': 'Mã xác thực không đúng hoặc đã được dùng',
    'Mã xác thực đã hết hạn. Vui lòng yêu cầu gửi lại mã.': 'Mã xác thực đã hết hạn, ba mẹ bấm gửi lại mã nhé',
  },
};

// Lỗi mã PIN, vào/thoát Kid Mode và phiên của bé (auth.service.js, auth.validation.js, token.service.js của BE).
const PIN_FORMAT = 'Mã PIN gồm 4 đến 6 chữ số';
const KID_SESSION_ENDED = 'Phiên của bé đã kết thúc, nhờ ba mẹ mở lại Kid Mode nhé';
const kid: Group = {
  messages: {
    'Kid Exit PIN is already set. Use change-pin endpoint to change it.': 'Tài khoản đã có mã PIN, ba mẹ dùng chức năng đổi PIN nhé',
    'Kid Exit PIN has not been set yet. Please set it first.': 'Tài khoản chưa có mã PIN, ba mẹ đặt PIN trước nhé',
    'Current PIN is incorrect': 'Mã PIN hiện tại chưa đúng',
    'PIN is required': 'Ba mẹ nhập mã PIN nhé',
    'New PIN is required': 'Ba mẹ nhập mã PIN mới nhé',
    'PIN must be between 4 and 6 numeric digits': PIN_FORMAT,
    'PIN must be 4 to 6 numeric digits': PIN_FORMAT,
    'New PIN must be between 4 and 6 numeric digits': PIN_FORMAT,
    'Current PIN must be 4 to 6 digits': PIN_FORMAT,
    'Either current PIN or account password is required to change PIN': 'Ba mẹ nhập mã PIN hiện tại hoặc mật khẩu tài khoản để đổi PIN nhé',
    'You must set a Kid Exit PIN before entering Kid Mode': 'Ba mẹ cần đặt mã PIN thoát Kid Mode trước nhé',
    'Child profile not found or does not belong to this account': 'Không tìm thấy hồ sơ bé trong tài khoản này',
    'No PIN configured for this account': 'Tài khoản chưa có mã PIN, ba mẹ đăng nhập lại để đặt PIN nhé',
    'No active session or user found to exit from Kid Mode': 'Phiên Kid Mode đã kết thúc, ba mẹ đăng nhập lại nhé',
    'Invalid or already closed kid session': KID_SESSION_ENDED,
    'Kid session has expired': KID_SESSION_ENDED,
  },
};

// Lỗi hồ sơ bé (children.service.js, children.validation.js của BE).
const children: Group = {
  messages: {
    'Child profile not found': 'Không tìm thấy hồ sơ bé',
    'Child name is required': 'Ba mẹ nhập tên bé nhé',
    'Child name cannot be empty': 'Ba mẹ nhập tên bé nhé',
    'Child name must not exceed 100 characters': 'Tên bé tối đa 100 ký tự',
    'Birth date must be formatted as YYYY-MM-DD': 'Ngày sinh chưa đúng định dạng',
    'Lookup date must be formatted as YYYY-MM-DD': 'Ngày xem chưa đúng định dạng',
    'Preferred voice must not exceed 50 characters': 'Giọng đọc chưa hợp lệ',
    'Appearance description must not exceed 500 characters': 'Mô tả ngoại hình tối đa 500 ký tự',
    'Portrait image key must not exceed 300 characters': 'Ảnh chân dung chưa hợp lệ',
    'Invalid child ID format': 'Hồ sơ bé không hợp lệ',
  },
  patterns: [
    // "You have reached the maximum limit of 2 child profiles for your current plan. Please upgrade to add more children."
    [/maximum limit of (\d+) child profiles/, ([, max]) => `Gói hiện tại chỉ tạo được tối đa ${max} hồ sơ bé. Ba mẹ nâng cấp gói để thêm bé nhé`],
  ],
};

// Lỗi validate nhân vật (characters.validation.js của BE).
const characters: Group = {
  messages: {
    'Generation prompt must not exceed 1000 characters': 'Mô tả để vẽ chân dung tối đa 1000 ký tự',
  },
};

// Lỗi giá sách của bé (bookshelf.service.js, bookshelf.validation.js của BE).
const PICK_CHILD = 'Ba mẹ chọn bé trước nhé';
const BAD_PAGE = 'Số trang chưa hợp lệ';
const bookshelf: Group = {
  messages: {
    'Child ID is required': PICK_CHILD,
    'Child ID query parameter is required': PICK_CHILD,
    'Child profile not found or access denied': 'Không tìm thấy hồ sơ bé trong tài khoản này',
    'Story ID is required': 'Ba mẹ chọn truyện trước nhé',
    'Invalid story ID format': 'Truyện không hợp lệ',
    'Page must be an integer': BAD_PAGE,
    'Limit must be an integer': BAD_PAGE,
  },
};

// Lỗi gói dịch vụ (plans.service.js của BE).
const billing: Group = {
  messages: {
    'Subscription plan not found': 'Không tìm thấy gói dịch vụ, có thể gói đã ngừng bán',
  },
};

// Lỗi trang quản trị: âm thanh giao diện của Kid Mode (content-library.service.js, content-library.validation.js của BE).
const admin: Group = {
  messages: {
    'UI Audio asset not found': 'Không tìm thấy âm thanh này, có thể đã bị xoá',
    'Invalid audio asset ID format': 'Âm thanh không hợp lệ',
    'Audio asset key is required': 'Nhập mã âm thanh',
    'Audio key cannot be empty': 'Nhập mã âm thanh',
    'Key cannot be empty': 'Nhập mã âm thanh',
    'Audio key must not exceed 300 characters': 'Mã âm thanh tối đa 300 ký tự',
    'Key must not exceed 80 characters': 'Mã âm thanh tối đa 80 ký tự',
    'Audio storage key is required': 'Chưa có tệp âm thanh',
    'Text content is required': 'Nhập nội dung câu đọc',
  },
  patterns: [
    [/^UI Audio asset with key '(.+)' and lang '(.+)' not found$/, ([, key, lang]) => `Không tìm thấy âm thanh "${key}" (${lang})`],
    [/^UI Audio asset with key '(.+)' and language '(.+)' already exists$/, ([, key, lang]) => `Âm thanh "${key}" (${lang}) đã có rồi`],
  ],
};

const GROUPS: Group[] = [system, database, session, access, zod, auth, kid, children, characters, bookshelf, billing, admin];

export const ERROR_MESSAGES: Record<string, string> = Object.assign({}, ...GROUPS.map((g) => g.messages));
export const ERROR_PATTERNS: [RegExp, Translation][] = GROUPS.flatMap((g) => g.patterns ?? []);

// Câu riêng của Mobile, áp TRƯỚC bảng Web: giao diện Mobile gọi "Chế độ Bé", không phải "Kid Mode".
// Bảng Web ở trên giữ nguyên để dễ đồng bộ.
const KID_SESSION_ENDED_MOBILE = 'Phiên của bé đã kết thúc, nhờ ba mẹ mở lại Chế độ Bé nhé';
export const MOBILE_OVERRIDES: Record<string, string> = {
  'Invalid or already closed kid session': KID_SESSION_ENDED_MOBILE,
  'Kid session has expired': KID_SESSION_ENDED_MOBILE,
  'You must set a Kid Exit PIN before entering Kid Mode': 'Ba mẹ cần đặt mã PIN thoát Chế độ Bé trước nhé',
  'No active session or user found to exit from Kid Mode': 'Phiên Chế độ Bé đã kết thúc, ba mẹ đăng nhập lại nhé',
};

/** Đổi message của BE sang tiếng Việt nếu có trong bảng dịch, không thì trả lại nguyên văn. */
export function translateErrorMessage(message: string): string;
export function translateErrorMessage<T>(message: T): T;
export function translateErrorMessage(message: unknown): unknown {
  if (typeof message !== 'string') return message;
  const text = message.trim();
  if (Object.prototype.hasOwnProperty.call(MOBILE_OVERRIDES, text)) return MOBILE_OVERRIDES[text];
  if (Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, text)) return ERROR_MESSAGES[text];
  for (const [pattern, toVi] of ERROR_PATTERNS) {
    const match = text.match(pattern);
    if (match) return typeof toVi === 'function' ? toVi(match) : toVi;
  }
  return message;
}
