// apps/mobile/src/screens/parent/LibraryScreen.tsx
// B7 – Thư viện / tủ sách (Web: LibraryPage). Danh sách truyện của phụ huynh từ BE, lọc theo trạng thái + tìm theo tên.
// "Thêm vào tủ sách bé" gọi POST /bookshelf (C9); 422 = truyện chưa sẵn sàng, BE nêu lý do.
// R7: lưới bìa sạch (bìa là trọng tâm, cả thẻ là một nút mở truyện), bộ lọc dạng segmented, "Thêm vào tủ sách bé" nằm trong menu "⋯" của thẻ
// (và ở trang chi tiết) thay vì lặp một nút trên mọi thẻ. Dữ liệu/props/hành động giữ nguyên.
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { ChildProfile, Story } from '../../types/domain';
import { HeyInput } from '../../components/ui/HeyInput';
import { HeyButton } from '../../components/ui/HeyButton';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { Sheet } from '../../components/ui/Sheet';
import { StoryCover } from '../../components/ui/StoryCover';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ChildSwitcher } from '../../components/parent/ChildSwitcher';
import { Colors } from '../../theme/colors';
import { Radius, Spacing, Touch } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { STORY_FILTERS, STORY_STATUS_LABELS } from '../../constants/story';
import type { DataStatus } from '../../stores/useParentData';

interface LibraryScreenProps {
  stories: Story[];
  childrenProfiles: ChildProfile[];
  selectedChildId?: string;
  dataStatus: DataStatus;
  onSelectChild: (id: string) => void;
  onOpenStory: (story: Story) => void;
  onAddToShelf: (story: Story) => void;
  onCreateStory: () => void;
}

