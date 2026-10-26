// apps/mobile/src/dev/preview/KidPreview.tsx
// B9-P – Kid UI Preview (ADR-020). CHỈ dùng khi phát triển giao diện (__DEV__), bật chủ động từ màn Login.
// Đây KHÔNG phải Kid Mode: không phiên Kid, không PIN (nút thoát đóng preview trực tiếp), không token,
// không gọi API, không đọc/ghi storage, không đổi trạng thái đăng nhập. Dữ liệu là fixture trong src/dev/demo.
// Quy tắc import (kiểm bằng grep G11): file này và src/dev/** KHÔNG import apiClient/authService/kidService/storage.
import React from 'react';
import { KidModeScreen } from '../../screens/kid/KidModeScreen';
import { DEMO_CHILDREN, DEMO_STORIES } from '../demo/demoData';

export const KidPreview: React.FC<{ onExit: () => void }> = ({ onExit }) => (
  <KidModeScreen
    child={DEMO_CHILDREN[0]}
    stories={DEMO_STORIES}
    preview={{ onExit }}
    // Không dùng trong preview (nút thoát PIN không tồn tại ở chế độ này)
    onExitKidMode={async () => {}}
    onKidSessionLost={() => {}}
    onRecordEqSignal={() => {}}
  />
);
