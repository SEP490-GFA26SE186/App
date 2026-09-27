// apps/api/src/modules/moderation/moderation.service.ts
// Moderator queue & 100% page-by-page checklist validator

import { Story, StoryPage, ModerationChecklist } from '../../../../../packages/shared-types';

export class ModerationService {
  private bannedKeywords: string[] = [
    'bạo lực', 'đánh nhau', 'súng', 'máu', 'tự tử',
    'chửi bới', 'độc ác', 'ma quỷ', 'dao kéo', 'độc hại'
  ];

  /**
   * Quét tự động từ khoá nhạy cảm trước khi vào hàng đợi Moderator
   */
  public autoScanContent(text: string): { hasViolation: boolean; matchedWords: string[] } {
    const lower = text.toLowerCase();
    const matchedWords = this.bannedKeywords.filter((w) => lower.includes(w));
    return {
      hasViolation: matchedWords.length > 0,
      matchedWords,
    };
  }

  /**
   * Kiểm tra điều kiện xuất bản: BẮT BUỘC DUYỆT ĐỦ 100% SỐ TRANG
   */
  public validateFullPublishEligibility(
    story: Story,
    checklistData: {
      pageReviews: {
        pageNumber: number;
        approved: boolean;
        noViolent: boolean;
        noPII: boolean;
        illustrationFit: boolean;
        notes?: string;
      }[];
    }
  ): {
    canPublish: boolean;
    approvedCount: number;
    totalCount: number;
    missingPages: number[];
    reason?: string;
  } {
    const totalPages = story.pages.length;
    const reviewMap = new Map<number, boolean>();

    for (const pr of checklistData.pageReviews) {
      if (pr.approved && pr.noViolent && pr.noPII && pr.illustrationFit) {
        reviewMap.set(pr.pageNumber, true);
      } else {
        reviewMap.set(pr.pageNumber, false);
      }
    }

    const missingPages: number[] = [];
    let approvedCount = 0;

    for (const page of story.pages) {
      if (reviewMap.get(page.pageNumber) === true) {
        approvedCount++;
      } else {
        missingPages.push(page.pageNumber);
      }
    }

    const canPublish = approvedCount === totalPages && totalPages > 0;

    return {
      canPublish,
      approvedCount,
      totalCount: totalPages,
      missingPages,
      reason: canPublish
        ? undefined
        : `Kiểm duyệt viên chưa duyệt đủ 100% số trang. Còn thiếu hoặc chưa đạt các trang: ${missingPages.join(', ')}`,
    };
  }
}

export const moderationService = new ModerationService();
