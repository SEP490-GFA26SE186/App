// apps/mobile/src/utils/adminConfig.ts
// GĐ F – logic thuần cho Gói & định giá và Cấu hình AI (không React Native, test được bằng Node).
// Luật khớp BE: modules/admin/admin.routes.js (planFields, createPlan), admin.service.js (gói FREE),
// lib/settingsRegistry.js (settingError). Web: pages/admin/PlansPage.jsx, components/admin/SettingsGroup.jsx.
import type { AdminPlan, CreatePlanBody, PlanFields, PlatformSetting } from '../types/management';
import { money } from './format';

export const FREE_PLAN_CODE = 'FREE'; // BE billing/lib/billing.js

// ---- Gói ----

const INT_LIMITS = {
  priceVnd: { min: 0, max: 100_000_000, label: 'Giá' },
  creditsPerMonth: { min: 0, max: 10_000, label: 'Credit mỗi tháng' },
  maxChildren: { min: 1, max: 20, label: 'Số bé tối đa' },
  maxCharacters: { min: 1, max: 200, label: 'Số nhân vật tối đa' },
} as const;
export type PlanNumberField = keyof typeof INT_LIMITS;
export const PLAN_NUMBER_FIELDS = Object.keys(INT_LIMITS) as PlanNumberField[];
export const PLAN_FIELD_LABELS: Record<PlanNumberField, string> = {
  priceVnd: 'Giá (đ)',
  creditsPerMonth: 'Credit mỗi tháng',
  maxChildren: 'Số bé tối đa',
  maxCharacters: 'Số nhân vật tối đa',
};

/** Form: số giữ dạng chuỗi như ô nhập */
export interface PlanForm {
  code: string;
  name: string;
  durationMonths: 1 | 12;
  priceVnd: string;
  creditsPerMonth: string;
  maxChildren: string;
  maxCharacters: string;
  canSell: boolean;
  isActive: boolean;
}

/** Giá trị mặc định khi thêm gói (Web PlanModal) / giá trị hiện tại khi sửa */
export const planForm = (plan?: AdminPlan): PlanForm =>
  plan
    ? {
        code: plan.code,
        name: plan.name,
        durationMonths: plan.durationMonths === 12 ? 12 : 1,
        priceVnd: String(plan.priceVnd),
        creditsPerMonth: String(plan.creditsPerMonth),
        maxChildren: String(plan.maxChildren),
        maxCharacters: String(plan.maxCharacters),
        canSell: plan.canSell,
        isActive: plan.isActive,
      }
    : { code: '', name: '', durationMonths: 1, priceVnd: '0', creditsPerMonth: '10', maxChildren: '1', maxCharacters: '5', canSell: false, isActive: true };

const toInt = (raw: string): number | null => {
  const t = raw.trim();
  return /^\d+$/.test(t) ? Number(t) : null;
};

/** Lỗi theo trường, khớp zod của BE (+ luật gói FREE ở service). {} = hợp lệ */
export const planFormErrors = (form: PlanForm, plan?: AdminPlan): Partial<Record<keyof PlanForm, string>> => {
  const errors: Partial<Record<keyof PlanForm, string>> = {};
  if (!plan) {
    const code = form.code.trim().toUpperCase();
    if (!/^[A-Z0-9_]{2,40}$/.test(code)) errors.code = 'Mã gói gồm chữ in hoa, số, dấu _ (2–40 ký tự)';
    if (form.durationMonths !== 1 && form.durationMonths !== 12) errors.durationMonths = 'Gói tháng (1) hoặc năm (12)';
  }
  const name = form.name.trim();
  if (name.length < 2 || name.length > 100) errors.name = 'Tên gói 2–100 ký tự';
  for (const k of PLAN_NUMBER_FIELDS) {
    const n = toInt(form[k]);
    const { min, max, label } = INT_LIMITS[k];
    if (n === null || n < min || n > max) errors[k] = `${label}: số nguyên ${min.toLocaleString('vi-VN')}–${max.toLocaleString('vi-VN')}`;
  }
  if (plan?.code === FREE_PLAN_CODE) {
    if (toInt(form.priceVnd) !== 0) errors.priceVnd = 'Gói Miễn phí luôn có giá 0đ.';
    if (!form.isActive) errors.isActive = 'Không tắt được gói Miễn phí.';
  }
  return errors;
};

const fieldsOf = (form: PlanForm): PlanFields => ({
  name: form.name.trim(),
  priceVnd: Number(form.priceVnd.trim()),
  creditsPerMonth: Number(form.creditsPerMonth.trim()),
  maxChildren: Number(form.maxChildren.trim()),
  maxCharacters: Number(form.maxCharacters.trim()),
  canSell: form.canSell,
  isActive: form.isActive,
});

/** Body POST /admin/plans (form đã hợp lệ) */
export const createPlanBody = (form: PlanForm): CreatePlanBody => ({ ...fieldsOf(form), code: form.code.trim().toUpperCase(), durationMonths: form.durationMonths });

