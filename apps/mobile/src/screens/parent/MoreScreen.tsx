// apps/mobile/src/screens/parent/MoreScreen.tsx
// B11 – Hồ sơ (R3: tab "Hồ sơ" trên thanh tab; trước là menu "Thêm"): lối vào các màn ngoài thanh tab, chia nhóm
// Gia đình / Tài khoản / An toàn trẻ em / Hỗ trợ. Ví & Credit nằm ở nhóm Tài khoản (và ở pill credit trên header).
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { Badge } from '../../components/ui/Badge';
import { Icon, IconName } from '../../components/ui/Icon';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { SessionUser } from '../../types/sessionUser';

export interface MoreMenuItem {
  key: string;
  icon: IconName;
  title: string;
  description: string;
  onPress: () => void;
  /** Tên nhóm hiển thị làm tiêu đề phần; các mục liên tiếp cùng nhóm xếp chung một phần */
  group: string;
  /** Nhãn trạng thái (vd SCOPE PENDING) */
  badge?: string;
  /** Nhấn mạnh (vd lối vào Chế độ Bé) */
  highlight?: boolean;
}

interface MoreScreenProps {
  currentUser: SessionUser;
  items: MoreMenuItem[];
  onLogout: () => void;
  /** Chỉ truyền khi không phải tab gốc (Hồ sơ là tab nên thường không có nút quay lại) */
  onBack?: () => void;
}

const groupItems = (items: MoreMenuItem[]) => {
  const groups: { name: string; items: MoreMenuItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.name === item.group) last.items.push(item);
    else groups.push({ name: item.group, items: [item] });
  }
  return groups;
};

export const MoreScreen: React.FC<MoreScreenProps> = ({ currentUser, items, onLogout, onBack }) => (
  <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <ScreenHeader title="Hồ sơ" onBack={onBack} />

    <HeyCard variant="accent" style={styles.userCard}>
      <Text style={styles.userName} numberOfLines={2}>
        {currentUser.fullName}
      </Text>
      <Text style={styles.userEmail} numberOfLines={1}>
        {currentUser.email}
      </Text>
    </HeyCard>

    {groupItems(items).map((group) => (
      <View key={group.name} style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {group.name}
        </Text>
        {group.items.map((item) => (
          <Pressable
            key={item.key}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.description}`}
            style={(s) => [s.pressed && styles.pressed, focusRing(s), styles.itemPressable]}
          >
            <HeyCard variant={item.highlight ? 'accent' : 'surface'} style={styles.item}>
              <View style={[styles.iconCircle, item.highlight && styles.iconCircleHighlight]}>
                <Icon name={item.icon} size={22} color={item.highlight ? Colors.onStrong : Colors.brandStrong} />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
                {!!item.badge && <Badge label={item.badge} tone="warning" />}
              </View>
              <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
            </HeyCard>
          </Pressable>
        ))}
      </View>
    ))}

    <HeyButton title="Đăng xuất" iconName="log-out-outline" variant="tertiary" onPress={onLogout} style={styles.logout} />
  </ScrollView>
);

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  userCard: { marginBottom: Spacing.lg, gap: 2 },
  userName: { ...Typography.heading, color: Colors.text },
  userEmail: { ...Typography.caption, color: Colors.textMuted },
  section: { marginBottom: Spacing.sm },
  // textMuted trên canvas 6.3:1
  sectionTitle: { ...Typography.caption, fontFamily: FontFamily.extraBold, color: Colors.textMuted, marginBottom: Spacing.sm, marginTop: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.6 },
  itemPressable: { borderRadius: Radius.lg, marginBottom: 10 },
  pressed: { opacity: 0.75 },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brandTint, alignItems: 'center', justifyContent: 'center' },
  iconCircleHighlight: { backgroundColor: Colors.tealStrong },
  itemText: { flex: 1, gap: 2 },
  itemTitle: { ...Typography.bodyStrong, color: Colors.text },
  itemDesc: { ...Typography.caption, color: Colors.textMuted },
  logout: { marginTop: Spacing.sm },
});
