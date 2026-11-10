// apps/mobile/src/navigation/SpecialistNavigator.tsx
// Giao diện Chuyên gia sư phạm trên điện thoại. Thanh tab: Hàng chờ · Người bán · Báo cáo · Thêm; màn con: Lượt duyệt.
// Số việc chờ tính như Web (specialistService.getSpecialistOverview): hàng chờ + hồ sơ người bán chờ duyệt + báo cáo đang mở.
// GĐ E1: 4 màn giám sát (Truyện tạm gỡ, Cảnh cáo, Kiểm tra ngẫu nhiên, Cảnh báo AI) là màn con mở từ "Thêm" và lối tắt ở Tổng quan.
// GĐ E2a/E2b: chương trình sư phạm (Chuyện mẫu, Kỹ năng con, Mẫu câu hỏi, Soát câu hỏi AI, Tham số báo cáo) và Từ khoá chặn là màn con
// mở từ "Thêm" — khu Chuyên gia không còn mục "Dùng trên Web".
import React from 'react';
import { useManagementResource } from '../components/management/ManagementUi';
import { SessionUser } from '../types/sessionUser';
import { buildSpecialistOverview, moderationService } from '../services/moderationService';
import { RestrictedListingsScreen } from '../screens/specialist/RestrictedListingsScreen';
import { StrikesScreen } from '../screens/specialist/StrikesScreen';
import { AuditsScreen } from '../screens/specialist/AuditsScreen';
import { AiFlagsScreen } from '../screens/specialist/AiFlagsScreen';
import { SpecialistOverview, SpecialistQueueScreen } from '../screens/specialist/SpecialistQueueScreen';
import { ReviewWorkspaceScreen } from '../screens/specialist/ReviewWorkspaceScreen';
import { SellerApplicationsScreen } from '../screens/specialist/SellerApplicationsScreen';
import { ReportsScreen } from '../screens/specialist/ReportsScreen';
import { TopicsScreen } from '../screens/specialist/TopicsScreen';
import { SubSkillsScreen } from '../screens/specialist/SubSkillsScreen';
import { TemplatesScreen } from '../screens/specialist/TemplatesScreen';
import { CheckpointReviewScreen } from '../screens/specialist/CheckpointReviewScreen';
import { ReportSettingsScreen } from '../screens/specialist/ReportSettingsScreen';
import { KeywordsScreen } from '../screens/specialist/KeywordsScreen';
import { MoreMenuItem, MoreScreen } from '../screens/parent/MoreScreen';
import { ManagementShell, useManagementNavigation } from './ManagementShell';
import { SPECIALIST_ROUTES } from './managementRoutes';

const loadOverview = async (): Promise<SpecialistOverview> => {
  const [queue, sellers, reports] = await Promise.all([
    moderationService.getQueue(),
    moderationService.getSellerApplications('pending'),
    moderationService.getReportGroups('open'),
  ]);
  return buildSpecialistOverview(queue, sellers, reports);
};

