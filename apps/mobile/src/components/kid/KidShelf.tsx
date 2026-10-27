// apps/mobile/src/components/kid/KidShelf.tsx — R4: tủ sách của bé (Kid Home).
// "Đọc tiếp" (truyện đang đọc dở, dữ liệu thật từ BE) → lưới bìa 2–3 cột → trạng thái loading / lỗi / rỗng.
// Mọi thẻ là một nút lớn (>= 56pt); không còn animation stagger (an toàn với Reduce Motion), chỉ có trạng thái nhấn.
import React from 'react';
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, StyleSheet, StyleProp, ViewStyle, useWindowDimensions } from 'react-native';
import { Colors } from '../../theme/colors';
import { Elevation } from '../../theme/shadows';
import { Layout, Radius, Spacing } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { HeyButton } from '../ui/HeyButton';
import { Icon } from '../ui/Icon';
import { Skeleton } from '../ui/Skeleton';
import { KidState } from './KidState';
import type { KidShelfItemDto } from '../../types/api';
import type { KidReaderState } from '../../screens/kid/useKidReader';

const GAP = Spacing.md;

const coverOf = (item: KidShelfItemDto) => item.coverImageUrl || item.cover?.imageUrl || null;

const statusOf = (item: KidShelfItemDto) => {
  const p = item.readingProgress;
  if (p?.isCompleted) return { label: 'Đọc lại', icon: 'refresh' as const };
  if (p && p.progressPercentage > 0) return { label: `Đọc tiếp · ${p.progressPercentage}%`, icon: 'play' as const };
  return { label: 'Đọc ngay', icon: 'play' as const };
};

const Cover: React.FC<{ uri: string | null; style: StyleProp<ViewStyle> }> = ({ uri, style }) => (
  <View style={[style, styles.coverBox]}>
    {uri ? (
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
    ) : (
      <Icon name="book" size={40} color={Colors.brandStrong} />
    )}
  </View>
);

const ShelfCard: React.FC<{ item: KidShelfItemDto; width: number; loading: boolean; onPress: () => void }> = ({ item, width, loading, onPress }) => {
  const status = statusOf(item);
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${status.label}`}
      accessibilityState={{ busy: loading, disabled: loading }}
      style={(s) => [styles.card, { width }, s.pressed && styles.cardPressed, focusRing(s)]}
    >
      <Cover uri={coverOf(item)} style={[styles.cardCover, { height: width - 2 }]} />
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={styles.pill}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.onBrand} />
        ) : (
          <>
            <Icon name={status.icon} size={16} color={Colors.onBrand} />
            <Text style={styles.pillText} numberOfLines={1}>
              {status.label}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
};

interface Props {
  reader: KidReaderState;
  childName: string;
  hideBehind: 'auto' | 'no-hide-descendants';
}

export const KidShelf: React.FC<Props> = ({ reader, childName, hideBehind }) => {
  const { width: screenW } = useWindowDimensions();
  const contentW = Math.min(screenW, Layout.maxContentWidth) - Spacing.page * 2;
  const columns = screenW >= 600 ? 3 : 2;
  const cardW = Math.floor((contentW - GAP * (columns - 1)) / columns);
  const resume = reader.shelf.find((i) => i.readingProgress && !i.readingProgress.isCompleted && i.readingProgress.progressPercentage > 0);
  const resumeBusy = !!resume && reader.startingId === resume.storyId;

  return (
    <ScrollView
      importantForAccessibility={hideBehind}
      style={styles.body}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        <Text style={styles.shelfTitle} accessibilityRole="header">
          Tủ sách của {childName}
        </Text>

        {!!reader.actionError && (
          <Text style={styles.error} accessibilityRole="alert">
            {reader.actionError}
          </Text>
        )}

        {!!resume && (
          <View style={styles.resume}>
            <Cover uri={coverOf(resume)} style={styles.resumeCover} />
            <View style={styles.resumeText}>
              <Text style={styles.resumeKicker}>Bé đang đọc dở</Text>
              <Text style={styles.resumeTitle} numberOfLines={2}>
                {resume.title}
              </Text>
              <HeyButton
                title={`Đọc tiếp · ${resume.readingProgress?.progressPercentage ?? 0}%`}
                accessibilityLabel={`Đọc tiếp truyện ${resume.title}`}
                iconName="play"
                variant="kid"
                loading={resumeBusy}
                onPress={() => void reader.open(resume.storyId)}
              />
            </View>
          </View>
        )}

        {reader.shelfStatus === 'loading' && reader.shelf.length === 0 && (
          <View accessible accessibilityRole="progressbar" accessibilityLabel="Đang mở tủ sách" style={styles.grid}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} width={cardW} height={cardW + 90} radius={Radius.xl} />
            ))}
          </View>
        )}

        {reader.shelfStatus === 'error' && (
          <KidState
            alert
            icon="cloud-offline-outline"
            tone="danger"
            title="Chưa mở được tủ sách"
            description={reader.shelfError ?? undefined}
            actionLabel={reader.lost ? undefined : 'Thử lại'}
            onAction={() => void reader.reloadShelf()}
          />
        )}

        <View style={styles.grid}>
          {reader.shelf.map((item) => (
            <ShelfCard
              key={item.storyId}
              item={item}
              width={cardW}
              loading={reader.startingId === item.storyId}
              onPress={() => void reader.open(item.storyId)}
            />
          ))}
        </View>

        {reader.shelfStatus === 'ready' && reader.shelf.length === 0 && (
          <KidState
            icon="leaf-outline"
            tone="teal"
            title="Tủ sách còn trống"
            description="Ba mẹ đưa truyện lên tủ sách cho bé ở mục Tủ truyện nhé."
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1 },
  content: { paddingHorizontal: Spacing.page, paddingTop: Spacing.lg, paddingBottom: Spacing.xxxl, alignItems: 'center' },
  inner: { width: '100%', maxWidth: Layout.maxContentWidth, gap: Spacing.lg },
  shelfTitle: { ...Typography.kidTitle, color: Colors.text },
  error: { ...Typography.label, color: Colors.danger, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },

  resume: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xxl,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderSunshine,
    ...Elevation.mid,
  },
  resumeCover: { width: 104, height: 104, borderRadius: Radius.lg },
  resumeText: { flex: 1, justifyContent: 'center', gap: 4 },
  resumeKicker: { ...Typography.caption, color: Colors.textMuted },
  resumeTitle: { ...Typography.kidHeading, fontSize: 18, lineHeight: 24, color: Colors.text, marginBottom: 4 },

  card: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.outline,
    padding: 1,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    ...Elevation.low,
  },
  cardPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  cardCover: { width: '100%', borderTopLeftRadius: Radius.xl - 2, borderTopRightRadius: Radius.xl - 2 },
  coverBox: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.brandTint },
  cardTitle: { ...Typography.kidHeading, fontSize: 17, lineHeight: 23, color: Colors.text, paddingHorizontal: Spacing.md, minHeight: 46 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    marginHorizontal: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand,
  },
  // navy trên cam 5.6:1
  pillText: { fontFamily: FontFamily.extraBold, fontSize: 14, color: Colors.onBrand, flexShrink: 1 },
});
