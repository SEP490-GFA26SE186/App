// apps/mobile/src/components/kid/KidPinOverlay.tsx — R4: khoá phụ huynh (nhập PIN để thoát Kid Mode).
// CHỈ HIỂN THỊ: logic (gửi PIN lên BE, đếm lần thử, khóa tạm, mất phiên) nằm ở KidModeScreen.
// Là lớp phủ trong cây component, KHÔNG dùng <Modal>: trên Android New Architecture, Modal cạnh header Reanimated
// bị kẹt kích thước 0×0 (QA_R1 CRIT-1). Giữ nguyên cách làm này.
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Radius, Spacing, Touch } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { MASCOT_IMAGE } from '../../constants/mascot';
import { HeyButton } from '../ui/HeyButton';
import { Icon } from '../ui/Icon';

interface Props {
  pin: string;
  /** Vừa nhập sai: chấm PIN đổi sang đỏ */
  error: boolean;
  message: string | null;
  verifying: boolean;
  sessionLost: boolean;
  onDigit: (digit: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onSessionLost: () => void;
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const Key: React.FC<{ label: string; onPress: () => void; children: React.ReactNode }> = ({ label, onPress, children }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    style={(s) => [styles.key, s.pressed && styles.keyPressed, focusRing(s)]}
  >
    {children}
  </Pressable>
);

export const KidPinOverlay: React.FC<Props> = ({ pin, error, message, verifying, sessionLost, onDigit, onClear, onBackspace, onConfirm, onCancel, onSessionLost }) => (
  <View style={styles.overlay} accessibilityViewIsModal aria-modal>
    <View style={styles.card}>
      <Image source={MASCOT_IMAGE} style={styles.mascot} accessibilityIgnoresInvertColors accessible={false} />
      <Text style={styles.title} accessibilityRole="header">
        Khoá Phụ Huynh
      </Text>
      <Text style={styles.subtitle}>Nhập mã PIN của ba mẹ (4–6 số) để thoát</Text>

      {!!message && !sessionLost && (
        <Text style={styles.message} accessibilityLiveRegion="polite">
          {message}
        </Text>
      )}

      {sessionLost && (
        <View style={styles.lostBox}>
          <Text style={styles.message}>Phiên Chế độ Bé không còn hợp lệ nên không thể xác nhận bằng mã PIN.</Text>
          <HeyButton title="Đăng nhập lại bằng mật khẩu" variant="secondary" size="md" onPress={onSessionLost} />
        </View>
      )}

      {/* Chỉ đọc số chữ số đã nhập, không bao giờ đọc chính mã PIN */}
      <View style={styles.dots} accessible accessibilityLabel={`Đã nhập ${pin.length} số`} accessibilityLiveRegion="polite">
        {Array.from({ length: Math.max(4, pin.length) }, (_, i) => (
          <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled, error && styles.dotError]} />
        ))}
      </View>

      <View style={styles.keypad}>
        {DIGITS.map((d) => (
          <Key key={d} label={`Số ${d}`} onPress={() => onDigit(d)}>
            <Text style={styles.keyText}>{d}</Text>
          </Key>
        ))}
        <Key label="Xóa hết" onPress={onClear}>
          <Text style={styles.keyText}>C</Text>
        </Key>
        <Key label="Số 0" onPress={() => onDigit('0')}>
          <Text style={styles.keyText}>0</Text>
        </Key>
        <Key label="Xóa số vừa nhập" onPress={onBackspace}>
          <Icon name="backspace-outline" size={26} color={Colors.text} />
        </Key>
      </View>

      <View style={styles.actions}>
        <View style={styles.cancel}>
          <HeyButton title="Hủy" variant="tertiary" size="lg" onPress={onCancel} />
        </View>
        <View style={styles.confirm}>
          <HeyButton title="Xác nhận" variant="secondary" size="lg" loading={verifying} disabled={pin.length < 4 || sessionLost} onPress={onConfirm} />
        </View>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 10, elevation: 10, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  card: { width: '100%', maxWidth: 340, backgroundColor: Colors.surface, borderRadius: Radius.xxl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  mascot: { width: 64, height: 64, borderRadius: 32 },
  title: { ...Typography.kidTitle, fontSize: 22, color: Colors.text },
  subtitle: { ...Typography.body, fontSize: 14, lineHeight: 20, color: Colors.textMuted, textAlign: 'center' },
  message: { ...Typography.label, color: Colors.danger, textAlign: 'center' },
  lostBox: { alignItems: 'center', gap: Spacing.sm },
  dots: { flexDirection: 'row', gap: Spacing.md, minHeight: 28, alignItems: 'center', marginVertical: Spacing.xs },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.outlineStrong, backgroundColor: Colors.tealTint },
  dotFilled: { backgroundColor: Colors.brand, borderColor: Colors.brandStrong },
  dotError: { backgroundColor: Colors.dangerTint, borderColor: Colors.danger },
  keypad: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing.sm },
  key: { width: '31%', height: Touch.kidLarge - 4, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.lg, backgroundColor: Colors.canvas, borderWidth: 1.5, borderColor: Colors.outline },
  keyPressed: { backgroundColor: Colors.brandTint, transform: [{ scale: 0.96 }] },
  keyText: { fontFamily: FontFamily.extraBold, fontSize: 24, color: Colors.text },
  actions: { width: '100%', flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, alignItems: 'center' },
  cancel: { flex: 1 },
  confirm: { flex: 2 },
});
