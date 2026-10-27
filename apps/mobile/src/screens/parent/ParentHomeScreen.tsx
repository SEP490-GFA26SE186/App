// apps/mobile/src/screens/parent/ParentHomeScreen.tsx
// B2 – Trang chủ phụ huynh (Web: ParentDashboardPage). R5: lời chào + mascot → "Sáng tác truyện" (hành động chính)
// → thẻ hero của bé đang chọn (số liệu THẬT) → truyện gần đây → lối tắt Tủ truyện/EQ → chuyện mẫu.
// Dữ liệu BE thật: bé, truyện, chuyện mẫu, và (C7) tổng quan của bé đang chọn: GET /children/:id/overview.
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { ChildProfile, PedagogicalTemplate } from '../../types/domain';
import { StoryView } from '../../types/viewModels';
import { SessionUser } from '../../types/sessionUser';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyChip } from '../../components/ui/HeyChip';
import { Badge } from '../../components/ui/Badge';
import { Icon, IconName } from '../../components/ui/Icon';
import { StateView } from '../../components/ui/StateView';
import { StoryCover } from '../../components/ui/StoryCover';
import { ChildSwitcher } from '../../components/parent/ChildSwitcher';
import { ChildHeroCard } from '../../components/parent/ChildHeroCard';
import { CuteMascot } from '../../components/CuteMascot';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { STORY_STATUS_LABELS } from '../../constants/story';
import { soundFX } from '../../utils/sound-fx';
import { childService } from '../../services';
import { useAsyncResource } from '../../utils/useAsyncResource';
import type { DataStatus } from '../../stores/useParentData';

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 11) return 'Chào buổi sáng';
  if (h < 14) return 'Chào buổi trưa';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

interface ParentHomeScreenProps {
  currentUser: SessionUser;
  childrenProfiles: ChildProfile[];
  selectedChild?: ChildProfile;
  stories: StoryView[];
  templates: PedagogicalTemplate[];
  dataStatus: DataStatus;
  onSelectChild: (id: string) => void;
  onStartStoryWizard: () => void;
  onOpenKidMode: () => void;
  onOpenLibrary: () => void;
  onOpenEq: () => void;
  onOpenChildren: () => void;
  onOpenStory: (story: StoryView) => void;
}

