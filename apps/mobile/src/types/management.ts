// apps/mobile/src/types/management.ts
// DTO Admin / Chuyên gia sư phạm, đối chiếu BE (BE/api/src/modules/admin, market/withdrawals, monitoring, publishing)
// và cách Web dùng (Web/src/pages/admin/*, Web/src/pages/specialist/*). Chỉ khai báo field màn Mobile dùng.

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---------- Admin ----------

export interface AdminNavBadges {
  withdrawals: number;
  refunds: number;
  appeals: number;
}

export type FinanceRange = 'today' | '7d' | '30d' | '90d' | 'year';

export interface FinanceSeriesPoint {
  day: string;
  plan: number;
  listing: number;
  commission: number;
}

export interface FinanceSummary {
  revenue: {
    grossRevenue: number;
    orders: number;
    refunded: number;
    platformRevenue: number;
    planRevenue: number;
    commission: number;
    sellerPayable: number;
    listingGross: number;
  };
  series: FinanceSeriesPoint[];
  newParents: number;
  activePaidSubscriptions: { plan: string; count: number }[];
  sellerFunds: {
    pendingVnd: number;
    availableVnd: number;
    lockedVnd: number;
    withdrawalsInFlight: { count: number; amountVnd: number };
  };
}

export type AccountRole = 'parent' | 'specialist' | 'admin';

export interface AdminAccount {
  id: string;
  role: AccountRole;
  email: string;
  username: string;
  fullName: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  plan: { name: string; code: string } | null;
  creditBalance: number | null;
  childrenCount: number;
  seller: { displayName: string; status: string } | null;
}

export interface AccountsPage {
  accounts: AdminAccount[];
  pagination: Pagination;
}

export type WithdrawalStatus = 'requested' | 'paid' | 'rejected';

export interface Withdrawal {
  id: string;
  amountVnd: number;
  createdAt: string;
  handledAt?: string | null;
  bankTransactionRef?: string | null;
  rejectReason?: string | null;
  seller: { displayName: string; email: string };
  bank: { bankName: string; accountNumber: string; accountHolder: string | null; bankBin?: string | null };
}

export type RefundStatus = 'pending' | 'approved' | 'rejected';

export interface RefundRequest {
  id: string;
  status: RefundStatus;
  reason: string;
  createdAt: string;
  bankTransactionRef?: string | null;
  decisionNote?: string | null;
  handler?: string | null;
  requester: { fullName: string | null; email: string };
  item: {
    itemType: 'plan' | 'listing' | string;
    title: string;
    unitPriceVnd: number;
    seller?: string | null;
    paidAt: string | null;
    payosOrderCode?: number | null;
  };
  payer?: { accountNumber: string; accountName: string; bankName: string } | null;
  impact?: {
    subscriptionStatus?: string | null;
    creditsUsed?: number;
    sellerEarning?: number;
    earningState?: 'pending' | 'available' | 'none';
  } | null;
}

export type AppealStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type StrikeSource = 'report' | 'rejection' | 'takedown';

export interface StrikeAppeal {
  id: string;
  status: AppealStatus;
  reason: string;
  createdAt: string;
  decisionNote?: string | null;
  decider?: string | null;
  strike: {
    source: StrikeSource;
    reason: string;
    issuedAt: string;
    issuer?: { name: string } | null;
    seller: { displayName: string; status: string };
  };
}

export interface AuditLog {
  id: string;
  action: string;
  createdAt: string;
  actor: { name: string; role: AccountRole };
  beforeState: unknown;
  afterState: unknown;
}

export interface AuditLogsPage {
  prefixes: string[];
  logs: AuditLog[];
  pagination: Pagination;
}

// ---------- Chuyên gia sư phạm (kiểm duyệt) ----------

export type ReviewType = 'submission' | 'report_followup' | 'random_audit';
export type ReviewDecision = 'approved' | 'changes_requested' | 'rejected' | 'taken_down';

export interface QueueItem {
  reviewId: string;
  reviewType: ReviewType;
  listingId: string;
  title: string;
  seller: string;
  priceVnd: number;
  topic: string | null;
  competency: string | null;
  pageCount: number;
  hasAiContent: boolean;
  hasNarration: boolean;
  narration: { complete: boolean; ready: number; total: number } | null;
  listingStatus: string;
  openReports: number;
  submittedAt: string | null;
  createdAt: string;
  claimedBy: { id?: string; name?: string; mine: boolean } | null;
}

export type ContentOrigin = 'ai' | 'ai_edited' | 'human';

