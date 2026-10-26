// apps/mobile/src/components/parent/GenerationPanel.tsx
// B5 – Theo dõi quá trình AI viết truyện (Web: GenerationPanel). Hiển thị đúng trạng thái BE trả
// (GET /stories/:id/generation: queued | processing | succeeded | failed | blocked); KHÔNG có tiến độ/timer giả.
// 'unsupported' = luồng tạo truyện thật chưa được nối (C8): không có truyện nào được tạo, không trừ credit.
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { HeyCard } from '../ui/HeyCard';
import { HeyButton } from '../ui/HeyButton';
import { Badge } from '../ui/Badge';
import { Colors } from '../../theme/colors';
import { GENERATION_STATES, GenerationStatus } from '../../constants/story';

interface GenerationPanelProps {
  status: GenerationStatus | 'unsupported';
  /** Lý do lỗi/bị chặn do BE trả (errorMessage) */
  message?: string | null;
  onRetry?: () => void;
  onBack?: () => void;
}

export const GenerationPanel: React.FC<GenerationPanelProps> = ({ status, message, onRetry, onBack }) => {
  if (status === 'unsupported') {
    return (
      <HeyCard variant="yellow" style={styles.card}>
        <Text style={styles.title}>🚧 Chưa hỗ trợ tạo truyện</Text>
        <Text style={styles.text}>
          Tạo truyện bằng AI chưa được kết nối với máy chủ nên chưa có truyện nào được tạo và không có credit nào bị trừ.
        </Text>
        {!!onBack && <HeyButton title="← Quay lại chỉnh sửa" variant="outline" size="sm" onPress={onBack} />}
      </HeyCard>
    );
  }

  const meta = GENERATION_STATES[status];
  const busy = status === 'queued' || status === 'processing';
  return (
    <HeyCard style={styles.card}>
      <View style={styles.row}>
        {busy && <ActivityIndicator color={Colors.primaryDark} />}
        <Badge label={meta.label} tone={meta.tone} />
      </View>
      {!!message && <Text style={styles.text}>{message}</Text>}
      {status === 'failed' && !!onRetry && <HeyButton title="Thử lại" size="sm" onPress={onRetry} />}
    </HeyCard>
  );
};

const styles = StyleSheet.create({
  card: { gap: 10, marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 15, fontWeight: '900', color: Colors.primaryText },
  text: { fontSize: 13, color: Colors.primaryText, lineHeight: 19 },
});
