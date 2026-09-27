// apps/mobile/src/components/HeyTopBar.tsx — v2.0 Fairy Garden
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { UserAccount, Role } from '../../../../packages/shared-types';
import { Colors } from '../theme/colors';

interface HeyTopBarProps {
  currentUser: UserAccount;
  activeRole?: Role;
  onRoleChange?: (role: Role) => void;
  onOpenAuth: (defaultTab?: 'LOGIN' | 'REGISTER' | 'PROFILE') => void;
  onOpenWallet: () => void;
  onOpenKidMode?: () => void;
}

export const HeyTopBar: React.FC<HeyTopBarProps> = ({
  currentUser,
  onOpenAuth,
  onOpenWallet,
}) => {
  const logoScale = useSharedValue(1);

  const handleLogoPress = () => {
    logoScale.value = withSpring(1.18, { damping: 8, stiffness: 200 }, () => {
      logoScale.value = withSpring(1, { damping: 12, stiffness: 150 });
    });
  };

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>

        {/* Brand Logo */}
        <TouchableOpacity onPress={handleLogoPress} activeOpacity={0.9}>
          <Animated.View style={[styles.logoBadge, logoStyle]}>
            <Text style={styles.logoEmoji}>🐶</Text>
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.brandInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.brandTitle}>StoryWeaver</Text>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>Bé Yêu</Text>
            </View>
          </View>
          <Text style={styles.brandSubtitle}>Cổ tích diệu kỳ của bé 🌸</Text>
        </View>

        {/* Right actions */}
        <View style={styles.rightActions}>
          {/* Star badge */}
          <View style={styles.starBadge}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={styles.starCount}>12</Text>
          </View>

          {/* Credits pill */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onOpenWallet}
            style={styles.creditPill}
          >
            <Text style={styles.creditIcon}>💎</Text>
            <Text style={styles.creditCount}>{currentUser?.creditBalance || 0}</Text>
            <View style={styles.plusBadge}>
              <Text style={styles.plusText}>+</Text>
            </View>
          </TouchableOpacity>

          {/* Avatar */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onOpenAuth('PROFILE')}
            style={styles.avatarButton}
          >
            <Image
              source={{
                uri:
                  currentUser?.avatarUrl ||
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
              }}
              style={styles.avatarImage}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    boxShadow: '0 4px 12px rgba(107, 203, 119, 0.10)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    boxShadow: '0 4px 8px rgba(255, 217, 61, 0.28)',
  },
  logoEmoji: {
    fontSize: 22,
  },
  brandInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  tagBadge: {
    backgroundColor: Colors.secondaryLight,
    borderWidth: 1,
    borderColor: 'rgba(107, 203, 119, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  tagText: {
    fontSize: 8,
    fontWeight: '900',
    color: Colors.secondaryDark,
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.borderSunshine,
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  starIcon: {
    fontSize: 11,
    marginRight: 3,
  },
  starCount: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textOnYellow,
  },
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.borderSky,
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  creditIcon: {
    fontSize: 12,
    marginRight: 3,
  },
  creditCount: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.accentDark,
    marginRight: 4,
  },
  plusBadge: {
    backgroundColor: Colors.accent,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    marginTop: -1,
  },
  avatarButton: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.borderMedium,
    overflow: 'hidden',
    boxShadow: '0 2px 6px rgba(107, 203, 119, 0.25)',
  },
  avatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
});
