// apps/mobile/src/components/admin/SettingsGroup.tsx
// GĐ F/D2 – một nhóm cài đặt nền tảng (Web components/admin/SettingsGroup.jsx): CHỈ khoá của nhóm truyền vào (`ai` | `market`).
// Sửa từng giá trị, kiểm tra như BE settingError (kể cả ràng buộc chéo nhóm market), lưu LUÔN qua Dialog xác nhận, chống bấm đúp.
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../ui/HeyCard';
import { HeyButton } from '../ui/HeyButton';
import { HeyInput } from '../ui/HeyInput';
import { useDialog } from '../ui/Dialog';
import { ResourceBody, useMutationRunner } from '../management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { adminService } from '../../services/adminService';
import { formatDateTime } from '../../utils/format';
import { settingConfirm, settingFromInput, settingInputError, settingToInput, settingsOfGroup } from '../../utils/adminConfig';
import type { PlatformSetting, SettingsResult } from '../../types/management';
import type { ResourceStatus } from '../../utils/useAsyncResource';

const SettingRow: React.FC<{ setting: PlatformSetting; all: PlatformSetting[]; busy: boolean; onSave: (s: PlatformSetting, raw: string) => void }> = ({ setting, all, busy, onSave }) => {
  const [raw, setRaw] = useState(settingToInput(setting));
  const [error, setError] = useState<string | null>(null);
  const dirty = raw.trim() !== settingToInput(setting);
  const save = () => {
    const e = settingInputError(setting, raw, all);
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

/** `res` = kết quả GET /admin/settings do màn cha tải (một lần cho mọi nhóm trên màn) */
export const SettingsGroup: React.FC<{
  group: 'ai' | 'market';
  res: { status: ResourceStatus; data: SettingsResult | null; error: string | null; reload: () => unknown };
  emptyTitle: string;
}> = ({ group, res, emptyTitle }) => {
  const dialog = useDialog();
  const { run, busy } = useMutationRunner(res.reload);
  const all = res.data?.settings ?? [];
  const rows = settingsOfGroup(all, group);

  const save = async (s: PlatformSetting, raw: string) => {
    if (busy) return;
    if (!(await dialog.confirm(settingConfirm(s, raw)))) return;
    if (await run(`setting:${s.key}`, () => adminService.updateSetting(s.key, settingFromInput(s, raw)), `Đã lưu: ${s.label}`)) void res.reload();
  };

  return (
    <ResourceBody status={res.status} error={res.error} empty={!rows.length} emptyTitle={emptyTitle} onRetry={res.reload}>
      <HeyCard style={styles.card}>
        {rows.map((s) => (
          <SettingRow key={`${s.key}:${s.value}`} setting={s} all={all} busy={busy} onSave={(x, raw) => void save(x, raw)} />
        ))}
      </HeyCard>
    </ResourceBody>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  card: { gap: Spacing.md },
  row: { gap: Spacing.xs },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  label: { ...Typography.label, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
});
