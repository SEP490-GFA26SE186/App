// apps/mobile/src/screens/ParentHomeScreen.tsx — VISUAL-FIRST (Minimal Text, Maximum Artwork) with Line-art Icons
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { CuteMascot } from '../components/CuteMascot';
import {
  UserAccount,
  ChildProfile,
  Story,
  PedagogicalTemplate,
} from '../../../../packages/shared-types';
import { soundFX } from '../../../../src/utils/sound-fx';

const { width: W } = Dimensions.get('window');
const CARD_W = Math.min(W * 0.52, 195);
const HERO_H = 220;

interface ParentHomeScreenProps {
  currentUser: UserAccount;
  childrenProfiles: ChildProfile[];
  stories: Story[];
  templates: PedagogicalTemplate[];
  onStartStoryWizard: () => void;
  onOpenKidMode: () => void;
  onNavigateTab: (tab: string) => void;
  onSelectStoryToRead: (story: Story) => void;
}

const CURATED_DEMO_STORIES = [
  {
    id: 'd1',
    title: 'Bé Gái Và Cây Đũa Thần Nở Hoa',
    cover: '/s1.jpg',
    pages: 6,
    theme: 'Lòng trắc ẩn',
    time: '5p',
    rating: '5.0',
  },
  {
    id: 'd2',
    title: 'Chú Rồng Con Và Giấc Mơ Bay Cao',
    cover: '/s2.jpg',
    pages: 8,
    theme: 'Kiên trì',
    time: '6p',
    rating: '4.9',
  },
  {
    id: 'd3',
    title: 'Nàng Tiên Cá Dưới Đại Dương',
    cover: '/s3.jpg',
    pages: 7,
    theme: 'Bảo vệ biển',
    time: '5p',
    rating: '5.0',
  },
  {
    id: 'd4',
    title: 'Lâu Đài Cát Của Hai Bạn Sóc',
    cover: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=80',
    pages: 6,
    theme: 'Chia sẻ',
    time: '5p',
    rating: '5.0',
  },
];

const EQ_TOPICS = [
  { id: 'eq_1', title: 'Dũng cảm', iconName: 'shield', iconColor: '#D97706', bg: '#FFF8D6', border: '#FFE57F' },
  { id: 'eq_2', title: 'Lễ phép', iconName: 'heart', iconColor: '#DB2777', bg: '#FCE4EC', border: '#F8BBD0' },
  { id: 'eq_3', title: 'Chia sẻ', iconName: 'users', iconColor: '#16A34A', bg: '#E8F5E9', border: '#C8E6C9' },
  { id: 'eq_4', title: 'Tự lập', iconName: 'zap', iconColor: '#0288D1', bg: '#E3F2FD', border: '#BBDEFB' },
  { id: 'eq_5', title: 'Thiên nhiên', iconName: 'sun', iconColor: '#059669', bg: '#E0F2F1', border: '#B2DFDB' },
  { id: 'eq_6', title: 'Sáng tạo', iconName: 'edit-3', iconColor: '#7C3AED', bg: '#F3E5F5', border: '#E1BEE7' },
];

