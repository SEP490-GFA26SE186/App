// apps/mobile/App.tsx
// Khung ứng dụng: cung cấp phiên (stores) và điều hướng. Logic nằm ở src/stores và src/navigation.
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SessionProvider } from './src/stores/SessionProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Screen } from './src/components/ui/Screen';

// UI Preview (ADR-020): chỉ nạp trong __DEV__ qua require; bản production không chứa module này.
const KidPreview: React.ComponentType<{ onExit: () => void }> | null = __DEV__
  ? require('./src/dev/preview/KidPreview').KidPreview
  : null;

export default function App() {
  // Bật bằng thao tác chủ động ở màn Login; không đổi phiên/Kid Mode thật (app thật vẫn mount bên dưới)
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <SessionProvider>
      <AppNavigator onOpenPreview={KidPreview ? () => setPreviewOpen(true) : undefined} />
      {KidPreview && previewOpen && (
        <View style={StyleSheet.absoluteFill}>
          <Screen>
            <KidPreview onExit={() => setPreviewOpen(false)} />
          </Screen>
        </View>
      )}
    </SessionProvider>
  );
}
