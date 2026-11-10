// apps/mobile/src/services/sellingService.ts
// GĐ D3 – Bán truyện (BE publishing.routes.js sellersRouter + listingsRouter, withdrawals.routes.js sellerMoneyRouter,
// monitoring.routes.js sellerStrikesRouter). Lỗi 422 kèm errors[{ path, message }] (vd. "aliases.{NV1}") giữ trên ApiError.
import { apiFetch, invalidResponseError } from './apiClient';
import type {
  BankBody,
  BankDto,
  EarningsDto,
  ListingBody,
  MyListingDto,
  MySellerDto,
  MyStrikesDto,
  SellerFields,
  SellerProfileMeDto,
  WithdrawalDto,
} from '../types/selling';

const id = (v: string) => encodeURIComponent(v);
const send = (method: 'POST' | 'PUT' | 'DELETE', body?: unknown) => ({ method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

const sellerOf = (data: { seller?: SellerProfileMeDto } | undefined, what: string): SellerProfileMeDto => {
  if (!data?.seller?.status) throw invalidResponseError(what);
  return data.seller;
};
const listingOf = (data: { listing?: MyListingDto } | undefined): MyListingDto => {
  if (!data?.listing?.id) throw invalidResponseError('truyện đăng bán');
  return data.listing;
};
const withdrawalOf = (data: { withdrawal?: WithdrawalDto } | undefined): WithdrawalDto => {
  if (!data?.withdrawal?.id) throw invalidResponseError('yêu cầu rút tiền');
  return data.withdrawal;
};

export const sellingService = {
  /** GET /sellers/me → { seller | null, planCanSell } */
  getMySeller: async (): Promise<MySellerDto> => {
    const data = await apiFetch<Partial<MySellerDto>>('/sellers/me');
    if (!data || data.seller === undefined || typeof data.planCanSell !== 'boolean') throw invalidResponseError('hồ sơ người bán');
    return { seller: data.seller, planCanSell: data.planCanSell };
  },

  /** POST /sellers/apply { displayName, bio?, expertise? } → 201 { seller } */
  applySeller: async (body: SellerFields): Promise<SellerProfileMeDto> =>
    sellerOf(await apiFetch<{ seller?: SellerProfileMeDto }>('/sellers/apply', send('POST', body)), 'hồ sơ người bán'),

  /** PUT /sellers/me { displayName?, bio?, expertise? } (chuỗi rỗng = xoá) → { seller } */
  updateMySeller: async (body: Partial<SellerFields>): Promise<SellerProfileMeDto> =>
    sellerOf(await apiFetch<{ seller?: SellerProfileMeDto }>('/sellers/me', send('PUT', body)), 'hồ sơ người bán'),

  /** GET /listings/mine → { listings } */
  getMyListings: async (): Promise<MyListingDto[]> => {
    const data = await apiFetch<{ listings?: MyListingDto[] }>('/listings/mine');
    if (!Array.isArray(data?.listings)) throw invalidResponseError('truyện đã đăng bán');
    return data.listings;
  },

  /** POST /listings { storyId, title, description?, priceVnd, aliases } → 201 { listing } */
  createListing: async (body: ListingBody): Promise<MyListingDto> => listingOf(await apiFetch<{ listing?: MyListingDto }>('/listings', send('POST', body))),

  /** POST /listings/:listingId/versions { storyId?, title, description?, priceVnd, aliases } → 201 { listing } */
  createListingVersion: async (listingId: string, body: ListingBody): Promise<MyListingDto> =>
    listingOf(await apiFetch<{ listing?: MyListingDto }>(`/listings/${id(listingId)}/versions`, send('POST', body))),

  /** GET /sellers/me/earnings */
  getEarnings: async (): Promise<EarningsDto> => {
    const data = await apiFetch<Partial<EarningsDto>>('/sellers/me/earnings');
    if (!data?.balance || !Array.isArray(data.withdrawals) || typeof data.minWithdrawalVnd !== 'number') throw invalidResponseError('doanh thu');
    return data as EarningsDto;
  },

  /** PUT /sellers/me/bank { bankBin, bankName, accountNumber, accountHolder } → { bank } (số TK đã che) */
  updateBank: async (body: BankBody): Promise<BankDto> => {
    const data = await apiFetch<{ bank?: BankDto }>('/sellers/me/bank', send('PUT', body));
    if (!data?.bank?.bankBin) throw invalidResponseError('tài khoản ngân hàng');
    return data.bank;
  },

  /** POST /sellers/me/withdrawals { amountVnd } → 201 { withdrawal } */
  requestWithdrawal: async (amountVnd: number): Promise<WithdrawalDto> =>
    withdrawalOf(await apiFetch<{ withdrawal?: WithdrawalDto }>('/sellers/me/withdrawals', send('POST', { amountVnd }))),

  /** DELETE /sellers/me/withdrawals/:id (chỉ khi `requested`) → { withdrawal } */
  cancelWithdrawal: async (withdrawalId: string): Promise<WithdrawalDto> =>
    withdrawalOf(await apiFetch<{ withdrawal?: WithdrawalDto }>(`/sellers/me/withdrawals/${id(withdrawalId)}`, send('DELETE'))),

  /** GET /sellers/me/strikes → { sellerStatus, strikeLimit, activeStrikes, strikes } */
  getMyStrikes: async (): Promise<MyStrikesDto> => {
    const data = await apiFetch<Partial<MyStrikesDto>>('/sellers/me/strikes');
    if (!Array.isArray(data?.strikes) || typeof data.strikeLimit !== 'number') throw invalidResponseError('cảnh cáo');
    return data as MyStrikesDto;
  },

  /** POST /sellers/me/strikes/:id/appeal { reason } (20–2000 ký tự) → 201 { appealId, status } */
  appealStrike: async (strikeId: string, reason: string): Promise<{ appealId: string; status: string }> => {
    const data = await apiFetch<{ appealId?: string; status?: string }>(`/sellers/me/strikes/${id(strikeId)}/appeal`, send('POST', { reason: reason.trim() }));
    if (!data?.appealId) throw invalidResponseError('kháng nghị');
    return { appealId: data.appealId, status: data.status ?? 'pending' };
  },
};
