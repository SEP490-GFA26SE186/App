// apps/mobile/src/screens/parent/StoryDetailScreen.tsx
// B6/C8 – Chi tiết truyện / xem lại (Web: StoryEditorPage). Nạp GET /stories/:id; xem trang + điểm dừng (khóa),
// theo dõi/chạy AI viết, "Hoàn tất xem lại" (POST /review; lỗi 422 hiển thị errors[]), thêm vào tủ sách của bé (POST /bookshelf).
// Chưa có: sửa chữ từng trang / điểm dừng (PUT /stories/:id/pages|checkpoints) → "Chưa hỗ trợ".
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChildProfile } from '../../types/domain';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { Badge } from '../../components/ui/Badge';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { StoryCover } from '../../components/ui/StoryCover';
import { GenerationRunner } from '../../components/parent/GenerationRunner';
import { Colors } from '../../theme/colors';
import { CHECKPOINT_TYPES, STORY_STATUS_LABELS } from '../../constants/story';
import { storyService } from '../../services';
import { StoryView } from '../../types/viewModels';

interface StoryDetailScreenProps {
  storyId: string;
  /** Bản tóm tắt từ danh sách (hiện ngay trong lúc nạp chi tiết) */
  summary?: StoryView;
  selectedChild?: ChildProfile;
  onBack: () => void;
  onRead: (story: StoryView) => void;
  /** BE trả bản truyện mới (chi tiết/đã xem lại/đã viết xong) */
  onStoryLoaded: (story: StoryView) => void;
  onCreditsChanged: () => void;
  onUnsupported: (what: string) => void;
}

