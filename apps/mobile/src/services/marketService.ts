// apps/mobile/src/services/marketService.ts
// GĐ D2 – Chợ truyện (BE market.routes.js, reviews.routes.js reviewsRouter, monitoring.routes.js reportRouter; đều gắn ở /market).
// Mua truyện trả { order, checkoutUrl } như mua gói (D1): 0đ giao ngay, checkoutUrl null.
import { apiFetch, invalidResponseError } from './apiClient';
import type { CheckoutResultDto } from '../types/api';
import type { ListingDetailDto, ListingQuery, ListingsPageDto, OwnedListingDto, ReportBody, ReviewBody, ReviewDto, ReviewsDto, SellerProfileDto } from '../types/market';

const id = (v: string) => encodeURIComponent(v);
const post = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) });

/** Bỏ tham số rỗng (Web getListings lọc "" và null) */
export const listingQueryString = (q: ListingQuery): string =>
  Object.entries(q)
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

export const marketService = {
  /** GET /market/listings?search&competency&age&priceMin&priceMax&narration&sort&page&limit → { items, pagination } */
  listListings: async (q: ListingQuery = {}): Promise<ListingsPageDto> => {
    const qs = listingQueryString(q);
    const data = await apiFetch<Partial<ListingsPageDto>>(`/market/listings${qs ? `?${qs}` : ''}`);
    if (!Array.isArray(data?.items) || !data.pagination) throw invalidResponseError('chợ truyện');
    return { items: data.items, pagination: data.pagination };
  },

  /** GET /market/listings/:id → { listing } (+ preview, isMine) */
  getListing: async (listingId: string): Promise<ListingDetailDto> => {
    const data = await apiFetch<{ listing?: ListingDetailDto }>(`/market/listings/${id(listingId)}`);
    if (!data?.listing?.id) throw invalidResponseError('chi tiết truyện đang bán');
    return data.listing;
  },

  /** GET /market/sellers/:sellerId → { seller, items } */
  getSellerProfile: async (sellerId: string): Promise<SellerProfileDto> => {
    const data = await apiFetch<Partial<SellerProfileDto>>(`/market/sellers/${id(sellerId)}`);
    if (!data?.seller?.id || !Array.isArray(data.items)) throw invalidResponseError('hồ sơ người bán');
    return { seller: data.seller, items: data.items };
  },

  /** GET /market/owned (phụ huynh) → { items } truyện đã có quyền đọc */
  listOwned: async (): Promise<OwnedListingDto[]> => {
    const data = await apiFetch<{ items?: OwnedListingDto[] }>('/market/owned');
    if (!Array.isArray(data?.items)) throw invalidResponseError('truyện đã mua');
    return data.items;
  },

  /** POST /market/checkout { listingId } → 201 { order, checkoutUrl } (null với truyện 0đ) */
  checkoutListing: async (listingId: string): Promise<CheckoutResultDto> => {
    const data = await apiFetch<Partial<CheckoutResultDto>>('/market/checkout', post({ listingId }));
    if (!data?.order?.id || (data.checkoutUrl !== null && typeof data.checkoutUrl !== 'string')) throw invalidResponseError('đơn mua truyện');
    return { order: data.order, checkoutUrl: data.checkoutUrl };
  },

  /** GET /market/listings/:id/reviews?page → { reviews, distribution, myReview, canReview, reason, isSeller, tags, pagination } */
  getReviews: async (listingId: string, page = 1): Promise<ReviewsDto> => {
    const data = await apiFetch<Partial<ReviewsDto>>(`/market/listings/${id(listingId)}/reviews?page=${page}`);
    if (!Array.isArray(data?.reviews) || !data.distribution || typeof data.canReview !== 'boolean') throw invalidResponseError('đánh giá');
    return data as ReviewsDto;
  },

  /** PUT /market/listings/:id/review { rating, comment?, tags } → { review, created } */
  saveReview: async (listingId: string, body: ReviewBody): Promise<{ review: ReviewDto; created: boolean }> => {
    const data = await apiFetch<{ review?: ReviewDto; created?: boolean }>(`/market/listings/${id(listingId)}/review`, { method: 'PUT', body: JSON.stringify(body) });
    if (!data?.review?.id) throw invalidResponseError('đánh giá');
    return { review: data.review, created: !!data.created };
  },

  /** Người bán trả lời đánh giá (một lần): POST /market/reviews/:id/reply { reply } (2–1000 ký tự) → { review } */
  replyReview: async (reviewId: string, reply: string): Promise<ReviewDto> => {
    const data = await apiFetch<{ review?: ReviewDto }>(`/market/reviews/${id(reviewId)}/reply`, post({ reply: reply.trim() }));
    if (!data?.review?.id) throw invalidResponseError('trả lời đánh giá');
    return data.review;
  },

  /** POST /market/listings/:id/reports { category, description? } → 201 { reportId, suspended } */
  reportListing: async (listingId: string, body: ReportBody): Promise<{ reportId: string; suspended: boolean }> => {
    const data = await apiFetch<{ reportId?: string; suspended?: boolean }>(`/market/listings/${id(listingId)}/reports`, post(body));
    if (!data?.reportId) throw invalidResponseError('báo cáo');
    return { reportId: data.reportId, suspended: !!data.suspended };
  },

  /** POST /market/reviews/:id/reports { category, description? } → 201 { reportId } */
  reportReview: async (reviewId: string, body: ReportBody): Promise<{ reportId: string }> => {
    const data = await apiFetch<{ reportId?: string }>(`/market/reviews/${id(reviewId)}/reports`, post(body));
    if (!data?.reportId) throw invalidResponseError('báo cáo');
    return { reportId: data.reportId };
  },
};
