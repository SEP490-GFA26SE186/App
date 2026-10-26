// apps/mobile/src/screens/parent/MoreScreen.tsx
// B11 – Menu "Thêm" (App_v2: (tabs)/more): lối vào các màn hình ngoài thanh tab.
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { Badge } from '../../components/ui/Badge';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Colors } from '../../theme/colors';
import { SessionUser } from '../../types/sessionUser';

export interface MoreMenuItem {
  key: string;
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  /** Nhãn trạng thái (vd SCOPE PENDING) */
  badge?: string;
}

interface MoreScreenProps {
  currentUser: SessionUser;
  items: MoreMenuItem[];
  onLogout: () => void;
  onBack: () => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ currentUser, items, onLogout, onBack }) => (
  <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <ScreenHeader title="Thêm" onBack={onBack} />

    <HeyCard variant="mint" style={styles.userCard}>
      <Text style={styles.userName}>{currentUser.fullName}</Text>
      <Text style={styles.userEmail}>{currentUser.email}</Text>
    </HeyCard>

    {items.map((item) => (
      <TouchableOpacity key={item.key} activeOpacity={0.8} onPress={item.onPress}>
        <HeyCard style={styles.item}>
          <Text style={styles.itemIcon}>{item.icon}</Text>
          <View style={styles.itemText}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemDesc}>{item.description}</Text>
            {!!item.badge && <Badge label={item.badge} tone="warning" />}
          </View>
          <Text style={styles.chevron}>›</Text>
        </HeyCard>
      </TouchableOpacity>
    ))}

    <HeyButton title="🚪 Đăng xuất" variant="outline" onPress={onLogout} style={styles.logout} />
  </ScrollView>
);

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  userCard: { marginBottom: 14, gap: 2 },
  userName: { fontSize: 17, fontWeight: '900', color: Colors.textPrimary },
  userEmail: { fontSize: 12, color: Colors.textSecondary },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  itemIcon: { fontSize: 28 },
  itemText: { flex: 1, gap: 2 },
  itemTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  itemDesc: { fontSize: 12, color: Colors.textSecondary },
  chevron: { fontSize: 24, color: Colors.textSecondary },
  logout: { marginTop: 8 },
});
