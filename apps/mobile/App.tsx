// apps/mobile/App.tsx
// Khung ứng dụng: cung cấp phiên (stores) và điều hướng. Logic nằm ở src/stores và src/navigation.
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { SessionProvider } from './src/stores/SessionProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Screen } from './src/components/ui/Screen';
import { ToastProvider } from './src/components/ui/Toast';
import { ICON_FONTS } from './src/components/ui/Icon';
import { IntroScreen } from './src/components/IntroScreen';
import { Colors, FONT_ASSETS } from './src/theme';

// Font nạp từ file trong app nên thường xong ngay; quá hạn này vẫn hiển thị bằng font hệ thống, không chặn app.
const FONT_WAIT_MS = 3000;

// UI Preview (ADR-020): chỉ nạp trong __DEV__ qua require; bản production không chứa module này.
const KidPreview: React.ComponentType<{ onExit: () => void }> | null = __DEV__
  ? require('./src/dev/preview/KidPreview').KidPreview
  : null;

export default function App() {
  // Bật bằng thao tác chủ động ở màn Login; không đổi phiên/Kid Mode thật (app thật vẫn mount bên dưới)
  const [previewOpen, setPreviewOpen] = useState(false);
  // Intro chỉ phát một lần mỗi lần khởi động: App không remount khi đổi tab/logout
  const [introVisible, setIntroVisible] = useState(true);
  const finishIntro = useCallback(() => setIntroVisible(false), []);
  // App thật vẫn mount bên dưới overlay (bootstrap phiên chạy song song) nhưng bị ẩn khỏi tương tác/accessibility
  const appHidden = previewOpen || introVisible;

  // Font thương hiệu (theme/typography) + font icon. Lỗi nạp font chỉ làm chữ dùng font hệ thống.
  const [fontsLoaded, fontError] = useFonts({ ...FONT_ASSETS, ...ICON_FONTS });
  const [fontWaitOver, setFontWaitOver] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFontWaitOver(true), FONT_WAIT_MS);
    return () => clearTimeout(t);
  }, []);
  const fontsReady = fontsLoaded || !!fontError || fontWaitOver;

  // Back của Android đóng Preview thay vì thoát app (handler đăng ký sau chạy trước)
  useEffect(() => {
    if (!previewOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setPreviewOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [previewOpen]);

  // SessionProvider vẫn mount ngay để bootstrap phiên chạy song song; chỉ phần giao diện chờ font.
  if (!fontsReady) {
    return (
      <SessionProvider>
        <View style={styles.fontGate} />
      </SessionProvider>
    );
  }

  return (
    <SessionProvider>
      <ToastProvider>
        {/* Preview/Intro mở: ẩn app thật bên dưới khỏi trình đọc màn hình (Android no-hide-descendants, iOS elementsHidden, Web aria-hidden) */}
        <View
          style={styles.flex}
          importantForAccessibility={appHidden ? 'no-hide-descendants' : 'auto'}
          accessibilityElementsHidden={appHidden}
          aria-hidden={introVisible || undefined}
          pointerEvents={introVisible ? 'none' : 'auto'}
        >
          <AppNavigator onOpenPreview={KidPreview ? () => setPreviewOpen(true) : undefined} />
        </View>
        {KidPreview && previewOpen && (
          <View style={StyleSheet.absoluteFill}>
            <Screen>
              <KidPreview onExit={() => setPreviewOpen(false)} />
            </Screen>
          </View>
        )}
        {introVisible && <IntroScreen onFinish={finishIntro} />}
      </ToastProvider>
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fontGate: { flex: 1, backgroundColor: Colors.canvas },
});
