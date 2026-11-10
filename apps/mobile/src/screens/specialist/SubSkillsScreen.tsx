// apps/mobile/src/screens/specialist/SubSkillsScreen.tsx
// GĐ E2a – Kỹ năng con (Web SubSkillsPage): danh mục chuẩn CASEL, lọc theo năng lực / trạng thái / tìm. Chỉ điều chỉnh đúng
// các trường BE cho sửa (tên + mô tả tiếng Việt, độ tuổi; bật / tắt) — năng lực, mã, câu gốc tiếng Anh giữ nguyên.
// Lưu và bật / tắt qua Dialog xác nhận, chống bấm đúp, lỗi BE hiện câu đã dịch.
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyInput } from '../../components/ui/HeyInput';
import { Badge } from '../../components/ui/Badge';
import { Sheet } from '../../components/ui/Sheet';
import { useDialog } from '../../components/ui/Dialog';
import { FilterChips, InfoRow, ManagementPage, ResourceBody, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { eqSkillService } from '../../services/eqSkillService';
import { pedagogyService } from '../../services/pedagogyService';
import { STATUS_OPTIONS, SubSkillForm, subSkillForm, subSkillFormError, subSkillUpdateBody, toggleConfirm } from '../../utils/pedagogy';
import type { ManagedSubSkill } from '../../types/pedagogy';

const SEARCH_DELAY_MS = 400;

const SubSkillSheet: React.FC<{ subSkill: ManagedSubSkill | null; busy: boolean; onSave: (s: ManagedSubSkill, f: SubSkillForm) => void; onClose: () => void }> = ({ subSkill, busy, onSave, onClose }) => {
  const [form, setForm] = useState<SubSkillForm>({ nameVi: '', descriptionVi: '', ageMin: '', ageMax: '' });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!subSkill) return;
    setForm(subSkillForm(subSkill));
    setError(null);
  }, [subSkill?.id]);
  const set = (patch: Partial<SubSkillForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    setError(null);
  };
  const save = () => {
    const e = subSkillFormError(form);
    setError(e);
    if (!e && subSkill) onSave(subSkill, form);
  };
  return (
    <Sheet
      visible={!!subSkill}
      title="Điều chỉnh kỹ năng con"
      description="Kỹ năng con là một mục của khung CASEL nên năng lực và câu gốc tiếng Anh giữ nguyên. Bạn chỉnh cách diễn giải tiếng Việt cho phụ huynh và độ tuổi phù hợp."
      onClose={onClose}
      footer={<HeyButton title="Lưu thay đổi" iconName="checkmark" loading={busy} onPress={save} />}
    >
      {!!subSkill && (
        <HeyCard variant="muted" style={styles.card}>
          <InfoRow label="Năng lực CASEL" value={subSkill.skill?.nameVi ?? '—'} />
          {!!subSkill.caselTextEn && <Text style={styles.italic}>{subSkill.caselTextEn}</Text>}
        </HeyCard>
      )}
      <HeyInput label="Tên kỹ năng con (tiếng Việt)" value={form.nameVi} onChangeText={(nameVi) => set({ nameVi })} />
      <HeyInput
        label="Mô tả cho phụ huynh"
        value={form.descriptionVi}
        onChangeText={(descriptionVi) => set({ descriptionVi })}
        multiline
        numberOfLines={3}
        placeholder="Bé học được điều gì ở kỹ năng này, biểu hiện khi bé làm được..."
      />
      <View style={styles.row}>
        <View style={styles.flex1}>
          <HeyInput label="Tuổi từ" value={form.ageMin} onChangeText={(ageMin) => set({ ageMin })} keyboardType="numeric" />
        </View>
        <View style={styles.flex1}>
          <HeyInput label="Đến" value={form.ageMax} onChangeText={(ageMax) => set({ ageMax })} keyboardType="numeric" />
        </View>
      </View>
      {!!error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </Sheet>
  );
};

