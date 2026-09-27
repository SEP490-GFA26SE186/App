// apps/mobile/src/components/CuteMascot.tsx — v2.0 Fairy Garden
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { ShibaMascot, ShibaState } from './ShibaMascot';
import { Colors } from '../theme/colors';

interface CuteMascotProps {
  name?: string;
  level?: string;
  speechText?: string;
  onTalk?: () => void;
  style?: ViewStyle;
  shibaState?: ShibaState;
}

const TIPS = [
  'Gâu gâu! Hôm nay bé muốn cùng Lu Lu phiêu lưu câu chuyện nào nè? ✨',
  'Đọc 1 câu chuyện trước khi ngủ giúp bé ngủ ngon và nuôi dưỡng tâm hồn! 🌙',
  'Bé đã thu thập được 12 ⭐ sao rồi! Cố lên nhé! 🎉',
  'Nhấn vào "Sáng Tác AI" để hoá thân bé thành dũng sĩ tí hon nào! 🪄',
  'Cún Lu Lu luôn ở đây cùng bé và ba mẹ dệt nên những ước mơ đẹp nhất! 🐶',
  'Hoa trong vườn cổ tích đang chờ bé đến thăm... 🌸',
];

export const CuteMascot: React.FC<CuteMascotProps> = ({
  name = 'Cún Lu Lu',
  level = 'Tân Binh',
  speechText,
  onTalk,
  style,
  shibaState = 'idle',
}) => {
  const [currentBubble, setCurrentBubble] = useState(speechText || TIPS[0]);
  const [tipIndex, setTipIndex] = useState(0);
  const bubbleScale = useSharedValue(1);
  const bubbleOpacity = useSharedValue(1);

  const handleMascotPress = () => {
    // Bubble text change với fade animation
    bubbleOpacity.value = withSequence(
      withSpring(0, { damping: 12, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );

    setTimeout(() => {
      const next = (tipIndex + 1) % TIPS.length;
      setTipIndex(next);
      setCurrentBubble(TIPS[next]);
    }, 150);

    if (onTalk) onTalk();
  };

  const bubbleAnimStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [{ scale: bubbleScale.value }],
  }));

  return (
    <View style={[styles.container, style]}>
      {/* Speech Bubble — bên trái */}
      <Animated.View style={[styles.bubbleWrapper, bubbleAnimStyle]}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{currentBubble}</Text>
        </View>
        {/* Bubble tail trỏ về phía mascot */}
        <View style={styles.bubbleTail} />
      </Animated.View>

      {/* Shiba Mascot */}
      <ShibaMascot
        state={shibaState}
        size={72}
        onPress={handleMascotPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  bubbleWrapper: {
    flex: 1,
    marginRight: 14,
    position: 'relative',
  },
  bubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    boxShadow: '0 4px 12px rgba(107, 203, 119, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(107, 203, 119, 0.25)',
  },
  bubbleTail: {
    position: 'absolute',
    right: -10,
    top: '50%',
    marginTop: -5,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderLeftWidth: 10,
    borderLeftColor: '#FFFFFF',
  },
  bubbleText: {
    fontSize: 12.5,
    color: Colors.textPrimary,
    lineHeight: 18,
    fontWeight: '600',
  },
});
