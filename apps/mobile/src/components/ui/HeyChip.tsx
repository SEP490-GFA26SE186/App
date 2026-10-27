// apps/mobile/src/components/ui/HeyChip.tsx — R1 Warm Storybook Guardian
// Hiển thị 36pt, bù hitSlop lên 44pt; trạng thái chọn có cả màu nền, viền và chữ (không chỉ dựa vào màu chữ).
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { Radius, hitSlopFor } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';

interface HeyChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
}

const CHIP_HEIGHT = 36;

export const HeyChip: React.FC<HeyChipProps> = ({
  label,
  selected = false,
  onPress,
  style,
  textStyle,
  icon,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
      hitSlop={hitSlopFor(CHIP_HEIGHT)}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected } : undefined}
      style={[
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          selected ? styles.textSelected : styles.textUnselected,
          textStyle,
        ]}
      >
        {icon ? `${icon} ` : ''}
        {label}
      </Text>
    </TouchableOpacity>
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
