// apps/mobile/src/screens/parent/ParentHomeScreen.tsx
// B2 – Trang chủ phụ huynh (Web: ParentDashboardPage). Lời chào + chọn bé + lối tắt + truyện gần đây + chuyện mẫu.
// Chỉ hiện dữ liệu BE thật đang có (bé, truyện, chuyện mẫu). Số liệu đọc hôm nay và EQ cần API (C7) → hiện chưa kết nối.
import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ChildProfile, PedagogicalTemplate, Story } from '../../../../../packages/shared-types';
import { SessionUser } from '../../types/sessionUser';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyChip } from '../../components/ui/HeyChip';
import { Badge } from '../../components/ui/Badge';
import { StateView } from '../../components/ui/StateView';
import { ChildSwitcher } from '../../components/parent/ChildSwitcher';
import { CuteMascot } from '../../components/CuteMascot';
import { Colors } from '../../theme/colors';
import { STORY_STATUS_LABELS } from '../../constants/story';
import { soundFX } from '../../utils/sound-fx';
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
  stories: Story[];
  templates: PedagogicalTemplate[];
  dataStatus: DataStatus;
  onSelectChild: (id: string) => void;
  onStartStoryWizard: () => void;
  onOpenKidMode: () => void;
  onOpenLibrary: () => void;
  onOpenEq: () => void;
  onOpenChildren: () => void;
  onSelectStoryToRead: (story: Story) => void;
}

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
  onSelectStoryToRead,
}) => {
  const latest = stories[0];
  const drafts = stories.filter((s) => s.status === 'DRAFT');
  const loadingEmpty = dataStatus === 'loading' && childrenProfiles.length === 0;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.greeting}>
        {getGreeting()}, {currentUser.fullName}
      </Text>
      <Text style={styles.sub}>
        {selectedChild ? `Hôm nay ${selectedChild.name} muốn nghe truyện gì nhỉ?` : 'Chào mừng ba mẹ đến với StoryWeaver.'}
      </Text>

      <View style={styles.mascot}>
        <CuteMascot />
      </View>

      {loadingEmpty ? (
        <StateView variant="loading" title="Đang tải dữ liệu..." />
      ) : childrenProfiles.length === 0 ? (
        <HeyCard variant="yellow" style={styles.block}>
          <StateView
            variant="empty"
            title="Chưa có hồ sơ bé"
            description="Thêm hồ sơ bé để bắt đầu tạo truyện và theo dõi tiến độ."
            actionLabel="➕ Thêm hồ sơ bé"
            onAction={onOpenChildren}
          />
        </HeyCard>
      ) : (
        <ChildSwitcher childrenProfiles={childrenProfiles} selectedId={selectedChild?.id} onSelect={onSelectChild} />
      )}

      <View style={styles.actions}>
        <HeyButton
          title="🪄 Sáng tác truyện"
          onPress={() => {
            soundFX.playSparkle();
            onStartStoryWizard();
          }}
          style={styles.actionBtn}
        />
        <HeyButton
          title={selectedChild ? `👶 Chế độ Bé · ${selectedChild.name}` : '👶 Chế độ Bé'}
          variant="teal"
          onPress={() => {
            soundFX.playPuppy();
            onOpenKidMode();
          }}
          style={styles.actionBtn}
        />
      </View>

      <HeyCard style={styles.block}>
        <Text style={styles.blockTitle}>Hôm nay của bé</Text>
        <Text style={styles.muted}>
          Thời gian đọc, số lượt đọc và truyện đã đọc xong sẽ hiển thị khi ứng dụng kết nối với máy chủ.
        </Text>
        <Badge label="Chưa kết nối" tone="warning" />
      </HeyCard>

      {latest && (
        <>
          <Text style={styles.sectionTitle}>Truyện gần đây</Text>
          <TouchableOpacity activeOpacity={0.9} onPress={() => onSelectStoryToRead(latest)}>
            <HeyCard style={styles.latest}>
              <Image source={{ uri: latest.coverImageUrl }} style={styles.thumb} />
              <View style={styles.latestInfo}>
                <Text style={styles.latestTitle} numberOfLines={2}>
                  {latest.title}
                </Text>
                <Badge
                  label={(latest.status && STORY_STATUS_LABELS[latest.status]) || 'Truyện'}
                  tone={latest.status === 'READY' ? 'success' : 'neutral'}
                />
              </View>
              <Text style={styles.play}>▶</Text>
            </HeyCard>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity activeOpacity={0.85} onPress={onOpenLibrary}>
        <HeyCard style={styles.linkCard}>
          <View style={styles.linkText}>
            <Text style={styles.blockTitle}>Truyện chờ xem lại</Text>
            <Text style={styles.muted}>
              {drafts.length ? `${drafts.length} bản nháp` : 'Không có bản nháp nào'} · xem trong Tủ truyện
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </HeyCard>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.85} onPress={onOpenEq}>
        <HeyCard style={styles.linkCard}>
          <View style={styles.linkText}>
            <Text style={styles.blockTitle}>Hành trình EQ</Text>
            <Text style={styles.muted}>Mức phát triển 5 năng lực CASEL của bé</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </HeyCard>
      </TouchableOpacity>

      {templates.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>🌱 Chuyện mẫu theo chủ đề</Text>
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
  content: { padding: 16, paddingBottom: 32 },
  greeting: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  sub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  mascot: { marginVertical: 8 },
  actions: { gap: 10, marginVertical: 12 },
  actionBtn: { alignSelf: 'stretch' },
  block: { marginBottom: 12, gap: 6 },
  blockTitle: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  muted: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary, marginTop: 6, marginBottom: 8 },
  latest: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  thumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#F1F5F9' },
  latestInfo: { flex: 1, gap: 6 },
  latestTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  play: { fontSize: 20, color: Colors.secondaryDark },
  linkCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  linkText: { flex: 1, gap: 2 },
  chevron: { fontSize: 24, color: Colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
