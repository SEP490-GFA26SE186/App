// apps/mobile/src/screens/auth/BootScreen.tsx
// Hai trạng thái khi khởi động: đang xác minh phiên với BE, hoặc không xác minh được (cho thử lại / đăng xuất).
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { HeyButton } from '../../components/ui/HeyButton';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';

export const BootScreen: React.FC = () => (
  <View style={styles.centerBox} accessibilityRole="progressbar" accessibilityLabel="Đang kiểm tra phiên đăng nhập">
    <ActivityIndicator size="large" color={Colors.brandStrong} />
    <Text style={styles.centerText}>Đang kiểm tra phiên đăng nhập...</Text>
  </View>
);

export const BootErrorScreen: React.FC<{
  message: string | null;
  onRetry: () => void;
  onLogout: () => void;
}> = ({ message, onRetry, onLogout }) => (
  <View style={styles.centerBox}>
    <Text style={styles.centerTitle} accessibilityRole="header">
      Không thể xác minh phiên đăng nhập
    </Text>
    {!!message && (
      <Text style={styles.centerText} accessibilityRole="alert">
        {message}
      </Text>
    )}
    <HeyButton title="Thử lại" onPress={onRetry} style={styles.centerBtn} />
    <HeyButton title="Đăng xuất" variant="tertiary" onPress={onLogout} style={styles.centerBtn} />
  </View>
);

const styles = StyleSheet.create({
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, backgroundColor: Colors.canvas },
  centerTitle: { ...Typography.heading, color: Colors.text, marginBottom: Spacing.sm, textAlign: 'center' },
  centerText: { ...Typography.body, fontSize: 14, color: Colors.text, marginTop: Spacing.md, marginBottom: Spacing.lg, textAlign: 'center' },
  centerBtn: { alignSelf: 'stretch', marginTop: Spacing.sm },
});
