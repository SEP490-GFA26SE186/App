// apps/mobile/src/components/kid/KidState.tsx — R4: trạng thái rỗng / lỗi / hoàn thành của Kid Mode.
// Icon vector trong vòng màu (như StateView R2) nhưng chữ lớn và nút >= 56pt cho trẻ.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { HeyButton } from '../ui/HeyButton';
import { Icon, IconName } from '../ui/Icon';

type Tone = 'teal' | 'danger' | 'brand';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  teal: { bg: Colors.tealTint, fg: Colors.tealStrong },
  danger: { bg: Colors.dangerTint, fg: Colors.danger },
  brand: { bg: Colors.brandTint, fg: Colors.brandStrong },
};

interface Props {
  icon: IconName;
  tone: Tone;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Lỗi được đọc ngay bởi trình đọc màn hình */
  alert?: boolean;
}

export const KidState: React.FC<Props> = ({ icon, tone, title, description, actionLabel, onAction, alert }) => (
  <View style={styles.box} accessibilityRole={alert ? 'alert' : undefined}>
    <View style={[styles.circle, { backgroundColor: TONES[tone].bg }]}>
      <Icon name={icon} size={48} color={TONES[tone].fg} />
    </View>
    <Text style={styles.title} accessibilityRole="header">
      {title}
    </Text>
    {!!description && <Text style={styles.desc}>{description}</Text>}
    {!!actionLabel && !!onAction && (
      <HeyButton title={actionLabel} variant="kid" size="xl" onPress={onAction} style={styles.btn} />
    )}
  </View>
);

const styles = StyleSheet.create({
  box: { alignItems: 'center', paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  circle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  title: { ...Typography.kidTitle, color: Colors.text, textAlign: 'center', marginTop: Spacing.sm },
  desc: { ...Typography.kidBody, fontSize: 17, lineHeight: 26, color: Colors.textMuted, textAlign: 'center' },
  btn: { marginTop: Spacing.md, minWidth: 200 },
});
