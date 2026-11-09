// apps/mobile/src/components/parent/StoryMediaPanel.tsx
// GĐ B2 – Tranh AI + giọng đọc của một truyện (Web: components/parent/studio/{NarrationPanel,ScenePicture}.jsx, khung
// "Thêm tranh minh hoạ AI" / "Vẽ tiếp" ở StoryEditorPage, polling của hooks/useStudio.js). Dùng ở Sửa truyện và Chi tiết truyện.
// Vẽ tranh / vẽ lại / thử lại giọng đọc có thể giữ credit: chỉ chạy khi phụ huynh bấm. Lỗi BE (402/409/422/503) hiện nguyên câu đã dịch.
// Điện thoại: tranh liệt kê theo cảnh thành một khối riêng (không chèn giữa các trang như Web).
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { HeyButton } from '../ui/HeyButton';
import { HeyCard } from '../ui/HeyCard';
import { HeyProgressBar } from '../ui/HeyProgressBar';
import { Icon } from '../ui/Icon';
import { useToast } from '../ui/Toast';
import { useDialog } from '../ui/Dialog';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { storyService } from '../../services';
import type { AiPricingDto, DrawImagesResultDto, StoryDto, StorySceneDto } from '../../types/api';
import {
  PollStop,
  canDrawScene,
  canOfferAiImages,
  createStoryPoller,
  drawAndRefresh,
  missingScenes,
  narrationState,
  sceneState,
  shouldPollStory,
} from '../../utils/storyMedia';

export type StoryMediaInput = Pick<StoryDto, 'length' | 'kind' | 'useAiImage' | 'reviewedAt' | 'scenes' | 'narration'>;

interface Props {
  storyId: string;
  story: StoryMediaInput;
  /** Số dư credit hiện tại (null = chưa biết) */
  creditBalance: number | null;
  /** Màn cha đang chạy thao tác khác */
  disabled?: boolean;
  /** BE trả bản truyện mới (sau polling / thử lại giọng đọc / vẽ) */
  onUpdated: (story: StoryDto) => void;
  /** Credit có thể đã đổi (giữ khi bắt đầu vẽ, hoàn khi vẽ lỗi): tải lại số dư */
  onCreditsChanged: () => void;
}

const SCENE_TEXT: Record<string, string> = {
  drawing: 'AI đang vẽ tranh… (khoảng 15–30 giây)',
  waiting: 'Đang chờ vẽ chân dung nhân vật trước',
  failed: 'Vẽ chưa được — credit đã hoàn lại',
  none: 'Cảnh này chưa có tranh',
};

const resultMessage = (r: DrawImagesResultDto, fallback: string): string =>
  r.insufficientCredit && r.skippedNoCredit ? `Đã bắt đầu vẽ; còn ${r.skippedNoCredit} cảnh chưa vẽ vì không đủ credit` : fallback;

