// apps/mobile/src/screens/admin/AiConfigScreen.tsx
// GĐ F – Cấu hình AI (Web AiConfigPage + SettingsGroup group="ai"): CHỈ các khoá nhóm `ai` (giá credit cho mỗi lần AI viết / vẽ,
// tỉ giá báo cáo). Sửa từng giá trị, kiểm tra như BE settingError, LUÔN qua Dialog xác nhận. Khoá ngoài nhóm ai không hiện,
// không sửa. Nhà cung cấp / khoá API nằm trong biến môi trường của dịch vụ ai/, không hiện ở đây.
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { ManagementPage, SectionTitle, useManagementResource } from '../../components/management/ManagementUi';
import { SettingsGroup } from '../../components/admin/SettingsGroup';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { adminService } from '../../services/adminService';

// GĐ D2: phần hàng cài đặt chuyển sang components/admin/SettingsGroup (dùng chung với nhóm market ở Gói & định giá)
export const AiConfigScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const res = useManagementResource(() => adminService.getSettings(), []);

  return (
    <ManagementPage title="Cấu hình AI" subtitle="Credit là đơn vị phụ huynh dùng; mỗi gói cấp credit hằng tháng." onBack={onBack} onRefresh={res.reload}>
      <SectionTitle>Giá & quy đổi</SectionTitle>
      <SettingsGroup group="ai" res={res} emptyTitle="Chưa có cấu hình AI." />
      <HeyCard style={styles.card}>
        <Text style={styles.heading}>Nhà cung cấp</Text>
        <Text style={styles.body}>
          Chữ do dịch vụ ai/ sinh (Claude), giọng đọc do VieNeu TTS chạy cục bộ. Chọn nhà cung cấp và khoá API nằm trong biến môi trường của dịch vụ ai/ — không lưu
          trong cơ sở dữ liệu nên không sửa ở đây, tránh lộ khoá qua giao diện web.
        </Text>
        <Text style={styles.body}>Lớp an toàn: từ khoá chặn do Kiểm duyệt viên quản lý áp dụng cho cả chữ AI viết và chữ phụ huynh tự viết.</Text>
      </HeyCard>
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  heading: { ...Typography.bodyStrong, color: Colors.text },
  body: { ...Typography.label, color: Colors.text },
});
