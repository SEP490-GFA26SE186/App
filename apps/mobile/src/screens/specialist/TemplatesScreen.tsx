// apps/mobile/src/screens/specialist/TemplatesScreen.tsx
// GĐ E2a – Mẫu câu hỏi (Web TemplatesPage): lọc theo năng lực CASEL, kỹ năng con, trạng thái; nhãn ban hành / có bản nháp.
// Soạn trong TemplateSheet. "Lưu bản nháp" = (tạo mẫu nếu mới, đổi tên nếu khác) + PUT /:id/draft; "Ban hành" = lưu nháp rồi
// POST /:id/publish. Nhân bản, bật / tắt, xoá (409 khi đã có điểm dừng dùng → hiện câu BE). Mọi thao tác ghi qua Dialog.
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { Badge } from '../../components/ui/Badge';
import { useDialog } from '../../components/ui/Dialog';
import { FilterChips, ManagementPage, ResourceBody, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { TemplateMeta, TemplateSheet } from '../../components/specialist/TemplateSheet';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { pedagogyService } from '../../services/pedagogyService';
import {
  ANSWER_FORMATS,
  STATUS_OPTIONS,
  TemplateForm,
  duplicateConfirm,
  skillsOf,
  templateDeleteConfirm,
  templatePayload,
  templateSaveConfirm,
  templateStatus,
  toggleConfirm,
} from '../../utils/pedagogy';
import type { QuestionTemplate } from '../../types/pedagogy';

export const TemplatesScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const dialog = useDialog();
  const [skillId, setSkillId] = useState('all');
  const [subSkillId, setSubSkillId] = useState('all');
  const [isActive, setIsActive] = useState('all');
  const [editing, setEditing] = useState<QuestionTemplate | 'new' | null>(null);
  const subSkills = useManagementResource(() => pedagogyService.getSubSkills(), []);
  // Chọn kỹ năng con thì lọc theo kỹ năng con (đã nằm trong năng lực); không thì lọc theo năng lực
  const list = useManagementResource(
    () => pedagogyService.getTemplates({ ...(subSkillId !== 'all' ? { subSkillId } : { skillId }), isActive }),
    [skillId, subSkillId, isActive]
  );
  const { run, busy, busyKey } = useMutationRunner(list.reload);
  // Mẫu vừa tạo nhưng lưu nháp lỗi → lần sau không tạo lại (Web createdId)
  const createdId = useRef<string | null>(null);
  const template = editing && editing !== 'new' ? editing : undefined;
  const open = (t: QuestionTemplate | 'new') => {
    createdId.current = null;
    setEditing(t);
  };

  const submit = async (meta: TemplateMeta, form: TemplateForm, publish: boolean) => {
    if (busy) return;
    if (!(await dialog.confirm(templateSaveConfirm(meta.title, !template && !createdId.current, publish)))) return;
    const ok = await run(
      'save',
      async () => {
        let id = template?.id ?? createdId.current;
        if (!id) {
          id = (await pedagogyService.createTemplate({ subSkillId: meta.subSkillId, title: meta.title, answerFormat: meta.answerFormat })).id;
          createdId.current = id;
        } else if (template && meta.title !== template.title) {
          await pedagogyService.updateTemplate(id, { title: meta.title });
        }
        const saved = await pedagogyService.saveDraft(id, templatePayload(form, meta.answerFormat));
        return publish ? pedagogyService.publishTemplate(id) : saved; // 422 khi ban hành: bản nháp đã được lưu, BE nêu trường thiếu
      },
      (t) => (publish ? `Đã ban hành phiên bản ${t.latestPublished?.version ?? ''}`.trim() : 'Đã lưu bản nháp')
    );
    if (createdId.current || ok) void list.reload();
    if (ok) setEditing(null);
  };

  const duplicate = async (t: QuestionTemplate) => {
    if (busy) return;
    if (!(await dialog.confirm(duplicateConfirm(t)))) return;
    const out: { copy?: QuestionTemplate } = {};
    if (await run(`dup:${t.id}`, async () => (out.copy = await pedagogyService.duplicateTemplate(t.id)), 'Đã nhân bản mẫu, hãy chỉnh nội dung bản nháp')) {
      void list.reload();
      if (out.copy) open(out.copy);
    }
  };

  const toggle = async (t: QuestionTemplate) => {
    if (busy) return;
    if (!(await dialog.confirm(toggleConfirm('mẫu', t.title, !t.isActive)))) return;
    if (await run(`toggle:${t.id}`, () => pedagogyService.updateTemplate(t.id, { isActive: !t.isActive }), t.isActive ? 'Đã tắt mẫu' : 'Đã bật lại mẫu')) void list.reload();
  };

  const remove = async (t: QuestionTemplate) => {
    if (busy) return;
    if (!(await dialog.confirm(templateDeleteConfirm(t)))) return;
    if (await run(`delete:${t.id}`, () => pedagogyService.deleteTemplate(t.id), (r) => r.message)) void list.reload();
  };

  const subs = subSkills.data ?? [];
  const skills = skillsOf(subs);
  const skillOptions = [{ value: 'all', label: 'Mọi năng lực' }, ...skills.map((k) => ({ value: k.id, label: k.nameVi }))];
  const subOptions = [
    { value: 'all', label: skillId === 'all' ? 'Mọi kỹ năng con' : 'Mọi kỹ năng con của năng lực này' },
    ...subs.filter((s) => skillId === 'all' || s.skill?.id === skillId).map((s) => ({ value: s.id, label: s.nameVi })),
  ];
  return (
    <ManagementPage
      title="Mẫu câu hỏi"
      subtitle="Mẫu viết theo kỹ năng con, dùng cho mọi truyện AI. Bản đã ban hành không bị sửa; muốn đổi thì soạn bản nháp mới rồi ban hành."
      onBack={onBack}
      onRefresh={() => Promise.all([list.reload(), subSkills.reload()])}
    >
      <HeyButton title="Thêm mẫu câu hỏi" iconName="add" size="sm" onPress={() => open('new')} disabled={busy || !subs.length} style={styles.selfStart} />
      <FilterChips
        label="Năng lực CASEL"
        options={skillOptions}
        value={skillId}
        onChange={(v) => {
          setSkillId(v);
          setSubSkillId('all'); // kỹ năng con cũ có thể không thuộc năng lực mới
        }}
      />
      <FilterChips label="Kỹ năng con" options={subOptions} value={subSkillId} onChange={setSubSkillId} />
      <FilterChips label="Trạng thái" options={STATUS_OPTIONS} value={isActive} onChange={setIsActive} />
      <ResourceBody status={list.status} error={list.error} empty={!list.data?.length} emptyTitle="Chưa có mẫu câu hỏi nào" onRetry={list.reload}>
        {list.data?.map((t) => {
          const st = templateStatus(t);
          return (
            <HeyCard key={t.id} style={styles.card}>
              <Text style={[styles.title, !t.isActive && styles.muted]}>{t.title}</Text>
              <View style={styles.tags}>
                <Badge label={st.published} tone={t.latestPublished ? 'success' : 'neutral'} />
                {st.hasDraft && <Badge label="Có bản nháp" tone="warning" />}
                {!t.isActive && <Badge label="Đã tắt" tone="neutral" />}
              </View>
              <Text style={styles.muted}>
                {ANSWER_FORMATS[t.answerFormat]} · Kỹ năng con: {t.subSkill?.nameVi ?? '—'}
              </Text>
              {!!t.latestPublished?.questionFrame && (
                <Text style={styles.body} numberOfLines={2}>
                  {t.latestPublished.questionFrame}
                </Text>
              )}
              <View style={styles.actions}>
                <HeyButton title={t.draft ? 'Sửa bản nháp' : 'Soạn bản mới'} iconName="create-outline" variant="tertiary" size="sm" onPress={() => open(t)} disabled={busy} accessibilityLabel={`Soạn mẫu ${t.title}`} />
                <HeyButton title="Nhân bản" iconName="copy-outline" variant="tertiary" size="sm" onPress={() => void duplicate(t)} loading={busyKey === `dup:${t.id}`} disabled={busy} accessibilityLabel={`Nhân bản mẫu ${t.title}`} />
                <HeyButton
                  title={t.isActive ? 'Tắt' : 'Bật lại'}
                  iconName={t.isActive ? 'pause-outline' : 'play-outline'}
                  variant="tertiary"
                  size="sm"
                  onPress={() => void toggle(t)}
                  loading={busyKey === `toggle:${t.id}`}
                  disabled={busy}
                  accessibilityLabel={`${t.isActive ? 'Tắt' : 'Bật lại'} mẫu ${t.title}`}
                />
                <HeyButton title="Xoá" iconName="trash-outline" variant="ghost" size="sm" onPress={() => void remove(t)} loading={busyKey === `delete:${t.id}`} disabled={busy} accessibilityLabel={`Xoá mẫu ${t.title}`} />
              </View>
            </HeyCard>
          );
        })}
      </ResourceBody>
      <TemplateSheet visible={!!editing} template={template} subSkills={subs} busy={busyKey === 'save'} onSubmit={(m, f, p) => void submit(m, f, p)} onClose={() => setEditing(null)} />
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  title: { ...Typography.bodyStrong, color: Colors.text },
  body: { ...Typography.label, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  selfStart: { alignSelf: 'flex-start' },
});