export const StoryMediaPanel: React.FC<Props> = ({ storyId, story, creditBalance, disabled, onUpdated, onCreditsChanged }) => {
  const toast = useToast();
  const dialog = useDialog();
  const [pricing, setPricing] = useState<AiPricingDto['images'] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const busyRef = useRef(false);
  const [pollStop, setPollStop] = useState<PollStop | null>(null);
  const [epoch, setEpoch] = useState(0);
  const updatedRef = useRef(onUpdated);
  updatedRef.current = onUpdated;
  const creditsRef = useRef(onCreditsChanged);
  creditsRef.current = onCreditsChanged;
  const storyRef = useRef(story);
  storyRef.current = story;

  useEffect(() => {
    let alive = true;
    storyService
      .getAiPricing()
      .then((p) => alive && setPricing(p.images ?? null))
      .catch(() => {}); // không có giá thì vẫn vẽ được, chỉ không ghi số credit
    return () => {
      alive = false;
    };
  }, []);

  // Hỏi lại BE khi còn việc chạy nền; dừng khi xong / quá trần / rời màn
  const active = shouldPollStory(story);
  useEffect(() => {
    if (!active) return;
    setPollStop(null);
    const poller = createStoryPoller({
      load: () => storyService.getStoryDetail(storyId),
      onData: (dto) => updatedRef.current(dto),
      onDrawn: () => creditsRef.current(),
      onStop: (reason) => reason !== 'done' && reason !== 'cancelled' && setPollStop(reason),
    });
    poller.start(storyRef.current);
    return () => poller.stop();
  }, [storyId, active, epoch]);

  // Báo khi giọng đọc chạy xong trong lúc ba mẹ còn ở màn (Web StoryEditorPage)
  const voice = narrationState(story);
  const prevPhase = useRef(voice?.phase);
  useEffect(() => {
    if (prevPhase.current === 'working' && voice?.phase === 'ready') toast.show('Giọng đọc đã sẵn sàng — bé nghe được truyện này rồi');
    if (prevPhase.current === 'working' && voice?.phase === 'failed') toast.show('Có đoạn giọng đọc bị lỗi — ba mẹ bấm “Thử lại giọng đọc” nhé', 'danger');
    prevPhase.current = voice?.phase;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice?.phase]);

  const run = async (key: string, task: () => Promise<void>, errorTitle: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(key);
    try {
      await task();
    } catch (e: any) {
      void dialog.notify(errorTitle, e?.message || 'Vui lòng thử lại.');
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const reload = async () => updatedRef.current(await storyService.getStoryDetail(storyId));
  const drawAll = (label: string) =>
    run('draw', async () => {
      const r = await drawAndRefresh(() => storyService.drawImages(storyId), { onCreditsChanged, reload });
      toast.show(resultMessage(r, label));
    }, 'Chưa vẽ được tranh');
  const redraw = (scene: StorySceneDto) =>
    run(`scene:${scene.id}`, async () => {
      const r = await drawAndRefresh(() => storyService.redrawScene(storyId, scene.id), { onCreditsChanged, reload });
      toast.show(resultMessage(r, scene.imageUrl ? 'Đang vẽ lại cảnh' : 'Đang vẽ tranh cảnh này'));
    }, 'Chưa vẽ được cảnh này');
  const retryVoice = () =>
    run('voice', async () => {
      updatedRef.current(await storyService.retryNarration(storyId));
      toast.show('Đang tạo lại giọng đọc');
    }, 'Chưa thử lại được giọng đọc');

  const locked = !!disabled || busy !== null;
  const scenes = [...(story.scenes ?? [])].sort((a, b) => (a.sceneOrder ?? 0) - (b.sceneOrder ?? 0));
  const sceneCost = pricing?.scene;
  const costText = (n: number) => (sceneCost != null && sceneCost > 0 ? ` · ${n * sceneCost} credit` : '');
  const missing = missingScenes(story);
  const lackCredit = sceneCost != null && creditBalance != null && creditBalance < sceneCost;
  const showScenes = !!story.useAiImage && scenes.some(canDrawScene);
  const offerImages = canOfferAiImages(story);

  if (!voice && !showScenes && !offerImages && !pollStop) return null;

  return (
    <View style={styles.wrap}>
      {/* Giọng đọc (Web NarrationPanel) */}
      {voice?.phase === 'ready' && (
        <HeyCard style={styles.row}>
          <Icon name="checkmark-circle" size={26} color={Colors.successText} />
          <View style={styles.flex1}>
            <Text style={styles.heading}>Giọng đọc đã sẵn sàng</Text>
            <Text style={styles.muted}>Đã đọc xong {voice.n.total} đoạn. Bé có thể nghe truyện này.</Text>
          </View>
        </HeyCard>
      )}
      {!!voice && voice.phase !== 'ready' && (
        <HeyCard style={[styles.card, ...(voice.phase === 'working' ? [] : [styles.cardDanger])]}>
          <View style={styles.row} accessibilityLiveRegion="polite">
            {voice.phase === 'working' ? (
              <ActivityIndicator color={Colors.brandStrong} />
            ) : (
              <Icon name="alert-circle" size={24} color={Colors.danger} />
            )}
            <View style={styles.flex1}>
              <Text style={styles.heading}>{voice.phase === 'working' ? 'Đang tạo giọng đọc…' : 'Giọng đọc chưa đủ'}</Text>
              <Text style={styles.muted}>
                {voice.phase === 'working'
                  ? `Đã xong ${voice.n.ready}/${voice.n.total} đoạn. Ba mẹ có thể rời màn này.`
                  : voice.n.missing > 0 && voice.n.failed === 0
                    ? `Có ${voice.n.missing} đoạn đã sửa chữ sau lần hoàn tất trước. Bấm hoàn tất lại để đọc lại các đoạn đó.`
                    : `Có ${voice.n.failed + voice.n.missing} đoạn chưa đọc được. Bé chưa nghe được truyện này cho tới khi đủ giọng đọc.`}
              </Text>
            </View>
          </View>
          <View accessible accessibilityRole="progressbar" accessibilityLabel="Tiến độ giọng đọc" accessibilityValue={{ min: 0, max: 100, now: voice.percent }}>
            <HeyProgressBar progress={voice.percent} color={Colors.brandStrong} height={8} />
          </View>
          {voice.n.failed > 0 && voice.phase !== 'working' && (
            <HeyButton title="Thử lại giọng đọc" iconName="refresh" size="sm" onPress={() => void retryVoice()} loading={busy === 'voice'} disabled={locked} style={styles.selfStart} />
          )}
        </HeyCard>
      )}

      {/* Truyện AI chưa bật tranh */}
      {offerImages && (
        <HeyCard style={styles.card}>
          <Text style={styles.heading}>Thêm tranh minh hoạ AI</Text>
          <Text style={styles.muted}>
            AI vẽ {scenes.filter(canDrawScene).length} cảnh theo chân dung nhân vật
            {pricing ? ` · ${pricing.scene} credit/cảnh, chân dung còn thiếu ${pricing.characterPortrait} credit` : ''}.
          </Text>
          <HeyButton title="Vẽ tranh cho truyện" iconName="image-outline" size="sm" onPress={() => void drawAll('Đang vẽ tranh cho truyện')} loading={busy === 'draw'} disabled={locked} style={styles.selfStart} />
        </HeyCard>
      )}

      {/* Còn cảnh chưa vẽ (thường do hết credit giữa chừng) → Vẽ tiếp */}
      {missing.length > 0 && (
        <HeyCard style={[styles.card, styles.cardWarn]}>
          <View style={styles.row} accessibilityRole="alert">
            <Icon name="warning-outline" size={22} color={Colors.warning} />
            <View style={styles.flex1}>
              <Text style={styles.heading}>
                {missing.length}/{scenes.length} cảnh chưa có tranh
              </Text>
              <Text style={styles.muted}>
                {sceneCost != null ? `Vẽ tiếp cần ${missing.length * sceneCost} credit, ba mẹ đang có ${creditBalance ?? '…'} credit. ` : ''}
                {lackCredit ? 'Thường là do hết credit lúc vẽ. Nâng gói rồi quay lại vẽ tiếp.' : 'Bé vẫn đọc được truyện, cảnh chưa có tranh sẽ hiện nền màu.'}
              </Text>
            </View>
          </View>
          <HeyButton
            title={`Vẽ tiếp ${missing.length} cảnh${costText(missing.length)}`}
            iconName="brush-outline"
            size="sm"
            onPress={() => void drawAll('Đang vẽ tiếp tranh cho truyện')}
            loading={busy === 'draw'}
            disabled={locked || lackCredit}
            style={styles.selfStart}
          />
        </HeyCard>
      )}

      {/* Tranh từng cảnh (Web ScenePicture) */}
      {showScenes && (
        <HeyCard style={styles.card}>
          <Text style={styles.heading} accessibilityRole="header">
            Tranh minh hoạ ({scenes.filter((s) => sceneState(s) === 'ready').length}/{scenes.length} cảnh)
          </Text>
          {scenes.map((scene) => {
            const st = sceneState(scene);
            const inProgress = st === 'drawing' || st === 'waiting';
            return (
              <View key={scene.id} style={styles.scene}>
                {st === 'ready' ? (
                  <Image source={{ uri: scene.imageUrl as string }} style={styles.sceneImg} accessibilityLabel={`Tranh cảnh ${scene.sceneOrder ?? ''}`} />
                ) : (
                  <View style={[styles.sceneImg, styles.scenePlaceholder]}>
                    {inProgress ? (
                      <ActivityIndicator color={Colors.brandStrong} />
                    ) : (
                      <Icon name={st === 'failed' ? 'alert-circle-outline' : 'image-outline'} size={28} color={st === 'failed' ? Colors.danger : Colors.textMuted} />
                    )}
                    <Text style={[styles.muted, styles.center, st === 'failed' && styles.dangerText]}>{SCENE_TEXT[st]}</Text>
                  </View>
                )}
                <View style={styles.rowBetween}>
                  <Text style={styles.muted}>Tranh cảnh {scene.sceneOrder ?? '?'}</Text>
                  {canDrawScene(scene) && !inProgress && (
                    <HeyButton
                      title={`${scene.imageUrl ? 'Vẽ lại cảnh' : 'Vẽ tranh'}${costText(1)}`}
                      iconName="refresh"
                      variant={scene.imageUrl ? 'tertiary' : 'primary'}
                      size="sm"
                      onPress={() => void redraw(scene)}
                      loading={busy === `scene:${scene.id}`}
                      disabled={locked}
                    />
                  )}
                </View>
              </View>
            );
          })}
        </HeyCard>
      )}

      {!!pollStop && (
        <View style={styles.row}>
          <Text style={[styles.muted, styles.flex1]}>
            {pollStop === 'limit' ? 'Đã tạm dừng tự cập nhật tiến độ.' : 'Mất kết nối khi cập nhật tiến độ.'} Việc vẽ / đọc vẫn chạy ở máy chủ.
          </Text>
          <HeyButton title="Cập nhật lại" iconName="refresh" variant="tertiary" size="sm" onPress={() => { setPollStop(null); setEpoch((e) => e + 1); void reload().catch(() => {}); }} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  flex1: { flex: 1 },
  card: { gap: Spacing.sm },
  cardDanger: { borderColor: Colors.danger },
  cardWarn: { borderColor: Colors.warning, backgroundColor: Colors.warningTint },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, flexWrap: 'wrap' },
  heading: { ...Typography.bodyStrong, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  center: { textAlign: 'center' },
  dangerText: { color: Colors.danger },
  selfStart: { alignSelf: 'flex-start' },
  scene: { gap: Spacing.xs },
  sceneImg: { width: '100%', aspectRatio: 4 / 3, borderRadius: Radius.md, backgroundColor: Colors.surfaceMuted },
  scenePlaceholder: { alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.lg },
});
