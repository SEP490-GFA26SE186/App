// apps/mobile/src/components/HeyTabBar.tsx — v2.0 Floating Pill Design
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { soundFX } from '../../../../src/utils/sound-fx';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeyTabBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenKidMode: () => void;
}

const tabs = [
  { id: 'HOME',   label: 'Trang chủ', icon: '🌱' },
  { id: 'MARKET', label: 'Tủ truyện', icon: '📚' },
  { id: 'CREATE', label: 'Sáng tác',  icon: '🪄', highlight: true },
  { id: 'EQ',     label: 'Tiến độ',   icon: '⭐' },
  { id: 'WALLET', label: 'Ví Sao',    icon: '💎' },
];

const AnimatedTabItem: React.FC<{
  tab: typeof tabs[0];
  isActive: boolean;
  onPress: () => void;
}> = ({ tab, isActive, onPress }) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    soundFX.playPop();
    scale.value = withSpring(0.88, { damping: 8, stiffness: 220 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 160 });
    });
    onPress();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.tabInner, animStyle]}>
        {/* Active indicator pill */}
        {isActive && <View style={styles.activeIndicator} />}

        <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
          {tab.icon}
        </Text>
        <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}>
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const HeyTabBar: React.FC<HeyTabBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenKidMode,
}) => {
  return (
    <View style={styles.outerWrapper}>
      {/* Floating pill tab bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;

          if (tab.highlight) {
            // CTA floating button — vươn lên trên tab bar
            return (
              <View key={tab.id} style={styles.highlightWrapper}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    soundFX.playSparkle();
                    onSelectTab(tab.id);
                  }}
                  style={[
                    styles.highlightCircle,
                    isActive && styles.highlightCircleActive,
                  ]}
                >
                  <Text style={styles.highlightIcon}>{tab.icon}</Text>
                </TouchableOpacity>
                <Text style={[
                  styles.highlightLabel,
                  isActive && styles.highlightLabelActive,
                ]}>
                  {tab.label}
                </Text>
              </View>
            );
          }

          return (
            <AnimatedTabItem
              key={tab.id}
              tab={tab}
              isActive={isActive}
              onPress={() => onSelectTab(tab.id)}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    // Padding để tab bar không chạm sát cạnh màn hình
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    // Floating pill design — KHÔNG có borderTopWidth
    borderRadius: 32,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 4,
    boxShadow: '0 -4px 20px rgba(184, 196, 216, 0.18)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 16,
    minWidth: 50,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    bottom: 0,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    zIndex: 0,
  },
  tabIcon: {
    fontSize: 19,
    marginBottom: 2,
    zIndex: 1,
  },
  tabIconActive: {
    // Scale up icon khi active
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    zIndex: 1,
  },
  tabLabelActive: {
    color: Colors.primaryText,
    fontWeight: '900',
    fontSize: 10,
  },
  tabLabelInactive: {
    color: Colors.textSecondary,
  },

  // Highlight "Sáng tác" button — floating above
  highlightWrapper: {
    alignItems: 'center',
    marginTop: -22, // Nổi lên phía trên tab bar
  },
  highlightCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 12px rgba(245, 196, 0, 0.40)',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  highlightCircleActive: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 1.06 }],
  },
  highlightIcon: {
    fontSize: 24,
  },
  highlightLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginTop: 3,
  },
  highlightLabelActive: {
    color: Colors.primaryText,
  },
});
