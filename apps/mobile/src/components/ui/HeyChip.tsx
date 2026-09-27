// apps/mobile/src/components/ui/HeyChip.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../theme/colors';

interface HeyChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
}

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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1.5,
    marginRight: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  chipUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  textUnselected: {
    color: Colors.textMuted,
  },
  textSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
