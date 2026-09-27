// apps/mobile/src/screens/MarketplaceScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { HeyButton } from '../components/ui/HeyButton';
import { HeyCard } from '../components/ui/HeyCard';
import { HeyChip } from '../components/ui/HeyChip';
import { HeyInput } from '../components/ui/HeyInput';
import { Story, UserAccount } from '../../../../packages/shared-types';
import { Colors } from '../theme/colors';

interface MarketplaceScreenProps {
  stories: Story[];
  currentUser: UserAccount;
  onStoryPurchased: (story: Story) => void;
  onSelectStoryToRead: (story: Story) => void;
}

export const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({
  stories,
  currentUser,
  onStoryPurchased,
  onSelectStoryToRead,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('ALL');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const themes = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'Dũng cảm', label: '🛡️ Dũng cảm' },
    { id: 'Lễ phép', label: '🌸 Lễ phép' },
    { id: 'Chia sẻ', label: '🤝 Chia sẻ' },
    { id: 'Tự lập', label: '⭐ Tự lập' },
  ];

  const publishedStories = stories.filter((s) => s.status === 'PUBLISHED');

  const filteredStories = publishedStories.filter((s) => {
    const matchSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.summary && s.summary.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchTheme =
      selectedTheme === 'ALL' || s.theme.includes(selectedTheme);
    return matchSearch && matchTheme;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTag}>🎒 Chợ Truyện Giáo Dục</Text>
        <Text style={styles.bannerTitle}>Khám phá & Chia sẻ</Text>
        <Text style={styles.bannerSubtitle}>
          Hàng ngàn câu chuyện nuôi dưỡng cảm xúc EQ và đạo đức cho bé từ cộng đồng phụ huynh & tác giả.
        </Text>
      </View>

      {/* Search Input */}
      <HeyInput
        placeholder="🔍 Tìm truyện theo tên hoặc bài học..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      {/* Categories Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.themesRow}
      >
        {themes.map((t) => (
          <HeyChip
            key={t.id}
            label={t.label}
            selected={selectedTheme === t.id}
            onPress={() => setSelectedTheme(t.id)}
          />
        ))}
      </ScrollView>

      {/* Stories Grid */}
      <View style={styles.grid}>
        {filteredStories.map((story) => (
          <TouchableOpacity
            key={story.id}
            activeOpacity={0.85}
            onPress={() => setSelectedStory(story)}
            style={styles.card}
          >
            <Image
              source={{
                uri:
                  story.coverImageUrl ||
                  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',
              }}
              style={styles.cardCover}
            />
            <View style={styles.cardBody}>
              <Text style={styles.cardTheme}>{story.theme}</Text>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {story.title}
              </Text>
              <Text style={styles.cardAuthor}>Tác giả: {story.authorName}</Text>

              <View style={styles.cardPriceRow}>
                <Text style={styles.cardPrice}>
                  {story.priceVnd === 0
                    ? 'Miễn phí'
                    : `${story.priceVnd?.toLocaleString('vi-VN')} đ`}
                </Text>
                <TouchableOpacity
                  onPress={() => onSelectStoryToRead(story)}
                  style={styles.readPill}
                >
                  <Text style={styles.readPillText}>Đọc thử</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Story Detail Modal */}
      <Modal visible={!!selectedStory} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailCard}>
            {selectedStory && (
              <>
                <Image
                  source={{
                    uri:
                      selectedStory.coverImageUrl ||
                      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
                  }}
                  style={styles.detailCover}
                />
                <Text style={styles.detailTheme}>{selectedStory.theme}</Text>
                <Text style={styles.detailTitle}>{selectedStory.title}</Text>
                <Text style={styles.detailAuthor}>Tác giả: {selectedStory.authorName}</Text>
                <Text style={styles.detailDesc}>
                  {selectedStory.summary ||
                    'Câu chuyện nhẹ nhàng giúp trẻ phát triển khả năng thấu cảm và sự sẻ chia cùng bạn bè xung quanh.'}
                </Text>

                <View style={styles.detailBtnRow}>
                  <HeyButton
                    title="Đóng"
                    variant="outline"
                    onPress={() => setSelectedStory(null)}
                    style={styles.detailCloseBtn}
                  />
                  <HeyButton
                    title="📖 Đọc truyện"
                    variant="primary"
                    onPress={() => {
                      const st = selectedStory;
                      setSelectedStory(null);
                      onSelectStoryToRead(st);
                    }}
                    style={styles.detailActionBtn}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  banner: {
    backgroundColor: Colors.secondary,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  bannerTag: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 16,
  },
  themesRow: {
    paddingVertical: 6,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 14,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  cardCover: {
    width: '100%',
    height: 110,
  },
  cardBody: {
    padding: 10,
  },
  cardTheme: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.textDark,
    marginBottom: 4,
    minHeight: 34,
  },
  cardAuthor: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPrice: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.green,
  },
  readPill: {
    backgroundColor: Colors.tealLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  readPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.teal,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  detailCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  detailCover: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 12,
  },
  detailTheme: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textDark,
    marginTop: 2,
  },
  detailAuthor: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  detailDesc: {
    fontSize: 13,
    color: Colors.textDark,
    lineHeight: 18,
    marginBottom: 16,
  },
  detailBtnRow: {
    flexDirection: 'row',
  },
  detailCloseBtn: {
    flex: 1,
    marginRight: 8,
  },
  detailActionBtn: {
    flex: 2,
  },
});
