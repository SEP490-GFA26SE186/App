// apps/mobile/src/screens/parent/ChildDetailScreen.tsx
// Phase 1 – Chi tiết bé (mở từ "Bé nhà mình"). Ba khối đọc riêng, lỗi khối nào thử lại khối đó:
// hồ sơ GET /children/:id · thời gian đọc theo ngày GET /children/:id/usage?date · tóm tắt giá sách GET /children/:id/bookshelf.
// Chỉ hiện trường BE trả. Đổi ảnh đại diện (PUT /children/:id/avatar) chưa làm: BE chỉ nhận khóa ảnh đã lưu, không có API tải ảnh lên.
import React, { useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { ChildProfile } from '../../types/domain';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyChip } from '../../components/ui/HeyChip';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ShelfItemRow } from '../../components/parent/ShelfItemRow';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { ageLabel, childEmoji, formatBirthDate, readingTimeLabel, vnDateDaysAgo } from '../../utils/child';
import { childService } from '../../services';
import { useAsyncResource } from '../../utils/useAsyncResource';

interface ChildDetailScreenProps {
  childId: string;
  /** Hồ sơ trong danh sách (hiện tên ngay trong lúc nạp) */
  summary?: ChildProfile;
  onBack: () => void;
  onOpenShelf: () => void;
  onOpenStory: (storyId: string) => void;
}

const USAGE_DAYS = 7;
const dayLabel = (daysAgo: number, date: string) =>
  daysAgo === 0 ? 'Hôm nay' : daysAgo === 1 ? 'Hôm qua' : `${date.slice(8, 10)}/${date.slice(5, 7)}`;

const Stat: React.FC<{ value: number | string; label: string }> = ({ value, label }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const ChildDetailScreen: React.FC<ChildDetailScreenProps> = ({ childId, summary, onBack, onOpenShelf, onOpenStory }) => {
  const [daysAgo, setDaysAgo] = useState(0);
  const usageDate = vnDateDaysAgo(daysAgo);
  const profile = useAsyncResource(() => childService.getChild(childId), [childId]);
  const usage = useAsyncResource(() => childService.getChildUsage(childId, usageDate), [childId, usageDate]);
  const shelf = useAsyncResource(() => childService.getChildBookshelf(childId, { limit: 3 }), [childId]);

  const child = profile.data;
  const name = child?.name ?? summary?.name ?? 'Bé';
  const portrait = child?.character?.portraitImageUrl;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title={name} subtitle="Hồ sơ, thời gian đọc và tủ sách của bé" onBack={onBack} />

      {/* Hồ sơ */}
      {profile.status === 'loading' ? (
        <StateView variant="skeleton" title="Đang tải hồ sơ bé..." />
      ) : profile.status === 'error' || !child ? (
        <StateView variant="error" title="Không tải được hồ sơ bé" description={profile.error ?? ''} actionLabel="Thử lại" onAction={() => void profile.reload()} />
      ) : (
        <HeyCard style={styles.card}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              {portrait ? (
                <Image source={{ uri: portrait }} style={styles.avatarImg} accessibilityLabel={`Ảnh đại diện của ${child.name}`} />
              ) : (
                <Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
                  {childEmoji(child)}
                </Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name} accessibilityRole="header">
                {child.name}
              </Text>
              <Text style={styles.meta}>
                {ageLabel(child)}
                {child.birthDate ? ` • ${formatBirthDate(child.birthDate)}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <Stat value={child.booksCount ?? 0} label="truyện trên tủ" />
            <Stat value={child.completedSessionsCount ?? 0} label="lượt đọc xong" />
          </View>
          {!!child.character?.appearance && (
            <Text style={styles.body}>
              <Text style={styles.bodyStrong}>Ngoại hình nhân vật đại diện: </Text>
              {child.character.appearance}
            </Text>
          )}
          {!!child.preferredVoice && (
            <Text style={styles.body}>
              <Text style={styles.bodyStrong}>Giọng đọc ưa thích: </Text>
              {child.preferredVoice}
            </Text>
          )}
        </HeyCard>
      )}

      {/* Thời gian đọc theo ngày (giờ VN) */}
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Thời gian đọc
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {Array.from({ length: USAGE_DAYS }, (_, i) => (
          <HeyChip key={i} label={dayLabel(i, vnDateDaysAgo(i))} selected={i === daysAgo} onPress={() => setDaysAgo(i)} />
        ))}
      </ScrollView>
      {usage.status === 'loading' ? (
        <StateView variant="skeleton" title="Đang tải thời gian đọc..." />
      ) : usage.status === 'error' || !usage.data ? (
        <StateView variant="error" title="Không tải được thời gian đọc" description={usage.error ?? ''} actionLabel="Thử lại" onAction={() => void usage.reload()} />
      ) : usage.data.sessionsCount === 0 ? (
        <StateView variant="empty" title="Bé chưa đọc truyện nào ngày này" />
      ) : (
        <HeyCard style={styles.statsRow}>
          <Stat value={readingTimeLabel(usage.data.usedSeconds)} label="thời gian đọc" />
          <Stat value={usage.data.sessionsCount} label="lượt đọc" />
          <Stat value={usage.data.completedCount} label="lượt đọc xong" />
        </HeyCard>
      )}

      {/* Tóm tắt tủ sách */}
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Tủ sách của bé
      </Text>
      {shelf.status === 'loading' ? (
        <StateView variant="skeleton" title="Đang tải tủ sách..." />
      ) : shelf.status === 'error' || !shelf.data ? (
        <StateView variant="error" title="Không tải được tủ sách" description={shelf.error ?? ''} actionLabel="Thử lại" onAction={() => void shelf.reload()} />
      ) : shelf.data.counts.all === 0 ? (
        <StateView variant="empty" title="Tủ sách đang trống" description="Mở một truyện đã hoàn tất và chọn “Thêm vào tủ sách” cho bé." />
      ) : (
        <>
          <HeyCard style={styles.statsRow}>
            <Stat value={shelf.data.counts.all} label="tất cả" />
            <Stat value={shelf.data.counts.reading} label="đang đọc" />
            <Stat value={shelf.data.counts.completed} label="đã xong" />
            <Stat value={shelf.data.counts.not_started} label="chưa đọc" />
          </HeyCard>
          {shelf.data.items.map((item) => (
            <ShelfItemRow key={item.storyId} item={item} onOpen={item.kind === 'private' ? () => onOpenStory(item.storyId) : undefined} />
          ))}
        </>
      )}
      <HeyButton title="Quản lý tủ sách của bé" iconName="library-outline" variant="secondary" onPress={onOpenShelf} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: Spacing.page, paddingBottom: Spacing.xxxl, gap: Spacing.md },
  card: { gap: Spacing.md },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.tealTint, borderWidth: 2, borderColor: Colors.tealBright },
  avatarImg: { width: '100%', height: '100%' },
  emoji: { fontSize: 38 },
  profileInfo: { flex: 1, minWidth: 0 },
  name: { ...Typography.title, fontSize: 20, color: Colors.text },
  meta: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  stat: { flex: 1, alignItems: 'center', paddingVertical: Spacing.xs, borderRadius: Radius.md, backgroundColor: Colors.surfaceMuted },
  statValue: { ...Typography.heading, color: Colors.text, textAlign: 'center' },
  statLabel: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
  body: { ...Typography.label, color: Colors.text },
  bodyStrong: { ...Typography.bodyStrong, fontSize: 14 },
  sectionTitle: { ...Typography.heading, color: Colors.text, marginTop: Spacing.sm },
  chips: { gap: Spacing.sm },
});
