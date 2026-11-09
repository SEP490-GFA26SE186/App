// apps/mobile/tests/errorMessages.test.ts
// Bộ dịch lỗi BE → tiếng Việt (chép từ Web/tests/services/errorMessages.test.js) + quy tắc ẩn lỗi 500 ở apiClient.
// Fetch GIẢ chỉ trong test, không gọi BE. Chạy: xem tests/README.md.
import assert from 'node:assert/strict';

(globalThis as any).__DEV__ = false; // global của React Native, không có trong Node
process.env.EXPO_PUBLIC_API_URL = 'http://test.invalid';

import { ERROR_MESSAGES, ERROR_PATTERNS, translateErrorMessage as t } from '../src/services/errorMessages';
import { apiFetch, kidFetch, extractErrorMessage, ApiError } from '../src/services/apiClient';
import { safeStorage, STORAGE_KEYS } from '../src/services/storage';

const GENERIC = 'Có lỗi xảy ra, ba mẹ thử lại sau nhé';

const respond = (status: number, body: unknown) => {
  (globalThis as any).fetch = async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
};
const rejectsWith = async (p: Promise<unknown>, status: number, message: string) => {
  await assert.rejects(p, (e: unknown) => {
    assert.ok(e instanceof ApiError);
    assert.equal(e.status, status);
    assert.equal(e.message, message);
    return true;
  });
};

