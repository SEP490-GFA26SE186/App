// src/utils/mockData.ts
// Mock data dùng khi BE chưa implement các module tương ứng
// Khi BE implement xong thì fetch từ BE và replace data này

import {
  ChildProfile,
  FamilyCharacter,
  PedagogicalTemplate,
  Story,
  WalletTransaction,
} from '../../packages/shared-types';

// ─── Children ──────────────────────────────────────────────────────────────

export const MOCK_CHILDREN: ChildProfile[] = [
  {
    id: 'ch_01',
    parentId: 'usr_parent_01',
    name: 'Bé Bo (Gia Bảo)',
    nickname: 'Bo Bo',
    gender: 'MALE',
    birthDate: '2021-04-12',
    age: 4,
    readingLevel: 'BEGINNER',
    interests: ['Khủng long', 'Ô tô cảnh sát', 'Vẽ tranh'],
    avatarUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150&auto=format&fit=crop&q=80',
    favoriteTopics: ['Lòng dũng cảm', 'Chia sẻ cùng bạn'],
  },
  {
    id: 'ch_02',
    parentId: 'usr_parent_01',
    name: 'Bé Miu (Ngọc Mai)',
    nickname: 'Miu Miu',
    gender: 'FEMALE',
    birthDate: '2019-08-20',
    age: 6,
    readingLevel: 'INTERMEDIATE',
    interests: ['Mèo con', 'Khu vườn cổ tích', 'Đố vui'],
    avatarUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=150&auto=format&fit=crop&q=80',
    favoriteTopics: ['Kiên nhẫn', 'Sáng tạo'],
  },
];

// ─── Family Characters ─────────────────────────────────────────────────────

export const MOCK_CHARACTERS: FamilyCharacter[] = [
  {
    id: 'char_01',
    parentId: 'usr_parent_01',
    name: 'Bé Bo',
    relationRole: 'HERO',
    appearanceDescription: 'Cậu bé 4 tuổi, mắt to tròn lém lỉnh, tóc xoăn ngắn, hay mặc áo thun khủng long xanh lá',
    personalityTraits: ['Hiếu động', 'Ham học hỏi', 'Thỉnh thoảng sợ bóng tối'],
    avatarPlaceholder: '👦',
  },
  {
    id: 'char_02',
    parentId: 'usr_parent_01',
    name: 'Bố Tuấn',
    relationRole: 'FATHER',
    appearanceDescription: 'Người đàn ông trẻ trung, hay cười, mang kính gọng tròn và thích kể chuyện cổ tích trước khi ngủ',
    personalityTraits: ['Hài hước', 'Kiên nhẫn', 'Yêu con'],
    avatarPlaceholder: '👨',
  },
  {
    id: 'char_03',
    parentId: 'usr_parent_01',
    name: 'Mẹ Lan',
    relationRole: 'MOTHER',
    appearanceDescription: 'Người phụ nữ dịu dàng, tóc dài, hay mặc áo dài hoa và nấu ăn rất ngon',
    personalityTraits: ['Dịu dàng', 'Chu đáo', 'Giỏi nấu ăn'],
    avatarPlaceholder: '👩',
  },
];

// ─── Pedagogical Templates ─────────────────────────────────────────────────

