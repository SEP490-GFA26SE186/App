// apps/mobile/src/screens/parent/market/SellerProfileScreen.tsx
// GĐ D2 – Hồ sơ công khai người bán (Web SellerProfilePage): biệt danh, giới thiệu, kinh nghiệm, tổng lượt bán, điểm trung bình,
// số truyện đang bán, bán từ ngày; danh sách truyện đang bán (GET /market/sellers/:sellerId).
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../../components/ui/HeyCard';
import { Icon, IconName } from '../../../components/ui/Icon';
import { StateView } from '../../../components/ui/StateView';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { ListingCard } from '../../../components/market/MarketUi';
import { Colors } from '../../../theme/colors';
import { Spacing } from '../../../theme/spacing';
import { Typography } from '../../../theme/typography';
import { marketService } from '../../../services/marketService';
import { useAsyncResource } from '../../../utils/useAsyncResource';
import { formatDate, formatNumber } from '../../../utils/format';
import { ratingLabel } from '../../../utils/market';

const Stat: React.FC<{ icon: IconName; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
    <Icon name={icon} size={20} color={Colors.brandInk} />
    <View style={styles.flex1}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.strong}>{value}</Text>
    </View>
  </View>
);

export const SellerProfileScreen: React.FC<{ sellerId: string; onBack: () => void; onOpenListing: (listingId: string) => void }> = ({ sellerId, onBack, onOpenListing }) => {
  const res = useAsyncResource(() => marketService.getSellerProfile(sellerId), [sellerId]);
  const d = res.data;
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title={d?.seller.displayName ?? 'Người bán'} subtitle="Người bán trên Chợ truyện" onBack={onBack} />
      {res.status === 'loading' && !d && <StateView variant="skeleton" title="Đang tải hồ sơ người bán..." />}
      {res.status === 'error' && <StateView variant="error" title="Không tải được hồ sơ người bán" description={res.error ?? ''} actionLabel="Thử lại" onAction={() => void res.reload()} />}
      {d && (
        <>
          <HeyCard style={styles.card}>
            {!!d.seller.bio && <Text style={styles.body}>{d.seller.bio}</Text>}
            {!!d.seller.expertise && (
              <Text style={styles.body}>
                <Text style={styles.strong}>Kinh nghiệm: </Text>
                {d.seller.expertise}
              </Text>
            )}
            <Stat icon="cart-outline" label="Tổng lượt bán" value={formatNumber(d.seller.totalSales)} />
            <Stat icon="star-outline" label="Đánh giá trung bình" value={d.seller.ratingAvg == null ? 'Chưa có' : ratingLabel(d.seller.ratingAvg, d.seller.ratingCount)} />
            <Stat icon="book-outline" label="Truyện đang bán" value={formatNumber(d.seller.listingCount)} />
            <Stat icon="calendar-outline" label="Bán từ" value={formatDate(d.seller.sellingSince)} />
          </HeyCard>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Truyện của {d.seller.displayName}
          </Text>
          {d.items.length === 0 ? (
            <StateView variant="empty" title="Người bán chưa có truyện nào đang bán." />
          ) : (
            d.items.map((l) => <ListingCard key={l.id} listing={l} onOpen={() => onOpenListing(l.id)} />)
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: Spacing.page, paddingBottom: Spacing.xxxl, gap: Spacing.sm },
  card: { gap: Spacing.sm },
  stat: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex1: { flex: 1 },
  sectionTitle: { ...Typography.heading, color: Colors.text, marginTop: Spacing.md },
  body: { ...Typography.body, fontSize: 15, color: Colors.text },
  strong: { ...Typography.bodyStrong, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
});
