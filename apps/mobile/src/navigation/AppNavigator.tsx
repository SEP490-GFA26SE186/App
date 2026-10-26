// apps/mobile/src/navigation/AppNavigator.tsx
// Điều hướng cấp ứng dụng bằng state (ADR-015): theo giai đoạn phiên, rồi Parent hoặc Kid Mode.
// Chỉ vào giao diện Parent/Kid khi phiên đã được BE xác nhận (appPhase === 'APP' và có currentUser).
import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Role } from '../../../../packages/shared-types';
import { Screen } from '../components/ui/Screen';
import { Colors } from '../theme/colors';
import { useAuth, useKidSession, useParentData } from '../stores/SessionProvider';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { BootScreen, BootErrorScreen } from '../screens/auth/BootScreen';
import { KidModeScreen } from '../screens/kid/KidModeScreen';
import { ParentTabs } from './ParentTabs';
import { ROUTES, RouteKey } from './routes';

// Chỉ được mount khi đang trong phiên: state điều hướng tự reset khi đăng xuất/đổi tài khoản.
const AuthedNavigator: React.FC = () => {
  const auth = useAuth();
  const { stories } = useParentData();
  const kid = useKidSession();
  // Giữ ở đây (không ở ParentTabs) để quay lại đúng tab sau khi thoát Kid Mode
  const [currentTab, setCurrentTab] = useState<RouteKey>(ROUTES.HOME);
  const [activeRole, setActiveRole] = useState<Role>('PARENT');

  // Không bao giờ vào giao diện khi chưa có user do BE xác nhận
  if (!auth.currentUser) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </Screen>
    );
  }

  if (kid.isKidMode && kid.kidChild) {
    return (
      <Screen>
        <KidModeScreen
          child={kid.kidChild}
          stories={stories}
          onExitKidMode={kid.exitKidMode}
          onKidSessionLost={auth.onKidSessionLost}
          onRecordEqSignal={(signal, skill) => {
            console.log('Record EQ signal:', signal, skill);
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ParentTabs
        currentUser={auth.currentUser}
        currentTab={currentTab}
        navigate={setCurrentTab}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
      />
    </Screen>
  );
};

export const AppNavigator: React.FC = () => {
  const auth = useAuth();

  switch (auth.appPhase) {
    case 'BOOTING':
      return (
        <Screen>
          <BootScreen />
        </Screen>
      );
    case 'BOOT_ERROR':
      return (
        <Screen>
          <BootErrorScreen message={auth.bootError} onRetry={auth.bootstrapSession} onLogout={auth.logout} />
        </Screen>
      );
    case 'LOGIN':
      return (
        <Screen>
          <LoginScreen
            initialMessage={auth.loginNotice}
            onLoginSuccess={auth.startSession}
            onGoRegister={auth.showRegister}
          />
        </Screen>
      );
    case 'REGISTER':
      return (
        <Screen>
          <RegisterScreen onRegisterSuccess={auth.startSession} onGoLogin={auth.showLogin} />
        </Screen>
      );
    default:
      return <AuthedNavigator />;
  }
};
