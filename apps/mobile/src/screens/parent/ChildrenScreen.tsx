// apps/mobile/src/screens/parent/ChildrenScreen.tsx
// B3/C6 – Hồ sơ bé (Web: ChildrenPage). Danh sách + chọn bé + thêm/sửa/xóa hồ sơ qua BE thật.
// Phase 1: "Chi tiết" mở hồ sơ + thời gian đọc + tủ sách của bé (ChildDetailScreen).
// R8: thẻ bé có avatar, "Vào Chế độ Bé" là hành động chính (PIN vẫn do BE xác minh ở Kid Mode), Chọn/Sửa/Xóa là hành động phụ có icon + chữ.
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChildProfile } from '../../types/domain';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyCard } from '../../components/ui/HeyCard';
import { Badge } from '../../components/ui/Badge';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { useDialog } from '../../components/ui/Dialog';
import { ChildFormSheet } from '../../components/parent/ChildFormSheet';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
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
  onOpenDetail: (child: ChildProfile) => void;
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
  onOpenDetail,
  onOpenSettings,
  onBack,
}) => {
  const dialog = useDialog();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ChildProfile | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const openForm = (child?: ChildProfile) => {
    setEditing(child);
    setFormOpen(true);
  };
  const confirmDelete = async (child: ChildProfile) => {
    if (deletingId) return;
    const ok = await dialog.confirm({
      title: `Xóa hồ sơ của ${child.name}?`,
      message: 'Tủ sách và tiến độ đọc của bé sẽ không còn hiển thị. Thao tác này không hoàn tác được.',
      confirmLabel: 'Xóa',
      destructive: true,
    });
    if (!ok) return;
    setDeletingId(child.id);
    try {
      await childService.deleteChild(child.id);
      onChildDeleted(child.id);
    } catch (err: any) {
      void dialog.notify('Không xóa được hồ sơ', err?.message || 'Vui lòng thử lại.');
    } finally {
      setDeletingId(null);
    }
  };
  const loading = dataStatus === 'loading' && childrenProfiles.length === 0;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Bé nhà mình"
        subtitle="Quản lý hồ sơ từng bé và vào Chế độ Trẻ Em."
        onBack={onBack}
      />

      <HeyButton title="Thêm hồ sơ bé mới" iconName="add" onPress={() => openForm()} />

      {!hasKidPin && (
        <HeyCard variant="brand" style={styles.notice}>
          <Text style={styles.noticeTitle}>Chưa đặt mã PIN cho Chế độ Trẻ Em</Text>
          <Text style={styles.noticeText}>Ba mẹ cần đặt PIN trước khi cho bé vào Chế độ Trẻ Em.</Text>
          <HeyButton title="Đặt mã PIN" iconName="lock-closed-outline" variant="tertiary" size="sm" onPress={onOpenSettings} style={styles.noticeBtn} />
        </HeyCard>
      )}

      {loading ? (
        <StateView variant="skeleton" title="Đang tải hồ sơ bé..." />
      ) : childrenProfiles.length === 0 ? (
        <StateView
          variant={dataStatus === 'error' ? 'error' : 'empty'}
          title={dataStatus === 'error' ? 'Không tải được hồ sơ bé' : 'Chưa có hồ sơ bé nào'}
          description={
            dataStatus === 'error'
              ? 'Ba mẹ thử tải lại ở dải thông báo phía trên nhé.'
              : 'Thêm hồ sơ để bé có tủ sách và báo cáo EQ riêng.'
          }
          actionLabel={dataStatus === 'error' ? undefined : 'Thêm hồ sơ bé'}
          onAction={dataStatus === 'error' ? undefined : () => openForm()}
        />
      ) : (
        childrenProfiles.map((c) => {
          const selected = c.id === selectedChildId;
          return (
            <HeyCard key={c.id} style={[styles.card, selected && styles.cardSelected]}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
                    {childEmoji(c)}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.name} accessibilityRole="header">
                    {c.name}
                  </Text>
                  <Text style={styles.meta}>
                    {ageLabel(c)}
                    {c.birthDate ? ` • ${formatBirthDate(c.birthDate)}` : ''}
                  </Text>
                </View>
                {selected && <Badge label="Đang chọn" tone="success" />}
              </View>
              <HeyButton
                title={`Vào Chế độ Bé · ${c.name}`}
                accessibilityLabel={`Vào Chế độ Bé của ${c.name}`}
                iconName="happy"
                variant="secondary"
                onPress={() => onOpenKidMode(c)}
              />
              <View style={styles.cardActions}>
                <HeyButton title="Chi tiết" iconName="information-circle-outline" variant="tertiary" size="sm" onPress={() => onOpenDetail(c)} />
                {!selected && (
                  <HeyButton title="Chọn bé" iconName="checkmark-circle-outline" variant="tertiary" size="sm" onPress={() => onSelect(c.id)} />
                )}
                <HeyButton title="Sửa" iconName="create-outline" variant="tertiary" size="sm" onPress={() => openForm(c)} />
                <HeyButton
                  title="Xóa"
                  iconName="trash-outline"
                  variant="tertiary"
                  size="sm"
                  loading={deletingId === c.id}
                  disabled={!!deletingId}
                  onPress={() => confirmDelete(c)}
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
  content: { padding: Spacing.page, paddingBottom: Spacing.xxxl, gap: Spacing.md },
  notice: { gap: Spacing.xs },
  noticeTitle: { ...Typography.bodyStrong, color: Colors.brandInk },
  noticeText: { ...Typography.label, color: Colors.brandInk },
  noticeBtn: { alignSelf: 'flex-start', marginTop: Spacing.xs },
  card: { gap: Spacing.md },
  cardSelected: { borderWidth: 2, borderColor: Colors.tealStrong },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.tealTint, borderWidth: 2, borderColor: Colors.tealBright },
  emoji: { fontSize: 30 },
  cardInfo: { flex: 1, minWidth: 0 },
  name: { ...Typography.title, fontSize: 18, color: Colors.text },
  meta: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