export const MOCK_TEMPLATES: PedagogicalTemplate[] = [
  {
    id: 'tpl_01',
    title: 'Bé Học Chia Sẻ',
    category: 'EMOTIONAL_INTELLIGENCE',
    description: 'Câu chuyện về việc học cách chia sẻ đồ chơi và niềm vui với bạn bè',
    targetAgeGroup: '3-6',
    eqDimensions: ['EMPATHY'],
    suggestedPagesCount: 5,
    icon: '🤝',
  },
  {
    id: 'tpl_02',
    title: 'Dũng Cảm Vượt Khó',
    category: 'EMOTIONAL_INTELLIGENCE',
    description: 'Học cách đối mặt với nỗi sợ hãi và vượt qua thử thách',
    targetAgeGroup: '4-7',
    eqDimensions: ['INDEPENDENCE'],
    suggestedPagesCount: 6,
    icon: '🦁',
  },
  {
    id: 'tpl_03',
    title: 'Bé Biết Kiên Nhẫn',
    category: 'DAILY_HABITS',
    description: 'Câu chuyện rèn luyện tính kiên nhẫn trong cuộc sống hàng ngày',
    targetAgeGroup: '3-6',
    eqDimensions: ['PATIENCE'],
    suggestedPagesCount: 5,
    icon: '⏳',
  },
  {
    id: 'tpl_04',
    title: 'Sáng Tạo Cùng Bạn',
    category: 'EXPLORATION',
    description: 'Khám phá thế giới xung quanh và phát huy trí tưởng tượng',
    targetAgeGroup: '5-8',
    eqDimensions: ['CREATIVITY'],
    suggestedPagesCount: 7,
    icon: '🎨',
  },
  {
    id: 'tpl_05',
    title: 'Yêu Thương Gia Đình',
    category: 'FAMILY_LOVE',
    description: 'Câu chuyện về tình yêu thương và sự gắn kết trong gia đình',
    targetAgeGroup: '2-4',
    eqDimensions: ['EMPATHY', 'COMMUNICATION'],
    suggestedPagesCount: 4,
    icon: '❤️',
  },
];

// ─── Stories ───────────────────────────────────────────────────────────────

export const MOCK_STORIES: Story[] = [
  {
    id: 'st_01',
    creatorId: 'usr_seller_01',
    title: 'Bé Bo Và Chú Khủng Long Xanh',
    summary: 'Cuộc phiêu lưu kỳ diệu của bé Bo cùng người bạn khủng long xanh trong khu rừng thần kỳ.',
    coverImageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80',
    targetAgeGroup: '3-6',
    theme: 'Lòng dũng cảm & Tình bạn',
    status: 'PUBLISHED',
    isAnonymized: true,
    priceCredits: 0,
    priceVnd: 49000,
    sellerCommissionRate: 0.7,
    platformCommissionRate: 0.3,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    ratingsAvg: 4.9,
    reviewsCount: 127,
    charactersUsed: [],
    pages: [
      {
        id: 'p_01',
        pageNumber: 1,
        text: 'Một buổi sáng trong vắt, bé Bo phát hiện một chú khủng long xanh nhỏ xíu đang khóc dưới gốc cây táo.',
        illustrationUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
      {
        id: 'p_02',
        pageNumber: 2,
        text: '"Đừng khóc nữa!" bé Bo ân cần nói và đưa tay ra. "Mình sẽ là bạn của bạn!"',
        illustrationUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
      {
        id: 'p_03',
        pageNumber: 3,
        text: 'Hai người bạn nhỏ cùng nhau khám phá khu rừng, học được rằng tình bạn thật sự không cần phải giống nhau!',
        illustrationUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
    ],
  },
  {
    id: 'st_02',
    creatorId: 'usr_seller_02',
    title: 'Công Chúa Nhỏ Và Hạt Giống Diệu Kỳ',
    summary: 'Câu chuyện về sự kiên nhẫn chăm sóc và tình yêu thiên nhiên của một cô bé.',
    coverImageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80',
    targetAgeGroup: '4-7',
    theme: 'Kiên nhẫn & Yêu thiên nhiên',
    status: 'PUBLISHED',
    isAnonymized: true,
    priceCredits: 2,
    priceVnd: 0,
    sellerCommissionRate: 0.7,
    platformCommissionRate: 0.3,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    ratingsAvg: 5.0,
    reviewsCount: 89,
    charactersUsed: [],
    pages: [
      {
        id: 'p_11',
        pageNumber: 1,
        text: 'Công chúa Lily nhận được từ bà ngoại một hạt giống kỳ lạ phát sáng màu tím huyền bí.',
        illustrationUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
    ],
  },
];

// ─── Wallet Transactions ───────────────────────────────────────────────────

export const MOCK_WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx_01',
    userId: 'usr_parent_01',
    type: 'TOPUP',
    amountCredits: 50,
    amountVnd: 50000,
    description: 'Nạp 50 💎 Gem',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: 'COMPLETED',
  },
  {
    id: 'tx_02',
    userId: 'usr_parent_01',
    type: 'SPEND',
    amountCredits: -3,
    description: 'Tạo truyện AI: Bé Bo Và Chú Khủng Long',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'COMPLETED',
  },
];