export const SpecialistNavigator: React.FC<{ user: SessionUser; onLogout: () => void }> = ({ user, onLogout }) => {
  const nav = useManagementNavigation('SPECIALIST');
  const overview = useManagementResource(loadOverview, []);
  const refresh = () => void overview.reload();
  const openReview = (reviewId: string) => nav.navigate(SPECIALIST_ROUTES.REVIEW, { reviewId });

  const open = (route: (typeof SPECIALIST_ROUTES)[keyof typeof SPECIALIST_ROUTES]) => () => nav.navigate(route);
  const menu: MoreMenuItem[] = [
    { key: 'suspended', group: 'Giám sát', icon: 'pause-circle-outline', title: 'Truyện tạm gỡ', description: 'Truyện đang tạm gỡ hoặc đã gỡ hẳn', onPress: open(SPECIALIST_ROUTES.RESTRICTED) },
    { key: 'strikes', group: 'Giám sát', icon: 'warning-outline', title: 'Cảnh cáo tác giả', description: 'Danh sách cảnh cáo còn hiệu lực', onPress: open(SPECIALIST_ROUTES.STRIKES) },
    {
      key: 'audits',
      group: 'Giám sát',
      icon: 'list-outline',
      title: 'Kiểm tra ngẫu nhiên',
      description: 'Chọn đợt hậu kiểm truyện đang bán',
      ...(overview.data?.audits ? { badge: `${overview.data.audits} chờ xem` } : {}),
      onPress: open(SPECIALIST_ROUTES.AUDITS),
    },
    { key: 'ai-flags', group: 'Giám sát', icon: 'hardware-chip-outline', title: 'Cảnh báo AI', description: 'Phụ huynh bị chặn nội dung AI nhiều lần', onPress: open(SPECIALIST_ROUTES.AI_FLAGS) },
    { key: 'sub-skills', group: 'Chương trình sư phạm', icon: 'leaf-outline', title: 'Kỹ năng con', description: 'Kỹ năng EQ của trẻ (danh mục CASEL)', onPress: open(SPECIALIST_ROUTES.SUB_SKILLS) },
    { key: 'templates', group: 'Chương trình sư phạm', icon: 'help-circle-outline', title: 'Mẫu câu hỏi', description: 'Mẫu câu hỏi tại điểm dừng: soạn nháp, ban hành', onPress: open(SPECIALIST_ROUTES.TEMPLATES) },
    { key: 'topics', group: 'Chương trình sư phạm', icon: 'bulb-outline', title: 'Chuyện mẫu', description: 'Chuyện mẫu phụ huynh chọn khi tạo truyện', onPress: open(SPECIALIST_ROUTES.TOPICS) },
    { key: 'checkpoint-review', group: 'Chương trình sư phạm', icon: 'scan-outline', title: 'Soát câu hỏi AI', description: 'Câu hỏi chấm điểm do AI viết cần soát', onPress: open(SPECIALIST_ROUTES.CHECKPOINT_REVIEW) },
    { key: 'report-settings', group: 'Chương trình sư phạm', icon: 'options-outline', title: 'Tham số báo cáo', description: 'Ngưỡng xếp mức báo cáo EQ', onPress: open(SPECIALIST_ROUTES.REPORT_SETTINGS) },
    { key: 'keywords', group: 'Nội dung', icon: 'ban-outline', title: 'Từ khoá chặn', description: 'Từ khoá cấm / cảnh báo trong nội dung', onPress: open(SPECIALIST_ROUTES.KEYWORDS) },
  ];

  const renderRoute = () => {
    switch (nav.current.route) {
      case SPECIALIST_ROUTES.QUEUE:
        return (
          <SpecialistQueueScreen
            overview={overview.data}
            status={overview.status}
            error={overview.error}
            onReload={overview.reload}
            onOpenReview={openReview}
            shortcuts={[
              { key: 'restricted', icon: 'pause-circle-outline', label: 'Truyện tạm gỡ', onPress: open(SPECIALIST_ROUTES.RESTRICTED) },
              { key: 'strikes', icon: 'warning-outline', label: 'Cảnh cáo', onPress: open(SPECIALIST_ROUTES.STRIKES) },
              { key: 'audits', icon: 'list-outline', label: 'Kiểm tra ngẫu nhiên', onPress: open(SPECIALIST_ROUTES.AUDITS) },
              { key: 'ai-flags', icon: 'hardware-chip-outline', label: 'Cảnh báo AI', onPress: open(SPECIALIST_ROUTES.AI_FLAGS) },
            ]}
          />
        );
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
      case SPECIALIST_ROUTES.RESTRICTED:
        return <RestrictedListingsScreen onBack={nav.goBack} onOpenReview={openReview} onChanged={refresh} />;
      case SPECIALIST_ROUTES.STRIKES:
        return <StrikesScreen onBack={nav.goBack} />;
      case SPECIALIST_ROUTES.AUDITS:
        return <AuditsScreen onBack={nav.goBack} onOpenReview={openReview} onChanged={refresh} />;
      case SPECIALIST_ROUTES.AI_FLAGS:
        return <AiFlagsScreen onBack={nav.goBack} />;
      case SPECIALIST_ROUTES.TOPICS:
        return <TopicsScreen onBack={nav.goBack} />;
      case SPECIALIST_ROUTES.SUB_SKILLS:
        return <SubSkillsScreen onBack={nav.goBack} />;
      case SPECIALIST_ROUTES.TEMPLATES:
        return <TemplatesScreen onBack={nav.goBack} />;
      case SPECIALIST_ROUTES.CHECKPOINT_REVIEW:
        return <CheckpointReviewScreen onBack={nav.goBack} />;
      case SPECIALIST_ROUTES.REPORT_SETTINGS:
        return <ReportSettingsScreen onBack={nav.goBack} />;
      case SPECIALIST_ROUTES.KEYWORDS:
        return <KeywordsScreen onBack={nav.goBack} />;
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
