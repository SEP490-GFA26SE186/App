// apps/mobile/src/screens/auth/BootScreen.tsx
// Hai trạng thái khi khởi động: đang xác minh phiên với BE, hoặc không xác minh được (cho thử lại / đăng xuất).
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { HeyButton } from '../../components/ui/HeyButton';
import { Colors } from '../../theme/colors';

export const BootScreen: React.FC = () => (
  <View style={styles.centerBox}>
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text style={styles.centerText}>Đang kiểm tra phiên đăng nhập...</Text>
  </View>
);

export const BootErrorScreen: React.FC<{
  message: string | null;
  onRetry: () => void;
  onLogout: () => void;
}> = ({ message, onRetry, onLogout }) => (
  <View style={styles.centerBox}>
    <Text style={styles.centerTitle}>Không thể xác minh phiên đăng nhập</Text>
    <Text style={styles.centerText}>{message}</Text>
    <HeyButton title="Thử lại" onPress={onRetry} style={styles.centerBtn} />
    <HeyButton title="Đăng xuất" variant="outline" onPress={onLogout} style={styles.centerBtn} />
  </View>
);

const styles = StyleSheet.create({
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  centerText: {
    fontSize: 14,
    color: Colors.textDark,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  centerBtn: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
});