/** Hàng lối tắt: icon + tiêu đề + mô tả + mũi tên; cả hàng là một nút (>= 44pt). */
const LinkRow: React.FC<{ icon: IconName; title: string; description: string; onPress: () => void }> = ({ icon, title, description, onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${title}. ${description}`}
    style={(s) => [styles.rowPressable, s.pressed && styles.pressed, focusRing(s)]}
  >
    <HeyCard style={styles.linkCard}>
      <View style={styles.iconCircle}>
        <Icon name={icon} size={22} color={Colors.brandStrong} />
      </View>
      <View style={styles.linkText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.muted}>{description}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
    </HeyCard>
  </Pressable>
);

export const ParentHomeScreen: React.FC<ParentHomeScreenProps> = ({
  currentUser,
  childrenProfiles,
  selectedChild,
  stories,
  templates,
  dataStatus,
  onSelectChild,
  onStartStoryWizard,
  onOpenKidMode,
  onOpenLibrary,
  onOpenEq,
  onOpenChildren,
  onOpenStory,
}) => {
  const latest = stories[0];
  const drafts = stories.filter((s) => s.status === 'DRAFT');
  const loadingEmpty = dataStatus === 'loading' && childrenProfiles.length === 0;
  const childId = selectedChild?.id;
  const overview = useAsyncResource(
    () => (childId ? childService.getChildOverview(childId) : Promise.resolve(null)),
    [childId]
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.greeting} accessibilityRole="header">
        {getGreeting()}, {currentUser.fullName}
      </Text>
      <Text style={styles.sub}>
        {selectedChild ? `Hôm nay ${selectedChild.name} muốn nghe truyện gì nhỉ?` : 'Chào mừng ba mẹ đến với StoryWeaver.'}
      </Text>

      <CuteMascot />

      {loadingEmpty ? (
        <StateView variant="loading" title="Đang tải dữ liệu..." />
      ) : childrenProfiles.length === 0 ? (
        <HeyCard variant="brand" style={styles.block}>
          <StateView
            variant="empty"
            title="Chưa có hồ sơ bé"
            description="Thêm hồ sơ bé để bắt đầu tạo truyện và theo dõi tiến độ."
            actionLabel="Thêm hồ sơ bé"
            onAction={onOpenChildren}
          />
        </HeyCard>
      ) : (
        <ChildSwitcher childrenProfiles={childrenProfiles} selectedId={selectedChild?.id} onSelect={onSelectChild} />
      )}

      <HeyButton
        title="Sáng tác truyện"
        iconName="sparkles"
        size="lg"
        onPress={() => {
          soundFX.playSparkle();
          onStartStoryWizard();
        }}
        style={styles.createBtn}
      />

      {selectedChild ? (
        <ChildHeroCard
          child={selectedChild}
          status={overview.status === 'ready' ? 'ready' : overview.status === 'error' ? 'error' : 'loading'}
          overview={overview.data}
          error={overview.error}
          onRetry={() => void overview.reload()}
          onOpenKidMode={onOpenKidMode}
        />
      ) : (
        <HeyButton title="Chế độ Bé" iconName="happy" variant="tertiary" size="lg" onPress={onOpenKidMode} style={styles.createBtn} />
      )}

      {latest && (
        <>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Truyện gần đây
          </Text>
          <Pressable
            onPress={() => onOpenStory(latest)}
            accessibilityRole="button"
            accessibilityLabel={`Mở truyện ${latest.title}`}
            style={(s) => [styles.rowPressable, s.pressed && styles.pressed, focusRing(s)]}
          >
            <HeyCard style={styles.latest}>
              <StoryCover uri={latest.coverImageUrl} style={styles.thumb} />
              <View style={styles.latestInfo}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {latest.title}
                </Text>
                <Badge
                  label={(latest.status && STORY_STATUS_LABELS[latest.status]) || 'Truyện'}
                  tone={latest.status === 'READY' ? 'success' : 'neutral'}
                />
              </View>
              <Icon name="play-circle" size={32} color={Colors.tealStrong} />
            </HeyCard>
          </Pressable>
        </>
      )}

      <LinkRow
        icon="library-outline"
        title="Truyện chờ xem lại"
        description={`${drafts.length ? `${drafts.length} bản nháp` : 'Không có bản nháp nào'} · xem trong Tủ truyện`}
        onPress={onOpenLibrary}
      />
      <LinkRow icon="stats-chart-outline" title="Hành trình EQ" description="Mức phát triển 5 năng lực CASEL của bé" onPress={onOpenEq} />

      {templates.length > 0 && (
        <>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Chuyện mẫu theo chủ đề
          </Text>
          <View style={styles.chips}>
            {templates.slice(0, 8).map((t) => (
              <HeyChip key={t.id} label={t.title} onPress={onStartStoryWizard} />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: Spacing.page, paddingBottom: Spacing.xxxl },
  greeting: { ...Typography.title, color: Colors.text },
  sub: { ...Typography.body, fontSize: 14, color: Colors.textMuted, marginTop: Spacing.xs },
  createBtn: { alignSelf: 'stretch', marginVertical: Spacing.sm },
  block: { marginBottom: Spacing.md },
  sectionTitle: { ...Typography.heading, color: Colors.text, marginTop: Spacing.md, marginBottom: Spacing.sm },
  rowPressable: { borderRadius: Radius.lg, marginBottom: 10 },
  pressed: { opacity: 0.8 },
  rowTitle: { ...Typography.bodyStrong, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  latest: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  thumb: { width: 64, height: 64, borderRadius: Radius.md },
  latestInfo: { flex: 1, gap: 6 },
  linkCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brandTint, alignItems: 'center', justifyContent: 'center' },
  linkText: { flex: 1, gap: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
