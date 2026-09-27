// apps/api/src/modules/eq/eq.service.ts
// Learning through stories: Tính báo cáo EQ và tín hiệu kỹ năng cho trẻ

import { EqReport } from '../../../../../packages/shared-types';

export class EqService {
  /**
   * Tính toán điểm số 5 chiều EQ cho bé dựa trên các tín hiệu hành vi đã ghi nhận
   */
  public calculateRadarScores(signals: { eqSignal: string; verified: boolean }[]): {
    empathy: number;
    independence: number;
    patience: number;
    creativity: number;
    communication: number;
  } {
    const baseScores = {
      empathy: 65,
      independence: 70,
      patience: 60,
      creativity: 80,
      communication: 75,
    };

    signals.forEach((s) => {
      const weight = s.verified ? 6 : 3;
      switch (s.eqSignal) {
        case 'EMPATHY':
          baseScores.empathy = Math.min(100, baseScores.empathy + weight);
          break;
        case 'INDEPENDENCE':
          baseScores.independence = Math.min(100, baseScores.independence + weight);
          break;
        case 'PATIENCE':
          baseScores.patience = Math.min(100, baseScores.patience + weight);
          break;
        case 'CREATIVITY':
          baseScores.creativity = Math.min(100, baseScores.creativity + weight);
          break;
        case 'COMMUNICATION':
          baseScores.communication = Math.min(100, baseScores.communication + weight);
          break;
      }
    });

    return baseScores;
  }
}

export const eqService = new EqService();
