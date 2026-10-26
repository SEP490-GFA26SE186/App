// apps/mobile/src/navigation/ParentTabs.tsx
// Khung giao diện Parent: thanh trên, dải trạng thái dữ liệu, nội dung theo route, thanh tab, modal đọc truyện.
import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Role, Story } from '../../../../packages/shared-types';
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
import { useAuth, useKidSession, useParentData } from '../stores/SessionProvider';
import { ParentNavigation } from './useParentNavigation';
import { ROUTES } from './routes';

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
  const [selectedStoryToRead, setSelectedStoryToRead] = useState<Story | null>(null);
  const { navigate, goBack } = nav;
  const hasKidPin = !!currentUser.kidModePinHash;

  const moreItems: MoreMenuItem[] = [
    { key: 'children', icon: '👶', title: 'Bé nhà mình', description: 'Hồ sơ từng bé', onPress: () => navigate(ROUTES.CHILDREN) },
    { key: 'characters', icon: '👨‍👩‍👧', title: 'Nhân vật gia đình', description: 'Người thân xuất hiện trong truyện', onPress: () => navigate(ROUTES.CHARACTERS) },
    { key: 'settings', icon: '⚙️', title: 'Cài đặt', description: 'Tài khoản, mã PIN Chế độ Trẻ Em, máy chủ', onPress: () => navigate(ROUTES.SETTINGS) },
    { key: 'help', icon: '❓', title: 'Trợ giúp', description: 'Câu hỏi thường gặp', onPress: () => navigate(ROUTES.HELP) },
    { key: 'market', icon: '🛒', title: 'Chợ truyện', description: 'Chưa kết nối máy chủ', badge: 'Đang chờ quyết định phạm vi', onPress: () => navigate(ROUTES.MARKET) },
  ];

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
            onSelectStoryToRead={setSelectedStoryToRead}
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
            onAddToShelf={() => notSupported('Thêm truyện vào tủ sách của bé')}
            onCreateStory={() => navigate(ROUTES.CREATE)}
          />
        );
      case ROUTES.STORY:
        return (
          <StoryDetailScreen
            story={data.stories.find((s) => s.id === nav.current.params?.storyId)}
            onBack={goBack}
            onRead={setSelectedStoryToRead}
            onUnsupported={notSupported}
          />
        );
      case ROUTES.CREATE:
        return (
          <StoryWizard
            characters={data.characters}
            templates={data.templates}
            onCharacterCreated={(c) => data.setCharacters((prev) => [...prev, c])}
            onCancel={() => navigate(ROUTES.HOME)}
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
        return <WalletScreen currentUser={currentUser} onRefreshWallet={() => void data.reload()} />;
      case ROUTES.MORE:
        return <MoreScreen currentUser={currentUser} items={moreItems} onLogout={auth.logout} onBack={goBack} />;
      case ROUTES.CHILDREN:
        return (
          <ChildrenScreen
            childrenProfiles={data.childrenProfiles}
            selectedChildId={data.selectedChild?.id}
            dataStatus={data.dataStatus}
            hasKidPin={hasKidPin}
            onSelect={data.selectChild}
            onChildCreated={data.addChild}
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
            onCharacterCreated={(c) => data.setCharacters((prev) => [...prev, c])}
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
        onOpenWallet={() => navigate(ROUTES.WALLET)}
        onOpenKidMode={() => kid.openKidMode()}
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
            onOpenWallet={() => navigate(ROUTES.WALLET)}
            onSubmitForReview={() => notSupported('Gửi duyệt truyện')}
          />
        ) : activeRole === 'MODERATOR' || activeRole === 'ADMIN' ? (
          <ModeratorAdminScreen />
        ) : (
          renderRoute()
        )}
      </View>

      {/* Bottom Tab Bar (for Parent role) */}
      {activeRole === 'PARENT' && nav.current.route !== ROUTES.CREATE && (
        <HeyTabBar currentTab={nav.rootTab} onSelectTab={navigate} onOpenKidMode={() => kid.openKidMode()} />
      )}

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
