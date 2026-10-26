// apps/mobile/src/screens/kid/KidModeScreen.tsx — v2.0 Fairy Garden Theme
// Kid Mode: tủ sách → đọc truyện → điểm dừng EQ. Dữ liệu qua `source` (kidService thật; UI Preview dùng fixture).
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ChildProfile } from '../../types/domain';
import { Colors } from '../../theme/colors';
import { authService } from '../../services/authService';
import { ApiError } from '../../services/apiClient';
import { childEmoji } from '../../utils/child';
import { KidCheckpointCard } from '../../components/kid/KidCheckpointCard';
import type { KidShelfItemDto } from '../../types/api';
import type { KidDataSource } from '../../types/viewModels';
import { useKidReader } from './useKidReader';

interface KidModeScreenProps {
  child: ChildProfile;
  /** Nguồn dữ liệu: kidService (BE) ở Kid Mode thật; fixture ở UI Preview */
  source: KidDataSource;
  // Reject khi BE từ chối/lỗi; resolve khi BE đã xác minh PIN (màn này sẽ được gỡ)
  onExitKidMode: (pin: string) => Promise<void>;
  // Kid session mất/hết hạn: không thể thoát bằng PIN → App xóa phiên và buộc đăng nhập lại bằng mật khẩu
  onKidSessionLost: () => void;
  /**
   * CHỈ cho UI Preview (dev-only, ADR-020): có giá trị = đây KHÔNG phải Kid Mode thật.
   * Không có PIN, không phiên Kid, không gọi API; nút thoát đóng preview trực tiếp.
   */
  preview?: { onExit: () => void };
}

