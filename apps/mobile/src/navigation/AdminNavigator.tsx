// apps/mobile/src/navigation/AdminNavigator.tsx
// Giao diện Admin trên điện thoại. Thanh tab: Tổng quan · Việc chờ · Tài khoản · Thêm; màn con: Rút tiền, Hoàn tiền,
// Kháng nghị, Nhật ký kiểm toán. Badge việc chờ lấy từ GET /admin/overview, làm mới sau mỗi thao tác.
// Gói & định giá, Cấu hình AI, Doanh thu & đối soát chưa làm trên Mobile: hiện rõ "Dùng trên Web", không có nút giả.
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { HeyCard } from '../components/ui/HeyCard';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { StateView } from '../components/ui/StateView';
import { useDialog } from '../components/ui/Dialog';
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
import { MoreMenuItem, MoreScreen } from '../screens/parent/MoreScreen';
import { ManagementShell, useManagementNavigation } from './ManagementShell';
import { ADMIN_ROUTES } from './managementRoutes';
import { WEB_ONLY_NOTICE } from '../constants/management';

export const AdminNavigator: React.FC<{ user: SessionUser; onLogout: () => void }> = ({ user, onLogout }) => {
  const nav = useManagementNavigation('ADMIN');
  const dialog = useDialog();
  const overview = useManagementResource(() => adminService.getOverview(), []);
  const badges = overview.data;
  const refreshBadges = () => void overview.reload();
  const webOnly = (title: string) => () => void dialog.notify(title, WEB_ONLY_NOTICE);

  const menu: MoreMenuItem[] = [
    { key: 'appeals', group: 'Giám sát', icon: 'hammer-outline', title: 'Kháng nghị cảnh cáo', description: 'Xét kháng nghị của người bán', onPress: () => nav.navigate(ADMIN_ROUTES.APPEALS) },
    { key: 'audit', group: 'Giám sát', icon: 'document-text-outline', title: 'Nhật ký kiểm toán', description: 'Thao tác thay đổi tiền, quyền, nội dung', onPress: () => nav.navigate(ADMIN_ROUTES.AUDIT_LOGS) },
    { key: 'plans', group: 'Cấu hình', icon: 'pricetags-outline', title: 'Gói & định giá', description: 'Tạo, sửa gói dịch vụ', badge: 'Dùng trên Web', onPress: webOnly('Gói & định giá') },
    { key: 'ai', group: 'Cấu hình', icon: 'hardware-chip-outline', title: 'Cấu hình AI', description: 'Giá credit cho mỗi lần AI viết truyện', badge: 'Dùng trên Web', onPress: webOnly('Cấu hình AI') },
    { key: 'revenue', group: 'Tài chính', icon: 'trending-up-outline', title: 'Doanh thu & đối soát', description: 'Lãi lỗ, chi phí AI, đối soát ví', badge: 'Dùng trên Web', onPress: webOnly('Doanh thu & đối soát') },
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
