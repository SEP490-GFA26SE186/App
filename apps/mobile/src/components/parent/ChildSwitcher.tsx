// apps/mobile/src/components/parent/ChildSwitcher.tsx
// Chọn bé đang xem (Web: ChildSwitcher + parentStore.selectedChildId). Chỉ hiện khi có từ 2 bé trở lên.
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ChildProfile } from '../../types/domain';
import { HeyChip } from '../ui/HeyChip';
import { childEmoji } from '../../utils/child';

interface ChildSwitcherProps {
  childrenProfiles: ChildProfile[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export const ChildSwitcher: React.FC<ChildSwitcherProps> = ({ childrenProfiles, selectedId, onSelect }) => {
  if (childrenProfiles.length < 2) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {childrenProfiles.map((c) => (
        <HeyChip
          key={c.id}
          label={`${childEmoji(c)} ${c.name}`}
          selected={c.id === selectedId}
          onPress={() => onSelect(c.id)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4, paddingRight: 8 },
});