// Animated Story Card với stagger effect
const AnimatedStoryCard: React.FC<{
  item: KidShelfItemDto;
  index: number;
  loading: boolean;
  onPress: () => void;
}> = ({ item, index, loading, onPress }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(28);
  const scale = useSharedValue(0.94);

  useEffect(() => {
    const delay = index * 90;
    opacity.value = withDelay(delay, withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 90 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 14, stiffness: 110 }));
  }, []);

  const pressScale = useSharedValue(1);

  const handlePress = () => {
    pressScale.value = withSequence(
      withSpring(0.94, { damping: 8, stiffness: 200 }),
      withSpring(1.0, { damping: 12, stiffness: 160 })
    );
    onPress();
  };

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value * pressScale.value },
    ] as any,
  }));

  const cover = item.coverImageUrl || item.cover?.imageUrl;
  const progress = item.readingProgress;
  const pillText = progress?.isCompleted ? '↺ Đọc lại' : progress && progress.progressPercentage > 0 ? `▶ Đọc tiếp · ${progress.progressPercentage}%` : '▶ Đọc ngay';

  return (
    <TouchableOpacity activeOpacity={1} onPress={handlePress} disabled={loading} style={styles.storyCardTouch}>
      <Animated.View style={[styles.storyCard, animStyle]}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverImage, extra.coverPlaceholder]}>
            <Text style={extra.placeholderEmoji}>📖</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.storyCardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.playPill}>
            {loading ? <ActivityIndicator size="small" color={Colors.textOnYellow} /> : <Text style={styles.playPillText}>{pillText}</Text>}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const KidModeScreen: React.FC<KidModeScreenProps> = ({
  child,
  source,
  onExitKidMode,
  onKidSessionLost,
  preview: previewProp,
}) => {
  // Phòng thủ chiều sâu: prop preview bỏ qua PIN nên bị vô hiệu hóa hoàn toàn ngoài __DEV__
  const preview = __DEV__ ? previewProp : undefined;
  const reader = useKidReader(source);
  const { play, page } = reader;

  // PIN Lock
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const lockedUntilRef = useRef(0);
  const verifyingPinRef = useRef(false);
  const [sessionLost, setSessionLost] = useState(false);

  // Header entrance animation
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    headerTranslateY.value = withSpring(0, { damping: 16, stiffness: 90 });
  }, []);

  const handleVerifyPin = async (pin: string) => {
    if (verifyingPinRef.current) return;
    verifyingPinRef.current = true;
    try {
      await onExitKidMode(pin);
    } catch (err) {
      // BE từ chối hoặc lỗi: không coi PIN là hợp lệ, giữ nguyên Kid Mode
      if (authService.isKidSessionLost(err)) {
        // Không phải PIN sai: kid session không còn hợp lệ → chỉ còn cách đăng nhập lại
        setSessionLost(true);
        setEnteredPin('');
        return;
      }
      // BE trả sẵn thông báo: "Còn N lần thử" (401, kèm attemptsLeft) hoặc khóa tạm (429, kèm retryAfterSeconds)
      if (err instanceof ApiError && err.status === 429) {
        const wait = err.errors?.[0]?.retryAfterSeconds;
        lockedUntilRef.current = Date.now() + (typeof wait === 'number' ? wait : 900) * 1000;
      }
      setPinMessage(err instanceof Error && err.message ? err.message : 'Chưa xác nhận được mã PIN. Ba mẹ thử lại nhé.');
      setPinError(true);
      setTimeout(() => {
        setEnteredPin('');
        setPinError(false);
      }, 900);
    } finally {
      verifyingPinRef.current = false;
    }
  };

  // BE chấp nhận PIN 4–6 số (auth.validation exitKidMode) → nhập tối đa 6 số rồi bấm "Xác nhận"
  const handlePressPinKey = (num: string) => {
    if (sessionLost || verifyingPinRef.current || Date.now() < lockedUntilRef.current) return;
    if (enteredPin.length < 6) setEnteredPin(enteredPin + num);
  };

  const confirmPin = () => {
    if (sessionLost || enteredPin.length < 4 || Date.now() < lockedUntilRef.current) return;
    void handleVerifyPin(enteredPin);
  };

  const closePinModal = () => {
    setShowPinModal(false);
    setPinMessage(null);
    setEnteredPin('');
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }] as any,
  }));

  const nextLabel = reader.openCheckpoint
    ? ''
    : reader.pendingCheckpoint
      ? 'Trả lời câu hỏi 🌟'
      : reader.isLast
        ? 'Đọc xong 🎉'
        : 'Trang sau 👉';

  return (
    <View style={styles.container}>

      {preview && (
        <View style={styles.previewBanner}>
          <Text style={styles.previewBannerText}>UI Preview – dữ liệu mẫu (không phải Chế độ Trẻ Em thật)</Text>
        </View>
      )}

      {/* ── HEADER ── */}
      <Animated.View style={[styles.topHeader, headerStyle]}>
        {/* Left: Avatar + Greeting */}
        <View style={styles.avatarRow}>
          <View style={styles.kidAvatar}>
            <Text style={styles.avatarEmoji}>{childEmoji(child)}</Text>
          </View>
          <View>
            <Text style={styles.kidGreeting}>
              Chào {child?.name || 'Bé yêu'}! 🌸
            </Text>
          </View>
        </View>

        {/* Right: Exit */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => (preview ? preview.onExit() : setShowPinModal(true))}
            style={styles.exitBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.exitBtnText}>{preview ? '↩ Thoát Preview' : '🔒 Thoát'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {reader.lost && !preview && (
        <View style={extra.lostBanner}>
          <Text style={extra.lostText}>Phiên Chế độ Bé không còn hợp lệ. Ba mẹ đăng nhập lại bằng mật khẩu để tiếp tục.</Text>
          <TouchableOpacity onPress={onKidSessionLost} style={extra.lostBtn} activeOpacity={0.85}>
            <Text style={extra.lostBtnText}>Đăng nhập lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── MAIN CONTENT ── */}
      {!play ? (
        /* Story Shelf View */
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.scrollList}
          showsVerticalScrollIndicator={false}
        >
          {/* Decorative cloud row */}
          <View style={styles.cloudRow} pointerEvents="none">
            <Text style={styles.cloudDecor}>☁️</Text>
            <Text style={[styles.cloudDecor, { marginLeft: 60, marginTop: -8 }]}>⛅</Text>
            <Text style={[styles.cloudDecor, { marginLeft: 80 }]}>☁️</Text>
          </View>

          <Text style={styles.shelfTitle}>Tủ sách của {child?.name || 'bé'} 📚</Text>

          {!!reader.actionError && <Text style={extra.errorText}>{reader.actionError}</Text>}

          {reader.shelfStatus === 'loading' && reader.shelf.length === 0 && (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>Đang mở tủ sách...</Text>
            </View>
          )}

          {reader.shelfStatus === 'error' && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>☁️</Text>
              <Text style={styles.emptyTitle}>Chưa mở được tủ sách</Text>
              <Text style={styles.emptySubtitle}>{reader.shelfError}</Text>
              {!reader.lost && (
                <TouchableOpacity onPress={() => void reader.reloadShelf()} style={extra.retryBtn} activeOpacity={0.85}>
                  <Text style={extra.retryText}>Thử lại</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.grid}>
            {reader.shelf.map((item, index) => (
              <AnimatedStoryCard
                key={item.storyId}
                item={item}
                index={index}
                loading={reader.startingId === item.storyId}
                onPress={() => void reader.open(item.storyId)}
              />
            ))}
          </View>

          {reader.shelfStatus === 'ready' && reader.shelf.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>Tủ sách còn trống</Text>
              <Text style={styles.emptySubtitle}>
                Ba mẹ đưa truyện lên tủ sách cho bé ở mục Tủ truyện nhé.
              </Text>
            </View>
          )}
        </ScrollView>
      ) : reader.finished ? (
        <View style={extra.doneBox}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>Bé đọc xong rồi!</Text>
          <Text style={styles.emptySubtitle}>{play.story.title}</Text>
          <TouchableOpacity onPress={reader.closeStory} style={extra.retryBtn} activeOpacity={0.85}>
            <Text style={extra.retryText}>Về tủ sách</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Reading View */
        <View style={styles.readingContainer}>
          {/* Reader Header */}
          <View style={styles.readerHeader}>
            <TouchableOpacity
              onPress={reader.closeStory}
              style={styles.backToShelfBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.backToShelfText}>← Tủ truyện</Text>
            </TouchableOpacity>
            <Text style={styles.readingStoryTitle} numberOfLines={1}>
              {play.story.title}
            </Text>
            {/* Page progress pill */}
            <View style={styles.pageProgressPill}>
              <Text style={styles.pageProgressText}>
                {reader.pageIndex + 1}/{reader.pageCount}
              </Text>
            </View>
          </View>

          <ScrollView style={styles.pageScroll} showsVerticalScrollIndicator={false}>
            {/* Illustration Card — NO hard border */}
            <View style={styles.pageIllustrationBox}>
              {page?.imageUrl ? (
                <Image source={{ uri: page.imageUrl }} style={styles.pageImage} resizeMode="cover" />
              ) : (
                <View style={[styles.pageImage, extra.coverPlaceholder]}>
                  <Text style={extra.placeholderEmoji}>🌈</Text>
                </View>
              )}
            </View>

            {/* Story text card */}
            <View style={styles.pageTextBox}>
              <Text style={styles.pageText}>{page?.text}</Text>
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

            {!reader.openCheckpoint && !!reader.actionError && <Text style={extra.errorText}>{reader.actionError}</Text>}

            {/* Bottom padding */}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Page Navigation Buttons */}
          {!reader.openCheckpoint && (
            <View style={styles.readingNav}>
              <TouchableOpacity
                disabled={reader.pageIndex === 0}
                onPress={reader.prev}
                style={[
                  styles.kidNavBtn,
                  reader.pageIndex === 0 && styles.kidNavBtnDisabled,
                ]}
                activeOpacity={0.85}
              >
                <Text style={styles.kidNavBtnText}>👈 Trang trước</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={reader.submitting}
                onPress={reader.next}
                style={[styles.kidNavBtn, styles.kidNavBtnNext, reader.submitting && styles.kidNavBtnDisabled]}
                activeOpacity={0.85}
              >
                {reader.submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.kidNavBtnText, styles.kidNavBtnNextText]}>{nextLabel}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── Parental PIN Modal ── */}
      <Modal visible={showPinModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pinModal}>
            {/* Mascot at top of modal */}
            <View style={styles.pinMascotRow}>
              <Text style={styles.pinMascotEmoji}>🐶</Text>
            </View>

            <Text style={styles.pinTitle}>Khoá Phụ Huynh</Text>
            <Text style={styles.pinSubtitle}>
              Nhập mã PIN của ba mẹ (4–6 số) để thoát
            </Text>

            {!!pinMessage && !sessionLost && (
              <Text style={[styles.pinSubtitle, { color: '#B91C1C', marginBottom: 12 }]}>{pinMessage}</Text>
            )}

            {sessionLost && (
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.pinSubtitle, { color: '#B91C1C', marginBottom: 8 }]}>
                  Phiên Chế độ Bé không còn hợp lệ nên không thể xác nhận bằng mã PIN.
                </Text>
                <TouchableOpacity
                  onPress={onKidSessionLost}
                  activeOpacity={0.8}
                  style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#2563EB' }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                    Đăng nhập lại bằng mật khẩu
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PIN dots */}
            <View style={styles.dotsRow}>
              {Array.from({ length: Math.max(4, enteredPin.length) }, (_, idx) => idx).map((idx) => (
                <View
                  key={idx}
                  style={[
                    styles.pinDot,
                    enteredPin.length > idx && styles.pinDotFilled,
                    pinError && styles.pinDotError,
                  ]}
                />
              ))}
            </View>

            {/* Keypad */}
            <View style={styles.keypad}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(
                (key) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      if (verifyingPinRef.current) return;
                      if (key === 'C') setEnteredPin('');
                      else if (key === '⌫') setEnteredPin((p) => p.slice(0, -1));
                      else handlePressPinKey(key);
                    }}
                    style={styles.keyBtn}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.keyText}>{key}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
            <View style={extra.pinActions}>
              <TouchableOpacity onPress={closePinModal} style={[styles.keyBtn, styles.keyBtnCancel, extra.pinActionBtn]} activeOpacity={0.75}>
                <Text style={[styles.keyText, styles.keyTextCancel]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmPin}
                disabled={enteredPin.length < 4}
                style={[extra.pinConfirm, enteredPin.length < 4 && styles.kidNavBtnDisabled]}
                activeOpacity={0.85}
              >
                <Text style={extra.pinConfirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const extra = StyleSheet.create({
  pinActions: { flexDirection: 'row', gap: 10, width: '100%', alignItems: 'center' },
  pinActionBtn: { flex: 1, width: undefined, aspectRatio: undefined, paddingVertical: 14, marginBottom: 0 },
  pinConfirm: { flex: 2, backgroundColor: Colors.secondary, borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  pinConfirmText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF9E0' },
  placeholderEmoji: { fontSize: 44 },
  errorText: { color: '#B91C1C', fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  retryBtn: { marginTop: 14, backgroundColor: Colors.primary, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: Colors.textOnYellow, fontWeight: '900', fontSize: 14 },
  doneBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  lostBanner: { backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  lostText: { flex: 1, fontSize: 12, color: '#B91C1C', fontWeight: '700' },
  lostBtn: { backgroundColor: '#2563EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  lostBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
});

const styles = StyleSheet.create({
  previewBanner: {
    backgroundColor: '#7C3AED',
    paddingVertical: 6,
    alignItems: 'center',
  },
  previewBannerText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  container: {
    flex: 1,
    backgroundColor: '#FAFFFE', // Fairy Garden cream background
  },

  // ── HEADER ──
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 18,
    backgroundColor: '#FFF9E0',
    boxShadow: '0 6px 14px rgba(255, 217, 61, 0.18)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kidAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    boxShadow: '0 3px 8px rgba(255, 217, 61, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255, 217, 61, 0.40)',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  kidGreeting: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  starText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textOnYellow,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    boxShadow: '0 2px 6px rgba(107, 203, 119, 0.15)',
  },
  timerIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  exitBtn: {
    backgroundColor: '#FFB3C6',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    boxShadow: '0 3px 8px rgba(255, 107, 138, 0.25)',
  },
  exitBtnText: {
    color: '#8B0038',
    fontSize: 11,
    fontWeight: '900',
  },

  // ── STORY SHELF ──
  body: { flex: 1 },
  scrollList: {
    padding: 16,
    paddingBottom: 30,
  },
  cloudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    opacity: 0.6,
  },
  cloudDecor: {
    fontSize: 22,
  },
  shelfTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  storyCardTouch: {
    width: '48%',
    marginBottom: 16,
  },
  storyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: '0 8px 18px rgba(255, 217, 61, 0.18)',
  },
  coverImage: {
    width: '100%',
    height: 126,
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'transparent',
    // Note: actual gradient would use expo-linear-gradient
  },
  cardContent: {
    padding: 12,
    alignItems: 'center',
  },
  storyCardTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
    minHeight: 34,
    lineHeight: 17,
  },
  playPill: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    boxShadow: '0 3px 6px rgba(245, 196, 0, 0.30)',
  },
  playPillText: {
    color: Colors.textOnYellow,
    fontSize: 11,
    fontWeight: '900',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── READING VIEW ──
  readingContainer: {
    flex: 1,
    padding: 14,
    paddingBottom: 8,
  },
  readerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backToShelfBtn: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.borderSunshine,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    boxShadow: '0 2px 6px rgba(255, 217, 61, 0.18)',
  },
  backToShelfText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.textOnYellow,
  },
  readingStoryTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  pageProgressPill: {
    backgroundColor: Colors.secondaryLight,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(107, 203, 119, 0.35)',
  },
  pageProgressText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.textOnGreen,
  },
  pageScroll: {
    flex: 1,
  },

  // Illustration — NO dark border
  pageIllustrationBox: {
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    marginBottom: 14,
    boxShadow: '0 8px 18px rgba(107, 203, 119, 0.18)',
  },
  pageImage: {
    width: '100%',
    height: '100%',
  },
  audioFab: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 8px rgba(245, 196, 0, 0.40)',
  },
  audioFabText: {
    fontSize: 20,
  },

  // Story text — NO dark border
  pageTextBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    boxShadow: '0 4px 12px rgba(107, 203, 119, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(107, 203, 119, 0.12)',
  },
  pageText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 30,
    color: Colors.textPrimary,
  },

  // EQ Choices — NO dark border
  choiceQuestion: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  choiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  kidChoiceBtn: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 18,
    padding: 13,
    alignItems: 'center',
  },
  choiceBtnLeft: {
    backgroundColor: Colors.lavenderLight,
    borderWidth: 1.5,
    borderColor: 'rgba(200, 168, 233, 0.50)',
    boxShadow: '0 4px 10px rgba(200, 168, 233, 0.15)',
  },
  choiceBtnRight: {
    backgroundColor: Colors.mintLight,
    borderWidth: 1.5,
    borderColor: 'rgba(126, 203, 161, 0.50)',
    boxShadow: '0 4px 10px rgba(126, 203, 161, 0.15)',
  },
  kidChoiceText: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Navigation buttons
  readingNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 4,
  },
  kidNavBtn: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 13,
    alignItems: 'center',
    boxShadow: '0 4px 10px rgba(107, 203, 119, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(107, 203, 119, 0.18)',
  },
  kidNavBtnNext: {
    backgroundColor: Colors.secondary,
    borderColor: 'rgba(77, 184, 90, 0.3)',
    boxShadow: '0 4px 10px rgba(77, 184, 90, 0.25)',
  },
  kidNavBtnDisabled: {
    opacity: 0.35,
  },
  kidNavBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  kidNavBtnNextText: {
    color: '#FFFFFF',
  },

  // ── PIN MODAL ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 62, 80, 0.60)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pinModal: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    boxShadow: '0 16px 32px rgba(107, 203, 119, 0.20)',
    borderWidth: 1.5,
    borderColor: 'rgba(107, 203, 119, 0.20)',
  },
  pinMascotRow: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    boxShadow: '0 4px 10px rgba(255, 217, 61, 0.28)',
  },
  pinMascotEmoji: {
    fontSize: 28,
  },
  pinTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  pinSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    marginBottom: 22,
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(107, 203, 119, 0.4)',
    backgroundColor: Colors.secondaryLight,
    marginHorizontal: 8,
  },
  pinDotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
    boxShadow: '0 2px 4px rgba(255, 217, 61, 0.40)',
  },
  pinDotError: {
    backgroundColor: Colors.error,
    borderColor: '#CC0000',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  keyBtn: {
    width: '30%',
    aspectRatio: 1.3,
    backgroundColor: Colors.background,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(107, 203, 119, 0.15)',
    boxShadow: '0 2px 6px rgba(107, 203, 119, 0.08)',
  },
  keyBtnCancel: {
    backgroundColor: '#FFF0F5',
    borderColor: 'rgba(255, 107, 107, 0.25)',
  },
  keyText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  keyTextCancel: {
    color: Colors.error,
  },
});
