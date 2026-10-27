// apps/mobile/src/components/ui/Sheet.tsx
// Bottom sheet cho form thêm/sửa (thay Modal giữa màn của Web). Tránh bàn phím che nội dung.
// R2: nút đóng là icon vector, viền focus trên Web.
import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Elevation } from '../../theme/shadows';
import { Radius, Touch } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { Icon } from './Icon';

interface SheetProps {
  visible: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ visible, title, description, onClose, children, footer }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
        accessibilityLabel="Đóng"
        importantForAccessibility="no"
      />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Pressable
            onPress={onClose}
            style={(state) => [styles.closeBtn, state.pressed && styles.closePressed, focusRing(state)]}
            accessibilityRole="button"
            accessibilityLabel="Đóng"
          >
            <Icon name="close" size={24} color={Colors.textMuted} />
          </Pressable>
        </View>
        {!!description && <Text style={styles.desc}>{description}</Text>}
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        {footer}
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: 18,
    paddingBottom: 18,
    maxHeight: '88%',
    ...Elevation.high,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outline,
    marginTop: 8,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  title: { ...Typography.heading, fontSize: 18, lineHeight: 24, color: Colors.text, flex: 1 },
  closeBtn: { width: Touch.min, height: Touch.min, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  closePressed: { opacity: 0.6 },
  desc: { ...Typography.body, fontSize: 13, lineHeight: 19, color: Colors.textMuted, marginBottom: 8 },
});
