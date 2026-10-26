// apps/mobile/src/dev/preview/KidPreview.tsx
// B9-P – Kid UI Preview (ADR-020). CHỈ dùng khi phát triển giao diện (__DEV__), bật chủ động từ màn Login.
// Đây KHÔNG phải Kid Mode: không phiên Kid, không PIN (nút thoát đóng preview trực tiếp), không token,
// không gọi API, không đọc/ghi storage, không đổi trạng thái đăng nhập. Dữ liệu là fixture trong src/dev/demo.
// Quy tắc import (kiểm bằng grep G11): file này và src/dev/** KHÔNG import apiClient/authService/kidService/storage.
import React from 'react';
import { KidModeScreen } from '../../screens/kid/KidModeScreen';
import { DEMO_CHILDREN, DEMO_STORIES } from '../demo/demoData';
import type { KidPlayDto } from '../../types/api';
import type { KidDataSource } from '../../types/viewModels';

// Nguồn dữ liệu giả của preview: tủ sách từ DEMO_STORIES, một điểm dừng cảm xúc sau trang đầu để xem giao diện.
const toPlay = (storyId: string): KidPlayDto => {
  const story = DEMO_STORIES.find((s) => s.id === storyId) ?? DEMO_STORIES[0];
  const pages = story.pages.map((p, i) => ({
    id: p.id ?? `demo_page_${i}`,
    pageOrder: i + 1,
    text: p.text,
    imageUrl: p.illustrationUrl || null,
  }));
  return {
    session: {
      id: 'demo_session',
      storyId: story.id,
      isFirstPlay: true,
      status: 'in_progress',
      currentPageId: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
    },
    story: {
      id: story.id,
      title: story.title,
      useTts: false,
      topic: null,
      pages,
      checkpoints: [
        {
          id: 'demo_checkpoint',
          afterPageId: pages[0].id,
          afterPageOrder: 1,
          type: 'emotion_self',
          question: '(Mẫu) Bé thấy nhân vật đang cảm thấy thế nào?',
          options: [],
          result: null,
        },
      ],
    },
  };
};

const previewSource: KidDataSource = {
  getShelf: async () =>
    DEMO_STORIES.map((s) => ({
      storyId: s.id,
      title: s.title,
      coverImageUrl: s.coverImageUrl ?? null,
      totalPages: s.pages.length,
    })),
  startReading: async (storyId) => toPlay(storyId),
  saveProgress: async () => {},
  answer: async (_sessionId, body) => ({ checkpointId: body.checkpointId, attempts: 1, skipped: !!body.skipped, done: true, correct: null }),
  complete: async () => {},
};

export const KidPreview: React.FC<{ onExit: () => void }> = ({ onExit }) => (
  <KidModeScreen
    child={DEMO_CHILDREN[0]}
    source={previewSource}
    preview={{ onExit }}
    // Không dùng trong preview (nút thoát PIN không tồn tại ở chế độ này)
    onExitKidMode={async () => {}}
    onKidSessionLost={() => {}}
  />
);
