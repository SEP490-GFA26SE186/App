// apps/mobile/src/components/parent/HeyTopBar.tsx — R3: thanh đầu màn Parent theo Design System R1/R2.
// Logo cú (về Trang chủ) · tên app · pill Credit (số dư thật từ BE, chạm → Ví) · avatar (chạm → Hồ sơ).
// Vùng chạm >= 44pt, icon vector, không còn nhãn 8px; chữ dài được cắt gọn thay vì đẩy nút ra ngoài màn.
import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Role } from '../../types/domain';
import { SessionUser } from '../../types/sessionUser';
import { Colors } from '../../theme/colors';
import { Radius, Touch } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { MASCOT_IMAGE } from '../../constants/mascot';
import { Icon } from '../ui/Icon';

interface HeyTopBarProps {
  currentUser: SessionUser;
  activeRole?: Role;
  onRoleChange?: (role: Role) => void;
  /** Mở Hồ sơ (hồ sơ bé, nhân vật, ví, cài đặt, trợ giúp, đăng xuất) */
  onOpenMenu: () => void;
  onOpenWallet: () => void;
  /** Về Trang chủ (chạm logo) */
  onGoHome?: () => void;
  onOpenKidMode?: () => void;
}

// Giới hạn phóng chữ hệ thống ở header để số credit/tên app không đẩy nút ra khỏi màn hình
const MAX_SCALE = 1.3;

export const HeyTopBar: React.FC<HeyTopBarProps> = ({ currentUser, onOpenMenu, onOpenWallet, onGoHome }) => {
  const balance = currentUser?.creditBalance;
  const name = (currentUser?.fullName || '').trim();
  const initial = (name || '?').charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable
          onPress={onGoHome}
          disabled={!onGoHome}
          accessibilityRole="button"
          accessibilityLabel="StoryWeaver, về Trang chủ"
          style={(s) => [styles.logoBtn, s.pressed && styles.pressed, focusRing(s)]}
        >
          <Image source={MASCOT_IMAGE} style={styles.logoImage} accessibilityIgnoresInvertColors />
        </Pressable>

        <View style={styles.brand} accessibilityRole="header">
          <Text style={styles.brandTitle} numberOfLines={1} maxFontSizeMultiplier={MAX_SCALE}>
            StoryWeaver
          </Text>
          <Text style={styles.brandSubtitle} numberOfLines={1} maxFontSizeMultiplier={MAX_SCALE}>
            Cổ tích diệu kỳ của bé
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={onOpenWallet}
              accessibilityRole="button"
            accessibilityLabel={balance == null ? 'Số dư credit chưa tải. Mở ví credit' : `Số dư ${balance} credit. Mở ví credit`}
            style={(s) => [styles.creditPill, s.pressed && styles.pressed, focusRing(s)]}
          >
            <Icon name="diamond" size={18} color={Colors.tealStrong} />
            <Text style={styles.creditCount} maxFontSizeMultiplier={MAX_SCALE}>
              {balance == null ? '—' : String(balance)}
            </Text>
            <Icon name="chevron-forward" size={14} color={Colors.tealStrong} />
          </Pressable>

          <Pressable
            onPress={onOpenMenu}
              accessibilityRole="button"
            accessibilityLabel={name ? `Hồ sơ của ${name}` : 'Hồ sơ'}
            style={(s) => [styles.avatarBtn, s.pressed && styles.pressed, focusRing(s)]}
          >
            {currentUser?.avatarUrl ? (
              <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatarImage} accessibilityIgnoresInvertColors />
            ) : (
              <View style={[styles.avatarImage, styles.avatarFallback]}>
                <Text style={styles.avatarInitial} maxFontSizeMultiplier={MAX_SCALE}>
                  {initial}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const BTN = Touch.min; // 44pt thật (Web không áp dụng hitSlop nên không bù bằng hitSlop)

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outline,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  // Header rộng đủ như nội dung màn (R9 sẽ giới hạn bề rộng cả hai cùng lúc; hiện chỉ thanh tab nổi được căn giữa)
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pressed: { opacity: 0.7 },
  logoBtn: { width: BTN, height: BTN, borderRadius: BTN / 2 },
  logoImage: { width: BTN, height: BTN, borderRadius: BTN / 2 },
  brand: { flex: 1, minWidth: 0, overflow: 'hidden' },
  brandTitle: { ...Typography.heading, fontFamily: FontFamily.displayBold, fontSize: 17, lineHeight: 22, color: Colors.text },
  brandSubtitle: { ...Typography.caption, color: Colors.textMuted },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: BTN,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.tealTint,
    borderWidth: 1,
    borderColor: Colors.outline,
  },
  // tealDeep trên tealTint ≈ 6:1. Không cắt số dư (cắt sẽ hiển thị sai số); chữ thương hiệu bên trái nhường chỗ trước
  creditCount: { ...Typography.button, fontSize: 15, color: Colors.tealDeep },
  avatarBtn: { width: BTN, height: BTN, borderRadius: BTN / 2, borderWidth: 2, borderColor: Colors.outline, overflow: 'hidden' },
  avatarImage: { width: BTN - 4, height: BTN - 4, borderRadius: (BTN - 4) / 2 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.brandTint },
  avatarInitial: { fontFamily: FontFamily.displayBold, fontSize: 17, color: Colors.brandInk },
});
