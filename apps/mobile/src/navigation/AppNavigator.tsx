// apps/mobile/src/navigation/AppNavigator.tsx
// Điều hướng cấp ứng dụng bằng state (ADR-015): theo giai đoạn phiên, rồi Parent hoặc Kid Mode.
// Chỉ vào giao diện Parent/Kid khi phiên đã được BE xác nhận (appPhase === 'APP' và có currentUser).
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, BackHandler } from 'react-native';
import { Role } from '../types/domain';
import { Screen } from '../components/ui/Screen';
import { Colors } from '../theme/colors';
import { useAuth, useKidSession } from '../stores/SessionProvider';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { BootScreen, BootErrorScreen } from '../screens/auth/BootScreen';
import { KidModeScreen } from '../screens/kid/KidModeScreen';
import { kidService } from '../services/kidService';
import { ParentTabs } from './ParentTabs';
import { useParentNavigation } from './useParentNavigation';
import { AdminNavigator } from './AdminNavigator';
import { SpecialistNavigator } from './SpecialistNavigator';
import { shellForRole } from './managementRoutes';
import { StateView } from '../components/ui/StateView';
import { SessionUser } from '../types/sessionUser';

// Chỉ được mount khi đang trong phiên: state điều hướng tự reset khi đăng xuất/đổi tài khoản.
// Chọn khung theo role do BE xác nhận; role lạ không bao giờ rơi vào giao diện Phụ huynh.
const AuthedNavigator: React.FC = () => {
  const auth = useAuth();

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

  switch (shellForRole(auth.currentUser.role)) {
    case 'PARENT':
      return <ParentNavigator currentUser={auth.currentUser} />;
    case 'ADMIN':
      return (
        <Screen>
          <AdminNavigator user={auth.currentUser} onLogout={auth.logout} />
        </Screen>
      );
    case 'SPECIALIST':
      return (
        <Screen>
          <SpecialistNavigator user={auth.currentUser} onLogout={auth.logout} />
        </Screen>
      );
    default:
      return (
        <Screen>
          <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
            <StateView
              variant="unsupported"
              title="Tài khoản này chưa dùng được trên ứng dụng"
              description="Vai trò của tài khoản không có giao diện trên điện thoại. Vui lòng đăng nhập bằng tài khoản khác."
              actionLabel="Đăng xuất"
              onAction={auth.logout}
            />
          </View>
        </Screen>
      );
  }
};

const ParentNavigator: React.FC<{ currentUser: SessionUser }> = ({ currentUser }) => {
  const auth = useAuth();
  const kid = useKidSession();
  // Giữ ở đây (không ở ParentTabs) để quay lại đúng tab sau khi thoát Kid Mode
  const nav = useParentNavigation();
  const [activeRole, setActiveRole] = useState<Role>('PARENT');

  if (kid.isKidMode && kid.kidChild) {
    return (
      <Screen>
        <KidModeScreen
          child={kid.kidChild}
          source={kidService}
          onExitKidMode={kid.exitKidMode}
          onKidSessionLost={auth.onKidSessionLost}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ParentTabs
        currentUser={currentUser}
        nav={nav}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
      />
    </Screen>
  );
};

// Nút Back của Android ở màn Đăng ký quay về Đăng nhập thay vì thoát app.
const RegisterScreenWithBack: React.FC<React.ComponentProps<typeof RegisterScreen>> = (props) => {
  const { onGoLogin } = props;
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onGoLogin();
      return true;
    });
    return () => sub.remove();
  }, [onGoLogin]);
  return <RegisterScreen {...props} />;
};

export const AppNavigator: React.FC<{ onOpenPreview?: () => void }> = ({ onOpenPreview }) => {
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
            onOpenPreview={onOpenPreview}
          />
        </Screen>
      );
    case 'REGISTER':
      return (
        <Screen>
          <RegisterScreenWithBack onRegisterSuccess={auth.startSession} onGoLogin={auth.showLogin} />
        </Screen>
      );
    default:
      return <AuthedNavigator />;
  }
};
