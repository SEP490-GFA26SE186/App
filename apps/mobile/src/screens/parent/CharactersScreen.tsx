// apps/mobile/src/screens/parent/CharactersScreen.tsx
// B4/C6 – Nhân vật gia đình (Web: FamilyCharactersPage). Danh sách + thêm/sửa/xóa nhân vật qua BE thật.
// Không có "role" (rev8). Chân dung AI đang tạm dừng (B5) nên chỉ hiện nhãn trạng thái BE trả.
// R8: lưới thẻ (2/3/4 cột theo bề ngang) có ảnh/chữ cái đầu, mô tả, nhãn trạng thái; Sửa/Xóa là nút có icon + chữ.
import React, { useState } from 'react';
import { Alert, View, Text, Image, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyCard } from '../../components/ui/HeyCard';
import { Badge } from '../../components/ui/Badge';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CharacterFormSheet } from '../../components/parent/CharacterFormSheet';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
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

/** Số cột theo bề ngang cửa sổ */
const columnsFor = (width: number) => (width >= 1000 ? 4 : width >= 640 ? 3 : 2);

export const CharactersScreen: React.FC<CharactersScreenProps> = ({
  characters,
  dataStatus,
  onCharacterSaved,
  onCharacterDeleted,
  onBack,
}) => {
  const { width } = useWindowDimensions();
  const cols = columnsFor(width);
  // Rộng thẻ tính bằng px (trừ lề trang và khe) để đủ cột; phần trăm + khe px sẽ tràn dòng
  const cardW = Math.floor((width - Spacing.page * 2 - Spacing.md * (cols - 1)) / cols);
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
      <HeyButton title="Thêm nhân vật" iconName="add" onPress={() => openForm()} />

      {loading ? (
        <StateView variant="skeleton" title="Đang tải nhân vật..." />
      ) : characters.length === 0 ? (
        <StateView
          variant={dataStatus === 'error' ? 'error' : 'empty'}
          title={dataStatus === 'error' ? 'Không tải được nhân vật' : 'Chưa có nhân vật nào'}
          description={
            dataStatus === 'error'
              ? 'Ba mẹ thử tải lại ở dải thông báo phía trên nhé.'
              : 'Thêm người thân để AI viết truyện gần gũi với bé hơn.'
          }
          actionLabel={dataStatus === 'error' ? undefined : 'Thêm nhân vật'}
          onAction={dataStatus === 'error' ? undefined : () => openForm()}
        />
      ) : (
        <View style={styles.grid}>
          {characters.map((c) => (
            <HeyCard key={c.id} style={[styles.card, { width: cardW }]}>
              {c.photoReferenceUrl ? (
                <Image source={{ uri: c.photoReferenceUrl }} style={styles.portrait} accessibilityIgnoresInvertColors accessible={false} />
              ) : (
                <View style={[styles.portrait, styles.initialBox]} accessible={false}>
                  <Text style={styles.initial}>{(c.name || '?').trim().charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <Text style={styles.name} numberOfLines={1} accessibilityRole="header">
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
                <HeyButton title="Sửa" iconName="create-outline" variant="tertiary" size="sm" onPress={() => openForm(c)} accessibilityLabel={`Sửa nhân vật ${c.name}`} />
                {!c.childId && (
                  <HeyButton
                    title="Xóa"
                    iconName="trash-outline"
                    variant="tertiary"
                    size="sm"
                    loading={deletingId === c.id}
                    disabled={!!deletingId}
                    onPress={() => confirmDelete(c)}
                    accessibilityLabel={`Xóa nhân vật ${c.name}`}
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
  content: { padding: Spacing.page, paddingBottom: Spacing.xxxl, gap: Spacing.md },
  topRow: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, rowGap: Spacing.md },
  card: { gap: Spacing.sm },
  name: { ...Typography.bodyStrong, color: Colors.text },
  appearance: { ...Typography.caption, color: Colors.textMuted },
  badges: { gap: Spacing.xs, alignItems: 'flex-start' },
  portrait: { width: '100%', aspectRatio: 1, borderRadius: Radius.md, backgroundColor: Colors.brandTint },
  initialBox: { alignItems: 'center', justifyContent: 'center' },
  initial: { ...Typography.display, color: Colors.brandStrong },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
});
