// apps/mobile/src/screens/parent/CharactersScreen.tsx
// B4 – Nhân vật gia đình (Web: FamilyCharactersPage). Danh sách + thêm nhân vật (BE thật); sửa/xóa chờ API (C6).
// Không có "role" (rev8). Chân dung AI đang tạm dừng (B5) nên chỉ hiện nhãn trạng thái BE trả.
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyCard } from '../../components/ui/HeyCard';
import { Badge } from '../../components/ui/Badge';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CharacterFormSheet } from '../../components/parent/CharacterFormSheet';
import { Colors } from '../../theme/colors';
import { CharacterView } from '../../types/viewModels';
import type { DataStatus } from '../../stores/useParentData';

const PORTRAIT_LABELS: Record<string, string> = {
  none: 'Chưa có chân dung',
  queued: 'Chân dung: đang xếp hàng',
  generating: 'Chân dung: đang vẽ',
  ready: 'Có chân dung',
  failed: 'Chân dung: chưa vẽ được',
};

interface CharactersScreenProps {
  characters: CharacterView[];
  dataStatus: DataStatus;
  onCharacterCreated: (character: CharacterView) => void;
  onBack: () => void;
}

export const CharactersScreen: React.FC<CharactersScreenProps> = ({
  characters,
  dataStatus,
  onCharacterCreated,
  onBack,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const loading = dataStatus === 'loading' && characters.length === 0;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Nhân vật gia đình"
        subtitle="Thêm ông bà, anh chị, bạn thân hay thú cưng một lần, dùng lại cho mọi truyện."
        onBack={onBack}
      />

      <View style={styles.topRow}>
        <Badge label={`${characters.length} nhân vật`} tone="neutral" />
      </View>
      <HeyButton title="➕ Thêm nhân vật" onPress={() => setFormOpen(true)} style={styles.addBtn} />

      {loading ? (
        <StateView variant="loading" title="Đang tải nhân vật..." />
      ) : characters.length === 0 ? (
        <StateView
          variant="empty"
          title="Chưa có nhân vật nào"
          description={
            dataStatus === 'error'
              ? 'Không tải được danh sách nhân vật. Ba mẹ thử tải lại ở dải thông báo phía trên nhé.'
              : 'Thêm người thân để AI viết truyện gần gũi với bé hơn.'
          }
        />
      ) : (
        <View style={styles.grid}>
          {characters.map((c) => (
            <HeyCard key={c.id} style={styles.card}>
              <Text style={styles.name} numberOfLines={1}>
                {c.name}
              </Text>
              <Text style={styles.appearance} numberOfLines={4}>
                {c.appearanceDescription}
              </Text>
              <View style={styles.badges}>
                <Badge
                  label={PORTRAIT_LABELS[c.portraitStatus ?? 'none'] ?? 'Chân dung: chưa rõ'}
                  tone={c.portraitStatus === 'ready' ? 'success' : 'neutral'}
                />
                {!!c.childId && <Badge label="Nhân vật của bé" tone="info" />}
              </View>
            </HeyCard>
          ))}
        </View>
      )}

      {characters.length > 0 && (
        <Text style={styles.footnote}>Chỉnh sửa và xóa nhân vật sẽ có khi ứng dụng kết nối đầy đủ với máy chủ.</Text>
      )}

      <CharacterFormSheet
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={onCharacterCreated}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  topRow: { flexDirection: 'row', marginBottom: 8 },
  addBtn: { marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '48%', gap: 6 },
  name: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  appearance: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  badges: { gap: 4, marginTop: 4 },
  footnote: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginTop: 12 },
});
