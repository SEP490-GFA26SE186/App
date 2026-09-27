// apps/api/src/modules/cron/escrow-payout.cron.ts
// BullMQ / Scheduled Cron Job: Chuyển doanh thu treo (pending 7 ngày) -> khả dụng (available)

export interface EscrowReleaseResult {
  releasedOrdersCount: number;
  totalAmountReleased: number;
  sellerIdsAffected: string[];
  executedAt: string;
}

export class EscrowPayoutCron {
  /**
   * Quét và giải toả các khoản doanh thu bán truyện bị giữ 7 ngày
   */
  public executeEscrowRelease(
    pendingOrders: {
      orderId: string;
      sellerId: string;
      sellerEarnings: number;
      escrowReleaseAt: string;
      isEscrowReleased: boolean;
    }[]
  ): {
    ordersToRelease: { orderId: string; sellerId: string; amount: number }[];
    totalReleased: number;
  } {
    const now = new Date();
    const ordersToRelease: { orderId: string; sellerId: string; amount: number }[] = [];
    let totalReleased = 0;

    for (const order of pendingOrders) {
      if (!order.isEscrowReleased) {
        const releaseTime = new Date(order.escrowReleaseAt);
        // Nếu đã qua 7 ngày (hoặc bằng thời điểm hiện tại)
        if (releaseTime <= now) {
          ordersToRelease.push({
            orderId: order.orderId,
            sellerId: order.sellerId,
            amount: order.sellerEarnings,
          });
          totalReleased += order.sellerEarnings;
        }
      }
    }

    return {
      ordersToRelease,
      totalReleased,
    };
  }
}

export const escrowPayoutCron = new EscrowPayoutCron();
