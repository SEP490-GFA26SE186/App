// src/App.tsx — v4.0 with Intro + Login flow + mobile-optimized layout
import React, { useState, useEffect } from 'react';
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

  // ── Data state ───────────────────────────────────────────────────────────
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

  const [childrenProfiles, setChildrenProfiles] = useState<ChildProfile[]>([]);
  const [characters, setCharacters] = useState<FamilyCharacter[]>([]);
  const [templates, setTemplates] = useState<PedagogicalTemplate[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);

  // ── Fetch data khi vào app ───────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'APP') fetchInitialData();
  }, [phase]);

  const fetchInitialData = async () => {
    try {
      const [uRes, cRes, chRes, tRes, sRes, wRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/children'),
        fetch('/api/characters'),
        fetch('/api/templates'),
        fetch('/api/stories'),
        fetch('/api/wallet/summary'),
      ]);
      if (uRes.ok) setCurrentUser(await uRes.json());
      if (cRes.ok) setChildrenProfiles(await cRes.json());
      if (chRes.ok) setCharacters(await chRes.json());
      if (tRes.ok) setTemplates(await tRes.json());
      if (sRes.ok) setStories(await sRes.json());
      if (wRes.ok) {
        const wData = await wRes.json();
        setWalletTransactions(wData.transactions || []);
      }
    } catch (err) {
      console.warn('Backend loading or starting up:', err);
    }
  };

  // ── Login handler — gọi API thật, fallback demo ──────────────────────────
  const handleLogin = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const userData = await res.json();
        setCurrentUser(prev => ({ ...prev, ...userData }));
      } else {
        // Demo fallback: bất kỳ thông tin nào đều vào được
        const displayName = email.includes('@') ? email.split('@')[0] : email;
        setCurrentUser(prev => ({
          ...prev,
          fullName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
          email,
        }));
      }
    } catch {
      // Offline / server chưa ready → demo mode
      const displayName = email.includes('@') ? email.split('@')[0] : email;
      setCurrentUser(prev => ({
        ...prev,
        fullName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        email,
      }));
    }
    setPhase('APP');
  };

  // ── Register handler ───────────────────────────────────────────────────────
  const handleRegister = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name, email, password }),
      });
      if (res.ok) {
        const userData = await res.json();
        setCurrentUser(prev => ({ ...prev, ...userData }));
      } else {
        // Demo fallback
        setCurrentUser(prev => ({ ...prev, fullName: name, email }));
      }
    } catch {
      setCurrentUser(prev => ({ ...prev, fullName: name, email }));
    }
    setPhase('APP');
  };

  // ── Wallet refresh ───────────────────────────────────────────────────────
  const handleRefreshWallet = async () => {
    try {
      const res = await fetch('/api/wallet/summary');
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
        onUserUpdate={u => setCurrentUser(u)}
        childrenProfiles={childrenProfiles}
        onAddChild={handleAddChild}
      />

      <StoryReaderModal
        story={selectedStoryToRead}
        visible={Boolean(selectedStoryToRead)}
        onClose={() => setSelectedStoryToRead(null)}
      />
    </div>
  );
}
