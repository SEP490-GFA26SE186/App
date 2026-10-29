// apps/mobile/src/components/parent/ChildShelfPanel.tsx
// Phase 1 – chế độ "Tủ sách của bé" trong Tủ truyện: GET /bookshelf?childId&status&page (phân trang, tải thêm)
// và gỡ truyện khỏi giá của đúng bé đang chọn: DELETE /bookshelf/:storyId?childId (có xác nhận; truyện gốc và lịch sử đọc giữ nguyên).
import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, ScrollView, StyleSheet } from 'react-native';
import { ChildProfile } from '../../types/domain';
import { HeyButton } from '../ui/HeyButton';
import { HeyChip } from '../ui/HeyChip';
import { StateView } from '../ui/StateView';
import { useDialog } from '../ui/Dialog';
import { useToast } from '../ui/Toast';
import { ShelfItemRow } from './ShelfItemRow';
import { Spacing } from '../../theme/spacing';
import { storyService } from '../../services';
import { useAsyncResource } from '../../utils/useAsyncResource';
import type { ShelfItemDto, ShelfStatus } from '../../types/api';

const PAGE_SIZE = 20;
const STATUS_FILTERS: { value: ShelfStatus; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'reading', label: 'Đang đọc' },
  { value: 'completed', label: 'Đã đọc xong' },
  { value: 'not_started', label: 'Chưa đọc' },
];

interface ChildShelfPanelProps {
  child?: ChildProfile;
  header: React.ReactElement;
  onOpenStory: (storyId: string) => void;
}

export const ChildShelfPanel: React.FC<ChildShelfPanelProps> = ({ child, header, onOpenStory }) => {
  const dialog = useDialog();
  const toast = useToast();
  const childId = child?.id;
  const [status, setStatus] = useState<ShelfStatus>('all');
  const res = useAsyncResource(
    () => (childId ? storyService.getBookshelf(childId, { status, limit: PAGE_SIZE }) : Promise.resolve(null)),
    [childId, status]
  );
  // Trang 2+ nối sau trang 1; nạp lại trang 1 (đổi bé/bộ lọc, sau khi gỡ) thì bỏ phần đã nối
  const [extra, setExtra] = useState<ShelfItemDto[]>([]);
  const [page, setPage] = useState(1);
  const [moreBusy, setMoreBusy] = useState(false);
  const gen = useRef(0);
  useEffect(() => {
    gen.current += 1;
    setExtra([]);
    setPage(1);
  }, [res.data]);

  const [removingId, setRemovingId] = useState<string | null>(null);
  const removingRef = useRef(false);

  const items = res.data ? [...res.data.items, ...extra] : [];
  const total = res.data?.pagination.total ?? 0;

  const loadMore = async () => {
    if (!childId || moreBusy) return;
    const g = gen.current;
    setMoreBusy(true);
    try {
      const next = await storyService.getBookshelf(childId, { status, limit: PAGE_SIZE, page: page + 1 });
      if (g !== gen.current) return;
      setExtra((prev) => [...prev, ...next.items]);
      setPage(page + 1);
    } catch (e: any) {
      void dialog.notify('Chưa tải thêm được', e?.message || 'Vui lòng thử lại.');
    } finally {
      setMoreBusy(false);
    }
  };

  const remove = async (item: ShelfItemDto) => {
    if (!child || removingRef.current) return;
    const ok = await dialog.confirm({
      title: `Gỡ “${item.title}” khỏi tủ sách của ${child.name}?`,
      message: 'Bé sẽ không thấy truyện này trong Chế độ Bé nữa. Truyện gốc và lịch sử đọc vẫn được giữ.',
      confirmLabel: 'Gỡ khỏi tủ',
      destructive: true,
    });
    if (!ok) return;
    removingRef.current = true;
    setRemovingId(item.storyId);
    try {
      await storyService.removeFromShelf(child.id, item.storyId);
      toast.show(`Đã gỡ “${item.title}” khỏi tủ sách của ${child.name}.`);
    } catch (e: any) {
      void dialog.notify('Chưa gỡ được', e?.message || 'Vui lòng thử lại.');
    } finally {
      removingRef.current = false;
      setRemovingId(null);
      void res.reload(); // 404 (đã gỡ ở nơi khác) cũng cần làm mới danh sách
    }
  };

  const listHeader = (
    <View style={styles.header}>
      {header}
      {!!child && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {STATUS_FILTERS.map((f) => (
            <HeyChip key={f.value} label={f.label} selected={status === f.value} onPress={() => setStatus(f.value)} />
          ))}
        </ScrollView>
      )}
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (!child) {
    empty = <StateView variant="empty" title="Chưa có hồ sơ bé" description="Thêm hồ sơ bé (Hồ sơ → Bé nhà mình) để có tủ sách riêng." />;
  } else if (res.status === 'loading') {
    empty = <StateView variant="skeleton" title="Đang tải tủ sách..." />;
  } else if (res.status === 'error') {
    empty = <StateView variant="error" title="Không tải được tủ sách" description={res.error ?? ''} actionLabel="Thử lại" onAction={() => void res.reload()} />;
  } else if (items.length === 0) {
    empty = (
      <StateView
        variant="empty"
        title={status === 'all' ? `Tủ sách của ${child.name} đang trống` : 'Không có truyện ở mục này'}
        description={status === 'all' ? 'Mở một truyện đã hoàn tất và chọn “Thêm vào tủ sách”.' : 'Thử chọn mục khác nhé.'}
      />
    );
  }

  return (
    <FlatList
      data={res.status === 'ready' ? items : []}
      keyExtractor={(i) => i.storyId}
      contentContainerStyle={styles.content}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={empty}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      renderItem={({ item }) => (
        <ShelfItemRow
          item={item}
          onOpen={item.kind === 'private' ? () => onOpenStory(item.storyId) : undefined}
          action={
            <HeyButton
              title="Gỡ"
              iconName="trash-outline"
              variant="tertiary"
              size="sm"
              accessibilityLabel={`Gỡ ${item.title} khỏi tủ sách của ${child?.name ?? 'bé'}`}
              loading={removingId === item.storyId}
              disabled={!!removingId}
              onPress={() => void remove(item)}
            />
          }
        />
      )}
      ListFooterComponent={
        res.status === 'ready' && items.length < total ? (
          <HeyButton title={`Tải thêm (${items.length}/${total})`} variant="tertiary" loading={moreBusy} onPress={() => void loadMore()} style={styles.more} />
        ) : null
      }
    />
  );
};

const styles = StyleSheet.create({
  content: { padding: Spacing.page, paddingBottom: Spacing.xxxl },
  header: { gap: Spacing.sm, marginBottom: Spacing.md },
  chips: { gap: Spacing.sm },
  sep: { height: Spacing.sm },
  more: { marginTop: Spacing.md },
});