export interface ReviewStoryPage {
  id: string;
  pageOrder: number;
  contentText: string | null;
  origin?: ContentOrigin;
}

export interface ReviewCheckpoint {
  afterPageId: string;
  type: string;
  question: string | null;
  answerEmotion?: string | null;
  hint?: string | null;
  origin?: ContentOrigin;
  options?: { id: string; text: string; isCorrect?: boolean; role?: string | null; feedback?: string | null }[];
}

export interface ReviewDetail {
  review: {
    id: string;
    reviewType: ReviewType;
    allowedDecisions: ReviewDecision[];
    decision: ReviewDecision | null;
    comment: string | null;
    decidedAt: string | null;
    claimedByMe: boolean;
    claimExpiresAt: string | null;
  };
  listing: { id: string; title: string; status: string; priceVnd: number; description?: string | null; hasAiContent?: boolean; previousListingId?: string | null };
  seller: string;
  story: {
    pages: ReviewStoryPage[];
    checkpoints: ReviewCheckpoint[];
    characters: { token: string; name: string }[];
    topic?: { title?: string | null; competency?: string | null } | null;
  };
  pageViews: { pageId: string; viewedAt: string; comment: string | null }[];
}

export type SellerStatus = 'pending' | 'approved' | 'rejected';

export interface SellerApplication {
  userId: string;
  displayName: string;
  fullName: string | null;
  email: string;
  bio?: string | null;
  expertise?: string | null;
  createdAt: string;
}

export type ReportStatus = 'open' | 'resolved' | 'dismissed' | 'all';

export interface ContentReport {
  id: string;
  category: string;
  description?: string | null;
  status: Exclude<ReportStatus, 'all'>;
  reporter: string;
  pageOrder?: number | null;
  createdAt: string;
  handler?: string | null;
  review?: { id: string; rating: number; comment?: string | null; hidden?: boolean } | null;
}

export interface ReportGroup {
  listing: { id: string; title: string; status: string; sellerId: string; seller: string };
  openReview: { id: string; reviewType: ReviewType } | null;
  reports: ContentReport[];
}

// ---- GĐ E1: giám sát (BE modules/monitoring/monitoring.service.js) ----

export type RestrictedStatus = 'suspended' | 'archived';

/** GET /moderation/listings → listings[] (listRestrictedListings) */
export interface RestrictedListing {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  seller: { id: string; displayName: string; status: string };
  reportsCount: number;
  buyersCount: number;
  review: {
    id: string;
    reviewType: ReviewType;
    decidedAt: string | null;
    decision: ReviewDecision | null;
    comment: string | null;
    moderator: string | null;
  } | null;
}

/** GET /moderation/strikes → strikes[] (formatStrike) */
export interface Strike {
  id: string;
  source: StrikeSource;
  sourceId: string | null;
  reason: string;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  active: boolean;
  issuer: { id: string; name: string } | null;
  seller: { id: string; displayName: string; status: string } | null;
  appeal: {
    id: string;
    reason: string;
    status: AppealStatus;
    createdAt: string;
    decidedAt: string | null;
    decisionNote: string | null;
    decider: string | null;
  } | null;
}

export interface StrikesResult {
  strikeLimit: number;
  strikes: Strike[];
}

/** POST /moderation/strikes → 201 */
export interface IssueStrikeResult {
  strikeId: string;
  activeStrikes: number;
  strikeLimit: number;
  sellerSuspended: boolean;
}

/** GET /moderation/audits → audits[] (listAudits) */
export interface RandomAudit {
  reviewId: string;
  createdAt: string;
  decidedAt: string | null;
  decision: ReviewDecision | null;
  comment: string | null;
  moderator: string | null;
  listing: { id: string; title: string; status: string; seller: string };
}

/** POST /moderation/audits/run → 201 */
export interface RunAuditsResult {
  created: number;
  reviewIds: string[];
}

/** GET /moderation/ai-flags → flags[] (listAiFlags) */
export interface AiFlag {
  userId: string;
  fullName: string | null;
  email: string;
  total: number;
  blocked: number;
  failed: number;
  blockedRate: number;
  lastBlocked: { at: string; reason: string | null; storyTitle: string | null } | null;
  aiBlockedUntil: string | null;
}

export interface AiFlagsResult {
  days: number;
  min: number;
  flags: AiFlag[];
}

/** POST /moderation/ai-flags/:userId/block → { userId, aiBlockedUntil } */
export interface AiBlockResult {
  userId: string;
  aiBlockedUntil: string | null;
}
