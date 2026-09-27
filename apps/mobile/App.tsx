// apps/mobile/App.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import {
  UserAccount,
  ChildProfile,
  FamilyCharacter,
  PedagogicalTemplate,
  Story,
  WalletTransaction,
  Role,
} from '../../packages/shared-types';

import { Colors } from './src/theme/colors';
import { HeyTopBar } from './src/components/HeyTopBar';
import { HeyTabBar } from './src/components/HeyTabBar';
import { AuthModal } from './src/components/AuthModal';
import { StoryReaderModal } from './src/components/StoryReaderModal';

// Screens
import { ParentHomeScreen } from './src/screens/ParentHomeScreen';
import { StoryWizard } from './src/screens/StoryWizard';
import { KidModeScreen } from './src/screens/KidModeScreen';
import { MarketplaceScreen } from './src/screens/MarketplaceScreen';
import { SellerDashboard } from './src/screens/SellerDashboard';
import { WalletScreen } from './src/screens/WalletScreen';
import { EqReportScreen } from './src/screens/EqReportScreen';
import { ModeratorAdminScreen } from './src/screens/ModeratorAdminScreen';

export default function App() {
  const [activeRole, setActiveRole] = useState<Role>('PARENT');
  const [isKidMode, setIsKidMode] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>('HOME');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [selectedStoryToRead, setSelectedStoryToRead] = useState<Story | null>(null);

  // User State
  const [currentUser, setCurrentUser] = useState<UserAccount>({
    id: 'usr_parent_01',
    email: 'me.lan@gmail.com',
    fullName: 'Mẹ Lan Phương',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    phone: '0901234567',
    role: 'PARENT',
    kidModePinHash: '1234',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    creditBalance: 85,
    sellerPendingBalance: 420000,
    sellerAvailableBalance: 750000,
    bankAccount: {
      bankName: 'Vietcombank',
      accountNumber: '0071001234567',
      accountHolder: 'TRAN LAN PHUONG',
    },
  });

  const [childrenProfiles, setChildrenProfiles] = useState<ChildProfile[]>([
    {
      id: 'ch_01',
      parentId: 'usr_parent_01',
      name: 'Bé Bo',
      age: 4,
      gender: 'MALE',
      readingLevel: 'BEGINNER',
      favoriteThemes: ['Động vật', 'Vũ trụ', 'Chia sẻ'],
    },
  ]);

  const [characters, setCharacters] = useState<FamilyCharacter[]>([
    {
      id: 'char_01',
      parentId: 'usr_parent_01',
      name: 'Bé Bo',
      relationRole: 'HERO',
      appearanceDescription: 'Bé trai tóc xoăn nhẹ, đôi mắt to tròn lanh lợi, mặc áo yếm xanh lá.',
      personalityTraits: ['Tò mò', 'Tốt bụng', 'Hay cười'],
    },
    {
      id: 'char_02',
      parentId: 'usr_parent_01',
      name: 'Bố Tuấn',
      relationRole: 'FATHER',
      appearanceDescription: 'Bố đeo kính tròn, nụ cười hiền từ, mặc áo thun ấm áp.',
      personalityTraits: ['Kiên nhẫn', 'Hài hước'],
    },
    {
      id: 'char_03',
      parentId: 'usr_parent_01',
      name: 'Mẹ Phương',
      relationRole: 'MOTHER',
      appearanceDescription: 'Mẹ tóc dài dịu dàng, nụ cười rạng rỡ, thích hoa.',
      personalityTraits: ['Chu đáo', 'Ấm áp'],
    },
  ]);

  const [templates, setTemplates] = useState<PedagogicalTemplate[]>([
    {
      id: 'tpl_01',
      title: 'Học Cách Chia Sẻ Đồ Chơi',
      category: 'EMOTIONAL_INTELLIGENCE',
      targetAgeGroup: '3-6',
      targetAgeMin: 3,
      targetAgeMax: 6,
      eqGoals: ['Thấu cảm', 'Chia sẻ niềm vui'],
      icon: '🤝',
      description: 'Giúp bé nhận ra niềm vui nhân đôi khi cùng bạn chơi món đồ yêu thích.',
    },
    {
      id: 'tpl_02',
      title: 'Dũng Cảm Đi Ngủ Đúng Giờ',
      category: 'DAILY_HABITS',
      targetAgeGroup: '3-6',
      targetAgeMin: 3,
      targetAgeMax: 7,
      eqGoals: ['Vượt qua sợ hãi bóng tối', 'Tự lập'],
      icon: '🌙',
      description: 'Hóa thân bé thành dũng sĩ tí hon tự tin ngủ ngon trong căn phòng phép thuật.',
    },
    {
      id: 'tpl_03',
      title: 'Biết Ơn Bữa Cơm Gia Đình',
      category: 'MORAL_VALUES',
      targetAgeGroup: '3-6',
      targetAgeMin: 4,
      targetAgeMax: 8,
      eqGoals: ['Trân trọng thực phẩm', 'Gắn kết gia đình'],
      icon: '🍚',
      description: 'Hành trình các hạt ngọc trời từ cánh đồng đến mâm cơm ấm áp của mẹ.',
    },
  ]);

  const [stories, setStories] = useState<Story[]>([
    {
      id: 'story_01',
      creatorId: 'usr_parent_01',
      title: 'Bé Bo & Chiếc Ô Bảy Sắc Cầu Vồng',
      summary: 'Bé Bo học cách che ô cho chú chim nhỏ ướt cánh dưới cơn mưa rào mùa hạ.',
      coverImageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
      theme: 'Chia sẻ & Yêu thương',
      targetAgeGroup: '3-6',
      status: 'PUBLISHED',
      priceVnd: 20000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priceCredits: 0,
      sellerCommissionRate: 0.7,
      platformCommissionRate: 0.3,
      ratingsAvg: 5.0,
      reviewsCount: 1,
      pages: [
        {
          id: 'p_01',
          pageNumber: 1,
          text: 'Một buổi chiều mùa hạ, mây đen ùn ùn kéo đến, mang theo những giọt mưa rào rộn rã ngoài hiên. Bé Bo thích thú mở bung chiếc ô màu vàng óng.',
          illustrationUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
          choices: [
            {
              id: 'ch_1',
              label: 'Chạy ra đón hạt mưa mát lạnh',
              targetNextPageNumber: 2,
              eqSignal: 'EMPATHY',
            },
          ],
        },
        {
          id: 'p_02',
          pageNumber: 2,
          text: 'Dưới gốc cây bàng, một chú chim sẻ nhỏ đang co ro run rẩy vì ướt cánh. Bé Bo nhẹ nhàng tiến lại gần và nghiêng chiếc ô che cho bạn.',
          illustrationUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
        },
        {
          id: 'p_03',
          pageNumber: 3,
          text: 'Cơn mưa tạnh dần, ánh cầu vồng bảy sắc rực rỡ hiện lên. Chú chim nhỏ cất tiếng hót líu lo như nói lời cảm ơn người bạn nhỏ tốt bụng.',
          illustrationUrl: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=600&auto=format&fit=crop&q=80',
        },
      ],
    },
  ]);

  const [transactions, setTransactions] = useState<WalletTransaction[]>([
    {
      id: 'tx_01',
      userId: 'usr_parent_01',
      type: 'CREDIT_PURCHASE',
      amountCredits: 50,
      amountVnd: 50000,
      description: 'Nạp Credits qua PayOS QR',
      createdAt: new Date().toISOString(),
      status: 'COMPLETED',
    },
    {
      id: 'tx_02',
      userId: 'usr_parent_01',
      type: 'STORY_PURCHASE',
      amountCredits: -3,
      description: 'Sáng tác AI câu chuyện "Bé Bo & Chiếc Ô"',
      createdAt: new Date().toISOString(),
      status: 'COMPLETED',
    },
  ]);

  const handleStoryCreated = (newStory: Story) => {
    setStories([newStory, ...stories]);
    setCurrentUser((prev) => ({
      ...prev,
      creditBalance: Math.max(0, (prev.creditBalance || 0) - 3),
    }));
    setSelectedStoryToRead(newStory);
    setCurrentTab('HOME');
  };

  const handleAddChild = (child: Partial<ChildProfile>) => {
    const newCh: ChildProfile = {
      id: `ch_${Date.now()}`,
      parentId: currentUser.id,
      name: child.name || 'Bé Mới',
      age: child.age || 4,
      gender: 'MALE',
      readingLevel: child.readingLevel || 'BEGINNER',
      favoriteThemes: ['Cổ tích', 'Thiên nhiên'],
    };
    setChildrenProfiles([...childrenProfiles, newCh]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* KID MODE VIEW */}
      {isKidMode ? (
        <KidModeScreen
          child={childrenProfiles[0]}
          stories={stories}
          correctPin={currentUser.kidModePinHash || '1234'}
          onExitKidMode={() => setIsKidMode(false)}
          onRecordEqSignal={(signal, skill) => {
            console.log('Record EQ signal:', signal, skill);
          }}
        />
      ) : (
        /* PARENT / SELLER / MODERATOR APP */
        <View style={styles.container}>
          {/* Top Bar */}
          <HeyTopBar
            currentUser={currentUser}
            activeRole={activeRole}
            onRoleChange={setActiveRole}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenWallet={() => setCurrentTab('WALLET')}
            onOpenKidMode={() => setIsKidMode(true)}
          />

          {/* Body Content by Role & Tab */}
          <View style={styles.main}>
            {activeRole === 'SELLER' ? (
              <SellerDashboard
                currentUser={currentUser}
                stories={stories}
                onOpenStoryWizard={() => setCurrentTab('CREATE')}
                onOpenWallet={() => setCurrentTab('WALLET')}
                onSubmitForReview={(id) => alert(`Đã gửi duyệt truyện ${id}`)}
              />
            ) : activeRole === 'MODERATOR' || activeRole === 'ADMIN' ? (
              <ModeratorAdminScreen />
            ) : (
              <>
                {currentTab === 'HOME' && (
                  <ParentHomeScreen
                    currentUser={currentUser}
                    childrenProfiles={childrenProfiles}
                    stories={stories}
                    templates={templates}
                    onStartStoryWizard={() => setCurrentTab('CREATE')}
                    onOpenKidMode={() => setIsKidMode(true)}
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
                    transactions={transactions}
                    onUserUpdate={setCurrentUser}
                    onRefreshWallet={() => {}}
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
              onOpenKidMode={() => setIsKidMode(true)}
            />
          )}

          {/* Modals */}
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            currentUser={currentUser}
            onUserUpdate={(u) => u && setCurrentUser(u)}
            childrenProfiles={childrenProfiles}
            onAddChild={handleAddChild}
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
});