/** Số cột theo bề ngang cửa sổ (điện thoại 2, máy tính bảng 3, màn rộng 4); khung bề rộng tối đa thuộc R9. */
const columnsFor = (width: number) => (width >= 1000 ? 4 : width >= 640 ? 3 : 2);
const statusTone = (status?: string) => (status === 'READY' ? 'success' : status === 'GENERATING' ? 'info' : 'neutral');
const statusLabel = (status?: string) => (status && STORY_STATUS_LABELS[status]) || 'Truyện';

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  stories,
  childrenProfiles,
  selectedChildId,
  dataStatus,
  onSelectChild,
  onOpenStory,
  onAddToShelf,
  onCreateStory,
}) => {
  const { width } = useWindowDimensions();
  const cols = columnsFor(width);
  const [filter, setFilter] = useState<(typeof STORY_FILTERS)[number]['value']>('ALL');
  const [search, setSearch] = useState('');
  const [menuStory, setMenuStory] = useState<Story | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stories.filter(
      (s) => (filter === 'ALL' || s.status === filter) && (!q || s.title.toLowerCase().includes(q))
    );
  }, [stories, filter, search]);

  // Điền ô trống cho hàng cuối để thẻ cuối không giãn hết bề ngang
  const gridData = useMemo(() => {
    const pad = (cols - (visible.length % cols)) % cols;
    return [...visible, ...Array.from({ length: pad }, (_, i) => ({ id: `__pad${i}`, pad: true }))] as (Story | { id: string; pad: true })[];
  }, [visible, cols]);

  const loading = dataStatus === 'loading' && stories.length === 0;
  const selectedChild = childrenProfiles.find((c) => c.id === selectedChildId);

  const header = (
    <View style={styles.header}>
      <ScreenHeader
        title="Tủ truyện"
        subtitle={selectedChild ? `Truyện của gia đình · giá sách của ${selectedChild.name}` : 'Truyện của gia đình'}
      />
      <ChildSwitcher childrenProfiles={childrenProfiles} selectedId={selectedChildId} onSelect={onSelectChild} />
      <HeyInput placeholder="Tìm truyện theo tên..." value={search} onChangeText={setSearch} style={styles.search} />
      {/* Bộ lọc dạng segmented (chọn-một), thay cho 4 chip rời */}
      <View accessibilityRole="radiogroup" style={styles.segment}>
        {STORY_FILTERS.map((f) => {
          const on = filter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              aria-checked={on}
              accessibilityLabel={f.label}
              style={(s) => [styles.segItem, on && styles.segItemOn, s.pressed && styles.pressed, focusRing(s)]}
            >
              <Text style={[styles.segText, on && styles.segTextOn]} numberOfLines={2}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (loading) {
    empty = <StateView variant="skeleton" title="Đang tải truyện..." />;
  } else if (stories.length === 0) {
    empty =
      dataStatus === 'error' ? (
        <StateView
          variant="error"
          title="Không tải được danh sách truyện"
          description="Ba mẹ thử tải lại ở dải thông báo phía trên nhé."
        />
      ) : (
        <StateView
          variant="empty"
          title="Chưa có truyện nào"
          description="Tạo truyện đầu tiên cho bé ở tab Sáng tác."
          actionLabel="Sáng tác truyện"
          onAction={onCreateStory}
        />
      );
  } else if (visible.length === 0) {
    empty = <StateView variant="empty" title="Không có truyện phù hợp" description="Thử đổi bộ lọc hoặc từ khóa nhé." />;
  }

  return (
    <>
      <FlatList
        key={cols}
        data={gridData}
        keyExtractor={(s) => s.id}
        numColumns={cols}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) =>
          'pad' in item ? (
            <View style={styles.padCell} />
          ) : (
          <View style={styles.card}>
            <Pressable
              onPress={() => onOpenStory(item)}
              accessibilityRole="button"
              accessibilityLabel={`Mở truyện ${item.title}. ${statusLabel(item.status)}`}
              style={(s) => [styles.cardMain, s.pressed && styles.pressed, focusRing(s)]}
            >
              <StoryCover uri={item.coverImageUrl} style={styles.cover} />
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
            </Pressable>
            <View style={styles.cardFoot}>
              <Badge label={statusLabel(item.status)} tone={statusTone(item.status)} />
              <Pressable
                onPress={() => setMenuStory(item)}
                accessibilityRole="button"
                accessibilityLabel={`Thêm tùy chọn cho truyện ${item.title}`}
                style={(s) => [styles.moreBtn, s.pressed && styles.pressed, focusRing(s)]}
              >
                <Icon name="ellipsis-horizontal" size={22} color={Colors.textMuted} />
              </Pressable>
            </View>
          </View>
          )
        }
      />

      <Sheet visible={!!menuStory} title={menuStory?.title ?? 'Truyện'} description="Chọn việc muốn làm với truyện này." onClose={() => setMenuStory(null)}>
        <View style={styles.menu}>
          <HeyButton
            title="Xem chi tiết"
            iconName="book-outline"
            variant="tertiary"
            onPress={() => {
              const s = menuStory;
              setMenuStory(null);
              if (s) onOpenStory(s);
            }}
          />
          <HeyButton
            title={selectedChild ? `Thêm vào tủ sách của ${selectedChild.name}` : 'Thêm vào tủ sách bé'}
            iconName="bookmark-outline"
            variant="secondary"
            onPress={() => {
              const s = menuStory;
              setMenuStory(null);
              if (s) onAddToShelf(s);
            }}
          />
        </View>
      </Sheet>
    </>
  );
};

const styles = StyleSheet.create({
  header: { gap: Spacing.sm },
  content: { padding: Spacing.page, paddingBottom: Spacing.xxxl },
  search: { marginTop: Spacing.xs },
  pressed: { opacity: 0.8 },
  segment: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: Radius.lg, backgroundColor: Colors.surfaceMuted, marginBottom: Spacing.md },
  segItem: { flex: 1, minHeight: Touch.min, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xs, borderRadius: Radius.md },
  segItemOn: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.brandStrong },
  segText: { ...Typography.label, fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  segTextOn: { fontFamily: FontFamily.extraBold, color: Colors.text },
  column: { gap: Spacing.md },
  card: { flex: 1, minWidth: 0, marginBottom: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.outline, overflow: 'hidden' },
  padCell: { flex: 1, minWidth: 0, marginBottom: Spacing.md },
  cardMain: { gap: Spacing.sm },
  cover: { width: '100%', aspectRatio: 1, backgroundColor: Colors.brandTint },
  title: { ...Typography.bodyStrong, fontSize: 14, color: Colors.text, paddingHorizontal: Spacing.md, minHeight: 40 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: Spacing.md, paddingRight: Spacing.xs, paddingBottom: Spacing.xs },
  moreBtn: { width: Touch.min, height: Touch.min, alignItems: 'center', justifyContent: 'center', borderRadius: Touch.min / 2 },
  menu: { gap: Spacing.sm, paddingBottom: Spacing.md },
});
