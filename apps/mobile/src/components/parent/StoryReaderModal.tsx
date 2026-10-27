// apps/mobile/src/components/parent/StoryReaderModal.tsx
// Trình đọc truyện của phụ huynh (đọc thử / đọc cùng bé). R7: nền giấy, chữ lớn chỉnh được (A−/A+), điều khiển ẩn/hiện khi chạm nội dung,
// tranh là trọng tâm, nút trang + "Nghe đọc" ≥ 44pt. Không ghi tiến độ/EQ lên BE (chỉ xem); giọng đọc là TTS của thiết bị (expo-speech).
// Hiển thị bằng lớp phủ TRONG cây (không dùng <Modal>): tránh lỗi Modal kẹt 0×0 trên Android New Arch (CRIT-1). Props giữ nguyên như trước.
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, BackHandler, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Story, StoryPageBranchChoice } from '../../types/domain';
import { Colors } from '../../theme/colors';
import { Elevation } from '../../theme/shadows';
import { Radius, Spacing, Touch } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { Icon } from '../ui/Icon';
import { StateView } from '../ui/StateView';
import { speechTTS } from '../../utils/speech-tts';
import { soundFX } from '../../utils/sound-fx';

interface StoryReaderModalProps {
  story: Story | null;
  visible: boolean;
  onClose: () => void;
}

/** Cỡ chữ thân truyện (px); dòng cao = 1.6 × cỡ. Mặc định 20 (Reader R1). */
const FONT_SIZES = [18, 20, 24, 28];
const DEFAULT_FONT_INDEX = 1;
const MAX_READING_WIDTH = 720;

