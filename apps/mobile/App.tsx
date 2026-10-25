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
  DEMO_PARENT_USER,
  DEMO_CHILDREN,
  DEMO_CHARACTERS,
  DEMO_TEMPLATES,
  DEMO_STORIES,
} from './src/services';

export default function App() {
  const [appPhase, setAppPhase] = useState<'LOGIN' | 'REGISTER' | 'APP'>(() =>
    authService.isLoggedIn() ? 'APP' : 'LOGIN'
  );
  const [activeRole, setActiveRole] = useState<Role>('PARENT');
  const [isKidMode, setIsKidMode] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>('HOME');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [selectedStoryToRead, setSelectedStoryToRead] = useState<Story | null>(null);

  // User State
  const [currentUser, setCurrentUser] = useState<UserAccount>(DEMO_PARENT_USER);
  const [childrenProfiles, setChildrenProfiles] = useState<ChildProfile[]>(DEMO_CHILDREN);
  const [characters, setCharacters] = useState<FamilyCharacter[]>(DEMO_CHARACTERS);
  const [templates, setTemplates] = useState<PedagogicalTemplate[]>(DEMO_TEMPLATES);
  const [stories, setStories] = useState<Story[]>(DEMO_STORIES);

  const [transactions, setTransactions] = useState<WalletTransaction[]>([
    {
      id: 'tx_01',
      userId: currentUser.id,
      type: 'CREDIT_PURCHASE',
      amountCredits: 50,
      amountVnd: 50000,
      description: 'Nạp Credits qua PayOS QR',
      createdAt: new Date().toISOString(),
      status: 'COMPLETED',
    },
    {
      id: 'tx_02',
      userId: currentUser.id,
      type: 'STORY_PURCHASE',
      amountCredits: -3,
      description: 'Sáng tác AI câu chuyện "Bé Bin & Chiếc Ô"',
      createdAt: new Date().toISOString(),
      status: 'COMPLETED',
    },
  ]);

  // Load live data from API on start
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const me = await authService.getMe();
      if (me) setCurrentUser(me);
    } catch {}

    try {
      const [chList, charsList, stList, tplList] = await Promise.all([
        childService.getChildren(),
        characterService.getCharacters(),
        storyService.getStories(),
        storyService.getTemplates(),
      ]);
      if (chList && chList.length > 0) setChildrenProfiles(chList);
      if (charsList && charsList.length > 0) setCharacters(charsList);
      if (stList && stList.length > 0) setStories(stList);
      if (tplList && tplList.length > 0) setTemplates(tplList);
    } catch (e) {
      console.log('Error loading initial API data:', e);
    }
  };

  const handleOpenKidMode = async (child?: ChildProfile) => {
    const target = child || childrenProfiles[0];
    if (target) {
      try {
        await authService.enterKidMode(target.id);
      } catch (err) {
        console.log('Kid mode enter error:', err);
      }
    }
    setIsKidMode(true);
  };

  const handleExitKidMode = async (pin?: string) => {
    if (pin) {
      try {
        await authService.exitKidMode(pin);
      } catch {}
    }
    setIsKidMode(false);
    loadAllData();
  };

  const handleStoryCreated = async (newStory: Story) => {
    try {
      const created = await storyService.createStory({
        title: newStory.title,
        situation: newStory.summary || newStory.pages?.[0]?.text,
      });
      setStories([created || newStory, ...stories]);
    } catch {
      setStories([newStory, ...stories]);
    }
    setCurrentUser((prev) => ({
      ...prev,
      creditBalance: Math.max(0, (prev.creditBalance || 0) - 3),
    }));
    setSelectedStoryToRead(newStory);
    setCurrentTab('HOME');
  };

  const handleAddChild = async (child: Partial<ChildProfile>) => {
    try {
      const newChild = await childService.createChild({
        name: child.name || 'Bé Mới',
        birthDate: child.birthDate || '2020-05-01',
      });
      setChildrenProfiles((prev) => [...prev, newChild]);
    } catch {
      const fallbackChild: ChildProfile = {
        id: `ch_${Date.now()}`,
        parentId: currentUser.id,
        name: child.name || 'Bé Mới',
        age: child.age || 4,
        gender: 'MALE',
        readingLevel: child.readingLevel || 'BEGINNER',
        favoriteThemes: ['Cổ tích', 'Thiên nhiên'],
      };
      setChildrenProfiles((prev) => [...prev, fallbackChild]);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    setIsAuthModalOpen(false);
    setAppPhase('LOGIN');
  };

  if (appPhase === 'LOGIN') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <LoginScreen
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setAppPhase('APP');
            loadAllData();
          }}
          onGoRegister={() => setAppPhase('REGISTER')}
          onSkip={() => {
            setCurrentUser(DEMO_PARENT_USER);
            setAppPhase('APP');
            loadAllData();
          }}
        />
      </SafeAreaView>
    );
  }

  if (appPhase === 'REGISTER') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <RegisterScreen
          onRegisterSuccess={(user) => {
            setCurrentUser(user);
            setAppPhase('APP');
            loadAllData();
          }}
          onGoLogin={() => setAppPhase('LOGIN')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* KID MODE VIEW (CHILDREN EXPERIENCE) */}
      {isKidMode ? (
        <KidModeScreen
          child={childrenProfiles[0]}
          stories={stories}
          correctPin={currentUser.kidModePinHash || '1234'}
          onExitKidMode={handleExitKidMode}
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
                    transactions={transactions}
                    onUserUpdate={setCurrentUser}
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
            onAddChild={handleAddChild}
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
});
