// apps/mobile/src/components/specialist/TemplateSheet.tsx
// GĐ E2a – soạn mẫu câu hỏi (Web TemplateVersionForm): tạo mới chọn năng lực CASEL trước rồi kỹ năng con, gợi ý dạng trả lời theo
// năng lực (e704a49); 4 nhóm ① ý định câu hỏi ② chấm thế nào ③ gợi ý cho phụ huynh ④ căn cứ sư phạm + "Nâng cao". Sheet có sẵn
// (cuộn + tránh bàn phím). Kiểm như BE trước khi gửi; gửi do màn cha (Dialog xác nhận + chống bấm đúp).
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { HeyButton } from '../ui/HeyButton';
import { HeyChip } from '../ui/HeyChip';
import { HeyInput } from '../ui/HeyInput';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { Colors } from '../../theme/colors';
import { Radius, Spacing, Touch } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import {
  ANSWER_FORMATS,
  EMOTION_LABELS,
  PROMPTS_MAX,
  ROLES,
  SUGGESTED_FORMATS,
  TemplateForm,
  autoTitle,
  draftErrors,
  publishMissing,
  skillsOf,
  templateForm,
} from '../../utils/pedagogy';
import type { AnswerFormat, Emotion, ManagedSubSkill, QuestionTemplate } from '../../types/pedagogy';

export interface TemplateMeta {
  subSkillId: string;
  answerFormat: AnswerFormat;
  title: string;
}

const Group: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <View style={styles.group}>
    <Text style={styles.groupTitle} accessibilityRole="header">
      {title}
    </Text>
    {!!hint && <Text style={styles.muted}>{hint}</Text>}
    {children}
  </View>
);

