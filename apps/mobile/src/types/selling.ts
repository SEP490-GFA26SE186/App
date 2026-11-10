// apps/mobile/src/types/selling.ts
// GĐ D3 – Bán truyện. Khớp BE publishing.service.js (formatSeller, formatListing), withdrawals.service.js (getEarnings,
// formatWithdrawal), monitoring.service.js (listMyStrikes).
import type { NarrationDto } from './api';
import type { StrikeSource } from './management';

export type SellerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface SellerProfileMeDto {
  userId: string;
  displayName: string;
  bio: string | null;
  expertise: string | null;
  status: SellerStatus;
  reviewedAt: string | null;
  createdAt: string;
}

export interface MySellerDto {
  seller: SellerProfileMeDto | null;
  planCanSell: boolean;
}

export interface SellerFields {
  displayName: string;
  bio?: string;
  expertise?: string;
}

export interface MyListingDto {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priceVnd: number;
  hasAiContent: boolean;
  hasNarration: boolean;
  cover?: { imageUrl?: string | null; competency?: string | null } | null;
  publishedStoryId: string;
  sourceStoryId: string | null;
  previousListingId: string | null;
  submittedAt: string | null;
  publishedAt: string | null;
  lastDecision: { decision: string; comment: string | null; decidedAt: string } | null;
  narration: NarrationDto | null;
}

export interface ListingBody {
  storyId?: string;
  title: string;
  description?: string;
  priceVnd: number;
  aliases: { token: string; aliasName: string }[];
}

export interface BankDto {
  bankBin: string;
  bankName: string;
  /** BE đã che (chỉ vài số cuối) */
  accountNumber: string;
  accountHolder: string;
  updatedAt: string | null;
}

export interface BankBody {
  bankBin: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export type WithdrawalStatus = 'requested' | 'processing' | 'paid' | 'rejected' | 'cancelled';

export interface WithdrawalDto {
  id: string;
  amountVnd: number;
  status: WithdrawalStatus;
  bank: { bankName?: string; accountNumber?: string; accountHolder?: string };
  rejectReason: string | null;
  handledAt: string | null;
  createdAt: string;
}

export interface EarningsDto {
  balance: { pendingVnd: number; availableVnd: number; lockedVnd: number };
  sellerShareRate: number;
  holdDays: number;
  minWithdrawalVnd: number;
  bank: BankDto | null;
  withdrawals: WithdrawalDto[];
  ledger: { entryType: string; amountVnd: number; availableAt: string | null; createdAt: string }[];
}

export interface MyStrikeDto {
  id: string;
  source: StrikeSource;
  sourceId: string | null;
  reason: string;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  active: boolean;
  appeal: { id: string; reason: string; status: string; createdAt: string; decidedAt: string | null; decisionNote: string | null; decider: string | null } | null;
}

export interface MyStrikesDto {
  sellerStatus: SellerStatus | null;
  strikeLimit: number;
  activeStrikes: number;
  strikes: MyStrikeDto[];
}
