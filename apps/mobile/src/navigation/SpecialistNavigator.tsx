// apps/mobile/src/navigation/SpecialistNavigator.tsx
// Giao diện Chuyên gia sư phạm trên điện thoại. Thanh tab: Hàng chờ · Người bán · Báo cáo · Thêm; màn con: Lượt duyệt.
// Số việc chờ tính như Web (specialistService.getSpecialistOverview): hàng chờ + hồ sơ người bán chờ duyệt + báo cáo đang mở.
// Chương trình sư phạm, từ khoá chặn và các trang giám sát khác chưa làm trên Mobile: hiện "Dùng trên Web", không có nút giả.
import React from 'react';
import { useDialog } from '../components/ui/Dialog';
import { useManagementResource } from '../components/management/ManagementUi';
import { SessionUser } from '../types/sessionUser';
import { moderationService } from '../services/moderationService';
import { SpecialistOverview, SpecialistQueueScreen } from '../screens/specialist/SpecialistQueueScreen';
import { ReviewWorkspaceScreen } from '../screens/specialist/ReviewWorkspaceScreen';
import { SellerApplicationsScreen } from '../screens/specialist/SellerApplicationsScreen';
import { ReportsScreen } from '../screens/specialist/ReportsScreen';
import { MoreMenuItem, MoreScreen } from '../screens/parent/MoreScreen';
import { ManagementShell, useManagementNavigation } from './ManagementShell';
import { SPECIALIST_ROUTES } from './managementRoutes';
import { WEB_ONLY_NOTICE } from '../constants/management';

const loadOverview = async (): Promise<SpecialistOverview> => {
  const [queue, sellers, reports] = await Promise.all([
    moderationService.getQueue(),
    moderationService.getSellerApplications('pending'),
    moderationService.getReportGroups('open'),
  ]);
  return { queue, sellerApplications: sellers.length, openReports: reports.reduce((n, g) => n + g.reports.length, 0) };
};

export const SpecialistNavigator: React.FC<{ user: SessionUser; onLogout: () => void }> = ({ user, onLogout }) => {
  const nav = useManagementNavigation('SPECIALIST');
  const dialog = useDialog();
  const overview = useManagementResource(loadOverview, []);
  const refresh = () => void overview.reload();
  const openReview = (reviewId: string) => nav.navigate(SPECIALIST_ROUTES.REVIEW, { reviewId });
  const webOnly = (title: string) => () => void dialog.notify(title, WEB_ONLY_NOTICE);
  const web = (key: string, group: string, icon: MoreMenuItem['icon'], title: string, description: string): MoreMenuItem => ({
    key,
    group,
    icon,
    title,
    description,
    badge: 'Dùng trên Web',
    onPress: webOnly(title),
  });

  const menu: MoreMenuItem[] = [
    web('suspended', 'Giám sát', 'pause-circle-outline', 'Truyện tạm gỡ', 'Truyện đang tạm gỡ hoặc đã gỡ hẳn'),
    web('strikes', 'Giám sát', 'warning-outline', 'Cảnh cáo tác giả', 'Danh sách cảnh cáo còn hiệu lực'),
    web('audits', 'Giám sát', 'list-outline', 'Kiểm tra ngẫu nhiên', 'Chọn đợt hậu kiểm truyện đang bán'),
    web('ai-flags', 'Giám sát', 'hardware-chip-outline', 'Cảnh báo AI', 'Phụ huynh bị chặn nội dung AI nhiều lần'),
    web('sub-skills', 'Chương trình sư phạm', 'leaf-outline', 'Kỹ năng con', 'Kỹ năng EQ của trẻ'),
    web('templates', 'Chương trình sư phạm', 'help-circle-outline', 'Mẫu câu hỏi', 'Mẫu câu hỏi tại điểm dừng'),
    web('topics', 'Chương trình sư phạm', 'bulb-outline', 'Chuyện mẫu', 'Chủ đề / truyện mẫu'),
    web('checkpoint-review', 'Chương trình sư phạm', 'scan-outline', 'Soát câu hỏi AI', 'Câu hỏi do AI sinh cần soát'),
    web('report-settings', 'Chương trình sư phạm', 'options-outline', 'Tham số báo cáo', 'Ngưỡng báo cáo EQ'),
    web('keywords', 'Nội dung', 'ban-outline', 'Từ khoá chặn', 'Từ khoá cấm trong nội dung'),
  ];

  const renderRoute = () => {
    switch (nav.current.route) {
      case SPECIALIST_ROUTES.QUEUE:
        return <SpecialistQueueScreen overview={overview.data} status={overview.status} error={overview.error} onReload={overview.reload} onOpenReview={openReview} />;
      case SPECIALIST_ROUTES.SELLERS:
        return <SellerApplicationsScreen onChanged={refresh} />;
      case SPECIALIST_ROUTES.REPORTS:
        return <ReportsScreen onOpenReview={openReview} onChanged={refresh} />;
      case SPECIALIST_ROUTES.MENU:
        return <MoreScreen title="Thêm" currentUser={user} items={menu} onLogout={onLogout} />;
      case SPECIALIST_ROUTES.REVIEW:
        return nav.current.params?.reviewId ? (
          <ReviewWorkspaceScreen key={nav.current.params.reviewId} reviewId={nav.current.params.reviewId} onBack={nav.goBack} onChanged={refresh} />
        ) : null;
      default:
        return null;
    }
  };

  const d = overview.data;
  return (
    <ManagementShell
      role="SPECIALIST"
      user={user}
      nav={nav}
      badges={d ? { [SPECIALIST_ROUTES.QUEUE]: d.queue.length, [SPECIALIST_ROUTES.SELLERS]: d.sellerApplications, [SPECIALIST_ROUTES.REPORTS]: d.openReports } : undefined}
    >
      {renderRoute()}
    </ManagementShell>
  );
};
