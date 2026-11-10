// apps/mobile/src/screens/specialist/ReportSettingsScreen.tsx
// GĐ E2b – Tham số báo cáo EQ (Web ReportSettingsPage): số câu xét, số câu tối thiểu, hai ngưỡng (BE lưu tỉ lệ 0..1, nhập theo %).
// Kiểm như pedagogy-settings.validation của BE; quy tắc sẽ áp dụng hiện ngay dưới form; lưu đủ 4 trường qua Dialog xác nhận.
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyInput } from '../../components/ui/HeyInput';
import { useDialog } from '../../components/ui/Dialog';
import { ManagementPage, ResourceBody, SectionTitle, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { pedagogyService } from '../../services/pedagogyService';
import { ReportSettingsForm, reportRules, reportSettingsBody, reportSettingsConfirm, reportSettingsError, reportSettingsForm } from '../../utils/pedagogy';

export const ReportSettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const dialog = useDialog();
  const res = useManagementResource(() => pedagogyService.getReportSettings(), []);
  const { run, busy } = useMutationRunner(res.reload);
  const [form, setForm] = useState<ReportSettingsForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (res.data) setForm(reportSettingsForm(res.data));
  }, [res.data]);
  const saved = res.data ? reportSettingsForm(res.data) : null;
  const dirty = !!form && !!saved && JSON.stringify(form) !== JSON.stringify(saved);
  const set = (patch: Partial<ReportSettingsForm>) => {
    setForm((f) => (f ? { ...f, ...patch } : f));
    setError(null);
  };

  const save = async () => {
    if (!form || busy) return;
    const e = reportSettingsError(form);
    setError(e);
    if (e) return;
    if (!(await dialog.confirm(reportSettingsConfirm(form)))) return;
    if (await run('save', () => pedagogyService.updateReportSettings(reportSettingsBody(form)), 'Đã lưu tham số báo cáo EQ')) void res.reload();
  };

  const valid = !!form && !reportSettingsError(form);
  return (
    <ManagementPage title="Tham số báo cáo" subtitle="Cách xếp mức (Đang làm quen / Đang phát triển / Vững) cho từng kỹ năng con trong báo cáo EQ của bé." onBack={onBack} onRefresh={res.reload}>
      <ResourceBody status={res.status} error={res.error} empty={!form} emptyTitle="Chưa có tham số" onRetry={res.reload}>
        {form && (
          <>
            <SectionTitle>Dữ liệu được xét</SectionTitle>
            <HeyCard style={styles.card}>
              <HeyInput label="Số câu gần nhất được xét (câu)" value={form.window} onChangeText={(window) => set({ window })} keyboardType="numeric" hint="Từ 1 đến 20 câu." />
              <HeyInput label="Số câu tối thiểu để xếp mức (câu)" value={form.minItems} onChangeText={(minItems) => set({ minItems })} keyboardType="numeric" hint="Ít hơn thì phụ huynh thấy “Chưa có dữ liệu”." />
            </HeyCard>
            <SectionTitle>Ngưỡng xếp mức</SectionTitle>
            <HeyCard style={styles.card}>
              <HeyInput label="“Đang phát triển” từ (%)" value={form.developingFrom} onChangeText={(developingFrom) => set({ developingFrom })} keyboardType="numeric" hint="Dưới ngưỡng này là “Đang làm quen”." />
              <HeyInput label="“Vững” từ (%)" value={form.secureFrom} onChangeText={(secureFrom) => set({ secureFrom })} keyboardType="numeric" hint="Phải lớn hơn ngưỡng “Đang phát triển”." />
            </HeyCard>
            <HeyCard variant="muted" style={styles.card}>
              <Text style={styles.strong}>Quy tắc sẽ áp dụng</Text>
              {valid ? reportRules(form).map((r) => <Text key={r} style={styles.body}>• {r}</Text>) : <Text style={styles.muted}>Sửa các ô cho hợp lệ để xem quy tắc.</Text>}
            </HeyCard>
            {!!error && (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            )}
            <View style={styles.actions}>
              {dirty && <HeyButton title="Hoàn tác" variant="tertiary" size="sm" onPress={() => { setForm(saved); setError(null); }} disabled={busy} />}
              <HeyButton title="Lưu tham số" iconName="save-outline" onPress={() => void save()} loading={busy} disabled={!dirty || busy} />
            </View>
          </>
        )}
      </ResourceBody>
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.xs },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.sm },
  strong: { ...Typography.bodyStrong, color: Colors.text },
  body: { ...Typography.label, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  error: { ...Typography.caption, color: Colors.danger },
});
