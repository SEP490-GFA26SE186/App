// apps/mobile/src/components/parent/ShelfItemRow.tsx
// Phase 1 – một truyện trên giá sách của bé (GET /children/:id/bookshelf, GET /bookshelf): bìa, tên, chủ đề, tiến độ đọc.
// Chỉ hiện trường BE trả; chưa có lượt đọc → "Chưa đọc" (không bịa %). Nút phụ (Gỡ) do màn cha truyền vào.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StoryCover } from '../ui/StoryCover';
import { HeyProgressBar } from '../ui/HeyProgressBar';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import type { ShelfItemDto } from '../../types/api';

export const shelfProgressLabel = (item: ShelfItemDto): string => {
  const p = item.readingProgress;
  if (!p) return 'Chưa đọc';
  return p.isCompleted ? 'Đã đọc xong' : `Đang đọc · ${p.progressPercentage}%`;
};

interface ShelfItemRowProps {
  item: ShelfItemDto;
  /** Có = cả phần bìa + tên là nút mở truyện */
  onOpen?: () => void;
  action?: React.ReactNode;
}

export const ShelfItemRow: React.FC<ShelfItemRowProps> = ({ item, onOpen, action }) => {
  const progress = shelfProgressLabel(item);
  const body = (
    <>
      <StoryCover uri={item.cover?.imageUrl ?? undefined} style={styles.cover} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {!!item.topic?.title && (
          <Text style={styles.meta} numberOfLines={1}>
            {item.topic.title}
          </Text>
        )}
        <Text style={styles.meta}>{progress}</Text>
        {!!item.readingProgress && <HeyProgressBar progress={item.readingProgress.progressPercentage} height={6} color={Colors.tealStrong} />}
      </View>
    </>
  );
  return (
    <View style={styles.row}>
      {onOpen ? (
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`Mở truyện ${item.title}. ${progress}`}
          style={(s) => [styles.main, s.pressed && styles.pressed, focusRing(s)]}
        >
          {body}
        </Pressable>
      ) : (
        <View style={styles.main} accessible accessibilityLabel={`${item.title}. ${progress}`}>
          {body}
        </View>
      )}
      {action}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.outline },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.md },
  pressed: { opacity: 0.8 },
  cover: { width: 56, height: 56, borderRadius: Radius.md, backgroundColor: Colors.brandTint },
  info: { flex: 1, minWidth: 0, gap: 2 },
  title: { ...Typography.bodyStrong, fontSize: 15, color: Colors.text },
  meta: { ...Typography.caption, color: Colors.textMuted },
});
