// apps/mobile/src/components/selling/ListingSheet.tsx
// GĐ D3 – Đăng bán truyện / cập nhật phiên bản (Web NewListingPage): chọn truyện đã hoàn tất, tên trên Chợ, mô tả, giá
// (miễn phí hoặc 5.000–500.000đ, bội 1.000), tên chung cho từng nhân vật (lấy từ GET /stories/:id). Phiên bản mới điền sẵn
// từ bản đang bán. Kiểm như BE trước khi gửi; lỗi 422 của BE (errors[].path) hiện đúng ô. Gửi qua Dialog (màn cha).
import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { HeyButton } from '../ui/HeyButton';
import { HeyChip } from '../ui/HeyChip';
import { HeyInput } from '../ui/HeyInput';
import { Sheet } from '../ui/Sheet';
import { StateView } from '../ui/StateView';
import { Colors } from '../../theme/colors';
import { Spacing, Touch } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { storyService } from '../../services/storyService';
import { useAsyncResource } from '../../utils/useAsyncResource';
import { ListingForm, emptyListingForm, listingFormErrors, versionForm } from '../../utils/selling';
import type { MyListingDto } from '../../types/selling';

export const ListingSheet: React.FC<{
  visible: boolean;
  /** Truyện đã hoàn tất của phụ huynh (để chọn khi đăng mới) */
  stories: { id: string; title: string }[];
  /** Có = cập nhật phiên bản của truyện đang bán */
  live?: MyListingDto;
  busy: boolean;
  /** Lỗi theo ô do BE trả (422) */
  serverErrors: Record<string, string>;
  onSubmit: (form: ListingForm, tokens: string[]) => void;
  onClose: () => void;
}> = ({ visible, stories, live, busy, serverErrors, onSubmit, onClose }) => {
  const [form, setForm] = useState<ListingForm>(emptyListingForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Nhân vật của truyện gốc (tên thật → ô tên chung) và, khi cập nhật, tên chung đang dùng ở bản đang bán
  const source = useAsyncResource(() => (visible && form.storyId ? storyService.getStoryDetail(form.storyId) : Promise.resolve(null)), [visible, form.storyId]);
  const liveStory = useAsyncResource(() => (visible && live ? storyService.getStoryDetail(live.publishedStoryId) : Promise.resolve(null)), [visible, live?.id]);

  useEffect(() => {
    if (!visible) return;
    setForm(live ? versionForm(live, []) : emptyListingForm());
    setErrors({});
  }, [visible, live?.id]);
  useEffect(() => {
    if (live && liveStory.data) setForm((f) => ({ ...f, aliases: versionForm(live, liveStory.data?.characters ?? []).aliases }));
  }, [liveStory.data]);
  useEffect(() => setErrors(serverErrors), [serverErrors]);

  const characters = source.data?.characters ?? [];
  const tokens = characters.map((c) => c.token);
  const set = (patch: Partial<ListingForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors({});
  };
  const submit = () => {
    const e = listingFormErrors(form, tokens);
    if (form.storyId && source.status !== 'ready') e.storyId = 'Đang tải nhân vật của truyện, ba mẹ chờ một chút.';
    setErrors(e);
    if (!Object.keys(e).length) onSubmit(form, tokens);
  };

  return (
    <Sheet
      visible={visible}
      title={live ? 'Cập nhật phiên bản' : 'Đăng bán truyện'}
      description={
        live
          ? `Phiên bản mới của “${live.title}”. Bản đang bán vẫn bán cho tới khi chuyên gia duyệt bản mới; duyệt xong, người đã mua tự nhận bản mới, đánh giá và lượt mua được giữ nguyên.`
          : 'Bản đăng bán dùng tên chung thay tên thật, không kèm chuyện thật ở nhà và không kèm giọng đọc của gia đình.'
      }
      onClose={onClose}
      footer={<HeyButton title="Gửi chuyên gia duyệt" iconName="send-outline" loading={busy} onPress={submit} />}
    >
      {!live && (
        <>
          <Text style={styles.label}>Truyện đã hoàn tất</Text>
          {stories.length ? (
            <View accessibilityRole="radiogroup" accessibilityLabel="Truyện đã hoàn tất" style={styles.chips}>
              {stories.map((s) => (
                <HeyChip key={s.id} label={s.title} selected={form.storyId === s.id} onPress={() => set({ storyId: s.id, aliases: {} })} />
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>Chưa có truyện nào đã hoàn tất. Ba mẹ mở truyện trong Tủ truyện và bấm “Hoàn tất” trước.</Text>
          )}
          {!!errors.storyId && <Text style={styles.error}>{errors.storyId}</Text>}
        </>
      )}
      <HeyInput label="Tên truyện trên Chợ (không dùng tên thật)" value={form.title} onChangeText={(title) => set({ title })} error={errors.title} />
      <HeyInput label="Mô tả (không bắt buộc)" value={form.description} onChangeText={(description) => set({ description })} multiline numberOfLines={3} error={errors.description} />
      <View style={styles.switchRow}>
        <Text style={[styles.label, styles.flex1]}>Miễn phí</Text>
        <Switch value={form.free} onValueChange={(free) => set({ free })} accessibilityLabel="Miễn phí" trackColor={{ true: Colors.tealStrong, false: Colors.outline }} thumbColor={Colors.surface} />
      </View>
      {!form.free && (
        <HeyInput label="Giá (đồng)" value={form.price} onChangeText={(price) => set({ price })} keyboardType="numeric" placeholder="Nhập giá bán (đồng)" error={errors.priceVnd} />
      )}
      <Text style={styles.muted}>
        {form.free ? 'Truyện miễn phí: phụ huynh nhận ngay, không qua thanh toán.' : 'Từ 5.000đ đến 500.000đ, bội số 1.000đ.'} Chuyên gia sẽ xem cả giá khi duyệt.
      </Text>

      {!!form.storyId && (
        <>
          <Text style={[styles.label, styles.top]}>Tên chung cho nhân vật</Text>
          {source.status === 'loading' && <StateView variant="loading" title="Đang tải nhân vật..." />}
          {source.status === 'error' && <StateView variant="error" title="Chưa tải được truyện" description={source.error ?? ''} actionLabel="Thử lại" onAction={() => void source.reload()} />}
          {!!source.data && (
            <Text style={styles.muted}>
              {source.data.useTts
                ? 'Truyện có giọng đọc: hệ thống đọc lại bằng tên chung này (vài phút) trước khi chuyên gia duyệt.'
                : 'Truyện đang tắt giọng đọc: bản đăng bán chỉ có chữ, người mua sẽ thấy nhãn "Chỉ có chữ".'}
            </Text>
          )}
          {characters.map((c) => (
            <HeyInput
              key={c.token}
              label={`${c.name ?? c.token}${c.isMain ? ' (chính)' : ''} →`}
              value={form.aliases[c.token] ?? ''}
              onChangeText={(t) => set({ aliases: { ...form.aliases, [c.token]: t } })}
              placeholder="Nhập tên thay thế"
              error={errors[`aliases.${c.token}`]}
            />
          ))}
          {Object.entries(errors)
            .filter(([k]) => k.startsWith('pages.') || k.startsWith('checkpoints.'))
            .map(([k, msg]) => (
              <Text key={k} style={styles.error}>
                {msg}
              </Text>
            ))}
        </>
      )}
    </Sheet>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  top: { marginTop: Spacing.sm },
  label: { ...Typography.label, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.sm },
  error: { ...Typography.caption, color: Colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs, marginBottom: Spacing.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', minHeight: Touch.min },
});
