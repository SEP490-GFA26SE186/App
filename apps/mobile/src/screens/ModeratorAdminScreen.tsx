// apps/mobile/src/screens/ModeratorAdminScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { HeyButton } from '../components/ui/HeyButton';
import { HeyCard } from '../components/ui/HeyCard';
import { HeyChip } from '../components/ui/HeyChip';
import { Story } from '../../../../packages/shared-types';
import { Colors } from '../theme/colors';

export const ModeratorAdminScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MODERATION' | 'WITHDRAWALS'>('MODERATION');

  const samplePendingStories: Story[] = [
    {
      id: 'story_mod_01',
      title: 'Chú Voi Con Biết Xin Lỗi',
      authorId: 'usr_02',
      authorName: 'Cô Thuỳ Trang',
      theme: 'Lễ phép & Đạo đức',
      targetAgeGroup: '3-6',
      coverImageUrl:
        'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400',
      status: 'PENDING_MODERATION',
      createdAt: new Date().toISOString(),
      pages: [
        {
          pageNumber: 1,
          text: 'Voi con mải chạy chơi vô tình làm đổ giỏ táo của bà Khỉ...',
          illustrationUrl:
            'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400',
        },
      ],
    },
  ];

  const [queue, setQueue] = useState<Story[]>(samplePendingStories);
  const [notice, setNotice] = useState<string | null>(null);

  const handleApprove = (storyId: string) => {
    setQueue(queue.filter((s) => s.id !== storyId));
    setNotice('✅ Đã phê duyệt và xuất bản truyện lên Chợ!');
    setTimeout(() => setNotice(null), 2500);
  };

  const handleReject = (storyId: string) => {
    setQueue(queue.filter((s) => s.id !== storyId));
    setNotice('❌ Đã từ chối truyện và gửi phản hồi cho tác giả.');
    setTimeout(() => setNotice(null), 2500);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTag}>🛡️ Ban Kiểm Duyệt Nội Dung & An Toàn</Text>
        <Text style={styles.bannerTitle}>Bảo Vệ 100% Nội Dung Cho Trẻ</Text>
        <Text style={styles.bannerSubtitle}>
          Kiểm duyệt từ ngữ nhạy cảm, bạo lực, rò rỉ danh tính trẻ em (PII) trước khi xuất bản.
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <HeyChip
          label={`🛡️ Duyệt truyện (${queue.length})`}
          selected={activeTab === 'MODERATION'}
          onPress={() => setActiveTab('MODERATION')}
        />
        <HeyChip
          label="💸 Duyệt rút tiền"
          selected={activeTab === 'WITHDRAWALS'}
          onPress={() => setActiveTab('WITHDRAWALS')}
        />
      </View>

      {notice && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      )}

      {/* Queue List */}
      {queue.length === 0 ? (
        <HeyCard style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>Hàng đợi trống</Text>
          <Text style={styles.emptyText}>Tất cả truyện gửi duyệt đã được xử lý an toàn.</Text>
        </HeyCard>
      ) : (
        queue.map((story) => (
          <View key={story.id} style={styles.storyCard}>
            <Image
              source={{ uri: story.coverImageUrl }}
              style={styles.storyCover}
            />
            <View style={styles.storyBody}>
              <Text style={styles.storyTheme}>{story.theme}</Text>
              <Text style={styles.storyTitle}>{story.title}</Text>
              <Text style={styles.storyAuthor}>Tác giả: {story.authorName}</Text>
              <Text style={styles.storyPreview}>
                "{story.pages[0]?.text}"
              </Text>

              <View style={styles.safetyBox}>
                <Text style={styles.safetyText}>
                  🛡️ AI Safety Check: 100% Không bạo lực • Đã che tên PII
                </Text>
              </View>

              <View style={styles.actionRow}>
                <HeyButton
                  title="✕ Từ chối"
                  variant="outline"
                  size="sm"
                  onPress={() => handleReject(story.id)}
                  style={styles.actionBtn}
                />
                <HeyButton
                  title="✓ Phê duyệt"
                  variant="teal"
                  size="sm"
                  onPress={() => handleApprove(story.id)}
                  style={styles.actionBtn}
                />
              </View>
            </View>
          </View>
        ))
      )}
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
    backgroundColor: Colors.textDark,
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
    fontSize: 20,
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
  tabRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  noticeBox: {
    backgroundColor: Colors.greenLight,
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  noticeText: {
    color: Colors.green,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textDark,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  storyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  storyCover: {
    width: '100%',
    height: 140,
  },
  storyBody: {
    padding: 14,
  },
  storyTheme: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textDark,
    marginTop: 2,
  },
  storyAuthor: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  storyPreview: {
    fontSize: 13,
    color: Colors.textDark,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  safetyBox: {
    backgroundColor: Colors.greenLight,
    padding: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  safetyText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.green,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    marginLeft: 8,
  },
});
