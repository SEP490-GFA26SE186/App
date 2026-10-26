// apps/mobile/App.tsx
// Khung ứng dụng: cung cấp phiên (stores) và điều hướng. Logic nằm ở src/stores và src/navigation.
import React from 'react';
import { SessionProvider } from './src/stores/SessionProvider';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SessionProvider>
      <AppNavigator />
    </SessionProvider>
  );
}
