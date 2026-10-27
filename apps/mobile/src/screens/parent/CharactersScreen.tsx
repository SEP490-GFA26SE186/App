// apps/mobile/src/screens/parent/CharactersScreen.tsx
// B4/C6 – Nhân vật gia đình (Web: FamilyCharactersPage). Danh sách + thêm/sửa/xóa nhân vật qua BE thật.
// Không có "role" (rev8). Chân dung AI đang tạm dừng (B5) nên chỉ hiện nhãn trạng thái BE trả.
import React, { useState } from 'react';
import { Alert, View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyCard } from '../../components/ui/HeyCard';
import { Badge } from '../../components/ui/Badge';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CharacterFormSheet } from '../../components/parent/CharacterFormSheet';
import { Colors } from '../../theme/colors';
import { CharacterView } from '../../types/viewModels';
import { characterService } from '../../services';
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
  onCharacterSaved: (character: CharacterView, isNew: boolean) => void;
  onCharacterDeleted: (id: string) => void;
  onBack: () => void;
}

export const CharactersScreen: React.FC<CharactersScreenProps> = ({
  characters,
  dataStatus,
  onCharacterSaved,
  onCharacterDeleted,
  onBack,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CharacterView | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const openForm = (c?: CharacterView) => {
    setEditing(c);
    setFormOpen(true);
  };
  const confirmDelete = (c: CharacterView) => {
    if (deletingId) return;
    Alert.alert(`Xóa nhân vật ${c.name}?`, 'Các truyện đã tạo vẫn giữ nguyên.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(c.id);
          try {
            await characterService.deleteCharacter(c.id);
            onCharacterDeleted(c.id);
          } catch (err: any) {
            Alert.alert('Không xóa được nhân vật', err?.message || 'Vui lòng thử lại.');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };
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
      <HeyButton title="➕ Thêm nhân vật" onPress={() => openForm()} style={styles.addBtn} />

      {loading ? (
        <StateView variant="skeleton" title="Đang tải nhân vật..." />
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
              {!!c.photoReferenceUrl && <Image source={{ uri: c.photoReferenceUrl }} style={styles.portrait} />}
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
              <View style={styles.actions}>
                <HeyButton title="✏️ Sửa" variant="outline" size="sm" onPress={() => openForm(c)} />
                {!c.childId && (
                  <HeyButton
                    title={deletingId === c.id ? '⏳' : '🗑️ Xóa'}
                    variant="outline"
                    size="sm"
                    disabled={!!deletingId}
                    onPress={() => confirmDelete(c)}
                  />
                )}
              </View>
            </HeyCard>
          ))}
        </View>
      )}

      <CharacterFormSheet
        visible={formOpen}
        character={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(c) => onCharacterSaved(c, !editing)}
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
  portrait: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#F1F5F9' },
  actions: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
});
