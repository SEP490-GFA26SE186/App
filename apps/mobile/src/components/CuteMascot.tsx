// apps/mobile/src/components/CuteMascot.tsx — R5: cú Lu Lu + bong bóng lời gợi ý ở Parent Home.
// Lời gợi ý chỉ nêu những việc app thật sự làm được (khớp thanh tab R3) và KHÔNG chứa số liệu/thành tích (audit A2:
// trước đây có dòng bịa "Bé đã thu thập được 12 ⭐ sao" và nhắc nút "Sáng Tác AI" không còn tồn tại).
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { OwlMascot, MascotState } from './OwlMascot';
import { Colors } from '../theme/colors';
import { Elevation } from '../theme/shadows';
import { Radius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';

interface CuteMascotProps {
  speechText?: string;
  onTalk?: () => void;
  style?: ViewStyle;
  mascotState?: MascotState;
}

export const TIPS = [
  'Hú hú! Hôm nay bé muốn cùng Lu Lu phiêu lưu câu chuyện nào nè? ✨',
  'Một câu chuyện trước giờ đi ngủ là khoảng thời gian ấm áp của ba mẹ và bé. 🌙',
  'Bấm "Sáng tác truyện" để cùng bé tạo một câu chuyện mới nhé! 🪄',
  'Ba mẹ xem 5 năng lực cảm xúc của bé ở tab "Tiến độ" nhé. 🌱',
  'Muốn bé tự đọc? Chọn "Chế độ Bé" — ba mẹ cần mã PIN để thoát ra. 🔒',
  'Cú Lu Lu luôn ở đây cùng ba mẹ và bé dệt nên những câu chuyện đẹp! 🦉',
];

export const CuteMascot: React.FC<CuteMascotProps> = ({ speechText, onTalk, style, mascotState = 'idle' }) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [override, setOverride] = useState(speechText);
  const bubbleOpacity = useSharedValue(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleMascotPress = () => {
    bubbleOpacity.value = withSequence(withSpring(0, { damping: 12, stiffness: 200 }), withSpring(1, { damping: 12, stiffness: 200 }));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setOverride(undefined);
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 150);
    onTalk?.();
  };

  const bubbleAnimStyle = useAnimatedStyle(() => ({ opacity: bubbleOpacity.value }));
  const text = override ?? TIPS[tipIndex];

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.bubbleWrapper, bubbleAnimStyle]}>
        <View style={styles.bubble} accessibilityLiveRegion="polite">
          <Text style={styles.bubbleText}>{text}</Text>
        </View>
        {/* Đuôi bong bóng trỏ về phía cú (trang trí) */}
        <View style={styles.bubbleTail} importantForAccessibility="no" accessibilityElementsHidden />
      </Animated.View>

      <OwlMascot state={mascotState} size={72} onPress={handleMascotPress} accessibilityLabel="Cú Lu Lu. Chạm để nghe lời gợi ý khác" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.sm, paddingHorizontal: Spacing.xs },
  bubbleWrapper: { flex: 1, marginRight: 14, position: 'relative' },
  bubble: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.outline,
    ...Elevation.low,
  },
  bubbleTail: {
    position: 'absolute',
    right: -10,
    top: '50%',
    marginTop: -8,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderLeftWidth: 10,
    borderLeftColor: Colors.surface,
  },
  // navy trên trắng 14:1; cỡ 14 (trước 12.5)
  bubbleText: { ...Typography.body, fontSize: 14, lineHeight: 20, color: Colors.text },
});