export const ParentHomeScreen: React.FC<ParentHomeScreenProps> = ({
  childrenProfiles,
  stories,
  onStartStoryWizard,
  onOpenKidMode,
  onNavigateTab,
  onSelectStoryToRead,
}) => {
  const heroScale = useRef(new RNAnimated.Value(1.04)).current;
  const heroOpacity = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(heroOpacity, { toValue: 1, duration: 500, useNativeDriver: false }),
      RNAnimated.spring(heroScale, { toValue: 1, tension: 40, friction: 8, useNativeDriver: false }),
    ]).start();
  }, []);

  const allDisplayStories = stories.length > 0 ? stories : CURATED_DEMO_STORIES as any[];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* ═══════════════════════════════════════════════════════
          1. HERO IMAGE BANNER (Clean, unblocked artwork)
          ═══════════════════════════════════════════════════════ */}
      <View style={styles.heroWrapper}>
        <RNAnimated.Image
          source={{ uri: '/hero_banner.jpg' }}
          style={[styles.heroBg, { opacity: heroOpacity, transform: [{ scale: heroScale }] }] as any}
          resizeMode="cover"
        />

        {/* Floating Quick Action Buttons */}
        <View style={styles.heroBtns}>
          <TouchableOpacity
            onPress={() => {
              soundFX.playSparkle();
              onStartStoryWizard();
            }}
            style={styles.heroMainBtn}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons name="creation-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.heroMainBtnText}>Sáng tác truyện</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              soundFX.playPuppy();
              onOpenKidMode();
            }}
            style={styles.heroSecBtn}
            activeOpacity={0.85}
          >
            <Feather name="smile" size={16} color="#1E293B" style={{ marginRight: 6 }} />
            <Text style={styles.heroSecBtnText}>Chế độ Bé</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══════════════════════════════════════════════════════
          2. MASCOT COMPANION
          ═══════════════════════════════════════════════════════ */}
      <View style={styles.mascotSection}>
        <CuteMascot />
      </View>

      {/* ═══════════════════════════════════════════════════════
          3. CONTINUE READING CARD
          ═══════════════════════════════════════════════════════ */}
      {allDisplayStories.length > 0 && (
        <View style={styles.sectionWrap}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              soundFX.playCoin();
              onSelectStoryToRead(allDisplayStories[0]);
            }}
            style={styles.continueCard}
          >
            <Image
              source={{ uri: allDisplayStories[0].coverImageUrl || allDisplayStories[0].cover || '/s1.jpg' }}
              style={styles.continueThumb as any}
            />
            <View style={styles.continueInfo}>
              <View style={styles.continuePill}>
                <Feather name="book-open" size={11} color="#2E7D32" style={{ marginRight: 4 }} />
                <Text style={styles.continuePillText}>Đang đọc</Text>
              </View>
              <Text style={styles.continueTitle} numberOfLines={1}>
                {allDisplayStories[0].title}
              </Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '55%' }]} />
              </View>
            </View>

            <View style={styles.continuePlayBtn}>
              <Feather name="play" size={14} color="#16A34A" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════
          4. MY STORIES SHELF
          ═══════════════════════════════════════════════════════ */}
      <View style={styles.sectionHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="book" size={16} color="#1E293B" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Tủ truyện của bé</Text>
        </View>
        <TouchableOpacity onPress={() => {
          soundFX.playPop();
          onNavigateTab('MARKET');
        }}>
          <Text style={styles.seeAllText}>Xem tất cả →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shelfRow}
        decelerationRate="fast"
        snapToInterval={CARD_W + 14}
        snapToAlignment="start"
      >
        {allDisplayStories.map((story, idx) => (
          <TouchableOpacity
            key={story.id || idx}
            activeOpacity={0.92}
            onPress={() => {
              soundFX.playCoin();
              onSelectStoryToRead(story);
            }}
            style={styles.storyCard}
          >
            <Image
              source={{ uri: story.coverImageUrl || story.cover || '/s1.jpg' }}
              style={styles.storyCardCover as any}
            />
            <View style={styles.storyCardOverlay} />

            {/* Top tags */}
            <View style={styles.storyCardTopRow}>
              <View style={styles.themeBadge}>
                <Text style={styles.themeBadgeText}>
                  {story.theme || 'Cổ tích'}
                </Text>
              </View>
              <View style={styles.ratingBadge}>
                <Feather name="star" size={10} color="#D97706" style={{ marginRight: 3 }} />
                <Text style={styles.ratingBadgeText}>{story.ratingsAvg || '5.0'}</Text>
              </View>
            </View>

            {/* Bottom info */}
            <View style={styles.storyCardBottom}>
              <Text style={styles.storyCardTitle} numberOfLines={2}>
                {story.title}
              </Text>
              <View style={styles.storyCardMetaRow}>
                <Feather name="file-text" size={11} color="#E2E8F0" style={{ marginRight: 4 }} />
                <Text style={styles.storyCardPages}>
                  {story.pages?.length || story.pages || 5} trang
                </Text>
              </View>
            </View>

            {/* Play Circle Icon */}
            <View style={styles.playCircle}>
              <Feather name="play" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        ))}

        {/* Create New Card */}
        <TouchableOpacity
          onPress={() => {
            soundFX.playSparkle();
            onStartStoryWizard();
          }}
          style={styles.addNewCard}
          activeOpacity={0.85}
        >
          <View style={styles.addNewIconWrap}>
            <MaterialCommunityIcons name="creation-outline" size={24} color="#2E7D32" />
          </View>
          <Text style={styles.addNewTitle}>Tạo truyện mới</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════
          5. EQ TOPICS
          ═══════════════════════════════════════════════════════ */}
      <View style={styles.sectionHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="compass" size={16} color="#1E293B" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Chủ đề cảm xúc & Kỹ năng</Text>
        </View>
      </View>

      <View style={styles.eqGrid}>
        {EQ_TOPICS.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            onPress={() => {
              soundFX.playHeart();
              onStartStoryWizard();
            }}
            activeOpacity={0.85}
            style={[
              styles.eqTopicCard,
              { backgroundColor: topic.bg, borderColor: topic.border },
            ]}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
              <Feather name={topic.iconName as any} size={18} color={topic.iconColor} />
            </View>
            <Text style={styles.eqTopicTitle}>{topic.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ═══════════════════════════════════════════════════════
          6. DAILY READING QUEST
          ═══════════════════════════════════════════════════════ */}
      <View style={styles.sectionWrap}>
        <View style={styles.questCard}>
          <View style={styles.questTop}>
            <View style={styles.questIconBox}>
              <Feather name="award" size={20} color="#D97706" />
            </View>
            <View style={styles.questTextWrap}>
              <Text style={styles.questTitle}>Đọc truyện cùng bé hôm nay</Text>
              <Text style={styles.questRewardText}>Thưởng: +10 Xu sao</Text>
            </View>
            <Text style={styles.questProgressPercent}>1/2</Text>
          </View>

          <View style={styles.questBarBg}>
            <View style={[styles.questBarFill, { width: '50%' }]} />
          </View>
        </View>
      </View>

      {/* ═══════════════════════════════════════════════════════
          7. FAMILY CHARACTERS
          ═══════════════════════════════════════════════════════ */}
      <View style={styles.sectionHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="users" size={16} color="#1E293B" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Nhân vật của bé</Text>
        </View>
        <TouchableOpacity onPress={() => {
          soundFX.playPop();
          onStartStoryWizard();
        }}>
          <Text style={styles.seeAllText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.familyRow}
      >
        {[
          { name: 'Bé Bo', icon: '👦', bg: '#E8F5E9' },
          { name: 'Bố Tuấn', icon: '👨‍💼', bg: '#E3F2FD' },
          { name: 'Mẹ Lan', icon: '👩‍🍳', bg: '#FFF8E1' },
          { name: 'Chó Lu', icon: '🐶', bg: '#FCE4EC' },
        ].map((char, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              soundFX.playPuppy();
              onStartStoryWizard();
            }}
            activeOpacity={0.85}
            style={styles.charItem}
          >
            <View style={[styles.charAvatar, { backgroundColor: char.bg }]}>
              <Text style={styles.charEmoji}>{char.icon}</Text>
            </View>
            <Text style={styles.charName}>{char.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ height: 28 }} />
    </ScrollView>
  );
};

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFE',
  },
  scroll: {
    paddingBottom: 20,
  },

  // 1. Hero
  heroWrapper: {
    height: HERO_H,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  heroBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  heroBtns: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroMainBtn: {
    flex: 1,
    backgroundColor: '#FFD93D',
    borderRadius: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    boxShadow: '0 4px 14px rgba(255, 217, 61, 0.45)',
  },
  heroMainBtnIcon: {
    fontSize: 15,
  },
  heroMainBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#5C3B00',
  },
  heroSecBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
  },
  heroSecBtnIcon: {
    fontSize: 14,
  },
  heroSecBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
  },

  // 2. Mascot
  mascotSection: {
    marginTop: 2,
    paddingHorizontal: 16,
  },

  // Common Section Headers
  sectionWrap: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '800',
  },

  // 3. Continue Card
  continueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8F5E9',
    boxShadow: '0 3px 12px rgba(76,175,80,0.06)',
  },
  continueThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginRight: 10,
  },
  continueInfo: {
    flex: 1,
  },
  continuePill: {
    backgroundColor: '#E8F5E9',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  continuePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#2E7D32',
  },
  continueTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  continuePlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  continuePlayIcon: {
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 2,
  },

  // 4. Stories Shelf
  shelfRow: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  storyCard: {
    width: CARD_W,
    height: CARD_W * 1.35,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
  },
  storyCardCover: {
    width: '100%',
    height: '100%',
  },
  storyCardOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  storyCardTopRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeBadge: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  themeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#2E7D32',
  },
  ratingBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  ratingBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFD93D',
  },
  storyCardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  storyCardTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 16,
    marginBottom: 2,
  },
  storyCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyCardPages: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
  },
  playCircle: {
    position: 'absolute',
    top: '42%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircleIcon: {
    color: '#2E7D32',
    fontSize: 12,
    marginLeft: 2,
  },
  addNewCard: {
    width: CARD_W * 0.72,
    height: CARD_W * 1.35,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C8E6C9',
    backgroundColor: '#F1F8F2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  addNewIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  addNewIcon: {
    fontSize: 20,
  },
  addNewTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#2E7D32',
    textAlign: 'center',
  },

  // 5. EQ Topics Grid
  eqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  eqTopicCard: {
    width: (W - 32 - 16) / 3,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eqTopicIcon: {
    fontSize: 22,
    marginBottom: 3,
  },
  eqTopicTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },

  // 6. Quest Card
  questCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  questTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  questIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF8D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questIcon: {
    fontSize: 18,
  },
  questTextWrap: {
    flex: 1,
  },
  questTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  questRewardText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '800',
    marginTop: 1,
  },
  questProgressPercent: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748B',
  },
  questBarBg: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  questBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2.5,
  },

  // 7. Family Cast
  familyRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  charItem: {
    alignItems: 'center',
    width: 58,
  },
  charAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  },
  charEmoji: {
    fontSize: 22,
  },
  charName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
  },
});
