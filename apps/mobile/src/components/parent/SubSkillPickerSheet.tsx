// apps/mobile/src/components/parent/SubSkillPickerSheet.tsx
// "Đổi kỹ năng" (Web SubSkillPicker): chọn 1–2 kỹ năng con đang dùng (GET /sub-skills — phụ huynh chỉ thấy mục đang bật),
// nhóm theo 5 năng lực CASEL. Thứ tự chọn = thứ tự ưu tiên (mục chọn đầu là kỹ năng chính). BE giới hạn 1–2 (stories.validation).
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Sheet } from '../ui/Sheet';
import { HeyButton } from '../ui/HeyButton';
import { Icon } from '../ui/Icon';
import { StateView } from '../ui/StateView';
import { pedagogyService } from '../../services/pedagogyService';
import { useAsyncResource } from '../../utils/useAsyncResource';
import { CASEL, CASEL_ORDER } from '../../constants/eq';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { focusRing } from '../../theme/focus';
import { spaceActivates } from '../../utils/keyboard';
import { Typography } from '../../theme/typography';

const MAX = 2;

/** Chọn thêm khi đã đủ 2: bỏ mục chọn sớm nhất (như Web) */
export const toggleSkill = (picked: string[], id: string): string[] =>
  picked.includes(id) ? picked.filter((x) => x !== id) : picked.length >= MAX ? [...picked.slice(1), id] : [...picked, id];

interface Props {
  visible: boolean;
  initial: string[];
  busy: boolean;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}

export const SubSkillPickerSheet: React.FC<Props> = ({ visible, initial, busy, onClose, onConfirm }) => {
  const res = useAsyncResource(() => (visible ? pedagogyService.getSubSkills() : Promise.resolve(null)), [visible]);
  const [picked, setPicked] = useState<string[]>([]);
  useEffect(() => {
    if (visible) setPicked(initial.slice(0, MAX));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ lấy lựa chọn ban đầu lúc mở
  }, [visible]);

  const groups = useMemo(() => {
    const byCode = new Map<string, NonNullable<typeof res.data>>();
    for (const s of res.data ?? []) {
      if (s.isActive === false) continue;
      const code = s.skill?.caselCode ?? 'other';
      byCode.set(code, [...(byCode.get(code) ?? []), s]);
    }
    return [...CASEL_ORDER, 'other'].filter((c) => byCode.has(c)).map((code) => ({ code, items: byCode.get(code)! }));
  }, [res.data]);

  return (
    <Sheet
      visible={visible}
      title="Đổi kỹ năng bé sẽ tập"
      description="Chọn 1–2 kỹ năng. Kỹ năng chọn đầu tiên là kỹ năng chính; hệ thống đọc lại chuyện để tìm chỗ cho bé tập."
      onClose={() => !busy && onClose()}
      footer={
        <HeyButton
          title={`Dùng ${picked.length || ''} kỹ năng này`.replace('  ', ' ')}
          iconName="checkmark"
          loading={busy}
          disabled={busy || picked.length === 0}
          onPress={() => onConfirm(picked)}
        />
      }
    >
      {res.status === 'loading' && <StateView variant="loading" title="Đang tải kỹ năng..." />}
      {res.status === 'error' && (
        <StateView variant="error" title="Chưa tải được kỹ năng" description={res.error ?? ''} actionLabel="Thử lại" onAction={() => void res.reload()} />
      )}
      {res.status === 'ready' && groups.length === 0 && <StateView variant="empty" title="Chưa có kỹ năng nào đang dùng" />}
      {groups.map(({ code, items }) => (
        <View key={code} style={styles.group}>
          <Text style={styles.groupTitle} accessibilityRole="header">
            {CASEL[code]?.label ?? 'Khác'}
          </Text>
          {items.map((s) => {
            const index = picked.indexOf(s.id);
            const on = index >= 0;
            const toggle = () => setPicked((p) => toggleSkill(p, s.id));
            return (
              <Pressable
                key={s.id}
                onPress={toggle}
                {...spaceActivates(toggle)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                aria-checked={on}
                accessibilityLabel={`${s.nameVi}${on && index === 0 ? ', kỹ năng chính' : ''}. ${s.descriptionVi ?? ''}`}
                style={(st) => [styles.row, on && styles.rowOn, st.pressed && styles.pressed, focusRing(st)]}
              >
                <Icon name={on ? 'checkbox' : 'square-outline'} size={24} color={on ? Colors.brandStrong : Colors.textMuted} />
                <View style={styles.body}>
                  <Text style={styles.name}>{on && picked.length > 1 ? `${index + 1}. ${s.nameVi}` : s.nameVi}</Text>
                  {!!s.descriptionVi && <Text style={styles.desc}>{s.descriptionVi}</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </Sheet>
  );
};

const styles = StyleSheet.create({
  group: { gap: Spacing.sm, marginBottom: Spacing.md },
  groupTitle: { ...Typography.label, color: Colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 56, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.outline, backgroundColor: Colors.surface },
  rowOn: { borderColor: Colors.brandStrong, backgroundColor: Colors.brandTint },
  pressed: { opacity: 0.8 },
  body: { flex: 1, gap: 4 },
  name: { ...Typography.bodyStrong, color: Colors.text },
  desc: { ...Typography.caption, color: Colors.text },
});
