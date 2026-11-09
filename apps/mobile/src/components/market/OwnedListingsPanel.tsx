// apps/mobile/src/components/market/OwnedListingsPanel.tsx
// GĐ D2 – Tủ truyện › "Đã mua": truyện phụ huynh có quyền đọc từ Chợ truyện (GET /market/owned), nhãn "Mua từ chợ".
// Chạm thẻ → chi tiết truyện (đưa lên tủ sách từng bé ở đó). GET /stories chỉ có truyện tự tạo nên cần danh sách riêng này.
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { StateView } from '../ui/StateView';
import { Badge } from '../ui/Badge';
import { ListingCard } from './MarketUi';
import { Spacing } from '../../theme/spacing';
import { marketService } from '../../services/marketService';
import { useAsyncResource } from '../../utils/useAsyncResource';

export const OwnedListingsPanel: React.FC<{ header: React.ReactElement; onOpenListing: (listingId: string) => void; onOpenMarket: () => void }> = ({
  header,
  onOpenListing,
  onOpenMarket,
}) => {
  const res = useAsyncResource(() => marketService.listOwned(), []);
  const items = res.data ?? [];
  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={header}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Badge label="Mua từ chợ" tone="info" />
          <ListingCard listing={item} onOpen={() => onOpenListing(item.id)} />
        </View>
      )}
      ListEmptyComponent={
        res.status === 'loading' ? (
          <StateView variant="skeleton" title="Đang tải truyện đã mua..." />
        ) : res.status === 'error' ? (
          <StateView variant="error" title="Chưa tải được truyện đã mua" description={res.error ?? ''} actionLabel="Thử lại" onAction={() => void res.reload()} />
        ) : (
          <StateView variant="empty" title="Ba mẹ chưa mua truyện nào" description="Truyện mua hoặc nhận miễn phí trên Chợ truyện sẽ hiện ở đây." actionLabel="Xem Chợ truyện" onAction={onOpenMarket} />
        )
      }
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  content: { padding: Spacing.page, paddingBottom: Spacing.xxxl },
  item: { gap: Spacing.xs, alignItems: 'flex-start' },
  sep: { height: Spacing.md },
});
