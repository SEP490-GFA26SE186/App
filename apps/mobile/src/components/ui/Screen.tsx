// apps/mobile/src/components/ui/Screen.tsx
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

/** Khung màn hình dùng chung: safe area + thanh trạng thái (trước đây lặp ở mỗi nhánh của App.tsx). */
// Android: status bar không translucent (targetSdk 34, không edge-to-edge) nên hệ thống đã đặt nội dung
// ngay dưới status bar — KHÔNG cộng thêm StatusBar.currentHeight (từng gây khoảng trống thừa 48.8dp,
// QA_R1_REPORT.md HIGH-1). Nếu sau này bật translucent/edge-to-edge thì lấy inset từ react-native-safe-area-context.
// iOS: SafeAreaView lo phần tai thỏ/status bar. Web: không có status bar.
export const Screen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="dark-content" backgroundColor={Colors.canvas} translucent={false} />
    {children}
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
});
