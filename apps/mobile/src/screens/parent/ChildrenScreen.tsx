// apps/mobile/src/screens/parent/ChildrenScreen.tsx
// B3/C6 – Hồ sơ bé (Web: ChildrenPage). Danh sách + chọn bé + thêm/sửa/xóa hồ sơ qua BE thật.
import React, { useState } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChildProfile } from '../../types/domain';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyCard } from '../../components/ui/HeyCard';
import { Badge } from '../../components/ui/Badge';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ChildFormSheet } from '../../components/parent/ChildFormSheet';
import { Colors } from '../../theme/colors';
import { ageLabel, childEmoji, formatBirthDate } from '../../utils/child';
import { childService } from '../../services';
import type { DataStatus } from '../../stores/useParentData';

interface ChildrenScreenProps {
  childrenProfiles: ChildProfile[];
  selectedChildId?: string;
  dataStatus: DataStatus;
  hasKidPin: boolean;
  onSelect: (id: string) => void;
  onChildSaved: (child: ChildProfile, isNew: boolean) => void;
  onChildDeleted: (id: string) => void;
  onOpenKidMode: (child: ChildProfile) => void;
  onOpenSettings: () => void;
  onBack: () => void;
}

export const ChildrenScreen: React.FC<ChildrenScreenProps> = ({
  childrenProfiles,
  selectedChildId,
  dataStatus,
  hasKidPin,
  onSelect,
  onChildSaved,
  onChildDeleted,
  onOpenKidMode,
  onOpenSettings,
  onBack,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ChildProfile | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const openForm = (child?: ChildProfile) => {
    setEditing(child);
    setFormOpen(true);
  };
  const confirmDelete = (child: ChildProfile) => {
    if (deletingId) return;
    Alert.alert(
      `Xóa hồ sơ của ${child.name}?`,
      'Tủ sách và tiến độ đọc của bé sẽ không còn hiển thị. Thao tác này không hoàn tác được.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(child.id);
            try {
              await childService.deleteChild(child.id);
              onChildDeleted(child.id);
            } catch (err: any) {
              Alert.alert('Không xóa được hồ sơ', err?.message || 'Vui lòng thử lại.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };
  const loading = dataStatus === 'loading' && childrenProfiles.length === 0;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Bé nhà mình"
        subtitle="Quản lý hồ sơ từng bé và vào Chế độ Trẻ Em."
        onBack={onBack}
      />

      <HeyButton title="➕ Thêm hồ sơ bé mới" onPress={() => openForm()} style={styles.addBtn} />

      {!hasKidPin && (
        <HeyCard variant="yellow" style={styles.notice}>
          <Text style={styles.noticeTitle}>Chưa đặt mã PIN cho Chế độ Trẻ Em</Text>
          <Text style={styles.noticeText}>Ba mẹ cần đặt PIN trước khi cho bé vào Chế độ Trẻ Em.</Text>
          <HeyButton title="Đặt mã PIN" variant="outline" size="sm" onPress={onOpenSettings} style={styles.noticeBtn} />
        </HeyCard>
      )}

      {loading ? (
        <StateView variant="loading" title="Đang tải hồ sơ bé..." />
      ) : childrenProfiles.length === 0 ? (
        <StateView
          variant="empty"
          title="Chưa có hồ sơ bé nào"
          description={
            dataStatus === 'error'
              ? 'Không tải được danh sách hồ sơ bé. Ba mẹ thử tải lại ở dải thông báo phía trên nhé.'
              : 'Thêm hồ sơ để bé có tủ sách và báo cáo EQ riêng.'
          }
        />
      ) : (
        childrenProfiles.map((c) => {
          const selected = c.id === selectedChildId;
          return (
            <HeyCard key={c.id} style={[styles.card, selected && styles.cardSelected]}>
              <View style={styles.cardTop}>
                <Text style={styles.emoji}>{childEmoji(c)}</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.name}>{c.name}</Text>
                  <Text style={styles.meta}>
                    {ageLabel(c)}
                    {c.birthDate ? ` • ${formatBirthDate(c.birthDate)}` : ''}
                  </Text>
                </View>
                {selected && <Badge label="Đang chọn" tone="success" />}
              </View>
              <View style={styles.cardActions}>
                {!selected && (
                  <HeyButton title="Chọn bé" variant="outline" size="sm" onPress={() => onSelect(c.id)} style={styles.actionBtn} />
                )}
                <HeyButton title="👶 Chế độ Bé" variant="teal" size="sm" onPress={() => onOpenKidMode(c)} style={styles.actionBtn} />
                <HeyButton title="✏️ Sửa" variant="outline" size="sm" onPress={() => openForm(c)} style={styles.actionBtn} />
                <HeyButton
                  title={deletingId === c.id ? '⏳ Đang xóa...' : '🗑️ Xóa'}
                  variant="outline"
                  size="sm"
                  disabled={!!deletingId}
                  onPress={() => confirmDelete(c)}
                  style={styles.actionBtn}
                />
              </View>
            </HeyCard>
          );
        })
      )}

      <ChildFormSheet
        visible={formOpen}
        child={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(child) => {
          onChildSaved(child, !editing);
          if (!editing) onSelect(child.id);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  addBtn: { marginBottom: 12 },
  notice: { marginBottom: 12, gap: 4 },
  noticeTitle: { fontSize: 14, fontWeight: '800', color: Colors.primaryText },
  noticeText: { fontSize: 12, color: Colors.primaryText },
  noticeBtn: { alignSelf: 'flex-start', marginTop: 6 },
  card: { marginBottom: 12 },
  cardSelected: { borderWidth: 2, borderColor: Colors.secondary },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 36 },
  cardInfo: { flex: 1 },
  name: { fontSize: 17, fontWeight: '900', color: Colors.textPrimary },
  meta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, justifyContent: 'flex-end' },
  actionBtn: { minWidth: 110 },
});
