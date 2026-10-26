// apps/mobile/src/screens/parent/StoryDetailScreen.tsx
// B6 – Chi tiết truyện / xem lại (Web: StoryEditorPage). Chỉ xem trang của truyện; chỉnh sửa và "hoàn tất xem lại"
// chờ API (C8: PUT trang/điểm dừng, POST /review – lỗi 422 hiển thị errors[]). Điểm dừng bị khóa trong bản xem.
import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { Story } from '../../../../../packages/shared-types';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { Badge } from '../../components/ui/Badge';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Colors } from '../../theme/colors';
import { STORY_STATUS_LABELS } from '../../constants/story';

interface StoryDetailScreenProps {
  story?: Story;
  /** Lỗi 422 của POST /review (errors[]) – chỉ có khi đã tích hợp API */
  reviewErrors?: string[];
  onBack: () => void;
  onRead: (story: Story) => void;
  onUnsupported: (what: string) => void;
}

export const StoryDetailScreen: React.FC<StoryDetailScreenProps> = ({
  story,
  reviewErrors,
  onBack,
  onRead,
  onUnsupported,
}) => {
  if (!story) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Chi tiết truyện" onBack={onBack} />
        <StateView variant="empty" title="Không tìm thấy truyện" description="Truyện có thể đã bị xóa hoặc chưa tải xong." />
      </ScrollView>
    );
  }

  const pages = story.pages ?? [];
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title={story.title} onBack={onBack} />

      <Image source={{ uri: story.coverImageUrl }} style={styles.cover} />
      <View style={styles.badges}>
        <Badge
          label={(story.status && STORY_STATUS_LABELS[story.status]) || 'Truyện'}
          tone={story.status === 'READY' ? 'success' : story.status === 'GENERATING' ? 'info' : 'neutral'}
        />
        {!!story.theme && <Badge label={story.theme} tone="neutral" />}
      </View>
      {!!story.summary && <Text style={styles.summary}>{story.summary}</Text>}

      <View style={styles.actions}>
        <HeyButton
          title="📖 Đọc thử"
          size="sm"
          disabled={pages.length === 0}
          onPress={() => onRead(story)}
          style={styles.actionBtn}
        />
        <HeyButton
          title="✏️ Chỉnh sửa"
          variant="outline"
          size="sm"
          onPress={() => onUnsupported('Chỉnh sửa truyện')}
          style={styles.actionBtn}
        />
        <HeyButton
          title="✅ Hoàn tất xem lại"
          variant="teal"
          size="sm"
          onPress={() => onUnsupported('Hoàn tất xem lại truyện')}
          style={styles.actionBtn}
        />
      </View>

      {!!reviewErrors?.length && (
        <HeyCard variant="coral" style={styles.errors}>
          <Text style={styles.errorsTitle}>Truyện chưa đủ điều kiện hoàn tất:</Text>
          {reviewErrors.map((e) => (
            <Text key={e} style={styles.errorsItem}>
              • {e}
            </Text>
          ))}
        </HeyCard>
      )}

      <Text style={styles.sectionTitle}>Các trang ({pages.length})</Text>
      {pages.length === 0 ? (
        <StateView
          variant="unsupported"
          title="Chưa có nội dung trang để hiển thị"
          description="Các trang và điểm dừng sẽ hiển thị khi ứng dụng kết nối đầy đủ với máy chủ."
        />
      ) : (
        pages.map((p, i) => (
          <HeyCard key={p.id} style={styles.pageCard}>
            <Text style={styles.pageLabel}>Trang {p.pageNumber ?? i + 1}</Text>
            <Text style={styles.pageText}>{p.text || '(trang chưa có chữ)'}</Text>
          </HeyCard>
        ))
      )}
      <Text style={styles.footnote}>🔒 Điểm dừng câu hỏi do khung sư phạm quy định, không chỉnh trực tiếp.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  cover: { width: '100%', aspectRatio: 16 / 9, borderRadius: 16, backgroundColor: '#F1F5F9' },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  summary: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginTop: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 14 },
  actionBtn: { flexGrow: 1 },
  errors: { marginBottom: 12, gap: 4 },
  errorsTitle: { fontSize: 13, fontWeight: '800', color: '#B91C1C' },
  errorsItem: { fontSize: 12, color: '#B91C1C' },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary, marginBottom: 8 },
  pageCard: { marginBottom: 10, gap: 4 },
  pageLabel: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary },
  pageText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 21 },
  footnote: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
