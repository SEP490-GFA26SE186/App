// apps/api/src/modules/payment/payos.service.ts
// PayOS checkout link creation & webhook handler with Idempotency Key protection

export interface PayOsWebhookPayload {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  signature: string;
}

export class PayOsService {
  // Idempotency cache (Redis simulator) to prevent double processing
  private processedIdempotencyKeys = new Set<string>();

  /**
   * Tạo link thanh toán PayOS mô phỏng
   */
  public createPaymentLink(params: {
    orderCode: number;
    amount: number;
    description: string;
    buyerName: string;
    buyerEmail: string;
  }) {
    const paymentUrl = `https://pay.payos.vn/web/${params.orderCode}?token=simulated_token`;
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PAYOS_${params.orderCode}_${params.amount}`;

    return {
      orderCode: params.orderCode,
      amount: params.amount,
      description: params.description,
      checkoutUrl: paymentUrl,
      qrCode,
      status: 'PENDING',
    };
  }

  /**
   * Xử lý webhook PayOS với kiểm tra Idempotency Key nghiêm ngặt
   */
  public processWebhook(
    payload: PayOsWebhookPayload,
    idempotencyKey: string
  ): {
    success: boolean;
    alreadyProcessed: boolean;
    message: string;
    sellerEarnings?: number;
    platformFee?: number;
    escrowReleaseDate?: string;
  } {
    // 1. Kiểm tra Idempotency key
    if (this.processedIdempotencyKeys.has(idempotencyKey)) {
      return {
        success: true,
        alreadyProcessed: true,
        message: 'Giao dịch đã được xử lý trước đó (Idempotent duplicate check triggered).',
      };
    }

    if (payload.code !== '00') {
      return {
        success: false,
        alreadyProcessed: false,
        message: `Thanh toán không thành công: mã lỗi ${payload.code} - ${payload.desc}`,
      };
    }

    // 2. Tính toán chia sẻ doanh thu 70/30
    const sellerEarnings = Math.round(payload.amount * 0.7);
    const platformFee = payload.amount - sellerEarnings;

    // 3. Thời hạn giải toả số dư treo: 7 ngày (7 * 24 * 60 * 60 * 1000)
    const escrowReleaseDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 4. Lưu idempotency key
    this.processedIdempotencyKeys.add(idempotencyKey);

    return {
      success: true,
      alreadyProcessed: false,
      message: 'Xác thực webhook PayOS thành công, đã cộng quyền sở hữu và treo doanh thu 7 ngày.',
      sellerEarnings,
      platformFee,
      escrowReleaseDate,
    };
  }
}

export const payOsService = new PayOsService();