export const TemplateSheet: React.FC<{
  visible: boolean;
  /** Có = soạn mẫu đã có (nháp hoặc bản mới từ bản đã ban hành) */
  template?: QuestionTemplate;
  subSkills: ManagedSubSkill[];
  busy: boolean;
  onSubmit: (meta: TemplateMeta, form: TemplateForm, publish: boolean) => void;
  onClose: () => void;
}> = ({ visible, template, subSkills, busy, onSubmit, onClose }) => {
  const isNew = !template;
  const [meta, setMeta] = useState<TemplateMeta>({ subSkillId: '', answerFormat: 'emotion_pick', title: '' });
  const [skillId, setSkillId] = useState('');
  const [formatTouched, setFormatTouched] = useState(false);
  const [form, setForm] = useState<TemplateForm>(templateForm());
  const [advanced, setAdvanced] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) return;
    setMeta({ subSkillId: template?.subSkillId ?? template?.subSkill?.id ?? '', answerFormat: template?.answerFormat ?? 'emotion_pick', title: template?.title ?? '' });
    setSkillId(template?.subSkill?.skillId ?? '');
    setFormatTouched(false);
    setForm(templateForm(template?.draft ?? template?.latestPublished));
    setAdvanced(false);
    setProblems([]);
  }, [visible, template?.id]);

  const skills = skillsOf(subSkills);
  const selectedSkill = skills.find((k) => k.id === skillId);
  const suggestion = selectedSkill ? SUGGESTED_FORMATS[selectedSkill.caselCode] : undefined;
  const format = meta.answerFormat;
  const subSkill = subSkills.find((s) => s.id === meta.subSkillId);
  const set = (patch: Partial<TemplateForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    setProblems([]);
  };
  const pickSkill = (id: string) => {
    setSkillId(id);
    const next = SUGGESTED_FORMATS[skills.find((k) => k.id === id)?.caselCode ?? '']?.formats;
    setMeta((m) => ({
      ...m,
      // Chưa tự chọn dạng → đặt dạng gợi ý đầu tiên; kỹ năng con không thuộc năng lực mới → bỏ chọn
      answerFormat: !formatTouched && next && !next.includes(m.answerFormat) ? next[0] : m.answerFormat,
      subSkillId: subSkills.find((s) => s.id === m.subSkillId)?.skill?.id === id ? m.subSkillId : '',
    }));
    setProblems([]);
  };
  const toggleEmotion = (e: Emotion) => set({ allowedEmotions: form.allowedEmotions.includes(e) ? form.allowedEmotions.filter((x) => x !== e) : [...form.allowedEmotions, e] });
  const resolvedTitle = meta.title.trim() || autoTitle(form.questionFrame);

  const submit = (publish: boolean) => {
    const p: string[] = [];
    if (isNew && !meta.subSkillId) p.push('Chọn kỹ năng con cho mẫu câu hỏi');
    if (resolvedTitle.length < 3) p.push('Nhập ý ① (hoặc tên mẫu) để đặt tên cho mẫu, tối thiểu 3 ký tự');
    if (resolvedTitle.length > 200) p.push('Tên mẫu tối đa 200 ký tự');
    p.push(...draftErrors(form));
    if (publish) p.push(...publishMissing(form, format));
    setProblems(p);
    if (!p.length) onSubmit({ ...meta, title: resolvedTitle }, form, publish);
  };

  const versionNote = isNew
    ? 'Mẫu mới, bản nháp v1'
    : template?.draft
      ? `Đang sửa bản nháp v${template.draft.version}`
      : `Sửa sẽ tạo bản nháp mới từ v${template?.latestPublished?.version ?? 1}`;

  return (
    <Sheet
      visible={visible}
      title={isNew ? 'Thêm mẫu câu hỏi' : `Soạn mẫu: ${template?.title}`}
      description={`${versionNote}. Bản đã ban hành không bao giờ bị sửa.`}
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <View style={styles.flex1}>
            <HeyButton title="Lưu bản nháp" variant="outline" onPress={() => submit(false)} disabled={busy} />
          </View>
          <View style={styles.flex1}>
            <HeyButton title="Ban hành" iconName="checkmark-done" onPress={() => submit(true)} loading={busy} />
          </View>
        </View>
      }
    >
      {isNew ? (
        <>
          <Text style={styles.label}>Năng lực CASEL</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel="Năng lực CASEL" style={styles.chips}>
            {skills.map((k) => (
              <HeyChip key={k.id} label={k.nameVi} selected={skillId === k.id} onPress={() => pickSkill(k.id)} />
            ))}
          </View>
          <Text style={styles.label}>Kỹ năng con</Text>
          {skillId ? (
            <View accessibilityRole="radiogroup" accessibilityLabel="Kỹ năng con" style={styles.chips}>
              {subSkills
                .filter((s) => s.skill?.id === skillId)
                .map((s) => (
                  <HeyChip
                    key={s.id}
                    label={s.isActive ? s.nameVi : `${s.nameVi} (đã tắt)`}
                    selected={meta.subSkillId === s.id}
                    onPress={() => {
                      setMeta((m) => ({ ...m, subSkillId: s.id }));
                      setProblems([]);
                    }}
                  />
                ))}
            </View>
          ) : (
            <Text style={styles.muted}>Chọn năng lực trước.</Text>
          )}
          <Text style={styles.label}>Dạng trả lời (không đổi được sau khi tạo)</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel="Dạng trả lời" style={styles.chips}>
            {(Object.keys(ANSWER_FORMATS) as AnswerFormat[]).map((f) => (
              <HeyChip
                key={f}
                label={suggestion?.formats.includes(f) ? `${ANSWER_FORMATS[f]} · gợi ý` : ANSWER_FORMATS[f]}
                selected={format === f}
                onPress={() => {
                  setFormatTouched(true);
                  setMeta((m) => ({ ...m, answerFormat: f }));
                }}
              />
            ))}
          </View>
          {!!suggestion && selectedSkill && (
            <Text style={[styles.note, !suggestion.formats.includes(format) && styles.warn]}>
              Gợi ý cho {selectedSkill.nameVi}: {suggestion.formats.map((f) => ANSWER_FORMATS[f]).join(' hoặc ')} — vì {suggestion.why}.
              {!suggestion.formats.includes(format) ? ` “${ANSWER_FORMATS[format]}” ít hợp với năng lực này; vẫn dùng được nếu câu hỏi đo đúng kỹ năng con đã chọn.` : ''}
            </Text>
          )}
        </>
      ) : (
        <Text style={styles.body}>
          {template?.subSkill?.nameVi ?? '—'} · {ANSWER_FORMATS[format]}
        </Text>
      )}
      {!!subSkill?.descriptionVi && <Text style={styles.muted}>{subSkill.descriptionVi}</Text>}
      <HeyInput
        label="Tên mẫu"
        value={meta.title}
        onChangeText={(title) => {
          setMeta((m) => ({ ...m, title }));
          setProblems([]);
        }}
        placeholder={autoTitle(form.questionFrame) || 'Nhập tên mẫu câu hỏi'}
        hint={meta.title.trim() ? undefined : 'Để trống: tự lấy từ ô ①'}
      />

      <Group title="① Bé được hỏi về điều gì" hint="Viết ý định câu hỏi, không phải câu cho bé — AI sẽ viết câu cụ thể theo từng truyện.">
        <HeyInput value={form.questionFrame} onChangeText={(questionFrame) => set({ questionFrame })} multiline numberOfLines={2} placeholder="Mô tả câu hỏi cần hỏi bé…" />
        {format === 'emotion_pick' && (
          <View style={styles.switchRow}>
            <Text style={[styles.label, styles.flex1]}>Hỏi cảm xúc của người khác (cần nhân vật phụ)</Text>
            <Switch value={form.needsTarget} onValueChange={(needsTarget) => set({ needsTarget })} accessibilityLabel="Hỏi cảm xúc của người khác" trackColor={{ true: Colors.tealStrong, false: Colors.outline }} thumbColor={Colors.surface} />
          </View>
        )}
      </Group>

      <Group title="② Chấm thế nào">
        {format === 'emotion_pick' && <Text style={styles.body}>Bé chọn một cảm xúc; đáp án đúng là cảm xúc AI dựng trong trang truyện. Đúng ngay lần đầu = 1 điểm.</Text>}
        {format === 'single_correct' && (
          <>
            <HeyInput label="Mô tả đáp án đúng" value={form.correctDesc} onChangeText={(correctDesc) => set({ correctDesc })} multiline numberOfLines={2} />
            <HeyInput label="Mô tả đáp án nhiễu" value={form.distractorDesc} onChangeText={(distractorDesc) => set({ distractorDesc })} multiline numberOfLines={2} hint="AI viết các đáp án sai hợp lý theo mô tả này" />
          </>
        )}
        {format === 'role_choice' &&
          ROLES.map((r) => (
            <HeyInput key={r.key} label={`Cách ${r.label}`} value={form[`${r.key}Desc`]} onChangeText={(t) => set({ [`${r.key}Desc`]: t } as Partial<TemplateForm>)} multiline numberOfLines={2} />
          ))}
      </Group>

      <Group title="③ Gợi ý cho phụ huynh" hint="1–3 câu ba mẹ dùng để trò chuyện với bé sau khi đọc.">
        {form.parentPrompts.map((p, i) => (
          <View key={i} style={styles.promptRow}>
            <View style={styles.flex1}>
              <HeyInput value={p} onChangeText={(t) => set({ parentPrompts: form.parentPrompts.map((x, idx) => (idx === i ? t : x)) })} placeholder={`Câu gợi ý ${i + 1}`} />
            </View>
            {form.parentPrompts.length > 1 && (
              <Pressable
                onPress={() => set({ parentPrompts: form.parentPrompts.filter((_, idx) => idx !== i) })}
                accessibilityRole="button"
                accessibilityLabel={`Bỏ câu gợi ý ${i + 1}`}
                style={(s) => [styles.iconBtn, focusRing(s)]}
              >
                <Icon name="close" size={20} color={Colors.textMuted} />
              </Pressable>
            )}
          </View>
        ))}
        {form.parentPrompts.length < PROMPTS_MAX && (
          <HeyButton title="Thêm câu gợi ý" iconName="add" variant="tertiary" size="sm" onPress={() => set({ parentPrompts: [...form.parentPrompts, ''] })} style={styles.selfStart} />
        )}
      </Group>

      <Group title="④ Căn cứ sư phạm" hint="Vì sao mẫu này đo đúng kỹ năng con">
        <HeyInput value={form.rationale} onChangeText={(rationale) => set({ rationale })} multiline numberOfLines={2} />
      </Group>

      <Pressable
        onPress={() => setAdvanced((a) => !a)}
        accessibilityRole="button"
        accessibilityState={{ expanded: advanced }}
        style={(s) => [styles.advancedBtn, focusRing(s)]}
      >
        <Icon name={advanced ? 'chevron-down' : 'chevron-forward'} size={18} color={Colors.text} />
        <Text style={styles.groupTitle}>Nâng cao</Text>
        <Text style={styles.muted}>không bắt buộc</Text>
      </Pressable>
      {advanced && (
        <View style={styles.group}>
          {format === 'role_choice' && (
            <>
              <Text style={styles.label}>Điểm từng cách (0–1)</Text>
              <View style={styles.promptRow}>
                {ROLES.map((r) => (
                  <View key={r.key} style={styles.flex1}>
                    <HeyInput label={r.label} value={form[`${r.key}Score`]} onChangeText={(t) => set({ [`${r.key}Score`]: t } as Partial<TemplateForm>)} keyboardType="numeric" />
                  </View>
                ))}
              </View>
              <Text style={styles.muted}>Điểm cách Tích cực phải lớn hơn điểm hai cách còn lại.</Text>
            </>
          )}
          {format === 'emotion_pick' && (
            <>
              <Text style={styles.label}>Cảm xúc cho phép</Text>
              <View style={styles.chips}>
                {(Object.keys(EMOTION_LABELS) as Emotion[]).map((e) => (
                  <HeyChip key={e} label={EMOTION_LABELS[e]} selected={form.allowedEmotions.includes(e)} onPress={() => toggleEmotion(e)} />
                ))}
              </View>
              <Text style={styles.muted}>Bỏ chọn hết = cho bé chọn cả 5 cảm xúc</Text>
            </>
          )}
          <HeyInput label="Bối cảnh trang truyện" value={form.pageSetup} onChangeText={(pageSetup) => set({ pageSetup })} multiline numberOfLines={2} hint="Để trống thì AI tự suy ra" />
          {format !== 'role_choice' && (
            <HeyInput label="Hướng dẫn gợi ý" value={form.hintGuidance} onChangeText={(hintGuidance) => set({ hintGuidance })} multiline numberOfLines={2} hint="Gợi ý nhẹ nhàng khi bé chọn chưa đúng; để trống thì AI tự viết" />
          )}
          <HeyInput label="Đường dẫn tham khảo" value={form.referenceUrl} onChangeText={(referenceUrl) => set({ referenceUrl })} autoCapitalize="none" autoCorrect={false} placeholder="https://..." />
        </View>
      )}

      {!!problems.length && (
        <View style={styles.problems} accessibilityRole="alert">
          <Text style={styles.problemTitle}>Cần bổ sung / sửa:</Text>
          {problems.map((p) => (
            <Text key={p} style={styles.error}>
              • {p}
            </Text>
          ))}
        </View>
      )}
    </Sheet>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  footer: { flexDirection: 'row', gap: Spacing.sm },
  label: { ...Typography.label, color: Colors.text },
  body: { ...Typography.label, color: Colors.text, marginBottom: Spacing.sm },
  muted: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.xs },
  note: { ...Typography.caption, color: Colors.successText, backgroundColor: Colors.successTint, padding: Spacing.sm, borderRadius: Radius.md, marginBottom: Spacing.sm },
  warn: { color: Colors.text, backgroundColor: Colors.warningTint },
  error: { ...Typography.caption, color: Colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs, marginBottom: Spacing.sm },
  group: { gap: Spacing.xs, borderWidth: 1, borderColor: Colors.outline, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  groupTitle: { ...Typography.bodyStrong, color: Colors.text },
  switchRow: { flexDirection: 'row', alignItems: 'center', minHeight: Touch.min, gap: Spacing.sm },
  promptRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  iconBtn: { width: Touch.min, height: Touch.min, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
  advancedBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minHeight: Touch.min, marginBottom: Spacing.xs },
  problems: { gap: 2, backgroundColor: Colors.dangerTint, padding: Spacing.md, borderRadius: Radius.md },
  problemTitle: { ...Typography.bodyStrong, color: Colors.danger },
  selfStart: { alignSelf: 'flex-start' },
});
