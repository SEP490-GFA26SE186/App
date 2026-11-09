// apps/mobile/src/screens/parent/market/MarketplaceScreen.tsx
// GĐ D2 – Chợ truyện (Web MarketplacePage): tìm kiếm + lọc năng lực / tuổi / giá / giọng đọc + sắp xếp, danh sách thẻ có bìa,
// "Tải thêm" theo trang của BE (8 truyện/trang). Dữ liệu chỉ từ GET /market/listings; đổi bộ lọc là tải lại từ trang 1.
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { HeyButton } from '../../../components/ui/HeyButton';
import { HeyInput } from '../../../components/ui/HeyInput';
import { StateView } from '../../../components/ui/StateView';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { FilterChips } from '../../../components/management/ManagementUi';
import { ListingCard } from '../../../components/market/MarketUi';
import { Colors } from '../../../theme/colors';
import { Spacing } from '../../../theme/spacing';
import { Typography } from '../../../theme/typography';
import { marketService } from '../../../services/marketService';
import {
  AGE_OPTIONS,
  COMPETENCY_OPTIONS,
  DEFAULT_MARKET_FILTERS,
  MarketFilters,
  NARRATION_OPTIONS,
  PRICE_OPTIONS,
  SORT_OPTIONS,
  listingQuery,
} from '../../../utils/market';
import type { ListingCardDto } from '../../../types/market';

const SEARCH_DELAY_MS = 400; // như useDebounce của Web

export const MarketplaceScreen: React.FC<{ onBack: () => void; onOpenListing: (listingId: string) => void }> = ({ onBack, onOpenListing }) => {
  const [filters, setFilters] = useState<MarketFilters>(DEFAULT_MARKET_FILTERS);
  const [searchText, setSearchText] = useState('');
  const [items, setItems] = useState<ListingCardDto[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const reqId = useRef(0);

  // Chờ người dùng gõ xong rồi mới tìm
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.search === searchText ? f : { ...f, search: searchText })), SEARCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [searchText]);

  const load = async (next: number) => {
    const id = ++reqId.current; // bộ lọc đổi giữa chừng → bỏ kết quả cũ
    setStatus('loading');
    try {
      const res = await marketService.listListings(listingQuery(filters, next));
      if (id !== reqId.current) return;
      setItems((prev) => (next === 1 ? res.items : [...prev, ...res.items]));
      setPage(next);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
      setStatus('ready');
    } catch (e: any) {
      if (id !== reqId.current) return;
      setError(e?.message || 'Không tải được chợ truyện.');
      setStatus('error');
    }
  };
  useEffect(() => {
    setItems([]);
    void load(1);
    return () => {
      reqId.current++;
    };
  }, [filters]);

  const set = <K extends keyof MarketFilters>(k: K) => (v: MarketFilters[K]) => setFilters((f) => ({ ...f, [k]: v }));
  const filtered = JSON.stringify({ ...filters, search: '' }) !== JSON.stringify({ ...DEFAULT_MARKET_FILTERS, search: '' }) || !!filters.search;
  const reset = () => {
    setSearchText('');
    setFilters(DEFAULT_MARKET_FILTERS);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Chợ truyện"
        subtitle="Truyện từ các gia đình khác. Mọi truyện đều được chuyên gia duyệt từng trang trước khi đăng bán; mua xong, đưa lên giá sách để bé đọc."
        onBack={onBack}
      />
      <HeyInput placeholder="Tìm theo tên truyện, bài học, người bán..." value={searchText} onChangeText={setSearchText} />
      <FilterChips label="Năng lực" options={COMPETENCY_OPTIONS} value={filters.competency} onChange={set('competency')} />
      <FilterChips label="Độ tuổi" options={AGE_OPTIONS} value={filters.age} onChange={set('age')} />
      <FilterChips label="Giá" options={PRICE_OPTIONS} value={filters.price} onChange={set('price')} />
      <FilterChips label="Giọng đọc" options={NARRATION_OPTIONS} value={filters.narration} onChange={set('narration')} />
      <FilterChips label="Sắp xếp" options={SORT_OPTIONS} value={filters.sort} onChange={set('sort')} />

      <Text style={styles.sectionTitle} accessibilityRole="header">
        Truyện đang bán{status === 'ready' || items.length ? ` · ${total}` : ''}
      </Text>
      {items.map((l) => (
        <ListingCard key={l.id} listing={l} onOpen={() => onOpenListing(l.id)} />
      ))}
      {status === 'loading' && <StateView variant="skeleton" title="Đang tải chợ truyện..." />}
      {status === 'error' && <StateView variant="error" title="Không tải được chợ truyện" description={error} actionLabel="Thử lại" onAction={() => void load(page + 1)} />}
      {status === 'ready' && !items.length && (
        <StateView
          variant="empty"
          title={filtered ? 'Chưa có truyện phù hợp với bộ lọc' : 'Chợ truyện chưa có truyện nào'}
          actionLabel={filtered ? 'Xóa bộ lọc' : undefined}
          onAction={filtered ? reset : undefined}
        />
      )}
      {status === 'ready' && page < totalPages && (
        <HeyButton title={`Tải thêm (${items.length}/${total})`} variant="tertiary" onPress={() => void load(page + 1)} />
      )}
      <View style={styles.bottom} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: Spacing.page, paddingBottom: Spacing.xxxl, gap: Spacing.sm },
  sectionTitle: { ...Typography.heading, color: Colors.text, marginTop: Spacing.sm },
  bottom: { height: Spacing.md },
});
