// apps/mobile/src/navigation/AdminNavigator.tsx
// Giao diện Admin trên điện thoại. Thanh tab: Tổng quan · Việc chờ · Tài khoản · Thêm; màn con: Rút tiền, Hoàn tiền,
// Kháng nghị, Nhật ký kiểm toán. Badge việc chờ lấy từ GET /admin/overview, làm mới sau mỗi thao tác.
// GĐ F: Gói & định giá, Doanh thu & đối soát, Cấu hình AI là màn con mở từ "Thêm".
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { HeyCard } from '../components/ui/HeyCard';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { StateView } from '../components/ui/StateView';
import { useManagementResource } from '../components/management/ManagementUi';
import { Spacing } from '../theme/spacing';
import { SessionUser } from '../types/sessionUser';
import { adminService } from '../services/adminService';
import { AdminDashboardScreen, ADMIN_QUEUES, QueueRow } from '../screens/admin/AdminDashboardScreen';
import { WithdrawalsScreen } from '../screens/admin/WithdrawalsScreen';
import { RefundsScreen } from '../screens/admin/RefundsScreen';
import { AppealsScreen } from '../screens/admin/AppealsScreen';
import { AccountsScreen } from '../screens/admin/AccountsScreen';
import { AuditLogsScreen } from '../screens/admin/AuditLogsScreen';
import { PlansScreen } from '../screens/admin/PlansScreen';
import { FinanceScreen } from '../screens/admin/FinanceScreen';
import { AiConfigScreen } from '../screens/admin/AiConfigScreen';
import { MoreMenuItem, MoreScreen } from '../screens/parent/MoreScreen';
import { ManagementShell, useManagementNavigation } from './ManagementShell';
import { ADMIN_ROUTES } from './managementRoutes';

export const AdminNavigator: React.FC<{ user: SessionUser; onLogout: () => void }> = ({ user, onLogout }) => {
  const nav = useManagementNavigation('ADMIN');
  const overview = useManagementResource(() => adminService.getOverview(), []);
  const badges = overview.data;
  const refreshBadges = () => void overview.reload();

  const menu: MoreMenuItem[] = [
    { key: 'appeals', group: 'Giám sát', icon: 'hammer-outline', title: 'Kháng nghị cảnh cáo', description: 'Xét kháng nghị của người bán', onPress: () => nav.navigate(ADMIN_ROUTES.APPEALS) },
    { key: 'audit', group: 'Giám sát', icon: 'document-text-outline', title: 'Nhật ký kiểm toán', description: 'Thao tác thay đổi tiền, quyền, nội dung', onPress: () => nav.navigate(ADMIN_ROUTES.AUDIT_LOGS) },
    { key: 'plans', group: 'Cấu hình', icon: 'pricetags-outline', title: 'Gói & định giá', description: 'Tạo, sửa gói dịch vụ', onPress: () => nav.navigate(ADMIN_ROUTES.PLANS) },
    { key: 'ai', group: 'Cấu hình', icon: 'hardware-chip-outline', title: 'Cấu hình AI', description: 'Giá credit cho mỗi lần AI viết truyện', onPress: () => nav.navigate(ADMIN_ROUTES.AI_CONFIG) },
    { key: 'revenue', group: 'Tài chính', icon: 'trending-up-outline', title: 'Doanh thu & đối soát', description: 'Doanh thu theo khoảng thời gian, đối soát sổ cái', onPress: () => nav.navigate(ADMIN_ROUTES.FINANCE) },
  ];

  const renderRoute = () => {
    switch (nav.current.route) {
      case ADMIN_ROUTES.DASHBOARD:
        return <AdminDashboardScreen badges={badges} onRefreshBadges={overview.reload} onOpen={nav.navigate} />;
      case ADMIN_ROUTES.QUEUES:
        return (
          <ScrollView contentContainerStyle={styles.page}>
            <ScreenHeader title="Việc đang chờ" subtitle="Yêu cầu cần Admin xử lý, cũ nhất trước." />
            {overview.status === 'error' && (
              <StateView variant="error" title="Không tải được số việc đang chờ" description={overview.error ?? undefined} actionLabel="Thử lại" onAction={overview.reload} />
            )}
            <HeyCard>
              {ADMIN_QUEUES.map((q) => (
                <QueueRow key={q.route} icon={q.icon} label={q.label} count={badges?.[q.key]} onPress={() => nav.navigate(q.route)} />
              ))}
            </HeyCard>
          </ScrollView>
        );
      case ADMIN_ROUTES.ACCOUNTS:
        return <AccountsScreen meId={user.id} />;
      case ADMIN_ROUTES.MENU:
        return <MoreScreen title="Thêm" currentUser={user} items={menu} onLogout={onLogout} />;
      case ADMIN_ROUTES.WITHDRAWALS:
        return <WithdrawalsScreen onBack={nav.goBack} onChanged={refreshBadges} />;
      case ADMIN_ROUTES.REFUNDS:
        return <RefundsScreen onBack={nav.goBack} onChanged={refreshBadges} />;
      case ADMIN_ROUTES.APPEALS:
        return <AppealsScreen onBack={nav.goBack} onChanged={refreshBadges} />;
      case ADMIN_ROUTES.AUDIT_LOGS:
        return <AuditLogsScreen onBack={nav.goBack} />;
      case ADMIN_ROUTES.PLANS:
        return <PlansScreen onBack={nav.goBack} />;
      case ADMIN_ROUTES.FINANCE:
        return <FinanceScreen onBack={nav.goBack} />;
      case ADMIN_ROUTES.AI_CONFIG:
        return <AiConfigScreen onBack={nav.goBack} />;
      default:
        return null;
    }
  };

  const pending = badges ? badges.withdrawals + badges.refunds + badges.appeals : undefined;
  return (
    <ManagementShell role="ADMIN" user={user} nav={nav} badges={{ [ADMIN_ROUTES.QUEUES]: pending }}>
      {renderRoute()}
    </ManagementShell>
  );
};

const styles = StyleSheet.create({
  page: { padding: Spacing.page, paddingBottom: Spacing.xxxl },
});
