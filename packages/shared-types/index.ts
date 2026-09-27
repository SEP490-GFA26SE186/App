// packages/shared-types/index.ts
// Shared types for StoryWeaver platform

export type Role = 'PARENT' | 'SELLER' | 'MODERATOR' | 'ADMIN';

export type StoryStatus = 'DRAFT' | 'GENERATING' | 'COMPLETED' | 'PENDING_REVIEW' | 'REJECTED' | 'PUBLISHED';

export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export type PayoutStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'TRANSFERRED';

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  role: Role;
  kidModePinHash?: string; // 4-digit hashed PIN
  createdAt: string;
  updatedAt: string;
  creditBalance: number; // 💎 Gems
  sellerPendingBalance?: number; // VND held for 7 days
  sellerAvailableBalance?: number; // VND available to withdraw
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
}

export interface ChildProfile {
  id: string;
  parentId: string;
  name: string;
  nickname?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'BOY' | 'GIRL' | string;
  birthDate?: string;
  age: number;
  readingLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | string;
  interests?: string[];
  avatarUrl?: string;
  favoriteTopics?: string[];
  favoriteThemes?: string[];
}

export interface FamilyCharacter {
  id: string;
  parentId?: string;
  userId?: string;
  name: string;
  relationRole?: 'HERO' | 'FATHER' | 'MOTHER' | 'BROTHER' | 'SISTER' | 'GRANDFATHER' | 'GRANDMOTHER' | 'PET' | 'FRIEND' | string;
  role?: string;
  appearanceDescription?: string;
  visualDescription?: string;
  personalityTraits?: string[];
  avatarPlaceholder?: string;
  photoReferenceUrl?: string;
  age?: number;
}

export interface PedagogicalTemplate {
  id: string;
  title: string;
  category?: 'EMOTIONAL_INTELLIGENCE' | 'DAILY_HABITS' | 'MORAL_VALUES' | 'EXPLORATION' | 'FAMILY_LOVE' | string;
  description?: string;
  targetAgeGroup?: '2-4' | '3-6' | '5-7' | '8-10' | string;
  targetAgeMin?: number;
  targetAgeMax?: number;
  eqDimensions?: ('EMPATHY' | 'INDEPENDENCE' | 'PATIENCE' | 'CREATIVITY' | 'COMMUNICATION' | string)[];
  eqGoals?: string[];
  suggestedPagesCount?: number;
  promptGuidance?: string;
  coverIllustration?: string;
  icon?: string;
}

export interface StoryPageBranchChoice {
  id: string;
  label: string;
  targetNextPageNumber?: number;
  nextPageNumber?: number;
  eqSignal?: 'EMPATHY' | 'INDEPENDENCE' | 'PATIENCE' | 'CREATIVITY' | 'COMMUNICATION' | string;
}

export interface StoryPage {
  id?: string;
  pageNumber: number;
  text: string;
  redactedText?: string;
  illustrationUrl: string;
  illustrationPrompt?: string;
  audioNarrationUrl?: string;
  audioDurationSeconds?: number;
  moderatorApproved?: boolean;
  moderatorNotes?: string;
  choices?: StoryPageBranchChoice[];
}

export interface Story {
  id: string;
  creatorId?: string;
  authorId?: string;
  authorName?: string;
  title: string;
  summary?: string;
  coverImageUrl?: string;
  cover?: string;
  targetAgeGroup?: string;
  theme?: string;
  eqTags?: string[];
  pedagogicalTemplateId?: string;
  pedagogicalTemplateTitle?: string;
  status: StoryStatus | 'PENDING_MODERATION' | string;
  isAnonymized?: boolean;
  isMarketplacePublished?: boolean;
  charactersUsed?: {
    characterId: string;
    realName: string;
    placeholderTag: string;
    role: string;
  }[];
  pages: StoryPage[];
  priceCredits?: number;
  priceVnd?: number;
  sellerCommissionRate?: number;
  platformCommissionRate?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  ratingsAvg?: number;
  reviewsCount?: number;
}

export interface RedactionMapping {
  placeholder: string;
  realName: string;
  role: string;
  gender: string;
}

export interface AiGenerationStep {
  step: 'REDACTION' | 'OUTLINE_TEXT' | 'ILLUSTRATIONS' | 'TTS_AUDIO';
  status: 'WAITING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  details: string;
  progressPercent: number;
}

export interface ModerationChecklist {
  storyId: string;
  moderatorId: string;
  allPagesApproved: boolean;
  checklistItems: {
    pageNumber: number;
    noViolentContent: boolean;
    noInappropriateLanguage: boolean;
    noRealPersonalInfoExposed: boolean;
    illustrationChildFriendly: boolean;
    audioCleanAndClear: boolean;
    notes?: string;
  }[];
  overallStatus: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  reviewedAt: string;
}

export interface OrderOwnership {
  id: string;
  accountId: string;
  storyId: string;
  orderStatus: OrderStatus;
  totalVnd: number;
  discountVnd: number;
  voucherCode?: string;
  payosPaymentId?: string;
  payosOrderCode?: number;
  sellerEarningsVnd: number;
  platformFeeVnd: number;
  escrowReleaseAt?: string;
  isEscrowReleased: boolean;
  createdAt: string;
  paidAt?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'CREDIT_PURCHASE' | 'STORY_SALE' | 'STORY_PURCHASE' | 'WITHDRAWAL' | 'ESCROW_RELEASE' | 'TOPUP' | 'PURCHASE' | string;
  amount?: number;
  amountCredits?: number;
  amountVnd?: number;
  currency?: 'CREDIT' | 'VND' | string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'SUCCESS' | string;
  description: string;
  idempotencyKey?: string;
  createdAt: string;
  availableAfterDate?: string;
}

export interface EqReport {
  childId: string;
  childName: string;
  period: string; // "Tháng này"
  totalStoriesRead: number;
  totalListeningMinutes: number;
  radarScores: {
    empathy: number; // Đồng cảm (0-100)
    independence: number; // Tự lập (0-100)
    patience: number; // Kiên nhẫn (0-100)
    creativity: number; // Sáng tạo (0-100)
    communication: number; // Giao tiếp (0-100)
  };
  skillSignals: {
    id: string;
    skill: string;
    storyTitle: string;
    verifiedByParent: boolean;
    timestamp: string;
  }[];
}
