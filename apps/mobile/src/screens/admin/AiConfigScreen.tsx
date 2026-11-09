// apps/mobile/src/screens/admin/AiConfigScreen.tsx
// GĐ F – Cấu hình AI (Web AiConfigPage + SettingsGroup group="ai"): CHỈ các khoá nhóm `ai` (giá credit cho mỗi lần AI viết / vẽ,
// tỉ giá báo cáo). Sửa từng giá trị, kiểm tra như BE settingError, LUÔN qua Dialog xác nhận. Khoá ngoài nhóm ai không hiện,
// không sửa. Nhà cung cấp / khoá API nằm trong biến môi trường của dịch vụ ai/, không hiện ở đây.
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyInput } from '../../components/ui/HeyInput';
import { useDialog } from '../../components/ui/Dialog';
import { ManagementPage, ResourceBody, SectionTitle, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { adminService } from '../../services/adminService';
import { formatDateTime } from '../../utils/format';
import { aiSettings, settingConfirm, settingFromInput, settingInputError, settingToInput } from '../../utils/adminConfig';
import type { PlatformSetting } from '../../types/management';

const SettingRow: React.FC<{ setting: PlatformSetting; busy: boolean; onSave: (s: PlatformSetting, raw: string) => void }> = ({ setting, busy, onSave }) => {
  const [raw, setRaw] = useState(settingToInput(setting));
  const [error, setError] = useState<string | null>(null);
  const dirty = raw.trim() !== settingToInput(setting);
  const save = () => {
    const e = settingInputError(setting, raw);
    setError(e);
    if (!e) onSave(setting, raw);
  };
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{setting.label}</Text>
      <Text style={styles.muted}>
        {setting.hint ? `${setting.hint} ` : ''}
        {setting.isDefault ? 'Đang dùng giá trị mặc định.' : `Sửa lần cuối ${formatDateTime(setting.updatedAt)} bởi ${setting.updatedBy ?? '—'}.`}
      </Text>
      <View style={styles.inputRow}>
        <View style={styles.flex1}>
          <HeyInput
            value={raw}
            onChangeText={(t) => {
              setRaw(t);
              setError(null);
            }}
            keyboardType="numeric"
            error={error ?? undefined}
            hint={setting.unit}
          />
        </View>
        <HeyButton title="Lưu" iconName="save-outline" size="sm" onPress={save} disabled={!dirty || busy} accessibilityLabel={`Lưu ${setting.label}`} />
      </View>
    </View>
  );
};

export const AiConfigScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const dialog = useDialog();
  const res = useManagementResource(() => adminService.getSettings(), []);
  const { run, busy } = useMutationRunner(res.reload);
  const rows = res.data ? aiSettings(res.data.settings) : [];

  const save = async (s: PlatformSetting, raw: string) => {
    if (busy) return;
    if (!(await dialog.confirm(settingConfirm(s, raw)))) return;
    if (await run(`setting:${s.key}`, () => adminService.updateSetting(s.key, settingFromInput(s, raw)), `Đã lưu: ${s.label}`)) void res.reload();
  };

  return (
    <ManagementPage title="Cấu hình AI" subtitle="Credit là đơn vị phụ huynh dùng; mỗi gói cấp credit hằng tháng." onBack={onBack} onRefresh={res.reload}>
      <SectionTitle>Giá & quy đổi</SectionTitle>
      <ResourceBody status={res.status} error={res.error} empty={!rows.length} emptyTitle="Chưa có cấu hình AI." onRetry={res.reload}>
        <HeyCard style={styles.card}>
          {rows.map((s) => (
            <SettingRow key={`${s.key}:${s.value}`} setting={s} busy={busy} onSave={(x, raw) => void save(x, raw)} />
          ))}
        </HeyCard>
      </ResourceBody>
      <HeyCard style={styles.card}>
        <Text style={styles.heading}>Nhà cung cấp</Text>
        <Text style={styles.body}>
          Chữ do dịch vụ ai/ sinh (Claude), giọng đọc do VieNeu TTS chạy cục bộ. Chọn nhà cung cấp và khoá API nằm trong biến môi trường của dịch vụ ai/ — không lưu
          trong cơ sở dữ liệu nên không sửa ở đây, tránh lộ khoá qua giao diện web.
        </Text>
        <Text style={styles.body}>Lớp an toàn: từ khoá chặn do Kiểm duyệt viên quản lý áp dụng cho cả chữ AI viết và chữ phụ huynh tự viết.</Text>
      </HeyCard>
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  card: { gap: Spacing.md },
  row: { gap: Spacing.xs },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  heading: { ...Typography.bodyStrong, color: Colors.text },
  label: { ...Typography.label, color: Colors.text },
  body: { ...Typography.label, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
});
