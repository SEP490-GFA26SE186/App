// apps/mobile/src/screens/specialist/TopicsScreen.tsx
// GĐ E2a – Chuyện mẫu (Web TopicsPage): tìm, lọc năng lực CASEL + trạng thái, thẻ; tạo / sửa trong Sheet theo topics.validation
// của BE (kỹ năng con 1–3 cùng năng lực, chỉ chọn mục có mẫu đã ban hành; đã có truyện thì khoá năng lực); bật / tắt và xoá
// qua Dialog (đã có truyện → BE chỉ ngưng dùng, hiện câu BE). Chống bấm đúp, lỗi BE hiện câu đã dịch.
import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyChip } from '../../components/ui/HeyChip';
import { HeyInput } from '../../components/ui/HeyInput';
import { Badge } from '../../components/ui/Badge';
import { Sheet } from '../../components/ui/Sheet';
import { StateView } from '../../components/ui/StateView';
import { useDialog } from '../../components/ui/Dialog';
import { FilterChips, ManagementPage, ResourceBody, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Spacing, Touch } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { eqSkillService } from '../../services/eqSkillService';
import { pedagogyService } from '../../services/pedagogyService';
import {
  STATUS_OPTIONS,
  TopicForm,
  subSkillSelectable,
  toggleConfirm,
  topicBody,
  topicDeleteConfirm,
  topicForm,
  topicFormError,
  topicSaveConfirm,
  topicUpdateBody,
} from '../../utils/pedagogy';
import type { EqSkillDto } from '../../types/api';
import type { ManagedTopic } from '../../types/pedagogy';

const SEARCH_DELAY_MS = 400;

const TopicSheet: React.FC<{ visible: boolean; topic?: ManagedTopic; skills: EqSkillDto[]; busy: boolean; onSave: (f: TopicForm) => void; onClose: () => void }> = ({
  visible,
  topic,
  skills,
  busy,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState<TopicForm>(topicForm(topic));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!visible) return;
    setForm(topicForm(topic));
    setError(null);
  }, [visible, topic?.id]);
  const subs = useManagementResource(() => (visible && form.skillId ? pedagogyService.getSubSkills({ skillId: form.skillId, isActive: 'true' }) : Promise.resolve([])), [visible, form.skillId]);
  const skillLocked = (topic?.storiesCount ?? 0) > 0;
  const set = (patch: Partial<TopicForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    setError(null);
  };
  const toggleSub = (id: string) => set({ subSkillIds: form.subSkillIds.includes(id) ? form.subSkillIds.filter((x) => x !== id) : [...form.subSkillIds, id] });
  const save = () => {
    const e = topicFormError(form);
    setError(e);
    if (!e) onSave(form);
  };
  return (
    <Sheet
      visible={visible}
      title={topic ? 'Sửa chuyện mẫu' : 'Thêm chuyện mẫu'}
      description="Phụ huynh chọn chuyện mẫu khi tạo truyện; điểm EQ của bé tính theo năng lực gắn với chuyện mẫu."
      onClose={onClose}
      footer={<HeyButton title={topic ? 'Lưu thay đổi' : 'Tạo chuyện mẫu'} iconName="checkmark" loading={busy} onPress={save} />}
    >
      <HeyInput label="Tên chuyện mẫu" value={form.title} onChangeText={(title) => set({ title })} placeholder="Nhập tên chuyện mẫu" />
      <Text style={styles.label}>Năng lực CASEL</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel="Năng lực CASEL" style={styles.chips}>
        {skills.map((s) => (
          <HeyChip key={s.id} label={s.nameVi} selected={form.skillId === s.id} onPress={skillLocked ? undefined : () => set({ skillId: s.id, subSkillIds: [] })} />
        ))}
      </View>
      {skillLocked && <Text style={styles.muted}>Đã có {topic?.storiesCount} truyện dùng nên không đổi được năng lực. Cần năng lực khác thì tạo chuyện mẫu mới.</Text>}
      <Text style={styles.label}>Kỹ năng con (chọn 1–3)</Text>
      {!form.skillId ? (
        <Text style={styles.muted}>Chọn năng lực CASEL trước để xem các kỹ năng con.</Text>
      ) : subs.status === 'loading' ? (
        <StateView variant="loading" title="Đang tải kỹ năng con..." />
      ) : subs.status === 'error' ? (
        <StateView variant="error" title="Chưa tải được kỹ năng con" description={subs.error ?? ''} actionLabel="Thử lại" onAction={() => void subs.reload()} />
      ) : !subs.data?.length ? (
        <Text style={styles.muted}>Năng lực này chưa có kỹ năng con đang dùng.</Text>
      ) : (
        <View style={styles.subList}>
          {subs.data.map((s) => {
            const checked = form.subSkillIds.includes(s.id);
            const enabled = subSkillSelectable(s, form.subSkillIds);
            return (
              <View key={s.id} style={styles.subRow}>
                <HeyChip label={s.nameVi} selected={checked} onPress={enabled ? () => toggleSub(s.id) : undefined} />
                {!s.publishedTemplatesCount && <Text style={styles.error}>Chưa có mẫu câu hỏi đã ban hành</Text>}
              </View>
            );
          })}
        </View>
      )}
      <HeyInput
        label="Cốt truyện gợi ý"
        value={form.guidance}
        onChangeText={(guidance) => set({ guidance })}
        multiline
        numberOfLines={4}
        placeholder="Sự việc của chuyện mẫu: ai, ở đâu, chuyện gì xảy ra, điều cần tránh khi viết truyện..."
        hint="AI dựng truyện theo cốt truyện này; câu hỏi chấm điểm đi theo kỹ năng con đã chọn"
      />
      <View style={styles.row}>
        <View style={styles.flex1}>
          <HeyInput label="Tuổi từ" value={form.ageMin} onChangeText={(ageMin) => set({ ageMin })} keyboardType="numeric" />
        </View>
        <View style={styles.flex1}>
          <HeyInput label="Đến" value={form.ageMax} onChangeText={(ageMax) => set({ ageMax })} keyboardType="numeric" />
        </View>
        <View style={styles.flex1}>
          <HeyInput label="Thứ tự" value={form.displayOrder} onChangeText={(displayOrder) => set({ displayOrder })} keyboardType="numeric" />
        </View>
      </View>
      <View style={styles.switchRow}>
        <Text style={[styles.label, styles.flex1]}>Cho phụ huynh chọn chuyện mẫu này</Text>
        <Switch value={form.isActive} onValueChange={(isActive) => set({ isActive })} accessibilityLabel="Đang dùng" trackColor={{ true: Colors.tealStrong, false: Colors.outline }} thumbColor={Colors.surface} />
      </View>
      {!!error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </Sheet>
  );
};

