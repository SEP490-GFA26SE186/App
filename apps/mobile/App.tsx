// apps/mobile/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  ChildProfile,
  FamilyCharacter,
  PedagogicalTemplate,
  Story,
  WalletTransaction,
  Role,
} from '../../packages/shared-types';
import { SessionUser } from './src/types/sessionUser';

import { Colors } from './src/theme/colors';
import { HeyButton } from './src/components/ui/HeyButton';
import { HeyTopBar } from './src/components/HeyTopBar';
import { HeyTabBar } from './src/components/HeyTabBar';
import { AuthModal } from './src/components/AuthModal';
import { StoryReaderModal } from './src/components/StoryReaderModal';

// Screens
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ParentHomeScreen } from './src/screens/ParentHomeScreen';
import { StoryWizard } from './src/screens/StoryWizard';
import { KidModeScreen } from './src/screens/KidModeScreen';
import { MarketplaceScreen } from './src/screens/MarketplaceScreen';
import { SellerDashboard } from './src/screens/SellerDashboard';
import { WalletScreen } from './src/screens/WalletScreen';
import { EqReportScreen } from './src/screens/EqReportScreen';
import { ModeratorAdminScreen } from './src/screens/ModeratorAdminScreen';

// Services
import {
  authService,
  childService,
  characterService,
  storyService,
  ApiError,
} from './src/services';

type AppPhase = 'BOOTING' | 'BOOT_ERROR' | 'LOGIN' | 'REGISTER' | 'APP';
type DataStatus = 'idle' | 'loading' | 'ready' | 'error';

// Không để màn BOOTING treo vô thời hạn khi máy chủ không phản hồi
const BOOT_TIMEOUT_MS = 15000;

const withTimeout = <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new ApiError(message, 0)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });

const SESSION_EXPIRED_NOTICE = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';

