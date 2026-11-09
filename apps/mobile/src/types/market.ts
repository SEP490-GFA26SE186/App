// apps/mobile/src/types/market.ts
// GĐ D2 – Chợ truyện. Khớp BE market.service.js (formatCard, getListing, getSellerProfile, listOwned)
// và reviews.service.js (listReviews, upsertReview).
import type { PaginationDto } from './api';

export interface ListingCardDto {
  id: string;
  title: string;
  description: string | null;
  topic: { title: string; competency: string; ageMin: number; ageMax: number } | null;
  cover?: { imageUrl?: string | null; competency?: string | null } | null;
  totalPages: number;
  checkpointCount: number;
  /** 0 = miễn phí */
  priceVnd: number;
  seller: { id: string; displayName: string; ratingAvg: number | null; totalSales: number };
  purchaseCount: number;
  ratingAvg: number;
  ratingCount: number;
  hasAiContent: boolean;
  hasNarration: boolean;
  publishedAt: string;
  publishedStoryId: string;
  owned: boolean;
}

export interface ListingDetailDto extends ListingCardDto {
  /** Chữ trang 1 (tên nhân vật chung), null nếu chưa có */
  preview: string | null;
  isMine: boolean;
}

export interface ListingsPageDto {
  items: ListingCardDto[];
  pagination: PaginationDto;
}

export interface OwnedListingDto extends ListingCardDto {
  grantedAt: string;
}

export interface SellerProfileDto {
  seller: {
    id: string;
    displayName: string;
    bio: string | null;
    expertise: string | null;
    totalSales: number;
    ratingAvg: number | null;
    ratingCount: number;
    listingCount: number;
    sellingSince: string;
  };
  items: ListingCardDto[];
}

export type ListingCompetency = 'all' | 'self_awareness' | 'self_management' | 'social_awareness' | 'relationship_skills' | 'responsible_decision_making';
export type ListingSort = 'best_selling' | 'newest' | 'rating' | 'price_asc';
export type ListingNarration = 'all' | 'with' | 'without';

/** Query GET /market/listings (market.validation.js list) */
export interface ListingQuery {
  search?: string;
  competency?: ListingCompetency;
  age?: string;
  priceMin?: number;
  priceMax?: number;
  narration?: ListingNarration;
  sort?: ListingSort;
  page?: number;
  limit?: number;
}

export type ReviewTag = 'child_liked' | 'age_appropriate' | 'clear_lesson' | 'good_narration';

export interface ReviewDto {
  id: string;
  rating: number;
  comment: string | null;
  tags: ReviewTag[];
  author: string;
  mine: boolean;
  sellerReply: string | null;
  sellerRepliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsDto {
  reviews: ReviewDto[];
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
  pagination: PaginationDto;
  myReview: (ReviewDto & { hidden: boolean }) | null;
  canReview: boolean;
  reason: 'not_owned' | 'not_finished' | null;
  isSeller: boolean;
  tags: ReviewTag[];
}

export interface ReviewBody {
  rating: number;
  comment?: string;
  tags: ReviewTag[];
}

export interface ReportBody {
  category: string;
  description?: string;
}
