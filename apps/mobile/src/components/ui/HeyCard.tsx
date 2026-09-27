// apps/mobile/src/components/ui/HeyCard.tsx — v2.0 Fairy Garden
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';

interface HeyCardProps {
  children: React.ReactNode;
  variant?: 'white' | 'coral' | 'purple' | 'yellow' | 'teal' | 'kid' | 'sky' | 'mint';
  style?: ViewStyle | ViewStyle[];
  noPadding?: boolean;
}

export const HeyCard: React.FC<HeyCardProps> = ({
  children,
  variant = 'white',
  style,
  noPadding = false,
}) => {
  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'coral':   return Colors.primaryLight;
      case 'purple':  return Colors.lavenderLight;
      case 'yellow':  return Colors.primaryLight;
      case 'teal':    return Colors.mintLight;
      case 'sky':     return Colors.accentLight;
      case 'mint':    return Colors.mintLight;
      case 'kid':     return Colors.surfaceWarm;
      case 'white':
      default:        return Colors.surface;
    }
  };

  const getShadow = (): any => {
    switch (variant) {
      case 'yellow':
        return {
          boxShadow: '0 6px 14px rgba(255, 217, 61, 0.16)',
        };
      case 'teal':
      case 'mint':
        return {
          boxShadow: '0 6px 14px rgba(126, 203, 161, 0.14)',
        };
      case 'sky':
        return {
          boxShadow: '0 6px 14px rgba(77, 171, 247, 0.14)',
        };
      case 'kid':
        return {
          boxShadow: '0 8px 18px rgba(255, 217, 61, 0.20)',
        };
      default:
        return {
          boxShadow: '0 6px 14px rgba(107, 203, 119, 0.10)',
        };
    }
  };

  return (
    <View
      style={[
        styles.card,
        getShadow(),
        { backgroundColor: getBackgroundColor() },
        variant === 'kid' && styles.kidCard,
        noPadding && { padding: 0 },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    // KHÔNG có borderWidth / borderColor đen
    // Border thay bằng light green tint
    borderWidth: 1,
    borderColor: 'rgba(107, 203, 119, 0.12)',
  },
  kidCard: {
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 217, 61, 0.35)',
  },
});
