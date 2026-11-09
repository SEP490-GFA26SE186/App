// apps/mobile/src/components/market/MarketUi.tsx
// GĐ D2 – thành phần dùng chung của Chợ truyện: thẻ truyện (Web ListingCard), dãy sao, sheet báo cáo (Web ReportListingButton /
// ReportReview). Chỉ hiện trường BE trả; không hex mới, không <Modal> mới (Sheet có sẵn).
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StoryCover } from '../ui/StoryCover';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { HeyChip } from '../ui/HeyChip';
import { HeyInput } from '../ui/HeyInput';
import { HeyButton } from '../ui/HeyButton';
import { Colors } from '../../theme/colors';
import { Radius, Spacing, Touch } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { CASEL } from '../../constants/eq';
import { REPORT_DESCRIPTION_MAX, REPORT_OPTIONS, listingPrice, ratingLabel, reportError } from '../../utils/market';
import type { ListingCardDto } from '../../types/market';

/** Sao chỉ đọc (Icon có nhãn chung, không đọc từng sao) */
export const Stars: React.FC<{ value: number; size?: number }> = ({ value, size = 14 }) => (
  <View style={styles.stars} accessible accessibilityLabel={`${value} sao`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Icon key={n} name={n <= value ? 'star' : 'star-outline'} size={size} color={n <= value ? Colors.gold : Colors.textMuted} />
    ))}
  </View>
);

/** Chọn số sao: mỗi sao là nút radio ≥ 44pt */
export const StarPicker: React.FC<{ value: number; onChange: (n: number) => void }> = ({ value, onChange }) => (
  <View style={styles.stars} accessibilityRole="radiogroup" accessibilityLabel="Số sao">
    {[1, 2, 3, 4, 5].map((n) => (
      <Pressable
        key={n}
        onPress={() => onChange(n)}
        accessibilityRole="radio"
        accessibilityState={{ checked: n === value }}
        accessibilityLabel={`${n} sao`}
        style={(s) => [styles.starBtn, focusRing(s)]}
      >
        <Icon name={n <= value ? 'star' : 'star-outline'} size={30} color={n <= value ? Colors.gold : Colors.textMuted} />
      </Pressable>
    ))}
  </View>
);

/** Thẻ truyện đang bán: cả thẻ là một nút mở chi tiết */
export const ListingCard: React.FC<{ listing: ListingCardDto; onOpen: () => void }> = ({ listing: l, onOpen }) => (
  <Pressable
    onPress={onOpen}
    accessibilityRole="button"
    accessibilityLabel={`${l.title}, ${listingPrice(l.priceVnd)}, người bán ${l.seller.displayName}${l.owned ? ', ba mẹ đã có' : ''}`}
    style={(s) => [styles.card, s.pressed && styles.pressed, focusRing(s)]}
  >
    <StoryCover uri={l.cover?.imageUrl ?? undefined} style={styles.cover} />
    <View style={styles.cardBody}>
      <Text style={styles.title} numberOfLines={2}>
        {l.title}
      </Text>
      <Text style={styles.muted} numberOfLines={1}>
        {l.seller.displayName}
        {l.topic ? ` • ${CASEL[l.topic.competency]?.label ?? l.topic.title}` : ''}
      </Text>
      <View style={styles.row}>
        <Icon name="star" size={14} color={Colors.gold} />
        <Text style={styles.muted}>{ratingLabel(l.ratingCount ? l.ratingAvg : null, l.ratingCount)}</Text>
      </View>
      <Text style={styles.muted}>
        {l.totalPages} trang • {l.hasNarration ? 'Có giọng đọc' : 'Chỉ có chữ'}
        {l.topic ? ` • ${l.topic.ageMin}–${l.topic.ageMax} tuổi` : ''}
      </Text>
      <View style={styles.rowBetween}>
        <Text style={styles.price}>{listingPrice(l.priceVnd)}</Text>
        {l.owned && <Badge label="Đã có" tone="success" />}
      </View>
    </View>
  </Pressable>
);

/** Sheet báo cáo: chọn loại (6 loại BE) + mô tả tuỳ chọn ≤ 2000. Gửi qua `onSubmit` (màn cha hỏi Dialog xác nhận) */
export const ReportSheet: React.FC<{
  visible: boolean;
  title: string;
  description?: string;
  busy: boolean;
  /** Báo cáo đánh giá trên Web chỉ chọn loại; Mobile cho thêm mô tả như BE cho phép */
  onSubmit: (category: string, description: string) => void;
  onClose: () => void;
}> = ({ visible, title, description, busy, onSubmit, onClose }) => {
  const [category, setCategory] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (visible) {
      setCategory('');
      setText('');
      setError(null);
    }
  }, [visible]);
  const submit = () => {
    const e = reportError(category, text);
    setError(e);
    if (!e) onSubmit(category, text);
  };
  return (
    <Sheet
      visible={visible}
      title={title}
      description={description ?? 'Thông tin của ba mẹ không được gửi cho người bán.'}
      onClose={onClose}
      footer={<HeyButton title="Gửi báo cáo" iconName="flag-outline" variant="danger" loading={busy} onPress={submit} />}
    >
      <Text style={styles.label}>Vấn đề là gì?</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel="Loại vấn đề" style={styles.chips}>
        {REPORT_OPTIONS.map((o) => (
          <HeyChip
            key={o.value}
            label={o.label}
            selected={category === o.value}
            onPress={() => {
              setCategory(o.value);
              setError(null);
            }}
          />
        ))}
      </View>
      <HeyInput
        label="Mô tả thêm (không bắt buộc)"
        value={text}
        onChangeText={(t) => {
          setText(t);
          setError(null);
        }}
        placeholder="Mô tả thêm vấn đề"
        multiline
        numberOfLines={3}
        hint={`Tối đa ${REPORT_DESCRIPTION_MAX} ký tự.`}
      />
      {!!error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </Sheet>
  );
};

const styles = StyleSheet.create({
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  starBtn: { minWidth: Touch.min, minHeight: Touch.min, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
  card: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.sm, borderRadius: Radius.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.outline, minHeight: Touch.min },
  pressed: { opacity: 0.8 },
  cover: { width: 96, height: 96, borderRadius: Radius.md },
  cardBody: { flex: 1, minWidth: 0, gap: 2 },
  title: { ...Typography.bodyStrong, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted, flexShrink: 1 },
  price: { ...Typography.bodyStrong, color: Colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, marginTop: 2 },
  label: { ...Typography.label, color: Colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs, marginBottom: Spacing.md },
  error: { ...Typography.caption, color: Colors.danger },
});