export const StoryReaderModal: React.FC<StoryReaderModalProps> = ({ story, visible, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [fontIndex, setFontIndex] = useState(DEFAULT_FONT_INDEX);
  const [controlsShown, setControlsShown] = useState(true);
  const [screenReader, setScreenReader] = useState(false);
  const rootRef = useRef<View>(null);

  useEffect(() => {
    if (story) {
      setCurrentPage(0);
      setIsPlayingAudio(false);
      setControlsShown(true);
    }
  }, [story?.id]);

  // Người dùng trình đọc màn hình luôn thấy điều khiển (không có cách "chạm để hiện")
  // (Web: react-native-web luôn báo "đang bật" nên bỏ qua; người dùng bàn phím được hiện lại điều khiển bằng Tab/mũi tên, xem bên dưới)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let alive = true;
    AccessibilityInfo.isScreenReaderEnabled().then((v) => alive && setScreenReader(v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  const open = !!story && visible !== false;

  const close = () => {
    soundFX.playPop();
    speechTTS.stop();
    setIsPlayingAudio(false);
    onClose();
  };

  // Android Back đóng trình đọc (trước đây do Modal.onRequestClose xử lý)
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [open]);

  // Web: khi trình đọc mở, phần còn lại của app không nhận focus bàn phím (inert + aria-hidden); phím mũi tên lật trang, Esc đóng, Tab hiện điều khiển
  useEffect(() => {
    if (Platform.OS !== 'web' || !open) return;
    const el = rootRef.current as unknown as HTMLElement | null;
    const others = el?.parentElement ? (Array.from(el.parentElement.children) as HTMLElement[]).filter((c) => c !== el) : [];
    others.forEach((c) => {
      c.setAttribute('inert', '');
      c.setAttribute('aria-hidden', 'true');
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') setCurrentPage((p) => Math.min((story?.pages?.length ?? 1) - 1, p + 1));
      else if (e.key === 'ArrowLeft') setCurrentPage((p) => Math.max(0, p - 1));
      else if (e.key === 'Tab') setControlsShown(true);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      others.forEach((c) => {
        c.removeAttribute('inert');
        c.removeAttribute('aria-hidden');
      });
    };
  }, [open, story?.id]);

  if (!story || !open) return null;

  const pages = story.pages ?? [];
  const total = pages.length;
  const index = Math.min(currentPage, Math.max(0, total - 1));
  const page = pages[index];
  const size = FONT_SIZES[fontIndex];
  const showControls = controlsShown || screenReader;
  const imageUri = page?.illustrationUrl || story.coverImageUrl;
  const meta = [story.theme, story.targetAgeGroup ? `${story.targetAgeGroup} tuổi` : ''].filter(Boolean).join(' • ');

  const handlePlayVoice = (text: string) => {
    soundFX.playCoin();
    if (isPlayingAudio) {
      speechTTS.stop();
      setIsPlayingAudio(false);
    } else {
      speechTTS.speak(text, {
        onStart: () => setIsPlayingAudio(true),
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    }
  };

  const goTo = (next: number) => {
    soundFX.playPageFlip();
    speechTTS.stop();
    setIsPlayingAudio(false);
    setCurrentPage(Math.max(0, Math.min(total - 1, next)));
  };

  const hide = showControls ? null : ({ opacity: 0 } as const);

  return (
    <View ref={rootRef} style={styles.overlay} accessibilityViewIsModal aria-modal accessibilityLabel={`Đọc truyện ${story.title}`}>
      {/* Thanh trên: đóng, tên truyện, chỉnh cỡ chữ */}
      <View style={[styles.topBar, hide]} pointerEvents={showControls ? 'auto' : 'none'} accessibilityElementsHidden={!showControls} importantForAccessibility={showControls ? 'auto' : 'no-hide-descendants'}>
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Đóng trình đọc" style={(s) => [styles.iconBtn, s.pressed && styles.pressed, focusRing(s)]}>
          <Icon name="close" size={24} color={Colors.text} />
        </Pressable>
        <View style={styles.titleBox}>
          {!!meta && (
            <Text style={styles.meta} numberOfLines={1}>
              {meta}
            </Text>
          )}
          <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
            {story.title}
          </Text>
        </View>
        <Pressable
          onPress={() => setFontIndex((i) => Math.max(0, i - 1))}
          disabled={fontIndex === 0}
          accessibilityRole="button"
          accessibilityLabel={`Giảm cỡ chữ, hiện ${size}`}
          style={(s) => [styles.iconBtn, fontIndex === 0 && styles.disabled, s.pressed && styles.pressed, focusRing(s)]}
        >
          <Text style={styles.fontBtnSmall}>A</Text>
        </Pressable>
        <Pressable
          onPress={() => setFontIndex((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
          disabled={fontIndex === FONT_SIZES.length - 1}
          accessibilityRole="button"
          accessibilityLabel={`Tăng cỡ chữ, hiện ${size}`}
          style={(s) => [styles.iconBtn, fontIndex === FONT_SIZES.length - 1 && styles.disabled, s.pressed && styles.pressed, focusRing(s)]}
        >
          <Text style={styles.fontBtnLarge}>A</Text>
        </Pressable>
      </View>

      {total === 0 ? (
        <StateView variant="empty" title="Truyện chưa có trang nào" description="Khi truyện được viết xong, ba mẹ có thể đọc thử ở đây." />
      ) : (
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.column}>
            {/* Tranh là trọng tâm: chiếm bề ngang đầy đủ, tỉ lệ 4:3 */}
            <View style={styles.imageBox}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" accessible={false} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]} accessible={false}>
                  <Icon name="book-outline" size={56} color={Colors.brandStrong} />
                </View>
              )}
            </View>

            {/* Chạm vào chữ để ẩn/hiện điều khiển */}
            <Pressable
              onPress={() => setControlsShown((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={`Trang ${index + 1} trên ${total}. ${page?.text || 'Trang chưa có chữ'}`}
              accessibilityHint={controlsShown ? 'Chạm để ẩn điều khiển' : 'Chạm để hiện điều khiển'}
              style={(s) => [styles.paper, focusRing(s)]}
            >
              <Text style={[styles.pageText, !page?.text && styles.pageEmpty, { fontSize: size, lineHeight: Math.round(size * 1.6) }]}>{page?.text || '(trang chưa có chữ)'}</Text>
            </Pressable>

            {/* Rẽ nhánh (nếu truyện có): giữ hành vi cũ, chỉ phát âm thanh phản hồi */}
            {page?.choices?.map((ch: StoryPageBranchChoice) => (
              <Pressable
                key={ch.id}
                onPress={() => soundFX.playSparkle()}
                accessibilityRole="button"
                accessibilityLabel={`Rẽ nhánh tương tác: ${ch.label}`}
                style={(s) => [styles.choice, s.pressed && styles.pressed, focusRing(s)]}
              >
                <Text style={styles.choiceHeader}>Rẽ nhánh tương tác ({ch.eqSignal})</Text>
                <Text style={styles.choiceLabel}>{ch.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Thanh dưới: tiến độ trang, trước / nghe đọc / sau */}
      {total > 0 && (
        <View style={[styles.bottomBar, hide]} pointerEvents={showControls ? 'auto' : 'none'} accessibilityElementsHidden={!showControls} importantForAccessibility={showControls ? 'auto' : 'no-hide-descendants'}>
          <Text style={styles.pageLabel} accessibilityLiveRegion="polite">
            Trang {index + 1}/{total}
          </Text>
          <View style={styles.track} accessible accessibilityRole="progressbar" accessibilityLabel={`Trang ${index + 1} trên ${total}`} accessibilityValue={{ min: 1, max: total, now: index + 1 }}>
            <View style={[styles.fill, { width: `${((index + 1) / total) * 100}%` }]} />
          </View>
          <View style={styles.controls}>
            <Pressable
              onPress={() => goTo(index - 1)}
              disabled={index === 0}
              accessibilityRole="button"
              accessibilityLabel="Trang trước"
              style={(s) => [styles.navBtn, index === 0 && styles.disabled, s.pressed && styles.pressed, focusRing(s)]}
            >
              <Icon name="chevron-back" size={26} color={Colors.text} />
            </Pressable>
            <Pressable
              onPress={() => handlePlayVoice(page?.text || '')}
              accessibilityRole="button"
              accessibilityLabel={isPlayingAudio ? 'Dừng đọc' : 'Nghe đọc'}
              accessibilityState={{ selected: isPlayingAudio }}
              style={(s) => [styles.audioBtn, isPlayingAudio && styles.audioBtnActive, s.pressed && styles.pressed, focusRing(s)]}
            >
              <Icon name={isPlayingAudio ? 'stop' : 'volume-high'} size={22} color={isPlayingAudio ? Colors.onStrong : Colors.text} />
              <Text style={[styles.audioText, isPlayingAudio && styles.audioTextActive]}>{isPlayingAudio ? 'Dừng đọc' : 'Nghe đọc'}</Text>
            </Pressable>
            <Pressable
              onPress={() => goTo(index + 1)}
              disabled={index === total - 1}
              accessibilityRole="button"
              accessibilityLabel="Trang sau"
              style={(s) => [styles.navBtn, styles.navBtnNext, index === total - 1 && styles.disabled, s.pressed && styles.pressed, focusRing(s)]}
            >
              <Icon name="chevron-forward" size={26} color={Colors.onStrong} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, elevation: 24, backgroundColor: Colors.surfaceWarm },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  iconBtn: { width: Touch.min, height: Touch.min, borderRadius: Touch.min / 2, alignItems: 'center', justifyContent: 'center' },
  titleBox: { flex: 1, minWidth: 0 },
  // brandStrong trên giấy 4.90:1 (trước: primary 2.47:1)
  meta: { ...Typography.caption, color: Colors.brandStrong },
  title: { ...Typography.heading, color: Colors.text },
  fontBtnSmall: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.text },
  fontBtnLarge: { fontFamily: FontFamily.bold, fontSize: 24, color: Colors.text },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.35 },
  scrollContent: { paddingHorizontal: Spacing.page, paddingBottom: Spacing.lg },
  column: { width: '100%', maxWidth: MAX_READING_WIDTH, alignSelf: 'center', gap: Spacing.md },
  imageBox: { width: '100%', aspectRatio: 4 / 3, borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: Colors.brandTint },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.brandTint },
  paper: { padding: Spacing.lg, borderRadius: Radius.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.outline },
  pageText: { ...Typography.reader, color: Colors.text },
  pageEmpty: { color: Colors.textMuted },
  choice: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.outline, backgroundColor: Colors.infoTint, minHeight: Touch.min, alignItems: 'center', justifyContent: 'center', gap: 2 },
  choiceHeader: { ...Typography.caption, color: Colors.text },
  choiceLabel: { ...Typography.bodyStrong, color: Colors.text, textAlign: 'center' },
  bottomBar: { padding: Spacing.page, paddingTop: Spacing.sm, gap: Spacing.sm, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.outline, ...Elevation.low },
  pageLabel: { ...Typography.label, color: Colors.text, textAlign: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: Colors.outline, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: Colors.brandStrong },
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, width: '100%', maxWidth: MAX_READING_WIDTH, alignSelf: 'center' },
  navBtn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.outlineStrong, backgroundColor: Colors.surface },
  navBtnNext: { backgroundColor: Colors.tealStrong, borderColor: Colors.tealStrong },
  audioBtn: { flex: 1, minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: 28, borderWidth: 1.5, borderColor: Colors.outlineStrong, backgroundColor: Colors.surface },
  // Nền brandStrong + chữ trắng 5.18:1 (trước: trắng trên primary 2.61:1, audit B1)
  audioBtnActive: { backgroundColor: Colors.brandStrong, borderColor: Colors.brandStrong },
  audioText: { ...Typography.label, fontFamily: FontFamily.extraBold, color: Colors.text },
  audioTextActive: { color: Colors.onStrong },
});
