// src/App.tsx — v4.1 connected to real BE auth
import React, { useState, useEffect } from 'react';
import { loginApi, registerApi, getMeApi, logoutApi, isLoggedIn, authFetch, getSavedUser } from './utils/authService';
import { MOCK_CHILDREN, MOCK_CHARACTERS, MOCK_TEMPLATES, MOCK_STORIES, MOCK_WALLET_TRANSACTIONS } from './utils/mockData';
import {
  UserAccount,
  ChildProfile,
  FamilyCharacter,
  PedagogicalTemplate,
  Story,
  WalletTransaction,
  Role,
} from '../packages/shared-types';
import { IntroScreen }    from './components/IntroScreen';
import { LoginScreen }    from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { HeyTopBar } from '../apps/mobile/src/components/HeyTopBar';
import { HeyTabBar } from '../apps/mobile/src/components/HeyTabBar';
import { AuthModal } from '../apps/mobile/src/components/AuthModal';
import { StoryReaderModal } from '../apps/mobile/src/components/StoryReaderModal';
import { ParentHomeScreen } from '../apps/mobile/src/screens/ParentHomeScreen';
import { StoryWizard } from '../apps/mobile/src/screens/StoryWizard';
import { KidModeScreen } from '../apps/mobile/src/screens/KidModeScreen';
import { MarketplaceScreen } from '../apps/mobile/src/screens/MarketplaceScreen';
import { WalletScreen } from '../apps/mobile/src/screens/WalletScreen';
import { EqReportScreen } from '../apps/mobile/src/screens/EqReportScreen';
import { SellerDashboard } from '../apps/mobile/src/screens/SellerDashboard';
import { ModeratorAdminScreen } from '../apps/mobile/src/screens/ModeratorAdminScreen';

// App phase flow
type AppPhase = 'INTRO' | 'LOGIN' | 'REGISTER' | 'APP';

