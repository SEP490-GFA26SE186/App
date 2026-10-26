// apps/mobile/src/components/parent/GenerationRunner.tsx
// C8 – Chạy và theo dõi AI viết truyện (POST /stories/:id/generate → poll GET /stories/:id/generation mỗi 3 giây).
// Trạng thái hiển thị là trạng thái BE trả; không có tiến độ/timer giả. Mất mạng khi poll không phải "thất bại":
// báo lỗi kết nối và cho thử lại, vì job vẫn chạy phía BE.
import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { HeyButton } from '../ui/HeyButton';
import { HeyCard } from '../ui/HeyCard';
import { GenerationPanel } from './GenerationPanel';
import { storyService } from '../../services';
import { GenerationStatus } from '../../constants/story';
import { Colors } from '../../theme/colors';

const POLL_MS = 3000;
/** Sau chừng này lần poll lỗi liên tiếp thì dừng và hỏi người dùng */
const MAX_POLL_FAILURES = 4;

interface Props {
  storyId: string;
  /** true: gọi POST /generate trước khi poll (tạo mới / thử lại); false: chỉ theo dõi job đang chạy */
  start: boolean;
  /** BE báo succeeded (hoặc job đã xong khi theo dõi) */
  onSucceeded: () => void;
  /** Credit đã bị giữ/hoàn: để làm mới số dư */
  onCreditsChanged: () => void;
  onBack: () => void;
}

export const GenerationRunner: React.FC<Props> = ({ storyId, start, onSucceeded, onCreditsChanged, onBack }) => {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<GenerationStatus>('queued');
  const [message, setMessage] = useState<string | null>(null);
  // Lỗi trước khi job chạy (402 thiếu credit, 422...) hoặc mất kết nối khi poll
  const [fatal, setFatal] = useState<string | null>(null);
  const succeededRef = useRef(onSucceeded);
  succeededRef.current = onSucceeded;
  const creditsRef = useRef(onCreditsChanged);
  creditsRef.current = onCreditsChanged;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    let emptyPolls = 0;

    const poll = async () => {
      try {
        const g = await storyService.getGeneration(storyId);
        if (cancelled) return;
        failures = 0;
        if (!g) {
          // Job vừa được xếp hàng nhưng chưa thấy bản ghi: chờ vài nhịp, quá thì coi là chưa chạy
          emptyPolls += 1;
          if (emptyPolls > 5) {
            setFatal('Chưa thấy tiến trình AI viết truyện. Ba mẹ thử lại nhé.');
            return;
          }
        } else {
          setStatus(g.status);
          if (g.status === 'succeeded') {
            creditsRef.current();
            succeededRef.current();
            return;
          }
          if (g.status === 'failed' || g.status === 'blocked') {
            setMessage(g.errorMessage || null);
            creditsRef.current(); // credit được hoàn khi lỗi
            return;
          }
        }
      } catch (e: any) {
        if (cancelled) return;
        failures += 1;
        if (failures >= MAX_POLL_FAILURES) {
          setFatal(e?.message || 'Mất kết nối khi theo dõi tiến trình.');
          return;
        }
      }
      timer = setTimeout(poll, POLL_MS);
    };

    const run = async () => {
      setFatal(null);
      setMessage(null);
      setStatus('queued');
      if (start || attempt > 0) {
        try {
          await storyService.startGeneration(storyId);
          if (cancelled) return;
          creditsRef.current(); // credit vừa được giữ
        } catch (e: any) {
          if (cancelled) return;
          setFatal(
            e?.status === 402
              ? 'Ba mẹ không đủ credit để AI viết truyện này.'
              : e?.message || 'Chưa bắt đầu được AI viết truyện.'
          );
          return;
        }
      }
      void poll();
    };
    void run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [storyId, attempt]);

  if (fatal) {
    return (
      <HeyCard variant="yellow" style={styles.card}>
        <Text style={styles.title}>⚠️ {fatal}</Text>
        <HeyButton title="Thử lại" size="sm" onPress={() => setAttempt((a) => a + 1)} />
        <HeyButton title="← Quay lại" variant="outline" size="sm" onPress={onBack} />
      </HeyCard>
    );
  }

  return (
    <>
      <GenerationPanel
        status={status}
        message={message}
        onRetry={() => setAttempt((a) => a + 1)}
      />
      {(status === 'failed' || status === 'blocked') && (
        <HeyButton title="← Quay lại" variant="outline" size="sm" onPress={onBack} style={styles.back} />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  card: { gap: 10, marginTop: 12 },
  title: { fontSize: 14, fontWeight: '800', color: Colors.primaryText, lineHeight: 20 },
  back: { marginTop: 8, alignSelf: 'flex-start' },
});
