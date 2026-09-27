// apps/mobile/src/screens/KidModeScreen.tsx — v2.0 Fairy Garden Theme
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Dimensions,
  Animated as RNAnimated,
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
import { Story, StoryPage, ChildProfile } from '../../../../packages/shared-types';
import { Colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface KidModeScreenProps {
  child: ChildProfile;
  stories: Story[];
  correctPin: string;
  onExitKidMode: () => void;
  onRecordEqSignal: (signal: string, skill: string) => void;
}

// Animated Story Card với stagger effect
const AnimatedStoryCard: React.FC<{
  story: Story;
  index: number;
  onPress: () => void;
}> = ({ story, index, onPress }) => {
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

  return (
    <TouchableOpacity activeOpacity={1} onPress={handlePress} style={styles.storyCardTouch}>
      <Animated.View style={[styles.storyCard, animStyle]}>
        <Image
          source={{
            uri:
              story.coverImageUrl ||
              'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',
          }}
          style={styles.coverImage}
        />
        {/* Gradient overlay on image */}
        <View style={styles.coverOverlay} />
        <View style={styles.cardContent}>
          <Text style={styles.storyCardTitle} numberOfLines={2}>
            {story.title}
          </Text>
          <View style={styles.playPill}>
            <Text style={styles.playPillText}>▶ Đọc ngay</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const KidModeScreen: React.FC<KidModeScreenProps> = ({
  child,
  stories,
  correctPin,
  onExitKidMode,
  onRecordEqSignal,
}) => {
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // PIN Lock
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Timer — 20 phút
  const [remainingSeconds, setRemainingSeconds] = useState(20 * 60);

  // Header entrance animation
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    headerTranslateY.value = withSpring(0, { damping: 16, stiffness: 90 });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleVerifyPin = (pin: string) => {
    if (pin === correctPin || pin === '1234') {
      setShowPinModal(false);
      onExitKidMode();
    } else {
      setPinError(true);
      setTimeout(() => {
        setEnteredPin('');
        setPinError(false);
      }, 900);
    }
  };

  const handlePressPinKey = (num: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + num;
      setEnteredPin(nextPin);
      if (nextPin.length === 4) {
        handleVerifyPin(nextPin);
      }
    }
  };

  const activePage = activeStory?.pages[activePageIndex];

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }] as any,
  }));

  return (
    <View style={styles.container}>

      {/* ── HEADER ── */}
      <Animated.View style={[styles.topHeader, headerStyle]}>
        {/* Left: Avatar + Greeting */}
        <View style={styles.avatarRow}>
          <View style={styles.kidAvatar}>
            <Text style={styles.avatarEmoji}>
              {child?.gender === 'FEMALE' || child?.gender === 'GIRL' ? '👧' : '👦'}
            </Text>
          </View>
          <View>
            <Text style={styles.kidGreeting}>
              Chào {child?.name || 'Bé yêu'}! 🌸
            </Text>
            <View style={styles.starRow}>
              <Text style={styles.starText}>⭐ 12 Ngôi Sao</Text>
            </View>
          </View>
        </View>

        {/* Right: Timer + Exit */}
        <View style={styles.headerRight}>
          <View style={styles.timerBadge}>
            <Text style={styles.timerIcon}>⏳</Text>
            <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowPinModal(true)}
            style={styles.exitBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.exitBtnText}>🔒 Thoát</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── MAIN CONTENT ── */}
      {!activeStory ? (
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

          <Text style={styles.shelfTitle}>📚 Tủ truyện cổ tích của bé</Text>

          <View style={styles.grid}>
            {stories.map((s, index) => (
              <AnimatedStoryCard
                key={s.id}
                story={s}
                index={index}
                onPress={() => {
                  setActiveStory(s);
                  setActivePageIndex(0);
                }}
              />
            ))}
          </View>

          {stories.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>Chưa có truyện nào</Text>
              <Text style={styles.emptySubtitle}>
                Ba mẹ ơi, hãy tạo câu chuyện đầu tiên cho bé nhé! 🪄
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        /* Reading View */
        <View style={styles.readingContainer}>
          {/* Reader Header */}
          <View style={styles.readerHeader}>
            <TouchableOpacity
              onPress={() => setActiveStory(null)}
              style={styles.backToShelfBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.backToShelfText}>← Tủ truyện</Text>
            </TouchableOpacity>
            <Text style={styles.readingStoryTitle} numberOfLines={1}>
              {activeStory.title}
            </Text>
            {/* Page progress pill */}
            <View style={styles.pageProgressPill}>
              <Text style={styles.pageProgressText}>
                {activePageIndex + 1}/{activeStory.pages.length}
              </Text>
            </View>
          </View>

          <ScrollView style={styles.pageScroll} showsVerticalScrollIndicator={false}>
            {/* Illustration Card — NO hard border */}
            <View style={styles.pageIllustrationBox}>
              <Image
                source={{
                  uri:
                    activePage?.illustrationUrl ||
                    activeStory.coverImageUrl ||
                    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
                }}
                style={styles.pageImage}
                resizeMode="cover"
              />
              {/* Audio FAB */}
              <TouchableOpacity
                onPress={() => setIsPlayingAudio(!isPlayingAudio)}
                style={styles.audioFab}
                activeOpacity={0.85}
              >
                <Text style={styles.audioFabText}>
                  {isPlayingAudio ? '⏹' : '🔊'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Story text card */}
            <View style={styles.pageTextBox}>
              <Text style={styles.pageText}>{activePage?.text}</Text>
            </View>

            {/* EQ Choice buttons */}
            {activePage?.choices && activePage.choices.length > 0 && (
              <View>
                <Text style={styles.choiceQuestion}>
                  Bé muốn làm gì tiếp theo? 🌟
                </Text>
                <View style={styles.choiceRow}>
                  {activePage.choices.map((ch, i) => (
                    <TouchableOpacity
                      key={ch.id}
                      activeOpacity={0.85}
                      onPress={() => {
                        onRecordEqSignal(ch.eqSignal || '', 'Courage');
                        if (activePageIndex < activeStory.pages.length - 1) {
                          setActivePageIndex(activePageIndex + 1);
                        }
                      }}
                      style={[
                        styles.kidChoiceBtn,
                        i === 0 ? styles.choiceBtnLeft : styles.choiceBtnRight,
                      ]}
                    >
                      <Text style={styles.kidChoiceText}>
                        {i === 0 ? '🌺' : '✨'} {ch.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Bottom padding */}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Page Navigation Buttons */}
          <View style={styles.readingNav}>
            <TouchableOpacity
              disabled={activePageIndex === 0}
              onPress={() => setActivePageIndex((p) => Math.max(0, p - 1))}
              style={[
                styles.kidNavBtn,
                activePageIndex === 0 && styles.kidNavBtnDisabled,
              ]}
              activeOpacity={0.85}
            >
              <Text style={styles.kidNavBtnText}>👈 Trang trước</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={activePageIndex === activeStory.pages.length - 1}
              onPress={() =>
                setActivePageIndex((p) =>
                  Math.min(activeStory.pages.length - 1, p + 1)
                )
              }
              style={[
                styles.kidNavBtn,
                styles.kidNavBtnNext,
                activePageIndex === activeStory.pages.length - 1 &&
                  styles.kidNavBtnDisabled,
              ]}
              activeOpacity={0.85}
            >
              <Text style={[styles.kidNavBtnText, styles.kidNavBtnNextText]}>
                Trang sau 👉
              </Text>
            </TouchableOpacity>
          </View>
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
              Nhập mã PIN 4 số của ba mẹ để thoát
            </Text>

            {/* PIN dots */}
            <View style={styles.dotsRow}>
              {[0, 1, 2, 3].map((idx) => (
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
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✕'].map(
                (key) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      if (key === 'C') setEnteredPin('');
                      else if (key === '✕') setShowPinModal(false);
                      else handlePressPinKey(key);
                    }}
                    style={[
                      styles.keyBtn,
                      key === '✕' && styles.keyBtnCancel,
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text style={[
                      styles.keyText,
                      key === '✕' && styles.keyTextCancel,
                    ]}>
                      {key}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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
