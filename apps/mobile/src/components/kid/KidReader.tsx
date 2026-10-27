// apps/mobile/src/components/kid/KidReader.tsx — R4: trình đọc truyện cho bé.
// Tranh là trọng tâm (tới ~50% chiều cao màn), chữ truyện trên nền giấy (Typography.reader), nút trang 64pt có icon + nhãn ngắn.
// Logic (đổi trang, điểm dừng EQ, hoàn thành) nằm ở useKidReader; component này chỉ hiển thị.
import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors } from '../../theme/colors';
import { Layout, Radius, Spacing, Touch } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { HeyButton } from '../ui/HeyButton';
import { Icon } from '../ui/Icon';
import { KidCheckpointCard } from './KidCheckpointCard';
import { KidState } from './KidState';
import { useReduceMotion } from '../../utils/useReduceMotion';
import type { KidReaderState } from '../../screens/kid/useKidReader';

interface Props {
  reader: KidReaderState;
  hideBehind: 'auto' | 'no-hide-descendants';
}

export const KidReader: React.FC<Props> = ({ reader, hideBehind }) => {
  const { height } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const scrollRef = useRef<ScrollView>(null);
  const { play, page } = reader;

  // Điểm dừng nằm dưới tranh + chữ: tự cuộn tới để bé không phải tự tìm câu hỏi
  const checkpointId = reader.openCheckpoint?.id;
  useEffect(() => {
    if (!checkpointId) return;
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: !reduceMotion }), 120);
    return () => clearTimeout(t);
  }, [checkpointId, reduceMotion]);

  if (!play) return null;

  if (reader.finished) {
    return (
      <View style={styles.center} importantForAccessibility={hideBehind}>
        <KidState
          icon="ribbon"
          tone="brand"
          title="Bé đọc xong rồi!"
          description={play.story.title}
          actionLabel="Về tủ sách"
          onAction={reader.closeStory}
        />
      </View>
    );
  }

  // Nhãn ngắn (1 dòng) cho nút 64pt; nhãn trợ năng đầy đủ
  const nextLabel = reader.pendingCheckpoint ? 'Trả lời' : reader.isLast ? 'Đọc xong' : 'Trang sau';
  const nextA11y = reader.pendingCheckpoint ? 'Trả lời câu hỏi' : reader.isLast ? 'Đọc xong truyện' : 'Trang sau';
  const nextIcon = reader.pendingCheckpoint ? 'help-circle' : reader.isLast ? 'checkmark-circle' : 'arrow-forward';
  const progress = reader.pageCount > 0 ? (reader.pageIndex + 1) / reader.pageCount : 0;

  return (
    <View style={styles.container} importantForAccessibility={hideBehind}>
      <View style={styles.topRow}>
        <Pressable
          onPress={reader.closeStory}
          accessibilityRole="button"
          accessibilityLabel="Về tủ sách"
          style={(s) => [styles.backBtn, s.pressed && styles.pressed, focusRing(s)]}
        >
          <Icon name="arrow-back" size={22} color={Colors.text} />
          <Text style={styles.backText}>Tủ sách</Text>
        </Pressable>
        <Text style={styles.storyTitle} numberOfLines={1}>
          {play.story.title}
        </Text>
        <View style={styles.pagePill} accessible accessibilityLabel={`Trang ${reader.pageIndex + 1} trên ${reader.pageCount}`}>
          <Text style={styles.pageText}>
            {reader.pageIndex + 1}/{reader.pageCount}
          </Text>
        </View>
      </View>
      <View style={styles.track} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <View style={[styles.imageBox, { maxHeight: Math.round(height * 0.5) }]}>
            {page?.imageUrl ? (
              <Image source={{ uri: page.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
            ) : (
              <Icon name="color-palette-outline" size={56} color={Colors.brandStrong} />
            )}
          </View>

          <View style={styles.textBox}>
            <Text style={styles.pageBody}>{page?.text}</Text>
          </View>

          {/* Điểm dừng EQ (BE chấm và trả gợi ý/đáp án) */}
          {reader.openCheckpoint && (
            <KidCheckpointCard
              checkpoint={reader.openCheckpoint}
              result={reader.resultOf(reader.openCheckpoint.id)}
              submitting={reader.submitting}
              error={reader.actionError}
              onChoose={(choice) => void reader.submit(choice)}
              onSkip={() => void reader.submit({ skipped: true })}
              onContinue={reader.continueAfterCheckpoint}
            />
          )}

          {!reader.openCheckpoint && !!reader.actionError && (
            <Text style={styles.error} accessibilityRole="alert">
              {reader.actionError}
            </Text>
          )}
        </View>
      </ScrollView>

      {!reader.openCheckpoint && (
        <View style={styles.nav}>
          <View style={styles.navInner}>
            <View style={styles.navCell}>
              <HeyButton
                title="Trước"
                accessibilityLabel="Trang trước"
                iconName="arrow-back"
                variant="tertiary"
                size="xl"
                style={styles.navBtn}
                disabled={reader.pageIndex === 0}
                onPress={reader.prev}
              />
            </View>
            <View style={styles.navCell}>
              <HeyButton
                title={nextLabel}
                accessibilityLabel={nextA11y}
                iconName={nextIcon}
                variant="kid"
                size="xl"
                style={styles.navBtn}
                loading={reader.submitting}
                onPress={reader.next}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.page, paddingTop: Spacing.sm },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: Touch.kid - 8,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.outlineStrong,
  },
  pressed: { opacity: 0.7 },
  backText: { fontFamily: FontFamily.extraBold, fontSize: 15, color: Colors.text },
  storyTitle: { ...Typography.kidHeading, fontSize: 17, lineHeight: 22, color: Colors.text, flex: 1, textAlign: 'center' },
  pagePill: { minWidth: 56, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full, backgroundColor: Colors.tealTint },
  pageText: { fontFamily: FontFamily.extraBold, fontSize: 15, color: Colors.tealDeep },
  track: { height: 6, marginHorizontal: Spacing.page, marginTop: Spacing.sm, borderRadius: 3, backgroundColor: Colors.outline, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: Colors.tealStrong },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.page, paddingBottom: Spacing.xl, alignItems: 'center' },
  inner: { width: '100%', maxWidth: Layout.maxContentWidth, gap: Spacing.lg },
  imageBox: {
    width: '100%',
    aspectRatio: 1, // tranh vuông lớn (~40% chiều cao điện thoại), giới hạn maxHeight 50% màn
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brandTint,
  },
  // Nền giấy ấm cho chữ truyện (Reader paper, UI plan §4 C): navy trên creamWarm > 13:1
  textBox: { borderRadius: Radius.xxl, backgroundColor: Colors.surfaceWarm, borderWidth: 1, borderColor: Colors.outline, padding: Spacing.xl },
  pageBody: { ...Typography.reader, color: Colors.text },
  error: { ...Typography.label, color: Colors.danger, textAlign: 'center' },

  nav: { alignItems: 'center', paddingHorizontal: Spacing.page, paddingTop: Spacing.sm, paddingBottom: Spacing.md, backgroundColor: Colors.canvas, borderTopWidth: 1, borderTopColor: Colors.outline },
  navInner: { width: '100%', maxWidth: Layout.maxContentWidth, flexDirection: 'row', gap: Spacing.md },
  navCell: { flex: 1 },
  navBtn: { minHeight: Touch.kidLarge },
});