export default function App() {
  // Có token → phải xác minh với BE (BOOTING) trước khi vào APP; không có token → Login
  const [appPhase, setAppPhase] = useState<AppPhase>(() =>
    authService.isLoggedIn() ? 'BOOTING' : 'LOGIN'
  );
  const [bootError, setBootError] = useState<string | null>(null);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  // Tăng mỗi khi phiên đổi (đăng nhập/đăng xuất/hết hạn): kết quả request cũ bị bỏ qua
  const sessionRef = useRef(0);
  const [activeRole, setActiveRole] = useState<Role>('PARENT');
  const [isKidMode, setIsKidMode] = useState<boolean>(false);
  // Bé đã được BE xác nhận khi vào Kid Mode
  const [kidChild, setKidChild] = useState<ChildProfile | null>(null);
  const enteringKidRef = useRef(false);
  const exitKidInFlightRef = useRef<Promise<void> | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('HOME');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [selectedStoryToRead, setSelectedStoryToRead] = useState<Story | null>(null);

  // Dữ liệu của phiên hiện tại: chỉ chứa dữ liệu do BE trả (rỗng khi chưa có/chưa tải được)
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [childrenProfiles, setChildrenProfiles] = useState<ChildProfile[]>([]);
  const [characters, setCharacters] = useState<FamilyCharacter[]>([]);
  const [templates, setTemplates] = useState<PedagogicalTemplate[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [dataStatus, setDataStatus] = useState<DataStatus>('idle');
  const [dataError, setDataError] = useState<string | null>(null);

  // Xóa mọi state thuộc phiên trước (tránh lộ dữ liệu tài khoản A sang tài khoản B)
  const resetSessionState = () => {
    setCurrentUser(null);
    setChildrenProfiles([]);
    setCharacters([]);
    setTemplates([]);
    setStories([]);
    setDataStatus('idle');
    setDataError(null);
    setActiveRole('PARENT');
    setCurrentTab('HOME');
    setSelectedStoryToRead(null);
    setIsAuthModalOpen(false);
    setIsKidMode(false);
    setKidChild(null);
  };

  // Kết thúc phiên cục bộ (hết hạn / không phục hồi được) và về Login
  const endSession = (notice?: string) => {
    sessionRef.current += 1;
    authService.clearLocalSession();
    resetSessionState();
    setLoginNotice(notice ?? null);
    setAppPhase('LOGIN');
  };

  const loadAllData = async (sid: number = sessionRef.current) => {
    setDataStatus('loading');
    setDataError(null);
    const results = await Promise.allSettled([
      authService.getMe(),
      childService.getChildren(),
      characterService.getCharacters(),
      storyService.getStories(),
      storyService.getTemplates(),
    ]);
    // Phiên đã đổi (đăng xuất/đổi tài khoản) trong lúc chờ: bỏ kết quả cũ
    if (sid !== sessionRef.current) return;

    if (results.some((r) => r.status === 'rejected' && authService.isAuthError(r.reason))) {
      endSession(SESSION_EXPIRED_NOTICE);
      return;
    }

    const [meR, childrenR, charactersR, storiesR, templatesR] = results;
    // Thành công (kể cả danh sách rỗng) → dùng đúng dữ liệu BE; thất bại → KHÔNG thay bằng dữ liệu mẫu
    if (meR.status === 'fulfilled') setCurrentUser(meR.value);
    if (childrenR.status === 'fulfilled') setChildrenProfiles(childrenR.value);
    if (charactersR.status === 'fulfilled') setCharacters(charactersR.value);
    if (storiesR.status === 'fulfilled') setStories(storiesR.value);
    if (templatesR.status === 'fulfilled') setTemplates(templatesR.value);

    const failed = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
    if (failed) {
      setDataStatus('error');
      setDataError(failed.reason?.message || 'Không tải được dữ liệu từ máy chủ.');
    } else {
      setDataStatus('ready');
    }
  };

  // Bắt đầu phiên sau khi đăng nhập/đăng ký thành công (user do BE xác nhận)
  const startSession = (user: SessionUser) => {
    const sid = ++sessionRef.current;
    resetSessionState();
    setCurrentUser(user);
    setLoginNotice(null);
    setAppPhase('APP');
    loadAllData(sid);
  };

  // Xác minh token hiện có với BE trước khi coi là đã đăng nhập
  const bootstrapSession = async () => {
    const sid = ++sessionRef.current;
    setBootError(null);
    setAppPhase('BOOTING');
    try {
      const me = await withTimeout(
        authService.getMe(),
        BOOT_TIMEOUT_MS,
        'Máy chủ phản hồi quá lâu. Vui lòng kiểm tra mạng và thử lại.'
      );
      if (sid !== sessionRef.current) return;
      setCurrentUser(me);
      setAppPhase('APP');
      loadAllData(sid);
    } catch (err: any) {
      if (sid !== sessionRef.current) return;
      if (authService.isAuthError(err)) {
        endSession(SESSION_EXPIRED_NOTICE);
        return;
      }
      // Mất mạng/5xx/timeout: không vào APP, không xóa phiên, cho phép thử lại
      setBootError(err?.message || 'Không thể xác minh phiên đăng nhập.');
      setAppPhase('BOOT_ERROR');
    }
  };

  useEffect(() => {
    if (appPhase === 'BOOTING') bootstrapSession();
  }, []);

  const handleOpenKidMode = async (child?: ChildProfile) => {
    if (enteringKidRef.current || isKidMode) return;
    // TODO(B2): chưa có UI chọn bé; tạm dùng bé đầu tiên khi không truyền bé cụ thể
    const target = child || childrenProfiles[0];
    if (!target) {
      Alert.alert('Chưa có hồ sơ bé', 'Ba mẹ cần thêm hồ sơ bé trước khi vào Chế độ Bé.');
      return;
    }
    enteringKidRef.current = true;
    try {
      await authService.enterKidMode(target.id);
      setKidChild(target);
      setIsKidMode(true);
    } catch (err: any) {
      Alert.alert('Không thể vào Chế độ Bé', err?.message || 'Vui lòng thử lại.');
    } finally {
      enteringKidRef.current = false;
    }
  };

  // Điểm duy nhất gọi exit; reject khi BE từ chối/lỗi để KidModeScreen hiện lỗi và giữ Kid Mode
  const handleExitKidMode = (pin: string): Promise<void> => {
    if (exitKidInFlightRef.current) return exitKidInFlightRef.current;
    const attempt = (async () => {
      await authService.exitKidMode(pin);
      setIsKidMode(false);
      setKidChild(null);
      loadAllData();
    })().finally(() => {
      exitKidInFlightRef.current = null;
    });
    exitKidInFlightRef.current = attempt;
    return attempt;
  };

  // Kid session mất/hết hạn: không thể thoát bằng PIN → bắt buộc đăng nhập lại bằng mật khẩu thật
  const handleKidSessionLost = () => {
    endSession('Phiên Chế độ Bé không còn hợp lệ. Vui lòng đăng nhập lại bằng mật khẩu tài khoản.');
  };

  // Chỉ nhận truyện đã được BE xác nhận (luồng tạo truyện thật: T5.1/T5.2).
  // Không trừ credit cục bộ: số dư lấy lại từ BE.
  const handleStoryCreated = (story: Story) => {
    setSelectedStoryToRead(story);
    setCurrentTab('HOME');
    loadAllData();
  };

  // Chỉ nhận hồ sơ bé đã được BE tạo (AuthModal gọi POST /children rồi báo lại đây).
  const handleChildCreated = (child: Partial<ChildProfile>) => {
    if (!child.id) return;
    const created = child as ChildProfile;
    setChildrenProfiles((prev) => (prev.some((c) => c.id === created.id) ? prev : [...prev, created]));
  };

  const handleLogout = () => {
    sessionRef.current += 1;
    // logout() xóa phiên cục bộ ngay (đồng bộ) rồi mới báo BE; không chờ mạng để chuyển màn
    void authService.logout();
    resetSessionState();
    setLoginNotice(null);
    setAppPhase('LOGIN');
  };

  if (appPhase === 'BOOTING') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.centerText}>Đang kiểm tra phiên đăng nhập...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (appPhase === 'BOOT_ERROR') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>Không thể xác minh phiên đăng nhập</Text>
          <Text style={styles.centerText}>{bootError}</Text>
          <HeyButton title="Thử lại" onPress={bootstrapSession} style={styles.centerBtn} />
          <HeyButton title="Đăng xuất" variant="outline" onPress={handleLogout} style={styles.centerBtn} />
        </View>
      </SafeAreaView>
    );
  }

  if (appPhase === 'LOGIN') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <LoginScreen
          initialMessage={loginNotice}
          onLoginSuccess={startSession}
          onGoRegister={() => setAppPhase('REGISTER')}
        />
      </SafeAreaView>
    );
  }

  if (appPhase === 'REGISTER') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <RegisterScreen
          onRegisterSuccess={startSession}
          onGoLogin={() => setAppPhase('LOGIN')}
        />
      </SafeAreaView>
    );
  }

  // Không bao giờ vào giao diện Parent khi chưa có user do BE xác nhận
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* KID MODE VIEW (CHILDREN EXPERIENCE) */}
      {isKidMode && kidChild ? (
        <KidModeScreen
          child={kidChild}
          stories={stories}
          onExitKidMode={handleExitKidMode}
          onKidSessionLost={handleKidSessionLost}
          onRecordEqSignal={(signal, skill) => {
            console.log('Record EQ signal:', signal, skill);
          }}
        />
      ) : (
        /* PARENT EXPERIENCE */
        <View style={styles.container}>
          {/* Top Bar */}
          <HeyTopBar
            currentUser={currentUser}
            activeRole={activeRole}
            onRoleChange={setActiveRole}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenWallet={() => setCurrentTab('WALLET')}
            onOpenKidMode={() => handleOpenKidMode()}
          />

          {dataStatus === 'loading' && (
            <View style={styles.dataBanner}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.dataBannerText}>Đang tải dữ liệu...</Text>
            </View>
          )}
          {dataStatus === 'error' && (
            <View style={[styles.dataBanner, styles.dataBannerError]}>
              <Text style={[styles.dataBannerText, styles.dataBannerErrorText]}>⚠️ {dataError}</Text>
              <TouchableOpacity onPress={() => loadAllData()}>
                <Text style={styles.dataBannerRetry}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Body Content by Role & Tab */}
          <View style={styles.main}>
            {activeRole === 'SELLER' ? (
              <SellerDashboard
                currentUser={currentUser}
                stories={stories}
                onOpenStoryWizard={() => setCurrentTab('CREATE')}
                onOpenWallet={() => setCurrentTab('WALLET')}
                onSubmitForReview={() => alert('Gửi duyệt truyện chưa được hỗ trợ (chưa kết nối máy chủ).')}
              />
            ) : activeRole === 'MODERATOR' || activeRole === 'ADMIN' ? (
              <ModeratorAdminScreen />
            ) : (
              <>
                {currentTab === 'HOME' && (
                  <ParentHomeScreen
                    currentUser={currentUser}
                    childrenProfiles={childrenProfiles}
                    characters={characters}
                    stories={stories}
                    templates={templates}
                    onStartStoryWizard={() => setCurrentTab('CREATE')}
                    onOpenKidMode={() => handleOpenKidMode()}
                    onNavigateTab={setCurrentTab}
                    onSelectStoryToRead={setSelectedStoryToRead}
                  />
                )}

                {currentTab === 'CREATE' && (
                  <StoryWizard
                    characters={characters}
                    templates={templates}
                    currentUser={currentUser}
                    onStoryCreated={handleStoryCreated}
                    onCancel={() => setCurrentTab('HOME')}
                    onUpdateCharacters={setCharacters}
                  />
                )}

                {currentTab === 'MARKET' && (
                  <MarketplaceScreen
                    stories={stories}
                    currentUser={currentUser}
                    onStoryPurchased={(st) => setStories([st, ...stories])}
                    onSelectStoryToRead={setSelectedStoryToRead}
                  />
                )}

                {currentTab === 'EQ' && (
                  <EqReportScreen childrenProfiles={childrenProfiles} />
                )}

                {currentTab === 'WALLET' && (
                  <WalletScreen
                    currentUser={currentUser}
                    transactions={[]}
                    onRefreshWallet={() => loadAllData()}
                  />
                )}
              </>
            )}
          </View>

          {/* Bottom Tab Bar (for Parent role) */}
          {activeRole === 'PARENT' && currentTab !== 'CREATE' && (
            <HeyTabBar
              currentTab={currentTab}
              onSelectTab={setCurrentTab}
              onOpenKidMode={() => handleOpenKidMode()}
            />
          )}

          {/* Modals */}
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            currentUser={currentUser}
            onUserUpdate={(u) => {
              if (u) {
                setCurrentUser(u);
              } else {
                handleLogout();
              }
            }}
            onLogout={handleLogout}
            childrenProfiles={childrenProfiles}
            onAddChild={handleChildCreated}
            onRefreshData={loadAllData}
          />

          <StoryReaderModal
            story={selectedStoryToRead}
            visible={!!selectedStoryToRead}
            onClose={() => setSelectedStoryToRead(null)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  main: {
    flex: 1,
  },
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
  dataBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
  },
  dataBannerError: {
    backgroundColor: '#FEE2E2',
  },
  dataBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#1E3A8A',
  },
  dataBannerErrorText: {
    color: '#B91C1C',
  },
  dataBannerRetry: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B91C1C',
  },
});