export const StoryDetailScreen: React.FC<StoryDetailScreenProps> = ({
  storyId,
  summary,
  selectedChild,
  onBack,
  onRead,
  onStoryLoaded,
  onCreditsChanged,
  onUnsupported,
}) => {
  const [story, setStory] = useState<StoryView | undefined>(summary?.detailLoaded ? summary : undefined);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(summary?.detailLoaded ? 'ready' : 'loading');
  const [loadError, setLoadError] = useState('');
  const [reviewErrors, setReviewErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState<'review' | 'shelf' | null>(null);
  const busyRef = useRef(false);
  const reqRef = useRef(0);
  // 'start' = bấm "Cho AI viết"; 'track' = theo dõi job đang chạy
  const [runner, setRunner] = useState<'start' | 'track' | null>(null);

  const load = useCallback(async () => {
    const req = ++reqRef.current;
    setStatus('loading');
    setLoadError('');
    try {
      const detail = await storyService.getStory(storyId);
      if (req !== reqRef.current) return;
      setStory(detail);
      onStoryLoaded(detail);
      setStatus('ready');
      if (detail.status === 'GENERATING') setRunner((r) => r ?? 'track');
    } catch (e: any) {
      if (req !== reqRef.current) return;
      setLoadError(e?.message || 'Không tải được truyện.');
      setStatus('error');
    }
  }, [storyId]);

  useEffect(() => {
    void load();
    return () => {
      reqRef.current += 1; // bỏ kết quả của lần nạp đang chờ khi rời màn
    };
  }, [load]);

  const run = async (kind: 'review' | 'shelf', task: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(kind);
    try {
      await task();
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const review = () =>
    run('review', async () => {
      setReviewErrors([]);
      try {
        const updated = await storyService.reviewStory(storyId);
        // review trả bản đầy đủ; giữ chi tiết đã có nếu thiếu
        setStory(updated);
        onStoryLoaded(updated);
        Alert.alert('Đã xem lại', 'Truyện đã được đánh dấu xem xong.');
      } catch (e: any) {
        if (e?.status === 422 && e.errors?.length) {
          setReviewErrors(e.errors.map((x: { message?: string }) => x.message).filter(Boolean));
        } else {
          Alert.alert('Chưa hoàn tất được', e?.message || 'Vui lòng thử lại.');
        }
      }
    });

  const addToShelf = () =>
    run('shelf', async () => {
      if (!selectedChild) return;
      try {
        await storyService.addToShelf(selectedChild.id, storyId);
        Alert.alert('Đã thêm', `Truyện đã nằm trên tủ sách của ${selectedChild.name}.`);
      } catch (e: any) {
        // 422: truyện chưa sẵn sàng cho bé (chưa hoàn tất / thiếu giọng đọc) – BE nêu rõ lý do
        Alert.alert('Chưa thêm được', e?.errors?.[0]?.message || e?.message || 'Vui lòng thử lại.');
      }
    });

  const shown = story ?? summary;
  if (!shown) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Chi tiết truyện" onBack={onBack} />
        {status === 'loading' ? (
          <StateView variant="loading" title="Đang tải truyện..." />
        ) : (
          <StateView
            variant="empty"
            title="Không tải được truyện"
            description={loadError || 'Truyện có thể đã bị xóa.'}
            actionLabel="Thử lại"
            onAction={() => void load()}
          />
        )}
      </ScrollView>
    );
  }

  const pages = story?.pages ?? [];
  const checkpoints = story?.checkpoints ?? [];
  const isAi = shown.length !== 'custom';
  const notWritten = shown.status === 'DRAFT' && pages.length === 0 && isAi;
  const generating = runner !== null || shown.status === 'GENERATING';

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title={shown.title} onBack={onBack} />

      <StoryCover uri={shown.coverImageUrl} style={styles.cover} />
      <View style={styles.badges}>
        <Badge
          label={(shown.status && STORY_STATUS_LABELS[shown.status]) || 'Truyện'}
          tone={shown.status === 'READY' ? 'success' : shown.status === 'GENERATING' ? 'info' : 'neutral'}
        />
        {!!shown.reviewedAt && <Badge label="Đã xem lại" tone="success" />}
        {!!shown.theme && <Badge label={shown.theme} tone="neutral" />}
      </View>
      {!!shown.momentSummary && <Text style={styles.summary}>{shown.momentSummary}</Text>}
      {!!shown.characters?.length && (
        <Text style={styles.summary}>
          Nhân vật: {shown.characters.map((c) => `${c.name ?? '?'}${c.isMain ? ' ⭐' : ''}`).join(', ')}
        </Text>
      )}

      {status === 'loading' && <StateView variant="loading" title="Đang tải nội dung..." />}
      {status === 'error' && (
        <StateView
          variant="empty"
          title="Chưa tải được nội dung truyện"
          description={loadError}
          actionLabel="Thử lại"
          onAction={() => void load()}
        />
      )}

      {runner !== null && (
        <GenerationRunner
          storyId={storyId}
          start={runner === 'start'}
          onSucceeded={() => {
            setRunner(null);
            void load();
          }}
          onCreditsChanged={onCreditsChanged}
          onBack={() => {
            setRunner(null);
            void load();
          }}
        />
      )}

      {status === 'ready' && !generating && (
        <View style={styles.actions}>
          {notWritten && (
            <HeyButton title="🪄 Cho AI viết" size="sm" onPress={() => setRunner('start')} style={styles.actionBtn} />
          )}
          {pages.length > 0 && story && (
            <HeyButton title="📖 Đọc thử" size="sm" onPress={() => onRead(story)} style={styles.actionBtn} />
          )}
          {pages.length > 0 && (
            <HeyButton
              title="✏️ Chỉnh sửa"
              variant="outline"
              size="sm"
              onPress={() => onUnsupported('Chỉnh sửa chữ từng trang')}
              style={styles.actionBtn}
            />
          )}
          {pages.length > 0 && !shown.reviewedAt && (
            <HeyButton
              title={busy === 'review' ? '⏳ Đang lưu...' : '✅ Hoàn tất xem lại'}
              variant="teal"
              size="sm"
              disabled={!!busy}
              onPress={review}
              style={styles.actionBtn}
            />
          )}
          {pages.length > 0 && !!selectedChild && (
            <HeyButton
              title={busy === 'shelf' ? '⏳ Đang thêm...' : `📚 Thêm vào tủ sách của ${selectedChild.name}`}
              variant="yellow"
              size="sm"
              disabled={!!busy}
              onPress={addToShelf}
              style={styles.actionBtn}
            />
          )}
        </View>
      )}

      {status === 'ready' && !!story?.readiness && !story.readiness.ready && !!story.readiness.reason && (
        <Text style={styles.summary}>ℹ️ Chưa lên tủ sách bé được: {story.readiness.reason}</Text>
      )}

      {!!reviewErrors.length && (
        <HeyCard variant="coral" style={styles.errors}>
          <Text style={styles.errorsTitle}>Truyện chưa đủ điều kiện hoàn tất:</Text>
          {reviewErrors.map((e, i) => (
            <Text key={`${i}-${e}`} style={styles.errorsItem}>
              • {e}
            </Text>
          ))}
        </HeyCard>
      )}

      {status === 'ready' && !generating && (
        <>
          <Text style={styles.sectionTitle}>Các trang ({pages.length})</Text>
          {pages.length === 0 ? (
            <StateView
              variant="empty"
              title="Truyện chưa có trang nào"
              description={notWritten ? 'Bấm “Cho AI viết” để AI viết truyện này.' : 'Truyện tự viết cần thêm trang (chưa hỗ trợ trên Mobile).'}
            />
          ) : (
            pages.map((p, i) => (
              <HeyCard key={p.id} style={styles.pageCard}>
                <Text style={styles.pageLabel}>Trang {p.pageNumber ?? i + 1}</Text>
                <Text style={styles.pageText}>{p.text || '(trang chưa có chữ)'}</Text>
              </HeyCard>
            ))
          )}

          {checkpoints.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Điểm dừng ({checkpoints.length})</Text>
              {checkpoints.map((c) => (
                <HeyCard key={c.id} style={styles.pageCard}>
                  <Text style={styles.pageLabel}>
                    Sau trang {c.afterPageOrder ?? '?'} · {CHECKPOINT_TYPES[c.type] ?? c.type}
                  </Text>
                  <Text style={styles.pageText}>{c.question || '(chưa có câu hỏi)'}</Text>
                </HeyCard>
              ))}
              <Text style={styles.footnote}>🔒 Điểm dừng câu hỏi do khung sư phạm quy định, không chỉnh trực tiếp.</Text>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  cover: { width: '100%', aspectRatio: 16 / 9, borderRadius: 16, backgroundColor: '#F1F5F9' },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  summary: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginTop: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 14 },
  actionBtn: { flexGrow: 1 },
  errors: { marginBottom: 12, gap: 4 },
  errorsTitle: { fontSize: 13, fontWeight: '800', color: '#B91C1C' },
  errorsItem: { fontSize: 12, color: '#B91C1C' },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary, marginBottom: 8, marginTop: 6 },
  pageCard: { marginBottom: 10, gap: 4 },
  pageLabel: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary },
  pageText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 21 },
  footnote: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
