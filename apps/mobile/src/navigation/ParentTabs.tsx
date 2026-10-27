// apps/mobile/src/navigation/ParentTabs.tsx
// Khung giao diện Parent: thanh trên, dải trạng thái dữ liệu, nội dung theo route, thanh tab, modal đọc truyện.
import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Role, Story } from '../types/domain';
import { SessionUser } from '../types/sessionUser';
import { Colors } from '../theme/colors';
import { HeyTopBar } from '../components/parent/HeyTopBar';
import { HeyTabBar } from '../components/parent/HeyTabBar';
import { StoryReaderModal } from '../components/parent/StoryReaderModal';
import { ParentHomeScreen } from '../screens/parent/ParentHomeScreen';
import { LibraryScreen } from '../screens/parent/LibraryScreen';
import { StoryDetailScreen } from '../screens/parent/StoryDetailScreen';
import { StoryWizard } from '../screens/parent/StoryWizard';
import { EqReportScreen } from '../screens/parent/EqReportScreen';
import { WalletScreen } from '../screens/parent/WalletScreen';
import { MoreScreen, MoreMenuItem } from '../screens/parent/MoreScreen';
import { ChildrenScreen } from '../screens/parent/ChildrenScreen';
import { CharactersScreen } from '../screens/parent/CharactersScreen';
import { SettingsScreen } from '../screens/parent/SettingsScreen';
import { HelpScreen } from '../screens/parent/HelpScreen';
import { MarketplaceScreen } from '../screens/scope-pending/MarketplaceScreen';
import { SellerDashboard } from '../screens/scope-pending/SellerDashboard';
import { ModeratorAdminScreen } from '../screens/scope-pending/ModeratorAdminScreen';
import { authService, storyService } from '../services';
import { useAuth, useKidSession, useParentData } from '../stores/SessionProvider';
import { ParentNavigation } from './useParentNavigation';
import { ROUTES } from './routes';
import { useToast, useToastBottomInset } from '../components/ui/Toast';
import { TAB_BAR_FAB_OVERHANG } from '../components/parent/HeyTabBar';

interface ParentTabsProps {
  currentUser: SessionUser;
  nav: ParentNavigation;
  activeRole: Role;
  setActiveRole: (role: Role) => void;
}

// Hành động chưa có API thật: báo rõ, không thay đổi dữ liệu
const notSupported = (what: string) =>
  Alert.alert('Chưa hỗ trợ', `${what} chưa được hỗ trợ trên ứng dụng (chưa kết nối máy chủ).`);

