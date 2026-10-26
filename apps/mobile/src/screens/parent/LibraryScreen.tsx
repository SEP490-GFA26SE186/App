// apps/mobile/src/screens/parent/LibraryScreen.tsx
// B7 – Thư viện / tủ sách (Web: LibraryPage). Danh sách truyện của phụ huynh từ BE, lọc theo trạng thái + tìm theo tên.
// "Thêm vào tủ sách bé" gọi POST /bookshelf (C9); 422 = truyện chưa sẵn sàng, BE nêu lý do.
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { ChildProfile, Story } from '../../../../../packages/shared-types';
import { HeyInput } from '../../components/ui/HeyInput';
import { HeyChip } from '../../components/ui/HeyChip';
import { HeyButton } from '../../components/ui/HeyButton';
import { Badge } from '../../components/ui/Badge';
import { StoryCover } from '../../components/ui/StoryCover';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ChildSwitcher } from '../../components/parent/ChildSwitcher';
import { Colors } from '../../theme/colors';
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
  const [filter, setFilter] = useState<(typeof STORY_FILTERS)[number]['value']>('ALL');
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stories.filter(
      (s) => (filter === 'ALL' || s.status === filter) && (!q || s.title.toLowerCase().includes(q))
    );
  }, [stories, filter, search]);

  const loading = dataStatus === 'loading' && stories.length === 0;
  const selectedChild = childrenProfiles.find((c) => c.id === selectedChildId);

  const header = (
    <View>
      <ScreenHeader
        title="Tủ truyện"
        subtitle={selectedChild ? `Truyện của gia đình · giá sách của ${selectedChild.name}` : 'Truyện của gia đình'}
      />
      <ChildSwitcher childrenProfiles={childrenProfiles} selectedId={selectedChildId} onSelect={onSelectChild} />
      <HeyInput placeholder="Tìm truyện theo tên..." value={search} onChangeText={setSearch} style={styles.search} />
      <View style={styles.chips}>
        {STORY_FILTERS.map((f) => (
          <HeyChip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
        ))}
      </View>
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (loading) {
    empty = <StateView variant="loading" title="Đang tải truyện..." />;
  } else if (stories.length === 0) {
    empty = (
      <StateView
        variant="empty"
        title="Chưa có truyện nào"
        description={
          dataStatus === 'error'
            ? 'Không tải được danh sách truyện. Ba mẹ thử tải lại ở dải thông báo phía trên nhé.'
            : 'Tạo truyện đầu tiên cho bé ở tab Sáng tác.'
        }
        actionLabel={dataStatus === 'error' ? undefined : '🪄 Sáng tác truyện'}
        onAction={dataStatus === 'error' ? undefined : onCreateStory}
      />
    );
  } else if (visible.length === 0) {
    empty = <StateView variant="empty" title="Không có truyện phù hợp" description="Thử đổi bộ lọc hoặc từ khóa nhé." />;
  }

  return (
    <FlatList
      data={visible}
      keyExtractor={(s) => s.id}
      numColumns={2}
      columnWrapperStyle={styles.column}
      contentContainerStyle={styles.content}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <View style={styles.card}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => onOpenStory(item)}>
            <StoryCover uri={item.coverImageUrl} style={styles.cover} />
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
          </TouchableOpacity>
          <Badge
            label={(item.status && STORY_STATUS_LABELS[item.status]) || 'Truyện'}
            tone={item.status === 'READY' ? 'success' : item.status === 'GENERATING' ? 'info' : 'neutral'}
          />
          <HeyButton title="Thêm vào tủ sách bé" variant="outline" size="sm" onPress={() => onAddToShelf(item)} />
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  search: { marginTop: 8, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  column: { gap: 12 },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
    gap: 6,
  },
  cover: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#F1F5F9' },
  title: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginTop: 6, minHeight: 34 },
});
