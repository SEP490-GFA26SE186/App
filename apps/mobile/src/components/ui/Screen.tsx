// apps/mobile/src/components/ui/Screen.tsx
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Platform } from 'react-native';

/** Khung màn hình dùng chung: safe area + thanh trạng thái (trước đây lặp ở mỗi nhánh của App.tsx). */
export const Screen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
    {children}
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});