/** Body PUT /admin/plans/:id: chỉ trường đổi (BE cần ít nhất 1 trường) */
export const updatePlanBody = (plan: AdminPlan, form: PlanForm): Partial<PlanFields> => {
  const next = fieldsOf(form);
  return Object.fromEntries(Object.entries(next).filter(([k, v]) => plan[k as keyof PlanFields] !== v)) as Partial<PlanFields>;
};

const show = (k: keyof PlanFields, v: unknown): string =>
  k === 'priceVnd' ? money(v as number) : typeof v === 'boolean' ? (v ? 'Có' : 'Không') : String(v);
const FIELD_NAMES: Record<keyof PlanFields, string> = {
  name: 'Tên gói',
  priceVnd: 'Giá',
  creditsPerMonth: 'Credit mỗi tháng',
  maxChildren: 'Số bé tối đa',
  maxCharacters: 'Số nhân vật tối đa',
  canSell: 'Được bán truyện',
  isActive: 'Đang mở bán',
};

/** Nội dung Dialog xác nhận lưu gói: liệt kê thay đổi; đổi giá / credit thì nhắc chỉ áp dụng lần mua sau (Web PlanModal) */
export const planConfirm = (plan: AdminPlan | undefined, body: Partial<PlanFields> | CreatePlanBody) => {
  if (!plan) {
    const b = body as CreatePlanBody;
    return {
      title: `Tạo gói ${b.name}?`,
      message: `${b.code} • ${b.durationMonths === 12 ? 'gói năm' : 'gói tháng'} • ${money(b.priceVnd)} • ${b.creditsPerMonth} credit/tháng • ${b.maxChildren} bé / ${b.maxCharacters} nhân vật${b.isActive ? '' : ' • chưa mở bán'}.`,
      confirmLabel: 'Tạo gói',
    };
  }
  const changes = (Object.keys(body) as (keyof PlanFields)[]).map((k) => `${FIELD_NAMES[k]}: ${show(k, plan[k])} → ${show(k, body[k])}`);
  const affectsBuyers = 'priceVnd' in body || 'creditsPerMonth' in body;
  return {
    title: `Lưu thay đổi gói ${plan.name}?`,
    message: `${changes.join('\n')}${affectsBuyers ? `\n\nGiá / credit mới áp dụng cho lần mua sau; đơn cũ giữ nguyên giá đã trả, kỳ đang chạy nhận credit theo gói mới từ tháng kế tiếp.${plan.activeSubscribers ? ` Gói đang có ${plan.activeSubscribers} người dùng.` : ''}` : ''}`,
    confirmLabel: 'Lưu thay đổi',
  };
};

// ---- Cấu hình (nhóm ai) ----

/** Màn Cấu hình AI chỉ hiện nhóm `ai` (Web SettingsGroup group="ai"); khoá ngoài nhóm không hiện, không sửa */
export const aiSettings = (settings: PlatformSetting[]): PlatformSetting[] => settings.filter((s) => s.group === 'ai');

/** Tỉ lệ lưu 0..1, hiển thị % (Web SettingsGroup toInput / fromInput) */
export const settingToInput = (s: PlatformSetting): string => (s.type === 'rate' ? String(Math.round(s.value * 100)) : String(s.value));
export const settingFromInput = (s: PlatformSetting, raw: string): number => (s.type === 'rate' ? Number(raw) / 100 : Number(raw));

/** Lỗi phía client theo settingError của BE (kiểu số, số nguyên, khoảng). null = hợp lệ */
export const settingInputError = (s: PlatformSetting, raw: string): string | null => {
  const t = raw.trim();
  if (!t || Number.isNaN(Number(t))) return `${s.label}: phải là số.`;
  const v = settingFromInput(s, t);
  if (s.type === 'int' && !Number.isInteger(v)) return `${s.label}: phải là số nguyên.`;
  if (v < s.min || v > s.max) {
    const fmt = (x: number) => (s.type === 'rate' ? `${Math.round(x * 100)}%` : `${x}`);
    return `${s.label}: trong khoảng ${fmt(s.min)}–${fmt(s.max)}.`;
  }
  return null;
};

export const settingConfirm = (s: PlatformSetting, raw: string) => ({
  title: `Lưu “${s.label}”?`,
  message: `${settingToInput(s)} → ${raw.trim()} ${s.unit}. ${s.hint ?? ''}`.trim(),
  confirmLabel: 'Lưu',
});

// ---- Đối soát ----

export const fixCountersConfirm = (count: number) => ({
  title: `Tính lại bộ đếm của ${count} truyện?`,
  message: 'Số lượt mua và lượt nhận miễn phí của các truyện lệch sẽ được tính lại theo quyền đọc thực tế. Không thay đổi số tiền hay ví.',
  confirmLabel: 'Tính lại bộ đếm',
});
