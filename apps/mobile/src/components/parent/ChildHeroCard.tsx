// apps/mobile/src/components/parent/ChildHeroCard.tsx — R5: thẻ "hero" của bé đang chọn ở Parent Home.
// Avatar + tên → 3 ô số liệu THẬT từ GET /children/:id/overview (phút đọc hôm nay, truyện trên tủ, năng lực EQ có dữ liệu)
// → dòng phụ → nút "Chế độ Bé". Không có số liệu nào được dựng sẵn: đang tải = skeleton, lỗi = thông báo + "Thử lại".
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChildProfile } from '../../types/domain';
import type { ChildOverviewDto } from '../../types/api';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { childEmoji } from '../../utils/child';
import { HeyCard } from '../ui/HeyCard';
import { HeyButton } from '../ui/HeyButton';
import { Icon } from '../ui/Icon';
import { Skeleton } from '../ui/Skeleton';

interface Props {
  child: ChildProfile;
  status: 'loading' | 'ready' | 'error';
  overview: ChildOverviewDto | null;
  error?: string | null;
  onRetry: () => void;
  onOpenKidMode: () => void;
}

const StatTile: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <View style={styles.tile} accessible accessibilityLabel={`${label}: ${value}`}>
    <Text style={styles.tileValue} maxFontSizeMultiplier={1.3}>
      {value}
    </Text>
    <Text style={styles.tileLabel} maxFontSizeMultiplier={1.3}>
      {label}
    </Text>
  </View>
);

export const ChildHeroCard: React.FC<Props> = ({ child, status, overview, error, onRetry, onOpenKidMode }) => {
  const eqWithData = overview ? overview.eqReport.competencies.filter((c) => c.level != null).length : 0;
  const lastRead = overview?.readingStats.lastReadStory;

  return (
    <HeyCard variant="surface" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji} accessibilityElementsHidden importantForAccessibility="no">
            {childEmoji(child)}
          </Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Bé đang chọn</Text>
          <Text style={styles.name} numberOfLines={2} accessibilityRole="header">
            {child.name}
          </Text>
        </View>
      </View>

      {status === 'loading' && (
        <View accessible accessibilityRole="progressbar" accessibilityLabel={`Đang tải số liệu của ${child.name}`} style={styles.tiles}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={76} radius={Radius.lg} style={styles.skeletonTile} />
          ))}
        </View>
      )}

      {status === 'error' && (
        <View style={styles.error} accessibilityRole="alert">
          <Icon name="alert-circle-outline" size={20} color={Colors.danger} />
          <Text style={styles.errorText}>{error || 'Chưa tải được số liệu của bé.'}</Text>
          <HeyButton title="Thử lại" variant="tertiary" size="sm" onPress={onRetry} />
        </View>
      )}

      {status === 'ready' && overview && (
        <>
          <View style={styles.tiles}>
            <StatTile value={String(overview.todayUsage.usedMinutes)} label="phút đọc hôm nay" />
            <StatTile value={String(overview.readingStats.booksInBookshelf)} label="truyện trên tủ sách" />
            <StatTile value={`${eqWithData}/5`} label="năng lực EQ có dữ liệu" />
          </View>
          <Text style={styles.meta}>
            {overview.todayUsage.sessionsCount} lượt đọc · {overview.todayUsage.completedCount} hoàn thành hôm nay ·{' '}
            {overview.readingStats.completedStories} lượt đọc xong tổng cộng
          </Text>
          {!!lastRead && (
            <Text style={styles.meta} numberOfLines={2}>
              Đọc gần nhất: {lastRead.title}
            </Text>
          )}
        </>
      )}

      <HeyButton
        title={`Vào Chế độ Bé · ${child.name}`}
        accessibilityLabel={`Vào Chế độ Bé của ${child.name}`}
        iconName="happy"
        variant="secondary"
        size="lg"
        onPress={onOpenKidMode}
        style={styles.kidBtn}
      />
    </HeyCard>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.md, marginBottom: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.tealTint, borderWidth: 2, borderColor: Colors.tealBright },
  avatarEmoji: { fontSize: 30 },
  headerText: { flex: 1, minWidth: 0 },
  kicker: { ...Typography.caption, color: Colors.textMuted },
  name: { ...Typography.title, color: Colors.text },
  tiles: { flexDirection: 'row', gap: Spacing.sm },
  skeletonTile: { flex: 1 },
  tile: { flex: 1, minHeight: 76, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs, borderRadius: Radius.lg, backgroundColor: Colors.brandTint },
  // navy / brandInk trên brandTint ≥ 12:1
  tileValue: { ...Typography.title, color: Colors.brandInk },
  tileLabel: { ...Typography.caption, color: Colors.text, textAlign: 'center' },
  meta: { ...Typography.caption, color: Colors.textMuted },
  error: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm },
  errorText: { ...Typography.label, color: Colors.danger, flexShrink: 1 },
  kidBtn: { marginTop: Spacing.xs },
});
