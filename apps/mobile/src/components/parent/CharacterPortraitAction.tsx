// apps/mobile/src/components/parent/CharacterPortraitAction.tsx
// GĐ B3 – Nút vẽ / vẽ lại chân dung AI của một nhân vật (Web components/parent/CharacterPortrait.jsx).
// Tốn credit thật: luôn hỏi lại bằng Dialog ghi rõ "trừ N credit". Lỗi BE (402/409/422/503) hiện câu đã dịch, không thành công giả.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { HeyButton } from '../ui/HeyButton';
import { useToast } from '../ui/Toast';
import { useDialog } from '../ui/Dialog';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { characterService } from '../../services';
import type { CharacterView } from '../../types/viewModels';
import {
  PortraitCharacter,
  createPortraitPoller,
  isPortraitDrawing,
  portraitAction,
  portraitConfirmMessage,
  portraitErrorMessage,
  portraitFailureText,
} from '../../utils/characterPortrait';

interface Props {
  characterId: string;
  name: string;
  character: PortraitCharacter;
  /** Giá một chân dung (GET /stories/ai-pricing → images.characterPortrait); null = chưa biết */
  cost: number | null | undefined;
  creditBalance: number | null;
  /** BE đã nhận lệnh vẽ: bản nhân vật mới (portraitStatus queued) */
  onStarted: (character: CharacterView) => void;
  /** Credit vừa bị giữ: tải lại số dư */
  onCreditsChanged: () => void;
}

export const CharacterPortraitAction: React.FC<Props> = ({ characterId, name, character, cost, creditBalance, onStarted, onCreditsChanged }) => {
  const toast = useToast();
  const dialog = useDialog();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const action = portraitAction(character, cost, creditBalance);
  const failure = portraitFailureText(character);

  const start = async () => {
    if (busyRef.current || action.disabled || cost == null) return;
    const ok = await dialog.confirm({
      title: `Vẽ chân dung cho ${name}?`,
      message: portraitConfirmMessage(name, cost),
      confirmLabel: `Vẽ · trừ ${cost} credit`,
    });
    if (!ok) return;
    busyRef.current = true;
    setBusy(true);
    try {
      onStarted(await characterService.generatePortrait(characterId));
      onCreditsChanged();
      toast.show(`Đang vẽ chân dung ${name} — đã dùng ${cost} credit`);
    } catch (e: any) {
      void dialog.notify('Chưa vẽ được chân dung', portraitErrorMessage(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  if (isPortraitDrawing(character)) {
    return (
      <View style={styles.row} accessibilityLiveRegion="polite">
        <ActivityIndicator color={Colors.brandStrong} />
        <Text style={[styles.caption, styles.flex1]}>AI đang vẽ chân dung… (khoảng 30 giây)</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {!!failure && <Text style={styles.failure}>{failure}</Text>}
      <HeyButton
        title={action.label}
        iconName="color-wand-outline"
        variant="tertiary"
        size="sm"
        onPress={() => void start()}
        loading={busy}
        disabled={action.disabled || busy}
        accessibilityLabel={`${action.label} cho ${name}`}
        style={styles.selfStart}
      />
      {!!action.reason && <Text style={styles.caption}>{action.reason}</Text>}
    </View>
  );
};

/**
 * Hỏi lại BE mỗi 4 s khi có chân dung đang vẽ; dừng khi xong / lỗi liên tiếp / quá trần / rời màn.
 * Số chân dung đang vẽ giảm → `onDrawn` (tải lại credit: vẽ lỗi thì BE hoàn).
 */
export const usePortraitPolling = <T,>(opts: {
  drawing: number;
  load: () => Promise<T>;
  drawingCount: (data: T) => number;
  onData: (data: T) => void;
  onDrawn: () => void;
}) => {
  const ref = useRef(opts);
  ref.current = opts;
  const active = opts.drawing > 0;
  useEffect(() => {
    if (!active) return;
    const poller = createPortraitPoller<T>({
      load: () => ref.current.load(),
      drawingCount: (d) => ref.current.drawingCount(d),
      onData: (d) => ref.current.onData(d),
      onDrawn: () => ref.current.onDrawn(),
    });
    poller.start(ref.current.drawing);
    return () => poller.stop();
  }, [active]);
};

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex1: { flex: 1 },
  caption: { ...Typography.caption, color: Colors.textMuted },
  failure: { ...Typography.caption, color: Colors.danger },
  selfStart: { alignSelf: 'flex-start' },
});