export const SubSkillsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const dialog = useDialog();
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [skillId, setSkillId] = useState('all');
  const [isActive, setIsActive] = useState('all');
  const [editing, setEditing] = useState<ManagedSubSkill | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchText), SEARCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [searchText]);
  const skills = useManagementResource(() => eqSkillService.getSkills(), []);
  const list = useManagementResource(() => pedagogyService.getSubSkills({ skillId, search, isActive }), [skillId, search, isActive]);
  const { run, busy, busyKey } = useMutationRunner(list.reload);

  const save = async (s: ManagedSubSkill, f: SubSkillForm) => {
    if (busy) return;
    const body = subSkillUpdateBody(s, f);
    if (!Object.keys(body).length) return void dialog.notify('Chưa có gì thay đổi', 'Sửa ít nhất một thông tin rồi lưu.');
    if (!(await dialog.confirm({ title: `Lưu kỹ năng con “${f.nameVi.trim()}”?`, message: `Độ tuổi ${f.ageMin}–${f.ageMax}. Mô tả hiện cho phụ huynh ở trang năng lực EQ.`, confirmLabel: 'Lưu thay đổi' }))) return;
    if (await run(`save:${s.id}`, () => pedagogyService.updateSubSkill(s.id, body), 'Đã cập nhật kỹ năng con')) {
      setEditing(null);
      void list.reload();
    }
  };

  const toggle = async (s: ManagedSubSkill) => {
    if (busy) return;
    if (!(await dialog.confirm(toggleConfirm('kỹ năng con', s.nameVi, !s.isActive)))) return;
    if (await run(`toggle:${s.id}`, () => pedagogyService.updateSubSkill(s.id, { isActive: !s.isActive }), s.isActive ? 'Đã tắt kỹ năng con' : 'Đã bật lại kỹ năng con')) void list.reload();
  };

  const skillOptions = [{ value: 'all', label: 'Mọi năng lực' }, ...(skills.data ?? []).map((s) => ({ value: s.id, label: s.nameVi }))];
  return (
    <ManagementPage title="Kỹ năng con" subtitle="Danh mục chuẩn CASEL: chỉnh diễn giải tiếng Việt, độ tuổi và bật / tắt; không thêm hay xoá." onBack={onBack} onRefresh={list.reload}>
      <HeyInput placeholder="Tìm theo tên kỹ năng con..." value={searchText} onChangeText={setSearchText} />
      <FilterChips label="Năng lực" options={skillOptions} value={skillId} onChange={setSkillId} />
      <FilterChips label="Trạng thái" options={STATUS_OPTIONS} value={isActive} onChange={setIsActive} />
      <ResourceBody status={list.status} error={list.error} empty={!list.data?.length} emptyTitle="Chưa có kỹ năng con phù hợp" onRetry={list.reload}>
        {list.data?.map((s) => (
          <HeyCard key={s.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.title, styles.flex1, !s.isActive && styles.muted]}>{s.nameVi}</Text>
              {!s.isActive && <Badge label="Đã tắt" tone="neutral" />}
            </View>
            {!!s.skill && <Badge label={s.skill.nameVi} tone="info" />}
            {!!s.caselTextEn && <Text style={styles.italic}>{s.caselTextEn}</Text>}
            <Text style={styles.body} numberOfLines={3}>
              {s.descriptionVi}
            </Text>
            <Text style={styles.muted}>
              {s.ageMin}–{s.ageMax} tuổi · {s.publishedTemplatesCount}/{s.templatesCount} mẫu đã ban hành · {s.topicsCount} chuyện mẫu · {s.checkpointsCount} điểm dừng
            </Text>
            <View style={styles.actions}>
              <HeyButton title="Điều chỉnh" iconName="create-outline" variant="tertiary" size="sm" onPress={() => setEditing(s)} disabled={busy} accessibilityLabel={`Điều chỉnh ${s.nameVi}`} />
              <HeyButton
                title={s.isActive ? 'Tắt' : 'Bật lại'}
                iconName={s.isActive ? 'pause-outline' : 'play-outline'}
                variant="tertiary"
                size="sm"
                onPress={() => void toggle(s)}
                loading={busyKey === `toggle:${s.id}`}
                disabled={busy}
                accessibilityLabel={`${s.isActive ? 'Tắt' : 'Bật lại'} ${s.nameVi}`}
              />
            </View>
          </HeyCard>
        ))}
      </ResourceBody>
      <SubSkillSheet subSkill={editing} busy={busyKey === `save:${editing?.id}`} onSave={(s, f) => void save(s, f)} onClose={() => setEditing(null)} />
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  flex1: { flex: 1 },
  title: { ...Typography.bodyStrong, color: Colors.text },
  body: { ...Typography.label, color: Colors.text },
  italic: { ...Typography.caption, color: Colors.textMuted, fontStyle: 'italic' },
  muted: { ...Typography.caption, color: Colors.textMuted },
  error: { ...Typography.caption, color: Colors.danger },
});