export const ParentTabs: React.FC<ParentTabsProps> = ({ currentUser, nav, activeRole, setActiveRole }) => {
  const auth = useAuth();
  const data = useParentData();
  const kid = useKidSession();
  const toast = useToast();
  const [selectedStoryToRead, setSelectedStoryToRead] = useState<Story | null>(null);
  const { navigate, goBack } = nav;
  const hasKidPin = !!currentUser.kidModePinHash;
  // R7: trình đọc phụ huynh phủ toàn màn, thanh tab ẩn khi đang đọc (thanh tab có elevation nên trên Android nổi lên trên lớp phủ)
  const tabBarVisible = activeRole === 'PARENT' && nav.current.route !== ROUTES.CREATE && !selectedStoryToRead;

  // Toast nằm phía trên thanh tab (đo chiều cao thật) để không che thanh tab hay nút Sáng tác
  const [tabBarHeight, setTabBarHeight] = useState(0);
  useToastBottomInset(tabBarVisible ? tabBarHeight + TAB_BAR_FAB_OVERHANG : 0);

  // Ví không còn là tab: mở bằng pill credit (header) hoặc mục trong Hồ sơ; navigateStack bỏ qua chạm lặp vào Ví
  const openWallet = () => navigate(ROUTES.WALLET);

  // Làm mới số dư credit từ BE (GET /auth/me); lỗi thì giữ số cũ, không đoán
  const mounted = useRef(true);
  useEffect(() => () => {
    mounted.current = false;
  }, []);
  const refreshCredit = () => {
    authService
      .getMe()
      .then((u) => mounted.current && auth.setCurrentUser(u))
      .catch(() => {});
  };

  // Thêm truyện vào tủ sách của bé đang chọn (POST /bookshelf); 422 = truyện chưa sẵn sàng cho bé (BE nêu lý do)
  const shelfBusy = useRef(false);
  const addToShelf = async (story: Story) => {
    const child = data.selectedChild;
    if (!child) {
      Alert.alert('Chưa có hồ sơ bé', 'Ba mẹ cần thêm hồ sơ bé trước khi đưa truyện lên tủ sách.');
      return;
    }
    if (shelfBusy.current) return;
    shelfBusy.current = true;
    try {
      await storyService.addToShelf(child.id, story.id);
      toast.show(`Đã thêm “${story.title}” lên tủ sách của ${child.name}.`);
    } catch (e: any) {
      Alert.alert('Chưa thêm được', e?.errors?.[0]?.message || e?.message || 'Vui lòng thử lại.');
    } finally {
      shelfBusy.current = false;
    }
  };

  // SCOPE PENDING (D5): lối vào Chợ truyện chỉ hiện ở __DEV__, ẩn khỏi production
  const balance = currentUser.creditBalance;
  const moreItems: MoreMenuItem[] = [
    { key: 'children', group: 'Gia đình', icon: 'people-outline', title: 'Bé nhà mình', description: 'Hồ sơ từng bé', onPress: () => navigate(ROUTES.CHILDREN) },
    { key: 'characters', group: 'Gia đình', icon: 'happy-outline', title: 'Nhân vật gia đình', description: 'Người thân xuất hiện trong truyện', onPress: () => navigate(ROUTES.CHARACTERS) },
    // Số dư chỉ lấy từ BE (GET /auth/me); chưa tải được thì không hiện số
    { key: 'wallet', group: 'Tài khoản', icon: 'diamond-outline', title: 'Ví & Credit', description: balance == null ? 'Gói dịch vụ và lịch sử credit' : `Số dư ${balance} credit · gói dịch vụ, lịch sử`, onPress: openWallet },
    { key: 'settings', group: 'Tài khoản', icon: 'settings-outline', title: 'Cài đặt', description: 'Tài khoản, mã PIN Chế độ Trẻ Em, máy chủ', onPress: () => navigate(ROUTES.SETTINGS) },
    // Vào Kid Mode dùng đúng đường cũ (openKidMode → BE xác nhận); không đổi xác thực hay PIN
    { key: 'kid', group: 'An toàn trẻ em', icon: 'happy', title: 'Chế độ Bé', description: data.selectedChild ? `Cho ${data.selectedChild.name} đọc truyện, thoát bằng mã PIN` : 'Thêm hồ sơ bé trước khi vào Chế độ Bé', highlight: true, onPress: () => kid.openKidMode() },
    { key: 'help', group: 'Hỗ trợ', icon: 'help-circle-outline', title: 'Trợ giúp', description: 'Câu hỏi thường gặp', onPress: () => navigate(ROUTES.HELP) },
    { key: 'market', group: 'Hỗ trợ', icon: 'cart-outline', title: 'Chợ truyện', description: 'Chưa kết nối máy chủ', badge: 'Đang chờ quyết định phạm vi', onPress: () => navigate(ROUTES.MARKET) },
  ];
  const visibleMoreItems = moreItems.filter((item) => __DEV__ || item.key !== 'market');

  const renderRoute = () => {
    switch (nav.current.route) {
      case ROUTES.HOME:
        return (
          <ParentHomeScreen
            currentUser={currentUser}
            childrenProfiles={data.childrenProfiles}
            selectedChild={data.selectedChild}
            stories={data.stories}
            templates={data.templates}
            dataStatus={data.dataStatus}
            onSelectChild={data.selectChild}
            onStartStoryWizard={() => navigate(ROUTES.CREATE)}
            onOpenKidMode={() => kid.openKidMode()}
            onOpenLibrary={() => navigate(ROUTES.LIBRARY)}
            onOpenEq={() => navigate(ROUTES.EQ)}
            onOpenChildren={() => navigate(ROUTES.CHILDREN)}
            onOpenStory={(s) => navigate(ROUTES.STORY, { storyId: s.id })}
          />
        );
      case ROUTES.LIBRARY:
        return (
          <LibraryScreen
            stories={data.stories}
            childrenProfiles={data.childrenProfiles}
            selectedChildId={data.selectedChild?.id}
            dataStatus={data.dataStatus}
            onSelectChild={data.selectChild}
            onOpenStory={(s) => navigate(ROUTES.STORY, { storyId: s.id })}
            onAddToShelf={addToShelf}
            onCreateStory={() => navigate(ROUTES.CREATE)}
          />
        );
      case ROUTES.STORY:
        return (
          <StoryDetailScreen
            key={nav.current.params?.storyId}
            storyId={nav.current.params?.storyId as string}
            summary={data.stories.find((s) => s.id === nav.current.params?.storyId)}
            selectedChild={data.selectedChild}
            onBack={goBack}
            onRead={setSelectedStoryToRead}
            onStoryLoaded={data.upsertStory}
            onCreditsChanged={refreshCredit}
            onUnsupported={notSupported}
          />
        );
      case ROUTES.CREATE:
        return (
          <StoryWizard
            characters={data.characters}
            templates={data.templates}
            creditBalance={currentUser.creditBalance}
            onCharacterCreated={data.addCharacter}
            onStoryCreated={data.upsertStory}
            onOpenStory={(id) => {
              void data.reload();
              navigate(ROUTES.STORY, { storyId: id });
            }}
            onCreditsChanged={refreshCredit}
            onCancel={() => navigate(ROUTES.LIBRARY)}
          />
        );
      case ROUTES.EQ:
        return (
          <EqReportScreen
            childrenProfiles={data.childrenProfiles}
            selectedChildId={data.selectedChild?.id}
            onSelectChild={data.selectChild}
          />
        );
      case ROUTES.WALLET:
        return <WalletScreen currentUser={currentUser} onRefreshWallet={() => void data.reload()} onBack={goBack} />;
      case ROUTES.MORE:
        return <MoreScreen currentUser={currentUser} items={visibleMoreItems} onLogout={auth.logout} />;
      case ROUTES.CHILDREN:
        return (
          <ChildrenScreen
            childrenProfiles={data.childrenProfiles}
            selectedChildId={data.selectedChild?.id}
            dataStatus={data.dataStatus}
            hasKidPin={hasKidPin}
            onSelect={data.selectChild}
            onChildSaved={(child, isNew) => {
              if (isNew) data.addChild(child);
              else {
                data.replaceChild(child);
                void data.reload(); // tên bé đồng bộ sang nhân vật đại diện
              }
            }}
            onChildDeleted={(id) => {
              data.removeChild(id);
              void data.reload(); // nhân vật đại diện bị BE xóa theo
            }}
            onOpenKidMode={(c) => kid.openKidMode(c)}
            onOpenSettings={() => navigate(ROUTES.SETTINGS)}
            onBack={goBack}
          />
        );
      case ROUTES.CHARACTERS:
        return (
          <CharactersScreen
            characters={data.characters}
            dataStatus={data.dataStatus}
            onCharacterSaved={(c, isNew) => (isNew ? data.addCharacter(c) : data.replaceCharacter(c))}
            onCharacterDeleted={data.removeCharacter}
            onBack={goBack}
          />
        );
      case ROUTES.SETTINGS:
        return (
          <SettingsScreen currentUser={currentUser} onUserUpdate={auth.setCurrentUser} onLogout={auth.logout} onBack={goBack} />
        );
      case ROUTES.HELP:
        return <HelpScreen onBack={goBack} />;
      case ROUTES.MARKET:
        // SCOPE PENDING: giữ nguyên màn hiện có, không phát triển thêm
        return (
          <MarketplaceScreen
            stories={data.stories}
            currentUser={currentUser}
            onStoryPurchased={() => {}}
            onSelectStoryToRead={setSelectedStoryToRead}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <HeyTopBar
        currentUser={currentUser}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        onOpenMenu={() => navigate(ROUTES.MORE)}
        onOpenWallet={openWallet}
        onGoHome={() => navigate(ROUTES.HOME)}
      />

      {data.dataStatus === 'loading' && (
        <View style={styles.dataBanner}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.dataBannerText}>Đang tải dữ liệu...</Text>
        </View>
      )}
      {data.dataStatus === 'error' && (
        <View style={[styles.dataBanner, styles.dataBannerError]}>
          <Text style={[styles.dataBannerText, styles.dataBannerErrorText]}>⚠️ {data.dataError}</Text>
          <TouchableOpacity onPress={() => void data.reload()}>
            <Text style={styles.dataBannerRetry}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Body Content by Role & Route */}
      <View style={styles.main}>
        {activeRole === 'SELLER' ? (
          <SellerDashboard
            currentUser={currentUser}
            stories={data.stories}
            onOpenStoryWizard={() => navigate(ROUTES.CREATE)}
            onOpenWallet={openWallet}
            onSubmitForReview={() => notSupported('Gửi duyệt truyện')}
          />
        ) : activeRole === 'MODERATOR' || activeRole === 'ADMIN' ? (
          <ModeratorAdminScreen />
        ) : (
          renderRoute()
        )}
      </View>

      {/* Bottom Tab Bar (for Parent role) */}
      {tabBarVisible && <HeyTabBar currentTab={nav.rootTab} onSelectTab={navigate} onLayoutHeight={setTabBarHeight} />}

      <StoryReaderModal
        story={selectedStoryToRead}
        visible={!!selectedStoryToRead}
        onClose={() => setSelectedStoryToRead(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  main: {
    flex: 1,
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