export const TopicsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const dialog = useDialog();
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [skillId, setSkillId] = useState('all');
  const [isActive, setIsActive] = useState('all');
  const [editing, setEditing] = useState<ManagedTopic | 'new' | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchText), SEARCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [searchText]);
  const skills = useManagementResource(() => eqSkillService.getSkills(), []);
  const list = useManagementResource(() => pedagogyService.getTopics({ skillId, search, isActive }), [skillId, search, isActive]);
  const { run, busy, busyKey } = useMutationRunner(list.reload);
  const topic = editing && editing !== 'new' ? editing : undefined;

  const save = async (f: TopicForm) => {
    if (busy) return;
    if (topic) {
      const body = topicUpdateBody(topic, f);
      if (!Object.keys(body).length) return void dialog.notify('Chưa có gì thay đổi', 'Sửa ít nhất một thông tin rồi lưu.');
      if (!(await dialog.confirm(topicSaveConfirm(topic, f)))) return;
      if (await run(`topic:${topic.id}`, () => pedagogyService.updateTopic(topic.id, body), 'Đã cập nhật chuyện mẫu')) {
        setEditing(null);
        void list.reload();
      }
      return;
    }
    if (!(await dialog.confirm(topicSaveConfirm(undefined, f)))) return;
    if (await run('topic:new', () => pedagogyService.createTopic(topicBody(f)), 'Đã tạo chuyện mẫu mới')) {
      setEditing(null);
      void list.reload();
    }
  };

  const toggle = async (t: ManagedTopic) => {
    if (busy) return;
    if (!(await dialog.confirm(toggleConfirm('chuyện mẫu', t.title, !t.isActive)))) return;
    if (await run(`toggle:${t.id}`, () => pedagogyService.updateTopic(t.id, { isActive: !t.isActive }), t.isActive ? 'Đã ngưng dùng chuyện mẫu' : 'Đã dùng lại chuyện mẫu')) void list.reload();
  };

  const remove = async (t: ManagedTopic) => {
    if (busy) return;
    if (!(await dialog.confirm(topicDeleteConfirm(t)))) return;
    // BE: xoá hẳn, hoặc chuyển ngưng dùng nếu đã có truyện — hiện đúng câu BE trả
    if (await run(`delete:${t.id}`, () => pedagogyService.deleteTopic(t.id), (r) => r.message)) void list.reload();
  };

  const skillOptions = [{ value: 'all', label: 'Mọi năng lực' }, ...(skills.data ?? []).map((s) => ({ value: s.id, label: s.nameVi }))];
  return (
    <ManagementPage title="Chuyện mẫu" subtitle="Mỗi chuyện mẫu gắn đúng một năng lực CASEL. Phụ huynh chọn chuyện mẫu khi tạo truyện cho con." onBack={onBack} onRefresh={list.reload}>
      <HeyButton title="Thêm chuyện mẫu" iconName="add" size="sm" onPress={() => setEditing('new')} disabled={busy || !skills.data?.length} style={styles.selfStart} />
      <HeyInput placeholder="Tìm theo tên chuyện mẫu..." value={searchText} onChangeText={setSearchText} />
      <FilterChips label="Năng lực" options={skillOptions} value={skillId} onChange={setSkillId} />
      <FilterChips label="Trạng thái" options={STATUS_OPTIONS} value={isActive} onChange={setIsActive} />
      <ResourceBody status={list.status} error={list.error} empty={!list.data?.length} emptyTitle="Chưa có chuyện mẫu phù hợp" onRetry={list.reload}>
        {list.data?.map((t) => (
          <HeyCard key={t.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.title, styles.flex1, !t.isActive && styles.muted]}>{t.title}</Text>
              {!t.isActive && <Badge label="Ngưng dùng" tone="neutral" />}
            </View>
            {!!t.skill && <Badge label={t.skill.nameVi} tone="info" />}
            <Text style={styles.body} numberOfLines={3}>
              {t.guidance}
            </Text>
            {!!t.subSkills.length && (
              <View style={styles.tags}>
                {t.subSkills.map((s) => (
                  <Badge key={s.id} label={s.nameVi} tone="neutral" />
                ))}
              </View>
            )}
            <Text style={styles.muted}>
              {t.ageMin}–{t.ageMax} tuổi · {t.storiesCount} truyện · Thứ tự {t.displayOrder}
              {t.creator ? ` · Tạo bởi ${t.creator.fullName || t.creator.username}` : ''}
            </Text>
            <View style={styles.actions}>
              <HeyButton title="Sửa" iconName="create-outline" variant="tertiary" size="sm" onPress={() => setEditing(t)} disabled={busy} accessibilityLabel={`Sửa chuyện mẫu ${t.title}`} />
              <HeyButton
                title={t.isActive ? 'Ngưng dùng' : 'Dùng lại'}
                iconName={t.isActive ? 'pause-outline' : 'play-outline'}
                variant="tertiary"
                size="sm"
                onPress={() => void toggle(t)}
                loading={busyKey === `toggle:${t.id}`}
                disabled={busy}
                accessibilityLabel={`${t.isActive ? 'Ngưng dùng' : 'Dùng lại'} chuyện mẫu ${t.title}`}
              />
              <HeyButton
                title="Xoá"
                iconName="trash-outline"
                variant="ghost"
                size="sm"
                onPress={() => void remove(t)}
                loading={busyKey === `delete:${t.id}`}
                disabled={busy}
                accessibilityLabel={`Xoá chuyện mẫu ${t.title}`}
              />
            </View>
          </HeyCard>
        ))}
      </ResourceBody>
      <TopicSheet visible={!!editing} topic={topic} skills={skills.data ?? []} busy={busyKey === 'topic:new' || busyKey === `topic:${topic?.id}`} onSave={(f) => void save(f)} onClose={() => setEditing(null)} />
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  flex1: { flex: 1 },
  title: { ...Typography.bodyStrong, color: Colors.text },
  body: { ...Typography.label, color: Colors.text },
  label: { ...Typography.label, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  error: { ...Typography.caption, color: Colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs, marginBottom: Spacing.sm },
  subList: { gap: Spacing.xs, marginTop: Spacing.xs, marginBottom: Spacing.sm },
  subRow: { gap: 2, alignItems: 'flex-start' },
  switchRow: { flexDirection: 'row', alignItems: 'center', minHeight: Touch.min },
  selfStart: { alignSelf: 'flex-start' },
});