export default function App() {
  // ── Phase state ──────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<AppPhase>('INTRO');

  // ── App state ────────────────────────────────────────────────────────────
  const [activeRole, setActiveRole] = useState<Role>('PARENT');
  const [isKidMode, setIsKidMode] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>('HOME');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [selectedStoryToRead, setSelectedStoryToRead] = useState<Story | null>(null);

  // ── User State (Lấy thông tin tài khoản thật từ phiên đăng nhập) ──────────
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = getSavedUser();
    if (saved) {
      return {
        id: saved.id || '',
        email: saved.email || '',
        fullName: saved.fullName || saved.username || 'Phụ Huynh',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        phone: saved.phone || '',
        role: (saved.role?.toUpperCase() as any) || 'PARENT',
        kidModePinHash: '1234',
        createdAt: saved.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creditBalance: saved.wallet?.creditBalance ?? 50,
        sellerPendingBalance: 0,
        sellerAvailableBalance: 0,
      };
    }
    return {
      id: '',
      email: '',
      fullName: '',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      phone: '',
      role: 'PARENT',
      kidModePinHash: '1234',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      creditBalance: 0,
      sellerPendingBalance: 0,
      sellerAvailableBalance: 0,
    };
  });

  // ── Data state: khởi tạo bằng mock data, sẽ replace bằng BE data khi có ──────
  const [childrenProfiles, setChildrenProfiles] = useState<ChildProfile[]>(MOCK_CHILDREN);
  const [characters, setCharacters] = useState<FamilyCharacter[]>(MOCK_CHARACTERS);
  const [templates, setTemplates] = useState<PedagogicalTemplate[]>(MOCK_TEMPLATES);
  const [stories, setStories] = useState<Story[]>(MOCK_STORIES);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(MOCK_WALLET_TRANSACTIONS);

  // ── Fetch data khi vào app ───────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'APP') fetchInitialData();
  }, [phase]);

  const fetchInitialData = async () => {
    try {
      // ── Lấy thông tin User từ BE thật (dùng JWT Bearer token) ───
      if (isLoggedIn()) {
        try {
          const beUser = await getMeApi();
          if (beUser) {
            setCurrentUser(prev => ({
              ...prev,
              id: beUser.id,
              email: beUser.email,
              fullName: beUser.fullName || beUser.username || prev.fullName,
              phone: beUser.phone || prev.phone,
              role: (beUser.role?.toUpperCase() as any) || prev.role,
              creditBalance: beUser.wallet?.creditBalance ?? prev.creditBalance,
            }));
          }
        } catch {
          // Token không hợp lệ hoặc BE chưa sẵn sàng
        }
      }
    } catch (err) {
      console.warn('Backend loading or starting up:', err);
    }
  };

  // ── Login handler — gọi BE thật ─────────────────────────────────────────
  const handleLogin = async (email: string, password: string) => {
    // Nếu dùng tài khoản demo đặc biệt
    if (email === 'demo@storyweaver.vn') {
      setCurrentUser(prev => ({
        ...prev,
        fullName: 'Người dùng Demo',
        email,
      }));
      setPhase('APP');
      return;
    }

    // Gọi BE thật: POST /api/v1/auth/login
    // BE nhận emailOrUsername, response: { data: { user, tokens } }
    const beUser = await loginApi(email, password);
    setCurrentUser(prev => ({
      ...prev,
      id: beUser.id,
      email: beUser.email,
      fullName: beUser.fullName || beUser.username,
      phone: beUser.phone || prev.phone,
      role: (beUser.role?.toUpperCase() as any) || 'PARENT',
      creditBalance: beUser.wallet?.creditBalance ?? prev.creditBalance,
    }));
    setPhase('APP');
  };

  // ── Register handler — gọi BE thật ───────────────────────────────────────
  const handleRegister = async (name: string, email: string, password: string) => {
    // Gọi BE thật: POST /api/v1/auth/register
    // BE nhận: username, email, password, fullName
    const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
    const beUser = await registerApi(username, email, password, name);
    setCurrentUser(prev => ({
      ...prev,
      id: beUser.id,
      email: beUser.email,
      fullName: beUser.fullName || name,
      role: (beUser.role?.toUpperCase() as any) || 'PARENT',
      creditBalance: beUser.wallet?.creditBalance ?? 50,
    }));
    setPhase('APP');
  };

  // ── Wallet refresh ───────────────────────────────────────────────────────
  const handleRefreshWallet = async () => {
    try {
      // Dùng authFetch để tự động gửi Bearer token
      const res = await authFetch('/api/wallet/summary');
      if (res.ok) {
        const wData = await res.json();
        setWalletTransactions(wData.transactions || []);
        setCurrentUser(prev => ({
          ...prev,
          creditBalance: wData.creditBalance,
          sellerPendingBalance: wData.sellerPendingBalance,
          sellerAvailableBalance: wData.sellerAvailableBalance,
        }));
      }
    } catch {}
  };

  // ── Logout handler ────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logoutApi();
    setCurrentUser({
      id: '',
      email: '',
      fullName: '',
      role: 'PARENT',
      creditBalance: 0,
      sellerPendingBalance: 0,
      sellerAvailableBalance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setPhase('LOGIN');
  };

  const handleStoryCreated = (newStory: Story) => {
    setStories(prev => [newStory, ...prev.filter(s => s.id !== newStory.id)]);
    setCurrentTab('HOME');
    setSelectedStoryToRead(newStory);
  };

  const handleStoryPurchased = (purchasedStory: Story) => {
    setStories(prev => [purchasedStory, ...prev.filter(s => s.id !== purchasedStory.id)]);
    handleRefreshWallet();
    alert(`🎉 Bạn đã sở hữu "${purchasedStory.title}"`);
  };

  const handleSubmitForReview = async (storyId: string) => {
    try {
      const res = await fetch(`/api/stories/${storyId}/submit-review`, { method: 'POST' });
      const data = await res.json();
      if (data.story) {
        setStories(prev => prev.map(s => (s.id === storyId ? data.story : s)));
        alert(data.message || 'Đã gửi duyệt!');
      }
    } catch { alert('Lỗi gửi duyệt'); }
  };

  const handleAddChild = async (childData: Partial<ChildProfile>) => {
    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(childData),
      });
      const data = await res.json();
      setChildrenProfiles(prev => [...prev, data]);
    } catch {}
  };

  const handleRecordEqSignal = async (eqSignal: string, skillDescription: string) => {
    try {
      await fetch('/api/eq/record-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: childrenProfiles[0]?.id, eqSignal, skillDescription }),
      });
    } catch {}
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE: INTRO VIDEO
  // ═══════════════════════════════════════════════════════════════════════
  if (phase === 'INTRO') {
    return <IntroScreen onFinish={() => setPhase('LOGIN')} />;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE: LOGIN
  // ═══════════════════════════════════════════════════════════════════════
  if (phase === 'LOGIN') {
    return <LoginScreen onLogin={handleLogin} onGoRegister={() => setPhase('REGISTER')} />;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE: REGISTER
  // ═══════════════════════════════════════════════════════════════════════
  if (phase === 'REGISTER') {
    return <RegisterScreen onRegister={handleRegister} onGoLogin={() => setPhase('LOGIN')} />;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE: APP — Kid Mode
  // ═══════════════════════════════════════════════════════════════════════
  if (isKidMode && childrenProfiles.length > 0) {
    return (
      <div className={isMobileFrame ? 'sw-desktop-bg' : ''}>
        <div className={isMobileFrame ? 'sw-mobile-frame' : 'sw-full'}>
          <KidModeScreen
            child={childrenProfiles[0]}
            stories={stories}
            correctPin={currentUser.kidModePinHash || '1234'}
            onExitKidMode={() => setIsKidMode(false)}
            onRecordEqSignal={handleRecordEqSignal}
          />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE: APP — Main screens
  // ═══════════════════════════════════════════════════════════════════════
  const renderCurrentView = () => {
    if (activeRole === 'MODERATOR' || activeRole === 'ADMIN') {
      return <ModeratorAdminScreen />;
    }
    if (activeRole === 'SELLER') {
      return (
        <SellerDashboard
          currentUser={currentUser}
          stories={stories}
          onOpenStoryWizard={() => setCurrentTab('CREATE')}
          onOpenWallet={() => setCurrentTab('WALLET')}
          onSubmitForReview={handleSubmitForReview}
        />
      );
    }
    switch (currentTab) {
      case 'HOME':
        return (
          <ParentHomeScreen
            currentUser={currentUser}
            childrenProfiles={childrenProfiles}
            stories={stories}
            templates={templates}
            onStartStoryWizard={() => setCurrentTab('CREATE')}
            onOpenKidMode={() => setIsKidMode(true)}
            onNavigateTab={tab => setCurrentTab(tab)}
            onSelectStoryToRead={story => setSelectedStoryToRead(story)}
          />
        );
      case 'CREATE':
        return (
          <StoryWizard
            characters={characters}
            templates={templates}
            currentUser={currentUser}
            onStoryCreated={handleStoryCreated}
            onCancel={() => setCurrentTab('HOME')}
            onUpdateCharacters={chars => setCharacters(chars)}
          />
        );
      case 'MARKET':
        return (
          <MarketplaceScreen
            stories={stories}
            currentUser={currentUser}
            onStoryPurchased={handleStoryPurchased}
            onSelectStoryToRead={story => setSelectedStoryToRead(story)}
          />
        );
      case 'EQ':
        return <EqReportScreen childrenProfiles={childrenProfiles} />;
      case 'WALLET':
        return (
          <WalletScreen
            currentUser={currentUser}
            transactions={walletTransactions}
            onUserUpdate={u => setCurrentUser(u)}
            onRefreshWallet={handleRefreshWallet}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={isMobileFrame ? 'sw-desktop-bg' : 'sw-full fairy-bg'}>
      <div className={isMobileFrame ? 'sw-mobile-frame' : 'sw-full flex-col'}>
        {/* Top nav */}
        <HeyTopBar
          currentUser={currentUser}
          activeRole={activeRole}
          onRoleChange={r => setActiveRole(r)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenWallet={() => setCurrentTab('WALLET')}
          isMobileFrame={isMobileFrame}
          onToggleFrame={() => setIsMobileFrame(!isMobileFrame)}
        />

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 60 }}>
          {renderCurrentView()}
        </main>

        {/* Bottom tab bar */}
        {activeRole === 'PARENT' && (
          <HeyTabBar
            currentTab={currentTab}
            onSelectTab={tab => setCurrentTab(tab)}
            onOpenKidMode={() => setIsKidMode(true)}
          />
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserUpdate={u => {
          if (u) setCurrentUser(u);
        }}
        childrenProfiles={childrenProfiles}
        onAddChild={handleAddChild}
        onLogout={handleLogout}
      />

      <StoryReaderModal
        story={selectedStoryToRead}
        visible={Boolean(selectedStoryToRead)}
        onClose={() => setSelectedStoryToRead(null)}
      />
    </div>
  );
}
