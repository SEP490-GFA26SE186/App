// apps/mobile/src/screens/parent/WalletScreen.tsx
// B10 – Gói dịch vụ & Credit, CHỈ XEM (Web: BillingPage). Số dư lấy từ BE (wallet.creditBalance), chưa biết → "—".
// Không có nạp credit (BE không có endpoint – B4), không có rút tiền (Seller = SCOPE PENDING), không thanh toán,
// không lịch sử giả. Danh sách gói/lịch sử credit chờ API (C12).
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Colors } from '../../theme/colors';
import { SessionUser } from '../../types/sessionUser';

interface WalletScreenProps {
  currentUser: SessionUser;
  onRefreshWallet: () => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ currentUser, onRefreshWallet }) => (
  <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <ScreenHeader
      title="Gói dịch vụ & Credit"
      subtitle="Mỗi truyện AI viết giúp dùng credit theo độ dài. Truyện tự viết không dùng credit."
    />

    <View style={styles.summaryRow}>
      <HeyCard variant="yellow" style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Gói hiện tại</Text>
        <Text style={styles.summaryValue}>—</Text>
        <Text style={styles.summaryHint}>Chưa kết nối</Text>
      </HeyCard>
      <HeyCard variant="mint" style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Credit còn lại</Text>
        <Text style={styles.summaryValue}>💎 {currentUser.creditBalance ?? '—'}</Text>
        <Text style={styles.summaryHint}>
          {currentUser.creditBalance == null ? 'Chưa tải được số dư' : 'Từ tài khoản của ba mẹ'}
        </Text>
      </HeyCard>
    </View>

    <HeyButton title="🔄 Tải lại số dư" variant="outline" size="sm" onPress={onRefreshWallet} style={styles.refresh} />

    <HeyCard style={styles.card}>
      <Text style={styles.cardTitle}>Cách tính credit</Text>
      <Text style={styles.text}>
        • Credit được cấp mới mỗi tháng theo gói, phần còn dư không cộng dồn sang tháng sau.
      </Text>
      <Text style={styles.text}>• Truyện tự viết không dùng credit.</Text>
      <Text style={styles.text}>• Số credit cho từng độ dài truyện do máy chủ quy định.</Text>
    </HeyCard>

    <StateView
      variant="unsupported"
      title="Danh sách gói và lịch sử credit chưa được kết nối"
      description="Nâng cấp gói và thanh toán chưa được hỗ trợ trên ứng dụng. Ứng dụng không cho nạp hay rút tiền."
    />
  </ScrollView>
);

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  summaryCard: { flex: 1, gap: 2 },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary },
  summaryValue: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  summaryHint: { fontSize: 11, color: Colors.textSecondary },
  refresh: { alignSelf: 'flex-start', marginBottom: 12 },
  card: { marginBottom: 12, gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  text: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
});
