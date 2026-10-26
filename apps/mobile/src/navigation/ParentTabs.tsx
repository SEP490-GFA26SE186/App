// apps/mobile/src/navigation/ParentTabs.tsx
// Khung giao diện Parent: thanh trên, dải trạng thái dữ liệu, nội dung theo tab, thanh tab, modal.
import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Role, Story } from '../../../../packages/shared-types';
import { SessionUser } from '../types/sessionUser';
import { Colors } from '../theme/colors';
import { HeyTopBar } from '../components/parent/HeyTopBar';
import { HeyTabBar } from '../components/parent/HeyTabBar';
import { AuthModal } from '../components/auth/AuthModal';
import { StoryReaderModal } from '../components/parent/StoryReaderModal';
import { ParentHomeScreen } from '../screens/parent/ParentHomeScreen';
import { StoryWizard } from '../screens/parent/StoryWizard';
import { MarketplaceScreen } from '../screens/scope-pending/MarketplaceScreen';
import { SellerDashboard } from '../screens/scope-pending/SellerDashboard';
import { WalletScreen } from '../screens/parent/WalletScreen';
import { EqReportScreen } from '../screens/parent/EqReportScreen';
import { ModeratorAdminScreen } from '../screens/scope-pending/ModeratorAdminScreen';
import { useAuth, useKidSession, useParentData } from '../stores/SessionProvider';
import { ROUTES, RouteKey } from './routes';

interface ParentTabsProps {
  currentUser: SessionUser;
  currentTab: RouteKey;
  navigate: (route: RouteKey) => void;
  activeRole: Role;
  setActiveRole: (role: Role) => void;
}

export const ParentTabs: React.FC<ParentTabsProps> = ({
  currentUser,
  currentTab,
  navigate,
  activeRole,
  setActiveRole,
}) => {
  const auth = useAuth();
  const data = useParentData();
  const kid = useKidSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedStoryToRead, setSelectedStoryToRead] = useState<Story | null>(null);

  // Chỉ nhận truyện đã được BE xác nhận (luồng tạo truyện thật: T5.1/T5.2).
  // Không trừ credit cục bộ: số dư lấy lại từ BE.
  const handleStoryCreated = (story: Story) => {
    setSelectedStoryToRead(story);
    navigate(ROUTES.HOME);
    void data.reload();
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <HeyTopBar
        currentUser={currentUser}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        onOpenAuth={() => setIsAuthModalOpen(true)}
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

      {/* Body Content by Role & Tab */}
      <View style={styles.main}>
        {activeRole === 'SELLER' ? (
          <SellerDashboard
            currentUser={currentUser}
            stories={data.stories}
            onOpenStoryWizard={() => navigate(ROUTES.CREATE)}
            onOpenWallet={() => navigate(ROUTES.WALLET)}
            onSubmitForReview={() => alert('Gửi duyệt truyện chưa được hỗ trợ (chưa kết nối máy chủ).')}
          />
        ) : activeRole === 'MODERATOR' || activeRole === 'ADMIN' ? (
          <ModeratorAdminScreen />
        ) : (
          <>
            {currentTab === ROUTES.HOME && (
              <ParentHomeScreen
                currentUser={currentUser}
                childrenProfiles={data.childrenProfiles}
                characters={data.characters}
                stories={data.stories}
                templates={data.templates}
                onStartStoryWizard={() => navigate(ROUTES.CREATE)}
                onOpenKidMode={() => kid.openKidMode()}
                onNavigateTab={navigate}
                onSelectStoryToRead={setSelectedStoryToRead}
              />
            )}

            {currentTab === ROUTES.CREATE && (
              <StoryWizard
                characters={data.characters}
                templates={data.templates}
                currentUser={currentUser}
                onStoryCreated={handleStoryCreated}
                onCancel={() => navigate(ROUTES.HOME)}
                onUpdateCharacters={data.setCharacters}
              />
            )}

            {currentTab === ROUTES.MARKET && (
              <MarketplaceScreen
                stories={data.stories}
                currentUser={currentUser}
                onStoryPurchased={() => {}}
                onSelectStoryToRead={setSelectedStoryToRead}
              />
            )}

            {currentTab === ROUTES.EQ && <EqReportScreen childrenProfiles={data.childrenProfiles} />}

            {currentTab === ROUTES.WALLET && (
              <WalletScreen
                currentUser={currentUser}
                transactions={[]}
                onRefreshWallet={() => void data.reload()}
              />
            )}
          </>
        )}
      </View>

      {/* Bottom Tab Bar (for Parent role) */}
      {activeRole === 'PARENT' && currentTab !== ROUTES.CREATE && (
        <HeyTabBar currentTab={currentTab} onSelectTab={navigate} onOpenKidMode={() => kid.openKidMode()} />
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserUpdate={(u) => {
          if (u) auth.setCurrentUser(u);
          else auth.logout();
        }}
        onLogout={auth.logout}
        childrenProfiles={data.childrenProfiles}
        onAddChild={data.addChild}
        onRefreshData={() => void data.reload()}
      />

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