const cases: [string, () => void | Promise<void>][] = [
  ['đủ 94 message + 13 regex như Web', () => {
    assert.equal(Object.keys(ERROR_MESSAGES).length, 94);
    assert.equal(ERROR_PATTERNS.length, 13);
  }],
  ['message lạ hoặc đã là tiếng Việt → giữ nguyên', () => {
    assert.equal(t('Ba mẹ không đủ credit để vẽ tranh.'), 'Ba mẹ không đủ credit để vẽ tranh.');
    assert.equal(t('Something brand new'), 'Something brand new');
  }],
  ['lỗi chung của BE', () => {
    assert.equal(t('Route not found'), 'Không tìm thấy chức năng này, thử tải lại trang nhé');
    assert.equal(t('Validation failed'), 'Thông tin gửi lên chưa hợp lệ, kiểm tra lại giúp mình nhé');
    assert.equal(t('  Resource not found '), 'Không tìm thấy dữ liệu, có thể đã bị xoá');
  }],
  ['lỗi database, kể cả khi BE gắn tên cột / constraint', () => {
    assert.equal(t('Write conflict, please retry'), 'Hệ thống đang bận xử lý dữ liệu này, thử lại sau giây lát nhé');
    assert.equal(t('Resource already exists: email'), 'Dữ liệu này đã tồn tại');
    assert.equal(t('Data violates constraint wallets_balance_check'), 'Dữ liệu chưa hợp lệ');
  }],
  ['lỗi phiên đăng nhập', () => {
    assert.equal(t('Refresh token has expired'), 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
    assert.equal(t('User not found or deactivated'), 'Tài khoản không tồn tại hoặc đã bị khoá');
  }],
  ['lỗi phân quyền', () => {
    assert.equal(t('Forbidden'), 'Bạn không có quyền thực hiện thao tác này');
    assert.equal(t('You do not have permission to access this resource'), 'Tài khoản của bạn không có quyền vào mục này');
  }],
  ['message mặc định của zod v4', () => {
    const zod: [string, string][] = [
      ['Invalid input: expected string, received undefined', 'Còn thiếu thông tin bắt buộc'],
      ['Invalid input: expected number, received string', 'Thông tin nhập vào chưa đúng định dạng'],
      ['Invalid option: expected one of "short"|"medium"|"long"', 'Lựa chọn chưa hợp lệ'],
      ['Too big: expected string to have <=500 characters', 'Nội dung dài quá, tối đa 500 ký tự'],
      ['Too small: expected string to have >=1 characters', 'Không được để trống'],
      ['Too small: expected string to have >=20 characters', 'Cần ít nhất 20 ký tự'],
      ['Too big: expected array to have <=2 items', 'Chọn tối đa 2 mục'],
      ['Too small: expected number to be >=1', 'Giá trị tối thiểu là 1'],
      ['Too big: expected number to be <=100', 'Giá trị tối đa là 100'],
      ['Too small: expected number to be >0', 'Giá trị phải lớn hơn 0'],
      ['Invalid UUID', 'Mã định danh không hợp lệ'],
      ['Invalid string: must match pattern /^\\d{4,6}$/', 'Thông tin chưa đúng định dạng'],
      ['Unrecognized keys: foo, bar', 'Có thông tin không được hỗ trợ'],
    ];
    for (const [message, expected] of zod) assert.equal(t(message), expected, message);
  }],
  ['lỗi đăng nhập / đăng ký / mật khẩu', () => {
    assert.equal(t('Invalid email/username or password'), 'Email/Tên đăng nhập hoặc mật khẩu chưa đúng');
    assert.equal(t('Username is already taken'), 'Tên đăng nhập đã có người dùng');
    assert.equal(t('Username must be at least 3 characters'), 'Tên đăng nhập có ít nhất 3 ký tự');
    assert.equal(t('Email or username is required'), 'Ba mẹ nhập email hoặc tên đăng nhập nhé');
    assert.equal(t('Account password is incorrect'), 'Mật khẩu tài khoản chưa đúng');
  }],
  ['lỗi xác thực email: chỉnh giọng câu tiếng Việt của BE', () => {
    assert.equal(t('Mã xác thực đã hết hạn. Vui lòng yêu cầu gửi lại mã.'), 'Mã xác thực đã hết hạn, ba mẹ bấm gửi lại mã nhé');
  }],
  ['lỗi mã PIN, vào / thoát Kid Mode và phiên của bé', () => {
    assert.equal(t('Current PIN is incorrect'), 'Mã PIN hiện tại chưa đúng');
    assert.equal(t('PIN must be between 4 and 6 numeric digits'), 'Mã PIN gồm 4 đến 6 chữ số');
    assert.equal(t('Kid Exit PIN has not been set yet. Please set it first.'), 'Tài khoản chưa có mã PIN, ba mẹ đặt PIN trước nhé');
  }],
  ['MOBILE_OVERRIDES áp trước bảng Web: dùng "Chế độ Bé", không còn "Kid Mode"', () => {
    assert.equal(t('You must set a Kid Exit PIN before entering Kid Mode'), 'Ba mẹ cần đặt mã PIN thoát Chế độ Bé trước nhé');
    assert.equal(t('Kid session has expired'), 'Phiên của bé đã kết thúc, nhờ ba mẹ mở lại Chế độ Bé nhé');
    assert.equal(t('Invalid or already closed kid session'), 'Phiên của bé đã kết thúc, nhờ ba mẹ mở lại Chế độ Bé nhé');
    assert.equal(t('No active session or user found to exit from Kid Mode'), 'Phiên Chế độ Bé đã kết thúc, ba mẹ đăng nhập lại nhé');
    // Không câu dịch nào (sau override) còn chữ "Kid Mode"
    for (const key of Object.keys(ERROR_MESSAGES)) assert.ok(!t(key).includes('Kid Mode'), key);
    // Bảng Web giữ nguyên để đồng bộ
    assert.equal(ERROR_MESSAGES['Kid session has expired'], 'Phiên của bé đã kết thúc, nhờ ba mẹ mở lại Kid Mode nhé');
  }],
  ['lỗi hồ sơ bé, kể cả giới hạn số bé theo gói', () => {
    assert.equal(t('Child profile not found'), 'Không tìm thấy hồ sơ bé');
    assert.equal(
      t('You have reached the maximum limit of 2 child profiles for your current plan. Please upgrade to add more children.'),
      'Gói hiện tại chỉ tạo được tối đa 2 hồ sơ bé. Ba mẹ nâng cấp gói để thêm bé nhé',
    );
    assert.equal(t('Child name is required'), 'Ba mẹ nhập tên bé nhé');
    assert.equal(t('Appearance description must not exceed 500 characters'), 'Mô tả ngoại hình tối đa 500 ký tự');
  }],
  ['lỗi nhân vật, giá sách, gói, âm thanh (admin)', () => {
    assert.equal(t('Generation prompt must not exceed 1000 characters'), 'Mô tả để vẽ chân dung tối đa 1000 ký tự');
    assert.equal(t('Child ID is required'), 'Ba mẹ chọn bé trước nhé');
    assert.equal(t('Child profile not found or access denied'), 'Không tìm thấy hồ sơ bé trong tài khoản này');
    assert.equal(t('Subscription plan not found'), 'Không tìm thấy gói dịch vụ, có thể gói đã ngừng bán');
    assert.equal(t('UI Audio asset not found'), 'Không tìm thấy âm thanh này, có thể đã bị xoá');
    assert.equal(t("UI Audio asset with key 'tap_start' and language 'vi' already exists"), 'Âm thanh "tap_start" (vi) đã có rồi');
  }],
  ['không phải chuỗi → trả lại nguyên giá trị', () => {
    assert.equal(t(undefined), undefined);
    assert.equal(t(null), null);
  }],
  ['extractErrorMessage dịch errors[0].message, rồi message; thiếu dữ liệu → fallback', () => {
    assert.equal(extractErrorMessage({ message: 'Validation failed', errors: [{ message: 'Child name is required' }] }), 'Ba mẹ nhập tên bé nhé');
    assert.equal(extractErrorMessage({ message: 'Forbidden' }), 'Bạn không có quyền thực hiện thao tác này');
    assert.equal(extractErrorMessage(null, 'Lỗi máy chủ (418)'), 'Lỗi máy chủ (418)');
  }],
  ['apiFetch 4xx: dịch message, giữ errors[] (attemptsLeft) nguyên vẹn', async () => {
    respond(403, { success: false, message: 'You have reached the maximum limit of 3 child profiles for your current plan.' });
    await rejectsWith(apiFetch('/children', { method: 'POST', skipAuth: true }), 403, 'Gói hiện tại chỉ tạo được tối đa 3 hồ sơ bé. Ba mẹ nâng cấp gói để thêm bé nhé');
    respond(401, { success: false, message: 'Mã PIN không đúng', errors: [{ path: 'pin', message: 'Còn 2 lần thử', attemptsLeft: 2 }] });
    await assert.rejects(kidFetch('/auth/kid-mode/exit', { method: 'POST' }), (e: any) => e.message === 'Còn 2 lần thử' && e.errors[0].attemptsLeft === 2);
  }],
  ['apiFetch / kidFetch 500: ẩn message kỹ thuật của BE', async () => {
    respond(500, { success: false, message: 'Invalid `prisma.story.findMany()` invocation: column "x" does not exist' });
    await rejectsWith(apiFetch('/stories', { skipAuth: true }), 500, GENERIC);
    await rejectsWith(kidFetch('/kid/shelf'), 500, GENERIC);
  }],
  ['refresh token gặp 500: ẩn message kỹ thuật, KHÔNG xoá phiên', async () => {
    safeStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'OLD_AT');
    safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'RT');
    (globalThis as any).fetch = async (url: string) =>
      url.endsWith('/auth/refresh-tokens')
        ? new Response(JSON.stringify({ success: false, message: 'Invalid `prisma.authToken.findFirst()` invocation' }), { status: 500 })
        : new Response(JSON.stringify({ success: false, message: 'Invalid or expired access token' }), { status: 401 });
    await rejectsWith(apiFetch('/children'), 500, GENERIC);
    assert.equal(safeStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN), 'OLD_AT');
    assert.equal(safeStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN), 'RT');
    safeStorage.clear();
  }],
  ['apiFetch 502/503: giữ câu tiếng Việt BE cố ý trả', async () => {
    respond(503, { success: false, message: 'Hệ thống giọng đọc đang tạm gián đoạn. Vui lòng thử lại sau ít phút.' });
    await rejectsWith(apiFetch('/stories/s1/narration', { skipAuth: true }), 503, 'Hệ thống giọng đọc đang tạm gián đoạn. Vui lòng thử lại sau ít phút.');
    respond(502, { success: false, message: 'Cổng thanh toán đang tạm gián đoạn. Ba mẹ thử lại sau ít phút nhé.' });
    await rejectsWith(apiFetch('/billing/checkout', { skipAuth: true }), 502, 'Cổng thanh toán đang tạm gián đoạn. Ba mẹ thử lại sau ít phút nhé.');
    respond(503, null);
    await rejectsWith(apiFetch('/x', { skipAuth: true }), 503, 'Lỗi máy chủ (503)');
  }],
];

(async () => {
  let failed = 0;
  for (const [name, run] of cases) {
    try {
      await run();
      console.log(`PASS  ${name}`);
    } catch (e) {
      failed += 1;
      console.error(`FAIL  ${name}\n      ${(e as Error).message}`);
    }
  }
  console.log(`\n${cases.length - failed}/${cases.length} PASS`);
  process.exit(failed ? 1 : 0);
})();
