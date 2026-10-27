// apps/mobile/src/components/parent/GenerationPanel.tsx
// B5 – Theo dõi quá trình AI viết truyện (Web: GenerationPanel). Hiển thị đúng trạng thái BE trả
// (GET /stories/:id/generation: queued | processing | succeeded | failed | blocked); KHÔNG có tiến độ/timer giả.
// R6: khi AI đang chạy, cú Lu Lu ở trạng thái "đang nghĩ" (chỉ là minh họa, không phải tiến độ).
// 'unsupported' = luồng tạo truyện thật chưa được nối (C8): không có truyện nào được tạo, không trừ credit.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HeyCard } from '../ui/HeyCard';
import { HeyButton } from '../ui/HeyButton';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { OwlMascot } from '../OwlMascot';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
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
      <HeyCard variant="brand" style={styles.card}>
        <View style={styles.row}>
          <Icon name="construct-outline" size={20} color={Colors.text} />
          <Text style={styles.title}>Chưa hỗ trợ tạo truyện</Text>
        </View>
        <Text style={styles.text}>
          Tạo truyện bằng AI chưa được kết nối với máy chủ nên chưa có truyện nào được tạo và không có credit nào bị trừ.
        </Text>
        {!!onBack && <HeyButton title="Quay lại chỉnh sửa" iconName="arrow-back" variant="tertiary" size="sm" onPress={onBack} />}
      </HeyCard>
    );
  }

  const meta = GENERATION_STATES[status];
  const busy = status === 'queued' || status === 'processing';
  return (
    <HeyCard style={styles.card}>
      {busy && (
        <View style={styles.owl} accessible accessibilityLabel="Cú Lu Lu đang suy nghĩ">
          <OwlMascot state="thinking" size={88} />
        </View>
      )}
      <View style={styles.statusRow} accessibilityLiveRegion="polite">
        <Badge label={meta.label} tone={meta.tone} />
      </View>
      {busy && <Text style={styles.center}>Lu Lu đang viết truyện cho bé. Ba mẹ có thể chờ ở đây hoặc thoát ra, truyện vẫn được viết tiếp.</Text>}
      {!!message && <Text style={styles.text}>{message}</Text>}
      {status === 'failed' && !!onRetry && <HeyButton title="Thử lại" iconName="refresh" size="sm" onPress={onRetry} />}
    </HeyCard>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.md, marginTop: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusRow: { alignItems: 'center' },
  owl: { alignItems: 'center', paddingVertical: Spacing.sm },
  title: { ...Typography.bodyStrong, color: Colors.text, flex: 1 },
  text: { ...Typography.label, color: Colors.text },
  center: { ...Typography.label, color: Colors.text, textAlign: 'center' },
});
