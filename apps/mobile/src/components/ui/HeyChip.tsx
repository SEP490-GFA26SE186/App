// apps/mobile/src/components/ui/HeyChip.tsx — R2 Warm Storybook Guardian
// Hiển thị 36pt, bù hitSlop lên 44pt; trạng thái chọn có cả màu nền, viền và chữ (không chỉ dựa vào màu chữ).
// Ngữ nghĩa: có `selected` = một lựa chọn trong nhóm chọn-một (radio, đọc "đã chọn"; Web aria-checked);
// không có `selected` = chip hành động (button); không có `onPress` = nhãn tĩnh.
import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { Radius, hitSlopFor } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';

interface HeyChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
}

const CHIP_HEIGHT = 36;

export const HeyChip: React.FC<HeyChipProps> = ({ label, selected, onPress, style, textStyle, icon }) => {
  const selectable = !!onPress && selected !== undefined;
  const isSelected = !!selected;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      hitSlop={hitSlopFor(CHIP_HEIGHT)}
      accessibilityRole={selectable ? 'radio' : onPress ? 'button' : 'text'}
      accessibilityState={selectable ? { checked: isSelected } : undefined}
      aria-checked={selectable ? isSelected : undefined}
      style={(state) => [
        styles.chip,
        isSelected ? styles.chipSelected : styles.chipUnselected,
        state.pressed && styles.pressed,
        focusRing(state),
        style,
      ]}
    >
      <Text style={[styles.text, isSelected ? styles.textSelected : styles.textUnselected, textStyle]}>
        {icon ? `${icon} ` : ''}
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    minHeight: CHIP_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    marginRight: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  chipUnselected: {
    backgroundColor: Colors.surface,
    borderColor: Colors.outline,
  },
  chipSelected: {
    backgroundColor: Colors.brandTint,
    borderColor: Colors.brandStrong,
  },
  pressed: { opacity: 0.7 },
  text: {
    ...Typography.label,
    fontSize: 13,
    lineHeight: 18,
  },
  textUnselected: {
    color: Colors.textMuted,
  },
  // brandInk trên brandTint 12:1 (cam 500 trên nền sáng chỉ 2.6:1)
  textSelected: {
    fontFamily: FontFamily.extraBold,
    color: Colors.brandInk,
  },
});
